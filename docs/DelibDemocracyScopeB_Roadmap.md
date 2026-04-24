# Scope B: Meta-Deliberation and Disagreement Intelligibility — Development Roadmap

Status: Draft v0.1
Parent docs:
- [docs/DelibDemocracyGapAnalysis.md](docs/DelibDemocracyGapAnalysis.md)
- [docs/DelibDemocracyImplementationRoadmapSkeleton.md](docs/DelibDemocracyImplementationRoadmapSkeleton.md)
- [docs/DelibDemocracyScopeA_Roadmap.md](docs/DelibDemocracyScopeA_Roadmap.md) (Scope A foundations: pathway primitives, hash chain)
- [docs/DelibDemocracyScopeC_Roadmap.md](docs/DelibDemocracyScopeC_Roadmap.md) (Scope C foundations: facilitation cockpit, equity telemetry)
- [docs/facilitation/scope-b-handoff.md](docs/facilitation/scope-b-handoff.md) (consumed contract: event bus, canonical export, analytics rollup)
Workstream: WS2 Meta-Consensus and Disagreement Typology
Sequence position: Third in active execution order (A → C → **B**)
Master timeline window: Weeks 19-28

## 1) Scope and outcome

### Problem statement
Mesh today renders disagreement structurally — claims attack other claims, arguments rebut other arguments, support and challenge edges accumulate — but it does not render disagreement *legibly*. A reviewer looking at an unresolved dispute cannot tell whether the parties disagree about facts, about values, about how the question is framed, or about whose interests the policy serves. Every unresolved attack looks the same. As Niemeyer and Dryzek observe, the most useful artifact a deliberation can hand to a decision-maker is often not a substantive consensus but a **meta-consensus** — a structured agreement on *what is being disagreed about and why*. Scope A made institutional accountability legible; Scope C made facilitation legible; Scope B must make **the shape of disagreement itself** legible, both to the participants who produced it and to the institutions that must act on it.

### Outcome (definition of done for Scope B)
A Mesh deliberation can:
1. **Tag any claim, argument, or attack edge** with one or more disagreement-axis labels (value, empirical, framing, interest) carrying a confidence score and a short evidence note.
2. **Aggregate node-level tags into session-level meta-consensus summaries** — human-editable, reviewable artifacts that explicitly state "the parties agree about X, disagree about Y on axis Z, and would need W to advance."
3. **Surface the typology layer in the facilitator cockpit** so facilitators can see in real time where their session's unresolved disagreements concentrate and choose interventions appropriate to the axis (more evidence vs reframing vs values dialogue vs interest disclosure).
4. **Embed the meta-consensus summary into the institutional pathway report** so Scope A recipients receive not just a packet of claims but a typed map of remaining disagreement.
5. **Subscribe to the Scope C event bus** to seed candidate tags from facilitator interventions and metric threshold crossings, without requiring Scope C to know anything about typology.
6. **Render typology-aware views in the public deliberation map** with axis-coded badges that respect the same redaction posture as Scope A and Scope C public reads.

### Non-goals (Scope B)
- No LLM-driven automatic typology assignment in v1; the platform proposes candidates from rules and event signals, but every persisted tag is human-confirmed.
- No new attack/support edge kinds in the argumentation engine — the typology layer is **perpendicular** to the ASPIC+ structure, not a replacement.
- No taxonomy revision tooling for end users; the axis registry is editable only by platform admins behind a migration in v1.
- No cross-deliberation typology reconciliation (e.g. "the same value disagreement appears in rooms X and Y") — deferred to a Scope B v1.1 or to a future cross-room workstream.
- No public scrutiny / external challenge workflow (deferred Scope F); typology tags are visible in public reads but cannot be authored by non-participants.
- No multi-modal contribution affordances (deferred Scope D).

## 2) Existing platform foundations to build on

Confirmed in the codebase, do not reinvent:

Argumentation core (target objects for tagging):
- [Claim](lib/models/schema.prisma), [Argument](lib/models/schema.prisma), [ArgumentPremise](lib/models/schema.prisma), [Citation](lib/models/schema.prisma) — primary tag targets.
- Existing attack/support/rebut edges in the deliberation engine — secondary tag targets (an *edge* can be tagged, not just a node).
- [Deliberation](lib/models/schema.prisma), [DeliberationRole](lib/models/schema.prisma) — scope and authorization context.

Audit and provenance primitives delivered by Scope A — **directly reused**:
- [lib/pathways/chain.ts](lib/pathways/chain.ts) — sha256 hash-chain helpers (`appendEvent`, `verifyChain`). Meta-consensus summaries that flow into institutional packets are hash-chained with the same machinery so the Scope A pathway report can attest the typology layer alongside the claims.
- [lib/pathways/auth.ts](lib/pathways/auth.ts) — `isFacilitator`, `isDeliberationHost`, public-read redaction patterns. Tagging is gated by these helpers verbatim.
- `RoomLogbook` `LogEntryType` enum — extended additively in this scope (`DISAGREEMENT_TAGGED`, `META_CONSENSUS_PUBLISHED`).

Facilitation primitives delivered by Scope C — **consumed via the documented hand-off contract** (`docs/facilitation/scope-b-handoff.md`):
- `lib/facilitation/eventBus.ts` (`subscribeFacilitationEvents`) — at-most-once in-process subscription. Scope B registers a single subscriber `scope-b/typology-seeder` filtering on `INTERVENTION_APPLIED` and `METRIC_THRESHOLD_CROSSED` to seed candidate tags.
- `GET /api/facilitation/sessions/:id/export` — canonical hash-attested envelope (`schemaVersion 1.0.0`). Scope B uses this for offline taxonomy-spike validation and for archival regeneration of meta-consensus summaries.
- `GET /api/deliberations/:id/facilitation/analytics` — advisory cross-session rollup. Scope B uses this only as context for the cockpit's typology view; never as a source of truth.

Reporting integration points already in place:
- [lib/facilitation/reportService.ts](lib/facilitation/reportService.ts) — per-session rollup with a documented extension slot for an optional `metaConsensus` block.
- [lib/pathways/reportService.ts](lib/pathways/reportService.ts) — pathway report with a documented extension slot for an optional `metaConsensus` block per packet.
- The bidirectional cross-link landed in Scope C C4.5 (`facilitationReportUrl` on pathway, `scopeAReportUrl` on facilitation report) means Scope B's summary becomes discoverable from both sides without new wiring.

Identified gaps that Scope B must close:
- No `DisagreementAxis` registry — the four axes (VALUE / EMPIRICAL / FRAMING / INTEREST) exist only in `DelibDemocracyGapAnalysis.md` prose.
- No `DisagreementTag` entity attaching axis + confidence + evidence to claims/arguments/edges.
- No `MetaConsensusSummary` entity capturing session- or deliberation-level synthesis with human edit history.
- No tagging UI in the deliberation map, the facilitation cockpit, or the institutional packet builder.
- No subscriber wiring from Scope C's event bus into a typology candidate queue.
- No typology-aware visualization in the Plexus / map / cockpit.
- No telemetry on tagging coverage, axis distribution, or summary publication latency.

## 3) Architecture overview

### 3.1 New domain entities

The following new Prisma models are proposed. Names are working titles; types follow Scope A/C conventions (cuid ids, `createdAt`/`updatedAt` standard, polymorphic targets via `(targetType, targetId)`).

- `DisagreementAxis` (registry; rarely changes; seeded via migration)
  - `id`, `key` (enum-like string: `VALUE`, `EMPIRICAL`, `FRAMING`, `INTEREST`), `displayName`, `description`, `colorToken`, `interventionHint` (short text shown to facilitators), `version` (integer; bumped when description/hint changes; tags pin the version they were authored under).
- `DisagreementTag`
  - `id`, `deliberationId`, `sessionId` (nullable; null means deliberation-scoped, not tied to a single facilitation session), `targetType` (CLAIM, ARGUMENT, EDGE), `targetId`, `axisId`, `axisVersion`, `confidence` (Decimal, 0.0-1.0), `evidenceText`, `evidenceJson` (optional structured evidence — e.g. linked claim ids, fragment of a citation), `authoredById`, `authoredRole` (PARTICIPANT, FACILITATOR, HOST), `seedSource` (enum: MANUAL, INTERVENTION_SEED, METRIC_SEED, IMPORTED), `seedReferenceJson` (e.g. originating `FacilitationEvent.id`), `confirmedAt` (nullable; null means CANDIDATE, set means CONFIRMED), `retractedAt` (nullable).
  - Indexes: `(deliberationId, targetType, targetId)`, `(sessionId, axisId)`.
  - A target can carry multiple tags across different axes; same author + same axis on same target is upserted (latest confidence/evidence wins, with audit retained via `MetaConsensusEvent`).
- `MetaConsensusSummary`
  - `id`, `deliberationId`, `sessionId` (nullable; null = deliberation-level), `version`, `status` (DRAFT, PUBLISHED, RETRACTED), `authoredById`, `publishedAt`, `retractedAt`, `bodyJson` (structured: `{ agreedOn: string[], disagreedOn: { axisKey, summary, supportingTagIds }[], blockers: string[], nextSteps: string[] }`), `narrativeText` (human prose render, optional), `parentSummaryId` (revisions), `snapshotJson` (frozen on publish: tag ids + axis versions + claim/argument snapshots referenced).
- `MetaConsensusEvent` (append-only, hash-chained per `(deliberationId, sessionId-or-null)` chain)
  - `id`, `deliberationId`, `sessionId` (nullable), `eventType` (TAG_PROPOSED, TAG_CONFIRMED, TAG_RETRACTED, SUMMARY_DRAFTED, SUMMARY_PUBLISHED, SUMMARY_RETRACTED, AXIS_VERSION_BUMPED), `actorId`, `actorRole`, `payloadJson`, `hashChainPrev`, `hashChainSelf`, `createdAt`.
  - Hash chain reuses `lib/pathways/chain.ts` verbatim.
- `TypologyCandidate` (transient queue row; pruned after confirm/dismiss or TTL)
  - `id`, `deliberationId`, `sessionId`, `targetType`, `targetId`, `suggestedAxisId`, `suggestedAxisVersion`, `seedSource`, `seedReferenceJson`, `rationaleText`, `priority` (1-5), `dismissedAt`, `dismissedReason`, `promotedToTagId` (nullable foreign key once accepted).
  - Populated by the Scope C event-bus subscriber and by per-session rules (see §3.4).

### 3.2 Service layout

All service modules under `lib/typology/`:

- `axisRegistry.ts` — read-only registry access, version pin lookup, color/hint accessors. Pure module; values come from the seeded `DisagreementAxis` rows.
- `tagService.ts` — propose, confirm, retract, list-by-target, list-by-session. Writes `DisagreementTag` and emits `MetaConsensusEvent`. Enforces author/role authorization via `lib/pathways/auth.ts`.
- `summaryService.ts` — draft, edit, publish, retract, render. Publishing snapshots referenced tag ids + axis versions + claim/argument text into `snapshotJson` so retroactive edits to underlying claims do not silently mutate the published summary.
- `candidateService.ts` — enqueue, dismiss, promote-to-tag, list. Backing store is `TypologyCandidate`.
- `typologyEventService.ts` — thin wrapper over `lib/pathways/chain.ts` for the meta-consensus chain. Mirrors `lib/facilitation/facilitationEventService.ts` shape so reviewers verifying the chain use one tool, not three.
- `subscribers/facilitationSeeder.ts` — registers a single named subscriber against `subscribeFacilitationEvents` (`name = "scope-b/typology-seeder"`), translating eligible Scope C events into `TypologyCandidate` rows. Defensive per §2.2 of the hand-off contract: idempotent on `event.id`, re-reads authoritative state by id, never throws into the publish path.

### 3.3 Provenance and audit

Every Scope B state change writes to **two** places (parity with Scope C's dual-write rule):

1. `MetaConsensusEvent` — primary, hash-chained per `(deliberationId, sessionId)` (or `(deliberationId, NULL)` for deliberation-level chains). Genesis event is the first `TAG_PROPOSED` in scope.
2. `RoomLogbook` — mirrored summary entries with new additive `LogEntryType` values: `DISAGREEMENT_TAGGED`, `META_CONSENSUS_PUBLISHED`, `META_CONSENSUS_RETRACTED`. The room's existing logbook view stays a single coherent timeline.

Snapshot policy on publish:
- `MetaConsensusSummary.snapshotJson` freezes (a) the set of `DisagreementTag.id` referenced, (b) each tag's `axisVersion`, (c) the canonical text + version of every claim/argument referenced. A subsequent retroactive edit to a source claim does not silently mutate the published summary; an updated summary requires a new `version` row pointing to its `parentSummaryId`.
- Published summaries that flow into a Scope A `RecommendationPacketItem` are referenced by id and hash-anchored: the packet snapshot embeds the `MetaConsensusEvent` chain head at publish time so the institutional recipient can independently verify the typology layer.

### 3.4 Candidate-seeding rules (v1 catalogue)

Each seeder is a small, individually-testable module under `lib/typology/seeders/`. Catalogue:

- `interventionSeeder` — on `INTERVENTION_APPLIED` events of kind `PROMPT_EVIDENCE`, propose an `EMPIRICAL` candidate against the intervention's `targetType`/`targetId`. On `REFRAME_QUESTION`, propose `FRAMING`. On `ELICIT_UNHEARD` against a high-Gini session, propose `INTEREST`.
- `metricSeeder` — on `METRIC_THRESHOLD_CROSSED` for `CHALLENGE_CONCENTRATION`, propose a session-scoped candidate with no specific target but a rationale flagging the imbalance pattern. Surface in cockpit, not on the map.
- `repeatedAttackSeeder` — when an attack edge has been re-asserted by ≥ N distinct authors against the same target, propose an `EMPIRICAL` candidate (the disagreement pattern suggests evidential dispute worth typing).
- `valueLexiconSeeder` — when a claim or argument body matches a configured lexicon of value-laden terms (configurable per deliberation; ships with a small English seed list), propose a `VALUE` candidate with low priority.

All seeders carry priority and are individually feature-flaggable. None of them write `DisagreementTag` directly; they write `TypologyCandidate` rows that a human (participant or facilitator) must promote.

### 3.5 Cockpit and report integration

Cockpit (Scope C `FacilitationCockpit`):
- New tile added to the cockpit grid (or a new tab under the existing layout) titled "Typology". Shows axis distribution across confirmed tags in the current session, the candidate queue with promote/dismiss controls, and a one-click "draft summary" affordance.
- The intervention card in Scope C gains an optional "axis hint" badge when the recommending rule is one of the seeder rules above. Purely informational; does not change Scope C semantics.

Map / deliberation room:
- Claim and argument cards render up to N (default 3) confirmed axis badges with hover tooltips showing evidence text and confidence.
- A new map filter "Show only typed disagreements" filters the graph to nodes carrying ≥ 1 confirmed tag.

Institutional pathway report (Scope A `pathway/report`):
- An optional `metaConsensus` block appears beneath each `RecommendationPacketItem` it applies to, plus a deliberation-level "Remaining disagreements" section sourced from the latest published `MetaConsensusSummary`.
- Hash-chain attestation block extends to include the `MetaConsensusEvent` chain head referenced by the packet snapshot.

### 3.6 Plexus / cross-room exposure

No new edge kinds in v1. Per the gap analysis, cross-deliberation typology reconciliation is interesting but premature; it would require a stable axis vocabulary across rooms, which v1 does not attempt. The deliberation node's existing Plexus tooltip gains an axis-distribution mini-chart so the systemic-turn view shows *that* a deliberation has typed disagreement, even if it does not yet show *which* axes connect across rooms.

## 4) API surface (proposed)

REST routes (Next.js app/api):

Axis registry:
- `GET /api/typology/axes` — list registered axes with `colorToken`, `interventionHint`, `version`. Public read.

Tagging:
- `POST /api/deliberations/[id]/typology/tags` — propose a tag (sets `confirmedAt = null`).
- `POST /api/typology/tags/[id]/confirm` — confirm a candidate tag (facilitator or original author).
- `POST /api/typology/tags/[id]/retract` — retract with required `reason`.
- `GET /api/deliberations/[id]/typology/tags` — list tags, filterable by `targetType`, `targetId`, `axisKey`, `sessionId`, `confirmedOnly`.
- `GET /api/typology/tags/[id]` — tag detail.

Candidates:
- `GET /api/facilitation/sessions/[id]/typology/candidates` — pending candidate queue for a session.
- `POST /api/typology/candidates/[id]/promote` — promote candidate to a `DisagreementTag` (atomic: writes tag, updates `promotedToTagId`).
- `POST /api/typology/candidates/[id]/dismiss` — dismiss with required `reason`.

Meta-consensus summaries:
- `POST /api/deliberations/[id]/typology/summaries` — draft a summary (session-scoped if `sessionId` provided).
- `PATCH /api/typology/summaries/[id]` — edit draft (status DRAFT only).
- `POST /api/typology/summaries/[id]/publish` — publish; freezes `snapshotJson`, emits `SUMMARY_PUBLISHED` event.
- `POST /api/typology/summaries/[id]/retract` — retract with required `reason`.
- `GET /api/deliberations/[id]/typology/summaries` — list summaries (latest published per `(sessionId, parentChain)` by default; `?all=true` returns history).
- `GET /api/typology/summaries/[id]` — summary detail with rendered narrative and references.

Events:
- `GET /api/deliberations/[id]/typology/events` — append-only event feed with `hashChainValid` field. Mirrors Scope C's `events` route shape.

Reporting integration:
- The Scope A `GET /api/pathways/[id]` response gains an optional `metaConsensusSummaryId` per packet item and a deliberation-level `currentMetaConsensusSummaryId`. Additive — no breaking change to existing consumers.
- The Scope C `GET /api/facilitation/sessions/[id]/export` response is **not** modified; Scope B exposes its own `GET /api/deliberations/[id]/typology/export` returning a parallel canonical envelope (`schemaVersion 1.0.0`, `X-Typology-Export-Schema` header) covering tags, summaries, and the meta-consensus chain.

Authorization (reuses `lib/pathways/auth.ts` patterns):
- Propose tag: deliberation participants.
- Confirm tag: facilitator, host, or the original author of the candidate's seed event.
- Retract tag: original author or facilitator/host.
- Draft / publish summary: facilitator or host. Edit draft: original drafter only.
- Public reads: gated by deliberation visibility; actor ids hashed and rationales summarized (same redactor as Scope A and Scope C).

## 5) Phase plan (Weeks 19-28 within active timeline)

This expands master Phase 3 for the WS2 workstream. Numbered like Scope A and Scope C for parity (`Phase B0` … `Phase B5`).

### Phase B0: Specification and design (Weeks 19-20)

Objective:
- Lock the axis vocabulary, data model, API, seeder catalogue, and cockpit / map integration before implementation. The lightweight taxonomy spike previewed during late Scope A / early Scope C feeds directly into B0; B0 turns the spike into an approved registry.

Deliverables:
- B0.1 Final Prisma model proposal (this doc + reviewed deltas).
- B0.2 Axis registry seed file (`prisma/seed/typologyAxes.ts`) with locked descriptions and intervention hints for VALUE / EMPIRICAL / FRAMING / INTEREST.
- B0.3 API contract document with request/response examples (`docs/typology/API.md`).
- B0.4 UX wireframes (in-repo markdown is sufficient): tagging affordance on claim/argument cards, candidate queue in cockpit, summary editor, summary view in pathway report.
- B0.5 Authorization matrix (mirrors Scope A and Scope C tables).
- B0.6 Seeder catalogue specification: trigger, axis hint, priority, edge cases.
- B0.7 Snapshot and hash-chain specification for `MetaConsensusSummary` and `MetaConsensusEvent`.

Exit criteria:
- Architecture review sign-off.
- Axis registry approved by research partners (or clearly marked v1-stub if partner review is delayed; per skeleton risk: "Scope sequencing drift causes taxonomy churn").
- Decisions in §9 below confirmed.

### Phase B1: Schema, services, and seeder (Weeks 20-22)

Objective:
- Land the data model and headless services without UI. Reuse Scope A and Scope C primitives wherever possible.

Deliverables:
- B1.1 Prisma migrations for: `DisagreementAxis`, `DisagreementTag`, `MetaConsensusSummary`, `MetaConsensusEvent`, `TypologyCandidate`. Seed `DisagreementAxis` rows in the same migration.
- B1.2 New `LogEntryType` enum values added to `RoomLogbook`: `DISAGREEMENT_TAGGED`, `META_CONSENSUS_PUBLISHED`, `META_CONSENSUS_RETRACTED`.
- B1.3 Service modules under `lib/typology/`:
  - `axisRegistry.ts`
  - `tagService.ts`
  - `candidateService.ts`
  - `summaryService.ts`
  - `typologyEventService.ts`
  - `subscribers/facilitationSeeder.ts`
- B1.4 `lib/typology/seeders/` directory — one file per seeder rule from §3.4 catalogue.
- B1.5 Subscriber registration wiring: a single bootstrapping import (per Scope C hand-off contract §2.1) that registers `scope-b/typology-seeder` exactly once at process start. Defensive: re-registration replaces; HMR-friendly.
- B1.6 Unit tests:
  - Each seeder fires / does not fire under intended conditions over fixture `FacilitationEvent` rows.
  - Tag confirm/retract enforces the authorization matrix.
  - Summary publish freezes `snapshotJson` deterministically; subsequent edits to source claims do not mutate published summary.
  - Hash-chain integrity (reuses `lib/pathways/chain.ts` verifier; adds a `verifyMetaConsensusChain(deliberationId, sessionId?)` helper).
  - Idempotency of the facilitation seeder against a replayed event id.

Exit criteria:
- All services unit-testable in isolation; target coverage on `lib/typology/` ≥ 85% (parity with Scope C).
- `npx prisma db push` succeeds; client regenerates cleanly.
- Hash chain verifies on a synthetic 100-event meta-consensus session.
- Seeder produces stable candidates against a recorded fixture export from a Scope C session.

### Phase B2: API surface (Weeks 22-24)

Objective:
- Expose services through versioned API routes with full authorization and Zod validation.

Deliverables:
- B2.1 Routes listed in section 4.
- B2.2 Zod schemas for all request/response payloads (validation errors → 422 via `zodError()`, matching Scope A / Scope C convention).
- B2.3 Authorization checks reusing `lib/pathways/auth.ts` helpers verbatim.
- B2.4 Integration tests (jest) for happy-path and key failure modes:
  - Propose tag against a target outside the deliberation → 404.
  - Confirm a tag the requester is not authorized to confirm → 403.
  - Retract without reason → 422.
  - Publish a summary referencing a retracted tag → 409 (force the drafter to refresh).
  - Edit a published (non-DRAFT) summary → 409.
  - Public-read redaction returns hashed actor ids and summarized rationales.
  - Hash-chain validity surfaced in `events` and `export` responses.
- B2.5 Additive contract test against Scope A `GET /api/pathways/[id]` confirming the new optional fields do not break existing consumers.

Exit criteria:
- All routes covered by integration tests.
- Test target: ≥ 18 integration tests (parity with Scope C's coverage profile).

### Phase B3: UI surfaces (Weeks 24-26; overlaps with B2)

Objective:
- Ship participant-, facilitator-, and observer-facing experiences.

Deliverables:
- B3.1 `DisagreementTagger` component:
  - Inline on claim/argument cards under a "Tag disagreement" affordance.
  - Axis picker with description tooltip and color token from registry.
  - Confidence slider, evidence text field, optional structured evidence picker (link existing claim ids).
  - Renders existing tags grouped by axis with confirm/retract controls per the authorization matrix.
- B3.2 `TypologyCandidateQueue` component (lives in the facilitation cockpit):
  - Ranked list of pending candidates with rationale and seed source badge.
  - Promote (opens the tagger pre-filled) and dismiss (requires reason) controls.
  - Empty state copy explicitly distinguishes "no candidates yet" from "API error" (lesson from Scope C `InterventionQueue`).
- B3.3 `MetaConsensusEditor` component:
  - Structured editor matching `bodyJson` shape (`agreedOn`, `disagreedOn`, `blockers`, `nextSteps`).
  - Tag picker per `disagreedOn` row with axis filter.
  - Live preview of published render.
  - Publish modal showing the snapshot diff (which tags + claims will be frozen).
- B3.4 `MetaConsensusSummaryCard` component:
  - Read-only render used in the cockpit, the pathway report, and the public deliberation view.
  - Axis-coded sections; per-disagreement supporting-tag drill-down.
  - Hash-chain validity badge (reuses Scope A / Scope C `ChainValidityBadge`).
- B3.5 Cockpit integration:
  - New "Typology" tile / tab inside `FacilitationCockpit` showing axis distribution sparkbars over the session window, the candidate queue, and a "draft summary" button.
  - Optional "axis hint" badge on `InterventionCard` when the recommending rule is also a seeder.
- B3.6 Map integration:
  - Up to N axis badges per claim/argument card.
  - Map filter "Show only typed disagreements".
- B3.7 Pathway report integration:
  - `metaConsensus` block under each `RecommendationPacketItem` it applies to.
  - Deliberation-level "Remaining disagreements" section sourced from the latest published `MetaConsensusSummary`.
- B3.8 Demo page at `app/test/typology-features/page.tsx`:
  - Mirrors `app/test/facilitation-features/page.tsx` polish (gradient bg, sticky header, ContextBanner, tile strip, white-pill Tabs, FullHeightCard).
  - Surfaces tagging, candidate queue, summary editor, summary card, and report integration on a seeded fixture deliberation.

Exit criteria:
- Full flow demoable end-to-end on a staging deliberation seeded by `scripts/seed-typology-demo.ts` (mirrors `scripts/seed-facilitation-demo.ts`).
- Accessibility review passed (keyboard nav for all tagger and editor actions, ARIA `role=feed` on candidate queue, contrast pass on axis color tokens).
- Demo page passes a smoke test mirroring `__tests__/app/facilitation-features.demo.test.ts`.

### Phase B4: Reporting, telemetry, and downstream hand-off (Weeks 26-27)

Objective:
- Make the typology layer measurable, exportable, and consumable by downstream readers (institutional partners, researchers, and any future Scope D/E/F).

Deliverables:
- B4.1 `lib/typology/analyticsService.ts` + `GET /api/deliberations/[id]/typology/analytics` (facilitator-gated). Per-deliberation rollup of:
  - Tagging coverage (% of unresolved disagreements carrying ≥ 1 confirmed tag).
  - Axis distribution across sessions.
  - Candidate promote-rate (overall, by seed source).
  - Summary publication count, latency from `SESSION_CLOSED` to first published summary.
  - Retraction rate and reasons.
- B4.2 `lib/typology/exportService.ts` + `GET /api/deliberations/[id]/typology/export`. Canonical JSON envelope (`schemaVersion 1.0.0`, `X-Typology-Export-Schema` header) covering axes pinned by version, all tags with confirm/retract history, all summaries with snapshots, full event chain, and hash-chain summary (`failedIndex` when broken). Public reads anonymized per the same redactor.
- B4.3 Hand-off contract document `docs/typology/scope-downstream-handoff.md` mirroring `docs/facilitation/scope-b-handoff.md`. Documents:
  - The typology event stream (no in-process bus in v1; pull from `events` endpoint).
  - The canonical export envelope.
  - The analytics rollup as advisory context.
  - Versioning policy (semver, additive-only minor bumps).
- B4.4 Cross-link wiring: pathway report renders `metaConsensusSummaryId` references; facilitation report's optional `metaConsensus` extension slot is filled when a session has a published summary.
  (B4.5 is deferred for now)
- B4.5 Telemetry events for:
  - Tagger open / submit / cancel.
  - Candidate promote / dismiss.
  - Summary draft / publish / retract.
  - Map filter "Show only typed disagreements" toggled.

Exit criteria:
- Metrics reproducible from `MetaConsensusEvent` + `DisagreementTag` log alone (no derived state required).
- Export validated against three test deliberations of varying size.
- Downstream hand-off contract reviewed against the Scope C contract for symmetry.

### Phase B5: Hardening, integration, and pilot prep (Weeks 27-28)

Objective:
- Stabilize the A/C/B integration before master Phase 4. This phase is intentionally short and quality-focused; new feature work is out of scope.

Deliverables:
- B5.1 End-to-end integration test that runs a synthetic 90-minute deliberation with a Scope C session, exercises the seeder, promotes candidates, publishes a summary, packages it into a Scope A institutional packet, and verifies all three hash chains (pathway, facilitation, meta-consensus) cross-attest.
- B5.2 Performance pass: `EquityMetricSnapshot` → seeder pipeline p95 < 1s on a 200-event session; tag list query p95 < 200ms on a deliberation with 1000 tags.
- B5.3 Accessibility re-audit on cockpit, map, and report integrations.
- B5.4 Documentation: `docs/typology/` subdirectory with data model reference, API reference, axis catalogue, facilitator handbook addendum, and the downstream hand-off contract from B4.3.
- B5.5 Pilot runbook addendum: how to seed a deliberation with the typology layer enabled, how to interpret summaries in an institutional report, and how to disable the layer per-room via the feature flag.

Exit criteria:
- All tests green across Scope A, Scope C, and Scope B suites.
- Integration test from B5.1 stable across 10 consecutive runs.
- Pilot runbook reviewed by the facilitation team.

### Stage gate to master Phase 4 (A/C/B integration hardening)
- All Phase B0-B5 deliverables shipped to staging.
- Hash-chain verification passes on a representative sample of meta-consensus sessions.
- At least one internal end-to-end dry run with Scope A pathway + Scope C facilitation + Scope B typology, end-to-end on a synthetic deliberation.
- Exit review: confirm the axis registry and seeder catalogue are stable enough that the master Phase 4 reporting bundle can rely on them without forcing churn.

## 6) Migration and rollout plan

Database migrations:
- Single grouped migration for all new models in Phase B1 to avoid partial states. Axis seed rows land in the same migration so the registry is non-empty on first boot.
- No destructive changes to existing models. New `LogEntryType` enum values are additive.
- Backfill: none required; tags, summaries, and candidates begin empty.

Feature flag strategy:
- Flag `ff_typology_layer` gates all UI surfaces (tagger, candidate queue, summary editor, map badges, report integration).
- Flag `ff_typology_seeder` gates the Scope C event bus subscriber so the seeder can be disabled per-deployment without disabling the manual tagging UI.
- Per-seeder flags `ff_typology_seeder_<name>` gate individual seeder rules so we can roll them out incrementally.
- Per-axis flag `ff_typology_axis_<key>` allows partner deployments to disable axes whose framing they reject (parity with Scope C's per-rule flag posture).
- API routes available behind admin override during Phase B2.

Rollout sequence:
1. Internal facilitator + researcher walkthrough on a synthetic deliberation (week 27).
2. 1-2 friendly facilitators on a real Scope C session that has already closed (retroactive tagging) before going live on an open session (week 28).
3. Pilot integration with Scope A pathway-bearing deliberations (master timeline Phase 5).
4. General availability after master Phase 4 hardening.

Documentation:
- Add `docs/typology/` subdirectory: data model reference, API reference, axis catalogue, facilitator handbook addendum, downstream hand-off contract.

## 7) Risks and mitigations

Risk: **Axis vocabulary becomes contested** between research partners. Some partners object to "INTEREST" as reductive; others want a fifth axis (e.g. PROCEDURAL, EPISTEMIC).
Mitigation: Ship the four-axis registry as v1 with explicit version pinning on every tag. Per-axis feature flags allow partner deployments to disable axes they reject. The registry is migration-only in v1; a v1.1 backlog item (`docs/typology/v1.1-backlog.md`) reserves space for a partner-driven axis-extension proposal but does not commit to it.

Risk: **Tagging is perceived as algorithmic interpretation of participant disagreement** and erodes trust.
Mitigation: All seeder candidates are labeled as platform suggestions and require explicit human promotion to become persisted tags. Tag authorship and role (`PARTICIPANT` / `FACILITATOR` / `HOST`) are first-class and surfaced in every UI render. The cockpit copy explicitly frames tags as "suggested labels to consider", not classifications.

Risk: **Taxonomy churn** from Scope C drift — if Scope C's intervention catalogue changes mid-roll-out, the seeder rules in §3.4 break.
Mitigation: The seeder reads only the documented `INTERVENTION_APPLIED.kind` and `METRIC_THRESHOLD_CROSSED.metricKind` enums per the hand-off contract. Both enums are version-pinned in the canonical export envelope; a Scope C breaking change requires a `scope-handoff-break` issue per `docs/facilitation/scope-b-handoff.md` §5, which fires before any silent breakage.

Risk: **LLM-vs-rules trade-off** — partners may push for LLM-assisted typology classification.
Mitigation: v1 is rules-only and deterministic (parity with Scope C's same decision). LLM advisory mode is captured as a v1.1 backlog item; not in scope. The candidate queue infrastructure means an LLM proposer could be added in v1.1 as just another `seedSource` without schema change.

Risk: **Snapshot bloat** — every published summary freezes the underlying claims/arguments.
Mitigation: `snapshotJson` stores canonical text + version + id, not full HTML or attachments. Citations are referenced by id, not embedded. Compression at rest via existing Postgres TOAST; cap any single snapshot at 256 KiB and reject publish over the cap with a 422 explaining which references to slim down.

Risk: **Public read posture is contentious** when typology tags reveal participant identity by axis pattern.
Mitigation: Public reads use the same redactor as Scope A and Scope C (hashed actor ids, summarized rationales). Per-deliberation opt-out for the public typology view. Per-room `ff_typology_layer` flag.

Risk: **Summary edit history confuses reviewers** — a published summary that is later retracted and re-published may be cited by stale links.
Mitigation: Summaries version monotonically with `parentSummaryId`; the pathway and facilitation reports always render the latest published summary by default and link the version history. Retractions emit a `MetaConsensusEvent` so the chain shows the retraction rather than silently dropping the row.

Risk: **Cockpit cognitive overload** — adding the Typology tile to a cockpit already showing equity metrics, timeline, and intervention queue.
Mitigation: The Typology tile is opt-in (default-collapsed) per Scope C's "minimal cockpit" precedent. Power-user mode opens it expanded. Usability test in B0 / B3.

## 8) Metrics and success criteria

Engineering health:
- Test coverage on `lib/typology/` ≥ 85%.
- Hash-chain verification pass rate 100% on staging.
- Seeder pipeline p95 < 1s per event on a session with ≤ 200 events.
- Migration applied cleanly in dev, staging, prod.

Product adoption (post-pilot):
- ≥ 50% of unresolved disagreements in pilot deliberations carry at least one confirmed tag at session close.
- ≥ 40% of seeder candidates are explicitly promoted or dismissed (i.e. actively triaged, not ignored).
- ≥ 1 published `MetaConsensusSummary` per pilot session.
- Facilitator-reported usefulness ≥ 4 / 5 on the post-pilot survey.
- ≥ 1 institutional pathway report in pilot embeds a meta-consensus summary referenced by the recipient's response.

Research validation:
- Pilot retrospective explicitly references the typology layer as evidence of disagreement intelligibility (parallel to Scope A's accountability-evidence claim and Scope C's facilitation-quality claim).
- At least one documented case where the axis classification of a disagreement changed how a decision-maker responded to the recommendation.

## 9) Design decisions (locked at B0)

All recommended answers approved on April 23, 2026. See [docs/typology/REVIEW_DECISIONS.md](typology/REVIEW_DECISIONS.md) for the locked record.

1. **Axis count and identity.** Recommended: ship the four axes (VALUE / EMPIRICAL / FRAMING / INTEREST) as v1 with version pinning. Do not attempt to relitigate the taxonomy in v1.
   - yes lets go ahead with the recommended
2. **Tag confirmation model.** Recommended: every persisted `DisagreementTag` requires explicit human confirmation; seeders only enqueue `TypologyCandidate` rows. No auto-confirmed tags in v1.
   - yes lets go ahead with the recommended
3. **Summary scope.** Recommended: summaries are session-scoped by default, with an explicit deliberation-scoped variant when multiple sessions converge. No cross-deliberation summaries in v1.
   - yes lets go ahead with the recommended
4. **Snapshot policy.** Recommended: `snapshotJson` freezes referenced tags + axis versions + claim/argument text on publish. Editing a published summary requires a new version row (`parentSummaryId`).
   - yes lets go ahead with the recommended
5. **Public read posture.** Recommended: opt-in per deliberation, gated by deliberation visibility, with the same redactor used by Scope A and Scope C.
   - yes lets go ahead with the recommended
6. **Seeder participation.** Recommended: seeders ship behind individual flags and default-on for `interventionSeeder` and `repeatedAttackSeeder`; default-off for `valueLexiconSeeder` until partner-reviewed.
   - yes lets go ahead with the recommended
7. **Cross-deliberation reconciliation.** Recommended: not in v1; defer until at least one pilot deliberation is complete and a real reconciliation use case exists.
   - yes lets go ahead with the recommended
8. **LLM in summary drafter.** Recommended: not in v1. Re-evaluate after pilot data.
- yes, no LLMs for now
## 10) Immediate next actions

B0 design-week deliverables (status as of April 23, 2026):

1. ✅ Prisma migration draft — [docs/typology/MIGRATION_DRAFT.md](typology/MIGRATION_DRAFT.md). Reference-only; not applied.
2. ✅ API contract document — [docs/typology/API.md](typology/API.md).
3. ✅ Authorization matrix — [docs/typology/AUTH_MATRIX.md](typology/AUTH_MATRIX.md).
4. ✅ Wireframes — [docs/typology/WIREFRAMES.md](typology/WIREFRAMES.md).
5. ✅ Axis registry seed file — [prisma/seed/typologyAxes.ts](../prisma/seed/typologyAxes.ts).
6. ✅ Section 9 design decisions locked — [docs/typology/REVIEW_DECISIONS.md](typology/REVIEW_DECISIONS.md).

Outstanding before B1 starts:

- ⏳ Review the §3.4 seeder catalogue with the Scope C facilitation team to confirm no Scope C catalogue churn is in flight.
- ⏳ Schedule architecture review at end of week 20.
- ✅ Scope C stage-gate exit criteria satisfied (event bus stable, canonical export at `schemaVersion 1.0.0`, analytics rollup live) per [docs/facilitation/scope-b-handoff.md](facilitation/scope-b-handoff.md).
