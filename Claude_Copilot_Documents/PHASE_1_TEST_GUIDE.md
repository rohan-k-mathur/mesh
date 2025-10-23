# Phase 1 Testing Guide - AIF Dialogical Actions

**Date**: 2025-10-21
**Branch**: `claude/debug-aif-arguments-011CUKYh7mJ3H5QUXgvvp4sD`
**Fixes**: #4 (Duplicate POST), #2 (CQ Key Standardization)

---

## Quick Test Checklist

- [ ] **Test 1**: WHY without cqId returns 400 error
- [ ] **Test 2**: WHY with cqId succeeds
- [ ] **Test 3**: GROUNDS without cqId returns 400 error
- [ ] **Test 4**: GROUNDS with cqId succeeds
- [ ] **Test 5**: UNDERCUT creation completes without duplicate POST
- [ ] **Test 6**: Console logs warnings for malformed moves
- [ ] **Test 7**: CQStatus uses cqKey field correctly

---

## Detailed Test Procedures

### Test 1: WHY Requires cqId ✅

**Endpoint**: `POST /api/dialogue/move`

**Request** (should FAIL):
```json
{
  "deliberationId": "<your-deliberation-id>",
  "targetType": "claim",
  "targetId": "<your-claim-id>",
  "kind": "WHY",
  "payload": {
    "locusPath": "0"
    // ❌ Missing cqId
  }
}
```

**Expected Response**: `400 Bad Request`
```json
{
  "error": "cqId required for WHY/GROUNDS moves",
  "received": { "locusPath": "0" },
  "hint": "Include payload.cqId (e.g., \"eo-1\") to specify which critical question this addresses"
}
```

---

### Test 2: WHY With cqId Succeeds ✅

**Request** (should SUCCEED):
```json
{
  "deliberationId": "<your-deliberation-id>",
  "targetType": "claim",
  "targetId": "<your-claim-id>",
  "kind": "WHY",
  "payload": {
    "locusPath": "0",
    "cqId": "eo-1"  // ✅ Valid CQ key
  }
}
```

**Expected Response**: `200 OK`
```json
{
  "ok": true,
  "move": {
    "id": "move_...",
    "kind": "WHY",
    "payload": {
      "cqId": "eo-1",
      "locusPath": "0"
    }
  }
}
```

**Verify in Database**:
```sql
SELECT id, kind, payload->>'cqId' as cq_id, payload->>'locusPath' as locus
FROM "DialogueMove"
WHERE kind = 'WHY' AND id = '<move-id>';
```

Should show:
```
id         | kind | cq_id | locus
-----------|------|-------|------
move_xyz   | WHY  | eo-1  | 0
```

---

### Test 3: GROUNDS Requires cqId ✅

**Request** (should FAIL):
```json
{
  "deliberationId": "<your-deliberation-id>",
  "targetType": "claim",
  "targetId": "<your-claim-id>",
  "kind": "GROUNDS",
  "payload": {
    "expression": "Because the expert has 20 years experience"
    // ❌ Missing cqId
  }
}
```

**Expected Response**: `400 Bad Request`

---

### Test 4: GROUNDS With cqId Succeeds ✅

**Request** (should SUCCEED):
```json
{
  "deliberationId": "<your-deliberation-id>",
  "targetType": "claim",
  "targetId": "<your-claim-id>",
  "kind": "GROUNDS",
  "payload": {
    "cqId": "eo-1",
    "expression": "The expert has 20 years experience in virology",
    "locusPath": "0"
  }
}
```

**Expected Response**: `200 OK`

**Verify CQStatus Updated**:
```sql
SELECT * FROM "CQStatus"
WHERE "targetId" = '<claim-id>' AND "cqKey" = 'eo-1';
```

Should show:
```
cqKey | status   | satisfied
------|----------|----------
eo-1  | answered | true
```

---

### Test 5: UNDERCUT No Duplicate POST ✅

**Setup**: Create an argument with a scheme

**UI Action**:
1. Open AttackMenuPro for the argument
2. Enter undercut text: "The expert's opinion was given before key evidence emerged"
3. Click "Post Undercut"

**Check Browser Console**:
- Should see **ONE** POST to `/api/arguments/{id}/assumptions`
- Should NOT see TWO POSTs to the same endpoint

**Check Network Tab**:
```
POST /api/ca                                    ← Create conflict assertion
POST /api/arguments/{arg-id}/assumptions        ← Bind exception (ONCE, not twice!)
```

**Verify in Database**:
```sql
SELECT COUNT(*) FROM "ArgumentAssumption"
WHERE "argumentId" = '<arg-id>'
  AND "role" = 'exception'
  AND "assumptionClaimId" = '<exception-claim-id>';
```

Should return: **1** (not 2)

---

### Test 6: Console Warning Logs ✅

**Action**: Try to fetch legal moves for an argument with old WHY/GROUNDS moves that have `schemeKey` instead of `cqId`

**Expected Console Output**:
```
[legal-moves] Move missing cqId, skipping: { id: 'move_abc', kind: 'WHY', payload: { schemeKey: 'ExpertOpinion' } }
```

**Where to Check**:
- Browser console (client-side)
- Server logs / terminal where Next.js is running (server-side)

---

### Test 7: Legal Moves Filters Correctly ✅

**Action**:
1. Ask WHY on a claim with `cqId: 'eo-1'`
2. Fetch legal moves: `GET /api/dialogue/legal-moves?deliberationId=...&targetType=claim&targetId=...`

**Expected Response**:
```json
{
  "ok": true,
  "moves": [
    {
      "kind": "GROUNDS",
      "label": "Answer eo-1",  // ✅ Shows specific CQ, not generic "default"
      "payload": {
        "cqId": "eo-1",
        "locusPath": "0"
      },
      "force": "ATTACK"
    }
  ]
}
```

**Verify**: Label shows **"Answer eo-1"**, not ~~"Answer default"~~ or ~~"Answer ExpertOpinion"~~

---

## UI Testing

### Via CriticalQuestions Component

1. **Open a claim with arguments** using ExpertOpinion scheme
2. **Click "Ask WHY" on CQ** `eo-1` ("Is the expert credible?")
3. **Verify network request** includes `payload: { cqId: 'eo-1' }`
4. **Supply GROUNDS** via inline input: "The expert has published 50 peer-reviewed papers"
5. **Verify**:
   - CQStatus updated to satisfied
   - No 400 errors
   - CQ checkbox becomes enabled

---

## Regression Tests

### Old Moves Still Work (Gracefully Degrade)

If you have existing WHY/GROUNDS moves with only `schemeKey`:

**Query**:
```sql
SELECT id, kind, payload->>'cqId', payload->>'schemeKey'
FROM "DialogueMove"
WHERE kind IN ('WHY', 'GROUNDS')
  AND payload->>'cqId' IS NULL
  AND payload->>'schemeKey' IS NOT NULL;
```

**Expected Behavior**:
- These moves are **skipped** by legal-moves API (with warning)
- Console logs warnings: `[legal-moves] Move missing cqId, skipping...`
- No crashes, no 500 errors
- System continues to function

---

## Performance Tests

### No N+1 Queries

**Setup**: Create 10 WHY moves with different cqIds
**Action**: Fetch legal-moves
**Check**: SQL query logs should show **1 query** to fetch DialogueMoves, not 10

---

## Success Criteria

✅ All 7 tests pass
✅ No duplicate POSTs in network tab
✅ Console warnings appear for malformed moves
✅ No 500 errors
✅ CQStatus table uses `cqKey` field correctly
✅ Legal moves labels show specific CQs

---

## Rollback Instructions

If Phase 1 causes issues:

```bash
git revert ccdba5a  # Revert Phase 1 commit
git push -f origin claude/debug-aif-arguments-011CUKYh7mJ3H5QUXgvvp4sD
```

Or cherry-pick individual fixes:
- Revert #4 only: Restore AttackMenuPro.tsx lines 244-252
- Revert #2 only: Restore `cqId ?? schemeKey ?? 'default'` pattern

---

## Known Limitations

- **Old moves** with only `schemeKey` are skipped (not migrated)
- **No automatic backfill** - manual migration script needed if you want to preserve old moves
- **Breaking change** - New moves MUST include `cqId` (this is intentional)

---

## Next Steps After Phase 1

Once all tests pass:
- [ ] Document any test failures as GitHub issues
- [ ] Run optional migration script for old moves (if desired)
- [ ] Proceed to **Phase 2** (Fixes #3, #7, #5)

---

**Test Results**: _Record your findings here_

| Test | Status | Notes |
|------|--------|-------|
| Test 1 | ⬜ Pass / ⬜ Fail | |
| Test 2 | ⬜ Pass / ⬜ Fail | |
| Test 3 | ⬜ Pass / ⬜ Fail | |
| Test 4 | ⬜ Pass / ⬜ Fail | |
| Test 5 | ⬜ Pass / ⬜ Fail | |
| Test 6 | ⬜ Pass / ⬜ Fail | |
| Test 7 | ⬜ Pass / ⬜ Fail | |

---

**Tested By**: _________________
**Date**: _________________
**Build Version**: `ccdba5a`
