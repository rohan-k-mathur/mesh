# Scope A: Deliberative System Connectivity — Development Roadmap

Status: Draft v0.1
Parent docs:
- [docs/DelibDemocracyGapAnalysis.md](docs/DelibDemocracyGapAnalysis.md)
- [docs/DelibDemocracyImplementationRoadmapSkeleton.md](docs/DelibDemocracyImplementationRoadmapSkeleton.md)
Workstream: WS1 Institutional Pathways
Sequence position: First in active execution order (A -> C -> B)

## 1) Scope and outcome

### Problem statement
Mesh's Plexus already connects deliberation rooms via argumentative meta-edges (xref, overlap, stack_ref, imports, shared_author) and tracks internal provenance via append-only logs. What is missing is the institutional layer: the explicit modeling of the actors, obligations, and decision pathways that sit downstream of a deliberation. As-is, the platform can document what was deliberated. It cannot document what an institution did with the reasoning, what it accepted or rejected, or on what stated grounds. The transmission problem is therefore solved at the export level but not at the accountability level.

### Outcome (definition of done for Scope A)
A Mesh deliberation can:
1. Designate one or more institutional recipients of its outputs (committees, agencies, sponsors, internal governance bodies).
2. Package selected claims, arguments, and meta-consensus context into a structured recommendation packet with stable identifiers.
3. Deliver the packet through a tracked submission event with cryptographic provenance.
4. Receive structured institutional responses that reference specific argument and claim IDs from the packet.
5. Render a public-facing pathway timeline that shows submission, acknowledgement, response, and any revision rounds.
6. Surface accountability metrics (response coverage, response latency, acceptance vs rejection ratios) to the deliberation participants and observers.

### Non-goals (Scope A)
- No public scrutiny / external challenge workflow (deferred Scope F).
- No sortition or participant provisioning pipeline (deferred Scope E).
- No new contribution modalities (deferred Scope D).
- No automatic AI inference of institutional positions; institutional responses are authored or imported, not synthesized.

## 2) Existing platform foundations to build on

Confirmed in the codebase, do not reinvent:

Cross-room and Plexus layer:
- [RoomFunctor](lib/models/schema.prisma) and [/api/room-functor/transport](app/api/room-functor/transport/route.ts) for inter-room mappings.
- [/api/agora/network](app/api/agora/network/route.ts) for graph-of-graphs rendering, currently exposing edge types `xref`, `overlap`, `stack_ref`, `imports`, `shared_author`.
- [lib/crossDeliberation/](lib/crossDeliberation/) services: `argumentTransportService`, `canonicalRegistryService`, `crossRoomSearchService`.

Provenance and audit layer:
- [EvidenceProvenanceEvent](lib/models/schema.prisma) for evidence lifecycle.
- [DecisionReceipt](lib/models/schema.prisma) for room-level governance actions.
- [RoomLogbook](lib/models/schema.prisma) (`LogEntryType`: STATUS_CHANGE, PANEL_OPEN, PANEL_DECISION, POLICY_CHANGE, NOTE).
- [CQActivityLog](lib/models/schema.prisma) for critical question lifecycle.
- [DebateRelease](lib/models/schema.prisma) for versioned snapshots and changelogs.

Deliberation core:
- [Deliberation](lib/models/schema.prisma), [AgoraRoom](lib/models/schema.prisma), [DeliberationRole](lib/models/schema.prisma), [DeliberationCall](lib/models/schema.prisma).
- [Claim](lib/models/schema.prisma), [Argument](lib/models/schema.prisma), [ArgumentPremise](lib/models/schema.prisma), [Citation](lib/models/schema.prisma), [Source](lib/models/schema.prisma).

Identified gaps that Scope A must close:
- No explicit `Institution` (or equivalent recipient) entity.
- No recommendation packet model bundling claims/arguments for downstream consumption.
- No institutional submission event distinct from internal release events.
- No structured response type that references packet contents.
- No pathway timeline view that crosses the deliberation/institution boundary.
- No accountability metrics specific to institutional responses.

## 3) Architecture overview

### 3.1 New domain entities

The following new Prisma models are proposed. Names are working titles.

- `Institution`
  - `id`, `slug`, `name`, `kind` (enum: legislature, agency, sponsor, internal_governance, advisory_board, other), `jurisdiction`, `contactJson`, `verifiedAt`, `createdById`.
- `InstitutionMember` (optional, lightweight)
  - `id`, `institutionId`, `userId` (nullable for off-platform members), `displayName`, `role`, `verifiedAt`.
- `RecommendationPacket`
  - `id`, `deliberationId`, `title`, `summary`, `status` (DRAFT, SUBMITTED, RESPONDED, REVISED, CLOSED), `version`, `createdById`, `submittedAt`, `closedAt`.
- `RecommendationPacketItem`
  - `id`, `packetId`, `kind` (CLAIM, ARGUMENT, CITATION, NOTE), `targetType`, `targetId`, `orderIndex`, `commentary`.
  - Snapshot fields for immutability of submitted content (e.g., `snapshotJson`, `snapshotHash`).
- `InstitutionalSubmission`
  - `id`, `packetId`, `institutionId`, `submittedById`, `submittedAt`, `acknowledgedAt`, `acknowledgedById`, `channel` (enum: in_platform, email, formal_intake, api), `externalReference`.
- `InstitutionalResponse`
  - `id`, `submissionId`, `respondedById`, `respondedAt`, `dispositionSummary`, `responseStatus` (PENDING, RECEIVED, PARTIAL, COMPLETE).
- `InstitutionalResponseItem`
  - `id`, `responseId`, `targetType` (PACKET_ITEM, ARGUMENT, CLAIM), `targetId`, `disposition` (ACCEPTED, REJECTED, MODIFIED, DEFERRED, NO_RESPONSE), `rationaleText`, `evidenceCitations` (json), `createdById`.
- `PathwayEvent` (append-only, polymorphic)
  - `id`, `pathwayId` (nullable, for grouping rounds), `packetId`, `submissionId` (nullable), `responseId` (nullable), `eventType` (DRAFT_OPENED, ITEM_ADDED, SUBMITTED, ACKNOWLEDGED, RESPONSE_RECEIVED, ITEM_DISPOSITIONED, REVISED, CLOSED), `actorId`, `actorRole`, `payloadJson`, `hashChainPrev`, `hashChainSelf`, `createdAt`.
- `InstitutionalPathway` (logical grouping over rounds)
  - `id`, `deliberationId`, `institutionId`, `subject`, `currentPacketId`, `status`, `openedAt`, `closedAt`.

### 3.2 Plexus extension

Add a new meta-edge type to [/api/agora/network](app/api/agora/network/route.ts) and the Plexus rendering layer:
- `institutional_pathway` (deliberation node ↔ institution node)
- `pathway_response` (institutional response back-reference to deliberation node)

Institutions become nodes in the Plexus graph with a distinct visual treatment from deliberation nodes. This makes the systemic-turn requirement architecturally visible.

### 3.3 Provenance integration

All Scope A state changes write to:
- `PathwayEvent` (primary, hash-chained for tamper evidence).
- `RoomLogbook` (mirrored summary entries with new `LogEntryType` values: PATHWAY_OPENED, PACKET_SUBMITTED, RESPONSE_RECEIVED, PATHWAY_REVISED, PATHWAY_CLOSED).
- `DecisionReceipt` (for governance actions like sponsor-side packet approval).

Hash chaining policy:
- `hashChainSelf = sha256(hashChainPrev || canonical_json(payload) || createdAt)`.
- Chain is per-pathway, anchored at the DRAFT_OPENED event.

### 3.4 Snapshot and immutability

When a packet transitions to SUBMITTED:
- All `RecommendationPacketItem` entries snapshot the underlying claim/argument text, version, and citation set into `snapshotJson`.
- A `DebateRelease` row is created with `releaseNotes` linking to the packet.
- Subsequent edits to the source claims do not retroactively alter the submitted packet; revisions create a new packet version.

## 4) API surface (proposed)

REST routes (Next.js app/api):
- `POST /api/institutions` — create institution (admin-gated).
- `GET /api/institutions` — list, filter by kind/jurisdiction.
- `GET /api/institutions/[id]` — detail.
- `POST /api/deliberations/[id]/pathways` — open a pathway to an institution.
- `GET /api/deliberations/[id]/pathways` — list pathways for a deliberation.
- `GET /api/pathways/[id]` — pathway detail with full event timeline.
- `POST /api/pathways/[id]/packets` — create draft packet.
- `POST /api/packets/[id]/items` — add item (claim/argument/citation).
- `POST /api/packets/[id]/submit` — finalize and submit; triggers snapshot + hash chain.
- `POST /api/submissions/[id]/acknowledge` — institutional acknowledgement.
- `POST /api/submissions/[id]/responses` — record a structured response.
- `POST /api/responses/[id]/items` — add disposition entries against packet items.
- `POST /api/pathways/[id]/revise` — open a revision round.
- `POST /api/pathways/[id]/close` — close pathway.
- `GET /api/pathways/[id]/events` — append-only event feed.
- `GET /api/agora/network` — extended to include `institutional_pathway` and `pathway_response` edges.

Authorization:
- Pathway open/close: deliberation host or facilitator role.
- Packet draft/edit: deliberation contributors.
- Submit: facilitator or designated submitter.
- Response authoring: verified institutional members or facilitator-assisted intake (with explicit `channel` annotation).

## 5) Phase plan (Weeks 1-10 within active timeline)

This expands Phase 0 + Phase 1 of the master timeline for the Scope A workstream.

### Phase A0: Specification and design (Weeks 1-2)

Objective:
- Lock data model, API surface, and UX flows before implementation.

Deliverables:
- A0.1 Final Prisma model proposal (this doc + reviewed deltas).
- A0.2 API contract document with request/response examples.
- A0.3 UX wireframes: pathway timeline view, packet builder, response intake form, institution profile.
- A0.4 Authorization matrix.
- A0.5 Hash-chain and snapshot specification.

Exit criteria:
- Architecture review sign-off.
- Migration plan reviewed against existing `RoomFunctor`, `DecisionReceipt`, `EvidenceProvenanceEvent` semantics.

### Phase A1: Schema and core services (Weeks 3-5)

Objective:
- Land the data model and headless services without UI.

Deliverables:
- A1.1 Prisma migrations for: `Institution`, `InstitutionMember`, `RecommendationPacket`, `RecommendationPacketItem`, `InstitutionalSubmission`, `InstitutionalResponse`, `InstitutionalResponseItem`, `PathwayEvent`, `InstitutionalPathway`.
- A1.2 New `LogEntryType` enum values added to `RoomLogbook`.
- A1.3 Service module `lib/pathways/`:
  - `pathwayService.ts` (open, revise, close).
  - `packetService.ts` (draft, addItem, submit, snapshot).
  - `submissionService.ts` (submit, acknowledge).
  - `responseService.ts` (record, disposition).
  - `pathwayEventService.ts` (append, hash-chain, query).
- A1.4 Snapshot serializer (deterministic canonical JSON for hashing).
- A1.5 Unit tests covering snapshot determinism and hash-chain integrity.

Exit criteria:
- All services testable in isolation.
- `npx prisma db push` succeeds and types regenerate cleanly.
- Hash chain verifiable by independent script.

### Phase A2: API surface (Weeks 5-7)

Objective:
- Expose services through versioned API routes with full authorization.

Deliverables:
- A2.1 Routes listed in section 4.
- A2.2 Zod (or existing validator) schemas for all request/response payloads.
- A2.3 Authorization checks reusing existing role primitives (`DeliberationRole`, host check).
- A2.4 Integration tests (jest) for happy-path and key failure modes (unauthorized submit, double-submit, response references to wrong packet, snapshot mismatch).
- A2.5 Plexus network endpoint extension to expose new edge types.

Exit criteria:
- All routes covered by integration tests.
- Plexus network response renders institutional nodes correctly when consumed by existing visualization layer.

### Phase A3: UI surfaces (Weeks 6-9; overlaps with A2)

Objective:
- Ship the participant-facing and observer-facing experiences.

Deliverables:
- A3.1 `PacketBuilder` component:
  - Add claim/argument/citation items.
  - Reorder, comment.
  - Submit modal showing snapshot diff and recipient confirmation.
- A3.2 `PathwayTimeline` component:
  - Vertical timeline of `PathwayEvent`s with grouping by round.
  - Filters by event type.
  - Hash-chain validity badge.
- A3.3 `InstitutionProfile` page:
  - Institution metadata, active pathways, response history, response latency stats.
- A3.4 `ResponseIntake` flow:
  - In-platform authoring for verified institutional members.
  - Facilitator-assisted intake form (with `channel` annotation and external reference fields).
- A3.5 Plexus visualization update:
  - Institution node styling.
  - `institutional_pathway` and `pathway_response` edge styling and tooltips.
- A3.6 Deliberation room integration:
  - "Pathways" tab on the deliberation page.
  - Inline pathway badges on claims/arguments included in submitted packets.

Exit criteria:
- Full flow demoable end-to-end on a staging deliberation.
- Accessibility review passed (keyboard nav, contrast, ARIA roles).

### Phase A4: Telemetry, metrics, and reporting (Weeks 8-10)

Objective:
- Make accountability measurable and reportable.

Deliverables:
- A4.1 Metrics service exposing per-pathway:
  - Submission-to-acknowledgement latency.
  - Acknowledgement-to-response latency.
  - Item-level disposition coverage (% of items with explicit disposition).
  - Acceptance / rejection / modification ratios.
- A4.2 Deliberation-level rollups:
  - Pathway count.
  - Active vs closed.
  - Institutional response rate.
- A4.3 Exportable accountability report (PDF or HTML) per pathway, including hash-chain attestation.
- A4.4 Telemetry dashboard alpha (internal first).
- A4.5 Event hooks emitted for downstream consumers (Scope C facilitation cockpit will subscribe in its own phase).

Exit criteria:
- Metrics reproducible from `PathwayEvent` log alone (no derived state required).
- Report export validated against three test pathways.

### Stage gate to Scope C
- All Phase A1-A4 deliverables shipped to staging.
- Hash-chain verification passes on a representative sample.
- At least one internal end-to-end dry run with a synthetic institution and synthetic response cycle.
- Exit review: confirm telemetry hooks are sufficient for Scope C to consume.

## 6) Migration and rollout plan

Database migrations:
- Single grouped migration for all new models in Phase A1 to avoid partial states.
- No destructive changes to existing models.
- Backfill: none required; institutions and pathways begin empty.

Feature flag strategy:
- Flag `ff_pathways` gates UI surfaces.
- API routes available behind admin override during Phase A2 for testing.
- Public Plexus edges (`institutional_pathway`, `pathway_response`) gated until Phase A3 completion.

Rollout sequence:
1. Internal admin pilot with one synthetic institution.
2. Invite 1-2 friendly partner institutions for closed pilot before Phase 5 of master timeline.
3. General availability after master Phase 4 hardening.

Documentation:
- Add a `docs/pathways/` subdirectory with: data model reference, API reference, facilitator guide, institutional intake guide.

## 7) Risks and mitigations

Risk: Institutional partners cannot or will not author responses in-platform.
Mitigation: Support facilitator-assisted intake with explicit `channel` annotation; treat off-platform responses as first-class but flagged.

Risk: Snapshot model creates storage bloat.
Mitigation: Store canonical JSON; compress at rest; cap embedded citation payloads with reference links to canonical sources.

Risk: Hash-chain complexity slows development.
Mitigation: Implement minimal viable hash chain in Phase A1 (sha256, sequential); defer Merkle/anchor work indefinitely unless required by partners.

Risk: Plexus visualization becomes cluttered when institutions are added.
Mitigation: Default-collapse institutional nodes behind a toggle; add a dedicated "Pathways view" mode.

Risk: Response disposition taxonomy drifts when Scope B (disagreement typology) lands.
Mitigation: Keep `disposition` enum minimal and orthogonal to disagreement typology; document the boundary in `docs/pathways/`.

Risk: Authorization complexity when institutional members are off-platform.
Mitigation: Use a hybrid model: `userId` nullable, `displayName` plus `verifiedAt` timestamp; verification handled by facilitator role.

## 8) Metrics and success criteria

Engineering health:
- Test coverage on `lib/pathways/` >= 85%.
- Hash-chain verification pass rate 100% on staging.
- Migration applied cleanly in dev, staging, prod.

Product adoption (post-pilot):
- At least 1 pathway opened per pilot deliberation.
- Median submission-to-acknowledgement latency tracked.
- At least 60% of packet items receive an explicit disposition in pilot pathways.

Research validation:
- Pilot retrospective explicitly references pathway data as accountability evidence.
- Documented case study suitable for the deliberative democracy community.

## 9) Design decisions (locked at A0)

All recommended answers approved on April 20, 2026.

1. **Institution scope**: Global registry with per-deliberation enrollment. (LOCKED)
2. **Revision model**: Pathway revisions create a new `RecommendationPacket` row with `version` increment and `parentPacketId` link, preserving immutability of prior submissions. (LOCKED)
3. **Public read API**: Read-only and unauthenticated for pathways flagged public, gated by deliberation visibility. (LOCKED)
4. **Disposition granularity**: Per-item disposition required, with a packet-level rollup status derived. (LOCKED)
5. **Institution-as-deliberation**: `Institution.linkedDeliberationId` optional foreign key; rendered as a special meta-edge in Plexus when present. (LOCKED)

## 10) Immediate next actions

1. Spin up A0 design week:
   - Convert this document's section 3 into a Prisma migration draft (no apply).
   - Produce the API contract document (section 4) as `docs/pathways/API.md`.
   - Sketch the four core UI surfaces in Figma (or in-repo wireframe markdown).
        *in-repo wireframe is sufficient
2. Confirm answers to section 9 open questions.
        - all the recommended answers are approved
3. Schedule architecture review at end of week 2.

4. Identify pilot institutional partners during weeks 1-4 to inform realistic intake `channel` requirements.
