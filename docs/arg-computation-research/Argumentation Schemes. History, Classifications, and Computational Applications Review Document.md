# Argumentation Schemes: History, Classifications, and Computational Applications
## Detailed Section-by-Section Review

**Paper Authors**: Fabrizio Macagno, Douglas Walton, Chris Reed  
**Review Purpose**: Understanding the foundational research that informed the Mesh project's scheme/CQ architecture  
**Reviewer**: AI Analysis for Mesh Development Team  
**Date**: Current review session

---

## Section 1: Introduction

### Overview
This section establishes three core goals for the paper and traces the historical evolution of argumentation schemes from Aristotelian topics to modern computational applications.

### Three Primary Goals

1. **Descriptive Goal**: Show how argumentation schemes evolved from traditional theories (Aristotle's topics) to modern formulations, including their classification systems across different theoretical traditions

2. **Methodological Goal**: Propose a method for classifying schemes based on both ancient distinctions and modern developments

3. **Applied Goal**: Demonstrate how schemes can be used modularly to describe, analyze, and produce real arguments by combining different schemes to represent complex reasoning

### Key Conceptual Foundations

#### **Argumentation Schemes as Abstract Structures**
- Definition: Schemes are "abstract structures representing the most generic types of argument"
- Function: They constitute the "building blocks" of everyday reasoning
- Nature: They are **stereotypical patterns of inference** that capture common argument forms

#### **Critical Questions: The Defeasibility Mechanism**
- **Every scheme has a corresponding set of critical questions**
- Critical questions represent:
  - Defeasibility conditions (when the argument might fail)
  - Possible weak points an interlocutor can exploit
  - Ways to evaluate argument strength

**Tactical Use**: A critic with no ready counterarguments can:
1. Search through the critical questions for the identified scheme
2. Look for clues on how to attack the argument
3. Find sources of evidence to build refutations

#### **Historical Evolution: From Topics to Schemes**

**Aristotelian Origins**:
- Ancient Greek term: *topoi* (τόποι) - "places to find arguments"
- Aristotle described these in the *Topics*
- Most ancient topics don't directly resemble modern schemes
- **Exception**: Argument from analogy remains recognizable across 2000+ years

**The Gap**: 
- Most Aristotelian topics as described don't map cleanly to the modern scheme list in Walton, Reed & Macagno (2008)
- Despite differences in detail, the underlying function (finding and evaluating arguments) remains constant

### The Classification Challenge

#### **The Fundamental Problem**
The theory needs "a useful and sound classification system" that is:
- **Usable**: Easy for practitioners to apply
- **Identifiable**: Schemes can be quickly recognized in discourse
- **Specific**: Allows detection of the most precise pattern fitting the text/purpose
- **Flexible**: Accounts for multiple classification purposes

#### **Purpose-Dependent Classification**
The paper makes a crucial methodological point using an analogy:
- **Example**: Animal classification differs by field
  - Biology: Highly detailed taxonomic system
  - Law: Different categories based on legal relevance  
  - Everyday English: Common-sense groupings

**Implication**: "The purpose of the classification will determine the criteria for classification"

**Action Item**: We must specify our purpose first, then derive classification criteria

### Connection to Mesh Architecture

#### **Relevance to Our System**

1. **CQ Architecture**:
   - Our system implements critical questions at the scheme level
   - Each scheme in `SchemeCreator.tsx` has associated CQs with attack types
   - This directly implements Walton's vision: CQs as "defeasibility conditions"

2. **Attack Type Mapping**:
   - UNDERMINES → challenges premise (data)
   - UNDERCUTS → challenges inference (warrant)
   - REBUTS → challenges conclusion (claim)
   - This maps to the "weak points" concept in Section 1

3. **Scheme Hierarchy**:
   - The paper hints at relationships between schemes (family resemblances)
   - Our `parentSchemeId` and `inheritCQs` features implement this
   - CQ inheritance = propagating defeasibility conditions down taxonomic tree

4. **Modular Argument Construction**:
   - The paper's third goal (modular description) foreshadows Section 7's "nets of schemes"
   - Complex arguments = chains of scheme instantiations
   - Relevant to how arguments compose in our AIF graph

### Critical Insights for Implementation

#### **Design Principle 1: Defeasibility is Central**
- Schemes are not just inference patterns
- They are **defeasible inference patterns**
- Critical questions embody the defeasibility
- **Implication**: SchemeSpecificCQsModal must emphasize this adversarial testing function

#### **Design Principle 2: Classification Must Serve Purpose**
- No single "correct" classification of schemes
- Classification criteria depend on use case:
  - **Analysis**: Identify schemes in existing text
  - **Production**: Generate arguments for specific purposes
  - **Education**: Teach students to distinguish argument types
  - **Computation**: Enable automated argument mining

**Our Purpose**: Dual-mode system
- Analysis mode: Help users identify which scheme their reasoning instantiates
- Production mode: Guide users in constructing valid scheme instantiations

#### **Design Principle 3: Historical Continuity**
- Modern schemes descend from 2000+ year tradition
- Core concepts (topics as "places," defeasibility, dialectical testing) are ancient
- Our system participates in this long intellectual tradition
- Implementation should respect theoretical foundations, not just mimic UX patterns

### Questions Raised by Section 1

1. **CQ Generation**: The paper says "every scheme has a corresponding set of critical questions"
   - How were these determined historically?
   - Section 2.1 mentions "sets of critical questions" but not their derivation
   - Later sections may clarify

2. **Scheme Granularity**: 
   - What level of specificity is optimal?
   - "Most specific pattern that can fit the text"
   - But also: usable and easily identifiable
   - Tension between precision and usability

3. **Modernization Gap**:
   - Why don't Aristotelian topics map to modern schemes?
   - What changed in the intervening 2000 years?
   - Section 3 will presumably address this

### Terminology Established

| Term | Definition | Mesh Equivalent |
|------|------------|-----------------|
| **Argumentation Scheme** | Abstract structure representing generic argument type | `ArgumentScheme` model with formal structure |
| **Critical Question** | Question representing defeasibility condition | CQ in our system with `attackType` and `targetScope` |
| **Topics** (τόποι) | Ancient Greek: "places to find arguments" | Conceptual ancestor of our schemes |
| **Defeasibility** | Property of being subject to defeat by counterargument | Our attack mechanism (REBUTS/UNDERCUTS/UNDERMINES) |

### Section 1 Summary

**What We Learned**:
1. Argumentation schemes are 2000-year-old concept with modern computational formalization
2. Critical questions are not auxiliary features—they ARE the defeasibility mechanism
3. Classification must be purpose-driven, not theoretically "pure"
4. The gap between ancient and modern reflects evolution in logical/dialectical theory

**Implementation Implications**:
1. SchemeSpecificCQsModal should foreground CQs as **adversarial testing mechanisms**
2. Scheme hierarchy (parent-child, CQ inheritance) has deep theoretical justification
3. Our system's attack types implement defeasibility in computational form
4. Classification by purpose → our Walton taxonomy fields serve this function

**Next Section to Review**: Section 2 - "Introducing Argumentation Schemes"
- Will define schemes formally
- Explain their structure and nature
- Justify their importance
- Begin classification discussion

---

## Section 2: Introducing Argumentation Schemes

### Overview
This section provides the formal definition of argumentation schemes, explains their dual nature (combining material relations with logical forms), and establishes why they are crucial for modern argumentation theory and computational applications.

### 2.1 Nature of the Schemes

#### **Formal Definition**
**Argumentation schemes are stereotypical patterns of inference, combining:**
1. **Semantic-ontological relations** (material content between concepts)
2. **Types of reasoning** (induction, deduction, abduction)
3. **Logical axioms** (rules of inference like modus ponens, modus tollens)

**They represent**: "the abstract structure of the most common types of natural arguments"

#### **The Two-Dimensional Structure**

**Critical Insight**: Schemes are NOT modeled by:
- Classical deductive logic alone
- Bayesian probability/statistical inference alone
- They transcend both traditional frameworks

**Instead they combine two distinct dimensions:**

| Dimension | Description | Example |
|-----------|-------------|---------|
| **Material Relation** | Semantic/ontological connection between concepts (the warrant) | Causal relation: "fever causes fast breathing" |
| **Logical Form** | Type of reasoning + inference rule | Modus ponens, modus tollens, abduction, induction |

#### **The Fever Example: One Material Relation, Five Logical Forms**

The paper provides a **crucial demonstration** using the causal relation "fever → breathing fast":

**Same Material Relation (cause-effect), Different Logical Forms:**

1. **Defeasible Modus Ponens** (forward deduction):
   - Premise: He had fever
   - Warrant: Fever causes breathing fast
   - Conclusion: Therefore, he (must have) breathed fast

2. **Defeasible Modus Tollens** (backward deduction):
   - Premise: He did NOT breathe fast
   - Warrant: Fever causes breathing fast
   - Conclusion: Therefore, he had NO fever

3. **Abduction (affirming consequent)**:
   - Premise: He IS breathing fast
   - Warrant: Fever causes breathing fast
   - Conclusion: Therefore, he MIGHT have fever

4. **Abduction (denying antecedent)**:
   - Premise: He has NO fever
   - Warrant: Fever causes breathing fast (contrapositive: no fast breathing → no fever)
   - Conclusion: Therefore, he MAY NOT be breathing fast

5. **Inductive Generalization**:
   - Premise: When I had fever, I was breathing fast; you are breathing fast
   - Conclusion: You MAY have fever (generalization from single case)

**Implication**: "Schemes represent only the **prototypical matching** between semantic relations and logical rules. This matching is, however, only the most common one."

#### **Key Architectural Principle**

> "The material and the logical relations can combine in several different ways. Hence this distinction needs to be taken into account in order to classify the schemes."

**For Mesh**: Our Walton taxonomy fields capture the **material relation** dimension:
- `materialRelation`: cause, definition, analogy, authority, practical, correlation
- `reasoningType`: deductive, inductive, abductive, practical
- `ruleForm`: MP (modus ponens), MT (modus tollens), defeasible_MP, universal

This two-dimensional model explains why we need BOTH taxonomic classification AND formal premise/conclusion structure.

### 2.2 Why Schemes Are Important

The paper provides **four practical justifications** and **one theoretical justification** for schemes:

#### **Practical Justification 1: Analyzing Natural Arguments**

**Use Case**: Discourse analysis in politics, law, science
- Example: Political debates analyzed by argument scheme preferences
- Thousands of real examples in argumentation literature
- Fallacy analysis aided by argument mapping tools

**Inductive Justification Method** (4 steps):
1. Outline scheme structure from literature
2. Analyze significant mass of real examples using the scheme
3. Show the scheme's importance for natural language discourse
4. Provide empirical justification for recognizing it as basic

**Mesh Connection**: Our AIF graph + scheme instantiation system enables this kind of analysis at scale

#### **Practical Justification 2: Teaching Critical Thinking**

**Historical Context**: Informal logic movement
- Departed from formal logic's limitations
- Based on analyzing real arguments "on the hoof"
- Textbooks filled with everyday examples (magazines, newspapers)

**Key Work**: Walton's *Informal Logic* (1989)
- 150+ key examples
- Personal attack, expert opinion, analogy, correlation to cause
- Abstract schemes tested against "vagaries of real-life examples"

**Confirmation**: Certain argument types are:
- Extremely common in practice
- Highly influential in daily argumentation
- Recognizable as patterns across contexts

**Mesh Connection**: Our system can serve educational purposes—teaching users to recognize and construct valid arguments

#### **Practical Justification 3: Education (Argument Construction & Learning)**

**Modern Applications**:
- Science education: representing student arguments
- Retrieving implicit premises
- Assessing and rebutting reasoning systematically
- Quality assessment of argumentation

**Critical Problem Identified**: 
> "Students often fail to understand the differences between various types of arguments, and recent developments in education tend to conflate the schemes instead of providing criteria for classifying or distinguishing between them."

**Implication**: Our classification system (Walton taxonomy + hierarchy) addresses this educational need by providing clear differentiation criteria

#### **Practical Justification 4: Argument Mining (Computational Linguistics)**

**Recognition**: Schemes are crucial for automated argument extraction from text

**Challenge**: "There are **too many schemes for handy use**"

**Solution Needed**: 
- Configure relationships between **clusters** of schemes
- Understand internal structure of each cluster
- Enable computational tools to work efficiently

**Mesh Connection**: Our scheme hierarchy and cluster tags directly address this—grouping related schemes into manageable families

#### **Theoretical Justification: Formal Argumentation Models**

**Schemes fit into modern AI systems:**
- **ASPIC+** (formal argumentation framework)
- **DefLog** (Verheij's defeasible logic)
- **Carneades Argumentation System** (Walton & Gordon)

**Core Scheme List**: 60+ schemes in Walton et al. (2008), including:
- Argument from expert opinion
- Argument from sign
- Argument from example
- Argument from commitment
- Argument from position to know
- Argument from lack of knowledge
- Practical reasoning (goal to action)
- Argument from cause to effect
- Sunk costs argument
- Argument from analogy
- Ad hominem argument
- Slippery slope argument

**Teleological Justification** (Walton & Sartor 2013):
> "The use of a specific scheme is warranted by the fact that it can serve an agent's goals better than using nothing, and better than other alternative schemata."

**Practical Reasoning**: Defeasible schemes allow agents to reach presumptive conclusions when:
- Continued evidence collection would cause delay
- Time and money costs matter
- Perfect certainty is unattainable

**Two Goal Types**:
1. **Epistemic cognition**: Getting to truth
2. **Practical cognition**: Making best choice in circumstances

#### **Historical Continuity: The Eclipse and Return**

**Enlightenment Period**: Schemes eclipsed
- Only deductive logic and probability recognized as "rational"
- Topics tradition suppressed for ~200 years

**20th Century Revival**: 
- Hastings (1963) - first modern identification
- Perelman & Olbrechts-Tyteca (1969) - New Rhetoric
- Kienpointner (1992) - classification systems
- Walton (1995) - comprehensive catalog
- Grennan (1997) - warrant-based typology
- **Walton, Reed & Macagno (2008)** - definitive modern list

**Since 2008**: Recognized as crucial for computational argumentation models in natural language discourse

### 2.3 Classification of the Schemes: How to Proceed

#### **The Dual Approach**

The paper proposes combining **two methodologies**:

**1. Top-Down Approach**:
- Find **dichotomic criteria** (binary distinctions)
- Allow users to decide scheme needed by:
  - Direct identification
  - Exclusion (ruling out non-matches)
- Study existing classification systems for useful criteria

**2. Bottom-Up Approach**:
- Start with **ground-level examples**
- Identify cases where multiple schemes seem to apply
- Study relationships **within clusters** of schemes
- Examine how clusters fit together
- Gradually build overarching system

**Rationale**: "Working from there, we identify clusters of schemes that fit together, and then at the next step, we examine how these clusters can be fitted together. Once clusters of schemes are fitted together into larger groups, we can gradually learn how they fit into an overarching system."

### Connection to Mesh Architecture

#### **1. Two-Dimensional Model Validation**

Our `ArgumentScheme` model captures both dimensions:

**Material Dimension** (Walton taxonomy):
```typescript
purpose: "action" | "state_of_affairs"
source: "internal" | "external"  
materialRelation: "cause" | "definition" | "analogy" | "authority" | "practical" | "correlation"
conclusionType: "ought" | "is"
```

**Logical Dimension** (formal structure):
```typescript
reasoningType: "deductive" | "inductive" | "abductive" | "practical"
ruleForm: "MP" | "MT" | "defeasible_MP" | "universal"
premises: Array<{id, type, text, variables}>
conclusion: {text, variables}
```

**This is theoretically sound**: We're implementing the two-dimensional architecture described in 2.1.

#### **2. Defeasibility via Critical Questions**

Section 2.2's emphasis on "dialectical instruments to test strength" confirms:
- CQs are not just helpful additions
- They ARE the defeasibility mechanism
- They enable "weighing pro and con arguments"

**Our Implementation**:
```typescript
cqs: Array<{
  cqKey: string,
  text: string,
  attackType: "REBUTS" | "UNDERCUTS" | "UNDERMINES",
  targetScope: "conclusion" | "inference" | "premise"
}>
```

Each CQ = a potential attack vector = a defeasibility condition

#### **3. Cluster-Based Organization**

Section 2.3's "bottom-up" approach validates our `clusterTag` system:
- Group related schemes into families
- Study internal structure of clusters
- Examine how clusters relate to each other
- Build from specific to general

**Our Clusters** (from SchemeHierarchyView):
- Group semantically related schemes
- Enable filtering by cluster
- Show cluster statistics
- Support cluster-based navigation

#### **4. Educational Application**

Section 2.2's education justification (point 3) directly supports:
- Our scheme creator interface (teaching construction)
- CQ system (teaching adversarial testing)
- Hierarchy view (teaching relationships)
- Taxonomy fields (teaching differentiation)

**The identified problem** ("students conflate schemes") is solved by our:
- Six-dimensional classification (Walton taxonomy)
- Clear parent-child hierarchy
- Explicit CQ-to-scheme mapping
- Attack type annotations

#### **5. Computational Application**

Section 2.2's argument mining justification (point 4) confirms:
- Schemes enable automated argument extraction
- "Too many schemes" problem needs cluster solution
- Our hierarchy + clusters directly address this

**Our Advantage**: AIFdb-compatible structure enables:
- Argument mining from natural language
- Scheme recognition via pattern matching
- Cluster-based search optimization
- Computational reasoning engines (ASPIC+, Carneades)

### Critical Insights for Implementation

#### **Design Principle 1: Prototypical vs. Exhaustive**

**Key Quote**: "Schemes represent only the prototypical matching between semantic relations and logical rules."

**Implication**: 
- Don't expect one scheme to cover all variations
- Same material relation can generate multiple schemes (fever example)
- Users may need to instantiate MULTIPLE schemes to fully capture complex reasoning
- This justifies our "nets of schemes" approach (previewed in Section 1, detailed in Section 7)

#### **Design Principle 2: Dialectical Function**

**Key Quote**: "Critical questions, dialectical instruments to help begin the procedure of testing the strength and acceptability of an argument by weighing the pro and con arguments."

**Implication**:
- SchemeSpecificCQsModal should emphasize **adversarial testing**
- CQs are entry points for **counterargument construction**
- The goal is **dialectical evaluation**, not just "answering"
- UI should foreground "attack construction" over "text grounding"

#### **Design Principle 3: Teleological Justification**

**Key Quote**: "The use of a specific scheme is warranted by the fact that it can serve an agent's goals better than using nothing."

**Implication**:
- Schemes are **practical tools** for decision-making under uncertainty
- They enable "presumptive conclusions" when evidence is incomplete
- Users should be guided to select schemes based on **their argumentative goals**
- Our taxonomy's `purpose` field (action vs. state_of_affairs) captures this

#### **Design Principle 4: Two Approaches to Classification**

**Top-Down**: Dichotomic decision tree
- Start with broadest distinctions
- Narrow down by exclusion
- Guided selection interface

**Bottom-Up**: Cluster relationships
- Start with similar schemes
- Understand variations within cluster
- Navigate between related patterns

**Implication**: Our UI should support BOTH:
- Taxonomy-based filtering (top-down)
- Cluster-based browsing (bottom-up)

### Questions Raised by Section 2

1. **CQ Generation**: Section 2.2 mentions CQs "test strength" but doesn't explain HOW they're derived
   - Are they manually identified from empirical examples?
   - Can they be systematically generated from taxonomy dimensions?
   - Our `generateCQsFromTaxonomy()` function suggests yes—later sections may clarify

2. **Scheme Variants**: The fever example shows 5 logical variants of one material relation
   - Should we represent these as 5 separate schemes or 1 scheme with 5 forms?
   - Does `ruleForm` field capture this distinction adequately?
   - Later classification sections (4, 5) may address

3. **60+ Schemes**: Walton et al. (2008) has 60+ schemes
   - How many are "basic" vs. "compound"?
   - What's the optimal granularity for computational use?
   - Argument mining needs smaller set—hierarchy helps

4. **Enlightenment Eclipse**: Why were schemes suppressed for 200 years?
   - Deductive logic dominance
   - Presumed "irrationality" of defeasible reasoning
   - Modern AI revived them because agents need practical reasoning under uncertainty

### Terminology Established

| Term | Definition | Mesh Equivalent |
|------|------------|-----------------|
| **Material Relation** | Semantic/ontological connection between concepts (the warrant) | `materialRelation` field: cause, definition, analogy, etc. |
| **Logical Form** | Type of reasoning + inference rule | `reasoningType` + `ruleForm` fields |
| **Prototypical Matching** | Most common pairing of material relation with logical form | Default scheme structure in our DB |
| **Defeasible** | Subject to defeat by counterargument; presumptive, not certain | All our schemes (vs. deductive validity) |
| **Dialectical Instrument** | Tool for adversarial testing through dialogue | CQs with attack types |
| **Cluster** | Family of related schemes sharing semantic features | `clusterTag` field for grouping |
| **Teleological Justification** | Warranted by serving agent's goals better than alternatives | Practical reasoning under uncertainty |

### Section 2 Summary

**What We Learned**:

1. **Schemes have dual structure**: Material relation (content) + Logical form (reasoning type/rule)
2. **Prototypical, not exhaustive**: One material relation generates multiple schemes via different logical forms
3. **Four practical uses**: Analysis, critical thinking education, argument construction, computational mining
4. **Defeasibility is core**: CQs are dialectical testing instruments, not just "questions"
5. **Classification needs dual approach**: Top-down (dichotomic) + Bottom-up (clusters)
6. **Historical revival**: 200-year suppression, reborn in 20th century, essential for AI since 2008

**Implementation Validations**:

✅ **Two-dimensional model** (taxonomy + formal structure) is theoretically correct  
✅ **CQs as attack vectors** aligns with dialectical testing function  
✅ **Cluster organization** addresses "too many schemes" problem for computation  
✅ **Hierarchy with inheritance** supports both top-down and bottom-up navigation  
✅ **Educational potential** addresses identified problem of scheme conflation  

**Design Implications**:

1. SchemeSpecificCQsModal must emphasize **attack construction**, not prose answering
2. Taxonomy fields serve **material dimension**; formal structure serves **logical dimension**
3. Users may need **multiple scheme instantiations** to capture complex reasoning (nets)
4. UI should support **both classification approaches** (dichotomic filtering + cluster browsing)
5. CQs should be presented as **entry points for counterargument**, not just "helpful questions"

**Critical Insight for Phase A**:

The fever example (2.1) demonstrates that **one material relation yields many scheme variants**. This explains why:
- SchemeSpecificCQsModal shouldn't mimic CriticalQuestionsV3
- Argument-level CQs test **logical form** validity (did reasoning follow rule correctly?)
- Claim-level CQs test **material relation** validity (is the causal/definitional connection true?)
- These are DIFFERENT operations requiring DIFFERENT UX patterns

**Next Section to Review**: Section 3 - "The Topics in the Dialectical and Rhetorical Tradition"
- Historical evolution from Aristotle to Middle Ages
- Classification systems: Cicero, Boethius, Abelard
- Generic vs. specific topics distinction
- Foundation for understanding modern taxonomy dimensions

---

## Section 3: The Topics in the Dialectical and Rhetorical Tradition

### Overview
This section traces the historical development of argumentation schemes from Aristotle through the medieval period, showing how ancient classification systems inform modern taxonomy. The evolution reveals consistent patterns: **intrinsic vs. extrinsic**, **generic vs. specific**, **necessary vs. defeasible**, and **dialectical vs. rhetorical**.

### 3.1 Aristotle: The Foundation

#### **Topoi as Conditional Principles**

**Definition**: Topoi (τόποι) = principles having the form "if P, then Q"

**Function**: General principles from which specific premises can be drawn

**Key Mechanism**: The **material relation** between P and Q constitutes the difference between various topoi:
- Genus-species relation
- Definiens-definiendum relation  
- Contraries relation
- Similarity relation

#### **Topoi as Warranting Principles**

**Slomkowski's Explanation**:
> "Enthymemes are arguments which are warranted by the principle expressed in the topos."

**Example - Topos from the More**:

```
Generic Principle: If being more A is more B, then A is B
Specific Instantiation: If doing greater injustice is a greater evil, 
                       then doing injustice is an evil
Minor Premise: Doing greater injustice is a greater evil
Conclusion: Therefore, doing injustice is an evil
```

**Two Functions of Topoi**:

1. **As Rules**: Principle of inference guaranteeing the passage from premise to conclusion
2. **As Major Premises**: General principle from which specific premises of hypothetical syllogisms can be drawn

#### **The Fundamental Distinction: Generic vs. Specific Topics**

**Generic Topoi (Κοινοί τόποι)**:
- **Abstract and commonly shared** conditionals
- General principles under which specific premises can be found
- **Domain-independent**: Work across all fields (ethics, law, medicine, etc.)
- Example: "From the more and the less" (if X is more Y, and Y has property Z, then X has Z)

**Specific Topoi (Ἴδια)**:
- **Domain-specific** premises warranting conclusions
- Accepted within particular disciplines
- **Instruments of invention** for typical conclusions in specialized fields
- Example (Legal): "Where a person does an act, he is presumed to have intended that the natural and legal consequences of his act shall result"

**Abstraction Hierarchy**:
> "Generic topics can be considered as abstractions from the specific ones, or more correctly, an abstraction from a large number of specific topics."

#### **Necessary vs. Defeasible Division**

**Necessary Inferences** (Class 1):
- Maxims setting out **definitional properties** of meta-semantic concepts
- Concepts representing **semantic relations** between concepts
- Examples: definition, genus, property
- **Locus from definition**: Establishes convertibility between definition and definiendum
  - If X is defined as Y, then Y can be predicated of X
  - This is the essential logical characteristic of what it means to BE a definition

**Defeasible Inferences** (Class 2):
- Loci based on **commonly accepted relationships** (not logically necessary)
- Examples: analogy, "from the more and the less"
- Represent stereotypical connections, not logical entailments

**Aristotle's Focus**: Topics governing **meta-semantic relations**:
- Genus
- Property  
- Definition
- Accident

**Historical Impact**: This became the foundation for Latin and medieval dialectical tradition's classification by material relation type.

### 3.2 Cicero: Systematization and Issue-Based Classification

#### **Reduction to 20 Loci**

Cicero streamlined Aristotle's sprawling list into **20 loci/maxims**, organized into **two broad classes**:

**1. Intrinsic Topics**:
- Proceed **directly from subject matter** at issue
- Based on semantic properties of the thing itself
- Example: From definition, from genus, from cause

**2. Extrinsic Topics**:
- Support conclusion through **contextual elements**
- External to the subject matter
- Example: From authority (source of speech act)
- Corresponds to Aristotle's arguments from authority

**3. Intermediate Topics** (Between intrinsic and extrinsic):
- Concern relationship between a predicate and **other predicates in linguistic system**
- Example: Relations with contraries or alternatives

#### **Dialectical vs. Rhetorical Function**

**Dialectical Loci** (nos. 8, 9, 10):
- "From antecedents, consequents, and incompatibles"
- Based on **meaning of logical connectors** (if...then)
- Aimed at **establishing commitments from previous commitments**

**Key Insight**:
> "Instead of increasing the acceptability of a viewpoint based on the acceptability of the content of the premises, such topics lead the interlocutor to the acceptance of a conclusion because of his previous acceptance of other propositions."

**This is commitment-based argumentation**, not content-based!

#### **Stasis Theory: Classification by Issue Type**

Cicero connected topics to **Hermagoras stasis** (the issue/question under dispute):

| Issue Type | Topics Used |
|------------|-------------|
| **Conjecture** (Did X happen?) | Cause, effect, circumstances |
| **Definition** (What is X?) | Definition, description, notation, division, partition, consequent, antecedent, inconsistencies, cause and effect, adiuncta |
| **Qualification** (What kind/quality is X?) | Comparison |

**Significance**: This is **purpose-driven classification** (Section 1's key principle)
- Different issues require different argument types
- Classification serves practical function of finding appropriate arguments

### 3.3 Boethius: The Medieval Synthesis

#### **Maximae Propositiones and Differentiae**

**Boethius's Innovation**: Interpret Aristotelian topoi as **maximae propositiones** falling under **differentiae**

**Terminology**:
- **Maximae propositiones**: General principles/axioms that warrant conclusions
  - "General (indefinite in respect to particulars)"
  - "Generic propositions that several arguments can instantiate"
  - **Primary role**: Warranting the conclusion

- **Differentia**: The relationship between terms, "the respect under which they are regarded"
  - "Criterion of appropriateness"
  - "Genus of maxims"

**Example - Genus-Species Argument**:

```
Argument:
  Every virtue is advantageous
  Justice is a virtue
  Therefore, justice is advantageous

Maxim: What belongs to the genus, belongs to the species

Differentia: "From the whole, i.e. the genus"
```

**Structure**: Differentia (genus of maxims) → Maxim (general principle) → Specific argument instance

#### **Tripartite Classification of Dialectical Loci**

**1. Intrinsic Loci** (Similar to Cicero):

**From Substance**:
- From the definition
- From the description  
- From the explanation of the name

**From the Whole (genus)**:
- From the integral whole
- From a part (species)
- From the parts of an integral whole

**From Things Accompanying Substance** (Aristotle's four causes + more):
- From **efficient cause**
- From the **matter** (material cause)
- From the **end** (final cause)
- From the **form** (formal cause)
- From the generation (effects)
- From the corruption
- From uses
- From associated accidents

**2. Intermediate Loci** (Boethius's addition):
- From inflections (grammatical variations)
- From coordinates (parallel terms)
- From division (taxonomic breakdown)

**3. Extrinsic Loci**:
- From estimation about a thing
- From similar
- From what is more
- From things that are less
- From proportion
- From contraries
- From opposites (privation/possession, relative opposites, affirmation/negation)
- From transumption

#### **Dialectical vs. Rhetorical Loci**

**Boethius's Key Distinction**:

**Dialectical Loci**:
- Stem from **rules of prediction and logic-semantic properties** of predicates
- Based on **semantic properties of concepts**
- Example: "If a person is drunk, he is also intoxicated" (from genus)
- **Necessary or highly probable connections**

**Rhetorical Loci**:
- Proceed from **frequent connections between things**
- Based on **how things usually are** (stereotypes, not semantic necessity)
- Example: "Usually people addicted to alcohol are dissolute; this person is alcoholic; therefore he is dissolute"
- Deal with **circumstances of specific cases**, not abstract principles

**Rhetorical Topics Organization** (Four classes):

**1. Person** (Intrinsic):
- Name, nature, mode of life, fortune, studies, luck, feelings, disposition

**2. Action** (Intrinsic):
- Purpose, deeds, words
- **Gist of the deed** (e.g., "murder of a relative")
- **Temporal phases**: Before, during, after
- **Circumstances**: When (time/opportunity), where (place), how (method), with what aid (means)

**3. Comparing Circumstances**:
- Species, genus, contrary, result
- Greater, lesser, equal

**4. Extrinsic**:
- Who are the doers
- By what name to call what has been done
- Who approve of the action
- Law, custom, agreement, judgment, opinion, theory
- Whether contrary to custom
- Whether generally agreed upon

**Critical Insight**: Rhetorical topics are **case-based**, not **concept-based**. They deal with:
- Specific individuals (Verres, a barbarian, a friend of nobles)
- Particular circumstances (at night, in the bedroom, secretly)
- Concrete actions (stole a sword, struck violently, hid the body)

### 3.4 Abelard: Form vs. Content

#### **Topics as Imperfect Inferences**

**Abelard's Contribution**: First to examine dialectical consequence in its components

**Key Distinction**: Topics ≠ Syllogisms

**Syllogisms** (Perfect inferences):
- Depend on **position of terms** alone (pure form)
- Validity determined by **structure**, not content
- Rule: *posito antecedenti ponitur consequens* (if antecedent affirmed, consequent affirmed)

**Example**:
```
Every man is an animal
But every animal is animate
Therefore, every man is animate
```
→ Valid because of **form alone** (Barbara syllogism)

**Topics** (Imperfect inferences):
- Require **assumptions** (content-based premises) for conclusion to follow
- Cannot be resolved by considering positions alone
- Depend on **habitudo** (topical relation)

#### **Habitudo: The Semantic-Ontological Connection**

**Definition**: "The topical relation, the semantic-ontological respect under which the terms are connected to each other in a (dialectical) syllogism"

**Function**: Determines the **strength of the inference**

**Example - Genus-Species Inference**:
```
Consequence: If he is a man, he is an animate being
Maxim: What the species is said of, the genus is said of as well
Assumption: "Man" is a species of "animate being"
```

The inference is valid because:
1. **Semantic inclusion**: Man is defined as a species of animate being
2. **Genus property**: Whatever is predicated of the species is predicated of the genus
3. **Maxim application**: The general rule applies to this specific case

**Abelard's Full Argument Structure** (Table 8):

```
Consequence: If Socrates is a man, he is an animate being

Maxim: What the species is said of, the genus is said of as well

Assumption: "Man," which is the species of "animate being," is said of Socrates; 
            also therefore "animate being," which is clearly its genus

Assumption 1: "Man" is a species of "animate being"

Syllogism 1:
  • What the species is said of, the genus is said of as well
  • Man is species of "animate being"
  • Therefore, if man is said of anything, "animate being" is said of it as well

Syllogism 2:
  • If "man" is said of anything, "animate being" is said of it as well
  • Socrates is a man
  • Therefore Socrates is an animate being
```

**Structure**: Maxim → Assumption (connecting maxim to subject) → Syllogisms (applying general principle)

#### **Historical Development After Abelard**

**12th Century**:
- All topical inferences reduced to syllogisms
- Formalization of inference forms

**13th Century**:
- Analytical consequences analyzed as topics "dici de omni" and "dici de nullo"
  - "Dici de omni": Said of all (Every A is B, Every B is C, therefore Every A is C)
  - "Dici de nullo": Said of none (No A is B, Every C is A, therefore No C is B)
- **Demonstration itself based on topical relation** (from the whole)

### Connection to Mesh Architecture

#### **1. Intrinsic vs. Extrinsic Maps to Internal vs. External**

Our taxonomy's `source` field:
```typescript
source: "internal" | "external"
```

**Historical Grounding**:
- **Internal**: Cicero/Boethius intrinsic topics (from subject matter)
- **External**: Cicero/Boethius extrinsic topics (from authority/source)

This ancient distinction is preserved in our modern system!

#### **2. Material Relations Map to Boethius's Loci**

Our `materialRelation` field values correspond to Boethius's categories:

| Our System | Boethius's Loci |
|------------|-----------------|
| `cause` | From efficient cause, from the end, from generation (effects) |
| `definition` | From the definition, from the description |
| `analogy` | From similar, from proportion |
| `authority` | Extrinsic loci (estimation about a thing) |
| `practical` | Rhetorical loci (action, purpose, means-end) |
| `correlation` | From associated accidents, from adiuncta |

**This is not arbitrary**—we're implementing a 2000-year-old classification system!

#### **3. Generic vs. Specific Topics = Parent-Child Hierarchy**

**Aristotle's Distinction**:
- Generic topoi: Abstract principles → **Parent schemes**
- Specific topoi: Domain-specific instances → **Child schemes**

**Our Implementation**:
```typescript
parentSchemeId: string | null
inheritCQs: boolean
```

**The abstraction mechanism** Aristotle described (generic → specific) is exactly what our hierarchy captures:
- Parent scheme = generic topic (abstract principle)
- Child scheme = specific topic (domain instantiation)
- Inherit CQs = inherit defeasibility conditions from generic level

#### **4. Necessary vs. Defeasible = Rule Form**

**Aristotle/Boethius Distinction**:
- Necessary: Definition, genus-species (logically entailed)
- Defeasible: Analogy, "from the more" (presumptively warranted)

**Our Implementation**:
```typescript
ruleForm: "MP" | "MT" | "defeasible_MP" | "universal"
```

- `universal`: Necessary inferences (definition-based)
- `defeasible_MP`: Defeasible inferences (most schemes)

#### **5. Stasis Theory = Purpose Field**

**Cicero's Issue-Based Classification**:
- Conjecture → Action/state of affairs distinction
- Definition → Classificatory schemes
- Qualification → Evaluative schemes

**Our Implementation**:
```typescript
purpose: "action" | "state_of_affairs"
conclusionType: "ought" | "is"
```

**This maps directly** to whether we're:
- Deciding what to do (`action`, `ought`)
- Determining what is true (`state_of_affairs`, `is`)

#### **6. Habitudo = Formal Structure with Variables**

**Abelard's Habitudo** (semantic-ontological connection):
- The **specific connection** between terms
- Requires **assumptions** to make inference valid

**Our Implementation**:
```typescript
premises: Array<{
  id: "P1" | "P2" | ...,
  type: "major" | "minor",
  text: string,
  variables: string[] // ["E", "S", "A"]
}>
conclusion: {
  text: string,
  variables: string[] // ["A"]
}
```

**The variables track the habitudo**—the semantic connection between terms across premises!

Example:
```
P1: If E (expert) says S (statement) about A (domain), S is presumed true
P2: E is an expert in A
P3: E says S about A
Conclusion: S is presumed true

Variables track: Expert → Statement → Domain connection
```

#### **7. Dialectical vs. Rhetorical = Reasoning Type**

**Boethius's Distinction**:
- Dialectical: Logic-semantic properties (necessary/probable)
- Rhetorical: Circumstantial (case-based, stereotypical)

**Our Implementation**:
```typescript
reasoningType: "deductive" | "inductive" | "abductive" | "practical"
```

**Mapping**:
- `deductive`: Dialectical loci (necessary)
- `inductive`: Rhetorical loci (from frequent cases)
- `abductive`: Sign-based reasoning (symptomatic)
- `practical`: Means-end reasoning (action-oriented)

### Critical Insights for Implementation

#### **Design Principle 1: Ancient Categories Are Not Arbitrary**

**Revelation**: Every field in our Walton taxonomy has **historical precedent**:
- Intrinsic/extrinsic (Cicero, 1st century BCE)
- Generic/specific (Aristotle, 4th century BCE)
- Necessary/defeasible (Boethius, 6th century CE)
- Dialectical/rhetorical (Boethius, 6th century CE)

**Implication**: These distinctions have **stood the test of 2000+ years**. They're not modern inventions—they're the distilled wisdom of centuries of argumentation theory.

**For Mesh**: Our system participates in this ancient tradition. When users interact with taxonomy fields, they're engaging with categories refined over millennia.

#### **Design Principle 2: Hierarchy Enables Generic → Specific**

**Aristotle's Abstraction Mechanism**:
> "Generic topics can be considered as abstractions from the specific ones"

**This justifies**:
1. **Parent-child relationships**: Generic (parent) → Specific (child)
2. **CQ inheritance**: Defeasibility conditions flow from abstract to specific
3. **Cluster tags**: Group schemes by family resemblance (same generic ancestor)

**Example in our system**:
```
Parent: "Argument from Authority" (generic)
  ↓ (inherits CQs about source credibility)
Children: 
  - "Argument from Expert Opinion" (specific to expertise domain)
  - "Argument from Position to Know" (specific to situational knowledge)
  - "Argument from Witness Testimony" (specific to observed events)
```

#### **Design Principle 3: Maxims Are Warrants**

**Boethius's Maximae Propositiones** = **Toulmin's Warrants** (1958)

The structure:
```
Data (specific premises)
  ↓ [via Warrant/Maxim]
Claim (conclusion)
```

**For Mesh**: When we map attack types to Toulmin structure:
- UNDERMINES → attacks Data (premises)
- UNDERCUTS → attacks Warrant (maxim/general principle)
- REBUTS → attacks Claim (conclusion)

**We're implementing Boethius's architecture** with modern terminology!

#### **Design Principle 4: Form-Content Distinction Is Fundamental**

**Abelard's Insight**: Syllogisms depend on **form** alone; topics depend on **content** (habitudo)

**This explains** why schemes have:
1. **Formal structure**: Premise/conclusion with logical rules (form)
2. **Material relation**: Semantic connection between concepts (content)

**Our two-dimensional model** (Section 2) is **validated by Abelard** (12th century)!

**Implication for CQs**: Some CQs test **form** ("Does the inference rule apply?"), others test **content** ("Is the semantic connection true?"). Different testing mechanisms for different dimensions.

#### **Design Principle 5: Circumstances vs. Concepts**

**Boethius's Rhetorical Topics**: Case-based reasoning about:
- Specific persons (Verres, a barbarian)
- Particular circumstances (at night, in bedroom)
- Concrete actions (stole sword, struck violently)

**Dialectical Topics**: Concept-based reasoning about:
- Abstract relations (genus-species, definition)
- Logical properties (convertibility, predication)

**Implication**: Some schemes are **case-based** (practical reasoning, sign arguments), others are **concept-based** (definitional, classificatory). Different types of instantiation required.

### Questions Raised by Section 3

1. **Differentia Hierarchy**: Boethius uses "genus of maxims"
   - Is this the same as our scheme clusters?
   - Does differentia = materialRelation?
   - Seems differentia is **broader** (includes differentia + maxim → specific arguments)

2. **Commitment-Based Arguments**: Cicero's dialectical loci "establish commitments from commitments"
   - Do we have schemes for this? (Argument from commitment exists in Walton 2008)
   - How does this relate to our dialogue moves?
   - Commitment tracking in conversations

3. **Intermediate Loci**: Boethius's "loci medii" (inflections, coordinates, division)
   - Linguistic/grammatical arguments
   - Do we need these in modern system?
   - Seem less important for computational use

4. **Rhetorical vs. Dialectical**: How sharp is this boundary?
   - Some schemes (sign, testimony) seem to blur the line
   - Do we need to mark this distinction explicitly?
   - Or is `reasoningType` + `source` sufficient?

### Terminology Established

| Term | Definition | Mesh Equivalent |
|------|------------|-----------------|
| **Topos** (τόπος) | Generic principle ("if P, then Q") from which arguments drawn | Parent scheme |
| **Idion** (ἴδιον) | Domain-specific premise warranting conclusion | Child scheme (specialized) |
| **Maxima propositio** | General axiom/principle that warrants conclusion | Warrant in Toulmin structure |
| **Differentia** | "Genus of maxims"; criterion of appropriateness | Material relation type + reasoning type |
| **Habitudo** | Semantic-ontological connection between terms | Variables tracking relations in formal structure |
| **Intrinsic** | From subject matter itself | `source: "internal"` |
| **Extrinsic** | From external context (authority) | `source: "external"` |
| **Stasis** | Issue/question type under dispute | `purpose` field (action vs. state_of_affairs) |

### Section 3 Summary

**What We Learned**:

1. **Ancient Taxonomy Is Systematic**: Aristotle → Cicero → Boethius created coherent, multi-dimensional classification
2. **Four Core Distinctions** persist across centuries:
   - Generic vs. Specific (abstraction level)
   - Intrinsic vs. Extrinsic (source of warrant)
   - Necessary vs. Defeasible (strength of inference)
   - Dialectical vs. Rhetorical (concept vs. case-based)
3. **Maxims = Warrants**: Boethius's structure anticipates Toulmin by 1400 years
4. **Form-Content Split**: Abelard shows topics require **both** logical form and semantic content
5. **Purpose-Driven**: Cicero's stasis theory connects issue types to appropriate schemes

**Implementation Validations**:

✅ **Taxonomy fields map to ancient categories** (not arbitrary modern inventions)  
✅ **Hierarchy structure** implements Aristotle's generic → specific abstraction  
✅ **Attack types to Toulmin** = Boethius's maxim-based argument structure  
✅ **Variables in formal structure** track Abelard's habitudo (semantic connections)  
✅ **Purpose field** implements Cicero's stasis-based classification  

**Design Implications**:

1. **Our six-dimensional taxonomy** is historically grounded, not ad hoc
2. **Parent-child + inheritance** directly implements 2400-year-old abstraction mechanism
3. **Form + content** (logical + material) architecture validated by Abelard's analysis
4. **Attack types** map to three-part structure (data/warrant/claim) used since Boethius
5. **Educational value**: Teaching users these ancient distinctions improves argumentation literacy

**Critical Revelation for Phase A**:

The historical analysis shows that **dialectical argumentation** (what our system does) is fundamentally about:
1. **Testing semantic connections** (habitudo) between concepts
2. **Challenging warrants** (maxims/general principles)
3. **Adversarial examination** via critical questions

**SchemeSpecificCQsModal should emphasize**:
- Testing the **warrant** (UNDERCUTS)
- Challenging **premises** (UNDERMINES)  
- Rebutting **conclusion** (REBUTS)

These are **ancient dialectical moves**, not modern UX inventions. The interface should make this classical structure explicit.

**Next Section to Review**: Section 4 - "Modern Theories of Schemes"
- Perelman & New Rhetoric
- Toulmin's warrant-based classification
- Kienpointner's four-criteria system
- Pragma-Dialectics (Van Eemeren)
- Grennan's warrant types
- See how modern theorists adapted/modified ancient frameworks

---

