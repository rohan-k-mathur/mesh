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

### 3.2 Argument Chains

Individual arguments can be composed into **argument chains**—directed acyclic graphs where the conclusion of one argument serves as a premise for another. Chains can be:

| Chain Type | Structure |
|------------|-----------|
| SERIAL | Linear: A → B → C |
| CONVERGENT | Multiple premises to one conclusion |
| DIVERGENT | One premise to multiple conclusions |
| LINKED | Premises jointly support conclusion |
| HYBRID | Combination of above patterns |

Chain analysis enables identification of critical paths, vulnerability assessment, and cycle detection.

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

### 4.1 Attack Graphs

The **attack graph** for a deliberation is the directed graph where nodes are arguments and edges are attack relations. This graph is the input to evaluation semantics (Section 7).

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

| Mode | Aggregation |
|------|-------------|
| PRODUCT | Multiply path confidences |
| MINIMUM | Take minimum confidence in chain |
| DEMPSTER-SHAFER | Belief intervals with uncertainty |

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

---

## 9. Artifacts

Deliberations produce **artifacts** that persist beyond the conversation:

**Thesis Documents**: Narrative summaries with inline citations to supporting arguments. Every claim in a thesis links to its justification in the argument graph.

**Knowledge Base Pages**: Wiki-style pages synthesizing conclusions from multiple deliberations. Pages can reference claims and arguments from their source deliberations.

**Exportable Graphs**: The full argument graph can be exported in standard formats (AIF-RDF, JSON-LD) for analysis in external tools.

**Debate Sheets**: Tabular views showing claims, confidence scores, and attack/support relationships.

Artifacts create institutional memory: what an organization figured out in one deliberation is available to future deliberations.

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

---

## 11. Implementation

The system is implemented as a web application with:

- **Frontend**: React/TypeScript with graph visualization (ReactFlow)
- **Backend**: Node.js with PostgreSQL (Prisma ORM)
- **Real-time**: Supabase for presence and live updates
- **Caching**: Redis for commitment stores and hot data
- **Export**: AIF-compliant JSON-LD and RDF

The data model maps directly to the formal structures described above. API routes provide CRUD operations for all entities plus specialized endpoints for graph analysis, extension computation, and artifact generation.

---

## 12. Conclusion

We have described a system that transforms collective discourse from ephemeral text into structured, analyzable, durable reasoning artifacts. The key insight is that arguments have structure—premises, inferences, conclusions, attacks—and that representing this structure explicitly enables capabilities impossible with flat text: tracing conclusions to evidence, typing disagreements precisely, evaluating argument status formally, composing reasoning across contexts.

The progressive formalization architecture ensures that this structure does not impose premature overhead: participants encounter formality only when complexity warrants it. The same system supports casual discussion and rigorous deliberation.

The result is reasoning infrastructure: the foundational layer that enables collective intelligence to compound rather than dissipate.

---

## References

[1] Walton, D., Reed, C., & Macagno, F. (2008). Argumentation Schemes. Cambridge University Press.

[2] Walton, D. N., & Krabbe, E. C. (1995). Commitment in Dialogue: Basic Concepts of Interpersonal Reasoning. SUNY Press.

[3] Dung, P. M. (1995). On the acceptability of arguments and its fundamental role in nonmonotonic reasoning, logic programming and n-person games. Artificial Intelligence, 77(2), 321-357.

[4] Modgil, S., & Prakken, H. (2013). A general account of argumentation with preferences. Artificial Intelligence, 195, 361-397.

[5] Chesñevar, C., McGinnis, J., Modgil, S., Rahwan, I., Reed, C., Simari, G., ... & Willmott, S. (2006). Towards an argument interchange format. The Knowledge Engineering Review, 21(4), 293-316.

[6] Girard, J. Y. (2001). Locus Solum: From the rules of logic to the logic of rules. Mathematical Structures in Computer Science, 11(3), 301-506.

[7] Ambler, S. (1996). A categorical approach to the semantics of argumentation. Mathematical Structures in Computer Science, 6(2), 167-188.

