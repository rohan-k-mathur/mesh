/**
 * Isomorphism Checkers
 * 
 * Based on Faggian & Hyland (2002) - §4.3
 * Implements the four isomorphism checks:
 * - Proposition 4.18: Plays(Views(S)) ≅ S
 * - Proposition 4.18: Views(Plays(V)) ≅ V
 * - Proposition 4.27: Disp(Ch(S)) ≅ S
 * - Proposition 4.27: Ch(Disp(D)) ≅ D
 */

import type { Action, View, Chronicle, Dispute, Position } from "../types";
import type { Strategy, Play } from "../strategy/types";
import type {
  IsomorphismCheck,
  IsomorphismResults,
  IsomorphismEvidence,
  DesignForCorrespondence,
} from "./types";
import { computeViews, computePlays } from "../strategy/operations";
import { computeDisp, disputesToPlays } from "./disp";
import { computeCh, chroniclesToActs } from "./ch";

/**
 * Check Plays(Views(S)) ≅ S (Proposition 4.18)
 * For innocent strategies, reconstructed plays should equal original
 */
export function checkPlaysViewsIsomorphism(strategy: Strategy): IsomorphismCheck {
  try {
    // Compute Views(S)
    const viewsResult = computeViews(strategy);
    const views = viewsResult.views;

    // Compute Plays(Views(S))
    const playsResult = computePlays(views);
    const reconstructedPlays = playsResult.plays;

    // Check if reconstructed strategy equals original
    const comparison = comparePlays(strategy.plays, reconstructedPlays);

    return {
      holds: comparison.equal,
      checked: true,
      evidence: comparison.equal ? undefined : {
        originalCount: strategy.plays.length,
        reconstructedCount: reconstructedPlays.length,
        difference: {
          inOriginal: comparison.onlyInFirst,
          inReconstructed: comparison.onlyInSecond,
          missing: comparison.missingKeys.slice(0, 5),
          extra: comparison.extraKeys.slice(0, 5),
        },
      },
    };
  } catch (error: any) {
    return {
      holds: false,
      checked: true,
      evidence: { error: error.message },
    };
  }
}

/**
 * Check Views(Plays(V)) ≅ V (Proposition 4.18 dual)
 * For view-sets, reconstructed views should equal original
 */
export function checkViewsPlaysIsomorphism(views: View[]): IsomorphismCheck {
  try {
    if (views.length === 0) {
      return {
        holds: true,
        checked: true,
      };
    }

    // Compute Plays(V)
    const playsResult = computePlays(views);

    // Build a temporary strategy from plays
    const tempStrategy: Strategy = {
      id: "temp-strategy",
      designId: views[0].designId,
      player: views[0].player,
      plays: playsResult.plays,
      isInnocent: true,
      satisfiesPropagation: true,
    };

    // Compute Views(Plays(V))
    const viewsResult = computeViews(tempStrategy);
    const reconstructedViews = viewsResult.views;

    // Check if reconstructed views equal original
    const comparison = compareViews(views, reconstructedViews);

    return {
      holds: comparison.equal,
      checked: true,
      evidence: comparison.equal ? undefined : {
        originalCount: views.length,
        reconstructedCount: reconstructedViews.length,
        difference: {
          inOriginal: comparison.onlyInFirst,
          inReconstructed: comparison.onlyInSecond,
          missing: comparison.missingKeys.slice(0, 5),
          extra: comparison.extraKeys.slice(0, 5),
        },
      },
    };
  } catch (error: any) {
    return {
      holds: false,
      checked: true,
      evidence: { error: error.message },
    };
  }
}

/**
 * Check Disp(Ch(S)) ≅ S (Proposition 4.27)
 * For innocent strategies with propagation
 */
export function checkDispChIsomorphism(
  strategy: Strategy,
  counterDesigns: DesignForCorrespondence[]
): IsomorphismCheck {
  try {
    // Compute Ch(S)
    const chResult = computeCh(strategy);
    const chronicles = chResult.chronicles;

    // Reconstruct design from chronicles
    const designActs = chroniclesToActs(chronicles, strategy.designId);
    const reconstructedDesign: DesignForCorrespondence = {
      id: strategy.designId,
      deliberationId: "",
      participantId: strategy.player === "P" ? "Proponent" : "Opponent",
      acts: designActs.map((act, idx) => ({
        id: `reconstructed-act-${idx}`,
        designId: strategy.designId,
        kind: act.locusPath === "0" ? "INITIAL" as const : "POSITIVE" as const,
        polarity: act.polarity,
        locusPath: act.locusPath,
        ramification: act.ramification,
      })),
      loci: [],
    };

    // Compute Disp(reconstructedDesign)
    const dispResult = computeDisp(reconstructedDesign, counterDesigns);

    // Convert disputes to plays
    const reconstructedPlays = disputesToPlays(dispResult.disputes, strategy.player);
    const reconstructedPlayObjs: Play[] = reconstructedPlays.map((p, idx) => ({
      id: `reconstructed-play-${idx}`,
      strategyId: strategy.id,
      sequence: p.sequence,
      length: p.length,
      isPositive: p.isPositive,
    }));

    // Check if reconstructed strategy equals original
    const comparison = comparePlays(strategy.plays, reconstructedPlayObjs);

    return {
      holds: comparison.equal,
      checked: true,
      evidence: comparison.equal ? undefined : {
        originalCount: strategy.plays.length,
        reconstructedCount: reconstructedPlayObjs.length,
        difference: {
          inOriginal: comparison.onlyInFirst,
          inReconstructed: comparison.onlyInSecond,
          missing: comparison.missingKeys.slice(0, 5),
          extra: comparison.extraKeys.slice(0, 5),
        },
      },
    };
  } catch (error: any) {
    return {
      holds: false,
      checked: true,
      evidence: { error: error.message },
    };
  }
}

/**
 * Check Ch(Disp(D)) ≅ D (Proposition 4.27 dual)
 * For designs that correspond to innocent strategies
 */
export function checkChDispIsomorphism(
  design: DesignForCorrespondence,
  counterDesigns: DesignForCorrespondence[]
): IsomorphismCheck {
  try {
    // Compute Disp(D)
    const dispResult = computeDisp(design, counterDesigns);

    // Determine player from design
    const player: "P" | "O" = design.participantId === "Proponent" ? "P" : "O";

    // Convert disputes to strategy
    const plays = disputesToPlays(dispResult.disputes, player);
    const strategy: Strategy = {
      id: design.id,
      designId: design.id,
      player,
      plays: plays.map((p, idx) => ({
        id: `play-${idx}`,
        strategyId: design.id,
        sequence: p.sequence,
        length: p.length,
        isPositive: p.isPositive,
      })),
      isInnocent: false,
      satisfiesPropagation: false,
    };

    // Compute Ch(S)
    const chResult = computeCh(strategy);

    // Reconstruct design from chronicles
    const reconstructedActs = chroniclesToActs(chResult.chronicles, design.id);

    // Compare original and reconstructed acts
    const originalActs = design.acts.map(a => ({
      locusPath: a.locusPath || "",
      polarity: a.polarity,
    }));

    const equal = compareActs(originalActs, reconstructedActs);

    return {
      holds: equal,
      checked: true,
      evidence: equal ? undefined : {
        originalCount: originalActs.length,
        reconstructedCount: reconstructedActs.length,
      },
    };
  } catch (error: any) {
    return {
      holds: false,
      checked: true,
      evidence: { error: error.message },
    };
  }
}

/**
 * Check all four isomorphisms
 */
export function checkAllIsomorphisms(
  design: DesignForCorrespondence,
  strategy: Strategy,
  counterDesigns: DesignForCorrespondence[]
): IsomorphismResults {
  // Extract views from strategy
  const viewsResult = computeViews(strategy);

  return {
    playsViews: checkPlaysViewsIsomorphism(strategy),
    viewsPlays: checkViewsPlaysIsomorphism(viewsResult.views),
    dispCh: checkDispChIsomorphism(strategy, counterDesigns),
    chDisp: checkChDispIsomorphism(design, counterDesigns),
  };
}

/**
 * Check if all isomorphisms hold
 */
export function allIsomorphismsHold(results: IsomorphismResults): boolean {
  return (
    results.playsViews.holds &&
    results.viewsPlays.holds &&
    results.dispCh.holds &&
    results.chDisp.holds
  );
}

// Helper functions

/**
 * Compare two sets of plays
 */
function comparePlays(
  plays1: Play[],
  plays2: Play[]
): {
  equal: boolean;
  onlyInFirst: number;
  onlyInSecond: number;
  missingKeys: string[];
  extraKeys: string[];
} {
  const set1 = new Set(plays1.map(p => playToKey(p)));
  const set2 = new Set(plays2.map(p => playToKey(p)));

  const onlyInFirst = Array.from(set1).filter(k => !set2.has(k));
  const onlyInSecond = Array.from(set2).filter(k => !set1.has(k));

  return {
    equal: onlyInFirst.length === 0 && onlyInSecond.length === 0,
    onlyInFirst: onlyInFirst.length,
    onlyInSecond: onlyInSecond.length,
    missingKeys: onlyInFirst,
    extraKeys: onlyInSecond,
  };
}

/**
 * Compare two sets of views
 */
function compareViews(
  views1: View[],
  views2: View[]
): {
  equal: boolean;
  onlyInFirst: number;
  onlyInSecond: number;
  missingKeys: string[];
  extraKeys: string[];
} {
  const set1 = new Set(views1.map(v => viewToKey(v)));
  const set2 = new Set(views2.map(v => viewToKey(v)));

  const onlyInFirst = Array.from(set1).filter(k => !set2.has(k));
  const onlyInSecond = Array.from(set2).filter(k => !set1.has(k));

  return {
    equal: onlyInFirst.length === 0 && onlyInSecond.length === 0,
    onlyInFirst: onlyInFirst.length,
    onlyInSecond: onlyInSecond.length,
    missingKeys: onlyInFirst,
    extraKeys: onlyInSecond,
  };
}

/**
 * Compare design acts
 */
function compareActs(
  acts1: { locusPath: string; polarity: "P" | "O" }[],
  acts2: { locusPath: string; polarity: "P" | "O"; ramification: number[] }[]
): boolean {
  if (acts1.length !== acts2.length) return false;

  const map1 = new Map(acts1.map(a => [a.locusPath, a.polarity]));
  const map2 = new Map(acts2.map(a => [a.locusPath, a.polarity]));

  for (const [path, pol] of map1) {
    if (map2.get(path) !== pol) return false;
  }

  for (const [path, pol] of map2) {
    if (map1.get(path) !== pol) return false;
  }

  return true;
}

/**
 * Create unique key for play
 */
function playToKey(play: Play): string {
  return play.sequence.map(a => `${a.focus}:${a.polarity}`).join("|");
}

/**
 * Create unique key for view
 */
function viewToKey(view: View): string {
  return view.sequence.map(a => `${a.focus}:${a.polarity}`).join("|");
}
