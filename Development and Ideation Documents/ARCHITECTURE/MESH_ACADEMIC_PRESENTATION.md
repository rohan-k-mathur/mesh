# Mesh: A Digital Infrastructure for Public Reasoning

## An Academic Presentation

---

### Introduction

Thank you for the opportunity to present this work. What I want to share today is a system we've been building called Mesh — specifically, its deliberation infrastructure, which we refer to internally as "Agora." 

The question that motivates this project is straightforward, though the answer has proven complex: **What would it mean to build digital infrastructure that supports collective reasoning rather than undermining it?**

I'll structure this talk in four parts. First, I'll describe the problem space as we understand it. Second, I'll outline the theoretical foundations we draw upon. Third, I'll walk through the technical architecture. And finally, I'll discuss what we've learned and where we see this going.

---

### Part I: The Problem Space

#### The Infrastructural Deficit

Let me begin with an observation that I suspect is familiar to everyone in this room. Democratic societies depend fundamentally on a capacity for collective reasoning — the ability of citizens to jointly consider evidence, weigh competing claims, and arrive at decisions that can be justified to those affected by them. This capacity is not automatic. It requires infrastructure: institutions, practices, and increasingly, technical systems.

The infrastructural situation we find ourselves in is peculiar. We have sophisticated systems for many collective activities — financial transactions, logistics, communication. But for collective *reasoning* specifically, the infrastructure is remarkably impoverished. The platforms where public discourse actually occurs were not designed for deliberation. They were designed for content distribution and engagement maximization. The predictable result is that they actively degrade the reasoning they host.

This is worth being precise about. The issue is not that people are irrational, or that social media is generically "bad." The issue is structural. Current platforms provide no way to:

- Distinguish a claim from a reaction to that claim
- Connect an assertion to the evidence that supports it
- Track what has been established versus what remains contested
- Preserve the structure of an argument as it develops over time
- Identify the precise point of disagreement when two positions conflict

These are not exotic requirements. They are basic to any serious reasoning process. Their absence means that even well-intentioned discourse tends to degrade: arguments loop rather than progress, evidence gets disconnected from claims, and the same ground gets covered repeatedly.

#### What Would Adequate Infrastructure Look Like?

This framing — infrastructure for reasoning — shapes our design choices. We are not building a social network, though Mesh includes social features. We are not building a content management system, though content is managed. We are building the underlying structures that make it possible to reason together in a way that accumulates rather than dissipates.

The analogy I find useful is to version control in software development. Before version control, programmers collaborated through file sharing and conventions. It worked, sort of. But version control made a new kind of collaboration possible — distributed, asynchronous, auditable, with clear provenance and conflict resolution. It didn't make programmers smarter; it gave them infrastructure that made their existing capabilities more effective.

We are attempting something similar for public reasoning: infrastructure that makes the reasoning process itself visible, persistent, and tractable.

---

### Part II: Theoretical Foundations

#### Why Argumentation Theory?

The theoretical foundations of this project are drawn from formal argumentation — a field that has developed, over several decades, rigorous frameworks for representing and evaluating reasoning structures. This choice requires some explanation, because argumentation theory remains relatively specialized despite its relevance to the problems I've described.

What argumentation theory provides, in brief, is a vocabulary and formal apparatus for talking about the *structure* of reasoning rather than just its *content*. An argument, in this framework, is not simply prose that persuades; it is a structure with identifiable components — premises, conclusions, inference patterns — that can be analyzed, compared, and evaluated.

Three bodies of work have been particularly important for our design:

#### The Argument Interchange Format (AIF)

The first is the Argument Interchange Format, developed by an international consortium of argumentation researchers. AIF provides an ontology — a formal vocabulary — for representing arguments in a way that is independent of any particular domain or application.

The core idea is simple but powerful. AIF distinguishes between two types of nodes: I-nodes (information nodes) that represent claims or propositions, and S-nodes (scheme nodes) that represent the inferential relationships between claims. An argument, in AIF terms, is a directed graph where I-nodes are connected by S-nodes that make the reasoning explicit.

This may sound abstract, but it has practical consequences. When arguments are represented in AIF format, they can be:

- Exchanged between different systems (interoperability)
- Analyzed by formal tools (computability)  
- Visualized in multiple ways (representation independence)
- Preserved as data structures rather than prose (durability)

Mesh implements AIF natively. Every claim, every argument, every attack or support relation is represented as a graph structure that conforms to the AIF ontology. This is not visible to users — they work with interfaces, not graphs — but it means that everything in the system can be exported, analyzed, and verified by external tools.

#### Walton's Argumentation Schemes

The second theoretical foundation is Douglas Walton's work on argumentation schemes. Walton observed that most real-world arguments follow recognizable patterns — what he called "schemes." An argument from expert opinion, for instance, has a characteristic structure: a source is cited, their expertise in the relevant domain is invoked, and a conclusion is drawn based on their testimony.

Walton catalogued approximately 60 such schemes, and — crucially — identified the *critical questions* associated with each. For an argument from expert opinion, the critical questions include: Is the source actually an expert in this field? Is the field one where expertise is meaningful? Are other experts in agreement?

This framework is valuable because it provides a principled way to evaluate arguments without requiring full formalization. You don't need to derive a conclusion from first principles; you need to identify the scheme being used and verify that the critical questions have been addressed.

Mesh implements scheme recognition and critical question generation. When a user constructs an argument, the system can identify the scheme being used and surface the relevant critical questions. This guides evaluation without imposing it.

#### ASPIC+ and Defeasible Reasoning

The third foundation is the ASPIC+ framework, developed by Henry Prakken and others. ASPIC+ addresses a problem that classical logic handles poorly: defeasible reasoning, where conclusions can be withdrawn in light of new information.

Most real-world reasoning is defeasible. We conclude things based on evidence that is typically incomplete, from rules that admit exceptions, in situations where counter-arguments may emerge. A framework for public reasoning needs to accommodate this.

ASPIC+ provides a formal semantics for defeasible argument. It defines:

- Strict rules (which admit no exceptions) and defeasible rules (which do)
- Contrary and contradictory relations between propositions
- Preference orderings that determine which arguments prevail in conflicts
- Acceptability semantics that identify which conclusions are warranted given the full argument graph

This is technical, but the payoff is significant. With ASPIC+ semantics, we can determine not just which arguments exist but which arguments *stand* — that is, which conclusions are acceptable once all attacks and defenses have been considered.

Mesh implements ASPIC+ evaluation. Users can construct theories with strict and defeasible rules, specify preferences, and compute which arguments are acceptable under different semantics (grounded, preferred, stable extensions). This provides formal evaluation when it's needed, while remaining optional for less formal use cases.

#### Dialogue Game Theory

A fourth foundation, which I'll mention more briefly, is dialogue game theory — particularly the work of Walton and Krabbe on commitment in dialogue.

The key insight here is that reasoning is not just a structure of claims and inferences; it is also a *process* that unfolds over time, with participants making moves that carry normative weight. When someone asserts a claim in a dialogue, they *commit* to that claim — it becomes part of their public position, something they can be held to.

Walton and Krabbe formalized this through the notion of commitment stores: per-participant records of what has been asserted, conceded, or retracted over the course of a dialogue. This makes the dialogue process tractable in a way that prose transcripts are not.

Mesh implements commitment tracking. Every assertion, challenge, concession, and retraction is recorded as a typed dialogue move. The system maintains commitment stores for each participant. This provides a clear answer to questions like: What has this participant actually committed to? What remains contested? When did a particular position change?

---

### Part III: Technical Architecture

Let me now describe how these theoretical foundations are realized in the system architecture.

#### The Data Model

At the foundation is a data model that represents reasoning as structured data rather than text. The core entities are:

**Claims** are canonical assertions — propositions that can be true or false, that have authors and provenance, and that can stand in relationships to other claims. Each claim has a stable identifier, which means it can be referenced, linked, and tracked over time.

**Arguments** connect claims through inferential structure. An argument has premises (claims that are taken as given) and a conclusion (a claim that is asserted to follow). Arguments are annotated with schemes that identify the reasoning pattern being used.

**Chains** compose arguments into larger structures. An argument rarely stands alone; it participates in a network of supporting and attacking relations. Chains capture this structure, allowing for serial, convergent, divergent, or linked patterns.

**Dialogue Moves** record the temporal process of deliberation. Every speech act — asserting, questioning, challenging, conceding, retracting — is captured as a move with an actor, a target, a type, and a timestamp. The sequence of moves constitutes the dialogue history.

**Attacks** represent challenges to arguments. Following argumentation theory, we distinguish rebuttals (which target the conclusion), undercuts (which target the inference), and undermining attacks (which target the premises). This taxonomy matters because different attack types require different responses.

**Commitments** track what each participant is committed to at any point in the dialogue. This is derived from the move history — assertions add to commitments, retractions remove them — but is maintained as a queryable state.

All of these entities are represented as AIF-compliant graph structures. The database stores nodes and edges; the API operates on graphs; the exports produce standard formats. This is not merely a technical convenience. It means that the reasoning structures in Mesh are legible to the broader ecosystem of argumentation tools.

#### The Processing Layers

The system organizes processing into three layers, which correspond roughly to increasing levels of formalization:

**The Claims Layer** handles the transformation of informal ideas into canonical, addressable assertions. This includes evidence linking (connecting claims to sources), relationship typing (specifying how claims relate), and identity management (ensuring that the same claim is recognized across contexts).

**The Arguments Layer** handles the structuring of claims into inferential relationships. This includes scheme recognition (identifying the pattern of reasoning), critical question generation (surfacing the appropriate challenges), and attack management (tracking the structure of disagreement).

**The Theory Layer** handles formal evaluation of argument structures. This includes ASPIC+ theory construction (assembling rules and preferences), acceptability computation (determining which arguments survive challenge), and extension enumeration (identifying the stable configurations of belief).

Users interact with the system through interfaces that span these layers, with complexity emerging progressively. A user can make claims without building arguments. They can build arguments without constructing theories. But if formal evaluation is needed, the infrastructure supports it.

#### The Dialogue Protocol

The system implements a dialogue protocol that governs how participants interact. This is not merely a set of interface conventions; it is a formal protocol in the sense that moves have defined effects on the dialogue state.

The key move types are:

- **Assert**: Introduce a claim into the dialogue, adding it to the speaker's commitment store
- **Challenge**: Demand justification for a claim, creating an obligation for the claimant
- **Concede**: Accept an opponent's claim, adding it to one's own commitment store  
- **Retract**: Withdraw a previously asserted claim, removing it from one's commitment store
- **Argue**: Provide an argument in support of a claim, discharging a challenge
- **Attack**: Challenge an argument through rebuttal, undercut, or undermining

These move types are not arbitrary labels; they correspond to the moves defined in dialogue game theory. Their semantics are formal: an assertion creates a commitment; a retraction removes one; a challenge creates an obligation; an argument discharges one.

This formalization has practical consequences. The system can determine, at any point, what each participant is committed to, what questions remain unanswered, and what the state of each contested claim is. This makes the dialogue auditable in a way that unstructured discussion is not.

#### Visualization and Exploration

Reasoning structures are inherently graph-like — claims connect to claims, arguments attack arguments — and we've invested significantly in visualization that makes this structure navigable.

The primary visualization is an interactive argument graph that displays claims as nodes and inferential relations as edges. Users can expand and collapse regions, filter by participant or topic, and trace the path from conclusion to supporting premises.

We also provide what we call "deep dive" interfaces — panel-based explorations that allow users to investigate specific arguments, claims, or dialogue threads in detail. These maintain context while allowing focused attention.

The visualization layer is important because reasoning structures can become complex. A deliberation that produces fifty claims and thirty arguments is not unusual. Without effective visualization, this complexity becomes unmanageable. The goal is to make the structure legible at whatever scale the user needs.

---

### Part IV: The Civic Dimension

I want to spend the remaining time on what I consider the most important aspect of this work: its application to public and civic reasoning.

#### Why This Matters for Democratic Deliberation

The infrastructure problem I described at the outset is particularly acute for democratic deliberation. When citizens engage with policy questions — climate adaptation, healthcare reform, technology governance — they need to reason together about complex matters where evidence is contested, values conflict, and consequences are uncertain.

Current digital infrastructure actively impedes this. Social media platforms fragment discourse into disconnected reactions. Comment systems produce linear threads that cannot represent the structure of disagreement. Even dedicated deliberation platforms typically offer little more than organized comment sections.

What Mesh provides, in this context, is infrastructure for deliberation that:

**Preserves structure**: The argument graph persists. What was claimed, what was challenged, what was established — all remain visible and queryable. A citizen engaging with a policy question can see the full structure of the debate, not just the most recent contributions.

**Enables genuine disagreement**: Because attacks are typed and tracked, disagreement can be productive. It's not enough to simply oppose; one must specify *what* is being challenged and *how*. This raises the cost of cheap criticism while making substantive disagreement tractable.

**Creates accountability**: Commitment tracking means that positions are recorded. A participant cannot quietly abandon a claim; they must retract it. This changes the incentive structure — participants have reason to be careful about what they assert, because they will be held to it.

**Produces citable artifacts**: Deliberations generate outputs that can be referenced. A policy recommendation can cite the argument graph that supports it. A critic can point to the specific claim they dispute. This creates a paper trail for public reasoning.

#### The Formalization Gradient

A common objection to formal approaches in civic contexts is that they're exclusionary — that ordinary citizens can't be expected to engage with argument schemes and acceptability semantics.

This objection would be valid if we required formal engagement. We don't. The progressive formalization architecture means that citizens can engage at whatever level of formality suits their needs.

At the lightweight end, someone can simply make claims and discuss them — no more complex than any forum. The system captures structure in the background, but the user experience is conversational.

At the formal end, someone can construct ASPIC+ theories, specify preference orderings, and compute acceptability under different semantics. This is available for those who need it — policy analysts, for instance, or researchers studying the deliberation.

Between these extremes, there are intermediate levels: structured claims without formal arguments, arguments without full theories, scheme-identified reasoning without semantic evaluation. Users migrate up this gradient as complexity demands it.

This is crucial for civic application. Public deliberation involves participants with vastly different backgrounds and needs. Infrastructure that imposes uniform requirements will fail. Infrastructure that provides graduated structure can serve diverse participants while maintaining rigor where it's needed.

#### The Institutional Memory Function

I want to highlight one aspect that seems particularly important for civic contexts: the creation of institutional memory.

Democratic institutions are supposed to learn. Past deliberations should inform future ones. When a legislature debates a policy, that debate should be available to future legislators considering similar questions. When a community deliberates a zoning decision, the reasoning should persist for future reference.

In practice, institutional memory for reasoning is weak. Legislative debates exist as transcripts — searchable but not structured. Community deliberations often aren't recorded at all. Even when records exist, they're prose, which means that extracting the structure of reasoning requires reading and reconstruction.

Mesh produces structured records by default. Every deliberation creates an argument graph that represents not just what was concluded but how conclusions were reached. This graph can be queried: What were the main arguments for position X? What challenges were raised? What evidence was cited?

This has implications for democratic continuity. A new administration can review the reasoning of its predecessors. A community can see how past decisions were justified. Citizens can trace the evolution of public reasoning on persistent questions.

We are not claiming that this solves the problem of institutional memory. Many factors contribute to whether institutions learn. But the infrastructural capacity to preserve structured reasoning is a precondition for learning — and it's a precondition we don't currently meet.

#### The Transparency Imperative

A final point about civic application: transparency.

Public reasoning needs to be public. Decisions that affect citizens need to be justifiable to those citizens. This is both a normative principle and a practical requirement — without transparency, public trust cannot be maintained.

Mesh is designed with transparency as a default. Argument structures are visible. Commitment histories are queryable. The path from evidence to conclusion is traceable. This doesn't guarantee accountability, but it makes accountability possible in a way that current infrastructure does not.

There's a harder question about what transparency means when reasoning structures are complex. A fifty-argument graph is, in principle, transparent — everything is visible — but it may not be legible to a citizen without significant investment. We're still working on this. Summarization, guided exploration, and explanation generation are areas of active development.

But the basic point stands: infrastructure for public reasoning should produce reasoning that is, in principle, publicly inspectable. This is a design requirement that follows from the civic purpose of the project.

---

### Conclusion

Let me conclude by stepping back to the motivating question: What would it mean to build digital infrastructure that supports collective reasoning?

We've approached this question through argumentation theory because argumentation theory provides formal tools for representing and evaluating the structures of reasoning. We've implemented these tools in a production system that attempts to make them accessible through progressive formalization.

The result is not a complete solution to the problem of public reasoning. No technology is. But we believe it represents a genuine contribution: infrastructure that makes reasoning visible, persistent, and tractable in ways that current alternatives do not.

The larger ambition — a digital public sphere where reasoning accumulates rather than dissipates, where disagreements are productive rather than repetitive, where decisions can be justified through auditable argument structures — that remains aspirational. What we have built is a foundation. Whether it can bear the weight of that ambition remains to be seen.

But the need is real. Democratic societies require the capacity for collective reasoning. That capacity requires infrastructure. And building infrastructure is a task that someone must undertake. We are trying to undertake it.

Thank you. I'm happy to take questions.

---

## Appendix: Technical Specifications

For those interested in implementation details:

| Component | Specification |
|-----------|---------------|
| **Data Format** | AIF-compliant RDF/OWL, with JSON-LD serialization |
| **Scheme Library** | 60+ Walton schemes with critical question templates |
| **Semantic Framework** | ASPIC+ with grounded, preferred, and stable semantics |
| **Dialogue Protocol** | PPD-derived with assertion, challenge, concession, retraction moves |
| **Visualization** | React-based graph rendering with force-directed and hierarchical layouts |
| **Storage** | PostgreSQL with graph extensions; Redis for caching |
| **API** | REST with GraphQL overlay for complex queries |
| **Export Formats** | AIF-JSON, RDF/XML, DOT (for visualization), Markdown (for prose) |

The system is implemented in TypeScript (frontend and backend), with Python microservices for ML-enhanced features (scheme suggestion, summarization).

---

## References

Dung, P. M. (1995). On the acceptability of arguments and its fundamental role in nonmonotonic reasoning, logic programming and n-person games. *Artificial Intelligence*, 77(2), 321-357.

Prakken, H. (2010). An abstract framework for argumentation with structured arguments. *Argument & Computation*, 1(2), 93-124.

Rahwan, I., & Reed, C. (2009). The argument interchange format. In *Argumentation in Artificial Intelligence* (pp. 383-402). Springer.

Walton, D., Reed, C., & Macagno, F. (2008). *Argumentation Schemes*. Cambridge University Press.

Walton, D. N., & Krabbe, E. C. (1995). *Commitment in Dialogue: Basic Concepts of Interpersonal Reasoning*. SUNY Press.

---

*Presented at [Conference Name], [Date]*
