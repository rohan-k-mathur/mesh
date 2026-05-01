# AIFAuthoringPanel - Status & Replacement Plan

**Date**: November 11, 2025  
**Question**: Where did AIFAuthoringPanel go? Will it be replaced by deliberationsystemoverhaul components?  
**Answer**: ✅ YES - It will be replaced, and the replacement is already built!

---

## Quick Answer

**AIFAuthoringPanel** was **not intentionally removed** - it was left out during the V2 migration (likely an oversight during structural improvements). The component exists and is fully functional, but it's not integrated into DeepDivePanelV2.

**Good news**: The **Deliberation System Overhaul** (Phases 0-4) has created **much more sophisticated** argument authoring tools that will replace and enhance what AIFAuthoringPanel provided:

- **AIFAuthoringPanel** → Simple wrapper around AIFArgumentWithSchemeComposer
- **Overhaul Components** → Full attack/support wizards with AI assistance, evidence guidance, and strategic suggestions

---

## What AIFAuthoringPanel Does

**Location**: `components/deepdive/AIFAuthoringPanel.tsx` (145 LOC)

**Purpose**: Simple wrapper that provides:
1. Conclusion picker
2. AIFArgumentWithSchemeComposer integration
3. Basic attack context support
4. User session loading

**Current Usage**:
- ❌ NOT in DeepDivePanelV2 (orphaned import exists)
- ✅ Used in old DeepDivePanel.tsx (line 984) for "Scheme Composer" section
- ⚠️ Imported but never rendered in V2

**What it wraps**:
```tsx
<AIFArgumentWithSchemeComposer
  deliberationId={deliberationId}
  authorId={effectiveAuthorId}
  conclusionClaim={conclusion}
  onChangeConclusion={(c) => setConclusion(c)}
  attackContext={attackContext}
  onCreated={() => {/* refresh */}}
  onCreatedDetail={(payload) => setCreatedArg(payload)}
/>
```

---

## What's Replacing It (Already Built!)

The **Deliberation System Overhaul** has created a **complete replacement** that's far more sophisticated:

### Phase 3: Argument Generation ✅ COMPLETE

**Components That Replace AIFAuthoringPanel**:

1. **AttackSuggestions** (`components/argumentation/AttackSuggestions.tsx`)
   - Analyzes target argument
   - Suggests CQ-based attack strategies
   - Ranks by strategic value and burden
   - Shows difficulty and impact scores
   - **Better than**: Just picking a scheme manually

2. **AttackConstructionWizard** (`components/argumentation/AttackConstructionWizard.tsx`)
   - Step-by-step guided attack creation
   - Evidence guidance based on burden of proof
   - Template-based composition
   - Preview before submission
   - **Better than**: Free-form composition

3. **SupportConstructionWizard** (`components/argumentation/SupportConstructionWizard.tsx`)
   - Symmetric to attack wizard
   - Suggests supporting schemes
   - Evidence matching for premises
   - **Better than**: No support suggestions in old panel

4. **EvidenceGuidance** (`components/argumentation/EvidenceGuidance.tsx`)
   - Shows what evidence is needed
   - Links to evidence collection
   - Burden-aware guidance
   - **New feature**: Didn't exist in AIFAuthoringPanel

5. **SchemeNavigator** (`components/schemes/SchemeNavigator.tsx`)
   - 4 navigation modes (wizard, clusters, conditions, search)
   - Educational scheme discovery
   - Recent and favorites
   - **Better than**: Simple dropdown in AIFAuthoringPanel

### Enhanced Features (Not in AIFAuthoringPanel)

**What's New**:
- ✅ AI-powered attack strategy suggestions
- ✅ CQ-based strategic guidance
- ✅ Burden of proof indicators
- ✅ Evidence requirement tracking
- ✅ Multi-scheme net support
- ✅ Template library
- ✅ Strength estimation
- ✅ Difficulty scoring
- ✅ Example attacks
- ✅ Common responses
- ✅ Educational mode

**What's Same**:
- ✅ Argument composition (but better)
- ✅ Scheme selection (but smarter)
- ✅ Conclusion/premise editing (but guided)
- ✅ Attack context support (but enhanced)

---

## Comparison Table

| Feature | AIFAuthoringPanel | Overhaul Replacement |
|---------|------------------|---------------------|
| **Scheme Selection** | Dropdown or hierarchy picker | SchemeNavigator (4 modes) |
| **Attack Guidance** | None | AI-powered CQ suggestions |
| **Evidence Help** | None | EvidenceGuidance component |
| **Strategic Ranking** | None | Strength/difficulty scores |
| **Burden Awareness** | None | Full burden indicators |
| **Support Creation** | Manual only | SupportSuggestions wizard |
| **Multi-Scheme** | No | Full net analysis |
| **Examples** | None | Example attacks shown |
| **Educational** | No | Learning mode available |
| **Template Library** | No | Full template system |
| **Preview** | Basic | AttackPreviewSubmission |
| **Wizard Flow** | No | Step-by-step guidance |

**Winner**: Overhaul replacement is **dramatically better** in every way.

---

## Integration Timeline

### Short-term (Week 4 - NOW)
**Status**: AIFAuthoringPanel could be added back to Arguments tab as a quick fix (15-20 mins)

**Pros**:
- Restores missing functionality immediately
- Users can compose arguments again
- Low risk, quick fix

**Cons**:
- Will be replaced soon anyway
- Misses opportunity for better UX
- Duplicates work

**Recommendation**: ❌ Don't bother - overhaul integration starts next week

### Week 6 (December 9-15, 2025) ⭐ RECOMMENDED
**Status**: Attack Generation Integration

**What Happens**:
1. **AttackSuggestions** added to Arguments tab
   - "Generate Attack" button on argument cards
   - Opens suggestions panel with ranked strategies
   - One-click to construction wizard

2. **AttackConstructionWizard** integrated
   - Step-by-step guided attack creation
   - Evidence guidance included
   - Preview and submit

3. **ArgumentActionsSheet** enhanced
   - Top 3 attack suggestions shown inline
   - Quick access to full wizard

**Result**: 
- ✅ AIFAuthoringPanel functionality restored
- ✅ PLUS AI-assisted strategic guidance
- ✅ PLUS evidence awareness
- ✅ PLUS burden of proof tracking
- ✅ Much better user experience

**Effort**: 10 hours (already planned in V3 migration)

### Week 7 (December 16-22, 2025)
**Status**: Scheme Navigation & Support

**Additional Enhancements**:
- SchemeNavigator replaces simple picker
- SupportConstructionWizard for supporting arguments
- Complete argumentation toolkit

---

## Answer to Original Question

### "Was removal intentional?"
**No** - it was an oversight during V2 migration. The component exists and works, just not wired into V2.

### "Will it be replaced by deliberationsystemoverhaul components?"
**YES!** - And the replacement is **already built and tested**. It just needs to be integrated (Week 6 of V3 migration).

### "Should we restore it now?"
**No** - Wait for Week 6 (3 weeks away). The overhaul replacement is so much better that it's worth the wait. Users can still create arguments through other means temporarily.

### "What's the overhaul status?"
**Phases 0-4 are COMPLETE** ✅
- All components built
- All APIs functional
- All services tested
- Ready for integration

The "deliberationsystemoverhaul" exists as **`docs/DELIBERATION_SYSTEM_OVERHAUL/`** with comprehensive documentation of Phases 0-4.

---

## Recommendation

**Do NOT restore AIFAuthoringPanel** to V2. Instead:

1. **Week 5** (next week): Integrate ArgumentNetAnalyzer and burden badges
2. **Week 6**: Integrate full attack generation system (replaces + enhances AIFAuthoringPanel)
3. **Week 7**: Add scheme navigation and support generation
4. **Week 8**: Polish and add analytics

**By Week 6**, users will have:
- ✅ Everything AIFAuthoringPanel provided
- ✅ PLUS AI-assisted attack strategies
- ✅ PLUS evidence guidance
- ✅ PLUS burden tracking
- ✅ PLUS multi-scheme awareness
- ✅ Much better UX overall

**Timeline**: 3 weeks from now (Week 6 starts December 9)

---

## Files to Reference

**Current Code**:
- `components/deepdive/AIFAuthoringPanel.tsx` - What we had
- `components/arguments/AIFArgumentWithSchemeComposer.tsx` - Core composer (stays)

**Overhaul Components** (Replacements):
- `components/argumentation/AttackSuggestions.tsx`
- `components/argumentation/AttackConstructionWizard.tsx`
- `components/argumentation/SupportConstructionWizard.tsx`
- `components/argumentation/EvidenceGuidance.tsx`
- `components/schemes/SchemeNavigator.tsx`

**Integration Plans**:
- `DEEPDIVEPANEL_V3_OVERHAUL_INTEGRATION_PLAN.md` - Week-by-week tasks
- `DEEPDIVEPANEL_OVERHAUL_INTEGRATION_AUDIT.md` - Full component inventory
- `OVERHAUL_INTEGRATION_SUMMARY.md` - Executive summary

**Overhaul Documentation**:
- `docs/DELIBERATION_SYSTEM_OVERHAUL/DELIBERATION_SYSTEM_OVERHAUL_STRATEGY.md`
- `docs/DELIBERATION_SYSTEM_OVERHAUL/PHASE 3/` - Attack generation details

---

## Conclusion

**AIFAuthoringPanel is being replaced** by a **dramatically better** system that's **already built**. The Deliberation System Overhaul created sophisticated, AI-assisted argumentation tools that will be integrated into DeepDivePanelV3 starting Week 6.

**Don't restore the old component** - wait 3 weeks for the much better replacement. The timing is perfect with the V3 migration.

**Status**: ✅ Question answered, path forward clear

---

**TL;DR**: 
- AIFAuthoringPanel → Accidentally not in V2
- Replacement → Already built (Overhaul Phase 3)
- Integration → Week 6 (Dec 9-15)
- Better? → YES, dramatically
- Worth waiting? → Absolutely
