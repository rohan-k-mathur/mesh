# Community Defense Menu - Refactored User Flow

**Date**: October 23, 2025  
**Status**: Refactored - Separated from AttackMenuProV2

---

## Overview

The Community Defense feature has been separated into its own dedicated component and workflow, distinct from the formal attack system. This provides a cleaner, more intuitive user experience.

---

## Architecture Changes

### Before (v1.0)
- **Single Modal**: AttackMenuProV2 with 3 tabs (Attacks, CQs, Community)
- **Mixed Concerns**: Formal attacks and community defense in same interface
- **Tab Navigation**: Users had to switch tabs to access community features

### After (v2.0 - Current)
- **Separate Components**: 
  - `AttackMenuProV2` → Formal attacks only (no tabs)
  - `CommunityDefenseMenu` → Community defense (dedicated modal)
- **Side-by-Side Buttons**: Both buttons appear in argument rows
- **Clear Separation**: Attacking vs. Defending are distinct actions

---

## Component Structure

### CommunityDefenseMenu
**Location**: `components/agora/CommunityDefenseMenu.tsx`

**Features**:
- Dedicated modal for community defense
- Green/emerald theme (vs. red for attacks)
- Shield icon (vs. Swords for attacks)
- Badge showing pending response count
- "Help Defend This Argument" button
- Community responses list
- Opens NonCanonicalResponseForm in nested modal

**Integration Points**:
```tsx
// In AIFArgumentsListPro.tsx
<AttackMenuProV2 ... />
<CommunityDefenseMenu ... />
```

---

## User Flow

### 1. Entry Point
**Location**: Argument row in AIFArgumentsListPro

**Buttons**:
- **"Challenge Argument"** (Red/Rose, Swords icon) → Formal attacks
- **"Community Defense"** (Green/Emerald, Shield icon) → Community responses

### 2. Community Defense Modal

**Header**:
- Shield icon
- "Community Defense" title
- Description: "Help defend this argument by providing responses..."

**Content**:
- **Target Summary Card**: Shows the argument being defended
- **Contribute Section**: Prominent "Help Defend" button
- **Community Responses List**: All submissions (pending/approved/rejected)

### 3. Submit Response Flow
1. Click "Help Defend This Argument"
2. NonCanonicalResponseForm modal opens
3. Select response type (Grounds Response, Challenge Response, etc.)
4. Write response
5. Submit → Pending approval
6. Returns to community list showing new submission

---

## Technical Fixes Applied

### 1. Prisma Enum Casting Error
**Problem**: 
```
ERROR: operator does not exist: "MoveType" = text
```

**Solution**:
Changed from:
```typescript
${moveType}::"MoveType"
```

To:
```typescript
CAST(${moveType} AS "MoveType")
```

**Location**: `app/api/non-canonical/submit/route.ts` line 147

### 2. Testing Mode Bypass
**Feature**: Skip ownership check when `DIALOGUE_TESTING_MODE=true`

**Usage**:
```bash
# In .env
DIALOGUE_TESTING_MODE=true
```

Allows testing full flow from a single user account.

---

## Visual Design

### Color Scheme

| Element | Color | Purpose |
|---------|-------|---------|
| Button Background | `from-emerald-500 to-teal-600` | Primary action |
| Button Hover | `from-emerald-600 to-teal-700` | Interactive state |
| Modal Header BG | `from-emerald-50 to-teal-100` | Themed container |
| Icon Color | `text-emerald-700` | Accent color |
| Border | `border-emerald-200` | Subtle definition |

### Icon System
- **Shield**: Protection/defense metaphor
- **Users**: Community collaboration
- **Target**: Argument being defended

---

## Next Steps: Clarification Requests Integration

### Current State
- **Models Exist**: `ClarificationRequest` in schema
- **API Endpoints**: `/api/non-canonical/clarification/*` implemented
- **Components**: `ClarificationRequestButton` created but not integrated

### Integration Options

#### Option A: Embedded in CommunityDefenseMenu
**Pros**:
- Single place for all community contributions
- Natural workflow: view responses → request clarification
- Keeps defense modal as central hub

**Implementation**:
```tsx
// Add to CommunityDefenseMenu
<div className="space-y-4">
  {/* Help Defend Button */}
  <button onClick={() => setHelpDefendOpen(true)}>
    Help Defend This Argument
  </button>
  
  {/* NEW: Request Clarification Button */}
  <ClarificationRequestButton
    deliberationId={deliberationId}
    targetType="argument"
    targetId={target.id}
  />
  
  {/* Community Responses */}
  <CommunityResponsesTab ... />
  
  {/* NEW: Clarification Requests List */}
  <ClarificationRequestsList ... />
</div>
```

#### Option B: Separate Clarification Menu
**Pros**:
- Clean separation of concerns
- Dedicated UI for Q&A flow
- Could be used for claims, arguments, premises separately

**Implementation**:
```tsx
// New component: ClarificationMenu.tsx
// New button in argument rows
<AttackMenuProV2 ... />
<CommunityDefenseMenu ... />
<ClarificationMenu ... />
```

#### Option C: Context Menu (Recommended)
**Pros**:
- Most flexible
- Doesn't clutter button row
- Can add more actions later

**Implementation**:
```tsx
// Add dropdown menu to argument card
<DropdownMenu>
  <DropdownMenuItem onClick={openAttackMenu}>
    Challenge Argument
  </DropdownMenuItem>
  <DropdownMenuItem onClick={openCommunityDefense}>
    Community Defense
  </DropdownMenuItem>
  <DropdownMenuItem onClick={openClarificationRequest}>
    Request Clarification
  </DropdownMenuItem>
</DropdownMenu>
```

### Recommended Approach: Hybrid

**Phase 1** (Quick Win):
- Add `ClarificationRequestButton` to CommunityDefenseMenu
- Show clarification requests in same modal as community responses
- Simple tabs or accordion: "Responses" | "Clarifications"

**Phase 2** (Polish):
- Create dedicated `ClarificationMenu` component
- Add as third button in argument row
- Richer UI: threaded conversations, mark as answered, etc.

---

## Clarification Request Workflow Design

### User Journey
1. **Discovery**: User reads argument, has question
2. **Request**: Click "Request Clarification"
3. **Modal Opens**: Simple form with:
   - Question text area
   - Context (which part is unclear: conclusion, premise, warrant)
   - Submit button
4. **Notification**: Author notified of new clarification request
5. **Author Response**:
   - Sees pending requests in CommunityDefenseMenu or separate panel
   - Can answer directly (becomes canonical clarification)
   - Or approve community member's answer
6. **Resolution**: Question marked as answered, shows in thread

### UI Components Needed
- [x] `ClarificationRequestButton` (exists)
- [ ] `ClarificationRequestForm` (modal for submitting)
- [ ] `ClarificationRequestsList` (shows all requests)
- [ ] `ClarificationRequestCard` (individual request with answers)
- [ ] `ClarificationAnswerForm` (author/community can answer)

### Data Flow
```
User → ClarificationRequestButton
     → ClarificationRequestForm modal
     → POST /api/non-canonical/clarification/request
     → Notification to author
     → Shows in ClarificationRequestsList
     → Author/community can submit answer
     → POST /api/non-canonical/submit (moveType: CLARIFICATION_ANSWER)
     → Author approves → marks clarification as answered
```

---

## Implementation Checklist

### Completed ✅
- [x] Separate CommunityDefenseMenu component
- [x] Remove Community tab from AttackMenuProV2
- [x] Add CommunityDefenseMenu to AIFArgumentsListPro
- [x] Fix Prisma enum casting error
- [x] Add testing mode bypass for ownership check

### Next Sprint (Clarifications) 🔄
- [ ] Create `ClarificationRequestForm` component
- [ ] Create `ClarificationRequestsList` component
- [ ] Create `ClarificationRequestCard` component
- [ ] Integrate into CommunityDefenseMenu (Phase 1)
- [ ] Add "Mark as Answered" functionality
- [ ] Add notifications for new clarification requests
- [ ] Add notifications when clarifications are answered

### Future Enhancements 🔮
- [ ] Threaded clarification conversations
- [ ] Upvote/downvote on clarification requests
- [ ] Filter by answered/unanswered
- [ ] Search clarifications
- [ ] Export clarifications as FAQ
- [ ] Link related clarifications
- [ ] Auto-suggest similar existing clarifications

---

## Testing Plan

### Manual Testing
1. **Separation Test**:
   - [ ] Click "Challenge Argument" → Opens AttackMenuProV2 (no tabs)
   - [ ] Click "Community Defense" → Opens CommunityDefenseMenu
   - [ ] Verify both modals work independently

2. **End-to-End Flow** (with `DIALOGUE_TESTING_MODE=true`):
   - [ ] Create argument as User A
   - [ ] Submit community response as User A (should work in test mode)
   - [ ] View pending response in Community Defense modal
   - [ ] Approve response
   - [ ] Verify response shows as approved

3. **Error Handling**:
   - [ ] Submit duplicate response → Should show error
   - [ ] Submit with invalid move type → Should show error
   - [ ] Submit for non-existent target → Should show 404

4. **Prisma Fix Verification**:
   - [ ] Submit all 6 move types (GROUNDS_RESPONSE, CLARIFICATION_ANSWER, etc.)
   - [ ] Verify no enum casting errors in logs
   - [ ] Check database records are created correctly

### Automated Tests
```typescript
// Test suite structure
describe('CommunityDefenseMenu', () => {
  it('renders with correct styling')
  it('shows community response badge')
  it('opens NonCanonicalResponseForm on click')
  it('refreshes list after submission')
})

describe('NonCanonical Submit API', () => {
  it('accepts valid move types')
  it('casts enum correctly')
  it('bypasses ownership check in test mode')
  it('enforces ownership check in production')
})
```

---

## Documentation Updates Needed

### User-Facing Docs
- [ ] Update "How to Defend Arguments" guide
- [ ] Create "Community Defense Tutorial" video/GIF
- [ ] Add tooltips explaining move types
- [ ] FAQ: "When to use Community Defense vs. Formal Attacks"

### Developer Docs
- [ ] API reference for all clarification endpoints
- [ ] Component architecture diagram
- [ ] Integration guide for new contexts (claims, premises)
- [ ] Prisma enum best practices doc

---

**Last Updated**: October 23, 2025  
**Next Review**: After clarification request integration
