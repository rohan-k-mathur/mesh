# Phase 0: Foundation Alignment — Implementation Checklist

**Duration:** 1 week  
**Goal:** Align existing codebase with theoretical framework before building new features

---

## Pre-Flight Checks

- [ ] Verify `packages/ludics-core` builds successfully
- [ ] Confirm Prisma schema has latest ludics models
- [ ] Check existing DDS simulation works (baseline)

---

## Task 0.1: Audit Existing Ludics Core

### Files to Review

| File | Purpose | Status |
|------|---------|--------|
| `packages/ludics-core/dds/arena/positions.ts` | Position management | ✅ Recently fixed |
| `packages/ludics-core/dds/arena/types.ts` | Arena type definitions | To review |
| `packages/ludics-core/dds/game/ai.ts` | AI strategy selection | ✅ Recently fixed |
| `packages/ludics-core/dds/game/types.ts` | Game state types | To review |
| `packages/ludics-core/types/index.ts` | Core type exports | To review |

### Questions to Answer

1. Does `UniversalArena` map to theoretical arena concept?
   - [ ] Addresses derived from argument structure? 
   - [ ] Ramification = available responses?
   
2. Are Faggian-Hyland semantics correctly implemented?
   - [x] Stuck player loses (fixed in recent work)
   - [ ] Daimon handling?
   - [ ] Polarity alternation?

3. What gaps exist between current and target?
   - [ ] Document in `ARCHITECTURE_GAPS.md`

---

## Task 0.2: Define Core Type System

### New Types to Create

Create file: `packages/ludics-core/types/ludics-theory.ts`

```typescript
// ============================================
// LUDICS THEORY TYPES
// Based on Girard, Faggian-Hyland, Fouqueré-Quatrini
// ============================================

/**
 * Ludic Address (Girard's locus/focus)
 * Path through interaction tree
 * 
 * Examples:
 * - [] = root position
 * - [0] = first child of root
 * - [0, 1, 2] = ξ.0.1.2 in Girard notation
 */
export type LudicAddress = number[];

/**
 * Polarity in interaction
 * + = active/asserting (Proponent perspective)
 * - = reactive/challenging (Opponent perspective)
 * 
 * Note: These are PERSPECTIVES, not fixed roles
 */
export type Polarity = '+' | '-';

/**
 * Dialogue Act (from Fouqueré & Quatrini)
 * The atomic unit of deliberative interaction
 */
export interface DialogueAct {
  /** Active (+) or reactive (-) */
  polarity: Polarity;
  
  /** Position being addressed */
  focus: LudicAddress;
  
  /** New positions opened by this act */
  ramification: LudicAddress[];
  
  /** Content (claim text, argument, etc.) */
  expression: string;
  
  /** Type of speech act */
  type: DialogueActType;
}

export type DialogueActType = 
  | 'claim'      // Pose thesis
  | 'argue'      // Provide premises + structure
  | 'negate'     // Refuse/counter
  | 'ask'        // Request justification
  | 'concede'    // Accept opponent's point
  | 'daimon';    // Give up / end interaction

/**
 * Chronicle = Single path through a design
 * Alternating sequence of actions
 */
export interface Chronicle {
  actions: DialogueAct[];
  isComplete: boolean;  // Ends in daimon or terminal
}

/**
 * Design = Strategy = Complete response pattern
 * Set of coherent chronicles
 */
export interface LudicDesignTheory {
  id: string;
  
  /** Initial addresses (base) */
  base: LudicAddress[];
  
  /** Starting polarity */
  polarity: Polarity;
  
  /** All possible response paths */
  chronicles: Chronicle[];
  
  /** Can this design give up? */
  hasDaimon: boolean;
  
  /** Is this a winning design? (no daimon = always forces opponent to daimon) */
  isWinning: boolean;
}

/**
 * Arena = Space of interaction
 * Built from deliberation structure
 */
export interface DeliberationArena {
  deliberationId: string;
  rootAddress: LudicAddress;
  positions: Map<string, ArenaPosition>;
  availableDesigns: LudicDesignTheory[];
}

/**
 * Position in arena
 */
export interface ArenaPosition {
  address: LudicAddress;
  content: string;
  type: 'claim' | 'support' | 'attack' | 'question' | 'response';
  ramification: LudicAddress[];
  polarity: Polarity;
  depth: number;
}

/**
 * Visitable Path = Proof Trace
 * The actual interaction that occurred
 */
export interface VisitablePath {
  /** All actions in order */
  actions: DialogueAct[];
  
  /** Did interaction end with daimon? */
  convergent: boolean;
  
  /** Who could still move when it ended? */
  winner: 'P' | 'O' | null;
  
  /** Essential core (incarnation) */
  incarnation: DialogueAct[];
}

/**
 * Interaction State
 */
export interface InteractionState {
  arena: DeliberationArena;
  currentPath: DialogueAct[];
  currentAddress: LudicAddress;
  activePolarity: Polarity;
  pDesign: LudicDesignTheory | null;
  oDesign: LudicDesignTheory | null;
  terminated: boolean;
}

/**
 * Interaction Outcome
 */
export interface InteractionResult {
  path: VisitablePath;
  outcome: 'convergent' | 'divergent';
  stuckPlayer: 'P' | 'O' | null;
  trace: DialogueAct[];
  moveCount: number;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/** Convert address to string key for Map lookup */
export function addressToKey(addr: LudicAddress): string {
  return JSON.stringify(addr);
}

/** Parse string key back to address */
export function keyToAddress(key: string): LudicAddress {
  return JSON.parse(key);
}

/** Check if two addresses are equal */
export function addressEquals(a: LudicAddress, b: LudicAddress): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** Check if a is prefix of b */
export function isPrefix(a: LudicAddress, b: LudicAddress): boolean {
  return a.length <= b.length && a.every((v, i) => v === b[i]);
}

/** Get polarity at address (even depth = +, odd depth = -) */
export function polarityAtAddress(addr: LudicAddress): Polarity {
  return addr.length % 2 === 0 ? '+' : '-';
}

/** Create daimon action at address */
export function createDaimon(focus: LudicAddress): DialogueAct {
  return {
    polarity: '+',
    focus,
    ramification: [],
    expression: '†',
    type: 'daimon'
  };
}
```

### Checklist

- [ ] Create `packages/ludics-core/types/ludics-theory.ts`
- [ ] Export from `packages/ludics-core/types/index.ts`
- [ ] Add JSDoc comments explaining theory connections
- [ ] Create unit tests for utility functions

---

## Task 0.3: Create Migration Layer

### Adapters Needed

#### 1. DialogueMove ↔ DialogueAct

```typescript
// packages/ludics-core/adapters/dialogue-move-adapter.ts

import { DialogueMove } from '@/types/deliberation';
import { DialogueAct, LudicAddress } from '../types/ludics-theory';

export function dialogueMoveToAct(
  move: DialogueMove,
  addressMap: Map<string, LudicAddress>
): DialogueAct {
  const focus = addressMap.get(move.targetId) ?? [];
  
  return {
    polarity: move.speakerRole === 'proponent' ? '+' : '-',
    focus,
    ramification: computeRamificationFromMove(move, addressMap),
    expression: move.content,
    type: mapMoveTypeToActType(move.type)
  };
}

export function actToDialogueMove(
  act: DialogueAct,
  addressMap: Map<string, string>  // Reverse map: address → targetId
): DialogueMove {
  // ... inverse transformation
}
```

#### 2. Prisma LudicDesign ↔ Runtime LudicDesignTheory

```typescript
// packages/ludics-core/adapters/prisma-adapter.ts

import { LudicDesign as PrismaDesign, LudicAct } from '@prisma/client';
import { LudicDesignTheory, Chronicle, DialogueAct } from '../types/ludics-theory';

export function prismaDesignToTheory(
  prismaDesign: PrismaDesign & { acts: LudicAct[] }
): LudicDesignTheory {
  // Transform Prisma model to runtime theory type
  const chronicles = buildChroniclesFromActs(prismaDesign.acts);
  
  return {
    id: prismaDesign.id,
    base: JSON.parse(prismaDesign.base),
    polarity: prismaDesign.polarity as Polarity,
    chronicles,
    hasDaimon: chronicles.some(c => c.actions.some(a => a.type === 'daimon')),
    isWinning: !chronicles.some(c => c.actions.some(a => a.type === 'daimon'))
  };
}

export function theoryDesignToPrisma(
  design: LudicDesignTheory,
  behaviourId: string
): Omit<PrismaDesign, 'id' | 'createdAt' | 'updatedAt'> {
  // ... inverse transformation for persistence
}
```

### Checklist

- [ ] Create `packages/ludics-core/adapters/dialogue-move-adapter.ts`
- [ ] Create `packages/ludics-core/adapters/prisma-adapter.ts`
- [ ] Create `packages/ludics-core/adapters/index.ts` (exports)
- [ ] Write adapter tests with roundtrip verification

---

## Task 0.4: Document Architecture Gaps

Create `packages/ludics-core/ARCHITECTURE_GAPS.md`:

```markdown
# Architecture Gaps: Current vs Target

## Current State

### What We Have
- UniversalArena with positions
- DDS game simulation
- AI with minimax
- Basic Prisma models

### What's Missing
- [ ] Arena construction from deliberation
- [ ] Proper ramification computation
- [ ] Ludicability validation
- [ ] Incarnation extraction
- [ ] Behaviour closure computation
- [ ] Multi-party perspective handling

## Gap Analysis

| Feature | Current | Target | Gap |
|---------|---------|--------|-----|
| Arena source | Manual/demo | Deliberation | Need parser |
| Address system | Integer tree | Ludic addresses | Minor refactor |
| Polarity | Fixed P/O | Perspective-relative | Conceptual shift |
| Termination | Empty moves | Daimon + stuck | Partially done |
| Output | Winner | Visitable path | New feature |

## Migration Path

1. Add new types alongside existing
2. Create adapters
3. Gradually replace internal usages
4. Maintain backward compatibility for API
```

### Checklist

- [ ] Complete architecture audit
- [ ] Document all gaps
- [ ] Propose migration path
- [ ] Identify breaking changes (if any)

---

## Verification Checklist

Before moving to Phase 1, verify:

- [ ] All new types compile without errors
- [ ] Adapters have 100% test coverage for roundtrips
- [ ] Existing simulation still works
- [ ] Architecture gaps are documented
- [ ] Team alignment on type system

---

## Files Created This Phase

```
packages/ludics-core/
├── types/
│   ├── ludics-theory.ts          # NEW
│   └── index.ts                  # UPDATED
├── adapters/
│   ├── dialogue-move-adapter.ts  # NEW
│   ├── prisma-adapter.ts         # NEW
│   └── index.ts                  # NEW
├── __tests__/
│   ├── ludics-theory.test.ts     # NEW
│   └── adapters.test.ts          # NEW
└── ARCHITECTURE_GAPS.md          # NEW
```

---

## Notes

- Keep existing DDS code working throughout
- New types should be additive, not replacement (yet)
- Phase 1 will use these types to build arena construction
