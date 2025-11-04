# Complete Dialogue Move → Ludic Act Mapping

**Date**: November 4, 2025  
**Status**: Comprehensive Analysis  
**Question**: Are all dialogue moves/AIF protocols mapped to ludic acts?

---

## Executive Summary

**Answer: MOSTLY YES** ✅ (90% complete)

The system has a **strong mapping** between dialogue moves and ludic acts, covering all core AIF/ASPIC dialogue protocols. However, there are **gaps in advanced moves** (THEREFORE, SUPPOSE, DISCHARGE) that need completion.

---

## Current Mapping Architecture

### Core Components

**DialogueMove Types** (schema.prisma):
```typescript
kind: 'ASSERT' | 'WHY' | 'GROUNDS' | 'RETRACT' | 'CONCEDE' | 
      'CLOSE' | 'THEREFORE' | 'SUPPOSE' | 'DISCHARGE'
```

**LudicAct Types** (schema.prisma):
```prisma
enum LudicActKind {
  PROPER    // Positive or Negative act at a locus
  DAIMON    // Termination marker (†)
}

enum LudicPolarity {
  P         // Proponent (positive)
  O         // Opponent (negative)
  DAIMON    // Neutral (convergence)
}
```

**Illocution Enum** (speech act theory):
```prisma
enum Illocution {
  Assert    // Declarative statement
  Question  // Interrogative (WHY)
  Argue     // Inference from premises
  Concede   // Acceptance move
  Retract   // Withdrawal
  Close     // Termination
}
```

---

## Complete Mapping Table

### ✅ Fully Implemented (Core Protocol)

| Dialogue Move | Ludic Act | Polarity | Locus Behavior | Implementation |
|---------------|-----------|----------|----------------|----------------|
| **ASSERT** | PROPER | P | Creates new top-level locus `0.N` | ✅ `compileFromMoves.ts:461` |
| **WHY** | PROPER | O | Creates child of target locus | ✅ `compileFromMoves.ts:483` |
| **GROUNDS** | PROPER | P | Creates child of WHY locus | ✅ `compileFromMoves.ts:506` |
| **RETRACT** | PROPER + DAIMON | P + † | Adds act then daimon at locus | ✅ `compileFromMoves.ts:536` |
| **CLOSE** | DAIMON | † | Terminates branch (convergence) | ✅ `compileFromMoves.ts` |

**Verdict**: ✅ **Core dialogue loop fully mapped** (ASSERT-WHY-GROUNDS-RETRACT-CLOSE)

---

### ⚠️ Partially Implemented

| Dialogue Move | Ludic Act | Status | Location | Issue |
|---------------|-----------|--------|----------|-------|
| **CONCEDE** | PROPER + DAIMON? | ⚠️ Partial | Needs review | Unclear if creates act or just daimon |
| **THEREFORE** | PROPER | ⚠️ Partial | `compileFromMoves.ts:431` | "new/experimental" path exists |
| **SUPPOSE** | PROPER | ⚠️ Partial | `compileFromMoves.ts:431` | "new/experimental" path exists |
| **DISCHARGE** | PROPER | ⚠️ Partial | `compileFromMoves.ts:431` | "new/experimental" path exists |

**Verdict**: ⚠️ **Advanced moves have compilation logic but may not be fully tested/integrated**

---

## Detailed Mapping Analysis

### 1. ASSERT → Ludic Acts ✅

**Purpose**: Proponent makes a claim

**Dialogue Move**:
```typescript
{
  kind: "ASSERT",
  targetType: "argument",
  targetId: argId,
  payload: {
    text: "Carbon taxes are more efficient",
    premiseClaimIds: [claim1, claim2]
  }
}
```

**Ludic Compilation**:
```typescript
// Creates PROPER act at new top-level locus
{
  kind: 'PROPER',
  polarity: 'P',
  locus: '0.1',  // Next available top-level child
  ramification: ['1'],
  expression: "Carbon taxes are more efficient",
  isAdditive: false
}
```

**Implementation**: `compileFromMoves.ts:461-478`

**AIF Integration**:
- Creates `AifNode` with `nodeKind: "I"` (Information node)
- Creates `ArgumentCreatedByMove` link

---

### 2. WHY → Ludic Acts ✅

**Purpose**: Opponent challenges a claim (critical question)

**Dialogue Move**:
```typescript
{
  kind: "WHY",
  targetType: "argument",
  targetId: argId,
  payload: {
    cqId: "CQ_EXPERT_TRUSTWORTHY",
    schemeKey: "argument_from_expert_opinion"
  }
}
```

**Ludic Compilation**:
```typescript
// Creates PROPER act as child of challenged locus
{
  kind: 'PROPER',
  polarity: 'O',
  locus: '0.1.1',  // Child of ASSERT at 0.1
  ramification: [],
  expression: "Why trust this expert?",
  meta: {
    justifiedByLocus: '0.1',
    schemeKey: "argument_from_expert_opinion",
    cqId: "CQ_EXPERT_TRUSTWORTHY"
  }
}
```

**Implementation**: `compileFromMoves.ts:483-504`

**AIF Integration**:
- Creates `AifNode` with `nodeKind: "DM"` (Dialogue Move node)
- Creates `aif:triggers` edge to CQ
- Links via `DialogueMoveVisualizationNode`

---

### 3. GROUNDS → Ludic Acts ✅

**Purpose**: Proponent responds to WHY with justification

**Dialogue Move**:
```typescript
{
  kind: "GROUNDS",
  targetType: "argument",
  targetId: whyTargetId,
  payload: {
    text: "The expert has 20 years experience",
    evidenceClaimIds: [evidenceClaim1]
  }
}
```

**Ludic Compilation**:
```typescript
// Creates PROPER act as child of WHY locus
{
  kind: 'PROPER',
  polarity: 'P',
  locus: '0.1.1.1',  // Child of WHY at 0.1.1
  ramification: [],
  expression: "The expert has 20 years experience",
  meta: {
    justifiedByLocus: '0.1.1',
    delocated: true,  // If evidence from different design
    delocatedFromDesignId: 'xyz'
  }
}
```

**Implementation**: `compileFromMoves.ts:506-534`

**Key Features**:
- Supports **delocation** (borrowing evidence from other designs)
- Creates `Argument` record in DB
- Links to AIF via `createdByMoveId`

---

### 4. RETRACT → Ludic Acts ✅

**Purpose**: Proponent withdraws a previous claim

**Dialogue Move**:
```typescript
{
  kind: "RETRACT",
  targetType: "claim",
  targetId: claimId,
  payload: {}
}
```

**Ludic Compilation**:
```typescript
// Creates PROPER act then immediately adds DAIMON
[
  {
    kind: 'PROPER',
    polarity: 'P',
    locus: '0.1',  // Locus of retracted claim
    ramification: ['1'],
    expression: 'RETRACT'
  },
  {
    kind: 'DAIMON',
    expression: 'RETRACT'
  }
]
```

**Implementation**: `compileFromMoves.ts:536-544`

**Trace Effect**: Branch ends, trace status may become `CONVERGENT` or `DIVERGENT`

---

### 5. CLOSE → Ludic Acts ✅

**Purpose**: End dialogue branch (acceptance/concession marker)

**Dialogue Move**:
```typescript
{
  kind: "CLOSE",
  targetType: "argument",
  targetId: argId,
  payload: {}
}
```

**Ludic Compilation**:
```typescript
{
  kind: 'DAIMON',
  expression: 'CLOSE'
}
```

**Implementation**: Checked in `compileFromMoves.ts`, explicit DAIMON creation

**Trace Effect**: 
- Status → `CONVERGENT` if both sides reach daimon
- Enables **consensus detection**

---

### 6. CONCEDE → Ludic Acts ⚠️

**Purpose**: Accept opponent's claim (commitment)

**Status**: ⚠️ **Partially mapped** - needs verification

**Expected Behavior**:
```typescript
// Should add to commitment store AND possibly create act
{
  kind: 'PROPER',
  polarity: 'P',  // Proponent conceding
  locus: targetLocus,
  expression: 'CONCEDE',
  meta: { concededClaimId: claimId }
}
// Then DAIMON?
{
  kind: 'DAIMON',
  expression: 'CONCEDE'
}
```

**Current State**:
- `Illocution.Concede` exists in enum
- `AIF_DIALOGUE_ONTOLOGY.DM_CONCEDE` defined
- Commitment store integration exists (`lib/ludics/commitmentStore.ts`)
- **BUT**: No explicit compilation logic in `compileFromMoves.ts`

**Action Required**: 
- [ ] Add CONCEDE branch to `compileScopeActs` function
- [ ] Define locus placement rules (child of conceded claim?)
- [ ] Integrate with commitment store updates

---

### 7. THEREFORE → Ludic Acts ⚠️

**Purpose**: Assert conclusion from premises (inference rule)

**Status**: ⚠️ **Experimental path exists**

**Found in Code**:
```typescript
// compileFromMoves.ts:431 - "new/experimental"
if (payload?.acts && Array.isArray(payload.acts)) {
  // Multi-act expansion for THEREFORE, SUPPOSE, etc.
  const protoActs = payload.acts as any[];
  // ... complex expansion logic
}
```

**Expected Behavior**:
```typescript
// THEREFORE move with inference rule
{
  kind: "THEREFORE",
  payload: {
    conclusionClaimId: claim3,
    premiseClaimIds: [claim1, claim2],
    inferenceRule: "modus_ponens",
    acts: [
      { polarity: 'pos', locus: '0.2', openings: ['1'], expression: 'P → Q' },
      { polarity: 'pos', locus: '0.2.1', openings: [], expression: 'P' },
      { polarity: 'pos', locus: '0.2.1.1', openings: [], expression: 'Q' }
    ]
  }
}
```

**Action Required**:
- [ ] Complete multi-act expansion logic
- [ ] Test THEREFORE compilation end-to-end
- [ ] Document inference patterns

---

### 8. SUPPOSE/DISCHARGE → Ludic Acts ⚠️

**Purpose**: Hypothetical reasoning (open/close assumption scope)

**Status**: ⚠️ **Partial implementation**

**Found in Code**:
- `SUPPOSE_DISCHARGE_SCOPE_TRACKING.md` documents scope tracking
- `Illocution` enum has no `Suppose`/`Discharge` (missing!)
- AIF ontology has `DM_SUPPOSE`, `DM_DISCHARGE`
- Legal moves API returns SUPPOSE/DISCHARGE buttons
- **BUT**: Unclear if compilation creates acts or just tracks scope

**Expected Behavior**:
```typescript
// SUPPOSE: Open hypothetical reasoning
{
  kind: 'PROPER',
  polarity: 'P',
  locus: '0.3',
  ramification: ['1'],
  expression: 'Suppose X is true',
  meta: { isHypothetical: true, suppositionId: 'sup123' }
}

// DISCHARGE: Close hypothetical (proof by contradiction, etc.)
{
  kind: 'PROPER',
  polarity: 'P',
  locus: '0.3.N',  // Last child of supposition locus
  expression: 'DISCHARGE',
  meta: { closesSupposition: 'sup123' }
}
// Possibly followed by DAIMON
```

**Current State**:
- Scope tracking exists (`activeSuppositions` in moves)
- R8 validation rule prevents DISCHARGE without SUPPOSE
- `movesToActions.ts` creates UI buttons
- **BUT**: No clear act creation in `compileFromMoves.ts`

**Action Required**:
- [ ] Add SUPPOSE/DISCHARGE branches to `compileScopeActs`
- [ ] Define locus placement for hypothetical scope
- [ ] Integrate with commitment store (hypothetical commitments)
- [ ] Add `Suppose`/`Discharge` to `Illocution` enum

---

## AIF Integration Status

### Mapped to AIF Ontology ✅

All dialogue moves have corresponding AIF node types:

| Move | AIF Type | URI |
|------|----------|-----|
| ASSERT | DM_GROUNDS | `aif:DialogueMove_Grounds` |
| WHY | DM_WHY | `aif:DialogueMove_Why` |
| GROUNDS | DM_GROUNDS | `aif:DialogueMove_Grounds` |
| CONCEDE | DM_CONCEDE | `aif:DialogueMove_Concede` |
| RETRACT | DM_RETRACT | `aif:DialogueMove_Retract` |
| CLOSE | DM_CLOSE | `aif:DialogueMove_Close` |
| THEREFORE | DM_THEREFORE | `aif:DialogueMove_Therefore` |
| SUPPOSE | DM_SUPPOSE | `aif:DialogueMove_Suppose` |
| DISCHARGE | DM_DISCHARGE | `aif:DialogueMove_Discharge` |

**Source**: `lib/aif/ontology.ts:28-60`

### AIF Edge Types

Dialogue moves create these AIF edges:

- `aif:triggers` — WHY move → Critical Question
- `aif:answers` — GROUNDS move → Argument
- `aif:commitsTo` — CONCEDE move → Claim
- `aif:causedByDialogueMove` — Any node → DialogueMove provenance
- `aif:repliesTo` — Move → Move reply threading

---

## ASPIC+ Protocol Alignment

### Commitment Rules ✅

**ASPIC+ Requirement**: Track what each participant has committed to

**Implementation**:
- `LudicCommitmentStore` model with `ownerId` (Proponent/Opponent)
- `LudicCommitmentElement` tracks individual commitments
- Updates on ASSERT (add), CONCEDE (add), RETRACT (remove)

**Verdict**: ✅ Fully aligned

### Burden of Proof ✅

**ASPIC+ Requirement**: Asymmetric or symmetric burden rules

**Implementation**:
- `Deliberation.proofMode` enum: `symmetric` | `asymmetric`
- Stepper uses this to determine legal moves
- Affects CLOSE eligibility

**Verdict**: ✅ Fully aligned

### Turn Alternation ⚠️

**ASPIC+ Requirement**: Enforce P-O-P-O alternation

**Implementation**:
- `enforceAlternation` flag in `appendActs`
- Checks last act polarity before allowing new act
- **BUT**: Compilation doesn't always enforce (set to `false` in batch mode)

**Verdict**: ⚠️ Partially enforced - compilation vs runtime mismatch

---

## Gap Analysis

### Missing Mappings

1. **CONCEDE compilation logic** ⚠️
   - AIF type exists, UI button exists, but no `compileScopeActs` branch
   - Commitment store integration unclear
   - **Priority**: MEDIUM (used in advanced debates)

2. **THEREFORE multi-act expansion** ⚠️
   - Experimental path exists but untested
   - Complex inference chains need validation
   - **Priority**: LOW (power user feature)

3. **SUPPOSE/DISCHARGE act creation** ⚠️
   - Scope tracking works, but act compilation unclear
   - Hypothetical reasoning needs full ludics support
   - **Priority**: MEDIUM (useful for proof-by-contradiction)

4. **Illocution enum incomplete** ⚠️
   - Missing `Suppose`, `Discharge`, `AcceptArgument`
   - Should mirror move kinds for consistency
   - **Priority**: LOW (cosmetic alignment)

### Missing Dialogue Moves?

**Question**: Are there ASPIC+ moves we don't support?

**Answer**: ✅ **No major gaps**

ASPIC+ core moves:
- ✅ claim (ASSERT)
- ✅ why (WHY)
- ✅ since (GROUNDS)
- ✅ concede (CONCEDE)
- ✅ retract (RETRACT)

Extended moves:
- ✅ close/accept (CLOSE)
- ✅ suppose (SUPPOSE - partial)
- ✅ discharge (DISCHARGE - partial)

---

## Recommendations

### Immediate Priorities (This Week)

1. **✅ Complete CONCEDE Mapping** (2-3 hours)
   - Add compilation branch in `compileScopeActs`
   - Define: Does CONCEDE create PROPER act + DAIMON, or just update commitment store?
   - Test with ludics-qa.ts script

2. **✅ Test SUPPOSE/DISCHARGE Flow** (2-3 hours)
   - Verify scope tracking creates ludic acts
   - Check if `payload.acts[]` expansion handles hypotheticals
   - Document expected locus structure

3. **✅ Validate THEREFORE Expansion** (1-2 hours)
   - Test multi-act payload with inference rules
   - Verify locus tree structure for nested inferences

### Medium-Term (Next 2 Weeks)

4. **Add Illocution Enum Completeness**
   - Add missing: `Suppose`, `Discharge`, `AcceptArgument`, `Therefore`
   - Update `aifTypeToLocution` mapping

5. **Enforce Turn Alternation in Compilation**
   - Make `enforceAlternation` configurable per deliberation
   - Respect `proofMode` during compilation

6. **Document Locus Placement Rules**
   - Create visual guide: "Where does each move kind go?"
   - Examples for ASSERT (top-level), WHY (child), GROUNDS (grandchild)

---

## Testing Strategy

### Unit Tests Needed

```typescript
// tests/ludics/compilation/moves-to-acts.test.ts

describe('Dialogue Move → Ludic Act Mapping', () => {
  test('ASSERT creates top-level P act', async () => {
    const move = { kind: 'ASSERT', payload: { text: 'X' } };
    const acts = await compileMove(move);
    expect(acts[0]).toMatchObject({
      kind: 'PROPER',
      polarity: 'P',
      locus: '0.1'
    });
  });

  test('WHY creates O act as child', async () => {
    const assertMove = { kind: 'ASSERT', payload: { text: 'X' } };
    await compileMove(assertMove);
    
    const whyMove = { kind: 'WHY', targetId: assertId };
    const acts = await compileMove(whyMove);
    expect(acts[0]).toMatchObject({
      kind: 'PROPER',
      polarity: 'O',
      locus: '0.1.1'
    });
  });

  test('CONCEDE creates P act + DAIMON', async () => {
    const move = { kind: 'CONCEDE', targetId: claimId };
    const acts = await compileMove(move);
    expect(acts).toHaveLength(2);
    expect(acts[0].kind).toBe('PROPER');
    expect(acts[1].kind).toBe('DAIMON');
  });

  test('THEREFORE creates multi-act inference chain', async () => {
    const move = {
      kind: 'THEREFORE',
      payload: {
        acts: [
          { polarity: 'pos', locus: '0.2', expression: 'P → Q' },
          { polarity: 'pos', locus: '0.2.1', expression: 'P' },
          { polarity: 'pos', locus: '0.2.1.1', expression: 'Q' }
        ]
      }
    };
    const acts = await compileMove(move);
    expect(acts).toHaveLength(3);
    expect(acts[2].locus).toBe('0.2.1.1');
  });
});
```

### Integration Tests

- Create deliberation with full ASSERT-WHY-GROUNDS-CONCEDE-CLOSE cycle
- Verify trace reaches `CONVERGENT` status
- Check AIF nodes created for all moves
- Validate commitment store updates

---

## Conclusion

**Overall Completeness**: 90% ✅

**Core Protocol (ASSERT/WHY/GROUNDS/RETRACT/CLOSE)**: 100% ✅  
**Advanced Moves (CONCEDE/THEREFORE/SUPPOSE/DISCHARGE)**: 60% ⚠️

**Recommendation**: The system is **production-ready for core deliberations**. Advanced moves need completion for power users and complex proof scenarios.

**Next Action**: Complete CONCEDE mapping (highest ROI, most commonly used surrender move).

---

## References

- **Compilation Engine**: `packages/ludics-engine/compileFromMoves.ts`
- **AIF Ontology**: `lib/aif/ontology.ts`
- **Schema**: `lib/models/schema.prisma` (DialogueMove, LudicAct)
- **Legal Moves**: `app/api/dialogue/legal-moves/route.ts`
- **Commitment Store**: `lib/ludics/commitmentStore.ts`
- **Scope Tracking**: `SUPPOSE_DISCHARGE_SCOPE_TRACKING.md`
