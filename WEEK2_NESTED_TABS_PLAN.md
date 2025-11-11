# Week 2 Plan: Nested Tabs Architecture Implementation

**Timeline**: November 18-24, 2025 (After Week 1 completes)  
**Phase**: Phase 1 - Nested Tab Pattern  
**Dependencies**: Week 1 shared components extraction complete

---

## 🎯 Goals

1. Create reusable NestedTabs component
2. Refactor Arguments tab with nested structure
3. Add Phase 1-4 integration subtabs (Schemes, Networks)
4. Move existing ASPIC tab content under Arguments
5. Validate improved navigation UX

---

## 📋 Tasks Breakdown

### Day 1-2: NestedTabs Component (Monday-Tuesday)

#### Task 2.1: Create NestedTabs Component
**File**: `components/deepdive/shared/NestedTabs.tsx`

**Requirements**:
- Independent state management from parent tabs
- Visual differentiation (secondary style)
- Keyboard navigation support
- Persistent active tab (localStorage)
- TypeScript strict mode

**API Design**:
```typescript
interface NestedTabsProps {
  id: string;                    // For localStorage persistence
  defaultValue: string;
  tabs: Array<{
    value: string;
    label: string;
    icon?: React.ReactNode;
    badge?: number | string;
    content: React.ReactNode;
  }>;
  className?: string;
  variant?: 'primary' | 'secondary';  // secondary for nested
  onChange?: (value: string) => void;
}

// Usage:
<NestedTabs
  id="arguments-subtabs"
  defaultValue="list"
  tabs={[
    { value: 'list', label: 'List', content: <ArgumentsList /> },
    { value: 'schemes', label: 'Schemes', content: <SchemesSection /> },
    { value: 'networks', label: 'Networks', content: <NetworksSection /> },
  ]}
  variant="secondary"
/>
```

**Visual Style** (secondary variant):
- Smaller font size (text-xs vs text-sm)
- Less padding
- Subtle background (slate-50 vs white)
- Underline indicator vs full background
- Indent slightly from parent

**Success Criteria**:
- [ ] Component renders with mock tabs
- [ ] Tab switching works
- [ ] localStorage persistence works
- [ ] Keyboard nav (arrow keys) works
- [ ] TypeScript compiles without errors
- [ ] Visual differentiation clear

---

### Day 3: Arguments Tab Refactor (Wednesday)

#### Task 2.2: Extract ArgumentsTab Component
**File**: `components/deepdive/v3/tabs/ArgumentsTab.tsx`

**Current State** (in DeepDivePanelV2):
```typescript
<TabsContent value="arguments">
  <SectionCard title="Arguments">
    <AIFArgumentsListPro 
      deliberationId={deliberationId}
      currentUserId={authorId}
      // ... many props
    />
  </SectionCard>
</TabsContent>
```

**New State** (refactored):
```typescript
<TabsContent value="arguments">
  <ArgumentsTab
    deliberationId={deliberationId}
    currentUserId={authorId}
    // ... consolidated props
  />
</TabsContent>

// ArgumentsTab.tsx
export function ArgumentsTab(props) {
  return (
    <NestedTabs
      id={`arguments-${props.deliberationId}`}
      defaultValue="list"
      tabs={[
        {
          value: 'list',
          label: 'All Arguments',
          icon: <List />,
          content: <ArgumentsListSection {...props} />
        },
        {
          value: 'schemes',
          label: 'Schemes',
          icon: <Network />,
          badge: schemeCount,
          content: <SchemesSection {...props} />
        },
        {
          value: 'networks',
          label: 'Networks',
          icon: <GitFork />,
          badge: netCount,
          content: <NetworksSection {...props} />
        },
        {
          value: 'aspic',
          label: 'ASPIC',
          icon: <Shield />,
          content: <AspicNestedTab {...props} />
        }
      ]}
      variant="secondary"
    />
  );
}
```

**Success Criteria**:
- [ ] Arguments tab shows nested tabs
- [ ] All 4 subtabs render correctly
- [ ] Subtab state persists across main tab switches
- [ ] No visual regressions
- [ ] Phase 1-4 features accessible

---

### Day 3-4: Phase 1-4 Integration Sections (Wednesday-Thursday)

#### Task 2.3: Create SchemesSection Component
**File**: `components/deepdive/v3/sections/SchemesSection.tsx`

**Purpose**: Browse and explore detected argumentation schemes (Phase 1)

**Features**:
- List of all detected schemes in deliberation
- Scheme cards showing:
  - Scheme name and category
  - Confidence score
  - Number of arguments using this scheme
  - Critical questions preview
- Click to filter arguments by scheme
- Link to scheme definition
- Visual scheme hierarchy (if available)

**Wireframe**:
```
┌─ Detected Schemes ──────────────────────────┐
│ 🎯 Expert Opinion (5 arguments)             │
│    Confidence: 0.92 • CQs: 7                │
│    [View Arguments] [View Definition]       │
├─────────────────────────────────────────────┤
│ 🔗 Sign Reasoning (3 arguments)             │
│    Confidence: 0.88 • CQs: 5                │
│    [View Arguments] [View Definition]       │
└─────────────────────────────────────────────┘
```

**Data Source**:
```typescript
const { data: schemes } = useSWR(
  `/api/nets/detect?deliberationId=${deliberationId}&groupBy=scheme`,
  fetcher
);
```

#### Task 2.4: Create NetworksSection Component  
**File**: `components/deepdive/v3/sections/NetworksSection.tsx`

**Purpose**: Visualize multi-scheme argument networks (Phase 4)

**Features**:
- List of detected multi-scheme nets
- Net cards showing:
  - Net ID and type (serial/parallel/tree)
  - Scheme count and names
  - Overall confidence
  - Complexity score
- Click to open ArgumentNetAnalyzer
- Visual net preview thumbnail
- Filter by net type, confidence, complexity

**Wireframe**:
```
┌─ Argument Networks ─────────────────────────┐
│ 🌐 Net: Expert → Sign → Causal             │
│    Type: Serial • Schemes: 3 • Conf: 0.90  │
│    [Analyze Net] [View Graph]              │
├─────────────────────────────────────────────┤
│ 🌐 Net: Analogy ⇄ Precedent                │
│    Type: Parallel • Schemes: 2 • Conf: 0.85│
│    [Analyze Net] [View Graph]              │
└─────────────────────────────────────────────┘
```

**Integration**:
- Opens ArgumentNetAnalyzer in modal/sheet when clicked
- Shows NetGraphWithCQs
- Displays ComposedCQPanel for net CQs

#### Task 2.5: Migrate ASPIC Content
**File**: `components/deepdive/v3/sections/AspicNestedTab.tsx`

**Purpose**: Wrap existing ASPIC tab content with nested tabs

**Structure**:
```typescript
<NestedTabs
  id="aspic-subtabs"
  defaultValue="graph"
  tabs={[
    { value: 'graph', label: 'Graph', content: <AspicGraphTab /> },
    { value: 'extension', label: 'Extension', content: <AspicExtensionTab /> },
    { value: 'rationality', label: 'Rationality', content: <AspicRationalityTab /> }
  ]}
  variant="secondary"
/>
```

**Migration Steps**:
1. Copy existing ASPIC TabsContent from DeepDivePanelV2
2. Wrap in NestedTabs structure
3. No functional changes, just reorganization
4. Test all ASPIC features still work

---

### Day 5: Testing & Deployment (Friday)

#### Task 2.6: Comprehensive Testing

**Visual Tests**:
- [ ] Nested tabs visually distinct from parent
- [ ] Tab transitions smooth
- [ ] Active tab indicators clear
- [ ] Icons and badges positioned correctly
- [ ] Responsive layout works on mobile

**Functional Tests**:
- [ ] Tab switching works in all nested groups
- [ ] State persists across main tab changes
- [ ] Keyboard navigation works
- [ ] Scheme filtering works
- [ ] Net analyzer opens correctly
- [ ] ASPIC features still functional

**Integration Tests**:
- [ ] Phase 1 scheme detection displays correctly
- [ ] Phase 4 net analyzer integrates smoothly
- [ ] CQ panels load in Networks section
- [ ] No console errors or warnings

**Performance Tests**:
- [ ] Tab switch latency < 200ms
- [ ] No memory leaks on tab switching
- [ ] Bundle size increase < 20KB

#### Task 2.7: Deploy to Staging

**Feature Flag**:
```typescript
USE_NESTED_TABS: true  // Enable for staging
```

**Deployment Checklist**:
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Lint clean
- [ ] Build succeeds
- [ ] Deploy to staging
- [ ] Smoke test in staging
- [ ] Monitor for errors
- [ ] Gather user feedback

**Rollback Plan**:
```typescript
USE_NESTED_TABS: false  // Instant rollback if needed
```

---

## 📊 Success Metrics

### Code Metrics
- **New Files Created**: 5 (NestedTabs + 4 sections)
- **New LOC**: ~800
- **V2 LOC Reduction**: ~200 (ASPIC content moved)
- **Bundle Size Increase**: < 20KB

### Feature Metrics
- **Parent Tabs**: 9 → 6 (33% reduction)
- **Total Navigation Points**: Same (nested structure)
- **Phase 1 Integration**: ✓ Schemes browsable
- **Phase 4 Integration**: ✓ Nets visualizable

### UX Metrics (to measure)
- **Time to find scheme info**: Target < 5 seconds
- **Time to analyze net**: Target < 10 seconds
- **Tab switch latency**: Target < 200ms
- **User confusion**: Target 0 support tickets

---

## 🎨 Design Specifications

### NestedTabs Visual Design

**Primary Tabs** (existing):
```css
bg: white
text: slate-800
font-size: 14px
padding: 12px 16px
active: bg-indigo-100, border-bottom-2 indigo-600
```

**Secondary Tabs** (nested - NEW):
```css
bg: slate-50
text: slate-700
font-size: 12px
padding: 8px 12px
active: underline-2 indigo-500, text-indigo-700
margin-left: 16px (indent)
```

**Visual Hierarchy**:
```
Parent Tab (bold, large, full background)
  ├─ Nested Tab 1 (normal, small, underline only)
  ├─ Nested Tab 2
  └─ Nested Tab 3
```

---

## 🔄 Migration Path

### Phase A: Create NestedTabs Component
- No changes to DeepDivePanelV2 yet
- Standalone component development
- Unit tests

### Phase B: Extract ArgumentsTab
- Feature flag controlled
- Side-by-side comparison possible
- Gradual rollout

### Phase C: Add Scheme/Network Sections
- Incremental feature additions
- Each can be toggled independently
- Low risk (additive only)

### Phase D: Migrate ASPIC
- Final consolidation
- Remove old ASPIC tab from parent
- Complete nested structure

---

## 📚 Documentation Updates

### User Documentation
- [ ] Update navigation guide with nested tabs
- [ ] Create "How to analyze schemes" tutorial
- [ ] Create "How to explore nets" tutorial

### Developer Documentation
- [ ] Document NestedTabs API
- [ ] Document section component patterns
- [ ] Update V3 migration tracker

---

## 🚨 Risks & Mitigation

### Risk 1: User Confusion (Medium)
**Issue**: Users accustomed to flat 9-tab layout  
**Mitigation**:
- Clear visual hierarchy
- Tooltips on first use
- Gradual rollout with feedback
- Keep flat layout as fallback (feature flag)

### Risk 2: State Management Complexity (Low)
**Issue**: Nested tab state could conflict with parent  
**Mitigation**:
- Independent state per nested group
- localStorage keys include parent context
- Thorough testing of all state transitions

### Risk 3: Performance Regression (Low)
**Issue**: More components = more renders?  
**Mitigation**:
- React.memo on nested tabs
- Lazy load tab content
- Performance budget enforced
- A/B test with metrics

---

## ✅ Week 2 Completion Criteria

- [ ] NestedTabs component complete and tested
- [ ] Arguments tab refactored with 4 subtabs
- [ ] SchemesSection displays detected schemes
- [ ] NetworksSection displays multi-scheme nets
- [ ] ASPIC content migrated to nested structure
- [ ] All tests passing (visual, functional, performance)
- [ ] Deployed to staging successfully
- [ ] No P0/P1 bugs reported
- [ ] Documentation updated

---

## 📅 Timeline Summary

**Monday**: Create NestedTabs component  
**Tuesday**: NestedTabs testing & refinement  
**Wednesday**: Extract ArgumentsTab, create SchemesSection  
**Thursday**: Create NetworksSection, migrate ASPIC  
**Friday**: Comprehensive testing & staging deployment

**Total Effort**: 5 days  
**Next**: Week 3 - Custom Hooks Extraction

---

## 🎉 Expected Outcome

By end of Week 2:
- ✨ **Cleaner navigation**: 6 parent tabs instead of 9
- ✨ **Better organization**: Related features grouped hierarchically
- ✨ **Phase 1-4 surfaced**: Schemes and Nets easily discoverable
- ✨ **Scalable pattern**: Can add more nested tabs without cluttering
- ✨ **User validated**: Staging feedback gathered
- ✨ **Zero downtime**: Feature flag allows instant rollback

**Status after Week 2**: ~30% through migration, all patterns proven ✅
