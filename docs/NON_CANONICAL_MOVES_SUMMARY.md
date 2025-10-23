# Non-Canonical Moves Feature: Implementation Summary

**Feature**: Community-Sourced Dialogue Responses with Approval Workflow  
**Date**: October 22, 2025  
**Status**: ✅ Specification Complete, Ready for Implementation

---

## What Was Delivered

This feature enables **community-driven collaborative argumentation** by allowing any user to help defend arguments, answer challenges, and provide clarifications — with author approval before moves become canonical.

### 📦 Deliverables

1. **Database Schema** (`docs/NON_CANONICAL_MOVES_SCHEMA.md`)
   - Complete Prisma models for `NonCanonicalMove` and `ClarificationRequest`
   - Migration scripts
   - Query examples
   - Relations and indexes

2. **Technical Specification** (`docs/NON_CANONICAL_MOVES_SPEC.md`)
   - Full system architecture
   - Data flow diagrams
   - 7 API endpoint specs
   - Integration points
   - Security & permissions
   - Event system design
   - 4-phase implementation plan

3. **UI Component Designs** (`docs/NON_CANONICAL_MOVES_UI.md`)
   - 6 production-ready React components
   - Integration examples
   - Mobile responsive patterns
   - Accessibility guidelines

---

## Core Concepts

### 1. Non-Canonical Moves

Community members can submit responses that start as "pending" and require author approval:

- **GROUNDS_RESPONSE**: Answer a WHY challenge
- **CLARIFICATION_ANSWER**: Respond to a clarification request
- **CHALLENGE_RESPONSE**: Defend against an attack
- **EVIDENCE_ADDITION**: Add supporting evidence
- **PREMISE_DEFENSE**: Defend an undermined premise

### 2. Approval Workflow

```
PENDING → APPROVED → EXECUTED (canonical)
   ↓          ↓
   ↓          └──→ (stays approved, informational only)
   └──────→ REJECTED
```

### 3. Clarification System

Non-protocol questions for factual details:
- Any user can ask clarification questions
- Community members can answer
- Asker marks answers as "helpful"
- Does NOT create canonical dialogue moves

---

## Key Features

### For Community Members

✅ **Help Answer Challenges**: See WHY moves, submit responses  
✅ **Provide Clarifications**: Answer factual questions  
✅ **Defend Arguments**: Help strengthen weak positions  
✅ **Earn Reputation**: Track helpful contributions  

### For Argument Authors

✅ **Review Dashboard**: See all pending responses in one place  
✅ **Quick Approval**: One-click approve/reject  
✅ **Selective Execution**: Approve without making canonical  
✅ **Feedback System**: Comment on rejected responses  

### For Viewers

✅ **Community Insights**: See non-canonical responses  
✅ **Quality Signals**: Approved responses show credibility  
✅ **Learning Resource**: View multiple perspectives  

---

## Database Schema

### NonCanonicalMove Table

```prisma
model NonCanonicalMove {
  id             String    @id @default(cuid())
  deliberationId String
  targetMoveId   String?
  targetType     String
  targetId       String
  contributorId  String
  authorId       String
  moveType       MoveType
  content        Json
  status         NCMStatus @default(PENDING)
  approvedBy     String?
  approvedAt     DateTime?
  rejectedBy     String?
  rejectedAt     DateTime?
  canonicalMoveId String?  @unique
  executedAt     DateTime?
  metaJson       Json     @default("{}")
}

enum NCMStatus {
  PENDING
  APPROVED
  EXECUTED
  REJECTED
  WITHDRAWN
}
```

### ClarificationRequest Table

```prisma
model ClarificationRequest {
  id             String              @id @default(cuid())
  deliberationId String
  targetType     String
  targetId       String
  askerId        String
  question       String              @db.Text
  status         ClarificationStatus @default(OPEN)
}

enum ClarificationStatus {
  OPEN
  ANSWERED
  RESOLVED
  CLOSED
}
```

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/non-canonical/submit` | POST | Submit community response |
| `/api/non-canonical/pending` | GET | Get pending responses (author view) |
| `/api/non-canonical/approve` | POST | Approve response (optionally execute) |
| `/api/non-canonical/reject` | POST | Reject response |
| `/api/non-canonical/by-target` | GET | Get responses for argument/claim |
| `/api/clarification/request` | POST | Submit clarification request |
| `/api/clarification/list` | GET | Get clarifications for target |

---

## UI Components

### 1. NonCanonicalResponseForm
Modal for submitting community responses with:
- Context display (challenge, argument)
- Rich text editor
- Evidence picker
- Submission feedback

### 2. PendingResponsesList
Drawer for authors to review pending responses:
- Grouped by deliberation/argument
- Quick approve/reject actions
- Batch operations
- Contributor profiles

### 3. CommunityResponsesTab
Display in AttackMenuPro/ArgumentCard:
- Stats (pending/approved/executed)
- Response cards with status
- Submit new response button

### 4. ClarificationRequestButton
Floating action button:
- Opens modal for question
- Shows count of existing requests
- Links to clarification list

### 5. ClarificationList
Displays Q&A pairs:
- Question with asker info
- Multiple answers
- "Helpful" badges from asker
- Answer submission form

### 6. CommunityResponseBadge
Small notification badge:
- Shows count
- Color-coded by status
- Opens details on click

---

## Integration Points

### Existing Components

1. **AttackMenuProV2**: Add "Community Responses" tab
2. **ArgumentCard**: Add community badge + clarification button
3. **LegalMoveChips**: Add "Help Answer" button for GROUNDS
4. **Header**: Add pending notification badge
5. **DialogueInspector**: Show non-canonical context

### New Events

- `non-canonical:submitted`
- `non-canonical:approved`
- `non-canonical:rejected`
- `clarification:requested`
- `clarification:answered`

---

## User Workflows

### Workflow 1: Help Defend Argument

```
Community member → sees WHY challenge
    ↓
Clicks "Help Answer This"
    ↓
Writes response + adds evidence
    ↓
Submits (status = PENDING)
    ↓
Author receives notification
    ↓
Author reviews & approves
    ↓
Response becomes canonical GROUNDS move
    ↓
Contributor earns reputation badge
```

### Workflow 2: Clarification Request

```
User → unclear term in argument
    ↓
Clicks "Request Clarification"
    ↓
Asks factual question
    ↓
Expert sees request, submits answer
    ↓
Asker marks answer as "Helpful"
    ↓
Answer displayed with ✓ badge
```

---

## Implementation Plan

### Phase 1: Database & API (Week 1)
- ✅ Add Prisma models
- Run migrations
- Create 7 API endpoints
- Add event types
- Unit tests

### Phase 2: Core UI (Week 2)
- Build 6 UI components
- Component tests
- Storybook stories
- Accessibility audit

### Phase 3: Integration (Week 3)
- Wire into AttackMenuPro
- Add to ArgumentCard
- Notification system
- Bus events
- End-to-end tests

### Phase 4: Polish (Week 4)
- Loading states
- Error handling
- Mobile optimization
- User testing
- Analytics
- Documentation

---

## Security & Permissions

### Rules

- ✅ **R1**: Authors cannot submit non-canonical for own arguments
- ✅ **R2**: Only authors can approve/reject responses
- ✅ **R3**: Only contributors can withdraw their responses
- ✅ **R4**: Clarification askers can mark answers helpful
- ✅ **R5**: No duplicate pending responses

### Validation

- Target exists in deliberation
- User has permission to submit
- Content is non-empty
- No XSS/injection attacks

---

## Benefits

### For Authors
- Reduced burden to defend arguments
- Leverage community expertise
- Maintain control over canonical moves

### For Community
- Collaborative knowledge building
- Learn from others' responses
- Earn reputation

### For Platform
- Increased engagement
- Higher quality arguments
- Reduced abandonment

---

## Success Metrics

Track these to measure feature impact:

1. **Adoption**:
   - % of deliberations with non-canonical responses
   - Avg responses per argument
   - Clarification request rate

2. **Quality**:
   - Approval rate (target: >60%)
   - Execution rate (approved → canonical)
   - User ratings of helpfulness

3. **Engagement**:
   - Repeat contributors
   - Time to first response
   - Response diversity (unique contributors)

4. **Outcomes**:
   - CQ satisfaction rate improvement
   - Argument strength scores
   - User retention

---

## Next Steps

### Immediate (Week 1)
1. Review specs with team
2. Get stakeholder sign-off
3. Create GitHub issues for each phase
4. Set up project board
5. Run migration on dev database

### Development (Weeks 2-4)
1. Start with API endpoints (most foundational)
2. Build & test UI components in isolation
3. Integrate one component at a time
4. User testing at each phase

### Launch
1. Feature flag rollout
2. Beta test with power users
3. Gather feedback
4. Iterate on UX
5. Full launch with docs

---

## Files Created

1. `docs/NON_CANONICAL_MOVES_SCHEMA.md` (450+ lines)
   - Complete database design
   - Migration scripts
   - Query examples

2. `docs/NON_CANONICAL_MOVES_SPEC.md` (850+ lines)
   - System architecture
   - API specifications
   - Integration guide
   - Implementation roadmap

3. `docs/NON_CANONICAL_MOVES_UI.md` (750+ lines)
   - 6 component designs
   - Code examples
   - Integration patterns
   - Mobile & accessibility

4. `docs/NON_CANONICAL_MOVES_SUMMARY.md` (this file)
   - Executive summary
   - Quick reference

---

## Questions?

**Technical questions**: See detailed specs in `docs/NON_CANONICAL_MOVES_SPEC.md`  
**Database questions**: See `docs/NON_CANONICAL_MOVES_SCHEMA.md`  
**UI questions**: See `docs/NON_CANONICAL_MOVES_UI.md`

---

## Conclusion

This feature transforms Mesh from individual-centric argumentation to **community-driven collaborative deliberation**. By allowing any participant to help defend arguments and provide clarifications (with author approval), we:

✅ Reduce bottlenecks  
✅ Leverage collective intelligence  
✅ Maintain argument quality  
✅ Increase engagement  
✅ Build a learning community  

**The feature is fully specified and ready for implementation.** All database schemas, API contracts, and UI components are designed and documented. Development can begin immediately following the 4-phase plan.

---

**Implementation by**: GitHub Copilot  
**Date**: October 22, 2025  
**Status**: ✅ Complete, Ready to Build
