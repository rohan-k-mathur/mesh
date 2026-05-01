# Week 1 Day 2 - Visual Testing Guide

**Date**: November 11, 2025  
**Goal**: Verify extracted components (SectionCard, ChipBar, StickyHeader) work identically to inline versions  
**Status**: 🔄 IN PROGRESS

---

## Quick Start

1. **Dev server**: ✅ Running on `http://localhost:3000`
2. **Login**: Navigate to a deliberation room
3. **Testing approach**: Visual inspection of all tabs

---

## Test Sequence (Priority Order)

### 🎯 Test 1: Arguments Tab (HIGH PRIORITY)
**Why first**: Most SectionCard usage, core functionality

**Test URL**: `/room/[DELIBERATION_ID]` → Arguments tab

**What to check**:
- [ ] Argument cards render with proper styling
- [ ] Card headers show title, subtitle, icon
- [ ] Hover over card header → radial gradient follows mouse
- [ ] Action buttons (reply, vote) visible and clickable
- [ ] Footer metadata visible
- [ ] Empty state: "No arguments yet" with dashed border (if empty)
- [ ] Loading state: 3 pulse bars (if slow network)

**Expected behavior**: Should look identical to before extraction

**Screenshot comparison**:
- Before: (reference from yesterday)
- After: (current state)

---

### 💬 Test 2: Debate Tab
**Test URL**: `/room/[DELIBERATION_ID]` → Debate tab

**What to check**:
- [ ] Debate section cards render
- [ ] Viewpoint cards with tone variants
- [ ] Selection metrics display
- [ ] RepresentativeViewpoints component renders
- [ ] Collapsible sections work

---

### 🎮 Test 3: Dialogue Tab
**Test URL**: `/room/[DELIBERATION_ID]` → Dialogue tab

**What to check**:
- [ ] Dialogue moves render in cards
- [ ] CommandCard actions visible
- [ ] CQ context panels render
- [ ] DialogueInspector renders
- [ ] Move history scrollable

---

### 🎲 Test 4: Ludics Tab
**Test URL**: `/room/[DELIBERATION_ID]` → Ludics tab

**What to check**:
- [ ] Compilation trace cards render
- [ ] BehaviourInspectorCard renders
- [ ] Nested tabs work (Compilation, Behaviours)
- [ ] Proponent/Opponent IDs visible in ChipBar

---

### ⚙️ Test 5: Admin Tab
**Test URL**: `/room/[DELIBERATION_ID]` → Admin tab

**What to check**:
- [ ] Settings panels render
- [ ] WorksList renders
- [ ] **ChipBar test**: Works counts (DN/IH/TC/OP) display correctly
- [ ] WorksCounts component shows badges
- [ ] DeliberationSettingsPanel renders

---

### 📚 Test 6: Sources Tab
**Test URL**: `/room/[DELIBERATION_ID]` → Sources tab

**What to check**:
- [ ] EvidenceList renders
- [ ] Source cards render
- [ ] Citation previews visible
- [ ] Links clickable

---

### 📝 Test 7: Thesis Tab
**Test URL**: `/room/[DELIBERATION_ID]` → Thesis tab

**What to check**:
- [ ] ThesisRenderer shows active thesis
- [ ] ThesisListView shows all theses
- [ ] ThesisComposer renders
- [ ] Collapsible sections work

---

### 🔬 Test 8: ASPIC Tab
**Test URL**: `/room/[DELIBERATION_ID]` → ASPIC tab

**What to check**:
- [ ] Nested tabs work (Graph, Extension, Rationality)
- [ ] AspicTheoryPanel renders
- [ ] Graph visualization works
- [ ] Extension sets render
- [ ] Rationality analysis renders

---

### 📊 Test 9: Analytics Tab
**Test URL**: `/room/[DELIBERATION_ID]` → Analytics tab

**What to check**:
- [ ] Nested tabs work (Categorical, HomSets, Topology)
- [ ] HomSetComparisonChart renders
- [ ] SchemeBreakdown renders
- [ ] TopologyWidget renders
- [ ] CegMiniMap renders

---

## 🎨 Cross-Tab Tests

### Hover Effects
**All tabs with SectionCard headers**:
- [ ] Mouse move over header → radial gradient visible
- [ ] Gradient smoothly follows cursor
- [ ] CSS variables `--mx`, `--my` update correctly
- [ ] Gradient opacity transitions (0 → 100% on hover)

**How to test**:
1. Open any tab with cards
2. Slowly move mouse across card header
3. Watch for circular gradient following cursor

---

### Tone Variants
**Find examples of each tone**:
- [ ] `tone="default"` - Slate ring, no stripe (most cards)
- [ ] `tone="info"` - Sky blue ring + stripe (info messages)
- [ ] `tone="success"` - Emerald green ring + stripe (success states)
- [ ] `tone="warn"` - Amber yellow ring + stripe (warnings)
- [ ] `tone="danger"` - Rose red ring + stripe (errors, attacks)

**Where to find**:
- Default: Arguments tab, Debate tab
- Info: Analytics tab (informational cards)
- Success: Thesis tab (published theses)
- Warn: Admin tab (pending moderation)
- Danger: Arguments tab (attacked arguments)

---

### Loading States
**Test skeleton animation**:
- [ ] Trigger loading (refresh with slow network throttling)
- [ ] 3 horizontal bars pulse
- [ ] Bars have correct widths (60%, 100%, 80%)
- [ ] Colors correct (slate-200/70 light, slate-700/60 dark)

**How to test**:
1. Open DevTools → Network tab
2. Throttle to "Slow 3G"
3. Refresh page
4. Watch cards load

---

### Empty States
**Test empty message display**:
- [ ] Create/find deliberation with no arguments
- [ ] Arguments tab shows dashed border box
- [ ] Message "No arguments yet" centered
- [ ] Text styling correct (text-sm, slate-500)

---

### Busy States
**Test animated gradient bar**:
- [ ] Perform async action (create argument, vote)
- [ ] Top of card shows thin gradient bar
- [ ] Bar animates left-to-right continuously
- [ ] Colors: indigo → fuchsia → sky

---

## 🌙 Dark Mode Testing

**Enable dark mode**:
- macOS: System Preferences → Appearance → Dark
- OR: Add `?theme=dark` to URL (if supported)

**Re-test all tabs**:
- [ ] All cards visible (not too dark)
- [ ] Text contrast sufficient
- [ ] Borders visible but subtle
- [ ] Tone variant colors adjusted for dark
- [ ] Backdrop blur works
- [ ] Hover effects visible

---

## 📱 Mobile Responsive Testing

**Test viewports** (Chrome DevTools → Toggle Device Toolbar):

### iPhone SE (375px)
- [ ] Cards don't overflow
- [ ] ChipBar wraps correctly
- [ ] Text truncates properly
- [ ] Action buttons accessible

### iPad (768px)
- [ ] Two-column layout (if applicable)
- [ ] Sticky headers work
- [ ] Touch targets large enough

### Desktop (1024px+)
- [ ] Full layout renders
- [ ] Hover effects work
- [ ] Optimal card widths

---

## 🎯 StickyHeader Specific Tests

**Where StickyHeader is used**:
1. Left floating sheet (Arguments/Claims explorer)
2. Right floating sheet (Actions HUD)
3. Terms sheet (Glossary)

**Test procedure**:
1. [ ] Open left floating sheet
2. [ ] Sheet has long content (many arguments)
3. [ ] Scroll down in sheet
4. [ ] **Verify**: Header sticks to top of sheet
5. [ ] **Verify**: Backdrop blur activates
6. [ ] **Verify**: Header stays above content (z-20)
7. [ ] Scroll back to top
8. [ ] **Verify**: Header returns to normal state

**Test sheet toggle**:
- [ ] Open sheet → close sheet → reopen
- [ ] StickyHeader persists correctly
- [ ] No layout shift

---

## 🔢 ChipBar Specific Tests

**Where ChipBar is used**:
- Admin tab → WorksCounts (DN/IH/TC/OP badges)
- Various metadata displays

**What to check**:
- [ ] Chips wrap to next line if too many
- [ ] Gap between chips (4px)
- [ ] Border visible (indigo-200)
- [ ] Background semi-transparent (white/60)
- [ ] Text size correct (text-xs)
- [ ] Numbers bold

**Test with many items**:
1. Create deliberation with 10+ works
2. Check ChipBar doesn't overflow
3. Verify wrapping works

---

## ⚡ Performance Testing

### Render Performance
```javascript
// In browser console:
performance.mark('render-start');
// Navigate to Arguments tab
performance.mark('render-end');
performance.measure('tab-render', 'render-start', 'render-end');
console.table(performance.getEntriesByType('measure'));
```

**Expected**: < 200ms for tab switch

### Memory Leaks
**Test StickyHeader event listener cleanup**:
1. Open DevTools → Memory tab
2. Take heap snapshot
3. Open/close sheets 20 times
4. Take another heap snapshot
5. Compare: Should not show 20 orphaned listeners

### Scroll Performance
**Test smooth scrolling**:
- [ ] Scroll through 100+ arguments
- [ ] No jank or dropped frames
- [ ] Hover effects still smooth
- [ ] Chrome DevTools → Performance → Record → Scroll

**Expected**: 60fps consistently

---

## 🐛 Known Issues to Ignore

**Pre-existing TypeScript errors**:
- Line 1554-1557: `Property 'nodeType' does not exist on type 'AifNodeWithDialogue'`

**Pre-existing ESLint warnings**:
- Line 583: useEffect missing dependency 'compute'
- Line 639: targetRef conditional in useMemo

**These are NOT related to our extraction and can be fixed separately.**

---

## ✅ Acceptance Criteria

**All tests must pass before Day 2 completion**:

### Critical (Must Pass)
- [ ] All 9 tabs render without errors
- [ ] SectionCard headers display correctly
- [ ] Hover effects work as before
- [ ] No console errors related to extracted components
- [ ] Dark mode works
- [ ] Mobile responsive (no overflows)

### Important (Should Pass)
- [ ] Loading/empty/busy states work
- [ ] All tone variants display correctly
- [ ] StickyHeader scroll behavior unchanged
- [ ] ChipBar wraps correctly
- [ ] Performance identical (< 5% regression)

### Nice to Have (May Defer)
- [ ] Accessibility improvements
- [ ] Animation smoothness optimizations

---

## 📝 Issue Tracking

**If issues found, document here**:

### Issue 1: [Title]
- **Severity**: Critical / Major / Minor
- **Component**: SectionCard / ChipBar / StickyHeader
- **Location**: [Tab name]
- **Description**: [What's wrong]
- **Expected**: [What should happen]
- **Actual**: [What actually happens]
- **Screenshot**: [Link or attach]
- **Fix required**: Yes / No / Maybe

---

## 📸 Screenshot Checklist

**Capture before/after for each tab**:
- [ ] Debate tab
- [ ] Arguments tab
- [ ] Dialogue tab
- [ ] Ludics tab
- [ ] Admin tab
- [ ] Sources tab
- [ ] Thesis tab
- [ ] ASPIC tab
- [ ] Analytics tab

**Also capture**:
- [ ] Dark mode (any tab)
- [ ] Mobile view (375px)
- [ ] Hover effect (cursor over header)
- [ ] Loading state
- [ ] Empty state

---

## 🎯 Quick Win Checklist

**Fast checks** (5 minutes):
- [ ] Visit `/room/[ANY_DELIBERATION]`
- [ ] Click through all 9 tabs
- [ ] No visual glitches?
- [ ] No console errors?
- [ ] Hover effects work?

**If all ✅ → Extraction likely successful!**

---

## 🚀 Next Steps After Testing

### If All Tests Pass ✅
1. Mark Day 2 complete
2. Update `WEEK1_DAY1_PROGRESS_REPORT.md` → rename to `WEEK1_PROGRESS_REPORT.md`
3. Update migration tracker
4. Prepare staging deployment (Day 3)

### If Issues Found 🐛
1. Document in "Issue Tracking" section above
2. Prioritize (Critical → Major → Minor)
3. Create fix plan (Day 3)
4. Re-test after fixes (Day 4)
5. Deploy when clean (Day 5)

---

## ⏱️ Time Estimates

- **Tab testing** (9 tabs × 5 min): ~45 minutes
- **Cross-tab tests** (hover, loading, etc.): ~20 minutes
- **Dark mode**: ~15 minutes
- **Mobile responsive**: ~15 minutes
- **StickyHeader scroll tests**: ~10 minutes
- **Performance testing**: ~15 minutes
- **Documentation**: ~20 minutes

**Total estimated time**: ~2.5 hours

---

## 🎓 What We're Learning

**This testing phase teaches us**:
1. Whether extraction preserved exact behavior
2. Edge cases we might have missed
3. Performance characteristics
4. Real-world usage patterns
5. Areas for future optimization

**By the end of Day 2, we'll know**:
- ✅ Extraction strategy is sound (or needs adjustment)
- ✅ Components are production-ready (or need fixes)
- ✅ Confidence level for Week 2 (NestedTabs extraction)

---

## 🔖 Bookmarks for Quick Access

- Migration Tracker: `DEEPDIVEPANEL_V3_MIGRATION_TRACKER.md`
- Day 1 Report: `WEEK1_DAY1_PROGRESS_REPORT.md`
- Testing Checklist: `WEEK1_DAY1_TESTING_CHECKLIST.md`
- Week 2 Plan: `WEEK2_NESTED_TABS_PLAN.md`
- Audit Document: `DELIBERATION_PANEL_AUDIT_AND_REDESIGN.md`

---

**Good luck with testing! 🚀**
