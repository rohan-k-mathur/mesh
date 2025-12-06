# Phase 2: Interaction Engine — Implementation Checklist

**Duration:** 2 weeks  
**Goal:** Execute games on deliberation arenas, extract visitable paths  
**Status:** ✅ COMPLETE

---

## Implementation Summary

All Phase 2 components have been implemented and tested:

### Files Created

| File | Description | Lines |
|------|-------------|-------|
| `dds/interaction/stepper.ts` | Core stepping engine | ~488 |
| `dds/interaction/outcome.ts` | Convergence/divergence detection | ~336 |
| `dds/interaction/play.ts` | Play/game session management | ~406 |
| `dds/interaction/strategy.ts` | Strategy and design management | ~656 |
| `dds/interaction/index.ts` | Module exports | ~115 |
| `dds/__tests__/interaction.test.ts` | Comprehensive tests | ~860 |
| `dds/types/ludics-theory.ts` | Extended with Play types | (additions) |

### Test Results

```
✓ packages/ludics-core/dds/__tests__/arena-construction.test.ts (39 tests) 8ms
✓ packages/ludics-core/dds/__tests__/interaction.test.ts (65 tests) 7ms

Test Files  2 passed (2)
Tests  104 passed (104)
```

---

## Overview

Phase 2 builds on the arena construction from Phase 1 to create the interaction engine:
**DeliberationArena → Play → VisitablePath**

### Key Concepts

| Concept | Implementation |
|---------|----------------|
| InteractionState | Current state of a game in progress |
| Play | Complete game session with history |
| Chronicle | Single path through a design (alternating actions) |
| Strategy | Response pattern (which move to make at each position) |
| Outcome | Convergent (daimon) or divergent (stuck) |
| Winner | Player who can still move when other is stuck |

---

## Task 2.1: Interaction Types

### Types to Define

```typescript
// In packages/ludics-core/dds/types/ludics-theory.ts

/** Current state of an interaction in progress */
interface InteractionState {
  arena: DeliberationArena;
  currentPath: DialogueAct[];      // Actions so far
  currentAddress: LudicAddress;    // Where we are
  activePolarity: Polarity;        // Who moves next
  moveCount: number;               // Total moves made
  isTerminated: boolean;           // Has interaction ended?
}

/** Result of a completed interaction */
interface InteractionResult {
  path: VisitablePath;
  outcome: "convergent" | "divergent";
  stuckPlayer: "P" | "O" | null;
  trace: DialogueAct[];            // Full interaction history
  moveCount: number;
  duration?: number;               // Time taken
}

/** A play is a complete game session */
interface Play {
  id: string;
  arenaId: string;
  deliberationId: string;
  participants: Participant[];
  moves: PlayMove[];
  state: InteractionState;
  result?: InteractionResult;
  startedAt: Date;
  endedAt?: Date;
}

/** A single move in a play */
interface PlayMove {
  id: string;
  playId: string;
  sequence: number;
  action: DialogueAct;
  playerId?: string;
  timestamp: Date;
}
```

### Checklist

- [ ] Define `InteractionState` type
- [ ] Define `InteractionResult` type  
- [ ] Define `Play` type
- [ ] Define `PlayMove` type
- [ ] Define `Participant` type
- [ ] Add factory functions for creating initial states
- [ ] Export from index

---

## Task 2.2: Interaction Stepper

### Core Functions

```typescript
// In packages/ludics-core/dds/interaction/stepper.ts

/**
 * Create initial interaction state from arena
 */
function createInitialState(arena: DeliberationArena): InteractionState;

/**
 * Step interaction forward with a move
 * Returns new state (immutable)
 */
function stepInteraction(
  state: InteractionState,
  action: DialogueAct
): InteractionState;

/**
 * Validate a move is legal in current state
 */
function validateMove(
  state: InteractionState,
  action: DialogueAct
): { valid: boolean; errors: string[] };

/**
 * Get all legal moves from current state
 */
function getLegalMoves(state: InteractionState): DialogueAct[];

/**
 * Check if interaction has terminated
 */
function isTerminated(state: InteractionState): boolean;
```

### Validation Rules

1. **Polarity check**: Move polarity must match active polarity
2. **Address check**: Focus must be reachable from current address
3. **Ramification check**: Ramification must be subset of available responses
4. **Sequence check**: Move must follow from current path

### Checklist

- [ ] Implement `createInitialState()`
- [ ] Implement `stepInteraction()`
- [ ] Implement `validateMove()` with all rules
- [ ] Implement `getLegalMoves()`
- [ ] Implement `isTerminated()`
- [ ] Handle edge cases (empty arena, already terminated)
- [ ] Write unit tests

---

## Task 2.3: Outcome Detection

### Core Functions

```typescript
// In packages/ludics-core/dds/interaction/outcome.ts

/**
 * Detect outcome of current state
 * Returns null if game still in progress
 */
function detectOutcome(state: InteractionState): InteractionResult | null;

/**
 * Check if interaction ended convergently (with daimon)
 */
function isConvergent(state: InteractionState): boolean;

/**
 * Check if interaction ended divergently (player stuck)
 */
function isDivergent(state: InteractionState): boolean;

/**
 * Determine winner from outcome
 * In ludics: stuck player loses
 */
function determineWinner(state: InteractionState): Polarity | null;

/**
 * Build visitable path from completed interaction
 */
function buildVisitablePath(
  trace: DialogueAct[],
  convergent: boolean
): VisitablePath;
```

### Outcome Rules

From "Visitable Paths" paper:

1. **Convergent**: Interaction ends with daimon (explicit termination)
2. **Divergent**: Player has no legal moves (stuck)
3. **Winner**: The player who could still move when other got stuck

### Checklist

- [ ] Implement `detectOutcome()`
- [ ] Implement `isConvergent()`
- [ ] Implement `isDivergent()`
- [ ] Implement `determineWinner()`
- [ ] Implement `buildVisitablePath()`
- [ ] Handle daimon detection
- [ ] Handle stuck player detection
- [ ] Write unit tests

---

## Task 2.4: Strategy Types

### Types to Define

```typescript
// In packages/ludics-core/dds/types/ludics-theory.ts

/** Chronicle = single path through design */
interface Chronicle {
  id: string;
  actions: DialogueAct[];
  isComplete: boolean;           // Ends in daimon or blocked
}

/** Strategy = response pattern at each position */
interface Strategy {
  id: string;
  designId: string;
  polarity: Polarity;
  responses: Map<string, LudicAddress>;  // address → chosen response
}

/** LudicDesign with full structure */
interface LudicDesign {
  id: string;
  base: LudicAddress[];          // Initial addresses
  polarity: Polarity;            // Starting polarity
  chronicles: Chronicle[];       // All possible response paths
  hasDaimon: boolean;            // Can this design "give up"?
}
```

### Checklist

- [ ] Define `Chronicle` type
- [ ] Define `Strategy` type  
- [ ] Enhance `LudicDesign` type
- [ ] Implement `createChronicle()`
- [ ] Implement `createStrategy()`
- [ ] Implement `createDesign()`
- [ ] Implement `applyStrategy()` to get move from state
- [ ] Write unit tests

---

## Task 2.5: Play Management

### Core Functions

```typescript
// In packages/ludics-core/dds/interaction/play.ts

/**
 * Create a new play from arena
 */
function createPlay(
  arena: DeliberationArena,
  options?: { participants?: Participant[] }
): Play;

/**
 * Make a move in the play
 * Returns updated play (immutable)
 */
function makeMove(play: Play, action: DialogueAct): Play;

/**
 * Undo last move
 */
function undoMove(play: Play): Play;

/**
 * Complete the play and get result
 */
function completePlay(play: Play): Play & { result: InteractionResult };

/**
 * Serialize play for storage
 */
function serializePlay(play: Play): string;

/**
 * Deserialize play from storage
 */
function deserializePlay(data: string): Play;
```

### Checklist

- [ ] Implement `createPlay()`
- [ ] Implement `makeMove()`
- [ ] Implement `undoMove()`
- [ ] Implement `completePlay()`
- [ ] Implement `serializePlay()` / `deserializePlay()`
- [ ] Track move history
- [ ] Track timing information
- [ ] Write unit tests

---

## Task 2.6: Integration with Arena

### Adapter Functions

```typescript
// In packages/ludics-core/dds/adapters/play-adapter.ts

/**
 * Convert Play to DialogueGame format (for existing game engine)
 */
function playToDialogueGame(play: Play): DialogueGame;

/**
 * Convert DialogueGame back to Play
 */
function dialogueGameToPlay(game: DialogueGame): Play;

/**
 * Sync play state with arena positions
 */
function syncPlayWithArena(play: Play): Play;
```

### Checklist

- [ ] Implement `playToDialogueGame()`
- [ ] Implement `dialogueGameToPlay()`
- [ ] Implement `syncPlayWithArena()`
- [ ] Handle position lookups
- [ ] Handle polarity mapping
- [ ] Write integration tests

---

## File Structure

```
packages/ludics-core/dds/
├── interaction/
│   ├── index.ts           # Exports
│   ├── stepper.ts         # Task 2.2
│   ├── outcome.ts         # Task 2.3
│   ├── play.ts            # Task 2.5
│   └── strategy.ts        # Task 2.4
├── adapters/
│   └── play-adapter.ts    # Task 2.6
├── types/
│   └── ludics-theory.ts   # Task 2.1 (extend)
└── __tests__/
    └── interaction.test.ts # Tests
```

---

## Success Criteria

1. ✅ Can create interaction state from arena
2. ✅ Can step through moves with validation
3. ✅ Can detect convergent/divergent outcomes
4. ✅ Can determine winner
5. ✅ Can build visitable paths
6. ✅ Can manage complete plays
7. ✅ All tests pass

---

## Dependencies

- Phase 1 complete (arena construction)
- Types from `ludics-theory.ts`
- Arena adapter from Phase 1
