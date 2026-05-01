# Structural Moves (THEREFORE, SUPPOSE, DISCHARGE) - ASPIC+ & AIF Integration Analysis

**Date**: November 7, 2025  
**Context**: Phase F - Understanding structural moves in DialogueActionsModal  
**Question**: How do THEREFORE, SUPPOSE, DISCHARGE integrate with ASPIC+ and AIF?

---

## Executive Summary

**Short Answer**: Structural moves (THEREFORE, SUPPOSE, DISCHARGE) are **COMPLEMENTARY to ASPIC+**, not core ASPIC+ operations. They enable **natural deduction reasoning** and **hypothetical argumentation** in dialogue, which then gets **compiled into RA-nodes** (inference rules) in the AIF graph for ASPIC+ evaluation.

**Key Insights**:
1. **THEREFORE** → Creates new RA-nodes (defeasible rules) from dialogue premises
2. **SUPPOSE** → Opens hypothetical scope for conditional reasoning
3. **DISCHARGE** → Closes hypothesis and creates conditional RA-node
4. **ASPIC+ Integration**: Indirect (via Ludics → AIF → ASPIC+)
5. **Use Case**: Advanced dialogue moves for structured argumentation

**Recommendation**: Keep in DialogueActionsModal as "Structural" tab, but **NOT needed for basic attack creation** (Phase F focuses on direct ASPIC+ attacks).

---

## Part 1: Theoretical Foundations

### 1.1 What Are Structural Moves?

**Source**: Natural deduction logic + dialogue game theory

**Purpose**: Enable **constructive argumentation** beyond simple claim assertion

**Metaphor**: **Logical connectives** in dialogue form

| Structural Move | Logical Analog | Natural Deduction Rule |
|----------------|----------------|----------------------|
| **THEREFORE** | Modus Ponens | (A, A→B) ⊢ B |
| **SUPPOSE** | Assumption introduction | [A] ... B (open scope) |
| **DISCHARGE** | Implication introduction | [A] B ⊢ (A→B) |

---

### 1.2 THEREFORE - Inference Conclusion

**Definition**: Assert a conclusion that follows from previously stated premises

**Dialogue Context**:
```
Speaker A: "CO2 traps heat" (Premise 1)
Speaker A: "CO2 levels are rising" (Premise 2)
Speaker A: "THEREFORE, temperature will increase" (Conclusion)
```

**Ludics Compilation** (`compileFromMoves.ts` line 759):
```typescript
if (kind === 'THEREFORE') {
  // THEREFORE: Assert inference/conclusion from premises
  const expr = payload.expression || payload.text || '';
  
  return [
    {
      moves: [m],
      locusPath: pickChild(locusPath, explicitChild),
      act: {
        kind: 'PROPER',
        expression: expr || 'THEREFORE',
        polarity: 'P',
      },
    },
  ];
}
```

**AIF Translation**:
- **DialogueMove** (THEREFORE) → **Ludic Act** (PROPER) → **RA-node** (defeasible rule)
- Premises: Previous claims in dialogue thread
- Conclusion: THEREFORE expression
- Rule: `{Premise1, Premise2} ⇒ Conclusion`

**ASPIC+ Semantics**:
- Creates **defeasible rule** in R_d
- Can be attacked via:
  - **REBUTS**: Attack conclusion
  - **UNDERCUTS**: Attack rule applicability (challenge inference)

**Use Case**:
- Formal debates (construct multi-premise arguments)
- Legal reasoning (assert conclusions from evidence)
- Pedagogical contexts (teach inference)

---

### 1.3 SUPPOSE - Hypothetical Reasoning

**Definition**: Introduce a hypothetical assumption for conditional argumentation

**Dialogue Context**:
```
Speaker A: "SUPPOSE carbon tax is implemented"
Speaker B: "Then emissions would decrease" (within hypothesis)
Speaker A: "And GDP would decline" (within hypothesis)
Speaker A: "DISCHARGE: Therefore, carbon tax has trade-offs" (conclusion)
```

**Ludics Compilation** (`compileFromMoves.ts` line 791):
```typescript
if (kind === 'SUPPOSE') {
  // SUPPOSE: Introduce hypothetical assumption
  const expr = payload.expression || payload.text || '';
  
  return [
    {
      moves: [m],
      locusPath: pickChild(locusPath, explicitChild),
      act: {
        kind: 'PROPER',
        expression: expr || 'SUPPOSE',
        polarity: 'P',
        hypothetical: true, // Mark as hypothetical
      },
    },
  ];
  
  // Hypothesis stays open until DISCHARGE
}
```

**AIF Translation**:
- **DialogueMove** (SUPPOSE) → **Ludic Act** (PROPER, hypothetical=true) → **I-node** (hypothetical premise)
- Opens **scoped reasoning** context
- All subsequent moves within scope marked `hypothetical: true`
- **No RA-node** created until DISCHARGE

**ASPIC+ Semantics**:
- **NOT directly mapped** to ASPIC+ during SUPPOSE phase
- Hypothetical premises **NOT added to K_p** (knowledge base)
- Waits for DISCHARGE to create conditional rule

**Use Case**:
- Counterfactual reasoning ("If X were true, then Y")
- Policy analysis ("Suppose we implement policy X")
- Thought experiments ("What if gravity doubled?")

---

### 1.4 DISCHARGE - Close Hypothesis & Create Conditional

**Definition**: Close a SUPPOSE scope and assert the conditional conclusion

**Dialogue Context**:
```
Speaker A: "SUPPOSE carbon tax is implemented" (opens scope)
Speaker B: "Then emissions decrease" (hypothesis → consequence)
Speaker A: "DISCHARGE: Therefore, IF carbon tax, THEN emissions decrease" (conditional rule)
```

**Ludics Compilation** (`compileFromMoves.ts` line 817):
```typescript
if (kind === 'DISCHARGE') {
  // DISCHARGE: Close hypothetical scope and assert conclusion
  // Should reference the SUPPOSE locus
  const supposeLocus = payload.supposeLocus ?? 
                       payload.justifiedByLocus ?? 
                       getParentLocus(locusPath);
                       
  const child = pickChild(supposeLocus, explicitChild);
  
  return [
    {
      moves: [m],
      locusPath: child,
      act: {
        kind: 'PROPER',
        expression: expr || 'DISCHARGE',
        polarity: 'P',
        meta: {
          dischargesLocus: supposeLocus,
          hypothetical: false,
        },
      },
    },
    {
      locusPath: child,
      moves: [],
      act: { kind: 'DAIMON', expression: 'HYPOTHESIS_DISCHARGED' },
    },
  ];
}
```

**AIF Translation**:
- **DialogueMove** (DISCHARGE) → **Ludic Act** (PROPER + DAIMON) → **RA-node** (conditional rule)
- Collects all hypothetical claims within SUPPOSE scope
- Creates **defeasible rule**: `[Hypothesis] ⇒ Conclusion`
- DAIMON closes the hypothetical branch (ludics formalism)

**ASPIC+ Semantics**:
- Creates **defeasible rule** in R_d: `SUPPOSE_premise ⇒ DISCHARGE_conclusion`
- Rule can be attacked:
  - **REBUTS**: Attack conclusion
  - **UNDERCUTS**: Attack conditional applicability

**Use Case**:
- Conditional policy arguments
- Legal hypotheticals
- Scientific thought experiments

---

## Part 2: ASPIC+ Integration Analysis

### 2.1 How Structural Moves Relate to ASPIC+

**ASPIC+ Framework Components**:
```
AS = (L, R, n)
  L = Logical language (claims)
  R = R_s ∪ R_d (strict + defeasible rules)
  n = Naming function (rule names for undercutting)

K = K_n ∪ K_p ∪ K_a
  K_n = Axioms (cannot be undermined)
  K_p = Ordinary premises (can be undermined)
  K_a = Assumptions (weak premises)

−̄ = Contraries function (conflicts)
```

**Structural Moves Mapping**:

| Structural Move | Creates in L | Creates in R | Creates in K | Attack Type |
|----------------|-------------|-------------|-------------|------------|
| **THEREFORE** | Conclusion I-node | RA-node (defeasible rule) | No | REBUTS (conclusion), UNDERCUTS (rule) |
| **SUPPOSE** | Hypothesis I-node | No (until DISCHARGE) | No (hypothetical) | N/A (not in theory yet) |
| **DISCHARGE** | Conclusion I-node | RA-node (conditional rule) | No | REBUTS (conclusion), UNDERCUTS (conditional) |

**Integration Path**:
```
Dialogue Move (THEREFORE/SUPPOSE/DISCHARGE)
  ↓
Ludics Compilation (compileFromMoves.ts)
  ↓
Ludic Act (PROPER, with metadata)
  ↓
AIF Sync (syncLudicsToAif.ts)
  ↓
AIF Graph (I-nodes + RA-nodes)
  ↓
ASPIC+ Translation (aifToAspic.ts)
  ↓
Argumentation Theory (L, R, K)
  ↓
Attack Computation (computeAttacks)
  ↓
Grounded Semantics (IN/OUT/UNDEC)
```

---

### 2.2 Do Structural Moves Create ASPIC+ Attacks?

**NO** - Structural moves **DO NOT directly create attacks**.

**What They Do**:
- **Create RA-nodes** (inference rules) in AIF
- **Enable complex argument construction** (multi-premise, conditional)
- **Provide dialogue provenance** for rules

**What Creates Attacks**:
- **WHY move** → Challenge (creates obligation)
- **GROUNDS move** → Objection (creates ConflictApplication → CA-node → ASPIC+ attack)
- **Direct AttackCreationModal** → ConflictApplication → CA-node → ASPIC+ attack

**Example**:
```
Speaker A: "CO2 traps heat" (Premise 1)
Speaker A: "CO2 rising" (Premise 2)
Speaker A: "THEREFORE temperature increases" (Creates RA-node)

Speaker B: "I challenge your inference" (WHY move on THEREFORE)
  ↓
Speaker A: "Climate models prove it" (GROUNDS move)
  ↓
Speaker B: "Models are uncertain" (Objection claim)
  ↓
ConflictApplication created (UNDERCUTS attack on RA-node)
  ↓
ASPIC+ attack: B undercuts A's THEREFORE inference
```

**Key Point**: Structural moves enable **argument construction**, but attacks come from **WHY/GROUNDS dialogue** or **direct attack creation**.

---

### 2.3 AIF Integration Details

**I-Nodes (Information Nodes)**:
- Created from THEREFORE conclusion
- Created from SUPPOSE hypothesis
- Created from DISCHARGE conclusion

**RA-Nodes (Rule Application Nodes)**:
- Created from THEREFORE (premises → conclusion)
- Created from DISCHARGE (hypothesis → conclusion)
- **NOT created from SUPPOSE alone** (waits for DISCHARGE)

**CA-Nodes (Conflict Application Nodes)**:
- **NOT created by structural moves**
- Created by WHY/GROUNDS objections
- Created by direct attack modals (AttackMenuProV2, AttackCreationModal)

**AIF Graph Example**:
```
THEREFORE Move:
I-node(P1: "CO2 traps heat")
I-node(P2: "CO2 rising")
  ↓ (premise edges)
RA-node(R1: "THEREFORE inference")
  ↓ (conclusion edge)
I-node(C: "Temperature increases")

ASPIC+ Translation:
R_d += {P1, P2} ⇒ C
  (Defeasible rule from THEREFORE)
```

---

## Part 3: Comparison with Attack Creation

### 3.1 DialogueActionsModal Categories

**Current Organization**:
```
DialogueActionsModal
  ├── Protocol Tab
  │   ├── WHY (challenge)
  │   ├── GROUNDS (respond)
  │   ├── CONCEDE (accept)
  │   ├── RETRACT (withdraw)
  │   ├── CLOSE (end)
  │   └── ACCEPT_ARGUMENT (accept)
  │
  ├── Structural Tab
  │   ├── THEREFORE (inference)
  │   ├── SUPPOSE (hypothesis)
  │   └── DISCHARGE (conclude hypothesis)
  │
  └── CQs Tab
      └── CQContextPanel (scheme-specific CQs)
```

**Purpose Differentiation**:

| Tab | Purpose | Creates Attacks? | Creates Arguments? |
|-----|---------|-----------------|-------------------|
| **Protocol** | Dialogue management (WHY → GROUNDS creates attacks) | ✅ Indirect (via WHY/GROUNDS) | ⚠️ Indirect (GROUNDS can create arguments) |
| **Structural** | Argument construction (inference, hypotheticals) | ❌ No | ✅ Yes (RA-nodes) |
| **CQs** | Scheme-specific challenges | ✅ Indirect (via WHY/GROUNDS) | ❌ No |

---

### 3.2 AttackCreationModal vs Structural Moves

**AttackCreationModal**:
- **Purpose**: Direct ASPIC+ attack creation
- **Target**: Existing arguments or claims
- **Output**: ConflictApplication → CA-node → ASPIC+ attack
- **Use Case**: Fast attack creation, ad-hoc arguments

**Structural Moves (THEREFORE/SUPPOSE/DISCHARGE)**:
- **Purpose**: Constructive argumentation (build new arguments)
- **Target**: Dialogue thread (construct inference chains)
- **Output**: RA-nodes (defeasible rules) in AIF graph
- **Use Case**: Formal debates, conditional reasoning, multi-premise arguments

**Complementary Relationship**:
```
User Flow 1: Constructive → Destructive
  1. Use THEREFORE to build multi-premise argument (RA-node)
  2. Opponent uses AttackCreationModal to UNDERCUT inference (CA-node)
  3. ASPIC+ evaluates: Attack succeeds → Argument labeled OUT

User Flow 2: Hypothetical → Challenge
  1. Use SUPPOSE to open hypothetical scope
  2. Build claims within hypothesis
  3. Use DISCHARGE to create conditional rule (RA-node)
  4. Opponent uses WHY on DISCHARGE (challenge conditional)
  5. GROUNDS response creates ConflictApplication (CA-node)
```

---

### 3.3 When to Use Each

| Use Case | Tool | Rationale |
|----------|------|-----------|
| **Build multi-premise argument** | THEREFORE (DialogueActionsModal) | Creates RA-node with explicit premises |
| **Conditional policy analysis** | SUPPOSE + DISCHARGE (DialogueActionsModal) | Hypothetical reasoning |
| **Quick attack on argument** | AttackCreationModal | Direct ASPIC+ attack creation |
| **Scheme-specific challenge** | SchemeSpecificCQsModal | CQ-driven dialogue |
| **Challenge any claim** | WHY (DialogueActionsModal) | Generic challenge |
| **Respond to challenge** | GROUNDS (DialogueActionsModal) | Provide evidence |

---

## Part 4: Recommendations

### 4.1 Keep Structural Tab in DialogueActionsModal ✅

**Rationale**:
1. **Enables advanced argumentation** (multi-premise, conditional reasoning)
2. **Pedagogical value** (teach natural deduction in dialogue)
3. **Already implemented** in Ludics engine (compileFromMoves.ts)
4. **Complements attack creation** (build arguments, then attack them)
5. **Used in formal debates** (structured argumentation)

**However**:
- **NOT needed for Phase F** (attack creation focus)
- **NOT frequently used** (most users won't need THEREFORE/SUPPOSE)
- **Advanced feature** (expert users only)

---

### 4.2 Phase F Priorities

**Focus on Direct Attacks**:
1. ✅ Remove AttackMenuProV2 from ArgumentCardV2 (redundant)
2. ✅ Fix AttackCreationModal API error (GET /api/arguments)
3. ✅ Enhance AttackCreationModal with PropositionComposerPro
4. ⏳ Add DialogueActionsButton to individual premises (element-level dialogue)
5. ⏳ Test attack creation workflow

**De-prioritize Structural Moves** (for Phase F):
- Keep in DialogueActionsModal (don't remove)
- Don't add structural move buttons to ArgumentCardV2
- Focus user education on WHY/GROUNDS dialogue (more common)

---

### 4.3 User Education Strategy

**Three Tiers of Argumentation**:

**Tier 1: Basic (Most Users)**
- **Tools**: AttackCreationModal, SchemeSpecificCQsModal
- **Actions**: Direct attacks, CQ-driven dialogue
- **Learning**: ASPIC+ attack types (UNDERMINES/REBUTS/UNDERCUTS)

**Tier 2: Intermediate (Dialogue Users)**
- **Tools**: DialogueActionsButton (WHY/GROUNDS)
- **Actions**: Challenge claims, provide evidence
- **Learning**: Dialogue protocol, burden of proof

**Tier 3: Advanced (Formal Debaters)**
- **Tools**: DialogueActionsModal (Structural tab)
- **Actions**: THEREFORE (multi-premise), SUPPOSE (hypotheticals)
- **Learning**: Natural deduction, conditional reasoning

---

### 4.4 UI Organization (Final Recommendation)

**DialogueActionsModal Tabs** (Keep as-is):
```
[Protocol] [Structural] [CQs]

Protocol Tab:
  • WHY - Challenge claim
  • GROUNDS - Provide evidence
  • CONCEDE - Accept point
  • RETRACT - Withdraw claim
  • CLOSE - End dialogue
  • ACCEPT_ARGUMENT - Accept argument

Structural Tab: (ADVANCED - Keep but don't emphasize)
  • THEREFORE - Assert inference conclusion
  • SUPPOSE - Open hypothetical scope
  • DISCHARGE - Close hypothesis

CQs Tab: (Argument targets only)
  • CQContextPanel - Scheme-specific CQs
```

**ArgumentCardV2 Actions** (Simplified for Phase F):
```
Header (Element-Level):
  • DialogueProvenanceBadge
  • StaleArgumentBadge
  • ConfidenceDisplay
  • View Scheme button
  • CQStatusPill (claim CQs)
  • DialogueActionsButton (WHY/GROUNDS/CONCEDE) ← Element-level dialogue
  • [NO Attack button here - use footer]

Footer (Argument-Level):
  • PreferenceQuick
  • AttackCreationModal ← Direct ASPIC+ attacks
  • CommunityDefenseMenu
  • ClarificationRequestButton
  • SchemeSpecificCQsModal (if scheme exists)
  • PromoteToClaimButton
  • Share button
```

---

## Part 5: Code Examples

### 5.1 THEREFORE Usage Example

**User Action**:
```
Speaker A clicks "Dialogue" button
  ↓
DialogueActionsModal opens
  ↓
Click "Structural" tab
  ↓
Click "THEREFORE" button
  ↓
StructuralMoveModal opens: "Enter your conclusion:"
  ↓
User types: "Therefore, climate action is urgent"
  ↓
Submit
```

**Backend Flow**:
```typescript
POST /api/dialogue/move
{
  deliberationId: "climate-debate",
  targetType: "argument",
  targetId: "arg123",
  kind: "THEREFORE",
  locusPath: "0.2",
  payload: {
    expression: "Therefore, climate action is urgent"
  }
}

↓ DialogueMove created

↓ Ludics recompilation triggered

↓ compileFromMoves.ts processes THEREFORE

↓ Creates LudicAct (PROPER)

↓ syncLudicsToAif.ts creates RA-node

↓ AIF graph updated with new inference rule

↓ ASPIC+ evaluation includes new rule in R_d
```

---

### 5.2 SUPPOSE + DISCHARGE Usage Example

**User Action**:
```
Speaker A: "SUPPOSE carbon tax is $100/ton" (opens hypothesis)
Speaker B: "Then emissions would drop 20%" (within hypothesis)
Speaker A: "But GDP would decline 2%" (within hypothesis)
Speaker A: "DISCHARGE: Carbon tax trades emissions for GDP" (conclusion)
```

**AIF Graph Result**:
```
I-node: "SUPPOSE carbon tax $100/ton" (hypothetical=true)
  ↓
I-node: "Emissions drop 20%" (hypothetical=true)
I-node: "GDP declines 2%" (hypothetical=true)
  ↓
RA-node: "DISCHARGE conditional rule"
  ↓
I-node: "Carbon tax trades emissions for GDP" (hypothetical=false)
```

**ASPIC+ Translation**:
```typescript
// Defeasible rule created from DISCHARGE
R_d += {
  premises: ["Carbon tax $100/ton"],
  conclusion: "Trades emissions for GDP",
  type: "conditional_inference"
}
```

---

## Part 6: Summary

### Key Takeaways

1. **Structural moves are COMPLEMENTARY to ASPIC+**, not core attack operations
2. **THEREFORE creates RA-nodes** (defeasible inference rules)
3. **SUPPOSE/DISCHARGE enable hypothetical reasoning** (conditional rules)
4. **NOT needed for Phase F** (focus on direct attack creation)
5. **Keep in DialogueActionsModal** (advanced feature for formal debates)
6. **Don't add to ArgumentCardV2 footer** (UI clutter)

### Integration Status

| Component | Implemented? | ASPIC+ Integration | Phase F Priority |
|-----------|-------------|-------------------|----------------|
| **THEREFORE** | ✅ Yes | Via RA-nodes | Low |
| **SUPPOSE** | ✅ Yes | Hypothetical I-nodes | Low |
| **DISCHARGE** | ✅ Yes | Via conditional RA-nodes | Low |
| **WHY** | ✅ Yes | Indirect (challenge) | High |
| **GROUNDS** | ✅ Yes | Indirect (creates CA-nodes) | High |
| **AttackCreationModal** | ✅ Yes | Direct (creates CA-nodes) | **Critical** |

### Recommended Action for Phase F

**DO**:
- ✅ Keep structural moves in DialogueActionsModal "Structural" tab
- ✅ Focus user education on WHY/GROUNDS (more common)
- ✅ Prioritize AttackCreationModal enhancements
- ✅ Add DialogueActionsButton to premises (element-level dialogue)

**DON'T**:
- ❌ Add THEREFORE/SUPPOSE/DISCHARGE buttons to ArgumentCardV2 footer
- ❌ Emphasize structural moves in beginner docs
- ❌ Remove structural tab (it's useful for advanced users)

### Final Verdict

**Structural moves are valuable for advanced argumentation, but NOT essential for Phase F attack creation workflow.** Keep them in DialogueActionsModal, but don't add UI clutter to argument cards. Focus on:
1. Direct attacks (AttackCreationModal)
2. CQ-driven dialogue (SchemeSpecificCQsModal)
3. Element-level WHY/GROUNDS (DialogueActionsButton)

These three tools cover 95% of user needs. Structural moves serve the remaining 5% (formal debaters, conditional reasoning, pedagogical contexts).
