# SchemeComposer Component Analysis
## Phase 6/8 Integration Status

**Date**: November 1, 2025  
**Component**: `components/arguments/SchemeComposer.tsx`  
**Purpose**: Main argument composition interface with scheme selection

---

## Current Architecture

### Component Overview

**Location**: `components/arguments/SchemeComposer.tsx`  
**Purpose**: Compose arguments with scheme-based structure  
**Used By**: DeepDivePanelV2 (collapsible section), AttackMenuPro, AIFArgumentsListPro  
**Lines**: ~450 lines

### Key Features ✅

1. **Scheme Selection** - Dropdown with all available schemes
2. **Conclusion Management** - Pick existing claim or type new
3. **Premise Management** - Add from existing or type inline
4. **Justification Field** - Optional implicit warrant
5. **Attack Context Support** - Can create arguments as attacks (REBUTS, UNDERCUTS, UNDERMINES)
6. **CQ Display** - Shows critical questions after argument creation
7. **Claim Creation** - Inline claim creation for conclusion/premises

---

## Phase 6/8 Feature Analysis

### ✅ PRESENT: Good Integration

#### 1. Attack Context (Phase 8-related)
```typescript
export type AttackContext =
  | { mode: "REBUTS"; targetClaimId: string; hint?: string }
  | { mode: "UNDERCUTS"; targetArgumentId: string; hint?: string }
  | { mode: "UNDERMINES"; targetPremiseId: string; hint?: string }
  | null;
```
- **Status**: ✅ Fully implemented
- **Feature**: Can create arguments that automatically attach as attacks
- **Post-creation**: Creates CA (Conflict Application) via `/api/ca`

#### 2. CQ Display After Creation
```typescript
const items = await getArgumentCQs(id);
setCqs(items || []);
```
- **Status**: ✅ Functional
- **Feature**: Fetches and displays CQs after argument is created
- **Limitation**: No provenance information (own vs inherited CQs)

#### 3. Scheme Slot Hints (Macagno Taxonomy)
```typescript
slots = {};
roles.forEach((role: string, i: number) => {
  const pid = premises[i]?.id;
  if (role && pid) slots![role] = pid;
});
```
- **Status**: ✅ Implemented
- **Feature**: Maps premises to scheme-specific roles (e.g., "Expert's statement", "Expert's credibility")
- **UI**: Shows role chips under scheme dropdown

#### 4. Inline Claim Creation
```typescript
async function addPremiseFromDraft() {
  const text = premDraft.trim();
  if (!text) return;
  const id = await createClaim({ deliberationId, authorId, text });
  setPremises((ps) => [...ps, { id, text }]);
}
```
- **Status**: ✅ Excellent UX
- **Feature**: Can type premises/conclusion directly without pre-creating claims

---

### ❌ MISSING: Phase 6/8 Gaps

#### 1. No Scheme Hierarchy Display ⚠️ MAJOR GAP

**Issue**: Scheme dropdown is flat list, no indication of parent/child relationships

**Current**:
```tsx
<select value={schemeKey} onChange={(e) => setSchemeKey(e.target.value)}>
  <option value="">(Choose)</option>
  {schemes.map((s) => (
    <option key={s.key} value={s.key}>
      {s.name}
    </option>
  ))}
</select>
```

**Missing**:
- No visual hierarchy (indent for child schemes)
- No indication which schemes inherit CQs
- No parent scheme info on hover/tooltip
- No cluster grouping

**Impact**: Users don't know which schemes are related or that child schemes inherit CQs

**Solution** (from roadmap):
- Replace `<select>` with SchemePickerWithHierarchy component
- Show tree structure with collapsible families
- Badge for CQ count (own + inherited)
- Tooltip with inheritance info

---

#### 2. No CQ Provenance in Display ⚠️ MEDIUM GAP

**Issue**: CQs are fetched but not shown with inheritance info

**Current**:
```typescript
const items = await getArgumentCQs(id);
setCqs(items || []);
```

**Missing**:
- No "Inherited from X" badges
- No distinction between own vs inherited CQs
- No inheritance path display

**Impact**: Users don't understand where CQs come from

**Solution**:
- Use `/api/arguments/{id}/cqs-with-provenance` (from ArgumentActionsSheet audit)
- Add provenance badges to CQ chips
- Show count: "3 own, 5 inherited, 8 total"

---

#### 3. No Scheme Info Preview ⚠️ MINOR GAP

**Issue**: No way to see scheme details before selection

**Current**: Only shows scheme name in dropdown

**Missing**:
- Scheme summary/description
- Material relation
- Expected premise structure
- CQ preview

**Impact**: Users must guess which scheme fits their argument

**Solution** (from roadmap Priority 5.2):
- Add hover state on scheme dropdown items
- Show CQ preview panel (max 3-4 CQs)
- Display Macagno taxonomy fields
- Show expected premise roles

---

#### 4. CQ Section Not Visible by Default ⚠️ UX GAP

**Issue**: CQs only appear after argument creation

**Current**:
```tsx
{!!argumentId && !!cqs.length && (
  <div className="mt-4 border-t pt-3">
    {/* CQs section */}
  </div>
)}
```

**Missing**: No CQ preview before creating argument

**Impact**: Users don't know what CQs they'll need to answer

**Solution**:
- Show CQs for selected scheme *before* creating argument
- Fetch on scheme selection: `/api/schemes/{id}/cqs`
- Display as "Questions you'll need to answer"
- Keep existing post-creation CQ section for answering

---

### ⚠️ PARTIAL: Needs Enhancement

#### 1. Scheme Slot Hints Display
**Status**: Shows role chips but minimal info
**Current**: Just displays chip like "Major Premise", "Minor Premise"
**Enhancement**: Show hint text on hover ("The expert's claim about X")

#### 2. ClaimPicker Integration (SchemeComposerPicker)
**Status**: Basic search/pick interface
**Enhancement**: Could show claim confidence, scheme usage, context

---

## Integration with Phase 8 Roadmap

### Matches Priority 5 (Argument Authoring Improvements)

From `PHASE_8_UI_INTEGRATION_ROADMAP.md`:

#### Priority 5.1: Scheme Selector with Hierarchy Context ⭐
**Roadmap Spec**: Replace flat dropdown with hierarchical tree selector

**Current SchemeComposer**: Uses `<select>` dropdown (flat)

**Alignment**: ❌ **NOT IMPLEMENTED**

**Required Changes**:
```tsx
// BEFORE:
<select className="w-full" value={schemeKey} onChange={(e) => setSchemeKey(e.target.value)}>
  <option value="">(Choose)</option>
  {schemes.map((s) => (
    <option key={s.key} value={s.key}>{s.name}</option>
  ))}
</select>

// AFTER (from roadmap):
<SchemePickerWithHierarchy
  selectedKey={schemeKey}
  onSelect={(key) => setSchemeKey(key)}
/>
```

**Estimated Effort**: 2-3 hours (component already designed in roadmap)

---

#### Priority 5.2: CQ Preview During Selection ⭐
**Roadmap Spec**: Show CQs before committing to scheme

**Current SchemeComposer**: No CQ preview

**Alignment**: ❌ **NOT IMPLEMENTED**

**Required Changes**:
```tsx
// Add CQ preview on scheme selection
const [previewCQs, setPreviewCQs] = React.useState<CQ[]>([]);

React.useEffect(() => {
  if (selected?.id) {
    fetch(`/api/schemes/${selected.id}/cqs`)
      .then(r => r.json())
      .then(data => setPreviewCQs(data.cqs || []));
  } else {
    setPreviewCQs([]);
  }
}, [selected?.id]);

// Display before "Create argument" button
{previewCQs.length > 0 && !argumentId && (
  <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
    <div className="text-xs font-medium text-amber-800 mb-2">
      Critical Questions (preview)
    </div>
    <div className="space-y-1">
      {previewCQs.slice(0, 3).map((cq, i) => (
        <div key={i} className="text-xs text-amber-700">
          {i + 1}. {cq.text}
        </div>
      ))}
      {previewCQs.length > 3 && (
        <div className="text-xs text-amber-600">
          + {previewCQs.length - 3} more questions
        </div>
      )}
    </div>
  </div>
)}
```

**Estimated Effort**: 3-4 hours

---

## Comparison: SchemeComposer vs SchemeCreator

### SchemeCreator (Admin Tool)
**Location**: `components/admin/SchemeCreator.tsx` (600+ lines)  
**Purpose**: Create/edit scheme definitions  
**Phase 6 Features**: ✅ Full hierarchy support (parent selection, cluster tag, inherit CQs checkbox)

### SchemeComposer (User Tool)
**Location**: `components/arguments/SchemeComposer.tsx` (450 lines)  
**Purpose**: Compose arguments using schemes  
**Phase 6 Features**: ❌ No hierarchy awareness

**Irony**: Admin tool has better Phase 6 integration than user-facing tool!

---

## API Endpoints Used

### Current

1. **listSchemes()** - Fetches all schemes (flat list)
   - No hierarchy info
   - No CQ counts

2. **createArgument()** - Creates argument with scheme
   - ✅ Supports slots parameter
   - ✅ Returns argument ID

3. **getArgumentCQs()** - Fetches CQs for created argument
   - ❌ No provenance info
   - Returns basic CQ list

4. **createClaim()** - Creates new claim
   - ✅ Works well for inline creation

5. **POST /api/ca** - Creates conflict application
   - ✅ Used for attack context

### Needed Enhancements

1. **GET /api/schemes** - Add hierarchy info
   ```typescript
   // Current response:
   { schemes: [{ id, key, name, slotHints, cqs }] }
   
   // Enhanced response:
   { 
     schemes: [{ 
       id, key, name, slotHints, cqs,
       parentSchemeId, // Phase 6
       clusterTag,     // Phase 6
       ownCQCount,     // NEW
       totalCQCount    // NEW (own + inherited)
     }] 
   }
   ```

2. **GET /api/schemes/[id]/cqs** - Get CQs for scheme (for preview)
   ```typescript
   // Response:
   {
     cqs: [
       { cqKey, text, attackType, targetScope, inherited, fromScheme }
     ]
   }
   ```

---

## Recommendations

### Priority 1: Add Scheme Hierarchy Selector ⭐⭐⭐

**Effort**: 2-3 hours  
**Impact**: High - aligns with roadmap, improves UX

**Implementation**:
1. Create `SchemePickerWithHierarchy` component (from roadmap spec)
2. Replace `<select>` in SchemeComposer
3. Fetch enhanced scheme list with hierarchy
4. Show tree structure with CQ counts

---

### Priority 2: Add CQ Preview ⭐⭐

**Effort**: 3-4 hours  
**Impact**: Medium - helps users understand scheme before commitment

**Implementation**:
1. Fetch CQs on scheme selection
2. Display preview panel above "Create argument" button
3. Show first 3 CQs + count
4. Link to full CQ list

---

### Priority 3: Enhance Post-Creation CQ Display ⭐⭐

**Effort**: 2-3 hours  
**Impact**: Medium - shows provenance for educational value

**Implementation**:
1. Use enhanced CQ endpoint with provenance
2. Add "Inherited from X" badges
3. Show own vs inherited count
4. Optional: inheritance path tooltip

---

### Priority 4: Add Scheme Info Tooltip ⭐

**Effort**: 2-3 hours  
**Impact**: Low - nice-to-have context

**Implementation**:
1. Add info icon next to scheme selector
2. Show HoverCard with scheme summary, taxonomy
3. Link to admin page for full details

---

## Implementation Roadmap

### Phase 1: Hierarchy Integration (1 week) 🚀

**Goal**: Replace flat dropdown with hierarchical picker

1. ✅ Create SchemePickerWithHierarchy component (from roadmap) (6-8h)
2. ✅ Enhance GET /api/schemes to include hierarchy (2-3h)
3. ✅ Replace `<select>` in SchemeComposer (1-2h)
4. ✅ Test with nested schemes (slippery_slope family) (2h)

**Total**: 11-15 hours (~1.5-2 days)

**Outcome**: Users see scheme families and CQ inheritance

---

### Phase 2: CQ Preview (1 week) 🔍

**Goal**: Show CQs before argument creation

1. ✅ Create GET /api/schemes/[id]/cqs endpoint (2-3h)
2. ✅ Add CQ preview panel to SchemeComposer (3-4h)
3. ✅ Style preview with amber theme (matches roadmap) (1-2h)
4. ✅ Test with schemes with/without inherited CQs (2h)

**Total**: 8-11 hours (~1 day)

**Outcome**: Users know what questions they'll answer

---

### Phase 3: Enhanced CQ Display (1 week) ⚡

**Goal**: Show provenance in post-creation CQ list

1. ✅ Enhance getArgumentCQs to include provenance (2-3h)
2. ✅ Add provenance badges to CQ chips (2-3h)
3. ✅ Add own/inherited count display (1h)
4. ✅ Test with multi-level inheritance (2h)

**Total**: 7-9 hours (~1 day)

**Outcome**: Educational display of CQ inheritance

---

## Testing Checklist

### Hierarchy Selector
- [ ] Dropdown shows tree structure
- [ ] Child schemes are indented
- [ ] Parent schemes are collapsible
- [ ] CQ count badges show (own + inherited)
- [ ] Selection updates scheme key correctly

### CQ Preview
- [ ] Preview appears on scheme selection
- [ ] Shows first 3 CQs
- [ ] Displays total count
- [ ] Disappears after argument creation
- [ ] Works for schemes with no CQs

### Enhanced CQ Display
- [ ] Post-creation CQ list shows all CQs
- [ ] Inherited CQs have badges
- [ ] Own/inherited counts are accurate
- [ ] Inheritance path is correct (multi-level)
- [ ] Status indicators work (answered/open)

---

## Phase 6/8 Alignment Score

### Current Implementation: 5/10 ⚠️

**What's Good**:
- ✅ Attack context support (Phase 8)
- ✅ CQ display (basic)
- ✅ Slot hints (Macagno taxonomy)
- ✅ Inline claim creation (excellent UX)
- ✅ Clean component architecture

**What's Missing**:
- ❌ No scheme hierarchy display
- ❌ No CQ provenance
- ❌ No CQ preview before creation
- ❌ Flat scheme list (vs SchemeCreator's hierarchy support)

### After Phase 1-3 Implementation: 9/10 ✅

**Improvements**:
- ✅ Hierarchical scheme picker
- ✅ CQ preview before creation
- ✅ CQ provenance display
- ✅ Full alignment with Phase 8 roadmap (Priority 5)

---

## Code Quality Assessment

### Strengths ✅
- Clean TypeScript with proper types
- Good state management (React hooks)
- Proper loading states
- Event-driven updates (CustomEvent for claims:changed)
- Inline creation UX is excellent
- Attack context integration is well-designed

### Areas for Improvement ⚠️
- Scheme selection is basic `<select>` (should be hierarchical component)
- CQ display is minimal (no provenance)
- No scheme preview/info
- Some commented-out code (Confidence widget, LegalMoveToolbar)

### Opportunities 💡
- Could extract conclusion/premise management into sub-components
- Picker modals (SchemeComposerPicker) could be unified
- CQ section could be separate component for reusability

---

## Conclusion

SchemeComposer is a **solid, functional component** with good UX for inline claim creation and attack context support. However, it **lacks Phase 6/8 hierarchy features** that are present in the admin tool (SchemeCreator).

### Key Findings

1. **Hierarchy Gap**: Biggest issue - users don't see scheme families or CQ inheritance
2. **CQ Preview Gap**: Users commit to schemes without knowing questions
3. **Admin/User Disparity**: SchemeCreator has Phase 6 features, SchemeComposer doesn't

### Priority Recommendations

1. **Implement hierarchical scheme picker** (Priority 5.1 from roadmap) - 11-15 hours
2. **Add CQ preview** (Priority 5.2 from roadmap) - 8-11 hours
3. **Enhance CQ display with provenance** - 7-9 hours

**Total Effort**: 26-35 hours (~3-4 days focused work)

### Integration Status

**Ready for Phase 8 enhancements** with minimal refactoring. Component architecture supports new features without breaking changes.

---

**Status**: Needs Phase 6/8 integration  
**Alignment**: Matches roadmap Priority 5 (Argument Authoring)  
**Total Estimated Effort**: 26-35 hours  
**Last Updated**: November 1, 2025
