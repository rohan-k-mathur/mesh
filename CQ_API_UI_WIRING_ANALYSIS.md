# CQ API-UI Wiring Analysis: Division of Responsibilities

**Date**: November 7, 2025  
**Status**: ⚠️ **MISMATCH FOUND** - UI components calling correct API but with wrong payload format

---

## Executive Summary

### The Problem
Both `CriticalQuestionsV3.tsx` and `SchemeSpecificCQsModal.tsx` are already calling `/api/cqs/dialogue-move`, but they're sending **incompatible payload formats**:

- **UI sends**: Generic dialogue move format `{ deliberationId, targetType, targetId, kind, payload }`
- **API expects**: CQ-specific format `{ action, cqId, deliberationId, authorId, targetArgumentId }`

This explains why the recent fix to SchemeSpecificCQsModal (changing to `/api/dialogue/move`) worked - because that endpoint expects the payload format the UI was already sending!

### The Solution
We have **two valid architectural paths**:

**Option A**: Keep UI as-is, use `/api/dialogue/move` (CURRENT FIX ✅)
- UI sends generic dialogue move payloads
- Dialogue moves created without ASPIC+ metadata
- Simpler, works now

**Option B**: Update UI to use `/api/cqs/dialogue-move` properly (ROADMAP INTENT)
- UI sends CQ-specific payloads with action/cqId
- Full ASPIC+ integration with attack computation
- More complex, follows original roadmap design

---

## Current State: End-to-End Wiring

### CriticalQuestionsV3.tsx

**Location**: `components/claims/CriticalQuestionsV3.tsx`

**Purpose**: Display and interact with CQs for claims and arguments

**Current Implementation** (Lines 255-280):

```typescript
// When user clicks "Mark as Open Question" (unsatisfied)
const toggleCQ = async (schemeKey, cqKey, satisfied) => {
  if (!satisfied && deliberationId) {
    // ❌ WRONG PAYLOAD FORMAT
    const moveRes = await fetch("/api/cqs/dialogue-move", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        deliberationId,        // ✅ Correct field
        targetType,            // ❌ API doesn't expect this
        targetId,              // ❌ API doesn't expect this
        kind: "WHY",           // ❌ API doesn't expect this
        payload: {             // ❌ API doesn't expect this
          cqId: cqKey,         // ❌ Wrong - this is cqKey, not cqId
          locusPath: "0",
        },
      }),
    });
  }
  
  // Then update CQStatus via /api/cqs
  await fetch("/api/cqs", { ... });
};
```

**What API Actually Expects**:

```typescript
{
  action: "ask",              // ✅ Required
  cqId: "ck_abc123",          // ✅ Required - CQStatus.id (not cqKey!)
  deliberationId: string,     // ✅ Required
  authorId: string,           // ✅ Required
  targetArgumentId?: string   // Optional
}
```

**Current Flow**:
1. User clicks "Mark as Open Question"
2. UI calls `/api/cqs/dialogue-move` with wrong payload → **400 Error**
3. UI continues to `/api/cqs` POST (old endpoint) → Updates CQStatus
4. CQ marked as open but NO DialogueMove created ❌

**What Should Happen** (Option B - Roadmap Intent):
1. User clicks "Mark as Open Question"
2. UI calls `/api/cqs/dialogue-move` with `action: "ask"`, `cqId`, etc.
3. API creates WHY DialogueMove with ASPIC+ metadata
4. API updates CQStatus to "open"
5. API returns moveId
6. UI refreshes

---

### SchemeSpecificCQsModal.tsx

**Location**: `components/arguments/SchemeSpecificCQsModal.tsx`

**Purpose**: Respond to CQs by creating attacks (REBUTS, UNDERCUTS, UNDERMINES)

**Previous Implementation** (Lines 144-160 - NOW FIXED):

```typescript
const handleAskCQ = async (cqKey: string) => {
  // ❌ WAS BROKEN - Same wrong payload format
  const moveRes = await fetch("/api/cqs/dialogue-move", {
    method: "POST",
    body: JSON.stringify({
      deliberationId,
      targetType: "argument",
      targetId: argumentId,
      kind: "WHY",
      payload: { cqKey, locusPath: "0" },
    }),
  });
  
  await askCQ(argumentId, cqKey, { authorId, deliberationId });
};
```

**Current Implementation** (After Our Fix):

```typescript
const handleAskCQ = async (cqKey: string) => {
  // ✅ FIXED - Now uses /api/dialogue/move
  const moveRes = await fetch("/api/dialogue/move", {
    method: "POST",
    body: JSON.stringify({
      deliberationId,
      targetType: "argument",
      targetId: argumentId,
      kind: "WHY",
      payload: { cqKey, locusPath: "0" },
    }),
  });
  
  await askCQ(argumentId, cqKey, { authorId, deliberationId });
};
```

**Attack Objections** (Lines 185-350 - FIXED in previous commit):

For REBUTS, UNDERCUTS, UNDERMINES attacks:

```typescript
// ✅ FIXED - Now uses /api/dialogue/move for GROUNDS
const moveRes = await fetch("/api/dialogue/move", {
  method: "POST",
  body: JSON.stringify({
    deliberationId,
    targetType: "argument",
    targetId: argumentId,
    kind: "GROUNDS",
    payload: { cqKey, brief: text, locusPath: "0" },
  }),
});

// Then create claim
const claim = await fetch("/api/claims", { ... });

// Then create ConflictApplication
await fetch("/api/ca", { ... });
```

**Current Flow** (WORKING ✅):
1. User selects attack type and enters objection
2. Modal creates GROUNDS DialogueMove via `/api/dialogue/move` ✅
3. Modal creates claim via `/api/claims` ✅
4. Modal creates ConflictApplication via `/api/ca` ✅
5. CA creation triggers ASPIC+ metadata computation ✅
6. Argument refreshes with new attack ✅

---

## Division of Responsibilities

### Option A: Current Working Architecture (As Fixed)

#### `/api/dialogue/move` (General Purpose)
**Responsibilities**:
- Create ANY dialogue move (WHY, GROUNDS, ASSERT, etc.)
- Generic payload format
- No ASPIC+ attack computation
- Simple DialogueMove record creation

**Used By**:
- ✅ SchemeSpecificCQsModal (handleAskCQ, GROUNDS responses)
- ⏳ CriticalQuestionsV3 (should be updated to use this)

**Payload**:
```typescript
{
  deliberationId: string;
  targetType: "argument" | "claim" | "card";
  targetId: string;
  kind: "WHY" | "GROUNDS" | "ASSERT" | "RETRACT" | "CONCEDE" | "CLOSE";
  payload?: any;
}
```

**Response**:
```typescript
{
  ok: true;
  moveId: string;
  // No ASPIC+ metadata
}
```

#### `/api/ca` (ConflictApplication)
**Responsibilities**:
- Create ConflictApplication records
- **Compute ASPIC+ attack metadata** via `computeAspicConflictMetadata()`
- Determine attack type (rebuts, undercuts, undermines)
- Link to DialogueMove if `createdByMoveId` provided

**Used By**:
- ✅ SchemeSpecificCQsModal (after creating claim + GROUNDS move)
- ✅ Other attack creation flows

**Payload**:
```typescript
{
  deliberationId: string;
  conflictingClaimId: string;
  conflictedArgumentId?: string;  // For UNDERCUTS
  conflictedClaimId?: string;     // For REBUTS
  legacyAttackType: "REBUTS" | "UNDERCUTS" | "UNDERMINES";
  legacyTargetScope: "conclusion" | "inference" | "premise";
  metaJson?: {
    schemeKey?: string;
    cqKey?: string;
    cqText?: string;
    source?: string;
  };
}
```

**Response**:
```typescript
{
  ok: true;
  id: string;  // ConflictApplication ID
  // ASPIC+ metadata computed and stored
}
```

#### Flow Chart (Option A - Current):
```
User Action
    ↓
CriticalQuestionsV3 or SchemeSpecificCQsModal
    ↓
POST /api/dialogue/move
    → Creates DialogueMove (generic, no ASPIC+)
    ↓
POST /api/claims (if creating objection)
    → Creates Claim
    ↓
POST /api/ca
    → Creates ConflictApplication
    → Computes ASPIC+ metadata via computeAspicConflictMetadata()
    → Stores aspicAttackType, aspicDefeatStatus, aspicMetadata
    ↓
Ludics Recompilation Triggered
    → compileFromMoves() runs
    → expandActsFromMove() processes ConflictApplication
    → Creates CA-node with ASPIC+ metadata preserved
    ↓
AIF Sync
    → syncLudicsToAif() runs
    → CA-nodes synced to AIF graph
    ↓
UI Refresh
```

**Pros**:
- ✅ Currently working
- ✅ Simpler payload format
- ✅ ASPIC+ metadata computed at ConflictApplication layer
- ✅ No UI changes needed (already fixed)

**Cons**:
- ❌ DialogueMove doesn't have ASPIC+ metadata in payload
- ❌ WHY moves are generic (no attack computation at ask time)
- ❌ Two-step process (move + CA)

---

### Option B: Roadmap Intent Architecture (Needs UI Updates)

#### `/api/cqs/dialogue-move` (CQ-Specific)
**Responsibilities**:
- Create DialogueMoves **specifically from CQ actions**
- Compute ASPIC+ attack metadata via `cqToAspicAttack()`
- Store attack metadata in DialogueMove.payload
- Create ConflictApplication with full provenance
- Update CQStatus

**Should Be Used By**:
- ⏳ CriticalQuestionsV3 (needs UI update)
- ⏳ SchemeSpecificCQsModal (needs UI update)

**Payload**:
```typescript
{
  action: "ask" | "answer";
  cqId: string;              // CQStatus.id (not cqKey!)
  deliberationId: string;
  authorId: string;
  targetArgumentId?: string; // For "ask"
  answerText?: string;       // For "answer"
  answerClaimId?: string;    // For "answer"
}
```

**Response**:
```typescript
{
  success: true;
  moveId: string;
  conflictId?: string;       // If action === "answer"
  aspicAttack?: {
    type: string;
    targetScope: string;
    succeeded: boolean;
  };
}
```

#### Flow Chart (Option B - Roadmap):
```
User Action
    ↓
CriticalQuestionsV3 or SchemeSpecificCQsModal
    ↓
POST /api/cqs/dialogue-move
    → Fetches CQ metadata (cqKey, attackType, targetScope)
    → Fetches ArgumentScheme (aspicMapping)
    → Constructs ASPIC+ Argument representation
    → Calls cqToAspicAttack() → Computes attack
    → Creates DialogueMove with ASPIC+ metadata in payload
    → If action === "answer":
        → Creates Claim (if needed)
        → Creates ConflictApplication with ASPIC+ metadata
        → Links CA to DialogueMove via createdByMoveId
    → Updates CQStatus
    ↓
Ludics Recompilation Triggered
    → compileFromMoves() processes DialogueMove
    → Reads ASPIC+ metadata from move.payload
    → Creates CA-node (if CA exists)
    ↓
AIF Sync
    ↓
UI Refresh
```

**Pros**:
- ✅ Single endpoint for CQ actions
- ✅ ASPIC+ metadata computed early (at DialogueMove creation)
- ✅ Full provenance chain: CQ → Move → ASPIC+ → CA
- ✅ Follows original roadmap design
- ✅ DialogueMove.payload contains rich ASPIC+ metadata

**Cons**:
- ❌ Requires UI changes in both components
- ❌ More complex payload format
- ❌ Need to fetch CQStatus.id (not just cqKey)

---

## Detailed Fixes Required for Option B

### Fix 1: CriticalQuestionsV3.tsx

**Current Issue**: Calling `/api/cqs/dialogue-move` with wrong payload

**Required Changes**:

```typescript
// BEFORE (Lines 255-280):
const toggleCQ = async (schemeKey, cqKey, satisfied) => {
  if (!satisfied && deliberationId) {
    const moveRes = await fetch("/api/cqs/dialogue-move", {
      method: "POST",
      body: JSON.stringify({
        deliberationId,
        targetType,
        targetId,
        kind: "WHY",
        payload: { cqId: cqKey, locusPath: "0" },
      }),
    });
  }
  
  await fetch("/api/cqs", { ... }); // Old endpoint
};

// AFTER (Proposed):
const toggleCQ = async (schemeKey, cqKey, satisfied) => {
  if (!satisfied && deliberationId && authorId) {
    // Step 1: Fetch CQStatus to get ID
    const cqsRes = await fetch(
      `/api/cqs?targetType=${targetType}&targetId=${targetId}`
    );
    const cqsData = await cqsRes.json();
    const cqStatus = cqsData.schemes
      ?.find(s => s.key === schemeKey)
      ?.cqs?.find(c => c.cqKey === cqKey);
    
    if (!cqStatus?.id) {
      console.error("[CriticalQuestionsV3] CQStatus not found");
      return;
    }
    
    // Step 2: Call /api/cqs/dialogue-move with correct payload
    const moveRes = await fetch("/api/cqs/dialogue-move", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "ask",                    // ✅ Required
        cqId: cqStatus.id,                // ✅ CQStatus ID
        deliberationId,                   // ✅ Required
        authorId,                         // ✅ Required
        targetArgumentId: targetType === "argument" ? targetId : undefined,
      }),
    });
    
    if (!moveRes.ok) {
      const errorData = await moveRes.json();
      console.error("[CriticalQuestionsV3] Failed to create WHY move:", errorData);
      return;
    }
    
    const moveData = await moveRes.json();
    console.log("[CriticalQuestionsV3] Created WHY move:", moveData.moveId);
  }
  
  // Refresh CQ data
  await globalMutate(cqsKey);
  window.dispatchEvent(new CustomEvent("dialogue:moves:refresh"));
};
```

**Lines to modify**: 255-295

**Estimated time**: 1-2 hours

---

### Fix 2: CriticalQuestionsV3.tsx - resolveViaGrounds

**Current Issue**: Same wrong payload format for GROUNDS responses

**Required Changes**:

```typescript
// BEFORE (Lines 307-375):
const resolveViaGrounds = async (schemeKey, cqKey, brief) => {
  const moveRes = await fetch("/api/cqs/dialogue-move", {
    method: "POST",
    body: JSON.stringify({
      deliberationId,
      targetType,
      targetId,
      kind: "GROUNDS",
      payload: { cqKey, brief, locusPath: "0" },
    }),
  });
  
  await fetch("/api/cqs", { ... }); // Mark satisfied
};

// AFTER (Proposed):
const resolveViaGrounds = async (schemeKey, cqKey, brief) => {
  if (!deliberationId || !authorId) return;
  
  // Step 1: Fetch CQStatus ID
  const cqsRes = await fetch(
    `/api/cqs?targetType=${targetType}&targetId=${targetId}`
  );
  const cqsData = await cqsRes.json();
  const cqStatus = cqsData.schemes
    ?.find(s => s.key === schemeKey)
    ?.cqs?.find(c => c.cqKey === cqKey);
  
  if (!cqStatus?.id) {
    console.error("[CriticalQuestionsV3] CQStatus not found");
    return;
  }
  
  // Step 2: Call /api/cqs/dialogue-move with action: "answer"
  const moveRes = await fetch("/api/cqs/dialogue-move", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "answer",              // ✅ Answer action
      cqId: cqStatus.id,             // ✅ CQStatus ID
      deliberationId,                // ✅ Required
      authorId,                      // ✅ Required
      answerText: brief,             // ✅ GROUNDS text
      createCounterClaim: false,     // No counter-claim needed
    }),
  });
  
  if (!moveRes.ok) {
    const errorData = await moveRes.json();
    console.error("[CriticalQuestionsV3] Failed to answer CQ:", errorData);
    return;
  }
  
  const moveData = await moveRes.json();
  console.log("[CriticalQuestionsV3] Created GROUNDS move:", moveData.moveId);
  
  // Refresh
  await globalMutate(cqsKey);
  window.dispatchEvent(new CustomEvent("dialogue:moves:refresh"));
};
```

**Lines to modify**: 307-380

**Estimated time**: 1-2 hours

---

### Fix 3: SchemeSpecificCQsModal.tsx - handleAskCQ

**Current Status**: ✅ Already fixed to use `/api/dialogue/move` (Option A)

**Option B Changes** (If switching to roadmap intent):

```typescript
// CURRENT (Lines 144-172 - WORKING with /api/dialogue/move):
const handleAskCQ = async (cqKey: string) => {
  const moveRes = await fetch("/api/dialogue/move", {
    method: "POST",
    body: JSON.stringify({
      deliberationId,
      targetType: "argument",
      targetId: argumentId,
      kind: "WHY",
      payload: { cqKey, locusPath: "0" },
    }),
  });
  
  await askCQ(argumentId, cqKey, { authorId, deliberationId });
};

// OPTION B (Roadmap Intent):
const handleAskCQ = async (cqKey: string) => {
  // Find CQStatus ID from local state
  const cqStatus = localCqs.find(c => c.cqKey === cqKey);
  if (!cqStatus?.id) {
    console.error("[SchemeSpecificCQsModal] CQStatus not found");
    return;
  }
  
  const moveRes = await fetch("/api/cqs/dialogue-move", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "ask",
      cqId: cqStatus.id,
      deliberationId,
      authorId,
      targetArgumentId: argumentId,
    }),
  });
  
  if (!moveRes.ok) {
    const errorData = await moveRes.json();
    console.error("[SchemeSpecificCQsModal] Failed to ask CQ:", errorData);
    return;
  }
  
  const moveData = await moveRes.json();
  console.log("[SchemeSpecificCQsModal] Created WHY move:", moveData.moveId);
  
  // Refresh local state
  setLocalCqs((prev) =>
    prev.map((c) => (c.cqKey === cqKey ? { ...c, status: "open" } : c))
  );
  
  window.dispatchEvent(new CustomEvent("dialogue:moves:refresh"));
};
```

**Lines to modify**: 144-175

**Estimated time**: 30 minutes

---

### Fix 4: SchemeSpecificCQsModal.tsx - Attack Objections

**Current Status**: ✅ Already working via `/api/dialogue/move` + `/api/ca`

**Option B Changes** (If switching to roadmap intent):

For REBUTS, UNDERCUTS, UNDERMINES - use `action: "answer"` to create both DialogueMove AND ConflictApplication in one call:

```typescript
// CURRENT (WORKING - Multi-step):
// 1. POST /api/dialogue/move (GROUNDS)
// 2. POST /api/claims (create objection claim)
// 3. POST /api/ca (create ConflictApplication)

// OPTION B (Single call):
const postObjection = async (cq, cqKey) => {
  if (cq.attackType === "UNDERCUTS") {
    const text = undercutText[cqKey]?.trim();
    if (!text) return;
    
    // Find CQStatus ID
    const cqStatus = localCqs.find(c => c.cqKey === cqKey);
    if (!cqStatus?.id) return;
    
    // Single call to create move + claim + CA
    const res = await fetch("/api/cqs/dialogue-move", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "answer",
        cqId: cqStatus.id,
        deliberationId,
        authorId,
        answerText: text,        // Creates claim automatically
        createCounterClaim: true,
      }),
    });
    
    const data = await res.json();
    console.log("[SchemeSpecificCQsModal] Created CA:", data.conflictId);
  }
  // Similar for REBUTS, UNDERMINES
};
```

**Pros**: Single API call, full ASPIC+ integration  
**Cons**: More complex API logic, less control over intermediate steps

**Estimated time**: 2-3 hours (needs testing)

---

## Recommendation

### ✅ **Stick with Option A** (Current Fix)

**Reasons**:
1. **Already Working**: SchemeSpecificCQsModal is fixed and functional
2. **Simpler**: Generic dialogue move format is easier to work with
3. **Flexible**: Separates DialogueMove creation from ConflictApplication creation
4. **ASPIC+ Coverage**: ConflictApplication layer handles ASPIC+ computation robustly
5. **Less Risk**: No need to refactor working code

**Action Items**:
1. ✅ Keep SchemeSpecificCQsModal using `/api/dialogue/move` (already done)
2. ⏳ Update CriticalQuestionsV3 to use `/api/dialogue/move` instead of `/api/cqs/dialogue-move`
3. ⏳ Document the architecture choice
4. ⏳ Update roadmap to reflect Option A as the standard pattern

**Estimated Time**: 2-3 hours to fix CriticalQuestionsV3

---

### Alternative: **Pursue Option B** (Roadmap Intent)

**Only if**:
- You want DialogueMove.payload to contain full ASPIC+ attack metadata
- You prefer single-endpoint simplicity for CQ actions
- You have 1-2 days for UI refactoring and testing

**Action Items**:
1. ⏳ Update CriticalQuestionsV3.tsx (toggleCQ, resolveViaGrounds)
2. ⏳ Update SchemeSpecificCQsModal.tsx (revert to `/api/cqs/dialogue-move`)
3. ⏳ Add CQStatus.id fetching logic to both components
4. ⏳ Test all CQ flows end-to-end
5. ⏳ Update documentation

**Estimated Time**: 1.5-2 days

---

## Summary: Current vs Roadmap

| Aspect | Option A (Current) | Option B (Roadmap) |
|--------|-------------------|-------------------|
| **DialogueMove Creation** | `/api/dialogue/move` | `/api/cqs/dialogue-move` |
| **Payload Format** | Generic (targetType, kind) | CQ-specific (action, cqId) |
| **ASPIC+ Computation** | At ConflictApplication layer | At DialogueMove creation |
| **ConflictApplication** | Separate API call (`/api/ca`) | Bundled in `action: "answer"` |
| **UI Complexity** | Simple | Complex (need CQStatus.id) |
| **Status** | ✅ Working (SchemeSpec fixed) | ⏳ Needs UI updates |
| **Effort** | 2-3 hours (fix CriticalQuestionsV3) | 1.5-2 days (both components) |

---

## Next Steps

### If Choosing Option A (Recommended):

1. **Fix CriticalQuestionsV3.tsx** (2-3 hours)
   - Replace `/api/cqs/dialogue-move` calls with `/api/dialogue/move`
   - Update toggleCQ function (lines 255-295)
   - Update resolveViaGrounds function (lines 307-380)
   - Test marking CQs as open/satisfied

2. **Documentation** (30 minutes)
   - Update AGENTS.md with Option A architecture
   - Mark roadmap Option B tasks as "deferred"
   - Document division of responsibilities

3. **Testing** (1 hour)
   - Test CQ marking flow in CriticalQuestionsV3
   - Test CQ objections in SchemeSpecificCQsModal
   - Verify DialogueMoves created correctly
   - Verify ConflictApplications have ASPIC+ metadata

### If Choosing Option B (Roadmap Intent):

1. **Update CriticalQuestionsV3.tsx** (4-6 hours)
   - Add CQStatus.id fetching logic
   - Update toggleCQ to use `action: "ask"`
   - Update resolveViaGrounds to use `action: "answer"`
   - Test extensively

2. **Revert SchemeSpecificCQsModal.tsx** (2-3 hours)
   - Change back to `/api/cqs/dialogue-move`
   - Add CQStatus.id fetching
   - Update handleAskCQ
   - Update attack objections to use `action: "answer"`
   - Test all attack types

3. **Documentation & Testing** (2-3 hours)

---

**Conclusion**: Both options are architecturally sound. Option A is pragmatic and working; Option B is more aligned with original roadmap but requires more work. **Recommend Option A** given current working state.

**Last Updated**: November 7, 2025  
**Status**: Analysis Complete, Awaiting Decision
