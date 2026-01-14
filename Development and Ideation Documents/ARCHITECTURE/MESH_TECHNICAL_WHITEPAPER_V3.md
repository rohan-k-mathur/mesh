# Mesh: A Graph-Structured System for Collective Argumentation

**Abstract.** Collective reasoning in digital environments suffers from a fundamental structural problem: discourse produces unstructured text that cannot be composed, analyzed, or verified. We propose a system that represents arguments as typed graph structures conforming to a formal ontology, enabling claims to reference evidence, arguments to reference claims, and challenges to reference the specific inferential steps they contest. The architecture implements progressive formalization—structure is imposed only as complexity demands it—allowing the same system to support casual discussion and formal deliberation. Arguments are constructed using established argumentation schemes with automatically surfaced critical questions, attacks are typed according to their target (conclusion, inference, or premise), and participant commitments are tracked through dialogue moves with full provenance. The system produces durable artifacts: knowledge graphs that can be queried, exported, and extended; documents with citations traceable to their supporting reasoning. We describe the data model, the dialogue protocol, the evaluation semantics, and the mechanisms for cross-deliberation argument transport.

---

## 1. Introduction

Institutions that depend on collective reasoning—corporations, governments, research groups, civic organizations—have adopted digital communication tools that actively undermine the structure of argument. Email threads, chat logs, and document comments produce linear text streams where claims are buried, evidence is disconnected from assertions, and challenges are lost in noise. The same debates recur because there is no mechanism to reference past reasoning. Decisions lack audit trails. Knowledge does not compound.

The problem is not a shortage of communication. The problem is that communication produces only text, and text lacks the structure required for reasoning to be verified, extended, or reused.

What is needed is a system that represents reasoning as *structured artifacts*—graphs where nodes are claims, edges are inferential relationships, and the entire structure can be queried, analyzed, and exported. Such a system would allow any participant to trace a conclusion back to its premises, identify precisely what is contested in a dispute, and build on prior reasoning rather than repeating it.

We propose Mesh, a graph-structured argumentation system with the following properties:

1. **Claims are canonical objects** with stable identifiers, typed relationships to other claims, and links to supporting evidence.
2. **Arguments are graph structures** with explicit premises, conclusions, and inference patterns conforming to established argumentation schemes.
3. **Challenges are typed** according to what they attack: the conclusion directly (rebuttal), the inference step (undercut), or a supporting premise (undermine).
4. **Dialogue moves are recorded** with provenance, creating commitment stores that track what each participant has asserted, challenged, and conceded.
5. **Deliberations produce artifacts** that persist beyond the conversation: exportable graphs, citable documents, searchable knowledge bases.

The system implements progressive formalization: structure emerges on-demand as discourse complexity increases. A casual discussion imposes minimal overhead. A formal deliberation can upgrade to full scheme-based argument construction, typed attack tracking, and automated evaluation. The same architecture serves both.

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

Claims exist in relationship to other claims through **ClaimEdges**, typed according to the nature of the relationship:

| Edge Type | Semantics |
|-----------|-----------|
| SUPPORTS | Source claim provides evidence or reasoning for target |
| OPPOSES | Source claim contradicts or challenges target |
| QUALIFIES | Source claim adds conditions or limitations to target |
| GENERALIZES | Source claim abstracts from target |
| SPECIALIZES | Source claim is a specific instance of target |
| PRESUPPOSES | Source claim assumes target as background |

The graph of claims and edges forms the **claim network** for a deliberation. Any claim can be traced to its supporting evidence, its relationship to other claims, and its position in ongoing disputes.

Claims have a lifecycle reflecting their status in ongoing deliberation:

| Status | Description |
|--------|-------------|
| DRAFT | Under construction, not yet publicly asserted |
| ACTIVE | Publicly asserted and available for reference |
| CHALLENGED | Questioned; justification demanded |
| DEFENDED | Supported with argument after challenge |
| RETRACTED | Withdrawn by author |
| SUPERSEDED | Replaced by refined version |
| ACCEPTED | Conceded by relevant parties |

When a claim's content is modified, the system creates a new version linked to the original. References to claims remain valid even as claims are refined.

The problem, of course, is that claims alone do not constitute arguments. A claim may be true or false, but an *argument* is a structured justification: premises lead to a conclusion through an inference pattern. To represent reasoning, we need a richer structure.

---

## 3. Arguments

We define an **argument** as a graph structure consisting of premises, conclusion, inference, and scheme.

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

The system implements 60+ schemes from the Walton taxonomy [1], organized into categories:

| Category | Example Schemes |
|----------|-----------------|
| Source-Based | Expert Opinion, Witness Testimony, Position to Know |
| Causal | Cause to Effect, Effect to Cause, Correlation to Cause |
| Practical | Practical Reasoning, Negative Consequences, Waste |
| Analogical | Analogy, Precedent, Example |
| Classification | Verbal Classification, Definition, Vagueness |
| Evaluative | Values, Commitment, Popular Opinion |
| Defeasibility | Ignorance, Established Rule, Exception |

Critical questions are automatically surfaced when an argument is constructed. Unanswered critical questions represent potential attack vectors.

### 3.2 Argument Chains

Individual arguments can be composed into **argument chains**—directed acyclic graphs where the conclusion of one argument serves as a premise for another.

| Chain Type | Structure |
|------------|-----------|
| SERIAL | A → B → C (linear dependency) |
| CONVERGENT | A → C, B → C (multiple premises to one conclusion) |
| DIVERGENT | A → B, A → C (one premise to multiple conclusions) |
| LINKED | (A ∧ B) → C (premises jointly required) |
| HYBRID | Combination of above |

```
ArgumentChain {
  id: string
  nodes: ChainNode[]
  edges: ChainEdge[]
  rootNodes: ChainNode[]
  terminalNodes: ChainNode[]
  chainType: ChainType
}
```

Chain analysis enables identification of critical paths (arguments whose defeat maximally impacts the conclusion), vulnerability assessment (nodes with single vs. multiple supporters), and cycle detection.

Nodes are classified by dialectical role:

| Role | Definition |
|------|------------|
| THESIS | Primary claim being argued for |
| ANTITHESIS | Opposing claim or counter-argument |
| SYNTHESIS | Resolution integrating thesis and antithesis |
| LEMMA | Intermediate claim supporting the main argument |
| AXIOM | Assumed premise not requiring further justification |

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

The **attack graph** for a deliberation is the directed graph where nodes are arguments and edges are attack relations:

```
AttackGraph = (Args, Attacks)
where
  Args = { A₁, A₂, ..., Aₙ }
  Attacks ⊆ Args × Args × AttackType
```

This graph is the input to evaluation semantics (Section 7).

Critical questions from argumentation schemes map to attack types:

| Critical Question | Attack Type |
|-------------------|-------------|
| "Is the expert really qualified?" | UNDERMINE (attacks expertise premise) |
| "Does the expert have bias?" | UNDERCUT (attacks inference) |
| "Is the conclusion actually false?" | REBUT (attacks conclusion) |

---

## 5. Dialogue Protocol

We define a **dialogue** as a sequence of **moves** by participants, where each move has a type, a target, and provenance. The move vocabulary is adapted from dialogue game theory [2]:

| Move Type | Effect |
|-----------|--------|
| ASSERT | Adds claim to speaker's commitment store |
| CHALLENGE | Demands justification for a claim |
| GROUNDS | Provides argument supporting a challenged claim |
| RETRACT | Removes claim from speaker's commitment store |
| CONCEDE | Accepts opponent's claim into own commitment store |
| SUPPOSE | Hypothetically assumes a claim (scoped commitment) |

```
DialogueMove {
  id: string
  type: MoveType
  author: User
  target: Claim | Argument | DialogueMove
  content: string (optional elaboration)
  timestamp: timestamp
  branch: DialogueBranch
}
```

### 5.1 Commitment Stores

Each participant has a **commitment store**—the set of claims they have publicly committed to through their moves. ASSERT adds to commitment store. RETRACT removes. CONCEDE adds opponent's claim. Commitment stores enable consistency checking: if a participant's assertions imply a contradiction, this can be surfaced.

### 5.2 Dialogue Branches

Dialogues can branch into parallel threads. Branches are tracked explicitly:

```
DialogueBranch {
  id: string
  parentBranch: DialogueBranch | null
  rootMove: DialogueMove
  status: ACTIVE | RESOLVED | ABANDONED
  resolution: ACCEPTED | REJECTED | MERGED | null
}
```

When a branch resolves, its conclusion propagates to the parent.

### 5.3 Dialogue Types

The system supports multiple dialogue types following the Walton-Krabbe typology [2]:

| Type | Goal |
|------|------|
| PERSUASION | Resolve disagreement |
| INQUIRY | Establish truth collectively |
| NEGOTIATION | Reach mutually acceptable agreement |
| INFORMATION-SEEKING | Transfer knowledge |
| DELIBERATION | Decide on action |

### 5.4 Dialogue Rules

Dialogues can operate under explicit rule sets constraining legal moves:

- **Burden of Proof**: After CHALLENGE, must GROUNDS or RETRACT within n moves
- **No Repetition**: Identical moves by same party flagged
- **Relevance**: Moves must target existing claims/arguments
- **Consistency**: ASSERT contradicting own commitment store flagged

Rule enforcement can be advisory (flag violations) or strict (prevent illegal moves).

---

## 6. Evidence

We define **evidence** as externally-sourced material that supports claims.

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

Evidence can be assigned confidence values based on source reliability, corroboration, and recency. These values propagate through the argument graph:

```
confidence(argument) = f(confidence(premises), confidence(inference), confidence(evidence))
```

The system supports multiple aggregation modes:

| Mode | Aggregation |
|------|-------------|
| PRODUCT | Multiply path confidences |
| MINIMUM | Take minimum confidence in chain |
| DEMPSTER-SHAFER | Belief intervals with uncertainty |

### 6.2 Evidence Types

| Type | Reliability Considerations |
|------|---------------------------|
| PRIMARY_SOURCE | Authenticity, completeness, context |
| SECONDARY_SOURCE | Accuracy of representation, bias |
| EXPERT_TESTIMONY | Expertise scope, independence, consensus |
| EMPIRICAL_DATA | Methodology, sample size, reproducibility |
| STATISTICAL | Confounders, base rates, interpretation |
| ANECDOTAL | Representativeness, cherry-picking |

Evidence type affects how confidence is assigned and how challenges are structured.

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

### 7.1 Preference Ordering

When conflicts cannot be resolved by attack structure alone, **preference orderings** can be introduced. Premise ordering: some premises are more certain than others. Inference ordering: some schemes are stronger than others. Source ordering: some evidence is more reliable than others.

These orderings are implemented via the ASPIC+ framework [4], which provides a systematic account of how preferences translate into defeat relations.

### 7.2 Alternative Semantics

| Semantics | Definition |
|-----------|------------|
| GROUNDED | Minimal complete extension (skeptical) |
| PREFERRED | Maximal admissible extensions (credulous) |
| STABLE | Complete, conflict-free extensions |
| SEMI-STABLE | Preferred extensions minimizing undecided |
| IDEAL | Intersection of preferred extensions |

Different semantics suit different contexts. Legal reasoning may prefer grounded (burden of proof). Exploratory deliberation may prefer preferred (what positions are tenable).

### 7.3 Rationality Postulates

The evaluation semantics satisfy key rationality postulates [4]:

| Postulate | Description |
|-----------|-------------|
| SUB-ARGUMENT CLOSURE | If A is justified, all sub-arguments of A are justified |
| CLOSURE UNDER STRICT RULES | Conclusions of strict rules with justified premises are justified |
| DIRECT CONSISTENCY | Justified conclusions do not directly contradict each other |
| INDIRECT CONSISTENCY | Closure of justified conclusions under strict rules is consistent |

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

Participants can operate at any layer. A casual comment remains at Layer 0. Extracting a claim elevates it to Layer 1. Constructing a formal argument elevates it to Layer 2. The same infrastructure supports all levels.

Upgrade paths preserve provenance:

- Message → Claim: Extract assertion
- Claim → Argument: Identify premises, assign scheme
- Argument → Chain: Compose into structured graph
- Chain → Theory: Add attack relations, compute extensions

Downgrade paths enable communication:

- Argument → Claim: Collapse to summary
- Chain → Narrative: Export as prose
- Theory → Summary: Natural-language conclusions

---

## 9. Artifacts

Deliberations produce **artifacts** that persist beyond the conversation.

**Thesis Documents**: Narrative summaries with inline citations to supporting arguments. Every claim links to its justification in the argument graph.

**Knowledge Base Pages**: Wiki-style pages synthesizing conclusions from multiple deliberations. When new deliberations affect the topic, pages update with provenance.

**Exportable Graphs**: Full argument graph exported in standard formats:

| Format | Use Case |
|--------|----------|
| AIF-RDF | Interoperability with academic tools |
| JSON-LD | Web integration, search indexing |
| GraphML | Visualization in external tools |
| DOT | Diagrams and publication figures |

**Debate Sheets**: Tabular views showing claims, confidence scores, attack/support relationships.

Artifacts create institutional memory. What an organization figured out in one deliberation is available to future deliberations.

---

## 10. Argument Transport

Arguments can be **transported** between deliberations. When an argument from Deliberation A is relevant to Deliberation B, it can be imported with provenance preserved:

```
TransportedArgument {
  original: Argument
  source: Deliberation
  importedTo: Deliberation
  transformer: User
  transformations: Transform[]
}
```

Transport creates a network of deliberations (the **Plexus**) where reasoning compounds across organizational boundaries.

| Edge Type | Semantics |
|-----------|-----------|
| IMPORTS | Deliberation B imports argument from A |
| XREF | Deliberation B references claim from A |
| OVERLAP | Deliberations share common claims |
| EXTENDS | Deliberation B continues reasoning from A |

When an argument is transported, its premises may be established in the source but contested in the target. The transported argument inherits only its structure, not its acceptability. Participants in the target deliberation can accept, challenge, or adapt it.

The Plexus enables discovery (finding related deliberations), reuse (importing established arguments), consistency checking (detecting conflicting conclusions), and analysis (understanding how reasoning propagates).

---

## 11. Theoretical Foundations

### 11.1 Abstract Argumentation (Dung)

The evaluation semantics are based on Dung's abstract argumentation frameworks [3]. An abstract argumentation framework is a pair $(Args, Attacks)$ where $Args$ is a set of arguments and $Attacks \subseteq Args \times Args$ is a binary attack relation.

Argument acceptability can be computed from attack structure alone, without examining argument content. The grounded extension is computed as the least fixed point:

$$F(S) = \{ A \in Args : \forall B((B, A) \in Attacks \rightarrow \exists C \in S((C, B) \in Attacks)) \}$$

### 11.2 ASPIC+ Framework

ASPIC+ [4] extends abstract argumentation with structured arguments:

- **Language**: Propositional or first-order language for claim content
- **Rules**: Strict rules (cannot be attacked) and defeasible rules (can be attacked)
- **Contrariness**: Specification of which claims contradict which
- **Preferences**: Orderings on rules and premises

ASPIC+ explains *why* attacks succeed or fail. A rebuttal succeeds if the attacking argument is preferred. An undercut succeeds if the defeasible rule is weaker than the attack.

### 11.3 Walton Schemes

Argumentation schemes [1] provide content-level structure. While Dung and ASPIC+ are content-agnostic, schemes capture patterns of *good* reasoning. The 60+ Walton schemes are implemented as templates with required premises, conclusion form, and critical questions.

### 11.4 Dialogue Game Theory

The dialogue protocol is grounded in dialogue game theory [2]. Dialogues are modeled as games with players, moves, rules, commitment stores, and win conditions. The Walton-Krabbe typology provides the framework for dialogue classification.

### 11.5 Categorical Semantics

The system's mathematical foundation includes categorical structure [7]:

- **Objects**: Claims/Propositions
- **Morphisms**: Arguments (maps from premises to conclusions)
- **Composition**: Argument chaining
- **Hom-sets**: Sets of arguments between two claims, forming join-semilattices

This enables functorial transport (arguments between deliberations as structure-preserving functors) and compositional confidence measures.

---

## 12. Implementation

The system is implemented as a web application:

- **Frontend**: React/TypeScript with graph visualization (ReactFlow)
- **Backend**: Node.js with PostgreSQL (Prisma ORM)
- **Real-time**: Supabase for presence and live updates
- **Caching**: Redis for commitment stores and hot data
- **Export**: AIF-compliant JSON-LD and RDF

The data model maps directly to the formal structures described above:

| Formal Concept | Database Entity |
|----------------|-----------------|
| Claim | `Claim` table |
| ClaimEdge | `ClaimEdge` table with typed relation |
| Argument | `Argument` with `ArgumentPremise`, `Inference` |
| Attack | `Attack` table |
| DialogueMove | `DialogueMove` table |
| Commitment | `Commitment` table |
| Evidence | `Evidence` with `EvidenceSource` |
| ArgumentChain | `ArgumentChain`, `ArgumentChainNode`, `ArgumentChainEdge` |

API routes provide CRUD operations for all entities plus specialized endpoints for graph analysis, extension computation, and artifact generation.

---

## 13. Conclusion

We have described a system that transforms collective discourse from ephemeral text into structured, analyzable, durable reasoning artifacts. The key insight is that arguments have structure—premises, inferences, conclusions, attacks—and that representing this structure explicitly enables capabilities impossible with flat text: tracing conclusions to evidence, typing disagreements precisely, evaluating argument status formally, composing reasoning across contexts.

The progressive formalization architecture ensures that this structure does not impose premature overhead: participants encounter formality only when complexity warrants it. The same system supports casual discussion and rigorous deliberation.

The theoretical grounding in Dung's abstract argumentation, ASPIC+ structured argumentation, Walton's argumentation schemes, and dialogue game theory provides principled foundations for system behavior. These are not arbitrary design choices but implementations of established frameworks with known properties.

The result is reasoning infrastructure: the foundational layer that enables collective intelligence to compound rather than dissipate.

---

## References

[1] Walton, D., Reed, C., & Macagno, F. (2008). Argumentation Schemes. Cambridge University Press.

[2] Walton, D. N., & Krabbe, E. C. (1995). Commitment in Dialogue: Basic Concepts of Interpersonal Reasoning. SUNY Press.

[3] Dung, P. M. (1995). On the acceptability of arguments and its fundamental role in nonmonotonic reasoning, logic programming and n-person games. Artificial Intelligence, 77(2), 321-357.

[4] Modgil, S., & Prakken, H. (2013). A general account of argumentation with preferences. Artificial Intelligence, 195, 361-397.

[5] Chesñevar, C., et al. (2006). Towards an argument interchange format. The Knowledge Engineering Review, 21(4), 293-316.

[6] Girard, J. Y. (2001). Locus Solum: From the rules of logic to the logic of rules. Mathematical Structures in Computer Science, 11(3), 301-506.

[7] Ambler, S. (1996). A categorical approach to the semantics of argumentation. Mathematical Structures in Computer Science, 6(2), 167-188.

[8] Besnard, P., & Hunter, A. (2008). Elements of Argumentation. MIT Press.

[9] Rahwan, I., & Simari, G. R. (Eds.). (2009). Argumentation in Artificial Intelligence. Springer.

---

## Appendix A: Formal Notation

### A.1 Abstract Argumentation Framework

An abstract argumentation framework is a pair:

$$AF = (Args, Attacks)$$

where $Args$ is a finite set of arguments and $Attacks \subseteq Args \times Args$.

For $A, B \in Args$, we write $A \rightsquigarrow B$ to denote $(A, B) \in Attacks$ ("A attacks B").

### A.2 Acceptability Semantics

**Conflict-free**: $S \subseteq Args$ is conflict-free iff $\nexists A, B \in S : A \rightsquigarrow B$

**Defense**: $A$ is defended by $S$ iff $\forall B (B \rightsquigarrow A \rightarrow \exists C \in S : C \rightsquigarrow B)$

**Admissible**: $S$ is admissible iff $S$ is conflict-free and every $A \in S$ is defended by $S$

**Grounded**: $S$ is grounded iff $S$ is the minimal complete extension

### A.3 ASPIC+ Attack Relations

For arguments $A$ and $B$:

**Rebut**: $A$ rebuts $B$ on $B'$ iff $B' \in Sub(B)$ with defeasible top rule and $Conc(A) \in \overline{Conc(B')}$

**Undercut**: $A$ undercuts $B$ on $B'$ iff $B' \in Sub(B)$ with defeasible top rule $r$ and $Conc(A) \in \overline{n(r)}$

**Undermine**: $A$ undermines $B$ iff $Conc(A) \in \overline{\phi}$ for some $\phi \in Prem(B)$

### A.4 Defeat with Preferences

$A$ **defeats** $B$ iff:
- $A$ undercuts $B$, or
- $A$ rebuts $B$ on $B'$ and $A \not\prec B'$, or
- $A$ undermines $B$ on $\phi$ and $A \not\prec \phi$

---

## Appendix B: Scheme Reference

| Scheme | Category | Critical Questions |
|--------|----------|-------------------|
| Expert Opinion | Source | Expertise scope, bias, consensus |
| Witness Testimony | Source | Reliability, perception, consistency |
| Cause to Effect | Causal | Mechanism, confounders, necessity |
| Practical Reasoning | Practical | Goal validity, side effects, alternatives |
| Analogy | Analogical | Relevant differences, similarity depth |
| Precedent | Analogical | Relevance, distinguishing factors |
| Established Rule | Defeasibility | Applicability, exceptions, conflicts |

---

## Appendix C: Move Reference

| Move | Effect |
|------|--------|
| ASSERT(φ) | Add φ to speaker's commitment store |
| CHALLENGE(φ) | Demand grounds for φ |
| GROUNDS(φ, A) | Ground φ with argument A |
| RETRACT(φ) | Remove φ from commitment store |
| CONCEDE(φ) | Add φ to own store (from opponent) |
| SUPPOSE(φ) | Hypothetical commitment (scoped) |
