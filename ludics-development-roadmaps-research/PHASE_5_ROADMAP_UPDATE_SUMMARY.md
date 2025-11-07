# Phase 5 Roadmap Update Summary

**Date**: November 6, 2025  
**Updated By**: AI Assistant (GitHub Copilot)  
**Reason**: Integration of Phase 1e completion (ASPIC+ Ludics integration) and Phase 4 completion (scoped designs, delocation)

---

## Changes Made

### 1. **Integrated Theoretical Foundations (NEW Section)**

Added comprehensive theoretical grounding section that documents:

- **Ludics Theory** (Girard)
  - Actions, Chronicles, Designs, Interaction
  - Commitment State as repository of Content Expressions
  - Convergence/Divergence semantics
  - Fax/Delocation for cross-scope references

- **ASPIC+ Framework** (Modgil & Prakken)
  - Attack types (undermining/undercutting/rebutting)
  - Defeat computation with preferences
  - Argumentation Theory structure

- **Integration Mappings**
  - Ludics Interaction = ASPIC+ Defeat Computation
  - Commitment State = ASPIC+ Argumentation Theory
  - Chronicle = Attack/defense sequence

**Impact**: Phase 5 features now explicitly grounded in formal theory, ensuring rigorous implementation

---

### 2. **Updated Dependencies Section**

**Before**: Listed Phase 4 as dependency without details  
**After**: Comprehensive list of completed phases:

- ✅ Phase 0: ASPIC+ Core (5,534 lines, 63 tests)
- ✅ Phase 1a-e: ASPIC+ API integration (6,727 total lines)
- ✅ Phase 1e: Ludics metadata preservation (just completed)
- ✅ Phase 4: Scoped designs, delocation, forest view (15+ files)

**Impact**: Clear understanding of available infrastructure for Phase 5 features

---

### 3. **Enhanced Phase 5A.1: Interactive Challenge Creation**

**Added ASPIC+ Integration**:
- Display attack type badges on action buttons (Undermining/Undercutting/Rebutting)
- Preview ASPIC+ metadata that will be generated
- Link to Phase 1c CQ-to-attack mapping
- Show resulting AIF CA-node structure in preview
- Toast notifications include ASPIC+ attack type

**New Testing Requirements**:
- Verify LudicAct.extJson.aspic preserved (Phase 1e)
- Check AIF CA-node generation (Phase 1e)
- Validate 100% ASPIC+ metadata preservation

**Theoretical Alignment**:
- WHY move = negative action in Ludics
- CQ selection triggers ASPIC+ attack computation (Phase 1c)
- Metadata flows through full provenance chain

---

### 4. **Enhanced Phase 5A.2: Cross-Scope Navigation**

**Updated for Phase 4 Delocation Infrastructure**:
- Use `LudicDesign.referencedScopes` field (Phase 4)
- Check `LudicAct.metaJson.faxed` for delocated acts
- Read fax provenance: `faxedFrom.designId`, `scope`, `originalLocus`
- Distinguish edge types in scope map:
  - Solid line: Fax/delocation (formal)
  - Dashed line: Citation (informal)
  - Red arrow: ASPIC+ attack across scopes

**New Features**:
- Node convergence badges (†=converged, ⚡=diverged, •=ongoing)
- ASPIC+ attack indicators on cross-scope references
- Show attack type when reference involves formal conflict

---

### 5. **Enhanced Phase 5A.3: Commitment Store as ASPIC+ Theory**

**Major Conceptual Update**:

**Before**: Simple commitment tracking  
**After**: Full ASPIC+ Argumentation Theory per participant

**New Structure**:
```typescript
Commitment {
  // Original fields
  type: 'EXPLICIT_ASSERT' | 'EXPLICIT_CONCEDE' | ...
  
  // NEW: ASPIC+ formal representation
  aspicArgument?: {
    premises: string[];
    conclusion: string;
    defeasible: boolean;
  };
  aspicKBFact?: string;
}
```

**Commitment Store becomes Argumentation Theory**:
```typescript
theory = {
  kb: [...conceded facts, ...accepted facts],
  arguments: [...asserted arguments],
  rules: [...defeasible rules],
  preferences: [...]
}
```

**Conflict Detection Enhanced**:
- Use ASPIC+ core library (Phase 0) for evaluation
- Compute attacks between commitments with formal attack types
- Evaluate defeat status with preferences
- Provide formal explanations using ASPIC+ semantics

**New UI Features**:
- "View as Theory" button shows formal ASPIC+ notation
- "Evaluate Consistency" runs ASPIC+ evaluation
- Attack explanations use attack type taxonomy
- Export formal theory for external verification

**Theoretical Grounding**:
- Ludics Commitment State = ASPIC+ Argumentation Theory
- Convergence = Consistent theory (no contradictions)
- Divergence = Inconsistent theory (logical conflict)

---

### 6. **Enhanced Phase 5B.1: Scheme-Aware CQs**

**ASPIC+ Attack Type Integration**:
- Each CQ suggestion shows ASPIC+ attack type
- Attack target scope displayed (premise/inference/conclusion)
- Expected defeat status previewed (based on preferences)
- Provenance link: CQ → ASPIC+ → Ludics → AIF

**New Testing**:
- Verify ASPIC+ metadata auto-computed (Phase 1c)
- Check LudicAct.extJson.aspic preservation (Phase 1e)
- Validate AIF CA-node generation (Phase 1e)

---

### 7. **Updated File Locations (Appendix A)**

**Added Phase 1e/Phase 4 Files**:
- `compileFromMoves.ts` - Already enhanced with ASPIC+ extraction
- `syncToAif.ts` - Already enhanced with CA-node generation
- `delocate.ts` - Phase 4 fax implementation
- `conflictHelpers.ts` - Phase 1d ASPIC+ helpers
- `lib/aspic/core.ts` - Phase 0 core library

**Added Schema Fields**:
- `DialogueMove.payload.aspicAttack` (Phase 1c)
- `ConflictApplication.aspic*` fields (Phase 1d)
- `LudicAct.extJson.aspic` (Phase 1e)
- `LudicDesign.referencedScopes` (Phase 4)
- `AifNode` CA-nodes (Phase 1e)

---

### 8. **Expanded Glossary (Appendix B)**

**Added Terms**:
- ASPIC+ Attack Types definition
- Defeat vs Attack distinction
- Convergence/Divergence (Ludics semantics)
- Chronicle, Design, Locus (Ludics structures)
- CA-node (AIF representation)
- Provenance Chain (full formal trace)

---

### 9. **Updated Post-Phase 5 Vision**

**Enhanced Future Phases**:
- Phase 6: AI with ASPIC+ structure generation
- Phase 7: Social features with attack/defeat events
- Phase 8: Export with formal proofs, import with ASPIC+ analysis
- Phase 9: Automated reasoning, proof search in Commitment States

---

## Impact Assessment

### Readiness for Phase 5 Implementation

**Before Update**: Phase 5 roadmap assumed basic semantic integration without formal foundations

**After Update**: Phase 5 has:
1. ✅ Complete theoretical grounding (Ludics + ASPIC+)
2. ✅ All required infrastructure in place (Phases 0-1e, Phase 4)
3. ✅ Clear implementation path for each feature
4. ✅ Formal verification capability built-in
5. ✅ Provenance chain complete (CQ → DM → Ludics → AIF)

### Key Improvements

1. **Rigor**: Every feature now has formal semantics backing
2. **Traceability**: Full provenance from user action to formal representation
3. **Verifiability**: Commitment States can be exported as ASPIC+ theories for external validation
4. **Scalability**: Phase 1e infrastructure ensures metadata preservation at scale
5. **Integration**: Phase 4 delocation seamlessly works with ASPIC+ metadata

---

## Recommended Next Steps

### Before Starting Phase 5A.1

1. **Review Theoretical Foundations**
   - Read `LUDICS_THEORY_ANALYSIS_FOR_IMPLEMENTATION.md`
   - Read `LUDICS_THEORY_FOUNDATIONS.md`
   - Understand Ludics ↔ ASPIC+ mappings

2. **Verify Phase 1e/Phase 4 Integration**
   - Test CQ → DialogueMove → Ludics → AIF flow
   - Verify ASPIC+ metadata preserved at each step
   - Check delocation with ASPIC+ metadata

3. **Plan UI for ASPIC+ Visibility**
   - How to display attack types to users?
   - How complex should formal theory view be?
   - What level of detail for provenance chain?

4. **Performance Testing**
   - Phase 1e adds metadata to every act
   - Test compilation time with 1000+ moves
   - Check AIF sync performance with many CA-nodes

### Implementation Priority

**Highest Value** (Start Here):
- 5A.1: Interactive challenges (immediate user value + tests full stack)
- 5A.3: Commitment Store (showcases ASPIC+ theory integration)

**High Value** (Next):
- 5A.2: Cross-scope navigation (leverages Phase 4 infrastructure)
- 5B.1: Scheme-aware CQs (enhances argument quality)

**Medium Value** (Later):
- 5B.2-3: Premise linking, synthesis
- 5C: Advanced scoping (as needed)
- 5D: Performance optimization (only if needed)

---

## Conclusion

The Phase 5 roadmap is now **fully aligned** with:
- ✅ Ludics formal theory (actions, chronicles, designs, interaction)
- ✅ ASPIC+ framework (attacks, defeats, argumentation theory)
- ✅ Completed infrastructure (Phases 0-1e, Phase 4)
- ✅ Theoretical integration (Commitment State = ASPIC+ Theory)

**Phase 5 implementation can proceed with confidence that the formal foundations are sound and the required infrastructure is in place.**

All features now have explicit theoretical grounding, clear implementation paths using existing code, and comprehensive testing strategies that verify formal semantics preservation throughout the system.

**Ready to implement!** 🚀

---

**References**:
- Phase 0-1e Implementation: `docs/arg-computation-research/PHASE_*_*.md`
- Phase 4 Implementation: `PHASE_4_IMPLEMENTATION_COMPLETE.md`
- Ludics Theory: `docs/arg-computation-research/Ludics- Argumentation, Inference, and Designs.txt`
- Ludics Analysis: `docs/arg-computation-research/LUDICS_THEORY_ANALYSIS_FOR_IMPLEMENTATION.md`
- Theory Foundations: `LUDICS_THEORY_FOUNDATIONS.md`
- Updated Roadmap: `ludics-development-roadmaps-research/PHASE_5_ROADMAP.md`
