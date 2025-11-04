# Ludics Theory Foundations: Key Concepts for Implementation

**Source:** "Dialogues in Ludics" - Fleury, Quatrini, Tronçon (2011)  
**Date:** November 4, 2025  
**Purpose:** Ground our implementation in formal ludics theory

---

## Core Philosophical Principles

### 1. **Concrete Identity vs Abstract Identity**

**Theory (§1.1):**
> "Abstract identity (the same name refers to the same content) is replaced in Ludics by a concrete identity based, as if in a game, on a **behavioral criterion requiring concrete observation**: reactions experienced by a player corresponds likewise to the actions of his opponent."

**Implementation Implication:**
- Two designs are "equal" iff they interact identically with all counter-designs
- We don't compare designs by structure, but by **orthogonality behavior**
- `isOrthogonal(D, E)` is more fundamental than structural equality

**Code Consequence:**
```typescript
// Wrong approach (structural comparison)
const areEqual = (d1: Design, d2: Design) => 
  JSON.stringify(d1) === JSON.stringify(d2);

// Correct approach (behavioral comparison)
const areEqual = (d1: Design, d2: Design) => {
  // d1 ≡ d2 iff for all counter-designs C:
  // orthogonal(d1, C) ⟺ orthogonal(d2, C)
  const counterDesigns = getAllCounterDesigns();
  return counterDesigns.every(C => 
    orthogonal(d1, C) === orthogonal(d2, C)
  );
};
```

---

### 2. **Localization Constraint: Occurrences → Loci**

**Theory (§1.1):**
> "Context-sensitive logics, like linear logic, introduces occurrences linked by an orthogonality relation. By the fact of localization, occurrences became **locations (loci) in a geometrical framework** and, necessarily, locations are considered as different ones."

**Implementation Implication:**
- Each act happens at a **specific locus** (address like `ε`, `σ`, `σ.1`)
- Same claim at different loci = **different acts** (no global identity)
- Loci form a tree structure (addresses are paths)

**Current Implementation:**
```typescript
// ✅ We already do this correctly
LudicAct {
  id: string;
  locus: { path: string };  // ← Each act has explicit address
  ...
}

// Example: Same claim, different loci
Act1 { expression: "Climate change is real", locus: { path: "0.1" } }
Act2 { expression: "Climate change is real", locus: { path: "0.2" } }
// ⟹ Act1 ≠ Act2 (different places in dialogue)
```

---

### 3. **Three Notions of Meaning**

#### Meaning 1: **Action Meaning** (§1.1)
> "The action of my opponent is the meaning of my own: it is induced by actions I have done, and it induces reactions by me."

- **Meaning = Set of possible interactions**
- An assertion's meaning = all the WHY/GROUNDS moves it enables

**Implementation:**
```typescript
// Meaning of an assertion = its reaction space
function getMeaning(act: LudicAct): Set<LudicAct> {
  // All acts that can respond to this act
  return acts.filter(a => 
    a.locus.path.startsWith(act.locus.path) &&
    a.polarity !== act.polarity
  );
}
```

#### Meaning 2: **Strategy Meaning** (§1.2)
> "My strategies are the meaning of the strategies of my opponent, since he made choices in all the playable strategies in order to select one which can optimally play against mine."

- **Design = Anticipated responses to opponent**
- Each design contains "deconstruction" of opponent's possible moves

**Implementation:**
- Proponent design contains negative acts (anticipated WHY moves from Opponent)
- These represent "what I expect you to challenge"

#### Meaning 3: **Interaction Meaning** (§1.3)
> "The meaning of our common search is the **form of our interaction itself**. If we diverge, it means that no durable connection is possible between our games."

- **Convergence = Agreement reached**
- **Divergence = Irreconcilable positions**
- **Stuck = Exploration incomplete**

**Implementation:**
```typescript
// Already implemented in stepTrace
trace: {
  status: 'CONVERGENT' | 'DIVERGENT' | 'STUCK';
  pairs: [...];  // Chronicle of interaction
}
```

---

## Formal Objects (§2.1)

### Design Definition

**Theory:**
> "A design can be understood as a **strategy**, i.e. as a set of plays (chronicles) ending by answers of Player against the moves planned by Opponent."

**Structure:**
- **Base (fork):** `Γ ⊢ Ξ` where Γ ≤ 1 (singleton or empty), Ξ finite
  - Negative base: `σ ⊢ Ξ` (Opponent starts)
  - Positive base: `⊢ Ξ` (Player chooses where to start)
- **Actions (moves):** 3-tuple `(polarity, locus, ramification)`
  - Polarity: `+` (Player/Proponent) or `−` (Opponent)
  - Locus: Address σ (where action is anchored)
  - Ramification: Finite set I of child loci opened by action

**Implementation Mapping:**
```typescript
LudicDesign {
  id: string;
  participantId: 'Proponent' | 'Opponent';  // ← Polarity of design
  acts: LudicAct[];                         // ← Chronicle/plays
}

LudicAct {
  kind: 'PROPER' | 'DAIMON';
  polarity: 'P' | 'O';                      // ← Action polarity
  locus: { path: string };                  // ← Address (σ)
  ramification: string[];                   // ← Opened children (I)
  expression: string;                       // ← Content (not in formal ludics)
}
```

### Three Rules

#### Rule 1: **Daimon (†)**
**Theory:** "For giving up the proof search"

```
        †
    ————————
      ⊢ Ξ
```

**Interpretation:** "I terminate / concede / give up"

**Implementation:**
```typescript
{ kind: 'DAIMON', expression: 'END' }
```

#### Rule 2: **Positive Rule**
**Theory:** Opens ramification I

```
    σ.i ⊢ Ξᵢ  ... for i ∈ I
    ————————————————————————  (σ, I)
         ⊢ σ, Ξ
```

**Interpretation:** "I assert/claim at σ, opening branches I"

**Implementation:**
```typescript
{
  kind: 'PROPER',
  polarity: 'P',
  locus: { path: 'σ' },
  ramification: ['1', '2', '3'],  // Opens σ.1, σ.2, σ.3
}
```

#### Rule 3: **Negative Rule**
**Theory:** Responds by choosing one branch from opened ramification

```
    σ.I ⊢ ΞI  ... for I ∈ N
    ————————————————————————  (σ, N)
         σ ⊢ Ξ
```

**Interpretation:** "I challenge/question at σ, focusing on branch I"

**Implementation:**
```typescript
{
  kind: 'PROPER',
  polarity: 'O',
  locus: { path: 'σ.I' },  // Focuses on one child
  ramification: [],        // No new openings (just responds)
}
```

---

## Interaction & Normalization (§2.2)

### Cut & Cut-Net

**Theory:**
> "The interaction is obtained by means of the **cut**; it creates a dynamics of rewriting of the cut-net."

**Cut-Net:** Two designs connected by shared loci in dual positions
- Example: Design D with base `⊢ σ` cut with Design E with base `σ ⊢ Ξ`
- Result: Cut-net with base `⊢ Ξ`

**Implementation:**
```typescript
// Trace computation = normalization of cut-net
async function stepTrace(posDesign: Design, negDesign: Design): Promise<Trace> {
  // Normalize the cut-net ⟨ posDesign | negDesign ⟩
  // Returns chronicle of interaction steps
}
```

### Normalization Steps

**Theory (§2.2):**

1. **Convergence (†):** Positive design plays daimon → Result is `Dai+` (success)
2. **Divergence:** Ramifications don't match → `I ⊈ N` → Normalization fails
3. **Reduction:** Match positive ramification I with negative N where `I ∈ N`

**Implementation Mapping:**
```typescript
trace.status = 
  design.acts.some(a => a.kind === 'DAIMON') ? 'CONVERGENT' :
  ramificationMismatch ? 'DIVERGENT' :
  'ONGOING';
```

### Chronicle (Dispute)

**Theory:**
> "The notion of **dispute** allows us to report the sequence of the moves (actions) of the play (interaction between two designs), from the point of view of one of speakers."

**Example from paper (FM-contract):**
```
(−, ξ, {0}), (+, ξ.0, {1,3}), (−, ξ.0.3, {1}), †
```

**Implementation:**
```typescript
trace.pairs = [
  { posActId: '...', negActId: '...', locusPath: 'ξ' },
  { posActId: '...', negActId: '...', locusPath: 'ξ.0' },
  { posActId: '...', negActId: '...', locusPath: 'ξ.0.3' },
  ...
];
```

---

## Dialogue Formalization (§3)

### Three Functions of Dialogue (§1)

**Theory:**
1. **Exchange of information:** Each utterance informs about object, subject, and connection
2. **Construction of knowledge:** Dialogue unfolds as exploration of thesis/counter-thesis
3. **Resolution of cognitive tension:** Interaction extracts stable knowledge

**Implementation:**
- Function 1 → DialogueMoves with `targetId`, `actorId`, `kind`
- Function 2 → LudicDesigns as strategies (exploration plans)
- Function 3 → Trace convergence/divergence status

### Elementary Decomposition (§3.1)

**Theory:**
> "An **intervention** of Speaker or Addressee is an **action** (ε, ξ, I)."

**Mapping:**
```
DialogueMove  →  LudicAct (via compileFromMoves)
  kind            polarity + kind
  targetId        anchors to locus
  payload         ramification metadata
```

**Example from paper (Real Estate Sales):**
```
P: I have heard you would like to sell... which one?
   → (+, s, {0})

O: I intend to sell A1 and A2.
   → (−, s.0, {1, 2})

P: At what price do you sell A1?
   → (+, s.0.1, {5})

O: 100000 euros
   → (−, s.0.1.5, {100})

P: OK
   → †
```

**Our Implementation:**
```typescript
DialogueMove { kind: 'ASSERT', targetId: 'arg1', ... }
  ↓ compileFromMoves
LudicAct { polarity: 'P', locus: 's', ramification: ['0'] }

DialogueMove { kind: 'WHY', targetId: 'arg1', ... }
  ↓ compileFromMoves
LudicAct { polarity: 'O', locus: 's.0', ramification: ['1', '2'] }
```

---

## Advanced Concepts

### 1. **Fax (Delocation)** (§2.1, §3.3)

**Theory:**
> "Interaction between a design D of base ⊢ ξ and the Fax of base ξ ⊢ ξ' enables us to **delocalize a design**, to move it, to modify its place of anchoring."

**Formula:**
```
Fax_ξ,ξ' : ξ ⊢ ξ'
```

**Result:** Design D becomes D' where all instances of ξ are replaced with ξ'

**Use Case (§3.3 - Stratagem 4):**
> "The speaker can use pieces of former dialogues... designs coming from outside the dialogue in progress."

**Implementation Need:**
```typescript
// TODO: Implement delocation for cross-scope references
async function delocalize(
  design: Design,
  fromLocus: string,
  toLocus: string
): Promise<Design> {
  // Interact design with Fax_fromLocus,toLocus
  // Return normalized result
}

// Use case: Import argument from another scope
const importedDesign = await delocalize(
  previousScopeDesign,
  'previousScope.0',
  'currentScope.2.3'
);
```

### 2. **Presupposition** (§3.2)

**Theory:**
> "An intervention is no more represented by actions (moves) but by **whole designs** (plays)."

**Example:** "Do you still beat your father?"
- Presupposes: "You beat your father" (not accepted by addressee)
- Represented as: Entire chronicle `(+,ξ,{0})(−,ξ.0,{1})(+,ξ.0.1,{0})` played as one intervention

**Implementation:**
```typescript
// Intervention = Entire design (not single act)
DialogueMove {
  kind: 'ASSERT',
  payload: {
    acts: [  // ← Multi-act payload
      { polarity: 'pos', locusPath: 'ξ', openings: ['0'] },
      { polarity: 'neg', locusPath: 'ξ.0', openings: ['1'] },
      { polarity: 'pos', locusPath: 'ξ.0.1', openings: ['0'] },
    ]
  }
}
```

**Already Supported!** (from `compileFromMoves.ts` line 174):
```typescript
const protoActs = Array.isArray((m.payload as any)?.acts) 
  ? expandActsFromMove(m as any) 
  : [];
```

### 3. **Multi-Addresses (Picking Up Again)** (§3.2)

**Theory:**
> "At anytime a speaker makes an intervention anchored in a locus which is a **multi-address**, all is proceeding as if this locus has been duplicated."

**Use Case:** Speaker can "rewind" dialogue and retry from earlier point

**Implementation Need:**
```typescript
// TODO: Support multi-addresses for dialogue rewind
LudicLocus {
  path: string;          // Current: single path
  multiPath?: string[];  // NEW: Allow multiple paths (duplicated locus)
}

// Allow replaying positive action at already-visited locus
// Example: Retry argument after conceding first attempt
```

### 4. **Petition of Principle (Circular Reasoning)** (§3.3)

**Theory:**
> "The soul is immortal because it never dies" - Circular reasoning creates **infinite design** where loci are never available.

**Recursive Design:**
```
D_ξ = [[D_ξ, Fax_ξ,ξ.1.1]]
       ⊢ ξ.1.1
     ———————————
      ξ.1 ⊢
    —————————
      ⊢ ξ
```

**Implementation Warning:**
```typescript
// Detect circular justification chains
function detectCircularReasoning(design: Design): boolean {
  const visited = new Set<string>();
  
  function traverse(actId: string): boolean {
    if (visited.has(actId)) return true;  // Cycle detected
    visited.add(actId);
    
    const children = getChildActs(actId);
    return children.some(child => traverse(child.id));
  }
  
  return design.acts.some(act => traverse(act.id));
}
```

---

## Key Differences: Theory vs Implementation

### What We Have ✅

1. **Designs as strategies** → `LudicDesign` with acts
2. **Polarity** → `participantId: 'Proponent' | 'Opponent'`
3. **Loci** → `LudicLocus` with path addresses
4. **Actions** → `LudicAct` with polarity, locus, ramification
5. **Daimon** → `kind: 'DAIMON'`
6. **Interaction/Trace** → `stepTrace` normalization
7. **Convergence/Divergence** → `trace.status`
8. **Chronicle** → `trace.pairs` (sequence of handshakes)

### What We're Missing ❌

1. **Fax/Delocation** → Not implemented (needed for cross-scope references)
2. **Multi-addresses** → Not implemented (needed for dialogue rewind)
3. **Base (fork) distinction** → We treat all designs as positive base
4. **Explicit ramification matching** → Trace computation doesn't validate I ⊆ N
5. **Design equality via behavior** → No orthogonality-based equality check
6. **Multi-act interventions** → Supported in schema but not used in UI

### What We Added (Beyond Theory) 🆕

1. **Expression/Content** → `act.expression` (ludics is purely structural)
2. **AIF Integration** → Syncing ludics acts to argument graph
3. **Insights** → `computeInsights` for orthogonality, decisiveness
4. **Badges** → UI indicators for ludics properties
5. **Scope** → NEW architecture for modular designs (not in paper)

---

## Scoped Designs: Theoretical Grounding

### Core Principle from Paper (§1)

> "We describe parts of dialogues as sequences of polarized actions which constitute the chronology of symbolic exchanges."

**Key Insight:** Paper assumes **single dialogue** = 2 designs (P + O)

**Our Extension:** **Multi-issue deliberation** = N dialogues = 2N designs

### Justification

**From §3.3:**
> "The designs themselves can be seen as **resulting of interactions**. [...] Some designs, in fact a set of designs (**a context**) is available to the locutors when they build their interventions."

**Interpretation:**
- Each **issue** = Independent dialogue = Own P/O pair
- **Context** = Set of all designs across all issues
- **Delocation** = Import design from one issue to another

**Formula:**
```
Deliberation = { (P_issue1, O_issue1), (P_issue2, O_issue2), ... }

Cross-issue reference = Delocalize design from issue_i to issue_j
```

### Forest = Multiple Local Interactions

**From Introduction:**
> "Ludics focalizes on the **interaction** [...] investigating the dynamics of **interactive situations**."

**Plural "situations"** suggests multiple independent interactions, not single monolithic one.

**Our Forest Architecture:**
```
Forest = {
  Interaction_1: ⟨ P_climate, O_climate ⟩ → CONVERGENT
  Interaction_2: ⟨ P_nuclear, O_nuclear ⟩ → DIVERGENT
  Interaction_3: ⟨ P_cars, O_cars ⟩ → STUCK
}
```

Each interaction is **local** and **independent** (unless explicitly linked via delocation).

---

## Implementation Priorities

### Phase 1: Align with Theory (Week 1)

1. **✅ Already Done:**
   - Designs with polarity
   - Loci with addresses
   - Actions with ramification
   - Trace/chronicle computation
   - Convergence/divergence detection

2. **🔧 Fix/Improve:**
   - Validate ramification matching in trace (I ⊆ N check)
   - Distinguish positive/negative base (currently all positive)
   - Add behavioral equality via orthogonality

### Phase 2: Advanced Features (Week 2-3)

3. **🆕 Implement from Theory:**
   - Fax/Delocation (for cross-scope references)
   - Multi-addresses (for dialogue rewind)
   - Multi-act interventions (already in schema, use in UI)

### Phase 3: Scoped Designs (Week 4)

4. **🌲 Forest Architecture:**
   - Per-issue scoping (local interactions)
   - Delocation for cross-issue references
   - Context management (available designs)

---

## Theoretical Validation Questions

### Q1: Does scoping violate ludics theory?

**Answer:** No. Paper assumes single dialogue for simplicity, but §3.3 explicitly mentions "set of designs (a context)" and using "pieces of former dialogues."

**Scoping = Formal recognition that deliberation contains multiple local dialogues.**

### Q2: Should each actor have their own design?

**Theory (§3.1):**
> "An intervention of **Speaker** or **Addressee** is an action."

**Answer:** Paper uses 2-party model (Speaker/Addressee, Player/Opponent). Extension to N-party requires:
- Either: N×M pairwise interactions (actor-pair scoping)
- Or: Coalitions (all pro actors → P, all opp actors → O) (issue scoping)

**Recommendation:** Start with issue scoping (2 designs per issue), add actor attribution in metadata.

### Q3: How does orthogonality work across scopes?

**Theory (§1.3):**
> "If we diverge, it means that no durable connection is possible between our games."

**Answer:** Orthogonality is **per-interaction**:
- `orthogonal(P_climate, O_climate)` = independent of `orthogonal(P_nuclear, O_nuclear)`
- Global convergence = AND of all per-scope convergences
- This is more informative than monolithic check

---

## Summary: Theory → Implementation Checklist

### Core Concepts ✅
- [x] Designs as strategies
- [x] Loci as addresses
- [x] Actions with polarity and ramification
- [x] Daimon for termination
- [x] Interaction via normalization
- [x] Chronicle (dispute) as trace
- [x] Convergence/divergence detection

### Advanced Features 🔄
- [ ] Fax (delocation) for moving designs
- [ ] Multi-addresses for dialogue rewind
- [ ] Ramification validation (I ⊆ N)
- [ ] Behavioral equality via orthogonality
- [ ] Petition of principle detection (circular reasoning)

### Extensions 🆕
- [x] Content (expression) on acts
- [x] AIF integration
- [x] Insights computation
- [x] UI badges
- [ ] Scoped designs (issue-based)
- [ ] Cross-scope delocation
- [ ] Actor attribution metadata

### Theoretical Alignment 📚
- [x] Grounded in "Dialogues in Ludics" paper
- [x] Scoping justified by "context" and "former dialogues" mentions
- [x] Local interactions match paper's "interactive situations" (plural)
- [x] Forest view = Multiple independent normalizations

---

**Conclusion:** Our implementation is **well-grounded in ludics theory**. The scoped designs architecture is a **natural extension** that aligns with the paper's mention of contexts and multiple dialogues. Proceeding with implementation is theoretically sound.

**Next Steps:**
1. Review this document with team
2. Validate scoping strategy choice (issue-based recommended)
3. Begin Milestone 1: Schema updates
4. Implement delocation for cross-scope references (Phase 2)
