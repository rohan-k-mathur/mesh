# DialogueActionsModal - Quick Reference Card

## Import
```tsx
import { DialogueActionsButton } from "@/components/dialogue/DialogueActionsButton";
import { DialogueActionsModal } from "@/components/dialogue/DialogueActionsModal";
```

## Basic Usage
```tsx
<DialogueActionsButton
  deliberationId="delib_123"
  targetType="argument"
  targetId="arg_456"
  onMovePerformed={() => refetch()}
/>
```

## Props (Common)
```tsx
{
  deliberationId: string;     // REQUIRED
  targetType: TargetType;     // REQUIRED - "argument" | "claim" | "card"
  targetId: string;           // REQUIRED
  locusPath?: string;         // default: "0"
  onMovePerformed?: () => void;
}
```

## Button Variants
```tsx
// Primary CTA (blue button)
<DialogueActionsButton variant="default" />

// Secondary (white with border)
<DialogueActionsButton variant="compact" />

// Icon only
<DialogueActionsButton variant="icon" />
```

## Category Filtering
```tsx
// Only protocol moves (WHY, GROUNDS, etc.)
categories={["protocol"]}

// Only structural moves (THEREFORE, SUPPOSE, DISCHARGE)
categories={["structural"]}

// Only critical questions
categories={["cqs"]}

// Combination
categories={["protocol", "cqs"]}
```

## Pre-select Move
```tsx
// Opens modal with WHY move highlighted
initialMove="WHY"
```

## Custom Label
```tsx
label="Ask Question"
```

## Event Listening
```tsx
import { useBusEffect } from "@/lib/client/useBusEffect";

useBusEffect("dialogue:moves:refresh", (detail) => {
  if (detail.deliberationId === myId) mutate();
}, [myId]);
```

## Integration Examples

### In Argument Cards
```tsx
<footer className="flex gap-2">
  <DialogueActionsButton
    deliberationId={deliberationId}
    targetType="argument"
    targetId={arg.id}
    variant="compact"
  />
</footer>
```

### In Claim Lists
```tsx
<div className="claim-actions">
  <DialogueActionsButton
    deliberationId={deliberationId}
    targetType="claim"
    targetId={claim.id}
    categories={["protocol"]}
    variant="icon"
  />
</div>
```

### With CQ Pre-selection
```tsx
<DialogueActionsButton
  deliberationId={deliberationId}
  targetType="argument"
  targetId={arg.id}
  initialMove="WHY"
  categories={["protocol"]}
  label="Ask CQ"
/>
```

## Move Types

### Protocol Moves
- `WHY` - Challenge justification
- `GROUNDS` - Provide justification
- `CONCEDE` - Accept opponent's point
- `RETRACT` - Withdraw claim
- `CLOSE` - Mark thread concluded
- `ACCEPT_ARGUMENT` - Accept argument

### Structural Moves
- `THEREFORE` - Introduce conclusion
- `SUPPOSE` - Hypothetical assumption
- `DISCHARGE` - Close SUPPOSE scope

## API Endpoints Used
```
GET  /api/dialogue/legal-moves
POST /api/dialogue/move
GET  /api/arguments/${id}/aif-cqs
POST /api/dialogue/answer-and-commit
```

## Events Dispatched
```
dialogue:moves:refresh  - After move posted
dialogue:cs:refresh     - After GROUNDS committed
```

## TypeScript Types
```tsx
import type { TargetType } from "@prisma/client";
import type { ProtocolKind } from "@/components/dialogue/command-card/types";
```

## Files
```
components/dialogue/DialogueActionsModal.tsx      - Main modal (600+ lines)
components/dialogue/DialogueActionsButton.tsx     - Button trigger (100 lines)
DIALOGUE_ACTIONS_MODAL_GUIDE.md                  - Full documentation
DIALOGUE_ACTIONS_MODAL_SUMMARY.md                - Implementation summary
```

## Replaces
- ❌ LegalMoveToolbar
- ❌ LegalMoveChips
- ❌ LegalMoveToolbarAIF
- ❌ ArgumentCriticalQuestionsModal

## Benefits
✅ Consistent UX  
✅ Mobile-friendly  
✅ All moves in one place  
✅ Type-safe  
✅ Event-driven  
✅ Accessible  
✅ Maintainable  

---

**📖 Full Docs**: `DIALOGUE_ACTIONS_MODAL_GUIDE.md`  
**📋 Summary**: `DIALOGUE_ACTIONS_MODAL_SUMMARY.md`
