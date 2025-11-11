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

## Phase 0: Preparation ✅ IN PROGRESS

**Week 1: November 11-17, 2025**

### Goals
- [x] Set up feature flags system ✅
- [x] Create shared component directory structure ✅
- [ ] Audit current imports and remove unused
- [ ] Document all current behaviors
- [x] Extract first component (SectionCard) as proof of concept ✅
- [x] Extract StickyHeader and ChipBar ✅ BONUS

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
- [ ] Update DeepDivePanelV2 to import from shared ⏳ NEXT
- [ ] Verify no visual/behavioral changes
- [ ] Deploy to staging

**Files to modify**:
- `components/deepdive/shared/SectionCard.tsx` (NEW)
- `components/deepdive/DeepDivePanelV2.tsx` (update import)

**Success criteria**:
- ✓ V2 file reduces from 2,128 → ~2,040 LOC
- ✓ All SectionCard usages work identically
- ✓ No visual regressions
- ✓ Lint passes
- ✓ Build succeeds

#### Task 1.4: Extract StickyHeader ✅ COMPLETE
- [x] Create `components/deepdive/shared/StickyHeader.tsx`
- [x] Copy implementation (lines ~150-185)
- [ ] Update imports ⏳ NEXT
- [ ] Verify scroll behavior unchanged

#### Task 1.5: Extract ChipBar ✅ COMPLETE
- [x] Create `components/deepdive/shared/ChipBar.tsx`
- [x] Extract pattern (lines ~362-370)
- [ ] Update all usages ⏳ NEXT

### Day 5: Review & Deploy

#### Task 1.6: Testing & Validation ⏳
- [ ] Manual testing: All tabs render correctly
- [ ] Visual comparison: Before/after screenshots
- [ ] Performance check: No render time regression
- [ ] Bundle size check: Should decrease slightly
- [ ] Deploy to production (Friday)

---

## Phase 1: Nested Tab Pattern Implementation

**Week 2: November 18-24, 2025**

### Goals
- [ ] Create NestedTabs component
- [ ] Implement Arguments tab with nesting
- [ ] Migrate ASPIC content to nested structure
- [ ] Add Phase 1-4 integrations (Schemes, Networks)

### Task 2.1: Create NestedTabs Component ⏳
**File**: `components/deepdive/shared/NestedTabs.tsx` (NEW)

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

### Task 2.3: Phase 1-4 Integration Points ⏳
- [ ] Add scheme detection indicators to argument cards
- [ ] Add "Analyze Net" button to arguments
- [ ] Create Schemes subtab (browse detected schemes)
- [ ] Create Networks subtab (net visualization)

---

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
- **Current LOC**: 2,128
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

## Next Actions (Today)

1. ✅ Create this tracker document
2. ✅ Set up feature flags file
3. ✅ Create directory structure  
4. ✅ Extract SectionCard component
5. ✅ Extract StickyHeader component (bonus!)
6. ✅ Extract ChipBar component (bonus!)
7. ⏳ **NOW**: Update DeepDivePanelV2.tsx imports
8. ⏳ Test all usages work correctly
9. ⏳ Deploy to staging

---

## Notes & Learnings

### 2025-11-11
- Decision made to use nested tabs pattern
- Approved incremental refactor over rewrite
- Week 1 extraction begins with SectionCard
