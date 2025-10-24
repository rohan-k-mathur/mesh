# Issues System Integration Plan
## Clarification Requests + Community Defense Management

**Date**: October 23, 2025  
**Status**: Planning Phase  
**Goal**: Extend the Issues system to handle clarification requests and provide authors with a unified interface to manage community contributions

---

## Executive Summary

The Issues system already provides a solid foundation for tracking objections and concerns about arguments/claims. We can extend it to handle:

1. **Clarification Requests** - Questions about unclear aspects of arguments
2. **Community Defense Management** - Author workflow for reviewing/approving non-canonical responses
3. **Unified Author Dashboard** - Single place for authors to manage all feedback on their content

---

## Current Issues System Architecture

### Database Models

**Issue**:
```prisma
model Issue {
  id             String     @id @default(cuid())
  deliberationId String
  label          String
  description    String?
  state          IssueState @default(open)  // open | closed | pending
  createdById    BigInt
  closedById     String?
  closedAt       DateTime?
  kind           IssueKind  @default(general)  // general | technical | structural | governance
  key            String?
  assigneeId     BigInt?
  createdAt      DateTime
  updatedAt      DateTime
  
  links          IssueLink[]
}
```

**IssueLink**:
```prisma
model IssueLink {
  id             String
  issueId        String
  targetType     IssueLinkTargetType  // claim | inference | argument | card
  targetId       String
  role           IssueLinkRole?       // related | blocks | depends_on | warrant | evidence
  
  @@unique([issueId, targetType, targetId])
}
```

### Existing Components

1. **IssueComposer** - Modal for creating issues
2. **IssuesList** - Lists all issues for a deliberation
3. **IssueDetail** - Full detail view with links, state management
4. **IssueBadge** - Status badge
5. **IssueEntityPicker** - Picker for linking entities

### Existing API Endpoints

- `POST /api/deliberations/[id]/issues` - Create issue
- `GET /api/deliberations/[id]/issues` - List issues (filter by state)
- `GET /api/deliberations/[id]/issues/[issueId]` - Get issue details
- `PATCH /api/deliberations/[id]/issues/[issueId]` - Update issue (state, assignee)
- `POST /api/deliberations/[id]/issues/[issueId]` - Add link to issue
- `DELETE /api/deliberations/[id]/issues/[issueId]` - Remove link
- `GET /api/deliberations/[id]/issues/counts` - Get issue counts by target

---

## Proposed Extensions

### 1. New Issue Kinds

Extend `IssueKind` enum:

```prisma
enum IssueKind {
  general           // Existing - General objection/concern
  technical         // Existing - Technical problem
  structural        // Existing - Structural issue
  governance        // Existing - Process/governance issue
  clarification     // NEW - Request for clarification
  community_defense // NEW - Community-submitted defense response
}
```

### 2. Enhanced Issue Model

Add fields to support clarification and community defense workflows:

```prisma
model Issue {
  // ... existing fields ...
  
  // NEW: For clarification requests
  questionText      String?      // The actual question being asked
  answerText        String?      // Author's answer (when provided)
  answeredAt        DateTime?    // When the question was answered
  answeredById      BigInt?      // Who answered it
  
  // NEW: For community defense responses
  ncmId             String?      // Link to NonCanonicalMove
  ncmStatus         NCMStatus?   // PENDING | APPROVED | REJECTED | EXECUTED
  reviewedAt        DateTime?    // When author reviewed it
  reviewNotes       String?      // Author's notes on approval/rejection
  
  // Relations
  answeredBy        User?        @relation("AnsweredIssues", fields: [answeredById], references: [id])
  nonCanonicalMove  NonCanonicalMove? @relation(fields: [ncmId], references: [id])
}
```

### 3. Integration Points

#### A. Clarification Request Flow

**User Journey**:
1. User clicks "Request Clarification" on argument/claim
2. Opens IssueComposer with `kind: "clarification"`
3. User types question in `questionText`
4. Issue created and linked to target
5. Author sees in Issues tab
6. Author provides answer → updates `answerText`, sets `state: "closed"`
7. Answer visible to all users

**Components Needed**:
- Extend IssueComposer to support clarification mode
- Add "Request Clarification" button to ArgumentCard/ClaimCard
- Enhanced IssueDetail to show Q&A format
- Filter in IssuesList for "Clarifications" view

#### B. Community Defense Management Flow

**Author Journey**:
1. Community member submits non-canonical response
2. System auto-creates Issue with `kind: "community_defense"`
3. Issue appears in author's Issues tab
4. Author clicks issue → sees NonCanonicalResponseForm preview
5. Author can:
   - **Approve** → Execute as canonical move, close issue
   - **Reject with feedback** → Add reviewNotes, close issue
   - **Request changes** → Keep open with comments
6. Community member notified of decision

**Components Needed**:
- Auto-creation of issues when NCM submitted
- Enhanced IssueDetail to show NCM preview
- Approve/Reject actions in IssueDetail
- Link between Issue and NonCanonicalMove

---

## Implementation Plan

### Phase 1: Schema & Database (1-2 days)

**Tasks**:
- [ ] Extend `IssueKind` enum with `clarification` and `community_defense`
- [ ] Add new fields to `Issue` model
- [ ] Create migration
- [ ] Run `prisma migrate dev`
- [ ] Regenerate Prisma client

**Files**:
- `lib/models/schema.prisma`

### Phase 2: API Extensions (2-3 days)

**Tasks**:
- [ ] Update issue creation endpoint to handle new kinds
- [ ] Add clarification answer endpoint
- [ ] Add NCM auto-issue creation (webhook/trigger)
- [ ] Update issue detail endpoint to include NCM data
- [ ] Add approve/reject NCM endpoints

**New Endpoints**:
```typescript
// Answer clarification
PATCH /api/deliberations/[id]/issues/[issueId]/answer
Body: { answerText: string }

// Approve NCM via issue
POST /api/deliberations/[id]/issues/[issueId]/approve-ncm
Body: { executeAsCanonical?: boolean }

// Reject NCM via issue
POST /api/deliberations/[id]/issues/[issueId]/reject-ncm
Body: { reviewNotes: string }

// Auto-create issue for NCM
POST /api/non-canonical/submit (modify existing)
// After creating NCM, also create Issue
```

**Files**:
- `app/api/deliberations/[id]/issues/route.ts` (modify)
- `app/api/deliberations/[id]/issues/[issueId]/route.ts` (modify)
- `app/api/deliberations/[id]/issues/[issueId]/answer/route.ts` (new)
- `app/api/deliberations/[id]/issues/[issueId]/approve-ncm/route.ts` (new)
- `app/api/deliberations/[id]/issues/[issueId]/reject-ncm/route.ts` (new)
- `app/api/non-canonical/submit/route.ts` (modify to create issue)

### Phase 3: Component Updates (3-4 days)

#### 3A: Clarification Request Components

**Tasks**:
- [ ] Add "Request Clarification" button to ArgumentCard
- [ ] Extend IssueComposer with clarification mode
- [ ] Create ClarificationQuestionForm component
- [ ] Update IssueDetail to show Q&A format
- [ ] Add answered/unanswered filter to IssuesList

**Components**:
```typescript
// New button in ArgumentCard/ArgumentCardV2
<button onClick={openClarificationRequest}>
  <HelpCircle /> Request Clarification
</button>

// IssueComposer extension
<IssueComposer
  kind="clarification"
  questionText={questionText}
  targetType="argument"
  targetId={argumentId}
/>

// IssueDetail - Q&A view
{issue.kind === 'clarification' && (
  <ClarificationView
    question={issue.questionText}
    answer={issue.answerText}
    onAnswer={handleAnswer}
  />
)}
```

#### 3B: Community Defense Management Components

**Tasks**:
- [ ] Modify NonCanonical submit to auto-create issue
- [ ] Create NCMReviewCard component (shows NCM in issue)
- [ ] Add approve/reject actions to IssueDetail
- [ ] Create notification system for authors
- [ ] Add "Pending Reviews" filter to IssuesList

**Components**:
```typescript
// IssueDetail - NCM review view
{issue.kind === 'community_defense' && (
  <NCMReviewCard
    ncm={issue.nonCanonicalMove}
    onApprove={handleApprove}
    onReject={handleReject}
  />
)}

// IssuesList - filter by kind
<Tabs>
  <TabsTrigger value="all">All Issues</TabsTrigger>
  <TabsTrigger value="clarifications">
    Clarifications ({clarificationCount})
  </TabsTrigger>
  <TabsTrigger value="community">
    Pending Reviews ({pendingNCMCount})
  </TabsTrigger>
</Tabs>
```

#### 3C: Author Dashboard

**Tasks**:
- [ ] Create AuthorDashboard component
- [ ] Show pending clarifications
- [ ] Show pending NCM reviews
- [ ] Show all issues for author's content
- [ ] Add to DeepDivePanelV2 or as separate page

**Components**:
```typescript
// New component
<AuthorDashboard
  userId={currentUserId}
  deliberationId={deliberationId}
/>

// Shows:
// - Pending clarification requests (needs answer)
// - Pending NCM reviews (needs approval/rejection)
// - Open issues on author's arguments
// - Closed/resolved items (archive)
```

### Phase 4: Integration & Polish (2-3 days)

**Tasks**:
- [ ] Add clarification request buttons throughout UI
- [ ] Wire up all event listeners (issues:refresh, etc.)
- [ ] Add notifications for new clarifications
- [ ] Add notifications for NCM approvals/rejections
- [ ] Update IssuesDrawer to show new kinds
- [ ] Add tooltips and help text
- [ ] Write integration tests
- [ ] Update documentation

---

## User Stories

### Story 1: Clarification Request

**As a** deliberation participant  
**I want to** ask for clarification on an unclear argument  
**So that** I can better understand the author's reasoning

**Acceptance Criteria**:
- [ ] "Request Clarification" button visible on arguments
- [ ] Clicking opens clarification form
- [ ] Can type question and submit
- [ ] Author receives notification
- [ ] Author can answer directly in Issues tab
- [ ] Answer visible to all participants
- [ ] Issue marked as "answered" when completed

### Story 2: Author Reviewing Community Defense

**As an** argument author  
**I want to** review and approve community-submitted defenses  
**So that** helpful contributions can become canonical moves

**Acceptance Criteria**:
- [ ] When NCM submitted, issue auto-created
- [ ] Issue appears in my Issues tab
- [ ] Can see full NCM content in issue detail
- [ ] Can approve → executes as canonical move
- [ ] Can reject with reason
- [ ] Contributor notified of decision
- [ ] Issue closed after review

### Story 3: Unified Author Workflow

**As an** argument author  
**I want** a single place to manage all feedback  
**So that** I don't miss important questions or contributions

**Acceptance Criteria**:
- [ ] Author Dashboard shows all pending items
- [ ] Grouped by type: clarifications, NCM reviews, issues
- [ ] Can filter by state (open, pending, closed)
- [ ] Can sort by date, priority
- [ ] One-click to review/respond to each item
- [ ] Notifications for new items

---

## Technical Considerations

### 1. Auto-Issue Creation

When NCM is submitted, automatically create an Issue:

```typescript
// In /api/non-canonical/submit/route.ts
async function createReviewIssue(ncm: NonCanonicalMove) {
  const issue = await prisma.issue.create({
    data: {
      deliberationId: ncm.deliberationId,
      label: `Community Defense: ${ncm.moveType}`,
      description: `Review community-submitted ${ncm.moveType.replace('_', ' ').toLowerCase()}`,
      kind: 'community_defense',
      state: 'pending',
      createdById: ncm.contributorId,
      assigneeId: ncm.authorId,  // Assign to content author
      ncmId: ncm.id,
      ncmStatus: 'PENDING',
    }
  });
  
  // Link to target
  await prisma.issueLink.create({
    data: {
      issueId: issue.id,
      targetType: ncm.targetType,
      targetId: ncm.targetId,
      role: 'related',
    }
  });
  
  return issue;
}
```

### 2. Approval Workflow

```typescript
// In /api/deliberations/[id]/issues/[issueId]/approve-ncm/route.ts
async function approveNCM(issueId: string, executeAsCanonical: boolean) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { nonCanonicalMove: true },
  });
  
  if (!issue.nonCanonicalMove) throw new Error('No NCM linked');
  
  // Update NCM status
  await prisma.nonCanonicalMove.update({
    where: { id: issue.ncmId },
    data: { status: 'APPROVED' },
  });
  
  // Optionally execute as canonical
  if (executeAsCanonical) {
    const canonicalMove = await executeNCMAsCanonical(issue.nonCanonicalMove);
    await prisma.nonCanonicalMove.update({
      where: { id: issue.ncmId },
      data: {
        status: 'EXECUTED',
        canonicalMoveId: canonicalMove.id,
      },
    });
  }
  
  // Close issue
  await prisma.issue.update({
    where: { id: issueId },
    data: {
      state: 'closed',
      ncmStatus: executeAsCanonical ? 'EXECUTED' : 'APPROVED',
      reviewedAt: new Date(),
      closedAt: new Date(),
    },
  });
  
  // Notify contributor
  await notifyUser(issue.nonCanonicalMove.contributorId, {
    type: 'ncm_approved',
    issueId,
    ncmId: issue.ncmId,
  });
}
```

### 3. Notification System

```typescript
// Notifications to implement:
type NotificationType =
  | 'clarification_requested'   // To author: someone asked a question
  | 'clarification_answered'    // To requester: question was answered
  | 'ncm_submitted'             // To author: new community defense
  | 'ncm_approved'              // To contributor: your defense was approved
  | 'ncm_rejected'              // To contributor: your defense was rejected
  | 'ncm_executed'              // To contributor: your defense is now canonical
```

---

## Migration Strategy

### Phase 1: Add New Fields (Non-Breaking)
- Add new fields as nullable
- Deploy backend changes
- Old issues continue to work

### Phase 2: Add New Issue Kinds (Non-Breaking)
- Add new enum values
- Deploy frontend/backend
- Old issue creation still works

### Phase 3: Gradual Rollout
- Enable clarification requests first
- Test with small user group
- Enable NCM auto-issues
- Monitor performance and UX

### Phase 4: Full Integration
- Update all UI entry points
- Add to onboarding tutorials
- Document in help center
- Announce feature launch

---

## UI/UX Mockups

### Clarification Request Button
```
┌─────────────────────────────────────┐
│ ArgumentCard                        │
│                                     │
│ [Conclusion Text]                   │
│ • Premise 1                         │
│ • Premise 2                         │
│                                     │
│ [Challenge] [Community Defense]     │
│ [? Request Clarification]           │ ← NEW
└─────────────────────────────────────┘
```

### Issues Tab with Filters
```
┌─────────────────────────────────────┐
│ Issues & Objections                 │
│                                     │
│ [All] [Clarifications] [Reviews]    │ ← NEW tabs
│  3      5                 2         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🟢 Need answer: "How is X       │ │
│ │    calculated?"                 │ │
│ │    clarification • 2 hours ago  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🟡 Review needed: Community     │ │
│ │    Defense (GROUNDS_RESPONSE)   │ │
│ │    pending • 1 day ago          │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Issue Detail - Clarification View
```
┌─────────────────────────────────────┐
│ Issue #42 • clarification • open    │
│                                     │
│ ❓ Question                         │
│ "How did you calculate the median   │
│  value in premise 2?"               │
│                                     │
│ Asked by @alice • 3 hours ago       │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 💬 Your Answer                  │ │
│ │ [Text area...]                  │ │
│ │                                 │ │
│ │ [Cancel] [Submit Answer]        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Issue Detail - NCM Review View
```
┌─────────────────────────────────────┐
│ Issue #43 • community_defense • pending │
│                                     │
│ 🛡️ Community Defense Response       │
│                                     │
│ Type: GROUNDS_RESPONSE              │
│ Submitted by @bob • 1 day ago       │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Response content preview...]   │ │
│ │                                 │ │
│ │ "This argument is supported by  │ │
│ │  the following evidence..."     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Reject with Feedback...]           │
│ [✓ Approve & Execute]               │
└─────────────────────────────────────┘
```

---

## Testing Plan

### Unit Tests
- [ ] Issue creation with clarification kind
- [ ] Issue creation with community_defense kind
- [ ] Auto-issue creation on NCM submit
- [ ] Approve NCM workflow
- [ ] Reject NCM workflow
- [ ] Answer clarification workflow

### Integration Tests
- [ ] End-to-end clarification request flow
- [ ] End-to-end NCM review flow
- [ ] Notification delivery
- [ ] Issue filtering by kind
- [ ] Author dashboard data aggregation

### User Acceptance Tests
- [ ] Request clarification on argument
- [ ] Author answers clarification
- [ ] Submit community defense
- [ ] Author approves/rejects NCM
- [ ] View all pending items in dashboard

---

## Documentation Updates

### User Documentation
- [ ] "How to Request Clarification" guide
- [ ] "Managing Community Contributions" (for authors)
- [ ] "Submitting Community Defenses" (for contributors)
- [ ] Issues tab overview

### Developer Documentation
- [ ] Issues API reference (updated)
- [ ] Issue kind enumeration
- [ ] Auto-issue creation patterns
- [ ] Notification system integration

---

## Success Metrics

**Adoption**:
- Number of clarification requests per week
- Number of clarifications answered
- Number of NCMs reviewed via issues
- Time to review (average)

**Quality**:
- Clarification answer rate (% answered)
- NCM approval rate
- User satisfaction (survey)
- Reduction in unanswered questions

**Performance**:
- Issue creation latency
- Notification delivery time
- Dashboard load time
- API response times

---

## Next Steps

1. **Review & Approve Plan** (30 min)
   - Stakeholder review
   - Technical feasibility check
   - Resource allocation

2. **Schema Design** (1 hour)
   - Finalize new fields
   - Write migration
   - Review with team

3. **Start Phase 1** (Day 1-2)
   - Schema updates
   - Database migration
   - Prisma regeneration

4. **Kickoff Phase 2** (Day 3-5)
   - API endpoint updates
   - Auto-issue creation
   - Testing

---

**Last Updated**: October 23, 2025  
**Next Review**: After Phase 1 completion
