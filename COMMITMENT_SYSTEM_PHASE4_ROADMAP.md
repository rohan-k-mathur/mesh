# Commitment System Phase 4: System Integration - Roadmap

**Date Started:** November 25, 2025  
**Status:** 🚧 In Progress  
**Estimated Duration:** 5-7 days  
**Purpose:** Bridge dialogue and ludics commitment systems, enable formal reasoning on public debates

---

## Prerequisites ✅

All prior phases completed:
- ✅ **Phase 1** (Critical Fixes): Schema mismatch, Redis caching, authorization checks
- ✅ **Phase 2** (Performance): Pagination, SQL optimization, monitoring  
- ✅ **Phase 3** (Advanced Features): Time-travel, diff view, export, visual indicators
- ✅ **Analytics Enhancement 1**: Commitment Analytics Dashboard with metrics, charts, consensus tracking
- ✅ **Analytics Enhancement 2**: Participant Agreement Matrix with coalition detection

---

## Overview

Phase 4 creates bridges between the two parallel commitment systems:
1. **Dialogue Commitment System** - Surface-level pragmatics (speech acts in discourse)
2. **Ludics Commitment System** - Deep-level semantics (proof-theoretic obligations)

**Goal:** Enable users to import dialogue commitments into the formal Ludics proof system while maintaining system separation.

---

## Option 1: Bridge Dialogue ↔ Ludics Commitments

**Priority:** 🔴 HIGH  
**Status:** ⏳ Not Started  
**Effort:** 2-3 days  
**Impact:** High - enables formal reasoning on public debates

### Rationale
Currently the two commitment systems are completely separate. Creating a bridge would allow users to:
- Import dialogue commitments into the formal Ludics proof system
- See both pragmatic (dialogue) and semantic (ludics) commitments side-by-side
- Enable formal reasoning on public debate claims
- Maintain system separation while providing opt-in integration

### Tasks

#### Task 1.1: Database Schema for Mapping Table
**Status:** ⏳ Not Started  
**Effort:** 2 hours

Create `CommitmentLudicMapping` model to link dialogue commitments to ludics commitments.

**Schema Definition:**
```prisma
model CommitmentLudicMapping {
  id                       String   @id @default(cuid())
  
  // Dialogue commitment reference
  dialogueCommitmentId     String
  deliberationId           String
  participantId            String
  proposition              String   @db.Text
  
  // Ludics commitment reference
  ludicCommitmentElementId String
  ludicOwnerId             String
  ludicLocusId             String
  
  // Metadata
  promotedAt               DateTime @default(now())
  promotedBy               String   // userId who clicked promote
  promotionContext         Json?    // Additional context (e.g., which panel)
  
  // Relations
  ludicCommitmentElement   LudicCommitmentElement @relation(fields: [ludicCommitmentElementId], references: [id], onDelete: Cascade)
  
  @@unique([dialogueCommitmentId, ludicCommitmentElementId])
  @@index([deliberationId, participantId])
  @@index([ludicOwnerId])
}
```

**Files to Modify:**
- `lib/models/schema.prisma` - Add model definition
- Run `npx prisma db push` to apply schema changes

**Acceptance Criteria:**
- [ ] Schema compiles without errors
- [ ] Can create mapping records via Prisma client
- [ ] Cascade delete works (deleting ludic element removes mapping)
- [ ] Unique constraint prevents duplicate mappings

---

#### Task 1.2: API Endpoint - POST /api/commitments/promote
**Status:** ⏳ Not Started  
**Effort:** 4 hours

Create endpoint to convert dialogue commitment → ludics commitment.

**Endpoint Specification:**
```typescript
POST /api/commitments/promote

Request Body:
{
  deliberationId: string;
  participantId: string;
  proposition: string;
  targetOwnerId: string;        // e.g., "Proponent", "Opponent"
  targetLocusPath?: string;     // Optional, defaults to root locus
  basePolarity: "pos" | "neg";  // Fact or rule
}

Response:
{
  ok: boolean;
  mapping: {
    id: string;
    dialogueCommitmentId: string;
    ludicCommitmentElementId: string;
    promotedAt: string;
  };
  ludicCommitment: {
    id: string;
    ownerId: string;
    basePolarity: string;
    label: string;
    locusPath: string;
  };
  error?: string;
}
```

**Implementation Steps:**
1. Validate request (auth, deliberation access, commitment exists)
2. Check if commitment already promoted (return existing mapping if so)
3. Find or create target locus in ludics system
4. Create `LudicCommitmentElement` with proposition as label
5. Create `CommitmentLudicMapping` record linking the two
6. Emit `dialogue:cs:refresh` and `ludics:cs:refresh` events
7. Return mapping + ludic commitment details

**Files to Create:**
- `app/api/commitments/promote/route.ts` - Endpoint implementation

**Dependencies:**
- Use `applyToCS()` from `packages/ludics-engine/commitments.ts`
- Use `ensureLocus()` helper to create locus if needed
- Use existing Prisma models

**Error Handling:**
- 401: Unauthorized (not logged in)
- 403: Forbidden (no access to deliberation)
- 404: Commitment not found
- 409: Already promoted (return existing mapping)
- 400: Invalid polarity or ownerId

**Acceptance Criteria:**
- [ ] Successfully creates ludic commitment from dialogue commitment
- [ ] Creates mapping record linking the two
- [ ] Handles duplicate promotion requests (idempotent)
- [ ] Validates user has access to deliberation
- [ ] Emits events for UI refresh
- [ ] Returns complete mapping details

---

#### Task 1.3: UI - Add "Promote to Ludics" Button
**Status:** ⏳ Not Started  
**Effort:** 4 hours

Add promotion UI to `CommitmentStorePanel.tsx`.

**Design Spec:**
- Show "Promote to Ludics" button next to each active commitment
- Button states:
  - Default: "Promote to Ludics" (primary button)
  - Promoted: "Promoted ✓" (disabled, success style)
  - Loading: Spinner + "Promoting..."
- Clicking opens modal:
  - Select target owner (dropdown: Proponent/Opponent/Custom)
  - Select polarity (radio: Fact/Rule)
  - Optional: Select target locus (tree picker)
  - Confirm/Cancel buttons

**Modal Component:**
```tsx
<PromoteToLudicsModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  deliberationId={deliberationId}
  commitment={{
    participantId: commitment.participantId,
    proposition: commitment.claimText,
    claimId: commitment.claimId
  }}
  onSuccess={(mapping) => {
    toast.success("Promoted to Ludics!");
    refreshCommitments();
  }}
/>
```

**Files to Modify:**
- `components/aif/CommitmentStorePanel.tsx` - Add button + modal trigger

**Files to Create:**
- `components/aif/PromoteToLudicsModal.tsx` - Modal component

**Acceptance Criteria:**
- [ ] Button appears next to each active commitment
- [ ] Modal opens with correct commitment data pre-filled
- [ ] Successfully calls `/api/commitments/promote`
- [ ] Shows loading state during API call
- [ ] Shows success toast on completion
- [ ] Button changes to "Promoted ✓" after success
- [ ] Emits `dialogue:cs:refresh` event

---

#### Task 1.4: UI - Show Promotion Status
**Status:** ⏳ Not Started  
**Effort:** 3 hours

Indicate which commitments have been promoted to ludics.

**Implementation:**
1. Update `getCommitmentStores()` to join with `CommitmentLudicMapping`
2. Add `isPromoted: boolean` and `promotedAt?: Date` to `CommitmentRecord` type
3. Show badge on promoted commitments: "🔗 Promoted to Ludics"
4. Tooltip shows: "Promoted to [ownerId] as [fact/rule] on [date]"
5. Add filter toggle: "Show only promoted" / "Show only unpromoted"

**Visual Design:**
- Badge: Small blue pill badge "🔗 Ludics" next to claim text
- Hover: Tooltip with promotion details
- Filter: Dropdown above commitment list

**Files to Modify:**
- `lib/aif/graph-builder.ts` - Update `getCommitmentStores()` to include promotion status
- `components/aif/CommitmentStorePanel.tsx` - Display promotion badges

**Acceptance Criteria:**
- [ ] Promoted commitments show badge
- [ ] Badge tooltip shows promotion metadata
- [ ] Filter works correctly
- [ ] Performance impact minimal (use JOIN, not N+1 queries)

---

### Testing Checklist (Option 1)

**Unit Tests:**
- [ ] CommitmentLudicMapping model CRUD operations
- [ ] `/api/commitments/promote` endpoint with valid inputs
- [ ] `/api/commitments/promote` error cases (401, 403, 404, 409)
- [ ] Idempotency (promoting same commitment twice)

**Integration Tests:**
- [ ] End-to-end: Create dialogue commitment → Promote → Verify ludic element exists
- [ ] Verify mapping record created correctly
- [ ] Verify events emitted (`dialogue:cs:refresh`, `ludics:cs:refresh`)
- [ ] Verify UI updates after promotion

**Manual Testing:**
- [ ] Create dialogue move (ASSERT)
- [ ] Open CommitmentStorePanel
- [ ] Click "Promote to Ludics"
- [ ] Select owner, polarity, confirm
- [ ] Verify success toast
- [ ] Verify badge shows "Promoted ✓"
- [ ] Open Ludics panel → Verify commitment appears
- [ ] Try promoting same commitment again → Should show already promoted

---

## Option 2: Unified Commitment Dashboard

**Priority:** 🟡 MEDIUM  
**Status:** ⏳ Not Started  
**Effort:** 2-3 days  
**Impact:** Medium - improves UX for power users

### Rationale
Expert users currently need to check multiple places to see all commitment activity:
- CommitmentStorePanel (dialogue)
- LudicsPanel (ludics)
- EntailmentWidget (ludics derived facts)

A unified dashboard provides a single view of all commitments.

### Tasks

#### Task 2.1: Create UnifiedCommitmentDashboard Component
**Status:** ⏳ Not Started  
**Effort:** 6 hours

Build main dashboard component showing both systems.

**Component Structure:**
```tsx
<UnifiedCommitmentDashboard
  deliberationId={deliberationId}
  participantId={currentUserId}
>
  <Tabs>
    <Tab label="Dialogue Commitments">
      <DialogueCommitmentView />
    </Tab>
    <Tab label="Ludics Commitments">
      <LudicsCommitmentView />
    </Tab>
    <Tab label="Unified View">
      <SideBySideView />
    </Tab>
    <Tab label="Cross-References">
      <SharedPropositionsView />
    </Tab>
  </Tabs>
</UnifiedCommitmentDashboard>
```

**Files to Create:**
- `components/aif/UnifiedCommitmentDashboard.tsx` - Main component

**Acceptance Criteria:**
- [ ] Shows both dialogue and ludics commitments
- [ ] Tabs work correctly
- [ ] Responsive layout
- [ ] Handles loading states

---

#### Task 2.2: Cross-Reference Shared Propositions
**Status:** ⏳ Not Started  
**Effort:** 4 hours

Identify and display propositions that appear in both systems.

**Algorithm:**
1. Fetch dialogue commitments (propositions)
2. Fetch ludics commitments (labels)
3. Fuzzy match propositions ↔ labels (Levenshtein distance < 0.2)
4. Display matches with links to both systems

**Files to Create:**
- `lib/aif/commitment-matching.ts` - Matching logic

**Acceptance Criteria:**
- [ ] Correctly identifies matching propositions
- [ ] Shows count of shared propositions
- [ ] Handles exact matches and fuzzy matches separately

---

#### Task 2.3: Visualize Derivation Chains
**Status:** ⏳ Not Started  
**Effort:** 6 hours

Show how ludics commitments derive from dialogue commitments.

**Visualization:**
- Tree view: Root = dialogue commitment → Branches = ludics derivations
- Interactive: Click node to see details
- Color-coded: Facts (blue), Rules (green), Derived (purple)

**Files to Create:**
- `components/aif/DerivationChainView.tsx` - Visualization component

**Acceptance Criteria:**
- [ ] Displays derivation tree correctly
- [ ] Interactive navigation works
- [ ] Handles circular dependencies gracefully

---

### Testing Checklist (Option 2)

**Integration Tests:**
- [ ] Dashboard loads both systems' data
- [ ] Cross-reference matching works
- [ ] Derivation chain rendering correct

**Manual Testing:**
- [ ] Open unified dashboard
- [ ] Switch between tabs
- [ ] Verify data accuracy across all views

---

## Option 3: Commitment Provenance Chain

**Priority:** 🟡 MEDIUM  
**Status:** ⏳ Not Started  
**Effort:** 3-4 days  
**Impact:** Medium - improves transparency and explainability

### Rationale
Users can't currently see why a commitment exists or how it was derived. This feature adds full provenance tracking.

### Tasks

#### Task 3.1: Extend Commitment Model with Provenance
**Status:** ⏳ Not Started  
**Effort:** 2 hours

Add `provenanceChain` JSON field to track commitment history.

**Schema Addition:**
```prisma
model Commitment {
  // ... existing fields ...
  provenanceChain Json?  // { origin: "move", moveId: "...", derivedFrom: [...] }
}
```

**Provenance Schema:**
```typescript
interface ProvenanceChain {
  origin: "move" | "inference" | "promotion";
  moveId?: string;              // If from dialogue move
  inferenceRuleId?: string;     // If from ludics inference
  promotionMappingId?: string;  // If promoted from dialogue
  derivedFrom: ProvenanceChain[]; // Recursive chain
  timestamp: string;
  metadata?: Record<string, any>;
}
```

**Files to Modify:**
- `lib/models/schema.prisma` - Add field
- Run `npx prisma db push`

**Acceptance Criteria:**
- [ ] Field added to schema
- [ ] Can store provenance JSON
- [ ] TypeScript types defined

---

#### Task 3.2: Track Provenance on Commitment Creation
**Status:** ⏳ Not Started  
**Effort:** 4 hours

Update commit creation logic to populate provenance.

**Files to Modify:**
- `app/api/dialogue/move/route.ts` - Add provenance when creating commitment
- `app/api/commitments/apply/route.ts` - Add provenance for ludics commitments
- `app/api/commitments/promote/route.ts` - Add provenance for promoted commitments

**Acceptance Criteria:**
- [ ] Dialogue moves record moveId in provenance
- [ ] Ludics inference records rule ID
- [ ] Promoted commitments record mapping ID

---

#### Task 3.3: Display Provenance Tree in UI
**Status:** ⏳ Not Started  
**Effort:** 6 hours

Create expandable tree view showing provenance chain.

**Component:**
```tsx
<ProvenanceTreeView
  commitment={commitment}
  onNodeClick={(node) => navigateToSource(node)}
/>
```

**Files to Create:**
- `components/aif/ProvenanceTreeView.tsx` - Tree visualization

**Acceptance Criteria:**
- [ ] Displays tree correctly
- [ ] Expandable/collapsible nodes
- [ ] Click navigates to source

---

#### Task 3.4: "Why do I have this commitment?" Feature
**Status:** ⏳ Not Started  
**Effort:** 4 hours

Add tooltip/modal explaining commitment origin.

**UI Design:**
- Tooltip icon (ℹ️) next to each commitment
- Click opens modal:
  - "You have this commitment because..."
  - Shows provenance chain in natural language
  - Links to original moves/rules

**Files to Modify:**
- `components/aif/CommitmentStorePanel.tsx` - Add tooltip icon

**Files to Create:**
- `components/aif/CommitmentExplanationModal.tsx` - Modal component

**Acceptance Criteria:**
- [ ] Tooltip appears on all commitments
- [ ] Modal shows clear explanation
- [ ] Links work correctly

---

### Testing Checklist (Option 3)

**Unit Tests:**
- [ ] Provenance chain serialization/deserialization
- [ ] Provenance tree traversal logic

**Integration Tests:**
- [ ] Creating commitment populates provenance
- [ ] Provenance chain preserved across updates

**Manual Testing:**
- [ ] Create dialogue move → Check provenance recorded
- [ ] Click ℹ️ icon → Verify explanation clear
- [ ] Navigate to source → Verify correct navigation

---

## Option 4: Contradiction Detection for Dialogue Layer

**Priority:** 🔴 HIGH  
**Status:** ⏳ Not Started  
**Effort:** 2-3 days  
**Impact:** High - catches logical errors in real-time

### Rationale
Ludics has contradiction detection via `interactCE()`, but dialogue layer doesn't. This creates inconsistent UX and misses opportunities to help users avoid logical errors.

### Tasks

#### Task 4.1: Port interactCE() Logic to Dialogue
**Status:** ⏳ Not Started  
**Effort:** 6 hours

Adapt Ludics contradiction detection for dialogue commitments.

**Algorithm:**
1. Parse active commitments into positive/negative sets
2. Detect negations in text:
   - Explicit: "not X", "¬X", "~X"
   - Semantic: "X is false", "X is untrue"
3. Check for contradictions: X ∧ ¬X
4. Return list of contradictory pairs

**Implementation:**
```typescript
// lib/aif/dialogue-contradictions.ts

interface Contradiction {
  claimA: { id: string; text: string; };
  claimB: { id: string; text: string; };
  reason: string; // "Direct negation" | "Semantic opposition"
  confidence: number; // 0-1 score
}

export function detectDialogueContradictions(
  commitments: CommitmentRecord[]
): Contradiction[] {
  // Implementation
}
```

**Files to Create:**
- `lib/aif/dialogue-contradictions.ts` - Detection logic

**Negation Parsing Rules:**
- Prefix: "not ", "no ", "¬", "~", "!"
- Suffix: " is false", " is untrue", " is incorrect"
- Modal: "cannot ", "should not ", "must not "

**Acceptance Criteria:**
- [ ] Detects exact negations ("X" vs "not X")
- [ ] Detects semantic negations ("X is true" vs "X is false")
- [ ] Returns confidence scores
- [ ] Handles edge cases (double negation, nested)

---

#### Task 4.2: API Endpoint - GET /api/dialogue/contradictions
**Status:** ⏳ Not Started  
**Effort:** 3 hours

Create endpoint to check contradictions for a participant.

**Endpoint Specification:**
```typescript
GET /api/dialogue/contradictions?deliberationId={id}&participantId={id}

Response:
{
  ok: boolean;
  contradictions: Contradiction[];
  metadata: {
    totalCommitments: number;
    contradictionCount: number;
    checkedAt: string;
  };
}
```

**Files to Create:**
- `app/api/dialogue/contradictions/route.ts` - Endpoint

**Acceptance Criteria:**
- [ ] Returns contradictions for participant
- [ ] Caches results (5 min TTL)
- [ ] Handles empty result gracefully

---

#### Task 4.3: Real-Time Alert UI
**Status:** ⏳ Not Started  
**Effort:** 5 hours

Show warnings when user commits to contradictory claims.

**UX Flow:**
1. User creates ASSERT move for claim X
2. System checks if X contradicts existing commitments
3. If contradiction found:
   - Show modal: "⚠️ Warning: Potential Contradiction"
   - Display: "You previously committed to [Y], which may contradict [X]"
   - Options: "Commit Anyway" | "Retract [Y]" | "Cancel"
4. User chooses action

**Component:**
```tsx
<ContradictionWarningModal
  isOpen={showWarning}
  commitment={newCommitment}
  contradictions={detectedContradictions}
  onConfirm={() => commitAnyway()}
  onRetract={(commitmentId) => retractExisting(commitmentId)}
  onCancel={() => cancelMove()}
/>
```

**Files to Create:**
- `components/aif/ContradictionWarningModal.tsx` - Modal component

**Files to Modify:**
- `app/api/dialogue/move/route.ts` - Check contradictions before creating move
- `components/aif/CommitmentStorePanel.tsx` - Show contradiction alerts

**Acceptance Criteria:**
- [ ] Modal appears when contradiction detected
- [ ] Shows clear explanation of conflict
- [ ] All action buttons work correctly
- [ ] Can bypass warning if intentional

---

#### Task 4.4: Contradiction Indicator in UI
**Status:** ⏳ Not Started  
**Effort:** 3 hours

Show persistent indicators for existing contradictions.

**Visual Design:**
- Red warning icon (⚠️) next to contradictory commitments
- Tooltip: "This may contradict your commitment to [X]"
- Summary badge: "2 contradictions detected" at top of panel
- Click to expand list of contradictions

**Files to Modify:**
- `components/aif/CommitmentStorePanel.tsx` - Add indicators

**Acceptance Criteria:**
- [ ] Warning icons appear correctly
- [ ] Tooltip shows related commitment
- [ ] Summary badge accurate
- [ ] Click expands full list

---

### Testing Checklist (Option 4)

**Unit Tests:**
- [ ] Negation parsing (all formats)
- [ ] Contradiction detection (various cases)
- [ ] Edge cases (double negation, "not not X")

**Integration Tests:**
- [ ] API endpoint returns correct contradictions
- [ ] Warning modal triggered at right time
- [ ] Retract action resolves contradiction

**Manual Testing:**
- [ ] Commit to "X is true"
- [ ] Try to commit to "X is false"
- [ ] Verify warning modal appears
- [ ] Test all action buttons
- [ ] Verify indicators show correctly

---

## Success Metrics

**Option 1 (Bridge):**
- [ ] At least 10% of dialogue commitments promoted to ludics in first week
- [ ] Zero errors in promotion workflow
- [ ] Mapping table maintains referential integrity

**Option 2 (Dashboard):**
- [ ] Dashboard loads in < 500ms with 100+ commitments
- [ ] Cross-reference matching accuracy > 90%
- [ ] Users report finding unified view helpful (survey)

**Option 3 (Provenance):**
- [ ] Provenance chain displayed for 100% of commitments
- [ ] "Why do I have this?" feature used by > 20% of users
- [ ] Navigation to source works in all cases

**Option 4 (Contradictions):**
- [ ] Contradiction detection accuracy > 85%
- [ ] False positive rate < 10%
- [ ] At least 50% of contradictions resolved via warning modal
- [ ] User satisfaction with feature > 4/5 stars

---

## Implementation Order

Based on priority and dependencies:

1. **Week 1:**
   - Option 1: Bridge Dialogue ↔ Ludics (Tasks 1.1-1.4)
   - Start Option 4: Contradiction Detection (Task 4.1)

2. **Week 2:**
   - Complete Option 4: Contradiction Detection (Tasks 4.2-4.4)
   - Start Option 2: Unified Dashboard (Task 2.1)

3. **Week 3 (if time permits):**
   - Complete Option 2: Unified Dashboard (Tasks 2.2-2.3)
   - Start Option 3: Provenance Chain (Tasks 3.1-3.2)

---

## Rollback Plan

If any feature causes issues:

**Option 1 (Bridge):**
- Remove "Promote to Ludics" button from UI
- Keep mapping table (no harm in empty table)
- Disable `/api/commitments/promote` endpoint

**Option 2 (Dashboard):**
- Hide dashboard from UI
- No database changes to rollback

**Option 3 (Provenance):**
- Provenance field optional, can be null
- UI degrades gracefully if field empty

**Option 4 (Contradictions):**
- Add feature flag: `ENABLE_CONTRADICTION_DETECTION`
- Disable warning modal via flag
- Keep detection logic (no harm in unused code)

---

## Documentation Updates Needed

**User Documentation:**
- [ ] "How to promote commitments to Ludics" guide
- [ ] "Understanding contradictions" explainer
- [ ] "Using the unified dashboard" tutorial
- [ ] "Commitment provenance" reference

**Developer Documentation:**
- [ ] API reference for new endpoints
- [ ] Mapping table schema documentation
- [ ] Contradiction detection algorithm explanation
- [ ] Event bus updates (`ludics:cs:refresh`)

---

## Related Documents

- [COMMITMENT_SYSTEM_COMPREHENSIVE_AUDIT.md](./COMMITMENT_SYSTEM_COMPREHENSIVE_AUDIT.md) - Original audit
- [COMMITMENT_SYSTEM_PHASE1_COMPLETE.md](./COMMITMENT_SYSTEM_PHASE1_COMPLETE.md) - Critical fixes
- [COMMITMENT_SYSTEM_PHASE2_COMPLETE.md](./COMMITMENT_SYSTEM_PHASE2_COMPLETE.md) - Performance optimizations
- [COMMITMENT_SYSTEM_PHASE3_COMPLETE.md](./COMMITMENT_SYSTEM_PHASE3_COMPLETE.md) - Advanced features
- [PARTICIPANT_AGREEMENT_MATRIX_IMPLEMENTATION.md](./PARTICIPANT_AGREEMENT_MATRIX_IMPLEMENTATION.md) - Analytics enhancement

---

**Phase 4 Status:** 🚧 Ready to Start  
**Next Action:** Begin Option 1, Task 1.1 (Database Schema)

*Last Updated: November 25, 2025*
