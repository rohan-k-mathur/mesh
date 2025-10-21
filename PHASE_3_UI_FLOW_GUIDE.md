# Phase 3 Manual Testing: UI Flow Guide

**Exact step-by-step user flow for testing via DeepDivePanelV2**

---

## Prerequisites

1. ✅ Dev server running: `npm run dev`
2. ✅ Database migration applied: `psql $DATABASE_URL -f database/migrations/20251021_add_metajson_to_conflict_application.sql`
3. ✅ Logged in to the application
4. ✅ Browser DevTools open (F12) - Network tab ready

---

## Part 1: Create Test Deliberation (5 min)

### Step 1.1: Navigate to Deliberations
```
Click: "Deliberations" or "New Deliberation" button
  → Should open deliberation creation form
```

### Step 1.2: Create New Deliberation
```
Fill in:
  - Title: "Phase 3 Testing - CommandCard & GROUNDS"
  - Description: "Testing AIF dialogical actions fixes"

Click: "Create" button
  → Redirects to new deliberation page with DeepDivePanelV2
```

### Step 1.3: Create Initial Claim
```
Look for: Claim composer/input field (usually at top or in sidebar)

Type: "Vaccines are safe and effective"

Click: "Submit" or "Add Claim" button
  → New claim appears in deliberation view
  → Note the claim ID (visible in URL or claim card)
```

### Step 1.4: Create Argument with Scheme
```
Method A: Via Claim Card (if present)
  Click: "Add Argument" button on claim card

Method B: Via Argument Composer
  Look for: "New Argument" or "Compose Argument" section

Fill in:
  - Argument text: "Dr. Fauci, a leading infectious disease expert, confirms vaccine safety"
  - Select conclusion claim: [the claim you just created]
  - **Important**: Select scheme: "ExpertOpinion" (or create if not exists)

Click: "Submit" or "Create Argument"
  → New argument appears in AIFArgumentsListPro
  → Should show scheme badge "ExpertOpinion"
```

**✓ Checkpoint**: You should now see:
- 1 deliberation
- 1 claim: "Vaccines are safe and effective"
- 1 argument with ExpertOpinion scheme

---

## Part 2: Test CommandCard Grid View (10 min)

### Step 2.1: Locate Argument in AIFArgumentsListPro
```
Scroll to: Your newly created argument card
  → Should display in the arguments list panel
  → Look for argument text and metadata (scheme badge, etc.)
```

### Step 2.2: Find LegalMoveToolbar
```
Location: Usually at the bottom of each argument card
  OR: Click "Actions" / "Moves" button on argument card

Look for: Segmented tabs showing "Challenge | Resolve | More"
  → This is the LegalMoveToolbar component
```

### Step 2.3: Switch to Grid View
```
Look for: "Grid View" button (top right of toolbar)
  Location: Should be next to "Show X restricted" button

Click: "Grid View" button
  → Toolbar transforms into 3×3 grid
  → Grid should show:
    Row 1: WHY buttons, CLOSE button (if available)
    Row 2: CONCEDE, RETRACT, ACCEPT_ARGUMENT (context-dependent)
    Row 3: Scaffolds (∀-inst, ∃-witness, Presup? - if WHY has symbols)
```

**Visual Check**:
- ✅ Grid has distinct rows with different button colors
- ✅ WHY buttons show critical question text (e.g., "WHY - Is expert credible?")
- ✅ Disabled buttons appear grayed out
- ✅ Hover over buttons shows tooltips

### Step 2.4: Test Grid Move Execution
```
Click: Any enabled WHY button (e.g., "WHY - Is expert credible?")
  → POST to /api/dialogue/move should appear in Network tab
  → Grid refreshes to show new legal moves
  → GROUNDS buttons should now appear (answering the WHY)
```

**DevTools Check**:
```javascript
// Network tab should show:
POST /api/dialogue/move
Request payload:
{
  "kind": "WHY",
  "payload": {
    "cqId": "eo-1",  // ← specific CQ ID
    "locusPath": "0"
  }
}
```

### Step 2.5: Switch Back to List View
```
Click: "List View" button (same location as Grid View was)
  → Grid disappears
  → Traditional segmented tabs return (Challenge/Resolve/More)
  → All moves still available
```

**✓ Checkpoint**: Grid View works!
- ✅ Toggle button appears
- ✅ 3×3 grid renders
- ✅ Buttons execute moves
- ✅ Can switch back to list view

---

## Part 3: Test GROUNDS→Arguments Creation (15 min)

### Step 3.1: Ask WHY (if not done in Step 2.4)
```
Using Grid View OR List View:

Grid View:
  Click: WHY button for critical question

List View:
  Tab: "Challenge"
  Click: "Ask WHY" button
  Fill in: Brief note (optional)
  Click: "Post WHY"
```

**Result**:
```
→ CQStatus created in database (status: 'open', satisfied: false)
→ Legal moves refresh
→ GROUNDS options appear
```

### Step 3.2: Supply GROUNDS (Long Text - Creates Argument)
```
Grid View:
  Click: GROUNDS button (e.g., "GROUNDS - Provide evidence")

List View:
  Tab: "Challenge"
  Click: "Answer" or GROUNDS button

Either way → Opens compose dialog or inline input

Fill in GROUNDS text (>5 characters):
  "Dr. Fauci has 40 years of experience in infectious diseases,
   led NIAID through multiple pandemics, and has published over
   1,300 peer-reviewed articles. His expertise is widely recognized."

Click: "Submit GROUNDS" or "Post"
```

**DevTools Check**:
```javascript
// Network tab:
POST /api/dialogue/move
Response:
{
  "ok": true,
  "move": {
    "kind": "GROUNDS",
    "payload": {
      "cqId": "eo-1",
      "expression": "Dr. Fauci has 40 years...",
      "createdArgumentId": "arg_xyz123"  // ← NEW! Argument ID
    }
  }
}
```

### Step 3.3: Verify Argument Created
```
Method 1: Check AIFArgumentsListPro
  Scroll to: Arguments list
  Look for: New argument card with text "Dr. Fauci has 40 years..."

Method 2: Database Query (if accessible)
  SQL:
    SELECT id, text, "conclusionClaimId"
    FROM "Argument"
    WHERE text LIKE '%40 years%';

  Expected: Row with the GROUNDS text
```

**Visual Check**:
```
New Argument Card should show:
  ✅ Text: "Dr. Fauci has 40 years of experience..."
  ✅ Conclusion: Links to "Vaccines are safe" claim
  ✅ Scheme: May show scheme badge (if inferred)
  ✅ Has own LegalMoveToolbar (can be attacked!)
```

### Step 3.4: Test Threshold (Short GROUNDS - No Argument)
```
Ask another WHY (if multiple CQs available):
  Click: Different WHY button

Supply short GROUNDS (≤5 characters):
  Fill in: "Yes"
  Click: Submit
```

**DevTools Check**:
```javascript
// Response should NOT have createdArgumentId:
{
  "ok": true,
  "move": {
    "kind": "GROUNDS",
    "payload": {
      "cqId": "eo-2",
      "expression": "Yes"
      // NO createdArgumentId field
    }
  }
}
```

**Visual Check**:
```
AIFArgumentsListPro:
  ✅ No new argument appears for "Yes"
  ✅ CQStatus still updated (CQ checkbox enabled)
```

**✓ Checkpoint**: GROUNDS→Arguments works!
- ✅ Long GROUNDS (>5 chars) create arguments
- ✅ createdArgumentId in response
- ✅ Arguments appear in list
- ✅ Can attack GROUNDS arguments
- ✅ Short GROUNDS (<5 chars) don't create arguments

---

## Part 4: Test End-to-End Dialogue Flow (20 min)

### Step 4.1: Create Full Expert Opinion Argument
```
Start fresh or continue from Part 3:

1. Create Claim:
   "Remote work increases productivity"

2. Create Argument (ExpertOpinion scheme):
   "Stanford research by Nicholas Bloom shows 13% productivity increase"

3. Verify scheme badge shows "ExpertOpinion"
```

### Step 4.2: Ask WHY for CQ #1 (Expert Credibility)
```
Grid View: Click "WHY - Is expert credible?"
OR
List View: Click "Ask WHY" → Select CQ "eo-1"

Fill in note: "How do we know this expert is credible?"
Submit
```

**Result**:
```
→ CQStatus created: cqKey='eo-1', status='open'
→ GROUNDS option appears
```

### Step 4.3: Supply GROUNDS #1
```
Click: GROUNDS button

Fill in:
  "Nicholas Bloom is a Professor of Economics at Stanford,
   specializes in remote work research for 15 years,
   published in top journals like QJE and AER."

Submit
```

**Result**:
```
→ New Argument created (GROUNDS #1)
→ CQStatus updated: status='answered', satisfied=true
→ CQ checkbox auto-enables (Phase 2 Fix #3)
```

### Step 4.4: Attack the GROUNDS Argument
```
Find: The GROUNDS argument in list
  Text: "Nicholas Bloom is a Professor..."

Click: "Counter" or "Attack" button
  → Opens AttackMenuPro

Select: REBUTS (attack the conclusion)

Create counter-claim:
  "Bloom's studies are funded by remote work software companies"

Click: Submit
```

**DevTools Check**:
```javascript
POST /api/ca
Request:
{
  "conflictingClaimId": "claim_counter_id",
  "conflictedClaimId": "claim_original_id",
  "legacyAttackType": "REBUTS",
  "metaJson": {  // ← Phase 2 Fix #3
    "schemeKey": "ExpertOpinion",
    "cqKey": "eo-1",
    "source": "cq-inline-objection-rebut"
  }
}
```

**Visual Check**:
```
Original Argument Card:
  ✅ Attack count increases (e.g., "1 attack")
  ✅ Red attack indicator appears

CQ Panel (if open):
  ✅ CQ checkbox for "eo-1" becomes enabled
  ✅ Can now mark as satisfied/unsatisfied
```

### Step 4.5: Ask WHY for Additional CQs (ExpertOpinion has 5)
```
If using ExpertOpinion scheme, repeat for:
  - CQ eo-2: "Is expert biased?"
  - CQ eo-3: "Is the claim within expert's domain?"
  - CQ eo-4: "Do other experts agree?"
  - CQ eo-5: "Is expert testimony consistent?"

For each:
  1. Ask WHY
  2. Supply GROUNDS (>5 chars → creates argument)
  3. Verify CQ checkbox enables
```

### Step 4.6: CLOSE the Dialogue
```
When all CQs are satisfied:

Grid View:
  Look for: "Close (†)" button in top row
  Status: Should be ENABLED (all CQs satisfied)
  Click: "Close (†)"

List View:
  Tab: "Resolve"
  Look for: "Close (†)" button
  Click: Close button
```

**DevTools Check**:
```javascript
POST /api/dialogue/move
{
  "kind": "CLOSE",
  "payload": {
    "locusPath": "0"
  }
}
```

**Result**:
```
→ Dialogue moves to closed state
→ May show dialogue tree/winningness calculation
→ Legal moves update (CLOSE may become disabled)
```

**✓ Checkpoint**: End-to-end flow complete!
- ✅ WHY creates CQStatus
- ✅ GROUNDS creates Arguments
- ✅ Attacks link to CQs via metaJson
- ✅ CQ checkboxes auto-enable
- ✅ CLOSE available when satisfied
- ✅ All 7 fixes working together

---

## Part 5: Performance Check with Existing Data (10 min)

### Step 5.1: Navigate to Large Deliberation
```
Find: Deliberation with 50+ arguments
  OR: Create 50 arguments via API/bulk import

Navigate to: DeepDivePanelV2 for that deliberation
```

### Step 5.2: Test AIFArgumentsListPro Rendering
```
Open DevTools → Performance tab

Record performance profile:
  1. Click "Record"
  2. Scroll through arguments list
  3. Stop recording after 5 seconds

Check:
  ✅ Scrolling smooth (60fps)
  ✅ Virtualization working (only visible rows render)
  ✅ No layout thrashing
```

### Step 5.3: Test CommandCard Render Time
```
Open DevTools → Performance tab

Record:
  1. Click "Record"
  2. Click "Grid View" button
  3. Stop recording immediately

Measure: Time from click to grid fully rendered
Expected: <100ms

Check in performance profile:
  → "movesToActions" function time
  → "CommandCard" render time
  → Total time to interactive
```

### Step 5.4: Test GROUNDS Creation Performance
```
Using existing argument:

DevTools → Network tab → Clear

1. Ask WHY
   → Measure response time (should be <500ms)

2. Supply GROUNDS (long text)
   → Measure response time
   → Check for "createdArgumentId" overhead

Expected:
  - WHY: 200-500ms
  - GROUNDS: 250-600ms (+50ms for argument creation)
  - No blocking UI during creation
```

### Step 5.5: Check Loading States
```
During GROUNDS submission:

Visual check:
  ✅ Spinner appears on argument card (Phase 2 Fix #7)
  ✅ Spinner shows during ~200-500ms refresh
  ✅ Spinner disappears when refresh completes
  ✅ Updated metadata appears (new attack counts, etc.)
```

**✓ Checkpoint**: Performance validated!
- ✅ 50+ arguments render smoothly
- ✅ CommandCard renders <100ms
- ✅ GROUNDS creation adds minimal overhead
- ✅ Loading states provide feedback

---

## Part 6: Optional - Integrate Multi-CQ UI (30 min)

### Step 6.1: Open CriticalQuestions Component
```
File: components/claims/CriticalQuestions.tsx
Line: ~586 (where schemes.map starts)
```

### Step 6.2: Import MultiCQVisualizer
```typescript
// Add at top of file (around line 8-20):
import { MultiCQVisualizer } from "@/components/claims/MultiCQVisualizer";
```

### Step 6.3: Replace Scheme Rendering
```typescript
// Find this code (around line 586):
{schemes.map((s) => (
  <div key={s.key} className="rounded border bg-white p-2">
    <div className="text-sm font-semibold">{s.title}</div>
    <ul className="mt-1 space-y-2">
      {s.cqs.map((cq) => {
        // ... existing CQ rendering ...
      })}
    </ul>
  </div>
))}

// REPLACE with:
{schemes.map((s) => {
  // Use MultiCQVisualizer for schemes with 5+ CQs
  if (s.cqs.length >= 5) {
    return (
      <MultiCQVisualizer
        key={s.key}
        scheme={s}
        onToggleCQ={toggleCQ}
        canMarkAddressed={canMarkAddressed}
        sigOf={sigOf}
        postingKey={postingKey}
        okKey={okKey}
      >
        {(cq) => {
          const sig = sigOf(s.key, cq.key);
          const rowSug = cq.suggestion ?? suggestionForCQ(s.key, cq.key);
          const groundsVal = groundsDraft[sig] ?? "";

          // Return the action buttons section (copy from original rendering)
          return (
            <div className="flex flex-wrap items-center gap-2">
              {/* WHY button */}
              <button
                className="text-[11px] px-2 py-0.5 border rounded"
                onClick={async () => {
                  // ... existing WHY logic ...
                }}
              >
                WHY
              </button>

              {/* GROUNDS inline input */}
              {/* ... copy existing GROUNDS section ... */}

              {/* Attach button */}
              {/* ... copy existing attach logic ... */}
            </div>
          );
        }}
      </MultiCQVisualizer>
    );
  }

  // Use standard rendering for schemes with <5 CQs
  return (
    <div key={s.key} className="rounded border bg-white p-2">
      {/* ... keep original rendering ... */}
    </div>
  );
})}
```

### Step 6.4: Test with ExpertOpinion Scheme
```
UI Flow:

1. Navigate to argument with ExpertOpinion scheme (5 CQs)

2. Open CQ panel:
   Click: "Critical Questions" button/tab on argument

3. Verify Multi-CQ UI renders:
   ✅ Header shows "ExpertOpinion" title
   ✅ Progress indicator: "0/5 satisfied"
   ✅ Progress bar shows (empty, amber color)
   ✅ Collapse/expand icon visible

4. Check compact grid layout:
   ✅ 2 columns of CQs (on desktop)
   ✅ Checkboxes on left
   ✅ CQ text truncates if too long
   ✅ Action buttons hidden initially

5. Hover over CQ row:
   ✅ Border changes to indigo
   ✅ Action buttons fade in
   ✅ WHY/GROUNDS/Attach buttons appear

6. Satisfy some CQs:
   Mark 2/5 as satisfied

   ✅ Progress updates: "2/5 satisfied"
   ✅ Progress bar fills 40% (blue color)
   ✅ Satisfied CQs show strikethrough

7. Satisfy all CQs:
   Mark 5/5 as satisfied

   ✅ Progress: "5/5 satisfied"
   ✅ Progress bar fills 100% (green color)
   ✅ Footer shows "✓ All critical questions satisfied"

8. Test collapse/expand:
   Click: Header (anywhere except checkbox)

   ✅ CQ list collapses
   ✅ Icon changes to ChevronDown
   ✅ Progress bar still visible

   Click: Header again
   ✅ CQ list expands
   ✅ Icon changes to ChevronUp
```

### Step 6.5: Compare with Standard Rendering
```
Find argument with <5 CQs (e.g., Consequences scheme):

Visual check:
  ✅ Uses standard list layout (no grid)
  ✅ No progress bar
  ✅ No collapse/expand
  ✅ Action buttons always visible

→ Confirms conditional rendering works
```

### Step 6.6: Verify Responsive Behavior
```
Resize browser window:

Desktop (>768px):
  ✅ 2-column grid for 5+ CQs

Tablet/Mobile (<768px):
  ✅ Single column (grid-cols-1)
  ✅ Progress bar still visible
  ✅ Collapse/expand still works
```

**✓ Checkpoint**: Multi-CQ UI integrated!
- ✅ Progress indicator working
- ✅ Compact grid saves space
- ✅ Hover actions smooth
- ✅ Collapse/expand functional
- ✅ Responsive design
- ✅ Backward compatible with <5 CQs

---

## Troubleshooting Guide

### Issue: Grid View button not appearing
```
Check:
  1. LegalMoveToolbar component updated?
     → grep "useCommandCard" components/dialogue/LegalMoveToolbar.tsx

  2. Clear browser cache (Ctrl+Shift+R)

  3. Check browser console for errors
```

### Issue: GROUNDS not creating arguments
```
DevTools → Network tab:

Check response:
  - If createdArgumentId missing → Check text length (must be >5 chars)
  - If targetType not 'claim' → Currently only creates for claims
  - If error 400/500 → Check server logs
```

### Issue: CQ checkboxes not auto-enabling
```
Check:
  1. Database migration applied?
     → SELECT column_name FROM information_schema.columns
        WHERE table_name='ConflictApplication' AND column_name='metaJson';

  2. metaJson in attack request?
     → Network tab: POST /api/ca should include metaJson

  3. Attachment check working?
     → GET /api/cqs/attachments should return attached object
```

### Issue: Multi-CQ UI not rendering
```
Check:
  1. Import added?
     → import { MultiCQVisualizer } from ...

  2. Conditional logic correct?
     → if (s.cqs.length >= 5)

  3. Dependencies installed?
     → npm install lucide-react (for icons)

  4. Browser console errors?
     → Check for missing props or type errors
```

---

## Success Criteria Checklist

After completing all steps above, verify:

### CommandCard (Fix #1)
- [ ] Grid View toggle appears in toolbar
- [ ] 3×3 grid renders with proper layout
- [ ] WHY buttons execute moves
- [ ] GROUNDS buttons work
- [ ] Scaffold buttons dispatch events (check console)
- [ ] Disabled buttons show tooltips
- [ ] Can switch back to List View

### GROUNDS→Arguments (Fix #6)
- [ ] Long GROUNDS (>5 chars) create arguments
- [ ] createdArgumentId in API response
- [ ] Arguments appear in AIFArgumentsListPro
- [ ] GROUNDS arguments can be attacked
- [ ] Short GROUNDS (<5 chars) don't create arguments
- [ ] CQStatus still updates for short GROUNDS

### End-to-End Flow (All 7 Fixes)
- [ ] WHY creates CQStatus with specific cqId
- [ ] GROUNDS updates CQStatus to satisfied
- [ ] Attacks include metaJson (schemeKey, cqKey)
- [ ] CQ checkboxes auto-enable after attacks
- [ ] Loading spinners show during refresh
- [ ] Arguments auto-assigned schemes
- [ ] CLOSE enabled when all CQs satisfied

### Performance
- [ ] 50+ arguments scroll smoothly
- [ ] CommandCard renders <100ms
- [ ] GROUNDS creation adds <100ms overhead
- [ ] No UI blocking during operations

### Multi-CQ UI (Bonus)
- [ ] Progress bar shows for 5+ CQs
- [ ] Compact grid layout renders
- [ ] Collapse/expand works
- [ ] Hover actions appear
- [ ] Responsive design adapts
- [ ] Standard layout for <5 CQs

---

## Next Steps After Testing

1. **Document findings**:
   - Note any bugs or issues
   - Screenshot successful flows
   - Record performance metrics

2. **Create PR**:
   - Summarize all 7 fixes
   - Link to test guides
   - Include screenshots/videos

3. **Deploy**:
   - Run migration on production DB
   - Monitor for errors
   - Gather user feedback

---

**Testing Guide Version**: 1.0
**Last Updated**: 2025-10-21
**Branch**: `claude/debug-aif-arguments-011CUKYh7mJ3H5QUXgvvp4sD`
