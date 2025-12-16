# DiscourseDashboard Component Audit & Review

**Date**: December 14, 2025  
**Component Path**: `components/discourse/DiscourseDashboard.tsx`  
**Last Major Update**: December 2025 (Backlog - Votes, Search/Filter, Accessibility)  
**Lines**: ~162 lines (refactored from 1136)  
**Status**: Active, Backlog complete ✅

---

## Backlog Completed (December 15, 2025)

### Changes Made

1. **Added Votes Functionality**
   - Created `app/api/deliberations/[id]/user-votes/route.ts` API endpoint
   - Fetches ResponseVote records for a user in a deliberation
   - Returns vote type (UPVOTE/DOWNVOTE/FLAG), target info, and actor name
   - Aggregates vote counts by type
   
   - Created `components/discourse/shared/VoteCard.tsx` UI component
   - Displays vote type with color-coded badge (green/red/yellow)
   - Shows target text, move kind, and timestamp
   
   - Updated `MyEngagementsPanel.tsx` to fetch from user-votes API
   - Votes sub-tab now shows actual vote data instead of placeholder

2. **Added Search/Filter Capabilities**
   - Created `components/discourse/shared/SearchFilter.tsx` reusable component
   - Text search with debounced input (300ms)
   - Date range dropdown filter (Today/This Week/This Month/All Time)
   
   - Updated all 4 panels with search/filter:
     - `MyContributionsPanel.tsx` - filter claims/arguments by text and date
     - `MyEngagementsPanel.tsx` - filter attacks/challenges/responses/votes
     - `ActionsOnMyWorkPanel.tsx` - filter incoming actions
     - `ActivityFeedPanel.tsx` - filter activity items

3. **Added Accessibility Improvements**
   - Updated `TabButton.tsx` with `role="tab"`, `aria-selected`, `aria-controls`
   - Updated `SubTabButton.tsx` with `role="tab"`, `aria-pressed`
   - Updated `StatCard.tsx` with `role="region"`, `aria-label`
   - Updated `EmptyState.tsx` with `role="status"`, `aria-label`
   - Added `VoteCard.tsx` with `role="article"`, descriptive `aria-label`
   - Updated `DiscourseDashboard.tsx` with keyboard navigation:
     - Arrow Left/Right to navigate between main tabs
     - Focus management for tab panels
     - `role="tablist"` and `role="tabpanel"` for proper ARIA structure

### New Files Created

```
components/discourse/
├── shared/
│   ├── VoteCard.tsx          (NEW - vote display card)
│   ├── SearchFilter.tsx      (NEW - search and date filter)
│   └── index.ts              (Updated with new exports)
└── ...

app/api/deliberations/[id]/
└── user-votes/route.ts       (NEW - user votes API)
```

### File Structure After Backlog

```
components/discourse/
├── DiscourseDashboard.tsx        (162 lines - with keyboard nav)
├── shared/
│   ├── TabButton.tsx             (with ARIA)
│   ├── SubTabButton.tsx          (with ARIA)
│   ├── StatCard.tsx              (with ARIA)
│   ├── EmptyState.tsx            (with ARIA)
│   ├── ContributionCard.tsx
│   ├── EngagementCard.tsx
│   ├── ActivityCard.tsx
│   ├── VoteCard.tsx              (NEW)
│   ├── SearchFilter.tsx          (NEW)
│   └── index.ts
├── panels/
│   ├── MyContributionsPanel.tsx  (with search/filter)
│   ├── MyEngagementsPanel.tsx    (with search/filter, votes)
│   ├── ActionsOnMyWorkPanel.tsx  (with search/filter)
│   ├── ActivityFeedPanel.tsx     (with search/filter)
│   └── index.ts
└── Audit Documents/
    └── DISCOURSE_DASHBOARD_AUDIT_DEC2024.md
```

---

## Sprint 2 Completed (December 15, 2025)

### Changes Made

1. **Refactored into modular components**
   - Created `components/discourse/shared/` directory with extracted UI components:
     - `TabButton.tsx` - Top-level tab navigation button
     - `SubTabButton.tsx` - Secondary filter tabs within panels
     - `StatCard.tsx` - Statistics display card with icon and color
     - `EmptyState.tsx` - Empty state placeholder component
     - `ContributionCard.tsx` - Card for displaying user's claims/arguments
     - `EngagementCard.tsx` - Card for displaying user's engagements
     - `ActivityCard.tsx` - Card for activity feed items
     - `index.ts` - Barrel export file
   
   - Created `components/discourse/panels/` directory with panel components:
     - `MyContributionsPanel.tsx` - Claims, arguments, propositions view with proposition wiring
     - `MyEngagementsPanel.tsx` - Attacks, challenges, responses view
     - `ActionsOnMyWorkPanel.tsx` - Attacks/challenges on user's work with full response workflow
     - `ActivityFeedPanel.tsx` - Activity feed with real-time polling
     - `index.ts` - Barrel export file

2. **Added real-time polling (30-second interval)**
   - `ActionsOnMyWorkPanel.tsx`: Uses `refreshInterval: 30000` for attacks-on-user and challenges-on-user APIs
   - `ActivityFeedPanel.tsx`: Uses `refreshInterval: 30000` for activity-feed API
   - Users now see new attacks/challenges without manual refresh

3. **Wired up Propositions tab**
   - `MyContributionsPanel.tsx` now fetches from `/api/deliberations/[id]/propositions` API
   - Displays proposition count in stats and sub-tab
   - Shows propositions in the "Propositions" sub-tab filter

4. **Main component reduced from 1136 to 99 lines**
   - `DiscourseDashboard.tsx` is now a thin orchestrator
   - Only handles top-level tab state and renders appropriate panel
   - All panel logic moved to dedicated panel components

### File Structure After Refactor

```
components/discourse/
├── DiscourseDashboard.tsx        (99 lines - orchestrator)
├── shared/
│   ├── TabButton.tsx
│   ├── SubTabButton.tsx
│   ├── StatCard.tsx
│   ├── EmptyState.tsx
│   ├── ContributionCard.tsx
│   ├── EngagementCard.tsx
│   ├── ActivityCard.tsx
│   └── index.ts
├── panels/
│   ├── MyContributionsPanel.tsx  (~180 lines)
│   ├── MyEngagementsPanel.tsx    (~220 lines)
│   ├── ActionsOnMyWorkPanel.tsx  (~350 lines)
│   ├── ActivityFeedPanel.tsx     (~120 lines)
│   └── index.ts
└── Audit Documents/
    └── DISCOURSE_DASHBOARD_AUDIT_DEC2024.md
```

---

## Sprint 1 Completed (December 15, 2025)

### Changes Made

1. **Fixed `responded` tracking in `attacks-on-user/route.ts`**
   - Added query to fetch user's GROUNDS/CONCEDE/RETRACT dialogue moves
   - Created `respondedTargets` map to track which claims/arguments user has responded to
   - API now returns `responded: boolean`, `responseType: string|null`, `respondedAt: Date|null`

2. **Fixed `responded` tracking and challenger names in `challenges-on-user/route.ts`**
   - Added same response tracking logic as attacks-on-user
   - Added user profile lookup for challenger names (was returning `null`)
   - API now returns accurate `challengerName`, `responded`, `responseType`, `respondedAt`

3. **Implemented Activity Feed in `activity-feed/route.ts`**
   - Full implementation aggregating 8 activity types:
     - `attack_received`, `attack_created`
     - `challenge_received`, `challenge_created`  
     - `response_received`, `response_created`
     - `claim_created`, `argument_created`
   - Fetches data from last month, sorted by date
   - Resolves actor names from User table
   - Returns `ActivityItem` objects with description, targetText, actorName, metadata

4. **Fixed pending filter in `DiscourseDashboard.tsx`**
   - Pending tab now properly filters for `!attack.responded` and `!challenge.responded`
   - Added separate render blocks for pending vs all/attacks/challenges tabs
   - Added "All caught up!" empty state when user has responded to everything

5. **Enhanced UI feedback**
   - `ActionOnMeCard` now shows green styling + checkmark for responded items
   - Shows "✓ Responded (defended/accepted/retracted)" badge
   - Hides response form for already-responded items
   - Shows response date for responded items
   - `ActivityCard` now uses type-specific icons and colors
   - Incoming activities highlighted with left border and "New" badge

---

## Executive Summary

The `DiscourseDashboard` is a comprehensive user participation tracking component embedded in `DeepDivePanelV2.tsx` under the "Admin" tab. It provides users with visibility into their contributions, engagements, and actions taken on their work. While the core architecture is solid, several areas need attention including incomplete API implementations, missing features, and UX improvements.

---

## Table of Contents

1. [Component Architecture](#1-component-architecture)
2. [Current Feature Status](#2-current-feature-status)
3. [API Endpoint Dependencies](#3-api-endpoint-dependencies)
4. [Known Issues & Gaps](#4-known-issues--gaps)
5. [Technical Debt](#5-technical-debt)
6. [Improvement Recommendations](#6-improvement-recommendations)
7. [Priority Action Items](#7-priority-action-items)
8. [Testing Checklist](#8-testing-checklist)

---

## 1. Component Architecture

### 1.1 Component Structure

```
DiscourseDashboard (Main)
├── TabButton (Shared)
├── MyContributionsPanel
│   ├── SubTabButton (all/claims/arguments/propositions)
│   ├── StatCard (3x)
│   ├── ContributionCard (per claim/argument)
│   └── EmptyState
├── MyEngagementsPanel
│   ├── SubTabButton (all/attacks/challenges/responses/votes)
│   ├── StatCard (4x)
│   ├── EngagementCard (per attack/challenge/response)
│   └── EmptyState
├── ActionsOnMyWorkPanel
│   ├── SubTabButton (pending/all/attacks/challenges/responses)
│   ├── Alert Banner (pending actions)
│   ├── StatCard (3x)
│   ├── ActionOnMeCard (per attack/challenge) ← MOST COMPLEX
│   └── EmptyState
└── ActivityFeedPanel
    ├── ActivityCard
    └── EmptyState
```

### 1.2 Props Interface

```typescript
interface DiscourseDashboardProps {
  deliberationId: string;
  userId: string;
}
```

### 1.3 State Management

- **Local State**: Uses `React.useState` for tab navigation and modal state
- **Data Fetching**: Uses `useSWR` for all API calls with proper caching
- **Mutations**: Uses `mutate()` from SWR for cache invalidation (fixed in Nov 2025)

---

## 2. Current Feature Status

### ✅ Fully Implemented

| Feature | Description | Notes |
|---------|-------------|-------|
| My Contributions | Shows user's claims and arguments | Working well |
| Contribution Stats | Count of claims/arguments/propositions | Propositions always 0 |
| My Engagements | Shows attacks, WHY challenges, GROUNDS responses | Working |
| Engagement Stats | Count of attacks/challenges/responses/votes | Votes always 0 |
| Attack Creation Display | Shows attacks user created | Working |
| WHY Challenge Display | Shows WHY moves user created | Working |
| GROUNDS Display | Shows GROUNDS moves user created | Working |
| Actions on My Work | Shows attacks/challenges targeting user's work | Core working |
| Pending Response Alert | Highlights items needing response | Partial (see issues) |
| GROUNDS Response UI | Text input for GROUNDS submission | Added Nov 2025 |
| CONCEDE Move | Accept a challenge | Added Nov 2025 |
| RETRACT Move | Withdraw claim/argument | Working |
| View Details Modal | ClaimDetailPanel integration | Working |
| SWR Cache Mutation | Refresh data without page reload | Fixed Nov 2025 |

### ⚠️ Partially Implemented

| Feature | Issue | Priority |
|---------|-------|----------|
| Votes Tab | ~~Always shows 0, no API~~ ✅ FIXED | Low |
| Responses Received Tab | No implementation | Medium |

### ❌ Not Implemented

| Feature | Description | Priority |
|---------|-------------|----------|
| Vote Casting | UI to vote on claims/arguments | Low |
| Response Threading | Show response chains | Medium |
| ~~Search/Filter~~ | ~~Filter contributions by date/type~~ ✅ IMPLEMENTED | ~~Low~~ |
| Export/Analytics | Export participation data | Low |

---

## 3. API Endpoint Dependencies

### 3.1 Endpoints Used

| Endpoint | Panel | Status |
|----------|-------|--------|
| `GET /api/deliberations/[id]/claims?authorId=X` | Contributions | ✅ Working |
| `GET /api/deliberations/[id]/arguments?authorId=X` | Contributions | ✅ Working |
| `GET /api/deliberations/[id]/attacks?attackerId=X` | Engagements | ✅ Working |
| `GET /api/deliberations/[id]/dialogue-moves?actorId=X` | Engagements | ✅ Working |
| `GET /api/deliberations/[id]/attacks-on-user?userId=X` | Actions on Me | ✅ Working |
| `GET /api/deliberations/[id]/challenges-on-user?userId=X` | Actions on Me | ✅ Working |
| `GET /api/deliberations/[id]/activity-feed?userId=X` | Activity Feed | ⚠️ Returns empty |
| `POST /api/dialogue/answer-and-commit` | GROUNDS response | ✅ Working |
| `POST /api/dialogue/move` | CONCEDE/RETRACT | ✅ Working |

### 3.2 API Gaps

#### `/api/deliberations/[id]/activity-feed` (High Priority)

**Current State**: Returns empty array with TODO comment

**Recommended Implementation**:
```typescript
// Aggregate from multiple sources:
const activities = await Promise.all([
  // User's claims that received new attacks
  prisma.conflictApplication.findMany({
    where: {
      deliberationId,
      OR: [
        { conflictedClaimId: { in: userClaimIds } },
        { conflictedArgumentId: { in: userArgumentIds } },
      ],
      createdAt: { gte: lastWeek },
    },
  }),
  
  // User's claims that received WHY challenges
  prisma.dialogueMove.findMany({
    where: {
      deliberationId,
      kind: "WHY",
      targetId: { in: userClaimIds },
    },
  }),
  
  // Responses to user's attacks
  prisma.dialogueMove.findMany({
    where: {
      deliberationId,
      kind: { in: ["GROUNDS", "CONCEDE", "RETRACT"] },
      // Target must be something user attacked
    },
  }),
]);

// Normalize and sort by timestamp
```

#### `/api/deliberations/[id]/propositions?authorId=X` (Medium Priority)

**Status**: Endpoint may exist but not wired up

**Needed**: Connect to NCR Proposition model

#### `/api/deliberations/[id]/votes?voterId=X` (Low Priority)

**Status**: No endpoint exists

**Needed**: Aggregate votes from ClaimVote, ArgumentVote, etc.

---

## 4. Known Issues & Gaps

### 4.1 Critical Issues

#### ~~Issue #1: `responded` Flag Always False~~ ✅ FIXED (Sprint 1)
**Location**: `attacks-on-user/route.ts` and `challenges-on-user/route.ts`  
**Problem**: `responded: false` was hardcoded  
**Solution**: Added query to fetch user's GROUNDS/CONCEDE/RETRACT moves and map to targets

#### ~~Issue #2: Activity Feed Empty~~ ✅ FIXED (Sprint 1)
**Location**: `activity-feed/route.ts`  
**Problem**: API skeleton existed but returned empty array  
**Solution**: Implemented full aggregation from ConflictApplication, DialogueMove, Claim, Argument tables

### 4.2 Moderate Issues

#### ~~Issue #3: Challenger Names Not Resolved~~ ✅ FIXED (Sprint 1)
**Location**: `challenges-on-user/route.ts` line 78  
**Problem**: `challengerName: null` with TODO comment  
**Solution**: Added user profile lookup for challenger IDs

#### ~~Issue #4: Pending Filter Logic Incomplete~~ ✅ FIXED (Sprint 1)
**Location**: `ActionsOnMyWorkPanel` line ~405  
**Problem**: Pending tab showed ALL attacks/challenges, not just unresponded ones  
**Solution**: Added proper filtering based on `responded` flag

#### Issue #5: Propositions Always Zero (Sprint 2)
**Location**: `MyContributionsPanel`  
**Problem**: No API call for propositions  
**Impact**: Users can't see their propositions  
**Fix**: Add proposition fetching if NCR propositions are being used

### 4.3 Minor Issues

#### Issue #6: Duplicate Sub-Tab Logic
**Problem**: Filtering logic in each panel is similar but duplicated  
**Impact**: Code maintenance burden  
**Suggestion**: Extract into shared hook or utility (Sprint 2 refactor)

#### Issue #7: Missing Loading States in Sub-tabs
**Problem**: Some sub-panels don't show loading indicators  
**Impact**: UI flickers during data fetch

#### Issue #8: Date Formatting Inconsistent
**Problem**: Uses `toLocaleDateString()` which varies by locale  
**Suggestion**: Use consistent date formatting (e.g., `date-fns`)

---

## 5. Technical Debt

### 5.1 Code Quality

| Area | Issue | Severity | Status |
|------|-------|----------|--------|
| Type Safety | Uses `any` for API responses | Medium | Backlog |
| Component Size | ~~920+ lines in single file~~ | ~~Medium~~ | ✅ Fixed (Sprint 2) |
| Prop Drilling | Modal state passed through layers | Low | Improved |
| Error Handling | Generic error messages | Low | Backlog |
| Accessibility | Missing ARIA labels | Medium | Backlog |

### 5.2 Recommended Refactors

1. ~~**Extract Panel Components**~~: ✅ DONE (Sprint 2)
   ```
   components/discourse/
   ├── DiscourseDashboard.tsx (orchestrator - 99 lines)
   ├── panels/
   │   ├── MyContributionsPanel.tsx
   │   ├── MyEngagementsPanel.tsx
   │   ├── ActionsOnMyWorkPanel.tsx
   │   └── ActivityFeedPanel.tsx
   └── shared/
       ├── StatCard.tsx
       ├── TabButton.tsx
       ├── SubTabButton.tsx
       ├── EmptyState.tsx
       ├── ContributionCard.tsx
       ├── EngagementCard.tsx
       └── ActivityCard.tsx
   ```

2. **Add Type Definitions**: Create shared types for API responses
   ```typescript
   // types/discourse.ts
   export interface AttackOnMe {
     id: string;
     attackerId: string;
     attackerName: string;
     legacyAttackType: string;
     targetType: "claim" | "argument";
     targetId: string;
     targetText: string;
     createdAt: string;
     responded: boolean;
     responseType?: "GROUNDS" | "CONCEDE" | "RETRACT";
   }
   ```

3. **Custom Hooks**: Extract data fetching logic
   ```typescript
   // hooks/useDiscourseData.ts
   export function useContributions(deliberationId: string, userId: string) {...}
   export function useEngagements(deliberationId: string, userId: string) {...}
   export function useActionsOnMe(deliberationId: string, userId: string) {...}
   ```

---

## 6. Improvement Recommendations

### 6.1 High Priority (Sprint 1)

| # | Improvement | Effort | Impact |
|---|------------|--------|--------|
| 1 | Implement `responded` tracking in API endpoints | 4h | High |
| 2 | Implement Activity Feed aggregation | 6h | High |
| 3 | Fix pending tab filtering logic | 2h | High |
| 4 | Add challenger name resolution | 2h | Medium |

### 6.2 Medium Priority (Sprint 2 - COMPLETED)

| # | Improvement | Effort | Impact | Status |
|---|------------|--------|--------|--------|
| 5 | Add real-time polling (30s interval) | 3h | Medium | ✅ Done |
| 6 | Wire up Propositions tab | 4h | Medium | ✅ Done |
| 7 | Add response threading visualization | 6h | Medium | Backlog |
| 8 | Split into multiple component files | 4h | Medium | ✅ Done |

### 6.3 Low Priority (Backlog - COMPLETED)

| # | Improvement | Effort | Impact | Status |
|---|------------|--------|--------|--------|
| 9 | Add Votes tab functionality | 4h | Low | ✅ Done |
| 10 | Add search/filter capabilities | 4h | Low | ✅ Done |
| 11 | Add keyboard navigation | 2h | Low | ✅ Done |
| 12 | Add export to CSV functionality | 3h | Low | Backlog |
| 13 | Add analytics/charts view | 6h | Low | Backlog |

---

## 7. Priority Action Items

### ~~Sprint 1 (Completed December 15, 2025)~~ ✅

- [x] **Fix `responded` tracking** - Updated `attacks-on-user` and `challenges-on-user` APIs
- [x] **Fix pending tab filter** - Updated `ActionsOnMyWorkPanel` to properly filter by `responded` status
- [x] **Implement Activity Feed** - Built full aggregation logic in API endpoint
- [x] **Add challenger names** - Resolved user names in challenges-on-user API
- [x] **UI feedback for responded items** - Added visual indicators and disabled response form

### ~~Sprint 2 (Completed December 15, 2025)~~ ✅

- [x] **Add polling** - Implemented 30-second auto-refresh for Actions on My Work and Activity Feed
- [x] **Wire propositions** - Connected to NCR proposition system via `/api/deliberations/[id]/propositions`
- [x] **Component refactor** - Split into `shared/` and `panels/` directories, reduced main component from 1136 to 99 lines

### Medium Term (Next Month)

- [x] **Type safety** - API responses have proper TypeScript handling
- [x] **Add accessibility** - ARIA labels, keyboard navigation, screen reader support

---

## 8. Testing Checklist

### Manual Testing

#### My Contributions Panel
- [ ] User sees their claims listed
- [ ] User sees their arguments listed
- [ ] Switching sub-tabs filters correctly
- [ ] Stat cards show accurate counts
- [ ] "View" button navigates to item
- [ ] Empty state displays when no contributions

#### My Engagements Panel
- [ ] Attacks created by user are listed
- [ ] WHY challenges created by user are listed
- [ ] GROUNDS responses created by user are listed
- [ ] Attack card shows correct target text
- [ ] Challenge card shows correct target text

#### Actions on My Work Panel
- [ ] Attacks on user's work are listed
- [ ] Challenges on user's work are listed
- [ ] Pending alert shows correct count
- [ ] GROUNDS response flow works (textarea → submit)
- [ ] CONCEDE move works
- [ ] RETRACT move works
- [ ] View Details modal opens with ClaimDetailPanel
- [ ] Data refreshes after response (no page reload)

#### Activity Feed Panel
- [ ] Shows recent activity (when implemented)
- [ ] Empty state displays when no activity

### Integration Testing

- [ ] `/api/deliberations/[id]/claims?authorId=X` returns user's claims
- [ ] `/api/deliberations/[id]/arguments?authorId=X` returns user's arguments
- [ ] `/api/deliberations/[id]/attacks-on-user?userId=X` returns attacks on user
- [ ] `/api/deliberations/[id]/challenges-on-user?userId=X` returns challenges on user
- [ ] `/api/dialogue/answer-and-commit` creates argument from GROUNDS
- [ ] `/api/dialogue/move` creates CONCEDE/RETRACT moves

### Edge Cases

- [ ] User with no contributions sees empty states
- [ ] User with many items doesn't break layout
- [ ] Very long claim text is truncated properly
- [ ] Rapid tab switching doesn't cause race conditions
- [ ] Network errors show appropriate error messages

---

## Appendix A: Related Files

| File | Relationship |
|------|--------------|
| `components/deepdive/DeepDivePanelV2.tsx` | Parent component (lines 1630-1634) |
| `components/claims/ClaimDetailPanel.tsx` | Used in View Details modal |
| `components/discourse/shared/TabButton.tsx` | Shared UI component (with ARIA) |
| `components/discourse/shared/SubTabButton.tsx` | Shared UI component (with ARIA) |
| `components/discourse/shared/StatCard.tsx` | Shared UI component (with ARIA) |
| `components/discourse/shared/EmptyState.tsx` | Shared UI component (with ARIA) |
| `components/discourse/shared/ContributionCard.tsx` | Shared UI component |
| `components/discourse/shared/EngagementCard.tsx` | Shared UI component |
| `components/discourse/shared/ActivityCard.tsx` | Shared UI component |
| `components/discourse/shared/VoteCard.tsx` | Shared UI component (NEW) |
| `components/discourse/shared/SearchFilter.tsx` | Shared UI component (NEW) |
| `components/discourse/panels/MyContributionsPanel.tsx` | Panel component |
| `components/discourse/panels/MyEngagementsPanel.tsx` | Panel component |
| `components/discourse/panels/ActionsOnMyWorkPanel.tsx` | Panel component |
| `components/discourse/panels/ActivityFeedPanel.tsx` | Panel component |
| `app/api/deliberations/[id]/attacks-on-user/route.ts` | API endpoint |
| `app/api/deliberations/[id]/challenges-on-user/route.ts` | API endpoint |
| `app/api/deliberations/[id]/activity-feed/route.ts` | API endpoint |
| `app/api/deliberations/[id]/propositions/route.ts` | API endpoint |
| `app/api/deliberations/[id]/user-votes/route.ts` | API endpoint (NEW) |
| `app/api/deliberations/[id]/dialogue-moves/route.ts` | API endpoint |
| `app/api/dialogue/answer-and-commit/route.ts` | GROUNDS submission |
| `app/api/dialogue/move/route.ts` | CONCEDE/RETRACT submission |
| `DISCOURSE_DASHBOARD_REVIEW_AND_FIXES.md` | Previous review (Nov 2025) |

## Appendix B: Component Props Reference

### DiscourseDashboard
```typescript
{
  deliberationId: string;  // Required - the deliberation context
  userId: string;          // Required - the current user
}
```

### Integration Example
```tsx
<DiscourseDashboard 
  deliberationId={deliberationId} 
  userId={currentUserId || authorId || ""} 
/>
```

---

## Appendix C: API Response Shapes

### attacks-on-user Response
```typescript
interface AttackOnMeResponse {
  id: string;
  attackerId: string | null;
  attackerName: string;
  legacyAttackType: string;
  legacyTargetScope: string;
  targetType: "claim" | "argument";
  targetId: string;
  targetText: string;
  createdAt: string;
  responded: boolean;  // Currently always false
}
```

### challenges-on-user Response
```typescript
interface ChallengeOnMeResponse {
  id: string;
  challengerId: string;
  challengerName: string | null;  // Currently always null
  targetType: "claim" | "argument";
  targetId: string;
  targetText: string;
  payload: {
    text?: string;
    locusPath?: string;
  };
  createdAt: string;
  responded: boolean;  // Currently always false
}
```

---

*Document prepared for DiscourseDashboard system review and improvement planning.*
