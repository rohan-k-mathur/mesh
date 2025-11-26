# Commitment Creation: UI Flows & Dialogue Move Types

**Date**: November 25, 2025  
**Purpose**: Comprehensive overview of how commitments are created through the UI and which dialogue moves trigger commitment tracking.

---

## Table of Contents
1. [Commitment System Overview](#commitment-system-overview)
2. [Dialogue Move Types](#dialogue-move-types)
3. [UI Entry Points](#ui-entry-points)
4. [Commitment-Creating Moves](#commitment-creating-moves)
5. [Non-Commitment Moves](#non-commitment-moves)
6. [API Flow](#api-flow)
7. [Examples](#examples)

---

## Commitment System Overview

### What is a Commitment?

In formal dialogue games, a **commitment** is a proposition that a participant has explicitly endorsed (through ASSERT or CONCEDE moves). The **commitment store** tracks which claims each participant is committed to at any point in the dialogue.

### Commitment Store Semantics

```
Commitment Store = Set of claims a participant is responsible for defending
```

**Operations**:
- **ASSERT** → Adds your own claim to your commitment store
- **CONCEDE** → Adds opponent's claim to your commitment store
- **RETRACT** → Removes claim from your commitment store (soft delete)

**Rules** (from formal dialogue theory):
1. You can only RETRACT claims you previously asserted
2. CONCEDE means accepting opponent's burden to defend that claim
3. WHY challenges can only target claims in someone's commitment store
4. GROUNDS responses must address claims in your own commitment store

---

## Dialogue Move Types

### Full Taxonomy

```typescript
type MoveKind =
  // === Commitment-Creating Moves ===
  | "ASSERT"           // Post new claim → YOUR commitment store
  | "CONCEDE"          // Accept opponent's claim → YOUR commitment store
  | "THEREFORE"        // Infer conclusion → YOUR commitment store
  
  // === Commitment-Removing Moves ===
  | "RETRACT"          // Withdraw claim → Remove from YOUR commitment store
  
  // === Non-Commitment Moves ===
  | "WHY"              // Challenge → No commitment created
  | "GROUNDS"          // Answer challenge → No direct commitment (creates Argument)
  | "CLOSE"            // End dialogue branch → No commitment
  | "ACCEPT_ARGUMENT"  // Accept argument structure → No commitment
  | "SUPPOSE"          // Hypothetical assumption → Conditional commitment
  | "DISCHARGE";       // Fulfill conditional → No commitment
```

---

## UI Entry Points

### 1. **CommandCard / LegalMoveToolbar** (Primary Interface)

**Location**: Appears when a claim or argument is selected in various views

**Components**:
- `CommandCard.tsx` - 3×3 grid of action buttons
- `LegalMoveToolbar.tsx` - Wrapper with view toggle (grid vs chips)
- `LegalMoveToolbarAIF.tsx` - AIF-specific variant

**How It Works**:
1. User selects a claim or argument node
2. System fetches legal moves via `GET /api/dialogue/moves/legal`
3. Moves are converted to CommandCardActions via `movesToActions()`
4. CommandCard displays available moves in a grid layout

**Grid Layout** (3×3):
```
┌─────────────┬─────────────┬─────────────┐
│  WHY        │  THEREFORE  │  SUPPOSE    │  ← Top row (protocol)
├─────────────┼─────────────┼─────────────┤
│  CONCEDE    │  RETRACT    │  ACCEPT_ARG │  ← Mid row (surrender)
├─────────────┼─────────────┼─────────────┤
│  GROUNDS    │  CLOSE      │  DISCHARGE  │  ← Bottom row (resolution)
└─────────────┴─────────────┴─────────────┘
```

**User Flow**:
```
User clicks claim/argument
  ↓
CommandCard displays legal moves
  ↓
User clicks move button (e.g., "CONCEDE")
  ↓
Modal opens (if needed for input)
  ↓
User fills in text/reasoning
  ↓
POST /api/dialogue/move
  ↓
Commitment created/updated
```

**Files**:
- `components/dialogue/command-card/CommandCard.tsx`
- `components/dialogue/LegalMoveToolbar.tsx`
- `components/dialogue/LegalMoveToolbarAIF.tsx`
- `lib/dialogue/movesToActions.ts` (adapter)

---

### 2. **DialogueActionsModal** (Comprehensive Move Selector)

**Location**: Modal dialog for more detailed move selection with categories

**Features**:
- Tabbed interface: "Protocol" | "Structural" | "Critical Questions"
- Move descriptions and icons
- Disabled state with explanations
- CQ context panel (shows related critical questions)

**Categories**:

**Protocol Moves** (Commitment-relevant):
- WHY - Challenge justification
- GROUNDS - Provide justification
- CONCEDE - Accept opponent's claim ✅ **Creates Commitment**
- RETRACT - Withdraw your claim ✅ **Removes Commitment**
- CLOSE - Mark thread concluded
- ACCEPT_ARGUMENT - Accept full argument

**Structural Moves**:
- THEREFORE - Infer conclusion ✅ **Creates Commitment**
- SUPPOSE - Hypothetical assumption
- DISCHARGE - Fulfill hypothetical

**Critical Questions** (CQ Context):
- Shows open/answered CQs for the target
- Links to WHY/GROUNDS moves with CQ context

**User Flow**:
```
User right-clicks claim → "Show All Moves"
  ↓
DialogueActionsModal opens with tabs
  ↓
User selects category tab
  ↓
User clicks move card
  ↓
Specific modal opens (NLCommitPopover, WhyChallengeModal, etc.)
  ↓
User provides input
  ↓
POST /api/dialogue/move
```

**Files**:
- `components/dialogue/DialogueActionsModal.tsx`
- `components/dialogue/NLCommitPopover.tsx` (for ASSERT/CONCEDE/RETRACT)
- `components/dialogue/WhyChallengeModal.tsx` (for WHY)
- `components/dialogue/StructuralMoveModal.tsx` (for THEREFORE/SUPPOSE)

---

### 3. **Critical Questions UI**

**Locations**:
- `CriticalQuestionsV3.tsx` - Main CQ interface
- `SchemeSpecificCQsModal.tsx` - Scheme-specific CQs modal
- `CriticalQuestions.tsx` - Legacy CQ interface

**How CQs Create Commitments**:

**Scenario 1: Asking a Critical Question (WHY)**
```
User clicks "Ask CQ" button on argument
  ↓
CQ panel shows available critical questions
  ↓
User selects a CQ (e.g., "Is the expert credible?")
  ↓
POST /api/dialogue/move (kind: "WHY", payload: { cqId: "..." })
  ↓
NO commitment created (WHY is a challenge, not a claim)
```

**Scenario 2: Answering a Critical Question (GROUNDS)**
```
User sees open CQ on their argument
  ↓
User clicks "Answer" button
  ↓
User types answer text
  ↓
POST /api/dialogue/move (kind: "GROUNDS", payload: { cqId, text })
  ↓
Creates Argument node (not direct commitment)
  ↓
If GROUNDS includes new claims → THOSE get committed
```

**Scenario 3: Objecting to an Argument (REBUTS/UNDERCUTS)**
```
User clicks "Object" on opponent's argument
  ↓
Modal shows objection types (Rebut, Undercut, Undermine)
  ↓
User selects type and writes objection claim
  ↓
1. POST /api/claims (creates new claim) ✅ **Creates Commitment**
  ↓
2. POST /api/dialogue/move (kind: "GROUNDS", links claim to CQ)
  ↓
3. POST /api/ca (creates ConflictApplication - attack link)
```

**Files**:
- `components/claims/CriticalQuestionsV3.tsx`
- `components/arguments/SchemeSpecificCQsModal.tsx`
- `components/claims/CriticalQuestions.tsx`

---

### 4. **Direct Claim Creation**

**Locations**:
- Claim composer interfaces
- "Add Claim" buttons in various panels
- Argument premise creation

**Flow for New Claims**:
```
User clicks "Add Claim" button
  ↓
Claim composer modal opens
  ↓
User types claim text
  ↓
POST /api/claims (creates Claim record)
  ↓
POST /api/dialogue/move (kind: "ASSERT", targetType: "claim", targetId: claimId)
  ↓
✅ Commitment created and added to user's commitment store
```

**Note**: ASSERT moves are often implicit - when you create a claim, an ASSERT move is automatically created.

**Files**:
- Various claim creation UIs across the codebase
- Always results in ASSERT dialogue move

---

### 5. **Discourse Dashboard** (Forum-Style Interface)

**Location**: `components/discourse/DiscourseDashboard.tsx`

**Features**:
- Thread-based discussion view
- Response dropdown with dialogue moves
- CONCEDE option for accepting WHY challenges

**CONCEDE Flow** (Accepting a Challenge):
```
User sees WHY challenge on their claim
  ↓
User clicks "Respond" dropdown
  ↓
User selects "CONCEDE (Accept)" option
  ↓
POST /api/dialogue/move (kind: "ASSERT", payload: { as: "CONCEDE" })
  ↓
✅ Opponent's claim added to YOUR commitment store
```

**Note**: CONCEDE is represented as `ASSERT` with `payload.as = "CONCEDE"` marker. This is a legacy pattern.

**Files**:
- `components/discourse/DiscourseDashboard.tsx`

---

### 6. **Deep Dive Panel** (Detailed Claim Explorer)

**Location**: `components/deepdive/DeepDivePanelV2.tsx`

**Features**:
- Detailed claim view with full dialogue history
- Integrated CommandCard for moves
- Commitment store visualization

**Flow**:
```
User clicks claim in graph/list
  ↓
DeepDivePanel shows claim details
  ↓
CommandCard shows legal moves at bottom
  ↓
User performs move (same as CommandCard flow above)
```

**Files**:
- `components/deepdive/DeepDivePanelV2.tsx`

---

### 7. **Argument Composer** (Creating Arguments with Premises)

**Location**: `components/arguments/AIFArgumentWithSchemeComposer.tsx`

**How Arguments Create Commitments**:

**Creating an Argument**:
```
User clicks "Create Argument"
  ↓
Argument composer opens
  ↓
User selects scheme (e.g., "Expert Opinion")
  ↓
User adds premise claims
  ↓
For each premise:
  - POST /api/claims (if new claim)
  - Implicit ASSERT move created
  - ✅ Claim added to YOUR commitment store
  ↓
User adds conclusion claim
  ↓
POST /api/arguments (creates Argument with premises)
  ↓
POST /api/dialogue/move (kind: "GROUNDS", argumentId)
```

**Result**: All premise claims and conclusion are added to your commitment store.

**Files**:
- `components/arguments/AIFArgumentWithSchemeComposer.tsx`
- `components/dialogue/LegalMoveToolbarAIF.tsx` (embedded)

---

### 8. **Negotiation Drawer** (Map-Based Dialogue)

**Location**: `components/map/NegotiationDrawerV2.tsx`

**Features**:
- Map-based visualization of dialogue
- Quick move buttons for common actions
- Locus-aware move creation

**Flow**:
```
User navigates map to specific locus
  ↓
Drawer shows available moves for that locus
  ↓
User clicks move button
  ↓
POST /api/dialogue/move (with locusPath)
```

**Files**:
- `components/map/NegotiationDrawerV2.tsx`
- `components/map/NegotiationDrawer.tsx` (legacy)

---

## Commitment-Creating Moves

### 1. ASSERT (Primary Commitment Creator)

**Purpose**: Introduce a new claim into the dialogue

**Commitment Effect**: Adds claim to **YOUR** commitment store

**UI Triggers**:
- Creating a new claim via claim composer
- Posting a statement in discourse view
- Adding a premise to an argument
- Introducing a conclusion via THEREFORE (internally uses ASSERT)

**API Call**:
```typescript
POST /api/dialogue/move
{
  deliberationId: string,
  targetType: "claim",
  targetId: claimId,
  kind: "ASSERT",
  payload: {
    text: "Claim text...",
    locusPath: "0" // optional
  }
}
```

**Database Effect**:
```typescript
// In computeCommitmentStores()
if (move.kind === "ASSERT" && move.targetType === "claim") {
  store.commitments.push({
    claimId: move.targetId,
    claimText: claimText,
    moveId: move.id,
    moveKind: "ASSERT",
    timestamp: move.createdAt,
    isActive: true
  });
}
```

**Examples**:
- "Climate change is caused by human activity" (new claim)
- "The study methodology was sound" (premise in argument)
- "Therefore, we should reduce emissions" (conclusion via THEREFORE)

---

### 2. CONCEDE (Cross-Partisan Commitment)

**Purpose**: Accept an opponent's claim or position

**Commitment Effect**: Adds opponent's claim to **YOUR** commitment store

**UI Triggers**:
- Clicking "CONCEDE" button in CommandCard
- Selecting "Accept" option in discourse response dropdown
- Resolving a WHY challenge by accepting the opponent's point

**API Call**:
```typescript
POST /api/dialogue/move
{
  deliberationId: string,
  targetType: "claim",
  targetId: opponentClaimId,
  kind: "ASSERT", // ← Note: Legacy pattern uses ASSERT
  payload: {
    as: "CONCEDE", // ← Marker indicating CONCEDE semantics
    expression: "I accept this point because...",
    locusPath: "0"
  }
}
```

**Alternative (Newer Pattern)**:
```typescript
POST /api/dialogue/move
{
  kind: "CONCEDE", // Direct CONCEDE move kind
  targetType: "claim",
  targetId: opponentClaimId,
  payload: {
    expression: "Concession reasoning..."
  }
}
```

**Database Effect**:
```typescript
// In computeCommitmentStores()
if (move.kind === "CONCEDE" || move.payload?.as === "CONCEDE") {
  store.commitments.push({
    claimId: move.targetId,
    claimText: claimText,
    moveId: move.id,
    moveKind: "CONCEDE",
    timestamp: move.createdAt,
    isActive: true
  });
}
```

**Strategic Implications**:
- You now have burden to defend this claim
- Opponent can WHY challenge you on this claim
- Shows intellectual honesty (accepting valid points)
- May be required by dialogue rules (R6 - accept proven claims)

**Examples**:
- Opponent: "The data shows X"
- You: CONCEDE → "Yes, I accept that the data shows X"
- Result: "The data shows X" is now in YOUR commitment store

---

### 3. THEREFORE (Inferential Commitment)

**Purpose**: Introduce a conclusion that follows from previous premises

**Commitment Effect**: Adds conclusion claim to **YOUR** commitment store

**UI Triggers**:
- Clicking "THEREFORE" button in CommandCard
- Selecting "THEREFORE" in DialogueActionsModal → Structural tab
- Creating an argument with explicit inference step

**API Call**:
```typescript
POST /api/dialogue/move
{
  deliberationId: string,
  targetType: "claim",
  targetId: conclusionClaimId,
  kind: "THEREFORE",
  payload: {
    expression: "Therefore, [conclusion] because [premises]...",
    locusPath: "0.1" // Child locus indicating inference
  }
}
```

**Database Effect**:
```typescript
// In computeCommitmentStores()
if (move.kind === "THEREFORE" && move.targetType === "claim") {
  store.commitments.push({
    claimId: move.targetId,
    claimText: claimText,
    moveId: move.id,
    moveKind: "ASSERT", // Treated as ASSERT for commitment tracking
    timestamp: move.createdAt,
    isActive: true
  });
}
```

**Dialogue Semantics**:
- THEREFORE makes explicit the inference step
- Links conclusion to supporting premises
- Creates inferential burden (must defend the inference rule)

**Example Flow**:
```
Premise 1 (committed): "All experts agree X"
Premise 2 (committed): "Dr. Smith is an expert"
  ↓
THEREFORE: "Dr. Smith agrees X"
  ↓
Result: "Dr. Smith agrees X" added to your commitment store
```

---

## Commitment-Removing Moves

### 4. RETRACT (Withdrawal of Commitment)

**Purpose**: Withdraw a claim you previously asserted

**Commitment Effect**: Removes claim from **YOUR** commitment store (soft delete)

**UI Triggers**:
- Clicking "RETRACT" button in CommandCard
- Selecting "RETRACT" in DialogueActionsModal
- Realizing you made an error and need to withdraw

**API Call**:
```typescript
POST /api/dialogue/move
{
  deliberationId: string,
  targetType: "claim",
  targetId: yourClaimId,
  kind: "RETRACT",
  payload: {
    expression: "I withdraw this claim because...",
    locusPath: "0"
  }
}
```

**Database Effect**:
```typescript
// In computeCommitmentStores()
if (move.kind === "RETRACT" && move.targetType === "claim") {
  // Find all prior commitments to this claim by this participant
  const commitments = store.commitments.filter(c => c.claimId === move.targetId);
  
  // Mark them as retracted (soft delete)
  commitments.forEach(c => {
    c.isActive = false;
    c.retractedAt = move.createdAt;
    c.retractedByMoveId = move.id;
  });
}
```

**Rules**:
- Can only RETRACT claims YOU asserted
- Cannot RETRACT opponent's claims (use WHY challenge instead)
- Retraction is permanent (cannot "un-retract")
- Retracted claims still visible in history (soft delete)

**Strategic Implications**:
- Admitting error or changed position
- May weaken related arguments that depend on this claim
- Opponent cannot WHY challenge a retracted claim

**Examples**:
- You: "X is true" (ASSERT)
- Opponent: "Why?" (WHY)
- You: "Actually, I was wrong" (RETRACT)
- Result: "X is true" marked as inactive in your commitment store

---

## Non-Commitment Moves

### 5. WHY (Challenge - No Commitment)

**Purpose**: Challenge the justification for a claim or argument

**Commitment Effect**: **NONE** - WHY does not create commitments

**Rationale**: 
- WHY is a *question*, not a claim
- Asking "why?" doesn't commit you to anything
- It places burden on opponent to provide GROUNDS

**UI Triggers**:
- Clicking "Ask WHY" button in CommandCard
- Selecting a critical question from CQ panel
- Right-clicking claim → "Challenge"

**API Call**:
```typescript
POST /api/dialogue/move
{
  deliberationId: string,
  targetType: "claim" | "argument",
  targetId: targetId,
  kind: "WHY",
  payload: {
    cqId: "scheme-expert-credibility", // Optional CQ context
    expression: "Why should we believe this?",
    locusPath: "0"
  }
}
```

**Database Effect**: No commitment record created

**Dialogue Effect**:
- Creates ConflictApplication (challenge record)
- Sets WHY status to "open" (waiting for GROUNDS)
- Places burden on opponent to respond

**Examples**:
- Opponent: "The expert is credible"
- You: WHY → "Why is the expert credible?" (CQ)
- Result: No commitment added to YOUR store, opponent must answer

---

### 6. GROUNDS (Answer - Indirect Commitment)

**Purpose**: Provide justification for a challenged claim

**Commitment Effect**: **INDIRECT** - GROUNDS creates an Argument, which may contain new claims

**Rationale**:
- GROUNDS is an *answer* to WHY, not a claim itself
- However, the GROUNDS response typically includes new claims
- Those NEW claims are what get committed (via implicit ASSERT)

**UI Triggers**:
- Clicking "Provide GROUNDS" button in CommandCard
- Answering a critical question via CQ panel
- Responding to WHY challenge

**API Call**:
```typescript
POST /api/dialogue/move
{
  deliberationId: string,
  targetType: "argument" | "claim",
  targetId: whyChallengeId,
  kind: "GROUNDS",
  payload: {
    cqId: "scheme-expert-credibility",
    expression: "The expert has 20 years experience and multiple publications...",
    locusPath: "0.1", // Child locus (answer)
    schemeKey: "expert-opinion" // Optional scheme
  }
}
```

**Database Effect**:
```typescript
// 1. Creates Argument node
const argument = await prisma.argument.create({
  text: payload.expression,
  conclusionClaimId: targetId,
  schemeId: schemeId,
  createdByMoveId: move.id
});

// 2. If GROUNDS includes NEW claims as premises:
for (const premiseClaim of newClaims) {
  // Implicit ASSERT for each premise
  // ✅ These get committed to your store
}
```

**Example**:
```
Opponent: WHY → "Why is Dr. Smith an expert?"
You: GROUNDS → "Because Dr. Smith has 20 years of experience (premise 1) 
                 and has published 50 papers (premise 2)"

Result:
- Argument created with 2 premises
- "Dr. Smith has 20 years experience" → YOUR commitment store ✅
- "Dr. Smith has published 50 papers" → YOUR commitment store ✅
```

---

### 7. CLOSE (Thread Conclusion - No Commitment)

**Purpose**: Mark a dialogue thread as concluded

**Commitment Effect**: **NONE**

**UI Triggers**:
- Clicking "CLOSE" button in CommandCard
- Selecting "CLOSE (†)" in DialogueActionsModal
- All critical questions satisfied

**API Call**:
```typescript
POST /api/dialogue/move
{
  deliberationId: string,
  targetType: "claim" | "argument",
  targetId: targetId,
  kind: "CLOSE",
  payload: {
    locusPath: "0.1"
  }
}
```

**Ludics Effect**: Inserts daimon (†) symbol, indicating dialogue completion

---

### 8. ACCEPT_ARGUMENT (Structural Acceptance - No Direct Commitment)

**Purpose**: Accept an argument as valid (R7 rule)

**Commitment Effect**: **INDIRECT** - Accepting the argument means accepting its conclusion

**UI Triggers**:
- Clicking "ACCEPT" button in CommandCard
- Accepting fully justified argument per dialogue rules

**Note**: In practice, accepting an argument = CONCEDE conclusion claim

---

### 9. SUPPOSE (Hypothetical - Conditional Commitment)

**Purpose**: Introduce hypothetical assumption for conditional reasoning

**Commitment Effect**: **CONDITIONAL** - Only committed within SUPPOSE scope

**UI Triggers**:
- Clicking "SUPPOSE" in DialogueActionsModal → Structural tab
- Creating hypothetical "what if" scenario

**Example**:
```
SUPPOSE: "If we reduce emissions by 50%..."
  ↓
(nested reasoning about consequences)
  ↓
DISCHARGE: "Therefore, [conclusion under assumption]"
```

**Note**: SUPPOSE commitments are scoped and don't persist after DISCHARGE

---

### 10. DISCHARGE (Hypothetical Conclusion - No Commitment)

**Purpose**: Close a SUPPOSE scope and state conditional conclusion

**Commitment Effect**: **NONE** (or returns to pre-SUPPOSE state)

---

## API Flow

### Complete Flow: Creating a Commitment via UI

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   UI Component       │
              │ (CommandCard, CQ,    │
              │  DialogueActions)    │
              └──────────┬───────────┘
                         │
                         │ User clicks move button
                         ▼
              ┌──────────────────────┐
              │   Modal (if needed)  │
              │ NLCommitPopover,     │
              │ WhyChallengeModal,   │
              │ StructuralMoveModal  │
              └──────────┬───────────┘
                         │
                         │ User provides text/reasoning
                         ▼
              ┌──────────────────────┐
              │ POST /api/dialogue/  │
              │      move            │
              └──────────┬───────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│                    BACKEND PROCESSING                           │
│                                                                 │
│  1. Validate request (auth, params)                            │
│  2. Compute signature (deduplication)                          │
│  3. Check for existing move (idempotency)                      │
│  4. Create DialogueMove record                                 │
│  5. Create related records (Argument, Claim, etc.)             │
│  6. Emit "dialogue:cs:refresh" event                           │
│  7. Trigger ludics compilation (if autoCompile)                │
│  8. Sync to AIF graph                                          │
│  9. Invalidate insights cache                                  │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Commitment Store     │
              │ Computation          │
              │ (graph-builder.ts)   │
              └──────────┬───────────┘
                         │
                         │ SQL query with JOINs
                         ▼
              ┌──────────────────────┐
              │ Build Participant    │
              │ Commitment Stores    │
              └──────────┬───────────┘
                         │
                         │ For each DialogueMove:
                         │   If ASSERT/CONCEDE → Add commitment
                         │   If RETRACT → Mark inactive
                         ▼
              ┌──────────────────────┐
              │ Return Commitments   │
              │ with Promotion Status│
              └──────────┬───────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│                         UI UPDATE                               │
│                                                                 │
│  1. CommitmentStorePanel refreshes                             │
│  2. Commitments list updated                                   │
│  3. Active/retracted badges shown                              │
│  4. Promotion status displayed (if promoted to ludics)         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Examples

### Example 1: Simple ASSERT Flow

**Scenario**: User creates a new claim

```typescript
// UI: User clicks "Add Claim" button
// 1. Claim creation
POST /api/claims
{
  text: "Climate change is caused by human activity",
  deliberationId: "delib-001"
}
Response: { id: "claim-abc" }

// 2. Dialogue move creation (automatic)
POST /api/dialogue/move
{
  deliberationId: "delib-001",
  targetType: "claim",
  targetId: "claim-abc",
  kind: "ASSERT",
  payload: { locusPath: "0" }
}

// 3. Backend processing
// - Creates DialogueMove record
// - move.kind = "ASSERT"
// - move.targetType = "claim"
// - move.targetId = "claim-abc"
// - move.actorId = "proponent" (current user)

// 4. Commitment store computation
// In computeCommitmentStores():
const stores = {
  proponent: {
    participantId: "proponent",
    participantName: "Alice",
    commitments: [
      {
        claimId: "claim-abc",
        claimText: "Climate change is caused by human activity",
        moveId: "move-123",
        moveKind: "ASSERT",
        timestamp: "2025-11-25T10:30:00Z",
        isActive: true,
        isPromoted: false
      }
    ]
  }
};

// 5. UI update
// CommitmentStorePanel shows:
// - "Climate change is caused by human activity" ✓ Active
// - Move kind: ASSERT
// - Timestamp: 10:30 AM
// - "Promote to Ludics" button visible
```

---

### Example 2: CONCEDE Flow (Cross-Partisan Commitment)

**Scenario**: User accepts opponent's claim

```typescript
// Initial state:
// Opponent (Bob) has committed: "Renewable energy is cost-effective"

// UI: User (Alice) clicks "CONCEDE" on Bob's claim

POST /api/dialogue/move
{
  deliberationId: "delib-001",
  targetType: "claim",
  targetId: "claim-xyz", // Bob's claim
  kind: "CONCEDE",
  payload: {
    expression: "I agree that renewable energy has become cost-effective",
    locusPath: "0"
  }
}

// Backend processing:
// - Creates DialogueMove with kind="CONCEDE"
// - move.actorId = "proponent" (Alice)
// - move.targetId = "claim-xyz" (Bob's claim)

// Commitment store computation:
const stores = {
  proponent: { // Alice's store
    commitments: [
      // ... Alice's previous commitments
      {
        claimId: "claim-xyz", // ← Bob's claim!
        claimText: "Renewable energy is cost-effective",
        moveId: "move-456",
        moveKind: "CONCEDE", // ← Cross-partisan commitment
        timestamp: "2025-11-25T10:35:00Z",
        isActive: true
      }
    ]
  },
  opponent: { // Bob's store (unchanged)
    commitments: [
      {
        claimId: "claim-xyz",
        claimText: "Renewable energy is cost-effective",
        moveKind: "ASSERT", // Bob's original commitment
        isActive: true
      }
    ]
  }
};

// Result: BOTH Alice and Bob are now committed to the same claim!
```

---

### Example 3: RETRACT Flow (Commitment Removal)

**Scenario**: User withdraws a previous claim

```typescript
// Initial state:
// Alice committed to: "Solar panels last 10 years"

// UI: Alice clicks "RETRACT" on her own claim

POST /api/dialogue/move
{
  deliberationId: "delib-001",
  targetType: "claim",
  targetId: "claim-abc",
  kind: "RETRACT",
  payload: {
    expression: "I was mistaken - solar panels last 25+ years",
    locusPath: "0"
  }
}

// Backend processing:
// - Creates DialogueMove with kind="RETRACT"
// - Does NOT delete prior ASSERT move (history preserved)

// Commitment store computation:
const stores = {
  proponent: {
    commitments: [
      {
        claimId: "claim-abc",
        claimText: "Solar panels last 10 years",
        moveId: "move-789",
        moveKind: "ASSERT", // Original move
        timestamp: "2025-11-25T09:00:00Z",
        isActive: false, // ← Marked inactive by RETRACT
        retractedAt: "2025-11-25T10:40:00Z",
        retractedByMoveId: "move-790"
      }
    ]
  }
};

// UI update:
// - Claim shown with strikethrough
// - Badge: "RETRACTED"
// - Tooltip shows retraction reason
```

---

### Example 4: WHY → GROUNDS Flow (No Direct Commitment)

**Scenario**: Challenge and response with new claims

```typescript
// Step 1: Opponent challenges Alice's claim

POST /api/dialogue/move
{
  deliberationId: "delib-001",
  targetType: "claim",
  targetId: "claim-abc", // Alice's claim
  kind: "WHY",
  payload: {
    cqId: "expert-credibility",
    expression: "Why is this expert credible?",
    locusPath: "0"
  }
}

// Result: NO commitment created (WHY is a question)
// - Creates ConflictApplication (challenge record)
// - WHY status: "open" (awaiting GROUNDS)

// Step 2: Alice provides GROUNDS response

POST /api/dialogue/move
{
  deliberationId: "delib-001",
  targetType: "argument", // or claim
  targetId: "ca-123", // The WHY challenge
  kind: "GROUNDS",
  payload: {
    cqId: "expert-credibility",
    expression: "The expert has 20 years experience",
    locusPath: "0.1", // Child locus (answer)
    schemeKey: "expert-opinion"
  }
}

// Backend processing:
// 1. Creates Argument node
const argument = {
  id: "arg-999",
  text: "The expert has 20 years experience",
  conclusionClaimId: "claim-abc",
  schemeId: "expert-opinion-scheme",
  createdByMoveId: "move-800"
};

// 2. Creates premise claims (if new)
// "The expert has 20 years experience" → New claim!
POST /api/claims (internal)
{
  text: "The expert has 20 years experience",
  deliberationId: "delib-001"
}

// 3. Implicit ASSERT for premise
// ✅ THIS creates the commitment!

// Commitment store result:
const stores = {
  proponent: {
    commitments: [
      // ... existing commitments
      {
        claimId: "claim-new",
        claimText: "The expert has 20 years experience",
        moveKind: "ASSERT", // Implicit ASSERT via GROUNDS premise
        isActive: true
      }
    ]
  }
};

// Key insight: GROUNDS doesn't directly create commitment,
// but the PREMISES in the GROUNDS response do!
```

---

### Example 5: THEREFORE Flow (Inferential Commitment)

**Scenario**: User draws a conclusion from premises

```typescript
// Initial state:
// Alice committed to:
//   - "All experts agree X"
//   - "Dr. Smith is an expert"

// UI: Alice clicks "THEREFORE" and states conclusion

POST /api/dialogue/move
{
  deliberationId: "delib-001",
  targetType: "claim",
  targetId: "claim-conclusion",
  kind: "THEREFORE",
  payload: {
    expression: "Therefore, Dr. Smith agrees X",
    locusPath: "0.1" // Child locus indicating inference
  }
}

// Backend processing:
// - Creates DialogueMove with kind="THEREFORE"
// - Links to conclusion claim

// Commitment store computation:
const stores = {
  proponent: {
    commitments: [
      {
        claimId: "premise-1",
        claimText: "All experts agree X",
        moveKind: "ASSERT",
        isActive: true
      },
      {
        claimId: "premise-2",
        claimText: "Dr. Smith is an expert",
        moveKind: "ASSERT",
        isActive: true
      },
      {
        claimId: "claim-conclusion",
        claimText: "Dr. Smith agrees X",
        moveKind: "ASSERT", // THEREFORE treated as ASSERT
        timestamp: "2025-11-25T11:00:00Z",
        isActive: true
      }
    ]
  }
};

// Dialogue semantics:
// - THEREFORE makes inference explicit
// - Creates burden to defend inference rule
// - Opponent can challenge: "That doesn't follow!" (WHY the inference)
```

---

## Summary Table

| Move Type | Creates Commitment? | Adds to Store | UI Trigger | Example |
|-----------|---------------------|---------------|------------|---------|
| **ASSERT** | ✅ Yes (Direct) | YOUR store | Create claim, Add premise | "X is true" |
| **CONCEDE** | ✅ Yes (Cross-partisan) | YOUR store | Accept opponent's claim | "I agree X is true" |
| **THEREFORE** | ✅ Yes (Inference) | YOUR store | Draw conclusion | "Therefore X" |
| **RETRACT** | ❌ No (Removes) | Marks inactive | Withdraw your claim | "I take back X" |
| **WHY** | ❌ No (Challenge) | N/A | Ask critical question | "Why X?" |
| **GROUNDS** | ⚠️ Indirect | YOUR store (premises) | Answer WHY | "Because Y and Z" |
| **CLOSE** | ❌ No | N/A | End dialogue thread | "Dialogue complete (†)" |
| **ACCEPT_ARGUMENT** | ⚠️ Indirect | YOUR store (conclusion) | Accept full argument | "I accept this argument" |
| **SUPPOSE** | ⚠️ Conditional | Scoped store | Hypothetical reasoning | "Suppose X were true..." |
| **DISCHARGE** | ❌ No | N/A | Close hypothetical | "End supposition" |

**Legend**:
- ✅ **Direct commitment**: Move explicitly creates commitment
- ❌ **No commitment**: Move does not create commitment
- ⚠️ **Indirect commitment**: Move creates related records that may include commitments

---

## Key Insights

### 1. ASSERT is the Primary Commitment Creator

Almost all commitments trace back to ASSERT moves, even if created indirectly:
- Direct ASSERT: User creates claim → ASSERT move
- CONCEDE: Represented as ASSERT with `payload.as = "CONCEDE"` marker
- THEREFORE: Internally creates ASSERT for conclusion
- GROUNDS: Creates implicit ASSERTs for premise claims

### 2. WHY Does Not Create Commitments

This is critical: asking "why?" doesn't commit you to anything. It's a *challenge*, not a *claim*.

### 3. GROUNDS Creates Indirect Commitments

While GROUNDS doesn't directly create a commitment, the *premises* in your GROUNDS response become commitments.

### 4. Commitment Store = Historical Truth

The commitment store is computed from the *history* of DialogueMoves, not from a separate table. This ensures:
- Complete audit trail
- Temporal queries ("What were Alice's commitments at 10 AM?")
- No data inconsistency (single source of truth)

### 5. Soft Delete Pattern

RETRACT doesn't delete commitments - it marks them `isActive: false`. This preserves:
- Full dialogue history
- Ability to see what was retracted and when
- Provenance for downstream reasoning

---

## Next Steps

With this understanding, we can now implement **Option 4: Contradiction Detection** with confidence:

1. **Query commitment stores** for each participant
2. **Parse claim text** for negation patterns ("not", "never", etc.)
3. **Check for contradictions** between active commitments
4. **Alert users** before they commit to contradictory claims
5. **Display warnings** on existing contradictions in CommitmentStorePanel

The commitment creation flows are solid and comprehensive. Contradiction detection will layer on top of this existing infrastructure.

---

**End of Document**
