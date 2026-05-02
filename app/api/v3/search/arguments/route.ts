/**
 * GET /api/v3/search/arguments
 *
 * Track B.2 — Public argument search endpoint.
 *
 * Query parameters:
 *   q          — full-text query, matched against argument text and conclusion claim text
 *   limit      — 1..50 (default 10)
 *   scheme     — filter by primary scheme key (e.g. "expert_opinion")
 *   against    — claim moid; returns arguments whose conclusion conflicts
 *                with that claim (currently approximated via text-overlap;
 *                will tighten when ConflictApplication exposes a moid index)
 *   sort       — "recent" (default) | "dialectical_fitness"
 *                Dialectical fitness ranks by:
 *                  +1.0 per CQ answered
 *                  +0.5 per inbound support edge
 *                  -0.7 per inbound attack edge
 *                  -1.0 per inbound conflict-application
 *                  +0.25 per piece of evidence with a contentSha256
 *                Tied scores fall back to recency.
 *   mode       — "lexical" (default) | "hybrid" | "vector"
 *                "hybrid"/"vector" runs pgvector cosine top-K + sparse
 *                token retrieval and fuses with Reciprocal Rank Fusion
 *                (K=60). The id list is then row-fetched + (optionally)
 *                fitness-re-ranked. Falls back to lexical if `q` is empty.
 *                Each result includes a `hybrid` block with rrfScore,
 *                sparseRank, denseRank, denseDistance.
 *
 * Returns ranked argument permalinks with attestation summaries.
 *
 * Public, cache-friendly. Used by MCP tools `search_arguments` and
 * `find_counterarguments`.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import {
  computeStandingState,
  computeFitnessBreakdown,
  FITNESS_WEIGHTS,
} from "@/lib/citations/argumentAttestation";
import {
  hybridSearchArguments,
  type HybridSearchResult,
} from "@/lib/argument/hybridSearch";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://isonomia.app";
const FITNESS_CANDIDATE_FACTOR = 4; // pull 4x the asked-for limit before re-ranking
const FITNESS_CANDIDATE_CAP = 200;

function parseLimit(raw: string | null): number {
  const n = Math.floor(Number(raw ?? "10"));
  if (!Number.isFinite(n) || n < 1) return 10;
  return Math.min(50, n);
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim();
  const limit = parseLimit(sp.get("limit"));
  const scheme = (sp.get("scheme") ?? "").trim().toLowerCase() || null;
  const against = (sp.get("against") ?? "").trim() || null;
  const sort = (sp.get("sort") ?? "recent").trim().toLowerCase();
  const wantFitness = sort === "dialectical_fitness";
  const modeRaw = (sp.get("mode") ?? "lexical").trim().toLowerCase();
  const mode: "lexical" | "hybrid" | "vector" =
    modeRaw === "hybrid" || modeRaw === "vector" ? (modeRaw as any) : "lexical";

  // Build query. We restrict to arguments that have a permalink (i.e. have
  // been surfaced publicly) and that are not in private deliberations.
  const where: any = {
    permalink: { isNot: null },
  };

  // Text matching across argument text and conclusion claim text.
  // Tokenize on whitespace and require AT LEAST ONE token to appear in
  // either the argument text or the conclusion claim text (substring,
  // case-insensitive). Coverage — how many query tokens hit — is computed
  // post-filter and used to re-rank below.
  //
  // Why OR instead of AND: per-token AND black-holes natural-language
  // queries whose vocabulary doesn't exactly match the corpus (the round-2
  // MCP transcript hit this with "smartphones teen mental health" — the
  // corpus uses "adolescent", not "teen"). OR + coverage gives lexical
  // recall now; vector recall ships with C.1/C.2.
  //
  // Stop-word filter is intentionally tiny — the goal is to drop words
  // that hit everything (the, a, of, and, ...), not to do real NLP.
  const STOP_WORDS = new Set([
    "the", "a", "an", "of", "and", "or", "in", "on", "at", "to", "for",
    "is", "are", "be", "by", "with", "as", "from", "that", "this",
    "it", "its", "if", "not", "no", "but", "do", "does", "did",
  ]);
  let queryTokens: string[] = [];
  if (q) {
    queryTokens = q
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.replace(/[^\p{L}\p{N}-]/gu, "").trim())
      .filter((t) => t.length >= 3 && !STOP_WORDS.has(t))
      .slice(0, 8);
    if (queryTokens.length > 0) {
      where.OR = queryTokens.flatMap((tok) => [
        { text: { contains: tok, mode: "insensitive" } },
        { conclusion: { text: { contains: tok, mode: "insensitive" } } },
      ]);
    }
  }

  if (scheme) {
    where.argumentSchemes = {
      some: { scheme: { key: scheme } },
    };
  }

  // "against" mode: arguments that dialectically contest the target claim.
  //
  // Strategy (in order of authority):
  //   1. ConflictApplication rows that conflict the target claim directly
  //   2. ArgumentEdge rows of type rebut/undercut whose target argument
  //      concludes the target claim
  //
  // The previous text-overlap heuristic ("first 4 words of the target claim
  // appear in the candidate's conclusion") returned 0 for cleanly
  // dialectical pairs whose conclusions don't share surface vocabulary
  // (e.g. Haidt vs. Odgers on teen screens). The structural query is the
  // source of truth and is what the seeded edges encode.
  //
  // Honesty rule: arguments whose conclusion MOID equals the target are NOT
  // counter-arguments to it; exclude them so empty results are honestly
  // empty rather than the same argument echoing back.
  let againstClaimText: string | null = null;
  if (against) {
    const claim = await prisma.claim.findFirst({
      where: { moid: against },
      select: { id: true, text: true },
    });
    if (claim) {
      againstClaimText = claim.text;
      const [edgeContesters, conflictContesters] = await Promise.all([
        // Argument edges: any argument whose edge of type rebut/undercut
        // points at an argument that concludes the target claim.
        prisma.argumentEdge.findMany({
          where: {
            type: { in: ["rebut", "undercut"] as any },
            to: { conclusionClaimId: claim.id },
          },
          select: { fromArgumentId: true },
          take: 200,
        }),
        // ConflictApplications targeting the claim directly.
        prisma.conflictApplication.findMany({
          where: { conflictedClaimId: claim.id },
          select: { conflictingArgumentId: true } as any,
          take: 200,
        }),
      ]);
      const ids = new Set<string>();
      for (const e of edgeContesters) if (e.fromArgumentId) ids.add(e.fromArgumentId);
      for (const c of conflictContesters as any[]) {
        if (c?.conflictingArgumentId) ids.add(c.conflictingArgumentId);
      }
      where.id = { in: Array.from(ids) };
      where.conclusion = { moid: { not: against } };
      // If no structural contesters exist, short-circuit to honest-empty
      // rather than letting a no-op `id IN ()` query run.
      if (ids.size === 0) {
        return NextResponse.json(
          {
            ok: true,
            query: { q, limit, scheme, against, againstClaimText, sort: wantFitness ? "dialectical_fitness" : "recent", mode },
            count: 0,
            results: [],
          },
          {
            headers: {
              "Cache-Control": "public, max-age=30, s-maxage=30",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
    }
  }

  // For dialectical-fitness sort we pull a wider candidate pool, then
  // re-rank in app code. For "recent" we just take the limit directly.
  const candidateLimit = wantFitness
    ? Math.min(FITNESS_CANDIDATE_CAP, limit * FITNESS_CANDIDATE_FACTOR)
    : limit;

  // C.1 — hybrid retrieval. When mode !== "lexical", run pgvector +
  // sparse fusion (RRF) and feed the resulting id list back into the
  // existing row-fetch + fitness re-rank pipeline. The lexical OR clause
  // is replaced by `id IN (hybridIds)`; all other filters (scheme,
  // against, permalink) are preserved.
  let hybridResults: HybridSearchResult[] | null = null;
  if (mode !== "lexical" && q) {
    // Honor existing structural constraint from `against` when set.
    const argumentIdsConstraint: string[] | undefined =
      where.id?.in && Array.isArray(where.id.in) ? where.id.in : undefined;
    hybridResults = await hybridSearchArguments({
      query: q,
      limit: candidateLimit,
      filter: {
        schemeKey: scheme,
        argumentIds: argumentIdsConstraint,
        permalinkRequired: true,
      },
    });
    const hybridIds = hybridResults.map((r) => r.id);
    if (hybridIds.length === 0) {
      return NextResponse.json(
        {
          ok: true,
          query: {
            q,
            limit,
            scheme,
            against,
            againstClaimText,
            sort: wantFitness ? "dialectical_fitness" : "recent",
            mode,
          },
          count: 0,
          results: [],
        },
        {
          headers: {
            "Cache-Control": "public, max-age=30, s-maxage=30",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }
    // Replace lexical OR with the fused id pool. Drop the OR so prisma
    // doesn't AND it with the id-set restriction.
    delete where.OR;
    where.id = { in: hybridIds };
  }

  const rows = await prisma.argument.findMany({
    where,
    select: {
      id: true,
      text: true,
      createdAt: true,
      conclusion: {
        select: {
          id: true,
          text: true,
          moid: true,
          ClaimEvidence: { select: { contentSha256: true } as any, take: 25 },
        },
      },
      permalink: { select: { shortCode: true, version: true, accessCount: true } },
      argumentSchemes: {
        where: { isPrimary: true },
        select: { scheme: { select: { key: true, name: true, title: true } } },
        take: 1,
      },
    },
    take: candidateLimit,
    orderBy: [{ createdAt: "desc" }],
  });

  // Compute dialectical counters per row (always — needed for standingState
  // on every result, not just fitness sorts). Capped to 50 by `limit` so the
  // parallel fan-out stays bounded.
  let withFitness: Array<{
    row: typeof rows[number];
    fitness: number;
    fitnessBreakdown: ReturnType<typeof computeFitnessBreakdown> | null;
    cqAnswered: number;
    supportEdges: number;
    attackEdges: number;
    attackCAs: number;
    cqRequired: number;
    /** Number of distinct query tokens (post-stop-word filter) found in argument text or conclusion text. 0 when q was empty. */
    lexicalCoverage: number;
  }> = rows
    .filter((r) => r.permalink?.shortCode)
    .map((r) => {
      let lexicalCoverage = 0;
      if (queryTokens.length > 0) {
        const haystack = (
          (r.text ?? "") + " " + (r.conclusion?.text ?? "")
        ).toLowerCase();
        for (const tok of queryTokens) {
          if (haystack.includes(tok)) lexicalCoverage++;
        }
      }
      return {
        row: r,
        fitness: 0,
        fitnessBreakdown: null,
        cqAnswered: 0,
        supportEdges: 0,
        attackEdges: 0,
        attackCAs: 0,
        cqRequired: 0,
        lexicalCoverage,
      };
    });

  await Promise.all(
    withFitness.map(async (entry) => {
      const argId = entry.row.id;
      const conclusionId = entry.row.conclusion?.id ?? null;
      const [cqAnswered, supportEdges, attackEdges, attackCAs] = await Promise.all([
        prisma.cQStatus.count({
          where: {
            OR: [
              { argumentId: argId },
              { targetType: "argument" as any, targetId: argId },
            ],
            statusEnum: { in: ["SATISFIED", "PARTIALLY_SATISFIED"] as any },
          },
        }),
        prisma.argumentEdge.count({
          where: { toArgumentId: argId, type: "support" as any },
        }),
        prisma.argumentEdge.count({
          where: { toArgumentId: argId, type: { in: ["rebut", "undercut"] as any } },
        }),
        prisma.conflictApplication.count({
          where: {
            OR: [
              { conflictedArgumentId: argId },
              conclusionId ? { conflictedClaimId: conclusionId } : undefined,
            ].filter(Boolean) as any[],
          },
        }),
      ]);
      entry.cqAnswered = cqAnswered;
      entry.supportEdges = supportEdges;
      entry.attackEdges = attackEdges;
      entry.attackCAs = attackCAs;
      const evidenceWithProvenance = (entry.row.conclusion?.ClaimEvidence ?? []).filter(
        (e: any) => !!e?.contentSha256
      ).length;
      // Single-source-of-truth fitness math — same weights, same formula
      // as the attestation envelope (Track AI-EPI Pt. 3 §1).
      const breakdown = computeFitnessBreakdown({
        cqAnswered,
        supportEdges,
        attackEdges,
        attackCAs,
        evidenceWithProvenance,
      });
      entry.fitness = breakdown.total;
      entry.fitnessBreakdown = breakdown;
    })
  );

  if (wantFitness) {
    withFitness.sort((a, b) => {
      // The consumer explicitly asked for dialectical_fitness sort, so
      // fitness is primary. Coverage is only a tiebreaker — overriding
      // fitness with coverage (Round-2 behavior) silently disrespected
      // the chosen sort key, which Round-3 transcript flagged.
      if (b.fitness !== a.fitness) return b.fitness - a.fitness;
      if (queryTokens.length > 0 && b.lexicalCoverage !== a.lexicalCoverage) {
        return b.lexicalCoverage - a.lexicalCoverage;
      }
      const ad = a.row.createdAt ? +new Date(a.row.createdAt) : 0;
      const bd = b.row.createdAt ? +new Date(b.row.createdAt) : 0;
      return bd - ad;
    });
    withFitness = withFitness.slice(0, limit);
  } else if (hybridResults) {
    // Hybrid mode without fitness — preserve RRF order from the fusion
    // step. Use a rank lookup so we don't re-sort by anything else.
    const rankById = new Map<string, number>();
    hybridResults.forEach((h, i) => rankById.set(h.id, i));
    withFitness.sort((a, b) => {
      const ra = rankById.get(a.row.id) ?? Number.MAX_SAFE_INTEGER;
      const rb = rankById.get(b.row.id) ?? Number.MAX_SAFE_INTEGER;
      return ra - rb;
    });
    withFitness = withFitness.slice(0, limit);
  } else if (queryTokens.length > 0) {
    // Recency sort + a query: still re-rank by coverage so high-coverage
    // results aren't pushed off the page by older but less-relevant ones.
    withFitness.sort((a, b) => {
      if (b.lexicalCoverage !== a.lexicalCoverage) {
        return b.lexicalCoverage - a.lexicalCoverage;
      }
      const ad = a.row.createdAt ? +new Date(a.row.createdAt) : 0;
      const bd = b.row.createdAt ? +new Date(b.row.createdAt) : 0;
      return bd - ad;
    });
    withFitness = withFitness.slice(0, limit);
  }

  const hybridById = new Map<string, HybridSearchResult>();
  if (hybridResults) {
    for (const h of hybridResults) hybridById.set(h.id, h);
  }

  const results = withFitness.map((entry) => {
    const r = entry.row;
    const sc = r.permalink!.shortCode;
    const primaryScheme = r.argumentSchemes[0]?.scheme ?? null;
    const standingState = computeStandingState({
      isTested:
        entry.cqAnswered >= 2 ||
        (entry.attackEdges + entry.attackCAs >= 1 && entry.supportEdges >= 1),
      criticalQuestionsAnswered: entry.cqAnswered,
      incomingAttacks: entry.attackCAs,
      incomingAttackEdges: entry.attackEdges,
      incomingSupports: entry.supportEdges,
    });
    const h = hybridById.get(r.id);
    return {
      argumentId: r.id,
      permalink: `${BASE_URL}/a/${sc}`,
      shortCode: sc,
      version: r.permalink!.version,
      text: r.text,
      conclusion: r.conclusion
        ? { claimId: r.conclusion.id, moid: r.conclusion.moid, text: r.conclusion.text }
        : null,
      scheme: primaryScheme
        ? { key: primaryScheme.key, name: primaryScheme.name, title: primaryScheme.title }
        : null,
      standingState,
      accessCount: r.permalink!.accessCount,
      createdAt: r.createdAt?.toISOString() ?? null,
      attestationUrl: `${BASE_URL}/api/a/${sc}/aif?format=attestation`,
      ...(queryTokens.length > 0
        ? {
            lexicalCoverage: {
              matched: entry.lexicalCoverage,
              outOf: queryTokens.length,
            },
          }
        : {}),
      ...(h
        ? {
            hybrid: {
              rrfScore: Math.round(h.rrfScore * 10000) / 10000,
              sparseRank: h.sparseRank,
              denseRank: h.denseRank,
              denseDistance:
                h.denseDistance == null
                  ? null
                  : Math.round(h.denseDistance * 1000) / 1000,
            },
          }
        : {}),
      ...(wantFitness
        ? {
            dialecticalFitness: Math.round(entry.fitness * 1000) / 1000,
            fitnessBreakdown: entry.fitnessBreakdown,
          }
        : {}),
    };
  });

  return NextResponse.json(
    {
      ok: true,
      query: { q, limit, scheme, against, againstClaimText, sort: wantFitness ? "dialectical_fitness" : "recent", mode },
      // Self-describing fitness formula — lets clients (and verifiers) read
      // the weights without round-tripping to source. (Pt. 3 §1.)
      fitnessFormula: wantFitness ? FITNESS_WEIGHTS : undefined,
      count: results.length,
      results,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=30",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
