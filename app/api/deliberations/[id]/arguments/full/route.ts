// app/api/deliberations/[id]/arguments/full/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaclient";
import { PaginationQuery, makePage } from "@/lib/server/pagination";
import type { TargetType } from "@prisma/client";
import { DEFAULT_ARGUMENT_CONFIDENCE, DEFAULT_PREMISE_BASE } from "@/lib/config/confidence";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Optimized caching: Allow 30s client cache for non-mutating reads
const CACHE_HEADERS = { 
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
  "CDN-Cache-Control": "public, s-maxage=30"
};
const NO_STORE = { headers: { "Cache-Control": "no-store" } } as const;

const Query = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(1000).optional().default(100), // Higher limit for debate sheets
  claimId: z.string().optional(),
  sort: z.string().optional(),
  mode: z.enum(["product", "min", "ds"]).optional(),
  imports: z.enum(["off", "materialized", "virtual", "all"]).optional(),
});

type Mode = "product" | "min" | "ds";

// Utility functions for evidential computation
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const compose = (xs: number[], mode: Mode) =>
  !xs.length ? 0 : mode === "min" ? Math.min(...xs) : xs.reduce((a, b) => a * b, 1);
const join = (xs: number[], mode: Mode) =>
  !xs.length ? 0 : mode === "min" ? Math.max(...xs) : 1 - xs.reduce((a, s) => a * (1 - s), 1);

/**
 * Unified endpoint that returns arguments with:
 * - AIF metadata (scheme, CQ status, attacks, preferences)
 * - Evidential support scores (computed via specified mode)
 * - Premise/conclusion data
 * - Dialogue provenance
 * 
 * This replaces the need for separate calls to:
 * - /api/deliberations/[id]/arguments/aif
 * - /api/deliberations/[id]/evidential
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const parsed = Query.safeParse({
    cursor: url.searchParams.get("cursor") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    sort: url.searchParams.get("sort") ?? "createdAt:desc",
    claimId: url.searchParams.get("claimId") ?? undefined,
    mode: url.searchParams.get("mode") ?? "product",
    imports: url.searchParams.get("imports") ?? "off",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400, ...NO_STORE });
  }

  const { cursor, limit, sort, claimId, mode, imports } = parsed.data;
  const [field, dir] = (sort ?? "createdAt:desc").split(":") as ["createdAt", "asc" | "desc"];
  
  // Ensure mode is always defined (defaults to 'product')
  const confidenceMode: Mode = mode ?? "product";

  // ==================== STEP 1: Fetch base argument rows ====================
  // Performance: Ensure indexes on (deliberationId, createdAt, id) and (deliberationId, conclusionClaimId)
  const rows = await prisma.argument.findMany({
    where: {
      deliberationId: params.id,
      ...(claimId ? { conclusionClaimId: claimId } : {}),
    },
    orderBy: [{ [field]: dir }, { id: dir }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      deliberationId: true,
      authorId: true,
      createdAt: true,
      text: true,
      mediaType: true,
      schemeId: true,
      conclusionClaimId: true,
      implicitWarrant: true,
      premises: { select: { claimId: true, isImplicit: true } },
      createdByMoveId: true,
      createdByMove: {
        select: {
          id: true,
          kind: true,
          actorId: true,
        },
      },
    },
  });

  const pageRows = rows.slice(0, limit);

  if (pageRows.length === 0) {
    const page = makePage([], limit);
    return NextResponse.json(
      { ...page, meta: { mode: confidenceMode, imports } },
      { headers: CACHE_HEADERS }
    );
  }

  // ==================== STEP 2: Batch fetch related data ====================
  const argIds = pageRows.map((r) => r.id);
  const schemeIds = Array.from(new Set(pageRows.map((r) => r.schemeId).filter(Boolean) as string[]));
  const claimIds = Array.from(
    new Set([
      ...pageRows.flatMap((r) => r.premises.map((p) => p.claimId)),
      ...pageRows.map((r) => r.conclusionClaimId).filter(Boolean) as string[],
    ])
  );

  // Fetch dialogue actors
  const actorIds = Array.from(
    new Set(pageRows.map((r) => r.createdByMove?.actorId).filter(Boolean) as string[])
  );
  const actors =
    actorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: actorIds.map((id) => BigInt(id)) } },
          select: { id: true, name: true, username: true },
        })
      : [];
  const actorById = new Map(actors.map((a) => [String(a.id), a]));

  // Fetch schemes with CQs, claims, and CQ statuses in parallel
  const [schemes, claims, cqStatuses] = await Promise.all([
    schemeIds.length
      ? prisma.argumentScheme.findMany({
          where: { id: { in: schemeIds } },
          select: {
            id: true,
            key: true,
            name: true,
            slotHints: true,
            cqs: { select: { cqKey: true, text: true, attackType: true, targetScope: true } },
          },
        })
      : Promise.resolve([]),
    claimIds.length
      ? prisma.claim.findMany({ where: { id: { in: claimIds } }, select: { id: true, text: true } })
      : Promise.resolve([]),
    prisma.cQStatus.findMany({
      where: {
        OR: [
          { argumentId: { in: argIds } },
          { targetType: "argument" as TargetType, targetId: { in: argIds } },
        ],
      },
      select: { argumentId: true, targetId: true, cqKey: true, status: true },
    }),
  ]);

  const schemeById = new Map(schemes.map((s) => [s.id, s]));
  const textByClaimId = new Map(claims.map((c) => [c.id, c.text ?? ""]));
  const textByArgumentId = new Map(pageRows.map((r) => [r.id, r.text ?? ""]));

  // ==================== STEP 3: Fetch attack counts via ConflictApplications ====================
  const caRows = await prisma.conflictApplication.findMany({
    where: {
      deliberationId: params.id,
      OR: [
        { conflictedArgumentId: { in: argIds } },
        { conflictedClaimId: { in: claimIds } },
      ],
    },
    select: {
      conflictedArgumentId: true,
      conflictedClaimId: true,
      legacyAttackType: true,
    },
  });

  // Build attack count map: { argId -> { REBUTS, UNDERCUTS, UNDERMINES } }
  const atkByArg: Record<string, { REBUTS: number; UNDERCUTS: number; UNDERMINES: number }> = {};
  for (const a of pageRows) atkByArg[a.id] = { REBUTS: 0, UNDERCUTS: 0, UNDERMINES: 0 };
  const premiseIdsByArg = new Map(pageRows.map((r) => [r.id, r.premises.map((p) => p.claimId)]));

  for (const c of caRows) {
    let bucket: "REBUTS" | "UNDERCUTS" | "UNDERMINES" | null = null;

    if (c.legacyAttackType) {
      bucket = c.legacyAttackType as any;
    } else if (c.conflictedArgumentId) {
      bucket = "UNDERCUTS"; // CA → RA implies undercut
    } else if (c.conflictedClaimId) {
      const hitArg = pageRows.find((r) => r.conclusionClaimId === c.conflictedClaimId);
      if (hitArg) bucket = "REBUTS";
      else {
        const argHit = pageRows.find((r) =>
          premiseIdsByArg.get(r.id)?.includes(c.conflictedClaimId!)
        );
        if (argHit) {
          atkByArg[argHit.id].UNDERMINES += 1;
          continue;
        }
      }
    }

    if (bucket) {
      if (c.conflictedArgumentId && atkByArg[c.conflictedArgumentId]) {
        atkByArg[c.conflictedArgumentId][bucket] += 1;
      } else if (c.conflictedClaimId) {
        const hitArg = pageRows.find((r) => r.conclusionClaimId === c.conflictedClaimId);
        if (hitArg) atkByArg[hitArg.id][bucket] += 1;
      }
    }
  }

  // ==================== STEP 4: Fetch preference counts ====================
  const [prefA, dispA] = await Promise.all([
    prisma.preferenceApplication.groupBy({
      by: ["preferredArgumentId"],
      where: { preferredArgumentId: { in: argIds } },
      _count: { _all: true },
    }),
    prisma.preferenceApplication.groupBy({
      by: ["dispreferredArgumentId"],
      where: { dispreferredArgumentId: { in: argIds } },
      _count: { _all: true },
    }),
  ]);

  const preferredBy: Record<string, number> = Object.fromEntries(
    prefA.map((x) => [x.preferredArgumentId!, x._count._all])
  );
  const dispreferredBy: Record<string, number> = Object.fromEntries(
    dispA.map((x) => [x.dispreferredArgumentId!, x._count._all])
  );

  // ==================== STEP 5: Pack CQ meter per argument ====================
  const cqMap: Record<string, { satisfied: number; seen: Set<string> }> = {};
  for (const s of cqStatuses) {
    const keyArgId = s.argumentId ?? s.targetId ?? "";
    if (!keyArgId) continue;
    cqMap[keyArgId] ??= { satisfied: 0, seen: new Set<string>() };
    if (s.status === "answered" && s.cqKey && !cqMap[keyArgId].seen.has(s.cqKey)) {
      cqMap[keyArgId].satisfied += 1;
      cqMap[keyArgId].seen.add(s.cqKey);
    }
  }

  // ==================== STEP 6: Compute evidential support ====================
  // Optimization: Only fetch claims referenced by the paginated arguments
  // This is much more efficient than fetching ALL claims in the deliberation
  const allClaimIds = claimIds; // Already collected from arguments above

  const base = await prisma.argumentSupport.findMany({
    where: { deliberationId: params.id, claimId: { in: allClaimIds } },
    select: { claimId: true, argumentId: true, base: true, provenanceJson: true },
  });

  // Filter based on imports setting
  const includeMat = imports === "materialized" || imports === "all";
  const localSupports = includeMat
    ? base
    : base.filter((s) => (s.provenanceJson as any)?.kind !== "import");

  // Virtual imports (if requested)
  let virtualAdds: Array<{ claimId: string; argumentId: string; base: number }> = [];
  if (imports === "virtual" || imports === "all") {
    const imps = await prisma.argumentImport.findMany({
      where: { toDeliberationId: params.id, toClaimId: { in: allClaimIds } },
      select: { fingerprint: true, toClaimId: true, toArgumentId: true, baseAtImport: true },
    });
    virtualAdds = imps
      .filter((i) => !i.toArgumentId)
      .map((i) => ({
        claimId: i.toClaimId!,
        argumentId: `virt:${i.fingerprint}`,
        base: clamp01(i.baseAtImport ?? DEFAULT_ARGUMENT_CONFIDENCE),
      }));
  }

  const allSupports = [
    ...localSupports.map((s) => ({
      claimId: s.claimId,
      argumentId: s.argumentId,
      base: clamp01(s.base ?? DEFAULT_ARGUMENT_CONFIDENCE),
    })),
    ...virtualAdds,
  ];

  // Fetch premise edges and assumptions for real arguments
  const realArgIds = Array.from(
    new Set(allSupports.map((s) => s.argumentId).filter((id) => !id.startsWith("virt:")))
  );
  const edges = await prisma.argumentEdge.findMany({
    where: { deliberationId: params.id, type: "support" as any, toArgumentId: { in: realArgIds } },
    select: { fromArgumentId: true, toArgumentId: true },
  });
  const parents = new Map<string, string[]>();
  for (const e of edges)
    (
      parents.get(e.toArgumentId) ?? parents.set(e.toArgumentId, []).get(e.toArgumentId)!
    ).push(e.fromArgumentId);

  // Fetch per-derivation assumptions
  const derivations = await prisma.argumentSupport.findMany({
    where: { argumentId: { in: realArgIds } },
    select: { id: true, argumentId: true },
  });

  const derivationIds = derivations.map((d) => d.id);
  const derivByArg = new Map<string, string[]>();
  for (const d of derivations) {
    (derivByArg.get(d.argumentId) ?? derivByArg.set(d.argumentId, []).get(d.argumentId)!).push(
      d.id
    );
  }

  const derivAssumptions = await prisma.derivationAssumption.findMany({
    where: { derivationId: { in: derivationIds } },
  });

  const assumpByDeriv = new Map<string, number[]>();
  for (const da of derivAssumptions) {
    (
      assumpByDeriv.get(da.derivationId) ??
      assumpByDeriv.set(da.derivationId, []).get(da.derivationId)!
    ).push(clamp01(da.weight));
  }

  // Legacy argument-level assumptions (fallback)
  const legacyUses = await prisma.assumptionUse
    .findMany({
      where: { argumentId: { in: realArgIds } },
      select: { argumentId: true, weight: true },
    })
    .catch(() => [] as any[]);
  const legacyAssump = new Map<string, number[]>();
  for (const u of legacyUses) {
    (
      legacyAssump.get(u.argumentId) ?? legacyAssump.set(u.argumentId, []).get(u.argumentId)!
    ).push(clamp01(u.weight ?? 0.6));
  }

  const baseByArg = new Map<string, number>();
  for (const s of allSupports)
    if (!s.argumentId.startsWith("virt:")) baseByArg.set(s.argumentId, s.base);

  // Compute contributions per claim
  const contributionsByClaim = new Map<
    string,
    Array<{ argumentId: string; score: number }>
  >();

  for (const s of allSupports) {
    const real = !s.argumentId.startsWith("virt:");
    const b = real ? baseByArg.get(s.argumentId) ?? s.base : s.base;
    const premIds = real ? parents.get(s.argumentId) ?? [] : [];
    const premBases = real ? premIds.map((pid) => baseByArg.get(pid) ?? DEFAULT_PREMISE_BASE) : [];
    const premFactor = premBases.length ? compose(premBases, confidenceMode) : 1;

    let aBases: number[] = [];
    if (real) {
      const derivIds = derivByArg.get(s.argumentId) ?? [];
      const derivAssumps: number[] = [];
      for (const dId of derivIds) {
        const weights = assumpByDeriv.get(dId) ?? [];
        if (weights.length) derivAssumps.push(...weights);
      }
      aBases = derivAssumps.length ? derivAssumps : legacyAssump.get(s.argumentId) ?? [];
    }

    const assumpFactor = aBases.length ? compose(aBases, confidenceMode) : 1;
    const score = clamp01(compose([b, premFactor], confidenceMode) * assumpFactor);

    (
      contributionsByClaim.get(s.claimId) ??
      contributionsByClaim.set(s.claimId, []).get(s.claimId)!
    ).push({ argumentId: s.argumentId, score });
  }

  // Compute support scores per claim (only for claims in current page)
  const supportByClaimId: Record<string, number> = {};
  const dsSupportByClaimId: Record<string, { bel: number; pl: number }> = {};

  // For DS mode, fetch negation mappings (only for relevant claims)
  let negationMappings: Map<string, string[]> = new Map();
  if (confidenceMode === "ds" && allClaimIds.length > 0) {
    const negMaps = await prisma.negationMap.findMany({
      where: { 
        deliberationId: params.id,
        claimId: { in: allClaimIds } // Only fetch negations for relevant claims
      },
      select: { claimId: true, negatedClaimId: true },
    });

    for (const nm of negMaps) {
      const list = negationMappings.get(nm.claimId) ?? [];
      list.push(nm.negatedClaimId);
      negationMappings.set(nm.claimId, list);
    }
  }

  // Process only the claims referenced by current page arguments
  for (const claimId of allClaimIds) {
    const c = { id: claimId };
    const contribs = contributionsByClaim.get(c.id) ?? [];
    const s = join(
      contribs.map((x) => x.score),
      confidenceMode
    );
    supportByClaimId[c.id] = +s.toFixed(4);

    if (confidenceMode === "ds") {
      const bel = supportByClaimId[c.id];
      let conflictMass = 0;

      const negatedIds = negationMappings.get(c.id) ?? [];
      if (negatedIds.length > 0) {
        const negContribs: number[] = [];
        for (const negId of negatedIds) {
          const negSupports = contributionsByClaim.get(negId) ?? [];
          const negScore = join(
            negSupports.map((x) => x.score),
            confidenceMode
          );
          negContribs.push(negScore);
        }
        conflictMass = negContribs.length > 0 ? join(negContribs, confidenceMode) : 0;
      }

      const uncertaintyMass = Math.max(0, 1 - bel - conflictMass);
      const pl = Math.min(1, bel + uncertaintyMass);

      dsSupportByClaimId[c.id] = {
        bel: +bel.toFixed(4),
        pl: +pl.toFixed(4),
      };
    }
  }

  // Determine acceptance label for each argument based on conclusion support
  const getAcceptanceLabel = (conclusionClaimId: string | null): "accepted" | "rejected" | "undecided" => {
    if (!conclusionClaimId) return "undecided";
    const score = supportByClaimId[conclusionClaimId] ?? 0;
    if (score >= 0.7) return "accepted";
    if (score <= 0.3) return "rejected";
    return "undecided";
  };

  // ==================== STEP 7: Assemble final response ====================
  const items = pageRows.map((r) => {
    const scheme = r.schemeId ? schemeById.get(r.schemeId) : null;
    const required = scheme?.cqs?.length ?? 0;
    const satisfied = cqMap[r.id]?.satisfied ?? 0;

    const move = (r as any).createdByMove;
    const dialogueProvenance = move
      ? {
          moveId: move.id,
          moveKind: move.kind,
          speakerName:
            actorById.get(move.actorId)?.name ||
            actorById.get(move.actorId)?.username ||
            undefined,
        }
      : null;

    const conclusionClaimId = r.conclusionClaimId ?? null;
    const conclusionSupport = conclusionClaimId ? supportByClaimId[conclusionClaimId] ?? 0 : 0;
    const conclusionDsSupport = confidenceMode === "ds" && conclusionClaimId 
      ? dsSupportByClaimId[conclusionClaimId] 
      : undefined;

    return {
      id: r.id,
      deliberationId: r.deliberationId,
      authorId: r.authorId,
      createdAt: r.createdAt.toISOString(),
      text: r.text,
      mediaType: (r.mediaType as any) ?? "text",
      
      // Evidential support
      support: confidenceMode === "ds" ? conclusionDsSupport : conclusionSupport,
      acceptance: getAcceptanceLabel(conclusionClaimId),
      
      // AIF metadata
      aif: {
        scheme: scheme
          ? {
              id: scheme.id,
              key: scheme.key,
              name: scheme.name ?? "",
              slotHints: scheme.slotHints ?? null,
            }
          : null,
        conclusion: conclusionClaimId
          ? { id: conclusionClaimId, text: textByClaimId.get(conclusionClaimId) ?? "" }
          : null,
        premises: (r as any).premises.map((p: any) => ({
          id: p.claimId,
          text: textByClaimId.get(p.claimId) ?? "",
          isImplicit: p.isImplicit ?? false,
        })),
        implicitWarrant: (r.implicitWarrant as any) ?? null,
        attacks: atkByArg[r.id] ?? { REBUTS: 0, UNDERCUTS: 0, UNDERMINES: 0 },
        preferences: {
          preferredBy: preferredBy[r.id] ?? 0,
          dispreferredBy: dispreferredBy[r.id] ?? 0,
        },
        cq: { required, satisfied },
      },
      
      // Dialogue provenance
      dialogueProvenance,

      // Contributing arguments (for "View contributing arguments" feature)
      contributingArguments: conclusionClaimId
        ? (() => {
            const allContribs = contributionsByClaim.get(conclusionClaimId) ?? [];
            
            // Group by argumentId and count occurrences
            const grouped = new Map<string, { score: number; count: number; scores: number[] }>();
            for (const c of allContribs) {
              if (!grouped.has(c.argumentId)) {
                grouped.set(c.argumentId, { score: c.score, count: 1, scores: [c.score] });
              } else {
                const g = grouped.get(c.argumentId)!;
                g.count += 1;
                g.scores.push(c.score);
                // Use max score when there are multiple derivations
                g.score = Math.max(g.score, c.score);
              }
            }
            
            // Convert to array and sort by score
            return Array.from(grouped.entries())
              .map(([argId, data]) => ({
                argumentId: argId,
                contributionScore: data.score,
                argumentText: textByArgumentId.get(argId) ?? null,
                occurrences: data.count,
              }))
              .sort((a, b) => b.contributionScore - a.contributionScore)
              .slice(0, 10); // Top 10 contributors
          })()
        : [],
    };
  });

  const page = makePage(items, limit);
  return NextResponse.json(
    {
      ...page,
      meta: {
        mode: confidenceMode,
        imports,
        totalArguments: pageRows.length,
        hasMore: rows.length > limit,
      },
    },
    { headers: CACHE_HEADERS } // Use optimized caching
  );
}
