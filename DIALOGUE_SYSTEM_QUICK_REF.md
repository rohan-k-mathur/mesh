# Dialogue System Quick Reference

> **For developers working with dialogue moves, modals, and legal actions**

---

## 📦 Import Paths

```typescript
// Types (always import from here - single source of truth)
import type { Move, MoveKind, DialogueContext, CommandCardAction } from "@/types/dialogue";

// Hooks
import { useMicroToast } from "@/hooks/useMicroToast";
import { useCQStats } from "@/hooks/useCQStats";

// Modals
import { WhyChallengeModal } from "@/components/dialogue/WhyChallengeModal";
import { StructuralMoveModal } from "@/components/dialogue/StructuralMoveModal";
import { NLCommitPopover } from "@/components/dialogue/NLCommitPopover";

// Components
import { LegalMoveChips } from "@/components/dialogue/LegalMoveChips";
import { LegalMoveToolbar } from "@/components/dialogue/LegalMoveToolbar";
import { DialogueActionsButton } from "@/components/dialogue/DialogueActionsButton";
import { CommandCard } from "@/components/dialogue/command-card/CommandCard";
```

---

## 🎯 Move Types Reference

```typescript
type MoveKind =
  | "ASSERT"           // Post new claim/commitment
  | "WHY"              // Challenge: "Why should we accept this?"
  | "GROUNDS"          // Answer: Provide evidence/reasoning
  | "RETRACT"          // Withdraw your claim
  | "CONCEDE"          // Accept opponent's point
  | "CLOSE"            // End the dialogue branch (all CQs satisfied)
  | "THEREFORE"        // Infer conclusion from premises
  | "SUPPOSE"          // Hypothetical reasoning
  | "DISCHARGE"        // Fulfill conditional assumption
  | "ACCEPT_ARGUMENT"; // Accept full argument structure (R7)
```

---

## 🪝 Hooks Usage

### useMicroToast

**Purpose:** Show transient notifications (success, error, info, warning)

```typescript
function MyComponent() {
  const toast = useMicroToast();

  async function handleAction() {
    try {
      await doSomething();
      toast.show("Action completed successfully", "ok");
    } catch (err) {
      toast.show("Action failed", "err");
    }
  }

  return (
    <div>
      <button onClick={handleAction}>Do Something</button>
      {toast.node}  {/* Render toast portal */}
    </div>
  );
}
```

**Toast Kinds:**
- `"ok"` - Green checkmark (success)
- `"err"` - Red X (error)
- `"info"` - Blue info icon
- `"warn"` - Yellow warning icon

---

### useCQStats

**Purpose:** Get critical question statistics for a claim

```typescript
function MyComponent({ claimId, deliberationId }: Props) {
  const cqStats = useCQStats(claimId, deliberationId);

  if (!cqStats) return <span>Loading CQ stats...</span>;

  return (
    <div>
      CQs: {cqStats.satisfied}/{cqStats.total} satisfied
    </div>
  );
}
```

**Returns:** `{ total: number, satisfied: number } | null`

---

## 🎨 Modal Components

### WhyChallengeModal

**Purpose:** Enter WHY challenge text (replaces `window.prompt()`)

```typescript
function MyComponent() {
  const [whyModalOpen, setWhyModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setWhyModalOpen(true)}>
        Ask WHY
      </button>

      <WhyChallengeModal
        open={whyModalOpen}
        onOpenChange={setWhyModalOpen}
        onSubmit={async (challengeText) => {
          await postMove("WHY", { note: challengeText });
          setWhyModalOpen(false);
        }}
      />
    </>
  );
}
```

**Features:**
- Example challenges shown
- Validation: min 5 characters
- Keyboard shortcut: Cmd+Enter to submit

---

### StructuralMoveModal

**Purpose:** Enter THEREFORE/SUPPOSE/DISCHARGE expressions

```typescript
function MyComponent() {
  const [modalOpen, setModalOpen] = useState(false);
  const [moveKind, setMoveKind] = useState<"THEREFORE" | "SUPPOSE" | "DISCHARGE">("THEREFORE");

  return (
    <>
      <button onClick={() => { setMoveKind("THEREFORE"); setModalOpen(true); }}>
        Therefore...
      </button>

      <StructuralMoveModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        kind={moveKind}
        onSubmit={async (expression) => {
          await postMove(moveKind, { text: expression });
          setModalOpen(false);
        }}
      />
    </>
  );
}
```

**Supported Kinds:**
- `"THEREFORE"` - Inference from premises
- `"SUPPOSE"` - Hypothetical assumption
- `"DISCHARGE"` - Fulfill conditional

---

### NLCommitPopover

**Purpose:** Enter GROUNDS commitment (brief + full label)

```typescript
function MyComponent({ deliberationId, targetId }: Props) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  return (
    <NLCommitPopover
      open={popoverOpen}
      onOpenChange={setPopoverOpen}
      deliberationId={deliberationId}
      targetType="claim"
      targetId={targetId}
      locusPath="0"
      defaultOwner="Proponent"
      onDone={() => {
        setPopoverOpen(false);
        mutate(); // Refresh data
      }}
    />
  );
}
```

---

## 🧩 UI Components

### LegalMoveChips

**Purpose:** Minimal inline chip-based interface

```typescript
<LegalMoveChips
  deliberationId={deliberationId}
  targetType="claim"
  targetId={claimId}
  locusPath="0"
  onPosted={() => mutate()}
/>
```

**Features:**
- Small button chips for each legal move
- Integrated modals (WHY, GROUNDS, structural moves)
- Toast notifications
- CQ statistics badge

---

### LegalMoveToolbar

**Purpose:** Full-featured toolbar with grid/list toggle

```typescript
<LegalMoveToolbar
  deliberationId={deliberationId}
  targetType="claim"
  targetId={claimId}
  locusPath="0"
  commitOwner="Proponent"
  onPosted={() => mutate()}
/>
```

**Features:**
- Grid view: CommandCard 3×3 layout
- List view: Categorized (Challenge/Resolve/More)
- Modal-based interactions
- Toast notifications
- Show/hide restricted moves

---

### CommandCard

**Purpose:** 3×3 grid of organized dialogue actions

```typescript
import { movesToActions } from "@/lib/dialogue/movesToActions";

function MyComponent({ moves, deliberationId, targetId }: Props) {
  const actions = movesToActions(moves, {
    deliberationId,
    targetType: "claim",
    targetId,
    locusPath: "0"
  });

  return (
    <CommandCard
      actions={actions}
      onPerform={async (action) => {
        // Handle modal-based interaction
        // Component manages WHY/GROUNDS/structural modals internally
      }}
    />
  );
}
```

⚠️ **Deprecated:** Standalone `performCommand()` helper uses `window.prompt()`. Use `<CommandCard>` component instead.

---

## 🔄 Posting Moves

**Standard pattern:**

```typescript
async function postMove(
  kind: MoveKind,
  payload: any = {},
  deliberationId: string,
  targetType: "claim" | "argument" | "card",
  targetId: string,
  locusPath: string = "0"
) {
  const response = await fetch("/api/dialogue/move", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      deliberationId,
      targetType,
      targetId,
      kind,
      payload: { locusPath, ...payload },
      autoCompile: true,
      autoStep: true,
      phase: "neutral" as const,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to post ${kind} move`);
  }

  // Refresh data
  mutate();
  window.dispatchEvent(new CustomEvent("dialogue:moves:refresh", {
    detail: { deliberationId }
  }));

  return response.json();
}
```

---

## 🛠️ Common Patterns

### Pattern 1: WHY Challenge with Modal

```typescript
const [whyModalOpen, setWhyModalOpen] = useState(false);
const toast = useMicroToast();

async function handleWhySubmit(challengeText: string) {
  try {
    await postMove("WHY", { note: challengeText });
    toast.show("WHY challenge posted", "ok");
    setWhyModalOpen(false);
  } catch (err) {
    toast.show("Failed to post WHY", "err");
  }
}

return (
  <>
    <button onClick={() => setWhyModalOpen(true)}>Ask WHY</button>
    <WhyChallengeModal
      open={whyModalOpen}
      onOpenChange={setWhyModalOpen}
      onSubmit={handleWhySubmit}
    />
    {toast.node}
  </>
);
```

---

### Pattern 2: GROUNDS with Commit Popover

```typescript
const [commitOpen, setCommitOpen] = useState(false);

return (
  <>
    <button onClick={() => setCommitOpen(true)}>
      Supply GROUNDS
    </button>

    <NLCommitPopover
      open={commitOpen}
      onOpenChange={setCommitOpen}
      deliberationId={deliberationId}
      targetType="claim"
      targetId={targetId}
      locusPath="0"
      defaultOwner="Proponent"
      onDone={() => {
        setCommitOpen(false);
        mutate();
      }}
    />
  </>
);
```

---

### Pattern 3: Structural Move

```typescript
const [modalOpen, setModalOpen] = useState(false);
const toast = useMicroToast();

async function handleStructuralSubmit(expression: string) {
  try {
    await postMove("THEREFORE", { text: expression });
    toast.show("Inference posted", "ok");
    setModalOpen(false);
  } catch (err) {
    toast.show("Failed to post move", "err");
  }
}

return (
  <>
    <button onClick={() => setModalOpen(true)}>Therefore...</button>
    <StructuralMoveModal
      open={modalOpen}
      onOpenChange={setModalOpen}
      kind="THEREFORE"
      onSubmit={handleStructuralSubmit}
    />
    {toast.node}
  </>
);
```

---

## ⚠️ Migration Notes

### ❌ Deprecated: window.prompt()

```typescript
// DON'T DO THIS (deprecated)
const text = window.prompt("Enter WHY challenge");
if (text) await postMove("WHY", { note: text });
```

### ✅ Use Modals Instead

```typescript
// DO THIS (modern pattern)
const [modalOpen, setModalOpen] = useState(false);

<WhyChallengeModal
  open={modalOpen}
  onOpenChange={setModalOpen}
  onSubmit={async (text) => {
    await postMove("WHY", { note: text });
    setModalOpen(false);
  }}
/>
```

---

### ❌ Deprecated: performCommand() Helper

```typescript
// DON'T DO THIS (deprecated helper)
import { performCommand } from "@/components/dialogue/command-card/CommandCard";

await performCommand(action); // Uses window.prompt() internally
```

### ✅ Use CommandCard Component

```typescript
// DO THIS (component handles modals)
<CommandCard
  actions={actions}
  onPerform={async (action) => {
    // Component manages modal interactions
  }}
/>
```

---

## 🧪 Testing Checklist

When adding new dialogue features:

- [ ] Import types from `/types/dialogue.ts` (not local definitions)
- [ ] Use `useMicroToast` for notifications
- [ ] Use modals instead of `window.prompt()`
- [ ] Add keyboard shortcuts (Cmd+Enter) for modals
- [ ] Validate user input (min length, required fields)
- [ ] Show examples/placeholders for guidance
- [ ] Handle errors with toast notifications
- [ ] Refresh data after posting moves (`mutate()`)
- [ ] Dispatch `dialogue:moves:refresh` event
- [ ] Test with screen reader (accessibility)

---

## 📚 Related Documentation

- **Full refactor summary:** `DIALOGUE_REFACTOR_COMPLETE_SUMMARY.md`
- **Component audit:** `DIALOGUE_COMPONENTS_AUDIT.md`
- **Type definitions:** `/types/dialogue.ts` (source code)
- **Hook implementations:** `/hooks/useMicroToast.tsx`, `/hooks/useCQStats.ts`

---

**Last Updated:** 2024  
**Maintainer:** Mesh Engineering Team
