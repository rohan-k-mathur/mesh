# Phase 1 & 2 Implementation Summary
## Issues System Integration - Clarification Requests + NCM Reviews

**Date**: October 23, 2025  
**Status**: Phase 1 & 2 Complete ✅  
**Next**: Phase 3 - Backend API Integration

---

## ✅ Phase 1 Completed: Schema Changes

### Database Schema Updates

**1. Extended `IssueKind` Enum**:
```prisma
enum IssueKind {
  general
  cq
  moderation
  evidence
  structural
  governance
  clarification     // NEW: Q&A system
  community_defense // NEW: NCM review system
}
```

**2. Added Fields to `Issue` Model**:

**Clarification Support**:
- `questionText` (String?) - The actual question
- `answerText` (String?) - Author's answer
- `answeredAt` (DateTime?) - Timestamp when answered
- `answeredById` (BigInt?) - User who answered

**NCM Review Support**:
- `ncmId` (String?) - Link to NonCanonicalMove
- `ncmStatus` (NCMStatus?) - PENDING, APPROVED, REJECTED, EXECUTED
- `reviewedAt` (DateTime?) - When author reviewed
- `reviewNotes` (String?) - Author's feedback

**3. Added Relations**:
- `Issue.answeredBy` → `User` (who answered clarification)
- `Issue.nonCanonicalMove` → `NonCanonicalMove` (NCM being reviewed)
- `NonCanonicalMove.reviewIssues` → `Issue[]` (reverse relation)
- `User.answeredIssues` → `Issue[]` (issues user answered)

**4. Added Indexes**:
```prisma
@@index([deliberationId, kind])  // Filter by kind
@@index([ncmId])                  // Lookup NCM reviews
@@index([assigneeId])             // Author's pending items
```

### Migration Status

✅ Schema pushed to database via `prisma db push`  
✅ Prisma Client regenerated  
✅ All relations validated  
✅ Indexes created

---

## ✅ Phase 2 Completed: Mockup Components

### 1. IssueComposerExtended

**File**: `components/issues/IssueComposerExtended.tsx`

**Features**:
- Supports 3 modes: `general`, `clarification`, `community_defense`
- Dynamic UI based on issue kind
- Clarification mode: Question textarea, character limit
- Community defense mode: Auto-links NCM
- Icon + color theming per kind
- Form validation

**UI States**:
```tsx
// Clarification Mode
<IssueComposer
  kind="clarification"
  questionText="How did you calculate X?"
  targetType="argument"
  targetId="arg123"
/>

// Community Defense Mode
<IssueComposer
  kind="community_defense"
  ncmId="ncm456"
  initialLabel="Review: GROUNDS_RESPONSE"
/>
```

### 2. ClarificationRequestButton

**File**: `components/issues/ClarificationRequestButton.tsx`

**Features**:
- Blue gradient button with HelpCircle icon
- Opens IssueComposer in clarification mode
- Auto-generates label from target
- Pre-fills target information
- Event emission on success

**Usage**:
```tsx
<ClarificationRequestButton
  deliberationId={delibId}
  targetType="argument"
  targetId={arg.id}
  targetLabel={arg.conclusion.text}
/>
```

### 3. NCMReviewCard

**File**: `components/issues/NCMReviewCard.tsx`

**Features**:
- Display NCM content with move type badge
- Contributor info (username, date)
- Argumentation scheme display
- **Approve** button (green, executes as canonical)
- **Reject with Feedback** form (red, requires notes)
- Status badges for APPROVED/REJECTED/EXECUTED
- Loading states

**Actions**:
```tsx
<NCMReviewCard
  ncm={communityResponse}
  onApprove={async () => {
    // Call approve API
  }}
  onReject={async (notes) => {
    // Call reject API with notes
  }}
/>
```

---

## UI Mockups

### Clarification Request Flow

```
┌────────────────────────────────────────┐
│ ArgumentCard                           │
│                                        │
│ [Conclusion Text]                      │
│ • Premise 1                            │
│ • Premise 2                            │
│                                        │
│ [Challenge] [Community Defense]        │
│ [? Request Clarification] ← NEW        │
└────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────┐
│ 🔵 Request Clarification               │
│                                        │
│ 💡 Ask a specific question...          │
│                                        │
│ Your Question                          │
│ ┌────────────────────────────────────┐ │
│ │ How did you calculate the median   │ │
│ │ value in premise 2?                │ │
│ └────────────────────────────────────┘ │
│                                        │
│ [Cancel] [Submit Question]             │
└────────────────────────────────────────┘
```

### NCM Review in Issue Detail

```
┌────────────────────────────────────────┐
│ Issue #42 • community_defense • pending│
│                                        │
│ 🛡️ Community Defense Response          │
│                                        │
│ [🛡️ Grounds] [PENDING]                 │
│ 👤 @alice • 📅 Oct 22, 2025            │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ 💬 Response Content                │ │
│ │                                    │ │
│ │ This argument is supported by the  │ │
│ │ following empirical evidence from  │ │
│ │ Smith et al. (2023)...             │ │
│ │                                    │ │
│ │ Argumentation Scheme: Modus Ponens │ │
│ └────────────────────────────────────┘ │
│                                        │
│ [✓ Approve & Execute]                  │
│ [Reject with Feedback...]              │
└────────────────────────────────────────┘
```

### Issues List with Filters

```
┌────────────────────────────────────────┐
│ Issues & Objections                    │
│                                        │
│ [All] [🔵 Clarifications] [🛡️ Reviews] │
│  8        3                  2         │
│                                        │
│ 🔵 OPEN Need answer                    │
│ "How is X calculated?"                 │
│ clarification • 2h ago • assigned to you│
│                                        │
│ 🛡️ PENDING Review needed               │
│ Community Defense (GROUNDS_RESPONSE)   │
│ community_defense • 1d ago • @alice    │
│                                        │
│ ⚠️ OPEN General Issue                  │
│ "Missing evidence for claim Y"         │
│ general • 3d ago                       │
└────────────────────────────────────────┘
```

---

## Component Architecture

```
IssueComposerExtended
├── General Mode (existing)
├── Clarification Mode (new)
│   ├── Question textarea
│   ├── Character counter
│   └── Submit question button
└── Community Defense Mode (new)
    ├── NCM ID linking
    └── Auto-label generation

ClarificationRequestButton
├── Opens IssueComposer
├── Pre-fills target info
└── Blue gradient styling

NCMReviewCard
├── NCM Content Display
│   ├── Move type badge
│   ├── Contributor info
│   └── Content preview
├── Review Actions
│   ├── Approve button
│   └── Reject form
└── Status Display
    ├── PENDING: Show actions
    ├── APPROVED: Show success
    └── REJECTED: Show rejection note
```

---

## Integration Points

### 1. Adding Clarification Button

```tsx
// In ArgumentCard or ArgumentCardV2
import { ClarificationRequestButton } from "@/components/issues/ClarificationRequestButton";

<footer className="flex items-center gap-2">
  <AttackMenuProV2 ... />
  <CommunityDefenseMenu ... />
  
  <ClarificationRequestButton
    deliberationId={deliberationId}
    targetType="argument"
    targetId={argument.id}
    targetLabel={argument.conclusion.text}
  />
</footer>
```

### 2. Showing NCM Review in IssueDetail

```tsx
// In components/issues/IssueDetail.tsx
import { NCMReviewCard } from "./NCMReviewCard";

{issue.kind === 'community_defense' && issue.ncmId && (
  <NCMReviewCard
    ncm={ncmData}  // Fetched via issue.ncmId
    onApprove={async () => {
      await fetch(`/api/deliberations/${delibId}/issues/${issueId}/approve-ncm`, {
        method: 'POST'
      });
    }}
    onReject={async (notes) => {
      await fetch(`/api/deliberations/${delibId}/issues/${issueId}/reject-ncm`, {
        method: 'POST',
        body: JSON.stringify({ reviewNotes: notes })
      });
    }}
  />
)}
```

### 3. Showing Clarification Q&A

```tsx
// In components/issues/IssueDetail.tsx

{issue.kind === 'clarification' && (
  <div className="space-y-4">
    {/* Question */}
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="text-xs font-medium text-blue-900 mb-2">Question</div>
      <p className="text-sm text-blue-800">{issue.questionText}</p>
    </div>

    {/* Answer (if provided) */}
    {issue.answerText ? (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="text-xs font-medium text-green-900 mb-2">
          Answer by {issue.answeredBy?.username}
        </div>
        <p className="text-sm text-green-800">{issue.answerText}</p>
      </div>
    ) : (
      /* Answer Form (for author) */
      <div className="p-4 bg-white border border-slate-200 rounded-lg">
        <label className="block">
          <span className="text-sm font-medium">Your Answer</span>
          <textarea 
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            className="w-full border rounded-lg p-2 mt-2"
            rows={4}
          />
        </label>
        <button onClick={submitAnswer} className="mt-3 ...">
          Submit Answer
        </button>
      </div>
    )}
  </div>
)}
```

---

## Next Steps: Phase 3 - Backend APIs

### API Endpoints to Create/Modify

#### 1. Modify Issue Creation
**File**: `app/api/deliberations/[id]/issues/route.ts`

```typescript
export async function POST(req: NextRequest, context: { params: { id: string } }) {
  const body = await req.json();
  const { kind, questionText, ncmId, ... } = body;

  // Create issue with new fields
  const issue = await prisma.issue.create({
    data: {
      ...standardFields,
      kind: kind || 'general',
      questionText: kind === 'clarification' ? questionText : null,
      ncmId: kind === 'community_defense' ? ncmId : null,
      ncmStatus: ncmId ? 'PENDING' : null,
    }
  });

  return NextResponse.json({ issue });
}
```

#### 2. Answer Clarification
**File**: `app/api/deliberations/[id]/issues/[issueId]/answer/route.ts` (NEW)

```typescript
export async function POST(req: NextRequest, context: { params: { id: string, issueId: string } }) {
  const { answerText } = await req.json();
  const currentUserId = await getCurrentUserId();

  const issue = await prisma.issue.update({
    where: { id: context.params.issueId },
    data: {
      answerText,
      answeredById: currentUserId,
      answeredAt: new Date(),
      state: 'closed',
      closedAt: new Date(),
    }
  });

  // Notify original requester
  await notifyUser(issue.createdById, {
    type: 'clarification_answered',
    issueId: issue.id,
  });

  return NextResponse.json({ success: true, issue });
}
```

#### 3. Approve NCM
**File**: `app/api/deliberations/[id]/issues/[issueId]/approve-ncm/route.ts` (NEW)

```typescript
export async function POST(req: NextRequest, context: { params: { id: string, issueId: string } }) {
  const currentUserId = await getCurrentUserId();

  const issue = await prisma.issue.findUnique({
    where: { id: context.params.issueId },
    include: { nonCanonicalMove: true },
  });

  if (!issue.nonCanonicalMove) {
    return NextResponse.json({ error: 'No NCM linked' }, { status: 400 });
  }

  // Update NCM status
  await prisma.nonCanonicalMove.update({
    where: { id: issue.ncmId },
    data: { status: 'APPROVED', approvedBy: currentUserId, approvedAt: new Date() },
  });

  // Execute as canonical move
  const canonicalMove = await executeNCMAsCanonical(issue.nonCanonicalMove);

  // Update NCM with canonical link
  await prisma.nonCanonicalMove.update({
    where: { id: issue.ncmId },
    data: {
      status: 'EXECUTED',
      canonicalMoveId: canonicalMove.id,
      executedAt: new Date(),
    },
  });

  // Close issue
  await prisma.issue.update({
    where: { id: issue.id },
    data: {
      state: 'closed',
      ncmStatus: 'EXECUTED',
      reviewedAt: new Date(),
      closedAt: new Date(),
    },
  });

  // Notify contributor
  await notifyUser(issue.nonCanonicalMove.contributorId, {
    type: 'ncm_approved',
    issueId: issue.id,
    ncmId: issue.ncmId,
  });

  return NextResponse.json({ success: true });
}
```

#### 4. Reject NCM
**File**: `app/api/deliberations/[id]/issues/[issueId]/reject-ncm/route.ts` (NEW)

```typescript
export async function POST(req: NextRequest, context: { params: { id: string, issueId: string } }) {
  const { reviewNotes } = await req.json();
  const currentUserId = await getCurrentUserId();

  const issue = await prisma.issue.findUnique({
    where: { id: context.params.issueId },
    include: { nonCanonicalMove: true },
  });

  // Update NCM status
  await prisma.nonCanonicalMove.update({
    where: { id: issue.ncmId },
    data: {
      status: 'REJECTED',
      rejectedBy: currentUserId,
      rejectedAt: new Date(),
      rejectionReason: reviewNotes,
    },
  });

  // Close issue
  await prisma.issue.update({
    where: { id: issue.id },
    data: {
      state: 'closed',
      ncmStatus: 'REJECTED',
      reviewedAt: new Date(),
      reviewNotes,
      closedAt: new Date(),
    },
  });

  // Notify contributor
  await notifyUser(issue.nonCanonicalMove.contributorId, {
    type: 'ncm_rejected',
    issueId: issue.id,
    ncmId: issue.ncmId,
    reviewNotes,
  });

  return NextResponse.json({ success: true });
}
```

#### 5. Auto-Create Issue on NCM Submit
**File**: `app/api/non-canonical/submit/route.ts` (MODIFY)

```typescript
// After creating NCM
const ncm = await prisma.nonCanonicalMove.create({...});

// Auto-create review issue for author
const issue = await prisma.issue.create({
  data: {
    deliberationId,
    label: `Community Defense: ${ncm.moveType.replace('_', ' ')}`,
    description: `Review community-submitted ${ncm.moveType.toLowerCase()}`,
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

// Notify author
await notifyUser(ncm.authorId, {
  type: 'ncm_submitted',
  issueId: issue.id,
  ncmId: ncm.id,
});
```

---

## Testing Checklist

### Phase 1 & 2 (Completed)
- [x] Schema changes pushed to database
- [x] Prisma client regenerated
- [x] IssueComposerExtended component created
- [x] ClarificationRequestButton component created
- [x] NCMReviewCard component created
- [x] All TypeScript types resolved
- [x] No lint errors

### Phase 3 (Next)
- [ ] Create clarification answer endpoint
- [ ] Create NCM approve endpoint
- [ ] Create NCM reject endpoint
- [ ] Modify issue creation to support new kinds
- [ ] Modify NCM submit to auto-create issue
- [ ] Test end-to-end clarification flow
- [ ] Test end-to-end NCM review flow

### Phase 4 (Future)
- [ ] Integrate clarification buttons into UI
- [ ] Update IssueDetail to show clarifications
- [ ] Update IssueDetail to show NCM reviews
- [ ] Add filters to IssuesList (All | Clarifications | Reviews)
- [ ] Create Author Dashboard
- [ ] Add notification system
- [ ] Write unit tests
- [ ] Write integration tests

---

## Files Created/Modified

### Created ✅
- `components/issues/IssueComposerExtended.tsx`
- `components/issues/ClarificationRequestButton.tsx`
- `components/issues/NCMReviewCard.tsx`
- `docs/ISSUES_INTEGRATION_PLAN.md`
- `docs/PHASE_1_2_IMPLEMENTATION_SUMMARY.md`

### Modified ✅
- `lib/models/schema.prisma` (Issue model, User model, NonCanonicalMove model, IssueKind enum)

### To Create (Phase 3)
- `app/api/deliberations/[id]/issues/[issueId]/answer/route.ts`
- `app/api/deliberations/[id]/issues/[issueId]/approve-ncm/route.ts`
- `app/api/deliberations/[id]/issues/[issueId]/reject-ncm/route.ts`

### To Modify (Phase 3)
- `app/api/deliberations/[id]/issues/route.ts`
- `app/api/non-canonical/submit/route.ts`
- `components/issues/IssueDetail.tsx`
- `components/issues/IssuesList.tsx`

---

**Status**: ✅ Phase 1 & 2 Complete  
**Next Action**: Start Phase 3 - Backend API Implementation  
**Estimated Time**: 3-4 days

