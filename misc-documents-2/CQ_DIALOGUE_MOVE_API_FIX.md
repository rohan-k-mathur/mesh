# CQ Dialogue Move API Endpoint Fix

## Issue
When responding to argument Critical Questions via SchemeSpecificCQsModal, the GROUNDS dialogue move creation was failing with a 400 Bad Request error.

**Error Message:**
```json
{
  "success": false,
  "reason": "Missing required fields: action, cqId, deliberationId, authorId"
}
```

**Failed Request:**
```
POST http://localhost:3000/api/cqs/dialogue-move
Body: {
  "deliberationId": "ludics-forest-demo",
  "targetType": "argument",
  "targetId": "cmhmtv5r8008tg12ukzfchihb",
  "kind": "GROUNDS",
  "payload": { "cqKey": "critical_diffs", "brief": "...", "locusPath": "0" }
}
```

## Root Cause
The modal was calling the wrong API endpoint:
- **Called**: `/api/cqs/dialogue-move` - Expects `{ action, cqId, deliberationId, authorId }`
- **Should call**: `/api/dialogue/move` - Expects `{ deliberationId, targetType, targetId, kind, payload }`

The `/api/cqs/dialogue-move` endpoint is specifically for CQ-related dialogue moves with a different payload structure (action: "ask" | "answer", cqId, etc.).

The `/api/dialogue/move` endpoint is the general-purpose dialogue move creator that accepts the kind of payload the modal was sending.

## Solution
Updated all three dialogue move creation calls in `SchemeSpecificCQsModal.tsx`:

### 1. UNDERCUTS Attack (Line ~237)
**Before:**
```typescript
const moveRes = await fetch("/api/cqs/dialogue-move", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    deliberationId,
    targetType: "argument",
    targetId: argumentId,
    kind: "GROUNDS",
    payload: { cqKey, brief: text, locusPath: "0" },
  }),
});
```

**After:**
```typescript
const moveRes = await fetch("/api/dialogue/move", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    deliberationId,
    targetType: "argument",
    targetId: argumentId,
    kind: "GROUNDS",
    payload: { cqKey, brief: text, locusPath: "0" },
  }),
});
```

### 2. REBUTS Attack (Line ~192)
Same fix - changed endpoint from `/api/cqs/dialogue-move` to `/api/dialogue/move`

### 3. UNDERMINES Attack (Line ~302)
Same fix - changed endpoint from `/api/cqs/dialogue-move` to `/api/dialogue/move`

### Additional Improvements
- Added `authorId` check to condition: `if (deliberationId && authorId)`
- Improved error logging to show response data:
  ```typescript
  const errorData = await moveRes.json().catch(() => ({}));
  console.warn("[SchemeSpecificCQsModal] Failed to create GROUNDS move:", moveRes.status, errorData);
  ```

## Files Modified
- `components/arguments/SchemeSpecificCQsModal.tsx` (3 locations updated)

## Testing
After fix, the flow should work correctly:
1. User clicks CQ response button in SchemeSpecificCQsModal
2. Modal creates claim via POST /api/claims ✅
3. Modal creates GROUNDS DialogueMove via POST /api/dialogue/move ✅ (fixed)
4. Modal creates ConflictApplication via POST /api/ca ✅
5. Argument refreshes and shows new attack ✅

## API Endpoint Reference

### `/api/dialogue/move` (General Purpose)
**Purpose**: Create any type of dialogue move (ASSERT, WHY, GROUNDS, etc.)

**Request Body:**
```typescript
{
  deliberationId: string;
  targetType: "argument" | "claim" | "card";
  targetId: string;
  kind: "ASSERT" | "WHY" | "GROUNDS" | "RETRACT" | "CONCEDE" | "CLOSE" | "THEREFORE" | "SUPPOSE" | "DISCHARGE";
  payload?: any;
  postAs?: { userId: string; displayName?: string };
}
```

**Use Cases:**
- Creating GROUNDS responses to arguments
- Creating WHY challenges
- Creating CONCEDE/RETRACT moves
- General dialogue move tracking

### `/api/cqs/dialogue-move` (CQ-Specific)
**Purpose**: Create dialogue moves specifically from CQ ask/answer actions with ASPIC+ integration

**Request Body:**
```typescript
{
  action: "ask" | "answer";
  cqId: string;              // CQStatus ID
  deliberationId: string;
  authorId: string;
  targetArgumentId?: string;  // For "ask"
  answerText?: string;        // For "answer"
  answerClaimId?: string;
  createCounterClaim?: boolean;
}
```

**Use Cases:**
- Asking a CQ via the CQ panel
- Answering a CQ with claim/counter-claim
- Automatic ASPIC+ attack computation from CQ mappings

## Status
✅ **FIXED** - All three attack types (REBUTS, UNDERCUTS, UNDERMINES) now create dialogue moves correctly.

TypeScript compilation: 0 errors
