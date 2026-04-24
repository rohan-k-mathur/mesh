# Facilitation — Prisma Migration Draft (DO NOT APPLY)

Status: Draft v0.1 (C0 deliverable, not yet reviewed)
Source roadmap: [docs/DelibDemocracyScopeC_Roadmap.md](../DelibDemocracyScopeC_Roadmap.md)
Target schema file: `lib/models/schema.prisma`
Apply policy: This file is reference-only. Do **not** run `prisma db push` from this draft. After C0 architecture review, the approved blocks will be merged into `lib/models/schema.prisma` and applied via the standard `npx prisma db push` workflow.

## Conventions

Same as Scope A's [pathways migration draft](../pathways/MIGRATION_DRAFT.md):

- PascalCase models, camelCase fields.
- `String @id @default(cuid())` for ids.
- `createdAt` / `updatedAt` on mutable models; append-only models (`FacilitationEvent`, `EquityMetricSnapshot`) omit `updatedAt`.
- User FKs are loose `String` fields holding the Supabase `auth_id` (matches `Deliberation.createdById`, `PathwayEvent.actorId`, etc.). No `@relation` to `User`.
- Non-user FKs use explicit `@relation` with `onDelete: Restrict` for audit-bearing tables; `Cascade` only for child rows whose lifetime is bounded by the parent (e.g. `FacilitationQuestionCheck` to `FacilitationQuestion`).
- `@@index([fk, createdAt])` for time-ordered reads; rules-engine hot path adds `@@index([sessionId, metricKind, windowEnd])`.

## Enum additions

```prisma
enum FacilitationSessionStatus {
  OPEN
  HANDED_OFF
  CLOSED
}

enum FacilitationFramingType {
  open
  choice
  evaluative
  generative
}

enum FacilitationCheckKind {
  CLARITY
  LEADING
  BALANCE
  SCOPE
  BIAS
  READABILITY
}

enum FacilitationCheckSeverity {
  INFO
  WARN
  BLOCK
}

enum FacilitationEventType {
  SESSION_OPENED
  METRIC_THRESHOLD_CROSSED
  INTERVENTION_RECOMMENDED
  INTERVENTION_APPLIED
  INTERVENTION_DISMISSED
  MANUAL_NUDGE
  QUESTION_REOPENED
  TIMEBOX_ADJUSTED
  HANDOFF_INITIATED
  HANDOFF_ACCEPTED
  SESSION_CLOSED
}

enum FacilitationInterventionKind {
  ELICIT_UNHEARD
  REBALANCE_CHALLENGE
  PROMPT_EVIDENCE
  REFRAME_QUESTION
  INVITE_RESPONSE
  COOLDOWN
  OTHER
}

enum FacilitationInterventionTargetType {
  CLAIM
  ARGUMENT
  USER
  ROOM
}

enum FacilitationDismissalTag {
  not_relevant
  already_addressed
  wrong_target
  other
}

enum EquityMetricKind {
  PARTICIPATION_GINI
  CHALLENGE_CONCENTRATION
  RESPONSE_LATENCY_P50
  ATTENTION_DEFICIT
  FACILITATOR_LOAD
}

enum FacilitationHandoffStatus {
  PENDING
  ACCEPTED
  DECLINED
  CANCELED
}

// Additions to existing LogEntryType enum:
//   FACILITATION_OPENED
//   FACILITATION_INTERVENTION
//   FACILITATION_HANDOFF
//   FACILITATION_CLOSED
```

## Model: FacilitationSession

Locked decision #1: exactly one OPEN session per deliberation. Enforced by the partial unique index below.

```prisma
model FacilitationSession {
  id             String                    @id @default(cuid())
  deliberationId String
  deliberation   Deliberation              @relation(fields: [deliberationId], references: [id], onDelete: Restrict)
  openedById     String                    // auth_id of opener
  openedAt       DateTime                  @default(now())
  closedAt       DateTime?
  closedById     String?                   // auth_id of closer
  status         FacilitationSessionStatus @default(OPEN)
  isPublic       Boolean                   @default(false) // locked decision #5: opt-in per deliberation
  summary        String?

  events             FacilitationEvent[]
  interventions      FacilitationIntervention[]
  metricSnapshots    EquityMetricSnapshot[]
  handoffsFrom       FacilitationHandoff[] @relation("HandoffFrom")
  handoffsTo         FacilitationHandoff[] @relation("HandoffTo")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Enforce "single OPEN session per deliberation" at the DB layer.
  // Prisma supports this with a raw partial index migration; declared here for documentation:
  //   CREATE UNIQUE INDEX facilitation_session_open_unique
  //     ON "FacilitationSession" ("deliberationId") WHERE status = 'OPEN';
  @@index([deliberationId, status])
  @@index([openedById])
}
```

> **Migration note**: Prisma's `@@unique` cannot express `WHERE status = 'OPEN'`; the partial index ships as a raw SQL fragment in the migration alongside the model.

## Model: FacilitationQuestion

Versioned per deliberation; revisions create new rows with `parentQuestionId`.

```prisma
model FacilitationQuestion {
  id                 String                  @id @default(cuid())
  deliberationId     String
  deliberation       Deliberation            @relation(fields: [deliberationId], references: [id], onDelete: Restrict)
  version            Int                     @default(1)
  text               String
  framingType        FacilitationFramingType
  qualityReportJson  Json?                   // snapshot of the most recent assistant run
  lockedAt           DateTime?
  lockedById         String?                 // auth_id of locker
  authoredById       String                  // auth_id of author
  parentQuestionId   String?
  parentQuestion     FacilitationQuestion?   @relation("QuestionRevision", fields: [parentQuestionId], references: [id])
  revisions          FacilitationQuestion[]  @relation("QuestionRevision")
  checks             FacilitationQuestionCheck[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([deliberationId, version])
  @@index([deliberationId, lockedAt])
  @@index([authoredById])
}
```

## Model: FacilitationQuestionCheck

Append-only per assistant run. Severity drives lock behaviour (decision #2).

```prisma
model FacilitationQuestionCheck {
  id           String                     @id @default(cuid())
  questionId   String
  question     FacilitationQuestion       @relation(fields: [questionId], references: [id], onDelete: Cascade)
  runId        String                     // groups checks from the same assistant invocation
  kind         FacilitationCheckKind
  severity     FacilitationCheckSeverity
  messageText  String
  evidenceJson Json?
  acknowledgedAt   DateTime?              // populated when a WARN is acknowledged at lock time
  acknowledgedById String?                // auth_id

  createdAt DateTime @default(now())

  @@index([questionId, runId])
  @@index([questionId, severity])
}
```

## Model: FacilitationEvent

Append-only, hash-chained per session. Reuses Scope A's `lib/pathways/chain.ts` algorithm verbatim.

```prisma
model FacilitationEvent {
  id            String                @id @default(cuid())
  sessionId     String
  session       FacilitationSession   @relation(fields: [sessionId], references: [id], onDelete: Restrict)
  eventType     FacilitationEventType
  actorId       String                // auth_id; for SYSTEM-emitted events use literal "system"
  actorRole     String                // "facilitator" | "host" | "system"
  payloadJson   Json
  hashChainPrev String?               // sha256 hex of the previous event in this session, or null for SESSION_OPENED genesis
  hashChainSelf String                // sha256 hex; deterministic over (hashChainPrev || canonical_json(payload) || createdAt)

  // Optional cross-references — populated when the event was triggered by a specific row.
  interventionId String?
  intervention   FacilitationIntervention? @relation(fields: [interventionId], references: [id])
  metricSnapshotId String?
  metricSnapshot   EquityMetricSnapshot? @relation(fields: [metricSnapshotId], references: [id])

  createdAt DateTime @default(now())

  @@index([sessionId, createdAt])
  @@index([sessionId, eventType])
  @@index([interventionId])
  @@index([metricSnapshotId])
}
```

## Model: FacilitationIntervention

Recommended → applied | dismissed. `triggeredByMetricSnapshotId` pins the snapshot the rule fired against (decision #3 nuance).

```prisma
model FacilitationIntervention {
  id                       String                              @id @default(cuid())
  sessionId                String
  session                  FacilitationSession                 @relation(fields: [sessionId], references: [id], onDelete: Restrict)
  kind                     FacilitationInterventionKind
  targetType               FacilitationInterventionTargetType
  targetId                 String
  recommendedAt            DateTime                            @default(now())
  appliedAt                DateTime?
  appliedById              String?                             // auth_id
  dismissedAt              DateTime?
  dismissedById            String?                             // auth_id
  dismissedReasonText      String?                             // free-text (required on dismiss; see decision #4)
  dismissedReasonTag       FacilitationDismissalTag?
  rationaleJson            Json
  priority                 Int                                 // 1-5
  ruleName                 String                              // e.g. "unheardSpeakerRule"
  ruleVersion              Int                                 // pinned at recommendation time
  triggeredByMetric        EquityMetricKind?
  triggeredByMetricSnapshotId String?                          // foreign-key pin (decision #3 retention)
  triggeredByMetricSnapshot   EquityMetricSnapshot?            @relation(fields: [triggeredByMetricSnapshotId], references: [id])

  events                   FacilitationEvent[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([sessionId, recommendedAt])
  @@index([sessionId, kind])
  @@index([targetType, targetId])
  @@index([triggeredByMetricSnapshotId])
}
```

## Model: EquityMetricSnapshot

First-class snapshots, pinned `metricVersion`, `isFinal` flag for the official end-of-session value (decision #3).

```prisma
model EquityMetricSnapshot {
  id             String              @id @default(cuid())
  deliberationId String
  deliberation   Deliberation        @relation(fields: [deliberationId], references: [id], onDelete: Restrict)
  sessionId      String?
  session        FacilitationSession? @relation(fields: [sessionId], references: [id], onDelete: Restrict)
  windowStart    DateTime
  windowEnd      DateTime
  metricKind     EquityMetricKind
  metricVersion  Int                 // pinned to the calculator version that produced the row
  value          Decimal             @db.Decimal(12, 6)
  breakdownJson  Json
  isFinal        Boolean             @default(false) // true exactly once per (sessionId, metricKind) after SESSION_CLOSED

  // Back-references that pin a snapshot for indefinite retention.
  triggeredInterventions FacilitationIntervention[]
  events                 FacilitationEvent[]

  createdAt DateTime @default(now())

  // Hot path for the rules engine: latest snapshot per session+metric.
  @@index([sessionId, metricKind, windowEnd])
  @@index([deliberationId, metricKind, windowEnd])
  // For TTL/downsample worker scans:
  @@index([sessionId, isFinal])
}
```

> **Retention policy** (decision #3, locked):
> - Intra-session retention is verbose (worker cadence ~60s).
> - 30 days after `SESSION_CLOSED`, intra-session snapshots are downsampled to one row per `metricKind` per ~5-minute bucket. Downsampling is performed by a periodic job that **never deletes**:
>   - rows where `isFinal = true`, or
>   - rows referenced by any `FacilitationIntervention.triggeredByMetricSnapshotId` or `FacilitationEvent.metricSnapshotId`.

## Model: FacilitationHandoff

Atomic transfer of an OPEN session to a new facilitator (decision #1).

```prisma
model FacilitationHandoff {
  id                       String                      @id @default(cuid())
  fromSessionId            String
  fromSession              FacilitationSession         @relation("HandoffFrom", fields: [fromSessionId], references: [id], onDelete: Restrict)
  toSessionId              String?                     // populated when the receiving session is created on accept
  toSession                FacilitationSession?        @relation("HandoffTo", fields: [toSessionId], references: [id], onDelete: Restrict)
  toUserId                 String                      // auth_id of intended receiver
  initiatedById            String                      // auth_id of initiator
  initiatedAt              DateTime                    @default(now())
  acceptedAt               DateTime?
  declinedAt               DateTime?
  canceledAt               DateTime?
  status                   FacilitationHandoffStatus   @default(PENDING)
  notesText                String?
  outstandingInterventionIds Json                      // string[] snapshotted at initiation

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([fromSessionId])
  @@index([toUserId, status])
}
```

## Back-references on existing models

The following relations must be added to existing models when the migration is merged:

```prisma
// model Deliberation { ... existing fields ...
  facilitationSessions  FacilitationSession[]
  facilitationQuestions FacilitationQuestion[]
  equityMetricSnapshots EquityMetricSnapshot[]
// }
```

No back-reference is required from `User` (loose `auth_id` convention).

## Hash-chain anchor policy (per session)

Same as Scope A pathways:

- `SESSION_OPENED` is the genesis event; `hashChainPrev = NULL`.
- Every subsequent event computes `hashChainSelf = sha256(hashChainPrev || canonical_json(payload) || createdAt.toISOString())`.
- `verifyFacilitationChain(sessionId)` returns `{ valid: boolean, brokenAtEventId?: string }` and is exposed by the same `lib/pathways/chain.ts` helper used for `PathwayEvent`. The function is parameterized on table name; no new sha256 plumbing is introduced.

## Single-OPEN-session enforcement

Application-layer checks (`sessionService.openSession`) plus the partial unique index above. The two layers are redundant on purpose:

- App layer returns a clean `409 CONFLICT_SESSION_ALREADY_OPEN` to the client.
- DB layer is the safety net for races (two facilitators clicking "Open" in the same second).

`handoff` performs the close + open in a single transaction; the partial unique index is never violated because the prior row's `status` flips out of `OPEN` before the new row is inserted.

## Open issues for C0 review

1. Should `FacilitationQuestion` move to `Deliberation` as a 1:1 reference (replacing the current free-text `question` field), or stay as a parallel versioned table that the deliberation reads from? **Recommendation**: parallel table; do not mutate `Deliberation.question` to preserve existing read paths.
2. `EquityMetricSnapshot.value` as `Decimal(12, 6)` — adequate for Gini (0-1, 6dp) and latency (seconds, 6dp); confirm at C0 review.
3. `FacilitationDismissalTag` enum vs free `String` — recommend enum so the analytics aggregation in C4 can group reliably; revisit if partners want a "custom tag" affordance.
4. Do we want a `FacilitationManualNudge` row to capture the *content* of a manual nudge separately from the `MANUAL_NUDGE` event, or is `payloadJson` sufficient? **Recommendation**: `payloadJson` for v1; promote to a row only if the report needs to surface nudge content prominently.
