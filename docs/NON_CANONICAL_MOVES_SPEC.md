# Non-Canonical Moves: Complete Technical Specification

**Feature**: Community-Sourced Dialogue Responses with Approval Workflow  
**Date**: October 22, 2025  
**Status**: 🔨 Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Flow](#data-flow)
4. [API Endpoints](#api-endpoints)
5. [Integration Points](#integration-points)
6. [User Workflows](#user-workflows)
7. [Security & Permissions](#security--permissions)
8. [Event System](#event-system)
9. [Implementation Plan](#implementation-plan)

---

## Overview

### The Problem

Currently, only argument authors can respond to challenges (WHY moves), answer critical questions, and defend their positions. This creates bottlenecks:

- Authors may be offline or unavailable
- Community expertise can't be leveraged
- Arguments can't be strengthened collaboratively
- No mechanism for informal clarification requests

### The Solution

**Non-canonical moves** allow any user to submit responses that:
- Start as "pending" (not part of official dialogue protocol)
- Are visible to other participants
- Can be approved by the author (becomes canonical)
- Enable collaborative knowledge building

### Key Features

1. **Community Responses**: Anyone can answer WHY challenges, provide GROUNDS, defend premises
2. **Clarification System**: Non-protocol questions seeking factual details
3. **Approval Workflow**: Author controls what becomes canonical
4. **Reputation System**: Track helpful contributors
5. **Flexible Execution**: Approved moves can be executed as canonical or remain informational

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                      │
├─────────────────────────────────────────────────────────────┤
│  • NonCanonicalResponseForm                                   │
│  • PendingResponsesList                                       │
│  • ApprovalWorkflow                                           │
│  • ClarificationRequestButton                                 │
│  • CommunityResponseBadge                                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│  • POST   /api/non-canonical/submit                          │
│  • GET    /api/non-canonical/pending                         │
│  • POST   /api/non-canonical/approve                         │
│  • POST   /api/non-canonical/reject                          │
│  • GET    /api/non-canonical/by-target                       │
│  • POST   /api/clarification/request                         │
│  • GET    /api/clarification/list                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                       │
├─────────────────────────────────────────────────────────────┤
│  • Permission checks (author, contributor, viewer)            │
│  • Approval workflow state machine                            │
│  • Canonical move execution                                   │
│  • Notification dispatch                                      │
│  • Reputation/metrics tracking                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer (Prisma)                      │
├─────────────────────────────────────────────────────────────┤
│  • NonCanonicalMove                                           │
│  • ClarificationRequest                                       │
│  • DialogueMove (canonical)                                   │
│  • User (relations)                                           │
└─────────────────────────────────────────────────────────────┘
```

### Data Model Relationships

```
Deliberation
    ├── DialogueMove (canonical protocol moves)
    │   └── NonCanonicalMove (community responses)
    │       └── canonicalMoveId → DialogueMove (if executed)
    │
    ├── ClarificationRequest
    │   └── NonCanonicalMove (answers)
    │
    └── Argument
        ├── WHY challenges
        └── NonCanonicalMove (defenses)
```

---

## Data Flow

### Flow 1: Community Member Submits Response

```
[User sees WHY challenge on argument] 
    ↓
[Clicks "Help Answer This"]
    ↓
[NonCanonicalResponseForm opens]
    ↓
[User writes response, adds evidence]
    ↓
POST /api/non-canonical/submit
    ↓
[Validation: permissions, target exists, not duplicate]
    ↓
[Create NonCanonicalMove with status=PENDING]
    ↓
[Emit event: non-canonical:submitted]
    ↓
[Notify author: "Someone answered your challenge"]
    ↓
[Response appears in "Community Responses" section]
```

### Flow 2: Author Approves Response

```
[Author sees pending response notification]
    ↓
[Opens PendingResponsesList]
    ↓
[Reviews community response]
    ↓
[Clicks "Approve" or "Reject"]
    ↓
POST /api/non-canonical/approve
    ↓
[Update NonCanonicalMove: status=APPROVED]
    ↓
[Optional: Execute as canonical DialogueMove]
    ↓
[If executed:]
    ├── Create DialogueMove (kind=GROUNDS, actorId=authorId)
    ├── Link: ncm.canonicalMoveId = move.id
    ├── Update status=EXECUTED
    └── Run protocol validation (legal moves, CQ satisfaction, etc.)
    ↓
[Emit events: non-canonical:approved, dialogue:moves:refresh]
    ↓
[Notify contributor: "Your response was approved!"]
    ↓
[Update reputation: contributor +helpfulResponse]
```

### Flow 3: Clarification Request & Answer

```
[User sees argument, has factual question]
    ↓
[Clicks "Request Clarification"]
    ↓
[Modal: "What do you want clarified?"]
    ↓
POST /api/clarification/request
    ↓
[Create ClarificationRequest with status=OPEN]
    ↓
[Emit event: clarification:requested]
    ↓
[Notify deliberation participants]
    ↓
──────────────────────────────────────────────
[Other user sees clarification request]
    ↓
[Clicks "Answer This"]
    ↓
POST /api/non-canonical/submit (type=CLARIFICATION_ANSWER)
    ↓
[Create NonCanonicalMove linked to ClarificationRequest]
    ↓
[Asker reviews answer]
    ↓
POST /api/non-canonical/approve
    ↓
[Mark answer as "approved" (helpful)]
    ↓
[Update ClarificationRequest.status = ANSWERED]
    ↓
[Answer displayed with "✓ Marked helpful by asker" badge]
```

---

## API Endpoints

### POST /api/non-canonical/submit

**Purpose**: Submit a community response to a challenge, clarification, or question

**Request Body**:
```typescript
{
  deliberationId: string;
  targetType: "argument" | "claim" | "clarification_request";
  targetId: string;
  targetMoveId?: string; // Optional: the specific move being responded to
  moveType: MoveType; // "GROUNDS_RESPONSE" | "CLARIFICATION_ANSWER" | ...
  content: {
    expression: string;
    evidence?: Array<{ type: string; claimId?: string; url?: string }>;
    // ... other move-specific fields
  };
}
```

**Response**:
```typescript
{
  success: true;
  ncmId: string;
  status: "PENDING";
  message: "Your response has been submitted and is awaiting approval.";
}
```

**Validation**:
- ✅ User is authenticated
- ✅ Target exists and is in the deliberation
- ✅ User is not the author (can't submit non-canonical for own arguments)
- ✅ Content is non-empty and valid
- ✅ No duplicate pending response from same user

**Side Effects**:
- Create `NonCanonicalMove` record
- Emit `non-canonical:submitted` event
- Send notification to author
- Track contributor metric

---

### GET /api/non-canonical/pending

**Purpose**: Get all pending non-canonical moves requiring author's review

**Query Params**:
```typescript
{
  authorId?: string;       // Filter by author (default: current user)
  deliberationId?: string; // Filter by deliberation
  targetType?: string;     // Filter by target type
  status?: NCMStatus;      // Default: "PENDING"
}
```

**Response**:
```typescript
{
  items: Array<{
    id: string;
    createdAt: string;
    targetType: string;
    targetId: string;
    contributorId: string;
    contributorName: string;
    contributorImage: string;
    moveType: string;
    content: any;
    status: string;
    // Rich context
    targetContext: {
      type: "argument" | "claim";
      text: string;
      schemeKey?: string;
    };
    relatedMove?: {
      kind: string;
      expression: string;
    };
  }>;
  count: number;
}
```

---

### POST /api/non-canonical/approve

**Purpose**: Approve a community response (and optionally execute as canonical)

**Request Body**:
```typescript
{
  ncmId: string;
  execute?: boolean; // Default: true (create canonical DialogueMove)
  feedback?: string; // Optional: author's comment to contributor
}
```

**Response**:
```typescript
{
  success: true;
  ncm: NonCanonicalMove;
  canonicalMove?: DialogueMove; // If executed
  message: "Response approved and executed as canonical move.";
}
```

**Authorization**:
- ✅ User must be the argument/claim author
- OR: For clarifications, user must be the asker

**Side Effects**:
- Update `NonCanonicalMove.status` to APPROVED or EXECUTED
- If `execute=true`:
  - Create canonical `DialogueMove`
  - Link via `canonicalMoveId`
  - Run dialogue protocol updates (CQ satisfaction, commitment store, etc.)
- Emit events: `non-canonical:approved`, `dialogue:moves:refresh`
- Send notification to contributor
- Update reputation metrics

---

### POST /api/non-canonical/reject

**Purpose**: Reject a community response

**Request Body**:
```typescript
{
  ncmId: string;
  reason?: string; // Optional: explain why rejected
}
```

**Response**:
```typescript
{
  success: true;
  message: "Response rejected.";
}
```

**Side Effects**:
- Update `NonCanonicalMove.status` to REJECTED
- Store rejection reason
- Emit `non-canonical:rejected` event
- Optionally notify contributor (with reason)

---

### GET /api/non-canonical/by-target

**Purpose**: Get all community responses for a specific argument/claim/clarification

**Query Params**:
```typescript
{
  targetType: string;
  targetId: string;
  status?: "PENDING" | "APPROVED" | "EXECUTED" | "all";
  includeRejected?: boolean; // Default: false
}
```

**Response**:
```typescript
{
  items: Array<NonCanonicalMove & {
    contributor: { id, name, image };
    approver?: { id, name };
    canonicalMove?: DialogueMove;
  }>;
  counts: {
    pending: number;
    approved: number;
    executed: number;
    rejected: number;
  };
}
```

**Use Case**: Display community responses in argument cards, below official moves

---

### POST /api/clarification/request

**Purpose**: Submit a clarification request (non-protocol question)

**Request Body**:
```typescript
{
  deliberationId: string;
  targetType: "argument" | "claim";
  targetId: string;
  question: string;
}
```

**Response**:
```typescript
{
  success: true;
  requestId: string;
  status: "OPEN";
}
```

**Side Effects**:
- Create `ClarificationRequest`
- Emit `clarification:requested` event
- Notify deliberation participants

---

### GET /api/clarification/list

**Purpose**: Get all clarification requests for a target

**Query Params**:
```typescript
{
  targetType: string;
  targetId: string;
  status?: "OPEN" | "ANSWERED" | "RESOLVED" | "all";
}
```

**Response**:
```typescript
{
  items: Array<{
    id: string;
    question: string;
    asker: { id, name, image };
    createdAt: string;
    status: string;
    answers: Array<{
      id: string;
      content: any;
      contributor: { id, name, image };
      approvedByAsker: boolean;
    }>;
  }>;
}
```

---

## Integration Points

### 1. AttackMenuPro / ArgumentCard

**Location**: `components/arguments/AttackMenuProV2.tsx`

**Add**: "Community Responses" section in attack dialog

```tsx
<Tabs defaultValue="attacks">
  <TabsList>
    <TabsTrigger value="attacks">My Attack</TabsTrigger>
    <TabsTrigger value="cqs">Critical Questions</TabsTrigger>
    <TabsTrigger value="community">
      Community Responses
      {pendingCount > 0 && <Badge>{pendingCount}</Badge>}
    </TabsTrigger>
  </TabsList>
  
  <TabsContent value="community">
    <CommunityResponsesList
      targetType="argument"
      targetId={argument.id}
      onSubmitResponse={handleSubmitResponse}
    />
  </TabsContent>
</Tabs>
```

---

### 2. LegalMoveChips / CommandCard

**Location**: `components/dialogue/LegalMoveChips.tsx`

**Add**: "Help Answer" button next to GROUNDS moves

```tsx
{move.kind === 'GROUNDS' && move.authorId !== currentUserId && (
  <button
    onClick={() => openNonCanonicalForm(move)}
    className="text-xs text-blue-600 hover:underline"
  >
    💡 Help Answer This
  </button>
)}
```

---

### 3. ArgumentsList / AIFArgumentsListPro

**Location**: `components/arguments/AIFArgumentsListPro.tsx`

**Add**: Badge showing community response count

```tsx
<div className="flex items-center gap-2">
  <AttackMenuProV2 ... />
  
  {communityResponseCount > 0 && (
    <button onClick={openCommunityResponses}>
      <Badge variant="secondary">
        {communityResponseCount} community responses
      </Badge>
    </button>
  )}
  
  <ClarificationRequestButton
    targetType="argument"
    targetId={argument.id}
  />
</div>
```

---

### 4. Notification System

**Add**: New notification types in `app/api/notifications/`

```typescript
enum NotificationType {
  // ... existing types
  NON_CANONICAL_SUBMITTED = "non_canonical_submitted",
  NON_CANONICAL_APPROVED = "non_canonical_approved",
  NON_CANONICAL_REJECTED = "non_canonical_rejected",
  CLARIFICATION_REQUESTED = "clarification_requested",
  CLARIFICATION_ANSWERED = "clarification_answered",
}
```

---

### 5. Bus Events

**Add**: Events in `types/agora.ts`

```typescript
type BusEvent =
  | ... // existing events
  | "non-canonical:submitted"
  | "non-canonical:approved"
  | "non-canonical:rejected"
  | "clarification:requested"
  | "clarification:answered";
```

---

## User Workflows

### Workflow 1: Community Member Helps Defend Argument

**Actors**: Alice (community member), Bob (argument author)

1. Alice browses deliberation, sees Bob's argument under challenge
2. WHY move from Charlie: "Why should we accept this claim?"
3. Alice knows the answer, clicks "Help Answer This"
4. Modal opens with:
   - Challenge context: Charlie's question
   - Bob's argument summary
   - Response form (text + evidence picker)
5. Alice writes response, adds citation, submits
6. UI shows "Response submitted! Pending author approval"
7. Bob gets notification: "Alice answered a challenge on your argument"
8. Bob reviews Alice's response in "Pending Responses" panel
9. Bob clicks "Approve & Execute"
10. System creates canonical GROUNDS move (Bob's actorId)
11. Alice gets notification: "Your response was approved by Bob!"
12. Alice earns +1 "Helpful Response" reputation badge

---

### Workflow 2: Clarification Request

**Actors**: Dana (curious user), Eve (author), Frank (expert)

1. Dana reads Eve's argument, unclear on term "democratic deficit"
2. Dana clicks "Request Clarification" button
3. Modal: "What would you like clarified?"
4. Dana types: "What specifically do you mean by 'democratic deficit'?"
5. Clarification request created, appears below argument
6. Eve and other participants notified
7. Frank (expert) sees request, clicks "Answer This"
8. Frank provides detailed explanation with link to academic paper
9. Dana sees Frank's answer, clicks "✓ Mark as Helpful"
10. Answer now shows green checkmark: "✓ Marked helpful by asker"
11. Request status changes to "ANSWERED"
12. Frank earns +1 "Helpful Clarification" badge

---

### Workflow 3: Author Reviews Multiple Responses

**Actor**: Greg (argument author)

1. Greg opens deliberation, sees notification badge: "3 pending responses"
2. Clicks notification, opens "Pending Responses" drawer
3. Sees 3 community responses to different challenges:
   - Response 1 (from Hannah): Excellent, addresses CQ fully
   - Response 2 (from Ian): Partially helpful, but misses key point
   - Response 3 (from Jane): Off-topic
4. Greg clicks "Approve & Execute" on Response 1
   - → Creates canonical GROUNDS move
5. Greg clicks "Approve (don't execute)" on Response 2
   - → Stays as informational, not canonical
   - → Adds comment: "Thanks, but see my fuller answer here: [link]"
6. Greg clicks "Reject" on Response 3
   - → Adds reason: "This addresses a different question"
7. Drawer updates: 0 pending, 2 approved, 1 rejected
8. Hannah, Ian, Jane all receive appropriate notifications

---

## Security & Permissions

### Permission Matrix

| Action | Author | Contributor | Other Users |
|--------|--------|-------------|-------------|
| Submit non-canonical move | ❌ No | ✅ Yes | ✅ Yes |
| View pending (own arguments) | ✅ Yes | ❌ No | ❌ No |
| View approved/executed | ✅ Yes | ✅ Yes | ✅ Yes |
| Approve/reject | ✅ Yes | ❌ No | ❌ No |
| Withdraw (own) | ❌ N/A | ✅ Yes | ❌ No |
| Request clarification | ✅ Yes | ✅ Yes | ✅ Yes |
| Mark clarification helpful | Asker only | ❌ No | ❌ No |

### Validation Rules

#### R1: No Self-Response
```typescript
if (ncm.contributorId === argument.authorId) {
  throw new Error("Authors cannot submit non-canonical responses to their own arguments");
}
```

#### R2: Target Must Exist
```typescript
const target = await prisma[targetType].findUnique({ where: { id: targetId } });
if (!target) {
  throw new Error("Target not found");
}
```

#### R3: No Duplicate Pending
```typescript
const existing = await prisma.nonCanonicalMove.findFirst({
  where: {
    targetId,
    contributorId,
    status: "PENDING",
    moveType
  }
});
if (existing) {
  throw new Error("You already have a pending response for this");
}
```

#### R4: Author Authorization
```typescript
if (action === "approve" || action === "reject") {
  const argument = await prisma.argument.findUnique({ where: { id: ncm.targetId } });
  if (argument.authorId !== currentUserId) {
    throw new Error("Only the argument author can approve/reject responses");
  }
}
```

---

## Event System

### Event Definitions

```typescript
// types/agora.ts

type NonCanonicalEvent = {
  type: "non-canonical:submitted" | "non-canonical:approved" | "non-canonical:rejected";
  ncmId: string;
  deliberationId: string;
  targetType: string;
  targetId: string;
  contributorId: string;
  authorId: string;
  moveType: string;
  ts: number;
};

type ClarificationEvent = {
  type: "clarification:requested" | "clarification:answered";
  requestId: string;
  deliberationId: string;
  targetType: string;
  targetId: string;
  askerId: string;
  ts: number;
};
```

### Event Listeners

**Example**: Update argument card badge when response approved

```typescript
// components/arguments/ArgumentCard.tsx

useBusEffect(["non-canonical:approved"], async (evt) => {
  if (evt.targetType === "argument" && evt.targetId === argument.id) {
    // Refetch community response count
    mutate(`/api/non-canonical/by-target?targetId=${argument.id}`);
  }
});
```

---

## Implementation Plan

### Phase 1: Database & API (Week 1)

**Tasks**:
1. ✅ Add Prisma schema models (NonCanonicalMove, ClarificationRequest)
2. ✅ Run migration
3. Create API routes:
   - `/api/non-canonical/submit`
   - `/api/non-canonical/pending`
   - `/api/non-canonical/approve`
   - `/api/non-canonical/reject`
   - `/api/non-canonical/by-target`
   - `/api/clarification/request`
   - `/api/clarification/list`
4. Add bus event types
5. Add notification types

**Testing**:
- Unit tests for approval workflow state machine
- Integration tests for API endpoints
- Permission validation tests

---

### Phase 2: Core UI Components (Week 2)

**Tasks**:
1. `NonCanonicalResponseForm.tsx` - Submit response modal
2. `PendingResponsesList.tsx` - Author's review drawer
3. `CommunityResponsesTab.tsx` - Display in AttackMenuPro
4. `ClarificationRequestButton.tsx` - Request clarification
5. `ClarificationAnswerForm.tsx` - Answer clarification
6. Notification UI for new response types

**Testing**:
- Component unit tests
- User flow tests (submit → approve → execute)
- Accessibility tests

---

### Phase 3: Integration (Week 3)

**Tasks**:
1. Add "Help Answer" buttons in LegalMoveChips
2. Add community responses tab in AttackMenuPro
3. Add clarification button in ArgumentCard
4. Add pending badge in nav/header
5. Wire up bus events
6. Add reputation tracking

**Testing**:
- End-to-end workflow tests
- Event propagation tests
- Performance tests (large deliberations)

---

### Phase 4: Polish & Launch (Week 4)

**Tasks**:
1. Tooltips & help text
2. Empty states ("No pending responses")
3. Loading states & skeletons
4. Error handling & validation messages
5. Mobile responsive design
6. Docs & user guide
7. Analytics tracking

**Testing**:
- Beta test with real users
- Feedback collection
- Bug fixes
- Performance optimization

---

## Next Steps

1. **Review this spec** with team for feedback
2. **Finalize schema** and run migration
3. **Create API routes** (start with submit endpoint)
4. **Build core UI** (NonCanonicalResponseForm first)
5. **Integrate** into existing components
6. **Test thoroughly** with edge cases
7. **Document** for users

---

## References

- Database schema: `docs/NON_CANONICAL_MOVES_SCHEMA.md`
- UI components: `docs/NON_CANONICAL_MOVES_UI.md`
- Existing dialogue API: `app/api/dialogue/move/route.ts`
- Approval patterns: `ArgumentApproval` model (schema.prisma:2480)
- AIF integration: `app/api/ca/route.ts` (ConflictApplication)
