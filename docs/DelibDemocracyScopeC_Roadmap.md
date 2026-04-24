# Scope C: Facilitation Architecture — Development Roadmap

Status: Draft v0.1
Parent docs:
- [docs/DelibDemocracyGapAnalysis.md](docs/DelibDemocracyGapAnalysis.md)
- [docs/DelibDemocracyImplementationRoadmapSkeleton.md](docs/DelibDemocracyImplementationRoadmapSkeleton.md)
- [docs/DelibDemocracyScopeA_Roadmap.md](docs/DelibDemocracyScopeA_Roadmap.md) (predecessor — Scope A foundations consumed by this scope)
Workstream: WS3 Facilitation Architecture
Sequence position: Second in active execution order (A → **C** → B)
Master timeline window: Weeks 11-18

## 1) Scope and outcome

### Problem statement
In Mesh today, facilitation is a *role* (`DeliberationRole`) and a set of social conventions, not a platform subsystem. A facilitator opening a deliberation has no purpose-built workspace: they switch between the room view, ad-hoc dashboards, manual notes, and out-of-band tools to track who has spoken, whether the question is well-formed, where disagreement is concentrating, and when to intervene. As a result, facilitation quality is invisible to the platform, uneven across deliberations, and unfalsifiable to outside observers and decision-makers. Scope A made institutional accountability legible. Scope C must make **facilitation itself** legible — both as a live operational capability and as a post-hoc evidentiary record.

### Outcome (definition of done for Scope C)
A Mesh facilitator can:
1. **Author and stress-test deliberation questions** with platform-side checks for clarity, balance, leading framing, and scope creep — before opening the room to participants.
2. **Monitor equity in real time** through a cockpit that surfaces participation distribution, challenge concentration, response latency, and attention gaps across speakers, roles, and identity facets.
3. **Receive ranked, advisory intervention prompts** (e.g. "elicit the unheard view on Claim X", "the last 3 challenges came from a single account") with one-click actions that log the intervention.
4. **Log structured facilitation actions** (intervention applied, intervention dismissed, manual nudge, question re-opened, time-box adjusted) into a tamper-evident chain that mirrors Scope A's hash-chain pattern.
5. **Hand off** between facilitators with a snapshot of cockpit state and outstanding interventions.
6. **Generate a facilitation report** for the deliberation that any reviewer (institutional partner, auditor, researcher) can read alongside the Scope A pathway report.

### Non-goals (Scope C)
- No automated *content* moderation decisions; the cockpit recommends, never enforces. Moderation enforcement remains in the existing safety subsystem.
- No disagreement *typology* (deferred to Scope B); equity telemetry is descriptive, not interpretive of disagreement nature.
- No multi-modal contribution affordances (deferred Scope D).
- No sortition, demographic stratification, or external recruitment (deferred Scope E).
- No public scrutiny / external challenge workflows (deferred Scope F).
- No A/B experimentation framework on participants — the cockpit is observational and advisory only.

## 2) Existing platform foundations to build on

Confirmed in the codebase, do not reinvent:

Roles, rooms, and the deliberation core:
- [Deliberation](lib/models/schema.prisma) and [DeliberationRole](lib/models/schema.prisma) (host, facilitator, observer assignments).
- [AgoraRoom](lib/models/schema.prisma) — room-scoped state and presence.
- [RoomLogbook](lib/models/schema.prisma) with `LogEntryType` (STATUS_CHANGE, PANEL_OPEN, PANEL_DECISION, POLICY_CHANGE, NOTE) — extend with new facilitation entries.

Telemetry, presence, and existing logs the cockpit consumes:
- [CQActivityLog](lib/models/schema.prisma) — critical-question lifecycle events.
- [DecisionReceipt](lib/models/schema.prisma) — governance actions, useful for "facilitator nudge → vote opened" causal trails.
- Existing presence / typing / message-arrival signals already used by the room view.
- Argument and challenge events from the deliberation engine (claim author, argument author, attack/support edges) — primary input for participation distribution and challenge concentration metrics.

Pathway and audit primitives delivered by Scope A — **directly reused** rather than re-implemented:
- [lib/pathways/chain.ts](lib/pathways/chain.ts) — sha256 hash-chain helpers (`appendEvent`, `verifyChain`). The same chain machinery is used for `FacilitationEvent` so any reviewer can verify the cockpit's audit trail with the same tooling.
- [lib/pathways/auth.ts](lib/pathways/auth.ts) — `isFacilitator`, `isDeliberationHost`, public-read redaction patterns. The cockpit reuses these guards verbatim.
- [PathwayEvent](lib/models/schema.prisma) — pattern (per-room hash-chained, append-only, redacted on public read) is mirrored, not extended.

Identified gaps that Scope C must close:
- No `FacilitationSession` entity binding a facilitator+deliberation+time-window into an addressable unit.
- No structured facilitation action log distinct from `RoomLogbook` notes.
- No question-quality assistant — questions today are free-form text on the deliberation row.
- No equity rollups: participation, challenge concentration, attention deficit are computable but not computed.
- No intervention recommendation engine: rules + ranked feed.
- No facilitation report exportable to institutional partners / researchers.
- No facilitator handoff primitive (current facilitator off, next facilitator on, with state snapshot).

## 3) Architecture overview

### 3.1 New domain entities

The following new Prisma models are proposed. Names are working titles.

- `FacilitationSession`
  - `id`, `deliberationId`, `openedById`, `openedAt`, `closedAt`, `closedById`, `status` (OPEN, HANDED_OFF, CLOSED), `summary`.
  - One deliberation can have a sequence of sessions (one active at a time); handoff opens a new session and closes the prior.
- `FacilitationQuestion`
  - `id`, `deliberationId`, `version`, `text`, `framingType` (enum: open, choice, evaluative, generative), `qualityReportJson` (snapshot of last assistant run), `lockedAt`, `authoredById`, `parentQuestionId` (revisions).
- `FacilitationQuestionCheck` (one row per assistant-run check)
  - `id`, `questionId`, `kind` (CLARITY, LEADING, BALANCE, SCOPE, BIAS, READABILITY), `severity` (INFO, WARN, BLOCK), `messageText`, `evidenceJson`, `runAt`.
- `FacilitationEvent` (append-only, hash-chained per session)
  - `id`, `sessionId`, `eventType` (SESSION_OPENED, METRIC_THRESHOLD_CROSSED, INTERVENTION_RECOMMENDED, INTERVENTION_APPLIED, INTERVENTION_DISMISSED, MANUAL_NUDGE, QUESTION_REOPENED, TIMEBOX_ADJUSTED, HANDOFF_INITIATED, HANDOFF_ACCEPTED, SESSION_CLOSED), `actorId`, `actorRole`, `payloadJson`, `hashChainPrev`, `hashChainSelf`, `createdAt`.
- `FacilitationIntervention`
  - `id`, `sessionId`, `kind` (enum: ELICIT_UNHEARD, REBALANCE_CHALLENGE, PROMPT_EVIDENCE, REFRAME_QUESTION, INVITE_RESPONSE, COOLDOWN, OTHER), `targetType` (CLAIM, ARGUMENT, USER, ROOM), `targetId`, `recommendedAt`, `appliedAt`, `dismissedAt`, `appliedById`, `dismissedReason`, `rationaleJson`, `priority` (1-5), `triggeredByMetric` (enum reference into the metrics catalogue).
- `EquityMetricSnapshot` (rolled forward by a worker; **authoritative record of what the system observed at that time**, while the raw event stream remains authoritative for what happened)
  - `id`, `deliberationId`, `sessionId` (nullable for cross-session rollups), `windowStart`, `windowEnd`, `metricKind` (PARTICIPATION_GINI, CHALLENGE_CONCENTRATION, RESPONSE_LATENCY_P50, ATTENTION_DEFICIT, FACILITATOR_LOAD), `metricVersion` (integer; pinned to the calculator version that produced the row), `value` (Decimal), `breakdownJson`, `isFinal` (boolean; true exactly once per `(sessionId, metricKind)` after session close).
  - Index on `(sessionId, metricKind, windowEnd)` for the most-recent-snapshot lookup the rules engine performs every cycle.
- `FacilitationHandoff`
  - `id`, `fromSessionId`, `toSessionId`, `initiatedAt`, `acceptedAt`, `notesText`, `outstandingInterventionIds` (json array).

### 3.2 Cockpit composition (server-side)

The cockpit is a single page (`/deliberations/[id]/facilitate`) backed by three independent services:

- `lib/facilitation/questionService.ts` — authoring, versioning, locking, running quality checks.
- `lib/facilitation/equityService.ts` — pure-function metric calculators that read from existing argument/claim/challenge logs and produce `EquityMetricSnapshot` rows. Calculators are deterministic and unit-testable on fixtures.
- `lib/facilitation/interventionService.ts` — rules engine that consumes the latest `EquityMetricSnapshot`s plus deliberation events and emits ranked `FacilitationIntervention` rows. Rules are declared in `lib/facilitation/rules/` as small, individually-testable modules (e.g. `unheardSpeakerRule.ts`, `challengeConcentrationRule.ts`).

A worker (`workers/facilitation/snapshotWorker.ts`) recomputes `EquityMetricSnapshot`s on a fixed cadence per open session (e.g. every 60s) and triggers the rules engine. The cockpit subscribes to the resulting snapshots and intervention rows via SWR + a lightweight SSE channel — the same pattern used elsewhere in the app for live updates.

### 3.3 Provenance and audit

Every facilitator action logs to **two** places:

1. `FacilitationEvent` — primary, hash-chained per `FacilitationSession`. Genesis event is `SESSION_OPENED`. Hash policy reuses `lib/pathways/chain.ts` verbatim:
   `hashChainSelf = sha256(hashChainPrev || canonical_json(payload) || createdAt)`.
2. `RoomLogbook` — mirrored summary entries with new `LogEntryType` values: `FACILITATION_OPENED`, `FACILITATION_INTERVENTION`, `FACILITATION_HANDOFF`, `FACILITATION_CLOSED`. This ensures the room's existing logbook view continues to be a single coherent timeline of "things that happened in this room".

`FacilitationEvent` is **never** written without a corresponding `RoomLogbook` mirror, and vice versa. The dual-write is the responsibility of the service layer, not callers.

### 3.4 Question quality assistant

The assistant is a deterministic, rules-first pipeline (no LLM in the loop for v1):

- **Clarity** — readability score (Flesch or similar), sentence-count check, jargon-density check against a configurable lexicon.
- **Leading** — pattern matchers for common leading constructions ("don't you agree…", "isn't it true…", presupposition flags).
- **Balance** — for choice/evaluative framings, requires symmetric option phrasing; flags asymmetric adjective load.
- **Scope** — flags multi-clause questions and embedded sub-questions.
- **Readability** — grade-level estimate.

Each check returns a `FacilitationQuestionCheck` with `severity`. A `BLOCK` severity prevents `lockQuestion()` from succeeding; `WARN` requires explicit acknowledgement; `INFO` is advisory.

This keeps v1 falsifiable, auditable, and offline-testable. An LLM-assisted advisory pass is explicitly deferred to a future minor release (see §7 risks).

### 3.5 Equity metrics (v1 catalogue)

Computed per deliberation × time-window. All calculators are pure functions over event streams.

- `PARTICIPATION_GINI` — Gini coefficient over per-author message/argument counts in window.
- `CHALLENGE_CONCENTRATION` — share of challenges originating from the top-k authors.
- `RESPONSE_LATENCY_P50` — median time from a claim/argument being posted to first substantive reply.
- `ATTENTION_DEFICIT` — list of claims with no reply for > T, weighted by claim "weight" (citations, support count).
- `FACILITATOR_LOAD` — count of unresolved interventions and time-since-last-action.

Each metric ships with: a calculator function, a JSON schema for its `breakdownJson`, a Storybook fixture, and a unit-test suite.

**Storage policy (locked at C0; see §9 decision 3):**

- Snapshots are first-class rows. The cockpit, rules engine, and report all read from `EquityMetricSnapshot`, never recompute on read. This makes the report reproducible from logged data alone (matches Scope A's "metrics from log" principle) and gives every `INTERVENTION_RECOMMENDED` event a stable snapshot id to point at.
- Every snapshot pins `metricVersion`. When a calculator changes in a later release, historical snapshots remain valid for their original version; the report displays the version inline so reviewers can interpret old numbers correctly.
- **Intra-session retention is verbose** (worker cadence, e.g. every 60s) so the cockpit can chart sparklines and rules can fire on freshly-observed values.
- **Post-session TTL** compacts the history: 30 days after `SESSION_CLOSED`, intra-session snapshots are downsampled to a fixed series (one per metric per ~5-minute bucket). The `isFinal=true` snapshot per `(sessionId, metricKind)` is **pinned indefinitely** as the official final value for that session, alongside any snapshot that an `INTERVENTION_RECOMMENDED` event references (those are pinned by foreign-key retention regardless of age).
- The raw event stream is retained on its own schedule and remains the recomputation source of last resort. If the snapshot ever needs to be regenerated for an audit, the calculator reads the stream **at the pinned `metricVersion`**, not the latest version.

### 3.6 Intervention rules (v1 catalogue)

Each rule is a function `(snapshot, context) → FacilitationIntervention | null`. Catalogue:

- `unheardSpeakerRule` — fires when participation Gini > θ and at least N enrolled participants have 0 contributions in the last T.
- `challengeConcentrationRule` — fires when > 60% of challenges in window came from < 20% of accounts.
- `evidenceGapRule` — fires when a claim crosses a "weight" threshold without any cited support.
- `staleClaimRule` — fires for high-weight claims with no reply for > T.
- `cooldownRule` — fires when an exchange between two accounts crosses N rapid back-and-forths.

Rules carry priority; the cockpit shows top-K (default 5) with stable ordering on tie. Rules are individually feature-flaggable.

## 4) API surface (proposed)

REST routes (Next.js app/api):

Sessions and questions:
- `POST /api/deliberations/[id]/facilitation/sessions` — open a session (facilitator role required).
- `POST /api/facilitation/sessions/[id]/close` — close session.
- `POST /api/facilitation/sessions/[id]/handoff` — initiate handoff to another facilitator.
- `POST /api/facilitation/handoffs/[id]/accept` — receiving facilitator accepts.
- `POST /api/deliberations/[id]/facilitation/questions` — author or revise a question.
- `POST /api/facilitation/questions/[id]/check` — run the quality assistant; returns checks.
- `POST /api/facilitation/questions/[id]/lock` — lock question (fails on BLOCK-severity unresolved checks).

Interventions and events:
- `GET /api/facilitation/sessions/[id]/interventions` — ranked intervention feed.
- `POST /api/facilitation/interventions/[id]/apply` — log application; writes `FacilitationEvent` + `RoomLogbook` mirror.
- `POST /api/facilitation/interventions/[id]/dismiss` — log dismissal with required `reason`.
- `GET /api/facilitation/sessions/[id]/events` — append-only event feed with `hashChainValid` field.

Equity metrics:
- `GET /api/deliberations/[id]/facilitation/metrics` — current snapshot set with optional `?window=` parameter.
- `GET /api/deliberations/[id]/facilitation/metrics/history` — historical snapshot series for charting.

Reporting:
- `GET /api/deliberations/[id]/facilitation/report` — compiled facilitation report (JSON). HTML/PDF render lives in the UI layer.

Plexus / cross-room exposure:
- No new edge kinds in v1. (Facilitation is a *within-room* concern; cross-room visibility is reserved for Scope B.)

Authorization (reuses [lib/pathways/auth.ts](lib/pathways/auth.ts) patterns):
- Open / close / handoff: deliberation host or facilitator role.
- Apply / dismiss intervention: active session's facilitator only.
- Read metrics & events: facilitators, hosts, and observers; redacted per-actor for public-read deliberations (actor IDs hashed, intervention rationales summarized).
- Question authoring: facilitators and hosts.

## 5) Phase plan (Weeks 11-18 within active timeline)

This expands master Phase 2 for the WS3 workstream. Numbered like Scope A for parity (`Phase C0` … `Phase C4`).

### Phase C0: Specification and design (Weeks 11-12)

Objective:
- Lock data model, API, rule catalogue, and cockpit layout before implementation.

Deliverables:
- C0.1 Final Prisma model proposal (this doc + reviewed deltas).
- C0.2 API contract document with request/response examples (`docs/facilitation/API.md`).
- C0.3 UX wireframes (in-repo markdown is sufficient): cockpit layout, question authoring, intervention card, report view.
- C0.4 Authorization matrix (mirror Scope A's table).
- C0.5 Equity metric specifications: formula, inputs, edge cases, fixtures.
- C0.6 Intervention rule specifications: trigger condition, suggested phrasing, priority, evidence shape.
- C0.7 Question quality check specifications: heuristics, severity assignment, pass/fail criteria.

Exit criteria:
- Architecture review sign-off.
- Metrics & rules catalogues approved by research partners (or clearly marked v1-stub if partner review is delayed).
- Decisions in §9 below confirmed.

### Phase C1: Schema, services, and rule engine (Weeks 12-14)

Objective:
- Land the data model and headless services without UI. Reuse Scope A primitives wherever possible.

Deliverables:
- C1.1 Prisma migrations for: `FacilitationSession`, `FacilitationQuestion`, `FacilitationQuestionCheck`, `FacilitationEvent`, `FacilitationIntervention`, `EquityMetricSnapshot`, `FacilitationHandoff`.
- C1.2 New `LogEntryType` enum values added to `RoomLogbook`: `FACILITATION_OPENED`, `FACILITATION_INTERVENTION`, `FACILITATION_HANDOFF`, `FACILITATION_CLOSED`.
- C1.3 Service modules under `lib/facilitation/`:
  - `sessionService.ts` (open, close, handoff lifecycle).
  - `questionService.ts` (author, revise, run checks, lock).
  - `equityService.ts` (snapshot calculators; pure-function module).
  - `interventionService.ts` (rules engine driver; recommend, apply, dismiss).
  - `facilitationEventService.ts` (append, hash-chain, query — thin wrapper around `lib/pathways/chain.ts`).
- C1.4 `lib/facilitation/rules/` directory — one file per rule from §3.6 catalogue.
- C1.5 `lib/facilitation/checks/` directory — one file per question check from §3.4 catalogue.
- C1.6 Snapshot worker `workers/facilitation/snapshotWorker.ts` — scheduled per open session.
- C1.7 Unit tests:
  - Each metric calculator over fixture event streams.
  - Each rule fires/does-not-fire under intended conditions.
  - Each question check passes/blocks correctly on fixtures.
  - Hash-chain integrity (reuses Scope A's verifier; adds a `verifyFacilitationChain(sessionId)` helper).

Exit criteria:
- All services unit-testable in isolation; target coverage on `lib/facilitation/` ≥ 85%.
- `npx prisma db push` succeeds; client regenerates cleanly.
- Hash chain verifies on a synthetic 100-event session.
- Worker produces stable snapshots on a fixture deliberation.

### Phase C2: API surface (Weeks 14-15)

Objective:
- Expose services through versioned API routes with full authorization and Zod validation.

Deliverables:
- C2.1 Routes listed in section 4.
- C2.2 Zod schemas for all request/response payloads (validation errors → 422 via `zodError()`, matching Scope A convention).
- C2.3 Authorization checks reusing `lib/pathways/auth.ts` helpers (`isFacilitator`, `isDeliberationHost`, public-read redactor).
- C2.4 Integration tests (jest) for happy-path and key failure modes:
  - Unauthorized session open / close / handoff.
  - Dismiss without reason → 422.
  - Apply intervention from an inactive session → 409.
  - Lock question with unresolved BLOCK check → 422.
  - Public-read redaction returns hashed actor IDs.
  - Hash-chain validity surfaced in `events` and `report` responses.
- C2.5 SSE endpoint or polling contract documented for the cockpit's live update channel.

Exit criteria:
- All routes covered by integration tests.
- Test target: ≥ 16 integration tests (parity with Scope A's coverage profile).

### Phase C3: UI surfaces (Weeks 15-17; overlaps with C2) — ✅ implemented

Status: All 8 deliverables shipped. Components live in
`components/facilitation/*`; routes at `app/deliberations/[id]/facilitate`,
`app/deliberations/[id]/facilitation/report`, and demo page at
`app/test/facilitation-features/page.tsx`. Cockpit context is bootstrapped
through `GET /api/deliberations/:id/facilitation/sessions` (added in this
phase as a thin co-located handler). All 22 C2 integration tests still pass.

Objective:
- Ship the facilitator cockpit and the facilitation report view.

Deliverables:
- C3.1 `FacilitationCockpit` page at `/deliberations/[id]/facilitate`:
  - Three-column layout: equity metrics (left), live event stream (center), intervention queue (right).
  - Session controls (open / close / handoff).
  - Compact question card with "run checks" and "lock" actions.
- C3.2 `QuestionAuthoring` component:
  - Inline check results with severity badges.
  - Diff view between question versions.
  - Lock confirmation modal showing all WARN-level checks the facilitator is acknowledging.
- C3.3 `EquityPanel` component:
  - Sparkline per metric over the session window.
  - Per-metric drill-down modal with `breakdownJson` rendering.
  - Threshold markers visible on each chart.
- C3.4 `InterventionCard` component:
  - Title, rationale, evidence preview, target object link, priority pip.
  - One-click `Apply` and `Dismiss` (dismiss requires reason).
  - Auto-collapses applied/dismissed cards into a "history" drawer.
- C3.5 `FacilitationTimeline` component:
  - Vertical timeline of `FacilitationEvent`s grouped by session.
  - Hash-chain validity badge (reuses Scope A's `ChainValidityBadge` pattern, parameterized on chain id).
- C3.6 `HandoffDialog` component:
  - Facilitator picker (host + facilitator role members).
  - Snapshot preview of outstanding interventions and live metric values.
  - Accept flow on the receiving facilitator's side.
- C3.7 `FacilitationReport` page at `/deliberations/[id]/facilitation/report`:
  - Session-by-session breakdown.
  - Final metrics with comparison to deliberation start.
  - Intervention log with applied / dismissed counts.
  - Hash-chain attestation block (matches Scope A's report styling).
- C3.8 Deliberation room integration:
  - "Facilitate" tab on the deliberation page (visible only to facilitators and hosts).
  - Inline equity-warning chips on claim/argument cards when `attentionDeficit` or `challengeConcentration` thresholds are crossed for that target.

Exit criteria:
- Full flow demoable end-to-end on a staging deliberation with a synthetic event stream.
- Accessibility review passed (keyboard nav for all cockpit actions, ARIA `role=feed` on intervention queue, `role=log` on event stream, contrast pass on metric charts).
- Demo page added at `app/test/facilitation-features/page.tsx` (matches Scope A's `app/test/pathways-features/page.tsx` precedent).

### Phase C4: Reporting, telemetry, and Scope B handoff hooks (Weeks 17-18) — ✅ implemented (C4.3 deferred)

Status:
- C4.1 ✅ `lib/facilitation/analyticsService.ts` + `GET /api/deliberations/[id]/facilitation/analytics` (facilitator-gated). Per-deliberation rollup of sessions, intervention apply-rates (overall, by kind, by rule), dismissal-reason distribution, start-vs-final metric deltas, and question lock/check histograms.
- C4.2 ✅ `lib/facilitation/exportService.ts` + `GET /api/facilitation/sessions/[id]/export`. Canonical JSON envelope (`schemaVersion 1.0.0`, `X-Facilitation-Export-Schema` response header) covering session, questions+checks, interventions, metric snapshots, full event chain, hash-chain summary (`failedIndex` when broken), and the rendered `FacilitationReport` rollup. Public sessions readable anonymously; private sessions facilitator-gated.
- C4.3 ⏸ Deferred. Raw aggregates are queryable via C4.1; no production consumer exists yet and the Scope A dashboard scaffold has shifted enough that re-use carries non-trivial cost. Revisit when a partner or internal team requests it.
- C4.4 ✅ `lib/facilitation/eventBus.ts` + integration in `appendEvent`. In-process pub/sub with replace-on-reregister subscribers, optional `eventTypes` filter, and error isolation (subscriber throws are logged, never propagated). Documented at-most-once delivery + ghost-event caveat for caller transactions that may roll back.
- C4.5 ✅ Bidirectional cross-link. `GET /api/pathways/[id]` returns `facilitationReportUrl` when the deliberation has ever had a session (closed → `?sessionId=...`, open → deliberation-level URL, none → `null`). `reportService.buildReport` populates `scopeAReportUrl` from the latest `InstitutionalPathway`.

Supporting docs/tests:
- Scope B handoff contract: `docs/facilitation/scope-b-handoff.md` (subscribe API, delivery semantics, envelope shape, versioning policy).
- Test coverage: `__tests__/api/facilitation.c4.test.ts` — 15 tests across analytics, export, eventBus, and pathway cross-link. C2 facilitation suite (`facilitation.routes.test.ts`) and pathway suite remain green (53/53 across the three suites).

Original deliverables (for reference):
- C4.1 Metrics service exposing per-deliberation:
  - Total interventions recommended / applied / dismissed.
  - Apply-rate by rule.
  - Dismissal-reason distribution.
  - Final equity metric values vs session-start values (delta).
  - Question lock attempts and check failure histogram.
- C4.2 Exportable facilitation report (JSON canonical + UI-rendered HTML); PDF deferred unless a partner requires it.
- C4.3 Internal telemetry dashboard alpha (re-uses the Scope A dashboard scaffold).
- C4.4 Event hooks emitted for downstream consumers — Scope B will subscribe to `INTERVENTION_APPLIED` and `METRIC_THRESHOLD_CROSSED` to seed disagreement-typology candidates.
- C4.5 Per-pathway cross-link: when a deliberation has both an open Scope A pathway and an active facilitation session, the Scope A pathway report includes a link to the facilitation report. (Additive — does not change Scope A's report schema beyond an optional `facilitationReportUrl` field.)

Exit criteria:
- Metrics reproducible from `FacilitationEvent` + `EquityMetricSnapshot` log alone (no derived state required).
- Report export validated against three test sessions of varying duration.
- Scope B handoff contract documented in `docs/facilitation/scope-b-handoff.md`.

### Stage gate to Scope B
- All Phase C0–C4 deliverables shipped to staging.
- Hash-chain verification passes on a representative sample of facilitation sessions.
- At least one internal end-to-end dry run of a 90-minute synthetic deliberation with the cockpit driven by a real facilitator.
- Exit review: confirm intervention catalogue and equity metrics are stable enough that Scope B's disagreement typology can build on them without forcing churn.

## 6) Migration and rollout plan

Database migrations:
- Single grouped migration for all new models in Phase C1 to avoid partial states.
- No destructive changes to existing models. New `LogEntryType` enum values are additive.
- Backfill: none required; sessions and snapshots begin empty.

Feature flag strategy:
- Flag `ff_facilitation_cockpit` gates the cockpit page and the "Facilitate" tab.
- Flag `ff_facilitation_question_assistant` gates question checks (so we can ship the cockpit before all checks are calibrated).
- Per-rule flags `ff_facilitation_rule_<name>` gate individual rules so we can roll them out incrementally.
- API routes available behind admin override during Phase C2.

Rollout sequence:
1. Internal facilitator pilot on a synthetic deliberation (week 17).
2. 1-2 friendly facilitators on a real (low-stakes) deliberation (week 18).
3. Pilot integration with Scope A pathway-bearing deliberations (master timeline Phase 5).
4. General availability after master Phase 4 hardening.

Documentation:
- Add `docs/facilitation/` subdirectory: data model reference, API reference, rule catalogue, metric catalogue, facilitator handbook.

## 7) Risks and mitigations

Risk: **Intervention prompts are perceived as algorithmic facilitation** and erode facilitator authority or participant trust.
Mitigation: All interventions are advisory; require explicit facilitator action to log; dismissal reasons are first-class, surfaced in the report, and used to tune rules. The cockpit copy explicitly frames interventions as "suggestions to consider", not directives.

Risk: **Equity metrics encode contested fairness assumptions.** A Gini over message counts privileges quantity over substance.
Mitigation: Ship multiple metrics, never a single composite "fairness score". Document each metric's assumptions in `docs/facilitation/`. Make every metric individually feature-flaggable so partners can opt out of metrics they reject.

Risk: **Question quality assistant fails on non-English content** or domain-specific jargon flagged as unclear.
Mitigation: Per-deliberation lexicon overrides. Severity ceiling configurable per room (e.g. demote BLOCK to WARN on legal/medical deliberations). Ship i18n hooks in Phase C1; English-only at launch.

Risk: **Snapshot worker load** on busy deliberations becomes a hot spot.
Mitigation: Per-session cadence; back off when no new events; cache last snapshot. Reuse the existing BullMQ worker infra rather than introducing a new scheduler.

Risk: **Hash-chain churn** if rules change retroactively.
Mitigation: `FacilitationEvent.payloadJson` records the rule version that fired. Rule catalogue is versioned; old events remain verifiable against their original rule version.

Risk: **Facilitator cognitive overload** — three columns, sparklines, queue, events, plus the room itself.
Mitigation: Default to a "minimal" cockpit mode showing only the top intervention and one summary metric. Power-user mode is opt-in. Usability test the minimal mode in C0/C3.

Risk: **Scope B coupling** — building disagreement typology hooks before Scope B is specified causes throwaway work.
Mitigation: C4 deliverables emit only generic events; Scope B writes its own subscriber. No Scope-B-specific schema lands in C4.

Risk: **LLM-assisted question checks tempt v1 scope creep.**
Mitigation: v1 is rules-only and deterministic. LLM advisory mode is captured as a v1.1 backlog item; not in scope.

## 8) Metrics and success criteria

Engineering health:
- Test coverage on `lib/facilitation/` ≥ 85%.
- Hash-chain verification pass rate 100% on staging.
- Snapshot worker p95 < 500ms per session per cycle on a deliberation with ≤ 200 events.
- Migration applied cleanly in dev, staging, prod.

Product adoption (post-pilot):
- ≥ 1 facilitation session opened per pilot deliberation.
- ≥ 60% of recommended interventions are explicitly applied or dismissed (i.e. actively triaged, not ignored).
- ≥ 1 question quality check run per locked question.
- Facilitator-reported usefulness ≥ 4 / 5 on the post-pilot survey.

Research validation:
- Pilot retrospective explicitly references facilitation report data as evidence of facilitation quality (parallel to Scope A's accountability-evidence claim).
- At least one documented case where an intervention rule changed facilitator behaviour mid-session.

## 9) Design decisions (to be locked at C0)

Recommended answers below; finalize at the C0 architecture review.

1. **Single active session per deliberation.** Recommended: yes — exactly one OPEN session at a time; handoff atomically closes the prior. Simplifies audit trail and rules engine state.
   - agree with recommended, approved
2. **Question check failure model.** Recommended: BLOCK / WARN / INFO three-tier; BLOCK prevents lock, WARN requires acknowledgement, INFO is advisory. Mirrors lint convention.
    - agree with recommended, approved
3. **Equity metric storage.** Recommended: snapshots are first-class rows (not derived on-read), so the report is reproducible from logged data alone. Matches Scope A's "metrics from log" principle. Locked with three nuances: (a) every snapshot pins `metricVersion` so historical reports remain interpretable when calculators change; (b) intra-session snapshots are downsampled 30 days after `SESSION_CLOSED` to a ~5-minute-bucket series; (c) the `isFinal` snapshot per `(sessionId, metricKind)` and any snapshot referenced by an `INTERVENTION_RECOMMENDED` event are pinned indefinitely.
    - approved with nuances above
4. **Intervention dismissal reason.** Recommended: required free-text + optional structured tag (`not_relevant`, `already_addressed`, `wrong_target`, `other`). Tags drive rule tuning; free text drives qualitative review.
    - agree with recommended, approved
5. **Public read of facilitation data.** Recommended: opt-in per deliberation, gated by deliberation visibility, with actor IDs hashed and intervention rationales summarized — same redaction posture as Scope A pathways.
    - agree with recommendation, approved
6. **LLM in question assistant.** Recommended: not in v1. Re-evaluate after pilot data.
    - no LLM integration
7. **Cross-room facilitation rollups.** Recommended: not in v1; defer until Scope B can frame what cross-room facilitation comparison means.
    - agree to defer 

## 10) Immediate next actions

1. Spin up C0 design week:
   - Convert section 3 into a Prisma migration draft (no apply).
   - Produce the API contract document (section 4) as `docs/facilitation/API.md`.
   - Sketch the cockpit and report views (in-repo wireframe markdown is sufficient).
2. Confirm answers to section 9 design decisions.
3. Review the §3.5 metric catalogue and §3.6 rule catalogue with at least one external facilitator.
4. Schedule architecture review at end of week 12.
5. Verify Scope A stage-gate exit criteria are satisfied (hash-chain verification, telemetry sufficiency for C to consume) before C1 starts.
