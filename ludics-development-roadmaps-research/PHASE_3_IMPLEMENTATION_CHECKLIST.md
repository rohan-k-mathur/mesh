# Phase 3: Visitable Path Extraction & Incarnation — Implementation Checklist

**Duration:** 2 weeks  
**Goal:** Extract proof traces and compute essential logical cores  
**Status:** ✅ COMPLETE

---

## Implementation Summary

All Phase 3 components have been implemented and tested:

### Files Created

| File | Description | Lines |
|------|-------------|-------|
| `dds/extraction/path-extractor.ts` | Path extraction from interactions/behaviours | ~480 |
| `dds/extraction/incarnation.ts` | Incarnation/view computation | ~350 |
| `dds/extraction/completion.ts` | Design completion with daimons | ~320 |
| `dds/extraction/narrative-formatter.ts` | Proof trace to narrative | ~420 |
| `dds/extraction/index.ts` | Module exports | ~115 |
| `dds/__tests__/extraction.test.ts` | Comprehensive tests | ~830 |

### Test Results

```
✓ packages/ludics-core/dds/__tests__/extraction.test.ts (59 tests) 6ms
Test Files  1 passed (1)
Tests  59 passed (59)
```

### Key Features Implemented

1. **Path Extraction**
   - Extract paths from interactions and behaviours
   - Path validation (polarity alternation, address sequences)
   - Path comparison and merging
   - Statistics (move counts, depths, compression ratio)

2. **Incarnation Computation**
   - View operation (filter by justification)
   - Incarnation extraction (essential core)
   - Justification chain analysis
   - Compression ratio calculation

3. **Design Completion**
   - Chronicle completeness checking
   - Add daimon endings to incomplete branches
   - Completion statistics and validation
   - Strip/count daimon utilities

4. **Narrative Formatting**
   - Multiple styles (formal, conversational, academic)
   - Multiple output formats (Markdown, JSON, plain text, HTML)
   - Narrative analysis and comparison
   - Conclusion derivation

---

## Overview

Phase 3 builds on the interaction engine from Phase 2 to create the extraction system:
**InteractionResult → VisitablePath → Incarnation → JustifiedNarrative**

### Key Concepts from Theory

| Concept | Definition | Implementation |
|---------|------------|----------------|
| Visitable Path | A path in a design that may be traversed by interaction | `VisitablePath` type |
| Incarnation | The essential core (relevant part of design traversed) | `computeIncarnation()` |
| View | Filter keeping positive + justified negative actions | `computeView()` |
| Design Completion | Adding daimon endings to incomplete branches | `completeDesign()` |
| Justified Narrative | Human-readable proof trace | `JustifiedNarrative` type |

### Theoretical Foundation

From Fouqueré & Quatrini "Study of Behaviours via Visitable Paths":
- A visitable path is characterized by which actions are "essential"
- The incarnation strips away non-essential parts
- The view operation filters negative actions by justification
- Complete designs have daimon endings on all incomplete branches

---

## Task 3.1: Path Extractor Module

### File: `packages/ludics-core/dds/extraction/path-extractor.ts`

#### Interface Definition

```typescript
interface PathExtractor {
  /**
   * Extract the visitable path from a completed interaction
   * This IS the proof trace
   */
  extractPath(interaction: InteractionResult): VisitablePath;

  /**
   * Compute all visitable paths for a behaviour
   * Used for landscape mapping in Phase 4
   */
  extractAllPaths(behaviour: LudicBehaviourTheory): VisitablePath[];

  /**
   * Extract paths from multiple interactions (batch)
   */
  extractPaths(interactions: InteractionResult[]): VisitablePath[];
}
```

#### Functions to Implement

- [x] `extractPath(interaction: InteractionResult): VisitablePath`
- [x] `extractAllPaths(behaviour: LudicBehaviourTheory): VisitablePath[]`
- [x] `extractPaths(interactions: InteractionResult[]): VisitablePath[]`
- [x] `validatePath(path: VisitablePath): PathValidation`
- [x] `comparePaths(path1: VisitablePath, path2: VisitablePath): PathComparison`
- [x] `mergePaths(paths: VisitablePath[]): MergedPath`

#### Checklist

- [x] Create `path-extractor.ts` file
- [x] Implement PathExtractor interface
- [x] Add path validation logic
- [x] Add path comparison/merge utilities
- [x] Export from index
- [x] Write unit tests

---

## Task 3.2: Incarnation Algorithm Module

### File: `packages/ludics-core/dds/extraction/incarnation.ts`

#### Core Algorithm (from paper)

```typescript
/**
 * Incarnation computation steps:
 * 1. Build view of the trace (filter negative by justification)
 * 2. Remove non-essential negative actions
 * 3. Compute the essential core
 */
```

#### Functions to Implement

- [x] `computeIncarnation(trace: DialogueAct[]): DialogueAct[]`
- [x] `computeView(trace: DialogueAct[]): DialogueAct[]`
- [x] `hasJustifyingPositive(act: DialogueAct, previous: DialogueAct[]): boolean`
- [x] `findJustifyingPositive(act: DialogueAct, trace: DialogueAct[]): DialogueAct | null`
- [x] `isEssentialAction(act: DialogueAct, view: DialogueAct[]): boolean`
- [x] `stripNonEssential(view: DialogueAct[]): DialogueAct[]`

#### View Operation Rules

From the paper:
1. Keep all positive actions (asserting player)
2. For negative actions, keep only those justified by immediately preceding positive
3. If negative not immediately justified, find justifier and truncate view

#### Checklist

- [x] Create `incarnation.ts` file
- [x] Implement view computation with proper justification logic
- [x] Implement incarnation extraction
- [x] Handle edge cases (empty trace, all daimons, etc.)
- [x] Export from index
- [x] Write unit tests

---

## Task 3.3: Design Completion Module

### File: `packages/ludics-core/dds/extraction/completion.ts`

#### Purpose

Complete a design by adding daimon endings to all incomplete branches.
This ensures interaction can always terminate.

#### Functions to Implement

- [x] `completeDesign(design: LudicDesignTheory): LudicDesignTheory`
- [x] `findIncompleteChronicles(design: LudicDesignTheory): Chronicle[]`
- [x] `addDaimonEnding(chronicle: Chronicle): Chronicle`
- [x] `isChronicleComplete(chronicle: Chronicle): boolean`
- [x] `getIncompletePositions(design: LudicDesignTheory): LudicAddress[]`

#### Completion Rules

From the paper:
1. For each chronicle in the design
2. If the last action is positive and chronicle is not complete
3. Add a daimon action at that position
4. Mark chronicle as complete

#### Checklist

- [x] Create `completion.ts` file
- [x] Implement design completion algorithm
- [x] Handle already-complete designs (no-op)
- [x] Track completion statistics
- [x] Export from index
- [x] Write unit tests

---

## Task 3.4: Narrative Formatter Module

### File: `packages/ludics-core/dds/extraction/narrative-formatter.ts`

#### Purpose

Convert incarnation to human-readable justified narrative.
This is the Curry-Howard correspondence for justified conclusions.

#### Types

```typescript
interface JustifiedNarrative {
  steps: NarrativeStep[];
  conclusion: string;
  justificationChain: string[];
}

interface NarrativeStep {
  position: string;           // The claim/argument text
  justification: string;      // Why this step follows
  speaker: 'Proponent' | 'Opponent';
  type: 'claim' | 'support' | 'attack' | 'concession';
  address: LudicAddress;      // Position in tree
}
```

#### Functions to Implement

- [x] `formatAsNarrative(path: VisitablePath, arena: DeliberationArena): JustifiedNarrative`
- [x] `deriveJustification(act: DialogueAct, previousActs: DialogueAct[]): string`
- [x] `deriveConclusion(steps: NarrativeStep[]): string`
- [x] `narrativeToMarkdown(narrative: JustifiedNarrative): string`
- [x] `narrativeToJSON(narrative: JustifiedNarrative): object`
- [x] `narrativeToPlainText(narrative: JustifiedNarrative): string`

#### Justification Templates

```typescript
const JUSTIFICATION_TEMPLATES = {
  claim: "Initial claim: {content}",
  support: "This follows because: {content}",
  attack: "However, {speaker} counters: {content}",
  concession: "{speaker} concedes: {content}",
  daimon: "{speaker} withdraws from this position",
};
```

#### Checklist

- [x] Create `narrative-formatter.ts` file
- [x] Implement narrative formatting
- [x] Add multiple output formats (markdown, JSON, plain text)
- [x] Handle different narrative styles (formal, conversational)
- [x] Export from index
- [x] Write unit tests

---

## Task 3.5: Module Index and Exports

### File: `packages/ludics-core/dds/extraction/index.ts`

#### Exports to Include

```typescript
// Path extraction
export { 
  extractPath,
  extractAllPaths,
  extractPaths,
  validatePath,
  comparePaths,
  mergePaths,
} from "./path-extractor";

// Incarnation
export {
  computeIncarnation,
  computeView,
  hasJustifyingPositive,
  findJustifyingPositive,
  isEssentialAction,
  stripNonEssential,
} from "./incarnation";

// Design completion
export {
  completeDesign,
  findIncompleteChronicles,
  addDaimonEnding,
  isChronicleComplete,
  getIncompletePositions,
} from "./completion";

// Narrative formatting
export {
  formatAsNarrative,
  deriveJustification,
  deriveConclusion,
  narrativeToMarkdown,
  narrativeToJSON,
  narrativeToPlainText,
} from "./narrative-formatter";

// Types
export type {
  PathValidation,
  PathComparison,
  MergedPath,
} from "./path-extractor";
```

#### Checklist

- [x] Create `extraction/index.ts`
- [x] Export all functions
- [x] Export all types
- [x] Update `dds/index.ts` to include extraction module

---

## Task 3.6: Test Suite

### File: `packages/ludics-core/dds/__tests__/extraction.test.ts`

#### Test Categories

1. **Path Extraction Tests**
   - [x] Extract path from convergent interaction
   - [x] Extract path from divergent interaction
   - [x] Extract all paths from behaviour
   - [x] Path validation

2. **Incarnation Tests**
   - [x] Compute view with positive actions only
   - [x] Compute view with justified negatives
   - [x] Compute view with non-justified negatives (should truncate)
   - [x] Compute incarnation (essential core)
   - [x] Empty trace handling
   - [x] Daimon-only trace

3. **Design Completion Tests**
   - [x] Complete design with incomplete chronicles
   - [x] No-op for already complete design
   - [x] Find incomplete positions

4. **Narrative Formatting Tests**
   - [x] Format basic path as narrative
   - [x] Format attack sequence
   - [x] Format concession
   - [x] Markdown output
   - [x] JSON output

#### Checklist

- [x] Create test file
- [x] Implement path extraction tests
- [x] Implement incarnation tests
- [x] Implement completion tests
- [x] Implement narrative tests
- [x] All tests passing (59 tests)

---

## Files Created

```
packages/ludics-core/dds/
├── extraction/
│   ├── index.ts                 # ✅ Module exports
│   ├── path-extractor.ts        # ✅ Task 3.1
│   ├── incarnation.ts           # ✅ Task 3.2
│   ├── completion.ts            # ✅ Task 3.3
│   └── narrative-formatter.ts   # ✅ Task 3.4
└── __tests__/
    └── extraction.test.ts       # ✅ Task 3.6
```

---

## Success Criteria

1. ✅ Can extract visitable path from interaction result
2. ✅ Can compute incarnation (essential core) of path
3. ✅ Can complete designs with daimon branches
4. ✅ Can format path as human-readable narrative
5. ✅ All tests pass (59/59)
6. ✅ Module properly exported

---

## Dependencies

### From Phase 2 (✅ Complete)
- `InteractionResult` type
- `VisitablePath` type  
- `computeIncarnation()` basic implementation (in outcome.ts)
- `computeView()` basic implementation (in outcome.ts)
- `DialogueAct` type

### External
- Arena construction (Phase 1)
- Types from `ludics-theory.ts`

---

## Notes

- The basic `computeIncarnation` and `computeView` exist in `outcome.ts`
- Phase 3 creates a dedicated extraction module with more sophisticated algorithms
- Narrative formatter enables Curry-Howard correspondence (proofs as programs)
- Design completion is important for Phase 4 landscape mapping
