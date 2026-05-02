/**
 * ContestedFrontier — Track AI-EPI Pt. 4 §2.
 *
 * The set of dialectical *open edges* in a deliberation: the moves that
 * would actually shift the graph if engaged. This is the anti-centrist
 * substrate. An LLM consuming this object cannot produce "the truth is
 * somewhere between" prose without lying about a structured field —
 * the unanswered moves are listed by name and ranked by impact.
 *
 * `loadBearingnessRanking` is currently a heuristic (degree-based) rather
 * than a strict grounded-extension flip computation: removing an
 * argument and recomputing the extension over the deliberation's CEG is
 * O(n^2) in the worst case and is not the right operation to bake into
 * an MCP read path. The heuristic is honest about its shape: arguments
 * that *give* the most support to others, and conclude main-claim-path
 * conclusions, are ranked higher. A full grounded-extension version is
 * a sprint-2 candidate.
 */

import { prisma } from "@/lib/prismaclient";
import { computeMissingMoves } from "@/lib/deliberation/missingMoves";

export interface FrontierUnansweredUndercut {
  targetArgumentId: string;
  /**
   * Locator for which inference step this undercut targets within the
   * argument. `null` when the attack is conclusion-scoped (no sub-step).
   */
  inferenceLocator: string | null;
  /**
   * The challenger argument id when the undercut has been raised but not
   * yet answered. `null` when the undercut is *scheme-typical* (the
   * catalog says this scheme expects it) but no challenger exists yet.
   */
  challengerArgumentId: string | null;
  /** True when the absence comes from the scheme catalog rather than an actively-raised challenge. */
  schemeTypical: boolean;
  /** Scheme-catalog undercut key when `schemeTypical` is true; null otherwise. */
  undercutTypeKey: string | null;
  severity: "scheme-required" | "scheme-recommended" | "actively-raised";
}

export interface FrontierUnansweredUndermine {
  targetArgumentId: string;
  targetPremiseId: string;
  challengerArgumentId: string | null;
}

export interface FrontierUnansweredCQ {
  targetArgumentId: string;
  schemeKey: string;
  cqKey: string;
  cqPrompt: string;
  severity: "scheme-required" | "scheme-recommended";
}

export interface FrontierTerminalLeaf {
  argumentId: string;
  /** How far this argument sits from the deliberation's main-claim path (0 = on the path). */
  chainDepth: number;
  onMainConclusionPath: boolean;
}

export type FrontierSortBy = "loadBearingness" | "recency" | "severity";

export interface ContestedFrontier {
  deliberationId: string;
  unansweredUndercuts: FrontierUnansweredUndercut[];
  unansweredUndermines: FrontierUnansweredUndermine[];
  unansweredCqs: FrontierUnansweredCQ[];
  terminalLeaves: FrontierTerminalLeaf[];
  /** Argument ids ordered by frontier impact (highest first). */
  loadBearingnessRanking: string[];
}

export async function computeContestedFrontier(
  deliberationId: string,
  sortBy: FrontierSortBy = "loadBearingness",
): Promise<ContestedFrontier | null> {
  const deliberation = await prisma.deliberation.findUnique({
    where: { id: deliberationId },
    select: { id: true },
  });
  if (!deliberation) return null;

  const argRows = await prisma.argument.findMany({
    where: { deliberationId },
    select: {
      id: true,
      createdAt: true,
      conclusionClaimId: true,
      premises: { select: { claim: { select: { id: true } } } },
      argumentSchemes: {
        select: {
          isPrimary: true,
          order: true,
          scheme: {
            select: {
              key: true,
              cqs: { select: { cqKey: true, text: true } },
            },
          },
        },
        orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
      },
    },
  });

  const argIds = argRows.map((a) => a.id);

  const edges = await prisma.argumentEdge.findMany({
    where: { deliberationId },
    select: {
      type: true,
      attackType: true,
      fromArgumentId: true,
      toArgumentId: true,
      targetInferenceId: true,
      targetPremiseId: true,
    },
  });

  const cqStatuses = await prisma.cQStatus.findMany({
    where: {
      targetType: "argument",
      targetId: { in: argIds.length ? argIds : ["__none__"] },
    },
    select: {
      targetId: true,
      schemeKey: true,
      cqKey: true,
      statusEnum: true,
    },
  });

  // ────────────────────────────────────────────────────────────
  // unansweredUndercuts: actively-raised undercuts whose challenger
  // is itself unattacked (hence "unanswered") + scheme-typical
  // undercut absences from MissingMoveReport.
  // ────────────────────────────────────────────────────────────

  // Map every argument → ids of arguments attacking it.
  const attackersByArg = new Map<string, string[]>();
  for (const e of edges) {
    if (e.type === "rebut" || e.type === "undercut") {
      const list = attackersByArg.get(e.toArgumentId) ?? [];
      list.push(e.fromArgumentId);
      attackersByArg.set(e.toArgumentId, list);
    }
  }

  const unansweredUndercuts: FrontierUnansweredUndercut[] = [];
  for (const e of edges) {
    if (e.type !== "undercut") continue;
    // The undercut is "unanswered" if the challenger argument itself has
    // no inbound attacks.
    const challengerAttackers = attackersByArg.get(e.fromArgumentId) ?? [];
    if (challengerAttackers.length === 0) {
      unansweredUndercuts.push({
        targetArgumentId: e.toArgumentId,
        inferenceLocator: e.targetInferenceId ?? null,
        challengerArgumentId: e.fromArgumentId,
        schemeTypical: false,
        undercutTypeKey: null,
        severity: "actively-raised",
      });
    }
  }

  // Pull scheme-typical missing undercuts via MissingMoveReport.
  const missing = await computeMissingMoves(deliberationId);
  if (missing) {
    for (const argId of Object.keys(missing.perArgument)) {
      const m = missing.perArgument[argId];
      for (const u of m.missingUndercutTypes) {
        unansweredUndercuts.push({
          targetArgumentId: argId,
          inferenceLocator: null,
          challengerArgumentId: null,
          schemeTypical: true,
          undercutTypeKey: u.key,
          severity: u.severity,
        });
      }
    }
  }

  // ────────────────────────────────────────────────────────────
  // unansweredUndermines: rebut-edges with a targetPremiseId and no
  // counter-attack against the challenger.
  // ────────────────────────────────────────────────────────────

  const unansweredUndermines: FrontierUnansweredUndermine[] = [];
  for (const e of edges) {
    if (e.type !== "rebut" || !e.targetPremiseId) continue;
    const challengerAttackers = attackersByArg.get(e.fromArgumentId) ?? [];
    if (challengerAttackers.length === 0) {
      unansweredUndermines.push({
        targetArgumentId: e.toArgumentId,
        targetPremiseId: e.targetPremiseId,
        challengerArgumentId: e.fromArgumentId,
      });
    }
  }

  // ────────────────────────────────────────────────────────────
  // unansweredCqs: any catalog CQ with status OPEN or no row at all.
  // ────────────────────────────────────────────────────────────

  const unansweredCqs: FrontierUnansweredCQ[] = [];
  for (const a of argRows) {
    const primary =
      a.argumentSchemes.find((s) => s.isPrimary) ?? a.argumentSchemes[0] ?? null;
    if (!primary?.scheme?.key) continue;
    const cqs = primary.scheme.cqs ?? [];
    for (const cq of cqs) {
      const row = cqStatuses.find(
        (s) => s.targetId === a.id && s.cqKey === cq.cqKey,
      );
      const status = row?.statusEnum ?? "OPEN";
      if (status === "OPEN" || status === "DISPUTED") {
        unansweredCqs.push({
          targetArgumentId: a.id,
          schemeKey: primary.scheme.key,
          cqKey: cq.cqKey,
          cqPrompt: cq.text,
          // Severity: every catalog CQ is treated as scheme-required when
          // the scheme defines it. A finer split (required vs recommended)
          // would come from the CriticalQuestion.burdenOfProof field; left
          // as a refinement for sprint 2.
          severity: "scheme-required",
        });
      }
    }
  }

  // ────────────────────────────────────────────────────────────
  // terminalLeaves: arguments with no inbound attacks that sit at
  // chain-depth ≥ 1 from the main-conclusion path.
  // ────────────────────────────────────────────────────────────

  // Conclusions that no other argument premises against = "main"
  // conclusions. (Heuristic; refine post-D4.)
  const isPremiseClaim = new Set<string>();
  for (const a of argRows) {
    for (const p of a.premises) {
      if (p.claim?.id) isPremiseClaim.add(p.claim.id);
    }
  }
  const mainConclusionClaimIds = new Set<string>();
  for (const a of argRows) {
    if (a.conclusionClaimId && !isPremiseClaim.has(a.conclusionClaimId)) {
      mainConclusionClaimIds.add(a.conclusionClaimId);
    }
  }

  const terminalLeaves: FrontierTerminalLeaf[] = [];
  for (const a of argRows) {
    const attackers = attackersByArg.get(a.id) ?? [];
    if (attackers.length > 0) continue; // not a terminal leaf
    const onMainConclusionPath = a.conclusionClaimId
      ? mainConclusionClaimIds.has(a.conclusionClaimId)
      : false;
    terminalLeaves.push({
      argumentId: a.id,
      // Without a full chain reachability pass we report 0 / 1 only.
      chainDepth: onMainConclusionPath ? 0 : 1,
      onMainConclusionPath,
    });
  }

  // ────────────────────────────────────────────────────────────
  // loadBearingnessRanking: heuristic — number of arguments this one
  // supports + bonus for sitting on the main-conclusion path − inbound
  // attacks. Higher = more load-bearing.
  // ────────────────────────────────────────────────────────────

  const supportOutByArg = new Map<string, number>();
  const attackInByArg = new Map<string, number>();
  for (const e of edges) {
    if (e.type === "support") {
      supportOutByArg.set(
        e.fromArgumentId,
        (supportOutByArg.get(e.fromArgumentId) ?? 0) + 1,
      );
    } else if (e.type === "rebut" || e.type === "undercut") {
      attackInByArg.set(
        e.toArgumentId,
        (attackInByArg.get(e.toArgumentId) ?? 0) + 1,
      );
    }
  }

  const ranked = [...argRows].sort((a, b) => {
    const scoreA =
      (supportOutByArg.get(a.id) ?? 0) +
      (a.conclusionClaimId && mainConclusionClaimIds.has(a.conclusionClaimId)
        ? 2
        : 0) -
      (attackInByArg.get(a.id) ?? 0);
    const scoreB =
      (supportOutByArg.get(b.id) ?? 0) +
      (b.conclusionClaimId && mainConclusionClaimIds.has(b.conclusionClaimId)
        ? 2
        : 0) -
      (attackInByArg.get(b.id) ?? 0);
    if (scoreB !== scoreA) return scoreB - scoreA;
    // Tie-break: oldest first (more time to accrete dialectical traffic).
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
  const loadBearingnessRanking = ranked.map((a) => a.id);

  // ────────────────────────────────────────────────────────────
  // Sort the per-list outputs as requested.
  // ────────────────────────────────────────────────────────────

  if (sortBy === "loadBearingness") {
    const rank = new Map(loadBearingnessRanking.map((id, i) => [id, i] as const));
    const byRank = (a: { targetArgumentId: string }, b: { targetArgumentId: string }) =>
      (rank.get(a.targetArgumentId) ?? Infinity) -
      (rank.get(b.targetArgumentId) ?? Infinity);
    unansweredUndercuts.sort(byRank);
    unansweredUndermines.sort(byRank);
    unansweredCqs.sort(byRank);
  } else if (sortBy === "severity") {
    const sev = (s: string) =>
      s === "scheme-required" ? 0 : s === "scheme-recommended" ? 1 : 2;
    unansweredUndercuts.sort((a, b) => sev(a.severity) - sev(b.severity));
    unansweredCqs.sort((a, b) => sev(a.severity) - sev(b.severity));
  }
  // recency: arguments are already pulled in insertion order; no further sort.

  return {
    deliberationId,
    unansweredUndercuts,
    unansweredUndermines,
    unansweredCqs,
    terminalLeaves,
    loadBearingnessRanking,
  };
}
