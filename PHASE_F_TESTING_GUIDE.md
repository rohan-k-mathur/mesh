# Phase F - Attack Creation Testing Guide

**Date**: November 7, 2025  
**Status**: Ready for Testing  
**Dev Server**: Running on localhost:3000

---

## Changes Implemented

### ✅ 1. Fixed GET /api/arguments Endpoint

**File**: `app/api/arguments/route.ts`

**Added GET Handler**:
```typescript
export async function GET(req: NextRequest) {
  const deliberationId = url.searchParams.get('deliberationId');
  
  const args = await prisma.argument.findMany({
    where: { deliberationId },
    select: {
      id: true,
      text: true,
      conclusionClaimId: true,
      claim: { select: { id: true, text: true } }
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = args.map(arg => ({
    id: arg.id,
    text: arg.text || arg.claim?.text || 'Untitled Argument',
    conclusion: { id: arg.claim.id, text: arg.claim.text }
  }));

  return NextResponse.json({ items: formatted, nextCursor: null }, NO_STORE);
}
```

**Response Format** (matches claims endpoint):
```json
{
  "items": [
    {
      "id": "arg_123",
      "text": "Therefore, climate action is urgent",
      "conclusion": {
        "id": "claim_456",
        "text": "Climate action is urgent"
      }
    }
  ],
  "nextCursor": null
}
```

### ✅ 2. Fixed AttackCreationModal Data Handling

**File**: `components/aspic/AttackCreationModal.tsx`

**Before**:
```typescript
setAvailableAttackers(attackerType === "claim" ? data.claims || [] : data.items || []);
```

**After**:
```typescript
// Both endpoints return { items: [...] } or array directly
setAvailableAttackers(data.items || data || []);
```

**Benefit**: Handles both paginated responses (`{ items: [...] }`) and direct arrays.

---

## Testing Checklist

### Test 1: Claim-Level Attack Creation (ClaimDetailPanel)

**Setup**:
1. Navigate to a deliberation with multiple claims
2. Click on a claim to open ClaimDetailPanel
3. Locate "Create ASPIC+ Attack" button (Swords icon)

**Test Steps**:

#### Test 1A: UNDERMINES Attack with Claim Attacker
1. Click "Create ASPIC+ Attack" button
2. Verify AttackCreationModal opens
3. Attack Type: Select "UNDERMINES"
4. Attacker Type: Select "Claim" (default)
5. Verify dropdown populates with claims from deliberation
6. Select an attacking claim
7. Click "Create Attack"
8. Verify success (modal closes, no error)
9. Open ASPIC+ tab in deliberation
10. Verify new attack appears in attacks list
11. Verify target claim shows as UNDERMINED

**Expected ASPIC+ Semantics**:
- Attack Type: UNDERMINES
- Target: Premise (K_p or K_a)
- Success: Always succeeds if target is K_a, needs preference if K_p
- Result: Undermined claim labeled OUT (if successful)

#### Test 1B: REBUTS Attack with Argument Attacker
1. Click "Create ASPIC+ Attack" button
2. Attack Type: Select "REBUTS"
3. Attacker Type: Toggle to "Argument"
4. Verify dropdown populates with arguments from deliberation
5. Select an attacking argument
6. Click "Create Attack"
7. Verify success
8. Open ASPIC+ tab
9. Verify rebutting attack appears
10. Verify target claim shows as REBUTTED

**Expected ASPIC+ Semantics**:
- Attack Type: REBUTS
- Target: Conclusion claim
- Success: Depends on preference ordering
- Result: Rebutted claim labeled OUT (if preference favors attacker)

#### Test 1C: Error Handling
1. Click "Create ASPIC+ Attack" button
2. Attack Type: UNDERMINES
3. Do NOT select an attacker
4. Click "Create Attack"
5. Verify error message: "Please select an attacker"
6. Select attacker and submit
7. Verify success

---

### Test 2: Argument-Level Attack Creation (ArgumentCardV2)

**Setup**:
1. Navigate to a deliberation with multiple arguments
2. Open an argument card
3. Scroll to footer
4. Locate "Attack" button (Swords icon, red border)

**Test Steps**:

#### Test 2A: UNDERCUTS Attack on Argument
1. Click "Attack" button in footer
2. Verify AttackCreationModal opens
3. Attack Type: Select "UNDERCUTS"
4. Attacker Type: Select "Claim"
5. Verify dropdown populates with claims
6. Select an attacking claim
7. Click "Create Attack"
8. Verify success
9. Expand "Inference" section in argument card
10. Verify UNDERCUTS attack badge appears
11. Open ASPIC+ tab
12. Verify undercutting attack appears
13. Verify argument labeled OUT (inference defeated)

**Expected ASPIC+ Semantics**:
- Attack Type: UNDERCUTS
- Target: Inference rule (RA-node)
- Success: Always succeeds (attacks rule applicability)
- Result: Argument labeled OUT (inference rule disabled)

#### Test 2B: UNDERMINES Attack on Argument Premise
1. Click "Attack" button
2. Attack Type: Select "UNDERMINES"
3. Attacker Type: Select "Claim"
4. Select attacking claim
5. Click "Create Attack"
6. Verify success
7. Expand "Premises" section
8. Verify undermined premise shows attack badge
9. Open ASPIC+ tab
10. Verify attack appears targeting argument premise

**Expected ASPIC+ Semantics**:
- Attack Type: UNDERMINES
- Target: Argument premise (implicit)
- Success: Depends on premise type (K_a/K_p/K_n)
- Result: Premise labeled OUT → Argument defeated

---

### Test 3: Attacker Dropdown Population

**Setup**:
1. Open AttackCreationModal from any location
2. Test both attacker types

#### Test 3A: Claims Dropdown
1. Attacker Type: "Claim"
2. Verify dropdown shows:
   - All claims in deliberation
   - Claim text preview
   - Ordered by creation date (newest first)
3. Verify loading state shows while fetching
4. Verify no errors in console

**API Call**:
```
GET /api/deliberations/{deliberationId}/claims
```

**Expected Response**:
```json
{
  "items": [
    { "id": "claim_1", "text": "Climate change is real", "createdAt": "...", "createdById": "..." },
    { "id": "claim_2", "text": "CO2 traps heat", ... }
  ],
  "nextCursor": null
}
```

#### Test 3B: Arguments Dropdown
1. Attacker Type: "Argument"
2. Verify dropdown shows:
   - All arguments in deliberation
   - Argument text or conclusion text
   - Ordered by creation date (newest first)
3. Verify loading state
4. Verify no errors in console

**API Call**:
```
GET /api/arguments?deliberationId={deliberationId}
```

**Expected Response**:
```json
{
  "items": [
    {
      "id": "arg_1",
      "text": "Therefore, action is urgent",
      "conclusion": { "id": "claim_3", "text": "Action is urgent" }
    }
  ],
  "nextCursor": null
}
```

---

### Test 4: ASPIC+ Integration Verification

**Setup**:
1. Create multiple attacks using AttackCreationModal
2. Open ASPIC+ tab in deliberation

#### Test 4A: Attacks Appear in ASPIC+ Tab
1. Verify all created attacks appear in "Attacks" section
2. Verify attack type labels (UNDERMINES/REBUTS/UNDERCUTS)
3. Verify attacker and target display correctly
4. Verify timestamps

#### Test 4B: Argument Labeling Updates
1. Verify attacked arguments show updated labels:
   - IN (no successful attacks)
   - OUT (defeated by attack)
   - UNDEC (circular attacks or tie)
2. Verify labels match grounded semantics

#### Test 4C: Attack Computation Correctness
1. Create UNDERMINES attack on K_a premise
2. Verify attack succeeds (K_a always defeatable)
3. Verify argument labeled OUT

4. Create UNDERMINES attack on K_n premise (axiom)
5. Verify attack FAILS (axioms protected)
6. Verify argument remains IN

7. Create UNDERCUTS attack on inference
8. Verify attack succeeds (undercuts always work)
9. Verify argument labeled OUT

---

### Test 5: UI/UX Validation

#### Test 5A: Modal Appearance
- ✅ Modal centers on screen
- ✅ Modal has backdrop (click outside closes)
- ✅ Close button (X) works
- ✅ Title: "Create ASPIC+ Attack"
- ✅ Sections clearly labeled

#### Test 5B: Attack Type Selection
- ✅ Three radio buttons visible
- ✅ UNDERMINES selected by default
- ✅ Clicking changes selection
- ✅ Semantic explanations display correctly:
  - UNDERMINES: "Challenge a premise"
  - REBUTS: "Contradict the conclusion"
  - UNDERCUTS: "Challenge the inference"

#### Test 5C: Attacker Type Toggle
- ✅ Toggle switches between Claim/Argument
- ✅ Dropdown updates when toggled
- ✅ Loading state shows during fetch
- ✅ Previous selection clears on toggle

#### Test 5D: Dropdown Behavior
- ✅ Shows "Select..." placeholder
- ✅ Truncates long text with ellipsis
- ✅ Scrollable if many options
- ✅ Disabled while loading

#### Test 5E: Submit Button
- ✅ Disabled if no attacker selected
- ✅ Shows loading spinner during submission
- ✅ Text changes to "Creating..."
- ✅ Error message displays if submission fails

#### Test 5F: ASPIC+ Semantic Explanations
- ✅ Info boxes display for each attack type
- ✅ K_a/K_p/K_n knowledge base explanations accurate
- ✅ Preference ordering mentioned for REBUTS
- ✅ Color coding: Blue (info), not red (not error)

---

### Test 6: Error Scenarios

#### Test 6A: Network Errors
1. Disconnect network
2. Open AttackCreationModal
3. Verify error message: "Failed to fetch attackers"
4. Reconnect network
5. Close and reopen modal
6. Verify dropdown populates

#### Test 6B: API Errors
1. Use invalid deliberationId
2. Verify graceful error handling
3. Error message displayed to user

#### Test 6C: Validation Errors
1. Submit with no attacker selected
2. Verify error: "Please select an attacker"
3. Submit with invalid targetId
4. Verify error from API displayed

---

### Test 7: Integration with Other Features

#### Test 7A: DialogueActionsButton Co-existence
1. In ArgumentCardV2, verify:
   - DialogueActionsButton on conclusion (header)
   - DialogueActionsButton on each premise
   - Attack button in footer
2. All buttons work independently
3. No UI conflicts

#### Test 7B: ClaimDetailPanel Integration
1. Open ClaimDetailPanel from ArgumentCardV2 premise
2. Verify "Create ASPIC+ Attack" button appears
3. Create attack on premise claim
4. Verify attack appears in parent argument's ASPIC+ evaluation

#### Test 7C: SchemeSpecificCQsModal Compatibility
1. Open argument with scheme
2. Verify "CQs" button in footer
3. Verify "Attack" button also in footer
4. Both modals work independently
5. Both create attacks (CQs via dialogue, Attack directly)

---

## Expected API Calls

### 1. Fetch Claims (Attacker Type = Claim)
```
GET /api/deliberations/{deliberationId}/claims
```

**Response**:
```json
{
  "items": [
    { "id": "claim_1", "text": "...", "createdAt": "...", "createdById": "..." }
  ],
  "nextCursor": null
}
```

### 2. Fetch Arguments (Attacker Type = Argument)
```
GET /api/arguments?deliberationId={deliberationId}
```

**Response**:
```json
{
  "items": [
    {
      "id": "arg_1",
      "text": "Therefore...",
      "conclusion": { "id": "claim_2", "text": "..." }
    }
  ],
  "nextCursor": null
}
```

### 3. Create Attack
```
POST /api/ca
```

**Payload** (Claim Target, Claim Attacker):
```json
{
  "deliberationId": "delib_123",
  "legacyAttackType": "UNDERMINES",
  "legacyTargetScope": "premise",
  "conflictingClaimId": "claim_attacker",
  "conflictedClaimId": "claim_target",
  "metaJson": {
    "createdVia": "attack-creation-ui",
    "attackType": "UNDERMINES"
  }
}
```

**Payload** (Argument Target, Claim Attacker):
```json
{
  "deliberationId": "delib_123",
  "legacyAttackType": "UNDERCUTS",
  "legacyTargetScope": "inference",
  "conflictingClaimId": "claim_attacker",
  "conflictedArgumentId": "arg_target",
  "metaJson": {
    "createdVia": "attack-creation-ui",
    "attackType": "UNDERCUTS"
  }
}
```

---

## Console Checks

### No Errors Expected
- ✅ No 405 Method Not Allowed
- ✅ No 404 Not Found
- ✅ No TypeScript errors
- ✅ No React warnings

### Expected Logs
- `[AttackCreationModal] Fetching attackers...` (if logging enabled)
- `[AttackCreationModal] Creating attack...` (if logging enabled)
- `[POST /api/ca] ConflictApplication created` (server-side)

---

## Performance Checks

### Dropdown Population
- **Expected**: < 500ms for 50 claims/arguments
- **Acceptable**: < 1s for 100 claims/arguments
- **Warning**: > 2s (consider pagination or search)

### Attack Creation
- **Expected**: < 300ms (database write)
- **Acceptable**: < 1s
- **Warning**: > 2s (check database indexes)

---

## Regression Checks

### Verify No Breakage
1. ✅ Existing arguments still display correctly
2. ✅ ASPIC+ tab still loads
3. ✅ CQ flow still works
4. ✅ Dialogue moves still create attacks
5. ✅ AttackMenuProV2 removed (no longer in ArgumentCardV2 header)
6. ✅ DialogueActionsButton still works on conclusion
7. ✅ DialogueActionsButton still works on premises

---

## Success Criteria

**Phase F Testing Complete When**:
- ✅ All Test 1 scenarios pass (claim-level attacks)
- ✅ All Test 2 scenarios pass (argument-level attacks)
- ✅ All Test 3 scenarios pass (dropdown population)
- ✅ All Test 4 scenarios pass (ASPIC+ integration)
- ✅ All Test 5 scenarios pass (UI/UX)
- ✅ All Test 6 scenarios pass (error handling)
- ✅ All Test 7 scenarios pass (integration)
- ✅ No console errors
- ✅ No regression issues

**Ready for Production When**:
- ✅ All tests pass
- ✅ Performance acceptable
- ✅ User testing with three personas complete
- ✅ Documentation updated

---

## Next Steps After Testing

1. **If Tests Pass**:
   - Mark Task 8 complete
   - Proceed to Task 9 (PropositionComposerPro enhancement)
   - Update user documentation

2. **If Tests Fail**:
   - Document failures
   - Fix issues
   - Re-test
   - Iterate

3. **Enhancement Priority**:
   - Phase F: Add PropositionComposerPro (create new attackers inline)
   - Phase C: Implement Strict Rules (R_s)
   - User guides: Three personas documentation

---

## Manual Testing Script

Copy-paste this into testing session:

```markdown
## Test Session: Phase F Attack Creation

**Date**: ___________
**Tester**: ___________
**Build**: main branch, commit ___________

### Test 1A: Claim-level UNDERMINES
- [ ] Modal opens
- [ ] Dropdown populates
- [ ] Attack created successfully
- [ ] Attack appears in ASPIC+ tab
- [ ] No errors

### Test 1B: Claim-level REBUTS
- [ ] Modal opens with Argument attacker
- [ ] Dropdown shows arguments
- [ ] Attack created successfully
- [ ] Attack appears in ASPIC+ tab

### Test 2A: Argument-level UNDERCUTS
- [ ] Modal opens from footer
- [ ] Attack created successfully
- [ ] Badge appears on Inference section
- [ ] Argument labeled OUT

### Test 2B: Argument-level UNDERMINES
- [ ] Attack on premise works
- [ ] Premise shows attack badge

### Test 3: Dropdowns
- [ ] Claims dropdown works
- [ ] Arguments dropdown works
- [ ] Loading states work

### Test 4: ASPIC+ Integration
- [ ] Attacks appear in ASPIC+ tab
- [ ] Labels update correctly
- [ ] K_a undermining succeeds
- [ ] K_n undermining fails
- [ ] Undercuts always succeed

### Test 5: UI/UX
- [ ] Modal appearance correct
- [ ] Attack type selection works
- [ ] Attacker toggle works
- [ ] Submit button states correct
- [ ] Explanations display

### Test 6: Errors
- [ ] Network error handled
- [ ] Validation error shown
- [ ] API error shown

### Test 7: Integration
- [ ] DialogueActionsButton still works
- [ ] ClaimDetailPanel integration works
- [ ] No UI conflicts

**Result**: PASS / FAIL
**Notes**: ___________
```

---

## Summary

**Files Modified**:
1. `app/api/arguments/route.ts` - Added GET handler
2. `components/aspic/AttackCreationModal.tsx` - Fixed data handling

**Testing Priority**:
1. **Critical**: Test 1, 2, 3 (core functionality)
2. **Important**: Test 4 (ASPIC+ integration)
3. **Nice-to-have**: Test 5, 6, 7 (polish)

**Estimated Testing Time**: 30-45 minutes for full suite

**Ready to Test**: ✅ YES
