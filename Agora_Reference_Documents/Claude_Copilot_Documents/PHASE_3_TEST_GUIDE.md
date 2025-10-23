# Phase 3 Testing Guide

**Date**: 2025-10-21
**Session**: `claude/debug-aif-arguments-011CUKYh7mJ3H5QUXgvvp4sD`
**Fixes**: #1 (CommandCard wiring), #6 (GROUNDS→Arguments)

---

## Overview

Phase 3 completes the dialogical actions feature set:
- **Fix #1**: CommandCard 3×3 grid now displays legal moves
- **Fix #6**: GROUNDS responses create first-class AIF Arguments

**Time**: ~20 minutes
**Prerequisites**: Phase 1 & 2 completed and tested

---

## Test A: CommandCard Grid Display

**Goal**: Verify CommandCard renders and executes moves

### Steps

1. Navigate to any argument in AIFArgumentsListPro
2. Open the LegalMoveToolbar (should show at bottom of argument card)
3. Click the "Grid View" button (top right corner)

**Expected**:
- 3×3 grid appears with action buttons
- Top row: WHY, GROUNDS (if available), CLOSE (if available)
- Mid row: CONCEDE, RETRACT, ACCEPT_ARGUMENT (context-dependent)
- Bottom row: Scaffolds (∀-inst, ∃-witness, Presup?) if detected in WHY label

**Visual Check**:
- Buttons have proper colors:
  - Primary actions (CLOSE, ACCEPT_ARG): indigo border/bg
  - Disabled actions: grayed out with opacity
  - Regular actions: white bg with slate border
- Force indicators show:
  - ⚔️ for ATTACK moves
  - 🏳️ for SURRENDER moves

### 4. Click a WHY button in grid

**Expected**:
- POST to `/api/dialogue/move` succeeds
- Grid refreshes to show new legal moves
- CQStatus row created in database

**Verification**:
```sql
SELECT * FROM "DialogueMove"
WHERE kind = 'WHY'
ORDER BY "createdAt" DESC
LIMIT 1;
```

Should see:
- `kind`: `'WHY'`
- `payload->>'cqId'`: Should have value like `'eo-1'`

### 5. Toggle back to List View

**Expected**:
- Click "List View" button
- Traditional segmented tabs (Challenge/Resolve/More) return
- All moves still available

---

## Test B: Scaffold Template Insertion

**Goal**: Verify scaffold buttons insert templates

### Steps

1. Find an argument with WHY move containing `∀` or `∃` symbols
2. Click "Grid View"
3. Look for scaffold buttons in bottom row:
   - `∀-inst` (forall instantiation)
   - `∃-witness` (exists witness)
   - `Presup?` (presupposition challenge)

### 4. Click a scaffold button

**Expected**:
- Template text inserted into composer/textarea (requires composer integration)
- `mesh:composer:insert` event dispatched
- No API call (client-side only)

**Note**: If composer doesn't respond, check browser console for event:
```js
window.addEventListener('mesh:composer:insert', (e) => {
  console.log('Template:', e.detail.template);
});
```

---

## Test C: GROUNDS Creates Arguments

**Goal**: Verify GROUNDS responses become AIF Arguments

### Steps

1. Create a claim:
   ```
   POST /api/claims
   {
     "deliberationId": "<your-delib-id>",
     "text": "Vaccines are safe and effective",
     "authorId": "<user-id>"
   }
   ```
   Save the claim ID as `<claimId>`.

2. Ask WHY:
   ```
   POST /api/dialogue/move
   {
     "deliberationId": "<delib-id>",
     "targetType": "claim",
     "targetId": "<claimId>",
     "kind": "WHY",
     "payload": {
       "cqId": "default",
       "locusPath": "0",
       "note": "Why should we believe this?"
     }
   }
   ```

3. Supply GROUNDS:
   ```
   POST /api/dialogue/move
   {
     "deliberationId": "<delib-id>",
     "targetType": "claim",
     "targetId": "<claimId>",
     "kind": "GROUNDS",
     "payload": {
       "cqId": "default",
       "locusPath": "0",
       "expression": "Multiple peer-reviewed studies from CDC and WHO confirm vaccine safety across diverse populations over decades."
     }
   }
   ```

**Expected Response**:
```json
{
  "ok": true,
  "move": {
    "id": "...",
    "kind": "GROUNDS",
    "payload": {
      "cqId": "default",
      "expression": "Multiple peer-reviewed...",
      "createdArgumentId": "arg_xyz123"  // ← NEW!
    }
  }
}
```

### 4. Verify Argument was created

**Database check**:
```sql
SELECT id, text, "conclusionClaimId", "schemeId", "authorId"
FROM "Argument"
WHERE "conclusionClaimId" = '<claimId>'
ORDER BY "createdAt" DESC
LIMIT 1;
```

**Expected**:
- `text`: `"Multiple peer-reviewed studies..."`
- `conclusionClaimId`: `<claimId>`
- `authorId`: Current user ID
- `schemeId`: May be null (unless scheme inference kicks in)

### 5. Check argument appears in UI

Navigate to AIFArgumentsListPro and search for the claim.

**Expected**:
- New argument card appears
- Card shows the GROUNDS text as argument text
- Conclusion links to original claim
- Can click "Counter" to attack the GROUNDS argument

---

## Test D: GROUNDS Argument Threshold

**Goal**: Verify short GROUNDS don't create arguments

### Steps

1. Supply very short GROUNDS:
   ```
   POST /api/dialogue/move
   {
     "deliberationId": "<delib-id>",
     "targetType": "claim",
     "targetId": "<claimId>",
     "kind": "GROUNDS",
     "payload": {
       "cqId": "eo-1",
       "expression": "Yes"  // Only 3 chars
     }
   }
   ```

**Expected**:
- Move succeeds
- CQStatus updated to `satisfied: true`
- **No** Argument created (because `groundsText.length > 5` check fails)
- Response does NOT contain `createdArgumentId`

**Verification**:
```sql
SELECT COUNT(*) FROM "Argument" WHERE text = 'Yes';
-- Should return 0
```

---

## Test E: CommandCard Disabled States

**Goal**: Verify disabled moves show with reasons

### Steps

1. Find a context where some moves are illegal (e.g., CLOSE before all CQs satisfied)
2. Click "Grid View"

**Expected**:
- Disabled buttons render with:
  - Reduced opacity (`opacity-40`)
  - Gray background (`bg-slate-50`)
  - Cursor not-allowed
  - Tooltip showing `reason` (hover over button)

### 3. Try clicking disabled button

**Expected**:
- Nothing happens (no API call)
- Button stays disabled

---

## Test F: End-to-End Dialogue Flow

**Goal**: Complete full dialogue using CommandCard

### Scenario: Expert Opinion Debate

1. **Create Argument** with ExpertOpinion scheme:
   ```
   POST /api/arguments
   {
     "deliberationId": "<delib-id>",
     "text": "Dr. Fauci says masks work",
     "conclusionClaimId": "<masks-work-claim-id>",
     "schemeId": "<expert-opinion-scheme-id>"
   }
   ```

2. **Ask WHY** via CommandCard (Grid View):
   - Click WHY button for CQ `eo-1` (expert credibility)
   - Verify CQStatus created

3. **Supply GROUNDS** via CommandCard:
   - Click GROUNDS button
   - Enter: "Dr. Fauci has 40 years experience in infectious diseases and led NIAID"
   - Submit
   - **Verify**: New Argument created linking to claim

4. **Counter the GROUNDS** argument:
   - Find the GROUNDS argument in list
   - Click "Counter" → REBUTS
   - Create objection claim: "Fauci has conflicts of interest"
   - **Verify**: ConflictApplication created

5. **Close** the dialogue:
   - If all CQs satisfied, CLOSE button should be enabled
   - Click CLOSE (†) in grid
   - **Verify**: DialogueMove with `kind: 'CLOSE'` created

---

## Troubleshooting

### CommandCard doesn't appear
- **Check**: Grid View button present in LegalMoveToolbar?
- **Fix**: Verify LegalMoveToolbar.tsx imports updated
- **Console**: Any React errors?

### Scaffold buttons missing
- **Check**: WHY move label contains `∀`, `∃`, or "presupposition"?
- **Fix**: Add symbols to WHY label via legal-moves logic

### GROUNDS argument not created
- **Check**:
  - Is `groundsText.length > 5`?
  - Is `targetType === 'claim'`? (currently only creates for claims, not arguments)
- **Console**: Check logs for `[createArgumentFromGrounds]` messages
- **Database**: Query DialogueMove to see `payload.createdArgumentId`

### Grid actions don't execute
- **Check**: Browser console for errors
- **Network Tab**: Verify POST to `/api/dialogue/move` happens
- **Response**: Check for 400/409 errors (move illegal)

---

## Success Criteria

✅ **Fix #1 (CommandCard)**:
- Grid View toggle works
- 3×3 grid renders with proper styling
- Buttons execute moves via `performCommand`
- Scaffold buttons dispatch events
- Disabled states show reason tooltips

✅ **Fix #6 (GROUNDS→Arguments)**:
- GROUNDS with >5 chars create Arguments
- `createdArgumentId` in response payload
- Arguments appear in AIFArgumentsListPro
- Arguments can be attacked/defended
- Short GROUNDS (<5 chars) skip argument creation

---

## Performance Notes

### Expected Latencies
- CommandCard render: <100ms
- performCommand (WHY/GROUNDS): 200-500ms
- Argument creation from GROUNDS: +50ms overhead

### Database Impact
- Each GROUNDS move may create:
  - 1 DialogueMove row
  - 1 Argument row (if >5 chars)
  - 1+ CQStatus update

Monitor for N+1 queries if creating many GROUNDS in sequence.

---

## Next Steps

After Phase 3 testing succeeds:

1. **End-to-End Integration Test**: Complete full dialogue flow (WHY → GROUNDS → Attack → CLOSE)
2. **Performance Testing**: Test with 50+ arguments, verify grid renders quickly
3. **Edge Cases**:
   - GROUNDS targeting arguments (not just claims)
   - Multi-CQ schemes (ExpertOpinion has 5 CQs)
   - Concurrent GROUNDS from multiple users
4. **Documentation**: Update user guide with CommandCard shortcuts

---

## Rollback Plan

If Phase 3 fails:

### Rollback Fix #1:
```bash
git revert <commit-hash-fix-1>
```
- Removes CommandCard integration
- LegalMoveToolbar reverts to list-only view

### Rollback Fix #6:
```bash
git revert <commit-hash-fix-6>
```
- GROUNDS no longer create Arguments
- DialogueMove still created (no data loss)

**Risk**: Low - both fixes are additive, no schema changes

---

**Document Version**: 1.0
**Last Updated**: 2025-10-21
