# Thesis Builder Architecture — Visual Reference

## Current State: Atomic Primitives

```
┌─────────────────────────────────────────────────────┐
│  DELIBERATION                                       │
│                                                     │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐  │
│  │  Claim   │────▶│ Argument │────▶│  Claim   │  │
│  │   (I)    │     │   (RA)   │     │   (I)    │  │
│  └──────────┘     └──────────┘     └──────────┘  │
│       │                  │                │        │
│       │                  │                │        │
│  ┌────▼────┐        ┌───▼───┐       ┌───▼────┐  │
│  │ Label:  │        │ CQs:  │       │ Label: │  │
│  │   IN    │        │  3/5  │       │  OUT   │  │
│  └─────────┘        └───────┘       └────────┘  │
│                                                     │
│  PROBLEMS:                                          │
│  • Hard to compose multi-step reasoning            │
│  • No "case building" primitive                    │
│  • Can't mix formal + informal effectively         │
└─────────────────────────────────────────────────────┘
```

---

## Proposed Architecture: Three-Layer Composition

```
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 3: COMPOSITION (High-level case building)                 │
│                                                                   │
│  ┌─────────────────────┐         ┌────────────────────────┐     │
│  │   TheoryWork        │         │      Brief             │     │
│  │   (Academic)        │         │   (Legal/Debate)       │     │
│  │                     │         │                        │     │
│  │  Section 1: Prose   │         │  Thesis Claim          │     │
│  │  Section 2: Claims  │         │                        │     │
│  │  Section 3: Args    │         │  ┌──────────────────┐ │     │
│  │  Section 4: Prose   │         │  │ Prong 1: Support │ │     │
│  │                     │         │  │  - Arg Chain     │ │     │
│  │  Theory Type:       │         │  │  - Prose Frame   │ │     │
│  │  [DN|IH|TC|OP]      │         │  └──────────────────┘ │     │
│  │                     │         │  ┌──────────────────┐ │     │
│  └──────────┬──────────┘         │  │ Prong 2: Rebut   │ │     │
│             │                     │  │  - Counter Chain │ │     │
│             │                     │  └──────────────────┘ │     │
│             │                     │  ┌──────────────────┐ │     │
│             │                     │  │ Prong 3: Preempt │ │     │
│             │                     │  └──────────────────┘ │     │
│             │                     └──────────┬─────────────┘     │
│             │                                │                   │
│             └────────────────┬───────────────┘                   │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               │ REFERENCES (not extends)
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│  LAYER 2: ARGUMENTS (AIF-compliant logical units)                │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Argument (RA node)                                       │   │
│  │                                                           │   │
│  │  Premises:     [Claim #1, Claim #2, Claim #3]            │   │
│  │  Conclusion:   Claim #4                                   │   │
│  │  Scheme:       "Expert Opinion"                           │   │
│  │  CQs:          3/5 answered                               │   │
│  │                                                           │   │
│  │  Attacks:                                                 │   │
│  │  - Arg #99 → REBUTS conclusion (Claim #4)                │   │
│  │  - Arg #88 → UNDERCUTS inference                          │   │
│  │                                                           │   │
│  └───────────────────────────┬───────────────────────────────┘   │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               │ COMPOSED FROM
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│  LAYER 1: CLAIMS (Atomic truth-bearers)                          │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Claim #1 │  │ Claim #2 │  │ Claim #3 │  │ Claim #4 │        │
│  │  (I node)│  │  (I node)│  │  (I node)│  │  (I node)│        │
│  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤        │
│  │ Label:   │  │ Label:   │  │ Label:   │  │ Label:   │        │
│  │   IN     │  │   IN     │  │  UNDEC   │  │   OUT    │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                   │
│  • Semantic labeling (grounded/preferred semantics)              │
│  • ClaimEdges (supports/rebuts/undercuts/undermines)             │
│  • Citations, evidence, sources                                  │
└───────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Creating a Brief

### Step 1: User creates atomic claims (Layer 1)
```
User: "Climate change is anthropogenic"
System: Creates Claim #c_100, deliberation participants discuss
Result: Label = IN (grounded)

User: "Carbon tax reduces emissions"
System: Creates Claim #c_101
Result: Label = IN

User: "Carbon tax is economically viable"
System: Creates Claim #c_102
Result: Label = UNDEC (controversial)
```

### Step 2: User creates arguments (Layer 2)
```
User: Combines claims into argument
System: Creates Argument #a_200
  - Premises: [c_100, c_101, c_102]
  - Conclusion: c_103 ("We should implement carbon tax")
  - Scheme: Practical Reasoning
  - CQs: 4/6 answered

Other users challenge via dialogue moves:
  - WHY on premise c_102
  - GROUNDS response with evidence
  - Result: CQs 5/6 answered
```

### Step 3: User assembles brief (Layer 3)
```
User: Creates Brief "Policy Case for Carbon Tax"
  - Thesis: Claim #c_103
  
  - Prong 1: "Climate Urgency" (SUPPORT)
    - Intro prose: "The science is clear..."
    - Argument chain: [a_200, a_201, a_202]
    - Conclusion prose: "Thus, action is imperative."
  
  - Prong 2: "Economic Feasibility" (SUPPORT)
    - Argument chain: [a_300, a_301]
  
  - Prong 3: "Addresses Cost Objection" (PREEMPT)
    - Opposing arg: a_999 (embedded for context)
    - Counter chain: [a_400, a_401]

System: Renders as polished brief with:
  - Table of contents
  - Each prong shows logical skeleton + prose
  - Claims display with current labels
  - Export to PDF available
```

---

## Comparison: Current Articles vs. Proposed Models

### Current Articles
```
┌────────────────────────────────────────┐
│  Article (Pure Prose)                  │
│                                        │
│  Title: "Why We Need Climate Action"  │
│                                        │
│  [Rich text editor - TipTap]           │
│  - Paragraphs                          │
│  - Images                              │
│  - Formatting                          │
│  - NO links to verified claims         │
│  - NO formal argument structure        │
│  - NO semantic grounding               │
│                                        │
│  Use case: Blog posts, essays          │
└────────────────────────────────────────┘
```

### Proposed TheoryWork
```
┌─────────────────────────────────────────────────┐
│  TheoryWork (DN — Empirical)                    │
│                                                 │
│  Title: "Climate Action: An Empirical Case"    │
│  Theory Type: DN (Descriptive-Nomological)      │
│                                                 │
│  Section 1: Introduction (PROSE)               │
│  ┌─────────────────────────────────────┐       │
│  │ [TipTap: "This paper demonstrates..."]│      │
│  └─────────────────────────────────────┘       │
│                                                 │
│  Section 2: Empirical Evidence (CLAIM_BLOCK)   │
│  ┌─────────────────────────────────────┐       │
│  │ Claim #c_100: "Climate change is     │       │
│  │               anthropogenic"         │       │
│  │ Label: IN (grounded)                 │       │
│  │ Cited by: [a_200, a_201]             │       │
│  │ Attacked by: [a_999 (rebuts)]        │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  Section 3: Causal Mechanism (ARGUMENT_BLOCK)  │
│  ┌─────────────────────────────────────┐       │
│  │ Argument #a_200                      │       │
│  │ Scheme: Causal Explanation           │       │
│  │ Premises: [c_100, c_101, c_102]      │       │
│  │ Conclusion: c_103                    │       │
│  │ CQs: 5/6 ✓                           │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  Section 4: Discussion (PROSE)                 │
│  ┌─────────────────────────────────────┐       │
│  │ [TipTap: "These findings suggest..."]│      │
│  └─────────────────────────────────────┘       │
│                                                 │
│  Export: PDF dossier with annotations          │
└─────────────────────────────────────────────────┘
```

### Proposed Brief
```
┌──────────────────────────────────────────────────┐
│  Brief (Legal Defense)                           │
│                                                  │
│  Title: "In Defense of Carbon Tax Policy"       │
│  Template: Policy Case                          │
│  Thesis: Claim #c_103                           │
│         "We should implement carbon tax"        │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ INTRODUCTION (prose)                       │ │
│  │ "This brief presents three independent    │ │
│  │  lines of reasoning..."                   │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ PRONG 1: Climate Urgency (SUPPORT)        │ │
│  │                                            │ │
│  │ Intro: "The science is clear..."          │ │
│  │                                            │ │
│  │ Argument Chain:                            │ │
│  │  1. Arg #a_200: Scientific consensus      │ │
│  │     ├─ Premise: c_100 (IN)                │ │
│  │     ├─ Premise: c_101 (IN)                │ │
│  │     └─ Conclusion: c_103                  │ │
│  │     CQs: 5/6 ✓                            │ │
│  │                                            │ │
│  │  2. Arg #a_201: Modeling results          │ │
│  │     └─ ... (similar structure)             │ │
│  │                                            │ │
│  │ Conclusion: "Thus, urgency justified."    │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ PRONG 2: Economic Feasibility (SUPPORT)   │ │
│  │  ... (similar structure)                   │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ PRONG 3: Costs Objection (PREEMPT)        │ │
│  │                                            │ │
│  │ Opposing Argument (for context):          │ │
│  │  Arg #a_999: "Carbon tax harms economy"   │ │
│  │                                            │ │
│  │ Counter Chain:                             │ │
│  │  1. Arg #a_400: Long-term analysis        │ │
│  │  2. Arg #a_401: Comparison to status quo  │ │
│  │                                            │ │
│  │ Conclusion: "Costs are manageable."       │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ CONCLUSION (prose)                         │ │
│  │ "For these three independent reasons..."  │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  Export: PDF brief with logical annotations     │
└──────────────────────────────────────────────────┘
```

---

## Key Architectural Principles

### 1. Separation of Concerns
```
Claim (Layer 1)
  ↓
  Role: Atomic truth-bearer
  Knows: Text, Label, Evidence
  Doesn't know: How it's used in arguments or compositions

Argument (Layer 2)
  ↓
  Role: Logical inference step
  Knows: Premises, Conclusion, Scheme, CQs
  Doesn't know: Which briefs/theories cite it

Brief/TheoryWork (Layer 3)
  ↓
  Role: Composition container
  Knows: Which claims/arguments to reference, ordering, prose framing
  Doesn't know: Claim labels (reads dynamically), argument internals
```

### 2. Uni-directional Data Flow
```
Layer 3 (Composition)
   │
   │ READS (doesn't modify)
   ↓
Layer 2 (Arguments)
   │
   │ COMPOSED FROM
   ↓
Layer 1 (Claims)
   │
   │ LABELED BY
   ↓
Semantic Evaluation (grounded/preferred)
```

**Benefits**:
- Claims can change labels → Briefs show updated status
- Arguments can be challenged → CQ count updates → Briefs reflect this
- No circular dependencies
- Clear ownership boundaries

### 3. Reference vs. Embedding
```
❌ BAD: Embedding (copies data)
Brief {
  prongs: [
    {
      arguments: [
        { text: "...", premises: [...], conclusion: "..." }  // ← duplicated!
      ]
    }
  ]
}

✅ GOOD: Reference (links to canonical source)
Brief {
  prongs: [
    {
      arguments: [
        { argumentId: "a_200" }  // ← points to Argument table
      ]
    }
  ]
}

On render:
  - Fetch Argument #a_200 from DB
  - Display with current CQ status
  - If status changes, Brief automatically shows updated info
```

---

## Integration with Existing Features

### Dialogue Moves
```
User viewing Brief sees embedded Argument #a_200
  ↓
User clicks "Challenge" button
  ↓
DialogueActionsModal opens (existing component!)
  ↓
User posts WHY move
  ↓
DialogueMove created, linked to Argument #a_200
  ↓
Brief shows: "1 new challenge since publication"
  ↓
Author responds with GROUNDS
  ↓
Brief updates: CQs 4/6 → 5/6
```

### Semantic Labeling
```
Claim #c_100 initially labeled IN (grounded)
  ↓
New attack posted (Argument #a_999 rebuts c_100)
  ↓
Semantic evaluation runs (cron job or on-demand)
  ↓
Label changes: IN → UNDEC
  ↓
Briefs citing c_100 show warning icon ⚠️
  ↓
"Claim #c_100 status changed. Review brief."
```

### Citations
```
Brief cites Argument #a_200
  ↓
Argument #a_200 has sources: [source1.pdf, source2.org]
  ↓
Brief's bibliography auto-generates from all cited arguments
  ↓
Export PDF includes full bibliography
```

---

## Example Use Cases

### Use Case 1: Legal Brief
```
Scenario: Public defender creating defense brief

Steps:
1. Create thesis: "Defendant is not guilty of theft"
2. Create Prong 1: "Alibi" (SUPPORT)
   - Add eyewitness testimony arguments
   - Add time-stamped evidence claims
3. Create Prong 2: "Lack of Intent" (SUPPORT)
   - Add legal standard argument
   - Add behavioral analysis argument
4. Create Prong 3: "Prosecution Evidence Flawed" (REBUT)
   - Reference prosecution's argument (imported)
   - Add counter-arguments attacking premises
5. Write introduction and conclusion prose
6. Export to PDF for court filing

Result: Multi-pronged defense with formal logical skeleton + persuasive prose
```

### Use Case 2: Policy White Paper
```
Scenario: Think tank creating policy recommendation

Steps:
1. Create TheoryWork (DN type)
2. Write Section 1: Executive Summary (prose)
3. Add Section 2: Empirical Evidence (claim blocks)
   - Import verified claims from multiple deliberations
   - Show semantic labels to establish credibility
4. Add Section 3: Causal Analysis (argument blocks)
   - Embed arguments with schemes (Causal Explanation, Statistical Correlation)
   - Show CQ status to demonstrate rigor
5. Write Section 4: Policy Recommendations (prose)
6. Export to PDF with formal annotations

Result: Academically rigorous white paper grounded in verified evidence
```

### Use Case 3: Debate Case
```
Scenario: Debater preparing affirmative case

Steps:
1. Create Brief (Policy Case template)
2. Thesis: "Universal healthcare should be adopted"
3. Prong 1: "Health Outcomes" (SUPPORT)
   - Chain 3 arguments showing improved outcomes
4. Prong 2: "Economic Benefits" (SUPPORT)
   - Chain 2 arguments on cost savings
5. Prong 3: "Addresses Freedom Objection" (PREEMPT)
   - Embed opponent's likely argument
   - Counter with 2 arguments on positive freedom
6. Export to presentation deck (future feature)

Result: Structured debate case ready for tournament
```

---

## Future Extensions

### 1. AI-Assisted Composition
```
User: Creates thesis claim
AI: Suggests potential prongs based on:
  - Existing arguments in deliberation
  - Common argumentation patterns
  - Critical questions for thesis's scheme

User: Accepts suggestion for Prong 1
AI: Recommends argument chain order based on:
  - Logical dependencies (premises → conclusions)
  - Rhetorical effectiveness (strong arguments first)

User: Writes prose introduction
AI: Suggests improvements:
  - "Consider citing Claim #c_100 here for credibility"
  - "This paragraph could benefit from formal grounding"
```

### 2. Collaborative Editing
```
TheoryWork: Multiple authors can contribute sections
  - Author A: Empirical evidence section
  - Author B: Theoretical framework section
  - Author C: Synthesis section
  
Brief: Co-counsels on legal team
  - Lawyer A: Prong 1 (alibi)
  - Lawyer B: Prong 2 (intent)
  - Lawyer C: Introduction/conclusion

Conflict resolution: Version control per section
```

### 3. Interactive Exploration
```
Reader viewing Brief clicks on Claim #c_100
  ↓
Modal opens showing:
  - Full claim text
  - Semantic label with explanation
  - Support/attack graph
  - Dialogue history
  - "Challenge this claim" button

Reader clicks on Argument #a_200
  ↓
Modal shows:
  - Argument scheme details
  - Critical questions (answered/unanswered)
  - Alternative schemes considered
  - "Provide grounds for CQ #3" button
```

### 4. Cross-Deliberation Networks
```
Brief A (Deliberation 1) cites Claim #c_100
Brief B (Deliberation 2) also cites Claim #c_100
  ↓
System creates link: "Related Briefs"
  ↓
Reader browsing Brief A sees:
  "This claim is also cited in 2 other briefs"
  ↓
Discover network effect:
  - Same evidence used in different contexts
  - Cross-pollination of ideas
  - Identify canonical claims across debates
```

---

## Summary: Why This Architecture Works

✅ **Preserves rigor**: AIF/ASPIC+ compliance maintained at Layer 2  
✅ **Enables complexity**: Layer 3 provides composition without muddying Layer 2  
✅ **Supports use cases**: TheoryWorks for academia, Briefs for advocacy  
✅ **Backward compatible**: Existing features (Articles, Propositions) unchanged  
✅ **Future-proof**: Clear extension points for AI, collaboration, exploration  
✅ **Pedagogically sound**: Users learn incrementally (Claims → Arguments → Compositions)  

The key insight: **Complexity lives in composition, not in the primitives.**

Just like legal briefs have a multi-tiered structure while citing simple statutes and precedents, your system can have sophisticated Briefs/TheoryWorks while keeping Claims and Arguments atomic and AIF-compliant.
