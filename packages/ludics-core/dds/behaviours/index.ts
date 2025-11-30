/**
 * DDS Phase 5 - Part 1: Behaviours Module Index
 * 
 * Based on Faggian & Hyland (2002) - §6: Orthogonality and Behaviours
 * 
 * This module implements:
 * - Orthogonality checking (basic and refined via dispute intersection)
 * - Biorthogonal closure computation (D⊥⊥)
 * - Behaviour creation and validation
 * - Game construction from behaviours
 */

// Types
export * from "./types";

// Orthogonality operations
export {
  checkOrthogonalityRefined,
  checkOrthogonalityBasic,
  areOrthogonal,
  findOrthogonalDesigns,
  verifyOrthogonalitySymmetry,
} from "./orthogonality";

// Closure operations
export {
  computeOrthogonal,
  computeBiorthogonal,
  isBehaviour,
  validateBehaviour,
  createBehaviourFromDesigns,
  computeBehaviourComplement,
  intersectBehaviours,
  behaviourContainedIn,
  behavioursEqual,
  smallestBehaviourContaining,
} from "./closure";

// Game operations
export {
  behaviourToGame,
  isGame,
  isWinningPosition,
  getAvailableMoves,
  applyMove,
  findWinningStrategy,
} from "./game";
