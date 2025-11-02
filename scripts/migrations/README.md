# SQL Migration Scripts - Phase 1.4

**Date:** November 2, 2025  
**Purpose:** Manual SQL scripts for creating dialogue AIF nodes and edges

## Overview

These SQL scripts replace the TypeScript migration script and can be run directly in the Supabase SQL Editor. They create DM-nodes and edges for all existing DialogueMoves.

---

## Execution Order

Run these scripts in order:

### 1. **00-create-dialogue-aif-nodes-edges.sql**
   - Creates DM-nodes for all DialogueMoves
   - Creates edges (triggers, answers, repliesTo, commitsTo)
   - Includes verification queries
   
   **Expected Results:**
   - 207 DM-nodes created (one per DialogueMove)
   - ~207+ edges created (varies based on reply relationships)
   - All DialogueMoves should have corresponding DM-nodes

### 2. **01-update-dialoguemove-aif-links.sql**
   - Updates DialogueMove.aifRepresentation field
   - Links each move to its DM-node
   
   **Expected Results:**
   - 207 DialogueMoves updated with aifRepresentation
   - All moves linked to their DM-nodes

---

## How to Execute

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New query**

### Step 2: Run Script 00 (Create Nodes & Edges)
1. Open `00-create-dialogue-aif-nodes-edges.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run** or press `Ctrl/Cmd + Enter`
5. Wait for completion (should take 5-10 seconds)
6. Review verification query results at the bottom

### Step 3: Run Script 01 (Update Links)
1. Open `01-update-dialoguemove-aif-links.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run**
5. Wait for completion (should take 1-2 seconds)

---

## Verification

After running both scripts, execute these queries to verify:

```sql
-- Check DM-node count (should equal DialogueMove count)
SELECT 
  (SELECT COUNT(*) FROM "DialogueMove") AS total_moves,
  (SELECT COUNT(*) FROM "AifNode" WHERE "nodeKind" = 'DM') AS dm_nodes,
  (SELECT COUNT(*) FROM "DialogueMove" WHERE "aifRepresentation" IS NOT NULL) AS moves_linked;

-- Check edge distribution
SELECT "edgeRole", COUNT(*) AS count
FROM "AifEdge"
WHERE "causedByMoveId" IS NOT NULL
GROUP BY "edgeRole"
ORDER BY count DESC;

-- Sample DM-node with metadata
SELECT 
  id,
  "nodeSubtype",
  "dialogueMoveId",
  "dialogueMetadata"->>'speaker' AS speaker,
  "dialogueMetadata"->>'locution' AS locution,
  "dialogueMetadata"->>'timestamp' AS timestamp
FROM "AifNode"
WHERE "nodeKind" = 'DM'
LIMIT 5;
```

---

## Expected Counts

Based on your database:
- **DialogueMoves:** 207
- **DM-nodes:** 207
- **Edges:** ~207+ (depends on reply threading)

**Edge Breakdown:**
- `triggers`: Question moves (WHY, GROUNDS) replying to other moves
- `answers`: Response moves replying to questions
- `commitsTo`: Moves targeting claim nodes
- `repliesTo`: Moves targeting argument nodes

---

## Troubleshooting

### Issue: "relation AifNode does not exist"
**Solution:** The AifNode table hasn't been created yet. Run:
```sql
-- Create AifNode table (already done if schema was pushed)
-- Check if table exists:
SELECT tablename FROM pg_tables WHERE tablename = 'AifNode';
```

### Issue: "duplicate key value violates unique constraint"
**Solution:** DM-nodes already exist. This is safe to ignore, or delete existing nodes:
```sql
-- Delete existing DM-nodes (CAUTION: only if re-running migration)
DELETE FROM "AifNode" WHERE "nodeKind" = 'DM';
DELETE FROM "AifEdge" WHERE "causedByMoveId" IS NOT NULL;
UPDATE "DialogueMove" SET "aifRepresentation" = NULL;
```

### Issue: "Some edges not created"
**Solution:** Check if target nodes (I:xxx, RA:xxx) exist:
```sql
-- Check for missing claim nodes
SELECT dm."targetId"
FROM "DialogueMove" dm
WHERE dm."targetType" = 'claim'
  AND NOT EXISTS (SELECT 1 FROM "AifNode" WHERE id = 'I:' || dm."targetId");

-- Check for missing argument nodes
SELECT dm."targetId"
FROM "DialogueMove" dm
WHERE dm."targetType" = 'argument'
  AND NOT EXISTS (SELECT 1 FROM "AifNode" WHERE id = 'RA:' || dm."targetId");
```

---

## Rollback (if needed)

To undo the migration:

```sql
-- Remove DM-nodes
DELETE FROM "AifNode" WHERE "nodeKind" = 'DM';

-- Remove dialogue edges
DELETE FROM "AifEdge" WHERE "causedByMoveId" IS NOT NULL;

-- Clear DialogueMove links
UPDATE "DialogueMove" SET "aifRepresentation" = NULL;
```

---

## Post-Migration Tasks

After successful execution:

1. **Verify in Prisma Studio:**
   ```bash
   npx prisma studio
   ```
   - Navigate to AifNode table
   - Filter by `nodeKind = "DM"`
   - Verify `dialogueMetadata` is populated

2. **Update Documentation:**
   - Mark Phase 1.4 as complete in `DIALOGUE_VISUALIZATION_ROADMAP.md`
   - Update Phase 1 status to 100%

3. **Test API Queries:**
   ```typescript
   // Test fetching DM-nodes
   const dmNodes = await prisma.aifNode.findMany({
     where: { nodeKind: "DM" },
     include: { dialogueMove: true },
     take: 10
   });
   ```

---

## Notes

- Scripts use `INSERT ... WHERE NOT EXISTS` to avoid duplicates
- All inserts are idempotent (safe to re-run)
- Foreign key constraints are respected (edges only created if target nodes exist)
- Timestamps are preserved from original DialogueMoves
- Metadata is stored as JSONB for efficient querying

---

## Files

- **00-create-dialogue-aif-nodes-edges.sql** - Main migration script (5 parts)
- **01-update-dialoguemove-aif-links.sql** - Update DialogueMove links
- **README.md** - This file

---

## Success Criteria

✅ All DialogueMoves have corresponding DM-nodes  
✅ All DialogueMoves have `aifRepresentation` set  
✅ Edges created for all reply relationships  
✅ Edges created for all target relationships  
✅ No orphaned nodes or edges  
✅ Metadata correctly populated  

Once verified, Phase 1 is complete and you can proceed to Phase 2 (Server APIs).
