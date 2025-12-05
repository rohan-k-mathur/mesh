# Phase 1: Arena Construction from Deliberation — Implementation Checklist

**Duration:** 2 weeks  
**Goal:** Transform any deliberation into a playable ludic arena  
**Status:** ✅ COMPLETE

---

## Implementation Summary

All Phase 1 components have been implemented and tested:

### Files Created

| File | Description | Lines |
|------|-------------|-------|
| `dds/arena/deliberation-address.ts` | Address tree builder | ~613 |
| `dds/arena/deliberation-queries.ts` | Prisma query functions | ~240 |
| `dds/arena/ludicability.ts` | Validation logic | ~486 |
| `dds/arena/arena-construction.ts` | Main entry point | ~619 |
| `dds/adapters/arena-adapter.ts` | UniversalArena adapter | ~507 |
| `dds/__tests__/arena-construction.test.ts` | Comprehensive tests | ~857 |

### Test Results

```
✓ packages/ludics-core/dds/__tests__/arena-construction.test.ts (39 tests) 6ms
Test Files  1 passed (1)
Tests  39 passed (39)
```

---

## Overview

Phase 1 builds on the foundation types from Phase 0 to create the core functionality:
**Deliberation → DeliberationArena**

### Key Insight: Deliberation Structure → Ludic Addresses

The deliberation model organizes argumentation as:
- **Arguments**: Have `conclusionClaimId`, `premises` (via ArgumentPremise), and text
- **Claims**: I-nodes in AIF terms, can have `edgesFrom`/`edgesTo` (ClaimEdge)
- **ArgumentEdge**: Attack relations between arguments (REBUTS, UNDERCUTS, UNDERMINES)
- **ArgumentPremise**: Links argument → premise claims (with `isImplicit`, `isAxiom`)

This maps to ludic addresses as:
- Root claim → address `[]`
- Argument for root → address `[0]` (P plays)
- Counter-argument → address `[0, 0]` (O plays)
- Support for counter → address `[0, 0, 0]` (P plays)
- etc.

---

## Task 1.1: Address Mapping Strategy

### Design Decisions

1. **Root selection**: The deliberation's focal claim (or first argument's conclusion)
2. **Children as ramification**: Each argument's attacks/supports become children
3. **Polarity alternation**: Even depth = P (active), Odd depth = O (reactive)

### Implementation Plan

```typescript
// packages/ludics-core/dds/arena/deliberation-address.ts

/**
 * Build address tree from deliberation structure
 * 
 * Strategy:
 * 1. Find root claim(s) - claims with no incoming arguments
 * 2. For each root claim, trace outward through:
 *    - Arguments concluding that claim (supports)
 *    - Claims that attack the claim (via ClaimEdge)
 * 3. For each argument, trace:
 *    - Other arguments attacking it (ArgumentEdge)
 *    - Premises that can be undermined
 * 4. Assign addresses depth-first
 */
```

### Address Assignment Rules

| Element Type | Parent | Address Logic |
|--------------|--------|---------------|
| Root claim | None | `[]` |
| Argument for claim at `[i...]` | Claim | `[...i, nextIndex]` |
| Attack on argument at `[i...]` | Argument | `[...i, nextIndex]` |
| Premise challenge at `[i...]` | Argument | `[...i, premiseIndex]` |
| Support/response to `[i...]` | Any | `[...i, nextIndex]` |

### Checklist

- [ ] Define `AddressTreeNode` type
- [ ] Implement `buildAddressTree(deliberation)`
- [ ] Implement `findRootClaims(deliberation)`
- [ ] Implement `assignAddresses(tree)` depth-first
- [ ] Handle cycles (arguments attacking each other)
- [ ] Write tests for address assignment

---

## Task 1.2: Ramification Computation

### Definition

**Ramification** at address `ξ` = set of indices where interaction can continue
- In ludics: `ξ ⟨ I ⟩` means at focus ξ, player opens branches I ⊂ ℕ
- In deliberation: available responses (attacks, supports, new claims)

### Implementation

```typescript
// packages/ludics-core/dds/arena/ramification.ts

interface RamificationContext {
  deliberationId: string;
  addressTree: AddressTree;
  arguments: ArgumentWithRelations[];
  edges: ArgumentEdge[];
  claimEdges: ClaimEdge[];
}

/**
 * Compute ramification at each address
 * 
 * @returns Map from address key → available response indices
 */
function computeRamifications(ctx: RamificationContext): Map<string, number[]> {
  const ramifications = new Map<string, number[]>();
  
  for (const node of ctx.addressTree.nodes()) {
    const available = findAvailableResponses(node, ctx);
    ramifications.set(addressToKey(node.address), available);
  }
  
  return ramifications;
}

/**
 * Find what responses are available at a given node
 */
function findAvailableResponses(node: AddressNode, ctx: RamificationContext): number[] {
  const children = ctx.addressTree.getChildren(node.address);
  return children.map(child => child.address[child.address.length - 1]);
}
```

### Checklist

- [ ] Define `RamificationContext` interface
- [ ] Implement `computeRamifications()`
- [ ] Implement `findAvailableResponses()`
- [ ] Handle empty ramifications (terminal positions)
- [ ] Test ramification computation

---

## Task 1.3: Arena Position Generation

### From Roadmap

```typescript
interface ArenaPositionTheory {
  address: LudicAddress;
  content: string;              // Claim/argument text
  type: 'claim' | 'support' | 'attack' | 'question';
  ramification: number[];       // Available response indices
  polarity: 'P' | 'O';          // Who plays here
  sourceId?: string;            // Original Claim/Argument ID
  sourceType?: 'claim' | 'argument';
}
```

### Implementation

```typescript
// packages/ludics-core/dds/arena/arena-construction.ts

import { DeliberationArena, ArenaPositionTheory } from '../types/ludics-theory';

export interface BuildArenaOptions {
  deliberationId: string;
  rootClaimId?: string;         // Optional: specify root claim
  maxDepth?: number;            // Limit tree depth
  includeImplicitPremises?: boolean;
}

/**
 * Main entry point: Build arena from deliberation
 */
export async function buildArenaFromDeliberation(
  options: BuildArenaOptions
): Promise<DeliberationArena> {
  // 1. Fetch deliberation with all relations
  const deliberation = await fetchDeliberationWithRelations(options.deliberationId);
  
  // 2. Build address tree
  const addressTree = buildAddressTree(deliberation, options);
  
  // 3. Compute ramifications
  const ramifications = computeRamifications({
    deliberationId: options.deliberationId,
    addressTree,
    arguments: deliberation.arguments,
    edges: deliberation.edges,
    claimEdges: deliberation.ClaimEdge
  });
  
  // 4. Generate positions
  const positions = generatePositions(addressTree, ramifications);
  
  // 5. Validate ludicability
  const validation = validateLudicability(positions);
  
  return {
    deliberationId: options.deliberationId,
    rootAddress: [],
    positions,
    addressTree,
    isLudicable: validation.isValid,
    validationErrors: validation.errors
  };
}
```

### Checklist

- [ ] Create `arena-construction.ts`
- [ ] Implement `buildArenaFromDeliberation()`
- [ ] Implement `fetchDeliberationWithRelations()`
- [ ] Implement `generatePositions()`
- [ ] Add proper error handling
- [ ] Write integration tests

---

## Task 1.4: Ludicability Validation

### Properties to Check (from Girard, Faggian-Hyland)

1. **Prefix-closed**: If `ξ` is in design, all prefixes of `ξ` are too
2. **Daimon-closed**: If action has empty ramification, it's a daimon (termination)
3. **Saturation**: At each positive position, all ramifications are covered

### Implementation

```typescript
// packages/ludics-core/dds/arena/ludicability.ts

export interface LudicabilityResult {
  isValid: boolean;
  isPrefixClosed: boolean;
  isDaimonClosed: boolean;
  isSaturated: boolean;
  errors: LudicabilityError[];
}

export interface LudicabilityError {
  type: 'missing-prefix' | 'unclosed-daimon' | 'unsaturated';
  address: LudicAddress;
  message: string;
}

/**
 * Validate that positions form a ludicable structure
 */
export function validateLudicability(
  positions: Map<string, ArenaPositionTheory>
): LudicabilityResult {
  const errors: LudicabilityError[] = [];
  
  // Check prefix closure
  const prefixErrors = checkPrefixClosure(positions);
  errors.push(...prefixErrors);
  
  // Check daimon closure
  const daimonErrors = checkDaimonClosure(positions);
  errors.push(...daimonErrors);
  
  // Check saturation
  const saturationErrors = checkSaturation(positions);
  errors.push(...saturationErrors);
  
  return {
    isValid: errors.length === 0,
    isPrefixClosed: prefixErrors.length === 0,
    isDaimonClosed: daimonErrors.length === 0,
    isSaturated: saturationErrors.length === 0,
    errors
  };
}

/**
 * Prefix closure: For every address in positions, all prefixes must exist
 */
function checkPrefixClosure(positions: Map<string, ArenaPositionTheory>): LudicabilityError[] {
  const errors: LudicabilityError[] = [];
  
  for (const position of positions.values()) {
    for (let i = 0; i < position.address.length; i++) {
      const prefix = position.address.slice(0, i);
      const prefixKey = addressToKey(prefix);
      
      if (!positions.has(prefixKey)) {
        errors.push({
          type: 'missing-prefix',
          address: position.address,
          message: `Missing prefix ${prefixKey} for address ${addressToKey(position.address)}`
        });
      }
    }
  }
  
  return errors;
}
```

### Checklist

- [ ] Create `ludicability.ts`
- [ ] Implement `validateLudicability()`
- [ ] Implement `checkPrefixClosure()`
- [ ] Implement `checkDaimonClosure()`
- [ ] Implement `checkSaturation()`
- [ ] Write validation tests

---

## Task 1.5: Database Query Functions

### Prisma Query for Deliberation with Relations

```typescript
// packages/ludics-core/dds/arena/deliberation-queries.ts

import prisma from '@/lib/prisma';

export type DeliberationWithRelations = Awaited<
  ReturnType<typeof fetchDeliberationWithRelations>
>;

export async function fetchDeliberationWithRelations(deliberationId: string) {
  return prisma.deliberation.findUnique({
    where: { id: deliberationId },
    include: {
      arguments: {
        include: {
          conclusion: true,           // The claim this argument concludes
          premises: {                 // ArgumentPremise join table
            include: { claim: true }  // The premise claims
          },
          outgoingEdges: true,        // Attacks this argument makes
          incomingEdges: true,        // Attacks on this argument
          scheme: true,               // Argumentation scheme
          argumentSchemes: {
            include: { scheme: true }
          }
        }
      },
      Claim: {
        include: {
          edgesFrom: true,            // ClaimEdge outgoing
          edgesTo: true,              // ClaimEdge incoming
          asPremiseOf: true,          // Where this claim is premise
          asConclusion: true          // Arguments concluding this claim
        }
      },
      edges: true,                    // ArgumentEdge
      ClaimEdge: true
    }
  });
}
```

### Checklist

- [ ] Create `deliberation-queries.ts`
- [ ] Implement `fetchDeliberationWithRelations()`
- [ ] Add type exports for query results
- [ ] Test with sample deliberation data

---

## Task 1.6: Integration with Existing Arena System

### Bridge to Current `UniversalArena`

The current system uses `UniversalArena` with `ArenaMove[]`. We need to:
1. Generate `DeliberationArena` (new type)
2. Convert to `UniversalArena` for game play (adapter)

```typescript
// packages/ludics-core/dds/adapters/arena-adapter.ts

import { UniversalArena, ArenaMove } from '../arena/types';
import { DeliberationArena, ArenaPositionTheory } from '../types/ludics-theory';

/**
 * Convert new DeliberationArena to existing UniversalArena
 * for compatibility with game engine
 */
export function deliberationArenaToUniversal(
  delibArena: DeliberationArena
): UniversalArena {
  const moves: ArenaMove[] = [];
  
  for (const [key, position] of delibArena.positions) {
    moves.push({
      id: `move-${key}`,
      address: addressToString(position.address),
      ramification: position.ramification,
      player: position.polarity,
      isInitial: position.address.length === 0,
      metadata: {
        sourceId: position.sourceId,
        sourceType: position.sourceType,
        content: position.content
      }
    });
  }
  
  return {
    id: `arena-${delibArena.deliberationId}`,
    base: '',
    moves,
    enablingRelation: buildEnablingRelation(moves),
    isUniversal: true,
    createdAt: new Date(),
    deliberationId: delibArena.deliberationId
  };
}
```

### Checklist

- [ ] Create arena adapter functions
- [ ] Implement `deliberationArenaToUniversal()`
- [ ] Implement `universalToDeliberationArena()` (inverse)
- [ ] Test bidirectional conversion
- [ ] Verify game engine works with converted arenas

---

## Files to Create

```
packages/ludics-core/dds/
├── arena/
│   ├── deliberation-address.ts      # Address tree building
│   ├── deliberation-queries.ts      # Prisma queries
│   ├── arena-construction.ts        # Main buildArenaFromDeliberation
│   ├── ramification.ts              # Ramification computation
│   └── ludicability.ts              # Validation functions
├── adapters/
│   └── arena-adapter.ts             # DeliberationArena ↔ UniversalArena
└── __tests__/
    └── arena-construction.test.ts   # Comprehensive tests
```

---

## Verification Checklist

Before moving to Phase 2, verify:

- [ ] `buildArenaFromDeliberation()` works with sample deliberation
- [ ] Address mapping correctly reflects argument structure
- [ ] Ramifications match available attacks/supports
- [ ] Ludicability validation catches invalid structures
- [ ] Converted arenas work with existing game engine
- [ ] All tests pass

---

## Dependencies

### From Phase 0 (✅ Complete)
- `LudicAddress` type
- `ArenaPositionTheory` type
- `DeliberationArena` type
- `addressToKey()`, `keyToAddress()` utilities
- Prisma adapter patterns

### External
- Prisma client with `@/lib/prisma`
- Deliberation models in database

---

## Notes

- Keep backward compatibility with existing `UniversalArena` API
- New `DeliberationArena` adds deliberation-specific metadata
- Validation errors should be informative for debugging
- Consider caching computed arenas for performance

