# Isonomia Platform Overview

> Audience: new contributors and stakeholders who need a bird's-eye understanding of what Isonomia is, what it contains, and how its parts fit together. This document is descriptive, not persuasive. It does not argue for the project's value; it explains its scope, structure, and surfaces.

---

## 1. What Isonomia Is

Isonomia is a web platform for **structured collective reasoning**. It treats arguments, claims, evidence, and the relations between them as first-class, persistently identified objects that can be inspected, challenged, cited, and revised over time.

Concretely, Isonomia provides:

- A **deliberation environment** in which users author claims and arguments inside bounded discussion spaces.
- A **formal argumentation layer** that interprets those contributions through Walton-style argumentation schemes, AIF graph semantics, and ASPIC+-style defeat reasoning.
- A **provenance and citation layer** that links every claim and argument to verifiable source material, with content hashes, archival snapshots, and stable permalinks.
- A **machine-readable surface** (JSON-LD, AIF, MCP) that lets external tools, LLMs, and federated services consume and extend the argument graph.

The Isonomia codebase lives inside the broader Mesh monorepo. Mesh provides the underlying social, real-time, and infrastructure substrate; Isonomia is the argumentation product built on top. A number of Mesh-level components (auth, real-time channels, embeddings, queues) are reused directly.

### 1.1 Distinguishing characteristics

- **Persistent identity for every element.** Claims, arguments, attacks, and citations have stable URLs and content hashes. Relations evolve; identities do not.
- **Live, not static.** A cited argument's standing (supported, attacked, undermined, survived) can change after publication, and citations to it reflect that.
- **Formal under the hood.** Beneath the conventional UI is a typed argument graph (AIF), scheme-typed inference, critical-question machinery, and defeat semantics.
- **Open at the edges.** Content is exposed as JSON-LD/AIF, embeddable widgets, OG cards, an oEmbed endpoint, a browser extension, and an MCP server for LLM tool use.

---

## 2. Theoretical and Formal Foundations

Isonomia is a working implementation of several established frameworks from computational argumentation. Each framework maps to specific code paths.

| Framework | Role in Isonomia | Primary location |
|-----------|------------------|------------------|
| **AIF** (Argument Interchange Format) | Canonical graph representation: I-nodes (information), S-nodes (schemes), RA/CA-nodes (inference / conflict). | [lib/aif/](lib/aif/), [docs/AIF_ONTOLOGY_GUIDE.md](docs/AIF_ONTOLOGY_GUIDE.md) |
| **Walton schemes** | Templates for argument types (expert opinion, practical reasoning, cause-to-effect, analogy, etc.) with associated critical questions. | [lib/schemes/](lib/schemes/), [docs/AIF_ASPIC_MESH_MAPPING.md](docs/AIF_ASPIC_MESH_MAPPING.md) |
| **Critical Questions (CQs)** | Per-scheme prompts that challenge an argument's defensibility; satisfaction state is tracked. | [lib/cqs/](lib/cqs/), [docs/CQ_COMPLETE_IMPLEMENTATION_GUIDE.md](docs/CQ_COMPLETE_IMPLEMENTATION_GUIDE.md) |
| **ASPIC+** | Structured argumentation semantics; computes attacks, defeats, and acceptable extensions. | [lib/aspic/](lib/aspic/) |
| **Ludics** | Game-theoretic dialogue layer (designs, loci, acts, polarity) that formalizes interactive proof. | [lib/ludics/](lib/ludics/), `packages/ludics-*` |
| **Dempster–Shafer** | Belief-mass aggregation across multiple supporting/attacking arguments. | [lib/epistemic/](lib/epistemic/) |
| **Provenance** | Immutable evidence chain: import → cite → lift → share → export. | [lib/provenance/](lib/provenance/), [lib/citations/](lib/citations/) |

The five-layer integration — CQ → Dialogue Move → AIF node → ASPIC defeat → Ludic act — is documented in [docs/cq-dialogue-ludics-flow.md](docs/cq-dialogue-ludics-flow.md).

---

## 3. Domain Model

The canonical schema is [lib/models/schema.prisma](lib/models/schema.prisma). It contains roughly 80 core models. The most important ones, grouped by purpose:

### 3.1 Deliberation tier — reasoning spaces

- **Deliberation** — A bounded reasoning session (policy debate, academic discussion, room thread, library stack). Carries proof-mode and representation-rule settings.
- **Proposition** — Pre-promotion, workshopped statement; can be promoted to a Claim.
- **Claim** — A stable asserted proposition, attackable and defendable. Carries cross-deliberation identity via `canonicalClaimId`.
- **Argument** — A reasoned inference whose premises support (or attack) a conclusion claim. Embeds dense vectors for semantic search.

### 3.2 Argumentation tier — schemes and CQs

- **ArgumentScheme** — A Walton-style template (`key`, premises, conclusion, CQs, `materialRelation`, `reasoningType`, `semanticCluster`, `parentSchemeId`).
- **ArgumentSchemeInstance** — Multi-scheme classification on an argument (with confidence, role, rule type STRICT/DEFEASIBLE).
- **CriticalQuestion** — Per-scheme challenge with `attackKind` (UNDERMINES/UNDERCUTS/REBUTS) and `burdenOfProof`.
- **SchemeNet / SchemeNetStep** — Sequential composition of schemes for multi-step arguments.

### 3.3 Attack and defense tier

- **ArgumentEdge** — Directed support/attack between arguments, scoped to conclusion, premise, or inference.
- **ConflictApplication** — Formal attack instantiation in ASPIC+ terms (undermining / rebutting / undercutting).
- **ClaimAttack / ClaimDefense / ClaimContrary** — Claim-level conflict relations.

### 3.4 Dialogue and moves

- **DialogueMove** — Canonical structured action: ASSERT, WHY, GROUNDS, CONCEDE, RETRACT, CLOSE. Each move can produce AIF nodes and edges.
- **NonCanonicalMove** — Community-proposed extensions outside the canonical protocol; flow through PENDING → APPROVED → EXECUTED. See [docs/NON_CANONICAL_MOVES_SPEC.md](docs/NON_CANONICAL_MOVES_SPEC.md).
- **ClarificationRequest** — Out-of-protocol factual questions on a target.

### 3.5 Ludics and AIF graph

- **LudicAct / LudicDesign / LudicTrace** — Formal dialogue execution.
- **AifNode / AifEdge** — Canonical machine-readable graph; populated as a side effect of dialogue moves.

### 3.6 Evidence and citation

- **Source** — A cited work (article, dataset, video, etc.) with verification and archival status.
- **Citation** — A claim or argument citing a source, with locator, intent, anchor type, and quote.
- **ClaimEvidence** — Evidence attached to a claim, with `contentSha256`, `archivedUrl`, `archivedAt`.
- **EvidenceProvenanceEvent** — Immutable audit chain across the evidence lifecycle.
- **QuoteNode** — First-class quotes with locators and interpretations.

### 3.7 Standing and quality signals

- **CQStatus / CQResponse** — Tracks satisfaction state of critical questions.
- **ArgumentApproval** — User endorsements.
- **ArgumentCitation** — Argument-to-argument citation with metrics.

### 3.8 Thesis and knowledge graph

- **Thesis / ThesisProng / ThesisProngArgument** — Long-form, navigable theses compiled from a deliberation.
- **DebateSheet / DebateNode** — Graph projection used for visualization.
- **BriefVersion / DebateRelease** — Versioned snapshots with semantic versioning.

### 3.9 Cross-cutting models

- **Sheaf** facets (audience-scoped layered messages) — see [packages/sheaf-acl/](packages/sheaf-acl/).
- **Pathways**, **Facilitation**, **Typology / MetaConsensus** models — institutional deliberation surfaces.
- **ClaimPrediction**, **PredictionMarket**, **Trade**, **Wallet** — commitment and prediction subsystem.

---

## 4. System Architecture

Isonomia is a Next.js 14 application backed by PostgreSQL, Redis, and a small set of Python microservices, with workspace packages for reusable subsystems.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Public surfaces                                                         │
│  Web app · Embed/oEmbed · OG cards · Chrome extension · MCP · AIF JSON  │
├──────────────────────────────────────────────────────────────────────────┤
│  Next.js (app/)                                                          │
│  React UI (components/)  ·  App-Router pages  ·  /api/* route handlers   │
├──────────────────────────────────────────────────────────────────────────┤
│  Domain & business logic (lib/)                                          │
│  argument · aif · aspic · ludics · cqs · citations · provenance ·        │
│  schemes · deliberation · thesis · sources · search · realtime           │
├──────────────────────────────────────────────────────────────────────────┤
│  Workspace packages (packages/)                                          │
│  sheaf-acl · isonomia-mcp · ludics-core/engine/react/rest · aif-core ·   │
│  ui · commonplace                                                        │
├──────────────────────────────────────────────────────────────────────────┤
│  Background workers (workers/) — BullMQ on Upstash Redis                 │
├──────────────────────────────────────────────────────────────────────────┤
│  Python services (services/) — embedding · ranker · explainer · features │
├──────────────────────────────────────────────────────────────────────────┤
│  Storage & infra                                                         │
│  PostgreSQL + pgvector · Redis · Pinecone · Supabase · AWS S3 / KMS      │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Frontend layer

- **Framework:** Next.js 14 (App Router), React 18, TypeScript (strict), Tailwind.
- **Routing groups** under [app/](app/):
  - `(auth)` — login, signup, onboarding.
  - `(root)` — authenticated app, with `(standard)` linear feed and `(realtime)` canvas surfaces.
  - `api/` — REST/JSON-LD route handlers (see §4.3).
- **Components** live in [components/](components/), organized by domain (arguments, claims, deliberations, thesis, glossary, embeddable, etc.).
- **Graph rendering:** Cytoscape + Dagre for argument networks; React Flow for canvas editing; D3 for ad-hoc visualization.

### 4.2 Domain logic layer (lib/)

Server-side modules group by concern:

- [lib/argument/](lib/argument/) — argument validation and scheme matching.
- [lib/aif/](lib/aif/), [lib/aspic/](lib/aspic/), [lib/ludics/](lib/ludics/) — formal layers.
- [lib/cqs/](lib/cqs/) — critical-question state and responses.
- [lib/citations/](lib/citations/) — attestation, JSON-LD builders, standing/fitness ([lib/citations/argumentAttestation.ts](lib/citations/argumentAttestation.ts)).
- [lib/sources/](lib/sources/), [lib/provenance/](lib/provenance/) — source verification, archival, evidence chains.
- [lib/deliberation/](lib/deliberation/), [lib/dialogue/](lib/dialogue/) — deliberation lifecycle and dialogue moves.
- [lib/thesis/](lib/thesis/) — thesis compilation.
- [lib/canonical/](lib/canonical/), [lib/claims/](lib/claims/) — cross-deliberation claim identity, consensus.
- [lib/glossary/](lib/glossary/), [lib/facilitation/](lib/facilitation/), [lib/pathways/](lib/pathways/), [lib/typology/](lib/typology/) — institutional features.
- [lib/search/](lib/search/), [lib/pineconeClient.ts](lib/pineconeClient.ts) — search and dense retrieval.
- [lib/realtime/](lib/realtime/), [lib/socket.ts](lib/socket.ts) — real-time helpers.

### 4.3 API layer

Route handlers live under [app/api/](app/api/). Major groups:

| Group | Purpose |
|-------|---------|
| `/api/deliberations/...` | Deliberation CRUD, member management, move logs. |
| `/api/arguments/...` | Argument CRUD, defeats, standing. |
| `/api/v3/search/arguments` | Fitness-ranked argument search. |
| `/api/claims/...`, `/api/c/[id]/...` | Claim CRUD, evidence, AIF projection. |
| `/api/schemes/...` | Scheme registry, per-scheme CQs. |
| `/api/cq/...` | CQ status, responses. |
| `/api/dialogue-moves/...`, `/api/non-canonical/...` | Canonical and non-canonical moves. |
| `/api/sources/...`, `/api/citations/...` | Source registry, citations. |
| `/api/a/[identifier]/aif` | Content-negotiated AIF / JSON-LD / attestation envelope. |
| `/api/thesis/...`, `/api/briefs/[id]` | Thesis builder, brief versions. |
| `/api/embed/...`, `/api/oembed/...`, `/api/og/...` | Embed surfaces. |
| `/api/scheme-nets/...` | Argument net builder. |
| `/api/glossary/...`, `/api/facilitation/...`, `/api/pathways/...`, `/api/typology/...` | Institutional features. |
| `/api/_cron/...` | Scheduled cron entrypoints. |

### 4.4 Real-time layer

- **Presence and broadcast:** Supabase Postgres realtime channels.
- **Text CRDT:** Yjs documents transported over Supabase channels for collaborative text editing — see [docs/realtime-crdt.md](docs/realtime-crdt.md).
- **Sockets:** Socket.io for legacy event paths.
- **Video:** LiveKit for browser-based rooms.

### 4.5 Background workers

[workers/index.ts](workers/index.ts) starts a BullMQ worker pool against Upstash Redis. Notable jobs:

- `sourceVerification` — URL liveness, metadata, accessibility.
- `sourceArchiving` — Wayback / archive.org snapshots.
- `reembed` — recompute argument embeddings on edit.
- `decayConfidenceJob` — temporal decay of argument confidence.
- `tokenRefresh` — OAuth token rotation (Gmail, Sheets, etc.).
- `knowledgeGraphBuilder` — derive DebateNode graph from claims/arguments.
- Facilitation jobs — equity snapshots, session tasks.

### 4.6 Python services

Located under [services/](services/), deployed as Docker images to Kubernetes:

| Service | Role |
|---------|------|
| `embedding/` | Dense embedding generation (text-embedding-3-small). |
| `ranker/` | LightGBM ranking server (gRPC). See [docs/ranker.md](docs/ranker.md). |
| `explainer/` | SHAP-based explainability for ranker outputs. See [docs/explainability.md](docs/explainability.md). |
| `feature-store/` | MLflow-tracked feature engineering. |

### 4.7 Workspace packages

[packages/](packages/) hosts independently-built workspaces:

| Package | Purpose |
|---------|---------|
| `sheaf-acl` | Faceted, audience-scoped permissioning (built before app dev/build). |
| `isonomia-mcp` | MCP server exposing the argument graph as LLM tools. |
| `ludics-core`, `ludics-engine`, `ludics-react`, `ludics-rest` | Ludic dialogue runtime, UI, and HTTP wrapper. |
| `aif-core` | AIF type definitions and graph utilities. |
| `ui` | Shared component library. |
| `commonplace` | Memory / revision infrastructure (separate Prisma schema). |

### 4.8 Storage and infrastructure

- **PostgreSQL** (with pgvector) — primary store via Prisma.
- **Redis (Upstash)** — BullMQ queues, rate limiting, session/cache.
- **Pinecone** — semantic vector search namespace per deliberation.
- **Supabase** — realtime channels, storage, type generation.
- **AWS S3 + KMS** — file storage and envelope encryption for sensitive secrets.
- **Firebase** — authentication provider.

---

## 5. Major Subsystems and Feature Areas

### 5.1 Argument construction

A modular composer for authoring arguments with one or more schemes, premises, conclusion, evidence, and CQ responses. Tracks AI/human/hybrid authorship, computes standing, and updates embeddings asynchronously. See [docs/ARGUMENTCONSTRUCTOR_PHASE1_IMPLEMENTATION_COMPLETE.md](docs/ARGUMENTCONSTRUCTOR_PHASE1_IMPLEMENTATION_COMPLETE.md) and [docs/AIFArgumentWithSchemeComposer_ENHANCEMENT_ROADMAP.md](docs/AIFArgumentWithSchemeComposer_ENHANCEMENT_ROADMAP.md).

### 5.2 Deliberation rooms

Bounded reasoning spaces with configurable proof mode (symmetric vs. asymmetric burden), representation rule (utilitarian, harmonic, maxcov), viewpoint selection, and cluster-bridging. Backed by `Deliberation` and member/role models.

### 5.3 Dialogue moves and non-canonical moves

Canonical moves are the formal protocol (ASSERT, WHY, GROUNDS, CONCEDE, RETRACT, CLOSE), each producing AIF graph effects. Non-canonical moves are community-proposed extensions reviewed before execution. See [docs/NON_CANONICAL_MOVES_SUMMARY.md](docs/NON_CANONICAL_MOVES_SUMMARY.md).

### 5.4 Critical questions and dialogue–ludics flow

Each scheme carries critical questions; users answer them via dialogue moves; satisfaction state propagates into AIF nodes and into ASPIC defeat computation. Documented end-to-end in [docs/cq-dialogue-ludics-flow.md](docs/cq-dialogue-ludics-flow.md).

### 5.5 Claim synthesis and cross-deliberation identity

`Claim.canonicalClaimId` and `ClaimInstance` provide identity across deliberations. `ClaimContrary` records explicit contradictory or contrary pairs. The synthesis pipeline merges or links duplicates.

### 5.6 Citation, evidence, and attestation

Every Source is tracked with verification status, archival snapshot, content hash, and retraction state. `ClaimEvidence` ties evidence to claims with provenance. `EvidenceProvenanceEvent` provides an immutable audit chain. The AIF endpoint at [app/api/a/[identifier]/aif/route.ts](app/api/a/) returns content-negotiated representations (`?format=aif|jsonld|attestation`) with `ETag`, `X-Isonomia-Content-Hash`, and `Link` headers.

### 5.7 Standing and fitness

Each argument has a standing state in a five-step machine:

```
untested-default → untested-supported → tested-attacked → { tested-undermined | tested-survived }
```

Fitness is computed in [app/api/v3/search/arguments/route.ts](app/api/v3/search/arguments/) as:

```
fitness = 1.0·cqAnswered + 0.5·supportEdges − 0.7·attackEdges − 1.0·attackCAs + 0.25·evidenceWithProvenance
```

Sort order is fitness, then lexical coverage, then recency. Standing returns `null` when an argument has neither scheme CQs nor inbound traffic.

### 5.8 Argument net builder

Sequential scheme composition: a `SchemeNet` is a chain of `SchemeNetStep`s where the conclusion of one step feeds the premises of the next. See [docs/ARGUMENT_NET_BUILDER_IMPLEMENTATION_COMPLETE.md](docs/ARGUMENT_NET_BUILDER_IMPLEMENTATION_COMPLETE.md).

### 5.9 Living thesis and thesis builder

Compiles deliberation contents into navigable hypertextual theses. A `Thesis` has `ThesisProng` sections, each with supporting arguments. Versioned via `BriefVersion` and exportable to Markdown, JSON-LD, PDF, and BibTeX. See [docs/LIVING_THESIS_FEATURE_DESCRIPTION.md](docs/LIVING_THESIS_FEATURE_DESCRIPTION.md), [docs/THESIS_BUILDER_ARCHITECTURE.md](docs/THESIS_BUILDER_ARCHITECTURE.md).

### 5.10 Search

- **Lexical:** PostgreSQL GIN indexes.
- **Semantic:** Pinecone with text-embedding-3-small, namespaced per deliberation.
- **Fitness-ranked:** [app/api/v3/search/arguments](app/api/v3/search/arguments) pulls a candidate pool of `4×limit` (capped at 200), re-ranks by fitness, and returns top results.

### 5.11 MCP server (LLM tool surface)

[packages/isonomia-mcp/](packages/isonomia-mcp/) exposes six tools over the Model Context Protocol:

1. `search_arguments`
2. `get_argument` (with `format` selector)
3. `get_claim`
4. `find_counterarguments`
5. `cite_argument` (optionally attaches the strongest known objection)
6. `propose_argument` (authenticated)

### 5.12 Embeddable surfaces

- `<iframe>` embed pages at `/embed/arguments/[id]` and `/embed/claims/[id]`.
- oEmbed endpoint at `/api/oembed`.
- Open Graph / social cards under `/api/og/...`.
- See [Development and Ideation Documents/ARCHITECTURE/Embeddable Widget Feature Documents/EMBEDDABLE_ARGUMENT_WIDGET_DEVELOPMENT_ROADMAP.md](Development%20and%20Ideation%20Documents/ARCHITECTURE/Embeddable%20Widget%20Feature%20Documents/EMBEDDABLE_ARGUMENT_WIDGET_DEVELOPMENT_ROADMAP.md).

### 5.13 Browser extension

A Manifest V3 Chrome extension at [extensions/chrome/](extensions/chrome/) provides a context-menu "Create Isonomia Argument" action and inline rich previews for `isonomia.app/a/` and `/c/` links on supported sites.

### 5.14 Glossary

Per-deliberation collaborative term definitions with status states (PENDING / CONSENSUS / CONTESTED / ARCHIVED), endorsements, and usage tracking. See [docs/GLOSSARY_IMPLEMENTATION_COMPLETE.md](docs/GLOSSARY_IMPLEMENTATION_COMPLETE.md).

### 5.15 Deliberative-democracy scopes

Three institutional surfaces, designed to be composable:

- **Scope A — Pathways** ([docs/DelibDemocracyScopeA_Roadmap.md](docs/DelibDemocracyScopeA_Roadmap.md)): institutional workflows (packets, stages, responses, decisions).
- **Scope B — Typology / Meta-Consensus** ([docs/DelibDemocracyScopeB_Roadmap.md](docs/DelibDemocracyScopeB_Roadmap.md)): structured disagreement classification and meta-consensus summaries.
- **Scope C — Facilitation** ([docs/DelibDemocracyScopeC_Roadmap.md](docs/DelibDemocracyScopeC_Roadmap.md)): facilitator sessions, equity-metric snapshots, interventions.

### 5.16 Commitment and prediction

`LudicCommitmentElement` tracks formal commitments. `ClaimPrediction`, `PredictionMarket`, `Trade`, and `Wallet` provide a prediction-market layer over claim outcomes. See [COMMITMENT_AND_PREDICTION_IMPLEMENTATION.md](COMMITMENT_AND_PREDICTION_IMPLEMENTATION.md) and [PREDICTION_IMPLEMENTATION_ROADMAP.md](PREDICTION_IMPLEMENTATION_ROADMAP.md).

### 5.17 Discovery, ranking, and explainability

A LightGBM ranker ([services/ranker/](services/ranker/), [docs/ranker.md](docs/ranker.md)) personalizes the discovery feed. SHAP-based explanations are served by [services/explainer/](services/explainer/) and surfaced via `/api/v2/discovery/why/:targetId`. See [docs/explainability.md](docs/explainability.md), [docs/analytics.md](docs/analytics.md).

### 5.18 Real-time collaborative editing

Yjs-backed CRDT text editing transported over Supabase channels, with presence cursors and per-node persistence on submit. See [docs/realtime-crdt.md](docs/realtime-crdt.md).

### 5.19 Sheaf-ACL permissions

Faceted message visibility: a single message can carry multiple facets, each with its own audience (EVERYONE / ROLE / LIST / USERS) and share policy (ALLOW / REDACT / FORBID). Implemented in [packages/sheaf-acl/](packages/sheaf-acl/) and consumed by Mesh's messaging surfaces.

---

## 6. Public-Facing Surfaces

| Surface | Address pattern | Format |
|---------|-----------------|--------|
| Web app | `https://isonomia.app/...` | HTML / React |
| Argument permalink | `/a/[shortCode]` | HTML (SSR) |
| Claim permalink | `/c/[shortCode]` | HTML (SSR) |
| AIF / JSON-LD attestation | `GET /api/a/[id]/aif?format=aif|jsonld|attestation` | JSON-LD |
| Embed iframe | `/embed/arguments/[id]`, `/embed/claims/[id]` | HTML |
| oEmbed | `/api/oembed?url=...` | JSON |
| Open Graph card | `/api/og/...` | HTML meta + image |
| Chrome extension | [extensions/chrome/](extensions/chrome/) | Manifest V3 |
| MCP server | stdio / HTTP | JSON-RPC tools |

---

## 7. Cross-Cutting Concerns

### 7.1 Authentication and authorization

Firebase + `next-firebase-auth-edge` middleware ([middleware.ts](middleware.ts)) provides session JWTs in httpOnly cookies. User roles extend via a `UserRole` model. Fine-grained content visibility goes through Sheaf-ACL.

### 7.2 Encryption

TLS in transit. AWS KMS envelope encryption at rest for sensitive fields (e.g., OAuth `access_token_cipher` / `refresh_token_cipher` on `Integration`).

### 7.3 Background processing

BullMQ on Upstash Redis. Worker entrypoint at [workers/index.ts](workers/index.ts), launched via `npm run worker`. Cron-style routes live under `app/api/_cron/...`.

### 7.4 Search and embeddings

PostgreSQL full-text + Pinecone dense vectors. Embeddings produced by the Python embedding service; stored in `Argument.embedding` and Pinecone.

### 7.5 Rate limiting

Centralized limiter in [lib/limiter.ts](lib/limiter.ts) applied to write endpoints and high-volume telemetry paths.

### 7.6 Observability

Structured JSON logs to stdout; Prometheus metrics from Python services (`rank_requests_total`, `rank_latency_ms`, etc.); OpenTelemetry tracing planned.

### 7.7 Feature flags

Server-side toggles in [lib/feature-flags.ts](lib/feature-flags.ts) gate experimental subsystems and are surfaced to the client.

### 7.8 Versioning and audit trails

`BriefVersion`, `DebateRelease`, `ClaimVersion` track historical state. `EvidenceProvenanceEvent`, `DecisionReceipt`, and `RoomLogbook` provide immutable audit logs for governance-grade use.

### 7.9 Content hashing and identity

SHA-256 hashing is used for source fingerprinting (`Source.fingerprint`), evidence verification (`ClaimEvidence.contentSha256`), and AIF subgraph identity (`X-Isonomia-Content-Hash`). Permalinks are stable across content edits.

---

## 8. Repository Layout (selected)

```
app/                Next.js App Router pages and /api/* route handlers
components/         React UI organized by domain
lib/                Server-side domain logic (argument, aif, aspic, ludics, cqs, ...)
workers/            BullMQ background jobs
services/           Python microservices (embedding, ranker, explainer, feature-store)
packages/           Workspace packages (sheaf-acl, isonomia-mcp, ludics-*, aif-core, ui, commonplace)
prisma/             Prisma client config
lib/models/         schema.prisma (canonical data model)
extensions/chrome/  Manifest V3 browser extension
integrations/       Third-party integration adapters
infra/              Infrastructure-as-code (Terraform, k8s)
docs/               Engineering documentation (this document, design systems, roadmaps, SRSs)
```

Build, lint, test, worker, and DB scripts are listed in [package.json](package.json). Repository conventions and dev workflow are in [AGENTS.md](AGENTS.md) and [.github/copilot-instructions.md](.github/copilot-instructions.md).

---

## 9. Where to Read Next

- **Theory and integration flow:** [docs/cq-dialogue-ludics-flow.md](docs/cq-dialogue-ludics-flow.md), [docs/AIF_ASPIC_MESH_MAPPING.md](docs/AIF_ASPIC_MESH_MAPPING.md), [docs/AIF_ONTOLOGY_GUIDE.md](docs/AIF_ONTOLOGY_GUIDE.md).
- **Living thesis and citation philosophy:** [docs/LIVING_THESIS_FEATURE_DESCRIPTION.md](docs/LIVING_THESIS_FEATURE_DESCRIPTION.md).
- **Critical-question system:** [docs/CQ_COMPLETE_IMPLEMENTATION_GUIDE.md](docs/CQ_COMPLETE_IMPLEMENTATION_GUIDE.md), [docs/CQ_PHASE3_COMPLETE.md](docs/CQ_PHASE3_COMPLETE.md).
- **Non-canonical moves:** [docs/NON_CANONICAL_MOVES_SPEC.md](docs/NON_CANONICAL_MOVES_SPEC.md), [docs/NON_CANONICAL_MOVES_INTEGRATION_GUIDE.md](docs/NON_CANONICAL_MOVES_INTEGRATION_GUIDE.md).
- **Deliberative-democracy roadmaps:** [docs/DelibDemocracyImplementationRoadmapSkeleton.md](docs/DelibDemocracyImplementationRoadmapSkeleton.md) and Scope A/B/C roadmaps.
- **MCP surface:** [packages/isonomia-mcp/README.md](packages/isonomia-mcp/README.md).
- **Browser extension:** [extensions/chrome/README.md](extensions/chrome/README.md).
- **Realtime, ranker, explainability, analytics:** [docs/realtime-crdt.md](docs/realtime-crdt.md), [docs/ranker.md](docs/ranker.md), [docs/explainability.md](docs/explainability.md), [docs/analytics.md](docs/analytics.md).
- **Repository conventions:** [AGENTS.md](AGENTS.md), [README.md](README.md).
