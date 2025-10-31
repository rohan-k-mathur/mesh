# Phase 1 Implementation Summary - Schema & Migration

**Date:** October 30, 2025  
**Status:** ✅ COMPLETE  
**Time:** ~30 minutes

---

## ✅ Completed Tasks

### 1. Schema Updates

**File:** `lib/models/schema.prisma`

Added `DerivationAssumption` model after `AssumptionStatus` enum:

```prisma
model DerivationAssumption {
  id           String   @id @default(cuid())
  derivationId String   // FK to ArgumentSupport.id
  assumptionId String   // FK to AssumptionUse.id
  weight       Float    @default(1.0)  // 0..1 multiplier
  inferredFrom String?  // Parent derivation for transitive tracking
  createdAt    DateTime @default(now())
  
  @@unique([derivationId, assumptionId])
  @@index([derivationId])
  @@index([assumptionId])
  @@index([inferredFrom])
}
```

**Key Design:**
- Junction table for many-to-many relationship
- `weight` field for assumption strength (default 1.0 = fully required)
- `inferredFrom` for transitive assumption tracking via compose()
- 4 indexes for fast queries (unique constraint + 3 lookup indexes)

---

### 2. Migration Generated

**File:** `lib/models/migrations/20251030225443_add_derivation_assumption_tracking/migration.sql`

```sql
CREATE TABLE "DerivationAssumption" (
    "id" TEXT NOT NULL,
    "derivationId" TEXT NOT NULL,
    "assumptionId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "inferredFrom" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DerivationAssumption_pkey" PRIMARY KEY ("id")
);

-- 4 indexes created for performance
```

**Applied with:** `npm run db:push`

---

### 3. Backfill Script Created

**File:** `scripts/backfill-derivation-assumptions.ts`

**Purpose:** Migrate existing AssumptionUse data to new structure

**Algorithm:**
1. Find all ACCEPTED AssumptionUse records
2. For each assumption, find all ArgumentSupport (derivations) of its argument
3. Create DerivationAssumption link for each (derivation, assumption) pair
4. Skip existing links (idempotent)

**Features:**
- Progress tracking (every 10 assumptions)
- Error handling with detailed logging
- Verification statistics at end
- Idempotent (safe to run multiple times)

**Test Run Results:**
```
📊 Found 11 total assumptions
   └─ 0 ACCEPTED assumptions

✅ Backfill Complete!
   • Assumptions processed: 0
   • Links created: 0
   • Links skipped: 0
   • Errors: 0
```

---

## 🔍 Verification

### Database Table Created

```bash
$ node -e "const { PrismaClient } = require('@prisma/client'); ..."
✅ Table exists! Count: 0n
```

### Prisma Client Regenerated

```bash
$ npx prisma generate
✔ Generated Prisma Client (v6.14.0) to ./node_modules/@prisma/client
```

New types available:
- `DerivationAssumption` model
- `DerivationAssumptionWhereInput`
- `DerivationAssumptionCreateInput`
- `DerivationAssumptionUpdateInput`
- etc.

---

## 📊 Schema Statistics

**Before:**
- Models: 94
- Tables related to assumptions: 1 (AssumptionUse)

**After:**
- Models: 95
- Tables related to assumptions: 2 (AssumptionUse + DerivationAssumption)
- New indexes: 4

**Storage Impact:**
- Estimated ~100 bytes per DerivationAssumption record
- For 1000 deliberations with 400 links each = ~40 MB

---

## 🐛 Issues Resolved

### Issue 1: Shadow Database Migration Error

**Problem:** Existing migration file had syntax error (`SQL` at end of file)

**File:** `lib/models/migrations/20240806000000_group_chat_attachments/migration.sql`

**Fix:** Removed stray `SQL` text at end of file

### Issue 2: TypeScript Errors in Backfill Script

**Problem:** VS Code showing errors for `prisma.derivationAssumption` (client not regenerated)

**Resolution:** 
- Ran `npm run db:push` to apply schema and regenerate client
- Script executes successfully despite IDE errors (TypeScript server cache issue)
- Types exist in `node_modules/.prisma/client/index.d.ts`

---

## 🧪 Testing

### Manual Testing

**Script execution:**
```bash
$ npx tsx scripts/backfill-derivation-assumptions.ts
✅ Success - 0 ACCEPTED assumptions processed (expected)
```

**Database query:**
```bash
$ node -e "..." 
✅ Table exists and is queryable
```

### Next Testing Steps (Phase 2)

After implementing categorical operations:
1. Create test assumptions with ACCEPTED status
2. Run backfill script
3. Verify DerivationAssumption links created
4. Test compose() with assumption propagation

---

## 📁 Files Changed

### Modified (2 files)

1. **lib/models/schema.prisma** (+20 lines)
   - Added `DerivationAssumption` model

2. **lib/models/migrations/20240806000000_group_chat_attachments/migration.sql** (-1 line)
   - Fixed syntax error (removed stray `SQL`)

### Created (2 files)

3. **lib/models/migrations/20251030225443_add_derivation_assumption_tracking/migration.sql** (new)
   - SQL migration for table creation

4. **scripts/backfill-derivation-assumptions.ts** (new, 160 lines)
   - Idempotent backfill script with progress tracking

---

## 🎯 Phase 1 Checklist

- [x] Add `DerivationAssumption` model to `schema.prisma`
- [x] Generate migration (manually created due to shadow DB issues)
- [x] Write backfill script with error handling
- [x] Apply migration: `npm run db:push`
- [x] Test script execution: `npx tsx scripts/backfill-derivation-assumptions.ts`
- [x] Verify table exists in database
- [x] Verify Prisma Client regenerated with new types

**Result: All tasks complete! ✅**

---

## ⏭️ Next Steps

**Phase 2: Type System** (lib/argumentation/ecc.ts)

1. Update `Arrow<A,B>` type with `assumptions` Map
2. Update `zero()` function
3. Update `join()` function  
4. Update `compose()` function
5. Add `minimalAssumptions()` helper
6. Add `derivationsUsingAssumption()` helper
7. Write unit tests (`lib/argumentation/ecc.test.ts`)

**Estimated time:** 2-3 hours

---

## 📚 References

- **Design Doc:** `docs/agora-architecture-review/GAP_4_BACKEND_DESIGN.md`
- **Schema:** `lib/models/schema.prisma` (line ~4987)
- **Migration:** `lib/models/migrations/20251030225443_add_derivation_assumption_tracking/`
- **Backfill:** `scripts/backfill-derivation-assumptions.ts`

---

**Phase 1 Status: ✅ COMPLETE AND VERIFIED**

*Ready to proceed to Phase 2: Categorical Type System!* 🚀
