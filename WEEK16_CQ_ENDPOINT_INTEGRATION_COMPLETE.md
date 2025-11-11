# Week 16: CQ Endpoint Integration Complete

**Status**: ✅ READY FOR TESTING  
**Date**: 2025-01-XX  
**Component**: `/api/nets/[id]/cqs` route updated to fetch from SchemeNet table

---

## Summary

Updated the existing CQ endpoint at `/app/api/nets/[id]/cqs/route.ts` to check for explicit SchemeNet records in the database **before** falling back to heuristic detection. This enables the ArgumentNetAnalyzer component's Critical Questions tab to work with real multi-scheme test data.

---

## Changes Made

### 1. API Endpoint Enhancement (`app/api/nets/[id]/cqs/route.ts`)

**Priority-Based Detection**:
```typescript
// Priority 1: Check for explicit SchemeNet in database
const schemeNet = await prisma.schemeNet.findUnique({
  where: { id: netId },
  include: {
    steps: {
      include: { scheme: { include: { cqs: true } } },
      orderBy: { stepOrder: "asc" },
    },
    argument: { include: { premises: true, deliberation: true } },
  },
});

if (schemeNet) {
  // Use explicit net data
  // ... construct net, analyze, generate CQs
}

// Priority 2: Fall back to NetIdentificationService detection
const net = await netService.detectMultiScheme(netId);
```

**Key Features**:
- ✅ Checks SchemeNet table first (explicit nets)
- ✅ Falls back to NetIdentificationService (which has 3-priority detection)
- ✅ Uses NetAwareCQService to generate composed CQs
- ✅ Integrates DependencyInferenceEngine for dependency analysis
- ✅ Integrates ExplicitnessClassifier for explicitness analysis
- ✅ Supports grouping via `?groupBy=scheme|dependency|burden|attack-type`
- ✅ Returns both grouped and flat question formats

**Response Format**:
```typescript
// With groupBy parameter:
{
  groups: Array<{
    groupType: "scheme" | "dependency" | "burden" | "attack-type",
    groupLabel: string,
    groupDescription: string,
    questions: ComposedCQ[],
    priority: "high" | "medium" | "low"
  }>,
  totalQuestions: number
}

// Without groupBy:
{
  questions: ComposedCQ[]
}
```

---

## Test Data Available

### Real Multi-Scheme Argument
- **Argument ID**: `test-multi-scheme-climate-arg`
- **SchemeNet ID**: `cmhuzfcl80004g15fi0bbhy2u`
- **Deliberation ID**: `test-delib-week16`
- **User**: week16-tester (ID: 133)

### Net Structure
```
Expert Opinion (Primary) → Sign (Supporting) → Causal Reasoning (Supporting)
Step 1: Expert Opinion (0.95 confidence)
  → Step 2: Sign (0.92 confidence)
    → Step 3: Causal Reasoning (0.88 confidence)
Overall Confidence: 0.90
```

### Database Records
- ✅ SchemeNet record with 3 SchemeNetStep entries
- ✅ ArgumentSchemeInstance junction records
- ✅ ArgumentScheme definitions (Expert Opinion, Sign, Causal Reasoning)
- ✅ Test user, deliberation, argument, and premises

---

## Testing Instructions

### 1. Test CQ Endpoint Directly

**Fetch SchemeNet CQs**:
```bash
# Test with groupBy=scheme
curl http://localhost:3000/api/nets/cmhuzfcl80004g15fi0bbhy2u/cqs?groupBy=scheme

# Test without grouping
curl http://localhost:3000/api/nets/cmhuzfcl80004g15fi0bbhy2u/cqs
```

**Expected Response**:
- Status: 200
- Body: `{ groups: [...], totalQuestions: N }` (with groupBy)
- Groups should include scheme-specific CQs for each of 3 schemes
- Should include net-level coherence questions

### 2. Test ArgumentNetAnalyzer Component

**Navigate to Test Page**:
```
http://localhost:3000/test/net-analyzer
```

**Test Sequence**:
1. **View Component Render** (Default Tab):
   - ArgumentNetAnalyzer should render without errors
   - Should show tabs: "Visualization", "Critical Questions"

2. **Click "Visualization" Tab**:
   - Should show NetGraphWithCQs component
   - Should display 3 scheme nodes
   - Nodes: Expert Opinion → Sign → Causal Reasoning
   - No console errors

3. **Click "Critical Questions" Tab**:
   - ComposedCQPanel should load
   - Should fetch from `/api/nets/cmhuzfcl80004g15fi0bbhy2u/cqs?groupBy=scheme`
   - Should display groups: "Expert Opinion", "Sign", "Causal Reasoning", "Net-Level Questions"
   - Each group should have scheme-specific CQs
   - No 404 errors in console

4. **Test Auto-Detection**:
   - Click "Test: SchemeAnalyzer" tab
   - Click "Open SchemeAnalyzer" button
   - Dialog should open with ArgumentNetAnalyzer
   - Should auto-detect net and show 3 schemes

5. **Test Backward Compatibility**:
   - Click "Test: Backward Compatibility" tab
   - Should fall back to traditional single-scheme view
   - Shows mock CQs without net structure

### 3. Browser Console Testing

**Fetch API Test**:
```javascript
// Test net detection
fetch('/api/nets/detect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ argumentId: 'test-multi-scheme-climate-arg' })
})
.then(r => r.json())
.then(data => {
  console.log('Net detected:', data.net);
  console.log('Schemes:', data.net?.schemes.length);
  console.log('Dependency graph:', data.net?.dependencyGraph);
});

// Test CQ generation
fetch('/api/nets/cmhuzfcl80004g15fi0bbhy2u/cqs?groupBy=scheme')
.then(r => r.json())
.then(data => {
  console.log('CQ Groups:', data.groups.length);
  console.log('Total Questions:', data.totalQuestions);
  data.groups.forEach(g => {
    console.log(`${g.groupLabel}: ${g.questions.length} questions`);
  });
});
```

---

## Success Criteria

### ✅ Endpoint Integration
- [x] Endpoint checks SchemeNet table first
- [x] Falls back to NetIdentificationService if no explicit net
- [x] Uses NetAwareCQService for CQ generation
- [x] Supports all grouping modes
- [x] Returns proper response format
- [x] Lint-clean (0 errors, 0 warnings)

### ⏳ Component Integration (Pending Browser Testing)
- [ ] ArgumentNetAnalyzer renders without errors
- [ ] Visualization tab shows 3-scheme graph
- [ ] Critical Questions tab loads CQs without 404
- [ ] ComposedCQPanel displays grouped questions
- [ ] SchemeAnalyzer auto-detection works
- [ ] Single-scheme fallback works correctly

### ⏳ API Testing (Pending)
- [ ] `/api/nets/detect` returns non-null net for test argument
- [ ] `/api/nets/{netId}/cqs` returns grouped CQs
- [ ] Dependency graph includes all 3 schemes
- [ ] Explicitness analysis present
- [ ] No console errors

---

## Architecture

### Component Flow
```
ArgumentNetAnalyzer
  └─ Tab: Critical Questions
      └─ ComposedCQPanel (netId prop)
          └─ Fetches: /api/nets/{netId}/cqs?groupBy=scheme
              ├─ Priority 1: Check SchemeNet table
              ├─ Priority 2: NetIdentificationService.detectMultiScheme()
              │   ├─ Priority 1: fetchExplicitSchemeNet()
              │   ├─ Priority 2: fetchSchemeInstancesAsNet()
              │   └─ Priority 3: Heuristic text analysis
              └─ Returns: Grouped CQs by scheme
```

### Database Integration
```
SchemeNet (explicit nets)
  ├─ steps: SchemeNetStep[] (ordered)
  │   └─ scheme: ArgumentScheme (with CQs)
  └─ argument: Argument (with premises)

ArgumentSchemeInstance (detected schemes)
  ├─ argumentId
  ├─ schemeId
  └─ confidence

Argument (legacy/all)
  ├─ premises: Premise[]
  └─ deliberationId
```

---

## Files Modified

1. **`app/api/nets/[id]/cqs/route.ts`** (Updated)
   - Added SchemeNet database query (Priority 1)
   - Construct net from explicit data
   - Fall back to NetIdentificationService (Priority 2+)
   - Generate CQs via NetAwareCQService
   - Support all grouping modes

---

## Related Documentation

- `WEEK16_INTEGRATION_COMPLETE.md` - Component implementation details
- `WEEK16_REAL_DATA_TESTING_COMPLETE.md` - Test data creation
- `WEEK16_API_REFERENCE.md` - API endpoint documentation
- `PHASE4_WEEK16_NET_MANAGEMENT.md` - Overall Phase 4 plan

---

## Next Steps

1. **Browser Testing** (Current Session):
   - Visit test page: http://localhost:3000/test/net-analyzer
   - Test all tabs and interactions
   - Verify no console errors
   - Verify CQs load correctly

2. **Validation** (After Testing):
   - Document test results
   - Create issue list for any bugs found
   - Update success criteria checkboxes

3. **Phase 1 Integration** (Future):
   - Add "Analyze Schemes" button to ArgumentCard
   - Add scheme count badge
   - Add optional tab to ArgumentPopout
   - Feature flag: `ENABLE_NET_ANALYZER_BUTTONS`

---

## Technical Notes

### Why This Approach?

**Priority-Based Detection**:
- Explicit SchemeNet records (user-created or imported) have highest fidelity
- NetIdentificationService provides robust fallback with 3-level detection
- Heuristic analysis catches legacy arguments without explicit net data

**Service Integration**:
- NetAwareCQService generates scheme-specific + net-level questions
- DependencyInferenceEngine analyzes scheme relationships
- ExplicitnessClassifier determines how explicit each scheme is

**Backward Compatibility**:
- Single-scheme arguments fall back to traditional CQ modal
- No breaking changes to existing argument functionality
- Net features are additive, not replacement

### Type Assertions

Used `as any` for net object construction from SchemeNet because:
- NetCandidate interface expects many fields we don't have in SchemeNet
- Net object is immediately passed to services that accept duck-typed structures
- Alternative would be extensive type mapping (overkill for this use case)

---

## Status Summary

**Implementation**: ✅ 100% COMPLETE  
**Lint**: ✅ PASS (0 errors, 0 warnings)  
**Dev Server**: ✅ RUNNING (no route conflicts)  
**Database**: ✅ Test data seeded  
**Testing**: ⏳ READY (awaiting browser validation)

**Recommendation**: Proceed with browser testing using instructions above. The endpoint is ready, the component is ready, and test data exists in the database.
