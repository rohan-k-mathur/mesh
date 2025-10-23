# Phase 2 Implementation Summary
**Date**: 2025-10-22  
**Session**: Claim-Level CQ System + SUPPOSE/DISCHARGE Scope Tracking

---

## Overview

Successfully completed two major improvements to the dialogue system:

1. **Claim-Level Critical Questions**: Fixed the empty CQ modal issue — users can now ask CQs directly on claims
2. **SUPPOSE/DISCHARGE Validation**: Implemented scope tracking to prevent invalid DISCHARGE moves

Both improvements align with dialogical logic theory and improve UX by preventing errors before they occur.

---

## Feature 1: Claim-Level Critical Questions

### Problem

- Opening CQ modal on claims always showed "No critical questions yet"
- CQ system relied on `SchemeInstance` records
- **Arguments** have schemes, but **claims** typically don't
- No way to interrogate claim quality (relevance, truth, clarity) without first creating an argument

### Solution

Created **generic claim-level schemes** that auto-attach when needed:

1. **Claim Relevance** (`claim_relevance`)
   - Is this claim relevant to the deliberation topic?
   - Does this claim directly address the issue being discussed?

2. **Claim Clarity** (`claim_clarity`)
   - Is the claim clearly and unambiguously stated?
   - Are all key terms in the claim properly defined?

3. **Claim Truth** (`claim_truth`)
   - Is the claim factually accurate?
   - Is there evidence to support this claim?
   - Is there expert consensus on this claim?

### Implementation

**API**: `POST /api/claims/[id]/ensure-schemes`
- Checks if claim has any schemes
- If not, creates 3 generic schemes and attaches them via `SchemeInstance`
- Idempotent: safe to call multiple times

**UI Integration**: `ClaimMiniMap.tsx`
- Calls `ensure-schemes` when user clicks "CQs" button
- Calls `ensure-schemes` when expanding claim details
- Shows full `CriticalQuestions` component in expanded view

**User Experience**:
```
Before: Click "CQs" → Modal shows "No critical questions yet"
After:  Click "CQs" → Brief loading → Modal shows 3 schemes with 7 total CQs
```

### Files Created/Modified

**New**:
- `app/api/claims/[id]/ensure-schemes/route.ts` — Auto-attach generic schemes API
- `CLAIM_LEVEL_CQ_SYSTEM.md` — Documentation

**Modified**:
- `components/claims/ClaimMiniMap.tsx`:
  - Added `ensuringSchemes` state
  - Updated "CQs" button to call ensure-schemes
  - Updated expand buttons to call ensure-schemes
  - Added inline CQ panel in expanded view

### Testing

```bash
# Manual Test
1. Open DeepDivePanel → Select claim
2. Click "CQs" button
3. Verify modal shows 3 schemes (Relevance, Clarity, Truth)
4. Ask a WHY move → Verify CQ opens
5. Expand claim with "+" button
6. Verify inline CQ panel shows same schemes

# API Test
curl -X POST http://localhost:3001/api/claims/claim_xyz/ensure-schemes
# → { ok: true, schemes: ['claim_relevance', 'claim_clarity', 'claim_truth'] }

curl "http://localhost:3001/api/cqs?targetType=claim&targetId=claim_xyz"
# → { schemes: [ { key: 'claim_relevance', cqs: [...] }, ... ] }
```

---

## Feature 2: SUPPOSE/DISCHARGE Scope Tracking

### Problem

- Users could click "Discharge" without ever creating a "Suppose"
- No validation preventing invalid DISCHARGE moves
- Button always enabled, even when nonsensical
- Violated dialogical logic theory (SUPPOSE/DISCHARGE must be paired)

### Solution

Implemented **R8_NO_OPEN_SUPPOSE** validation rule with UI prevention:

1. **Validation Layer** (`lib/dialogue/validate.ts`):
   - Check if DISCHARGE has matching open SUPPOSE at locus
   - Verify SUPPOSE wasn't already discharged
   - Return `R8_NO_OPEN_SUPPOSE` error code if invalid

2. **Legal Moves Computation** (`app/api/dialogue/legal-moves/route.ts`):
   - Query for open SUPPOSE before user clicks
   - Set `disabled: true` on DISCHARGE move if no open SUPPOSE
   - Provide reason: "No open SUPPOSE at this locus"

3. **UI Display** (`CommandCard.tsx`):
   - Existing code already respects `disabled` prop
   - Button grayed out when disabled
   - Tooltip shows reason on hover

### Implementation Details

**Pairing Logic**:
```typescript
// Find most recent SUPPOSE at locus
const openSuppose = await prisma.dialogueMove.findFirst({
  where: {
    deliberationId,
    targetType,
    targetId,
    kind: 'SUPPOSE',
    payload: { path: ['locusPath'], equals: locusPath }
  },
  orderBy: { createdAt: 'desc' }
});

// Check if already discharged
if (openSuppose) {
  const matchingDischarge = await prisma.dialogueMove.findFirst({
    where: {
      kind: 'DISCHARGE',
      payload: { path: ['locusPath'], equals: locusPath },
      createdAt: { gt: openSuppose.createdAt }
    }
  });
  hasOpenSuppose = !matchingDischarge;
}
```

**User Experience**:
```
Scenario 1: No SUPPOSE yet
  "Discharge" button → DISABLED (gray)
  Hover → Tooltip: "No open SUPPOSE at this locus"

Scenario 2: After creating SUPPOSE
  "Discharge" button → ENABLED (white/blue)
  Click → Success, DISCHARGE created

Scenario 3: After DISCHARGE
  "Discharge" button → DISABLED again (gray)
  Prevents duplicate discharge
```

### Files Created/Modified

**New**:
- `SUPPOSE_DISCHARGE_SCOPE_TRACKING.md` — Documentation

**Modified**:
- `lib/dialogue/codes.ts`:
  - Added `R8_NO_OPEN_SUPPOSE` to `RCode` type
  - Added help text: "Cannot discharge: no open SUPPOSE at this locus"

- `lib/dialogue/validate.ts`:
  - Added R8 validation rule (40 lines)
  - Checks SUPPOSE existence and discharge status

- `app/api/dialogue/legal-moves/route.ts`:
  - Added SUPPOSE query before returning DISCHARGE move
  - Sets `disabled` and `reason` based on query result

### Testing

```bash
# Test 1: Valid sequence
POST /api/dialogue/move { kind: 'SUPPOSE', payload: { locusPath: '0', expression: 'Assume X' } }
# → 200 OK

POST /api/dialogue/move { kind: 'DISCHARGE', payload: { locusPath: '0' } }
# → 200 OK

# Test 2: Invalid (no SUPPOSE)
POST /api/dialogue/move { kind: 'DISCHARGE', payload: { locusPath: '0' } }
# → 409 Conflict { reasonCodes: ['R8_NO_OPEN_SUPPOSE'] }

# Test 3: Double discharge
POST /api/dialogue/move { kind: 'SUPPOSE', ... }
# → 200 OK
POST /api/dialogue/move { kind: 'DISCHARGE', ... }
# → 200 OK
POST /api/dialogue/move { kind: 'DISCHARGE', ... }
# → 409 Conflict (already discharged)

# Test 4: UI state
GET /api/dialogue/legal-moves?...&locusPath=0
# → { moves: [ ..., { kind: 'DISCHARGE', disabled: true, reason: '...' } ] }
```

---

## Theoretical Alignment

### Dialogical Logic Foundation

Both features align with formal argumentation theory:

**Claim-Level CQs**:
- Based on pragma-dialectical theory (van Eemeren)
- Relevance/Clarity/Truth are **preconditions for rational dialogue**
- Separate from reasoning quality (handled by argument schemes)
- Enables **epistemic responsibility** at claim level

**SUPPOSE/DISCHARGE**:
- From **natural deduction** (Gentzen, Prawitz)
- SUPPOSE opens **hypothetical scope** for conditional reasoning
- DISCHARGE validates **conditional conclusions**
- Pairing constraint is **structural rule** (like parentheses in math)

### Connection to Phase 1

This builds on Phase 1 UX improvements:
- **Phase 1**: Fixed grid display, added tooltips, improved modal UX
- **Phase 2**: Added semantic validation (prevents logical errors)
- **Phase 3** (next): Full scope tracking with nested loci

---

## Remaining Limitations

### Claim-Level CQs

**Current** (Phase 2):
- ✅ Generic schemes auto-attach
- ✅ Same UI as argument CQs
- ✅ WHY/GROUNDS moves work

**Not Yet Implemented** (Phase 3):
- ❌ Custom claim schemes per deliberation
- ❌ Scheme recommendation based on claim content
- ❌ Batch ensure-schemes for all claims
- ❌ Inter-claim consistency CQs

### SUPPOSE/DISCHARGE

**Current** (Phase 2):
- ✅ Single-level pairing validation
- ✅ UI prevention (disabled button)
- ✅ Per-locus tracking
- ✅ Duplicate discharge prevention

**Not Yet Implemented** (Phase 3):
- ❌ Nested suppositions (SUPPOSE within SUPPOSE)
- ❌ Scope-aware locus creation ("0.supp1")
- ❌ Conditional labeling (mark claims as "if X holds")
- ❌ Visualization of active scopes
- ❌ Orphan detection (W6_IDLE_SUPPOSITION warning)

---

## Next Steps

### Immediate (Phase 2 Completion)
1. ✅ **DONE**: Claim-level CQ system
2. ✅ **DONE**: SUPPOSE/DISCHARGE validation
3. 🔄 **IN PROGRESS**: User testing and feedback
4. 📋 **TODO**: Write migration guide for existing deliberations

### Short-Term (Phase 3)
1. Nested scope implementation
2. Scope visualization in UI
3. Conditional AF labels
4. Inference validation for THEREFORE

### Long-Term (Phase 4+)
1. Full dialogical logic engine (SR0-SR3)
2. Strategy explorer (winning strategy computation)
3. Particle rule dispatcher (typed challenges per connective)
4. Multi-level nesting with scope stack

---

## Documentation Artifacts

1. **DIALOGUE_SYSTEM_DESIGN_ANALYSIS.md**
   - Comprehensive analysis of WHY restriction
   - Theoretical foundation for structural moves
   - Gap analysis (theory vs. implementation)
   - Recommendations for Phase 3+

2. **CLAIM_LEVEL_CQ_SYSTEM.md**
   - Architecture (argument schemes vs claim schemes)
   - Generic scheme definitions
   - API and UI integration details
   - Testing procedures

3. **SUPPOSE_DISCHARGE_SCOPE_TRACKING.md**
   - Theoretical background (natural deduction)
   - Implementation details (R8 validation)
   - Example flows (valid/invalid sequences)
   - Future enhancements (nested scopes)

4. **PHASE_2_IMPLEMENTATION_SUMMARY.md** (this file)
   - High-level overview of both features
   - Testing summaries
   - Next steps roadmap

---

## Code Statistics

### New Files
- `app/api/claims/[id]/ensure-schemes/route.ts` — 150 lines
- `DIALOGUE_SYSTEM_DESIGN_ANALYSIS.md` — 850 lines
- `CLAIM_LEVEL_CQ_SYSTEM.md` — 300 lines
- `SUPPOSE_DISCHARGE_SCOPE_TRACKING.md` — 450 lines
- `PHASE_2_IMPLEMENTATION_SUMMARY.md` — 250 lines

### Modified Files
- `components/claims/ClaimMiniMap.tsx` — +80 lines (CQ integration)
- `lib/dialogue/validate.ts` — +45 lines (R8 rule)
- `app/api/dialogue/legal-moves/route.ts` — +35 lines (DISCHARGE disabled state)
- `lib/dialogue/codes.ts` — +2 lines (R8 code + help text)

**Total**: ~2,162 lines of code and documentation

---

## Success Criteria

### Claim-Level CQs ✅
- [x] Generic schemes created
- [x] Auto-attach API implemented
- [x] UI integration in ClaimMiniMap
- [x] CQ modal no longer empty
- [x] WHY/GROUNDS moves work on claims
- [x] Documentation complete

### SUPPOSE/DISCHARGE ✅
- [x] R8 validation rule implemented
- [x] Legal moves computation checks pairing
- [x] UI disables button when no open SUPPOSE
- [x] Duplicate discharge prevented
- [x] Error messages clear and helpful
- [x] Documentation complete

---

## Lessons Learned

### Design Decisions

1. **Auto-attach vs Manual Setup**
   - Chose auto-attach for better UX (just works)
   - Users discover through use, not configuration
   - Aligns with "pit of success" principle

2. **UI Prevention vs Error After Click**
   - Disabled button prevents error before it occurs
   - Better UX than showing error modal
   - System state visible in affordances

3. **Generic vs Custom Schemes**
   - Started with 3 universal schemes (relevance/clarity/truth)
   - Can add custom schemes later without breaking existing code
   - Balances simplicity with extensibility

### Technical Insights

1. **Prisma Query Patterns**
   - `orderBy: { createdAt: 'desc' }` crucial for finding "most recent"
   - `createdAt: { gt: someDate }` for temporal pairing
   - `payload: { path: ['locusPath'], equals: value }` for JSON queries

2. **Validation Layering**
   - Compute legality at `/legal-moves` (proactive)
   - Enforce at `/move` (defensive)
   - Prevents both accidental and malicious errors

3. **Event-Driven Updates**
   - `window.dispatchEvent('claims:changed')` triggers cache refresh
   - SWR `mutate()` invalidates stale data
   - Ensures UI stays in sync after mutations

---

## End of Phase 2 Summary

**Status**: ✅ **COMPLETE**

Both features successfully implemented, tested, and documented. Ready for user testing and Phase 3 planning.

**Next Session**: User testing feedback → Phase 3 scope definition
