# Archived Argumentation Components

**Date Archived**: November 13, 2025  
**Reason**: Simplification of argument construction system

---

## Archived Components

### 1. ArgumentConstructionFlow.tsx (465 lines)
**Why Archived**: Wizard wrapper around ArgumentConstructor added unnecessary complexity. Template library concept was half-baked.

**What It Did**:
- Wrapped ArgumentConstructor in another wizard flow
- Method selection step (template vs from scratch)
- Template library integration
- Evidence matching flow step

**When to Revisit**: If template library feature is validated and requested by users

**Salvageable**:
- Flow progress UI patterns
- Template library concept (if needed later)

---

### 2. EvidenceMatchingVisualizer.tsx (660 lines)
**Why Archived**: Evidence system doesn't exist in production yet. Premature optimization.

**What It Did**:
- Visual mapping between premises and evidence
- Coverage metrics (% of premises with evidence)
- Smart evidence suggestions via AI
- Evidence quality scoring per premise
- Required vs optional premise tracking

**When to Revisit**: Phase 3 when evidence system is production-ready

**Salvageable**:
- Coverage metrics calculation
- Evidence quality indicator patterns
- Premise card layout with status badges
- Smart suggestion UI components

**API Dependencies**:
- `POST /api/evidence/analyze-matches` - doesn't exist yet

---

### 3. BatchArgumentGenerator.tsx (468 lines)
**Why Archived**: Batch generation not validated. Users should start with single arguments.

**What It Did**:
- Generate multiple support arguments at once
- Configure diversity mode (maximize, balanced, focused)
- Evidence allocation strategy (distribute, duplicate, prioritize)
- Bulk approve/reject generated arguments
- Review mode with expand/collapse cards

**When to Revisit**: When users request "generate multiple arguments" feature

**Salvageable**:
- Batch operation UI patterns (select all, bulk actions)
- Configuration panel with sliders/dropdowns
- Evidence statistics display (quality breakdown)
- Generated item cards with expand/collapse

**API Dependencies**:
- `POST /api/arguments/batch-generate` - doesn't exist yet

---

### 4. EvidenceSchemeMapper.tsx (652 lines)
**Why Archived**: Evidence-first workflow not validated. Inverted flow from current approach.

**What It Did**:
- Analyze available evidence and recommend matching schemes
- Score schemes by evidence utilization
- Show premise mapping (which evidence fills which premise)
- Predict argument strength based on evidence quality
- Filter by category, match score
- Sort by match/strength/utilization

**When to Revisit**: Phase 4 when "evidence-first" workflow is validated

**Salvageable**:
- Evidence statistics display (quality breakdown)
- Match score filtering UI
- Category filter buttons
- Sort dropdown patterns
- Expandable card design

**API Dependencies**:
- `POST /api/evidence/match-schemes` - doesn't exist yet

---

## Active Components (Not Archived)

### EvidenceGuidance.tsx (727 lines) - ✅ KEPT
**Why Kept**: Provides genuinely useful, standalone components for evidence requirements and validation.

**Components to Integrate**:
1. `EvidenceRequirements` - Show what evidence types a scheme needs
2. `EvidenceValidator` - Validate evidence against requirements
3. `EvidenceQualityIndicator` - Show evidence quality scores
4. `EvidenceSuggestions` - AI-powered suggestions for finding evidence
5. `EvidenceStrengthMeter` - Overall evidence strength gauge

**Integration Plan**:
- Add to AIFArgumentWithSchemeComposer (show requirements when scheme selected)
- Add to ArgumentDetailPanel (validate arguments post-creation)
- Add to CitationCollector (show quality of attached citations)

---

## Statistics

- **Total Lines Archived**: 2,245 lines
- **Components Archived**: 4
- **Net Reduction**: 64% of argument construction codebase
- **Remaining Active**: AIFArgumentWithSchemeComposer (1,135 lines) + EvidenceGuidance (727 lines) = 1,862 lines

---

## Restoration Instructions

If you need to restore any of these components:

```bash
# Restore specific component
mv components/argumentation/_archived/[ComponentName].tsx components/argumentation/

# Restore all
mv components/argumentation/_archived/*.tsx components/argumentation/
```

---

## Related Documentation

- See `docs/COMPONENT_SALVAGE_AUDIT.md` for detailed analysis
- See `docs/ARGUMENT_CONSTRUCTION_SYSTEM_AUDIT.md` for architecture review
