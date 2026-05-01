# SchemeSpecificCQsModal - Conceptual Analysis & Purpose Alignment

## Executive Summary

**Current Issue**: The `SchemeSpecificCQsModal` component has adopted UX patterns from `CriticalQuestionsV3` that may not align with its fundamentally different purpose within the deliberation system.

**Core Discovery**: These are **two distinct systems** serving different layers of argumentation:
- **CriticalQuestionsV3**: Claim-level CQs (testing assertion validity)
- **SchemeSpecificCQsModal**: Argument-level CQs (testing reasoning structure)

---

## Part 1: Conceptual Mapping

### 1.1 CriticalQuestionsV3 (Claim-Level CQs)

**Location**: `components/claims/CriticalQuestionsV3.tsx`

**Target**: Individual **claims** (atomic propositions)

**Purpose**: Test the **validity and support** of a specific assertion

**Conceptual Model**:
```
Claim: "Renewable energy reduces carbon emissions"
├─ CQ1: What evidence supports this?
├─ CQ2: Are there counterexamples?
└─ CQ3: How significant is the reduction?
```

**User Mental Model**:
- "Is this claim true?"
- "What grounds support/challenge this?"
- "Should I believe this assertion?"

**Interaction Pattern**:
1. **Author answers** by providing grounds (text explanations)
2. **Community challenges** by attaching counter-claims
3. **Result**: Satisfied/unsatisfied status tracked in `CQStatus`

**Key Characteristic**: **Claim-centric** - focuses on the truth/acceptability of a single proposition

---

### 1.2 SchemeSpecificCQsModal (Argument-Level CQs)

**Location**: `components/arguments/SchemeSpecificCQsModal.tsx`

**Target**: **Arguments** (structured reasoning with scheme + premises + conclusion)

**Purpose**: Test the **logical validity and structural soundness** of the reasoning scheme

**Conceptual Model**:
```
Argument (Expert Opinion Scheme):
  Premise 1: Dr. Smith is an expert in climate science
  Premise 2: Dr. Smith says X
  Conclusion: X is probably true
  
Scheme CQs:
├─ CQ1: Is Dr. Smith really an expert? [UNDERMINES premise 1]
├─ CQ2: Is Dr. Smith biased? [UNDERCUTS inference]
└─ CQ3: Do other experts disagree? [REBUTS conclusion]
```

**User Mental Model**:
- "Is this reasoning pattern valid?"
- "Are there exceptions to this inference rule?"
- "Do the premises actually support the conclusion?"

**Interaction Pattern**:
1. **Author answers** by creating **formal attacks** (REBUTS/UNDERCUTS/UNDERMINES)
2. **Community participates** via responses to those attacks
3. **Result**: Formal AIF attack edges created in the argument graph

**Key Characteristic**: **Structure-centric** - focuses on the logical architecture of reasoning

---

## Part 2: Fundamental Differences

### 2.1 Semantic Level

| Aspect | CriticalQuestionsV3 | SchemeSpecificCQsModal |
|--------|-------------------|----------------------|
| **Target** | Claim (proposition) | Argument (reasoning structure) |
| **Question Focus** | "Is this true?" | "Is this reasoning valid?" |
| **Answer Type** | Evidence/grounds text | Formal attack structures |
| **Granularity** | Atomic assertion | Complex inference |

### 2.2 Formal Representation

**CriticalQuestionsV3**:
```typescript
// Claims live at the "object level"
Claim → CQStatus → { satisfied: boolean, groundsText: string }
```

**SchemeSpecificCQsModal**:
```typescript
// Arguments live at the "meta level" (reasoning about reasoning)
Argument → Scheme → CQ → AttackType → ConflictApplication
  ├─ REBUTS: challenges conclusion
  ├─ UNDERCUTS: challenges inference
  └─ UNDERMINES: challenges premise
```

### 2.3 Dialectical Role

**CriticalQuestionsV3**:
- **Defensive**: Author defends their claim against challenges
- **Burden**: Author must show grounds
- **Outcome**: Claim accepted/rejected

**SchemeSpecificCQsModal**:
- **Proactive**: Author demonstrates robustness by addressing weaknesses
- **Constructive**: Author anticipates objections
- **Outcome**: Argument structure strengthened/weakened

---

## Part 3: Current Implementation Analysis

### 3.1 What's Working

✅ **Author/Community Role Separation**
- Clear distinction between author (creates attacks) and community (discusses)
- Appropriate permission guards

✅ **Attack Type Specificity**
- REBUTS/UNDERCUTS/UNDERMINES properly distinguished
- Each has appropriate UI affordances

✅ **Provenance Tracking**
- Scheme inheritance properly visualized
- Dialogue move integration complete

### 3.2 What's Misaligned

❌ **Problem 1: Mimicking Claim-Level UX**

Current pattern borrowed from CriticalQuestionsV3:
```tsx
// BORROWED: "Mark as satisfied" toggle
<button onClick={() => toggleCQ(scheme.key, cq.key, !cq.satisfied)}>
  Mark as satisfied
</button>

// BORROWED: "Provide grounds" text input
<Textarea placeholder="Your answer..." />
<Button>Submit Answer & Mark Satisfied</Button>
```

**Why this doesn't fit**:
- Argument CQs aren't "satisfied" by text explanations
- They're addressed by **creating formal attack structures**
- The binary satisfied/unsatisfied model oversimplifies
- Users expect to build argument graph edges, not write prose

❌ **Problem 2: Conflating Answer Types**

Current flow suggests CQs are "answered" similarly to claim CQs:
```
User clicks "Answer This Question"
  ↓
[Text box appears - like CriticalQuestionsV3]
  ↓
User types explanation
  ↓
CQ marked "satisfied"
```

**Correct flow should be**:
```
User clicks "Address This CQ"
  ↓
[Attack builder appears - unique to SchemeSpecificCQsModal]
  ↓
User selects attack type + target
  ↓
ConflictApplication created in graph
```

❌ **Problem 3: Modal Title/Framing**

Current: "Critical Questions" (generic, like CriticalQuestionsV3)

More appropriate: 
- "Argument Structure Challenges"
- "Scheme Validity Tests"
- "Inference Examination"

❌ **Problem 4: Help Text Confusion**

Current help text:
> "These questions test the strength of the argument scheme. Answer them as objections to challenge the argument."

This is contradictory:
- "test the strength" = defensive (like claim CQs)
- "answer them as objections" = offensive (argument attacks)

### 3.3 What's Missing

🚫 **Visual Representation of Attack Structure**

Users should see:
```
CQ: "Is the expert biased?"
  ↓ UNDERCUTS
Argument Inference Rule
  ↓ affects
Confidence/Acceptability Score
```

Current UI doesn't show this connection clearly.

🚫 **Relationship to Toulmin Structure**

Scheme CQs map to Toulmin elements:
- REBUTS → challenges **Claim**
- UNDERCUTS → challenges **Warrant**
- UNDERMINES → challenges **Data/Backing**

This mapping should be visualized.

🚫 **Preview of Impact**

When addressing a CQ, show:
- "This will create an UNDERCUT attack"
- "This will reduce argument strength by ~X%"
- "This affects [N] dependent arguments"

---

## Part 4: Ideal Purpose & Design

### 4.1 Core Purpose (Revised)

**SchemeSpecificCQsModal should be**:

> **An interactive argument structure auditor** that enables authors to proactively identify and address potential weaknesses in their reasoning by constructing formal attack-defense structures within the AIF graph.

**Not**:
- ❌ A claim evidence collector (that's CriticalQuestionsV3)
- ❌ A discussion forum (that's Community Responses)
- ❌ A simple checklist (that's oversimplification)

### 4.2 Ideal User Experience

**Phase 1: Understanding** (Author views CQ)
```
┌─────────────────────────────────────────────┐
│ CQ: Is the expert biased?                   │
│                                              │
│ [Diagram showing attack path]               │
│   Your Argument                             │
│      ↓ (uses Premise 1)                     │
│   "Dr. Smith is expert"                     │
│      ↓ UNDERCUT ←─ [This CQ challenges]    │
│   Inference Rule                            │
│      ↓                                       │
│   Conclusion                                │
│                                              │
│ Impact: High (core premise)                 │
│ Already addressed: 0 attacks               │
└─────────────────────────────────────────────┘
```

**Phase 2: Construction** (Author addresses CQ)
```
┌─────────────────────────────────────────────┐
│ Build Attack to Address CQ                  │
│                                              │
│ Attack Type: [UNDERCUT] ← (suggested)       │
│                                              │
│ Target: Inference Rule ✓                    │
│                                              │
│ Exception Claim:                            │
│ [Select existing] [Create new]             │
│                                              │
│ Preview:                                     │
│ ┌──────────────────────┐                   │
│ │ Exception created    │                    │
│ │   ↓ UNDERCUTS        │                    │
│ │ Your Inference       │                    │
│ │   ↓ (weakened 40%)   │                    │
│ │ Conclusion           │                    │
│ └──────────────────────┘                   │
│                                              │
│ [Build Attack Structure]                    │
└─────────────────────────────────────────────┘
```

**Phase 3: Community Dialogue**
```
┌─────────────────────────────────────────────┐
│ Author's Defense: UNDERCUT created          │
│ ├─ Exception: "Unless financial conflict"  │
│ └─ Status: Graph updated                    │
│                                              │
│ Community Discussion (3 responses)          │
│ ├─ @user1: "This exception is valid"       │
│ ├─ @user2: "But what about..."            │
│ └─ [Add your perspective]                   │
└─────────────────────────────────────────────┘
```

### 4.3 Proposed Component Sections

```tsx
<SchemeSpecificCQsModal>
  {/* SECTION 1: Scheme Overview */}
  <SchemeCard
    name={scheme.name}
    premises={premises}
    conclusion={conclusion}
    inferenceRule={inferenceRule}
  />
  
  {/* SECTION 2: CQ Auditor */}
  <CQAuditor>
    {cqs.map(cq => (
      <CQAttackBuilder
        cq={cq}
        attackType={cq.attackType}
        targetScope={cq.targetScope}
        
        {/* Show formal structure, not prose */}
        onBuildAttack={handleBuildAttack}
        
        {/* Preview impact on graph */}
        previewMode={true}
        
        {/* Link to affected elements */}
        linkedPremises={...}
        linkedInference={...}
      />
    ))}
  </CQAuditor>
  
  {/* SECTION 3: Community Layer */}
  <CommunityDialogue>
    {/* Discuss the ATTACK STRUCTURES, not the CQs directly */}
    <AttackDiscussion attackId={...} />
  </CommunityDialogue>
</SchemeSpecificCQsModal>
```

---

## Part 5: Recommendations

### 5.1 Immediate Changes (High Priority)

1. **Rename "Answer" → "Address"**
   - "Answer This Question" → "Address This Challenge"
   - Emphasizes constructive response, not prose explanation

2. **Remove Satisfied/Unsatisfied Toggle**
   - Replace with attack structure completion status
   - "Addressed: 0/3 attacks built"

3. **Visualize Attack Structure**
   - Show Toulmin diagram with attack paths
   - Highlight which component the CQ targets

4. **Clarify Help Text**
   ```
   OLD: "Answer them as objections to challenge the argument"
   NEW: "Address weaknesses by building defensive attack structures that demonstrate robustness"
   ```

5. **Separate Author Actions from Community Discussion**
   - Author section: "Build Attack Structures"
   - Community section: "Discuss Attack Validity"

### 5.2 Medium-Term Enhancements

6. **Impact Preview System**
   - Show confidence score changes
   - Visualize graph effects
   - Highlight dependent arguments

7. **Attack Structure Wizard**
   - Step-by-step builder
   - Guided target selection
   - Template suggestions

8. **Toulmin Mapping**
   - Visual scheme → Toulmin converter
   - Interactive premise/warrant/backing selection
   - Attack → element correspondence

### 5.3 Long-Term Vision

9. **Integrated Argument Workbench**
   - Merge with ArgumentActionsSheet
   - Unified argument construction/defense interface
   - Live graph preview

10. **AI Assistance**
    - Suggest exception claims for UNDERCUTS
    - Recommend counter-claims for REBUTS
    - Identify weak premises for UNDERMINES

---

## Part 6: Migration Strategy

### Phase A: De-coupling (1-2 days)

✅ **Task 1**: Remove CriticalQuestionsV3-style patterns
- Remove text-based "grounds" input
- Remove satisfied/unsatisfied toggle
- Update terminology

✅ **Task 2**: Clarify attack construction flow
- Emphasize formal structure creation
- Add visual attack previews
- Improve attack type affordances

### Phase B: Specialization (3-4 days)

✅ **Task 3**: Add scheme-specific UI elements
- Toulmin diagram integration
- Attack path visualization
- Impact preview system

✅ **Task 4**: Enhance attack builder
- Multi-step wizard
- Target selection improvements
- Template system

### Phase C: Integration (2-3 days)

✅ **Task 5**: Connect to broader argument system
- ArgumentActionsSheet coordination
- Graph visualization updates
- Confidence score integration

✅ **Task 6**: Community layer refinement
- Focus discussion on attack structures
- Separate CQ meta-discussion from attack evaluation
- Add endorsement for attack strategies

---

## Part 7: Key Insights

### 7.1 Why the Confusion Happened

The systems **superficially appear similar**:
- Both use "Critical Questions" terminology
- Both involve author/community roles
- Both have answered/unanswered states

But they operate at **different levels of abstraction**:
- CriticalQuestionsV3: Object-level (claims about the world)
- SchemeSpecificCQsModal: Meta-level (reasoning about reasoning)

### 7.2 The Crucial Distinction

**CriticalQuestionsV3 asks**: "What evidence supports this claim?"
- Answer: Text, citations, grounds

**SchemeSpecificCQsModal asks**: "What structural weaknesses exist in this reasoning?"
- Answer: Formal attack graph edges

### 7.3 Design Principle

> **Claim CQs are defensive** (proving truth)  
> **Argument CQs are constructive** (building robustness)

This fundamental difference should drive every UI decision.

---

## Conclusion

The `SchemeSpecificCQsModal` is currently caught between two paradigms. To serve its true purpose as an **argument structure auditor**, it needs to:

1. ❌ **Stop** mimicking claim-level CQ patterns
2. ✅ **Start** emphasizing formal attack construction
3. ✅ **Visualize** the argument graph impact
4. ✅ **Guide** users through structure building

The path forward is clear: embrace its unique role as the interface for **proactive argument fortification through formal attack structure creation**.

---

## Next Steps

Would you like me to:

1. **Implement Phase A** (de-coupling from CriticalQuestionsV3 patterns)?
2. **Design mockups** for the specialized attack builder UI?
3. **Create detailed specifications** for the Toulmin visualization?
4. **Prototype** the impact preview system?

Each would strengthen the component's alignment with its true purpose in the deliberation system.
