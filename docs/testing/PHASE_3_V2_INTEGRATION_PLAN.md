# Phase 3 Integration into V2/V3 Components

## Overview

Phase 3 UI components need to be integrated into the **currently active** component versions (V2/V3), not the legacy V1 components.

## Component Hierarchy (Current State)

### Active Component Chain

```
app/deliberation/[id]/page.tsx
  └─> DeliberationReader (DeliberationPage.tsx)
      └─> DeepDivePanelV2.tsx ✅ ACTIVE
          └─> AIFArgumentsListPro.tsx
              └─> ArgumentCardV2.tsx ✅ ACTIVE
                  ├─> AttackMenuProV2.tsx ✅ ACTIVE  
                  └─> CriticalQuestionsV3.tsx ✅ ACTIVE (via ArgumentCriticalQuestionsModal)
```

### Legacy Components (NOT IN USE)
- ❌ DeepDivePanel.tsx (V1) - replaced by DeepDivePanelV2
- ❌ ArgumentCard.tsx (V1) - replaced by ArgumentCardV2
- ❌ AttackMenuPro.tsx (V1) - replaced by AttackMenuProV2
- ❌ CriticalQuestionsV2.tsx - replaced by CriticalQuestionsV3

---

## Phase 3 Features to Integrate

### 1. Dialogue Tracking Components

**Target Component**: `ArgumentCardV2.tsx`

**Integrations Needed**:
- ✅ Add `DialogueStateBadge` to show X/Y attacks answered
- ✅ Add button to open `AnsweredAttacksPanel`
- ✅ Integrate `ResponseVoteWidget` into attack displays

**Location**: Display badge prominently near argument header

---

### 2. Temporal Decay Components

**Target Component**: `ArgumentCardV2.tsx`

**Integrations Needed**:
- ✅ Add `StaleArgumentBadge` when argument is > 7 days old
- ✅ Include `DecayExplanationTooltip` on hover
- ✅ Show original vs. adjusted confidence with decay factor

**Location**: Near confidence display or timestamp

---

### 3. Dempster-Shafer Components

**Target Component**: `ArgumentCardV2.tsx` + `AIFArgumentsListPro.tsx`

**Integrations Needed**:
- ✅ Add DS mode toggle (global state or context)
- ✅ Replace `ConfidenceDisplay` to support DS intervals [bel, pl]
- ✅ Add `DSIntervalChart` in expanded argument view
- ✅ Include `DSExplanationTooltip` on confidence hover

**Location**: 
- Toggle in DeepDivePanelV2 header
- DS displays in ArgumentCardV2

---

### 4. Assumption Management Components

**Target Component**: `DeepDivePanelV2.tsx`

**Integrations Needed**:
- ✅ Add new "Assumptions" tab to existing tab system
- ✅ Display `ActiveAssumptionsPanel` in tab
- ✅ Render `AssumptionCard` for each assumption
- ✅ Include `CreateAssumptionForm` for new assumptions
- ✅ Show `AssumptionDependencyGraph` in assumption detail view

**Location**: New tab in DeepDivePanelV2 tab list

---

### 5. Hom-Set Analysis Components

**Target Component**: `ArgumentCardV2.tsx` (expandable section)

**Integrations Needed**:
- ✅ Add "Categorical Analysis" collapsible section
- ✅ Display `HomSetConfidencePanel` with aggregate metrics
- ✅ Render `MorphismCard` for each edge
- ✅ Add `HomSetComparisonChart` in DeepDivePanelV2 overview

**Location**:
- ArgumentCardV2: Collapsible section after attacks
- DeepDivePanelV2: New "Hom-Sets" tab or in Arguments tab header

---

## Integration Tasks

### Task 1: ArgumentCardV2 Enhancements ⭐ HIGH PRIORITY

**File**: `components/arguments/ArgumentCardV2.tsx`

**Changes**:
1. Import Phase 3 components:
   ```typescript
   import { DialogueStateBadge } from "@/components/dialogue/DialogueStateBadge";
   import { StaleArgumentBadge } from "@/components/arguments/StaleArgumentBadge";
   import { ConfidenceDisplay } from "@/components/confidence/ConfidenceDisplay";
   import { DSIntervalChart } from "@/components/confidence/DSIntervalChart";
   import { HomSetConfidencePanel } from "@/components/agora/HomSetConfidencePanel";
   ```

2. Add badges to header:
   ```tsx
   <div className="flex items-center gap-2">
     <DialogueStateBadge 
       deliberationId={deliberationId}
       argumentId={id}
     />
     <StaleArgumentBadge 
       lastUpdatedAt={argument.updatedAt}
     />
   </div>
   ```

3. Replace confidence display with Phase 3 version

4. Add collapsible "Categorical Analysis" section with HomSetConfidencePanel

**Estimated Lines**: ~100 lines added

---

### Task 2: DeepDivePanelV2 Assumptions Tab ⭐ HIGH PRIORITY

**File**: `components/deepdive/DeepDivePanelV2.tsx`

**Changes**:
1. Import assumption components:
   ```typescript
   import { ActiveAssumptionsPanel } from "@/components/assumptions/ActiveAssumptionsPanel";
   import { CreateAssumptionForm } from "@/components/assumptions/CreateAssumptionForm";
   ```

2. Add "Assumptions" tab to existing tab list (around line ~1400):
   ```tsx
   <TabsTrigger value="assumptions">
     <Shield className="h-4 w-4 mr-2" />
     Assumptions
   </TabsTrigger>
   ```

3. Add corresponding TabsContent:
   ```tsx
   <TabsContent value="assumptions">
     <div className="space-y-4">
       <CreateAssumptionForm deliberationId={deliberationId} />
       <ActiveAssumptionsPanel deliberationId={deliberationId} />
     </div>
   </TabsContent>
   ```

**Estimated Lines**: ~50 lines added

---

### Task 3: DS Mode Toggle in DeepDivePanelV2

**File**: `components/deepdive/DeepDivePanelV2.tsx`

**Changes**:
1. Create DS mode context or use local storage state

2. Add toggle button in header (near existing filters):
   ```tsx
   <button
     onClick={() => setDsMode(!dsMode)}
     className="flex items-center gap-2 px-3 py-1 rounded-md border"
   >
     DS Mode: {dsMode ? "ON" : "OFF"}
   </button>
   ```

3. Pass dsMode state down to ArgumentCardV2 via context or props

**Estimated Lines**: ~30 lines added

---

### Task 4: AIFArgumentsListPro DS Mode Support

**File**: `components/arguments/AIFArgumentsListPro.tsx`

**Changes**:
1. Accept dsMode prop

2. Pass dsMode to all ArgumentCardV2 instances

**Estimated Lines**: ~10 lines modified

---

### Task 5: Hom-Set Comparison Chart in DeepDivePanelV2

**File**: `components/deepdive/DeepDivePanelV2.tsx`

**Changes**:
1. Import HomSetComparisonChart

2. Add chart above argument list or in new "Analysis" tab:
   ```tsx
   <HomSetComparisonChart
     deliberationId={deliberationId}
     direction="incoming"
   />
   ```

**Estimated Lines**: ~20 lines added

---

## Implementation Order

### Phase 1: Critical Integrations (Day 1-2)
1. ✅ ArgumentCardV2: Add DialogueStateBadge
2. ✅ ArgumentCardV2: Add StaleArgumentBadge
3. ✅ DeepDivePanelV2: Add Assumptions tab

### Phase 2: DS Mode (Day 3)
4. ✅ DeepDivePanelV2: Add DS mode toggle
5. ✅ ArgumentCardV2: Integrate ConfidenceDisplay with DS support
6. ✅ ArgumentCardV2: Add DSIntervalChart in expanded view

### Phase 3: Advanced Features (Day 4-5)
7. ✅ ArgumentCardV2: Add HomSetConfidencePanel section
8. ✅ DeepDivePanelV2: Add HomSetComparisonChart
9. ✅ Testing and refinement

---

## Testing Strategy

### Unit Tests
- Test ArgumentCardV2 with Phase 3 components
- Test DeepDivePanelV2 Assumptions tab
- Test DS mode toggle state management

### Integration Tests
- Update Playwright tests to use V2/V3 components
- Test full user workflows in actual UI

### Manual Testing
- Follow phase-3-user-testing-plan.md
- Verify all features work in DeepDivePanelV2 context

---

## Migration Notes

### Breaking Changes
None - Phase 3 is additive, no existing functionality removed

### Backwards Compatibility
- Legacy V1 components remain untouched
- Phase 3 features only added to V2/V3 components
- Can toggle features on/off via settings

### Feature Flags (Optional)
Consider adding feature flags for:
- DS mode (default OFF for simplicity)
- Hom-set analysis (default ON)
- Temporal decay (default ON)

---

## Next Steps

1. **Start with ArgumentCardV2** - Most visible impact
2. **Add Assumptions tab** - New functionality, easy to test
3. **Implement DS mode** - More complex, requires state management
4. **Polish and test** - Ensure all integrations work smoothly

---

## Questions to Resolve

1. **DS Mode State**: Global context vs. localStorage vs. user preference in DB?
2. **Badge Placement**: ArgumentCardV2 header is crowded - where to put badges?
3. **Hom-Set Tab**: Separate tab or integrate into Arguments tab?
4. **Performance**: Many badges rendering simultaneously - virtualization needed?

---

**Ready to begin integration into V2/V3 components!**
