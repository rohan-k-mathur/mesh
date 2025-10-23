# Non-Canonical Moves Database Schema Extension

**Feature**: Community-sourced dialogue move responses with author approval workflow  
**Date**: October 22, 2025  
**Status**: 🔨 Implementation Ready

---

## Overview

This schema extension enables **non-canonical dialogue moves** — responses to challenges, clarifications, and questions that are submitted by community members (not the original argument author) and require approval before becoming part of the official dialogue protocol.

### Core Concepts

1. **Non-Canonical Move**: A proposed response (WHY answer, clarification, etc.) submitted by someone other than the author
2. **Approval Workflow**: Moves start as "pending", can be approved by author/asker, then optionally executed as canonical
3. **Clarification Requests**: Special non-protocol questions that seek factual details, not formal challenges
4. **Community Participation**: Any user can help defend/clarify arguments, not just authors

---

## Prisma Schema Addition

Add this model to `/lib/models/schema.prisma`:

```prisma
/// Non-canonical dialogue moves submitted by community members
/// These require approval before becoming canonical protocol moves
model NonCanonicalMove {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // ─── Context & Target ───────────────────────────────────────
  deliberationId String
  targetMoveId   String? // The move this responds to (WHY, clarification request, etc.)
  targetType     String  // "argument" | "claim" | "clarification_request"
  targetId       String  // ID of the argument/claim/request

  // ─── Authorship ─────────────────────────────────────────────
  contributorId String // User who submitted this non-canonical move
  authorId      String // Original argument/claim author (for approval)

  // ─── Move Content ───────────────────────────────────────────
  moveType MoveType // What kind of response this is
  content  Json     // Move-specific payload (expression, evidence, etc.)
  
  // Example content structures:
  // - GROUNDS response: { expression: "...", evidence: [...] }
  // - Clarification: { question: "...", answer: "..." }
  // - Challenge response: { challengeId: "...", response: "..." }

  // ─── Approval Workflow ──────────────────────────────────────
  status       NCMStatus @default(PENDING)
  approvedBy   String?   // userId who approved (author or asker)
  approvedAt   DateTime?
  rejectedBy   String?   // userId who rejected
  rejectedAt   DateTime?
  rejectionReason String? @db.Text

  // ─── Canonicalization ───────────────────────────────────────
  canonicalMoveId String? @unique // If approved & executed, links to DialogueMove
  executedAt      DateTime?

  // ─── Metadata ───────────────────────────────────────────────
  metaJson Json @default("{}")
  // Example: { upvotes: 5, views: 120, helpfulMarks: 3 }

  @@index([deliberationId, targetType, targetId])
  @@index([targetMoveId])
  @@index([contributorId])
  @@index([authorId])
  @@index([status, createdAt])
  @@index([deliberationId, status])
  @@map("non_canonical_moves")
}

enum NCMStatus {
  PENDING        // Awaiting approval
  APPROVED       // Approved but not yet canonical
  EXECUTED       // Approved and converted to canonical DialogueMove
  REJECTED       // Rejected by author/asker
  WITHDRAWN      // Withdrawn by contributor
}

enum MoveType {
  GROUNDS_RESPONSE        // Answer to WHY challenge
  CLARIFICATION_ANSWER    // Answer to clarification request
  CHALLENGE_RESPONSE      // Response to a challenge
  EVIDENCE_ADDITION       // Additional evidence for existing move
  PREMISE_DEFENSE         // Defense of undermined premise
  EXCEPTION_REBUTTAL      // Rebuttal to undercut exception
}

/// Clarification requests (non-protocol questions seeking factual details)
model ClarificationRequest {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // ─── Context ────────────────────────────────────────────────
  deliberationId String
  targetType     String // "argument" | "claim"
  targetId       String // What needs clarification

  // ─── Question ───────────────────────────────────────────────
  askerId  String // User asking the question
  question String @db.Text

  // ─── Status ─────────────────────────────────────────────────
  status ClarificationStatus @default(OPEN)
  
  // ─── Responses ──────────────────────────────────────────────
  // Responses stored as NonCanonicalMoves with targetType = "clarification_request"
  // Asker can mark responses as "approved" (helpful)

  @@index([deliberationId, targetType, targetId])
  @@index([askerId])
  @@index([status, createdAt])
  @@map("clarification_requests")
}

enum ClarificationStatus {
  OPEN       // Awaiting answers
  ANSWERED   // Has at least one approved answer
  RESOLVED   // Asker marked as fully resolved
  CLOSED     // No longer accepting answers
}
```

---

## Key Design Decisions

### 1. Approval Authority

| Move Type | Who Approves | Becomes Canonical? |
|-----------|--------------|-------------------|
| GROUNDS_RESPONSE | Argument author | Yes (if approved) |
| CLARIFICATION_ANSWER | Request asker | No (stays as community answer) |
| CHALLENGE_RESPONSE | Argument author | Yes (if approved) |
| EVIDENCE_ADDITION | Argument author | Yes (merged into existing move) |
| PREMISE_DEFENSE | Argument author | Yes (if approved) |

### 2. Status Transitions

```
PENDING ─────→ APPROVED ────→ EXECUTED
   │              │
   │              └──────→ (stays APPROVED if author doesn't want to execute)
   │
   └──────────→ REJECTED
   │
   └──────────→ WITHDRAWN (by contributor)
```

### 3. Content Structure Examples

#### GROUNDS_RESPONSE
```json
{
  "expression": "This is supported by the 2020 study showing...",
  "evidence": [
    { "type": "citation", "claimId": "claim_xyz" },
    { "type": "url", "url": "https://example.com/study.pdf" }
  ],
  "replyToMoveId": "move_abc123" // The WHY move being answered
}
```

#### CLARIFICATION_ANSWER
```json
{
  "answer": "By 'democratic deficit' I mean the gap between...",
  "clarificationRequestId": "clr_xyz789",
  "additionalContext": "See also: EU Treaty Article 10"
}
```

#### CHALLENGE_RESPONSE
```json
{
  "challengeId": "why_generic_123",
  "response": "The empirical evidence from...",
  "addressesCQs": ["E1", "E2"] // CQs this addresses
}
```

---

## Migration Script

Add to `prisma/migrations/`:

```sql
-- Add NonCanonicalMove table
CREATE TABLE "non_canonical_moves" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deliberationId" TEXT NOT NULL,
  "targetMoveId" TEXT,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "contributorId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "moveType" TEXT NOT NULL,
  "content" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "rejectedBy" TEXT,
  "rejectedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "canonicalMoveId" TEXT,
  "executedAt" TIMESTAMP(3),
  "metaJson" JSONB NOT NULL DEFAULT '{}',

  CONSTRAINT "non_canonical_moves_pkey" PRIMARY KEY ("id")
);

-- Add ClarificationRequest table
CREATE TABLE "clarification_requests" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deliberationId" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "askerId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',

  CONSTRAINT "clarification_requests_pkey" PRIMARY KEY ("id")
);

-- Indexes for NonCanonicalMove
CREATE INDEX "non_canonical_moves_deliberationId_targetType_targetId_idx" ON "non_canonical_moves"("deliberationId", "targetType", "targetId");
CREATE INDEX "non_canonical_moves_targetMoveId_idx" ON "non_canonical_moves"("targetMoveId");
CREATE INDEX "non_canonical_moves_contributorId_idx" ON "non_canonical_moves"("contributorId");
CREATE INDEX "non_canonical_moves_authorId_idx" ON "non_canonical_moves"("authorId");
CREATE INDEX "non_canonical_moves_status_createdAt_idx" ON "non_canonical_moves"("status", "createdAt");
CREATE INDEX "non_canonical_moves_deliberationId_status_idx" ON "non_canonical_moves"("deliberationId", "status");
CREATE UNIQUE INDEX "non_canonical_moves_canonicalMoveId_key" ON "non_canonical_moves"("canonicalMoveId");

-- Indexes for ClarificationRequest
CREATE INDEX "clarification_requests_deliberationId_targetType_targetId_idx" ON "clarification_requests"("deliberationId", "targetType", "targetId");
CREATE INDEX "clarification_requests_askerId_idx" ON "clarification_requests"("askerId");
CREATE INDEX "clarification_requests_status_createdAt_idx" ON "clarification_requests"("status", "createdAt");

-- Add enums
CREATE TYPE "NCMStatus" AS ENUM ('PENDING', 'APPROVED', 'EXECUTED', 'REJECTED', 'WITHDRAWN');
CREATE TYPE "MoveType" AS ENUM ('GROUNDS_RESPONSE', 'CLARIFICATION_ANSWER', 'CHALLENGE_RESPONSE', 'EVIDENCE_ADDITION', 'PREMISE_DEFENSE', 'EXCEPTION_REBUTTAL');
CREATE TYPE "ClarificationStatus" AS ENUM ('OPEN', 'ANSWERED', 'RESOLVED', 'CLOSED');

-- Convert text columns to enums (run after enum creation)
ALTER TABLE "non_canonical_moves" ALTER COLUMN "status" TYPE "NCMStatus" USING "status"::"NCMStatus";
ALTER TABLE "non_canonical_moves" ALTER COLUMN "moveType" TYPE "MoveType" USING "moveType"::"MoveType";
ALTER TABLE "clarification_requests" ALTER COLUMN "status" TYPE "ClarificationStatus" USING "status"::"ClarificationStatus";
```

---

## Query Examples

### Get pending responses for an argument author
```typescript
const pendingResponses = await prisma.nonCanonicalMove.findMany({
  where: {
    authorId: currentUserId,
    status: "PENDING",
    targetType: "argument"
  },
  include: {
    // Would need to add relations in schema for these
    // contributor: true,
    // targetMove: true
  },
  orderBy: { createdAt: "desc" }
});
```

### Get all clarification requests for an argument
```typescript
const clarifications = await prisma.clarificationRequest.findMany({
  where: {
    targetType: "argument",
    targetId: argumentId,
    status: { in: ["OPEN", "ANSWERED"] }
  },
  orderBy: { createdAt: "asc" }
});

// Get approved answers for each request
const answers = await prisma.nonCanonicalMove.findMany({
  where: {
    targetType: "clarification_request",
    targetId: { in: clarifications.map(c => c.id) },
    status: { in: ["APPROVED", "EXECUTED"] }
  }
});
```

### Approve and execute a response
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Update non-canonical move
  const ncm = await tx.nonCanonicalMove.update({
    where: { id: ncmId },
    data: {
      status: "APPROVED",
      approvedBy: currentUserId,
      approvedAt: new Date()
    }
  });

  // 2. Create canonical DialogueMove (if appropriate)
  if (ncm.moveType === "GROUNDS_RESPONSE") {
    const canonicalMove = await tx.dialogueMove.create({
      data: {
        deliberationId: ncm.deliberationId,
        targetType: ncm.targetType,
        targetId: ncm.targetId,
        kind: "GROUNDS",
        payload: ncm.content,
        actorId: ncm.authorId, // Author "owns" the canonical move
        signature: generateSignature(...)
      }
    });

    // 3. Link back to non-canonical origin
    await tx.nonCanonicalMove.update({
      where: { id: ncmId },
      data: {
        status: "EXECUTED",
        canonicalMoveId: canonicalMove.id,
        executedAt: new Date()
      }
    });
  }
});
```

---

## Relations to Add (Optional)

If you want type-safe joins, add these to the Prisma schema:

```prisma
model NonCanonicalMove {
  // ... existing fields ...
  
  // Relations
  contributor      User         @relation("NCMContributor", fields: [contributorId], references: [auth_id])
  author           User         @relation("NCMAuthor", fields: [authorId], references: [auth_id])
  approver         User?        @relation("NCMApprover", fields: [approvedBy], references: [auth_id])
  rejecter         User?        @relation("NCMRejecter", fields: [rejectedBy], references: [auth_id])
  targetMove       DialogueMove? @relation(fields: [targetMoveId], references: [id])
  canonicalMove    DialogueMove? @relation("NCMCanonical", fields: [canonicalMoveId], references: [id])
  deliberation     Deliberation  @relation(fields: [deliberationId], references: [id])
}

model ClarificationRequest {
  // ... existing fields ...
  
  // Relations
  asker         User         @relation("ClarificationAsker", fields: [askerId], references: [auth_id])
  deliberation  Deliberation @relation(fields: [deliberationId], references: [id])
}

// Then add back-relations to User model:
model User {
  // ... existing fields ...
  
  nonCanonicalMovesContributed NonCanonicalMove[] @relation("NCMContributor")
  nonCanonicalMovesAuthored    NonCanonicalMove[] @relation("NCMAuthor")
  nonCanonicalMovesApproved    NonCanonicalMove[] @relation("NCMApprover")
  nonCanonicalMovesRejected    NonCanonicalMove[] @relation("NCMRejecter")
  clarificationRequests        ClarificationRequest[] @relation("ClarificationAsker")
}

// And to Deliberation:
model Deliberation {
  // ... existing fields ...
  
  nonCanonicalMoves    NonCanonicalMove[]
  clarificationRequests ClarificationRequest[]
}

// And to DialogueMove:
model DialogueMove {
  // ... existing fields ...
  
  nonCanonicalResponses NonCanonicalMove[]
  canonicalSource       NonCanonicalMove? @relation("NCMCanonical")
}
```

---

## Next Steps

1. ✅ Add models to `schema.prisma`
2. Run `npx prisma migrate dev --name add_non_canonical_moves`
3. Run `npx prisma generate`
4. Create API routes (see `NON_CANONICAL_MOVES_SPEC.md`)
5. Build UI components (see `NON_CANONICAL_MOVES_UI.md`)

---

**References**:
- Current dialogue schema: `lib/models/schema.prisma` lines 3307-3343
- DialogueMove model structure
- ConflictApplication model (lines 2353-2380)
- Existing approval patterns: ArgumentApproval model
