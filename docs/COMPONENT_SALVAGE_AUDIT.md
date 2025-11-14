# Component Salvage Audit

**Date**: November 13, 2025  
**Status**: 🔍 SALVAGE ANALYSIS COMPLETE

---

## Components Analyzed

1. **ArgumentConstructionFlow.tsx** (465 lines)
2. **EvidenceMatchingVisualizer.tsx** (660 lines)
3. **BatchArgumentGenerator.tsx** (468 lines)
4. **EvidenceGuidance.tsx** (727 lines)
5. **EvidenceSchemeMapper.tsx** (652 lines)

---

## Summary

| Component | Verdict | Salvageable Code | Action |
|-----------|---------|------------------|--------|
| ArgumentConstructionFlow | ❌ DELETE | Template library concept | Deprecate |
| EvidenceMatchingVisualizer | ⚠️ ARCHIVE | Evidence coverage metrics | Archive for later |
| BatchArgumentGenerator | ⚠️ ARCHIVE | Batch generation UI patterns | Archive for later |
| EvidenceGuidance | ✅ SALVAGE | Evidence requirements, validation, quality indicators | Merge into AIFArgumentWithSchemeComposer |
| EvidenceSchemeMapper | ⚠️ ARCHIVE | Scheme recommendation engine | Archive for later |

---

## 1. ArgumentConstructionFlow.tsx

### What It Does
- Wizard wrapper around ArgumentConstructor
- "Choose method" step: template vs from scratch
- Template library integration
- Evidence matching flow step

### Verdict: ❌ DELETE

**Reasons**:
- Just another layer of wizard abstraction (wizard wrapping wizard)
- Adds method selection step that's unnecessary
- Template library concept is half-baked
- Evidence matching as separate step is overkill
- 465 lines of pure overhead

**Salvageable**:
- Template library concept (if we want saved argument templates later)
- Flow progress UI pattern (pretty progress bar)

**Action**: Delete entire file. If template library becomes useful later, implement as standalone feature.

---

## 2. EvidenceMatchingVisualizer.tsx

### What It Does
- Visual mapping between premises and evidence
- Coverage metrics (% of premises with evidence)
- Smart evidence suggestions via AI
- Evidence quality scoring per premise
- Drag-and-drop evidence assignment

### Verdict: ⚠️ ARCHIVE (for Phase 3+ when evidence system is production-ready)

**Reasons**:
- **Sophisticated UI** for evidence-to-premise mapping
- **Coverage metrics** are genuinely useful:
  - Shows which premises have evidence
  - Required vs optional premise tracking
  - Average match quality
- **Smart suggestions** via `/api/evidence/analyze-matches`:
  - AI-powered evidence-to-premise matching
  - Match scoring with reasoning
  - Placement suggestions (primary, supporting, alternative)
- **But**: Evidence system doesn't exist yet in production
- **But**: No API endpoint for `/api/evidence/analyze-matches`
- **But**: Adds complexity before we need it

**Salvageable**:
- ✅ Coverage metrics calculation (required/optional premise tracking)
- ✅ Evidence quality indicator patterns
- ✅ Premise card layout with status badges
- ✅ Smart suggestion UI components

**Action**: 
- **Archive** to `components/argumentation/_archived/EvidenceMatchingVisualizer.tsx`
- **Revisit** in Phase 3 when evidence system is production-ready
- **Reference** for evidence UI patterns when implementing evidence features

**Usage Example (Future)**:
```tsx
// When we have evidence system ready
<EvidenceMatchingVisualizer
  premises={argument.premises}
  availableEvidence={deliberationEvidence}
  currentMatches={evidenceLinks}
  onEvidenceAssign={(premiseKey, evidenceId) => linkEvidence(premiseKey, evidenceId)}
/>
```

---

## 3. BatchArgumentGenerator.tsx

### What It Does
- Generate multiple support arguments at once
- Configure diversity mode (maximize, balanced, focused)
- Evidence allocation strategy (distribute, duplicate, prioritize)
- Bulk approve/reject generated arguments
- Review mode with expand/collapse cards

### Verdict: ⚠️ ARCHIVE (interesting future feature)

**Reasons**:
- **Cool concept** but not MVP
- **Batch generation** via `/api/arguments/batch-generate` doesn't exist
- **Use case**: When you have lots of evidence and want to explore multiple argument strategies
- **But**: Users should start with single arguments, not batches
- **But**: Adds significant complexity
- **Complexity**: 468 lines for a feature that's not validated

**Salvageable**:
- ✅ Batch operation UI patterns (select all, bulk actions)
- ✅ Configuration panel with sliders/dropdowns
- ✅ Evidence statistics display (quality breakdown)
- ✅ Generated item cards with expand/collapse

**Action**:
- **Archive** to `components/argumentation/_archived/BatchArgumentGenerator.tsx`
- **Revisit** after users request "generate multiple arguments" feature
- **Reference** for bulk operation UI patterns

**Usage Example (Future)**:
```tsx
// When users want to explore multiple argument strategies
<BatchArgumentGenerator
  targetArgumentId={argumentId}
  availableEvidence={evidence}
  onGenerateComplete={(args) => displayGeneratedArguments(args)}
/>
```

---

## 4. EvidenceGuidance.tsx ✅

### What It Does
- Display evidence requirements from schemes
- Validate evidence against requirements
- Show evidence quality indicators
- Provide AI-powered evidence suggestions
- Evidence strength meter with category breakdown

### Verdict: ✅ SALVAGE (highly useful components)

**Reasons**:
- **Actually useful** for helping users understand what evidence they need
- **Clean component design** with reusable pieces
- **Validation logic** matches scheme requirements system
- **Quality indicators** help users assess evidence strength
- **No API dependencies** - pure UI components

**Salvageable Components**:

1. **EvidenceRequirements** (lines 140-170)
   - Shows what evidence types a scheme needs
   - Required/optional badges
   - Examples and tips for each type
   - ✅ **Use in AIFArgumentWithSchemeComposer** - show when scheme selected

2. **EvidenceValidator** (lines 182-330)
   - Validates evidence against requirements
   - Shows satisfied/missing/weak categories
   - Progress bar and coverage metrics
   - ✅ **Use in ArgumentDetailPanel** - validate arguments post-creation

3. **EvidenceQualityIndicator** (lines 340-430)
   - Quality badge (strong/moderate/weak/none)
   - Strength meter (0-100%)
   - Evidence type icon
   - Source display
   - Issues list
   - ✅ **Use in CitationCollector** - show quality of attached citations

4. **EvidenceSuggestions** (lines 440-530)
   - AI-powered suggestions for finding evidence
   - Search terms to try
   - Recommended sources
   - ✅ **Use in AIFArgumentWithSchemeComposer** - suggest evidence when premise weak

5. **EvidenceStrengthMeter** (lines 540-650)
   - Overall strength gauge
   - Category breakdown
   - Visual meter with color coding
   - ✅ **Use in ArgumentDetailPanel** - show argument strength

**Integration Plan**:

### A. Add to AIFArgumentWithSchemeComposer

```tsx
import { EvidenceRequirements } from "@/components/argumentation/EvidenceGuidance";

// Show evidence requirements after scheme selection
{selected && selected.evidenceRequirements && (
  <div className="mt-4">
    <EvidenceRequirements requirements={selected.evidenceRequirements} />
  </div>
)}
```

### B. Add to ArgumentDetailPanel

```tsx
import { EvidenceValidator, EvidenceStrengthMeter } from "@/components/argumentation/EvidenceGuidance";

// Show evidence validation for completed arguments
<EvidenceValidator
  evidence={argument.citations.map(citationToEvidence)}
  requirements={argument.scheme.evidenceRequirements}
/>

<EvidenceStrengthMeter
  overallStrength={argument.evidenceStrength}
  breakdown={argument.evidenceBreakdown}
/>
```

### C. Add to CitationCollector

```tsx
import { EvidenceQualityIndicator } from "@/components/argumentation/EvidenceGuidance";

// Show quality for each citation
{citations.map(citation => (
  <div>
    <CitationCard citation={citation} />
    <EvidenceQualityIndicator
      evidence={citationToEvidence(citation)}
      showDetails={false}
    />
  </div>
))}
```

**Action**:
1. **Keep file** - it's genuinely useful
2. **Import components** into AIFArgumentWithSchemeComposer, ArgumentDetailPanel, CitationCollector
3. **Add types** to database schema if needed (evidenceRequirements on ArgumentScheme)
4. **Test** with real schemes and citations

---

## 5. EvidenceSchemeMapper.tsx

### What It Does
- Analyze available evidence and recommend matching schemes
- Score schemes by evidence utilization
- Show premise mapping (which evidence fills which premise)
- Predict argument strength based on evidence quality
- Filter by category, match score
- Sort by match/strength/utilization

### Verdict: ⚠️ ARCHIVE (cool but premature)

**Reasons**:
- **Sophisticated matching engine** that analyzes evidence and suggests schemes
- **Smart feature** but adds complexity before basic flow works
- **Requires API**: `/api/evidence/match-schemes` doesn't exist
- **Use case**: "I have evidence, which schemes fit best?"
- **But**: Users should start with scheme selection, not evidence-first
- **But**: Inverted flow from our current approach
- **Complexity**: 652 lines for untested feature

**Salvageable**:
- ✅ Evidence statistics display (quality breakdown)
- ✅ Match score filtering UI
- ✅ Category filter buttons
- ✅ Sort dropdown patterns
- ✅ Expandable card design

**Action**:
- **Archive** to `components/argumentation/_archived/EvidenceSchemeMapper.tsx`
- **Revisit** in Phase 4 when we want "evidence-first" workflow
- **Reference** for filtering/sorting UI patterns

**Usage Example (Future)**:
```tsx
// Alternative workflow: start with evidence, find schemes
<EvidenceSchemeMapper
  availableEvidence={userEvidence}
  onSelectScheme={(match) => createArgumentWithScheme(match)}
/>
```

---

## Salvage Action Plan

### Immediate (Today)

1. **Delete ArgumentConstructionFlow.tsx**
   ```bash
   rm components/argumentation/ArgumentConstructionFlow.tsx
   ```

2. **Archive for later**
   ```bash
   mkdir -p components/argumentation/_archived
   mv components/argumentation/EvidenceMatchingVisualizer.tsx components/argumentation/_archived/
   mv components/argumentation/BatchArgumentGenerator.tsx components/argumentation/_archived/
   mv components/argumentation/EvidenceSchemeMapper.tsx components/argumentation/_archived/
   ```

3. **Keep EvidenceGuidance.tsx**
   - No changes needed
   - Ready to import into other components

4. **Replace ArgumentConstructor in ArgumentsTab**
   ```tsx
   // OLD
   import { ArgumentConstructor } from "@/components/argumentation/ArgumentConstructor";
   <ArgumentConstructor mode="general" ... />
   
   // NEW
   import { AIFArgumentWithSchemeComposer } from "@/components/arguments/AIFArgumentWithSchemeComposer";
   <AIFArgumentWithSchemeComposer deliberationId={deliberationId} ... />
   ```

### Short-term (Next Week)

5. **Integrate EvidenceRequirements into AIFArgumentWithSchemeComposer**
   - Show evidence requirements panel when scheme selected
   - Help users understand what evidence they need

6. **Add EvidenceQualityIndicator to CitationCollector**
   - Show quality score for each citation
   - Help users assess citation strength

7. **Test evidence guidance components**
   - Create sample evidence requirements in schemes
   - Verify UI displays correctly
   - Get user feedback

### Medium-term (Phase 3+)

8. **Revisit archived components**
   - When evidence system is production-ready → EvidenceMatchingVisualizer
   - When batch generation requested → BatchArgumentGenerator
   - When evidence-first flow validated → EvidenceSchemeMapper

---

## Code Removal Summary

### Delete (Today)
- ❌ `components/argumentation/ArgumentConstructionFlow.tsx` (465 lines)
- Total removed: **465 lines**

### Archive (Today)
- 📦 `components/argumentation/EvidenceMatchingVisualizer.tsx` (660 lines)
- 📦 `components/argumentation/BatchArgumentGenerator.tsx` (468 lines)
- 📦 `components/argumentation/EvidenceSchemeMapper.tsx` (652 lines)
- Total archived: **1,780 lines**

### Keep & Integrate (Today/Next Week)
- ✅ `components/argumentation/EvidenceGuidance.tsx` (727 lines)
- ✅ `components/arguments/AIFArgumentWithSchemeComposer.tsx` (1,135 lines)
- Total active: **1,862 lines**

### Net Result
- **Before**: 5,207 lines (5 components + ArgumentConstructor 2,062)
- **After**: 1,862 lines (2 active components)
- **Reduction**: -3,345 lines (-64%)
- **Archived**: 1,780 lines (available for future use)

---

## Integration Checklist

### Today
- [ ] Delete ArgumentConstructionFlow.tsx
- [ ] Archive 3 components to `_archived/`
- [ ] Replace ArgumentConstructor with AIFArgumentWithSchemeComposer in ArgumentsTab
- [ ] Test create argument flow

### Next Week
- [ ] Import EvidenceRequirements into AIFArgumentWithSchemeComposer
- [ ] Show evidence requirements when scheme selected
- [ ] Add EvidenceQualityIndicator to CitationCollector
- [ ] Add EvidenceValidator to ArgumentDetailPanel
- [ ] Test evidence guidance UI

### Future
- [ ] Revisit EvidenceMatchingVisualizer when evidence system ready
- [ ] Revisit BatchArgumentGenerator when batch generation validated
- [ ] Revisit EvidenceSchemeMapper when evidence-first workflow validated

---

## Recommendation

**Proceed with component consolidation:**

1. ✅ **Delete** ArgumentConstructionFlow (pure overhead)
2. ✅ **Archive** 3 components (useful later, not now)
3. ✅ **Keep** EvidenceGuidance (integrate gradually)
4. ✅ **Replace** ArgumentConstructor with AIFArgumentWithSchemeComposer
5. ✅ **Simplify** codebase by 64% while preserving useful work

This gives us a **simpler, maintainable system** while keeping sophisticated features available for when we need them.
