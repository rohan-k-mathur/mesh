# CriticalQuestions Component - Integration Testing Guide

## Pre-Testing Setup

### 1. Environment Check
```bash
# Ensure dependencies are installed
yarn install

# Verify TypeScript compilation
npx tsc --noEmit

# Check for linting errors
npm run lint
```

### 2. Database Setup
Ensure your database has the following tables with proper schema:
- `CQStatus` - Critical question status tracking
- `DialogicalMove` - Dialogue moves
- `ArgumentScheme` - Scheme definitions with CQ JSON
- `ClaimEdge` - Claim graph edges
- `SchemeInstance` - Scheme applications to claims
- `ConflictApplication` - Conflict tracking

### 3. API Endpoints Verification
Test these endpoints are accessible:
```bash
# CQ data
curl http://localhost:3000/api/cqs?targetType=claim&targetId=YOUR_CLAIM_ID

# Attachments
curl http://localhost:3000/api/cqs/attachments?targetType=claim&targetId=YOUR_CLAIM_ID

# Dialogical moves
curl http://localhost:3000/api/deliberations/YOUR_DELIB_ID/moves?limit=500

# Edges
curl http://localhost:3000/api/claims/edges?deliberationId=YOUR_DELIB_ID

# Legal moves
curl http://localhost:3000/api/dialogue/legal-moves?deliberationId=YOUR_DELIB_ID&targetType=claim&targetId=YOUR_CLAIM_ID&locusPath=0
```

## Testing Workflow

### Test 1: Basic CQ Display
**Objective**: Verify CQs load and display correctly

1. Open a claim with an argument that uses a scheme (e.g., Argument from Expert Opinion)
2. The CriticalQuestions component should show:
   - Scheme title (e.g., "Argument from Expert Opinion")
   - List of CQs from the scheme's `cq` JSON field
   - Checkboxes for each CQ (unchecked initially)
   - "Locus" input field
   - Action buttons

**Expected Result**:
- CQs display without errors
- Checkboxes are disabled (no attachments yet)
- Error message: "(add)" or "Needs a rebut/undercut attached"

### Test 2: WHY Move Posting
**Objective**: Verify WHY moves include proper `cqId`

1. Click "Show Moves" button on a CQ row
2. Legal moves panel should expand
3. Look for a "WHY" or "CHALLENGE" chip
4. Click the WHY chip
5. Check browser console for the request payload

**Expected Payload**:
```json
{
  "deliberationId": "delib_xxx",
  "targetType": "claim",
  "targetId": "claim_xxx",
  "kind": "WHY",
  "payload": {
    "locusPath": "0",
    "schemeKey": "argument_from_expert_opinion",
    "cqId": "E1"  // ✅ Must be present
  },
  "autoCompile": true,
  "autoStep": true
}
```

**Verification**:
```sql
-- Check DialogicalMove table
SELECT id, kind, payload FROM "DialogicalMove"
WHERE "targetId" = 'YOUR_CLAIM_ID'
  AND kind = 'WHY'
ORDER BY "createdAt" DESC LIMIT 1;

-- Payload should contain cqId
```

### Test 3: GROUNDS Response
**Objective**: Verify GROUNDS pairs with WHY via `cqId`

1. After posting WHY (Test 2), refresh the page
2. Legal moves should now show "Answer E1" (or similar)
3. Click "Answer E1" chip
4. A prompt appears - enter grounds text
5. Submit the grounds

**Expected Payload**:
```json
{
  "deliberationId": "delib_xxx",
  "targetType": "claim",
  "targetId": "claim_xxx",
  "kind": "GROUNDS",
  "payload": {
    "schemeKey": "argument_from_expert_opinion",
    "cqId": "E1",  // ✅ Matches WHY
    "locusPath": "0",
    "expression": "Dr. Smith has published 50+ papers in this field",
    "original": "Dr. Smith has published 50+ papers in this field"
  },
  "autoCompile": true,
  "autoStep": true
}
```

**Verification**:
```sql
-- Both WHY and GROUNDS should exist with same cqId
SELECT id, kind, payload->>'cqId' as cq_id, payload->>'expression' as content
FROM "DialogicalMove"
WHERE "targetId" = 'YOUR_CLAIM_ID'
  AND kind IN ('WHY', 'GROUNDS')
ORDER BY "createdAt" DESC LIMIT 5;
```

### Test 4: Inline Grounds Input
**Objective**: Verify quick grounds submission

1. Find an unsatisfied CQ
2. In the inline input field, type grounds text
3. Press Enter (or click "Post grounds" button)
4. Observe the UI:
   - Input should clear
   - Green checkmark (✓) should appear briefly
   - Checkbox might become enabled (if attachment exists)

**Expected Behavior**:
- Grounds posted via `/api/dialogue/move`
- CQ optionally marked satisfied if `alsoMark=true`
- Cache revalidates automatically
- UI shows success indicator

### Test 5: CQ Toggle with Guards
**Objective**: Verify 409 conflict when toggling without attachment

1. Find an unsatisfied CQ (checkbox unchecked and disabled)
2. Try to check the checkbox
3. Request should return 409 Conflict
4. Error message should appear: "Needs a rebut/undercut attached"

**Expected Response**:
```json
{
  "ok": false,
  "blocked": true,
  "code": "CQ_PROOF_OBLIGATION_NOT_MET",
  "message": "This CQ can only be marked addressed after...",
  "guard": {
    "requiredAttack": "rebut",
    "hasEdge": false,
    "nliRelation": null,
    "nliScore": null,
    "nliThreshold": 0.72
  }
}
```

**Verification**: Blocked message displays in UI

### Test 6: Attach Counter-Claim
**Objective**: Create and attach a counter-claim

1. Click "Attach" button on a CQ with a rebut suggestion
2. Dialog opens: "Add a counter-claim"
3. Enter counter-claim text (e.g., "The expert's field is unrelated")
4. Click "Create & Attach"
5. Wait for success

**Expected Behavior**:
- POST `/api/claims/quick-create` creates new claim
- POST `/api/cqs/toggle` with `attachSuggestion=true` links it
- ClaimEdge or GraphEdge created
- Checkbox becomes enabled
- User can now toggle CQ satisfied

**Verification**:
```sql
-- Check ClaimEdge for rebut
SELECT * FROM "ClaimEdge"
WHERE "toClaimId" = 'YOUR_TARGET_CLAIM_ID'
  AND type = 'rebuts'
ORDER BY "createdAt" DESC LIMIT 1;

-- Check CQStatus can now be satisfied
SELECT * FROM "CQStatus"
WHERE "targetId" = 'YOUR_CLAIM_ID'
  AND "cqKey" = 'E1';
```

### Test 7: Locus Control
**Objective**: Verify locus path updates move payloads

1. Change locus input from "0" to "0.1"
2. Post a WHY move
3. Check move payload includes `locusPath: "0.1"`

**Expected Payload**:
```json
{
  "payload": {
    "locusPath": "0.1",  // ✅ User-specified locus
    "cqId": "E1"
  }
}
```

### Test 8: Event-Driven Cache Updates
**Objective**: Verify bus events trigger revalidation

1. Open browser DevTools → Console
2. Add event listener:
```javascript
window.addEventListener('dialogue:moves:refresh', (e) => console.log('Event fired:', e));
```
3. Post a WHY or GROUNDS move
4. Observe console log
5. Component should automatically refetch data

**Expected Behavior**:
- Event fires after move submission
- SWR mutate functions called
- UI updates without page refresh
- CQ list, legal moves, attachments all refresh

### Test 9: Legal Moves Panel
**Objective**: Verify all legal moves display correctly

1. Click "Show Moves" on a CQ
2. Panel expands with move chips
3. Depending on state, should see:
   - **WHY** (if no open WHY for this CQ)
   - **Answer E1** (if open WHY exists)
   - **CONCEDE** (surrender option)
   - **RETRACT** (retract claim)
   - **Close (†)** (if locus is closable)
   - **THEREFORE/SUPPOSE/DISCHARGE** (structural moves)

**Expected Behavior**:
- Disabled moves show reason tooltip
- Clicking move posts to `/api/dialogue/move`
- Success toast appears
- Legal moves refresh after posting

### Test 10: Panel Confirmation
**Objective**: Verify epistemic receipt creation

1. Click "Confirm (panel)" button
2. Request posts to `/api/dialogue/panel/confirm`
3. Creates receipt with current CQ/AF state

**Expected Payload**:
```json
{
  "deliberationId": "delib_xxx",
  "kind": "epistemic",
  "subject": { "type": "claim", "id": "claim_xxx" },
  "rationale": "CQ satisfied, AF=IN",
  "inputs": {
    "cq": { /* CQ summary */ },
    "af": { /* AF labels */ }
  }
}
```

## Performance Testing

### Test 11: Cache Deduplication
**Objective**: Verify SWR doesn't spam requests

1. Open Network tab in DevTools
2. Click "Show Moves" multiple times rapidly
3. Observe network requests

**Expected Behavior**:
- First click fetches legal moves
- Subsequent clicks within 2s use cached data
- No duplicate requests for same endpoint

### Test 12: Optimistic Updates
**Objective**: Verify instant UI feedback

1. Toggle a CQ checkbox (if enabled)
2. Observe UI updates immediately (before server response)
3. If server rejects (409), checkbox reverts
4. If server accepts, checkbox stays checked

**Expected Behavior**:
- Checkbox state updates instantly
- Spinner or loading indicator optional
- On 409, optimistic update reverts
- Error message displays

## Integration with ClaimMiniMap

### Test 13: Cross-Component Communication
**Objective**: Verify CriticalQuestions integrates with ClaimMiniMap

1. Open a deliberation with ClaimMiniMap visible
2. Post a WHY move from CriticalQuestions
3. ClaimMiniMap should update automatically
4. CQ badge should increment

**Expected Behavior**:
- Both components listen to same events
- Cache keys don't conflict
- UI updates propagate across components

## Error Handling

### Test 14: API Failures
**Objective**: Verify graceful degradation

1. Stop API server or block network
2. Component should show:
   - "Failed to load CQs" (if initial load fails)
   - Error toast (if move posting fails)
   - Stale data from cache (if revalidation fails)

**Expected Behavior**:
- No crashes or blank screens
- Clear error messages
- Retry button or auto-retry on network restore

### Test 15: Malformed Data
**Objective**: Verify schema validation

1. Manually corrupt `ArgumentScheme.cq` JSON in database
2. Component should:
   - Skip invalid CQs (Zod validation)
   - Log warning to console
   - Continue displaying valid CQs

**Expected Behavior**:
- Zod schema catches malformed data
- Component doesn't crash
- Only valid CQs render

## Browser Compatibility

### Test 16: Cross-Browser
**Objective**: Verify component works in all browsers

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

**Expected Behavior**:
- All features work consistently
- No layout breaks
- Event listeners fire correctly

## Accessibility

### Test 17: Keyboard Navigation
**Objective**: Verify keyboard-only usage

1. Tab through CQ list
2. Press Space to toggle checkboxes
3. Press Enter to submit grounds input
4. Tab to buttons and activate with Enter/Space

**Expected Behavior**:
- All interactive elements focusable
- Focus indicators visible
- No keyboard traps

### Test 18: Screen Reader
**Objective**: Verify screen reader compatibility

1. Use NVDA/JAWS (Windows) or VoiceOver (Mac)
2. Navigate CQ list
3. Hear CQ text, status, and button labels

**Expected Behavior**:
- Checkboxes announce state (checked/unchecked/disabled)
- Buttons have clear labels
- Error messages announced

## Production Readiness

### Final Checklist
- [ ] All 18 tests pass
- [ ] No TypeScript errors
- [ ] No lint warnings
- [ ] No console errors in production build
- [ ] Bundle size acceptable (<100KB added)
- [ ] Performance metrics acceptable (no >500ms renders)
- [ ] Sentry/logging configured for errors
- [ ] Documentation updated (README, Storybook, etc.)

## Rollback Plan

If issues arise in production:

1. **Immediate**: Revert import to old component
```tsx
// Temporary rollback
import CriticalQuestions from "@/components/claims/CriticalQuestions.OLD";
```

2. **Short-term**: Feature flag
```tsx
const useNewCQComponent = useFeatureFlag('new-cq-component');
return useNewCQComponent ? <CriticalQuestionsV2 /> : <CriticalQuestions />;
```

3. **Long-term**: Fix bugs and re-deploy

## Success Criteria

The component is ready for production when:
- ✅ All moves include proper `cqId` in payload
- ✅ Legal moves display and function correctly
- ✅ Bus events trigger cache updates
- ✅ Guard system blocks invalid CQ toggles
- ✅ Attachments link correctly via metadata
- ✅ UI is responsive and accessible
- ✅ No regressions in existing functionality
- ✅ Performance is acceptable (<3s page load)

---

**Questions?** Check `CRITICAL_QUESTIONS_UPGRADE_SUMMARY.md` for details.
