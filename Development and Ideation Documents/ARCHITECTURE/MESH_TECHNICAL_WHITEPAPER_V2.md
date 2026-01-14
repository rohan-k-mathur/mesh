# Mesh: A Graph-Structured System for Collective Argumentation

**Abstract.** Collective reasoning in digital environments suffers from a fundamental structural problem: discourse produces unstructured text that cannot be composed, analyzed, or verified. We propose a system that represents arguments as typed graph structures conforming to a formal ontology, enabling claims to reference evidence, arguments to reference claims, and challenges to reference the specific inferential steps they contest. The architecture implements progressive formalization—structure is imposed only as complexity demands it—allowing the same system to support casual discussion and formal deliberation. Arguments are constructed using established argumentation schemes with automatically surfaced critical questions, attacks are typed according to their target (conclusion, inference, or premise), and participant commitments are tracked through dialogue moves with full provenance. The system produces durable artifacts: knowledge graphs that can be queried, exported, and extended; documents with citations traceable to their supporting reasoning. We describe the data model, the dialogue protocol, the evaluation semantics, and the mechanisms for cross-deliberation argument transport.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Claims](#2-claims)
3. [Arguments](#3-arguments)
4. [Attacks](#4-attacks)
5. [Dialogue Protocol](#5-dialogue-protocol)
6. [Evidence](#6-evidence)
7. [Evaluation Semantics](#7-evaluation-semantics)
8. [Progressive Formalization](#8-progressive-formalization)
9. [Artifacts](#9-artifacts)
10. [Argument Transport](#10-argument-transport)
11. [Theoretical Foundations](#11-theoretical-foundations)
12. [Implementation](#12-implementation)
13. [Applications](#13-applications)
14. [Related Work](#14-related-work)
15. [Conclusion](#15-conclusion)

---

## 1. Introduction

Institutions that depend on collective reasoning—corporations, governments, research groups, civic organizations—have adopted digital communication tools that actively undermine the structure of argument. Email threads, chat logs, and document comments produce linear text streams where claims are buried, evidence is disconnected from assertions, and challenges are lost in noise. The same debates recur because there is no mechanism to reference past reasoning. Decisions lack audit trails. Knowledge does not compound.

The problem is not a shortage of communication. The problem is that communication produces only text, and text lacks the structure required for reasoning to be verified, extended, or reused.

Consider the lifecycle of a typical organizational decision. A question arises. Discussion occurs across emails, meetings, and documents. Claims are made, challenged, sometimes supported with evidence. Eventually a decision is reached—or deferred, or forgotten. Six months later, a related question arises. The previous discussion is effectively inaccessible: buried in inboxes, scattered across platforms, represented only as unstructured prose. The organization cannot query "what arguments were considered?" or "what evidence was cited?" or "what objections were raised and how were they addressed?" The reasoning is lost. The decision is a fact without a derivation.

This pattern repeats at every scale: within teams, across departments, between organizations, in public discourse. The infrastructure for collective reasoning is missing.

What is needed is a system that represents reasoning as *structured artifacts*—graphs where nodes are claims, edges are inferential relationships, and the entire structure can be queried, analyzed, and exported. Such a system would allow any participant to trace a conclusion back to its premises, identify precisely what is contested in a dispute, and build on prior reasoning rather than repeating it.

We propose Mesh, a graph-structured argumentation system with the following properties:

1. **Claims are canonical objects** with stable identifiers, typed relationships to other claims, and links to supporting evidence.
2. **Arguments are graph structures** with explicit premises, conclusions, and inference patterns conforming to established argumentation schemes.
3. **Challenges are typed** according to what they attack: the conclusion directly (rebuttal), the inference step (undercut), or a supporting premise (undermine).
4. **Dialogue moves are recorded** with provenance, creating commitment stores that track what each participant has asserted, challenged, and conceded.
5. **Deliberations produce artifacts** that persist beyond the conversation: exportable graphs, citable documents, searchable knowledge bases.

The system implements progressive formalization: structure emerges on-demand as discourse complexity increases. A casual discussion imposes minimal overhead. A formal deliberation can upgrade to full scheme-based argument construction, typed attack tracking, and automated evaluation. The same architecture serves both.

The remainder of this paper proceeds as follows. Section 2 defines the claim model. Section 3 introduces argument structures and argumentation schemes. Section 4 formalizes the attack taxonomy. Section 5 specifies the dialogue protocol and commitment tracking. Section 6 addresses evidence integration. Section 7 presents the evaluation semantics for computing argument acceptability. Section 8 describes the progressive formalization architecture. Sections 9 and 10 cover artifact generation and cross-deliberation transport. Section 11 details theoretical foundations. Section 12 describes implementation. Section 13 presents applications. Section 14 surveys related work. Section 15 concludes.

---

## 2. Claims

We define a **claim** as a canonical assertion with a stable identifier, authorship, timestamp, and typed relationships to other objects. Unlike free text, a claim is a first-class entity that can be referenced, linked, challenged, and tracked through its lifecycle.

```
Claim {
  id: string (stable identifier)
  content: string (the assertion text)
  author: User
  created: timestamp
  evidence: Evidence[] (supporting sources)
  relations: ClaimEdge[] (typed connections to other claims)
  status: active | retracted | superseded
}
```

Claims exist in relationship to other claims through **ClaimEdges**, which are typed according to the nature of the relationship:

| Edge Type | Semantics |
|-----------|-----------|
| SUPPORTS | Source claim provides evidence or reasoning for target |
| OPPOSES | Source claim contradicts or challenges target |
| QUALIFIES | Source claim adds conditions or limitations to target |
| GENERALIZES | Source claim abstracts from target |
| SPECIALIZES | Source claim is a specific instance of target |
| PRESUPPOSES | Source claim assumes target as background |

The graph of claims and edges forms the **claim network** for a deliberation. Any claim can be traced to its supporting evidence, its relationship to other claims, and its position in ongoing disputes.

### 2.1 Claim Lifecycle

Claims are not static. They have a lifecycle that reflects their status in ongoing deliberation:

| Status | Description |
|--------|-------------|
| DRAFT | Claim under construction, not yet publicly asserted |
| ACTIVE | Claim publicly asserted and available for reference |
| CHALLENGED | Claim has been questioned; justification demanded |
| DEFENDED | Challenged claim has been supported with argument |
| RETRACTED | Claim withdrawn by its author |
| SUPERSEDED | Claim replaced by a refined or corrected version |
| ACCEPTED | Claim conceded by relevant parties |

Status transitions are triggered by dialogue moves (Section 5). The system maintains the complete history of status changes with timestamps and actors.

### 2.2 Claim Identity and Versioning

Claims require stable identity for reference across time and context. Each claim receives a unique identifier at creation that persists regardless of subsequent edits. When a claim's content is modified, the system creates a new version linked to the original:

```
ClaimVersion {
  id: string
  claimId: string (stable identifier across versions)
  version: integer
  content: string
  created: timestamp
  author: User
  changeNote: string (description of modification)
  supersedes: ClaimVersion | null
}
```

This versioning ensures that references to claims remain valid even as claims are refined. An argument citing Claim X continues to cite Claim X even if X is later updated; the system can surface when cited claims have changed.

The problem, of course, is that claims alone do not constitute arguments. A claim may be true or false, but an *argument* is a structured justification: premises lead to a conclusion through an inference pattern. To represent reasoning, we need a richer structure.

---

## 3. Arguments

We define an **argument** as a graph structure consisting of:

1. **Premises**: One or more claims that serve as starting points
2. **Conclusion**: A claim that the argument supports
3. **Inference**: The reasoning pattern connecting premises to conclusion
4. **Scheme**: The argumentation pattern the argument instantiates

```
Argument {
  id: string
  premises: Claim[]
  conclusion: Claim
  inference: Inference
  scheme: ArgumentationScheme
  criticalQuestions: CriticalQuestion[]
  confidence: number (0-1)
}
```

The **inference** is itself a first-class object representing the reasoning step. This is critical: attacks can target not only the conclusion (rebuttal) or the premises (undermine), but the inference itself (undercut). By making inference explicit, we enable precise characterization of disputes.

### 3.1 Argumentation Schemes

Arguments are constructed using **argumentation schemes**—established patterns of defeasible reasoning catalogued in the argumentation theory literature [1]. Each scheme has a characteristic form and a set of **critical questions** that, if unanswered, defeat the argument.

Examples:

**Argument from Expert Opinion**
- Premise: E is an expert in domain D
- Premise: E asserts that P
- Premise: P is within domain D
- Conclusion: P is plausible

Critical Questions:
1. Is E a genuine expert in D?
2. Is P actually within D?
3. Is E's opinion consistent with other experts?
4. Is E biased?

**Argument from Analogy**
- Premise: Case C1 has property P
- Premise: Case C2 is similar to C1 in relevant respects
- Conclusion: C2 has property P

Critical Questions:
1. Are there relevant differences between C1 and C2?
2. Is the similarity sufficient to support the inference?
3. Are there other cases that suggest the opposite conclusion?

The system implements 60+ schemes from the Walton taxonomy [1], automatically surfacing critical questions when an argument is constructed. Unanswered critical questions represent potential attack vectors.

### 3.2 Scheme Categories

The Walton taxonomy organizes schemes into categories based on the nature of the inference:

| Category | Description | Example Schemes |
|----------|-------------|-----------------|
| **Source-Based** | Inferences from testimony, authority, or witness | Expert Opinion, Witness Testimony, Position to Know |
| **Causal** | Inferences involving cause and effect | Cause to Effect, Effect to Cause, Correlation to Cause |
| **Practical** | Inferences about action and goals | Practical Reasoning, Negative Consequences, Waste |
| **Analogical** | Inferences from similarity | Analogy, Precedent, Example |
| **Classification** | Inferences from category membership | Verbal Classification, Definition, Vagueness |
| **Evaluative** | Inferences about values and preferences | Values, Commitment, Popular Opinion |
| **Defeasibility** | Inferences about exceptions and defaults | Ignorance, Established Rule, Exception |

Each scheme has a formal structure specifying required premises, conclusion form, and the complete set of critical questions. The system validates that arguments instantiating a scheme provide all required premises and flags when critical questions are relevant but unanswered.

### 3.3 Argument Chains

Individual arguments can be composed into **argument chains**—directed acyclic graphs where the conclusion of one argument serves as a premise for another. Chains can be:

| Chain Type | Structure | Description |
|------------|-----------|-------------|
| SERIAL | A → B → C | Linear dependency; each step requires the previous |
| CONVERGENT | A → C, B → C | Multiple independent premises support one conclusion |
| DIVERGENT | A → B, A → C | One premise supports multiple conclusions |
| LINKED | (A ∧ B) → C | Premises jointly required; neither sufficient alone |
| HYBRID | Combination | Real-world arguments often mix patterns |

```
ArgumentChain {
  id: string
  nodes: ChainNode[]
  edges: ChainEdge[]
  rootNodes: ChainNode[] (premises with no predecessors)
  terminalNodes: ChainNode[] (conclusions with no successors)
  chainType: ChainType
}

ChainNode {
  id: string
  argument: Argument | null
  claim: Claim
  position: { x: number, y: number }
  dialecticalRole: THESIS | ANTITHESIS | SYNTHESIS | LEMMA | AXIOM
}

ChainEdge {
  source: ChainNode
  target: ChainNode
  type: SUPPORTS | ENABLES | PRESUPPOSES | ATTACKS
  strength: number (0-1)
}
```

### 3.4 Chain Analysis

Chain analysis enables identification of structural properties:

**Critical Path**: The longest path from root to terminal. Arguments on the critical path, if defeated, maximally impact the conclusion.

**Vulnerability Assessment**: Nodes with single incoming edges are vulnerable—defeat of that one supporter defeats the node. Nodes with multiple supporters are resilient.

**Cycle Detection**: Circular dependencies are identified and flagged. While not inherently invalid (mutual support exists), cycles require special handling in evaluation.

**Dialectical Role Assignment**: Nodes are classified by their function in the overall argument structure:

| Role | Definition |
|------|------------|
| THESIS | Primary claim being argued for |
| ANTITHESIS | Opposing claim or counter-argument |
| SYNTHESIS | Resolution integrating thesis and antithesis |
| LEMMA | Intermediate claim supporting the main argument |
| AXIOM | Assumed premise not requiring further justification |

Chain analysis enables participants to understand argument structure at a glance: where is the disagreement? What are the critical dependencies? What would it take to change the conclusion?

---

## 4. Attacks

We define three types of **attack** corresponding to the three components of an argument:

```
Attack {
  type: REBUT | UNDERCUT | UNDERMINE
  source: Argument | Claim
  target: Argument | Claim | Inference
}
```

**Rebuttal** attacks the conclusion directly. The attacking argument concludes the negation (or contrary) of the target conclusion. Both arguments may be valid given their premises; the conflict is in what they conclude.

**Undercutting** attacks the inference step. The attacker does not deny the premises or the conclusion, but argues that the premises do not actually support the conclusion in this case. For example: attacking an argument from expert opinion by noting the expert has a conflict of interest. The expert's credentials and assertion are not denied; the inference from assertion to plausibility is blocked.

**Undermining** attacks a premise. The attacker argues that one of the premises is false or unsupported, thereby removing the foundation of the argument.

This three-way distinction is essential for tracking what is actually contested in a dispute. Two parties may agree on premises but disagree about inference. Two parties may agree on the reasoning pattern but disagree about the facts. Collapsing these into undifferentiated "disagreement" loses information critical for resolution.

### 4.1 Attack Semantics

Each attack type has distinct semantics for how it affects the target:

**Rebuttal semantics**: If argument A rebuts argument B, and both are otherwise acceptable, they are in symmetric conflict. Resolution requires preference ordering (Section 7.1) or additional arguments that break the symmetry.

**Undercut semantics**: If argument A undercuts argument B, A blocks the inference of B without denying B's premises or claiming the opposite conclusion. This is asymmetric: B cannot "counter-undercut" by denying A's premises, because A's attack does not depend on establishing the opposite conclusion.

**Undermine semantics**: If argument A undermines premise P of argument B, then B's support for its conclusion is weakened or removed. If P was B's only support for a key premise, B is defeated. If B has alternative support, B may remain defensible.

The precision of attack typing enables the system to compute exactly what would resolve a dispute. A rebuttal requires evidence for one side or preference ordering. An undercut requires defense of the inference. An undermine requires alternative support for the attacked premise.

### 4.2 Attack Graphs

The **attack graph** for a deliberation is the directed graph where nodes are arguments and edges are attack relations. Formally:

```
AttackGraph = (Args, Attacks)
where
  Args = { A₁, A₂, ..., Aₙ }
  Attacks ⊆ Args × Args × AttackType
```

This graph is the input to evaluation semantics (Section 7). The structure of the attack graph—which arguments attack which, and via what attack type—determines which arguments are ultimately defensible.

### 4.3 Critical Questions as Attack Generators

A key integration point: **critical questions** from argumentation schemes (Section 3.1) can be instantiated as attacks. When an argument instantiates a scheme, the system knows its critical questions. If an opposing party raises one of these questions and provides supporting content, the system can generate the appropriate attack:

| Critical Question | Attack Type Generated |
|-------------------|----------------------|
| "Is the expert really qualified?" | UNDERMINE (attacks expertise premise) |
| "Does the expert have bias?" | UNDERCUT (attacks inference from testimony) |
| "Is the conclusion actually false?" | REBUT (attacks conclusion directly) |

This bridges informal questioning and formal attack structure. A natural-language challenge ("But is she really an expert in *this* area?") maps to a precise structural attack (undermine the expertise premise of an Argument from Expert Opinion).

---

## 5. Dialogue Protocol

We define a **dialogue** as a sequence of **moves** by participants, where each move has a type, a target, and provenance. The move vocabulary is adapted from dialogue game theory [2]:

| Move Type | Effect |
|-----------|--------|
| ASSERT | Adds a claim to speaker's commitment store |
| CHALLENGE | Demands justification for a claim |
| GROUNDS | Provides argument supporting a challenged claim |
| RETRACT | Removes a claim from speaker's commitment store |
| CONCEDE | Accepts opponent's claim into own commitment store |
| SUPPOSE | Hypothetically assumes a claim (scoped commitment) |

Every move is recorded with timestamp, author, and target reference:

```
DialogueMove {
  id: string
  type: MoveType
  author: User
  target: Claim | Argument | DialogueMove
  content: string (optional elaboration)
  timestamp: timestamp
  branch: DialogueBranch (for parallel discussions)
}
```

### 5.1 Commitment Stores

Each participant in a dialogue has a **commitment store**—the set of claims they have publicly committed to through their moves. Commitment stores are derived from dialogue history:

- ASSERT adds to commitment store
- RETRACT removes from commitment store
- CONCEDE adds opponent's claim to own store

Commitment stores enable consistency checking: if a participant's assertions imply a contradiction, this can be surfaced. They also provide a clear record of each participant's position at any point in the dialogue.

### 5.2 Dialogue Branches

Dialogues can branch into parallel threads (e.g., when a challenge leads to a sub-discussion). Branches are tracked explicitly, with merge semantics defined for when sub-discussions resolve.

```
DialogueBranch {
  id: string
  parentBranch: DialogueBranch | null
  rootMove: DialogueMove (the move that spawned this branch)
  status: ACTIVE | RESOLVED | ABANDONED
  resolution: ACCEPTED | REJECTED | MERGED | null
}
```

Branches enable focused sub-debates without losing the larger context. When a branch resolves, its conclusion propagates back to the parent: if the sub-debate concluded that a premise was false, that result affects the parent argument.

### 5.3 Dialogue Types

The system supports multiple dialogue types, following the Walton-Krabbe typology [2]:

| Dialogue Type | Goal | Characteristic Moves |
|---------------|------|---------------------|
| PERSUASION | Resolve disagreement | ASSERT, CHALLENGE, GROUNDS |
| INQUIRY | Establish truth collectively | CONJECTURE, VERIFY, CONCLUDE |
| NEGOTIATION | Reach mutually acceptable agreement | OFFER, COUNTER, ACCEPT |
| INFORMATION-SEEKING | Transfer knowledge | QUESTION, ANSWER, CLARIFY |
| DELIBERATION | Decide on action | PROPOSE, EVALUATE, COMMIT |
| ERISTIC | Win the exchange | (Discouraged; tracked for detection) |

Each dialogue type has characteristic move sequences and success conditions. The system can detect when a dialogue shifts types (e.g., from inquiry to persuasion when a factual question becomes contested) and surface this to participants.

### 5.4 Formal Dialogue Rules

Dialogues can operate under explicit rule sets that constrain legal moves. The system supports rule definition:

```
DialogueRule {
  id: string
  name: string
  trigger: MovePattern (when does this rule apply)
  constraint: MoveConstraint (what is required/forbidden)
  consequence: Consequence (what happens on violation)
}
```

Example rules:

- **Burden of Proof**: After CHALLENGE, the challenged party must GROUNDS or RETRACT within n moves.
- **No Repetition**: A move identical to a previous move by the same party is flagged.
- **Relevance**: Moves must target existing claims/arguments in the dialogue tree.
- **Consistency**: ASSERT of a claim contradicting a claim in one's commitment store is flagged.

Rule enforcement can be advisory (flag violations) or strict (prevent illegal moves). This enables deliberations to adopt formal protocols when rigor is required.

---

## 6. Evidence

We define **evidence** as externally-sourced material that supports claims. Evidence objects have:

```
Evidence {
  id: string
  type: DOCUMENT | URL | CITATION | MEDIA | DATA
  source: string (URL, DOI, file reference)
  excerpt: string (relevant portion)
  metadata: object (author, date, publication, etc.)
  claims: Claim[] (claims this evidence supports)
}
```

Evidence creates the link between argumentation and external sources. When a claim references evidence, the connection is explicit and verifiable. When evidence is disputed, all claims depending on it are affected.

### 6.1 Evidence Confidence

Evidence can be assigned confidence values based on source reliability, corroboration, and recency. These confidence values propagate through the argument graph:

```
confidence(argument) = f(confidence(premises), confidence(inference), confidence(evidence))
```

The system supports multiple confidence aggregation modes:

| Mode | Aggregation | Use Case |
|------|-------------|----------|
| PRODUCT | Multiply path confidences | Conservative; long chains decay quickly |
| MINIMUM | Take minimum confidence in chain | Bottleneck model; weakest link dominates |
| DEMPSTER-SHAFER | Belief intervals with uncertainty | Explicit uncertainty representation |
| WEIGHTED | Weighted average by support count | Accrual of multiple weak supports |

### 6.2 Evidence Types

The system distinguishes evidence types with different reliability profiles:

| Type | Description | Reliability Considerations |
|------|-------------|---------------------------|
| PRIMARY_SOURCE | Direct documents, data, records | Authenticity, completeness, context |
| SECONDARY_SOURCE | Reports, analyses, summaries of primary | Accuracy of representation, bias |
| EXPERT_TESTIMONY | Statements by domain experts | Expertise scope, independence, consensus |
| EMPIRICAL_DATA | Quantitative measurements, experiments | Methodology, sample size, reproducibility |
| STATISTICAL | Aggregate patterns, correlations | Confounders, base rates, interpretation |
| ANECDOTAL | Individual cases, examples | Representativeness, cherry-picking |

Evidence type affects how confidence is assigned and how challenges are structured. Challenging empirical data requires methodological critique; challenging expert testimony requires credibility or scope attack.

### 6.3 Evidence Provenance

Evidence objects maintain full provenance:

```
EvidenceProvenance {
  originalSource: string (URL, DOI, archive reference)
  retrievedAt: timestamp
  retrievedBy: User
  archiveLocation: string (local copy or snapshot)
  verificationStatus: UNVERIFIED | VERIFIED | DISPUTED
  verifiers: User[]
}
```

This provenance chain ensures that evidence can be re-verified. If a URL dies or content changes, the system can surface this to users who relied on that evidence.

---

## 7. Evaluation Semantics

Given an attack graph, we compute the **acceptability status** of each argument using formal semantics from abstract argumentation theory [3].

An **extension** is a set of arguments that is:
1. **Conflict-free**: No argument in the set attacks another in the set
2. **Admissible**: Every argument in the set is defended against all attackers

The **grounded extension** is the unique minimal admissible set, computed by iterative fixpoint:

```
F(S) = { A : A is acceptable w.r.t. S }
where A is acceptable w.r.t. S iff every attacker of A is attacked by some member of S

grounded = lfp(F) starting from ∅
```

Arguments are classified:

| Status | Definition |
|--------|------------|
| IN | Argument is in the grounded extension |
| OUT | Argument is attacked by an IN argument |
| UNDECIDED | Argument is neither IN nor OUT |

This evaluation enables automated identification of which arguments are defensible given the current state of the debate.

### 7.1 Preference Ordering

When conflicts cannot be resolved by attack structure alone, **preference orderings** can be introduced:

- Premise ordering: Some premises are more certain than others
- Inference ordering: Some schemes are stronger than others
- Source ordering: Some evidence is more reliable than others

These orderings are implemented via the ASPIC+ framework [4], which provides a systematic account of how preferences translate into defeat relations.

### 7.2 Multiple Extension Semantics

The grounded semantics (Section 7) provides a unique, skeptical extension. The system also supports alternative semantics for different reasoning needs:

| Semantics | Definition | Use Case |
|-----------|------------|----------|
| GROUNDED | Minimal complete extension | Skeptical reasoning; only clearly justified conclusions |
| PREFERRED | Maximal admissible extensions | Credulous reasoning; what *could* be justified |
| STABLE | Complete, conflict-free extensions | Classical logic compatibility |
| SEMI-STABLE | Preferred extensions minimizing undecided | Balance skepticism and coverage |
| IDEAL | Intersection of preferred extensions | Moderate skepticism |

Different semantics suit different contexts. Legal reasoning may prefer grounded (burden of proof). Exploratory deliberation may prefer preferred (what positions are tenable). The system computes all relevant extensions and allows selection by context.

### 7.3 Extension Visualization

Extensions are visualized in the argument graph with status coloring:

- **Green (IN)**: Argument is in the extension; justified
- **Red (OUT)**: Argument is defeated; not justified
- **Yellow (UNDECIDED)**: Argument status cannot be determined

Users can explore how changing attacks or adding arguments would alter the extension. This "what-if" analysis supports understanding of argument dynamics.

### 7.4 Rationality Postulates

The evaluation semantics satisfy key rationality postulates from the argumentation literature [4]:

| Postulate | Description |
|-----------|-------------|
| SUB-ARGUMENT CLOSURE | If A is justified, all sub-arguments of A are justified |
| CLOSURE UNDER STRICT RULES | Conclusions of strict rules with justified premises are justified |
| DIRECT CONSISTENCY | Justified conclusions do not directly contradict each other |
| INDIRECT CONSISTENCY | Closure of justified conclusions under strict rules is consistent |
| NON-INTERFERENCE | Unrelated arguments do not affect each other's status |

The system can verify that a given argument graph and evaluation satisfy these postulates, flagging anomalies for review.

---

## 8. Progressive Formalization

The system implements **progressive formalization**: structure is imposed only as needed. This is achieved through a layered architecture:

```
Layer 0: Discussion
  - Free-form messages
  - No explicit structure required
  
Layer 1: Structured Claims  
  - Claims extracted from discussion
  - Evidence linked
  - Basic relations (supports/opposes)

Layer 2: Scheme-Based Arguments
  - Formal argument construction
  - Scheme identification
  - Critical questions surfaced

Layer 3: Full Theory Evaluation
  - Attack graph construction
  - Extension computation
  - Preference ordering
```

Participants can operate at any layer. A casual comment remains at Layer 0. Extracting a claim from that comment elevates it to Layer 1. Constructing a formal argument around that claim elevates it to Layer 2. The same infrastructure supports all levels.

This design avoids the dichotomy between usability (unstructured tools) and rigor (formal methods). Structure emerges where value justifies overhead.

### 8.1 Formalization Triggers

The system can suggest formalization when certain patterns are detected:

| Pattern | Suggested Formalization |
|---------|------------------------|
| Repeated claims with slight variations | Extract canonical claim |
| Implicit disagreement across messages | Create explicit opposition edge |
| Claim with multiple cited sources | Link evidence objects |
| "Because X, therefore Y" | Construct argument structure |
| Dispute over inference validity | Identify scheme, surface critical questions |
| Complex multi-party disagreement | Generate attack graph, compute extensions |

These triggers are advisory. Users can ignore them if formalization is not warranted. But when complexity grows, the system offers paths to structure.

### 8.2 Upgrade Paths

Artifacts can be upgraded across formalization layers:

- **Message → Claim**: Extract assertion from conversational message
- **Claim → Argument**: Identify premises, add conclusion, assign scheme
- **Argument → Chain**: Compose multiple arguments into structured graph
- **Chain → Theory**: Add attack relations, compute extensions

Each upgrade preserves provenance. An argument remembers the message it emerged from. A formal theory remembers the informal discussion that motivated it.

### 8.3 Downgrade Paths

Formalization can also be relaxed:

- **Argument → Claim**: Collapse structured argument to summary claim
- **Chain → Narrative**: Export chain as linear prose document
- **Theory → Summary**: Generate natural-language summary of justified conclusions

This bidirectionality ensures that formal structures remain useful for communication, not just analysis.

---

## 9. Artifacts

Deliberations produce **artifacts** that persist beyond the conversation:

**Thesis Documents**: Narrative summaries with inline citations to supporting arguments. Every claim in a thesis links to its justification in the argument graph.

**Knowledge Base Pages**: Wiki-style pages synthesizing conclusions from multiple deliberations. Pages can reference claims and arguments from their source deliberations.

**Exportable Graphs**: The full argument graph can be exported in standard formats (AIF-RDF, JSON-LD) for analysis in external tools.

**Debate Sheets**: Tabular views showing claims, confidence scores, and attack/support relationships.

Artifacts create institutional memory: what an organization figured out in one deliberation is available to future deliberations.

### 9.1 Thesis Documents

Thesis documents are narrative summaries with deep integration to the argument graph:

```
ThesisDocument {
  id: string
  title: string
  sections: ThesisSection[]
  deliberation: Deliberation
  authors: User[]
  status: DRAFT | PUBLISHED | ARCHIVED
}

ThesisSection {
  heading: string
  content: RichText
  citations: ThesisCitation[]
}

ThesisCitation {
  target: Claim | Argument | Evidence
  context: string (surrounding text)
  citationType: SUPPORTS | ACKNOWLEDGES | REBUTS
}
```

Every assertion in a thesis can link to its backing in the deliberation. Readers can click through to see the full argument structure. When cited arguments are later defeated, the thesis can flag affected sections.

### 9.2 Knowledge Base Pages

Knowledge base pages synthesize conclusions across deliberations:

```
KBPage {
  id: string
  title: string
  content: RichText
  claims: Claim[] (canonical claims this page establishes)
  sourceDeliberations: Deliberation[]
  lastUpdated: timestamp
  maintainers: User[]
}
```

Pages represent organizational knowledge: "What do we believe about X?" The answer is not a static document but a living synthesis linked to supporting reasoning. When new deliberations affect the topic, pages can be updated with provenance.

### 9.3 Exportable Graphs

The full argument graph can be exported in standard formats:

| Format | Standard | Use Case |
|--------|----------|----------|
| AIF-RDF | Argument Interchange Format [5] | Interoperability with academic tools |
| JSON-LD | Linked Data | Web integration, search indexing |
| GraphML | Graph Markup Language | Visualization in external tools |
| DOT | Graphviz | Diagrams and publication figures |

Export enables analysis beyond the platform: network analysis, machine learning on argument structures, integration with other systems.

### 9.4 Debate Sheets

Debate sheets provide tabular views optimized for scanning:

| Claim | Status | Support | Opposition | Confidence |
|-------|--------|---------|------------|------------|
| "X should be done" | DEFENDED | 3 args | 1 rebuttal | 0.72 |
| "Y is true" | CHALLENGED | 1 arg | 2 undercuts | 0.34 |

Debate sheets enable quick assessment of deliberation state: what is contested, what is resolved, what needs attention.

---

## 10. Argument Transport

Arguments can be **transported** between deliberations. When an argument from Deliberation A is relevant to Deliberation B, it can be imported with provenance preserved:

```
TransportedArgument {
  original: Argument
  source: Deliberation
  importedTo: Deliberation
  transformer: User
  transformations: Transform[] (any adaptations made)
}
```

Transport creates a network of deliberations (the **Plexus**) where reasoning compounds across organizational boundaries. An argument established in one context can be referenced, extended, or challenged in another.

### 10.1 Cross-Reference Types

| Edge Type | Semantics |
|-----------|-----------|
| IMPORTS | Deliberation B imports argument from A |
| XREF | Deliberation B references claim from A |
| OVERLAP | Deliberations share common claims |
| EXTENDS | Deliberation B continues reasoning from A |

### 10.2 Transport Semantics

When an argument is transported, questions arise about its status in the new context:

1. **Do the premises hold?** An argument's premises may be established in Deliberation A but contested in Deliberation B. The transported argument inherits only its structure, not its acceptability.

2. **Are the attacks relevant?** Attacks from Deliberation A may not apply in Deliberation B (different scope) or may apply with modifications.

3. **Does the scheme apply?** An argument from expert opinion may be strong in a technical context but weak in a policy context where expertise is contested.

The system tracks transported arguments distinctly, allowing participants in the target deliberation to accept, challenge, or adapt them:

```
TransportStatus {
  argument: TransportedArgument
  inTargetDeliberation: Deliberation
  status: PENDING_REVIEW | ACCEPTED | ADAPTED | REJECTED
  localAttacks: Attack[] (attacks added in target context)
  adaptations: Adaptation[] (modifications for new context)
}
```

### 10.3 The Plexus

The network of deliberations and their cross-references forms the **Plexus**—a meta-graph where nodes are deliberations and edges are transport/reference relations.

```
Plexus {
  deliberations: Deliberation[]
  edges: PlexusEdge[]
}

PlexusEdge {
  source: Deliberation
  target: Deliberation
  type: IMPORTS | XREF | OVERLAP | EXTENDS
  weight: number (strength of connection)
  arguments: Argument[] (arguments involved in this connection)
}
```

The Plexus enables:

- **Discovery**: Finding related deliberations when starting a new one
- **Reuse**: Importing established arguments rather than reconstructing them
- **Consistency**: Detecting when deliberations reach conflicting conclusions
- **Analysis**: Understanding how reasoning propagates across organizational units

---

## 11. Theoretical Foundations

The system is grounded in established theoretical frameworks from argumentation theory, dialogue logic, and proof theory.

### 11.1 Abstract Argumentation Frameworks (Dung)

The evaluation semantics (Section 7) are based on Dung's abstract argumentation frameworks [3]. An abstract argumentation framework is a pair $(Args, Attacks)$ where $Args$ is a set of arguments and $Attacks \subseteq Args \times Args$ is a binary attack relation.

The key insight is that argument acceptability can be computed from attack structure alone, without examining argument content. This enables formal evaluation of any argument graph regardless of domain.

The grounded extension is computed as the least fixed point of the characteristic function $F$:

$$F(S) = \{ A \in Args : \forall B((B, A) \in Attacks \rightarrow \exists C \in S((C, B) \in Attacks)) \}$$

Starting from $S_0 = \emptyset$, iterate $S_{i+1} = F(S_i)$ until fixpoint. The result is the grounded extension: the set of arguments defensible from first principles.

### 11.2 ASPIC+ Framework

ASPIC+ [4] extends abstract argumentation with structured arguments. It provides:

- **Language**: Propositional or first-order language for claim content
- **Rules**: Strict rules (deductive, cannot be attacked) and defeasible rules (can be attacked)
- **Contrariness**: Specification of which claims contradict which
- **Preferences**: Orderings on rules and premises

The system implements ASPIC+ components:

```
ASPICTheory {
  language: Formula[]
  strictRules: StrictRule[]
  defeasibleRules: DefeasibleRule[]
  contraries: Map<Formula, Formula[]>
  rulePreference: PartialOrder<Rule>
  premisePreference: PartialOrder<Formula>
}
```

ASPIC+ is important because it explains *why* attacks succeed or fail. A rebuttal succeeds if the attacking argument is preferred. An undercut succeeds if the defeasible rule is weaker than the attack. Preferences are not arbitrary but grounded in rule and premise quality.

### 11.3 Walton Argumentation Schemes

Argumentation schemes [1] provide the content-level structure. While Dung and ASPIC+ are content-agnostic (they work with abstract arguments), schemes capture patterns of *good* reasoning:

- Schemes encode defeasible inference patterns accepted across domains
- Critical questions identify the ways a scheme instance can fail
- Scheme identification enables automated analysis and assistance

The 60+ Walton schemes are implemented as templates with:

```
ArgumentationScheme {
  id: string
  name: string
  category: SchemeCategory
  premises: PremiseTemplate[]
  conclusion: ConclusionTemplate
  criticalQuestions: CriticalQuestion[]
  defeasibilityConditions: string[]
}
```

### 11.4 Dialogue Game Theory

The dialogue protocol (Section 5) is grounded in dialogue game theory [2]. Dialogues are modeled as games with:

- **Players**: Participants with roles (Proponent, Opponent, etc.)
- **Moves**: Typed speech acts with targets
- **Rules**: Constraints on legal move sequences
- **Commitment Stores**: Public record of each player's assertions
- **Win Conditions**: What constitutes successful dialogue completion

The Walton-Krabbe typology (persuasion, inquiry, negotiation, etc.) provides the framework for dialogue classification. Each type has characteristic move patterns and success conditions.

### 11.5 Ludics (Girard)

For advanced proof-theoretic semantics, the system integrates concepts from Girard's Ludics [6]:

- **Loci**: Positions in a proof structure where interaction occurs
- **Designs**: Strategies for interaction at loci
- **Orthogonality**: When two designs successfully interact (one "proves" and one "tests")
- **Polarity**: Positive (active, asserting) vs. negative (reactive, challenging)

Ludics provides a game-semantic foundation for understanding dialogue as interactive proof. A claim is justified not by static evidence but by surviving all challenges—a game-theoretic notion of truth.

### 11.6 Categorical Semantics

The system's mathematical foundation includes categorical structure [7]:

- **Objects**: Claims/Propositions
- **Morphisms**: Arguments (maps from premises to conclusions)
- **Composition**: Argument chaining (if A→B and B→C, then A→C)
- **Hom-sets**: Sets of arguments between two claims, forming join-semilattices (multiple arguments can support the same conclusion)
- **Monoidal structure**: Conjunction of premises (tensor product)

This categorical view enables:

- **Functorial transport**: Arguments between deliberations as functors preserving structure
- **Confidence measures**: Morphisms from argument graphs to confidence monoids
- **Compositionality**: Complex arguments built from simple components with well-defined semantics

---

## 11. Implementation

The system is implemented as a web application with:

- **Frontend**: React/TypeScript with graph visualization (ReactFlow)
- **Backend**: Node.js with PostgreSQL (Prisma ORM)
- **Real-time**: Supabase for presence and live updates
- **Caching**: Redis for commitment stores and hot data
- **Export**: AIF-compliant JSON-LD and RDF

The data model maps directly to the formal structures described above. API routes provide CRUD operations for all entities plus specialized endpoints for graph analysis, extension computation, and artifact generation.

### 12.1 Data Model

The implementation uses PostgreSQL with Prisma ORM. Key entities map to formal concepts:

| Formal Concept | Database Entity |
|----------------|-----------------|
| Claim | `Claim` table |
| ClaimEdge | `ClaimEdge` table with typed relation |
| Argument | `Argument` with `ArgumentPremise`, `Inference` |
| Attack | `Attack` table or `ClaimEdge` with OPPOSES type |
| DialogueMove | `DialogueMove` table |
| Commitment | `Commitment` table (derived from moves) |
| Evidence | `Evidence` with `EvidenceSource` |
| ArgumentChain | `ArgumentChain`, `ArgumentChainNode`, `ArgumentChainEdge` |
| Deliberation | `Deliberation` container |

### 12.2 API Architecture

The API follows REST principles with specialized endpoints:

```
/api/deliberations/[id]
  GET    - Fetch deliberation with claims, arguments
  POST   - Create new deliberation
  
/api/claims/[id]
  GET    - Fetch claim with relations
  POST   - Create claim
  PATCH  - Update claim (creates version)
  
/api/arguments/[id]
  GET    - Fetch argument with premises, scheme
  POST   - Create argument
  
/api/arguments/[id]/attacks
  GET    - Fetch attacks on this argument
  POST   - Create attack
  
/api/dialogue/[deliberationId]/moves
  GET    - Fetch dialogue history
  POST   - Record new move
  
/api/aspic/evaluate
  POST   - Compute extensions for argument graph
  
/api/export/[deliberationId]
  GET    - Export in specified format (AIF, JSON-LD, etc.)
```

### 12.3 Real-Time Synchronization

Deliberations are collaborative and real-time. The system uses Supabase for:

- **Presence**: Who is currently viewing/editing
- **Live updates**: New claims, arguments, moves broadcast to all participants
- **Conflict resolution**: Optimistic updates with server reconciliation

### 12.4 Performance Considerations

Argument graphs can grow large. The system addresses performance through:

- **Pagination**: Large claim/argument lists are paginated
- **Lazy loading**: Argument chains load incrementally
- **Caching**: Redis caches commitment stores, extension computations
- **Incremental evaluation**: When a single argument changes, recompute only affected portions of extension

---

## 13. Applications

The system supports diverse use cases across domains.

### 13.1 Organizational Decision-Making

Teams making complex decisions benefit from:

- **Audit trails**: Every decision traceable to its reasoning
- **Institutional memory**: Past deliberations searchable and citable
- **Handoff continuity**: New team members can review structured reasoning, not just conclusions

### 13.2 Policy Development

Policy processes require:

- **Stakeholder transparency**: Reasoning visible to affected parties
- **Comment integration**: Public input structured and addressed systematically
- **Defensibility**: Decisions linked to explicit justification

### 13.3 Research Collaboration

Research teams can:

- **Structure literature review**: Map claims across papers with support/opposition
- **Identify gaps**: See which claims lack supporting arguments
- **Collaborate across distance**: Asynchronous argument construction with clear structure

### 13.4 Legal Analysis

Legal reasoning involves:

- **Precedent mapping**: Cases linked to the principles they establish
- **Argument construction**: Legal arguments structured with scheme identification
- **Counter-argument preparation**: Systematic exploration of opposition

### 13.5 Education

Learning environments benefit from:

- **Argument skill development**: Students practice structured reasoning
- **Peer review**: Arguments evaluated against scheme criteria
- **Collaborative inquiry**: Classes investigate questions together with visible structure

### 13.6 Civic Deliberation

Public discourse can be elevated through:

- **Claim canonicalization**: Reduce repetition, surface shared concerns
- **Evidence linking**: Connect assertions to supporting sources
- **Disagreement mapping**: See exactly what is contested and why

---

## 14. Related Work

### 14.1 Argumentation Systems

Prior argumentation systems include:

- **IBIS/gIBIS** [8]: Issue-Based Information Systems for design rationale
- **Compendium**: Hypermedia tool for collaborative argumentation
- **Araucaria/OVA**: Tools for argument diagramming and analysis
- **Rationale**: Educational argument mapping software
- **Kialo**: Web-based debate platform with pro/con structure

Mesh extends this tradition with: (1) formal scheme integration, (2) typed attack taxonomy, (3) dialogue protocol enforcement, (4) cross-deliberation transport, and (5) progressive formalization architecture.

### 14.2 Argument Mining

NLP research on argument mining focuses on:

- Claim detection in text
- Argument structure extraction
- Stance classification

Mesh can integrate argument mining as an input pipeline: extracted arguments feed into the structured system for human verification and elaboration.

### 14.3 Deliberation Platforms

Platforms for collective deliberation include:

- **Pol.is**: Clustering for opinion mapping
- **Consider.it**: Pro/con with stakeholder perspectives
- **Loomio**: Cooperative decision-making
- **Decidim**: Participatory democracy platform

These focus on preference aggregation or simple pro/con structure. Mesh provides deeper argument structure for cases where reasoning quality matters, not just preference counts.

### 14.4 Knowledge Graphs

Knowledge graph systems (Wikidata, Google Knowledge Graph) focus on entity relationships. Mesh complements this by representing *reasoning about* entities: not just "X is related to Y" but "X is claimed because Y, challenged by Z."

---

## 15. Conclusion

We have described a system that transforms collective discourse from ephemeral text into structured, analyzable, durable reasoning artifacts. The key insight is that arguments have structure—premises, inferences, conclusions, attacks—and that representing this structure explicitly enables capabilities impossible with flat text: tracing conclusions to evidence, typing disagreements precisely, evaluating argument status formally, composing reasoning across contexts.

The progressive formalization architecture ensures that this structure does not impose premature overhead: participants encounter formality only when complexity warrants it. The same system supports casual discussion and rigorous deliberation.

The theoretical grounding in Dung's abstract argumentation, ASPIC+ structured argumentation, Walton's argumentation schemes, and dialogue game theory provides principled foundations for system behavior. These are not arbitrary design choices but implementations of established frameworks with known properties.

The result is reasoning infrastructure: the foundational layer that enables collective intelligence to compound rather than dissipate. As institutions face increasingly complex decisions requiring input from diverse stakeholders, the need for such infrastructure becomes acute. Mesh provides a path from the current state—communication tools that produce only text—to a future where collective reasoning produces durable, verifiable, composable artifacts.

The system is operational. The architecture is extensible. The theoretical foundations are established. What remains is the ongoing work of refinement through use: discovering which formalizations provide value in which contexts, how progressive structure can be surfaced without overwhelming users, and how cross-deliberation transport can create networks of reasoning that span organizational boundaries.

This is infrastructure work. Like roads and utilities, reasoning infrastructure is most successful when invisible—when users accomplish their goals without thinking about the underlying structure. The measure of success is not whether users understand argumentation theory, but whether their collective decisions improve.

---

## References

[1] Walton, D., Reed, C., & Macagno, F. (2008). *Argumentation Schemes*. Cambridge University Press.

[2] Walton, D. N., & Krabbe, E. C. (1995). *Commitment in Dialogue: Basic Concepts of Interpersonal Reasoning*. SUNY Press.

[3] Dung, P. M. (1995). On the acceptability of arguments and its fundamental role in nonmonotonic reasoning, logic programming and n-person games. *Artificial Intelligence*, 77(2), 321-357.

[4] Modgil, S., & Prakken, H. (2013). A general account of argumentation with preferences. *Artificial Intelligence*, 195, 361-397.

[5] Chesñevar, C., McGinnis, J., Modgil, S., Rahwan, I., Reed, C., Simari, G., South, M., Vreeswijk, G., & Willmott, S. (2006). Towards an argument interchange format. *The Knowledge Engineering Review*, 21(4), 293-316.

[6] Girard, J. Y. (2001). Locus Solum: From the rules of logic to the logic of rules. *Mathematical Structures in Computer Science*, 11(3), 301-506.

[7] Ambler, S. (1996). A categorical approach to the semantics of argumentation. *Mathematical Structures in Computer Science*, 6(2), 167-188.

[8] Conklin, J., & Begeman, M. L. (1988). gIBIS: A hypertext tool for exploratory policy discussion. *ACM Transactions on Information Systems*, 6(4), 303-331.

[9] Besnard, P., & Hunter, A. (2008). *Elements of Argumentation*. MIT Press.

[10] Rahwan, I., & Simari, G. R. (Eds.). (2009). *Argumentation in Artificial Intelligence*. Springer.

[11] van Eemeren, F. H., & Grootendorst, R. (2004). *A Systematic Theory of Argumentation: The Pragma-Dialectical Approach*. Cambridge University Press.

[12] Prakken, H. (2010). An abstract framework for argumentation with structured arguments. *Argument & Computation*, 1(2), 93-124.

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Abstract Argumentation** | Framework evaluating argument acceptability from attack structure alone |
| **Admissible Set** | Conflict-free set where every argument is defended |
| **ASPIC+** | Framework for structured argumentation with preferences |
| **Attack** | Relation where one argument challenges another |
| **Claim** | Canonical assertion with stable identifier |
| **Commitment Store** | Set of claims a participant has publicly committed to |
| **Critical Question** | Question that, if raised and unanswered, defeats a scheme instance |
| **Deliberation** | Container for claims, arguments, and dialogue in a reasoning session |
| **Defeat** | Successful attack (considering preferences) |
| **Extension** | Set of arguments jointly acceptable under given semantics |
| **Grounded Extension** | Unique minimal admissible set |
| **Inference** | Reasoning step connecting premises to conclusion |
| **Ludics** | Girard's game-semantic approach to proof theory |
| **Plexus** | Network of deliberations connected by transport/reference |
| **Preferred Extension** | Maximal admissible set |
| **Progressive Formalization** | Architecture where structure emerges on demand |
| **Rebuttal** | Attack on an argument's conclusion |
| **Scheme** | Pattern of defeasible reasoning with critical questions |
| **Undercut** | Attack on an argument's inference step |
| **Undermine** | Attack on an argument's premise |

---

## Appendix B: Scheme Inventory (Selected)

| Scheme | Category | Critical Questions (Summary) |
|--------|----------|------------------------------|
| Expert Opinion | Source | Expertise scope, bias, consensus |
| Witness Testimony | Source | Reliability, perception, consistency |
| Position to Know | Source | Access, honesty, plausibility |
| Cause to Effect | Causal | Mechanism, confounders, necessity |
| Correlation to Cause | Causal | Third factor, direction, coincidence |
| Practical Reasoning | Practical | Goal validity, side effects, alternatives |
| Negative Consequences | Practical | Probability, severity, prevention |
| Analogy | Analogical | Relevant differences, similarity depth |
| Precedent | Analogical | Relevance, distinguishing factors |
| Verbal Classification | Classification | Definition accuracy, borderline cases |
| Popular Opinion | Evaluative | Sample bias, expertise, rationality |
| Established Rule | Defeasibility | Applicability, exceptions, conflicts |
| Ignorance | Defeasibility | Search thoroughness, closed world |

---

## Appendix C: Move Vocabulary Reference

| Move | Syntax | Effect |
|------|--------|--------|
| ASSERT(φ) | Assert claim φ | Add φ to speaker's commitment store |
| CHALLENGE(φ) | Challenge claim φ | Demand grounds for φ |
| GROUNDS(φ, A) | Ground φ with argument A | Provide justification for φ |
| RETRACT(φ) | Retract claim φ | Remove φ from commitment store |
| CONCEDE(φ) | Concede claim φ | Add φ to own store (from opponent) |
| SUPPOSE(φ) | Suppose claim φ | Hypothetical commitment (scoped) |
| QUESTION(φ) | Question about φ | Request information |
| ANSWER(φ, ψ) | Answer to question φ | Provide information ψ |
| CLOSE(branch) | Close dialogue branch | End sub-discussion |

---

## Appendix D: Formal Notation

### D.1 Abstract Argumentation Framework

An abstract argumentation framework is a pair:

$$AF = (Args, Attacks)$$

where $Args$ is a finite set of arguments and $Attacks \subseteq Args \times Args$.

For $A, B \in Args$, we write $A \rightsquigarrow B$ to denote $(A, B) \in Attacks$ ("A attacks B").

### D.2 Acceptability Semantics

**Conflict-free**: A set $S \subseteq Args$ is conflict-free iff $\nexists A, B \in S : A \rightsquigarrow B$

**Defense**: $A$ is defended by $S$ iff $\forall B (B \rightsquigarrow A \rightarrow \exists C \in S : C \rightsquigarrow B)$

**Admissible**: $S$ is admissible iff $S$ is conflict-free and every $A \in S$ is defended by $S$

**Complete**: $S$ is complete iff $S$ is admissible and contains all arguments defended by $S$

**Grounded**: $S$ is grounded iff $S$ is the minimal complete extension

**Preferred**: $S$ is preferred iff $S$ is a maximal (w.r.t. ⊆) admissible set

**Stable**: $S$ is stable iff $S$ is conflict-free and $\forall A \notin S : \exists B \in S : B \rightsquigarrow A$

### D.3 Characteristic Function

The characteristic function $F_{AF} : 2^{Args} \rightarrow 2^{Args}$:

$$F_{AF}(S) = \{ A \in Args : A \text{ is defended by } S \}$$

The grounded extension is the least fixed point: $GE(AF) = lfp(F_{AF})$

### D.4 ASPIC+ Structured Argumentation

An ASPIC+ argumentation system is a tuple:

$$AS = (\mathcal{L}, \mathcal{R}, n, \overline{\phantom{x}})$$

where:
- $\mathcal{L}$ is a logical language with $\neg$ negation
- $\mathcal{R} = \mathcal{R}_s \cup \mathcal{R}_d$ are strict and defeasible rules
- $n : \mathcal{R}_d \rightarrow \mathcal{L}$ is a naming function for defeasible rules
- $\overline{\phantom{x}} : \mathcal{L} \rightarrow 2^\mathcal{L}$ is a contrariness function

A **knowledge base** is a pair $\mathcal{K} = (\mathcal{K}_n, \mathcal{K}_p)$ of axioms and ordinary premises.

An **argument** $A$ has:
- $Prem(A)$: premises used
- $Conc(A)$: conclusion reached
- $Sub(A)$: sub-arguments
- $TopRule(A)$: last rule applied

### D.5 Attack Relations in ASPIC+

For arguments $A$ and $B$:

**Rebut**: $A$ rebuts $B$ on $B'$ iff $B' \in Sub(B)$ with defeasible top rule and $Conc(A) \in \overline{Conc(B')}$

**Undercut**: $A$ undercuts $B$ on $B'$ iff $B' \in Sub(B)$ with defeasible top rule $r$ and $Conc(A) \in \overline{n(r)}$

**Undermine**: $A$ undermines $B$ iff $Conc(A) \in \overline{\phi}$ for some $\phi \in Prem(B) \cap \mathcal{K}_p$

### D.6 Defeat with Preferences

Given preference orderings $\preceq$ on arguments:

$A$ **defeats** $B$ iff:
- $A$ undercuts $B$, or
- $A$ rebuts $B$ on $B'$ and $A \not\prec B'$, or
- $A$ undermines $B$ on $\phi$ and $A \not\prec \phi$

The preference ordering determines when attacks succeed.

### D.7 Confidence Propagation

For confidence measure $c : Args \rightarrow [0,1]$:

**Product mode**:
$$c(A) = \prod_{P \in Prem(A)} c(P) \cdot c(TopRule(A))$$

**Minimum mode**:
$$c(A) = \min(\{c(P) : P \in Prem(A)\} \cup \{c(TopRule(A))\})$$

**Dempster-Shafer mode** (belief intervals):
$$[Bel(A), Pl(A)] \text{ where } Bel \leq P \leq Pl$$
