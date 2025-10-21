# Phase 2 Testing - Quick Start Guide

**Status**: ✅ All code changes verified
**Branch**: `claude/debug-aif-arguments-011CUKYh7mJ3H5QUXgvvp4sD`
**Time Required**: ~15 minutes

---

## ✅ Pre-Flight Check

Run the verification script:
```bash
./verify_phase2.sh
```

All checks should show **green checkmarks** ✓

---

## 🗄️ Step 1: Database Migration (REQUIRED)

**Apply the migration**:
```bash
# Replace $DATABASE_URL with your actual connection string
psql $DATABASE_URL -f database/migrations/20251021_add_metajson_to_conflict_application.sql
```

**Expected output**:
```
ALTER TABLE
COMMENT
CREATE INDEX
NOTICE:  Migration successful: metaJson column added to ConflictApplication
DO
```

**Verify it worked**:
```bash
psql $DATABASE_URL -c "\d ConflictApplication"
```

**Look for this line**:
```
metaJson | jsonb | default '{}'::jsonb
```

✅ **Migration complete!**

---

## 🚀 Step 2: Start Your Dev Server

```bash
npm run dev
```

Wait for the server to start (usually http://localhost:3000)

---

## 🧪 Step 3: Quick Smoke Tests

### Test A: Scheme Auto-Assignment (30 seconds)

**Goal**: Verify new arguments get schemes automatically

1. **Navigate to a deliberation with arguments**
2. **Create a new argument**:
   - Text: "Dr. Smith, a virologist with 20 years experience, says vaccines are safe"
   - Add at least one premise
   - **Don't** select a scheme manually
   - Submit

3. **Expected Result**:
   - Argument appears in AIFArgumentsListPro
   - **SchemeBadge shows "ExpertOpinion"** ← KEY CHECK
   - Console log: `[schemeInference] Assigned scheme "ExpertOpinion"...`

4. **Verify in DB** (optional):
   ```bash
   psql $DATABASE_URL -c "SELECT text, s.key as scheme FROM \"Argument\" a LEFT JOIN \"ArgumentationScheme\" s ON a.\"schemeId\" = s.id ORDER BY a.\"createdAt\" DESC LIMIT 1;"
   ```

✅ **PASS**: Scheme badge shows ExpertOpinion
❌ **FAIL**: Scheme badge missing or shows "No scheme"

---

### Test B: Attack → CQ Linking (60 seconds)

**Goal**: Verify attacks record which CQ they address

1. **Find an argument with a scheme** (or use the one you just created)
2. **Click the dropdown on a CQ row** (e.g., "Is expert credible?")
3. **Create a REBUTS attack**:
   - Pick or create a counter-claim
   - Click "Post rebuttal"

4. **Open Browser DevTools → Network tab**
5. **Find the POST to `/api/ca`**
6. **Check the request payload**:

**Expected payload**:
```json
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

7. **Verify in DB**:
   ```bash
   psql $DATABASE_URL -c "SELECT \"metaJson\" FROM \"ConflictApplication\" ORDER BY \"createdAt\" DESC LIMIT 1;"
   ```

✅ **PASS**: metaJson contains schemeKey, cqKey, source
❌ **FAIL**: metaJson is null or missing fields

---

### Test C: CQ Checkbox Auto-Enables (30 seconds)

**Goal**: Verify CQ checkboxes enable after attacks

**Continuation from Test B**:

1. **After creating the attack, refresh the page** (or wait a moment)
2. **Look at the CQ you just attacked** (e.g., "Is expert credible?")
3. **The checkbox should now be ENABLED** (not grayed out)
4. **Click it** → should toggle immediately without errors

**Expected**:
- Checkbox is clickable
- No error message "(add)" next to it
- Can mark as satisfied/unsatisfied

✅ **PASS**: Checkbox is enabled and clickable
❌ **FAIL**: Checkbox still grayed out with "(add)" message

---

### Test D: Loading Spinner (10 seconds)

**Goal**: Verify spinner appears during metadata refresh

1. **In AIFArgumentsListPro, click "Counter" on any argument**
2. **Create an attack quickly** (any type)
3. **Watch the argument card closely**

**Expected**:
- **Spinner overlay appears** (indigo spinning circle)
- Card content is slightly blurred
- Spinner disappears after ~200-500ms
- Attack counts update

✅ **PASS**: Spinner appeared and disappeared smoothly
❌ **FAIL**: No spinner, or spinner never disappears

---

## 📊 Test Results Summary

Fill this out as you test:

| Test | Status | Notes |
|------|--------|-------|
| **A. Scheme Auto-Assignment** | ⬜ PASS / ⬜ FAIL | |
| **B. Attack → CQ Linking** | ⬜ PASS / ⬜ FAIL | |
| **C. CQ Checkbox Auto-Enables** | ⬜ PASS / ⬜ FAIL | |
| **D. Loading Spinner** | ⬜ PASS / ⬜ FAIL | |

---

## ✅ All Tests Passing?

**Great! Phase 2 is working correctly. You can:**
- ✅ Proceed to Phase 3 (CommandCard wiring + GROUNDS→Arguments)
- ✅ Run more detailed tests from `PHASE_2_TEST_GUIDE.md`
- ✅ Start using the features in production

---

## ❌ Some Tests Failing?

**Common Issues & Fixes**:

### Issue 1: Scheme is null/missing
**Fix**: Check console for errors from schemeInference.ts
**Verify**: ArgumentationScheme table has rows with keys matching SchemeId types

### Issue 2: metaJson not being saved
**Fix**: Verify migration ran successfully
**Check**: `psql $DATABASE_URL -c "\d ConflictApplication"` shows metaJson column

### Issue 3: CQ checkbox still disabled
**Fix**: Check `/api/cqs/attachments` response
**Verify**: Response includes `{ "ExpertOpinion:eo-1": true }`

### Issue 4: Spinner not appearing
**Fix**: Check browser console for React errors
**Verify**: AIFArgumentsListPro has `refreshing` state

---

## 🐛 Reporting Issues

If you encounter problems:

1. **Check browser console** for errors
2. **Check server logs** for backend errors
3. **Run verification script** again: `./verify_phase2.sh`
4. **Check the commit**: You should be on `224dfae` or `7d05521`

---

## 📚 Further Testing

For comprehensive testing, see:
- **`PHASE_2_TEST_GUIDE.md`** - 7 detailed test procedures
- **`AIF_DIALOGICAL_ACTIONS_FIX_SPEC.md`** - Full specification

---

**Tested By**: _________________
**Date**: _________________
**All Tests Passed**: ⬜ YES / ⬜ NO
**Ready for Phase 3**: ⬜ YES / ⬜ NO

---

🎉 **Happy Testing!**
