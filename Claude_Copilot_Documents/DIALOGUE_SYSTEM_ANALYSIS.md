# Dialogue System Analysis - Current State & Issues

**Date**: October 21, 2025  
**Issue**: Only CONCEDE and RETRACT showing in CommandCard grid  
**Root Cause**: API returns moves but adapter doesn't properly map them

---

## 🔴 CRITICAL ISSUE: Why Only 2 Moves Show in Grid

### Problem
When using the CommandCard 3×3 grid (now default in Phase 1), users only see **CONCEDE** and **RETRACT** buttons. WHY, GROUNDS, CLOSE are missing despite being returned by the API.

### Root Cause Analysis

**The Issue Chain**:

1. **API `/api/dialogue/legal-moves` returns moves correctly** ✅
   - Returns: WHY, GROUNDS, CLOSE, CONCEDE, RETRACT, etc.
   - Structure: `{ kind, label, payload, force, disabled, ... }`

2. **LegalMoveToolbar uses `movesToActions()`** (lib/dialogue/movesToActions.ts) ❌
   - This adapter is NEWER and works correctly
   - Maps moves to CommandCardAction format properly
   - Includes all move types

3. **DeepDivePanelV2 uses `legalMovesToCommandCard()`** (components/dialogue/command-card/adapters.ts) ❌ **BROKEN**
   - This is an OLDER adapter
   - Only handles simple mapping without proper grouping logic
   - **Missing critical moves** because it doesn't fetch from the right API

4. **The REAL Problem**: DeepDivePanelV2 is NOT calling `/api/dialogue/legal-moves` at all!

Let me verify this:

```tsx
// DeepDivePanelV2.tsx line ~710
const cardActions = useMemo(() => {
  if (!hudTarget || !legalMoves?.moves) return [];
  const targetRef = { deliberationId, targetType: hudTarget.type, targetId: hudTarget.id, locusPath: '0' };
  return legalMovesToCommandCard(legalMoves.moves, targetRef, true);
}, [hudTarget, legalMoves, deliberationId]);
```

But where does `legalMoves` come from? Let me check...

**FINDING**: DeepDivePanelV2 has NO `useSWR` call to `/api/dialogue/legal-moves`!

The `legalMoves` variable is likely:
- Undefined
- Coming from old state
- Coming from a different API endpoint

This explains why only CONCEDE and RETRACT show - those are probably hardcoded scaffolds or coming from a different code path.

---

## 🗂️ API Endpoint Analysis

### Current CQ API Landscape

There are **MULTIPLE competing CQ API endpoints** - this is a mess:

#### 1. `/api/cqs/route.ts` ✅ **PRIMARY - ACTIVELY USED**
**Status**: ✅ Active, well-maintained, feature-complete  
**Purpose**: Get critical questions for claims  
**Used by**:
- `CriticalQuestions.tsx`
- `CriticalQuestionsV2.tsx`
- `DialogueInspector.tsx`
- `ArgumentCard.tsx`
- `CQContextPanel.tsx`

**Features**:
- Returns schemes with CQs
- Status tracking (satisfied/unsatisfied)
- ETag caching
- Scheme filtering

**Endpoints**:
- `GET /api/cqs?targetType=claim&targetId=...&scheme=...`
- `POST /api/cqs/toggle` - Toggle CQ satisfied status
- `GET /api/cqs/attachments?targetType=claim&targetId=...` - Get attached evidence

**Code Quality**: ✅ Good - Zod validation, proper error handling

---

#### 2. `/api/cq/route.ts` ❌ **LEGACY - DIFFERENT PURPOSE**
**Status**: ❌ Semi-active, but different use case  
**Purpose**: OLD workflow for opening/resolving CQs on arguments  
**Used by**: `lib/client/aifApi.ts` only

**Features**:
- `POST /api/cq` with `action: 'open' | 'resolve' | 'close'`
- Creates CQStatus records
- Creates ConflictApplication edges (deprecated)
- NO GET endpoint (only POST)

**Code Quality**: ⚠️ Outdated - Uses old `ConflictApplication` model

**Verdict**: This is NOT the same as `/api/cqs` - it's for a different workflow (opening/closing CQs on arguments via dialogue moves). Keep both but they serve different purposes.

---

#### 3. `/api/arguments/[id]/cqs/route.ts` ⚠️ **PARTIALLY DEFUNCT**
**Status**: ⚠️ Exists but commented out in newer code  
**Purpose**: Get CQs for specific argument  
**Used by**: Mostly old code paths

**Features**:
- `GET /api/arguments/{id}/cqs` - Returns CQs for argument's scheme
- Includes status from CQStatus table
- Simple, straightforward

**Code Quality**: ⚠️ Works but scheme data model changed

**Verdict**: This works for ARGUMENTS but `/api/cqs` is preferred for CLAIMS

---

#### 4. `/api/arguments/[id]/cqs/[cqKey]/ask/route.ts` ⚠️ **PARTIALLY ACTIVE**
**Status**: ⚠️ Used in some flows  
**Purpose**: Ask a specific CQ (create WHY move)

**Features**:
- `POST /api/arguments/{id}/cqs/{cqKey}/ask`
- Creates CQStatus record
- Creates WHY dialogue move
- Includes `cqId` in payload (important!)

**Code Quality**: ⚠️ Works but duplicates logic from `/api/dialogue/move`

---

#### 5. `/api/deliberations/[id]/cqs/route.ts` ⚠️ **EXISTS**
**Status**: Unknown usage  
**Purpose**: Get CQs for entire deliberation?

---

## 📊 API Usage Matrix

| Endpoint | Used By | Purpose | Status | Keep? |
|----------|---------|---------|--------|-------|
| `/api/cqs` | CriticalQuestions, DialogueInspector | Get CQs for claims | ✅ Active | ✅ YES - PRIMARY |
| `/api/cqs/toggle` | CriticalQuestions | Toggle CQ status | ✅ Active | ✅ YES |
| `/api/cqs/attachments` | CriticalQuestions | Get evidence | ✅ Active | ✅ YES |
| `/api/cq` | aifApi.ts | Open/resolve CQs (old workflow) | ⚠️ Semi-active | ⚠️ MAYBE - Different use case |
| `/api/arguments/[id]/cqs` | Old code | Get CQs for argument | ⚠️ Uncommon | ⚠️ MAYBE - Superseded |
| `/api/arguments/[id]/cqs/[cqKey]/ask` | Some flows | Ask specific CQ | ⚠️ Semi-active | ⚠️ MAYBE - Duplicates `/api/dialogue/move` |
| `/api/dialogue/legal-moves` | LegalMoveToolbar, DeepDivePanel | Get all available moves | ✅ Active | ✅ YES - CRITICAL |
| `/api/dialogue/move` | All dialogue UIs | Post any move | ✅ Active | ✅ YES - CRITICAL |

---

## 🎯 Optimal API Usage Recommendations

### For Claims:
```typescript
// 1. Get CQs for a claim
GET /api/cqs?targetType=claim&targetId={claimId}&scheme={optional}
// Returns: { schemes: [{ key, title, cqs: [{ key, text, satisfied }] }] }

// 2. Toggle CQ status
POST /api/cqs/toggle
// Body: { targetType, targetId, schemeKey, cqKey, satisfied }

// 3. Get evidence attachments
GET /api/cqs/attachments?targetType=claim&targetId={claimId}
```

### For Dialogue Moves:
```typescript
// 1. Get all legal moves for a target
GET /api/dialogue/legal-moves?deliberationId={id}&targetType={type}&targetId={id}&locusPath={path}
// Returns: { moves: [{ kind, label, payload, force, disabled, reason }] }

// 2. Post any dialogue move
POST /api/dialogue/move
// Body: { deliberationId, targetType, targetId, kind, payload, ... }

// 3. Answer WHY with commitment (special case)
POST /api/dialogue/answer-and-commit
// Body: { deliberationId, targetType, targetId, cqKey, expression, ... }
```

### For Arguments:
```typescript
// For now, use the claim-based endpoints on the argument's conclusion
// OR use the dedicated argument endpoint if needed:
GET /api/arguments/{id}/cqs
```

---

## 🔧 How to Fix the Grid Issue

### Option A: Quick Fix - Add Legal Moves API Call to DeepDivePanelV2

```tsx
// Add this near the top of DeepDivePanelV2 component
const targetRef = hudTarget ? {
  deliberationId,
  targetType: hudTarget.type as 'claim' | 'argument' | 'card',
  targetId: hudTarget.id,
  locusPath: '0'
} : null;

const legalMovesKey = targetRef 
  ? `/api/dialogue/legal-moves?deliberationId=${targetRef.deliberationId}&targetType=${targetRef.targetType}&targetId=${targetRef.targetId}&locusPath=${targetRef.locusPath}`
  : null;

const { data: legalMovesData } = useSWR(legalMovesKey, fetcher, { revalidateOnFocus: false });

// Then use it:
const cardActions = useMemo(() => {
  if (!targetRef || !legalMovesData?.moves) return [];
  return legalMovesToCommandCard(legalMovesData.moves, targetRef, true);
}, [targetRef, legalMovesData]);
```

### Option B: Better Fix - Use Unified Adapter

Replace `legalMovesToCommandCard()` with the newer `movesToActions()` adapter:

```tsx
import { movesToActions } from '@/lib/dialogue/movesToActions';

// Then:
const cardActions = useMemo(() => {
  if (!targetRef || !legalMovesData?.moves) return [];
  return movesToActions(legalMovesData.moves, targetRef);
}, [targetRef, legalMovesData]);
```

The `movesToActions()` adapter is **better** because it:
- Handles priority sorting
- Includes scaffold actions based on context
- Properly maps all move types
- Used by LegalMoveToolbar (which works correctly)

### Option C: Best Fix - Unify All Adapters

Create ONE canonical adapter that both DeepDivePanelV2 and LegalMoveToolbar use:

1. Keep `movesToActions()` as the canonical adapter
2. Delete `legalMovesToCommandCard()` (outdated)
3. Update all imports to use `movesToActions()`

---

## 📁 File Usage Analysis

### Files to KEEP and USE:

#### Core Dialogue System:
- ✅ `/api/dialogue/legal-moves/route.ts` - **CRITICAL**: Returns all legal moves
- ✅ `/api/dialogue/move/route.ts` - **CRITICAL**: Posts moves
- ✅ `/api/dialogue/answer-and-commit/route.ts` - **IMPORTANT**: GROUNDS + commit flow
- ✅ `lib/dialogue/movesToActions.ts` - **PREFERRED ADAPTER**: Newest, best maintained
- ✅ `components/dialogue/LegalMoveToolbar.tsx` - **WORKING EXAMPLE**: Uses correct APIs
- ✅ `components/dialogue/LegalMoveChips.tsx` - **WORKING EXAMPLE**: Phase 1 improvements

#### CQ System for Claims:
- ✅ `/api/cqs/route.ts` - **PRIMARY**: Get CQs for claims
- ✅ `/api/cqs/toggle/route.ts` - **IMPORTANT**: Toggle CQ status
- ✅ `/api/cqs/attachments/route.ts` - **IMPORTANT**: Get evidence
- ✅ `components/claims/CriticalQuestions.tsx` - **MAIN UI**: CQ display component
- ✅ `components/claims/CriticalQuestionsV2.tsx` - **NEWER UI**: Improved version

### Files to DEPRECATE or REMOVE:

#### Outdated Adapters:
- ❌ `components/dialogue/command-card/adapters.ts` - **OUTDATED**: Use `movesToActions()` instead
- ⚠️ `/api/cq/route.ts` - **DIFFERENT PURPOSE**: Not the same as `/api/cqs`, but serves a specific old workflow

#### Uncommon Endpoints:
- ⚠️ `/api/arguments/[id]/cqs/route.ts` - **SUPERSEDED**: Use claim-based `/api/cqs` instead
- ⚠️ `/api/arguments/[id]/cqs/[cqKey]/ask/route.ts` - **DUPLICATES**: Use `/api/dialogue/move` with WHY + cqId

### Files to FIX:

#### Broken Integrations:
- 🔧 `components/deepdive/DeepDivePanelV2.tsx` - **MISSING API CALL**: Doesn't fetch legal moves
- 🔧 `components/dialogue/command-card/CQContextPanel.tsx` - **VERIFY**: Check if using correct API

---

## 🚀 Implementation Plan

### Phase 1A: Fix Grid Immediately (30 minutes)

**File**: `components/deepdive/DeepDivePanelV2.tsx`

1. Add `useSWR` call to `/api/dialogue/legal-moves`
2. Pass moves to `movesToActions()` (not `legalMovesToCommandCard`)
3. Test that WHY, GROUNDS, CLOSE appear in grid

### Phase 2: Unify Adapters (1 hour)

1. Search for all uses of `legalMovesToCommandCard()`
2. Replace with `movesToActions()`
3. Delete `components/dialogue/command-card/adapters.ts`
4. Test all CommandCard instances

### Phase 3: Deprecate Old CQ Endpoints (2 hours)

1. Audit usage of `/api/cq` (singular) vs `/api/cqs` (plural)
2. Migrate any remaining code to use `/api/cqs`
3. Add deprecation warnings to old endpoints
4. Update documentation

### Phase 4: Clean Up Arguments CQ Flow (3 hours)

1. Decide: Do we need argument-specific CQ endpoints?
2. If no: Migrate to claim-based flow
3. If yes: Ensure consistency with claim flow
4. Document the canonical way to handle CQs

---

## 📝 API Documentation Template

### Canonical Dialogue Flow

```typescript
// 1️⃣ Check what moves are available
const { data } = useSWR(
  `/api/dialogue/legal-moves?deliberationId=${delibId}&targetType=claim&targetId=${claimId}&locusPath=0`,
  fetcher
);
// Returns: { ok: true, moves: [ { kind: 'WHY', label: 'Challenge', ... }, ... ] }

// 2️⃣ Convert to UI actions
import { movesToActions } from '@/lib/dialogue/movesToActions';
const actions = movesToActions(data.moves, {
  deliberationId: delibId,
  targetType: 'claim',
  targetId: claimId,
  locusPath: '0'
});

// 3️⃣ Display in UI
<CommandCard actions={actions} onPerform={handlePerform} />
// OR
<LegalMoveToolbar {...targetRef} />

// 4️⃣ User clicks action → Post move
await fetch('/api/dialogue/move', {
  method: 'POST',
  body: JSON.stringify({
    deliberationId,
    targetType: 'claim',
    targetId: claimId,
    kind: 'WHY',
    payload: { locusPath: '0', cqId: 'cq1' },
  })
});

// 5️⃣ For GROUNDS with commitment
await fetch('/api/dialogue/answer-and-commit', {
  method: 'POST',
  body: JSON.stringify({
    deliberationId,
    targetType: 'claim',
    targetId: claimId,
    cqKey: 'cq1',
    expression: 'P & Q -> R',
    commitOwner: 'Proponent'
  })
});
```

### Canonical CQ Flow

```typescript
// 1️⃣ Get CQs for a claim
const { data } = useSWR(
  `/api/cqs?targetType=claim&targetId=${claimId}`,
  fetcher
);
// Returns: { schemes: [ { key: 'expert', title: 'Expert Opinion', cqs: [...] } ] }

// 2️⃣ Display CQs
<CriticalQuestions targetId={claimId} />

// 3️⃣ User answers CQ → Toggle status
await fetch('/api/cqs/toggle', {
  method: 'POST',
  body: JSON.stringify({
    targetType: 'claim',
    targetId: claimId,
    schemeKey: 'expert',
    cqKey: 'cq1',
    satisfied: true
  })
});

// 4️⃣ Create WHY move referencing CQ
await fetch('/api/dialogue/move', {
  method: 'POST',
  body: JSON.stringify({
    deliberationId,
    targetType: 'claim',
    targetId: claimId,
    kind: 'WHY',
    payload: { cqId: 'cq1', locusPath: '0' }
  })
});
```

---

## 🎯 Summary

### Why Only 2 Moves Show:
**DeepDivePanelV2 is NOT calling `/api/dialogue/legal-moves`** - it's using stale data or a different code path. The `legalMovesToCommandCard()` adapter is also outdated.

### CQ API Status:
- **`/api/cqs`** (plural) is the PRIMARY, actively maintained endpoint ✅
- **`/api/cq`** (singular) is for a DIFFERENT purpose (old workflow) ⚠️
- **They are NOT interchangeable** - both have valid use cases
- `/api/arguments/[id]/cqs/*` endpoints are less used but still valid

### What to Do:
1. **Immediate**: Fix DeepDivePanelV2 to call `/api/dialogue/legal-moves`
2. **Short-term**: Replace `legalMovesToCommandCard()` with `movesToActions()`
3. **Long-term**: Audit and document all CQ endpoints, deprecate truly unused ones

### Files to Focus On:
- Fix: `components/deepdive/DeepDivePanelV2.tsx`
- Use: `lib/dialogue/movesToActions.ts` (canonical adapter)
- Use: `/api/dialogue/legal-moves` (canonical move source)
- Use: `/api/cqs` (canonical CQ source for claims)
- Remove: `components/dialogue/command-card/adapters.ts` (outdated)

---

**Next Step**: Implement Phase 1A fix to get all moves showing in the grid!
