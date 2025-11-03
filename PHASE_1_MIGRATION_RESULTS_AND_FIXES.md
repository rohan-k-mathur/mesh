# Phase 1.2 Migration Results & Backend Alignment Tasks

**Date:** 2025-11-03  
**Status:** ⚠️ PARTIAL SUCCESS - Backend misalignment discovered  
**Action Required:** Fix backend code to match schema expectations

---

## Migration Results Summary

### ✅ What Worked

**DialogueVisualizationNode Creation:**
- ✅ 90 nodes created successfully
  - 68 WHY moves
  - 18 RETRACT moves
  - 4 CLOSE moves
- **Status:** WORKING CORRECTLY

**Argument → GROUNDS Linkage:**
- ✅ 13 Arguments linked (out of 263 total)
- **Success Rate:** 4.94%
- **Status:** WORKING BUT LOW COVERAGE (expected for historical data)

### ❌ What Didn't Work

**ConflictApplication → ATTACK Linkage:**
- ❌ 0 ConflictApplications linked (out of 22 total)
- **Root Cause:** NO ATTACK DialogueMoves exist in database
- **Status:** BACKEND MISALIGNMENT

---

## Root Cause Analysis

### Issue 1: GROUNDS Moves Don't Use `argumentId` Field

**Expected (per schema):**
```typescript
model DialogueMove {
  argumentId String? // GROUNDS moves should populate this
}
```

**Reality (in database):**
```sql
-- ALL 53 GROUNDS moves have argumentId = NULL
-- They use targetType/targetId instead:
SELECT kind, targetType, targetId FROM DialogueMove WHERE kind = 'GROUNDS';
-- Returns: targetType = 'argument' or 'claim', targetId = <id>
```

**Impact:**
- Migration script had to be rewritten to use `targetType`/`targetId`
- Only 13 Arguments linked (those with targetType='argument')
- 40 GROUNDS moves target Claims (can't be directly linked)

### Issue 2: No ATTACK Moves Exist

**Expected:**
- ATTACK DialogueMoves should be created when users create ConflictApplications
- 22 ConflictApplications exist, so ~22 ATTACK moves expected

**Reality:**
```sql
SELECT COUNT(*) FROM DialogueMove WHERE kind = 'ATTACK';
-- Returns: 0
```

**Impact:**
- ConflictApplications have no dialogue provenance
- Can't trace which dialogue move created each conflict
- Dialogue visualization will be incomplete (missing attack edges)

### Issue 3: ConflictApplications Use Claims, Not Arguments

**Schema Pattern:**
```sql
-- 20/22 use conflictingClaimId (not conflictingArgumentId)
-- 12/22 use conflictedClaimId (not conflictedArgumentId)
```

**Impact:**
- Even if ATTACK moves existed, linking would require claim-to-argument resolution
- Migration script needs to handle both Claim and Argument references

---

## Backend Code Fixes Required

### Priority 1: Create ATTACK DialogueMoves When ConflictApplications Are Created

**Location:** Look for code that creates `ConflictApplication` records

**Current Behavior:**
```typescript
// Somewhere in your codebase (likely in API routes or actions):
await prisma.conflictApplication.create({
  data: {
    deliberationId,
    conflictingClaimId,
    conflictedArgumentId,
    createdById,
    // ... other fields
  }
});
// ❌ No DialogueMove created!
```

**Required Fix:**
```typescript
// 1. Create the ATTACK DialogueMove first
const attackMove = await prisma.dialogueMove.create({
  data: {
    deliberationId,
    targetType: "argument", // or "claim" depending on what's being attacked
    targetId: conflictedArgumentId || conflictedClaimId,
    kind: "ATTACK",
    actorId: userId,
    signature: generateSignature(...), // Use existing signature logic
    payload: {
      attackType: "REBUTS", // or UNDERCUTS, UNDERMINES
      conflictingId: conflictingArgumentId || conflictingClaimId,
    },
  }
});

// 2. Create the ConflictApplication with dialogue provenance
await prisma.conflictApplication.create({
  data: {
    deliberationId,
    conflictingClaimId,
    conflictedArgumentId,
    createdById,
    createdByMoveId: attackMove.id, // 👈 Link to dialogue move
    // ... other fields
  }
});
```

**Files to Search:**
```bash
# Find where ConflictApplications are created
grep -r "conflictApplication.create" app/ lib/ server/
grep -r "ConflictApplication" app/api/ --include="*.ts"
```

---

### Priority 2: Populate `argumentId` Field for GROUNDS Moves

**Location:** Look for code that creates GROUNDS `DialogueMove` records

**Current Behavior:**
```typescript
await prisma.dialogueMove.create({
  data: {
    kind: "GROUNDS",
    targetType: "argument",
    targetId: argumentId,
    // ❌ argumentId field not populated!
  }
});
```

**Required Fix:**
```typescript
await prisma.dialogueMove.create({
  data: {
    kind: "GROUNDS",
    targetType: "argument",
    targetId: argumentId,
    argumentId: argumentId, // 👈 Also populate this field for direct linkage
    // ... other fields
  }
});
```

**Files to Search:**
```bash
# Find where GROUNDS DialogueMoves are created
grep -r "kind.*GROUNDS" app/ lib/ server/ --include="*.ts"
grep -r "dialogueMove.create" app/ lib/ server/ --include="*.ts"
```

---

### Priority 3: Backfill Historical ATTACK Moves (Optional)

Since 22 ConflictApplications exist without ATTACK moves, consider backfilling:

**Migration Script:**
```sql
-- Create ATTACK DialogueMoves for existing ConflictApplications
INSERT INTO "DialogueMove" (
  id,
  "deliberationId",
  "targetType",
  "targetId",
  kind,
  "actorId",
  signature,
  "createdAt",
  payload,
  "endsWithDaimon",
  completed
)
SELECT
  gen_random_uuid(),
  ca."deliberationId",
  CASE 
    WHEN ca."conflictedArgumentId" IS NOT NULL THEN 'argument'
    ELSE 'claim'
  END,
  COALESCE(ca."conflictedArgumentId", ca."conflictedClaimId"),
  'ATTACK',
  ca."createdById",
  'backfilled_' || ca.id, -- Unique signature
  ca."createdAt",
  jsonb_build_object(
    'backfilled', true,
    'conflictApplicationId', ca.id
  ),
  false,
  true
FROM "ConflictApplication" ca
WHERE ca."createdByMoveId" IS NULL;

-- Link ConflictApplications to new ATTACK moves
UPDATE "ConflictApplication" AS ca
SET "createdByMoveId" = dm.id
FROM "DialogueMove" AS dm
WHERE dm.signature = 'backfilled_' || ca.id;
```

---

## Task Checklist

### Immediate (Block Phase 2)

- [ ] **Task 1:** Find and fix `ConflictApplication.create()` calls
  - [ ] Search codebase for ConflictApplication creation
  - [ ] Add ATTACK DialogueMove creation before each ConflictApplication
  - [ ] Link via `createdByMoveId` field
  - [ ] Test with new conflict creation

- [ ] **Task 2:** Find and fix GROUNDS `DialogueMove.create()` calls
  - [ ] Search for GROUNDS move creation
  - [ ] Add `argumentId` field population
  - [ ] Test with new argument creation

- [ ] **Task 3:** Update dialogue move creation utilities
  - [ ] Check for shared utilities (e.g., `createDialogueMove()`)
  - [ ] Ensure they populate all required fields
  - [ ] Add TypeScript types to enforce field population

### Soon (Before Phase 3)

- [ ] **Task 4:** Backfill historical ATTACK moves
  - [ ] Run SQL script to create ATTACK moves for existing ConflictApplications
  - [ ] Verify linkage with verification queries
  - [ ] Update migration documentation

- [ ] **Task 5:** Add validation to prevent future misalignment
  - [ ] Add database triggers or check constraints
  - [ ] Add TypeScript validation before Prisma calls
  - [ ] Document required fields in AGENTS.md

### Later (Phase 4+)

- [ ] **Task 6:** Audit other DialogueMove kinds
  - [ ] Check ASSERT, THEREFORE, SUPPOSE moves
  - [ ] Ensure all moves populate required fields
  - [ ] Add tests for dialogue move creation

- [ ] **Task 7:** Add monitoring
  - [ ] Log when DialogueMoves are created without required fields
  - [ ] Add metrics for dialogue provenance coverage
  - [ ] Create admin dashboard to view linkage health

---

## Search Commands for Code Audit

```bash
# 1. Find ConflictApplication creation
rg "conflictApplication\.(create|upsert)" -A 10 -B 2

# 2. Find DialogueMove creation
rg "dialogueMove\.(create|upsert)" -A 10 -B 2

# 3. Find GROUNDS move creation specifically
rg "GROUNDS" --type ts -A 5 -B 5 | rg "create"

# 4. Find ATTACK move creation specifically
rg "ATTACK" --type ts -A 5 -B 5 | rg "create"

# 5. Find dialogue action handlers
rg "class.*Action|function.*Action" app/server/ -A 20 | rg "dialogue"

# 6. Find API routes that create conflicts
find app/api -name "route.ts" -exec grep -l "ConflictApplication" {} \;
```

---

## Expected File Locations (to check)

Based on typical Mesh patterns:

1. **Dialogue Actions:**
   - `app/server/dialogue/` (if exists)
   - `lib/dialogue/` (if exists)
   - `server/dialogue/` (if exists)

2. **API Routes:**
   - `app/api/deliberations/[id]/conflicts/route.ts`
   - `app/api/deliberations/[id]/arguments/route.ts`
   - `app/api/dialogue/*/route.ts`

3. **Server Actions:**
   - Files with `"use server"` directive
   - Look for `createArgument`, `createConflict` functions

4. **Utilities:**
   - `lib/arguments/` (check structure-import.ts and similar)
   - `lib/dialogue/` (if exists)

---

## Verification Queries (After Fixes)

```sql
-- 1. Check GROUNDS → Argument linkage
SELECT 
  COUNT(*) FILTER (WHERE a."createdByMoveId" IS NOT NULL) AS linked,
  COUNT(*) AS total_arguments,
  (SELECT COUNT(*) FROM "DialogueMove" WHERE kind = 'GROUNDS') AS total_grounds_moves
FROM "Argument" a;

-- 2. Check ATTACK → ConflictApplication linkage
SELECT 
  COUNT(*) FILTER (WHERE ca."createdByMoveId" IS NOT NULL) AS linked,
  COUNT(*) AS total_conflicts,
  (SELECT COUNT(*) FROM "DialogueMove" WHERE kind = 'ATTACK') AS total_attack_moves
FROM "ConflictApplication" ca;

-- 3. Check DialogueMove field population
SELECT 
  kind,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE "argumentId" IS NOT NULL) AS has_argument_id,
  COUNT(*) FILTER (WHERE "targetId" IS NOT NULL) AS has_target_id
FROM "DialogueMove"
WHERE kind IN ('GROUNDS', 'ATTACK')
GROUP BY kind;

-- 4. Check for orphaned records
SELECT 
  'ConflictApplications without ATTACK moves' AS issue,
  COUNT(*) AS count
FROM "ConflictApplication"
WHERE "createdByMoveId" IS NULL
UNION ALL
SELECT 
  'Arguments without GROUNDS moves',
  COUNT(*)
FROM "Argument"
WHERE "createdByMoveId" IS NULL
  AND "createdAt" > '2025-11-03'; -- Only check recent records
```

---

## Success Criteria (Before Proceeding to Phase 2)

### Must Have ✅
- [ ] New ConflictApplications automatically create ATTACK DialogueMoves
- [ ] New GROUNDS DialogueMoves populate `argumentId` field
- [ ] `createdByMoveId` is populated for all new Arguments/Conflicts
- [ ] Test creates an Argument and verifies `createdByMoveId` is set
- [ ] Test creates a Conflict and verifies `createdByMoveId` is set

### Should Have 🎯
- [ ] Historical ATTACK moves backfilled (22 expected)
- [ ] ConflictApplication → ATTACK linkage > 80%
- [ ] Argument → GROUNDS linkage > 50% (for new data)

### Nice to Have 💡
- [ ] Validation added to prevent future misalignment
- [ ] Monitoring dashboard for dialogue provenance coverage
- [ ] Documentation updated in AGENTS.md

---

## Updated Timeline

**Original Phase 1 Estimate:** 1.5 weeks  
**Actual Phase 1 Time:** Schema changes complete, migration partial  
**Additional Time Needed:** 2-3 days for backend fixes

**Revised Phase 1 Timeline:**
- ✅ Day 1-2: Schema changes (COMPLETE)
- ✅ Day 3: Migration script (COMPLETE - but revealed issues)
- 🔄 Day 4-5: Backend code fixes (IN PROGRESS - YOU ARE HERE)
- ⏳ Day 6: Testing & verification
- ⏳ Day 7: Documentation & handoff to Phase 2

---

## References

- **Migration Results:** See verification queries above
- **Schema Changes:** `lib/models/schema.prisma` (Phase 1.1 complete)
- **Migration Script:** `scripts/add-dialogue-provenance.sql` (fixed for targetType/targetId)
- **Diagnostic Queries:** `scripts/diagnose-dialogue-moves.sql`
- **Roadmap:** `DIALOGUE_VISUALIZATION_ROADMAP.md`
- **Architecture Review:** `DIALOGUE_VISUALIZATION_PHASE1_REVIEW.md`

---

**Next Steps:**
1. Use search commands above to locate ConflictApplication and DialogueMove creation
2. Apply fixes from Priority 1 & 2
3. Test with new Argument and Conflict creation
4. Run verification queries
5. Proceed to Phase 2 once success criteria met

**Status:** ⚠️ BLOCKED - Backend code must be fixed before Phase 2 implementation
