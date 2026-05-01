# Commitment Store System - End-to-End Audit

**Date**: November 22, 2025  
**Status**: 🔍 Audit in Progress  
**Purpose**: Comprehensive review of commitment tracking system integration

---

## Executive Summary

The Commitment Store system tracks participant commitments (claims asserted, conceded, retracted) across formal dialogue games in deliberations. This audit examines the end-to-end wiring, database schema, API endpoints, UI components, and integration with other Mesh systems.

---

## 1. Database Schema

### Primary Model: `Commitment`
**Location**: `lib/models/schema.prisma:4153`

```prisma
model Commitment {
  id             String   @id @default(cuid())
  deliberationId String
  participantId  String
  proposition    String   @db.Text
  locusPath      String?  // ✅ Field exists (verified in production code)
  isRetracted    Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([deliberationId, participantId, proposition])
  @@index([deliberationId, participantId])
}
```

**Purpose**: Simple key-value store tracking participant propositions  
**Indexes**: Composite index on `(deliberationId, participantId)` for fast queries  
**Unique Constraint**: One commitment record per (deliberation, participant, proposition) tuple  
**Status**: ✅ Schema is correct and complete

### Related Models: Ludics Commitments

#### `LudicCommitmentElement`
**Location**: `lib/models/schema.prisma:4710`
- Tracks commitments in Ludics/game-theoretic framework
- Separate from dialogue-based Commitment model

#### `LudicCommitmentState`
**Location**: `lib/models/schema.prisma:4729`
- Aggregates ludics commitment elements per owner
- Parallel commitment tracking system

---

## 2. API Endpoints

### GET `/api/dialogue/commitments`
**File**: `app/api/dialogue/commitments/route.ts`  
**Purpose**: Fetch active commitments grouped by participant  
**Query Params**:
- `deliberationId` (required): Filter by deliberation

**Response Shape**:
```typescript
{
  ok: true,
  commitments: {
    [participantId: string]: Array<{
      proposition: string;
      locusPath?: string | null;
      createdAt: string;
    }>
  }
}
```

**Implementation**:
- Queries `Commitment` table with `isRetracted: false`
- Groups by `participantId`
- Orders by `createdAt` ascending
- ⚠️ **Gap**: No pagination (could be problematic for long deliberations)
- ⚠️ **Gap**: References `locusPath` field not defined in schema

### GET `/api/aif/dialogue/[deliberationId]/commitments`
**File**: `app/api/aif/dialogue/[deliberationId]/commitments/route.ts`  
**Purpose**: Fetch commitment stores with dialogue move provenance  
**Query Params**:
- `participantId` (optional): Filter to specific participant
- `asOf` (optional): Get commitments as of timestamp

**Response Shape**:
```typescript
Array<{
  participantId: string;
  participantName: string;
  commitments: Array<{
    claimId: string;
    claimText: string;
    moveId: string;
    moveKind: "ASSERT" | "CONCEDE" | "RETRACT";
    timestamp: string;
    isActive: boolean;
  }>;
}>
```

**Implementation**:
- Uses `getCommitmentStores()` from `lib/aif/graph-builder.ts`
- Derives commitments from `DialogueMove` records
- ✅ **Strength**: Fully integrated with dialogue layer
- ⚠️ **Gap**: Authorization check present but doesn't verify user access level

### POST `/api/dialogue/answer-and-commit`
**File**: `app/api/dialogue/answer-and-commit/route.ts`  
**Purpose**: Submit dialogue response and update commitment store  
**Integration**: Calls `applyToCS()` from `packages/ludics-engine/commitments`

### POST `/api/dialogue/move`
**File**: `app/api/dialogue/move/route.ts` (lines 446-463)  
**Purpose**: Create dialogue moves and upsert commitments  
**Implementation**:
```typescript
await prisma.commitment.upsert({
  where: { /* unique constraint */ },
  update: { isRetracted: false },
  create: { /* new commitment */ }
});
```

---

## 3. Service Layer

### `getCommitmentStores()`
**File**: `lib/aif/graph-builder.ts:500`  
**Purpose**: Build commitment stores from DialogueMove history

**Algorithm**:
1. Fetch all DialogueMoves for deliberation (filtered by participant/time)
2. Fetch all Claims referenced by moves
3. Lookup user names for participant IDs
4. Process moves chronologically:
   - `ASSERT`, `CONCEDE`, `THEREFORE` → Add to commitment store
   - `RETRACT` → Mark previous commitments inactive, add retraction record
5. Track active commitments per participant in Set
6. Return array of ParticipantCommitments

**Data Flow**:
```
DialogueMove (source of truth)
  ↓
getCommitmentStores() (derive commitments)
  ↓
API endpoint /api/aif/dialogue/[deliberationId]/commitments
  ↓
CommitmentStorePanel (UI)
```

**✅ Strengths**:
- Single source of truth (DialogueMove table)
- Handles retractions correctly
- Chronological ordering preserved
- Active/inactive status computed accurately

**⚠️ Gaps**:
- No caching (recomputes on every request)
- No incremental updates (full scan every time)
- No support for `asOf` parameter implementation
- User name lookup requires separate query

---

## 4. UI Components

### `CommitmentStorePanel`
**File**: `components/aif/CommitmentStorePanel.tsx`  
**Purpose**: Display per-participant commitment tracking

**Features**:
- ✅ Per-participant tabs
- ✅ Color-coded commits (ASSERT=sky, CONCEDE=green, RETRACT=red)
- ✅ Active vs retracted visual distinction
- ✅ Timeline view option
- ✅ Statistics (active count, retracted count)
- ✅ Tooltips with move timestamps
- ✅ Click handlers for claim navigation

**Props**:
```typescript
{
  stores: CommitmentStore[];
  onClaimClick?: (claimId: string) => void;
  showTimeline?: boolean;
  className?: string;
}
```

**Usage Locations**: 
- ✅ **DialogueAwareGraphPanel** (`components/aif/DialogueAwareGraphPanel.tsx:243-275`)
  - Shows CommitmentStorePanel when `showCommitmentStore={true}` and dialogue layer enabled
  - Fetches data from `/api/aif/dialogue/[deliberationId]/commitments`
  - Conditionally rendered based on `controlState.showDialogue`
  - Handles loading/error states
  - Shows empty state: "No commitments found. Participants haven't made any ASSERT, CONCEDE, or THEREFORE moves yet."

- ✅ **DeepDivePanelV2** (`components/deepdive/DeepDivePanelV2.tsx`)
  - Uses DialogueAwareGraphPanel in two locations (lines 754, 1344)
  - Props: `initialShowDialogue={true}` (dialogue layer enabled by default)
  - Props: `highlightMoveId={delibState.highlightedDialogueMoveId}` (navigation support)
  - Renders with AFLens graph visualization

**Integration Status**: ✅ **FULLY INTEGRATED** in production interface
- Accessible via DeepDivePanelV2 (main deliberation view)
- Dialogue layer enabled by default
- Commitment stores display below graph visualization
- Users can toggle dialogue visibility via DialogueControls

---

## 5. Integration Analysis

### DialogueMove → Commitment Flow
```
User submits dialogue move
  ↓
POST /api/dialogue/move
  ↓
Create DialogueMove record
  ↓
Upsert Commitment record (if ASSERT/CONCEDE/RETRACT)
  ↓
Update isRetracted field
```

**✅ Integrated**: DialogueMove automatically updates Commitment table

### AIF Graph Integration
```
buildDialogueAwareGraph()
  ↓
Includes dialogueMoveId on nodes
  ↓
getCommitmentStores() can derive from same moves
  ↓
Commitment visualization alongside AIF graph
```

**✅ Integrated**: Commitment stores can be rendered with AIF graphs

### Arguments/Claims Integration
**⚠️ Partial Integration**:
- Commitments reference Claims via `targetType="claim"` and `targetId`
- Arguments are NOT directly tracked in commitments
- Arguments linked to claims indirectly via conclusion/premise relationships

### Ludics Integration
**🔀 Parallel System**:
- `LudicCommitmentElement` and `LudicCommitmentState` are separate models
- Different API endpoints (`/api/commitments/*`)
- Purpose: Game-theoretic commitment tracking (separate from dialogue commitments)
- ⚠️ **Gap**: No bridge between dialogue commitments and ludics commitments

---

## 6. Identified Gaps & Issues

### Critical Gaps

1. ~~**Schema Mismatch**~~ **RESOLVED**:
   - ✅ `locusPath` field exists in schema (verified in actual usage)
   - Note: Original audit was incorrect - field exists
   - No action needed

2. ~~**No UI Integration**~~ **RESOLVED**:
   - ✅ CommitmentStorePanel IS integrated via DialogueAwareGraphPanel
   - ✅ Used in DeepDivePanelV2 (main deliberation interface)
   - ✅ Shows when dialogue layer enabled (`showCommitmentStore={true}`)
   - ⚠️ **Remaining issue**: Depends on dialogue layer being enabled by user
   - Impact: Users may not discover commitment tracking feature
   - Recommendation: Add onboarding tooltip or default-enable dialogue layer

3. **Performance Issues**:
   - ❌ No caching on `getCommitmentStores()` (recomputes every request)
   - ❌ No pagination on `/api/dialogue/commitments`
   - Impact: Slow performance for large deliberations
   - Fix: Implement Redis caching or materialized view

4. **Duplicate Systems**:
   - ⚠️ Two separate commitment systems (dialogue vs ludics)
   - Impact: Confusion, potential data inconsistency
   - Fix: Clarify purpose, document differences, or merge

### Minor Gaps

5. **Missing Features**:
   - ⏳ `asOf` parameter not implemented in `getCommitmentStores()`
   - ⏳ No filtering by move kind (ASSERT vs CONCEDE vs RETRACT)
   - ⏳ No export functionality
   - ⏳ No diff view between participants

6. **Authorization**:
   - ⚠️ `/api/aif/dialogue/[deliberationId]/commitments` checks auth but not access level
   - Impact: Users might see commitments for private deliberations
   - Fix: Add deliberation membership check

7. **Data Quality**:
   - ⚠️ No validation that `targetId` references valid Claim
   - ⚠️ No foreign key constraint from Commitment to Claim
   - Impact: Orphaned commitments possible
   - Fix: Add foreign key or validation logic

---

## 7. Recommendations

### ~~Phase 1: Critical Fixes~~ **NO LONGER NEEDED**

**Status**: Original audit identified two critical gaps that do not exist:
- ✅ Schema is complete (locusPath field exists)
- ✅ UI is fully integrated (CommitmentStorePanel used in DeepDivePanelV2)

### Phase 1 (Revised): Documentation & Discoverability (1 day)

**Task 1.1**: Update Documentation
- [ ] Document commitment store feature in user guide
- [ ] Add tooltip/help text to DialogueControls explaining commitment tracking
- [ ] Create example screenshot showing commitment store in action

**Task 1.2**: Clarify Dual System (CRITICAL)
- [ ] Document difference between `Commitment` and `LudicCommitment*` models
- [ ] Add schema comments explaining when to use each
- [ ] Update API documentation to clarify two separate systems

**Task 1.3**: Add Empty State Guidance
- [ ] Improve empty state message with actionable guidance
- [ ] Add link to dialogue move documentation
- [ ] Show example of how to make ASSERT/CONCEDE moves

### Phase 2: Performance & Reliability (2-3 days)

**Task 2.1**: Add Caching
- [ ] Implement Redis cache for `getCommitmentStores()`
- [ ] Cache invalidation on new DialogueMove
- [ ] TTL of 5 minutes for stale-while-revalidate

**Task 2.2**: Add Pagination
- [ ] Update `/api/dialogue/commitments` with limit/offset
- [ ] Cursor-based pagination for `/api/aif/dialogue/[id]/commitments`
- [ ] Frontend infinite scroll or pagination controls

**Task 2.3**: Implement `asOf` Parameter
- [ ] Filter DialogueMoves by `createdAt <= asOf`
- [ ] Add test cases for historical commitment views
- [ ] Document use case (replay dialogue state)

### Phase 3: Enhanced Features (3-5 days)

**Task 3.1**: Commitment Diff View
- [ ] Visual comparison of two participants' commitments
- [ ] Highlight agreements (both committed)
- [ ] Highlight disagreements (one retracted)
- [ ] Export diff as CSV

**Task 3.2**: Commitment Analytics
- [ ] Metrics: commitment rate, retraction rate, agreement percentage
- [ ] Timeline visualization of commitment changes
- [ ] Integration with existing analytics dashboard

**Task 3.3**: Foreign Key Constraints
- [ ] Add Claim relation to Commitment model
- [ ] Migration to add FK constraint
- [ ] Cascade delete behavior
- [ ] Test referential integrity

### Phase 4: Polish (1-2 days)

**Task 4.1**: Authorization Hardening
- [ ] Check deliberation membership in all commitment endpoints
- [ ] Add role-based access (viewer vs participant)
- [ ] Audit log for commitment views

**Task 4.2**: Documentation
- [ ] API documentation with examples
- [ ] Component documentation for CommitmentStorePanel
- [ ] Architecture diagram (DialogueMove → Commitment → UI)
- [ ] User guide for commitment tracking

---

## 8. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Actions                             │
└───────────────────┬──────────────────────────────┬──────────┘
                    │                               │
                    ▼                               ▼
        ┌──────────────────────┐       ┌──────────────────────┐
        │  POST /dialogue/move  │       │  GET /aif/dialogue/  │
        │                       │       │  [id]/commitments    │
        └──────────┬────────────┘       └──────────┬───────────┘
                   │                                │
                   ▼                                ▼
        ┌──────────────────────┐       ┌──────────────────────┐
        │   DialogueMove       │──────▶│ getCommitmentStores()│
        │   (source of truth)  │       │   (derive commits)   │
        └──────────┬────────────┘       └──────────┬───────────┘
                   │                                │
                   │                                │
                   ▼                                │
        ┌──────────────────────┐                   │
        │   Commitment table   │◀──────────────────┘
        │   (materialized view)│
        └──────────┬────────────┘
                   │
                   ▼
        ┌──────────────────────────────────────────┐
        │      CommitmentStorePanel                 │
        │  - Per-participant tabs                   │
        │  - Timeline view                          │
        │  - Active/retracted visual distinction    │
        └───────────────────────────────────────────┘
```

---

## 9. Testing Checklist

### Unit Tests
- [ ] `getCommitmentStores()` correctly processes ASSERT/CONCEDE/RETRACT
- [ ] Retraction marks previous commitments inactive
- [ ] Chronological ordering preserved
- [ ] Participant filtering works
- [ ] Edge case: Same claim asserted twice
- [ ] Edge case: Retract non-existent commitment

### Integration Tests
- [ ] POST /dialogue/move creates Commitment record
- [ ] GET /api/dialogue/commitments returns correct data
- [ ] GET /api/aif/dialogue/[id]/commitments returns DialogueMove-derived commits
- [ ] Authorization blocks unauthorized users
- [ ] Invalid deliberationId returns 404

### E2E Tests
- [ ] User submits ASSERT move → Commitment appears in UI
- [ ] User submits RETRACT move → Commitment marked inactive
- [ ] Multiple participants → Separate commitment stores
- [ ] Timeline view shows chronological commitment evolution

---

## 10. Related Systems

### Direct Dependencies
- ✅ DialogueMove (source of truth for AIF endpoint)
- ✅ Claim (referenced by commitments)
- ⚠️ User (for participant names, but no FK constraint)
- ⚠️ Deliberation (for filtering, but no FK constraint)

### Integration Points
- 🔄 AIF Graph (can visualize commitments alongside nodes)
- 🔄 Ludics Engine (parallel commitment system)
- 🔄 DebateTab (potential UI integration point)
- 🔄 Analytics (commitment metrics not yet integrated)

### Similar Components
- 📚 ArgumentActionsSheet (similar card-based UI)
- 📚 PropositionsList (similar list rendering)
- 📚 DebateSheetReader (similar participant-based views)

---

## 11. Open Questions

1. **Design Decision**: Should Commitment table be source of truth or derived view?
   - Current: Mixed (DialogueMove for AIF endpoint, Commitment for dialogue endpoint)
   - Recommendation: Make DialogueMove source of truth, Commitment as cache

2. **Ludics vs Dialogue**: What is the intended relationship?
   - Current: Completely separate systems
   - Options: (A) Merge, (B) Keep separate but document, (C) Deprecate one

3. **UI Placement**: Where should CommitmentStorePanel live?
   - Options: (A) DebateTab subtab, (B) Ludics tab, (C) Dedicated Commitments tab, (D) Modal/panel

4. **Scope**: Should arguments be tracked in commitments?
   - Current: Only propositions/claims
   - Use case: Track which arguments participant has committed to

---

**Status**: Audit complete, awaiting prioritization of improvement roadmap  
**Next Steps**: Review with team, prioritize fixes, create implementation plan  
**Owner**: TBD
