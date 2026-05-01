# Quick Testing Guide: Three New Features

**Time Required:** 15-20 minutes  
**Prerequisites:** Dev server running, deliberation with ludics designs compiled

---

## Test 1: Promote Endpoint Fix (5 min)

**What Changed:** Promote endpoint now auto-creates missing Commitment records instead of returning 404

### Steps:
1. Navigate to: `http://localhost:3000/deliberations/ludics-forest-demo`
2. Ensure you're in the **dialogue tab** (not Ludics tab)
3. Look for **CommitmentStorePanel** (may need to scroll or open deep dive panel)
4. If no commitments exist, create one:
   - Type a proposition in the dialogue
   - It should appear in CommitmentStorePanel
5. Find a commitment row and click **"Add to Ludics"** button
6. Modal should open asking for target owner and locus
7. Select: Owner = "Proponent", Locus = "0"
8. Click "Promote"

### Expected Result:
✅ Success toast: "Promoted to Ludics"  
✅ No 404 error  
✅ Fact appears in Ludics CommitmentsPanel (switch to Ludics tab to verify)

### If It Fails:
- Check browser console for errors
- Check terminal for server errors
- Try restarting dev server: `Ctrl+C` then `npm run dev`

---

## Test 2: Locus Selector UI (5 min)

**What Changed:** CommitmentsPanel now has dropdown to select target locus

### Steps:
1. Navigate to Ludics tab in your deliberation
2. Find **CommitmentsPanel** (should show "Commitments — Proponent" or "Commitments — Opponent")
3. Look above the input field for **"@ [dropdown]"**
4. Click the dropdown

### Expected Result:
✅ Dropdown shows available loci:
- "0 (root)"
- "0.1"
- "0.2"
- ... (all loci from compiled designs)

### Add Fact at Specific Locus:
5. Select "0.1" from dropdown
6. Type in input: `test_at_locus_0_1`
7. Click "+ Fact" button
8. Fact should appear in list with **"@0.1"** indicator

### Verify Clickable Locus:
9. Click the **"@0.1"** link next to the fact
10. Should trigger ludics focus event (tree may highlight or scroll)

### Database Verification (optional):
```sql
SELECT ce.label, l.path 
FROM LudicCommitmentElement ce
JOIN LudicLocus l ON ce.baseLocusId = l.id
WHERE ce.label = 'test_at_locus_0_1'
```
Should show: `path = "0.1"`

---

## Test 3: Export to Dialogue (7 min)

**What Changed:** New button to publish ludics facts back to dialogue system

### Setup:
1. In Ludics tab, CommitmentsPanel (Proponent side)
2. Add 2-3 facts:
   - `traffic_high`
   - `revenue_allocated`
   - `public_transit_improved`
3. Add a rule:
   - `traffic_high & revenue_allocated -> public_transit_improved`
4. Click **"Infer"** button
5. Should derive `public_transit_improved` (green background)

### Export:
6. Click **"↗ Export to Dialogue"** button
7. Confirmation dialog appears:
   ```
   Export 3 fact(s) from Ludics to Dialogue system for participant "Proponent"?
   
   This will create Commitment records in the dialogue layer.
   ```
8. Click "OK"

### Expected Result:
✅ Success alert: "✓ Exported 3 commitment(s) to dialogue, 0 skipped"  
✅ No errors in console

### Verify in Dialogue:
9. Switch to **dialogue tab** (not Ludics tab)
10. Find **CommitmentStorePanel**
11. Should see new commitments:
    - "traffic_high"
    - "revenue_allocated"
    - "public_transit_improved"

### Test Deduplication:
12. Switch back to Ludics tab
13. Click **"↗ Export to Dialogue"** again
14. Alert should say: "✓ Exported 0 commitment(s) to dialogue, 3 skipped (already exist)"

### Database Verification (optional):
```sql
-- Check Commitment records created
SELECT * FROM Commitment 
WHERE deliberationId = 'ludics-forest-demo' 
AND participantId = 'Proponent'
ORDER BY createdAt DESC
LIMIT 5;

-- Check mapping records
SELECT * FROM CommitmentLudicMapping
WHERE deliberationId = 'ludics-forest-demo'
ORDER BY promotedAt DESC
LIMIT 5;
```

---

## Common Issues & Fixes

### Issue: Dropdown shows only "0 (root)"
**Cause:** No loci fetched from API  
**Fix:** 
1. Check `/api/ludics/loci?dialogueId=ludics-forest-demo` in browser
2. Should return `{"ok": true, "loci": [...]}`
3. If empty, compile a ludics design first
4. Restart dev server if needed

### Issue: "Export to Dialogue" button missing
**Cause:** Code not hot-reloaded  
**Fix:** 
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Or restart dev server

### Issue: Export fails with "No fact elements found"
**Cause:** `/api/commitments/elements` endpoint not working  
**Fix:** 
1. Check URL in browser: `/api/commitments/elements?dialogueId=ludics-forest-demo&ownerId=Proponent`
2. Should return `{"ok": true, "elements": [...]}`
3. Check terminal for errors

### Issue: Promote still returns 404
**Cause:** Old code cached  
**Fix:**
1. Stop dev server: `Ctrl+C`
2. Clear Next.js cache: `rm -rf .next`
3. Restart: `npm run dev`
4. Wait for compilation to complete

---

## Success Criteria

✅ **Test 1 Passed:** Promote creates commitment without 404  
✅ **Test 2 Passed:** Locus selector shows loci, facts tagged with @locus  
✅ **Test 3 Passed:** Export creates dialogue commitments, deduplicates on re-run

**All 3 passed?** → Ready for Phase 5 scoped inference implementation!

---

## Next: Test Phase 5 Integration Points

After these three features work, proceed to test:
1. Multi-locus inference (add facts at 0.1, 0.2 and verify scoping)
2. Inheritance (child loci should eventually see parent facts)
3. Semantic divergence (contradictions should affect trace)

See: `COMMITMENTS_LUDICS_INTEGRATION_ANALYSIS.md` for full roadmap
