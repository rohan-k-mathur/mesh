````markdown
# Mesh: A Structured Online Discourse System  
## An Ontology-Driven Framework for Publishing, Deliberation, and Cross-Deliberation Transport

**Author:** (your name / handle)  
**Contact:** (email / URL)  

**Version:** v0.1  
**Date:** 2025-12-16  
**Status:** Draft  

**Note.** This paper describes an implemented platform and its architecture. It is written in the style of a technical systems whitepaper (specification + mechanism), not as marketing collateral.

---

## Abstract

Online discourse provides raw bandwidth for collective reasoning, but the main benefits are lost because discourse is stored as unstructured text. Posts, threads, chats, and link collections can be read, but they cannot be composed, audited, or reused as reasoning. Claims cannot be referenced as stable objects, evidence cannot be attached as a primitive, and challenges cannot target the specific inferential steps they dispute.

We propose **Mesh**, a structured online discourse system that treats reasoning as a first-class artifact. Mesh represents discourse using an ontology of typed entities—claims, arguments, sources, citations, and dialogue moves—so that assertions can be grounded in evidence, disputes can be localized to premise versus inference versus conclusion, and deliberations can yield durable outputs. The system is **progressively formalized**: participants can begin with casual discussion and upgrade, when needed, into formal deliberation without changing tools or losing provenance.

Mesh is implemented as an ecosystem of interacting surfaces—publishing, library, discussions, deliberation, and discovery—sharing a common substrate. Published articles appear as discoverable posts in a social feed, while also serving as hosts for embedded deliberation. Sources and citations are deduplicated and resolved through a fingerprinted pipeline, and citations attach polymorphically to multiple reasoning objects. Deliberations connect into a meta-level network (“Plexus”) that visualizes cross-references and supports argument transport with provenance.

We describe the system’s design goals, shared primitives, surface-specific affordances, and the mechanisms that allow reasoning to compound across deliberations rather than dissipate.

---

## 1. Introduction

Online discourse has become the default medium for institutional reasoning. Organizations decide policy in comment threads, build strategy in chat logs, and litigate technical questions in issue discussions and social feeds. The tools work well enough for communication, but they suffer from the inherent weaknesses of a text-based model.

Text streams are not reasoning artifacts.

Email threads, forum replies, and chat messages flatten argument into chronology. Claims become buried inside paragraphs. Evidence becomes a link without a stable relationship to the statement it is meant to support. Disagreements recur because there is no canonical object to reference—only another message to quote. And when a dispute happens, participants cannot easily specify what they disagree with: the premise, the inference, or the conclusion.

In parallel, the modern discourse stack has fragmented into specialized platforms: longform publishing, fast social feeds, chat servers, collaborative libraries, and separate deliberation or education tools. Each provides part of the solution, but the main benefits are lost if the system cannot preserve and compose reasoning across contexts. A reader can follow a link from an essay into a comment thread, then into a chat log, then into a separate document—but the result is still a pile of text.

What is needed is an online discourse system in which:

- **Statements can be made addressable** (so they can be referenced, revised, or contested without ambiguity).
- **Evidence can be attached as a primitive** (so citations accrue to claims and arguments, not just posts).
- **Disputes can target structure** (so an undercut of an inference is distinguished from an attack on a premise).
- **Conversation can upgrade into deliberation** (so informality is preserved until formal structure is necessary).
- **Outputs can persist** as durable artifacts that can be searched, exported, and reused.
- **Reasoning can travel across contexts** (so a good argument can be transported into a new deliberation with provenance preserved).

In this paper we propose **Mesh**, a structured online discourse system designed around those requirements.

### 1.1 Mesh as an ecosystem, not a single surface

Mesh is not “a forum,” “a publishing site,” or “a deliberation tool” considered in isolation. It is an ecosystem whose surfaces are designed to interoperate through a shared substrate:

- **Publishing (Articles):** Longform writing that can participate in the same discourse substrate as discussion and deliberation. When an article is published, it appears as a discoverable post in the home feed rather than living outside the discourse graph.
- **Discussions (Chat + Forum):** A dual-mode container in which participants can switch between real-time chat and threaded forum discussion, while retaining the ability to upgrade to formal deliberation.
- **Library (Stacks + Sources + Citations):** A system for collecting, deduplicating, and citing sources across discourse objects. Sources are resolved via a normalization + fingerprint pipeline, preventing duplicates and enabling consistent attribution. Citations attach polymorphically to target entities (e.g., claim, argument, comment, move), allowing evidence to remain connected as reasoning is transformed.
- **Deliberation (Agora):** A formalization target: a deliberation can be spawned from multiple host contexts and produces structured artifacts (e.g., debate sheets) suitable for evaluation, export, and reuse.
- **Discovery + Cross-Deliberation Network (Plexus):** A meta-level network connecting deliberations via cross-references, overlaps, and imports, supporting explicit transport of arguments between rooms with provenance.

This paper’s central claim is that these surfaces should not be separate products stitched together by links. They should be different entry points into the same structured discourse substrate.

### 1.2 Progressive formalization as the default operating mode

Mesh imposes minimal structure at the moment of writing. A discussion can remain casual, fast, and human. However, when a thread becomes consequential—when participants need to cite sources, isolate disagreements, or produce a decision artifact—the system supports upgrading the same content into formal deliberation.

This is not a separate “mode” that requires moving to another platform. Discussions, longform publishing, and the library system all integrate with deliberation creation and evidence attachment pathways.

### 1.3 Evidence-native discourse

In typical online discourse, citations are informal: a URL pasted into a comment, or an inline quote without a canonical source object. Mesh makes sources and citations first-class.

In the library subsystem, sources can originate from URLs, DOIs, or internal library posts, are normalized and fingerprinted for deduplication, and can be rated/annotated over time. Citations attach to many target types via a polymorphic `(targetType, targetId)` pattern, allowing the same evidence graph to remain valid as discourse is transformed into claims, arguments, and dialogue moves.

Moreover, deliberations can expose aggregated views of evidential usage—sources used, citation counts, unique users, and rating summaries—so a deliberation’s epistemic basis can be audited at the level of the room, not merely at the level of a single post.

### 1.4 From conversation to artifacts that persist

Most platforms treat discourse as consumable: posts and comments are read, reacted to, and buried. Mesh treats discourse as productive: it should yield artifacts that persist beyond the conversation.

In practice, this means that when content is promoted into the deliberation substrate, it becomes addressable and composable. For example, a library comment can be “lifted” into a deliberation claim while recording provenance as a dialogue move (e.g., `ASSERT`), making the promotion machine-actionable rather than purely editorial.

At the ecosystem level, Mesh further treats deliberations as nodes in a network. Plexus visualizes cross-room relationships and supports transport actions—copying arguments between rooms and creating explicit links—so reasoning can compound across deliberations rather than restart from scratch.

### 1.5 Roadmap of this paper

The remainder of this paper proceeds as follows:

- **Section 2** states design goals and non-goals (including the ecosystem stance and progressive formalization posture).
- **Section 3** gives a system overview of the five primary surfaces and the artifacts each produces.
- **Section 4** defines the shared substrate: deliberations as an upgrade target, evidence/citations, core structured discourse primitives, and discovery/distribution mechanisms.
- **Sections 5–10** present the subsystem packages (Publishing, Library/Stacks, Discussions/Chat, Agora/Deliberation, and Plexus/Discovery) using a consistent template: problem framing, Mesh stance, core objects, primary user flows, outputs, integration points, and implementation notes.
- **Section 11** concludes.

---

## 2. Design goals and non-goals

Mesh is not a single-purpose tool. It is a shared substrate for structured reasoning, exposed through multiple surfaces (publishing, curation, discussion, deliberation, discovery). The goal is that each surface is useful on its own, but that they interoperate by default—so reasoning can move between contexts without being rewritten or flattened into unstructured text.

### 2.1 Design goals

1. **Structured discourse as a first-class artifact.**  
   A claim should be referenceable, inspectable, and reusable the way a document or code module is. Mesh treats discourse outputs (claims, arguments, objections, evidence linkages, summaries) as durable objects rather than transient messages.

2. **Progressive formalization.**  
   Most communication begins informal; only some parts need to become formal. Mesh is designed so a conversation can begin in discussion/chat and progressively upgrade into propositions, claims, arguments, and higher-order artifacts like theses and knowledge-base pages.

3. **Deliberation as a shared upgrade target across surfaces.**  
   Articles, stacks, discussions, rooms, and KB pages should all be able to host deliberation without creating separate, incompatible debate systems. Multiple entry points route into a common deliberation hub.

4. **Evidence-native discourse.**  
   Citations and sources are not formatting; they are primitives. The library system models sources as canonical objects (with fingerprinting/deduplication) and citations as structured links that can attach to many target entity types. This allows evidence to aggregate and persist across contexts.

5. **Composable outputs, not just conversations.**  
   Deliberation should produce artifacts that can be exported, embedded, or cited elsewhere: debate sheets, argument graphs, chains, issue trackers, thesis documents, and knowledge-base pages.

6. **Interoperability via explicit semantics and shared ontologies.**  
   Structured argument graphs should be exportable and analyzable as graphs (not only readable as prose). The deliberation layer uses an interchange-friendly representation to make the reasoning substrate transferable.

7. **Ecosystem stance without fragmentation.**  
   Mesh aims to avoid the toolchain tax where publishing, discussion, citation management, debate mapping, and synthesis live in separate products with lossy handoffs. Instead, Mesh provides multiple surfaces over shared objects.

### 2.2 Non-goals

1. **Mesh does not assume consensus is always achievable or desirable.**  
   The system focuses on making disagreements legible (what is claimed, what supports it, what is attacked, and where uncertainty enters), not on forcing convergence.

2. **Mesh is not “formal logic everywhere.”**  
   Progressive formalization is a constraint: structure is introduced when it pays for itself. Informal discussion remains a first-class mode, and deliberation remains optional until needed.

3. **Mesh is not primarily an engagement-optimization product.**  
   Discovery and feeds exist to distribute artifacts, but the core design goal is composability and traceability of reasoning, not maximizing time-on-site.

4. **Mesh does not claim a universal solution to identity, governance, or moderation.**  
   The platform exposes hooks and surfaces where governance can be applied (e.g., room contexts, discussion policies, deliberation rules), but this paper does not attempt to solve governance as a single mechanism.

---

## 3. System overview

Mesh is composed of five interacting surfaces. Each surface is a complete user experience, but each one also acts as an entry point into the same reasoning substrate centered on deliberations.

A useful way to picture the system is:

```text
   Articles        Stacks/Library        Discussions/Chat
      │                │                     │
      ├───────────┬────┴───────────┬─────────┤
                  ▼                ▼
          Deliberation (Agora / DeepDivePanel)
                  │
                  ├── Outputs: thesis, issues, analytics, KB pages, chains
                  │
                  ▼
         Discovery + Cross-deliberation network (Plexus)
````

### 3.1 Articles

**Purpose.** Publishing-native longform writing with an explicit path into structured deliberation (i.e., discourse can become structured). Articles support rich text, comments, annotation, and integration with deliberations.

**Primary artifact.** A published article (and its annotation/comment activity) that can spawn or host deliberation.

**Deliberation integration.** The article surface can create or retrieve a deliberation keyed to the article context via typed host identity.

**Distribution.** Published articles can appear in the home feed as an `ARTICLE` post type with structured payload (title, authors, tags, counts).

### 3.2 Stacks and Library

**Purpose.** Curation-native knowledge organization: users collect PDFs, links, notes, and other items into structured libraries, then attach citations/evidence into deliberations. The library subsystem provides citation workflows and evidence aggregation as a shared service.

**Primary artifacts.**

* A **Stack** (curated collection + metadata).
* Canonical **Sources** (deduplicated) and **Citations** (polymorphic targets).
* Cross-deliberation **stack references** connecting deliberations through shared evidence/curation.

**Deliberation integration.** Stacks can host deliberations under `hostType: "library_stack"`, enabling lift-to-debate flows from library content into deliberation.

**Distribution.** Library/stack activity can appear in the feed as a `LIBRARY` post type.

### 3.3 Discussions and chat

**Purpose.** A casual forum/chat hybrid for preliminary conversation, with explicit affordances for escalation into deliberation. The surface is intentionally dual-mode: real-time chat for fast iteration, and forum-style threaded posts for durable exchange.

**Primary artifacts.**

* A **Discussion** container with chat + forum modes.
* A stream of messages/posts (including cross-mode replies and quoting).
* Optional bridges into deliberation when the thread needs structure.

**Deliberation integration.** A “Deliberate” action can ensure/create a deliberation for the discussion context and route into the deliberation hub.

**Real-time affordances.** Presence and typing indicators are implemented via real-time channels.

### 3.4 Deliberation engine

**Purpose.** The structured reasoning surface where claims, arguments, attacks/defenses, commitments, and synthesis artifacts are constructed and evaluated.

**Primary artifacts.**

* Debate sheets (structured positions/intents),
* explicit argument graphs (interchange-friendly),
* argument chains,
* commitment and issue tracking,
* thesis composition and analytics.

**Role in the platform.** Deliberation is the shared upgrade target across entry points (discussions, articles, stacks, rooms, KB pages).

### 3.5 Discovery and cross-deliberation network

**Purpose.** Discovery is not just a feed; it is also a graph of relationships between deliberations, claims, arguments, sources, and curated structures. Plexus is the network layer that makes reasoning transportable across contexts.

**Primary artifacts.**

* Feed posts for articles and library activity,
* cross-deliberation edges (transport/relatedness),
* higher-level network structure for browsing and retrieval.

**Graph stance.** Plexus treats the system as typed objects connected by typed edges (e.g., `xref`, `overlap`, `stack_ref`, `imports`, `shared_author`).

---

## 4. The common substrate

The five surfaces above are intentionally different interaction models. The coherence of Mesh comes from the fact that they share a substrate: common IDs, common evidence primitives, and a common deliberation upgrade target.

### 4.1 Deliberations as a shared upgrade target

A deliberation is the deep structure a surface can route into when discourse needs explicit reasoning objects. Multiple host contexts can ensure/create a deliberation and then open the same deep-dive experience.

In the implemented system, deliberation creation is explicit and host-typed:

* identify a host `(hostType, hostId)`
* ensure a deliberation exists for that host
* route into the deliberation panel

Host typing is not merely descriptive; it is an integration boundary. Articles, discussions, inbox threads, and stacks can each be deliberation contexts by virtue of host typing. When a deliberation is created, it can also seed scaffolding such as room context and debate sheet.

### 4.2 Evidence, citations, and sources

Mesh treats evidence as a structured layer that multiple surfaces can contribute to and multiple deliberations can reuse.

**Sources are canonical objects.**
A source has a stable identity (fingerprint), normalized location (URL/DOI/etc.), type, and metadata. Fingerprinting and normalization prevent evidence from fragmenting into duplicates.

**Citations are structured links.**
A citation records `sourceId` plus a polymorphic `(targetType, targetId)` pair, enabling citations to attach to many reasoning objects rather than being confined to a single content type.

**Evidence aggregates at the deliberation level.**
Deliberations can expose an evidence list summarizing sources used, usage counts, and related metadata—so evidence can be audited and reused at the room level.

**Confidence is compositional.**
Confidence can be computed and propagated using explicit aggregation modes (e.g., product/minimum/belief intervals), rather than inferred from prose alone.

### 4.3 Core structured discourse primitives

The package sections will go deep on schemes, attacks, dialogue protocols, and evaluation. Here we define only the substrate-level primitives required for cross-surface composition.

1. **Propositions and claims.**
   Text can be workshopped into explicit propositions and promoted into canonical claims with stable identity.

2. **Arguments as explicit graph objects.**
   The deliberation system represents arguments as graph structure, enabling composition, export, and independent analysis.

3. **Dialogue moves as provenance.**
   Assertions, challenges, concessions, and retractions are recorded as structured moves so the system can preserve “who did what” and support commitment and audit.

4. **Progressive deliberation as the organizing principle.**
   The system is a ladder: discussion → proposition → claim → argument → synthesis artifacts.

### 4.4 Discovery and distribution mechanisms

Mesh needs a way for structured artifacts to circulate without collapsing back into unstructured posts. The substrate therefore includes explicit distribution objects.

**Feed posts are typed artifacts.**
Articles appear as `ARTICLE` feed posts with structured payload; library activity appears as `LIBRARY` feed posts with structured payload.

**Discovery is complemented by cross-deliberation structure.**
Plexus is modeled as a typed network over deliberation-relevant entities, supporting argument transport and context reuse. Discovery can therefore be informed by explicit structure, not only engagement signals.

---

## 5. Bridge: Packages as lenses on a single substrate

The previous sections described Mesh at the umbrella level: a set of public-facing surfaces coupled to a shared reasoning substrate. The remainder of this paper treats each surface as a lens—a way of entering the same underlying system.

The purpose of the package sections is not to introduce unrelated feature sets. It is to show how distinct online activities—writing, reading, collecting sources, commenting, debating—can all be expressed as operations over shared primitives (sources, citations, claims, arguments, deliberations), while preserving the local ergonomics of each surface.

Accordingly, each package section follows the same structure:

1. Problem framing (failure mode of the incumbent category)
2. Mesh stance (what is treated as first-class)
3. Core objects (minimal entities the surface adds)
4. Primary user flows (end-to-end)
5. Outputs/artifacts (what persists)
6. Integration points (how it plugs into deliberation, evidence, discovery)
7. Implementation notes (optional)

Packages B and C establish two complementary entry points into structured discourse: writing-native (articles) and reading/evidence-native (stacks/library). Packages D and E then show how informal conversation upgrades into formal deliberation. Package F shows how deliberations connect into a network so reasoning can travel.

---

## 6. Package B: Publishing-native — Articles

### 6.1 Problem framing

Longform publishing systems reliably produce text, but they do not reliably produce structured discourse around the text. The dominant interaction loop is: publish → comment → forget. Responses and critiques are mostly untyped, hard to cite, and difficult to transport into other contexts (e.g., a later debate, a knowledge base page, or a decision record). Even when annotation exists, it often remains a local comment layer rather than an upgrade path into claims, evidence, and deliberation.

### 6.2 Mesh stance

Mesh treats publishing as a first-class host for structured discourse. An article is not only a rendered document; it is a durable object that can host deliberation and that can appear as a discoverable unit in a social feed.

### 6.3 Core objects

* **Article:** longform document with draft→publish lifecycle and revision history
* **Template:** layout preset affecting rendering, not semantics
* **Anchors/threads:** anchored comment threads attached to text selections
* **Deliberation host context:** an article can host deliberation
* **FeedPost (`ARTICLE`):** typed distribution object pointing back to the canonical article

### 6.4 Primary user flows

#### 6.4.1 Draft → edit → autosave → publish

The publishing lifecycle is modeled as draft creation, iterative editing with autosave, and publication with durable outputs.

Publication turns an editable draft into a stable artifact by:

1. validating ownership
2. resolving final title
3. generating slug
4. computing excerpt and reading time
5. setting article status to published
6. creating a revision snapshot
7. (optionally) creating a feed post

#### 6.4.2 Annotation-native reading (selection → thread)

Readers can attach discussion directly to passages via anchored threads. This establishes a low-friction discourse layer: informal commentary remains local, but it is structurally positioned (anchored) and therefore upgradeable.

#### 6.4.3 Article → feed distribution

When an article is published, Mesh can create a corresponding `FeedPost` with `type: ARTICLE`, enabling the article to appear in the home feed as a discoverable unit without severing provenance.

### 6.5 Outputs and artifacts

* Published article page (server-rendered where appropriate)
* Revision snapshots
* Anchored annotation threads
* `ARTICLE` feed posts
* A stable deliberation host context for progressive formalization

### 6.6 Integration points

* Articles can host deliberations (upgrade target)
* Portable content representation supports reuse and export
* Feed integration distributes the artifact while preserving canonical identity

### 6.7 Implementation notes

The article surface is separated into editor/reader/dashboard concerns and designed for server-first rendering with optimistic updates. A practical implementation uses a rich-text editor AST for durable storage and replay.

---

## 7. Package C: Curation- and evidence-native — Stacks & Library

### 7.1 Problem framing

Most discourse systems make evidence optional and citations incidental. People paste links, upload PDFs, quote screenshots, and accumulate source lists, but the system does not deduplicate sources, does not track where a source was used, and does not make citations transportable across conversations. The result is that evidence cannot compound: every debate rebuilds its bibliography from scratch, and every reading group becomes a local, non-reusable folder.

### 7.2 Mesh stance

Mesh treats sources and citations as first-class objects. Stacks are not merely folders; they are a curation surface tightly coupled to deliberation, such that evidence-based argumentation is a native capability rather than an add-on.

### 7.3 Core objects

* **Stack:** curated collection
* **LibraryPost:** document item (e.g., PDF) with metadata/preview
* **Source:** canonical reference entity (URL, DOI, or library-backed)
* **Citation:** structured link from a source to a target entity
* **Deliberation host type (`library_stack`):** stacks can host deliberation
* **StackReference edges:** cross-deliberation linking via shared curation

Architectural commitments:

* **Polymorphic citations:** a single citation model can target multiple entity types
* **Source deduplication:** fingerprints (e.g., SHA-1) prevent duplicates by construction

### 7.4 Primary user flows

1. **Upload** into a stack (creates library item)
2. **Organize** (reorder/curate)
3. **Discuss** (thread attached to stack/library artifact)
4. **Cite** (resolve citation → canonical source, attach to target)
5. **Lift** (promote comment/content into deliberation objects)
6. **Deliberate** (deliberation UI consumes evidence aggregation)
7. **Share** (stack activity can be distributed via `LIBRARY` feed posts)

#### 7.4.1 Citation resolution (deduplication by construction)

To avoid source fragmentation, Mesh computes fingerprints over normalized identifiers (DOI/URL/library) and canonicalizes URLs (e.g., removing fragments and tracking parameters).

#### 7.4.2 Quick cite vs. detailed cite

The system supports both quick citations (low friction) and detailed citations (with locator/quote/note). This mirrors progressive formalization on the evidence surface: add minimal structure first, refine when necessary.

#### 7.4.3 Evidence aggregation for deliberation

Evidence is aggregated across a deliberation’s claims and arguments so the room can expose an evidence list summarizing sources used, frequency, and metadata.

### 7.5 Outputs and artifacts

* Curated stacks of source documents
* Canonical sources with normalization/deduplication
* Polymorphic citations attaching evidence to many target types
* Evidence aggregates suitable for auditing and reuse
* Stack-hosted deliberations (`library_stack`) enabling structured debate around a bibliography

### 7.6 Integration points

* Deliberation hosting via `library_stack`
* Lift-to-debate as a concrete upgrade path
* Feed integration via `LIBRARY` posts
* Event-driven updates support real-time synchronization

### 7.7 Implementation notes

The library layer benefits from server-first operations, optimistic updates, reuse of feed-thread infrastructure for comments, and event-driven synchronization.

---

## 8. Package D: Discussions and Chat

### 8.1 Problem framing

Online discourse tools typically force an early choice between two modes:

* Threaded, durable writing (forums, Reddit-style posts) that supports long-lived topics but tends to move slowly, with weak coordination, weak provenance, and little structured upgrade path.
* Real-time chat (Discord/Slack-style streams) that supports fast coordination but is highly ephemeral, hard to search, and difficult to cite or reuse as institutional memory.

In practice, important reasoning happens across both modes. People sketch hypotheses in chat, refine them in threads, and then attempt to summarize the result in a separate document. This produces fragmentation: the conversation lives in one place, the final writeup in another, and neither cleanly references the reasoning steps that produced it.

Mesh treats this as an infrastructure mismatch: the medium offers message exchange, but not durable reasoning artifacts.

### 8.2 Mesh stance

Mesh implements **Discussions** as a single surface that deliberately spans both regimes: forum-like posts and real-time chat messages inside one conceptual container, supported by a dual-mode backend.

The key property is that a Discussion is not the end of discourse. It is designed as a front-door to progressive formalization: a discussion can remain informal indefinitely, or it can be upgraded—selectively, and without rewriting—into deliberation objects (propositions, claims, arguments) when the group needs structure.

### 8.3 Core objects

* **DiscussionView:** unified container with two panes

  * ForumPane (threaded posts)
  * ChatPane (real-time messages)
* **DiscussionPost / ChatMessage:** first-class objects within a single container
* **ReplyTarget:** polymorphic replies across object types (cross-mode structure)
* **Drift / DriftReply:** side conversations anchored to a parent context, designed to be resolvable/summarizable back into the main line

### 8.4 Primary user flows

1. **Threaded exchange (forum mode)**
2. **High-tempo exchange (chat mode)**
3. **Cross-mode replies** via ReplyTarget
4. **Drift creation and resolution** (capture divergence without derailing the main thread)
5. **Upgrade to deliberation** via a Deliberate action bound to the same host context

### 8.5 Outputs and artifacts

* Threaded posts and chat history in a shared container
* Drift threads that explicitly capture divergence
* A provenance-preserving upgrade path into deliberation (discussion remains referenceable after upgrade)

### 8.6 Integration points

Access control and audience should be consistent across surfaces so discussions can be embedded in deliberations, referenced by articles, and routed into discovery without one-off access semantics.

### 8.7 Implementation notes

The architecture is a forum/chat hybrid with a dual-mode backend and real-time broadcasting so the discourse graph remains coherent across participants and across time.

### 8.8 Bridge: From discussion to deliberation

Discussions capture the full bandwidth of ordinary communication: fast chat for coordination, threaded posts for durable exchange, and side threads (drifts) for divergence. This is where most discourse begins, and it is where most discourse should remain until the cost of ambiguity becomes higher than the cost of structure.

But the failure mode of discussion-first systems is predictable. As a topic becomes consequential, participants need more than replies: stable referents (claims), explicit connections (evidence and inference), and a way to localize disagreement (premise vs. inference vs. conclusion). When those objects do not exist, the conversation either stalls or produces an outcome that cannot be justified later.

The deliberation engine exists to solve that infrastructural gap. Progressive formalization is the handoff: discussions can upgrade into deliberations when complexity warrants it, without discarding the original discourse.

---

## 9. Package E: Agora — Formal deliberation as a public utility

### 9.1 Problem framing

Public discourse infrastructure is optimized for engagement and throughput, not deliberation. Even when participants are acting in good faith, the medium makes it difficult to connect evidence to claims, connect claims to arguments and counterarguments, and connect the evolving structure of disagreement to durable outcomes that can be cited and audited.

The result is not merely “bad comments.” It is a structural failure mode: reasoning collapses into unstructured text, institutional memory decays, and outcomes cannot be justified in a way that communities can reuse.

What is needed is deliberation infrastructure: a way for groups to reason in public (or within bounded communities) while producing artifacts that persist beyond the conversation.

### 9.2 Mesh stance

Mesh implements the **Digital Agora** as a deliberation engine that treats reasoning as infrastructure, not as a byproduct of text.

Agora provides four essential capabilities:

* **Structured claim management** with stable identifiers and typed relationships (including distinctions among how something is challenged).
* **Scheme-based argumentation** with critical questions surfaced as explicit vulnerability points.
* **Dialogue protocol enforcement**: assertions, challenges, concessions, and retractions are first-class moves with provenance.
* **Composable outputs**: deliberations generate thesis documents, KB pages, and exportable graphs as institutional memory.

Progressive formalization is a central requirement: not every conversation needs full formality, but the system must make formality available as an upgrade path when complexity demands it.

### 9.3 Core objects

Agora’s core model can be understood as three layers:

1. **Claims & Evidence:** propositions, claims, claim edges, evidence links
2. **Arguments & Dialogue:** arguments, schemes, critical questions, dialogue moves, commitments, chains
3. **Outputs & Artifacts:** thesis documents, debate sheets, KB pages, briefs, and related composition artifacts

### 9.4 Primary user flows

The canonical flow is intentionally incremental:

1. Enter discussion (informal)
2. Compose proposition (with evidence)
3. Workshop (votes/endorsements/replies)
4. Promote proposition to claim (canonical atom)
5. Upgrade to deliberation (full deliberation space)
6. Compose argument (scheme + critical questions)
7. View/filter arguments
8. Attack/defend (rebut / undercut / undermine)
9. Build argument chains
10. Track commitments
11. Create thesis (structured document)
12. View analytics
13. Manage issues/objections

### 9.5 Dialogue-first semantics

A key design choice is that arguments do not exist as free-floating objects: they arise as moves in a dialogue. The system records who said what, when, and in response to what, using a constrained vocabulary of move types (e.g., `ASSERT`, `WHY`, `GROUNDS`, `CONCEDE`, `RETRACT`, `CLOSE`) as the operational semantics of discourse.

This is how Agora avoids collapsing disagreement into undifferentiated replies.

### 9.6 AIF-centric structure

Agora’s argument graph representation separates informational content, inference application, conflict relations, preference/ordering, and dialogue moves. This separation allows the system to distinguish attacks on content from attacks on inference steps and to export graphs for independent analysis.

### 9.7 Outputs and artifacts

Deliberation is only valuable if it leaves behind reusable products. Agora therefore produces multiple artifact types, each designed for different publication needs:

* Thesis documents (structured composition)
* Theory-oriented longform analyses
* Debate sheets (mapped dispute structure)
* KB pages (block-based pages live-linked to claims/arguments)
* Briefs (generated summaries)
* Glossary terms (local definition layer)

These artifacts link back to the underlying reasoning graph rather than merely quoting it, so updates can propagate while preserving provenance.

### 9.8 Interfaces as system architecture

Agora is surfaced through an orchestration UI that binds claims, dialogue, arguments, evidence, and outputs into a single manipulable object space rather than separate tools.

### 9.9 Implementation notes

Agora is implemented with explicit API surfaces for core subsystems (moves, claims/edges, arguments/diagrams, graph operations). Uncertainty is treated as first-class (confidence, aggregation modes, time decay) to distinguish supported conclusions from tentative hypotheses within the same deliberation space.

---

## 10. Package F: Mesh Plexus — A meta-network of deliberations for transportable discourse artifacts

### 10.1 Problem framing

The unit of discourse on today’s internet is the post, the thread, or the server. The unit of progress is the argument: a claim connected to evidence via an inference that can be challenged, repaired, and reused. When arguments cannot travel, knowledge does not scale—only attention does.

A compounding discourse system must treat debates as addressable artifacts and must support explicit relationships between them: references, overlaps in claims, shared source collections, and imports of prior reasoning. It must preserve provenance, because reuse without traceability collapses into authority-by-assertion.

### 10.2 Mesh stance

Mesh implements **Plexus**, a meta-level network layer that connects deliberation rooms and supports explicit linking and transport operations across contexts.

Deliberations do not remain isolated endpoints. They become nodes in a higher-level structure that supports:

* discovery (“where has this claim been debated?”)
* reuse (“import arguments from a related room”)
* consistency checking (“which rooms reached conflicting conclusions?”)

### 10.3 Core objects

At the Plexus layer, the essential primitives are:

**Network nodes and edges.**

* **RoomNode:** a deliberation room with summary metrics (counts, tags, update time, acceptance distribution)
* **MetaEdge:** a typed link between rooms with kind and weight

Edge kinds are a closed set:

* `xref`, `overlap`, `stack_ref`, `imports`, `shared_author`

Each edge kind corresponds to a concrete source of truth (e.g., explicit cross-references, shared canonical claims, shared stacks, imported arguments, shared contributors).

**Transport primitives.**

* **RoomFunctor:** a mapping of claims from room A to room B
* **ArgumentImport:** a provenance-carrying record of imported arguments, including fingerprint idempotency

### 10.4 Primary user flows

#### 10.4.1 Discover and inspect the network

Plexus can be presented as multiple views (graph/board/matrix) to support browsing at different densities.

From the network view, a user can:

* open a room in the deliberation hub
* create an explicit cross-reference link
* initiate transport (“copy arguments between rooms”)

#### 10.4.2 Link rooms

A Link action creates a typed `xref` relation between rooms. This avoids reducing cross-context reuse to URL paste.

#### 10.4.3 Transport arguments (A → B)

Transport is an explicit workflow:

1. map claims (A → B)
2. preview import proposals (fingerprinted for idempotency)
3. apply imports (materialize selected imports with provenance)

Transport is not copy/paste text. Imported arguments carry lineage back to their source deliberation and are represented as objects that can be challenged, supported, or re-evaluated in the target room.

#### 10.4.4 Virtual vs. materialized imports

The system supports:

* **virtual imports** (read-only references)
* **materialized imports** (local copies as first-class objects)

Virtual imports allow reuse without duplication until duplication is needed.

### 10.5 Outputs and artifacts

* Queryable room graph (rooms + edges)
* Typed relationships expressing how rooms are related
* Transport records (claim mappings and imported-argument provenance)

These artifacts enable reasoning to compound across deliberations rather than resetting per thread.

### 10.6 Integration points

* Stacks and evidence contribute `stack_ref` edges, connecting reading/curation to debate reuse.
* Room-level metrics can inform discovery and navigation using reasoning structure, not only engagement.
* Imported arguments become visible to the deliberation engine and can be evaluated under local premises and preferences.

### 10.7 Implementation notes

Plexus is backed by a dedicated network API and a typed edge vocabulary. Transport is implemented as a small suite of endpoints supporting mapping, preview, and apply/materialize. Current implementation status includes claim mapping, preview proposals, virtual/materialized imports, and fingerprint idempotency, with future work focused on composing transport maps across multiple rooms and improving semantic identity resolution.

---

## 11. Conclusion

We have described Mesh as a structured online discourse system built as an ecosystem of interoperable surfaces: publishing, curation, discussion, deliberation, and discovery. The core premise is that discourse should not terminate in unstructured text. It should yield durable objects—claims, citations, arguments, challenges, and composed outputs—that can be referenced, audited, and extended.

Mesh addresses three recurrent failures of online reasoning infrastructure:

1. **Unstructured text cannot be composed.**
   Mesh treats reasoning as a first-class artifact and supports progressive formalization so casual discourse can upgrade into structured deliberation without switching tools.

2. **Evidence does not bind to claims.**
   Mesh makes sources and citations canonical primitives, enabling evidence tracking and reuse across contexts rather than per-thread link dumping.

3. **Discourse does not compound.**
   Mesh introduces a cross-deliberation network (Plexus) and transport mechanisms that allow arguments to move between deliberations with provenance preserved.

In this architecture, the platform is not a feed or a comment section. It is the substrate that turns writing, reading, discussion, and debate into interoperable operations over shared objects. The long-term payoff is institutional memory: a system where conclusions can be traced back to evidence and where strong arguments can be transported forward rather than rewritten from scratch.

Future work follows naturally from the current implementation: composing transport maps across multiple rooms, improving semantic identity resolution beyond fingerprints, and extending Plexus to represent the evolution of a debate over time.

---

```

If you want, I can also output this as a ready-to-drop-in file name (e.g. `MESH_CANONICAL_WHITEPAPER.md`) with a matching internal “References (Internal Architecture Docs)” section appended at the end for your repo conventions.
```
