/**
 * DDS Chronicle Extraction
 * Based on Faggian & Hyland (2002) - Proposition 3.6
 * 
 * Chronicles are branches in the design tree. Each chronicle represents
 * a complete interaction path from root to a terminal position.
 * 
 * The key insight: view extracts the "identifying chronicle" for each action.
 */

import type { 
  Action, 
  Position, 
  Chronicle, 
  Dispute, 
  ChronicleExtractionOptions 
} from "./types";
import { extractView } from "./views";

/**
 * Extract chronicles from dispute (Proposition 3.6)
 * View extracts the identifying chronicle for each action
 * 
 * @param dispute - The dispute to extract chronicles from
 * @param player - Which player's chronicles to extract
 * @param options - Optional extraction parameters
 * @returns Array of chronicles for the player
 */
export function extractChronicles(
  dispute: Dispute,
  player: "P" | "O",
  options: ChronicleExtractionOptions = {}
): Chronicle[] {
  const chronicles: Chronicle[] = [];
  const position = disputeToPosition(dispute);

  // For each prefix of the position, extract the view
  // Each view corresponds to a chronicle
  for (let i = 0; i < position.sequence.length; i++) {
    const prefix: Position = {
      ...position,
      sequence: position.sequence.slice(0, i + 1),
    };

    const view = extractView(prefix, player);

    if (view.length > 0) {
      const chronicle: Chronicle = {
        id: `chronicle-${dispute.id}-${player}-${i}`,
        designId: player === "P" ? dispute.posDesignId : dispute.negDesignId,
        actions: view,
        polarity: player,
        isPositive: view[view.length - 1].polarity === player,
      };

      // Check if we should include this chronicle
      if (!options.onlyPositive || chronicle.isPositive) {
        chronicles.push(chronicle);
      }

      // Limit number of chronicles if specified
      if (options.maxChronicles && chronicles.length >= options.maxChronicles) {
        break;
      }
    }
  }

  return chronicles;
}

/**
 * Convert dispute to position
 * Maps the dispute pairs to an alternating action sequence
 */
export function disputeToPosition(dispute: Dispute): Position {
  const sequence: Action[] = [];

  // Convert pairs to action sequence
  for (const pair of dispute.pairs) {
    // Add positive action (Proponent)
    sequence.push({
      focus: pair.locusPath,
      ramification: [], // Will be filled from act data if available
      polarity: "P",
      actId: pair.posActId,
      ts: pair.ts,
    });

    // Add negative action (Opponent)
    sequence.push({
      focus: pair.locusPath,
      ramification: [],
      polarity: "O",
      actId: pair.negActId,
      ts: pair.ts,
    });
  }

  return {
    id: dispute.id,
    sequence,
    player: sequence.length % 2 === 0 ? "O" : "P",
    isLinear: true, // Will be validated
    isLegal: true, // Will be validated
    disputeId: dispute.id,
  };
}

/**
 * Extract all unique chronicles from a position
 * Returns chronicles for both players
 */
export function extractAllChronicles(
  position: Position,
  options: ChronicleExtractionOptions = {}
): { proponent: Chronicle[]; opponent: Chronicle[] } {
  const proponent: Chronicle[] = [];
  const opponent: Chronicle[] = [];

  const seenP = new Set<string>();
  const seenO = new Set<string>();

  for (let i = 0; i < position.sequence.length; i++) {
    const prefix: Position = {
      ...position,
      sequence: position.sequence.slice(0, i + 1),
    };

    // Extract proponent view/chronicle
    const pView = extractView(prefix, "P");
    const pKey = chronicleKey(pView);
    if (!seenP.has(pKey) && pView.length > 0) {
      seenP.add(pKey);
      const chronicle: Chronicle = {
        id: `chronicle-P-${i}`,
        designId: "", // Will be set by caller
        actions: pView,
        polarity: "P",
        isPositive: pView[pView.length - 1].polarity === "P",
      };
      if (!options.onlyPositive || chronicle.isPositive) {
        proponent.push(chronicle);
      }
    }

    // Extract opponent view/chronicle
    const oView = extractView(prefix, "O");
    const oKey = chronicleKey(oView);
    if (!seenO.has(oKey) && oView.length > 0) {
      seenO.add(oKey);
      const chronicle: Chronicle = {
        id: `chronicle-O-${i}`,
        designId: "",
        actions: oView,
        polarity: "O",
        isPositive: oView[oView.length - 1].polarity === "O",
      };
      if (!options.onlyPositive || chronicle.isPositive) {
        opponent.push(chronicle);
      }
    }
  }

  return { proponent, opponent };
}

/**
 * Generate a unique key for a chronicle/view sequence
 */
function chronicleKey(actions: Action[]): string {
  return JSON.stringify(
    actions.map((a) => ({
      f: a.focus,
      p: a.polarity,
      r: a.ramification.sort(),
    }))
  );
}

/**
 * Check if chronicle ends positively (player's own action)
 */
export function isPositiveChronicle(chronicle: Chronicle): boolean {
  if (chronicle.actions.length === 0) return false;
  return chronicle.actions[chronicle.actions.length - 1].polarity === chronicle.polarity;
}

/**
 * Check if chronicle ends negatively (opponent's action)
 */
export function isNegativeChronicle(chronicle: Chronicle): boolean {
  if (chronicle.actions.length === 0) return false;
  return chronicle.actions[chronicle.actions.length - 1].polarity !== chronicle.polarity;
}

/**
 * Get the depth of a chronicle (number of moves from root)
 */
export function chronicleDepth(chronicle: Chronicle): number {
  return chronicle.actions.length;
}

/**
 * Extract the locus path from the tip of a chronicle
 */
export function chronicleTipLocus(chronicle: Chronicle): string | undefined {
  if (chronicle.actions.length === 0) return undefined;
  return chronicle.actions[chronicle.actions.length - 1].focus;
}

/**
 * Check if one chronicle is a prefix of another
 */
export function isChroniclePrefix(
  prefix: Chronicle,
  full: Chronicle
): boolean {
  if (prefix.actions.length > full.actions.length) return false;
  
  for (let i = 0; i < prefix.actions.length; i++) {
    const a1 = prefix.actions[i];
    const a2 = full.actions[i];
    
    if (a1.focus !== a2.focus) return false;
    if (a1.polarity !== a2.polarity) return false;
    if (JSON.stringify(a1.ramification) !== JSON.stringify(a2.ramification)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get all positive-ended chronicles from a set
 */
export function getPositiveChronicles(chronicles: Chronicle[]): Chronicle[] {
  return chronicles.filter((c) => c.isPositive);
}

/**
 * Get all negative-ended chronicles from a set
 */
export function getNegativeChronicles(chronicles: Chronicle[]): Chronicle[] {
  return chronicles.filter((c) => !c.isPositive);
}

/**
 * Group chronicles by their terminal locus
 */
export function groupChroniclesByLocus(
  chronicles: Chronicle[]
): Map<string, Chronicle[]> {
  const groups = new Map<string, Chronicle[]>();

  for (const chronicle of chronicles) {
    const locus = chronicleTipLocus(chronicle);
    if (locus) {
      if (!groups.has(locus)) {
        groups.set(locus, []);
      }
      groups.get(locus)!.push(chronicle);
    }
  }

  return groups;
}
