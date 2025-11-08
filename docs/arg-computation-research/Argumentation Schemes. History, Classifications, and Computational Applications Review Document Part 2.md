# Argumentation Schemes: History, Classifications, and Computational Applications
## Detailed Section-by-Section Review - Part 2

**Paper Authors**: Fabrizio Macagno, Douglas Walton, Chris Reed  
**Review Purpose**: Understanding the foundational research that informed the Mesh project's scheme/CQ architecture  
**Reviewer**: AI Analysis for Mesh Development Team  
**Date**: Current review session

*Continuation from Part 1 (Sections 1-3)*

---

## Section 4: Modern Theories of Schemes

### Overview
This section surveys six major 20th-century classification systems for argumentation schemes, showing how modern theorists adapted (or sometimes abandoned) the ancient distinctions from Section 3. The paper analyzes the strengths and limitations of each approach, revealing that **no single criterion** suffices for comprehensive classification.

### Key Theme Across All Modern Systems

**Universal Problem**: Each system mixes different classification criteria without clearly specifying their interrelation:
- Logical form (deduction, induction, abduction)
- Material relation (cause, definition, analogy)
- Pragmatic function (action vs. fact, normative vs. descriptive)
- Dialectical function (pro vs. contra)
- Epistemic status (real vs. fictive)

**Paper's Critique**: "The interrelation between all these criteria is not specified, and there is not a unique rationale linking all such different arguments."

### 4.1 Perelman and the New Rhetoric (1969)

#### **Two Fundamental Purposes**

**Association**: Finding connections between concepts (most schemes)
**Dissociation**: Breaking apart concepts that were previously united

#### **Three Classes of Association Arguments**

**1. Quasi-Logical Arguments**:
- Resemble formal logical structures
- But operate on natural language, not formal symbols
- Examples: contradiction, identity, transitivity

**2. Arguments Establishing the Structure of Reality**:
- Create or reveal relationships between things
- Examples: causal relations, means-end relations

**3. Arguments Based on the Structure of Reality**:
- Use pre-existing relationships
- Examples: authority (existing expertise), example (existing instances)

**4. Dissociation** (separate class):
- Breaking apart unified concepts
- Distinguishing appearance from reality
- Creating conceptual distinctions

#### **Evaluation**

**Multiple Criteria Used**:
- Conceptual/ontological structure (association vs. dissociation)
- Reference to structure of reality (establishing vs. based on)
- Logical structure (quasi-logical vs. non-logical)
- Type of relations (sequential vs. coexistence)

**Critical Limitation**:
> "However, the interrelation between all these criteria is not specified, and there is not a unique rationale linking all such different arguments."

**For Mesh**: Perelman emphasizes **rhetorical purpose** over logical form—relevant for understanding why users choose particular schemes

### 4.2 Toulmin, Rieke & Janik (1984)

#### **Warrant-Based Classification**

**Core Idea**: Classify by the **function of the warrant** (the principle connecting data to claim)

**Nine General Classes**:
1. **Argument from authority**
2. **Argument from classification** (genus-species, definition)
3. **Argument from cause**
4. **Argument from sign**
5. **Argument from analogy**
6. **Argument from degree** (more/less, comparative)
7. **Argument from generalization**
8. **Argument from dilemma**
9. **Argument from opposites**

Each class has subclasses based on specific warrant variants.

#### **Evaluation**

**Mixed Criteria Problem**:
- Some represent **types of reasoning**: generalization, sign, analogy
- Some represent **logical rules**: dilemma, opposites (modus tollens variants)
- Some represent **content**: authority, classification, cause, degree

**Critical Limitation**:
> "Also in this case, different criteria are used in the classification. [...] The relationship between the various criteria is not given."

**Significance for Mesh**: Toulmin's warrant structure (Data → [Warrant] → Claim) is the foundation of our attack type system:
- UNDERMINES → attacks Data
- UNDERCUTS → attacks Warrant
- REBUTS → attacks Claim

This is the **modern formulation** of Boethius's maxim-based structure (Section 3.3).

### 4.3 Kienpointner's Alltagslogik (1992)

#### **Four-Dimensional Classification**

**Most Sophisticated System**: Uses **four independent criteria** to characterize every scheme:

**1. Type of Inference** (Logical dimension):
- Deduction
- Induction  
- Abduction
- Rule application vs. rule establishment

**2. Epistemic Nature of Premises**:
- **Real**: Based on truth or likeliness
- **Fictive**: Based on mere possibility (counterfactuals)

**3. Dialectical Function of Conclusion**:
- **Pro**: Supporting a thesis
- **Contra**: Opposing a thesis

**4. Pragmatic Function of Conclusion**:
- **Descriptive**: "Is" claims (state of affairs)
- **Normative**: "Ought" claims (action/evaluation)

#### **Three Top-Level Classes**

**Class 1: Argument Schemes Using a Rule** (Most schemes):

Subdivided by **material relation** into four categories:
- **Classification schemes**: From definition, genus-species, part-whole
- **Comparison schemes**: From analogy, similarity, degree (more/less)
- **Opposition schemes**: From contraries, opposites, incompatibility
- **Causal schemes**: From cause to effect, effect to cause, means to end

**Class 2: Argument Schemes Establishing a Rule by Induction**:
- Generalization from examples
- Statistical inference
- Building general principles from instances

**Class 3: Argument Schemes Both Using and Establishing a Rule**:
- Hybrid patterns (rare)
- Example: Argument from precedent (establishes principle while applying it)

#### **Cross-Cutting Variants**

**Every scheme can have variants along all four dimensions**:

Example: Argument from cause to effect could be:
- Deductive or inductive (type of inference)
- Real or fictive (epistemic nature)
- Pro or contra (dialectical function)
- Descriptive or normative (pragmatic function)

→ This generates **many scheme variations** from each basic pattern

#### **Evaluation**

**Strengths**:
- Most systematic multi-dimensional approach
- Clear criteria for each dimension
- Accounts for pragmatic and dialectical functions

**Limitation**:
> "The possible limitation of this system is that while the material relation of many deductive schemes is specified and distinguished, the content dimension of the inductive schemes is not pointed out."

**Significance for Mesh**: Kienpointner's four dimensions map closely to our taxonomy:

| Kienpointner | Our Taxonomy Field |
|--------------|-------------------|
| Type of Inference | `reasoningType` + `ruleForm` |
| Epistemic Nature | (Not explicitly captured—could add) |
| Dialectical Function | (Implicit in attack types: pro/contra) |
| Pragmatic Function | `conclusionType` (ought/is) + `purpose` (action/state_of_affairs) |

Our system implements 3 of his 4 dimensions. **Epistemic nature** (real/fictive) could be valuable addition for counterfactual reasoning.

### 4.4 Pragma-Dialectics: Van Eemeren & Grootendorst (1992)

#### **Three Basic Schemes**

**Minimalist Approach**: Reduce all schemes to three fundamental types:

**1. Symptomatic Argumentation**:
- Something is a **sign or symptom** of something else
- "X is symptomatic of Y"
- Examples: Smoke indicates fire, fever indicates illness
- **Combines**: Abductive reasoning pattern + causal material relation

**2. Argumentation Based on Similarities**:
- Grounded on **analogy** between premise and conclusion
- "X is like Y in relevant respects"
- Examples: Argument from analogy, argument from parallel case

**3. Instrumental Argumentation** (Causal):
- Linked by **very broad relation of causality**
- Means-end relationships
- Consequence-based reasoning

#### **Subclassifications**

**Under Symptomatic**:
- Arguments from inherent qualities
- Arguments from characteristic parts
- Arguments from authority (expert's knowledge is symptom of truth)

**Under Instrumental (Causal)**:
- Arguments from consequences
- Arguments from means-end
- Arguments from waste (sunk costs)

#### **Evaluation**

**Mixed Criteria**:
- Causal = **material relation** type
- Analogical = **type of reasoning** (independent of content)
- Symptomatic = **combination** of abductive pattern + causal relation

**Critical Limitation**:
> "This system of classification is grounded on a twofold criterion. While causal argumentation is characterized by a material relation, analogical argumentation represents a type of reasoning independent from the specific content of the premises and conclusion."

**Inconsistent abstraction level**: One category is content-based, another is form-based.

**Significance for Mesh**: Shows tension between **material** and **logical** dimensions (Section 2's fundamental insight). Can't cleanly separate them—some schemes are inherently hybrid.

### 4.5 Grennan (1997)

#### **Warrant Types + Claim Types**

**Two-Axis Classification**:
- **X-axis**: 9 warrant types (how premise supports conclusion)
- **Y-axis**: 8 claim types (what kind of conclusion)

**9 Warrant Types**:

1. **Cause to Effect**: P produces C
2. **Effect to Cause**: P is best explained by C (abductive)
3. **Sign**: P is symptomatic of C
4. **Sample to Population**: What's true of sample is true of population (inductive generalization)
5. **Parallel Case**: What's true of one X is true of other Xs (analogy)
6. **Analogy**: Proportional reasoning (A:B :: C:D)
7. **Population to Sample**: What's true of population is true of this instance (deduction from general)
8. **Authority**: Source S is reliable
9. **Ends-Means**: Action C achieves end P

**8 Claim Types**:

| Type | Description | Example |
|------|-------------|---------|
| **Obligation** | X must do A | "Sam must apologize" |
| **Supererogatory Actuative** | X ought to do A (for others' benefit) | "I ought to help the needy" |
| **Prudential Actuative** | X ought to do A (for X's benefit) | "Canadians ought to avoid heart disease" |
| **Evaluative** | Grading, rating, comparison | "This is a good cantaloupe"; "Steffi Graf is the best" |
| **Physical-World** | Brute facts + institutional facts | "The sun is setting"; "Dodgers won 3-2" |
| **Mental-World** | Mental phenomena ascriptions | "He is upset" |
| **Constitutive-Rule** | Definitions, necessary truths | "Majority = members present and voting"; "Iron doesn't float" |
| **Regulative-Rule** | Obligations, prohibitions | "Driving on the right is obligatory" |

#### **Cross-Product Matrix**

**Combination**: Each claim type can be supported by multiple warrant types

**Example - Obligation Claims** (Figure 3 in paper):

```
Obligation Claims can be supported by:
├── Arguments with Obligation Premises
│   ├── Sample-to-population version
│   └── Population-to-group version
└── Obligation Claims with Other Premises
    ├── Effect-to-cause version
    ├── Evaluative-premise version
    ├── Physical world premise version
    │   ├── Institutional claim version
    │   └── Brute fact version
    ├── Mental world premise version
    └── Regulative rule premise version
        └── Cause-to-effect version
```

**Each combination** = distinct scheme pattern

#### **Evaluation**

**Strengths**:
- "Extremely deep as regards the relation between speech acts and argument"
- Separates **warrant function** from **claim type** (two independent dimensions)
- Rich account of normative/practical reasoning

**Limitation**:
> "But is limited to 8 warrant types."

Only 9 basic warrants—much smaller set than Walton's 60+ schemes.

**Significance for Mesh**: Grennan's claim typology maps to our `conclusionType` and `purpose` fields:

| Grennan Claim Type | Our Fields |
|--------------------|------------|
| Obligation, Actuative | `purpose: "action"`, `conclusionType: "ought"` |
| Physical-World, Mental-World | `purpose: "state_of_affairs"`, `conclusionType: "is"` |
| Constitutive-Rule | Definitional schemes, necessary inferences |
| Regulative-Rule | Normative/deontic logic |

His **speech act dimension** (institutional facts) could enhance our system—connecting argument types to illocutionary forces.

### 4.6 Katzav & Reed (2004)

#### **Relations of Conveyance**

**Core Concept**: "How one fact necessitates another"

**Definition**: Relations describing **how premises convey conclusions**—the mechanism of inference transmission.

**Example - Causal Conveyance**:

```
Fact 1: The US military attacked Iraq
Causal Relation: Military invasion causes regime change
Fact 2: Saddam's regime fell

Argument:
"Saddam's regime fell, because the US military attacked Iraq and 
if the US military were to attack Iraq, Saddam's regime would fall."
```

The **subjunctive conditional** reveals the causal relation of conveyance.

#### **Top-Level Distinction: Internal vs. External**

**Internal Relations of Conveyance**:
- Depend solely on **intrinsic features** of concepts
- Established by definitions, conceptual structures
- Examples: definitional, cladistic (taxonomic), mereological (part-whole), normative

**External Relations of Conveyance**:
- Depend on **extrinsic features** (how world is)
- Established by empirical facts, causal laws
- Examples: spatiotemporal, causal, statistical

**Mapping to Ancient Tradition**:
- Internal ≈ Cicero/Boethius **intrinsic** loci
- External ≈ Cicero/Boethius **extrinsic** loci

Confirms continuity from ancient to modern theory!

#### **Hierarchical Classification Tree**

**Internal Relations**:

1. **Relation of Specification**:
   - Species to genus
   - Genus to species
   - Determinable-determinate

2. **Relation of Constitution**:
   - **Abstract fact constitution**:
     - Constitution of normative facts (positive/negative)
     - Constitution of non-normative abstract facts
     - Constitution of necessary conditions
     - Constitution of causal laws
     - Constitution of singular causal conditionals
     - Constitution of possibility/impossibility
   - **Concrete fact constitution**:
     - Species/kind instance constitution
     - Property instance constitution
     - Property constitution by properties/particulars
   - Constitution of singular causal facts
   - Part-whole relations

3. **Relation of Analyticity**:
   - Sameness of meaning
   - Stipulative definition
   - Implication

4. **Relation of Identity**:
   - Qualitative identity
   - Numerical identity

**External Relations**:

1. **Non-Causal Dependence**:
   - Non-causal laws (conservation, symmetry)
   - Nomological incompatibility
   - Topological structure conveyance

2. **Causal Dependence**:
   - **Efficient cause conveyance**:
     - Causal laws
     - Singular cause to effect
     - Singular effect to cause
     - Common cause
   - **Final cause conveyance** (teleological)

#### **Evaluation**

**Strengths**:
- Rooted in metaphysics/ontology (relations between facts)
- Clear internal/external division
- Captures Aristotelian four causes (efficient, final explicitly; formal/material implicitly)

**Limitation**:
> "Though the mapping from individual relations of conveyance in this classification to the argumentation schemes in [Walton et al., 2008] is not a trivial 1-to-1 correspondence..."

Some schemes combine multiple conveyance relations—not cleanly mappable.

**Significance for Mesh**: Their internal/external distinction confirms our `source` field:
```typescript
source: "internal" | "external"
```

**Deeper insight**: "Relations of conveyance" = **material relations** (Section 2). The Aristotelian causes appear:
- Efficient cause → causal schemes
- Final cause → practical reasoning (means-end)
- Formal cause → definitional schemes
- Material cause → mereological schemes (part-whole)

Our `materialRelation` field implements conveyance types!

### 4.7 Lumer & Dove (2011)

#### **Three General Classes**

**Class 1: Deductive Argument Schemes**:
- Elementary deductive schemes (modus ponens, modus tollens, disjunctive syllogism)
- **Analytical arguments**:
  - Definitoric arguments (from definition)
  - Subsuming legal arguments (applying rule to case)

**Class 2: Probabilistic Argument Schemes**:
- **Pure probabilistic**: Statistics, signs
- **Impure probabilistic**: Best explanation (abduction with probabilistic assessment)

**Class 3: Practical Argument Schemes**:
- Pure practical arguments for pure evaluations
- Impure practical arguments:
  - For justification of actions
  - For justification of instruments (means-end)
- Arguments for evaluations based on adequacy conditions
- Arguments for welfare-ethical value judgments
- Practical arguments for theoretical theses

#### **Evaluation**

**Mixed Criteria Problem** (again):
- Classes 1-2: Characterized by **type of reasoning** (deductive, probabilistic)
- Class 3: Characterized by **pragmatic purpose** (recommending action)
- Subclasses mix **logical form** (analytic) with **premise nature** (definitoric, subsuming)

**Critical Observation**:
> "This system consists of a mix of two distinct criteria, logical and pragmatic."

**Authors' Conclusion**:
> "All these types of classification show how a sole criterion is not sufficient for providing a clear and comprehensive classification of schemes."

**Significance for Mesh**: Practical reasoning deserves special status (Class 3 separate). Our system recognizes this:
```typescript
reasoningType: "practical" // distinct from deductive/inductive/abductive
purpose: "action" // vs. "state_of_affairs"
```

Action-oriented reasoning has different structure than truth-oriented reasoning.

### Cross-Cutting Analysis: What Modern Systems Reveal

#### **1. No Single-Criterion Classification Works**

**Universal Finding**: Every system mixes multiple criteria because schemes are inherently **multi-dimensional**.

**Dimensions Identified Across Systems**:
- **Logical**: Type of reasoning, inference rules
- **Material**: Semantic/ontological relations
- **Pragmatic**: Purpose (action vs. fact), conclusion type
- **Dialectical**: Pro vs. contra, attack vs. support
- **Epistemic**: Real vs. fictive, certainty level
- **Rhetorical**: Audience-adaptation, persuasive function

**Implication for Mesh**: Our **six-field taxonomy** is justified:
```typescript
{
  purpose: "action" | "state_of_affairs",        // Pragmatic
  source: "internal" | "external",               // Material
  materialRelation: "cause" | "definition" | ..., // Material
  reasoningType: "deductive" | "inductive" | ..., // Logical
  ruleForm: "MP" | "MT" | ...,                   // Logical
  conclusionType: "ought" | "is"                 // Pragmatic
}
```

We're implementing a **multi-dimensional space**, not a linear taxonomy.

#### **2. Warrant Is Central Organizing Concept**

**Toulmin's Contribution**: The **warrant** (principle connecting data to claim) provides unified view:
- Material relation = **content of warrant**
- Logical form = **structure of warrant**
- All classifications are really warrant classifications

**Boethius + Toulmin Connection**:
- Maxima propositio (ancient) = Warrant (modern)
- Same conceptual role across 1400 years
- Our attack types operate on this structure

#### **3. Internal/External Distinction Persists**

**Ancient** (Cicero, Boethius): Intrinsic vs. Extrinsic  
**Modern** (Katzav & Reed): Internal vs. External

**Still fundamental** after 2000+ years:
- Internal: From subject matter (definitions, causes, parts)
- External: From context (authority, testimony, common practice)

Our `source: "internal" | "external"` implements this perennial distinction.

#### **4. Action vs. Fact Fundamental Division**

**Grennan**: 8 claim types, but fundamentally split into:
- **Actuative** (obligation, supererogatory, prudential) → action
- **Theoretical** (physical-world, mental-world, constitutive-rule) → fact

**Lumer & Dove**: Practical arguments separate class

**Ancient** (Cicero): Action schemes vs. conjecture/definition schemes

Our `purpose` field:
```typescript
purpose: "action" | "state_of_affairs"
```

Captures this fundamental division across 2000 years.

#### **5. Classification Purpose Matters**

**Kienpointner's Strength**: Accounts for **dialectical function** (pro/contra)
- Same scheme can support OR attack thesis
- User's goal affects which scheme is appropriate

**Pragmatic Function**: Descriptive vs. normative conclusions
- Not just logical form—**what you're trying to accomplish**

**Implication for Mesh**: Our system must support:
- **Analysis mode**: Identify schemes in existing arguments
- **Construction mode**: Generate arguments for specific goals
- **Dialectical mode**: Attack existing arguments with CQs

Different purposes → different interface needs.

#### **6. Schemes Combine Multiple Relations**

**Pragma-Dialectics Insight**: "Symptomatic argumentation is a combination of these two criteria"
- Abductive **reasoning pattern** + causal **material relation**
- Can't cleanly separate logical from material

**Section 2 Confirmation**: Schemes are **prototypical combinations** of material + logical

**Implication for Mesh**: Some schemes inherently **hybrid**:
- Argument from sign = abduction + correlation
- Practical reasoning = deduction + causal + normative
- Can't always decompose into pure material × logical

Our formal structure must allow **complex combinations**.

### Connection to Mesh Architecture

#### **1. Multi-Dimensional Taxonomy Justified**

**All six systems** show single criterion insufficient:

| System | Criteria Mixed |
|--------|---------------|
| Perelman | Ontological + logical + relational |
| Toulmin | Reasoning type + content + logical rules |
| Kienpointner | Inference + epistemic + dialectical + pragmatic |
| Pragma-Dialectics | Reasoning + material relation |
| Grennan | Warrant type + claim type |
| Katzav & Reed | Internal/external + relation subtypes |
| Lumer & Dove | Logical + pragmatic + premise nature |

**Our Six Fields** address different dimensions:
```typescript
{
  purpose,           // Pragmatic dimension (Grennan, Lumer)
  source,            // Internal/external (Katzav & Reed, ancient tradition)
  materialRelation,  // Content/warrant (all systems)
  reasoningType,     // Logical form (all systems)
  ruleForm,          // Specific inference rule (Kienpointner, Toulmin)
  conclusionType     // Normative vs. descriptive (Kienpointner, Grennan)
}
```

Each field captures **orthogonal dimension** identified across multiple systems.

#### **2. Epistemic Dimension Missing (Could Add)**

**Kienpointner's Insight**: Real vs. fictive premises
- Real: Based on actual facts
- Fictive: Counterfactual reasoning ("If X were true, then Y...")

**Not currently in our taxonomy**—could add:
```typescript
epistemicStatus?: "real" | "fictive" | "hypothetical"
```

Would enable:
- Counterfactual reasoning
- Thought experiments
- Hypothetical scenario analysis

#### **3. Dialectical Function Implicit (Could Make Explicit)**

**Kienpointner's Dialectical Dimension**: Pro vs. contra
- Same scheme can support or attack thesis

**Currently implicit** in our attack types:
- User constructs attacks via CQs
- But scheme itself not marked as pro/contra

**Could enhance**:
```typescript
dialecticalFunction?: "pro" | "contra" | "neutral"
```

Would help with:
- Argument generation for specific side
- Identifying counterargument schemes
- Dialogue move planning

#### **4. Toulmin Structure = Our Attack Types**

**Toulmin's Data-Warrant-Claim**:
```
Data (premises)
  ↓ [Warrant]
Claim (conclusion)
```

**Our Attack Types**:
```typescript
attackType: "UNDERMINES" | "UNDERCUTS" | "REBUTS"
```

**Direct Mapping**:
- UNDERMINES → attacks Data
- UNDERCUTS → attacks Warrant
- REBUTS → attacks Claim

**This is Toulmin's structure** operationalized for computational dialectics!

#### **5. Grennan's Claim Types → Our Purpose + Conclusion Fields**

**Grennan's 8 Claim Types** map to our two fields:

| Grennan | Our Mapping |
|---------|-------------|
| Obligation, Actuative | `purpose: "action"`, `conclusionType: "ought"` |
| Physical-World | `purpose: "state_of_affairs"`, `conclusionType: "is"` |
| Mental-World | `purpose: "state_of_affairs"`, `conclusionType: "is"` |
| Evaluative | `purpose: "state_of_affairs"`, `conclusionType: "is"` (could refine) |
| Constitutive-Rule | Definitional schemes with necessary inference |
| Regulative-Rule | Deontic logic, normative rules |

**Could add finer granularity**:
```typescript
conclusionType: "ought" | "is" | "evaluative" | "deontic"
```

#### **6. Katzav & Reed's Conveyance = Our Material Relations**

**Their Classification Tree** → **Our MaterialRelation Values**:

| Conveyance Type | Our MaterialRelation |
|-----------------|---------------------|
| Efficient cause conveyance | `"cause"` |
| Specification (genus-species) | `"definition"` |
| Analyticity, Identity | `"definition"` |
| Proportion, Similarity | `"analogy"` |
| Authority (implicit) | `"authority"` |
| Final cause (teleological) | `"practical"` |
| Associated properties | `"correlation"` |

**Could expand** to capture Aristotelian four causes explicitly:
```typescript
materialRelation: 
  | "efficient_cause"  // What produces effect
  | "material_cause"   // What it's made of (part-whole)
  | "formal_cause"     // What it is (definition, essence)
  | "final_cause"      // Purpose, goal (teleological)
  | ...
```

#### **7. Practical Reasoning Deserves Special Status**

**Multiple Systems** treat practical reasoning as distinct:
- Lumer & Dove: Separate Class 3
- Grennan: Actuative claim types separate
- Ancient: Action schemes vs. theoretical schemes

**Our Implementation**:
```typescript
reasoningType: "practical"  // distinct value
purpose: "action"           // action-oriented
conclusionType: "ought"     // normative conclusion
```

**Special formal structure** for practical reasoning:
```
Goal: G
Action A achieves G
Circumstances permit A
Values support G
---
Therefore: (ought to) do A
```

This requires **different premise types** than theoretical schemes.

### Critical Insights for Implementation

#### **Design Principle 1: Multi-Dimensional Navigation**

**All Modern Systems Fail** at single-axis classification because schemes exist in **multi-dimensional space**.

**Our UI Should Support**:
- **Top-down dichotomic filtering** (Section 2.3):
  - Purpose: Action or fact?
  - Source: Internal or external?
  - Reasoning: Deductive, inductive, abductive, practical?
  - Material: Cause, definition, analogy, authority, correlation?

- **Bottom-up cluster browsing**:
  - Group by materialRelation
  - Group by reasoningType
  - Group by parent scheme
  - Group by clusterTag

- **Cross-dimensional queries**:
  - "Show causal schemes with deductive reasoning"
  - "Show practical schemes from internal sources"
  - "Show schemes with 'ought' conclusions"

#### **Design Principle 2: Warrant Is the Core**

**Toulmin's Insight** (4.2): All schemes are really **warrant types**

**For SchemeSpecificCQsModal**:
- CQs primarily test **warrant validity**
- UNDERCUTS = "Is this warrant legitimate?"
- Some CQs test premises (UNDERMINES)
- Some CQs test conclusion (REBUTS)

**UI Should Emphasize**:
- "What general principle connects premises to conclusion?"
- "Does this principle hold in this case?"
- "What would defeat this principle?"

#### **Design Principle 3: Purpose Determines Selection**

**Kienpointner + Grennan**: Classification must serve **user's goal**

**Mesh Should Ask**:
1. **What are you trying to prove?**
   - An action should be taken (purpose: action)
   - A fact is true (purpose: state_of_affairs)

2. **What kind of connection do you have?**
   - Causal relation
   - Definitional relation
   - Analogical relation
   - Authoritative source

3. **What reasoning do you want?**
   - Deductive (certain)
   - Inductive (probable)
   - Abductive (best explanation)
   - Practical (goal-directed)

**Guided workflow** beats browsing 60+ schemes.

#### **Design Principle 4: Schemes Are Hybrid**

**Pragma-Dialectics Insight**: Some schemes combine material + logical inseparably

**Implication**: Don't force complete decomposition
- Argument from sign = abductive reasoning + correlational relation (inseparable)
- Practical reasoning = deductive rule + causal relation + normative evaluation (inseparable)

**Allow complex formal structures**:
```typescript
premises: [
  { type: "major", text: "Goal G is valuable" },      // Normative
  { type: "minor", text: "Action A achieves G" },     // Causal
  { type: "minor", text: "A is feasible" }            // Circumstantial
]
```

Multiple **material relations** in one scheme.

#### **Design Principle 5: Real vs. Fictive Matters**

**Kienpointner's Epistemic Dimension**: Real vs. fictive reasoning

**Use Cases We Should Support**:
- **Real**: "Russia invaded Ukraine, therefore X"
- **Fictive**: "If Russia invaded Ukraine, then X would follow"
- **Hypothetical**: "Suppose Russia invaded Ukraine. Then..."

**Counterfactual CQs**:
- "But that condition doesn't actually hold"
- "In reality, the opposite is true"
- "The hypothetical is implausible"

**Could add field**:
```typescript
epistemicMode: "factual" | "counterfactual" | "hypothetical"
```

### Questions Raised by Section 4

1. **Perelman's Dissociation**: Not covered in our taxonomy
   - Breaking apart concepts previously unified
   - Distinguishing appearance from reality
   - Creating new conceptual distinctions
   - Do we need dissociation schemes?

2. **Grennan's Speech Acts**: Institutional facts vs. brute facts
   - "Dodgers won" (institutional) vs. "Sun is setting" (brute)
   - Connection to illocutionary force
   - Could enhance dialogue system

3. **Warrant Explicit or Implicit?**: Should warrants be:
   - Part of formal structure (explicit major premise)?
   - Separate field in scheme definition?
   - Recoverable from materialRelation + reasoningType?

4. **How Many Schemes Do We Need?**: 
   - Perelman: 100+ (very fine-grained)
   - Pragma-Dialectics: 3 (very coarse)
   - Grennan: 9 × 8 = 72 combinations (matrix)
   - Walton: 60+ (current standard)
   - What's optimal for computation + usability?

### Section 4 Summary

**What We Learned**:

1. **No Single Criterion Works**: All six systems mix multiple dimensions (logical, material, pragmatic, dialectical, epistemic)
2. **Warrant Is Central**: Toulmin's data-warrant-claim structure unifies understanding across systems
3. **Internal/External Persists**: Ancient intrinsic/extrinsic distinction still fundamental in modern theories
4. **Action/Fact Division Universal**: Practical reasoning recognized as distinct across all systems
5. **Multi-Dimensional Space**: Schemes exist in high-dimensional space; single-axis classification inevitably fails
6. **Purpose-Driven Selection**: User's goal determines which scheme is appropriate (not just logical form)

**Implementation Validations**:

✅ **Six-field taxonomy justified** by multiple independent systems identifying same dimensions  
✅ **Attack types = Toulmin structure** (data/warrant/claim) operationalized computationally  
✅ **Purpose + conclusionType** implement action/fact distinction across 2000+ years  
✅ **MaterialRelation values** map to Katzav & Reed's conveyance types  
✅ **Practical reasoning separate** from deductive/inductive/abductive (Lumer & Dove)  

**Design Implications**:

1. **Multi-dimensional navigation**: Support both top-down filtering and bottom-up clustering
2. **Warrant-centric CQs**: Focus on testing warrant validity, not just answering questions
3. **Purpose-driven workflow**: Guide users by goal, not just by browsing scheme list
4. **Allow hybrid structures**: Some schemes inseparably combine multiple material relations
5. **Consider epistemic mode**: Real vs. fictive distinction (Kienpointner) could enhance system

**Potential Enhancements**:

1. Add `epistemicMode: "factual" | "counterfactual" | "hypothetical"`
2. Add `dialecticalFunction: "pro" | "contra" | "neutral"`  
3. Expand `conclusionType` to include "evaluative", "deontic"
4. Make warrant explicit in formal structure (optional major premise)
5. Add Aristotelian four causes to `materialRelation` options

**Critical Revelation for Phase A**:

Modern theories confirm that **warrant testing** is the primary function of CQs:
- Toulmin: Warrant connects data to claim
- Boethius: Maxim warrants inference
- All CQs fundamentally ask: "Does this warrant hold?"

**SchemeSpecificCQsModal should**:
1. Foreground the **warrant** (general principle)
2. Present CQs as **tests of warrant validity**
3. Map CQ responses to **attacks on warrant** (UNDERCUTS)
4. Show how attacks **break the inferential link**

This is not "answering questions"—it's **testing the bridge** from premises to conclusion.

**Next Section to Review**: Section 5 - "Using the Schemes: A Classification System"
- Walton/Macagno's proposed system
- Pragmatic purpose as overarching principle
- Action vs. state of affairs as first division
- Internal vs. external as second division
- Detailed dichotomic classification tree

---

