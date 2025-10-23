# Integration Test Checklist: AttackMenuProV2 & SchemeSpecificCQsModal

## Overview
This checklist validates the end-to-end wiring of attack components in AIFArgumentsListPro.

**Components Under Test**:
- `AttackMenuProV2` - Main argument attack interface
- `SchemeSpecificCQsModal` - Scheme-specific critical questions with objection forms
- `AIFArgumentsListPro` - Argument browsing list

**Date**: 2025-10-22
**Status**: ✅ Code complete, awaiting functional testing

---

## Component Integration Status

### ✅ AttackMenuProV2 Integration
- [x] Dynamically imported in AIFArgumentsListPro
- [x] Receives `deliberationId` from row context
- [x] Receives `authorId` from argument row
- [x] Receives `target` object with:
  - [x] `id` (argument ID)
  - [x] `conclusion` (id + text from meta)
  - [x] `premises` (array from meta)
- [x] `onDone` callback triggers `onRefreshRow(a.id)`
- [x] Button styled with btnv2 class
- [x] Positioned in footer between PreferenceQuick and CQs button

### ✅ SchemeSpecificCQsModal Integration
- [x] Dynamically imported in AIFArgumentsListPro
- [x] Only rendered when `meta?.scheme` exists
- [x] Custom trigger button with CQ count badge
- [x] `loadCQs` callback fetches CQs on first open
- [x] Receives all required props:
  - [x] `argumentId`
  - [x] `deliberationId`
  - [x] `authorId`
  - [x] `cqs` (array from state)
  - [x] `meta` (AIF metadata)
- [x] `onRefresh` callback resets CQ state and triggers row refresh

### ✅ LegalMoveToolbar Removal
- [x] Import commented out with documentation reference
- [x] Footer usage removed
- [x] Analysis document created: `COMPONENT_ANALYSIS_LMT_vs_AMP.md`

---

## API Endpoint Verification

### `/api/ca` (Conflicting Arguments)
**Purpose**: Post attacks (rebut/undercut/undermine)

**Expected Payloads**:

#### REBUT (from AttackMenuProV2)
```json
{
  "deliberationId": "string",
  "conflictingClaimId": "string",
  "conflictedClaimId": "string",
  "legacyAttackType": "REBUTS",
  "legacyTargetScope": "conclusion",
  "metaJson": {
    "cqId": "string?",
    "schemeKey": "string?",
    "cqText": "string?",
    "cqContext": "string?"
  }
}
```

#### REBUT (from SchemeSpecificCQsModal)
```json
{
  "deliberationId": "string",
  "conflictingClaimId": "string",
  "conflictedClaimId": "string",
  "legacyAttackType": "REBUTS",
  "legacyTargetScope": "conclusion",
  "metaJson": {
    "schemeKey": "string",
    "cqKey": "string",
    "cqText": "string",
    "source": "scheme-specific-cqs-modal-rebut"
  }
}
```

#### UNDERCUT (from AttackMenuProV2)
```json
{
  "deliberationId": "string",
  "conflictingClaimId": "string (exception claim created)",
  "conflictedArgumentId": "string",
  "legacyAttackType": "UNDERCUTS",
  "legacyTargetScope": "inference",
  "metaJson": {
    "descriptorKey": "exception",
    "schemeKey": "string?",
    "cqId": "string?",
    "cqText": "string?",
    "cqContext": "string?"
  }
}
```

#### UNDERCUT (from SchemeSpecificCQsModal)
```json
{
  "deliberationId": "string",
  "conflictingClaimId": "string (exception claim created)",
  "conflictedArgumentId": "string",
  "legacyAttackType": "UNDERCUTS",
  "legacyTargetScope": "inference",
  "metaJson": {
    "schemeKey": "string",
    "cqKey": "string",
    "cqText": "string",
    "source": "scheme-specific-cqs-modal-undercut"
  }
}
```

#### UNDERMINE (from AttackMenuProV2)
```json
{
  "deliberationId": "string",
  "conflictingClaimId": "string",
  "conflictedClaimId": "string (premise ID)",
  "legacyAttackType": "UNDERMINES",
  "legacyTargetScope": "premise",
  "metaJson": {
    "cqId": "string?",
    "schemeKey": "string?",
    "cqText": "string?",
    "cqContext": "string?"
  }
}
```

#### UNDERMINE (from SchemeSpecificCQsModal)
```json
{
  "deliberationId": "string",
  "conflictingClaimId": "string",
  "conflictedClaimId": "string (premise ID)",
  "legacyAttackType": "UNDERMINES",
  "legacyTargetScope": "premise",
  "metaJson": {
    "schemeKey": "string",
    "cqKey": "string",
    "cqText": "string",
    "source": "scheme-specific-cqs-modal-undermine"
  }
}
```

### `/api/claims` (Create Claim)
**Purpose**: Create new claims for attacks

**Payload**:
```json
{
  "deliberationId": "string",
  "authorId": "string",
  "text": "string"
}
```

**Response**:
```json
{
  "claim": { "id": "string", "text": "string", ... },
  "id": "string"  // fallback
}
```

### `/api/arguments/:id/aif` (Get AIF Metadata)
**Purpose**: Fetch updated attack counts and CQ status after refresh

**Response**:
```json
{
  "aif": {
    "scheme": { "id": "string", "key": "string", "name": "string" },
    "conclusion": { "id": "string", "text": "string" },
    "premises": [{ "id": "string", "text": "string", "isImplicit": false }],
    "implicitWarrant": { "text": "string?" },
    "attacks": {
      "REBUTS": number,
      "UNDERCUTS": number,
      "UNDERMINES": number
    },
    "cq": {
      "required": number,
      "satisfied": number
    },
    "preferences": {
      "preferredBy": number,
      "dispreferredBy": number
    }
  }
}
```

### `/api/cqs` (Get CQs)
**Purpose**: Fetch CQs for CQ detection in AttackMenuProV2

**Used in**: AttackMenuProV2 CQ metadata detection

**Endpoint**: `/api/cqs?targetType=claim&targetId={id}`

---

## Event Propagation Chain

### After AttackMenuProV2 Posts Attack
1. ✅ `window.dispatchEvent('claims:changed')`
2. ✅ `window.dispatchEvent('arguments:changed')`
3. ✅ `onDone()` → `onRefreshRow(a.id)`
4. ✅ `refreshAifForId(a.id)` → fetches `/api/arguments/${id}/aif`
5. ✅ `setAifMap` updates local state
6. ✅ Row re-renders with updated attack counts

### After SchemeSpecificCQsModal Posts Objection
1. ✅ `window.dispatchEvent('claims:changed', { detail: { deliberationId } })`
2. ✅ `window.dispatchEvent('arguments:changed', { detail: { deliberationId } })`
3. ✅ `onRefresh()` → calls `onRefreshRow(a.id)` and resets `cqsLoaded`
4. ✅ `refreshAifForId(a.id)` → fetches updated AIF
5. ✅ CQ count badge updates
6. ✅ Row re-renders

---

## Functional Test Cases

### Test 1: Basic REBUT via AttackMenuProV2
**Scenario**: User attacks an argument's conclusion

- [ ] Open argument list
- [ ] Click "Challenge Argument" button
- [ ] Expand "Rebut" card
- [ ] Click "Select or create a counter-claim..."
- [ ] Select existing claim or create new one
- [ ] Verify "Post Rebuttal" button enables
- [ ] Click "Post Rebuttal"
- [ ] Verify:
  - [ ] Modal closes
  - [ ] Attack count increases (rose badge in row)
  - [ ] `claims:changed` event fired
  - [ ] `arguments:changed` event fired
  - [ ] AIF metadata refreshed

### Test 2: UNDERCUT via AttackMenuProV2
**Scenario**: User provides exception to inference

- [ ] Open argument list
- [ ] Click "Challenge Argument" button
- [ ] Expand "Undercut" card
- [ ] Enter exception text (e.g., "Expert was biased")
- [ ] Verify character counter updates
- [ ] Verify "Post Undercut" button enables when text entered
- [ ] Click "Post Undercut"
- [ ] Verify:
  - [ ] Modal closes
  - [ ] New claim created with exception text
  - [ ] Attack count increases (amber badge)
  - [ ] Events fired
  - [ ] Row refreshes

### Test 3: UNDERMINE via AttackMenuProV2
**Scenario**: User contradicts a premise

- [ ] Open argument list with argument having multiple premises
- [ ] Click "Challenge Argument" button
- [ ] Expand "Undermine" card
- [ ] Select target premise from dropdown
- [ ] Verify premise text displayed
- [ ] Click "Select or create contradicting claim..."
- [ ] Select/create contradicting claim
- [ ] Verify "Post Undermine" button enables
- [ ] Click "Post Undermine"
- [ ] Verify:
  - [ ] Modal closes
  - [ ] Attack count increases (slate badge)
  - [ ] Events fired
  - [ ] Row refreshes

### Test 4: View CQs via SchemeSpecificCQsModal
**Scenario**: User opens CQ modal for an argument

- [ ] Find argument row with scheme badge (e.g., "Expert Opinion")
- [ ] Verify CQ button shows count (e.g., "CQs 0/4")
- [ ] Click CQ button
- [ ] Verify:
  - [ ] Modal opens with gradient background
  - [ ] Scheme name displayed
  - [ ] Progress shows (e.g., "0/4")
  - [ ] All CQs listed as cards
  - [ ] Each CQ shows:
    - [ ] Full question text
    - [ ] Attack type badge (REBUTS/UNDERCUTS/UNDERMINES)
    - [ ] Target scope (conclusion/inference/premise)
    - [ ] Status icon (AlertTriangle if open, CheckCircle2 if answered)
    - [ ] CQ key (e.g., "domain_fit")

### Test 5: Answer CQ as REBUT Objection
**Scenario**: Answer "domain_fit" CQ for Expert Opinion scheme

- [ ] Open CQ modal
- [ ] Find "domain_fit" CQ (should be REBUTS type)
- [ ] Click card to expand
- [ ] Verify:
  - [ ] Objection form appears
  - [ ] Instructions text explains REBUT
  - [ ] Target conclusion displayed
  - [ ] ClaimPicker button present
- [ ] Click ClaimPicker
- [ ] Select counter-claim
- [ ] Verify "Post REBUTS Objection" button enables
- [ ] Click submit
- [ ] Verify:
  - [ ] Loading spinner appears
  - [ ] Modal stays open but form collapses
  - [ ] Events fired
  - [ ] Row refreshes
  - [ ] CQ count updates (e.g., "1/4")
  - [ ] Attack count increases

### Test 6: Answer CQ as UNDERCUT Objection
**Scenario**: Answer "consensus" CQ with exception

- [ ] Open CQ modal
- [ ] Find "consensus" CQ (should be UNDERCUTS type)
- [ ] Click card to expand
- [ ] Verify amber theme (amber gradient, badge, button)
- [ ] Enter exception text (e.g., "Experts disagree on this topic")
- [ ] Verify character counter updates
- [ ] Click "Post UNDERCUTS Objection"
- [ ] Verify:
  - [ ] Claim created from text
  - [ ] Undercut posted
  - [ ] Modal closes
  - [ ] CQ count updates
  - [ ] Attack count increases

### Test 7: Answer CQ as UNDERMINE Objection
**Scenario**: Answer "basis" CQ by undermining a premise

- [ ] Open CQ modal
- [ ] Find "basis" CQ (should be UNDERMINES type)
- [ ] Click card to expand
- [ ] Verify slate theme (slate gradient, badge, button)
- [ ] Select premise from dropdown
- [ ] Select contradicting claim via ClaimPicker
- [ ] Click "Post UNDERMINES Objection"
- [ ] Verify:
  - [ ] Undermine posted
  - [ ] Modal closes
  - [ ] CQ count updates
  - [ ] Attack count increases

### Test 8: Mark CQ as Asked
**Scenario**: User marks CQ as asked without objection

- [ ] Open CQ modal
- [ ] Find unanswered CQ (amber AlertTriangle icon)
- [ ] Click "Mark as asked" link
- [ ] Verify:
  - [ ] CQ status updates to "open"
  - [ ] `askCQ` API called
  - [ ] Local CQ state updates
  - [ ] (Note: This doesn't change satisfied count, just marks it as explicitly asked)

### Test 9: CQ Tab in AttackMenuProV2
**Scenario**: View CQs from AttackMenuProV2

- [ ] Click "Challenge Argument"
- [ ] Click "Critical Questions" tab
- [ ] Verify:
  - [ ] Guide card explains CQs
  - [ ] CriticalQuestionsV2 component renders
  - [ ] Can interact with CQs from here too

### Test 10: CQ Metadata Detection in Attacks
**Scenario**: Verify attacks include CQ metadata when CQs exist

- [ ] Open browser DevTools → Network tab
- [ ] Post a REBUT via AttackMenuProV2
- [ ] Find POST to `/api/ca`
- [ ] Inspect request body
- [ ] Verify `metaJson` includes:
  - [ ] `cqId` (if CQ detected)
  - [ ] `schemeKey` (if scheme known)
  - [ ] `cqText` (if CQ detected)
  - [ ] `cqContext` (if CQ detected)
- [ ] Repeat for SchemeSpecificCQsModal objection
- [ ] Verify `metaJson` includes:
  - [ ] `schemeKey`
  - [ ] `cqKey`
  - [ ] `cqText`
  - [ ] `source` field identifying modal

---

## Edge Cases & Error Handling

### Edge Case 1: Argument Without Scheme
- [ ] Find argument with no scheme badge
- [ ] Verify CQ button does NOT appear
- [ ] Verify AttackMenuProV2 still works

### Edge Case 2: Scheme With No CQs
- [ ] Find argument with scheme that has 0 CQs
- [ ] Click CQ button
- [ ] Verify modal shows "No critical questions" empty state

### Edge Case 3: All CQs Satisfied
- [ ] Answer all CQs for an argument
- [ ] Verify CQ count shows "4/4" (all green)
- [ ] Open modal
- [ ] Verify all cards have green gradient and CheckCircle2 icon

### Edge Case 4: API Failure on Attack Post
- [ ] Simulate API failure (e.g., network offline)
- [ ] Try posting attack
- [ ] Verify:
  - [ ] Alert shows error message
  - [ ] Modal stays open
  - [ ] Form state preserved
  - [ ] User can retry

### Edge Case 5: Rapid-Fire Attacks
- [ ] Post attack
- [ ] Immediately post another attack (before first refresh completes)
- [ ] Verify:
  - [ ] Both attacks succeed
  - [ ] No race conditions
  - [ ] Final state is consistent

### Edge Case 6: Missing Premises
- [ ] Find argument with `meta.premises = []`
- [ ] Open AttackMenuProV2
- [ ] Try to expand Undermine card
- [ ] Verify:
  - [ ] Gracefully handles empty premises list
  - [ ] Shows message or disables form

---

## Performance Checks

### Lazy Loading
- [ ] Open AIFArgumentsListPro
- [ ] Verify AttackMenuProV2 and SchemeSpecificCQsModal are dynamic imports
- [ ] Check bundle size (components should not load until triggered)

### CQ Lazy Fetch
- [ ] Open argument list
- [ ] Verify CQs NOT fetched on initial render
- [ ] Click CQ button
- [ ] Verify `getArgumentCQs` called only on first open
- [ ] Open modal again
- [ ] Verify CQs NOT re-fetched (uses cached state)
- [ ] Post objection
- [ ] Verify `cqsLoaded` reset to force refetch next time

### Row Refresh Efficiency
- [ ] Post attack
- [ ] Verify only the affected row refreshes (not entire list)
- [ ] Check network tab: only `/api/arguments/${id}/aif` called for that row

---

## Accessibility Checks

### Keyboard Navigation
- [ ] Tab through footer buttons
- [ ] Verify focus visible on CQ button
- [ ] Press Enter to open modal
- [ ] Tab through modal elements
- [ ] Press Escape to close modal

### Screen Reader
- [ ] Enable screen reader
- [ ] Navigate to CQ button
- [ ] Verify announces "Critical Questions, 2 of 4 satisfied"
- [ ] Open modal
- [ ] Verify scheme name and CQ text announced
- [ ] Verify attack type badges announced

### Color Contrast
- [ ] Verify all text meets WCAG AA contrast ratio
- [ ] Test with color blindness simulator

---

## Mobile Responsiveness

### Viewport Sizes
- [ ] Test on mobile (375px)
- [ ] Test on tablet (768px)
- [ ] Test on desktop (1440px)
- [ ] Verify:
  - [ ] Modals responsive
  - [ ] Buttons don't overflow
  - [ ] Forms usable on touch

---

## Documentation Updates

### Files Created
- [x] `SchemeSpecificCQsModal.tsx` (650+ lines)
- [x] `COMPONENT_ANALYSIS_LMT_vs_AMP.md` (detailed analysis)
- [x] `INTEGRATION_TEST_CHECKLIST.md` (this file)

### Files Modified
- [x] `AIFArgumentsListPro.tsx`:
  - [x] Added SchemeSpecificCQsModal import
  - [x] Commented out LegalMoveToolbar
  - [x] Removed inline CQ section (~150 lines)
  - [x] Added CQ modal trigger button
  - [x] Cleaned up unused state variables
  - [x] Added loadCQs callback

### Documentation Needed
- [ ] Update AGENTS.md with SchemeSpecificCQsModal usage
- [ ] Add component to V2_COMPONENTS_SUMMARY.md
- [ ] Document CQ metadata schema in API docs

---

## Known Issues / Future Work

### Potential Issues
1. **CQ Satisfaction State**: Current implementation marks CQ as "asked" but satisfaction is tracked separately via `/api/cqs` endpoint. May need alignment.
2. **CQ Refresh Timing**: After posting objection, CQ list might not immediately reflect updated satisfaction until next modal open.
3. **Exception Claims**: UNDERCUT creates a new claim but doesn't explicitly link it as an "exception" in argument assumptions table.

### Future Enhancements
1. **Bulk CQ Actions**: Allow marking multiple CQs at once
2. **CQ Templates**: Pre-filled objection templates per CQ type
3. **CQ History**: Track who asked/answered each CQ and when
4. **Visual CQ Flow**: Diagram showing which CQs are satisfied by which attacks
5. **CQ Recommendations**: AI suggests which CQs are most important to address
6. **Export CQ Report**: Generate PDF/Markdown report of CQ analysis

---

## Sign-Off

### Code Review
- [ ] AttackMenuProV2 integration reviewed
- [ ] SchemeSpecificCQsModal code reviewed
- [ ] AIFArgumentsListPro changes reviewed
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Follows project conventions (double quotes, btnv2 class, etc.)

### Functional Testing
- [ ] All test cases passed
- [ ] Edge cases handled
- [ ] Error handling verified
- [ ] Performance acceptable
- [ ] Accessibility compliant
- [ ] Mobile responsive

### Deployment Readiness
- [ ] Documentation complete
- [ ] Integration tested in staging
- [ ] No breaking changes to existing functionality
- [ ] Events fire correctly
- [ ] Analytics tracking in place (if applicable)

---

**Tested By**: _________________  
**Date**: _________________  
**Environment**: _________________  
**Notes**: _________________________________________________
