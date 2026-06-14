/**
 * Regression test for Phase 0.1 (PA_NODE_PREFERENCE_INTEGRATION_ROADMAP §3 / issue E).
 *
 * `importAifJSONLD` previously wrote `preferredKind`/`dispreferredKind` into
 * `preferenceApplication.create`, but those columns do not exist on the
 * Prisma model — so PA import threw against real Prisma. This test feeds a
 * minimal PA graph (matching `lib/aif/export.ts`'s node/edge shape) and asserts
 * the create payload is schema-valid: correct preferred/dispreferred *Id fields,
 * and NO phantom `*Kind` fields.
 *
 * The DB is mocked (jest.setup.ts stubs the real client), so this guards the
 * create-payload shape rather than a live round-trip.
 */
import { describe, test, expect, beforeEach } from "@jest/globals";

const mockCreatePA = jest.fn(async (_args: any) => ({ id: "pa-1" }));
const mockCreateClaim = jest.fn(async ({ data }: any) => ({
  id: data.text === "Claim One" ? "id-c1" : "id-c2",
}));

jest.mock("@/lib/prismaclient", () => ({
  prisma: {
    claim: { create: (a: any) => mockCreateClaim(a) },
    argument: {
      create: jest.fn(async () => ({ id: "arg-1" })),
      findFirst: jest.fn(async () => null),
    },
    argumentPremise: { create: jest.fn(), createMany: jest.fn() },
    argumentEdge: { create: jest.fn() },
    preferenceScheme: { findFirst: jest.fn(async () => null) },
    preferenceApplication: { create: (a: any) => mockCreatePA(a) },
  },
}));

import { importAifJSONLD } from "@/lib/aif/import";

// Minimal AIF graph: claim c1 preferred over claim c2, one PA node.
// Edge directions mirror lib/aif/export.ts: preferred -> PA -> dispreferred.
const graph = {
  nodes: [
    { "@id": "I:c1", "@type": "aif:InformationNode", text: "Claim One" },
    { "@id": "I:c2", "@type": "aif:InformationNode", text: "Claim Two" },
    { "@id": "PA:p1", "@type": "aif:PA" },
  ],
  edges: [
    { "@type": "aif:Edge", role: "aif:PreferredElement", from: "I:c1", to: "PA:p1" },
    { "@type": "aif:Edge", role: "aif:DispreferredElement", from: "PA:p1", to: "I:c2" },
  ],
};

describe("importAifJSONLD — PA node import", () => {
  beforeEach(() => {
    mockCreatePA.mockClear();
    mockCreateClaim.mockClear();
  });

  test("creates a PreferenceApplication without phantom *Kind fields", async () => {
    await expect(importAifJSONLD("delib-1", graph)).resolves.toEqual({ ok: true });

    expect(mockCreatePA).toHaveBeenCalledTimes(1);
    const { data } = mockCreatePA.mock.calls[0][0] as any;

    // Element kind is implied by which *Id is populated.
    expect(data).toMatchObject({
      deliberationId: "delib-1",
      preferredClaimId: "id-c1",
      dispreferredClaimId: "id-c2",
      preferredArgumentId: null,
      dispreferredArgumentId: null,
    });

    // The bug: these columns do not exist on the model.
    expect(data).not.toHaveProperty("preferredKind");
    expect(data).not.toHaveProperty("dispreferredKind");
  });
});
