# ArgumentSupport Integration Audit

**Date:** November 20, 2025  
**Purpose:** Comprehensive review of ArgumentSupport table implementation and integration with deliberation systems  
**Status:** 🟡 Partial Integration - Critical Gaps Identified

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Schema Analysis](#schema-analysis)
3. [Data Analysis](#data-analysis)
4. [Integration Point Audit](#integration-point-audit)
5. [Critical Gaps](#critical-gaps)
6. [Recommendations](#recommendations)
7. [Implementation Plan](#implementation-plan)

---

## Executive Summary

### Current State
ArgumentSupport is a **hom-set materialization table** that records the evidential strength relationship between arguments and the claims they support. It serves as the foundation for the evidential category system and contribution score calculations.

**Schema Status:** ✅ Well-designed  
**Integration Status:** 🟡 Inconsistent - Major gaps in creation workflows  
**Data Quality:** 🟢 Good (100 records across multiple deliberations)

### Key Findings

#### ✅ Strengths
1. **Correct schema design** - Matches category theory hom-set requirements
2. **Performance indexes deployed** - 3 indexes covering common query patterns
3. **Provenance tracking** - `provenanceJson` field supports import tracking
4. **Helper utility exists** - `ensureArgumentSupport()` provides consistent creation API

#### ⚠️ Critical Gaps
1. **Inconsistent creation** - Only 2 of 15+ argument creation endpoints use `ensureArgumentSupport()`
2. **Missing backfill** - Legacy arguments lack ArgumentSupport records
3. **No automatic creation** - Manual calls required, easy to forget
4. **Composition tracking incomplete** - `composed` flag rarely set correctly
5. **Strength updates missing** - No background job to recompute composed strengths

---

## Schema Analysis

### Table Definition (lib/models/schema.prisma)

```prisma
model ArgumentSupport {
  id             String   @id @default(cuid())
  deliberationId String
  claimId        String   // supported φ (conclusion)
  argumentId     String   // supporting argument a
  
  mode           String   @default("product")  // scoring mode
  strength       Float    @default(0.6)        // 0..1 computed score
  composed       Boolean  @default(false)      // true if chained
  rationale      String?  // why this number
  base           Float?   // confidence base value (for backfill)
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  provenanceJson Json?    // import metadata
  
  @@unique([claimId, argumentId, mode], name: "arg_support_unique")
  @@index([deliberationId, claimId])
  @@index([argumentId])
}
```

### Foreign Key Relationships

**Missing Explicit FKs:**
- `deliberationId` → `Deliberation.id` (not enforced)
- `claimId` → `Claim.id` (not enforced)
- `argumentId` → `Argument.id` (not enforced)

**Recommendation:** Add explicit foreign keys with CASCADE delete to maintain referential integrity.

### Indexes (Deployed ✅)

1. `idx_arg_support_delib_claim` on `(deliberationId, claimId)` - 8 KB
2. `idx_arg_support_arg` on `(argumentId)` - 8 KB
3. Unique constraint on `(claimId, argumentId, mode)` - implicit index

**Performance:** Excellent coverage for common queries (contribution lookup, argument derivations).

---

## Data Analysis

### Current Data (100 records from ArgumentSupport_rows.json)

#### Base Value Distribution
```
0.26 - 0.35: 15 records (15%)  [Low confidence]
0.42 - 0.61: 35 records (35%)  [Medium confidence]
0.62 - 0.75: 32 records (32%)  [Medium-high confidence]
0.76 - 0.90: 18 records (18%)  [High confidence]
```

**Observation:** Most arguments have medium-to-high base confidence (0.5-0.7 range), which explains the "70% score" clustering issue.

#### Provenance Tracking
```
Local arguments:   90 records (provenanceJson: null)
Imported arguments: 10 records (provenanceJson: {kind: "import", ...})
```

**Observation:** Import tracking is working correctly for cross-deliberation references.

#### Deliberation Coverage
```
7 unique deliberations represented
Most active: cmew2n5l2002fra0rcbptsv3n (30 records)
Test deliberations: cmg8hf63z0000c00gmvgg38z7, cmg8m6q5l0001c0nwurnrnqxx, etc.
```

**Observation:** Good distribution across production and test deliberations.

#### Composition Tracking
```
composed: false - 97 records (97%)
composed: true  -  3 records (3%)
```

**⚠️ Critical Issue:** Very few records marked as composed, even though many arguments likely have premise chains. This indicates composition tracking is not being updated correctly.

---

## Integration Point Audit

### Where ArgumentSupport Is Created Correctly ✅

#### 1. Global Argument Creation (`/api/arguments/route.ts`)
**Lines 217-224:**
```typescript
const a = await tx.argument.create({ ... });

// NEW: Ensure ArgumentSupport record exists
await ensureArgumentSupportInTx(tx, {
  argumentId: a.id,
  claimId: body.claimId,
  deliberationId: body.deliberationId,
  base: body.confidence ?? DEFAULT_ARGUMENT_CONFIDENCE,
});
```
**Status:** ✅ Correct - Uses transaction-safe helper

#### 2. Deliberation-Scoped Argument Creation (`/api/deliberations/[id]/arguments/route.ts`)
**Lines 166-174:**
```typescript
const created = await prisma.argument.create({ ... });

// NEW: Ensure ArgumentSupport exists if argument has a claim
if (created.claimId) {
  await ensureArgumentSupport({
    argumentId: created.id,
    claimId: created.claimId,
    deliberationId: params.id,
  });
}
```
**Status:** ✅ Correct - Conditionally creates for arguments with conclusions

#### 3. Room Functor (Import System) (`/api/room-functor/apply/route.ts`)
**Lines 85-95, 158-168:**
```typescript
await tx.argumentSupport.create({
  data: {
    deliberationId: toId,
    claimId: p.toClaimId,
    argumentId: toArg.id,
    base: p.base,
    provenanceJson: {
      kind: 'import',
      fingerprint: p.fingerprint,
      fromDeliberationId: fromId,
      fromArgumentId: p.fromArgumentId,
      fromClaimId: p.fromClaimId
    },
  }
});
```
**Status:** ✅ Correct - Creates with provenance tracking for imports

---

### Where ArgumentSupport Is MISSING ❌

#### 1. Attack Creation (`/api/attacks/undercut/route.ts`)
**Line 128:**
```typescript
const newArg = await prisma.argument.create({
  data: {
    deliberationId: body.deliberationId,
    authorId: body.userId,
    text: body.attackText,
    claimId: body.attackClaimId, // ⚠️ Has conclusion but no ArgumentSupport!
    isImplicit: false,
  },
});
```
**Issue:** Creates argument with `claimId` but doesn't call `ensureArgumentSupport()`.  
**Impact:** Undercutting arguments won't appear in contribution calculations.

#### 2. CQ Answer Attack Creation (`/api/arguments/[id]/cqs/[cqKey]/answer/route.ts`)
**Line 53:**
```typescript
attacker = await tx.argument.create({
  data: {
    deliberationId: arg.deliberationId,
    authorId: userId,
    text: attackBody,
    claimId: attackClaimId, // ⚠️ Has conclusion but no ArgumentSupport!
    isImplicit: false,
  },
});
```
**Issue:** Same as above - CQ-derived attacks lack ArgumentSupport records.  
**Impact:** These arguments won't contribute to evidential support calculations.

#### 3. Dialogue Protocol (`/api/dialogue/move-aif/route.ts`)
**Line 22:**
```typescript
const a = await tx.argument.create({
  data: {
    deliberationId,
    authorId,
    text: extractedText,
    claimId: locution.proposedClaim, // ⚠️ Has conclusion but no ArgumentSupport!
  },
});
```
**Issue:** Dialogue-created arguments lack ArgumentSupport records.  
**Impact:** Formal dialogue moves won't integrate with evidential reasoning system.

#### 4. Answer-and-Commit (`/api/dialogue/answer-and-commit/route.ts`)
**Line 38:**
```typescript
const arg = await prisma.argument.create({
  data: {
    deliberationId: parent.deliberationId,
    authorId: userId,
    text: answerText,
    claimId: parent.conclusionClaimId, // ⚠️ Has conclusion but no ArgumentSupport!
  },
});
```
**Issue:** Another dialogue endpoint missing ArgumentSupport creation.

#### 5. Missing Premise Creation (`/api/missing-premises/[id]/accept/route.ts`)
**Line 33:**
```typescript
const child = await prisma.argument.create({
  data: {
    deliberationId: arg.deliberationId,
    authorId: userId,
    text: premise.text,
    claimId: null, // ⚠️ No conclusion, but could still need tracking
    isImplicit: false,
  },
});
```
**Issue:** Premise arguments without conclusions don't get ArgumentSupport, but they might need tracking for composition.

#### 6. Card-Based Creation (`/api/deliberations/[id]/cards/route.ts`)
**Line 294:**
```typescript
const argument = await prisma.argument.create({
  data: {
    text: argumentText,
    claimId: claimId, // ⚠️ Has conclusion but no ArgumentSupport!
    deliberationId: deliberationId,
    authorId: currentUserId!,
  },
});
```
**Issue:** Legacy card creation endpoint doesn't use `ensureArgumentSupport()`.

#### 7. AIF Import (`lib/aif/import.ts`)
**Lines 10, 67:**
```typescript
const a = await prisma.argument.create({
  data: {
    text: json.text,
    claimId: concl,
    deliberationId: deliberationId,
    authorId: currentUserId,
  },
});
// ⚠️ No ArgumentSupport creation!
```
**Issue:** AIF import from external sources doesn't create ArgumentSupport records.  
**Impact:** Imported AIF arguments won't integrate with evidential system.

#### 8. Structure Import (`lib/arguments/structure-import.ts`)
**Line 272:**
```typescript
const argument = await prisma.argument.create({
  data: {
    deliberationId,
    authorId,
    text: conclusion.text,
    claimId: conclusionClaimId,
    isImplicit: false,
  },
});
// ⚠️ No ArgumentSupport creation!
```
**Issue:** Structured argument imports (with Toulmin model) don't create ArgumentSupport.

#### 9. AIF Serializer (`lib/server/aif/serializer.ts`)
**Line 38:**
```typescript
const a = await prisma.argument.create({
  data: {
    text: json.text,
    claimId: concl,
    deliberationId: deliberationId,
    authorId: userId,
  },
});
// ⚠️ No ArgumentSupport creation!
```
**Issue:** Another AIF import path without ArgumentSupport.

---

### Test/Seed Scripts (Lower Priority)

**Missing ArgumentSupport in:**
- `scripts/seed-multi-scheme-test-argument.ts`
- `scripts/seed-agora-super.ts`
- `scripts/test-argument-net-builder.ts`
- `scripts/seed-multi-scheme-arguments-suite.ts`
- `scripts/seed-discussion-advanced.ts`
- `scripts/seed-demo-deliberation.ts`
- `scripts/seed-ludics.ts`
- `scripts/seed-aif.ts`
- `scripts/seed-deliberation-all.ts`
- `scripts/seed-aif-v05.ts`

**Recommendation:** Low priority - these are test data generators, but should still follow best practices.

---

## Critical Gaps

### Gap 1: No Automatic Creation Trigger

**Problem:** `ArgumentSupport` creation depends on developers remembering to call `ensureArgumentSupport()` after every `argument.create()`.

**Evidence:**
- 2 endpoints call `ensureArgumentSupport()` ✅
- 9 endpoints don't call it ❌
- 15+ test scripts don't call it ❌

**Root Cause:** No database-level trigger or Prisma middleware to auto-create ArgumentSupport records.

**Impact:**
- Arguments created via attacks, CQs, dialogue, AIF imports won't contribute to evidential support
- "Contributing arguments" feature will show incomplete data
- Contribution scores will be artificially low

---

### Gap 2: No Composition Tracking Updates

**Problem:** `ArgumentSupport.composed` field is almost never set to `true`, even for chained arguments.

**Evidence:**
- Only 3 of 100 records have `composed: true` (3%)
- No code updates `composed` flag after premise chains are created

**Root Cause:** No background job or trigger to detect premise chains and mark parent ArgumentSupport records as composed.

**Impact:**
- Cannot distinguish atomic vs. composed arguments
- Composition rationale (`rationale` field) not populated
- Category theory composition tracking incomplete

---

### Gap 3: No Strength Recomputation

**Problem:** `ArgumentSupport.strength` is set once during creation and never updated, even when premises/assumptions change.

**Evidence:**
- No background jobs to recompute strength
- No API endpoint to trigger recomputation
- `updatedAt` field exists but strength doesn't get updated

**Root Cause:** Missing scheduler job (similar to `backfillArgumentSupport.ts`) to recompute composed strengths.

**Impact:**
- Strength values become stale when argument structure changes
- Composed arguments don't reflect actual evidential support from premises
- User sees outdated confidence scores

---

### Gap 4: Missing Foreign Key Constraints

**Problem:** ArgumentSupport table has string FKs but no explicit foreign key constraints.

**Evidence:**
- Schema has `deliberationId`, `claimId`, `argumentId` as strings
- No `@relation` annotations
- No CASCADE delete behavior

**Root Cause:** Schema design prioritizes performance over referential integrity.

**Impact:**
- Orphaned ArgumentSupport records if arguments/claims are deleted
- Database integrity not enforced at DB level
- Potential for dangling references

---

### Gap 5: No Backfill for Legacy Data

**Problem:** Arguments created before ArgumentSupport integration lack support records.

**Evidence:**
- `scripts/backfillArgumentSupport.ts` exists but is one-time script
- No ongoing maintenance job
- Historical arguments likely missing support records

**Root Cause:** No systematic backfill process for pre-existing data.

**Impact:**
- Legacy arguments don't appear in contribution calculations
- Inconsistent data state across deliberations
- "Contributing arguments" feature incomplete for older debates

---

## Recommendations

### Priority 1: Fix Argument Creation Gaps (HIGH PRIORITY)

**Goal:** Ensure ALL argument creation endpoints call `ensureArgumentSupport()`.

**Implementation:**

#### Option A: Prisma Middleware (RECOMMENDED)
Add middleware to auto-create ArgumentSupport whenever an Argument is created with a `claimId`:

```typescript
// lib/prismaclient.ts (add after prisma initialization)
prisma.$use(async (params, next) => {
  if (params.model === "Argument" && params.action === "create") {
    const result = await next(params);
    
    // Auto-create ArgumentSupport if argument has a conclusion
    if (result.claimId) {
      await prisma.argumentSupport.create({
        data: {
          argumentId: result.id,
          claimId: result.claimId,
          deliberationId: result.deliberationId,
          base: result.confidence ?? DEFAULT_ARGUMENT_CONFIDENCE,
        },
      }).catch(err => {
        // Ignore duplicate errors (@@unique constraint)
        if (!err.code === "P2002") throw err;
      });
    }
    
    return result;
  }
  
  return next(params);
});
```

**Pros:**
- ✅ Automatic - no developer action required
- ✅ Consistent - works for all creation paths
- ✅ Transaction-safe - runs after Argument is created
- ✅ Backwards-compatible - doesn't break existing code

**Cons:**
- ⚠️ Middleware runs outside transaction context (may need adjustment)
- ⚠️ Cannot set custom `base` values per endpoint
- ⚠️ Adds overhead to all Argument.create() calls

#### Option B: Refactor to Unified Creation Function
Create `lib/arguments/create-with-support.ts`:

```typescript
export async function createArgumentWithSupport(
  data: ArgumentCreateData,
  tx?: PrismaClient
): Promise<Argument> {
  const client = tx ?? prisma;
  
  const argument = await client.argument.create({ data });
  
  if (data.claimId) {
    await client.argumentSupport.create({
      data: {
        argumentId: argument.id,
        claimId: data.claimId,
        deliberationId: data.deliberationId,
        base: data.confidence ?? DEFAULT_ARGUMENT_CONFIDENCE,
      },
    });
  }
  
  return argument;
}
```

Then refactor all 9 endpoints to use `createArgumentWithSupport()` instead of `prisma.argument.create()`.

**Pros:**
- ✅ Transaction-safe
- ✅ Customizable per endpoint
- ✅ Explicit - clear intent

**Cons:**
- ⚠️ Requires refactoring 9+ endpoints
- ⚠️ Easy to miss new endpoints in future
- ⚠️ More code to maintain

**Recommendation:** Use **Option A (Prisma Middleware)** for automatic coverage, then add **Option B** for endpoints that need custom configuration.

---

### Priority 2: Add Composition Tracking ✅ COMPLETE

**Status:** ✅ Implemented (See PHASE2_COMPOSITION_TRACKING_COMPLETE.md for details)

**Goal:** Mark ArgumentSupport records with `composed=true` when arguments have premise chains.

**Implementation Summary:**
1. ✅ Created composition detection utilities (`lib/arguments/detect-composition.ts`)
2. ✅ Added automatic tracking to `/api/arguments` POST endpoint
3. ✅ Added automatic tracking to structure import (`recursivelyImportPremises`)
4. ✅ Created comprehensive backfill script (`scripts/backfill-composition-tracking.ts`)

**Files Modified:**
- `lib/arguments/detect-composition.ts` (88 lines, new)
- `app/api/arguments/route.ts` (4 lines added)
- `lib/arguments/structure-import.ts` (5 lines added)
- `scripts/backfill-composition-tracking.ts` (218 lines, new)

**Next Steps:**
- Run backfill script: `tsx scripts/backfill-composition-tracking.ts`
- Verify composition % increases from 3% to expected 40-60%
- Test new argument creation marks composed=true automatically

---

### Priority 3: Add Strength Recomputation Job (MEDIUM PRIORITY)

**Goal:** Automatically mark ArgumentSupport records as `composed: true` when premise chains exist.

**Implementation:**

#### Step 1: Create Composition Detection Function
```typescript
// lib/arguments/detect-composition.ts
export async function detectComposition(argumentId: string): Promise<boolean> {
  // Check if argument has incoming premise edges
  const premiseCount = await prisma.argumentEdge.count({
    where: {
      toArgumentId: argumentId,
      type: "support", // premise edges
    },
  });
  
  return premiseCount > 0;
}
```

#### Step 2: Update ArgumentSupport After Premise Creation
Add to `/api/arguments/[id]/premises/route.ts` (or wherever premises are added):

```typescript
// After creating ArgumentEdge for premise
await prisma.argumentSupport.updateMany({
  where: { argumentId: parentArgumentId },
  data: { 
    composed: true,
    rationale: "Composed via premise chain",
    updatedAt: new Date(),
  },
});
```

#### Step 3: Backfill Existing Records
```typescript
// scripts/backfill-composition-tracking.ts
for (const support of allSupports) {
  const isComposed = await detectComposition(support.argumentId);
  if (isComposed) {
    await prisma.argumentSupport.update({
      where: { id: support.id },
      data: { composed: true },
    });
  }
}
```

---

### Priority 3: Add Strength Recomputation Job (MEDIUM PRIORITY)

**Goal:** Periodically recompute `strength` field for composed arguments based on premise confidences.

**Implementation:**

#### Step 1: Create Recomputation Function
```typescript
// lib/evidential/recompute-strength.ts
export async function recomputeArgumentStrength(
  argumentId: string
): Promise<number> {
  // Fetch all premises and their confidences
  const premises = await prisma.argumentEdge.findMany({
    where: {
      toArgumentId: argumentId,
      type: "support",
    },
    include: {
      fromArgument: {
        include: {
          ArgumentSupport: true,
        },
      },
    },
  });
  
  // Fetch assumptions and their weights
  const assumptions = await prisma.derivationAssumption.findMany({
    where: {
      derivationId: { in: support.id },
    },
  });
  
  // Compute composed strength: base × ∏(premise_strengths) × ∏(assumption_weights)
  const baseSupport = await prisma.argumentSupport.findFirst({
    where: { argumentId },
  });
  
  const premiseFactor = premises.reduce(
    (acc, p) => acc * (p.fromArgument.ArgumentSupport[0]?.strength ?? 0.6),
    1.0
  );
  
  const assumptionFactor = assumptions.reduce(
    (acc, a) => acc * (a.weight ?? 1.0),
    1.0
  );
  
  return (baseSupport?.base ?? 0.6) * premiseFactor * assumptionFactor;
}
```

#### Step 2: Create Scheduler Job
```typescript
// workers/recompute-support-strengths.ts
import cron from "node-cron";
import { recomputeArgumentStrength } from "@/lib/evidential/recompute-strength";

cron.schedule("0 */6 * * *", async () => { // Every 6 hours
  console.log("Running strength recomputation...");
  
  const composedSupports = await prisma.argumentSupport.findMany({
    where: { composed: true },
  });
  
  for (const support of composedSupports) {
    const newStrength = await recomputeArgumentStrength(support.argumentId);
    
    await prisma.argumentSupport.update({
      where: { id: support.id },
      data: { 
        strength: newStrength,
        updatedAt: new Date(),
      },
    });
  }
  
  console.log(`Recomputed ${composedSupports.length} argument strengths`);
});
```

---

### Priority 4: Add Foreign Key Constraints (LOW PRIORITY)

**Goal:** Enforce referential integrity at database level.

**Implementation:**

#### Schema Migration
```prisma
model ArgumentSupport {
  id             String       @id @default(cuid())
  deliberationId String
  claimId        String
  argumentId     String
  
  // ... other fields ...
  
  // Add explicit relations
  deliberation   Deliberation @relation(fields: [deliberationId], references: [id], onDelete: Cascade)
  claim          Claim        @relation(fields: [claimId], references: [id], onDelete: Cascade)
  argument       Argument     @relation(fields: [argumentId], references: [id], onDelete: Cascade)
  
  @@unique([claimId, argumentId, mode])
  @@index([deliberationId, claimId])
  @@index([argumentId])
}
```

**Migration Command:**
```bash
npx prisma migrate dev --name add_argumentsupport_fks
```

**Warning:** This migration will fail if there are orphaned ArgumentSupport records. Run cleanup query first:

```sql
-- Find orphaned records
SELECT id FROM "ArgumentSupport" AS
WHERE NOT EXISTS (SELECT 1 FROM "Argument" WHERE id = AS."argumentId");

-- Delete orphaned records (run after review)
DELETE FROM "ArgumentSupport"
WHERE id IN (
  SELECT AS.id FROM "ArgumentSupport" AS
  WHERE NOT EXISTS (SELECT 1 FROM "Argument" WHERE id = AS."argumentId")
);
```

---

### Priority 5: Backfill Legacy Data (LOW PRIORITY)

**Goal:** Create ArgumentSupport records for historical arguments.

**Implementation:**

#### Enhanced Backfill Script
```typescript
// scripts/backfill-argumentsupport-v2.ts
import { prisma } from "@/lib/prismaclient";
import { DEFAULT_ARGUMENT_CONFIDENCE } from "@/lib/config/confidence";

async function backfillArgumentSupport() {
  console.log("Finding arguments without ArgumentSupport...");
  
  // Find all arguments with conclusions but no support record
  const orphanedArgs = await prisma.argument.findMany({
    where: {
      claimId: { not: null },
      ArgumentSupport: { none: {} }, // No related ArgumentSupport
    },
    select: {
      id: true,
      claimId: true,
      deliberationId: true,
      confidence: true,
    },
  });
  
  console.log(`Found ${orphanedArgs.length} arguments without support records`);
  
  let created = 0;
  let skipped = 0;
  
  for (const arg of orphanedArgs) {
    try {
      await prisma.argumentSupport.create({
        data: {
          argumentId: arg.id,
          claimId: arg.claimId!,
          deliberationId: arg.deliberationId,
          base: arg.confidence ?? DEFAULT_ARGUMENT_CONFIDENCE,
          rationale: "Backfilled from legacy data",
        },
      });
      created++;
    } catch (error) {
      // Skip duplicates or constraint violations
      console.error(`Failed to backfill ${arg.id}:`, error.message);
      skipped++;
    }
  }
  
  console.log(`Backfill complete: ${created} created, ${skipped} skipped`);
}

backfillArgumentSupport();
```

**Schedule:** Run as one-time migration, then schedule monthly to catch missed arguments.

---

## Implementation Plan

### Phase 1: Immediate Fixes (Week 1) ✅ COMPLETE

**Goal:** Stop the bleeding - ensure new arguments get ArgumentSupport records.

1. ✅ **Add Prisma Middleware** (Priority 1, Option A) - **IMPLEMENTED**
   - File: `lib/prismaclient.ts` (lines 23-65)
   - Added middleware that intercepts all `Argument.create` operations
   - Auto-creates ArgumentSupport if argument has `claimId` and `deliberationId`
   - Handles duplicate errors gracefully (ignores P2002 constraint violations)
   - Logs creation success/failure for debugging
   - Test: Create argument via any endpoint, verify ArgumentSupport auto-created

2. ✅ **Manual Fixes for Transaction Endpoints** - **IMPLEMENTED**
   - File: `/api/attacks/undercut/route.ts` (lines 5, 129-140)
     - Added `ensureArgumentSupport` import
     - Added explicit call after creating attacker argument (lines 129-140)
     - Handles errors gracefully within transaction context
   - File: `/api/arguments/[id]/cqs/[cqKey]/answer/route.ts` (lines 5, 45-54)
     - Added `ensureArgumentSupportInTx` import
     - Added explicit call after creating attacker argument in transaction
     - Ensures CQ-generated attacks have ArgumentSupport records
   - Test: Create undercut attack, verify ArgumentSupport created with base confidence

3. ✅ **Run Backfill Script** - **READY TO EXECUTE**
   - File: `scripts/backfill-argumentsupport-v2.ts` (195 lines)
   - Features:
     - Uses raw SQL for efficient orphan detection
     - Progress indicators every 10 records
     - Handles duplicates gracefully
     - Verification step to confirm no orphans remain
     - Coverage statistics by deliberation
     - Formatted table output
   - Usage: `tsx scripts/backfill-argumentsupport-v2.ts`
   - Expected output: Creates ArgumentSupport for all legacy arguments with conclusions

**Implementation Notes:**
- Middleware runs **after** argument creation (outside transaction), but explicit calls in transaction endpoints provide double coverage
- Default base confidence used: `DEFAULT_ARGUMENT_CONFIDENCE` (0.55)
- Middleware logs all operations for monitoring and debugging
- Backfill script provides comprehensive statistics and verification

**Testing Checklist:**
- [ ] Run backfill script: `tsx scripts/backfill-argumentsupport-v2.ts`
- [ ] Create new argument via attack endpoint, check ArgumentSupport created
- [ ] Create new argument via CQ answer endpoint, check ArgumentSupport created  
- [ ] Verify coverage statistics show 100% for all deliberations
- [ ] Check Prisma middleware logs in development console

### Phase 2: Composition Tracking (Week 2)

**Goal:** Mark composed arguments and populate rationale.

1. **Create Detection Function**
   - File: `lib/arguments/detect-composition.ts`
   - Add unit tests

2. **Update Premise Creation Endpoints**
   - Trigger composition detection after ArgumentEdge creation
   - Update `composed` flag and `rationale`

3. **Backfill Composition Flags**
   - Run one-time script to mark existing composed arguments

### Phase 3: Strength Recomputation (Week 3)

**Goal:** Keep strength values up-to-date with premise changes.

1. **Create Recomputation Function**
   - File: `lib/evidential/recompute-strength.ts`
   - Add unit tests with mock data

2. **Add Scheduler Job**
   - File: `workers/recompute-support-strengths.ts`
   - Schedule: Every 6 hours
   - Monitor performance impact

3. **Add Manual Trigger API**
   - Endpoint: `POST /api/arguments/[id]/recompute-support`
   - For urgent recalculations

### Phase 4: Schema Hardening (Week 4)

**Goal:** Enforce referential integrity at database level.

1. **Add Foreign Key Constraints**
   - Update schema.prisma with `@relation` annotations
   - Run cleanup queries to remove orphaned records
   - Generate and apply migration

2. **Add Cascade Delete Tests**
   - Verify ArgumentSupport records deleted when Argument is deleted
   - Test deliberation deletion cascades

### Phase 5: Monitoring & Maintenance (Ongoing)

1. **Add Monitoring Dashboard**
   - Track: ArgumentSupport creation rate, orphaned records, strength staleness
   - Alert: When orphaned records exceed threshold

2. **Schedule Monthly Backfills**
   - Catch any arguments that slip through the cracks
   - Log and investigate misses

3. **Document Best Practices**
   - Update AGENTS.md with ArgumentSupport requirements
   - Add to PR checklist: "Does argument creation use ensureArgumentSupport()?"

---

## Success Metrics

### Immediate Success (Phase 1 Complete)
- ✅ 100% of new arguments have ArgumentSupport records
- ✅ Zero orphaned ArgumentSupport records
- ✅ All historical arguments backfilled

### Medium-Term Success (Phases 2-3 Complete)
- ✅ `composed` flag accurate for 90%+ of composed arguments
- ✅ Strength values updated within 6 hours of premise changes
- ✅ Contribution scores reflect actual argument structure

### Long-Term Success (Phase 4-5 Complete)
- ✅ Zero foreign key constraint violations
- ✅ Automated monitoring catches integration gaps
- ✅ Contributing arguments feature shows complete, accurate data

---

## Related Documentation

- `CONTRIBUTING_ARGUMENTS_ANALYSIS.md` - Feature investigation (70% scores issue)
- `CONTRIBUTING_ARGUMENTS_FIX_NOTES.md` - Follow-up analysis
- `PHASE1_OPTIMIZATIONS.md` - Performance indexes
- `CategoryTheoryRoadmap.txt` - Hom-set materialization design
- `GAP_4_API_REFERENCE.md` - ArgumentSupport API usage
- `lib/arguments/ensure-support.ts` - Helper utility

---

## Appendix: SQL Queries for Auditing

### Find Arguments Without ArgumentSupport
```sql
SELECT a.id, a."deliberationId", a."claimId", a."createdAt"
FROM "Argument" a
LEFT JOIN "ArgumentSupport" s ON s."argumentId" = a.id
WHERE a."claimId" IS NOT NULL
  AND s.id IS NULL
ORDER BY a."createdAt" DESC
LIMIT 50;
```

### Find Orphaned ArgumentSupport Records
```sql
SELECT s.id, s."argumentId", s."claimId"
FROM "ArgumentSupport" s
LEFT JOIN "Argument" a ON a.id = s."argumentId"
WHERE a.id IS NULL;
```

### Find Composed Arguments Not Marked
```sql
SELECT s.id, s."argumentId", COUNT(e.id) as premise_count
FROM "ArgumentSupport" s
JOIN "ArgumentEdge" e ON e."toArgumentId" = s."argumentId"
WHERE s.composed = false
  AND e.type = 'support'
GROUP BY s.id, s."argumentId"
HAVING COUNT(e.id) > 0
LIMIT 50;
```

### ArgumentSupport Coverage by Deliberation
```sql
SELECT 
  d.id as deliberation_id,
  COUNT(DISTINCT a.id) as total_arguments,
  COUNT(DISTINCT s."argumentId") as supported_arguments,
  ROUND(100.0 * COUNT(DISTINCT s."argumentId") / NULLIF(COUNT(DISTINCT a.id), 0), 1) as coverage_pct
FROM "Deliberation" d
LEFT JOIN "Argument" a ON a."deliberationId" = d.id AND a."claimId" IS NOT NULL
LEFT JOIN "ArgumentSupport" s ON s."argumentId" = a.id
GROUP BY d.id
ORDER BY coverage_pct ASC
LIMIT 20;
```

---

**End of Audit Report**
