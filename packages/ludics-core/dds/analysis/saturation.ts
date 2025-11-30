/**
 * DDS Phase 5 - Part 3: Saturation Analysis
 * 
 * Based on Faggian & Hyland (2002) - Proposition 4.17
 * 
 * Strategy S is saturated if Views(S) = S
 * i.e., extracting views and reconstructing gives back the same strategy.
 */

import type { View } from "../types";
import type { Strategy, Play } from "../strategy/types";
import type { DesignForCorrespondence } from "../correspondence/types";
import type {
  SaturationResult,
  SaturationProof,
  SaturationViolation,
  SaturationClosureResult,
  createSaturationResult,
} from "./types";

/**
 * Check saturation property (Proposition 4.17)
 * 
 * Strategy S is saturated if Views(S) = S
 * i.e., extracting views and reconstructing gives back the same strategy.
 */
export async function checkSaturation(
  strategy: Strategy,
  allDesigns: DesignForCorrespondence[]
): Promise<SaturationResult> {
  // Step 1: Extract all views from strategy
  const views = await extractViewsFromStrategy(strategy);

  // Step 2: Compute Plays(views) to reconstruct strategy
  const playsResult = await computePlaysFromViews(views, strategy.player);

  // Step 3: Compare reconstructed strategy with original
  const originalPlayIds = new Set(strategy.plays.map((p) => playToKey(p)));
  const reconstructedPlayIds = new Set(playsResult.plays.map((p) => playToKey(p)));

  // Check forward containment: original ⊆ reconstructed
  const missingInReconstructed: string[] = [];
  for (const playKey of originalPlayIds) {
    if (!reconstructedPlayIds.has(playKey)) {
      missingInReconstructed.push(playKey);
    }
  }

  // Check backward containment: reconstructed ⊆ original
  const extraInReconstructed: string[] = [];
  for (const playKey of reconstructedPlayIds) {
    if (!originalPlayIds.has(playKey)) {
      extraInReconstructed.push(playKey);
    }
  }

  const isSaturated =
    missingInReconstructed.length === 0 && extraInReconstructed.length === 0;

  // Build violations if not saturated
  const violations: SaturationViolation[] = [];

  if (missingInReconstructed.length > 0) {
    violations.push({
      type: "missing",
      itemIds: missingInReconstructed,
      description: `${missingInReconstructed.length} plays from original not in reconstructed`,
    });
  }

  if (extraInReconstructed.length > 0) {
    violations.push({
      type: "extra",
      itemIds: extraInReconstructed,
      description: `${extraInReconstructed.length} extra plays in reconstructed`,
    });
  }

  return {
    strategyId: strategy.id,
    isSaturated,
    proof: isSaturated
      ? {
          iterations: 1,
          viewCount: views.length,
          playCount: playsResult.plays.length,
          originalPlayCount: strategy.plays.length,
        }
      : undefined,
    violations: violations.length > 0 ? violations : undefined,
  };
}

/**
 * Extract all views from a strategy
 */
async function extractViewsFromStrategy(strategy: Strategy): Promise<View[]> {
  const views: View[] = [];
  const seenViews = new Set<string>();

  for (const play of strategy.plays) {
    // Extract view for each position in play
    const viewSequence = play.sequence.filter(
      (action) => action.polarity === strategy.player
    );

    const view: View = {
      id: `view-${play.id}`,
      player: strategy.player,
      sequence: viewSequence,
      designId: strategy.designId,
    };

    const viewKey = viewToKey(view);
    if (!seenViews.has(viewKey)) {
      seenViews.add(viewKey);
      views.push(view);
    }
  }

  return views;
}

/**
 * Compute Plays from views (minimal innocent strategy containing views)
 */
async function computePlaysFromViews(
  views: View[],
  player: "P" | "O"
): Promise<{ plays: Play[] }> {
  const plays: Play[] = [];
  const seenPlays = new Set<string>();

  // For each view, generate plays that realize it
  for (const view of views) {
    const play: Play = {
      id: `play-${view.id}`,
      strategyId: "",
      sequence: view.sequence,
      length: view.sequence.length,
      isPositive: view.sequence.length > 0 &&
        view.sequence[view.sequence.length - 1].polarity === player,
      view: view,
    };

    const playKey = playToKey(play);
    if (!seenPlays.has(playKey)) {
      seenPlays.add(playKey);
      plays.push(play);
    }
  }

  return { plays };
}

/**
 * Convert play to unique key for comparison
 */
function playToKey(play: Play): string {
  return play.sequence
    .map((action) => `${action.focus}:${action.polarity}`)
    .join("-");
}

/**
 * Convert view to unique key
 */
function viewToKey(view: View): string {
  return view.sequence
    .map((action) => `${action.focus}:${action.polarity}`)
    .join("-");
}

/**
 * Compute saturation closure
 * 
 * Repeatedly apply Views/Plays until fixpoint (saturated strategy)
 */
export async function computeSaturationClosure(
  strategy: Strategy,
  allDesigns: DesignForCorrespondence[],
  maxIterations: number = 10
): Promise<SaturationClosureResult> {
  let currentStrategy = strategy;
  let iteration = 0;
  let addedPlays = 0;

  while (iteration < maxIterations) {
    const satCheck = await checkSaturation(currentStrategy, allDesigns);

    if (satCheck.isSaturated) {
      // Already saturated - done
      return {
        originalStrategyId: strategy.id,
        saturatedStrategy: currentStrategy,
        iterations: iteration,
        converged: true,
        addedPlays,
      };
    }

    // Extract views
    const views = await extractViewsFromStrategy(currentStrategy);

    // Compute Plays(Views)
    const playsResult = await computePlaysFromViews(views, currentStrategy.player);

    // Merge plays into current strategy
    const existingPlayKeys = new Set(
      currentStrategy.plays.map((p) => playToKey(p))
    );
    const newPlays = playsResult.plays.filter(
      (p) => !existingPlayKeys.has(playToKey(p))
    );

    if (newPlays.length === 0) {
      // No new plays added - fixpoint reached
      break;
    }

    addedPlays += newPlays.length;

    // Create new strategy with merged plays
    currentStrategy = {
      ...currentStrategy,
      plays: [...currentStrategy.plays, ...newPlays],
    };

    iteration++;
  }

  // Check final saturation
  const finalCheck = await checkSaturation(currentStrategy, allDesigns);

  return {
    originalStrategyId: strategy.id,
    saturatedStrategy: currentStrategy,
    iterations: iteration,
    converged: finalCheck.isSaturated,
    addedPlays,
  };
}

/**
 * Check if strategy is view-stable
 * 
 * View-stability: Views(S) ⊆ S (all views are plays)
 */
export async function checkViewStability(
  strategy: Strategy
): Promise<{
  isStable: boolean;
  unstableViews: View[];
}> {
  const views = await extractViewsFromStrategy(strategy);
  const playKeys = new Set(strategy.plays.map((p) => playToKey(p)));

  const unstableViews: View[] = [];

  for (const view of views) {
    // Check if view (as a play) is in strategy
    const viewAsPlayKey = view.sequence
      .map((action) => `${action.focus}:${action.polarity}`)
      .join("-");

    if (!playKeys.has(viewAsPlayKey)) {
      unstableViews.push(view);
    }
  }

  return {
    isStable: unstableViews.length === 0,
    unstableViews,
  };
}

/**
 * Get saturation deficiency
 * 
 * Returns plays that need to be added for saturation
 */
export async function getSaturationDeficiency(
  strategy: Strategy,
  allDesigns: DesignForCorrespondence[]
): Promise<Play[]> {
  const satCheck = await checkSaturation(strategy, allDesigns);

  if (satCheck.isSaturated) {
    return [];
  }

  // Find missing plays
  const missingViolation = satCheck.violations?.find((v) => v.type === "missing");
  if (!missingViolation) {
    return [];
  }

  // Convert violation to plays (simplified)
  const missingPlays: Play[] = missingViolation.itemIds.map((key, i) => ({
    id: `missing-play-${i}`,
    strategyId: strategy.id,
    sequence: parsePlayKey(key),
    length: key.split("-").length,
    isPositive: true,
  }));

  return missingPlays;
}

/**
 * Parse play key back to action sequence
 */
function parsePlayKey(key: string): any[] {
  if (!key) return [];

  return key.split("-").map((part) => {
    const [focus, polarity] = part.split(":");
    return {
      focus,
      polarity: polarity as "P" | "O",
      ramification: [],
    };
  });
}

/**
 * Check if two strategies have the same saturation
 */
export async function haveSameSaturation(
  strategy1: Strategy,
  strategy2: Strategy,
  allDesigns: DesignForCorrespondence[]
): Promise<boolean> {
  const sat1 = await checkSaturation(strategy1, allDesigns);
  const sat2 = await checkSaturation(strategy2, allDesigns);

  return sat1.isSaturated === sat2.isSaturated;
}
