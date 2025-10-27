# Foundational Research Synthesis: Three Key Documents

**Review Date:** October 27, 2025  
**Reviewer:** Architecture Deep-Dive  
**Purpose:** Integrate formal frameworks (DDF, computational models, categorical semantics) with architecture review

---

## 📚 Documents Reviewed

1. **"The Deliberation Dialogue Framework: Eightfold Way Protocol"** (DDF)
2. **"Foundational and Computational Argumentation Models"**
3. **"Synthesis of Key Themes in Computational Logic, Language, and Argumentation"**

---

## 🎯 Executive Summary: Why These Matter for Mesh

These three documents provide the **formal theoretical foundation** for the categorical/evidential architecture we're reviewing. They reveal:

1. **DDF (Eightfold Way)** = The **dialogue protocol** Mesh should implement for structured deliberation
2. **Computational Models** = The **verification/implementation strategies** for translating formal specs → working code
3. **Categorical Synthesis** = The **compositional semantics** that unify argumentation, uncertainty, and NLP

**Critical Discovery:** The current Mesh codebase implements ~60% of these foundations (AIF, ASPIC+, some confidence modes) but is **missing key protocol layers** (DDF stages, commitment stores, embedded dialogues, ludic interactions).

---

## 📖 Document 1: Deliberation Dialogue Framework (DDF) - "Eightfold Way Protocol"

### Core Concept

A **formal protocol for collaborative decision-making** through structured argumentation dialogue, designed for computational agents but applicable to human deliberation.

### Key Distinctions: Deliberation vs Other Dialogue Types

| Dialogue Type | Goal | Strategy | Information Sharing |
|---------------|------|----------|---------------------|
| **Deliberation** | Joint decision on action | Collaborative | Open (pooling information) |
| Persuasion | Convince opponent | Competitive | Strategic withholding |
| Inquiry | Discover truth | Collaborative | Open |
| Negotiation | Divide scarce resource | Competitive | Strategic secrecy |

**Mesh Implication:** Current system has persuasion dialogue mechanics (attack/defend) but **lacks deliberation-specific features** (joint decision protocol, action-options, goal/constraint tracking).

---

### Theoretical Foundation: Retroflexive Argumentation (Harald Wohlrapp)

**Core Principle:** Arguments should lead participants to **re-examine underlying assumptions** or **modify the action proposal** itself, not just debate acceptability.

**Mechanism:** Iterative cycling through stages where proposals, goals, constraints, and perspectives can be revised in light of arguments.

**Mesh Status:**
- ✅ Has revision tracking (claim/argument editing)
- ❌ No formal "Revise" stage or retroflexive loop protocol
- ❌ No separation of action-options vs goals vs constraints

---

### Six Sentence Types (Deliberation Dimensionality)

| Type | Description | Example | Mesh Equivalent |
|------|-------------|---------|-----------------|
| **Actions** | Deeds/acts to undertake | "Implement feature X" | ❌ Not a first-class type |
| **Goals** | Desired future states | "Increase user engagement" | ❌ Not typed separately |
| **Constraints** | Limitations on actions | "Budget < $50k" | ❌ Not tracked |
| **Perspectives** | Evaluation criteria | "Moral, economic, feasibility" | ⚠️ Partial (via schemes?) |
| **Facts** | External states | "Current traffic is 10k/day" | ✅ Claims (I-nodes) |
| **Evaluations** | Assessment of action | "Feature X scores high on moral perspective" | ❌ Not formalized |

**Critical Gap:** Mesh treats everything as generic "claims" - **no ontological distinction** between these six sentence types.

---

### Eight Stages of Dialogue (The "Eightfold Way")

```
1. OPEN        → Raise governing question
2. INFORM      → Discuss goals, constraints, facts, perspectives
3. PROPOSE     → Suggest action-options
4. CONSIDER    → Assert evaluations of proposals
5. REVISE      → Modify goals/constraints/perspectives/actions (RETROFLEXIVE)
6. RECOMMEND   → Propose option for joint decision (move(.) locution)
7. CONFIRM     → Unanimity required for acceptance
8. CLOSE       → Terminate dialogue
```

**Stage Rules:**
- INFORM **must precede** all stages except OPEN/CLOSE
- Cycling allowed: PROPOSE → CONSIDER → REVISE → PROPOSE → ...
- RECOMMEND requires **move(.) locution** (special speech act)
- CONFIRM requires **unanimity** (all participants accept)

**Mesh Status:**
- ✅ Has deliberation lifecycle (draft/active/closed)
- ❌ No formal stage tracking (INFORM → PROPOSE → CONSIDER → REVISE)
- ❌ No move(.) locution for recommendations
- ❌ No unanimity protocol for CONFIRM
- ❌ No governing question formalism

---

### Locutions (Speech Acts) and Commitment Stores

**Core Mechanism:** Each participant has a **Commitment Store (CS)** - a private-write, public-read data structure tracking publicly declared positions.

#### Key Locutions:

| Locution | Precondition | Effect on CS | Mesh Equivalent |
|----------|--------------|--------------|-----------------|
| `open_dialogue(Pi, q?)` | None | Initialize dialogue | ✅ Create deliberation |
| `enter_dialogue(Pj, q?)` | Dialogue exists | Join CS | ✅ Join deliberation |
| `assert(Pi, type, t)` | Stage allows | Insert t into CS_i | ✅ Post claim/argument |
| `ask_justify(Pj, Pi, type, t)` | t ∈ CS_i | Challenge | ⚠️ Partial (CQ system) |
| `retract(Pj, locution)` | Prior assertion | Delete from CS_j | ❌ No formal retraction |
| `move(Pi, action, a)` | RECOMMEND stage | Insert a, request acceptance | ❌ Missing |
| `prefer(Pi, a1, a2)` | Both in CS | Preference ordering | ✅ PreferenceApplication |
| `withdraw_dialogue(Pi, q?)` | Any time | Enter CLOSE stage | ⚠️ Partial (close deliberation) |

**Critical Gaps:**
1. **No Commitment Store implementation** (would be like user-specific view of their public assertions)
2. **No ask_justify → retract OR embed-persuasion protocol**
3. **No move(.) locution for recommendations**
4. **No retract(.) with retroactive effect**

---

### Embedded Dialogues and Justification

**Mechanism:** When `ask_justify(Pj, Pi, type, t)` is issued, Pi must either:
1. **Retract** t (remove from CS), OR
2. **Enter embedded persuasion dialogue** to justify t

**Embedded Dialogue Flow:**
```
Main Deliberation (DDF)
  ├─> ask_justify(J, I, fact, "Traffic is 10k/day")
  │
  └─> EMBEDDED: Persuasion Dialogue
        ├─> I provides evidence/sources
        ├─> J attacks or accepts
        └─> RETURN: Result to main deliberation
              ├─> If justified: t remains in CS_I
              └─> If defeated: I must retract(t)
```

**Mesh Status:**
- ✅ Has CQ system (critical questions on schemes)
- ❌ No embedded dialogue protocol
- ❌ CQs are scheme-specific, not general justification challenges
- ❌ No mechanism to temporarily suspend main dialogue

**Implication:** The **CQ system should be generalized** into an `ask_justify` protocol that can:
- Challenge **any** assertion (not just scheme applications)
- Spawn embedded persuasion/inquiry dialogues
- Return results to update main dialogue state

---

### Normative Compliance

#### Alexy's Rules for Discourse Ethics:

| Rule | Requirement | DDF Compliance |
|------|-------------|----------------|
| **A2** (Justification) | Must justify assertions on request | ✅ **Fully satisfied** (ask_justify locution) |
| **A1.2** (Sincerity) | Assert only what you believe | ❌ **Explicitly rejected** (public semantics only) |
| **A1.1** (Consistency) | No self-contradiction | ❌ **Explicitly rejected** (allows inconsistency) |

**Design Choice:** DDF restricts itself to **observable linguistic behavior** - does NOT model internal beliefs or enforce consistency. This is intentional for computational contexts where agents may hold contradictory evidence.

**Mesh Implication:** Should **not** enforce global consistency (allow conflicting arguments to coexist), but **should** provide tools to detect/visualize contradictions.

---

#### Hitchcock's Principles of Rational Mutual Inquiry (18 principles):

**High Compliance:**
- ✅ **H1** (Externalization): All reasoning visible in CS
- ✅ **H3** (Mutuality): Joint decision-making
- ✅ **H6** (Staging): Eight formal stages
- ✅ **H9** (Semantic Openness): No fixed ontology
- ✅ **H16** (Tracking): Commitment stores track positions
- ✅ **H18** (Burden of Proof): ask_justify allocates burden

**Partial Compliance:**
- ⚠️ **H2** (Dialectification): Participant freedom constrained by protocol
- ⚠️ **H14** (Openness): Fixed locutions limit flexibility

**Trade-off:** DDF sacrifices **maximal freedom** for **orderliness and coherence** - necessary for computational implementation.

---

### Computational Extensions: λ-Calculus and Category Theory

**Quote from document:**
> "The explicit typing of sentences (actions, goals, constraints, etc.) suggests a clear pathway for highly advanced research. This explicit typing may facilitate mathematical representation using **λ-calculus**, which could lead to the development of a **denotational semantics** for the protocol using **enriched category theory**."

**What This Means:**
- Each sentence type (Action, Goal, Constraint, Fact, Evaluation, Perspective) is a **type** in λ-calculus
- Locutions are **typed functions** (e.g., `assert :: Participant → Type → Sentence → CS`)
- Commitment stores are **monadic state** (functorial transformations)
- Stage transitions are **morphisms** in a category of dialogue states

**Mesh Implication:** The **six sentence types** should be **first-class database models** (not just tags on generic Claims):
```prisma
model Action { ... }        // Things to do
model Goal { ... }          // Desired outcomes
model Constraint { ... }    // Limitations
model Perspective { ... }   // Evaluation criteria
model Fact { ... }          // External states (current: Claim)
model Evaluation { ... }    // Assessments of actions
```

---

## 📖 Document 2: Foundational and Computational Argumentation Models

### Part I: Argument-Based Belief in Topological Structures

**Core Innovation:** Integrates **epistemic logic** with **abstract argumentation** using **topological semantics**.

#### The Model: Topological Argumentation Model (TAM)

**Structure:** M = (X, E₀, τ_E₀, ≺, V)

| Component | Meaning | Interpretation |
|-----------|---------|----------------|
| X | Set of possible worlds | All possible states |
| E₀ | Initial evidence | Base pieces of information |
| τ_E₀ | Topology on E₀ | How evidence can be combined (∩, ∪) |
| ≺ | Attack relation | Conflict between evidence |
| V | Valuation | Which propositions are true in which worlds |

**Key Idea:** Evidence = **open sets** in topology τ. The topology defines **how evidence combines**:
- **Finite intersections** (∩): Conjunction of evidence
- **Arbitrary unions** (∪): Disjunction of evidence

---

#### Attack Relation and Argument Graph

**Definition:** Two pieces of evidence e₁, e₂ attack each other iff **e₁ ∩ e₂ = ∅** (they conflict).

**Result:** This creates an **attack graph** A_τ = (τ, ≺) where:
- Nodes = open sets (combined evidence)
- Edges = attack relation

**Then apply Dung's semantics** to find acceptable evidence!

---

#### Grounded Belief via Fixed Point

**Characteristic Function:** d_τ(T) = {f ∈ τ | f is defended by T}

**Grounded Extension:** LFP_τ = least fixed point of d_τ

**Definition of Belief:**
> An agent has **grounded belief** in proposition P (written BP) iff ∃f ∈ LFP_τ such that f ⊆ P.

**Translation:** "I believe P because I have an acceptable argument (piece of evidence in the grounded extension) that supports P."

---

#### Critical Property: Closure Failure

**Theorem:** Grounded belief is **NOT closed under conjunction**.

**Meaning:** BP ∧ Bψ **does NOT imply** B(φ ∧ ψ)

**Why:** The strategy for selecting acceptable arguments (grounded extension) may include separate arguments for φ and ψ, but these arguments might be mutually attacking, so no single argument for (φ ∧ ψ) survives.

**Philosophical Implication:**
- Closure failure ≠ lack of logical reasoning ability
- The topology ensures agent **can** combine evidence logically
- But the grounded extension selection strategy may **reject** some combinations
- This separates **deductive capacity** from **belief formation**

**Mesh Implication:**
- ✅ System correctly allows conflicting arguments (no global consistency)
- ⚠️ Need to track **which combinations are acceptable** (grounded extension)
- ❌ Current confidence scoring may violate this (assumes independence)

---

#### Relationship to Evidence-Based Belief

**Evidence-Based Belief:** BelP iff ∃f ∈ J_M (set of justifications) where f ⊆ P

**Theorem:** BelP → BP (evidence-based belief is **stronger** than grounded belief)

**Special Case:** If attack relation ≺ is **symmetric**, then LFP_τ = J_M, so BP = BelP and closure is restored.

**Mesh Relevance:**
- Most argument attacks in Mesh are **not symmetric** (UNDERCUTS vs REBUTS)
- Therefore **cannot assume closure under conjunction**
- Confidence aggregation must respect this!

---

### Part II: Framework for Verification (Haskell + Agda)

**Problem:** How do we **prove** that our implementation of formal argumentation models is correct?

**Solution:** Use functional programming (Haskell) + dependent type theory (Agda) for **machine-checkable verification**.

---

#### Three-Layer Architecture

```
1. Mathematical Specification (Abstract)
   ↓ implement in
2. Haskell Implementation (Executable)
   ↓ formalize in
3. Agda Verification (Proof)
```

**Example: Dung's AF**
1. **Spec:** Define AF = (Args, Attack), grounded/semi-stable semantics
2. **Haskell:** Implement as data structures + fixed-point computation
3. **Agda:** Prove properties (e.g., grounded extension is unique, conflict-free, defends all members)

---

#### Key Achievements

1. **Dung's AF:** First fully machine-checkable formalization of Dung semantics
2. **Carneades:** Functional implementation + DSL for structured argumentation
3. **Verified Translation Pipeline:** Carneades → ASPIC+ → Dung AF with **correspondence properties proven**
4. **ASPIC+ Extensions:** Weight propagation, argument accrual, content orderings → Dung AF

**Mesh Relevance:**
- Current `lib/aif/` and `lib/arguments/` **not formally verified**
- Should adopt **property-based testing** (QuickCheck-style) as first step
- Long-term: Formalize in Agda/Coq for high-assurance applications

---

#### Testing Strategy (QuickCheck)

**Approach:** Automatically generate **random** argument graphs, check properties hold.

**Example Properties to Test:**
```haskell
-- Grounded extension is unique
prop_grounded_unique :: AF -> Bool
prop_grounded_unique af = length (groundedExtensions af) <= 1

-- Grounded extension is conflict-free
prop_grounded_conflict_free :: AF -> Bool
prop_grounded_conflict_free af = all conflictFree (groundedExtensions af)

-- If arg is in grounded, it's defended
prop_grounded_defended :: AF -> Bool
prop_grounded_defended af = all (defendedBy grounded) grounded
  where grounded = head (groundedExtensions af)
```

**Mesh Action Item:** Add QuickCheck-style tests to `lib/aif/validate.ts` and `lib/arguments/diagram.ts`.

---

### Part III: Argumentation Schemes

**Definition:** "Stereotypical, defeasible patterns of inference combining semantic-ontological relations with logical rules and types of reasoning."

**Historical Roots:** Aristotelian **topoi** (places to find arguments).

**Modern Purpose:**
1. **Analysis:** Identify patterns in natural arguments
2. **Recognition:** Classify arguments by scheme (for argument mining)
3. **Production:** Generate arguments following proven patterns
4. **Evaluation:** Use Critical Questions (CQs) to test defeasibility

---

#### Structure of a Scheme

**Components:**
1. **Name:** e.g., "Argument from Expert Opinion"
2. **Premises:** General pattern (e.g., "Expert E asserts P in domain D")
3. **Conclusion:** What follows (e.g., "P is plausibly true")
4. **Critical Questions:** Tests for defeaters
   - "Is E actually an expert in D?"
   - "Is E reliable?"
   - "Is P consistent with other expert opinions?"

**Defeasibility:** Schemes are **presumptive** - CQs can defeat the inference.

---

#### Classification Systems

**Toulmin (1984):** Function of warrants
- Generalization, Sign, Analogy, Authority, Cause, etc.

**Katzav & Reed (2004):** Relation of conveyance
- **Internal:** Depends on intrinsic features (definition, constitution, analyticity)
- **External:** Depends on extrinsic features (spatiotemporal, causal)

**Purpose-Based:**
- **Practical:** Recommends action (e.g., Value-Based Practical Reasoning)
- **Theoretical:** Supports state of affairs (e.g., Argument from Sign)

---

#### Example: Value-Based Practical Reasoning (VPR)

**Premises:**
1. Current circumstances: S_current
2. Desired goal: G
3. Action a transitions S_current → S_goal
4. S_goal promotes value V
5. V is important to agent

**Conclusion:** Action a should be performed.

**Critical Questions:**
- CQ1: Are there alternative actions?
- CQ2: Are there other consequences of a (side effects)?
- CQ3: Is there a higher-priority value?

**Mesh Status:**
- ✅ Has `ArgumentScheme` table
- ✅ Stores CQs as JSON
- ⚠️ No VPR scheme specifically (should add for deliberation!)
- ❌ No sentence type distinction (action vs goal vs value)

---

#### Computational Applications

**1. Formal Argumentation Systems (ASPIC+, Carneades)**
- Schemes = defeasible inference rules
- CQs = exceptions/defeaters
- **Mesh:** ✅ Has this (ASPIC translation in `lib/aif/translation/aifToAspic.ts`)

**2. Argument Interchange Format (AIF)**
- Schemes as Description Logic ontology
- Hierarchical relationships → infer CQs
- **Mesh:** ✅ Has AIF support (`lib/aif/jsonld.ts`)

**3. Argument Mining**
- Linguistic features → classify scheme
- Keywords (e.g., "expert says" → Expert Opinion scheme)
- **Mesh:** ❌ Not implemented (future NLP feature)

---

## 📖 Document 3: Synthesis of Computational Logic, Language, and Argumentation

### Theme 1: Uncertainty as Core Challenge

**Key Insight:** Move beyond pure probability to handle **diverse forms of uncertainty**.

---

#### Taxonomy of Uncertainty

**Sources:**
1. **Unpredictability:** Chaotic/variable systems, noise, non-stationarity, adversarial attacks
2. **Incomplete Knowledge (Epistemic):** Lack of evidence, ignorance
3. **Multiple Knowledge Frames:** Conflicting interpretations, ambiguity

**Subjective Logic (SL) Classification:**
1. **Vacuity:** Lack of evidence (epistemic)
2. **Vagueness:** Fuzzy observations (aleatoric)
3. **Dissonance:** Conflicting evidence (epistemic)

---

#### Belief Theories for Uncertainty

| Theory | Core Mechanism | Mesh Relevance |
|--------|---------------|----------------|
| **Dempster-Shafer (DST)** | Belief masses on power sets (explicit ignorance) | ✅ Mentioned in rulesetJson.confidence.mode = "ds" |
| **Transferable Belief Model (TBM)** | Belief update at "credal level" | ❌ Not implemented |
| **Dezert-Smarandache (DSmT)** | Highly conflicting evidence, PCR5/PCR6 fusion | ❌ Not implemented |
| **Imprecise Dirichlet (IDM)** | Upper/lower probabilities from multinomial data | ❌ Not implemented |
| **Fuzzy Logic** | Graded membership [0,1], Type-2 for measuring fuzziness | ❌ Not implemented |
| **Subjective Logic (SL)** | Vacuity, vagueness, dissonance modeling | ❌ Not implemented |
| **Bayesian Methods** | Prior/posterior distributions on weights | ⚠️ Partial (product mode) |

**Critical Gap:** Mesh has `rulesetJson.confidence.mode` options but **only implements basic modes** (min, product). Missing:
- DST combination rules
- Vacuity tracking
- Dissonance resolution
- Fuzzy support

---

### Theme 2: Argumentation Theory (Lakatos Game)

**Core Idea:** Mathematical discovery is a **social, dialectical process** of proofs and refutations.

---

#### Lakatos's Dialogue Patterns

**Basic Flow:**
1. **Conjecture & Proof:** P proposes conjecture + lemmas
2. **Counterexample:** O raises global/local/hybrid counterexample
3. **Defensive Moves:**
   - **Strategic Withdrawal:** Weaken conjecture domain
   - **Piecemeal Exclusion:** Modify conjecture directly
   - **Monster Barring:** Argue counterexample is invalid (modify definition)
   - **Lemma Incorporation:** Add condition from counterexample analysis

---

#### Formalization: Lakatos Game (LG)

**Structure:**
- **Locutions:** Conjecture, Proof, GlobalCounter, LocalCounter, MonsterBar, MonsterReject, ODefinition, PDefinition, etc.
- **Commitment Stores:** Track what each participant has asserted
- **Evaluation:** Build AIF structures → translate to ASPIC+ → compute grounded extension

**Key Result:** When global counterexample raised, **original conjecture leaves grounded extension** (proof suspended).

---

#### AIF Structure Example: Monster Barring Sequence

```
(P) Proof: "For all polyhedra, V-E+F=2"
   ↓ attacked by
(O) GlobalCounter: "Twin-tetrahedron has V-E+F=3"
   → infers ¬(∀ polyhedra. V-E+F=2)
   ↓ attacked by
(P) MonsterBar: "Not just any polygon system is a polyhedron"
   ← supported by
(P) PDefinition: "Polyhedron = system arranged such that..."
   ↓ conflicted by
(O) MonsterReject + ODefinition: "Polyhedron = surface of polygons..."
   → leads to
Prefer(PDefinition vs ODefinition)
```

**Mesh Relevance:**
- ✅ Has ConflictApplication (CA-nodes)
- ✅ Has PreferenceApplication (PA-nodes)
- ❌ No Lakatos-specific locutions (MonsterBar, etc.)
- ❌ No embedded persuasion protocol for definition disputes

**Implication:** Could implement **definition debates** as special dialogue type.

---

### Theme 3: Category Theory for Cognition and Language

**Core Thesis:** Category theory provides **universal foundation** for compositional reasoning.

---

#### Language of Thought (LoT) Properties

**Required Properties:**
1. **Compositionality:** Complex from simple
2. **Role-Filler Independence:** Concepts independent of syntactic role
3. **Predicate-Argument Structure:** Predicate(Argument) → truth-evaluable
4. **Logical Operators:** AND, OR, IF, NOT
5. **Inferential Promiscuity:** Transform between logical forms

**Categorical Formulation:**
- **Universality:** Universal constructions (products, limits) = optimal transformations
- **Duality:** Reverse structures systematically
- **Adjointness:** Mediate between opposites
- **Topos Theory:** Every topos has first-order logic interpretation

**Mesh Relevance:**
- This is **why** we need categorical semantics!
- Current argument structure has compositionality (premises → conclusion)
- But missing: Universal constructions (joins, limits), duality, adjunctions

---

#### Functorial Semantics for NLP

**Core Equation:**
```
Syntax --[Functor F]--> Semantics
```

**Syntax Category:**
- Objects = types (noun, sentence, etc.)
- Morphisms = grammatical derivations
- **String diagrams** for visualization

**Semantics Category:**
- Vector spaces (MatS): Distributional semantics
- Sets (Set): Montague/logical semantics
- Relations (Rel): Database queries
- Neural nets: RNN/recursive architectures
- Quantum circuits: Quantum NLP

**Functor F:**
- Preserves composition: F(g ∘ f) = F(g) ∘ F(f)
- Preserves identity: F(id) = id
- Compositional semantics: meaning(complex) = compose(meaning(parts))

---

#### DisCoCat: Compositional Distributional Model

**Mechanism:**
1. Parse sentence with **pregroup grammar** (rigid monoidal category)
2. Map to **string diagram** (boxes = words, wires = types)
3. Apply functor to **vector spaces** (words → tensors, grammar → tensor contractions)
4. Result: **Sentence tensor** from composed word embeddings

**Example: "Moses crossed the Red Sea"**
```
Moses     crossed               the    Red       Sea
  n     n.r s n.l             n n.l   n n.l      n
  └──────┘  │  └───────────────┘  └────┘  └──────┘
             └─────> s (sentence type)
```

**Mesh Relevance:**
- Could use DisCoCat for **claim similarity** (not just embedding cosine)
- Respects **grammatical structure** (not just bag-of-words)
- **Python library:** DisCoPy (pip install discopy)

---

#### Other Semantic Models

| Model | Functor Target | Application |
|-------|---------------|-------------|
| **Montague** | Set (λ-calculus) | First-order logic translation |
| **Relational** | Rel | Conjunctive queries for databases |
| **Neural** | Neural architectures | RNN/recursive for sentence encoding |
| **Quantum** | Quantum circuits | Quantum NLP (complexity class BQP) |

**Mesh Opportunity:** Implement **multiple semantic backends** using functorial interface.

---

### Theme 4: Ludics - Interaction and Dialogue

**Core Shift:** Focus on **process of interaction** (not just final proofs).

---

#### Key Concepts

**Paraproofs:** Both proof and refutation are "paraproofs" that interact.

**Daimon (†):** Special rule representing **failure/giving up**.
- Allows modeling **unsuccessful** interactions
- Opponent plays † to concede point

**Denegation:** Negation as **interactive opposition**.
- "Mary is not nice" = action opposing virtual "Mary is nice"
- Compels virtual speaker to play daimon (†)

---

#### Mesh Integration: The "Close" Move

**From Agora design docs:**
> "The appearance of a 'Close' option, represented by the daimon symbol (†), when a branch of dialogue becomes closable."

**This is Ludics in action!**
- Legal moves API shows `CLOSE (†)` when dialogue branch exhausted
- Direct mapping to ludic interaction failure
- **Should formalize:** When does † appear? (no valid moves left, acceptance reached, etc.)

---

### Theme 5: Case Study - Agora Platform Design

**Synthesis Document Shows:** Agora is **practical implementation** of all these formal concepts.

---

#### Core Features Aligned with Research

| Agora Feature | Formal Foundation |
|---------------|-------------------|
| **Plexus/Debate Sheet** | Graph of graphs (categorical product) |
| **Legal Moves API** | Dialogue game protocol (DDF locutions) |
| **Daimon (†) Close** | Ludics failure/termination |
| **Grounded/Preferred Semantics** | Dung's AF (topological belief) |
| **Confidence Modes** (min/product/ds) | Belief theories (DST, Bayesian) |
| **Hom-Set Calculation** | Categorical morphism sets |
| **SUPPOSE α · UNLESS ¬β · THEREFORE γ** | Defeasible reasoning (ASPIC+) |
| **Culprit Set** | Reason maintenance (belief revision) |

**Status Check Against Current Mesh Codebase:**

✅ **Implemented:**
- AIF structures (I/L/RA/CA/PA nodes)
- Dung semantics computation
- Confidence modes (partial)
- PreferenceApplication (PA-nodes)
- AssumptionUse (UNLESS ¬β tracking)

⚠️ **Partially Implemented:**
- Legal moves (no API endpoint yet)
- Plexus (cross-room claim linking exists, no network view)
- Hom-sets (buildAifSubgraphForArgument builds single arg, not set)

❌ **Missing:**
- DDF eight stages
- Commitment stores
- Embedded dialogues
- Sentence type ontology (Action/Goal/Constraint/etc.)
- Ludic daimon protocol
- Culprit set computation

---

## 🔗 Integration Map: How Theories Connect to Code

```
┌─────────────────────────────────────────────────────────┐
│         DDF PROTOCOL LAYER (Missing)                    │
│  • Eight stages (Open/Inform/Propose/.../Close)         │
│  • Six sentence types (Action/Goal/Constraint/etc.)     │
│  • Locutions (assert/ask_justify/move/retract/etc.)    │
│  • Commitment stores (per-participant public state)     │
│  • Embedded dialogue spawning                           │
└─────────────────────────────────────────────────────────┘
                        ↓ uses
┌─────────────────────────────────────────────────────────┐
│         ARGUMENTATION LAYER (Partial)                   │
│  lib/aif/types.ts                                       │
│    • I/L/RA/CA/PA/TA nodes (✅ AIF 2014)               │
│    • EdgeType roles (✅)                                │
│  lib/aif/translation/aifToAspic.ts                      │
│    • ArgumentationTheory (✅ ASPIC+)                    │
│    • Contraries, rules, preferences (✅)                │
│  lib/arguments/diagram.ts                               │
│    • buildAifSubgraphForArgument (✅)                   │
│    • AssumptionUse → has-presumption/exception (✅)     │
│  lib/client/aifApi.ts                                   │
│    • CRUD, CQ lifecycle, attack posting (✅)            │
└─────────────────────────────────────────────────────────┘
                        ↓ uses
┌─────────────────────────────────────────────────────────┐
│         BELIEF/CONFIDENCE LAYER (Minimal)               │
│  rulesetJson.confidence.mode                            │
│    • min (weakest link) (✅)                            │
│    • product (independent reinforcement) (✅)           │
│    • ds (Dempster-Shafer) (⚠️ stub only?)              │
│  MISSING:                                               │
│    • Topological argumentation model                    │
│    • Grounded belief computation                        │
│    • Vacuity/dissonance tracking                        │
│    • DST combination rules                              │
│    • Fuzzy support                                      │
└─────────────────────────────────────────────────────────┘
                        ↓ uses
┌─────────────────────────────────────────────────────────┐
│         CATEGORICAL SEMANTICS LAYER (Missing)           │
│  NEEDED:                                                │
│    • Hom-set materialization (ArgumentSupport table)    │
│    • Join operation (∨) for argument accrual            │
│    • Composition (∘) for chaining inferences            │
│    • Internal hom [A,B] as first-class object           │
│    • Functorial translation (syntax → semantics)        │
│    • DisCoCat for NLP (claim similarity)                │
└─────────────────────────────────────────────────────────┘
                        ↓ uses
┌─────────────────────────────────────────────────────────┐
│         DATABASE (Prisma)                               │
│  Claim, Argument, ArgumentPremise (✅)                  │
│  ConflictApplication, PreferenceApplication (✅)        │
│  AssumptionUse (✅)                                     │
│  ArgumentScheme (✅)                                    │
│  CriticalQuestion (✅)                                  │
│  MISSING:                                               │
│    • SentenceType table (Action/Goal/Constraint/etc.)  │
│    • CommitmentStore table                              │
│    • DialogueStage tracking                             │
│    • ArgumentSupport (hom-sets)                         │
└─────────────────────────────────────────────────────────┘
```

---

## ❌ Critical Gaps Revealed by Foundational Research

### Gap 1: No DDF Protocol Implementation

**What's Missing:**
- Eight-stage dialogue lifecycle
- Sentence type ontology (6 types)
- Locutions (assert/ask_justify/move/retract/prefer/withdraw)
- Commitment stores
- Embedded dialogue protocol
- Unanimity confirmation (CONFIRM stage)

**Impact:**
- Current deliberations are **unstructured** (no INFORM → PROPOSE → CONSIDER → REVISE flow)
- No separation between facts/goals/constraints/actions/evaluations/perspectives
- No formal recommendation protocol (move(.) locution)
- No joint decision mechanism

**Fix Complexity:** **High** (requires new database models + API + UI)

---

### Gap 2: No Topological Argumentation Model

**What's Missing:**
- Topology τ on evidence sets
- Attack graph A_τ = (τ, ≺)
- Characteristic function d_τ
- Grounded extension LFP_τ
- Grounded belief operator BP

**Impact:**
- Confidence scoring may **violate closure properties**
- Cannot distinguish acceptable evidence from unacceptable
- No formal belief revision mechanism

**Fix Complexity:** **Medium** (computational, can layer on existing AIF)

---

### Gap 3: No Sentence Type Ontology

**What's Missing:**
```prisma
model SentenceType {
  id    String @id @default(cuid())
  kind  SentenceKind  // Action | Goal | Constraint | Perspective | Fact | Evaluation
  // ... rest of fields
}

enum SentenceKind {
  ACTION
  GOAL
  CONSTRAINT
  PERSPECTIVE
  FACT
  EVALUATION
}
```

**Impact:**
- Cannot implement DDF properly
- Cannot distinguish practical reasoning (actions) from theoretical (facts)
- Value-Based Practical Reasoning scheme cannot be formalized

**Fix Complexity:** **Medium** (schema migration + UI updates)

---

### Gap 4: No Commitment Store

**What's Missing:**
```prisma
model CommitmentStore {
  id              String @id @default(cuid())
  userId          String
  deliberationId  String
  assertions      Assertion[]  // What user has publicly asserted
  retractions     Retraction[] // What user has retracted
}

model Assertion {
  id           String @id @default(cuid())
  storeId      String
  sentenceType SentenceKind
  sentenceId   String
  timestamp    DateTime
}
```

**Impact:**
- Cannot track individual participant positions
- No ask_justify → retract protocol
- Cannot implement burden of proof shifting

**Fix Complexity:** **High** (new concept, requires protocol design)

---

### Gap 5: Incomplete Belief Theory Integration

**What's Missing:**
- DST belief mass computation
- PCR5/PCR6 fusion rules (DSmT)
- Vacuity tracking
- Dissonance resolution
- Fuzzy membership degrees

**Current State:**
- `rulesetJson.confidence.mode` exists but only min/product work
- "ds" mode likely a stub

**Impact:**
- Cannot handle highly conflicting evidence properly
- No explicit ignorance modeling
- Limited uncertainty quantification

**Fix Complexity:** **High** (requires mathematical libraries + testing)

---

### Gap 6: No Ludics Formalization

**What's Missing:**
- Paraproof interaction model
- Daimon (†) rules (when does dialogue branch close?)
- Denegation as interactive opposition
- Legal moves computed from interaction state

**Impact:**
- Close/daimon symbol used informally (not precise rules)
- No formal model of dialogue failure
- Legal moves API would be ad-hoc

**Fix Complexity:** **High** (theoretical, requires ludics expertise)

---

### Gap 7: No Haskell/Agda Verification

**What's Missing:**
- Functional implementations (Haskell)
- Machine-checkable proofs (Agda/Coq)
- Property-based testing (QuickCheck-style)

**Impact:**
- Cannot guarantee correctness of:
  - AIF translation to ASPIC+
  - Grounded extension computation
  - Confidence aggregation
  - Argument accrual

**Fix Complexity:** **Very High** (long-term research project)

---

## ✅ Strengths: What Mesh Already Has Right

### 1. **AIF Standard Compliance (100%)**
- Full I/L/RA/CA/PA/TA node support
- Correct edge roles
- AIF JSON-LD export/import

### 2. **ASPIC+ Translation**
- Converts AIF → ArgumentationTheory
- Contraries, strict/defeasible rules, preferences
- Partial assumption support (needs completion)

### 3. **Critical Question System**
- Scheme-specific CQs
- Open/resolve/close lifecycle
- Stored as JSON

### 4. **Argument Schemes**
- ArgumentScheme table
- facets for classification
- Scheme keys for lookup

### 5. **Conflict & Preference Support**
- ConflictApplication (CA-nodes)
- PreferenceApplication (PA-nodes)
- Attack type tracking (REBUTS/UNDERCUTS/UNDERMINES)

### 6. **AssumptionUse Integration**
- has-presumption / has-exception edges
- Partial export to AIF
- Aligns with UNLESS ¬β in defeasible rules

### 7. **Multi-Argument Neighborhood Expansion**
- buildAifNeighborhood with depth limiting
- Edge type filters
- Circuit breaker (maxNodes)

---

## 🎯 Recommendations: Aligning Mesh with Foundational Research

### Phase 0: Quick Wins (1-2 weeks)

1. **Add QuickCheck-style property tests**
   - Test grounded extension uniqueness
   - Test conflict-free property
   - Test defense property

2. **Document confidence modes**
   - Which modes are actually implemented?
   - What does "ds" mode do currently?
   - Add unit tests for each mode

3. **Add sentence type tags**
   - Add `sentenceType` field to Claim (enum: FACT | ACTION | GOAL | etc.)
   - Start tagging existing claims
   - No protocol changes yet, just categorization

---

### Phase 1: Categorical Foundations (1-2 months)

4. **Implement hom-set materialization**
   ```prisma
   model ArgumentSupport {
     id              String @id @default(cuid())
     fromClaimId     String
     toClaimId       String
     argumentIds     String[]  // All args supporting from → to
     confidence      Float?    // Join of argument strengths
   }
   ```

5. **Add targetInferenceId to ConflictApplication**
   - Pinpoint which inference step is attacked
   - Enable internal hom [A,B] as first-class

6. **Implement join (∨) operation**
   ```typescript
   function joinArguments(
     args: string[],
     mode: 'min' | 'product' | 'ds'
   ): { confidence: number; composition: AifSubgraph }
   ```

---

### Phase 2: DDF Protocol (2-3 months)

7. **Create sentence type models**
   - Action, Goal, Constraint, Perspective, Fact, Evaluation
   - Migrate existing Claims to typed sentences

8. **Implement commitment stores**
   - CommitmentStore, Assertion, Retraction models
   - API: getCommitments(userId, deliberationId)

9. **Add dialogue stage tracking**
   ```prisma
   model Deliberation {
     // ... existing fields
     currentStage  DialogueStage  // OPEN | INFORM | PROPOSE | ...
     stageHistory  Json[]
   }
   ```

10. **Implement locutions API**
    - POST /api/deliberations/[id]/assert
    - POST /api/deliberations/[id]/ask_justify
    - POST /api/deliberations/[id]/move
    - POST /api/deliberations/[id]/retract

---

### Phase 3: Belief Theory Integration (2-3 months)

11. **Implement topological argumentation model**
    - Evidence = open sets (claims)
    - Topology = how evidence combines
    - Attack graph A_τ
    - Grounded belief computation

12. **Complete DST implementation**
    - Belief mass calculation
    - Dempster's rule of combination
    - Plausibility measures

13. **Add vacuity/dissonance tracking**
    - Compute vacuity per claim (lack of evidence)
    - Compute dissonance (conflicting evidence)
    - Display in UI

---

### Phase 4: Verification & Testing (Ongoing)

14. **Property-based testing suite**
    - Generate random argument graphs
    - Test AF properties (conflict-free, admissible, etc.)
    - Test translation correctness (AIF → ASPIC+)

15. **Formal specification documentation**
    - Document each module's formal semantics
    - LaTeX specs for core algorithms
    - Proof sketches for key properties

16. **Long-term: Agda formalization**
    - Formalize ArgumentationTheory in Agda
    - Prove correspondence with Dung AF
    - Machine-check verification

---

### Phase 5: NLP & Categorical Semantics (3-4 months)

17. **DisCoCat integration**
    - Install DisCoPy library
    - Implement claim similarity via functorial semantics
    - Use pregroup grammar parsing

18. **Functorial translation interface**
    - Abstract functor: Syntax → Semantics
    - Pluggable backends (vector/logical/relational)

19. **Argument mining pipeline**
    - Classify schemes from natural language
    - Extract premises/conclusion
    - Suggest CQs automatically

---

### Phase 6: Ludics & Advanced Dialogue (4-6 months)

20. **Formalize daimon (†) rules**
    - When does dialogue branch close?
    - Compute legal moves from interaction state
    - Implement ludic negation (denegation)

21. **Embedded dialogue protocol**
    - Spawn persuasion sub-dialogue on ask_justify
    - Track sub-dialogue state
    - Return result to parent dialogue

22. **Legal moves API**
    - GET /api/deliberations/[id]/legal-moves
    - Compute from current stage + commitment stores
    - Return: [WHY, GROUNDS, CLOSE, MOVE, etc.]

---

## 📊 Alignment Metrics: Current vs Target

| Component | Current | Target | Gap |
|-----------|---------|--------|-----|
| **AIF Standard** | 100% | 100% | ✅ None |
| **ASPIC+ Translation** | 75% | 100% | ⚠️ Assumptions |
| **DDF Protocol** | 0% | 100% | ❌ Complete |
| **Sentence Types** | 0% | 100% | ❌ Complete |
| **Commitment Stores** | 0% | 100% | ❌ Complete |
| **Topological Belief** | 0% | 100% | ❌ Complete |
| **DST Implementation** | 10% | 100% | ❌ Stub only |
| **Hom-Set Materialization** | 0% | 100% | ❌ Complete |
| **Categorical Join (∨)** | 0% | 100% | ❌ Complete |
| **Internal Hom [A,B]** | 30% | 100% | ⚠️ No targetInferenceId |
| **DisCoCat NLP** | 0% | 100% | ❌ Complete |
| **Ludics Formalization** | 5% | 100% | ❌ Informal only |
| **Verification (Tests)** | 20% | 100% | ⚠️ No property tests |
| **Formal Proofs (Agda)** | 0% | 80% | ❌ Long-term |

**Overall Categorical Alignment: ~25% → Target: 100%**

---

## 🔍 Key Insights for Chunk 2 Review

### Questions to Ask When Reviewing lib/client/evidential.ts:

1. **Does it implement join (∨)?**
   - Look for: Functions that combine multiple arguments
   - Expected: Union or aggregation over argument sets

2. **Does it implement composition (∘)?**
   - Look for: Chaining arguments (A→B, B→C ⇒ A→C)
   - Expected: Transitive closure or path composition

3. **What confidence modes are actually implemented?**
   - "min" (weakest link)
   - "product" (independent)
   - "ds" (Dempster-Shafer) - is this real or stub?

4. **Is there hom-set computation?**
   - Look for: Functions that collect all arguments from A→B
   - Expected: `hom(A, B): string[]` returning argument IDs

5. **Is there grounded belief computation?**
   - Look for: Fixed-point iteration
   - Expected: LFP_τ or grounded extension calculation

6. **How does it integrate with rulesetJson?**
   - Does it read `rulesetJson.confidence.mode`?
   - Does it apply rules correctly?

### Questions for lib/agora/:

1. **Is there DDF protocol logic?**
   - Dialogue stage transitions?
   - Locution validation?

2. **Is there commitment store management?**
   - Tracking participant assertions?

3. **Is there plexus/cross-room logic?**
   - Canonical claim linking?
   - Graph-of-graphs construction?

---

## 📝 Summary: Foundational Research → Implementation Roadmap

**What We Learned:**

1. **DDF provides the protocol** Mesh should implement for deliberation
   - Eight stages, six sentence types, commitment stores, embedded dialogues

2. **Topological argumentation** gives formal semantics for belief
   - Grounded belief via fixed-point, closure failure, evidence combination

3. **Verification frameworks** (Haskell/Agda) show how to ensure correctness
   - Property-based testing, machine-checkable proofs

4. **Argumentation schemes** are semi-formal patterns with CQs
   - Should add VPR scheme, generalize CQ system to ask_justify

5. **Categorical semantics** unifies everything
   - Functorial translation, DisCoCat for NLP, hom-sets for argument accrual

6. **Ludics** formalizes interaction and dialogue dynamics
   - Daimon (†) for failure, legal moves from interaction state

**Current Mesh Status:** ~25% categorical alignment
- ✅ AIF/ASPIC+ foundation solid
- ⚠️ Confidence/belief theory partial
- ❌ DDF protocol missing
- ❌ Categorical operations missing
- ❌ Verification missing

**Strategic Path Forward:**
1. Phase 0: Quick wins (tests, docs)
2. Phase 1: Categorical foundations (hom-sets, join, composition)
3. Phase 2: DDF protocol (stages, sentence types, commitment stores)
4. Phase 3: Belief theory (topological model, DST, vacuity/dissonance)
5. Phase 4: Verification (property tests, formal specs)
6. Phase 5: NLP (DisCoCat, functorial semantics)
7. Phase 6: Ludics (daimon rules, legal moves, embedded dialogues)

**Next Step:** Review Chunk 2A (lib/client/evidential.ts, lib/agora/) to see what's already implemented toward these goals.

---

## 🔗 Cross-References

- **Chunk 1A Review:** AIF Core Types & Translation (CHUNK_1A_AIF_Core_Types_Translation.md)
- **Chunk 1B Review:** Argument Graph Primitives (CHUNK_1B_Argument_Graph_Primitives.md)
- **Ambler's Categorical Framework:** (metastructuredocs/MeshCategoricalStructure.txt)
- **AIF OWL Ontology:** (metastructuredocs/AIFOWL.txt)
- **Category Theory Roadmap:** (metastructuredocs/CategoryTheoryRoadmap.txt)

---

**End of Foundational Research Synthesis**
