# Ludics Compile & Step Functions: Comprehensive Audit

**Date:** November 26, 2025  
**Scope:** Full end-to-end audit of compile and step operations  
**Focus:** Post-scoped designs implementation review

---

## Executive Summary

This audit reviews the **Compile** and **Step** operations in the Ludics system, focusing on:
1. **Current Implementation State** (post-Phase 4 scoped designs)
2. **Architectural Evolution** (foundational → scoped designs → forest view)
3. **Gaps & Outdated Components** (what hasn't been updated)
4. **Integration with Modern Features** (AIF, ASPIC+, commitments)
5. **Actionable Recommendations** (what needs updating)

### Key Findings

✅ **Working Well:**
- Core stepper logic remains sound (convergence/divergence detection)
- Scoped designs architecture fully implemented (Phase 4)
- Forest view visualizes independent scopes correctly
- Backward compatibility maintained (legacy mode)

⚠️ **Needs Attention:**
- UI buttons in LudicsPanel don't reflect scoping concepts
- Some commands (appendDaimon, NLI) haven't been updated for scopes
- Documentation references outdated single-design assumptions
- Insights cache may not handle scoped designs correctly

---

## Part 1: Compile Operation Deep Dive

### 1.1 Current Implementation (Post-Scoped Designs)

**Primary Function:** `packages/ludics-engine/compileFromMoves.ts`

**Signature (Updated Phase 4):**
```typescript
export async function compileFromMoves(
  dialogueId: string,
  options?: {
    scopingStrategy?: 'legacy' | 'topic' | 'actor-pair' | 'argument';
    forceRecompile?: boolean;
  }
): Promise<{ ok: true; designs: string[] }>
```

**Key Changes from Foundational Implementation:**

| Aspect | Foundational (Pre-Phase 4) | Scoped Designs (Phase 4) |
|--------|---------------------------|--------------------------|
| **Design Count** | Always 2 (P + O) | 2N (N scopes × 2 polarities) |
| **Scope Field** | Not present | `scope: string \| null` |
| **Grouping** | Single monolithic deliberation | Grouped by topic/actor-pair/argument |
| **Metadata** | Minimal | Rich: `scopeMetadata` with actors, labels, move counts |
| **Cross-References** | Not tracked | `referencedScopes: string[]`, `crossScopeActIds: string[]` |

**Compilation Pipeline (Phases):**

```
1. CLEAN SLATE (Transaction Start)
   ├─ Delete LudicChronicle (old acts)
   ├─ Delete LudicAct
   ├─ Delete LudicTrace
   └─ Delete LudicDesign
   
2. READ & SCOPE MOVES
   ├─ Fetch DialogueMove rows (orderBy: createdAt)
   ├─ computeScopes(moves, strategy) ───┐
   │  ├─ legacy: all moves → null scope  │
   │  ├─ topic: group by argument root   │ ← Phase 4 Addition
   │  ├─ actor-pair: group by actor duo │
   │  └─ argument: one scope per target  │
   └─ detectCrossScopeReferences() ──────┘
   
3. GROUP BY SCOPE
   ├─ movesByScope = Map<scopeKey, moves[]>
   └─ For each scope:
       ├─ buildScopeMetadata(scopeKey, moves)
       ├─ Create P design (participantId: 'Proponent')
       ├─ Create O design (participantId: 'Opponent')
       └─ compileScopeActs(moves, P, O) ───┐
           ├─ ASSERT → P act @ 0.N          │
           ├─ WHY → O act @ parent locus    │ ← Core Logic (Unchanged)
           ├─ GROUNDS → P act @ child       │
           ├─ CLOSE → Daimon act            │
           └─ RETRACT → Mark for removal    │
           
4. VALIDATE & RETURN
   ├─ validateVisibility(designId) for all designs
   └─ Return { ok: true, designs: [id1, id2, ...] }
```

### 1.2 What Hasn't Changed (Foundational Logic)

**Act Synthesis (Per Move Type):**

These mappings remain identical to the original implementation:

```typescript
// ASSERT → Positive act (opens locus)
ASSERT { text: "Climate change is real" }
  ↓
LudicAct {
  polarity: 'P',
  locus: '0.1',           // next top-level locus
  ramification: [],       // no openings (additive if ramification.length > 0)
  expression: "Climate change is real",
  meta: { moveId, targetType, targetId, actorId }
}

// WHY → Negative act (challenge)
WHY { targetId: claim_001 }
  ↓
LudicAct {
  polarity: 'O',
  locus: '0.1',           // SAME locus as ASSERT (convergent)
  ramification: [],
  expression: "WHY <claim_001>?",
  meta: { justifiedByLocus: '0', cqId: 'ac-2' }
}

// GROUNDS → Positive response (deeper level)
GROUNDS { brief: "IPCC Report 2021" }
  ↓
LudicAct {
  polarity: 'P',
  locus: '0.1.1',         // child of WHY locus
  ramification: [],
  expression: "IPCC Report 2021",
  meta: { justifiedByLocus: '0.1' }
}

// CLOSE → Daimon (terminal)
CLOSE { targetId: claim_001 }
  ↓
LudicAct {
  kind: 'DAIMON',
  expression: 'END',
  meta: { closedBy: actorId }
}
```

**Key Insight:** The **act-level logic is untouched**. Scoping only affects **which design the act goes into**, not **how the act is constructed**.

### 1.3 What Changed (Scoped Designs Additions)

**New Helper Functions (Phase 4):**

```typescript
// 1. computeScopes() - Assigns each move to a scope
async function computeScopes(
  moves: DialogueMoveRow[],
  strategy: ScopingStrategy
): Promise<MoveWithScope[]>

// 2. computeArgumentRoots() - Finds root arguments for topic grouping
async function computeArgumentRoots(
  moves: DialogueMoveRow[]
): Promise<Map<string, string>>  // targetKey → rootArgumentId

// 3. detectCrossScopeReferences() - Finds fax/delocation
async function detectCrossScopeReferences(
  movesWithScopes: MoveWithScope[]
): Promise<Map<string, Set<string>>>  // scopeKey → [referencedScopeKeys]

// 4. buildScopeMetadata() - Enriches design with context
function buildScopeMetadata(
  scopeKey: string,
  moves: MoveWithScope[],
  strategy: string
): ScopeMetadata

// 5. compileScopeActs() - Scoped version of act compilation
async function compileScopeActs(
  dialogueId: string,
  moves: MoveWithScope[],
  P: { id: string; participantId: 'Proponent' },
  O: { id: string; participantId: 'Opponent' },
  pathById: Map<string, string>
): Promise<void>
```

**Key Additions:**
- ✅ **Scope assignment** - Each move gets `scope` and `scopeType`
- ✅ **Cross-scope tracking** - `referencedScopes` and `crossScopeActIds`
- ✅ **Metadata enrichment** - Labels, actor lists, time ranges
- ✅ **Per-scope compilation** - Loop creates 2N designs instead of 2

### 1.4 API Endpoints (Compile Trigger)

**1. POST `/api/ludics/compile` (Explicit Recompile)**

```typescript
// File: app/api/ludics/compile/route.ts
// Purpose: Manual recompilation with strategy selection

const { deliberationId, scopingStrategy, forceRecompile } = await req.json();

const result = await compileFromMoves(deliberationId, {
  scopingStrategy: scopingStrategy ?? "legacy",  // ← Phase 4 parameter
  forceRecompile: forceRecompile ?? true,
});

// TODO: Sync to AIF and invalidate caches (commented out in code)
// await syncLudicsToAif(deliberationId);
// await invalidateInsightsCache(deliberationId);

return NextResponse.json({
  ok: true,
  designs: result.designs,
  designCount: result.designs.length,
  scopingStrategy: scopingStrategy ?? "legacy",
});
```

**Issue Found:** The TODO comments indicate **AIF sync is not happening** after explicit recompile. This could cause stale data in AIF diagrams.

**2. POST `/api/ludics/compile-step` (Combined Compile + Step)**

```typescript
// File: app/api/ludics/compile-step/route.ts
// Purpose: Legacy endpoint that compiles and steps in one call

// 1) Compile from moves (direct function call, no internal fetch)
await compileFromMoves(deliberationId).catch((e) => {
  console.warn('[compile-step] compile warning:', e?.message);
});

// 2) Pick designs (assumes legacy: finds first P/O pair)
const designs = await prisma.ludicDesign.findMany({
  where: { deliberationId },
  orderBy: { participantId: 'asc' },
  select: { id: true, participantId: true },
});

const pro = designs.find(d => d.participantId === 'Proponent') ?? designs[0];
const opp = designs.find(d => d.participantId === 'Opponent') ?? designs[1] ?? designs[0];

// 3) Step interaction
const trace = await stepInteraction({
  dialogueId: deliberationId,
  posDesignId: pro.id,
  negDesignId: opp.id,
  phase, compositionMode, maxPairs: fuel,
});
```

**Issue Found:** This endpoint **doesn't accept `scopingStrategy`** and **always picks the first P/O pair** found. For multi-scope deliberations, this may pick an arbitrary scope, not the user's intended one.

**Recommendation:** Add `scope` parameter to allow stepping specific scopes.

### 1.5 UI Trigger Points (Where Compile is Called)

**LudicsPanel Compile Button:**

```tsx
// File: components/deepdive/LudicsPanel.tsx
// Lines ~420-450

const compileStep = React.useCallback(
  async (p: "neutral" | "focus-P" | "focus-O" = phase) => {
    const now = Date.now();
    if (now - lastCompileAt.current < 1200) return;  // Throttle
    if (compRef.current) return;  // Lock
    
    compRef.current = true;
    setBusy("compile");
    
    try {
      const r = await fetch("/api/ludics/compile-step", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 
          deliberationId, 
          phase: p  // ← No scopingStrategy passed!
        }),
      }).then((r) => r.json());

      if (r?.trace) {
        setTrace({ /* update local state */ });
      }
    } finally {
      compRef.current = false;
      setBusy(false);
      lastCompileAt.current = Date.now();
      mutateDesigns();
    }
  },
  [deliberationId, phase, mutateDesigns]
);
```

**Issue Found:** 
- Uses legacy `/api/ludics/compile-step` which doesn't support scoping
- No way to select which scope to compile/step
- User can't change scoping strategy from UI

**Contrast with LudicsForest Recompile:**

```tsx
// File: components/ludics/LudicsForest.tsx
// Lines ~110-135

const [scopingStrategy, setScopingStrategy] = React.useState<ScopingStrategy>('topic');

const handleRecompile = async () => {
  setIsRecompiling(true);
  try {
    const res = await fetch('/api/ludics/compile', {  // ← Correct endpoint!
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deliberationId,
        scopingStrategy,  // ← Passes strategy!
        forceRecompile: true,
      }),
    });
    
    if (!res.ok) { /* error handling */ }
    await refreshDesigns();
  } finally {
    setIsRecompiling(false);
  }
};
```

**Observation:** LudicsForest has the **correct implementation** with scoping support, but LudicsPanel's **"Compile" button still uses the legacy path**.

---

## Part 2: Step Operation Deep Dive

### 2.1 Current Implementation

**Primary Function:** `packages/ludics-engine/stepper.ts`

**Signature:**
```typescript
export async function stepInteraction(opts: {
  dialogueId: string,
  posDesignId: string,
  negDesignId: string,
  startPosActId?: string,
  maxPairs?: number,
  phase?: 'focus-P' | 'focus-O' | 'neutral',
  maskNamesAt?: string[],
  virtualNegPaths?: string[],   // Consensus testers
  drawAtPaths?: string[],       // Draw by consensus
  compositionMode?: CompositionMode,  // 'assoc' | 'partial' | 'spiritual'
  focusAt?: string | null;      // Pin traversal to locus subtree
}): Promise<StepResult>
```

**Return Type:**
```typescript
type StepResult = {
  status: 'CONVERGENT' | 'DIVERGENT' | 'ONGOING' | 'STUCK';
  pairs: Array<{
    posActId: string;
    negActId: string;
    locusPath: string;
    ts: number;
  }>;
  endedAtDaimonForParticipantId?: 'Proponent' | 'Opponent';
  endorsement?: { locusPath: string; byParticipantId: string; viaActId: string };
  decisiveIndices: number[];    // Explain-why chain
  usedAdditive: Record<string, string>;  // Additive choices locked in
  daimonHints: Array<{ locusPath: string; reason: string }>;
  reason?: string;  // Why stopped (e.g., 'no-response', 'dir-collision')
}
```

### 2.2 Core Stepper Algorithm (Unchanged)

**Interaction Traversal:**

```
Initialize:
  cursorA = 0 (Proponent design)
  cursorB = 0 (Opponent design)
  side = 'A' (start with Proponent)
  pairs = []
  status = 'ONGOING'

Loop (max `fuel` steps):
  1. Find next positive act from current side (A or B)
     - If DAIMON → status = 'CONVERGENT', break
     - If none found → status = 'STUCK', break
  
  2. Check phase restrictions (focus-P/focus-O)
     - If not allowed in current phase → status = 'ONGOING', break
  
  3. Find matching negative act from opposite side
     - Must be at SAME locus as positive act
     - If additive parent → respect usedAdditive choice
     - If virtualNegPaths → synthesize virtual negative
  
  4. If no matching negative found:
     - Check if drawAtPaths → status = 'CONVERGENT' (consensus draw)
     - Otherwise → status = 'DIVERGENT', break
  
  5. Record pair: { posActId, negActId, locusPath, ts }
  
  6. Advance cursors and alternate side
  
  7. Continue until convergence/divergence/fuel exhausted
  
Post-Loop:
  - Compute decisiveIndices (explain-why chain)
  - Compute daimonHints (closed loci)
  - Detect endorsement (ACK at final locus)
  - Persist trace to DB (LudicTrace table)
  - Emit hook: Hooks.onTraversal(...)
```

**Key Invariants:**
- ✅ **Alternation:** Positive and negative acts alternate at each locus
- ✅ **Locality:** Acts only match if they're at the **same locus path**
- ✅ **Additivity:** Once a child is chosen in an additive branch, that choice persists
- ✅ **Termination:** Stops at daimon, divergence, or fuel limit

### 2.3 What Changed (Scoped Designs Impact)

**Before (Foundational):**
- Assumption: Exactly 2 designs per deliberation (Proponent vs Opponent)
- Step was called once per deliberation
- Result: Single global trace

**After (Phase 4 Scoped Designs):**
- Reality: 2N designs (N scopes × 2 polarities)
- Step must be called **per scope pair** (P_scope1, O_scope1), (P_scope2, O_scope2), ...
- Result: **N independent traces**, one per scope

**New GET Endpoint (Phase 4):**

```typescript
// File: app/api/ludics/step/route.ts
// GET handler added to support per-scope stepping

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deliberationId = searchParams.get('deliberationId');
  const scope = searchParams.get('scope');        // ← NEW: filter by scope
  const scopeType = searchParams.get('scopeType'); // ← NEW: filter by type
  
  // Find designs for this deliberation (optionally filtered by scope)
  const where: any = { deliberationId };
  if (scope !== null && scope !== undefined) {
    where.scope = scope === 'null' ? null : scope;
  }
  if (scopeType) {
    where.scopeType = scopeType;
  }
  
  const allDesigns = await prisma.ludicDesign.findMany({ where });
  
  // Group by scope and find first scope with both P and O
  const byScope = new Map<string | null, typeof allDesigns>();
  for (const design of allDesigns) {
    const key = design.scope;
    if (!byScope.has(key)) byScope.set(key, []);
    byScope.get(key)!.push(design);
  }
  
  let posDesign, negDesign;
  for (const [scopeKey, scopeDesigns] of byScope.entries()) {
    const p = scopeDesigns.find(d => d.participantId === 'Proponent');
    const o = scopeDesigns.find(d => d.participantId === 'Opponent');
    if (p && o) {
      posDesign = p;
      negDesign = o;
      break;
    }
  }
  
  if (!posDesign || !negDesign) {
    return NextResponse.json({ 
      ok: false, 
      error: `Could not find P/O pair. Found ${allDesigns.length} designs across ${byScope.size} scopes` 
    }, { status: 404 });
  }
  
  // Run stepper
  const trace = await stepInteraction({
    dialogueId: deliberationId,
    posDesignId: posDesign.id,
    negDesignId: negDesign.id,
    phase, maxPairs, compositionMode: 'assoc',
    virtualNegPaths: [], drawAtPaths: [],
  });
  
  return NextResponse.json({ ok: true, trace, posDesignId, negDesignId });
}
```

**Key Addition:** The GET endpoint now supports **scope filtering** to step specific scopes independently.

### 2.4 UI Trigger Points (Where Step is Called)

**LudicsPanel Step Button:**

```tsx
// File: components/deepdive/LudicsPanel.tsx
// Lines ~465-490

const step = React.useCallback(async () => {
  if (!designs?.length) return;
  setBusy("step");
  
  try {
    const pos = designs.find((d: any) => d.participantId === "Proponent") ?? designs[0];
    const neg = designs.find((d: any) => d.participantId === "Opponent") ?? 
                designs[1] ?? designs[0];
    
    const res = await fetch("/api/ludics/step", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        dialogueId: deliberationId,
        posDesignId: pos.id,
        negDesignId: neg.id,  // ← Picks FIRST P/O pair found (may be arbitrary scope!)
      }),
    }).then((r) => r.json());
    
    setTrace({ /* update */ });
    toast.show("Stepped", "ok");
  } finally {
    setBusy(false);
  }
}, [deliberationId, designs, toast]);
```

**Issue Found:** 
- Uses `designs.find(...)` which **picks the first P/O pair found**
- In multi-scope deliberations, this is **non-deterministic** (depends on DB order)
- No way for user to select **which scope to step**

**Contrast with Forest View (Correct):**

```tsx
// File: components/ludics/LudicsForest.tsx
// Lines ~149-165

// Fetch interaction trace PER SCOPE
const { data: traceData } = useSWR<{ ok: boolean; trace?: StepResult }>(
  deliberationId 
    ? `/api/ludics/step?deliberationId=${encodeURIComponent(deliberationId)}&phase=neutral&maxPairs=1024`
    : null,
  fetcher,
  { revalidateOnFocus: false }
);
```

**Observation:** Forest view uses the **GET endpoint** which handles scope selection automatically (finds first scope with P/O pair). However, it still doesn't give user **explicit scope selection**.

---

## Part 3: Other Ludics Commands Audit

### 3.1 Append Daimon

**Button Code:**
```tsx
<button
  className="btnv2"
  aria-label="Append daimon to next"
  onClick={appendDaimonToNext}
  disabled={!!busy}
>
  {busy === "append" ? "Working…" : "Append †"}
</button>
```

**Handler:**
```typescript
const appendDaimonToNext = React.useCallback(async () => {
  if (!designs?.length) return;
  
  // Need at least 2 designs (Proponent and Opponent)
  const B = designs.find((d: any) => d.participantId === "Opponent") ?? designs[1];
  if (!B) {
    toast.show("No Opponent design found", "err");
    return;
  }
  
  setBusy("append");
  try {
    const res = await fetch("/api/ludics/acts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        designId: B.id,  // ← Picks first Opponent design (arbitrary scope!)
        enforceAlternation: false,
        acts: [{ kind: "DAIMON" }],
      }),
    });
    
    toast.show("Daimon appended", "ok");
    await step();  // Re-run step after appending
  } catch (e: any) {
    toast.show(e?.message || "Append failed", "err");
  } finally {
    setBusy(false);
  }
}, [designs, step, toast]);
```

**Issues:**
1. **Scope Ambiguity:** Appends to first Opponent design found (may not be the scope user is viewing)
2. **No Locus Specification:** Doesn't ask user **which locus** to append daimon to
3. **Auto-Step:** Calls `step()` which may step a **different scope** than where daimon was appended

**Recommendation:** 
- Add locus picker (dropdown or tree selection)
- Pass scope context explicitly
- Only re-step the affected scope

### 3.2 Check Orthogonality

**Button Code:**
```tsx
<button
  className="btnv2"
  aria-label="Check orthogonality"
  onClick={checkOrthogonal}
  disabled={!!busy}
>
  {busy === "orth" ? "Checking…" : "Orthogonality"}
</button>
```

**Handler:**
```typescript
const checkOrthogonal = React.useCallback(async () => {
  if (!designs?.length) return;
  setBusy("orth");
  
  try {
    const A = designs.find((d: any) => d.participantId === "Proponent") ?? designs[0];
    const B = designs.find((d: any) => d.participantId === "Opponent") ?? designs[1] ?? designs[0];
    
    if (!A || !B) {
      toast.show("Missing designs for orthogonality check", "err");
      return;
    }
    
    const r = await fetch(
      `/api/ludics/orthogonal?dialogueId=${encodeURIComponent(deliberationId)}&posDesignId=${A.id}&negDesignId=${B.id}`
    ).then((r) => r.json());
    
    setOrthogonal(r?.orthogonal ?? null);
    if (r?.trace) {
      setTrace({ /* update */ });
    }
    toast.show(
      r?.orthogonal ? "Orthogonal ✓" : "Not orthogonal",
      r?.orthogonal ? "ok" : "err"
    );
    refreshOrth();
  } finally {
    setBusy(false);
  }
}, [designs, deliberationId, toast, refreshOrth]);
```

**Orthogonality Check Implementation:**
```typescript
// File: packages/ludics-engine/checkOrthogonal.ts
export async function checkOrthogonal(params: {
  dialogueId: string; 
  posDesignId: string; 
  negDesignId: string;
}) {
  const res = await stepInteraction({ 
    ...params, 
    maxPairs: 10000,  // ← Run until completion
    phase: 'neutral' 
  });
  
  const orthogonal = res.status === 'CONVERGENT';
  return { orthogonal, ...res };
}
```

**Issues:**
1. **Scope Ambiguity:** Checks first P/O pair found (may not be relevant scope)
2. **No Multi-Scope Check:** In scoped deliberations, **each scope can have independent orthogonality**
   - Scope A: Orthogonal (both sides agree on climate change)
   - Scope B: Non-orthogonal (deadlock on nuclear policy)
3. **UI Misleading:** Shows single orthogonality status for entire deliberation (oversimplification)

**Recommendation:**
- Check orthogonality **per scope** and display in forest view
- Add scope-level badges: ✓ Orthogonal, ✗ Non-orthogonal
- Aggregate: "3/5 scopes orthogonal"

### 3.3 Analyze NLI

**Button Code:**
```tsx
<button
  className="btnv2"
  aria-label="Analyze NLI"
  onClick={analyzeNLI}
  disabled={!!busy}
>
  {busy === "nli" ? "Analyzing…" : "NLI"}
</button>
```

**Handler:**
```typescript
const analyzeNLI = React.useCallback(async () => {
  if (!trace || !designs?.length) return;
  setBusy("nli");
  
  try {
    const pairs = (trace.pairs ?? [])
      .map((p) => ({
        premise: String(byAct.get(p.posActId)?.expression ?? ""),
        hypothesis: String(byAct.get(p.negActId)?.expression ?? ""),
      }))
      .filter(p => p.premise && p.hypothesis); // Filter out empty pairs
    
    if (pairs.length === 0) {
      toast.show("No valid pairs to analyze", "err");
      return;
    }
    
    const res = await fetch("/api/nli/batch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pairs }),  // ← Batch NLI inference
    }).then((r) => r.json());

    const TAU = Number(process.env.NEXT_PUBLIC_CQ_NLI_THRESHOLD ?? "0.72");
    const b: Record<number, string> = {};
    
    res?.results?.forEach((r: any, i: number) => {
      if (r?.relation === "contradicts" && (r.score ?? 0) >= TAU)
        b[i] = "NLI⊥";  // Mark contradictions
    });
    
    setBadges(b);  // Display badges on trace ribbon
  } finally {
    setBusy(false);
  }
}, [trace, designs, byAct]);
```

**Issues:**
1. **Uses Current Trace:** Operates on **whatever trace is loaded** (may be arbitrary scope)
2. **No Scope Context:** Doesn't indicate **which scope's trace** was analyzed
3. **Badge State:** Badges are stored in local state (lost on unmount, not persisted)

**Recommendation:**
- Run NLI **per scope** and persist results
- Add NLI metadata to `LudicTrace.extJson`
- Display NLI badges in forest view per scope

### 3.4 Stable Sets

**Button Code:**
```tsx
<button
  className="btnv2 btnv2--ghost"
  aria-label="Stable sets"
  onClick={checkStable}
>
  Stable sets
</button>
```

**Handler:**
```typescript
const checkStable = React.useCallback(async () => {
  setBusy("orth");
  try {
    const res = await fetch(
      `/api/af/stable?deliberationId=${encodeURIComponent(deliberationId)}`
    ).then((r) => r.json());
    
    if (!res.ok) {
      toast.show(res.error || "Failed to compute stable sets", "err");
      return;
    }
    
    setStable(res.count ?? 0);
    toast.show(`Found ${res.count ?? 0} stable extension(s)`, "ok");
  } catch (e: any) {
    toast.show("Stable sets computation failed", "err");
  } finally {
    setBusy(false);
  }
}, [deliberationId, toast]);
```

**Stable Sets API:**
```typescript
// File: app/api/af/stable/route.ts (assumed endpoint)
// Computes stable extensions of abstract argumentation framework

// Input: deliberationId
// Output: { ok: true, count: number, extensions: Extension[] }
```

**Issues:**
1. **Global Computation:** Computes stable sets for **entire deliberation** (all scopes mixed)
2. **May Not Reflect Scopes:** If scopes represent independent topics, mixing them is semantically wrong
   - Example: Climate change arguments and nuclear policy arguments shouldn't be in same AF
3. **No Per-Scope Stability:** Can't answer "Is Scope A stable?" independently

**Recommendation:**
- Add `scope` parameter to `/api/af/stable`
- Compute stable sets **per scope**
- Display in forest view: "Scope A: 2 stable extensions, Scope B: 0 (inconsistent)"

### 3.5 Trace Log

**Button Code:**
```tsx
<button
  className="btnv2 btnv2--ghost"
  aria-label="Trace Log"
  onClick={() => setShowGuide((v) => !v)}
>
  {showGuide ? "Hide log" : "Trace log"}
</button>
```

**What it Shows:**
```typescript
// Narrated trace (human-readable)
const lines = orthoData?.trace
  ? narrateTrace(orthoData.trace, actsForNarration)
  : [];

// Example output:
// 1) Proponent opens at 0.1: "Climate change is real"
// 2) Opponent challenges at 0.1: "WHY?"
// 3) Proponent responds at 0.1.1: "IPCC Report 2021"
// 4) Opponent accepts at 0.1.1: "ACK"
// 5) CONVERGENT at locus 0.1
```

**Issues:**
1. **Displays Current Trace:** Shows whatever trace is loaded (may be arbitrary scope in multi-scope)
2. **No Scope Label:** Doesn't say **which scope's trace** this is
3. **Mixed Trace:** If trace is from legacy mode (all scopes merged), log is confusing

**Recommendation:**
- Add scope header: "Trace for Scope: topic:climate-change"
- In forest view, show trace **per scope** in collapsible cards

### 3.6 Attach Testers

**Button Code:**
```tsx
<button
  className="btnv2 btnv2--ghost"
  onClick={() => setShowAttach((v) => !v)}
  aria-expanded={showAttach}
>
  {showAttach ? "Hide testers" : "Attach testers"}
</button>
```

**What it Does:**
```typescript
// Opens dropdown to select IH/TC work
// Fetches suggested testers from work
// Attaches testers by stepping with virtualNegPaths

<select value={attachPick} onChange={(e) => setAttachPick(e.target.value)}>
  <option value="">— Select IH/TC Work —</option>
  {attachCandidates.map((w) => (
    <option key={w.id} value={w.id}>
      {w.title} [{w.theoryType}]
    </option>
  ))}
</select>

<button onClick={async () => {
  const j = await fetch(`/api/works/${attachPick}/ludics-testers`).then(r => r.json());
  
  const r = await fetch("/api/ludics/step", {
    method: "POST",
    body: JSON.stringify({
      dialogueId: deliberationId,
      posDesignId: pos.id,
      negDesignId: neg.id,
      testers: j?.testers ?? [],
      fuel: 2048,
    }),
  });
  
  toast.show("Testers attached", "ok");
}}>
  Attach
</button>
```

**Issues:**
1. **Scope Unclear:** Attaches testers to **first P/O pair** found (may not be relevant scope)
2. **No Scope Selection:** Can't specify **which scope** to test
3. **Work-to-Scope Mapping:** No way to associate works with specific scopes
   - Example: "IPCC Report" work should only test climate scope, not nuclear scope

**Recommendation:**
- Add scope filter to work selection: "Show works relevant to this scope"
- Attach testers **per scope** with explicit selection
- Store work-to-scope associations in `Work.extJson`

---

## Part 4: Gaps & Recommendations

### 4.1 Critical Gaps

| Gap | Severity | Impact |
|-----|----------|--------|
| **Compile button doesn't support scoping** | 🔴 High | Users can't change scoping strategy from LudicsPanel |
| **Step button picks arbitrary scope** | 🔴 High | Non-deterministic in multi-scope deliberations |
| **Orthogonality is global, not per-scope** | 🟡 Medium | Misleading: one scope may be orthogonal, another not |
| **NLI analysis operates on arbitrary trace** | 🟡 Medium | Results may not match user's current scope view |
| **Append Daimon doesn't specify scope or locus** | 🟠 Medium | Confusing: daimon appears in unexpected scope |
| **Stable sets are global, not per-scope** | 🟡 Medium | Mixing independent topics is semantically wrong |
| **Trace log doesn't label scope** | 🟢 Low | Confusing but not breaking |
| **Testers attach to arbitrary scope** | 🟠 Medium | Testing wrong scope wastes time |

### 4.2 Actionable Recommendations

#### Recommendation 1: Update LudicsPanel Compile Button

**Current (Broken):**
```tsx
<button onClick={() => compileStep("neutral")}>
  Compile
</button>
```

**Proposed (Fixed):**
```tsx
<button onClick={() => handleRecompileWithStrategy()}>
  Compile
</button>

// Handler:
const handleRecompileWithStrategy = async () => {
  const strategy = scopingStrategy ?? 'legacy';  // Get from state
  
  const res = await fetch('/api/ludics/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deliberationId,
      scopingStrategy: strategy,
      forceRecompile: true,
    }),
  });
  
  if (!res.ok) { /* error */ }
  
  // Sync to AIF
  await fetch('/api/ludics/sync-to-aif', {
    method: 'POST',
    body: JSON.stringify({ deliberationId }),
  });
  
  // Invalidate caches
  await fetch('/api/ludics/insights/invalidate', {
    method: 'POST',
    body: JSON.stringify({ deliberationId }),
  });
  
  await mutateDesigns();
};
```

#### Recommendation 2: Add Scope Selector to LudicsPanel

**Add UI Component:**
```tsx
<div className="scope-selector">
  <label>Scoping Strategy:</label>
  <select 
    value={scopingStrategy} 
    onChange={(e) => setScopingStrategy(e.target.value)}
  >
    <option value="legacy">Legacy (Monolithic)</option>
    <option value="topic">Topic-Based</option>
    <option value="actor-pair">Actor-Pair</option>
    <option value="argument">Argument-Thread</option>
  </select>
  
  {designs.length > 2 && (
    <>
      <label>Active Scope:</label>
      <select 
        value={activeScope} 
        onChange={(e) => setActiveScope(e.target.value)}
      >
        {scopes.map(scope => (
          <option key={scope} value={scope}>
            {scopeLabels[scope] || scope}
          </option>
        ))}
      </select>
    </>
  )}
</div>
```

#### Recommendation 3: Update Step Button to Use Active Scope

**Current (Broken):**
```typescript
const step = React.useCallback(async () => {
  const pos = designs.find((d: any) => d.participantId === "Proponent") ?? designs[0];
  const neg = designs.find((d: any) => d.participantId === "Opponent") ?? designs[1];
  // ...
}, [designs]);
```

**Proposed (Fixed):**
```typescript
const step = React.useCallback(async () => {
  // Filter designs by active scope
  const scopeDesigns = designs.filter(d => d.scope === activeScope);
  
  const pos = scopeDesigns.find(d => d.participantId === "Proponent");
  const neg = scopeDesigns.find(d => d.participantId === "Opponent");
  
  if (!pos || !neg) {
    toast.show(`No P/O pair found for scope: ${activeScope}`, "err");
    return;
  }
  
  const res = await fetch("/api/ludics/step", {
    method: "POST",
    body: JSON.stringify({
      dialogueId: deliberationId,
      posDesignId: pos.id,
      negDesignId: neg.id,
    }),
  });
  
  setTrace(res.trace);
  toast.show(`Stepped scope: ${scopeLabels[activeScope]}`, "ok");
}, [designs, activeScope, scopeLabels]);
```

#### Recommendation 4: Make Orthogonality Per-Scope

**Proposed API Update:**
```typescript
// GET /api/ludics/orthogonal?deliberationId=X&scope=topic:climate
// Returns: { ok: true, orthogonal: true, scope: "topic:climate", trace: {...} }

// Or batch:
// GET /api/ludics/orthogonal/batch?deliberationId=X
// Returns: { 
//   ok: true, 
//   results: [
//     { scope: "topic:climate", orthogonal: true },
//     { scope: "topic:nuclear", orthogonal: false },
//   ]
// }
```

**Proposed UI Update:**
```tsx
// In LudicsForest, per-scope orthogonality badge
{scopeDesigns.map((design: any) => (
  <DesignTreeView
    key={design.id}
    design={design}
    orthogonalityStatus={orthogonalityByScope[design.scope]}  // ← New prop
  />
))}

// Badge display:
{orthogonalityStatus === true && <span className="badge badge-success">✓ Orthogonal</span>}
{orthogonalityStatus === false && <span className="badge badge-error">✗ Non-orthogonal</span>}
```

#### Recommendation 5: Append Daimon Improvements

**Add Locus Picker:**
```tsx
<div className="append-daimon-panel">
  <label>Append Daimon to Locus:</label>
  <select value={targetLocus} onChange={(e) => setTargetLocus(e.target.value)}>
    {availableLoci.map(locus => (
      <option key={locus.path} value={locus.path}>
        {locus.path} {locus.openings.length === 0 && "(closed)"}
      </option>
    ))}
  </select>
  
  <label>In Scope:</label>
  <select value={targetScope} onChange={(e) => setTargetScope(e.target.value)}>
    {scopes.map(scope => (
      <option key={scope} value={scope}>
        {scopeLabels[scope]}
      </option>
    ))}
  </select>
  
  <button onClick={appendDaimon} disabled={!targetLocus || !targetScope}>
    Append †
  </button>
</div>
```

**Handler:**
```typescript
const appendDaimon = async () => {
  const scopeDesigns = designs.filter(d => d.scope === targetScope);
  const oppDesign = scopeDesigns.find(d => d.participantId === "Opponent");
  
  if (!oppDesign) {
    toast.show("No Opponent design in this scope", "err");
    return;
  }
  
  await fetch("/api/ludics/acts", {
    method: "POST",
    body: JSON.stringify({
      designId: oppDesign.id,
      acts: [{
        kind: "DAIMON",
        locusPath: targetLocus,  // ← Explicit locus
      }],
    }),
  });
  
  // Re-step only this scope
  await stepScope(targetScope);
  
  toast.show(`Daimon appended at ${targetLocus} in scope ${targetScope}`, "ok");
};
```

#### Recommendation 6: NLI Per-Scope

**Proposed Implementation:**
```typescript
const analyzeNLIForScope = async (scope: string) => {
  // Get trace for this scope
  const traceRes = await fetch(
    `/api/ludics/step?deliberationId=${deliberationId}&scope=${scope}`
  );
  const { trace } = await traceRes.json();
  
  // Run NLI
  const pairs = trace.pairs.map(p => ({
    premise: byAct.get(p.posActId)?.expression,
    hypothesis: byAct.get(p.negActId)?.expression,
  }));
  
  const nliRes = await fetch("/api/nli/batch", {
    method: "POST",
    body: JSON.stringify({ pairs }),
  });
  const { results } = await nliRes.json();
  
  // Persist NLI results to trace
  await fetch("/api/ludics/trace/update", {
    method: "POST",
    body: JSON.stringify({
      deliberationId,
      scope,
      extJson: {
        nliResults: results,
        nliTimestamp: new Date().toISOString(),
      },
    }),
  });
  
  return results;
};
```

**UI Display:**
```tsx
// In forest view, per-scope NLI badge
<button onClick={() => analyzeNLIForScope(scope)}>
  Analyze NLI
</button>

{nliResults[scope] && (
  <div className="nli-summary">
    {nliResults[scope].filter(r => r.relation === 'contradicts').length} contradictions found
  </div>
)}
```

---

## Part 5: Documentation Gaps

### 5.1 Outdated References

**Files with Stale Assumptions:**

1. **`LUDICS_DIALOGUE_INTEGRATION_EXPLAINED.md`**
   - Still assumes 2 designs per deliberation
   - Doesn't mention scoped designs
   - **Needs Update:** Add section on scoped compilation

2. **`LUDICS_SYSTEM_ARCHITECTURE_MAP.md`**
   - Data flow diagram shows single P/O pair
   - **Needs Update:** Add scoped designs flow diagram

3. **`ludics-commands.ts`** (lib/dialogue/ludics-commands.ts)
   - Comment says: "Compile dialogue moves into Ludics designs" (singular)
   - Doesn't mention scoping strategy parameter
   - **Needs Update:** Update JSDoc to reflect scoping

4. **Component Comments**
   - Many components still say "Proponent vs Opponent" (singular)
   - **Needs Update:** Change to "Per-scope Proponent/Opponent pairs"

### 5.2 Missing Documentation

**What Needs to be Written:**

1. **`SCOPED_DESIGNS_USER_GUIDE.md`**
   - When to use each scoping strategy
   - How to interpret forest view
   - How to step/analyze individual scopes
   - Troubleshooting multi-scope deliberations

2. **`LUDICS_API_REFERENCE.md`**
   - Complete endpoint list with examples
   - Scope filtering parameters
   - Expected response formats
   - Error codes and handling

3. **`LUDICS_PHASE_4_MIGRATION_GUIDE.md`**
   - How existing deliberations are handled
   - How to re-compile with new strategy
   - Performance considerations (N scopes vs 1)
   - When to use legacy vs scoped mode

4. **`LUDICS_TESTING_GUIDE.md`**
   - How to write tests for scoped designs
   - Example test cases
   - Integration test patterns
   - Performance benchmarks

---

## Part 6: Next Steps

### Priority 1: Fix Critical Gaps (Estimated: 3-4 hours)

1. **Update LudicsPanel Compile Button** (1 hour)
   - Add `scopingStrategy` state
   - Use `/api/ludics/compile` endpoint
   - Add dropdown for strategy selection
   - Wire up AIF sync and cache invalidation

2. **Update LudicsPanel Step Button** (1 hour)
   - Add `activeScope` state
   - Filter designs by scope before stepping
   - Update button label to show active scope

3. **Add Scope Selector Component** (1 hour)
   - Create reusable `ScopeSelector` component
   - Integrate into LudicsPanel header
   - Show scope count and active scope label

4. **Update Orthogonality Check** (1 hour)
   - Add scope parameter to API
   - Check orthogonality per scope
   - Display per-scope badges in forest view

### Priority 2: Enhance Commands (Estimated: 4-5 hours)

5. **Improve Append Daimon** (1.5 hours)
   - Add locus picker
   - Add scope selector
   - Only re-step affected scope

6. **Add NLI Per-Scope** (1.5 hours)
   - Compute NLI per scope
   - Persist to trace extJson
   - Display in forest view

7. **Update Stable Sets** (1 hour)
   - Add scope parameter to AF API
   - Compute per scope
   - Display in forest view

8. **Update Testers Attach** (1 hour)
   - Add scope selector
   - Filter works by scope relevance
   - Only attach to selected scope

### Priority 3: Documentation (Estimated: 3-4 hours)

9. **Update Existing Docs** (1.5 hours)
   - Fix LUDICS_DIALOGUE_INTEGRATION_EXPLAINED.md
   - Update LUDICS_SYSTEM_ARCHITECTURE_MAP.md
   - Update component comments

10. **Write New Docs** (2.5 hours)
    - SCOPED_DESIGNS_USER_GUIDE.md
    - LUDICS_API_REFERENCE.md
    - LUDICS_PHASE_4_MIGRATION_GUIDE.md

### Priority 4: Testing (Estimated: 2-3 hours)

11. **Write Unit Tests** (1 hour)
    - Test scope filtering in step/compile
    - Test per-scope orthogonality
    - Test cross-scope references

12. **Write Integration Tests** (1 hour)
    - Test multi-scope compilation
    - Test forest view rendering
    - Test scope-scoped operations

13. **Manual QA** (1 hour)
    - Test with real deliberation data
    - Verify all buttons work with scopes
    - Test edge cases (0 scopes, 100 scopes)

---

## Part 7: Conclusion

### Summary of Findings

**What's Working Well:**
- ✅ Core stepper algorithm is sound and unchanged
- ✅ Scoped designs architecture (Phase 4) is fully implemented
- ✅ Forest view correctly visualizes independent scopes
- ✅ Backward compatibility maintained (legacy mode works)
- ✅ API endpoints support scope filtering

**What Needs Updating:**
- ⚠️ LudicsPanel UI buttons still use legacy single-scope assumptions
- ⚠️ Commands (orthogonality, NLI, daimon, testers) don't respect scopes
- ⚠️ Documentation references outdated architecture
- ⚠️ Some API endpoints lack scope parameters

**Risk Assessment:**
- 🔴 **High Risk:** Users may get confused or wrong results in multi-scope deliberations
- 🟡 **Medium Risk:** Performance may degrade with many scopes (needs optimization)
- 🟢 **Low Risk:** Backward compatibility ensured (legacy mode works)

### Recommended Path Forward

**Phase 1 (Critical - Week 1):**
1. Fix LudicsPanel buttons to support scoping
2. Add scope selector to UI
3. Update orthogonality/NLI/daimon to be scope-aware

**Phase 2 (Enhancement - Week 2):**
4. Per-scope stable sets
5. Per-scope testers
6. Update documentation

**Phase 3 (Testing - Week 3):**
7. Write comprehensive tests
8. Manual QA with real data
9. Performance profiling and optimization

**Success Metrics:**
- All LudicsPanel buttons work correctly in multi-scope mode
- Users can select and operate on individual scopes
- Documentation accurately reflects scoped architecture
- Test coverage >80% for scoped operations

---

**End of Audit Report**
