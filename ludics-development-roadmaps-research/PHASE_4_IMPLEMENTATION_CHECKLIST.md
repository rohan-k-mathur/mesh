# Phase 4: Landscape Mapping — Implementation Checklist

**Duration:** 2 weeks  
**Goal:** Compute and visualize strategic landscape over argument space (Vision E)  
**Status:** ✅ COMPLETE

---

## Overview

Phase 4 implements **Vision E: Strategic Landscape Mapping** from the roadmap.
This reveals all paths through the argument space and their strategic implications.

**Key deliverables:**
- Behaviour computation (biorthogonal closure)
- Position strength analysis
- Landscape visualization data
- Internal completeness checking

### Key Concepts from Theory

| Concept | Definition | Implementation |
|---------|------------|----------------|
| Behaviour | Set of designs closed under biorthogonal | `LudicBehaviourTheory` type |
| Orthogonal (G⊥) | Designs that converge with all in G | `computeOrthogonal()` |
| Biorthogonal (G⊥⊥) | Orthogonal of orthogonal | `computeBiorthogonalClosure()` |
| Position Strength | Strategic value of a position | `PositionStrength` type |
| Critical Point | Where winning strategy changes | `findCriticalPoints()` |
| Flow Path | Common traversal pattern | `FlowPath` type |

### Theoretical Foundation

From Girard's ludics:
- A behaviour is a set G such that G = G⊥⊥
- Two designs D and E are orthogonal (D ⊥ E) if they converge
- The orthogonal G⊥ = { D | D ⊥ E for all E ∈ G }
- Biorthogonal closure captures all "equivalent" strategies

---

## Task 4.1: Behaviour Computer Module

### File: `packages/ludics-core/dds/landscape/behaviour-computer.ts`

#### Types

```typescript
interface BehaviourComputationResult {
  behaviour: LudicBehaviourTheory;
  orthogonal: LudicDesignTheory[];
  isComplete: boolean;
  closureStats: {
    originalCount: number;
    closedCount: number;
    addedDesigns: number;
  };
}
```

#### Functions to Implement

- [x] `computeBehaviour(designs: LudicDesignTheory[]): LudicBehaviourTheory`
- [x] `computeOrthogonal(designs: LudicDesignTheory[]): LudicDesignTheory[]`
- [x] `computeBiorthogonalClosure(designs: LudicDesignTheory[]): LudicDesignTheory[]`
- [x] `converges(d1: LudicDesignTheory, d2: LudicDesignTheory): boolean`
- [x] `designSetsEqual(s1: LudicDesignTheory[], s2: LudicDesignTheory[]): boolean`
- [x] `generateCandidateDesigns(designs: LudicDesignTheory[]): LudicDesignTheory[]`

#### Convergence Rules

From Faggian-Hyland:
1. Two designs converge if their interaction terminates
2. Termination = one player plays daimon or gets stuck
3. Convergent = ends with daimon (success)
4. Divergent = stuck without daimon (failure)

#### Checklist

- [x] Create `behaviour-computer.ts` file
- [x] Implement convergence checking
- [x] Implement orthogonal computation
- [x] Implement biorthogonal closure
- [x] Export from index
- [x] Write unit tests

---

## Task 4.2: Position Analyzer Module

### File: `packages/ludics-core/dds/landscape/position-analyzer.ts`

#### Types

```typescript
interface PositionAnalysis {
  position: PositionStrength;
  children: PositionAnalysis[];
  parent?: PositionAnalysis;
}

interface SimulationResult {
  winner: "P" | "O" | null;
  moveCount: number;
  convergent: boolean;
  path: VisitablePath;
}

interface AnalysisOptions {
  simulations?: number;
  maxDepth?: number;
  includeChildren?: boolean;
  useCache?: boolean;
}
```

#### Functions to Implement

- [x] `analyzePositionStrength(arena, address, options): Promise<PositionStrength>`
- [x] `analyzeAllPositions(arena, options): Promise<PositionStrength[]>`
- [x] `getDesignsStartingAt(arena, address): LudicDesignTheory[]`
- [x] `runSimulations(arena, address, count): Promise<SimulationResult[]>`
- [x] `computeAverageDepth(designs): number`
- [x] `computeWinRate(results, polarity): number`
- [x] `hasWinningStrategy(arena, address): boolean`

#### Analysis Metrics

1. **Win Rate**: % of simulations won from this position
2. **Winning Design Count**: # of designs without daimon
3. **Depth**: Average moves to termination
4. **Branching Factor**: Available responses at position

#### Checklist

- [x] Create `position-analyzer.ts` file
- [x] Implement position strength analysis
- [x] Implement simulation runner
- [x] Implement design enumeration
- [x] Add caching for expensive computations
- [x] Export from index
- [x] Write unit tests

---

## Task 4.3: Visualization Data Module

### File: `packages/ludics-core/dds/landscape/visualization-data.ts`

#### Types

```typescript
interface LandscapeData {
  arena: DeliberationArena;
  positions: PositionStrength[];
  heatMap: HeatMapData;
  flowPaths: FlowPath[];
  criticalPoints: LudicAddress[];
  statistics: LandscapeStatistics;
}

interface HeatMapData {
  positions: HeatMapPosition[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  colorScale: { min: number; max: number };
}

interface HeatMapPosition {
  address: LudicAddress;
  x: number;
  y: number;
  strength: number;
  polarity: "+" | "-";
  label?: string;
}

interface FlowPath {
  addresses: LudicAddress[];
  frequency: number;
  outcome: "convergent" | "divergent";
  winner?: "P" | "O";
}

interface LandscapeStatistics {
  totalPositions: number;
  terminalPositions: number;
  avgBranchingFactor: number;
  maxDepth: number;
  criticalPointCount: number;
  pWinRate: number;
  oWinRate: number;
}
```

#### Functions to Implement

- [x] `generateLandscapeData(arena, analysis): LandscapeData`
- [x] `layoutAsTree(arena, positions): HeatMapData`
- [x] `findCriticalPoints(analysis): LudicAddress[]`
- [x] `extractFlowPaths(arena, simulations): FlowPath[]`
- [x] `computeLandscapeStatistics(data): LandscapeStatistics`
- [x] `landscapeToJSON(data): object`
- [x] `landscapeToSVG(data): string` (optional)

#### Layout Algorithms

1. **Tree Layout**: Standard hierarchical tree
2. **Force-Directed**: For complex graphs
3. **Radial**: Root at center, branches outward

#### Checklist

- [x] Create `visualization-data.ts` file
- [x] Implement tree layout algorithm
- [x] Implement critical point detection
- [x] Implement flow path extraction
- [x] Add statistics computation
- [x] Export from index
- [x] Write unit tests

---

## Task 4.4: Completeness Checker Module

### File: `packages/ludics-core/dds/landscape/completeness-checker.ts`

#### Types

```typescript
interface CompletenessResult {
  isComplete: boolean;
  isInternallyComplete: boolean;
  missingDesigns: LudicDesignTheory[];
  excessDesigns: LudicDesignTheory[];
  diagnostics: string[];
}
```

#### Functions to Implement

- [x] `checkInternalCompleteness(behaviour): CompletenessResult`
- [x] `checkBehaviourCompleteness(behaviour): boolean`
- [x] `findMissingDesigns(behaviour): LudicDesignTheory[]`
- [x] `validateBehaviourStructure(behaviour): ValidationResult`

#### Completeness Criteria

From theory:
1. **Behaviour Completeness**: G = G⊥⊥
2. **Internal Completeness**: No "new" designs from closure
3. **Saturation**: All positions have defined responses

#### Checklist

- [x] Create `completeness-checker.ts` file
- [x] Implement completeness checks
- [x] Implement diagnostic reporting
- [x] Export from index
- [x] Write unit tests

---

## Task 4.5: Module Index and Exports

### File: `packages/ludics-core/dds/landscape/index.ts`

#### Exports to Include

```typescript
// Behaviour computation
export {
  computeBehaviour,
  computeOrthogonal,
  computeBiorthogonalClosure,
  converges,
  designSetsEqual,
} from "./behaviour-computer";

// Position analysis
export {
  analyzePositionStrength,
  analyzeAllPositions,
  getDesignsStartingAt,
  runSimulations,
  hasWinningStrategy,
} from "./position-analyzer";

// Visualization
export {
  generateLandscapeData,
  layoutAsTree,
  findCriticalPoints,
  extractFlowPaths,
  computeLandscapeStatistics,
  landscapeToJSON,
} from "./visualization-data";

// Completeness
export {
  checkInternalCompleteness,
  checkBehaviourCompleteness,
  validateBehaviourStructure,
} from "./completeness-checker";

// Types
export type {
  BehaviourComputationResult,
  PositionAnalysis,
  SimulationResult,
  AnalysisOptions,
  LandscapeData,
  HeatMapData,
  HeatMapPosition,
  FlowPath,
  LandscapeStatistics,
  CompletenessResult,
} from "./types";
```

#### Checklist

- [x] Create `landscape/index.ts`
- [x] Export all functions
- [x] Export all types
- [x] Update `dds/index.ts` to include landscape module

---

## Task 4.6: Test Suite

### File: `packages/ludics-core/dds/__tests__/landscape.test.ts`

#### Test Categories

1. **Behaviour Computation Tests**
   - [x] Compute orthogonal of simple designs
   - [x] Compute biorthogonal closure
   - [x] Check convergence correctly
   - [x] Design set equality

2. **Position Analysis Tests**
   - [x] Analyze single position
   - [x] Analyze full arena
   - [x] Win rate computation
   - [x] Winning strategy detection

3. **Visualization Tests**
   - [x] Tree layout generation
   - [x] Critical point detection
   - [x] Flow path extraction
   - [x] Statistics computation

4. **Completeness Tests**
   - [x] Internal completeness check
   - [x] Behaviour completeness
   - [x] Missing design detection

#### Checklist

- [x] Create test file
- [x] Implement behaviour tests
- [x] Implement analysis tests
- [x] Implement visualization tests
- [x] Implement completeness tests
- [x] All tests passing

---

## Files to Create

```
packages/ludics-core/dds/
├── landscape/
│   ├── index.ts                  # Module exports
│   ├── behaviour-computer.ts     # Task 4.1
│   ├── position-analyzer.ts      # Task 4.2
│   ├── visualization-data.ts     # Task 4.3
│   └── completeness-checker.ts   # Task 4.4
└── __tests__/
    └── landscape.test.ts         # Task 4.6
```

---

## Success Criteria

1. [x] Can compute behaviours from designs
2. [x] Can analyze position strength across arena
3. [x] Can generate visualization data for UI
4. [x] Can check internal completeness
5. [x] All tests pass
6. [x] Module properly exported

---

## Dependencies

### From Phase 3 (✅ Complete)
- Path extraction functions
- Incarnation computation
- Design completion

### From Phase 2 (✅ Complete)
- Interaction engine
- Outcome detection
- Play management

### From Phase 1 (✅ Complete)
- Arena construction
- Address mapping

---

## Notes

- Behaviour computation can be expensive - consider caching
- Simulations should use the AI from Phase 2 game module
- Critical points are key for UI highlighting
- Flow paths help users understand common debate patterns
