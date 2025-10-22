# Comprehensive Test Checklist
## Mesh Dialogue System Integration - All Features

**Last Updated:** October 22, 2025  
**Test Scope:** All features implemented during dialogue system integration work

---

## Test Environment Setup

### Prerequisites
- [ ] Dev server running (`yarn dev` on port 3000/3001)
- [ ] Valid user account logged in
- [ ] Access to a room with deliberation enabled
- [ ] Test claim created with deliberation attached
- [ ] Browser console open to monitor errors
- [ ] Network tab open to verify API calls

---

## Phase 1: CommandCard Grid Display

### Test 1.1: Grid Shows All Legal Moves
**Goal:** Verify the grid no longer shows only CONCEDE/RETRACT

**Steps:**
1. Navigate to a claim with active deliberation
2. Open the CommandCard/legal moves display
3. Observe the available moves

**Expected Results:**
- [ ] Grid shows multiple move types (not just 2)
- [ ] WHY moves visible for challenges
- [ ] GROUNDS moves visible if there are open WHYs
- [ ] Structural moves (THEREFORE/SUPPOSE/DISCHARGE) visible
- [ ] All moves properly positioned in grid
- [ ] No console errors

**Files Modified:**
- `components/dialogue/LegalMoveChips.tsx`
- `app/api/dialogue/legal-moves/route.ts`

---

## Phase 2: Claim-Level Critical Questions

### Test 2.1: Auto-Attach Generic Schemes
**Goal:** Verify claims automatically get 3 generic schemes attached

**Steps:**
1. Create a new claim (or find an existing one)
2. Open the claim's CQ modal/panel
3. Check which schemes are available

**Expected Results:**
- [ ] Claim has `claim_relevance` scheme (2 CQs)
- [ ] Claim has `claim_clarity` scheme (2 CQs)  
- [ ] Claim has `claim_truth` scheme (3 CQs)
- [ ] Total: 7 critical questions available
- [ ] All CQs show question text properly
- [ ] Satisfaction status tracked (checkboxes work)

**Files Modified:**
- `app/api/claims/[id]/ensure-schemes/route.ts` (NEW)
- `components/claims/ClaimMiniMap.tsx`
- `components/claims/CriticalQuestionsV2.tsx`

### Test 2.2: CQ Modal Opens from Claim
**Steps:**
1. Find a claim in the UI
2. Click the CQ/expand icon or button
3. Observe the modal

**Expected Results:**
- [ ] Modal opens without errors
- [ ] ensure-schemes API called before modal opens (check Network tab)
- [ ] All 7 generic CQs displayed
- [ ] Each CQ shows satisfaction checkbox
- [ ] Can toggle satisfaction status
- [ ] Changes persist (refresh page, status maintained)

---

## Phase 3: SUPPOSE/DISCHARGE Scope Tracking

### Test 3.1: SUPPOSE Opens Scope
**Goal:** Verify SUPPOSE moves create trackable scope

**Steps:**
1. Navigate to claim with dialogue
2. Click "Suppose..." button
3. Enter supposition text when prompted (e.g., "Suppose the sky is green")
4. Submit the move

**Expected Results:**
- [ ] Prompt appears asking for supposition text
- [ ] Move posts successfully after entering text
- [ ] Success toast shows "Supposition opened!"
- [ ] Move appears in DialogueInspector
- [ ] DISCHARGE button becomes **enabled** after SUPPOSE

**Files Modified:**
- `components/dialogue/LegalMoveChips.tsx` (prompt logic)
- `lib/dialogue/validate.ts` (R8 validation)

### Test 3.2: DISCHARGE Closes Scope
**Steps:**
1. After posting SUPPOSE (from 3.1)
2. Verify DISCHARGE button is enabled
3. Click DISCHARGE button
4. Enter discharge text when prompted

**Expected Results:**
- [ ] DISCHARGE button enabled only when SUPPOSE is open
- [ ] Prompt appears for discharge text
- [ ] Move posts successfully
- [ ] Success toast shows "Supposition discharged!"
- [ ] DISCHARGE button becomes **disabled** after discharge

### Test 3.3: R8 Validation - No Orphan DISCHARGE
**Steps:**
1. Find a claim with NO open SUPPOSE
2. Look for DISCHARGE button

**Expected Results:**
- [ ] DISCHARGE button is **disabled** or hidden
- [ ] Attempting to post DISCHARGE returns R8_NO_OPEN_SUPPOSE error
- [ ] Error message explains "No open supposition to discharge"

---

## Phase 4: CQ Workflow Fixes

### Test 4.1: WHY Without GROUNDS (R2 Fix)
**Goal:** Verify WHY moves don't immediately require GROUNDS

**Steps:**
1. Post a WHY move (challenge)
2. Observe the dialogue state
3. Check if R2_NO_OPEN_CQ error occurs

**Expected Results:**
- [ ] WHY posts successfully
- [ ] **No** R2_NO_OPEN_CQ error
- [ ] GROUNDS option appears for author to answer
- [ ] Dialogue not blocked
- [ ] CQ satisfaction tracked separately from moves

**Files Modified:**
- `components/claims/CriticalQuestionsV2.tsx` (removed auto-post)
- `app/api/cqs/toggle/route.ts` (removed author restriction)

### Test 4.2: CQ Moves After CONCEDE (R5 Fix)
**Goal:** Verify CQ-based moves work even after surrender

**Steps:**
1. Post a CONCEDE move on a claim
2. Try to post WHY or GROUNDS related to a CQ
3. Check for R5_AFTER_SURRENDER error

**Expected Results:**
- [ ] CQ-based WHY/GROUNDS moves **allowed** after CONCEDE
- [ ] **No** R5_AFTER_SURRENDER blocking CQ moves
- [ ] Non-CQ moves still blocked by R5 (as expected)
- [ ] Rule exemption working correctly

**Files Modified:**
- `lib/dialogue/validate.ts` (R5 exemption for CQ moves)

### Test 4.3: CQ Satisfaction Permission (403 Fix)
**Steps:**
1. As a non-author user
2. Try to mark a CQ as satisfied (toggle checkbox)
3. Check for 403 Forbidden error

**Expected Results:**
- [ ] **No** 403 error when toggling CQ satisfaction
- [ ] Any user can mark CQs satisfied (UI tracking)
- [ ] Author restriction removed
- [ ] CQ satisfaction persists across refreshes

**Files Modified:**
- `app/api/cqs/toggle/route.ts` (commented out author guard)

---

## Phase 5: Structural Moves (THEREFORE/SUPPOSE/DISCHARGE)

### Test 5.1: THEREFORE Posts with Expression
**Steps:**
1. Click "Therefore..." button
2. Enter conclusion text in prompt (e.g., "Therefore, X follows from Y")
3. Submit the move

**Expected Results:**
- [ ] Prompt appears with appropriate message
- [ ] Move posts successfully with expression text
- [ ] Success toast: "Conclusion asserted!"
- [ ] Move visible in DialogueInspector
- [ ] Expression text stored in move payload

**Files Modified:**
- `components/dialogue/LegalMoveChips.tsx` (prompt for THEREFORE)

### Test 5.2: User Cancels Structural Move
**Steps:**
1. Click THEREFORE, SUPPOSE, or DISCHARGE
2. Click "Cancel" in the prompt (or close without entering text)

**Expected Results:**
- [ ] Move **not** posted
- [ ] Toast shows "Cancelled - no text entered"
- [ ] No error in console
- [ ] Dialogue state unchanged

---

## Phase 6: Generic WHY Support

### Test 6.1: Challenge Button (Generic WHY)
**Goal:** Verify generic WHY works without CQ system

**Steps:**
1. Navigate to a claim
2. Look for "Challenge" button
3. Click "Challenge"
4. Enter challenge text when prompted

**Expected Results:**
- [ ] "Challenge" button visible alongside other moves
- [ ] Prompt asks: "What is your challenge? (Why should we accept this?)"
- [ ] Move posts successfully
- [ ] Auto-generated cqId (like `generic_why_1729612345678`)
- [ ] Success toast: "Challenge posted! Waiting for response."
- [ ] GROUNDS option appears for author to respond

**Files Modified:**
- `app/api/dialogue/move/route.ts` (auto-generate cqId)
- `app/api/dialogue/legal-moves/route.ts` (added Challenge button)
- `components/dialogue/LegalMoveChips.tsx` (prompt for generic WHY)
- `lib/dialogue/codes.ts` (added H1_GENERIC_CHALLENGE)

### Test 6.2: CQ-Based WHY Still Works
**Steps:**
1. Open CQ modal for a claim
2. Click WHY/challenge from within CQ system
3. Verify it uses specific cqId

**Expected Results:**
- [ ] CQ-based WHY still functions
- [ ] Uses specific cqId (like "E1", "E2") not generic
- [ ] Both pathways coexist without conflict

---

## Phase 7: CQ Integration into Move Chips

### Test 7.1: GROUNDS Button Shows Full CQ Text
**Goal:** Verify "Answer E1" tooltips show the actual question

**Steps:**
1. Post a WHY challenge that creates a CQ
2. Hover over the "Answer E1" button
3. Read the tooltip

**Expected Results:**
- [ ] Tooltip shows format: `E1: [full question text]`
- [ ] Example: `E1: Is this claim relevant to the discussion?`
- [ ] Tooltip is readable and helpful
- [ ] No more mysterious "E1" without context

**Files Modified:**
- `app/api/dialogue/legal-moves/route.ts` (fetch CQ text, add to verdict context)
- `components/dialogue/LegalMoveChips.tsx` (enhanced tooltip with cqText)

### Test 7.2: View CQs Button and Badge
**Steps:**
1. Navigate to a claim with CQs
2. Enable CQ button display (set `showCQButton={true}` on LegalMoveChips)
3. Observe the "View CQs" button

**Expected Results:**
- [ ] "View CQs" button visible
- [ ] Badge shows `satisfied/total` count
- [ ] Badge color:
  - Green if all CQs satisfied
  - Amber if partially satisfied
  - Gray if none satisfied
- [ ] Clicking button opens CQ modal (if `onViewCQs` handler provided)
- [ ] Button hidden if no CQs exist

**Files Modified:**
- `components/dialogue/LegalMoveChips.tsx` (added showCQButton prop, CQ stats, badge)

---

## Phase 8: Integration Testing

### Test 8.1: Full Dialogue Flow
**Goal:** Walk through a complete dialogue with all features

**Steps:**
1. Create a claim: "Renewable energy is cost-effective"
2. Open CQ modal → verify 7 generic CQs
3. Post generic WHY: "Challenge" → "Why should we believe this?"
4. Author posts GROUNDS with commitment
5. Post SUPPOSE: "Suppose gas prices triple"
6. Post THEREFORE: "Therefore, renewables become more attractive"
7. Post DISCHARGE: (close the supposition)
8. Check CQ satisfaction status
9. Hover over all move buttons to verify tooltips

**Expected Results:**
- [ ] All moves post successfully in sequence
- [ ] No R2, R5, R8, or other validation errors
- [ ] Tooltips always helpful (no mysterious codes)
- [ ] CQ badges update dynamically
- [ ] DialogueInspector shows all moves
- [ ] Commitment store updated after GROUNDS
- [ ] Success toasts clear and informative

### Test 8.2: Multiple Users Interaction
**Steps:**
1. User A creates claim and posts SUPPOSE
2. User B posts generic WHY (Challenge)
3. User A posts GROUNDS answer
4. User B marks CQ as satisfied
5. User A posts DISCHARGE

**Expected Results:**
- [ ] All moves allowed (no permission errors)
- [ ] R4_ROLE_GUARD prevents non-author from answering WHY (expected)
- [ ] But both users can mark CQs satisfied (403 fix working)
- [ ] State synchronized across both clients

---

## Phase 9: Error Handling & Edge Cases

### Test 9.1: Empty Text Inputs
**Steps:**
1. Click THEREFORE/SUPPOSE/DISCHARGE/Challenge
2. Enter only whitespace or empty string
3. Submit

**Expected Results:**
- [ ] Move cancelled with toast
- [ ] No API call made
- [ ] No error in console

### Test 9.2: Duplicate DISCHARGE
**Steps:**
1. Post SUPPOSE
2. Post DISCHARGE
3. Try to post DISCHARGE again

**Expected Results:**
- [ ] Second DISCHARGE button **disabled**
- [ ] If attempted via API: R8_NO_OPEN_SUPPOSE error
- [ ] Clear error message

### Test 9.3: Orphan GROUNDS
**Steps:**
1. Try to post GROUNDS with no open WHY

**Expected Results:**
- [ ] GROUNDS option **not visible** or disabled
- [ ] If attempted: validation error
- [ ] No orphan GROUNDS allowed

### Test 9.4: Close After CONCEDE
**Steps:**
1. Post CONCEDE
2. Try to post CLOSE

**Expected Results:**
- [ ] R5_AFTER_SURRENDER may block CLOSE (expected behavior)
- [ ] Error message clear
- [ ] OR: CLOSE allowed if deliberation rules permit

---

## Phase 10: UI/UX Verification

### Test 10.1: Loading States
**Steps:**
1. Post any move
2. Observe UI during API call

**Expected Results:**
- [ ] Button shows loading state (disabled, spinner, or similar)
- [ ] No double-posting possible
- [ ] Clear feedback when complete

### Test 10.2: Success Messages
**Goal:** Verify all move types show appropriate success toasts

**Expected Toasts:**
- [ ] WHY → "Challenge posted! Waiting for response."
- [ ] GROUNDS → "Response posted successfully!"
- [ ] CLOSE → "Discussion closed."
- [ ] CONCEDE → "Conceded - added to your commitments."
- [ ] RETRACT → "Retracted successfully."
- [ ] THEREFORE → "Conclusion asserted!"
- [ ] SUPPOSE → "Supposition opened!"
- [ ] DISCHARGE → "Supposition discharged!"

**Files Modified:**
- `components/dialogue/LegalMoveChips.tsx` (enhanced success messages)

### Test 10.3: Tooltips Helpful Everywhere
**Steps:**
1. Hover over every button type
2. Read tooltips

**Expected Results:**
- [ ] Generic WHY: "Challenge this claim - ask for justification"
- [ ] GROUNDS with CQ: Shows full question text
- [ ] GROUNDS generic: "Respond to the challenge with your reasoning"
- [ ] THEREFORE/SUPPOSE/DISCHARGE: Descriptive text
- [ ] Disabled buttons: Show reason for being disabled

---

## Phase 11: Code Quality & Maintenance

### Test 11.1: TypeScript Compilation
**Steps:**
1. Run `yarn build` or check editor for type errors

**Expected Results:**
- [ ] No TypeScript errors
- [ ] All new code types properly
- [ ] HCode type includes new codes (H1_GENERIC_CHALLENGE, etc.)

### Test 11.2: Console Warnings
**Steps:**
1. Open browser console
2. Perform all test scenarios above

**Expected Results:**
- [ ] No unexpected warnings
- [ ] No React key warnings
- [ ] No unhandled promise rejections
- [ ] Only expected debug logs (if any)

### Test 11.3: Network Efficiency
**Steps:**
1. Open Network tab
2. Perform typical dialogue interactions

**Expected Results:**
- [ ] No excessive API polling
- [ ] SWR deduplication working
- [ ] ETag caching used for /api/cqs
- [ ] No unnecessary re-fetches

---

## Regression Testing

### Test R.1: Old Functionality Still Works
**Goal:** Verify we didn't break existing features

**Steps:**
1. Post standard ASSERT move
2. Use AttackMenuPro to create AIF attacks
3. Use old WHY moves (if any legacy paths exist)
4. Check DialogueInspector display

**Expected Results:**
- [ ] All old features functional
- [ ] No regressions in core dialogue system
- [ ] AIF attacks still work (even if not yet integrated with WHY)

### Test R.2: Backward Compatibility
**Steps:**
1. Find old dialogue moves (pre-refactor)
2. Try to interact with them

**Expected Results:**
- [ ] Legacy moves display correctly
- [ ] Can still reply to old WHY moves
- [ ] Backward compatibility key: `legacy-${locusPath}` fallback works

---

## Performance Testing

### Test P.1: Large Deliberation Performance
**Steps:**
1. Find/create deliberation with 50+ moves
2. Open legal moves panel
3. Measure load time

**Expected Results:**
- [ ] Page loads in < 2 seconds
- [ ] No UI lag when opening CQ modal
- [ ] Pagination or virtualization if needed (future enhancement)

---

## Documentation Verification

### Test D.1: Code Comments Accurate
**Steps:**
1. Read inline comments in modified files
2. Compare with actual behavior

**Expected Results:**
- [ ] Comments match implementation
- [ ] TODO comments addressed or marked as deferred
- [ ] No outdated comments

### Test D.2: API Response Shapes
**Steps:**
1. Check Network tab for API responses
2. Verify against type definitions

**Expected Results:**
- [ ] `/api/dialogue/legal-moves` includes verdict.context.cqText
- [ ] `/api/cqs` returns schemes with cqs array
- [ ] All responses match TypeScript types

---

## Test Completion Checklist

### Files Modified Summary
**Total: 9 files modified + 1 new API endpoint**

1. ✅ `lib/dialogue/validate.ts` (R5 exemption, R8 validation)
2. ✅ `lib/dialogue/codes.ts` (new HCode values)
3. ✅ `app/api/dialogue/legal-moves/route.ts` (CQ text fetch, generic WHY)
4. ✅ `app/api/dialogue/move/route.ts` (auto-generate cqId for WHY)
5. ✅ `app/api/cqs/toggle/route.ts` (removed author restriction)
6. ✅ `app/api/claims/[id]/ensure-schemes/route.ts` (NEW - auto-attach)
7. ✅ `components/dialogue/LegalMoveChips.tsx` (prompts, tooltips, CQ button)
8. ✅ `components/claims/CriticalQuestionsV2.tsx` (refactored resolveViaGrounds)
9. ✅ `components/claims/ClaimMiniMap.tsx` (ensure-schemes call)

### Sign-off Criteria
- [ ] All Phase 1-8 tests pass
- [ ] No regressions in Phase R tests
- [ ] All error scenarios handled gracefully (Phase 9)
- [ ] UI/UX meets quality standards (Phase 10)
- [ ] Code quality verified (Phase 11)
- [ ] Documentation accurate (Phase D)

---

## Known Limitations & Future Work

**From 10-Item Roadmap (deferred items):**

1. **Item #3**: Store CQ grounds text in database
   - Status: Deferred (lower priority)
   - Currently: Grounds text not persisted
   - Future: Add `notes` field to CQStatus model

2. **Item #5**: AIF attack integration
   - Status: Not started
   - Future: Auto-post WHY when attack created

3. **Item #6**: CQ integration for arguments
   - Status: Not started
   - Currently: Only claims have CQ UI

4. **Item #7**: Better modals for structural moves
   - Status: Using window.prompt() temporarily
   - Future: Create StructuralMoveModal component

5. **Item #8**: Visual scope nesting indicators
   - Status: Not started
   - Future: Indentation, borders for nested SUPPOSE

6. **Item #9**: Comprehensive validation testing
   - Status: Basic validation working
   - Future: Test all edge cases (double DISCHARGE, etc.)

7. **Item #10**: Better error messages
   - Status: Generic errors still present
   - Future: User-friendly error messages in UI

---

## Test Execution Log

**Tester:** _______________  
**Date:** _______________  
**Build/Commit:** _______________

| Phase | Test ID | Status | Notes |
|-------|---------|--------|-------|
| 1 | 1.1 | ⬜ | |
| 2 | 2.1 | ⬜ | |
| 2 | 2.2 | ⬜ | |
| 3 | 3.1 | ⬜ | |
| 3 | 3.2 | ⬜ | |
| 3 | 3.3 | ⬜ | |
| 4 | 4.1 | ⬜ | |
| 4 | 4.2 | ⬜ | |
| 4 | 4.3 | ⬜ | |
| 5 | 5.1 | ⬜ | |
| 5 | 5.2 | ⬜ | |
| 6 | 6.1 | ⬜ | |
| 6 | 6.2 | ⬜ | |
| 7 | 7.1 | ⬜ | |
| 7 | 7.2 | ⬜ | |
| 8 | 8.1 | ⬜ | |
| 8 | 8.2 | ⬜ | |
| 9 | 9.1-9.4 | ⬜ | |
| 10 | 10.1-10.3 | ⬜ | |
| 11 | 11.1-11.3 | ⬜ | |
| R | R.1-R.2 | ⬜ | |
| P | P.1 | ⬜ | |
| D | D.1-D.2 | ⬜ | |

---

## Quick Start Testing Guide

**For rapid verification of main features:**

1. **Test Generic WHY** (5 min)
   - Click "Challenge" → enter text → verify success toast
   - Check "Answer [key]" appears for author

2. **Test SUPPOSE/DISCHARGE** (5 min)
   - Click "Suppose..." → enter text → verify posted
   - Check DISCHARGE enabled → click → verify posted
   - Verify DISCHARGE disabled after use

3. **Test CQ Integration** (5 min)
   - Open claim CQ modal → verify 7 questions
   - Hover over "Answer E1" → verify tooltip shows full question
   - Check "View CQs" badge shows correct count

4. **Test Error Handling** (3 min)
   - Cancel a prompt → verify no error
   - Try DISCHARGE without SUPPOSE → verify disabled
   - Check console for any errors

**Total Quick Test Time: ~20 minutes**

---

## Contact & Support

**Issues/Bugs:** Report in GitHub Issues or team Slack  
**Questions:** Reference `AGENTS.md` and `.github/copilot-instructions.md`  
**Documentation:** See `PHASE_3_COMPLETION_SUMMARY.md` for implementation details

---

**End of Test Checklist**
