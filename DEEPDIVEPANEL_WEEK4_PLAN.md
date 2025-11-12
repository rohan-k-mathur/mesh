# DeepDivePanel V3 - Week 4 Implementation Plan

**Phase**: Tab Extraction (Phase 3 - Part 1)  
**Timeline**: Week 4 (November 18-24, 2025)  
**Status**: 🎯 READY TO START  
**Previous Completion**: Week 3 finished 1 week ahead of schedule

---

## Executive Summary

**Goal**: Extract individual tab content into separate components to reduce the monolithic DeepDivePanelV2 and enable better maintainability.

**Current Challenge**: DeepDivePanelV2 still contains **1,852 LOC** with all tab content inline. Each TabsContent block mixes rendering, data fetching, and business logic, making the component difficult to maintain and test.

**Solution**: Extract each tab into a focused component with:
- Clear props interface
- Isolated state management
- Testable business logic
- Reusable across V3 architecture

**Expected Impact**:
- 📉 Reduce V2 LOC by ~400-600 lines
- 🎯 Improve testability (tabs can be unit tested)
- 🔄 Enable parallel development on different tabs
- ✅ Prepare for nested tab architecture
- 🚀 Zero user-facing changes (internal refactor only)

---

## Week 3 Recap

### Accomplishments ✅
- Created 3 custom hooks (540 LOC total)
- useSheetPersistence: Fully integrated (3 sheets managed)
- useDeliberationState: Fully integrated (11 state consolidated)
- useDeliberationData: Created as pattern for future use
- Fixed 15+ missed state references after runtime testing
- **Result**: DeepDivePanelV2 reduced to 1,852 LOC
- **Status**: All hooks working perfectly in browser testing

### Key Learnings
1. **Systematic verification essential** - Runtime testing caught missed references
2. **Grep searches critical** - Found all 15+ migration issues
3. **Hook consolidation works** - Cleaner state management
4. **Testing catches everything** - Browser testing validated all fixes

---

## Current State Analysis

### Tab Content Size Analysis

Based on current DeepDivePanelV2.tsx structure:

```typescript
// DEBATE TAB (~250 LOC)
<TabsContent value="debate">
  - PropositionComposerPro
  - ClaimsMiniMap
  - DialogueInspector
  - IssuesList
  - AssumptionsPanel
</TabsContent>

// ARGUMENTS TAB (~150 LOC) - Already has nested structure from Week 2
<TabsContent value="arguments">
  - NestedTabs with ArgumentsTab component (130 LOC)
  - SchemesSection (275 LOC)
  - NetworksSection (340 LOC)
  - ASPIC nested tabs
</TabsContent>

// DIALOGUE TAB (~200 LOC)
<TabsContent value="dialogue">
  - LudicsCompilationPanel
  - BehaviourInspector
  - LegalMovesPanel
  - DialogueGraph
</TabsContent>

// LUDICS TAB (~150 LOC)
<TabsContent value="ludics">
  - ProCompilation
  - OppCompilation
  - BehaviourTrees
</TabsContent>

// ADMIN TAB (~180 LOC)
<TabsContent value="admin">
  - WorksSystem
  - ApprovalsPanel
  - TopologyWidget
  - DeliberationSettings
</TabsContent>

// SOURCES TAB (~120 LOC)
<TabsContent value="sources">
  - EvidenceList
  - CitationManager
</TabsContent>

// THESIS TAB (~100 LOC)
<TabsContent value="thesis">
  - ThesisComposer
  - ThesisList
</TabsContent>

// ANALYTICS TAB (~150 LOC)
<TabsContent value="analytics">
  - CategoricalAnalysis
  - HomSetComparison
  - TopologyMetrics
</TabsContent>
```

**Total Tab Content**: ~1,300 LOC (70% of current component)

---

## Week 4 Goals

### Primary Objectives

**Focus**: Extract 2 tabs and update StickyHeader to establish pattern and reduce complexity

**Priority Order**:
1. **AnalyticsTab** (Simplest - establishes extraction pattern)
2. **DebateTab** (Most complex, highest priority - most used)
3. **StickyHeader Update** (Add Dialogue Timeline button - replaces Dialogue tab)

**Target**: Reduce DeepDivePanelV2 from 1,852 → 1,200-1,400 LOC

**Note**: Dialogue tab extraction removed from scope. Dialogue Timeline will be accessible via StickyHeader button instead, simplifying the overall architecture.

### Secondary Objectives
- Establish tab extraction pattern
- Create TabProps interface
- Document data flow conventions
- Test extracted tabs independently
- Simplify header UX with direct Dialogue Timeline access

---

## Task Breakdown

### Task 4.1: Create TabProps Interface & Utilities

**Estimated Time**: 1-2 hours

**Goal**: Define standard interface for all tab components

**File**: `components/deepdive/v3/tabs/types.ts`

```typescript
/**
 * Common props for all deliberation panel tabs
 */
export interface BaseTabProps {
  /** The deliberation ID being viewed */
  deliberationId: string;
  
  /** Current user ID (from auth context) */
  currentUserId?: string;
  
  /** Optional class name for styling */
  className?: string;
}

/**
 * Extended props for tabs needing state management
 */
export interface StatefulTabProps extends BaseTabProps {
  /** Deliberation state (from useDeliberationState) */
  delibState: DeliberationState;
  
  /** Deliberation actions (from useDeliberationState) */
  delibActions: DeliberationStateActions;
}

/**
 * Extended props for tabs needing sheet control
 */
export interface SheetAwareTabProps extends StatefulTabProps {
  /** Sheet state (from useSheetPersistence) */
  sheets: SheetState;
  
  /** Sheet actions (from useSheetPersistence) */
  sheetActions: SheetActions;
}

/**
 * Props for tabs with refresh capability
 */
export interface RefreshableTabProps extends BaseTabProps {
  /** Trigger refresh of tab content */
  onRefresh?: () => void;
  
  /** Current refresh counter */
  refreshCounter?: number;
}
```

**Deliverables**:
- [ ] Create `v3/tabs/types.ts` with interfaces
- [ ] Export from `v3/tabs/index.ts`
- [ ] Document prop conventions

---

### Task 4.2: Extract AnalyticsTab ✅ COMPLETE

**Estimated Time**: 3-4 hours  
**Actual Time**: ~45 minutes  
**Priority**: HIGH (Simplest tab - establishes pattern)

**STATUS**: ✅ COMPLETE
- Created `v3/tabs/AnalyticsTab.tsx` (145 LOC)
- Extracted HomSetsTab internal component with full hom-set logic
- Integrated into DeepDivePanelV2.tsx
- Removed 89 lines from V2 (1,852 → 1,763 LOC)
- 0 TypeScript errors, 0 ESLint errors (only pre-existing warnings)

**Current Location**: DeepDivePanelV2.tsx lines ~1,700-1,850

**File**: `components/deepdive/v3/tabs/AnalyticsTab.tsx`

**Component Structure**:
```tsx
import { SectionCard } from '../shared/SectionCard';
import { BaseTabProps } from './types';
import { BarChart, TrendingUp, Network } from 'lucide-react';

interface AnalyticsTabProps extends BaseTabProps {
  // Analytics-specific props if needed
}

export function AnalyticsTab({ 
  deliberationId,
  currentUserId,
  className 
}: AnalyticsTabProps) {
  return (
    <div className={className}>
      <SectionCard
        title="Categorical Analysis"
        icon={<BarChart className="w-5 h-5" />}
        tone="info"
      >
        {/* Extract categorical analysis content */}
      </SectionCard>
      
      <SectionCard
        title="HomSet Comparison"
        icon={<TrendingUp className="w-5 h-5" />}
        tone="info"
      >
        {/* Extract HomSet content */}
      </SectionCard>
      
      <SectionCard
        title="Topology Metrics"
        icon={<Network className="w-5 h-5" />}
        tone="info"
      >
        {/* Extract topology content */}
      </SectionCard>
    </div>
  );
}
```

**Implementation Steps**:
1. Create `v3/tabs/AnalyticsTab.tsx`
2. Copy analytics TabsContent from V2
3. Wrap in function component with props
4. Replace inline content with SectionCard components
5. Update V2 to import and use `<AnalyticsTab />`
6. Test tab switching works
7. Verify no visual regressions

**Verification Checklist**:
- [x] TypeScript compiles without errors ✅
- [x] Analytics tab renders correctly ✅
- [x] All metrics display properly ✅
- [x] Tab switching smooth ✅
- [x] No console errors ✅
- [x] Visual parity with V2 ✅

**Implementation Notes**:
- HomSetsTab was already self-contained, making extraction straightforward
- Component uses SWR for data fetching (preserved pattern)
- Categorical hom-set confidence calculations preserved
- Uses BaseTabProps (simplest interface - no state needed)

---

### Task 4.3: Update StickyHeader with Dialogue Timeline Button

**Estimated Time**: 1-2 hours  
**Priority**: MEDIUM (Replaces DialogueTab extraction)

**Decision**: The Dialogue tab is not needed as a separate tab. Instead:
1. Add "Dialogue Timeline" button to StickyHeader next to "Configure Argument Schemes"
2. Remove Dialogue visualization graph component (not needed)
3. Move Commitment Stores component to appropriate tab (later decision)

**Current Location**: DeepDivePanelV2.tsx StickyHeader section (~lines 1,340-1,360)

**Changes to StickyHeader**:

```tsx
<StickyHeader>
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {/* Existing title and confidence controls */}
      <h2>Deliberation: {delib?.title}</h2>
      
      {/* Configuration controls */}
      <RepresentativeViewpoints
        selection={sel}
        onSelectionChange={setSel}
        onCompute={compute}
      />
    </div>
    
    <div className="flex items-center gap-2">
      {/* Existing Configure Argument Schemes button */}
      <Link href="/schemes/browse">
        <button className="...">
          <GalleryVerticalEnd className="w-4 h-4" />
          <span className="flex items-center">Configure Argument Schemes</span>
        </button>
      </Link>
      
      {/* NEW: Dialogue Timeline button */}
      <button
        onClick={() => {
          // Open left sheet with dialogue timeline
          sheetActions.setLeft('dialogue-timeline');
          if (!sheets.left) sheetActions.toggleLeft();
        }}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
      >
        <MessageSquare className="w-4 h-4" />
        <span>Dialogue Timeline</span>
      </button>
      
      <DiscusHelpPage />
      {delibState.pending && <div className="text-xs text-neutral-500">Computing…</div>}
    </div>
  </div>
</StickyHeader>
```

**Implementation Steps**:
1. Import MessageSquare icon from lucide-react
2. Add "Dialogue Timeline" button to StickyHeader
3. Wire up onClick to open left sheet with dialogue timeline
4. Remove Dialogue tab from main tabs list
5. Move DialogueInspector component to left sheet content
6. Test button functionality
7. Verify sheet opens correctly

**Files Modified**:
- `components/deepdive/DeepDivePanelV2.tsx` (StickyHeader section)
- Possibly `components/ui/FloatingSheet.tsx` (if dialogue timeline needs special handling)

**Verification Checklist**:
- [ ] TypeScript compiles without errors
- [ ] Dialogue Timeline button appears in header
- [ ] Button opens left sheet correctly
- [ ] DialogueInspector displays in sheet
- [ ] Sheet can be closed normally
- [ ] No visual regressions
- [ ] No console errors

**Note**: This simplification reduces Week 4 scope and complexity. The Dialogue tab is redundant when its main feature (timeline) can be accessed directly from the header, and the graph visualization is not essential for current workflows.

---

### Task 4.4: Extract DebateTab

**Estimated Time**: 6-8 hours  
**Priority**: HIGHEST (Most complex but most used)

**Current Location**: DeepDivePanelV2.tsx lines ~1,370-1,620

**File**: `components/deepdive/v3/tabs/DebateTab.tsx`

**Component Structure**:
```tsx
import { SectionCard } from '../shared/SectionCard';
import { SheetAwareTabProps, RefreshableTabProps } from './types';
import { MessageSquare, Target, AlertCircle, CheckSquare } from 'lucide-react';
import { PropositionComposerPro } from '@/components/deliberation/PropositionComposerPro';
import { ClaimsMiniMap } from '@/components/deepdive/ClaimsMiniMap';
import { DialogueInspector } from '@/components/dialogue/DialogueInspector';
import { DeliberationComposer } from '@/components/deliberation/DeliberationComposer';

interface DebateTabProps extends SheetAwareTabProps, RefreshableTabProps {
  /** Callback when reply target is set */
  onReplyTo?: (target: { id: string; preview?: string } | null) => void;
}

export function DebateTab({
  deliberationId,
  currentUserId,
  delibState,
  delibActions,
  sheets,
  sheetActions,
  onRefresh,
  refreshCounter,
  className
}: DebateTabProps) {
  // Local handlers
  const handleReplyTo = (id: string, preview?: string) => {
    delibActions.setReplyTarget({ id, preview });
  };

  return (
    <div className={className}>
      {/* Settings Panel (Conditional) */}
      {delibState.delibSettingsOpen && (
        <SectionCard>
          <DeliberationSettingsPanel deliberationId={deliberationId} />
        </SectionCard>
      )}
      
      {/* Proposition Composer */}
      <SectionCard 
        title="Compose Proposition"
        icon={<MessageSquare className="w-5 h-5" />}
      >
        <PropositionComposerPro deliberationId={deliberationId} />
      </SectionCard>
      
      {/* Deliberation Composer (Arguments/Claims) */}
      <SectionCard 
        title="Participate in Discussion"
        icon={<Target className="w-5 h-5" />}
      >
        <DeliberationComposer
          deliberationId={deliberationId}
          isReplyMode={!!delibState.replyTarget}
          targetArgumentId={delibState.replyTarget?.id}
          targetPreviewText={delibState.replyTarget?.preview}
          onClearReply={delibActions.clearReplyTarget}
          onPosted={() => {
            delibActions.clearReplyTarget();
            onRefresh?.();
          }}
        />
      </SectionCard>
      
      {/* Claims MiniMap */}
      <SectionCard 
        title="Claims Overview"
        subtitle="Visual map of all claims in this deliberation"
        icon={<Target className="w-5 h-5" />}
        tone="info"
      >
        <ClaimsMiniMap
          deliberationId={deliberationId}
          onSelectClaim={(claimId) => {
            sheetActions.setLeft(claimId);
            sheetActions.toggleLeft();
          }}
        />
      </SectionCard>
      
      {/* Dialogue Inspector */}
      <SectionCard
        title="Dialogue Timeline"
        subtitle="Chronological view of dialogue moves"
        icon={<MessageSquare className="w-5 h-5" />}
      >
        <DialogueInspector
          deliberationId={deliberationId}
          highlightedMoveId={delibState.highlightedDialogueMoveId}
          onHighlightMove={delibActions.setHighlightedDialogueMoveId}
        />
      </SectionCard>
      
      {/* Issues List */}
      <SectionCard
        title="Open Issues"
        icon={<AlertCircle className="w-5 h-5" />}
        tone="warn"
      >
        {/* Extract issues list content */}
      </SectionCard>
      
      {/* Assumptions */}
      <SectionCard
        title="Shared Assumptions"
        icon={<CheckSquare className="w-5 h-5" />}
        tone="success"
      >
        {/* Extract assumptions content */}
      </SectionCard>
    </div>
  );
}
```

**Implementation Steps**:
1. Create `v3/tabs/DebateTab.tsx`
2. Extract debate TabsContent from V2 (largest section)
3. Identify all state dependencies:
   - delibSettingsOpen
   - replyTarget
   - highlightedDialogueMoveId
   - refreshCounter
4. Identify all prop drilling needs:
   - Sheet actions (for ClaimsMiniMap)
   - Refresh callback
5. Create comprehensive props interface
6. Wire up all child components
7. Handle reply functionality
8. Update V2 to use `<DebateTab />`
9. Comprehensive testing
10. Visual regression testing

**Verification Checklist**:
- [ ] TypeScript compiles without errors
- [ ] Debate tab renders correctly
- [ ] Proposition composer works
- [ ] Deliberation composer works
- [ ] Reply mode activates correctly
- [ ] Reply mode clears correctly
- [ ] Claims minimap displays
- [ ] Claim selection opens sheet
- [ ] Dialogue inspector works
- [ ] Move highlighting functional
- [ ] Issues list displays
- [ ] Assumptions panel displays
- [ ] Settings panel toggles correctly
- [ ] Refresh triggers properly
- [ ] No console errors
- [ ] Visual parity with V2

---

### Task 4.5: Update DeepDivePanelV2 Integration

**Estimated Time**: 2 hours

**Goal**: Wire extracted tabs into V2, update StickyHeader, remove Dialogue tab

**Changes to DeepDivePanelV2.tsx**:

```tsx
// Add imports
import { AnalyticsTab } from './v3/tabs/AnalyticsTab';
import { DebateTab } from './v3/tabs/DebateTab';
import { MessageSquare } from 'lucide-react'; // For Dialogue Timeline button

// Inside component - Update StickyHeader:
<StickyHeader>
  <div className="flex items-center justify-between">
    {/* ... existing content ... */}
    <div className="flex items-center gap-2">
      <Link href="/schemes/browse">
        <button className="...">
          <GalleryVerticalEnd className="w-4 h-4" />
          <span>Configure Argument Schemes</span>
        </button>
      </Link>
      
      {/* NEW: Dialogue Timeline Button */}
      <button
        onClick={() => {
          sheetActions.setLeft('dialogue-timeline');
          if (!sheets.left) sheetActions.toggleLeft();
        }}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg"
      >
        <MessageSquare className="w-4 h-4" />
        <span>Dialogue Timeline</span>
      </button>
      
      <DiscusHelpPage />
      {delibState.pending && <div className="text-xs text-neutral-500">Computing…</div>}
    </div>
  </div>
</StickyHeader>

// Update Tabs - Remove Dialogue tab from TabsList:
<Tabs value={delibState.tab} onValueChange={delibActions.setTab}>
  <TabsList>
    <TabsTrigger value="debate">Debate</TabsTrigger>
    <TabsTrigger value="arguments">Arguments</TabsTrigger>
    {/* REMOVED: Dialogue tab */}
    <TabsTrigger value="ludics">Ludics</TabsTrigger>
    <TabsTrigger value="admin">Admin</TabsTrigger>
    <TabsTrigger value="sources">Sources</TabsTrigger>
    <TabsTrigger value="thesis">Thesis</TabsTrigger>
    <TabsTrigger value="analytics">Analytics</TabsTrigger>
  </TabsList>
  
  {/* Replace inline content with components */}
  <TabsContent value="debate" className="w-full min-w-0 mt-4 space-y-4">
    <DebateTab
      deliberationId={deliberationId}
      currentUserId={authorId}
      delibState={delibState}
      delibActions={delibActions}
      sheets={sheets}
      sheetActions={sheetActions}
      onRefresh={() => delibActions.triggerRefresh()}
      refreshCounter={delibState.refreshCounter}
    />
  </TabsContent>
  
  {/* REMOVED: Dialogue TabsContent */}
  
  <TabsContent value="analytics" className="w-full min-w-0 mt-4 space-y-4">
    <AnalyticsTab
      deliberationId={deliberationId}
      currentUserId={authorId}
    />
  </TabsContent>
  
  {/* Keep remaining tabs as-is for now */}
</Tabs>
```

**Implementation Steps**:
1. Add tab component imports
2. Add MessageSquare icon import
3. Add Dialogue Timeline button to StickyHeader
4. Remove Dialogue tab from TabsList
5. Remove Dialogue TabsContent section
6. Replace Debate and Analytics TabsContent with components
7. Wire up props correctly
8. Test tab switching (now 7 tabs instead of 8)
9. Test Dialogue Timeline button
10. Verify sheet opens with DialogueInspector
11. Check TypeScript compilation
12. Run linter
13. Browser testing

**Verification Checklist**:
- [ ] All 7 tabs switch correctly
- [ ] Dialogue Timeline button appears in header
- [ ] Button opens left sheet correctly
- [ ] No prop type errors
- [ ] No runtime errors
- [ ] Visual consistency maintained
- [ ] Performance unchanged

---

### Task 4.6: Create Barrel Exports

**Estimated Time**: 15 minutes

**Goal**: Clean import paths for tab components

**File**: `components/deepdive/v3/tabs/index.ts`

```typescript
/**
 * Deliberation Panel Tab Components
 * 
 * Extracted from DeepDivePanelV2 for better maintainability.
 * Each tab is a focused component with clear props interface.
 * 
 * Note: DialogueTab removed - Dialogue Timeline now accessible
 * via StickyHeader button instead.
 */

export { AnalyticsTab } from './AnalyticsTab';
export { DebateTab } from './DebateTab';

// Types
export type {
  BaseTabProps,
  StatefulTabProps,
  SheetAwareTabProps,
  RefreshableTabProps,
} from './types';
```

**Implementation Steps**:
1. Create barrel export file
2. Export all tab components
3. Export all types
4. Add JSDoc documentation
5. Update V2 imports to use barrel

---

## Testing Strategy

### Unit Testing (Per Tab)

Create test files for each extracted tab:

**Example**: `AnalyticsTab.test.tsx`
```tsx
import { render, screen } from '@testing-library/react';
import { AnalyticsTab } from './AnalyticsTab';

describe('AnalyticsTab', () => {
  const mockProps = {
    deliberationId: 'test-delib-123',
    currentUserId: 'user-123',
  };

  it('renders without crashing', () => {
    render(<AnalyticsTab {...mockProps} />);
    expect(screen.getByText('Categorical Analysis')).toBeInTheDocument();
  });

  it('renders all analytics sections', () => {
    render(<AnalyticsTab {...mockProps} />);
    expect(screen.getByText('Categorical Analysis')).toBeInTheDocument();
    expect(screen.getByText('HomSet Comparison')).toBeInTheDocument();
    expect(screen.getByText('Topology Metrics')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <AnalyticsTab {...mockProps} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
```

### Integration Testing

**Test File**: `DeepDivePanelV2.integration.test.tsx`

```tsx
describe('DeepDivePanelV2 - Tab Integration', () => {
  it('switches to analytics tab correctly', async () => {
    render(<DeepDivePanelV2 deliberationId="test-123" />);
    
    const analyticsTab = screen.getByRole('tab', { name: /analytics/i });
    await userEvent.click(analyticsTab);
    
    expect(screen.getByText('Categorical Analysis')).toBeVisible();
  });

  it('switches to dialogue tab correctly', async () => {
    render(<DeepDivePanelV2 deliberationId="test-123" />);
    
    const dialogueTab = screen.getByRole('tab', { name: /dialogue/i });
    await userEvent.click(dialogueTab);
    
    expect(screen.getByText('Ludics Compilation')).toBeVisible();
  });

  it('preserves state when switching between tabs', async () => {
    render(<DeepDivePanelV2 deliberationId="test-123" />);
    
    // Set some state in debate tab
    const debateTab = screen.getByRole('tab', { name: /debate/i });
    await userEvent.click(debateTab);
    
    // Switch to analytics
    const analyticsTab = screen.getByRole('tab', { name: /analytics/i });
    await userEvent.click(analyticsTab);
    
    // Switch back to debate
    await userEvent.click(debateTab);
    
    // Verify state preserved (would need specific assertions based on state)
  });
});
```

### Browser Testing Checklist

Manual verification in browser:

**Debate Tab**:
- [ ] Proposition composer renders
- [ ] Can create new proposition
- [ ] Deliberation composer renders
- [ ] Can create argument/claim
- [ ] Reply mode activates on reply button
- [ ] Reply mode clears correctly
- [ ] Claims minimap displays
- [ ] Clicking claim opens left sheet
- [ ] Dialogue inspector shows moves
- [ ] Move highlighting works
- [ ] Issues list displays
- [ ] Assumptions panel displays
- [ ] Settings panel toggles

**Dialogue Timeline (StickyHeader)**:
- [ ] Dialogue Timeline button appears in header
- [ ] Button positioned correctly next to Configure Argument Schemes
- [ ] Clicking button opens left sheet
- [ ] DialogueInspector displays in sheet
- [ ] Move highlighting works
- [ ] Sheet can be closed normally
- [ ] Button styling consistent with header theme

**Analytics Tab**:
- [ ] Categorical analysis displays
- [ ] HomSet comparison renders
- [ ] Topology metrics show
- [ ] All charts/visualizations work
- [ ] No console errors

**Cross-Tab**:
- [ ] Tab switching smooth (< 200ms)
- [ ] Now 7 tabs instead of 8 (Dialogue removed)
- [ ] State preserved across switches
- [ ] No memory leaks
- [ ] No visual glitches
- [ ] Keyboard navigation works

---

## Performance Considerations

### Bundle Size Impact

**Before Week 4**:
- DeepDivePanelV2.tsx: ~1,852 LOC (single file)
- Total tabs: 8

**After Week 4**:
- DeepDivePanelV2.tsx: ~1,200-1,400 LOC
- DebateTab.tsx: ~250 LOC
- AnalyticsTab.tsx: ~150 LOC
- types.ts: ~50 LOC
- Total tabs: 7 (Dialogue removed, Timeline in header)

**Total Code**: Similar LOC but better organized, one less tab

**Benefits of Removing Dialogue Tab**:
- Simpler tab navigation (7 vs 8)
- Direct access to Dialogue Timeline from any tab
- Reduced cognitive load
- Cleaner architecture

### Code Splitting Opportunities

With tabs extracted, we can lazy load them:

```tsx
const DebateTab = lazy(() => import('./v3/tabs/DebateTab'));
const DialogueTab = lazy(() => import('./v3/tabs/DialogueTab'));
const AnalyticsTab = lazy(() => import('./v3/tabs/AnalyticsTab'));

// In render:
<Suspense fallback={<TabLoadingSpinner />}>
  <TabsContent value="debate">
    <DebateTab {...props} />
  </TabsContent>
</Suspense>
```

**Benefits**:
- Initial bundle smaller (load active tab only)
- Faster initial page load
- Better performance on tab switch (cached after first load)

**Note**: Implement in Week 5 after all tabs extracted

---

## Migration Checklist

### Pre-Implementation
- [x] Review Week 3 completion status ✅
- [x] Verify hooks working in production ✅
- [ ] Create Week 4 feature branch
- [ ] Set up testing environment

### Implementation Phase
- [x] Task 4.1: Create TabProps interfaces (1-2 hrs) ✅ COMPLETE
- [ ] Task 4.2: Extract AnalyticsTab (3-4 hrs)
- [ ] Task 4.3: Update StickyHeader with Dialogue Timeline button (1-2 hrs)
- [ ] Task 4.4: Extract DebateTab (6-8 hrs)
- [ ] Task 4.5: Update V2 integration + remove Dialogue tab (2 hrs)
- [ ] Task 4.6: Create barrel exports (15 min)

**Total Estimated Time**: 13-17 hours (reduced from 17-22.5 hours)

**Time Saved**: 4-5.5 hours by simplifying Dialogue tab approach

**Task 4.1 Completion Notes**:
- ✅ Created `components/deepdive/v3/tabs/types.ts` (127 LOC)
- ✅ 6 TypeScript interfaces defined (BaseTabProps, StatefulTabProps, SheetAwareTabProps, RefreshableTabProps, FullTabProps, AdditionalTabProps)
- ✅ All imports verified and working
- ✅ 0 TypeScript errors
- ✅ 0 ESLint warnings
- ✅ Comprehensive JSDoc documentation included
- ✅ Ready for tab extraction

### Testing Phase
- [ ] Unit tests for AnalyticsTab
- [ ] Unit tests for DebateTab
- [ ] Integration test for tab switching (now 7 tabs)
- [ ] Browser testing Dialogue Timeline button
- [ ] Browser testing all remaining tabs
- [ ] Visual regression testing
- [ ] Performance testing
- [ ] Accessibility testing

### Deployment Phase
- [ ] TypeScript compilation clean
- [ ] ESLint passes
- [ ] Create PR with detailed description
- [ ] Code review
- [ ] Merge to main
- [ ] Deploy to staging
- [ ] Production deployment

---

## Risk Analysis

### High Risk
- **Breaking reply functionality** - Complex state management in DebateTab
  - *Mitigation*: Careful prop drilling, extensive testing
  
- **Sheet integration issues** - DebateTab needs sheet access
  - *Mitigation*: SheetAwareTabProps interface, test sheet interactions

### Medium Risk
- **State synchronization** - Multiple tabs accessing same state
  - *Mitigation*: Use delibState hook consistently
  
- **Performance regression** - More components = more renders?
  - *Mitigation*: React.memo on tabs, lazy loading later

### Low Risk
- **Import path changes** - Moving files breaks imports
  - *Mitigation*: TypeScript will catch, barrel exports simplify
  
- **Visual inconsistencies** - Tabs look different after extraction
  - *Mitigation*: Use same SectionCard patterns, visual regression tests

---

## Success Metrics

### Code Quality Targets
- [ ] DeepDivePanelV2.tsx reduced to < 1,400 LOC
- [ ] Each tab file < 300 LOC
- [ ] 100% TypeScript type coverage
- [ ] Zero new ESLint errors
- [ ] Test coverage > 60% for new files

### Performance Targets
- [ ] Tab switch < 200ms (same as before)
- [ ] Initial render < 2s (same as before)
- [ ] No memory leaks (verify with DevTools)
- [ ] Bundle size increase < 5% (acceptable for better organization)

### User Experience Targets
- [ ] Zero visual regressions
- [ ] Zero functional regressions
- [ ] All existing features work identically
- [ ] No console errors or warnings

---

## Week 5 Preview

### Goals for Next Week
1. Extract remaining tabs (Ludics, Admin, Sources, Thesis)
2. Implement nested tab structure for Arguments tab
3. Consider code splitting strategy
4. Performance optimization pass

### Dependencies
- Week 4 tabs must be stable
- All tests passing
- No production issues from Week 4 deployment

---

## Documentation Updates Needed

### Files to Update
1. **DEEPDIVEPANEL_V3_MIGRATION_TRACKER.md**
   - Mark Phase 3 Part 1 complete
   - Update LOC metrics
   - Add Week 4 outcomes

2. **README.md** (if applicable)
   - Update component architecture diagram
   - Add tab extraction notes

3. **Code Comments**
   - Add JSDoc to all tab components
   - Document prop interfaces
   - Add usage examples

---

## Open Questions

1. **Lazy Loading Timing?**
   - Implement in Week 4 or Week 5?
   - **Recommendation**: Week 5 after all tabs extracted

2. **Nested Tab Pattern?**
   - Extract nested tabs now or wait?
   - **Recommendation**: Week 5 (Arguments tab consolidation)

3. **Test Coverage Target?**
   - What's realistic for Week 4?
   - **Recommendation**: 60% minimum, aim for 80%

4. **Performance Budget?**
   - Accept bundle size increase for better organization?
   - **Recommendation**: Yes, 5-10% acceptable, optimize in Week 5

5. **Deployment Strategy?**
   - Deploy after each tab or all at once?
   - **Recommendation**: All 3 tabs together, one deployment

---

## Next Steps (Immediate)

### Day 1 (Today)
1. ✅ Create Week 4 plan (this document)
2. [ ] Review plan with stakeholders
3. [ ] Create feature branch `feat/week4-tab-extraction`
4. [ ] Start Task 4.1: Create TabProps interfaces

### Day 2
1. [ ] Complete Task 4.1: TabProps interfaces
2. [ ] Complete Task 4.2: Extract AnalyticsTab
3. [ ] Test AnalyticsTab integration
4. [ ] Start Task 4.3: Update StickyHeader

### Day 3
1. [ ] Complete Task 4.3: StickyHeader with Dialogue Timeline button
2. [ ] Test Dialogue Timeline functionality
3. [ ] Start Task 4.4: Extract DebateTab

### Days 4-5
1. [ ] Complete Task 4.4: DebateTab (most complex)
2. [ ] Comprehensive testing
3. [ ] Fix any issues found

### Day 6
1. [ ] Task 4.5: Update V2 integration (wire tabs, remove Dialogue tab)
2. [ ] Task 4.6: Barrel exports
3. [ ] Final testing pass
4. [ ] Create PR

### Day 7
1. [ ] Code review
2. [ ] Address feedback
3. [ ] Merge and deploy
4. [ ] Monitor production

---

## Appendix A: Current Tab Usage Analytics

**Note**: Would be helpful to gather actual usage data

**Assumed Priority** (based on typical usage):
1. **Debate** - 60% of time (primary discussion)
2. **Arguments** - 20% of time (reviewing arguments)
3. **Dialogue Timeline** - 10% of time (accessed via header button now)
4. **Analytics** - 5% of time (metrics review)
5. **Admin** - 3% of time (moderation)
6. **Others** - 2% of time (occasional use)

**Note**: Dialogue tab removed from main tabs. Dialogue Timeline now accessible from any tab via StickyHeader button, improving discoverability and reducing tab clutter.

---

## Appendix B: Tab Dependency Matrix

| Tab | Depends On | Provides To |
|-----|-----------|-------------|
| Debate | delibState, sheets | highlightedMoveId |
| Arguments | delibState | argument selection |
| Dialogue | delibState (highlightedMoveId) | - |
| Ludics | - | - |
| Admin | - | settings changes |
| Sources | - | - |
| Thesis | - | - |
| Analytics | - | - |

**Week 4 Focus**: Debate, Dialogue, Analytics (good coverage of dependency patterns)

---

## Appendix C: Extraction Pattern Template

For each tab extraction, follow this template:

1. **Create Component File**
   - `v3/tabs/[TabName]Tab.tsx`
   - Proper imports
   - Props interface

2. **Extract Content**
   - Copy TabsContent block from V2
   - Wrap in function component
   - Add props parameter

3. **Identify Dependencies**
   - What state does it need?
   - What callbacks does it need?
   - What sheet access does it need?

4. **Update Props Interface**
   - Extend appropriate base interface
   - Add tab-specific props
   - Document each prop

5. **Wire Up V2**
   - Import new component
   - Replace TabsContent content with component
   - Pass all required props

6. **Test**
   - Unit test the component
   - Integration test in V2
   - Browser test all functionality
   - Visual regression test

7. **Document**
   - Add JSDoc comments
   - Update migration tracker
   - Note any issues/learnings

---

## Conclusion

Week 4 focuses on establishing the tab extraction pattern by extracting 3 key tabs: DebateTab (most complex), DialogueTab (medium complexity), and AnalyticsTab (simplest). This will reduce DeepDivePanelV2 by ~400-600 LOC while maintaining 100% feature parity.

The extracted tabs will:
- Be easier to test independently
- Enable parallel development
- Prepare for nested tab architecture
- Allow future code splitting
- Improve overall maintainability

**Target**: Complete 3 tab extractions by end of Week 4, reducing V2 to ~1,200-1,400 LOC with zero user-facing changes.

**Next Week Preview**: Extract remaining tabs (Ludics, Admin, Sources, Thesis) and implement nested tab structure for Arguments tab consolidation.
