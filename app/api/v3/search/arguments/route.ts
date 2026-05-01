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
 *
 * Returns ranked argument permalinks with attestation summaries.
 *
 * Public, cache-friendly. Used by MCP tools `search_arguments` and
 * `find_counterarguments`.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

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

  // Build query. We restrict to arguments that have a permalink (i.e. have
  // been surfaced publicly) and that are not in private deliberations.
  const where: any = {
    permalink: { isNot: null },
  };

  // Text matching across argument text and conclusion claim text.
  if (q) {
    where.OR = [
      { text: { contains: q, mode: "insensitive" } },
      { conclusion: { text: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (scheme) {
    where.argumentSchemes = {
      some: { scheme: { key: scheme } },
    };
  }

  // "against" mode: arguments whose conclusion textually contradicts the
  // target claim. This is a coarse v0 — a true negation index ships with
  // Track C.2 (stance retrieval).
  //
  // Honesty rule (Claude-feedback fix): arguments whose conclusion MOID
  // equals the target MOID are NOT counter-arguments to it; they restate
  // the same claim. Exclude them so an empty result is honestly empty
  // rather than the same argument echoing back.
  let againstClaimText: string | null = null;
  if (against) {
    const claim = await prisma.claim.findFirst({
      where: { moid: against },
      select: { text: true },
    });
    if (claim?.text) {
      againstClaimText = claim.text;
      // Heuristic: surface arguments whose conclusion mentions the same
      // subject phrase. Real stance detection is downstream.
      where.conclusion = {
        text: { contains: claim.text.split(/\s+/).slice(0, 4).join(" "), mode: "insensitive" },
        moid: { not: against },
      };
    }
  }

  // For dialectical-fitness sort we pull a wider candidate pool, then
  // re-rank in app code. For "recent" we just take the limit directly.
  const candidateLimit = wantFitness
    ? Math.min(FITNESS_CANDIDATE_CAP, limit * FITNESS_CANDIDATE_FACTOR)
    : limit;

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

  // Compute dialectical fitness per row when requested. We batch the per-row
  // counter queries with Promise.all and cap candidate count above so this
  // stays O(limit) in DB roundtrips, not O(n).
  let withFitness: Array<any> = rows
    .filter((r) => r.permalink?.shortCode)
    .map((r) => ({ row: r, fitness: 0 }));

  if (wantFitness) {
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
        const evidenceWithProvenance = (entry.row.conclusion?.ClaimEvidence ?? []).filter(
          (e: any) => !!e?.contentSha256
        ).length;
        entry.fitness =
          1.0 * cqAnswered +
          0.5 * supportEdges -
          0.7 * attackEdges -
          1.0 * attackCAs +
          0.25 * evidenceWithProvenance;
      })
    );

    withFitness.sort((a, b) => {
      if (b.fitness !== a.fitness) return b.fitness - a.fitness;
      const ad = a.row.createdAt ? +new Date(a.row.createdAt) : 0;
      const bd = b.row.createdAt ? +new Date(b.row.createdAt) : 0;
      return bd - ad;
    });
    withFitness = withFitness.slice(0, limit);
  }

  const results = withFitness.map(({ row: r, fitness }) => {
    const sc = r.permalink!.shortCode;
    const primaryScheme = r.argumentSchemes[0]?.scheme ?? null;
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
      accessCount: r.permalink!.accessCount,
      createdAt: r.createdAt?.toISOString() ?? null,
      attestationUrl: `${BASE_URL}/api/a/${sc}/aif?format=attestation`,
      ...(wantFitness ? { dialecticalFitness: Math.round(fitness * 1000) / 1000 } : {}),
    };
  });

  return NextResponse.json(
    {
      ok: true,
      query: { q, limit, scheme, against, againstClaimText, sort: wantFitness ? "dialectical_fitness" : "recent" },
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
