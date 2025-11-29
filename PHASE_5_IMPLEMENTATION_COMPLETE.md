# Phase 5 Enhancements: Implementation Complete

**Date:** November 27, 2025  
**Status:** ✅ All Three Features Implemented  
**Estimated Time:** 2 hours  
**Actual Time:** ~2 hours

---

## Summary

Implemented three critical features to improve Commitments ↔ Ludics integration:

1. ✅ **Fixed promote endpoint** - Auto-creates Commitment records when missing
2. ✅ **Added locus selector** - UI to target specific loci (0, 0.1, 0.2, etc.)
3. ✅ **Added export-from-ludics** - Reverse flow to publish ludics facts back to dialogue

---

## 1. Promote Endpoint Fix 🔧

**Problem:** POST `/api/commitments/promote` returned 404 "Active commitment not found" when trying to promote from CommitmentStorePanel because no source Commitment record existed in the dialogue system.

**Root Cause:** The promote endpoint expected a pre-existing `Commitment` record, but in direct ludics workflows, these don't exist.

**Solution:** Modified `/app/api/commitments/promote/route.ts` to auto-create missing Commitment records instead of failing.

### Changes Made

**File:** `app/api/commitments/promote/route.ts` (lines 84-107)

**Before:**
```typescript
const commitment = await prisma.commitment.findFirst({
  where: { deliberationId, participantId, proposition, isRetracted: false },
});

if (!commitment) {
  return NextResponse.json(
    { ok: false, error: "Active commitment not found" },
    { status: 404 }
  );
}
```

**After:**
```typescript
let commitment = await prisma.commitment.findFirst({
  where: { deliberationId, participantId, proposition, isRetracted: false },
});

// If commitment doesn't exist, create it (enables direct ludics → dialogue flow)
if (!commitment) {
  console.log(`[promote] Creating new Commitment record for participant ${participantId}`);
  commitment = await prisma.commitment.create({
    data: { deliberationId, participantId, proposition, isRetracted: false },
  });
}
```

### Testing

**Request:**
```json
POST /api/commitments/promote
{
  "deliberationId": "ludics-forest-demo",
  "participantId": "12",
  "proposition": "Property P also holds in case C₂.",
  "targetOwnerId": "Proponent",
  "basePolarity": "pos",
  "targetLocusPath": "0"
}
```

**Expected Response:**
```json
{
  "ok": true,
  "mapping": {
    "id": "...",
    "dialogueCommitmentId": "...",
    "ludicCommitmentElementId": "...",
    "promotedAt": "2025-11-27T...",
    ...
  }
}
```

**Status:** ✅ Ready to test (dev server restart may be needed)

---

## 2. Locus Selector UI 🎯

**Problem:** CommitmentsPanel always defaulted to root locus "0". No way to add facts/rules at specific loci (0.1, 0.2, etc.), blocking locus-scoped inference implementation.

**Solution:** Added dropdown selector to choose target locus before adding facts/rules.

### Changes Made

**File:** `packages/ludics-react/CommitmentsPanel.tsx`

#### A. Added State Management (lines 25-28)
```typescript
const [selectedLocusPath, setSelectedLocusPath] = React.useState<string>('0');
const [availableLoci, setAvailableLoci] = React.useState<Array<{path: string, label: string}>>([
  {path: '0', label: '0 (root)'}
]);
```

#### B. Fetch Available Loci on Mount (lines 87-103)
```typescript
React.useEffect(() => {
  const s = schedRef.current;
  s.mounted = true;
  scheduleLoad('mount');
  
  // Fetch available loci from ludics designs
  fetch(`/api/ludics/loci?dialogueId=${encodeURIComponent(dialogueId)}`)
    .then(r => r.json())
    .then(data => {
      if (data.ok && data.loci) {
        const lociOptions = data.loci.map((l: any) => ({
          path: l.path,
          label: l.path === '0' ? '0 (root)' : l.path
        }));
        setAvailableLoci(lociOptions.length > 0 ? lociOptions : [{path: '0', label: '0 (root)'}]);
      }
    })
    .catch(err => console.warn('Could not fetch loci:', err));
  // ...
}, [scheduleLoad, dialogueId, ownerId]);
```

#### C. Updated addFact() to Use Selected Locus (line 176)
```typescript
ops: { add: [{ label: v, basePolarity: 'pos' as const, baseLocusPath: selectedLocusPath }] }
```

#### D. Updated addRule() to Use Selected Locus (line 201)
```typescript
ops: { add: [{ label: v, basePolarity: 'neg' as const, baseLocusPath: selectedLocusPath }] }
```

#### E. Added UI Selector (lines 305-317)
```typescript
<div className="flex gap-2">
  {/* Locus Selector */}
  <div className="flex items-center gap-1">
    <label className="text-[11px] text-slate-600">@</label>
    <select
      value={selectedLocusPath}
      onChange={(e) => setSelectedLocusPath(e.target.value)}
      className="text-[11px] px-1.5 py-1 rounded border border-slate-300 bg-white"
    >
      {availableLoci.map(locus => (
        <option key={locus.path} value={locus.path}>{locus.label}</option>
      ))}
    </select>
  </div>
  
  <input ... />
</div>
```

#### F. Locus Display Already Present (line 419)
Facts already show locus path with clickable link:
```typescript
{f.locusPath ? (
  <button className="ml-1 text-[11px] underline decoration-dotted text-sky-700"
    title="Focus this locus"
    onClick={() => {
      window.dispatchEvent(new CustomEvent('ludics:focus', {
        detail: { deliberationId: dialogueId, phase: 'focus-P' }
      }));
      window.dispatchEvent(new CustomEvent('dialogue:moves:refresh'));
    }}
  >
    @{f.locusPath}
  </button>
) : null}
```

### New API Endpoint

**File:** `app/api/ludics/loci/route.ts` (NEW)

```typescript
GET /api/ludics/loci?dialogueId=<id>

Response:
{
  "ok": true,
  "loci": [
    { "id": "...", "path": "0", "parentId": null },
    { "id": "...", "path": "0.1", "parentId": "..." },
    { "id": "...", "path": "0.2", "parentId": "..." },
    ...
  ]
}
```

Fetches all loci for a dialogue, ordered by path.

### Testing

1. Open deliberation with compiled ludics designs
2. Open Ludics tab → CommitmentsPanel
3. Look for "@ [dropdown]" before the fact input field
4. Dropdown should show: "0 (root)", "0.1", "0.2", etc.
5. Select a non-root locus (e.g., "0.1")
6. Add a fact: `test_fact_at_0.1`
7. Fact should appear with `@0.1` indicator
8. Verify in database:
   ```sql
   SELECT label, baseLocusId FROM LudicCommitmentElement 
   WHERE label = 'test_fact_at_0.1'
   ```
9. Join to LudicLocus to confirm path:
   ```sql
   SELECT ce.label, l.path 
   FROM LudicCommitmentElement ce
   JOIN LudicLocus l ON ce.baseLocusId = l.id
   WHERE ce.label = 'test_fact_at_0.1'
   ```

**Expected:** `path = "0.1"`

---

## 3. Export-from-Ludics Endpoint 🔄

**Problem:** No way to publish ludics inference results back to the dialogue system. Promotion was one-way (Dialogue → Ludics).

**Solution:** Created reverse flow endpoint that takes LudicCommitmentElement IDs and creates corresponding Commitment records in the dialogue system.

### New API Endpoint

**File:** `app/api/commitments/export-from-ludics/route.ts` (NEW - 244 lines)

```typescript
POST /api/commitments/export-from-ludics

Request:
{
  "deliberationId": "ludics-forest-demo",
  "ludicCommitmentElementIds": ["elem1", "elem2", "elem3"],
  "targetParticipantId": "Opponent" // optional, defaults to element.ownerId
}

Response:
{
  "ok": true,
  "created": [
    {
      "commitmentId": "cmt123",
      "ludicElementId": "elem1",
      "proposition": "fact_label",
      "participantId": "Opponent"
    },
    ...
  ],
  "skipped": [
    {
      "ludicElementId": "elem2",
      "reason": "Commitment already exists in dialogue system"
    },
    ...
  ]
}
```

### Features

- ✅ Fetches ludic commitment elements by ID
- ✅ Verifies all belong to same deliberation
- ✅ Checks for existing commitments (deduplication)
- ✅ Checks for existing mappings (prevents re-export)
- ✅ Creates Commitment records in dialogue system
- ✅ Creates CommitmentLudicMapping links
- ✅ Emits refresh events for affected participants
- ✅ Returns detailed summary (created/skipped)

### Supporting Endpoint

**File:** `app/api/commitments/elements/route.ts` (NEW)

```typescript
GET /api/commitments/elements?dialogueId=<id>&ownerId=<owner>

Response:
{
  "ok": true,
  "elements": [
    {
      "id": "elem123",
      "label": "fact_name",
      "basePolarity": "pos",
      "entitled": true,
      "locusPath": "0",
      "extJson": { "derived": false, ... }
    },
    ...
  ]
}
```

Fetches raw LudicCommitmentElement records with IDs (needed for export).

### UI Integration

**File:** `packages/ludics-react/CommitmentsPanel.tsx` (lines 263-334)

Added `exportToDialogue()` function and button:

```typescript
const exportToDialogue = async () => {
  if (!facts.length) {
    alert('No facts to export');
    return;
  }
  
  const confirmed = confirm(
    `Export ${facts.length} fact(s) from Ludics to Dialogue system for participant "${ownerId}"?\n\n` +
    `This will create Commitment records in the dialogue layer.`
  );
  
  if (!confirmed) return;
  
  setBusy(true);
  try {
    // Fetch element IDs
    const elementsRes = await fetch(
      `/api/commitments/elements?dialogueId=${encodeURIComponent(dialogueId)}&ownerId=${encodeURIComponent(ownerId)}`,
      { cache: 'no-store' }
    );
    const elementsData = await elementsRes.json();
    
    const elementIds = elementsData.elements
      .filter((el: any) => el.basePolarity === 'pos') // Only export facts, not rules
      .map((el: any) => el.id);
    
    // Call export endpoint
    const exportRes = await fetch('/api/commitments/export-from-ludics', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        deliberationId: dialogueId,
        ludicCommitmentElementIds: elementIds,
        targetParticipantId: ownerId,
      }),
    });
    
    const exportData = await exportRes.json();
    
    if (!exportData.ok) {
      alert(`Export failed: ${exportData.error}`);
      return;
    }
    
    alert(
      `✓ Exported ${exportData.created?.length || 0} commitment(s) to dialogue\n` +
      `${exportData.skipped?.length || 0} skipped (already exist)`
    );
    
    await load();
  } catch (err) {
    console.error('Export error:', err);
    alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  } finally {
    setBusy(false);
  }
};
```

**Button Added (line 466):**
```typescript
<button 
  className="text-[11px] px-2 py-1 rounded btnv2--ghost bg-white" 
  onClick={exportToDialogue} 
  disabled={busy} 
  title="Export facts to dialogue system"
>
  ↗ Export to Dialogue
</button>
```

### Testing

1. Open deliberation in Ludics tab
2. Add some facts in CommitmentsPanel (Proponent or Opponent)
3. Run inference to derive additional facts
4. Click "↗ Export to Dialogue" button
5. Confirm the export dialog
6. Check response:
   - "✓ Exported N commitment(s) to dialogue"
   - "M skipped (already exist)"
7. Verify in database:
   ```sql
   SELECT * FROM Commitment 
   WHERE deliberationId = 'ludics-forest-demo' 
   AND participantId = 'Proponent'
   ORDER BY createdAt DESC
   ```
8. Verify mappings created:
   ```sql
   SELECT * FROM CommitmentLudicMapping
   WHERE deliberationId = 'ludics-forest-demo'
   ORDER BY promotedAt DESC
   ```
9. Check CommitmentStorePanel in dialogue UI - exported facts should appear

---

## Architecture Overview

### Two-Way Flow Now Supported

```
┌─────────────────────────────────────────────────────────────┐
│                    DIALOGUE SYSTEM                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Commitment (participantId, proposition, ...)       │   │
│  └──────────────────┬──────────────────────────────────┘   │
│                     │                                       │
│                     │ ① PROMOTE                             │
│                     │ (dialogue → ludics)                   │
│                     ↓                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CommitmentLudicMapping (bidirectional link)        │   │
│  └──────────────────┬──────────────────────────────────┘   │
│                     ↑                                       │
│                     │ ② EXPORT                              │
│                     │ (ludics → dialogue)                   │
│                     │                                       │
└─────────────────────┼───────────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────────┐
│                     │         LUDICS SYSTEM                 │
│  ┌──────────────────┴──────────────────────────────────┐   │
│  │  LudicCommitmentElement (ownerId, label, ...)       │   │
│  │  - baseLocusId → LudicLocus (path: 0, 0.1, 0.2)    │   │
│  │  - basePolarity: pos (facts) / neg (rules)          │   │
│  │  - extJson: { derived, designIds }                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Features:                                                  │
│  - Locus-scoped storage (now with UI selector)             │
│  - Forward-chaining inference engine                        │
│  - Contradiction detection                                  │
│  - Entitlement management                                   │
│  - Export to dialogue (NEW)                                 │
└─────────────────────────────────────────────────────────────┘
```

### Use Cases

**Use Case 1: Dialogue → Ludics (Existing, Now Fixed)**
1. User creates commitment in dialogue UI (CommitmentStorePanel)
2. Stored as `Commitment` record
3. User clicks "Add to Ludics"
4. POST `/api/commitments/promote` creates `LudicCommitmentElement`
5. Creates `CommitmentLudicMapping` link
6. Now appears in Ludics CommitmentsPanel

**Use Case 2: Direct Ludics Work (Primary)**
1. User works directly in Ludics tab
2. Adds facts/rules at specific loci via CommitmentsPanel
3. Runs inference to derive conclusions
4. Results stored as `LudicCommitmentElement` records
5. No dialogue commitments created (pure ludics)

**Use Case 3: Ludics → Dialogue (NEW)**
1. User has derived facts in Ludics CommitmentsPanel
2. Clicks "↗ Export to Dialogue"
3. POST `/api/commitments/export-from-ludics` creates `Commitment` records
4. Creates `CommitmentLudicMapping` links
5. Facts now visible in dialogue CommitmentStorePanel
6. Can be used in regular dialogue flow

---

## Files Created/Modified

### Created (4 files)
1. `app/api/ludics/loci/route.ts` - GET endpoint to fetch loci
2. `app/api/commitments/export-from-ludics/route.ts` - POST endpoint for reverse flow
3. `app/api/commitments/elements/route.ts` - GET endpoint for element IDs
4. This summary document

### Modified (2 files)
1. `app/api/commitments/promote/route.ts` - Auto-create missing Commitments
2. `packages/ludics-react/CommitmentsPanel.tsx` - Locus selector UI + export button

---

## Testing Checklist

### 1. Promote Endpoint Fix
- [ ] Restart dev server: `npm run dev`
- [ ] Navigate to CommitmentStorePanel (dialogue tab)
- [ ] Click "Add to Ludics" on a commitment
- [ ] Should succeed (no 404 error)
- [ ] Check database for new Commitment + CommitmentLudicMapping records

### 2. Locus Selector
- [ ] Open Ludics tab → CommitmentsPanel
- [ ] Verify "@ [dropdown]" appears before input
- [ ] Dropdown shows available loci (0, 0.1, 0.2, etc.)
- [ ] Select locus "0.1"
- [ ] Add fact: `test_locus_selector`
- [ ] Fact appears with `@0.1` indicator
- [ ] Click `@0.1` link - should trigger focus event
- [ ] Database: verify `baseLocusId` points to locus with path "0.1"

### 3. Export to Dialogue
- [ ] In Ludics CommitmentsPanel, add facts
- [ ] Run inference to derive additional facts
- [ ] Click "↗ Export to Dialogue" button
- [ ] Confirm dialog appears
- [ ] Check success message: "Exported N commitments"
- [ ] Open CommitmentStorePanel (dialogue tab)
- [ ] Exported facts should appear
- [ ] Database: verify Commitment records created
- [ ] Database: verify CommitmentLudicMapping records created
- [ ] Try exporting again - should skip (already exist)

---

## Next Steps (Phase 5 Continued)

With these features complete, ready to proceed with:

### Step 1: Locus-Scoped Inference (2-3 days)
- Update `interactCE()` to accept `locusPath` parameter
- Implement inheritance: child loci see parent commitments
- Update UI to show inherited vs local facts
- Visual indicators for scope hierarchy

### Step 2: Semantic Divergence (1 day)
- Update `step()` function to check commitments at current locus
- Run inference for both Proponent and Opponent
- Mark trace as DIVERGENT if contradictions found
- UI to show commitment-based divergence reasons

### Step 3: Commitment Chronicles (future)
- Track commitment evolution across loci
- Show history of fact additions/retractions
- Visualize inference chains through tree

---

## Known Issues / Limitations

1. **Export only handles facts, not rules** - Rules are ludics-specific inference logic, may not make sense in dialogue context
2. **No bulk locus change** - Can't move existing facts to different locus (would need migration endpoint)
3. **Locus selector shows all loci** - Could filter to only "active" or "relevant" loci for better UX
4. **No inheritance yet** - Child loci don't see parent facts (Phase 5 step 1)
5. **Export is one-way sync** - Changes to dialogue commitments don't sync back to ludics (by design for now)

---

## Performance Notes

- Locus fetching is lazy (only on panel mount)
- Export fetches all elements then filters - could optimize with server-side filtering
- No pagination for loci dropdown (assumes <100 loci per dialogue)

---

**Status:** ✅ All features implemented and ready for testing  
**Documentation:** Complete  
**Next Action:** Test in UI, then proceed with Phase 5 scoped inference
