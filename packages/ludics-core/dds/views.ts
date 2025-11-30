/**
 * DDS View Extraction
 * Based on Faggian & Hyland (2002) - Definition 3.5
 * 
 * View extracts the relevant actions visible to a player from a position.
 * The view is what a player "sees" at any point in the interaction.
 */

import type { Action, Position, View, ViewExtractionOptions } from "./types";

/**
 * Extract view for player X from position
 * Definition 3.5 from paper:
 * - For positive moves: keep from other player's view + this move
 * - For negative moves: justifier + this move (or just this if initial)
 * 
 * @param position - The current position in the dispute
 * @param player - Which player's view to extract ("P" or "O")
 * @param options - Optional extraction parameters
 * @returns Array of actions visible to the player
 */
export function extractView(
  position: Position,
  player: "P" | "O",
  options: ViewExtractionOptions = {}
): Action[] {
  const view: Action[] = [];

  for (const action of position.sequence) {
    if (action.polarity === player) {
      // Positive move (player's own): keep previous view + this move
      view.push(action);
    } else {
      // Negative move (opponent's)
      if (view.length === 0 || isInitial(action)) {
        // Initial negative move: just the move
        view.length = 0;
        view.push(action);
      } else {
        // Non-initial negative: justifier + this move
        const justifier = findJustifier(action, view);
        if (justifier) {
          view.length = 0;
          view.push(justifier);
          view.push(action);
        } else {
          // If no justifier found, just add the action
          // This handles edge cases gracefully
          view.push(action);
        }
      }
    }
  }

  return view;
}

/**
 * Check if action is initial (not justified by prior action)
 * Initial actions are at the root locus or special initial markers
 */
export function isInitial(action: Action): boolean {
  return action.focus === "0" || action.focus === "<>" || action.focus === "";
}

/**
 * Find justifier for an action in the current view
 * Action (ξi, J) is justified by (ξ, I) if i ∈ I
 * 
 * @param action - The action needing justification
 * @param view - The current view to search
 * @returns The justifying action, or null if not found
 */
export function findJustifier(action: Action, view: Action[]): Action | null {
  const focusParts = action.focus.split(".");
  if (focusParts.length <= 1) return null;

  const parentFocus = focusParts.slice(0, -1).join(".");
  const childIndex = parseInt(focusParts[focusParts.length - 1], 10);

  // Search backwards through view for matching justifier
  for (let i = view.length - 1; i >= 0; i--) {
    const candidate = view[i];
    if (
      candidate.focus === parentFocus &&
      candidate.ramification.includes(childIndex)
    ) {
      return candidate;
    }
  }

  return null;
}

/**
 * Extract proponent view from position
 * Convenience wrapper for extractView with player = "P"
 */
export function extractProponentView(
  position: Position,
  options: ViewExtractionOptions = {}
): Action[] {
  return extractView(position, "P", options);
}

/**
 * Extract opponent view from position
 * Convenience wrapper for extractView with player = "O"
 */
export function extractOpponentView(
  position: Position,
  options: ViewExtractionOptions = {}
): Action[] {
  return extractView(position, "O", options);
}

/**
 * Create a View object from extracted actions
 */
export function createView(
  id: string,
  player: "P" | "O",
  sequence: Action[],
  designId: string,
  parentDisputeId?: string
): View {
  return {
    id,
    player,
    sequence,
    designId,
    parentDisputeId,
  };
}

/**
 * Compare two views for equality
 * Views are equal if they have the same sequence of actions at the same foci
 */
export function viewsEqual(v1: View | Action[], v2: View | Action[]): boolean {
  const seq1 = Array.isArray(v1) ? v1 : v1.sequence;
  const seq2 = Array.isArray(v2) ? v2 : v2.sequence;

  if (seq1.length !== seq2.length) return false;

  for (let i = 0; i < seq1.length; i++) {
    const a1 = seq1[i];
    const a2 = seq2[i];

    if (a1.focus !== a2.focus) return false;
    if (a1.polarity !== a2.polarity) return false;
    if (JSON.stringify(a1.ramification) !== JSON.stringify(a2.ramification)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if view v1 is a prefix of view v2
 */
export function isViewPrefix(
  v1: View | Action[],
  v2: View | Action[]
): boolean {
  const seq1 = Array.isArray(v1) ? v1 : v1.sequence;
  const seq2 = Array.isArray(v2) ? v2 : v2.sequence;

  if (seq1.length > seq2.length) return false;

  for (let i = 0; i < seq1.length; i++) {
    const a1 = seq1[i];
    const a2 = seq2[i];

    if (a1.focus !== a2.focus) return false;
    if (a1.polarity !== a2.polarity) return false;
    if (JSON.stringify(a1.ramification) !== JSON.stringify(a2.ramification)) {
      return false;
    }
  }

  return true;
}

/**
 * Get the last action in a view
 */
export function getViewTip(view: View | Action[]): Action | undefined {
  const seq = Array.isArray(view) ? view : view.sequence;
  return seq.length > 0 ? seq[seq.length - 1] : undefined;
}

/**
 * Serialize a view to a string key for comparison/hashing
 */
export function viewToKey(view: View | Action[]): string {
  const seq = Array.isArray(view) ? view : view.sequence;
  return JSON.stringify(
    seq.map((a) => ({
      f: a.focus,
      p: a.polarity,
      r: a.ramification,
    }))
  );
}
