# Critical Questions → Dialogical Moves → Ludics Integration Roadmap

**Created:** November 6, 2025  
**Status:** Planning → Implementation  
**Priority:** CRITICAL (Core Infrastructure)  
**Estimated Timeline:** 4-6 weeks (8 phases)

---

## **Executive Summary**

This roadmap unifies three currently fragmented systems (CQs, Dialogical Moves, Ludics) into a cohesive argumentation pipeline. The integration enables:

1. **Formal provenance:** Every CQ action creates a DialogueMove with full context
2. **Semantic preservation:** CQ attack types (UNDERMINES/UNDERCUTS/REBUTS) flow through to ludics
3. **Bidirectional links:** AIF nodes ↔ DialogueMoves ↔ LudicActs with foreign keys
4. **ASPIC+ compliance:** Attack types properly classified in ASPIC+ translation

**Success Criteria:**
- ✅ Asking a CQ creates WHY DialogueMove with cqId in payload
- ✅ Answering a CQ creates GROUNDS DialogueMove with cqId in payload
- ✅ LudicActs preserve CQ metadata (attackType, targetScope, schemeKey)
- ✅ AIF export includes DialogueMove provenance
- ✅ AttackMenuProV2 formally deprecated (replaced by CQ-driven system)

---

## **Phase 1: Database Schema Updates** 
**Duration:** 1-2 days 
**Dependencies:** None  
**Risk:** Low (additive changes only)

### **Goal**
Add foreign key relationships to link CQs → DialogueMoves → CA-nodes → LudicActs

### **Tasks**

#### **1.1: Add DialogueMove FK to ConflictingArgument**
**File:** `prisma/schema.prisma`

```prisma
model ConflictingArgument {
  // ... existing fields
  
  // NEW: Link to DialogueMove that created this attack
  dialogueMoveId String?
  dialogueMove   DialogueMove? @relation(fields: [dialogueMoveId], references: [id], onDelete: SetNull)
  
  @@index([dialogueMoveId])
}

model DialogueMove {
  // ... existing fields
  
  // NEW: Reverse relation
  conflictingArguments ConflictingArgument[]
}
```

#### **1.2: Add CQ Metadata to LudicAct**
**File:** `prisma/schema.prisma`

```prisma
model LudicAct {
  // ... existing fields
  
  // Enhance extJson to include CQ context
  // extJson structure (existing field, just documenting expected shape):
  // {
  //   cqId?: string;
  //   cqText?: string;
  //   attackType?: 'UNDERMINES' | 'UNDERCUTS' | 'REBUTS';
  //   targetScope?: 'premise' | 'inference' | 'conclusion';
  //   schemeKey?: string;
  //   schemeName?: string;
  // }
}
```

#### **1.3: Run Migration**
```bash
npx prisma db push
npx prisma generate
```

**Testing:**
- [ ] Schema validates without errors
- [ ] Existing data unaffected (FK nullable)
- [ ] Can create ConflictingArgument with dialogueMoveId
- [ ] Can query DialogueMove.conflictingArguments

---

## **Phase 2: API Layer - DialogueMove Creation Helpers**
**Duration:** 2-3 days  
**Dependencies:** Phase 1 complete  
**Risk:** Medium (new API surface)

### **Goal**
Create utility functions for CQ → DialogueMove creation with proper payload structure

### **Tasks**

#### **2.1: Create CQ-DialogueMove Helper**
**File:** `lib/dialogue/cqMoveHelpers.ts` (NEW)

```typescript
import { prisma } from '@/lib/prismaclient';

export interface CQMovePayload {
  cqId: string;
  cqText: string;
  attackType: 'UNDERMINES' | 'UNDERCUTS' | 'REBUTS';
  targetScope: 'premise' | 'inference' | 'conclusion';
  schemeKey?: string;
  schemeName?: string;
  locusPath?: string;
}

/**
 * Create a WHY DialogueMove for asking a critical question
 */
export async function createCQWhyMove({
  deliberationId,
  targetType,
  targetId,
  authorId,
  cqPayload,
}: {
  deliberationId: string;
  targetType: 'claim' | 'argument';
  targetId: string;
  authorId: string;
  cqPayload: CQMovePayload;
}) {
  // Check for duplicate WHY
  const existing = await prisma.dialogueMove.findFirst({
    where: {
      deliberationId,
      targetType,
      targetId,
      kind: 'WHY',
      payload: {
        path: ['cqId'],
        equals: cqPayload.cqId,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    // Check if already answered (has GROUNDS after this WHY)
    const grounds = await prisma.dialogueMove.findFirst({
      where: {
        deliberationId,
        targetType,
        targetId,
        kind: 'GROUNDS',
        payload: {
          path: ['cqId'],
          equals: cqPayload.cqId,
        },
        createdAt: { gt: existing.createdAt },
      },
    });

    if (!grounds) {
      console.log('[CQ] WHY already exists and unanswered, returning existing');
      return existing;
    }
  }

  // Create new WHY move
  const move = await prisma.dialogueMove.create({
    data: {
      deliberationId,
      targetType,
      targetId,
      kind: 'WHY',
      authorId,
      payload: {
        cqId: cqPayload.cqId,
        cqText: cqPayload.cqText,
        attackType: cqPayload.attackType,
        targetScope: cqPayload.targetScope,
        schemeKey: cqPayload.schemeKey,
        schemeName: cqPayload.schemeName,
        locusPath: cqPayload.locusPath || '0',
      },
    },
  });

  return move;
}

/**
 * Create a GROUNDS DialogueMove for answering a critical question
 */
export async function createCQGroundsMove({
  deliberationId,
  targetType,
  targetId,
  authorId,
  cqPayload,
  groundsText,
  argumentId,
}: {
  deliberationId: string;
  targetType: 'claim' | 'argument';
  targetId: string;
  authorId: string;
  cqPayload: CQMovePayload;
  groundsText: string;
  argumentId?: string; // If GROUNDS creates/links an argument
}) {
  // Find the WHY this GROUNDS is answering
  const whyMove = await prisma.dialogueMove.findFirst({
    where: {
      deliberationId,
      targetType,
      targetId,
      kind: 'WHY',
      payload: {
        path: ['cqId'],
        equals: cqPayload.cqId,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!whyMove) {
    throw new Error(`No WHY move found for cqId: ${cqPayload.cqId}`);
  }

  // Create GROUNDS move
  const move = await prisma.dialogueMove.create({
    data: {
      deliberationId,
      targetType,
      targetId,
      kind: 'GROUNDS',
      authorId,
      argumentId, // Link to argument if provided
      payload: {
        cqId: cqPayload.cqId,
        cqText: cqPayload.cqText,
        attackType: cqPayload.attackType,
        targetScope: cqPayload.targetScope,
        schemeKey: cqPayload.schemeKey,
        schemeName: cqPayload.schemeName,
        locusPath: cqPayload.locusPath || '0',
        brief: groundsText, // The actual grounds content
      },
    },
  });

  return move;
}

/**
 * Fetch CQ details from ArgumentScheme
 */
export async function getCQDetails(
  targetType: 'claim' | 'argument',
  targetId: string,
  cqKey: string
): Promise<CQMovePayload | null> {
  if (targetType === 'claim') {
    const instances = await prisma.schemeInstance.findMany({
      where: { targetType: 'claim', targetId },
      include: { scheme: true },
    });

    for (const inst of instances) {
      const cqs = Array.isArray(inst.scheme.cq) ? inst.scheme.cq : [];
      const cq = cqs.find((c: any) => c.cqKey === cqKey || c.key === cqKey);
      if (cq) {
        return {
          cqId: cq.cqKey || cq.key,
          cqText: cq.text || '',
          attackType: cq.attackType || 'UNDERMINES',
          targetScope: cq.targetScope || 'premise',
          schemeKey: inst.scheme.key || '',
          schemeName: inst.scheme.name || '',
        };
      }
    }
  } else if (targetType === 'argument') {
    const arg = await prisma.argument.findUnique({
      where: { id: targetId },
      include: { scheme: true },
    });

    if (arg?.scheme) {
      const cqs = Array.isArray(arg.scheme.cq) ? arg.scheme.cq : [];
      const cq = cqs.find((c: any) => c.cqKey === cqKey || c.key === cqKey);
      if (cq) {
        return {
          cqId: cq.cqKey || cq.key,
          cqText: cq.text || '',
          attackType: cq.attackType || 'UNDERMINES',
          targetScope: cq.targetScope || 'premise',
          schemeKey: arg.scheme.key || '',
          schemeName: arg.scheme.name || '',
        };
      }
    }
  }

  return null;
}
```

#### **2.2: Update CQs API to Create DialogueMoves**
**File:** `app/api/cqs/route.ts`

Add DialogueMove creation when CQ is toggled:

```typescript
// After line ~50 (in POST handler)
import { createCQWhyMove, createCQGroundsMove, getCQDetails } from '@/lib/dialogue/cqMoveHelpers';

// When satisfied = false (asking WHY)
if (!satisfied) {
  const cqDetails = await getCQDetails(targetType, targetId, cqKey);
  if (cqDetails) {
    await createCQWhyMove({
      deliberationId,
      targetType,
      targetId,
      authorId: userId || '', // Get from session
      cqPayload: cqDetails,
    });
  }
}

// When satisfied = true (providing GROUNDS)
if (satisfied && groundsText) {
  const cqDetails = await getCQDetails(targetType, targetId, cqKey);
  if (cqDetails) {
    await createCQGroundsMove({
      deliberationId,
      targetType,
      targetId,
      authorId: userId || '',
      cqPayload: cqDetails,
      groundsText,
    });
  }
}

// Trigger ludics recompilation
await compileFromMoves(deliberationId).catch(err => 
  console.error('[CQs] Failed to recompile ludics:', err)
);
```

#### **2.3: Update CA API to Link DialogueMoves**
**File:** `app/api/ca/route.ts`

When creating ConflictingArgument with CQ metadata, also create/link DialogueMove:

```typescript
// After line ~80 (before creating CA)
import { createCQWhyMove, getCQDetails } from '@/lib/dialogue/cqMoveHelpers';

let dialogueMoveId: string | undefined;

// If CQ context exists, create WHY DialogueMove
if (body.metaJson?.cqId) {
  const targetType = body.conflictedArgumentId ? 'argument' : 'claim';
  const targetId = body.conflictedArgumentId || body.conflictedClaimId;
  
  const cqDetails = await getCQDetails(targetType, targetId, body.metaJson.cqId);
  
  if (cqDetails) {
    const whyMove = await createCQWhyMove({
      deliberationId,
      targetType,
      targetId,
      authorId: userId || '',
      cqPayload: cqDetails,
    });
    
    dialogueMoveId = whyMove.id;
  }
}

// Create CA with link to DialogueMove
const ca = await prisma.conflictingArgument.create({
  data: {
    // ... existing fields
    dialogueMoveId, // NEW: Link to WHY move
  },
});
```

**Testing:**
- [ ] POST /api/cqs creates DialogueMove when CQ toggled
- [ ] WHY move has cqId, attackType, targetScope in payload
- [ ] GROUNDS move has matching cqId
- [ ] POST /api/ca links to DialogueMove when metaJson.cqId present
- [ ] Duplicate WHY moves are prevented

---

## **Phase 3: Ludics Compilation Enhancement**
**Duration:** 3-4 days  
**Dependencies:** Phase 2 complete  
**Risk:** Medium (core compilation logic)

### **Goal**
Preserve CQ metadata when compiling DialogueMoves to LudicActs

### **Tasks**

#### **3.1: Enhance compileFromMoves to Preserve CQ Metadata**
**File:** `packages/ludics-engine/compileFromMoves.ts`

Update WHY/GROUNDS compilation to include CQ context:

```typescript
// Around line 200 (WHY handling)
if (kind === 'WHY') {
  const cqId = payload.cqId || null;
  const attackType = payload.attackType || null;
  const targetScope = payload.targetScope || null;
  const schemeKey = payload.schemeKey || null;
  
  outActs.push({
    designId: O.id,
    act: {
      kind: 'PROPER',
      polarity: 'O',
      locus: anchor,
      ramification: [],
      expression: cqId ? `WHY [${cqId}]` : 'WHY',
      // NEW: Preserve CQ metadata
      metadata: {
        cqId,
        cqText: payload.cqText || '',
        attackType,
        targetScope,
        schemeKey,
        schemeName: payload.schemeName || '',
        dialogueMoveKind: 'WHY',
      },
    },
  });
}

// Around line 250 (GROUNDS handling)
if (kind === 'GROUNDS') {
  const cqId = payload.cqId || null;
  const brief = payload.brief || '';
  
  outActs.push({
    designId: P.id,
    act: {
      kind: 'PROPER',
      polarity: 'P',
      locus: childLocus,
      ramification: [],
      expression: brief,
      // NEW: Preserve CQ metadata
      metadata: {
        cqId,
        cqText: payload.cqText || '',
        attackType: payload.attackType || null,
        targetScope: payload.targetScope || null,
        schemeKey: payload.schemeKey || null,
        schemeName: payload.schemeName || '',
        dialogueMoveKind: 'GROUNDS',
        brief,
      },
    },
  });
}
```

#### **3.2: Update LudicAct Type Definitions**
**File:** `packages/ludics-engine/types.ts`

```typescript
export interface LudicActMetadata {
  // Existing fields
  sourceLocusPath?: string;
  
  // NEW: CQ provenance
  cqId?: string;
  cqText?: string;
  attackType?: 'UNDERMINES' | 'UNDERCUTS' | 'REBUTS';
  targetScope?: 'premise' | 'inference' | 'conclusion';
  schemeKey?: string;
  schemeName?: string;
  dialogueMoveKind?: 'WHY' | 'GROUNDS' | 'ASSERT' | 'RETRACT' | 'CLOSE';
  brief?: string; // For GROUNDS
}
```

#### **3.3: Update syncLudicsToAif**
**File:** `packages/ludics-engine/syncLudicsToAif.ts`

Ensure AifNodes inherit CQ metadata from LudicActs:

```typescript
// Around line 150 (when creating AifNode)
await tx.aifNode.create({
  data: {
    // ... existing fields
    
    // NEW: Include CQ metadata in extJson
    extJson: {
      ...existingExtJson,
      cqContext: act.extJson?.cqId ? {
        cqId: act.extJson.cqId,
        cqText: act.extJson.cqText,
        attackType: act.extJson.attackType,
        targetScope: act.extJson.targetScope,
        schemeKey: act.extJson.schemeKey,
      } : null,
    },
  },
});
```

**Testing:**
- [ ] DialogueMove with cqId compiles to LudicAct with metadata
- [ ] LudicAct.extJson includes attackType, targetScope
- [ ] AifNode inherits CQ context from LudicAct
- [ ] Existing non-CQ moves still compile correctly

---

## **Phase 4: UI Updates - CriticalQuestionsV3**
**Duration:** 2-3 days  
**Dependencies:** Phase 2, 3 complete  
**Risk:** Low (UI only)

### **Goal**
Update CriticalQuestionsV3 to use new DialogueMove creation flow

### **Tasks**

#### **4.1: Update resolveViaGrounds to Create DialogueMove**
**File:** `components/claims/CriticalQuestionsV3.tsx`

Replace direct `/api/cqs` call with DialogueMove creation:

```tsx
// Lines 279-323: Replace resolveViaGrounds function
const resolveViaGrounds = async (
  schemeKey: string,
  cqKey: string,
  grounds: string
) => {
  if (!grounds.trim()) return;

  const oldData = cqData;
  const updatedSchemes = oldData?.schemes.map((s) => {
    if (s.key !== schemeKey) return s;
    return {
      ...s,
      cqs: s.cqs.map((c) =>
        c.key === cqKey ? { ...c, satisfied: true, groundsText: grounds } : c
      ),
    };
  });

  globalMutate(cqsKey, { ...oldData, schemes: updatedSchemes }, false);

  try {
    // NEW: Create DialogueMove first (backend will handle CQStatus update)
    const moveRes = await fetch("/api/dialogue/move", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        deliberationId,
        targetType,
        targetId,
        kind: "GROUNDS",
        payload: {
          cqId: cqKey,
          brief: grounds,
          locusPath: "0",
        },
      }),
    });
    
    if (!moveRes.ok) throw new Error(`Failed to create GROUNDS move: ${moveRes.status}`);

    // Then update CQStatus
    const cqRes = await fetch("/api/cqs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        targetType,
        targetId,
        schemeKey,
        cqKey,
        satisfied: true,
        groundsText: grounds,
        deliberationId, // NEW: Include for move creation
      }),
    });
    
    if (!cqRes.ok) throw new Error(`Failed to update CQStatus: ${cqRes.status}`);

    await globalMutate(cqsKey);
    window.dispatchEvent(new CustomEvent("cqs:changed"));
    window.dispatchEvent(new CustomEvent("dialogue:moves:refresh"));
    
    setGroundsInput((prev) => ({ ...prev, [cqKey]: "" }));
    setExpandedCQ(null);
  } catch (err) {
    console.error("[CriticalQuestionsV3] resolveViaGrounds error:", err);
    globalMutate(cqsKey, oldData, false);
    alert(`Failed to submit grounds: ${err instanceof Error ? err.message : String(err)}`);
  }
};
```

#### **4.2: Add Visual Indicator for DialogueMove Link**
**File:** `components/claims/CriticalQuestionsV3.tsx`

Show badge when CQ has associated DialogueMove:

```tsx
// After line 575 (in CQ card rendering)
{/* NEW: Dialogue Provenance Badge */}
{cq.dialogueMoveCount && cq.dialogueMoveCount > 0 && (
  <div className="mt-2 flex items-center gap-2 text-xs">
    <MessageSquare className="w-4 h-4 text-indigo-500" />
    <span className="font-medium text-indigo-700">
      {cq.dialogueMoveCount} dialogue move{cq.dialogueMoveCount !== 1 ? 's' : ''}
    </span>
  </div>
)}
```

**Testing:**
- [ ] Providing grounds creates GROUNDS DialogueMove
- [ ] CQStatus updated after move created
- [ ] Ludics recompilation triggered
- [ ] Badge shows move count
- [ ] Events fire in correct order

---

## **Phase 5: UI Updates - SchemeSpecificCQsModal**
**Duration:** 2-3 days  
**Dependencies:** Phase 2, 3 complete  
**Risk:** Medium (objection form integration)

### **Goal**
Update SchemeSpecificCQsModal to create WHY moves when asking CQs and link GROUNDS when posting objections

### **Tasks**

#### **5.1: Update askCQ to Create WHY DialogueMove**
**File:** `components/arguments/SchemeSpecificCQsModal.tsx`

```tsx
// Replace handleAskCQ function (around line 158)
const handleAskCQ = async (cqKey: string) => {
  try {
    // 1. Create WHY DialogueMove
    const moveRes = await fetch("/api/dialogue/move", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        deliberationId,
        targetType: "argument",
        targetId: argumentId,
        kind: "WHY",
        payload: {
          cqId: cqKey,
          locusPath: "0",
        },
      }),
    });

    if (!moveRes.ok) {
      throw new Error(`Failed to create WHY move: ${moveRes.status}`);
    }

    // 2. Call existing askCQ API (creates CQStatus)
    await askCQ(argumentId, cqKey, { authorId, deliberationId });

    // 3. Update local state
    setLocalCqs((prev) =>
      prev.map((c) => (c.cqKey === cqKey ? { ...c, status: "open" } : c))
    );

    // 4. Fire events
    window.dispatchEvent(new CustomEvent("cqs:changed"));
    window.dispatchEvent(new CustomEvent("dialogue:moves:refresh"));
  } catch (err) {
    console.error("[SchemeSpecificCQsModal] Failed to ask CQ:", err);
    alert(`Failed to ask critical question: ${err instanceof Error ? err.message : String(err)}`);
  }
};
```

#### **5.2: Update postObjection to Create GROUNDS Move**
**File:** `components/arguments/SchemeSpecificCQsModal.tsx`

```tsx
// In postObjection function (around line 180), after posting CA
// Add after successful CA creation:

// Create GROUNDS DialogueMove to answer the WHY
const groundsRes = await fetch("/api/dialogue/move", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    deliberationId,
    targetType: "argument",
    targetId: argumentId,
    kind: "GROUNDS",
    argumentId: caResponseArgumentId, // If objection created an argument
    payload: {
      cqId: cqKey,
      brief: `Posted ${cq.attackType} objection`,
      locusPath: "0",
    },
  }),
});

if (!groundsRes.ok) {
  console.warn("[SchemeSpecificCQsModal] Failed to create GROUNDS move");
}

// Mark CQ as answered
await fetch("/api/cqs", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    targetType: "argument",
    targetId: argumentId,
    schemeKey: meta?.scheme?.key,
    cqKey,
    satisfied: true,
    groundsText: `Objection posted via ${cq.attackType}`,
  }),
});
```

#### **5.3: Add Dialogue Provenance Display**
**File:** `components/arguments/SchemeSpecificCQsModal.tsx`

Show WHY/GROUNDS counts in CQ header:

```tsx
// After line 420 (in CQ card header, after attack type badges)
{/* NEW: Dialogue State */}
{cq.whyCount !== undefined && cq.groundsCount !== undefined && (
  <div className="flex items-center gap-1 text-xs">
    {cq.whyCount > 0 && (
      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
        {cq.whyCount} WHY
      </span>
    )}
    {cq.groundsCount > 0 && (
      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
        {cq.groundsCount} GROUNDS
      </span>
    )}
  </div>
)}
```

**Testing:**
- [ ] "Mark as asked" creates WHY DialogueMove
- [ ] Posting objection creates GROUNDS DialogueMove
- [ ] CA-node links to DialogueMove via FK
- [ ] CQ badge shows WHY/GROUNDS counts
- [ ] Ludics recompilation triggered

---

## **Phase 6: AttackMenuProV2 Integration/Deprecation**
**Duration:** 2 days  
**Dependencies:** Phase 5 complete  
**Risk:** Low (migration path)

### **Goal**
Either integrate AttackMenuProV2 with CQ system or provide migration path to deprecate it

### **Option A: Full Integration (Recommended)**

#### **6.1: Add CQ Requirement to AttackMenuProV2**
**File:** `components/arguments/AttackMenuProV2.tsx`

Show CQ context and require CQ selection:

```tsx
// After line 100 (add state for CQ selection)
const [selectedCQ, setSelectedCQ] = React.useState<{
  cqId: string;
  cqText: string;
  attackType: string;
} | null>(null);

// Fetch CQs for target argument
const { data: cqData } = useSWR(
  `/api/arguments/${target.id}/aif-cqs`,
  fetcher
);

// Filter CQs by attack type
const relevantCQs = React.useMemo(() => {
  if (!cqData?.items) return [];
  return cqData.items.filter((cq: any) => {
    if (expandedCard === 'rebut') return cq.attackType === 'REBUTS';
    if (expandedCard === 'undercut') return cq.attackType === 'UNDERCUTS';
    if (expandedCard === 'undermine') return cq.attackType === 'UNDERMINES';
    return false;
  });
}, [cqData, expandedCard]);
```

```tsx
// In each attack card, add CQ selector before claim picker
{isExpanded && relevantCQs.length > 0 && (
  <div className="space-y-2 mb-4">
    <label className="text-sm font-medium text-rose-900">
      Select Critical Question to Address
    </label>
    <select
      className="w-full px-3 py-2 rounded-lg border-2 border-rose-300"
      value={selectedCQ?.cqId || ''}
      onChange={(e) => {
        const cq = relevantCQs.find((c: any) => c.cqKey === e.target.value);
        if (cq) {
          setSelectedCQ({
            cqId: cq.cqKey,
            cqText: cq.text,
            attackType: cq.attackType,
          });
        }
      }}
    >
      <option value="">Choose a critical question...</option>
      {relevantCQs.map((cq: any) => (
        <option key={cq.cqKey} value={cq.cqKey}>
          {cq.text}
        </option>
      ))}
    </select>
  </div>
)}
```

Update `fire()` function to include CQ context in CA creation.

### **Option B: Deprecation Path**

#### **6.2: Add Deprecation Warning**
**File:** `components/arguments/AttackMenuProV2.tsx`

```tsx
// At top of modal content
<div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
  <div className="flex items-start gap-3">
    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
    <div>
      <p className="text-sm font-semibold text-amber-900">
        Legacy Attack System
      </p>
      <p className="text-xs text-amber-700 mt-1">
        This interface is being phased out. Please use the "Critical Questions" 
        button to post formal, scheme-aware objections.
      </p>
    </div>
  </div>
</div>
```

#### **6.3: Add Link to SchemeSpecificCQsModal**
```tsx
<button
  onClick={() => {
    setOpen(false);
    // Trigger CQ modal (parent component will handle)
    window.dispatchEvent(new CustomEvent('open-scheme-cqs', { 
      detail: { argumentId: target.id } 
    }));
  }}
  className="w-full px-4 py-3 bg-indigo-100 hover:bg-indigo-200 rounded-lg"
>
  <div className="flex items-center justify-center gap-2">
    <HelpCircle className="w-5 h-5 text-indigo-600" />
    <span className="font-semibold text-indigo-900">
      Use Critical Questions Instead
    </span>
  </div>
</button>
```

**Testing:**
- [ ] Option A: AttackMenuProV2 requires CQ selection
- [ ] Option A: Attacks include cqId in metadata
- [ ] Option B: Warning message displays
- [ ] Option B: Link to CQ modal works

---

## **Phase 7: ASPIC+ Translation Enhancement**
**Duration:** 2 days  
**Dependencies:** Phase 3 complete  
**Risk:** Low (export only)

### **Goal**
Enhance ASPIC+ export to properly classify attack types based on CQ metadata

### **Tasks**

#### **7.1: Update aifToAspic with Attack Type Classification**
**File:** `lib/aif/translation/aifToAspic.ts`

```typescript
// Around line 130 (CA processing)
for (const ca of graph.nodes.filter(n => n.nodeType === 'CA')) {
  const attackerE = graph.edges.find(e => e.targetId === ca.id && e.edgeType === 'conflicting');
  const attackedE = graph.edges.find(e => e.sourceId === ca.id && e.edgeType === 'conflicted');
  
  if (!attackerE || !attackedE) continue;
  
  const attackerNode = graph.nodes.find(n => n.id === attackerE.sourceId);
  const attackedNode = graph.nodes.find(n => n.id === attackedE.targetId);
  
  if (!attackerNode || !attackedNode) continue;

  // NEW: Classify attack type from CQ metadata
  const attackType = (ca as any).metaJson?.attackType || 
                     (ca as any).legacyAttackType || 
                     'REBUTS'; // default
  
  const attackerSymbol = attackerNode.nodeType === 'I'
    ? ((attackerNode as any).content ?? (attackerNode as any).text ?? attackerNode.id)
    : attackerNode.id;
    
  const attackedSymbol = attackedNode.nodeType === 'I'
    ? ((attackedNode as any).content ?? (attackedNode as any).text ?? attackedNode.id)
    : attackedNode.id;

  // NEW: Store attack with type classification
  if (attackType === 'UNDERMINES') {
    // Premise attack - add to contraries
    if (!contraries.has(attackerSymbol)) contraries.set(attackerSymbol, new Set());
    contraries.get(attackerSymbol)!.add(attackedSymbol);
  } else if (attackType === 'UNDERCUTS') {
    // Inference attack - add as exception to rule
    if (!exceptions.has(attackedSymbol)) exceptions.set(attackedSymbol, new Set());
    exceptions.get(attackedSymbol)!.add(attackerSymbol);
  } else if (attackType === 'REBUTS') {
    // Conclusion attack - add to contraries
    if (!contraries.has(attackerSymbol)) contraries.set(attackerSymbol, new Set());
    contraries.get(attackerSymbol)!.add(attackedSymbol);
  }
}
```

#### **7.2: Add Attack Type to ASPIC Theory**
**File:** `lib/aif/translation/aifToAspic.ts`

```typescript
// Update ArgumentationTheory interface
export interface ArgumentationTheory {
  language: Set<string>;
  contraries: Map<string, Set<string>>;
  strictRules: Rule[];
  defeasibleRules: Rule[];
  axioms: Set<string>;
  premises: Set<string>;
  assumptions: Set<string>;
  preferences: Array<{ preferred: string; dispreferred: string }>;
  
  // NEW: Attack classification
  attacks: Array<{
    attacker: string;
    attacked: string;
    type: 'undermining' | 'rebutting' | 'undercutting';
    cqContext?: {
      cqId: string;
      cqText: string;
      schemeKey: string;
    };
  }>;
}
```

#### **7.3: Update Export Endpoint**
**File:** `app/api/arguments/[id]/export-aspic/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { aifToASPIC } from '@/lib/aif/translation/aifToAspic';
import { prisma } from '@/lib/prismaclient';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const argumentId = params.id;

  // Fetch AIF graph for argument
  const argument = await prisma.argument.findUnique({
    where: { id: argumentId },
    include: {
      // Include all AIF relations
      conclusionClaim: true,
      premises: true,
      conflictingArguments: {
        include: {
          dialogueMove: true, // Include CQ provenance
        },
      },
    },
  });

  if (!argument) {
    return NextResponse.json({ error: 'Argument not found' }, { status: 404 });
  }

  // Convert to AIF graph format
  const aifGraph = convertToAIFGraph(argument);

  // Translate to ASPIC+
  const aspicTheory = aifToASPIC(aifGraph);

  return NextResponse.json({
    argument: {
      id: argument.id,
      text: argument.text,
    },
    aspic: aspicTheory,
    meta: {
      exportedAt: new Date().toISOString(),
      version: '1.0',
    },
  });
}
```

**Testing:**
- [ ] ASPIC+ export classifies attacks by type
- [ ] Undermining attacks mapped to premise contraries
- [ ] Undercutting attacks mapped to rule exceptions
- [ ] Rebutting attacks mapped to conclusion contraries
- [ ] CQ context included in attack metadata

---

## **Phase 8: Visualization & UX Polish**
**Duration:** 3-4 days  
**Dependencies:** All phases complete  
**Risk:** Low (polish only)

### **Goal**
Add visual indicators and tooltips to show CQ→DialogueMove→Ludics provenance

### **Tasks**

#### **8.1: Add CQ Provenance Badge to LudicAct Display**
**File:** `packages/ludics-react/ActNode.tsx`

```tsx
// Show CQ context in act tooltip
{act.extJson?.cqId && (
  <div className="mt-2 pt-2 border-t border-slate-200">
    <div className="text-xs font-semibold text-slate-700 mb-1">
      Critical Question Context
    </div>
    <div className="text-xs text-slate-600">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-medium">CQ:</span>
        <span>{act.extJson.cqText}</span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="font-medium">Type:</span>
        <span className={`px-2 py-0.5 rounded ${
          act.extJson.attackType === 'REBUTS' ? 'bg-rose-100 text-rose-700' :
          act.extJson.attackType === 'UNDERCUTS' ? 'bg-amber-100 text-amber-700' :
          'bg-slate-100 text-slate-700'
        }`}>
          {act.extJson.attackType}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium">Target:</span>
        <span>{act.extJson.targetScope}</span>
      </div>
    </div>
  </div>
)}
```

#### **8.2: Add Dialogue Trace to ArgumentCardV2**
**File:** `components/arguments/ArgumentCardV2.tsx`

Already has WHY/GROUNDS counts (lines 294-306), enhance with CQ context:

```tsx
// After line 306, add CQ context display
{whyCount > 0 && cqKeys.length > 0 && (
  <div className="mt-2 flex flex-wrap gap-1">
    {cqKeys.map((key: string) => (
      <span
        key={key}
        className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium"
        title={`Critical Question: ${key}`}
      >
        {key}
      </span>
    ))}
  </div>
)}
```

#### **8.3: Add CQ→Ludics Flow Diagram to Help Page**
**File:** `components/help/CQDialogicalFlowDocs.tsx` (NEW)

Create visual documentation showing the full pipeline:

```tsx
export function CQDialogicalFlowDocs() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">
        Critical Questions → Dialogical Moves → Ludics Pipeline
      </h2>
      
      <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
        <h3 className="text-lg font-semibold text-indigo-900 mb-4">
          How Your Objections Flow Through the System
        </h3>
        
        <div className="space-y-4">
          {/* Step 1: Asking CQ */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-900 font-bold shrink-0">
              1
            </div>
            <div>
              <div className="font-semibold text-slate-900">Ask Critical Question</div>
              <div className="text-sm text-slate-700">
                Click "Mark as asked" → Creates WHY DialogueMove with cqId in payload
              </div>
            </div>
          </div>
          
          {/* Step 2: Ludics Compilation */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-900 font-bold shrink-0">
              2
            </div>
            <div>
              <div className="font-semibold text-slate-900">Ludics Compilation</div>
              <div className="text-sm text-slate-700">
                WHY move compiles to LudicAct (Opponent polarity) with CQ metadata preserved
              </div>
            </div>
          </div>
          
          {/* Step 3: Post Objection */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-rose-200 flex items-center justify-center text-rose-900 font-bold shrink-0">
              3
            </div>
            <div>
              <div className="font-semibold text-slate-900">Post Objection</div>
              <div className="text-sm text-slate-700">
                Submit REBUT/UNDERCUT/UNDERMINE → Creates GROUNDS move + CA-node
              </div>
            </div>
          </div>
          
          {/* Step 4: AIF Sync */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-900 font-bold shrink-0">
              4
            </div>
            <div>
              <div className="font-semibold text-slate-900">AIF Integration</div>
              <div className="text-sm text-slate-700">
                LudicAct syncs to AifNode → CA-node links to DialogueMove via FK
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Data Flow Diagram */}
      <div className="p-6 bg-white rounded-xl border border-slate-200">
        <pre className="text-xs text-slate-700 font-mono overflow-x-auto">
{`CriticalQuestion (scheme.cq)
    ↓ [User: Mark as asked]
DialogueMove (kind: WHY, payload: {cqId, attackType, targetScope})
    ↓ [compileFromMoves()]
LudicAct (metadata: {cqId, attackType, targetScope, schemeKey})
    ↓ [User: Post objection]
DialogueMove (kind: GROUNDS, payload: {cqId, brief})
    ↓ [syncLudicsToAif()]
AifNode + ConflictingArgument (dialogueMoveId FK)
    ↓ [aifToAspic()]
ASPIC+ Attack (type: undermining|rebutting|undercutting)`}
        </pre>
      </div>
    </div>
  );
}
```

#### **8.4: Add Success Metrics Dashboard**
**File:** `components/admin/CQIntegrationMetrics.tsx` (NEW)

Show integration health metrics:

```tsx
export function CQIntegrationMetrics({ deliberationId }: { deliberationId: string }) {
  const { data } = useSWR(`/api/admin/cq-metrics?deliberationId=${deliberationId}`, fetcher);
  
  return (
    <div className="grid grid-cols-3 gap-4">
      <MetricCard
        title="CQ → DialogueMove Mapping"
        value={`${data?.cqsWithMoves || 0}/${data?.totalCQs || 0}`}
        percentage={(data?.cqsWithMoves / data?.totalCQs * 100) || 0}
        target={90}
      />
      
      <MetricCard
        title="DialogueMove → LudicAct Preservation"
        value={`${data?.actsWithCQMetadata || 0}/${data?.totalActs || 0}`}
        percentage={(data?.actsWithCQMetadata / data?.totalActs * 100) || 0}
        target={95}
      />
      
      <MetricCard
        title="CA → DialogueMove Linkage"
        value={`${data?.casWithMoves || 0}/${data?.totalCAs || 0}`}
        percentage={(data?.casWithMoves / data?.totalCAs * 100) || 0}
        target={85}
      />
    </div>
  );
}
```

**Testing:**
- [ ] LudicAct tooltips show CQ context
- [ ] ArgumentCardV2 shows CQ keys
- [ ] Help page documents flow
- [ ] Metrics dashboard shows integration health

---

## **Phase 9: Testing & Validation** (Continuous)
**Duration:** Throughout all phases  
**Risk:** Critical (catch regressions)

### **Tasks**

#### **9.1: Unit Tests**

**File:** `__tests__/lib/dialogue/cqMoveHelpers.test.ts` (NEW)

```typescript
import { createCQWhyMove, createCQGroundsMove, getCQDetails } from '@/lib/dialogue/cqMoveHelpers';
import { prisma } from '@/lib/prismaclient';

describe('CQ DialogueMove Helpers', () => {
  it('creates WHY move with CQ metadata', async () => {
    const move = await createCQWhyMove({
      deliberationId: 'test-delib',
      targetType: 'claim',
      targetId: 'test-claim',
      authorId: 'test-user',
      cqPayload: {
        cqId: 'test-cq-1',
        cqText: 'Is the evidence reliable?',
        attackType: 'UNDERMINES',
        targetScope: 'premise',
        schemeKey: 'expert_opinion',
      },
    });

    expect(move.kind).toBe('WHY');
    expect(move.payload.cqId).toBe('test-cq-1');
    expect(move.payload.attackType).toBe('UNDERMINES');
  });

  it('prevents duplicate WHY moves', async () => {
    // Create first WHY
    await createCQWhyMove({ /* ... */ });
    
    // Attempt duplicate
    const duplicate = await createCQWhyMove({ /* same params */ });
    
    // Should return existing move
    expect(duplicate).toBeDefined();
  });

  it('creates GROUNDS move linked to WHY', async () => {
    // Create WHY first
    await createCQWhyMove({ /* ... */ });
    
    // Create GROUNDS
    const grounds = await createCQGroundsMove({
      // ... same cqId
      groundsText: 'The expert has 20 years of experience',
    });

    expect(grounds.kind).toBe('GROUNDS');
    expect(grounds.payload.cqId).toBe('test-cq-1');
    expect(grounds.payload.brief).toContain('20 years');
  });
});
```

#### **9.2: Integration Tests**

**File:** `__tests__/integration/cq-dialogue-flow.test.ts` (NEW)

```typescript
describe('CQ → Dialogue → Ludics Flow', () => {
  it('completes full pipeline: CQ → WHY → GROUNDS → LudicAct → AifNode', async () => {
    // 1. Create WHY via CQ API
    await fetch('/api/cqs', {
      method: 'POST',
      body: JSON.stringify({
        targetType: 'claim',
        targetId: 'test-claim',
        cqKey: 'test-cq',
        satisfied: false, // Ask WHY
      }),
    });

    // 2. Verify DialogueMove created
    const move = await prisma.dialogueMove.findFirst({
      where: { payload: { path: ['cqId'], equals: 'test-cq' } },
    });
    expect(move).toBeDefined();
    expect(move?.kind).toBe('WHY');

    // 3. Trigger ludics compilation
    await compileFromMoves('test-delib');

    // 4. Verify LudicAct has CQ metadata
    const act = await prisma.ludicAct.findFirst({
      where: { extJson: { path: ['cqId'], equals: 'test-cq' } },
    });
    expect(act).toBeDefined();
    expect(act?.extJson?.attackType).toBe('UNDERMINES');

    // 5. Provide GROUNDS
    await fetch('/api/cqs', {
      method: 'POST',
      body: JSON.stringify({
        targetType: 'claim',
        targetId: 'test-claim',
        cqKey: 'test-cq',
        satisfied: true,
        groundsText: 'Test grounds',
      }),
    });

    // 6. Verify GROUNDS move created
    const groundsMove = await prisma.dialogueMove.findFirst({
      where: {
        kind: 'GROUNDS',
        payload: { path: ['cqId'], equals: 'test-cq' },
      },
    });
    expect(groundsMove).toBeDefined();

    // 7. Verify AifNode sync
    await syncLudicsToAif('test-delib');
    const aifNode = await prisma.aifNode.findFirst({
      where: { extJson: { path: ['cqContext', 'cqId'], equals: 'test-cq' } },
    });
    expect(aifNode).toBeDefined();
  });
});
```

#### **9.3: E2E Tests**

**File:** `e2e/cq-dialogue-integration.spec.ts` (NEW)

```typescript
import { test, expect } from '@playwright/test';

test('User can ask CQ, see WHY move, provide GROUNDS', async ({ page }) => {
  await page.goto('/deliberation/test-delib-123');

  // 1. Open CriticalQuestionsV3
  await page.click('[data-testid="open-cq-modal"]');

  // 2. Mark CQ as asked
  await page.click('[data-testid="cq-mark-asked-test-cq-1"]');

  // 3. Verify WHY badge appears
  await expect(page.locator('[data-testid="cq-why-badge"]')).toContainText('1 WHY');

  // 4. Provide grounds
  await page.fill('[data-testid="cq-grounds-input"]', 'Test grounds text');
  await page.click('[data-testid="cq-submit-grounds"]');

  // 5. Verify GROUNDS badge appears
  await expect(page.locator('[data-testid="cq-grounds-badge"]')).toContainText('1 GROUNDS');

  // 6. Open ludics panel
  await page.click('[data-testid="tab-ludics"]');

  // 7. Verify LudicAct shows CQ context
  await page.hover('[data-testid="ludic-act-0-1"]');
  await expect(page.locator('[data-testid="act-tooltip"]')).toContainText('test-cq-1');
});
```

#### **9.4: Metrics Collection**

**File:** `app/api/admin/cq-metrics/route.ts` (NEW)

```typescript
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deliberationId = searchParams.get('deliberationId');

  if (!deliberationId) {
    return NextResponse.json({ error: 'Missing deliberationId' }, { status: 400 });
  }

  // Count CQs with associated DialogueMoves
  const totalCQs = await prisma.cqStatus.count({
    where: { deliberationId },
  });

  const cqsWithMoves = await prisma.cqStatus.count({
    where: {
      deliberationId,
      id: {
        in: (await prisma.dialogueMove.findMany({
          where: {
            deliberationId,
            payload: { path: ['cqId'], not: null },
          },
          select: { id: true },
        })).map(m => m.id),
      },
    },
  });

  // Count LudicActs with CQ metadata
  const totalActs = await prisma.ludicAct.count({
    where: { design: { deliberationId } },
  });

  const actsWithCQMetadata = await prisma.ludicAct.count({
    where: {
      design: { deliberationId },
      extJson: { path: ['cqId'], not: null },
    },
  });

  // Count CAs with DialogueMove links
  const totalCAs = await prisma.conflictingArgument.count({
    where: { deliberationId },
  });

  const casWithMoves = await prisma.conflictingArgument.count({
    where: {
      deliberationId,
      dialogueMoveId: { not: null },
    },
  });

  return NextResponse.json({
    totalCQs,
    cqsWithMoves,
    totalActs,
    actsWithCQMetadata,
    totalCAs,
    casWithMoves,
    percentages: {
      cqMapping: (cqsWithMoves / totalCQs) * 100,
      ludicPreservation: (actsWithCQMetadata / totalActs) * 100,
      caLinkage: (casWithMoves / totalCAs) * 100,
    },
  });
}
```

**Testing Checklist:**
- [ ] Unit tests pass (cqMoveHelpers)
- [ ] Integration tests pass (full flow)
- [ ] E2E tests pass (user interaction)
- [ ] Metrics show >90% integration rates
- [ ] No regressions in existing functionality

---

## **Implementation Schedule**

### **Week 1: Foundation**
- **Days 1-2:** Phase 1 (Database Schema)
- **Days 3-5:** Phase 2 (API Layer)

### **Week 2: Core Integration**
- **Days 1-4:** Phase 3 (Ludics Compilation)
- **Day 5:** Phase 2/3 testing & fixes

### **Week 3: UI Updates**
- **Days 1-2:** Phase 4 (CriticalQuestionsV3)
- **Days 3-5:** Phase 5 (SchemeSpecificCQsModal)

### **Week 4: Polish & Deprecation**
- **Days 1-2:** Phase 6 (AttackMenuProV2)
- **Days 3-4:** Phase 7 (ASPIC+ Enhancement)
- **Day 5:** Phase 8 (Visualization)

### **Weeks 5-6: Testing & Stabilization**
- **Week 5:** Comprehensive testing, bug fixes
- **Week 6:** Performance optimization, documentation

---

## **Success Metrics**

### **Technical Metrics**
- ✅ **100%** of CQ asks create DialogueMove with cqId
- ✅ **100%** of CQ answers create GROUNDS DialogueMove
- ✅ **>95%** of LudicActs preserve CQ metadata
- ✅ **>90%** of CA-nodes link to DialogueMoves
- ✅ **<50ms** latency increase per move creation
- ✅ **0** data loss during migration

### **User Experience Metrics**
- ✅ Users can trace CQ → WHY → GROUNDS → Attack flow
- ✅ Ludics visualization shows CQ context
- ✅ ASPIC+ export correctly classifies attack types
- ✅ No breaking changes to existing workflows

### **Code Quality Metrics**
- ✅ **>80%** test coverage on new code
- ✅ **0** circular dependencies introduced
- ✅ **<5** seconds build time increase
- ✅ All TypeScript errors resolved

---

## **Risk Mitigation**

### **Risk 1: Data Integrity During Migration**
**Mitigation:**
- Use nullable FKs (no breaking changes)
- Run migration on staging first
- Keep old CQ toggle API working alongside new DialogueMove creation
- Add rollback scripts

### **Risk 2: Performance Degradation**
**Mitigation:**
- Batch DialogueMove creation
- Index dialogueMoveId columns
- Cache CQ metadata lookups
- Profile ludics compilation with CQ metadata

### **Risk 3: User Confusion**
**Mitigation:**
- Add help documentation (Phase 8)
- Show deprecation warnings (Phase 6)
- Provide migration guides
- Keep old AttackMenuProV2 working temporarily

### **Risk 4: Circular Dependencies**
**Mitigation:**
- Keep helper functions in `lib/dialogue/cqMoveHelpers.ts`
- Avoid importing UI components in API routes
- Use event system for loose coupling
- Review import graph before each phase

---

## **Rollback Plan**

If critical issues arise, rollback in reverse order:

1. **Phase 8-7:** Remove visualizations (no data impact)
2. **Phase 6:** Re-enable AttackMenuProV2 without warnings
3. **Phase 5:** Revert SchemeSpecificCQsModal to direct CA creation
4. **Phase 4:** Revert CriticalQuestionsV3 to `/api/cqs` only
5. **Phase 3:** Keep existing ludics compilation (ignore new metadata)
6. **Phase 2:** Remove DialogueMove creation from CQ APIs
7. **Phase 1:** Drop FK columns (data preserved in metaJson)

**Rollback Script:**
```sql
-- Emergency rollback (drops new FKs but preserves data)
ALTER TABLE "ConflictingArgument" DROP COLUMN IF EXISTS "dialogueMoveId";
-- CQ metadata still in DialogueMove.payload and CA.metaJson
```

---

## **Dependencies & Prerequisites**

### **Before Starting**
- [ ] Review and approve roadmap
- [ ] Set up staging environment
- [ ] Create feature branch: `feat/cq-dialogical-ludics-integration`
- [ ] Notify team of upcoming changes
- [ ] Back up production database

### **Required Knowledge**
- Prisma schema management
- DialogueMove system
- Ludics compilation pipeline
- React component lifecycle
- AIF graph structure

### **Tools Needed**
- Prisma Studio (database inspection)
- Playwright (E2E testing)
- Jest (unit/integration tests)
- Git (version control)

---

## **Post-Implementation**

### **Documentation Updates**
- [ ] Update `AGENTS.md` with new CQ→Dialogue flow
- [ ] Update API documentation for `/api/cqs`
- [ ] Add architectural diagram to `ARCHITECTURE_REVIEW_ALIGNMENT.md`
- [ ] Create user guide for CQ system

### **Monitoring**
- [ ] Set up metrics dashboard
- [ ] Monitor DialogueMove creation rate
- [ ] Track ludics compilation times
- [ ] Watch for foreign key constraint errors

### **Future Enhancements**
- Phase 10: Extend to preferences (PA-nodes with CQ context)
- Phase 11: Multi-locus CQ support (nested scopes)
- Phase 12: CQ inheritance visualization
- Phase 13: Auto-suggest CQs based on scheme detection

---

## **Conclusion**

This roadmap transforms fragmented CQ/attack systems into a unified, formally-grounded argumentation pipeline. Upon completion:

1. **Every CQ action has formal provenance** (DialogueMove with full context)
2. **Ludics layer preserves argumentative semantics** (attack types flow through)
3. **ASPIC+ export is compliant** (proper attack classification)
4. **Users can trace argumentation lineage** (CQ → WHY → GROUNDS → Attack)

**Estimated Effort:** 4-6 weeks (1 developer)  
**Priority:** CRITICAL (blocks advanced ludics features)  
**Complexity:** HIGH (touches 3 major systems)  
**Value:** TRANSFORMATIVE (enables formal argumentation AI)

---

**Ready to begin?** Start with Phase 1 (Database Schema) and proceed incrementally, testing each phase before moving forward.
