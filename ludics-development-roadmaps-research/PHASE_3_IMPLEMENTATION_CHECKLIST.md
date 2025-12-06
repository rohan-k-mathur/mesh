# Phase 3: Visitable Path Extraction & Incarnation — Implementation Checklist

**Duration:** 2 weeks  
**Goal:** Extract proof traces and compute essential logical cores  
**Status:** 🚧 IN PROGRESS

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

- [ ] `extractPath(interaction: InteractionResult): VisitablePath`
- [ ] `extractAllPaths(behaviour: LudicBehaviourTheory): VisitablePath[]`
- [ ] `extractPaths(interactions: InteractionResult[]): VisitablePath[]`
- [ ] `validatePath(path: VisitablePath): PathValidation`
- [ ] `comparePaths(path1: VisitablePath, path2: VisitablePath): PathComparison`
- [ ] `mergePaths(paths: VisitablePath[]): MergedPath`

#### Checklist

- [ ] Create `path-extractor.ts` file
- [ ] Implement PathExtractor interface
- [ ] Add path validation logic
- [ ] Add path comparison/merge utilities
- [ ] Export from index
- [ ] Write unit tests

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

- [ ] `computeIncarnation(trace: DialogueAct[]): DialogueAct[]`
- [ ] `computeView(trace: DialogueAct[]): DialogueAct[]`
- [ ] `hasJustifyingPositive(act: DialogueAct, previous: DialogueAct[]): boolean`
- [ ] `findJustifyingPositive(act: DialogueAct, trace: DialogueAct[]): DialogueAct | null`
- [ ] `isEssentialAction(act: DialogueAct, view: DialogueAct[]): boolean`
- [ ] `stripNonEssential(view: DialogueAct[]): DialogueAct[]`

#### View Operation Rules

From the paper:
1. Keep all positive actions (asserting player)
2. For negative actions, keep only those justified by immediately preceding positive
3. If negative not immediately justified, find justifier and truncate view

#### Checklist

- [ ] Create `incarnation.ts` file
- [ ] Implement view computation with proper justification logic
- [ ] Implement incarnation extraction
- [ ] Handle edge cases (empty trace, all daimons, etc.)
- [ ] Export from index
- [ ] Write unit tests

---

## Task 3.3: Design Completion Module

### File: `packages/ludics-core/dds/extraction/completion.ts`

#### Purpose

Complete a design by adding daimon endings to all incomplete branches.
This ensures interaction can always terminate.

#### Functions to Implement

- [ ] `completeDesign(design: LudicDesignTheory): LudicDesignTheory`
- [ ] `findIncompleteChronicles(design: LudicDesignTheory): Chronicle[]`
- [ ] `addDaimonEnding(chronicle: Chronicle): Chronicle`
- [ ] `isChronicleComplete(chronicle: Chronicle): boolean`
- [ ] `getIncompletePositions(design: LudicDesignTheory): LudicAddress[]`

#### Completion Rules

From the paper:
1. For each chronicle in the design
2. If the last action is positive and chronicle is not complete
3. Add a daimon action at that position
4. Mark chronicle as complete

#### Checklist

- [ ] Create `completion.ts` file
- [ ] Implement design completion algorithm
- [ ] Handle already-complete designs (no-op)
- [ ] Track completion statistics
- [ ] Export from index
- [ ] Write unit tests

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

- [ ] `formatAsNarrative(path: VisitablePath, arena: DeliberationArena): JustifiedNarrative`
- [ ] `deriveJustification(act: DialogueAct, previousActs: DialogueAct[]): string`
- [ ] `deriveConclusion(steps: NarrativeStep[]): string`
- [ ] `narrativeToMarkdown(narrative: JustifiedNarrative): string`
- [ ] `narrativeToJSON(narrative: JustifiedNarrative): object`
- [ ] `narrativeToPlainText(narrative: JustifiedNarrative): string`

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

- [ ] Create `narrative-formatter.ts` file
- [ ] Implement narrative formatting
- [ ] Add multiple output formats (markdown, JSON, plain text)
- [ ] Handle different narrative styles (formal, conversational)
- [ ] Export from index
- [ ] Write unit tests

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

- [ ] Create `extraction/index.ts`
- [ ] Export all functions
- [ ] Export all types
- [ ] Update `dds/index.ts` to include extraction module

---

## Task 3.6: Test Suite

### File: `packages/ludics-core/dds/__tests__/extraction.test.ts`

#### Test Categories

1. **Path Extraction Tests**
   - [ ] Extract path from convergent interaction
   - [ ] Extract path from divergent interaction
   - [ ] Extract all paths from behaviour
   - [ ] Path validation

2. **Incarnation Tests**
   - [ ] Compute view with positive actions only
   - [ ] Compute view with justified negatives
   - [ ] Compute view with non-justified negatives (should truncate)
   - [ ] Compute incarnation (essential core)
   - [ ] Empty trace handling
   - [ ] Daimon-only trace

3. **Design Completion Tests**
   - [ ] Complete design with incomplete chronicles
   - [ ] No-op for already complete design
   - [ ] Find incomplete positions

4. **Narrative Formatting Tests**
   - [ ] Format basic path as narrative
   - [ ] Format attack sequence
   - [ ] Format concession
   - [ ] Markdown output
   - [ ] JSON output

#### Checklist

- [ ] Create test file
- [ ] Implement path extraction tests
- [ ] Implement incarnation tests
- [ ] Implement completion tests
- [ ] Implement narrative tests
- [ ] All tests passing

---

## Files to Create

```
packages/ludics-core/dds/
├── extraction/
│   ├── index.ts                 # Module exports
│   ├── path-extractor.ts        # Task 3.1
│   ├── incarnation.ts           # Task 3.2
│   ├── completion.ts            # Task 3.3
│   └── narrative-formatter.ts   # Task 3.4
└── __tests__/
    └── extraction.test.ts       # Task 3.6
```

---

## Success Criteria

1. ✅ Can extract visitable path from interaction result
2. ✅ Can compute incarnation (essential core) of path
3. ✅ Can complete designs with daimon branches
4. ✅ Can format path as human-readable narrative
5. ✅ All tests pass
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
