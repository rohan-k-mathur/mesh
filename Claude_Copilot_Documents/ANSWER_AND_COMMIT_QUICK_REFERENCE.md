# Answer & Commit - Quick Reference

## For Developers

### Using the Feature in Your Component

```tsx
import { NLCommitPopover } from "@/components/dialogue/NLCommitPopover";

function YourComponent() {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setOpen(true)}>
        Answer & Commit
      </button>
      
      <NLCommitPopover
        open={open}
        onOpenChange={setOpen}
        deliberationId="delib_123"
        targetType="argument"  // or "claim" or "card"
        targetId="arg_456"
        locusPath="0"          // default locus
        cqKey="evidence"       // optional: specific CQ key
        defaultOwner="Proponent"  // or "Opponent"
        defaultPolarity="pos"     // "pos" for fact, "neg" for rule
        defaultText=""            // optional: pre-fill text
        onDone={() => {
          // Called after successful submission
          console.log("Committed!");
        }}
      />
    </>
  );
}
```

### API Endpoint

**POST** `/api/dialogue/answer-and-commit`

**Request Body:**
```json
{
  "deliberationId": "delib_123",
  "targetType": "argument",
  "targetId": "arg_456",
  "cqKey": "evidence",
  "locusPath": "0",
  "expression": "congestion_high",  // canonical form
  "original": "Congestion is high downtown",  // original NL text
  "commitOwner": "Proponent",
  "commitPolarity": "pos"  // "pos" or "neg"
}
```

**Response:**
```json
{
  "ok": true,
  "move": { /* DialogueMove object */ },
  "commitOwner": "Proponent",
  "expression": "congestion_high"
}
```

### Events Emitted

After successful submission:

1. **`dialogue:moves:refresh`**
   ```typescript
   {
     deliberationId: string;
     moveId: string;
     kind: "GROUNDS";
   }
   ```

2. **`dialogue:cs:refresh`**
   ```typescript
   {
     deliberationId: string;
     participantId: "Proponent" | "Opponent";
   }
   ```

### Commitment Store Integration

The feature automatically updates the commitment store via:

```typescript
import { applyToCS } from "@/packages/ludics-engine/commitments";

await applyToCS(deliberationId, commitOwner, {
  add: [{
    label: expression,
    basePolarity: commitPolarity,
    baseLocusPath: locusPath,
    entitled: true
  }]
});
```

## For Users

### How to Use

1. **Find an Answer button** in the dialogue interface (usually next to GROUNDS moves)

2. **Click "+ commit"** link next to the answer

3. **Enter your commitment**:
   - **Fact**: Simple statement like "congestion_high"
   - **Rule**: Conditional like "A & B -> C"

4. **Configure**:
   - **Owner**: Who is committing (Proponent or Opponent)
   - **Type**: Fact (pos) or Rule (neg)

5. **Submit**:
   - Click "Post & Commit" button
   - Or press **⌘+Enter** (Cmd+Enter on Mac, Ctrl+Enter on Windows)

### Keyboard Shortcuts

- **⌘+Enter** / **Ctrl+Enter**: Submit
- **Escape**: Close without submitting
- **Click outside**: Close without submitting

### Examples

#### Simple Fact
```
Input: "Traffic congestion is high in downtown"
Canonical: "congestion_high"
Type: Fact (pos)
```

#### Rule
```
Input: "If congestion is high and revenue is earmarked for transit, then net public benefit"
Canonical: "congestion_high & revenue_earmarked_transit -> net_public_benefit"
Type: Rule (neg)
```

### Tips

- The system automatically normalizes your input to a canonical form
- Watch the preview section to see what will be saved
- Click suggestion pills to use recommended forms
- Make sure to select the correct owner (Proponent vs Opponent)

## Troubleshooting

### "Could not parse"
- Try simplifying your input
- Use & for "and", use -> for "implies"
- Example: `A & B -> C`

### "Failed to post"
- Check network connection
- Verify you have permission
- Check browser console for details

### Move doesn't appear
- Wait a moment for refresh
- Manually refresh the page if needed
- Check that events are firing (dev console)

### Commitment not in CS
- Verify the owner is correct
- Check that the deliberation ID matches
- Look at server logs for errors

## Architecture

```
User Action
    ↓
NLCommitPopover (UI Component)
    ↓
/api/nl/normalize (Normalize input to canonical form)
    ↓
/api/dialogue/answer-and-commit (API Route)
    ├→ Create GROUNDS DialogueMove
    └→ Update Commitment Store via applyToCS()
    ↓
Emit Events (dialogue:moves:refresh, dialogue:cs:refresh)
    ↓
UI Components Refresh (via useBusEffect or event listeners)
```

## Related Files

- **Component**: `components/dialogue/NLCommitPopover.tsx`
- **API**: `app/api/dialogue/answer-and-commit/route.ts`
- **Normalization**: `app/api/nl/normalize/route.ts`
- **CS Engine**: `packages/ludics-engine/commitments.ts`
- **Integration**: 
  - `components/dialogue/LegalMoveChips.tsx`
  - `components/dialogue/LegalMoveToolbarAIF.tsx`
  - `components/claims/CriticalQuestions.tsx`
  - `components/claims/CriticalQuestionsV2.tsx`

## Further Reading

- `ANSWER_AND_COMMIT_INTEGRATION_SUMMARY.md` - Complete integration details
- `GROUNDS_EXPLANATION.md` - How GROUNDS moves work
- `AgoraFoundations.md` - Theoretical foundations
- `Flowstate_Flow_Builder.md` - Flow builder integration
