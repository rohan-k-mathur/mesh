# Ludics Enhanced Alignment Development Roadmap

**Created**: December 7, 2025  
**Status**: Planning  
**Priority**: Phase 7+ (Post-Core Implementation)

This roadmap outlines enhancements to bring our ludics game system into deeper alignment with the foundational theory from Girard's Ludics, Faggian & Hyland's "Designs, Disputes and Strategies," and the dialogue formalization research.

---

## Overview

Our current implementation successfully covers the core ludics game mechanics:
- ✅ Designs from deliberation commitments
- ✅ Action polarity (P/O turn structure)  
- ✅ Arena construction and traversal
- ✅ Win/loss detection
- ✅ Proof narrative generation
- ✅ Strategic landscape visualization

The following enhancements would deepen theoretical alignment and provide richer analytical insights for deliberation participants.

---

## Enhancement 1: Divergence Detection

### Theoretical Background
From "Designs, Disputes and Strategies":
> "If such a negative action is not found, the process diverges, i.e. fails."

Divergence occurs when designs are **incompatible**—they don't engage meaningfully. This is philosophically distinct from a "win" where one side exhausts the other.

### Current State
- We detect when a player has no valid moves (treated as loss)
- We don't distinguish between "no moves available" and "move has no corresponding action in opponent's design"

### Implementation Plan

#### Phase 1: Detection Logic
```typescript
// In game.ts
interface GameEndReason {
  type: "win" | "divergence" | "convergence" | "stuck";
  detail: string;
  lastValidInteraction?: number; // move index where designs last engaged
}

function detectDivergence(
  move: LudicMove, 
  opponentDesign: LudicDesign
): boolean {
  // Check if move's address has corresponding negative action
  // in opponent's design
}
```

#### Phase 2: UI Indication
- Add visual distinction in game results
- Divergence shown as "⊥ Designs Diverged" vs "P/O Wins"
- Explain in narrative: "The argument structures did not engage on this point"

#### Phase 3: Divergence Analysis
- Track WHERE divergence occurred (which address)
- Suggest what would be needed for engagement
- Map "talking past each other" points

### Files to Modify
- `packages/ludics-core/dds/game.ts`
- `components/ludics/viewers/InteractionPlayer.tsx`
- `components/ludics/viewers/ProofNarrative.tsx`

### Effort Estimate
- Detection: 4-6 hours
- UI: 2-3 hours
- Analysis: 4-6 hours

---

## Enhancement 2: Daimon Visibility

### Theoretical Background
From Girard's Ludics:
> "The daimon (†) is a new rule that 'assumes conclusion without justification'—creates 'aborted proofs'"

The daimon represents a player **choosing to stop**—accepting the opponent's position. This is different from having no moves available.

### Current State
- Game ends when no moves available
- No distinction between "stuck" and "accepting"

### Implementation Plan

#### Phase 1: Daimon Move Type
```typescript
// In types.ts
interface LudicMove {
  type: "standard" | "daimon";  // Add type field
  address: string;
  player: "P" | "O";
  isDaimon?: boolean;  // Explicit flag
}

// Allow player to explicitly play daimon
function playDaimon(gameState: GameState): GameState {
  return {
    ...gameState,
    status: "complete",
    endReason: "daimon",
    daimonPlayer: gameState.currentPlayer,
  };
}
```

#### Phase 2: UI for Daimon
- Add "Accept Position (†)" button alongside valid moves
- Visual indicator: "†" symbol in move history
- Narrative explains: "Player X accepted the position without further challenge"

#### Phase 3: Daimon Semantics
- Track daimon frequency per design
- Daimon = "I have no proof but accept this"
- Distinguish from "I cannot respond" (stuck)

### Philosophical Note
| State | Meaning | Symbol |
|-------|---------|--------|
| Stuck | No valid responses exist | ⊗ |
| Daimon | Player chooses to accept | † |
| Divergence | Designs don't engage | ⊥ |

### Files to Modify
- `packages/ludics-core/dds/types.ts`
- `packages/ludics-core/dds/game.ts`
- `components/ludics/viewers/InteractionPlayer.tsx`
- `components/ludics/viewers/MoveList.tsx`

### Effort Estimate
- Data model: 2-3 hours
- Game logic: 3-4 hours
- UI: 4-5 hours

---

## Enhancement 3: Orthogonality Score

### Theoretical Background
From "Designs, Disputes and Strategies":
> "Orthogonality = successful interaction = the designs 'fit together'"
> "A design D is a proof of formula A iff D ⊥ E for all counter-proofs E of A"

Rather than binary orthogonality, we can measure **degree of engagement**.

### Current State
- Binary outcome: win/loss/draw
- No measure of "how well" designs interact

### Implementation Plan

#### Phase 1: Orthogonality Metrics
```typescript
interface OrthogonalityScore {
  // Core metrics
  engagementRatio: number;      // % of moves that found responses
  depthReached: number;         // How deep interaction went
  branchesExplored: number;     // How many paths were tested
  
  // Derived scores
  compatibility: number;        // 0-1 overall score
  coverage: number;             // How much of each design was tested
  
  // Breakdown
  pDesignCoverage: number;      // % of P's design explored
  oDesignCoverage: number;      // % of O's design explored
}

function computeOrthogonality(
  interaction: Interaction,
  pDesign: LudicDesign,
  oDesign: LudicDesign
): OrthogonalityScore {
  // Calculate engagement metrics
}
```

#### Phase 2: Visual Representation
- Score gauge: "Orthogonality: 78%"
- Breakdown chart showing coverage
- Highlight unexplored branches

#### Phase 3: Comparative Analysis
- Compare orthogonality across multiple games
- Track how design changes affect orthogonality
- Suggest modifications to improve engagement

### Files to Modify
- `packages/ludics-core/dds/extraction/` (new module)
- `app/api/ludics/interactions/[id]/analysis/route.ts` (new)
- `components/ludics/viewers/` (new OrthogonalityPanel)

### Effort Estimate
- Metrics: 6-8 hours
- API: 3-4 hours
- UI: 6-8 hours

---

## Enhancement 4: Chronicle Extraction

### Theoretical Background
From "Designs, Disputes and Strategies":
> "Chronicle from base to action identifies specific occurrence"
> "View operation extracts the identifying chronicle from the dispute"

A chronicle is a specific path through a design—the "branch" taken during interaction.

### Current State
- We track move history
- We generate narrative
- We don't explicitly extract/display chronicles as design branches

### Implementation Plan

#### Phase 1: Chronicle Data Structure
```typescript
interface Chronicle {
  id: string;
  designId: string;
  player: "P" | "O";
  
  // Sequence of actions in this chronicle
  actions: ChronicleAction[];
  
  // Where this chronicle sits in the design forest
  depth: number;
  parentChronicle?: string;
  childChronicles: string[];
  
  // Metadata
  isComplete: boolean;      // Ends with positive action
  hasDaimon: boolean;       // Ends with †
}

interface ChronicleAction {
  focus: string;            // Address (ξ)
  ramification: string[];   // Possible continuations (I)
  polarity: "+" | "-";
  justifiedBy?: string;     // Parent action
}
```

#### Phase 2: View Extraction
```typescript
// From "Designs, Disputes and Strategies" Definition 3.5
function extractView(
  position: LegalPosition,
  player: "P" | "O"
): Chronicle {
  // Inductively build view as defined in paper
  // This extracts the chronicle from a dispute
}

function extractChroniclesFromInteraction(
  interaction: Interaction
): { pChronicles: Chronicle[], oChronicles: Chronicle[] } {
  // Pull-back construction from Section 3.2
}
```

#### Phase 3: Chronicle Visualization
- Tree view showing chronicle structure
- Highlight active chronicle during replay
- Show how chronicles interweave in interaction

#### Phase 4: Chronicle Comparison
- Compare chronicles across interactions
- Identify common/divergent paths
- Chronicle-based strategy analysis

### Files to Modify
- `packages/ludics-core/dds/extraction/chronicle.ts` (new)
- `packages/ludics-core/dds/extraction/view.ts` (new)
- `components/ludics/viewers/ChronicleViewer.tsx` (new)

### Effort Estimate
- Data structures: 4-6 hours
- Extraction algorithms: 8-12 hours
- Visualization: 8-10 hours
- Comparison: 6-8 hours

---

## Enhancement 5: Formula Recovery

### Theoretical Background
From "Ludics, dialogue and inferentialism":
> "Formulas may be retrieved as sets of designs closed relatively to counter-designs"

Ludics works "below" formulas—but we can recover the implicit logical structure that designs represent.

### Current State
- We work with designs directly
- No formula-level representation
- Users don't see the logical structure

### Implementation Plan

#### Phase 1: Behavior Recognition
```typescript
// Recognize patterns that correspond to logical connectives
interface BehaviorPattern {
  type: "atomic" | "tensor" | "par" | "with" | "plus";
  subpatterns?: BehaviorPattern[];
}

function recognizeBehavior(design: LudicDesign): BehaviorPattern {
  // Analyze design structure to infer logical form
  // Tensor (⊗): multiplicative conjunction
  // Par (⅋): multiplicative disjunction  
  // With (&): additive conjunction (external choice)
  // Plus (⊕): additive disjunction (internal choice)
}
```

#### Phase 2: Formula Synthesis
```typescript
interface RecoveredFormula {
  // Linear logic formula representation
  formula: string;           // e.g., "A ⊗ (B & C)"
  confidence: number;        // How certain is this recovery
  
  // Mapping back to design
  designMapping: Map<string, string>;  // formula part → design addresses
}

function recoverFormula(
  design: LudicDesign,
  behaviors: BehaviorPattern[]
): RecoveredFormula {
  // Synthesize formula from recognized behaviors
}
```

#### Phase 3: Formula Display
- Show recovered formula alongside design
- Interactive: click formula part to highlight design portion
- Compare formulas across designs

#### Phase 4: Formula-Guided Analysis
- "Your argument has structure A ⊗ B—both parts must hold"
- "Opponent is challenging the B component"
- Suggest formula modifications

### Theoretical Challenges
- Formula recovery is not always unique
- Some designs don't correspond to "nice" formulas
- Need to handle partial/approximate recovery

### Files to Modify
- `packages/ludics-core/dds/formula/` (new module)
- `components/ludics/viewers/FormulaViewer.tsx` (new)

### Effort Estimate
- Behavior recognition: 12-16 hours
- Formula synthesis: 16-24 hours
- Visualization: 8-10 hours
- Analysis features: 10-14 hours

---

## Implementation Priority

### Recommended Order

| Priority | Enhancement | Complexity | Value | Dependencies |
|----------|-------------|------------|-------|--------------|
| 1 | Daimon Visibility | Medium | High | None |
| 2 | Divergence Detection | Medium | High | None |
| 3 | Chronicle Extraction | High | High | None |
| 4 | Orthogonality Score | Medium | Medium | Chronicle Extraction |
| 5 | Formula Recovery | Very High | Medium | Chronicle Extraction |

### Phase 7A: Core Semantic Enhancements (Est. 2-3 weeks)
- [ ] Daimon visibility
- [ ] Divergence detection
- [ ] Enhanced game end reasons

### Phase 7B: Chronicle System (Est. 3-4 weeks)
- [ ] Chronicle data structures
- [ ] View extraction algorithms
- [ ] Chronicle visualization
- [ ] Chronicle comparison

### Phase 7C: Advanced Analysis (Est. 4-6 weeks)
- [ ] Orthogonality metrics
- [ ] Orthogonality visualization
- [ ] Formula behavior recognition
- [ ] Formula recovery (experimental)

---

## Research References

For implementation, refer to these key sections:

1. **Divergence**: "Designs, Disputes and Strategies" Section 2.2
2. **Daimon**: "Designs, Disputes and Strategies" Definition 3.9
3. **Chronicles**: "Designs, Disputes and Strategies" Definition 3.11
4. **Views**: "Designs, Disputes and Strategies" Definition 3.5
5. **Orthogonality**: "Ludics, dialogue and inferentialism" Section on interaction
6. **Formula Recovery**: "Inferences and Dialogues in Ludics" Section 3

---

## Success Criteria

### For Each Enhancement

**Daimon Visibility**
- [ ] Users can explicitly play daimon
- [ ] Daimon distinguished from stuck in UI
- [ ] Narrative explains daimon semantics

**Divergence Detection**
- [ ] Divergence detected and reported
- [ ] Different from win/loss in display
- [ ] Location of divergence identified

**Chronicle Extraction**
- [ ] Chronicles extracted from any interaction
- [ ] Visual representation of chronicle structure
- [ ] Chronicles correctly identify design branches

**Orthogonality Score**
- [ ] Meaningful 0-1 score computed
- [ ] Score reflects actual engagement quality
- [ ] Visualization helps users understand coverage

**Formula Recovery**
- [ ] Basic connectives recognized
- [ ] Formula displayed for simple designs
- [ ] Mapping between formula and design shown

---

## Notes for Future Development

1. **Testing**: Each enhancement needs test cases from the research papers
2. **Documentation**: Update user docs to explain new concepts
3. **Performance**: Chronicle/formula recovery may be expensive—consider caching
4. **Accessibility**: Ensure theoretical concepts are explained for non-logicians
5. **Integration**: These features should integrate with existing Ludics Panel tabs

---

*This roadmap will be updated as implementation progresses.*
