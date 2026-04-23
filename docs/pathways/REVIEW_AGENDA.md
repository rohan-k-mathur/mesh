# Pathways A0 Architecture Review — Agenda

Status: Draft v0.1
Target date: End of A0 design week (Friday of week 2)
Duration: 90 minutes
Format: Synchronous review with async pre-read
Workstream: WS1 Institutional Pathways (Scope A)

## Purpose

Lock the data model, API contract, and UX intent before A1 implementation begins. Exit criterion: explicit go / no-go on starting Phase A1 (schema migration + service layer).

## Required attendees

- Engineering lead (Mesh core)
- Product lead (deliberation surface)
- Design lead (deliberation UX)
- Prisma / data infrastructure owner
- Research lead (deliberative democracy)

## Optional attendees

- Security / privacy reviewer (for hash-chain and snapshot policy)
- Civic partnerships lead (for partner intake `channel` requirements)

## Pre-read (24 hours before)

Required:
- [docs/DelibDemocracyScopeA_Roadmap.md](DelibDemocracyScopeA_Roadmap.md)
- [docs/pathways/MIGRATION_DRAFT.md](pathways/MIGRATION_DRAFT.md)
- [docs/pathways/API.md](pathways/API.md)
- [docs/pathways/WIREFRAMES.md](pathways/WIREFRAMES.md)

Reference:
- [docs/DelibDemocracyGapAnalysis.md](DelibDemocracyGapAnalysis.md) sections I, V
- [docs/DelibDemocracyImplementationRoadmapSkeleton.md](DelibDemocracyImplementationRoadmapSkeleton.md) Active Timeline section

## Agenda

### Block 1 — Framing (10 min)
- Restate Scope A definition of done (6 capabilities).
- Confirm A -> C -> B sequencing and stage gate to Scope C.
- Confirm five locked design decisions from roadmap section 9.

### Block 2 — Data model walkthrough (25 min)
- Walk through new models in [docs/pathways/MIGRATION_DRAFT.md](pathways/MIGRATION_DRAFT.md):
  - `Institution`, `InstitutionMember`
  - `InstitutionalPathway`
  - `RecommendationPacket`, `RecommendationPacketItem`
  - `InstitutionalSubmission`, `InstitutionalResponse`, `InstitutionalResponseItem`
  - `PathwayEvent`
- Confirm User FK convention (loose `String` auth_id, no `@relation` to `User`).
- Confirm `onDelete: Restrict` policy on accountability data.
- Confirm `LogEntryType` enum extension does not collide.

Decision needed:
- Approve schema deltas as final or list specific changes required before A1 begins.

### Block 3 — API contract (15 min)
- Walk through endpoints in [docs/pathways/API.md](pathways/API.md):
  - Institutions (CRUD)
  - Pathways (open/list/detail/revise/close/events)
  - Packets (draft/items/submit)
  - Submissions and responses (acknowledge, respond, item dispositions)
  - Plexus network extension
  - Public read variants
- Confirm authorization matrix.
- Confirm error code taxonomy.

Decision needed:
- Approve API surface or specify changes (e.g., split endpoints, additional filters).

### Block 4 — Hash chain and snapshot policy (15 min)
- Walk through:
  - `hashChainSelf = sha256(hashChainPrev || canonical_json(payload) || createdAt)`.
  - Per-pathway chain anchored at `DRAFT_OPENED`.
  - Packet snapshot canonical JSON specification.
  - Verifier algorithm sketch.
- Confirm tamper-evidence is sufficient for Scope A pilots (no Merkle / external anchor required yet).

Decision needed:
- Approve minimal viable hash chain or escalate to require additional anchoring.

### Block 5 — UX surfaces (10 min)
- Walk through wireframes in [docs/pathways/WIREFRAMES.md](pathways/WIREFRAMES.md):
  - PacketBuilder
  - PathwayTimeline
  - InstitutionProfile
  - ResponseIntake
- Confirm Plexus visualization additions (institution node, two new edge types).
- Note four open UX questions deferred to A3 (non-blocking).

Decision needed:
- Approve information architecture or list required revisions.

### Block 6 — Migration and rollout (10 min)
- Single grouped migration plan.
- Feature flag: `ff_pathways`.
- Rollout sequence: internal admin pilot -> closed partner pilot -> GA.
- Documentation plan (`docs/pathways/`).

Decision needed:
- Approve rollout sequence and pilot trigger criteria.

### Block 7 — Open questions and exit (5 min)
- Surface any remaining concerns.
- Identify Phase A1 owner(s).
- Set Phase A1 kickoff date.

Decision needed:
- **GO** for Phase A1 implementation, or **NO-GO** with explicit blocker list.

## Decision log template

| # | Topic | Decision | Owner | Date |
|---|-------|----------|-------|------|
| 1 | Schema deltas | | | |
| 2 | API contract | | | |
| 3 | Hash chain policy | | | |
| 4 | UX information architecture | | | |
| 5 | Rollout sequence | | | |
| 6 | Phase A1 GO/NO-GO | | | |

## Pre-meeting checklist for facilitator

- [ ] All pre-read docs current and linked.
- [ ] Attendee invites sent with agenda 48h prior.
- [ ] Decision log document opened and shared.
- [ ] Recording / notes owner identified.
- [ ] Phase A1 kickoff slot tentatively held on calendar.

## Post-meeting follow-ups

- Decision log committed to `docs/pathways/REVIEW_DECISIONS.md`.
- Any required schema/API/UX changes filed as work items before A1 starts.
- Phase A1 owner kicks off implementation per [docs/DelibDemocracyScopeA_Roadmap.md](DelibDemocracyScopeA_Roadmap.md) section 5.
