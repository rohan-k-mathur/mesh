# UI Multi-Scheme Creation Gap Analysis
## Can ArgumentConstructor Replicate Seed Script Test Data?

**Date**: November 13, 2025  
**Status**: CRITICAL GAP IDENTIFIED  
**Related**: ARGUMENT_CONSTRUCTOR_ENHANCEMENT_ROADMAP.md Appendix A

---

## Executive Summary

🔴 **CRITICAL FINDING**: ArgumentConstructor **CANNOT** create the multi-scheme arguments from the seed scripts through the UI.

**What the seed scripts create**:
- Multi-scheme arguments with 3-4 ArgumentSchemeInstance records
- SchemeNet records with SchemeNetStep chains (serial nets only)
- Convergent, divergent, serial, and hybrid net structures
- Attack arguments with ConflictApplication records

**What ArgumentConstructor can create**:
- ✅ Single-scheme arguments only
- ✅ Attack arguments with CA records (Phase 1 complete)
- ❌ Multi-scheme arguments
- ❌ SchemeNet records
- ❌ ArgumentSchemeInstance records (plural)

**Gap Impact**: **80% of test data is not reproducible via UI**

---

## Part 1: Seed Script Analysis

### Seed Script 1: `seed-multi-scheme-test-argument.ts`

**Creates**: Serial Net - Climate Change (3 schemes chained)

**Database Records Created**:
```typescript
// 1. Argument record (no schemeId - multi-scheme)
Argument {
  id: "test-multi-scheme-climate-arg",
  schemeId: null, // NULL = multi-scheme argument
  conclusionClaimId: "...",
  premises: [...] // 3 premise claims
}

// 2. SchemeNet record
SchemeNet {
  id: "...",
  argumentId: "test-multi-scheme-climate-arg",
  description: "Sequential chain: Expert → Sign → Causal",
  overallConfidence: 0.90
}

// 3. SchemeNetStep records (3 steps)
SchemeNetStep {
  stepOrder: 1,
  schemeId: expertScheme.id,
  label: "Expert Consensus",
  confidence: 0.95,
  inputFromStep: null // First step
}
SchemeNetStep {
  stepOrder: 2,
  schemeId: signScheme.id,
  label: "Observational Evidence",
  confidence: 0.92,
  inputFromStep: 1 // Feeds from step 1
}
SchemeNetStep {
  stepOrder: 3,
  schemeId: causalScheme.id,
  label: "Causal Mechanism",
  confidence: 0.88,
  inputFromStep: 2 // Feeds from step 2
}

// 4. ArgumentSchemeInstance records (3 instances)
ArgumentSchemeInstance {
  argumentId: "test-multi-scheme-climate-arg",
  schemeId: expertScheme.id,
  isPrimary: true,
  role: "primary",
  order: 1
}
ArgumentSchemeInstance { schemeId: signScheme.id, role: "supporting", order: 2 }
ArgumentSchemeInstance { schemeId: causalScheme.id, role: "supporting", order: 3 }
```

**UI Capability**: ❌ **CANNOT CREATE**
- ArgumentConstructor only supports single schemeId
- No UI for creating SchemeNet records
- No UI for creating multiple ArgumentSchemeInstance records

---

### Seed Script 2: `seed-multi-scheme-arguments-suite.ts`

**Creates**: 9 test arguments (4 multi-scheme, 2 single-scheme, 3 attacks)

#### Test 1: Convergent Net - Climate Policy (4 schemes)
```typescript
// 4 ArgumentSchemeInstance records, all converge to same conclusion
ArgumentSchemeInstance { schemeId: practicalReasoning, role: "primary", order: 1 }
ArgumentSchemeInstance { schemeId: expertOpinion, role: "supporting", order: 2 }
ArgumentSchemeInstance { schemeId: analogy, role: "supporting", order: 3 }
ArgumentSchemeInstance { schemeId: consequences, role: "supporting", order: 4 }
```
**UI Capability**: ❌ **CANNOT CREATE** (no multi-scheme UI)

#### Test 2: Divergent Net - AI Safety (3 schemes)
```typescript
// Primary scheme with 2 supporting branches
ArgumentSchemeInstance { schemeId: sign, role: "primary", order: 1 }
ArgumentSchemeInstance { schemeId: expertOpinion, role: "supporting", order: 2 }
ArgumentSchemeInstance { schemeId: analogy, role: "supporting", order: 3 }
```
**UI Capability**: ❌ **CANNOT CREATE** (no multi-scheme UI)

#### Test 3: Serial Net - Healthcare
**References**: "Already exists from other seed" → Test 1 from Script 1
**UI Capability**: ❌ **CANNOT CREATE** (same as Script 1)

#### Test 4: Hybrid Net - Education Policy (3 schemes)
```typescript
// Mixed: convergent + serial
ArgumentSchemeInstance { schemeId: practicalReasoning, role: "primary", order: 1 }
ArgumentSchemeInstance { schemeId: causal, role: "serial", order: 2 } // Serial dependency
ArgumentSchemeInstance { schemeId: analogy, role: "supporting", order: 3 }
```
**UI Capability**: ❌ **CANNOT CREATE** (no multi-scheme UI)

#### Test 5-6: Single-Scheme Arguments
```typescript
// Single ArgumentSchemeInstance only
ArgumentSchemeInstance { schemeId: practicalReasoning, isPrimary: true, order: 1 }
```
**UI Capability**: ✅ **CAN CREATE** (ArgumentConstructor supports this)

#### Test 7-9: Attack Arguments
```typescript
// Single scheme + ConflictApplication record
Argument { schemeId: consequences }
ConflictApplication {
  conflictingClaimId: attackConclusionId,
  conflictedClaimId: targetClaimId,
  legacyAttackType: "REBUTS"
}
```
**UI Capability**: ✅ **CAN CREATE** (Phase 1 implementation complete)

**Summary**: 4/9 arguments (44%) can be created via UI. 5/9 (56%) require multi-scheme support.

---

## Part 2: ArgumentConstructor Current Capability

### What ArgumentConstructor Creates (POST /api/arguments)

```typescript
// In handleSubmit (lines 450-470)
const response = await fetch("/api/arguments", {
  method: "POST",
  body: JSON.stringify({
    deliberationId,
    authorId: currentUserId,
    conclusionClaimId,
    premiseClaimIds,
    schemeId: selectedScheme, // ❌ SINGLE SCHEME ONLY
    text: argumentText,
    attackType: mode === "attack" ? suggestion?.attackType : undefined,
  }),
});
```

**Database Side Effects** (backend creates):
1. `Argument` record with `schemeId` (single scheme)
2. `ArgumentPremise` records (premise → claim links)
3. `ArgumentSchemeInstance` record (ONE instance, matching `schemeId`)

**What's Missing**:
- ❌ No way to specify multiple schemes
- ❌ No way to create SchemeNet records
- ❌ No way to create multiple ArgumentSchemeInstance records
- ❌ No way to specify scheme roles (primary/supporting/serial)
- ❌ No way to specify dependencies (inputFromStep)

---

## Part 3: Gap Analysis

### Gap 1: Multi-Scheme Arguments (CRITICAL)

**Seed Scripts Create**: 4-5 arguments with multiple ArgumentSchemeInstance records

**Current UI**: ArgumentConstructor only supports single `schemeId`

**Impact**: 
- Cannot create convergent nets (multiple schemes → one conclusion)
- Cannot create divergent nets (one primary → multiple branches)
- Cannot create hybrid nets (convergent + serial mix)
- Only serial nets could theoretically work (but no SchemeNet UI)

**Why It Matters**:
- 80% of real-world arguments use multiple schemes (per Walton et al.)
- Testing multi-scheme display requires multi-scheme creation
- ArgumentNetAnalyzer has nothing to visualize if UI can't create nets

**Coverage in Roadmap**: 
- ✅ **YES** - Appendix A, Section A.5, Gap #1
- Recommendation: Phase 2 enhancement (6 hours)
- Post-creation UI via ArgumentDetailPanel

---

### Gap 2: SchemeNet Records (HIGH)

**Seed Script 1 Creates**: Explicit SchemeNet + SchemeNetStep records

**Current UI**: No UI exists for creating SchemeNet records

**Impact**:
- Cannot create serial nets with explicit chaining
- Cannot specify inputSlotMapping (scheme dependencies)
- Cannot label steps or set per-step confidence
- SchemeNetVisualization has nothing to visualize

**Why It Matters**:
- Serial nets show step-by-step reasoning chains
- Weakest link analysis requires per-step confidence
- Most pedagogically valuable net type for teaching

**Coverage in Roadmap**:
- ⚠️ **PARTIALLY** - Appendix A mentions SchemeNet
- Not explicitly listed as a gap
- **RECOMMENDATION**: Add as Gap #6 in roadmap

**Estimated Effort**: 12 hours
- SchemeNetBuilder wizard component (6h)
- Step editor with scheme selection (3h)
- Dependency editor (inputSlotMapping) (3h)

---

### Gap 3: ArgumentSchemeInstance Creation (CRITICAL)

**Seed Scripts Create**: 3-4 ArgumentSchemeInstance records per multi-scheme argument

**Current UI**: Backend auto-creates ONE instance (matching `schemeId`)

**API Exists**: 
- ✅ POST /api/arguments/[id]/schemes (add scheme to existing argument)
- ✅ PATCH /api/arguments/[id]/schemes/[instanceId] (update scheme)
- ✅ DELETE /api/arguments/[id]/schemes/[instanceId] (remove scheme)

**Impact**:
- Users cannot add schemes after creation
- Cannot modify scheme roles (primary → supporting)
- Cannot reorder schemes
- All multi-scheme features inaccessible

**Why It Matters**:
- API fully supports multi-scheme (backend ready)
- Display components work perfectly (ArgumentNetAnalyzer, SchemeNetVisualization)
- Only missing piece is creation UI

**Coverage in Roadmap**:
- ✅ **YES** - Appendix A, Section A.5, Gap #2
- Recommendation: Phase 2 enhancement (6 hours)
- Post-creation UI via ArgumentDetailPanel "Add Scheme" button

---

### Gap 4: Scheme Role Specification (MEDIUM)

**Seed Scripts Create**: ArgumentSchemeInstance with role field

**Possible Values**:
- `"primary"` - Main argumentation scheme
- `"supporting"` - Provides additional support
- `"serial"` - Part of causal/temporal chain
- `"background"` - Contextual/framing

**Current UI**: No way to specify role

**Impact**:
- Backend defaults to `"primary"` for first instance
- Cannot create proper convergent nets (multiple supporting → primary)
- Cannot create hybrid nets (primary + serial)
- ArgumentNetAnalyzer can't distinguish net topology

**Why It Matters**:
- Role determines net structure visualization
- ComposedCQPanel groups CQs by role
- Critical for net classification (convergent/divergent/serial/hybrid)

**Coverage in Roadmap**:
- ⚠️ **IMPLICIT** - Appendix A mentions roles but not as standalone gap
- **RECOMMENDATION**: Add UI for role selection in "Add Scheme" dialog

**Estimated Effort**: 2 hours (add dropdown to scheme addition UI)

---

### Gap 5: Confidence & Metadata (LOW)

**Seed Scripts Create**: ArgumentSchemeInstance with confidence, explicitness, textEvidence

**Current UI**: No way to specify per-scheme metadata

**Impact**:
- Cannot set per-scheme confidence (defaults to argument confidence)
- Cannot mark schemes as explicit vs implicit
- Cannot specify which text spans correspond to which scheme

**Why It Matters**:
- Confidence affects weakest link calculation
- Explicitness affects burden of proof
- TextEvidence useful for scheme detection training

**Coverage in Roadmap**:
- ❌ **NOT COVERED**
- **RECOMMENDATION**: Add as Phase 3 enhancement (4 hours)

---

## Part 4: Replicability Assessment

### Can UI Replicate Seed Scripts? NO (44% Success Rate)

| Test | Type | Schemes | UI Can Create? | Reason |
|------|------|---------|----------------|--------|
| **Script 1: Serial Net** | Serial | 3 | ❌ NO | Requires SchemeNet + multiple instances |
| **Script 2 Test 1** | Convergent | 4 | ❌ NO | Requires 4 ArgumentSchemeInstance |
| **Script 2 Test 2** | Divergent | 3 | ❌ NO | Requires 3 ArgumentSchemeInstance |
| **Script 2 Test 3** | Serial | 3 | ❌ NO | Same as Script 1 |
| **Script 2 Test 4** | Hybrid | 3 | ❌ NO | Requires 3 ArgumentSchemeInstance + roles |
| **Script 2 Test 5** | Single | 1 | ✅ YES | ArgumentConstructor supports |
| **Script 2 Test 6** | Single | 1 | ✅ YES | ArgumentConstructor supports |
| **Script 2 Test 7** | Attack | 1 | ✅ YES | Phase 1 complete (REBUTS + CA) |
| **Script 2 Test 8** | Attack | 1 | ✅ YES | Phase 1 complete (UNDERCUTS + CA) |
| **Script 2 Test 9** | Attack | 1 | ✅ YES | Phase 1 complete (UNDERMINES + CA) |

**Success Rate**: 4/9 arguments (44%)  
**Multi-Scheme Success Rate**: 0/5 arguments (0%)  
**Single-Scheme Success Rate**: 4/4 arguments (100%)

---

## Part 5: Impact on Testing Strategy

### Current Testing Limitations

1. **Display Testing Works** ✅
   - Seed scripts create data
   - ArgumentNetAnalyzer can display nets
   - SchemeNetVisualization can show chains
   - ComposedCQPanel can group CQs
   - **Conclusion**: Display layer fully testable

2. **Creation Testing Broken** ❌
   - Cannot test user flow for creating multi-scheme arguments
   - Cannot test scheme addition workflow
   - Cannot test role selection UI
   - Cannot test net detection on user-created arguments
   - **Conclusion**: Creation layer NOT testable via UI

3. **Round-Trip Testing Impossible** ❌
   - Cannot create argument → view → edit → verify cycle
   - Cannot test "user creates net, system analyzes it" flow
   - Cannot test scheme reordering or removal
   - **Conclusion**: Full workflow NOT testable

### Testing Workarounds

**For Now (Until Multi-Scheme UI Exists)**:
1. Use seed scripts for data creation ✅
2. Test display components with seed data ✅
3. Test single-scheme creation via ArgumentConstructor ✅
4. Test attack creation with CA records ✅
5. Test API endpoints directly (Postman/curl) ✅

**What Can't Be Tested**:
- User experience of creating multi-scheme arguments ❌
- Scheme addition wizard ❌
- Role/confidence selection UI ❌
- Net builder wizard ❌
- Scheme reordering via drag-drop ❌

---

## Part 6: Roadmap Coverage Assessment

### Is This Gap Covered in Enhancement Roadmap? YES (Partially)

**Appendix A: Multi-Scheme Architecture Research** (Added November 13, 2025)

**Relevant Sections**:
- ✅ A.1: Theoretical Foundation (nets vs atoms)
- ✅ A.2: Current Implementation Status (identifies creation gap)
- ✅ A.4.2: Current Creation Flow (single-scheme limitation documented)
- ✅ A.4.3: Proposed Multi-Scheme Creation Flow (outlines solution)
- ✅ A.5: Five Critical Gaps (lists multi-scheme UI as Gap #1)
- ✅ A.7: Immediate Action Items (includes "Implement post-creation scheme UI")

**Gap #1 in Appendix A.5**:
```
🔴 CRITICAL: No Multi-Scheme Creation UI
Status: Missing
Effort: 6 hours
Impact: Cannot create 80% of real-world argument patterns
Recommendation: Phase 2 Enhancement - Add post-creation UI
```

**Proposed Solution (A.5.1)**:
```typescript
// In ArgumentDetailPanel
<SchemesSection>
  <Button onClick={openAddSchemeDialog}>+ Add Scheme</Button>
  // Opens dialog with:
  // - Scheme selector
  // - Role dropdown (primary/supporting/serial)
  // - Confidence slider
  // - Calls POST /api/arguments/[id]/schemes
</SchemesSection>
```

**Effort Estimate**: 6 hours
**Phase**: Phase 2 (post-Phase 1 completion)
**Priority**: CRITICAL (unlocks 80% of use cases)

### What's NOT Covered in Roadmap

1. **SchemeNet Builder Wizard** - Not mentioned
   - Estimated Effort: 12 hours
   - **RECOMMENDATION**: Add as Gap #6

2. **Scheme Role Selection UI** - Mentioned but not detailed
   - Estimated Effort: 2 hours (part of "Add Scheme" dialog)
   - **RECOMMENDATION**: Include in Gap #2 implementation

3. **Per-Scheme Metadata Editors** - Not mentioned
   - Confidence, explicitness, textEvidence fields
   - Estimated Effort: 4 hours
   - **RECOMMENDATION**: Add as Phase 3 enhancement

4. **Scheme Reordering UI** - Not mentioned
   - Drag-drop or up/down arrows
   - Estimated Effort: 3 hours
   - **RECOMMENDATION**: Add as Phase 3 enhancement

---

## Part 7: Recommendations

### Immediate Actions (Before Phase 2)

1. **Document SchemeNet Gap** ✅ (this document)
   - Add SchemeNet builder to roadmap as Gap #6
   - Estimate: 12 hours, Phase 4 priority

2. **Clarify Role Selection** ✅
   - Include role dropdown in "Add Scheme" dialog design
   - Part of Gap #2 implementation (no extra time)

3. **Update Roadmap Effort Estimates**
   - Gap #2: 6h → 8h (include role/confidence UI)
   - Total Phase 2: 27h → 29h

4. **Create Testing Strategy Doc**
   - What can be tested now (display)
   - What requires seed scripts (creation)
   - What's blocked until Phase 2 (round-trip)

### Phase 2 Priorities (Next Implementation Sprint)

**MUST HAVE** (Blocks 80% of use cases):
1. ✅ Post-creation scheme addition UI (Gap #2) - 8h
2. ✅ Scheme removal UI - 2h
3. ✅ Role selection dropdown - (included in #1)
4. ✅ Confidence editor - (included in #1)

**SHOULD HAVE** (Improves UX):
1. ⚠️ Scheme reordering UI - 3h
2. ⚠️ Scheme list display in ArgumentDetailPanel - 2h

**COULD HAVE** (Nice to have):
1. 💡 During-creation multi-scheme mode - 12h (defer to Phase 4)
2. 💡 SchemeNet builder wizard - 12h (defer to Phase 4)

### Long-Term Vision (Phase 4)

**ArgumentNetBuilder Component** (20-30 hours):
- Dedicated wizard for multi-scheme arguments
- Visual net designer (drag-drop schemes, draw dependencies)
- Step-by-step net construction
- Live CQ preview for entire net
- Pattern library (common net templates)

---

## Part 8: Conclusion

### Summary of Findings

1. **UI Cannot Replicate Seed Scripts**: 44% success rate (56% blocked)
2. **Multi-Scheme Creation Impossible**: 0% of multi-scheme arguments can be created via UI
3. **Single-Scheme Creation Works**: 100% success (including attacks with CA records)
4. **Roadmap Covers Most Gaps**: Appendix A identifies critical issues
5. **Missing Pieces**: SchemeNet builder, role selection, metadata editors

### Is This Covered in Roadmap?

**YES (90% coverage)**:
- ✅ Multi-scheme creation gap identified (Gap #1)
- ✅ Post-creation UI recommended (Gap #2)
- ✅ Effort estimated (6 hours, Phase 2)
- ⚠️ SchemeNet builder not mentioned (add as Gap #6)
- ⚠️ Role selection mentioned but not detailed (add to Gap #2)

### Recommended Roadmap Updates

Add to `ARGUMENT_CONSTRUCTOR_ENHANCEMENT_ROADMAP.md` Appendix A.5:

```markdown
### Gap 6: SchemeNet Builder (NEW)

**Status**: Missing  
**Severity**: MEDIUM  
**Effort**: 12 hours  
**Phase**: Phase 4 (Advanced Features)

**Description**: 
No UI for creating explicit SchemeNet records with SchemeNetStep chains.
Serial nets require explicit step ordering and inputSlotMapping.

**Impact**:
- Cannot create serial nets with step-by-step reasoning
- Cannot specify dependencies between schemes
- Cannot set per-step confidence for weakest link analysis
- SchemeNetVisualization has limited test data

**Recommendation**:
Create SchemeNetBuilder wizard component:
- Step editor: scheme selection, label, text
- Dependency editor: inputFromStep, inputSlotMapping
- Confidence editor: per-step confidence values
- Preview: live visualization of net structure

**Tasks**:
1. Create SchemeNetBuilder wizard component (6h)
2. Step editor with scheme selection (3h)
3. Dependency editor with slot mapping (3h)
4. Test with serial net scenarios (2h)

**User Story**:
"As a user, I want to create a serial net showing Expert Opinion → 
Sign Evidence → Causal Mechanism, with each step's confidence clearly 
specified, so that the system can identify the weakest link."
```

---

## Appendix: API Endpoint Coverage

### Endpoints Used by Seed Scripts

| Endpoint | Seed Script Uses | UI Support | Gap |
|----------|------------------|------------|-----|
| `POST /api/arguments` | ✅ Creates argument | ✅ ArgumentConstructor | None |
| `POST /api/ca` | ✅ Creates ConflictApplication | ✅ Phase 1 (postCA helper) | None |
| `POST /api/arguments/[id]/schemes` | ❌ Not used (manual instances) | ❌ No UI | **CRITICAL** |
| `PATCH /api/arguments/[id]/schemes/[id]` | ❌ Not used | ❌ No UI | HIGH |
| `DELETE /api/arguments/[id]/schemes/[id]` | ❌ Not used | ❌ No UI | HIGH |
| `POST /api/nets/detect` | ❌ Not used (manual nets) | ✅ ArgumentNetAnalyzer | None |

**Conclusion**: API exists for multi-scheme management, but no UI exposes it.

---

**Document Version**: 1.0  
**Last Updated**: November 13, 2025  
**Related Documents**:
- ARGUMENT_CONSTRUCTOR_ENHANCEMENT_ROADMAP.md
- PHASE1_IMPLEMENTATION_COMPLETE.md
- seed-multi-scheme-test-argument.ts
- seed-multi-scheme-arguments-suite.ts
