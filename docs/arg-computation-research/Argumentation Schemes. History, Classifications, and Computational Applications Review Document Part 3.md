# Argumentation Schemes: History, Classifications, and Computational Applications
## Detailed Review Document - Part 3

**Document**: Macagno, Walton & Reed (2017)  
**Review Focus**: Section 5 - Using the Schemes: A Classification System  
**Part**: 3 of series (Sections 5+)

---

## Section 5: Using the Schemes: A Classification System

### Overview

Section 5 presents **Walton and Macagno's proposed classification system** based on the pragmatic purpose of argumentation. This system offers a **top-down dichotomic tree** that addresses the multi-dimensional classification problem identified in Section 4. Rather than imposing a single criterion, this approach uses **purpose as the overarching organizing principle**, then systematically divides schemes by the means used to achieve that purpose.

**Key Innovation**: The classification is **both analytical and productive**:
- **Analytical use**: Reconstruct speaker's intention by tracing from generic purpose → specific means → precise scheme
- **Productive use**: Generate arguments by asking purpose-driven questions resembling ancient rhetorical *stasis* theory

**Central Thesis**: Classification should not be taxonomic browsing but **practical navigation** - users select schemes based on *what they're trying to accomplish* (support a decision vs. establish a fact) and *how they want to accomplish it* (internal reasoning vs. external authority).

This section directly validates **Mesh's purpose-driven architecture** and reveals why hierarchical browsing alone is insufficient - users need **multi-entry-point navigation** based on pragmatic goals.

---

### 5.1 The Primary Division: Action vs. State of Affairs

**First Question**: "What is under discussion - a decision or a fact?"

The classification begins by distinguishing:
- **Arguments supporting courses of action** - Practical deliberation, decision-making, policy arguments
- **Arguments supporting judgments on states of affairs** - Factual claims, classifications, evaluations

**Significance**: This echoes ancient *stasis* theory (what is the issue?) and Grennan's warrant-claim matrix. It's fundamentally **pragmatic** - what is the *function* of this argument in discourse?

**Examples from text**:
- **Action**: "We should buy a bigger car. Everyone drives big cars here!" (external argument from popular practice)
- **State of Affairs**: "Bob has a fever, therefore Bob is ill" (internal argument from cause)

**Mesh Connection**: This maps to the `purpose` field in our taxonomy:
```typescript
purpose: "action" | "state_of_affairs"
```

But notice: The paper's scheme tree shows **action arguments can also support state of affairs judgments** when external authority relates to knowledge rather than compliance. Example: Expert testimony (external) used to establish a fact (state of affairs).

**Critical Insight**: Purpose is not binary but **contextual**. The same source (authority) functions differently depending on whether we're arguing "you should comply" vs. "this is true."

---

### 5.2 Secondary Division: Internal vs. External Arguments

Once purpose is established, schemes divide by **source of warrant**:

**External Arguments** (Figure 5 in paper):
- Ground conclusions in **sources outside the reasoning itself**
- For actions: Appeal to authority, precedent, popular practice (consequences of non-compliance)
- For states of affairs: Appeal to expert testimony, witness testimony (superior knowledge)

**Internal Arguments** (Figures 6-7 in paper):
- Ground conclusions in **intrinsic properties, relations, or reasoning**
- For actions: Consequences of the action itself, means-to-goal relations
- For states of affairs: Causal relations, definitions, classifications, evaluations

**Key Quote**: 
> "External arguments can be represented... When external arguments are used to support also a judgment on a state of affairs, the relevant quality of the source is not the speaker's authority (connected with the consequences of not complying with orders/conforming to common behavior) but rather with the source's superior knowledge."

**Mesh Connection**: This maps to the `source` field:
```typescript
source: "internal" | "external"
```

**Historical Validation**: This internal/external distinction appears in:
- Cicero's intrinsic vs. extrinsic topics (Section 3)
- Boethius's classification (Section 3)
- Katzav & Reed's "relations of conveyance" (Section 4)
- 2000+ years of continuous use across independent traditions

**Practical Implication**: Users navigating schemes should be asked:
1. "Are you reasoning from the thing itself (internal) or from testimony/authority (external)?"
2. This question applies *after* determining whether arguing for action or state of affairs

---

### 5.3 Internal Practical Arguments: Desirability Assessment

**Context**: Arguments supporting courses of action using internal reasoning.

**Two Branches** (Figure 6):

**5.3.1 Argument from Consequences**
- Action assessed by **quality of its consequences**
- Action is a **condition** of resulting positive/negative state of affairs
- Example: "Don't smoke - it causes cancer" (negative consequence)

**5.3.2 Argument from Means-to-Goal**
- Action assessed by **function in bringing about desired goal**
- Action is **productive of** a pursued state of affairs
- Example: "Take this route - it gets us there fastest" (instrumental)

**Distinction**: Consequences focus on *outcomes* (what results), means-to-goal focuses on *instrumentality* (what achieves our purpose).

**Mesh Connection**: This maps to the `materialRelation` field values:
```typescript
materialRelation: "cause" | "practical_reasoning" | ...
```

Where:
- "cause" captures consequence relations
- "practical_reasoning" captures means-to-goal relations

**Critical Question**: Should Mesh distinguish these more granularly?
- Current: Single `materialRelation` field with many values
- Alternative: Separate `inferentialBasis` field for practical vs. theoretical arguments

---

### 5.4 Internal Arguments for States of Affairs: Three Types of Predicates

**Context**: Arguments establishing acceptability of factual judgments using internal reasoning.

**The Classification Tree** (Figure 7):

**5.4.1 Existence Predicates**
- Attribute **occurrence of event** or **existence of entity**
- Present, past (retrodiction), or future (prediction)
- **Reasoning type**: Arguments from causal relations (material and efficient causes)
- Example: "The window broke because the ball hit it" (causal explanation)

**5.4.2 Factual Properties**
- Attribute **descriptive categorization** to entity/event
- **Reasoning type**: Argument from classification (definitional features)
- Example: "Bob is a man" (categorical classification)
- Grounded on **definitions** of categorical concepts

**5.4.3 Evaluative Properties**
- Attribute **value judgments** as classifications
- **Reasoning type**: Not based on definitions but on **hierarchies of values**
- Proceed from **criteria of importance to the audience**
- Example: "This is a good policy" (evaluation)
- Special case: Evaluative predicates like "criminal" based on **signs of internal disposition** which is itself evaluated

**Key Quote**:
> "Value judgments are classifications that are not based on definitions of categorical concepts (to be a cat) but rather on values, or rather hierarchies of values. Such judgments proceed from criteria (or more specifically, criteria of importance to the audience to whom the argument is presented) for classifying what is commonly considered to be 'good' or 'bad.'"

**Mesh Connection**: This three-way division suggests enhancing our taxonomy:

Current:
```typescript
conclusionType: "ought" | "is"
```

Potential enhancement:
```typescript
conclusionType: "ought" | "is" | "exists" | "value"
// Or more granularly:
predicateType: "existence" | "factual_property" | "evaluative_property"
```

**Critical Insight**: Evaluative predicates (character assessments, ethical judgments) occupy a **middle ground** between pure factual classification and prescriptive ought-statements. They use factual reasoning (signs, indicators) to reach evaluative conclusions.

---

### 5.5 The Interactive Classification System: Two Criteria Combined

**Core Methodology**: The system combines **pragmatic purpose** (what you're trying to accomplish) with **means to achieve it** (how you accomplish it).

**Key Quote**:
> "This system of classification of argumentation schemes is based on the interaction between two criteria, the (pragmatic) purpose of an argument and the means to achieve it."

**Dual Functionality**:

**5.5.1 Analytical Use**
- Reconstruct speaker's intention by examining:
  1. Generic purpose of the move
  2. Possible choices made to support it
  3. Linguistic elements in the text
- **Adjustable precision**: Analyst decides how far down the tree to go
  - Stop at broad category (e.g., "internal practical argument")
  - Or narrow to specific scheme (e.g., "argument from negative consequences with value-based warrant")

**Educational Benefit**: System can be "adapted to various teaching needs and levels" - beginners work with broad categories, advanced users with fine distinctions.

**5.5.2 Productive Use**
- Generate arguments by answering purpose-driven questions:
  - "What is under discussion - a decision or a fact?"
  - "The occurrence of an event or its classification?"
  - "The naming of a state of affairs or its qualification?"

**Connection to Stasis Theory**: 
> "Such questions closely resemble the ones that were at the basis of the rhetorical theory of stasis, namely the issues that can be discussed."

**Historical Context**: Stasis (στάσις) = ancient rhetorical doctrine of identifying the **point at issue**:
- **Conjecture** (existence): Did it happen?
- **Definition**: What kind of thing is it?
- **Quality**: What is its value/severity?
- **Procedure**: What should we do about it?

Modern classification recapitulates ancient rhetorical practice.

---

### 5.6 Material Relations and Logical Forms: The Interaction

**Key Theoretical Point**: The classification system **accounts for interrelation** between:
- **Semantic relation** (material basis - what concepts are connected)
- **Logical form** (reasoning type - how inference works)

**Example from Text**:
> "For example, the desirability of a course of action can be assessed internally by taking into consideration the means to achieve a goal. This pattern of reasoning can be stronger or weaker depending on whether there is only one or several alternatives. The paradigm of the possible means will determine whether the reasoning is abductive or deductive, resulting in a more or less defeasible conclusion."

**Breakdown**:
- **Material relation**: Means-to-goal (instrumental reasoning)
- **Logical forms**:
  - **Deductive**: If there's only one way to achieve goal → necessitative inference
  - **Abductive**: If there are multiple ways → inference to best explanation
  - Result: Different defeasibility profiles

**Same principle applies to**:
- Cause → can be inductive, analogical, deductive, or abductive
- Classification → can be deductive (necessary/sufficient conditions) or inductive (typical features)

**Mesh Connection**: This validates our **two-dimensional architecture**:
```typescript
{
  materialRelation: "cause" | "means_to_goal" | "definition" | ...,
  reasoningType: "deductive" | "inductive" | "abductive" | "analogical",
  ruleForm: "MP" | "MT" | "abduction" | ...
}
```

One material relation (e.g., "cause") can manifest in multiple logical forms (recall Section 2's fever example: one material relation → five logical forms).

**Critical Design Principle**: Scheme selection UI should allow:
1. **Material-first navigation**: "I want to reason from causes" → then select logical strength
2. **Logical-first navigation**: "I need a deductive argument" → then select material basis
3. **Purpose-first navigation**: "I'm arguing for action" → then refine by source and material relation

Current Mesh UI primarily uses **hierarchical browsing**. This section suggests adding **multi-dimensional entry points**.

---

### 5.7 Connection to Mesh Architecture

**Direct Mappings**:

The paper's classification tree maps cleanly to our six-field taxonomy:

| Paper Category | Mesh Field | Values |
|---------------|------------|---------|
| Pragmatic Purpose | `purpose` | `"action"` \| `"state_of_affairs"` |
| Source of Warrant | `source` | `"internal"` \| `"external"` |
| Semantic Relation | `materialRelation` | `"cause"` \| `"definition"` \| `"practical_reasoning"` \| ... |
| Type of Reasoning | `reasoningType` | `"deductive"` \| `"inductive"` \| `"abductive"` \| `"analogical"` |
| Inference Rule | `ruleForm` | `"MP"` \| `"MT"` \| `"abduction"` \| ... |
| Predicate Type | `conclusionType` | `"ought"` \| `"is"` |

**Validation**: The paper's dichotomic tree confirms that **all six dimensions are necessary**:
- **Purpose**: First division in tree
- **Source**: Second division in tree  
- **Material relation**: Specifies *what* warrants the inference
- **Reasoning type**: Specifies *how* inference works (strength, defeasibility)
- **Rule form**: Specifies *precise logical structure*
- **Conclusion type**: Distinguishes prescriptive from descriptive claims

**Current Implementation**:
```typescript
// From SchemeCreator.tsx
<Select value={scheme.purpose} onChange={...}>
  <SelectItem value="action">Action</SelectItem>
  <SelectItem value="state_of_affairs">State of Affairs</SelectItem>
</Select>

<Select value={scheme.source} onChange={...}>
  <SelectItem value="internal">Internal</SelectItem>
  <SelectItem value="external">External</SelectItem>
</Select>
```

**Confirmation**: Our admin interface already implements the paper's primary divisions. Users can filter by purpose and source.

**Enhancement Opportunity**: The paper's tree suggests **guided workflow** for scheme creation:
1. Select purpose (action vs. state of affairs)
2. Select source (internal vs. external)
3. If action + internal → choose consequence vs. means-to-goal
4. If state of affairs + internal → choose existence vs. classification vs. evaluation
5. Then select logical form and rule

This **progressive disclosure** reduces cognitive load compared to showing all fields at once.

---

### 5.8 Critical Insights for Implementation

**5.8.1 Purpose-Driven Selection Over Taxonomic Browsing**

The paper emphasizes schemes are **tools for accomplishing discourse goals**, not categories for taxonomic study.

**Implication**: SchemeSpecificCQsModal should present schemes as:
- "What are you trying to accomplish?" (purpose-driven)
- Rather than: "Browse this hierarchy" (structure-driven)

**User Journey**:
```
User wants to attack argument from expert testimony
→ "Are you questioning the action recommended or the fact claimed?" (Purpose)
→ "Is the argument based on authority or internal reasoning?" (Source)
→ [System filters to external + state_of_affairs schemes]
→ "Expert testimony" scheme surfaced with relevant CQs
```

**5.8.2 Adjustable Precision**

Quote: "Depending on the desired level of preciseness, the analysis can be narrowed down until detecting the specific scheme."

**Implication**: UI should support **zoom levels**:
- **Broad**: "This is an internal practical argument" (sufficient for many users)
- **Specific**: "This is argument from negative consequences with value-based warrant" (for experts)

Similar to how Section 4 showed we need multi-dimensional navigation, Section 5 shows we need **multi-resolution** navigation.

**5.8.3 Educational Scaffolding**

Quote: "This analytical model can be of help also for educational purposes, as it can be adapted to various teaching needs and levels."

**Implication**: SchemeSpecificCQsModal could offer:
- **Beginner mode**: Show only top-level divisions (purpose, source)
- **Intermediate mode**: Add material relation
- **Advanced mode**: Full taxonomy with logical forms

Current implementation shows all fields simultaneously. Consider **progressive disclosure** based on user expertise.

**5.8.4 Stasis-Based Questioning**

The paper explicitly connects classification questions to ancient stasis theory:
- Did it happen? (Existence)
- What kind of thing is it? (Classification)
- What is its value? (Evaluation)
- What should we do? (Action)

**Implication**: CQ presentation could mirror stasis structure:
- "Does the expert have the knowledge?" (Existence)
- "Is this person really an expert?" (Classification)
- "Is the expert trustworthy?" (Evaluation)
- "Should we accept the expert's claim?" (Action)

This **rhetorical framing** may be more intuitive than formal logical categories.

**5.8.5 Bidirectional Navigation**

The system supports both:
- **Analysis**: Given argument → find scheme
- **Production**: Given goal → generate argument

**Implication**: Mesh should support:
- **Defensive use**: "This argument was used against my claim - what scheme is it, and what CQs apply?"
- **Offensive use**: "I want to attack this claim - what schemes are available, and what CQs should I ask?"

Current SchemeSpecificCQsModal is **defensive** (analyzing existing argument). Could we add **offensive mode** (suggesting attack schemes)?

---

### 5.9 Potential Enhancements to Mesh Taxonomy

Based on this section's analysis, consider:

**5.9.1 Enhanced Conclusion Type**

Current:
```typescript
conclusionType: "ought" | "is"
```

Enhanced (based on Figure 7's three-way division):
```typescript
conclusionType: "ought" | "is_existence" | "is_classification" | "is_evaluation"
```

**Rationale**: The paper distinguishes:
- Existence predicates (event occurrence, entity presence)
- Factual properties (definitional classification)
- Evaluative properties (value judgments)

This distinction affects **which CQs are relevant** and **what constitutes adequate support**.

**5.9.2 Practical vs. Theoretical Dimension**

The paper's tree suggests arguments for action have fundamentally different structure than arguments for states of affairs.

Potential addition:
```typescript
domain: "practical" | "theoretical"
```

Where:
- **Practical**: Reasons for action, deliberation, policy
- **Theoretical**: Reasons for belief, explanation, understanding

This might clarify why some schemes feel hybrid (e.g., value-based reasoning - is it theoretical classification or practical commitment?).

**5.9.3 Warrant Explicitness**

The paper notes arguments can be analyzed "by examining the linguistic elements of the text" but warrants may be:
- Explicit (stated in text)
- Presupposed (required for reconstruction)
- Simply implied (recoverable from context)

Potential field:
```typescript
warrantStatus: "explicit" | "presupposed" | "implied"
```

**Rationale**: CQs targeting implicit warrants may need different framing than CQs targeting explicit ones.

---

### 5.10 Questions Raised

**Q1**: Should Mesh implement guided scheme selection workflow based on the dichotomic tree?
- Current: All taxonomy fields shown simultaneously
- Alternative: Progressive disclosure - purpose → source → material → logical form

**Q2**: How to support multi-resolution scheme identification?
- Some users need broad categories ("internal practical argument")
- Others need precise schemes ("argument from negative consequences with value-based warrant")
- Should UI offer "zoom in/out" functionality?

**Q3**: Should we distinguish consequence-based from means-to-goal reasoning more explicitly?
- Currently both fall under "practical reasoning" material relation
- Paper treats as distinct branches in tree
- Impact on CQ selection?

**Q4**: How to operationalize "criteria of importance to the audience"?
- Paper notes evaluative predicates depend on audience values
- Should schemes capture **audience-relative** warrants?
- Example: "This is a good policy" - good by whose standards?

**Q5**: Should offensive attack mode (scheme suggestion) be added to SchemeSpecificCQsModal?
- Current: Defensive (analyze existing argument)
- Proposed: Offensive (suggest schemes for attacking claim)
- User flow: "I want to attack this claim" → System suggests applicable schemes with CQs

---

### 5.11 Terminology Established

| Term | Definition | Significance |
|------|------------|-------------|
| **Pragmatic Purpose** | The discourse function an argument serves (support action vs. establish fact) | Primary organizing principle for classification |
| **Dichotomic Tree** | Classification structure dividing by binary choices at each node | Enables systematic navigation without imposing single criterion |
| **Internal Arguments** | Reasoning from intrinsic properties, relations, or logical rules | Corresponds to ancient "intrinsic topics" and Katzav & Reed's internal conveyance |
| **External Arguments** | Reasoning from sources outside the subject matter itself | Authority, testimony, precedent, popular practice |
| **Existence Predicates** | Claims about occurrence of events or presence of entities | Supported by causal arguments (material/efficient causes) |
| **Factual Properties** | Descriptive categorizations based on definitions | Supported by arguments from classification |
| **Evaluative Properties** | Value judgments based on hierarchies of values, not definitions | Criteria of importance to audience; includes character assessments |
| **Stasis Theory** | Ancient rhetorical doctrine of identifying point at issue | Modern classification recapitulates: conjecture/definition/quality/procedure |
| **Analytical Use** | Reconstructing speaker's intention from text | Moving from generic purpose to specific scheme |
| **Productive Use** | Generating arguments for given goals | Moving from intended conclusion to suitable schemes |
| **Adjustable Precision** | Ability to analyze at varying levels of specificity | Broad categories for novices, fine distinctions for experts |
| **Means-to-Goal** | Action valued as productive of pursued state of affairs | Instrumental reasoning - action achieves goal |
| **Consequence-Based** | Action valued by quality of resulting state of affairs | Outcome reasoning - action produces good/bad results |

---

### 5.12 Section Summary

Section 5 presents **Walton and Macagno's dichotomic classification tree** as a solution to the multi-dimensional problem identified in Section 4. Rather than imposing a single criterion, this system uses **pragmatic purpose as the organizing principle**, then systematically divides by means of support.

**Key Architectural Principles**:

1. **Purpose-Driven Navigation**: Users select schemes based on what they're trying to accomplish (support action vs. establish fact), not by browsing taxonomic hierarchy.

2. **Bidirectional System**: Supports both analysis (argument → scheme) and production (goal → scheme), mirroring ancient stasis theory.

3. **Adjustable Precision**: Allows broad categorization (for novices) or fine-grained distinction (for experts), making system adaptable to various use cases.

4. **Material-Logical Interaction**: Explicitly accounts for how one semantic relation (e.g., cause) can manifest in multiple logical forms (deductive, inductive, abductive), validating two-dimensional architecture.

5. **Multi-Entry-Point Design**: Classification tree enables navigation from purpose, source, material relation, or logical form depending on user's entry context.

**Validation of Mesh Architecture**:

The paper's primary divisions (purpose → source → material relation → logical form) **map exactly to our six-field taxonomy**, confirming that:
- `purpose`, `source`, `materialRelation`, `reasoningType`, `ruleForm`, `conclusionType` are not arbitrary but implement dimensions identified in systematic classification research
- Hierarchical parent-child alone is insufficient - need multi-dimensional navigation
- Purpose-driven selection should complement (not replace) taxonomic browsing

**Critical Design Insight**:

The contrast between "analytical use" (reconstruct arguments) and "productive use" (generate arguments) suggests **SchemeSpecificCQsModal should support two modes**:
1. **Defensive**: Given argument attacking my claim → identify scheme → surface relevant CQs
2. **Offensive**: Given claim I want to attack → suggest applicable schemes → guide CQ construction

Currently we implement only defensive mode. Offensive mode would transform CQs from reactive defenses to proactive attack tools.

**Implementation Implications**:

1. Consider **guided workflow** for scheme selection: purpose → source → material → logical form (progressive disclosure)
2. Consider **multi-resolution UI**: broad categories for quick selection, drill-down for precision
3. Consider **enhancing conclusionType** to distinguish existence/classification/evaluation (Figure 7's three-way split)
4. Preserve **adjustable precision** - not all users need to specify full six-field taxonomy
5. Frame CQs using **stasis-like questions** (more intuitive than formal logical categories)

**Connection to Phase A**: Understanding purpose-driven classification informs why SchemeSpecificCQsModal differs from CriticalQuestionsV3:
- CriticalQuestionsV3: General purpose claim evaluation (any scheme possible)
- SchemeSpecificCQsModal: Targeted scheme identification → tailored CQ set → structured attack construction

The paper validates this distinction and suggests CQs should emphasize **scheme identification** (enabling precise attack targeting) over **prose response** (generic evaluation).

**Next Section Preview**: Section 6 shifts from top-down tree to bottom-up clustering, examining how decision-making schemes (practical reasoning, value-based reasoning, consequences, slippery slope) form **interconnected families** with structural resemblances and actual linkages in argumentation.

---

*End of Section 5 Analysis*

---

## Section 6: A Bottom-Up Approach to Classification: Clusters of Decision-Making Schemes

### Overview

Section 6 shifts from **top-down taxonomic classification** (Section 5's dichotomic tree) to **bottom-up cluster analysis**. Rather than imposing a priori categories, this section examines how schemes naturally group through **family resemblances** and **actual interconnections** in argumentation.

**Central Focus**: The **decision-making cluster** - a family of schemes characterized by:
1. Similar structure based on **value judgments** and **practical outcomes**
2. Frequent **interconnection** when analyzing actual arguments
3. Hierarchical relationships where complex schemes **embed** simpler ones

**Key Theoretical Contribution**: The section reveals that schemes are not atomic units but form **compositional hierarchies**:
- **Instrumental practical reasoning** (simplest)
- **Value-based practical reasoning** = instrumental + argument from values
- **Slippery slope** = value-based practical reasoning + recursive chaining + loss of control

This compositional view has profound implications for Mesh: schemes should be understood as **building blocks** that combine, not isolated templates to match.

**Practical Insight**: Users often struggle to classify arguments as fitting "one or more" schemes. The cluster approach provides **identification conditions** - essential requirements that help determine scheme fit even when boundaries blur.

---

### 6.1 The Core Concept: Family Resemblances and Interconnections

**Opening Thesis**:
> "Argumentation schemes are characterized by both 'family' resemblances and actual interconnections."

**Two Types of Relationships**:

**6.1.1 Family Resemblances**
- Structural similarities in form and function
- Shared components (e.g., all use value judgments)
- Similar inferential patterns (e.g., practical outcome as warrant)
- Example: Practical reasoning, value-based practical reasoning, consequences all reason from goals to actions

**6.1.2 Actual Interconnections**
- One scheme appears as **critical question** of another
- One scheme **embeds** another as component
- One scheme acts as **support** or **attack** on another
- Example: Argument from negative consequences is CQ5 of practical reasoning

**Mesh Connection**: This explains why ArgumentScheme model has:
- **Parent-child hierarchy** (captures embeddings and specializations)
- **CriticalQuestion.attackType** (captures how schemes attack each other)
- **Cluster tags** (captures family resemblances)

Current implementation already supports these relationships but may not expose them clearly in UI.

---

### 6.2 The Simplest Form: Instrumental Practical Reasoning

**Scheme Structure** (Table 12):
```
Major Premise: I have a goal G.
Minor Premise: Carrying out this action A is a means to realize G.
Conclusion: Therefore, I ought (practically speaking) to carry out this action A.
```

**Characterization**: "Fast and frugal heuristic for jumping to a quick conclusion that may later need to be retracted."

**Key Features**:
1. **First-person framing** ("I") - represents rational agent with goals, circumstances, action capability
2. **Means-end reasoning** - action valued as instrument to goal
3. **Provisional conclusion** - "may later need to be retracted"
4. **Feedback capability** - agent perceives consequences, modifies actions/goals

**Defeasibility Mechanism**: Five critical questions (standard set):

**CQ1**: Goal Conflicts - "What other goals do I have that should be considered that might conflict with G?"
**CQ2**: Alternative Actions - "What alternative actions to my bringing about A that would also bring about G should be considered?"
**CQ3**: Efficiency - "Among bringing about A and these alternative actions, which is arguably the most efficient?"
**CQ4**: Practical Possibility - "What grounds are there for arguing that it is practically possible for me to bring about A?"
**CQ5**: Side Effects - "What consequences of my bringing about A should also be taken into account?"

**Critical Observation**: CQ5 (side effects) is itself **another argumentation scheme** - argument from negative consequences. This reveals the interconnection structure.

**Mesh Implementation**:
We have practical reasoning as a scheme. Do we capture all five CQs? Let me consider:
- CQ1-4: Standard practical reasoning challenges
- CQ5: Points to **another scheme** (consequences)

**Design Question**: Should CQs that point to other schemes be tagged as `"scheme_reference"` to enable navigation?

---

### 6.3 First Extension: Arguments from Consequences

**Two Symmetric Forms**:

**6.3.1 Argument from Positive Consequences** (Table 13):
```
Premise: If A is brought about, good consequences will plausibly occur.
Conclusion: Therefore A should be brought about.
```

**6.3.2 Argument from Negative Consequences** (Table 14):
```
Premise: If A is brought about, bad consequences will plausibly occur.
Conclusion: Therefore A should not be brought about.
```

**Key Characteristics**:

1. **Value-laden**: "Good" and "bad" refer to consequences with positive/negative **value to the agent**
2. **Defeasible**: Offer tentative reasons subject to exceptions as new circumstances emerge
3. **Implicit premise**: Could make explicit "if good consequences → should bring about" (warrant)

**Relationship to Practical Reasoning**:
- **Positive consequences**: Typically **supports** practical reasoning by justifying going ahead
- **Negative consequences**: Typically **attacks** practical reasoning by citing contravening values

**Critical Quote**:
> "Argument from negative consequences presents a reason against taking the action being considered by citing consequences of it that would contravene the values of the agent."

**Mesh Connection**: These are distinct schemes but function as **supporting/attacking moves** in practical deliberation:
```typescript
// Positive consequences = support
attackType: "SUPPORTS" // Do we have this? Currently: REBUTS, UNDERCUTS, UNDERMINES

// Negative consequences = attack
attackType: "REBUTS" // Directly attacks conclusion
```

**Design Question**: Should we add `"SUPPORTS"` as attackType to capture positive relationships? Or use separate field like `supportType`?

---

### 6.4 Second Extension: Arguments from Values

**Purpose**: Represent relationship between state of affairs, its **value classification**, and **commitment to action**.

**Key Theoretical Point**:
> "Values (differently from Atkinson et al., 2005; Bench-Capon, 2003) are regarded as grounds for a type of reasoning independent from and related to (or rather, presupposed by) practical reasoning."

Values are **not auxiliary** to practical reasoning but a **distinct layer** that:
1. Classifies states of affairs as good/bad (evaluative predication)
2. Grounds commitment to goals (practical classification)
3. Presupposed by consequence arguments

**Two Symmetric Forms**:

**6.4.1 Argument from Positive Value** (Table 15):
```
Premise 1: Value V is positive as judged by agent A.
Premise 2: If V is positive, it is a reason for A to commit to goal G.
Conclusion: V is a reason for A to commit to goal G.
```

**6.4.2 Argument from Negative Value** (Table 16):
```
Premise 1: Value V is negative as judged by agent A.
Premise 2: If V is negative, it is a reason for retracting commitment to goal G.
Conclusion: V is a reason for retracting commitment to goal G.
```

**Functional Distinction**:
- **Consequences**: Relate actions to outcomes
- **Values**: Relate outcomes to commitments
- Values → Commitments → Goals → Actions

**Critical Insight**: Arguments from consequences are **species of** arguments from values:
> "Arguments from positive consequences can be taken as species of arguments from positive value, and arguments from negative consequences can be taken as species of arguments from negative value."

This reveals a **type hierarchy**:
```
Argument from Value (abstract)
├── Argument from Positive Value
│   └── Argument from Positive Consequences (specialization)
└── Argument from Negative Value
    └── Argument from Negative Consequences (specialization)
```

**Mesh Connection**: This suggests ArgumentScheme parent-child relationships should capture **type specialization** in addition to **structural embedding**. 

Current parent-child might be used for structural hierarchy. Consider adding:
```typescript
// On ArgumentScheme model
specializationOf?: string // ID of more general scheme
```

Or simply use parent-child more explicitly for type hierarchies.

---

### 6.5 Third Extension: Value-Based Practical Reasoning

**Scheme Structure** (Table 17):
```
Premise 1: I have a goal G.
Premise 2: G is supported by my set of values, V.
Premise 3: Bringing about A is necessary (or sufficient) for me to bring about G.
Conclusion: Therefore, I should (practically ought to) bring about A.
```

**Characterization**: "Goal-based practical reasoning that combines basic practical reasoning with value-based reasoning."

**Compositional Structure**:
- Takes instrumental practical reasoning (Table 12)
- Adds Premise 2: explicit value justification
- Results in **more complex variant**

**Key Quote**:
> "Value-based practical reasoning is a species of instrumental practical reasoning with argument from values added on to it."

**Theoretical Significance**: This is the first **explicit compositional relationship**:
```
Value-based PR = Instrumental PR + Argument from Values
```

Not just family resemblance, but literal **composition** of schemes.

**Mesh Implication**: Should we model this explicitly?
```typescript
{
  name: "Value-Based Practical Reasoning",
  parentId: "instrumental-practical-reasoning-id",
  composedFrom: ["argument-from-values-id"], // New field?
  // Or use premises to track which components appear
}
```

**Enhanced Formulation**: Atkinson et al. (2005) version makes **circumstances** explicit:
- Current circumstances → Action → New circumstances
- Agent perceives circumstances, uses as basis for decision
- Action is **transition** between circumstance sets

This adds temporal/situational dimension to practical reasoning.

---

### 6.6 Fourth Extension: Slippery Slope Argument

**Scheme Structure** (Table 18):
```
First Step Premise: A0 is up for consideration as a proposal that seems 
                    initially like something that should be brought about.

Recursive Premise: Bringing up A0 would plausibly lead (in the given circumstances) 
                   to A1, which would in turn plausibly lead to A2, and so forth, 
                   through the sequence A2, ... An.

Bad Outcome Premise: An is a horrible (disastrous, bad) outcome.

Conclusion: A0 should not be brought about.
```

**Key Characteristics**:

**6.6.1 Recursive Chaining**
- Not single action → consequence
- But **chain of consequences**: A0 → A1 → A2 → ... → An
- Each step "plausibly leads" to next

**6.6.2 Loss of Control**
- Chain "cannot be anticipated in advance"
- Agent loses ability to stop progression
- Momentum builds toward catastrophic outcome

**6.6.3 Inherently Negative**
- Always argues **against** initial action
- Critic warns agent of catastrophic endpoint
- Assumes shared values (both see An as disastrous)

**Critical Questions** (3):
- **CQ1**: What intervening propositions actually given?
- **CQ2**: What steps required to fill in sequence?
- **CQ3**: What are weakest links where specific questions should be asked?

**Variants** (mentioned but not fully detailed):
1. **Causal slippery slope** - based on causal chains
2. **Precedent slippery slope** - based on setting precedents
3. **Linguistic slippery slope** - based on vague terms/concepts
4. **All-in slippery slope** - combines simpler variants

**Compositional Analysis**:

The paper establishes slippery slope as **multiply-embedded composition**:

```
Slippery Slope
├── derives from → Value-Based Practical Reasoning (core structure)
│   ├── Instrumental Practical Reasoning (goals, means)
│   └── Argument from Values (shared values for catastrophic evaluation)
├── is species of → Argument from Negative Consequences
│   └── based on → Argument from Negative Value
└── has subtypes → Precedent, Causal, Linguistic, All-in variants
```

**Key Quote**:
> "The basic slippery slope argument is derived from value-based practical reasoning as its core argument structure, where value-based practical reasoning is a combination of instrumental practical reasoning and argument from values."

And:
> "The basic slippery slope argument is a species of argument from negative consequences."

**Distinctive Features** distinguishing it from simpler consequence arguments:
1. **Recursive premise** - chaining structure
2. **Grey zone premise** - vagueness/uncertainty about boundaries
3. **Loss of control premise** - momentum toward catastrophe

**Mesh Connection**: Slippery slope is highly complex scheme that embeds multiple simpler schemes. Its CQs should reflect this:
- Questions about each link in chain (from practical reasoning)
- Questions about value of endpoint (from value-based reasoning)
- Questions about plausibility of progression (specific to slippery slope)

This suggests **CQ composition** - complex schemes inherit CQs from components, plus add scheme-specific CQs.

---

### 6.7 The Cluster Structure (Figure 8)

**Visual Representation**: Paper presents Figure 8 showing interconnections among five core schemes:

**Core Relationships**:

1. **Value-Based Practical Reasoning** (center)
   - Combines Instrumental Practical Reasoning + Argument from Values
   
2. **Instrumental Practical Reasoning** (foundation)
   - Simplest form, embedded in others

3. **Argument from Values** (foundation)
   - Independent reasoning type
   - Presupposed by consequence arguments

4. **Argument from Consequences**
   - Positive/negative variants
   - Species of argument from values
   - CQ5 of practical reasoning

5. **Slippery Slope** (most complex)
   - Derives from value-based practical reasoning
   - Species of negative consequences
   - Has subtypes: Precedent (shown in figure), Causal, Linguistic, All-in

**Additional Connection**: Precedent Slippery Slope
- Positioned under both "Argument from Precedent" and "Basic Slippery Slope"
- Shows how slippery slope variants connect to other scheme families
- Indicates clusters overlap - schemes participate in multiple families

**Mesh Implementation Insight**: 

Figure 8 suggests we need **graph visualization** of scheme relationships, not just tree hierarchy. Schemes have:
- **Parent-child** relationships (specialization, embedding)
- **Component** relationships (composition)
- **Functional** relationships (attack/support)
- **Cross-cluster** relationships (precedent SS links two families)

Current SchemeHierarchyView shows tree. Consider adding:
```typescript
// New component: SchemeClusterGraph
// Shows network of related schemes with different edge types:
// - solid line: parent-child
// - dashed line: composition
// - red arrow: typical attack relation
// - green arrow: typical support relation
```

---

### 6.8 Identification Conditions: Practical Aid for Classification

**Problem**: "Assistants sometimes find it difficult to classify a particular argument identified in a text as fitting one or more of these schemes."

**Solution**: Provide **identification conditions** - essential requirements distinguishing scheme types.

**6.8.1 Instrumental Practical Reasoning Conditions** (5):

1. **Agent attempting decision** - "An agent (or group of agents in case of multiagent reasoning) is attempting to arrive at a reasoned decision on what course of action to take"

2. **Evidence from circumstances** - "The circumstances provide evidence on which to build pro and con arguments"

3. **Goal-based decision** - "The agent is basing its decision on its goals, as well as its perception of the circumstances"

4. **Weight of reasons** - "Arguments need to be weighed against each other as stronger or weaker reasons"

5. **Evaluation as basis** - "The agent purports to be using this evaluation of the stronger or weaker reasons as its basis"

**Extension for Multiple Alternatives**:
- Not just "take action or not"
- But "which of several alternative actions is best"
- Based on goals and circumstances

**6.8.2 Value-Based Practical Reasoning Conditions**:

Same as five instrumental conditions **plus**:

6. **Value justification** - "The agent is justifying its decision based on its values, as well as on its goals and perception of circumstances"

**Minimal Addition Principle**: Value-based = Instrumental + Values (one additional condition)

**Mesh Application**: These identification conditions could become:
1. **Scheme selection filters** in UI (checkboxes for conditions present)
2. **Scheme documentation** in admin interface (help text explaining when to use)
3. **Validation rules** when creating Arguments (must satisfy conditions)

Consider adding to ArgumentScheme model:
```typescript
identificationConditions?: string[] // Checklist for when scheme applies
```

---

### 6.9 Relationships Within the Cluster: Attack and Support

**Three Key Relationships Established**:

**6.9.1 Negative Consequences as Critical Question**
> "Argument from negative consequences is one of the questions matching the scheme for argument from practical reasoning."

**Nature**: Negative consequences is **counterargument, rebuttal, or undercutter** that can defeat practical reasoning.

**Conditions for defeat**:
- Negative consequences can be specified
- Can be shown consequences are indeed negative
- Agent values avoiding those consequences

**6.9.2 Consequences as Species of Values**
> "Argument from negative consequences is based on argument from values, and is a species of argument from values."

**Hierarchy**:
```
Argument from Values (genus)
└── Argument from Consequences (species)
    ├── Positive Consequences
    └── Negative Consequences
```

**6.9.3 Value-Based as Complex Form of Instrumental**
> "Value-based practical reasoning is a more complex form of argument than instrumental practical reasoning."

**Relationship**: Not just resemblance but **composition**:
```
Value-Based PR = Instrumental PR + Argument from Values
```

**Additional Complexity: Slippery Slope**

**Less Evident Relationship**:
> "It is less evident that the slippery slope argument is also a species of value-based practical reasoning. However, it can be seen that it is."

**Argument for Inclusion**:
1. **Shared values required** - Critic assumes agent has values both share
2. **Catastrophic agreement** - Both must agree outcome is "highly negative and worth avoiding"
3. **Rational agent assumed** - Agent acts to achieve/be consistent with goals
4. **Embedded structure** - Value-based PR is core, adds recursive chaining

**Distinguishing Features** of slippery slope:
- **Recursive premise** - chaining A0 → A1 → ... → An
- **Grey zone premise** - vagueness about boundaries
- **Loss of control premise** - cannot anticipate/stop progression

**Mesh Connection**: These relationships suggest ArgumentScheme should track:
```typescript
{
  // Existing
  parentId: string, // Specialization hierarchy
  
  // Potential additions
  defeatedBy?: string[], // Scheme IDs that typically defeat this
  defeats?: string[], // Scheme IDs this typically defeats
  composedFrom?: string[], // Component scheme IDs
  presupposes?: string[], // Schemes that must hold for this to work
}
```

Or encode in CriticalQuestion:
```typescript
{
  question: "What negative consequences might result?",
  attackType: "REBUTS",
  pointsToScheme: "argument-from-negative-consequences-id", // Navigation!
}
```

---

### 6.10 Connection to Mesh Architecture

**Cluster-Based Navigation**:

Current Mesh has:
- **Hierarchical parent-child** (tree structure)
- **Cluster tags** (semantic grouping)
- **Six-field taxonomy** (multi-dimensional classification)

Section 6 validates these but suggests enhancements:

**6.10.1 Cluster Tags Should Be Semantic**

Current tags might be generic. Section 6 suggests specific clusters:
```typescript
clusterTags: [
  "decision_making", // The cluster analyzed in Section 6
  "practical_reasoning_family",
  "value_based_reasoning_family",
  "consequence_arguments",
  "slippery_slope_variants"
]
```

These enable **cluster-based browsing** as alternative to hierarchical browsing.

**6.10.2 Composition Relationships**

Section 6 reveals schemes compose from simpler schemes:
```typescript
// Example: Value-Based Practical Reasoning
{
  name: "Value-Based Practical Reasoning",
  parentId: "practical-reasoning-base-id", // Specialization
  composedFrom: [
    "instrumental-practical-reasoning-id",
    "argument-from-values-id"
  ], // New field
}
```

**Benefits**:
- **CQ inheritance** - composed scheme inherits component CQs
- **Educational progression** - teach simple → complex
- **Scheme suggestion** - "You're using instrumental PR, consider adding values"

**6.10.3 Attack/Support Relationships**

Section 6 shows schemes function as attacks/supports on each other:
```typescript
// On CriticalQuestion
{
  question: "What negative consequences should be considered?",
  attackType: "REBUTS",
  targetScope: "conclusion",
  invokesScheme: "argument-from-negative-consequences-id", // New field
}
```

Enables:
- **Scheme navigation** - clicking CQ navigates to related scheme
- **Counter-argument generation** - system suggests applicable attack schemes
- **Dialectical depth** - track nested argumentation structures

**6.10.4 Identification Conditions as Filters**

Section 6's identification conditions could become UI filters:
```typescript
// In SchemeSpecificCQsModal
<div>
  <h3>What describes your situation?</h3>
  <Checkbox>Agent attempting to decide action</Checkbox>
  <Checkbox>Evidence from circumstances available</Checkbox>
  <Checkbox>Decision based on goals</Checkbox>
  <Checkbox>Need to weigh reasons</Checkbox>
  <Checkbox>Decision based on values (not just goals)</Checkbox>
  // System filters to schemes matching checked conditions
</div>
```

More intuitive than taxonomy fields for many users.

---

### 6.11 Critical Insights for Implementation

**6.11.1 Schemes as Building Blocks, Not Templates**

Traditional view: Schemes are **templates** to match arguments against.

Section 6 view: Schemes are **building blocks** that compose into complex structures.

**Implication**: UI should support:
- **Composition** - "You're using practical reasoning, add value justification to strengthen"
- **Decomposition** - "This slippery slope embeds practical reasoning, values, and consequences"
- **Progression** - "Start with simple instrumental reasoning, layer in complexity"

**6.11.2 CQ Composition and Inheritance**

Complex schemes embed simpler ones → CQs should reflect this:

```typescript
// Slippery Slope CQs should include:
// 1. Inherited from Instrumental PR (goals, means, efficiency)
// 2. Inherited from Values (values positive/negative)
// 3. Inherited from Consequences (consequences good/bad)
// 4. Specific to Slippery Slope (chain links, weakest points)
```

Current CriticalQuestion model doesn't capture inheritance. Consider:
```typescript
{
  question: "What other goals might conflict?",
  attackType: "UNDERMINES",
  inheritedFrom: "instrumental-practical-reasoning-id", // Track origin
  applicableWhen: "base_scheme", // vs "always" for own CQs
}
```

**6.11.3 Multi-Scheme Arguments**

Section 6 reveals real arguments use **multiple schemes simultaneously**:
> "Assistants sometimes find it difficult to classify a particular argument identified in a text as fitting one or more of these schemes."

**Current Mesh**: Argument model has single `schemeId`.

**Enhancement**: 
```typescript
// On Argument model
schemeIds: string[] // Multiple schemes in play
primaryScheme: string // Main scheme for display
```

Or create ArgumentComponent:
```typescript
model ArgumentComponent {
  id String @id
  argumentId String
  schemeId String
  role String // "primary" | "support" | "presupposed"
  order Int
}
```

**6.11.4 Identification Conditions as User Guidance**

Rather than expecting users to understand taxonomy, ask **situation-based questions**:
- "Are you trying to decide on an action?" (practical reasoning)
- "Do you need to justify based on values?" (value-based PR)
- "Are you worried about a chain of consequences?" (slippery slope)

These natural-language questions map to identification conditions and filter schemes.

**6.11.5 Cluster Visualization**

Figure 8 shows **network structure**, not tree. UI should offer:
- **Tree view** (SchemeHierarchyView) - for browsing specialization hierarchy
- **Cluster view** (new) - for browsing related schemes by function
- **Graph view** (new) - for understanding composition and attack relationships

Consider: `<SchemeClusterView cluster="decision_making" />`

---

### 6.12 Potential Enhancements to Mesh Models

**6.12.1 ArgumentScheme Additions**

```typescript
model ArgumentScheme {
  // Existing fields...
  
  // Composition
  composedFrom ArgumentScheme[] @relation("CompositionComponents")
  composedIn ArgumentScheme[] @relation("CompositionComponents")
  
  // Functional relationships
  typicallyDefeats ArgumentScheme[] @relation("TypicalDefeat")
  typicallyDefeatedBy ArgumentScheme[] @relation("TypicalDefeat")
  
  // Identification
  identificationConditions String[] // Checklist for applicability
  
  // Cluster membership
  clusterTags String[] // Semantic groupings
}
```

**6.12.2 CriticalQuestion Additions**

```typescript
model CriticalQuestion {
  // Existing fields...
  
  // Scheme relationships
  invokesScheme String? // Points to another scheme
  inheritedFrom String? // If inherited from composed scheme
  
  // Applicability
  applicableWhen String // "always" | "base_scheme" | "variant_only"
}
```

**6.12.3 Argument Additions**

```typescript
model Argument {
  // Existing fields...
  
  // Multi-scheme support
  schemes ArgumentSchemeInArgument[]
}

model ArgumentSchemeInArgument {
  id String @id
  argumentId String
  schemeId String
  role String // "primary" | "support" | "presupposed" | "implicit"
  order Int
}
```

---

### 6.13 Questions Raised

**Q1**: Should we model scheme composition explicitly?
- Value-Based PR = Instrumental PR + Argument from Values
- How to represent this in database and expose in UI?

**Q2**: How to support multi-scheme arguments?
- Real arguments use multiple schemes (Section 6 establishes this)
- Current model assumes single scheme per argument
- Expand to multiple with roles?

**Q3**: Should CQs inherit from composed schemes?
- Slippery slope should include practical reasoning CQs
- How to implement inheritance vs. manual duplication?

**Q4**: How to visualize cluster relationships?
- Figure 8 shows network, not tree
- Tree view insufficient for compositional/functional relationships
- Need graph visualization component?

**Q5**: Should identification conditions become primary selection method?
- More intuitive than taxonomy for novices
- Situation-based questions ("Are you deciding on action?")
- How to maintain precision for experts?

**Q6**: How to represent attack/support relationships?
- Schemes attack/support each other functionally
- CQs invoke other schemes
- Model as scheme-level relationships or CQ-level?

**Q7**: Should we add "SUPPORTS" attack type?
- Currently: REBUTS, UNDERCUTS, UNDERMINES (all negative)
- Section 6 shows positive consequences **support** practical reasoning
- Need symmetry for positive relationships?

---

### 6.14 Terminology Established

| Term | Definition | Significance |
|------|------------|-------------|
| **Family Resemblances** | Structural similarities among schemes in form and function | Schemes group into clusters by shared characteristics |
| **Actual Interconnections** | One scheme appears within, supports, or attacks another | Schemes are not atomic but interdependent |
| **Instrumental Practical Reasoning** | Simplest practical reasoning: goal + means → action | Foundation of decision-making cluster |
| **Fast and Frugal Heuristic** | Quick provisional conclusion subject to retraction | Practical reasoning provides starting point, not final answer |
| **Side Effects Question** | CQ5 of practical reasoning about consequences to consider | Critical question that is itself another scheme |
| **Value-Based Practical Reasoning** | Practical reasoning with explicit value justification | Complex variant = instrumental PR + argument from values |
| **Practical Classification** | Classification of state of affairs grounding commitment to action | Values enable commitment, distinct from mere description |
| **Recursive Premise** | Slippery slope's chaining structure A0 → A1 → ... → An | Distinguishes chained consequences from single consequence |
| **Loss of Control Premise** | Cannot anticipate/stop progression toward catastrophic outcome | Key feature distinguishing slippery slope from consequences |
| **Grey Zone Premise** | Vagueness/uncertainty about boundaries in progression | Enables linguistic variant of slippery slope |
| **All-in Slippery Slope** | Complex form combining causal, precedent, linguistic variants | Most complex decision-making scheme |
| **Identification Conditions** | Essential requirements for scheme to apply | Practical aid for classification when boundaries blur |
| **Compositional Hierarchy** | Complex schemes embed simpler schemes as components | Schemes are building blocks, not atomic templates |
| **Species-Genus Relationship** | Consequences are species of values | Type hierarchy distinct from compositional hierarchy |

---

### 6.15 Section Summary

Section 6 presents a **bottom-up cluster analysis** of decision-making schemes, revealing that schemes form **interconnected families** with both structural resemblances and actual functional dependencies.

**Core Discovery**: **Compositional Hierarchy**

Schemes are not atomic templates but **building blocks** that compose:
1. **Instrumental Practical Reasoning** (foundation) - goals + means → action
2. **Argument from Values** (independent foundation) - values → commitments
3. **Value-Based Practical Reasoning** (composition) = Instrumental PR + Values
4. **Argument from Consequences** (specialization) = Values applied to outcomes
5. **Slippery Slope** (complex composition) = Value-Based PR + Recursive Chaining + Loss of Control

**Three Types of Relationships**:

1. **Specialization** (genus-species)
   - Consequences are species of values
   - Slippery slope is species of negative consequences

2. **Composition** (embedding)
   - Value-based PR embeds instrumental PR and values
   - Slippery slope embeds value-based PR

3. **Functional** (attack/support)
   - Negative consequences attack practical reasoning (CQ5)
   - Positive consequences support practical reasoning

**Identification Conditions as Classification Aid**:

When scheme boundaries blur, use **situational requirements**:
- Instrumental PR: Agent deciding, evidence available, goal-based, weighing reasons, evaluation as basis
- Value-Based PR: All instrumental conditions **plus** value justification

Natural-language conditions more accessible than formal taxonomy.

**Critical Implication for Mesh**:

Current architecture supports relationships via:
- `parentId` (hierarchy)
- `clusterTags` (grouping)
- `CriticalQuestion.attackType` (functional relationships)

Section 6 validates these but suggests enhancements:

1. **Composition field** - track which schemes compose current scheme
2. **Scheme inheritance** - CQs inherited from composed schemes
3. **Multi-scheme arguments** - real arguments use multiple schemes simultaneously
4. **Cluster visualization** - network graph showing relationships (Figure 8)
5. **Identification-based selection** - filter by situational requirements, not taxonomy
6. **Bidirectional attack/support** - "SUPPORTS" attack type for positive relationships

**Connection to Phase A**:

Understanding scheme clusters informs SchemeSpecificCQsModal design:
1. **Scheme suggestion** - "You're using practical reasoning, consider these related schemes"
2. **CQ composition** - Complex schemes show inherited + specific CQs
3. **Navigation** - CQs that invoke other schemes enable network traversal
4. **Educational scaffolding** - Teach simple schemes first, layer complexity
5. **Context-aware filtering** - Identification conditions filter applicable schemes

Section 6 shifts perspective from **scheme matching** (find the one template) to **scheme composition** (combine building blocks). This compositional view better captures how real argumentation works.

**Validation of Mesh Design**:

The decision-making cluster's structure directly maps to our existing features:
- Parent-child captures specialization
- Cluster tags enable family grouping  
- Attack types capture functional relationships
- Formal structure with variables enables composition tracking

What's missing: **explicit composition** and **CQ inheritance**. These would unlock the full power of cluster-based reasoning revealed in Section 6.

**Next Section Preview**: Section 7 extends beyond clusters to **nets of argumentation schemes**, showing how real arguments combine multiple schemes (classification + values + consequences) in complex interdependent structures. This will validate multi-scheme argument support and inform how SchemeSpecificCQsModal should handle arguments invoking multiple schemes simultaneously.

---

*End of Section 6 Analysis*
