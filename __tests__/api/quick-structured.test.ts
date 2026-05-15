/**
 * Integration tests for POST /api/arguments/quick-structured.
 *
 * Verifies the structured-argument write surface contracts that
 * differentiate it from `/api/arguments/quick`:
 *   • mints conclusion + N premise Claims, creates Argument +
 *     ArgumentPremise[] + ArgumentSchemeInstance in one round-trip
 *   • MCP-bearer callers get authorKind:"AI" + aiProvenance.tool flag
 *   • omitted schemeKey triggers server-side inference + a
 *     `scheme_inferred` warning
 *   • unknown schemeKey returns 400 with a `list_schemes` hint
 *   • duplicate premise text collapses to one Claim and emits a
 *     `premise_deduped` warning
 *   • required-slot schemes never throw — they emit `missing_slot`
 *     warnings instead (OQ3)
 *   • provenance enrichment is kicked off and surfaces
 *     provenancePending + retryAfterMs
 */

import { NextRequest } from "next/server";

// ─── Mocks ───────────────────────────────────────────────────────────────────

const prismaMock: any = {
  deliberation: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
  argumentScheme: { findUnique: jest.fn() },
  claim: { upsert: jest.fn() },
  claimEvidence: { createMany: jest.fn(), findMany: jest.fn() },
  argument: { create: jest.fn() },
  argumentPremise: { createMany: jest.fn() },
  argumentSchemeInstance: { create: jest.fn() },
  argumentSupport: { findFirst: jest.fn(), create: jest.fn(), updateMany: jest.fn() },
  $transaction: jest.fn(async (fn: any) => fn(prismaMock)),
};

jest.mock("@/lib/prismaclient", () => ({ prisma: prismaMock }));

const resolveCitationCallerUserIdMock = jest.fn();
const isMcpBearerMock = jest.fn();
jest.mock("@/lib/citation/mcpAuth", () => ({
  resolveCitationCallerUserId: (...a: any[]) => resolveCitationCallerUserIdMock(...a),
  isMcpBearer: (...a: any[]) => isMcpBearerMock(...a),
}));

jest.mock("@/lib/ids/mintMoid", () => ({
  // Deterministic MOID: prefix + lowercased trimmed text → easy collisions in tests.
  mintClaimMoid: (text: string) => `moid_${text.trim().toLowerCase()}`,
}));

const getOrCreatePermalinkMock = jest.fn(async () => ({
  shortCode: "ABC123",
  slug: "abc123-slug",
}));
jest.mock("@/lib/citations/permalinkService", () => ({
  getOrCreatePermalink: (...a: any[]) => getOrCreatePermalinkMock(...a),
}));

jest.mock("@/lib/unfurl", () => ({
  isSafePublicUrl: () => true,
  getOrFetchLinkPreview: jest.fn(async () => ({ title: "Unfurled Title" })),
}));

const enrichEvidenceProvenanceInBackgroundMock = jest.fn();
jest.mock("@/lib/citations/evidenceProvenance", () => ({
  enrichEvidenceProvenanceInBackground: (...a: any[]) =>
    enrichEvidenceProvenanceInBackgroundMock(...a),
}));

const inferAndAssignSchemeMock = jest.fn();
jest.mock("@/lib/argumentation/schemeInference", () => ({
  inferAndAssignScheme: (...a: any[]) => inferAndAssignSchemeMock(...a),
}));

jest.mock("@/lib/arguments/ensure-support", () => ({
  ensureArgumentSupportInTx: jest.fn(async () => undefined),
}));

jest.mock("@/lib/arguments/detect-composition", () => ({
  markArgumentAsComposedInTx: jest.fn(async () => undefined),
}));

// Upstash rate-limit + redis: always allow.
jest.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static fixedWindow() {
      return null;
    }
    constructor(_: any) {}
    async limit(_: string) {
      return { success: true };
    }
  },
}));
jest.mock("@upstash/redis", () => ({
  Redis: class {
    constructor(_: any) {}
  },
}));

// ─── Import under test (after mocks) ────────────────────────────────────────
import { POST } from "@/app/api/arguments/quick-structured/route";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/arguments/quick-structured", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();

  // Auth defaults: MCP-bearer caller.
  resolveCitationCallerUserIdMock.mockResolvedValue("mcp-bot");
  isMcpBearerMock.mockReturnValue(true);

  // "My Arguments" deliberation lookup → already exists.
  prismaMock.deliberation.findFirst.mockResolvedValue({ id: "delib-my-args" });

  // Default claim upsert: echo input.
  prismaMock.claim.upsert.mockImplementation(async ({ where, create }: any) => ({
    id: `claim_${where.moid}`,
    text: create?.text ?? where.moid,
    moid: where.moid,
  }));

  // Argument creation echoes inputs.
  prismaMock.argument.create.mockImplementation(async ({ data }: any) => ({
    id: "arg-1",
    text: data.text ?? "",
    confidence: 0.7,
  }));

  // Scheme instance creation.
  prismaMock.argumentSchemeInstance.create.mockResolvedValue({ id: "asi-1" });

  // Premise + evidence createMany are no-ops.
  prismaMock.argumentPremise.createMany.mockResolvedValue({ count: 0 });
  prismaMock.claimEvidence.createMany.mockResolvedValue({ count: 0 });
  prismaMock.claimEvidence.findMany.mockResolvedValue([]);
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("POST /api/arguments/quick-structured", () => {
  it("401s when unauthenticated", async () => {
    resolveCitationCallerUserIdMock.mockResolvedValueOnce(null);
    const res = await POST(makeReq({ conclusion: "C", premises: [{ text: "P1" }] }));
    expect(res.status).toBe(401);
  });

  it("returns 400 with list_schemes hint on unknown schemeKey", async () => {
    prismaMock.argumentScheme.findUnique.mockResolvedValueOnce(null);
    const res = await POST(
      makeReq({
        conclusion: "C",
        premises: [{ text: "P1" }],
        schemeKey: "made_up_scheme",
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Unknown schemeKey/);
    expect(body.hint).toMatch(/list_schemes/);
    expect(inferAndAssignSchemeMock).not.toHaveBeenCalled();
  });

  it("infers a scheme when schemeKey is omitted and emits scheme_inferred warning", async () => {
    inferAndAssignSchemeMock.mockResolvedValueOnce("scheme-id-x");
    prismaMock.argumentScheme.findUnique.mockResolvedValueOnce({
      id: "scheme-id-x",
      key: "practical_reasoning",
      name: "Practical Reasoning",
      validators: null,
    });

    const res = await POST(
      makeReq({
        conclusion: "Adolescents should not consume regular caffeine",
        premises: [
          { text: "Caffeine disrupts adolescent sleep" },
          { text: "Sleep is critical to neurodevelopment" },
        ],
        reasoning: "Sleep loss in adolescence damages neurodevelopment, so caffeine is bad.",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(inferAndAssignSchemeMock).toHaveBeenCalledTimes(1);
    expect(body.schemeInstance).toEqual({
      id: "asi-1",
      schemeId: "scheme-id-x",
      schemeKey: "practical_reasoning",
      schemeName: "Practical Reasoning",
    });
    expect(body.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "scheme_inferred" }),
      ]),
    );
  });

  it("flags MCP-bearer writes as authorKind:'AI' with the structured-tool provenance tag", async () => {
    inferAndAssignSchemeMock.mockResolvedValueOnce(null);

    await POST(
      makeReq({
        conclusion: "C",
        premises: [{ text: "P1" }, { text: "P2" }],
      }),
    );

    expect(prismaMock.argument.create).toHaveBeenCalledTimes(1);
    const data = prismaMock.argument.create.mock.calls[0][0].data;
    expect(data.authorKind).toBe("AI");
    expect(data.aiProvenance).toEqual(
      expect.objectContaining({
        via: "mcp",
        tool: "propose_structured_argument",
      }),
    );
  });

  it("dedupes premises that hash to the same MOID and emits premise_deduped warning", async () => {
    inferAndAssignSchemeMock.mockResolvedValueOnce(null);

    const res = await POST(
      makeReq({
        conclusion: "C",
        // Two textually identical premises → identical MOIDs → collapse.
        premises: [{ text: "duplicate premise" }, { text: "duplicate premise" }],
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.premises.length).toBe(1);
    expect(body.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "premise_deduped" }),
      ]),
    );
    // Only the deduped set goes into ArgumentPremise.createMany.
    const premiseCreateArgs = prismaMock.argumentPremise.createMany.mock.calls[0][0];
    expect(premiseCreateArgs.data.length).toBe(1);
  });

  it("returns 400 when every premise collapses to the conclusion", async () => {
    inferAndAssignSchemeMock.mockResolvedValueOnce(null);
    const res = await POST(
      makeReq({
        conclusion: "same text",
        premises: [{ text: "same text" }],
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/distinct premise/);
  });

  it("emits missing_slot warnings instead of 500ing when scheme has required slots", async () => {
    // Explicit schemeKey that requires an `expert` slot — server must NOT throw.
    prismaMock.argumentScheme.findUnique
      // First lookup: by key (initial scheme resolution).
      .mockResolvedValueOnce({
        id: "scheme-eo",
        key: "expert_opinion",
        name: "Expert Opinion",
      })
      // Second lookup: by id (collectMissingSlotWarnings reads validators).
      .mockResolvedValueOnce({
        key: "expert_opinion",
        validators: { slots: { expert: { required: true }, proposition: { required: true } } },
      });

    const res = await POST(
      makeReq({
        conclusion: "C",
        premises: [{ text: "P1" }],
        schemeKey: "expert_opinion",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    const codes = (body.warnings ?? []).map((w: any) => w.code);
    expect(codes).toEqual(expect.arrayContaining(["missing_slot"]));
    // Two required slots → at least two missing_slot warnings.
    expect(codes.filter((c: string) => c === "missing_slot").length).toBeGreaterThanOrEqual(2);
  });

  it("kicks off provenance enrichment and surfaces provenancePending + retryAfterMs", async () => {
    inferAndAssignSchemeMock.mockResolvedValueOnce(null);
    prismaMock.claimEvidence.findMany.mockResolvedValueOnce([{ id: "ev-1" }]);

    const res = await POST(
      makeReq({
        conclusion: "C",
        premises: [{ text: "P1" }],
        evidence: [{ url: "https://example.com/paper", quote: "key quote" }],
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(enrichEvidenceProvenanceInBackgroundMock).toHaveBeenCalledWith(["ev-1"]);
    expect(body.provenancePending).toBe(true);
    expect(body.retryAfterMs).toBe(60_000);
  });

  it("creates ArgumentPremise rows for each deduped premise and marks the argument composed", async () => {
    inferAndAssignSchemeMock.mockResolvedValueOnce(null);
    const { markArgumentAsComposedInTx } = require("@/lib/arguments/detect-composition");
    const { ensureArgumentSupportInTx } = require("@/lib/arguments/ensure-support");

    await POST(
      makeReq({
        conclusion: "C",
        premises: [{ text: "P1" }, { text: "P2", isAxiom: true }],
      }),
    );

    expect(ensureArgumentSupportInTx).toHaveBeenCalledTimes(1);
    expect(markArgumentAsComposedInTx).toHaveBeenCalledTimes(1);
    const premiseRows = prismaMock.argumentPremise.createMany.mock.calls[0][0].data;
    expect(premiseRows.length).toBe(2);
    expect(premiseRows[1].isAxiom).toBe(true);
  });
});
