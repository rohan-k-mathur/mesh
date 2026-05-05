/**
 * SyntheticReadout — Track AI-EPI Pt. 4 §5.
 *
 * The editorial primitive. Composes fingerprint + frontier + missing
 * moves + chain exposure + (eventually) cross-context into a single
 * deliberation-scope object whose shape makes centrist-synthesis prose
 * structurally hard to construct.
 *
 * Hard invariant: this object carries *no free-prose fields beyond
 * `honestyLine`*. Every other field is structured. The `refusalSurface`
 * is the load-bearing piece — it enumerates exactly what the graph will
 * not license, so a synthesis that closes anyway is lying about a
 * structured field.
 *
 * `honestyLine` is a deterministic string template, not generative
 * prose. It must be a function of the contentHash alone.
 */

import { prisma } from "@/lib/prismaclient";
import {
  computeDeliberationFingerprint,
  computeDeliberationContentHash,
  type DeliberationFingerprint,
} from "@/lib/deliberation/fingerprint";
import {
  computeContestedFrontier,
  type ContestedFrontier,
} from "@/lib/deliberation/frontier";
import {
  computeMissingMoves,
  type MissingMoveReport,
} from "@/lib/deliberation/missingMoves";
import {
  computeChainExposure,
  computeArgumentMetricsBatch,
  type ChainExposure,
} from "@/lib/deliberation/chainExposure";
import {
  computeCrossDeliberationContext,
  type CrossDeliberationContext,
} from "@/lib/deliberation/crossContext";
import type { StandingState } from "@/lib/citations/argumentAttestation";

/**
 * Compact per-argument summary for the top of `loadBearingnessRanking`.
 * Lets a synthesis client name the high-impact arguments without making
 * 15-25 follow-up `get_argument` round trips. The list is bounded
 * (currently 25) and intended as orientation, not a substitute for
 * `get_argument` when a consumer needs full premise/citation detail.
 */
export interface TopArgumentSummary {
  /** Argument id. Stable. */
  id: string;
  /** Position in `frontier.loadBearingnessRanking` (0-indexed). */
  rankIndex: number;
  /** Authoring user id. Lets clients group by advocate / participant. */
  authorId: string;
  /** Authoring kind — HUMAN | AI | HYBRID. */
  authorKind: "HUMAN" | "AI" | "HYBRID";
  /** Conclusion claim id (if any). */
  conclusionClaimId: string | null;
  /** Conclusion claim text (truncated to 400 chars). */
  conclusionText: string | null;
  /** Argument prose (truncated to 400 chars). */
  argumentText: string | null;
  /** Primary scheme key (e.g. "cause_to_effect"), null if unschemed. */
  primarySchemeKey: string | null;
  /** 5-bucket standing label. Match other endpoints' semantics. */
  standing: StandingState;
  /** Catalog CQ answered / required for the primary scheme. */
  cqAnswered: number;
  cqRequired: number;
  /** Aggregated fitness total from `computeFitnessBreakdown`. */
  fitness: number;
}

/**
 * Same shape as `TopArgumentSummary`, plus `unansweredAttackCount`. Used
 * for the `mostContested` list — arguments ranked by *unanswered
 * actively-raised attacks against them*. Complements `topArguments`
 * (which is foundation-biased / degree-based) by surfacing
 * tested-undermined / tested-attacked material that the load-bearingness
 * heuristic misses.
 */
export interface ContestedArgumentSummary
  extends Omit<TopArgumentSummary, "rankIndex"> {
  /** Position in `frontier.contestednessRanking` (0-indexed). */
  rankIndex: number;
  /** How many unanswered actively-raised attacks target this argument. */
  unansweredAttackCount: number;
}

export interface RefusalSurfaceEntry {
  /** Shape only — no rendered prose. Conclusion claim text from the graph. */
  attemptedConclusion: string;
  /** Conclusion claim id this entry refers to. */
  conclusionClaimId: string;
  blockedBy:
    | "unanswered-undercut"
    | "unanswered-undermine"
    | "scheme-incompatibility"
    | "depth-thin";
  /** Argument or edge ids the consumer can drill into. */
  blockerIds: string[];
}

export interface SyntheticReadout {
  deliberationId: string;
  /** Identical to the fingerprint contentHash. The cache key for this object. */
  contentHash: string;
  fingerprint: DeliberationFingerprint;
  frontier: ContestedFrontier;
  missingMoves: MissingMoveReport;
  chains: ChainExposure;
  /**
   * Cross-deliberation projection (canonical-claim families, plexus
   * edges, sibling-room scheme reuse). May be `null` if cross-context
   * computation fails — treat as "no signal", not as "no canonical
   * links".
   */
  cross: CrossDeliberationContext | null;
  refusalSurface: {
    cannotConcludeBecause: RefusalSurfaceEntry[];
  };
  /**
   * Top-N arguments from `frontier.loadBearingnessRanking`, hydrated
   * with conclusion text, scheme, standing, and fitness. Lets a
   * synthesis client name the load-bearing pieces of the deliberation
   * in one round trip rather than 15-25 `get_argument` calls.
   * Currently bounded to the top 25.
   */
  topArguments: TopArgumentSummary[];
  /**
   * Top-N arguments from `frontier.contestednessRanking` (ranked by
   * unanswered actively-raised attacks). Surfaces tested-undermined /
   * tested-attacked material that `topArguments` (degree-based) misses.
   * Currently bounded to the top 25. May be empty when no actively-raised
   * attacks remain unanswered.
   */
  mostContested: ContestedArgumentSummary[];
  /**
   * Single-sentence deterministic caveat. *NOT* generative prose. A
   * function of the fingerprint alone — same contentHash → same string.
   */
  honestyLine: string;
}

export async function computeSyntheticReadout(
  deliberationId: string,
): Promise<SyntheticReadout | null> {
  // Cache check — keyed by (deliberationId, contentHash). The hash is
  // derived from the same graph projection the readout summarises, so
  // any change that would alter the readout invalidates the cache key
  // implicitly. No manual eviction required.
  let contentHash: string | null = null;
  try {
    contentHash = await computeDeliberationContentHash(deliberationId);
  } catch {
    contentHash = null;
  }

  if (contentHash) {
    const cached = await prisma.deliberationFingerprintCache.findUnique({
      where: {
        deliberationId_contentHash: { deliberationId, contentHash },
      },
      select: { payload: true },
    });
    if (cached?.payload) {
      return cached.payload as unknown as SyntheticReadout;
    }
  }

  const readout = await _computeSyntheticReadoutUncached(deliberationId);
  if (!readout) return null;

  // Persist asynchronously; failures here must not break the response.
  prisma.deliberationFingerprintCache
    .upsert({
      where: {
        deliberationId_contentHash: {
          deliberationId,
          contentHash: readout.contentHash,
        },
      },
      update: { payload: readout as unknown as object },
      create: {
        deliberationId,
        contentHash: readout.contentHash,
        payload: readout as unknown as object,
      },
    })
    .catch(() => {
      /* cache write failures are non-fatal */
    });

  return readout;
}

async function _computeSyntheticReadoutUncached(
  deliberationId: string,
): Promise<SyntheticReadout | null> {
  const fingerprint = await computeDeliberationFingerprint(deliberationId);
  if (!fingerprint) return null;

  const [frontier, missingMoves, chains, cross] = await Promise.all([
    computeContestedFrontier(deliberationId),
    computeMissingMoves(deliberationId),
    computeChainExposure(deliberationId),
    computeCrossDeliberationContext(deliberationId).catch(() => null),
  ]);
  if (!frontier || !missingMoves || !chains) return null;

  // ────────────────────────────────────────────────────────────
  // refusalSurface: any conclusion that the graph cannot currently
  // license. Implementation rule (Pt. 4 §5):
  //   - For each main-claim conclusion, if there is an unanswered
  //     undercut or undermine targeting an argument that concludes it,
  //     emit a `cannot-license` entry citing the blocker ids.
  //   - For thin deliberations (`extraction.articulationOnly` or
  //     `depthDistribution.thin >= argumentCount`), emit a single
  //     deliberation-wide "depth-thin" entry.
  //
  // A full grounded-extension projection is a sprint-2 refinement.
  // ────────────────────────────────────────────────────────────

  const conclusionClaimIds = [
    ...new Set(
      chains.uncoveredClaims.concat(
        chains.chains.map((c) => c.topClaimId).filter((x): x is string => !!x),
      ),
    ),
  ];

  const claimRows = conclusionClaimIds.length
    ? await prisma.claim.findMany({
        where: { id: { in: conclusionClaimIds } },
        select: { id: true, text: true },
      })
    : [];
  const claimText = new Map(claimRows.map((c) => [c.id, c.text] as const));

  // For each conclusion, walk arguments-that-conclude-it; if any has an
  // unanswered undercut or undermine, that conclusion is blocked.
  const argsByConclusion = await prisma.argument.findMany({
    where: {
      deliberationId,
      conclusionClaimId: { in: conclusionClaimIds.length ? conclusionClaimIds : ["__none__"] },
    },
    select: { id: true, conclusionClaimId: true },
  });

  const argsByClaim = new Map<string, string[]>();
  for (const a of argsByConclusion) {
    if (!a.conclusionClaimId) continue;
    const list = argsByClaim.get(a.conclusionClaimId) ?? [];
    list.push(a.id);
    argsByClaim.set(a.conclusionClaimId, list);
  }

  const refusalEntries: RefusalSurfaceEntry[] = [];
  for (const conclusionId of conclusionClaimIds) {
    const supportingArgIds = argsByClaim.get(conclusionId) ?? [];
    const blockingUndercuts = frontier.unansweredUndercuts.filter(
      (u) =>
        supportingArgIds.includes(u.targetArgumentId) && !u.schemeTypical,
    );
    const blockingUndermines = frontier.unansweredUndermines.filter((u) =>
      supportingArgIds.includes(u.targetArgumentId),
    );
    if (blockingUndercuts.length > 0) {
      refusalEntries.push({
        attemptedConclusion: claimText.get(conclusionId) ?? conclusionId,
        conclusionClaimId: conclusionId,
        blockedBy: "unanswered-undercut",
        blockerIds: blockingUndercuts
          .map((u) => u.challengerArgumentId)
          .filter((x): x is string => !!x),
      });
    }
    if (blockingUndermines.length > 0) {
      refusalEntries.push({
        attemptedConclusion: claimText.get(conclusionId) ?? conclusionId,
        conclusionClaimId: conclusionId,
        blockedBy: "unanswered-undermine",
        blockerIds: blockingUndermines
          .map((u) => u.challengerArgumentId)
          .filter((x): x is string => !!x),
      });
    }
  }

  // Depth-thin deliberation — one entry covers all conclusions.
  if (
    fingerprint.argumentCount > 0 &&
    fingerprint.depthDistribution.thin === fingerprint.argumentCount
  ) {
    refusalEntries.push({
      attemptedConclusion: "<deliberation-scope>",
      conclusionClaimId: "",
      blockedBy: "depth-thin",
      blockerIds: [],
    });
  }

  // ────────────────────────────────────────────────────────────
  // topArguments + mostContested — hydrate the heads of
  // `loadBearingnessRanking` (foundation-biased, degree-based) and
  // `contestednessRanking` (unanswered-attacks-against). The two lists
  // answer different questions: topArguments = "what's load-bearing?",
  // mostContested = "what's actually being challenged?". A synthesis
  // client should look at both before producing a closer.
  // ────────────────────────────────────────────────────────────
  const TOP_N = 25;
  const TEXT_TRUNC = 400;
  const topIds = frontier.loadBearingnessRanking.slice(0, TOP_N);
  const contestedEntries = frontier.contestednessRanking.slice(0, TOP_N);
  const contestedIds = contestedEntries.map((c) => c.argumentId);
  const allIds = [...new Set([...topIds, ...contestedIds])];

  let topArguments: TopArgumentSummary[] = [];
  let mostContested: ContestedArgumentSummary[] = [];

  if (allIds.length > 0) {
    const [allRows, allMetrics] = await Promise.all([
      prisma.argument.findMany({
        where: { id: { in: allIds } },
        select: {
          id: true,
          authorId: true,
          authorKind: true,
          text: true,
          conclusionClaimId: true,
          conclusion: { select: { text: true } },
          argumentSchemes: {
            select: {
              isPrimary: true,
              order: true,
              scheme: { select: { id: true, key: true } },
            },
            orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
          },
        },
      }),
      computeArgumentMetricsBatch(allIds, deliberationId),
    ]);
    const rowById = new Map(allRows.map((r) => [r.id, r] as const));
    const truncate = (s: string | null | undefined) =>
      !s ? null : s.length > TEXT_TRUNC ? s.slice(0, TEXT_TRUNC) + "…" : s;

    const baseSummary = (
      id: string,
      idx: number,
    ): TopArgumentSummary | null => {
      const r = rowById.get(id);
      const m = allMetrics.get(id);
      if (!r) return null;
      const primaryScheme =
        r.argumentSchemes.find((s) => s.isPrimary) ?? r.argumentSchemes[0];
      return {
        id: r.id,
        rankIndex: idx,
        authorId: r.authorId,
        authorKind: r.authorKind as "HUMAN" | "AI" | "HYBRID",
        conclusionClaimId: r.conclusionClaimId,
        conclusionText: truncate(r.conclusion?.text),
        argumentText: truncate(r.text),
        primarySchemeKey: primaryScheme?.scheme?.key ?? null,
        standing: m?.standing ?? "untested-default",
        cqAnswered: m?.cqAnswered ?? 0,
        cqRequired: m?.cqRequired ?? 0,
        fitness: m?.fitness.total ?? 0,
      };
    };

    topArguments = topIds
      .map((id, idx) => baseSummary(id, idx))
      .filter((x): x is TopArgumentSummary => x !== null);

    mostContested = contestedEntries
      .map((entry, idx) => {
        const base = baseSummary(entry.argumentId, idx);
        if (!base) return null;
        return {
          ...base,
          unansweredAttackCount: entry.unansweredAttackCount,
        } satisfies ContestedArgumentSummary;
      })
      .filter((x): x is ContestedArgumentSummary => x !== null);
  }

  // ────────────────────────────────────────────────────────────
  // honestyLine — deterministic template, not free prose.
  // ────────────────────────────────────────────────────────────

  const refusalCount = refusalEntries.length;
  const cqPct =
    fingerprint.cqCoverage.total > 0
      ? Math.round(
          (fingerprint.cqCoverage.answered / fingerprint.cqCoverage.total) * 100,
        )
      : 0;
  const honestyLine =
    `This deliberation has ${fingerprint.argumentCount} argument(s), ` +
    `${fingerprint.medianChallengerCount} median challenger(s) per argument, and ` +
    `${cqPct}% catalog-CQ coverage. ` +
    `${fingerprint.chainCount} chain(s) on file; ` +
    `${refusalCount} potential conclusion(s) are not licensed by the current graph.`;

  return {
    deliberationId,
    contentHash: fingerprint.contentHash,
    fingerprint,
    frontier,
    missingMoves,
    chains,
    cross,
    refusalSurface: { cannotConcludeBecause: refusalEntries },
    topArguments,
    mostContested,
    honestyLine,
  };
}
