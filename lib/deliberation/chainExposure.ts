/**
 * ChainExposure — Track AI-EPI Pt. 4 §4.
 *
 * Read-side projection over `ArgumentChain` records. Surfaces chains as
 * first-class deliberation-scope objects (independent of D4's write-side
 * embedding into Living Thesis). Lets an LLM reading this object say
 * "the strongest empirical-side chain runs A→B→C; weakest link is B
 * (depth thin, CQ confounding unanswered)" — sentences the current MCP
 * surface cannot ground.
 */

import { prisma } from "@/lib/prismaclient";
import {
  computeFitnessBreakdown,
  computeStandingState,
  type StandingState,
  type FitnessBreakdown,
} from "@/lib/citations/argumentAttestation";
import { classifyStandingConfidence } from "@/config/standingThresholds";

export interface ChainEdgeProjection {
  from: string;
  to: string;
  /**
   * Edge type from `ArgumentChainEdgeType` enum. We collapse the full
   * enum down to the three semantically-meaningful kinds for retrieval
   * consumers; the raw enum is preserved as `rawType`.
   */
  type: "PRESUPPOSES" | "ENABLES" | "ATTACKS";
  rawType: string;
}

export interface ChainProjection {
  id: string;
  name: string;
  /**
   * The top claim of the chain (the ArgumentChainNode marked CONCLUSION,
   * or the last node if no role assigned).
   */
  topClaimId: string | null;
  topConclusionText: string | null;
  /** ArgumentIds in traversal order (root → leaves, or chain insertion order). */
  arguments: string[];
  edges: ChainEdgeProjection[];
  /** Worst-link standing across all arguments in the chain. */
  chainStanding: StandingState;
  /** Aggregated fitness — sum of per-argument component counts, normalized. */
  chainFitness: FitnessBreakdown;
  /** The argument with lowest fitness or most-unanswered CQs. */
  weakestLink: { argumentId: string; reason: string };
}

export interface ChainExposure {
  deliberationId: string;
  chains: ChainProjection[];
  /** Top-level claim ids (conclusions of arguments) with no chain reaching them. */
  uncoveredClaims: string[];
}

const STANDING_RANK: Record<StandingState, number> = {
  "untested-default": 0,
  "untested-supported": 1,
  "tested-attacked": 2,
  "tested-undermined": 3,
  "tested-survived": 4,
};

function collapseChainEdgeType(
  raw: string,
): "PRESUPPOSES" | "ENABLES" | "ATTACKS" {
  if (raw === "REFUTES" || raw === "REBUTS" || raw === "UNDERCUTS" || raw === "UNDERMINES") {
    return "ATTACKS";
  }
  if (raw === "PRESUPPOSES") return "PRESUPPOSES";
  // SUPPORTS, ENABLES, QUALIFIES, EXEMPLIFIES, GENERALIZES → ENABLES
  return "ENABLES";
}

export async function computeChainExposure(
  deliberationId: string,
): Promise<ChainExposure | null> {
  const deliberation = await prisma.deliberation.findUnique({
    where: { id: deliberationId },
    select: { id: true },
  });
  if (!deliberation) return null;

  const chains = await prisma.argumentChain.findMany({
    where: { deliberationId },
    select: {
      id: true,
      name: true,
      nodes: {
        select: {
          id: true,
          argumentId: true,
          nodeOrder: true,
          role: true,
          argument: {
            select: {
              id: true,
              conclusionClaimId: true,
              conclusion: { select: { text: true } },
            },
          },
        },
        orderBy: { nodeOrder: "asc" },
      },
      edges: {
        select: {
          sourceNodeId: true,
          targetNodeId: true,
          edgeType: true,
        },
      },
    },
  });

  // For every argument referenced by any chain, compute its standing +
  // fitness once, in a single pass.
  const referencedArgIds = [
    ...new Set(chains.flatMap((c) => c.nodes.map((n) => n.argumentId))),
  ];

  const argMetrics = await computeArgumentMetricsBatch(
    referencedArgIds,
    deliberationId,
  );

  const projections: ChainProjection[] = chains.map((c) => {
    const nodeIdToArgId = new Map(c.nodes.map((n) => [n.id, n.argumentId] as const));
    const argIds = c.nodes.map((n) => n.argumentId);

    // top claim = the node with role CONCLUSION, else the last node.
    const conclusionNode =
      c.nodes.find((n) => n.role === "CONCLUSION") ?? c.nodes[c.nodes.length - 1];
    const topClaimId = conclusionNode?.argument?.conclusionClaimId ?? null;
    const topConclusionText = conclusionNode?.argument?.conclusion?.text ?? null;

    // worst-link standing
    let worstStanding: StandingState = "tested-survived";
    let worstStandingRank = STANDING_RANK[worstStanding];
    for (const a of argIds) {
      const m = argMetrics.get(a);
      if (!m) continue;
      const rank = STANDING_RANK[m.standing];
      if (rank < worstStandingRank) {
        worstStanding = m.standing;
        worstStandingRank = rank;
      }
    }
    if (argIds.length === 0) worstStanding = "untested-default";

    // aggregated fitness: sum component counts, then re-derive contributions.
    const summed = {
      cqAnswered: 0,
      supportEdges: 0,
      attackEdges: 0,
      attackCAs: 0,
      evidenceWithProvenance: 0,
    };
    for (const a of argIds) {
      const m = argMetrics.get(a);
      if (!m) continue;
      summed.cqAnswered += m.fitness.components.cqAnswered.count;
      summed.supportEdges += m.fitness.components.supportEdges.count;
      summed.attackEdges += m.fitness.components.attackEdges.count;
      summed.attackCAs += m.fitness.components.attackCAs.count;
      summed.evidenceWithProvenance +=
        m.fitness.components.evidenceWithProvenance.count;
    }
    const chainFitness = computeFitnessBreakdown(summed);

    // weakest link: argument with lowest fitness; tie-break by most missing CQs.
    let weakestArgId = argIds[0] ?? "";
    let weakestReason = "lowest fitness in chain";
    let weakestScore = Number.POSITIVE_INFINITY;
    for (const a of argIds) {
      const m = argMetrics.get(a);
      if (!m) continue;
      if (m.fitness.total < weakestScore) {
        weakestScore = m.fitness.total;
        weakestArgId = a;
        const missingCqs = m.cqRequired - m.cqAnswered;
        weakestReason =
          missingCqs > 0
            ? `lowest fitness (${m.fitness.total}); ${missingCqs} unanswered CQ(s)`
            : `lowest fitness (${m.fitness.total})`;
      }
    }

    const edges: ChainEdgeProjection[] = c.edges.map((e) => {
      const fromArg = nodeIdToArgId.get(e.sourceNodeId) ?? "";
      const toArg = nodeIdToArgId.get(e.targetNodeId) ?? "";
      return {
        from: fromArg,
        to: toArg,
        type: collapseChainEdgeType(String(e.edgeType)),
        rawType: String(e.edgeType),
      };
    });

    return {
      id: c.id,
      name: c.name,
      topClaimId,
      topConclusionText,
      arguments: argIds,
      edges,
      chainStanding: worstStanding,
      chainFitness,
      weakestLink: { argumentId: weakestArgId, reason: weakestReason },
    };
  });

  // uncoveredClaims: top-level conclusion claims (no other arg uses them as
  // a premise) that no chain reaches.
  const allArgRows = await prisma.argument.findMany({
    where: { deliberationId },
    select: {
      conclusionClaimId: true,
      premises: { select: { claim: { select: { id: true } } } },
    },
  });
  const isPremise = new Set<string>();
  for (const a of allArgRows) {
    for (const p of a.premises) {
      if (p.claim?.id) isPremise.add(p.claim.id);
    }
  }
  const conclusionClaimIds = new Set<string>();
  for (const a of allArgRows) {
    if (a.conclusionClaimId && !isPremise.has(a.conclusionClaimId)) {
      conclusionClaimIds.add(a.conclusionClaimId);
    }
  }
  const claimsCoveredByChain = new Set(
    projections.map((p) => p.topClaimId).filter((x): x is string => !!x),
  );
  const uncoveredClaims = [...conclusionClaimIds].filter(
    (c) => !claimsCoveredByChain.has(c),
  );

  return {
    deliberationId,
    chains: projections,
    uncoveredClaims,
  };
}

// ────────────────────────────────────────────────────────────
// Internal: per-argument metrics in a batched query.
// ────────────────────────────────────────────────────────────

interface ArgMetrics {
  fitness: FitnessBreakdown;
  standing: StandingState;
  cqAnswered: number;
  cqRequired: number;
}

async function computeArgumentMetricsBatch(
  argIds: string[],
  deliberationId: string,
): Promise<Map<string, ArgMetrics>> {
  const out = new Map<string, ArgMetrics>();
  if (argIds.length === 0) return out;

  const args = await prisma.argument.findMany({
    where: { id: { in: argIds } },
    select: {
      id: true,
      conclusionClaimId: true,
      argumentSchemes: {
        select: {
          isPrimary: true,
          order: true,
          scheme: { select: { cqs: { select: { cqKey: true } } } },
        },
        orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
      },
      conclusion: {
        select: {
          ClaimEvidence: {
            select: { contentSha256: true, archivedUrl: true },
          },
        },
      },
    },
  });

  const edges = await prisma.argumentEdge.findMany({
    where: { deliberationId, toArgumentId: { in: argIds } },
    select: { type: true, toArgumentId: true },
  });

  const conclusionIds = args
    .map((a) => a.conclusionClaimId)
    .filter((x): x is string => !!x);

  const cas = await prisma.conflictApplication.findMany({
    where: {
      deliberationId,
      OR: [
        { conflictedArgumentId: { in: argIds } },
        {
          conflictedClaimId: {
            in: conclusionIds.length ? conclusionIds : ["__none__"],
          },
        },
      ],
    },
    select: {
      conflictedArgumentId: true,
      conflictedClaimId: true,
    },
  });

  const cqStatuses = await prisma.cQStatus.findMany({
    where: {
      targetType: "argument",
      targetId: { in: argIds },
    },
    select: { targetId: true, statusEnum: true },
  });

  const claimToArg = new Map<string, string>();
  for (const a of args) {
    if (a.conclusionClaimId) claimToArg.set(a.conclusionClaimId, a.id);
  }

  for (const a of args) {
    const cqRequired =
      (a.argumentSchemes.find((s) => s.isPrimary) ?? a.argumentSchemes[0])?.scheme
        ?.cqs?.length ?? 0;
    const argCqs = cqStatuses.filter((s) => s.targetId === a.id);
    const cqAnswered = argCqs.filter((s) => s.statusEnum === "SATISFIED").length;

    const argEdges = edges.filter((e) => e.toArgumentId === a.id);
    const supportEdges = argEdges.filter((e) => e.type === "support").length;
    const attackEdges = argEdges.filter(
      (e) => e.type === "rebut" || e.type === "undercut",
    ).length;

    const argCas = cas.filter(
      (c) =>
        c.conflictedArgumentId === a.id ||
        (c.conflictedClaimId && claimToArg.get(c.conflictedClaimId) === a.id),
    ).length;

    const evidenceWithProvenance =
      a.conclusion?.ClaimEvidence?.filter(
        (e) => !!(e.contentSha256 || e.archivedUrl),
      ).length ?? 0;

    const fitness = computeFitnessBreakdown({
      cqAnswered,
      supportEdges,
      attackEdges,
      attackCAs: argCas,
      evidenceWithProvenance,
    });

    const isTested =
      cqAnswered >= 2 || (argCas + attackEdges >= 1 && supportEdges >= 1);
    const standing = computeStandingState({
      isTested,
      criticalQuestionsAnswered: cqAnswered,
      incomingAttacks: argCas,
      incomingAttackEdges: attackEdges,
      incomingSupports: supportEdges,
    });

    out.set(a.id, {
      fitness,
      standing,
      cqAnswered,
      cqRequired,
    });
  }

  // Silence unused-import warning for classifyStandingConfidence.
  void classifyStandingConfidence;

  return out;
}
