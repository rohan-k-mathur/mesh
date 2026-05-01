# Critical Questions: "Mark Satisfied/Unsatisfied" Feature Explained

## Executive Summary

The "Mark Satisfied" feature allows **claim authors** (currently any authenticated user per commented-out permission guard) to indicate that a Critical Question has been adequately answered. This action:

1. **Updates database state** (`CQStatus` table)
2. **Creates dialogue moves** (WHY when marking unsatisfied, GROUNDS when providing answer)
3. **Triggers UI refreshes** across multiple components
4. **Has HARD GUARD for marking satisfied** (requires proof via attack edges or NLI)
5. **Affects argument evaluation** (indirectly via ClaimEdge attack strength)

---

## Current Permission Model

### Who Can Mark Satisfied?

**CURRENT STATE (Permissive):**
```typescript
// app/api/cqs/toggle/route.ts lines 88-101
// Permission guard: For now, allow any authenticated user to mark CQs satisfied
// Rationale: CQs are collaborative inquiry tools, not adversarial attacks
// TODO: Consider adding role-based restrictions if needed
const claim = await prisma.claim.findUnique({
  where: { id: targetId }, select: { createdById: true }
});
// Commenting out author-only restriction for CQ satisfaction
// const isAuthor = String(claim?.createdById) === String(userId);
// const isModerator = false;
// if (!isAuthor && !isModerator) {
//   return NextResponse.json({ ok:false, error:'Only the claim author...' }, { status: 403 });
// }
```

**Answer:** Currently **any authenticated user** can mark CQs satisfied/unsatisfied.

**INTENDED STATE (Author-Only):**
The commented-out code shows the intended restriction:
- **Claim author** can mark satisfied/unsatisfied
- **Moderators** can mark satisfied/unsatisfied (not yet implemented)
- **Community members** cannot directly mark (they can only challenge via counter-claims)

**UI REFLECTS INTENDED STATE:**
The new UX improvements show "Mark Satisfied" button only to authors (`{isAuthor && ...}`), even though the API currently allows anyone.

---

## Dual API Endpoints

### 1. `/api/cqs` (POST) - Legacy/Simple Update
**Location:** `app/api/cqs/route.ts` lines 207-256

**Purpose:** Simple satisfaction toggle, no guards

**Flow:**
```typescript
POST /api/cqs
Body: {
  targetType: "claim",
  targetId: "claim-123",
  schemeKey: "argument_from_expert_opinion",
  cqKey: "cq_1",
  satisfied: true,
  groundsText: "Answer text..."
}

→ Upsert CQStatus record
→ No permission checks (system endpoint)
→ No proof obligations
→ Return success
```

**Used by:**
- `toggleCQ()` function in CriticalQuestionsV3 (lines 285-297)
- Internal/system updates

**Characteristics:**
- ✅ Simple upsert
- ❌ No permission guards
- ❌ No proof obligation checks
- ✅ Stores `groundsText` if provided
- ✅ Sets `statusEnum` to 'SATISFIED' or 'OPEN'

---

### 2. `/api/cqs/toggle` (POST) - Guarded Update
**Location:** `app/api/cqs/toggle/route.ts`

**Purpose:** User-facing satisfaction toggle with proof obligations

**Flow:**
```typescript
POST /api/cqs/toggle
Body: {
  targetType: "claim",
  targetId: "claim-123",
  schemeKey: "argument_from_expert_opinion",
  cqKey: "cq_1",
  satisfied: true,
  deliberationId: "delib-456",
  groundsText: "Answer...",
  attackerClaimId: "claim-789" // Optional
}

→ Check authentication (401 if not logged in)
→ Resolve deliberation/room context
→ Validate scheme exists
→ Optional: Create attack edge if attachSuggestion=true
→ ⚠️ PERMISSION CHECK (commented out)
→ Upsert CQStatus
→ ⚠️ HARD GUARD: Check proof obligation if marking satisfied=true
   ├─ If requiredAttack='rebut': Need inbound rebut edge OR NLI contradiction
   ├─ If requiredAttack='undercut': Need inbound undercut edge
   └─ Else: Need any inbound attack
→ If guard fails: Revert CQStatus, return 409 error
→ If guard passes: Return success with guard details
```

**Used by:**
- `attachWithAttacker()` function in CriticalQuestionsV3 (lines 398-425)
- When user clicks "Attach" button after selecting a counter-claim

**Characteristics:**
- ✅ Full permission guard (commented out, but in code)
- ✅ **HARD GUARD: Proof obligation enforcement**
- ✅ NLI (Natural Language Inference) integration
- ✅ Can create attack edges simultaneously
- ✅ Returns detailed guard information

---

## The HARD GUARD: Proof Obligation System

### What is the Hard Guard?

When marking a CQ as `satisfied: true`, the system enforces **proof obligations** based on the CQ type.

### Logic Flow

```typescript
// Only when satisfied === true
if (satisfied === true) {
  const suggest = suggestionForCQ(schemeKey, cqKey);
  requiredAttack = suggest?.type ?? null; // 'rebut' | 'undercut' | null

  // Check if required attack edge exists
  if (requiredAttack === 'rebut') {
    // Need: Inbound rebut edge OR strong NLI contradiction
    const edge = await prisma.claimEdge.findFirst({
      where: {
        toClaimId: targetId,
        OR: [{ type: 'rebuts' }, { attackType: 'REBUTS' }],
      }
    });
    hasEdge = !!edge;
    
    // Fallback: Check NLI if no edge but attacker specified
    if (!hasEdge && attackerClaimId) {
      const nli = await getNLI(attackerClaimId, targetId);
      if (nli.relation === 'contradicts' && nli.score >= 0.72) {
        allow = true; // NLI contradiction is sufficient proof
      }
    }
  } else if (requiredAttack === 'undercut') {
    // Need: Inbound undercut edge
    const edge = await prisma.claimEdge.findFirst({
      where: { toClaimId: targetId, attackType: 'UNDERCUTS' }
    });
    hasEdge = !!edge;
  }
  
  const allow = hasEdge || (NLI conditions met);
  
  if (!allow) {
    // REVERT CQStatus optimistic update
    await prisma.cQStatus.update({
      where: { ... },
      data: { satisfied: false }
    });
    
    // Return 409 Conflict
    return NextResponse.json({
      ok: false,
      blocked: true,
      code: 'CQ_PROOF_OBLIGATION_NOT_MET',
      message: 'This CQ can only be marked addressed after...',
      guard: { requiredAttack, hasEdge, nliRelation, nliScore, nliThreshold }
    }, { status: 409 });
  }
}
```

### Proof Requirements by CQ Type

| CQ Type | Required Attack | Proof Obligation |
|---------|----------------|------------------|
| **Rebut** | `type: 'rebut'` | Inbound `ClaimEdge` with `type='rebuts'` OR `attackType='REBUTS'` **OR** NLI contradiction with score ≥ 0.72 |
| **Undercut** | `type: 'undercut'` | Inbound `ClaimEdge` with `attackType='UNDERCUTS'` |
| **Other** | `null` | Any inbound attack edge (rebuts, undercuts, undermines) |

### NLI (Natural Language Inference) Fallback

If no explicit attack edge exists, the system can use AI to determine if two claims contradict:

```typescript
const nli = await getNLIAdapter().batch([{
  premise: attackerClaim.text,
  hypothesis: targetClaim.text
}]);

// Result: { relation: 'contradicts', score: 0.85 }
// If relation === 'contradicts' AND score >= 0.72 → Allow satisfaction
```

**Cached in:** `NLILink` table for performance

---

## Database State Changes

### CQStatus Table

**Schema:**
```prisma
model CQStatus {
  id              String    @id @default(cuid())
  targetType      TargetType
  targetId        String
  schemeKey       String
  cqKey           String
  satisfied       Boolean   @default(false)
  groundsText     String?   // Answer text from author
  statusEnum      String?   // 'OPEN' | 'SATISFIED' | 'CHALLENGED'
  createdById     String
  roomId          String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([targetType, targetId, schemeKey, cqKey])
}
```

**Update on Mark Satisfied:**
```typescript
await prisma.cQStatus.upsert({
  where: {
    targetType_targetId_schemeKey_cqKey: { ... }
  },
  update: {
    satisfied: true,
    groundsText: "Author's answer...",
    statusEnum: 'SATISFIED',
    updatedAt: new Date()
  },
  create: {
    targetType: 'claim',
    targetId: 'claim-123',
    schemeKey: 'argument_from_expert_opinion',
    cqKey: 'cq_1',
    satisfied: true,
    groundsText: "Author's answer...",
    createdById: userId,
    statusEnum: 'SATISFIED'
  }
});
```

---

## Dialogue Move Creation

### WHY Move (When Marking Unsatisfied)

**Triggered:** When `satisfied: false` (user challenges a previously satisfied CQ)

```typescript
if (!satisfied && deliberationId) {
  await fetch("/api/dialogue/move", {
    method: "POST",
    body: JSON.stringify({
      deliberationId,
      targetType: "claim",
      targetId: "claim-123",
      kind: "WHY",
      payload: {
        cqKey: "cq_1",
        cqText: "Critical question: Is this claim adequately supported?",
        locusPath: "0"
      }
    })
  });
}
```

**Effect:** Creates a `DialogueMove` record indicating a challenge was raised

---

### GROUNDS Move (When Providing Answer)

**Triggered:** When calling `resolveViaGrounds()` (submitting answer text)

```typescript
await fetch("/api/dialogue/move", {
  method: "POST",
  body: JSON.stringify({
    deliberationId,
    targetType: "claim",
    targetId: "claim-123",
    kind: "GROUNDS",
    payload: {
      cqKey: "cq_1",
      brief: "Author's answer text...",
      locusPath: "0"
    }
  })
});
```

**Effect:** Creates a `DialogueMove` record showing the author provided grounds

---

## System-Wide Effects

### 1. **UI Refresh Events**

After marking satisfied/unsatisfied, the system dispatches browser events:

```typescript
await globalMutate(cqsKey); // SWR cache invalidation
window.dispatchEvent(new CustomEvent("cqs:changed"));
window.dispatchEvent(new CustomEvent("dialogue:moves:refresh"));
```

**Listening Components:**
- `CriticalQuestionsV3` - Updates CQ display
- `DialogueInspector` - Refreshes dialogue timeline
- `DiscourseDashboard` - Updates move counts
- `ClaimMiniMap` - Updates CQ badges (X/Y satisfied)

---

### 2. **CQ Badge Updates (ClaimMiniMap)**

**Display Logic:**
```typescript
// components/claims/ClaimMiniMap.tsx
const CqMeter = ({ cq }) => {
  const r = cq?.required ?? 0; // Total CQs
  const s = cq?.satisfied ?? 0; // Satisfied CQs
  const pct = r ? Math.round((s / r) * 100) : 0;
  
  return (
    <span className={color}>
      CQ {pct}%
    </span>
  );
};
```

**Colors:**
- 100% satisfied → Green (`bg-emerald-400`)
- 50-99% satisfied → Amber (`bg-amber-400`)
- <50% satisfied → Grey (`bg-stone-200`)

**Data Source:** `/api/claims/summary` includes CQ counts:
```typescript
{
  claims: [
    {
      id: "claim-123",
      text: "...",
      cq: { required: 3, satisfied: 1 } // ← Updated when CQStatus changes
    }
  ]
}
```

---

### 3. **Argument Evaluation (ASPIC+)**

**Indirect Effect via ClaimEdge:**

While CQ satisfaction doesn't directly affect ASPIC+ evaluation, it influences **argument strength** indirectly:

1. **Unsatisfied CQs → Author provides GROUNDS → Creates ClaimEdge**
   - Author creates a supporting claim to answer CQ
   - New `ClaimEdge` with `type: 'supports'` created

2. **Unsatisfied CQs → Community challenges → Creates Attack ClaimEdge**
   - Community attaches counter-claim
   - New `ClaimEdge` with `type: 'rebuts'` or `attackType: 'UNDERCUTS'` created

3. **ClaimEdge counts affect grounded semantics:**
   ```typescript
   // lib/ceg/grounded.ts
   const edges: Edge[] = edgesRaw.map(e => ({
     from: e.fromClaimId,
     to: e.toClaimId,
     isAttack: e.type === 'rebuts' || 
               e.attackType === 'UNDERCUTS' || 
               e.attackType === 'UNDERMINES'
   }));
   
   // Label computation:
   // - IN: All attackers are OUT
   // - OUT: Has an attacker that is IN
   // - UNDEC: Neither condition holds
   ```

4. **ClaimLabel updated:**
   - Claims with more satisfied CQs (= more supporting evidence) → More likely to be labeled **IN**
   - Claims with unsatisfied CQs (= challenged, no defense) → More likely to be labeled **OUT** or **UNDEC**

**Visual Effect:**
- `ClaimMiniMap` shows colored dots next to claims:
  - 🟢 Green = IN (warranted)
  - 🔴 Red = OUT (defeated)
  - ⚪ Grey = UNDEC (undecided)

---

### 4. **Dialogue Move Counts**

**Optimized Query in `/api/cqs` GET:**
```typescript
const moveCounts = await prisma.$queryRaw`
  SELECT 
    payload->>'cqKey' as cq_key,
    kind,
    COUNT(*) as count
  FROM "DialogueMove"
  WHERE "targetType" = ${targetType}
    AND "targetId" = ${targetId}
    AND payload->>'cqKey' IS NOT NULL
  GROUP BY payload->>'cqKey', kind
`;
```

**Result:**
```typescript
{
  schemes: [
    {
      key: "argument_from_expert_opinion",
      cqs: [
        {
          key: "cq_1",
          text: "Is this claim adequately supported?",
          satisfied: true,
          groundsText: "Author's answer...",
          whyCount: 2,    // ← Number of WHY moves (challenges)
          groundsCount: 1 // ← Number of GROUNDS moves (answers)
        }
      ]
    }
  ]
}
```

**UI Display:**
- Shows activity badges next to CQs
- Indicates engagement level with each CQ

---

## Example User Flows

### Flow 1: Author Marks CQ Satisfied (With Proof)

```
1. User clicks CQ badge on their own claim
2. Modal opens, shows [AUTHOR] "Answer This Question" section
3. User types answer: "This claim is supported by empirical studies from 2024..."
4. User clicks "Submit Answer & Mark Satisfied"
5. Frontend calls `resolveViaGrounds()`:
   ├─ Creates GROUNDS DialogueMove
   └─ Calls POST /api/cqs
6. Backend:
   ├─ Upserts CQStatus { satisfied: true, groundsText: "..." }
   └─ Returns success
7. Frontend:
   ├─ Invalidates SWR cache
   ├─ Dispatches "cqs:changed" event
   └─ Dispatches "dialogue:moves:refresh" event
8. UI Updates:
   ├─ CQ badge changes: "CQ 33%" → "CQ 66%" (green)
   ├─ CQ card shows checkmark ✅
   └─ DialogueInspector shows new GROUNDS move
```

---

### Flow 2: Author Tries to Mark Satisfied (No Proof)

```
1. User clicks [Mark Satisfied] button
2. Frontend calls `toggleCQ()` → POST /api/cqs/toggle
3. Backend checks proof obligation:
   ├─ suggestionForCQ() returns { type: 'rebut' }
   ├─ Checks for inbound rebut edge → None found
   ├─ No attackerClaimId provided → No NLI check
   └─ allow = false
4. Backend reverts CQStatus:
   └─ Updates { satisfied: false }
5. Backend returns 409 Conflict:
   {
     ok: false,
     blocked: true,
     code: 'CQ_PROOF_OBLIGATION_NOT_MET',
     message: 'This CQ can only be marked addressed after...',
     guard: { requiredAttack: 'rebut', hasEdge: false }
   }
6. Frontend shows error toast:
   "⚠️ Cannot mark satisfied. Please attach a counter-claim first."
```

---

### Flow 3: Community Member Challenges via Counter-Claim

```
1. User (not author) clicks CQ badge
2. Modal opens, shows [COMMUNITY] "Challenge With Evidence" section
3. User clicks "Create New Counter-Claim"
4. Quick compose dialog opens
5. User types: "Actually, recent studies from 2025 contradict this claim..."
6. User clicks "Create & Attach"
7. Frontend calls `attachWithAttacker()`:
   ├─ Creates new claim via POST /api/claims
   ├─ Gets new claimId: "claim-999"
   └─ Calls POST /api/cqs/toggle with:
      {
        targetId: "claim-123",
        attackerClaimId: "claim-999",
        attachSuggestion: true,
        satisfied: false
      }
8. Backend:
   ├─ Creates ClaimEdge via createClaimAttack():
      {
        fromClaimId: "claim-999",
        toClaimId: "claim-123",
        type: "rebuts",
        attackType: "REBUTS",
        metaJson: { cqKey: "cq_1", schemeKey: "...", source: "critical-questions-v3-attach" }
      }
   ├─ Updates CQStatus { satisfied: false }
   └─ Returns success with edgeCreated: true
9. UI Updates:
   ├─ CQ card shows new "Currently Attached" counter-claim
   ├─ ClaimMiniMap shows new rebut edge
   └─ Grounded semantics recalculated (claim may now be OUT)
```

---

## Permissions & Access Control

### Current Implementation

**File:** `lib/cqs/permissions.ts`

```typescript
export async function canMarkCQSatisfied(
  userId: string,
  cqStatusId: string
): Promise<{
  canMark: boolean;
  reason?: string;
}> {
  const cqStatus = await prisma.cQStatus.findUnique({
    where: { id: cqStatusId },
    select: {
      targetType: true,
      targetId: true,
      roomId: true,
      createdById: true
    }
  });
  
  if (!cqStatus) {
    return { canMark: false, reason: "CQ status not found" };
  }
  
  // Get target (claim or argument) author
  let targetAuthorId: string | null = null;
  if (cqStatus.targetType === "claim") {
    const claim = await prisma.claim.findUnique({
      where: { id: cqStatus.targetId },
      select: { createdById: true }
    });
    targetAuthorId = claim ? String(claim.createdById) : null;
  } else if (cqStatus.targetType === "argument") {
    const arg = await prisma.argument.findUnique({
      where: { id: cqStatus.targetId },
      select: { createdById: true }
    });
    targetAuthorId = arg ? String(arg.createdById) : null;
  }
  
  // Check if user is author
  const isAuthor = targetAuthorId === userId;
  
  // Check if user is moderator
  const isModerator = cqStatus.roomId 
    ? await isRoomModerator(userId, cqStatus.roomId) 
    : false;
  
  // Check if room is public (for read-only access checks)
  const isPublic = cqStatus.roomId 
    ? await isRoomPublic(cqStatus.roomId) 
    : true;
  
  if (isAuthor || isModerator) {
    return { canMark: true };
  }
  
  return {
    canMark: false,
    reason: "Only the claim/argument author or room moderators can mark CQs satisfied"
  };
}
```

**Usage:** This helper exists but is **not currently called** in `/api/cqs/toggle`. The permission guard is commented out.

---

## API Endpoints Summary

| Endpoint | Method | Purpose | Guards | Used By |
|----------|--------|---------|--------|---------|
| `/api/cqs` | GET | Fetch CQ status for target | None | CriticalQuestionsV3 component |
| `/api/cqs` | POST | Update CQ status (simple) | None | `toggleCQ()`, internal systems |
| `/api/cqs/toggle` | POST | Update CQ status (guarded) | ⚠️ Permission (commented), ✅ Proof obligation | `attachWithAttacker()` |
| `/api/dialogue/move` | POST | Create dialogue move | Auth required | `toggleCQ()`, `resolveViaGrounds()` |

---

## Integration Points

### 1. **ClaimMiniMap Component**
- Displays CQ satisfaction percentage badges
- Fetches data from `/api/claims/summary`
- Listens to `cqs:changed` event
- Updates in real-time when CQs marked satisfied

### 2. **DialogueInspector Component**
- Shows WHY and GROUNDS moves in timeline
- Fetches data from `/api/dialogue/moves`
- Listens to `dialogue:moves:refresh` event
- Groups moves by target (claim/argument) and CQ

### 3. **DiscourseDashboard Component**
- Shows aggregate dialogue move counts
- Displays WHY vs GROUNDS ratio
- Indicates engagement level with critical questions

### 4. **Grounded Semantics Evaluator**
- Uses `ClaimEdge` data (affected by CQ challenges)
- Computes IN/OUT/UNDEC labels
- Updates `ClaimLabel` table
- Triggered by edge creation (not directly by CQ satisfaction)

### 5. **AIF (Argument Interchange Format) Export**
- CQ metadata included in node properties
- Satisfaction status exported as `cqStatus: { total, answered, open, keys }`
- Used by diagram visualization components

---

## Future Considerations

### 1. **Re-enable Permission Guards**
Uncomment author-only restriction in `/api/cqs/toggle/route.ts` lines 95-101:
```typescript
const isAuthor = String(claim?.createdById) === String(userId);
const isModerator = await isRoomModerator(userId, cqStatus.roomId);
if (!isAuthor && !isModerator) {
  return NextResponse.json({ 
    ok: false, 
    error: 'Only the claim author (or a moderator) can mark CQs satisfied/unsatisfied.' 
  }, { status: 403 });
}
```

### 2. **Add Moderator Role Check**
Currently `isModerator = false` is hardcoded. Implement room-level moderation:
```typescript
const isModerator = await isRoomModerator(userId, roomId);
```

### 3. **CQ Satisfaction Thresholds**
Consider adding deliberation-level settings:
- "Require 100% CQs satisfied before claim accepted"
- "Minimum X% CQs satisfied for publication"
- "Auto-flag claims with <50% satisfaction"

### 4. **Automated CQ Suggestion**
Use AI to suggest which CQs apply to a claim automatically:
```typescript
const suggestedCQs = await aiSuggestCQs(claimText, schemeKey);
// Create CQStatus entries for suggested CQs with satisfied: false
```

### 5. **CQ Response Voting**
Allow community to vote on CQ responses:
- Upvote/downvote grounds text
- Mark canonical response
- Auto-satisfy if community consensus reached

---

## Testing Scenarios

### Test 1: Author Marks Satisfied (Happy Path)
- ✅ User is claim author
- ✅ CQ has required attack edge (rebut)
- ✅ Marks satisfied successfully
- ✅ UI updates with checkmark

### Test 2: Author Marks Satisfied (No Proof)
- ✅ User is claim author
- ❌ CQ requires rebut, no edge exists
- ❌ Backend blocks with 409 error
- ✅ Frontend shows error toast

### Test 3: Community Member Attaches Counter-Claim
- ✅ User is not author
- ✅ Creates counter-claim
- ✅ Attaches via WHY move
- ✅ Creates ClaimEdge rebut
- ✅ CQ remains unsatisfied (author must respond)

### Test 4: Author Provides Grounds
- ✅ User is claim author
- ✅ Types answer text
- ✅ Submits via "Submit Answer"
- ✅ Creates GROUNDS move
- ✅ Updates CQStatus with groundsText
- ✅ Marks satisfied automatically

### Test 5: NLI Fallback (No Explicit Edge)
- ✅ User marks satisfied
- ❌ No rebut edge exists
- ✅ AttackerClaimId provided
- ✅ NLI returns { relation: 'contradicts', score: 0.85 }
- ✅ NLI score ≥ 0.72 threshold
- ✅ Backend allows satisfaction
- ✅ NLILink cached for future queries

---

## Debugging Checklist

When CQ satisfaction isn't working:

1. **Check authentication:**
   - Is user logged in? (`getCurrentUserId()` returns userId)
   
2. **Check deliberationId resolution:**
   - Does claim have `deliberationId` set?
   - Can `resolveClaimContext()` find deliberation/room?
   
3. **Check scheme existence:**
   - Does `ArgumentScheme` with that `schemeKey` exist?
   
4. **Check proof obligation:**
   - What does `suggestionForCQ()` return for this CQ?
   - Does required `ClaimEdge` exist?
   - If using NLI, what is the score?
   
5. **Check UI state:**
   - Is `isAuthor` computed correctly?
   - Is `claimAuthorId` prop passed correctly?
   - Is SWR cache stale? (Check browser devtools network tab)

6. **Check event propagation:**
   - Are `cqs:changed` events being dispatched?
   - Are components listening to these events?
   - Is SWR cache being invalidated?

---

## Conclusion

The "Mark Satisfied" feature is a **multi-layered system** combining:

1. **Permission control** (author-only, currently disabled)
2. **Proof obligations** (hard guard requiring evidence)
3. **Dialogue tracking** (WHY/GROUNDS moves)
4. **UI orchestration** (event-driven updates)
5. **Argument evaluation** (indirect via ClaimEdge)

It serves as a **collaborative inquiry tool** where:
- **Authors** defend their claims by answering CQs
- **Community** challenges claims by attaching counter-evidence
- **System** enforces proof obligations to maintain rigor
- **Evaluator** uses edge structure to compute argument strength

The feature is **currently permissive** (any user can mark) but **UI reflects intended author-only UX** and **backend has comprehensive guard infrastructure ready to be enabled**.
