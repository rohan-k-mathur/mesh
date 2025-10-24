# Phase 1 Complete: CQ Multi-Layer System Foundation

## ✅ Completed Tasks

### 1. Schema Design & Implementation
- ✅ Added `CQStatusEnum` with 5 states: OPEN, PENDING_REVIEW, PARTIALLY_SATISFIED, SATISFIED, DISPUTED
- ✅ Added `ResponseStatus` enum with 6 states: PENDING, APPROVED, CANONICAL, REJECTED, SUPERSEDED, WITHDRAWN  
- ✅ Added `CQAction` enum with 8 activity types for audit logging
- ✅ Created `CQResponse` table with full response data (grounds, evidence, sources, votes, endorsements)
- ✅ Created `CQEndorsement` table for community validation
- ✅ Created `CQActivityLog` table for complete audit trail
- ✅ Enhanced `CQStatus` with new fields while preserving backward compatibility

### 2. Database Migration
- ✅ Generated SQL migration script (`prisma/migrations/cq_multi_layer_system.sql`)
- ✅ Created all necessary indexes for performance
- ✅ Added foreign key constraints
- ✅ Preserved all existing fields (marked as DEPRECATED with comments)

### 3. Data Migration Tools
- ✅ Created backfill script (`scripts/backfill-cq-responses.ts`)
- ✅ Idempotent design - safe to run multiple times
- ✅ Converts existing `groundsText` → `CQResponse` records
- ✅ Sets canonical responses for satisfied CQs
- ✅ Creates activity log entries for provenance

### 4. TypeScript Types
- ✅ Complete type definitions (`types/cq-responses.ts`)
- ✅ Frontend-friendly interfaces with nested relations
- ✅ Request/response types for future API endpoints
- ✅ Helper functions for status display and permissions
- ✅ Regenerated Prisma client with new schema

### 5. Documentation
- ✅ Comprehensive design document (`docs/CQ_MULTI_LAYER_PERMISSIONS_DESIGN.md`)
- ✅ Migration guide with step-by-step instructions (`docs/CQ_PHASE1_MIGRATION_GUIDE.md`)
- ✅ Rollback plan for safety
- ✅ Usage examples and API preview

## 📊 Schema Overview

```
CQStatus (1)
  ├─> canonicalResponse (0..1) ──→ CQResponse (CANONICAL)
  ├─> responses (0..n) ──────────→ CQResponse (PENDING/APPROVED/REJECTED)
  └─> activities (0..n) ─────────→ CQActivityLog

CQResponse (1)
  ├─> endorsements (0..n) ───────→ CQEndorsement
  └─> activities (0..n) ─────────→ CQActivityLog
```

## 🔑 Key Features

### Multi-Response System
- Multiple community members can propose responses to a CQ
- Each response has its own status: PENDING → APPROVED → CANONICAL
- Author has final say on which response becomes canonical

### Community Validation
- Upvotes/downvotes for crowd-sourced quality signals
- Endorsements with optional comments (weighted by reputation)
- Response history preserved (superseded responses retained)

### Audit Trail
- Every action logged: submissions, approvals, rejections, status changes
- Complete provenance: who did what, when
- Metadata support for additional context

### Backward Compatibility
- All existing fields preserved
- Old queries continue to work
- Gradual migration path (can run old and new systems in parallel)

## 📁 Files Created/Modified

### Created:
```
docs/CQ_MULTI_LAYER_PERMISSIONS_DESIGN.md    - Full design specification
docs/CQ_PHASE1_MIGRATION_GUIDE.md            - Migration instructions
prisma/migrations/cq_multi_layer_system.sql  - Database migration
scripts/backfill-cq-responses.ts             - Data migration script
types/cq-responses.ts                        - TypeScript definitions
```

### Modified:
```
lib/models/schema.prisma                     - Enhanced with new models
lib/argumentation/cqPresets.ts               - Added claim_truth presets
components/claims/CriticalQuestionsV3.tsx    - Fixed attach endpoint
```

## 🎯 Next Steps (Phase 2: API Implementation)

### API Endpoints to Build
1. **POST /api/cqs/responses/submit** - Submit new community response
2. **GET /api/cqs/responses** - List responses with filtering
3. **POST /api/cqs/responses/:id/approve** - Author approval workflow
4. **POST /api/cqs/responses/:id/reject** - Author rejection with reason
5. **POST /api/cqs/responses/:id/vote** - Community voting (up/down)
6. **POST /api/cqs/responses/:id/endorse** - Strong support signal
7. **POST /api/cqs/responses/:id/withdraw** - Contributor removes response
8. **POST /api/cqs/status/canonical** - Set canonical response
9. **GET /api/cqs/activity** - Activity feed for transparency

### Permission System to Implement
- Room-based access control (public/private/moderated)
- Role checks (viewer/participant/author/moderator)
- Reputation gates for quality control
- Rate limiting to prevent spam

### Notification Hooks
- Notify author when response submitted
- Notify contributor when response approved/rejected
- Notify on high-quality community endorsements
- Email digest for pending reviews

## 🧪 Testing Checklist

Before deploying to production:

- [ ] Run migration on staging database
- [ ] Execute backfill script and verify counts
- [ ] Test queries with new schema
- [ ] Verify backward compatibility (old queries still work)
- [ ] Load test with large datasets
- [ ] Check index performance
- [ ] Verify foreign key constraints
- [ ] Test rollback procedure

## 💡 Usage Example

```typescript
import { prisma } from "@/lib/prismaclient";
import { CQStatusEnum, ResponseStatus } from "@/types/cq-responses";

// Query CQ with all responses
const cq = await prisma.cQStatus.findUnique({
  where: { id: cqId },
  include: {
    canonicalResponse: {
      include: {
        endorsements: { include: { user: true } }
      }
    },
    responses: {
      where: { responseStatus: ResponseStatus.PENDING },
      orderBy: { upvotes: "desc" }
    },
    activities: {
      orderBy: { createdAt: "desc" },
      take: 10
    }
  }
});

// Check status
if (cq.statusEnum === CQStatusEnum.SATISFIED) {
  console.log("Canonical answer:", cq.canonicalResponse?.groundsText);
} else if (cq.statusEnum === CQStatusEnum.PENDING_REVIEW) {
  console.log(`${cq.responses.length} responses awaiting review`);
}
```

## 🚀 Migration Commands

```bash
# 1. Generate Prisma client (already done)
npx prisma generate

# 2. Run database migration (when ready)
npx prisma migrate dev --name cq_multi_layer_system

# 3. Backfill existing data (after migration)
npx tsx scripts/backfill-cq-responses.ts

# 4. Verify migration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"CQResponse\""
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"CQActivityLog\""
```

## 📈 Expected Impact

### Performance
- **Faster queries**: Indexed by status, contributor, creation date
- **Efficient pagination**: Response lists ordered by votes/date
- **Audit scalability**: Activity log partitioned by CQ

### User Experience
- **Reduced author burden**: Community helps answer CQs
- **Better quality**: Voting surfaces best responses
- **Transparency**: Full history visible to all
- **Collaboration**: Multiple people can contribute

### Platform Health
- **Increased engagement**: More users participate in CQs
- **Higher quality debates**: Evidence-backed responses
- **Faster resolution**: CQs satisfied sooner with community help
- **Reputation incentives**: Contributors earn points for helpful answers

---

**Phase 1 Status: ✅ COMPLETE**

Ready to proceed with Phase 2: API endpoint implementation!
