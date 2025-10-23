# SUPPOSE/DISCHARGE Scope Tracking System

## Overview

Implements validation and UI constraints for SUPPOSE/DISCHARGE moves to ensure proper scope management in dialogical reasoning. This prevents users from discharging hypotheses that were never opened.

## Theoretical Foundation

From **Dialogical Logic** (Lorenzen-Lorenz tradition) and **Natural Deduction**:

- **SUPPOSE**: Opens a hypothetical scope for conditional reasoning
  - Example: "Suppose inflation continues at 5%..."
  - All claims within this scope are **conditional** on the supposition
  - Used for "If X, then Y" arguments and counterfactual reasoning

- **DISCHARGE**: Closes the hypothetical scope
  - Example: "Discharge assumption about inflation"
  - Validates conclusions derived within the scope
  - Marks end of conditional reasoning

**Critical Property**: SUPPOSE and DISCHARGE must be **paired**
- Each DISCHARGE must correspond to an open SUPPOSE
- Multiple SUPPOSE can be nested (not yet implemented — Phase 3)
- Discharging a non-existent supposition is a logical error

## Implementation

### Validation Rule (R8_NO_OPEN_SUPPOSE)

**Location**: `lib/dialogue/validate.ts`

**Logic**:
```typescript
if (kind === 'DISCHARGE') {
  // 1. Find most recent SUPPOSE at this locus
  const openSuppose = await prisma.dialogueMove.findFirst({
    where: {
      deliberationId,
      targetType,
      targetId,
      kind: 'SUPPOSE',
      payload: { path: ['locusPath'], equals: locusPath }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!openSuppose) {
    // No SUPPOSE exists at this locus
    reasons.push('R8_NO_OPEN_SUPPOSE');
  } else {
    // 2. Check if already discharged
    const matchingDischarge = await prisma.dialogueMove.findFirst({
      where: {
        deliberationId,
        targetType,
        targetId,
        kind: 'DISCHARGE',
        payload: { path: ['locusPath'], equals: locusPath },
        createdAt: { gt: openSuppose.createdAt }
      }
    });

    if (matchingDischarge) {
      // SUPPOSE was already discharged
      reasons.push('R8_NO_OPEN_SUPPOSE');
    }
  }
}
```

**Enforced at**: `POST /api/dialogue/move` — returns 409 if validation fails

### UI Prevention

**Location**: `app/api/dialogue/legal-moves/route.ts`

Computes `disabled` state for DISCHARGE button **before** user attempts the move:

```typescript
// Check for open SUPPOSE at locus
const openSuppose = await prisma.dialogueMove.findFirst({
  where: {
    deliberationId,
    targetType,
    targetId,
    kind: 'SUPPOSE',
    payload: { path: ['locusPath'], equals: locusPath || '0' }
  },
  orderBy: { createdAt: 'desc' }
});

let hasOpenSuppose = false;
if (openSuppose) {
  const matchingDischarge = await prisma.dialogueMove.findFirst({
    where: {
      deliberationId,
      targetType,
      targetId,
      kind: 'DISCHARGE',
      payload: { path: ['locusPath'], equals: locusPath || '0' },
      createdAt: { gt: openSuppose.createdAt }
    }
  });
  hasOpenSuppose = !matchingDischarge;
}

moves.push({ 
  kind: 'DISCHARGE', 
  label: 'Discharge',  
  disabled: !hasOpenSuppose,
  reason: hasOpenSuppose ? undefined : 'No open SUPPOSE at this locus',
  verdict: hasOpenSuppose 
    ? { code: 'H1_OPEN_SUPPOSE', ... }
    : { code: 'R8_NO_OPEN_SUPPOSE', ... }
});
```

### CommandCard Display

**Location**: `components/dialogue/command-card/CommandCard.tsx`

DISCHARGE button in grid:
- **Enabled** (white/blue): Open SUPPOSE exists → clickable
- **Disabled** (gray): No open SUPPOSE → shows tooltip "No open SUPPOSE at this locus"

## Example Flow

### Valid Sequence

```
User at locus "0":
  1. Click "Suppose…" → modal collects text "Assume GDP grows 3%"
  2. POST /api/dialogue/move { kind: 'SUPPOSE', payload: { locusPath: '0', expression: '...' } }
  3. ✅ Move created, SUPPOSE recorded

  [... user makes moves within supposition scope ...]

  4. Click "Discharge" → Button is ENABLED (green checkmark in UI)
  5. POST /api/dialogue/move { kind: 'DISCHARGE', payload: { locusPath: '0' } }
  6. ✅ Validation passes, DISCHARGE recorded

  7. Try clicking "Discharge" again
  8. Button is now DISABLED (grayed out)
  9. Tooltip shows: "No open SUPPOSE at this locus"
```

### Invalid Sequence (Prevented)

```
User at locus "0" (no SUPPOSE yet):
  1. Look at CommandCard grid
  2. "Discharge" button is DISABLED (grayed out)
  3. Hover → Tooltip: "No open SUPPOSE at this locus"
  4. Cannot click (button doesn't respond)
  
  // If user somehow bypasses UI (e.g., API call):
  5. POST /api/dialogue/move { kind: 'DISCHARGE', payload: { locusPath: '0' } }
  6. ❌ 409 Conflict { reasonCodes: ['R8_NO_OPEN_SUPPOSE'] }
```

## Database Schema

No new tables required. Uses existing `DialogueMove`:

```prisma
model DialogueMove {
  id            String   @id @default(cuid())
  deliberationId String
  targetType    String   // 'claim' | 'argument' | 'card'
  targetId      String
  kind          String   // 'SUPPOSE' | 'DISCHARGE' | ...
  payload       Json     // { locusPath: '0', expression: '...' }
  actorId       String
  createdAt     DateTime @default(now())
  signature     String   @unique
  // ...
}
```

**Locus Path**: Stored in `payload.locusPath` (e.g., "0", "0.1", "0.2")

## Current Limitations

### Phase 2 (Implemented)

✅ **Single-level pairing**: SUPPOSE/DISCHARGE at same locus  
✅ **Duplicate prevention**: Can't discharge same SUPPOSE twice  
✅ **UI feedback**: Button disabled when no open SUPPOSE  
✅ **Validation**: R8 rule blocks invalid DISCHARGE  

### Phase 3 (Not Yet Implemented)

❌ **Nested suppositions**: SUPPOSE within SUPPOSE (would use locus nesting like "0.supp1", "0.supp1.supp2")  
❌ **Scope enforcement**: Moves within supposition scope aren't marked as conditional  
❌ **Cross-locus validation**: Can't discharge SUPPOSE from parent locus  
❌ **Visualization**: No UI indicator showing "you are inside a supposition"  

## Future Enhancements

### Phase 3: Full Scope Tracking

1. **Nested Loci**:
   ```typescript
   // SUPPOSE creates child locus
   POST /api/dialogue/move {
     kind: 'SUPPOSE',
     payload: { locusPath: '0', expression: 'Assume X' }
   }
   // → Creates new locus '0.supp1'
   
   // All subsequent moves at '0.supp1' are within scope
   POST /api/dialogue/move {
     kind: 'THEREFORE',
     payload: { locusPath: '0.supp1', expression: 'Therefore Y' }
   }
   
   // DISCHARGE closes scope
   POST /api/dialogue/move {
     kind: 'DISCHARGE',
     payload: { locusPath: '0.supp1' }
   }
   // → Returns to locus '0'
   ```

2. **Scope Visualization**:
   ```tsx
   <div className="pl-4 border-l-2 border-indigo-300">
     <div className="text-xs text-indigo-600 mb-1">
       📍 Inside supposition: "Assume X"
     </div>
     {/* Nested moves */}
     <div className="text-xs text-indigo-600 mt-2">
       <button>Discharge assumption</button>
     </div>
   </div>
   ```

3. **Conditional Labeling**:
   - Conclusions derived in supposition scope marked as "conditional"
   - AF labels computed separately for in-scope vs out-of-scope
   - UI shows: "Claim Y is IN (if X holds)"

### Phase 4: Advanced Features

- **Scope stack**: Track active suppositions in UI state
- **Multi-level nesting**: SUPPOSE → SUPPOSE → DISCHARGE → DISCHARGE
- **Orphan detection**: Warn if SUPPOSE never discharged (W6_IDLE_SUPPOSITION)
- **Scope-aware inference**: THEREFORE validation checks available premises in current scope

## Error Codes

### R8_NO_OPEN_SUPPOSE
**Meaning**: Attempt to DISCHARGE without an open SUPPOSE at the target locus

**When triggered**:
- No SUPPOSE move exists at `locusPath`
- SUPPOSE was already discharged
- User tries to discharge parent locus SUPPOSE from child locus

**User message**: "Cannot discharge: no open SUPPOSE at this locus"

**Recovery**: 
1. Click "Suppose…" to create a supposition
2. Then use "Discharge" button

## Testing

### Manual Test

1. **Valid Flow**:
   ```
   Open DeepDivePanel → Select claim → CommandCard
   1. Check "Discharge" is DISABLED (gray)
   2. Click "Suppose…" → Enter "Assume X" → Submit
   3. Check "Discharge" is now ENABLED (white/blue)
   4. Click "Discharge"
   5. Check "Discharge" becomes DISABLED again
   ```

2. **Double Discharge Prevention**:
   ```
   1. Create SUPPOSE
   2. Click "Discharge" (works)
   3. Try clicking "Discharge" again (button disabled, can't click)
   ```

3. **Cross-Locus Independence**:
   ```
   1. Create SUPPOSE at locus "0"
   2. Create SUPPOSE at locus "0.1" (different locus)
   3. Discharge at "0.1" → doesn't affect "0"
   4. Discharge at "0" → doesn't affect "0.1"
   ```

### API Test

```bash
# Get legal moves (no SUPPOSE yet)
GET /api/dialogue/legal-moves?deliberationId=X&targetType=claim&targetId=Y&locusPath=0
# → { moves: [..., { kind: 'DISCHARGE', disabled: true, reason: '...' }] }

# Create SUPPOSE
POST /api/dialogue/move
{ "deliberationId": "X", "targetType": "claim", "targetId": "Y", 
  "kind": "SUPPOSE", "payload": { "locusPath": "0", "expression": "Assume X" } }
# → { ok: true, move: {...} }

# Get legal moves (SUPPOSE exists)
GET /api/dialogue/legal-moves?deliberationId=X&targetType=claim&targetId=Y&locusPath=0
# → { moves: [..., { kind: 'DISCHARGE', disabled: false }] }

# Create DISCHARGE
POST /api/dialogue/move
{ "deliberationId": "X", "targetType": "claim", "targetId": "Y",
  "kind": "DISCHARGE", "payload": { "locusPath": "0" } }
# → { ok: true, move: {...} }

# Try DISCHARGE again (validation blocks)
POST /api/dialogue/move
{ "deliberationId": "X", "targetType": "claim", "targetId": "Y",
  "kind": "DISCHARGE", "payload": { "locusPath": "0" } }
# → { ok: false, reasonCodes: ['R8_NO_OPEN_SUPPOSE'] } (409)
```

## Related Files

- **Validation**: `lib/dialogue/validate.ts` (R8 rule)
- **Legal Moves**: `app/api/dialogue/legal-moves/route.ts` (disabled state)
- **Move Handler**: `app/api/dialogue/move/route.ts` (validation enforcement)
- **Adapter**: `lib/dialogue/movesToActions.ts` (disabled prop passthrough)
- **UI**: `components/dialogue/command-card/CommandCard.tsx` (disabled display)
- **Codes**: `lib/dialogue/codes.ts` (R8_NO_OPEN_SUPPOSE definition)

## Design Rationale

**Why track per-locus instead of globally?**
- Different branches of dialogue can have independent suppositions
- Locus path represents dialogue tree position
- Enables parallel hypothetical reasoning in different branches

**Why disable button instead of showing error after click?**
- Better UX: prevent error before it happens
- User discovers constraint through exploration (button state = system state)
- Aligns with "affordances" principle (Norman, Design of Everyday Things)

**Why not auto-discharge when user leaves scope?**
- Explicit is better than implicit (Zen of Python)
- User should consciously close hypothetical reasoning
- Prevents accidental scope closure
- Enables warning for unclosed suppositions (Phase 4: W6_IDLE_SUPPOSITION)

**Why allow SUPPOSE without schema/CQ?**
- SUPPOSE is a **structural move** (not content-specific)
- Can be used in any context (generic hypothetical reasoning)
- Doesn't require argumentation scheme attachment
- Aligns with proof theory (natural deduction rules don't require schemes)
