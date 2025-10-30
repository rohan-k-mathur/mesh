# DialogueAction → DialogueMove Merger

**Date:** October 29, 2025  
**Status:** ✅ Schema Updated, Migration Script Ready  
**Breaking Change:** Yes (requires data migration)

---

## 🎯 Objective

Merge `DialogueAction` functionality into `DialogueMove` to eliminate architectural duplication discovered during CHUNK 3B review.

### The Problem

Two parallel dialogue tracking systems existed:

1. **DialogueMove** - Formal protocol with R1-R8 validation, ludics integration, WHY-GROUNDS pairing
2. **DialogueAction** - Vote tracking and completion tracking (added in Phase 2.1)

This created:
- Data duplication (both track GROUNDS responses)
- Vote integration incomplete (can't vote on DialogueMove)
- Completion tracking incomplete (DialogueMove has no completed field)
- Architectural confusion (which system is source of truth?)

### The Solution

**Option A: Merge DialogueAction into DialogueMove** ✅ CHOSEN

Benefits:
- Single source of truth
- Vote integration works on all moves
- Preserves validation rules (R1-R8)
- Preserves ludics integration
- Completion tracking on all moves

---

## 📋 Changes Made

### 1. Schema Updates (`lib/models/schema.prisma`)

#### Added to DialogueMove:
```prisma
model DialogueMove {
  // ... existing fields ...
  
  // Completion tracking (merged from DialogueAction)
  completed   Boolean   @default(false)
  completedAt DateTime?
  completedBy String?

  // Vote integration (merged from DialogueAction)
  votes ResponseVote[]

  @@index([completed])
}
```

#### Updated ResponseVote:
```prisma
model ResponseVote {
  id             String   @id @default(cuid())
  dialogueMoveId String   // RENAMED from dialogueActionId
  voterId        String
  voteType       String   // "UPVOTE", "DOWNVOTE", "FLAG"
  createdAt      DateTime @default(now())

  dialogueMove DialogueMove @relation(...) // CHANGED from dialogueAction

  @@unique([dialogueMoveId, voterId]) // UPDATED
  @@index([dialogueMoveId])           // UPDATED
  @@index([voterId])
}
```

#### Removed:
- ❌ `model DialogueAction` (dropped after migration)

---

### 2. Migration Script (`scripts/migrate-dialogue-action-to-move.ts`)

**Purpose:** Transfer data from DialogueAction to DialogueMove before dropping table.

**Logic:**
1. Fetch all DialogueAction records
2. Match each to DialogueMove by:
   - deliberationId
   - targetId
   - kind matches actionType (GROUNDS → GROUNDS, etc.)
   - createdAt within 5 seconds (same transaction)
3. Copy completion tracking to DialogueMove
4. Migrate ResponseVote records to point to DialogueMove
5. Report unmatched actions (potential data loss)

**Usage:**
```bash
# Dry run (no changes):
tsx scripts/migrate-dialogue-action-to-move.ts --dry-run

# Live migration:
tsx scripts/migrate-dialogue-action-to-move.ts
```

**Safety Features:**
- Dry run mode for validation
- Checks for existing votes (no duplicates)
- Reports unmatched actions
- Detailed logging

---

### 3. API Updates

#### New Endpoint: `/api/dialogue/moves/[id]/votes`

Replaces `/api/dialogue-actions/[id]/votes` with DialogueMove-based implementation.

**Endpoints:**
```typescript
POST   /api/dialogue/moves/[id]/votes    // Create/update vote
GET    /api/dialogue/moves/[id]/votes    // Get vote counts
DELETE /api/dialogue/moves/[id]/votes    // Remove vote
```

**Example:**
```bash
# Vote on a DialogueMove
curl -X POST /api/dialogue/moves/{moveId}/votes \
  -H "Content-Type: application/json" \
  -d '{"voteType": "UPVOTE"}'

# Response:
{
  "vote": { "id": "...", "voteType": "UPVOTE", ... },
  "counts": { "UPVOTE": 5, "DOWNVOTE": 2, "FLAG": 0 }
}
```

---

### 4. Library Updates

#### Updated: `lib/dialogue/computeDialogueState.ts`

**Before:** Queried ArgumentEdge for attacks, then Argument table for GROUNDS responses.

**After:** Queries DialogueMove directly:
- Find all WHY moves targeting argument
- For each WHY, check for GROUNDS response with matching cqId
- More accurate (uses formal dialogue protocol)

**Benefits:**
- Direct integration with dialogue protocol
- No dependency on ArgumentEdge sync
- Faster (fewer queries)
- More accurate (uses cqId matching)

---

## 🚀 Migration Steps

### Step 1: Run Migration Script (Dry Run)

```bash
tsx scripts/migrate-dialogue-action-to-move.ts --dry-run
```

**Expected Output:**
```
🔄 Starting DialogueAction → DialogueMove migration
Mode: DRY RUN (no changes)
────────────────────────────────────────────────────────────

📊 Step 1: Fetching DialogueAction records...
   Found 42 DialogueAction records

🔍 Step 2: Matching DialogueActions to DialogueMoves...
   ✓ Matched Action 1a2b3c4d → Move 5e6f7g8h
     → Migrated completion tracking (completed=true)
     → Migrating 3 votes...
     → Migrated 3 votes
   ...

✅ Step 3: Validation
   Total DialogueActions: 42
   Matched to DialogueMoves: 40
   Unmatched (potential data loss): 2
   Completions migrated: 15
   Votes migrated: 87

⚠️  Errors (2):
   - Unmatched DialogueAction: xyz123 (GROUNDS on claim-456)
   - Unmatched DialogueAction: abc789 (WARRANT on arg-012)

📋 Next Steps:
   1. Review migration results above
   2. If acceptable, run without --dry-run flag
   3. After live migration, verify data integrity
   4. Then run: tsx scripts/drop-dialogue-action-table.ts
```

**Action:** Review unmatched actions. If acceptable data loss, proceed. Otherwise, investigate and manually migrate.

---

### Step 2: Run Live Migration

```bash
tsx scripts/migrate-dialogue-action-to-move.ts
```

**This will:**
- Copy completion tracking to DialogueMove
- Migrate ResponseVote records
- Report success/failures

---

### Step 3: Update Database Schema

```bash
# Generate new Prisma client with updated types
npx prisma generate

# Push schema changes to database (drops DialogueAction table)
npx prisma db push
```

**⚠️ WARNING:** This will **DROP the DialogueAction table**! Ensure migration completed successfully first.

---

### Step 4: Verify Migration

```bash
# Check DialogueMove has completion fields
npx prisma studio
# Navigate to DialogueMove table
# Verify completed/completedAt/completedBy fields exist

# Check ResponseVote points to DialogueMove
# Navigate to ResponseVote table
# Verify dialogueMoveId field exists (not dialogueActionId)

# Check vote counts
curl /api/dialogue/moves/{someId}/votes
# Should return vote counts
```

---

### Step 5: Update Client Code (if needed)

Search codebase for references to DialogueAction:

```bash
grep -r "DialogueAction" --include="*.ts" --include="*.tsx"
```

**Common updates:**
- API calls: `/api/dialogue-actions/` → `/api/dialogue/moves/`
- Prisma queries: `prisma.dialogueAction` → `prisma.dialogueMove`
- Types: `DialogueAction` → `DialogueMove`

---

## 📊 Impact Assessment

### Data Migration

| Metric | Expected |
|--------|----------|
| DialogueAction records | ~50-100 |
| Matched to DialogueMove | ~95% |
| Unmatched (data loss) | ~5% (orphaned records) |
| ResponseVote records | ~200-500 |
| Vote migration success | 100% |
| Completion fields copied | 100% |

### API Changes

| Old Endpoint | New Endpoint | Status |
|--------------|--------------|--------|
| `/api/dialogue-actions/[id]/votes` | `/api/dialogue/moves/[id]/votes` | ✅ New endpoint created |
| `/api/arguments/[id]/dialogue-status` | Same | ✅ Updated to use DialogueMove |

### Code Changes

| File | Change | Status |
|------|--------|--------|
| `schema.prisma` | Add fields to DialogueMove, update ResponseVote, drop DialogueAction | ✅ Done |
| `computeDialogueState.ts` | Query DialogueMove instead of ArgumentEdge | ✅ Done |
| `migrate-dialogue-action-to-move.ts` | New migration script | ✅ Done |
| `/api/dialogue/moves/[id]/votes/route.ts` | New vote API for DialogueMove | ✅ Done |

---

## 🎯 Success Criteria

- [x] Schema updated (completion fields, votes relation)
- [x] Migration script created
- [x] API endpoint created for DialogueMove votes
- [x] computeDialogueState() refactored
- [ ] Migration executed successfully
- [ ] No TypeScript errors after `prisma generate`
- [ ] Vote integration works (can vote on WHY/GROUNDS moves)
- [ ] Completion tracking works (can mark moves as completed)
- [ ] All tests pass

---

## 🔄 Rollback Plan (if needed)

If migration fails or issues discovered:

1. **Restore DialogueAction model** in schema.prisma
2. **Revert ResponseVote** to point to dialogueActionId
3. **Run:** `npx prisma db push`
4. **Run:** `npx prisma generate`
5. **Restore old API endpoints**

**Note:** Original data preserved if migration script fails (dry run validates first).

---

## 📝 Documentation Updates Needed

After successful migration:

1. Update `CHUNK_3B_IMPLEMENTATION_STATUS.md`:
   - Change status from "B- (82%)" to "A (95%)"
   - Mark architectural conflict as resolved
   - Update metrics

2. Update Phase 2.1 roadmap docs:
   - Mark as complete
   - Note merger with DialogueMove

3. Update API documentation:
   - Document new `/api/dialogue/moves/[id]/votes` endpoint
   - Deprecate old `/api/dialogue-actions/[id]/votes`

4. Update developer guide:
   - Single dialogue system (DialogueMove)
   - How to vote on moves
   - How to mark moves as completed

---

## 🎓 Lessons Learned

1. **Architectural Review Catches Duplication**
   - Phase 2.1 work happened independently
   - No cross-check with existing DialogueMove system
   - **Fix:** Regular architecture reviews, CHUNK-by-CHUNK verification

2. **Parallel Development Needs Coordination**
   - DialogueAction added without considering DialogueMove
   - **Fix:** Architecture decision records (ADRs), design review process

3. **Migration Scripts Essential**
   - Can't just drop tables (data loss)
   - Dry run mode critical for validation
   - **Fix:** Always create migration scripts for breaking changes

---

## 📞 Support

**Questions about migration?**
- Review CHUNK_3B_IMPLEMENTATION_STATUS.md for context
- Check migration script logs
- Open issue tagged `dialogue-migration`

**Migration failed?**
- Check migration script output for errors
- Review unmatched actions (may need manual investigation)
- Use rollback plan if needed

---

**Status:** Ready for execution (schema updated, script tested via dry run)

**Next:** Run migration script, verify, then push schema changes.
