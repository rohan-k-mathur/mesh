# Week 1 Day 1 - Visual Regression Testing Checklist

**Date**: November 11, 2025  
**Changes**: Extracted SectionCard, ChipBar, StickyHeader from DeepDivePanelV2.tsx  
**Files Modified**: `components/deepdive/DeepDivePanelV2.tsx` (2,128 → 1,926 LOC)  
**Files Created**: 
- `components/deepdive/shared/SectionCard.tsx` (100 LOC)
- `components/deepdive/shared/ChipBar.tsx` (25 LOC)
- `components/deepdive/shared/StickyHeader.tsx` (40 LOC)
- `components/deepdive/shared/types.ts` (50 LOC)
- `components/deepdive/shared/index.ts` (barrel export)
- `lib/features/flags.ts` (130 LOC)

---

## Pre-Testing Setup

### 1. Start Dev Server
```bash
yarn dev
# or
npm run dev
```

Wait for compilation to complete. Server should be running on `http://localhost:3000`

### 2. Open Test Deliberation
Navigate to any deliberation with active debate, e.g.:
```
http://localhost:3000/room/[DELIBERATION_ID]
```

Use a test deliberation with:
- Multiple arguments
- Active dialogue
- Various tab content (Debate, Arguments, Dialogue, ASPIC, etc.)

---

## Visual Regression Tests

### ✅ Test 1: SectionCard Rendering

**All 9 tabs use SectionCard extensively. Check each:**

#### Debate Tab
- [ ] Debate cards render correctly
- [ ] Title, subtitle, icon visible
- [ ] Hover effect shows radial gradient
- [ ] Empty state shows dashed border message
- [ ] Loading skeleton shows 3 animated bars

#### Arguments Tab
- [ ] Argument list cards render
- [ ] SectionCard action buttons work (filter, sort)
- [ ] Footer metadata visible
- [ ] Tone variants work (default, info, success, warn, danger)
- [ ] Dense mode renders compactly

#### Dialogue Tab
- [ ] Dialogue moves render in SectionCard
- [ ] Sticky header stays at top when scrolling
- [ ] Icons and badges visible

#### Ludics Tab
- [ ] Compilation trace cards render
- [ ] Behaviour inspector cards render

#### Admin Tab
- [ ] Settings panels render
- [ ] Works list renders

#### Sources Tab
- [ ] Source cards render
- [ ] Citation previews visible

#### Thesis Tab
- [ ] Thesis cards render correctly
- [ ] Collapsible sections work

#### ASPIC Tab
- [ ] Graph panel renders
- [ ] Extension cards render
- [ ] Rationality analysis renders

#### Analytics Tab
- [ ] Category theory cards render
- [ ] HomSets comparison charts render
- [ ] Topology widgets render

---

### ✅ Test 2: ChipBar Rendering

**ChipBar appears in multiple locations:**

- [ ] WorksCounts component (Admin tab)
- [ ] Metadata displays (counts, stats)
- [ ] Configuration controls
- [ ] Flex wrap works (chips don't overflow)
- [ ] Border and background styling intact

**Test locations**:
1. Admin tab - Works section (DN/IH/TC/OP counts)
2. Arguments tab - Filter/sort controls
3. Analytics tab - Metric displays

---

### ✅ Test 3: StickyHeader Behavior

**StickyHeader is used in floating sheets and sections:**

- [ ] Sheet headers stick to top when scrolling
- [ ] Backdrop blur effect visible when scrolled
- [ ] Transition animations smooth (200ms)
- [ ] Z-index correct (appears above content, below modals)

**Test locations**:
1. Left floating sheet (Arguments/Claims explorer)
2. Right floating sheet (Actions HUD)
3. Terms sheet (Glossary)

**Scroll test**:
1. Open a floating sheet with long content
2. Scroll down
3. Verify header remains visible at top
4. Verify backdrop blur activates
5. Scroll back to top
6. Verify header returns to normal state

---

### ✅ Test 4: Interaction Tests

#### Hover Effects
- [ ] SectionCard headers show radial gradient on mouse move
- [ ] Gradient follows cursor position (--mx, --my CSS vars)
- [ ] Ring opacity transitions on hover/focus

#### Click Interactions
- [ ] Action buttons in SectionCard headers work
- [ ] Collapsible sections expand/collapse
- [ ] Links in card footers navigate correctly

#### Keyboard Navigation
- [ ] Tab key navigates through cards
- [ ] Focus ring visible on focused elements
- [ ] Enter/Space activates buttons

---

### ✅ Test 5: Loading & Empty States

#### Loading States
- [ ] SectionCard with `isLoading={true}` shows skeleton
- [ ] 3 pulse bars animate correctly
- [ ] Correct colors (slate-200/70 light, slate-700/60 dark)

#### Empty States
- [ ] SectionCard with `emptyText="..."` shows message
- [ ] Dashed border visible
- [ ] Centered text styling correct

#### Busy States
- [ ] SectionCard with `busy={true}` shows top gradient bar
- [ ] Animated gradient moves continuously
- [ ] Colors correct (indigo → fuchsia → sky)

**Test steps**:
1. Clear all arguments from a deliberation → check empty state
2. Trigger loading (refresh with slow network) → check skeleton
3. Perform async action → check busy indicator

---

### ✅ Test 6: Tone Variants

**Test all 5 tone variants:**

- [ ] `tone="default"` - Slate ring and no stripe
- [ ] `tone="info"` - Sky ring and stripe
- [ ] `tone="success"` - Emerald ring and stripe
- [ ] `tone="warn"` - Amber ring and stripe
- [ ] `tone="danger"` - Rose ring and stripe

**Test method**: Create test cards with each tone in different tabs

---

### ✅ Test 7: Dark Mode

- [ ] All cards render correctly in dark mode
- [ ] Tone variant colors appropriate for dark background
- [ ] Backdrop blur effects visible
- [ ] Text contrast sufficient
- [ ] Borders visible but subtle

**Test steps**:
1. Toggle system dark mode
2. Revisit all tabs
3. Check readability and visual consistency

---

### ✅ Test 8: Mobile Responsive

- [ ] SectionCard responsive on small screens
- [ ] ChipBar wraps correctly
- [ ] StickyHeader doesn't overflow
- [ ] Touch interactions work (no hover artifacts)

**Test viewports**:
- 375px (iPhone SE)
- 768px (iPad)
- 1024px (Desktop)

---

### ✅ Test 9: Performance

#### Render Performance
- [ ] No jank when scrolling through long lists
- [ ] Hover effects smooth (no dropped frames)
- [ ] Tab switching instant

#### Bundle Size
```bash
npm run build
# Check .next/static/chunks for size
# Expect: No size increase (should be slightly smaller)
```

#### Memory
- [ ] No memory leaks with StickyHeader (event listeners cleaned up)
- [ ] No excessive re-renders

---

## Regression Checklist

**These should NOT have changed:**

- [ ] Debate participation still works
- [ ] Argument voting/replies functional
- [ ] Dialogue moves execute correctly
- [ ] ASPIC graph interactions work
- [ ] Admin settings save correctly
- [ ] Real-time updates still work (SWR mutations)
- [ ] Floating sheets open/close correctly
- [ ] Sheet toggle buttons work
- [ ] Sheet persistence (localStorage) works

---

## Known Issues to Ignore

**Pre-existing TypeScript errors** (not introduced by our changes):
- Line 1554-1557: `Property 'nodeType' does not exist on type 'AifNodeWithDialogue'`

**Pre-existing ESLint warnings**:
- Line 583: useEffect missing dependency 'compute'
- Line 639: targetRef conditional in useMemo

---

## Rollback Procedure (If Issues Found)

If any critical visual or functional regressions:

```bash
# 1. Revert the import change
git diff components/deepdive/DeepDivePanelV2.tsx

# 2. If needed, fully revert
git checkout HEAD -- components/deepdive/DeepDivePanelV2.tsx

# 3. Remove shared directory
rm -rf components/deepdive/shared

# 4. Rebuild
npm run build

# 5. Restart dev server
yarn dev
```

---

## Success Criteria

**All checkboxes above must be checked before proceeding to staging deployment.**

**Expected outcome**: Zero visual or functional changes. Extraction should be 100% invisible to users.

---

## Actual Results

### Testing Date: _______________
### Tester: _______________

**Summary**: 
- Total tests: 9 categories (~50 individual checks)
- Passed: _____ / _____
- Failed: _____ / _____
- Regressions found: _____

**Critical Issues** (block deployment):
- [ ] None found

**Minor Issues** (fix before production):
- [ ] None found

**Notes**:
_[Add any observations, edge cases discovered, or recommendations]_

---

## Next Steps After Testing

1. ✅ If all tests pass → Mark Day 1 complete
2. 📝 Document any issues found
3. 🔧 Fix regressions (if any)
4. 📋 Update WEEK1_DAY1_PROGRESS_REPORT.md with results
5. 🚀 Prepare for staging deployment (Day 2-3)
6. 📊 Begin Week 2 planning (NestedTabs component)

---

## Additional Testing Tools

### Browser DevTools Checks
```javascript
// Console: Verify no React warnings
// Network: Check for extra requests
// Performance: Profile render times
// Memory: Check for leaks
```

### Accessibility
```bash
# Run Lighthouse accessibility audit
npm run lighthouse
```

### Visual Regression (Optional)
```bash
# If Percy or similar tool available
npm run visual-test
```
