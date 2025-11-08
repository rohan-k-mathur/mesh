# Argumentation Schemes: History, Classifications, and Computational Applications
## Detailed Review Document - Part 5

**Document**: Macagno, Walton & Reed (2017)  
**Review Focus**: Section 8 - Using Schemes in AI and Law; Section 9 - Argument Mining; Section 10 - Formal Ontologies; Section 11 - Conclusions  
**Part**: 5 of series (Sections 8-11)

---

## Section 8: Using Argumentation Schemes in AI and Law

### Overview

Section 8 shifts from theoretical foundations to **computational implementation**, surveying how AI systems have formalized and operationalized argumentation schemes. This section is **critically important for Mesh** because it addresses the same challenges we face:
- How to model critical questions computationally
- How to represent attack types (premise, conclusion, undercutting)
- How to handle burden of proof shifts
- How to model schemes in formal argumentation frameworks

**Central Challenge**:
> "The central problem posed at that point was how to model the distinctive set of critical questions matching each scheme."

**Key Systems Surveyed**:
1. **Verheij (2003)** - ArguMed, first CQ formalization, four CQ roles
2. **Reed & Walton (2005)** - Type-based formal analysis
3. **Prakken (2005)** - Schemes as rules in ASPIC+
4. **Gordon & Walton (2007)** - Carneades, three premise types
5. **Prakken et al. (2015)** - Case-based reasoning with factors
6. **Walton et al. (2016)** - Statutory interpretation schemes

**Profound Insight**: Different CQs function differently - some merely shift burden of proof, others require evidence to defeat argument. This maps directly to Mesh's `attackType` field (REBUTS/UNDERCUTS/UNDERMINES).

---

### 8.1 Introduction to AI and Law: Verheij (2003)

**Historical Significance**: "The paper that introduced argumentation schemes to the AI and law community."

**Verheij's Core Proposal**:
> "Any argumentation scheme can be expressed in the following format: Premise 1, Premise 2,..., Premise n, therefore Conclusion."

**Simple Structure**:
- Set of premises (propositions)
- Single conclusion (proposition)
- Inferential connection

**ArguMed Tool**:
- First software to visualize scheme graph structure
- Argument mapping tool
- Graph with arcs joining premise/conclusion nodes

**Limitation Identified**: "So far then it seemed that schemes were amenable to being fitted into AI systems without undue difficulty, but the central problem posed at that point was how to model the distinctive set of critical questions matching each scheme."

**The CQ Problem**: 
- Premises and conclusions are propositions (easy to model as nodes)
- CQs are not propositions but **questions** (how to model?)
- One proposal: Model CQs as additional premises
- But this proved inadequate (see next section)

**Mesh Connection**: Our current model represents schemes with:
```typescript
model ArgumentScheme {
  premises: Json // Array of premise templates
  conclusion: string // Conclusion template
  criticalQuestions: CriticalQuestion[]
}
```

Similar to Verheij's format, but we also model CQs separately (not as premises). Section 8 will validate this approach.

---

### 8.2 The Critical Questions Problem: Four Distinct Roles

**Problem with "CQs as Premises" Approach**:
> "There was a big problem with this way of proceeding because different critical questions act in different ways in this regard."

**Two Key Variations**:

**8.2.1 Mere Asking Defeats Argument**
- Sometimes asking CQ is enough to defeat target
- Shifts burden of proof to proponent
- No evidence needed from questioner

**8.2.2 Evidence Required to Defeat**
- Other times, question alone does nothing
- Questioner must provide backup evidence
- Burden stays with questioner until evidence given

**Burden of Proof Issue** (Gordon et al. 2007):
> "The issue turned out to be one of burden of proof. In some instances, merely asking a critical question is enough to shift the burden of proof onto the proponent who put forward the argument. In other instances, the burden of proof does not shift unless the questioner can provide some backup evidence to support the question."

**Verheij's Four CQ Roles** (2003, p.180):

**Role 1: Question Whether Premise Holds**
- Target: Explicit premise of scheme
- Example: "Is the expert really an expert?" (challenges expertise premise)
- **Attack type**: Premise attack
- **Mesh mapping**: `attackType: "UNDERMINES"`, `targetScope: "premise"`

**Role 2: Point to Exceptional Situations**
- Target: General rule underlying scheme
- Example: "Is this an exception to the usual pattern?"
- **Attack type**: Undercutting (defeats inference without attacking premises)
- **Mesh mapping**: `attackType: "UNDERCUTS"`, `targetScope: "inference"`

**Role 3: Frame Conditions for Proper Use**
- Target: Applicability conditions of scheme
- Example: "Is this the right kind of case for this scheme?"
- **Attack type**: Undercutting (scheme doesn't apply)
- **Mesh mapping**: `attackType: "UNDERCUTS"`, `targetScope: "applicability"`

**Role 4: Indicate Other Arguments**
- Target: Point to counterarguments
- Example: "Are there conflicting expert opinions?"
- **Attack type**: Might be undercutting or conclusion attack
- **Mesh mapping**: `attackType: "REBUTS"` or `"UNDERCUTS"` depending on nature

**Three Ways to Attack an Argument** (Currently Assumed in AI):

1. **Premise Attack**: Attack one or more premises
2. **Conclusion Attack**: Attack the conclusion directly
3. **Undercutting** (Pollock 1995): Attack inferential link (e.g., exception applies)

**Mesh Implementation**:

Current `CriticalQuestion` model:
```typescript
model CriticalQuestion {
  question: string
  attackType: "REBUTS" | "UNDERCUTS" | "UNDERMINES"
  targetScope: "conclusion" | "premise" | "inference"
}
```

**Validation**: Section 8 confirms our three attack types align with AI consensus:
- `UNDERMINES` = Premise attack (Role 1)
- `UNDERCUTS` = Undercutting (Roles 2-3)
- `REBUTS` = Conclusion attack (Role 4)

**Critical Insight**: CQs perform multiple functions - cannot be modeled uniformly as "additional premises." Our approach of explicitly tagging `attackType` and `targetScope` is correct.

---

### 8.3 ASPIC+: Formal Argumentation Framework

**ASPIC+ Overview** (Prakken 2010):
- Formal argumentation system for defeasible reasoning
- Consists of logical language L with contrariness relation (like negation)
- Two kinds of inference rules: **strict** (certain) and **defeasible** (uncertain)

**Based on Dung's Abstract Argumentation Framework (1995)**:
- Defined as pair `(Args, R)`
- `Args` = set of arguments
- `R` = attack relation (binary relation on Args)
- Arguments can be "in" or "out"

**Defeat Mechanism**:
- Directed graph: a2 defeats a1, a3 defeats a2, ..., an defeats an-1
- Argument is **rejected (out)** if attacked by any "in" argument
- Argument is **accepted (in)** if not attacked by any "in" argument

**Key Limitation**:
> "Note that the notions of argument and argument attack are taken as primitive in an abstract argumentation system, so that such a system by itself provides no way of modeling the premises and the conclusion."

**ASPIC+ Solution**: Layer structured arguments (with premises/conclusions) on top of abstract framework.

**Prakken's Observation** (2005, p.34):
> "Schemes act very much like the rules used in rule-based computer systems."

**Mesh Connection**: 
- Our Argument model has attack/support relations (like Dung's R)
- We model premises/conclusion explicitly (going beyond abstract framework)
- Attack types (REBUTS/UNDERCUTS/UNDERMINES) map to different defeat mechanisms

Consider enhancing with:
```typescript
model Argument {
  // Existing fields...
  
  // ASPIC+ style
  conclusionStrength: "strict" | "defeasible"
  defeatedBy: Argument[] @relation("Defeat")
  defeats: Argument[] @relation("Defeat")
  status: "in" | "out" | "undecided"
}
```

---

### 8.4 Case-Based Reasoning: Legal Precedent Schemes

**Context**: Case-based reasoning (CBR) vitally important for legal AI and understanding legal reasoning.

**CBR Method**:
> "Evaluates an argument in a given case by comparing and contrasting its features to those of prior cases that have already been evaluated."

**Key Elements**:
- **Knowledge base**: Prior cases with evaluations
- **Factors**: Features that cases share
- **Similarity judgments**: Decided by shared factors
- **Pro/con precedents**: Support or oppose current case

**Prakken et al. (2015) Scheme CS1**:

```
commonPfactors(curr; prec) = p,    // Plaintiff factors in common
commonDfactors(curr; prec) = d,    // Defendant factors in common
preferred(p; d)                    // P factors preferred in precedent
———————————————————————————
outcome(curr) = Plaintiff          // Current case for plaintiff
```

**Interpretation**: "The current argument should be decided for the plaintiff because the common p factors were preferred to the common d factors in the precedent argument."

**Scheme Features**:
- Variables: `curr` (current case), `prec` (precedent)
- Functions: `commonPfactors`, `commonDfactors`, `preferred`
- Formal notation more mathematical than natural language

**Attack Mechanisms**: Paper uses "running example to illustrate how an argument fitting a scheme can be attacked by other arguments in the formal system."

**Mesh Application**: 

We don't currently have legal-specific schemes, but the principle applies generally:
```typescript
// Example: Argument from Precedent scheme
{
  name: "Argument from Precedent",
  premises: [
    "Case C1 has features F",
    "Case C2 has features F",
    "Case C1 was decided with outcome O",
    "No relevant differences between C1 and C2"
  ],
  conclusion: "Case C2 should be decided with outcome O",
  materialRelation: "precedent",
  reasoningType: "analogical"
}
```

**CQs for Precedent**:
- Are the cases really similar in relevant respects?
- Are there relevant differences?
- Is the precedent binding or merely persuasive?
- Has the precedent been overruled?

---

### 8.5 Statutory Interpretation: Canons as Schemes

**Walton, Sartor & Macagno (2016)**: "Showed how canons of interpretation can be translated into argumentation schemes."

**Method**:
1. Analyze common statutory arguments in legal examples
2. Examine key interpretive legal arguments (Tarello 1980, MacCormick & Summers 1991)
3. Formulate as argumentation schemes

**Schemes Modeled**:
- **Argument from Ordinary Meaning**: Term should have its ordinary sense
- **Argument from Technical Meaning**: Term should have technical/legal sense
- **Argument from Precedent**: Prior interpretation should guide
- **Argument from Purpose**: Interpretation achieving legislative purpose preferred
- **A Contrario Argument**: What's not explicitly included is excluded
- **Historical Argument**: Legislative history informs meaning
- **Non-Redundancy Argument**: No part of statute should be rendered meaningless

**Application**:
> "It was shown using classical examples of statutory interpretation in law how these schemes (and others) can be incorporated into computational argumentation systems such as CAS and ASPIC+ and applied to displaying the pro-contra structure argumentation in legal cases using argument mapping tools."

**Mesh Insight**: 

Domain-specific schemes (legal, scientific, policy) can be modeled using same architecture as general schemes. Consider:

```typescript
model ArgumentScheme {
  // Existing fields...
  
  domain?: string // "legal" | "scientific" | "policy" | "general"
  subdomain?: string // "statutory_interpretation" | "case_law" | ...
  applicableJurisdictions?: string[] // For legal schemes
}
```

This enables:
- **Domain filtering**: "Show me legal schemes"
- **Expertise scaffolding**: Hide domain schemes from novices
- **Specialized CQs**: Legal schemes have legal-specific CQs

---

### 8.6 Three Premise Types: Gordon & Walton's Carneades Solution

**The Problem Revisited**: How to model CQs when they function differently?

**Gordon & Walton (2006) Solution**: Use **three kinds of premises** in Carneades Argumentation System (CAS):

**8.6.1 Ordinary Premises**
- Must be supported by further arguments
- Even if not questioned
- Proponent has burden to support
- Example: "The expert said X" needs support

**8.6.2 Assumptions**
- Accepted unless questioned
- If questioned, proponent must support
- Otherwise, taken for granted
- Example: "Experts generally know their field" (background assumption)

**8.6.3 Exceptions**
- Accepted unless challenger provides evidence
- Questioner has burden to support
- Not proponent's responsibility to refute
- Example: "Expert might be biased" - challenger must show bias

**Dialectical Status** (Gordon & Walton 2006):

CAS uses information about statement dialectical status:
- **Undisputed**: All parties accept
- **At issue**: Questioned but not resolved
- **Accepted**: Established in dialogue
- **Rejected**: Refuted in dialogue

**Burden of Proof Allocation**:
- Ordinary premises: Burden on **proponent**
- Assumptions: Burden on **proponent** if questioned
- Exceptions: Burden on **challenger**

**Critical Insight**:
> "This solution used information about the dialectical status of statements... to model critical questions in such a way as to allow the burden of proof to be allocated to the proponent of the argument or the critical questioner as appropriate for the case in point."

**Mesh Application**:

Consider adding premise types to ArgumentScheme:
```typescript
model SchemePremise {
  id: string
  schemeId: string
  content: string
  order: int
  premiseType: "ordinary" | "assumption" | "exception"
  burdenOnProponent: boolean // Computed from type
}
```

And CQ burden tracking:
```typescript
model CriticalQuestion {
  // Existing fields...
  
  burdenOfProof: "proponent" | "challenger"
  requiresEvidence: boolean // Must provide evidence or just ask?
}
```

**CQ Examples with Burden**:

```typescript
// Assumption challenged - burden on proponent
{
  question: "Is the expert actually qualified?",
  attackType: "UNDERMINES",
  targetScope: "premise",
  burdenOfProof: "proponent", // Proponent must prove expertise
  requiresEvidence: false // Just asking shifts burden
}

// Exception raised - burden on challenger
{
  question: "Is the expert biased in this case?",
  attackType: "UNDERCUTS",
  targetScope: "inference",
  burdenOfProof: "challenger", // Challenger must prove bias
  requiresEvidence: true // Must provide evidence of bias
}
```

---

### 8.7 Carneades System Architecture

**Carneades Versions**:
- **CAS 1-3**: Earlier versions (backwards-chaining)
- **CAS 4**: Current version (forwards-reasoning, online at carneades.fokus.fraunhofer.de)
- **CAS2**: Formal model underlying version 4

**CAS2 Formal Model** (Gordon & Walton 2016):

**Scheme Definition**: Tuple `(e, v, g)` where:
- **e** = weighing function (weighs arguments instantiating scheme)
- **v** = validation function (tests if argument properly instantiates scheme)
- **g** = generation function (generates arguments by instantiating scheme)

**Argument Definition**: Tuple `(S, P, C, U)` where:
- **S** = scheme instantiated
- **P** = finite subset of L (premises)
- **C** = member of L (conclusion)
- **U** = undercutter

**Issue Definition**: Tuple `(O, F)` where:
- **O** = options (alternative positions)
- **F** = proof standard

**Tripartite Graph Structure** (Version 4):
- **Statement nodes**: Propositions
- **Argument nodes**: Scheme instantiations
- **Issue nodes**: Questions with alternative answers (represented as diamonds)

**Argument Evaluation**: Label statements as `in`, `out`, or `undecided`:

- **In**: Assumed acceptable or derived via arguments + weighing + proof standards
- **Out**: Neither assumed nor supported, therefore rejected
- **Undecided**: Neither in nor out

**Backwards vs. Forwards Reasoning**:

**Carneades 3** (Backwards):
- Goal-directed
- Start with goal proposition
- Work backwards to find supporting arguments
- Find premises that support goal

**Carneades 4** (Forwards):
- Data-driven
- Start with assumptions
- Generate arguments using schemes
- Derive conclusions

**Key Advantage of Forwards**:
> "Forwards reasoning allows CAS to invent arguments using argumentation schemes, such as the scheme for argument from expert opinion, where the conclusion is a second-order variable ranging over propositions."

**Second-Order Variables**: Conclusion can be any proposition (not predetermined).

Example: Scheme for expert opinion
```
E is expert in domain D
E asserts proposition P
P is in domain D
———————————————
Therefore P (where P is variable)
```

CAS 4 can **invent** arguments by finding experts and their assertions, generating conclusions.

**Twenty Schemes Built In**: "Only Carneades 4 can construct arguments using formalizations of all of the twenty or so schemes currently built into the system."

**Mesh Implications**:

**Argument Generation** (currently lacking):
```typescript
// Service to generate arguments from schemes
class ArgumentGenerator {
  generateFromScheme(
    schemeId: string,
    availablePremises: Proposition[],
    goalConclusion?: string
  ): Argument[] {
    // Find instantiations of scheme using available premises
    // If goalConclusion, work backwards (CAS 3 style)
    // If not, work forwards (CAS 4 style)
  }
}
```

**Proof Standards** (currently lacking):
```typescript
model Issue {
  id: string
  question: string
  positions: string[] // Alternative answers
  proofStandard: "preponderance" | "clear_and_convincing" | "beyond_reasonable_doubt"
}
```

**Undercutters** (partially modeled via attackType):
```typescript
model Argument {
  // Existing fields...
  
  undercutters: Argument[] // Arguments that undercut this one
  undercutBy?: string // ID of argument this undercuts
}
```

---

### 8.8 Connection to Mesh Architecture

**8.8.1 Attack Type Validation**

Section 8 **validates** Mesh's three attack types through multiple independent sources:

**Pollock (1995)**: Three attack modes
- Premise attack → `UNDERMINES`
- Conclusion attack → `REBUTS`
- Undercutting → `UNDERCUTS`

**Verheij (2003)**: Four CQ roles
- Role 1 (premise) → `UNDERMINES`
- Roles 2-3 (inference/applicability) → `UNDERCUTS`
- Role 4 (counterarguments) → `REBUTS` or `UNDERCUTS`

**Current Implementation**: Correct alignment with 30+ years of AI research.

**8.8.2 Burden of Proof Enhancement**

Section 8 reveals **burden of proof** is critical dimension we don't fully capture.

**Current Gap**: CQs don't indicate who has burden or whether evidence required.

**Enhancement**:
```typescript
model CriticalQuestion {
  question: string
  attackType: "REBUTS" | "UNDERCUTS" | "UNDERMINES"
  targetScope: "conclusion" | "premise" | "inference"
  burdenOfProof: "proponent" | "challenger" // NEW
  requiresEvidence: boolean // NEW - just asking vs. must prove
}
```

**UI Impact**: When user asks CQ, system indicates:
- "This question shifts burden to original arguer"
- Or: "You must provide evidence to make this challenge stick"

**8.8.3 Premise Type Distinction**

Gordon & Walton's three premise types could enhance schemes:

```typescript
model SchemePremise {
  id: string
  schemeId: string
  content: string
  variableName?: string
  order: int
  premiseType: "ordinary" | "assumption" | "exception" // NEW
}
```

**Benefits**:
- **Clearer CQ generation**: Assumptions generate "just ask" CQs, exceptions generate "must prove" CQs
- **Dialectical accuracy**: Matches actual argumentation norms
- **Educational value**: Teaches users about burden of proof

**8.8.4 Proof Standards**

Carneades uses proof standards (preponderance, clear and convincing, beyond reasonable doubt).

**Mesh Enhancement**:
```typescript
model Claim {
  // Existing fields...
  
  proofStandard?: "preponderance" | "clear_and_convincing" | "beyond_reasonable_doubt" | "scintilla"
}
```

Affects argument evaluation:
- **Preponderance**: >50% likelihood
- **Clear and convincing**: ~75% likelihood
- **Beyond reasonable doubt**: ~95% likelihood

**8.8.5 Argument Generation**

Carneades can **generate** arguments from schemes + premises.

**Mesh Opportunity**: 
```typescript
class ArgumentGenerationService {
  async suggestArguments(
    claimId: string,
    availableEvidence: string[],
    mode: "support" | "attack"
  ): Promise<GeneratedArgument[]> {
    // Find applicable schemes
    // Match evidence to premise patterns
    // Generate instantiations
    // Return ranked suggestions
  }
}
```

**UI Flow**:
```
User: "I want to attack this claim about expert testimony"
System: [Analyzes claim, identifies expert opinion scheme]
System: "Based on available evidence, you could:"
  1. Question expertise (CQ1 - undermines premise)
  2. Show expert bias (CQ2 - undercuts inference)
  3. Present conflicting expert (CQ3 - rebuts conclusion)
System: [For each option, shows template and required evidence]
```

**8.8.6 Tripartite Graph Structure**

Carneades 4 uses statements + arguments + issues.

**Mesh Currently**: Statements (claims) + arguments
**Missing**: Issues (questions with alternative positions)

**Enhancement**:
```typescript
model Issue {
  id: string
  deliberationId: string
  question: string
  positions: IssuePosition[]
  proofStandard?: string
  resolution?: string // Which position won
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

**Use Case**: Deliberations could be framed as issues:
- Issue: "Should we implement feature X?"
- Positions: "Yes", "No", "Defer"
- Arguments support/attack positions
- Resolution based on proof standard

---

### 8.9 Critical Insights for Implementation

**8.9.1 CQs Are Not Uniform**

**Key Lesson**: Cannot model all CQs the same way - they have different functions, burdens, evidence requirements.

**Current Mesh**: Uniform CQ model
**Enhancement**: Add `burdenOfProof` and `requiresEvidence` fields

**8.9.2 Schemes Function Like Rules**

Prakken: "Schemes act very much like the rules used in rule-based computer systems."

**Implication**: Schemes can drive **automated reasoning**:
- Forward chaining: Given premises, derive conclusions
- Backward chaining: Given goal, find needed premises
- Abduction: Explain observation by finding scheme + premises

**8.9.3 Abstract Frameworks Need Structure**

Dung's abstract framework (Args, R) is elegant but insufficient - need premises, conclusions, scheme identification.

**Mesh Approach**: Structured arguments (with scheme, premises, conclusion) is correct.

**8.9.4 Dialectical Status Matters**

Statements aren't just true/false but have dialectical status:
- Undisputed, at issue, accepted, rejected

**Mesh Could Track**:
```typescript
model Claim {
  // Existing fields...
  
  dialecticalStatus: "undisputed" | "at_issue" | "accepted" | "rejected" | "undecided"
  statusInContext?: string // May vary by deliberation
}
```

**8.9.5 Domain-Specific Schemes Are Valuable**

Legal schemes (statutory interpretation, precedent) show value of specialized schemes.

**Mesh Opportunity**: 
- General schemes (for all users)
- Domain schemes (legal, scientific, policy)
- Organization schemes (company-specific)

**8.9.6 Argument Generation > Scheme Matching**

Carneades 4's forwards reasoning enables **argument invention**, not just analysis.

**Transformative Opportunity**: Shift from "What scheme does this match?" to "What arguments can I generate?"

---

### 8.10 Questions Raised

**Q1**: Should we add burden of proof to CriticalQuestion model?
- Affects UI: tells user who must provide evidence
- Matches actual dialectical norms
- But adds complexity

**Q2**: Should we distinguish premise types (ordinary/assumption/exception)?
- Enables more accurate CQ generation
- Matches Carneades model
- But requires updating all schemes

**Q3**: Should we implement argument generation?
- Very powerful for users ("suggest attacks")
- Requires sophisticated matching algorithms
- Carneades shows it's feasible

**Q4**: Should we add proof standards to claims?
- Relevant for deliberations, policy arguments
- Less relevant for casual discourse
- Could be optional advanced feature

**Q5**: Should we model issues separately from claims?
- Carneades distinguishes statements vs. issues
- Issues have multiple positions + proof standards
- Could unify deliberations around issues

**Q6**: How to handle second-order variables in schemes?
- Expert opinion: "Expert says P" where P is any proposition
- Requires more sophisticated variable system
- Current string templates might be insufficient

**Q7**: Should we support forwards and backwards reasoning?
- Backwards: "How can I support this claim?" (goal-directed)
- Forwards: "What conclusions follow?" (data-driven)
- Both valuable for different use cases

---

### 8.11 Terminology Established

| Term | Definition | Significance |
|------|------------|-------------|
| **Premise Attack** | Attacking one or more premises of argument | Mesh: `attackType: "UNDERMINES"` |
| **Conclusion Attack** | Attacking conclusion directly | Mesh: `attackType: "REBUTS"` |
| **Undercutting** | Attacking inferential link (e.g., exception applies) | Mesh: `attackType: "UNDERCUTS"` |
| **Burden of Proof** | Allocation of responsibility to provide evidence | Critical for CQ modeling; missing in Mesh |
| **Ordinary Premises** | Must be supported even if not questioned | Proponent always has burden |
| **Assumptions** | Accepted unless questioned, then must support | Burden shifts when questioned |
| **Exceptions** | Accepted unless challenger provides evidence | Burden on challenger, not proponent |
| **Dialectical Status** | Position of statement in dialogue (undisputed/at issue/accepted/rejected) | Affects evaluation and burden |
| **Proof Standard** | Threshold for acceptance (preponderance, clear and convincing, beyond reasonable doubt) | Varies by context/domain |
| **Weighing Function** | Function evaluating strength of scheme instantiation | Carneades: computes argument weight |
| **Validation Function** | Tests if argument properly instantiates scheme | Carneades: checks premise-pattern match |
| **Generation Function** | Creates arguments by instantiating scheme with premises | Carneades: enables argument invention |
| **Tripartite Graph** | Structure with statement, argument, and issue nodes | Carneades 4: extends bipartite graphs |
| **Backwards Chaining** | Goal-directed reasoning from conclusion to premises | CAS 3: "How can I prove this?" |
| **Forwards Reasoning** | Data-driven reasoning from premises to conclusions | CAS 4: "What follows from this?" |
| **Second-Order Variable** | Variable ranging over propositions (not just terms) | Expert opinion: P can be any statement |
| **Undercutter** | Argument that defeats inference without attacking premises/conclusion | Distinct from premise/conclusion attacks |

---

### 8.12 Section Summary

Section 8 surveys **computational implementations of argumentation schemes in AI and Law**, revealing critical design principles for modeling schemes, CQs, and attacks.

**Core Problem: Modeling Critical Questions**

Different CQs function differently:
1. **Premise questions**: Challenge explicit premises (premise attack)
2. **Exception questions**: Point to situations where scheme fails (undercutting)
3. **Applicability questions**: Challenge scheme appropriateness (undercutting)
4. **Counterargument questions**: Point to opposing arguments (varies)

**Key Finding**: Cannot model uniformly - CQs have different **attack types**, **burdens of proof**, and **evidence requirements**.

**Verheij's Four CQ Roles** validate Mesh's attack type architecture:
- Role 1 → `UNDERMINES` (premise attack)
- Roles 2-3 → `UNDERCUTS` (undercutting)
- Role 4 → `REBUTS` or `UNDERCUTS`

**Three Ways to Attack** (AI consensus):
1. Premise attack (`UNDERMINES`)
2. Conclusion attack (`REBUTS`)
3. Undercutting (`UNDERCUTS`)

Current Mesh implementation correctly captures these three modes.

**Gordon & Walton's Solution: Three Premise Types**

**Ordinary Premises**: Burden always on proponent
**Assumptions**: Burden shifts to proponent when questioned
**Exceptions**: Burden on challenger to prove

This **burden of proof allocation** is critical dimension Mesh doesn't fully model.

**Carneades System Architecture**

**CAS2 Model**:
- Scheme = (weighing, validation, generation)
- Argument = (scheme, premises, conclusion, undercutter)
- Issue = (positions, proof standard)
- Tripartite graph: statements + arguments + issues

**CAS 4 Innovations**:
- Forwards reasoning (data-driven)
- Argument generation (invention, not just analysis)
- Second-order variables (conclusion can be any proposition)
- Twenty schemes built in

**Legal Applications**:

**Case-Based Reasoning**: Schemes for precedent with factors
**Statutory Interpretation**: Canons translated to schemes (ordinary meaning, technical meaning, purpose, a contrario, etc.)

Shows schemes work in specialized domains with domain-specific CQs.

**Critical Validations for Mesh**:

1. **Attack type architecture** correct (aligns with 30+ years AI research)
2. **Structured arguments** correct (abstract frameworks insufficient)
3. **Separate CQ modeling** correct (not just additional premises)
4. **Domain-specific schemes** feasible (legal schemes prove concept)

**Critical Gaps in Mesh**:

1. **Burden of proof** not modeled on CQs
2. **Evidence requirements** not distinguished (just ask vs. must prove)
3. **Premise types** not distinguished (ordinary/assumption/exception)
4. **Proof standards** not modeled on claims
5. **Argument generation** not implemented (only analysis)
6. **Issues** not modeled separately from claims

**Transformative Opportunity**: **Argument Generation**

Shift from reactive analysis ("What scheme is this?") to proactive invention ("What arguments could I make?").

Carneades 4 shows this is feasible:
1. User has goal (support/attack claim)
2. System finds applicable schemes
3. System matches available evidence to premises
4. System generates instantiations
5. System ranks by strength/relevance

This would transform Mesh from **argument analysis tool** to **argument construction tool**.

**Connection to Previous Sections**:

- Section 7 showed arguments are **nets** of schemes
- Section 8 shows how to **model** schemes computationally
- Together: Need to model both individual schemes (Section 8) and their interdependencies (Section 7)

**Next Section Preview**: Section 9 covers **argument mining** - automatically extracting argument structure from natural language. Will address corpora, machine learning, and techniques for automatic scheme identification. Critical for understanding how to help users identify schemes in real text.

---

*End of Section 8 Analysis*
