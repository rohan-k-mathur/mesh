# Debate Layer Phase 4 - Remaining Tasks

**Date:** November 3, 2025  
**Status:** Tasks 0, 1, 2 Complete ✅ | Tasks 3, 4 Remaining ⏳

---

## ✅ Completed Tasks

### Task 0: Backfill Deliberation → AgoraRoom → DebateSheet Chain
- ✅ Script created and run
- ✅ 10 AgoraRooms created
- ✅ 43 DebateSheets backfilled

### Task 1: Auto-generate DebateSheets
- ✅ `scripts/generate-debate-sheets.ts` created
- ✅ DebateNode creation with metadata (scheme, CQ, conflicts, preferences)
- ✅ DebateEdge creation from ConflictApplication (not ArgumentEdge)
- ✅ Fixed UnresolvedCQ population
- ✅ API endpoint `/api/sheets/generate` created

### Task 2: Enhance DebateSheetReader
- ✅ Scheme badges on nodes (SchemeBadge component)
- ✅ CQ status indicators (CQStatusIndicator with orange dot)
- ✅ Conflict count badges (AttackBadge with R/U/M breakdown)
- ✅ Preference badges (PreferenceBadge)
- ✅ Filter controls:
  - ✅ Filter by scheme dropdown
  - ✅ Show only nodes with open CQs checkbox
  - ✅ Show only conflicted nodes checkbox
  - ✅ Clear filters button
- ✅ `/api/sheets/[id]` includes `argumentId` field
- ✅ Fetch AIF metadata from `/api/deliberations/[id]/arguments/aif`
- ✅ Build argumentId → metadata lookup map
- ✅ Display all badges with real data

---

## ⏳ Remaining Tasks

### Task 3: Integrate AIF Neighborhoods
**Estimated time:** 3-4 hours

**Requirements:**
1. On DebateNode hover → fetch mini-neighborhood (depth=1)
2. Render as compact graph in hover card
3. Click → expand to full ArgumentActionsSheet

**Implementation Plan:**

#### 3.1 Create MiniNeighborhoodPreview Component
- Compact AIF diagram viewer (similar to AifDiagramViewerDagre but simplified)
- Shows only immediate neighbors (depth=1)
- Dimensions: ~300x200px for hover card
- Color-coded nodes (RA=blue, I=yellow, CA=red, PA=purple)
- Simplified layout (no complex dagre, just basic positioning)

#### 3.2 Enhance DebateSheetReader Node Rendering
- Add hover state detection
- Fetch neighborhood on hover: `/api/arguments/${argumentId}/neighborhood?depth=1`
- Show MiniNeighborhoodPreview in hover card/tooltip
- Debounce fetch (300ms delay to avoid excessive requests)

#### 3.3 Add Click-to-Expand
- Click on node → open ArgumentActionsSheet modal/panel
- Pass argumentId to ArgumentActionsSheet
- ArgumentActionsSheet shows full neighborhood with all controls

**Files to Modify:**
- `components/agora/DebateSheetReader.tsx` - Add hover/click handlers
- `components/aif/MiniNeighborhoodPreview.tsx` - NEW component
- `components/argument/ArgumentActionsSheet.tsx` - May need modal wrapper

**API Endpoint (already exists):**
- `/api/arguments/${argumentId}/neighborhood` - Returns AIF neighborhood

---

### Task 4: Add Dialogue Threading Visualization
**Estimated time:** 3-4 hours

**Requirements:**
1. Color-code edges by dialogue thread
2. Add timeline scrubber (show move order)
3. Group nodes by episode

**Implementation Plan:**

#### 4.1 Enhance DebateEdge with Dialogue Context
**Schema Enhancement:**
```prisma
model DebateEdge {
  // ... existing fields ...
  
  // Dialogue context
  dialogueMoveId String? // Link to DialogueMove that created this edge
  dialogueThread String? // Thread identifier (e.g., "episode-1")
  moveOrder      Int?    // Sequence in dialogue (1, 2, 3...)
  
  dialogueMove   DialogueMove? @relation(fields: [dialogueMoveId], references: [id])
}
```

#### 4.2 Update generate-debate-sheets.ts
- When creating DebateEdge, check if there's a corresponding DialogueMove
- Query: `DialogueMove` where `targetType='argument'` and `kind='ATTACK'`
- Populate `dialogueMoveId`, `moveOrder` fields
- Derive thread from move sequence

#### 4.3 Add Timeline Scrubber UI
Create `DialogueTimelineScrubber` component:
- Horizontal timeline showing move order
- Color-coded segments for different threads/episodes
- Click segment → highlight corresponding edges
- Slider to "replay" dialogue chronologically

#### 4.4 Color-Code Edges in DebateSheetReader
- Assign colors to threads: thread-1=blue, thread-2=green, thread-3=purple
- Render edges with thread color
- Add legend showing thread colors

#### 4.5 Group Nodes by Episode
- Add "Group by Episode" toggle
- Visually cluster nodes by when they entered dialogue
- Show episode labels (Episode 1, Episode 2, etc.)

**Files to Modify:**
- `lib/models/schema.prisma` - Add dialogue fields to DebateEdge
- `scripts/generate-debate-sheets.ts` - Populate dialogue context
- `components/agora/DebateSheetReader.tsx` - Add threading visualization
- `components/dialogue/DialogueTimelineScrubber.tsx` - NEW component

**API Enhancements:**
- `/api/sheets/[id]` - Include dialogue context in edge data
- `/api/dialogue/moves` - Query moves for edge correlation

---

## Priority & Recommendation

**Task 3 (AIF Neighborhoods):**
- **Priority:** HIGH
- **Value:** Enables seamless drill-down from debate-level to argument-level
- **User Impact:** Major usability improvement
- **Dependencies:** None (can start immediately)

**Task 4 (Dialogue Threading):**
- **Priority:** MEDIUM
- **Value:** Shows temporal evolution of debate
- **User Impact:** Nice-to-have for understanding dialogue flow
- **Dependencies:** Requires schema migration

**Recommendation:** 
1. Complete **Task 3 first** (no schema changes, immediate value)
2. Then decide if Task 4 is worth the migration effort

---

## Success Criteria

### Task 3:
- ✅ Hovering over DebateNode shows mini-neighborhood preview
- ✅ Preview renders in <500ms
- ✅ Click opens full ArgumentActionsSheet
- ✅ Works on all nodes with argumentId

### Task 4:
- ✅ Edges are color-coded by dialogue thread
- ✅ Timeline scrubber allows replay of dialogue
- ✅ Nodes can be grouped by episode
- ✅ Thread legend is visible and accurate

---

## Next Steps

**Immediate:**
1. Start Task 3.1: Create MiniNeighborhoodPreview component
2. Test with sample argumentId from existing deliberation

**After Task 3:**
1. Review Task 4 with user to decide if schema migration is desired
2. If yes → proceed with Task 4
3. If no → move to Phase 5 (AIF Neighborhood Enhancements)

---

**Estimated Total Remaining Time:** 6-8 hours (or 3-4 hours if skipping Task 4)
