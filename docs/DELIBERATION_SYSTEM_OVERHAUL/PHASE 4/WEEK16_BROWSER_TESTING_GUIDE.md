# Week 16: Browser Testing Guide

Since the ArgumentNetAnalyzer component is loading successfully, let's verify all functionality through the browser.

## ✅ Test 1: Component Renders - PASSED

You've confirmed the component loads without errors. Great!

## 🔄 Test 2: Net Detection API

Since you mentioned the component renders, the API call is likely succeeding (the component fetches on mount). Let's verify:

### Option A: Check Browser DevTools Network Tab

1. Open browser at http://localhost:3000/test/net-analyzer
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to Network tab
4. Filter: Fetch/XHR
5. Look for request to `/api/nets/detect`
6. Click on it to see:
   - **Request Payload**: Should show `{"argumentId":"test-multi-scheme-climate-arg"}`
   - **Response**: Should show net data with 3 steps (not null)

### Option B: Check Browser Console

Run this in the browser console (F12 → Console tab):

```javascript
// Test the API directly from browser
fetch('/api/nets/detect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ argumentId: 'test-multi-scheme-climate-arg' })
})
.then(r => r.json())
.then(data => {
  console.log('Net Detection Result:', data);
  if (data.net) {
    console.log('✅ Net detected!');
    console.log('Net ID:', data.net.id);
    console.log('Steps:', data.net.steps?.length || 0);
    console.log('Schemes:', data.net.steps?.map(s => s.label).join(' → '));
  } else {
    console.log('❌ No net detected (returned null)');
  }
});
```

**Expected Output**:
```
✅ Net detected!
Net ID: cmhuz1r4g0004g12gc2d21elp
Steps: 3
Schemes: Expert Consensus → Observational Evidence → Causal Mechanism
```

### Option C: Use React DevTools

1. Install React DevTools extension if not already installed
2. Open browser at http://localhost:3000/test/net-analyzer
3. Open React DevTools
4. Select `ArgumentNetAnalyzer` component
5. Check props and state:
   - `netData` should be populated (not null)
   - `netData.steps` should have 3 items
   - `isLoading` should be false

## 🔄 Test 3: Backward Compatibility

Test the single-scheme fallback:

1. On test page, click tab "Test: Backward Compatibility for Single Schemes"
2. Click button "Open Single Scheme Analysis"
3. Dialog should open showing traditional SchemeSpecificCQsModal
4. Should display 2 mock critical questions

**Expected**: Falls back to traditional view (no net detected for mock ID)

## 🔄 Test 4: Tab Navigation

Test all tabs work:

### Test 4a: Visualization Tab
1. On test page, ensure "Test: ArgumentNetAnalyzer (Direct Component)" tab is selected
2. Click "Visualization" tab inside ArgumentNetAnalyzer
3. Should see graph visualization with 3 connected scheme nodes

**Expected**:
- Graph renders without errors
- Shows 3 nodes (Expert Opinion, Sign, Causal Reasoning)
- Shows connections between them
- Confidence scores visible

### Test 4b: Critical Questions Tab
1. Click "Critical Questions" tab inside ArgumentNetAnalyzer
2. Should see composed critical questions panel

**Expected**:
- Shows net-aware CQs (not single-scheme CQs)
- Questions organized by scheme
- All 3 schemes represented

### Test 4c: Management Tabs (if visible)
Note: Management tabs are currently disabled (showManagement=false)

**Expected**: Only 2 tabs visible (Visualization + Critical Questions)

## Quick Visual Checklist

Run through this checklist on http://localhost:3000/test/net-analyzer:

- [ ] Page loads without console errors
- [ ] ArgumentNetAnalyzer component renders
- [ ] "Visualization" tab is clickable
- [ ] Graph visualization appears when clicking Visualization tab
- [ ] "Critical Questions" tab is clickable
- [ ] CQ panel appears when clicking Critical Questions tab
- [ ] No "History" or "Export/Import" tabs visible (showManagement=false)
- [ ] Click "Test: SchemeAnalyzer" tab at top
- [ ] Click "Open SchemeAnalyzer" button
- [ ] Dialog opens
- [ ] Shows ArgumentNetAnalyzer inside dialog (not traditional modal)
- [ ] Click "Test: Backward Compatibility" tab at top
- [ ] Click "Open Single Scheme Analysis" button
- [ ] Dialog opens
- [ ] Shows traditional CQ list (fallback, not net analyzer)

## Troubleshooting

### If Network Tab shows 401/403 error
- You may need to log in first
- Go to http://localhost:3000/login
- Log in with test credentials
- Return to test page

### If API returns `{"net": null}`
The argument exists (unique constraint proves it), but net might not be properly linked:

Run in terminal:
```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.argument.findUnique({
  where: { id: 'test-multi-scheme-climate-arg' },
  include: { schemeNet: { include: { steps: true } } }
}).then(a => {
  console.log('Has schemeNet:', !!a?.schemeNet);
  console.log('Steps:', a?.schemeNet?.steps?.length || 0);
  process.exit(0);
});
"
```

### If component shows loading forever
- Check browser console for errors
- Check Network tab for failed requests
- Verify API endpoint is responding

## Verification Database Query

To verify the data structure in database, you can also use Prisma Studio:

1. Open: http://localhost:5555 (Prisma Studio is running)
2. Click "Argument" model
3. Search for ID: `test-multi-scheme-climate-arg`
4. Should see the argument record
5. Click on it to see relations:
   - `schemeNet` → should link to SchemeNet record
   - `argumentSchemes` → should show 3 instances

## Success Criteria

All tests pass when:

✅ **Component Renders** - No console errors  
✅ **Net Detection API** - Returns non-null net with 3 steps  
✅ **Backward Compatibility** - Single scheme shows fallback modal  
✅ **Tab Navigation** - All tabs work without errors  

## Report Results

After testing, update your status:

```
✅ Component Renders - PASSED
✅ Net Detection API - PASSED (or describe issue)
✅ Backward Compatibility - PASSED (or describe issue)  
✅ Tab Navigation - PASSED (or describe issue)
```

Then we can proceed to Phase 1 integration or address any issues found.
