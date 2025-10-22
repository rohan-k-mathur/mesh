# CommandCard Actions - Quick Reference

## Action Grid Layout (3×3)

```
┌─────────┬─────────┬─────────┐
│   WHY   │ GROUNDS │ CLOSE † │  ← Top Row (Questions & Answers)
├─────────┼─────────┼─────────┤
│ CONCEDE │ RETRACT │ ACCEPT  │  ← Mid Row (Surrender Moves)
├─────────┼─────────┼─────────┤
│ ∀-inst  │∃-witness│ Presup? │  ← Bottom Row (Scaffolds)
└─────────┴─────────┴─────────┘
```

---

## Protocol Moves (Server-Side)

### WHY - Challenge/Question ⚔️
- **Force**: ATTACK
- **Creates**: DialogueMove, CQStatus (open)
- **Use**: "Why do you claim this?"
- **Next**: Opponent must provide GROUNDS or CLOSE
- **TTL**: 24 hours to respond

### GROUNDS - Answer/Justify ⚔️
- **Force**: ATTACK (keeps branch alive)
- **Creates**: DialogueMove, Argument, CQStatus (answered)
- **Use**: "Because [evidence]..."
- **Next**: Can be attacked with new WHY
- **Special**: Creates AIF Argument node (5+ chars)

### CLOSE - End Branch 🏳️
- **Force**: SURRENDER
- **Creates**: DialogueMove (polarity='daimon')
- **Use**: "I accept defeat / no further response"
- **Next**: Branch terminates, no further attacks
- **Symbol**: Dagger (†)

### CONCEDE - Accept Claim 🏳️
- **Force**: SURRENDER
- **Creates**: DialogueMove, Commitment
- **Use**: "I agree with your claim"
- **Next**: Claim added to your commitment store
- **Consistency**: Can't later contradict

### RETRACT - Withdraw Claim 🏳️
- **Force**: SURRENDER
- **Creates**: DialogueMove
- **Updates**: Commitment (isRetracted=true)
- **Use**: "I take back my earlier claim"

### ACCEPT_ARGUMENT - Accept Full Argument 🏳️
- **Force**: SURRENDER
- **Creates**: DialogueMove, Commitment
- **Use**: When all CQs answered (R7 rule)
- **Trigger**: System shows this instead of CONCEDE

### THEREFORE - Introduce Consequence ⚔️
- **Force**: ATTACK
- **Creates**: DialogueMove
- **Use**: "Therefore, [conclusion]"
- **Context**: Formal logic, chaining inferences

### SUPPOSE - Hypothetical Assumption 
- **Force**: NEUTRAL
- **Creates**: DialogueMove
- **Use**: "Suppose [assumption]..."
- **Pair**: Use with DISCHARGE to close scope

### DISCHARGE - Close Supposition 
- **Force**: NEUTRAL
- **Creates**: DialogueMove
- **Use**: Ends SUPPOSE scope
- **Context**: Conditional reasoning

---

## Scaffold Actions (Client-Side)

### ∀-inst - Universal Instantiation
- **Trigger**: WHY label contains "forall" or "∀"
- **Template**: `"Consider the specific case of [INSTANCE]..."`
- **Use**: Instantiate universal quantifier
- **No DB**: Client-side template insertion

### ∃-witness - Existential Witness
- **Trigger**: WHY label contains "exists" or "∃"
- **Template**: `"A counterexample is [WITNESS]..."`
- **Use**: Provide counterexample
- **No DB**: Client-side template insertion

### Presup? - Challenge Presupposition
- **Trigger**: WHY label contains "presupposition"
- **Template**: `"The presupposition that [P] is questionable because..."`
- **Use**: Challenge implicit assumption
- **No DB**: Client-side template insertion

---

## Force Classification

| Symbol | Force | Meaning | Actions |
|--------|-------|---------|---------|
| ⚔️ | ATTACK | Keeps dispute alive | WHY, GROUNDS, THEREFORE |
| 🏳️ | SURRENDER | Ends dispute | CLOSE, CONCEDE, RETRACT, ACCEPT |
| ● | NEUTRAL | No dispute effect | SUPPOSE, DISCHARGE, Scaffolds |

---

## Quick Workflow

### Challenge Flow (WHY → GROUNDS)
```
1. Alice: "Climate change is real"
2. Bob clicks WHY → Creates challenge
3. Alice clicks GROUNDS → Provides evidence
4. Bob can:
   - Click WHY again (new challenge)
   - Click CLOSE (accept)
   - Click CONCEDE (agree fully)
```

### Surrender Flow (CLOSE/CONCEDE)
```
1. Alice: "The sky is blue"
2. Bob clicks WHY → "Why blue?"
3. Alice can:
   - CLOSE: No answer, accept defeat
   - GROUNDS: "Because of Rayleigh scattering"
   
OR Bob immediately:
   - CONCEDE: "Yes, the sky is blue" (no WHY)
```

### Scaffold Flow
```
1. Alice: "All swans are white"
2. Bob clicks WHY → Challenge universal claim
3. System shows ∀-inst button (because "all")
4. Bob clicks ∀-inst → Template inserted
5. Bob edits: "Consider Australian black swans..."
6. Bob submits as GROUNDS
```

---

## API Endpoint

**URL**: `POST /api/dialogue/move`

**Body**:
```json
{
  "deliberationId": "delib_abc123",
  "targetType": "claim",
  "targetId": "claim_xyz789",
  "kind": "WHY",
  "payload": {
    "cqId": "eo-1",
    "locusPath": "0",
    "expression": "Why do you claim this?"
  },
  "autoCompile": true,
  "autoStep": true
}
```

**Response**:
```json
{
  "ok": true,
  "move": { "id": "move_123", ... },
  "step": { "status": "IN", ... },
  "dedup": false
}
```

---

## Database Tables

### DialogueMove
- `kind`: WHY, GROUNDS, CLOSE, etc.
- `payload.cqId`: Critical question ID
- `payload.acts`: Ludics dialogue acts
- `signature`: Prevents duplicates

### Argument (created by GROUNDS)
- `text`: Full justification
- `conclusionClaimId`: Claim being justified
- `schemeId`: Argumentation scheme

### Commitment (updated by CONCEDE/RETRACT)
- `proposition`: Text of committed claim
- `isRetracted`: Boolean flag
- `participantId`: Who committed

### CQStatus (updated by WHY/GROUNDS)
- `status`: 'open' | 'answered'
- `satisfied`: Boolean
- `schemeKey`, `cqKey`: Identify question

---

## Events

### Server Events (meshBus)
- `dialogue:changed` - Move created
- `dialogue:moves:refresh` - Refetch moves
- `dialogue:cs:refresh` - Commitment store changed
- `issues:changed` - Issues affected

### Client Events (window)
- `mesh:dialogue:refresh` - UI refresh trigger
- `mesh:composer:insert` - Scaffold template
- `mesh:command:success` - Action completed

---

## Protocol Rules (R1-R7)

| Rule | Description | Enforced By |
|------|-------------|-------------|
| **R1** | Explicit reply structure | validateMove() |
| **R2** | Turn-taking | legal-moves |
| **R3** | No self-attack | legal-moves |
| **R4** | Relevance | legal-moves |
| **R5** | No attack after surrender | legal-moves |
| **R6** | Commitment consistency | validateMove() |
| **R7** | Accept complete arguments | legal-moves |

---

## Integration Files

### UI Components
- `components/dialogue/command-card/CommandCard.tsx`
- `components/deepdive/DeepDivePanelV2.tsx`
- `components/dialogue/LegalMoveToolbar.tsx`

### API Routes
- `app/api/dialogue/move/route.ts` - Execute moves
- `app/api/dialogue/legal-moves/route.ts` - Compute available moves

### Adapters
- `lib/dialogue/movesToActions.ts` - Convert moves to actions
- `components/dialogue/command-card/adapters.ts` - Alternative adapter

### Types
- `components/dialogue/command-card/types.ts` - CommandCardAction
- `lib/dialogue/types.ts` - MoveKind, MoveForce

### Engine
- `packages/ludics-engine/compileFromMoves.ts` - Compile moves
- `packages/ludics-engine/stepper.ts` - Step interaction
- `packages/ludics-engine/commitments.ts` - Commitment store

---

## Testing

### Manual Test Checklist
- [ ] WHY creates open CQStatus
- [ ] GROUNDS creates Argument + updates CQStatus
- [ ] CLOSE blocks future WHY
- [ ] CONCEDE adds Commitment
- [ ] RETRACT marks Commitment retracted
- [ ] ∀-inst inserts template in composer
- [ ] Event bus emits refresh events

### Automated Test
```bash
./scripts/test_phase3.sh
```

---

## Common Patterns

### Ask Question → Get Answer
```typescript
// 1. User clicks WHY
{ kind: 'WHY', payload: { cqId: 'eo-1' } }

// 2. System opens CQ
CQStatus: { status: 'open', satisfied: false }

// 3. Opponent clicks GROUNDS
{ kind: 'GROUNDS', payload: { cqId: 'eo-1', expression: '...' } }

// 4. System closes CQ + creates Argument
CQStatus: { status: 'answered', satisfied: true }
Argument: { text: '...', conclusionClaimId: '...' }
```

### Challenge Universal Claim
```typescript
// 1. Claim: "All X are Y"
// 2. User clicks WHY
// 3. System shows ∀-inst scaffold
// 4. User clicks ∀-inst
// 5. Template inserted: "Consider the case of [INSTANCE]..."
// 6. User edits and submits as GROUNDS
```

### Accept Defeat
```typescript
// 1. User is challenged with WHY
// 2. User has no good answer
// 3. User clicks CLOSE
// 4. Branch terminates with dagger (†)
// 5. Legal moves no longer show WHY/GROUNDS
```

---

## Debugging Tips

### Move Not Appearing?
Check `/api/dialogue/legal-moves`:
- Is move disabled?
- What's the `reason` field?
- Check protocol rules (R1-R7)

### Duplicate Submission?
- Check `signature` field in DialogueMove
- System deduplicates WHY/GROUNDS automatically
- Returns `{ dedup: true }` in response

### CQStatus Not Updating?
- Verify `payload.cqId` is present
- Check unique constraint: `targetType_targetId_schemeKey_cqKey`
- Look for error in console

### Argument Not Created?
- GROUNDS must have `expression.length > 5`
- Target must be type `'claim'` (not argument)
- Check `payload.createdArgumentId` in response

---

## See Also

- **Full Explanation**: `COMMANDCARD_ACTIONS_EXPLAINED.md`
- **GROUNDS Details**: `GROUNDS_EXPLANATION.md`
- **Answer-and-Commit**: `ANSWER_AND_COMMIT_INTEGRATION_SUMMARY.md`
- **Critical Questions**: `CRITICAL_QUESTIONS_UPGRADE_SUMMARY.md`
- **Ludics Foundations**: `Formal Foundations for the Mesh Digital Agora.txt`

---

**Last Updated**: January 2025
