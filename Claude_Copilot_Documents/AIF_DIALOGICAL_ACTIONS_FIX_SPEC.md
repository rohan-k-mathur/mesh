# AIF Dialogical Actions - Fix Specification Document

**Version**: 1.0
**Date**: 2025-10-21
**Status**: Draft - Ready for Implementation
**Session ID**: `claude/debug-aif-arguments-011CUKYh7mJ3H5QUXgvvp4sD`

---

## Executive Summary

This document specifies fixes required to complete the end-to-end wiring of the AIF (Argument Interchange Format) arguments system with the dialogical protocol (WHY/GROUNDS/CONCEDE/etc). The core infrastructure exists but integration points are incomplete or buggy.

**Impact**: 7 issues identified, ranging from critical bugs to functionality gaps
**Scope**: 6 files require changes, 4 new integration points needed
**Timeline Estimate**: 3-4 hours for all fixes + 1 hour testing
**Risk**: Low - mostly additive changes, minimal refactoring

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Issue Registry](#issue-registry)
3. [Fix Specifications](#fix-specifications)
4. [Implementation Order](#implementation-order)
5. [Testing Criteria](#testing-criteria)
6. [Migration Notes](#migration-notes)

---

## System Architecture Overview

### Components Involved

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE LAYER                     │
├─────────────────────────────────────────────────────────────┤
│  AIFArgumentsListPro     │  CriticalQuestions              │
│  ├─ AttackMenuPro        │  ├─ WHY/GROUNDS buttons         │
│  ├─ LegalMoveToolbar     │  └─ Inline grounds input        │
│  └─ CommandCard (unused) │                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                               │
├─────────────────────────────────────────────────────────────┤
│  /api/dialogue/move       │  /api/ca (conflict assertions)  │
│  /api/dialogue/legal-moves│  /api/arguments/{id}/aif        │
│  /api/cqs/toggle          │  /api/arguments/{id}/assumptions│
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                     │
├─────────────────────────────────────────────────────────────┤
│  computeLegalMoves        │  validateMove                   │
│  criticalQuestions.ts     │  cqSuggestions.ts              │
│  legalMovesServer.ts      │  afEngine.ts                    │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  Argument                 │  ConflictAssertion              │
│  CQStatus                 │  DialogueMove                   │
│  Claim                    │  ArgumentAssumption             │
└─────────────────────────────────────────────────────────────┘
```

### Current State

**✅ Working**:
- Legal moves computation (R1-R7 rules)
- Move validation and posting
- AIF metadata display
- Attack creation (with bugs)
- CQ display and toggle

**❌ Broken**:
- CommandCard not integrated
- CQ key handling inconsistent
- Attacks don't record CQ context
- Missing loading states
- Duplicate POST bug in undercuts
- Arguments lack default schemes
- GROUNDS don't create AIF nodes

---

## Issue Registry

| ID | Severity | Component | Type | Blockers |
|----|----------|-----------|------|----------|
| **#1** | Medium | CommandCard | Integration Gap | None |
| **#2** | High | CQ Handling | Data Integrity | None |
| **#3** | High | Attack→CQ Link | Integration Gap | #2 |
| **#4** | Critical | AttackMenuPro | Bug | None |
| **#5** | Medium | Argument Creation | Data Integrity | None |
| **#6** | Medium | GROUNDS Processing | Feature Gap | None |
| **#7** | Low | UI/UX | Polish | None |

---

## Fix Specifications

### FIX #4: Remove Duplicate Exception POST ⚠️ **CRITICAL**

**File**: `components/arguments/AttackMenuPro.tsx`
**Lines**: 244-252
**Severity**: Critical - Causes POST failures
**Effort**: 5 minutes

#### Problem

When creating an UNDERCUT attack, the code calls `postAssumption()` helper (lines 235-241) which POSTs to `/api/arguments/{id}/assumptions`. Then it immediately makes a **second identical POST** (lines 244-252) causing duplicate attempts.

```typescript
// ✅ Correct - line 235-241
await postAssumption(
  target.id,
  exceptionClaimId,
  'exception',
  { schemeKey, descriptorKey: 'exception' },
  ctrl.signal
);

// ❌ DUPLICATE - lines 244-252
await fetch(`/api/arguments/${encodeURIComponent(target.id)}/assumptions`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    deliberationId,
    items: [{ assumptionId: exceptionClaimId, role: 'exception', ... }]
  }),
});
```

#### Solution

**Delete lines 244-252** entirely. The `postAssumption` helper already handles this.

#### Code Changes

```diff
--- a/components/arguments/AttackMenuPro.tsx
+++ b/components/arguments/AttackMenuPro.tsx
@@ -238,17 +238,6 @@ function AttackMenuContent({
     { schemeKey, descriptorKey: 'exception' },
     ctrl.signal
   );
-
-  // NEW: bind exception to the attacked RA via AssumptionUse
-  await fetch(`/api/arguments/${encodeURIComponent(target.id)}/assumptions`, {
-    method: 'POST',
-    headers: { 'content-type': 'application/json' },
-    body: JSON.stringify({
-      deliberationId,
-      items: [{ assumptionId: exceptionClaimId, role: 'exception', metaJson: { schemeKey: null } }]
-    }),
-    signal: ctrl.signal
-  });
 } else {
         if (!premiseId || !undermine) return;
         await postCA({
```

#### Testing

1. Create an UNDERCUT attack
2. Check browser network tab - should see **one** POST to `/api/arguments/{id}/assumptions`, not two
3. Verify exception appears in argument's assumptions list
4. Check database `ArgumentAssumption` table for duplicates (should be none)

#### Risk Assessment

**Risk Level**: Low
**Reason**: Simple deletion, no behavioral dependencies
**Rollback**: Restore deleted lines if assumptions aren't being created

---

### FIX #2: Standardize CQ Key Handling 🔑 **HIGH PRIORITY**

**Files**:
- `app/api/dialogue/legal-moves/route.ts:71`
- `app/api/dialogue/move/route.ts:35,71-82`
- `lib/dialogue/legalMovesServer.ts:26`

**Severity**: High - Data integrity issue
**Effort**: 20 minutes

#### Problem

Three different key extraction patterns create ambiguity:

```typescript
// Pattern 1: CriticalQuestions.tsx ✅ Correct
payload: { locusPath: locus, schemeKey: s.key, cqId: cq.key }

// Pattern 2: legal-moves/route.ts ⚠️ Problematic fallback
const key = String(r?.payload?.cqId ?? r?.payload?.schemeKey ?? 'default');

// Pattern 3: move/route.ts ⚠️ Another fallback
function cqKey(p: any) { return String(p?.cqId ?? p?.schemeKey ?? 'default'); }
```

**Impact**:
- WHY without explicit `cqId` creates **scheme-level** questions
- GROUNDS responses may mismatch the WHY they're answering
- CQStatus table gets polluted with scheme names instead of CQ keys

#### Solution

**Require `cqId` always**, fail gracefully if missing.

#### Code Changes

**File 1**: `app/api/dialogue/legal-moves/route.ts`

```diff
--- a/app/api/dialogue/legal-moves/route.ts
+++ b/app/api/dialogue/legal-moves/route.ts
@@ -68,7 +68,10 @@
   type Row = { kind:'WHY'|'GROUNDS'; payload:any; createdAt:Date };
   const latestByKey = new Map<string, Row>();
   for (const r of rows as Row[]) {
-    const key = String(r?.payload?.cqId ?? r?.payload?.schemeKey ?? 'default');
+    const key = r?.payload?.cqId;
+    if (!key) {
+      console.warn('[legal-moves] Move missing cqId:', r);
+      continue; // skip malformed moves
+    }
     const prev = latestByKey.get(key);
     if (!prev || r.createdAt > prev.createdAt) latestByKey.set(key, r);
   }
```

**File 2**: `app/api/dialogue/move/route.ts`

```diff
--- a/app/api/dialogue/move/route.ts
+++ b/app/api/dialogue/move/route.ts
@@ -32,7 +32,13 @@
  });


-function cqKey(p: any) { return String(p?.cqId ?? p?.schemeKey ?? 'default'); }
+function cqKey(p: any) {
+  const key = p?.cqId;
+  if (!key) {
+    console.warn('[dialogue/move] Payload missing cqId, using fallback:', p);
+    return p?.schemeKey ?? 'unknown';
+  }
+  return String(key);
+}
 function hashExpr(s?: string) { if (!s) return '∅'; let h=0; for (let i=0;i<s.length;i++) h=((h<<5)-h)+s.charCodeAt(i)|0; return String(h); }
```

**File 3**: `lib/dialogue/legalMovesServer.ts`

```diff
--- a/lib/dialogue/legalMovesServer.ts
+++ b/lib/dialogue/legalMovesServer.ts
@@ -23,7 +23,13 @@
   actorId?: string | null;
 };

-function cqKey(p: any) { return String(p?.cqId ?? p?.schemeKey ?? 'default'); }
+function cqKey(p: any) {
+  const key = p?.cqId;
+  if (!key) {
+    console.warn('[legalMovesServer] Payload missing cqId:', p);
+    return p?.schemeKey ?? 'unknown';
+  }
+  return String(key);
+}
 function exprOf(p: any) { return String(p?.expression ?? p?.brief ?? p?.note ?? '').trim(); }
```

#### Validation

Add validation in `/api/dialogue/move` POST handler:

```diff
--- a/app/api/dialogue/move/route.ts
+++ b/app/api/dialogue/move/route.ts
@@ -115,6 +115,13 @@
   }
   if (kind === 'GROUNDS' && !payload.locusPath) payload.locusPath = '0';

+  // Validate cqId for WHY/GROUNDS
+  if ((kind === 'WHY' || kind === 'GROUNDS') && !payload.cqId) {
+    return NextResponse.json({
+      error: 'cqId required for WHY/GROUNDS moves',
+      received: payload
+    }, { status: 400 });
+  }

   const actorId = String(userId ?? 'unknown');
```

#### Migration

For existing WHY/GROUNDS moves with `schemeKey` instead of `cqId`:

```sql
-- Find affected records
SELECT id, kind, payload->>'schemeKey' as scheme, payload->>'cqId' as cqId
FROM "DialogueMove"
WHERE kind IN ('WHY', 'GROUNDS')
  AND payload->>'cqId' IS NULL
  AND payload->>'schemeKey' IS NOT NULL;

-- Optional: backfill if needed
-- UPDATE "DialogueMove"
-- SET payload = jsonb_set(payload, '{cqId}', payload->'schemeKey')
-- WHERE kind IN ('WHY', 'GROUNDS') AND payload->>'cqId' IS NULL;
```

#### Testing

1. Try posting WHY without `cqId` → should get 400 error
2. Post WHY with `cqId: 'eo-1'` → should succeed
3. Verify CQStatus row uses `cqKey: 'eo-1'` not `schemeKey`
4. Check legal-moves API filters correctly by specific CQ

---

### FIX #3: Link Attacks to Critical Questions 🔗 **HIGH PRIORITY**

**Files**:
- `components/arguments/AIFArgumentsListPro.tsx:651-778` (CQ inline objection handlers)
- `components/claims/CriticalQuestions.tsx:509-528` (attachWithAttacker)
- `app/api/ca/route.ts` (needs schema extension - TBD)

**Severity**: High - Core feature incomplete
**Effort**: 45 minutes

#### Problem

When a user creates an attack (REBUTS/UNDERCUTS/UNDERMINES) from a CQ panel, the attack is posted to `/api/ca` but **doesn't record which CQ it addresses**. This breaks the flow:

1. User sees CQ "Is the expert credible?"
2. User clicks "Attach" → creates REBUTS attack
3. Attack is created BUT CQ checkbox stays disabled
4. User manually marks CQ satisfied (duplicate work)

**Root Cause**: `ConflictAssertion` table doesn't store CQ context.

#### Solution

**Option A** (Recommended): Use metadata field
**Option B**: Create junction table `CQAttachment`

Let's use Option A for simplicity.

#### Schema Change

Extend `ConflictAssertion` with optional metadata:

```prisma
model ConflictAssertion {
  // ... existing fields ...

  // NEW: Track which CQ this attack addresses
  metaJson Json? @default("{}") // { schemeKey, cqKey, source: 'cq-panel' }
}
```

Migration:

```sql
ALTER TABLE "ConflictAssertion" ADD COLUMN "metaJson" JSONB DEFAULT '{}';
```

#### Code Changes

**File 1**: `components/arguments/AIFArgumentsListPro.tsx`

Update the inline CQ objection handlers to pass CQ context:

```diff
--- a/components/arguments/AIFArgumentsListPro.tsx
+++ b/components/arguments/AIFArgumentsListPro.tsx
@@ -682,11 +682,15 @@
                           onClick={async () => {
                             await fetch('/api/ca', {
                               method: 'POST',
                               headers: { 'content-type': 'application/json' },
                               body: JSON.stringify({
                                 deliberationId,
                                 conflictingClaimId: obClaim!.id,
                                 conflictedClaimId: meta?.conclusion?.id ?? '',
                                 legacyAttackType: 'REBUTS',
                                 legacyTargetScope: 'conclusion',
+                                metaJson: {
+                                  schemeKey: meta?.scheme?.key,
+                                  cqKey: c.cqKey,
+                                  source: 'cq-inline-objection'
+                                }
                               }),
                             });
```

Repeat for UNDERCUTS (line 721) and UNDERMINES (line 760).

**File 2**: `components/claims/CriticalQuestions.tsx`

Update `attachWithAttacker` function:

```diff
--- a/components/claims/CriticalQuestions.tsx
+++ b/components/claims/CriticalQuestions.tsx
@@ -486,13 +486,13 @@
       await fetch("/api/cqs/toggle", {
         method: "POST",
         headers: { "content-type": "application/json" },
         body: JSON.stringify({
           targetType,
           targetId,
           schemeKey,
           cqKey,
           satisfied: false,
           attachSuggestion: true,
           attackerClaimId,
-          suggestion,
+          suggestion, // already contains type/scope
           deliberationId,
         }),
```

**File 3**: `app/api/cqs/toggle/route.ts` (hypothetical - verify exists)

When `attachSuggestion: true`, create the ConflictAssertion with metadata:

```typescript
if (body.attachSuggestion && body.attackerClaimId) {
  const suggestion = body.suggestion;

  await prisma.conflictAssertion.create({
    data: {
      deliberationId: body.deliberationId,
      conflictingClaimId: body.attackerClaimId,
      conflictedClaimId: body.targetId, // or argumentId depending on suggestion.type
      legacyAttackType: suggestion?.type === 'rebut' ? 'REBUTS' : 'UNDERCUTS',
      legacyTargetScope: suggestion?.scope ?? 'conclusion',
      metaJson: {
        schemeKey: body.schemeKey,
        cqKey: body.cqKey,
        source: 'cq-toggle-attach',
        suggestion: suggestion
      }
    }
  });
}
```

**File 4**: Update attachment check logic

In `app/api/cqs/attachments/route.ts` (or wherever `attachData.attached` is computed):

```typescript
// Fetch attacks that address this CQ
const attacks = await prisma.conflictAssertion.findMany({
  where: {
    deliberationId,
    OR: [
      { conflictedClaimId: targetId },
      { conflictedArgumentId: targetId } // if targeting argument
    ]
  },
  select: { metaJson: true }
});

const attached: Record<string, boolean> = {};

for (const ca of attacks) {
  const meta = ca.metaJson as any;
  if (meta?.schemeKey && meta?.cqKey) {
    const sig = `${meta.schemeKey}:${meta.cqKey}`;
    attached[sig] = true;
  }
}

// Fallback: any attack at all
if (attacks.length > 0) {
  attached['__ANY__'] = true;
}

return { attached };
```

#### Testing

1. Open CQ panel for an argument with scheme ExpertOpinion
2. Click "Attach" on CQ `eo-1` ("Is expert credible?")
3. Create a counter-claim via quick-compose
4. Verify POST to `/api/ca` includes `metaJson: { schemeKey: 'ExpertOpinion', cqKey: 'eo-1' }`
5. Refresh CQ panel
6. CQ checkbox should now be **enabled** (because `attachData.attached['ExpertOpinion:eo-1'] === true`)
7. Mark CQ satisfied → should succeed immediately

---

### FIX #7: Add Loading States for Metadata Refresh 🔄 **LOW PRIORITY**

**File**: `components/arguments/AIFArgumentsListPro.tsx`
**Severity**: Low - UX polish
**Effort**: 15 minutes

#### Problem

After posting an attack via AttackMenuPro, the parent calls `onRefreshRow(a.id)` which fetches fresh AIF metadata asynchronously. During the fetch, the UI shows stale data with no loading indicator.

#### Solution

Add per-row loading state.

#### Code Changes

```diff
--- a/components/arguments/AIFArgumentsListPro.tsx
+++ b/components/arguments/AIFArgumentsListPro.tsx
@@ -903,6 +903,7 @@
   // AIF metadata map
   const [aifMap, setAifMap] = React.useState<Record<string, AifMeta>>({});
+  const [refreshing, setRefreshing] = React.useState<Set<string>>(new Set());
   const aifMapRef = React.useRef(aifMap);
   React.useEffect(() => { aifMapRef.current = aifMap; }, [aifMap]);

@@ -908,7 +909,9 @@
   const refreshAifForId = React.useCallback(async (id: string) => {
     try {
+      setRefreshing(prev => new Set(prev).add(id));
       const one = await fetch(`/api/arguments/${id}/aif`).then(r => (r.ok ? r.json() : null));
       if (one?.aif) {
         setAifMap(prev => ({
@@ -923,6 +926,8 @@
         }));
       }
     } catch {/* ignore */ }
+    finally {
+      setRefreshing(prev => { const n = new Set(prev); n.delete(id); return n; });
+    }
   }, []);
```

Then in the Row component, display a loading overlay:

```diff
--- a/components/arguments/AIFArgumentsListPro.tsx
+++ b/components/arguments/AIFArgumentsListPro.tsx
@@ -1200,6 +1200,7 @@
           increaseViewportBy={{ top: 200, bottom: 400 }}
           itemContent={(index, a) => {
             const meta = a.aif || aifMap[a.id];
+            const isRefreshing = refreshing.has(a.id);
             const cid = meta?.conclusion?.id;
             const sRec = cid ? byClaimScore.get(cid) : undefined;
             const isVisible = index >= visibleRange.startIndex - 2 && index <= visibleRange.endIndex + 2;

             return (
               <div className='px-2'>
+                {isRefreshing && (
+                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
+                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
+                  </div>
+                )}
                 <hr className='border-slate-300 h-1 my-3' />
               <Row
```

#### Testing

1. Click "Counter" on an argument
2. Create a REBUTS attack
3. Observe spinner overlay while metadata refreshes (~200ms)
4. Verify updated counts appear after refresh completes

---

### FIX #1: Wire CommandCard to Legal Moves 🎮 **MEDIUM PRIORITY**

**Files**:
- New file: `lib/dialogue/movesToActions.ts` (converter)
- `components/dialogue/LegalMoveToolbar.tsx` (optional integration)

**Severity**: Medium - Feature unused
**Effort**: 60 minutes

#### Problem

CommandCard component exists with polished 3×3 grid UI but is never instantiated. It expects `CommandCardAction[]` but legal-moves API returns `Move[]`.

#### Solution

Create adapter function to convert `Move[]` → `CommandCardAction[]`.

#### Code Changes

**File 1**: Create `lib/dialogue/movesToActions.ts`

```typescript
// lib/dialogue/movesToActions.ts
import type { CommandCardAction, TargetRef, Move } from '@/components/dialogue/command-card/types';

export function movesToActions(
  moves: Move[],
  targetRef: TargetRef
): CommandCardAction[] {
  const actions: CommandCardAction[] = [];

  // Top row: WHY, GROUNDS, CLOSE
  const why = moves.find(m => m.kind === 'WHY');
  if (why) {
    actions.push({
      id: 'why',
      kind: 'WHY',
      label: why.label || 'WHY',
      force: 'ATTACK',
      disabled: why.disabled,
      reason: why.reason,
      group: 'top',
      move: {
        kind: 'WHY',
        payload: why.payload
      },
      target: targetRef
    });
  }

  const grounds = moves.filter(m => m.kind === 'GROUNDS');
  grounds.forEach((g, i) => {
    actions.push({
      id: `grounds-${i}`,
      kind: 'GROUNDS',
      label: g.label || 'GROUNDS',
      force: 'ATTACK',
      disabled: g.disabled,
      reason: g.reason,
      group: 'top',
      move: {
        kind: 'GROUNDS',
        payload: g.payload
      },
      target: targetRef
    });
  });

  const close = moves.find(m => m.kind === 'CLOSE');
  if (close) {
    actions.push({
      id: 'close',
      kind: 'CLOSE',
      label: close.label || 'Close (†)',
      force: 'SURRENDER',
      disabled: close.disabled,
      reason: close.reason,
      group: 'top',
      tone: 'primary',
      move: {
        kind: 'CLOSE',
        payload: close.payload
      },
      target: targetRef
    });
  }

  // Mid row: CONCEDE, RETRACT, ACCEPT_ARGUMENT
  const concede = moves.find(m => m.kind === 'CONCEDE');
  if (concede) {
    actions.push({
      id: 'concede',
      kind: 'CONCEDE',
      label: concede.label || 'Concede',
      force: 'SURRENDER',
      disabled: concede.disabled,
      reason: concede.reason,
      group: 'mid',
      move: {
        kind: 'CONCEDE',
        payload: concede.payload
      },
      target: targetRef
    });
  }

  const retract = moves.find(m => m.kind === 'RETRACT');
  if (retract) {
    actions.push({
      id: 'retract',
      kind: 'RETRACT',
      label: retract.label || 'Retract',
      force: 'SURRENDER',
      disabled: retract.disabled,
      reason: retract.reason,
      group: 'mid',
      move: {
        kind: 'RETRACT',
        payload: retract.payload
      },
      target: targetRef
    });
  }

  const acceptArg = moves.find(m => m.label?.includes('Accept argument'));
  if (acceptArg) {
    actions.push({
      id: 'accept-argument',
      kind: 'ACCEPT_ARGUMENT',
      label: 'Accept Arg',
      force: 'SURRENDER',
      disabled: acceptArg.disabled,
      reason: acceptArg.reason,
      group: 'mid',
      tone: 'primary',
      move: {
        kind: acceptArg.kind as any,
        payload: acceptArg.payload,
        postAs: acceptArg.postAs
      },
      target: targetRef
    });
  }

  // Bottom row: Scaffolds (client-side templates)
  // These are inferred from WHY label hints
  if (why?.label.includes('∀')) {
    actions.push({
      id: 'forall-inst',
      kind: 'FORALL_INSTANTIATE',
      label: '∀‑inst',
      force: 'NEUTRAL',
      group: 'bottom',
      scaffold: {
        template: 'Consider the specific case of [INSTANCE]...',
        analyticsName: 'scaffold:forall'
      },
      target: targetRef
    });
  }

  if (why?.label.includes('∃')) {
    actions.push({
      id: 'exists-witness',
      kind: 'EXISTS_WITNESS',
      label: '∃‑witness',
      force: 'NEUTRAL',
      group: 'bottom',
      scaffold: {
        template: 'A counterexample is [WITNESS]...',
        analyticsName: 'scaffold:exists'
      },
      target: targetRef
    });
  }

  if (why?.label.toLowerCase().includes('presupposition')) {
    actions.push({
      id: 'presup-challenge',
      kind: 'PRESUP_CHALLENGE',
      label: 'Presup?',
      force: 'NEUTRAL',
      group: 'bottom',
      scaffold: {
        template: 'The presupposition that [P] is questionable because...',
        analyticsName: 'scaffold:presupposition'
      },
      target: targetRef
    });
  }

  return actions;
}
```

**File 2**: Integrate into existing toolbar (optional)

```diff
--- a/components/dialogue/LegalMoveToolbar.tsx
+++ b/components/dialogue/LegalMoveToolbar.tsx
@@ -2,6 +2,8 @@
 import * as React from "react";
 import useSWR from "swr";
 import { NLCommitPopover } from "@/components/dialogue/NLCommitPopover";
+import { CommandCard, performCommand } from "@/components/dialogue/command-card/CommandCard";
+import { movesToActions } from "@/lib/dialogue/movesToActions";

 type Force = "ATTACK" | "SURRENDER" | "NEUTRAL";
 type MoveKind = "ASSERT" | "WHY" | "GROUNDS" | "RETRACT" | "CONCEDE" | "CLOSE";
@@ -30,6 +32,7 @@
   const qs = new URLSearchParams({ deliberationId, targetType, targetId, locusPath }).toString();
   const { data, mutate } = useSWR<{ ok: boolean; moves: Move[] }>(`/api/dialogue/legal-moves?${qs}`, fetcher, { revalidateOnFocus: false });
+  const [useCommandCard, setUseCommandCard] = React.useState(false);

   const moves = (data?.moves ?? []).filter(Boolean);
   const attacks   = moves.filter(m => m.force === "ATTACK"   && !m.disabled);
@@ -120,6 +123,26 @@
   return (
     <div className="rounded-md border border-slate-200 bg-white/60 p-2 space-y-2">
       <div className="flex items-center justify-between gap-2">
+        <button
+          className="text-[11px] px-2 py-1 rounded border"
+          onClick={() => setUseCommandCard(!useCommandCard)}
+        >
+          {useCommandCard ? 'List View' : 'Grid View'}
+        </button>
+      </div>
+
+      {useCommandCard ? (
+        <CommandCard
+          actions={movesToActions(moves, {
+            deliberationId,
+            targetType,
+            targetId,
+            locusPath
+          })}
+          onPerform={async (action) => {
+            await performCommand(action);
+            mutate();
+          }}
+        />
+      ) : (
         <div className="flex items-center gap-2">
```

#### Testing

1. Click "Grid View" toggle in LegalMoveToolbar
2. Verify 3×3 grid renders
3. Click WHY button → should post move
4. Click scaffold button (∀‑inst) → should insert template into composer
5. Verify keyboard navigation works (tab between buttons)
6. Check disabled buttons show reason tooltip

---

### FIX #5: Assign Default Schemes to Arguments 🏗️ **MEDIUM PRIORITY**

**Files**:
- `app/api/arguments/route.ts` (POST handler)
- `lib/argumentation/schemeInference.ts` (new file)

**Severity**: Medium - Data completeness
**Effort**: 30 minutes

#### Problem

Arguments can be created without a `schemeId`, leaving `scheme: null`. Since critical questions are scheme-specific, these arguments can't participate in WHY/GROUNDS dialogue.

#### Solution

Infer scheme from argument text/structure when creating argument.

#### Code Changes

**File 1**: Create `lib/argumentation/schemeInference.ts`

```typescript
// lib/argumentation/schemeInference.ts
import { inferSchemesFromText, type SchemeId } from './criticalQuestions';
import { prisma } from '@/lib/prismaclient';

export async function inferAndAssignScheme(
  argumentText: string,
  conclusionText?: string
): Promise<string | null> {
  const combined = [argumentText, conclusionText].filter(Boolean).join(' ');
  const schemes = inferSchemesFromText(combined);

  if (schemes.length === 0) {
    schemes.push('Consequences'); // default fallback
  }

  // Lookup scheme row by key
  const schemeRow = await prisma.argumentationScheme.findFirst({
    where: { key: schemes[0] },
    select: { id: true }
  });

  return schemeRow?.id ?? null;
}
```

**File 2**: Update `app/api/arguments/route.ts` (POST handler)

```diff
--- a/app/api/arguments/route.ts
+++ b/app/api/arguments/route.ts
@@ -1,6 +1,7 @@
 import { NextRequest, NextResponse } from 'next/server';
 import { prisma } from '@/lib/prismaclient';
 import { z } from 'zod';
+import { inferAndAssignScheme } from '@/lib/argumentation/schemeInference';

 const Body = z.object({
   deliberationId: z.string(),
@@ -25,6 +26,13 @@
   const { deliberationId, text, authorId, claimId, schemeId, premises } = parsed.data;

+  // Infer scheme if not provided
+  let finalSchemeId = schemeId;
+  if (!finalSchemeId) {
+    const conclusionText = claimId ? (await prisma.claim.findUnique({ where: { id: claimId }, select: { text: true } }))?.text : null;
+    finalSchemeId = await inferAndAssignScheme(text, conclusionText ?? undefined);
+  }
+
   const arg = await prisma.argument.create({
     data: {
       deliberationId,
       text,
       authorId,
-      schemeId,
+      schemeId: finalSchemeId,
       conclusionClaimId: claimId,
       // ... premises handling
     }
```

#### Testing

1. Create argument without specifying scheme: `POST /api/arguments { text: "Dr. Smith says X is true", ... }`
2. Verify response includes `schemeId: <ExpertOpinion scheme ID>`
3. Check database: `SELECT schemeId FROM Argument WHERE id = ...` → should not be NULL
4. Load argument in AIFArgumentsListPro → SchemeBadge should display
5. Open CQ panel → should show ExpertOpinion CQs

---

### FIX #6: Create AIF Argument Nodes from GROUNDS 🏛️ **MEDIUM PRIORITY**

**Files**:
- `app/api/dialogue/move/route.ts`
- New function: `createArgumentFromGrounds`

**Severity**: Medium - Semantic completeness
**Effort**: 45 minutes

#### Problem

When a user posts GROUNDS in response to WHY, it:
- Creates a DialogueMove row ✅
- Updates CQStatus to `satisfied` ✅
- Synthesizes ludics acts ✅

But it does **NOT** create an `Argument` row (RA node in AIF). This means:
- The GROUNDS response isn't a first-class argument
- Can't be attacked or defended
- Doesn't appear in argument lists
- No AIF metadata (premises, scheme, etc.)

#### Solution

When GROUNDS are posted, create an Argument linking the response to the claim being defended.

#### Code Changes

**File**: `app/api/dialogue/move/route.ts`

Add helper function:

```typescript
async function createArgumentFromGrounds(payload: {
  deliberationId: string;
  targetClaimId: string;
  authorId: string;
  groundsText: string;
  cqId: string;
  schemeKey?: string;
}): Promise<string | null> {
  try {
    // Create argument node
    const arg = await prisma.argument.create({
      data: {
        deliberationId: payload.deliberationId,
        authorId: payload.authorId,
        text: payload.groundsText,
        conclusionClaimId: payload.targetClaimId,
        schemeId: payload.schemeKey
          ? (await prisma.argumentationScheme.findFirst({
              where: { key: payload.schemeKey },
              select: { id: true }
            }))?.id
          : null,
        mediaType: 'text',
      }
    });

    // Optional: create premise links if grounds reference other claims
    // (This would require NLP or explicit linking - skip for now)

    return arg.id;
  } catch (e) {
    console.error('[createArgumentFromGrounds] Failed:', e);
    return null;
  }
}
```

Then update the GROUNDS handler:

```diff
--- a/app/api/dialogue/move/route.ts
+++ b/app/api/dialogue/move/route.ts
@@ -179,9 +179,23 @@
       update: { status: 'open', satisfied: false },
     });
   } else if (kind === 'GROUNDS' && schemeKey) {
+    const groundsText = String(payload?.expression ?? payload?.brief ?? '').trim();
+
+    // Create AIF argument node from grounds
+    if (groundsText && targetType === 'claim') {
+      const argId = await createArgumentFromGrounds({
+        deliberationId,
+        targetClaimId: targetId,
+        authorId,
+        groundsText,
+        cqId: schemeKey,
+        schemeKey: payload?.schemeKey,
+      });
+
+      // Store argId in move payload for reference
+      if (argId) (payload as any).createdArgumentId = argId;
+    }
+
     await prisma.cQStatus.updateMany({
       where: { targetType: 'argument' as TargetType, targetId, schemeKey, cqKey: schemeKey },
       data: { status: 'answered', satisfied: true },
     });
```

#### Testing

1. Create claim: `POST /api/claims { text: "The earth is flat" }`
2. Ask WHY: `POST /api/dialogue/move { kind: 'WHY', targetType: 'claim', targetId: <claimId>, payload: { cqId: 'default' } }`
3. Supply GROUNDS: `POST /api/dialogue/move { kind: 'GROUNDS', payload: { cqId: 'default', expression: 'Because my friend said so' } }`
4. Verify:
   - `SELECT * FROM Argument WHERE conclusionClaimId = <claimId>` → should have new row
   - `Argument.text` = "Because my friend said so"
   - `Argument.authorId` = current user
5. Load AIFArgumentsListPro → grounds should appear as an argument card

---

## Implementation Order

### Phase 1: Critical Bug Fixes (30 minutes)
**Goal**: Fix data corruption and critical errors

1. ✅ **FIX #4**: Remove duplicate POST (5 min)
2. ✅ **FIX #2**: Standardize CQ keys (20 min)
3. ✅ Test Phase 1 (5 min)

**Success Criteria**:
- No duplicate POST errors in console
- All WHY/GROUNDS moves have valid `cqId`

---

### Phase 2: Integration Completion (90 minutes)
**Goal**: Complete attack→CQ linkage

4. ✅ **FIX #3**: Link attacks to CQs (45 min)
5. ✅ **FIX #7**: Add loading states (15 min)
6. ✅ **FIX #5**: Default schemes (30 min)
7. ✅ Test Phase 2 (30 min)

**Success Criteria**:
- Creating attack from CQ panel enables CQ checkbox
- Spinner shows during metadata refresh
- All new arguments have schemes

---

### Phase 3: Feature Enhancements (90 minutes)
**Goal**: Complete CommandCard and semantic AIF

8. ✅ **FIX #1**: Wire CommandCard (60 min)
9. ✅ **FIX #6**: GROUNDS→Argument (30 min)
10. ✅ Test Phase 3 (30 min)

**Success Criteria**:
- CommandCard grid renders and executes moves
- GROUNDS responses appear as arguments

---

### Phase 4: End-to-End Validation (60 minutes)

11. ✅ Full dialogue flow test
12. ✅ Performance testing (virtualization, caching)
13. ✅ Error handling review
14. ✅ Documentation update

---

## Testing Criteria

### Unit Tests

#### FIX #4
- ✅ Undercut creation completes without duplicate POST error
- ✅ ArgumentAssumption table has exactly 1 row per exception

#### FIX #2
- ✅ POST WHY without `cqId` returns 400 error
- ✅ CQStatus rows use `cqKey` field correctly
- ✅ Legal moves filter by specific CQ, not scheme

#### FIX #3
- ✅ ConflictAssertion.metaJson contains `{ schemeKey, cqKey }`
- ✅ Attachment check API returns `attached['ExpertOpinion:eo-1'] = true`
- ✅ CQ checkbox enables after attack created

---

### Integration Tests

#### Full Dialogue Flow
```
1. Create Claim C1: "Vaccines cause autism"
2. Create Argument A1 supporting C1 with scheme ExpertOpinion
3. Ask WHY with cqId='eo-1' (expert credibility)
4. Verify:
   - DialogueMove created with kind='WHY'
   - CQStatus row created with status='open'
   - Legal-moves API returns GROUNDS option for eo-1
5. Supply GROUNDS: "The expert has 20 years experience"
6. Verify:
   - CQStatus updated to status='answered', satisfied=true
   - New Argument A2 created linking to C1
   - AIFArgumentsListPro shows A2
7. Create attack via AttackMenuPro (REBUTS)
8. Verify:
   - ConflictAssertion created
   - metaJson contains cqKey
   - CQ panel shows CQ satisfied
```

---

### Performance Tests

- ✅ AIFArgumentsListPro renders 100+ arguments without lag
- ✅ Metadata refresh completes in <500ms
- ✅ Legal-moves API responds in <200ms
- ✅ No N+1 queries (check SQL logs)

---

## Migration Notes

### Database Changes Required

```sql
-- FIX #3: Add metadata to ConflictAssertion
ALTER TABLE "ConflictAssertion"
ADD COLUMN "metaJson" JSONB DEFAULT '{}';

-- Optional: Backfill existing attacks
UPDATE "ConflictAssertion"
SET "metaJson" = '{}'::jsonb
WHERE "metaJson" IS NULL;
```

### Data Backfill Scripts

#### Backfill CQ Keys
```sql
-- Find WHY/GROUNDS moves using schemeKey instead of cqId
SELECT id, kind, payload
FROM "DialogueMove"
WHERE kind IN ('WHY', 'GROUNDS')
  AND payload->>'cqId' IS NULL
  AND payload->>'schemeKey' IS NOT NULL;

-- Optional: copy schemeKey to cqId for compatibility
-- (Only run if you want to preserve old moves)
UPDATE "DialogueMove"
SET payload = jsonb_set(payload, '{cqId}', payload->'schemeKey')
WHERE kind IN ('WHY', 'GROUNDS')
  AND payload->>'cqId' IS NULL
  AND payload->>'schemeKey' IS NOT NULL;
```

#### Backfill Argument Schemes
```sql
-- Find arguments without schemes
SELECT id, text, conclusionClaimId
FROM "Argument"
WHERE "schemeId" IS NULL;

-- Manual review recommended before auto-assignment
-- Run scheme inference script (TBD)
```

---

## Rollback Plan

### FIX #4 Rollback
```diff
+++ restore lines 244-252 in AttackMenuPro.tsx
```
Risk: Duplicate POSTs return, but non-breaking (just extra DB hits)

### FIX #2 Rollback
```diff
--- remove cqId validation
+++ restore fallback: cqId ?? schemeKey ?? 'default'
```
Risk: CQ key ambiguity returns

### FIX #3 Rollback
```sql
ALTER TABLE "ConflictAssertion" DROP COLUMN "metaJson";
```
Risk: CQ→attack linkage lost (manual marking required)

---

## Risk Assessment

| Fix | Risk Level | Mitigation |
|-----|-----------|------------|
| #4 | **Low** | Simple deletion, well-tested path |
| #2 | **Medium** | May break existing moves with schemeKey, backfill available |
| #3 | **Low** | Additive schema change, backwards compatible |
| #7 | **Low** | Pure UI change, no data impact |
| #1 | **Low** | Optional feature, doesn't affect existing flows |
| #5 | **Medium** | Scheme inference may misclassify, manual review available |
| #6 | **Medium** | Creates new data, ensure no duplicate Arguments |

---

## Success Metrics

### Quantitative
- ✅ 0 duplicate POST errors in logs
- ✅ 100% of WHY/GROUNDS moves have valid `cqId`
- ✅ 95%+ of arguments have schemes assigned
- ✅ <500ms metadata refresh latency
- ✅ CommandCard renders in <100ms

### Qualitative
- ✅ Users can complete full dialogue flow without manual SQL
- ✅ CQ checkboxes enable automatically after attacks
- ✅ No confusing "unknown" or "default" scheme labels
- ✅ Loading states provide clear feedback

---

## Open Questions

1. **Q**: Should GROUNDS always create Arguments, or only when `expression` is substantial?
   **A**: TBD - Consider minimum character threshold (e.g., >20 chars)

2. **Q**: How to handle multi-CQ schemes (e.g., ExpertOpinion has 5 CQs)?
   **A**: Current design: one WHY per CQ. UI should show "Ask WHY (eo-2)" as separate button.

3. **Q**: Should CommandCard replace LegalMoveToolbar or coexist?
   **A**: Recommend toggle/preference, some users prefer list view.

4. **Q**: Performance impact of creating Arguments from every GROUNDS?
   **A**: Monitor - may need to batch or defer for high-volume deliberations.

---

## Appendix A: File Checklist

### Files Modified
- [ ] `components/arguments/AttackMenuPro.tsx` (FIX #4)
- [ ] `app/api/dialogue/legal-moves/route.ts` (FIX #2)
- [ ] `app/api/dialogue/move/route.ts` (FIX #2, #6)
- [ ] `lib/dialogue/legalMovesServer.ts` (FIX #2)
- [ ] `components/arguments/AIFArgumentsListPro.tsx` (FIX #3, #7)
- [ ] `components/claims/CriticalQuestions.tsx` (FIX #3)
- [ ] `app/api/cqs/toggle/route.ts` (FIX #3)
- [ ] `app/api/cqs/attachments/route.ts` (FIX #3)
- [ ] `app/api/arguments/route.ts` (FIX #5)
- [ ] `components/dialogue/LegalMoveToolbar.tsx` (FIX #1)

### Files Created
- [ ] `lib/dialogue/movesToActions.ts` (FIX #1)
- [ ] `lib/argumentation/schemeInference.ts` (FIX #5)

### Files Verified (No Changes)
- [x] `components/dialogue/command-card/CommandCard.tsx`
- [x] `components/dialogue/command-card/types.ts`
- [x] `lib/argumentation/criticalQuestions.ts`

---

## Appendix B: API Contract Changes

### `/api/dialogue/move` (POST)
**Before**: Accepts WHY/GROUNDS with optional `cqId`
**After**: **Requires** `cqId` for WHY/GROUNDS, returns 400 if missing

**Request**:
```json
{
  "kind": "WHY",
  "payload": {
    "cqId": "eo-1",  // ← NOW REQUIRED
    "locusPath": "0"
  }
}
```

**Response** (new field):
```json
{
  "ok": true,
  "move": { "id": "..." },
  "createdArgumentId": "arg_xyz"  // ← NEW (when GROUNDS creates argument)
}
```

### `/api/ca` (POST)
**Before**: No metadata
**After**: Accepts optional `metaJson`

**Request**:
```json
{
  "conflictingClaimId": "...",
  "conflictedClaimId": "...",
  "metaJson": {  // ← NEW
    "schemeKey": "ExpertOpinion",
    "cqKey": "eo-1",
    "source": "cq-panel"
  }
}
```

### `/api/cqs/attachments` (GET)
**Before**: Returns `{ attached: { __ANY__: true } }`
**After**: Returns per-CQ attachments

**Response**:
```json
{
  "attached": {
    "ExpertOpinion:eo-1": true,  // ← NEW: granular tracking
    "ExpertOpinion:eo-2": false,
    "__ANY__": true
  }
}
```

---

## Document Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-21 | Initial specification created |

---

**END OF SPECIFICATION**

*This document is the canonical reference for AIF dialogical actions fixes. All implementation should follow these specifications exactly. Deviations require updating this document first.*
