# Quick Reference: CQ Integration Testing

Test these user flows to verify the integration:

## 1. CegMiniMap → CQs Flow
1. Open DeepDivePanelV2
2. Look at CegMiniMap (graph view)
3. **Expected:** Nodes show `CQ 75%`, `?2`, `G:1` badges
4. Click a node with CQs
5. **Expected:** CriticalQuestions dialog opens
6. Interact with CQs (satisfy/WHY/GROUNDS)
7. **Expected:** Badges update in real-time

## 2. CommandCard → CQContext Flow
1. Open DeepDivePanelV2 left sheet
2. Select a claim with open WHYs
3. **Expected:** Orange `CQContextPanel` appears above CommandCard
4. **Expected:** Shows CQ text like "E1: Is expert qualified?"
5. Click "Answer E1" in CommandCard
6. **Expected:** GROUNDS dialog opens

## 3. AttackMenuPro → CQs Flow
1. View an argument card
2. Click "Counter" button
3. **Expected:** Attack menu opens
4. Click "View Critical Questions" at top
5. **Expected:** CQ panel expands showing CQs
6. Review CQs, then proceed with attack
7. **Expected:** Informed attack construction

## 4. ArgumentCard → CQs Flow
1. View AIFArgumentsListPro
2. Find argument with scheme
3. **Expected:** Argument shows `CQ 75%` badge
4. **Expected:** "CQs" button visible next to "Expand"
5. Click "CQs" button
6. **Expected:** CriticalQuestions dialog opens

## 5. End-to-End Workflow
1. CegMiniMap: See node with `?2` (2 open WHYs)
2. Click node → CQs dialog opens
3. Click "Show Moves" → See "Answer E1" and "Answer E2"
4. Click "Answer E1" → Enter grounds → Submit
5. **Expected:** `?2` becomes `?1`, `G:0` becomes `G:1`
6. Go to left sheet CommandCard
7. **Expected:** CQContextPanel shows E1 with checkmark, E2 still open
8. Click "Answer E2" → Submit grounds
9. **Expected:** Node now shows `?0`, `G:2`

## Visual Checklist

### CegMiniMap Nodes
```
✓ CQ percentage badge: "CQ 75%" (indigo/amber)
✓ Open WHY count: "?2" (orange, top-right)
✓ GROUNDS count: "G:1" (green, top-left)
✓ Tooltip shows CQ status
✓ Tooltip shows dialogical status
✓ Tooltip shows "Click to view CQs →"
✓ Click opens Dialog with CriticalQuestions
```

### CommandCard Area
```
✓ CQContextPanel visible when WHY/GROUNDS moves present
✓ Shows CQ key: "E1:"
✓ Shows CQ text: "Is expert qualified..."
✓ Shows scheme: "argument_from_expert_opinion"
✓ Shows checkmark for satisfied CQs
✓ Hint text: "💡 Use action buttons below"
```

### AttackMenuPro
```
✓ "View Critical Questions" button at top
✓ Chevron icon (down/up) shows expand state
✓ CQ panel collapses/expands on click
✓ Shows CQs for target conclusion
✓ Panel styled in indigo theme
```

### ArgumentCard
```
✓ CQ badge next to scheme badge
✓ Badge shows percentage: "CQ 75%"
✓ "CQs" button visible (indigo border)
✓ Button next to "Expand" button
✓ Click opens Dialog
✓ Dialog shows CQs for conclusion claim
```

## Common Issues

### Issue: CQ badges not showing
**Fix:** Ensure target has applied scheme with CQs

### Issue: CQContextPanel not appearing
**Fix:** Check if legal moves include WHY/GROUNDS with cqId in payload

### Issue: "Answer E1" button but no context
**Fix:** Verify CQContextPanel is rendered above CommandCard

### Issue: Click node, no dialog
**Fix:** Check if node has cqStatus.required > 0

### Issue: Badges don't update
**Fix:** Verify bus events are firing and SWR is revalidating

## Dev Tools Debug Commands

```javascript
// Check if CQ data is fetched
fetch('/api/cqs?targetType=claim&targetId=CLAIM_ID')
  .then(r => r.json())
  .then(console.log)

// Check dialogical moves
fetch('/api/deliberations/DELIB_ID/moves')
  .then(r => r.json())
  .then(d => console.log(d.filter(m => m.kind === 'WHY' || m.kind === 'GROUNDS')))

// Trigger bus event manually
window.dispatchEvent(new CustomEvent('cqs:changed'))
```

## Success Criteria

✅ All components show CQ information consistently  
✅ CQ badges update in real-time  
✅ Dialogical status (WHY/GROUNDS) visible  
✅ Click interactions work smoothly  
✅ No TypeScript errors  
✅ No console errors  
✅ Performance is acceptable  

---

**If all tests pass:** Integration successful! 🎉  
**If issues found:** Refer to `CQ_DIALOGICAL_INTEGRATION_ANALYSIS.md` for implementation details.
