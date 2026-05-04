# Isonomia

## Complete Platform Overview

Isonomia is a social platform with a formal reasoning layer. The social layer — forums, feed, messaging, rooms, articles, shared libraries, user profiles — provides the space where communities gather. The reasoning layer — a deliberation engine implementing formal argumentation theory, interactive proof theory, and evidence aggregation — provides the infrastructure that preserves what the gathering produces. The two layers share a single data model and a continuous spectrum of formality: any conversation can become a structured deliberation, and any deliberation exists within a social context.

The platform is open-source, self-hostable, and designed as public infrastructure. There is no advertising, no algorithmic feed optimization, no data harvesting, no engagement metrics. The data belongs to the community that produces it. The code is public. The architecture enforces these commitments at the protocol level.

---

## I. Architecture

### The Two Layers

The platform operates across two layers that share a unified interface and data model:

**The Social Layer (MESH)** provides the features of a general-purpose community platform: a chronological feed with multiple post types, direct and group messaging, persistent rooms and lounges, user profiles with friend and follow systems, shared document libraries, long-form article publishing, and spatial canvas environments. This layer is complete and functional as a standalone social platform. It requires no engagement with the reasoning layer.

**The Reasoning Layer (Isonomia)** provides formal deliberation infrastructure: argumentation schemes with auto-generated critical questions, typed dialogue moves with protocol enforcement, commitment stores, evidence management with executable citations, Ludics game-theoretic evaluation, confidence scoring, and a cross-context transport network. This layer is accessible from any point in the social layer through a single upgrade action — a discussion can become a deliberation, a comment can become a claim, an annotation can become a proposition — and the transition is reversible.

The relationship between the layers is not hierarchical. The social layer is not a simplified version of the reasoning layer, and the reasoning layer is not an advanced version of the social layer. They are two modes of the same platform, addressing different moments in a community's life: the moment of gathering and the moment of deciding. Most communities spend most of their time gathering. The reasoning layer exists for the moments when the gathering needs structure.

### The Spectrum

Every feature on the platform exists at a position on a continuous spectrum from informal to formal:

**Conversation.** Feed posts and comments (informal) → threaded discussion with topics (structured) → deliberation with typed moves and commitment tracking (formal).

**Arguments.** Opinions stated in prose (informal) → claims with stated reasons (structured) → arguments instantiating recognized schemes with critical questions (formal).

**Disagreement.** Replies and reactions (informal) → specific objections with stated grounds (structured) → formal challenges creating tracked obligations to respond (formal).

**Evidence.** Links and anecdotes (informal) → cited sources with annotations (structured) → executable citations with four anchor types, intent labeling, and DOI resolution (formal).

**Persistence.** Feed that scrolls past (informal) → searchable archive (structured) → knowledge base with live deliberation blocks and stable citable references (formal).

**Cross-context.** Cross-posting (informal) → shared references (structured) → transport functors with SHA-1 fingerprinted provenance and confidence gating (formal).

The transition between any two adjacent points on the spectrum is a single user action. No transition requires specialized knowledge. No transition is irreversible. Communities move along the spectrum as their needs dictate, and the platform supports every position with a consistent interface and a shared data model.

### The Knowledge Production Pipeline

When a community's work moves from informal to formal, the platform models the trajectory as a pipeline:

Informal discussion generates propositions. Propositions are workshopped into claims. Claims are structured into arguments using formal schemes. Arguments are challenged through protocol-enforced dialogue moves. Moves are tracked in commitment stores. Commitment stores are analyzed by the Ludics engine, producing convergence and divergence determinations. Determinations feed into confidence scores. Confidence scores gate the Plexus network. Room Functors transport arguments across rooms with fingerprinted provenance. At every stage, the reasoning is addressable, citable, challengeable, and durable.

Not every community will traverse the full pipeline. Most will operate at the early stages most of the time. The pipeline exists in its entirety so that the infrastructure is present when the community's reasoning reaches a point of complexity that warrants it.

---

## II. The Social Layer

### Feed and Posts

The main feed is chronological — content appears in the order it was posted by people and communities the user follows. There is no algorithmic ranking, no engagement optimization, no promoted content, no "suggested" posts from accounts the user did not choose to follow.

The platform supports seventeen post types, each rendered with a dedicated component:

- **Text** — plain text posts
- **Image / Image Compute** — photo uploads and AI-generated images
- **Video** — embedded video (YouTube, Vimeo, etc.)
- **Music** — SoundCloud player embed
- **Gallery** — multi-image carousel
- **Article** — long-form writing with hero image and reading time
- **Prediction** — LMSR prediction market
- **Product Review** — structured reviews with claims and vouching
- **Draw** — canvas drawing tool
- **Code** — code snippets with syntax highlighting
- **Library** — PDF stacks and collections
- **Portal** — external link embeds
- **Room Canvas** — spatial room embed
- **Livechat** — real-time chat node
- **Thread** — threaded discussion
- **Document** — PDF/document embed

Post creation uses a composer UI with a type selector and dedicated creation modals for each type. Posts support upvotes/downvotes, comments, sharing, timestamping, and deletion.

### Profiles and Social

User profiles with customizable display. Friend and follow systems. Notification pipeline for social actions, messages, challenges, and deliberation events. User discovery by interest, community membership, and group affiliation.

The social graph is owned by the user: exportable in open formats, portable, never sold or monetized. Discovery is through search and affiliation, not through algorithmic recommendation.

### Rooms and Lounges

Persistent spaces for communities, groups, projects, and organizations. Rooms are the primary organizational unit of the platform — each room has its own feed, discussions, shared library, member management, and (when the community is ready) its own deliberation space.

**Lounges** are lighter-weight social spaces — open or invite-only — for casual gathering, conversation, and ambient connection.

**Spatial Canvas Rooms** allow freeform arrangement of content — posts, images, documents, links, embeds — in a two-dimensional navigable space. The canvas can be collaboratively edited and annotated. Canvas rooms serve as visual workspaces, mood boards, reference collections, and spatial brainstorming environments.

Rooms and lounges are governed by their members. The platform provides infrastructure; the community provides governance. Moderation controls are local to the room.

### Messaging

Real-time messaging with direct messages, group conversations, and room-level chat.

**Message Layers.** The messaging system implements sheaf-based access control: each conversation has explicitly defined audience layers with sharing policies that determine what is visible to whom. The stratified communication that users already practice informally — what is public, what is group-only, what is private — is handled architecturally through defined layers rather than through the uncertainty of informal norms.

**Drifts.** Side conversations that branch from any anchor message, creating a threaded sub-conversation that preserves context from the parent message without disrupting the main flow.

**Proposals.** Collaborative documents embedded in conversations, with approval workflows and merge mechanics. A group member drafts a proposal; others review, comment, suggest changes, and approve or request modifications. The proposal workflow integrates with the room's governance structure.

**Polls.** Inline polls with two modes: multi-choice (select one or more options) and temperature check (gauge group sentiment on a spectrum). Polls can be embedded in any conversation.

**Read Receipts and Acknowledgments.** Optional and transparent. Message forwarding with access-control validation — the platform checks whether the forwarding target has permission to see the forwarded content before allowing the forward.



## III. The Reasoning Layer

### The Deliberation Engine

The core formal system. When a discussion is upgraded to a deliberation, the following infrastructure becomes available:

**Claims** are addressable objects with stable identifiers, version history, and authorship attribution. A claim can be in one of several statuses: proposed, accepted, challenged, defended, retracted, or resolved.

**Arguments** instantiate formally recognized reasoning patterns. The platform implements over sixty argumentation schemes from the Walton taxonomy — Argument from Expert Opinion, Argument from Analogy, Argument from Sign, Argument from Cause to Effect, and so on. Each scheme has a defined structure (premises, conclusion, inference rule) and auto-generated critical questions that identify the specific points where the argument could fail.

**Dialogue Moves** are typed speech acts governed by protocol: Assert, Challenge, Defend, Concede, Retract, Request Clarification, and others. Each move creates specific obligations and permissions for subsequent moves. The protocol ensures that challenges cannot be silently ignored — an unanswered challenge is a recorded datum.

**Commitment Stores** track what each participant has asserted, conceded, retracted, and is currently committed to. The store monitors consistency: if a participant's commitments contradict each other, the contradiction is flagged. If a commitment is retracted, downstream arguments that depended on it are identified.

**Argument Chains** organize arguments into sequential or branching structures. Chains can be rendered in multiple views: list (linear sequence), thread (branching tree), canvas (spatial graph), brief (legal-style structured document), and auto-generated essay (prose narrative derived from the argument structure).

**The Deliberation Dictionary** allows key terms to be formally defined, contested, and versioned within a deliberation. When a dispute turns on the meaning of a term, the term is entered in the dictionary with its proposed definition, and the definition itself can be challenged and refined through the same dialogue protocol.

**ASPIC+ Evaluation.** The platform computes grounded extensions — the maximal sets of mutually consistent arguments that can be simultaneously defended — using the ASPIC+ framework for structured argumentation. This provides a formal determination of which arguments survive challenge given the current state of the deliberation.

**Ludics Evaluation.** The entire deliberation can be modeled as an interactive game between Proponent and Opponent designs under Girard's Ludics semantics. Strategic landscapes can be heat-mapped to identify decisive positions (where the game is determined), turning positions (where a single move changes the outcome), and bottleneck positions (where progress depends on resolving a specific sub-argument).

### Stacks and Evidence Library

Document management integrated with the deliberation engine.

**Document Storage.** Upload, organize, and share PDFs, papers, reports, and other source materials. Documents are stored in Stacks — themed collections that can be shared across rooms or kept private.

**Executable Citations.** Four anchor types for linking evidence to arguments: page-level, passage-level, figure-level, and section-level. Each citation is executable — clicking it navigates to the exact location in the source document. Citations carry intent labels: supports, challenges, provides context, provides evidence, qualifies, or extends.

**Annotation and Promotion.** Source documents can be annotated in the library. Annotations are conversations — threaded discussions attached to specific passages. Any annotation can be promoted into the deliberation graph: a marginal note becomes a proposition, which can be workshopped into a claim, which can be structured into an argument.

**Knowledge Graph.** Sources, claims, arguments, and deliberations are connected in a navigable knowledge graph. Cross-deliberation source discovery identifies cases where the same document has been cited in multiple contexts, enabling communities to find related reasoning.

**DOI Resolution.** Digital Object Identifiers are resolved automatically, pulling metadata and linking to canonical sources.

### The Article System

A full-featured publishing system integrated with the social and reasoning layers.

**Editor.** Rich text editing powered by TipTap with custom nodes (image, pull-quote, callout, KaTeX math block, code, embed, deliberation block) and a slash-command menu for fast block insertion. An advanced toolbar exposes the full formatting surface; paste sanitization safely handles content from external sources; a 20k character limit is tracked live.

**Templates.** Three article templates govern layout and reader chrome: **Standard** (clean minimal layout for most articles), **Feature** (magazine-style with hero image and large title), and **Interview** (Q&A format with speaker attribution).

**Publishing Workflow.** Draft → Published with metadata generation, autosave, revision history with version comparison, and a full Articles dashboard supporting search, filter, trash, and CRUD. Hero-image upload with cropping. Articles can be published to user profiles, rooms, or the platform's public knowledge base; published articles surface in the platform feed and render through template-specific reader layouts with cards, preview modals, and social actions (like, save, share).

**Anchored Comments.** Comment threads attach to specific passages in the article, with collision resolution when multiple comment threads target overlapping text ranges. A sidebar comment rail surfaces all threads in document order. Readers engage with the article at the level of the sentence rather than at the level of the page.

**Rhetoric Analysis Overlays.** Visual overlays that surface the article's persuasive strategies — hedges, intensifiers, absolutes, analogies, metaphors — color-coded inline so readers (and authors) can see the rhetorical architecture beneath the prose alongside claim density, evidence distribution, and argument structure indicators.

**Proposition Composer.** Annotations and comments can be promoted directly into the deliberation engine through a composition interface that guides the user from informal observation to structured claim. The deliberation panel embeds the full deliberation system inside the article reader.

### The Discussion System

The lightweight informal layer — forums, topic-based conversations, and loose exchanges. The discussion system is the most common entry point for community interaction and the starting point of the knowledge production pipeline.

**Upgrade Paths.** Any discussion can be upgraded to a structured deliberation when the conversation warrants it. The upgrade preserves the discussion's content and participants while adding the formal infrastructure of the deliberation engine. The upgrade is a single action. It does not require the participants to have prior experience with the formal tools.

### The Knowledge Base

The durable, public-facing output of the reasoning process.

**Publishable Pages.** Knowledge base pages combine prose narrative with live deliberation blocks — embedded views of argument graphs, claim statuses, confidence scores, and evidence summaries that reflect the current state of the underlying deliberation. The pages are stable and citable: each has a permanent URL and a versioned reference.

**Live Deliberation Blocks.** Embedded components that render the current state of a deliberation within a knowledge base page. If the underlying deliberation is updated — new evidence, new challenges, revised confidence scores — the blocks update accordingly. The knowledge base is not a snapshot. It is a live view.

### The Plexus Network

The cross-context layer that connects deliberation rooms into a network.

**Graph-of-Graphs.** The Plexus network visualizes the relationships between deliberation rooms as a meta-graph. Rooms are nodes. The connections between them are typed edges.

**Five Meta-Edge Types:**

1. **Shared Claims** — two rooms contain arguments about the same claim.
2. **Shared Evidence** — two rooms cite the same source material.
3. **Transported Arguments** — an argument from one room has been imported into another.
4. **Cross-References** — a deliberation in one room explicitly references a determination in another.
5. **Institutional Links** — rooms operated by the same organization or community are structurally connected.

**Room Functors.** Arguments are transported between rooms through functors that preserve inferential structure. When an argument is imported, it carries its provenance — its origin room, its challenge history, its confidence score, its evidence links — with SHA-1 fingerprinted integrity. The receiving room can verify that the imported argument has not been altered in transit.

**Confidence Gating.** Each room can set a confidence threshold for incoming arguments: only arguments that meet the threshold (based on their evaluation in the source room) are eligible for import. Three scoring modes:

- **Logical** — based on the argument's formal structure (ASPIC+ grounded extension status).
- **Social** — based on community assessment (upvotes, endorsements, expert ratings).
- **Hybrid** — a weighted combination of logical and social scores.

**Visualization.** The Plexus network can be viewed as a graph (node-link diagram), a board (kanban-style grouped by meta-edge type), or a matrix (adjacency matrix showing connection density between rooms).

---

## IV. Embeddable Argument Widgets and AI-Epistemic Primitive

Arguments and claims produced on the platform are exposed beyond the platform through a layered set of distribution surfaces. The same primitive that powers a Reddit unfurl powers an LLM citation, a Google fact-check card, and a researcher's BibTeX entry.

### Permalink and Embed Infrastructure (Phase 1)

**Permalink Pages.** Every claim and every argument resolves to a permanent URL — `/a/[shortCode]` for arguments, `/c/[moid]` for claims — that renders a standalone, public, no-auth page showing the conclusion, premises, scheme, evidence list, confidence score, challenge history, and current standing. This is the public face of a structured argument.

**OG Social Cards.** When an Isonomia link is shared on external platforms (Twitter, Reddit, Slack, Hacker News, Discord), it unfurls as a rich 1200×630 preview card generated via Next.js `ImageResponse`, showing the argument's structure — conclusion, premise count, evidence count, confidence score, scheme, and challenge status.

**iframe Embeds.** Any argument or claim can be embedded in external websites through a standard iframe tag pointing at `/embed/argument/[id]` or `/embed/claim/[moid]`. The embed renders as an interactive card that can be expanded, navigated, and — if the viewer has an account — challenged directly from the embed.

**oEmbed Discovery.** Standard oEmbed protocol support at `/api/oembed` for automatic embed rendering by platforms and CMS systems that consume oEmbed. The widget API at `/api/widgets/embed` covers argument and claim types uniformly.

**JSON-LD Structured Data.** Every permalink emits Schema.org `CreativeWork` + `Claim` + `ScholarlyArticle` + `ClaimReview` composite metadata so arguments are discoverable as structured fact-check cards in search engines and ingestible by any consumer of standards-grounded linked data.

### Creation and Share Flow (Phase 2)

**Share Modals.** `ShareArgumentModal` and `ShareClaimModal` provide tabbed share surfaces (Link / Embed / Markdown / Plain Text) with a live OG-card preview, accessible from the action row of every argument and claim card.

**Quick Argument API.** `POST /api/arguments/quick` performs an atomic create — Claim + Evidence + Argument + Permalink — in a single request, returning the shareable URL.

**Quick Argument Builder.** A lightweight composer (mounted standalone at `/quick`) for constructing a structured argument (claim, premises, evidence) and generating a shareable link in under sixty seconds. It is the on-ramp that converts a person with an argument into a person with a *structured* argument.

**URL Unfurl.** `GET /api/unfurl` provides SSRF-guarded URL metadata extraction (title, favicon, site name) at a 60-requests/hour rate limit, used by the builder to enrich evidence URLs.

**My Arguments Auto-Deliberation.** A user's first quick argument auto-creates a personal deliberation (`hostType: "free"`) so every individually authored argument still lives inside the deliberation infrastructure with no setup overhead.

### Distribution — Browser Extension 

A Manifest V3 browser extension at [extensions/chrome/](extensions/chrome/) ships across Chrome, Firefox (via `webextension-polyfill`), and Safari (via the Safari Web Extensions Xcode wrapper):

- **Context menu.** Select text on any webpage → right-click → "Create Isonomia Argument" pre-populates the Quick Builder with the selection, page URL, and page title.
- **Content script.** Detects `isonomia.app/a/` and `isonomia.app/c/` links on Reddit, Twitter/X, and Hacker News and injects rich inline previews (claim text, scheme, confidence, evidence count, author).
- **Popup.** A compact Quick Argument Builder embedded in the extension popup for one-click creation without leaving the page, plus a list of the user's recent arguments.
- **Auth.** OAuth-style handshake against `isonomia.app/login?ext={extensionId}&redirect=extension`.

### Deliberation-Scope Embeds 

The `IsonomiaWidget` component ([components/embeddable/IsonomiaWidget.tsx](components/embeddable/IsonomiaWidget.tsx)) lifts the embed primitive from a single argument to an entire deliberation, exposing a state card and a contested-frontier lane suitable for embedding inside articles, briefs, or third-party sites. It is backed by the deliberation-scope readouts described in §V.

### The AI-Epistemic Primitive

Layered on top of the embeddable surface is the **AI-citation primitive**: every permalink is treated as a machine-citable, dialectically-attested, content-hashed epistemic artifact, exposed over content-negotiated HTTP and over the Model Context Protocol. The primitive is organized around six pillars, each with concrete shipped surfaces:

1. **Machine-citable structured arguments.** Every permalink resolves to a structured AIF subgraph (claim, premises, scheme, evidence) — not just prose. `GET /a/{id}` performs content negotiation across HTML, JSON-LD, AIF, and a compact attestation envelope. `?format=jsonld` emits AIF + Schema.org composite; `?format=attestation` returns the citation envelope.
2. **Verifiable provenance, end-to-end.** Argument-level: `contentHash = sha256(canonical(claim, premises, scheme, evidence))` and an immutable URL `/a/{shortCode}@{hash}`. Evidence-level: server-side fetch hash, archive.org snapshot URL, `fetchedAt`, content-type. Premise-level: counters surface unattested premises honestly. The MCP `cite_argument` tool exposes `provenance.unattestedPremises` directly.
3. **Dialectical honesty by construction.** Citations ship with their opposition attached. `cite_argument.strongestObjection` is on by default. `standingState` is classified — `untested-default | untested-supported | tested-attacked | tested-undermined | tested-survived` — rather than collapsed to a raw float. `find_counterarguments` excludes same-conclusion-MOID self-counters. `?sort=dialectical_fitness` re-ranks results by tested-and-survived status.
4. **Standards-grounded interoperability.** AIF + JSON-LD + Schema.org + MCP, with no bespoke formats. AIF context publishes `aif:` / `as:` / `cq:` prefixes; the Schema.org composite combines `Claim` + `ScholarlyArticle` + `ClaimReview`. An OpenAPI 3.1 spec is served at `/api/v3/docs` (Scalar UI). The MCP server (six tools, stdio) is installable into Claude Desktop in three lines.
5. **Shippable on existing infrastructure.** Built on the production argument graph, scheme catalog, and permalinks. No second source of truth. Verifier suites cover attestation (54/54) and MCP (37/37); a seedable showcase chain exists at `scripts/seed-showcase-chain.ts`.
6. **Deliberation-scope readiness and honesty.** Above the per-argument primitive sits a deliberation-scope substrate that refuses to summarize prematurely:
   - **DeliberationFingerprint** — counts, depth, CQ coverage, AI-vs-human extraction split (cached by content hash, 30-second SWR dedupe).
   - **ContestedFrontier** — unanswered undercuts/undermines/CQs and terminal leaves, surfaced as the live edge of the deliberation.
   - **MissingMoveReport** with per-argument and rollup views, plus a **ChainExposure** projection identifying the weakest link in any inference chain.
   - **SyntheticReadout** — a deterministic synthesis with an explicit `honestyLine` and a `refusalSurface` referencing real graph node ids when the deliberation is too immature to summarize.
   - **AI-engagement telemetry** that distinguishes genuine reasoning from articulation-only chips.
   - **Cross-deliberation aggregation** with a consistent IN / OUT / contested / undecided rule.

Together these surfaces let an LLM cite a unit (not a webpage), prove what it cited and when, and surface the strongest known objection alongside the citation. An empty result is honestly empty rather than a false positive.

---

## V. Living Documents — Theses, Briefs, and Peer Review

Isonomia treats long-form scholarly and policy outputs as **living documents** whose embedded claims, arguments, propositions, and citations remain bound to the live argument graph. The same infrastructure powers research theses, policy briefs, and academic peer reviews.

### Living Thesis

A thesis is a TipTap document whose embedded `claim`, `argument`, `proposition`, and `citation` nodes read live state from the deliberation graph rather than holding a frozen copy. The system ships across seven phases:

**Phase 1 — Live Binding.** A batched `GET /api/thesis/[id]/live` endpoint returns a single payload that feeds every embedded node on the page. The `useThesisLive` hook + context provides one SWR subscription per page with per-object lookup. Every embedded TipTap node reads its support count, attack count, evidence count, and IN/OUT/UNDEC label from this live source.

**Phase 2 — Inspector.** A single right-side `ThesisInspectorDrawer` opens for any embedded element and is fed by `GET /api/thesis/[id]/inspect/[kind]/[objectId]`, which returns a joined detail blob (lineage, evidence, attacks, satisfied/unsatisfied CQs).

**Phase 3 — Attack Register.** A sticky `ThesisAttackRegister` panel groups every attack on every thesis element by status (Undefended / Defended / Conceded), filterable and sortable via `GET /api/thesis/[id]/attacks?status=…`. Attack types follow the AIF taxonomy: `UNDERCUTS`, `UNDERMINES`, `REBUTS`.

**Phase 4 — Confidence.** A pure `confidence` formula computes per-prong and per-thesis scores with explicit weights; a `ConfidenceBadge` hover-card discloses every input × weight = contribution so the score is auditable rather than opaque. Backed by `GET /api/thesis/[id]/confidence`.

**Phase 5 — Snapshots.** `ThesisSnapshot` is a user-triggered point-in-time freeze for citers. Snapshots render at `/view/snapshot/[id]` without `ThesisLiveProvider` (so they are stable even as the underlying graph evolves), and `GET /api/thesis/[id]/snapshots/[snapshotId]/compare` produces a diff against any other snapshot or the live state.

**Phase 6 — Traversals.** `?focus=` deep-link routing accepts either a thesis-internal id or a global Claim MOID, resolved via `GET /api/thesis/[id]/focus`. Every lineage row in the Provenance tab is a clickable navigation. Cross-thesis backlinks ("used in") are exposed at `GET /api/objects/[kind]/[id]/backlinks`.

**Phase 7 — Hardening.** Reader-poll structured logging, read/write permission gates, and backlinks redaction for elements the viewer cannot see.

### Living Peer Review

The peer review system uses the same dialogue moves as deliberations and ships across three phases.

**Phase 4.1 — Review structure.** Configurable **review templates** define criteria sets and multi-phase structure (e.g. Initial Review → Author Response → Revision). Reviews support blind/open modes and target type discrimination across paper, preprint, thesis, and grant. **Reviewer assignments** carry roles, accept/decline workflows, and reviewer commitments scoped to specific issues with resolution tracking. **Author responses** flow as structured dialogue moves — concede, rebut, clarify, revise — each linked to the commitment it addresses, scoped to the current phase. The **review lifecycle** advances through phases with editorial decisions (accept / revise / reject), progress and timeline visualization, and per-phase outcomes.

**Phase 4.2 — Argumentation-based reputation.** Scholarly reputation is derived from argumentation outcomes rather than citation counts or journal prestige. **Contribution tracking** records 19 distinct contribution types with quality multipliers, verification status, and deliberation scope. **Scholar statistics** aggregate defense success rate, attack precision score, consensus rate, and downstream citation count. **Topic expertise** runs on a five-level scale (Novice → Authority) with per-topic scoring, expert discovery by topic area, and a reputation leaderboard. **Reviewer recognition** tracks completion and quality metrics, timeliness (average response days), blocking-concern resolution rate, and topic specializations.

**Phase 4.3 — Academic credit integration.** **ORCID integration** provides an OAuth 2.0 connection flow, push-works to ORCID profiles, auto-sync of eligible contributions, and token-refresh handling. **CV export** emits JSON-LD (Schema.org), BibTeX, LaTeX source, and CSV. **Institutional reports** aggregate faculty contribution breakdowns at department and institution level with impact metrics (citations, consensus) and period-over-period comparison.

### Fork and Merge

Deliberations and theses can be forked — creating a parallel version that explores an alternative line of argument — and merged when the parallel lines converge. The model is borrowed from version control (Git) and applied to reasoning.

---

## VI. Institutional Workflow Layer — Pathways and Facilitation

Where the deliberation engine handles the *production* of structured reasoning, the institutional workflow layer handles its *transmission to and reception by* the bodies authorized to act on it. Two complementary subsystems live here.

### Pathways (Scope A)

Pathways move a deliberation's outputs into the formal record of an institution and track the institution's response.

- **Institution Registry.** A verifiable directory of agencies, councils, NGOs, and their members. Institutions are first-class platform objects with member rosters and authority scopes; they appear as violet diamonds on the Plexus network graph.
- **Role Gating and Public Redaction.** Uniform admin / host / facilitator gates implemented in `lib/pathways/auth`, with public redaction rules so the audit log is publishable without leaking participant identities.
- **Open Pathway.** A deliberation's recommendations are forwarded to a registered institution as a packet with a defined channel and target.
- **Hash-Chained Audit Log.** Every pathway action is recorded as a `PathwayEvent` in a tamper-evident chain anchored at a `DRAFT_OPENED` genesis event.
- **Recommendation Packets.** Versioned, freezable bundles of claims, arguments, cards, and notes — the unit of submission to an institution.
- **Submission Channels.** Packets can be sent in-platform, by email, by API, or as manually logged external submissions; the channel and its hints are recorded.
- **Institutional Responses.** Institutions reply with per-item dispositions, with coverage tracking that surfaces which packet items remain unaddressed.
- **Plexus Visualization.** Pathway connections render on the cross-context Plexus graph, so a deliberation's downstream institutional fate is visible at a glance.

### Facilitation (Scope C)

Facilitation provides the live operational surface for facilitators running structured deliberations, with audit trails for the work the facilitator does.

- **Cockpit and Question Authoring.** A facilitator-only cockpit organizes the live session: the active facilitation question, the parent context, session status, and quick-action controls. Facilitation questions can be authored, scoped to specific arguments or claims, and rotated through the session.
- **Equity Surface.** A real-time equity panel tracks who has spoken, who has not, and how participation distributes across constituencies. Facilitators can see when intervention is warranted before participation imbalances calcify.
- **Timeline and Interventions.** A session timeline records every facilitator intervention as a typed, attributed event (e.g. redirect off-topic, surface minority view, reframe). Interventions are part of the audit log.
- **Handoff Dialog.** A formal handoff flow when one facilitator passes control to another mid-session, preserving session state and acknowledging context transfer.
- **Pending Banner and Report.** A pending-action banner surfaces queued moderator decisions; an end-of-session report compiles the timeline, equity metrics, and interventions for sharing with participants and institutional sponsors.
- **Analytics and Canonical Export.** `GET /api/deliberations/[id]/facilitation/analytics` exposes the analytics readout for inspection; `GET /api/facilitation/sessions/[sessionId]/export` returns a canonical export of the session for archival or external review.

Facilitation is opt-in. Most rooms operate without it. It exists for the deliberations whose stakes warrant a trained facilitator and an auditable record of facilitator behavior.

---

## VII. Theoretical Foundations

The platform's reasoning layer is grounded in formally studied frameworks:

**Formal Argumentation Theory.** ASPIC+ (Prakken, 2010; Modgil & Prakken, 2018) provides the framework for structured argumentation with grounded extension computation. The Walton taxonomy (Walton, Reed & Macagno, 2008) provides over sixty argumentation schemes with associated critical questions. The Argument Interchange Format (AIF) (Chesñevar et al., 2006; Reed et al., 2010) provides the ontology for interoperable argument representation and JSON-LD export.

**Interactive Proof Theory.** Ludics (Girard, 2001) models deliberation as a game between Proponent and Opponent strategies. Convergence and divergence are computed through the interaction of designs. The Ludics layer provides game-theoretic evaluation that is independent of the ASPIC+ evaluation, offering a complementary perspective on which arguments are strategically decisive.

**Evidence Theory.** Dempster-Shafer theory handles the combination and aggregation of evidence from multiple sources with varying degrees of reliability, producing belief functions that represent the state of evidential support more precisely than binary true/false or simple probability.

**Category-Theoretic Models.** Ambler's compositional semantics of evidence (evidential categories, SLat-enriched categories with symmetric monoidal structure) provides the mathematical foundation for the evidence algebra and the Plexus transport mechanism. Morphisms are evidence arrows. The tensor product (⊗) conjoins evidence. The join operation (∨) aggregates within hom-sets. Selected maps (simple ∧ entire) provide the cartesian subcategory where projection and pairing laws hold exactly — the mathematically safe fragment for operations like "duplicate premise" and "project reason."

**Formal Dialogue Systems.** The dialogue protocol draws on the tradition of formal dialogue games (Hamblin, 1970; Walton & Krabbe, 1995), implementing typed speech acts with defined obligations and permissions.

These foundations are fully implemented and operational. They are also fully invisible to the user who does not seek them. The platform's formal complexity is the basis of its interface simplicity: the systems that enforce argumentative rigor behind the interface are what allow the interface to present structured reasoning through clear, guided forms rather than requiring the user to learn the underlying theory.

---

## VIII. Technical Stack

- **Framework:** Next.js
- **Database:** Prisma ORM with Supabase (PostgreSQL)
- **Real-time:** Supabase broadcast for messaging, presence, and live updates
- **State Management:** Zustand
- **Rich Text:** TipTap with custom nodes (MathBlock, MathInline, deliberation embeds)
- **Graph Visualization:** D3, React Flow with Dagre layout
- **Mathematical Typesetting:** KaTeX
- **Design Language:** Consistent, restrained, and legible across all subsystems. The social layer uses warmer tones and softer transitions. The reasoning layer uses cream backgrounds and gold accents with institutional clarity. Both share a unified typography and component system.

---

## IX. Data Ownership and Privacy

- All data is owned by the user and the community that produced it.
- Data is exportable at any time in open formats (JSON, AIF, BibTeX, Markdown, PDF).
- The platform collects only what users post. No behavioral tracking, no engagement analytics, no shadow profiles, no data broker relationships.
- Users can contribute anonymously. The platform supports pseudonymous and anonymous participation with configurable attribution policies per room.
- The platform is self-hostable. Organizations that require full control over their data can deploy the platform on their own infrastructure using the open-source codebase.
- The architecture is designed with the understanding that many of the communities the platform serves have historical and ongoing reasons to distrust data collection. The privacy commitments are enforced by architecture, not by policy.

---

## X. Distribution and Governance

**Open Source.** The entire codebase is public. Contributions are welcome. The platform's architecture, including the formal argumentation engine, is available for inspection, audit, and extension by any party.


**Sustainability Model.** The platform is free for all users. Sustainability is pursued through grants (NEH, NSF, foundation funding), institutional partnerships (universities, policy organizations, civic institutions), and optional hosted enterprise services for organizations that require managed infrastructure with SLA guarantees.

---

## XI. Applications

**Community organizations** use the social layer for ongoing community engagement — forums, rooms, messaging, shared documents — and the reasoning layer when participatory input needs structure: planning processes, budget deliberations, program evaluations, needs assessments. The platform preserves the reasoning behind community decisions, not just the decisions themselves.

**Research teams and reading groups** use the social layer for discussion and shared libraries. When a research question crystallizes or an interpretive disagreement becomes substantive, the reasoning layer provides infrastructure for structured synthesis. Evidence is linked to claims at the source level. The synthesis is collaborative, living, and navigable as a graph.

**Student organizations and governance bodies** use the social layer for coordination and the reasoning layer for decisions that affect constituents. The reasoning persists after the officers graduate.

**Open-source projects** use the social layer for community building and the reasoning layer for architectural decisions and RFCs. Technical reasoning is structured, challenged, and preserved beyond the contributor who made it.

**Civic media and public interest journalism** embed argument maps into articles, providing readers with navigable representations of public debates that update as the debate evolves.

**Policy organizations and regulated industries** use the reasoning layer for structured analysis with auditable reasoning chains. The audit trail is generated by the process, not reconstructed after the fact.

**Academic publication and peer review** uses the Living Peer Review system for public, structured, credited review processes that improve on the opacity and inefficiency of traditional anonymous review.

**Individuals and informal communities** use the social layer as a social platform — posting, sharing, discussing, connecting — with the knowledge that the reasoning layer is available when they need it and invisible when they don't.

---

## XII. The Proposition

Social platforms circulate content. The circulation is optimized for engagement: the architecture selects for what produces reaction and selects against what requires sustained attention. The result is discourse in which reasoning — the inferential structure that connects evidence to claims to conclusions — is structurally unsupported. The reasoning happens. The platforms do not preserve it.

Isonomia is designed from first principles to support the full range of what communities do when they gather: from casual conversation to formal deliberation, from sharing a photograph to defending a thesis, from the ambient connection of a feed to the tracked obligation of a challenge-response protocol.

The social layer provides the space. The reasoning layer provides the structure. The spectrum between them is continuous. The community moves along the spectrum as its needs dictate. The platform holds everything the community produces — the posts and the proofs, the comments and the commitments, the shared links and the shared reasoning — in a single architecture where nothing is lost.

Every claim has a stable identifier. Every argument follows a recognized scheme. Every challenge creates an obligation. Every piece of evidence links to its source. Every determination is provisional, subject to better evidence and stronger argument. Every community owns its data. The code is open. The infrastructure is public.

The feed is chronological. The deliberation is formal. The space between them is yours.


*Isonomia is free, open-source, and community funded.*

*MESH · Isonomia*
