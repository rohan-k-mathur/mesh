# Phase 4: CriticalQuestionsV3 UI Integration - COMPLETE ✅

**Date**: November 6, 2025  
**Component**: `components/claims/CriticalQuestionsV3.tsx`  
**Status**: Implementation Complete, Ready for Testing  
**Backend**: `/api/cqs/dialogue-move` (already exists from Phase 1c)

---

## Changes Implemented

### 1. ✅ Updated `resolveViaGrounds()` Function

**Location**: Lines ~280-320

**Changes**:
- **Before**: Called `/api/cqs` directly to update CQStatus
- **After**: Calls `/api/cqs/dialogue-move` first to create GROUNDS DialogueMove, then updates CQStatus

**New Flow**:
```typescript
1. User provides grounds text
2. Optimistic UI update
3. → POST /api/cqs/dialogue-move (create GROUNDS move)
   - kind: "GROUNDS"
   - payload: { cqId, brief, locusPath }
4. → POST /api/cqs (update CQStatus)
   - satisfied: true
   - groundsText: grounds
5. Fire events: "cqs:changed", "dialogue:moves:refresh"
6. Clear input, collapse CQ
```

**Error Handling**:
- If DialogueMove creation fails, logs warning but continues to update CQStatus
- Maintains backward compatibility if deliberationId is missing

**Code Added**:
```typescript
// NEW: Create GROUNDS DialogueMove first (Phase 4)
if (deliberationId) {
  const moveRes = await fetch("/api/cqs/dialogue-move", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      deliberationId,
      targetType,
      targetId,
      kind: "GROUNDS",
      payload: {
        cqId: cqKey,
        brief: grounds,
        locusPath: "0",
      },
    }),
  });
  
  if (!moveRes.ok) {
    console.warn("[CriticalQuestionsV3] Failed to create GROUNDS move:", moveRes.status);
    // Continue anyway to update CQStatus
  }
}
```

---

### 2. ✅ Updated `toggleCQ()` Function

**Location**: Lines ~240-275

**Changes**:
- **Before**: Called `/api/cqs` directly to toggle satisfied status
- **After**: Creates WHY DialogueMove when marking CQ as unsatisfied, then updates CQStatus

**New Flow**:
```typescript
1. User clicks "Mark Satisfied/Unsatisfied"
2. Optimistic UI update
3. → If marking as unsatisfied + deliberationId exists:
   - POST /api/cqs/dialogue-move (create WHY move)
   - kind: "WHY"
   - payload: { cqId, locusPath }
4. → POST /api/cqs (update CQStatus)
   - satisfied: false/true
5. Fire events: "cqs:changed", "dialogue:moves:refresh"
```

**Why This Matters**:
- Asking "WHY" creates formal DialogueMove record
- Enables Ludics compilation of the question
- Preserves CQ metadata in ASPIC+ format
- Full provenance chain: CQ → WHY move → LudicAct → AifNode

**Code Added**:
```typescript
// NEW: Create WHY DialogueMove when marking as unsatisfied (Phase 4)
if (!satisfied && deliberationId) {
  const moveRes = await fetch("/api/cqs/dialogue-move", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      deliberationId,
      targetType,
      targetId,
      kind: "WHY",
      payload: {
        cqId: cqKey,
        locusPath: "0",
      },
    }),
  });
  
  if (!moveRes.ok) {
    console.warn("[CriticalQuestionsV3] Failed to create WHY move:", moveRes.status);
    // Continue anyway to update CQStatus
  }
}
```

---

### 3. ✅ Added Visual Indicator

**Location**: Lines ~600-610 (in CQ card rendering)

**Changes**:
- Added "Dialogue moves tracked" badge when deliberationId exists
- Similar styling to existing "counter-claims attached" badge
- Uses `MessageSquare` icon with purple color scheme

**Visual Indicator**:
```tsx
{/* NEW: Dialogue Move indicator (Phase 4) */}
{deliberationId && (
  <div className="mt-2 flex items-center gap-2 text-xs">
    <MessageSquare className="w-4 h-4 text-purple-500" />
    <span className="font-medium text-purple-700">
      Dialogue moves tracked
    </span>
  </div>
)}
```

**Future Enhancement**:
- Could fetch actual WHY/GROUNDS counts from backend
- Would require updating `/api/cqs` response to include DialogueMove counts
- Deferred to Phase 8 (visualization polish)

---

## Event Chain Verification

### Events Fired
1. **`cqs:changed`**: Triggers CQ data refresh (existing)
2. **`dialogue:moves:refresh`**: NEW - triggers DialogueMove list refresh
3. **`claims:changed`**: Triggers graph updates (existing)
4. **`arguments:changed`**: Triggers argument updates (existing)

### Event Listeners
Component already has proper event handlers via:
- `useBusEffect()` hook (lines ~180-200)
- Legacy `useEffect()` listeners (lines ~203-215)

**Verification**:
- ✅ Both `toggleCQ()` and `resolveViaGrounds()` fire all required events
- ✅ Event chain will trigger Ludics recompilation
- ✅ Backward compatible with existing event system

---

## Backend Integration

### API Endpoint Used
**`POST /api/cqs/dialogue-move`** (exists from Phase 1c)

**Request Format**:
```json
{
  "deliberationId": "string",
  "targetType": "claim" | "argument",
  "targetId": "string",
  "kind": "WHY" | "GROUNDS",
  "payload": {
    "cqId": "string",
    "brief"?: "string",  // For GROUNDS only
    "locusPath": "0"
  }
}
```

**Backend Processing** (from Phase 1c):
1. Validates request
2. Extracts CQ details from ArgumentScheme
3. Computes ASPIC+ attack metadata via `cqToAspicAttack()`
4. Creates DialogueMove with full payload
5. Creates ConflictApplication with aspicAttackType, aspicMetadata
6. Links via createdByMoveId FK
7. Triggers Ludics recompilation

**Provenance Chain**:
```
CriticalQuestionsV3 (UI)
  ↓ [User: "Provide grounds"]
DialogueMove (kind: GROUNDS, payload: {cqId, brief})
  ↓ [compileFromMoves()]
LudicAct (aspic: {attackType, targetScope, cqKey})
  ↓ [syncToAif()]
AifNode (metadata: {aspicAttackType, cqKey})
  ↓ [aifToAspic()]
ASPIC+ Attack (undermining|rebutting|undercutting)
```

---

## Testing Checklist

### Manual Testing Steps

#### Test 1: Mark CQ as Unsatisfied (WHY Move)
- [ ] Open CriticalQuestionsV3 for a claim/argument with deliberationId
- [ ] Expand a CQ
- [ ] Click "Mark Satisfied" toggle to mark as unsatisfied
- [ ] **Expected**: 
  - Network tab shows POST to `/api/cqs/dialogue-move` with kind: "WHY"
  - Console shows no errors
  - CQ marked as unsatisfied
  - "Dialogue moves tracked" badge appears

#### Test 2: Provide Grounds (GROUNDS Move)
- [ ] Expand an unsatisfied CQ
- [ ] Enter text in "Provide Grounds" textarea
- [ ] Click "Submit Grounds"
- [ ] **Expected**:
  - Network tab shows POST to `/api/cqs/dialogue-move` with kind: "GROUNDS"
  - Network tab shows POST to `/api/cqs` with satisfied: true
  - Console shows no errors
  - CQ marked as satisfied
  - Grounds text displayed in green box
  - Input cleared and CQ collapsed

#### Test 3: Event Chain
- [ ] Open browser console
- [ ] Listen for custom events: `cqs:changed`, `dialogue:moves:refresh`
- [ ] Perform Test 1 or Test 2
- [ ] **Expected**:
  - Both events fire
  - SWR cache invalidates
  - Other components refresh (e.g., LegalMoveChips)

#### Test 4: Backward Compatibility
- [ ] Test CQ actions on claim/argument WITHOUT deliberationId
- [ ] **Expected**:
  - No DialogueMove API calls (graceful degradation)
  - CQStatus still updates correctly
  - No console errors

#### Test 5: Error Handling
- [ ] Mock `/api/cqs/dialogue-move` to return 500 error
- [ ] Perform Test 1 or Test 2
- [ ] **Expected**:
  - Console warning logged
  - CQStatus still updates
  - UI doesn't crash

### Automated Testing (Future)

**Unit Tests** (to be created):
```typescript
// __tests__/components/CriticalQuestionsV3.test.tsx
describe("CriticalQuestionsV3 Phase 4", () => {
  it("calls /api/cqs/dialogue-move when providing grounds", async () => {
    // Mock fetch, render component, submit grounds
    // Verify DialogueMove endpoint called with correct payload
  });

  it("creates WHY move when marking CQ as unsatisfied", async () => {
    // Mock fetch, render component, toggle CQ
    // Verify WHY move created
  });

  it("fires dialogue:moves:refresh event", async () => {
    // Listen for event, perform action
    // Verify event fired
  });

  it("degrades gracefully without deliberationId", async () => {
    // Render without deliberationId
    // Verify no DialogueMove API calls
  });
});
```

---

## Integration with Ludics

### Phase 1e Integration
**File**: `packages/ludics-engine/compileFromMoves.ts`

When DialogueMoves are created, Phase 1e's `expandActsFromMove()` will:
1. Extract ASPIC+ metadata from `payload.aspicAttack`
2. Preserve in `act.aspic` field
3. Flow to LudicAct database record

**File**: `lib/ludics/syncToAif.ts`

Phase 1e's `createCANodeForAspicAttack()` will:
1. Read ASPIC+ metadata from LudicAct
2. Create CA-node with attackType, targetScope, cqKey
3. Link edges: attacker → CA → defender

**Verification**:
- ✅ Phase 1f tests (28 passing) validate this flow
- ✅ No changes needed to Ludics compilation (already complete)
- ✅ CriticalQuestionsV3 just needs to trigger the pipeline

---

## Performance Considerations

### Network Calls
**Before Phase 4**:
- 1 call: POST `/api/cqs`

**After Phase 4**:
- 2 calls: POST `/api/cqs/dialogue-move` + POST `/api/cqs`

**Impact**:
- ~50-100ms additional latency per CQ action
- Sequential calls (not parallel) for data consistency
- Acceptable trade-off for formal provenance

### Optimization Opportunities
1. **Combine endpoints**: Merge `/api/cqs` and `/api/cqs/dialogue-move` into single endpoint
2. **Parallel calls**: If data consistency allows, call both in parallel
3. **Batch operations**: If marking multiple CQs, batch DialogueMove creation

**Recommendation**: Monitor performance in production, optimize if needed

---

## Migration Notes

### Breaking Changes
**None** - backward compatible!

- Existing CQ actions still work without deliberationId
- Old `/api/cqs` endpoint unchanged
- UI gracefully degrades if backend fails

### Rollback Plan
If issues arise:
1. Comment out DialogueMove API calls in `resolveViaGrounds()` and `toggleCQ()`
2. Remove "dialogue:moves:refresh" event dispatches
3. Remove visual indicator (optional)

**Rollback Diff** (if needed):
```typescript
// Simply remove the "NEW: Create GROUNDS/WHY DialogueMove" blocks
// Keep everything else unchanged
```

---

## Documentation Updates

### User-Facing
- [ ] Update help docs explaining DialogueMove tracking
- [ ] Add tooltip to "Dialogue moves tracked" badge
- [ ] Document WHY/GROUNDS flow in user guide

### Developer-Facing
- [ ] Update AGENTS.md with CQ → DialogueMove flow
- [ ] Document `/api/cqs/dialogue-move` endpoint
- [ ] Add architectural diagram to ARCHITECTURE_REVIEW_ALIGNMENT.md

---

## Next Steps

### Immediate (Phase 4 Completion)
1. **Manual Testing**: Follow testing checklist above
2. **Fix Any Bugs**: Address issues discovered during testing
3. **Verify Events**: Ensure Ludics recompilation triggers correctly

### Short-term (Phase 5)
1. **SchemeSpecificCQsModal**: Wire to DialogueMove API (similar pattern)
2. **Test Integration**: Ensure both components work together
3. **Performance Testing**: Monitor API call latency

### Medium-term (Phases 6-8)
1. **AttackMenuProV2**: Add deprecation warning
2. **ASPIC+ Enhancement**: Update aifToAspic translation
3. **Visualization**: Add actual WHY/GROUNDS counts to badges

---

## Summary

✅ **Phase 4 Implementation Complete**

**Changes**:
- Modified 2 functions: `resolveViaGrounds()`, `toggleCQ()`
- Added 1 visual indicator: "Dialogue moves tracked" badge
- Added 1 new event: `dialogue:moves:refresh`
- 0 breaking changes
- 0 lint errors

**Result**:
- CQs now create formal DialogueMove records
- WHY moves created when asking questions
- GROUNDS moves created when providing answers
- Full ASPIC+ metadata preserved
- Ludics pipeline automatically triggered
- Backward compatible with existing code

**Estimate**: 2-3 hours development ✅ DONE  
**Actual**: ~1 hour implementation + testing remaining

**Status**: Ready for manual testing and Phase 5 implementation! 🎉

---

**Last Updated**: November 6, 2025  
**Next Phase**: Phase 5 - SchemeSpecificCQsModal UI Integration
