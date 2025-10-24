# CQ Multi-Layer System: Phase 1 Migration Guide

## Overview

Phase 1 introduces a **community-driven, multi-layer response system** for Critical Questions (CQs), transforming them from single-author binary states into collaborative inquiry spaces.

## What's New

### Schema Changes

1. **New Enums:**
   - `CQStatusEnum`: OPEN → PENDING_REVIEW → PARTIALLY_SATISFIED → SATISFIED / DISPUTED
   - `ResponseStatus`: PENDING → APPROVED → CANONICAL / REJECTED / SUPERSEDED / WITHDRAWN
   - `CQAction`: Activity log action types

2. **New Tables:**
   - `CQResponse`: Individual community responses to CQs
   - `CQEndorsement`: Community validation of responses
   - `CQActivityLog`: Audit trail of all CQ actions

3. **Enhanced CQStatus:**
   - `statusEnum`: New status progression (replaces boolean `satisfied`)
   - `canonicalResponseId`: Link to the official answer
   - `responses`: Relation to all responses
   - `lastReviewedAt/By`: Tracking of review activity

### Backward Compatibility

✅ **All existing fields preserved:**
- `status` (string) - marked as DEPRECATED
- `satisfied` (boolean) - marked as DEPRECATED  
- `groundsText` (string) - marked as DEPRECATED

✅ **No breaking changes to existing queries**

⚠️ **Recommended:** Update code to use new fields, but old fields will continue to work

## Migration Steps

### 1. Database Migration

Run the SQL migration to create new tables:

```bash
# Option A: Using Prisma Migrate (recommended)
npx prisma migrate dev --name cq_multi_layer_system

# Option B: Manual execution
psql $DATABASE_URL < prisma/migrations/cq_multi_layer_system.sql
```

### 2. Generate Prisma Client

Regenerate the Prisma client with new types:

```bash
npx prisma generate
```

### 3. Backfill Existing Data

Migrate existing `groundsText` values to `CQResponse` records:

```bash
npx tsx scripts/backfill-cq-responses.ts
```

**What this does:**
- Finds all CQStatus records with `groundsText`
- Creates a `CQResponse` for each with `status=CANONICAL`
- Updates `CQStatus.canonicalResponseId` to point to the new response
- Sets `CQStatus.statusEnum` based on `satisfied` flag
- Creates activity log entries for audit trail
- **Idempotent:** Safe to run multiple times

### 4. Verify Migration

Check the migration was successful:

```sql
-- Count migrated responses
SELECT COUNT(*) FROM "CQResponse" WHERE "responseStatus" = 'CANONICAL';

-- Check canonical links
SELECT COUNT(*) FROM "CQStatus" WHERE "canonicalResponseId" IS NOT NULL;

-- View activity log
SELECT * FROM "CQActivityLog" WHERE "action" = 'CANONICAL_SELECTED' LIMIT 10;
```

## New API Endpoints (Phase 2)

These will be implemented in the next phase:

```
POST   /api/cqs/responses/submit        - Submit a new response
GET    /api/cqs/responses                - List responses for a CQ
POST   /api/cqs/responses/:id/approve    - Approve a response (author only)
POST   /api/cqs/responses/:id/reject     - Reject a response (author only)
POST   /api/cqs/responses/:id/vote       - Upvote/downvote a response
POST   /api/cqs/responses/:id/endorse    - Endorse a response
POST   /api/cqs/responses/:id/withdraw   - Withdraw own response
POST   /api/cqs/status/canonical         - Set canonical response
GET    /api/cqs/activity                 - Get activity log
```

## TypeScript Types

New types are available in `/types/cq-responses.ts`:

```typescript
import { 
  CQStatusEnum, 
  ResponseStatus, 
  CQResponseWithDetails,
  CQStatusWithResponses 
} from "@/types/cq-responses";

// Example: Check CQ status
if (cqStatus.statusEnum === CQStatusEnum.SATISFIED) {
  console.log("CQ is satisfied with canonical response:", cqStatus.canonicalResponse);
}
```

## Usage Examples

### Querying CQs with Responses

```typescript
const cqStatus = await prisma.cQStatus.findUnique({
  where: { id: cqStatusId },
  include: {
    canonicalResponse: {
      include: {
        endorsements: {
          include: {
            user: {
              select: { id: true, name: true, image: true }
            }
          }
        }
      }
    },
    responses: {
      where: { responseStatus: { in: ["PENDING", "APPROVED"] } },
      include: {
        endorsements: true
      },
      orderBy: { upvotes: "desc" }
    },
    activities: {
      orderBy: { createdAt: "desc" },
      take: 10
    }
  }
});
```

### Creating a New Response

```typescript
const response = await prisma.cQResponse.create({
  data: {
    cqStatusId: cqStatus.id,
    groundsText: "Multiple peer-reviewed studies show...",
    evidenceClaimIds: [claimA.id, claimB.id],
    sourceUrls: ["https://example.com/study1"],
    responseStatus: "PENDING",
    contributorId: userId,
  }
});

// Update CQ status to show pending review
await prisma.cQStatus.update({
  where: { id: cqStatus.id },
  data: { statusEnum: "PENDING_REVIEW" }
});

// Log the activity
await prisma.cQActivityLog.create({
  data: {
    cqStatusId: cqStatus.id,
    action: "RESPONSE_SUBMITTED",
    actorId: userId,
    responseId: response.id
  }
});
```

### Approving and Setting Canonical

```typescript
// Author approves a response
await prisma.cQResponse.update({
  where: { id: responseId },
  data: {
    responseStatus: "APPROVED",
    reviewedAt: new Date(),
    reviewedBy: authorId,
    reviewNotes: "Well-cited and comprehensive"
  }
});

// Set as canonical
await prisma.cQStatus.update({
  where: { id: cqStatusId },
  data: {
    canonicalResponseId: responseId,
    statusEnum: "SATISFIED",
    lastReviewedAt: new Date(),
    lastReviewedBy: authorId
  }
});

// Update response status to CANONICAL
await prisma.cQResponse.update({
  where: { id: responseId },
  data: { responseStatus: "CANONICAL" }
});
```

## Rollback Plan

If you need to rollback the migration:

```sql
-- Drop new tables
DROP TABLE IF EXISTS "CQActivityLog" CASCADE;
DROP TABLE IF EXISTS "CQEndorsement" CASCADE;
DROP TABLE IF EXISTS "CQResponse" CASCADE;

-- Remove new columns from CQStatus
ALTER TABLE "CQStatus" DROP COLUMN IF EXISTS "statusEnum";
ALTER TABLE "CQStatus" DROP COLUMN IF EXISTS "canonicalResponseId";
ALTER TABLE "CQStatus" DROP COLUMN IF EXISTS "lastReviewedAt";
ALTER TABLE "CQStatus" DROP COLUMN IF EXISTS "lastReviewedBy";

-- Drop new enums
DROP TYPE IF EXISTS "CQAction";
DROP TYPE IF EXISTS "ResponseStatus";
DROP TYPE IF EXISTS "CQStatusEnum";
```

Then regenerate Prisma client:

```bash
npx prisma generate
```

## Next Steps

After Phase 1 is complete:

1. **Phase 2:** Implement API endpoints for response submission and approval
2. **Phase 3:** Build UI components (CQResponseForm, CQResponsesList, etc.)
3. **Phase 4:** Wire up notifications and events
4. **Phase 5:** Integrate reputation system

## Questions?

Refer to `/docs/CQ_MULTI_LAYER_PERMISSIONS_DESIGN.md` for the full design spec.
