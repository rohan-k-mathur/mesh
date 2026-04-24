# Facilitation C0 Architecture Review — Agenda

Status: Draft v0.1
Target date: End of C0 design week (Friday of week 12)
Duration: 90 minutes
Format: Synchronous review with async pre-read
Workstream: WS3 Facilitation Architecture (Scope C)

## Purpose

Lock the data model, API contract, UX intent, equity-metric formulas, intervention-rule catalogue, and question-quality heuristics before C1 implementation begins. Exit criterion: explicit GO / NO-GO on starting Phase C1 (schema migration + service layer + snapshot worker).

## Required attendees

- Engineering lead (Mesh core)
- Product lead (deliberation surface)
- Design lead (deliberation UX)
- Prisma / data infrastructure owner
- Research lead (deliberative democracy)
- Scope A owner (cross-scope crosslink validation — facilitation report ↔ pathway report)

## Optional attendees

- Security / privacy reviewer (public-read redaction policy, hash chain)
- Civic partnerships lead (rule calibration thresholds)
- Worker / queue infrastructure owner (BullMQ snapshot cadence, downsample job)

## Pre-read (24 hours before)

Required:
- [docs/DelibDemocracyScopeC_Roadmap.md](../DelibDemocracyScopeC_Roadmap.md) — including §9 (locked decisions) and §3 (data model)
- [docs/facilitation/MIGRATION_DRAFT.md](MIGRATION_DRAFT.md)
- [docs/facilitation/API.md](API.md)
- [docs/facilitation/WIREFRAMES.md](WIREFRAMES.md)
- [docs/facilitation/AUTH_MATRIX.md](AUTH_MATRIX.md)
- [docs/facilitation/EQUITY_METRICS.md](EQUITY_METRICS.md)
- [docs/facilitation/INTERVENTION_RULES.md](INTERVENTION_RULES.md)
- [docs/facilitation/QUESTION_CHECKS.md](QUESTION_CHECKS.md)

Reference:
- Scope A as completed: [docs/pathways/REVIEW_DECISIONS.md](../pathways/REVIEW_DECISIONS.md)
- Roadmap stage gate criteria: §10 immediate next actions, item 5

## Agenda

### Block 1 — Framing (5 min)
- Restate Scope C definition of done.
- Confirm A → C → B sequencing; verify Scope A stage-gate exit criteria are satisfied (hash-chain verification passing in production, Scope A telemetry available for C to consume).
- Restate the 7 design decisions locked in roadmap §9 (no re-litigation unless evidence has changed).

### Block 2 — Data model walkthrough (20 min)
- Walk [docs/facilitation/MIGRATION_DRAFT.md](MIGRATION_DRAFT.md):
  - Enums (FacilitationSessionStatus, …, FacilitationHandoffStatus).
  - Models: FacilitationSession (partial unique on OPEN), FacilitationQuestion (versioned), FacilitationQuestionCheck, FacilitationEvent (hash-chained), FacilitationIntervention (rule pinning, snapshot back-references), EquityMetricSnapshot (metricVersion, isFinal), FacilitationHandoff.
  - LogEntryType extension: FACILITATION_OPENED / INTERVENTION / HANDOFF / CLOSED.
  - Back-references on Deliberation.
- Confirm User FK convention (loose `String` auth_id) consistent with Scope A.
- Confirm `onDelete` policies (cascade where intra-session, restrict where it would break the chain).
- Resolve 4 open issues listed at the end of MIGRATION_DRAFT (see "Decisions needed" below).

Decision needed:
- Approve schema deltas as final, OR list specific changes required before C1.

### Block 3 — API contract and authorization (15 min)
- Walk [docs/facilitation/API.md](API.md):
  - Sessions, Questions, Interventions, Metrics, Reporting endpoints.
  - SSE channel + 10s polling fallback.
  - Crosslink to Scope A pathway report (additive `facilitationReportUrl`).
- Walk [docs/facilitation/AUTH_MATRIX.md](AUTH_MATRIX.md):
  - 25-row capability matrix.
  - `isActiveSessionFacilitator` semantics.
  - Public-read redaction (decision #5) — confirm field-by-field transformations.
- Confirm error code taxonomy aligns with Scope A.

Decision needed:
- Approve API + auth surface, OR specify required changes.

### Block 4 — Hash chain, snapshots, retention (15 min)
- Confirm reuse of `lib/pathways/chain.ts` verbatim — per-session chain anchored at SESSION_OPENED.
- Walk EquityMetricSnapshot lifecycle from [docs/facilitation/EQUITY_METRICS.md](EQUITY_METRICS.md):
  - 60-second per-session cadence.
  - `metricVersion` pinning.
  - `INTERVENTION_RECOMMENDED` event references `triggeredByMetricSnapshotId`.
  - 30-day post-close downsample to 5-minute buckets.
  - Indefinite retention for `isFinal` snapshots and any snapshot referenced by an intervention or event.
- Confirm metric formulas (PARTICIPATION_GINI, CHALLENGE_CONCENTRATION, RESPONSE_LATENCY_P50, ATTENTION_DEFICIT, FACILITATOR_LOAD) and default thresholds.

Decision needed:
- Approve metric v1 specs, OR request formula / threshold changes.
- Approve snapshot retention policy as documented.

### Block 5 — Intervention rules and question checks (15 min)
- Walk the 5 rules in [docs/facilitation/INTERVENTION_RULES.md](INTERVENTION_RULES.md): unheardSpeakerRule, challengeConcentrationRule, evidenceGapRule, staleClaimRule, cooldownRule.
- Confirm priority scale, dedupe windows, suggested phrasing tone, feature-flag posture (cooldownRule off by default).
- Resolve open question: should evidenceGapRule and cooldownRule synthesize a snapshot to keep the "every rule references a snapshot" invariant? Recommendation: no for v1.
- Walk the 6 checks in [docs/facilitation/QUESTION_CHECKS.md](QUESTION_CHECKS.md): CLARITY, LEADING, BALANCE, SCOPE, READABILITY, BIAS (stub).
- Confirm `BIAS` ships as a reserved enum with no active heuristics.
- Confirm severity ceiling override mechanism for legal/medical partner deliberations.

Decision needed:
- Approve rule catalogue and check catalogue as v1, OR identify required changes.

### Block 6 — UX surfaces (10 min)
- Walk [docs/facilitation/WIREFRAMES.md](WIREFRAMES.md):
  - Cockpit 3-column layout, ARIA semantics, J/K cycling.
  - Question authoring with check run + lock modal.
  - Intervention card priority pip + suggested phrasing + Apply / Dismiss.
  - Dismiss modal (required reasonText, optional reasonTag).
  - Handoff dialog with snapshot preview.
  - Report page surfaces (questions, metric deltas, apply rate by rule, dismissal tag distribution, hash chain attestation).
  - Deliberation room integration (Facilitate tab + inline equity chips on claim cards).
- Resolve 4 open UX questions including minimal-mode default for new facilitators.

Decision needed:
- Approve information architecture, OR list required revisions.

### Block 7 — Migration, rollout, observability (5 min)
- Single grouped migration plan; partial unique index shipped as raw SQL.
- Feature flags: `ff_facilitation`, plus per-rule flags from rule registry.
- Rollout sequence: internal admin pilot → closed facilitator pilot → GA.
- Worker observability: per-session snapshot cadence dashboard, queue depth alarms, rule-error counters.
- Documentation plan (`docs/facilitation/`).

Decision needed:
- Approve rollout sequence and pilot trigger criteria.

### Block 8 — Stage gate and exit (5 min)
- Confirm Scope A exit criteria explicitly satisfied (no rework required for C to consume).
- Identify Phase C1 owner(s) and snapshot worker owner.
- Set Phase C1 kickoff date.

Decision needed:
- **GO** for Phase C1 implementation, OR **NO-GO** with explicit blocker list.

## Decision log template

| # | Topic | Decision | Owner | Date |
|---|-------|----------|-------|------|
| 1 | Schema deltas (incl. 4 MIGRATION_DRAFT open issues) | | | |
| 2 | API + authorization matrix | | | |
| 3 | Hash chain + snapshot retention policy | | | |
| 4 | Equity metric v1 formulas and thresholds | | | |
| 5 | Intervention rule catalogue (incl. cooldownRule default-off) | | | |
| 6 | Question check catalogue (incl. BIAS stub, severity-ceiling override) | | | |
| 7 | UX information architecture (incl. 4 open WIREFRAMES questions) | | | |
| 8 | Rollout sequence and pilot triggers | | | |
| 9 | Scope A stage-gate exit verified | | | |
| 10 | Phase C1 GO/NO-GO | | | |

## Pre-meeting checklist for facilitator

- [ ] All 7 pre-read docs current and linked.
- [ ] Attendee invites sent with agenda 48h prior.
- [ ] Decision log document opened and shared.
- [ ] Recording / notes owner identified.
- [ ] Scope A owner has confirmed stage-gate verification ahead of meeting.
- [ ] Phase C1 kickoff slot tentatively held on calendar.

## Post-meeting follow-ups

- Decision log committed to [docs/facilitation/REVIEW_DECISIONS.md](REVIEW_DECISIONS.md).
- Any required schema/API/rule/check/UX changes filed as work items before C1.
- Phase C1 owner kicks off implementation per [docs/DelibDemocracyScopeC_Roadmap.md](../DelibDemocracyScopeC_Roadmap.md) §5.
