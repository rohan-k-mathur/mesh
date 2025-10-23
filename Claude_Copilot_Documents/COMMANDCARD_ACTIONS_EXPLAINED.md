# CommandCard Actions System - Complete End-to-End Explanation

## Overview

The **CommandCard** is a 3×3 grid UI component that displays available dialogue actions to users during structured debates. Each action represents a formal dialogue move following Prakken's Persuasion Protocol Dialogue (PPD) framework. This document explains how each action type works from UI click to database persistence to UI refresh.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Action Categories](#action-categories)
3. [Individual Action Workflows](#individual-action-workflows)
   - [Protocol Moves (Server-Side)](#protocol-moves-server-side)
   - [Scaffold Actions (Client-Side)](#scaffold-actions-client-side)
4. [Database Schema](#database-schema)
5. [Event System](#event-system)
6. [Integration Points](#integration-points)

---

## System Architecture

### Core Components

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  CommandCard.tsx│────▶│ /api/dialogue/   │────▶│ DialogueMove    │
│  (UI Component) │     │ move/route.ts    │     │ (Prisma Model)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                         │
        │ scaffold actions       │ compileFromMoves()      │
        ▼                        ▼                         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Composer Insert │     │ Ludics Engine    │     │ Commitment      │
│ (Client Event)  │     │ (Game Logic)     │     │ Store           │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### File Structure

**Core Files:**
- `components/dialogue/command-card/types.ts` - TypeScript definitions for actions
- `components/dialogue/command-card/CommandCard.tsx` - 3×3 grid UI component
- `lib/dialogue/movesToActions.ts` - Adapter: legal moves → CommandCard actions
- `components/dialogue/command-card/adapters.ts` - Alternative adapter
- `app/api/dialogue/move/route.ts` - API endpoint for protocol moves
- `lib/dialogue/types.ts` - Move kind definitions and force classification

**Integration Files:**
- `components/deepdive/DeepDivePanelV2.tsx` - Main UI container using CommandCard
- `components/dialogue/LegalMoveToolbar.tsx` - Alternative view of legal moves
- `components/dialogue/LegalMoveToolbarAIF.tsx` - AIF-specific toolbar

---

## Action Categories

### 1. Protocol Moves (Server-Side)
Actions that create `DialogueMove` records and update the commitment store:
- **WHY** - Challenge/question (attack)
- **GROUNDS** - Answer/justify (attack continues until closed)
- **CONCEDE** - Accept claim (surrender)
- **RETRACT** - Withdraw claim (surrender)
- **CLOSE** - End dialogue branch (surrender)
- **ACCEPT_ARGUMENT** - Accept entire argument as valid (surrender)
- **THEREFORE** - Introduce consequence (attack)
- **SUPPOSE** - Introduce supposition (neutral)
- **DISCHARGE** - Close supposition (neutral)

### 2. Scaffold Actions (Client-Side)
Actions that insert templates into the composer to help users structure responses:
- **FORALL_INSTANTIATE** (∀-inst) - Universal quantifier instantiation
- **EXISTS_WITNESS** (∃-witness) - Existential quantifier witness
- **PRESUP_CHALLENGE** (Presup?) - Challenge presupposition

---

## Individual Action Workflows

### Protocol Moves (Server-Side)

All protocol moves follow this general workflow:

```
User Click → CommandCard.performCommand() → POST /api/dialogue/move
    ↓
Validate Move (legal-moves check, protocol rules R1-R7)
    ↓
Create DialogueMove record (Prisma)
    ↓
Update Commitment Store (if CONCEDE/RETRACT/ACCEPT)
    ↓
Compile Ludics Design (compileFromMoves)
    ↓
Step Interaction (stepInteraction)
    ↓
Emit Events (dialogue:changed, dialogue:moves:refresh, dialogue:cs:refresh)
    ↓
UI Refresh (components listen to events)
```

---

### WHY (Question/Challenge)

**Purpose**: Challenge a claim or argument by asking for justification.

**User Experience**:
- User clicks "WHY" button in CommandCard
- System creates a critical question that must be answered

**End-to-End Flow**:

1. **UI Trigger** (`CommandCard.tsx`):
   ```typescript
   // User clicks WHY button
   {
     id: 'why-0',
     kind: 'WHY',
     label: 'WHY',
     force: 'ATTACK',
     move: {
       kind: 'WHY',
       payload: { cqId: 'eo-1', locusPath: '0' }
     },
     target: {
       deliberationId: 'delib_abc',
       targetType: 'claim',
       targetId: 'claim_xyz'
     }
   }
   ```

2. **API Call** (`performCommand()` function):
   ```typescript
   POST /api/dialogue/move
   {
     deliberationId: 'delib_abc',
     targetType: 'claim',
     targetId: 'claim_xyz',
     kind: 'WHY',
     payload: {
       cqId: 'eo-1',
       locusPath: '0',
       expression: 'Why do you claim this?'
     },
     autoCompile: true,
     autoStep: true
   }
   ```

3. **Server Processing** (`route.ts`):
   - **Validation**: Checks legal moves (can't WHY after CLOSE)
   - **Signature**: Creates unique signature: `WHY:claim:claim_xyz:eo-1`
   - **Dialogue Acts**: Synthesizes: `{ polarity: 'neg', locusPath: '0', openings: [], expression: '...' }`
   - **Database Write**:
     ```typescript
     await prisma.dialogueMove.create({
       data: {
         deliberationId: 'delib_abc',
         targetType: 'claim',
         targetId: 'claim_xyz',
         kind: 'WHY',
         payload: { cqId: 'eo-1', acts: [...], deadlineAt: '2024-01-15T12:00:00Z' },
         actorId: 'user_123',
         signature: 'WHY:claim:claim_xyz:eo-1'
       }
     });
     ```
   - **CQStatus Update**:
     ```typescript
     await prisma.cQStatus.upsert({
       where: { targetType_targetId_schemeKey_cqKey: { ... } },
       create: { status: 'open', satisfied: false, ... },
       update: { status: 'open', satisfied: false }
     });
     ```
   - **TTL**: Sets 24-hour deadline for response
   - **Compile**: Runs `compileFromMoves(deliberationId)` to update Ludics engine
   - **Step**: Runs `stepInteraction()` to compute next valid states

4. **Event Emission**:
   ```typescript
   emitBus("dialogue:changed", { deliberationId, moveId, kind: 'WHY' });
   emitBus("dialogue:moves:refresh", { deliberationId });
   ```

5. **UI Refresh**:
   - Components listening to `mesh:dialogue:refresh` re-fetch data
   - CQStatus shows question as "open"
   - Legal moves update to show GROUNDS as available response

**Database Records Created**:
- `DialogueMove` - WHY move record
- `CQStatus` - Marks critical question as open

**Systems Affected**:
- Legal moves computation
- Critical questions UI
- Commitment store (no change)
- Ludics engine state

---

### GROUNDS (Answer/Justify)

**Purpose**: Answer a WHY question by providing justification.

**User Experience**:
- User clicks "Answer E1" button (GROUNDS for a specific WHY)
- Modal appears for entering justification text
- System creates both a dialogue move and an AIF Argument node

**End-to-End Flow**:

1. **UI Trigger**:
   ```typescript
   {
     id: 'grounds-0',
     kind: 'GROUNDS',
     label: 'Answer E1',
     force: 'ATTACK', // Keeps dialogue branch alive
     move: {
       kind: 'GROUNDS',
       payload: { cqId: 'eo-1', locusPath: '0.1' }
     }
   }
   ```

2. **API Call**:
   ```typescript
   POST /api/dialogue/move
   {
     kind: 'GROUNDS',
     payload: {
       cqId: 'eo-1',
       locusPath: '0.1',
       expression: 'Because studies show X, Y, and Z.',
       schemeKey: 'expert-opinion'
     }
   }
   ```

3. **Server Processing**:
   - **Create AIF Argument** (`createArgumentFromGrounds()`):
     ```typescript
     const arg = await prisma.argument.create({
       data: {
         deliberationId,
         authorId,
         text: 'Because studies show X, Y, and Z.',
         conclusionClaimId: targetId,
         schemeId: '...', // Looked up from schemeKey
         mediaType: 'text'
       }
     });
     // Store argId in move payload
     payload.createdArgumentId = arg.id;
     ```
   - **Update CQStatus**:
     ```typescript
     await prisma.cQStatus.updateMany({
       where: { targetType, targetId, schemeKey, cqKey },
       data: { status: 'answered', satisfied: true }
     });
     ```
   - **Signature**: `GROUNDS:claim:claim_xyz:eo-1:0.1::hash`
   - **Dialogue Acts**: `{ polarity: 'pos', locusPath: '0.1', expression: '...', additive: false }`

4. **Database Records Created**:
   - `DialogueMove` - GROUNDS move
   - `Argument` - First-class AIF argument node (can be attacked/defended)
   - `CQStatus` - Marks question as answered

**Key Feature**: GROUNDS creates an **Argument** record, making the justification attackable in future moves.

---

### CLOSE (End Branch)

**Purpose**: Surrender and close a dialogue branch (marked with dagger †).

**User Experience**:
- User clicks "Close (†)" button
- Dialogue branch terminates
- No further attacks allowed on this branch

**End-to-End Flow**:

1. **API Call**:
   ```typescript
   POST /api/dialogue/move
   {
     kind: 'CLOSE',
     payload: { locusPath: '0.1' }
   }
   ```

2. **Server Processing**:
   - **Signature**: `CLOSE:claim:claim_xyz:0.1`
   - **Dialogue Acts**: `{ polarity: 'daimon', locusPath: '0.1', expression: '†' }`
   - **Force**: SURRENDER (terminates branch)

3. **Protocol Enforcement**:
   - Future WHY/GROUNDS attacks on this branch are blocked (R5 rule)
   - Legal moves computation filters out attacks

**Systems Affected**:
- Legal moves (blocks further attacks)
- Ludics engine (marks branch as terminated)
- UI (grays out closed branches)

---

### CONCEDE (Accept Claim)

**Purpose**: Accept opponent's claim as true.

**End-to-End Flow**:

1. **API Call**:
   ```typescript
   POST /api/dialogue/move
   {
     kind: 'CONCEDE',
     payload: {
       expression: 'Climate change is real.',
       locusPath: '0'
     }
   }
   ```

2. **Server Processing**:
   - **Kind Mapping**: `CONCEDE` → `ASSERT` with `payload.as = 'CONCEDE'` marker
   - **Commitment Store**:
     ```typescript
     await prisma.commitment.upsert({
       where: { deliberationId_participantId_proposition: { ... } },
       create: {
         deliberationId,
         participantId: actorId,
         proposition: 'Climate change is real.',
         isRetracted: false
       }
     });
     ```
   - **Dialogue Acts**: `{ polarity: 'pos', locusPath: '0', expression: 'conceded' }`

3. **Database Records**:
   - `DialogueMove` (kind='ASSERT', payload.as='CONCEDE')
   - `Commitment` (adds proposition to user's commitment store)

**Key Feature**: Adds claim to user's **commitment store**, enforcing consistency across the debate.

---

### RETRACT (Withdraw Claim)

**Purpose**: Withdraw a previously made claim.

**End-to-End Flow**:

1. **Server Processing**:
   - **Commitment Store**:
     ```typescript
     await prisma.commitment.updateMany({
       where: { deliberationId, participantId, proposition, isRetracted: false },
       data: { isRetracted: true }
     });
     ```
   - **Force**: SURRENDER

2. **Database Changes**:
   - `DialogueMove` (kind='RETRACT')
   - `Commitment` (marks existing commitment as retracted)

---

### ACCEPT_ARGUMENT (Accept Entire Argument)

**Purpose**: Accept an argument as valid (R7 rule - when argument answers all critical questions).

**End-to-End Flow**:

1. **Trigger**: System detects all CQs are answered
2. **Legal Move**: Shows "Accept Argument" instead of CONCEDE
3. **Server Processing**:
   ```typescript
   // ASSERT with special marker
   kind = 'ASSERT';
   payload.as = 'ACCEPT_ARGUMENT';
   
   await prisma.commitment.upsert({
     where: { ... },
     create: {
       proposition: 'ACCEPT:argument_abc',
       ...
     }
   });
   ```

**Systems Affected**:
- Commitment store (records acceptance)
- AF computation (argument becomes justified)

---

### THEREFORE (Introduce Consequence)

**Purpose**: State a logical consequence from premises.

**User Experience**:
- Used in formal logic dialogues
- Introduces new claim that follows from accepted premises

**End-to-End Flow**:

1. **API Call**:
   ```typescript
   POST /api/dialogue/move
   {
     kind: 'THEREFORE',
     payload: {
       expression: 'Therefore, we must act now.',
       locusPath: '0.2'
     }
   }
   ```

2. **Server Processing**:
   - **Signature**: `THEREFORE:claim:claim_xyz:0.2:hash`
   - **Dialogue Acts**: `{ polarity: 'pos', locusPath: '0.2', expression: '...', additive: false }`
   - **Force**: ATTACK (can be challenged)

3. **Use Case**: 
   - Chaining logical inferences
   - Formal proof construction

---

### SUPPOSE (Introduce Supposition)

**Purpose**: Introduce a hypothetical assumption for conditional reasoning.

**End-to-End Flow**:

1. **API Call**:
   ```typescript
   POST /api/dialogue/move
   {
     kind: 'SUPPOSE',
     payload: {
       expression: 'Suppose inflation continues at 5%.',
       locusPath: '1'
     }
   }
   ```

2. **Server Processing**:
   - **Signature**: `SUPPOSE:claim:claim_xyz:1:hash`
   - **Dialogue Acts**: `{ polarity: 'pos', locusPath: '1', expression: '+supposition', additive: false }`
   - **Force**: NEUTRAL

3. **Use Case**:
   - Conditional arguments ("If X, then Y")
   - Counterfactual reasoning
   - Paired with DISCHARGE to close assumption scope

---

### DISCHARGE (Close Supposition)

**Purpose**: End the scope of a supposition introduced by SUPPOSE.

**End-to-End Flow**:

1. **API Call**:
   ```typescript
   POST /api/dialogue/move
   {
     kind: 'DISCHARGE',
     payload: { locusPath: '1' }
   }
   ```

2. **Server Processing**:
   - **Signature**: `DISCHARGE:claim:claim_xyz:1`
   - **Dialogue Acts**: `{ polarity: 'pos', locusPath: '1', expression: 'discharge', additive: false }`
   - **Force**: NEUTRAL

3. **Ludics Engine**:
   - Marks supposition scope as closed
   - Validates that conclusions within scope are sound

---

### Scaffold Actions (Client-Side)

Scaffold actions **do not create database records**. Instead, they insert templates into the composer to help users structure their responses.

---

### FORALL_INSTANTIATE (∀-inst)

**Purpose**: Help user instantiate a universal quantifier claim.

**Trigger**: WHY move label contains "forall" or "all" (detected in `movesToActions.ts`)

**Workflow**:

1. **Detection** (`movesToActions.ts`):
   ```typescript
   if (anyWhy.label.includes('∀')) {
     actions.push({
       id: 'forall-inst',
       kind: 'FORALL_INSTANTIATE',
       label: '∀‑inst',
       force: 'NEUTRAL',
       group: 'bottom',
       scaffold: {
         template: 'Consider the specific case of [INSTANCE]...',
         analyticsName: 'scaffold:forall'
       }
     });
   }
   ```

2. **User Click** (`CommandCard.tsx`):
   ```typescript
   // Client-side only
   window.dispatchEvent(
     new CustomEvent('mesh:composer:insert', {
       detail: { template: 'Consider the specific case of [INSTANCE]...' }
     })
   );
   ```

3. **Composer Integration**:
   - Listening component inserts template at cursor position
   - User edits `[INSTANCE]` placeholder and submits as GROUNDS

**Database**: None (client-side helper only)

---

### EXISTS_WITNESS (∃-witness)

**Purpose**: Help user provide a witness for an existential claim.

**Trigger**: WHY label contains "exists" or "some"

**Workflow**:

```typescript
scaffold: {
  template: 'A counterexample is [WITNESS]...',
  analyticsName: 'scaffold:exists'
}
```

**Use Case**: Disproving universal claims by providing counterexample.

---

### PRESUP_CHALLENGE (Presup?)

**Purpose**: Help user challenge an implicit presupposition.

**Trigger**: WHY label contains "presupposition"

**Workflow**:

```typescript
scaffold: {
  template: 'The presupposition that [P] is questionable because...',
  analyticsName: 'scaffold:presupposition'
}
```

**Use Case**: Identifying and challenging unstated assumptions.

---

## Database Schema

### DialogueMove Table

```prisma
model DialogueMove {
  id              String    @id @default(cuid())
  deliberationId  String
  targetType      TargetType // 'claim' | 'argument' | 'card'
  targetId        String
  kind            String    // 'WHY', 'GROUNDS', 'ASSERT', 'CLOSE', etc.
  payload         Json?     // { cqId, locusPath, expression, acts, ... }
  actorId         String
  signature       String    // Unique per move type
  replyToMoveId   String?
  replyTarget     String?   // 'claim' | 'argument' | 'premise' | etc.
  createdAt       DateTime  @default(now())
  
  @@unique([deliberationId, signature], name: "dm_unique_signature")
}
```

**Key Fields**:
- `kind`: Move type (WHY, GROUNDS, CLOSE, THEREFORE, SUPPOSE, DISCHARGE)
- `payload.acts`: Ludics dialogue acts with polarity and locus
- `payload.cqId`: Critical question identifier
- `payload.createdArgumentId`: Link to Argument created by GROUNDS
- `signature`: Prevents duplicate submissions

---

### Argument Table

```prisma
model Argument {
  id                  String    @id @default(cuid())
  deliberationId      String
  authorId            String
  text                String    // Full argument text
  conclusionClaimId   String?   // Claim this argues for
  schemeId            String?   // ArgumentationScheme reference
  mediaType           String    @default("text")
  createdAt           DateTime  @default(now())
}
```

**Created By**: GROUNDS moves (when `groundsText.length > 5`)

---

### Commitment Table

```prisma
model Commitment {
  id              String   @id @default(cuid())
  deliberationId  String
  participantId   String   // User who committed
  proposition     String   // Text of claim
  isRetracted     Boolean  @default(false)
  createdAt       DateTime @default(now())
  
  @@unique([deliberationId, participantId, proposition])
}
```

**Modified By**:
- CONCEDE (creates commitment)
- RETRACT (sets isRetracted=true)
- ACCEPT_ARGUMENT (creates with "ACCEPT:" prefix)

---

### CQStatus Table

```prisma
model CQStatus {
  id          String      @id @default(cuid())
  targetType  TargetType  // 'claim' | 'argument'
  targetId    String
  argumentId  String?
  schemeKey   String      // e.g., 'expert-opinion'
  cqKey       String      // e.g., 'eo-1'
  status      String      // 'open' | 'answered'
  satisfied   Boolean     @default(false)
  createdById String
  
  @@unique([targetType, targetId, schemeKey, cqKey])
}
```

**Modified By**:
- WHY (creates with status='open')
- GROUNDS (updates to status='answered', satisfied=true)

---

## Event System

### Server-Side Events (meshBus)

Emitted by `/api/dialogue/move/route.ts`:

```typescript
emitBus("dialogue:changed", {
  deliberationId: string,
  moveId: string,
  kind: MoveKind
});

emitBus("dialogue:moves:refresh", {
  deliberationId: string
});

emitBus("dialogue:cs:refresh", {
  deliberationId: string,
  participantId: string
});

emitBus("issues:changed", {
  deliberationId: string
});
```

**Subscribers**: Server-Side Rendering (SSR) cache invalidation

---

### Client-Side Events (window.dispatchEvent)

Dispatched by `CommandCard.tsx`:

```typescript
// After successful move
window.dispatchEvent(
  new CustomEvent('mesh:dialogue:refresh')
);

// After scaffold insertion
window.dispatchEvent(
  new CustomEvent('mesh:composer:insert', {
    detail: { template: string }
  })
);

window.dispatchEvent(
  new CustomEvent('mesh:command:success', {
    detail: { actionId: string, kind: CommandKind }
  })
);
```

**Subscribers**: React components with `useEffect` listeners

---

## Integration Points

### 1. Legal Moves Computation

**File**: `app/api/dialogue/legal-moves/route.ts`

**Function**: Determines which actions are available based on:
- Current dialogue state
- Protocol rules (R1-R7)
- Target type (claim, argument, card)
- User's role and commitments

**Output**: Array of moves with:
```typescript
{
  kind: MoveKind,
  label: string,
  disabled: boolean,
  reason?: string, // Why disabled
  force: 'ATTACK' | 'SURRENDER' | 'NEUTRAL',
  relevance: 'likely' | 'unlikely' | null,
  payload: { cqId, locusPath, ... }
}
```

---

### 2. CommandCard Adapters

**Primary**: `lib/dialogue/movesToActions.ts`

Converts legal moves to CommandCard actions:
```typescript
movesToActions(moves: Move[], targetRef: TargetRef): CommandCardAction[]
```

**Grid Layout**:
- **Top row**: WHY, GROUNDS, CLOSE
- **Mid row**: CONCEDE, RETRACT, ACCEPT_ARGUMENT
- **Bottom row**: Scaffolds (∀-inst, ∃-witness, Presup?)

**Alternative**: `components/dialogue/command-card/adapters.ts`

Used in minimap contexts with alternative mapping logic.

---

### 3. UI Components

**DeepDivePanelV2** (`components/deepdive/DeepDivePanelV2.tsx`):
- Displays CommandCard for selected claim/argument
- Fetches legal moves via SWR
- Handles action execution and refresh

**LegalMoveToolbar** (`components/dialogue/LegalMoveToolbar.tsx`):
- Alternative list view of legal moves
- Toggle between grid (CommandCard) and list view
- Shares same action logic

**CQContextPanel** (`components/dialogue/CQContextPanel.tsx`):
- Shows critical questions context
- Integrates with CommandCard for CQ-specific moves

---

### 4. Ludics Engine

**Compilation**: `packages/ludics-engine/compileFromMoves.ts`

After each move:
```typescript
await compileFromMoves(deliberationId);
```

- Transforms DialogueMoves into LudicDesign (game tree)
- Validates moves against Ludics protocol
- Computes valid next states

**Stepping**: `packages/ludics-engine/stepper.ts`

```typescript
await stepInteraction({
  dialogueId: string,
  posDesignId: string,
  negDesignId: string,
  phase: 'focus-P' | 'focus-O' | 'neutral',
  maxPairs: number
});
```

- Advances game state
- Computes interaction between Proponent and Opponent designs
- Returns status (IN, OUT, CYCLE)

---

### 5. Commitment Store

**Package**: `packages/ludics-engine/commitments.ts`

**Function**: `applyToCS(deliberationId: string)`

- Reads all DialogueMoves
- Extracts commitments from CONCEDE, RETRACT, ACCEPT moves
- Updates Commitment table
- Validates consistency

---

## Protocol Rules Enforced

### R1: Explicit Reply Structure
Every move (except initial) must reply to a specific prior move via `replyToMoveId`.

### R2: Turn-Taking
Participants alternate (enforced in legal moves computation).

### R3: No Self-Attack
User cannot attack their own claims.

### R4: Relevance
Moves must be relevant to the target (soft/hard constraints).

### R5: No Attack After Surrender
Cannot WHY/GROUNDS after CLOSE/CONCEDE on same branch.

### R6: Commitment Consistency
Cannot contradict prior commitments.

### R7: Accept Complete Arguments
When all CQs answered, must accept argument or provide rebuttal.

---

## Summary: Action Type Reference

| Action | Type | Force | Creates | Updates | Event |
|--------|------|-------|---------|---------|-------|
| **WHY** | Protocol | ATTACK | DialogueMove, CQStatus | - | dialogue:moves:refresh |
| **GROUNDS** | Protocol | ATTACK | DialogueMove, Argument, CQStatus | CQStatus → answered | dialogue:moves:refresh |
| **CLOSE** | Protocol | SURRENDER | DialogueMove | - | dialogue:moves:refresh |
| **CONCEDE** | Protocol | SURRENDER | DialogueMove, Commitment | - | dialogue:cs:refresh |
| **RETRACT** | Protocol | SURRENDER | DialogueMove | Commitment → retracted | dialogue:cs:refresh |
| **ACCEPT_ARGUMENT** | Protocol | SURRENDER | DialogueMove, Commitment | - | dialogue:cs:refresh |
| **THEREFORE** | Protocol | ATTACK | DialogueMove | - | dialogue:moves:refresh |
| **SUPPOSE** | Protocol | NEUTRAL | DialogueMove | - | dialogue:moves:refresh |
| **DISCHARGE** | Protocol | NEUTRAL | DialogueMove | - | dialogue:moves:refresh |
| **∀-inst** | Scaffold | NEUTRAL | - | - | mesh:composer:insert |
| **∃-witness** | Scaffold | NEUTRAL | - | - | mesh:composer:insert |
| **Presup?** | Scaffold | NEUTRAL | - | - | mesh:composer:insert |

---

## Testing Actions

### Manual Test Flow

1. **Create a claim** in a deliberation
2. **Open CommandCard** by selecting the claim
3. **Click WHY** → Creates open critical question
4. **Click Answer (GROUNDS)** → Creates Argument, marks CQ answered
5. **Click CLOSE** → Terminates branch
6. **Verify**: Legal moves no longer show WHY for closed branch

### Automated Test

See `scripts/test_phase3.sh` for validation of:
- `createArgumentFromGrounds` function exists
- GROUNDS handler creates Argument records
- 5-character threshold for argument creation
- `createdArgumentId` stored in payload

---

## References

**Documentation**:
- `ANSWER_AND_COMMIT_INTEGRATION_SUMMARY.md` - Answer-and-commit feature (uses GROUNDS)
- `GROUNDS_EXPLANATION.md` - Detailed GROUNDS workflow
- `CRITICAL_QUESTIONS_UPGRADE_SUMMARY.md` - CQ system integration
- `AIF_DIALOGICAL_ACTIONS_FIX_SPEC.md` - AIF dialogue fixes

**Academic Sources**:
- Prakken (1997): "Argument-Based Extended Logic Programming"
- Prakken: "On Dialogue Systems with Speech Acts, Arguments, and Counterarguments"
- McBurney & Parsons: "A Denotational Semantics for Deliberation Dialogues"

**Code Files**:
- All files listed in [System Architecture](#system-architecture) section

---

**Last Updated**: January 2025
**Status**: ✅ Production-ready, fully integrated with AIF system
