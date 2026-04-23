# Pathways — Prisma Migration Draft (DO NOT APPLY)

Status: Draft v0.1 (A0 deliverable, not yet reviewed)
Source roadmap: [docs/DelibDemocracyScopeA_Roadmap.md](../DelibDemocracyScopeA_Roadmap.md)
Target schema file: `lib/models/schema.prisma`
Apply policy: This file is reference-only. Do **not** run `prisma db push` from this draft. After A0 architecture review, the approved blocks will be merged into `lib/models/schema.prisma` and applied via the standard `npx prisma db push` workflow.

## Conventions

- Naming: PascalCase models, camelCase fields, matching existing Mesh schema style.
- IDs: `String @id @default(cuid())`.
- Timestamps: `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt` where mutable.
- Append-only models (`PathwayEvent`) intentionally omit `updatedAt`.
- **User FK convention (Mesh-specific)**: User foreign keys are loose `String` fields holding the Supabase `auth_id` (matching `DecisionReceipt.actorId`, `Deliberation.createdById`, etc.). No `@relation` to `User` model is declared, because `User.id` is `BigInt` and the codebase canonicalizes on `auth_id` for cross-system identity. This avoids relation overhead on a heavily back-referenced model.
- All non-user foreign keys use explicit `@relation` with `onDelete: Restrict` unless otherwise noted (institutional accountability data must not vanish silently).
- Indexes follow the existing repo pattern: `@@index([fk, createdAt])` for time-ordered reads.

## Enum additions

```prisma
enum InstitutionKind {
  legislature
  agency
  sponsor
  internal_governance
  advisory_board
  other
}

enum PacketStatus {
  DRAFT
  SUBMITTED
  RESPONDED
  REVISED
  CLOSED
}

enum PacketItemKind {
  CLAIM
  ARGUMENT
  CITATION
  NOTE
}

enum SubmissionChannel {
  in_platform
  email
  formal_intake
  api
}

enum InstitutionalResponseStatus {
  PENDING
  RECEIVED
  PARTIAL
  COMPLETE
}

enum InstitutionalDisposition {
  ACCEPTED
  REJECTED
  MODIFIED
  DEFERRED
  NO_RESPONSE
}

enum PathwayStatus {
  OPEN
  AWAITING_RESPONSE
  IN_REVISION
  CLOSED
}

enum PathwayEventType {
  DRAFT_OPENED
  ITEM_ADDED
  ITEM_REMOVED
  PACKET_FINALIZED
  SUBMITTED
  ACKNOWLEDGED
  RESPONSE_RECEIVED
  ITEM_DISPOSITIONED
  REVISED
  CLOSED
}

// Additions to existing LogEntryType enum:
//   PATHWAY_OPENED
//   PACKET_SUBMITTED
//   RESPONSE_RECEIVED
//   PATHWAY_REVISED
//   PATHWAY_CLOSED
```

## Model: Institution

Global registry. Per-deliberation enrollment is implicit through `InstitutionalPathway.deliberationId`. Optionally linked to a Mesh deliberation when the institution is itself represented on-platform (locked decision #5).

```prisma
model Institution {
  id                   String           @id @default(cuid())
  slug                 String           @unique
  name                 String
  kind                 InstitutionKind
  jurisdiction         String?
  contactJson          Json?
  verifiedAt           DateTime?
  createdById          String           // auth_id of creator
  linkedDeliberationId String?          @unique
  linkedDeliberation   Deliberation?    @relation("InstitutionLinkedDeliberation", fields: [linkedDeliberationId], references: [id])
  members              InstitutionMember[]
  pathways             InstitutionalPathway[]
  submissions          InstitutionalSubmission[]
  createdAt            DateTime         @default(now())
  updatedAt            DateTime         @updatedAt

  @@index([kind])
  @@index([jurisdiction])
  @@index([createdById])
}
```

## Model: InstitutionMember

Hybrid membership: on-platform (`userId` set) or off-platform (`displayName` only, facilitator-verified).

```prisma
model InstitutionMember {
  id            String      @id @default(cuid())
  institutionId String
  institution   Institution @relation(fields: [institutionId], references: [id], onDelete: Cascade)
  userId        String?     // auth_id; nullable for off-platform members
  displayName   String
  role          String?
  verifiedAt    DateTime?
  verifiedById  String?     // auth_id of verifier (facilitator)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([institutionId, userId])
  @@index([institutionId])
  @@index([userId])
}
```

## Model: InstitutionalPathway

Logical grouping over one or more revision rounds.

```prisma
model InstitutionalPathway {
  id              String        @id @default(cuid())
  deliberationId  String
  deliberation    Deliberation  @relation(fields: [deliberationId], references: [id], onDelete: Restrict)
  institutionId   String
  institution     Institution   @relation(fields: [institutionId], references: [id], onDelete: Restrict)
  subject         String
  currentPacketId String?       @unique
  currentPacket   RecommendationPacket? @relation("PathwayCurrentPacket", fields: [currentPacketId], references: [id])
  status          PathwayStatus @default(OPEN)
  isPublic        Boolean       @default(false)
  openedAt        DateTime      @default(now())
  closedAt        DateTime?
  openedById      String        // auth_id of opener
  packets         RecommendationPacket[] @relation("PathwayPackets")
  events          PathwayEvent[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([deliberationId, status])
  @@index([institutionId, status])
  @@index([openedById])
}
```

## Model: RecommendationPacket

Versioned per pathway. Locked decision #2: revisions create new packet rows with `parentPacketId` link.

```prisma
model RecommendationPacket {
  id             String        @id @default(cuid())
  pathwayId      String
  pathway        InstitutionalPathway @relation("PathwayPackets", fields: [pathwayId], references: [id], onDelete: Restrict)
  parentPacketId String?
  parentPacket   RecommendationPacket? @relation("PacketRevision", fields: [parentPacketId], references: [id])
  revisions      RecommendationPacket[] @relation("PacketRevision")
  version        Int           @default(1)
  title          String
  summary        String?
  status         PacketStatus  @default(DRAFT)
  createdById    String        // auth_id of creator
  submittedAt    DateTime?
  closedAt       DateTime?
  items          RecommendationPacketItem[]
  submissions    InstitutionalSubmission[]
  pathwayCurrent InstitutionalPathway? @relation("PathwayCurrentPacket")
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@unique([pathwayId, version])
  @@index([pathwayId, status])
  @@index([createdById])
}
```

## Model: RecommendationPacketItem

Snapshot fields enforce immutability after submission (section 3.4 of roadmap).

```prisma
model RecommendationPacketItem {
  id           String         @id @default(cuid())
  packetId     String
  packet       RecommendationPacket @relation(fields: [packetId], references: [id], onDelete: Cascade)
  kind         PacketItemKind
  targetType   String
  targetId     String
  orderIndex   Int            @default(0)
  commentary   String?
  snapshotJson Json?
  snapshotHash String?
  responseItems InstitutionalResponseItem[] @relation("ResponseItemPacketItem")
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  @@index([packetId, orderIndex])
  @@index([targetType, targetId])
}
```

## Model: InstitutionalSubmission

```prisma
model InstitutionalSubmission {
  id               String            @id @default(cuid())
  packetId         String
  packet           RecommendationPacket @relation(fields: [packetId], references: [id], onDelete: Restrict)
  institutionId    String
  institution      Institution       @relation(fields: [institutionId], references: [id], onDelete: Restrict)
  submittedById    String            // auth_id of submitter
  submittedAt      DateTime          @default(now())
  acknowledgedAt   DateTime?
  acknowledgedById String?           // auth_id of acknowledger (institutional member or facilitator)
  channel          SubmissionChannel @default(in_platform)
  externalReference String?
  responses        InstitutionalResponse[]
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  @@unique([packetId, institutionId])
  @@index([institutionId, submittedAt])
  @@index([submittedById])
}
```

## Model: InstitutionalResponse

```prisma
model InstitutionalResponse {
  id                  String            @id @default(cuid())
  submissionId        String
  submission          InstitutionalSubmission @relation(fields: [submissionId], references: [id], onDelete: Restrict)
  respondedById       String            // auth_id of response author
  respondedAt         DateTime          @default(now())
  dispositionSummary  String?
  responseStatus      InstitutionalResponseStatus @default(PENDING)
  items               InstitutionalResponseItem[]
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt

  @@index([submissionId, respondedAt])
  @@index([respondedById])
}
```

## Model: InstitutionalResponseItem

Locked decision #4: per-item dispositions are first-class; packet-level rollup is derived.

```prisma
model InstitutionalResponseItem {
  id              String                  @id @default(cuid())
  responseId      String
  response        InstitutionalResponse   @relation(fields: [responseId], references: [id], onDelete: Cascade)
  packetItemId    String?
  packetItem      RecommendationPacketItem? @relation("ResponseItemPacketItem", fields: [packetItemId], references: [id])
  targetType      String
  targetId        String
  disposition     InstitutionalDisposition
  rationaleText   String?
  evidenceCitations Json?
  createdById     String                  // auth_id of creator
  createdAt       DateTime                @default(now())
  updatedAt       DateTime                @updatedAt

  @@index([responseId])
  @@index([targetType, targetId])
  @@index([disposition])
  @@index([createdById])
}
```

## Model: PathwayEvent

Append-only, hash-chained per pathway. No `updatedAt`.

```prisma
model PathwayEvent {
  id             String           @id @default(cuid())
  pathwayId      String
  pathway        InstitutionalPathway @relation(fields: [pathwayId], references: [id], onDelete: Restrict)
  packetId       String?
  submissionId   String?
  responseId     String?
  eventType      PathwayEventType
  actorId        String           // auth_id of acting user
  actorRole      String?
  payloadJson    Json
  hashChainPrev  String?          // null only for the genesis (DRAFT_OPENED) event
  hashChainSelf  String
  createdAt      DateTime         @default(now())

  @@unique([pathwayId, hashChainSelf])
  @@index([pathwayId, createdAt])
  @@index([eventType, createdAt])
  @@index([actorId])
}
```

## Required relation back-references

Only the `Deliberation` model needs back-references for the new strict relations. The `User` model is intentionally **not** modified, consistent with the loose-FK convention used by `DecisionReceipt`, `RoomLogbook`, `Deliberation.createdById`, and similar.

```prisma
// model Deliberation { ... existing fields ...
  pathways            InstitutionalPathway[]
  linkedInstitution   Institution? @relation("InstitutionLinkedDeliberation")
// }
```

User-side queries (e.g., "all pathways opened by user X") run against the indexed `actorId` / `createdById` / `openedById` / `submittedById` / `respondedById` columns directly.

## RoomLogbook enum extension

Add the following values to the existing `LogEntryType` enum in `lib/models/schema.prisma`:

```
PATHWAY_OPENED
PACKET_SUBMITTED
RESPONSE_RECEIVED
PATHWAY_REVISED
PATHWAY_CLOSED
```

No structural change to `RoomLogbook` itself.

## Equivalent raw SQL sketch (for review only)

The Prisma push will generate the canonical SQL. This sketch is illustrative and matches Postgres conventions used elsewhere in Mesh:

```sql
CREATE TYPE "InstitutionKind" AS ENUM ('legislature','agency','sponsor','internal_governance','advisory_board','other');
CREATE TYPE "PacketStatus" AS ENUM ('DRAFT','SUBMITTED','RESPONDED','REVISED','CLOSED');
CREATE TYPE "PacketItemKind" AS ENUM ('CLAIM','ARGUMENT','CITATION','NOTE');
CREATE TYPE "SubmissionChannel" AS ENUM ('in_platform','email','formal_intake','api');
CREATE TYPE "InstitutionalResponseStatus" AS ENUM ('PENDING','RECEIVED','PARTIAL','COMPLETE');
CREATE TYPE "InstitutionalDisposition" AS ENUM ('ACCEPTED','REJECTED','MODIFIED','DEFERRED','NO_RESPONSE');
CREATE TYPE "PathwayStatus" AS ENUM ('OPEN','AWAITING_RESPONSE','IN_REVISION','CLOSED');
CREATE TYPE "PathwayEventType" AS ENUM (
  'DRAFT_OPENED','ITEM_ADDED','ITEM_REMOVED','PACKET_FINALIZED',
  'SUBMITTED','ACKNOWLEDGED','RESPONSE_RECEIVED','ITEM_DISPOSITIONED',
  'REVISED','CLOSED'
);

ALTER TYPE "LogEntryType" ADD VALUE 'PATHWAY_OPENED';
ALTER TYPE "LogEntryType" ADD VALUE 'PACKET_SUBMITTED';
ALTER TYPE "LogEntryType" ADD VALUE 'RESPONSE_RECEIVED';
ALTER TYPE "LogEntryType" ADD VALUE 'PATHWAY_REVISED';
ALTER TYPE "LogEntryType" ADD VALUE 'PATHWAY_CLOSED';

-- (table CREATEs follow Prisma generation; not duplicated here)
```

## Review checklist for A0 sign-off

- [ ] Naming consistent with `lib/models/schema.prisma` style.
- [ ] All onDelete behaviors reviewed (default `Restrict` for accountability data).
- [ ] Hash-chain uniqueness `@@unique([pathwayId, hashChainSelf])` confirmed sufficient.
- [ ] `RoomLogbook` extension does not collide with existing enum values.
- [ ] No back-reference omitted on `User`, `Deliberation`.
- [ ] Snapshot field sizes acceptable for typical payloads (review with infra).
- [ ] Index plan validated against expected query patterns in API contract.
