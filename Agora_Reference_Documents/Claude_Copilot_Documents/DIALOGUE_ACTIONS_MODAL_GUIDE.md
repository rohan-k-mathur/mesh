# DialogueActionsModal & DialogueActionsButton - Complete Guide

## Overview

The **DialogueActionsModal** is a comprehensive, canonical component that consolidates ALL dialogical move functionality into one robust, reusable modal. It replaces scattered inline toolbars and provides a consistent UX for dialogue interactions across the entire application.

## Key Features

✅ **All Protocol Moves**: WHY, GROUNDS, CONCEDE, RETRACT, CLOSE, ACCEPT_ARGUMENT  
✅ **Structural Moves**: THEREFORE, SUPPOSE, DISCHARGE  
✅ **Critical Questions Integration**: CQContextPanel with CQ-specific moves  
✅ **Modular Architecture**: Tabs for protocol/structural/CQs  
✅ **Embedded Modals**: NLCommitPopover, StructuralMoveModal  
✅ **Smart State Management**: Loading, error, execution states  
✅ **Event System**: Broadcasts to all listeners (`dialogue:moves:refresh`)  
✅ **Type Safe**: Full TypeScript support  
✅ **Accessible**: Proper ARIA labels and keyboard navigation  

---

## Quick Start

### 1. Simple Button Trigger

```tsx
import { DialogueActionsButton } from "@/components/dialogue/DialogueActionsButton";

function MyComponent() {
  return (
    <DialogueActionsButton
      deliberationId={deliberationId}
      targetType="argument"
      targetId={argumentId}
      onMovePerformed={() => refetch()}
    />
  );
}
```

### 2. Direct Modal Usage

```tsx
import { DialogueActionsModal } from "@/components/dialogue/DialogueActionsModal";

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>
        Open Dialogue Actions
      </button>

      <DialogueActionsModal
        open={open}
        onOpenChange={setOpen}
        deliberationId={deliberationId}
        targetType="claim"
        targetId={claimId}
        onMovePerformed={() => console.log("Move performed!")}
      />
    </>
  );
}
```

---

## Component API

### DialogueActionsModal Props

```typescript
interface DialogueActionsModalProps {
  // Modal control
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  // Target context (REQUIRED)
  deliberationId: string;
  targetType: TargetType;  // "argument" | "claim" | "card"
  targetId: string;
  locusPath?: string;      // default: "0"
  
  // Optional: pre-select a tab/move
  initialMove?: ProtocolKind;  // e.g., "WHY" opens Protocol tab
  
  // Optional: limit to specific categories
  categories?: ("protocol" | "structural" | "cqs" | "scaffold")[];
  
  // Callbacks
  onMovePerformed?: () => void;  // called after successful move
  
  // Optional: CQ context if opened from CQ button
  cqContext?: {
    cqKey: string;
    cqText: string;
    status: "open" | "answered";
  };
}
```

### DialogueActionsButton Props

```typescript
interface DialogueActionsButtonProps {
  // Target context (REQUIRED)
  deliberationId: string;
  targetType: TargetType;
  targetId: string;
  locusPath?: string;
  
  // Optional: pre-select move kind
  initialMove?: ProtocolKind;
  
  // Optional: limit categories
  categories?: ("protocol" | "structural" | "cqs" | "scaffold")[];
  
  // Callbacks
  onMovePerformed?: () => void;
  
  // Button customization
  label?: string;                    // default: "Dialogue Moves"
  variant?: "default" | "compact" | "icon";  // default: "default"
  className?: string;                // additional classes
}
```

---

## Usage Examples

### Example 1: In ClaimMiniMap

Replace existing `LegalMoveToolbar` with:

```tsx
import { DialogueActionsButton } from "@/components/dialogue/DialogueActionsButton";

function ClaimMiniMap({ claims }) {
  return (
    <div>
      {claims.map(claim => (
        <div key={claim.id}>
          <ClaimCard claim={claim} />
          
          {/* Old way */}
          {/* <LegalMoveToolbar ... /> */}
          
          {/* New way */}
          <DialogueActionsButton
            deliberationId={deliberationId}
            targetType="claim"
            targetId={claim.id}
            variant="compact"
            onMovePerformed={() => mutate()}
          />
        </div>
      ))}
    </div>
  );
}
```

### Example 2: In AIFArgumentsListPro

Add to argument cards:

```tsx
import { DialogueActionsButton } from "@/components/dialogue/DialogueActionsButton";

function ArgumentRow({ argument }) {
  return (
    <article className="argument-card">
      <div className="argument-content">
        {/* Argument details */}
      </div>
      
      <footer className="flex items-center gap-2">
        {/* Other action buttons */}
        
        <DialogueActionsButton
          deliberationId={deliberationId}
          targetType="argument"
          targetId={argument.id}
          categories={["protocol", "cqs"]}  // Only show protocol + CQs
          variant="compact"
          label="Dialogue"
          onMovePerformed={() => refetchArgument(argument.id)}
        />
      </footer>
    </article>
  );
}
```

### Example 3: In GraphExplorer (Selected Node Actions)

```tsx
import { DialogueActionsModal } from "@/components/dialogue/DialogueActionsModal";

function GraphExplorer() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [actionsOpen, setActionsOpen] = useState(false);

  return (
    <>
      <Graph
        nodes={nodes}
        onNodeClick={(node) => {
          setSelectedNode(node);
          setActionsOpen(true);  // Auto-open on node click
        }}
      />

      {selectedNode && (
        <DialogueActionsModal
          open={actionsOpen}
          onOpenChange={setActionsOpen}
          deliberationId={deliberationId}
          targetType={selectedNode.type}
          targetId={selectedNode.id}
          onMovePerformed={() => {
            refetchGraph();
            // Keep modal open for multiple actions
          }}
        />
      )}
    </>
  );
}
```

### Example 4: CQ-Specific Move (Pre-select WHY with CQ)

```tsx
import { DialogueActionsButton } from "@/components/dialogue/DialogueActionsButton";

function CriticalQuestionsList({ cqs }) {
  return (
    <div>
      {cqs.map(cq => (
        <div key={cq.key} className="cq-card">
          <div>{cq.text}</div>
          
          {/* Button opens modal pre-selected to WHY move */}
          <DialogueActionsButton
            deliberationId={deliberationId}
            targetType="argument"
            targetId={argumentId}
            initialMove="WHY"  // Pre-select WHY
            categories={["protocol"]}  // Only protocol moves
            label="Ask This CQ"
            variant="compact"
          />
        </div>
      ))}
    </div>
  );
}
```

### Example 5: Icon-only Button (Compact UI)

```tsx
<DialogueActionsButton
  deliberationId={deliberationId}
  targetType="argument"
  targetId={argumentId}
  variant="icon"  // Icon only, no label
  className="ml-auto"
/>
```

---

## Integration Points

### Components to Update

1. **ClaimMiniMap** → Replace `LegalMoveToolbar` with `DialogueActionsButton`
2. **AIFArgumentsListPro** → Add `DialogueActionsButton` to argument cards
3. **CegMiniMap** → Add dialogue actions (currently missing!)
4. **GraphExplorer** → Add on-node-click actions
5. **AttackMenuPro** → Add `DialogueActionsButton` alongside attack options
6. **CommandCard** → Can be replaced entirely OR used alongside
7. **ArgumentCardV2** → Add in footer actions
8. **DeepDivePanelV2** → Use in selected claim/argument sidebars

### Migration Strategy

**Phase 1 - Add Alongside (Safe)**
- Keep existing `LegalMoveToolbar` / `CommandCard`
- Add `DialogueActionsButton` as alternative
- Users can choose which they prefer

**Phase 2 - Replace Inline Toolbars**
- Remove inline `LegalMoveChips` / `LegalMoveToolbar`
- Use `DialogueActionsButton` as primary interface
- Better for mobile (less clutter)

**Phase 3 - Deprecate Old Components**
- Once all places use `DialogueActionsModal`
- Mark old components as deprecated
- Clean up codebase

---

## Event System

The modal broadcasts events after successful moves:

```typescript
// Broadcast after move execution
window.dispatchEvent(
  new CustomEvent("dialogue:moves:refresh", {
    detail: { deliberationId },
  })
);
```

### Listening for Events

```tsx
import { useBusEffect } from "@/lib/client/useBusEffect";

function MyComponent() {
  const { mutate } = useSWR(apiUrl, fetcher);

  useBusEffect("dialogue:moves:refresh", (detail) => {
    if (detail.deliberationId === deliberationId) {
      mutate();  // Refetch data
    }
  }, [deliberationId]);
}
```

---

## Advanced Features

### Custom Categories

Show only specific move types:

```tsx
<DialogueActionsButton
  {...props}
  categories={["protocol"]}  // Only protocol moves (WHY, GROUNDS, etc.)
/>

<DialogueActionsButton
  {...props}
  categories={["cqs"]}  // Only critical questions
/>

<DialogueActionsButton
  {...props}
  categories={["structural"]}  // Only THEREFORE/SUPPOSE/DISCHARGE
/>
```

### Pre-selected Move

Open modal with specific tab/move active:

```tsx
<DialogueActionsButton
  {...props}
  initialMove="WHY"  // Opens Protocol tab with WHY highlighted
/>
```

### Callback Chaining

```tsx
<DialogueActionsButton
  {...props}
  onMovePerformed={() => {
    mutate();           // Refetch data
    toast("Move posted!");
    logAnalytics("dialogue_move");
  }}
/>
```

---

## Styling & Customization

### Button Variants

**Default** (Primary CTA):
```tsx
<DialogueActionsButton variant="default" />
// Blue button, prominent, use sparingly
```

**Compact** (Secondary action):
```tsx
<DialogueActionsButton variant="compact" />
// White button with border, smaller, for lists
```

**Icon** (Minimal):
```tsx
<DialogueActionsButton variant="icon" />
// Icon only, no label, for tight spaces
```

### Custom Classes

```tsx
<DialogueActionsButton
  className="ml-auto shadow-lg"  // Add custom Tailwind classes
/>
```

---

## Comparison with Old Components

| Old Component | New Component | Migration |
|---------------|---------------|-----------|
| `LegalMoveToolbar` | `DialogueActionsButton` | Replace with button |
| `LegalMoveChips` | `DialogueActionsButton` | Replace with button |
| `CommandCard` | `DialogueActionsModal` | Use modal directly or via button |
| `LegalMoveToolbarAIF` | `DialogueActionsButton` | Replace with button |
| `ArgumentCriticalQuestionsModal` | `DialogueActionsModal` (CQs tab) | Use `categories={["cqs"]}` |
| Inline CQ buttons | `DialogueActionsButton` + `initialMove="WHY"` | Replace with pre-selected button |

---

## Benefits

✅ **Consistency**: Same UX everywhere  
✅ **Mobile-friendly**: Modal instead of inline toolbars  
✅ **Discoverable**: All moves in one place  
✅ **Maintainable**: One component to update  
✅ **Extensible**: Easy to add new move types  
✅ **Type-safe**: Full TypeScript coverage  
✅ **Event-driven**: Auto-refreshes all listeners  
✅ **Accessible**: Proper ARIA labels  
✅ **Themable**: Uses design system tokens  

---

## Troubleshooting

### Modal doesn't open
- Check `open` state is managed correctly
- Verify `onOpenChange` callback updates state

### Moves not showing
- Check `targetType` and `targetId` are correct
- Verify `/api/dialogue/legal-moves` returns moves
- Check `categories` prop isn't too restrictive

### Events not refreshing
- Ensure components use `useBusEffect` hook
- Check deliberationId matches in event listener
- Use SWR's `mutate()` to force refresh

### TypeScript errors
- Import `TargetType` from `@prisma/client`
- Import `ProtocolKind` from `./command-card/types`
- Verify all required props are provided

---

## Future Enhancements

### Planned Features
- 🔄 Hotkey support (Q/W/E grid)
- 📊 Move history/undo
- 🎨 Custom theme/styling API
- 🔍 Search/filter moves
- 📱 Swipe gestures for mobile
- 🎯 Move suggestions/AI recommendations
- 📈 Analytics/telemetry
- 🌐 i18n/localization

---

## Related Documentation

- `DIALOGUE_SYSTEM_ROADMAP_COMPLETE.md` - Complete implementation guide
- `COMMANDCARD_ACTIONS_EXPLAINED.md` - CommandCard system details
- `ANSWER_AND_COMMIT_QUICK_REFERENCE.md` - GROUNDS move system
- `CQ_DIALOGICAL_INTEGRATION_ANALYSIS.md` - CQ integration status
- `AIF_DIALOGUE_INTEGRATION_QUICK_REFERENCE.md` - API reference

---

## Questions?

See existing implementations in:
- `components/dialogue/LegalMoveChips.tsx` (old pattern)
- `components/dialogue/CommandCard.tsx` (old pattern)
- `components/claims/ClaimMiniMap.tsx` (integration example)
