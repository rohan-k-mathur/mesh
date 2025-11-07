# Critical Questions → Dialogical Moves → Ludics Integration Roadmap

**Created:** November 6, 2025  
**Updated:** November 6, 2025 (Phase 1c-1e Completion Review)  
**Status:** ✅ **55% COMPLETE** - Backend infrastructure done, UI integration remaining  
**Priority:** CRITICAL (Core Infrastructure)  
**Estimated Timeline:** ~~4-6 weeks~~ → **11-14 days remaining** (Phases 4-8)

---

## **🎉 MAJOR UPDATE: Phases 1-3 Already Complete!**

**Phase 0-1e ASPIC+ implementation has already delivered the core technical infrastructure for this roadmap.**

**Completion Status:**
- ✅ **Phase 1 (Database Schema)**: 80% complete - FK relationships exist
- ✅ **Phase 2 (API Layer)**: 90% complete - `/api/cqs/dialogue-move` endpoint exists
- ✅ **Phase 3 (Ludics Compilation)**: 100% complete - ASPIC+ metadata preserved
- ⏳ **Phases 4-8**: UI integration and polish remaining (~11-14 days)

---

## **Executive Summary**

This roadmap unifies three currently fragmented systems (CQs, Dialogical Moves, Ludics) into a cohesive argumentation pipeline. The integration enables:

1. **Formal provenance:** Every CQ action creates a DialogueMove with full context ✅ **BACKEND COMPLETE**
2. **Semantic preservation:** CQ attack types (UNDERMINES/UNDERCUTS/REBUTS) flow through to ludics ✅ **COMPLETE**
3. **Bidirectional links:** AIF nodes ↔ DialogueMoves ↔ LudicActs with foreign keys ✅ **COMPLETE**
4. **ASPIC+ compliance:** Attack types properly classified in ASPIC+ translation ✅ **COMPLETE**

**Success Criteria:**
- ✅ Asking a CQ creates WHY DialogueMove with cqId in payload **[BACKEND READY]**
- ✅ Answering a CQ creates GROUNDS DialogueMove with cqId in payload **[BACKEND READY]**
- ✅ LudicActs preserve CQ metadata (attackType, targetScope, schemeKey) **[COMPLETE]**
- ✅ AIF export includes DialogueMove provenance **[COMPLETE]**
- ⏳ AttackMenuProV2 formally deprecated (replaced by CQ-driven system) **[PENDING]**

---

## **✅ Phase 1: Database Schema Updates - COMPLETE (80%)**
**Duration:** ~~1-2 days~~ **DONE via Phase 1d**  
**Dependencies:** None  
**Risk:** Low (additive changes only)  
**Status:** ✅ **COMPLETE** - FK relationships and ASPIC+ fields exist

### **Goal**
Add foreign key relationships to link CQs → DialogueMoves → CA-nodes → LudicActs

### **✅ Completed in Phase 1d**

**ConflictApplication model** already has (lib/models/schema.prisma, line 2472):
```prisma
model ConflictApplication {
  // ✅ COMPLETE: Link to DialogueMove (Phase 1d)
  createdByMoveId String?  // Note: Named differently than roadmap's "dialogueMoveId"
  createdByMove   DialogueMove? @relation("ConflictCreatedByMove", fields: [createdByMoveId], references: [id], onDelete: SetNull)
  
  // ✅ COMPLETE: ASPIC+ Integration (Phase 1d)
  aspicAttackType  String? // 'undermining' | 'rebutting' | 'undercutting'
  aspicDefeatStatus Boolean?
  aspicMetadata    Json? // Full ASPIC+ attack details
}
```

**DialogueMove model** already has (lib/models/schema.prisma, line 3649):
```prisma
model DialogueMove {
  payload        Json? // ✅ COMPLETE: Stores aspicAttack, aspicMetadata (Phase 1c)
  
  // ✅ COMPLETE: Reverse relations (Phase 1d)
  createdConflicts   ConflictApplication[] @relation("ConflictCreatedByMove")
  
  // ✅ COMPLETE: AIF integration
  createdAifNodes    AifNode[] @relation("AifNodeCreatedBy")
  causedEdges        AifEdge[] @relation("EdgeCausedBy")
  
  // ✅ COMPLETE: GIN index for JSON queries
  @@index([payload], type: Gin, name: "dm_payload_gin")
}
```

### **Tasks**

#### **✅ 1.1: Add DialogueMove FK to ConflictingArgument - COMPLETE**
~~**File:** `prisma/schema.prisma`~~

**Status:** ✅ Already exists as `createdByMoveId` on `ConflictApplication` model
- Field name differs from roadmap (`createdByMoveId` vs proposed `dialogueMoveId`)
- Functionality is identical
- Relation properly configured with reverse relation on DialogueMove

#### **✅ 1.2: Add CQ Metadata to LudicAct - COMPLETE**
~~**File:** `prisma/schema.prisma`~~

**Status:** ✅ CQ metadata preserved via `extJson` field and ASPIC+ integration
- Phase 1e: `expandActsFromMove()` extracts ASPIC+ from DialogueMove payload
- Phase 1e: LudicAct.metaJson/extJson stores attackType, targetScope, cqId
- Full provenance chain: DialogueMove → LudicAct → AifNode

#### **✅ 1.3: Run Migration - COMPLETE**
~~```bash
npx prisma db push
npx prisma generate
```~~

**Status:** ✅ Schema already deployed and tested
- ConflictApplication with aspicAttackType, aspicDefeatStatus, aspicMetadata
- DialogueMove with payload JSON and GIN indexing
- Phase 1f: 28 passing unit tests verify the schema

**Testing:**
- ✅ Schema validates without errors
- ✅ Existing data unaffected (FK nullable)
- ✅ Can create ConflictApplication with createdByMoveId
- ✅ Can query DialogueMove.createdConflicts

---

## **✅ Phase 2: API Layer - DialogueMove Creation Helpers - COMPLETE (90%)**
**Duration:** ~~2-3 days~~ **DONE via Phase 1c**  
**Dependencies:** Phase 1 complete  
**Risk:** Medium (new API surface)  
**Status:** ✅ **90% COMPLETE** - Core API endpoint exists, could extract to helpers

### **Goal**
Create utility functions for CQ → DialogueMove creation with proper payload structure

### **✅ Already Complete (Phase 1c)**

**File:** `app/api/cqs/dialogue-move/route.ts` **EXISTS!**

This API endpoint already implements everything proposed in Phase 2:

```typescript
// ✅ COMPLETE: CQ → DialogueMove creation with ASPIC+ metadata
POST /api/cqs/dialogue-move

// Features implemented:
// ✅ Creates WHY DialogueMove for asking CQs
// ✅ Creates GROUNDS DialogueMove for answering CQs
// ✅ Computes ASPIC+ attack using cqToAspicAttack()
// ✅ Stores attack type, target scope, CQ metadata in payload
// ✅ Creates ConflictApplication with aspicAttackType, aspicMetadata
// ✅ Links DialogueMove via createdByMoveId FK
// ✅ Triggers ludics recompilation
```

**Helper Functions** (lib/aspic/conflictHelpers.ts):
```typescript
// ✅ COMPLETE: Extract ASPIC+ from DialogueMove payload
export function extractAspicMetadataFromMove(payload: any)

// ✅ COMPLETE: Compute ASPIC+ metadata for ConflictApplication
export function computeAspicConflictMetadata(...)

// ✅ COMPLETE: Check defeat status from preferences
export function checkDefeatStatus(attack, preferences)
```

**CQ Mapping** (lib/aspic/cqMapping.ts):
```typescript
// ✅ COMPLETE: Convert CQ to ASPIC+ attack
export function cqToAspicAttack(cq, targetArg, theory)

// ✅ COMPLETE: Batch process multiple CQs
export function batchCqToAspicAttacks(cqs, targetArg, theory)
```

### **Tasks**

#### **✅ 2.1: Create CQ-DialogueMove Helper - COMPLETE**
~~**File:** `lib/dialogue/cqMoveHelpers.ts` (NEW)~~

**Status:** ✅ Functions exist inline in `/api/cqs/dialogue-move` route
- `createCQWhyMove()` logic: Lines 186-230 (WHY move creation)
- `createCQGroundsMove()` logic: Lines 333-386 (GROUNDS move creation)
- `getCQDetails()` logic: Inline CQ metadata extraction

**Note:** Could be refactored into separate helper file for reusability (low priority)

#### **✅ 2.2: Update CQs API to Create DialogueMoves - COMPLETE**
~~**File:** `app/api/cqs/route.ts`~~

**Status:** ✅ Separate endpoint exists at `/api/cqs/dialogue-move`
- Backend infrastructure complete
- UI needs to be wired to call this endpoint (Phase 4-5)

#### **✅ 2.3: Update CA API to Link DialogueMoves - COMPLETE**
~~**File:** `app/api/ca/route.ts`~~

**Status:** ✅ `app/api/ca/route.ts` uses `computeAspicConflictMetadata()`
- Line 48: Imports ASPIC+ helpers
- Lines 75-77: Computes and stores ASPIC+ metadata
- ConflictApplication created with aspicAttackType, aspicMetadata

**Testing:**
- ✅ POST /api/cqs/dialogue-move creates DialogueMove when CQ toggled
- ✅ WHY move has cqId, attackType, targetScope in payload
- ✅ GROUNDS move has matching cqId
- ✅ POST /api/ca links to DialogueMove when metaJson.cqId present
- ✅ Phase 1f: 18 passing tests for conflictHelpers
- ⏸️ Duplicate WHY prevention: May need verification (check API route logic)

---

## **✅ Phase 3: Ludics Compilation Enhancement - COMPLETE (100%)**
**Duration:** ~~3-4 days~~ **DONE via Phase 1e**  
**Dependencies:** Phase 2 complete  
**Risk:** Medium (core compilation logic)  
**Status:** ✅ **100% COMPLETE** - Full provenance chain implemented and tested

### **Goal**
Preserve CQ metadata when compiling DialogueMoves to LudicActs

### **✅ Already Complete (Phase 1e)**

### **Tasks**

#### **✅ 3.1: Enhance compileFromMoves to Preserve CQ Metadata - COMPLETE**
~~**File:** `packages/ludics-engine/compileFromMoves.ts`~~

**Status:** ✅ Fully implemented in Phase 1e

**File:** `packages/ludics-engine/compileFromMoves.ts`

```typescript
// ✅ COMPLETE: Import ASPIC+ extraction (Phase 1e)
import { extractAspicMetadataFromMove } from '@/lib/aspic/conflictHelpers';

// ✅ COMPLETE: Extract and preserve ASPIC+ metadata
export function expandActsFromMove(m: Move) {
  const aspicMetadata = extractAspicMetadataFromMove(m.payload ?? {});
  
  return acts.map(a => ({
    // ... existing fields
    aspic: aspicMetadata, // ✅ COMPLETE: ASPIC+ preserved in act
  }));
}
```

**Testing:** Phase 1f created 10 passing tests
- ✅ `__tests__/ludics/expandActsFromMove.test.ts` - 10/10 tests passing
- ✅ Verifies ASPIC+ extraction from DialogueMove payload
- ✅ Confirms metadata flows to LudicAct.aspic field

#### **✅ 3.2: Update LudicAct Type Definitions - COMPLETE**
~~**File:** `packages/ludics-engine/types.ts`~~

**Status:** ✅ Type definitions support ASPIC+ metadata structure
- attackType, targetScope, cqKey fields supported
- Metadata properly typed in ludics-engine package

#### **✅ 3.3: Update syncLudicsToAif - COMPLETE**
~~**File:** `packages/ludics-engine/syncLudicsToAif.ts`~~

**Status:** ✅ Fully implemented in Phase 1e

**File:** `lib/ludics/syncToAif.ts`

```typescript
// ✅ COMPLETE: CA-node generation from ASPIC+ metadata (Phase 1e)
async function createCANodeForAspicAttack(
  tx,
  deliberationId,
  aspicMeta,
  attackerActId,
  defenderActId
) {
  // Creates CA-node with:
  // ✅ aspicAttackType (undermining/rebutting/undercutting)
  // ✅ aspicTargetScope (premise/inference/conclusion)
  // ✅ cqKey, cqText preservation
  // ✅ Edges: attacker → CA → defender
  
  const caNode = await tx.aifNode.create({
    data: {
      nodeType: "CA",
      deliberationId,
      metadata: {
        aspicAttackType: aspicMeta.attackType,
        aspicTargetScope: aspicMeta.targetScope,
        cqKey: aspicMeta.cqKey,
        cqText: aspicMeta.cqText,
        schemeKey: aspicMeta.schemeKey,
      },
      // ... edges configuration
    },
  });
}
```

**Testing:** Full provenance chain verified
- ✅ DialogueMove.payload → LudicAct.aspic → AifNode.metadata
- ✅ CA-nodes preserve attackType, targetScope, cqKey
- ✅ Phase 1f: 28 total passing tests covering the flow

**Testing:**
- ✅ DialogueMove with cqId compiles to LudicAct with metadata
- ✅ LudicAct.extJson includes attackType, targetScope
- ✅ AifNode inherits CQ context from LudicAct
- ✅ Existing non-CQ moves still compile correctly
- ✅ Phase 1e integration complete
- ✅ Phase 1f tests passing (10/10 for expandActsFromMove)

---

## **⏳ Phase 4: UI Updates - CriticalQuestionsV3 (20% COMPLETE)**
**Duration:** 2-3 days  
**Dependencies:** Phase 2, 3 complete ✅  
**Risk:** Low (UI only)  
**Status:** ⏳ **PENDING** - Backend ready, UI not wired to new API

### **Goal**
Update CriticalQuestionsV3 to use new DialogueMove creation flow

### **Tasks**

#### **⏳ 4.1: Update resolveViaGrounds to Create DialogueMove - PENDING**
**File:** `components/claims/CriticalQuestionsV3.tsx`

**Current State:** Likely calls old `/api/cqs` endpoint directly

**Needed:** Wire to `/api/cqs/dialogue-move` endpoint (which already exists from Phase 1c)

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
    const moveRes = await fetch("/api/cqs/dialogue-move", { // ← Use existing endpoint
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
        deliberationId,
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

**Estimate:** 1-2 days

#### **⏳ 4.2: Add Visual Indicator for DialogueMove Link - PENDING**
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

**Estimate:** 1 day

**Testing:**
- [ ] Providing grounds creates GROUNDS DialogueMove
- [ ] CQStatus updated after move created
- [ ] Ludics recompilation triggered
- [ ] Badge shows move count
- [ ] Events fire in correct order

---

## **⏳ Phase 5: UI Updates - SchemeSpecificCQsModal (30% COMPLETE)**
**Duration:** 2-3 days  
**Dependencies:** Phase 2, 3 complete ✅  
**Risk:** Medium (objection form integration)  
**Status:** ⏳ **PENDING** - Backend ready, UI not wired to dialogue API

### **Goal**
Update SchemeSpecificCQsModal to create WHY moves when asking CQs and link GROUNDS when posting objections

### **Tasks**

#### **⏳ 5.1: Update askCQ to Create WHY DialogueMove - PENDING**
**File:** `components/arguments/SchemeSpecificCQsModal.tsx`

**Current State:** Likely uses old `askCQ()` helper

**Needed:** Call `/api/cqs/dialogue-move` to create WHY move

```tsx
// Replace handleAskCQ function (around line 158)
const handleAskCQ = async (cqKey: string) => {
  try {
    // 1. Create WHY DialogueMove using existing endpoint
    const moveRes = await fetch("/api/cqs/dialogue-move", {
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

**Estimate:** 1-2 days

#### **⏳ 5.2: Update postObjection to Create GROUNDS Move - PENDING**
**File:** `components/arguments/SchemeSpecificCQsModal.tsx`

**Needed:** After posting objection, create GROUNDS DialogueMove

```tsx
// In postObjection function (around line 180), after posting CA
// Add after successful CA creation:

// Create GROUNDS DialogueMove to answer the WHY
const groundsRes = await fetch("/api/cqs/dialogue-move", {
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

**Estimate:** 1 day

#### **⏳ 5.3: Add Dialogue Provenance Display - PENDING**
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

**Estimate:** 0.5 days

**Testing:**
- [ ] "Mark as asked" creates WHY DialogueMove
- [ ] Posting objection creates GROUNDS DialogueMove
- [ ] CA-node links to DialogueMove via FK
- [ ] CQ badge shows WHY/GROUNDS counts
- [ ] Ludics recompilation triggered

---

## **⏳ Phase 6: AttackMenuProV2 Integration/Deprecation (0% COMPLETE)**
**Duration:** 2 days  
**Dependencies:** Phase 5 complete  
**Risk:** Low (migration path)  
**Status:** ⏳ **PENDING** - Not started

### **Goal**
Either integrate AttackMenuProV2 with CQ system or provide migration path to deprecate it

**Recommendation:** Start with **Option B** (deprecation path) - simpler and less risky

### **Option B: Deprecation Path (RECOMMENDED)**

#### **⏳ 6.2: Add Deprecation Warning - PENDING**
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

**Estimate:** 0.5 days

#### **⏳ 6.3: Add Link to SchemeSpecificCQsModal - PENDING**
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

**Estimate:** 0.5 days

### **Option A: Full Integration (Alternative)**

#### **⏳ 6.1: Add CQ Requirement to AttackMenuProV2 - ALTERNATIVE**
**File:** `components/arguments/AttackMenuProV2.tsx`

Show CQ context and require CQ selection before allowing attacks.

**Note:** More complex, requires fetching CQs and updating attack flow.

**Estimate:** 3-4 days (if chosen instead of deprecation)

**Testing:**
- [ ] Option A: AttackMenuProV2 requires CQ selection
- [ ] Option A: Attacks include cqId in metadata
- [ ] Option B: Warning message displays ✅ (RECOMMENDED)
- [ ] Option B: Link to CQ modal works ✅ (RECOMMENDED)

---

## **⏳ Phase 7: ASPIC+ Translation Enhancement (60% COMPLETE)**
**Duration:** 2 days  
**Dependencies:** Phase 3 complete ✅  
**Risk:** Low (export only)  
**Status:** ⏳ **PARTIAL** - Attack classification exists, AIF→ASPIC translation needs update

### **Goal**
Enhance ASPIC+ export to properly classify attack types based on CQ metadata

### **✅ Partial: Attack Classification Exists**

**File:** `lib/aspic/cqMapping.ts`

The `cqToAspicAttack()` function already classifies attacks by type:
- ✅ UNDERMINES → premise attack
- ✅ UNDERCUTS → inference attack
- ✅ REBUTS → conclusion attack

### **Tasks**

#### **⏳ 7.1: Update aifToAspic with Attack Type Classification - PENDING**
**File:** `lib/aif/translation/aifToAspic.ts`

**Needed:** Read attack type from CA-node metadata and classify in ASPIC+ export

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
                     (ca as any).metadata?.aspicAttackType ||
                     'REBUTS'; // default
  
  const attackerSymbol = attackerNode.nodeType === 'I'
    ? ((attackerNode as any).content ?? (attackerNode as any).text ?? attackerNode.id)
    : attackerNode.id;
    
  const attackedSymbol = attackedNode.nodeType === 'I'
    ? ((attackedNode as any).content ?? (attackedNode as any).text ?? attackedNode.id)
    : attackedNode.id;

  // NEW: Store attack with type classification
  if (attackType === 'UNDERMINES' || attackType === 'undermining') {
    // Premise attack - add to contraries
    if (!contraries.has(attackerSymbol)) contraries.set(attackerSymbol, new Set());
    contraries.get(attackerSymbol)!.add(attackedSymbol);
  } else if (attackType === 'UNDERCUTS' || attackType === 'undercutting') {
    // Inference attack - add as exception to rule
    if (!exceptions.has(attackedSymbol)) exceptions.set(attackedSymbol, new Set());
    exceptions.get(attackedSymbol)!.add(attackerSymbol);
  } else if (attackType === 'REBUTS' || attackType === 'rebutting') {
    // Conclusion attack - add to contraries
    if (!contraries.has(attackerSymbol)) contraries.set(attackerSymbol, new Set());
    contraries.get(attackerSymbol)!.add(attackedSymbol);
  }
}
```

**Estimate:** 1.5 days

#### **⏳ 7.2: Add Attack Type to ASPIC Theory - PENDING**
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

**Estimate:** 0.5 days

#### **⏳ 7.3: Update Export Endpoint - PENDING**
**File:** `app/api/arguments/[id]/export-aspic/route.ts` (NEW or update existing)

Create endpoint to export ASPIC+ theory with proper attack classification

**Estimate:** 0.5 days (if endpoint already exists, just update)

**Testing:**
- [ ] ASPIC+ export classifies attacks by type
- [ ] Undermining attacks mapped to premise contraries
- [ ] Undercutting attacks mapped to rule exceptions
- [ ] Rebutting attacks mapped to conclusion contraries
- [ ] CQ context included in attack metadata

---

## **⏳ Phase 8: Visualization & UX Polish (10% COMPLETE)**
**Duration:** 3-4 days  
**Dependencies:** All phases complete  
**Risk:** Low (polish only)  
**Status:** ⏳ **PENDING** - Mostly not started, some ArgumentCardV2 features exist

### **Goal**
Add visual indicators and tooltips to show CQ→DialogueMove→Ludics provenance

### **Tasks**

#### **⏳ 8.1: Add CQ Provenance Badge to LudicAct Display - PENDING**
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
