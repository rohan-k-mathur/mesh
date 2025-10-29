# Phase 3 Feature User Flow Checklist

**Purpose**: Verify all Phase 3 features are correctly wired up and accessible via the user interface.

**Date**: October 29, 2025  
**Status**: ✅ All integrations complete, ready for testing

---

## ⚠️ Important: Component Location

**AIFArgumentsListPro is in the MODELS tab, NOT the Debate tab.**

- The Debate tab contains: PropositionComposerPro, PropositionsList, ClaimMiniMap, DialogueInspector
- The Models tab contains: AIFAuthoringPanel and **AIFArgumentsListPro** (with ArgumentCardV2 showing Phase 3 badges)
- The old `ArgumentsList` component is commented out and NOT used in DeepDivePanelV2

---

## Pre-Test Setup

### Prerequisites
- [ ] Local dev server running: `npm run dev`
- [ ] Navigate to a deliberation page: `/deliberation/[id]`
- [ ] Ensure deliberation has at least 3-5 arguments
- [ ] Ensure some arguments are > 7 days old (for temporal decay testing)

### Test Data Requirements
- [ ] At least 3 arguments with different schemes
- [ ] At least 1 argument with attacks (REBUTS/UNDERCUTS/UNDERMINES)
- [ ] At least 1 argument with answered attacks
- [ ] At least 1 assumption created in the deliberation

---

## Feature 1: DS Mode Toggle

### Location
Navigate to deliberation page → **DS Mode button in header** (next to Confidence dropdown)

### Test Steps
1. **Find DS Mode Toggle**
   - [ ] Locate "DS Mode: OFF" button in header section
   - [ ] Button is visible next to "Confidence: Product/Min" dropdown
   - [ ] Button has proper styling (slate background when OFF)

2. **Toggle DS Mode ON**
   - [ ] Click "DS Mode: OFF" button
   - [ ] Button text changes to "DS Mode: ON"
   - [ ] Button background changes to indigo/purple color
   - [ ] No console errors

3. **Verify DS Mode Affects ArgumentCardV2**
   - [ ] Navigate to **Models tab** (AIFArgumentsListPro is in Models, not Debate)
   - [ ] Scroll to arguments displayed by AIFArgumentsListPro component
   - [ ] Check confidence displays on argument cards
   - [ ] **DS Mode ON**: Should show interval format `[65.6% – 91.8%]`
   - [ ] **DS Mode OFF**: Should show single value `82%`

4. **Toggle DS Mode OFF**
   - [ ] Click "DS Mode: ON" button
   - [ ] Button reverts to "DS Mode: OFF"
   - [ ] Argument confidence displays revert to single values

### Success Criteria
- ✅ Toggle button is visible and clickable
- ✅ Toggle state persists during session
- ✅ Confidence displays update in real-time
- ✅ No visual glitches or layout shifts

---

## Feature 2: Dialogue State Badge

### Location
Navigate to deliberation page → **Models tab** → **AIFArgumentsListPro** → **Argument Cards**

### Test Steps
1. **Find Dialogue State Badge**
   - [ ] Open Models tab (AIFArgumentsListPro is in Models, not Debate)
   - [ ] Scroll to arguments section (AIFArgumentsListPro component)
   - [ ] Locate argument cards in the list
   - [ ] Find badge showing "X/Y ✓" format (e.g., "2/5 ✓")

2. **Verify Badge Display**
   - [ ] Badge is visible in argument card header (near scheme badge)
   - [ ] Badge shows format: `[answered]/[total] ✓`
   - [ ] Badge color changes based on status:
     - [ ] **All answered**: Green background
     - [ ] **Some answered**: Amber/yellow background
     - [ ] **None answered**: Slate/gray background

3. **Test Badge Interaction**
   - [ ] Hover over badge (if tooltip implemented)
   - [ ] Click badge (if clickable to open details)
   - [ ] Verify badge updates after answering an attack

4. **Test Attack Answering Flow**
   - [ ] Find argument with unanswered attacks
   - [ ] Note current badge count (e.g., "0/3 ✓")
   - [ ] Open attack menu and answer an attack
   - [ ] Return to argument list
   - [ ] Verify badge updates to "1/3 ✓"

### Success Criteria
- ✅ Badge displays correct answered/total counts
- ✅ Badge color reflects dialogue state
- ✅ Badge updates after attack responses
- ✅ Badge is responsive and doesn't overflow

---

## Feature 3: Stale Argument Badge

### Location
Navigate to deliberation page → **Models tab** → **AIFArgumentsListPro** → **Argument Cards** (for old arguments)

### Test Steps
1. **Find Stale Arguments**
   - [ ] Scroll through argument list
   - [ ] Identify arguments created > 7 days ago
   - [ ] Look for temporal decay badge (⏰ icon with "X days")

2. **Verify Badge Display**
   - [ ] Badge shows format: `⏰ 12 days` (or similar)
   - [ ] Badge color is amber/orange (indicating staleness)
   - [ ] Badge only appears for arguments > 7 days old
   - [ ] Recent arguments (< 7 days) have no stale badge

3. **Test Badge Tooltip** (if implemented)
   - [ ] Hover over stale badge
   - [ ] Tooltip shows decay explanation
   - [ ] Tooltip mentions confidence adjustment

4. **Verify Decay Impact**
   - [ ] Compare confidence of fresh vs. stale arguments
   - [ ] Stale arguments should have slightly lower confidence (if decay applied)

### Success Criteria
- ✅ Badge only shows for arguments > 7 days old
- ✅ Badge displays accurate age in days
- ✅ Badge has appropriate warning color
- ✅ Tooltip explains temporal decay (if implemented)

---

## Feature 4: Confidence Display with DS Mode

### Location
Navigate to deliberation page → **Models tab** → **AIFArgumentsListPro** → **Argument Card Badges**

### Test Steps
1. **Standard Mode (DS OFF)**
   - [ ] Ensure DS Mode is OFF
   - [ ] Find confidence badge on argument card
   - [ ] Verify format: Single percentage (e.g., "82%")
   - [ ] Confidence badge has appropriate color (green for high, amber for medium)

2. **DS Mode (DS ON)**
   - [ ] Toggle DS Mode ON
   - [ ] Return to argument list
   - [ ] Find confidence badge on argument card
   - [ ] Verify format: Interval `[bel% – pl%]` (e.g., "[65.6% – 91.8%]")
   - [ ] Verify interval shows two values with dash separator

3. **Confidence Badge Interactions**
   - [ ] Hover over confidence badge
   - [ ] Check if tooltip appears explaining DS intervals
   - [ ] Verify no layout breaks with longer DS format

4. **Compare Multiple Arguments**
   - [ ] Check 3-5 different argument cards
   - [ ] Verify all show DS intervals when mode is ON
   - [ ] Verify all revert to single values when mode is OFF

### Success Criteria
- ✅ Standard mode shows single confidence value
- ✅ DS mode shows belief-plausibility interval
- ✅ Format changes correctly with toggle
- ✅ Tooltip explains DS intervals (if implemented)

---

## Feature 5: Assumptions Tab

### Location
Navigate to deliberation page → **Assumptions tab** (new tab in header)

### Test Steps
1. **Navigate to Assumptions Tab**
   - [ ] Find tab bar with: Debate | Models | Ludics | Issues | CQ Review | Thesis | **Assumptions** | Hom-Sets
   - [ ] Click on "Assumptions" tab
   - [ ] Tab content loads without errors

2. **Test Create Assumption Form**
   - [ ] Find "Create Assumption" section
   - [ ] Form has text input for assumption statement
   - [ ] Form has "Create" button
   - [ ] Enter assumption text: "We assume good faith participation"
   - [ ] Click "Create" button
   - [ ] Verify assumption is created and appears in list below

3. **Test Active Assumptions Panel**
   - [ ] Find "Active Assumptions" section below form
   - [ ] Panel lists all assumptions for the deliberation
   - [ ] Each assumption shows:
     - [ ] Assumption text
     - [ ] Accept/Challenge buttons
     - [ ] Dependency indicators (if any)

4. **Test Assumption Actions**
   - [ ] Click "Accept" on an assumption
   - [ ] Verify visual feedback (color change, status update)
   - [ ] Click "Challenge" on another assumption
   - [ ] Enter challenge reason in modal/form
   - [ ] Verify challenged assumption shows in separate section

5. **Test Assumption Dependencies**
   - [ ] Create assumption that depends on another
   - [ ] Verify dependency graph/indicator shows relationship
   - [ ] Challenge parent assumption
   - [ ] Verify dependent assumption status updates

### Success Criteria
- ✅ Assumptions tab is visible and accessible
- ✅ Create form works and adds assumptions
- ✅ Active assumptions list displays correctly
- ✅ Accept/Challenge actions work
- ✅ Dependencies are tracked and displayed

---

## Feature 6: Hom-Sets Tab

### Location
Navigate to deliberation page → **Hom-Sets tab** (new tab in header)

### Test Steps
1. **Navigate to Hom-Sets Tab**
   - [ ] Find tab bar and click "Hom-Sets" tab
   - [ ] Tab content loads without errors
   - [ ] Loading indicator appears briefly

2. **Verify Data Loading**
   - [ ] Chart section shows "Categorical Analysis" title
   - [ ] Description text explains hom-set confidence
   - [ ] If no data: Shows "No arguments with hom-set data available yet"
   - [ ] If data available: HomSetComparisonChart renders

3. **Test HomSetComparisonChart**
   - [ ] Chart displays list of arguments
   - [ ] Each argument shows:
     - [ ] Argument title/conclusion
     - [ ] Confidence bar (visual representation)
     - [ ] Incoming attack count
     - [ ] Percentage value
   - [ ] Arguments are sorted by confidence (descending)
   - [ ] Chart has average confidence reference line

4. **Test Argument Click**
   - [ ] Click on an argument in the chart
   - [ ] Browser navigates/scrolls to argument in Debate tab
   - [ ] Target argument is highlighted or centered

5. **Test Error Handling**
   - [ ] If API error occurs, error message displays
   - [ ] Error message is user-friendly
   - [ ] User can retry or navigate away

### Success Criteria
- ✅ Hom-Sets tab is visible and accessible
- ✅ Chart loads and displays argument data
- ✅ Chart is interactive (click to navigate)
- ✅ Error states are handled gracefully
- ✅ Empty state shows helpful message

---

## Feature 7: Integration Testing

### Cross-Feature Interactions

1. **DS Mode + Confidence Display**
   - [ ] Toggle DS Mode ON
   - [ ] Navigate to Debate tab
   - [ ] Verify all argument confidence displays show intervals
   - [ ] Navigate to Hom-Sets tab
   - [ ] Verify chart confidence values reflect DS mode (if applicable)

2. **Dialogue State + Assumptions**
   - [ ] Accept an assumption in Assumptions tab
   - [ ] Navigate to Debate tab
   - [ ] Find arguments using that assumption
   - [ ] Verify dialogue state badge reflects assumption status (if applicable)

3. **Temporal Decay + Confidence**
   - [ ] Find stale argument (> 7 days old)
   - [ ] Note original confidence value
   - [ ] Check if confidence is adjusted for decay
   - [ ] Verify stale badge and adjusted confidence are both visible

4. **Multi-Tab Navigation**
   - [ ] Navigate: Debate → Assumptions → Hom-Sets → Debate
   - [ ] Verify tab state persists (no data loss)
   - [ ] Verify no performance degradation
   - [ ] Verify no memory leaks (check browser console)

### Success Criteria
- ✅ Features work together without conflicts
- ✅ Tab navigation is smooth and fast
- ✅ Data updates propagate across tabs
- ✅ No visual glitches or broken layouts

---

## Feature 8: Responsive Design & Accessibility

### Visual Design

1. **Layout on Desktop (1920x1080)**
   - [ ] All badges fit in argument card header
   - [ ] DS Mode toggle is visible without scrolling
   - [ ] Charts render at appropriate size
   - [ ] No horizontal scrolling

2. **Layout on Tablet (1024x768)**
   - [ ] Tab bar wraps or scrolls horizontally
   - [ ] Argument cards stack properly
   - [ ] Badges don't overflow card width
   - [ ] Forms are usable without zooming

3. **Layout on Mobile (375x667)**
   - [ ] Tabs are accessible (scroll or hamburger menu)
   - [ ] Argument cards are readable
   - [ ] Badges wrap to multiple lines if needed
   - [ ] Forms fit in viewport

### Accessibility

1. **Keyboard Navigation**
   - [ ] DS Mode toggle is focusable with Tab key
   - [ ] Enter/Space activates DS Mode toggle
   - [ ] Tab bar tabs are navigable with arrow keys
   - [ ] Forms are fully keyboard accessible

2. **Screen Reader Support**
   - [ ] DS Mode toggle announces state ("DS Mode ON" / "DS Mode OFF")
   - [ ] Badges have descriptive aria-labels
   - [ ] Chart has text alternative or aria-describedby
   - [ ] Form labels are properly associated with inputs

3. **Color Contrast**
   - [ ] All text meets WCAG AA contrast requirements
   - [ ] Badge colors have sufficient contrast
   - [ ] DS Mode toggle has clear visual focus indicator

### Success Criteria
- ✅ Layout adapts to different screen sizes
- ✅ All features are keyboard accessible
- ✅ Screen readers can navigate and understand UI
- ✅ Color contrast meets accessibility standards

---

## Feature 9: Performance & Edge Cases

### Performance

1. **Large Argument Lists (50+ arguments)**
   - [ ] Argument list renders without lag
   - [ ] Scrolling is smooth (60 fps)
   - [ ] DS Mode toggle doesn't freeze UI
   - [ ] Chart loads within 2 seconds

2. **Multiple Tab Switches**
   - [ ] Switch between tabs 10 times rapidly
   - [ ] No memory leaks (check DevTools Memory profiler)
   - [ ] No infinite re-renders (check console warnings)

3. **Real-Time Updates**
   - [ ] Create new argument
   - [ ] Verify it appears in list immediately
   - [ ] Answer an attack
   - [ ] Verify dialogue badge updates within 1 second

### Edge Cases

1. **No Arguments**
   - [ ] Navigate to empty deliberation
   - [ ] Debate tab shows "No arguments yet" message
   - [ ] Hom-Sets tab shows "No arguments available" message
   - [ ] No console errors

2. **No Assumptions**
   - [ ] Navigate to Assumptions tab in new deliberation
   - [ ] "Active Assumptions" panel shows empty state
   - [ ] Create form is still functional

3. **API Failures**
   - [ ] Disconnect network (throttle to Offline in DevTools)
   - [ ] Try loading Hom-Sets tab
   - [ ] Verify error message displays
   - [ ] Reconnect network and retry
   - [ ] Verify data loads successfully

4. **Malformed Data**
   - [ ] Argument with missing `updatedAt` field
   - [ ] Should fallback to `createdAt` (no stale badge error)
   - [ ] Argument with `null` confidence
   - [ ] Should show no confidence badge (no crash)

### Success Criteria
- ✅ Performance is acceptable with large datasets
- ✅ Edge cases are handled gracefully
- ✅ Error messages are user-friendly
- ✅ No crashes or console errors

---

## Final Verification

### Code Quality
- [ ] Run `npm run lint` → No new errors (only pre-existing warnings)
- [ ] Run `npm run build` → Build succeeds
- [ ] Check browser console → No errors or warnings
- [ ] Check Network tab → All API calls succeed (or fail gracefully)

### Documentation
- [ ] User guides mention all new features
- [ ] Integration plan is up-to-date
- [ ] Completion summary reflects current state

### Deployment Readiness
- [ ] All features tested and working
- [ ] No critical bugs or regressions
- [ ] Performance is acceptable
- [ ] Accessibility requirements met

---

## Test Results Summary

**Test Date**: _________________  
**Tester**: _________________  
**Environment**: Local Dev / Staging / Production (circle one)

### Features Status
- [ ] ✅ DS Mode Toggle: **PASS** / **FAIL** / **PARTIAL**
- [ ] ✅ Dialogue State Badge: **PASS** / **FAIL** / **PARTIAL**
- [ ] ✅ Stale Argument Badge: **PASS** / **FAIL** / **PARTIAL**
- [ ] ✅ Confidence Display: **PASS** / **FAIL** / **PARTIAL**
- [ ] ✅ Assumptions Tab: **PASS** / **FAIL** / **PARTIAL**
- [ ] ✅ Hom-Sets Tab: **PASS** / **FAIL** / **PARTIAL**
- [ ] ✅ Integration: **PASS** / **FAIL** / **PARTIAL**
- [ ] ✅ Accessibility: **PASS** / **FAIL** / **PARTIAL**
- [ ] ✅ Performance: **PASS** / **FAIL** / **PARTIAL**

### Issues Found
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Notes
_______________________________________________________
_______________________________________________________
_______________________________________________________

### Overall Status
- [ ] ✅ **APPROVED FOR PRODUCTION**
- [ ] ⚠️ **APPROVED WITH MINOR ISSUES**
- [ ] ❌ **REQUIRES FIXES BEFORE DEPLOYMENT**

---

## Quick Reference: Feature Locations

| Feature | Tab | Section | Element |
|---------|-----|---------|---------|
| DS Mode Toggle | Any | Header | Button next to Confidence dropdown |
| Dialogue State Badge | **Models** | AIFArgumentsListPro | Argument card header badges |
| Stale Argument Badge | **Models** | AIFArgumentsListPro | Argument card header badges |
| Confidence Display | **Models** | AIFArgumentsListPro | Argument card header badges |
| Create Assumption Form | Assumptions | Top section | Form with text input + button |
| Active Assumptions Panel | Assumptions | Below form | List of assumptions with actions |
| HomSetComparisonChart | Hom-Sets | Main section | Bar chart of arguments |

---

**Next Steps After Testing**:
1. Address any critical bugs found
2. Update user documentation with screenshots
3. Create demo video showing all features
4. Schedule user acceptance testing (UAT)
5. Plan production deployment

**Phase 3 Status**: ✅ **FEATURE COMPLETE & READY FOR USER TESTING**
