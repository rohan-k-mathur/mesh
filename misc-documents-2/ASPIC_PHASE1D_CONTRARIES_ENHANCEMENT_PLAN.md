# ASPIC+ Phase 1d: Contraries System Enhancement

**Date**: November 17, 2025  
**Status**: Planning → Implementation  
**Priority**: MEDIUM  
**Estimated Time**: 2-3 days (16-24 hours)  
**Dependencies**: Phase 1b (Strict Rules) ✅ | Phase 1c (Transposition) ✅

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Enhancement Architecture](#3-enhancement-architecture)
4. [Implementation Plan](#4-implementation-plan)
5. [Testing Strategy](#5-testing-strategy)
6. [Rollout Timeline](#6-rollout-timeline)

---

## 1. Executive Summary

### 1.1 What Are Contraries?

**Contraries** in ASPIC+ define when two propositions cannot both be true. They enable:
- **Rebutting attacks**: Argument with conclusion φ rebuts argument with conclusion ψ if φ is contrary to ψ
- **Consistency checking**: Prevents arguments with contradictory premises
- **Attack graph construction**: Determines which arguments can attack each other

**Types**:
- **Contradictories** (symmetric): φ ↔ ¬φ (mutual exclusion)
- **Contraries** (asymmetric): φ → ¬ψ but ψ ↛ ¬φ (one-way incompatibility)

### 1.2 What Already Exists ✅

**Backend Infrastructure**:
- ✅ `ClaimContrary` model in Prisma schema
- ✅ `/api/contraries` endpoints (GET, POST, DELETE)
- ✅ `ClaimContraryManager` component (full UI)
- ✅ Integration in `ClaimDetailPanel`
- ✅ Contraries map in ASPIC+ theory structure

**What Works**:
- Users can define contrary relationships between claims
- Symmetric (contradictory) and asymmetric (contrary) relationships supported
- Contraries displayed in AspicTheoryViewer
- Contraries fetched and passed to ASPIC+ evaluation

### 1.3 What's Missing ❌

**Integration Gaps**:
- ❌ Contraries UI not prominent in deliberation flow
- ❌ No visual indicators on argument cards showing contraries
- ❌ No "quick contrary" button in argument composer
- ❌ No contrary suggestions/recommendations
- ❌ No contrary validation warnings

**UX Improvements Needed**:
- ❌ Make contraries more discoverable
- ❌ Show which arguments have contrary conclusions
- ❌ Warn when creating arguments with contrary premises
- ❌ Suggest common contraries (wet/dry, alive/dead, etc.)

### 1.4 Phase 1d Goals

```
✅ Enhance ClaimContraryManager visibility
✅ Add contrary indicators to argument cards
✅ Add "Mark as Contrary" button to claims
✅ Add contrary validation warnings
✅ Add contrary suggestions library
✅ Visual indicators in argument graph
✅ Integration tests
```

**Non-Goals** (deferred to Phase 2):
- ❌ Automatic contrary detection (NLP)
- ❌ Ontology-based contraries (WordNet integration)
- ❌ Temporal contraries (before/after relationships)

---

## 2. Current State Analysis

### 2.1 Database Schema ✅

From `prisma/schema.prisma` (lines 2612-2639):
```prisma
model ClaimContrary {
  id             String   @id @default(cuid())
  claimId        String
  contraryId     String
  isSymmetric    Boolean  @default(true)
  status         String   @default("ACTIVE") // ACTIVE | REMOVED
  reason         String?  @db.Text
  deliberationId String
  createdById    String
  createdAt      DateTime @default(now())
  
  claim          Claim    @relation("ClaimContraries", ...)
  contrary       Claim    @relation("ContraryOf", ...)
  deliberation   Deliberation @relation(...)
  createdBy      User @relation(...)
  
  @@unique([claimId, contraryId])
  @@index([claimId])
  @@index([contraryId])
  @@index([deliberationId])
}
```

**Status**: Complete, no schema changes needed ✅

### 2.2 API Endpoints ✅

**GET /api/contraries**:
- Fetches contraries for a claim or deliberation
- Query params: `deliberationId`, `claimId`
- Returns: Array of contrary relationships

**POST /api/contraries/create**:
- Creates new contrary relationship
- Body: `{ deliberationId, claimId, contraryId, isSymmetric, reason }`
- Validates: No self-contraries, no duplicates
- Returns: Created contrary object

**DELETE /api/contraries**:
- Removes contrary relationship
- Query params: `deliberationId`, `contraryId`
- Soft delete: Sets status to "REMOVED"

**Status**: Functional, no changes needed ✅

### 2.3 UI Components

#### ClaimContraryManager ✅

**Location**: `components/claims/ClaimContraryManager.tsx`

**Features**:
- Add/remove contrary relationships
- Symmetric/asymmetric toggle
- Reason field
- List of existing contraries with provenance
- Well-formedness warnings

**Integration**: Used in `ClaimDetailPanel.tsx`

**Issues**:
- Only accessible from claim detail panel (not prominent)
- No quick access from argument cards
- No visual indicators showing contraries exist

#### AspicTheoryViewer ✅

**Location**: `components/aspic/AspicTheoryViewer.tsx` (lines 451-544)

**Features**:
- Contraries section showing all relationships
- Distinguishes symmetric (↔) vs asymmetric (→)
- Collapsible view with copy functionality

**Issues**:
- No interactive actions (view-only)
- No filtering or search
- No visual graph representation

### 2.4 ASPIC+ Integration ✅

From `lib/aif/translation/aifToAspic.ts`:
```typescript
// Fetches ClaimContraries from database
const contraries = await prisma.claimContrary.findMany({
  where: { deliberationId, status: "ACTIVE" }
});

// Converts to ASPIC+ Map<string, Set<string>> format
const contrariesMap = new Map<string, Set<string>>();
for (const c of contraries) {
  if (!contrariesMap.has(c.claim.text)) {
    contrariesMap.set(c.claim.text, new Set());
  }
  contrariesMap.get(c.claim.text)!.add(c.contrary.text);
  
  // If symmetric, add reverse
  if (c.isSymmetric) {
    if (!contrariesMap.has(c.contrary.text)) {
      contrariesMap.set(c.contrary.text, new Set());
    }
    contrariesMap.get(c.contrary.text)!.add(c.claim.text);
  }
}

return {
  system: {
    contraries: contrariesMap,
    // ...
  }
};
```

**Status**: Working, contraries properly integrated into attack computation ✅

---

## 3. Enhancement Architecture

### 3.1 Visual Indicators on Argument Cards

**Goal**: Show which arguments have contrary conclusions

**Design**:
```tsx
// ArgumentCardV2.tsx enhancement
{hasContraryConclusion && (
  <Tooltip>
    <TooltipTrigger asChild>
      <Badge variant="outline" className="border-rose-500 text-rose-600 bg-rose-50">
        <AlertTriangle className="mr-1 h-3 w-3" />
        Has Contraries
      </Badge>
    </TooltipTrigger>
    <TooltipContent className="max-w-xs">
      <p className="text-xs">
        This argument's conclusion has {contraryCount} contrary claim(s).
        It may rebut or be rebutted by arguments with those conclusions.
      </p>
      <div className="mt-2 text-xs text-gray-400">
        {contraryClaimsList.join(", ")}
      </div>
    </TooltipContent>
  </Tooltip>
)}
```

**Implementation**:
1. Fetch claim contraries in ArgumentCardV2
2. Check if conclusion claim has contraries
3. Display badge with count
4. Tooltip lists contrary claims

### 3.2 Quick Contrary Button

**Goal**: Let users mark claims as contrary directly from argument view

**Design**:
```tsx
// In ArgumentCardV2.tsx actions menu
<DropdownMenuItem onClick={() => setContraryDialogOpen(true)}>
  <Split className="mr-2 h-4 w-4" />
  Mark Conclusion as Contrary...
</DropdownMenuItem>

// Simplified contrary dialog
<Dialog open={contraryDialogOpen} onOpenChange={setContraryDialogOpen}>
  <DialogContent >
    <DialogTitle>Mark Contrary Claim</DialogTitle>
    <DialogDescription>
      Select a claim that contradicts "{argumentConclusion.text}"
    </DialogDescription>
    
    <ClaimPicker
      deliberationId={deliberationId}
      onPick={(claim) => createContrary(argumentConclusion.id, claim.id)}
    />
    
    {/* Symmetric toggle + reason field */}
  </DialogContent>
</Dialog>
```

**Benefits**:
- Faster workflow (no navigation to claim detail)
- Contextual (users already viewing argument)
- Encourages contrary definitions

### 3.3 Contrary Suggestions Library

**Goal**: Suggest common contrary pairs to speed up definition

**Common Contraries**:
```typescript
const COMMON_CONTRARIES = [
  // Physical states
  { a: "wet", b: "dry", symmetric: true },
  { a: "hot", b: "cold", symmetric: true },
  { a: "alive", b: "dead", symmetric: true },
  { a: "present", b: "absent", symmetric: true },
  
  // Boolean
  { a: "true", b: "false", symmetric: true },
  { a: "yes", b: "no", symmetric: true },
  { a: "exists", b: "does not exist", symmetric: true },
  
  // Moral/Legal
  { a: "guilty", b: "innocent", symmetric: true },
  { a: "legal", b: "illegal", symmetric: true },
  { a: "right", b: "wrong", symmetric: false }, // asymmetric (not all not-right is wrong)
  
  // Temporal
  { a: "before", b: "after", symmetric: false },
  { a: "past", b: "future", symmetric: false },
  
  // Deontic
  { a: "obligatory", b: "forbidden", symmetric: true },
  { a: "permitted", b: "forbidden", symmetric: false },
  
  // Epistemic
  { a: "known", b: "unknown", symmetric: false },
  { a: "certain", b: "uncertain", symmetric: false },
];
```

**UI Integration**:
```tsx
// In ClaimContraryManager or quick contrary dialog
<div className="space-y-2">
  <label className="text-xs font-medium text-gray-700">
    Quick Suggestions:
  </label>
  <div className="flex flex-wrap gap-2">
    {suggestedContraries.map(contrary => (
      <Button
        key={contrary.id}
        variant="outline"
        size="sm"
        onClick={() => applySuggestion(contrary)}
        className="text-xs"
      >
        {contrary.text} ↔ {claimText}
      </Button>
    ))}
  </div>
</div>
```

**Suggestion Algorithm**:
1. Extract keywords from claim text
2. Match against COMMON_CONTRARIES library
3. Check if contrary claim already exists in deliberation
4. Rank by relevance (exact match > partial match > semantic similarity)
5. Display top 3-5 suggestions

### 3.4 Contrary Validation Warnings

**Goal**: Warn users when creating arguments with contradictory premises

**Validation Points**:

1. **Argument Creation** (in AIFArgumentWithSchemeComposer):
```tsx
// Check if selected premises contain contraries
const premiseConflicts = await checkPremiseContraries(selectedPremises);

{premiseConflicts.length > 0 && (
  <Alert className="border-amber-500 bg-amber-50">
    <AlertCircle className="h-4 w-4 text-amber-600" />
    <AlertDescription className="text-xs text-amber-800">
      <strong>Warning:</strong> You've selected premises that are marked as
      contrary to each other:
      <ul className="list-disc list-inside mt-2">
        {premiseConflicts.map(conflict => (
          <li key={conflict.id}>
            "{conflict.claim1}" ↔ "{conflict.claim2}"
          </li>
        ))}
      </ul>
      Arguments with contradictory premises are not well-formed in ASPIC+.
    </AlertDescription>
  </Alert>
)}
```

2. **Contrary Creation** (in ClaimContraryManager):
```tsx
// Warn about well-formedness violations
{selectedContrary && isAxiom(claimId) && (
  <Alert className="border-red-500 bg-red-50">
    <AlertCircle className="h-4 w-4 text-red-600" />
    <AlertDescription className="text-xs text-red-800">
      <strong>Error:</strong> Cannot create contraries to axioms
      (indisputable premises). This violates ASPIC+ well-formedness.
    </AlertDescription>
  </Alert>
)}
```

### 3.5 Visual Graph Indicators

**Goal**: Show contrary relationships in attack graph visualization

**Design Concept** (for future Phase 2):
```
┌──────────────┐         rebuttal attack        ┌──────────────┐
│  Argument A  │  ─────────────(φ)────────────> │  Argument B  │
│  Concl: φ    │                                 │  Concl: ¬φ   │
└──────────────┘                                 └──────────────┘
      │                                                  │
      │ based on contrary:                              │
      └────────────────────( φ ↔ ¬φ )──────────────────┘
                          (shown as red dashed line)
```

**Phase 1d Scope**: Just add data attributes for future graph rendering
```tsx
<div
  data-has-contraries="true"
  data-contrary-count={contraryCount}
  data-contrary-ids={JSON.stringify(contraryIds)}
  className="argument-card"
>
  {/* ... */}
</div>
```

---

## 4. Implementation Plan

### Phase 1d.1: Enhance Contrary Visibility (4-6 hours)

**Tasks**:
1. Add contrary badge to ArgumentCardV2
2. Fetch claim contraries in card component
3. Display count and tooltip with contrary list
4. Add contrary indicator to AspicTheoryViewer (highlight rules with contrary conclusions)
5. Add data attributes for future graph rendering

**Files to Modify**:
- `components/arguments/ArgumentCardV2.tsx`
- `components/aspic/AspicTheoryViewer.tsx`

**Acceptance Criteria**:
- [ ] Contrary badge appears on arguments with contrary conclusions
- [ ] Tooltip shows list of contrary claims
- [ ] Badge color distinguishes symmetric (red) vs asymmetric (orange)
- [ ] Data attributes present for graph integration

### Phase 1d.2: Quick Contrary Actions (4-6 hours)

**Tasks**:
1. Add "Mark as Contrary" option to argument action menu
2. Create simplified contrary dialog component
3. Integrate ClaimPicker for target selection
4. Add "Quick Contrary" button to ClaimDetailPanel header
5. Implement keyboard shortcuts (optional)

**Files to Create/Modify**:
- `components/arguments/QuickContraryDialog.tsx` (NEW)
- `components/arguments/ArgumentCardV2.tsx`
- `components/claims/ClaimDetailPanel.tsx`

**Acceptance Criteria**:
- [ ] "Mark as Contrary" appears in argument actions
- [ ] Dialog allows quick contrary creation
- [ ] Changes reflect immediately in UI
- [ ] "contraries:changed" event dispatched

### Phase 1d.3: Contrary Suggestions (4-6 hours)

**Tasks**:
1. Create `lib/aspic/contrarySuggestions.ts` with common contraries library
2. Implement suggestion algorithm (keyword matching + semantic similarity)
3. Add suggestion UI to ClaimContraryManager
4. Add suggestion UI to QuickContraryDialog
5. Allow users to accept/reject suggestions with one click

**Files to Create/Modify**:
- `lib/aspic/contrarySuggestions.ts` (NEW)
- `components/claims/ClaimContraryManager.tsx`
- `components/arguments/QuickContraryDialog.tsx`

**Acceptance Criteria**:
- [ ] Suggestions appear based on claim text
- [ ] Top 3-5 relevant suggestions displayed
- [ ] One-click acceptance creates contrary
- [ ] Library extensible (admin can add more)

### Phase 1d.4: Validation Warnings (3-4 hours)

**Tasks**:
1. Create `lib/aspic/contraryValidation.ts` with validation functions
2. Add premise contradiction check to argument composer
3. Add axiom contrary check to ClaimContraryManager
4. Display amber warnings (non-blocking) for contradictory premises
5. Display red errors (blocking) for axiom contraries

**Files to Create/Modify**:
- `lib/aspic/contraryValidation.ts` (NEW)
- `components/arguments/AIFArgumentWithSchemeComposer.tsx`
- `components/claims/ClaimContraryManager.tsx`

**Acceptance Criteria**:
- [ ] Warning appears when selecting contrary premises
- [ ] Warning lists specific contrary pairs
- [ ] Error blocks contrary creation for axioms
- [ ] Explanations reference ASPIC+ well-formedness

### Phase 1d.5: Testing & Documentation (2-3 hours)

**Tasks**:
1. Write unit tests for suggestion algorithm
2. Write integration tests for quick contrary workflow
3. Update user guide with contrary examples
4. Create demo workflow screenshots
5. Update completion status documents

**Files to Create/Modify**:
- `__tests__/aspic/contrarySuggestions.test.ts` (NEW)
- `__tests__/aspic/contraryValidation.test.ts` (NEW)
- `docs/user-guides/aspic-contraries-guide.md` (NEW)
- Update `ASPIC_PHASE1D_CONTRARIES_ENHANCEMENT_PLAN.md`

**Acceptance Criteria**:
- [ ] 15+ tests passing for suggestions
- [ ] 10+ tests passing for validation
- [ ] User guide explains symmetric vs asymmetric
- [ ] Demo shows full workflow

---

## 5. Testing Strategy

### 5.1 Unit Tests

**Contrary Suggestions** (`contrarySuggestions.test.ts`):
```typescript
describe("Contrary Suggestions", () => {
  it("suggests 'dry' for claim containing 'wet'", () => {
    const suggestions = getSuggestions("The ground is wet");
    expect(suggestions).toContainEqual(expect.objectContaining({
      text: "dry",
      symmetric: true
    }));
  });
  
  it("suggests 'dead' for claim containing 'alive'", () => {
    const suggestions = getSuggestions("The patient is alive");
    expect(suggestions).toContainEqual(expect.objectContaining({
      text: "dead",
      symmetric: true
    }));
  });
  
  it("ranks exact matches higher than partial matches", () => {
    const suggestions = getSuggestions("guilty");
    expect(suggestions[0].text).toBe("innocent");
  });
});
```

**Contrary Validation** (`contraryValidation.test.ts`):
```typescript
describe("Contrary Validation", () => {
  it("detects contradictory premises", () => {
    const premises = ["wet", "dry"];
    const contraries = new Map([["wet", new Set(["dry"])]]);
    const conflicts = checkPremiseContraries(premises, contraries);
    expect(conflicts).toHaveLength(1);
  });
  
  it("blocks contraries to axioms", () => {
    const axioms = new Set(["A"]);
    const isValid = canCreateContrary("A", "¬A", axioms);
    expect(isValid).toBe(false);
  });
});
```

### 5.2 Integration Tests

**Quick Contrary Workflow**:
```typescript
it("creates contrary from argument card action menu", async () => {
  // 1. Render argument card
  render(<ArgumentCardV2 argument={mockArgument} />);
  
  // 2. Open actions menu
  await userEvent.click(screen.getByRole("button", { name: /more/i }));
  
  // 3. Click "Mark as Contrary"
  await userEvent.click(screen.getByText(/mark.*contrary/i));
  
  // 4. Dialog appears
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  
  // 5. Select contrary claim
  await userEvent.click(screen.getByText("Select contrary claim"));
  await userEvent.click(screen.getByText(mockContraryClaim.text));
  
  // 6. Submit
  await userEvent.click(screen.getByRole("button", { name: /create/i }));
  
  // 7. Verify API called
  expect(mockFetch).toHaveBeenCalledWith("/api/contraries/create", {
    method: "POST",
    body: expect.stringContaining(mockContraryClaim.id)
  });
  
  // 8. Verify badge appears
  await waitFor(() => {
    expect(screen.getByText(/has contraries/i)).toBeInTheDocument();
  });
});
```

---

## 6. Rollout Timeline

### Total Estimate: 17-22 hours (2-3 days)

**Day 1** (8 hours):
- ⏳ Phase 1d.1: Enhance Contrary Visibility (4-6 hours)
- ⏳ Phase 1d.2: Quick Contrary Actions (4-6 hours partial)

**Day 2** (8 hours):
- ⏳ Phase 1d.2: Quick Contrary Actions (complete)
- ⏳ Phase 1d.3: Contrary Suggestions (4-6 hours)
- ⏳ Phase 1d.4: Validation Warnings (partial)

**Day 3** (6 hours if needed):
- ⏳ Phase 1d.4: Validation Warnings (complete)
- ⏳ Phase 1d.5: Testing & Documentation (2-3 hours)

---

## 7. Acceptance Criteria

### Phase 1d Complete Checklist

**Visibility Enhancements**:
- [ ] Contrary badge on ArgumentCardV2
- [ ] Tooltip shows contrary claim list
- [ ] Data attributes for graph integration
- [ ] Contrary indicators in AspicTheoryViewer

**Quick Actions**:
- [ ] "Mark as Contrary" in argument menu
- [ ] QuickContraryDialog component
- [ ] One-click contrary creation
- [ ] Real-time UI updates

**Suggestions**:
- [ ] COMMON_CONTRARIES library (20+ pairs)
- [ ] Suggestion algorithm implementation
- [ ] UI displays top 3-5 suggestions
- [ ] One-click acceptance

**Validation**:
- [ ] Premise contradiction warnings
- [ ] Axiom contrary error blocking
- [ ] Well-formedness explanations
- [ ] Non-blocking amber warnings

**Testing**:
- [ ] 15+ suggestion tests passing
- [ ] 10+ validation tests passing
- [ ] Integration tests for workflows
- [ ] User guide with examples

**Total**: 19 acceptance criteria

---

## 8. Future Enhancements (Phase 2+)

**Automatic Contrary Detection**:
- NLP-based contradiction detection
- Negation pattern matching
- Antonym detection via WordNet/WordNet++

**Ontology Integration**:
- Domain-specific contrary ontologies
- Legal contraries (statute vs case law)
- Medical contraries (symptom incompatibilities)

**Temporal Contraries**:
- Before/after relationships
- Causation-based contraries

**Graph Visualization**:
- Visual contrary indicators in attack graph
- Red dashed lines showing contrary relationships
- Interactive graph exploration

**Contrary Analytics**:
- Most common contraries in deliberation
- Contrary completeness score
- Suggest missing contraries

---

## 9. Known Limitations

**Current System**:
1. Manual contrary definition (no automation)
2. Text-based matching only (no semantic understanding)
3. No contrary inheritance (if A ↔ B and B ↔ C, doesn't infer A ↔ C)
4. No temporal or modal contraries

**Mitigation Strategies**:
1. Provide extensive suggestions library
2. Use keyword matching + fuzzy matching
3. Document inheritance patterns in user guide
4. Phase 2 adds advanced contrary types

---

## 10. Success Metrics

**Adoption Metrics**:
- % of deliberations with ≥1 contrary defined
- Average contraries per deliberation
- Contrary creation velocity (week 1 vs week 4)

**Usage Metrics**:
- % contraries created via quick action vs claim detail
- Suggestion acceptance rate
- Validation warning frequency

**Quality Metrics**:
- % symmetric vs asymmetric contraries
- Average reason length (indicates thoughtfulness)
- Contrary removal rate (indicates mistakes)

**Target After 1 Month**:
- 60% deliberations have contraries
- 3-5 contraries per deliberation
- 40% suggestion acceptance rate
- <10% contrary removal rate

---

**Document Version**: 1.0  
**Author**: Mesh Development Team  
**Status**: Ready for Implementation  
**Next Review**: After Phase 1d.1 completion
