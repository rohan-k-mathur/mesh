# Theoretical Foundations Synthesis: ASPIC+ and AIF Integration

**Date**: December 2024  
**Purpose**: Connect foundational research to current Mesh implementation  
**Focus**: Bridge theory → practice for Phase E-F implementation

---

## Executive Summary

This document synthesizes three foundational research papers to clarify the theoretical underpinnings of our ASPIC+ and AIF implementation in Mesh, providing guidance for the implementation roadmap outlined in `ASPIC_USER_INTERACTION_ANALYSIS.md`.

### Core Theoretical Insights

1. **ASPIC+ is a Metalevel Framework**: Arguments, rules, and preferences exist at the metalevel, not as object-level formulae in the logical language L
2. **AIF is a Structural Interlingua**: AIF provides the ontological structure (I-nodes, RA-nodes, CA-nodes) that gets translated to ASPIC+ for semantic evaluation
3. **Bidirectional Translation**: AIF ↔ ASPIC+ translation is well-defined and preserves semantic meaning
4. **Rationality Postulates**: Well-formed ASPIC+ systems satisfy consistency and closure properties when specific constraints are met

### Implementation Status Reality Check

**Our Current System:**
- ✅ Correctly implements AIF → ASPIC+ translation for I-nodes (premises/conclusions) and RA-nodes (inference rules)
- ✅ Constructs ASPIC+ arguments from database Arguments (premises + conclusion + defeasible rules)
- ✅ Computes grounded semantics (IN/OUT/UNDEC labeling)
- ❌ Missing CA-node translation (ConflictApplications → ASPIC+ attacks)
- ❌ Missing PA-node translation (preferences not yet in AIF graph)
- ❌ Missing distinctions: axioms vs premises, strict vs defeasible rules
- ❌ Missing assumptions (K_n) and contraries function

---

## Part 1: ASPIC+ Theoretical Foundations

### 1.1 Core Framework Components (from "Abstract Rule-Based Argumentation")

#### Argumentation System (AS) = (L, R, n)

**Logical Language (L):**
- Closed under classical negation (¬)
- In Mesh: Claims (text fields) serve as formulas in L
- Symmetric conflict: ψ = −ϕ (contradictories)
- Current implementation: Implicit language from Claim.text

**Inference Rules (R) = R_s ∪ R_d:**

1. **Strict Rules (R_s)**: Premises → Conclusion (deductive, non-defeasible)
   - **Theory**: "If premises hold, conclusion MUST hold"
   - **Rationality Requirement**: Must be closed under transposition or contraposition
   - **Mesh Status**: NOT IMPLEMENTED
   - **Current Behavior**: All RA-nodes become defeasible rules

2. **Defeasible Rules (R_d)**: Premises ⇒ Conclusion (presumptive, can be defeated)
   - **Theory**: "If premises hold, conclusion PRESUMED to hold"
   - **Mesh Status**: ✅ IMPLEMENTED via RA-nodes from Arguments
   - **Translation**: `app/api/aspic/evaluate/route.ts` (Line ~200)

**Naming Function (n: R_d → L):**
- Maps defeasible rules to wffs for undercutting attacks
- **Theory**: Enables attacks on rule applicability (not just conclusion)
- **Mesh Status**: ✅ IMPLEMENTED (RA-nodes have IDs used as names)

#### Knowledge Base (K) = K_n ∪ K_p ∪ K_a

**Three Ontological Categories:**

1. **Axioms (K_n)**: Necessary, indisputable premises
   - **Theory**: Cannot be attacked (undermining excluded)
   - **Rationality Requirement**: Must be indirectly consistent
   - **Mesh Status**: NOT IMPLEMENTED (no field to distinguish)
   - **Current Behavior**: All premises treated as K_p (ordinary premises)

2. **Ordinary Premises (K_p)**: Fallible, can be undermined
   - **Theory**: Default premise type, subject to undermining attacks
   - **Mesh Status**: ✅ IMPLEMENTED (all ArgumentPremises)
   - **Translation**: I-nodes with role='premise' → K_p

3. **Assumptions (K_a)**: Explicitly uncertain premises
   - **Theory**: Undermining attacks always succeed (weak premises)
   - **Mesh Status**: MODEL EXISTS (AssumptionUse), NOT TRANSLATED
   - **Gap**: AssumptionUse records not fetched in ASPIC+ translation

**Preference Orderings:**

- **≤' on K_p**: Preference ordering on ordinary premises
- **≤ on R_d**: Preference ordering on defeasible rules
- **Mesh Status**: NOT IMPLEMENTED (no preference system)

### 1.2 Attack Mechanisms (Three Types)

#### 1. Undermining Attack (Premise Attack)

**Theory:** Attack argument's ordinary premises (K_p)
```
A undermines B (on premise ϕ) iff:
- Conc(A) = −ϕ
- ϕ ∈ Prem(B) ∩ K_p  (not an axiom)
```

**Defeat Condition:** Succeeds unless B' ≺' A (premise preference)

**Mesh Implementation:**
- ConflictApplication with `legacyAttackType: 'UNDERMINES'`
- `aspicAttackType: 'undermining'` (computed metadata)
- NOT translated to ASPIC+ yet (Phase E gap)

#### 2. Undercutting Attack (Inference Attack)

**Theory:** Attack defeasible rule applicability
```
A undercuts B (on subargument B') iff:
- Conc(A) = −n(r)
- r = TopRule(B') ∈ R_d
```

**Defeat Condition:** Always succeeds (preference-independent)

**Rationale:** Challenging rule applicability defeats stronger arguments to maintain extension coherence

**Mesh Implementation:**
- ConflictApplication with `legacyAttackType: 'UNDERCUTS'`
- `aspicAttackType: 'undercutting'`
- Uses rule name (RA-node ID) as target
- NOT translated to ASPIC+ yet (Phase E gap)

#### 3. Rebutting Attack (Conclusion Attack)

**Theory:** Attack defeasible conclusion
```
A rebuts B (on subargument B') iff:
- Conc(A) = −ϕ
- ϕ = Conc(B')
- TopRule(B') ∈ R_d  (defeasible conclusion)
```

**Defeat Condition:** Succeeds unless B' ≺ A (rule preference)

**Restricted Rebut:** Cannot rebut strict conclusions (rationality requirement)

**Mesh Implementation:**
- ConflictApplication with `legacyAttackType: 'REBUTS'`
- `aspicAttackType: 'rebutting'`
- Targets conclusion Claim
- NOT translated to ASPIC+ yet (Phase E gap)

### 1.3 Rationality Postulates (Caminada & Amgoud 2007)

**Four Fundamental Properties** (must hold for complete extensions E):

#### 1. Sub-argument Closure
```
∀A ∈ E: Sub(A) ⊆ E
```
If argument accepted, all its subarguments must be accepted.

#### 2. Closure under Strict Rules
```
Conc(E) = {Conc(A) | A ∈ E}
Cl_Rs(Conc(E)) = Conc(E)
```
Conclusions closed under strict inference.

#### 3. Direct Consistency
```
∄ϕ, ψ ∈ Conc(E): ψ ∈ −ϕ
```
No two contradictory conclusions in extension.

#### 4. Indirect Consistency
```
Cl_Rs(Conc(E)) is consistent
```
Strict closure yields no contradictions.

**Conditions for Satisfaction (Well-Defined SAF):**

1. **Logical Properties:**
   - AT closed under transposition OR contraposition
   - Ensures counterarguments can be generated

2. **Axiom Consistency:**
   - Cl_Rs(K_n) is consistent
   - Necessary axioms cannot contradict

3. **Well-Formedness:**
   - If ϕ ∈ −ψ, then ψ ∉ K_n and ψ not consequent of strict rule
   - Prevents contrary attacks on unattackable elements

4. **Reasonable Ordering:**
   - Strict/firm arguments preferred over defeasible/plausible
   - Acyclic preference relation
   - Applying strict rules doesn't weaken argument

**Mesh Status:**
- ✅ Currently satisfied (trivially) because:
  - All rules defeasible (no strict rules to close under)
  - No axioms (K_n = ∅)
  - No contraries defined
- ⚠️ Risk of violations when implementing Phases B-D:
  - Adding strict rules requires transposition closure
  - Adding axioms requires consistency checking
  - Adding contraries requires well-formedness checks

### 1.4 Argument Preference Orderings

**Two Primary Principles:**

#### Last-Link Principle
```
A ≺ B iff LastDefRules(A) ≺_s LastDefRules(B)
```

**Use Case:** Legal/normative reasoning (final rule most critical)

**Example:** Competing legal rules—initial conditions less relevant than final rule conflict

**Mesh Status:** Not implemented

#### Weakest-Link Principle
```
A ≺ B iff DefRules(A) ≺_s DefRules(B) AND Prem_p(A) ≺'_s Prem_p(B)
```

**Use Case:** Epistemic reasoning (uncertainty propagates)

**Rationale:** Argument only as strong as weakest fallible component

**Mesh Status:** Not implemented

**Set Comparison Methods:**

- **Elitist (≺_Eli)**: Compare minimal (weakest) elements
- **Democratic (≺_Dem)**: Compare maximal (strongest) elements

---

## Part 2: AIF-ASPIC+ Translation Theory

### 2.1 AIF Ontology (from "Formalizing AIF using ASPIC Framework")

#### Upper Ontology: Node Types

**Information Nodes (I-nodes):**
- Represent propositions/claims (content)
- **Mesh**: Claim records with text field
- **Role in Arguments**: Premises or conclusions

**Scheme Nodes (S-nodes):**

1. **RA-nodes (Rule Application):**
   - Inference rule instances
   - **Mesh**: Created from Arguments (inference from premises to conclusion)
   - **Translation**: RA → defeasible rule in R_d

2. **CA-nodes (Conflict Application):**
   - Conflict instances (attacks)
   - **Mesh**: ConflictApplication records
   - **Translation**: CA → Attack relation in ASPIC+
   - **Status**: NOT YET TRANSLATED ❌

3. **PA-nodes (Preference Application):**
   - Preference instances
   - **Mesh**: Not yet implemented
   - **Translation**: PA → ≤, ≤' orderings

#### AIF Graph Structure G = (V, E)

**Vertices (V):** V = I ∪ RA ∪ CA ∪ PA

**Edges (E):** E ⊆ V×V \ I×I

**Critical Constraint:** Two I-nodes cannot connect directly—must be mediated by S-node

**Rationale:** Relationships between propositions require explicit reasoning scheme

### 2.2 AIF → ASPIC+ Translation (Section 4.1 of Bex paper)

#### Translation Function: τ_AIF→ASPIC(G, F) → AT

**Step 1: Extract Language**
```typescript
L = I ∪ RA  // All I-nodes + all RA-nodes (as rule names)
```

**Step 2: Extract Rules**
```typescript
// For each RA-node v_k with predecessors {v_1,...,v_n} and successor v:
if (scheme(v_k) === 'deductive') {
  R_s += {v_1,...,v_n} → v  // Strict rule
} else {
  R_d += {v_1,...,v_n} ⇒ v  // Defeasible rule
  n(v_k) = v_k  // Rule name for undercutting
}
```

**Step 3: Extract Knowledge Base**
```typescript
// Initial I-nodes (no predecessors) with their forms:
K_n = {i ∈ I | pred(i) = ∅ AND form(i) = 'axiom'}
K_p = {i ∈ I | pred(i) = ∅ AND form(i) = 'premise'}
K_a = {i ∈ I | pred(i) = ∅ AND form(i) = 'assumption'}
```

**Step 4: Extract Contraries**
```typescript
// For each CA-node connecting v_i to v_j:
−̄(v_j) += v_i  // v_i is contrary of v_j
```

**Step 5: Extract Preferences**
```typescript
// For PA-nodes connecting I-nodes:
≤' += {(v_i, v_j) | PA-node from v_i to v_j}

// For PA-nodes connecting RA-nodes:
≤ += {(r_i, r_j) | PA-node from r_i to r_j}
```

**Mesh Implementation Status:**
- ✅ Step 1: Language extraction (implicit from Claims)
- ✅ Step 2: Rule extraction (RA-nodes from Arguments)
- ⚠️ Step 3: KB extraction (no axiom/assumption distinction)
- ❌ Step 4: Contraries (not implemented)
- ❌ Step 5: Preferences (not implemented)

### 2.3 ASPIC+ → AIF Translation (Section 4.2 of Bex paper)

#### Translation Function: τ_ASPIC→AIF(A_AT) → G

**Purpose:** Visualize ASPIC+ arguments in AIF graph format

**Step 1: Generate I-nodes**
```typescript
I = Prem(A_AT) ∪ {Conc(A) | A ∈ Sub(A_AT)} \ L_R
// All premises and conclusions (excluding rule names)
// Tag with form (axiom/premise/assumption) if in K
```

**Step 2: Generate RA-nodes**
```typescript
RA = {r | r used in some A ∈ A_AT}
// Tag with scheme (deductive if r ∈ R_s, defeasible if r ∈ R_d)
```

**Step 3: Generate CA-nodes**
```typescript
CA = {(ϕ, ψ) | ϕ ∈ Conc(A_AT) ∪ K, ψ ∈ Conc(A_AT) ∪ K, ϕ ∈ −̄ψ}
// All contrary pairs in conclusions/premises
```

**Step 4: Generate PA-nodes**
```typescript
PA_premises = {(ϕ, ψ) | (ϕ, ψ) ∈ ≤'}
PA_rules = {(r, r') | (r, r') ∈ ≤}
```

**Step 5: Generate Edges**
```typescript
// Inference edges:
E += {(ϕ, r) | ϕ ∈ antecedents(r)} ∪ {(r, ψ) | ψ = consequent(r)}

// Chained rules (undercutting):
E += {(r, r') | Conc(r) = −n(r')}

// Conflict edges:
E += {(ϕ, ca), (ca, ψ) | ca connects ϕ to ψ}

// Preference edges:
E += {(ϕ, pa), (pa, ψ) | pa connects ϕ to ψ}
```

**Mesh Application:**
- Used to generate AIF graphs from database Arguments
- Currently in `lib/aif/graph-builder.ts`
- Missing CA-node generation from ConflictApplications

---

## Part 3: Modular Legal Reasoning (Meta-Analysis)

### 3.1 Core Insight from "Combining Legal Reasoning Methods"

**Key Theoretical Contribution:**

Legal reasoning requires **combining heterogeneous methods** (rule-based, probabilistic, case-based) through a **metalevel argumentation framework**.

**Modular Architecture:**

```
┌─────────────────────────────────────────────────┐
│  Meta-Level ASPIC+ Framework                    │
│  - Combines multiple reasoning modules          │
│  - Metalevel rules govern information flow      │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
│  │ Module LR  │  │ Module Ev  │  │ Module B │ │
│  │ (Legal     │  │ (Evidence) │  │ (Burden) │ │
│  │  Rules)    │  │            │  │          │ │
│  └────────────┘  └────────────┘  └──────────┘ │
│  Each module: ASPIC+ AT with own L, R, K       │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Problem-Solving Module M = (L^I_M, L^O_M, R_M, R^io_M):**

- **L^I_M**: Input language (what module accepts)
- **L^O_M**: Output language (what module produces)
- **R_M**: Internal mechanism (black box)
- **R^io_M**: Input-output metalevel rules (defeasible rules describing module behavior)

**Inter-Module Rules (R^oi_M):**

Defeasible rules connecting output of one module to input of another:
```
Output(M1) ⇒ Input(M2)
```

**Mesh Application:**

This modular view explains our architecture:
- **Debate Tab** (Module 1): Creates Claims (outputs propositions)
- **Arguments Tab** (Module 2): Creates Arguments from Claims (rule-based reasoning)
- **Dialogue Tab** (Module 3): Creates Conflicts via CQs (dialogical reasoning)
- **ASPIC Tab** (Meta-Module): Evaluates combined outputs via ASPIC+ semantics

**Missing Integration:**

Each tab operates semi-independently. Need explicit **output-input rules** to formalize:
- How Debate propositions become Argument premises
- How Dialogue moves create ConflictApplications
- How ASPIC+ evaluation feeds back to UI state

### 3.2 Burden of Proof Modeling

**Theoretical Insight:**

Burden of proof shifts are **metalevel phenomena**, not object-level argument properties.

**Formalization (from paper Example 4.1):**

Three modules:
1. **LR (Legal Rules)**: Liability rules
2. **Ev (Evidence)**: Evidential arguments
3. **B (Burden)**: Burden assignments

**Output-Input Rules:**
```
// Rule oi1: Burden satisfied → Fact becomes axiom
Burden(ϕ) defensible in B ∧ ϕ justified in Ev ⇒ ϕ ∈ K_n(LR)

// Rule oi2: Burden not satisfied → Negation becomes axiom
Burden(ϕ) defensible in B ∧ ϕ not justified in Ev ⇒ −ϕ ∈ K_n(LR)
```

**Mesh Application:**

Could model assumption tracking as burden:
- AssumptionUse with status='PROPOSED' → burden on proponent
- If not satisfied (no GROUNDS provided) → assumption fails → attack succeeds

**Current Gap:**

No mechanism to track "who has burden" or "is burden satisfied"—relies on implicit community consensus.

### 3.3 Heterogeneous Method Integration

**From paper Section 4.2: Bayesian Networks + ASPIC+:**

```
┌──────────────────────────────────────────────────┐
│  ArS Module (Argument Schemes)                   │
│  - Expert testimony defeasible rules             │
│  - Output: Pr(H|E) = n                           │
└────────────┬─────────────────────────────────────┘
             │ oi6: Pr(H|E)=n justified ⇒ Pr(H|E)=n ∈ Pr(BN)
             ▼
┌──────────────────────────────────────────────────┐
│  Ev-BN Module (Bayesian Network)                 │
│  - Probabilistic inference                       │
│  - Output: Pr(ϕ|E) > 0.5                         │
└────────────┬─────────────────────────────────────┘
             │ oi4/oi5: Balance of probabilities
             ▼
┌──────────────────────────────────────────────────┐
│  LR Module (Legal Rules)                         │
│  - Defeasible liability rules                    │
│  - Output: liable justified                      │
└──────────────────────────────────────────────────┘
```

**Key Insight:**

Conflicting inputs to a module (e.g., two experts giving different Pr(H|E) values) create **contradictory metalevel arguments**, which ASPIC+ resolves through defeat relations.

**Mesh Application:**

Could integrate:
- **Expert testimony** → Source credibility ratings
- **Statistical evidence** → Confidence scores on ArgumentSupport
- **Case-based reasoning** → Similarity to precedent arguments

Currently siloed—need metalevel framework to combine.

---

## Part 4: Implementation Guidance

### 4.1 Phase E Implementation (ConflictApplication Translation)

**Theoretical Foundation:**

CA-nodes in AIF translate to attacks in ASPIC+ (Section 4.1 of Bex paper).

**Required Changes:**

#### File: `app/api/aspic/evaluate/route.ts`

**Current Code (Line ~238):**
```typescript
// TODO: Add CA-nodes when Prisma client includes ConflictApplication
```

**Theoretical Mapping:**

```typescript
// ConflictApplication → CA-node → ASPIC+ Attack
CA-node structure:
- predecessors: [conflictingArgumentId or conflictingClaimId]
- CA-node itself: conflict instance
- successors: [conflictedArgumentId or conflictedClaimId]

ASPIC+ Attack:
- Attacker: Argument deriving conflictingClaim
- Attacked: Argument containing conflictedClaim
- Type: undermining | rebutting | undercutting (from aspicAttackType)
```

**Implementation Steps:**

1. **Fetch ConflictApplications:**
```typescript
const conflicts = await prisma.conflictApplication.findMany({
  where: { deliberationId },
  include: {
    scheme: true,
    createdByMove: true,
  }
});
```

2. **Create CA-nodes:**
```typescript
for (const conflict of conflicts) {
  const caNode: CANode = {
    nodeID: `ca_${conflict.id}`,
    text: `${conflict.aspicAttackType || conflict.legacyAttackType} attack`,
    type: "CA",
    // Metadata for visualization
    metadata: {
      schemeKey: conflict.scheme?.key,
      createdByMoveId: conflict.createdByMoveId,
      aspicMetadata: conflict.aspicMetadata,
    }
  };
  nodes.push(caNode);
  
  // Create edges: attacker → CA-node → target
  if (conflict.conflictingArgumentId) {
    edges.push({
      edgeID: `edge_${conflict.id}_from`,
      fromID: conflict.conflictingArgumentId,
      toID: caNode.nodeID,
      formEdgeID: null,
    });
  } else if (conflict.conflictingClaimId) {
    // Find or create I-node for conflicting claim
    const conflictingINode = findOrCreateINode(conflict.conflictingClaimId);
    edges.push({
      edgeID: `edge_${conflict.id}_from`,
      fromID: conflictingINode.nodeID,
      toID: caNode.nodeID,
      formEdgeID: null,
    });
  }
  
  edges.push({
    edgeID: `edge_${conflict.id}_to`,
    fromID: caNode.nodeID,
    toID: conflict.conflictedArgumentId || conflict.conflictedClaimId,
    formEdgeID: null,
  });
}
```

3. **Update ASPIC+ Translation:**
```typescript
// File: lib/aif/translation/aifToAspic.ts
function translateCANodes(caNodes: CANode[], edges: Edge[], nodes: AnyNode[]): Attack[] {
  return caNodes.map(ca => {
    const incomingEdge = edges.find(e => e.toID === ca.nodeID);
    const outgoingEdge = edges.find(e => e.fromID === ca.nodeID);
    
    if (!incomingEdge || !outgoingEdge) {
      console.warn(`CA-node ${ca.nodeID} missing edges`);
      return null;
    }
    
    // Determine attack type from CA metadata
    let attackType: 'undermining' | 'rebutting' | 'undercutting';
    if (ca.text.includes('undermine') || ca.metadata?.aspicMetadata?.attackType === 'UNDERMINES') {
      attackType = 'undermining';
    } else if (ca.text.includes('undercut') || ca.metadata?.aspicMetadata?.attackType === 'UNDERCUTS') {
      attackType = 'undercutting';
    } else {
      attackType = 'rebutting';
    }
    
    // Find attacker and attacked arguments
    const attackerNode = nodes.find(n => n.nodeID === incomingEdge.fromID);
    const attackedNode = nodes.find(n => n.nodeID === outgoingEdge.toID);
    
    return {
      id: ca.nodeID,
      type: attackType,
      attacker: {
        id: attackerNode.nodeID,
        conclusion: attackerNode.type === 'I' ? attackerNode.text : '...',
      },
      attacked: {
        id: attackedNode.nodeID,
        conclusion: attackedNode.type === 'I' ? attackedNode.text : '...',
      },
      // For undermining/rebutting: need to identify which subargument/premise
      targetPremiseIndex: ca.metadata?.aspicMetadata?.premiseIndex,
      targetRuleId: ca.metadata?.aspicMetadata?.ruleId,
    };
  }).filter(Boolean);
}
```

### 4.2 Phase A Implementation (Assumptions Integration)

**Theoretical Foundation:**

Assumptions (K_a) are premises where undermining attacks always succeed (from ASPIC+ framework).

**AssumptionUse Model Mapping:**

```typescript
// Mesh model (schema.prisma Line ~5318)
model AssumptionUse {
  assumptionClaimId String?  // Maps to K_a (if accepted)
  assumptionText    String?  // Free-form assumption
  status            AssumptionStatus  // PROPOSED|ACCEPTED|RETRACTED|CHALLENGED
}

// ASPIC+ mapping:
status = ACCEPTED → Include in K_a
status = PROPOSED → Not yet in KB
status = CHALLENGED → Under attack (still in K_a until retracted)
status = RETRACTED → Remove from K_a
```

**Implementation:**

```typescript
// File: lib/aif/translation/aifToAspic.ts (add to knowledge base construction)
async function fetchAssumptions(deliberationId: string): Promise<Assumption[]> {
  const assumptions = await prisma.assumptionUse.findMany({
    where: { 
      deliberationId,
      status: 'ACCEPTED',  // Only accepted assumptions enter KB
    },
    include: { 
      claim: true  // If tied to Claim
    }
  });
  
  return assumptions.map(a => ({
    id: a.assumptionClaimId || `assumption_${a.id}`,
    formula: a.claim?.text || a.assumptionText,
    role: 'assumption',  // Tag for K_a
    confidence: a.confidence || 0.5,
    weight: a.weight || 1.0,
  }));
}

// Add to knowledgeBase construction:
knowledgeBase.assumptions = await fetchAssumptions(deliberationId);
```

**Attack Behavior:**

```typescript
// Undermining attack on assumption ALWAYS succeeds (no preference check)
function checkDefeat(attack: Attack, preferences: Preferences): boolean {
  if (attack.type === 'undermining') {
    const targetPremise = attack.attacked.premises[attack.targetPremiseIndex];
    if (targetPremise.role === 'assumption') {
      return true;  // Always succeeds
    }
    // Check preference for ordinary premises
    return !preferences.premisePreferences.includes({
      preferred: attack.attacked.id,
      dispreferred: attack.attacker.id,
    });
  }
  // ... other attack types
}
```

### 4.3 Phase B Implementation (Axioms Designation)

**Theoretical Foundation:**

Axioms (K_n) are indisputable premises that cannot be undermined (ASPIC+ framework Section 2.2.1).

**Database Schema Addition:**

```typescript
// File: lib/models/schema.prisma
model ArgumentPremise {
  id         String  @id @default(cuid())
  argumentId String
  claimId    String
  isAxiom    Boolean @default(false)  // NEW: Designate as axiom
  // ...
}
```

**ASPIC+ Mapping:**

```typescript
// File: lib/aif/translation/aifToAspic.ts
function classifyPremises(premises: ArgumentPremise[]): {
  axioms: Premise[],
  ordinaryPremises: Premise[],
} {
  const axioms = premises
    .filter(p => p.isAxiom)
    .map(p => ({
      id: p.claimId,
      formula: p.claim.text,
      role: 'axiom',
    }));
  
  const ordinaryPremises = premises
    .filter(p => !p.isAxiom)
    .map(p => ({
      id: p.claimId,
      formula: p.claim.text,
      role: 'premise',
    }));
  
  return { axioms, ordinaryPremises };
}

// Update KB construction:
const { axioms, ordinaryPremises } = classifyPremises(allPremises);
knowledgeBase.axioms = axioms;         // K_n
knowledgeBase.premises = ordinaryPremises;  // K_p
```

**Attack Restriction:**

```typescript
// Undermining attacks CANNOT target axioms
function canUndermine(attacker: Argument, premise: Premise): boolean {
  if (premise.role === 'axiom') {
    return false;  // Axioms cannot be undermined
  }
  return true;
}
```

**Rationality Requirement:**

```typescript
// Axioms must be consistent (Cl_Rs(K_n) is consistent)
function validateAxiomConsistency(axioms: Premise[], strictRules: Rule[]): boolean {
  const strictClosure = computeStrictClosure(axioms, strictRules);
  
  // Check for contradictions
  for (const formula of strictClosure) {
    const negation = negateFormula(formula);
    if (strictClosure.includes(negation)) {
      throw new Error(`Axiom inconsistency detected: ${formula} and ${negation}`);
    }
  }
  
  return true;
}
```

### 4.4 Phase D Implementation (Contraries Definition)

**Theoretical Foundation:**

Contraries function (−̄) maps formulas to their contradictories (ASPIC+ Section 2.3).

**Database Schema Addition:**

```typescript
// File: lib/models/schema.prisma
model ClaimContrary {
  id             String   @id @default(cuid())
  deliberationId String
  claimId        String   // First claim
  contraryId     String   // Contradictory claim
  isSymmetric    Boolean  @default(true)  // Contradictory vs Contrary
  createdById    String
  createdAt      DateTime @default(now())
  
  claim    Claim @relation("ClaimContraries", fields: [claimId], references: [id])
  contrary Claim @relation("ContraryOf", fields: [contraryId], references: [id])
  
  @@unique([claimId, contraryId])
  @@index([deliberationId])
}
```

**ASPIC+ Mapping:**

```typescript
// File: lib/aif/translation/aifToAspic.ts
async function fetchContraries(deliberationId: string): Promise<Map<string, string[]>> {
  const contraries = await prisma.claimContrary.findMany({
    where: { deliberationId },
    include: { claim: true, contrary: true }
  });
  
  const contrariesMap = new Map<string, string[]>();
  
  for (const c of contraries) {
    // Add claimId → contraryId mapping
    const existing = contrariesMap.get(c.claimId) || [];
    contrariesMap.set(c.claimId, [...existing, c.contraryId]);
    
    // If symmetric (contradictories), add reverse mapping
    if (c.isSymmetric) {
      const reverse = contrariesMap.get(c.contraryId) || [];
      contrariesMap.set(c.contraryId, [...reverse, c.claimId]);
    }
  }
  
  return contrariesMap;
}

// Add to theory construction:
theory.system.contraries = await fetchContraries(deliberationId);
```

**Attack Classification:**

```typescript
// Use contraries to determine rebutting attacks
function classifyAttack(
  attackerConclusion: string,
  targetConclusion: string,
  contraries: Map<string, string[]>
): 'rebutting' | 'undermining' | 'undercutting' | null {
  
  // Check if conclusions are contraries
  const attackerContraries = contraries.get(attackerConclusion) || [];
  if (attackerContraries.includes(targetConclusion)) {
    return 'rebutting';  // Conclusion attack
  }
  
  // Check if attacker conclusion negates target premise
  const targetPremises = getArgumentPremises(target);
  for (const premise of targetPremises) {
    const premiseContraries = contraries.get(premise.id) || [];
    if (premiseContraries.includes(attackerConclusion)) {
      return 'undermining';  // Premise attack
    }
  }
  
  // Check if attacker conclusion negates rule name (undercutting)
  const targetRuleName = getTopRuleName(target);
  const ruleContraries = contraries.get(targetRuleName) || [];
  if (ruleContraries.includes(attackerConclusion)) {
    return 'undercutting';  // Rule attack
  }
  
  return null;  // No attack
}
```

**Well-Formedness Check:**

```typescript
// Ensure contraries don't target axioms or strict rule conclusions
function validateWellFormedness(
  contraries: Map<string, string[]>,
  axioms: Set<string>,
  strictRuleConclusions: Set<string>
): boolean {
  for (const [formula, contraryList] of contraries.entries()) {
    for (const contrary of contraryList) {
      if (axioms.has(contrary)) {
        throw new Error(`Contrary ${formula} targets axiom ${contrary}`);
      }
      if (strictRuleConclusions.has(contrary)) {
        throw new Error(`Contrary ${formula} targets strict rule conclusion ${contrary}`);
      }
    }
  }
  return true;
}
```

---

## Part 5: Theoretical Gaps and Solutions

### 5.1 Transposition/Contraposition Requirement

**Theory (from ASPIC+ Section 3.1.1):**

For rationality postulates to hold, AT must be closed under transposition OR contraposition.

**Transposition Closure:**
```
If ϕ₁,...,ϕₙ → ψ ∈ R_s
Then ϕ₁,...,ϕᵢ₋₁,−ψ,ϕᵢ₊₁,...,ϕₙ → −ϕᵢ ∈ R_s  (for each i)
```

**Contraposition Closure:**
```
If S ⊢ ϕ
Then S\{s} ∪ {−ϕ} ⊢ −s  (for each s ∈ S)
```

**Current Gap:**

No strict rules implemented → requirement vacuously satisfied.

**Future Risk:**

When adding strict rules (Phase C), must ensure transposition/contraposition closure.

**Solution:**

```typescript
// File: lib/aspic/validation.ts
function ensureTranspositionClosure(strictRules: Rule[]): Rule[] {
  const transposed: Rule[] = [];
  
  for (const rule of strictRules) {
    const { antecedents, consequent } = rule;
    
    // For each antecedent, create transposed rule
    for (let i = 0; i < antecedents.length; i++) {
      const transposedAntecedents = [
        ...antecedents.slice(0, i),
        negateFormula(consequent),  // −ψ replaces ϕᵢ
        ...antecedents.slice(i + 1),
      ];
      const transposedConsequent = negateFormula(antecedents[i]);
      
      const transposedRule = {
        id: `${rule.id}_transpose_${i}`,
        antecedents: transposedAntecedents,
        consequent: transposedConsequent,
        type: 'strict',
      };
      
      transposed.push(transposedRule);
    }
  }
  
  // Return original + transposed rules
  return [...strictRules, ...transposed];
}
```

### 5.2 Specificity Ordering for Input-Output Rules

**Theory (from Legal Reasoning paper Section 3.4):**

When multiple R^io rules apply, the most specific (rule with most comprehensive antecedents) should prevail.

**Specificity Definition:**
```
Rule r₁ more specific than r₂ iff:
antecedents(r₁) ⊃ antecedents(r₂)  (strict superset)
```

**Mesh Application:**

Relevant for complex argument patterns where:
- Argument A: P1 ⇒ C
- Argument B: P1, P2 ⇒ C

Argument B should be preferred (more comprehensive input).

**Implementation:**

```typescript
// File: lib/aspic/preferences.ts
function compareSpecificity(rule1: Rule, rule2: Rule): number {
  const ants1 = new Set(rule1.antecedents);
  const ants2 = new Set(rule2.antecedents);
  
  // Check if rule1 is more specific (strict superset)
  if (isSuperset(ants1, ants2) && !isSuperset(ants2, ants1)) {
    return 1;  // rule1 > rule2
  }
  
  // Check if rule2 is more specific
  if (isSuperset(ants2, ants1) && !isSuperset(ants1, ants2)) {
    return -1;  // rule1 < rule2
  }
  
  return 0;  // Incomparable or equal
}

function isSuperset(set1: Set<string>, set2: Set<string>): boolean {
  for (const elem of set2) {
    if (!set1.has(elem)) return false;
  }
  return true;
}
```

### 5.3 Grounded Semantics vs Other Semantics

**Theory (from ASPIC+ Section 2.2.3):**

ASPIC+ generates Dung AF, which can be evaluated under multiple semantics:
- **Grounded**: Unique, minimal extension (most skeptical)
- **Preferred**: Maximal admissible extensions (more credulous)
- **Stable**: Preferred extensions that defeat all outside arguments
- **Semi-stable**: Maximizes range (defeats + undecided)

**Current Implementation:**

We only compute grounded semantics (file: `lib/aspic/semantics.ts`).

**Trade-offs:**

| Semantics | Uniqueness | Coverage | Computational Cost |
|-----------|------------|----------|-------------------|
| Grounded  | ✅ Unique  | Low (skeptical) | Fast (polynomial) |
| Preferred | ❌ Multiple | High (credulous) | Slow (NP-complete) |
| Stable    | ❌ Multiple | Very High | Slow (NP-complete) |

**Recommendation:**

- **Keep grounded as default** (fast, deterministic, unique)
- **Add preferred as option** for users who want to explore alternative interpretations
- **Add UI toggle** in AspicTheoryPanel to switch semantics

**Implementation:**

```typescript
// File: lib/aspic/semantics.ts
export function computeAspicSemantics(
  theory: ArgumentationTheory,
  semantics: 'grounded' | 'preferred' | 'stable' = 'grounded'
): AspicSemantics {
  const { arguments: args, attacks, defeats } = constructArgumentsAndAttacks(theory);
  
  let extensions: ArgumentExtension[];
  
  switch (semantics) {
    case 'grounded':
      extensions = [computeGroundedExtension(args, defeats)];
      break;
    case 'preferred':
      extensions = computePreferredExtensions(args, defeats);
      break;
    case 'stable':
      extensions = computeStableExtensions(args, defeats);
      break;
  }
  
  return {
    arguments: args,
    attacks,
    defeats,
    extensions,
    semantics,
  };
}
```

---

## Part 6: Conclusion and Next Steps

### 6.1 Key Theoretical Takeaways

1. **ASPIC+ Metalevel Design**: Arguments and rules operate at metalevel, providing abstraction over object-level logics
2. **AIF as Structural Layer**: AIF provides ontological structure for interchange; ASPIC+ provides semantic evaluation
3. **Bidirectional Translation**: Well-defined mappings enable moving between structural (AIF) and semantic (ASPIC+) representations
4. **Rationality Requirements**: Well-formed systems require transposition closure, axiom consistency, well-formedness, and reasonable orderings
5. **Modular Reasoning**: Complex legal/argumentation scenarios benefit from module decomposition with metalevel integration

### 6.2 Implementation Priority (Updated with Theoretical Grounding)

#### Priority 1: Critical Path (Restore Semantic Evaluation) 🔥

**Phase E: ConflictApplication Translation** (2-3 hours)
- **Theory**: CA-nodes → ASPIC+ attacks (Bex paper Section 4.1)
- **Impact**: Makes existing attack data visible in semantics computation
- **Rationality**: Enables defeat relation computation, proper extension labeling

#### Priority 2: Core ASPIC+ Features (Enable Full Framework) ⭐

**Phase A: Assumptions Integration** (2-3 hours)
- **Theory**: K_a (assumptions) with automatic defeat (ASPIC+ Section 2.2.1)
- **Impact**: Explicit modeling of uncertain premises
- **Rationality**: Enriches knowledge base stratification

**Phase D: Contraries Definition** (3-4 hours)
- **Theory**: Contrariness function −̄ (ASPIC+ Section 2.3)
- **Impact**: Proper classification of rebutting attacks
- **Rationality**: Well-formedness validation

#### Priority 3: Advanced Features (Strict/Defeasible Distinction) 📈

**Phase B: Axioms Designation** (3-4 hours)
- **Theory**: K_n (axioms) immune to undermining (ASPIC+ Section 2.2.1)
- **Impact**: Foundational premises marked unquestionable
- **Rationality**: Axiom consistency validation required

**Phase C: Strict Rules** (4-5 hours)
- **Theory**: R_s (strict rules) with transposition closure (ASPIC+ Section 3.1)
- **Impact**: Deductive vs presumptive reasoning distinction
- **Rationality**: CRITICAL—requires transposition closure to maintain consistency

#### Priority 4: UX and Semantics (Polish and Options) 💡

**Phase F: Attack Creation UI** (3-4 hours)
- **Theory**: Attack mechanisms (ASPIC+ Definition 3.6)
- **Impact**: Improved discoverability
- **Rationality**: N/A (UI only)

**Phase G: Multiple Semantics** (2-3 hours)
- **Theory**: Dungean semantics (grounded/preferred/stable)
- **Impact**: Alternative interpretations for credulous reasoning
- **Rationality**: N/A (evaluation method)

### 6.3 Open Research Questions

1. **Implicit vs Explicit Structure**:
   - Should we expose A-nodes explicitly in AIF graphs?
   - Trade-off: clarity vs complexity

2. **Preference Elicitation**:
   - How do users specify premise/rule preferences?
   - Last-link vs weakest-link—should this be user-configurable?

3. **Dynamic Argumentation**:
   - How does ASPIC+ tab update when Arguments change?
   - Should we cache ASPIC+ computations or recompute on demand?

4. **Explanation Generation**:
   - Can we implement argument games (Section 5 of ASPIC+ paper)?
   - How to visualize grounded extension computation step-by-step?

5. **Module Integration**:
   - How to formalize Debate→Arguments→Dialogue flow as metalevel PS?
   - Should we implement explicit output-input rules between tabs?

### 6.4 Validation Strategy

**Before each phase deployment:**

1. **Unit Tests**: Test translation functions against known examples from papers
2. **Rationality Checks**: Validate postulate satisfaction (consistency, closure)
3. **Graph Integrity**: Verify AIF graph structure (no I→I edges)
4. **Semantic Correctness**: Compare computed extensions with hand-calculated results

**Test Cases from Literature:**

- Pollock's perception scheme (ASPIC+ Section 3.5)
- Legal liability example (Legal Reasoning paper Section 4.1)
- Expert testimony with conflicting probabilities (Legal Reasoning paper Section 4.2)

---

## Appendix: Quick Reference Tables

### A.1 ASPIC+ Component Mapping

| ASPIC+ Component | Theory Definition | Mesh Database Model | Implementation Status |
|------------------|-------------------|---------------------|----------------------|
| Language (L) | Formulas closed under ¬ | Claim.text | ✅ Implicit |
| Strict Rules (R_s) | Antecedents → Consequent | None | ❌ Not implemented |
| Defeasible Rules (R_d) | Antecedents ⇒ Consequent | Argument (RA-node) | ✅ Implemented |
| Axioms (K_n) | Indisputable premises | None | ❌ Not distinguished |
| Premises (K_p) | Ordinary premises | ArgumentPremise | ✅ Implemented |
| Assumptions (K_a) | Weak premises | AssumptionUse | ⚠️ Model exists, not translated |
| Contraries (−̄) | ϕ ↦ {ψ: ψ∈−̄ϕ} | None | ❌ Not implemented |
| Preferences (≤, ≤') | Rule/premise orderings | None | ❌ Not implemented |
| Arguments (A) | Inference trees | Argument | ✅ Constructed |
| Attacks (C) | Undermine/Rebut/Undercut | ConflictApplication | ✅ Created, ❌ Not translated |
| Defeats (D) | Successful attacks | Computed | ❌ Missing (no attacks) |

### A.2 AIF Node Type Mapping

| AIF Node | Purpose | Mesh Representation | ASPIC+ Translation |
|----------|---------|---------------------|-------------------|
| I-node | Proposition content | Claim | Formula in L |
| RA-node | Inference instance | Argument (implicit) | Defeasible rule in R_d |
| CA-node | Conflict instance | ConflictApplication | Attack in C |
| PA-node | Preference instance | None | Ordering in ≤, ≤' |

### A.3 Attack Type Classification

| Attack Type | Target | Defeat Condition | Mesh Field | Translation Status |
|-------------|--------|------------------|------------|-------------------|
| Undermining | Ordinary premise (K_p) | Not (B' ≺' A) | legacyAttackType: 'UNDERMINES' | ❌ Not translated |
| Undercutting | Defeasible rule name | Always succeeds | legacyAttackType: 'UNDERCUTS' | ❌ Not translated |
| Rebutting | Defeasible conclusion | Not (B' ≺ A) | legacyAttackType: 'REBUTS' | ❌ Not translated |

### A.4 Rationality Postulate Checklist

| Postulate | Requirement | Mesh Status | Risk When Implementing |
|-----------|-------------|-------------|------------------------|
| Sub-argument Closure | ∀A∈E: Sub(A)⊆E | ✅ Satisfied | Low (ASPIC+ guarantees) |
| Closure under Strict Rules | Conc(E) closed under R_s | ✅ Trivial (no R_s) | High (Phase C—need transposition) |
| Direct Consistency | No contradictories in Conc(E) | ✅ Satisfied | Medium (Phase D—need contraries) |
| Indirect Consistency | Cl_Rs(Conc(E)) consistent | ✅ Trivial (no R_s) | High (Phase C—need axiom check) |
| Transposition Closure | Rules closed under transposition | N/A (no R_s) | High (Phase C—must implement) |
| Axiom Consistency | Cl_Rs(K_n) consistent | N/A (no K_n) | Medium (Phase B—must validate) |
| Well-Formedness | Contraries don't target K_n/R_s | N/A (no contraries) | Medium (Phase D—must check) |
| Reasonable Ordering | Preferences satisfy constraints | N/A (no ≺) | Low (use weakest-link) |

---

**End of Theoretical Foundations Synthesis**
