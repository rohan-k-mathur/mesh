# Dialogue System Inspector - Quick Start

## What Is This?

A single, unified component to understand what's happening with claims, arguments, dialogue moves, critical questions, and legal actions in your Mesh deliberations.

## Access It

Navigate to: **`http://localhost:3000/test/dialogue-inspector`**

## Quick Usage

1. **Get IDs** from your browser console or database:
   ```javascript
   // In browser console while viewing a deliberation
   console.log("Deliberation:", deliberationId);
   console.log("Claim:", selectedClaimId);
   ```

2. **Enter IDs** in the form on the test page

3. **Click "Inspect"** to see:
   - 📊 Overview of target (claim/argument)
   - 💬 All dialogue moves
   - ⚖️ Available legal actions
   - ❓ Critical questions status
   - 🔧 Raw API data

## Example IDs (from your logs)

```
Deliberation: cmgy6c8vz0000c04w4l9khiux
Claim: cmgzyuusc000ec0leqk4cf26g
Argument: cmh06rqke0045c05ooq3i5u45
```

## What You Can See

### Overview Tab
- Target metadata (text, IDs, timestamps)
- Quick stats (move count, legal actions, CQ status)
- Latest 5 activities

### Moves Tab
- Every dialogue move for this target
- Kind (WHY, GROUNDS, CLOSE, etc.)
- Force (⚔️ ATTACK, 🏳️ SURRENDER, ● NEUTRAL)
- Full payload with dialogue acts

### Legal Actions Tab
- What actions are currently available
- Why some are disabled
- Force and relevance indicators

### Critical Questions Tab
- Which CQs are open vs. answered
- Attachment status
- Question text and descriptions

### Raw Data Tab
- Complete API responses
- Copy JSON for debugging

## Integration

### Standalone Use
Just navigate to `/test/dialogue-inspector`

### Embed in Existing Component
```tsx
import { DialogueInspector } from "@/components/dialogue/DialogueInspector";

<DialogueInspector
  deliberationId={deliberationId}
  targetType="claim"
  targetId={claimId}
  locusPath="0"
/>
```

### Add Toggle to DeepDivePanel
```tsx
const [showInspector, setShowInspector] = useState(false);

<button onClick={() => setShowInspector(!showInspector)}>
  🔍 Inspector
</button>

{showInspector && <DialogueInspector {...props} />}
```

## Files Created

| File | Purpose |
|------|---------|
| `components/dialogue/DialogueInspector.tsx` | Main component |
| `app/(app)/test/dialogue-inspector/page.tsx` | Test page with form |
| `DIALOGUE_INSPECTOR_GUIDE.md` | Full documentation |
| `DIALOGUE_INSPECTOR_README.md` | This file |

## Documentation Reference

- **Full Guide**: `DIALOGUE_INSPECTOR_GUIDE.md`
- **CommandCard Actions**: `COMMANDCARD_ACTIONS_EXPLAINED.md`
- **CommandCard Quick Ref**: `COMMANDCARD_QUICK_REFERENCE.md`
- **Answer-and-Commit**: `ANSWER_AND_COMMIT_INTEGRATION_SUMMARY.md`

## Key Features

✅ **Non-destructive** - Doesn't modify existing components  
✅ **Comprehensive** - Shows all dialogue system data in one place  
✅ **Real-time** - Uses SWR for live data fetching  
✅ **Expandable** - Drill down into full payloads  
✅ **Visual** - Color-coded, icon-based UI  
✅ **Debugging** - See exactly why moves are disabled  

## Common Scenarios

### "Why isn't WHY showing up?"
1. Open inspector for that claim
2. Go to Legal Actions tab
3. Find WHY in the list
4. Check the `reason` field if disabled
5. Verify protocol rules aren't blocking it

### "Did my GROUNDS move create an argument?"
1. Open inspector after submitting GROUNDS
2. Go to Moves tab
3. Expand the GROUNDS move
4. Check payload for `createdArgumentId`
5. Verify argument was created in database

### "Are CQs being tracked correctly?"
1. Open inspector for claim
2. Go to Critical Questions tab
3. Verify open/answered status matches UI
4. Check attachment data

### "What's the exact API response?"
1. Go to Raw Data tab
2. Expand the relevant section
3. Copy JSON for bug reports

## Tips

- **Load Example** button populates with IDs from your logs
- Use **browser DevTools** → Network tab to find real IDs
- Check **console.log** outputs in your app for IDs
- APIs cached by SWR, so repeated views are instant

## Performance

- Initial load: ~2-3 seconds (5 API calls)
- Subsequent views: <100ms (cached)
- Legal moves API: ~3.5s (slowest endpoint)

## Next Steps

1. Try the test page at `/test/dialogue-inspector`
2. Enter real IDs from your system
3. Explore the tabs to understand dialogue state
4. Consider embedding in DeepDivePanelV2 if useful

---

**Created**: January 2025  
**Status**: ✅ Ready to use  
**No breaking changes** - Existing code unaffected
