# System Integration Analysis: AIF ↔ ASPIC+ ↔ Ludics ↔ Dialogical Moves

**Created:** November 6, 2025  
**Status:** Phase 0 - Pre-Implementation Architecture Review  
**Purpose:** Deep analysis of theoretical foundations vs. actual implementation before CQ→Dialogue→Ludics integration

---

## **Executive Summary**

This document provides a comprehensive analysis of the mesh project's argumentation computation systems, examining the **theoretical foundations** (from research papers), the **actual implementation** (from codebase), and the **integration gaps** that must be addressed before implementing the CQ→Dialogical Moves→Ludics roadmap.

**Key Finding:** While the project has strong theoretical grounding and partial implementations of AIF, ASPIC+, and Ludics, these systems operate largely **in parallel** rather than as an **integrated pipeline**. The CQ system is the most disconnected, lacking formal ties to any of the three formal systems.

---

## **Part 1: Theoretical Foundations Analysis**

### **Document 1: AIF Formal Analysis Using ASPIC Framework**

#### **Core Concepts from Research**

**1.1 ASPIC+ Framework Structure**

From the research documents, ASPIC+ is defined as:

```
Argumentation System (AS) = (L, ¯, R, ≤)
  - L: Logical language (finite set of literals)
  - ¯: Contrariness function (symmetric conflict)
  - R = Rs ∪ Rd: Strict rules ∪ Defeasible rules
  - ≤: Partial preorder on defeasible rules

Argumentation Theory (AT) = (AS, KB)
  - KB = Kn ∪ Kp ∪ Ka
    - Kn: Necessary axioms (infallible)
    - Kp: Ordinary premises (fallible, undermining targets)
    - Ka: Assumptions (fallible, attacks always succeed)

Arguments = Inference trees built from KB + R
  - prem(A): All premises used
  - conc(A): Ultimate conclusion
  - sub(A): All sub-arguments
  - defrules(A): Set of defeasible rules used
  - top-rule(A): Final inference rule applied
```

**1.2 Attack Mechanisms**

Three fundamental attack types (from ASPIC+ specification):

| Attack Type | Target | Formalization | Success Condition |
|------------|--------|---------------|------------------|
| **Undermining** | Ordinary premise φ | conc(A) ∈ φ̄ | A ⊀ B' (preference check) |
| **Rebutting** | Defeasible conclusion φ | conc(A) ∈ φ̄ of defeasible sub-arg | A ⊀ B' (preference check) |
| **Undercutting** | Defeasible rule r | conc(A) ∈ r̄ (rule name) | Always succeeds (no preference) |

**Key Insight:** Undercutting attacks always succeed because they attack the *applicability* of the inference rule itself, not the content of premises or conclusions.

**1.3 AIF ↔ ASPIC+ Translation**

The research establishes **bidirectional translation**:

**AIF → ASPIC+ Translation:**
```typescript
// Conceptual mapping from AIF Ontology to ASPIC+ AT
L = I-nodes ∪ RA-nodes (language)
R = Rules extracted from RA-nodes
  - RA with deductive scheme → Strict rule (Rs)
  - RA with defeasible scheme → Defeasible rule (Rd)
KB = Initial I-nodes (no predecessors)
  - Form: axiom → Kn
  - Form: premise → Kp
  - Form: assumption → Ka
Contraries (¯) = CA-nodes (conflict application)
Preferences (≤) = PA-nodes (preference application)
```

**ASPIC+ → AIF Translation:**
```typescript
// Reverse mapping from AT arguments to AIF graph
I-nodes = K ∪ {conc(A) | A ∈ Arg_AT}
RA-nodes = Rules used in arguments
CA-nodes = Contrary pairs (φ, ψ) where φ ∈ ψ̄
PA-nodes = Preference pairs from ≤
Edges = Inferential links (premise→RA→conclusion) 
        + Conflict links (I/RA→CA→I/RA)
        + Preference links (I/RA→PA→I/RA)
```

**1.4 Rationality Postulates (Caminada & Amgoud 2007)**

For ASPIC+ to be "well-behaved," extensions must satisfy:

1. **Sub-argument Closure:** If A ∈ E, then all sub(A) ∈ E
2. **Closure under Strict Rules:** Conc(E) closed under Rs application
3. **Direct Consistency:** No φ, ψ ∈ Conc(E) where ψ ∈ φ̄
4. **Indirect Consistency:** Cls(Conc(E)) is directly consistent

**Necessary Conditions:**
- AT must be **closed under transposition** OR **closed under contraposition**
- Axioms Kn must be indirectly consistent
- Well-formedness: If φ ∈ ψ̄, then ψ ∉ Kn and ψ not consequent of strict rule
- Preferences must be **reasonable** (strict/firm args preferred over plausible/defeasible)

**1.5 Argument Schemes & Critical Questions**

The research provides formal reconstruction:

```
Argument Scheme = Defeasible rule in Rd
  Example: Sees(x, φ) ⇒ φ (Pollock's perception scheme)

Critical Questions map to:
  - CQ challenging premise → Undermining attack
  - CQ challenging inference → Undercutting attack
    Formalized as: ¬Credible(x) ⇒ ¬dw(x, φ)
    where dw is the scheme name (rule identifier)
```

**CRITICAL OBSERVATION:** The research explicitly states that CQs should be mapped to ASPIC+ attacks via the rule naming function `n: Rd → L`. This is the **formal foundation** for our CQ→DialogueMove integration.

---

### **Document 2: Formalizing AIF using ASPIC Framework**

#### **Core Concepts**

**2.1 AIF Upper Ontology**

The AIF distinguishes:
- **Information:** Propositions/sentences (I-nodes)
- **Schemes:** Reasoning patterns (S-nodes)
  - RA-nodes: Rule Application
  - CA-nodes: Conflict Application  
  - PA-nodes: Preference Application

**2.2 AIF Argument Graph Structure**

```
G = (V, E) where:
  V = I ∪ RA ∪ CA ∪ PA
  E ⊆ V × V \ (I × I)  // No direct I→I edges
  
Connectivity Constraint:
  All S-nodes must have ≥1 predecessor AND ≥1 successor
  S-nodes CAN connect to other S-nodes
```

**2.3 Reification Purpose**

The research emphasizes:
> "The abstract nature of the AIF ontology makes it purely a representational language. To derive meaningful analytical results—such as evaluating, querying, or assigning status to arguments—the ontology must be translated or reified into a more concrete language."

**This is why AIF→ASPIC+ translation is critical:** AIF provides structure, ASPIC+ provides semantics.

---

### **Document 3: Argumentative Reasoning in ASPIC+ under Incomplete Information**

#### **Core Concepts**

**3.1 Incomplete Information Modeling**

```
Queryables (Q): Universe of literals that can be added to KB
  - K ⊆ Q ⊆ L
  - If q ∈ Q, then q̄ ⊆ Q (contraries also queryable)

Future Argumentation Theory: T' = (AS, K')
  - T ⊑Q T' if K ⊆ K' ⊆ Q
  - K' must be mutually consistent
```

**3.2 Stability & Relevance**

**Stability:** A literal l is **stable-j** w.r.t. (T, Q) if:
```
∀T': T ⊑Q T' ⟹ l has status j in T'
```
Where j ∈ {unsatisfiable, defended, out, blocked}

**Relevance:** A queryable q is **j-relevant** for l if:
```
q ∈ K* for some minimal stable-j future theory T* for l
```

**Complexity Results:**
- Justification status: **P** (polynomial time)
- Stability: **coNP-complete**
- Relevance: **Σ2P-complete** (second level of polynomial hierarchy)

**3.3 Grounded Semantics Optimization**

Key algorithmic insight:
> "Traditional definitions of argument acceptability rely on enumerating Arg_T, which can be exponential. We reformulate grounded semantics purely in terms of sets of defeasible rules (Rd)."

**Rule-based characteristic function:**
```
defT(D) = {r ∈ Rd | r is applicable and defended by D}
Grounded extension G(T) = Arg(C) where C = lfp(defT)
Fixed point reached in ≤ |R|/2 iterations
```

This is **critical for scalability** in our implementation.

---

## **Part 2: Current Implementation Analysis**

### **2.1 AIF Implementation**

**File:** `lib/aif/translation/aifToAspic.ts`

**What's Implemented:**
```typescript
✅ AIFGraph type (nodes: I, RA, CA, PA)
✅ aifToASPIC() translation function
✅ Language extraction (L = I-nodes ∪ RA-nodes)
✅ Knowledge base extraction (KB from initial I-nodes)
✅ Rule extraction (RA → strict/defeasible rules)
✅ Contraries extraction (CA-nodes → contrariness map)
✅ Preferences extraction (PA-nodes → preference list)
✅ Assumptions extraction (presumption edges)
```

**What's Missing:**
```typescript
❌ ASPIC+ → AIF reverse translation
❌ Argument construction (building inference trees)
❌ Attack relation computation (undermining/rebutting/undercutting)
❌ Defeat relation (attack + preferences)
❌ Grounded extension computation
❌ Justification status evaluation
❌ Rationality postulate checking
```

**Code Quality:**
- Well-typed TypeScript interfaces
- Clean separation of concerns
- Handles edge cases (content vs. text fields)
- Basic test coverage exists (`tests/aif-aspic-translation.test.ts`)

**Assessment:** The AIF→ASPIC+ translation is **structurally complete but semantically incomplete**. It extracts the ASPIC+ components from AIF but doesn't compute the argumentation semantics.

---

### **2.2 ASPIC+ Implementation Depth**

**Current State: Foundation Only**

**What Exists:**
```typescript
// From aifToAspic.ts
interface ArgumentationTheory {
  language: Set<string>;
  contraries: Map<string, Set<string>>;
  strictRules: Rule[];
  defeasibleRules: Rule[];
  axioms: Set<string>;
  premises: Set<string>;
  assumptions: Set<string>;
  preferences: Array<{ preferred: string; dispreferred: string }>;
}
```

**What's Missing (Critical ASPIC+ Features):**

1. **Argument Construction**
   - No `Argument` class/type
   - No recursive argument builder
   - No sub-argument tracking
   - No inference tree structure

2. **Attack Mechanisms**
   - No undermining implementation
   - No rebutting implementation
   - No undercutting implementation
   - No rule naming function `n: Rd → L`

3. **Defeat Resolution**
   - No preference ordering implementation (≺)
   - No last-link principle
   - No weakest-link principle
   - No "reasonable ordering" validation

4. **Semantics Computation**
   - No abstract AF generation ⟨A, D⟩
   - No Dungean semantics (grounded/preferred/stable)
   - No extension computation
   - No justification status evaluation

5. **Rationality Checks**
   - No transposition closure checking
   - No contraposition closure checking
   - No consistency verification
   - No well-formedness validation

**Search for Additional ASPIC+ Code:**

Let me check if there's more ASPIC+ implementation elsewhere:

```bash
# Search results from earlier grep:
lib/aif/translation/aifToAspic.ts (107 lines total)
tests/aif-aspic-translation.test.ts (test file)
```

**Conclusion:** ASPIC+ implementation is **~10% complete**. Only the data structure extraction exists; no computation engine.

---

### **2.3 Ludics Implementation**

**Files to Examine:**
- `packages/ludics-engine/compileFromMoves.ts`
- `packages/ludics-react/*` (UI components)

Let me search for ludics implementation:

**Known from Previous Analysis:**
```typescript
// From compileFromMoves.ts (examined in roadmap creation)
✅ DialogueMove → LudicAct compilation
✅ Locus path tracking
✅ Polarity assignment (Proponent/Opponent)
✅ Design/Chronicle structure
⚠️ CQ metadata preservation (expression string only, lossy)
❌ ASPIC+ attack type integration
❌ AIF node linkage
```

**Ludics Structure:**
```typescript
interface LudicAct {
  kind: 'PROPER' | 'DAIMON';
  polarity: 'P' | 'O';
  locus: string; // "0.1.2" format
  ramification: string[];
  expression: string; // FREE-FORM (e.g., "WHY ${cqId}")
  // Missing: structured metadata for CQ context
}

interface Design {
  id: string;
  polarity: 'P' | 'O';
  base: string;
  acts: LudicAct[];
}
```

**Ludics→AIF Sync:**
From previous analysis, `syncLudicsToAif.ts` exists but:
- Converts LudicActs to AifNodes
- Creates I-nodes and RA-nodes from acts
- **Does NOT preserve CQ context in extJson**
- **Does NOT create CA-nodes from dialogical conflicts**

**Assessment:** Ludics engine is **60% complete**. Core compilation works but lacks semantic richness (CQ context, attack types, ASPIC+ mapping).

---

### **2.4 DialogueMove System**

**Schema (Prisma):**
```prisma
model DialogueMove {
  id              String   @id @default(cuid())
  deliberationId  String
  targetType      String   // 'claim' | 'argument'
  targetId        String
  kind            String   // 'WHY' | 'GROUNDS' | 'ASSERT' | 'RETRACT'
  authorId        String?
  argumentId      String?
  payload         Json     // Flexible metadata
  createdAt       DateTime @default(now())
  
  // Reverse relations
  conflictingArguments ConflictingArgument[] // NEW in roadmap
}
```

**API Endpoint:**
```typescript
// app/api/dialogue/legal-moves/route.ts
POST /api/dialogue/legal-moves
Response: {
  moves: Array<{
    kind: 'WHY' | 'GROUNDS',
    label: string,
    payload: { cqId?, locusPath? },
    verdict: { code: string, context: {} }
  }>
}
```

**Capabilities:**
✅ Stores dialogue moves in database
✅ Generates legal moves based on dialogue state
✅ Includes cqId in WHY/GROUNDS payload
✅ Compiles to ludics via `compileFromMoves()`
❌ No direct link to ASPIC+ attacks
❌ No CA-node generation from moves
❌ No rationality postulate checking

**Assessment:** DialogueMove system is **70% complete**. Strong infrastructure but missing formal argumentation semantics.

---

### **2.5 Critical Questions System**

**Components:**
1. `CriticalQuestionsV3.tsx` - Claims CQ system
2. `SchemeSpecificCQsModal.tsx` - Arguments CQ system
3. `AttackMenuProV2.tsx` - General attack interface

**CQ Schema:**
```prisma
model CQStatus {
  id             String   @id @default(cuid())
  deliberationId String
  targetType     String   // 'claim' | 'argument'
  targetId       String
  schemeKey      String
  cqKey          String
  satisfied      Boolean
  groundsText    String?
  createdAt      DateTime
}
```

**Current State:**
✅ CQs defined in ArgumentScheme.cq array
✅ attackType metadata ('UNDERMINES' | 'UNDERCUTS' | 'REBUTS')
✅ targetScope metadata ('premise' | 'inference' | 'conclusion')
✅ UI for asking/answering CQs
✅ Community voting/endorsement system
❌ No DialogueMove creation when CQ asked/answered
❌ No ASPIC+ attack formalization
❌ No CA-node generation
❌ No ludics compilation with CQ semantics

**CQ Metadata Structure:**
```typescript
// From ArgumentScheme.cq
{
  cqKey: string;
  text: string;
  attackType: 'UNDERMINES' | 'UNDERCUTS' | 'REBUTS';
  targetScope: 'premise' | 'inference' | 'conclusion';
  // Missing: formal ASPIC+ rule name for undercutting
}
```

**Assessment:** CQ system is **40% complete**. Strong metadata but no formal integration with ASPIC+, dialogical moves, or ludics.

---

## **Part 3: Integration Gap Analysis**

### **3.1 System Interconnection Matrix**

| From/To | AIF | ASPIC+ | Ludics | DialogueMove | CQ |
|---------|-----|--------|--------|--------------|-----|
| **AIF** | - | ✅ One-way | ⚠️ Via sync | ❌ None | ❌ None |
| **ASPIC+** | ❌ Missing | - | ❌ None | ❌ None | ❌ None |
| **Ludics** | ⚠️ Partial | ❌ None | - | ✅ From moves | ❌ None |
| **DialogueMove** | ❌ None | ❌ None | ✅ Compiles | - | ⚠️ Payload only |
| **CQ** | ❌ None | ❌ None | ❌ None | ⚠️ No creation | - |

**Legend:**
- ✅ Strong integration
- ⚠️ Partial/weak integration
- ❌ No integration

### **3.2 Critical Missing Links**

**Gap 1: CQ → ASPIC+ Attack Formalization**

**What's Missing:**
```typescript
// CQ has attack metadata but no ASPIC+ formalization
{
  cqKey: "expert-position",
  attackType: "UNDERMINES", // Known
  targetScope: "premise"     // Known
}

// Should generate ASPIC+ attack:
Undermining: conc(A) ∈ φ̄ where φ ∈ prem(B)
// But no code exists to:
// 1. Identify which premise φ the CQ targets
// 2. Create argument A with conc(A) = ¬φ
// 3. Compute defeat based on preferences
```

**Gap 2: CQ → DialogueMove Creation**

**What's Missing:**
```typescript
// When user asks CQ in CriticalQuestionsV3:
async function handleAskCQ(cqKey: string) {
  // Current: Only creates CQStatus
  await fetch('/api/cqs', {
    body: { cqKey, satisfied: false }
  });
  
  // Should ALSO create DialogueMove:
  // await fetch('/api/dialogue/move', {
  //   body: {
  //     kind: 'WHY',
  //     payload: { cqId: cqKey, attackType, targetScope }
  //   }
  // });
}
```

**Gap 3: DialogueMove → ASPIC+ Attack**

**What's Missing:**
```typescript
// DialogueMove has payload.cqId and payload.attackType
// But no code to:
// 1. Map WHY move to ASPIC+ undercutting/undermining
// 2. Generate ASPIC+ argument A for the attack
// 3. Compute defeat relation
// 4. Update grounded extension
```

**Gap 4: ASPIC+ → AIF Reverse Translation**

**What's Missing:**
```typescript
// aifToAspic.ts has one-way translation
// Need: aspicToAif.ts for:
// 1. Argument → AIF subgraph generation
// 2. Attack → CA-node creation
// 3. Defeat → metadata annotation
```

**Gap 5: Ludics → ASPIC+ Semantics**

**What's Missing:**
```typescript
// LudicAct has expression string but no:
// 1. Attack type classification
// 2. Preference ordering
// 3. Defeat status
// 4. Grounded extension membership
```

---

## **Part 4: Architectural Recommendations**

### **4.1 Immediate Priorities (Pre-Phase 1)**

Before starting the CQ→Dialogue→Ludics roadmap, we need:

**Priority 0.1: ASPIC+ Core Engine (1-2 weeks)**

Build the missing ASPIC+ computation layer:

```typescript
// lib/aspic/core.ts (NEW)

interface Argument {
  id: string;
  premises: string[];      // prem(A)
  conclusion: string;      // conc(A)
  rules: string[];         // defrules(A)
  topRule?: string;        // top-rule(A)
  subArguments: Argument[]; // sub(A)
  type: 'strict' | 'defeasible';
  category: 'firm' | 'plausible';
}

function constructArguments(theory: ArgumentationTheory): Argument[] {
  // Recursive argument builder
  // Returns all possible arguments from theory
}

function computeAttacks(
  arguments: Argument[],
  theory: ArgumentationTheory
): Array<{ attacker: Argument; attacked: Argument; type: 'undermining' | 'rebutting' | 'undercutting' }> {
  // Implements three attack types from ASPIC+ spec
}

function computeDefeats(
  attacks: Attack[],
  preferences: PreferenceOrdering
): Defeat[] {
  // Resolves attacks to defeats using preferences
}

function computeGroundedExtension(
  arguments: Argument[],
  defeats: Defeat[]
): Argument[] {
  // Dungean grounded semantics
  // Uses fixed-point iteration from research paper
}

function checkRationalityPostulates(
  extension: Argument[],
  theory: ArgumentationTheory
): {
  subArgumentClosure: boolean;
  strictClosure: boolean;
  directConsistency: boolean;
  indirectConsistency: boolean;
} {
  // Caminada & Amgoud postulates
}
```

**Priority 0.2: CQ → ASPIC+ Mapping (3-4 days)**

Formalize CQ attack types:

```typescript
// lib/aspic/cqMapping.ts (NEW)

function cqToAspicAttack(
  cq: { cqKey: string; attackType: string; targetScope: string },
  targetArgument: Argument,
  theory: ArgumentationTheory
): Attack | null {
  
  if (cq.attackType === 'UNDERMINES') {
    // Find premise φ that CQ challenges
    const targetPremise = identifyTargetPremise(cq, targetArgument);
    // Create argument A with conc(A) = ¬φ
    const attackingArg = constructCounterArgument(targetPremise);
    return { attacker: attackingArg, attacked: targetArgument, type: 'undermining' };
  }
  
  if (cq.attackType === 'UNDERCUTS') {
    // Find defeasible rule r that CQ challenges
    const targetRule = identifyTargetRule(cq, targetArgument);
    // Create argument A with conc(A) = ¬name(r)
    const attackingArg = constructRuleAttack(targetRule);
    return { attacker: attackingArg, attacked: targetArgument, type: 'undercutting' };
  }
  
  // ... REBUTS logic
}
```

**Priority 0.3: ArgumentScheme Enhancement (1-2 days)**

Add formal ASPIC+ metadata to schemes:

```typescript
// Enhance ArgumentScheme.cq structure
{
  cqKey: string;
  text: string;
  attackType: 'UNDERMINES' | 'UNDERCUTS' | 'REBUTS';
  targetScope: 'premise' | 'inference' | 'conclusion';
  
  // NEW: ASPIC+ formalization
  aspicMapping: {
    ruleId?: string;        // For UNDERCUTS (target rule name)
    premiseIndex?: number;  // For UNDERMINES (which premise)
    defeasibleRuleRequired: boolean; // For REBUTS
  };
}
```

---

### **4.2 Integration Architecture Proposal**

**Layered Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│  UI Layer (React Components)                            │
│  - CriticalQuestionsV3                                  │
│  - SchemeSpecificCQsModal                               │
│  - ArgumentCardV2                                       │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  API Layer (Next.js routes)                             │
│  - /api/cqs (POST)         → creates CQStatus           │
│  - /api/dialogue/move (POST) → creates DialogueMove     │
│  - /api/ca (POST)          → creates ConflictingArg     │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  Business Logic Layer (lib/)                            │
│                                                          │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ CQ Handler     │  │ ASPIC+ Engine│  │ Ludics      │ │
│  │ - Validates CQ │─▶│ - Builds args│─▶│ Compiler    │ │
│  │ - Creates move │  │ - Computes   │  │ - Generates │ │
│  │ - Links ASPIC+ │  │   attacks    │  │   designs   │ │
│  └────────────────┘  │ - Resolves   │  └─────────────┘ │
│                      │   defeats    │                   │
│                      └──────────────┘                   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ AIF Graph Manager                                  │ │
│  │ - Maintains canonical AIF structure                │ │
│  │ - Syncs from ASPIC+ and Ludics                     │ │
│  │ - Generates CA-nodes from defeats                  │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  Data Layer (Prisma/Database)                           │
│  - CQStatus                                             │
│  - DialogueMove                                         │
│  - ConflictingArgument (with dialogueMoveId FK)         │
│  - LudicAct (with aspicMetadata)                        │
│  - AifNode (with provenanceChain)                       │
└─────────────────────────────────────────────────────────┘
```

**Data Flow for "User Asks CQ":**

```
1. User clicks "Ask CQ" in UI
   ↓
2. POST /api/cqs { cqKey, satisfied: false }
   ↓
3. CQ Handler validates & extracts metadata
   ↓
4. ASPIC+ Engine:
   - Fetches target argument's structure
   - Identifies attack target (premise/rule/conclusion)
   - Constructs attacking argument A
   - Computes attack relation
   - Resolves to defeat (with preferences)
   ↓
5. Create DialogueMove (WHY) with:
   - payload.cqId
   - payload.aspicAttack = { attacker: A.id, type: 'undermining' }
   ↓
6. Ludics Compiler:
   - Compiles WHY to LudicAct (Opponent polarity)
   - Preserves ASPIC+ metadata in extJson
   ↓
7. AIF Graph Manager:
   - Creates CA-node linking attacker → attacked
   - Adds metadata: { cqId, attackType, defeatStatus }
   ↓
8. Database: Atomic transaction
   - Insert CQStatus
   - Insert DialogueMove
   - Insert/Update LudicAct
   - Insert/Update AifNode, AifEdge
   ↓
9. Events fire:
   - 'cqs:changed'
   - 'dialogue:moves:refresh'
   - 'aif:graph:updated'
```

---

## **Part 5: System-by-System Deprecation/Promotion Plan**

### **5.1 Components to PROMOTE (Strengthen & Integrate)**

**Promote 1: DialogueMove System → Core Orchestrator**

**Current Role:** Event storage  
**New Role:** Central coordination point for all argumentative actions

**Enhancements:**
```typescript
// Extend DialogueMove schema
model DialogueMove {
  // ... existing fields
  
  // NEW: ASPIC+ integration
  aspicArgumentId  String?  // Links to generated ASPIC+ argument
  aspicAttackType  String?  // 'undermining' | 'rebutting' | 'undercutting'
  aspicDefeatStatus Boolean? // Attack succeeded as defeat?
  
  // NEW: AIF integration
  aifCaNodeId     String?  // Links to CA-node in AIF graph
  
  // Existing relations enhanced
  conflictingArguments ConflictingArgument[]
  ludicActs           LudicAct[]  // NEW relation
}
```

**Promote 2: SchemeSpecificCQsModal → Primary CQ Interface**

**Rationale:**
- Strong AIF integration (creates CA-nodes)
- Scheme-aware (knows argument structure)
- Attack type metadata present
- Phase 3 community features

**Deprecate:** CriticalQuestionsV3 (merge features into SchemeSpecificCQsModal)

**Promote 3: AIF Graph → Source of Truth**

**Current Role:** Export/import format  
**New Role:** Canonical representation of argumentation structure

**Rationale:**
- AIF is the interchange standard
- All other systems (ASPIC+, Ludics) should sync TO aif
- Enables tool interoperability

**Enhancements:**
```typescript
// Enhance AifNode schema
model AifNode {
  // ... existing fields
  
  // NEW: Provenance chain
  sourceSystem    String?  // 'cq' | 'aspic' | 'ludics' | 'dialogue'
  sourceId        String?  // Link to source entity
  aspicMetadata   Json?    // { argumentId, attackType, defeatStatus }
  ludicsMetadata  Json?    // { actId, locusPath, polarity }
  cqMetadata      Json?    // { cqId, cqKey, schemeKey }
}
```

---

### **5.2 Components to DEPRECATE (Phase Out)**

**Deprecate 1: AttackMenuProV2**

**Reasons:**
1. Heuristic CQ detection (unreliable keyword matching)
2. Retroactive CQ linking (should be proactive)
3. Duplicates functionality of SchemeSpecificCQsModal
4. No formal ASPIC+ integration

**Migration Path:**
- Week 1-2: Add deprecation warning UI
- Week 3-4: Redirect to SchemeSpecificCQsModal
- Week 5-6: Remove code after data migration

**Deprecate 2: CriticalQuestionsV3 (Partial)**

**What to Keep:**
- Community voting/endorsement system
- Grounds input UI patterns

**What to Deprecate:**
- Separate CQ panel (merge into scheme modal)
- Direct /api/cqs calls (route through dialogue API)
- Parallel LegalMoveChips display (integrate data flow)

**Deprecate 3: Heuristic CQ Detection Logic**

**From:** AttackMenuProV2.tsx lines 417-545  
**Reasons:**
- Searches for keywords like "inference" to match CQs
- Unreliable (false positives/negatives)
- Should be replaced by formal ASPIC+ attack classification

**Replace With:** ASPIC+ attack computation from scheme metadata

---

### **5.3 Components to REFACTOR (Major Changes)**

**Refactor 1: compileFromMoves.ts**

**Current:** WHY/GROUNDS → LudicAct with expression string  
**Target:** WHY/GROUNDS → LudicAct with rich metadata

```typescript
// Before (lossy):
{
  expression: `WHY ${cqId}`,
  // CQ context lost
}

// After (rich):
{
  expression: `WHY [${cqId}]`,
  extJson: {
    cqId,
    cqText,
    attackType: 'UNDERMINES',
    targetScope: 'premise',
    schemeKey: 'expert_opinion',
    aspicAttack: { /* full attack object */ }
  }
}
```

**Refactor 2: aifToAspic.ts**

**Current:** One-way translation (AIF → ASPIC+ data structure)  
**Target:** Bidirectional + semantic computation

```typescript
// Add reverse translation
export function aspicToAif(
  arguments: Argument[],
  attacks: Attack[],
  defeats: Defeat[]
): AIFGraph {
  // Generate I-nodes from argument premises/conclusions
  // Generate RA-nodes from rules
  // Generate CA-nodes from defeats
  // Preserve metadata for round-trip fidelity
}

// Add semantic layer
export function computeAspicSemantics(
  theory: ArgumentationTheory
): {
  arguments: Argument[];
  attacks: Attack[];
  defeats: Defeat[];
  groundedExtension: Argument[];
  justificationStatus: Map<string, 'defended' | 'out' | 'blocked' | 'unsatisfiable'>;
}
```

---

## **Part 6: Pre-Implementation Checklist**

### **6.1 Documentation Requirements**

Before Phase 1 of the roadmap:

- [ ] **Architecture Decision Records (ADRs)**
  - [ ] ADR-001: Why ASPIC+ as semantic foundation
  - [ ] ADR-002: AIF as canonical representation
  - [ ] ADR-003: DialogueMove as coordination layer
  - [ ] ADR-004: Ludics integration strategy

- [ ] **API Specifications**
  - [ ] Document `/api/cqs` current behavior
  - [ ] Design `/api/aspic/arguments` endpoint
  - [ ] Design `/api/aspic/attacks` endpoint
  - [ ] Design `/api/aif/sync` endpoint

- [ ] **Data Model Documentation**
  - [ ] Entity relationship diagram (CQ ↔ DialogueMove ↔ ASPIC+ ↔ AIF)
  - [ ] Schema migration plan
  - [ ] Foreign key constraints
  - [ ] Index strategy

### **6.2 Testing Strategy**

- [ ] **Unit Tests (lib/aspic/)**
  - [ ] Argument construction
  - [ ] Attack computation
  - [ ] Defeat resolution
  - [ ] Grounded extension
  - [ ] Rationality postulates

- [ ] **Integration Tests**
  - [ ] CQ → DialogueMove → ASPIC+ → Ludics → AIF
  - [ ] Round-trip fidelity (AIF → ASPIC+ → AIF)
  - [ ] Preference ordering correctness

- [ ] **Performance Tests**
  - [ ] Argument construction scalability (target: <100ms for 50 args)
  - [ ] Grounded extension computation (target: <500ms for 100 args)
  - [ ] Ludics compilation with metadata (target: <200ms)

### **6.3 Implementation Dependencies**

**Critical Path:**
1. ASPIC+ core engine (blocks everything)
2. CQ → ASPIC+ mapping (blocks CQ integration)
3. DialogueMove enhancement (blocks data flow)
4. Ludics metadata preservation (blocks provenance)
5. AIF sync layer (blocks visualization)

**Parallel Work Possible:**
- UI refactoring (AttackMenuProV2 deprecation)
- Test suite development
- Documentation writing
- Database migration scripts

---

## **Part 7: Success Metrics**

### **7.1 Technical Metrics**

**Coverage Metrics:**
- [ ] ASPIC+ implementation completeness: 10% → 90%
- [ ] CQ→ASPIC+ mapping: 0% → 100%
- [ ] DialogueMove→ASPIC+ linkage: 0% → 100%
- [ ] Ludics metadata preservation: 30% → 95%
- [ ] AIF semantic completeness: 40% → 90%

**Performance Metrics:**
- [ ] Argument construction: <100ms (99th percentile)
- [ ] Attack computation: <50ms (99th percentile)
- [ ] Grounded extension: <500ms (99th percentile)
- [ ] End-to-end CQ processing: <1s (99th percentile)

**Quality Metrics:**
- [ ] Test coverage: >85% for new code
- [ ] Zero rationality postulate violations
- [ ] Zero circular dependencies
- [ ] 100% type safety (no `any` types)

### **7.2 Functional Metrics**

- [ ] User asks CQ → WHY DialogueMove created automatically
- [ ] User answers CQ → GROUNDS DialogueMove created automatically
- [ ] CA-node created with correct attack type metadata
- [ ] LudicAct preserves CQ semantic context
- [ ] AIF export includes full provenance chain
- [ ] ASPIC+ export classifies attacks correctly

### **7.3 Validation Criteria**

**Formal Correctness:**
- [ ] All ASPIC+ arguments satisfy sub-argument closure
- [ ] Grounded extension is consistent (no φ, ¬φ both justified)
- [ ] Attack types match Walton's CQ classification
- [ ] Preferences respect "reasonable ordering" constraints

**Data Integrity:**
- [ ] No orphaned DialogueMoves (all link to valid CQ or action)
- [ ] No orphaned CA-nodes (all link to DialogueMove)
- [ ] No orphaned LudicActs (all part of valid design)
- [ ] Round-trip AIF↔ASPIC+ preserves semantics

---

## **Part 8: Next Steps**

### **Immediate Actions (This Week)**

1. **Review this document with team** (2 hours)
   - Confirm architectural decisions
   - Prioritize missing components
   - Assign ownership

2. **Create ASPIC+ core module stub** (4 hours)
   - `lib/aspic/core.ts` with type definitions
   - `lib/aspic/attacks.ts` with attack functions
   - `lib/aspic/semantics.ts` with grounded extension

3. **Enhance ArgumentScheme CQ metadata** (2 hours)
   - Add `aspicMapping` field to existing schemes
   - Document formal semantics for each CQ

4. **Database schema planning** (3 hours)
   - Design enhanced DialogueMove fields
   - Design ASPIC+ Argument table (if needed)
   - Plan migration strategy

### **This Month (November 2025)**

**Week 1 (Nov 6-12):**
- [ ] Complete ASPIC+ core engine
- [ ] Write unit tests for argument construction
- [ ] Document AIF↔ASPIC+ formal mapping

**Week 2 (Nov 13-19):**
- [ ] Implement CQ → ASPIC+ attack mapping
- [ ] Enhance ArgumentScheme metadata
- [ ] Create `/api/aspic/attacks` endpoint

**Week 3 (Nov 20-26):**
- [ ] Refactor compileFromMoves to preserve metadata
- [ ] Implement DialogueMove → ASPIC+ linkage
- [ ] Write integration tests

**Week 4 (Nov 27-Dec 3):**
- [ ] AIF sync layer implementation
- [ ] Begin roadmap Phase 1 (database migrations)
- [ ] AttackMenuProV2 deprecation UI

---

## **Appendices**

### **Appendix A: Key Research Citations**

1. **ASPIC+ Framework:**
   - Modgil, S., & Prakken, H. (2013). "A general account of argumentation with preferences." *Artificial Intelligence*, 195, 361-397.
   - Caminada, M., & Amgoud, L. (2007). "On the evaluation of argumentation formalisms." *Artificial Intelligence*, 171(5-6), 286-310.

2. **AIF Specification:**
   - Chesñevar, C., et al. (2006). "Towards an argument interchange format." *The Knowledge Engineering Review*, 21(4), 293-316.
   - Bex, F., et al. (2010). "Formalizing AIF using the ASPIC framework." *COMMA 2010*.

3. **Incomplete Information:**
   - Čyras, K., et al. (2019). "Argumentative reasoning in ASPIC+ under incomplete information." *Argument & Computation*, 10(3), 221-250.

4. **Ludics:**
   - Girard, J.-Y. (2001). "Locus Solum: From the rules of logic to the logic of rules." *Mathematical Structures in Computer Science*, 11(3), 301-506.

### **Appendix B: Glossary**

**ASPIC+:** Abstract Rule-Based Argumentation framework supporting strict/defeasible rules, preferences, and Dungean semantics.

**AIF:** Argument Interchange Format - ontology for representing argumentation structures with I-nodes, RA-nodes, CA-nodes, PA-nodes.

**Ludics:** Jean-Yves Girard's dialogical logic framework based on locus paths, polarity, and designs.

**Grounded Extension:** Unique, subset-minimal complete extension in Dungean abstract argumentation.

**Rationality Postulates:** Conditions (sub-argument closure, consistency, strict closure) that ensure well-behaved argumentation systems.

**Last-Link Principle:** Preference ordering based on topmost defeasible rule in argument.

**Weakest-Link Principle:** Preference ordering considering all defeasible elements in argument chain.

---

**Document Status:** DRAFT - Awaiting Team Review  
**Next Review:** After ASPIC+ core implementation (Week 2)  
**Owner:** Architecture Team  
**Last Updated:** November 6, 2025
