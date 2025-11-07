# Dialogue Protocol Findings and Attack Response System

**Date**: November 7, 2025  
**Context**: DiscourseDashboard attack response integration

## Key Discovery: ACCEPT_ARGUMENT Complexity

### The Problem
When trying to use `ACCEPT_ARGUMENT` as a response to attacks in DiscourseDashboard, we encountered `MOVE_ILLEGAL` errors.

### Root Cause Analysis

**Legal Moves API Response** (for claim target):
```json
{
  "moves": [
    {"kind": "GROUNDS", "label": "Answer generic_why_..."},
    {"kind": "CLOSE", "label": "Close (†)"},
    {"kind": "THEREFORE", "label": "Therefore…"},
    {"kind": "SUPPOSE", "label": "Suppose…"},
    {"kind": "DISCHARGE", "label": "Discharge", "disabled": true},
    {"kind": "RETRACT", "label": "Retract"}
  ],
  "meta": {
    "anyGrounds": true,
    "targetAuthorId": "12"
  }
}
```

**Note**: `ACCEPT_ARGUMENT` is NOT in the legal moves list!

### How ACCEPT_ARGUMENT Actually Works

From `app/api/dialogue/legal-moves/route.ts` lines 210-227:

```typescript
// If claim has been answered by GROUNDS, hint to accept the *argument*
if (targetType === 'claim' && anyGrounds) {
  const args = await prisma.argument.findMany({
    where: { deliberationId, conclusionClaimId: targetId },
    orderBy: { createdAt: 'desc' },
    select: { id: true }
  });
  if (args.length) {
    moves.push({
      kind: 'ASSERT',
      label: 'Accept argument',
      postAs: { targetType: 'argument', targetId: args[0].id },
      payload: { locusPath: locusPath || '0', as: 'ACCEPT_ARGUMENT' },
      verdict: { code: 'R7_ACCEPT_ARGUMENT', context: { argumentId: args[0].id } }
    });
  }
}
```

**Key Insights**:
1. `ACCEPT_ARGUMENT` is actually an `ASSERT` move with `payload.as = 'ACCEPT_ARGUMENT'`
2. It requires `postAs` to redirect to an **argument** target (not the claim)
3. It only appears when:
   - Target is a claim
   - That claim has been answered by GROUNDS (`anyGrounds = true`)
   - There exists an argument with that claim as conclusion

### Why This is Complex for DiscourseDashboard

**Scenario**: User receives attack on their claim
```
Attack: ConflictApplication
  - conflictedClaimId: "claim-123"
  - conflictingArgumentId: "arg-456"
```

**To accept this attack, user needs to**:
1. Find all arguments that have `claim-123` as conclusion
2. Pick the most recent one (or correct one?)
3. Send ASSERT move with:
   - `kind: "ASSERT"`
   - `targetType: "argument"` (not "claim"!)
   - `targetId: "<argument-id>"` (not claim-id!)
   - `payload: { as: "ACCEPT_ARGUMENT", locusPath: "0" }`

**Problem**: The attack data in DiscourseDashboard only knows about the claim being attacked, not which argument to accept.

## Solution: Simplified Response Options

Instead of trying to handle the complex ACCEPT_ARGUMENT flow, we simplified to two options:

### Option 1: GROUNDS (Defend)
- **Action**: Provide justification/defense for your claim
- **API**: `/api/dialogue/answer-and-commit`
- **Payload**:
  ```json
  {
    "deliberationId": "...",
    "targetType": "claim",
    "targetId": "claim-123",
    "cqKey": "default",
    "locusPath": "0",
    "expression": "<user's defense text>",
    "original": "<user's defense text>",
    "commitOwner": "Proponent",
    "commitPolarity": "pos"
  }
  ```
- **Effect**: Creates Argument node, DialogueMove, updates commitment store

### Option 2: RETRACT (Withdraw)
- **Action**: Withdraw your claim
- **API**: `/api/dialogue/move`
- **Payload**:
  ```json
  {
    "deliberationId": "...",
    "targetType": "claim",
    "targetId": "claim-123",
    "kind": "RETRACT",
    "actorId": "12",
    "payload": { "locusPath": "0" }
  }
  ```
- **Effect**: Marks claim as retracted in dialogue state

## Dialogue Protocol Rules (R-Codes)

From `lib/dialogue/validate.ts` and `lib/dialogue/codes.ts`:

### R7: ACCEPT_ARGUMENT_REQUIRED
**Trigger**: Trying to CONCEDE after GROUNDS has been provided
**Message**: "Accept the argument (not just the conclusion)."
**Solution**: Use ACCEPT_ARGUMENT (via ASSERT) instead of CONCEDE

### R2: NO_OPEN_CQ
**Trigger**: GROUNDS move without matching WHY
**Message**: "No open critical question to answer"
**Solution**: Ensure WHY was asked first, or use generic CQ key

### R3: SELF_REPLY
**Trigger**: Replying to your own move
**Message**: "Cannot reply to your own dialogue move"
**Solution**: Different user must respond

### R4: DUPLICATE_REPLY
**Trigger**: Same reply to same target/key already exists
**Message**: "Duplicate move signature"
**Solution**: Check for existing moves before posting

### R5: AFTER_SURRENDER
**Trigger**: Attacking after CLOSE or CONCEDE
**Message**: "Cannot attack surrendered branch"
**Exception**: CQ-based WHY/GROUNDS moves are allowed (clarifying questions)

### R8: NO_OPEN_SUPPOSE
**Trigger**: DISCHARGE without matching SUPPOSE
**Message**: "No open SUPPOSE at this locus"
**Solution**: Ensure SUPPOSE was made before DISCHARGE

## DiscourseDashboard Implementation

**File**: `components/discourse/DiscourseDashboard.tsx`

**ActionOnMeCard Component**:
```tsx
// Response options
const [responseType, setResponseType] = 
  React.useState<"GROUNDS" | "RETRACT">("GROUNDS");

// Handle response submission
const handleRespond = async () => {
  if (responseType === "GROUNDS") {
    // Show textarea, validate text, call answer-and-commit
    await fetch("/api/dialogue/answer-and-commit", { ... });
  } else {
    // RETRACT - simple move
    await fetch("/api/dialogue/move", { 
      body: JSON.stringify({
        kind: "RETRACT",
        payload: { locusPath: "0" }
      })
    });
  }
};
```

**UI**:
```html
<select>
  <option value="GROUNDS">Provide GROUNDS (Defend)</option>
  <option value="RETRACT">RETRACT (Withdraw)</option>
</select>
```

## Future Enhancements

### 1. Add ACCEPT_ARGUMENT Support (Complex)
Would require:
- Fetching arguments that conclude with the attacked claim
- UI to select which argument to accept (if multiple)
- Handling the ASSERT + postAs redirect
- Error handling for when no supporting argument exists

**Recommendation**: Only implement if users explicitly request this feature

### 2. Add CLOSE Support
- Allow users to "close" a dialogue branch
- Requires checking if locus is closable (via ludics engine)
- Shows "Close (†)" option when daimon hints indicate closability

### 3. Response Templates
- Pre-fill GROUNDS textarea with templates:
  - "I disagree because..."
  - "The evidence shows..."
  - "This argument fails because..."

### 4. Preview Legal Moves
- Before showing response options, call `/api/dialogue/legal-moves`
- Only show options that are actually legal
- Display helpful error messages from `verdict.code`

## Testing Checklist

- [x] GROUNDS response creates Argument node
- [x] GROUNDS response creates DialogueMove
- [x] RETRACT response creates DialogueMove
- [ ] Verify GROUNDS arguments appear in ASPIC+ evaluation
- [ ] Test attack → GROUNDS → counter-attack flow
- [ ] Test attack → RETRACT flow
- [ ] Verify R7 error no longer occurs
- [ ] Test with multiple attacks on same claim

## Related Files

**API Endpoints**:
- `app/api/dialogue/move/route.ts` - Main dialogue move handler
- `app/api/dialogue/legal-moves/route.ts` - Legal move computation
- `app/api/dialogue/answer-and-commit/route.ts` - GROUNDS with text

**Validation**:
- `lib/dialogue/validate.ts` - Protocol rule checking
- `lib/dialogue/codes.ts` - Error code definitions

**UI Components**:
- `components/discourse/DiscourseDashboard.tsx` - Attack response UI
- `components/dialogue/DialogueActionsModal.tsx` - Full protocol UI

**Tests**:
- `tests/aif-dialogue.test.ts` - Protocol rule tests
