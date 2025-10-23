# GROUNDS Move System - Complete Explanation

## Table of Contents
1. [What are GROUNDS?](#what-are-grounds)
2. [Technical Flow](#technical-flow)
3. [Components Involved](#components-involved)
4. [ClaimMiniMap Integration](#claimminimap-integration)
5. [Code Examples](#code-examples)

---

## What are GROUNDS?

### Conceptual Overview
GROUNDS is a **dialogical move** in formal argumentation that **answers a WHY challenge** by providing justification, evidence, or reasoning.

### Dialogue Protocol
```
┌─────────────────────────────────────────────────┐
│ Step 1: User A makes a claim                    │
│   "The expert's testimony is reliable"          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Step 2: User B challenges with WHY              │
│   "Why should we accept this expert?"           │
│   (Critical Question E1: Expert field)          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Step 3: User A responds with GROUNDS            │
│   "Dr. Smith has 20 years in climate science"   │
│   (Answers CQ E1)                                │
└─────────────────────────────────────────────────┘
```

### Key Properties
- **Pair-wise**: Each GROUNDS answers a specific WHY
- **Tracked by `cqId`**: Server pairs moves via Critical Question ID
- **Dialogue tree position**: Uses `locusPath` (e.g., "0", "0.1", "0.1.2")
- **Optional satisfaction**: Can mark CQ as "satisfied" after GROUNDS

---

## Technical Flow

### 1. WHY Move Creation

**User Action**: Click "Ask WHY" or "CHALLENGE" button in UI

**API Request**:
```typescript
POST /api/dialogue/move
{
  deliberationId: "delib_abc123",
  targetType: "claim",
  targetId: "claim_xyz789",
  kind: "WHY",
  payload: {
    locusPath: "0",              // Dialogue tree position
    schemeKey: "expert",         // Optional: which argumentation scheme
    cqId: "E1"                   // ✅ CRITICAL: Which CQ this challenges
  },
  autoCompile: true,
  autoStep: true
}
```

**Database Record** (DialogicalMove table):
```sql
INSERT INTO "DialogicalMove" (
  "id", "deliberationId", "targetType", "targetId", 
  "kind", "payload", "signature", "createdAt"
) VALUES (
  'dm_001',
  'delib_abc123',
  'claim',
  'claim_xyz789',
  'WHY',
  '{"locusPath":"0","schemeKey":"expert","cqId":"E1"}',
  'WHY:claim:claim_xyz789:E1',  -- Unique signature for deduplication
  NOW()
);
```

### 2. Legal Moves Computation

**When user refreshes page or opens legal moves panel:**

**API Request**:
```typescript
GET /api/dialogue/legal-moves
  ?deliberationId=delib_abc123
  &targetType=claim
  &targetId=claim_xyz789
  &locusPath=0
```

**Server Logic** (`app/api/dialogue/legal-moves/route.ts`):
```typescript
// Fetch all WHY/GROUNDS moves for this target
const rows = await prisma.dialogueMove.findMany({
  where: { 
    deliberationId, 
    targetType, 
    targetId, 
    kind: { in: ['WHY','GROUNDS'] } 
  },
  orderBy: { createdAt: 'asc' },
});

// Group by cqId, keep most recent per CQ
const latestByKey = new Map<string, Row>();
for (const r of rows) {
  const key = r?.payload?.cqId;
  if (!key) {
    console.warn('Move missing cqId, skipping');
    continue; // ❌ Malformed move
  }
  const prev = latestByKey.get(key);
  if (!prev || r.createdAt > prev.createdAt) {
    latestByKey.set(key, r); // Keep most recent
  }
}

// Find open WHYs (no GROUNDS response yet)
const openKeys = [...latestByKey.entries()]
  .filter(([, v]) => v.kind === 'WHY')  // Latest is WHY
  .map(([k]) => k);                     // Extract cqId

// Generate GROUNDS moves for open WHYs
for (const k of openKeys) {
  moves.push({
    kind: 'GROUNDS',
    label: `Answer ${k}`,  // e.g., "Answer E1"
    payload: { cqId: k, locusPath: locusPath || '0' },
    disabled: actorId !== targetAuthorId,  // Only author can answer
    reason: disabled ? 'Only the author may answer this WHY' : undefined
  });
}
```

**Response**:
```json
{
  "ok": true,
  "moves": [
    {
      "kind": "GROUNDS",
      "label": "Answer E1",
      "payload": { "cqId": "E1", "locusPath": "0" },
      "disabled": false,
      "force": "ATTACK",
      "relevance": "likely"
    },
    {
      "kind": "CONCEDE",
      "label": "Concede",
      "payload": { "locusPath": "0" },
      "force": "SURRENDER"
    }
    // ... other moves
  ]
}
```

### 3. GROUNDS Response Submission

**User Action**: 
- Click "Answer E1" chip, enter text in prompt
- OR: Type in inline grounds input field and press Enter

**API Request**:
```typescript
POST /api/dialogue/move
{
  deliberationId: "delib_abc123",
  targetType: "claim",
  targetId: "claim_xyz789",
  kind: "GROUNDS",
  payload: {
    cqId: "E1",                          // ✅ MUST match the WHY's cqId
    locusPath: "0",                      // Same locus as WHY
    schemeKey: "expert",                 // Optional, for analytics
    expression: "Dr. Smith has 20 years experience in climate science",  // The actual grounds
    original: "Dr. Smith has 20 years experience in climate science"     // Copy for UI
  },
  autoCompile: true,
  autoStep: true
}
```

**Database Record**:
```sql
INSERT INTO "DialogicalMove" (
  "id", "deliberationId", "targetType", "targetId", 
  "kind", "payload", "signature", "createdAt"
) VALUES (
  'dm_002',
  'delib_abc123',
  'claim',
  'claim_xyz789',
  'GROUNDS',
  '{"cqId":"E1","locusPath":"0","schemeKey":"expert","expression":"Dr. Smith has 20 years..."}',
  'GROUNDS:claim:claim_xyz789:E1:0::hash_abc123',  -- Signature includes cqId + locus + expression hash
  NOW()
);
```

### 4. Move Pairing Verification

**Query to verify pairing**:
```sql
-- Both WHY and GROUNDS should exist with same cqId
SELECT 
  id, 
  kind, 
  payload->>'cqId' as cq_id, 
  payload->>'expression' as content,
  "createdAt"
FROM "DialogicalMove"
WHERE "targetId" = 'claim_xyz789'
  AND kind IN ('WHY', 'GROUNDS')
ORDER BY "createdAt" DESC;

-- Expected output:
--   id      | kind    | cq_id | content                       | createdAt
-- ----------|---------|-------|-------------------------------|----------------------
--   dm_002  | GROUNDS | E1    | Dr. Smith has 20 years...    | 2025-10-21 14:32:00
--   dm_001  | WHY     | E1    | null                          | 2025-10-21 14:30:00
```

### 5. Optional: Mark CQ Satisfied

After successful GROUNDS, optionally mark the CQ as satisfied:

**API Request**:
```typescript
POST /api/cqs/toggle
{
  targetType: "claim",
  targetId: "claim_xyz789",
  schemeKey: "expert",
  cqKey: "E1",
  satisfied: true,
  deliberationId: "delib_abc123"
}
```

**Database Update**:
```sql
INSERT INTO "CQStatus" (
  "targetType", "targetId", "schemeKey", "cqKey", "satisfied", "createdById", "roomId"
) VALUES (
  'claim', 'claim_xyz789', 'expert', 'E1', true, 'user_123', 'room_456'
)
ON CONFLICT ("targetType", "targetId", "schemeKey", "cqKey")
DO UPDATE SET "satisfied" = true, "updatedAt" = NOW();
```

---

## Components Involved

### 1. **CriticalQuestions Component** (Primary Interface)
**Location**: `components/claims/CriticalQuestionsV2.tsx`

**Features**:
- Displays CQs from ArgumentScheme.cq JSON
- Inline grounds input field
- "Show Moves" button → expands LegalMoveChips
- "Post grounds" button → submits GROUNDS move

**Usage**:
```tsx
<CriticalQuestions
  targetType="claim"
  targetId="claim_xyz789"
  createdById="user_123"
  deliberationId="delib_abc123"
/>
```

**Inline Grounds Submission**:
```tsx
// User types in input, presses Enter or clicks button
<Input
  placeholder="Reply with grounds…"
  value={groundsVal}
  onKeyDown={async (e) => {
    if (e.key === 'Enter' && groundsVal.trim() && !posting) {
      await resolveViaGrounds(schemeKey, cqKey, groundsVal.trim(), true);
    }
  }}
/>
<Button onClick={() => resolveViaGrounds(s.key, cq.key, groundsVal.trim(), true)}>
  Post grounds
</Button>
```

### 2. **LegalMoveChips Component** (Move Buttons)
**Location**: `components/dialogue/LegalMoveChips.tsx`

**Features**:
- Fetches legal moves from `/api/dialogue/legal-moves`
- Displays chips for WHY, GROUNDS, CONCEDE, RETRACT, CLOSE
- Handles move posting on click
- Shows disabled state with tooltip

**Usage**:
```tsx
<LegalMoveChips
  deliberationId="delib_abc123"
  targetType="claim"
  targetId="claim_xyz789"
  locusPath="0"
  onPosted={() => {
    // Refresh caches
    window.dispatchEvent(new CustomEvent('claims:changed'));
    window.dispatchEvent(new CustomEvent('dialogue:moves:refresh'));
  }}
/>
```

**Rendered Output**:
```tsx
// If WHY exists for E1:
<button>Answer E1</button>  // ← GROUNDS move

// If no WHY for E2:
<button>CHALLENGE</button>  // ← WHY move (generic, rarely used)
```

### 3. **LegalMoveToolbarAIF Component** (Alternative UI)
**Location**: `components/dialogue/LegalMoveToolbarAIF.tsx`

**Features**:
- Similar to LegalMoveChips but with richer UI
- Displays move icons and labels
- Integrates with NLCommitPopover for commitment store

**Usage**:
```tsx
<LegalMoveToolbarAIF
  deliberationId="delib_abc123"
  targetType="claim"
  targetId="claim_xyz789"
  locus="0"
/>
```

### 4. **DialogicalPanel Component** (Full Dialogue View)
**Location**: `components/dialogue/DialogicalPanel.tsx`

**Features**:
- Lists all dialogue moves in tree structure
- Quick WHY/GROUNDS buttons per node
- Commitment store visualization

**Usage**:
```tsx
<DialogicalPanel
  deliberationId="delib_abc123"
  targetType="claim"
  targetId="claim_xyz789"
/>
```

### 5. **NLCommitPopover Component** (Commitment Store)
**Location**: `components/dialogue/NLCommitPopover.tsx`

**Features**:
- Allows user to commit to a proposition after GROUNDS
- E.g., "I commit that: Dr. Smith is a climate expert"

**Usage**:
```tsx
{/* After GROUNDS, user can optionally commit */}
<NLCommitPopover
  open={commitOpen}
  onOpenChange={setCommitOpen}
  deliberationId="delib_abc123"
  targetType="claim"
  targetId="claim_xyz789"
  locusPath="0"
  defaultOwner="Proponent"
  onDone={() => {
    window.dispatchEvent(new CustomEvent('dialogue:cs:refresh'));
  }}
/>
```

---

## ClaimMiniMap Integration

### How ClaimMiniMap Uses CriticalQuestions

**File**: `components/claims/ClaimMiniMap.tsx`

### 1. Import
```tsx
import CriticalQuestions from '@/components/claims/CriticalQuestionsV2';
```

### 2. Trigger (CQs Button)
```tsx
// In each claim row:
<button
  className="text-[11px] px-1.5 py-0.5 border rounded"
  title="Open Critical Questions"
  onClick={(e) => { 
    e.stopPropagation(); 
    setCqOpenFor(c.id);  // Open modal for this claim
  }}
>
  CQs
</button>
```

### 3. Modal Dialog
```tsx
{/* CQ Modal */}
{cqOpenFor && (
  <Dialog open onOpenChange={(o) => { if (!o) setCqOpenFor(null); }}>
    <DialogContent className="bg-white rounded-xl sm:max-w-[880px]">
      <DialogHeader>
        <DialogTitle>Claim-level Critical Questions</DialogTitle>
      </DialogHeader>
      <div className="mt-2">
        <CriticalQuestions
          targetType="claim"
          targetId={cqOpenFor}         // The claim user clicked on
          createdById="current"
          deliberationId={deliberationId}
        />
      </div>
    </DialogContent>
  </Dialog>
)}
```

### 4. Dialogical Status Display

ClaimMiniMap shows GROUNDS activity for each claim:

```tsx
// Compute dialogical moves per claim
const moves = movesByTarget.get(c.id) ?? [];

const whyMoves = moves.filter((m: any) => m.kind === 'WHY');
const groundsMoves = moves.filter((m: any) => m.kind === 'GROUNDS');

// Count open WHYs (those without a GROUNDS response)
const openWhys = whyMoves.filter((w: any) => {
  const answered = groundsMoves.some((g: any) => 
    new Date(g.createdAt) > new Date(w.createdAt) &&
    g.payload?.cqId === w.payload?.cqId  // ✅ Paired by cqId
  );
  return !answered;
}).length;

// Attach to claim data
return {
  ...c,
  moves: {
    whyCount: whyMoves.length,
    groundsCount: groundsMoves.length,    // ✅ Total GROUNDS
    concedeCount: moves.filter((m: any) => m.kind === 'CONCEDE').length,
    retractCount: moves.filter((m: any) => m.kind === 'RETRACT').length,
    openWhys,                              // ✅ Unanswered WHYs
  },
};
```

### 5. Visual Indicators

```tsx
<DialogicalStatus moves={c.moves} />

// Renders:
function DialogicalStatus({ moves }) {
  return (
    <div className="flex items-center gap-1 text-[10px]">
      {moves.whyCount > 0 && (
        <span className={openColor} title={`${moves.whyCount} WHY moves (${moves.openWhys} open)`}>
          ?{moves.whyCount}
        </span>
      )}
      {moves.groundsCount > 0 && (
        <span className="text-emerald-600" title={`${moves.groundsCount} GROUNDS responses`}>
          G:{moves.groundsCount}  {/* ✅ Green badge */}
        </span>
      )}
    </div>
  );
}
```

**Example display**:
```
Claim: "Climate change is caused by humans"
[IN] +5 −2 CQ 75% expert  ?2 G:1  [CQs]
                          ↑   ↑
                          │   └─ 1 GROUNDS response
                          └───── 2 WHY challenges (1 open)
```

### 6. Expanded View

When user expands a claim in ClaimMiniMap:

```tsx
{isExpanded && (
  <div className="mt-2 pl-6 border-l-2 border-indigo-200 space-y-2">
    {/* Dialogical activity */}
    <div className="text-xs">
      <strong>Dialogical Activity:</strong>
      <div className="ml-2 text-slate-600">
        <div>WHY moves: {c.moves.whyCount} (open: {c.moves.openWhys})</div>
        <div>GROUNDS responses: {c.moves.groundsCount}</div>
        <div>Concessions: {c.moves.concedeCount}</div>
        <div>Retractions: {c.moves.retractCount}</div>
      </div>
      {c.moves.openWhys > 0 && (
        <div className="mt-2 text-amber-700 font-medium">
          ⚠️ {c.moves.openWhys} open challenge{c.moves.openWhys > 1 ? 's' : ''} requiring response
        </div>
      )}
    </div>
    
    {/* Legal moves interface */}
    <div className="pt-2 border-t border-slate-200">
      <div className="text-xs font-semibold mb-1">Legal Dialogical Moves:</div>
      <LegalMoveChips
        deliberationId={deliberationId}
        targetType="claim"
        targetId={c.id}
        locusPath="0"
        onPosted={() => {
          window.dispatchEvent(new CustomEvent('claims:changed'));
        }}
      />
    </div>
  </div>
)}
```

---

## Code Examples

### Example 1: Full GROUNDS Workflow in CriticalQuestions

```tsx
// In CriticalQuestionsV2.tsx
async function resolveViaGrounds(
  schemeKey: string,
  cqId: string,
  brief: string,
  alsoMark = false  // Optionally mark CQ satisfied
) {
  const sig = sigOf(schemeKey, cqId);
  const text = (brief || '').trim();
  if (!text) return;

  try {
    setPostingKey(sig);
    
    // Step 1: Post GROUNDS move
    const res = await fetch('/api/dialogue/move', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        deliberationId,
        targetType: 'claim',
        targetId,
        kind: 'GROUNDS',
        payload: {
          schemeKey,           // For analytics/labels
          cqId,                // ✅ Pairs with WHY
          locusPath: locus,    // Dialogue tree position
          expression: text,    // ✅ The actual grounds
          original: text       // UI copy
        },
        autoCompile: true,
        autoStep: true,
      }),
    });
    
    if (!res.ok) throw new Error(await res.text());

    // Step 2: Optional - mark CQ satisfied
    if (alsoMark) {
      await fetch('/api/cqs/toggle', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          schemeKey,
          cqKey: cqId,
          satisfied: true,
          deliberationId,
        }),
      });
    }

    // Step 3: Dispatch events for cache invalidation
    window.dispatchEvent(new CustomEvent('dialogue:moves:refresh'));
    flashOk(sig);  // Show green checkmark
    
  } finally {
    setPostingKey(null);
    setGroundsDraft((g) => ({ ...g, [sig]: '' }));  // Clear input
    await revalidateAll(schemeKey);  // Refresh all caches
  }
}
```

### Example 2: LegalMoveChips GROUNDS Handler

```tsx
// In LegalMoveChips.tsx
const postMove = async (m: Move) => {
  if (m.disabled || busy) return;

  setBusy(m.kind);
  try {
    const postTargetType = m.postAs?.targetType ?? targetType;
    const postTargetId   = m.postAs?.targetId   ?? targetId;
    
    const body = {
      deliberationId,
      targetType: postTargetType,
      targetId: postTargetId,
      kind: m.kind,  // 'GROUNDS'
      payload: { 
        locusPath,           // From props
        ...(m.payload ?? {})  // Includes cqId
      },
      autoCompile: true,
      autoStep: true,
      phase: 'neutral' as const,
    };
    
    const r = await fetch('/api/dialogue/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j?.ok === false) throw new Error(j?.error ?? `HTTP ${r.status}`);

    onPosted?.();  // Callback to parent
    mutate();      // Refresh legal moves
    toast.show(`${m.label || m.kind} posted`, 'ok');
    
  } catch (e: any) {
    toast.show(`Failed: ${m.label || m.kind}`, 'err');
  } finally {
    setBusy(null);
  }
};
```

### Example 3: ClaimMiniMap Open WHY Detection

```tsx
// In ClaimMiniMap.tsx - enriching claims with move data
const enrichedClaims: ClaimRow[] = useMemo(() => {
  const baseClaims = summary?.claims ?? [];
  const movesByTarget = new Map<string, any[]>();

  // Group moves by targetId
  (movesData?.moves ?? []).forEach((m: any) => {
    if (m.targetType === 'claim') {
      const list = movesByTarget.get(m.targetId) ?? [];
      list.push(m);
      movesByTarget.set(m.targetId, list);
    }
  });

  return baseClaims.map((c: ClaimRow) => {
    const moves = movesByTarget.get(c.id) ?? [];
    
    const whyMoves = moves.filter((m: any) => m.kind === 'WHY');
    const groundsMoves = moves.filter((m: any) => m.kind === 'GROUNDS');
    
    // ✅ Key logic: Detect open WHYs
    const openWhys = whyMoves.filter((w: any) => {
      const answered = groundsMoves.some((g: any) => 
        new Date(g.createdAt) > new Date(w.createdAt) &&
        g.payload?.cqId === w.payload?.cqId  // ✅ MUST match
      );
      return !answered;  // WHY without a GROUNDS = open
    }).length;

    return {
      ...c,
      moves: {
        whyCount: whyMoves.length,
        groundsCount: groundsMoves.length,
        concedeCount: moves.filter((m: any) => m.kind === 'CONCEDE').length,
        retractCount: moves.filter((m: any) => m.kind === 'RETRACT').length,
        openWhys,
      },
    };
  });
}, [summary, movesData]);
```

---

## Summary: GROUNDS in Action

### User Journey

1. **User views claim in ClaimMiniMap**
   - Sees "CQs" button
   - Clicks → modal opens with CriticalQuestions component

2. **User sees Critical Question**
   - E.g., "E1: Is the expert qualified in the relevant field?"
   - Checkbox is disabled (no attack yet)

3. **Opponent challenges with WHY**
   - Clicks "Show Moves" → LegalMoveChips expands
   - Clicks "CHALLENGE" or WHY chip
   - WHY move posted with `cqId: "E1"`

4. **Proponent sees "Answer E1" chip**
   - Legal moves API detects open WHY
   - Returns GROUNDS move option
   - User clicks "Answer E1" → prompt appears

5. **Proponent submits GROUNDS**
   - Types: "Dr. Smith has 20 years in climate science"
   - GROUNDS move posted with same `cqId: "E1"`
   - Optionally marks CQ as satisfied

6. **System pairs moves**
   - Server detects matching `cqId`
   - WHY + GROUNDS are now linked
   - ClaimMiniMap shows: `?1 G:1` (1 WHY, 1 GROUNDS)

7. **Visual update**
   - Green badge appears: `G:1`
   - Open WHY count decrements: `openWhys: 0`
   - CQ checkbox may become enabled

### Key Takeaways

✅ **GROUNDS always answer a WHY** - They're paired, not standalone  
✅ **`cqId` is the pairing key** - Server matches WHY/GROUNDS by this field  
✅ **ClaimMiniMap shows activity** - Displays WHY/GROUNDS counts per claim  
✅ **CriticalQuestions is the UI** - Primary interface for posting GROUNDS  
✅ **Legal moves compute availability** - Server determines when GROUNDS are legal  
✅ **Event-driven updates** - All components refresh via bus events  

---

## Troubleshooting

### Issue: GROUNDS not pairing with WHY
**Cause**: Mismatched `cqId` or missing `cqId`  
**Solution**: Ensure both WHY and GROUNDS have identical `payload.cqId`

### Issue: "Answer E1" not appearing
**Cause**: No open WHY for E1, or WHY missing `cqId`  
**Solution**: Check DialogicalMove table for WHY with `payload.cqId = "E1"`

### Issue: CQ checkbox stays disabled after GROUNDS
**Cause**: CQStatus not updated, or guard requires attachment  
**Solution**: Call `/api/cqs/toggle` with `satisfied: true` after GROUNDS

### Issue: ClaimMiniMap not showing GROUNDS count
**Cause**: `movesData` not fetched or cache stale  
**Solution**: Dispatch `dialogue:moves:refresh` event to trigger revalidation

---

**Related Files**:
- `app/api/dialogue/move/route.ts` - Move posting handler
- `app/api/dialogue/legal-moves/route.ts` - Legal moves computation
- `lib/dialogue/signature.ts` - Move signature generation (includes cqId)
- `components/claims/CriticalQuestionsV2.tsx` - Primary GROUNDS UI
- `components/dialogue/LegalMoveChips.tsx` - Move button chips
- `components/claims/ClaimMiniMap.tsx` - Claim list with CQ integration

