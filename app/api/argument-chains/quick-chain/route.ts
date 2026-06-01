/**
 * POST /api/argument-chains/quick-chain
 *
 * Chain-creation write surface for the MCP `propose_argument_chain` tool.
 * Mirrors `app/api/arguments/quick-structured/route.ts` for auth (cookie →
 * MCP shared-secret bearer), rate-limiting, and AI-author flagging, and the
 * `app/api/argument-chains/from-prong/route.ts` atomic-transaction pattern for
 * the chain rows (`ArgumentChain` + `ArgumentChainNode[]` + serial
 * `ArgumentChainEdge[]`).
 *
 * See: Development and Ideation Documents/ARCHITECTURE/CHAIN_CREATION_OVER_MCP_SPEC.md
 *
 * Step 1 (this file): **compose** mode — chain *existing* arguments by
 * `argumentId` into the spine (no minting). The chain's worst-link standing is
 * echoed from `lib/deliberation/chainExposure.ts`.
 *
 * Step 2 (next): **mint-and-link** mode — per-link `quick-structured` engine +
 * MOID threading + fork guard. Currently returns 501.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaclient";
import { resolveChainAuthor } from "@/lib/citation/chainAuthor";
import {
  resolveSchemeForWrite,
  verifyAgainstFingerprintPeers,
  type WriteVerifierVerdict,
} from "@/lib/schemes/writeGate";
import { computeChainExposure } from "@/lib/deliberation/chainExposure";
import { mintClaimMoid } from "@/lib/ids/mintMoid";
import { ensureArgumentSupportInTx } from "@/lib/arguments/ensure-support";
import { markArgumentAsComposedInTx } from "@/lib/arguments/detect-composition";
import { inferAndAssignScheme } from "@/lib/argumentation/schemeInference";
import { isSafePublicUrl, getOrFetchLinkPreview } from "@/lib/unfurl";
import { enrichEvidenceProvenanceInBackground } from "@/lib/citations/evidenceProvenance";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";

const NO_STORE = { headers: { "Cache-Control": "no-store" } };
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://isonomia.app";
const MY_ARGUMENTS_HOST_PREFIX = "standalone-my-arguments-";

async function getOrCreateMyArgumentsDeliberation(userId: string): Promise<string> {
  const hostId = `${MY_ARGUMENTS_HOST_PREFIX}${userId}`;
  const existing = await prisma.deliberation.findFirst({
    where: { hostType: "free", hostId },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.deliberation.create({
    data: { hostType: "free", hostId, createdById: userId, title: "My Arguments" },
    select: { id: true },
  });
  return created.id;
}

// ─── Rate limiter ──────────────────────────────────────────────────────────
// Dedicated chain-write budget — a single chain call materialises many rows,
// so it gets its own window rather than draining the per-argument budget.
const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
const ratelimit = new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.fixedWindow(10, "1 h"),
  prefix: "rl:quick_chain",
});

// ─── Input schema ────────────────────────────────────────────────────────────
const strip = (s: string) => s.replace(/<[^>]*>/g, "").trim();

const EvidenceItem = z
  .object({
    url: z.string().url(),
    title: z.string().max(500).optional(),
    quote: z.string().max(2000).optional(),
    summary: z.string().max(2000).optional(),
  })
  .transform((ev) => ({ ...ev, citationText: ev.summary ?? ev.quote }));

type NormalizedEvidence = z.infer<typeof EvidenceItem>;

// mint-and-link: a link is a quick-structured payload. A premise is either an
// ordinary text premise (minted by MOID) or an explicit `reuseClaimId` thread
// onto a prior link's conclusion (Step 3). `reuseClaimId` may carry optional
// `text` as a sanity declaration — if the text's MOID diverges from the
// referenced claim's MOID the chain is rejected (CHAIN_LINK_BROKEN, §4.1).
const OrdinaryPremiseItem = z.object({
  text: z
    .string()
    .min(1, "Premise text is required")
    .max(1000, "Premise must be 1000 characters or fewer")
    .transform(strip),
  isAxiom: z.boolean().optional().default(false),
  premiseType: z.enum(["ordinary", "assumption", "exception"]).optional(),
  evidence: z.array(EvidenceItem).max(5).optional().default([]),
});

const ReusePremiseItem = z.object({
  reuseClaimId: z.string().min(1, "reuseClaimId must be a non-empty claim id"),
  text: z
    .string()
    .max(1000, "Premise must be 1000 characters or fewer")
    .optional()
    .transform((s) => (s ? strip(s) : undefined)),
});

// Reuse variant is tried first: only it carries `reuseClaimId`.
const LinkPremiseItem = z.union([ReusePremiseItem, OrdinaryPremiseItem]);

type ReusePremiseInput = z.infer<typeof ReusePremiseItem>;
type OrdinaryPremiseInput = z.infer<typeof OrdinaryPremiseItem>;
type LinkPremiseInput = z.infer<typeof LinkPremiseItem>;

function isReusePremise(p: LinkPremiseInput): p is ReusePremiseInput {
  return "reuseClaimId" in p;
}

const LinkItem = z.object({
  conclusion: z
    .string()
    .min(1, "Conclusion is required")
    .max(2000, "Conclusion must be 2000 characters or fewer")
    .transform(strip),
  premises: z
    .array(LinkPremiseItem)
    .min(1, "At least one premise is required")
    .max(10, "At most 10 premises allowed"),
  reasoning: z.string().max(5000).optional().transform((s) => s && strip(s)),
  schemeKey: z.string().min(1).max(100).optional(),
  ruleType: z.enum(["STRICT", "DEFEASIBLE"]).optional().default("DEFEASIBLE"),
  implicitWarrant: z.string().max(2000).optional().transform((s) => s && strip(s)),
  epistemicMode: z.enum(["factual", "hypothetical", "counterfactual"]).optional(),
  evidence: z.array(EvidenceItem).max(10).optional().default([]),
});

const QuickChainSchema = z.object({
  name: z
    .string()
    .min(1, "Chain name is required")
    .max(255, "Chain name must be 255 characters or fewer")
    .transform(strip),
  description: z.string().max(5000).optional().transform((s) => s && strip(s)),
  purpose: z.string().max(5000).optional().transform((s) => s && strip(s)),
  deliberationId: z.string().optional(),
  isPublic: z.boolean().optional().default(false),
  mode: z.enum(["mint-and-link", "compose"]).optional().default("mint-and-link"),
  // mint-and-link: 2..12 links forming the serial spine.
  links: z.array(LinkItem).min(2).max(12).optional(),
  // compose: existing arguments in spine order.
  argumentIds: z.array(z.string().min(1)).optional(),
});

type Warning = { code: string; detail: string };
type LinkInput = z.infer<typeof LinkItem>;

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Auth: cookie/Firebase first, then MCP shared-secret bearer. Chain rows FK
  // their owner into User.id (BigInt), so we resolve a numeric owner here.
  const author = await resolveChainAuthor(req);
  if (!author) {
    return NextResponse.json(
      {
        error:
          "Unauthorized — requires a session cookie or MCP bearer token. If using MCP, provision the bot user with scripts/seed-mcp-bot-user.ts.",
      },
      { status: 401, ...NO_STORE },
    );
  }
  const { ownerId, userIdStr, viaMcp } = author;

  // Rate limit.
  const rl = await ratelimit.limit(ownerId.toString());
  const retryAfterMs = Math.max(0, rl.reset - Date.now());
  if (!rl.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded — max 10 chains per hour", retryAfterMs },
      { status: 429, ...NO_STORE },
    );
  }

  // Parse body.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, ...NO_STORE },
    );
  }

  const parsed = QuickChainSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400, ...NO_STORE },
    );
  }

  const {
    name,
    description,
    purpose,
    deliberationId,
    isPublic,
    mode,
    links,
    argumentIds,
  } = parsed.data;

  if (mode === "mint-and-link") {
    return mintAndLinkChain({
      name,
      description: description ?? null,
      purpose: purpose ?? null,
      deliberationId,
      isPublic,
      links: links ?? [],
      ownerId,
      userIdStr,
      viaMcp,
      retryAfterMs,
    });
  }

  // ─── compose mode ──────────────────────────────────────────────────────────
  return composeChain({
    name,
    description: description ?? null,
    purpose: purpose ?? null,
    deliberationId,
    isPublic,
    argumentIds: argumentIds ?? [],
    ownerId,
    viaMcp,
    retryAfterMs,
  });
}

// ─── mint-and-link mode ───────────────────────────────────────────────────────
// Per-link resolution computed pre-transaction (Phase B health gate reused
// verbatim from quick-structured).
interface LinkResolution {
  schemeId: string | null;
  schemeMeta: { id: string; key: string; name: string } | null;
  resolvedEpistemicMode: string | null;
  verifierVerdict: WriteVerifierVerdict | null;
  schemeHealth: "ok" | "canonicalized";
}

async function mintAndLinkChain(opts: {
  name: string;
  description: string | null;
  purpose: string | null;
  deliberationId?: string;
  isPublic: boolean;
  links: LinkInput[];
  ownerId: bigint;
  userIdStr: string;
  viaMcp: boolean;
  retryAfterMs: number;
}) {
  const {
    name,
    description,
    purpose,
    deliberationId: requestedDelibId,
    isPublic,
    links,
    ownerId,
    userIdStr,
    viaMcp,
    retryAfterMs,
  } = opts;

  const warnings: Warning[] = [];

  if (links.length < 2) {
    return NextResponse.json(
      { error: "A chain needs at least 2 links", code: "CHAIN_TOO_SHORT" },
      { status: 400, ...NO_STORE },
    );
  }
  if (links.length > 12) {
    return NextResponse.json(
      { error: "mint-and-link mode accepts at most 12 links", code: "CHAIN_TOO_LONG" },
      { status: 400, ...NO_STORE },
    );
  }

  // SSRF guard on every evidence URL (conclusion-level + per-premise).
  for (const link of links) {
    const urls: NormalizedEvidence[] = [
      ...link.evidence,
      ...link.premises.flatMap((p) => (isReusePremise(p) ? [] : p.evidence)),
    ];
    for (const ev of urls) {
      if (!isSafePublicUrl(ev.url)) {
        return NextResponse.json(
          { error: `Unsafe or non-public URL: ${ev.url}` },
          { status: 400, ...NO_STORE },
        );
      }
    }
  }

  // Resolve target deliberation (validate if supplied; else "My Arguments").
  let targetDelibId: string;
  if (requestedDelibId) {
    const delib = await prisma.deliberation.findUnique({
      where: { id: requestedDelibId },
      select: { id: true },
    });
    if (!delib) {
      return NextResponse.json(
        { error: "Deliberation not found" },
        { status: 400, ...NO_STORE },
      );
    }
    targetDelibId = requestedDelibId;
  } else {
    targetDelibId = await getOrCreateMyArgumentsDeliberation(userIdStr);
  }

  // ─── Pre-flight: explicit reuseClaimId threading topology (§4.2, §7 step 2) ──
  // A reuseClaimId must reference a PRIOR link's conclusion within this request.
  // Prior conclusions resolve by MOID identity, so the referenced claim must
  // already exist (the caller knew its id) and live in the target deliberation.
  // Forward refs, cycles, self-refs, and unrelated claims → CHAIN_LINK_INVALID_THREAD;
  // a divergent sanity text → CHAIN_LINK_BROKEN. Nothing is written here.
  const conclusionMoids = links.map((l) => mintClaimMoid(l.conclusion));
  const reuseIds = new Set<string>();
  for (const l of links) {
    for (const p of l.premises) {
      if (isReusePremise(p)) reuseIds.add(p.reuseClaimId);
    }
  }
  if (reuseIds.size > 0) {
    const known = await prisma.claim.findMany({
      where: { id: { in: [...reuseIds] }, deliberationId: targetDelibId },
      select: { id: true, moid: true },
    });
    const claimMoidById = new Map(known.map((c) => [c.id, c.moid]));
    for (let k = 0; k < links.length; k++) {
      for (const p of links[k].premises) {
        if (!isReusePremise(p)) continue;
        const refMoid = claimMoidById.get(p.reuseClaimId);
        if (!refMoid) {
          return NextResponse.json(
            {
              error: `Link ${k + 1}: reuseClaimId '${p.reuseClaimId}' is not a claim in this deliberation; reuse is scoped to prior links' conclusions in this chain.`,
              code: "CHAIN_LINK_INVALID_THREAD",
              linkIndex: k,
            },
            { status: 400, ...NO_STORE },
          );
        }
        const fromLink = conclusionMoids.findIndex((m, j) => j < k && m === refMoid);
        if (fromLink === -1) {
          return NextResponse.json(
            {
              error: `Link ${k + 1}: reuseClaimId '${p.reuseClaimId}' does not reference a prior link's conclusion (forward reference, cycle, or unrelated claim).`,
              code: "CHAIN_LINK_INVALID_THREAD",
              linkIndex: k,
            },
            { status: 400, ...NO_STORE },
          );
        }
        if (p.text && mintClaimMoid(p.text) !== refMoid) {
          return NextResponse.json(
            {
              error: `Link ${k + 1}: declared reuse text forked into a distinct claim (content hash mismatch with reuseClaimId '${p.reuseClaimId}').`,
              code: "CHAIN_LINK_BROKEN",
              linkIndex: k,
            },
            { status: 400, ...NO_STORE },
          );
        }
      }
    }
  }

  // ─── Pre-flight: Phase B health gate per link (no rows written yet) ──────────
  const resolutions: LinkResolution[] = [];
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    if (link.schemeKey) {
      const gate = await resolveSchemeForWrite(link.schemeKey);
      if (!gate.ok) {
        return NextResponse.json(
          {
            error: `Link ${i + 1}: ${gate.reason}`,
            code: gate.code,
            canonical: gate.canonical,
            requestedKey: gate.requestedKey,
            linkIndex: i,
            hint: "Call list_schemes(excludeUnhealthy: true) to pick a healthy argument pattern.",
          },
          { status: 400, ...NO_STORE },
        );
      }

      let resolvedEpistemicMode: string;
      const epiInput = link.epistemicMode?.toUpperCase();
      if (epiInput && epiInput !== gate.scheme.epistemicMode) {
        resolvedEpistemicMode = epiInput;
        warnings.push({
          code: "EPISTEMIC_MODE_CHANGED_FINGERPRINT",
          detail: `Link ${i + 1}: epistemic mode overridden from scheme default '${gate.scheme.epistemicMode}' to '${epiInput}'; this no longer matches the scheme's catalogue fingerprint exactly.`,
        });
      } else {
        resolvedEpistemicMode = epiInput ?? gate.scheme.epistemicMode;
      }

      const verifierVerdict = await verifyAgainstFingerprintPeers(
        gate.scheme.id,
        gate.scheme.fingerprint,
      );

      if (gate.canonicalizedFrom) {
        warnings.push({
          code: "SCHEME_CANONICALIZED",
          detail: `Link ${i + 1}: requested scheme '${gate.canonicalizedFrom}' is a folksonomy duplicate; auto-redirected to canonical '${gate.scheme.key}' (not silently merged — original key preserved for audit).`,
        });
      }

      resolutions.push({
        schemeId: gate.scheme.id,
        schemeMeta: { id: gate.scheme.id, key: gate.scheme.key, name: gate.scheme.name },
        resolvedEpistemicMode,
        verifierVerdict,
        schemeHealth: gate.canonicalizedFrom ? "canonicalized" : "ok",
      });
    } else {
      // Infer a scheme (mirrors quick-structured's fallback).
      const inferenceText =
        (link.reasoning && link.reasoning.length > 0 && link.reasoning) ||
        link.premises.map((p) => p.text).join(" ; ") ||
        link.conclusion;
      const schemeId = await inferAndAssignScheme(inferenceText, link.conclusion);
      let schemeMeta: LinkResolution["schemeMeta"] = null;
      let resolvedEpistemicMode: string | null = null;
      if (schemeId) {
        const row = (await prisma.argumentScheme.findUnique({
          where: { id: schemeId },
          select: { id: true, key: true, name: true, epistemicMode: true } as any,
        })) as any;
        if (row) {
          schemeMeta = { id: row.id, key: row.key, name: row.name };
          resolvedEpistemicMode = link.epistemicMode?.toUpperCase() ?? row.epistemicMode ?? null;
          warnings.push({
            code: "scheme_inferred",
            detail: `Link ${i + 1}: scheme '${row.key}' (${row.name}) was inferred server-side. Pass an explicit schemeKey to override.`,
          });
        }
      }
      resolutions.push({
        schemeId,
        schemeMeta,
        resolvedEpistemicMode,
        verifierVerdict: null,
        schemeHealth: "ok",
      });
    }
  }

  // Intra-chain redundancy radar (MCP-Q-E): same scheme used by 2+ links.
  const schemeSeen = new Set<string>();
  for (let i = 0; i < resolutions.length; i++) {
    const sid = resolutions[i].schemeId;
    if (sid && schemeSeen.has(sid)) {
      warnings.push({
        code: "chain_link_scheme_repeat",
        detail: `Link ${i + 1} reuses scheme '${resolutions[i].schemeMeta?.key ?? sid}' already used earlier in the chain. A serial chain whose links share a scheme may be a single argument inflated into a chain, or genuine iterated reasoning — advisory only.`,
      });
    }
    if (sid) schemeSeen.add(sid);
  }

  // chainRedundancyFlag (§8): ≥1 link verifier verdict in {equal,subset,inconclusive}.
  const chainRedundancyFlag = resolutions.some(
    (r) =>
      r.verifierVerdict?.kind === "equal" ||
      r.verifierVerdict?.kind === "subset" ||
      r.verifierVerdict?.kind === "inconclusive",
  );

  // ─── Atomic transaction (mint links + chain rows) ───────────────────────────
  // Threading: a link's conclusion can be reused by a LATER link's premise when
  // their text content-hashes (MOID) match — collapsing to one shared Claim.
  type ThreadEntry = { fromLink: number; toLink: number; sharedClaimId: string; mode: "moid" | "explicit" };
  // claimId → evidence to attach (resolved after the txn).
  const evidenceByClaimId = new Map<string, NormalizedEvidence[]>();
  const pushEvidence = (claimId: string, items: NormalizedEvidence[]) => {
    if (items.length === 0) return;
    const existing = evidenceByClaimId.get(claimId) ?? [];
    evidenceByClaimId.set(claimId, [...existing, ...items]);
  };

  let result: {
    chainId: string;
    rootNodeId: string | null;
    nodes: { id: string; argumentId: string; nodeOrder: number }[];
    edges: { id: string; sourceNodeId: string; targetNodeId: string }[];
    perLink: {
      argumentId: string;
      conclusionClaimId: string;
      schemeInstanceId: string | null;
    }[];
    threading: ThreadEntry[];
  };

  try {
    result = await prisma.$transaction(async (tx) => {
      // moid → { linkIndex, claimId } for PRIOR links' conclusions only.
      const priorConclusions = new Map<string, { linkIndex: number; claimId: string }>();
      // claimId → linkIndex for PRIOR conclusions (explicit reuseClaimId lookup).
      const priorConclusionLinkById = new Map<string, number>();
      const threading: ThreadEntry[] = [];
      const perLink: {
        argumentId: string;
        conclusionClaimId: string;
        schemeInstanceId: string | null;
      }[] = [];

      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        const res = resolutions[i];

        // Mint conclusion claim by MOID.
        const conclusionMoid = mintClaimMoid(link.conclusion);
        const conclusionClaim = await tx.claim.upsert({
          where: { moid: conclusionMoid },
          create: {
            text: link.conclusion,
            moid: conclusionMoid,
            createdById: userIdStr,
            deliberationId: targetDelibId,
          },
          update: {},
          select: { id: true },
        });
        pushEvidence(conclusionClaim.id, link.evidence);

        // Resolve premises (dedup within link; auto-thread onto prior conclusions).
        const premiseClaimIds: string[] = [];
        const premiseMeta: { claimId: string; isAxiom: boolean; premiseType: string }[] = [];
        const seenInLink = new Set<string>();
        for (const p of link.premises) {
          // Explicit reuse: thread onto a prior link's conclusion by claim id.
          if (isReusePremise(p)) {
            const claimId = p.reuseClaimId;
            const fromLink = priorConclusionLinkById.get(claimId);
            if (fromLink === undefined) {
              // Pre-flight validated this; defensive guard rolls the txn back.
              throw new Error(
                `Link ${i + 1}: reuseClaimId '${claimId}' is not a prior link's conclusion.`,
              );
            }
            if (!seenInLink.has(claimId)) {
              seenInLink.add(claimId);
              premiseClaimIds.push(claimId);
              premiseMeta.push({ claimId, isAxiom: false, premiseType: "ordinary" });
              threading.push({
                fromLink,
                toLink: i,
                sharedClaimId: claimId,
                mode: "explicit",
              });
            }
            continue;
          }

          const pMoid = mintClaimMoid(p.text);

          // Self-loop: premise equals this link's own conclusion → drop.
          if (pMoid === conclusionMoid) {
            warnings.push({
              code: "premise_deduped",
              detail: `Link ${i + 1}: premise '${p.text.slice(0, 60)}…' matches its own conclusion by content hash and was dropped to avoid a self-loop.`,
            });
            continue;
          }

          // Auto-thread onto a prior link's conclusion (MOID identity).
          const prior = priorConclusions.get(pMoid);
          if (prior) {
            if (!seenInLink.has(prior.claimId)) {
              seenInLink.add(prior.claimId);
              premiseClaimIds.push(prior.claimId);
              premiseMeta.push({
                claimId: prior.claimId,
                isAxiom: p.isAxiom,
                premiseType: p.premiseType ?? "ordinary",
              });
              threading.push({
                fromLink: prior.linkIndex,
                toLink: i,
                sharedClaimId: prior.claimId,
                mode: "moid",
              });
              warnings.push({
                code: "chain_link_autothreaded",
                detail: `Link ${i + 1}: premise content-hash-collapsed onto link ${prior.linkIndex + 1}'s conclusion claim (threaded by MOID). Pass reuseClaimId to declare this explicitly.`,
              });
            }
            pushEvidence(prior.claimId, p.evidence);
            continue;
          }

          // Ordinary fresh premise — mint by MOID, dedup within link.
          const claim = await tx.claim.upsert({
            where: { moid: pMoid },
            create: {
              text: p.text,
              moid: pMoid,
              createdById: userIdStr,
              deliberationId: targetDelibId,
            },
            update: {},
            select: { id: true },
          });
          if (seenInLink.has(claim.id)) {
            warnings.push({
              code: "premise_deduped",
              detail: `Link ${i + 1}: premise '${p.text.slice(0, 60)}…' collapsed to an existing claim by content hash.`,
            });
            pushEvidence(claim.id, p.evidence);
            continue;
          }
          seenInLink.add(claim.id);
          premiseClaimIds.push(claim.id);
          premiseMeta.push({
            claimId: claim.id,
            isAxiom: p.isAxiom,
            premiseType: p.premiseType ?? "ordinary",
          });
          pushEvidence(claim.id, p.evidence);
        }

        if (premiseClaimIds.length === 0) {
          throw new Error(
            `Link ${i + 1}: all premises collapsed to the conclusion or to each other. Provide at least one distinct premise.`,
          );
        }

        // Create the Argument.
        const argument = await tx.argument.create({
          data: {
            deliberationId: targetDelibId,
            authorId: userIdStr,
            conclusionClaimId: conclusionClaim.id,
            schemeId: res.schemeId ?? null,
            implicitWarrant: link.implicitWarrant || null,
            text: link.reasoning || "",
            ...(viaMcp
              ? {
                  authorKind: "AI" as const,
                  aiProvenance: {
                    via: "mcp",
                    tool: "propose_argument_chain",
                    createdAt: new Date().toISOString(),
                  },
                }
              : {}),
          },
          select: { id: true },
        });

        await ensureArgumentSupportInTx(tx, {
          argumentId: argument.id,
          claimId: conclusionClaim.id,
          deliberationId: targetDelibId,
          base: 0.7,
        });

        await tx.argumentPremise.createMany({
          data: premiseMeta.map((m) => ({
            argumentId: argument.id,
            claimId: m.claimId,
            groupKey: null,
            isImplicit: false,
            isAxiom: m.isAxiom,
            premiseType: m.premiseType.toUpperCase(),
          })) as any,
          skipDuplicates: true,
        });

        await markArgumentAsComposedInTx(
          tx,
          argument.id,
          "Composed via propose_argument_chain",
        );

        let schemeInstanceId: string | null = null;
        if (res.schemeId) {
          const inst = await (tx as any).argumentSchemeInstance.create({
            data: {
              argumentId: argument.id,
              schemeId: res.schemeId,
              role: "primary",
              explicitness: link.schemeKey ? "explicit" : "implied",
              confidence: 1.0,
              isPrimary: true,
              order: 0,
              ruleType: link.ruleType,
              ruleName: null,
              epistemicMode: res.resolvedEpistemicMode ?? null,
              verifierVerdict: res.verifierVerdict?.kind ?? null,
            },
            select: { id: true },
          });
          schemeInstanceId = inst.id;
        }

        perLink.push({
          argumentId: argument.id,
          conclusionClaimId: conclusionClaim.id,
          schemeInstanceId,
        });
        priorConclusions.set(conclusionMoid, { linkIndex: i, claimId: conclusionClaim.id });
        priorConclusionLinkById.set(conclusionClaim.id, i);
      }

      // Create the chain shell.
      const chain = await tx.argumentChain.create({
        data: {
          deliberationId: targetDelibId,
          name,
          description,
          purpose,
          chainType: "SERIAL",
          isPublic,
          isEditable: false,
          createdBy: ownerId,
        },
        select: { id: true },
      });

      // Nodes — one per link, in spine order.
      const nodes: { id: string; argumentId: string; nodeOrder: number }[] = [];
      for (let i = 0; i < perLink.length; i++) {
        const created = await tx.argumentChainNode.create({
          data: {
            chainId: chain.id,
            argumentId: perLink[i].argumentId,
            nodeOrder: i,
            role: i === perLink.length - 1 ? "CONCLUSION" : "PREMISE",
            addedBy: ownerId,
          },
          select: { id: true, argumentId: true, nodeOrder: true },
        });
        nodes.push(created);
      }

      // Serial SUPPORTS edges over the spine.
      const edgeData = nodes.slice(0, -1).map((n, i) => ({
        chainId: chain.id,
        sourceNodeId: n.id,
        targetNodeId: nodes[i + 1].id,
        edgeType: "SUPPORTS" as const,
      }));
      if (edgeData.length > 0) {
        await tx.argumentChainEdge.createMany({ data: edgeData, skipDuplicates: true });
      }
      const edges = await tx.argumentChainEdge.findMany({
        where: { chainId: chain.id },
        select: { id: true, sourceNodeId: true, targetNodeId: true },
        orderBy: { createdAt: "asc" },
      });

      const rootNodeId = nodes[0]?.id ?? null;
      if (rootNodeId) {
        await tx.argumentChain.update({
          where: { id: chain.id },
          data: { rootNodeId },
        });
      }

      return { chainId: chain.id, rootNodeId, nodes, edges, perLink, threading };
    });
  } catch (err: any) {
    console.error("[POST /api/argument-chains/quick-chain] mint-and-link failed", err);
    return NextResponse.json(
      { error: err?.message ?? "chain minting failed" },
      { status: 500, ...NO_STORE },
    );
  }

  // ─── Evidence (outside the txn; best-effort) ────────────────────────────────
  let provenancePending = false;
  const createdEvidenceIds: string[] = [];
  const unfurlCache = new Map<string, string | undefined>();
  for (const [claimId, items] of evidenceByClaimId) {
    if (items.length === 0) continue;
    const seenUrls = new Set<string>();
    const unique = items.filter((ev) => {
      if (seenUrls.has(ev.url)) return false;
      seenUrls.add(ev.url);
      return true;
    });
    const enriched = await Promise.all(
      unique.map(async (ev) => {
        if (ev.title) return ev;
        if (unfurlCache.has(ev.url)) return { ...ev, title: unfurlCache.get(ev.url) };
        try {
          const preview = await getOrFetchLinkPreview(ev.url);
          unfurlCache.set(ev.url, preview.title ?? undefined);
          return { ...ev, title: preview.title ?? undefined };
        } catch {
          unfurlCache.set(ev.url, undefined);
          return ev;
        }
      }),
    );
    try {
      await prisma.claimEvidence.createMany({
        data: enriched.map((ev) => ({
          claimId,
          uri: ev.url,
          title: ev.title ?? null,
          citation: ev.citationText ?? null,
          addedById: userIdStr,
        })),
        skipDuplicates: true,
      });
      const created = await prisma.claimEvidence.findMany({
        where: { claimId, uri: { in: enriched.map((e) => e.url) } },
        select: { id: true },
      });
      if (created.length > 0) {
        createdEvidenceIds.push(...created.map((c) => c.id));
        provenancePending = true;
      }
    } catch {
      // best-effort
    }
  }
  if (createdEvidenceIds.length > 0) {
    enrichEvidenceProvenanceInBackground(createdEvidenceIds);
  }

  // ─── Worst-link standing echo (outside the txn) ─────────────────────────────
  let chainStanding: string | null = null;
  let weakestLink: { argumentId: string; reason: string } | null = null;
  try {
    const exposure = await computeChainExposure(targetDelibId);
    const projection = exposure?.chains.find((c) => c.id === result.chainId);
    if (projection) {
      chainStanding = projection.chainStanding;
      weakestLink = projection.weakestLink;
    }
  } catch (err) {
    console.error(
      "[POST /api/argument-chains/quick-chain] chainStanding echo failed",
      err,
    );
  }

  // ─── Response shape (§5.1) ──────────────────────────────────────────────────
  const responseLinks = result.nodes.map((n, i) => {
    const pl = result.perLink[i];
    const res = resolutions[i];
    return {
      nodeId: n.id,
      argumentId: pl.argumentId,
      conclusionClaimId: pl.conclusionClaimId,
      nodeOrder: n.nodeOrder,
      schemeInstance:
        pl.schemeInstanceId && res.schemeMeta
          ? {
              id: pl.schemeInstanceId,
              schemeKey: res.schemeMeta.key,
              schemeName: res.schemeMeta.name,
            }
          : null,
      schemeHealth: res.schemeHealth,
      verifierVerdict: res.verifierVerdict?.kind ?? "skipped",
    };
  });

  return NextResponse.json(
    {
      ok: true,
      chain: {
        id: result.chainId,
        name,
        chainType: "SERIAL" as const,
        rootNodeId: result.rootNodeId,
        deliberationId: targetDelibId,
        permalink: `${BASE_URL}/deliberations/${targetDelibId}/chains/${result.chainId}`,
      },
      links: responseLinks,
      edges: result.edges.map((e) => ({
        id: e.id,
        sourceNodeId: e.sourceNodeId,
        targetNodeId: e.targetNodeId,
        edgeType: "SUPPORTS" as const,
      })),
      threading: result.threading,
      chainStanding,
      weakestLink,
      chainRedundancyFlag,
      warnings,
      provenancePending,
      retryAfterMs: provenancePending ? 60_000 : retryAfterMs,
    },
    { status: 201, ...NO_STORE },
  );
}

async function composeChain(opts: {
  name: string;
  description: string | null;
  purpose: string | null;
  deliberationId?: string;
  isPublic: boolean;
  argumentIds: string[];
  ownerId: bigint;
  viaMcp: boolean;
  retryAfterMs: number;
}) {
  const {
    name,
    description,
    purpose,
    deliberationId: requestedDelibId,
    isPublic,
    argumentIds,
    ownerId,
    retryAfterMs,
  } = opts;

  // Dedup while preserving spine order.
  const seen = new Set<string>();
  const orderedIds = argumentIds.filter((id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  if (orderedIds.length < 2) {
    return NextResponse.json(
      {
        error: "A chain needs at least 2 distinct arguments",
        code: "CHAIN_TOO_SHORT",
      },
      { status: 400, ...NO_STORE },
    );
  }
  if (orderedIds.length > 20) {
    return NextResponse.json(
      {
        error: "compose mode accepts at most 20 arguments",
        code: "CHAIN_TOO_LONG",
      },
      { status: 400, ...NO_STORE },
    );
  }

  // Load the referenced arguments.
  const args = await prisma.argument.findMany({
    where: { id: { in: orderedIds } },
    select: {
      id: true,
      deliberationId: true,
      conclusionClaimId: true,
      argumentSchemes: {
        select: { scheme: { select: { key: true, name: true } } },
      },
    },
  });
  const argById = new Map(args.map((a) => [a.id, a]));

  // Every id must resolve.
  const missing = orderedIds.filter((id) => !argById.has(id));
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: `Argument(s) not found: ${missing.join(", ")}`,
        code: "CHAIN_LINK_NOT_FOUND",
      },
      { status: 400, ...NO_STORE },
    );
  }

  // Resolve the chain's deliberation. All arguments must live in one
  // deliberation (the chain FKs into it and chain-standing is delib-scoped).
  const distinctDelibs = [...new Set(args.map((a) => a.deliberationId))];
  let targetDelibId: string;
  if (requestedDelibId) {
    const wrong = orderedIds.filter(
      (id) => argById.get(id)!.deliberationId !== requestedDelibId,
    );
    if (wrong.length > 0) {
      return NextResponse.json(
        {
          error: `Argument(s) do not belong to deliberation '${requestedDelibId}': ${wrong.join(", ")}`,
          code: "CHAIN_LINK_NOT_FOUND",
        },
        { status: 400, ...NO_STORE },
      );
    }
    targetDelibId = requestedDelibId;
  } else {
    if (distinctDelibs.length > 1) {
      return NextResponse.json(
        {
          error:
            "Arguments span multiple deliberations; pass deliberationId to disambiguate or compose within a single deliberation",
          code: "CHAIN_LINK_NOT_FOUND",
        },
        { status: 400, ...NO_STORE },
      );
    }
    targetDelibId = distinctDelibs[0];
  }

  // ─── Per-link scheme-health re-check (non-fatal) ────────────────────────────
  // A composed argument may reference a since-deprecated scheme; surface that
  // as a warning so the caller knows the spine includes an unhealthy pattern.
  const warnings: Warning[] = [];
  const schemeKeysToCheck = new Set<string>();
  for (const a of args) {
    for (const s of a.argumentSchemes) {
      if (s.scheme?.key) schemeKeysToCheck.add(s.scheme.key);
    }
  }
  const unhealthyKeys = new Set<string>();
  for (const key of schemeKeysToCheck) {
    const gate = await resolveSchemeForWrite(key);
    if (!gate.ok || gate.canonicalizedFrom) {
      unhealthyKeys.add(key);
    }
  }
  if (unhealthyKeys.size > 0) {
    for (const a of args) {
      const bad = a.argumentSchemes
        .map((s) => s.scheme?.key)
        .filter((k): k is string => !!k && unhealthyKeys.has(k));
      if (bad.length > 0) {
        warnings.push({
          code: "compose_link_scheme_unhealthy",
          detail: `Argument '${a.id}' references unhealthy scheme(s): ${bad.join(", ")}. The link is included as-is; consider re-attaching to a canonical pattern.`,
        });
      }
    }
  }

  // ─── Atomic transaction (from-prong pattern) ────────────────────────────────
  let result: {
    chainId: string;
    rootNodeId: string | null;
    nodes: { id: string; argumentId: string; nodeOrder: number }[];
    edges: { id: string; sourceNodeId: string; targetNodeId: string }[];
  };
  try {
    result = await prisma.$transaction(async (tx) => {
      const chain = await tx.argumentChain.create({
        data: {
          deliberationId: targetDelibId,
          name,
          description,
          purpose,
          chainType: "SERIAL",
          isPublic,
          isEditable: false,
          createdBy: ownerId,
        },
        select: { id: true },
      });

      // Nodes — one per argument, in spine order. Last node is the chain's
      // CONCLUSION; earlier nodes are PREMISE (helps chainExposure pick the
      // top claim and lets rootNodeId resolve to the first node).
      const nodes: { id: string; argumentId: string; nodeOrder: number }[] = [];
      for (let i = 0; i < orderedIds.length; i++) {
        const created = await tx.argumentChainNode.create({
          data: {
            chainId: chain.id,
            argumentId: orderedIds[i],
            nodeOrder: i,
            role: i === orderedIds.length - 1 ? "CONCLUSION" : "PREMISE",
            addedBy: ownerId,
          },
          select: { id: true, argumentId: true, nodeOrder: true },
        });
        nodes.push(created);
      }

      // Serial SUPPORTS edges over the spine.
      const edgeData = nodes.slice(0, -1).map((n, i) => ({
        chainId: chain.id,
        sourceNodeId: n.id,
        targetNodeId: nodes[i + 1].id,
        edgeType: "SUPPORTS" as const,
      }));
      if (edgeData.length > 0) {
        await tx.argumentChainEdge.createMany({
          data: edgeData,
          skipDuplicates: true,
        });
      }
      const edges = await tx.argumentChainEdge.findMany({
        where: { chainId: chain.id },
        select: { id: true, sourceNodeId: true, targetNodeId: true },
        orderBy: { createdAt: "asc" },
      });

      const rootNodeId = nodes[0]?.id ?? null;
      if (rootNodeId) {
        await tx.argumentChain.update({
          where: { id: chain.id },
          data: { rootNodeId },
        });
      }

      return { chainId: chain.id, rootNodeId, nodes, edges };
    });
  } catch (err: any) {
    console.error("[POST /api/argument-chains/quick-chain] compose failed", err);
    return NextResponse.json(
      { error: err?.message ?? "chain composition failed" },
      { status: 500, ...NO_STORE },
    );
  }

  // ─── Worst-link standing echo (outside the transaction) ─────────────────────
  let chainStanding: string | null = null;
  let weakestLink: { argumentId: string; reason: string } | null = null;
  try {
    const exposure = await computeChainExposure(targetDelibId);
    const projection = exposure?.chains.find((c) => c.id === result.chainId);
    if (projection) {
      chainStanding = projection.chainStanding;
      weakestLink = projection.weakestLink;
    }
  } catch (err) {
    console.error(
      "[POST /api/argument-chains/quick-chain] chainStanding echo failed",
      err,
    );
  }

  // ─── Response shape (§5.1) ──────────────────────────────────────────────────
  const links = result.nodes.map((n) => {
    const arg = argById.get(n.argumentId)!;
    const inst = arg.argumentSchemes[0]?.scheme ?? null;
    const usesUnhealthy = arg.argumentSchemes.some(
      (s) => s.scheme?.key && unhealthyKeys.has(s.scheme.key),
    );
    return {
      nodeId: n.id,
      argumentId: n.argumentId,
      conclusionClaimId: arg.conclusionClaimId,
      nodeOrder: n.nodeOrder,
      schemeInstance: inst
        ? { id: null, schemeKey: inst.key, schemeName: inst.name }
        : null,
      schemeHealth: usesUnhealthy ? "rejected" : "ok",
      verifierVerdict: "skipped" as const,
    };
  });

  return NextResponse.json(
    {
      ok: true,
      chain: {
        id: result.chainId,
        name,
        chainType: "SERIAL" as const,
        rootNodeId: result.rootNodeId,
        deliberationId: targetDelibId,
        permalink: `${BASE_URL}/deliberations/${targetDelibId}/chains/${result.chainId}`,
      },
      links,
      edges: result.edges.map((e) => ({
        id: e.id,
        sourceNodeId: e.sourceNodeId,
        targetNodeId: e.targetNodeId,
        edgeType: "SUPPORTS" as const,
      })),
      threading: [],
      chainStanding,
      weakestLink,
      warnings,
      provenancePending: false,
      retryAfterMs,
    },
    { status: 201, ...NO_STORE },
  );
}
