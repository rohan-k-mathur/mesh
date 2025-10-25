# Phase 2 Complete: CQ API Endpoints

## ✅ Summary

Phase 2 is complete! All API endpoints for the CQ multi-layer response system have been implemented with comprehensive permissions, validation, and activity logging.

## 📋 Endpoints Created

### 1. Response Submission
**POST `/api/cqs/responses/submit`**
- ✅ Community members submit CQ responses
- ✅ Validates groundsText (10-5000 chars)
- ✅ Optional evidence claims and source URLs
- ✅ Permission checks (public room or participant)
- ✅ Prevents duplicate pending responses
- ✅ Updates CQ status to PENDING_REVIEW
- ✅ Logs RESPONSE_SUBMITTED activity

### 2. Response Listing
**GET `/api/cqs/responses?cqStatusId={id}&status={pending|approved|canonical|all}`**
- ✅ List responses for a CQ
- ✅ Filter by status
- ✅ Permission-aware (pending visible only to author/mod)
- ✅ Includes endorsement counts
- ✅ Sorted by status, votes, recency

### 3. Response Approval
**POST `/api/cqs/responses/[id]/approve`**
- ✅ Author/moderator approval workflow
- ✅ Optional `setAsCanonical` flag
- ✅ Supersedes old canonical if setting new one
- ✅ Updates CQ status (PARTIALLY_SATISFIED or SATISFIED)
- ✅ Stores review notes
- ✅ Logs RESPONSE_APPROVED or CANONICAL_SELECTED

### 4. Response Rejection
**POST `/api/cqs/responses/[id]/reject`**
- ✅ Author/moderator rejection with required reason
- ✅ Only rejects PENDING responses
- ✅ Reverts CQ to OPEN if no pending remain
- ✅ Logs RESPONSE_REJECTED activity

### 5. Response Voting
**POST `/api/cqs/responses/[id]/vote`**
- ✅ Upvote (value: 1) or downvote (value: -1)
- ✅ Toggle behavior (click again to remove vote)
- ✅ Prevents self-voting
- ✅ In-memory vote tracking per user
- ✅ Updates vote counts in database
- ✅ GET endpoint to check user's current vote

### 6. Response Endorsement
**POST `/api/cqs/responses/[id]/endorse`**
- ✅ Endorse responses with optional comment
- ✅ Weighted endorsements (1-10, default 1)
- ✅ Only participants can endorse
- ✅ Prevents self-endorsement
- ✅ Update existing endorsement
- ✅ Logs ENDORSEMENT_ADDED activity
- ✅ DELETE endpoint to remove endorsement

### 7. Response Withdrawal
**POST `/api/cqs/responses/[id]/withdraw`**
- ✅ Contributors withdraw own responses
- ✅ Cannot withdraw CANONICAL (must contact author)
- ✅ Updates status to WITHDRAWN
- ✅ Reverts CQ to OPEN if no active responses
- ✅ Logs RESPONSE_WITHDRAWN activity

### 8. Canonical Selection
**POST `/api/cqs/status/canonical`**
- ✅ Set canonical response for a CQ
- ✅ Supersedes previous canonical
- ✅ Updates CQ status to SATISFIED
- ✅ Logs CANONICAL_SELECTED activity
- ✅ Stores previous canonical in metadata

### 9. Activity Log
**GET `/api/cqs/activity?cqStatusId={id}&limit={n}&offset={n}`**
- ✅ Fetch activity log for a CQ
- ✅ Paginated (default 50, max 100)
- ✅ Sorted by recency (newest first)
- ✅ Returns total count and hasMore flag

### 10. Enhanced CQ List
**Modified GET `/api/cqs`**
- ✅ Includes response counts (pending, approved, total)
- ✅ Returns canonical response data
- ✅ Shows statusEnum (OPEN, PENDING_REVIEW, etc.)
- ✅ Backward compatible with existing clients

## 🔐 Permission System

### Created: `lib/cqs/permissions.ts`

Comprehensive permission helpers:

```typescript
// Check all permissions for a user on a CQ
getCQPermissions(userId: string, cqStatusId: string): Promise<CQPermissions>

// Check if user can moderate responses
canModerateResponse(userId: string, responseId: string): Promise<boolean>

// Check if user is response contributor
isResponseContributor(userId: string, responseId: string): Promise<boolean>

// Check if user is room moderator
isRoomModerator(userId: string, roomId: string): Promise<boolean>

// Check if user is deliberation participant
isDeliberationParticipant(userId: string, deliberationId: string): Promise<boolean>

// Check if room is public
isRoomPublic(roomId: string): Promise<boolean>
```

### Permission Matrix

| Action | Viewers | Authenticated | Participants | Author | Moderators |
|--------|---------|---------------|--------------|--------|------------|
| View CQ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View pending responses | ❌ | ❌ | ❌ | ✅ | ✅ |
| Submit response | ❌ | ✅ (public) | ✅ | ✅ | ✅ |
| Vote on response | ❌ | ✅ | ✅ | ✅ | ✅ |
| Endorse response | ❌ | ❌ | ✅ | ✅ | ✅ |
| Approve/reject | ❌ | ❌ | ❌ | ✅ | ✅ |
| Set canonical | ❌ | ❌ | ❌ | ✅ | ✅ |

## 📁 Files Created

```
lib/cqs/
  permissions.ts                           - Permission helpers

app/api/cqs/responses/
  submit/route.ts                          - Submit new response
  route.ts                                 - List responses
  [id]/approve/route.ts                    - Approve response
  [id]/reject/route.ts                     - Reject response
  [id]/vote/route.ts                       - Vote on response
  [id]/endorse/route.ts                    - Endorse response
  [id]/withdraw/route.ts                   - Withdraw response

app/api/cqs/status/
  canonical/route.ts                       - Set canonical response

app/api/cqs/
  activity/route.ts                        - Activity log
  route.ts (modified)                      - Enhanced with response data
```

## 🎯 Validation & Error Handling

All endpoints use **Zod schemas** for validation:
- Request bodies validated
- Clear error messages
- HTTP status codes: 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 409 (conflict)

## 🔔 Notification Hooks (Phase 4)

All endpoints have `TODO` comments for Phase 4 notifications:

```typescript
// TODO Phase 4: Emit event for notifications
// emitBus('cq:response:submitted', { ... });
// emitBus('cq:response:approved', { ... });
// emitBus('cq:response:rejected', { ... });
// emitBus('cq:canonical:selected', { ... });
```

## 📊 Activity Logging

Every user action is logged to `CQActivityLog`:
- ✅ RESPONSE_SUBMITTED
- ✅ RESPONSE_APPROVED
- ✅ RESPONSE_REJECTED
- ✅ RESPONSE_WITHDRAWN
- ✅ CANONICAL_SELECTED
- ✅ ENDORSEMENT_ADDED

Metadata stored for audit trail:
- Evidence/source counts
- Review notes
- Reasons for rejection
- Previous canonical IDs

## 🧪 Testing Checklist

Before deploying:

- [ ] Test all endpoints with valid requests
- [ ] Test permission checks (unauthorized, forbidden)
- [ ] Test validation errors (missing fields, invalid data)
- [ ] Test vote toggling (upvote → neutral → downvote)
- [ ] Test endorsement update flow
- [ ] Test canonical supersession
- [ ] Test activity log pagination
- [ ] Load test voting (concurrent requests)
- [ ] Verify SQL indexes perform well

## 🚀 Usage Examples

### Submit a Response

```typescript
const response = await fetch("/api/cqs/responses/submit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    cqStatusId: "cqstatus_123",
    groundsText: "Multiple peer-reviewed studies demonstrate...",
    evidenceClaimIds: ["claim_abc", "claim_def"],
    sourceUrls: ["https://example.com/study1"],
  }),
});

const data = await response.json();
// { ok: true, response: { id, groundsText, responseStatus, createdAt }, message: "..." }
```

### List Responses

```typescript
const response = await fetch(
  "/api/cqs/responses?cqStatusId=cqstatus_123&status=approved"
);
const data = await response.json();
// { ok: true, responses: [...], count: 5 }
```

### Approve Response (Set as Canonical)

```typescript
const response = await fetch("/api/cqs/responses/response_456/approve", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    setAsCanonical: true,
    reviewNotes: "Well-cited and comprehensive",
  }),
});

const data = await response.json();
// { ok: true, response: { id, responseStatus: "CANONICAL", reviewedAt }, message: "..." }
```

### Vote on Response

```typescript
const response = await fetch("/api/cqs/responses/response_456/vote", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ value: "1" }), // upvote
});

const data = await response.json();
// { ok: true, upvotes: 12, downvotes: 2, netVotes: 10, userVote: 1 }
```

### Endorse Response

```typescript
const response = await fetch("/api/cqs/responses/response_456/endorse", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    comment: "This addresses all my concerns perfectly",
    weight: 2,
  }),
});

const data = await response.json();
// { ok: true, endorsement: { id, userId, comment, weight, createdAt }, message: "..." }
```

### Get Activity Log

```typescript
const response = await fetch("/api/cqs/activity?cqStatusId=cqstatus_123&limit=20");
const data = await response.json();
// { ok: true, activities: [...], total: 45, hasMore: true }
```

## 🔄 State Transitions

### CQ Status Flow

```
OPEN 
  ↓ (response submitted)
PENDING_REVIEW
  ↓ (response approved)
PARTIALLY_SATISFIED
  ↓ (canonical selected)
SATISFIED
  ↓ (new challenge)
DISPUTED
```

### Response Status Flow

```
PENDING
  ↓ (author approves)
APPROVED
  ↓ (set as canonical)
CANONICAL
  ↓ (new canonical selected)
SUPERSEDED

PENDING
  ↓ (author rejects)
REJECTED

PENDING/APPROVED
  ↓ (contributor withdraws)
WITHDRAWN
```

## ⚡ Performance Optimizations

- ✅ Database indexes on all foreign keys
- ✅ Efficient query patterns (select only needed fields)
- ✅ Vote tracking in memory (reduce DB writes)
- ✅ Pagination on activity log (prevent huge payloads)
- ✅ ETag caching on main CQ endpoint (unchanged)

## 🐛 Known Limitations

1. **Vote Tracking**: In-memory vote tracker will reset on server restart
   - **Fix in Phase 4**: Move to Redis or create CQVote table

2. **User Hydration**: Actor/contributor IDs returned as strings
   - **Fix in Phase 4**: Add User relation joins for names/images

3. **Reputation Integration**: Not yet wired to reputation system
   - **Fix in Phase 5**: Award points for approved responses

4. **Notifications**: Events logged but not emitted
   - **Fix in Phase 4**: Wire up event emitter and notification service

## 🎯 Next: Phase 3 (UI Components)

With all APIs in place, we can now build the UI:

1. **CQResponseForm** - Modal for submitting responses
2. **CQResponsesList** - Tabbed view (canonical/approved/pending)
3. **CQResponseCard** - Individual response display
4. **CQAuthorDashboard** - Pending response review panel
5. **CQStatusBadge** - Visual status indicators
6. **CQActivityFeed** - Audit log timeline

All endpoints are ready to be consumed by the frontend!

---

**Phase 2 Status: ✅ COMPLETE**

Ready to wire into `CriticalQuestionsV3.tsx` with beautiful UI! 🎨
