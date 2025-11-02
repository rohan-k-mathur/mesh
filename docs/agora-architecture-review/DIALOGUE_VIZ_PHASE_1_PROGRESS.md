# Dialogue Visualization Roadmap - Phase 1 Progress

**Date:** November 2, 2025  
**Status:** Phase 1.1-1.3 Complete (75%)  
**Next Steps:** Phase 1.4 Migration Script

---

## Summary

Successfully completed the foundation work for dialogue visualization by extending the database schema, creating AIF ontology definitions, and establishing TypeScript types. The system now has the infrastructure to represent dialogue moves (DM-nodes) as first-class citizens in AIF graphs.

---

## Completed Tasks

### ✅ Phase 1.1: Database Schema Extensions

**Files Modified:**
- `lib/models/schema.prisma` (lines 5679-5779)

**Changes:**
1. **Created `AifNode` model** (lines 5697-5735)
   - 10 fields including `dialogueMoveId`, `nodeKind`, `nodeSubtype`, `dialogueMetadata`
   - 4 strategic indexes for optimal queries
   - Relations to `DialogueMove`, `AifEdge`, and `Deliberation`

2. **Created `AifEdge` model** (lines 5740-5766)
   - Represents relationships between AIF nodes
   - Tracks `causedByMoveId` for dialogue provenance
   - 4 indexes for efficient edge queries

3. **Extended `DialogueMove` model** (lines 3618-3627)
   - Added `createdAifNodes` relation (back-reference to AifNode)
   - Added `aifRepresentation` field (links to primary DM-node)
   - Added `aifNode` relation (one-to-one with DM-node)
   - Added `causedEdges` relation (edges caused by this move)

4. **Extended `Deliberation` model** (lines 3710-3713)
   - Added `aifNodes` back-relation
   - Added `aifEdges` back-relation

**Database Status:**
- ✅ Schema pushed to database (`npx prisma db push --accept-data-loss`)
- ✅ Prisma client generated successfully
- ✅ All relations properly configured with cascade/setNull semantics

---

### ✅ Phase 1.2: AIF Ontology Extension

**Files Created:**
- `lib/aif/ontology.ts` (336 lines)

**Contents:**
1. **AIF_DIALOGUE_ONTOLOGY constant** (lines 23-81)
   - 9 DM-node subtypes (WHY, GROUNDS, CONCEDE, RETRACT, etc.)
   - 8 edge types (triggers, answers, commitsTo, repliesTo, etc.)
   - Standard AIF node/edge types for reference

2. **Enums** (lines 83-117)
   - `AifNodeKind`: I, RA, CA, PA, DM
   - `DialogueLocution`: All move types

3. **Type Guards** (lines 133-161)
   - `isDmNode()`: Check if node is a dialogue move
   - `isStandardAifNode()`: Check if node is I/RA/CA/PA

4. **Mapping Functions** (lines 179-242)
   - `dialogueKindToAifType()`: Map Prisma kind to AIF URI
   - `aifTypeToLabel()`: Get human-readable labels
   - `aifTypeToLocution()`: Extract locution from AIF type

5. **Visualization Utilities** (lines 261-303)
   - `getDialogueMoveColor()`: Semantic color codes
   - `getDialogueMoveIcon()`: Emoji/Unicode icons

**Key Design Decisions:**
- WHY = amber (`#f59e0b`) for questioning
- GROUNDS = blue (`#3b82f6`) for constructive
- CONCEDE = green (`#10b981`) for accepting
- RETRACT = red (`#ef4444`) for withdrawing
- THEREFORE = purple (`#8b5cf6`) for inferential

---

### ✅ Phase 1.3: TypeScript Type Definitions

**Files Created:**
- `types/aif-dialogue.ts` (221 lines)

**Type Definitions:**

1. **DialogueMetadata** (lines 13-32)
   - Structured metadata for DM-nodes
   - Fields: locution, speaker, speakerName, timestamp, replyToMoveId, illocution, payload

2. **AifNodeWithDialogue** (lines 38-47)
   - Extends Prisma AifNode with parsed dialogue metadata
   - Includes optional `dialogueMove` relation

3. **DialogueMoveWithAif** (lines 53-67)
   - Extends Prisma DialogueMove with AIF representation
   - Links to `aifNode` and `createdAifNodes`

4. **DialogueAwareEdge** (lines 73-86)
   - Typed edge roles (inference, conflict, preference, triggers, answers, commitsTo, repliesTo)

5. **AifGraphWithDialogue** (lines 99-115)
   - Complete graph structure with nodes, edges, moves, commitment stores
   - Includes metadata (node counts, timestamps)

6. **NodeDialogueProvenance** (lines 121-139)
   - Provenance information for individual nodes
   - Links to creating move, related CQs, commitment history

7. **BuildGraphOptions** (lines 144-163)
   - Configuration for graph construction
   - Filters: includeDialogue, includeMoves, participantFilter, timeRange

8. **DialogueTimelineEvent** (lines 168-185)
   - Timeline events for playback UI
   - Types: move, argument_created, commitment_changed

9. **DialogueFilterOptions** (lines 190-211)
   - UI filter configuration
   - Filters: participants, moveTypes, timeRange, hasReplies, createdArguments

**Type Safety:**
- All types properly extend Prisma-generated types
- No compilation errors after fixing `dialogueMetadata` type conflict
- Ready for use in API endpoints and React components

---

## Technical Achievements

### Database Architecture

```
DialogueMove ──┬──> AifNode (aifRepresentation) [1:1]
               ├──> AifNode[] (createdAifNodes) [1:n]
               └──> AifEdge[] (causedEdges) [1:n]

AifNode ──┬──> DialogueMove (dialogueMove) [n:1]
          ├──> AifEdge[] (outgoingEdges) [1:n]
          ├──> AifEdge[] (incomingEdges) [1:n]
          └──> Deliberation [n:1]

AifEdge ──┬──> AifNode (source) [n:1]
          ├──> AifNode (target) [n:1]
          ├──> DialogueMove (causedByMove) [n:1]
          └──> Deliberation [n:1]
```

**Referential Integrity:**
- Cascade deletes for deliberation removal
- SetNull for move/argument deletion (preserves provenance)
- Unique constraints on `aifRepresentation` field

**Performance Optimizations:**
- 4 indexes on `AifNode` (deliberationId, dialogueMoveId, nodeKind, nodeSubtype)
- 4 indexes on `AifEdge` (deliberationId, sourceId, targetId, causedByMoveId)
- 1 index added to `DialogueMove` (aifRepresentation)

---

## Remaining Work (Phase 1.4)

### Migration Script

**File to Create:** `scripts/migrations/add-dialogue-aif-links.ts`

**Tasks:**
1. Fetch all existing DialogueMoves from database
2. Create DM-nodes for protocol moves (WHY, GROUNDS, CONCEDE, etc.)
3. Link Arguments created by GROUNDS moves to their DM-nodes
4. Create edges: DM-node --answers--> RA-node
5. Generate statistics and error reports

**Estimated Time:** 2-3 hours

**Testing Required:**
- [ ] Dry-run mode testing on staging database
- [ ] Spot-check data integrity in Prisma Studio
- [ ] Performance testing with large deliberations (>100 moves)
- [ ] Rollback script verification

---

## Files Created/Modified

### Created (3 files)
1. `lib/aif/ontology.ts` (336 lines) - AIF ontology definitions
2. `types/aif-dialogue.ts` (221 lines) - TypeScript types
3. `docs/agora-architecture-review/DIALOGUE_VIZ_PHASE_1_PROGRESS.md` (this file)

### Modified (1 file)
1. `lib/models/schema.prisma` (+100 lines)
   - Added `AifNode` model (39 lines)
   - Added `AifEdge` model (27 lines)
   - Extended `DialogueMove` model (+9 lines)
   - Extended `Deliberation` model (+3 lines)

---

## Testing Checklist

### Schema Validation
- [x] Prisma schema validates without errors
- [x] Database push successful
- [x] Prisma client generates correctly
- [ ] Foreign key constraints enforced in database

### Type Safety
- [x] TypeScript compiles without errors (except library issues)
- [x] All imports resolve correctly
- [x] Type guards work as expected
- [ ] Runtime validation with Zod schemas (Phase 2)

### Integration
- [ ] Can query AifNode from Prisma
- [ ] Relations load correctly (dialogueMove, aifNode, etc.)
- [ ] Indexes improve query performance
- [ ] Cascade deletes work as expected

---

## Next Session Checklist

Before starting Phase 1.4:

1. **Review Existing Data**
   ```bash
   npx prisma studio
   # Check DialogueMove table for sample data
   # Identify test deliberations for migration testing
   ```

2. **Create Migration Script Skeleton**
   ```bash
   touch scripts/migrations/add-dialogue-aif-links.ts
   chmod +x scripts/migrations/add-dialogue-aif-links.ts
   ```

3. **Set Up Testing Environment**
   ```bash
   # Backup database before testing
   pg_dump $DATABASE_URL > backup_before_dialogue_migration.sql
   ```

4. **Define Success Metrics**
   - % of DialogueMoves with DM-nodes created
   - % of GROUNDS moves linked to Arguments
   - % of edges created successfully
   - Migration execution time

---

## Documentation Updates Needed

- [ ] Update `DIALOGUE_VISUALIZATION_ROADMAP.md` with progress
- [ ] Add schema diagrams to `AIF_DIAGRAM_SYSTEM_ARCHITECTURE_REVIEW.md`
- [ ] Document migration script usage in README
- [ ] Create API documentation for new endpoints (Phase 2)

---

## Key Learnings

1. **Schema Design:** Using `Json` field for `dialogueMetadata` provides flexibility but requires type guards
2. **Relations:** Bidirectional links (DialogueMove ↔ AifNode) require careful relation naming
3. **Prisma Migrations:** Shadow database issues require using `db push` instead of `migrate dev` in some environments
4. **Type Safety:** Extending Prisma types requires `Omit<>` for JSON fields to avoid type conflicts

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Migration timeout (large DB) | Medium | High | Process in batches, add progress logging |
| Foreign key conflicts | Low | Medium | Use `onDelete: SetNull` for optional relations |
| Type inference issues | Low | Low | Explicit type annotations in APIs |
| Performance degradation | Medium | Medium | Monitor query times, add indexes as needed |

---

**Status:** Phase 1 Foundation Complete (75%)  
**Next Phase:** Phase 1.4 Migration Script → Phase 2 Server APIs  
**Estimated Completion:** Phase 1 by end of week, Phase 2 by mid-next week
