# Mesh: A Platform for Structured Online Discourse

**An Architecture for Structured Discourse and Durable Knowledge Production through Publishing, Deliberation, and Curation** 
---

| | |
|---|---|
| **Author** | Rohan Mathur |
| **Contact** | rohan.kumar.mathur@gmail.com |
| **Version** | v0.1 |
| **Date** | 2025-12-16 |

---

## Abstract

Online discourse currently provides the raw bandwidth for collective reasoning, but the main benefits are lost because discourse is stored as unstructured text. Posts, threads, chats, and "link collections" can be read, but they cannot be composed, audited, or reused as reasoning. Claims cannot be referenced as stable objects, evidence cannot be attached as a primitive, and challenges cannot target the specific inferential steps they dispute.

We propose **Mesh**, a structured online discourse system that treats reasoning as a first-class artifact. Mesh represents discourse using an ontology of typed entities—claims, arguments, sources, citations, and dialogue moves—so that assertions can be grounded in evidence, disputes can be localized to premises versus inference versus conclusion, and deliberations can yield durable outputs. The system is progressively formalized: participants can begin with casual discussion and upgrade, when needed, into formal deliberation without changing tools or losing provenance. Discussions support a dual-mode chat/forum model and can upgrade into deliberations when complexity warrants.

Mesh is implemented as an ecosystem of interacting surfaces—publishing, library, discussions, deliberation, and discovery—sharing a common substrate. Published articles appear as discoverable posts in a social feed, while also serving as hosts for embedded deliberation. Sources and citations are deduplicated and resolved through a fingerprinted pipeline, and citations attach polymorphically to multiple reasoning objects. Deliberations connect into a meta-level network ("Plexus") that visualizes cross-references and supports argument transport with provenance.

We describe the system's design goals, shared primitives, surface-specific affordances, and the mechanisms that allow reasoning to compound across deliberations rather than dissipate.

---

## 1. Introduction

Mesh is a structured online discourse platform that combines the affordances of social feeds, threaded communities, chat rooms, publishing tools, and curated libraries—while adding an on-demand path to formal deliberation. Articles and stacks act as deliberation hosts; discussions and rooms provide low-friction entry points; citations attach evidence to claims; and cross-deliberation transport lets arguments compound across contexts. The system produces durable, citable and exportable artifacts (graphs, briefs, argument chains, knowledge bases, and live, long-form theses) rather than ephemeral threads, enabling communities to build shared knowledge instead of reinventing the wheel each time.


Online discourse has become the default medium for institutional reasoning. Organizations decide policy in comment threads, build strategy in chat logs, and litigate technical questions in issue discussions and social feeds. The tools work well enough for communication, but they suffer from the inherent weaknesses of a text-based model.

**Text streams are not reasoning artifacts.**

Email threads, forum replies, and chat messages flatten argument into chronology. Claims become buried inside paragraphs. Evidence becomes a link without a stable relationship to the statement it is meant to support. Disagreements recur because there is no canonical object to reference—only another message to quote. And when a dispute happens, participants cannot easily specify what they disagree with: the premise, the inference, or the conclusion.

In parallel, the modern discourse stack has fragmented into specialized platforms: longform publishing, fast social feeds, chat servers, collaborative "libraries," and separate deliberation or education tools. Each provides part of the solution, but the main benefits are lost if the system cannot preserve and compose reasoning across contexts. A reader can follow a link from an essay into a comment thread, then into a chat log, then into a separate document—but the result is still a pile of text.

**What is needed** is an online discourse system in which:

- Statements can be made **addressable** (so they can be referenced, revised, or contested without ambiguity).
- Evidence can be attached as a **primitive** (so citations accrue to claims and arguments, not just posts).
- Disputes can target **structure** (so an undercut of an inference is distinguished from an attack on a premise).
- Conversation can **upgrade into deliberation** (so informality is preserved until formal structure is necessary).
- Outputs can persist as **durable artifacts** that can be searched, exported, and reused.
- Reasoning can **travel across contexts** (so a good argument can be transported into a new deliberation with provenance preserved).

In this paper we propose **Mesh**, a structured online discourse system designed around those requirements.

### 1.1 Mesh as an ecosystem, not a single surface

Mesh is not "a forum," "a publishing site," or "a deliberation tool" considered in isolation. It is an ecosystem whose surfaces are designed to interoperate through a shared substrate:

- **Publishing (Articles):** Longform writing that can participate in the same discourse substrate as discussion and deliberation. When an article is published, it appears as a discoverable post in the home feed (a social distribution surface), rather than living outside the discourse graph. The feed includes a first-class ARTICLE post type and structured payload for distribution and preview.

- **Discussions (Chat + Forum):** A dual-mode container in which participants can switch between real-time chat and threaded forum discussion, while retaining the ability to upgrade to formal deliberation.

- **Library (Stacks + Sources + Citations):** A system for collecting, deduplicating, and citing sources across discourse objects. Sources are resolved via a normalization + fingerprint pipeline, preventing duplicates and enabling consistent attribution. Citations attach polymorphically to target entities (e.g., claim, argument, comment, move), allowing evidence to remain connected as reasoning is transformed.

- **Deliberation (Agora):** A formalization target: a deliberation can be spawned from multiple host contexts and produces structured artifacts (e.g., debate sheets) suitable for evaluation, export, and reuse. In the implemented system, a deliberation may be created for a given hostType/hostId pair and can spawn an AgoraRoom and an associated DebateSheet.

- **Discovery + Cross-Deliberation Network (Plexus):** A meta-level network connecting deliberations via cross-references, overlaps, and imports, supporting explicit transport of arguments between rooms. In the current implementation, cross-deliberation transport is expressed via a RoomFunctor model with claim mapping, preview/apply flows, fingerprint idempotency, and provenance tracking.

This paper's central claim is that these surfaces should not be separate products stitched together by links. They should be different entry points into the same structured discourse substrate.

### 1.2 Progressive formalization as the default operating mode

Mesh imposes minimal structure at the moment of writing. A discussion can remain casual, fast, and human. However, when a thread becomes consequential—when participants need to cite sources, isolate disagreements, or produce a decision artifact—the system supports upgrading the same content into formal deliberation.

This is not a separate "mode" that requires moving to another platform. The Discussions system is explicitly designed so discussions can upgrade into deliberations when complexity warrants. Likewise, longform publishing and the library system both integrate directly with deliberation creation and evidence attachment pathways.

### 1.3 Evidence-native discourse

In typical online discourse, citations are informal: a URL pasted into a comment, or an inline quote without a canonical source object. Mesh makes sources and citations first-class.

In the library subsystem, sources can originate from URLs, DOIs, or internal library posts, are normalized and fingerprinted for deduplication, and can be rated/annotated over time. Citations attach to many target types via a polymorphic targetType/targetId pattern, allowing the same evidence graph to remain valid as discourse is transformed into claims, arguments, and dialogue moves.

Moreover, deliberations can expose aggregated views of evidential usage—sources used, citation counts, unique users, and rating summaries—so a deliberation's epistemic basis can be audited at the level of the room, not merely at the level of a single post.

### 1.4 From conversation to artifacts that persist

Most platforms treat discourse as consumable: posts and comments are read, reacted to, and buried. Mesh treats discourse as productive: it should yield artifacts that persist beyond the conversation.

In practice, this means that when content is promoted into the deliberation substrate, it becomes addressable and composable. For example, the library system includes a route that "lifts" a stack comment into a deliberation claim and records a corresponding dialogue move (ASSERT), making the provenance explicit and machine-actionable.

At the ecosystem level, Mesh further treats deliberations as nodes in a network. Plexus visualizes cross-room relationships and supports transport actions—copying arguments between rooms and creating explicit links—so reasoning can compound across deliberations rather than restart from scratch.

### 1.5 Roadmap of this paper

The remainder of this paper proceeds as follows:

- **Section 2** states design goals and non-goals (including the ecosystem stance and progressive formalization posture).
- **Section 3** gives a system overview of the five primary surfaces and the artifacts each produces.
- **Section 4** defines the shared substrate: deliberations as an upgrade target, evidence/citations, core structured discourse primitives, and discovery/distribution mechanisms.
- **Sections 5–10** present the subsystem "packages" (Publishing, Library/Stacks, Discussions/Chat, Agora/Deliberation, and Plexus/Discovery) using a consistent template: problem framing, Mesh stance, core objects, primary flows, outputs, integration points, and implementation notes.

---

## 2. Design goals and non-goals

Mesh is not a single-purpose tool. It is a shared substrate for structured reasoning, exposed through multiple "surfaces" (publishing, curation, discussion, deliberation, discovery). The goal is that each surface is useful on its own, but that they interoperate by default—so reasoning can move between contexts without being rewritten or flattened into unstructured text.

### 2.1 Design goals

1. **Structured discourse as a first-class artifact.** A claim should be referenceable, inspectable, and re-usable the way a document or a code module is. Mesh treats discourse outputs (claims, arguments, objections, evidence linkages, summaries) as durable objects rather than transient messages. This posture is reflected directly in the deliberation system's "outputs & artifacts" layer (thesis composition, analytics, issues, etc.).

2. **Progressive formalization.** Most communication begins informal; only some parts need to become formal. Mesh is designed so a conversation can begin in discussion/chat and progressively "upgrade" into propositions, claims, arguments, and eventually higher-order artifacts like theses and knowledge-base pages. The Discussions/Chat surface explicitly encodes this: it supports casual exchange, structured threaded discussion, and an upgrade path into deliberation when complexity warrants it.

3. **Deliberation as a shared upgrade target across surfaces.** Articles, stacks, discussions, rooms, and KB pages should all be able to "host" deliberation without creating separate, incompatible debate systems. The platform architecture makes this explicit: multiple entry points and contexts route into a common deliberation hub (DeepDivePanelV2).

4. **Evidence-native discourse.** Citations and sources are not formatting; they are primitives. The Library/Stacks system models sources as canonical objects (with fingerprinting / deduplication) and citations as structured links that can attach to many target entity types. This enables evidence to be aggregated, queried, rated, and reused across deliberations, rather than being trapped inside a single post or thread.

5. **Composable outputs, not just conversations.** Deliberation is intended to produce artifacts that can be exported, embedded, or cited elsewhere: debate sheets, argument graphs, chains, issue trackers, thesis documents, and knowledge-base pages.

6. **Interoperability via explicit semantics and shared ontologies.** The deliberation layer uses an AIF-oriented representation (Argument Interchange Format) to make the argument graph explicit and transferable.

7. **Ecosystem stance without fragmentation.** Mesh aims to avoid the "toolchain tax" where publishing, discussion, citation management, debate mapping, and synthesis live in separate products with lossy handoffs. Instead, Mesh provides multiple surfaces that all speak to the same underlying objects—so "publishing-native," "curation-native," and "deliberation-native" workflows are different views over shared structure, not separate silos.

### 2.2 Non-goals

1. **Mesh does not assume consensus is always achievable or desirable.** The system focuses on making disagreements legible (what is claimed, what supports it, what is attacked, and where uncertainty enters), not on forcing convergence.

2. **Mesh is not "formal logic everywhere."** Progressive formalization is a constraint: structure is introduced when it pays for itself. Informal discussion remains a first-class mode, and deliberation remains optional until needed.

3. **Mesh is not primarily an engagement-optimization product.** Discovery and feeds exist to distribute artifacts, but the core design goal is composability and traceability of reasoning, not maximizing time-on-site.

4. **Mesh does not try to solve identity, governance, or moderation as a single mechanism.** The platform exposes hooks and surfaces where governance can be applied (e.g., room contexts, discussion policies, deliberation rules), but it does not claim a universal solution in this paper.

---

## 3. System overview

Mesh is composed of five interacting surfaces. Each surface is a complete user experience, but each one also acts as an "entry point" into the same reasoning substrate, centered on deliberations.

A useful way to picture the system is:

```
   Articles        Stacks/Library        Discussions/Chat
      │                │                     │
      ├───────────┬────┴───────────┬─────────┤
                  ▼                ▼
              Deliberation (Agora / DeepDivePanelV2)
                  │
                  ├── Outputs: thesis, issues, analytics, KB pages, chains
                  │
                  ▼
         Discovery + Cross-deliberation network (Plexus)
```

### 3.1 Articles

**Purpose.** Articles provide publishing-native longform writing with an explicit path into structured deliberation—i.e., "Substack, but discourse can become structured." The article system includes a rich-text editor, comments, annotation support, and a first-class integration with deliberations.

**Primary artifact.** A published article (and its associated comment/annotation activity) that can spawn or host a deliberation.

**Deliberation integration.** The Article system explicitly creates or retrieves a deliberation keyed to an article context via a `getOrCreateDeliberationId(...)` path, using host typing (e.g., `hostType: "article"`).

**Distribution.** Published articles can appear in the home feed as an ARTICLE post type, with a structured feed payload (title/subtitle/authors/tags/etc.).

### 3.2 Stacks and Library

**Purpose.** Stacks provide curation-native knowledge organization: users collect PDFs, links, notes, and other items into structured libraries, and then attach citations/evidence into deliberations. The subsystem is designed to support citation workflows and evidence aggregation as a shared service for the rest of the platform.

**Primary artifacts.**
- A Stack (curated collection + metadata).
- A canonical set of Sources (deduplicated) and Citations that can attach to many kinds of targets.
- Cross-deliberation "stack references" that connect deliberations through shared evidence/curation.

**Deliberation integration.** Stacks can host deliberations under `hostType: "library_stack"`, enabling "lift-to-debate" flows from library content into the deliberation UI.

**Distribution.** Library/stack activity can appear in the feed as a LIBRARY post type (with its own feed payload), parallel to articles.

### 3.3 Discussions and chat

**Purpose.** Discussions provide a "casual forum/chat hybrid" for preliminary conversation, with explicit affordances for escalation into deliberation. This surface is intentionally dual-mode: real-time chat for fast iteration, and forum-style threaded comments for more structured exchange.

**Primary artifacts.**
- A Discussion container with chat and forum modes.
- A stream of messages/posts (including cross-mode promotion/quoting).
- Optional "bridges" into deliberation when a thread needs formal structure.

**Deliberation integration.** The Discussions surface includes a Deliberate button that calls an ensure endpoint and routes into a deliberation if/when needed.

**Real-time affordances.** Presence and typing indicators are implemented via Supabase real-time channels (presence sync/join/leave and broadcast typing events).

### 3.4 Deliberation engine

**Purpose.** The deliberation engine (Agora) is the platform's "structured reasoning surface." It is where claims, arguments, attacks/defenses, commitments, and higher-order synthesis artifacts are constructed and evaluated.

**Primary artifacts.**
- Debate sheets (structured positions / intents)
- Explicit argument graphs (AIF-oriented)
- Argument chains
- Commitment and issue tracking
- Thesis composition, analytics, and other deliberation outputs

**Role in the platform.** Deliberation is the shared upgrade target across entry points (discussions, articles, stacks, rooms, KB pages).

### 3.5 Discovery and cross-deliberation network

**Purpose.** Discovery is not just a feed; it is also a graph of relationships between deliberations, claims, arguments, sources, and curated structures. This is the role of Plexus: a network layer that makes reasoning transportable across contexts.

**Primary artifacts.**
- Feed posts for articles and library activity (distribution)
- Cross-deliberation edges (transport / relatedness)
- Higher-level graph structure for browsing and retrieval

**Graph stance.** The Categorical Foundations framing treats Plexus as a category whose objects (Deliberation, Claim, Argument, Source, Stack, etc.) are linked by typed edges (e.g., xref, overlap, stack_ref, imports, shared_author).

---

## 4. The common substrate

The five surfaces above are intentionally different interaction models. The coherence of Mesh comes from the fact that they share a substrate: common IDs, common evidence primitives, and a common deliberation upgrade target.

### 4.1 Deliberations as a shared upgrade target

A deliberation is the "deep structure" a surface can route into when discourse needs explicit reasoning objects. Multiple host contexts can ensure or create a deliberation and then open the same deep-dive experience.

In the implemented system, deliberation creation is explicit and host-typed. For articles, the API path shows a generalized pattern:

1. Identify a host (hostType, hostId)
2. Ensure a deliberation exists for that host
3. Route the user into the deliberation panel

Host typing is not merely descriptive; it's an integration boundary. For example, the Article system enumerates host types such as `article`, `post`, `room_thread`, `site`, `inbox_thread`, `discussion`, `free`, `work`. Stacks add an additional host type (`library_stack`) so curated libraries can also be deliberation contexts.

Discussions expose this upgrade via the Deliberate button flow: `POST /api/deliberations/ensure` using host types like "discussion" or "inbox_thread", with an optional seed claim that creates an initial ASSERT move.

When a deliberation is created, it is not just an empty container. The system can create an Agora room context and seed initial deliberation scaffolding (e.g., debate sheet, roles, representation rule).

### 4.2 Evidence, citations, and sources

Mesh treats "evidence" as a structured layer that multiple surfaces can contribute to and multiple deliberations can reuse.

**Sources are canonical objects.** The Library system models Source with a fingerprint, canonical URL, normalized URL, type, and metadata, and includes a fingerprinting implementation (`fpFrom`) based on SHA-1 over normalized inputs. This enables deduplication across uploads/links and prevents evidence from fragmenting into near-duplicate entries.

**Citations are structured links.** The Citation model records the sourceId plus a polymorphic (targetType, targetId) pair, enabling citations to attach to different target entities rather than being confined to one content type.

**Evidence aggregates at the deliberation level.** Stacks describe a pipeline that joins evidence with source ratings and returns aggregated lists for an EvidenceList component. In practice, this allows a deliberation to build an evidence set over time—even as evidence is introduced via articles, stacks, or discussions—rather than treating citations as local adornments.

**Confidence is a compositional concern.** The categorical foundations notes multiple confidence composition modes (e.g., PRODUCT, MIN, DS), framing confidence as something computed from structured inputs rather than inferred from prose alone.

### 4.3 Core structured discourse primitives

This paper's later package sections will go deep on argument schemes, attacks, dialogue protocols, and evaluation. Here we define only the substrate-level primitives required for the system to compose across surfaces.

1. **Propositions and claims.** Mesh supports an upgrade path where text in a discussion can be workshopped into explicit propositions and promoted into claims.

2. **Arguments as explicit graph objects.** The deliberation system is oriented around AIF-style argument objects, enabling structured composition and interchange rather than purely textual debate.

3. **Dialogue moves as provenance.** Surface-to-deliberation bridges can seed structured moves. The "ensure deliberation" flow supports an optional seed claim that creates an initial ASSERT move, establishing provenance from the originating context into the deliberation record.

4. **Progressive deliberation as the organizing principle.** The implemented roadmap is not "chat vs. formal logic"; it is a ladder: discussion → proposition → claim → argument → synthesis artifacts.

### 4.4 Discovery and distribution mechanisms

Mesh needs a way for structured artifacts to circulate without collapsing back into unstructured "posts." The substrate therefore includes explicit distribution objects.

**Feed posts are typed artifacts.** Articles appear as an ARTICLE feed post type with a structured payload (articleId, title/subtitle, authors, tags, comment count, etc.). Library activity appears as a LIBRARY feed post type, similarly represented as a typed object rather than an unstructured embed.

**Discovery is complemented by cross-deliberation structure (Plexus).** Plexus is modeled as a typed network over deliberation-relevant entities, with edge kinds such as xref, overlap, stack_ref, imports, and shared_author. This supports "argument transport" and "context reuse": a deliberation can reference another deliberation's outputs, a stack can create typed connections, and discovery can be informed by explicit structure rather than only engagement signals.

---

## 5. Bridge: Packages as Lenses on a Single Substrate

The previous sections described Mesh at the umbrella level: a set of public-facing surfaces (publishing, curation, discussion, deliberation, discovery) coupled to a shared reasoning substrate. The remainder of this paper treats each surface as a *lens*—a way of entering the same underlying system.

The purpose of the package sections is not to introduce unrelated feature sets. It is to show how distinct online activities—writing, reading, collecting sources, commenting, debating—can all be expressed as operations over shared primitives (sources, citations, claims, arguments, deliberations), while preserving the local ergonomics of each surface.

Accordingly, each package section follows the same structure:

1. Problem framing (failure mode of the incumbent category)
2. Mesh stance (what is treated as first-class)
3. Core objects (the minimal entities the surface adds)
4. Primary user flows (how work is performed end-to-end)
5. Outputs / artifacts (what persists and can be referenced elsewhere)
6. Integration points (how the surface upgrades into deliberation, evidence, and discovery)

Packages B and C cover the publishing and curation surfaces first, since they establish two complementary "entry points" into structured discourse: writing-native (articles) and reading/evidence-native (stacks/library).

---

## 6. Package B: Publishing-Native — Articles

*"Substack, but discourse is structured"*

### 6.1 Problem framing

Longform publishing systems reliably produce text, but they do not reliably produce structured discourse around the text. The dominant interaction loop is: publish → comment → forget. Responses and critiques are mostly untyped, hard to cite, and difficult to transport into other contexts (e.g., a later debate, a knowledge base page, or a decision record). Even when annotation exists, it typically remains a local comment layer rather than an upgrade path into formal claims, evidence, and deliberation.

### 6.2 Mesh stance

Mesh treats publishing as a first-class host for structured discourse. An article is not only a rendered document; it is a durable object that can host deliberation and that can appear as a discoverable unit in a social feed.

Concretely: the Mesh Article System is built to create "rich, magazine-quality articles" while integrating "seamlessly with the platform's deliberation and argumentation infrastructure," so that articles act as hosts for structured discourse.

### 6.3 Core objects

At the publishing layer, Mesh introduces (or foregrounds) the following objects:

- **Article:** a longform document with a draft→publish lifecycle and revision history.
- **Template:** a layout preset ("standard", "feature", etc.) that affects rendering but not the underlying reasoning substrate.
- **Anchor / Thread:** DOM-anchored comment threads attached to text selections.
- **Deliberation host:** each article is "deliberation-native" and serves as a host surface for structured discourse.
- **FeedPost (ARTICLE type):** a published article can be represented as a feed object for distribution/discovery.

### 6.4 Primary user flows

#### 6.4.1 Draft → edit → autosave → publish

The publishing lifecycle is explicitly modeled as draft creation, iterative editing with autosave, and publication with durable outputs.

Publishing performs a sequence of steps that turns an editable draft into a stable, shareable artifact:

1. Validate ownership
2. Resolve final title
3. Generate slug
4. Compute excerpt and reading time
5. Update article status to PUBLISHED
6. Create a revision snapshot
7. Create a feed post (optional)

#### 6.4.2 Annotation-native reading (selection → thread)

Readers can attach discussion directly to passages via anchored threads ("DOM-anchored comment threads attached to text selections").

This establishes a low-friction Layer 0–1 discourse surface: informal comments remain local, but they are structurally positioned (anchored) and therefore upgradeable.

#### 6.4.3 Article → feed distribution

When an article is published, Mesh can create a corresponding FeedPost with `type: ARTICLE` and an article foreign key, enabling the article to appear in the home feed as a discoverable unit.

The system explicitly frames this as social-feed discovery analogous to "Substack/Bluesky," while still treating it as infrastructure rather than marketing.

### 6.5 Outputs and artifacts

Publishing produces durable artifacts beyond the comment stream:

- Published article page (server-rendered for performance/SEO)
- Revision snapshots created at publication time (and potentially elsewhere in the workflow)
- Anchored annotation threads that remain attached to specific spans of the document
- Feed posts that allow distribution and discovery (ARTICLE-type)
- A deliberation host context: the article provides a stable "place" where informal commentary can be progressively formalized into claims/arguments as needed.

### 6.6 Integration points with the shared substrate

- **Deliberation-native hosting** is a design principle of the article system ("Articles are first-class deliberation hosts").
- **Portable content representation** (TipTap JSON AST) makes it feasible to treat publishing artifacts as composable inputs/outputs within the broader platform.
- **Feed integration** provides a distribution mechanism that does not sever provenance: the feed object points back to the canonical article entity.

### 6.7 Implementation notes

The article system is explicitly separated into editor/reader/dashboard components and is designed for server-first rendering with optimistic updates.

The reference implementation is Next.js/React/TypeScript with a TipTap editor stack and PostgreSQL persistence.

---

## 7. Package C: Curation- and Evidence-Native — Stacks & Library

*"Are.na, but sources are executable"*

### 7.1 Problem framing

Most discourse systems make evidence optional and citations incidental. People paste links, upload PDFs, quote screenshots, and accumulate source lists, but the system does not deduplicate sources, does not track where a source was used, and does not make citations transportable across conversations. The result is that evidence cannot compound: every debate rebuilds its bibliography from scratch, and every reading group becomes a local, non-reusable folder.

### 7.2 Mesh stance

Mesh treats sources and citations as first-class objects. Stacks are not merely folders; they are a curation surface that is tightly coupled to deliberation, such that "evidence-based argumentation" is a native capability rather than an add-on.

The system is described as "document management and knowledge organization infrastructure" with a "sophisticated citation pipeline" and "deep integration with the deliberation engine."

### 7.3 Core objects

From the Stacks/Library architecture, the key entities and relationships are:

- **Stack:** a curated collection.
- **LibraryPost:** an individual document item (e.g., a PDF) with metadata and thumbnails.
- **Source:** a canonical reference entity (URL, DOI, or LibraryPost-backed).
- **Citation:** a link from a Source to a target entity (e.g., comment, claim, argument).
- **Deliberation host type (library_stack):** stacks can host deliberations directly.
- **Cross-deliberation reference edges (StackReference model):** to support knowledge graph connections across contexts.

Architecturally, the system also commits to:

- **Polymorphic citations:** "Single Citation model targets multiple entity types."
- **Source deduplication** via SHA1 fingerprinting.

### 7.4 Primary user flows

The Stacks/Library document provides an explicit end-to-end flow that can be used as the canonical user-level description:

1. **Upload:** user uploads into a stack, creating a LibraryPost.
2. **Organize:** user reorders/curates within the stack.
3. **Discuss:** user comments in a FeedPost-based thread attached to the stack.
4. **Cite:** citations resolve to canonical Sources and attach to targets.
5. **Lift:** a comment can be promoted ("lifted") into the deliberation system.
6. **Deliberate:** deep dive deliberation UI consumes the EvidenceList aggregation endpoint.
7. **Share:** a stack can be represented as a feed post for distribution/discovery.

#### 7.4.1 Citation resolution (deduplication by construction)

To avoid source fragmentation, Mesh computes a fingerprint over normalized DOI/URL/library identifiers and uses SHA1 to deduplicate sources. URLs are canonicalized (e.g., stripping fragments and common tracking parameters).

#### 7.4.2 Quick cite vs. detailed cite

The system supports a fast path (one click cite from a PDF tile) and a more precise path (modal with locator/quote/note).

This is the evidence-surface analogue of progressive formalization: add the minimum structure first, refine when needed.

#### 7.4.3 Evidence aggregation for deliberation

The stacks subsystem includes an explicit evidence aggregation strategy that queries citations across arguments and claims in a deliberation and aggregates usage counts in memory.

This allows the deliberation surface to present an EvidenceList summarizing sources used, frequency, and related metadata.

### 7.5 Outputs and artifacts

Stacks produce durable artifacts that can be reused across contexts:

- Curated stacks of source documents (not just links)
- Canonical Sources with deduplication and normalization
- Polymorphic citations that can attach to multiple discourse entities
- Evidence aggregates that track usage and can support quality/rating signals ("Track source usage and quality ratings across deliberations")
- Deliberation hosts via library_stack, enabling a stack to become the locus of structured debate rather than merely a reading list

### 7.6 Integration points with the shared substrate

- **Deliberation hosting** is explicit: stacks can host deliberations via the library_stack host type.
- **Lift-to-debate** provides a concrete upgrade path from informal discussion into structured claims.
- **Feed integration** allows stacks/library objects to appear as shareable/discoverable posts ("Stack → FeedPost (LIBRARY) → LibraryCard in feed").
- **Event-driven updates** support real-time synchronization, reinforcing that the library is not static storage but a live substrate for discourse.

### 7.7 Implementation notes

The stacks/library architecture emphasizes server-first operations, optimistic updates, reuse of FeedPost infrastructure for discussion threads, and event-driven synchronization.

It also specifies concrete integration components such as inline citation pickers, citation collectors, and "LiftToDebate" affordances.

---

## 8. Package D — Discussions and Chat

### 8.1 Problem framing

Online discourse tools typically force an early choice between two modes:

- **Threaded, durable writing** (forums, Reddit-style posts) that supports long-lived topics but tends to move slowly, with weak coordination, weak provenance, and little structured upgrade path.
- **Real-time chat** (Discord/Slack-style streams) that supports fast coordination but is highly ephemeral, hard to search, and difficult to cite or reuse as institutional memory.

In practice, important reasoning happens across both modes. People sketch hypotheses in chat, refine them in threads, and then attempt to "summarize" the result in a separate document. This produces fragmentation: the conversation lives in one place, the final writeup in another, and neither cleanly references the reasoning steps that produced it.

Mesh treats this as an infrastructure mismatch: the medium offers message exchange, but not durable reasoning artifacts.

### 8.2 Mesh stance

Mesh implements Discussions as a single surface that deliberately spans both regimes: open-ended forum-like posts and real-time chat-like messages inside one conceptual container, supported by a dual-mode backend.

The key property is that the Discussion surface is not "the end" of discourse. It is designed as a front-door to progressive formalization: a discussion can remain informal indefinitely, or it can be upgraded—selectively, and without rewriting—into deliberation objects (propositions, claims, arguments) when the group needs structure.

### 8.3 Core objects

At the discussion layer, the system revolves around a small set of primitives:

- **DiscussionView:** a unified container presenting two panes:
    - ForumPane for threaded posts
    - ChatPane for real-time messages
- **DiscussionPost** (forum mode) and **ChatMessage** (chat mode), coexisting as first-class objects within the same discussion.
- **ReplyTarget:** a polymorphic pointer allowing replies to target heterogeneous objects (e.g., a post, a chat message, or a drift reply), so the reply graph can cross mode boundaries rather than being siloed by UI type.
- **Drift / DriftReply:** a mechanism for spawning side-conversations that are adjacent to (and anchored in) a parent thread context, with an explicit intention to later resolve/summarize back into the main line.

### 8.4 Primary user flows

The implemented Discussion surface supports a small number of flows that cover most day-to-day discourse:

1. **Threaded exchange (forum mode):** Participants write longer posts, reply in threads, and build structured context over time in ForumPane.

2. **High-tempo exchange (chat mode):** Participants coordinate via ChatPane; messages are broadcast in real-time to a discussion-scoped channel, while post updates are also broadcast to keep all clients coherent.

3. **Cross-mode replies:** Replies can target different object types via ReplyTarget, allowing the conversation graph to reflect actual conversational structure rather than being constrained by whether the author happened to be "in chat" or "in posts."

4. **Drift creation and resolution:** When a subtopic threatens to derail a thread, a participant can spawn a drift: a side-thread that captures the divergence without losing the anchor to the original context, and can later be resolved and summarized back.

5. **Upgrade to deliberation:** When the group needs stronger structure (e.g., evidence tracking, canonical claims, explicit challenges), the discussion can be upgraded: the UI exposes a "Deliberate" action that opens/creates a deliberation for the same host context, and the discussion becomes the informal layer inside that deliberation.

### 8.5 Outputs and artifacts

The Discussion surface produces durable conversational artifacts even before formal deliberation:

- Threaded posts and real-time message history (one container, two modes)
- Drift threads that explicitly capture divergence and make it resolvable rather than merely noisy

Crucially, these artifacts are designed to remain referenceable when the conversation upgrades. The goal is not "summarize and discard the discussion," but "preserve the discussion as provenance while extracting structured objects where needed."

### 8.6 Integration points

Access control and audience is uniform across the platform via a sheaf-style model: content objects carry a share/visibility policy so the same discussion can be private, group-scoped, or public without relying on one-off access logic per surface.

This matters because discussions are not isolated: they can be embedded as context inside deliberations, referenced by articles, and routed into discovery surfaces. The system requires a single access semantics that is stable across all those embeddings.

### 8.7 Implementation notes

The architectural intent is explicit: a forum/chat hybrid with a dual-mode backend and real-time broadcasting, so the discourse graph remains coherent across participants and across time.

### 8.8 Bridge: From Discussion to Deliberation

Discussions are designed to capture the full bandwidth of ordinary communication: fast chat for coordination, threaded posts for durable exchange, and side threads (drifts) for divergence.

This is where most discourse begins, and it is where most discourse should remain until the cost of ambiguity becomes higher than the cost of structure.

But the failure mode of discussion-first systems is predictable. As a topic becomes consequential, participants need more than replies: they need stable referents (claims), explicit connections (evidence and inference), and a way to localize disagreement (premise vs. inference vs. conclusion). When those objects do not exist, the conversation either stalls or produces an outcome that cannot be justified later.

The deliberation engine exists to solve that infrastructural gap. The Agora layer treats reasoning as infrastructure—connecting evidence to claims, claims to arguments, and arguments to counter-arguments in a form that communities can cite, audit, and build upon.

**Progressive formalization is the handoff:** discussions can upgrade into deliberations when complexity warrants it, without discarding the original discourse.

Once upgraded, the system can express reasoning in structures that discussion alone cannot maintain: scheme-based arguments, typed challenges, commitment/provenance tracking, and higher-order composition into chains and exports (prose/essay/markdown) when the reasoning needs to be communicated beyond the immediate participants.

With this bridge in place, we can treat Agora as the "formal layer" that discussions converge toward when needed, and then extend outward again to discovery and reuse—so deliberations do not remain isolated rooms, but become nodes in a network of transportable reasoning artifacts.

---

## 9. Package E — Agora: Formal Deliberation as a Public Utility

### 9.1 Problem framing

Current public discourse infrastructure is optimized for engagement and throughput, not deliberation. Even when participants are acting in good faith, the medium makes it difficult to:

- Connect evidence to claims
- Connect claims to arguments and counterarguments
- Connect the evolving structure of disagreement to durable outcomes that can be cited and audited

The result is not merely "bad comments." It is a structural failure mode: reasoning collapses into unstructured text, institutional memory decays, and outcomes cannot be justified in a way that communities can reuse.

What is needed is **deliberation infrastructure**: a way for groups to reason in public (or within bounded communities) while producing artifacts that persist beyond the conversation.

### 9.2 Mesh stance

Mesh implements the **Digital Agora** as a deliberation engine that treats reasoning as infrastructure, not as a byproduct of text.

Agora provides four essential capabilities:

- **Structured claim management** with stable identifiers and typed relationships (including distinctions among how something is challenged).
- **Scheme-based argumentation** (Walton-style schemes) with critical questions surfaced as explicit vulnerability points.
- **Dialogue protocol enforcement:** assertions, challenges, concessions, and retractions are first-class moves with provenance.
- **Composable outputs:** deliberations generate thesis documents, KB pages, and exportable graphs as institutional memory.

A central design requirement is progressive formalization: not every conversation needs full formality, but the system must make formality available as an upgrade path when complexity demands it.

### 9.3 Core objects

Agora's core model can be understood as three layers (each building on the previous):

1. **Claims & Evidence:** propositions, claims, claim edges, evidence links.
2. **Arguments & Dialogue:** arguments, schemes, critical questions, dialogue moves, commitments, chains.
3. **Outputs & Artifacts:** thesis documents, debate sheets, KB pages, briefs, and related compositional artifacts.

These structures are designed to be interoperable through the **Argument Interchange Format (AIF)**, with explicit node types separating content, inference, conflict, preference, and dialogue moves.

### 9.4 Primary user flows

The canonical flow is intentionally incremental: it begins where people already are (discussion), and then introduces structure only when it becomes useful. The currently implemented journey is:

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

This path is also formalized as a set of implemented transitions (e.g., Discussion → Deliberation, Proposition → Claim, Claim → Argument, Argument → Thesis).

### 9.5 Dialogue-first semantics

A key design choice is that arguments do not exist as free-floating objects: they arise as moves in a dialogue. The system records "who said what, when, in reply to what," and exposes a limited vocabulary of move types (ASSERT, WHY, GROUNDS, CONCEDE, RETRACT, CLOSE) as the operational semantics of discourse.

This is how Agora avoids collapsing disagreement into undifferentiated "replies." The dialogue layer supplies explicit structure and provenance.

### 9.6 AIF-centric structure

Agora's argument graph representation is AIF-centric. In implementation terms:

- **I-nodes** represent informational content (claims/propositions)
- **RA-nodes** represent inference application
- **CA-nodes** represent conflict/attack relations
- **PA-nodes** represent preference/ordering
- **DM-nodes** represent dialogue moves

This separation allows the system to distinguish attacks on content vs attacks on inference steps, and to export graphs for independent analysis rather than requiring the Mesh UI to interpret them.

### 9.7 Outputs and artifacts

Deliberation is only valuable if it leaves behind reusable products.

Accordingly, Agora produces multiple artifact types, each designed for a different "publication" need:

- **Thesis documents** (legal-style structured composition)
- **TheoryWorks** (longform analysis within explicit frameworks)
- **Debate sheets** (visual debate mapping)
- **KB pages** (block-based, live-linked to claims/arguments)
- **Briefs** (generated summaries)
- **Glossary terms** (local definition layer)

These artifacts link back to the underlying reasoning graph rather than merely quoting it, so updates to claims/arguments can propagate to the composed surfaces while preserving provenance.

### 9.8 Interfaces as system architecture

Agora's capabilities are organized in a central orchestration UI, **DeepDivePanelV2**, which exposes the deliberation engine as a set of tabs and floating sheets (graph explorer, actions, glossary) and a stable set of core tabs (Debate, Arguments, Chains, Ludics, Admin, Sources, Thesis, Analytics).

This matters for a systems paper because the UI is the binding layer: it is where claims, dialogue, arguments, evidence, and outputs become a single manipulable object space rather than separate tools.

### 9.9 Implementation notes

Agora is implemented with explicit API surfaces for the core subsystems:

- Dialogue moves and legal-move computation
- Claims and claim edges
- Arguments and diagrams
- AIF scheme/graph operations

Uncertainty is treated as first-class (argument confidence, aggregation modes, Dempster–Shafer intervals, temporal decay), allowing the system to distinguish "supported conclusion" from "tentative hypothesis" within the same deliberation space.

---

## 10. Package F — Mesh Plexus: A Meta-Network of Deliberations for Transportable Discourse Artifacts

### 10.1 Problem framing

The unit of discourse on today's internet is the post, the thread, or the server. The unit of progress, however, is the argument: a claim connected to evidence via an inference that can be challenged, repaired, and reused. When arguments cannot travel, knowledge does not scale—only attention does.

A discourse system that compounds must treat debates as addressable artifacts and must support explicit relationships between them: references, overlaps in claims, shared source collections, and imports of prior reasoning. It must also preserve provenance, because reuse without traceability collapses into authority-by-assertion.

### 10.2 Mesh stance

Mesh implements **Plexus**, a meta-level network layer that connects deliberation rooms and supports explicit linking and transport operations across contexts. In the reference architecture, Plexus is defined as a "meta-level network visualization" that shows connections between deliberation rooms and makes cross-references, shared structure, and argument transport visible.

The system is designed so that deliberations do not remain isolated endpoints. They become nodes in a higher-level structure that supports discovery ("where has this claim been debated?"), reuse ("import arguments from a related room"), and consistency checking ("which rooms reached conflicting conclusions?"). This is formalized directly in the categorical framing as a "category of categories," where deliberations are objects and transport operations are morphisms.

### 10.3 Core objects

At the Plexus layer, the essential primitives are:

#### (a) Network nodes and edges

The Network API returns a set of room nodes and typed edges (a "meta-edge" graph).

- **RoomNode** describes a deliberation room with summary metrics (counts, acceptance distribution, tags, updatedAt).
- **MetaEdge** links two rooms with a kind and weight.

The edge kinds are a closed set:
- `xref`, `overlap`, `stack_ref`, `imports`, `shared_author`

#### (b) Five edge types (semantics)

Each edge kind corresponds to a concrete model/source of truth:

| Edge Kind | Source of Truth |
|-----------|-----------------|
| `xref` | Explicit cross-reference (XRef) |
| `overlap` | Shared canonical claim identity (Claim.canonicalClaimId) |
| `stack_ref` | Shared knowledge stack reference (StackReference) |
| `imports` | Imported arguments (ArgumentImport) |
| `shared_author` | Shared contributors (SharedAuthorRoomEdge) |

#### (c) Transport primitives

Transport is implemented via:

- **RoomFunctor:** an object-level mapping from claims in room A to claims in room B (claimMapJson), with a unique pair constraint on (fromRoomId, toRoomId).
- **ArgumentImport:** a provenance-carrying record of an imported argument (including a unique SHA-1 fingerprint for idempotency).

The categorical foundations make this explicit as a structure-preserving map: claims are mapped by claimMapJson, and arguments move by ArgumentImport.

### 10.4 Primary user flows

#### 10.4.1 Discover and inspect the network

Plexus provides multiple "views" over the same network—graph, board, and matrix—so users can browse the space of deliberations at different levels of density.

From the network view, a user can:
- Open a room in the deliberation hub
- Create a cross-reference link
- Initiate transport ("copy arguments between rooms")

#### 10.4.2 Link rooms

A Link action creates explicit cross-references between rooms (the `xref` edge kind). Plexus treats this as a first-class, typed relation rather than a plain URL paste.

#### 10.4.3 Transport arguments (A → B)

Transport is implemented as an explicit workflow backed by stable IDs and idempotent imports:

1. **Map claims (A → B).** The user establishes (or edits) a mapping between claims across deliberations, stored in RoomFunctor.claimMap.
2. **Preview import proposals.** The preview endpoint returns proposed imports with fingerprints (SHA-1) to make the import operation idempotent.
3. **Apply (materialize) imports.** The apply endpoint materializes selected imports in a transaction: it checks the fingerprint, creates the imported argument/support if needed, and records provenance in provenanceJson.

Transport is not "copy/paste text." It is a structured operation: imported arguments carry lineage back to their source deliberation and are represented as objects that can be challenged, supported, or re-evaluated in the target room.

#### 10.4.4 Virtual vs. materialized imports

The system supports virtual imports (read-only references) and materialized imports (copied arguments as local objects). Virtual imports use synthetic IDs of the form `virt:{fingerprint}`, allowing imported reasoning to be surfaced without duplicating the entire structure until it is needed.

### 10.5 Outputs and artifacts

Plexus produces durable cross-deliberation artifacts:

- A queryable room graph: (rooms, edges) returned from `/api/agora/network`, suitable for visualization and filtering.
- Typed relationships that preserve semantics of "how these rooms are related" (xref vs overlap vs imports vs stack_ref).
- Transport records: RoomFunctor mappings and ArgumentImport rows that preserve provenance and enforce idempotency via fingerprint.

These artifacts enable reasoning to compound across deliberations rather than resetting per thread.

### 10.6 Integration points

Plexus is not a standalone product. It integrates with the rest of the ecosystem:

- **Stacks and evidence** contribute stack_ref edges via StackReference, connecting reading/curation to debate reuse.
- **Deliberation evaluation** informs room-level metrics (e.g., acceptance distribution in RoomNode), allowing discovery and navigation to be based on reasoning structure, not only engagement.
- **Transport** turns deliberations into a knowledge commons: imported arguments are visible to the deliberation engine and can be evaluated under local premises and preferences (materialized or virtual).

### 10.7 Implementation notes

- The Plexus layer is backed by a dedicated network API (`/api/agora/network`) and a typed edge vocabulary.
- The UI supports multiple views (graph/board/matrix) and exposes explicit actions for link creation and transport initiation.
- Transport is implemented as a small, explicit API suite (`/api/room-functor/*`) supporting mapping, preview, and apply/materialize.
- Current implementation status includes fully working claim mapping, preview proposals, materialized and virtual imports, and fingerprint idempotency; composition of transport functors (A→B→C) is explicitly tracked as future work.

---

## 11. Conclusion

We have described **Mesh** as a structured online discourse system built as an ecosystem of interoperable surfaces: publishing, curation, discussion, deliberation, and discovery. The core premise is that discourse should not terminate in unstructured text. It should yield durable objects—claims, citations, arguments, challenges, and composed outputs—that can be referenced, audited, and extended.

Mesh addresses three recurrent failures of online reasoning infrastructure:

1. **Unstructured text cannot be composed.** Mesh treats reasoning as a first-class artifact and supports progressive formalization so casual discourse can upgrade into structured deliberation without switching tools.

2. **Evidence does not bind to claims.** Mesh makes sources and citations canonical primitives, enabling evidence tracking and reuse across contexts rather than per-thread link dumping.

3. **Discourse does not compound.** Mesh introduces a cross-deliberation network (Plexus) and transport mechanisms (RoomFunctor + ArgumentImport) that allow arguments to move between deliberations with provenance preserved.

In this architecture, the "platform" is not a feed or a comment section. It is the substrate that turns writing, reading, discussion, and debate into interoperable operations over shared objects. The long-term payoff is **institutional memory**: a system where conclusions can be traced back to evidence and where strong arguments can be transported forward rather than rewritten from scratch.

**Future work** follows naturally from the current implementation: composing transport maps across multiple rooms, improving semantic identity resolution beyond fingerprints, and extending Plexus to represent the evolution of a debate over time.

---
