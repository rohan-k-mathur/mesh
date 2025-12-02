/**
 * DDS Phase 5 - Game AI
 * 
 * Simple greedy AI for move selection.
 * Uses heuristic scoring rather than expensive tree search.
 */

import type {
  LudicsGame,
  GamePlayState,
  AIDifficulty,
  AIMoveResult,
  AIScoringWeights,
} from "./types";
import type { ArenaMove, LegalPosition } from "../arena/types";
import { getAIScoringWeights } from "./types";
import { getAvailableMoves, applyMove } from "../arena/positions";

// ============================================================================
// AI Move Selection
// ============================================================================

/**
 * Compute the best move using greedy heuristics
 */
export function computeAIMove(
  state: GamePlayState,
  game: LudicsGame,
  difficulty: AIDifficulty = "medium"
): AIMoveResult | null {
  const startTime = Date.now();
  const weights = getAIScoringWeights(difficulty);
  
  const available = getAvailableMoves(state.currentPosition, game.arena);
  if (available.length === 0) {
    return null;
  }

  // Score each available move
  const scoredMoves = available.map(move => ({
    move,
    score: scoreMove(move, state, game, weights),
  }));

  // Sort by score descending
  scoredMoves.sort((a, b) => b.score - a.score);

  // Add randomness based on difficulty
  let selectedIndex = 0;
  if (weights.randomness > 0 && scoredMoves.length > 1) {
    // With probability = randomness, pick a random move from top 3
    if (Math.random() < weights.randomness) {
      const topN = Math.min(3, scoredMoves.length);
      selectedIndex = Math.floor(Math.random() * topN);
    }
  }

  const selected = scoredMoves[selectedIndex];
  const computeTime = Date.now() - startTime;

  return {
    move: selected.move,
    score: selected.score,
    reason: explainMoveChoice(selected.move, selected.score, weights),
    alternatives: scoredMoves.slice(0, 5).map(sm => ({
      move: sm.move,
      score: sm.score,
    })),
    computeTime,
  };
}

/**
 * Score a move using heuristics
 */
function scoreMove(
  move: ArenaMove,
  state: GamePlayState,
  game: LudicsGame,
  weights: AIScoringWeights
): number {
  let score = 0;
  const player = state.currentPosition.currentPlayer;

  // 1. Ramification bonus: prefer moves that open more options
  score += move.ramification.length * weights.ramificationBonus;

  // 2. Centrality bonus: prefer moves closer to root
  const depth = move.address.length;
  const centralityScore = Math.max(0, 10 - depth);
  score += centralityScore * weights.centralityBonus;

  // 3. Restriction bonus: prefer moves that limit opponent's options
  const nextPosition = applyMove(state.currentPosition, move, game.arena);
  if (nextPosition) {
    const opponentMoves = getAvailableMoves(nextPosition, game.arena);
    const restrictionScore = Math.max(0, 10 - opponentMoves.length);
    score += restrictionScore * weights.restrictionBonus;

    // 4. Winning bonus: huge bonus for winning moves
    if (nextPosition.isTerminal) {
      // Check if we win
      const lastPlayer = move.player;
      if (lastPlayer === player) {
        score += weights.winningBonus;
      }
    }
  }

  // 5. Small random factor for variety
  score += Math.random() * 2;

  return score;
}

/**
 * Generate explanation for move choice
 */
function explainMoveChoice(
  move: ArenaMove,
  score: number,
  weights: AIScoringWeights
): string {
  const reasons: string[] = [];

  if (move.ramification.length > 2) {
    reasons.push("opens multiple options");
  }

  if (move.address.length <= 2) {
    reasons.push("central position");
  }

  if (score >= weights.winningBonus) {
    reasons.push("winning move");
  }

  if (reasons.length === 0) {
    reasons.push("best available");
  }

  return reasons.join(", ");
}

// ============================================================================
// Advanced AI (Lookahead)
// ============================================================================

/**
 * Compute move with limited lookahead (for "hard" difficulty)
 * Uses simple minimax without alpha-beta (depth limited)
 */
export function computeAIMoveWithLookahead(
  state: GamePlayState,
  game: LudicsGame,
  maxDepth: number = 2
): AIMoveResult | null {
  const startTime = Date.now();
  const weights = getAIScoringWeights("hard");
  
  const available = getAvailableMoves(state.currentPosition, game.arena);
  if (available.length === 0) {
    return null;
  }

  const player = state.currentPosition.currentPlayer;
  
  // Score each move with lookahead
  const scoredMoves = available.map(move => {
    const nextPos = applyMove(state.currentPosition, move, game.arena);
    if (!nextPos) {
      return { move, score: -Infinity };
    }

    // If terminal, evaluate immediately
    if (nextPos.isTerminal) {
      const winner = nextPos.sequence[nextPos.sequence.length - 1]?.player;
      return {
        move,
        score: winner === player ? weights.winningBonus : -weights.winningBonus,
      };
    }

    // Lookahead evaluation
    const evalScore = minimax(
      nextPos,
      game,
      maxDepth - 1,
      player,
      false, // Next is opponent's turn
      weights
    );

    return { move, score: evalScore };
  });

  // Sort by score
  scoredMoves.sort((a, b) => b.score - a.score);

  const selected = scoredMoves[0];
  const computeTime = Date.now() - startTime;

  return {
    move: selected.move,
    score: selected.score,
    reason: `lookahead depth ${maxDepth}`,
    alternatives: scoredMoves.slice(0, 5).map(sm => ({
      move: sm.move,
      score: sm.score,
    })),
    computeTime,
  };
}

/**
 * Simple minimax evaluation
 */
function minimax(
  position: LegalPosition,
  game: LudicsGame,
  depth: number,
  maximizingPlayer: "P" | "O",
  isMaximizing: boolean,
  weights: AIScoringWeights
): number {
  // Terminal or depth limit reached
  if (position.isTerminal || depth <= 0) {
    return evaluatePosition(position, maximizingPlayer, weights);
  }

  const available = getAvailableMoves(position, game.arena);
  if (available.length === 0) {
    return evaluatePosition(position, maximizingPlayer, weights);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of available) {
      const nextPos = applyMove(position, move, game.arena);
      if (nextPos) {
        const evalScore = minimax(
          nextPos, game, depth - 1, maximizingPlayer, false, weights
        );
        maxEval = Math.max(maxEval, evalScore);
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of available) {
      const nextPos = applyMove(position, move, game.arena);
      if (nextPos) {
        const evalScore = minimax(
          nextPos, game, depth - 1, maximizingPlayer, true, weights
        );
        minEval = Math.min(minEval, evalScore);
      }
    }
    return minEval;
  }
}

/**
 * Evaluate a position for a player
 */
function evaluatePosition(
  position: LegalPosition,
  player: "P" | "O",
  weights: AIScoringWeights
): number {
  // Terminal position
  if (position.isTerminal) {
    const lastMove = position.sequence[position.sequence.length - 1];
    if (lastMove?.player === player) {
      return weights.winningBonus;
    } else {
      return -weights.winningBonus;
    }
  }

  // Heuristic evaluation based on position advantage
  let score = 0;

  // Material: count moves played by each player
  const pMoves = position.sequence.filter(m => m.player === "P").length;
  const oMoves = position.sequence.filter(m => m.player === "O").length;
  
  if (player === "P") {
    score += (pMoves - oMoves) * 5;
  } else {
    score += (oMoves - pMoves) * 5;
  }

  // Whose turn is it? Having the move is slightly advantageous
  if (position.currentPlayer === player) {
    score += 2;
  }

  return score;
}

// ============================================================================
// AI Utilities
// ============================================================================

/**
 * Get AI move with automatic difficulty selection based on game state
 */
export function getSmartAIMove(
  state: GamePlayState,
  game: LudicsGame
): AIMoveResult | null {
  // Use simple greedy for most cases
  // Use lookahead only in critical positions (few moves left)
  const available = getAvailableMoves(state.currentPosition, game.arena);
  
  if (available.length <= 3) {
    // Few options - use lookahead for better decision
    return computeAIMoveWithLookahead(state, game, 3);
  }
  
  // Normal case - use greedy
  return computeAIMove(state, game, "medium");
}

/**
 * Get random legal move (for testing)
 */
export function getRandomMove(
  state: GamePlayState,
  game: LudicsGame
): ArenaMove | null {
  const available = getAvailableMoves(state.currentPosition, game.arena);
  if (available.length === 0) return null;
  
  const idx = Math.floor(Math.random() * available.length);
  return available[idx];
}
