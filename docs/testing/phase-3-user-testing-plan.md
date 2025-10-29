# Phase 3 UI/UX Integration - User Testing Plan

## Overview

This document outlines the plan for first-hand user testing of Phase 3 features. The goal is to validate that all implemented UI components work correctly, provide good user experience, and integrate seamlessly with Phase 2 backend systems.

## Testing Environment Setup

### Prerequisites

1. **Development server running**:
   ```bash
   cd /Users/rohanmathur/Documents/Documents/mesh
   yarn install
   yarn dev
   ```

2. **Database seeded with test data**:
   - At least 2 deliberations with 10+ arguments each
   - Arguments with various confidence levels (0.3-0.9)
   - Multiple attack/support edges between arguments
   - At least 5 assumptions in various states (PROPOSED, ACCEPTED, CHALLENGED, RETRACTED)
   - Arguments with different lastUpdatedAt dates (recent, 30 days, 90 days, 120+ days old)

3. **Environment variables set**:
   - Ensure `.env.local` has required database/API credentials
   - Phase 2 APIs must be functional

4. **Browser setup**:
   - Chrome or Firefox (latest version)
   - Developer console open for error monitoring
   - Network tab monitoring API calls

## Test Scenarios

### Section 1: Dialogue Tracking (3.1)

**Feature: Dialogue State Badge**

**Test Case 1.1: Badge displays correctly**
- [ ] Navigate to deliberation with multiple arguments
- [ ] Verify each argument card shows dialogue state badge
- [ ] Check badge format: `X/Y` (e.g., "2/5")
- [ ] Verify color coding:
  - [ ] Green for complete (X = Y)
  - [ ] Yellow for partial (0 < X < Y)
  - [ ] Red for pending (X = 0)

**Test Case 1.2: Badge updates after answering attack**
- [ ] Find an argument with pending attacks (e.g., "0/3")
- [ ] Click "Answer Attack" button
- [ ] Submit a GROUNDS response
- [ ] Verify badge updates to "1/3" (yellow)
- [ ] Answer remaining attacks until "3/3" (green)

**Feature: Answered Attacks Panel**

**Test Case 1.3: Panel shows attack-response pairs**
- [ ] Click on an argument with answered attacks
- [ ] Open "Answered Attacks" panel
- [ ] Verify panel displays:
  - [ ] Original attack content
  - [ ] GROUNDS response content
  - [ ] Attack scheme type
  - [ ] Vote buttons (upvote/downvote/flag)

**Test Case 1.4: Response voting works**
- [ ] Click upvote button on a response
- [ ] Verify vote count increments
- [ ] Verify button highlights/disables
- [ ] Reload page, verify vote persists

**Feature: Response Vote Widget**

**Test Case 1.5: Flag inappropriate response**
- [ ] Click flag button on a response
- [ ] Fill in flag reason: "Off-topic and unhelpful"
- [ ] Submit flag
- [ ] Verify confirmation message
- [ ] Check that flag is recorded (may require admin view)

**Feature: Dialogue Filter**

**Test Case 1.6: Filter arguments by dialogue state**
- [ ] Click "Dialogue Filter" button in argument list
- [ ] Select "Pending" (0/N)
- [ ] Apply filter
- [ ] Verify only arguments with 0 answered attacks shown
- [ ] Test "Partial" and "Complete" filters similarly

---

### Section 2: Temporal Decay (3.2)

**Feature: Stale Argument Badge**

**Test Case 2.1: Badge appears for stale arguments**
- [ ] Find an argument last updated > 7 days ago
- [ ] Verify stale badge appears with format: "X days ago • Decay: 0.XX"
- [ ] Check severity levels:
  - [ ] No badge for < 7 days
  - [ ] Yellow for 30-90 days
  - [ ] Red for > 90 days

**Test Case 2.2: Decay factor calculation**
- [ ] Check argument updated 90 days ago (half-life)
- [ ] Verify decay factor ≈ 0.50
- [ ] Check argument updated 180 days ago
- [ ] Verify decay factor ≈ 0.25

**Feature: Decay Explanation Tooltip**

**Test Case 2.3: Tooltip displays on hover**
- [ ] Hover over stale argument badge
- [ ] Verify tooltip appears with:
  - [ ] Days since update
  - [ ] Decay factor calculation
  - [ ] Formula explanation
  - [ ] Original vs. adjusted confidence
  - [ ] Suggestion to update

**Feature: Decay Configuration UI (Admin)**

**Test Case 2.4: Adjust decay settings**
- [ ] Navigate to Deliberation Settings (moderator role)
- [ ] Go to "Temporal Decay" tab
- [ ] Change half-life from 90 to 30 days
- [ ] Save configuration
- [ ] Refresh argument list
- [ ] Verify decay factors recalculated with new half-life

**Test Case 2.5: Reset decay by updating argument**
- [ ] Find a critically stale argument (> 90 days, decay ≈ 0.5)
- [ ] Click "Edit Argument"
- [ ] Add new evidence or rewrite substantially
- [ ] Save changes
- [ ] Verify stale badge disappears
- [ ] Verify decay factor returns to 1.0

---

### Section 3: Dempster-Shafer Visualization (3.3)

**Feature: Confidence Display (DS Mode)**

**Test Case 3.1: Toggle DS mode ON**
- [ ] Find DS mode toggle (top right or settings)
- [ ] Click toggle to enable DS mode
- [ ] Verify all confidence displays change from single value (e.g., "75%") to interval (e.g., "[0.65, 0.85]")
- [ ] Check localStorage to confirm DS mode persists

**Test Case 3.2: DS mode OFF displays standard confidence**
- [ ] Toggle DS mode OFF
- [ ] Verify confidence displays return to single values
- [ ] Verify no DS interval charts visible

**Feature: DS Interval Chart**

**Test Case 3.3: Chart renders correctly**
- [ ] Enable DS mode
- [ ] Open an argument detail page
- [ ] Verify DS interval chart appears
- [ ] Check chart segments:
  - [ ] Green bar (Belief)
  - [ ] Yellow bar (Uncertainty)
  - [ ] Red bar (Disbelief)
- [ ] Verify legend displays below chart
- [ ] Verify belief + uncertainty + disbelief ≈ 100%

**Test Case 3.4: Chart interpretation**
- [ ] Read interpretation text below chart
- [ ] For high belief (> 0.7), expect "Strong support" message
- [ ] For high uncertainty (> 0.4), expect "Significant uncertainty" message
- [ ] For low plausibility (< 0.4), expect "Low overall support" message

**Feature: DS Explanation Tooltip**

**Test Case 3.5: Tooltip provides DS theory explanation**
- [ ] Hover over DS confidence display ([0.6, 0.8])
- [ ] Verify tooltip appears with:
  - [ ] Belief value (0.6)
  - [ ] Plausibility value (0.8)
  - [ ] Uncertainty calculation (0.2)
  - [ ] Formulas (Bel, Pl)
  - [ ] "Why DS theory?" explanation
- [ ] Test optional mass assignments (if available)

---

### Section 4: Assumption Management (3.4)

**Feature: Assumption Card**

**Test Case 4.1: Display assumption with status**
- [ ] Navigate to Assumptions tab in deliberation
- [ ] Verify assumption cards display:
  - [ ] Assumption text
  - [ ] Role badge (BACKGROUND, DOMAIN, etc.)
  - [ ] Status badge (PROPOSED, ACCEPTED, CHALLENGED, RETRACTED)
  - [ ] Timestamp and proposer
- [ ] Verify action buttons based on status

**Test Case 4.2: Accept proposed assumption**
- [ ] Find a PROPOSED assumption
- [ ] Click "Accept" button
- [ ] Verify status changes to ACCEPTED
- [ ] Verify "Accept" button replaced with "Retract" button
- [ ] Reload page, verify status persists

**Test Case 4.3: Challenge assumption**
- [ ] Find a PROPOSED or ACCEPTED assumption
- [ ] Click "Challenge" button
- [ ] Fill challenge reason: "This assumption doesn't account for recent changes in policy"
- [ ] Submit challenge
- [ ] Verify status changes to CHALLENGED
- [ ] Verify challenge reason displays on card

**Test Case 4.4: Retract accepted assumption**
- [ ] Find an ACCEPTED assumption
- [ ] Click "Retract" button
- [ ] Confirm retraction (if confirmation modal appears)
- [ ] Verify status changes to RETRACTED
- [ ] Verify no action buttons visible for retracted assumption

**Feature: Active Assumptions Panel**

**Test Case 4.5: Panel lists active assumptions**
- [ ] Click "Active Assumptions" button in deliberation header
- [ ] Verify panel opens with list of ACCEPTED assumptions
- [ ] Check stats display:
  - [ ] Count of accepted assumptions
  - [ ] Count of challenged assumptions
  - [ ] Breakdown by role (BACKGROUND, DOMAIN, etc.)
- [ ] Click an assumption to navigate to detail page

**Feature: Assumption Dependency Graph**

**Test Case 4.6: View dependent arguments**
- [ ] Open an assumption detail page
- [ ] Navigate to "Dependencies" tab
- [ ] Verify list of arguments depending on this assumption
- [ ] Check display includes:
  - [ ] Argument preview text
  - [ ] Confidence scores
  - [ ] Average confidence calculation
- [ ] Verify "Retraction impact" warning: "Retracting would affect X arguments"

**Test Case 4.7: Dependency graph updates after retraction**
- [ ] Note the number of dependent arguments (e.g., 5)
- [ ] Retract the assumption
- [ ] Navigate to one of the dependent arguments
- [ ] Verify argument now flagged as "unsupported" or confidence reduced
- [ ] Check that author is notified (if notifications enabled)

**Feature: Create Assumption Form**

**Test Case 4.8: Create new assumption**
- [ ] Click "New Assumption" button
- [ ] Fill form:
  - [ ] Content: "All participants are familiar with basic statistics"
  - [ ] Role: Select "EPISTEMIC"
  - [ ] Description: "Required for interpreting confidence values"
- [ ] Submit form
- [ ] Verify new assumption appears with PROPOSED status
- [ ] Verify you can now accept or challenge it

---

### Section 5: Hom-Set Analysis (3.5)

**Feature: Hom-Set Confidence Panel**

**Test Case 5.1: Panel displays aggregate metrics**
- [ ] Open an argument detail page
- [ ] Navigate to "Categorical Analysis" tab (or similar)
- [ ] Verify Hom-Set Confidence Panel displays:
  - [ ] Aggregate confidence (e.g., 0.73)
  - [ ] Aggregate uncertainty (e.g., 0.12)
  - [ ] Edge count (e.g., 5 morphisms)
  - [ ] Min confidence (lowest edge)
  - [ ] Max confidence (highest edge)

**Test Case 5.2: Switch between incoming and outgoing hom-sets**
- [ ] Click "Incoming" button (edges pointing to this argument)
- [ ] Note aggregate confidence
- [ ] Click "Outgoing" button (edges from this argument)
- [ ] Note aggregate confidence
- [ ] Verify different values (unless argument is symmetric)

**Test Case 5.3: Filter by edge type**
- [ ] Select "SUPPORT" from edge type filter
- [ ] Verify only support edges shown in morphism list
- [ ] Verify aggregate confidence recalculated for support edges only
- [ ] Test with "REBUT", "UNDERCUT", "ALL"

**Feature: Morphism Card**

**Test Case 5.4: Morphism card displays edge info**
- [ ] In Hom-Set Confidence Panel, view morphism list
- [ ] Verify each morphism card shows:
  - [ ] Edge type icon (Shield for SUPPORT, Slash for REBUT, etc.)
  - [ ] Color-coding (green/red/orange/blue)
  - [ ] Source and target argument IDs/titles
  - [ ] Confidence badge with color thresholds
  - [ ] Direction indicator (arrow)

**Test Case 5.5: Click morphism card to navigate**
- [ ] Click a morphism card
- [ ] Verify navigation to source or target argument
- [ ] Return and test navigation from multiple morphism cards

**Feature: Hom-Set Comparison Chart**

**Test Case 5.6: Chart compares multiple arguments**
- [ ] Navigate to deliberation overview
- [ ] Find "Hom-Set Comparison" section
- [ ] Verify bar chart displays with:
  - [ ] One bar per argument
  - [ ] Bars sorted by aggregate confidence (highest to lowest)
  - [ ] Average confidence reference line
  - [ ] "Above average" badges on qualifying arguments
  - [ ] Edge counts displayed for each bar

**Test Case 5.7: Click bar to navigate**
- [ ] Click on a bar in the hom-set comparison chart
- [ ] Verify navigation to that argument's detail page
- [ ] Verify Hom-Set Confidence Panel auto-loads

**Test Case 5.8: Toggle incoming vs. outgoing in comparison**
- [ ] Switch comparison chart from "Incoming" to "Outgoing"
- [ ] Verify bars re-sort based on outgoing hom-set confidence
- [ ] Verify edge counts update to outgoing edges

---

### Section 6: Integration Tests

**Cross-Feature Test 6.1: Decay affects hom-set confidence**
- [ ] Find an argument with multiple incoming support edges
- [ ] Note current aggregate hom-set confidence (e.g., 0.75)
- [ ] Manually update `lastUpdatedAt` for one supporting argument to 120 days ago (via DB or admin tool)
- [ ] Refresh page
- [ ] Verify aggregate hom-set confidence decreased (supporting edge decayed)

**Cross-Feature Test 6.2: Assumptions affect dialogue state**
- [ ] Create argument that references an assumption
- [ ] Verify dialogue state badge shows complete (all attacks answered)
- [ ] Challenge the assumption
- [ ] Verify argument's confidence reduces
- [ ] Check if dialogue state affected (may not directly impact dialogue state, but confidence propagates)

**Cross-Feature Test 6.3: DS mode with temporal decay**
- [ ] Enable DS mode
- [ ] View a stale argument (> 90 days old)
- [ ] Verify DS interval displays with reduced belief due to decay
- [ ] Check uncertainty increases slightly (older arguments = more epistemic uncertainty)

**Cross-Feature Test 6.4: Hom-set with assumptions**
- [ ] View hom-set for argument depending on a RETRACTED assumption
- [ ] Verify aggregate confidence reduced
- [ ] Accept the assumption
- [ ] Verify aggregate confidence increases

---

## Error Handling Tests

**Error Test 1: API failure gracefully handled**
- [ ] Disconnect network or block API endpoint
- [ ] Try loading Hom-Set Confidence Panel
- [ ] Verify error message displays (not blank screen or crash)
- [ ] Reconnect network
- [ ] Verify retry or reload works

**Error Test 2: Empty state displays**
- [ ] Navigate to argument with no attacks (dialogue state badge should show "0/0")
- [ ] Verify appropriate "No attacks" message
- [ ] View hom-set for argument with no edges
- [ ] Verify "No morphisms" message

**Error Test 3: Invalid data handling**
- [ ] Manually inject invalid confidence value (e.g., 1.5 or -0.2) via DB
- [ ] View argument
- [ ] Verify app doesn't crash, displays clamped value or error

---

## Performance Tests

**Performance Test 1: Large deliberation load time**
- [ ] Create or navigate to deliberation with 100+ arguments
- [ ] Measure load time for argument list page
- [ ] Verify < 2 seconds for initial render
- [ ] Check for any scroll lag or jank

**Performance Test 2: Hom-set calculation speed**
- [ ] View hom-set for argument with 50+ incoming edges
- [ ] Measure time to calculate aggregate confidence
- [ ] Verify < 1 second to display results

**Performance Test 3: DS interval chart rendering**
- [ ] Enable DS mode
- [ ] Rapidly navigate between arguments
- [ ] Verify charts render smoothly without flicker
- [ ] Check for any memory leaks (monitor browser memory usage over time)

---

## Accessibility Tests

**A11y Test 1: Keyboard navigation**
- [ ] Tab through dialogue state badges
- [ ] Verify focus indicators visible
- [ ] Press Enter/Space to activate buttons
- [ ] Verify all interactive elements reachable via keyboard

**A11y Test 2: Screen reader compatibility**
- [ ] Enable VoiceOver (Mac) or NVDA (Windows)
- [ ] Navigate to assumptions panel
- [ ] Verify status badges announced correctly
- [ ] Test form inputs for proper labels

**A11y Test 3: Color contrast**
- [ ] Use browser contrast checker or axe DevTools
- [ ] Verify badge colors meet WCAG AA standards
- [ ] Check DS interval chart colors (green/yellow/red) have sufficient contrast

---

## Browser Compatibility

**Test on Chrome:**
- [ ] Complete at least Test Cases 1.1, 2.1, 3.1, 4.1, 5.1

**Test on Firefox:**
- [ ] Complete at least Test Cases 1.1, 2.1, 3.1, 4.1, 5.1

**Test on Safari (if Mac):**
- [ ] Complete at least Test Cases 1.1, 2.1, 3.1, 4.1, 5.1

**Test on Mobile (Chrome/Safari):**
- [ ] Navigate to deliberation on mobile device
- [ ] Verify UI responsive (badges, panels fit screen)
- [ ] Test touch interactions (tap badges, swipe panels)

---

## Regression Tests

**Regression Test 1: Phase 2 features still work**
- [ ] Confidence propagation API (`/api/arguments/[id]/propagate-confidence`) still functions
- [ ] Argumentation scheme selection still works
- [ ] Critical questions modal still opens
- [ ] Assumption CRUD operations still work

**Regression Test 2: Existing argument cards render**
- [ ] ArgumentCard component displays correctly
- [ ] ArgumentCardV2 displays correctly
- [ ] No layout breakage from new badges

---

## Success Criteria

Phase 3 testing is successful if:

1. **All Test Cases Pass**: 90%+ of test cases pass without critical errors
2. **No Critical Bugs**: No crashes, data loss, or security issues
3. **Performance Acceptable**: Load times < 2s, interactions < 1s response
4. **Accessibility Compliant**: Keyboard navigation works, WCAG AA color contrast met
5. **Cross-Browser Compatible**: Works in Chrome, Firefox, Safari (latest versions)
6. **User Feedback Positive**: Users find features intuitive and helpful

---

## Bug Reporting Template

When you encounter an issue, report it using this format:

```markdown
**Bug Title**: [Short description]

**Severity**: Critical / High / Medium / Low

**Test Case**: [Which test case from this document]

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happened]

**Screenshots/Logs**:
[Attach if applicable]

**Browser**: Chrome 118 / Firefox 119 / etc.

**Environment**: Local dev server / Staging / Production
```

---

## Testing Schedule

**Day 1: Dialogue Tracking (Section 1)**
- Complete all Test Cases 1.1-1.6
- Report any bugs

**Day 2: Temporal Decay (Section 2)**
- Complete all Test Cases 2.1-2.5
- Report any bugs

**Day 3: Dempster-Shafer (Section 3)**
- Complete all Test Cases 3.1-3.5
- Report any bugs

**Day 4: Assumptions (Section 4)**
- Complete all Test Cases 4.1-4.8
- Report any bugs

**Day 5: Hom-Set Analysis (Section 5)**
- Complete all Test Cases 5.1-5.8
- Report any bugs

**Day 6: Integration, Error, Performance, A11y (Section 6 + Error/Perf/A11y)**
- Complete cross-feature tests
- Run error handling tests
- Run performance tests
- Run accessibility tests

**Day 7: Browser Compat & Regression (Browser + Regression)**
- Test on multiple browsers
- Run regression tests
- Compile final bug report

---

## Next Steps After Testing

1. **Triage bugs**: Categorize by severity (Critical → High → Medium → Low)
2. **Fix critical bugs**: Address crashes, data loss, security issues immediately
3. **Address high-priority bugs**: Fix major UX issues, broken features
4. **Document known issues**: For medium/low bugs not fixed immediately
5. **Prepare Phase 4**: Begin planning next phase based on testing insights

---

**Ready to Start Testing?**

1. Ensure dev server running: `yarn dev`
2. Open browser to `http://localhost:3000`
3. Follow test cases section by section
4. Report bugs using template above
5. Enjoy exploring the new Phase 3 features! 🚀
