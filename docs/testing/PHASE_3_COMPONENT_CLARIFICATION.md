# Phase 3 Component Clarification

**Date**: October 29, 2025  
**Issue**: Documentation incorrectly referenced "Arguments List" and "Debate tab" for AIFArgumentsListPro

---

## Key Clarification

### ✅ CORRECT: AIFArgumentsListPro in Models Tab

**Component**: `AIFArgumentsListPro.tsx` (from `/components/arguments/`)  
**Location**: DeepDivePanelV2 → **Models Tab** → "Arguments List (Argument Interchange Format)" section  
**Line in DeepDivePanelV2**: Line 1554

```tsx
<TabsContent value="models">
  <SectionCard title="Arguments List (Argument Interchange Format)">
    <AIFArgumentsListPro
      deliberationId={deliberationId}
      onVisibleTextsChanged={(texts) => {...}}
      dsMode={dsMode}  // Phase 3: Receives DS mode from header toggle
    />
  </SectionCard>
</TabsContent>
```

---

### ❌ INCORRECT: ArgumentsList (commented out)

**Component**: `ArgumentsList.tsx` (from `/components/deepdive/`)  
**Status**: **Commented out** in DeepDivePanelV2 (lines 1491-1497)  
**NOT USED**: This component is not active in the current implementation

```tsx
{/* 
  <SectionCard title="Arguments">
    <ArgumentsList
      deliberationId={deliberationId}
      selectedClaimId={selectedClaim?.id}
      onClaimClick={handleClaimSelect}
      ...
    />
  </SectionCard>
*/}
```

---

## What Changed in Phase 3

### Component Modified
- **AIFArgumentsListPro** was enhanced to:
  1. Accept `dsMode` prop from DeepDivePanelV2
  2. Pass Phase 3 props to ArgumentCardV2:
     - `createdAt` (temporal tracking)
     - `updatedAt` (stale detection)
     - `confidence` (display)
     - `dsMode` (interval format toggle)

### Component NOT Modified
- **ArgumentsList** (old component) remains untouched and unused

---

## Tab Structure in DeepDivePanelV2

### Debate Tab
**Components**:
- PropositionComposerPro
- PropositionsList
- ClaimMiniMap
- DialogueInspector

**No argument cards** - This tab focuses on propositions and claims, not structured arguments.

### Models Tab ⭐
**Components**:
- AIFAuthoringPanel (argument composer)
- **AIFArgumentsListPro** (argument browser with ArgumentCardV2)

**This is where Phase 3 badges appear!**

### Other Tabs
- Ludics, Issues, CQ Review, Thesis (existing)
- **Assumptions** (Phase 3 new tab)
- **Hom-Sets** (Phase 3 new tab)

---

## Phase 3 Features Location Summary

| Feature | Tab | Component | Card Component |
|---------|-----|-----------|----------------|
| DS Mode Toggle | All (Header) | DeepDivePanelV2 | N/A |
| Dialogue State Badge | **Models** | AIFArgumentsListPro | ArgumentCardV2 |
| Stale Argument Badge | **Models** | AIFArgumentsListPro | ArgumentCardV2 |
| Confidence Display | **Models** | AIFArgumentsListPro | ArgumentCardV2 |
| Assumptions Tab | Assumptions | AssumptionsTab | N/A |
| Hom-Sets Tab | Hom-Sets | HomSetsTab | N/A |

---

## Why This Matters

### User Testing
- Testers need to navigate to **Models tab** to see argument badges
- Looking in Debate tab won't show ArgumentCardV2 or Phase 3 badges
- All documentation has been updated to reflect this

### Development
- Future enhancements to argument cards should modify **AIFArgumentsListPro**, not ArgumentsList
- ArgumentsList is legacy and may be removed in future refactoring
- Phase 3 integration correctly targeted the active component (AIFArgumentsListPro)

---

## Documentation Updated

All Phase 3 docs now correctly reference:
1. **"Models tab"** (not "Debate tab")
2. **"AIFArgumentsListPro"** (explicitly named, not "Arguments List section")
3. Component hierarchy clearly shows AIFArgumentsListPro location

### Files Updated
- ✅ `PHASE_3_USER_FLOW_CHECKLIST.md` - Added warning banner, corrected all tab references
- ✅ `PHASE_3_QUICK_REFERENCE.md` - Updated paths, component map
- ✅ `PHASE_3_FULLY_FUNCTIONAL_SUMMARY.md` - Already correct (references AIFArgumentsListPro)

---

## Quick Verification

To verify the correct component is being used:

```bash
# Check DeepDivePanelV2 imports
grep "import.*Arguments" components/deepdive/DeepDivePanelV2.tsx

# Result should show:
# import ArgumentsList from "./ArgumentsList";  # Legacy, not used
# import AIFArgumentsListPro from '@/components/arguments/AIFArgumentsListPro';  # Active

# Check active usage
grep "<AIFArgumentsListPro" components/deepdive/DeepDivePanelV2.tsx
# Should show line 1554 in Models tab with dsMode prop

# Check commented usage
grep -A 5 "<ArgumentsList" components/deepdive/DeepDivePanelV2.tsx
# Should show commented out block in Debate tab
```

---

## Summary

✅ **Phase 3 correctly integrates with AIFArgumentsListPro (active component)**  
✅ **AIFArgumentsListPro is located in Models tab**  
✅ **ArgumentsList (legacy) is commented out and not used**  
✅ **All documentation now reflects accurate component and location**  

**Next Steps**: User testing should follow updated checklist paths (Models tab, not Debate tab).
