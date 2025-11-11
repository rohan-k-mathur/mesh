# DeepDivePanel V3 Migration Tracker

**Strategy**: Incremental Refactor ("Ship of Theseus")  
**Timeline**: 11 weeks  
**Current Phase**: Phase 0 - Preparation  
**Start Date**: November 11, 2025

---

## Decision Log

### ✅ **Nested Tab Architecture** (Approved)
**Decision**: Use hierarchical nested tabs instead of flat 9-tab structure  
**Pattern**: Parent tabs with nested TabsList (like current ASPIC tab)  
**Rationale**: Reduces cognitive load, better visual hierarchy, scalable

**Proposed Global Tab Structure** (6 parent tabs):
```
1. 💬 Debate
   └─ Single view (no nesting needed)

2. 🎯 Arguments
   ├─ List (default)
   ├─ Schemes
   ├─ Networks
   └─ ASPIC
       ├─ Graph
       ├─ Extension
       └─ Rationality

3. 🎮 Dialogue
   ├─ Moves
   └─ Ludics
       ├─ Compilation
       └─ Behaviours

4. 📚 Knowledge
   ├─ Sources
   ├─ Thesis
   └─ Dictionary

5. 📊 Analytics
   ├─ Categorical
   ├─ HomSets
   └─ Topology

6. ⚙️  Admin
   ├─ Settings
   ├─ Works
   └─ Moderation
```

### 🔄 **Migration Strategy** (Confirmed)
- **Approach**: Incremental extraction, not rewrite
- **Deployment**: Weekly incremental deployments
- **Rollback**: Feature flags allow instant rollback per component
- **Testing**: Side-by-side validation before deprecation

---

## Phase 0: Preparation ✅ COMPLETE (Days 1-2)

**Week 1: November 11-17, 2025**
**Current Day**: Day 3 - Staging Deployment Preparation

### Goals
- [x] Set up feature flags system ✅
- [x] Create shared component directory structure ✅
- [ ] Audit current imports and remove unused
- [ ] Document all current behaviors
- [x] Extract first component (SectionCard) as proof of concept ✅
- [x] Extract StickyHeader and ChipBar ✅ BONUS
- [x] Visual regression testing ✅
- [x] Verify zero regressions ✅

### Day 1-2: Infrastructure Setup

#### Task 1.1: Create Feature Flags ✅ COMPLETE
**File**: `lib/features/flags.ts` (CREATED)
```typescript
export const DELIBERATION_FEATURES = {
  USE_V3_PANEL: false,
  USE_NESTED_TABS: false,
  USE_EXTRACTED_SECTION_CARD: false,
  USE_EXTRACTED_HOOKS: false,
  SHOW_SCHEME_INDICATORS: true,
  ENABLE_NET_ANALYZER: true,
} as const;

export type DeliberationFeatureFlag = keyof typeof DELIBERATION_FEATURES;

export function isFeatureEnabled(flag: DeliberationFeatureFlag): boolean {
  // Check env vars first
  const envFlag = process.env[`NEXT_PUBLIC_FEATURE_${flag}`];
  if (envFlag !== undefined) {
    return envFlag === "true";
  }
  // Fall back to default
  return DELIBERATION_FEATURES[flag];
}
```

#### Task 1.2: Create Directory Structure ✅ COMPLETE
```
components/
├── deepdive/
│   ├── DeepDivePanelV2.tsx          (existing - will refactor)
│   ├── v3/                           (CREATED)
│   │   ├── index.tsx                 (future V3 entry)
│   │   ├── hooks/                    (CREATED)
│   │   ├── tabs/                     (CREATED)
│   │   ├── sheets/                   (CREATED)
│   │   └── sections/                 (CREATED)
│   └── shared/                       (CREATED - shared components)
│       ├── SectionCard.tsx          (CREATED)
│       ├── StickyHeader.tsx         (CREATED)
│       ├── ChipBar.tsx              (CREATED)
│       ├── types.ts                 (CREATED)
│       └── index.ts                 (CREATED - barrel export)
```

### Day 3-4: Component Extraction

#### Task 1.3: Extract SectionCard ✅ COMPLETE
- [x] Create `components/deepdive/shared/SectionCard.tsx`
- [x] Copy implementation from DeepDivePanelV2 (lines ~186-360)
- [x] Add proper TypeScript interface
- [x] Update DeepDivePanelV2 to import from shared
- [x] Verify no visual/behavioral changes 🔄 DAY 2 IN PROGRESS
- [ ] Deploy to staging

**Files to modify**:
- `components/deepdive/shared/SectionCard.tsx` (NEW)
- `components/deepdive/DeepDivePanelV2.tsx` (update import)

**Success criteria**:
- ✓ V2 file reduces from 2,128 → ~1,926 LOC (202 LOC removed) ✅
- ✓ All SectionCard usages work identically
- ✓ No visual regressions ⏳ TESTING NEEDED
- ✓ Lint passes (only pre-existing warnings) ✅
- ✓ Build succeeds (no new TypeScript errors) ✅

#### Task 1.4: Extract StickyHeader ✅ COMPLETE
- [x] Create `components/deepdive/shared/StickyHeader.tsx`
- [x] Copy implementation (lines ~150-185)
- [x] Update imports
- [x] Verify scroll behavior unchanged ⏳ TESTING NEEDED

#### Task 1.5: Extract ChipBar ✅ COMPLETE
- [x] Create `components/deepdive/shared/ChipBar.tsx`
- [x] Extract pattern (lines ~362-370)
- [x] Update all usages

### Day 2: Visual Regression Testing ✅ COMPLETE

#### Task 1.6: Component Testing ✅
- [x] Test SectionCard in all 9 tabs
- [x] Test ChipBar in metadata displays
- [x] Test StickyHeader scroll behavior
- [x] Test hover effects and animations
- [x] Test loading/empty/busy states
- [x] Test tone variants (5 types)
- [x] Test dark mode
- [x] Document any issues found

**Result**: All tests passed! Components render identically to inline versions.

### Day 3-4: Issue Resolution & Refinement

#### Task 1.7: Fix Any Regressions ⏳
- [ ] Address visual issues (if any)
- [ ] Fix behavioral bugs (if any)
- [ ] Performance optimizations (if needed)
- [ ] Update tests

### Day 5: Review & Deploy

#### Task 1.8: Final Validation & Deploy ⏳
- [ ] Final visual comparison
- [ ] Performance check: No render time regression
- [ ] Bundle size check: Should decrease slightly
- [ ] Deploy to production (Friday)

---

## Phase 1: Nested Tab Pattern Implementation 🔄 IN PROGRESS

**Week 2: November 11-17, 2025**
**Current Day**: Day 3 (Starting Week 2 early due to Week 1 completion)

### Goals
- [ ] Create NestedTabs component
- [ ] Implement Arguments tab with nesting
- [ ] Migrate ASPIC content to nested structure
- [ ] Add Phase 1-4 integrations (Schemes, Networks)

### Task 2.1: Create NestedTabs Component ✅ COMPLETE
- [x] Create `components/deepdive/shared/NestedTabs.tsx`
- [x] Implement primary variant (parent tabs)
- [x] Implement secondary variant (nested tabs)
- [x] Add localStorage persistence
- [x] Add icon support
- [x] Add badge support
- [x] TypeScript interfaces exported
- [x] Dark mode support
- [x] Create test page (`/test/nested-tabs`)
- [x] Verify compilation (0 errors)

**Result**: Component complete and ready for integration! 🎉

### Task 2.2: Extract ArgumentsTab Component ✅ COMPLETE
- [x] Create `components/deepdive/v3/tabs/ArgumentsTab.tsx`
- [x] Implement NestedTabs with 4 subtabs (List, Schemes, Networks, ASPIC)
- [x] Migrate Arguments list content from DeepDivePanelV2
- [x] Add placeholder sections for Schemes and Networks
- [x] Add placeholder for ASPIC migration
- [x] Update DeepDivePanelV2 to use ArgumentsTab
- [x] Verify compilation (0 new errors)

**Result**: 
- DeepDivePanelV2: 1,926 → 1,855 LOC (71 LOC reduction)
- ArgumentsTab: 175 LOC (new file)
- Nested tabs working with 4 subtabs! 🎉

```typescript
interface NestedTabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}

// Component that handles nested tab state independently
```

### Task 2.2: Refactor Arguments Tab ⏳
**Current**: Single "Arguments" tab with AIFArgumentsListPro
**New**: Arguments parent with nested tabs:
- List (default - current AIFArgumentsListPro)
- Schemes (Phase 1 integration - scheme browser)
- Networks (Phase 4 integration - ArgumentNetAnalyzer)
- ASPIC (move existing ASPIC tab content here)

### Task 2.3: Create SchemesSection Component ✅ COMPLETE
- [x] Create `components/deepdive/v3/sections/SchemesSection.tsx`
- [x] Fetch arguments with schemes from AIF API
- [x] Group arguments by scheme using useMemo
- [x] Create SchemeCard subcomponent with expand/collapse
- [x] Display scheme metadata (name, key, argument count, confidence)
- [x] Show expandable argument list (preview 5, indicate more)
- [x] Handle empty text by constructing from premises/conclusion
- [x] Add loading/error/empty states
- [x] Link to scheme definitions at `/schemes/{key}`
- [x] Add summary statistics footer
- [x] Integrate into ArgumentsTab "schemes" subtab
- [x] Verify compilation (0 errors)
- [x] Test in browser - expand/collapse working

**Result**: 
- SchemesSection: 275 LOC (new file)
- Phase 1 scheme detection integrated into UI! 🎉
- Arguments display correctly with premise → conclusion format
- Expandable scheme cards with confidence scores working

### Task 2.4: Create NetworksSection Component ✅ COMPLETE
- [x] Create `components/deepdive/v3/sections/NetworksSection.tsx`
- [x] Fetch nets from `/api/nets/detect` (POST with deliberationId)
- [x] Display net cards with:
  - Net type (serial/convergent/linked/divergent/hybrid)
  - Scheme composition with expand/collapse
  - Confidence and complexity scores
  - "Analyze Net" button
- [x] Open ArgumentNetAnalyzer in dialog on button click
- [x] Add loading/error/empty states
- [x] Add summary statistics footer
- [x] Integrate into ArgumentsTab "networks" subtab
- [x] Verify compilation (0 errors)

**Result**: 
- NetworksSection: 340 LOC (new file)
- Phase 4 multi-scheme net detection integrated into UI! 🎉
- NetCard component with type-specific icons and colors
- ArgumentNetAnalyzer opens in full-screen dialog for deep analysis

### Task 2.5: Migrate ASPIC Content ⏳ NEXT

## Phase 2: Extract Custom Hooks

**Week 3: November 25 - December 1, 2025**

### Goals
- [ ] Create useDeliberationData hook
- [ ] Create useDeliberationState hook
- [ ] Create useSheetPersistence hook
- [ ] Reduce useState bloat in V2

---

## Phase 3: Tab Extraction

**Week 4-5: December 2-15, 2025**

### Goals
- [ ] Extract DebateTab.tsx
- [ ] Extract ArgumentsTab.tsx (with nested structure)
- [ ] Extract DialogueTab.tsx
- [ ] Extract remaining tabs

---

## Progress Metrics

### Code Metrics
- **Current LOC**: 1,926 (reduced from 2,128) ✅
- **LOC Removed**: 202 (3 components extracted)
- **Target LOC** (after Phase 1): ~1,850
- **Target LOC** (after Phase 3): ~800
- **Final V3 Entry LOC**: ~150

### Feature Progress
- **Shared Components**: 3/5 extracted (SectionCard, ChipBar, StickyHeader) ✅
- **Custom Hooks**: 0/4 created
- **Tabs Extracted**: 0/6 completed
- **Phase 1-4 Integration**: 0/4 features surfaced

### Deployment Status
- **Week 1 Deploy**: Not yet scheduled
- **Week 2 Deploy**: Not yet scheduled
- **Production Rollout**: Not yet scheduled

---

## Risk Register

### Active Risks
1. **State Management Complexity** (Medium)
   - 25+ useState hooks make refactor tricky
   - Mitigation: Extract hooks incrementally, test each

2. **Event Listener Cleanup** (Low)
   - Multiple window.addEventListener calls
   - Mitigation: Verify cleanup in useEffect returns

3. **SWR Cache Invalidation** (Medium)
   - Complex mutate patterns for real-time updates
   - Mitigation: Document current behavior, preserve exactly

### Resolved Risks
- None yet

---

## Testing Checklist (Per Component)

For each extracted component:
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Visual regression test (screenshot comparison)
- [ ] Functional test (user interactions work)
- [ ] Performance test (no render time increase)
- [ ] Accessibility test (keyboard nav, screen readers)
- [ ] Mobile responsive test
- [ ] Dark mode test

---

## Rollback Procedures

### If SectionCard extraction fails:
```typescript
// In DeepDivePanelV2.tsx
// Remove: import { SectionCard } from './shared/SectionCard'
// Paste back original SectionCard definition
// Commit & deploy
```

### If entire week fails:
```bash
git revert HEAD~5  # Revert week's commits
npm run build && npm run deploy
```

---

## Communication Plan

### Stakeholder Updates
- **Monday**: Week plan posted
- **Wednesday**: Mid-week progress update
- **Friday**: Week completion summary + demo

### User Communication
- No user-facing announcements until Phase 6 (Beta)
- Changes should be invisible during extraction phases

---

## Next Actions (Day 3-5 - This Week)

### Day 3 (Today): Continue Development
Since Week 1 goals are accomplished ahead of schedule, we can:

**Option A: Deploy to Production Early**
1. ⏳ Final verification (all tabs working)
2. ⏳ Commit changes with descriptive message
3. ⏳ Push to main branch
4. ⏳ Monitor production for any issues

**Option B: Begin Week 2 Work Early** (Recommended)
1. ⏳ Start NestedTabs component implementation
2. ⏳ Create basic component structure
3. ⏳ Add localStorage persistence
4. ⏳ Test nested tab pattern

### Day 4-5: Week 2 Jumpstart
- Begin Phase 1-4 integration (Schemes, Networks subtabs)
- Prepare ArgumentsTab refactor
- Week 2 documentation

---

## Notes & Learnings

### 2025-11-11 (Day 1 - Evening)
- ✅ Successfully extracted 3 shared components (SectionCard, ChipBar, StickyHeader)
- ✅ Updated DeepDivePanelV2.tsx to import from `./shared`
- ✅ File reduced from 2,128 → 1,926 LOC (202 LOC removed, 9.5% reduction)
- ✅ All TypeScript compilation passes (no new errors)
- ✅ Lint passes (only pre-existing warnings about useEffect dependencies)
- ⏳ Next: Visual testing to confirm no behavioral changes

---

### Notes & Learnings

### 2025-11-11 (Day 2 - Complete)
- **Testing completed**: All 9 tabs tested, zero regressions from extraction ✅
- **Issue found & fixed**: Pre-existing bug in `argument-scheme-compat.ts` (null-safety)
- **Confirmation**: Day 1 extraction was perfect - no issues with SectionCard, ChipBar, or StickyHeader
- **Status**: Week 1 Phase 0 complete ahead of schedule! 🎉
- **Next**: Option to deploy early OR begin Week 2 NestedTabs work

### 2025-11-11 (Day 1)
- Decision made to use nested tabs pattern
- Approved incremental refactor over rewrite
- Week 1 extraction begins with SectionCard
