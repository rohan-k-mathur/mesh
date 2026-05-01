# Week 4 Quick Start Guide

**Phase**: Tab Extraction  
**Timeline**: November 18-24, 2025  
**Goal**: Extract 3 tabs to reduce V2 complexity

---

## 🎯 Objectives

Extract 2 tabs and update StickyHeader from DeepDivePanelV2:
1. **AnalyticsTab** (simplest, ~150 LOC)
2. **DebateTab** (complex, ~250 LOC)
3. **StickyHeader Update** (Add Dialogue Timeline button - replaces Dialogue tab)

**Target**: Reduce V2 from 1,852 → 1,200-1,400 LOC

**Note**: Dialogue tab extraction removed from scope. Dialogue Timeline now accessible via StickyHeader button for better UX.

---

## 📋 Task Checklist

### Day 1: Setup & Pattern
- [ ] Review Week 4 plan (`DEEPDIVEPANEL_WEEK4_PLAN.md`)
- [ ] Create feature branch: `feat/week4-tab-extraction`
- [ ] **Task 4.1**: Create `v3/tabs/types.ts` with TabProps interfaces (1-2 hrs)
- [ ] **Task 4.2**: Extract AnalyticsTab (3-4 hrs)

### Day 2: Header Update
- [ ] Test AnalyticsTab integration
- [ ] **Task 4.3**: Update StickyHeader with Dialogue Timeline button (1-2 hrs)

### Day 3: Most Complex
- [ ] Test Dialogue Timeline button
- [ ] **Task 4.4**: Start DebateTab extraction (6-8 hrs total, 3-4 hrs today)

### Day 4: Complete & Wire
- [ ] Complete DebateTab extraction
- [ ] **Task 4.5**: Update V2 integration, remove Dialogue tab (2 hrs)
- [ ] **Task 4.6**: Create barrel exports (15 min)

### Days 5-6: Testing
- [ ] Comprehensive browser testing
- [ ] Fix any issues found
- [ ] Visual regression testing
- [ ] Performance testing

### Day 7: Deploy
- [ ] Create PR with detailed description
- [ ] Code review
- [ ] Merge and deploy
- [ ] Monitor production

---

## 🏗️ Architecture Pattern

### TabProps Interface Hierarchy

```typescript
// Base (all tabs)
interface BaseTabProps {
  deliberationId: string;
  currentUserId?: string;
  className?: string;
}

// + State management
interface StatefulTabProps extends BaseTabProps {
  delibState: DeliberationState;
  delibActions: DeliberationStateActions;
}

// + Sheet access
interface SheetAwareTabProps extends StatefulTabProps {
  sheets: SheetState;
  sheetActions: SheetActions;
}

// + Refresh capability
interface RefreshableTabProps extends BaseTabProps {
  onRefresh?: () => void;
  refreshCounter?: number;
}
```

### Tab Component Template

```tsx
import { SectionCard } from '../shared/SectionCard';
import { BaseTabProps } from './types'; // or StatefulTabProps, etc.

interface [Tab]TabProps extends BaseTabProps {
  // Tab-specific props
}

export function [Tab]Tab({
  deliberationId,
  currentUserId,
  className
}: [Tab]TabProps) {
  return (
    <div className={className}>
      <SectionCard title="...">
        {/* Content */}
      </SectionCard>
    </div>
  );
}
```

---

## 🔍 Extraction Workflow

For each tab:

1. **Create File**: `v3/tabs/[Tab]Tab.tsx`
2. **Copy Content**: From V2's `<TabsContent value="...">`
3. **Identify Dependencies**: What state/props does it need?
4. **Create Props Interface**: Extend appropriate base
5. **Wrap in Component**: Function component with props
6. **Update V2**: Import and use `<[Tab]Tab />`
7. **Test**: Unit → Integration → Browser
8. **Document**: JSDoc + migration notes

---

## 🧪 Testing Checklist

### Per Tab Component

**Compilation**:
- [ ] TypeScript: 0 errors
- [ ] ESLint: No new warnings

**Functionality**:
- [ ] Tab renders correctly
- [ ] All sections display
- [ ] All interactions work
- [ ] State management correct
- [ ] No console errors

**Integration**:
- [ ] Tab switching smooth
- [ ] Props passed correctly
- [ ] State synchronized
- [ ] Visual parity with V2

### Browser Testing

**AnalyticsTab**:
- [ ] Categorical analysis displays
- [ ] HomSet comparison renders
- [ ] Topology metrics show

**StickyHeader - Dialogue Timeline Button**:
- [ ] Button appears next to Configure Argument Schemes
- [ ] Clicking opens left sheet
- [ ] DialogueInspector displays in sheet
- [ ] Sheet closes normally

**DebateTab**:
- [ ] Proposition composer works
- [ ] Deliberation composer works
- [ ] Reply mode activates/clears
- [ ] Claims minimap displays
- [ ] Sheet integration works
- [ ] Dialogue inspector shows
- [ ] Issues/assumptions display
- [ ] Settings panel toggles

---

## 🚨 Common Pitfalls

### 1. Missed State References
**Problem**: Forgot to update a state reference  
**Solution**: Grep for old variable names after extraction

```bash
grep -n "variableName" DeepDivePanelV2.tsx | grep -v "delibState\."
```

### 2. Prop Drilling Errors
**Problem**: Forgot to pass a required prop  
**Solution**: TypeScript will catch this, but verify props in V2

### 3. Sheet Access Issues
**Problem**: Tab needs sheet access but doesn't have it  
**Solution**: Use `SheetAwareTabProps` interface

### 4. Circular Dependencies
**Problem**: Tab imports something that imports it back  
**Solution**: Extract shared utilities to `v3/shared/`

---

## 📊 Progress Tracking

### Code Metrics Target

| Metric | Before Week 4 | After Week 4 | Change |
|--------|---------------|--------------|--------|
| V2 LOC | 1,852 | 1,200-1,400 | ↓ 450-650 |
| Tabs Extracted | 0/8 | 2/8 | +2 |
| Total Tabs | 8 | 7 | -1 (Dialogue moved to header) |
| Files Created | 7 | 10 | +3 |

### Time Estimates

| Task | Estimated | Actual | Notes |
|------|-----------|--------|-------|
| 4.1 Types | 1-2 hrs | - | - |
| 4.2 Analytics | 3-4 hrs | - | - |
| 4.3 StickyHeader | 1-2 hrs | - | Replaces Dialogue tab |
| 4.4 Debate | 6-8 hrs | - | - |
| 4.5 Integration | 2 hrs | - | - |
| 4.6 Exports | 15 min | - | - |
| **Total** | **13-17 hrs** | - | Reduced from 17-22.5 hrs |

---

## 🎓 Lessons from Week 3

### Apply These Patterns

1. **Systematic Verification**
   - Always grep for old patterns after changes
   - Browser test comprehensively
   - Don't assume TypeScript caught everything

2. **Incremental Testing**
   - Test after each extraction
   - Don't wait until all 3 done
   - Fix issues immediately

3. **Document as You Go**
   - Note any issues encountered
   - Update plan with actual times
   - Help next week's planning

### Avoid These Mistakes

1. **Incomplete Migration**
   - Week 3 missed 15+ references initially
   - Use grep to find ALL usages

2. **Skipping Browser Testing**
   - TypeScript isn't enough
   - Always test in actual browser

3. **Large Batch Changes**
   - Don't extract all 3 tabs then test
   - Extract → Test → Fix → Repeat

---

## 🔗 Key Files Reference

### Documentation
- `DEEPDIVEPANEL_WEEK4_PLAN.md` - Detailed plan (full reference)
- `DELIBERATION_PANEL_AUDIT_AND_REDESIGN.md` - Overall strategy
- `DEEPDIVEPANEL_V3_MIGRATION_TRACKER.md` - Progress tracking
- `WEEK3_COMPLETION_SUMMARY.md` - What we just completed

### Code
- `components/deepdive/DeepDivePanelV2.tsx` - Current monolith (1,852 LOC)
- `components/deepdive/v3/hooks/` - Hooks from Week 3
- `components/deepdive/v3/shared/` - Shared components from Week 1
- `components/deepdive/v3/tabs/` - NEW - Where tabs will go

---

## 💡 Quick Commands

### Create Tab Directory
```bash
mkdir -p components/deepdive/v3/tabs
```

### Check Current LOC
```bash
wc -l components/deepdive/DeepDivePanelV2.tsx
```

### Search for State Usage
```bash
grep -n "variableName" components/deepdive/DeepDivePanelV2.tsx
```

### Run TypeScript Check
```bash
npx tsc --noEmit
```

### Run Linter
```bash
npm run lint
```

### Start Dev Server
```bash
npm run dev
```

---

## 🎯 Success Criteria

Week 4 is successful if:
- [x] 2 tabs extracted (Analytics, Debate)
- [x] Dialogue Timeline button added to StickyHeader
- [x] Dialogue tab removed from main tabs
- [x] V2 reduced to < 1,400 LOC
- [x] Now 7 tabs instead of 8
- [x] 0 TypeScript errors
- [x] 0 runtime errors in browser
- [x] 100% feature parity maintained
- [x] 0 visual regressions
- [x] All tests passing
- [x] Production deployment successful

---

## 🤝 Getting Help

### If Stuck on:
- **Props Interface**: See TabProps examples in Week 4 plan
- **State Access**: Check useDeliberationState from Week 3
- **Sheet Access**: See SheetAwareTabProps pattern
- **Testing**: Reference Week 3 testing approach

### Resources:
- Week 4 Plan: Section on specific tab (4.2, 4.3, 4.4)
- Week 3 Summary: Lessons learned section
- Migration Tracker: Risk register and patterns

---

**Ready to Start?**
1. Read full Week 4 plan
2. Create feature branch
3. Start with Task 4.1 (Types)
4. Follow the checklist above

**Good luck! 🚀**
