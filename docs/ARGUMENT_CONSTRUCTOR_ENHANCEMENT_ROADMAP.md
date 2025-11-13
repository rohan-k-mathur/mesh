# ArgumentConstructor Enhancement Roadmap
## Comprehensive Audit of AIFArgumentWithSchemeComposer vs ArgumentConstructor

**Date**: November 13, 2025  
**Status**: Enhancement Planning Document  
**Purpose**: Identify features from legacy AIFArgumentWithSchemeComposer that should be integrated into ArgumentConstructor

---

## Executive Summary

AIFArgumentWithSchemeComposer (1135 lines) is a mature, feature-rich component with excellent UX patterns and deep integrations. ArgumentConstructor (1378 lines) is a newer wizard-based component with better structure but missing many polish features. This document identifies all gaps and creates a roadmap for bringing ArgumentConstructor to feature parity while preserving its superior architecture.

**Key Findings**:
- ✅ ArgumentConstructor has better structure (wizard steps, real-time scoring, templates)
- ❌ Missing 12 major features from AIFArgumentWithSchemeComposer
- ⚠️ Some features need adaptation (not direct copy)
- 🎯 Estimated 40-60 hours to reach full parity

---

## Part 1: Feature Comparison Matrix

### 1.1 Core Functionality

| Feature | AIFAWSC | ArgConstructor | Status | Priority | Effort |
|---------|---------|----------------|--------|----------|--------|
| **Claim Creation** | ✅ Inline | ✅ Inline | EQUAL | - | - |
| **Scheme Selection** | ✅ Dropdown | ✅ Wizard Step | BETTER | - | - |
| **Premise Input** | ✅ Freeform | ✅ Template | BETTER | - | - |
| **Citation Support** | ✅ Full | ✅ Full | EQUAL | - | - |
| **Error Handling** | ✅ Basic | ✅ Enhanced | BETTER | - | - |
| **Loading States** | ✅ Basic | ✅ Enhanced | BETTER | - | - |

**Verdict**: Core functionality is equivalent or better in ArgumentConstructor.

---

### 1.2 Advanced Features (Missing from ArgumentConstructor)

| Feature | AIFAWSC | ArgConstructor | Gap | Priority | Effort |
|---------|---------|----------------|-----|----------|--------|
| **Dual Premise Modes** | ✅ Structured + Freeform | ❌ Only Template | MAJOR | HIGH | 8h |
| **Existing Claim Picker** | ✅ Full Integration | ❌ Missing | MAJOR | HIGH | 6h |
| **Rich Text Editors** | ✅ Modal Dialogs | ❌ Missing | MAJOR | MEDIUM | 4h |
| **Attack Context** | ✅ REBUTS/UNDERCUTS/UNDERMINES | ❌ Mode Only | MAJOR | HIGH | 6h |
| **Conflict Application** | ✅ Auto-creates CA records | ❌ Missing | CRITICAL | HIGH | 8h |
| **Formal Structure Display** | ✅ Beautiful Panel | ❌ Missing | MEDIUM | MEDIUM | 3h |
| **CQ Preview** | ✅ Before Creation | ❌ Missing | MEDIUM | LOW | 3h |
| **Slot Hints** | ✅ Role Mapping | ❌ Missing | MEDIUM | MEDIUM | 4h |
| **Axiom Designation** | ✅ Checkbox | ❌ Missing | MEDIUM | LOW | 2h |
| **Implicit Warrant** | ✅ Text Field | ❌ Missing | SMALL | LOW | 1h |
| **Event Dispatching** | ✅ claims:changed | ✅ Partial | MINOR | MEDIUM | 2h |
| **Callback Variants** | ✅ onCreatedDetail | ❌ Only onComplete | MINOR | LOW | 1h |

**Total Missing Features**: 12  
**Total Estimated Effort**: 48 hours

---

## Part 2: Detailed Feature Analysis

### 2.1 Dual Premise Modes (HIGH PRIORITY - 8 hours)

**What AIFAWSC Has**:
```typescript
// Detects if scheme has formalStructure with major/minor premises
const hasStructuredPremises = Boolean(majorPremise && minorPremise);
const hasFreeformPremises = premises.length > 0;

// Conditional rendering
{selected?.formalStructure?.majorPremise && selected?.formalStructure?.minorPremise ? (
  <StructuredPremisesInput /> // Major + Minor with templates
) : (
  <FreeformPremisesInput /> // List of arbitrary premises
)}
```

**Why It Matters**:
- Walton schemes (Modus Ponens, Modus Tollens) need structured major/minor premises
- Freeform schemes (Practical Reasoning with 5 premises) need flexible lists
- Users can add premises incrementally (not locked to template count)
- Better for complex arguments with many premises

**Implementation Plan**:
```typescript
// In ArgumentConstructor, detect scheme's formalStructure
const hasFormalStructure = template?.formalStructure && 
  template.formalStructure.majorPremise && 
  template.formalStructure.minorPremise;

// Add state for structured premises
const [majorPremise, setMajorPremise] = useState<{id: string, text: string} | null>(null);
const [minorPremise, setMinorPremise] = useState<{id: string, text: string} | null>(null);

// Modify PremisesFillingStep to support both modes
<PremisesFillingStep
  mode={hasFormalStructure ? "structured" : "freeform"}
  template={template}
  // For structured
  majorPremise={majorPremise}
  minorPremise={minorPremise}
  onMajorChange={setMajorPremise}
  onMinorChange={setMinorPremise}
  // For freeform
  filledPremises={filledPremises}
  onPremiseChange={(key, value) => {...}}
/>
```

**Tasks**:
1. Add structured premise state to ArgumentConstructor (1h)
2. Create StructuredPremiseInput component (2h)
3. Modify handleSubmit to detect mode and build correct premiseClaimIds (2h)
4. Update PremisesFillingStep with mode switching (2h)
5. Test both modes with different schemes (1h)

**Benefits**:
- Supports all scheme types (Walton formal + flexible practical)
- Users can create Modus Ponens/Tollens arguments correctly
- Better alignment with argumentation theory

---

### 2.2 Existing Claim Picker (HIGH PRIORITY - 6 hours)

**What AIFAWSC Has**:
```typescript
// ClaimPicker modal for reusing existing claims
<SchemeComposerPicker
  kind="claim"
  open={pickerConcOpen}
  onClose={() => setPickerConcOpen(false)}
  onPick={(it) => {
    setConclusion({ id: it.id, text: it.label });
    setConclusionDraft(it.label || "");
    setEditingConclusion(false);
    setPickerConcOpen(false);
  }}
/>

// Separate pickers for premises
<SchemeComposerPicker open={pickerPremOpen} ... />
<SchemeComposerPicker open={pickerMajorOpen} ... />
<SchemeComposerPicker open={pickerMinorOpen} ... />
```

**Why It Matters**:
- Promotes claim reuse (avoid duplicates)
- Enables linking arguments through shared claims
- Better for building argument nets
- Improves deliberation coherence

**Implementation Plan**:
```typescript
// Add picker state to ArgumentConstructor
const [showConclusionPicker, setShowConclusionPicker] = useState(false);
const [showPremisePicker, setShowPremisePicker] = useState<string | null>(null); // premise key

// In PremisesFillingStep, add "Pick Existing" button
<div className="flex items-center gap-2">
  <Textarea value={filledPremises[premise.key]} onChange={...} />
  <Button variant="ghost" onClick={() => setShowPremisePicker(premise.key)}>
    Pick Existing
  </Button>
</div>

// Modal in ArgumentConstructor
{showPremisePicker && (
  <ClaimPickerDialog
    deliberationId={deliberationId}
    onSelect={(claim) => {
      // Create premise claim from existing claim
      const premiseKey = showPremisePicker;
      setFilledPremises(prev => ({...prev, [premiseKey]: claim.text}));
      // Store claim ID for later use
      setPremiseClaimIds(prev => ({...prev, [premiseKey]: claim.id}));
      setShowPremisePicker(null);
    }}
    onClose={() => setShowPremisePicker(null)}
  />
)}
```

**Tasks**:
1. Import SchemeComposerPicker/ClaimPicker components (0.5h)
2. Add picker state and modals to ArgumentConstructor (1h)
3. Add "Pick Existing" buttons to conclusion input (0.5h)
4. Add "Pick Existing" buttons to each premise in PremisesFillingStep (1h)
5. Modify handleSubmit to use picked claim IDs instead of creating new (2h)
6. Test picking + creating mixed scenarios (1h)

**Benefits**:
- Reduces duplicate claims in database
- Enables argument chaining (A's conclusion = B's premise)
- Better user experience (autocomplete-like)

---

### 2.3 Rich Text Editors (MEDIUM PRIORITY - 4 hours)

**What AIFAWSC Has**:
```typescript
// Modal dialog with PropositionComposerPro for complex claims
<Dialog open={expandedConclusionEditor} onOpenChange={...}>
  <DialogContent className="max-w-3xl">
    <DialogTitle>Compose Conclusion Claim</DialogTitle>
    <PropositionComposerPro
      deliberationId={deliberationId}
      onCreated={(prop) => {
        setConclusionDraft(prop.text);
        setConclusion({ id: prop.id, text: prop.text });
        setExpandedConclusionEditor(false);
      }}
      placeholder="State your conclusion claim with rich formatting..."
    />
  </DialogContent>
</Dialog>

// Similar for premises
<Dialog open={expandedPremiseEditor} onOpenChange={...}>
  <PropositionComposerPro ... />
</Dialog>
```

**Why It Matters**:
- Some claims need rich formatting (bold, italics, links)
- Long claims benefit from larger editing space
- Better UX for complex legal/policy arguments
- Consistent with PropositionComposerPro used elsewhere

**Implementation Plan**:
```typescript
// Add state to ArgumentConstructor
const [expandedConclusionEditor, setExpandedConclusionEditor] = useState(false);
const [expandedPremiseEditor, setExpandedPremiseEditor] = useState<string | null>(null);

// In conclusion input, add "Expand" button
<Button onClick={() => setExpandedConclusionEditor(true)}>
  ➾ Expand
</Button>

// In PremisesFillingStep, add "Expand" button per premise
<Button onClick={() => setExpandedPremiseEditor(premise.key)}>
  ➾ Expand
</Button>

// Modal dialogs (copy from AIFAWSC)
{expandedConclusionEditor && <ConclusionExpandedDialog ... />}
{expandedPremiseEditor && <PremiseExpandedDialog ... />}
```

**Tasks**:
1. Add Dialog state for conclusion and premises (0.5h)
2. Create ConclusionExpandedDialog component (1h)
3. Create PremiseExpandedDialog component (1h)
4. Add "Expand" buttons to UI (0.5h)
5. Wire up PropositionComposerPro integration (0.5h)
6. Test rich text creation and claim sync (0.5h)

**Benefits**:
- Better UX for complex arguments
- Consistent with rest of Mesh UI
- Supports rich formatting in claims

---

### 2.4 Attack Context Integration (HIGH PRIORITY - 6 hours)

**What AIFAWSC Has**:
```typescript
// Attack context type
export type AttackContext =
  | { mode: "REBUTS"; targetClaimId: string; hint?: string }
  | { mode: "UNDERCUTS"; targetArgumentId: string; hint?: string }
  | { mode: "UNDERMINES"; targetPremiseId: string; hint?: string }
  | null;

// In handleCreate, auto-creates ConflictApplication
if (attackContext) {
  if (attackContext.mode === "REBUTS") {
    await postCA({
      deliberationId,
      conflictingClaimId: conclusionId,
      conflictedClaimId: attackContext.targetClaimId,
      legacyAttackType: "REBUTS",
      legacyTargetScope: "conclusion",
    });
  }
  // ... similar for UNDERCUTS, UNDERMINES
}
```

**Why It Matters**:
- **CRITICAL**: Attacks without CA records don't show in conflict graphs
- **CRITICAL**: ASPIC+ system requires CA records for evaluation
- ArgumentConstructor currently creates arguments but doesn't link attacks
- Users expect attacks to appear in visualization

**Current ArgumentConstructor Issue**:
```typescript
// Only has mode, not specific attack context
interface ArgumentConstructorProps {
  mode: ArgumentMode; // "attack" | "support" | "general"
  targetId: string; // Could be claim or argument
  suggestion?: AttackSuggestion; // Has attackType but not full context
}
```

**Implementation Plan**:
```typescript
// 1. Add attackContext prop (match AIFAWSC signature)
interface ArgumentConstructorProps {
  // ... existing props
  attackContext?: AttackContext; // NEW
}

// 2. In handleSubmit, after creating argument:
if (attackContext || (mode === "attack" && suggestion)) {
  const attackType = attackContext?.mode || suggestion?.attackType;
  const targetClaimId = attackContext?.mode === "REBUTS" ? attackContext.targetClaimId : null;
  const targetArgumentId = attackContext?.mode === "UNDERCUTS" ? attackContext.targetArgumentId : null;
  const targetPremiseId = attackContext?.mode === "UNDERMINES" ? attackContext.targetPremiseId : null;
  
  await fetch("/api/ca", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deliberationId,
      conflictingClaimId: conclusionClaimId,
      conflictedClaimId: targetClaimId || targetPremiseId,
      conflictedArgumentId: targetArgumentId,
      legacyAttackType: attackType,
      legacyTargetScope: attackType === "REBUTS" ? "conclusion" : 
                        attackType === "UNDERCUTS" ? "inference" : "premise",
    }),
  });
}

// 3. Update DeepDivePanelV2 and other callers to pass attackContext
```

**Tasks**:
1. Add AttackContext type to ArgumentConstructor (0.5h)
2. Implement postCA helper function (1h)
3. Add CA creation logic in handleSubmit (2h)
4. Update all ArgumentConstructor call sites (1h)
5. Test attack creation with CA verification (1h)
6. Verify ASPIC+ integration (0.5h)

**Benefits**:
- **CRITICAL FIX**: Attacks now properly integrated with conflict system
- Attacks appear in argument graphs
- ASPIC+ evaluation works correctly
- Dialogue system tracks conflicts

---

### 2.5 Formal Structure Display (MEDIUM PRIORITY - 3 hours)

**What AIFAWSC Has**:
```tsx
{/* Beautiful gradient panel showing scheme structure */}
{selected?.formalStructure && (
  <div className="md:col-span-3 mt-2 p-3 rounded-lg border-2 border-indigo-200 
                  bg-gradient-to-br from-indigo-50 to-indigo-100/50">
    <div className="flex items-start gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-indigo-200">
        <svg className="w-4 h-4 text-indigo-700" ...>...</svg>
      </div>
      <div className="flex-1">
        <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
          Formal Structure
        </h4>
        <p className="text-[11px] text-indigo-800 mt-0.5">
          Follow this logical structure when constructing your argument
        </p>
      </div>
    </div>
    <div className="space-y-2 mt-3">
      <div className="flex gap-2">
        <span className="text-[11px] font-bold text-indigo-700 min-w-[90px]">
          Major Premise:
        </span>
        <span className="text-[11px] text-slate-700 leading-relaxed">
          {selected.formalStructure.majorPremise}
        </span>
      </div>
      {/* Similar for minor premise and conclusion */}
    </div>
  </div>
)}
```

**Why It Matters**:
- Educates users about scheme structure
- Shows expected format before filling premises
- Improves argument quality (users follow template)
- Beautiful UI that builds trust

**Implementation Plan**:
```typescript
// In TemplateCustomizationStep, add FormalStructurePanel
<Card>
  <CardHeader>
    <CardTitle>Customize Template</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Add formal structure display */}
    {template?.formalStructure && (
      <FormalStructurePanel structure={template.formalStructure} />
    )}
    
    {/* Rest of template customization */}
    ...
  </CardContent>
</Card>

// New component
function FormalStructurePanel({ structure }) {
  return (
    <div className="p-3 rounded-lg border-2 border-indigo-200 
                    bg-gradient-to-br from-indigo-50 to-indigo-100/50">
      {/* Copy from AIFAWSC */}
    </div>
  );
}
```

**Tasks**:
1. Create FormalStructurePanel component (1h)
2. Add to TemplateCustomizationStep (0.5h)
3. Style matching AIFAWSC (1h)
4. Test with various schemes (0.5h)

**Benefits**:
- Better user education
- More polished UI
- Clearer expectations

---

### 2.6 CQ Preview Panel (MEDIUM PRIORITY - 3 hours)

**What AIFAWSC Has**:
```tsx
{/* Shown BEFORE argument creation */}
{selected?.cqs && selected.cqs.length > 0 && !argumentId && (
  <div className="my-4 p-4 rounded-xl border-2 border-orange-200 
                  bg-gradient-to-br from-orange-50 to-orange-100/50">
    <div className="flex items-start gap-3 mb-3">
      <div className="p-2 rounded-lg bg-orange-200">
        <svg className="w-5 h-5 text-orange-700" ...>...</svg>
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-orange-900 mb-1">
          Critical Questions Preview
        </h4>
        <p className="text-xs text-orange-800 leading-relaxed">
          This scheme comes with {selected.cqs.length} critical question{...} 
          that will test your argument's strength. Review them before creating.
        </p>
      </div>
    </div>

    <div className="space-y-2">
      {selected.cqs.slice(0, 4).map((cq, idx) => (
        <div className="flex items-start gap-2 p-2 bg-white/70 rounded-lg">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-200 
                         text-orange-800 text-xs font-bold">
            {idx + 1}
          </span>
          <div className="flex-1">
            <p className="text-xs text-slate-800">{cq.text}</p>
            <div className="flex gap-2 mt-1">
              <Badge>{cq.attackType}</Badge>
              <span className="text-[10px] text-slate-500">{cq.targetScope}</span>
            </div>
          </div>
        </div>
      ))}
      {selected.cqs.length > 4 && (
        <div className="text-center pt-2">
          <span className="text-xs font-medium text-orange-700">
            ...+ {selected.cqs.length - 4} more questions
          </span>
        </div>
      )}
    </div>
  </div>
)}
```

**Why It Matters**:
- Prepares users for potential attacks
- Encourages stronger arguments (address CQs preemptively)
- Educational: teaches scheme weaknesses
- Reduces surprise when CQs are asked later

**Implementation Plan**:
```typescript
// In TemplateCustomizationStep or PremisesFillingStep, add CQPreviewPanel
{template?.criticalQuestions && template.criticalQuestions.length > 0 && (
  <Alert>
    <AlertDescription>
      <CQPreviewPanel cqs={template.criticalQuestions} />
    </AlertDescription>
  </Alert>
)}

// New component (copy from AIFAWSC)
function CQPreviewPanel({ cqs }) {
  return (
    <div className="space-y-2">
      {/* Orange gradient panel with CQ list */}
    </div>
  );
}
```

**Tasks**:
1. Create CQPreviewPanel component (1h)
2. Add to appropriate wizard step (0.5h)
3. Style matching AIFAWSC (1h)
4. Test with various schemes (0.5h)

**Benefits**:
- Better argument quality
- User education
- Anticipatory guidance

---

### 2.7 Slot Hints & Role Mapping (MEDIUM PRIORITY - 4 hours)

**What AIFAWSC Has**:
```typescript
// Displays role badges under scheme selector
{selected?.slotHints?.premises?.length ? (
  <div className="mt-1 flex gap-1 flex-wrap">
    {selected.slotHints.premises.map((p: any) => (
      <span key={p.role} className="px-2 py-0.5 rounded-full bg-indigo-50 
                                       text-indigo-700 text-xs">
        {p.label}
      </span>
    ))}
  </div>
) : null}

// In handleCreate, builds slots object for validation
let slots: Record<string, string> | undefined = undefined;
const roles = selected?.slotHints?.premises?.map((p: any) => p.role) ?? [];
if (roles.length && hasStructuredPremises) {
  slots = {};
  if (roles[0]) slots[roles[0]] = majorPremise!.id;
  if (roles[1]) slots[roles[1]] = minorPremise!.id;
  if (conclusionId) (slots as any).conclusion = conclusionId;
}

// Passes to API for server-side validation
await createArgument({
  ...
  ...(slots ? { slots } : {}),
});
```

**Why It Matters**:
- Enables server-side scheme validation
- Shows users what each premise represents ("Expert", "Domain", "Claim")
- Better type safety (right premise in right slot)
- Future: enables smarter matching/suggestions

**Implementation Plan**:
```typescript
// 1. In SchemeSelectionStep, display slot hints
{selectedScheme && schemes.find(s => s.id === selectedScheme)?.slotHints && (
  <div className="mt-2 flex gap-2 flex-wrap">
    {schemes.find(s => s.id === selectedScheme).slotHints.premises.map(hint => (
      <Badge key={hint.role} variant="outline">
        {hint.label}
      </Badge>
    ))}
  </div>
)}

// 2. In PremisesFillingStep, label premises with roles
{template.premises.map((premise, idx) => (
  <div key={premise.key}>
    <Label>
      {premise.content}
      {template.slotHints?.[idx] && (
        <Badge className="ml-2">{template.slotHints[idx].label}</Badge>
      )}
    </Label>
    <Textarea ... />
  </div>
))}

// 3. In handleSubmit, build slots object
const slots: Record<string, string> = {};
template.premises.forEach((premise, idx) => {
  const role = template.slotHints?.[idx]?.role;
  if (role && premiseClaimIds[idx]) {
    slots[role] = premiseClaimIds[idx];
  }
});

// Include in API call
body: JSON.stringify({
  ...
  slots: Object.keys(slots).length > 0 ? slots : undefined,
})
```

**Tasks**:
1. Display slot hint badges in SchemeSelectionStep (1h)
2. Label premises with roles in PremisesFillingStep (1h)
3. Build slots object in handleSubmit (1h)
4. Test with schemes that have slotHints (0.5h)
5. Verify server-side validation works (0.5h)

**Benefits**:
- Type-safe premise assignment
- Better validation
- Clearer user guidance

---

### 2.8 Axiom Designation (LOW PRIORITY - 2 hours)

**What AIFAWSC Has**:
```tsx
{/* Checkbox to mark premises as indisputable */}
<div className="p-3 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 
                border border-amber-200">
  <label className="flex items-start gap-2 cursor-pointer">
    <input
      type="checkbox"
      checked={premisesAreAxioms}
      onChange={(e) => setPremisesAreAxioms(e.target.checked)}
      className="mt-0.5 w-4 h-4 text-amber-600 bg-white 
                 border-amber-300 rounded focus:ring-amber-500"
    />
    <div className="flex-1">
      <span className="text-sm font-semibold text-amber-900">
        Mark premises as axioms (indisputable)
      </span>
      <p className="text-xs text-amber-700 mt-1 leading-relaxed">
        Axioms are foundational premises that cannot be undermined and must be 
        consistent with other axioms. Use for claims that are beyond dispute.
      </p>
    </div>
  </label>
</div>

// Passed to API
await createArgument({
  ...
  premisesAreAxioms, // Backend marks ArgumentPremise.isAxiom = true
});
```

**Why It Matters**:
- ASPIC+ system treats axioms specially (cannot be undermined)
- Important for legal/scientific arguments (established facts)
- Phase B feature (already in backend)

**Implementation Plan**:
```typescript
// Add state to ArgumentConstructor
const [premisesAreAxioms, setPremisesAreAxioms] = useState(false);

// In PremisesFillingStep, add checkbox above premises
<Alert>
  <AlertDescription>
    <div className="flex items-start gap-2">
      <Checkbox
        checked={premisesAreAxioms}
        onCheckedChange={setPremisesAreAxioms}
      />
      <div>
        <p className="font-semibold">Mark premises as axioms (indisputable)</p>
        <p className="text-xs text-muted-foreground mt-1">
          Axioms are foundational premises that cannot be undermined...
        </p>
      </div>
    </div>
  </AlertDescription>
</Alert>

// In handleSubmit, include in API payload
body: JSON.stringify({
  ...
  premisesAreAxioms,
})
```

**Tasks**:
1. Add checkbox to PremisesFillingStep (1h)
2. Include in API payload (0.5h)
3. Test with backend (0.5h)

**Benefits**:
- ASPIC+ integration
- Better for formal arguments
- User control over premise strength

---

### 2.9 Implicit Warrant Field (LOW PRIORITY - 1 hour)

**What AIFAWSC Has**:
```tsx
{/* Optional notes / warrant */}
<label className="flex flex-col gap-2 mt-0">
  <span className="text-sm text-gray-800">Justification</span>
  <textarea
    className="w-full articlesearchfield rounded-lg text-xs px-2.5 py-2 mt-1"
    cols={3}
    value={notes}
    placeholder="If [premises], then [conclusion] (unless [exception])."
    onChange={(e) => setNotes(e.target.value)}
  />
</label>

// Passed to API
await createArgument({
  ...
  implicitWarrant: notes ? { text: notes } : null,
});
```

**Why It Matters**:
- Captures the logical link between premises and conclusion
- Useful for Toulmin-style analysis
- Optional but valuable for complex arguments

**Implementation Plan**:
```typescript
// Add state to ArgumentConstructor
const [implicitWarrant, setImplicitWarrant] = useState("");

// In ReviewSubmitStep, add optional field
<div>
  <Label htmlFor="warrant">Implicit Warrant (Optional)</Label>
  <Textarea
    id="warrant"
    value={implicitWarrant}
    onChange={(e) => setImplicitWarrant(e.target.value)}
    placeholder="If [premises], then [conclusion] (unless [exception])."
  />
</div>

// In handleSubmit
body: JSON.stringify({
  ...
  implicitWarrant: implicitWarrant.trim() ? { text: implicitWarrant } : null,
})
```

**Tasks**:
1. Add warrant field to ReviewSubmitStep (0.5h)
2. Include in API payload (0.25h)
3. Test (0.25h)

**Benefits**:
- Captures logical warrant
- Toulmin analysis
- Better documentation

---

### 2.10 Enhanced Event Dispatching (MEDIUM PRIORITY - 2 hours)

**What AIFAWSC Has**:
```typescript
// Fires window events for system integration
window.dispatchEvent(
  new CustomEvent("claims:changed", { detail: { deliberationId } })
);

// After citation attachment
window.dispatchEvent(
  new CustomEvent("citations:changed", { 
    detail: { targetType: "argument", targetId: id } 
  })
);
```

**Current ArgumentConstructor**:
```typescript
// Only fires in citation attachment (already present)
window.dispatchEvent(
  new CustomEvent("citations:changed", { 
    detail: { targetType: "argument", targetId: argumentId } 
  })
);
```

**Missing**:
- `claims:changed` event after creating premise/conclusion claims
- `arguments:changed` event after creating argument
- Causes UI to not refresh automatically

**Implementation Plan**:
```typescript
// In handleSubmit, after creating claims
premiseClaimIds.forEach(id => {
  window.dispatchEvent(
    new CustomEvent("claims:changed", { detail: { deliberationId } })
  );
});

// After creating conclusion
window.dispatchEvent(
  new CustomEvent("claims:changed", { detail: { deliberationId } })
);

// After creating argument
window.dispatchEvent(
  new CustomEvent("arguments:changed", { 
    detail: { deliberationId, argumentId: data.argumentId } 
  })
);
```

**Tasks**:
1. Add claims:changed events after claim creation (0.5h)
2. Add arguments:changed event after argument creation (0.5h)
3. Test UI refresh behavior (0.5h)
4. Document event system (0.5h)

**Benefits**:
- Automatic UI refresh
- Better system integration
- Consistent with AIFAWSC

---

### 2.11 Callback Variants (LOW PRIORITY - 1 hour)

**What AIFAWSC Has**:
```typescript
// Two callback variants
onCreated?: (argumentId: string) => void;

onCreatedDetail?: (arg: {
  id: string;
  conclusion: { id: string; text: string };
  premises: { id: string; text: string }[];
}) => void;
```

**Current ArgumentConstructor**:
```typescript
// Only has simple callback
onComplete?: (argumentId: string) => void;
```

**Why It Matters**:
- `onCreatedDetail` provides full argument structure to parent
- Useful for immediate UI updates without refetching
- Better for testing/debugging

**Implementation Plan**:
```typescript
// Add to ArgumentConstructorProps
onCreatedDetail?: (arg: {
  id: string;
  conclusion: { id: string; text: string };
  premises: { id: string; text: string }[];
}) => void;

// In handleSubmit, after creating argument
if (onCreatedDetail) {
  onCreatedDetail({
    id: data.argumentId,
    conclusion: {
      id: conclusionClaimId,
      text: template.conclusion,
    },
    premises: premiseClaimIds.map((id, idx) => ({
      id,
      text: filledPremises[template.premises[idx].key],
    })),
  });
}
```

**Tasks**:
1. Add onCreatedDetail prop (0.25h)
2. Call with full details in handleSubmit (0.5h)
3. Update callers to use if needed (0.25h)

**Benefits**:
- Richer callback data
- Better for parent components

---

## Part 3: Implementation Roadmap

### Phase 1: Critical Features (Week 1 - 16 hours)

**Goal**: Fix showstopper issues and major functional gaps

1. **Attack Context Integration** (6h) - CRITICAL
   - Add AttackContext prop
   - Implement postCA function
   - Create ConflictApplication records
   - Test ASPIC+ integration
   
2. **Existing Claim Picker** (6h) - HIGH
   - Integrate SchemeComposerPicker
   - Add pickers for conclusion and premises
   - Modify handleSubmit to use picked IDs
   - Test claim reuse scenarios

3. **Dual Premise Modes** (4h partial) - HIGH
   - Add structured premise state
   - Implement mode detection
   - Basic UI for structured mode
   - (Defer full UI polish to Phase 2)

**Deliverable**: ArgumentConstructor creates proper attacks with CA records, can reuse existing claims.

---

### Phase 2: UX Enhancements (Week 2 - 16 hours)

**Goal**: Polish user experience to match AIFAWSC

1. **Complete Dual Premise Modes** (4h remaining) - HIGH
   - Full StructuredPremiseInput component
   - Polish UI matching AIFAWSC
   - Comprehensive testing

2. **Rich Text Editors** (4h) - MEDIUM
   - Implement expanded editor dialogs
   - Integrate PropositionComposerPro
   - Test rich formatting

3. **Formal Structure Display** (3h) - MEDIUM
   - Create FormalStructurePanel
   - Add to TemplateCustomizationStep
   - Style matching AIFAWSC

4. **Slot Hints & Role Mapping** (4h) - MEDIUM
   - Display role badges
   - Label premises with roles
   - Build slots object
   - Test validation

5. **Enhanced Event Dispatching** (1h) - MEDIUM
   - Add claims:changed events
   - Add arguments:changed event
   - Test UI refresh

**Deliverable**: ArgumentConstructor has polished UX matching AIFAWSC quality.

---

### Phase 3: Advanced Features (Week 3 - 12 hours)

**Goal**: Add remaining features for complete parity

1. **CQ Preview Panel** (3h) - MEDIUM
   - Create CQPreviewPanel
   - Add to wizard
   - Style and test

2. **Axiom Designation** (2h) - LOW
   - Add checkbox
   - Include in API payload
   - Test backend integration

3. **Implicit Warrant Field** (1h) - LOW
   - Add warrant textarea
   - Include in API payload
   - Test

4. **Callback Variants** (1h) - LOW
   - Add onCreatedDetail prop
   - Implement in handleSubmit
   - Update callers

5. **Testing & Bug Fixes** (3h)
   - Comprehensive testing
   - Edge cases
   - Bug fixes

6. **Documentation** (2h)
   - Update component docs
   - Create migration guide
   - Document new props

**Deliverable**: ArgumentConstructor at full feature parity with AIFAWSC, ready for production.

---

## Part 4: Features to NOT Port (Intentional Differences)

### 4.1 Single-Step UI (ArgumentConstructor is Better)

**AIFAWSC**: Everything on one screen (scheme, premises, conclusion, citations)

**ArgumentConstructor**: Wizard steps (scheme → template → premises → evidence → review)

**Decision**: **Keep ArgumentConstructor approach**
- Better for complex arguments
- Clearer user guidance
- Real-time scoring feedback
- Progressive disclosure

---

### 4.2 Conclusion as Prop (ArgumentConstructor is More Flexible)

**AIFAWSC**: `conclusionClaim` prop, externally controlled

**ArgumentConstructor**: Conclusion derived from template

**Decision**: **Keep ArgumentConstructor approach for general mode**
- Template-driven conclusion is clearer
- For attack mode, can accept target claim as suggestion
- More flexible for different use cases

---

### 4.3 State Management (ArgumentConstructor is More Structured)

**AIFAWSC**: Many separate useState hooks (premises, majorPremise, minorPremise, notes, etc.)

**ArgumentConstructor**: Consolidated state with template-driven structure

**Decision**: **Keep ArgumentConstructor structure**
- Better type safety
- Clearer data flow
- Easier to test

---

## Part 5: Priority Summary

### Must-Have (Blocks Production) - 12 hours
1. Attack Context Integration (6h) - Without this, attacks don't work
2. Existing Claim Picker (6h) - Critical UX gap

### Should-Have (Major Quality) - 19 hours
3. Dual Premise Modes (8h) - Needed for Walton schemes
4. Rich Text Editors (4h) - Expected UX
5. Slot Hints & Role Mapping (4h) - Better validation
6. Formal Structure Display (3h) - User education

### Nice-to-Have (Polish) - 13 hours
7. CQ Preview Panel (3h) - Educational value
8. Enhanced Event Dispatching (2h) - System integration
9. Axiom Designation (2h) - ASPIC+ feature
10. Implicit Warrant Field (1h) - Optional metadata
11. Callback Variants (1h) - Developer convenience
12. Testing & Docs (4h) - Production readiness

**Total Effort**: 44 hours (approximately 1 week of full-time work)

---

## Part 6: Success Metrics

### Functionality
- ✅ All AIFAWSC features available in ArgumentConstructor
- ✅ Attack context properly creates CA records
- ✅ Existing claim picker works
- ✅ Dual premise modes support all scheme types
- ✅ Rich text editors accessible

### UX
- ✅ UI polish matches AIFAWSC quality
- ✅ Formal structure displayed
- ✅ CQ preview shown
- ✅ Role badges visible
- ✅ Clear guidance at each step

### Integration
- ✅ Events fire correctly
- ✅ ASPIC+ integration works
- ✅ Dialogue system updated
- ✅ Conflict graphs show attacks
- ✅ Citations attach properly

### Code Quality
- ✅ Type-safe props
- ✅ No console errors
- ✅ Comprehensive tests
- ✅ Good documentation
- ✅ Lint passes

---

## Part 7: Migration Strategy

### For Developers

**When to use ArgumentConstructor**:
- New argument creation flows
- Wizard-style UX needed
- Real-time scoring desired
- Template-driven construction

**When to use AIFArgumentWithSchemeComposer**:
- Legacy integrations
- Single-screen UI preferred
- External conclusion control needed
- Gradual migration

**Long-term Plan**:
1. **Phase 1**: Both components coexist
2. **Phase 2**: Migrate all new features to ArgumentConstructor
3. **Phase 3**: Deprecated warning on AIFAWSC
4. **Phase 4**: Remove AIFAWSC (6 months from now)

### For Users

**No breaking changes** - existing functionality preserved
- Both components work identically
- Same backend API
- Same data format
- Seamless experience

---

## Part 8: Next Steps

### Immediate (This Week)
1. Review this roadmap with team
2. Approve priorities and scope
3. Begin Phase 1 implementation
4. Set up feature flags for gradual rollout

### Short-term (2-3 Weeks)
1. Complete Phases 1-2
2. User testing with beta group
3. Gather feedback
4. Iterate on UX

### Medium-term (1-2 Months)
1. Complete Phase 3
2. Full production rollout
3. Monitor metrics
4. Plan AIFAWSC deprecation

### Long-term (6 Months)
1. All users on ArgumentConstructor
2. Remove AIFAWSC
3. Simplify codebase
4. Build on new foundation (multi-scheme nets, etc.)

---

## Conclusion

AIFArgumentWithSchemeComposer is a mature, well-designed component with excellent UX patterns. ArgumentConstructor has superior architecture but lacks 12 key features. By systematically porting these features over 44 hours of work, we can achieve the best of both: structured wizard-based construction WITH polished UX and deep integrations.

**Critical Path**:
1. Attack Context Integration (6h) - Unblocks production use
2. Existing Claim Picker (6h) - Critical UX gap
3. Dual Premise Modes (8h) - Functional completeness
4. UX Polish (19h) - Match quality bar
5. Testing & Docs (5h) - Production readiness

**Total**: ~44 hours = 1 week full-time or 2-3 weeks part-time

Let's proceed with Phase 1 implementation!

---

## Appendix A: Multi-Scheme Arguments & Argument Nets - UI/UX Research

**Date Added**: November 13, 2025  
**Research Question**: How do multi-scheme arguments, scheme hierarchies, and argument nets work from a UI/UX perspective - both creation and display flows?

### A.1 Theoretical Foundation

Based on Walton, Macagno & Reed (2017) research and deliberation system overhaul strategy:

**Key Insight**: Real arguments are **nets of schemes**, not single templates.

**Example - Policy Argument**:
- **Classification**: Classify state of affairs (Argument from Verbal Classification)
- **Evaluation**: Judge it positively/negatively (Argument from Values)
- **Action**: Suggest course of action (Practical Reasoning)
- **Prediction**: Forecast outcomes (Argument from Consequences)

Each passage = one scheme. Complete argument = **interdependent net**.

**Critical Gap**: Current single-scheme model (`Argument.schemeId`) is architecturally insufficient for real argumentation.

---

### A.2 Current Implementation Status

#### Database Schema (Phase 1 - Complete ✅)

**Multi-Scheme Support**:
```typescript
model Argument {
  id String @id
  schemeId String? // Legacy single scheme
  argumentSchemes ArgumentSchemeInstance[] // NEW: Multiple schemes
  // ... other fields
}

model ArgumentSchemeInstance {
  id String @id
  argumentId String
  schemeId String
  role "primary" | "supporting" | "presupposed" | "implicit"
  explicitness "explicit" | "presupposed" | "implied"
  isPrimary Boolean
  confidence Float // 0.0 to 1.0
  order Int // Sequential order in net
  textEvidence String?
  justification String?
  // Relationships
  argument Argument @relation
  scheme ArgumentScheme @relation
}
```

**ArgumentNet Model** (Phase 4 - Partial ✅):
```typescript
model ArgumentNet {
  id String @id
  netType String // Pattern identifier
  schemes ArgumentSchemeInstance[]
  dependencyGraph Json // Graph structure
  explicitnessAnalysis Json // Which schemes are implicit
  complexity Float // Net complexity score
  confidence Float // Overall confidence (weakest link)
  isConfirmed Boolean // User confirmed detection
}
```

#### API Endpoints (Phase 1 - Complete ✅)

**Scheme Management**:
- `GET /api/arguments/[id]` - Backward compatible retrieval (normalizes legacy → multi-scheme)
- `GET /api/arguments/[id]/schemes` - List all schemes with metadata
- `POST /api/arguments/[id]/schemes` - Add scheme to argument
- `PATCH /api/arguments/[id]/schemes/[instanceId]` - Update scheme (role, explicitness, etc.)
- `DELETE /api/arguments/[id]/schemes/[instanceId]` - Remove scheme

**Net Detection & Analysis**:
- `POST /api/nets/detect` - Detect if argument is multi-scheme net
- `GET /api/nets/[id]` - Fetch net data
- `POST /api/nets/[id]/confirm` - User confirms detected net
- `GET /api/nets/[id]/cqs` - Get composed CQ set from all schemes

#### Utility Functions (Phase 1 - Complete ✅)

**File**: `lib/utils/argument-scheme-compat.ts`

```typescript
// Detection
usesMultiScheme(arg) // Check if uses new structure
usesLegacyScheme(arg) // Check if uses old structure

// Retrieval
getArgumentScheme(arg) // Get primary scheme
getArgumentSchemeId(arg) // Get primary scheme ID
getAllArgumentSchemes(arg) // Get all schemes with metadata

// Normalization
normalizeArgumentSchemes(arg) // Convert legacy → multi-scheme (virtual)

// Display
formatSchemeDisplay(arg) // "Practical Reasoning + 2 more"
shouldShowMultiSchemeUI(arg) // UI logic with feature flag
getSchemeBadgeVariant(arg) // Badge styling
getSchemeTooltip(arg) // "Primary: X • 2 supporting"
```

**Feature Flag**:
```typescript
featureFlags.ENABLE_MULTI_SCHEME // Default: true
```

---

### A.3 Display/Viewing Flow (Current UX)

#### A.3.1 Single-Scheme Arguments (Legacy & New)

**ArgumentCardV2** component:
```tsx
<button onClick={() => setSchemeDialogOpen(true)}>
  <span>{schemeName}</span>
  {/* No multi-scheme indicator */}
</button>
```

**User sees**:
- Simple scheme name badge (e.g., "Practical Reasoning")
- Click opens SchemeSpecificCQsModal
- Single set of CQs from that scheme

---

#### A.3.2 Multi-Scheme Arguments (Phase 1 ✅)

**ArgumentCardV2** enhanced display:
```tsx
<button onClick={() => setSchemeDialogOpen(true)}>
  <span>{formatSchemeDisplay({ schemeName, schemes })}</span>
  {/* Shows "Primary + 2 more" if multi-scheme */}
  
  {shouldShowMultiSchemeUI({ schemeName, schemes }) && (
    <span className="count-badge">{schemes.length}</span>
  )}
</button>
```

**User sees**:
- Smart formatting: "Practical Reasoning + 2 more"
- Count badge (e.g., "3") indicating multiple schemes
- Tooltip: "Primary: Practical Reasoning • 2 supporting schemes"

**Click behavior**: Opens enhanced modal showing:
- **ArgumentSchemeList**: All schemes with roles (primary, supporting, presupposed)
- **MultiSchemeBadge** for each scheme with role indicator
- **ComposedCQsModal**: CQs from ALL schemes, grouped by source

---

#### A.3.3 Argument Nets (Phase 4 - Partial ✅)

**ArgumentNetAnalyzer** component:

**Flow**:
1. Component detects if argument is multi-scheme net via `/api/nets/detect`
2. If single-scheme: Shows simple message
3. If multi-scheme net: Shows comprehensive analysis

**User Interface**:
```tsx
<ArgumentNetAnalyzer argumentId={id}>
  <Tabs>
    <Tab value="visualization">
      {/* Graph view of schemes as nodes, dependencies as edges */}
      <NetGraphWithCQs netId={netId} />
    </Tab>
    
    <Tab value="questions">
      {/* Composed CQ set from all schemes */}
      <ComposedCQPanel netId={netId} groupBy="scheme" />
    </Tab>
    
    <Tab value="history">
      {/* Version history of net structure */}
      <NetVersionHistory netId={netId} />
    </Tab>
  </Tabs>
</ArgumentNetAnalyzer>
```

**Visualization Features**:
- **Nodes**: Each scheme in the net
- **Edges**: Dependencies between schemes (sequential, presuppositional, etc.)
- **Styling**: 
  - Solid lines = explicit schemes
  - Dashed = presupposed
  - Dotted = implicit
- **Interactive**: Click node → see scheme details & CQs
- **Weakest Link**: Highlights scheme with lowest confidence

**Example Net Visualization**:
```
[Classification] ──→ [Values] ──→ [Consequences] ──→ [Practical Reasoning]
     85%              90%              70% (WEAK)         95%

Overall Confidence: 70% (weakest link principle)
```

---

#### A.3.4 Scheme Net Visualization (Phase 5C ✅)

**SchemeNetVisualization** component - Sequential chain display:

```tsx
<SchemeNetVisualization argumentId={id}>
  {/* Header */}
  <div>
    <h3>Scheme Net (4 steps)</h3>
    <span>Overall confidence: 🟡 70% (weakest link)</span>
  </div>
  
  {/* Step-by-step flow */}
  {net.steps.map(step => (
    <div className="step">
      <div className="step-header">
        <Badge>Step {step.order}</Badge>
        <span>{step.scheme.name}</span>
        <span>{getConfidenceBadge(step.confidence)} {step.confidence}%</span>
      </div>
      
      {/* Expandable details */}
      {expanded && (
        <div>
          <div>Input from: Step {step.inputFromStep}</div>
          <div>Role: {step.label}</div>
          {/* Show CQs for this step */}
          {showCQs && <CQList stepId={step.id} />}
        </div>
      )}
    </div>
  ))}
</SchemeNetVisualization>
```

**User Experience**:
- **Linear flow**: Top-to-bottom steps showing reasoning progression
- **Confidence indicators**: Color-coded per step (🟢🟡🔴)
- **Weakest link highlighted**: Visual emphasis on lowest confidence step
- **Expandable steps**: Click to see input mappings, CQs
- **Toggle CQs button**: Show/hide all critical questions by step

---

#### A.3.5 Composed CQ Panel (Phase 4 ✅)

**ComposedCQPanel** component - Net-aware CQ display:

```tsx
<ComposedCQPanel netId={netId}>
  {/* Grouping options */}
  <Select value={groupBy}>
    <SelectItem value="scheme">Group by Scheme</SelectItem>
    <SelectItem value="dependency">Group by Dependency</SelectItem>
    <SelectItem value="attack-type">Group by Attack Type</SelectItem>
    <SelectItem value="burden">Group by Burden of Proof</SelectItem>
  </Select>
  
  {/* Filters */}
  <FilterPanel>
    <Checkbox label="Critical" checked={filterPriority.includes("critical")} />
    <Checkbox label="Scheme CQs" checked={filterType.includes("scheme")} />
    <Checkbox label="Dependency CQs" checked={filterType.includes("dependency")} />
  </FilterPanel>
  
  {/* CQ groups */}
  <Accordion>
    {groups.map(group => (
      <AccordionItem>
        <AccordionTrigger>
          <span>{group.groupLabel}</span>
          <Badge>{group.questions.length} questions</Badge>
          <MultiSchemeBadge role={group.role} />
        </AccordionTrigger>
        
        <AccordionContent>
          {group.questions.map(cq => (
            <CQCard
              question={cq}
              onSchemeClick={() => onSchemeSelect(cq.targetSchemeId)}
              onAnswerSubmit={(answer) => onAnswerSubmit(cq.id, answer)}
            >
              <BurdenBadge burden={cq.burdenOfProof} />
              {cq.requiresEvidence && <Badge>Evidence Required</Badge>}
            </CQCard>
          ))}
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
</ComposedCQPanel>
```

**Key Features**:
- **Flexible grouping**: By scheme, dependency, attack type, or burden
- **Advanced filtering**: Priority level, CQ type, burden of proof
- **Visual indicators**:
  - `MultiSchemeBadge`: Shows which scheme CQ targets (role, explicitness)
  - `BurdenBadge`: PROPONENT vs CHALLENGER burden
  - Evidence requirement badges
- **Interactive**:
  - Click scheme → highlights in visualization
  - Click dependency → shows connecting edge
  - Answer inline → submits response

**CQ Types in Nets**:
1. **Scheme CQs**: Standard questions from individual schemes
2. **Dependency CQs**: Questions about links between schemes
   - "Does the classification actually trigger the commitment?"
   - "Does the commitment lead to the predicted consequences?"
3. **Net-structure CQs**: Questions about overall strategy
   - "Is this the complete argumentative chain?"
   - "Are implicit schemes properly justified?"
4. **Explicitness CQs**: Questions about presupposed/implied schemes
   - "Should this presupposed scheme be made explicit?"
   - "Is the implicit warrant justified?"

---

### A.4 Creation Flow (Current UX)

#### A.4.1 Single-Scheme Creation (Current - ArgumentConstructor)

**File**: `components/argumentation/ArgumentConstructor.tsx`

**User Journey**:
```
Step 1: Scheme Selection
├─ User picks from scheme catalog
├─ Shows scheme name, description, CQ count
└─ For attacks: Pre-selected via suggestion

Step 2: Template Customization
├─ Fill variables (e.g., {action}, {goal})
├─ Optional: Customize premise templates
└─ See formal structure if available

Step 3: Premises Filling
├─ Fill each premise (major, minor, etc.)
├─ Real-time scoring feedback (40-100%)
├─ NEW (Phase 1): "Pick Existing Claim" button per premise
└─ Shows quality indicators per premise

Step 4: Evidence Collection
├─ Add citations (URL, DOI, library)
├─ Link evidence to specific premises
└─ Optional but improves score

Step 5: Review & Submit
├─ See complete argument preview
├─ Final quality score
├─ Submit → creates Argument + Claims + CA (if attack)
└─ NEW (Phase 1): Uses picked claim IDs instead of creating duplicates
```

**Current Limitations**:
- ❌ Can only select **one scheme**
- ❌ No way to add supporting schemes
- ❌ No way to specify scheme roles (primary vs supporting)
- ❌ No dependency modeling between schemes
- ❌ No net structure visualization during creation

---

#### A.4.2 Multi-Scheme Creation (NOT YET IMPLEMENTED 🚧)

**Proposed Flow** (from deliberation system overhaul strategy):

**ArgumentNetBuilder** component (NOT YET BUILT):

```tsx
<ArgumentNetBuilder deliberationId={id}>
  {/* Step 1: Primary Scheme Selection */}
  <SchemeSelector mode="primary" onSelect={setPrimaryScheme} />
  
  {/* Step 2: Add Supporting Schemes */}
  <Button onClick={openSupportingSchemeDialog}>
    + Add Supporting Scheme
  </Button>
  
  {/* Dialog */}
  <SchemeAdditionDialog>
    <SchemeSelector mode="supporting" />
    <Select label="Role">
      <SelectItem value="supporting">Supporting Premise</SelectItem>
      <SelectItem value="presupposed">Presupposed Warrant</SelectItem>
      <SelectItem value="implicit">Implicit Assumption</SelectItem>
    </Select>
    <Select label="Explicitness">
      <SelectItem value="explicit">Explicit (stated)</SelectItem>
      <SelectItem value="presupposed">Presupposed (assumed)</SelectItem>
      <SelectItem value="implied">Implied (unstated)</SelectItem>
    </Select>
  </SchemeAdditionDialog>
  
  {/* Step 3: Fill Premises for Each Scheme */}
  {schemes.map(scheme => (
    <SchemePremiseEditor scheme={scheme}>
      {/* Similar to current ArgumentConstructor */}
      <PremiseFilling premises={scheme.premises} />
    </SchemePremiseEditor>
  ))}
  
  {/* Step 4: Define Dependencies */}
  <DependencyBuilder schemes={schemes}>
    {/* Drag-and-drop or form-based */}
    <DependencyEdge
      from={scheme1}
      to={scheme2}
      type="sequential" // or "presuppositional", "support", etc.
    />
  </DependencyBuilder>
  
  {/* Step 5: Net Preview */}
  <NetVisualization
    net={buildingNet}
    mode="preview"
    editable={true}
  />
  
  {/* Step 6: Submit */}
  <Button onClick={createArgumentNet}>
    Create Multi-Scheme Argument
  </Button>
</ArgumentNetBuilder>
```

**Alternative: Incremental Addition**:

After creating single-scheme argument:
```tsx
<ArgumentCardV2 argument={existingArg}>
  {/* Shows current scheme(s) */}
  <Button onClick={openAddSchemeDialog}>
    + Add Supporting Scheme
  </Button>
  
  {/* Add scheme via API: POST /api/arguments/[id]/schemes */}
  <AddSchemeDialog>
    <SchemeSelector />
    <RoleSelector />
    <ExplicitnessSelector />
    <ConfidenceSlider />
    <TextEvidenceField placeholder="Quote from text that suggests this scheme..." />
  </AddSchemeDialog>
</ArgumentCardV2>
```

**This flow IS implemented** via:
- `POST /api/arguments/[id]/schemes` endpoint ✅
- `PATCH /api/arguments/[id]/schemes/[instanceId]` for updates ✅
- But missing UI component for easy access 🚧

---

### A.5 Current Gaps & Recommendations

#### Gap 1: No Multi-Scheme Creation UI 🔴 CRITICAL

**Problem**: Users can only create single-scheme arguments via ArgumentConstructor.

**Impact**: 
- Cannot model real complex arguments (policy, legal, scientific)
- Users forced to oversimplify their reasoning
- Misses 80% of real-world argument patterns (per Walton research)

**Recommendation**:
**Priority**: P0 (Phase 2)  
**Effort**: 12 hours

**Solution A**: Extend ArgumentConstructor with "Add Scheme" step:
```typescript
// Add after premises step
Step 4: Additional Schemes (Optional)
├─ "Add Supporting Scheme" button
├─ Repeat scheme selection + premise filling
├─ Specify role (supporting, presupposed, implicit)
└─ Define dependency to previous scheme
```

**Solution B**: Post-creation enhancement:
```typescript
// After argument created
<ArgumentDetailPanel>
  <SchemesSection>
    {/* Current: Read-only display */}
    {/* NEW: Editable with Add button */}
    <Button onClick={addScheme}>+ Add Scheme</Button>
  </SchemesSection>
</ArgumentDetailPanel>
```

**Recommendation**: **Solution B first** (easier, backward compatible)
- Leverage existing API endpoints
- No changes to ArgumentConstructor needed
- Users can incrementally enhance arguments
- Then Solution A in Phase 3 for expert users

---

#### Gap 2: Net Detection is Hidden 🟡 MODERATE

**Problem**: ArgumentNetAnalyzer automatically detects nets, but users don't see:
- When detection happens
- Why net was detected
- What signals triggered detection
- Option to review before confirmation

**Impact**:
- Users confused why some arguments show net UI
- No transparency in AI detection
- Can't correct false positives/negatives

**Recommendation**:
**Priority**: P1 (Phase 2)  
**Effort**: 4 hours

**Solution**: Add detection notification:
```tsx
<Alert variant="info">
  <Network className="h-4 w-4" />
  <AlertTitle>Multi-Scheme Net Detected</AlertTitle>
  <AlertDescription>
    This argument uses {schemeCount} schemes:
    {schemes.map(s => <Badge>{s.name}</Badge>)}
    
    <div className="mt-2 text-xs">
      Detection method: {detection.method}
      Confidence: {detection.confidence}%
      Signals: {detection.signals.join(", ")}
    </div>
    
    <div className="flex gap-2 mt-3">
      <Button size="sm" onClick={confirmNet}>
        Confirm Net Structure
      </Button>
      <Button size="sm" variant="ghost" onClick={dismissAsMultiScheme}>
        Treat as Single Scheme
      </Button>
      <Button size="sm" variant="ghost" onClick={editNetStructure}>
        Edit Structure
      </Button>
    </div>
  </AlertDescription>
</Alert>
```

---

#### Gap 3: No Guidance for Net Patterns 🟡 MODERATE

**Problem**: Users don't know common net patterns exist:
- Policy arguments (Classification → Values → Consequences → Action)
- Authority arguments (Expert → Commitment → Action)
- Scientific arguments (Evidence → Causal → Prediction)

**Impact**:
- Users reinvent patterns each time
- Inconsistent argumentation across similar domains
- Steeper learning curve

**Recommendation**:
**Priority**: P2 (Phase 3)  
**Effort**: 8 hours

**Solution**: Pattern library + suggestions:
```tsx
<ArgumentNetBuilder>
  {/* When user adds 2nd scheme */}
  <Alert>
    <Sparkles className="h-4 w-4" />
    <AlertTitle>Pattern Detected</AlertTitle>
    <AlertDescription>
      Your argument matches the <strong>Policy Argument</strong> pattern.
      
      Typical structure:
      1. Classification → 2. Values → 3. Consequences → 4. Action
      
      You have: Classification + {currentScheme}
      
      <Button size="sm" onClick={applyConcern}>
        Apply Full Pattern
      </Button>
      <Button size="sm" variant="ghost">
        Continue Manually
      </Button>
    </AlertDescription>
  </Alert>
  
  {/* Pattern library */}
  <Dialog>
    <DialogTrigger>Browse Patterns</DialogTrigger>
    <DialogContent>
      <Tabs>
        <Tab value="policy">Policy Arguments</Tab>
        <Tab value="authority">Authority Arguments</Tab>
        <Tab value="scientific">Scientific Arguments</Tab>
        <Tab value="legal">Legal Arguments</Tab>
      </Tabs>
      
      {patterns.map(pattern => (
        <PatternCard pattern={pattern}>
          <Button onClick={() => applyPattern(pattern)}>
            Use This Pattern
          </Button>
        </PatternCard>
      ))}
    </DialogContent>
  </Dialog>
</ArgumentNetBuilder>
```

---

#### Gap 4: Dependency Creation is Unclear 🟡 MODERATE

**Problem**: Even when users add multiple schemes, dependencies between them aren't clear:
- How does Scheme A relate to Scheme B?
- Is it sequential (A feeds into B)?
- Is it presuppositional (A assumes B)?
- Is it supporting (A strengthens B)?

**Current State**: Dependencies auto-detected but not user-editable.

**Recommendation**:
**Priority**: P1 (Phase 2)  
**Effort**: 6 hours

**Solution**: Explicit dependency editor:
```tsx
<DependencyEditor schemes={multiSchemeArgument.schemes}>
  {/* For each pair of schemes */}
  {schemePairs.map(([schemeA, schemeB]) => (
    <DependencyRow>
      <Badge>{schemeA.name}</Badge>
      <ArrowRight />
      <Badge>{schemeB.name}</Badge>
      
      <Select value={dependency.type}>
        <SelectItem value="sequential">
          Sequential (A feeds conclusion into B's premise)
        </SelectItem>
        <SelectItem value="presuppositional">
          Presuppositional (B assumes A is true)
        </SelectItem>
        <SelectItem value="support">
          Support (A strengthens B's argument)
        </SelectItem>
        <SelectItem value="justificational">
          Justificational (A justifies B's warrant)
        </SelectItem>
      </Select>
      
      <Input placeholder="Explain connection..." />
    </DependencyRow>
  ))}
</DependencyEditor>
```

---

#### Gap 5: CQ Composition is Overwhelming 🟢 MINOR

**Problem**: Multi-scheme arguments can have 20-50 CQs (5-15 per scheme × 3-5 schemes).

**Current Solution**: ComposedCQPanel with grouping/filtering ✅

**Additional Enhancement**:
**Priority**: P3 (Phase 4)  
**Effort**: 3 hours

**Solution**: Smart CQ prioritization:
```tsx
<ComposedCQPanel netId={netId}>
  {/* Add priority intelligence */}
  <Tabs defaultValue="critical">
    <Tab value="critical">
      Critical (Must Answer) — {criticalCount}
    </Tab>
    <Tab value="high">
      High Priority — {highCount}
    </Tab>
    <Tab value="optional">
      Optional Refinement — {optionalCount}
    </Tab>
  </Tabs>
  
  {/* Within each group, sort by */}
  <Select value={sortBy}>
    <SelectItem value="burden">Burden of Proof (PROPONENT first)</SelectItem>
    <SelectItem value="scheme">Scheme Order (Primary first)</SelectItem>
    <SelectItem value="weakness">Weakest Link First</SelectItem>
  </Select>
</ComposedCQPanel>
```

---

#### Gap 6: SchemeNet Builder Wizard 🟡 MEDIUM (NEW)

**Status**: Missing  
**Severity**: MEDIUM  
**Effort**: 12 hours  
**Phase**: Phase 4 (Advanced Features)  
**Priority**: P2 (High value for pedagogy and complex arguments)

**Problem**: 
No UI for creating explicit SchemeNet records with SchemeNetStep chains. Serial nets (step-by-step reasoning chains) require explicit step ordering, dependencies (inputFromStep), and per-step metadata. Current UI only supports implicit multi-scheme via ArgumentSchemeInstance records.

**Impact**:
- ❌ Cannot create serial nets with explicit chaining (Expert → Sign → Causal)
- ❌ Cannot specify dependencies between schemes (inputSlotMapping)
- ❌ Cannot label steps or set per-step confidence
- ❌ SchemeNetVisualization has limited test data (must use seed scripts)
- ❌ Weakest link analysis less accurate without per-step confidence

**Current Workaround**: 
Seed scripts directly create SchemeNet + SchemeNetStep records (`seed-multi-scheme-test-argument.ts`).

**Why It Matters**:
- Serial nets show step-by-step reasoning chains (most pedagogical)
- Weakest link analysis requires per-step confidence
- Dependencies make logical flow explicit (A feeds into B feeds into C)
- Useful for teaching argumentation theory
- Common in scientific arguments (hypothesis → evidence → mechanism)

**Recommendation**: Create SchemeNetBuilder wizard component (Phase 4)

**Solution**:
```tsx
<SchemeNetBuilder 
  argumentId={argumentId}
  onComplete={(netId) => { /* refresh */ }}
>
  {/* Step 1: Overview */}
  <NetTypeSelector>
    <RadioGroup value={netType}>
      <Radio value="serial">Serial Chain (A → B → C)</Radio>
      <Radio value="convergent">Convergent (A+B+C → D)</Radio>
      <Radio value="divergent">Divergent (A → B, A → C, A → D)</Radio>
      <Radio value="hybrid">Hybrid (mixed structure)</Radio>
    </RadioGroup>
  </NetTypeSelector>

  {/* Step 2: Add Steps */}
  <NetStepsEditor steps={steps}>
    <StepCard order={1}>
      <SchemeSelector value={step.schemeId} />
      <Input 
        label="Step Label"
        value={step.label}
        placeholder="Expert Consensus"
      />
      <Textarea
        label="Step Text"
        value={step.stepText}
        placeholder="Climate scientists agree..."
      />
      <Slider
        label="Confidence"
        value={step.confidence}
        min={0}
        max={1}
        step={0.01}
      />
    </StepCard>
    <Button onClick={addStep}>+ Add Step</Button>
  </NetStepsEditor>

  {/* Step 3: Dependencies (for serial/hybrid) */}
  {netType === "serial" || netType === "hybrid" ? (
    <DependencyEditor steps={steps}>
      {steps.map((step, i) => (
        <DependencyRow key={step.id}>
          <span>Step {i + 1}: {step.label}</span>
          <Select 
            label="Feeds from"
            value={step.inputFromStep}
          >
            <SelectItem value={null}>None (first step)</SelectItem>
            {steps.slice(0, i).map(prev => (
              <SelectItem value={prev.order}>
                Step {prev.order}: {prev.label}
              </SelectItem>
            ))}
          </Select>
          {step.inputFromStep && (
            <Input
              label="Slot Mapping (optional)"
              placeholder='{"A": "P1.conclusion"}'
              value={JSON.stringify(step.inputSlotMapping)}
            />
          )}
        </DependencyRow>
      ))}
    </DependencyEditor>
  ) : null}

  {/* Step 4: Preview & Submit */}
  <NetPreview>
    <SchemeNetVisualization 
      schemeNet={{
        steps: steps,
        overallConfidence: Math.min(...steps.map(s => s.confidence)),
      }}
    />
  </NetPreview>

  <DialogFooter>
    <Button onClick={submitNet}>Create Net</Button>
  </DialogFooter>
</SchemeNetBuilder>
```

**API Calls**:
```typescript
// 1. Create SchemeNet record
POST /api/nets
{
  argumentId: "arg-123",
  description: "Sequential chain: Expert → Sign → Causal",
  overallConfidence: 0.88
}

// 2. Create SchemeNetStep records (one per step)
POST /api/nets/[netId]/steps
{
  stepOrder: 1,
  schemeId: "expert-opinion",
  label: "Expert Consensus",
  stepText: "Climate scientists agree...",
  confidence: 0.95,
  inputFromStep: null
}
// ... repeat for steps 2, 3, etc.
```

**Tasks**:
1. Create SchemeNetBuilder wizard component shell (2h)
2. Implement NetTypeSelector (1h)
3. Implement NetStepsEditor with add/remove/reorder (3h)
4. Implement DependencyEditor with inputFromStep selector (2h)
5. Implement slot mapping input (JSON editor) (1h)
6. Wire up POST /api/nets and /api/nets/[id]/steps endpoints (2h)
7. Test with all net types (serial, convergent, divergent, hybrid) (1h)

**Testing Strategy**:
- Replicate `seed-multi-scheme-test-argument.ts` via UI
- Create Expert → Sign → Causal serial net manually
- Verify SchemeNetVisualization displays correctly
- Test weakest link calculation with per-step confidence

**User Story**:
```
As an expert user
I want to create a serial net showing Expert Opinion → Sign Evidence → Causal Mechanism
With each step's confidence clearly specified
So that the system can identify the weakest link in my reasoning chain
And other users can follow my step-by-step logic
```

**Phase 4 Integration**:
This component complements the post-creation scheme addition UI (Gap #2, Phase 2):
- **Phase 2**: Add schemes to existing arguments (simple multi-scheme)
- **Phase 4**: Build complete nets with explicit dependencies (advanced multi-scheme)

---

### A.6 Integration with ArgumentConstructor Enhancement Roadmap

**Phase 1 (Complete ✅)**:
- Attack Context Integration → Enables net-aware attacks
- Existing Claim Picker → Reduces duplication in net construction
- Dual Premise Mode Structure → Foundation for formal schemes in nets

**Phase 2 (Proposed - Add 16 hours)**:
- **Complete Dual Premise Modes** (4h remaining) → Walton schemes support
- **Multi-Scheme Addition UI** (6h) → POST /api/arguments/[id]/schemes UI
- **Dependency Editor** (6h) → Make scheme relationships explicit
- Rich Text Editors (4h)
- Formal Structure Display (3h)
- Slot Hints (4h)
- Event Dispatching (1h)

**NEW TOTAL**: 24 hours (vs 16 hours originally)

**Phase 3 (Proposed - Add 8 hours)**:
- **Net Pattern Library** (8h) → Common argument structures
- CQ Preview (3h)
- Axiom Designation (2h)
- Warrant Field (1h)
- Callback Variants (1h)
- Testing & Docs (5h)

**NEW TOTAL**: 20 hours (vs 12 hours originally)

**Phase 4 (Future - New)**:
- **ArgumentNetBuilder** (20h) → Full net construction wizard
- **Net Detection Transparency** (4h) → User-visible detection flow
- **CQ Prioritization** (3h) → Smart CQ sorting
- **Net Pattern Suggestions** (5h) → AI-powered pattern matching

**TOTAL**: 32 hours

---

### A.7 Recommended Immediate Actions

**Before Phase 2**:
1. ✅ Document current multi-scheme implementation status (this appendix)
2. 🔲 Review ArgumentNetAnalyzer integration with ArgumentConstructor
3. 🔲 Test multi-scheme display in ArgumentCardV2 with real data
4. 🔲 Verify ComposedCQPanel works with ArgumentConstructor-created arguments

**Phase 2 Priority Changes**:
1. **Add**: Multi-Scheme Addition UI (6h) - **CRITICAL FOR REAL ARGUMENTS**
2. **Add**: Dependency Editor (6h) - Makes relationships explicit
3. Keep: Complete Dual Premise Modes (4h)
4. Keep: Rich Text Editors (4h)
5. Keep: Formal Structure Display (3h)
6. Keep: Slot Hints (4h)
7. Defer: Event dispatching to Phase 3 (not blocking)

**New Phase 2 Total**: 27 hours (increased from 16h to accommodate multi-scheme features)

**Key Decision Point**: 
Should ArgumentConstructor support multi-scheme creation **during** initial construction (Solution A - 12h), or only post-creation enhancement (Solution B - 6h)?

**Recommendation**: Solution B first (Phase 2), Solution A later (Phase 4)
- Faster time-to-value
- Leverages existing API
- Non-breaking change
- Expert users can incrementally build nets
- Then full wizard for power users

---

### A.8 User Stories for Multi-Scheme Arguments

**Story 1: Policy Analyst** (Advanced User)
```
As a policy analyst
I want to construct a complete policy argument with classification, values, and consequences
So that I can make a comprehensive case for my proposed action

Current: Must create 3 separate arguments, manually reference each other
Future: Create single multi-scheme argument, system tracks dependencies
```

**Story 2: Novice Debater** (Beginner)
```
As a new user
I want to see that my argument uses multiple schemes without being overwhelmed
So that I can understand my argument's structure without expert knowledge

Current: Only sees primary scheme, misses complexity
Future: Sees "3-scheme net" badge, can explore step-by-step
```

**Story 3: Challenger** (Attacker)
```
As someone challenging an argument
I want to see all schemes in the argument net
So that I can identify the weakest link to attack

Current: Must manually analyze text, guess at implicit schemes
Future: Net visualization shows all schemes, confidence scores, weakest link highlighted
```

**Story 4: Critical Questioner** (Reviewer)
```
As a deliberation participant
I want to see all critical questions for all schemes in one place
So that I can systematically evaluate the complete argument

Current: Must click through each scheme individually
Future: ComposedCQPanel shows all CQs, grouped and filtered
```

---

### A.9 Summary & Action Items

**Current State**:
- ✅ Database schema supports multi-scheme arguments (Phase 1 complete)
- ✅ API endpoints support adding/editing/removing schemes (Phase 1 complete)
- ✅ Display components show multi-scheme arguments beautifully (Phase 4 partial)
- ✅ Net detection and visualization works (Phase 4 partial)
- ❌ Creation flow only supports single schemes (BLOCKING GAP)
- ❌ No UI for post-creation scheme addition (BLOCKING GAP)
- ❌ No dependency editor (MODERATE GAP)
- ❌ No pattern library (NICE-TO-HAVE)

**Critical Path**:
1. **Phase 2**: Add post-creation multi-scheme UI (6h) - **UNBLOCKS 80% OF USE CASES**
2. **Phase 2**: Add dependency editor (6h) - Makes relationships clear
3. **Phase 2**: Complete dual premise modes (4h) - Formal scheme support
4. **Phase 3**: Add pattern library (8h) - Improves consistency
5. **Phase 4**: Add ArgumentNetBuilder (20h) - Full wizard for power users

**ROI Analysis**:
- **6 hours** (post-creation UI) → Enables all multi-scheme argument use cases
- **12 hours** (+ dependency editor) → Makes nets understandable and editable
- **20 hours** (+ dual modes) → Full formal argumentation support
- **32 hours** (+ all enhancements) → Production-ready multi-scheme system

**Recommendation**: Proceed with modified Phase 2 roadmap including multi-scheme UI (27 hours total vs 16 hours original).

---

**End of Appendix A**
