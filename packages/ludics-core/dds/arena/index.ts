/**
 * DDS Phase 5 - Arena Module Index
 * 
 * Exports all arena-related types and functions.
 */

// Types
export type {
  UniversalArena,
  ArenaMove,
  EnablingEdge,
  ArenaLabel,
  LegalPosition,
  PositionValidity,
  PlayerView,
  LudicsGame,
  GameStrategy,
  GamePlayState,
  MoveLogEntry,
  EncodedGameState,
  EncodedArena,
} from "./types";

// Type factory functions
export {
  createArenaMove,
  getPlayerFromAddress,
  createInitialPosition,
  createPositionValidity,
  serializePosition,
  serializeMove,
} from "./types";

// Arena operations
export {
  createUniversalArena,
  createArenaFromDesigns,
  delocateArena,
  getMoveById,
  getMovesAtAddress,
  getInitialMoves,
  getMovesForPlayer,
  checkEnabling,
  getEnabledMoves,
  getJustifier,
  getAncestors,
  getDescendants,
  encodeArena,
  decodeArena,
  validateArena,
  getArenaStats,
} from "./arena";

// Position operations
export {
  validatePosition,
  computeView,
  computeViewForSequence,
  computePView,
  computeOView,
  getAvailableMoves,
  applyMove,
  isTerminalPosition,
  getWinner,
  PositionCache,
  enumerateLegalPositions,
} from "./positions";
