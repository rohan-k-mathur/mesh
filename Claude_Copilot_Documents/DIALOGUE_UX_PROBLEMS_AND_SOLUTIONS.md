# Dialogue UX Problems & Solutions

## Problem Statement

**Issue**: Making dialogical moves (WHY, GROUNDS, CLOSE, CONCEDE, etc.) is confusing and unintuitive for users, despite having functional wiring underneath.

**Root Causes**:
1. **Multiple competing interfaces** - CommandCard, LegalMoveChips, LegalMoveToolbar, InlineMoveForm
2. **Unclear user flows** - Not obvious when/how to challenge or respond
3. **Fragmented UI** - Move options scattered across different panels
4. **Missing feedback** - Users don't know what happened after clicking
5. **Inconsistent patterns** - Some moves use buttons, others use modals, others inline forms
6. **Hidden functionality** - Grid view toggle, "+ commit" links not discoverable

---

## Current State Analysis

### What Works Well ✅

1. **SchemeComposer** for creating arguments and propositions
   - Clear modal interface
   - Step-by-step flow
   - Good visual feedback

2. **Legal moves computation** (`/api/dialogue/legal-moves`)
   - Correctly determines available moves
   - Provides disabled reasons
   - Force classification working

3. **Backend wiring** (API routes, database)
   - Moves create correctly
   - Events emit properly
   - Commitment store updates

### What's Confusing ❌

#### Problem 1: Too Many Ways to Make Moves

**Current interfaces**:

1. **CommandCard** - 3×3 grid (⚖️ Grid View)
   - Location: Hidden behind "Grid View" toggle in LegalMoveToolbar
   - Pro: Visual, organized layout
   - Con: Not default view, users don't know it exists

2. **LegalMoveChips** - Simple button chips
   - Location: Various places (ArgumentsList, etc.)
   - Pro: Compact, fast
   - Con: No context, cryptic labels like "Answer E1"

3. **LegalMoveToolbar** - Segmented interface (Challenge/Resolve/More)
   - Location: DeepDivePanelV2, ArgumentsList
   - Pro: Groups by intent
   - Con: Requires tab switching, WHY requires inline expansion

4. **InlineMoveForm** - Text input + Post button
   - Location: Commented out in most places
   - Pro: Familiar form pattern
   - Con: No guidance on what to write

5. **NLCommitPopover** - Modal for GROUNDS + commitment
   - Location: Triggered by "+ commit" link
   - Pro: Complete flow with normalization preview
   - Con: Hidden, only appears if you find the tiny link

**User confusion**: "Which one should I use? They all do different things?"

---

#### Problem 2: Unclear When/How to Challenge

**Scenario**: User sees a claim they disagree with.

**What happens now**:
1. User looks at the claim card
2. No obvious "Challenge" or "Disagree" button
3. Must expand a hidden toolbar
4. Choose between "Challenge", "Resolve", or "More" tabs
5. If "Challenge" tab, must click "Ask WHY" button
6. An inline input appears (surprise!)
7. Type something in the input
8. Click "Post WHY"

**User confusion**: "How do I disagree with this? Where's the challenge button?"

**What users expect**:
- Single prominent "Challenge" or "Ask WHY" button
- Modal or drawer opens with clear explanation
- Text area with placeholder examples
- Submit button with clear outcome preview

---

#### Problem 3: GROUNDS (Answering WHY) is Cryptic

**Scenario**: User needs to answer a WHY challenge.

**What happens now**:
1. User sees "Answer E1" chip (what is E1??)
2. Click it → browser `prompt()` appears (ugly!)
3. Type response in tiny prompt box
4. No formatting, no preview, no help
5. Submit → disappears, unclear if it worked

**User confusion**: 
- "What is 'E1'?"
- "Why is this a browser alert?"
- "Did my answer work?"
- "Can I attach evidence?"

**Alternative flow** (if they find "+ commit"):
1. Click tiny "+ commit" link
2. NLCommitPopover opens (better!)
3. Still unclear what "commit" means
4. Normalization preview is nice but unexpected

**What users expect**:
- "Respond to Challenge" button
- Modal with:
  - Original WHY question displayed
  - Large text area for response
  - Optional: Attach evidence/sources
  - Preview of what will be posted
  - Clear "Submit Response" button
- Success message after submission

---

#### Problem 4: CommandCard Grid is Hidden

**Current state**:
- CommandCard (3×3 grid) is the *best* UI for moves
- Visual force indicators (⚔️ ATTACK, 🏳️ SURRENDER)
- Clear labels and disabled reasons
- Organized layout

**Problem**: It's hidden behind a "Grid View" toggle that defaults to OFF.

**User confusion**: "Where's that nice grid thing I saw in the demo?"

---

#### Problem 5: No Guidance or Examples

**When making moves**:
- No placeholder text showing examples
- No tooltips explaining what each move does
- No preview of consequences
- No confirmation dialogs for important moves (CLOSE, CONCEDE)

**Example - WHY move**:
```
[Input: "WHY? (brief note)…"]  ← What do I write here??
```

Users don't know:
- Should I ask a specific question?
- Should I just click without typing?
- What's a "brief note"?
- Will this notify someone?

---

#### Problem 6: Missing Visual Feedback

**After posting a move**:
- Tiny toast appears for 1.4 seconds (easy to miss)
- Page content updates but no highlight
- No "Your move was posted" confirmation
- No "Waiting for response" indicator

**User confusion**: "Did that work? Should I click again?"

---

## User Journey Analysis

### Journey 1: Challenging a Claim (WHY)

**Ideal Flow**:
```
1. See claim you disagree with
2. Click prominent "Challenge" button
3. Modal opens:
   "Why do you challenge this claim?"
   [ Text area with example: "I question this because..." ]
   [ Optional: Attach counter-evidence ]
   [ Cancel ] [ Submit Challenge ]
4. Confirmation: "Challenge posted! Author will be notified."
5. Visual indicator on claim: "🔴 Challenged by you"
```

**Current Flow** (using LegalMoveToolbar):
```
1. See claim
2. Look for action buttons... where?
3. Find small toolbar at bottom
4. See three tabs: Challenge, Resolve, More
5. Click "Challenge" tab
6. See "Ask WHY" button
7. Click "Ask WHY"
8. Inline input appears (unexpected!)
9. Type something in tiny box
10. Click "Post WHY"
11. Input disappears... did it work?
```

**Pain points**:
- 6 steps before seeing an input field
- Unclear what to write
- Unexpected inline input (users expect modal)
- No confirmation of success

---

### Journey 2: Answering a Challenge (GROUNDS)

**Ideal Flow**:
```
1. Get notification: "Your claim was challenged"
2. Click notification or see indicator on claim
3. Modal opens:
   "Challenge: [WHY question text]"
   "Your response:"
   [ Large text area with examples ]
   [ Optional: Attach supporting evidence ]
   [ Save as Draft ] [ Submit Response ]
4. Confirmation: "Response posted!"
5. Visual indicator: "✅ Challenge answered"
```

**Current Flow** (using LegalMoveChips):
```
1. See "Answer E1" chip (huh?)
2. Click it
3. Browser prompt() appears! (ugly)
4. Type in tiny browser alert box
5. Click OK
6. Toast appears for 1.4s (may not see it)
7. Hope it worked
```

**Alternative flow** (if user discovers "+ commit"):
```
1. Find tiny "+ commit" link next to "Answer E1"
2. Click link
3. NLCommitPopover modal opens
4. See "Fact or Rule" input (confusing terminology)
5. Type response
6. See normalization preview (nice but unexpected)
7. Click "Commit & Post"
8. Unclear what "commit" means
```

**Pain points**:
- Browser `prompt()` is terrible UX (1990s web)
- No context about what "E1" means
- "+ commit" functionality hidden
- Terminology mismatch (users don't know "commit store")

---

### Journey 3: Closing a Dialogue (CLOSE †)

**Ideal Flow**:
```
1. Realize you want to end the discussion
2. Click "End Discussion" button
3. Confirmation modal:
   "Are you sure you want to end this dialogue?
    This means you accept the current state."
   [ Cancel ] [ Yes, End Discussion ]
4. Confirmation: "Discussion closed"
5. Visual indicator: "🏁 Discussion ended by you"
```

**Current Flow** (using LegalMoveToolbar):
```
1. Switch to "Resolve" tab
2. See "Close (†)" button
3. Click it
4. No confirmation!
5. Move is posted
6. Toast appears briefly
7. Claim state changes (no visual ceremony)
```

**Pain points**:
- No confirmation for destructive action
- Dagger symbol (†) not universally understood
- Hidden behind "Resolve" tab
- No explanation of consequences

---

## Proposed Solutions

### Solution 1: Unified Dialogue Modal System

Create a single modal system for all dialogue moves:

**`DialogueMoveModal.tsx`** - One component to rule them all

```tsx
<DialogueMoveModal
  type="WHY" | "GROUNDS" | "CLOSE" | "CONCEDE"
  targetType="claim" | "argument"
  targetId="..."
  context={{
    claimText: "...",
    challengeText: "...", // for GROUNDS
    // etc.
  }}
  onSubmit={async (data) => {
    // Unified submission logic
  }}
  onCancel={() => {}}
/>
```

**Features**:
- Large, clear modal
- Context-specific UI for each move type
- Examples and placeholders
- Preview of what will be posted
- Attachment support (optional)
- Confirmation step for important moves
- Clear success/error feedback

---

### Solution 2: Simplified Primary Interface

Replace fragmented interfaces with one clear pattern:

**Primary UI: Action Menu**

```
┌─────────────────────────────────────┐
│ Claim: "Climate change is real"    │
│                                     │
│ [💬 Dialogue Actions ▼]            │ ← Single entry point
└─────────────────────────────────────┘

Click button → Dropdown opens:

┌─────────────────────────────────────┐
│ ⚔️ Challenge (Ask WHY)              │
│ 🏳️ Concede (Accept claim)           │
│ 📋 View dialogue history            │
│ ⚙️ More options...                  │
└─────────────────────────────────────┘
```

Each option opens the unified modal with context.

---

### Solution 3: Better GROUNDS Flow

**Replace browser `prompt()` with proper modal**:

**Current**: `window.prompt('Commit label...', '')`  
**New**: `<DialogueMoveModal type="GROUNDS" .../>`

**Modal content for GROUNDS**:

```
┌──────────────────────────────────────────────┐
│ Respond to Challenge                         │
├──────────────────────────────────────────────┤
│                                              │
│ Challenge: "Why do you claim this?"         │ ← Show original WHY
│                                              │
│ Your Response:                               │
│ ┌──────────────────────────────────────────┐│
│ │ I claim this because studies show...     ││ ← Large text area
│ │                                          ││
│ │                                          ││
│ └──────────────────────────────────────────┘│
│                                              │
│ ☑️ Also add to commitment store              │ ← Clear checkbox with explanation
│   (Your commitments can be referenced later) │
│                                              │
│ [Cancel] [Preview] [Submit Response]         │
└──────────────────────────────────────────────┘
```

---

### Solution 4: Make CommandCard the Default

**Change LegalMoveToolbar**:

```tsx
// OLD: List view by default
const [useCommandCard, setUseCommandCard] = useState(false);

// NEW: Grid view by default
const [useCommandCard, setUseCommandCard] = useState(true);
```

**Or better**: Remove the toggle entirely, always show grid.

---

### Solution 5: Add Contextual Help

**Inline help text for each move type**:

```tsx
{moveType === "WHY" && (
  <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded mb-2">
    💡 <strong>Tip</strong>: Ask a specific question about why they claim this.
    Examples:
    • "What evidence supports this?"
    • "How do you know this is true?"
    • "What makes you confident in this claim?"
  </div>
)}
```

---

### Solution 6: Visual State Indicators

**Show dialogue state clearly on claims/arguments**:

```tsx
// On claim card
<div className="dialogue-status">
  {hasOpenChallenge && (
    <span className="badge badge-warning">
      🔴 Challenged · Awaiting response
    </span>
  )}
  
  {hasResponse && (
    <span className="badge badge-success">
      ✅ Challenge answered
    </span>
  )}
  
  {isClosed && (
    <span className="badge badge-neutral">
      🏁 Discussion closed
    </span>
  )}
</div>
```

---

### Solution 7: Better Feedback After Moves

**Replace tiny toast with proper notification**:

```tsx
// OLD: 1.4s toast in corner
toast.show(`${m.label} posted`, 'ok');

// NEW: Prominent notification bar
<SuccessNotification
  message="Your challenge has been posted!"
  action={{
    label: "View dialogue",
    onClick: () => openDialoguePanel()
  }}
  duration={5000}
/>
```

---

## Implementation Plan

### Phase 1: Quick Wins (1-2 days)

1. **Replace `window.prompt()` with NLCommitPopover**
   - Update `LegalMoveChips.answerAndCommit()`
   - Remove prompt(), always open modal
   - Add examples/placeholders

2. **Make CommandCard default view**
   - Change `useState(false)` to `useState(true)` in LegalMoveToolbar
   - Or remove toggle entirely

3. **Add contextual help text**
   - Add tooltip/help text to each move button
   - Show examples in modals

4. **Better visual feedback**
   - Replace micro-toast with notification bar
   - Add status badges to claims/arguments

### Phase 2: Modal Refactor (3-5 days)

1. **Create unified `DialogueMoveModal` component**
   - Supports all move types (WHY, GROUNDS, CLOSE, CONCEDE, etc.)
   - Context-aware UI
   - Preview functionality

2. **Update all interfaces to use new modal**
   - LegalMoveChips
   - LegalMoveToolbar
   - CommandCard

3. **Add confirmation dialogs for important moves**
   - CLOSE: "Are you sure?"
   - CONCEDE: "This will add to your commitments"

### Phase 3: Unified Interface (5-7 days)

1. **Create single "Dialogue Actions" button/menu**
   - Replace fragmented toolbars
   - Dropdown with all available moves
   - Each option opens appropriate modal

2. **Add dialogue state indicators**
   - Visual badges on claims/arguments
   - Notification dot for unanswered challenges
   - Timeline view of dialogue history

3. **Improve discoverability**
   - Onboarding tooltips for new users
   - "Tutorial" mode highlighting dialogue actions
   - Help documentation panel

---

## Detailed Component Specs

### `DialogueMoveModal` Component

**Props**:
```tsx
interface DialogueMoveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  // Move configuration
  moveType: 'WHY' | 'GROUNDS' | 'CLOSE' | 'CONCEDE' | 'RETRACT';
  
  // Target information
  deliberationId: string;
  targetType: 'claim' | 'argument' | 'card';
  targetId: string;
  locusPath?: string;
  
  // Context for display
  context: {
    claimText?: string;          // For WHY/CONCEDE
    challengeText?: string;       // For GROUNDS (show original WHY)
    challengeAuthor?: string;     // Who asked WHY
    scheme?: {                    // For scheme-based moves
      name: string;
      cqText: string;
    };
  };
  
  // Callbacks
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}
```

**UI Structure**:

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-2xl">
    {/* Header */}
    <DialogHeader>
      <DialogTitle>{getTitle(moveType)}</DialogTitle>
      <DialogDescription>{getDescription(moveType)}</DialogDescription>
    </DialogHeader>

    {/* Context */}
    {context.claimText && (
      <div className="context-panel">
        <label>Regarding claim:</label>
        <blockquote>{context.claimText}</blockquote>
      </div>
    )}

    {context.challengeText && (
      <div className="challenge-panel">
        <label>Challenge by {context.challengeAuthor}:</label>
        <blockquote>{context.challengeText}</blockquote>
      </div>
    )}

    {/* Main input */}
    <div className="input-section">
      <Label>Your {getMoveLabel(moveType)}:</Label>
      <Textarea
        placeholder={getPlaceholder(moveType)}
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      
      {/* Contextual help */}
      <HelpText moveType={moveType} />
    </div>

    {/* Optional: Commitment checkbox (for GROUNDS) */}
    {moveType === 'GROUNDS' && (
      <Checkbox
        checked={addToCommitments}
        onCheckedChange={setAddToCommitments}
      >
        <Label>
          Add to my commitment store
          <span className="help-text">
            (Your commitments can be referenced in future arguments)
          </span>
        </Label>
      </Checkbox>
    )}

    {/* Preview (optional) */}
    {showPreview && (
      <div className="preview-panel">
        <Label>Preview:</Label>
        <div className="preview-content">
          <MovePreview moveType={moveType} text={text} />
        </div>
      </div>
    )}

    {/* Footer */}
    <DialogFooter>
      <Button variant="ghost" onClick={() => onOpenChange(false)}>
        Cancel
      </Button>
      <Button
        onClick={handlePreview}
        variant="outline"
        disabled={!text.trim()}
      >
        Preview
      </Button>
      <Button
        onClick={handleSubmit}
        disabled={!text.trim() || isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : `Submit ${getMoveLabel(moveType)}`}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### `DialogueActionsMenu` Component

**Simplified entry point for all moves**:

```tsx
export function DialogueActionsMenu({
  deliberationId,
  targetType,
  targetId,
  locusPath,
  claimText,
}: Props) {
  const [modalState, setModalState] = useState<{
    type: MoveType | null;
    open: boolean;
  }>({ type: null, open: false });

  const { data: legalMoves } = useSWR(
    `/api/dialogue/legal-moves?...`
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            💬 Dialogue Actions
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Challenge */}
          {canDo('WHY') && (
            <DropdownMenuItem
              onClick={() => setModalState({ type: 'WHY', open: true })}
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              <span>Challenge (Ask WHY)</span>
            </DropdownMenuItem>
          )}
          
          {/* Answer */}
          {canDo('GROUNDS') && (
            <DropdownMenuItem
              onClick={() => setModalState({ type: 'GROUNDS', open: true })}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Answer Challenge</span>
              {openChallenges > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {openChallenges}
                </Badge>
              )}
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          {/* Concede */}
          {canDo('CONCEDE') && (
            <DropdownMenuItem
              onClick={() => setModalState({ type: 'CONCEDE', open: true })}
            >
              <Check className="mr-2 h-4 w-4 text-green-600" />
              <span>Concede (Accept)</span>
            </DropdownMenuItem>
          )}
          
          {/* Close */}
          {canDo('CLOSE') && (
            <DropdownMenuItem
              onClick={() => setModalState({ type: 'CLOSE', open: true })}
            >
              <Flag className="mr-2 h-4 w-4 text-blue-600" />
              <span>Close Discussion</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={openDialogueHistory}>
            <History className="mr-2 h-4 w-4" />
            <span>View Dialogue History</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Unified modal for all move types */}
      <DialogueMoveModal
        open={modalState.open}
        onOpenChange={(open) => setModalState({ ...modalState, open })}
        moveType={modalState.type}
        deliberationId={deliberationId}
        targetType={targetType}
        targetId={targetId}
        locusPath={locusPath}
        context={{ claimText }}
        onSuccess={() => {
          setModalState({ type: null, open: false });
          // Refresh, show success notification, etc.
        }}
      />
    </>
  );
}
```

---

## Success Metrics

### Before (Current State)
- ❌ 10+ steps to make a WHY move
- ❌ Browser `prompt()` for GROUNDS
- ❌ CommandCard hidden by default
- ❌ No confirmation for CLOSE
- ❌ 1.4s toast easy to miss
- ❌ Users ask "how do I challenge this?"

### After (Improved State)
- ✅ 3 steps: Click button → Modal → Submit
- ✅ Proper modal for GROUNDS with context
- ✅ CommandCard or unified menu as primary UI
- ✅ Confirmation dialogs for important moves
- ✅ 5s notification bar with action buttons
- ✅ Users say "this is easy to use!"

---

## Related Documentation

- **CommandCard Actions**: `COMMANDCARD_ACTIONS_EXPLAINED.md`
- **GROUNDS System**: `GROUNDS_EXPLANATION.md`
- **Answer-and-Commit**: `ANSWER_AND_COMMIT_INTEGRATION_SUMMARY.md`
- **Dialogue Inspector**: `DIALOGUE_INSPECTOR_GUIDE.md`

---

**Created**: January 2025  
**Status**: 🚧 Analysis complete, awaiting implementation  
**Priority**: HIGH - Core UX issue affecting user engagement
