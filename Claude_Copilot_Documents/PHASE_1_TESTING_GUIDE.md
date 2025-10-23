# Phase 1 Quick Testing Guide

**How to verify Phase 1 improvements are working**

---

## 1. Test GROUNDS Modal (No More Browser Prompt)

### Steps:
1. Navigate to any deliberation with an active WHY challenge
2. Look for an "Answer E1" or similar GROUNDS button
3. **Click the button**

### Expected Result:
- ✅ **Professional modal opens** (NLCommitPopover)
- ✅ **No browser `prompt()` alert**
- ✅ See large text area with proper styling
- ✅ See normalization preview option
- ✅ See "Commit & Post" button

### What NOT to see:
- ❌ Browser alert box with tiny input
- ❌ `window.prompt()` dialog

---

## 2. Test CommandCard Default View

### Steps:
1. Open any claim or argument card
2. Expand the LegalMoveToolbar (dialogue actions area)
3. **Look at the default view**

### Expected Result:
- ✅ **3×3 grid view shown by default**
- ✅ See CommandCard with:
  - ⚔️ ATTACK column
  - 🏳️ SURRENDER column  
  - ● NEUTRAL column
- ✅ Visual force indicators
- ✅ Button shows "📋 List View" (meaning grid is active)

### What NOT to see:
- ❌ List view as default
- ❌ Button showing "⚖️ Grid View" initially

---

## 3. Test View Toggle with Icons

### Steps:
1. With dialogue toolbar open in grid view
2. **Click the "📋 List View" button**

### Expected Result:
- ✅ Switches to list view
- ✅ Button changes to "⚖️ Grid View"
- ✅ Tooltip on hover explains action
- ✅ Smooth transition

### Steps (continued):
3. **Click "⚖️ Grid View" to switch back**

### Expected Result:
- ✅ Returns to grid view
- ✅ Button shows "📋 List View" again

---

## 4. Test WHY Input Examples

### Steps:
1. Find a claim you can challenge
2. Click "Challenge" tab in toolbar
3. **Click "Ask WHY" button**

### Expected Result:
- ✅ Inline input expands
- ✅ Placeholder text shows: `e.g. "What evidence supports this?" or "How do you know this?"`
- ✅ Below input, see tip: `💡 Tip: Ask a specific question about why they make this claim`
- ✅ Input is wider (w-80 class)

### What NOT to see:
- ❌ Vague placeholder: "WHY? (brief note)…"
- ❌ No help text

---

## 5. Test WHY Keyboard Submission

### Steps:
1. Expand WHY input (as above)
2. Type a question: "What evidence supports this claim?"
3. **Press Enter key** (don't click button)

### Expected Result:
- ✅ Submits immediately on Enter
- ✅ Button shows "Posting..." briefly
- ✅ Toast notification appears

---

## 6. Test Improved Toast Notifications

### Steps:
1. Post any dialogue move (WHY, GROUNDS, CLOSE, etc.)
2. **Watch for toast notification**

### Expected Result:
- ✅ Large toast appears (text-sm, not text-xs)
- ✅ Shows for **4 seconds** (not 1.4s)
- ✅ Icon appears: ✓ for success, ✕ for error
- ✅ Better styling: shadow-lg, backdrop-blur
- ✅ Animates in from bottom
- ✅ Positioned bottom-4 right-4

### Timing test:
- Count "1-Mississippi, 2-Mississippi, 3-Mississippi, 4-Mississippi"
- Toast should still be visible at 3 seconds
- Toast should disappear around 4 seconds

---

## 7. Test Descriptive Success Messages

### Test each move type and verify message:

| Move Type | Action | Expected Toast Message |
|-----------|--------|------------------------|
| WHY | Click "Ask WHY" button, submit | "Challenge posted! Waiting for response." |
| GROUNDS | Click "Answer" button, submit | "Response posted successfully!" |
| CLOSE | Click "Close (†)" button | "Discussion closed." |
| CONCEDE | Click "Concede" button | "Conceded - added to your commitments." |
| RETRACT | Click "Retract" button | "Retracted successfully." |

### For each:
- ✅ Verify exact message text matches
- ✅ Message explains **what happened**
- ✅ Message explains **consequence** if relevant

---

## 8. Test Helpful Tooltips

### Steps:
1. Find dialogue move buttons (WHY, GROUNDS, CLOSE, etc.)
2. **Hover over each button for 1 second**

### Expected Tooltips:

| Button | Expected Tooltip |
|--------|-----------------|
| WHY | "Challenge this claim - ask for justification" |
| GROUNDS (Answer) | "Respond to the challenge with your reasoning" |
| CLOSE (†) | "End this discussion and accept the current state" |
| CONCEDE | "Accept this claim and add it to your commitments" |
| RETRACT | "Withdraw your previous statement" |

### For disabled buttons:
- ✅ Tooltip shows **reason** why disabled
- Example: "Cannot close - outstanding challenges remain"

---

## 9. Test Error Messages

### Steps:
1. Disconnect from internet (or use dev tools to block network)
2. Try to post any dialogue move
3. **Watch for error toast**

### Expected Result:
- ✅ Red/rose colored toast (not green)
- ✅ ✕ icon (not ✓)
- ✅ Message includes error details: "Failed to post WHY: [error message]"
- ✅ Not just generic "Failed: WHY"

---

## 10. Full User Flow Test

### Scenario: Challenge a claim and get a response

**Steps**:
1. Find a claim you want to challenge
2. Open dialogue toolbar → See **grid view by default** ✅
3. Click "Ask WHY" → See **example placeholder** ✅
4. Type "What evidence supports this?"
5. Press **Enter** to submit ✅
6. See **4-second toast**: "Challenge posted! Waiting for response." ✅
7. Other user sees your challenge
8. They click "Answer E1" button
9. **Modal opens** (not browser prompt!) ✅
10. They type response and submit
11. See **4-second toast**: "Response posted successfully!" ✅

**Success criteria**:
- ✅ No browser prompts at any point
- ✅ Grid view shown by default
- ✅ Examples and tips visible
- ✅ All toasts visible for 4 seconds with icons
- ✅ All tooltips work on hover

---

## Browser Compatibility Test

Test in each browser:

### Chrome/Edge
- [ ] All features working
- [ ] Tooltips appear on hover
- [ ] Animations smooth
- [ ] Toast positioning correct

### Firefox
- [ ] All features working
- [ ] Emoji icons display correctly (✓ ✕ 📋 ⚖️)
- [ ] Modal backdrop works

### Safari
- [ ] All features working
- [ ] backdrop-blur renders correctly
- [ ] animate-in works

---

## Regression Testing

Verify existing functionality still works:

- [ ] **Answer-and-commit feature** still works (test from previous PR)
- [ ] **CommandCard actions** all execute correctly
- [ ] **Legal moves API** returns correct moves
- [ ] **Dialogue events** emit properly (check event bus)
- [ ] **DeepDivePanelV2** renders without errors
- [ ] **ArgumentsList** integrates correctly
- [ ] **NLCommitPopover** works as before

---

## Edge Cases to Test

### Empty states:
- [ ] No legal moves available → Toolbar hides/disables gracefully
- [ ] All moves disabled → Shows disabled reasons in tooltips

### Network errors:
- [ ] Failed POST → Error toast with details
- [ ] Timeout → Error toast visible for 4 seconds

### Rapid clicking:
- [ ] Click button multiple times quickly → Buttons disabled while `busy`
- [ ] No duplicate submissions

### Long text:
- [ ] Long WHY question → Input accommodates (w-80)
- [ ] Long error message → Toast wraps text properly

---

## Performance Check

- [ ] **Time to open modal**: < 200ms
- [ ] **Time to switch views**: < 100ms (grid ↔ list)
- [ ] **Toast animation**: Smooth, no jank
- [ ] **Tooltip delay**: ~500ms hover (browser default)
- [ ] **No console errors** in browser dev tools

---

## Accessibility Check

- [ ] **Keyboard navigation**: Tab through all buttons
- [ ] **Enter key**: Submits WHY input
- [ ] **Screen reader**: Tooltips readable
- [ ] **Focus indicators**: Visible on all interactive elements
- [ ] **ARIA labels**: Segmented control has proper `role="tablist"`

---

## Quick Smoke Test (30 seconds)

**If you only have 30 seconds**, test these critical items:

1. ✅ Click "Answer" button → **Modal opens** (no browser prompt)
2. ✅ Open toolbar → See **grid view by default**
3. ✅ Post any move → See **4-second toast with icon**
4. ✅ Hover over buttons → See **helpful tooltips**

If all 4 pass → Phase 1 is working! ✅

---

## Issue Reporting

If something doesn't work:

1. **Document**:
   - What you did (steps)
   - What you expected
   - What actually happened
   - Browser & OS

2. **Check console**:
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Copy full error message

3. **Screenshot**:
   - Capture the problematic UI
   - Annotate with arrows/circles

4. **Report**:
   - Create GitHub issue with template above
   - Tag: `UX`, `dialogue`, `Phase-1`

---

## Success Criteria Summary

**Phase 1 is successful if**:

- ✅ Zero browser `prompt()` calls
- ✅ CommandCard grid is default view
- ✅ All toasts visible for 4 seconds with icons
- ✅ WHY input has examples and help
- ✅ All buttons have descriptive tooltips
- ✅ No TypeScript compilation errors
- ✅ No runtime errors in console
- ✅ Existing features still work (no regressions)

**Result**: Dialogue UX is **significantly more intuitive** for users! 🎉
