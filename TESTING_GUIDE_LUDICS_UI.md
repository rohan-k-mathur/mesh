# Testing Guide: Ludics Inference Engine UI

**Quick Start:** How to test the validated inference engine in the Mesh UI

---

## Prerequisites

1. ✅ Server running: `npm run dev`
2. ✅ Navigate to a deliberation with Ludics enabled
3. ✅ Open the **Ludics tab** in DeepDivePanel

---

## Test Scenario 1: Basic Fact Addition

### Steps:
1. In the **CommitmentsPanel**, locate the input field at the top
2. Type: `congestion_high`
3. Click **"+ Fact"** button (or press Enter)

### Expected Result:
- ✅ Fact appears in the left column (Facts section)
- ✅ No error messages
- ✅ Fact is not marked as derived (no green highlight)

---

## Test Scenario 2: Simple Rule Inference

### Steps:
1. Type: `congestion_high -> negative_impact`
2. **Observe validation feedback** below input:
   - Should show: ✓ Rule looks good: congestion_high → negative_impact
3. Click **"+ Rule"** button

### Expected Result:
- ✅ Rule appears in the right column (Rules section)
- ✅ No error toast

### Test Inference:
4. Click **"Infer"** button

### Expected Result:
- ✅ `negative_impact` appears in Facts column with **green background** (derived)
- ✅ No contradictions shown

---

## Test Scenario 3: Conjunction Rule

### Steps:
1. Clear previous facts: Click × next to each fact to remove them
2. Add two facts:
   - Type `A`, click "+ Fact"
   - Type `B`, click "+ Fact"
3. Add conjunction rule:
   - Type: `A & B -> C`
   - Verify green checkmark appears
   - Click "+ Rule"
4. Click **"Infer"**

### Expected Result:
- ✅ `C` appears as derived fact (green)
- ✅ Both `A` and `B` remain as regular facts

---

## Test Scenario 4: Negation Handling

### Steps:
1. Clear previous facts
2. Add fact: `traffic_flowing`
3. Add rule: `traffic_flowing -> not congestion`
4. Click "Infer"

### Expected Result:
- ✅ `not congestion` appears as derived fact

### Test Contradiction:
5. Manually add fact: `congestion`
6. Click "Infer"

### Expected Result:
- ⚠️ **Contradiction detected** (shown in red)
- ⚠️ Toast notification: "Contradiction detected"

---

## Test Scenario 5: Invalid Rule Syntax

### Steps:
1. Type: `A -> -> B` (double arrow - invalid)
2. **Observe validation feedback**

### Expected Result:
- ❌ Red warning: "⚠️ Rule cannot contain multiple arrows"
- ❌ "+ Rule" button should be disabled or show alert when clicked

### Additional Invalid Cases to Test:
- `-> B` → Error: "Preconditions cannot be empty"
- `A ->` → Error: "Consequent cannot be empty"  
- `A B C` → Error: "Rule must contain '->' or '=>' arrow"

---

## Test Scenario 6: Persist Derived Toggle

### Setup:
1. Add fact: `A`
2. Add rule: `A -> B`
3. **Check the "persist derived" checkbox** (below the facts/rules count)
4. Click "Infer"

### Expected Result:
- ✅ `B` appears as derived fact (green)
- ✅ Reload the page → `B` still appears (persisted to database)

### Compare Without Persist:
5. Click "Clear Derived" button
6. **Uncheck "persist derived"**
7. Click "Infer" again

### Expected Result:
- ✅ `B` appears temporarily (green)
- ✅ Reload page → `B` is gone (not persisted)

---

## Test Scenario 7: Entitlement (Suspension)

### Steps:
1. Add fact: `A`
2. Add rule: `A -> B`
3. Click "Infer" → `B` is derived ✅
4. Click the **⚠️ icon** next to fact `A` (toggle entitlement)
5. Click "Infer" again

### Expected Result:
- ❌ `B` is NOT derived (because `A` is suspended)
- ✅ Fact `A` shows suspension indicator (⚠️)

### Re-enable:
6. Click ⚠️ icon again to restore entitlement
7. Click "Infer"

### Expected Result:
- ✅ `B` is derived again

---

## Test Scenario 8: Chained Inference

### Steps:
1. Clear all facts/rules
2. Add fact: `A`
3. Add rules:
   - `A -> B`
   - `B -> C`
   - `C -> D`
4. Click "Infer"

### Expected Result:
- ✅ All derived facts appear: `B`, `C`, `D` (all green)
- ✅ Inference completes in < 1 second
- ✅ No infinite loop errors

---

## Test Scenario 9: Multiple Rule Formats

Test that all arrow syntaxes work:

### Steps:
1. Add fact: `X`
2. Add rules (one at a time):
   - `X -> Y` (standard arrow)
   - `X => Z` (fat arrow)
   - `X,Y -> W` (comma separator)
   - `X&Y->V` (no spaces)
3. Click "Infer"

### Expected Result:
- ✅ All derived facts appear: `Y`, `Z`, `W`, `V`
- ✅ No syntax errors

---

## Test Scenario 10: Trace Log (Enhanced)

### Steps:
1. Navigate to deliberation with compiled Ludics designs
2. In LudicsPanel, scroll to **"Trace Log"** section
3. Expand if collapsed

### Expected Visual Elements:
- ✅ **Statistics dashboard** showing:
  - Total pairs processed
  - Decisive steps count
  - Final status (convergent/divergent)
  - Unique loci
- ✅ **Plain text output block** (dark monospace)
- ✅ **Visual outcome summary** (convergent ✓ or divergent ✗)
- ✅ **Step-by-step cards** with badges:
  - ⭐ Decisive steps
  - ⊥ NLI contradictions
  - ⊙ Reversibility markers
- ✅ **Quick reference legend** explaining symbols

### Interaction Test:
4. Click on any step card

### Expected Result:
- ✅ **ActInspector appears inline** below the clicked step
- ✅ Shows positive/negative act details
- ✅ Close button works

---

## Troubleshooting

### Issue: Facts/rules don't appear after adding
**Solution:** Check browser console for errors, ensure deliberationId is set

### Issue: Infer button does nothing
**Solution:** Check network tab for API errors, verify `/api/commitments/apply` endpoint

### Issue: Validation messages don't appear
**Solution:** Hard refresh page (Cmd+Shift+R), ensure shared parser is imported

### Issue: "Add to Ludics" button gives 404
**Solution:** See separate fix below for promotion endpoint

---

## API Endpoints Used

All endpoints should return 200 OK:

1. **POST /api/commitments/apply** - Add facts/rules, get derivations
2. **GET /api/commitments/state** - Fetch current state
3. **POST /api/commitments/entitlement** - Toggle fact suspension
4. **POST /api/commitments/promote** - Promote dialogue → Ludics

### Test API Directly (Optional):

```bash
# Test adding a fact
curl -X POST http://localhost:3000/api/commitments/apply \
  -H "Content-Type: application/json" \
  -d '{
    "dialogueId": "YOUR_DELIBERATION_ID",
    "ownerId": "Proponent",
    "ops": {
      "add": [{ "label": "test_fact", "basePolarity": "pos" }]
    }
  }'

# Test adding a rule
curl -X POST http://localhost:3000/api/commitments/apply \
  -H "Content-Type: application/json" \
  -d '{
    "dialogueId": "YOUR_DELIBERATION_ID",
    "ownerId": "Proponent",
    "ops": {
      "add": [{ "label": "A -> B", "basePolarity": "neg" }]
    }
  }'
```

---

## Visual Indicators Guide

### Facts Column (Left):
- **White background** = Regular fact (manually added)
- **Green background** = Derived fact (inferred from rules)
- **✅ icon** = Entitled (included in inference)
- **⚠️ icon** = Suspended (excluded from inference)

### Rules Column (Right):
- All rules shown with their syntax
- Click × to remove

### Input Validation:
- **Green checkmark + text** = Valid rule syntax
- **Red warning** = Invalid syntax with specific error
- **Amber warning** = Syntax unclear

---

## Performance Expectations

- **Adding fact/rule**: < 500ms
- **Inference (< 10 rules)**: < 1 second
- **Inference (10-50 rules)**: 1-3 seconds
- **Page load**: < 2 seconds

If slower, check network tab for bottlenecks.

---

## Success Criteria

You should be able to:
- ✅ Add facts and rules without errors
- ✅ See real-time validation feedback
- ✅ Run inference and see derived facts (green)
- ✅ Detect contradictions
- ✅ Toggle entitlement and see effect on inference
- ✅ Use multiple rule syntaxes (→, =>, comma, &)
- ✅ Persist derived facts (checkbox)
- ✅ View enhanced trace log with inline inspector

---

## Next: Fix "Add to Ludics" Button

### Quick Fix: Restart Dev Server

The 404 error is likely a Next.js hot-reload issue. **Try this first:**

```bash
# Stop dev server (Ctrl+C in terminal)
rm -rf .next
npm run dev
```

Then test the "Add to Ludics" button again.

### If Still 404:

1. **Check browser DevTools Network tab** when clicking button
2. **Verify request URL** is exactly `/api/commitments/promote`
3. **Check terminal** for compilation message
4. **Look for auth errors** (might be disguised as 404)

### Manual Workaround (Temporary):

If you need to test inference NOW:
1. Copy commitment text from CommitmentStorePanel
2. Go to LudicsPanel CommitmentsPanel
3. Paste text and click "+ Fact"
4. This bypasses promotion and lets you test inference

### Detailed Debugging:

See logs from your output:
```
✓ Compiled /api/commitments/promote in 321ms (4661 modules)
POST /api/commitments/promote 404 in 1535ms
```

Route compiled but returned 404 suggests:
- Hot reload didn't register route (restart fixes this)
- OR auth middleware issue
- OR request validation failing

**After restart**, you should see:
```
[promote] Successfully promoted commitment in 250ms
POST /api/commitments/promote 200 in 1500ms
```


