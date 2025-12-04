# Ludics-Deliberation Integration Roadmap

**Version:** 1.0  
**Date:** December 3, 2025  
**Status:** Implementation Ready

---

## Executive Summary

This roadmap translates theoretical ludics foundations into a practical system that:
- Transforms deliberations into playable ludic arenas
- Extracts justified proof traces from interactions
- Maps strategic landscapes across argument spaces
- Remains player-agnostic (1 participant or 100)

### Guiding Visions
- **Vision A:** Predictive Simulation — forecast deliberation trajectories
- **Vision E:** Strategic Landscape Mapping — reveal all paths through argument space
- **Vision F:** Proof Extraction — Curry-Howard correspondence for justified conclusions

### Core Architectural Decisions

| Concept | Implementation |
|---------|----------------|
| Arena | Deliberation design space (addresses from argument tree) |
| P/O Polarity | Active/Reactive perspectives (not attacker/defender) |
| Move | Design selection from available responses |
| Winner | Who can keep making moves (stuck player loses) |
| Output | Visitable path = proof trace = justified narrative |
| Behaviour | Equivalence class of strategies over positions |

---

## Phase 0: Foundation Alignment
**Duration:** 1 week  
**Goal:** Align existing codebase with theoretical framework

### 0.1 Audit Existing Ludics Core
- [ ] Review `packages/ludics-core/dds/` structure
- [ ] Map current `UniversalArena` to theoretical arena concept
- [ ] Verify Faggian-Hyland semantics in game logic
- [ ] Document gaps between current implementation and target

### 0.2 Define Core Type System
```typescript
// Core ludics types aligned with theory

/** 
 * Address in interaction tree (Girard's locus/focus)
 * Derived from argument/claim position in deliberation
 */
type LudicAddress = number[];  // e.g., [0, 1, 2] = ξ.0.1.2

/**
 * Dialogue Act (from Fouqueré & Quatrini)
 * Maps directly to DialogueMove
 */
interface DialogueAct {
  polarity: '+' | '-';           // Active or reactive
  focus: LudicAddress;           // Position addressed
  ramification: LudicAddress[];  // New positions opened
  expression: string;            // Content (claim text, etc.)
}

/**
 * Design = Strategy = Set of coherent chronicles
 * A participant's complete response pattern
 */
interface LudicDesign {
  id: string;
  base: LudicAddress[];          // Initial addresses
  polarity: '+' | '-';           // Starting polarity
  chronicles: Chronicle[];       // All possible response paths
  hasDaimon: boolean;            // Can this design "give up"?
}

/**
 * Chronicle = Single path through design
 * Alternating sequence of actions
 */
interface Chronicle {
  actions: DialogueAct[];
  isComplete: boolean;           // Ends in daimon or blocked
}

/**
 * Arena = Space of interaction
 * Built from deliberation structure
 */
interface DeliberationArena {
  deliberationId: string;
  rootAddress: LudicAddress;
  positions: Map<string, ArenaPosition>;  // address → position
  availableDesigns: LudicDesign[];        // All possible strategies
}

/**
 * Visitable Path = Proof Trace
 * The actual interaction that occurred
 */
interface VisitablePath {
  actions: DialogueAct[];
  convergent: boolean;           // Ended in daimon (success)
  winner: 'P' | 'O' | null;      // Who could still move
  incarnation: DialogueAct[];    // Essential core (stripped)
}
```

### 0.3 Create Migration Layer
- [ ] Adapter: `DialogueMove` ↔ `DialogueAct`
- [ ] Adapter: `LudicAct` (Prisma) ↔ `DialogueAct`
- [ ] Adapter: `LudicDesign` (Prisma) ↔ `LudicDesign` (runtime)

**Deliverable:** Type definitions in `packages/ludics-core/types/`

---

## Phase 1: Arena Construction from Deliberation
**Duration:** 2 weeks  
**Goal:** Transform any deliberation into a playable ludic arena

### 1.1 Deliberation Parser

**Input:** Deliberation with arguments, claims, supports, attacks  
**Output:** `DeliberationArena`

```typescript
// Pseudocode for arena construction
function buildArenaFromDeliberation(deliberationId: string): DeliberationArena {
  // 1. Fetch deliberation structure
  const deliberation = await getDeliberation(deliberationId);
  
  // 2. Build address tree from arguments
  const addressTree = buildAddressTree(deliberation.arguments);
  
  // 3. Determine ramifications (possible responses per position)
  const positions = computeRamifications(addressTree, deliberation);
  
  // 4. Generate available designs (response strategies)
  const designs = generateDesignsFromStructure(positions);
  
  // 5. Ensure ludicability (prefix-closed, daimon-closed, saturated)
  validateLudicability(designs);
  
  return { deliberationId, rootAddress: [], positions, availableDesigns: designs };
}
```

### 1.2 Address Mapping Algorithm

Map deliberation structure to ludic addresses:

| Deliberation Element | Ludic Address Pattern |
|---------------------|----------------------|
| Root claim | `[]` (empty = root) |
| Direct response to root | `[i]` where i = response index |
| Nested argument | `[i, j, k, ...]` path through tree |
| Support for claim at `[i]` | `[i, s]` where s indexes supports |
| Attack on claim at `[i]` | `[i, a]` where a indexes attacks |

```typescript
function buildAddressTree(arguments: Argument[]): AddressTree {
  const tree = new AddressTree();
  
  for (const arg of arguments) {
    if (!arg.parentId) {
      // Root-level argument
      tree.addAtRoot(arg, tree.nextRootIndex());
    } else {
      // Nested argument
      const parentAddress = tree.getAddressForArgument(arg.parentId);
      const childIndex = tree.nextChildIndex(parentAddress);
      tree.addChild(arg, [...parentAddress, childIndex]);
    }
  }
  
  return tree;
}
```

### 1.3 Ramification Computation

For each position, compute what responses are available:

```typescript
interface ArenaPosition {
  address: LudicAddress;
  content: string;              // The claim/argument text
  type: 'claim' | 'support' | 'attack' | 'question';
  ramification: LudicAddress[]; // Where interaction can continue
  polarity: '+' | '-';          // Who "owns" this position
}

function computeRamifications(
  tree: AddressTree, 
  deliberation: Deliberation
): Map<string, ArenaPosition> {
  const positions = new Map<string, ArenaPosition>();
  
  for (const [address, arg] of tree.entries()) {
    // Get all direct children (responses to this position)
    const children = tree.getChildren(address);
    
    positions.set(addressToKey(address), {
      address,
      content: arg.content,
      type: classifyArgumentType(arg),
      ramification: children.map(c => c.address),
      polarity: computePolarity(address)  // Even depth = +, odd = -
    });
  }
  
  return positions;
}
```

### 1.4 Design Generation

Generate available strategies from position structure:

```typescript
function generateDesignsFromStructure(
  positions: Map<string, ArenaPosition>
): LudicDesign[] {
  const designs: LudicDesign[] = [];
  
  // For each position, generate designs representing possible strategies
  for (const [key, position] of positions) {
    if (position.ramification.length === 0) {
      // Terminal position — design with daimon (can only give up)
      designs.push(createDaimonDesign(position));
    } else {
      // Non-terminal — one design per possible response choice
      for (const responseAddr of position.ramification) {
        designs.push(createResponseDesign(position, responseAddr, positions));
      }
      
      // Also add daimon option (choosing not to respond)
      designs.push(createDaimonDesign(position));
    }
  }
  
  return designs;
}
```

### 1.5 Ludicability Validation

Ensure generated designs form valid behaviours:

```typescript
function validateLudicability(designs: LudicDesign[]): void {
  // From "Visitable Paths" paper:
  // A set is ludicable when it and its dual are:
  // 1. Prefix-closed
  // 2. Daimon-closed  
  // 3. Satisfy saturation properties
  
  assertPrefixClosed(designs);
  assertDaimonClosed(designs);
  assertSaturated(designs);
}

function assertPrefixClosed(designs: LudicDesign[]): void {
  // Every prefix of a chronicle must also be representable
  for (const design of designs) {
    for (const chronicle of design.chronicles) {
      for (let i = 1; i < chronicle.actions.length; i++) {
        const prefix = chronicle.actions.slice(0, i);
        assert(
          canRepresentPrefix(prefix, designs),
          `Prefix-closure violated for ${prefix}`
        );
      }
    }
  }
}
```

**Deliverables:**
- `packages/ludics-core/arena/deliberation-parser.ts`
- `packages/ludics-core/arena/address-mapper.ts`
- `packages/ludics-core/arena/design-generator.ts`
- `packages/ludics-core/arena/ludicability-validator.ts`

---

## Phase 2: Interaction Engine
**Duration:** 2 weeks  
**Goal:** Execute games on deliberation arenas, extract visitable paths

### 2.1 Interaction Stepper

Refactor existing stepper to work with deliberation arenas:

```typescript
interface InteractionState {
  arena: DeliberationArena;
  currentPath: DialogueAct[];      // Actions so far
  currentAddress: LudicAddress;    // Where we are
  activePolarity: '+' | '-';       // Who moves next
  pDesign: LudicDesign | null;     // P's current strategy
  oDesign: LudicDesign | null;     // O's current strategy
}

interface InteractionResult {
  path: VisitablePath;
  outcome: 'convergent' | 'divergent';
  stuckPlayer: 'P' | 'O' | null;
  trace: DialogueAct[];            // Full interaction history
}

async function stepInteraction(
  state: InteractionState,
  move: DialogueAct
): Promise<InteractionState> {
  // 1. Validate move is legal (in current design's chronicles)
  validateMoveInDesign(move, state);
  
  // 2. Update path
  const newPath = [...state.currentPath, move];
  
  // 3. Switch polarity
  const newPolarity = state.activePolarity === '+' ? '-' : '+';
  
  // 4. Update current address (focus of the move)
  const newAddress = move.focus;
  
  // 5. Check for termination
  if (move.polarity === '+' && move.ramification.length === 0) {
    // Daimon or terminal — interaction complete
    return { ...state, currentPath: newPath, terminated: true };
  }
  
  return {
    arena: state.arena,
    currentPath: newPath,
    currentAddress: newAddress,
    activePolarity: newPolarity,
    pDesign: state.pDesign,
    oDesign: state.oDesign
  };
}
```

### 2.2 Convergence/Divergence Detection

```typescript
function detectOutcome(state: InteractionState): InteractionResult {
  const lastAction = state.currentPath[state.currentPath.length - 1];
  
  // Convergent: ended with daimon
  if (isDaimon(lastAction)) {
    return {
      path: buildVisitablePath(state.currentPath, true),
      outcome: 'convergent',
      stuckPlayer: state.activePolarity === '+' ? 'P' : 'O',
      trace: state.currentPath
    };
  }
  
  // Check for divergence: positive focus with no dual counterpart
  const availableMoves = getAvailableMoves(state);
  if (availableMoves.length === 0) {
    // Stuck — divergent
    return {
      path: buildVisitablePath(state.currentPath, false),
      outcome: 'divergent',
      stuckPlayer: state.activePolarity,
      trace: state.currentPath
    };
  }
  
  // Still in progress
  return null;
}
```

### 2.3 Multi-Party Extension

The system is player-agnostic by design. For N participants:

```typescript
interface MultiPartyInteraction {
  arena: DeliberationArena;
  participants: Participant[];
  perspectiveMap: Map<string, '+' | '-'>;  // participantId → current polarity
}

/**
 * Key insight: P/O are PERSPECTIVES, not fixed roles
 * Each participant sees themselves as P when active, O when reactive
 * The same interaction looks different from each viewpoint
 */
function getParticipantPerspective(
  interaction: MultiPartyInteraction,
  participantId: string
): InteractionState {
  const polarity = interaction.perspectiveMap.get(participantId);
  
  // From this participant's view, they are always making positive moves
  // Their counterparty's moves appear as negative
  return transformToParticipantView(interaction, participantId, polarity);
}
```

### 2.4 AI Strategy Selection

Integrate with existing AI system for simulation:

```typescript
interface StrategySelector {
  selectDesign(
    arena: DeliberationArena,
    state: InteractionState,
    difficulty: 'easy' | 'medium' | 'hard'
  ): LudicDesign;
}

class MinimaxStrategySelector implements StrategySelector {
  selectDesign(arena, state, difficulty): LudicDesign {
    const availableDesigns = getAvailableDesigns(arena, state);
    
    if (difficulty === 'hard') {
      // Full minimax — find winning design if exists
      return this.minimaxSelect(availableDesigns, state, Infinity);
    } else if (difficulty === 'medium') {
      // Bounded minimax
      return this.minimaxSelect(availableDesigns, state, 3);
    } else {
      // Random selection
      return randomChoice(availableDesigns);
    }
  }
}
```

**Deliverables:**
- `packages/ludics-core/interaction/stepper.ts`
- `packages/ludics-core/interaction/outcome-detector.ts`
- `packages/ludics-core/interaction/multi-party.ts`
- `packages/ludics-core/interaction/strategy-selector.ts`

---

## Phase 3: Visitable Path Extraction & Incarnation
**Duration:** 2 weeks  
**Goal:** Extract proof traces and compute essential logical cores

### 3.1 Path Extraction

```typescript
interface PathExtractor {
  /**
   * Extract the visitable path from a completed interaction
   * This IS the proof trace
   */
  extractPath(interaction: InteractionResult): VisitablePath;
  
  /**
   * Compute all visitable paths for a behaviour
   * Used for landscape mapping
   */
  extractAllPaths(behaviour: LudicBehaviour): VisitablePath[];
}

function extractPath(interaction: InteractionResult): VisitablePath {
  return {
    actions: interaction.trace,
    convergent: interaction.outcome === 'convergent',
    winner: interaction.stuckPlayer ? 
      (interaction.stuckPlayer === 'P' ? 'O' : 'P') : null,
    incarnation: computeIncarnation(interaction.trace)
  };
}
```

### 3.2 Incarnation Algorithm

From "Visitable Paths" paper — extract essential core:

```typescript
/**
 * Incarnation = the relevant part of a design traversed in interaction
 * Strips away unused branches, keeps only what matters
 */
function computeIncarnation(trace: DialogueAct[]): DialogueAct[] {
  // Step 1: Build view of the trace
  const view = computeView(trace);
  
  // Step 2: Remove non-essential negative actions
  // (those not justified by a positive action in the view)
  const essential = view.filter((act, i) => {
    if (act.polarity === '+') return true;
    // Negative action: keep only if justified by previous positive
    return hasJustifyingPositive(act, view.slice(0, i));
  });
  
  return essential;
}

/**
 * View operation (from paper):
 * - Keep all positive actions
 * - For negative actions, only keep those justified by immediately preceding positive
 */
function computeView(trace: DialogueAct[]): DialogueAct[] {
  const view: DialogueAct[] = [];
  
  for (let i = 0; i < trace.length; i++) {
    const act = trace[i];
    
    if (act.polarity === '+') {
      view.push(act);
    } else {
      // Negative: check if justified by last positive in view
      const lastPositive = findLastPositive(view);
      if (lastPositive && justifies(lastPositive, act)) {
        view.push(act);
      }
      // Otherwise: look back to find justifying positive
      else {
        const justifier = findJustifier(act, trace.slice(0, i));
        if (justifier) {
          // Truncate view to justifier, then add this action
          const justifierIndex = view.findIndex(a => 
            addressEquals(a.focus, justifier.focus)
          );
          view.length = justifierIndex + 1;
          view.push(act);
        }
      }
    }
  }
  
  return view;
}
```

### 3.3 Design Completion

From paper — complete a design by adding daimon branches:

```typescript
/**
 * Completion adds daimon endings to all incomplete branches
 * Used to ensure interaction can always terminate
 */
function completeDesign(design: LudicDesign): LudicDesign {
  const completedChronicles: Chronicle[] = [];
  
  for (const chronicle of design.chronicles) {
    completedChronicles.push(chronicle);
    
    // For each negative action that could follow but doesn't
    const lastAction = chronicle.actions[chronicle.actions.length - 1];
    if (lastAction.polarity === '+' && !chronicle.isComplete) {
      // Add daimon completion
      completedChronicles.push({
        actions: [...chronicle.actions, createDaimon(lastAction.focus)],
        isComplete: true
      });
    }
  }
  
  return { ...design, chronicles: completedChronicles };
}
```

### 3.4 Proof Trace Formatting

Convert incarnation to human-readable justified narrative:

```typescript
interface JustifiedNarrative {
  steps: NarrativeStep[];
  conclusion: string;
  justificationChain: string[];
}

interface NarrativeStep {
  position: string;           // The claim/argument
  justification: string;      // Why this step follows
  speaker: string;            // Who made this move
  type: 'claim' | 'support' | 'attack' | 'concession';
}

function formatAsNarrative(path: VisitablePath, arena: DeliberationArena): JustifiedNarrative {
  const steps: NarrativeStep[] = [];
  
  for (const act of path.incarnation) {
    const position = arena.positions.get(addressToKey(act.focus));
    
    steps.push({
      position: position.content,
      justification: deriveJustification(act, path.incarnation),
      speaker: act.polarity === '+' ? 'Proponent' : 'Opponent',
      type: position.type
    });
  }
  
  return {
    steps,
    conclusion: deriveConclusion(steps),
    justificationChain: steps.map(s => s.justification)
  };
}
```

**Deliverables:**
- `packages/ludics-core/extraction/path-extractor.ts`
- `packages/ludics-core/extraction/incarnation.ts`
- `packages/ludics-core/extraction/completion.ts`
- `packages/ludics-core/extraction/narrative-formatter.ts`

---

## Phase 4: Landscape Mapping (Vision E)
**Duration:** 2 weeks  
**Goal:** Compute and visualize strategic landscape over argument space

### 4.1 Behaviour Computation

```typescript
interface LudicBehaviour {
  id: string;
  base: LudicAddress[];
  designs: LudicDesign[];        // All designs in this behaviour
  polarity: '+' | '-';
  isComplete: boolean;           // = biorthogonal closure
}

/**
 * Compute behaviour from set of designs via biorthogonal closure
 * G⊥⊥ = G iff G is a behaviour
 */
function computeBehaviour(designs: LudicDesign[]): LudicBehaviour {
  // Step 1: Compute orthogonal (all designs that converge with all in G)
  const orthogonal = computeOrthogonal(designs);
  
  // Step 2: Compute bi-orthogonal
  const biorthogonal = computeOrthogonal(orthogonal);
  
  // Step 3: Check if closed (G = G⊥⊥)
  const isComplete = designSetsEqual(designs, biorthogonal);
  
  return {
    id: generateBehaviourId(),
    base: extractCommonBase(designs),
    designs: biorthogonal,
    polarity: designs[0].polarity,
    isComplete
  };
}

function computeOrthogonal(designs: LudicDesign[]): LudicDesign[] {
  // Find all designs of opposite polarity that converge with ALL given designs
  const candidates = generateCandidateDesigns(designs);
  
  return candidates.filter(candidate => 
    designs.every(d => converges(d, candidate))
  );
}
```

### 4.2 Position Strength Analysis

```typescript
interface PositionStrength {
  address: LudicAddress;
  winningDesignCount: number;    // Designs from here that are winning
  totalDesignCount: number;       // All designs from here
  winRate: number;                // Simulation win rate
  hasWinningStrategy: boolean;    // Exists design with no daimon
  depth: number;                  // Moves to termination
}

async function analyzePositionStrength(
  arena: DeliberationArena,
  address: LudicAddress,
  simulations: number = 1000
): Promise<PositionStrength> {
  const designsFromHere = getDesignsStartingAt(arena, address);
  
  // Count winning designs (no daimon = can force convergence in opponent)
  const winningDesigns = designsFromHere.filter(d => !d.hasDaimon);
  
  // Run simulations from this position
  const results = await runSimulations(arena, address, simulations);
  const winRate = results.filter(r => r.winner === getPlayerAt(address)).length / simulations;
  
  return {
    address,
    winningDesignCount: winningDesigns.length,
    totalDesignCount: designsFromHere.length,
    winRate,
    hasWinningStrategy: winningDesigns.length > 0,
    depth: computeAverageDepth(designsFromHere)
  };
}
```

### 4.3 Landscape Visualization Data

```typescript
interface LandscapeData {
  arena: DeliberationArena;
  positions: PositionStrength[];
  heatMap: HeatMapData;
  flowPaths: FlowPath[];         // Common traversal patterns
  criticalPoints: LudicAddress[]; // Positions where outcome determined
}

interface HeatMapData {
  positions: Array<{
    address: LudicAddress;
    x: number;
    y: number;
    strength: number;          // 0-1, maps to color
    polarity: '+' | '-';
  }>;
}

function generateLandscapeData(
  arena: DeliberationArena,
  analysis: PositionStrength[]
): LandscapeData {
  // Build heat map coordinates (tree layout)
  const heatMap = layoutAsTree(arena, analysis);
  
  // Identify critical points (where hasWinningStrategy changes)
  const criticalPoints = findCriticalPoints(analysis);
  
  // Extract common flow paths from simulations
  const flowPaths = extractFlowPaths(arena, 1000);
  
  return { arena, positions: analysis, heatMap, flowPaths, criticalPoints };
}
```

### 4.4 Internal Completeness Check

From theory: for well-behaved connectives, biorthogonal closure is trivial:

```typescript
/**
 * Internal completeness means:
 * Every design in A ⊕ B comes from either A or B (no "new" designs from closure)
 * 
 * For deliberations: check if all strategies are "native" to the structure
 */
function checkInternalCompleteness(behaviour: LudicBehaviour): boolean {
  // Compare designs before and after closure
  const original = behaviour.designs;
  const closed = computeBiorthogonalClosure(original);
  
  // Internal completeness = no new designs added by closure
  return designSetsEqual(original, closed);
}
```

**Deliverables:**
- `packages/ludics-core/landscape/behaviour-computer.ts`
- `packages/ludics-core/landscape/position-analyzer.ts`
- `packages/ludics-core/landscape/visualization-data.ts`
- `packages/ludics-core/landscape/completeness-checker.ts`

---

## Phase 5: API Integration
**Duration:** 1 week  
**Goal:** Expose ludics system through REST API

### 5.1 Arena API

```typescript
// POST /api/ludics/arenas/from-deliberation
interface CreateArenaRequest {
  deliberationId: string;
  options?: {
    includeImplicitMoves?: boolean;
    maxDepth?: number;
  };
}

interface CreateArenaResponse {
  arenaId: string;
  positionCount: number;
  designCount: number;
  rootPolarity: '+' | '-';
}

// GET /api/ludics/arenas/:id
interface GetArenaResponse {
  arena: DeliberationArena;
  statistics: {
    totalPositions: number;
    maxDepth: number;
    branchingFactor: number;
  };
}
```

### 5.2 Interaction API

```typescript
// POST /api/ludics/interactions
interface StartInteractionRequest {
  arenaId: string;
  mode: 'pvp' | 'pve' | 'simulation';
  participants?: string[];        // For PvP
  aiDifficulty?: 'easy' | 'medium' | 'hard';  // For PvE/simulation
}

interface StartInteractionResponse {
  interactionId: string;
  initialState: InteractionState;
  availableMoves: DialogueAct[];
}

// POST /api/ludics/interactions/:id/move
interface MoveRequest {
  action: DialogueAct;
}

interface MoveResponse {
  newState: InteractionState;
  outcome?: InteractionResult;    // If interaction complete
  availableMoves: DialogueAct[];  // If ongoing
}

// POST /api/ludics/interactions/simulate
interface SimulateRequest {
  arenaId: string;
  pDifficulty: 'easy' | 'medium' | 'hard';
  oDifficulty: 'easy' | 'medium' | 'hard';
  count?: number;                 // Number of simulations
}

interface SimulateResponse {
  results: InteractionResult[];
  statistics: {
    pWins: number;
    oWins: number;
    convergent: number;
    divergent: number;
    averageLength: number;
  };
}
```

### 5.3 Extraction API

```typescript
// GET /api/ludics/interactions/:id/path
interface GetPathResponse {
  path: VisitablePath;
  incarnation: DialogueAct[];
  narrative: JustifiedNarrative;
}

// GET /api/ludics/arenas/:id/landscape
interface GetLandscapeResponse {
  landscape: LandscapeData;
  criticalPoints: Array<{
    address: LudicAddress;
    content: string;
    significance: string;
  }>;
}
```

### 5.4 Integrate with Existing compile-step

```typescript
// Update existing /api/ludics/compile-step/route.ts

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  if (body.action === 'compileToArena') {
    // NEW: Build arena from deliberation
    const arena = await buildArenaFromDeliberation(body.deliberationId);
    return NextResponse.json({ arena });
  }
  
  if (body.action === 'extractPath') {
    // NEW: Get visitable path from interaction
    const path = await extractPath(body.interactionId);
    return NextResponse.json({ path });
  }
  
  // Existing functionality...
  if (body.action === 'compile') {
    const design = await compileFromMoves(body.moves);
    return NextResponse.json({ design });
  }
  
  if (body.action === 'step') {
    const result = await stepInteraction(body.state, body.move);
    return NextResponse.json({ result });
  }
}
```

**Deliverables:**
- `app/api/ludics/arenas/route.ts`
- `app/api/ludics/arenas/[id]/route.ts`
- `app/api/ludics/arenas/from-deliberation/route.ts`
- `app/api/ludics/interactions/route.ts`
- `app/api/ludics/interactions/[id]/route.ts`
- `app/api/ludics/interactions/[id]/path/route.ts`
- `app/api/ludics/landscape/[arenaId]/route.ts`
- Updated `app/api/ludics/compile-step/route.ts`

---

## Phase 6: UI Integration
**Duration:** 2 weeks  
**Goal:** Surface ludics features in deliberation UI

### 6.1 Arena Visualization Component

```typescript
interface ArenaViewerProps {
  arena: DeliberationArena;
  currentPath?: DialogueAct[];
  highlightedPositions?: LudicAddress[];
  onPositionClick?: (address: LudicAddress) => void;
}

// Shows argument tree with ludics overlay
// - Positions colored by polarity
// - Current path highlighted
// - Available moves indicated
```

### 6.2 Interaction Player Component

```typescript
interface InteractionPlayerProps {
  arenaId: string;
  mode: 'play' | 'replay' | 'simulate';
  onComplete?: (result: InteractionResult) => void;
}

// Interactive component for:
// - Playing against AI
// - Watching simulations
// - Replaying recorded interactions
```

### 6.3 Landscape Heat Map Component

```typescript
interface LandscapeHeatMapProps {
  landscape: LandscapeData;
  selectedPosition?: LudicAddress;
  onPositionSelect?: (address: LudicAddress) => void;
}

// Visual heat map showing:
// - Position strength (color intensity)
// - Critical points (highlighted)
// - Flow paths (arrows)
```

### 6.4 Proof Narrative Component

```typescript
interface ProofNarrativeProps {
  narrative: JustifiedNarrative;
  expandable?: boolean;
}

// Displays justified narrative:
// - Step-by-step argument flow
// - Justification chain
// - Conclusion highlight
```

**Deliverables:**
- `components/ludics/ArenaViewer.tsx`
- `components/ludics/InteractionPlayer.tsx`
- `components/ludics/LandscapeHeatMap.tsx`
- `components/ludics/ProofNarrative.tsx`
- `components/ludics/index.ts` (exports)

---

## Phase 7: Testing & Validation
**Duration:** 1 week  
**Goal:** Ensure correctness against theoretical foundations

### 7.1 Unit Tests

```typescript
// Test Faggian-Hyland semantics
describe('Winner determination', () => {
  it('stuck player loses', () => {
    const state = createTerminalState({ currentPlayer: 'P' });
    expect(determineWinner(state)).toBe('O');
  });
  
  it('daimon player gives up', () => {
    const state = createDaimonState({ daimonPlayer: 'P' });
    expect(determineWinner(state)).toBe('O');
  });
});

// Test address mapping
describe('Address computation', () => {
  it('maps root claim to empty address', () => {
    const arena = buildArena(simpleDeliberation);
    expect(arena.positions.get('[]').content).toBe('Root claim');
  });
  
  it('computes correct polarity by depth', () => {
    const arena = buildArena(nestedDeliberation);
    expect(arena.positions.get('[0]').polarity).toBe('-');
    expect(arena.positions.get('[0,1]').polarity).toBe('+');
  });
});

// Test incarnation
describe('Incarnation computation', () => {
  it('extracts essential core', () => {
    const fullPath = createPathWithBranches();
    const incarnation = computeIncarnation(fullPath);
    expect(incarnation.length).toBeLessThan(fullPath.length);
    expect(incarnation.every(a => isEssential(a, fullPath))).toBe(true);
  });
});
```

### 7.2 Integration Tests

```typescript
describe('Full deliberation flow', () => {
  it('transforms deliberation to arena and back', async () => {
    const deliberation = await createTestDeliberation();
    const arena = await buildArenaFromDeliberation(deliberation.id);
    
    expect(arena.positions.size).toBeGreaterThan(0);
    expect(validateLudicability(arena.availableDesigns)).toBe(true);
  });
  
  it('simulation produces valid paths', async () => {
    const arena = await buildArenaFromDeliberation(testDeliberationId);
    const result = await simulate(arena, 'hard', 'hard');
    
    expect(result.path.convergent || result.outcome === 'divergent').toBe(true);
    expect(isValidPath(result.path, arena)).toBe(true);
  });
});
```

### 7.3 Property-Based Tests

```typescript
// Using fast-check or similar
describe('Theoretical properties', () => {
  it('biorthogonal closure is idempotent', () => {
    fc.assert(fc.property(
      arbitraryDesignSet,
      (designs) => {
        const G = computeBehaviour(designs);
        const GPerp = computeOrthogonal(G.designs);
        const GBiPerp = computeOrthogonal(GPerp);
        return designSetsEqual(G.designs, GBiPerp);
      }
    ));
  });
  
  it('visitable paths are prefix-closed', () => {
    fc.assert(fc.property(
      arbitraryBehaviour,
      (behaviour) => {
        const paths = extractAllPaths(behaviour);
        return paths.every(p => 
          allPrefixes(p).every(prefix => 
            paths.some(q => isPrefix(prefix, q))
          )
        );
      }
    ));
  });
});
```

**Deliverables:**
- `packages/ludics-core/__tests__/arena.test.ts`
- `packages/ludics-core/__tests__/interaction.test.ts`
- `packages/ludics-core/__tests__/extraction.test.ts`
- `packages/ludics-core/__tests__/landscape.test.ts`
- `packages/ludics-core/__tests__/properties.test.ts`

---

## Timeline Summary

| Phase | Duration | Key Deliverable |
|-------|----------|-----------------|
| 0: Foundation Alignment | 1 week | Type system, adapters |
| 1: Arena Construction | 2 weeks | Deliberation → Arena pipeline |
| 2: Interaction Engine | 2 weeks | Stepper, outcome detection |
| 3: Path Extraction | 2 weeks | Incarnation, proof traces |
| 4: Landscape Mapping | 2 weeks | Behaviour analysis, heat maps |
| 5: API Integration | 1 week | REST endpoints |
| 6: UI Integration | 2 weeks | React components |
| 7: Testing | 1 week | Validation suite |

**Total: ~13 weeks**

---

## Success Criteria

### Technical
- [ ] Any deliberation can be transformed to a valid ludic arena
- [ ] Interactions produce correct outcomes per Faggian-Hyland semantics
- [ ] Incarnation algorithm correctly extracts essential paths
- [ ] Landscape analysis identifies winning strategies when they exist

### Theoretical
- [ ] Ludicability constraints satisfied for all generated designs
- [ ] Biorthogonal closure is idempotent
- [ ] Visitable paths are prefix-closed and daimon-closed
- [ ] Internal completeness holds for standard connectives

### User Experience
- [ ] Player-agnostic: same system for 1 or N participants
- [ ] Clear visualization of argument landscape
- [ ] Understandable proof narratives
- [ ] Responsive simulation (<1s for typical deliberations)

---

## Open Questions for Future Phases

1. **Multi-party semantics**: How do we handle N>2 participants beyond perspective shifting?
2. **Incremental arena updates**: Can we update arena as deliberation evolves?
3. **Behaviour equivalence**: When are two deliberations "strategically equivalent"?
4. **Proof search**: Can we automatically find winning strategies?
5. **Learning**: Can AI learn deliberation patterns from ludic traces?

---

## Appendix: Key Theoretical References

- Girard, J.-Y. "Locus Solum: From the rules of logic to the logic of rules"
- Faggian, C. & Hyland, M. "Designs, disputes and strategies"
- Fouqueré, C. & Quatrini, M. "Ludics and Natural Language: First Approaches"
- Fouqueré, C. & Quatrini, M. "Study of Behaviours via Visitable Paths"
- Lecomte, A. & Quatrini, M. "Ludics and Its Applications to Natural Language Semantics"
