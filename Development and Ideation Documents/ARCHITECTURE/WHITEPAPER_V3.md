# Mesh: A Platform for Productive Online Discourse

**Infrastructure for Collective Knowledge Production through Publishing, Deliberation, and Curation** 
---

| | |
|---|---|
| **Author** | Rohan Mathur |
| **Contact** | rohan.kumar.mathur@gmail.com |
| **Version** | v0.1 |
| **Date** | 2025-12-16 |

---

**Abstract.** Mesh is a structured discourse system that represents conversation as a graph of typed entities. Claims exist as stable objects with unique identifiers. Evidence binds to assertions through explicit citation links. Challenges target specific premises, inferences, or conclusions rather than messages as a whole. The system supports progressive formalization: participants begin with informal discussion and introduce structure incrementally as complexity warrants. Multiple surfaces—publishing, curation, discussion, and deliberation—share a common foundation, so work performed in one context becomes available in others. Arguments constructed in one deliberation can migrate into related deliberations with provenance preserved. The network of deliberations forms a higher-level graph where cross-references, overlapping claims, shared sources, and imported arguments create explicit relationships. As participants contribute to this shared structure, the system accumulates institutional memory: conclusions traceable to their grounds and arguments available for reuse across contexts.

## 1. Introduction

Mesh provides infrastructure for collective inquiry. When groups need to coordinate around complex questions—evaluating policy options, analyzing technical tradeoffs, reaching shared conclusions—they require more than message exchange. They require a way to see the structure of a discussion: what has been claimed, what supports each claim, where disagreements lie, and what remains unresolved.

Mesh addresses this need by representing discourse as a graph rather than a sequence of messages. Every assertion promoted into the system becomes an addressable object. Every piece of evidence attaches explicitly to the claims it supports. Every challenge specifies its target: a premise, an inference step, or a conclusion. The result is a deliberation that participants can inspect, extend, and reference—a record that persists beyond the conversation and compounds over time.

The system is designed around progressive formalization. A discussion can remain informal indefinitely—real-time chat for coordination, threaded posts for durable exchange. When a thread becomes consequential, participants can introduce structure incrementally: promoting assertions into claims, attaching evidence, constructing arguments, and composing outputs. The platform accommodates both casual check-ins and multi-year institutional deliberations within the same architecture.

Mesh exposes multiple surfaces that share a common foundation. Publishing provides longform writing with annotation and deliberation hosting. Curation provides source collection with deduplication and citation workflows. Discussion provides informal exchange with upgrade paths to deliberation. Deliberation provides structured argument construction with artifact production. Discovery provides a feed of activity and a network of relationships across deliberations. These surfaces are entry points into the same underlying system, so claims created in one context can be cited, supported, challenged, and reused in others.

## 2. Claims

The foundation of structured discourse is the claim: a natural-language assertion promoted into a canonical entity with a unique identifier. A claim records its content, its author, and its creation context. Subsequent references point to the same object regardless of where the reference originates.

Claims can be connected to other claims via typed edges. A support edge indicates that one claim provides grounds for another. A rebuttal edge indicates direct opposition to a conclusion. An undercut edge indicates an attack on the inference step rather than the conclusion itself. An undermine edge indicates an attack on a premise. This vocabulary allows participants to specify precisely what they are challenging.

When a claim is refined, the original remains addressable and the refinement links back. When a claim is promoted from informal discussion, the source context is recorded. The system maintains provenance throughout, so the history of a claim—where it came from, how it evolved, who contributed—remains available for inspection.

Claims can carry a canonical identifier that persists across deliberations. When the same assertion appears in multiple contexts, the system can recognize the identity and surface the connection. This enables cross-context discovery: participants can ask where a claim has been discussed, what arguments have been constructed around it, and what conclusions different groups have reached.

## 3. Evidence

Evidence in Mesh is a first-class primitive. Sources—URLs, DOIs, uploaded documents—are canonicalized and deduplicated via content fingerprinting. A source uploaded twice resolves to the same canonical entity rather than fragmenting into duplicates.

Citations bind sources to claims and arguments through explicit links. A citation records the source, the target entity, and optional metadata: a locator specifying where in the source the relevant passage appears, a quotation, and an annotation. Citations attach polymorphically, so the same citation infrastructure works for claims, arguments, comments, and dialogue moves.

The evidence layer aggregates across contexts. A deliberation can query all citations attached to its claims and arguments, producing a bibliography that reflects actual usage rather than incidental mention. Sources can carry quality ratings that accumulate over time. The epistemic basis of a deliberation becomes auditable at the level of the room, not merely at the level of a single post.

Curation surfaces integrate directly with the citation pipeline. A curated collection of documents—a "stack"—can host a deliberation. Comments within the stack can be promoted into claims. Sources from the stack can be cited throughout the platform. The result is a seamless path from reading to evidence to argument.

## 4. Arguments

An argument in Mesh is an explicit inference from premises to conclusion, instantiated according to a scheme. Schemes—argument from expert opinion, argument from analogy, argument from consequences, and dozens of others—specify the form of the inference and expose critical questions that identify the vulnerabilities of that pattern.

Arguments connect claims through typed relationships. The premises of an argument are claims that provide grounds. The conclusion is a claim that the argument supports. The inference step is an explicit object that can itself be challenged. When a participant attacks an argument, they specify whether they are rebutting the conclusion, undercutting the inference, or undermining a premise.

Arguments arise as moves in a dialogue. The dialogue layer records provenance: who asserted what, when, in response to what. Move types include assertion, challenge, grounds, concession, and retraction. This structure allows the system to distinguish a live dispute from a resolved one, and to track the commitments participants have made.

Arguments can be composed into chains. A chain connects multiple arguments into a larger structure: a premise in one argument may itself be the conclusion of another. Chains can be visualized, exported, and converted into prose. They provide a way to represent extended lines of thought that span multiple inference steps.

## 5. Progressive Formalization

Mesh imposes minimal structure at the moment of writing. The discussion surface supports real-time chat for fast coordination and threaded posts for durable exchange. Participants can remain in informal mode indefinitely.

When complexity warrants structure, the system provides an upgrade path. A participant can promote a message into a proposition, refine it through endorsements and replies, and then promote it into a canonical claim. Once a claim exists, it can serve as a premise or conclusion in an argument. Once arguments exist, they can be composed into chains and exported as documents.

At each stage, the original informal content remains linked. The proposition records which message it was promoted from. The claim records which proposition it was promoted from. The argument records which claims it connects. Provenance flows through the system, so the history of a conclusion—the informal origins, the intermediate refinements, the formal structure—remains available for inspection.

This design reflects a constraint: structure should be introduced when it pays for itself, and not before. The cost of formalization is borne only when the cost of informality exceeds it.

## 6. Deliberation

A deliberation is a workspace for structured inquiry. Deliberations can be created for any host context: an article, a curated collection, a discussion thread. The deliberation provides a space where claims, arguments, and evidence are first-class objects, and where dialogue moves are recorded with explicit semantics.

Deliberations produce durable artifacts. Debate sheets map the positions participants have taken. Argument graphs can be visualized, filtered, and exported. Thesis documents compose conclusions into prose with citations and argument chains embedded. Knowledge base pages provide block-structured documents that remain live-linked to the claims and arguments they reference.

The steps to conduct a deliberation:

1) Participants enter discussion informally.
2) Assertions are promoted into claims when stability is needed.
3) Claims are connected to evidence via citations.
4) Arguments are constructed to link premises to conclusions.
5) Challenges are registered against specific claims or inference steps.
6) The deliberation produces artifacts—graphs, briefs, theses—as outputs.

Deliberations are tolerant of partial participation. If a participant does not contribute to a claim, they can still reference it. If a participant does not challenge an argument, the argument stands until challenged. The system does not require consensus; it requires that disagreements be represented explicitly so they can be inspected and addressed.

## 7. Cross-Context Migration

A deliberation does not exist in isolation. When a strong argument is constructed in one context, it should be possible to use that argument in a related context without reconstructing it from scratch.

Mesh supports cross-context migration through a mapping layer. A functor establishes correspondences between claims in a source deliberation and claims in a target deliberation. Once the mapping exists, arguments can be imported with provenance preserved. The imported argument carries lineage back to its origin and can be challenged, supported, or re-evaluated in the target context.

Migration is idempotent. An import operation computes a fingerprint of the argument and checks whether an equivalent import already exists. If it does, the operation is a no-op. This prevents duplication while allowing participants to reference the same external arguments repeatedly.

The migration layer treats deliberations as nodes in a higher-level network. Cross-references, overlapping claims, shared sources, and imported arguments all contribute edges to this meta-network. The network supports discovery—where has this claim been discussed?—and consistency checking—which deliberations reached conflicting conclusions?

## 8. Surfaces

Mesh exposes multiple surfaces that share the same underlying architecture.

**Publishing** provides longform writing with a rich-text editor, annotation support, and deliberation hosting. When an article is published, it appears as a discoverable post in the activity feed. Readers can attach comments to specific passages. The article can host a deliberation, so informal annotation and formal argument construction occur in the same context.

**Curation** provides document collection with source deduplication, citation workflows, and deliberation hosting. Users collect PDFs and links into stacks. Sources are fingerprinted to prevent duplicates. Citations attach to claims and arguments throughout the platform. Stacks can host deliberations, enabling groups to organize their reading and then reason about it in a structured way.

**Discussion** provides informal exchange with upgrade paths to deliberation. The discussion surface supports both real-time chat and threaded posts within the same container. When a thread becomes consequential, participants can upgrade to a deliberation without leaving the context. The informal discussion remains linked to the formal structure that emerges from it.

**Deliberation** provides the full structured inquiry experience: claims, arguments, dialogue moves, schemes, chains, and output artifacts. Deliberation is the shared upgrade target across surfaces. Articles, stacks, and discussions all route into the same deliberation infrastructure.

**Discovery** provides a feed of activity across the platform and a network visualization of deliberation relationships. The feed surfaces events—new claims, new arguments, new citations—so participants can stay aware of activity in contexts they care about. The network visualization (Plexus) displays deliberations as nodes and relationships as edges, enabling participants to browse the space of deliberations and identify connections.

## 9. Network

Deliberations form a network. When participants create cross-references between deliberations, the references become explicit edges. When claims overlap—the same canonical claim appears in multiple deliberations—the overlap becomes an edge. When arguments are imported from one deliberation into another, the import relationship becomes an edge. When deliberations share sources from the same curated stack, the shared reference becomes an edge.

The network supports several operations. Participants can browse the network to discover related deliberations. Participants can inspect the edges connecting two deliberations to understand how they are related. Participants can initiate a migration operation, establishing a claim mapping and importing arguments from one deliberation into another.

The network also supports consistency checking. When two deliberations reach conflicting conclusions about the same canonical claim, the conflict becomes visible. Participants can investigate the source of the disagreement: different premises, different evidence, different inference steps. The system does not automatically resolve conflicts, but it makes them explicit and inspectable.

Over time, the network becomes a map of collective inquiry. New deliberations can build on prior work by importing arguments rather than reconstructing them. Conclusions can be traced back through chains of inference to their original grounds. Institutional memory accumulates in the structure of the network itself.

## 10. Conclusion

Mesh provides infrastructure for structured discourse. Claims are stable objects with unique identifiers. Evidence binds to assertions through explicit citation links. Challenges target specific premises, inferences, or conclusions. Discussion can remain informal or upgrade to formal deliberation as complexity warrants. Multiple surfaces share a common foundation, so work performed in one context becomes available in others. Arguments can migrate across deliberations with provenance preserved. The network of deliberations forms a higher-level graph that supports discovery, reuse, and consistency checking.

The result is a system where collective inquiry compounds rather than resets. Conclusions can be traced to their grounds. Arguments can be reused across contexts. Disagreements can be localized to specific points of contention. Deliberations produce durable artifacts—graphs, documents, knowledge bases—that persist as institutional memory.

Future work includes composing migration mappings across multiple deliberations, improving semantic identity resolution beyond fingerprint matching, and extending the network visualization to represent the evolution of a deliberation over time.

## References

[1] C. Reed and D. Walton, "Argumentation schemes in dialogue," in *Dissensus and the Search for Common Ground*, 2007.

[2] F. Bex, J. Lawrence, M. Snaith, and C. Reed, "Implementing the Argument Interchange Format," in *Proceedings of COMMA*, 2012.

[3] D. Walton, C. Reed, and F. Macagno, *Argumentation Schemes*, Cambridge University Press, 2008.

[4] S. Modgil and H. Prakken, "The ASPIC+ framework for structured argumentation: a tutorial," *Argument & Computation*, vol. 5, no. 1, pp. 31-62, 2014.

[5] S. Ambler, "First order linear logic in symmetric monoidal closed categories," Ph.D. dissertation, University of Edinburgh, 1991.