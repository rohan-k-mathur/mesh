# Typology — Prisma Migration Draft (DO NOT APPLY)

Status: Draft v0.1 (B0 deliverable, not yet reviewed)
Source roadmap: [docs/DelibDemocracyScopeB_Roadmap.md](../DelibDemocracyScopeB_Roadmap.md)
Target schema file: `lib/models/schema.prisma`
Apply policy: This file is reference-only. Do **not** run `prisma db push` from this draft. After B0 architecture review the approved blocks will be merged into `lib/models/schema.prisma` and applied via the standard `npx prisma db push` workflow. The axis registry seed (see `prisma/seed/typologyAxes.ts`) runs **after** the migration lands.

## Conventions

Same as Scope A's [pathways migration draft](../pathways/MIGRATION_DRAFT.md) and Scope C's [facilitation migration draft](../facilitation/MIGRATION_DRAFT.md):

- PascalCase models, camelCase fields.
- `String @id @default(cuid())` for ids.
- `createdAt` / `updatedAt` on mutable models; append-only models (`MetaConsensusEvent`) omit `updatedAt`.
- User FKs are loose `String` fields holding the Supabase `auth_id` (matches `Deliberation.createdById`, `PathwayEvent.actorId`, `FacilitationEvent.actorId`). No `@relation` to `User`.
- Non-user FKs use explicit `@relation` with `onDelete: Restrict` for audit-bearing tables; `Cascade` only for child rows whose lifetime is bounded by the parent.
- `@@index([fk, createdAt])` for time-ordered reads; tag-list hot path adds `@@index([deliberationId, targetType, targetId])`.

## Enum additions

```prisma
enum DisagreementAxisKey {
  VALUE
  EMPIRICAL
  FRAMING
  INTEREST
}

enum DisagreementTagTargetType {
  CLAIM
  ARGUMENT
  EDGE
}

enum DisagreementTagAuthorRole {
  PARTICIPANT
  FACILITATOR
  HOST
}

enum DisagreementTagSeedSource {
  MANUAL
  INTERVENTION_SEED
  METRIC_SEED
  REPEATED_ATTACK_SEED
  VALUE_LEXICON_SEED
  IMPORTED
}

enum MetaConsensusSummaryStatus {
  DRAFT
  PUBLISHED
  RETRACTED
}

enum MetaConsensusEventType {
  TAG_PROPOSED
  TAG_CONFIRMED
  TAG_RETRACTED
  CANDIDATE_ENQUEUED
  CANDIDATE_DISMISSED
  SUMMARY_DRAFTED
  SUMMARY_PUBLISHED
  SUMMARY_RETRACTED
  AXIS_VERSION_BUMPED
}

// Additions to existing LogEntryType enum (lib/models/schema.prisma):
//   DISAGREEMENT_TAGGED
//   META_CONSENSUS_PUBLISHED
//   META_CONSENSUS_RETRACTED
```

## Model: DisagreementAxis

Registry table; rarely changes; populated by `prisma/seed/typologyAxes.ts` after migration. `version` is bumped by an explicit migration when `description` or `interventionHint` changes; existing tags retain `axisVersion` pointing at the version they were authored under (decision #1, #4 — version pinning + snapshot policy).

```prisma
model DisagreementAxis {
  id                String              @id @default(cuid())
  key               DisagreementAxisKey @unique
  displayName       String
  description       String              // long-form description shown in tooltip and editor
  colorToken        String              // tailwind/design token, e.g. "amber-500"; consumed by UI
  interventionHint  String              // short text shown to facilitators when tagging this axis
  version           Int                 @default(1)
  isActive          Boolean             @default(true) // ff_typology_axis_<key> mirror at the DB layer
  seededAt          DateTime            @default(now())

  tags        DisagreementTag[]
  candidates  TypologyCandidate[]

  @@index([isActive])
}
```

## Model: DisagreementTag

A tag attaches an axis (with version pin) plus confidence and evidence to a polymorphic target (claim / argument / attack edge). A `DisagreementTag` row exists in CANDIDATE state until `confirmedAt` is set; it transitions to RETRACTED via `retractedAt`. Decision #2 — every persisted tag carries explicit human authorship (the seeder writes `TypologyCandidate` rows, never tags directly).

```prisma
model DisagreementTag {
  id                 String                       @id @default(cuid())
  deliberationId     String
  deliberation       Deliberation                 @relation(fields: [deliberationId], references: [id], onDelete: Restrict)
  sessionId          String?                       // null = deliberation-scoped (decision #3)
  session            FacilitationSession?         @relation(fields: [sessionId], references: [id], onDelete: Restrict)
  targetType         DisagreementTagTargetType
  targetId           String                        // claim/argument/edge id; not FK-enforced because targets cross tables
  axisId             String
  axis               DisagreementAxis             @relation(fields: [axisId], references: [id], onDelete: Restrict)
  axisVersion        Int                           // pinned at proposal time
  confidence         Decimal                       @db.Decimal(4, 3) // 0.000 - 1.000
  evidenceText       String
  evidenceJson       Json?                         // optional structured evidence (e.g. { linkedClaimIds: [...] })
  authoredById       String                        // auth_id; the human who proposed or confirmed
  authoredRole       DisagreementTagAuthorRole
  seedSource         DisagreementTagSeedSource    @default(MANUAL)
  seedReferenceJson  Json?                         // e.g. { facilitationEventId, candidateId }
  promotedFromCandidateId String?                  // back-pointer when seeded via TypologyCandidate
  confirmedAt        DateTime?
  confirmedById      String?
  retractedAt        DateTime?
  retractedById      String?
  retractedReasonText String?

  events  MetaConsensusEvent[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Hot path: list confirmed tags on a target.
  @@index([deliberationId, targetType, targetId])
  @@index([sessionId, axisId])
  @@index([axisId, confirmedAt])
  // Idempotency for upsert by (author, axis, target) — application layer enforces "latest wins"
  @@index([deliberationId, targetType, targetId, axisId, authoredById])
}
```

> **Idempotency**: re-tagging the same `(deliberationId, targetType, targetId, axisId, authoredById)` does not insert a new row. The service layer (`lib/typology/tagService.ts`) updates the existing row's `confidence` / `evidenceText` and emits a `TAG_PROPOSED` event for the audit trail; the prior values remain reconstructible from the event chain. We deliberately do **not** add a database `@@unique` here because retracted tags should remain in place; the service-layer rule is "find latest non-retracted, otherwise insert."

## Model: TypologyCandidate

Transient queue row populated by the Scope C event-bus subscriber (`lib/typology/subscribers/facilitationSeeder.ts`) and per-session rules. Pruned after promote / dismiss or by a TTL job.

```prisma
model TypologyCandidate {
  id                    String                       @id @default(cuid())
  deliberationId        String
  deliberation          Deliberation                 @relation(fields: [deliberationId], references: [id], onDelete: Restrict)
  sessionId             String
  session               FacilitationSession          @relation(fields: [sessionId], references: [id], onDelete: Restrict)
  targetType            DisagreementTagTargetType?   // null when seeder is session-scoped (e.g. CHALLENGE_CONCENTRATION)
  targetId              String?
  suggestedAxisId       String
  suggestedAxis         DisagreementAxis             @relation(fields: [suggestedAxisId], references: [id], onDelete: Restrict)
  suggestedAxisVersion  Int
  seedSource            DisagreementTagSeedSource
  seedReferenceJson     Json                         // includes originating FacilitationEvent.id for idempotency
  rationaleText         String
  priority              Int                          // 1-5
  ruleName              String                       // e.g. "interventionSeeder"
  ruleVersion           Int
  promotedToTagId       String?                      // populated when accepted
  promotedAt            DateTime?
  promotedById          String?
  dismissedAt           DateTime?
  dismissedById         String?
  dismissedReasonText   String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Idempotency on replay: a seeder that re-fires for the same source event MUST find the existing row.
  // Enforced in app layer via `seedReferenceJson.facilitationEventId`; we add a btree-on-jsonb index
  // through raw SQL in the migration (Prisma cannot express JSON path uniqueness).
  @@index([sessionId, dismissedAt, promotedAt])
  @@index([sessionId, suggestedAxisId])
  @@index([targetType, targetId])
}
```

> **Migration note**: alongside the model, ship the partial unique index for seeder idempotency:
> ```sql
> CREATE UNIQUE INDEX typology_candidate_seed_event_unique
>   ON "TypologyCandidate" ((("seedReferenceJson"->>'facilitationEventId')))
>   WHERE "seedReferenceJson" ? 'facilitationEventId';
> ```
> Mirrors the partial-index pattern Scope C uses for `FacilitationSession` (`scripts/apply-facilitation-indexes.sql`). New SQL fragment ships as `scripts/apply-typology-indexes.sql` + `scripts/apply-typology-indexes.ts`.

## Model: MetaConsensusSummary

Session- or deliberation-scoped synthesis (decision #3). Publish freezes `snapshotJson` (decision #4). Edits to a published summary require a new version row pointing at `parentSummaryId`.

```prisma
model MetaConsensusSummary {
  id              String                      @id @default(cuid())
  deliberationId  String
  deliberation    Deliberation                @relation(fields: [deliberationId], references: [id], onDelete: Restrict)
  sessionId       String?                      // null = deliberation-scoped
  session         FacilitationSession?        @relation(fields: [sessionId], references: [id], onDelete: Restrict)
  version         Int                         @default(1)
  status          MetaConsensusSummaryStatus  @default(DRAFT)
  authoredById    String
  publishedAt     DateTime?
  publishedById   String?
  retractedAt     DateTime?
  retractedById   String?
  retractedReasonText String?
  parentSummaryId String?
  parentSummary   MetaConsensusSummary?       @relation("SummaryRevision", fields: [parentSummaryId], references: [id])
  revisions       MetaConsensusSummary[]      @relation("SummaryRevision")
  bodyJson        Json                         // { agreedOn, disagreedOn:[{axisKey, summary, supportingTagIds}], blockers, nextSteps }
  narrativeText   String?                      // optional human prose render
  snapshotJson    Json?                        // populated on publish; null while DRAFT
  snapshotHash    String?                      // sha256 of canonical(snapshotJson) — pinned in MetaConsensusEvent payload

  events  MetaConsensusEvent[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Latest-published lookup per (deliberationId, sessionId).
  @@index([deliberationId, sessionId, status, publishedAt])
  @@index([parentSummaryId])
  @@index([authoredById])
}
```

> **Snapshot cap**: per the §7 risk register, `snapshotJson` is rejected at publish time if its serialized length exceeds 256 KiB. Enforced in `summaryService.publish()`; returns `422 SNAPSHOT_TOO_LARGE` with a `details` array naming the heaviest references.

## Model: MetaConsensusEvent

Append-only, hash-chained per `(deliberationId, sessionId)` (or `(deliberationId, NULL)` for deliberation-level chains). Reuses `lib/pathways/chain.ts` verbatim — no new sha256 plumbing.

```prisma
model MetaConsensusEvent {
  id              String                  @id @default(cuid())
  deliberationId  String
  deliberation    Deliberation            @relation(fields: [deliberationId], references: [id], onDelete: Restrict)
  sessionId       String?
  session         FacilitationSession?    @relation(fields: [sessionId], references: [id], onDelete: Restrict)
  eventType       MetaConsensusEventType
  actorId         String                   // auth_id; "system" for AXIS_VERSION_BUMPED
  actorRole       String                   // "participant" | "facilitator" | "host" | "system"
  payloadJson     Json
  hashChainPrev   String?                  // null at chain genesis (first TAG_PROPOSED in scope)
  hashChainSelf   String                   // sha256 hex; deterministic over (hashChainPrev || canonical_json(payload) || createdAt)

  // Optional cross-references — populated when the event was triggered by a specific row.
  tagId       String?
  tag         DisagreementTag?         @relation(fields: [tagId], references: [id])
  summaryId   String?
  summary     MetaConsensusSummary?    @relation(fields: [summaryId], references: [id])
  candidateId String?                  // not FK'd; candidates may be pruned by TTL while events remain

  createdAt DateTime @default(now())

  // Hash chain uniqueness (parallels FacilitationEvent).
  @@unique([deliberationId, sessionId, hashChainSelf])
  @@index([deliberationId, sessionId, createdAt])
  @@index([deliberationId, sessionId, eventType])
  @@index([tagId])
  @@index([summaryId])
}
```

## Back-references on existing models

The following relations must be added when the migration is merged:

```prisma
// model Deliberation { ... existing fields ...
  disagreementTags        DisagreementTag[]
  typologyCandidates      TypologyCandidate[]
  metaConsensusSummaries  MetaConsensusSummary[]
  metaConsensusEvents     MetaConsensusEvent[]
// }

// model FacilitationSession { ... existing fields ...
  disagreementTags        DisagreementTag[]
  typologyCandidates      TypologyCandidate[]
  metaConsensusSummaries  MetaConsensusSummary[]
  metaConsensusEvents     MetaConsensusEvent[]
// }
```

No back-reference is required from `User` (loose `auth_id` convention).

## Hash-chain anchor policy (per `(deliberationId, sessionId)`)

Same algorithm as Scope A `PathwayEvent` and Scope C `FacilitationEvent`:

- The first event in scope (typically a `TAG_PROPOSED` or a deliberation-level `SUMMARY_DRAFTED`) is the genesis; `hashChainPrev = NULL`.
- Every subsequent event computes `hashChainSelf = sha256(hashChainPrev || canonical_json(payload) || createdAt.toISOString())`.
- `verifyMetaConsensusChain(deliberationId, sessionId | null)` returns `{ valid: boolean, brokenAtEventId?: string }` and is exposed by `lib/pathways/chain.ts` parameterized on table name. No new chain library is introduced.

## Snapshot anchor policy (summary publish)

When `MetaConsensusSummary.publish()` is called:

1. Build `snapshotJson` containing, for each tag referenced in `bodyJson.disagreedOn[*].supportingTagIds`:
   - `{ tagId, axisKey, axisVersion, confidence, evidenceText, targetType, targetId, claimSnapshot?: { id, version, text }, argumentSnapshot?: { id, version, text } }`
2. Compute `snapshotHash = sha256(canonical_json(snapshotJson))`.
3. Persist `snapshotJson`, `snapshotHash`, `publishedAt`, `publishedById`, `status = PUBLISHED`.
4. Emit `MetaConsensusEvent { eventType: SUMMARY_PUBLISHED, summaryId, payloadJson: { snapshotHash, tagCount, byteLength } }`.
5. Mirror to `RoomLogbook { type: META_CONSENSUS_PUBLISHED }`.

A subsequent edit to a referenced claim/argument does **not** mutate the published `snapshotJson`. To surface revised content, the drafter creates a new summary version (`parentSummaryId = previous.id`).

## Cross-anchor with Scope A pathway packets

When a published `MetaConsensusSummary` is referenced by a Scope A `RecommendationPacketItem`:

- The packet snapshot embeds `{ metaConsensusSummaryId, snapshotHash, metaConsensusChainHead }` where `metaConsensusChainHead = hashChainSelf` of the latest `MetaConsensusEvent` in the summary's chain at the moment of packet submission.
- Scope A's existing `pathwayEventService.appendEvent` records the cross-anchor as part of the `PACKET_SUBMITTED` event payload. No Scope A schema change is required.

## Open issues for B0 review

1. **JSONB partial unique on seeder idempotency**: workable in Postgres but needs to be tested against the staging DB collation. **Recommendation**: ship the SQL fragment; if collation conflicts arise, fall back to an application-layer dedupe table keyed on `facilitationEventId`.
2. **`DisagreementTag` polymorphic `targetId`**: not FK-enforced. **Recommendation**: keep as is (parity with `FacilitationIntervention.targetId`); add a `tagService.assertTargetExists()` guard called before persist.
3. **`confidence` precision** as `Decimal(4, 3)` — adequate for a 0.000-1.000 scale at 3dp. Confirm at B0 review.
4. **`MetaConsensusSummary.bodyJson` schema** — should the JSON shape be validated by Zod at the service boundary rather than enforced in Postgres? **Recommendation**: yes — Zod schema in `lib/typology/schemas/summaryBody.ts`, no `CHECK` constraint in DB.
5. **Should retracted summaries' `snapshotJson` be cleared** to save space? **Recommendation**: no — retraction is part of the audit story; `snapshotJson` stays.
6. **Per-axis `isActive` flag vs application-level feature flag** (`ff_typology_axis_<key>`): currently both exist. **Recommendation**: keep both — the DB flag is the durable kill-switch for partner deployments; the env flag is for engineering rollouts.
