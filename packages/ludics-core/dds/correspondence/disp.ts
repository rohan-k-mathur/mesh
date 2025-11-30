/**
 * Disp(D) Operation
 * 
 * Based on Faggian & Hyland (2002) - Proposition 4.27
 * Compute all disputes of design D with orthogonal counter-designs
 */

import type { Action, Dispute, Position } from "../types";
import type { DesignForCorrespondence, DesignAct, DispResult } from "./types";

/**
 * Compute Disp(D) - all disputes of design D
 * A dispute is an interaction D ⊢ E with orthogonal counter-design E
 */
export function computeDisp(
  design: DesignForCorrespondence,
  counterDesigns: DesignForCorrespondence[]
): DispResult {
  const disputes: Dispute[] = [];

  // For each counter-design, compute dispute
  for (const counter of counterDesigns) {
    try {
      // Step through interaction
      const dispute = computeDispute(design, counter);
      if (dispute) {
        disputes.push(dispute);
      }
    } catch (error) {
      // Skip failed dispute computations
      console.warn(`Failed to compute dispute: ${error}`);
    }
  }

  // Remove duplicate disputes (same sequence)
  const uniqueDisputes = deduplicateDisputes(disputes);

  return {
    designId: design.id,
    disputes: uniqueDisputes,
    count: uniqueDisputes.length,
    computedAt: new Date(),
  };
}

/**
 * Compute single dispute between two designs
 */
export function computeDispute(
  posDesign: DesignForCorrespondence,
  negDesign: DesignForCorrespondence
): Dispute | null {
  const pairs: Dispute["pairs"] = [];

  // Build act maps by locus path
  const posActsByPath = buildActMap(posDesign.acts);
  const negActsByPath = buildActMap(negDesign.acts);

  // Start from root
  const rootPath = "0";
  let currentPaths = [rootPath];
  let status: Dispute["status"] = "ONGOING";

  // Step through interaction
  while (currentPaths.length > 0 && pairs.length < 1000) {
    const nextPaths: string[] = [];

    for (const path of currentPaths) {
      const posAct = posActsByPath.get(path);
      const negAct = negActsByPath.get(path);

      if (posAct && negAct) {
        // Both designs have action at this path - create pair
        pairs.push({
          posActId: posAct.id,
          negActId: negAct.id,
          locusPath: path,
          ts: pairs.length,
        });

        // Add children to explore
        const posChildren = posAct.ramification.map(i => `${path}.${i}`);
        const negChildren = negAct.ramification.map(i => `${path}.${i}`);

        // Continue with intersection of children
        const intersection = posChildren.filter(p => negChildren.includes(p));
        nextPaths.push(...intersection);
      } else if (posAct && !negAct) {
        // Positive design continues, negative stops - CONVERGENT
        status = "CONVERGENT";
      } else if (!posAct && negAct) {
        // Negative design continues, positive stops - DIVERGENT
        status = "DIVERGENT";
      }
      // Neither has act - branch ends
    }

    currentPaths = nextPaths;
  }

  if (pairs.length === 0) {
    return null;
  }

  // Determine final status
  if (status === "ONGOING" && currentPaths.length === 0) {
    status = "CONVERGENT"; // Both designs completed
  }

  return {
    id: `dispute-${posDesign.id}-${negDesign.id}`,
    dialogueId: posDesign.deliberationId,
    posDesignId: posDesign.id,
    negDesignId: negDesign.id,
    pairs,
    status,
    length: pairs.length,
    isLegal: true, // Computed disputes are legal by construction
  };
}

/**
 * Build map from locus path to act
 */
function buildActMap(acts: DesignAct[]): Map<string, DesignAct> {
  const map = new Map<string, DesignAct>();
  for (const act of acts) {
    if (act.locusPath) {
      map.set(act.locusPath, act);
    }
  }
  return map;
}

/**
 * Remove duplicate disputes (same pair sequence)
 */
function deduplicateDisputes(disputes: Dispute[]): Dispute[] {
  const seen = new Set<string>();
  const unique: Dispute[] = [];

  for (const dispute of disputes) {
    const key = disputeToKey(dispute);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(dispute);
    }
  }

  return unique;
}

/**
 * Create unique key for dispute
 */
function disputeToKey(dispute: Dispute): string {
  return dispute.pairs.map(p => `${p.locusPath}`).join("|");
}

/**
 * Convert disputes to strategy plays
 */
export function disputesToPlays(
  disputes: Dispute[],
  player: "P" | "O"
): { sequence: Action[]; length: number; isPositive: boolean }[] {
  return disputes.map(dispute => {
    const sequence: Action[] = [];

    for (const pair of dispute.pairs) {
      // Add the player's action from each pair
      sequence.push({
        focus: pair.locusPath,
        ramification: [], // Will be filled from act data
        polarity: player,
        actId: player === "P" ? pair.posActId : pair.negActId,
      });
    }

    const lastAction = sequence[sequence.length - 1];
    const isPositive = lastAction ? lastAction.polarity === player : false;

    return {
      sequence,
      length: sequence.length,
      isPositive,
    };
  });
}

/**
 * Extract all locus paths from design
 */
export function extractDesignPaths(design: DesignForCorrespondence): string[] {
  const paths = new Set<string>();
  for (const act of design.acts) {
    if (act.locusPath) {
      paths.add(act.locusPath);
    }
  }
  return Array.from(paths).sort();
}

/**
 * Check if two designs can interact (have overlapping structure)
 */
export function canInteract(
  design1: DesignForCorrespondence,
  design2: DesignForCorrespondence
): boolean {
  const paths1 = extractDesignPaths(design1);
  const paths2 = extractDesignPaths(design2);

  // Check for root or overlapping paths
  const hasRoot1 = paths1.includes("0");
  const hasRoot2 = paths2.includes("0");

  if (hasRoot1 && hasRoot2) {
    return true;
  }

  // Check for any common path
  for (const path of paths1) {
    if (paths2.includes(path)) {
      return true;
    }
  }

  return false;
}
