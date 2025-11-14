# SchemeAdditionDialog Integration Guide

**Component**: `components/argumentation/SchemeAdditionDialog.tsx`  
**Phase**: Phase 2 - Multi-Scheme Foundation  
**Status**: ✅ Component Created  
**Effort**: 2 hours (component creation)  
**Remaining**: 4 hours (integration + testing)

---

## Component Overview

The `SchemeAdditionDialog` component enables users to add supporting schemes to existing arguments, creating multi-scheme argument nets. This is the first step in Phase 2 of the multi-scheme argument support roadmap.

### Features Implemented ✅

1. **Scheme Search & Selection**
   - Search by name, description, category, materialRelation, reasoningType
   - Filters out already-added schemes
   - Visual selection with radio-style UI
   - Badge display for scheme metadata

2. **Role Configuration**
   - Supporting: Strengthens the primary argument
   - Presupposed: Assumed by the primary argument
   - Implicit: Not stated but implied

3. **Explicitness Configuration**
   - Explicit: Clearly stated in argument text
   - Presupposed: Assumed as background knowledge
   - Implied: Can be inferred but not stated

4. **Confidence Slider**
   - 0-100% confidence level
   - Default: 75%
   - Real-time percentage display

5. **Optional Fields**
   - Text Evidence: Quote/passage demonstrating scheme usage
   - Justification: Reasoning for adding this scheme

6. **API Integration**
   - POST `/api/arguments/[id]/schemes`
   - Event dispatching: `arguments:changed`
   - Error handling and loading states

---

## Integration Points

### 1. ArgumentCardV2 Integration

**File**: `components/deepdive/v3/ArgumentCardV2.tsx` (or similar)

```tsx
import { SchemeAdditionDialog } from "@/components/argumentation/SchemeAdditionDialog";
import { Plus } from "lucide-react";
import { useState } from "react";

function ArgumentCardV2({ argument, deliberationId }) {
  const [showSchemeAddition, setShowSchemeAddition] = useState(false);

  return (
    <div>
      {/* Existing scheme display */}
      <div className="flex items-center justify-between">
        <SchemesDisplay 
          schemes={argument.argumentSchemes || []} 
          schemeName={argument.schemeName}
        />
        
        {/* NEW: Add Scheme button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowSchemeAddition(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Scheme
        </Button>
      </div>

      {/* NEW: SchemeAdditionDialog */}
      <SchemeAdditionDialog
        open={showSchemeAddition}
        onClose={() => setShowSchemeAddition(false)}
        argumentId={argument.id}
        deliberationId={deliberationId}
        existingSchemes={argument.argumentSchemes || []}
        onSchemeAdded={(schemeInstanceId) => {
          console.log("Scheme added:", schemeInstanceId);
          setShowSchemeAddition(false);
          // Optional: Trigger refresh or show success message
        }}
      />
    </div>
  );
}
```

### 2. ArgumentDetailPanel Integration

**File**: `components/argumentation/ArgumentDetailPanel.tsx` (if exists)

```tsx
import { SchemeAdditionDialog } from "@/components/argumentation/SchemeAdditionDialog";

function ArgumentDetailPanel({ argument, deliberationId }) {
  const [showSchemeAddition, setShowSchemeAddition] = useState(false);

  return (
    <div>
      {/* Schemes section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Schemes</h3>
          <Button
            size="sm"
            onClick={() => setShowSchemeAddition(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Scheme
          </Button>
        </div>

        {/* Scheme list display */}
        <SchemeList schemes={argument.argumentSchemes} />
      </section>

      {/* Dialog */}
      <SchemeAdditionDialog
        open={showSchemeAddition}
        onClose={() => setShowSchemeAddition(false)}
        argumentId={argument.id}
        deliberationId={deliberationId}
        existingSchemes={argument.argumentSchemes || []}
        onSchemeAdded={(schemeInstanceId) => {
          setShowSchemeAddition(false);
        }}
      />
    </div>
  );
}
```

### 3. DeepDivePanelV3 Integration

**File**: `components/deepdive/v3/DeepDivePanelV3.tsx`

```tsx
// In the arguments tab or detail view
import { SchemeAdditionDialog } from "@/components/argumentation/SchemeAdditionDialog";

// Add state for dialog control
const [showSchemeAddition, setShowSchemeAddition] = useState(false);
const [targetArgumentId, setTargetArgumentId] = useState<string | null>(null);

// Add button in argument display
<Button
  onClick={() => {
    setTargetArgumentId(argument.id);
    setShowSchemeAddition(true);
  }}
>
  <Plus className="h-4 w-4" />
  Add Scheme
</Button>

// Add dialog
{targetArgumentId && (
  <SchemeAdditionDialog
    open={showSchemeAddition}
    onClose={() => {
      setShowSchemeAddition(false);
      setTargetArgumentId(null);
    }}
    argumentId={targetArgumentId}
    deliberationId={deliberationId}
    existingSchemes={
      arguments.find(a => a.id === targetArgumentId)?.argumentSchemes || []
    }
    onSchemeAdded={(schemeInstanceId) => {
      // Refresh argument list
      refetchArguments();
      setShowSchemeAddition(false);
      setTargetArgumentId(null);
    }}
  />
)}
```

---

## API Requirements

### Endpoint: POST /api/arguments/[id]/schemes

**Expected Request Body**:
```json
{
  "schemeId": "scheme-uuid",
  "role": "supporting" | "presupposed" | "implicit",
  "explicitness": "explicit" | "presupposed" | "implied",
  "isPrimary": false,
  "confidence": 0.75,
  "order": 2,
  "textEvidence": "Optional text evidence..." | null,
  "justification": "Optional justification..." | null
}
```

**Expected Response**:
```json
{
  "id": "argument-scheme-instance-uuid",
  "argumentId": "argument-uuid",
  "schemeId": "scheme-uuid",
  "role": "supporting",
  "explicitness": "explicit",
  "isPrimary": false,
  "confidence": 0.75,
  "order": 2,
  "textEvidence": "...",
  "justification": "...",
  "createdAt": "2025-11-13T...",
  "updatedAt": "2025-11-13T..."
}
```

### Endpoint: GET /api/schemes/all

**Expected Response**:
```json
[
  {
    "id": "scheme-uuid",
    "name": "Practical Reasoning",
    "description": "Reasoning about actions to achieve goals",
    "category": "practical",
    "materialRelation": "teleological",
    "reasoningType": "defeasible",
    "premises": [...],
    "conclusion": "..."
  },
  ...
]
```

---

## Event System

### Dispatched Events

**Event**: `arguments:changed`

```typescript
window.dispatchEvent(
  new CustomEvent("arguments:changed", {
    detail: {
      deliberationId: string,
      argumentId: string
    }
  })
);
```

**Purpose**: Notifies other components that an argument's schemes have been updated, triggering UI refreshes.

**Listeners**: ArgumentCardV2, ArgumentsList, DeepDivePanelV3, etc.

---

## Testing Checklist

### Unit Tests (Future)
- [ ] Renders dialog correctly
- [ ] Fetches schemes on open
- [ ] Filters schemes based on search query
- [ ] Excludes already-added schemes
- [ ] Validates required fields
- [ ] Submits correct API payload
- [ ] Dispatches events on success
- [ ] Handles API errors gracefully
- [ ] Resets form on close

### Integration Tests
- [ ] Can add scheme to single-scheme argument
- [ ] Can specify role (supporting, presupposed, implicit)
- [ ] Can set explicitness level
- [ ] Can adjust confidence slider
- [ ] ArgumentCardV2 shows multi-scheme badge after addition
- [ ] Can add text evidence
- [ ] Can add justification
- [ ] Error messages display correctly
- [ ] Loading states work correctly

### User Acceptance Tests
- [ ] "Add Scheme" button is discoverable in ArgumentCardV2
- [ ] Scheme search is responsive and helpful
- [ ] Role/explicitness descriptions are clear
- [ ] Confidence slider is intuitive
- [ ] Optional fields are clearly marked
- [ ] Success feedback is clear
- [ ] Multi-scheme badge appears immediately after addition

---

## Next Steps

### Immediate (Next 2-4 hours)
1. **Integrate with ArgumentCardV2** (1h)
   - Add "Add Scheme" button
   - Wire up dialog state
   - Test with existing arguments

2. **Test End-to-End** (1h)
   - Create single-scheme argument
   - Add supporting scheme via dialog
   - Verify multi-scheme display
   - Check event propagation

3. **Polish & Refinement** (1h)
   - Add loading skeletons
   - Improve error messages
   - Add success toast/notification
   - Keyboard navigation support

4. **Documentation** (0.5h)
   - Update component README
   - Add usage examples
   - Document prop types

### Short-term (Next 2-4 hours)
1. **DependencyEditor Component** (6h)
   - Create component (Phase 2, Feature #2)
   - Integrate with multi-scheme arguments
   - Test dependency relationships

---

## Known Limitations

1. **No inline scheme preview**: Users must click into scheme to see full details
2. **No undo**: Once added, schemes must be removed via API (DELETE endpoint)
3. **No bulk operations**: Can only add one scheme at a time
4. **No pattern suggestions**: Manual scheme selection only (Pattern Library is Phase 3)

---

## Future Enhancements (Phase 3+)

1. **Pattern-Based Addition** (Phase 3)
   - Suggest schemes based on existing schemes
   - Auto-populate role/explicitness based on pattern

2. **Smart Defaults** (Phase 3)
   - Infer confidence from text analysis
   - Auto-extract text evidence from argument

3. **Inline Editing** (Phase 4)
   - Edit role/confidence after addition
   - Reorder schemes

4. **Dependency Visualization** (Phase 2)
   - Show how new scheme relates to existing schemes
   - Preview net structure before adding

---

## Success Metrics

**Phase 2 Goal**: Enable 80% of multi-scheme use cases

**Metrics to Track**:
- % of arguments with multiple schemes (target: 15-20%)
- Average schemes per argument (target: 1.5-2.0)
- Scheme addition completion rate (target: >80%)
- Time to add scheme (target: <2 minutes)
- User feedback on discoverability (target: >4/5 stars)

---

## Component Status

✅ **Completed**:
- Component implementation
- Scheme search & filtering
- Role/explicitness selectors
- Confidence slider
- Optional text evidence & justification
- API integration
- Event dispatching
- Error handling
- Loading states
- **ArgumentCardV2 integration** (✅ COMPLETE)
- Lint verification (0 errors)

⏳ **Pending**:
- End-to-end testing with real arguments
- API endpoint verification (/api/arguments/[id]/schemes)
- DependencyEditor component (next - 6h)
- User acceptance testing
- Production deployment

## Integration Complete ✅

The SchemeAdditionDialog has been successfully integrated into `ArgumentCardV2.tsx`:

**Changes Made**:
1. ✅ Added `Plus` icon import from lucide-react
2. ✅ Added `SchemeAdditionDialog` component import
3. ✅ Added `showSchemeAdditionDialog` state variable
4. ✅ Added `mutateSchemes` to refresh data after scheme addition
5. ✅ Added "+ Add Scheme" button in scheme display section (line ~1033)
6. ✅ Added SchemeAdditionDialog component at end of JSX (line ~1320)
7. ✅ Connected callbacks: onSchemeAdded → mutateSchemes() + onAnyChange()
8. ✅ Mapped existing schemes to proper ArgumentSchemeInstance format

**Button Location**: 
- Appears in the top-right of the "Argumentation Schemes" section
- Only visible when inference section is expanded
- Only visible when schemes exist (multi-scheme or single-scheme)

**Lint Status**: ✅ 0 errors, 0 warnings

---

**Last Updated**: November 13, 2025  
**Phase**: 2 of 4  
**Component**: 1 of 2 (SchemeAdditionDialog ✅, DependencyEditor ⏳)
