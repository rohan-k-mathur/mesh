# Critical Questions: Multi-Layer Permissions & Community Participation Design

## Executive Summary

Critical Questions (CQs) currently exist in a **single-layer model** where one `CQStatus` record represents the "official" state (satisfied/unsatisfied) with minimal visibility into:
- **Who** can respond vs. who can only view
- **How** community members can contribute vs. author control
- **What** happens to responses (approval, display, versioning)
- **Why** a CQ is marked satisfied (evidence, reasoning, consensus)

This document proposes a **multi-layered CQ system** that supports:
1. **Role-based permissions** (author, participants, viewers, moderators)
2. **Community contribution flows** (inspired by existing Non-Canonical Moves system)
3. **Response versioning & provenance** (who said what, when approved)
4. **Deliberation-scoped visibility** (public vs. private rooms)
5. **Reputation & incentives** (encourage quality responses)

---

## Current State Analysis

### Schema: `CQStatus` (Single-Layer)

```prisma
model CQStatus {
  id         String     @id @default(cuid())
  targetType TargetType
  targetId   String     // claim or argument ID
  
  schemeKey   String
  cqKey       String
  satisfied   Boolean  @default(false)
  groundsText String?  // Single text response
  
  createdById String   // Who created this status
  roomId      String?  // For RLS
  createdAt   DateTime
  updatedAt   DateTime

  @@unique([targetType, targetId, schemeKey, cqKey])
}
```

### Current Permission Model (from `/api/cqs/toggle`)

```ts
// Lines 87-99: Permissive approach
// Permission guard: For now, allow any authenticated user to mark CQs satisfied
// Rationale: CQs are collaborative inquiry tools, not adversarial attacks
// TODO: Consider adding role-based restrictions if needed (e.g., only participants in deliberation)

// Commented out author-only restriction:
// const isAuthor = String(claim?.createdById) === String(userId);
// if (!isAuthor && !isModerator) {
//   return NextResponse.json({ error:'Only claim author can mark CQs' }, { status: 403 });
// }
```

### Problems with Current Approach

| Issue | Impact | User Experience |
|-------|--------|----------------|
| **Single satisfied boolean** | No nuance between "partially addressed" vs "fully satisfied" | Users don't know if CQ needs more work |
| **Single groundsText** | No versioning or multi-author responses | Community contributions overwrite each other |
| **No approval workflow** | Anyone can mark satisfied | Authors lose control over what "counts" |
| **No visibility controls** | All CQ responses are equally visible | No way to surface best responses |
| **No provenance** | Can't see who provided which evidence | Trust and attribution unclear |
| **No participant distinction** | Viewers have same rights as active participants | No incentive to actively participate |

---

## Design Principles

### 1. **Layered Ownership**
- **Claim Author**: Final authority on whether CQ is satisfied
- **Participants**: Can propose responses, attach counter-claims
- **Community**: Can vote, endorse, request clarifications
- **Viewers**: Read-only access to approved responses

### 2. **Collaborative Inquiry Over Adversarial Control**
- CQs are **questions**, not attacks
- Multiple users should be able to contribute partial answers
- Best responses should surface via community validation
- Authors should benefit from community help, not be threatened by it

### 3. **Transparency & Provenance**
- Every response has a clear author
- Approval/rejection history is logged
- Evidence sources are tracked
- Changes over time are visible

### 4. **Room-Scoped Permissions**
- Public deliberations: Anyone can view, authenticated users can respond
- Private rooms: Only room members can view/respond
- Moderated rooms: Responses require moderator approval

---

## Proposed Architecture

### Enhanced Schema

```prisma
// --- Multi-response CQ model ---

model CQStatus {
  id         String     @id @default(cuid())
  targetType TargetType
  targetId   String
  
  schemeKey   String
  cqKey       String
  
  // Status progression: open → partially_satisfied → satisfied → disputed
  status      CQStatusEnum @default(OPEN)
  
  // Official/canonical response (set by author or through approval)
  canonicalResponseId String?
  canonicalResponse   CQResponse? @relation("CanonicalResponse", fields: [canonicalResponseId], references: [id])
  
  // All responses (pending, approved, rejected)
  responses  CQResponse[] @relation("AllResponses")
  
  createdById String   // Who created the CQ status record
  roomId      String?  // For RLS and permissions
  
  lastReviewedAt DateTime? // When author last reviewed this CQ
  lastReviewedBy String?   // Who reviewed it
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([targetType, targetId, schemeKey, cqKey])
  @@index([status, roomId])
  @@index([targetId])
}

enum CQStatusEnum {
  OPEN                 // No responses yet
  PENDING_REVIEW       // Has responses awaiting approval
  PARTIALLY_SATISFIED  // Some responses approved, but incomplete
  SATISFIED            // Author accepted canonical response
  DISPUTED             // Conflicting responses or new challenges
}

model CQResponse {
  id       String @id @default(cuid())
  
  cqStatusId String
  cqStatus   CQStatus @relation("AllResponses", fields: [cqStatusId], references: [id], onDelete: Cascade)
  
  // Response content
  groundsText      String   // The actual response text
  evidenceClaimIds String[] // Claims that serve as evidence
  sourceUrls       String[] // External citations
  
  // Workflow state
  status ResponseStatus @default(PENDING)
  
  // Provenance
  contributorId String  // Who wrote this response
  contributor   User    @relation(fields: [contributorId], references: [id])
  
  reviewedAt    DateTime?
  reviewedBy    String?   // Author or moderator who approved/rejected
  reviewNotes   String?   // Why approved/rejected
  
  // Community validation
  upvotes       Int @default(0)
  downvotes     Int @default(0)
  endorsements  CQEndorsement[]
  
  // Execution (if approved and converted to canonical move)
  canonicalMoveId String?
  executedAt      DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Back-reference for canonical selection
  canonicalFor CQStatus[] @relation("CanonicalResponse")

  @@index([cqStatusId, status])
  @@index([contributorId])
  @@index([status, createdAt])
}

enum ResponseStatus {
  PENDING          // Awaiting review
  APPROVED         // Accepted by author/moderator
  CANONICAL        // Selected as THE official answer
  REJECTED         // Not accepted
  SUPERSEDED       // Was canonical, but replaced
  WITHDRAWN        // Contributor removed it
}

model CQEndorsement {
  id         String @id @default(cuid())
  responseId String
  response   CQResponse @relation(fields: [responseId], references: [id], onDelete: Cascade)
  
  userId     String
  user       User   @relation(fields: [userId], references: [id])
  
  weight     Int @default(1) // Could vary by user reputation
  comment    String?         // Optional explanation
  
  createdAt  DateTime @default(now())

  @@unique([responseId, userId])
  @@index([responseId])
}

model CQActivityLog {
  id       String @id @default(cuid())
  
  cqStatusId String
  action     CQAction
  
  actorId    String  // Who performed the action
  actor      User    @relation(fields: [actorId], references: [id])
  
  responseId String? // If action relates to a specific response
  
  metadata   Json?   // Additional context
  createdAt  DateTime @default(now())

  @@index([cqStatusId, createdAt])
  @@index([actorId])
}

enum CQAction {
  RESPONSE_SUBMITTED
  RESPONSE_APPROVED
  RESPONSE_REJECTED
  RESPONSE_WITHDRAWN
  STATUS_CHANGED
  CANONICAL_SELECTED
  ENDORSEMENT_ADDED
  CLARIFICATION_REQUESTED
}
```

---

## Permission Matrix

### Who Can Do What?

| Action | Viewers (Public) | Authenticated Users | Room Participants | Claim Author | Moderators |
|--------|-----------------|---------------------|-------------------|--------------|------------|
| **View CQ** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **View approved responses** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **View pending responses** | ❌ No | ❌ No | ⚠️ Own only | ✅ All | ✅ All |
| **Submit response** | ❌ No | ✅ Yes (if public room) | ✅ Yes | ✅ Yes | ✅ Yes |
| **Edit own response** | ❌ No | ✅ Before review | ✅ Before review | ✅ Before review | ⚠️ Anytime |
| **Withdraw own response** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Upvote/downvote response** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Endorse response** | ❌ No | ⚠️ Limited | ✅ Yes | ✅ Yes | ✅ Yes |
| **Approve response** | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **Reject response** | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **Mark CQ satisfied** | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **Select canonical response** | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **Request clarification** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

### Room-Type Modifiers

| Room Type | View CQs | Submit Responses | Approve Responses |
|-----------|----------|------------------|-------------------|
| **Public** | Anyone | Authenticated users | Author + Moderators |
| **Unlisted** | Anyone with link | Authenticated users | Author + Moderators |
| **Private** | Room members only | Room members only | Author + Moderators |
| **Invite-only** | Invited users | Invited participants | Author + Moderators |
| **Moderated** | Anyone | Anyone (pending) | Moderators only |

---

## User Flows

### Flow 1: Community Member Submits CQ Response

```
[User viewing claim] 
    ↓
[Sees "evidence_exists" CQ is open]
    ↓
[Clicks "Contribute Response"]
    ↓
[Modal opens with:]
  - CQ question text
  - Rich text editor for grounds
  - Evidence picker (attach existing claims)
  - Source URL fields
  - Preview of current responses (if any)
    ↓
[Submits response]
    ↓
POST /api/cqs/responses/submit
    ↓
[Create CQResponse with status=PENDING]
[Update CQStatus.status → PENDING_REVIEW]
[Emit event: cq:response:submitted]
[Notify claim author]
    ↓
[User sees: "Your response is pending review by the claim author"]
[Response shows "Under Review" badge]
```

### Flow 2: Claim Author Reviews Responses

```
[Author visits their claim]
    ↓
[Sees notification: "3 pending CQ responses"]
    ↓
[Opens CQ panel → "Pending Responses" tab]
    ↓
[For each response, sees:]
  - Contributor profile + reputation
  - Response text + evidence
  - Community votes/endorsements
  - Action buttons: Approve | Reject | Request Changes
    ↓
[Author clicks "Approve" on best response]
    ↓
POST /api/cqs/responses/{id}/approve
    ↓
[Update response: status=APPROVED]
[Log activity: CQActivityLog { action: RESPONSE_APPROVED }]
[If first approval: CQStatus.status → PARTIALLY_SATISFIED]
[Emit event: cq:response:approved]
[Notify contributor: "Your response was approved!"]
[Award reputation: +helpfulCQResponse]
    ↓
[Author sees modal: "Set as canonical response?"]
    ↓
[If "Yes":]
  ↓
  POST /api/cqs/status/canonical
  ↓
  [Update CQStatus:]
    - canonicalResponseId = approved response ID
    - status = SATISFIED
    - lastReviewedAt = now
    - lastReviewedBy = author ID
  ↓
  [Create DialogueMove if needed (grounds submission)]
  ↓
  [Emit event: cq:satisfied]
  ↓
  [CQ shows green "Satisfied" badge with canonical response]
```

### Flow 3: Viewer Observes CQ Progression

```
[Viewer loads claim page]
    ↓
GET /api/cqs?targetId={claimId}&viewerId={userId}
    ↓
[Returns:]
{
  schemes: [{
    key: "claim_truth",
    cqs: [{
      key: "evidence_exists",
      status: "PARTIALLY_SATISFIED",
      canonical: {
        groundsText: "Multiple studies show...",
        contributor: { name: "Dr. Smith", reputation: 850 },
        evidenceClaims: [...],
        upvotes: 12,
        endorsements: 3
      },
      pendingCount: 2,        // Only visible to author
      approvedCount: 1,
      lastReviewed: "2025-10-20T14:32:00Z"
    }]
  }]
}
    ↓
[UI renders:]
  ┌─────────────────────────────────────┐
  │ ⚠️ Is there evidence to support     │
  │    this claim?                       │
  │                                      │
  │ Status: ⚡ Partially Satisfied       │
  │                                      │
  │ 📝 Official Response:                │
  │ "Multiple studies show..."           │
  │ — Dr. Smith (⭐ 850 rep)             │
  │ 👍 12   ❤️ 3 endorsements            │
  │                                      │
  │ 🔗 Evidence: [Claim A] [Claim B]     │
  │                                      │
  │ [View All Responses] [Contribute]    │
  └─────────────────────────────────────┘
```

### Flow 4: Community Votes on Pending Responses

```
[Participant clicks "View All Responses"]
    ↓
[Dialog shows:]
  - Tabs: Canonical | Approved | Community Contributions
  - Community Contributions tab lists all PENDING responses
  - Each shows vote count, contributor, date
    ↓
[User upvotes helpful response]
    ↓
POST /api/cqs/responses/{id}/vote { value: 1 }
    ↓
[Increment response.upvotes]
[Log activity for analytics]
    ↓
[Author dashboard shows: "Response by @jane has 5 upvotes"]
[Helps author prioritize which responses to review]
```

---

## API Routes

### New/Modified Endpoints

```ts
// GET /api/cqs?targetId={id}&viewerId={userId}
// Returns CQs with appropriate visibility filtering
// - Viewers: only approved/canonical responses
// - Authors: includes pending count + all responses
// - Participants: includes own pending responses

// POST /api/cqs/responses/submit
// Body: { cqStatusId, groundsText, evidenceClaimIds, sourceUrls }
// Creates new CQResponse with status=PENDING

// GET /api/cqs/responses?cqStatusId={id}&status={pending|approved|all}
// Lists responses for a CQ (filtered by permissions)

// POST /api/cqs/responses/{id}/approve
// Body: { setAsCanonical?: boolean, reviewNotes?: string }
// Only author or moderator

// POST /api/cqs/responses/{id}/reject
// Body: { reason: string }
// Only author or moderator

// POST /api/cqs/responses/{id}/vote
// Body: { value: 1 | -1 }
// Upvote/downvote (anyone authenticated)

// POST /api/cqs/responses/{id}/endorse
// Body: { comment?: string }
// Stronger signal than vote (participants only)

// POST /api/cqs/responses/{id}/withdraw
// Contributor can remove their response

// POST /api/cqs/status/canonical
// Body: { cqStatusId, responseId }
// Author selects canonical response, marks CQ satisfied

// GET /api/cqs/activity?cqStatusId={id}
// Returns audit log of all actions (for transparency)
```

---

## UI Components

### 1. `CQResponseForm` (New)
Modal for submitting CQ responses:
- Question context display
- Rich text editor
- Evidence claim picker
- Source URL fields
- Preview submitted responses
- Submission state handling

### 2. `CQResponsesList` (New)
Tabbed view of responses:
- **Canonical Tab**: The official answer (if set)
- **Approved Tab**: All approved responses
- **Community Tab**: Pending responses (author/moderator view)
- **My Contributions**: User's own responses

### 3. `CQResponseCard` (New)
Display individual response with:
- Contributor profile + reputation
- Response text with evidence links
- Vote count + endorse button
- Status badge (pending/approved/canonical)
- Actions (if author: approve/reject)

### 4. `CQStatusBadge` (Enhanced)
Visual indicator of CQ state:
```tsx
<Badge variant={status}>
  {status === 'OPEN' && '🔓 Open'}
  {status === 'PENDING_REVIEW' && '⏳ Under Review'}
  {status === 'PARTIALLY_SATISFIED' && '⚡ Partially Satisfied'}
  {status === 'SATISFIED' && '✅ Satisfied'}
  {status === 'DISPUTED' && '⚠️ Disputed'}
</Badge>
```

### 5. `CQAuthorDashboard` (New)
For claim authors:
- Pending responses count
- Quick approve/reject actions
- Bulk operations
- Response quality indicators (votes, endorsements)

### 6. `CQActivityFeed` (New)
Audit log display:
- Timeline of all CQ actions
- Who did what, when
- Links to relevant responses/claims

---

## Notification System

### Events to Emit

```ts
// When response submitted
emit('cq:response:submitted', {
  cqStatusId,
  responseId,
  contributorId,
  targetAuthorId, // Notify claim author
});

// When response approved
emit('cq:response:approved', {
  responseId,
  contributorId, // Notify contributor
  approvedBy,
});

// When response rejected
emit('cq:response:rejected', {
  responseId,
  contributorId, // Notify contributor
  reason,
});

// When CQ marked satisfied
emit('cq:satisfied', {
  cqStatusId,
  canonicalResponseId,
  claimId,
});

// When response gets endorsements
emit('cq:response:endorsed', {
  responseId,
  contributorId, // Notify contributor
  endorserCount,
});
```

### Notification Preferences

Users should be able to control:
- Email on CQ response to my claims
- Email on my CQ response approved/rejected
- Email on high-quality response to CQs I'm following
- In-app notifications for all above

---

## Reputation & Incentives

### Earn Reputation For:
- **+50**: CQ response approved
- **+100**: CQ response selected as canonical
- **+10**: CQ response upvoted (max 100/response)
- **+25**: CQ response endorsed by participant

### Lose Reputation For:
- **-10**: CQ response rejected
- **-5**: CQ response downvoted (max -50/response)

### Reputation Gates:
- **< 100 rep**: Can submit responses, but they're marked "New Contributor"
- **100-500 rep**: Standard responses
- **500+ rep**: Responses prioritized in review queue
- **1000+ rep**: Can endorse responses (weighted x2)

---

## Migration Strategy

### Phase 1: Schema Extension (No Breaking Changes)
1. Add new tables: `CQResponse`, `CQEndorsement`, `CQActivityLog`
2. Keep existing `CQStatus` table, add new fields
3. Migrate existing `groundsText` → create `CQResponse` with `status=CANONICAL`
4. Backfill `CQStatus.canonicalResponseId`

### Phase 2: API Updates
1. Update `GET /api/cqs` to include response data
2. Add new response submission endpoints
3. Keep `/api/cqs/toggle` for backward compatibility
4. Add permission checks based on room/user roles

### Phase 3: UI Rollout
1. Add "Community Responses" tab to `CriticalQuestionsV3`
2. Build `CQResponseForm` and `CQResponsesList`
3. Update `ClaimMiniMap` to show response counts
4. Add author dashboard for pending reviews

### Phase 4: Notifications
1. Emit new CQ events
2. Wire up notification preferences
3. Email templates for CQ activity

### Phase 5: Reputation Integration
1. Connect CQ approvals to user reputation system
2. Add reputation badges to contributor profiles
3. Analytics on CQ quality by user

---

## Analytics & Insights

### Track:
- Average time to first response
- Average time from submission to approval
- Approval rate by contributor reputation
- CQ satisfaction rate by scheme type
- Community participation rate (% of users submitting responses)

### Dashboards:
- **For Authors**: Which CQs get most responses, quality metrics
- **For Contributors**: My approval rate, reputation earned from CQs
- **For Moderators**: CQs needing review, response quality trends
- **For Platform**: CQ engagement funnel, most active contributors

---

## Open Questions

1. **Should participants be able to edit canonical responses?**
   - Pro: Living documents that improve over time
   - Con: Provenance becomes complex
   - Proposal: Allow "addendum" responses linked to canonical

2. **How to handle disputed CQs?**
   - If new counter-evidence emerges, should CQ revert to DISPUTED?
   - Who can trigger this? Any participant? Only author?
   - Proposal: Author can reopen, or counter-claim with high community support auto-triggers review

3. **What happens when claim author is inactive?**
   - Should moderators be able to approve responses?
   - Should community consensus (e.g., 10+ endorsements) auto-approve?
   - Proposal: After 7 days, moderators can approve; after 30 days, community consensus applies

4. **How to prevent spam/low-quality responses?**
   - Rate limiting (max 5 responses/day per user)
   - Reputation gates (need 50+ rep to submit)
   - Auto-hide responses with -5 net votes
   - Proposal: All of the above

5. **Should CQ responses be shareable/linkable?**
   - Unique URLs for high-quality responses?
   - Embed responses in other deliberations?
   - Proposal: Yes, responses get permanent URLs, can be cited

---

## Success Metrics

### Adoption
- % of CQs with at least one response
- % of claims with satisfied CQs
- Average responses per CQ

### Quality
- % of responses approved
- Average upvotes per response
- Endorsement rate

### Engagement
- % of users who submit at least one CQ response
- % of authors who review responses within 48 hours
- % of viewers who upvote/endorse

### Outcomes
- Time to satisfy CQs (faster with community help?)
- Claim quality improvement (measured by subsequent challenges)
- User retention (do contributors stay engaged?)

---

## Next Steps

1. **Review & Refine**: Gather feedback from team + power users
2. **Prioritize Features**: What's MVP vs. nice-to-have?
3. **Schema Design**: Finalize Prisma models
4. **Wireframes**: UI mockups for new components
5. **Implementation Plan**: Assign tasks, estimate timeline
6. **User Testing**: Pilot with small group before full rollout

---

## Conclusion

By transforming CQs from a single-author binary (satisfied/unsatisfied) into a **multi-layered community dialogue**, we can:

✅ **Reduce author burden**: Community helps satisfy CQs  
✅ **Improve response quality**: Best answers surface via voting/endorsements  
✅ **Increase transparency**: Provenance and audit trails  
✅ **Encourage participation**: Reputation rewards for helpful contributions  
✅ **Preserve author control**: Final say on canonical responses  
✅ **Scale deliberations**: More eyes, more evidence, faster resolution  

This aligns with the **Non-Canonical Moves** philosophy already proven in the codebase, extending it to the critical question layer where collaborative inquiry is most valuable.
