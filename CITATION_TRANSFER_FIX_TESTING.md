# Citation Transfer Fix - Testing Guide

## Problem Fixed

**Issue:** When users clicked "Expand" in AttackArgumentWizard's ResponseStep and used PropositionComposerPro to compose their attack with citations, the citations were lost. Only the text was transferred back to the wizard.

**Root Cause:** 
- PropositionComposerPro creates a Proposition record and attaches citations to it
- AttackArgumentWizard's `onCreated` callback only extracted `prop.text`
- Later, wizard creates a separate Claim for the attack
- Citations remained attached to the Proposition, not the Claim

**Solution:**
- Enhanced `handlePropositionCreated` to fetch citations from the created proposition
- Convert citations to `PendingCitation` format
- Merge with existing `pendingCitations` array
- Citations now flow through to the attack Claim creation

---

## Testing Scenarios

### Test 1: Basic Citation Transfer (Happy Path)

**Steps:**
1. Navigate to an argument with CQ suggestions
2. Click on a CQ attack suggestion
3. AttackArgumentWizard opens on Overview step
4. Click "Begin Writing" → ResponseStep appears
5. Click "Expand" button (top-right of textarea)
6. PropositionComposerPro modal opens
7. Write attack text: "This argument fails because..."
8. Scroll down to Citations section
9. Click URL tab, add: `https://arxiv.org/abs/2024.12345`
10. Add locator: "Section 3.2"
11. Add quote: "Our study found that..."
12. Click "Post" button
13. Modal closes, text appears in ResponseStep textarea
14. Click "Continue" → EvidenceStep
15. **VERIFY:** Citation from PropositionComposerPro appears in CitationCollector
    - Title: arXiv link
    - Locator: "Section 3.2"
    - Quote: "Our study found that..."
16. Click "Continue to Review" → ReviewStep
17. **VERIFY:** Citation appears in evidence preview
18. Click "Submit Attack"
19. Attack created successfully
20. ArgumentCardV2 Challenges section updates
21. Find your attack, click to expand ClaimDetailPanel
22. **VERIFY:** Citation displays in Citations section
    - Clickable link to arXiv
    - Shows locator and quote

**Expected Result:** ✅ Citation transfers successfully from PropositionComposerPro → EvidenceStep → Attack Claim

---

### Test 2: Multiple Citations Transfer

**Steps:**
1. Open AttackArgumentWizard
2. ResponseStep → Click "Expand"
3. In PropositionComposerPro, add 3 citations:
   - URL: `https://example.com/source1`
   - DOI: `10.1234/example`
   - Library: Search for a library post, select one
4. Click "Post"
5. **VERIFY:** All 3 citations appear in EvidenceStep
6. Add 1 more citation directly in EvidenceStep:
   - URL: `https://example.com/source2`
7. **VERIFY:** ReviewStep shows 4 citations total
8. Submit attack
9. **VERIFY:** ClaimDetailPanel shows all 4 citations

**Expected Result:** ✅ All citations from both sources (PropositionComposerPro + CitationCollector) attached to attack claim

---

### Test 3: Glossary Terms + Citations

**Steps:**
1. Open AttackArgumentWizard
2. ResponseStep → Click "Expand"
3. In PropositionComposerPro:
   - Write: "The [[termId:Example Term]] is not properly defined"
   - Use glossary toolbar to insert term link
   - Add citation: `https://example.com/definition`
4. Click "Post"
5. **VERIFY:** ResponseStep textarea shows: "The [[termId:Example Term]] is not properly defined"
6. **VERIFY:** EvidenceStep shows citation
7. Submit attack
8. In ArgumentCardV2 Challenges section:
   - **VERIFY:** Attack text shows "Example Term" as blue underlined link
   - Click term → GlossaryTermModal opens
   - Expand ClaimDetailPanel
   - **VERIFY:** Citation appears in Citations section

**Expected Result:** ✅ Both glossary links and citations preserved and displayed correctly

---

### Test 4: Citation Deduplication

**Steps:**
1. Open AttackArgumentWizard
2. EvidenceStep: Add citation URL: `https://example.com/source1`
3. Click "Back" → ResponseStep
4. Click "Expand" → PropositionComposerPro
5. Add same citation URL: `https://example.com/source1`
6. Click "Post"
7. Click "Continue" → EvidenceStep
8. **VERIFY:** Only ONE instance of `https://example.com/source1` appears
9. ReviewStep
10. **VERIFY:** Only 1 citation in preview

**Expected Result:** ✅ Duplicate citations filtered out during merge

---

### Test 5: Empty Citations (Edge Case)

**Steps:**
1. Open AttackArgumentWizard
2. ResponseStep → Click "Expand"
3. In PropositionComposerPro:
   - Write attack text
   - Do NOT add any citations
4. Click "Post"
5. **VERIFY:** No errors in console
6. **VERIFY:** EvidenceStep has empty citations list
7. Continue to ReviewStep
8. **VERIFY:** No citations section shown
9. Submit attack
10. **VERIFY:** Attack created successfully with no citations

**Expected Result:** ✅ Empty citation case handled gracefully

---

### Test 6: Citation Type Inference

**Steps:**
1. Open AttackArgumentWizard
2. ResponseStep → Click "Expand"
3. In PropositionComposerPro, add:
   - DOI: `10.1234/example` (should infer type: "doi")
   - Library post (should infer type: "library")
   - URL: `https://example.com` (should infer type: "url")
4. Click "Post"
5. Open browser DevTools → Network tab
6. **VERIFY:** When attack submits, three `/api/citations/resolve` calls:
   - One with `{ doi: "10.1234/example" }`
   - One with `{ libraryPostId: "..." }`
   - One with `{ url: "https://example.com" }`
7. **VERIFY:** All citations attach successfully

**Expected Result:** ✅ Citation type correctly inferred from source metadata

---

### Test 7: API Error Handling

**Steps:**
1. Open AttackArgumentWizard
2. ResponseStep → Click "Expand"
3. PropositionComposerPro: Add citation URL: `https://invalid-url`
4. Click "Post"
5. **VERIFY:** Check browser console for error logs
   - Should log: "Failed to fetch proposition citations:" (if API fails)
   - OR: Continue gracefully with just text if citations API down
6. **VERIFY:** Text still transferred to ResponseStep
7. Continue and submit attack
8. **VERIFY:** Attack created with text (citations may be missing but not blocking)

**Expected Result:** ✅ Non-fatal error handling, attack still submittable

---

## Console Log Checkpoints

When testing, watch browser console for these logs:

### Success Path
```
[PropositionComposerPro] Created proposition: prop_abc123
[AttackArgumentWizard] Fetching citations for proposition: prop_abc123
[AttackArgumentWizard] Found 2 citations to transfer
[AttackArgumentWizard] Converted citations: [...]
[AttackArgumentWizard] Merged 2 new citations (0 duplicates filtered)
```

### Error Path
```
[AttackArgumentWizard] Failed to fetch proposition citations: <error>
[AttackArgumentWizard] Continuing with text only
```

---

## Database Verification

After submitting an attack with citations:

```sql
-- Find the attack claim
SELECT id, text FROM "Claim" 
WHERE text LIKE '%your attack text%' 
ORDER BY "createdAt" DESC LIMIT 1;

-- Check citations attached to that claim (use claim ID from above)
SELECT 
  c.id,
  c."targetType",
  c."targetId",
  c.locator,
  c.quote,
  s.url,
  s.title,
  s.doi,
  s.platform
FROM "Citation" c
JOIN "Source" s ON c."sourceId" = s.id
WHERE c."targetType" = 'claim' AND c."targetId" = '<claim_id>';
```

**Expected:**
- Citations should have `targetType = 'claim'`
- `targetId` should match your attack claim ID
- Source metadata (url, doi, platform) should match what you entered

---

## API Endpoint Verification

### Check Proposition Citations Endpoint

```bash
# After creating proposition in PropositionComposerPro, note the prop ID
# Test the endpoint manually:

curl http://localhost:3000/api/propositions/<prop_id>/citations
```

**Expected Response:**
```json
{
  "ok": true,
  "citations": [
    {
      "id": "cit_xyz",
      "url": "https://arxiv.org/abs/2024.12345",
      "title": "Example Paper",
      "doi": null,
      "platform": "arxiv",
      "kind": "pdf",
      "authors": null,
      "text": "Our study found that...",
      "locator": "Section 3.2",
      "note": null,
      "createdAt": "2025-11-13T..."
    }
  ]
}
```

### Check Claim Citations After Attack

```bash
# After submitting attack, note the claim ID from ArgumentCardV2
curl http://localhost:3000/api/claims/<claim_id>/citations
```

**Expected Response:**
```json
{
  "ok": true,
  "citations": [
    {
      "id": "cit_abc",
      "url": "https://arxiv.org/abs/2024.12345",
      "title": "Example Paper",
      "doi": null,
      "platform": "arxiv",
      "kind": "pdf",
      "authors": null,
      "text": "Our study found that...",
      "locator": "Section 3.2",
      "note": null,
      "createdAt": "2025-11-13T..."
    }
  ]
}
```

---

## Known Issues / Edge Cases

### 1. Proposition Created but Citations API Fails
**Symptom:** Text transferred but no citations in EvidenceStep
**Workaround:** User can manually re-add citations in EvidenceStep
**Priority:** Low (non-blocking, graceful degradation)

### 2. Network Delay Between Proposition Creation and Citation Fetch
**Symptom:** Race condition if citations not yet persisted when fetch happens
**Mitigation:** PropositionComposerPro waits for citation attachment to complete before calling `onCreated`
**Priority:** Low (unlikely due to synchronous flow)

### 3. Library Post Citations Without Metadata
**Symptom:** If library post lacks title, may show as "Untitled"
**Workaround:** API returns `title || url || "Untitled"` fallback chain
**Priority:** Low (cosmetic)

---

## Success Criteria

All tests pass if:
- ✅ Citations added in PropositionComposerPro appear in EvidenceStep
- ✅ Citations attach to attack Claim, not Proposition
- ✅ Citations display in ArgumentCardV2 ClaimDetailPanel
- ✅ Glossary links preserved alongside citations
- ✅ Duplicates filtered during merge
- ✅ Empty citation case handled
- ✅ Citation types inferred correctly (URL/DOI/library)
- ✅ API errors don't block attack submission
- ✅ No console errors in success path

---

## Rollback Plan (If Needed)

If citation transfer causes issues:

1. **Revert AttackArgumentWizard changes:**
   - Remove `handlePropositionCreated` function
   - Restore simple `onCreated` callback: `(prop) => { onTextChange(prop.text); onExpandedChange(false); }`
   - Remove `pendingCitations` and `onCitationsChange` props from ResponseStep

2. **Revert API changes:**
   - Revert `/app/api/propositions/[id]/citations/route.ts` to previous version (remove doi, platform, kind, authors fields)

3. **Document limitation:**
   - Add warning: "Citations added in expanded editor will not be transferred. Please add citations in the Evidence step."

---

## Future Enhancements

1. **Visual feedback during transfer:**
   - Show loading spinner: "Transferring citations..."
   - Toast notification: "2 citations imported from editor"

2. **Citation preview in ResponseStep:**
   - Show mini badge count: "3 citations added"
   - Preview list before advancing to EvidenceStep

3. **Bi-directional sync:**
   - If user goes back to ResponseStep and re-opens editor, pre-populate citations

4. **Smart deduplication:**
   - Merge citations with same source but different metadata
   - Keep most complete version (most locator/quote/note data)

---

_Testing Date: 2025-11-13_
_Status: Ready for User Testing_
