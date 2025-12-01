/**
 * Disp(D) Operation
 * 
 * Based on Faggian & Hyland (2002) - Proposition 4.27
 * Compute all disputes of design D with orthogonal counter-designs
 */

import type { Action, Dispute, Position } from "../types";
import type { DesignForCorrespondence, DesignAct, DispResult } from "./types";

// Debug logging
const DEBUG_DISP = true;
function logDisp(label: string, ...args: any[]) {
  if (DEBUG_DISP) {
    console.log(`[DISP] ${label}`, ...args);
  }
}

/**
 * Compute Disp(D) - all disputes of design D
 * A dispute is an interaction D ⊢ E with orthogonal counter-design E
 */
export function computeDisp(
  design: DesignForCorrespondence,
  counterDesigns: DesignForCorrespondence[]
): DispResult {
  logDisp("computeDisp called:", {
    designId: design.id,
    designActCount: design.acts.length,
    counterDesignCount: counterDesigns.length,
  });
  
  const disputes: Dispute[] = [];

  // For each counter-design, compute dispute
  for (const counter of counterDesigns) {
    try {
      // Step through interaction
      const dispute = computeDispute(design, counter);
      if (dispute) {
        disputes.push(dispute);
        logDisp("Computed dispute:", {
          posDesign: design.id.slice(-8),
          negDesign: counter.id.slice(-8),
          pairCount: dispute.pairs.length,
          status: dispute.status,
        });
      } else {
        logDisp("No dispute computed for:", { posDesign: design.id.slice(-8), negDesign: counter.id.slice(-8) });
      }
    } catch (error) {
      // Skip failed dispute computations
      console.warn(`Failed to compute dispute: ${error}`);
    }
  }

  // Remove duplicate disputes (same sequence)
  const uniqueDisputes = deduplicateDisputes(disputes);
  logDisp("computeDisp result:", { totalDisputes: uniqueDisputes.length });

  return {
    designId: design.id,
    disputes: uniqueDisputes,
    count: uniqueDisputes.length,
    computedAt: new Date(),
  };
}

/**
 * Compute single dispute between two designs
 * 
 * A dispute traces through the locus tree, matching acts from both designs.
 * The interaction follows the tree structure where P and O take turns.
 */
export function computeDispute(
  posDesign: DesignForCorrespondence,
  negDesign: DesignForCorrespondence
): Dispute | null {
  const pairs: Dispute["pairs"] = [];

  // Build act maps by locus path
  const posActsByPath = buildActMap(posDesign.acts);
  const negActsByPath = buildActMap(negDesign.acts);
  
  logDisp("computeDispute:", {
    posDesign: posDesign.id.slice(-8),
    negDesign: negDesign.id.slice(-8),
    posPaths: Array.from(posActsByPath.keys()),
    negPaths: Array.from(negActsByPath.keys()),
  });

  // Find all paths from both designs
  const allPosPaths = Array.from(posActsByPath.keys()).sort();
  const allNegPaths = Array.from(negActsByPath.keys()).sort();
  
  // Find common paths or paths where one is prefix of another
  // This represents the interaction tree
  const interactionPaths = new Set<string>();
  
  for (const pPath of allPosPaths) {
    for (const nPath of allNegPaths) {
      // Check if they're on the same branch (one is prefix of other, or same)
      if (pPath === nPath || pPath.startsWith(nPath + ".") || nPath.startsWith(pPath + ".")) {
        interactionPaths.add(pPath);
        interactionPaths.add(nPath);
      }
    }
  }
  
  if (interactionPaths.size === 0) {
    logDisp("No interaction paths found - designs don't overlap");
    return null;
  }
  
  // Sort paths by depth (shorter first) to process in order
  const sortedPaths = Array.from(interactionPaths).sort((a, b) => {
    const depthA = a.split(".").length;
    const depthB = b.split(".").length;
    return depthA - depthB || a.localeCompare(b);
  });
  
  logDisp("Interaction paths:", sortedPaths);

  // Build pairs by traversing the interaction tree
  let status: Dispute["status"] = "ONGOING";
  
  for (const path of sortedPaths) {
    const posAct = posActsByPath.get(path);
    const negAct = negActsByPath.get(path);
    
    if (posAct) {
      pairs.push({
        posActId: posAct.id,
        negActId: negAct?.id || "∅",
        locusPath: path,
        ts: pairs.length,
      });
    } else if (negAct) {
      pairs.push({
        posActId: "∅",
        negActId: negAct.id,
        locusPath: path,
        ts: pairs.length,
      });
    }
  }

  if (pairs.length === 0) {
    return null;
  }
  
  // Determine status based on how the interaction ended
  const lastPair = pairs[pairs.length - 1];
  if (lastPair.posActId === "∅") {
    status = "DIVERGENT"; // O continued, P stopped
  } else if (lastPair.negActId === "∅") {
    status = "CONVERGENT"; // P continued, O stopped
  } else {
    status = "CONVERGENT"; // Both reached same point
  }

  logDisp("Dispute computed:", { pairCount: pairs.length, status });

  return {
    id: `dispute-${posDesign.id}-${negDesign.id}`,
    dialogueId: posDesign.deliberationId,
    posDesignId: posDesign.id,
    negDesignId: negDesign.id,
    pairs,
    status,
    length: pairs.length,
    isLegal: true,
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
 * 
 * Each dispute generates MULTIPLE plays - one for each prefix of the interaction.
 * The plays should have ALTERNATING polarities (P, O, P, O, ...) to match
 * how actual game play works.
 */
export function disputesToPlays(
  disputes: Dispute[],
  player: "P" | "O"
): { sequence: Action[]; length: number; isPositive: boolean }[] {
  logDisp("disputesToPlays called:", { disputeCount: disputes.length, player });
  
  const result: { sequence: Action[]; length: number; isPositive: boolean }[] = [];
  const seenSequences = new Set<string>();

  for (const dispute of disputes) {
    // Build the full alternating sequence from dispute pairs
    // Each pair represents an exchange: posAct then negAct (or just one if the other is ∅)
    const fullSequence: Action[] = [];
    
    for (const pair of dispute.pairs) {
      // Add P action if present
      if (pair.posActId && pair.posActId !== "∅") {
        fullSequence.push({
          focus: pair.locusPath,
          ramification: [],
          polarity: "P",
          actId: pair.posActId,
        });
      }
      // Add O action if present
      if (pair.negActId && pair.negActId !== "∅") {
        fullSequence.push({
          focus: pair.locusPath,
          ramification: [],
          polarity: "O",
          actId: pair.negActId,
        });
      }
    }

    // Generate plays for all prefixes
    for (let prefixLen = 1; prefixLen <= fullSequence.length; prefixLen++) {
      const sequence = fullSequence.slice(0, prefixLen);
      
      if (sequence.length === 0) continue;

      // Deduplicate by sequence key
      const seqKey = sequence.map(a => `${a.focus}:${a.polarity}`).join("|");
      if (seenSequences.has(seqKey)) continue;
      seenSequences.add(seqKey);

      const lastAction = sequence[sequence.length - 1];
      const isPositive = lastAction.polarity === player;

      result.push({
        sequence,
        length: sequence.length,
        isPositive,
      });
    }
  }
  
  logDisp("disputesToPlays result:", { 
    playCount: result.length, 
    sampleLengths: result.slice(0, 5).map(r => r.length) 
  });
  return result;
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
