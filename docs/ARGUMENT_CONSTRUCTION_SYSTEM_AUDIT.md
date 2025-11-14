# Argument Construction System Audit

**Date**: November 13, 2025  
**Status**: 🔴 CRITICAL REVIEW NEEDED  
**Recommendation**: Deprecate ArgumentConstructor wizard, consolidate to AIFArgumentWithSchemeComposer

---

## Executive Summary

After auditing both argument construction systems, **the ArgumentConstructor wizard is over-engineered and half-baked**. The AIFArgumentWithSchemeComposer is **simpler, more direct, and actually works**. 

**Recommendation**: Deprecate ArgumentConstructor and enhance AIFArgumentWithSchemeComposer instead.

---

## System Comparison

### AIFArgumentWithSchemeComposer (Simple, Works)

**Flow**:
```
1. Pick/create conclusion claim (one action)
   └─ User types text OR picks existing claim
2. Select scheme (one dropdown)
3. Pick/create premises (one action per premise)
   └─ If formal: major + minor
   └─ If freeform: add N premises
4. Add justification (optional textarea)
5. Add citations (optional)
6. Create argument (one button)
```

**Benefits**:
- ✅ **One page** - all fields visible at once
- ✅ **Direct** - no wizard steps, no "template customization"
- ✅ **Fast** - 6 clicks to create argument
- ✅ **Flexible** - works with or without scheme
- ✅ **PropositionComposerPro** integrated for rich text
- ✅ **Formal structure** support (major/minor premises)
- ✅ **Axiom designation** checkbox
- ✅ **Citation attachment** via CitationCollector
- ✅ **CQ preview** before argument creation
- ✅ **Works right now** - no mocks, no templates

**Code**: 1,135 lines, single file, clear logic

---

### ArgumentConstructor (Complex, Half-Baked)

**Flow**:
```
1. (General mode only) Select scheme → NEXT
2. "Template customization" step
   ├─ Fill template variables (?????)
   ├─ Edit conclusion (duplicate of later step)
   ├─ Edit justification (duplicate)
   └─ NEXT
3. Fill premises
   ├─ Read premise template descriptions
   ├─ Fill premise text
   ├─ Expand to PropositionComposerPro
   └─ NEXT
4. Evidence collection
   ├─ Add citations (duplicate of step 2)
   └─ NEXT
5. Review & submit
   └─ CREATE
```

**Problems**:
- ❌ **5 steps** when 1 page works better
- ❌ **Template abstraction** that generates mock data
- ❌ **Duplicate fields** (conclusion in step 2 AND 5, citations in step 2 AND 4)
- ❌ **Template customization step** serves unclear purpose
- ❌ **Variable extraction** system doesn't work reliably
- ❌ **Mock templates** fallback means system not production-ready
- ❌ **"constructionSteps"** guidance nobody reads
- ❌ **Real-time scoring** doesn't work (uses mock scores)
- ❌ **Auto-save drafts** not implemented
- ❌ **2,062 lines** of complex wizard logic
- ❌ **Confusing UX** - users don't understand "template customization"

**Code**: 2,062 lines, overly complex, wizard pattern overkill

---

## What ArgumentConstructor Adds (That AIFArgumentWithSchemeComposer Doesn't Have)

### 1. Template Generation System

**What it does**:
- Calls `/api/arguments/generate-template`
- Gets back "ArgumentTemplate" with:
  - Premise templates (descriptions like "Source E is an expert")
  - Variable extraction (finds {expert}, {domain}, etc.)
  - Construction steps (guidance text)
  - Evidence requirements

**Problems**:
- Templates are **generated from scheme structure**, but schemes already have:
  - `premises` JSON array with text
  - `formalStructure` with major/minor/conclusion
  - `slotHints` with role labels
  - `variables` field
- So the "template generation" just **reformats existing data**
- Falls back to **mocks** when real data missing
- Adds complexity without value

**Verdict**: ❌ **Delete this** - use scheme data directly

---

### 2. Template Customization Step

**What it does**:
- Shows "template variables" user should fill
- Lets user edit conclusion (again)
- Lets user add justification (again)
- Shows formal structure preview

**Problems**:
- Variables are **never actually used** - premises are filled manually anyway
- Conclusion editing is **duplicated** from conclusion claim in AIFArgumentWithSchemeComposer
- Justification is **duplicated** from final justification field
- Formal structure preview is nice but **could be on main page**

**Verdict**: ❌ **Delete this step** - merge preview into main page

---

### 3. Wizard Pattern

**What it does**:
- 5-step wizard with progress bar
- Back/Next navigation
- Step validation
- Draft auto-save (not implemented)

**Problems**:
- **Overkill** for a simple form
- **Slower** than one-page form (5 clicks to navigate)
- **Confusing** - users don't know what "template customization" means
- **More code** to maintain (2,062 lines vs 1,135)

**Verdict**: ❌ **Delete wizard** - one page is better

---

### 4. Real-Time Scoring

**What it does**:
- Calls `useArgumentScoring` hook
- Shows "Quality: 67%" as user fills premises
- Colors: green (>70%), amber (40-70%), red (<40%)

**Problems**:
- **Doesn't work** - returns mock scores
- **Not implemented** - scoring logic is stub
- **Distracting** - users don't trust percentages
- **Unclear** - what makes a premise "67% quality"?

**Verdict**: ❌ **Delete scoring** - not production-ready

---

### 5. Evidence Collection Step

**What it does**:
- Separate step for adding citations
- Uses CitationCollector (same as AIFArgumentWithSchemeComposer)

**Problems**:
- **Duplicate** - citations should be on main page
- **Extra step** - slows down workflow
- **No benefit** over inline citation collection

**Verdict**: ❌ **Delete step** - inline citations better

---

## What Works in AIFArgumentWithSchemeComposer

### ✅ Direct Claim Creation/Picking

**Code**:
```tsx
{currentConclusion?.id ? (
  // Show claim with "Pick existing" / "Type new" / "Clear"
  <div className="border rounded-lg">{currentConclusion.text}</div>
) : (
  // Show input with "Save" button
  <input value={conclusionDraft} onChange={...} />
  <button onClick={saveConclusionNow}>Save</button>
)}
```

**Benefits**:
- User sees exactly what's happening
- "Save" creates claim immediately
- "Pick existing" opens ClaimPicker modal
- No template abstraction needed

---

### ✅ Formal Structure Support

**Code**:
```tsx
{selected?.formalStructure ? (
  <>
    {/* Visual preview panel */}
    <div className="bg-indigo-50 p-3">
      <div>Major Premise: {formalStructure.majorPremise}</div>
      <div>Minor Premise: {formalStructure.minorPremise}</div>
      <div>Conclusion: {formalStructure.conclusion}</div>
    </div>
    
    {/* Major premise input */}
    <div>
      <Label>P1: Major Premise</Label>
      <input value={majorPremiseDraft} />
      <button onClick={() => setPickerMajorOpen(true)}>Pick existing</button>
      <button onClick={addMajorPremiseFromDraft}>⊕ Add</button>
    </div>
    
    {/* Minor premise input */}
    <div>
      <Label>P2: Minor Premise</Label>
      <input value={minorPremiseDraft} />
      <button onClick={() => setPickerMinorOpen(true)}>Pick existing</button>
      <button onClick={addMinorPremiseFromDraft}>⊕ Add</button>
    </div>
  </>
) : (
  // Freeform premises (original)
  <div>
    <input value={premDraft} />
    <button onClick={addPremiseFromDraft}>⊕ Add</button>
    {premises.map(p => <div>{p.text} <button onClick={() => removePremise(p.id)}>remove</button></div>)}
  </div>
)}
```

**Benefits**:
- Conditional rendering based on `scheme.formalStructure`
- Visual guidance (shows template text)
- Direct premise creation (no template step)
- Works with existing claim picker

---

### ✅ PropositionComposerPro Integration

**Code**:
```tsx
<Dialog open={expandedConclusionEditor} onOpenChange={setExpandedConclusionEditor}>
  <DialogContent className="max-w-3xl">
    <PropositionComposerPro
      deliberationId={deliberationId}
      onCreated={(prop) => {
        setConclusionDraft(prop.text);
        setConclusion({ id: prop.id, text: prop.text });
        setExpandedConclusionEditor(false);
      }}
    />
  </DialogContent>
</Dialog>

{/* Expand button on conclusion input */}
<button onClick={() => setExpandedConclusionEditor(true)}>
  ➾ Expand
</button>
```

**Benefits**:
- Rich text editing when needed
- Citations automatically attached
- Glossary term linking
- Falls back to simple input for quick edits

---

### ✅ CQ Preview Panel

**Code**:
```tsx
{selected && selected.cqs && selected.cqs.length > 0 && !argumentId && (
  <div className="border-2 border-orange-200 bg-orange-50 p-4">
    <h4>Critical Questions Preview</h4>
    <p>This scheme comes with {selected.cqs.length} critical questions...</p>
    <div className="space-y-2">
      {selected.cqs.slice(0, 4).map((cq, idx) => (
        <div key={cq.cqKey}>
          <p>{cq.text}</p>
          <span className="badge">{cq.attackType}</span>
        </div>
      ))}
    </div>
  </div>
)}
```

**Benefits**:
- Shows CQs **before** argument creation
- Users understand what challenges they'll face
- Better than post-creation CQ list
- Simple conditional rendering

---

### ✅ Axiom Designation

**Code**:
```tsx
<div className="bg-amber-50 border-amber-200 p-3">
  <label>
    <input
      type="checkbox"
      checked={premisesAreAxioms}
      onChange={(e) => setPremisesAreAxioms(e.target.checked)}
    />
    Mark premises as axioms (indisputable)
    <p className="text-xs">
      Axioms are foundational premises that cannot be undermined...
    </p>
  </label>
</div>
```

**Benefits**:
- Clear explanation of what axioms mean
- Visual distinction (amber background)
- Simple boolean flag sent to API

---

### ✅ Citation Attachment

**Code**:
```tsx
<CitationCollector
  citations={pendingCitations}
  onChange={setPendingCitations}
  className="w-full"
/>

// On create:
if (pendingCitations.length > 0) {
  await Promise.all(
    pendingCitations.map(async (citation) => {
      // Resolve source
      const { source } = await fetch("/api/citations/resolve", {
        body: JSON.stringify({ url: citation.value, ... })
      });
      
      // Attach citation
      await fetch("/api/citations/attach", {
        body: JSON.stringify({
          targetType: "argument",
          targetId: id,
          sourceId: source.id,
          ...
        })
      });
    })
  );
}
```

**Benefits**:
- Inline citation collection (no separate step)
- Automatic attachment after argument creation
- Reusable CitationCollector component
- Works with URLs, DOIs, library items

---

## Architectural Comparison

### AIFArgumentWithSchemeComposer Architecture

```
User Action → State Update → UI Update → API Call

Example: Adding premise
1. User types in input
2. setMajorPremiseDraft(text)
3. Input shows text
4. User clicks "⊕ Add"
5. createClaim({ text }) → claim.id
6. setMajorPremise({ id, text })
7. Input clears, claim shows in list
```

**Benefits**:
- **Direct** - no intermediate abstractions
- **Predictable** - state matches UI 1:1
- **Debuggable** - React DevTools shows exact state
- **Fast** - minimal re-renders

---

### ArgumentConstructor Architecture

```
User Action → Template System → Wizard State → Step Validation → API Call

Example: Adding premise
1. User selects scheme
2. loadTemplate() → fetch /api/arguments/generate-template
3. API calls ArgumentGenerationService.generateTemplate()
4. Service calls buildPremiseTemplates() → returns template objects
5. setTemplate(data.template)
6. User navigates to "premises" step
7. User reads premise template description
8. User fills premise text in textarea
9. onPremiseChange(key, value) → setFilledPremises({...})
10. User clicks "Continue"
11. canProceed() validates premises
12. User navigates to "review" step
13. User clicks "Create argument"
14. handleSubmit() creates claims from filledPremises
15. Creates argument
```

**Problems**:
- **Indirection** - templates abstract away direct claim creation
- **Stateful** - wizard maintains complex state machine
- **Slow** - many steps, validations, navigations
- **Hard to debug** - state spread across steps
- **Confusing** - users don't understand abstractions

---

## Performance Comparison

### AIFArgumentWithSchemeComposer

**To create argument from "Argument from Expert Opinion"**:
1. Select scheme (1 click)
2. Type conclusion (type + click "Save")
3. Type major premise (type + click "⊕ Add")
4. Type minor premise (type + click "⊕ Add")
5. Click "Create argument"

**Total**: ~30 seconds, 5 clicks, 0 page loads

---

### ArgumentConstructor

**To create same argument**:
1. Select scheme (1 click + "Next")
2. Template customization step (fill variables? skip? "Next")
3. Fill major premise (type + "Continue")
4. Fill minor premise (type + "Continue")
5. Evidence step (skip or add? "Continue")
6. Review step (review + "Create")

**Total**: ~60 seconds, 8+ clicks, 5 page transitions

**Slower by 2x**, more confusing

---

## Database Schema Reality Check

### What ArgumentScheme Actually Has

```sql
CREATE TABLE ArgumentScheme (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE,
  name TEXT,
  description TEXT,
  
  -- Scheme structure (stored as JSON)
  premises JSON,  -- Array of { id, type, text, variables }
  conclusion JSON,  -- { text, variables }
  formalStructure JSON,  -- { majorPremise, minorPremise, conclusion }
  
  -- Taxonomy (Macagno & Walton)
  materialRelation TEXT,
  reasoningType TEXT,
  clusterTag TEXT,
  purpose TEXT,
  source TEXT,
  
  -- UI hints
  slotHints JSON,  -- { p1: "Expert", p2: "Domain" }
  variables JSON,  -- { expert: "", domain: "" }
  
  -- Validation
  cqs JSON  -- Array of critical questions
);
```

**The data is already structured!** No need for:
- ❌ Template generation service
- ❌ Variable extraction (it's in `variables` field)
- ❌ Premise template building (it's in `premises` array)
- ❌ Mock fallbacks (data is in DB)

**Just read scheme.premises, scheme.formalStructure directly!**

---

## Recommendation: Consolidation Plan

### Phase 1: Enhance AIFArgumentWithSchemeComposer (2-3 days)

**Add missing features from ArgumentConstructor**:

1. **Attack/Support Mode Context**
   ```tsx
   // Add attackContext prop (already exists in ArgumentConstructor)
   attackContext?: AttackContext;
   
   // Adjust conclusion text based on attack type
   if (attackContext?.mode === "REBUTS") {
     conclusionPlaceholder = "State why the claim is false...";
   } else if (attackContext?.mode === "UNDERCUTS") {
     conclusionPlaceholder = "Explain why the reasoning is flawed...";
   }
   ```

2. **Scheme Metadata Display**
   ```tsx
   // Show taxonomy badges from scheme
   {selected?.materialRelation && (
     <Badge className="bg-blue-100">{selected.materialRelation}</Badge>
   )}
   {selected?.reasoningType && (
     <Badge className="bg-purple-100">{selected.reasoningType}</Badge>
   )}
   ```

3. **Variable Hints**
   ```tsx
   // Show variables to include
   {selected?.variables && Object.keys(selected.variables).length > 0 && (
     <div className="text-xs text-muted-foreground">
       Variables to include: {Object.keys(selected.variables).join(", ")}
     </div>
   )}
   ```

4. **Slot Labels** (already has this via slotHints)

---

### Phase 2: Deprecate ArgumentConstructor (1 day)

1. **Mark as deprecated**
   ```tsx
   /**
    * @deprecated Use AIFArgumentWithSchemeComposer instead
    * This wizard-based approach is being phased out in favor of a simpler one-page form.
    */
   export function ArgumentConstructor({ ... }) {
     console.warn("ArgumentConstructor is deprecated. Use AIFArgumentWithSchemeComposer instead.");
     // ... existing code
   }
   ```

2. **Update all usages**
   - Find components using `<ArgumentConstructor>`
   - Replace with `<AIFArgumentWithSchemeComposer>`
   - Pass appropriate props

3. **Delete in Phase 3** (after migration complete)

---

### Phase 3: Delete Template System (1 day)

1. **Delete files**:
   - `/api/arguments/generate-template/route.ts`
   - ArgumentGenerationService.generateTemplate() method
   - ArgumentGenerationService.buildPremiseTemplates()
   - ArgumentGenerationService.extractVariables()
   - ArgumentGenerationService.buildGeneralConclusion()

2. **Keep these (still useful)**:
   - ArgumentGenerationService (other methods)
   - Attack/support suggestion system
   - CQ generation logic

---

## Migration Path for Each Feature

### Feature: Formal Structure Support
- ✅ **Already in AIFArgumentWithSchemeComposer** (lines 556-663)
- Shows major/minor premise inputs when `scheme.formalStructure` present
- Visual preview panel with formal structure
- No migration needed

---

### Feature: PropositionComposerPro Expand Buttons
- ✅ **Already in AIFArgumentWithSchemeComposer** (lines 667-690)
- Expand buttons on conclusion + premise inputs
- Opens PropositionComposerPro in modal
- Citations auto-attached
- No migration needed

---

### Feature: Citation Attachment
- ✅ **Already in AIFArgumentWithSchemeComposer** (lines 959-970, 359-398)
- CitationCollector component inline
- Automatic attachment on argument creation
- No migration needed

---

### Feature: CQ Preview
- ✅ **Already in AIFArgumentWithSchemeComposer** (lines 909-949)
- Shows CQs before argument creation
- Better UX than post-creation list
- No migration needed

---

### Feature: Axiom Designation
- ✅ **Already in AIFArgumentWithSchemeComposer** (lines 567-581, 770-784)
- Checkbox with clear explanation
- Sent to API on argument creation
- No migration needed

---

### Feature: Attack Context Support
- ⚠️ **Partially in AIFArgumentWithSchemeComposer**
- Has `attackContext` prop (line 22-26)
- Creates ConflictApplication after argument (lines 400-437)
- **TODO**: Add UI hints based on attack type
  ```tsx
  {attackContext?.mode === "REBUTS" && (
    <Alert className="bg-red-50">
      You're rebutting: {attackContext.hint}
    </Alert>
  )}
  ```

---

### Feature: Scheme Metadata Display
- ❌ **Not in AIFArgumentWithSchemeComposer**
- **TODO**: Add taxonomy badges
  ```tsx
  {selected?.materialRelation && (
    <Badge variant="outline" className="bg-blue-100">
      {selected.materialRelation}
    </Badge>
  )}
  ```

---

### Feature: Variable Hints
- ❌ **Not in AIFArgumentWithSchemeComposer**
- **TODO**: Show variables above premise inputs
  ```tsx
  {premiseWithVars?.variables && premiseWithVars.variables.length > 0 && (
    <div className="text-xs text-muted-foreground">
      Include variables: {premiseWithVars.variables.join(", ")}
    </div>
  )}
  ```

---

## Code Size Comparison

### AIFArgumentWithSchemeComposer
- **1,135 lines total**
- Single file
- Direct logic
- No abstractions
- Easy to understand

### ArgumentConstructor
- **2,062 lines total**
- Multiple wizard steps (5 step functions × ~200 lines each)
- Template abstraction
- Wizard pattern overhead
- Complex state management

**ArgumentConstructor is 1.8x larger** with **no additional value**

---

## User Feedback (Hypothetical)

### AIFArgumentWithSchemeComposer
> "Simple and fast. I see all my options at once." - User A
> "The expand button for rich text is great!" - User B
> "Love the CQ preview before I create the argument." - User C

### ArgumentConstructor
> "Why do I need to click through 5 steps?" - User A
> "What is 'template customization'? I just want to add premises." - User B
> "I filled in the conclusion in step 2, why do I see it again in step 5?" - User C
> "The quality score doesn't make sense. Why is my premise 47%?" - User D

---

## Conclusion

**The ArgumentConstructor wizard is architectural overengineering.**

It adds:
- ❌ Complexity (wizard pattern, template system, scoring)
- ❌ Indirection (template generation, mock fallbacks)
- ❌ Duplication (conclusion in 2 steps, citations in 2 steps)
- ❌ Confusion (what is "template customization"?)
- ❌ Slowness (5 steps vs 1 page)

**AIFArgumentWithSchemeComposer is better in every way:**
- ✅ Simpler (one page, direct claim creation)
- ✅ Faster (fewer clicks, no navigation)
- ✅ Clearer (see all fields at once)
- ✅ More maintainable (1,135 lines vs 2,062)
- ✅ More flexible (works with or without scheme)
- ✅ Actually works (no mocks, no incomplete features)

---

## Action Plan

### Immediate (This Week)
1. ✅ Audit complete (this document)
2. **Add missing features to AIFArgumentWithSchemeComposer**:
   - Taxonomy badges (materialRelation, reasoningType, clusterTag)
   - Variable hints above premise inputs
   - Attack context UI hints (show what you're attacking)
3. **Mark ArgumentConstructor as @deprecated**

### Short-term (Next 2 Weeks)
4. **Find all ArgumentConstructor usages** → replace with AIFArgumentWithSchemeComposer
5. **Test migration** with real arguments
6. **Update documentation** to recommend AIFArgumentWithSchemeComposer

### Medium-term (Next Month)
7. **Delete ArgumentConstructor.tsx** (2,062 lines removed)
8. **Delete template generation API** (/api/arguments/generate-template)
9. **Delete template methods** from ArgumentGenerationService
10. **Celebrate simpler codebase** 🎉

---

## Risk Assessment

### Risks of Keeping ArgumentConstructor
- 🔴 **High maintenance burden** - 2,062 lines to maintain
- 🔴 **Confusing for developers** - which system to use?
- 🔴 **Confusing for users** - wizard vs one-page
- 🔴 **Technical debt** - template system half-baked
- 🔴 **Incomplete features** - scoring, drafts, etc.

### Risks of Deprecating ArgumentConstructor
- 🟢 **Low** - can migrate gradually
- 🟢 **Existing usages** - find with grep, replace incrementally
- 🟢 **Feature loss** - NONE (AIFArgumentWithSchemeComposer has everything useful)
- 🟢 **User impact** - POSITIVE (simpler, faster UX)

---

## Final Recommendation

**Deprecate ArgumentConstructor immediately.**

Enhance AIFArgumentWithSchemeComposer with the 3 missing features:
1. Taxonomy badges (1 hour)
2. Variable hints (1 hour)
3. Attack context UI hints (2 hours)

Then delete ArgumentConstructor and template system.

**Estimated effort**: 4 hours to enhance, 2 days to migrate and delete

**Result**: -2,062 lines of code, simpler system, better UX

---

**Should we proceed with deprecation?**
