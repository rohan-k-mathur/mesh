# Ludics-Dialogue Integration: How AIF Moves Become Ludics Acts

**Date:** November 27, 2025 (Updated)  
**Last Major Update:** November 4, 2025 (Phase 4 Scoped Designs)  
**Context:** Understanding the current state and ideal design of the DialogueMove → LudicAct → AifNode pipeline

---

## Current State: How It Works Today

### The Pipeline Flow

```
User Action (UI)
    ↓
POST /api/dialogue/move
    ↓
DialogueMove created in DB
    ↓
compileFromMoves(deliberationId)
    ↓
LudicDesign + LudicAct created
    ↓
syncLudicsToAif(deliberationId)
    ↓
AifNode created (linked to LudicAct)
    ↓
invalidateInsightsCache(deliberationId)
```

### When Compilation Happens

**Location:** `app/api/dialogue/move/route.ts` (lines 519-530)

```typescript
// After creating DialogueMove:
if (autoCompile && !(dedup && (kind === 'WHY' || kind === 'GROUNDS'))) {
  // 1. Compile dialogue moves into Ludics designs
  await compileFromMoves(deliberationId).catch(() => {});
  
  // 2. Sync Ludics acts to AIF nodes (Phase 1)
  await syncLudicsToAif(deliberationId).catch((err) => {
    console.error("[ludics] Failed to sync to AIF:", err);
  });
  
  // 3. Invalidate insights cache (Phase 1)
  await invalidateInsightsCache(deliberationId).catch((err) => {
    console.error("[ludics] Failed to invalidate cache:", err);
  });
}
```

**Triggers:**
- ✅ Every DialogueMove POST (unless deduplicated WHY/GROUNDS)
- ✅ Automatic on ASSERT, RETRACT, CLOSE, THEREFORE, SUPPOSE, DISCHARGE
- ⚠️ Skipped on deduplicated WHY/GROUNDS (optimization)

---

## The Compilation Process (compileFromMoves)

**Location:** `packages/ludics-engine/compileFromMoves.ts`

### Step 1: Clean Slate

```typescript
// Wipe existing Ludics data (idempotent)
await tx.ludicChronicle.deleteMany({ where: { design: { deliberationId } } });
await tx.ludicAct.deleteMany({ where: { design: { deliberationId } } });
await tx.ludicTrace.deleteMany({ where: { deliberationId } });
await tx.ludicDesign.deleteMany({ where: { deliberationId } });
```

**Why:** Full recompilation from DialogueMoves ensures consistency (no stale acts)

### Step 2: Create Designs

```typescript
// Create Proponent and Opponent designs
const P = await tx.ludicDesign.create({
  data: {
    deliberationId,
    participantId: 'Proponent',
    rootLocusId: root.id,
    extJson: { role: 'pro', source: 'compile' },
  },
});

const O = await tx.ludicDesign.create({
  data: {
    deliberationId,
    participantId: 'Opponent',
    rootLocusId: root.id,
    extJson: { role: 'opp', source: 'compile' },
  },
});
```

### Step 3: Transform Moves to Acts

**Move Types and Their Mappings:**

#### 1. ASSERT → Proponent Act (Opener)

```typescript
// DialogueMove { kind: 'ASSERT', payload: { text: '...', additive: false } }
//    ↓
// LudicAct { kind: 'PROPER', polarity: 'P', locus: '0.1', expression: '...' }

const locus = explicitPath ?? `0.${++nextTopIdx}`;
outActs.push({
  designId: P.id,
  act: {
    kind: 'PROPER',
    polarity: 'P',
    locus,
    ramification: ['1'],
    expression: text,
    isAdditive: !!payload.additive,
  },
});
```

**Locus Assignment:**
- Top-level claims get `0.1`, `0.2`, `0.3` (incrementing)
- Anchored to target (claim/argument) for later WHY/GROUNDS

#### 2. WHY → Opponent Act (Challenge)

```typescript
// DialogueMove { kind: 'WHY', targetType: 'claim', targetId: 'C_xyz', payload: { cqId: 'ac-2' } }
//    ↓
// LudicAct { kind: 'PROPER', polarity: 'O', locus: '0.1', expression: 'WHY...' }

const anchor = anchorForTarget.get(targetKey) ?? lastAssertLocus ?? '0';
outActs.push({
  designId: O.id,
  act: {
    kind: 'PROPER',
    polarity: 'O',
    locus: anchor,  // Same locus as the claim being challenged
    ramification: [],
    expression: `WHY ${cqId}`,
  },
});
```

**Key Feature:** WHY uses the **same locus** as the target claim (convergent interaction)

#### 3. GROUNDS → Proponent Act (Response)

```typescript
// DialogueMove { kind: 'GROUNDS', targetType: 'claim', targetId: 'C_xyz', payload: { cqId: 'ac-2', brief: '...' } }
//    ↓
// LudicAct { kind: 'PROPER', polarity: 'P', locus: '0.1.1', expression: '...' }

const parentLocus = anchorForTarget.get(targetKey) ?? '0';
const childLocus = pickChild(parentLocus, explicitChild);
outActs.push({
  designId: P.id,
  act: {
    kind: 'PROPER',
    polarity: 'P',
    locus: childLocus,  // Child of the WHY locus (0.1 → 0.1.1)
    ramification: [],
    expression: brief,
  },
});
```

**Key Feature:** GROUNDS creates a **child locus** (depth increases)

#### 4. CLOSE → Daimon (Convergence)

```typescript
// DialogueMove { kind: 'CLOSE', targetType: 'claim', targetId: 'C_xyz' }
//    ↓
// LudicAct { kind: 'DAIMON', expression: 'END' }

const anchor = anchorForTarget.get(targetKey) ?? '0';
outActs.push({
  designId: design.id,  // Either P or O depending on who closes
  act: {
    kind: 'DAIMON',
    expression: 'END',
  },
});
```

**Key Feature:** Daimon (†) signals convergence at a locus

#### 5. Multi-Act Payloads (Advanced)

```typescript
// DialogueMove { payload: { acts: [
//   { polarity: 'pos', locusPath: '0.1', expression: 'claim', openings: ['1', '2'] },
//   { polarity: 'neg', locusPath: '0.1', expression: 'challenge' },
//   { polarity: 'pos', locusPath: '0.1.1', expression: 'response' },
// ] } }
//    ↓
// Multiple LudicActs created in sequence

for (const a of payload.acts) {
  outActs.push({
    designId: designFor(a.polarity).id,
    act: {
      kind: a.polarity === 'daimon' ? 'DAIMON' : 'PROPER',
      polarity: a.polarity === 'pos' ? 'P' : 'O',
      locus: a.locusPath,
      expression: a.expression,
      isAdditive: !!a.additive,
    },
  });
}
```

**Key Feature:** Allows complex dialogical sequences in a single move (used by ludics-qa.ts)

---

## The Sync Process (syncLudicsToAif)

**Location:** `lib/ludics/syncToAif.ts`

### Step 1: Fetch All Acts

```typescript
const acts = await prisma.ludicAct.findMany({
  where: { design: { deliberationId } },
  include: { design: true, locus: true },
  orderBy: { orderInDesign: "asc" },
});
```

### Step 2: Create AifNodes

```typescript
for (const act of acts) {
  const existingNode = nodesByActId.get(act.id);
  
  if (!existingNode) {
    // Create new AifNode
    const aifNode = await prisma.aifNode.create({
      data: {
        deliberationId,
        nodeKind: mapActToNodeKind(act),  // "I", "RA", or "DM"
        ludicActId: act.id,  // 👈 Link to LudicAct
        locusPath: act.locus?.path ?? "0",
        locusRole: determineLocusRole(act),  // "opener", "responder", "daimon"
        text: act.expression ?? "",
        nodeSubtype: "ludics_act",
        dialogueMetadata: {
          ludicPolarity: act.polarity,
          ludicKind: act.kind,
          isAdditive: act.isAdditive,
          designId: act.designId,
        },
      },
    });
  }
}
```

**Mapping Rules:**

| LudicAct | AifNode Kind | Role | Description |
|----------|-------------|------|-------------|
| `kind: PROPER, polarity: P` | `I` (Information) | `opener` | Proponent claim/assertion |
| `kind: PROPER, polarity: O` | `I` (Information) | `responder` | Opponent challenge/question |
| `kind: DAIMON` | `DM` (Dialogue Move) | `daimon` | Convergence marker (†) |
| `metaJson.targetType: argument` | `RA` (Rule Application) | varies | Linked to inference/scheme |

### Step 3: Create AifEdges (Justification)

```typescript
// If act has justifiedByLocus metadata, create edge
const justifiedByLocus = act.metaJson?.justifiedByLocus;
if (justifiedByLocus) {
  const parentAct = acts.find(a => 
    a.locus?.path === justifiedByLocus && 
    a.design.id === act.design.id
  );
  
  if (parentAct && parentNode) {
    await prisma.aifEdge.create({
      data: {
        deliberationId,
        sourceId: aifNode.id,
        targetId: parentNode.id,
        edgeRole: "justifiedBy",
      },
    });
  }
}
```

---

## Current Gaps & Issues

### ❌ Gap 1: Attack Moves Not Mapped

**Problem:**
- Undercutting a premise (UNDERCUT)
- Rebutting a conclusion (REBUT)
- Undermining evidence (UNDERMINE)

These are **AIF-level attack types** but don't have explicit Ludics mappings.

**Current Workaround:**
- Attacks are stored in `ArgumentAttack` or `ConflictApplication` tables
- No direct LudicAct representation
- Ludics sees them as generic WHY challenges

**Impact:**
- Insights don't distinguish attack types
- Badges don't show attack-specific metrics
- Trace doesn't visualize attack structure

### ❌ Gap 2: Scheme Information Lost

**Problem:**
- DialogueMoves have `{ payload: { schemeKey: 'Consequences', cqId: 'ac-2' } }`
- LudicActs have `{ expression: 'WHY ac-2' }` (string only)
- Scheme provenance not preserved in Ludics layer

**Current Workaround:**
- Schemes stored separately in `ArgumentScheme`, `SchemeInstance` tables
- AifNode.dialogueMetadata could store scheme info (not currently used)

**Impact:**
- Can't filter Ludics insights by scheme type
- Can't show "Expert Opinion arguments have 3 decisive steps" metric
- Trace doesn't highlight scheme-based reasoning

### ❌ Gap 3: Bidirectional Sync Missing

**Problem:**
- Sync is **one-way**: DialogueMove → LudicAct → AifNode
- No reverse: LudicAct → DialogueMove creation
- Can't create moves directly from Ludics UI

**Current Workaround:**
- All moves must originate from dialogue API
- LudicsPanel is **read-only** (view interaction, can't create moves)

**Impact:**
- Users can't add acts directly in Ludics UI
- "Add Commitment" command (⚓) not wired to create DialogueMove
- Ludics feels like a separate system, not integrated

### ❌ Gap 4: Deduplication Skips Compilation

**Problem:**
```typescript
if (autoCompile && !(dedup && (kind === 'WHY' || kind === 'GROUNDS'))) {
  await compileFromMoves(deliberationId);
}
```

Deduplicated WHY/GROUNDS don't trigger recompilation.

**Why This Exists:**
- Performance optimization (don't recompile for duplicate CQs)
- Assumes identical WHY/GROUNDS doesn't change Ludics structure

**Impact:**
- If dedup logic is wrong, Ludics gets out of sync
- Insights stale until next non-deduplicated move
- Cache not invalidated

### ⚠️ Gap 5: Full Recompilation on Every Move

**Problem:**
- `compileFromMoves` **deletes** all acts and rebuilds from scratch
- Expensive for large deliberations (100+ moves)

**Why This Exists:**
- Ensures consistency (no orphaned acts)
- Simpler than incremental updates
- Ludics locus tree can change retroactively (delocations)

**Impact:**
- Slow for active deliberations
- Database churn (delete + recreate)
- Race conditions possible (multiple concurrent moves)

---

## Ideal Design: How It Should Work

### 1. Explicit Attack Type Mapping

**Proposal:** Add `attackType` to DialogueMove payload and map to LudicAct metadata:

```typescript
// DialogueMove
{
  kind: 'WHY',
  targetType: 'argument',
  targetId: 'A_123',
  payload: {
    attackType: 'UNDERCUTS',  // 👈 New field
    cqId: 'as-1',
    targetScope: 'inference',
  }
}

// LudicAct
{
  kind: 'PROPER',
  polarity: 'O',
  locus: '0.1',
  expression: 'UNDERCUT: insufficient warrant',
  metaJson: {
    attackType: 'UNDERCUTS',  // 👈 Preserved
    targetScope: 'inference',
    cqId: 'as-1',
  }
}

// AifNode
{
  nodeKind: 'CA',  // Conflict node
  nodeSubtype: 'ludics_undercut',
  dialogueMetadata: {
    attackType: 'UNDERCUTS',  // 👈 Available for queries
  }
}
```

**Benefits:**
- Insights can compute "3 undercuts, 2 rebuttals" metrics
- Badges show attack type breakdown (⚔️ REBUT, 🛡️ UNDERCUT)
- Trace visualizes attack structure clearly

### 2. Preserve Scheme Provenance

**Proposal:** Store scheme metadata in LudicAct.metaJson:

```typescript
// LudicAct
{
  kind: 'PROPER',
  polarity: 'P',
  locus: '0.1.1',
  expression: 'expert has 15 years experience',
  metaJson: {
    schemeKey: 'Expert',  // 👈 Scheme that generated this act
    schemeId: 'si_xyz123',
    cqId: 'ae-1',
    cqText: 'Is the expert credible?',
  }
}
```

**Benefits:**
- Can filter insights: "Show only Expert Opinion arguments"
- Can compute: "Consequences schemes have higher convergence rate"
- Trace shows scheme badges on acts

### 3. Bidirectional Sync

**Proposal:** Add `POST /api/ludics/act` endpoint that creates both LudicAct AND DialogueMove:

```typescript
// User clicks "Add Commitment" in LudicsPanel
POST /api/ludics/act
{
  deliberationId: 'xxx',
  designId: 'P_design',
  locus: '0.1.2',
  expression: 'additional evidence...',
  polarity: 'P',
}

// Handler:
async function createLudicAct(req) {
  // 1. Create DialogueMove first (source of truth)
  const move = await prisma.dialogueMove.create({
    data: {
      deliberationId,
      kind: 'GROUNDS',
      targetType: 'claim',
      targetId: inferTargetFromLocus(locus),
      actorId: 'Proponent',
      payload: {
        acts: [{
          polarity: 'pos',
          locusPath: locus,
          expression,
        }],
      },
    },
  });
  
  // 2. Recompile (creates LudicAct)
  await compileFromMoves(deliberationId);
  
  // 3. Sync to AIF
  await syncLudicsToAif(deliberationId);
  
  return { ok: true, moveId: move.id };
}
```

**Benefits:**
- Ludics UI becomes **interactive** (not just visualization)
- Commands (⚓ Add Commitment, ⚡ Step) actually do something
- Single source of truth (DialogueMove) maintained

### 4. Incremental Compilation

**Proposal:** Track last compiled move timestamp, only compile new moves:

```typescript
// LudicDesign schema addition
model LudicDesign {
  // ... existing fields
  lastCompiledAt DateTime?
  lastCompiledMoveId String?
}

// compileFromMoves optimization
async function compileFromMoves(dialogueId: string) {
  const design = await prisma.ludicDesign.findFirst({
    where: { deliberationId: dialogueId },
    orderBy: { lastCompiledAt: 'desc' },
  });
  
  const newMoves = await prisma.dialogueMove.findMany({
    where: {
      deliberationId: dialogueId,
      createdAt: { gt: design?.lastCompiledAt ?? new Date(0) },
    },
    orderBy: { createdAt: 'asc' },
  });
  
  if (newMoves.length === 0) {
    return { ok: true, designs: [design.id], skipped: true };
  }
  
  // Append new acts (don't delete existing)
  for (const move of newMoves) {
    const acts = transformMoveToActs(move);
    await appendActs(design.id, acts);
  }
  
  await prisma.ludicDesign.update({
    where: { id: design.id },
    data: {
      lastCompiledAt: new Date(),
      lastCompiledMoveId: newMoves[newMoves.length - 1].id,
    },
  });
}
```

**Benefits:**
- 10-100x faster for large deliberations
- No delete churn
- Scales to thousands of moves

**Trade-offs:**
- More complex logic (handle retractions, delocations)
- Need migration for existing deliberations
- Full recompilation still needed occasionally (schema changes)

### 5. Argument-Specific Locus Assignment

**Proposal:** Map AIF argument structure to Ludics loci explicitly:

```typescript
// For REBUT (attack conclusion):
WHY at locus of conclusion → '0.1'

// For UNDERCUT (attack inference):
WHY at inference locus → '0.1.i' (special inference child)

// For UNDERMINE (attack premise):
WHY at premise locus → '0.1.p1', '0.1.p2' (premise children)

// GROUNDS responses:
GROUNDS at child of attack locus → '0.1.i.1', '0.1.p1.1'
```

**Benefits:**
- Trace visualization shows **where** attack targets
- Orthogonality check can detect "attacking same premise twice"
- Insights: "2 inference attacks, 1 premise attack"

---

## Phase 4: Scoped Designs Architecture (November 2025)

### Overview

**Date Implemented:** November 4, 2025  
**Purpose:** Support multi-scope deliberations where different topics/actors are tracked separately

Previously, `compileFromMoves()` created exactly **2 designs** (Proponent + Opponent) for the entire deliberation. Phase 4 extends this to create **2N designs** where N = number of scopes determined by the chosen scoping strategy.

### Scoping Strategies

Four strategies are now supported via the `scopingStrategy` parameter:

#### 1. **Legacy (Default)**
```typescript
// Single scope for entire deliberation
scopingStrategy: "legacy"
// → 2 designs: P + O (backward compatible)
```

#### 2. **Topic-Based Scoping**
```typescript
// Group by deliberation topic
scopingStrategy: "topic"
// → 2N designs where N = number of topics
// Example: Climate Policy (P+O), Budget (P+O), Healthcare (P+O) = 6 designs
```

#### 3. **Actor-Pair Scoping**
```typescript
// Group by interacting actor pairs
scopingStrategy: "actor-pair"
// → 2N designs where N = number of unique actor pairs
// Example: Alice-vs-Bob (P+O), Alice-vs-Carol (P+O) = 4 designs
```

#### 4. **Argument-Level Scoping**
```typescript
// Each argument gets its own scope
scopingStrategy: "argument"
// → 2N designs where N = number of arguments
// Example: Arg1 (P+O), Arg2 (P+O), Arg3 (P+O) = 6 designs
```

### Updated Schema (Phase 4)

```prisma
model LudicDesign {
  id              String   @id @default(cuid())
  deliberationId  String
  participantId   String   // "Proponent" | "Opponent"
  
  // NEW: Phase 4 scoping fields
  scope           String?  // "topic:climate" | "actors:Alice-Bob" | null for legacy
  scopeType       String?  // "topic" | "actor-pair" | "argument" | null
  scopeMetadata   Json?    // { label: "Climate Policy", topicId: "T_xyz", ... }
  
  rootLocusId     String
  semantics       String   @default("ludics-v1")
  // ... rest of fields
}
```

### Compilation Flow with Scopes

```
DialogueMoves
    ↓
computeScopes(scopingStrategy, moves)
    ↓
Group moves by computed scope
    ↓
For each scope:
  ├─ compileFromMoves(moves in scope)
  ├─ Create P + O designs with scope metadata
  └─ Store scope, scopeType, scopeMetadata
    ↓
Result: 2N designs (N scopes × 2 polarities)
```

**Example with Topic Scoping:**

```typescript
// Input: 20 moves across 3 topics
const moves = [
  { kind: 'ASSERT', topic: 'Climate', ... },  // 8 moves
  { kind: 'ASSERT', topic: 'Budget', ... },   // 7 moves
  { kind: 'ASSERT', topic: 'Healthcare', ... }, // 5 moves
];

await compileFromMoves(deliberationId, { scopingStrategy: 'topic' });

// Result: 6 designs
// ├─ Climate:P, Climate:O (8 moves compiled)
// ├─ Budget:P, Budget:O (7 moves compiled)
// └─ Healthcare:P, Healthcare:O (5 moves compiled)
```

### Per-Scope Operations

All Ludics operations now respect scope boundaries:

#### Stepping (Interaction)
```typescript
// Before Phase 4: Global step
await stepInteraction({ deliberationId, posDesignId, negDesignId });

// After Phase 4: Per-scope step
await stepInteraction({ 
  deliberationId, 
  posDesignId: climateP.id,  // Only step Climate scope
  negDesignId: climateO.id 
});
```

#### Orthogonality Check
```typescript
// Before: Global check (meaningless with multiple scopes)
const orthogonal = await checkOrthogonal(deliberationId);

// After: Per-scope check
const results = [];
for (const scope of scopes) {
  const orthogonal = await checkOrthogonal(deliberationId, { scope });
  results.push({ scope, orthogonal });
}
```

#### Stable Extensions
```typescript
// Before: Global (mixed all topics)
GET /api/af/stable?deliberationId=D_xyz

// After: Per-scope
GET /api/af/stable?deliberationId=D_xyz&scope=topic:climate
```

### UI Updates: Forest View

**Component:** `components/ludics/LudicsForest.tsx`

Previously: Single tree visualization (one P/O pair)  
Now: **Forest visualization** showing multiple trees side-by-side

```tsx
<LudicsForest designs={allDesigns} />
// Renders:
//   [Climate Tree] [Budget Tree] [Healthcare Tree]
//   Each tree shows P+O interaction for that scope
```

### Backward Compatibility

Legacy mode ensures existing deliberations continue working:

```typescript
// Old deliberations (no scope field)
const designs = await prisma.ludicDesign.findMany({
  where: { deliberationId, scope: null }
});
// → Treated as single "legacy" scope

// New deliberations
const designs = await prisma.ludicDesign.findMany({
  where: { deliberationId, scope: { not: null } }
});
// → Grouped by scope value
```

### Migration Notes

No database migration required. Existing designs:
- Have `scope: null`, `scopeType: null`
- Work with legacy strategy by default
- Can be recompiled with scoping strategies if needed

To enable scoping for an existing deliberation:
```typescript
// Delete old designs
await prisma.ludicDesign.deleteMany({ where: { deliberationId } });

// Recompile with scoping
await compileFromMoves(deliberationId, { scopingStrategy: 'topic' });
```

### Key Differences from Legacy

| Aspect | Legacy (Pre-Phase 4) | Scoped (Phase 4) |
|--------|---------------------|------------------|
| **Design Count** | Always 2 (P + O) | 2N (N scopes) |
| **Orthogonality** | Global | Per-scope |
| **Step Operation** | Single trace | N traces |
| **UI** | Single tree | Forest view |
| **Compilation** | One pass | N passes (one per scope) |
| **Backward Compat** | N/A | Legacy mode preserves old behavior |

### Common Patterns

#### Scope-Aware Command
```typescript
const activeScope = scopes[selectedScopeIndex];
const scopeDesigns = designs.filter(d => d.scope === activeScope);
const pro = scopeDesigns.find(d => d.participantId === "Proponent");
const opp = scopeDesigns.find(d => d.participantId === "Opponent");

// Operate on this scope only
await stepInteraction({ deliberationId, posDesignId: pro.id, negDesignId: opp.id });
```

#### Batch Operations Across Scopes
```typescript
const results = await Promise.all(
  scopes.map(async (scope) => {
    const scopeDesigns = designs.filter(d => d.scope === scope);
    return await checkOrthogonal(deliberationId, { scope });
  })
);
// → Array of per-scope results
```

#### Scope Metadata Usage
```typescript
// Access scope label for UI display
const scopeLabel = design.scopeMetadata?.label ?? design.scope ?? "Legacy";

// Filter by scope type
const topicScopes = designs.filter(d => d.scopeType === "topic");
const actorScopes = designs.filter(d => d.scopeType === "actor-pair");
```

---

## Recommended Implementation Order

### Phase 1 (Immediate - High Value, Low Effort)

✅ **1.1: Add attackType to metadata** (2 hours)
- Modify syncLudicsToAif to preserve attackType in AifNode.dialogueMetadata
- Update computeInsights to count attack types
- Add attack type badges to ArgumentCardV2

✅ **1.2: Add scheme provenance** (2 hours)
- Store schemeKey/schemeId in LudicAct.metaJson during compilation
- Update InsightsTooltip to show scheme breakdown
- Filter insights by scheme type

### Phase 2 (Short-term - Medium Effort, High Impact)

🔄 **2.1: Bidirectional sync** (1 day)
- Create POST /api/ludics/act endpoint
- Wire "Add Commitment" command (⚓) to create DialogueMove
- Test round-trip: UI → Move → Act → AIF → UI

🔄 **2.2: Argument locus mapping** (1 day)
- Define locus convention for REBUT/UNDERCUT/UNDERMINE
- Update compileFromMoves to assign loci by attack type
- Update LociTree visualization to show attack targets

### Phase 3 (Long-term - High Effort, High Value)

⏳ **3.1: Incremental compilation** (1 week)
- Add lastCompiledAt to LudicDesign schema
- Implement append-only compilation
- Add full recompilation fallback (integrity checks)
- Migration script for existing deliberations

⏳ **3.2: Real-time sync** (1 week)
- WebSocket/SSE for live Ludics updates
- Optimistic UI updates in LudicsPanel
- Conflict resolution for concurrent edits

---

## Summary

### Current State ✅
- DialogueMoves automatically compile to LudicActs on every POST
- LudicActs sync to AifNodes with locus/role metadata
- Basic ASSERT/WHY/GROUNDS flow working
- Convergence detection via daimon (†)

### Current Gaps ❌
- Attack types not distinguished (all treated as WHY)
- Scheme provenance not preserved in Ludics layer
- One-way sync only (can't create moves from Ludics UI)
- Full recompilation on every move (slow)
- Deduplication skips compilation (sync issues)

### Ideal Future 🚀
- Attack types explicitly mapped (REBUT, UNDERCUT, UNDERMINE)
- Scheme metadata preserved throughout pipeline
- Bidirectional sync (Ludics UI interactive)
- Incremental compilation (10-100x faster)
- Argument structure mapped to locus tree

### Next Steps

**Immediate (This Week):**
1. Add attackType preservation to syncLudicsToAif
2. Store scheme metadata in LudicAct.metaJson
3. Update insights computation to use new metadata

**Short-term (This Month):**
1. Implement POST /api/ludics/act endpoint
2. Wire up "Add Commitment" command
3. Define argument locus mapping convention

**Long-term (This Quarter):**
1. Incremental compilation with lastCompiledAt tracking
2. Real-time sync with WebSocket/SSE
3. Full Ludics UI interactivity (not just visualization)

---

**Status:** Documentation complete  
**Date:** November 3, 2025
