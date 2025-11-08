# Argumentation Schemes: History, Classifications, and Computational Applications
## Detailed Review Document - Part 6

**Document**: Macagno, Walton & Reed (2017)  
**Review Focus**: Sections 9-11 (Argument Mining, Formal Ontologies, Conclusions)  
**Part**: 6 of series (Final sections)

---

## Section 9: Using Schemes for Argument Mining

### Overview

Section 9 explores **argument mining** - the automatic extraction of argument structure from natural language text. This is **critically relevant for Mesh** because it addresses how to help users identify schemes and structure arguments from raw text (e.g., social media posts, documents, deliberation contributions).

**Central Challenge**:
> "Argument mining focuses on the development of algorithms and techniques for the automatic extraction of argument structure from natural language text... it represents a substantially more demanding task."

**Two Major Difficulties**:

1. **Data Availability**: Need large datasets of analyzed argumentation (very time-consuming to create)
2. **Limits of Statistical Approaches**: Argumentation has thousands of combinatorial patterns (vs. tens/hundreds for syntax)

**Key Insight**: Pure statistical methods insufficient - need to combine with **structural guidance from schemes**. Schemes act as **priors** for machine learning, constraining what's likely to be seen.

**Critical Systems/Approaches**:
- **AraucariaDB** (2005): First public corpus of analyzed arguments
- **Internet Argument Corpus (IAC)**: 390,000 examples (but thin conception of argument)
- **Potsdam Microtext Corpus** (2016): Structured arguments in English/German
- **Argument Web infrastructure**: AIFdb, OVA tool, corpus management
- **Feng & Hirst** (2011): Scheme classification with 0.64-0.98 accuracy
- **Lawrence & Reed** (2015): Using schemes to aid structure identification (0.59-0.91 F1)

---

### 9.1 The Data Problem: Need for Large Annotated Corpora

**Statistical ML Requires Big Data**:
> "The most robust syntactic parsers... are based not on theoretical linguistic analysis — which proved on the whole to be too limited and too brittle — but on statistical models based on corpora typically comprising millions of examples."

**Syntax Parsing Success**: Millions of examples → robust statistical models

**Argumentation Challenge**: 
- Need large datasets of **analyzed** argumentation
- Analysis is "both demanding and extremely time consuming"
- Teaching critical thinking: analysts know this pain

**Historical Problem**: Few datasets existed, and they were:
- In idiosyncratic representation languages
- Little re-use between teams/projects
- Effort regularly lost

**Two Solutions Emerged**:

**9.1.1 Community Corpora**

**Internet Argument Corpus (IAC)** (Walker et al. 2012):
- **Size**: 390,000 examples
- **Source**: Online debates, discussions
- **Problem**: "Designed primarily from a text-processing viewpoint, with little argumentation theory sitting behind it"
- **Thin conception**: Quote-response pairs with polarity (sarcasm/nastiness marked)
- **Impact**: "More or less unrecognisable to researchers from argumentation theory"

**Lesson**: Large size ≠ useful if theoretical foundation weak.

**Potsdam Microtext Corpus** (Peldszus & Stede 2016):
- **Size**: 130 examples (much smaller)
- **Quality**: Structured according to Freeman (1991) theory
- **Features**: Linked/convergent arguments, undercutting/rebutting attacks
- **Unique**: Parallel corpus (English + German translations)
- **Constraint**: Every argument exactly 5 components (for "laboratory" testing)
- **Limitation**: May not generalize to "unrestricted arguments in the wild"

**Lesson**: Theoretical rigor > raw size, but constrained formats limit generalizability.

**9.1.2 Infrastructure for Sharing**

**Argument Web Vision** (Rahwan et al. 2011, Bex et al. 2013):
> "A vision for an interconnected web of arguments and debates, regardless of the software used to create them, analyse them or extract them."

**Key Principle**: Open access, machine-processable formats, reusable across tools.

**Applications Envisioned**:
- Academic analysis of political broadcast
- Automated analysis of social media responses
- Automated dialogue games for user interaction
- Automated summary to policy departments
- Corpus delivery to argument mining researchers

**Cornerstone**: Argumentation schemes (Walton et al. 2008 style) as "rich ontology of reasoning forms."

**Mesh Connection**: Our argument data should be:
- **Exportable** in standard formats (AIF, JSON-LD)
- **Importable** from other systems
- **Shareable** for research/education
- **Processable** by automated tools

Consider:
```typescript
// Export service
class ArgumentExportService {
  async exportToAIF(deliberationId: string): Promise<AIFGraph>
  async exportToJSONLD(deliberationId: string): Promise<any>
  async exportToGraphML(deliberationId: string): Promise<string>
}

// Import service
class ArgumentImportService {
  async importFromAIF(aifData: AIFGraph): Promise<Deliberation>
  async importFromOVA(ovaData: any): Promise<Deliberation>
}
```

---

### 9.2 Available Tools and Infrastructure

**9.2.1 Araucaria and AraucariaDB**

**Araucaria** (Reed & Walton 2005):
- First tool for analyzing arguments with schemes
- Handles large analyses (Wigmore diagrams for legal cases)
- Interchanges between Wigmore, Toulmin, Freeman styles
- Now "very old and virtually obsolete"

**AraucariaDB**:
- First publicly available corpus of argumentation
- Built using Araucaria
- Still available on Argument Web infrastructure

**9.2.2 OVA and OVA+**

**OVA** (Online Visualization of Argument) (Janier et al. 2014):
> "Superseded [Araucaria] in its core functionality."

**Features**:
- Simple-to-use interface
- Analyzes monologue and dialogue (OVA+)
- **Enthymeme reconstruction** (finding implicit premises)
- **Argumentation scheme analysis**
- **Critical question processing**
- Serial, linked, convergent, divergent structures
- Undercutting, rebutting, undermining attacks

**OVA+ Additional Features**:
- Locution analysis
- Dialogue game rule analysis
- Illocutionary force identification
- Ethos and personal attacks (Duthie et al. 2016)
- Full Inference Anchoring Theory analysis

**Storage**: Analyses stored in **AIFdb** (database infrastructure)

**Mesh Opportunity**: Integration with OVA/AIFdb
- Users analyze text in OVA → import to Mesh
- Mesh arguments → export to OVA for visualization
- Shared scheme ontologies

**9.2.3 AIFdb: Argument Database Infrastructure**

**AIFdb** (Lawrence et al. 2012):
> "A database infrastructure fabric for storing and accessing argument data."

**Key Capabilities**:
- Stores analyses in standard AIF format
- **Transportable** to other formats:
  - Carneades (Walton & Gordon 2012)
  - Rationale (van Gelder 2007)
  - ASPIC+ (Modgil & Prakken 2013)
  - Abstract frameworks (Dung 1995) via formal equivalences

**Corpus Management** (Lawrence & Reed 2015):
- Online tools at corpora.aifdb.org
- Define corpora of analyzed + raw text
- Argumentative + non-argumentative source material
- Raw data + metadata
- Aggregable (manage dependencies between teams/projects/objectives)

**Available Corpora**:
- **AraucariaDB**: Original corpus
- **Argument Schemes in the Moral Maze**: 35 instances from BBC radio
- **ExpertOpinion-PositiveConsequences**: 71 examples of these two schemes

**Mesh Connection**: 
- AIFdb is **largest publicly available dataset** of analyzed argumentation
- We could:
  - Contribute Mesh analyses to AIFdb (open science)
  - Import AIFdb corpora for training/testing
  - Use shared scheme ontology

---

### 9.3 The Statistical Limits Problem

**Why Pure Statistics Struggle**:
> "The more sophisticated conceptions of argument developed in argumentation theory remain extraordinarily demanding... With so many patterns of argumentation, so many structures, so many ways in which components can be left implicit, so many types of reasoning, the amount of data required to train statistical models becomes not just unwieldy but unreasonable and, quite probably, unattainable."

**Complexity Comparison**:

**Syntax** (Statistical Success):
- Theoretical linguistics: Tens of rules for combining parts of speech
- Statistical models: Hundreds of patterns
- **Result**: Statistical methods dominate

**Argumentation** (Statistical Challenge):
- Combination across schemes: **Thousands or more** patterns
- Implicit components multiply possibilities
- Context-dependent reasoning types
- **Result**: Pure statistics insufficient

**Key Insight**:
> "Whilst we might expect statistically oriented techniques to deliver us good results on simple and strongly generalizable aspects of argument recognition, for the type of analysis that is typically taught to students of critical thinking classes, more is required."

**The Solution**:
> "It is looking increasingly likely that having strong, well defined conceptions of argument, dialogue and argument schemes provide exactly the sort of additional information required to guide machine learning processes by acting, in essence, as priors to that process: defining expectations about what is likely to be seen."

**Hybrid Approach**: Statistical + Structural

- **Statistical ML**: Learn patterns from data
- **Scheme knowledge**: Constrain possibilities, provide priors
- **Combination**: "Looking very promising"

**Mesh Implication**: When helping users identify schemes in text:
1. Can't rely on pure ML (insufficient training data)
2. Need scheme knowledge to guide (this is what we have!)
3. Combine: ML for candidate identification + scheme templates for validation

---

### 9.4 Feng & Hirst (2011): Scheme Classification

**Goal**: Classify arguments into scheme types.

**Corpus**: AraucariaDB (only dataset with annotated schemes at the time)

**Schemes**: 65 from Walton et al. (2008)

**Focus**: Five most common schemes (61% of database):
1. **Argument from Example**
2. **Argument from Cause to Effect**
3. **Practical Reasoning**
4. **Argument from Consequences**
5. **Argument from Verbal Classification**

**Features Used**:

**Textual Indicators**: Keywords and phrases
- Example for **Practical Reasoning** (28 keywords/phrases):
  - "want", "aim", "objective"
  - Modal verbs: "should", "must", "need"

**Other Features**:
- Pairs of successive words
- Sequences of three words
- Adverbs, verbs, modal auxiliaries

**Results**: "Extremely promising"
- **Classification accuracy**: 0.64 to 0.98
- Shows schemes have distinctive linguistic markers

**Mesh Application**: Scheme suggestion based on text features
```typescript
class SchemeSuggestionService {
  async suggestSchemes(text: string): Promise<SchemeMatch[]> {
    // Analyze text for scheme indicators
    // - Modal verbs (practical reasoning)
    // - Causal connectives (cause to effect)
    // - Expert markers (expert opinion)
    // - Consequence indicators (consequences)
    // Return ranked suggestions
  }
}

interface SchemeMatch {
  schemeId: string
  confidence: number
  indicators: string[] // Which keywords triggered
  explanation: string // Why this scheme
}
```

**UI Flow**:
```
User pastes text: "We should implement feature X. Studies show it increases engagement."
System analyzes:
  - "should" → practical reasoning indicator
  - "Studies show" → expert opinion indicator
System suggests:
  1. Practical Reasoning (85% confidence)
  2. Argument from Expert Opinion (75% confidence)
User selects scheme → system structures argument accordingly
```

---

### 9.5 Lawrence & Reed (2015): Schemes Aid Structure Recognition

**Innovation**: Use schemes not just as **classification target** but to **aid identification** of argumentative structure.

**Key Insight**:
> "Argumentation schemes do not connect propositions that are all alike, but rather are associated with particular types of propositions."

**Proposition Type Patterns**:

**Argument from Positive Consequence**:
- Conclusion: Typically **normative statement** in **subjunctive mood**
- Example: "We should do X" (subjunctive, normative)

**Argument from Expert Opinion**:
- Premise: **Reported speech** (direct or indirect)
- Lexical markers: "said", "stated", "according to"

**Argument from Analogy**:
- Premise: Attributes property to individual
- Pattern: "X is like Y in respect R"

**The Strategy**: If can identify proposition types → constrain possible structures

**Example Process**:
1. **Spot lexeme** "said" → likely reported speech
2. **Reported speech** → increases chance of expert opinion argument
3. **Find** "expert" nearby → more confident it's expert opinion
4. **Look for conclusion** → likely sentence with semantic similarity to clause after "said"

**Results**:
- **Scheme component detection**: F1 0.59 to 0.91
- **Scheme instance identification**: F1 0.62 to 0.88

**Dependency**: Requires **ontology engineering** - explicit computational models capturing scheme structure and relationships.

**Mesh Application**: Multi-stage argument structuring

```typescript
class ArgumentStructureService {
  // Stage 1: Identify proposition types
  async identifyPropositionTypes(text: string): Promise<PropositionType[]> {
    // Look for:
    // - Reported speech markers
    // - Modal verbs
    // - Causal connectives
    // - Normative language
    // - Analogical patterns
  }
  
  // Stage 2: Constrain possible schemes
  async constrainSchemes(types: PropositionType[]): Promise<string[]> {
    // Expert + reported speech → expert opinion
    // Modal + consequence → practical reasoning
    // Similarity + property → analogy
  }
  
  // Stage 3: Identify structure
  async extractStructure(
    text: string, 
    scheme: string
  ): Promise<ArgumentStructure> {
    // Given scheme, extract premises and conclusion
    // Match text segments to scheme template
  }
}
```

**UI Workflow**:
```
User: [Pastes complex text]
System Stage 1: Highlights proposition types
  - "Expert Jane Smith said" [reported speech]
  - "pollution is increasing" [semantic match to clause]
  - "we should act now" [normative, modal]

System Stage 2: "This looks like expert opinion supporting practical reasoning"

System Stage 3: Structures as:
  Net of schemes:
    - Expert Opinion: "Jane Smith (expert) says pollution increasing"
    - Practical Reasoning: "Pollution increasing (bad) → we should act"
```

---

### 9.6 Connection to Mesh Architecture

**9.6.1 Text Analysis Features**

Currently Mesh doesn't analyze text for scheme indicators. Could add:

```typescript
model ArgumentScheme {
  // Existing fields...
  
  // Mining features
  textIndicators?: string[] // Keywords like "should", "must"
  propositionPatterns?: Json // Regex or patterns for premise types
  linguisticFeatures?: Json // Modal verbs, connectives, etc.
}
```

**Service**:
```typescript
class TextAnalysisService {
  async analyzeForSchemes(text: string): Promise<SchemeAnalysis> {
    return {
      indicators: this.extractIndicators(text),
      propositionTypes: this.identifyTypes(text),
      suggestedSchemes: this.matchSchemes(text),
      structureCandidates: this.extractStructure(text)
    }
  }
}
```

**9.6.2 Scheme Suggestion UI**

Rather than users manually selecting schemes, system suggests:

```typescript
// In argument creation flow
<ArgumentCreationWizard>
  <Step1_TextInput 
    onTextEnter={(text) => suggestSchemes(text)}
  />
  <Step2_SchemeSuggestion
    suggestions={suggestions}
    onSelect={(scheme) => structureArgument(text, scheme)}
  />
  <Step3_RefineStructure
    premises={extractedPremises}
    conclusion={extractedConclusion}
    onEdit={(structure) => save(structure)}
  />
</ArgumentCreationWizard>
```

**9.6.3 Corpus Contribution**

Mesh could contribute to open science:

```typescript
class CorpusContributionService {
  async exportToAIFdb(deliberationId: string) {
    // Export analyzed arguments to AIFdb
    // Contributes to public corpus
    // Helps research community
  }
  
  async importFromAIFdb(corpusId: string) {
    // Import example arguments
    // For training, education, testing
  }
}
```

**Benefits**:
- **For users**: Learn from examples in corpus
- **For research**: Contribute to open data
- **For Mesh**: Validate against established corpora

**9.6.4 Hybrid ML Approach**

For future ML features, combine statistical + structural:

```typescript
class HybridSchemeRecognizer {
  private mlModel: TensorFlowModel // Statistical component
  private schemeOntology: SchemeGraph // Structural component
  
  async recognize(text: string): Promise<SchemeMatch[]> {
    // 1. ML: Extract features, predict probabilities
    const mlPredictions = await this.mlModel.predict(text)
    
    // 2. Ontology: Constrain based on proposition types
    const constraints = this.schemeOntology.constrain(
      this.identifyPropositionTypes(text)
    )
    
    // 3. Combine: ML predictions × ontology constraints
    return this.combineEvidence(mlPredictions, constraints)
  }
}
```

**Key Principle**: Don't rely on pure ML (insufficient data), use schemes as priors.

---

### 9.7 Critical Insights for Implementation

**9.7.1 Pure Statistical ML Insufficient for Argumentation**

Unlike syntax (tens/hundreds of rules), argumentation has **thousands of combinatorial patterns**. Need structural guidance from schemes.

**Implication**: Don't wait for massive training corpus - use scheme knowledge we already have.

**9.7.2 Linguistic Markers Exist**

Feng & Hirst show schemes have distinctive textual indicators:
- Practical reasoning: "should", "must", "want", "aim"
- Expert opinion: "said", "expert", "according to"
- Consequences: "if...then", "will result in", "leads to"

**Implication**: Can build rule-based suggester using indicators.

**9.7.3 Proposition Types Constrain Structure**

Lawrence & Reed show proposition type identification enables scheme constraint:
- Reported speech → likely expert opinion
- Normative statement → likely practical reasoning/consequences
- Similarity claim → likely analogy

**Implication**: Multi-stage pipeline more effective than end-to-end ML.

**9.7.4 Corpus Availability Matters**

AraucariaDB was critical for Feng & Hirst research. AIFdb infrastructure enables sharing.

**Implication**: Make Mesh data exportable/importable for research and education.

**9.7.5 Scheme Ontology Enables Mining**

Lawrence & Reed: "Operationalising argumentation scheme structure... depends... upon 'ontology engineering'."

**Implication**: Well-defined scheme ontology (which we have!) is prerequisite for automated mining.

---

## Section 10: Schemes in Formal Ontologies

### Overview

Section 10 describes the **Argument Interchange Format (AIF)** and how argumentation schemes are formalized in description logic ontologies. This is relevant for **Mesh interoperability** and understanding how schemes relate to formal semantic web technologies.

**Key System**: AIF ontology at http://arg.tech/aif.owl

---

### 10.1 AIF: Argument Interchange Format

**What Is AIF?**:
> "Not just a representation language for argument structure; it also has a formal definition rooted in description logic; that is to say, it provides a core ontology for describing argument."

**Initial Specification**: Chesñevar et al. (2006)

**Extended Specification**: Rahwan et al. (2007) - description logic

**Core Ontology**: Compact, admits extension via "adjunct ontologies":
- Dialogical interaction
- User-oriented features
- Social features

**Extension to Schemes**: Defines not just that propositions are linked by inference rules, but **types of inference rules** (i.e., argumentation schemes).

**Ontology Captures**:
1. **Structure** of schemes
2. **Description** of schemes
3. **Critical questions** of schemes
4. **Relationships** between schemes (generalization-specialization)
5. **Relationships** between components

---

### 10.2 Example: Expert Opinion Scheme in AIF

**Figure 11 in Paper**: Shows OWL/description logic representation

**Three Stanzas**:

**Stanza 1: Basic Premises**
- **Knowledge assertion**: Expert said something (that expert asserted P)
- **Field expertise**: Speaker is indeed expert in relevant field
- Sets up conclusion

**Stanza 2: Additional Premises**
- **Presumptions and exceptions**:
  - Credibility
  - Backup evidence available
  - Consistency between experts
  - Expert reliability

**Stanza 3: Critical Question**
- Shows how "consistency between experts" drives stereotypical attack
- CQ: "Are experts consistent with each other?"
- Operationalizing CQs (Reed & Walton 2005)

**Goal**: "Give a flavour of how all the important components of argumentation schemes — structure, description and critical questions — can be captured in a formal ontology."

**Full Ontology**: Available at http://arg.tech/aif.owl
- Used by many Argument Web online services
- Machine-processable
- Enables automated reasoning

---

### 10.3 Benefits of Ontological Representation

**10.3.1 Economy in Specification**

> "Economy in specification, that allows more specific schemes to be defined in terms of minor additions to more general ones."

**Inheritance**: Specific schemes extend general schemes
- Define base scheme once
- Specific schemes add constraints/features
- Reduces duplication

**Mesh Parallel**: Our parent-child hierarchy serves similar function
```typescript
model ArgumentScheme {
  parentId?: string // Inherits from parent
  // Child adds specificity
}
```

**10.3.2 Automated Reasoning: Three Types**

**Type 1: Transitivity of Inferences**

> "It becomes possible to reason across argument structures, identifying, for example, transitivity of inferences, so that if X is used to infer Y, and Y to infer Z, the dependence of X on Z can be inferred automatically."

**Application**: Argument chains
- A supports B
- B supports C
- Therefore A indirectly supports C

**Mesh Implementation**:
```typescript
function computeIndirectSupport(claimId: string): Argument[] {
  // Find all arguments supporting this claim
  const direct = getDirectSupport(claimId)
  
  // Recursively find what supports those arguments' premises
  const indirect = direct.flatMap(arg => 
    arg.premises.flatMap(premise => 
      computeIndirectSupport(premise.claimId)
    )
  )
  
  return [...direct, ...indirect]
}
```

**Type 2: Automatic Classification**

> "Perform automatic classification. This is where formal ontologies, and the reasoning systems constructed on top of them, excel."

**Example**: Fear appeal arguments naturally classifiable as subset of negative consequence arguments.

**Inference**: Reasoner deduces subclass relationships from definitions.

**Mesh Application**: 
```typescript
// Ontology defines:
// FearAppeal subClassOf NegativeConsequence
// NegativeConsequence subClassOf ArgumentFromConsequences

// Reasoner infers:
// FearAppeal is also ArgumentFromConsequences

// User searches "consequence arguments"
// System returns fear appeals (via inference)
```

**Type 3: Inferring Appropriate CQs**

> "By virtue of hierarchical relationships between schemes that are represented in, or inferable from, the ontology, it also becomes possible to infer appropriate critical questions that might be asked of a given argument."

**Principle**: "All of the critical questions of a superclass can be asked of an instance of a sub-class."

**Example**:
- Expert Opinion is subclass of Argument from Authority
- Authority has CQs about source credibility
- Expert Opinion inherits those CQs
- Plus adds domain-specific CQs about expertise

**Mesh Enhancement**:
```typescript
function getCriticalQuestions(schemeId: string): CriticalQuestion[] {
  const scheme = getScheme(schemeId)
  
  // Own CQs
  const own = scheme.criticalQuestions
  
  // Inherited CQs from parents
  const inherited = scheme.parentId 
    ? getCriticalQuestions(scheme.parentId)
    : []
  
  return [...inherited, ...own]
}
```

Currently we don't implement CQ inheritance. Ontological approach shows why we should.

---

### 10.4 Connection to Mesh Architecture

**10.4.1 Semantic Web Compatibility**

AIF uses OWL/description logic. Mesh could:
- Export schemes to OWL for semantic web integration
- Import AIF schemes into Mesh
- Participate in Argument Web ecosystem

**10.4.2 Automated Reasoning**

Three reasoning types (transitivity, classification, CQ inference) could enhance Mesh:

```typescript
class OntologicalReasoningService {
  computeTransitiveSupport(claimId: string): Argument[]
  classifyScheme(schemeId: string): string[] // All superclasses
  inferCriticalQuestions(schemeId: string): CriticalQuestion[]
}
```

**10.4.3 Hierarchy as Ontology**

Our parent-child scheme hierarchy is essentially ontological:
- Parent = superclass
- Child = subclass
- Inheritance of properties

Formalizing this enables automated reasoning.

---

### 10.5 Critical Insights for Implementation

**10.5.1 CQ Inheritance Should Be Automatic**

Children inherit parent CQs + add own. Currently we don't implement this.

**Enhancement**: Compute CQs dynamically by traversing hierarchy.

**10.5.2 Classification Can Be Inferred**

Don't need to manually tag all scheme relationships - reasoner can infer.

**10.5.3 Formal Ontology Enables Interoperability**

OWL/AIF format allows integration with other tools (OVA, Carneades, etc.).

**10.5.4 Description Logic Validates Consistency**

Ontology reasoners can check for contradictions in scheme definitions.

---

## Section 11: Conclusions

### Overview

Section 11 synthesizes the paper's contributions and points toward future research directions. It emphasizes **dual functions** of schemes (analysis + construction) and identifies **key challenges** for advancing the field.

---

### 11.1 Core Findings Synthesis

**What Schemes Are**:
> "Argumentation schemes represent the abstract structures of the most common and stereotypical arguments used in everyday conversation and specific fields, such as law, science and politics."

**Formal Structure**:
- Set of premises (abstract form with variables/constants)
- Conclusion
- Provides form for structuring inferential relation

**Levels of Abstraction**:
- **Most abstract**: classification, cause, authority
- **More specific**: negative consequences, expert opinion, ad populum

**Key Function**: "Allows the analyst to detect the structure of natural arguments, and recognize patterns occurring in everyday reasoning."

---

### 11.2 Dual Functions: Analysis and Construction

**11.2.1 Argument Evaluation (Analysis)**

**Historical Context**:
> "Throughout the history of logic and rhetoric there has always been some uncertainty about the role of the topics."

**Two Interpretations**:

1. **Forms of Logical Inference**
   - Show arguments are "valid" (broad sense)
   - Include deductively valid + defeasible arguments
   - Identifiable structure fitting topic

2. **Search Function**
   - Find arguments to prove designated conclusion
   - Select arguments with premises accepted by audience
   - Audience-aware argument selection

**11.2.2 Argument Construction (Invention)**

**Warranting Function**:
> "An argumentation scheme is taken to have a warranting function that enables an inference to be drawn from a set of premises to a conclusion."

**Practical Application**: "Indicates their usefulness not only for argument evaluation, but also for argument construction, also called argument invention in the long history of the subject tracing back to the Sophists and Aristotle."

**Argument Invention Device**:
> "Would enable an arguer to search for an argument that could be used to support a claim s/he wants to prove."

**Process**:
1. User decides **type of argument** most applicable to purpose
2. User develops **specific line of reasoning**
3. From **premises/evidential facts** they have
4. To **conclusion** they need to prove

**Characterization**: "Schemes are dialectical instruments for use in the task of argument construction."

**Mesh Application**: This validates two modes for SchemeSpecificCQsModal:
- **Analysis mode** (current): Given argument → identify scheme → apply CQs
- **Construction mode** (needed): Given goal → select scheme → construct argument

---

### 11.3 IBM Watson Debater: Leap Forward

**IBM Watson Debater** (Aharoni et al. 2014):
> "A leap forward for argument invention because it enables a user to quickly search through a database such as Wikipedia and find useful pro and con arguments supporting or attacking a designated claim."

**Capability**: Search large corpus → find relevant pro/con arguments

**Limitation**: "Does not (so far) use argumentation schemes"

**Implication**: Huge potential if schemes were integrated with search/retrieval.

---

### 11.4 Carneades Find Arguments Assistant

**CAS Feature**: "Find arguments assistant"

**Input**:
- Database of propositions (audience commitments)
- Goal proposition (ultimate claim/probandum - from stasis theory)

**Process**:
1. Searches through audience commitments
2. Uses **repository of argumentation schemes** in knowledge base
3. Collects arguments moving from premises to ultimate claim

**Output**:
- Chain of argumentation to goal (if exists)
- Or partial suggestions for way forward

**Key Innovation**: Schemes enable automated argument construction, not just analysis.

**Mesh Opportunity**: Implement similar "Find Arguments" feature
```typescript
class ArgumentFinderService {
  async findArguments(
    goalClaim: string,
    availablePremises: string[],
    audienceCommitments: string[]
  ): Promise<ArgumentChain[]> {
    // Search schemes that conclude with goalClaim type
    // Match availablePremises to scheme premise patterns
    // Filter by audienceCommitments (audience-aware)
    // Return chains from premises to goal
  }
}
```

---

### 11.5 Future Research Challenges

**11.5.1 Integration with Discourse Interpretation**

**Current Limitation**:
> "Schemes can be powerful instruments for representing arguments and relations between sentences. However, at present they presuppose an interpretation of discourse."

**Challenge**: "To be integrated within a theory of discourse interpretation."

**Goal**: "Show how schemes can represent interpretation, and how they can be used to assess what interpretation is the best one."

**Citation**: Macagno (2012)

**Implication**: Schemes shouldn't just analyze interpreted arguments, but guide interpretation itself.

**Example**: Ambiguous text → multiple possible interpretations → schemes help evaluate which interpretation makes best argument.

**11.5.2 Linking to Dialogue Types**

**Challenge**:
> "Link the theory of dialogue types and discourse moves (utterances) to argumentation schemes."

**Goal**: "Show how certain schemes are the most adequate to pursue specific dialogical ends."

**Benefits**:
1. **Argument production**: Map useful tools for generating arguments in dialogue
2. **Interpretation**: Presumptions for interpreting arguments based on dialogue type

**Citation**: Macagno & Bigi (2017)

**Dialogue Type Examples**:
- **Deliberation**: Practical reasoning, consequences schemes predominate
- **Inquiry**: Expert opinion, causal schemes predominate
- **Persuasion**: Values, commitment schemes predominate
- **Negotiation**: Interest-based schemes predominate

**Mesh Application**: Deliberation type could suggest applicable schemes
```typescript
model Deliberation {
  // Existing fields...
  
  dialogueType?: "deliberation" | "inquiry" | "persuasion" | "negotiation"
}

// Suggest schemes based on type
function getSuggestedSchemes(deliberation: Deliberation): ArgumentScheme[] {
  const typeMapping = {
    deliberation: ["practical_reasoning", "consequences", "values"],
    inquiry: ["expert_opinion", "cause_to_effect", "sign"],
    persuasion: ["values", "commitment", "popular_opinion"],
    negotiation: ["fairness", "practical_reasoning", "sacrifice"]
  }
  
  return getSchemesFor Tags(typeMapping[deliberation.dialogueType])
}
```

---

### 11.6 Overall Significance

**Historical Continuity**:
- Aristotle's topics → Medieval topics → Modern schemes
- 2000+ year intellectual tradition
- Enduring relevance to reasoning

**Contemporary Applications**:
- **AI & Law**: Case-based reasoning, statutory interpretation
- **Argument Mining**: Automated structure extraction
- **Critical Thinking Education**: Teaching reasoning patterns
- **Computational Argumentation**: Formal systems (Carneades, ASPIC+)

**Dual Nature**: Both analytical tools and constructive instruments

**Future Potential**: Integration with discourse interpretation and dialogue theory will deepen understanding and expand applications.

---

### 11.7 Connection to Mesh Vision

**Mesh as Argumentation Platform**:

Section 11's emphasis on dual functions (analysis + construction) validates Mesh's potential:

**Analysis Features** (Partially Implemented):
- Scheme identification
- Critical question application
- Attack type categorization
- Argument structure visualization

**Construction Features** (Needed):
- Scheme-guided argument building
- Premise-to-conclusion chains
- Audience-aware argument generation
- Goal-directed search (like Carneades)

**Integration Opportunities**:
- Dialogue type awareness (deliberation vs. inquiry vs. persuasion)
- Discourse interpretation guidance
- Connection to Argument Web ecosystem
- Corpus contribution for research

**Vision**: Transform from reactive analysis tool → proactive construction assistant

---

### 11.8 Key Takeaways for Implementation

**11.8.1 Schemes Are Dual-Purpose**

Not just for evaluating existing arguments, but constructing new ones.

**Implication**: UI should support both:
- "Analyze this argument" (defensive)
- "Build an argument for this claim" (offensive)

**11.8.2 Argument Invention Is Core Use Case**

Historical tradition emphasizes finding arguments, not just evaluating them.

**Implication**: "Find Arguments" feature is not optional enhancement but core functionality.

**11.8.3 Audience Commitments Matter**

Effective arguments use premises accepted by audience.

**Implication**: Track what claims are accepted/disputed in deliberation, use for argument suggestion.

**11.8.4 Dialogue Type Constrains Schemes**

Different types of dialogue favor different schemes.

**Implication**: Tag deliberations by type, suggest contextually appropriate schemes.

**11.8.5 Discourse Interpretation Is Open Problem**

Schemes don't just analyze pre-interpreted arguments but should guide interpretation.

**Implication**: When text is ambiguous, show multiple scheme-based interpretations.

**11.8.6 Integration with Research Ecosystem**

Carneades, OVA, AIFdb, Argument Web form ecosystem.

**Implication**: Mesh should integrate via standard formats (AIF, JSON-LD).

---

## Final Synthesis Across All Sections

### The Complete Picture

**Sections 1-4** (Historical & Theoretical):
- Ancient origins (Aristotle → Boethius → Abelard)
- Modern classifications (Perelman, Toulmin, Kienpointner, etc.)
- Multi-dimensional problem: Single criterion insufficient
- Two-dimensional solution: Material relation + Logical form

**Section 5** (Classification System):
- Purpose-driven navigation (action vs. state of affairs)
- Internal vs. external sources
- Dichotomic tree for systematic selection
- Validates Mesh's six-field taxonomy

**Section 6** (Clusters):
- Schemes form compositional hierarchies
- Instrumental PR + Values = Value-based PR
- Slippery slope embeds value-based PR
- Identification conditions for classification

**Section 7** (Nets):
- **Critical insight**: Arguments are nets, not single schemes
- Multiple schemes (classification + values + consequences)
- Dependencies (premise-conclusion, presuppositional, support)
- Visualization essential for understanding

**Section 8** (AI & Law):
- Four CQ roles validate attack types
- Burden of proof critical for CQ modeling
- Three premise types (ordinary, assumption, exception)
- Carneades shows argument generation feasible

**Section 9** (Argument Mining):
- Statistical ML insufficient alone
- Schemes as priors for ML
- Linguistic markers enable suggestion
- Corpus infrastructure enables research

**Section 10** (Ontologies):
- Formal representation enables automated reasoning
- CQ inheritance from parent schemes
- Classification inference
- Interoperability via OWL/AIF

**Section 11** (Conclusions):
- Dual functions: Analysis + Construction
- Argument invention is core use case
- Future: Discourse interpretation, dialogue types
- Integration with computational ecosystems

---

### Transformative Insights for Mesh

**1. Arguments Are Multi-Scheme Nets** (Section 7)

**Current**: Single `schemeId` per argument
**Needed**: ArgumentNet with multiple schemes and dependencies

**2. Construction > Analysis** (Section 11)

**Current**: Reactive analysis ("What scheme is this?")
**Needed**: Proactive construction ("How can I argue for X?")

**3. Burden of Proof Matters** (Section 8)

**Current**: Uniform CQ treatment
**Needed**: `burdenOfProof` and `requiresEvidence` on CQs

**4. CQs Should Inherit** (Section 10)

**Current**: Each scheme defines all CQs
**Needed**: Children inherit parent CQs automatically

**5. Text Analysis Enables Suggestion** (Section 9)

**Current**: Manual scheme selection
**Needed**: Analyze text for indicators, suggest schemes

**6. Dialogue Type Constrains Schemes** (Section 11)

**Current**: All schemes equally accessible
**Needed**: Suggest schemes based on deliberation type

**7. Interoperability Is Essential** (Sections 9-10)

**Current**: Mesh-specific format
**Needed**: Export/import AIF, integrate with Argument Web

---

### Implementation Priorities

**Priority 1: Multi-Scheme Arguments**
- Model ArgumentNet with nodes/edges
- Track dependencies between schemes
- Visualize nets, not just trees

**Priority 2: Argument Generation**
- "Find Arguments" feature (like Carneades)
- Scheme suggestion from text
- Guided argument construction

**Priority 3: CQ Enhancements**
- Add `burdenOfProof` field
- Add `requiresEvidence` field
- Implement inheritance

**Priority 4: Text Analysis**
- Identify scheme indicators in text
- Suggest applicable schemes
- Extract structure candidates

**Priority 5: Interoperability**
- Export to AIF/OWL
- Import from AIFdb
- Contribute to research corpus

---

### The Vision

**Mesh as Comprehensive Argumentation Platform**:

1. **Analysis**: Identify schemes in existing arguments (current strength)
2. **Construction**: Generate new arguments from goals (transformative)
3. **Evaluation**: Apply CQs with proper burden allocation (enhanced)
4. **Visualization**: Show argument nets with dependencies (critical)
5. **Suggestion**: AI-assisted scheme selection from text (helpful)
6. **Integration**: Part of Argument Web ecosystem (scholarly)

**From**: Argument tracking tool
**To**: Intelligent argumentation assistant

Grounded in 2000+ years of rhetorical tradition, validated by 30+ years of AI research, enabled by modern web technologies.

---

*End of Paper Analysis - All Sections Complete*

---

## Acknowledgments

This comprehensive review synthesizes Macagno, Walton & Reed (2017) across six review documents, covering:
- **Part 1**: Sections 1-3 (Introduction, Nature, Historical Tradition)
- **Part 2**: Section 4 (Modern Classifications)
- **Part 3**: Sections 5-6 (Classification System, Clusters)
- **Part 4**: Section 7 (Nets of Schemes)
- **Part 5**: Section 8 (AI and Law)
- **Part 6**: Sections 9-11 (Mining, Ontologies, Conclusions)

Total analysis: ~110,000 words across ~2,300 source lines, providing detailed examination of theoretical foundations, classification systems, compositional structures, computational implementations, and practical applications - all connected to Mesh's architecture and implementation opportunities.
