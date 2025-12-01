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

// Logging helper for diagnostics
const DEBUG_ISOMORPHISMS = true;
function logIso(label: string, ...args: any[]) {
  if (DEBUG_ISOMORPHISMS) {
    console.log(`[ISOMORPHISM] ${label}`, ...args);
  }
}

/**
 * Check Plays(Views(S)) ≅ S (Proposition 4.18)
 * For innocent strategies, reconstructed plays should equal original
 */
export function checkPlaysViewsIsomorphism(strategy: Strategy): IsomorphismCheck {
  try {
    logIso("=== Plays(Views(S)) = S CHECK ===");
    logIso("Input strategy:", {
      id: strategy.id,
      player: strategy.player,
      playCount: strategy.plays.length,
    });
    
    // Log first few plays
    logIso("Original plays (first 5):");
    strategy.plays.slice(0, 5).forEach((p, i) => {
      logIso(`  Play ${i}:`, playToKey(p), `(length: ${p.sequence.length})`);
    });

    // Compute Views(S)
    const viewsResult = computeViews(strategy);
    const views = viewsResult.views;
    logIso("Views(S) computed:", {
      viewCount: views.length,
    });
    
    // Log first few views
    logIso("Computed views (first 5):");
    views.slice(0, 5).forEach((v, i) => {
      logIso(`  View ${i}:`, viewToKey(v), `(length: ${v.sequence.length})`);
    });

    // Compute Plays(Views(S))
    const playsResult = computePlays(views);
    const reconstructedPlays = playsResult.plays;
    logIso("Plays(Views(S)) computed:", {
      reconstructedCount: reconstructedPlays.length,
    });
    
    // Log first few reconstructed plays
    logIso("Reconstructed plays (first 5):");
    reconstructedPlays.slice(0, 5).forEach((p, i) => {
      logIso(`  Play ${i}:`, playToKey(p), `(length: ${p.sequence.length})`);
    });

    // Check if reconstructed strategy equals original
    const comparison = comparePlays(strategy.plays, reconstructedPlays);
    
    logIso("Comparison result:", {
      equal: comparison.equal,
      originalCount: strategy.plays.length,
      reconstructedCount: reconstructedPlays.length,
      missing: comparison.onlyInFirst,
      extra: comparison.onlyInSecond,
    });
    
    if (!comparison.equal) {
      logIso("Missing plays (in original but not reconstructed):");
      comparison.missingKeys.slice(0, 10).forEach((k, i) => {
        logIso(`  ${i}: ${k}`);
      });
      logIso("Extra plays (in reconstructed but not original):");
      comparison.extraKeys.slice(0, 10).forEach((k, i) => {
        logIso(`  ${i}: ${k}`);
      });
    }

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
    logIso("ERROR in checkPlaysViewsIsomorphism:", error.message, error.stack);
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
    logIso("=== Views(Plays(V)) = V CHECK ===");
    logIso("Input views:", { viewCount: views.length });
    
    if (views.length === 0) {
      logIso("Empty views, trivially holds");
      return {
        holds: true,
        checked: true,
      };
    }

    // Log first few views
    logIso("Original views (first 5):");
    views.slice(0, 5).forEach((v, i) => {
      logIso(`  View ${i}:`, viewToKey(v));
    });

    // Compute Plays(V)
    const playsResult = computePlays(views);
    logIso("Plays(V) computed:", { playCount: playsResult.plays.length });

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
    logIso("Views(Plays(V)) computed:", { reconstructedCount: reconstructedViews.length });

    // Log first few reconstructed views
    logIso("Reconstructed views (first 5):");
    reconstructedViews.slice(0, 5).forEach((v, i) => {
      logIso(`  View ${i}:`, viewToKey(v));
    });

    // Check if reconstructed views equal original
    const comparison = compareViews(views, reconstructedViews);
    
    logIso("Comparison result:", {
      equal: comparison.equal,
      originalCount: views.length,
      reconstructedCount: reconstructedViews.length,
      missing: comparison.onlyInFirst,
      extra: comparison.onlyInSecond,
    });

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
    logIso("ERROR in checkViewsPlaysIsomorphism:", error.message, error.stack);
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
    logIso("=== Disp(Ch(S)) = S CHECK ===");
    logIso("Input strategy:", {
      id: strategy.id,
      player: strategy.player,
      playCount: strategy.plays.length,
    });
    logIso("Counter designs:", counterDesigns.length);

    // Compute Ch(S)
    const chResult = computeCh(strategy);
    const chronicles = chResult.chronicles;
    logIso("Ch(S) computed:", { chronicleCount: chronicles.length });
    
    // Log first few chronicles
    logIso("Chronicles (first 5):");
    chronicles.slice(0, 5).forEach((c, i) => {
      logIso(`  Chronicle ${i}: actions=${c.actions?.length || 0}, polarity=${c.polarity}, isPositive=${c.isPositive}`);
    });

    // Reconstruct design from chronicles
    const designActs = chroniclesToActs(chronicles, strategy.designId);
    logIso("Reconstructed acts from chronicles:", designActs.length);
    designActs.slice(0, 5).forEach((a, i) => {
      logIso(`  Act ${i}: locus="${a.locusPath}", polarity=${a.polarity}`);
    });
    
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
    logIso("Disp(reconstructed) computed:", { disputeCount: dispResult.disputes.length });
    
    // Log first few disputes
    logIso("Disputes (first 3):");
    dispResult.disputes.slice(0, 3).forEach((d, i) => {
      logIso(`  Dispute ${i}: pairs=${d.pairs?.length || 0}, status=${d.status}`);
    });

    // Convert disputes to plays
    const reconstructedPlays = disputesToPlays(dispResult.disputes, strategy.player);
    logIso("Reconstructed plays from disputes:", reconstructedPlays.length);
    
    const reconstructedPlayObjs: Play[] = reconstructedPlays.map((p, idx) => ({
      id: `reconstructed-play-${idx}`,
      strategyId: strategy.id,
      sequence: p.sequence,
      length: p.length,
      isPositive: p.isPositive,
    }));

    // Log first few reconstructed plays
    logIso("Reconstructed plays (first 5):");
    reconstructedPlayObjs.slice(0, 5).forEach((p, i) => {
      logIso(`  Play ${i}:`, playToKey(p));
    });

    // Check if reconstructed strategy equals original
    const comparison = comparePlays(strategy.plays, reconstructedPlayObjs);
    
    logIso("Comparison result:", {
      equal: comparison.equal,
      originalCount: strategy.plays.length,
      reconstructedCount: reconstructedPlayObjs.length,
      missing: comparison.onlyInFirst,
      extra: comparison.onlyInSecond,
    });
    
    if (!comparison.equal) {
      logIso("Missing plays:");
      comparison.missingKeys.slice(0, 10).forEach((k, i) => logIso(`  ${i}: ${k}`));
      logIso("Extra plays:");
      comparison.extraKeys.slice(0, 10).forEach((k, i) => logIso(`  ${i}: ${k}`));
    }

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
    logIso("ERROR in checkDispChIsomorphism:", error.message, error.stack);
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
    logIso("=== Ch(Disp(D)) = D CHECK ===");
    logIso("Input design:", {
      id: design.id,
      participantId: design.participantId,
      actCount: design.acts.length,
    });
    logIso("Design acts:");
    design.acts.slice(0, 5).forEach((a, i) => {
      logIso(`  Act ${i}: locus="${a.locusPath}", polarity=${a.polarity}, kind=${a.kind}`);
    });
    logIso("Counter designs:", counterDesigns.length);

    // Compute Disp(D)
    const dispResult = computeDisp(design, counterDesigns);
    logIso("Disp(D) computed:", { disputeCount: dispResult.disputes.length });
    
    // Log first few disputes
    logIso("Disputes (first 3):");
    dispResult.disputes.slice(0, 3).forEach((d, i) => {
      logIso(`  Dispute ${i}: pairs=${d.pairs?.length || 0}, status=${d.status}`);
    });

    // Determine player from design
    const player: "P" | "O" = design.participantId === "Proponent" ? "P" : "O";
    logIso("Player determined:", player);

    // Convert disputes to strategy
    const plays = disputesToPlays(dispResult.disputes, player);
    logIso("Plays from disputes:", plays.length);
    
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
    
    logIso("Strategy plays (first 5):");
    strategy.plays.slice(0, 5).forEach((p, i) => {
      logIso(`  Play ${i}:`, playToKey(p));
    });

    // Compute Ch(S)
    const chResult = computeCh(strategy);
    logIso("Ch(S) computed:", { chronicleCount: chResult.chronicles.length });

    // Reconstruct design from chronicles
    const reconstructedActs = chroniclesToActs(chResult.chronicles, design.id);
    logIso("Reconstructed acts:", reconstructedActs.length);
    reconstructedActs.slice(0, 5).forEach((a, i) => {
      logIso(`  Act ${i}: locus="${a.locusPath}", polarity=${a.polarity}`);
    });

    // Compare original and reconstructed acts
    const originalActs = design.acts.map(a => ({
      locusPath: a.locusPath || "",
      polarity: a.polarity,
    }));

    const equal = compareActs(originalActs, reconstructedActs);
    
    logIso("Comparison result:", {
      equal,
      originalActCount: originalActs.length,
      reconstructedActCount: reconstructedActs.length,
    });
    
    if (!equal) {
      logIso("Original acts:", originalActs);
      logIso("Reconstructed acts:", reconstructedActs);
    }

    return {
      holds: equal,
      checked: true,
      evidence: equal ? undefined : {
        originalCount: originalActs.length,
        reconstructedCount: reconstructedActs.length,
      },
    };
  } catch (error: any) {
    logIso("ERROR in checkChDispIsomorphism:", error.message, error.stack);
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
  logIso("========================================");
  logIso("CHECKING ALL ISOMORPHISMS");
  logIso("========================================");
  logIso("Design:", { id: design.id, participantId: design.participantId, actCount: design.acts.length });
  logIso("Strategy:", { id: strategy.id, player: strategy.player, playCount: strategy.plays.length });
  logIso("Counter designs:", counterDesigns.map(cd => ({ id: cd.id, participantId: cd.participantId, actCount: cd.acts.length })));
  logIso("========================================");
  
  // Extract views from strategy
  const viewsResult = computeViews(strategy);
  logIso("Pre-computed views for Views(Plays(V))=V check:", viewsResult.views.length);

  const results = {
    playsViews: checkPlaysViewsIsomorphism(strategy),
    viewsPlays: checkViewsPlaysIsomorphism(viewsResult.views),
    dispCh: checkDispChIsomorphism(strategy, counterDesigns),
    chDisp: checkChDispIsomorphism(design, counterDesigns),
  };
  
  logIso("========================================");
  logIso("FINAL RESULTS:");
  logIso("  Plays(Views(S))=S:", results.playsViews.holds);
  logIso("  Views(Plays(V))=V:", results.viewsPlays.holds);
  logIso("  Disp(Ch(S))=S:", results.dispCh.holds);
  logIso("  Ch(Disp(D))=D:", results.chDisp.holds);
  logIso("========================================");
  
  return results;
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
