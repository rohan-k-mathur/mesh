# Ludics Theory Analysis for Phase 1e Implementation

**Date**: November 6, 2025  
**Purpose**: Comprehensive analysis of Ludics theoretical foundations to guide ASPIC+ metadata preservation in Phase 1e

---

## Executive Summary

Ludics provides a unified framework for modeling argumentative dialogues by treating interaction as the primitive operation, from which logical inference emerges. The framework integrates game theory structure with inferential systems through **designs** (abstractions of proofs) that interact via **actions** (moves in dialogue).

**Critical Insight for Phase 1e**: Ludics designs naturally store provenance metadata through their structure. Our task is to extend the existing Ludics compilation in Mesh to preserve ASPIC+ attack metadata within the LudicAct.extJson field, maintaining the complete provenance chain: **CQ → DialogueMove → ASPIC+ → Ludics → AIF**.

---

## I. Core Ludics Concepts

### 1. Actions: The Primitive Unit

**Definition**: Actions are polarized elements that form the basis of interaction.

**Key Properties**:
- **Polarity**: Every action exists in dual pairs (κ and κ̄)
  - Positive action (κ): Active role (speaker)
  - Negative action (κ̄): Passive role (listener/registration)
  - κ̄̄ = κ (involution)
- **Justification Relation**: Actions are linked via explicit justification
  - Positive action justified by preceding negative action (or is initial)
  - Negative action justified by immediately preceding positive action
- **Loci (Addresses)**: Each action has a location L (sequence of integers)
  - Example: L.i means action at location i justified by action at L

**Mesh Implementation Mapping**:
```typescript
// DialogueMove maps to Ludics action
{
  kind: "WHY" | "ATTACK" | "GROUNDS",  // Action type
  polarity: "P" | "O",                   // Polarity (Proponent/Opponent)
  locusId: "0.1.2",                      // Locus address
  payload: { ... }                        // Content (including ASPIC+)
}
```

### 2. Chronicles: Sequences of Actions

**Definition**: Alternate sequences of actions satisfying structural conditions.

**Conditions**:
1. Positive action must be initial OR justified by preceding negative action
2. Negative action (except first) justified by immediately preceding positive action

**Visualization** (from juridical example):
```
κ₁ → κ₂ → κ₃ → κ₄
   ↘ κ₈
     ↘ κ₉
```

**Mesh Implementation**: The sequence of DialogueMoves forms chronicles.

### 3. Designs: Sets of Chronicles

**Definition**: A design is a forest-structured set of chronicles representing a locutor's view.

**Properties**:
- Organized as forest (tree structure)
- Single root when initial action is positive
- Represents all possible paths of interaction for one participant

**Critical for Implementation**: Each locutor (Proponent/Opponent) has their own design. In Mesh, this corresponds to the compiled Ludics structure per participant.

### 4. Interaction: The Central Operation

**Mechanism**: Interaction is a "travel" through two dual designs:
1. Start with design containing positive initial action
2. At positive action κ in design D₁, jump to dual κ̄ in design D₂
3. Continue with unique positive action following κ̄ in D₂
4. Repeat until convergence or divergence

**Convergence vs. Divergence**:
- **Convergent**: Reaches daimon (†) → dialogue "went well"
- **Divergent**: Required dual action not found → failure/inconsistency

**Critical Insight**: Interaction IS logical computation (cut elimination/modus ponens)

---

## II. Dialogue Modeling in Ludics

### 1. Dialogue Acts

**Formal Definition**: κ = (ε, L, I, e)
- **ε**: Polarity (+/−)
- **L**: Focus (locus/address)
- **I**: Ramification (set of integers for continuations)
- **e**: Expression (linguistic content)

**Special Case - Daimon**: (†, e) marks successful end

**Mesh Mapping**:
```typescript
// LudicAct structure
{
  locusPath: string,        // L (focus)
  daimonEndpoints?: [],     // † (daimon)
  moves: DialogueMove[],    // Associated dialogue moves
  extJson: {                // Extended metadata
    expression: string,     // e (expression)
    ramification: [],       // I (ramification)
    // PHASE 1E: Add ASPIC+ metadata here
  }
}
```

### 2. Dialogue State

**Formal Definition**: State at step i = ⟨BSᵢ, DSᵢ, BAᵢ, DAᵢ⟩
- **BS, BA**: Commitment States (stored arguments/propositions)
- **DS, DA**: Designs (interaction structures)

**Evolution Dynamics**:
1. **Design Update**: Add current intervention acts + duals of previous acts
2. **Commitment State Update**: Add/erase Content Expressions based on concessions

**Mesh Implementation**:
- Commitment State ≈ Set of Arguments in deliberation
- Design ≈ Compiled Ludics structure from DialogueMoves

### 3. Commitment State (Content Expressions)

**Definition**: Repository of arguments as sets of designs (Content Expressions, C.E.)

**Storage**:
- Factual propositions: Designs based on ⊢L_F
- Inferential propositions: Designs based on L_F ⊢ L_G
- Rules/Laws: Complex designs (e.g., D_r1 for legal rules)

**Operations**:
- **Addition**: New propositions added as C.E.
- **Retraction**: Designs erased when negation conceded (change of mind)
- **Interaction**: Designs interact to perform logical computation
  - Can yield contradictions (critical for argumentation)
  - Results (normal forms) integrated back into C.S.

**Critical for Phase 1e**: The Commitment State is where ASPIC+ computations should be reflected. When a CQ creates an attack, this should be stored in the C.S. as a design that can interact with other designs.

---

## III. Key Theoretical Mechanisms

### 1. Negation

**Positive vs. Negative Propositions**:
- Positive factual: F is the case → Design ⊢L_F
- Negative factual: F is not the case → Design L_F ⊢ ⊢L_¬F

**Complex Negation** (conjunction example):
- ¬(F∧G) requires TWO negative designs:
  - ⊢L_¬F, L_¬G
  - ⊢L_¬G, L_¬F
- Ensures strictly commutative treatment

**Mesh Implication**: ASPIC+ attacks (UNDERMINES/UNDERCUTS/REBUTS) correspond to different negation structures.

### 2. Delocation and Fax Design

**Purpose**: Transfer information between loci

**Mechanism**: Fax_{ξ,ξ'} substitutes locus ξ with ξ' in a design

**Use Case**: When speaker S asserts F and addressee A concedes:
1. F in S's C.S. at locus L_F
2. F appears in dialogue at locus ξ.1.1
3. Fax interaction transfers F to A's C.S. at locus ρ
4. A now owns the proposition

**Mesh Implementation**: When DialogueMoves reference arguments, loci need to be properly tracked and mapped.

### 3. Inference as Interaction

**Core Principle**: Logical computation = Design interaction in Commitment State

**Example** (from juridical case):
1. Premises: D_cont (contract), D_del (delivery)
2. Rule: D_r1 (Contract + Delivery → Must Pay)
3. Interaction: [[D_cont, D_del, D_r1]] → D_to.pay (conclusion)
4. Further interaction with D_not.paid → Contradiction

**Critical Insight**: This is how ASPIC+ attacks should be modeled in Ludics:
- Attack = Design that interacts with target to produce contradiction/defeat
- Defeat status = Result of interaction (convergent/divergent)

---

## IV. Application to Juridical Argumentation (Example)

### Key Modeling Techniques

1. **Turn-Keeping Strategy**:
   - Insert negative action between two positive actions
   - Expression: "Besides..." (keeps turn, blocks opponent response)
   - Formal: (+, L, I, e₁), (−, L', ∅, "Besides"), (+, L'', I', e₂)

2. **Judge as Forced Intervention**:
   - Judge imposes concessions on one party's design
   - Closes pending branches (weakens loci)
   - Forces loser to play daimon (†)

3. **Logical Justification of Sentence**:
   - Imposed concessions update Commitment States
   - Interaction in C.S. resolves contradiction
   - Example: Accepting insanity defense renders contract rule inapplicable

---

## V. Implementation Mapping for Phase 1e

### Current Mesh Ludics System

**File**: `packages/ludics-engine/compileFromMoves.ts`

**Structure**:
```typescript
interface LudicAct {
  locusPath: string;
  daimonEndpoints?: DaimonEndpoint[];
  moves: DialogueMove[];
  extJson?: Record<string, any>;  // ← PHASE 1E: Enhance this
}

interface CompiledLudics {
  acts: LudicAct[];
  locusMapping: Map<string, LudicAct>;
  // ... other fields
}
```

### Phase 1e Enhancement Strategy

#### 1. Extract ASPIC+ from DialogueMove

```typescript
function extractAspicFromMove(move: DialogueMove): AspicMetadata | null {
  if (!move.payload?.aspicAttack) return null;
  
  return {
    cqId: move.payload.cqId,
    cqKey: move.payload.cqKey,
    attackType: move.payload.aspicAttack.type,
    attackerId: move.payload.aspicAttack.attackerId,
    defenderId: move.payload.aspicAttack.defenderId,
    succeeded: move.payload.aspicAttack.succeeded,
    targetScope: move.payload.aspicMetadata?.targetScope,
    defeatStatus: move.payload.aspicMetadata?.defeatStatus,
  };
}
```

#### 2. Store in LudicAct.extJson

```typescript
// In compileFromMoves.ts
const act: LudicAct = {
  locusPath: computedLocus,
  moves: [dialogueMove],
  extJson: {
    // Existing fields
    expression: dialogueMove.payload?.expression,
    
    // PHASE 1E: ASPIC+ metadata
    aspic: extractAspicFromMove(dialogueMove),
  }
};
```

#### 3. Preserve in AIF Synchronization

```typescript
// In syncLudicsToAif.ts
function generateCANodesFromLudics(ludics: CompiledLudics): AifNode[] {
  const caNodes: AifNode[] = [];
  
  for (const act of ludics.acts) {
    if (act.extJson?.aspic) {
      // Generate CA-node for ASPIC+ attack
      const caNode = {
        nodeID: `CA_${act.extJson.aspic.attackerId}_${act.extJson.aspic.defenderId}`,
        type: "CA",
        text: formatAttackDescription(act.extJson.aspic),
        metadata: {
          aspicAttackType: act.extJson.aspic.attackType,
          defeatStatus: act.extJson.aspic.defeatStatus,
          cqKey: act.extJson.aspic.cqKey,
          // ... full ASPIC+ metadata
        }
      };
      caNodes.push(caNode);
    }
  }
  
  return caNodes;
}
```

### Provenance Chain Verification

**Complete Flow**:
```
User asks CQ
  ↓
DialogueMove created (WHY) with payload.aspicAttack
  ↓
compileFromMoves() extracts aspicAttack into LudicAct.extJson
  ↓
LudicAct stored in database with ASPIC+ metadata
  ↓
syncLudicsToAif() reads LudicAct.extJson.aspic
  ↓
Generates CA-node in AIF graph with ASPIC+ metadata
  ↓
Full provenance maintained: CQ → DM → ASPIC+ → Ludics → AIF
```

---

## VI. Theoretical Alignment Verification

### Ludics ↔ ASPIC+ Mapping

| Ludics Concept | ASPIC+ Equivalent | Implementation |
|----------------|-------------------|----------------|
| Action | Argument move | DialogueMove |
| Chronicle | Argument sequence | Sequence of DialogueMoves |
| Design | Argumentation tree | Compiled Ludics structure |
| Interaction | Attack/Defeat | ASPIC+ attack computation |
| Convergence | Argument accepted | No defeat/contradiction |
| Divergence | Argument defeated | Attack succeeded |
| Daimon (†) | Terminal state | Dialogue ends |
| Commitment State | KB + Arguments | Database Arguments + Claims |
| Content Expression | Argument structure | ASPIC+ Argument type |
| Locus | Argument identifier | Argument ID / Locus path |

### Critical Questions as Ludics Actions

**CQ Characteristics in Ludics**:
1. **Polarity**: Negative for asker (challenging), positive for responder
2. **Justification**: CQ justified by target argument
3. **Ramification**: CQ opens new loci for responses
4. **Expression**: The CQ text itself

**ASPIC+ Attack in Ludics**:
- **Undermining**: Design attacks premise → Locus L_premise
- **Undercutting**: Design attacks inference rule → Locus L_rule
- **Rebutting**: Design attacks conclusion → Locus L_conclusion

**Phase 1e Implementation**:
```typescript
// When compiling WHY move (CQ asked)
if (move.kind === "WHY" && move.payload?.aspicAttack) {
  act.extJson.aspic = {
    type: "question",
    attackType: move.payload.aspicAttack.type,
    targetLocus: computeTargetLocus(move.targetId),
    // ... metadata
  };
}

// When compiling ATTACK move (CQ answered)
if (move.kind === "ATTACK" && move.payload?.aspicAttack) {
  act.extJson.aspic = {
    type: "attack",
    attackType: move.payload.aspicAttack.type,
    succeeded: move.payload.aspicAttack.succeeded,
    defeatStatus: move.payload.aspicMetadata?.defeatStatus,
    // ... full metadata
  };
}
```

---

## VII. Implementation Guidelines for Phase 1e

### Design Principles

1. **Minimal Intrusion**: Enhance existing Ludics compilation without restructuring
2. **Backward Compatibility**: extJson field already exists, just extend it
3. **Provenance Completeness**: Store ALL ASPIC+ metadata needed for reconstruction
4. **AIF Fidelity**: Ensure AIF generation can recreate full attack structure

### Key Files to Modify

1. **packages/ludics-engine/compileFromMoves.ts**
   - Extract ASPIC+ from DialogueMove.payload
   - Store in LudicAct.extJson.aspic

2. **lib/ludics/syncToAif.ts**
   - Read LudicAct.extJson.aspic
   - Generate CA-nodes with ASPIC+ metadata
   - Link CA-nodes properly in AIF graph

3. **Types to Define**
   ```typescript
   interface LudicAspicMetadata {
     cqId?: string;
     cqKey?: string;
     attackType: "UNDERMINES" | "UNDERCUTS" | "REBUTS";
     attackerId: string;
     defenderId: string;
     succeeded: boolean;
     defeatStatus?: boolean;
     targetScope: "premise" | "inference" | "conclusion";
     targetLocus?: string;
   }
   ```

### Validation Strategy

1. **Unit Tests**: Verify metadata extraction from DialogueMove
2. **Integration Tests**: 
   - CQ → DialogueMove → Ludics (metadata preserved)
   - Ludics → AIF (CA-nodes generated correctly)
3. **Provenance Tests**: Round-trip verification
   - Create CQ with ASPIC+ attack
   - Compile to Ludics
   - Sync to AIF
   - Verify all metadata present in AIF graph

---

## VIII. Theoretical Justification

### Why This Approach is Theoretically Sound

1. **Ludics as Meta-Framework**: Ludics is explicitly designed to unify dialogue structure with inferential content. ASPIC+ metadata is inferential content that belongs in Ludics.

2. **extJson as Content Expression**: The extJson field in LudicAct serves the same role as Content Expressions in Ludics theory—storing the semantic content associated with an action.

3. **Interaction Preservation**: By storing ASPIC+ metadata in Ludics, we enable future computation where Ludics acts can interact based on their ASPIC+ properties (e.g., checking if attacks succeed as defeats).

4. **Monotonic Updates**: Ludics handles belief revision through erasure, not nonmonotonicity. Our approach aligns: ASPIC+ metadata is added monotonically, and updates (if needed) are handled via new acts, not modification of old ones.

5. **Bidirectional Translation**: The research paper "AIF Formal Grounding in ASPIC+" establishes bidirectional translation. Our implementation completes this by ensuring:
   - ASPIC+ → Ludics (Phase 1e: via extJson)
   - Ludics → AIF (via syncToAif with CA-node generation)
   - AIF → ASPIC+ (already implemented in Phase 0)

---

## IX. Next Steps for Phase 1e Implementation

### Implementation Sequence

1. **Define Types** (lib/ludics/types.ts)
   - LudicAspicMetadata interface
   - Extend LudicAct type

2. **Enhance compileFromMoves** (packages/ludics-engine/compileFromMoves.ts)
   - Import extractAspicMetadataFromMove helper (Phase 1d)
   - Extract ASPIC+ from each DialogueMove
   - Store in act.extJson.aspic

3. **Update syncLudicsToAif** (lib/ludics/syncToAif.ts)
   - Read LudicAct.extJson.aspic
   - Generate CA-nodes for attacks
   - Link CA-nodes in AIF graph structure

4. **Testing** (create test file)
   - Unit: extractAspicMetadataFromMove
   - Integration: CQ → Ludics → AIF
   - Provenance: Round-trip verification

5. **Documentation**
   - Update Ludics compilation docs
   - Add ASPIC+ integration notes
   - Document CA-node generation logic

### Success Criteria

✅ All DialogueMoves with ASPIC+ metadata preserve it in Ludics  
✅ LudicAct.extJson.aspic contains complete attack information  
✅ AIF graph includes CA-nodes generated from Ludics metadata  
✅ Provenance chain complete: CQ → DM → ASPIC+ → Ludics → AIF  
✅ No breaking changes to existing Ludics compilation  
✅ Tests pass for full pipeline  

---

## X. Conclusion

Ludics provides the perfect theoretical framework for integrating ASPIC+ formal semantics with dialogue structure. The framework's core insight—that interaction IS logical computation—aligns perfectly with our goal of making argumentation semantics first-class citizens in the dialogue system.

Phase 1e implementation is straightforward because:
1. Ludics already has the structure (LudicAct.extJson) for storing semantic metadata
2. The provenance chain is already partially implemented (DialogueMove → Ludics)
3. We just need to preserve ASPIC+ metadata through the chain
4. The theoretical foundations are sound and well-aligned

**We are now ready to implement Phase 1e with full theoretical alignment.** 🚀

