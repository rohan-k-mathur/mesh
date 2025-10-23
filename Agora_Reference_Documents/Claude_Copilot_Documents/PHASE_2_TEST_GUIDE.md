# Phase 2 Testing Guide - AIF Dialogical Actions

**Date**: 2025-10-21
**Branch**: `claude/debug-aif-arguments-011CUKYh7mJ3H5QUXgvvp4sD`
**Fixes**: #3 (Attack→CQ Linking), #7 (Loading States), #5 (Default Schemes)

---

## Quick Test Checklist

- [ ] **Test 1**: Attack from CQ panel records metaJson
- [ ] **Test 2**: CQ checkbox auto-enables after attack
- [ ] **Test 3**: Loading spinner shows during metadata refresh
- [ ] **Test 4**: New arguments auto-assign schemes
- [ ] **Test 5**: Scheme inference matches expected patterns
- [ ] **Test 6**: /api/cqs/attachments returns per-CQ linkages
- [ ] **Test 7**: Database migration applies successfully

---

## Database Migration (Run First!)

Before testing, apply the migration:

```sql
-- Run this SQL or use your migration runner
\i database/migrations/20251021_add_metajson_to_conflict_application.sql
```

**Or via psql**:
```bash
psql $DATABASE_URL -f database/migrations/20251021_add_metajson_to_conflict_application.sql
```

**Verify**:
```sql
\d "ConflictApplication"
-- Should show: metaJson | jsonb | default '{}'::jsonb
```

---

## Test 1: Attack Records CQ Context ✅

**Setup**: Create argument with ExpertOpinion scheme

**Steps**:
1. Open AIFArgumentsListPro
2. Find argument with scheme and CQs
3. Click the dropdown on a CQ row (e.g., "Is expert credible?")
4. Create a REBUTS attack

**Expected Network Request** (check DevTools):
```json
POST /api/ca
{
  "deliberationId": "...",
  "conflictingClaimId": "...",
  "conflictedClaimId": "...",
  "legacyAttackType": "REBUTS",
  "legacyTargetScope": "conclusion",
  "metaJson": {
    "schemeKey": "ExpertOpinion",
    "cqKey": "eo-1",
    "source": "cq-inline-objection-rebut"
  }
}
```

**Verify in Database**:
```sql
SELECT id, "metaJson"
FROM "ConflictApplication"
WHERE "conflictedClaimId" = '<your-claim-id>'
ORDER BY "createdAt" DESC
LIMIT 1;
```

Should show:
```
metaJson: {"cqKey": "eo-1", "source": "cq-inline-objection-rebut", "schemeKey": "ExpertOpinion"}
```

---

## Test 2: CQ Checkbox Auto-Enables ✅

**Continuation from Test 1**:

**Steps**:
1. After creating attack, refresh the CQ panel
2. **OR** use CriticalQuestions component directly

**Expected**:
- CQ checkbox for "eo-1" should be **enabled** (not grayed out)
- Tooltip should not say "(add)" anymore
- Can now mark CQ as satisfied

**API Check**:
```bash
curl "http://localhost:3000/api/cqs/attachments?targetType=claim&targetId=<claim-id>"
```

**Expected Response**:
```json
{
  "attached": {
    "ExpertOpinion:eo-1": true,
    "__ANY__": true
  }
}
```

**UI Verification**:
```typescript
// In CriticalQuestions.tsx, this should now return true:
canMarkAddressed(sig, cq.satisfied)
// Where sig = "ExpertOpinion:eo-1"
```

---

## Test 3: Loading Spinner Shows ✅

**Setup**: AIFArgumentsListPro with at least one argument

**Steps**:
1. Click "Counter" button on an argument
2. Create an attack (REBUTS/UNDERCUTS/UNDERMINES)
3. **Watch the argument card during refresh**

**Expected**:
- ✅ Spinner overlay appears immediately after attack posted
- ✅ Spinner shows for ~200-500ms
- ✅ Card content is slightly blurred behind spinner
- ✅ Spinner disappears when metadata loads
- ✅ Updated attack counts appear

**Visual Check**:
- Spinner should be indigo (`border-indigo-600`)
- Overlay should have `bg-white/60 backdrop-blur-sm`
- Spinner should be centered in the card

**Browser DevTools**:
```javascript
// Check state during refresh:
const [refreshing, setRefreshing] = useState(new Set());
// Should see argument ID in this Set during refresh
```

---

## Test 4: New Arguments Auto-Assign Schemes ✅

**Setup**: Create a new argument without specifying scheme

**API Request**:
```json
POST /api/arguments
{
  "deliberationId": "...",
  "authorId": "...",
  "conclusionClaimId": "...",
  "premiseClaimIds": ["..."],
  "text": "Dr. Smith, a renowned virologist, states that vaccines are safe."
  // NOTE: No schemeId provided!
}
```

**Expected Response**:
```json
{
  "ok": true,
  "id": "arg_xyz",
  "schemeId": "<ExpertOpinion scheme ID>"  // ← Auto-assigned!
}
```

**Verify in Database**:
```sql
SELECT id, text, "schemeId"
FROM "Argument"
WHERE id = 'arg_xyz';
```

Should show:
```
schemeId: <non-null ID pointing to ExpertOpinion scheme>
```

**Check Console Logs**:
```
[schemeInference] Assigned scheme "ExpertOpinion" to argument with text: "Dr. Smith, a renowned virologist, states that..."
```

---

## Test 5: Scheme Inference Patterns ✅

Test different text patterns to verify inference logic:

### Pattern 1: Expert Opinion
**Text**: "According to Dr. Jones, a peer-reviewed study shows..."
**Expected Scheme**: `ExpertOpinion`

### Pattern 2: Consequences
**Text**: "This policy will reduce crime and improve public safety"
**Expected Scheme**: `Consequences`

### Pattern 3: Analogy
**Text**: "This situation is similar to the 2008 financial crisis"
**Expected Scheme**: `Analogy`

### Pattern 4: Sign
**Text**: "The symptom is a reliable indicator of the disease"
**Expected Scheme**: `Sign`

### Pattern 5: Fallback
**Text**: "Generic argument with no specific keywords"
**Expected Scheme**: `Consequences` (default fallback)

**Test via API**:
```bash
# Create arguments with each pattern
for text in "..." "..." "..." "..." "..."; do
  curl -X POST http://localhost:3000/api/arguments \
    -H "Content-Type: application/json" \
    -d "{\"text\": \"$text\", ...}"
done
```

**Verify**:
```sql
SELECT text, "schemeId", s.key as scheme_key
FROM "Argument" a
LEFT JOIN "ArgumentationScheme" s ON a."schemeId" = s.id
WHERE a."createdAt" > NOW() - INTERVAL '5 minutes'
ORDER BY a."createdAt" DESC;
```

---

## Test 6: Attachments API Returns Per-CQ Data ✅

**Setup**: Create multiple attacks for different CQs on the same argument

**Steps**:
1. Create argument with ExpertOpinion scheme (has 5 CQs: eo-1 through eo-5)
2. Create REBUTS attack for eo-1 (expert credibility)
3. Create UNDERCUTS attack for eo-2 (expert bias)
4. Fetch attachments

**API Call**:
```bash
curl "http://localhost:3000/api/cqs/attachments?targetType=claim&targetId=<claim-id>"
```

**Expected Response**:
```json
{
  "attached": {
    "ExpertOpinion:eo-1": true,  // ← Specific CQ #1
    "ExpertOpinion:eo-2": true,  // ← Specific CQ #2
    "__ANY__": true              // ← Fallback
  }
}
```

**Verify CriticalQuestions Component**:
- eo-1 checkbox: **enabled**
- eo-2 checkbox: **enabled**
- eo-3 checkbox: **disabled** (no attack yet)
- eo-4 checkbox: **disabled**
- eo-5 checkbox: **disabled**

---

## Test 7: Multiple Attack Types with metaJson ✅

Test all three attack types record CQ context:

### REBUTS (Conclusion Attack)
**Action**: Click CQ dropdown → Pick counter-claim → Post rebuttal
**Expected metaJson**:
```json
{
  "schemeKey": "ExpertOpinion",
  "cqKey": "eo-1",
  "source": "cq-inline-objection-rebut"
}
```

### UNDERCUTS (Inference Attack)
**Action**: Click CQ dropdown → Enter exception text → Post undercut
**Expected metaJson**:
```json
{
  "schemeKey": "ExpertOpinion",
  "cqKey": "eo-2",
  "source": "cq-inline-objection-undercut"
}
```

### UNDERMINES (Premise Attack)
**Action**: Click CQ dropdown → Select premise → Pick contradicting claim → Post undermine
**Expected metaJson**:
```json
{
  "schemeKey": "ExpertOpinion",
  "cqKey": "eo-3",
  "source": "cq-inline-objection-undermine"
}
```

**Verify All**:
```sql
SELECT
  "legacyAttackType",
  "metaJson"->>'source' as source,
  "metaJson"->>'cqKey' as cq_key
FROM "ConflictApplication"
WHERE "deliberationId" = '<your-delib-id>'
ORDER BY "createdAt" DESC
LIMIT 10;
```

---

## Integration Tests

### End-to-End: Create Argument → Attack → Satisfy CQ

**Full Flow**:
1. **Create Argument** (POST /api/arguments):
   ```json
   {
     "text": "Dr. Williams says climate change is real",
     "deliberationId": "...",
     "authorId": "...",
     "conclusionClaimId": "...",
     "premiseClaimIds": ["..."]
   }
   ```

2. **Verify Scheme Auto-Assigned**:
   ```sql
   SELECT "schemeId" FROM "Argument" WHERE id = '...'
   -- Should be ExpertOpinion
   ```

3. **Load in AIFArgumentsListPro**:
   - Should see SchemeBadge: "ExpertOpinion"
   - Should see CQ count: "0/5 CQs satisfied"

4. **Create Attack from CQ Panel**:
   - Click eo-1 dropdown
   - Create REBUTS attack

5. **Observe**:
   - ✅ Spinner appears
   - ✅ Attack count updates (0 → 1)
   - ✅ CQ checkbox enables

6. **Mark CQ Satisfied**:
   - Click eo-1 checkbox
   - Should succeed immediately (no 409 error)

7. **Verify CQ Count Updates**:
   - Should show "1/5 CQs satisfied"

---

## Performance Tests

### Loading State Responsiveness
**Test**: Create 10 attacks in rapid succession
**Expected**: Each shows spinner independently, no race conditions

### Scheme Inference Performance
**Test**: Create 50 arguments in batch
**Expected**: All complete in <5 seconds (avg ~100ms per inference)

### Attachments API Performance
**Test**: Fetch attachments for argument with 100 conflicts
**Expected**: Response in <200ms

---

## Regression Tests

### Old Attacks Without metaJson
**Setup**: Query existing ConflictApplication rows without metaJson

```sql
SELECT COUNT(*) FROM "ConflictApplication"
WHERE "metaJson" IS NULL OR "metaJson" = '{}'::jsonb;
```

**Expected Behavior**:
- Attachments API still returns `__ANY__` for these
- No crashes or errors
- CQ checkboxes use fallback logic

### Arguments Without Scheme
**Setup**: Manually create argument with schemeId = NULL

```sql
INSERT INTO "Argument" ("id", "deliberationId", "authorId", "conclusionClaimId", "schemeId", "text")
VALUES ('test_arg', '...', '...', '...', NULL, 'Test argument');
```

**Expected**:
- AIFArgumentsListPro renders without crashing
- SchemeBadge shows "No scheme" or is hidden
- CQ panel shows "No critical questions yet."

---

## Success Criteria

✅ All 7 tests pass
✅ metaJson stored in database with correct structure
✅ CQ checkboxes auto-enable after attacks
✅ Loading spinners appear and disappear smoothly
✅ All new arguments get schemes (no NULL schemeId)
✅ Scheme inference matches expected patterns
✅ No crashes or 500 errors

---

## Rollback Instructions

If Phase 2 causes issues:

```bash
# Rollback code
git revert 224dfae

# Rollback database (if migration was run)
ALTER TABLE "ConflictApplication" DROP COLUMN "metaJson";

# Push changes
git push -f origin claude/debug-aif-arguments-011CUKYh7mJ3H5QUXgvvp4sD
```

---

## Known Limitations

- **metaJson** is optional - old attacks don't have it (by design)
- **Scheme inference** is heuristic-based, may misclassify edge cases
- **Loading states** only work in AIFArgumentsListPro (not other components yet)
- **No batch migration** for existing arguments without schemes (manual script needed)

---

## Next Steps After Phase 2

Once all tests pass:
- [ ] Document any test failures
- [ ] Run optional backfill script for existing arguments (if desired)
- [ ] Proceed to **Phase 3** (Fixes #1, #6)

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
**Build Version**: `224dfae`
