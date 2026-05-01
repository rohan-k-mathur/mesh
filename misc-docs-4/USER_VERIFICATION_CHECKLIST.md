# User Verification Checklist: CQ Preview & Provenance Features

**Date**: November 1, 2025  
**Status**: Ready for User Testing  
**Features**: CQ Preview Panel | Provenance Badges | Scheme Hierarchy

---

## Prerequisites

Before testing, ensure:
- [ ] Development server is running (`npm run dev`)
- [ ] You have access to a deliberation with arguments
- [ ] Database has been seeded with comprehensive schemes
- [ ] You're logged in as a user who can create arguments

---

## Part 1: CQ Preview Panel Testing

### Test Scenario 1: Preview with Popular Practice (5 CQs)

**Steps**:
1. Navigate to any deliberation
2. Open the argument composer (AIFArgumentWithSchemeComposer)
3. Select **"Argument from Popular Practice"** from scheme dropdown

**Expected Results**:
- [ ] **Amber-colored preview panel appears** below scheme selector
- [ ] Panel has **question mark icon** in amber badge
- [ ] Panel shows **header**: "Critical Questions Preview"
- [ ] Panel shows **description text**: "This scheme comes with 5 critical question(s)..."
- [ ] Panel displays **exactly 4 CQs** in numbered list (1, 2, 3, 4)
- [ ] Each CQ shows:
  - [ ] Numbered badge (amber background)
  - [ ] Question text
  - [ ] Attack type pill (e.g., "REBUTS", "UNDERCUTS")
  - [ ] Target scope label (e.g., "premise", "inference", "conclusion")
- [ ] Panel shows **overflow indicator**: "...+ 1 more question"
- [ ] Panel appears **BEFORE** "Create argument" button
- [ ] Panel **disappears** after clicking "Create argument"

**Visual Check**:
- [ ] Panel has rounded corners (rounded-xl)
- [ ] Panel has amber border (border-2 border-amber-200)
- [ ] Panel has gradient background (from-amber-50 to-amber-100/50)
- [ ] White semi-transparent cards for each CQ (bg-white/70)

---

### Test Scenario 2: Preview with Popular Opinion (5 CQs, parent scheme)

**Steps**:
1. Open argument composer
2. Select **"Argument from Popular Opinion"** from dropdown

**Expected Results**:
- [ ] Amber preview panel appears
- [ ] Shows **4 CQs** (numbered 1-4)
- [ ] Shows **"...+ 1 more question"** overflow
- [ ] CQ keys should include:
  - [ ] "acceptance_evidence?"
  - [ ] "alternative_opinions?"
  - [ ] "basis_for_acceptance?"
  - [ ] "domain_appropriate_opinion?"

---

### Test Scenario 3: Preview with Definition to Classification (6 CQs)

**Steps**:
1. Open argument composer
2. Select **"Argument from Definition to Verbal Classification"** from dropdown

**Expected Results**:
- [ ] Preview panel appears
- [ ] Shows **4 CQs** (first 4 of 6)
- [ ] Shows **"...+ 2 more questions"** (6 total - 4 shown = 2 remaining)

---

### Test Scenario 4: No Preview for Scheme-less Arguments

**Steps**:
1. Open argument composer
2. Do NOT select any scheme (or select a scheme with no CQs)

**Expected Results**:
- [ ] **No amber preview panel** appears
- [ ] Composer shows normal fields only

---

## Part 2: Provenance Badge Testing

### Test Scenario 5: Popular Practice Provenance (5 own + 5 inherited)

**Steps**:
1. Create an argument using **"Argument from Popular Practice"** scheme
2. Fill in premises and conclusion
3. Click "Create argument"
4. In the argument card, click **"Critical Questions"** button (shows badge like "5/10")
5. Modal opens: Click on any CQ to expand it

**Expected Results in Modal**:

**A. Provenance Summary Header (emerald section)**:
- [ ] **Emerald-colored banner** appears after scheme info, before CQ list
- [ ] Banner has **Sparkles icon** (emerald-700)
- [ ] Banner shows header: **"CQ INHERITANCE"**
- [ ] Banner shows count summary: **"5 own + 5 inherited = 10 total"**
- [ ] Banner shows inheritance path: **"Inherited from: Argument from Popular Opinion"**

**B. Per-CQ Provenance Badges**:
- [ ] **First 5 CQs** have NO provenance badge (own CQs):
  - [ ] domain_appropriate_practice?
  - [ ] ethical_violation?
  - [ ] majority_wrong?
  - [ ] practice_evidence?
  - [ ] practitioners_representative?
- [ ] **Last 5 CQs** have **emerald badges** (inherited CQs):
  - [ ] acceptance_evidence? → **"Inherited from Argument from Popular Opinion"**
  - [ ] alternative_opinions? → **"Inherited from Argument from Popular Opinion"**
  - [ ] basis_for_acceptance? → **"Inherited from Argument from Popular Opinion"**
  - [ ] domain_appropriate_opinion? → **"Inherited from Argument from Popular Opinion"**
  - [ ] group_representative? → **"Inherited from Argument from Popular Opinion"**

**Visual Check for Badges**:
- [ ] Emerald background (bg-emerald-100)
- [ ] Emerald text (text-emerald-700)
- [ ] Emerald border (border-emerald-300)
- [ ] Sparkles icon (w-3 h-3)
- [ ] Text: "Inherited from {Parent Scheme Name}"
- [ ] Tooltip on hover shows full scheme info

**C. Progress Counter**:
- [ ] Trigger button shows **"0/10"** (if no CQs answered)
- [ ] Number updates as you answer CQs (e.g., "3/10", "10/10")

---

### Test Scenario 6: Popular Opinion (Parent Scheme, 5 own + 0 inherited)

**Steps**:
1. Create argument using **"Argument from Popular Opinion"**
2. Open CQ modal

**Expected Results**:
- [ ] **No emerald provenance summary** header appears
- [ ] CQ list shows **5 CQs total**
- [ ] **No emerald badges** on any CQ (all are own CQs)
- [ ] Progress shows "0/5" or "X/5" depending on answered state
- [ ] Modal still shows scheme info (indigo section)

---

### Test Scenario 7: Definition to Classification (6 own + 5 inherited = 11 total)

**Steps**:
1. Create argument using **"Argument from Definition to Verbal Classification"**
2. Open CQ modal

**Expected Results**:

**A. Provenance Summary**:
- [ ] Emerald banner appears
- [ ] Count: **"6 own + 5 inherited = 11 total"**
- [ ] Path: **"Inherited from: Argument from Verbal Classification"**

**B. CQ List**:
- [ ] **First 6 CQs**: No provenance badge (own)
- [ ] **Last 5 CQs**: Emerald badge "Inherited from Argument from Verbal Classification"
- [ ] Total **11 CQs** in list
- [ ] Progress: "0/11" → "X/11"

---

### Test Scenario 8: Multi-Level Inheritance (Slippery Slope)

**Steps**:
1. Create argument using **"Slippery Slope"** scheme (if available)
2. Open CQ modal

**Expected Results**:
- [ ] Provenance summary shows **multi-level path**:
  - Example: "Inherited from: Argument from Negative Consequences → Practical Reasoning"
- [ ] CQs inherited from **different levels** have different source badges
- [ ] All inherited CQs clearly labeled with source scheme name

---

## Part 3: Scheme Picker Hierarchy Testing

### Test Scenario 9: Hierarchical Dropdown Display

**Steps**:
1. Open argument composer
2. Click on scheme dropdown (SchemePickerWithHierarchy)

**Expected Results**:

**A. Structure**:
- [ ] Dropdown shows **hierarchical tree** (not flat list)
- [ ] **Cluster sections** with headers (e.g., "Ethos", "Reasoning", "Practical")
- [ ] Each cluster is **expandable/collapsible** (ChevronDown icon)

**B. Scheme Display**:
- [ ] **Parent schemes** appear first (no indentation or minimal)
- [ ] **Child schemes** appear indented below parents
- [ ] Each scheme shows:
  - [ ] Scheme name
  - [ ] CQ count badge (e.g., "5 CQs" or "5+5")
  - [ ] Badge color varies: slate for own only, indigo for inherited

**C. Specific Schemes to Verify**:
- [ ] **Popular Opinion** (parent):
  - Badge: "5 CQs"
  - No indentation
- [ ] **Popular Practice** (child):
  - Badge: "5+5" or "10 CQs (5+5)"
  - Indented below Popular Opinion
- [ ] **Verbal Classification** (parent):
  - Badge: "5 CQs"
- [ ] **Definition to Classification** (child):
  - Badge: "6+5" or "11 CQs (6+5)"
  - Indented below Verbal Classification

**D. Footer Info**:
- [ ] When hovering over a scheme, footer shows:
  - [ ] Scheme name
  - [ ] Parent info (if child)
  - [ ] Total CQ count

---

## Part 4: Edge Cases & Error Handling

### Test Scenario 10: Scheme with No CQs

**Steps**:
1. Open argument composer
2. Select a scheme that has 0 CQs (if any exist)

**Expected Results**:
- [ ] **No amber preview panel** appears
- [ ] Modal shows "No critical questions" empty state
- [ ] No provenance summary

---

### Test Scenario 11: Network Error Handling

**Steps**:
1. Create argument with Popular Practice
2. Open DevTools → Network tab → Block `/api/arguments/[id]/cqs-with-provenance`
3. Open CQ modal

**Expected Results**:
- [ ] Modal still opens (doesn't crash)
- [ ] CQs display (may not show provenance badges)
- [ ] No provenance summary header
- [ ] Console shows error (check for graceful fallback)

---

### Test Scenario 12: Modal Performance with 11 CQs

**Steps**:
1. Create argument with Definition to Classification (11 CQs)
2. Open CQ modal

**Expected Results**:
- [ ] Modal opens **quickly** (< 500ms)
- [ ] All 11 CQs render without lag
- [ ] Scrolling is smooth
- [ ] Provenance badges load without flicker

---

## Part 5: Visual Consistency

### Color Theme Verification

**Amber Theme (Preview Panel)**:
- [ ] Border: border-amber-200
- [ ] Background: bg-gradient-to-br from-amber-50 to-amber-100/50
- [ ] Icon: text-amber-700
- [ ] Header text: text-amber-900 (font-bold)
- [ ] Description: text-amber-800 (text-xs)
- [ ] Attack type pills: bg-amber-100 text-amber-700

**Emerald Theme (Provenance)**:
- [ ] Border: border-emerald-200 (summary header) or border-emerald-300 (badges)
- [ ] Background: bg-gradient-to-br from-emerald-50 to-emerald-100/50 (header)
- [ ] Badge background: bg-emerald-100
- [ ] Text: text-emerald-700 (badges) or text-emerald-900 (header)
- [ ] Icon: text-emerald-700 (Sparkles)

**Indigo Theme (Scheme Info)**:
- [ ] Border: border-indigo-200
- [ ] Background: bg-white
- [ ] Icon background: bg-indigo-100
- [ ] Text: text-indigo-700 (uppercase), text-slate-900 (scheme name)

---

## Part 6: Mobile/Responsive Testing

### Test Scenario 13: Mobile View (Optional)

**Steps**:
1. Open DevTools → Responsive mode (375px width)
2. Test all scenarios above

**Expected Results**:
- [ ] Preview panel wraps correctly
- [ ] CQ list is scrollable
- [ ] Provenance badges wrap on small screens
- [ ] Modal doesn't overflow viewport
- [ ] Touch targets are adequate (44px minimum)

---

## Part 7: Accessibility

### Test Scenario 14: Keyboard Navigation

**Steps**:
1. Use **Tab** key to navigate through argument composer
2. Use **Enter** to open scheme dropdown
3. Use **Arrow keys** to navigate schemes
4. Use **Enter** to select scheme

**Expected Results**:
- [ ] All interactive elements are focusable
- [ ] Focus indicators are visible
- [ ] Dropdown opens/closes with keyboard
- [ ] Scheme selection works with Enter key

---

### Test Scenario 15: Screen Reader (Optional)

**Steps**:
1. Enable VoiceOver (Mac) or NVDA (Windows)
2. Navigate through composer and modal

**Expected Results**:
- [ ] Preview panel content is announced
- [ ] CQ text is readable
- [ ] Provenance badges are announced
- [ ] Button labels are descriptive

---

## Summary Checklist

### Core Features ✅
- [ ] CQ Preview Panel displays correctly (amber theme, first 4 CQs, overflow)
- [ ] Provenance Summary Header shows inheritance counts
- [ ] Provenance Badges label inherited CQs correctly
- [ ] Inheritance Path displays parent chain
- [ ] Hierarchical Scheme Picker shows tree structure
- [ ] CQ counts match (own + inherited = total)

### Visual Quality ✅
- [ ] Color themes are distinct (amber vs emerald vs indigo)
- [ ] Gradients and borders render smoothly
- [ ] Icons (Sparkles, Question Mark, Target) display correctly
- [ ] Typography is readable (sizes, weights, colors)

### Performance ✅
- [ ] Preview panel loads instantly on scheme selection
- [ ] Modal opens within 500ms
- [ ] Provenance API responds within 200ms
- [ ] No UI flickering or layout shifts

### Edge Cases ✅
- [ ] Parent schemes (no inherited CQs) display correctly
- [ ] Child schemes show provenance badges
- [ ] Multi-level inheritance displays full path
- [ ] Empty states handle gracefully
- [ ] Network errors don't crash UI

---

## Troubleshooting Guide

### Issue: Preview panel doesn't appear
**Check**:
- Scheme has CQs (`scheme.cqs.length > 0`)
- Argument not yet created (`!argumentId`)
- SchemePickerWithHierarchy is passing `cqs` array in scheme data

### Issue: No provenance badges in modal
**Check**:
- Modal is calling `getArgumentCQsWithProvenance()` (not old API)
- Argument has ArgumentSchemeInstance record
- Scheme has `inheritCQs: true` and `parentSchemeId` set
- Network request succeeds (check DevTools Network tab)

### Issue: Wrong CQ counts
**Check**:
- CriticalQuestion table has records (run migration script if not)
- Scheme's own CQs exist in database
- Parent scheme has CQs
- No duplicate CQ keys

### Issue: Modal shows "0/0"
**Check**:
- ArgumentSchemeInstance was created (check POST /api/arguments)
- CQStatus records were seeded after argument creation
- Database has CriticalQuestion records for the scheme

---

## Success Criteria

All scenarios pass when:

1. **Preview Panel**: ✅ Amber panel appears, shows first 4 CQs, overflow indicator correct
2. **Provenance Summary**: ✅ Emerald header shows "X own + Y inherited = Z total"
3. **Provenance Badges**: ✅ Inherited CQs have emerald "Inherited from X" badges
4. **Inheritance Path**: ✅ Full parent chain displays correctly
5. **Scheme Picker**: ✅ Hierarchical tree with CQ count badges (e.g., "5+5")
6. **Parent Schemes**: ✅ No provenance summary, no badges (all own CQs)
7. **Multi-Level**: ✅ 3+ level inheritance works with full path
8. **Performance**: ✅ Modal opens < 500ms, API responds < 200ms
9. **Visual Consistency**: ✅ Amber/emerald/indigo themes distinct and polished
10. **No Errors**: ✅ Console clean, no TypeScript errors, no crashes

---

## Next Steps After Verification

Once all checkboxes are complete:

1. **Document Screenshots**: Capture preview panel and provenance modal for docs
2. **User Feedback**: Share with team, collect usability feedback
3. **Performance Profiling**: Measure API response times under load
4. **Analytics Setup**: Track usage of preview panel and provenance features
5. **A/B Testing** (optional): Test different color schemes or badge formats
6. **Production Deploy**: Merge to main, deploy with confidence

---

**Last Updated**: November 1, 2025  
**Tester**: _________________  
**Date Completed**: _________________  
**Overall Status**: ⬜ Pass | ⬜ Fail | ⬜ Needs Revision
