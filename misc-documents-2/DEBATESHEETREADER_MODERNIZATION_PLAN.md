# DebateSheetReader Modernization Plan

**Component**: `components/agora/DebateSheetReader.tsx`  
**Status**: 🔧 Needs Modernization  
**Priority**: HIGH (now integrated into DebateTab)  
**Created**: November 20, 2025

---

## 🎯 Executive Summary

DebateSheetReader is a critical component for visualizing argument networks, but it's using **outdated patterns and APIs**. Now that it's integrated into DeepDivePanelV2's DebateTab, it needs modernization to align with current system architecture.

### Key Issues Identified
1. ❌ **Obsolete API usage** - Still using `/api/sheets/[id]` with synthetic `delib:` IDs
2. ❌ **Redundant data fetching** - Fetches evidential + AIF separately (should use unified endpoint)
3. ❌ **Outdated components** - Uses `ArgumentPopout` (legacy) instead of `ArgumentActionsSheet` (current)
4. ❌ **Inconsistent styling** - Mixed panelv2/menuv2 classes, not aligned with current design system
5. ❌ **Missing features** - No support for new AIF features (ASPIC, preferences display)
6. ❌ **Weak TypeScript** - Uses `any` types extensively, weak prop validation

---

## 📊 Current Architecture Analysis

### Data Flow (Current - Problematic)

```
DebateSheetReader (sheetId="delib:123")
    ↓
1. Fetch sheet: /api/sheets/delib:123
   Returns: synthetic sheet with empty nodes/edges
    ↓
2. Extract deliberationId from sheetId
    ↓
3. Fetch AIF metadata: /api/deliberations/123/arguments/aif
   Returns: Array<{id, aif: {scheme, cq, attacks, preferences}}>
    ↓
4. Fetch evidential support: /api/deliberations/123/evidential?mode=product
   Returns: {nodes: [{id, score}], support: {}, dsSupport: {}}
    ↓
5. Build lookup maps (aifByArgId, supportByClaim)
    ↓
6. Render grid of argument cards
```

**Problems**:
- ❌ **3 separate API calls** for data that should be unified
- ❌ **Synthetic sheets don't have real nodes/edges** from DebateSheet table
- ❌ **No caching coordination** with other tabs
- ❌ **Redundant argument fetching** (ArgumentsTab already has this data)

### Current Component Structure

```tsx
DebateSheetReader
├─ State (10+ useState hooks - too many)
│  ├─ mode (confidence)
│  ├─ imports (materialized/virtual)
│  ├─ filterScheme, filterOpenCQs, filterAttacked
│  ├─ openNodeId, showArgsFor
│  ├─ previewNodeId, previewModalOpen
│  ├─ actionsSheetOpen, selectedArgumentForActions
│  └─ refreshCounter
│
├─ Data Fetching (3 separate SWR calls)
│  ├─ useSWR(/api/sheets/[id]) ← synthetic, mostly empty
│  ├─ useSWR(/api/deliberations/[id]/arguments/aif) ← real data
│  └─ useSWR(/api/deliberations/[id]/evidential) ← support scores
│
├─ UI Sections
│  ├─ Header (title, confidence selector, imports toggle)
│  ├─ Filters (scheme, CQs, attacked)
│  ├─ Loci status (from sheet)
│  ├─ Unresolved CQs list
│  └─ Main Grid (filtered nodes with badges)
│
└─ Modals
   ├─ ArgumentPopout (legacy - expand node) ← OUTDATED
   ├─ MiniNeighborhoodPreview (AIF graph preview)
   └─ ArgumentActionsSheet (actions modal)
```

---

## 🔧 Modernization Tasks

### Phase 1: API & Data Layer (PRIORITY)

#### Task 1.1: Replace Synthetic Sheet Pattern ⭐ CRITICAL
**Current**: Uses `/api/sheets/delib:123` which returns mostly empty data  
**Problem**: Synthetic sheets don't have DebateNodes/DebateEdges populated  
**Solution**: Directly fetch from deliberation instead of going through sheet indirection

**Before**:
```tsx
const { data, error } = useSWR(
  `/api/sheets/${sheetId}`,  // sheetId = "delib:123"
  fetcher
);
const delibId = sheetId.slice("delib:".length);
```

**After**:
```tsx
// Accept deliberationId directly as prop
export default function DebateSheetReader({ 
  deliberationId 
}: { 
  deliberationId: string 
}) {
  // Fetch directly from deliberation
  const { data, error } = useSWR(
    `/api/deliberations/${deliberationId}/arguments/full`,
    fetcher
  );
}
```

**Benefits**:
- ✅ Remove indirection through synthetic sheets
- ✅ Align with ArgumentsTab data source
- ✅ Enable future DebateSheet integration without breaking changes

#### Task 1.2: Create Unified Data Endpoint
**Current**: 3 separate fetches (sheet, AIF, evidential)  
**Solution**: Create `/api/deliberations/[id]/arguments/full` that returns everything

**New Endpoint**: `app/api/deliberations/[id]/arguments/full/route.ts`
```tsx
// Returns unified response with all needed data
{
  arguments: Array<{
    id: string;
    text: string;
    conclusionClaimId: string;
    premises: Premise[];
    // AIF metadata (inline, not separate fetch)
    aif: {
      scheme: { key: string; name: string };
      cq: { required: number; satisfied: number };
      attacks: { REBUTS: number; UNDERCUTS: number; UNDERMINES: number };
      preferences: { preferredBy: number; dispreferredBy: number };
    };
    // Evidential support (inline)
    support: number;  // or { bel, pl } for DS mode
    acceptance: "accepted" | "rejected" | "undecided";
  }>;
  claims: Array<{
    id: string;
    text: string;
    support: number;
  }>;
  stats: {
    totalArguments: number;
    totalClaims: number;
    schemeCounts: Record<string, number>;
  };
}
```

**Benefits**:
- ✅ Single round trip
- ✅ Consistent data shape
- ✅ Easier caching
- ✅ Reduced component complexity

#### Task 1.3: Implement SWR Cache Coordination
Share data with ArgumentsTab to avoid duplicate fetches.

**Pattern**:
```tsx
// Shared cache key pattern
const cacheKey = ['deliberation-arguments', deliberationId, mode, filters];

// Both DebateSheetReader and ArgumentsTab use same key
const { data } = useSWR(cacheKey, fetcher);
```

---

### Phase 2: Component Structure Refactor

#### Task 2.1: Extract Custom Hooks
**Problem**: 10+ useState hooks in single component  
**Solution**: Create focused custom hooks

**New Hooks**:
1. `useDebateFilters()` - Filter state and logic
   ```tsx
   const {
     filters,
     setSchemeFilter,
     setCQFilter,
     setAttackFilter,
     clearFilters,
     filteredArguments
   } = useDebateFilters(arguments);
   ```

2. `useDebateModals()` - Modal state management
   ```tsx
   const {
     previewModal,
     actionsModal,
     expandModal,
     openPreview,
     openActions,
     closeAll
   } = useDebateModals();
   ```

3. `useConfidenceMode()` - Already exists, use consistently

**Files to Create**:
- `components/deepdive/v3/hooks/useDebateFilters.ts`
- `components/deepdive/v3/hooks/useDebateModals.ts`

#### Task 2.2: Split Into Smaller Components
**Problem**: Single 600+ line component with mixed concerns  
**Solution**: Extract logical sections

**New Component Structure**:
```
DebateSheetReader (main coordinator)
├─ DebateSheetHeader
│  ├─ Title
│  ├─ ConfidenceModeSelector
│  └─ ImportsToggle
│
├─ DebateSheetFilters
│  ├─ SchemeFilter
│  ├─ CQFilter
│  ├─ AttackFilter
│  └─ ClearButton
│
├─ DebateSheetStats
│  ├─ TotalArguments
│  ├─ TotalClaims
│  └─ SchemeBreakdown
│
├─ DebateSheetMetadata (collapsible)
│  ├─ LociStatus
│  └─ UnresolvedCQsList
│
├─ DebateSheetGrid
│  └─ ArgumentNetworkCard[] (refactored card component)
│
└─ DebateSheetModals
   ├─ PreviewModal (MiniNeighborhoodPreview)
   ├─ ActionsModal (ArgumentActionsSheet)
   └─ ContributingArgsModal
```

**Files to Create**:
- `components/deepdive/v3/debate-sheet/` (new directory)
  - `DebateSheetHeader.tsx`
  - `DebateSheetFilters.tsx`
  - `DebateSheetStats.tsx`
  - `DebateSheetMetadata.tsx`
  - `DebateSheetGrid.tsx`
  - `ArgumentNetworkCard.tsx`
  - `DebateSheetModals.tsx`
  - `index.ts` (barrel export)

#### Task 2.3: Remove Legacy Components
**Replace**:
- ❌ `ArgumentPopout` → ✅ Use `ArgumentActionsSheet` exclusively
- ❌ Custom inline filter logic → ✅ Use `useDebateFilters` hook
- ❌ Inline support bar rendering → ✅ Use existing `SupportBar` component

**Files to Update**:
- Remove `ArgumentPopout` import
- Remove inline bar rendering code
- Consolidate to existing shared components

---

### Phase 3: TypeScript Improvements

#### Task 3.1: Define Proper Types
**Problem**: Extensive use of `any`, weak prop types  
**Solution**: Create comprehensive type definitions

**New Types File**: `components/deepdive/v3/debate-sheet/types.ts`
```tsx
export interface DebateSheetProps {
  deliberationId: string;
  className?: string;
}

export interface ArgumentNetworkNode {
  id: string;
  title: string;
  argumentId?: string;
  claimId?: string;
  aif?: {
    scheme?: { key: string; name: string };
    cq?: { required: number; satisfied: number };
    attacks?: AttackCounts;
    preferences?: PreferenceCounts;
  };
  support?: number | DSSupport;
  acceptance: AcceptanceLabel;
}

export interface DSSupport {
  bel: number;
  pl: number;
}

export type AcceptanceLabel = "accepted" | "rejected" | "undecided";

export interface AttackCounts {
  REBUTS: number;
  UNDERCUTS: number;
  UNDERMINES: number;
}

export interface PreferenceCounts {
  preferredBy: number;
  dispreferredBy: number;
}

export interface DebateFilters {
  scheme: string | null;
  openCQsOnly: boolean;
  attackedOnly: boolean;
}

export interface DebateSheetStats {
  totalArguments: number;
  totalClaims: number;
  schemeCounts: Record<string, number>;
  acceptanceCounts: Record<AcceptanceLabel, number>;
}
```

#### Task 3.2: Remove `any` Types
**Find and replace** all `any` types with proper interfaces:
```bash
# Before: 30+ instances of `any`
const nodes = data?.sheet?.nodes; // nodes: any[]

# After: Strongly typed
const nodes: ArgumentNetworkNode[] = data?.arguments ?? [];
```

---

### Phase 4: Styling Modernization

#### Task 4.1: Align with Current Design System
**Current Issues**:
- Mixed `panelv2`, `panelv2--aurora` classes
- Inconsistent spacing (gap-2, gap-3, gap-4 mixed)
- Old `menuv2--lite` for dropdowns
- Inconsistent border-radius (rounded, rounded-xl, rounded-lg)

**Design System Alignment**:
```tsx
// Use consistent classes from current system
<div className="surfacev2 panel-edge rounded-2xl p-4">  // Containers
<select className="menuv2--lite rounded-lg">            // Inputs
<button className="btnv2 btnv2--sm">                    // Buttons
<Card className="panelv2">                              // Cards
```

**File to Reference**: Check recent components for patterns
- `ThreadedDiscussionTab.tsx` (uses current patterns)
- `DebateTab.tsx` (recently updated)
- `ArgumentsTab.tsx` (Week 2 patterns)

#### Task 4.2: Responsive Design Review
**Current State**: Grid uses `md:grid-cols-2 lg:grid-cols-3`  
**Issues**:
- Cards too small on mobile
- Filters don't wrap well
- Header controls overflow

**Solution**:
```tsx
// Responsive grid
<ul className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

// Responsive filters
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">

// Responsive header
<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
```

---

### Phase 5: Feature Additions

#### Task 5.1: Add Sort Controls
**Currently Missing**: No way to sort arguments  
**Add**:
```tsx
<select className="menuv2--lite rounded-lg">
  <option value="default">Default Order</option>
  <option value="support-desc">Highest Support First</option>
  <option value="support-asc">Lowest Support First</option>
  <option value="scheme">Group by Scheme</option>
  <option value="recent">Most Recent First</option>
  <option value="cq-open">Open CQs First</option>
</select>
```

#### Task 5.2: Add Bulk Actions
**Feature**: Select multiple arguments for batch operations
```tsx
<div className="flex items-center gap-2">
  <input 
    type="checkbox" 
    checked={selectedAll}
    onChange={handleSelectAll}
  />
  <span className="text-sm">Select All</span>
  {selectedCount > 0 && (
    <>
      <span className="text-sm text-gray-500">
        {selectedCount} selected
      </span>
      <button className="btnv2 btnv2--sm">
        Compare Selected
      </button>
      <button className="btnv2 btnv2--sm">
        Export Selected
      </button>
    </>
  )}
</div>
```

#### Task 5.3: Add Empty States
**Currently**: Shows nothing when no arguments  
**Add**: Proper empty states with CTAs

```tsx
{filteredArguments.length === 0 ? (
  <Card className="p-12 text-center">
    {arguments.length === 0 ? (
      <>
        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 mb-4">No arguments yet</p>
        <button className="btnv2">
          Create First Argument
        </button>
      </>
    ) : (
      <>
        <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 mb-4">
          No arguments match your filters
        </p>
        <button className="btnv2" onClick={clearFilters}>
          Clear Filters
        </button>
      </>
    )}
  </Card>
) : (
  // Grid of arguments
)}
```

#### Task 5.4: Add Export Functionality
**Feature**: Export debate sheet as CSV/JSON
```tsx
const handleExport = (format: 'csv' | 'json') => {
  const exportData = filteredArguments.map(arg => ({
    id: arg.id,
    title: arg.title,
    scheme: arg.aif?.scheme?.key,
    support: arg.support,
    acceptance: arg.acceptance,
    cqStatus: `${arg.aif?.cq?.satisfied}/${arg.aif?.cq?.required}`,
    attacks: Object.values(arg.aif?.attacks || {}).reduce((a,b) => a+b, 0),
  }));

  if (format === 'csv') {
    downloadCSV(exportData, `debate-sheet-${deliberationId}.csv`);
  } else {
    downloadJSON(exportData, `debate-sheet-${deliberationId}.json`);
  }
};
```

---

## 📋 Implementation Checklist

### Phase 1: API & Data (2-3 days) ⭐ PRIORITY
- [ ] Task 1.1: Change prop from `sheetId` to `deliberationId`
- [ ] Task 1.2: Create `/api/deliberations/[id]/arguments/full` endpoint
- [ ] Task 1.3: Implement SWR cache coordination with ArgumentsTab
- [ ] Task 1.4: Update all data fetching to use new endpoint
- [ ] Task 1.5: Remove synthetic sheet logic

### Phase 2: Component Structure (3-4 days)
- [ ] Task 2.1: Extract `useDebateFilters` hook
- [ ] Task 2.2: Extract `useDebateModals` hook
- [ ] Task 2.3: Create `debate-sheet/` directory structure
- [ ] Task 2.4: Extract `DebateSheetHeader` component
- [ ] Task 2.5: Extract `DebateSheetFilters` component
- [ ] Task 2.6: Extract `DebateSheetGrid` component
- [ ] Task 2.7: Extract `ArgumentNetworkCard` component
- [ ] Task 2.8: Extract `DebateSheetModals` component
- [ ] Task 2.9: Refactor main component to use extracted pieces
- [ ] Task 2.10: Remove `ArgumentPopout` dependency

### Phase 3: TypeScript (1-2 days)
- [ ] Task 3.1: Create `debate-sheet/types.ts` with all interfaces
- [ ] Task 3.2: Replace all `any` types with proper types
- [ ] Task 3.3: Add prop validation with proper TypeScript
- [ ] Task 3.4: Fix all TypeScript errors

### Phase 4: Styling (1 day)
- [ ] Task 4.1: Audit and update all className usage
- [ ] Task 4.2: Align with current design system
- [ ] Task 4.3: Implement responsive breakpoints
- [ ] Task 4.4: Test on mobile/tablet/desktop

### Phase 5: Features (2-3 days)
- [ ] Task 5.1: Add sort controls
- [ ] Task 5.2: Add bulk actions (select multiple)
- [ ] Task 5.3: Add empty states with CTAs
- [ ] Task 5.4: Add export functionality (CSV/JSON)
- [ ] Task 5.5: Add loading skeletons
- [ ] Task 5.6: Add error states

### Phase 6: Testing & Polish (1-2 days)
- [ ] Write unit tests for hooks
- [ ] Write integration tests for main component
- [ ] Test all filter combinations
- [ ] Test modal interactions
- [ ] Performance testing with large datasets
- [ ] Accessibility audit (ARIA labels, keyboard nav)

---

## 🎯 Success Metrics

### Performance
- [ ] Initial render < 300ms (currently ~500ms with 3 API calls)
- [ ] Filter updates < 50ms
- [ ] SWR cache hit rate > 80%

### Code Quality
- [ ] Zero `any` types
- [ ] TypeScript strict mode passing
- [ ] Component LOC < 200 (currently 600+)
- [ ] Cyclomatic complexity < 10 per function

### User Experience
- [ ] All filters functional
- [ ] Export works for CSV and JSON
- [ ] Mobile responsive
- [ ] Accessible (WCAG AA)

---

## 🚀 Migration Strategy

### Stage 1: Backward Compatible (Week 1)
- Keep old `sheetId` prop but deprecate
- Add new `deliberationId` prop
- Support both patterns during transition

```tsx
export default function DebateSheetReader({ 
  sheetId,      // deprecated
  deliberationId // new
}: { 
  sheetId?: string; 
  deliberationId?: string;
}) {
  // Extract deliberationId from sheetId if needed
  const delibId = deliberationId ?? 
    (sheetId?.startsWith('delib:') ? sheetId.slice(6) : null);
  
  if (!delibId) {
    return <div>Error: No deliberation ID provided</div>;
  }
  
  // Use new unified endpoint
  const { data } = useSWR(
    `/api/deliberations/${delibId}/arguments/full`,
    fetcher
  );
}
```

### Stage 2: Update Callsites (Week 2)
Update DebateTab integration:
```tsx
// Before
<DebateSheetReader sheetId={`delib:${deliberationId}`} />

// After
<DebateSheetReader deliberationId={deliberationId} />
```

### Stage 3: Remove Deprecated (Week 3)
- Remove `sheetId` prop
- Remove synthetic sheet logic
- Clean up old API endpoints (if unused elsewhere)

---

## 📝 Notes

### Breaking Changes
- ✅ **Prop interface change**: `sheetId` → `deliberationId`
- ✅ **API endpoint change**: `/api/sheets/[id]` → `/api/deliberations/[id]/arguments/full`
- ✅ **Component removal**: `ArgumentPopout` no longer used

### Non-Breaking Changes
- ✅ All UI improvements
- ✅ Hook extractions
- ✅ TypeScript improvements
- ✅ Styling updates

### Compatibility
- ✅ Keep Agora page working during transition
- ✅ Don't break existing users of DebateSheetReader
- ✅ Feature flag for new endpoint (`USE_UNIFIED_ENDPOINT`)

---

**Last Updated**: November 20, 2025  
**Next Review**: After Phase 1 completion  
**Owner**: TBD
