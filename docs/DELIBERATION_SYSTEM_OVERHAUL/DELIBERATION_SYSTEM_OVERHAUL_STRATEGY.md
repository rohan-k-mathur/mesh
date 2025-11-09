# Deliberation System Overhaul Strategy
## Comprehensive Architectural Redesign Based on Argumentation Theory Research

**Date**: November 8, 2025  
**Status**: Strategic Planning Document  
**Scope**: Complete deliberation system redesign for theoretical soundness and practical excellence

---

## Executive Summary

After comprehensive analysis of foundational argumentation theory research (Macagno, Walton & Reed 2017), this document presents a **strategic overhaul plan** for Mesh's deliberation system. The research reveals our current architecture is partially correct but fundamentally incomplete—we model **individual schemes** but miss **argument nets**, we capture **three attack types** correctly but omit **burden of proof**, we implement **taxonomy** but lack **purpose-driven navigation**.

**Core Thesis**: Transform Mesh from an **argument tracking tool** into an **intelligent argumentation platform** grounded in 2,400 years of rhetorical tradition and 30+ years of AI research.

**Key Transformations Required**:
1. **From single schemes → nets of schemes** (arguments are multi-scheme compositions)
2. **From analysis only → analysis + construction** (generate arguments, not just evaluate)
3. **From flat taxonomy → multi-dimensional navigation** (purpose-driven + cluster-based + hierarchical)
4. **From uniform CQs → functional CQ types** (burden of proof, evidence requirements)
5. **From implicit structure → explicit dependencies** (track how schemes interconnect)

---

## Part 1: Theoretical Foundations (Sections 1-3 Analysis)

### 1.1 What We Learned: The Three Core Goals

**From Section 1 - Introduction**:

The foundational paper establishes three goals that directly map to Mesh's needs:

**Goal 1: Descriptive** - Trace evolution from Aristotle's topics to modern schemes
- **Mesh Implication**: Our system participates in 2,400-year tradition
- **Action**: Document historical grounding in user-facing materials
- **Educational Value**: Teach users they're learning ancient art, not arbitrary modern framework

**Goal 2: Methodological** - Propose classification system for schemes
- **Mesh Implication**: Classification must be **purpose-driven**, not theoretically "pure"
- **Action**: Implement multi-entry-point navigation (see Section 3.3)
- **Current Gap**: Hierarchical browsing alone is insufficient

**Goal 3: Applied** - Use schemes modularly to describe/analyze/produce arguments
- **Mesh Implication**: **Modular composition** is key—schemes are building blocks
- **Action**: Model argument nets, not single schemes per argument
- **Current Gap**: `Argument.schemeId: string` should be `schemes: string[]` with dependencies

### 1.2 Critical Questions: The Defeasibility Mechanism

**Key Insight from Section 1**:
> "Critical questions represent defeasibility conditions—possible weak points an interlocutor can exploit."

**Three Fundamental Truths**:

1. **CQs ARE the defeasibility mechanism** (not auxiliary features)
   - Every scheme has corresponding CQ set
   - CQs embody when/how argument might fail
   - They're adversarial testing instruments

2. **CQs serve tactical function** (finding attack vectors)
   - Critic with no ready counterarguments → searches CQs
   - Finds clues on how to attack
   - Identifies sources of evidence to build refutations

3. **CQs map to attack types** (validated by 30+ years AI research)
   - Challenge premise → UNDERMINES
   - Challenge inference → UNDERCUTS
   - Challenge conclusion → REBUTS

**Current Mesh Implementation**: ✅ Correct
```typescript
model CriticalQuestion {
  question: string
  attackType: "REBUTS" | "UNDERCUTS" | "UNDERMINES"
  targetScope: "conclusion" | "inference" | "premise"
}
```

**Enhancement Needed**: Add burden of proof (see Part 5 analysis)
```typescript
model CriticalQuestion {
  // Existing fields...
  burdenOfProof: "proponent" | "challenger" // NEW
  requiresEvidence: boolean // Just asking vs. must prove
}
```

### 1.3 Classification Must Serve Purpose

**Key Principle from Section 1**:
> "The purpose of the classification will determine the criteria for classification."

**Example**: Animals classified differently by:
- Biology (taxonomic system)
- Law (legal categories)
- Everyday English (common sense groupings)

**No "Correct" Classification** - only **fit for purpose**

**Mesh Purposes** (dual-mode system):
1. **Analysis Mode**: Identify schemes in existing arguments
2. **Production Mode**: Generate arguments for specific goals
3. **Educational Mode**: Teach argumentation patterns
4. **Dialectical Mode**: Enable adversarial testing

**Current Gap**: We implement taxonomy (six fields) but don't expose **purpose-driven workflows**.

**Action Required**: Add guided selection workflows (see Section 5 analysis)

### 1.4 Historical Continuity: 2,400 Years of Tradition

**From Section 3 - Historical Tradition**:

Every field in our Walton taxonomy has **ancient precedent**:

| Our Field | Ancient Origin | Date | Source |
|-----------|---------------|------|---------|
| `source: "internal"/"external"` | Intrinsic vs. Extrinsic topics | 1st century BCE | Cicero |
| `purpose: "action"/"state_of_affairs"` | Stasis theory (conjecture/procedure) | 1st century BCE | Hermagoras → Cicero |
| `materialRelation: "cause"` | From efficient cause | 6th century CE | Boethius |
| `materialRelation: "definition"` | From definition | 4th century BCE | Aristotle |
| Parent-child hierarchy | Generic vs. Specific topics | 4th century BCE | Aristotle |
| Defeasibility via CQs | Dialectical testing | 4th century BCE | Aristotle's *Topics* |

**Profound Validation**: We're not inventing arbitrary categories—we're implementing **distilled wisdom of millennia**.

**Educational Opportunity**: Frame Mesh as participating in rhetorical tradition from Aristotle → Cicero → Boethius → Medieval scholars → Modern AI.

**User Perception Shift**: From "learning a software tool" to "mastering ancient art of argumentation"

---

## Part 2: Modern Classification Systems Validate Multi-Dimensional Design (Section 4)

### 2.0 Overview: Six Independent Systems, One Universal Finding

**From Part 2 - Section 4 Analysis**:

The paper surveys **six major 20th-century classification systems** (Perelman, Toulmin, Kienpointner, Pragma-Dialectics, Grennan, Katzav & Reed, Lumer & Dove), and **every single one** reveals the same truth:

> **"No single criterion is sufficient for providing a clear and comprehensive classification of schemes."**

**Universal Problem**: Each system mixes different criteria without specifying interrelation:
- Logical form (deduction, induction, abduction)
- Material relation (cause, definition, analogy)
- Pragmatic function (action vs. fact, normative vs. descriptive)
- Dialectical function (pro vs. contra)
- Epistemic status (real vs. fictive)

**Critical Validation**: Our six-field taxonomy is not arbitrary—it's implementing **dimensions independently discovered** by multiple research traditions over 50+ years.

### 2.0.1 The Warrant as Central Organizing Concept

**Toulmin's Breakthrough (1958)**: All schemes are really **warrant types**

**Structure**:
```
Data (premises)
  ↓ [Warrant - general principle]
Claim (conclusion)
```

**Our Attack Types Map Directly**:
- `UNDERMINES` → attacks Data (premises)
- `UNDERCUTS` → attacks Warrant (inference)
- `REBUTS` → attacks Claim (conclusion)

**Profound Insight**: Toulmin (1958) rediscovered Boethius's maximae propositiones (6th century CE)—same conceptual role **1,400 years apart**. Our attack types operationalize this ancient-modern structure computationally.

### 2.0.2 Critical Enhancement: Epistemic Dimension Missing

**Kienpointner's Fourth Dimension** (most sophisticated system):

1. ✅ **Type of Inference** → our `reasoningType` + `ruleForm`
2. ❌ **Epistemic Nature** → NOT CAPTURED (critical gap)
3. ✅ **Dialectical Function** → implicit in attack types
4. ✅ **Pragmatic Function** → our `conclusionType` + `purpose`

**The Missing Dimension**:
- **Real premises**: Based on actual facts ("Russia invaded Ukraine")
- **Fictive premises**: Counterfactual ("If Russia invaded Ukraine...")
- **Hypothetical**: Thought experiments, scenario analysis

**Why It Matters**:
- Counterfactual reasoning is common in policy/deliberation
- CQs differ: "But that condition doesn't hold" vs. "Premise is false"
- Enables thought experiments and hypothetical scenarios

**Recommended Addition**:
```typescript
model ArgumentScheme {
  // Existing fields...
  epistemicMode?: "factual" | "counterfactual" | "hypothetical"
}
```

**UI Impact**: Filter schemes by whether user reasoning from facts or hypotheticals

### 2.0.3 Internal/External: 2,000+ Year Persistence

**Ancient** (Cicero 1st c. BCE, Boethius 6th c. CE):
- Intrinsic topics (from subject matter)
- Extrinsic topics (from authority/testimony)

**Modern** (Katzav & Reed 2004):
- Internal relations of conveyance
- External relations of conveyance

**Validates**: Our `source: "internal" | "external"` implements **perennial distinction**

**Katzav & Reed's Deep Insight**: "Relations of conveyance" = material relations
- Efficient cause → causal schemes
- Final cause → practical reasoning (teleological)
- Formal cause → definitional schemes
- Material cause → part-whole schemes

Our `materialRelation` field captures these Aristotelian four causes!

### 2.0.4 Action vs. Fact: Universal Primary Division

**Seven Independent Confirmations**:

1. **Ancient** (Cicero): Action schemes vs. conjecture/definition
2. **Grennan (1997)**: Actuative claims vs. theoretical claims (8 claim types split this way)
3. **Lumer & Dove (2011)**: Practical arguments as separate Class 3
4. **Kienpointner (1992)**: Pragmatic function (normative vs. descriptive)
5. **Perelman (1969)**: Association establishing reality vs. based on reality
6. **Our taxonomy**: `purpose: "action" | "state_of_affairs"`

**Why Fundamental**: Different cognitive structures
- Action reasoning: Goal → Means → Action (practical rationality)
- Fact reasoning: Evidence → Inference → Conclusion (theoretical rationality)

**Validates**: Our `purpose` field captures 2,000-year-old distinction

### 2.0.5 Grennan's Rich Claim Typology (Enhancement Opportunity)

**Eight Claim Types** (1997):

| Type | Description | Current Mapping |
|------|-------------|-----------------|
| Obligation | X must do A | `purpose: "action"`, `conclusionType: "ought"` |
| Supererogatory Actuative | X ought (for others) | `purpose: "action"`, `conclusionType: "ought"` |
| Prudential Actuative | X ought (for self) | `purpose: "action"`, `conclusionType: "ought"` |
| Evaluative | Value judgment | `purpose: "state_of_affairs"`, `conclusionType: "is"` ⚠️ |
| Physical-World | Brute facts | `purpose: "state_of_affairs"`, `conclusionType: "is"` |
| Mental-World | Mental states | `purpose: "state_of_affairs"`, `conclusionType: "is"` |
| Constitutive-Rule | Definitions | Definitional schemes |
| Regulative-Rule | Prohibitions | Deontic logic |

**Enhancement Opportunity**:
```typescript
conclusionType: "ought" | "is" | "evaluative" | "deontic"
```

**Why**: Evaluative claims ("This is good") use factual reasoning but reach value judgments—hybrid nature needs recognition.

**Speech Act Dimension**: Grennan connects to illocutionary forces
- Could enhance dialogue system (assertions vs. commands vs. questions)
- Institutional facts ("Game won") vs. brute facts ("Sun setting")

---

### 2.0.6 Design Principles from Modern Systems

The six systems converge on fundamental design principles:

#### A. No Single Taxonomy Works
Every system mixes criteria. Kienpointner uses four dimensions simultaneously. Pragma-Dialectics's "symptomatic" schemes are both material (content-based) and logical (inference-based). **Implication**: Mesh must support multi-dimensional filtering/navigation, not single hierarchical tree.

#### B. Warrants Are Central Organizing Concept
Toulmin, Grennan, and Kienpointner all center on warrants. Attack types target warrant components (data/warrant/claim). **Implication**: Warrant field should be first-class in UI, not buried in scheme metadata.

#### C. Purpose Determines Relevance
Perelman's rhetorical classification and pragma-dialectics's dialectical stages show schemes serve **dialogue goals**. Same premise type (expert opinion) functions differently in opening vs. argumentation stage. **Implication**: Scheme recommendations must be **context-aware** (dialogue stage, user goal).

#### D. Epistemic Mode Matters
Kienpointner's real/fictive/hypothetical distinction is critical for:
- Policy deliberation (hypothetical consequences)
- Counterfactual reasoning ("what if X hadn't happened?")
- Scenario planning
- Thought experiments

**Current Gap**: Mesh has no `epistemicMode` field.

#### E. Evaluative Claims Are Special
Grennan identifies evaluative claims as boundary case between "ought" and "is". Value judgments blur fact/value distinction. **Implication**: `conclusionType` should include `"evaluative"` to signal this special status.

#### F. Internal vs. External Is Fundamental
Katzav & Reed's conveyance relations map to Aristotle's four causes:
- **Internal** (formal/final cause): Logical structure
- **External** (material/efficient cause): Empirical warrant, causal mechanism

**Current State**: ✅ Mesh `source` field captures this (intrinsic/extrinsic/causal/sign)

---

### 2.0.7 Questions Raised by Modern Systems

**Q1: Should epistemic mode be explicit?**
- Kienpointner: Yes, three modes (real/fictive/hypothetical)
- Current: Implicit in scheme name ("Appeal to Hypothetical Consequences")
- **Decision Needed**: Add `epistemicMode` field or rely on naming convention?

**Q2: Should dialectical function be explicit?**
- Kienpointner: Pro/contra/neutral
- Current: Implicit in usage (user chooses to support/attack)
- **Consideration**: Pragma-dialectics stages suggest schemes have inherent dialectical roles (opening, confrontation, argumentation, closing)

**Q3: How to handle hybrid schemes?**
- Pragma-dialectics: Symptomatic schemes are both material (similarity) and logical (generalization)
- Current: Six-field taxonomy forces single classification per field
- **Issue**: Some schemes span multiple categories within one field

**Q4: Should speech acts be explicit?**
- Grennan: Claims are speech acts (assertive, directive, commissive...)
- Current: No speech act tracking
- **Consideration**: Dialogue module tracks speech acts; should arguments inherit this?

---

### 2.0.8 Terminology Established in Section 4

**Key Term Mappings** (across six systems):

| Mesh Term | Perelman | Toulmin | Kienpointner | Pragma-D | Grennan | Katzav & Reed |
|-----------|----------|---------|--------------|----------|---------|---------------|
| `source` | - | Backing | Epistemic | - | - | Conveyance |
| `reasoningType` | - | - | Inference | - | Warrant | - |
| `purpose` | Association/Dissoc | - | Pragmatic | - | - | - |
| Attack types | - | Data/Warrant/Claim | - | - | - | - |
| `formality` | - | - | - | Pragmatic | - | Internal/External |

**Critical Finding**: Our six fields map to dimensions identified independently across systems. This is **strong validation** that taxonomy is not arbitrary.

---

### 2.0.9 Part 2 Summary: Modern Systems Validate + Extend

**Validated Elements**:
- ✅ Six-field taxonomy justified by independent systems
- ✅ Attack types (UNDERMINES/UNDERCUTS/REBUTS) = Toulmin's Data/Warrant/Claim
- ✅ `purpose` field confirmed by 2,000 years + 7 modern systems
- ✅ `source` field (internal/external) persistent across 2,000 years
- ✅ Multi-dimensional classification necessary (all six systems confirm)

**Critical Gaps**:
- ❌ Epistemic mode missing (factual/counterfactual/hypothetical)
- ❌ Dialectical function implicit (pro/contra/neutral)
- ⚠️ Evaluative claims blur fact/value boundary

**Enhancement Opportunities**:
- Grennan's 8 claim types → expand `conclusionType`
- Speech act dimension → integrate with dialogue system
- Context-aware recommendations → pragma-dialectics stages

**Deep Insight**: Toulmin (1958) rediscovered Boethius (6th c. CE). "Maxima propositio" = warrant. 1400 years apart, ancient and modern converged. Our attack types operationalize this convergence.

**Design Principle**: Navigation must be **multi-entry-point**. Users approach from different goals → system must support multiple browsing modes (wizard, clusters, text analysis, identification conditions).

---

## Part 3: Purpose-Driven Trees & Compositional Clusters (Sections 5-6)

### 3.0 Overview: From Taxonomy to Navigation

Sections 5-6 shift from **descriptive classification** to **practical navigation**. The central insight: schemes are **tools for accomplishing discourse goals**, not categories for taxonomic study.

**Section 5** presents dichotomic classification tree:
- **Top-down approach**: Purpose → Source → Material Relation → Logical Form
- **Dual functionality**: Analytical (reconstruct arguments) + Productive (generate arguments)
- **Adjustable precision**: Broad categories for novices, fine distinctions for experts
- **Stasis theory revival**: Modern classification recapitulates ancient rhetorical "point at issue" doctrine

**Section 6** reveals compositional clusters:
- **Bottom-up approach**: Examine how schemes naturally group through family resemblances
- **Building block composition**: Complex schemes embed simpler schemes (Value-Based PR = Instrumental PR + Argument from Values)
- **Identification conditions**: Situational requirements filter applicable schemes
- **Network structure**: Schemes attack/support each other (negative consequences defeats practical reasoning)

**Combined Impact**: These sections validate our **multi-dimensional architecture** while revealing critical enhancements needed for navigation and composition.

---

### 3.1 The Dichotomic Tree: Purpose as Organizing Principle

**First Question**: "What is under discussion - a decision or a fact?"

**Primary Division** (Walton & Macagno):
1. **Arguments for Action** - Practical deliberation, policy, decisions
2. **Arguments for State of Affairs** - Factual claims, classifications, evaluations

**Mesh Validation**: This maps directly to our `purpose` field:
```typescript
purpose: "action" | "state_of_affairs"
```

**Critical Insight**: Purpose is **contextual**, not absolute. Expert testimony can:
- Support **action**: "Comply with authority" (external practical argument)
- Support **fact**: "This is true because expert says so" (external theoretical argument)

Same source type, different pragmatic function.

---

### 3.2 Secondary Division: Internal vs. External

Once purpose established, schemes divide by **warrant source**:

**External Arguments**:
- Ground in sources **outside reasoning itself**
- Authority, precedent, popular practice, testimony
- Quality derives from source's **superior knowledge** (for facts) or **consequences of non-compliance** (for actions)

**Internal Arguments**:
- Ground in **intrinsic properties, relations, reasoning**
- Consequences, means-to-goal, causal relations, definitions, classifications
- Quality derives from **nature of subject matter itself**

**Historical Persistence**:
- Cicero: Intrinsic vs. extrinsic topics (1st c. BCE)
- Boethius: Internal vs. external maxims (6th c. CE)
- Katzav & Reed: Relations of conveyance (2004)
- **2,000+ years continuous use**

**Mesh Validation**: This confirms our `source` field:
```typescript
source: "internal" | "external"
```

---

### 3.3 Internal State of Affairs: Three Predicate Types

**When arguing for facts using internal reasoning**, schemes divide by **predicate type**:

**A. Existence Predicates**
- Attribute occurrence of event or existence of entity (past/present/future)
- **Reasoning**: Arguments from cause (material/efficient causes)
- Example: "The window broke because ball hit it"

**B. Factual Properties**
- Attribute descriptive categorization based on definitions
- **Reasoning**: Arguments from classification (definitional features)
- Example: "Bob is a man" (categorical classification)

**C. Evaluative Properties**
- Attribute value judgments based on hierarchies of values, not definitions
- **Reasoning**: Arguments from values, signs of character, criteria of importance
- Example: "This is good policy" (evaluation)

**Key Quote**:
> "Value judgments are classifications that are not based on definitions of categorical concepts (to be a cat) but rather on values, or rather hierarchies of values."

**Mesh Enhancement Opportunity**:

Current:
```typescript
conclusionType: "ought" | "is"
```

Section 5 suggests:
```typescript
predicateType?: "existence" | "factual_property" | "evaluative_property"
// Evaluative properties occupy middle ground between "is" and "ought"
```

**Why Important**: Different CQs apply:
- **Existence**: Did it happen? What caused it?
- **Factual**: What features define category? Does entity have them?
- **Evaluative**: What values underlie judgment? Does audience share them?

---

### 3.4 Analytical vs. Productive Use (Bidirectionality)

**Dual Functionality** of classification system:

**Analytical Use** (Argument → Scheme):
1. Examine generic purpose of move
2. Identify choices made to support it
3. Analyze linguistic elements
4. Narrow to specific scheme
5. **Adjustable precision** - stop at broad category or drill to specific variant

**Productive Use** (Goal → Scheme):
1. Identify what's under discussion (action vs. fact)
2. Choose warrant source (internal vs. external)
3. If state of affairs: Select predicate type (existence/factual/evaluative)
4. If action: Select basis (consequences vs. means-to-goal)
5. **Result**: Filtered to 2-5 applicable schemes

**Connection to Stasis Theory**:
> "Such questions closely resemble the ones that were at the basis of the rhetorical theory of stasis, namely the issues that can be discussed."

Ancient stasis (στάσις):
- **Conjecture**: Did it happen? (existence)
- **Definition**: What kind? (classification)
- **Quality**: What value? (evaluation)
- **Procedure**: What action? (practical reasoning)

Modern classification **recapitulates** ancient rhetorical practice.

---

### 3.5 Compositional Clusters: Schemes as Building Blocks

**Section 6 Core Discovery**: Schemes are not atomic templates but **compositional hierarchies**.

**Decision-Making Cluster** (Figure 8):

**Foundation (Level 1)**:
- **Instrumental Practical Reasoning**: Goal + Means → Action
  - "Fast and frugal heuristic" - provisional, subject to retraction
  - Five CQs: Goal conflicts, alternatives, efficiency, practical possibility, **side effects**
  
- **Argument from Values**: Value + Classification → Commitment
  - Independent reasoning layer
  - Presupposed by practical reasoning

**Composition (Level 2)**:
- **Value-Based Practical Reasoning** = Instrumental PR + Argument from Values
  - Adds Premise 2: "Goal G is supported by my values V"
  - **Explicit composition**: Not just resemblance, literal embedding

- **Argument from Consequences** = Values applied to outcomes
  - **Positive consequences**: Support practical reasoning
  - **Negative consequences**: Attack practical reasoning (CQ5)
  - **Species-genus relationship**: Consequences are species of values

**Complex Composition (Level 3)**:
- **Slippery Slope** = Value-Based PR + Recursive Chaining + Loss of Control
  - Embeds value-based practical reasoning as core
  - Adds recursive premise: A0 → A1 → A2 → ... → An
  - Adds grey zone premise (vagueness about boundaries)
  - Adds loss of control premise (cannot anticipate/stop)

**Key Insight**:
> "Value-based practical reasoning is a species of instrumental practical reasoning with argument from values added on to it."

And:
> "The basic slippery slope argument is derived from value-based practical reasoning as its core argument structure."

---

### 3.6 Three Types of Scheme Relationships

**A. Specialization (Genus-Species)**:
```
Argument from Values (genus)
└── Argument from Consequences (species)
    ├── Positive Consequences
    └── Negative Consequences
        └── Slippery Slope (complex species)
```

**B. Composition (Embedding)**:
```
Value-Based PR = Instrumental PR + Argument from Values

Slippery Slope = Value-Based PR + Recursive Chain + Loss of Control
               = (Instrumental PR + Values) + Chain + Control
```

**C. Functional (Attack/Support)**:
- Negative consequences **attacks** practical reasoning (CQ5)
- Positive consequences **supports** practical reasoning (justifies going ahead)
- Values **presuppose** practical reasoning (goals rest on values)

**Mesh Connection**: These relationships should be **explicit and navigable**:
```typescript
model ArgumentScheme {
  // Existing
  parentId?: string // Captures specialization
  
  // Potential additions
  composedFrom?: string[] // Component scheme IDs
  defeatedBy?: string[] // Schemes that typically attack this
  defeats?: string[] // Schemes this typically attacks
  presupposes?: string[] // Schemes that must hold for this to work
}
```

---

### 3.7 Identification Conditions: Situational Classification

**Problem**: "Assistants find it difficult to classify a particular argument as fitting one or more of these schemes."

**Solution**: Provide **situation-based requirements** rather than formal criteria.

**Instrumental Practical Reasoning Conditions** (5):
1. Agent attempting to decide on action
2. Evidence from circumstances available
3. Decision based on goals
4. Need to weigh competing reasons
5. Evaluation as basis for decision

**Value-Based Practical Reasoning Conditions**:
All five instrumental conditions **plus**:
6. Decision based on values (not just goals)

**Minimal Addition Principle**: Each specialization adds one condition.

**Mesh Application**: These become **UI filters**:
```typescript
// In SchemeNavigator component
<div>
  <h3>What describes your situation?</h3>
  <Checkbox onChange={filterSchemes}>
    Agent attempting to decide on action
  </Checkbox>
  <Checkbox onChange={filterSchemes}>
    Evidence from circumstances available
  </Checkbox>
  // ... system filters schemes to those matching checked conditions
</div>
```

More intuitive than taxonomy fields for many users.

---

### 3.8 CQ Composition and Inheritance

**Critical Discovery**: CQ5 of practical reasoning **is itself another scheme**:

> "Argument from negative consequences is one of the questions matching the scheme for argument from practical reasoning."

CQ5: "What consequences of my bringing about A should also be taken into account?"

This question **invokes** argument from consequences scheme.

**Implication**: Complex schemes should **inherit CQs** from components:

**Slippery Slope CQs should include**:
1. **Inherited from Instrumental PR**: Goal conflicts, alternatives, efficiency, practical possibility
2. **Inherited from Values**: Values positive/negative, shared by audience
3. **Inherited from Consequences**: Consequences good/bad, can be specified
4. **Specific to Slippery Slope**: Chain links, weakest points, grey zone boundaries

**Mesh Enhancement**:
```typescript
model CriticalQuestion {
  // Existing fields
  
  // New fields
  invokesScheme?: string // Points to related scheme
  inheritedFrom?: string // If inherited from composed scheme
  applicableWhen: "always" | "base_scheme" | "variant_only"
}
```

**UI Navigation**: Clicking CQ that invokes scheme navigates to that scheme's page.

---

### 3.9 Multi-Scheme Arguments

**Section 6 Problem Statement**:
> "Assistants sometimes find it difficult to classify a particular argument identified in a text as fitting one or more of these schemes."

**Reality**: Real arguments use **multiple schemes simultaneously**.

Example: Policy argument might invoke:
- Practical reasoning (we should do X)
- Argument from values (X aligns with our values)
- Argument from consequences (X produces good outcomes)
- Argument from expert opinion (experts recommend X)

**Current Mesh**: Argument has single `schemeId`.

**Enhancement Needed**:
```typescript
model Argument {
  // Current single scheme
  schemeId?: string
  
  // Enhanced multi-scheme support
  schemes ArgumentSchemeInArgument[]
}

model ArgumentSchemeInArgument {
  id String @id
  argumentId String
  argument Argument @relation(fields: [argumentId])
  
  schemeId String
  scheme ArgumentScheme @relation(fields: [schemeId])
  
  role String // "primary" | "support" | "presupposed" | "implicit"
  order Int
}
```

**UI Impact**: ArgumentDetail should show **all applicable schemes**, not just one.

---

### 3.10 From Tree to Network: Cluster Visualization

**Figure 8 (Section 6)** shows schemes as **network**, not tree:
- Lines between schemes show composition
- Arrows show attack/support
- Overlapping clusters (precedent slippery slope connects two families)

**Current Mesh**: SchemeHierarchyView shows tree structure (parent-child).

**Enhancement**: Add **SchemeClusterGraph** component:
```typescript
// Visualize scheme relationships
<SchemeClusterGraph cluster="decision_making">
  // Nodes: Schemes
  // Edges:
  //   - Solid: parent-child (specialization)
  //   - Dashed: composition (embeds)
  //   - Red arrow: typically attacks
  //   - Green arrow: typically supports
  //   - Blue: presupposes
</SchemeClusterGraph>
```

**User Value**: Understand how schemes relate, navigate by function not just hierarchy.

---

### 3.11 Adjustable Precision: Multi-Resolution Classification

**Key Quote**:
> "Depending on the desired level of preciseness, the analysis can be narrowed down until detecting the specific scheme."

**Implication**: UI should support **zoom levels**:

**Broad (Novice)**:
- "This is an internal practical argument" (sufficient for basic understanding)

**Intermediate**:
- "This is value-based practical reasoning" (adds value justification)

**Specific (Expert)**:
- "This is argument from negative consequences with value-based warrant and recursive chaining" (full specificity)

**Current Mesh**: Shows all taxonomy fields simultaneously (expert level only).

**Enhancement**: Add **expertise mode toggle**:
```typescript
<Select value={expertiseMode}>
  <SelectItem value="beginner">Beginner - Broad Categories</SelectItem>
  <SelectItem value="intermediate">Intermediate - Cluster Level</SelectItem>
  <SelectItem value="expert">Expert - Full Taxonomy</SelectItem>
</Select>

// Conditionally show fields based on mode
{expertiseMode === "beginner" && <PurposeSourceSelector />}
{expertiseMode === "intermediate" && <ClusterSelector />}
{expertiseMode === "expert" && <FullTaxonomyForm />}
```

---

### 3.12 Part 3 Summary: Navigation & Composition Principles

**Validated Elements**:
- ✅ Purpose field (action vs. state_of_affairs) = 2,000-year tradition + modern classification
- ✅ Source field (internal vs. external) = persistent across all systems
- ✅ Multi-dimensional architecture enables purpose-driven navigation
- ✅ Adjustable precision needed (broad → specific)
- ✅ Bidirectional use (analytical + productive)

**Critical Gaps**:
- ❌ No composition tracking (which schemes embed which)
- ❌ No CQ inheritance (complex schemes should inherit component CQs)
- ❌ Single scheme per argument (real arguments use multiple)
- ❌ Tree-only visualization (need network/cluster views)
- ❌ Expert-only precision (no beginner/intermediate modes)

**Enhancement Opportunities**:
- **Dichotomic wizard**: Guide users through purpose → source → material → logical form
- **Identification conditions**: Filter by situational requirements, not taxonomy
- **Cluster browsing**: Group by function (decision-making, authority, causal, analogical)
- **Scheme composition**: Track which schemes compose current scheme
- **CQ navigation**: Clicking CQ that invokes scheme navigates to it
- **Multi-scheme arguments**: Support multiple schemes with roles (primary/support/presupposed)
- **Adjustable precision**: Beginner/intermediate/expert modes

**Deep Insights**:

1. **Stasis Theory Revival**: Modern classification recapitulates ancient rhetorical doctrine:
   - Conjecture → Existence predicates
   - Definition → Factual properties
   - Quality → Evaluative properties
   - Procedure → Action arguments

2. **Compositional Nature**: Schemes are **building blocks**, not templates:
   - Simple schemes compose into complex schemes
   - CQs should inherit from components
   - Educational progression: simple → complex

3. **Functional Relationships**: Schemes attack/support each other:
   - Negative consequences defeats practical reasoning
   - Positive consequences supports practical reasoning
   - Values presuppose practical reasoning
   - Should be explicit and navigable

4. **Multi-Entry Navigation**: Users approach from different goals:
   - Purpose-first: "I'm arguing for action"
   - Source-first: "I have expert testimony"
   - Material-first: "I want to reason from causes"
   - Identification-first: "I'm deciding on action with evidence available"

**Design Principle**: Navigation should be **purpose-driven** and **multi-entry-point**, not single hierarchical tree.

---

## Part 4: Nets of Schemes - The Make-or-Break Finding (Section 7)

### 4.0 The Core Insight: Arguments Are Compositions, Not Templates

**Section 7 Central Thesis**:
> "Argumentation schemes are imperfect bridges between the logical (or quasi-logical) level and the conceptual one... A single argumentation scheme cannot capture the complexity of such real argumentation. For this reason, we need to conceive the relationship between arguments and schemes in a modular way, in terms of nets of schemes."

**Profound Implication**: Current Mesh `Argument` model with single `schemeId` is **architecturally insufficient**.

**Why This Matters**:
- Real arguments require **multiple conceptual passages**:
  - Classify a state of affairs (argument from classification)
  - Evaluate it positively/negatively (argument from values)
  - Suggest course of action (practical reasoning)
  - Predict consequences (argument from consequences)
- Each passage = one scheme
- Complete argument = **net of interdependent schemes**

**The Gap**:
> "There is a crucial gap between the complexity of natural argumentation, characterized by several conceptual passages leading to a conclusion, and the schemes."

Single scheme = one inferential step. Real arguments = multiple interdependent steps.

---

### 4.1 Example: The Hague Speech (Russia-Ukraine)

**Text** (British Foreign Secretary William Hague, 2014):
> "Be in no doubt, there will be consequences. The world cannot say it is OK to violate the sovereignty of other nations. This clearly is a violation of the sovereignty independence and territorial integrity of Ukraine. If Russia continues on this course we have to be clear this is not an acceptable way to conduct international relations."

**Surface Analysis**: Looks like simple "argument from consequences."

**Deep Analysis**: **Net of three interconnected schemes**:

**Scheme 1: Argument from Verbal Classification**
- **Explicit**: "This clearly is a violation of the sovereignty independence and territorial integrity of Ukraine"
- **Implicit premise** (dotted): "Hostile military intervention = sovereignty violation"
- **Fact premise**: "Russia intervened militarily in Crimea"
- **Function**: Classifies the action

**Scheme 2: Argument from Commitment**
- **Explicit**: "The world cannot say it is OK to violate the sovereignty of other nations"
- **Implicit**: World committed to opposing sovereignty violations
- **Function**: Establishes normative basis
- **Depends on**: Classification (must be violation to trigger commitment)

**Scheme 3: Argument from Consequences**
- **Explicit**: "Be in no doubt, there will be consequences"
- **Explicit**: "This is not an acceptable way to conduct international relations"
- **Implicit conclusion** (dotted): "Russia should not continue"
- **Function**: Practical threat/conclusion
- **Depends on**: Commitment (world's commitment → consequences will follow)

**Dependency Chain**:
```
Classification (Scheme 1) [action = sovereignty violation]
    ↓ enables
Commitment (Scheme 2) [world opposes violations]
    ↓ enables
Consequences (Scheme 3) [opposition → threat of consequences]
    ↓ produces
Implicit Practical Conclusion [Russia should not continue]
```

**Critical Quote**:
> "The classification, the reasoning from commitment, and the argument from consequences are deeply interconnected. The alleged world's commitment to consequences against Russia depends on the classification of the state of affairs."

**Remove any scheme → net collapses.**

---

### 4.2 Types of Dependencies in Nets

Based on examples, schemes relate through:

**A. Premise-Conclusion Dependency**
- One scheme's conclusion becomes another's premise
- Most common in examples
- Example: Classification conclusion → Commitment premise

**B. Presuppositional Dependency**
- One scheme presupposes another's holding
- Often implicit
- Example: Consequences presuppose commitment to values

**C. Support Dependency**
- One scheme provides evidential support for another
- Example: Classification supports commitment claim

**D. Justificational Dependency**
- One scheme justifies applicability of another
- Example: Values justify slippery slope's normative force

**E. Sequential Dependency**
- Schemes must be applied in cognitive/argumentative order
- Example: Classify → Evaluate → Prescribe action

---

### 4.3 Three Levels of Explicitness

**Paper's Visual Convention**:
- **Solid boxes**: Explicit (stated in text)
- **Dashed boxes**: Presupposed (taken for granted, necessary)
- **Dotted boxes**: Simply implied (recoverable from context)

**Explicitness Levels**:

**1. Explicit**
- Directly stated in text
- Example: "There will be consequences"
- Easy to identify

**2. Presupposed**
- Taken for granted by speaker
- Necessary for argument to work
- Example: "Undesirable consequences should be avoided"
- Requires analyst reconstruction

**3. Simply Implied**
- Recoverable from context/common knowledge
- Often the ultimate conclusion
- Example: "Russia should not continue"
- Filled by domain knowledge

**Analytical Requirement**: "Needed for reconstructing his reasoning."

---

### 4.4 The Role of Common Knowledge

**Key Insight**:
> "These intervening links are basically filled in by common knowledge concerning the normal way we expect military interventions to take place and to have consequences."

**Common Knowledge Types**:

**A. Domain Knowledge**
- International relations: interventions → reactions
- Legal: violations → sanctions
- Scientific: causes → effects

**B. Normative Knowledge**
- Shared values (sovereignty should be protected)
- Shared norms (declarations of war are serious)
- Shared principles (escalation is dangerous)

**C. Causal Knowledge**
- Typical causal chains in domain
- Expected consequences
- Predictable behavior patterns

**D. Pragmatic Knowledge**
- Speaker's likely intentions
- Discourse conventions
- Rhetorical strategies

**Implication**: System reconstructing arguments must:
1. Flag missing links
2. Suggest typical premises for domain
3. Provide common knowledge templates

---

### 4.5 Visualization is Essential, Not Optional

**Quote**:
> "By using an argument map that reveals the network of argumentation into which the given slippery slope argument fits, the puzzle of unraveling the network of argumentation using a cluster can be solved."

**What Argument Maps Reveal**:

1. **Complete Structure**: All schemes (explicit + implicit)
2. **Dependency Patterns**: Which enables which, linear vs. convergent
3. **Cluster Usage**: Which scheme families active
4. **Strategic Function**: What speaker accomplishing, how schemes work together

**Critical Point**: Argument maps are **essential for understanding**, not supplementary visualization.

Without visualization, nets remain opaque.

---

### 4.6 Current Mesh Architecture vs. Net Requirements

**Current State**:
```typescript
model Argument {
  id String @id
  claimId String
  schemeId String? // Single scheme ❌
  // ...
}
```

**Problem**: Real arguments instantiate **multiple schemes** in interdependent nets.

**Required**: Model nets explicitly.

**Architecture Options**:

**Option A: Multiple Scheme References on Argument**
```typescript
model Argument {
  id String @id
  claimId String
  schemes ArgumentSchemeInstance[]
  // ...
}

model ArgumentSchemeInstance {
  id String @id
  argumentId String
  schemeId String
  role String // "primary" | "supporting" | "presupposed" | "implied"
  explicitness String // "explicit" | "presupposed" | "implied"
  textEvidence?: String
  order Int
}
```

**Option B: Argument as Net (Nodes + Edges)**
```typescript
model ArgumentNet {
  id String @id
  claimId String
  nodes ArgumentNode[]
  edges ArgumentEdge[]
}

model ArgumentNode {
  id String @id
  netId String
  type String // "premise" | "conclusion" | "intermediate"
  content String
  explicit Boolean
}

model ArgumentEdge {
  id String @id
  netId String
  sourceNodeId String
  targetNodeId String
  schemeId String // Scheme connecting nodes
  dependencyType String // From 4.2
}

model ArgumentDependency {
  id String @id
  sourceArgId String
  targetArgId String
  dependencyType String // "premise_conclusion" | "presuppositional" | "support" | "justificational" | "sequential"
  isExplicit Boolean
  justification?: String
}
```

**Recommendation**: **Option B** (net-based) aligns with Section 7's theoretical framework.

---

### 4.7 Impact on SchemeSpecificCQsModal

**Current Limitation**: Modal assumes single scheme per argument.

**Section 7 Requirement**: Support nets of schemes.

**Design Changes Needed**:

**A. Multi-Scheme Identification**

Don't ask: "What scheme does this argument use?"

Ask: "What schemes does this argument combine?"

**UI Flow**:
1. Identify primary scheme (dominant pattern)
2. Identify supporting schemes (enabling premises)
3. Identify presupposed schemes (implicit warrants)
4. Show net structure with dependencies

**B. Composed CQ Sets**

CQs from **all schemes in net**:

**Example - Hague Speech Net**:
```
CQs from Classification Scheme:
- Is Russia's action really a sovereignty violation?
- What definition of sovereignty violation is used?

CQs from Commitment Scheme:
- Is the world actually committed to opposing violations?
- What evidence for this commitment?

CQs from Consequences Scheme:
- Will consequences actually occur?
- Are consequences undesirable to Russia?

Dependency CQs:
- Does the classification actually trigger the commitment?
- Does the commitment actually lead to consequences?
```

**C. Net Visualization in Modal**

Don't just list CQs. Show:
```
[Diagram of net with schemes as nodes]
↓
Click scheme → see its CQs
Click dependency → see linking CQs
Click CQ → see which scheme it questions
```

**D. Targeted Attack Selection**

User constructing attack chooses:
- **Attack primary scheme**: Undermines main inference
- **Attack supporting scheme**: Removes enabling premise
- **Attack dependency**: Break link between schemes
- **Attack entire net**: Reject overall strategy

Different attack strategies → different effects.

---

### 4.8 Tactical vs. Strategic Levels

**Design Principle**: Distinguish two levels of analysis.

**Tactical Level** (Single Scheme):
- Individual scheme's premises, conclusions, CQs
- Formal structure (reasoning type, rule form)
- One "passage of reasoning"
- Current SchemeSpecificCQsModal operates here

**Strategic Level** (Net of Schemes):
- Complete argument's multiple schemes
- Dependencies between schemes
- Overall argumentative goal
- Rhetorical effectiveness
- **Needed**: New components for this level

**Both Necessary**:
- **Tactics**: Precision on individual inferences
- **Strategy**: Understanding complete argument

---

### 4.9 Required UI Components

**A. ArgumentNetBuilder**
```typescript
// Construct/visualize nets
<ArgumentNetBuilder
  claimId={claimId}
  onSchemeAdd={(scheme, role, explicitness) => /* add node */}
  onDependencyAdd={(source, target, type) => /* add edge */}
  onExplicitnessToggle={(node, level) => /* mark */}
  suggestedSchemes={/* based on existing */}
  commonPatterns={/* typical nets for domain */}
/>
```

**B. NetVisualization**
```typescript
// Graph visualization
<NetVisualization
  net={argumentNet}
  layout="hierarchical" // or "force-directed"
  explicitnessStyle={true} // Solid/dashed/dotted
  onNodeClick={(scheme) => /* show details */}
  onEdgeClick={(dependency) => /* show link */}
  highlightPath={attackPath}
/>
```

**C. ComposedCQPanel**
```typescript
// CQs from all schemes in net
<ComposedCQPanel
  net={argumentNet}
  groupBy="scheme" // or "attackType" or "dependency"
  onCQSelect={(cq, targetScheme) => /* construct attack */}
  showDependencyCQs={true}
  showInheritedCQs={true}
/>
```

**D. NetSchemeSelector**
```typescript
// Enhanced scheme selector for nets
<NetSchemeSelector
  existingSchemes={currentNetSchemes}
  onSchemeSelect={(scheme, role) => /* add with role */}
  suggestedSchemes={/* patterns */}
  commonPatterns={/* domain-specific */}
/>
```

---

### 4.10 Common Net Patterns (Knowledge Base)

System should recognize common patterns:

**Pattern: Classification → Values → Consequences → Action**
- Domain: Policy arguments
- Schemes: Verbal classification, Argument from values, Consequences, Practical reasoning
- Dependencies: Sequential + presuppositional
- Example: Hague speech

**Pattern: Authority → Commitment → Action**
- Domain: Institutional arguments
- Schemes: Expert opinion, Commitment, Practical reasoning
- Dependencies: Premise-conclusion + justificational

**Pattern: Cause → Sign → Classification**
- Domain: Diagnostic/scientific arguments
- Schemes: Cause to effect, Argument from sign, Classification
- Dependencies: Sequential + support

**Pattern: Precedent → Analogy → Consequences**
- Domain: Legal arguments
- Schemes: Precedent, Analogy, Consequences
- Dependencies: Support + justificational

**Implementation**:
```typescript
model SchemeNetPattern {
  id String @id
  name String
  description String
  domain String // "policy" | "legal" | "scientific" | ...
  schemes String[] // Scheme IDs in typical order
  typicalDependencies Json // Structure
  examples String[]
  tags String[]
}
```

---

### 4.11 Part 4 Summary: Arguments Are Nets

**Core Discovery**: **Real arguments use multiple schemes simultaneously in interdependent nets.**

**Key Quotes**:
> "A scheme can capture only one passage of reasoning, while the nets can map a more complex argumentative strategy, involving distinct and interdependent steps."

> "Argumentation schemes appear in nets instead of in clear and independent occurrences."

**Validation**: Two detailed examples (Hague speech, Russian response) show:
- 3-4 schemes per argument
- Explicit dependency structures (classification enables commitment enables consequences)
- Multiple explicitness levels (explicit, presupposed, implied)
- Common knowledge fills gaps

**Architectural Impact**: **Fundamental redesign required.**

**Current**:
```typescript
model Argument {
  schemeId String? // Single scheme ❌
}
```

**Required**:
```typescript
model ArgumentNet {
  nodes ArgumentNode[] // Premises, conclusions
  edges ArgumentEdge[] // Schemes connecting nodes
}

model ArgumentDependency {
  sourceArgId String
  targetArgId String
  dependencyType String
  isExplicit Boolean
}
```

**Five Dependency Types**:
1. Premise-Conclusion (one's output → another's input)
2. Presuppositional (one presupposes another holds)
3. Support (one provides evidence for another)
4. Justificational (one justifies applicability of another)
5. Sequential (cognitive/argumentative ordering)

**Three Explicitness Levels**:
1. Explicit (stated in text) - solid styling
2. Presupposed (necessary, implicit) - dashed styling
3. Simply Implied (recoverable from context) - dotted styling

**Visualization Essential**:
> "By using an argument map that reveals the network of argumentation... the puzzle... can be solved."

Not optional but **essential for understanding complex nets**.

**Impact on SchemeSpecificCQsModal**:
- Must identify **multiple schemes** in composition
- Must generate **composed CQ sets** from all schemes
- Must show **net visualization** with dependencies
- Must support **targeted attacks** on specific schemes/dependencies in net

**Tactical vs. Strategic**:
- **Tactical**: Single scheme precision (current modal)
- **Strategic**: Complete net understanding (new components needed)
- Both levels necessary

**Common Patterns**: System should recognize domain-specific net patterns:
- Policy: Classification → Values → Consequences → Action
- Legal: Precedent → Analogy → Consequences
- Scientific: Cause → Sign → Classification

**Critical Design Principle**: Schemes are **building blocks** that compose into **nets** forming **argumentative strategies**. Architecture must support composition at all levels:
- Atomic schemes (Section 2)
- Scheme clusters (Section 6)
- Argument nets (Section 7)
- Complete deliberations (multiple nets attacking/supporting each other)

**This finding changes everything.** Single-scheme architecture is provably insufficient for real argumentation.

---

## Part 2A: Architectural Gaps Revealed

### 2.1 The Two-Dimensional Structure (Section 2)

**Fundamental Insight from Section 2.1**:

Schemes combine **two distinct dimensions**:
1. **Material Relation** (semantic/ontological connection - the warrant)
2. **Logical Form** (type of reasoning + inference rule)

**The Fever Example** (one material relation → five logical forms):

```
Material: "Fever causes fast breathing" (causal relation)

Logical Form 1 (Modus Ponens): Had fever → breathed fast
Logical Form 2 (Modus Tollens): Didn't breathe fast → no fever  
Logical Form 3 (Abduction): Breathing fast → might have fever
Logical Form 4 (Abduction 2): No fever → may not breathe fast
Logical Form 5 (Induction): When I had fever, breathed fast → you may have fever
```

**Same content, different reasoning patterns** = different schemes

**Mesh Implementation**: ✅ Correct two-dimensional model
```typescript
{
  // Material dimension (content)
  purpose: "action" | "state_of_affairs",
  source: "internal" | "external",
  materialRelation: "cause" | "definition" | "analogy" | ...,
  conclusionType: "ought" | "is",
  
  // Logical dimension (form)
  reasoningType: "deductive" | "inductive" | "abductive" | "practical",
  ruleForm: "MP" | "MT" | "defeasible_MP" | "universal"
}
```

**Why This Matters**:
- Users may need **multiple scheme instantiations** to capture complex reasoning
- Same material relation (e.g., cause) appears in many schemes
- CQs test **both dimensions** - some test content, some test form

**Action**: Ensure UI communicates two-dimensional nature to users

### 2.2 Schemes as Practical Tools (Section 2.2)

**Four Practical Justifications** from paper:

**1. Analyzing Natural Arguments** (political, legal, scientific discourse)
- Mesh supports: ✅ AIF graph structure, scheme identification
- Enhancement: Argument mining from text (see Part 6)

**2. Teaching Critical Thinking** (informal logic movement)
- Problem identified: "Students conflate schemes instead of distinguishing"
- Mesh solution: ✅ Six-dimensional taxonomy provides differentiation
- Enhancement: Progressive disclosure for different skill levels

**3. Education - Construction & Assessment** (science education, rebutting)
- Current Mesh: Analysis only (identify schemes in existing arguments)
- **Critical Gap**: No argument construction/generation features
- Action: Implement "Find Arguments" assistant (see Section 8 Carneades)

**4. Argument Mining** (computational linguistics)
- Challenge: "Too many schemes for handy use"
- Solution: Cluster relationships, internal structure
- Mesh: ✅ Cluster tags, parent-child hierarchy
- Enhancement: Scheme-guided ML for text analysis

**5. Theoretical - Formal Systems** (ASPIC+, Carneades, DefLog)
- Validates that structured schemes work in AI
- Mesh correctly implements structured approach
- Enhancement: Add formal evaluation (proof standards, weighing)

### 2.3 Ancient Taxonomy Validates Modern Implementation

**From Section 3 - Cicero, Boethius, Abelard**:

**Cicero's Two-Part Division** (1st century BCE):
- **Intrinsic topics**: From subject matter itself
- **Extrinsic topics**: From external context (authority)

→ Maps exactly to `source: "internal" | "external"`

**Boethius's Classification** (6th century CE):

**Intrinsic Loci**:
- From substance (definition, description) → `materialRelation: "definition"`
- From the whole/genus → Classification schemes
- From causes (efficient, material, formal, final) → `materialRelation: "cause"`
- From effects, uses, accidents → `materialRelation: "correlation"`

**Extrinsic Loci**:
- From estimation/authority → `materialRelation: "authority"`
- From similar → `materialRelation: "analogy"`

**Maxima Propositio** (general warrant) = **Toulmin's Warrant** (1958)
- Boethius's structure anticipates Toulmin by 1,400 years!
- Our attack types map to Data/Warrant/Claim structure

**Abelard's Habitudo** (12th century):
- "Semantic-ontological connection between terms"
- Requires **assumptions** (content) for inference validity
- Maps to our **variables in formal structure**

**Validation**: Every taxonomy field has 1,000-2,400 year precedent

**Action**: Use historical grounding in marketing/documentation
- "2,400 years of rhetorical wisdom, now computational"
- "From Aristotle's Topics to AI-powered deliberation"

---

## Part 3: Critical Design Principles Extracted

### 3.1 Defeasibility is Central (Not Validity)

**From Section 2**:

Unlike deductive logic (valid/invalid), schemes are **defeasible**:
- Offer **presumptive conclusions** subject to retraction
- Provide "fast and frugal heuristics" for provisional decisions
- Enable practical reasoning under uncertainty
- Can be defeated by new evidence/counterarguments

**Why Schemes Exist**: 200-year eclipse during Enlightenment
- Only deduction and probability considered "rational"
- Topics tradition suppressed
- 20th century revival: Agents need **practical reasoning** without perfect certainty

**Mesh Implication**:

Current system correctly implements defeasibility via:
- CQs as attack vectors ✅
- Multiple attack types ✅
- Support/attack relations ✅

Enhancement: Emphasize **provisional nature** in UI
- Arguments are "currently accepted" not "proven true"
- Show confidence levels, not binary accept/reject
- Allow retraction when new evidence emerges

### 3.2 Classification Purpose Determines Criteria

**From Sections 1 & 5**:

**No Single "Correct" Classification** - purpose matters

**Mesh Purposes**:
1. **Analysis**: Given argument → identify scheme → apply CQs
2. **Production**: Given goal → select scheme → construct argument
3. **Education**: Teach patterns → provide examples → scaffold learning
4. **Mining**: Extract arguments from text → identify structures

**Different purposes need different navigation**:
- Analysis: Start with text, work backward to schemes
- Production: Start with goal, work forward to schemes
- Education: Start with categories, explore examples
- Mining: Pattern matching, statistical + structural

**Current Gap**: Mesh provides **single navigation** (hierarchical tree)

**Action Required**: Multi-entry-point system
1. **Taxonomy filters** (top-down dichotomic tree)
2. **Cluster browsing** (bottom-up family resemblances)
3. **Purpose-driven wizard** ("What are you trying to accomplish?")
4. **Text analysis** (paste text → suggest schemes)
5. **Search** (keyword/semantic search across schemes)

### 3.3 Hierarchical Relationships Capture Abstraction

**From Section 3 - Aristotle**:

**Generic vs. Specific Topics**:
> "Generic topics can be considered as abstractions from the specific ones."

**Generic** (κοινοί τόποι):
- Abstract, commonly shared principles
- Domain-independent
- Example: "From the more and the less"

**Specific** (ἴδια):
- Domain-specific instantiations
- Concrete applications
- Example: Legal presumptions in specific statute

**Mesh Implementation**: ✅ Correct
```typescript
parentSchemeId: string | null
inheritCQs: boolean
```

**Enhancement Needed**: CQ inheritance should be **automatic**
- Children inherit parent CQs + add own
- Currently manual duplication
- Action: Implement computed CQ inheritance

### 3.4 Warrants Bridge Data to Claims

**From Section 3.3 - Boethius**:

**Maximae Propositiones** (general warrants) structure arguments:
```
Data (specific premises)
  ↓ [via Maxim/Warrant]
Claim (conclusion)
```

**Toulmin (1958)** rediscovered same structure:
```
Data
  ↓ [Warrant]
Claim
  ↑ [Backing]
```

**Mesh Attack Types Map Directly**:
- `UNDERMINES` → attacks Data
- `UNDERCUTS` → attacks Warrant
- `REBUTS` → attacks Claim

**This is 1,400+ year old structure** in computational form!

**Action**: Emphasize warrant in UI
- Show explicit warrant for each argument
- CQs should foreground "What general principle connects premises to conclusion?"
- Make Toulmin structure visible to users

---

## Part 4: Strategic Overhaul Priorities

### Priority 1: Multi-Scheme Arguments (Critical Gap)

**Current State**: ❌ Insufficient
```typescript
model Argument {
  schemeId: string // Single scheme
}
```

**Research Finding** (Section 7): Arguments are **nets** of multiple interconnected schemes

**Required Change**: Model argument nets
```typescript
model ArgumentNet {
  id: string
  claimId: string
  primaryScheme: string // Dominant pattern
  nodes: ArgumentNode[]
  edges: ArgumentEdge[]
}

model ArgumentNode {
  id: string
  netId: string
  type: "premise" | "conclusion" | "intermediate"
  content: string
  explicitness: "explicit" | "presupposed" | "implied"
}

model ArgumentEdge {
  id: string
  netId: string
  sourceNodeId: string
  targetNodeId: string
  schemeId: string
  dependencyType: "premise_conclusion" | "presuppositional" | "support" | "justificational"
}
```

**Why Critical**:
- Real arguments use 3-4 schemes simultaneously
- Schemes depend on each other (classification enables commitment enables consequences)
- Cannot evaluate argument strength without seeing complete net
- CQs must target specific nodes/edges in net

**Implementation Phases**:
1. **Phase 1A**: Allow multiple scheme references on Argument (simple extension)
2. **Phase 1B**: Model full net structure (nodes + edges)
3. **Phase 1C**: Visualization of nets (graph view)
4. **Phase 1D**: Net-aware CQ composition

**User Impact**: Transform from "What scheme?" to "What's the argumentative strategy?"

### Priority 2: Burden of Proof (Critical Gap)

**Current State**: ❌ Missing
```typescript
model CriticalQuestion {
  question: string
  attackType: string
  targetScope: string
  // Missing: burdenOfProof, requiresEvidence
}
```

**Research Finding** (Section 8): CQs function differently re: burden of proof

**Gordon & Walton's Three Premise Types**:
1. **Ordinary**: Burden always on proponent
2. **Assumptions**: Burden shifts to proponent when questioned
3. **Exceptions**: Burden on challenger to prove

**Required Change**:
```typescript
model CriticalQuestion {
  question: string
  attackType: "REBUTS" | "UNDERCUTS" | "UNDERMINES"
  targetScope: "conclusion" | "inference" | "premise"
  burdenOfProof: "proponent" | "challenger" // NEW
  requiresEvidence: boolean // NEW - just ask vs. must prove
}

model SchemePremise {
  id: string
  schemeId: string
  content: string
  premiseType: "ordinary" | "assumption" | "exception" // NEW
}
```

**Why Critical**:
- Different CQs function differently (Section 8.2 - Verheij's four roles)
- Some CQs: just asking shifts burden
- Other CQs: must provide evidence to defeat
- Without this, users don't know rules of dialectical engagement

**UI Impact**:
```
User asks CQ: "Is the expert biased?"
System indicates: "⚖️ You must provide evidence of bias (burden on challenger)"

vs.

User asks CQ: "Is this person really an expert?"
System indicates: "⚖️ Original arguer must now prove expertise (burden shifted)"
```

**Implementation**: Update all CQs with burden/evidence fields

### Priority 3: Purpose-Driven Navigation (Missing Feature)

**Current State**: ❌ Single navigation mode (hierarchical tree)

**Research Finding** (Sections 4 & 5): Classification must be **purpose-driven** and **multi-dimensional**

**Critical Insight from Section 4**: All six modern systems fail at single-axis classification because schemes exist in **multi-dimensional space**. Users need multiple entry points depending on their goal.

**Required**: Multi-entry-point navigation system

**3.1 Dichotomic Tree Wizard**:
```
Step 1: "What's under discussion?"
  → Action (decision, policy)
  → State of affairs (fact, classification)

Step 2: "What's your warrant source?"
  → Internal (from thing itself)
  → External (from authority/testimony)

Step 3: [Dynamically generated based on Steps 1-2]
  Action + Internal:
    → Consequences of action
    → Means to achieve goal
  
  State of Affairs + Internal:
    → Existence (did it happen?)
    → Classification (what kind of thing?)
    → Evaluation (what's its value?)

Step 4: "What reasoning strength?"
  → Deductive (certain)
  → Inductive (probable)
  → Abductive (best explanation)

Result: Filtered to 2-5 applicable schemes
```

**3.2 Cluster-Based Browsing**:
```
Browse by family:
  • Decision-Making Cluster (practical reasoning, values, consequences)
  • Authority Cluster (expert opinion, witness testimony, position to know)
  • Causal Cluster (cause to effect, sign, correlation)
  • Definitional Cluster (classification, verbal classification, genus-species)
  • Analogical Cluster (analogy, parallel case, precedent)
```

**3.3 Text Analysis Entry**:
```
User pastes text:
  "Studies show that feature X increases engagement. 
   We should implement it."

System analyzes:
  • "Studies show" → expert opinion indicator
  • "should implement" → practical reasoning indicator
  • "increases engagement" → positive consequence indicator

System suggests:
  1. Argument from Expert Opinion (85% confidence)
  2. Practical Reasoning (90% confidence)
  3. Argument from Positive Consequences (75% confidence)

User confirms → system structures argument with scheme net
```

**3.4 Identification Conditions Filter**:
```
"What describes your situation?"
☐ Agent attempting to decide on action
☐ Evidence from circumstances available
☐ Decision based on goals
☐ Need to weigh competing reasons
☐ Decision based on values (not just goals)

[System filters to schemes matching checked conditions]
```

**Implementation**: Create `<SchemeNavigator>` component with multiple modes

### Priority 4: Argument Generation (Transformative Feature)

**Current State**: ❌ Analysis only (reactive)

**Research Finding** (Section 8.7 - Carneades): Schemes enable **argument invention**

**Shift**: From "What scheme is this?" to "What arguments could I make?"

**4.1 Attack Generation**:
```typescript
class ArgumentGenerationService {
  async suggestAttacks(
    targetClaimId: string,
    targetArgumentId?: string
  ): Promise<AttackSuggestion[]> {
    // 1. Identify scheme(s) in target argument
    const schemes = await this.identifySchemes(targetArgumentId)
    
    // 2. For each scheme, get applicable CQs
    const cqs = schemes.flatMap(s => s.criticalQuestions)
    
    // 3. Rank CQs by:
    //    - Burden of proof (prefer challenger burden on proponent)
    //    - Evidence requirements (prefer "just ask")
    //    - Attack type (diversify UNDERMINES/UNDERCUTS/REBUTS)
    
    // 4. For each CQ, generate attack template
    return cqs.map(cq => ({
      cq: cq,
      template: this.generateTemplate(cq),
      evidence Required: cq.requiresEvidence,
      strength: this.estimateStrength(cq, context)
    }))
  }
}
```

**4.2 Support Generation**:
```typescript
class ArgumentGenerationService {
  async suggestSupport(
    claimId: string,
    availableEvidence: string[]
  ): Promise<ArgumentSuggestion[]> {
    // 1. Get claim type (action vs. fact, ought vs. is)
    const claim = await this.getClaim(claimId)
    
    // 2. Filter schemes by claim type
    const applicable = this.getApplicableSchemes(claim)
    
    // 3. For each scheme, try to match evidence to premises
    const matches = applicable.map(scheme => {
      const premiseMatches = this.matchEvidenceToPremises(
        scheme.premises,
        availableEvidence
      )
      return {
        scheme,
        matchedPremises: premiseMatches,
        missingPremises: scheme.premises.filter(p => !premiseMatches.includes(p)),
        confidence: premiseMatches.length / scheme.premises.length
      }
    })
    
    // 4. Return ranked suggestions
    return matches
      .filter(m => m.confidence > 0.5)
      .sort((a, b) => b.confidence - a.confidence)
  }
}
```

**4.3 UI Flow**:
```
User: "I want to attack this claim"
↓
System: "This argument uses Expert Opinion scheme. Here are your options:"
  1. Question Expertise (CQ1) ⚖️ Burden shifts to proponent
     "Is [Person] really an expert in [Domain]?"
     → Attack template generated
  
  2. Show Bias (CQ2) ⚖️ You must provide evidence
     "Does [Person] have bias regarding [Topic]?"
     → Evidence requirements shown
  
  3. Present Conflicting Expert (CQ3) ⚖️ You must provide evidence
     "Is there another expert who disagrees?"
     → Suggest finding counter-expert

User selects option → System scaffolds argument construction
```

**Why Transformative**:
- Shifts from reactive to proactive
- From analysis to invention
- From "I don't know how to respond" to "Here are 5 ways to attack"
- From expert tool to novice-accessible tool

**Implementation**: Backend services + UI components for generation

### Priority 5: CQ Inheritance and Composition

**Current State**: ⚠️ Partial (manual duplication)

**Research Finding** (Sections 6 & 10): Complex schemes **inherit** CQs from components

**Example**: Value-Based Practical Reasoning
```
Value-Based PR = Instrumental PR + Argument from Values

CQs should include:
  • From Instrumental PR (5 CQs)
    - What other goals conflict?
    - What alternative actions?
    - Which is most efficient?
    - Is action practically possible?
    - What side effects?
  
  • From Argument from Values (3 CQs)
    - Is value actually positive/negative?
    - Does goal really promote value?
    - Are there conflicting values?
  
  • Own CQs (2 CQs specific to value-based variant)
    - Does value hierarchy justify this goal?
    - Are circumstances right for this value?
```

**Required**: Automatic CQ composition
```typescript
function getCriticalQuestions(schemeId: string): CriticalQuestion[] {
  const scheme = getScheme(schemeId)
  
  // Own CQs
  const ownCQs = scheme.criticalQuestions || []
  
  // Inherited from parent
  const inheritedCQs = scheme.parentId && scheme.inheritCQs
    ? getCriticalQuestions(scheme.parentId)
    : []
  
  // Inherited from composed schemes
  const composedCQs = (scheme.composedFrom || []).flatMap(
    componentId => getCriticalQuestions(componentId)
  )
  
  // Deduplicate and return
  return deduplicateCQs([...ownCQs, ...inheritedCQs, ...composedCQs])
}
```

**Enhancement**: Track CQ origin
```typescript
{
  question: "What other goals might conflict?",
  attackType: "UNDERMINES",
  inheritedFrom: "instrumental-practical-reasoning-id",
  applicableWhen: "base_scheme" // vs "always"
}
```

**UI Impact**: Show CQ groupings
```
Critical Questions for Value-Based Practical Reasoning:

▼ Core Questions (from this scheme)
  • Does value hierarchy justify this goal?
  • Are circumstances right for this value?

▼ Goal & Means Questions (inherited from Practical Reasoning)
  • What other goals conflict?
  • What alternative actions?
  • Which is most efficient?

▼ Value Assessment Questions (inherited from Argument from Values)
  • Is value actually positive?
  • Does goal promote value?
```

**Implementation**: Add `composedFrom` field, implement computed inheritance

---

## Part 5: Data Model Enhancements

### 5.1 ArgumentScheme Model Changes

**Current**:
```typescript
model ArgumentScheme {
  id: string
  name: string
  description: string
  parentId?: string
  inheritCQs: boolean
  clusterTags: string[]
  
  // Walton taxonomy (six fields)
  purpose: "action" | "state_of_affairs"
  source: "internal" | "external"
  materialRelation: string
  reasoningType: string
  ruleForm: string
  conclusionType: "ought" | "is"
  
  // Formal structure
  premises: Json
  conclusion: string
  variables: string[]
  
  // Relations
  criticalQuestions: CriticalQuestion[]
  childSchemes: ArgumentScheme[]
}
```

**Enhanced**:
```typescript
model ArgumentScheme {
  // Existing fields...
  
  // NEW: Composition relationships
  composedFrom: ArgumentScheme[] @relation("SchemeComposition")
  composedIn: ArgumentScheme[] @relation("SchemeComposition")
  
  // NEW: Functional relationships
  typicallyDefeats: ArgumentScheme[] @relation("TypicalDefeat")
  typicallyDefeatedBy: ArgumentScheme[] @relation("TypicalDefeat")
  
  // NEW: Identification aids
  identificationConditions: string[] // Situational requirements
  textIndicators: string[] // Keywords/phrases in text
  linguisticPatterns: Json // Regex or NLP patterns
  
  // NEW: Domain specificity
  domain?: string // "legal" | "scientific" | "policy" | "general"
  subdomain?: string
  applicableContexts: string[]
  
  // NEW: Educational
  examples: SchemeExample[]
  difficulty: "beginner" | "intermediate" | "advanced"
  prerequisiteSchemes: string[] // Should learn these first
}

model SchemeExample {
  id: string
  schemeId: string
  text: string
  analysis: string
  domain: string
}
```

### 5.2 CriticalQuestion Model Changes

**Current**:
```typescript
model CriticalQuestion {
  id: string
  cqKey: string
  schemeId: string
  question: string
  attackType: "REBUTS" | "UNDERCUTS" | "UNDERMINES"
  targetScope: "conclusion" | "inference" | "premise"
}
```

**Enhanced**:
```typescript
model CriticalQuestion {
  // Existing fields...
  
  // NEW: Burden of proof
  burdenOfProof: "proponent" | "challenger"
  requiresEvidence: boolean // Just ask vs. must prove
  
  // NEW: Scheme relationships
  invokesScheme?: string // Points to another scheme
  inheritedFrom?: string // If inherited from composed/parent scheme
  applicableWhen: "always" | "base_scheme" | "variant_only"
  
  // NEW: Guidance
  evidenceTypes: string[] // What kind of evidence needed
  commonResponses: string[] // Typical ways to answer
  exampleAttacks: string[] // Sample attack arguments
}
```

### 5.3 Argument Model Changes (Critical)

**Current** (❌ Insufficient):
```typescript
model Argument {
  id: string
  claimId: string
  schemeId?: string // SINGLE SCHEME
  text: string
  sourceUrl?: string
}
```

**Enhanced** (Net-based):
```typescript
model Argument {
  id: string
  claimId: string
  text: string
  
  // NEW: Multi-scheme support
  primarySchemeId?: string // Dominant pattern
  net?: ArgumentNet // Full net structure
  
  // Existing relations
  supportedBy: Argument[]
  attacks: Argument[]
}

model ArgumentNet {
  id: string
  argumentId: string
  claimId: string
  
  nodes: ArgumentNode[]
  edges: ArgumentEdge[]
  
  explicitness: "fully_explicit" | "partially_reconstructed" | "heavily_reconstructed"
}

model ArgumentNode {
  id: string
  netId: string
  
  type: "premise" | "conclusion" | "intermediate"
  content: string
  explicitness: "explicit" | "presupposed" | "implied"
  
  textEvidence?: string // Quote if explicit
  justification?: string // Why reconstructed if implicit
}

model ArgumentEdge {
  id: string
  netId: string
  
  sourceNodeId: string
  targetNodeId: string
  schemeId: string
  
  dependencyType: "premise_conclusion" | "presuppositional" | "support" | "justificational" | "sequential"
  isExplicit: boolean
}
```

### 5.4 New Models Required

**5.4.1 SchemeNetPattern** (Common Patterns):
```typescript
model SchemeNetPattern {
  id: string
  name: string
  description: string
  domain: string
  
  schemes: string[] // Scheme IDs in typical order
  typicalDependencies: Json // Structure of common links
  
  examples: string[]
  frequency: number // How often this pattern occurs
}
```

**5.4.2 Issue** (Carneades-style):
```typescript
model Issue {
  id: string
  deliberationId: string
  
  question: string
  positions: IssuePosition[]
  proofStandard?: "preponderance" | "clear_and_convincing" | "beyond_reasonable_doubt"
  
  resolution?: string // Which position won
  resolvedAt?: DateTime
}

model IssuePosition {
  id: string
  issueId: string
  
  stance: string
  supportingArguments: Argument[]
  attackingArguments: Argument[]
  strength: number // Computed
}
```

**5.4.3 CommonKnowledgePattern** (Domain Knowledge):
```typescript
model CommonKnowledgePattern {
  id: string
  domain: string
  
  fromScheme: string
  toScheme: string
  typicalLinks: string[] // Intermediate premises
  
  description: string
  examples: string[]
}
```

---

## Part 6: UI/UX Transformation

### 6.1 SchemeSpecificCQsModal → ArgumentNetAnalyzer

**Current Component**: SchemeSpecificCQsModal
- Assumes single scheme
- Lists CQs flatly
- Text-based responses

**New Component**: ArgumentNetAnalyzer
```typescript
<ArgumentNetAnalyzer
  argument={argument}
  mode="analysis" // or "construction"
>
  {/* Multi-scheme identification */}
  <NetSchemeIdentifier 
    text={argument.text}
    onSchemesIdentified={(schemes) => ...}
  />
  
  {/* Net visualization */}
  <NetVisualization
    net={argumentNet}
    onNodeClick={(node) => showNodeDetails(node)}
    onEdgeClick={(edge) => showEdgeCQs(edge)}
  />
  
  {/* Composed CQ sets */}
  <ComposedCQPanel
    net={argumentNet}
    groupBy="scheme" // or "attackType" or "burdenOfProof"
    onCQSelect={(cq, targetScheme) => constructAttack(cq)}
  />
  
  {/* Attack construction wizard */}
  <AttackConstructionWizard
    selectedCQ={selectedCQ}
    burdenIndicator={true}
    evidenceGuidance={true}
    templateGenerator={true}
  />
</ArgumentNetAnalyzer>
```

### 6.2 Scheme Selection: Multi-Entry Navigation

**New Component**: SchemeNavigator
```typescript
<SchemeNavigator>
  <NavigationTabs>
    <Tab label="Guided Wizard">
      <DichotomicTreeWizard
        onComplete={(selectedSchemes) => ...}
      />
    </Tab>
    
    <Tab label="Browse Clusters">
      <ClusterBrowser
        clusters={schemes.groupBy('clusterTags')}
        onSchemeSelect={(scheme) => ...}
      />
    </Tab>
    
    <Tab label="Analyze Text">
      <TextAnalyzer
        onTextSubmit={(text) => suggestSchemes(text)}
        onSchemeConfirm={(schemes) => ...}
      />
    </Tab>
    
    <Tab label="Situation Filter">
      <IdentificationConditionsFilter
        conditions={allConditions}
        onFilter={(matchingSchemes) => ...}
      />
    </Tab>
    
    <Tab label="Search">
      <SchemeSearch
        mode="keyword" // or "semantic"
        onResultsFound={(schemes) => ...}
      />
    </Tab>
  </NavigationTabs>
</SchemeNavigator>
```

### 6.3 Argument Generation Interface

**New Component**: ArgumentGenerator
```typescript
<ArgumentGenerator
  claimId={claimId}
  mode="attack" // or "support"
>
  {/* Step 1: Identify target structure */}
  <TargetAnalysis
    argument={targetArgument}
    schemes={identifiedSchemes}
  />
  
  {/* Step 2: Suggest attack options */}
  <AttackSuggestions
    suggestions={generatedOptions}
    sortBy="burdenOfProof" // or "strength" or "type"
  >
    {suggestions.map(s => (
      <AttackOption
        cq={s.cq}
        burdenIndicator={s.burdenOfProof}
        evidenceRequired={s.requiresEvidence}
        template={s.template}
        onSelect={() => startConstruction(s)}
      />
    ))}
  </AttackSuggestions>
  
  {/* Step 3: Guide construction */}
  <AttackConstructionGuide
    selectedOption={selected}
    evidenceGuidance={true}
    exampleAttacks={true}
    strengthEstimator={true}
  />
</ArgumentGenerator>
```

### 6.4 Net Visualization Component

**New Component**: NetVisualization
```typescript
<NetVisualization
  net={argumentNet}
  layout="hierarchical" // or "force" or "circular"
>
  {/* Nodes with explicitness styling */}
  <Nodes>
    {net.nodes.map(node => (
      <ArgumentNode
        key={node.id}
        content={node.content}
        type={node.type}
        explicitness={node.explicitness}
        style={{
          border: node.explicitness === 'explicit' ? 'solid' : 
                  node.explicitness === 'presupposed' ? 'dashed' : 'dotted'
        }}
        onClick={() => showNodeDetails(node)}
      />
    ))}
  </Nodes>
  
  {/* Edges with scheme labels */}
  <Edges>
    {net.edges.map(edge => (
      <ArgumentEdge
        key={edge.id}
        source={edge.sourceNodeId}
        target={edge.targetNodeId}
        schemeLabel={getScheme(edge.schemeId).name}
        dependencyType={edge.dependencyType}
        onClick={() => showEdgeCQs(edge)}
      />
    ))}
  </Edges>
  
  {/* Interactive exploration */}
  <InteractionLayer
    onPathHighlight={(path) => ...}
    onClusterSelection={(cluster) => ...}
  />
</NetVisualization>
```

---

## Part 7: Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)

**Week 1: Data Model Updates**
- [ ] Add `composedFrom` to ArgumentScheme
- [ ] Add `burdenOfProof` and `requiresEvidence` to CriticalQuestion
- [ ] Add `premiseType` to scheme formal structure
- [ ] Update ArgumentScheme with identification fields
- [ ] Run migrations, update seed data

**Week 2: CQ Enhancement**
- [ ] Audit all existing CQs
- [ ] Add burden of proof to each CQ
- [ ] Add evidence requirements
- [ ] Implement automatic CQ inheritance
- [ ] Test CQ composition for complex schemes

**Week 3: Scheme Composition**
- [ ] Identify composite schemes (value-based PR, slippery slope, etc.)
- [ ] Add `composedFrom` relationships
- [ ] Implement CQ inheritance algorithm
- [ ] Test inheritance with nested compositions
- [ ] Document composition patterns

**Week 4: Basic Net Support**
- [ ] Create ArgumentNet, ArgumentNode, ArgumentEdge models
- [ ] Implement simple net creation (2-3 schemes)
- [ ] Test net storage and retrieval
- [ ] Create basic net visualization (graph library research)

### Phase 2: Multi-Entry Navigation (Weeks 5-8)

**Week 5: Dichotomic Tree Wizard**
- [ ] Implement step-by-step wizard component
- [ ] Purpose selection (action vs. state of affairs)
- [ ] Source selection (internal vs. external)
- [ ] Dynamic filtering based on selections
- [ ] Test with users

**Week 6: Cluster Browser**
- [ ] Define semantic clusters (decision-making, authority, causal, etc.)
- [ ] Update scheme metadata with cluster tags
- [ ] Implement cluster browse UI
- [ ] Add cluster descriptions and examples
- [ ] Navigation between related schemes

**Week 7: Identification Conditions Filter**
- [ ] Define identification conditions for common schemes
- [ ] Create filter UI (checkboxes)
- [ ] Implement real-time filtering
- [ ] Add explanatory text for conditions
- [ ] Test with novice users

**Week 8: Unified SchemeNavigator**
- [ ] Integrate all navigation modes
- [ ] Tab-based interface
- [ ] Preserve user preferences (default mode)
- [ ] Add search functionality
- [ ] User testing and refinement

### Phase 3: Argument Generation (Weeks 9-12)

**Week 9: Backend Services**
- [ ] ArgumentGenerationService
- [ ] Attack suggestion algorithm
- [ ] Support suggestion algorithm
- [ ] Template generation
- [ ] Confidence scoring

**Week 10: Attack Generator UI**
- [ ] AttackSuggestions component
- [ ] Burden of proof indicators
- [ ] Evidence requirement display
- [ ] Attack templates
- [ ] Selection workflow

**Week 11: Construction Wizard**
- [ ] AttackConstructionGuide component
- [ ] Evidence guidance
- [ ] Example attacks
- [ ] Strength estimator
- [ ] Submission flow

**Week 12: Support Generator**
- [ ] Support suggestion UI
- [ ] Premise matching
- [ ] Missing premise identification
- [ ] Evidence upload/link
- [ ] Argument creation from template

### Phase 4: Net Analysis (Weeks 13-16)

**Week 13: Net Identification**
- [ ] Multi-scheme detection in arguments
- [ ] Dependency inference
- [ ] Explicitness classification
- [ ] Reconstruction suggestions
- [ ] User confirmation workflow

**Week 14: Net Visualization**
- [ ] Graph visualization component
- [ ] Layout algorithms (hierarchical, force-directed)
- [ ] Node styling by explicitness
- [ ] Edge labeling by scheme
- [ ] Interactive exploration

**Week 15: Net-Aware CQs**
- [ ] ComposedCQPanel with net awareness
- [ ] Grouping by scheme/attackType/burden
- [ ] Dependency CQs ("Does A actually enable B?")
- [ ] Node targeting in net
- [ ] CQ → scheme navigation

**Week 16: ArgumentNetAnalyzer Integration**
- [ ] Integrate all net features
- [ ] Replace SchemeSpecificCQsModal
- [ ] Backward compatibility for simple arguments
- [ ] User testing
- [ ] Documentation

### Phase 5: Polish & Enhancement (Weeks 17-20)

**Week 17: Text Analysis**
- [ ] Text indicator matching
- [ ] Linguistic pattern recognition
- [ ] Scheme suggestion algorithm
- [ ] Confidence scoring
- [ ] Multi-scheme suggestion

**Week 18: Educational Features**
- [ ] Scheme examples library
- [ ] Difficulty levels
- [ ] Prerequisite chains
- [ ] Progressive disclosure
- [ ] Tutorial mode

**Week 19: Domain Specialization**
- [ ] Domain tagging (legal, scientific, policy)
- [ ] Domain-specific CQs
- [ ] Domain filters
- [ ] Import legal/scientific schemes
- [ ] Expert validation

**Week 20: Testing & Refinement**
- [ ] User acceptance testing
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] Documentation updates
- [ ] Launch preparation

---

## Part 8: Success Metrics

### 8.1 Theoretical Soundness

**Metric**: Alignment with research findings
- ✅ All six taxonomy dimensions have historical grounding
- ✅ Attack types validated by 30+ years AI research
- ✅ Multi-scheme nets supported (Section 7 finding)
- ✅ Burden of proof modeled (Section 8 finding)
- ✅ CQ inheritance implemented (Section 10 finding)

### 8.2 User Experience

**Metrics**:
- **Scheme Selection Time**: Reduce from 5min to 2min (purpose-driven navigation)
- **Attack Construction Success**: Increase from 40% to 80% (generation assistant)
- **Novice Confidence**: Increase self-reported confidence from 3/10 to 7/10
- **Expert Precision**: Maintain precision for advanced users (multi-entry navigation)

### 8.3 System Capabilities

**Metrics**:
- **Multi-Scheme Arguments**: Support 90%+ of real arguments (currently 0%)
- **CQ Coverage**: Provide complete CQ set via inheritance (currently partial)
- **Generation Quality**: 70%+ of generated attacks deemed "helpful" by users
- **Net Reconstruction**: Successfully identify 80%+ of scheme dependencies

### 8.4 Educational Impact

**Metrics**:
- **Learning Curve**: Reduce time to competence from 10 hours to 5 hours
- **Pattern Recognition**: Users identify schemes in text with 70%+ accuracy
- **Argumentation Quality**: User-constructed arguments improve in dialectical strength
- **Transfer**: Users apply skills beyond Mesh (critical thinking improvement)

---

## Part 9: Risk Mitigation

### 9.1 Complexity Risk

**Risk**: System becomes too complex for casual users

**Mitigation**:
- Progressive disclosure (beginner/intermediate/advanced modes)
- Default to simple single-scheme workflow
- "Advanced" toggle for net features
- Guided tutorials
- Contextual help

### 9.2 Migration Risk

**Risk**: Breaking changes to existing arguments/schemes

**Mitigation**:
- Backward compatibility layer
- Single-scheme arguments still work (nets optional)
- Migration scripts for existing data
- Gradual rollout (feature flags)
- Parallel systems during transition

### 9.3 Performance Risk

**Risk**: Net analysis and generation slow down UI

**Mitigation**:
- Backend processing for heavy operations
- Progressive rendering (show primary scheme first)
- Caching of generation results
- Lazy loading of net visualizations
- Performance monitoring

### 9.4 Adoption Risk

**Risk**: Users resist change, prefer old interface

**Mitigation**:
- Opt-in for new features initially
- Clear value proposition (generate attacks automatically!)
- User testimonials from beta testers
- Training materials and webinars
- Gradual deprecation of old features

---

## Part 10: Conclusion

### 10.1 Vision Summary

Transform Mesh from **argument tracking tool** → **intelligent argumentation platform**:

**From**:
- Single scheme per argument
- Manual scheme selection
- Reactive analysis only
- Flat taxonomy browsing
- Uniform CQ treatment

**To**:
- Multi-scheme nets with dependencies
- AI-assisted scheme identification
- Proactive argument generation
- Multi-dimensional purpose-driven navigation
- Functionally differentiated CQs with burden of proof

**Grounded In**:
- 2,400 years of rhetorical tradition (Aristotle → Boethius → Modern)
- 30+ years of AI argumentation research (Pollock, Verheij, Prakken, Gordon, Walton, Reed)
- Comprehensive theoretical framework from foundational paper

### 10.2 Strategic Value

**For Novice Users**:
- Guided workflows reduce learning curve
- Argument generation assists construction
- Clear burden indicators prevent confusion
- Examples and templates scaffold learning

**For Expert Users**:
- Multi-scheme nets capture complexity
- Multi-entry navigation enables efficiency
- Formal net analysis supports research
- Generation assistant speeds workflow

**For Research/Education**:
- Theoretically grounded architecture
- Exportable to standard formats (AIF)
- Contribution to open corpora
- Validation against established systems

**For the Field**:
- Demonstrates computational argumentation at scale
- Bridges 2,400 years of theory with modern UX
- Shows schemes enable both analysis AND construction
- Proves practical value of formal argumentation

### 10.3 Next Steps

**Immediate** (Next 2 Weeks):
1. Review this strategy document with team
2. Prioritize Phase 1 tasks
3. Begin data model updates
4. Prototype basic net structure

**Short-Term** (Next 3 Months):
1. Complete Phase 1 (Foundation)
2. Begin Phase 2 (Multi-Entry Navigation)
3. User testing with beta group
4. Refine based on feedback

**Medium-Term** (6 Months):
1. Complete Phases 2-3 (Navigation + Generation)
2. Limited public release
3. Gather usage data
4. Iterate on generation algorithms

**Long-Term** (12 Months):
1. Complete all 5 phases
2. Full public launch
3. Research publications
4. Community building (educators, researchers)

### 10.4 Call to Action

This is not merely a feature enhancement—it's a **fundamental transformation** grounded in rigorous theoretical analysis. The research is clear: arguments are nets, not atoms; schemes enable invention, not just analysis; classification must serve purpose, not abstract correctness.

We have an opportunity to build something unprecedented: a system that makes 2,400 years of argumentation theory **accessible, practical, and computational**. From Aristotle's Topics to AI-powered deliberation platforms. From elite scholarly debate to everyday civic discourse.

The foundations are correct. The architecture is sound. The research is comprehensive. Now we build.

---

**Document Version**: 1.0  
**Last Updated**: November 8, 2025  
**Status**: Strategic Planning - Pending Team Review  
**Next Review**: After Part 2-6 analysis integration

