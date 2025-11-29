# Ludics Inference Engine Test Plan

**Goal:** Verify the `interactCE()` inference engine is functional and robust before integration work.

---

## Engine Architecture Review

### Core Components

1. **`applyToCS()`** - Adds/erases facts and rules to database
2. **`interactCE()`** - Forward-chaining inference engine
3. **`parseRule()`** - Parses rule syntax (exists in 2 places!)
4. **`setEntitlement()`** - Toggles fact suspension

### Current Issues Identified

#### 🔴 Critical: Duplicate `parseRule()` logic
- **Location 1:** `packages/ludics-engine/commitments.ts` (line 18)
- **Location 2:** `packages/ludics-react/CommitmentsPanel.tsx` (line 222)
- **Problem:** Frontend validation differs from backend execution
- **Risk:** Users can create rules that pass frontend but fail backend

#### 🟡 Medium: No backend validation
- Rules are stored as raw strings in database
- Backend `parseRule()` can return `null` but inference silently ignores
- No error reporting to user when rule syntax is invalid

#### 🟡 Medium: Entitlement filtering happens in `interactCE()` but not persisted in listCS
- `interactCE()` filters: `elements.filter(e => e.entitled !== false)`
- `listCS()` includes all elements regardless of entitlement
- **Result:** UI shows suspended facts but inference correctly excludes them

#### 🟢 Low: No transitive closure optimization
- Current algorithm re-evaluates all rules on every iteration
- With many rules, this becomes O(n²) or worse
- Datalog engine would be more efficient

---

## Test Suite Design

### Test 1: Basic Fact Addition ✅
**Scenario:** Add simple facts  
**Input:**
```
add: [{ label: "congestion_high", basePolarity: "pos" }]
```
**Expected:**
- Fact appears in `listCS()` output
- No derived facts
- No contradictions

---

### Test 2: Simple Rule Inference ✅
**Scenario:** Fact + Rule → Derived Fact  
**Input:**
```
add: [
  { label: "congestion_high", basePolarity: "pos" },
  { label: "congestion_high -> negative_impact", basePolarity: "neg" }
]
```
**Expected:**
- `interactCE()` returns `derivedFacts: [{ label: "negative_impact" }]`
- If `autoPersistDerived: true`, fact appears in `listCS()` with `derived: true`

---

### Test 3: Chained Inference ✅
**Scenario:** A → B, B → C, therefore A → C  
**Input:**
```
add: [
  { label: "A", basePolarity: "pos" },
  { label: "A -> B", basePolarity: "neg" },
  { label: "B -> C", basePolarity: "neg" }
]
```
**Expected:**
- First iteration: B is derived
- Second iteration: C is derived (from B)
- `derivedFacts: [{ label: "B" }, { label: "C" }]`

---

### Test 4: Conjunction in Rule ✅
**Scenario:** (A ∧ B) → C  
**Input:**
```
add: [
  { label: "A", basePolarity: "pos" },
  { label: "B", basePolarity: "pos" },
  { label: "A & B -> C", basePolarity: "neg" }
]
```
**Expected:**
- C is derived (both preconditions satisfied)

**Negative Test:**
```
add: [
  { label: "A", basePolarity: "pos" },
  { label: "A & B -> C", basePolarity: "neg" }
]
```
**Expected:**
- C is NOT derived (B missing)

---

### Test 5: Negation in Precondition ✅
**Scenario:** (A ∧ ¬B) → C  
**Input:**
```
add: [
  { label: "A", basePolarity: "pos" },
  { label: "not B", basePolarity: "pos" },
  { label: "A & not B -> C", basePolarity: "neg" }
]
```
**Expected:**
- C is derived

---

### Test 6: Negation in Consequent ✅
**Scenario:** A → ¬B  
**Input:**
```
add: [
  { label: "A", basePolarity: "pos" },
  { label: "A -> not B", basePolarity: "neg" }
]
```
**Expected:**
- `not B` is derived
- Added to `negatives` set

---

### Test 7: Contradiction Detection ✅
**Scenario:** User asserts X and ¬X  
**Input:**
```
add: [
  { label: "traffic_good", basePolarity: "pos" },
  { label: "not traffic_good", basePolarity: "pos" }
]
```
**Expected:**
- `contradictions: [{ a: "traffic_good", b: "not traffic_good" }]`
- API returns `blocked: true, code: "CS_CONTRADICTION"`

---

### Test 8: Derived Contradiction ✅
**Scenario:** Rule derives fact that contradicts existing fact  
**Input:**
```
add: [
  { label: "congestion_high", basePolarity: "pos" },
  { label: "congestion_high -> not traffic_good", basePolarity: "neg" },
  { label: "traffic_good", basePolarity: "pos" }
]
```
**Expected:**
- `not traffic_good` is derived
- Contradiction detected: `{ a: "traffic_good", b: "not traffic_good" }`

---

### Test 9: Entitlement (Suspension) ✅
**Scenario:** Suspended facts are excluded from inference  
**Input:**
```
add: [
  { label: "A", basePolarity: "pos", entitled: true },
  { label: "A -> B", basePolarity: "neg" }
]
interactCE() // B is derived

setEntitlement("A", false) // Suspend A
interactCE() // B should NOT be derived
```
**Expected:**
- After suspension, B does not derive
- `listCS()` still shows A (with `entitled: false`)

---

### Test 10: Persist Derived Toggle ✅
**Scenario:** Test `autoPersistDerived` flag  
**Input:**
```
// First request
add: [
  { label: "A", basePolarity: "pos" },
  { label: "A -> B", basePolarity: "neg" }
]
autoPersistDerived: false

// Second request (same data)
autoPersistDerived: true
```
**Expected:**
- First: `derivedFacts` returned but not in `listCS()`
- Second: `derivedFacts` returned AND in `listCS()` with `derived: true`

---

### Test 11: Malformed Rule Handling ❌
**Scenario:** Invalid rule syntax  
**Input:**
```
add: [
  { label: "this is not a rule", basePolarity: "neg" },
  { label: "A -> -> B", basePolarity: "neg" },
  { label: "-> C", basePolarity: "neg" }
]
```
**Expected:**
- ⚠️ **Currently:** Silently ignored (parseRule returns null)
- ✅ **Should:** Return error with helpful message

---

### Test 12: Multiple Rule Formats ✅
**Scenario:** Test different arrow syntaxes  
**Input:**
```
add: [
  { label: "A", basePolarity: "pos" },
  { label: "A -> B", basePolarity: "neg" },
  { label: "A => C", basePolarity: "neg" },
  { label: "A,B -> D", basePolarity: "neg" },
  { label: "A&B->E", basePolarity: "neg" }
]
```
**Expected:**
- All rules parse correctly
- B and C derive immediately
- D and E derive after B is inferred

---

### Test 13: Unicode Negation ✅
**Scenario:** Test ¬ symbol  
**Input:**
```
add: [
  { label: "A", basePolarity: "pos" },
  { label: "¬B", basePolarity: "pos" },
  { label: "A & ¬B -> C", basePolarity: "neg" }
]
```
**Expected:**
- C is derived
- Negation handled correctly

---

### Test 14: Case Sensitivity ⚠️
**Scenario:** Are facts case-sensitive?  
**Input:**
```
add: [
  { label: "Traffic", basePolarity: "pos" },
  { label: "traffic", basePolarity: "pos" }
]
```
**Expected:**
- **Currently:** Treated as different facts (case-sensitive)
- **Should discuss:** Should we normalize to lowercase?

---

### Test 15: Whitespace Handling ✅
**Scenario:** Extra whitespace in labels  
**Input:**
```
add: [
  { label: "  congestion_high  ", basePolarity: "pos" },
  { label: "congestion_high->impact", basePolarity: "neg" }
]
```
**Expected:**
- `norm()` function trims whitespace
- Rule matches fact correctly

---

### Test 16: Circular Rules ⚠️
**Scenario:** A → B, B → A  
**Input:**
```
add: [
  { label: "A", basePolarity: "pos" },
  { label: "A -> B", basePolarity: "neg" },
  { label: "B -> A", basePolarity: "neg" }
]
```
**Expected:**
- B is derived (from A)
- No infinite loop (A already in set, not re-added)
- Algorithm terminates after 1 iteration

---

### Test 17: Deep Inference Chain ✅
**Scenario:** A → B → C → D → E (5 levels)  
**Input:**
```
add: [
  { label: "A", basePolarity: "pos" },
  { label: "A -> B", basePolarity: "neg" },
  { label: "B -> C", basePolarity: "neg" },
  { label: "C -> D", basePolarity: "neg" },
  { label: "D -> E", basePolarity: "neg" }
]
```
**Expected:**
- All facts derive in sequence
- 4 iterations required
- Guard counter prevents infinite loops (MAX_ITERS = 1024)

---

### Test 18: Large Rule Set Performance ⚠️
**Scenario:** 100 facts, 100 rules  
**Expected:**
- Completes in < 1 second
- No timeout errors
- Memory usage reasonable

---

### Test 19: Concurrent Updates ❌
**Scenario:** Two users update same commitment store simultaneously  
**Expected:**
- ⚠️ **Currently:** No locking mechanism (potential race condition)
- ✅ **Should:** Use database transactions or optimistic locking

---

### Test 20: Locus Path Integration ✅
**Scenario:** Facts anchored to different locus paths  
**Input:**
```
add: [
  { label: "claim_1", basePolarity: "pos", baseLocusPath: "0.1" },
  { label: "claim_2", basePolarity: "pos", baseLocusPath: "0.2" },
  { label: "claim_1 -> conclusion", basePolarity: "neg", baseLocusPath: "0" }
]
```
**Expected:**
- Rule at root (0) can reference facts at child loci
- Conclusion derives correctly

---

## Issues Found & Recommendations

### 🔴 Critical Issues

1. **Duplicate parseRule() logic**
   - **Fix:** Extract to `packages/ludics-engine/rule-parser.ts`
   - **Import:** Both backend and frontend use same parser
   - **Add:** Zod schema for rule validation

2. **No backend validation**
   - **Fix:** Add validation in `applyToCS()` before saving
   - **Return:** Error response if rule syntax invalid
   - **UI:** Show error toast to user

3. **No rule syntax error reporting**
   - **Fix:** Return parse errors in API response
   - **Frontend:** Display validation errors inline

---

### 🟡 Medium Priority Issues

4. **Entitlement not reflected in listCS display**
   - **Status:** Actually working correctly, just confusing
   - **Fix:** Add visual indicator in UI (⚠️ icon for suspended)

5. **No transitive closure optimization**
   - **Status:** Works but inefficient for large rule sets
   - **Fix:** Consider Datalog engine or memoization

6. **No transaction safety**
   - **Status:** Concurrent updates could race
   - **Fix:** Wrap `applyToCS()` in Prisma transaction

7. **Case sensitivity unclear**
   - **Status:** Facts are case-sensitive (may surprise users)
   - **Fix:** Document behavior or normalize to lowercase

---

### 🟢 Low Priority Enhancements

8. **No rule syntax highlighting**
   - **Fix:** Add Monaco editor with custom language definition

9. **No rule debugging tools**
   - **Fix:** Add "Trace Inference" button showing derivation steps

10. **No performance metrics**
    - **Fix:** Log inference time, rules evaluated, iterations

---

## Testing Checklist

- [ ] Write unit tests for `parseRule()` (extract to shared module first)
- [ ] Write unit tests for `interactCE()` (mock Prisma)
- [ ] Write integration tests for `/api/commitments/apply`
- [ ] Test all 20 scenarios above manually
- [ ] Add E2E test: Create deliberation → Add facts → Add rules → Click Infer → Verify derived
- [ ] Performance test: 100 facts + 100 rules (measure time)
- [ ] Concurrency test: Two simultaneous POST requests to same CS
- [ ] Regression test: Ensure entitlement toggle works after fix

---

## Implementation Steps

### Phase 1: Extract & Validate (High Priority)
1. Create `packages/ludics-engine/rule-parser.ts`
2. Extract `parseRule()` to shared module
3. Add Zod schema: `zRule`
4. Update `commitments.ts` to import parser
5. Update `CommitmentsPanel.tsx` to import parser
6. Add validation in `applyToCS()`:
   ```typescript
   if (a.basePolarity === 'neg') {
     const parsed = parseRule(a.label);
     if (!parsed) {
       throw new Error(`Invalid rule syntax: ${a.label}`);
     }
   }
   ```
7. Update API to catch and return errors

### Phase 2: Test Coverage (High Priority)
8. Write unit tests for `parseRule()`
9. Write unit tests for `interactCE()`
10. Write API integration tests
11. Run manual tests for all 20 scenarios

### Phase 3: UI Improvements (Medium Priority)
12. Add inline rule validation in UI (real-time feedback)
13. Add "Trace Inference" debug mode
14. Add performance metrics display

### Phase 4: Optimizations (Low Priority)
15. Add Prisma transactions for concurrent safety
16. Consider Datalog engine for performance
17. Add memoization for repeated queries

---

## Success Criteria

✅ **Robust:** All 20 test scenarios pass  
✅ **Validated:** Backend rejects malformed rules  
✅ **Tested:** 80%+ code coverage for inference logic  
✅ **Documented:** Rule syntax guide in UI  
✅ **Performant:** Handles 100 rules in < 1s  

---

## Next Steps

1. Review this test plan with team
2. Prioritize fixes (start with duplicate parseRule)
3. Create tickets for each issue
4. Begin Phase 1 implementation
5. Run test suite and document results

