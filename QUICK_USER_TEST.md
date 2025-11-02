# Quick User Verification Guide (5-Minute Test)

**Purpose**: Quickly verify CQ Preview Panel and Provenance Badges are working correctly.

**Important**: If you were testing before and the amber preview panel didn't show up, the issue has been fixed. The `/api/aif/schemes` endpoint now includes CQ data from the CriticalQuestion table.

---

## ✅ Quick Test Scenario (5 minutes)

### Step 1: Test CQ Preview Panel (2 minutes)

1. **Navigate to any deliberation**
2. **Click "Add Argument"** or open argument composer
3. **Select scheme**: "Argument from Popular Practice" from dropdown
4. **✓ VERIFY**: You see an **amber-colored preview panel** appear below the scheme selector
5. **✓ VERIFY**: Panel shows:
   - Header: "Critical Questions Preview" with question mark icon
   - First 4 critical questions (numbered 1, 2, 3, 4)
   - Each CQ has: question text, attack type pill, scope label
   - Footer: "...+ 1 more question" (5 total - 4 shown = 1 remaining)

**Expected Look**:
```
┌─────────────────────────────────────────────────────────┐
│ 🔶 Critical Questions Preview                           │
│ This scheme comes with 5 critical question(s)...        │
├─────────────────────────────────────────────────────────┤
│ [1] Is this practice appropriate in this domain?        │
│     REBUTS | conclusion                                 │
├─────────────────────────────────────────────────────────┤
│ [2] Does this practice violate ethical norms?           │
│     UNDERMINES | premise                                │
├─────────────────────────────────────────────────────────┤
│ [3] Could the majority be wrong?                        │
│     UNDERCUTS | inference                               │
├─────────────────────────────────────────────────────────┤
│ [4] Is there evidence this practice is common?          │
│     UNDERMINES | premise                                │
├─────────────────────────────────────────────────────────┤
│                    ...+ 1 more question                  │
└─────────────────────────────────────────────────────────┘
```

**Colors**: 
- Border: Amber (orange-yellow)
- Background: Light amber gradient
- Badges: Amber pills

---

### Step 2: Test Provenance Badges (3 minutes)

1. **Fill in argument details**:
   - Add 2-3 premises
   - Add conclusion
   - Click "Create argument"

2. **Find your argument** in the deliberation view
3. **Click "Critical Questions" button** (shows badge like "0/10")
4. **Modal opens** with CQ list

5. **✓ VERIFY Emerald Summary Header** (top of modal, after scheme info):
   ```
   ┌─────────────────────────────────────────────────────────┐
   │ ✨ CQ INHERITANCE                                        │
   │ 5 own + 5 inherited = 10 total                          │
   │ Inherited from: Argument from Popular Opinion           │
   └─────────────────────────────────────────────────────────┘
   ```
   - **Colors**: Emerald green (mint/jade)
   - **Icon**: Sparkles (✨)
   - **Text**: Shows count breakdown and parent scheme name

6. **✓ VERIFY CQ List** (scroll through all 10 CQs):
   
   **First 5 CQs** (own, NO badge):
   - domain_appropriate_practice?
   - ethical_violation?
   - majority_wrong?
   - practice_evidence?
   - practitioners_representative?
   
   **Last 5 CQs** (inherited, WITH emerald badge):
   - acceptance_evidence? → **🟢 Inherited from Argument from Popular Opinion**
   - alternative_opinions? → **🟢 Inherited from Argument from Popular Opinion**
   - basis_for_acceptance? → **🟢 Inherited from Argument from Popular Opinion**
   - domain_appropriate_opinion? → **🟢 Inherited from Argument from Popular Opinion**
   - group_representative? → **🟢 Inherited from Argument from Popular Opinion**

7. **✓ VERIFY Badge Appearance**:
   - Background: Light emerald green
   - Text: Dark emerald green
   - Icon: Sparkles (✨)
   - Format: "Inherited from {Parent Scheme Name}"

---

## 🎯 Pass/Fail Criteria

### ✅ **PASS** if:
- [ ] Amber preview panel appears when selecting scheme
- [ ] Preview shows first 4 CQs + overflow count
- [ ] Provenance summary header shows in emerald (green)
- [ ] Summary shows "5 own + 5 inherited = 10 total"
- [ ] First 5 CQs have NO provenance badge
- [ ] Last 5 CQs have emerald badge with parent scheme name
- [ ] Badge text reads "Inherited from Argument from Popular Opinion"

### ❌ **FAIL** if:
- [ ] Preview panel doesn't appear
- [ ] Preview shows wrong number of CQs
- [ ] No emerald provenance summary
- [ ] All CQs show provenance badges (should only be last 5)
- [ ] Badge text is wrong or missing
- [ ] Modal shows "0/0" CQs or empty state

---

## 🔧 Quick Troubleshooting

### Problem: Preview panel doesn't appear
**Fix**: 
1. **If you see the scheme name but no amber preview panel**, the API might not be returning CQs
2. **Test the API**: Run `npx tsx scripts/test-api-schemes-cqs.ts`
3. **If test fails**: The `/api/aif/schemes` endpoint needs to include `cqs` relation
4. **Quick fix applied**: The endpoint has been updated to use CriticalQuestion table
5. **Refresh the page** in your browser (hard refresh: Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
6. **Check browser console** for errors
7. If still not working, verify scheme has CQs: Run migration script `npx tsx scripts/migrate-scheme-cqs.ts`

### Problem: Modal shows "0/0" CQs
**Fix**: 
1. Check ArgumentSchemeInstance was created
2. Run: `npx tsx scripts/migrate-scheme-cqs.ts`
3. Recreate argument

### Problem: No provenance badges
**Fix**:
1. Check DevTools Network tab for `/cqs-with-provenance` request
2. Verify response has `inheritedCQs` array
3. Check scheme has `parentSchemeId` and `inheritCQs: true`

### Problem: Wrong CQ counts
**Fix**:
1. Verify scheme in database: Popular Practice should have 5 CQs
2. Verify parent (Popular Opinion) has 5 CQs
3. Re-run migration: `npx tsx scripts/migrate-scheme-cqs.ts`

---

## 🎓 Additional Test (Optional, +2 minutes)

### Test Parent Scheme (No Inheritance)

1. **Create another argument** using **"Argument from Popular Opinion"** (parent scheme)
2. **Open CQ modal**
3. **✓ VERIFY**:
   - **NO emerald provenance summary** (parent schemes don't inherit)
   - **5 total CQs** (all own, no inherited)
   - **NO emerald badges** on any CQ
   - Progress shows "0/5" or "X/5"

**Expected**: Clean CQ list with no provenance info (this is correct for parent schemes).

---

## 📊 Test Results

**Tester**: _________________  
**Date**: _________________  
**Time**: _______ minutes

**Results**:
- [ ] ✅ Preview Panel: **PASS** | ❌ **FAIL**
- [ ] ✅ Provenance Summary: **PASS** | ❌ **FAIL**
- [ ] ✅ Provenance Badges: **PASS** | ❌ **FAIL**
- [ ] ✅ Parent Scheme (optional): **PASS** | ❌ **FAIL**

**Overall**: ⬜ **ALL PASS** | ⬜ **SOME FAILED**

**Notes**: _______________________________________________

---

## 🚀 Next Steps

### If All Pass ✅
1. Mark as verified in `USER_VERIFICATION_CHECKLIST.md`
2. Share success with team
3. Deploy to production

### If Any Fail ❌
1. Note which scenario failed
2. Check troubleshooting section
3. Check console logs for errors
4. Report issue with:
   - Which step failed
   - What you saw vs. expected
   - Console error messages
   - Screenshot (helpful)

---

**Need Help?**
- Full checklist: `USER_VERIFICATION_CHECKLIST.md` (15 scenarios)
- Implementation details: `CQ_PREVIEW_AND_PROVENANCE_COMPLETE.md`
- Test script: `npx tsx scripts/test-cq-preview-and-provenance.ts`

**Last Updated**: November 1, 2025
