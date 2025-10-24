# Phase 3 Complete: Backend API Implementation
## Issues System Integration - Clarification & NCM Review APIs

**Date**: October 23, 2025  
**Status**: Phase 3 Complete ✅  
**Next**: Phase 4 - UI Integration

---

## Summary

Phase 3 implemented the complete backend infrastructure for:
1. **Clarification Q&A workflow** - Authors can answer questions about their content
2. **NCM Review workflow** - Authors can approve/reject community defense responses
3. **Auto-issue creation** - Review issues automatically created when NCMs are submitted

---

## API Endpoints Created

### 1. Answer Clarification Request

**Endpoint**: `POST /api/deliberations/[id]/issues/[issueId]/answer`

**Purpose**: Allow content authors to answer clarification questions.

**Request Body**:
```json
{
  "answerText": "Here's the detailed answer to your question..."
}
```

**Authorization**:
- Only the assigned author (issue.assigneeId) can answer
- Must be a clarification kind issue

**Actions**:
- Updates issue with answerText, answeredById, answeredAt
- Closes the issue (state: closed)
- Emits `issues:changed` bus event

**Response**:
```json
{
  "ok": true,
  "issue": { /* updated issue object */ }
}
```

**File**: `app/api/deliberations/[id]/issues/[issueId]/answer/route.ts`

---

### 2. Approve Non-Canonical Move

**Endpoint**: `POST /api/deliberations/[id]/issues/[issueId]/approve-ncm`

**Purpose**: Approve a community defense response and execute it as canonical.

**Authorization**:
- Only the assigned author (issue.assigneeId) can approve
- Must be a community_defense kind issue
- Must have linked NCM (issue.ncmId)

**Actions**:
1. Updates NCM status to APPROVED
2. Records approvedBy and approvedAt
3. **TODO**: Execute as canonical move (placeholder for now)
4. Updates NCM to EXECUTED if canonical execution succeeds
5. Closes the issue with ncmStatus: EXECUTED or APPROVED
6. Emits `issues:changed` and `dialogue:changed` bus events

**Response**:
```json
{
  "ok": true,
  "approved": true,
  "executed": false,  // true when canonical execution is implemented
  "canonicalMoveId": null  // will contain ID when execution implemented
}
```

**File**: `app/api/deliberations/[id]/issues/[issueId]/approve-ncm/route.ts`

**Note**: The canonical execution logic is marked TODO - needs integration with your dialogue move system.

---

### 3. Reject Non-Canonical Move

**Endpoint**: `POST /api/deliberations/[id]/issues/[issueId]/reject-ncm`

**Purpose**: Reject a community defense response with feedback.

**Request Body**:
```json
{
  "reviewNotes": "Thanks for contributing, but this doesn't address the core issue because..."
}
```

**Authorization**:
- Only the assigned author (issue.assigneeId) can reject
- Must be a community_defense kind issue
- Must have linked NCM (issue.ncmId)

**Actions**:
1. Updates NCM status to REJECTED
2. Records rejectedBy, rejectedAt, rejectionReason
3. Closes the issue with ncmStatus: REJECTED
4. Stores reviewNotes in issue.reviewNotes
5. Emits `issues:changed` bus event

**Response**:
```json
{
  "ok": true,
  "rejected": true
}
```

**File**: `app/api/deliberations/[id]/issues/[issueId]/reject-ncm/route.ts`

---

## API Endpoints Modified

### 4. Issue Creation Endpoint

**Endpoint**: `POST /api/deliberations/[id]/issues/route.ts`

**Changes**:
- Extended `kind` enum to include `clarification` and `community_defense`
- Added optional fields:
  - `questionText` (for clarification kind)
  - `ncmId` (for community_defense kind)
  - `assigneeId` (for auto-assigning to authors)
- Auto-sets `ncmStatus: PENDING` for community_defense issues with ncmId

**New Request Body Fields**:
```typescript
{
  // ... existing fields ...
  kind?: "general" | "cq" | "moderation" | "evidence" | "structural" | 
         "governance" | "clarification" | "community_defense",
  questionText?: string,  // Required for clarification
  ncmId?: string,         // Required for community_defense
  assigneeId?: string,    // Author to review
}
```

**File**: `app/api/deliberations/[id]/issues/route.ts`

---

### 5. Non-Canonical Move Submission

**Endpoint**: `POST /api/non-canonical/submit/route.ts`

**Changes**:
Auto-creates a review issue for the content author after NCM creation.

**New Actions** (after NCM is created):
1. Creates Issue with:
   - `kind: community_defense`
   - `label: "Community Defense: [MOVE_TYPE]"`
   - `description: "Review community-submitted [move type]..."`
   - `assigneeId: authorId` (assigns to content author)
   - `ncmId: [created NCM ID]`
   - `ncmStatus: PENDING`
   - `state: pending`

2. Creates IssueLink:
   - Links issue to the target (argument/claim)
   - `targetType` and `targetId` from NCM
   - `role: related`

3. Logs creation for visibility

**Updated Response**:
```json
{
  "success": true,
  "ncmId": "ncm-uuid",
  "issueId": "issue-uuid",  // NEW: ID of created review issue
  "status": "PENDING",
  "message": "Your response has been submitted and is awaiting approval."
}
```

**File**: `app/api/non-canonical/submit/route.ts`

---

## Workflow Diagrams

### Clarification Request Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User clicks "Request Clarification" on ArgumentCard      │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. POST /api/deliberations/[id]/issues                      │
│    {                                                         │
│      kind: "clarification",                                  │
│      questionText: "How is X calculated?",                   │
│      assigneeId: [author ID],                                │
│      targets: [{ type: "argument", id: "arg123" }]           │
│    }                                                         │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Issue created in DB                                       │
│    - kind: clarification                                     │
│    - state: pending                                          │
│    - assigneeId: author                                      │
│    - questionText stored                                     │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Author sees issue in their dashboard                     │
│    "You have 1 pending clarification request"               │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Author submits answer                                     │
│    POST /api/deliberations/[id]/issues/[issueId]/answer     │
│    { answerText: "X is calculated by..." }                   │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Issue updated and closed                                  │
│    - answerText: "X is calculated by..."                     │
│    - answeredById: author ID                                 │
│    - answeredAt: timestamp                                   │
│    - state: closed                                           │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Original requester sees answer                           │
│    Q: "How is X calculated?"                                 │
│    A: "X is calculated by..." (by @author)                   │
└─────────────────────────────────────────────────────────────┘
```

### NCM Review Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Community member submits NCM                              │
│    POST /api/non-canonical/submit                            │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. NCM created in DB (status: PENDING)                       │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. AUTO: Review issue created                                │
│    - kind: community_defense                                 │
│    - assigneeId: content author                              │
│    - ncmId: [NCM ID]                                         │
│    - ncmStatus: PENDING                                      │
│    - state: pending                                          │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Author sees review request in dashboard                   │
│    "You have 1 pending community defense review"             │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
            ┌──────┴──────┐
            ↓             ↓
┌──────────────────┐ ┌──────────────────────────────────────┐
│ 5a. APPROVE      │ │ 5b. REJECT                           │
│ POST approve-ncm │ │ POST reject-ncm                      │
└────────┬─────────┘ └──────────┬───────────────────────────┘
         ↓                      ↓
┌────────────────────┐ ┌───────────────────────────────────┐
│ NCM: APPROVED      │ │ NCM: REJECTED                     │
│ (→ EXECUTED)       │ │ rejectionReason stored            │
│ Issue: closed      │ │ Issue: closed                     │
│ ncmStatus: EXECUTED│ │ ncmStatus: REJECTED               │
└────────┬───────────┘ └──────────┬────────────────────────┘
         ↓                         ↓
┌────────────────────┐ ┌───────────────────────────────────┐
│ Contributor        │ │ Contributor notified of rejection │
│ notified           │ │ with author's feedback notes      │
│ Response live!     │ │ Can improve and resubmit          │
└────────────────────┘ └───────────────────────────────────┘
```

---

## Database Changes Applied

All schema changes from Phase 1 are live:
- ✅ IssueKind enum extended
- ✅ Issue model has new fields (questionText, answerText, ncmId, ncmStatus, etc.)
- ✅ Relations added (Issue ↔ User, Issue ↔ NonCanonicalMove)
- ✅ Indexes created
- ✅ Prisma client regenerated

---

## Integration Points for UI (Phase 4)

### 1. IssueComposerExtended Usage

```tsx
// When creating a clarification request
<IssueComposerExtended
  deliberationId={delibId}
  kind="clarification"
  questionText={questionText}
  targets={[{ type: "argument", id: argId, role: "related" }]}
  assigneeId={authorId}  // Auto-assign to author
  onSuccess={(issue) => {
    // Issue created, notify user
  }}
/>
```

### 2. Answering Clarifications in IssueDetail

```tsx
// In IssueDetail component when issue.kind === "clarification"
const answerClarification = async () => {
  await fetch(`/api/deliberations/${delibId}/issues/${issueId}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answerText }),
  });
  // Refresh issue, show success
};
```

### 3. NCM Review Actions

```tsx
// In NCMReviewCard or IssueDetail
const approveNCM = async () => {
  const res = await fetch(
    `/api/deliberations/${delibId}/issues/${issueId}/approve-ncm`,
    { method: "POST" }
  );
  const data = await res.json();
  if (data.executed) {
    // NCM executed as canonical
  } else {
    // NCM approved, canonical execution pending
  }
};

const rejectNCM = async (reviewNotes: string) => {
  await fetch(
    `/api/deliberations/${delibId}/issues/${issueId}/reject-ncm`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewNotes }),
    }
  );
  // Show rejection sent, issue closed
};
```

### 4. Fetching Issues by Kind

```tsx
// Filter issues by kind in IssuesList
const fetchClarifications = async () => {
  const res = await fetch(
    `/api/deliberations/${delibId}/issues?state=open`
  );
  const { issues } = await res.json();
  const clarifications = issues.filter(i => i.kind === "clarification");
  return clarifications;
};

const fetchPendingReviews = async () => {
  const res = await fetch(
    `/api/deliberations/${delibId}/issues?state=pending`
  );
  const { issues } = await res.json();
  const reviews = issues.filter(i => i.kind === "community_defense");
  return reviews;
};
```

---

## Files Created

1. ✅ `app/api/deliberations/[id]/issues/[issueId]/answer/route.ts` (117 lines)
2. ✅ `app/api/deliberations/[id]/issues/[issueId]/approve-ncm/route.ts` (137 lines)
3. ✅ `app/api/deliberations/[id]/issues/[issueId]/reject-ncm/route.ts` (127 lines)

## Files Modified

1. ✅ `app/api/deliberations/[id]/issues/route.ts`
   - Extended CreateBody schema with new fields
   - Added logic to handle clarification and community_defense kinds

2. ✅ `app/api/non-canonical/submit/route.ts`
   - Auto-creates review issue after NCM creation
   - Links issue to target
   - Returns issueId in response

---

## Testing Checklist

### Manual Testing (Phase 4)

- [ ] Create clarification request via UI
- [ ] Verify issue appears in author's dashboard
- [ ] Author answers clarification
- [ ] Verify answer appears for requester
- [ ] Submit NCM via CommunityDefenseMenu
- [ ] Verify review issue auto-created for author
- [ ] Author approves NCM
- [ ] Verify NCM status updates to APPROVED/EXECUTED
- [ ] Author rejects NCM with notes
- [ ] Verify contributor sees rejection feedback
- [ ] Test authorization checks (non-author can't approve/reject)
- [ ] Test validation (missing fields, wrong issue kind)

### Integration Testing

- [ ] Verify bus events emit correctly
- [ ] Test issue filtering by kind
- [ ] Test issue counts by kind
- [ ] Verify IssueLink creation
- [ ] Test BigInt serialization in responses
- [ ] Test error handling (404, 401, 400, 403)

---

## Next Steps: Phase 4 - UI Integration

Now that backend infrastructure is complete, we can wire up the UI:

### 4.1 Update IssueDetail Component
- [ ] Show clarification Q&A format
- [ ] Show answer form for assigned author
- [ ] Integrate NCMReviewCard for community_defense issues
- [ ] Add approve/reject buttons

### 4.2 Update IssuesList Component
- [ ] Add filter tabs: All | Clarifications | Pending Reviews
- [ ] Show count badges
- [ ] Add kind-specific icons and colors

### 4.3 Integrate ClarificationRequestButton
- [ ] Add to ArgumentCard/ArgumentCardV2
- [ ] Add to ClaimCard where appropriate
- [ ] Wire up onSuccess callback

### 4.4 Create Author Dashboard
- [ ] Show pending clarifications count
- [ ] Show pending NCM reviews count
- [ ] Quick access to each category
- [ ] Priority sorting

### 4.5 Notifications
- [ ] Notify author when clarification requested
- [ ] Notify requester when clarification answered
- [ ] Notify author when NCM submitted (review needed)
- [ ] Notify contributor when NCM approved/rejected

---

## Known Limitations & TODOs

### 1. Canonical Execution (approve-ncm endpoint)
**Status**: Placeholder TODO
**Location**: `app/api/deliberations/[id]/issues/[issueId]/approve-ncm/route.ts` line 88

The `executeNCMAsCanonical` function needs to be implemented. This should:
- Convert NCM content to canonical dialogue move
- Execute the move in the deliberation
- Return the canonical move ID
- Handle any validation/conflicts

**Recommendation**: Review your existing dialogue move creation system and create a helper function that can execute NCMs as canonical moves.

### 2. Notification System
**Status**: Bus events emit, but no UI notifications yet

We emit `issues:changed` and `dialogue:changed` bus events, but there's no notification delivery system yet. Consider:
- In-app notifications (bell icon)
- Email notifications for important actions
- Real-time updates via WebSocket/SSE

### 3. Testing Mode
The NCM submit endpoint has a `DIALOGUE_TESTING_MODE=true` check that bypasses the "can't submit for your own content" validation. Consider:
- Removing this in production
- Or adding a more secure testing flag

---

## Performance Considerations

All new endpoints use:
- ✅ Single database queries where possible
- ✅ Proper indexes on filtered fields (deliberationId, kind, ncmId, assigneeId)
- ✅ Efficient JSON serialization with BigInt handling
- ✅ Bus events for cache invalidation

No performance concerns identified.

---

**Status**: ✅ Phase 3 Complete  
**Next Action**: Start Phase 4 - UI Integration  
**Ready for**: Frontend integration and end-to-end testing

