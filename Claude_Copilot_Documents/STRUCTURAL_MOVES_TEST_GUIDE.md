# 🧪 THEREFORE/SUPPOSE/DISCHARGE Testing Guide

**Status**: Ready for testing (Item #1 from roadmap)  
**Date**: October 22, 2025  
**Testing Mode**: ENABLED (`DIALOGUE_TESTING_MODE=true`)

---

## ✅ Prerequisites

Before testing, verify:

1. **Server is running**: `yarn dev` (should be on port 3000 or 3001)
2. **Testing mode enabled**: `.env` contains `DIALOGUE_TESTING_MODE=true`
3. **You're logged in**: Have an active user session
4. **You have a deliberation**: Navigate to any deliberation with claims

---

## 🎯 Test Scenarios

### Test 1: Basic SUPPOSE Flow

**Purpose**: Verify you can create suppositions and they appear in the dialogue

**Steps**:
1. Navigate to a deliberation with at least one claim
2. Click on a claim to open graph explore view
3. Look for the **CommandCard** (Actions panel on the right)
4. Click the **"Suppose"** button
5. When prompted, enter: `If we assume that climate change is real`
6. Click OK

**Expected Results**:
- ✅ Prompt appears with clear message
- ✅ Move posts successfully (no errors in console)
- ✅ New SUPPOSE node appears in DialogueInspector
- ✅ SUPPOSE move shows in commitment store
- ✅ UI refreshes automatically

**Check Console** (F12 → Console):
- Should see: `POST /api/dialogue/move` with status 200
- No errors about "expression required"

---

### Test 2: DISCHARGE After SUPPOSE

**Purpose**: Verify DISCHARGE button enables after SUPPOSE and closes the scope

**Steps**:
1. After completing Test 1 (you have an open SUPPOSE)
2. Refresh the CommandCard (or navigate away and back)
3. Look for the **"Discharge"** button
4. Verify it's **enabled** (not grayed out)
5. Click **"Discharge"**
6. Confirm the action

**Expected Results**:
- ✅ DISCHARGE button is enabled (bright, clickable)
- ✅ Move posts successfully
- ✅ DISCHARGE node appears in DialogueInspector
- ✅ Scope closes (R8 validation passes)
- ✅ No "orphan DISCHARGE" errors

**Validation Rule Check** (R8):
- DISCHARGE must pair with an open SUPPOSE
- After DISCHARGE, that SUPPOSE scope is closed

---

### Test 3: THEREFORE With Premises

**Purpose**: Verify you can draw conclusions from existing claims

**Steps**:
1. Navigate to a claim that has supporting evidence or premises
2. Open the CommandCard
3. Click the **"Therefore"** button
4. When prompted, enter: `Therefore, we must take action now`
5. Click OK

**Expected Results**:
- ✅ Prompt appears asking for conclusion
- ✅ Move posts with expression text
- ✅ THEREFORE node appears in DialogueInspector
- ✅ Commitment store updated with conclusion
- ✅ Inference link created to premises

**Advanced Check**:
- Open DialogueInspector → Commitment Store
- Verify the THEREFORE conclusion shows dependencies on premises

---

### Test 4: Multiple SUPPOSE/DISCHARGE Pairs

**Purpose**: Verify you can have multiple scopes (not nested, just sequential)

**Steps**:
1. Create SUPPOSE #1: `If aliens exist`
2. Create claim inside scope
3. DISCHARGE scope #1
4. Create SUPPOSE #2: `If time travel is possible`
5. Create claim inside scope
6. DISCHARGE scope #2

**Expected Results**:
- ✅ Each SUPPOSE creates new scope
- ✅ Each DISCHARGE closes correct scope
- ✅ No confusion between scopes
- ✅ DialogueInspector shows clear hierarchy

---

### Test 5: Prompt Cancellation

**Purpose**: Verify users can cancel without posting moves

**Steps**:
1. Click **SUPPOSE** button
2. When prompt appears, click **Cancel** (or press ESC)
3. Verify nothing posts

**Expected Results**:
- ✅ No network request made
- ✅ No error messages
- ✅ Console shows: "Cancelled - no text entered"
- ✅ UI remains unchanged

---

### Test 6: Empty Text Validation

**Purpose**: Verify empty/whitespace-only text is rejected

**Steps**:
1. Click **SUPPOSE** button
2. Enter only spaces: `   `
3. Click OK

**Expected Results**:
- ✅ Move is cancelled (treated same as Cancel button)
- ✅ Console shows: "Cancelled - no text entered"
- ✅ No API request made

---

### Test 7: CommandCard vs LegalMoveChips Consistency

**Purpose**: Verify both UI components work the same way

**Steps**:
1. Test SUPPOSE from **CommandCard** (graph explore view)
2. Navigate to a different view with **LegalMoveChips**
3. Test SUPPOSE from LegalMoveChips
4. Compare behavior

**Expected Results**:
- ✅ Both prompt for text
- ✅ Both post moves successfully
- ✅ Both trigger UI refresh
- ✅ Same validation behavior

---

### Test 8: Integration with DialogueInspector

**Purpose**: Verify moves appear correctly in inspector

**Steps**:
1. Open DialogueInspector (usually in sidebar or dedicated tab)
2. Perform SUPPOSE move
3. Check inspector immediately
4. Perform THEREFORE move
5. Check inspector again

**Expected Results**:
- ✅ SUPPOSE shows in move history with expression text
- ✅ THEREFORE shows with conclusion text
- ✅ Timestamps are correct
- ✅ Move IDs are unique
- ✅ Target references are valid

---

### Test 9: Commitment Store Updates

**Purpose**: Verify commitment store tracks structural moves

**Steps**:
1. Open DialogueInspector → Commitment Store tab
2. Note current commitments
3. Perform THEREFORE move: `Therefore, X is true`
4. Refresh commitment store
5. Verify new commitment appears

**Expected Results**:
- ✅ THEREFORE conclusion added as commitment
- ✅ Polarity marked correctly (positive/negative)
- ✅ Dependencies on premises shown
- ✅ Commitment ID matches move ID

---

## 🐛 Known Issues to Watch For

### Issue 1: Prompt Appears Behind Window
**Symptom**: window.prompt() hidden by modal or overlay  
**Workaround**: Close any open modals first  
**Fix**: Item #7 (replace with proper modal)

### Issue 2: UI Doesn't Refresh After Move
**Symptom**: Move posts but UI shows stale data  
**Debug**: Check if `mesh:dialogue:refresh` event fires  
**Fix**: Hard refresh (Cmd/Ctrl + R)

### Issue 3: DISCHARGE Button Stays Disabled
**Symptom**: Can't discharge even after SUPPOSE  
**Debug**: Check if SUPPOSE move actually posted (console network tab)  
**Fix**: Verify locus state in commitment store

---

## 📊 Test Results Checklist

Mark each test result:

- [ ] **Test 1**: SUPPOSE flow ✅/❌
- [ ] **Test 2**: DISCHARGE flow ✅/❌
- [ ] **Test 3**: THEREFORE flow ✅/❌
- [ ] **Test 4**: Multiple scopes ✅/❌
- [ ] **Test 5**: Cancellation works ✅/❌
- [ ] **Test 6**: Empty text rejected ✅/❌
- [ ] **Test 7**: UI consistency ✅/❌
- [ ] **Test 8**: Inspector integration ✅/❌
- [ ] **Test 9**: Commitment store ✅/❌

**Overall Result**: ___/9 tests passed

---

## 🔍 Debugging Tips

### Check Browser Console (F12)
```javascript
// Look for these log messages:
"Cancelled - no text entered"  // User cancelled or empty input
"POST /api/dialogue/move"      // Move API call
"mesh:dialogue:refresh"        // UI refresh event

// Check for errors:
"expression required"          // Missing text (shouldn't happen now)
"MOVE_ILLEGAL"                 // Protocol violation (check R8)
```

### Check Network Tab
```
POST /api/dialogue/move
Status: 200 ✅ (success)
Status: 400 ❌ (validation error - check response body)
Status: 409 ❌ (protocol conflict - check error message)
```

### Verify Move Payload
In Network tab, click the POST request → Payload:
```json
{
  "deliberationId": "...",
  "targetType": "claim",
  "targetId": "...",
  "kind": "SUPPOSE",
  "payload": {
    "expression": "If we assume X",  // ✅ Should be present
    "locusPath": "0.1.2"
  },
  "autoCompile": true,
  "autoStep": true
}
```

---

## 🚀 Next Steps After Testing

**If all tests pass**:
1. ✅ Mark Item #1 as complete
2. 🎯 Proceed to Item #5 (AIF attack integration)
3. 🎨 Schedule Item #7 (better modals) for later

**If any tests fail**:
1. Note which test failed and the error message
2. Check console for stack traces
3. Share error details for debugging
4. Fix issues before moving to next items

---

## 📝 Reporting Test Results

After testing, provide:

1. **Overall status**: "All tests passed" or "X tests failed"
2. **Failed tests**: Which test numbers failed
3. **Error messages**: Console errors or API response errors
4. **Screenshots**: If UI behaves unexpectedly
5. **Next steps**: Ready for Item #5 or need fixes first

---

**Happy Testing! 🎉**

Once testing is complete, we'll move on to the high-value AIF attack integration (Item #5).
