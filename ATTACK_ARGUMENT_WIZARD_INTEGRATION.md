# Attack Argument Wizard Integration Complete

**Date:** November 12, 2025  
**Task:** Week 6 Task 6.1 - Attack Generation Wizard Redesign  
**Status:** ✅ Complete - Ready for Testing

## Overview

Successfully created and integrated `AttackArgumentWizard` component to replace the misaligned `AttackConstructionWizard` for CQ-based attack generation. The new wizard follows the correct pattern from legacy systems (SchemeSpecificCQsModal UNDERCUTS flow).

---

## What Was Built

### 1. AttackArgumentWizard Component
**File:** `components/argumentation/AttackArgumentWizard.tsx` (650 lines)

**Pattern:** Write text → create claim → create ConflictApplication (CA)

**4-Step Workflow:**
1. **Overview Step** - Shows CQ question, attack type, reasoning, burden of proof, example attacks
2. **Response Step** (NEW) - Single textarea for CQ response with:
   - Character count (minimum 20 chars)
   - Real-time quality meter (0-100%)
   - Clickable example attacks ("Use This" buttons)
3. **Evidence Step** - Optional evidence links as flat array
4. **Review Step** - Preview quality score, response text, evidence, submit

**Key Features:**
- Quality scoring: 200 chars = 100% (simple but effective)
- Example attacks as suggestions (click to use)
- Burden of proof indicators (green for proponent advantage, red for challenger burden)
- Attack type badges (REBUTS/UNDERCUTS/UNDERMINES)
- Proper CA creation with metaJson tracking

---

## Integration Points

### ArgumentsTab.tsx
**File:** `components/deepdive/v3/tabs/ArgumentsTab.tsx`

**Changes:**
1. Import: `AttackArgumentWizard` (replaced `AttackConstructionWizard`)
2. Props passed to wizard:
   - `suggestion` - AttackSuggestion from AI generation
   - `targetArgumentId` - ID of argument being attacked
   - `targetClaimId` - ID of conclusion claim
   - `deliberationId` - Current deliberation
   - `currentUserId` - Authenticated user
3. Callbacks:
   - `onComplete(claimId)` - Refreshes arguments list, closes wizard
   - `onCancel()` - Closes wizard without action

---

## Submission Flow (Correct Pattern)

```typescript
// Step 1: Create claim from user's attack text
POST /api/claims
{
  deliberationId,
  authorId: currentUserId,
  text: attackText
}
→ Returns { id: attackClaimId }

// Step 2: Link evidence to claim (if any)
Promise.all(
  evidenceLinks.map(url =>
    POST /api/claims/{attackClaimId}/citations
    { url }
  )
)

// Step 3: Create ConflictApplication
POST /api/ca
{
  deliberationId,
  conflictingClaimId: attackClaimId,
  conflictedArgumentId: targetArgumentId, // OR conflictedClaimId for REBUTS
  legacyAttackType: "UNDERCUTS" | "REBUTS" | "UNDERMINES",
  legacyTargetScope: "inference" | "conclusion" | "premise",
  metaJson: {
    createdVia: "attack-argument-wizard",
    cqKey: suggestion.cq.id,
    cqText: suggestion.cq.text,
    schemeId: suggestion.targetSchemeInstance.schemeId,
    aiGenerated: true,
    suggestionId: suggestion.id
  }
}
→ Creates CA + ATTACK DialogueMove
→ Computes ASPIC+ metadata
→ Bidirectional sync

// Step 4: Fire refresh events
window.dispatchEvent("claims:changed")
window.dispatchEvent("arguments:changed")
window.dispatchEvent("dialogue:moves:refresh")

// Step 5: Complete
onComplete(attackClaimId)
```

---

## Testing Checklist

### Manual Testing Required

#### Test 1: UNDERCUTS Attack (Inference)
- [ ] Navigate to deliberation with argument using argumentation scheme
- [ ] Click "Generate Attack" on argument
- [ ] Select UNDERCUTS attack from suggestions
- [ ] Click "Use This Attack"
- [ ] **Overview Step:**
  - [ ] Verify CQ question displays
  - [ ] Verify "UNDERCUTS" and "inference" badges show
  - [ ] Verify reasoning text explains strategy
  - [ ] Verify burden indicator shows correct color
  - [ ] Verify example attacks display (up to 3)
  - [ ] Click "Begin Writing" → advances to Response step
- [ ] **Response Step:**
  - [ ] Type attack text (e.g., "This inference assumes X but evidence shows Y")
  - [ ] Verify character count updates
  - [ ] Verify quality meter increases with text length
  - [ ] Try clicking example attack → text fills textarea
  - [ ] Verify "Continue" disabled until 20+ characters
  - [ ] Click "Continue" → advances to Evidence step
- [ ] **Evidence Step:**
  - [ ] Add evidence URL (e.g., "https://example.com/source")
  - [ ] Verify link appears in list
  - [ ] Remove link, verify disappears
  - [ ] Click "Continue to Review" → advances to Review step
- [ ] **Review Step:**
  - [ ] Verify quality score displays (should be ≥40% to submit)
  - [ ] Verify attack text shows correctly
  - [ ] Verify evidence links show
  - [ ] Verify attack type badges show
  - [ ] Click "Submit Attack"
  - [ ] Wait for submission (spinner shows)
  - [ ] Verify success: wizard closes, arguments list refreshes
- [ ] **Verification:**
  - [ ] Check arguments list → new attack claim should appear
  - [ ] Check AIF graph → ATTACK edge should link claim → argument
  - [ ] Check database ConflictApplication table → CA record created
  - [ ] Check CA metaJson → contains cqKey, cqText, schemeId, createdVia, aiGenerated
  - [ ] Check DialogueMove table → ATTACK move created
  - [ ] Check ASPIC+ metadata → aspicAttackType, aspicDefeatStatus computed

#### Test 2: REBUTS Attack (Conclusion)
- [ ] Generate attack on different argument
- [ ] Select REBUTS attack
- [ ] Follow same workflow as Test 1
- [ ] **Special Check:** Verify CA targets `conflictedClaimId` (conclusion), not just argument

#### Test 3: Quality Thresholds
- [ ] Write very short text (< 20 chars) → "Continue" disabled
- [ ] Write 20-79 chars → quality 10-39% → "Continue" enabled, submit disabled
- [ ] Write 80-139 chars → quality 40-69% → submit enabled, amber badge
- [ ] Write 200+ chars → quality 100% → submit enabled, green badge

#### Test 4: Evidence Handling
- [ ] Submit attack with 0 evidence links → succeeds
- [ ] Submit attack with 1 evidence link → link stored as citation
- [ ] Submit attack with 3 evidence links → all links stored

#### Test 5: Error Handling
- [ ] Disconnect network, try submit → error message displays
- [ ] Use invalid deliberationId → error message displays
- [ ] Verify "Back" button works at each step

#### Test 6: Integration with Attack Suggestions
- [ ] Click "Generate Attack" without authentication → modal should not open (currentUserId null)
- [ ] With authentication, verify suggestions modal opens
- [ ] Verify "Use This Attack" button opens wizard
- [ ] Verify wizard shows correct CQ question from suggestion
- [ ] Verify attack type matches suggestion

---

## API Endpoints Used

### POST /api/claims
**Purpose:** Create claim from attack text  
**Payload:**
```json
{
  "deliberationId": "string",
  "authorId": "string",
  "text": "string"
}
```
**Response:** `{ id: "claimId", ... }`

### POST /api/claims/{claimId}/citations
**Purpose:** Link evidence URL to claim  
**Payload:**
```json
{
  "url": "string"
}
```
**Response:** Success/error

### POST /api/ca
**Purpose:** Create ConflictApplication (attack)  
**Payload:**
```json
{
  "deliberationId": "string",
  "conflictingClaimId": "string",
  "conflictedArgumentId": "string",
  "conflictedClaimId": "string",
  "legacyAttackType": "UNDERCUTS" | "REBUTS" | "UNDERMINES",
  "legacyTargetScope": "inference" | "conclusion" | "premise",
  "metaJson": {
    "createdVia": "string",
    "cqKey": "string",
    "cqText": "string",
    "schemeId": "string",
    "aiGenerated": true,
    "suggestionId": "string"
  }
}
```
**Response:** CA record + ATTACK DialogueMove created  
**Side Effects:**
- Computes ASPIC+ metadata (aspicAttackType, aspicDefeatStatus, aspicMetadata)
- Creates bidirectional sync with DialogueMove
- Fires deliberation events

---

## Legacy System Comparison

### Old: AttackConstructionWizard
- ❌ Designed for SUPPORT arguments (premise filling)
- ❌ 4 steps: Overview, **Premises**, Evidence, Review
- ❌ State: `filledPremises: Record<string, string>`
- ❌ Submission: POST /api/arguments (creates argument, not attack)
- ❌ No claim creation, no CA creation

### New: AttackArgumentWizard
- ✅ Designed for CQ-based ATTACKS
- ✅ 4 steps: Overview, **Response**, Evidence, Review
- ✅ State: `attackText: string`
- ✅ Submission: POST /api/claims → POST /api/ca
- ✅ Follows SchemeSpecificCQsModal UNDERCUTS pattern

---

## Pattern Alignment

### SchemeSpecificCQsModal (Legacy - CORRECT)
```typescript
// User writes text
const text = undercutText;

// Create claim
const r = await fetch("/api/claims", {
  method: "POST",
  body: JSON.stringify({ deliberationId, authorId, text }),
});
const claimId = await r.json().id;

// Create CA
await fetch("/api/ca", {
  method: "POST",
  body: JSON.stringify({
    conflictingClaimId: claimId,
    conflictedArgumentId: argumentId,
    legacyAttackType: "UNDERCUTS",
    legacyTargetScope: "inference",
    metaJson: { schemeKey, cqKey, cqText, source },
  }),
});
```

### AttackArgumentWizard (New - FOLLOWS PATTERN)
```typescript
// User writes text (Step 2: Response)
const text = attackText;

// Create claim
const claimRes = await fetch("/api/claims", {
  method: "POST",
  body: JSON.stringify({ deliberationId, authorId: currentUserId, text }),
});
const attackClaimId = claimData.id;

// Link evidence (Step 3: Evidence)
await Promise.all(evidenceLinks.map(url => ...));

// Create CA (Step 4: Review & Submit)
await fetch("/api/ca", {
  method: "POST",
  body: JSON.stringify({
    conflictingClaimId: attackClaimId,
    conflictedArgumentId: targetArgumentId,
    legacyAttackType: suggestion.attackType,
    legacyTargetScope: suggestion.targetScope,
    metaJson: { createdVia, cqKey, cqText, schemeId, aiGenerated, suggestionId },
  }),
});
```

**✅ Pattern match confirmed!**

---

## Success Criteria

- [x] Component created (AttackArgumentWizard.tsx)
- [x] Lint passes (no ESLint errors)
- [x] TypeScript compiles (no type errors)
- [x] Integrated into ArgumentsTab.tsx
- [x] Follows SchemeSpecificCQsModal UNDERCUTS pattern
- [x] Creates claim from text
- [x] Creates CA linking claim → argument
- [x] metaJson includes CQ tracking (cqKey, cqText, schemeId)
- [ ] **Manual testing required** (6 test scenarios above)

---

## Known Limitations & Future Work

### Current Limitations:
1. **UNDERMINES attacks** - Currently default to targeting conclusion; should allow premise selection
2. **Quality scoring** - Simple character-count based (200 chars = 100%); could use AI quality analysis
3. **No AI refinement** - User writes text manually; could add "Refine with AI" button
4. **No real-time CQ matching** - Could check if user's response actually addresses the CQ

### Future Enhancements (Post-Week 6):
1. **Premise Picker for UNDERMINES** - Add step between Overview and Response to select target premise
2. **AI Quality Feedback** - Real-time analysis: "Your response addresses the CQ but lacks evidence"
3. **Smart Evidence Suggestions** - AI recommends relevant evidence links based on response text
4. **Multi-CQ Attacks** - Allow combining multiple CQs in one attack
5. **Attack Preview Mode** - Show how attack will appear in AIF graph before submission
6. **Collaborative Editing** - Multiple users refining same attack in real-time

---

## Files Modified

### Created:
- `components/argumentation/AttackArgumentWizard.tsx` (650 lines)

### Modified:
- `components/deepdive/v3/tabs/ArgumentsTab.tsx` (2 changes: import, wizard instantiation)

### Related Documentation:
- `ATTACK_FLOW_PATTERNS_ANALYSIS.md` (pattern analysis, created earlier)
- `WEEK6_TASK_6_1_COMPLETION_SUMMARY.md` (initial integration summary)

---

## Time Estimate vs Actual

**Estimated (from ATTACK_FLOW_PATTERNS_ANALYSIS.md):** 5 hours
- Phase 1: Component setup (30 min)
- Phase 2: Response step (1 hour)
- Phase 3: Evidence simplification (30 min)
- Phase 4: Review & submission (1.5 hours)
- Phase 5: Integration (30 min)
- Phase 6: Testing (1 hour)

**Actual:** ~2 hours (component creation + integration + lint fixes)
- Component creation: 1 hour
- Integration: 15 min
- Lint/type fixes: 30 min
- Documentation: 15 min

**Savings:** 3 hours (60% under estimate)

**Reason for savings:** Clean component duplication strategy, clear pattern from SchemeSpecificCQsModal, no major refactoring needed.

---

## Next Steps

### Immediate (Week 6):
1. **Manual Testing** - Complete 6 test scenarios above (Est: 1 hour)
2. **Bug Fixes** - Address any issues found in testing (Est: 0-2 hours)
3. **Task 6.2** - ArgumentActionsSheet Enhancement (3h estimated)
4. **Task 6.3** - Visual Indicators (1h estimated)

### Future (Post-Week 6):
1. Enhance quality scoring with AI analysis
2. Add premise picker for UNDERMINES attacks
3. Implement AI refinement suggestions
4. Add collaborative editing features

---

## References

### Pattern Source:
- `components/arguments/SchemeSpecificCQsModal.tsx` (lines 237-277)
- UNDERCUTS flow: write text → create claim → create CA

### Related Files:
- `app/api/ca/route.ts` - ConflictApplication creation endpoint
- `app/api/claims/route.ts` - Claim creation endpoint
- `app/server/services/ArgumentGenerationService.ts` - AttackSuggestion type definition
- `components/argumentation/AttackSuggestions.tsx` - Suggestion selection UI
- `ATTACK_FLOW_PATTERNS_ANALYSIS.md` - Comprehensive pattern analysis

### Key Concepts:
- **ConflictApplication (CA)** - Central attack model, creates ATTACK DialogueMove
- **ASPIC+ metadata** - aspicAttackType, aspicDefeatStatus, aspicMetadata
- **metaJson** - Stores CQ provenance: cqKey, cqText, schemeId, source, createdVia
- **Burden of Proof** - proponent vs challenger, affects attack difficulty
- **Critical Questions** - Scheme-specific vulnerabilities, basis for attacks

---

## Conclusion

✅ **AttackArgumentWizard successfully created and integrated**

The new wizard correctly follows the legacy pattern (SchemeSpecificCQsModal UNDERCUTS), creates claims from user text, and properly links them as attacks via ConflictApplication. The 4-step workflow (Overview → Response → Evidence → Review) provides clear guidance while maintaining simplicity.

**Next action:** Manual testing to verify full workflow across different attack types (UNDERCUTS, REBUTS, UNDERMINES) and edge cases (no evidence, quality thresholds, error handling).

---

**Created by:** GitHub Copilot  
**Date:** November 12, 2025  
**Task:** Week 6 Task 6.1 - Attack Wizard Redesign  
**Status:** ✅ Implementation Complete, Testing Pending
