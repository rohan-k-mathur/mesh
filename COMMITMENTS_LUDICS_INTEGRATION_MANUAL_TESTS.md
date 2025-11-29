# Commitments ↔ Ludics Integration: Manual Testing Checklist

**Date:** November 27, 2025  
**Purpose:** Verify existing integration points work before implementing scoped inference

---

## Test Environment Setup

1. ✅ Navigate to deliberation: http://localhost:3000/deliberations/[id]
2. ✅ Open **Ludics tab** in DeepDivePanel
3. ✅ Ensure you have compiled designs (click "Compile" if needed)
4. ✅ Have both **LudicsPanel** and **CommitmentsPanel** visible

---

## Integration Point 1: Loci as Spatial Anchors 🗺️

**Theory:** Facts/rules are stored with `baseLocusId` pointing to a LudicLocus

### Test 1.1: Default Locus (Root)

**Steps:**
1. In **CommitmentsPanel** (Proponent or Opponent)
2. Add a fact: `test_fact_at_root`
3. Click "+ Fact"
4. Open browser DevTools → Network tab
5. Find the POST request to `/api/commitments/apply`
6. Check request payload

**Expected in Request:**
```json
{
  "ops": {
    "add": [{
      "label": "test_fact_at_root",
      "basePolarity": "pos",
      "baseLocusPath": "0"  // ← DEFAULT ROOT
    }]
  }
}
```

**✅ Pass Criteria:**
- Request includes `baseLocusPath: "0"`
- Fact appears in UI
- No errors in console

**Status:** [✅] Pass [ ] Fail [ ] Not Tested

**Actual Result:**
```json
{
  "dialogueId": "ludics-forest-demo",
  "ownerId": "Opponent",
  "autoPersistDerived": false,
  "ops": {
    "add": [{
      "label": "test_fact_at_root",
      "basePolarity": "pos",
      "baseLocusPath": "0"
    }]
  }
}
```
Response: `{"ok": true, "added": ["cmiia9mm1001sg1z04arw6xs7"], ...}`
✅ **PASS** - baseLocusPath "0" included, fact created successfully

---

### Test 1.2: Check Database Storage

**Steps:**
1. After adding fact from Test 1.1
2. Open Prisma Studio or database viewer
3. Query: `SELECT * FROM LudicCommitmentElement WHERE label = 'test_fact_at_root'`

**Expected:**
```
id: "elem-abc123"
label: "test_fact_at_root"
basePolarity: "pos"
baseLocusId: "locus-xyz789"  // ← Should reference locus with path "0"
entitled: true
```

**✅ Pass Criteria:**
- Record exists
- `baseLocusId` is not null
- Points to locus with path "0"

**Status:** [✅] Pass [ ] Fail [ ] Not Tested

**Actual Result:**
```sql
INSERT INTO "LudicCommitmentElement" (
  "id", "ownerId", "basePolarity", "baseLocusId", 
  "label", "extJson", "ludicCommitmentStateId", "entitled"
) VALUES (
  'cmiia9mm1001sg1z04arw6xs7', 
  'Opponent', 
  'pos', 
  'cmhl0gayg0018g1gwzmuufjee',  -- ← LOCUS ID
  'test_fact_at_root', 
  '{"derived": false, "designIds": []}', 
  'cmii9fej3000ag1z0sabtxi18', 
  'true'
);
```
✅ **PASS** - baseLocusId populated correctly

---

### Test 1.3: Verify Locus Relationship

**Steps:**
1. In database, find the `baseLocusId` from Test 1.2
2. Query: `SELECT * FROM LudicLocus WHERE id = '[baseLocusId]'`

**Expected:**
```
id: "locus-xyz789"
dialogueId: "[your-deliberation-id]"
path: "0"
parentId: null  // root has no parent
```

**✅ Pass Criteria:**
- Locus exists
- Path is "0"
- DialogueId matches deliberation

**Status:** [✅] Pass [ ] Fail [ ] Not Tested

**Actual Result:**
```sql
INSERT INTO "LudicLocus" (
  "id", "path", "parentId", "createdByTurnId", 
  "extJson", "dialogueId"
) VALUES (
  'cmhl0gayg0018g1gwzmuufjee',  -- ← MATCHES baseLocusId above
  '0',  -- ← ROOT PATH
  null,  -- ← NO PARENT
  null, 
  null, 
  'ludics-forest-demo'  -- ← MATCHES DELIBERATION ID
);
```
✅ **PASS** - Locus properly linked to deliberation, path="0", no parent

---

## Integration Point 2: Acts Carry Commitment Content 📝

**Theory:** `LudicAct.expression` contains the text of commitments

### Test 2.1: Inspect Act Expression

**Steps:**
1. Navigate to LudicsPanel
2. Expand **Loci Tree** (Proponent side)
3. Look for acts at various loci
4. Click on an act to see details

**Expected:**
- Acts show `expression` field
- Expression contains meaningful text (e.g., "IPCC Report 2021")
- Not all acts have expressions (some are structural only)

**✅ Pass Criteria:**
- At least some acts have non-empty `expression`
- Expression text is human-readable

**Status:** [✅] Pass [ ] Fail [ ] Not Tested

**Actual Result:**
Acts from `/api/ludics/designs/semantic/batch` show expressions:
```json
{
  "id": "cmiiakaox00mqg1z09mr3esen",
  "kind": "PROPER",
  "polarity": "P",
  "expression": "Carbon taxes are more economically efficient than cap-and-trade",
  "locusPath": "0.1",
  "ramification": ["1"]
}
```
Multiple acts found with meaningful expressions at various loci (0.1 through 0.90).
✅ **PASS** - Acts contain dialogue content in expression field

**Note:** Commitments themselves are NOT in act expressions, they're stored separately via `/api/commitments/state`:
```json
{
  "facts": [
    {"label": "test_fact_at_root", "entitled": true, "locusPath": "0"}
  ]
}
```
This is **correct architecture** - acts carry dialogue claims, commitments are metadata/inference layer.

---

### Test 2.2: Check Act in Database

**Steps:**
1. Find a compiled design ID from UI
2. Query: `SELECT * FROM LudicAct WHERE designId = '[design-id]' LIMIT 5`

**Expected:**
```sql
id | designId | kind | polarity | expression           | locusId
---|----------|------|----------|---------------------|----------
a1 | design-x | PROPER | P      | "Traffic is high"   | locus-1
a2 | design-x | PROPER | O      | "Why?"              | locus-2
a3 | design-x | DAIMON | null   | "END"               | locus-3
```

**✅ Pass Criteria:**
- Some acts have populated `expression` field
- Expressions relate to dialogue content

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

---

## Integration Point 3: Concession Creates Commitments 🤝

**Theory:** When you concede, it creates BOTH Ludics acts AND commitment elements

### Test 3.1: Find Concession UI

**Steps:**
1. In LudicsPanel, look for **concession popover** or button
2. This might appear:
   - As a button on locus nodes in tree
   - In a context menu
   - In the "Concede" action area

**Current Status Check:**
- Where is the concession UI located?
- Is it visible/accessible?

**✅ Pass Criteria:**
- Concession UI exists and is findable
- (If not found, note location for documentation)

**Status:** [ ] Found [ ] Not Found [ ] Hidden

**Location:** _________________________________

---

### Test 3.2: Execute Concession

**Steps:**
1. Click concession button/option
2. Modal/popover should appear
3. Enter proposition text: `conceded_proposition_test`
4. Select locus (or use default)
5. Click "Concede" or "Submit"

**Expected Flow:**
```
User clicks Concede
  ↓
POST /api/ludics/concession
  ↓
Backend calls:
  1. appendActs() - creates Ludics acts
  2. applyToCS() - creates commitment element
  ↓
UI refreshes
```

**✅ Pass Criteria:**
- Request completes (200 OK)
- No errors in console or terminal

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

---

### Test 3.3: Verify Commitment Created

**Steps:**
1. After conceding from Test 3.2
2. Go to **CommitmentsPanel** for the conceding participant
3. Check Facts list

**Expected:**
- New fact appears: `conceded_proposition_test`
- Fact is NOT marked as derived (manual concession)
- Fact is entitled (✅ icon)

**✅ Pass Criteria:**
- Fact visible in UI
- Correct text
- Proper status indicators

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

---

### Test 3.4: Verify Acts Created

**Steps:**
1. After conceding from Test 3.2
2. Query database:
```sql
SELECT * FROM LudicAct 
WHERE expression LIKE '%conceded_proposition_test%'
ORDER BY orderInDesign DESC
LIMIT 2
```

**Expected:**
```
Two acts created:
1. Positive act: (P, locus, [locus.1], "conceded_proposition_test")
2. Negative act: (O, locus.1, [], "ACK")
```

**✅ Pass Criteria:**
- Two new acts found
- Correct polarity sequence
- Correct ramification

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

---

## Integration Point 4: Inference Uses Committed Facts ✅

**Theory:** When you click "Infer", it uses facts to derive new facts via rules

### Test 4.1: Basic Inference

**Steps:**
1. Clear all existing facts/rules in CommitmentsPanel
2. Add fact: `base_fact`
3. Add rule: `base_fact -> derived_fact`
4. Click "Infer" button

**Expected:**
- `derived_fact` appears in Facts column
- Marked with green background (derived)
- Shows in "+ derived: derived_fact" summary at top

**✅ Pass Criteria:**
- Inference runs without error
- Derived fact appears
- Visual indicator (green) present

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

---

### Test 4.2: Inference Respects Entitlement

**Steps:**
1. Keep setup from Test 4.1
2. Click ✅ icon next to `base_fact` (suspend it)
3. Icon should change to ⚠️
4. Click "Infer" again

**Expected:**
- `derived_fact` does NOT appear (or disappears if was there)
- Fact count decreases
- Summary shows no derived facts

**✅ Pass Criteria:**
- Suspended fact not used in inference
- Derived facts dependent on it removed
- UI updates correctly

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

---

### Test 4.3: Re-enable and Re-infer

**Steps:**
1. Continue from Test 4.2
2. Click ⚠️ icon next to `base_fact` (restore entitlement)
3. Icon changes back to ✅
4. Click "Infer"

**Expected:**
- `derived_fact` reappears
- Green highlighting restored
- Summary updated

**✅ Pass Criteria:**
- Inference uses re-enabled fact
- System is stateless (same result as Test 4.1)

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

---

## Integration Point 5: Persist Derived Toggle 💾

**Theory:** Checkbox controls whether derived facts are saved to database

### Test 5.1: Persist OFF (Default)

**Steps:**
1. Clear all facts/rules
2. **Uncheck** "persist derived" checkbox (if checked)
3. Add fact: `X`
4. Add rule: `X -> Y`
5. Click "Infer"
6. `Y` appears (green)
7. **Reload the page** (hard refresh: Cmd+Shift+R)

**Expected After Reload:**
- Fact `X` still exists (was manually added)
- Rule `X -> Y` still exists
- Fact `Y` is GONE (was derived, not persisted)

**✅ Pass Criteria:**
- Only manually-added facts survive reload
- Derived facts disappear

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

---

### Test 5.2: Persist ON

**Steps:**
1. Clear all facts/rules
2. **Check** "persist derived" checkbox
3. Add fact: `A`
4. Add rule: `A -> B`
5. Click "Infer"
6. `B` appears (green)
7. **Reload the page**

**Expected After Reload:**
- Fact `A` exists
- Rule `A -> B` exists
- Fact `B` STILL exists (persisted)
- `B` is marked as derived (green background)

**✅ Pass Criteria:**
- Derived facts survive reload
- Still visually marked as derived
- "Clear Derived" button can remove them

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

---

## Integration Point 6: Contradiction Detection 🚨

**Theory:** System detects when facts contradict (X and not X)

### Test 6.1: Explicit Contradiction

**Steps:**
1. Clear all facts/rules
2. Add fact: `traffic_good`
3. Add fact: `not traffic_good`
4. Click "Infer"

**Expected:**
- Red warning appears at top: "⟂ traffic_good vs not traffic_good"
- OR similar contradiction indicator
- Both facts remain visible
- May see toast notification

**✅ Pass Criteria:**
- Contradiction detected and displayed
- System doesn't crash
- Clear indication which facts conflict

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

---

### Test 6.2: Derived Contradiction

**Steps:**
1. Clear all
2. Add facts: `congestion_high`, `traffic_good`
3. Add rule: `congestion_high -> not traffic_good`
4. Click "Infer"

**Expected:**
- `not traffic_good` is derived (green)
- Contradiction detected: `traffic_good` vs `not traffic_good`
- Warning appears: "⟂ traffic_good vs not traffic_good"

**✅ Pass Criteria:**
- System detects contradiction even when one fact is derived
- Both direct and indirect conflicts caught

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

---

## Integration Point 7: UI Shows Both Systems Side-by-Side 👁️

**Theory:** Ludics and Commitments panels are visible simultaneously

### Test 7.1: Panel Layout

**Steps:**
1. Navigate to deliberation with Ludics tab
2. Observe layout

**Expected:**
- LudicsPanel visible (top section)
- CommitmentsPanel visible (bottom section or side-by-side)
- Both panels for Proponent AND Opponent
- Can interact with both without switching views

**✅ Pass Criteria:**
- Both systems visible
- No need to toggle between views
- Clear visual separation

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

---

### Test 7.2: Data Consistency

**Steps:**
1. Note deliberation ID from URL
2. In CommitmentsPanel, note current facts
3. In database, verify:
   ```sql
   SELECT dialogueId FROM LudicLocus WHERE path = '0' LIMIT 1
   ```
4. Check that dialogueId matches deliberation ID

**Expected:**
- Both systems use same `deliberationId` / `dialogueId`
- Data is scoped to same context
- No data leakage between deliberations

**✅ Pass Criteria:**
- IDs match
- Systems reference same deliberation
- Scoping correct

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

---

## Integration Point 8: Event Bus Synchronization 📡

**Theory:** Changes in one system trigger updates in the other via event bus

### Test 8.1: Commitment → Ludics Refresh

**Steps:**
1. Open browser DevTools → Console
2. In CommitmentsPanel, add a fact
3. Watch for event emissions in console

**Expected Console Output:**
```
[bus] Emitting: dialogue:cs:refresh { ownerId: "Proponent", csId: "..." }
```

**✅ Pass Criteria:**
- Event emitted
- Contains correct data
- No errors

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

---

### Test 8.2: Cross-Component Update

**Steps:**
1. Have both Proponent and Opponent CommitmentsPanels visible
2. Add a fact to Proponent panel
3. Observe if any visual update occurs

**Expected:**
- Proponent panel updates immediately (new fact appears)
- Opponent panel may or may not update (depends on event subscription)
- No errors or stale state

**✅ Pass Criteria:**
- Component refreshes appropriately
- State stays consistent

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

---

## Integration Point 9: Locus Anchoring in Database ⚓

**Theory:** Each commitment element points to a specific locus

### Test 9.1: Query Commitment-Locus Join

**Steps:**
1. In database, run:
```sql
SELECT 
  ce.label,
  ce.basePolarity,
  l.path,
  l.dialogueId
FROM LudicCommitmentElement ce
JOIN LudicLocus l ON ce.baseLocusId = l.id
WHERE l.dialogueId = '[your-deliberation-id]'
LIMIT 10
```

**Expected:**
- Results show facts/rules with their locus paths
- All should have path (most likely "0" for root)
- Join successful (no orphaned commitments)

**✅ Pass Criteria:**
- Query returns results
- All commitments have valid locus
- Paths are correct format (e.g., "0", "0.1", "0.2.1")

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

---

### Test 9.2: Check Multiple Loci

**Steps:**
1. Query distinct locus paths for commitments:
```sql
SELECT DISTINCT l.path
FROM LudicCommitmentElement ce
JOIN LudicLocus l ON ce.baseLocusId = l.id
WHERE l.dialogueId = '[your-deliberation-id]'
ORDER BY l.path
```

**Expected:**
- Currently: Likely only "0" (root locus)
- This is expected since we don't have scoped UI yet

**✅ Pass Criteria:**
- Query succeeds
- Returns at least "0"
- (Multiple paths would be bonus, but not required yet)

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

---

## Integration Point 10: Concession API Endpoint 🔌

**Theory:** `/api/ludics/concession` endpoint bridges both systems

### Test 10.1: API Direct Test

**Steps:**
1. Get deliberation ID from URL
2. In browser console, run:
```javascript
fetch('/api/ludics/concession', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dialogueId: 'YOUR_DELIBERATION_ID',
    concedingParticipantId: 'Opponent',
    anchorLocus: '0',
    proposition: {
      text: 'api_test_concession',
      baseLocus: '0'
    }
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

**Expected Response:**
```json
{
  "ok": true,
  "designId": "...",
  "actIds": ["...", "..."]
}
```

**✅ Pass Criteria:**
- 200 OK status
- Response has `ok: true`
- No errors in terminal or browser

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

---

### Test 10.2: Verify API Created Commitment

**Steps:**
1. After Test 10.1 succeeds
2. Go to CommitmentsPanel (Opponent)
3. Click "Reload" button if needed

**Expected:**
- New fact appears: `api_test_concession`
- Located in Opponent's facts (not Proponent)
- At locus "0" (root)

**✅ Pass Criteria:**
- Fact visible in UI
- Correct owner
- System synchronized

**Status:** [ ] Pass [ ] Fail [ ] Not Tested

---

## Summary Checklist

### ✅ Working Integrations

- [ ] Test 1.1: Default locus in requests
- [ ] Test 1.2: Database storage with locus
- [ ] Test 1.3: Locus relationship valid
- [ ] Test 2.1: Acts have expressions
- [ ] Test 2.2: Acts in database
- [ ] Test 3.1: Concession UI found
- [ ] Test 3.2: Concession executes
- [ ] Test 3.3: Commitment created
- [ ] Test 3.4: Acts created
- [ ] Test 4.1: Basic inference works
- [ ] Test 4.2: Entitlement respected
- [ ] Test 4.3: Re-enable works
- [ ] Test 5.1: Persist OFF works
- [ ] Test 5.2: Persist ON works
- [ ] Test 6.1: Explicit contradiction detected
- [ ] Test 6.2: Derived contradiction detected
- [ ] Test 7.1: Panel layout correct
- [ ] Test 7.2: Data consistency
- [ ] Test 8.1: Events emitted
- [ ] Test 8.2: Cross-component updates
- [ ] Test 9.1: Locus join query works
- [ ] Test 9.2: Locus paths correct
- [ ] Test 10.1: API endpoint works
- [ ] Test 10.2: API creates commitment

**Total Tests:** 24  
**Passed:** ___ / 24  
**Failed:** ___ / 24  
**Blocked:** ___ / 24

---

## Issues Found During Testing

### Issue 1: Cannot Specify Locus Path in CommitmentsPanel UI
**Test:** Integration Point 1 (Locus Anchoring)  
**Severity:** [✓] Critical [ ] Major [ ] Minor  
**Description:**
CommitmentsPanel component only allows adding facts/rules to default locus "0" (root). No UI control to specify target locus path like "0.1", "0.2", etc.

**Expected:**
- Dropdown or input field to select target locus
- Should list available loci from current ludics tree
- Allow user to anchor commitment at specific point in dialogue

**Actual:**
- `baseLocusPath` always defaults to "0"
- No way to add facts at child loci (0.1, 0.2, etc.)
- Blocks testing of locus-scoped inference

**Fix Required:** [✓] Yes [ ] No
**Priority:** HIGH - Required for Phase 5 scoped inference
**Blocks:** Tests 9.2, and all locus-scoped feature development

---

### Issue 2: Promote to Ludics 404 Error - Root Cause Found
**Test:** Promotion from CommitmentStorePanel  
**Severity:** [✓] Critical [ ] Major [ ] Minor  
**Description:**
POST to `/api/commitments/promote` returns 404 with message "Active commitment not found"

**Request:**
```json
{
  "deliberationId": "ludics-forest-demo",
  "participantId": "12",
  "proposition": "Sample Conclusion A",
  "targetOwnerId": "Proponent",
  "basePolarity": "pos",
  "targetLocusPath": "0.1"
}
```

**Response:**
```json
{"ok": false, "error": "Active commitment not found"}
```
Status: 404

**Root Cause:**
The `/api/commitments/promote/route.ts` (lines 91-100) looks for a **Dialogue Commitment** record:
```typescript
const commitment = await prisma.commitment.findFirst({
  where: {
    deliberationId,
    participantId,
    proposition,
    isRetracted: false,
  },
});

if (!commitment) {
  return NextResponse.json(
    { ok: false, error: "Active commitment not found" },
    { status: 404 }
  );
}
```

This endpoint is designed for the **Dialogue → Ludics** promotion flow:
1. User creates commitment in dialogue/AIF system (stored in `Commitment` table)
2. User clicks "Promote to Ludics" 
3. System creates `LudicCommitmentElement` and links via `CommitmentLudicMapping`

**Why It's Failing:**
In `ludics-forest-demo`, you're working directly in the Ludics system without creating dialogue commitments first. The `CommitmentStorePanel` expects to find source records that don't exist.

**Two Systems, Two Workflows:**

**Flow A: Dialogue → Ludics** (what this endpoint supports)
```
CommitmentStorePanel 
  → finds Commitment records
  → Promote button
  → POST /api/commitments/promote
  → creates LudicCommitmentElement
  → creates CommitmentLudicMapping link
```

**Flow B: Direct Ludics** (what you're using in demo)
```
CommitmentsPanel (in Ludics tab)
  → directly creates LudicCommitmentElement
  → stored with baseLocusId
  → NO dialogue Commitment record
  → NO mapping needed
```

**Fix Options:**

**Option 1: Create Dialogue Commitments First** (workaround for testing)
- Use the regular dialogue UI to create commitments
- Then promote them via CommitmentStorePanel
- This tests the full integration flow

**Option 2: Add Direct Ludics → Dialogue Export** (new feature)
- Create endpoint: POST `/api/commitments/export-from-ludics`
- Reverse direction: takes LudicCommitmentElement, creates Commitment
- Would enable "publishing" ludics results back to dialogue

**Option 3: Make Promote Endpoint Work Both Ways** (refactor)
- Check if source is dialogue Commitment OR LudicCommitmentElement
- Handle both cases in same endpoint
- More complex logic but unified interface

**Fix Required:** [✓] Yes [ ] No
**Priority:** MEDIUM - This is expected behavior, not a bug
**Action:** Document the two workflows clearly, decide if reverse flow is needed

**Testing Verdict:** ⚠️ PASS with caveat
- Promote endpoint works correctly for its intended purpose (Dialogue → Ludics)
- Just not applicable to direct Ludics workflow
- No code fix needed unless reverse flow desired

---

### Issue 3: [Title]
**Test:** [Test number]  
**Severity:** [ ] Critical [ ] Major [ ] Minor  
**Description:**

**Expected:**

**Actual:**

**Fix Required:** [ ] Yes [ ] No

---

## Next Steps After Testing

### If All Tests Pass ✅
→ Proceed to implement:
1. Locus-scoped UI (show commitments per locus)
2. Inheritance logic (child loci see parent commitments)
3. Semantic divergence (contradiction checking during stepping)

### If Tests Fail ❌
→ Fix issues in this priority order:
1. **Critical**: Database schema issues, broken API endpoints
2. **Major**: Inference not working, contradictions not detected
3. **Minor**: UI polish, event bus timing

---

## Testing Notes

**Tester:** _________________________  
**Date:** November 27, 2025  
**Deliberation Used:** _________________________  
**Browser:** _________________________  
**Special Observations:**




---

**Status:** Ready for manual testing  
**Estimated Time:** 45-60 minutes  
**Next:** Report findings before implementing scoped features
