# Ludics Scoped Designs Architecture

**Date:** November 4, 2025  
**Status:** Planning / Design Phase  
**Goal:** Transform from monolithic per-deliberation designs to modular scoped duo-designs

---

## Executive Summary

**Problem:** Current implementation creates exactly 2 designs per deliberation (Proponent + Opponent), collapsing all actors and all topics into monolithic meta-designs. This loses individual attribution and conflates independent dialogue threads.

**Solution:** Introduce **scoped designs** where each logical dialogue unit (topic, actor pair, or argument thread) gets its own independent P/O design pair. The forest view then shows multiple independent ludics interactions per deliberation.

**Benefits:**
- ✅ Individual actor attribution preserved
- ✅ Independent topics get separate orthogonality checks
- ✅ Scalable to N-party deliberations
- ✅ More accurate to ludics theory (local interactions)
- ✅ Better UX (see which topics converge/diverge)
- ✅ Backward compatible (legacy `scope=null` supported)

---

## Current Architecture (Limitations)

### How It Works Now

```typescript
// compileFromMoves.ts - Creates exactly 2 designs
const P = await tx.ludicDesign.create({
  deliberationId: dialogueId,
  participantId: 'Proponent',  // ← ALL assertive moves
});

const O = await tx.ludicDesign.create({
  deliberationId: dialogueId,
  participantId: 'Opponent',   // ← ALL challenge moves
});

// ALL moves go into one of these two designs
for (const move of moves) {
  const design = move.polarity === 'O' ? O : P;
  // ... compile act into design
}
```

### Problems Illustrated

**Scenario:** Environmental deliberation with 3 actors and 3 topics

```
Actors:
- Alice (pro-climate)
- Bob (pro-nuclear) 
- Carol (anti-nuclear)

topics:
- topic A: Climate change is real
- topic B: Nuclear is safe
- topic C: Cars should be banned

Moves:
1. Alice ASSERT "Climate change is real" (topic A)
2. Carol WHY "Climate change is real?" (topic A)
3. Bob ASSERT "Nuclear is safe" (topic B)
4. Carol WHY "Nuclear is safe?" (topic B)
5. Alice ASSERT "Ban cars" (topic C)
```

**Current Output:** ONE merged design per polarity
```
Proponent Design (P):
  0.1 ← Alice: climate (topic A)
  0.2 ← Bob: nuclear (topic B)
  0.3 ← Alice: cars (topic C)

Opponent Design (O):
  0.1.1 ← Carol: WHY climate? (topic A)
  0.2.1 ← Carol: WHY nuclear? (topic B)
```

**Problems:**
1. **Lost actor attribution:** Alice and Bob merged into "Proponent"
2. **Conflated topics:** Climate, nuclear, and cars in same design
3. **Misleading trace:** topics A, B, C shouldn't interact, but they're in same tree
4. **Can't answer:** "Did Alice and Carol converge on climate?" (only global convergence)

---

## Proposed Architecture: Scoped Designs

### Core Concept

**Scoping Strategy:** Each logical dialogue unit gets its own independent P/O design pair.

```typescript
// New structure
Design {
  id: string;
  deliberationId: string;
  participantId: 'Proponent' | 'Opponent';
  
  // NEW: Scope identifier
  scope: string | null;           // 'topic:A' | 'actor:alice:carol' | 'arg:arg123' | null
  scopeMetadata: Json | null;     // { type, label, participants, ... }
  
  semantics: string;
  version: number;
  acts: LudicAct[];
}
```

### Three Scoping Strategies (Configurable)

#### **Strategy 1: topic-Based Scoping** (Recommended First)

**Scope Key:** `topic:<topicRootId>` or `topic:<topicSlug>`

**Grouping Logic:** All moves targeting the same root argument/claim

```typescript
// Example scopes
scope: "topic:climate-change"
scope: "topic:nuclear-safety"  
scope: "topic:car-ban"

// Metadata
scopeMetadata: {
  type: "topic",
  label: "Climate Change Debate",
  rootArgumentId: "arg_abc123",
  rootClaimText: "Climate change is anthropogenic"
}
```

**Result:**
```
Deliberation Forest:
  
  ┌─ topic: Climate Change ────────────┐
  │  P_climate (Alice's assertions)    │
  │  O_climate (Carol's challenges)    │
  │  Trace: CONVERGENT ✓                │
  └────────────────────────────────────┘
  
  ┌─ topic: Nuclear Safety ────────────┐
  │  P_nuclear (Bob's assertions)      │
  │  O_nuclear (Carol's challenges)    │
  │  Trace: DIVERGENT ✗                 │
  └────────────────────────────────────┘
  
  ┌─ topic: Car Ban ───────────────────┐
  │  P_cars (Alice's assertions)       │
  │  O_cars: (empty)                   │
  │  Trace: UNCHALLENGED                │
  └────────────────────────────────────┘
```

**Pros:**
- Natural grouping for multi-topic deliberations
- Each topic gets independent orthogonality check
- Easy to answer: "Which topics are resolved?"
- Moderate complexity (topics are already tracked)

**Cons:**
- Requires topic detection/tagging
- Cross-topic references need special handling

---

#### **Strategy 2: Actor-Pair Scoping**

**Scope Key:** `actors:<actorId1>:<actorId2>` (normalized alphabetically)

**Grouping Logic:** Each unique pair of actors engaged in dialogue

```typescript
// Example scopes (sorted actor IDs)
scope: "actors:alice:carol"
scope: "actors:bob:carol"
scope: "actors:alice:bob"  // if they interact

// Metadata
scopeMetadata: {
  type: "actor-pair",
  actors: [
    { id: "alice", name: "Alice", role: "Proponent" },
    { id: "carol", name: "Carol", role: "Opponent" }
  ],
  interactionCount: 5
}
```

**Result:**
```
Deliberation Forest:

  ┌─ Alice ⇄ Carol ──────────────────┐
  │  P (Alice's complete strategy)   │
  │  O (Carol's complete strategy)   │
  │  Trace: 5 steps, CONVERGENT      │
  └──────────────────────────────────┘
  
  ┌─ Bob ⇄ Carol ────────────────────┐
  │  P (Bob's complete strategy)     │
  │  O (Carol's complete strategy)   │
  │  Trace: 3 steps, DIVERGENT       │
  └──────────────────────────────────┘
```

**Pros:**
- Full individual attribution
- See each person's complete strategy
- Natural for pair-wise debates
- Easy to answer: "Do Alice and Carol agree?"

**Cons:**
- O(N²) design pairs for N actors
- UI complexity with many actors
- Carol's moves duplicated across pairs

---

#### **Strategy 3: Argument-Thread Scoping** (Most Fine-Grained)

**Scope Key:** `argument:<argumentId>` or `thread:<rootMoveId>`

**Grouping Logic:** Each argument and its challenge/support thread

```typescript
// Example scopes
scope: "argument:arg_climate_123"
scope: "argument:arg_nuclear_456"

// Metadata
scopeMetadata: {
  type: "argument",
  argumentId: "arg_climate_123",
  rootClaim: "CO2 causes warming",
  author: "Alice",
  depth: 3,
  moveCount: 7
}
```

**Result:**
```
Deliberation Forest (many small interactions):

  ┌─ Arg: "CO2 causes warming" ────────┐
  │  P: Alice's case                    │
  │  O: Carol's challenges              │
  │    └─ WHY CO2?                      │
  │    └─ GROUNDS: IPCC                 │
  │    └─ WHY IPCC reliable?            │
  │  Trace: depth=3, CONVERGENT         │
  └─────────────────────────────────────┘

  ┌─ Arg: "Nuclear is safe" ───────────┐
  │  P: Bob's case                      │
  │  O: Carol's challenges              │
  │    └─ WHY safe?                     │
  │    └─ RETRACT (Bob concedes)        │
  │  Trace: depth=2, CONVERGENT         │
  └─────────────────────────────────────┘
```

**Pros:**
- Most accurate to ludics "local interaction" philosophy
- Self-contained argument threads
- Natural alignment with AIF graph structure
- Easy to answer: "Is this specific argument justified?"

**Cons:**
- Most complex compilation logic
- Many small designs (potential UI clutter)
- Cross-argument reasoning needs linking

---

## Recommended Approach: Hybrid Strategy

### Phase 1: topic-Based (Primary Scoping)

Start with **topic-based scoping** as the primary grouping:
- Moderate complexity
- High user value (see which topics converge)
- Natural for deliberations

### Phase 2: Actor Attribution (Secondary Metadata)

Within each topic scope, **track actor contributions** in metadata:
```typescript
scopeMetadata: {
  type: "topic",
  label: "Climate Change",
  actors: {
    proponent: ["alice", "bob"],
    opponent: ["carol", "dave"]
  }
}
```

### Phase 3: Cross-Scope Linking (Advanced)

Add **design references** for cross-topic connections:
```typescript
LudicDesign {
  scope: "topic:climate",
  referencedScopes: ["topic:energy-policy"],  // Climate cites energy
  crossScopeActs: [...],                      // Acts referencing other scopes
}
```

---

## Implementation Plan

### Milestone 1: Schema & Backend (Week 1)

#### 1.1 Update Prisma Schema

**File:** `lib/models/schema.prisma`

```prisma
model LudicDesign {
  id             String      @id @default(cuid())
  deliberationId String
  participantId  String      // 'Proponent' | 'Opponent'
  
  // NEW: Scoping fields
  scope          String?     // 'topic:<id>' | 'actors:<id1>:<id2>' | 'arg:<id>' | null (legacy)
  scopeType      String?     // 'topic' | 'actor-pair' | 'argument' | null
  scopeMetadata  Json?       // { label, actors, topicId, argumentId, ... }
  
  rootLocusId    String?
  rootLocus      LudicLocus? @relation(fields: [rootLocusId], references: [id])
  
  semantics      String?     @default("CLASSICAL")
  version        Int         @default(1)
  acts           LudicAct[]
  extJson        Json?
  
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  
  @@index([deliberationId])
  @@index([deliberationId, scope])           // NEW: Query designs by scope
  @@index([deliberationId, scopeType])       // NEW: Query by scope type
  @@index([deliberationId, participantId, scope])  // NEW: Find P/O pair for scope
}
```

#### 1.2 Migration Script

**File:** `prisma/migrations/XXX_add_scoped_designs.sql`

```sql
-- Add new columns (nullable for backward compat)
ALTER TABLE "LudicDesign" ADD COLUMN "scope" TEXT;
ALTER TABLE "LudicDesign" ADD COLUMN "scopeType" TEXT;
ALTER TABLE "LudicDesign" ADD COLUMN "scopeMetadata" JSONB;

-- Create indexes
CREATE INDEX "LudicDesign_deliberationId_scope_idx" ON "LudicDesign"("deliberationId", "scope");
CREATE INDEX "LudicDesign_deliberationId_scopeType_idx" ON "LudicDesign"("deliberationId", "scopeType");
CREATE INDEX "LudicDesign_deliberationId_participantId_scope_idx" ON "LudicDesign"("deliberationId", "participantId", "scope");

-- Backfill existing designs with scope=null (legacy)
UPDATE "LudicDesign" SET "scope" = NULL, "scopeType" = NULL WHERE "scope" IS NULL;
```

#### 1.3 Update compileFromMoves

**File:** `packages/ludics-engine/compileFromMoves.ts`

**Key Changes:**

```typescript
// New interface
export async function compileFromMoves(
  dialogueId: string,
  options?: {
    scopingStrategy?: 'legacy' | 'topic' | 'actor-pair' | 'argument';
    forceRecompile?: boolean;
  }
): Promise<{ ok: true; designs: string[] }> {
  const strategy = options?.scopingStrategy ?? 'legacy';
  
  // Read all moves
  const moves = await prisma.dialogueMove.findMany({
    where: { deliberationId: dialogueId },
    orderBy: { createdAt: 'asc' },
  });
  
  // Compute scopes for each move
  const movesWithScopes = await computeScopes(moves, strategy);
  
  // Group moves by scope
  const movesByScope = groupBy(movesWithScopes, m => m.scope ?? 'legacy');
  
  // Create designs per scope
  const createdDesigns: string[] = [];
  
  for (const [scopeKey, scopeMoves] of Object.entries(movesByScope)) {
    const scopeMetadata = buildScopeMetadata(scopeKey, scopeMoves, strategy);
    
    await prisma.$transaction(async (tx) => {
      // Wipe existing designs for this scope
      await tx.ludicDesign.deleteMany({
        where: { 
          deliberationId: dialogueId,
          scope: scopeKey === 'legacy' ? null : scopeKey
        }
      });
      
      // Create P and O designs for this scope
      const P = await tx.ludicDesign.create({
        data: {
          deliberationId: dialogueId,
          participantId: 'Proponent',
          scope: scopeKey === 'legacy' ? null : scopeKey,
          scopeType: strategy === 'legacy' ? null : strategy,
          scopeMetadata,
          extJson: { role: 'pro', scope: scopeKey },
        },
      });
      
      const O = await tx.ludicDesign.create({
        data: {
          deliberationId: dialogueId,
          participantId: 'Opponent',
          scope: scopeKey === 'legacy' ? null : scopeKey,
          scopeType: strategy === 'legacy' ? null : strategy,
          scopeMetadata,
          extJson: { role: 'opp', scope: scopeKey },
        },
      });
      
      createdDesigns.push(P.id, O.id);
      
      // Compile acts for this scope
      await compileScopeActs(tx, scopeMoves, P, O);
    });
  }
  
  return { ok: true, designs: createdDesigns };
}

// Helper: Compute scope for each move based on strategy
async function computeScopes(
  moves: DialogueMoveRow[],
  strategy: 'legacy' | 'topic' | 'actor-pair' | 'argument'
): Promise<Array<DialogueMoveRow & { scope: string | null }>> {
  if (strategy === 'legacy') {
    return moves.map(m => ({ ...m, scope: null }));
  }
  
  if (strategy === 'topic') {
    // Group by target argument's root
    const rootByTargetId = await computeArgumentRoots(moves);
    return moves.map(m => ({
      ...m,
      scope: `topic:${rootByTargetId.get(m.targetId) ?? m.targetId}`
    }));
  }
  
  if (strategy === 'actor-pair') {
    // Group by unique actor pairs (need to compute who's interacting)
    const pairs = await computeActorPairs(moves);
    return moves.map(m => ({
      ...m,
      scope: pairs.get(m.id) ?? null
    }));
  }
  
  if (strategy === 'argument') {
    // Each target argument gets its own scope
    return moves.map(m => ({
      ...m,
      scope: `argument:${m.targetId}`
    }));
  }
  
  return moves.map(m => ({ ...m, scope: null }));
}

// Helper: Build metadata for scope
function buildScopeMetadata(
  scopeKey: string,
  moves: DialogueMoveRow[],
  strategy: string
): any {
  if (scopeKey === 'legacy') return null;
  
  const actors = [...new Set(moves.map(m => m.actorId))];
  const proActors = actors.filter(id => 
    moves.find(m => m.actorId === id && (m.polarity === 'P' || m.kind === 'ASSERT'))
  );
  const oppActors = actors.filter(id =>
    moves.find(m => m.actorId === id && (m.polarity === 'O' || m.kind === 'WHY'))
  );
  
  return {
    type: strategy,
    scopeKey,
    label: deriveScopeLabel(scopeKey, moves),
    moveCount: moves.length,
    actors: {
      proponent: proActors,
      opponent: oppActors,
      all: actors
    },
    timeRange: {
      start: moves[0]?.createdAt,
      end: moves[moves.length - 1]?.createdAt
    }
  };
}

// Helper: Derive human-readable label
function deriveScopeLabel(scopeKey: string, moves: DialogueMoveRow[]): string {
  if (scopeKey.startsWith('topic:')) {
    // Look up argument text or use first ASSERT
    const firstAssert = moves.find(m => m.kind === 'ASSERT');
    return firstAssert?.payload?.text ?? `topic ${scopeKey.split(':')[1]}`;
  }
  
  if (scopeKey.startsWith('actors:')) {
    const [_, actor1, actor2] = scopeKey.split(':');
    return `${actor1} ⇄ ${actor2}`;
  }
  
  if (scopeKey.startsWith('argument:')) {
    const argId = scopeKey.split(':')[1];
    return `Argument ${argId.slice(0, 8)}`;
  }
  
  return scopeKey;
}

// Helper: Find root arguments for topic grouping
async function computeArgumentRoots(
  moves: DialogueMoveRow[]
): Promise<Map<string, string>> {
  // Get all target arguments
  const targetIds = [...new Set(moves.map(m => m.targetId))];
  
  const arguments = await prisma.argument.findMany({
    where: { id: { in: targetIds } },
    select: { id: true, parentId: true }
  });
  
  // Build parent chain to find roots
  const rootMap = new Map<string, string>();
  
  for (const arg of arguments) {
    let current = arg;
    let root = arg.id;
    
    // Walk up parent chain
    while (current.parentId) {
      const parent = arguments.find(a => a.id === current.parentId);
      if (!parent) break;
      root = parent.id;
      current = parent;
    }
    
    rootMap.set(arg.id, root);
  }
  
  return rootMap;
}
```

---

### Milestone 2: API Updates (Week 1)

#### 2.1 Update GET /api/ludics/designs

**File:** `app/api/ludics/designs/route.ts`

```typescript
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deliberationId = searchParams.get('deliberationId');
  const scope = searchParams.get('scope');           // NEW: Filter by scope
  const scopeType = searchParams.get('scopeType');   // NEW: Filter by type
  
  if (!deliberationId) {
    return NextResponse.json({ error: 'Missing deliberationId' }, { status: 400 });
  }
  
  const where: any = { deliberationId };
  
  if (scope !== null) {
    where.scope = scope === 'null' ? null : scope;
  }
  
  if (scopeType) {
    where.scopeType = scopeType;
  }
  
  const designs = await prisma.ludicDesign.findMany({
    where,
    include: {
      acts: {
        include: { locus: true },
        orderBy: { createdAt: 'asc' }
      }
    },
    orderBy: { createdAt: 'asc' }
  });
  
  // Group designs by scope for forest view
  const grouped = groupBy(designs, d => d.scope ?? 'legacy');
  
  return NextResponse.json({
    ok: true,
    designs,
    grouped,      // NEW: Pre-grouped for forest view
    scopes: Object.keys(grouped),
  });
}
```

#### 2.2 Add POST /api/ludics/compile

**File:** `app/api/ludics/compile/route.ts` (NEW)

```typescript
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { deliberationId, scopingStrategy } = body;
  
  if (!deliberationId) {
    return NextResponse.json({ error: 'Missing deliberationId' }, { status: 400 });
  }
  
  try {
    const result = await compileFromMoves(deliberationId, {
      scopingStrategy: scopingStrategy ?? 'topic',  // Default to topic-based
      forceRecompile: true
    });
    
    await syncLudicsToAif(deliberationId);
    await invalidateInsightsCache(deliberationId);
    
    return NextResponse.json({
      ok: true,
      ...result
    });
  } catch (err) {
    console.error('[ludics] Compile failed:', err);
    return NextResponse.json(
      { error: 'Compilation failed', details: String(err) },
      { status: 500 }
    );
  }
}
```

---

### Milestone 3: UI Updates (Week 2)

#### 3.1 Update LudicsForest Component

**File:** `components/ludics/LudicsForest.tsx`

```typescript
'use client';

import * as React from 'react';
import useSWR from 'swr';
import { DesignTreeView } from './DesignTreeView';
import { InteractionTraceView } from './InteractionTraceView';
import LociTreeWithControls from './LociTreeWithControls';

const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then(r => r.json());

type ViewMode = 'forest' | 'split-screen' | 'merged';
type ScopeGroup = {
  scopeKey: string;
  scopeMetadata: any;
  proponentDesign: any;
  opponentDesign: any;
  trace: any;
};

export function LudicsForest({ 
  deliberationId,
  defaultScopingStrategy = 'topic'
}: { 
  deliberationId: string;
  defaultScopingStrategy?: 'legacy' | 'topic' | 'actor-pair' | 'argument';
}) {
  const [viewMode, setViewMode] = React.useState<ViewMode>('forest');
  const [scopingStrategy, setScopingStrategy] = React.useState(defaultScopingStrategy);
  const [selectedScope, setSelectedScope] = React.useState<string | null>(null);
  
  // Fetch designs (grouped by scope on backend)
  const { data: designsData, isLoading: designsLoading, mutate } = useSWR(
    `/api/ludics/designs?deliberationId=${encodeURIComponent(deliberationId)}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  
  const grouped = designsData?.grouped ?? {};
  const scopes = Object.keys(grouped);
  
  // Build scope groups with traces
  const scopeGroups: ScopeGroup[] = React.useMemo(() => {
    return scopes.map(scopeKey => {
      const designs = grouped[scopeKey] ?? [];
      const P = designs.find((d: any) => d.participantId === 'Proponent');
      const O = designs.find((d: any) => d.participantId === 'Opponent');
      
      return {
        scopeKey,
        scopeMetadata: P?.scopeMetadata ?? O?.scopeMetadata ?? {},
        proponentDesign: P,
        opponentDesign: O,
        trace: null, // Fetch trace separately if needed
      };
    });
  }, [grouped, scopes]);
  
  // Recompile with different scoping strategy
  const recompile = async (newStrategy: string) => {
    setScopingStrategy(newStrategy as any);
    await fetch('/api/ludics/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliberationId, scopingStrategy: newStrategy })
    });
    mutate(); // Refresh designs
  };
  
  return (
    <div className="ludics-forest space-y-3">
      {/* Header: View mode + scoping strategy selector */}
      <div className="forest-header flex items-center justify-between rounded-lg border bg-white/70 backdrop-blur p-3">
        <div className="view-mode-toggle flex items-center gap-2">
          <button 
            onClick={() => setViewMode('forest')}
            className={`px-3 py-1.5 text-sm rounded-md transition ${
              viewMode === 'forest' 
                ? 'bg-slate-900 text-white' 
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Forest: Show all scoped interactions independently"
          >
            🌲 Forest
          </button>
          <button 
            onClick={() => setViewMode('split-screen')}
            className={`px-3 py-1.5 text-sm rounded-md transition ${
              viewMode === 'split-screen' 
                ? 'bg-slate-900 text-white' 
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Split: Side-by-side comparison"
          >
            ⚔️ Split
          </button>
          <button 
            onClick={() => setViewMode('merged')}
            className={`px-3 py-1.5 text-sm rounded-md transition ${
              viewMode === 'merged' 
                ? 'bg-slate-900 text-white' 
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Merged: Legacy unified tree view"
          >
            🌳 Merged
          </button>
        </div>
        
        {/* Scoping strategy selector */}
        <div className="scoping-strategy flex items-center gap-2">
          <label className="text-xs font-medium text-slate-600">Scoping:</label>
          <select 
            value={scopingStrategy}
            onChange={(e) => recompile(e.target.value)}
            className="px-2 py-1 text-sm border rounded bg-white"
          >
            <option value="legacy">Legacy (1 pair)</option>
            <option value="topic">By topic</option>
            <option value="actor-pair">By Actor Pair</option>
            <option value="argument">By Argument</option>
          </select>
        </div>
        
        <div className="forest-stats flex items-center gap-3 text-xs text-slate-600">
          <span className="px-2 py-1 bg-slate-100 rounded">
            <strong>{scopeGroups.length}</strong> {scopeGroups.length === 1 ? 'scope' : 'scopes'}
          </span>
        </div>
      </div>
      
      {/* Loading state */}
      {designsLoading && (
        <div className="p-4 text-sm text-slate-500 text-center">
          Loading designs...
        </div>
      )}
      
      {/* Forest view: Show all scopes independently */}
      {viewMode === 'forest' && !designsLoading && (
        <div className="forest-grid space-y-4">
          {scopeGroups.length === 0 ? (
            <div className="p-4 text-sm text-slate-500 text-center border rounded-lg bg-white/50">
              No designs found. Try compiling with a different scoping strategy.
            </div>
          ) : (
            scopeGroups.map((group) => (
              <ScopeInteractionView
                key={group.scopeKey}
                scopeKey={group.scopeKey}
                scopeMetadata={group.scopeMetadata}
                proponentDesign={group.proponentDesign}
                opponentDesign={group.opponentDesign}
                deliberationId={deliberationId}
                isSelected={selectedScope === group.scopeKey}
                onSelect={() => setSelectedScope(group.scopeKey)}
              />
            ))
          )}
        </div>
      )}
      
      {/* Split-screen: Selected scope P vs O */}
      {viewMode === 'split-screen' && !designsLoading && (
        <div className="split-screen-view">
          {selectedScope && scopeGroups.find(g => g.scopeKey === selectedScope) ? (
            <div className="grid md:grid-cols-2 gap-4">
              <DesignTreeView
                design={scopeGroups.find(g => g.scopeKey === selectedScope)?.proponentDesign}
                deliberationId={deliberationId}
                highlight="positive"
              />
              
              <DesignTreeView
                design={scopeGroups.find(g => g.scopeKey === selectedScope)?.opponentDesign}
                deliberationId={deliberationId}
                highlight="negative"
              />
            </div>
          ) : (
            <div className="p-4 text-sm text-slate-500 text-center border rounded-lg">
              Select a scope from the forest view to see split-screen comparison
            </div>
          )}
        </div>
      )}
      
      {/* Merged view: Legacy behavior (scope=null only) */}
      {viewMode === 'merged' && !designsLoading && (
        <div className="merged-view">
          <div className="mb-2 p-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded">
            <strong>Legacy Mode:</strong> Showing only designs with scope=null. 
            Use Forest view to see scoped interactions.
          </div>
          {grouped['legacy'] && grouped['legacy'].length === 2 && (
            <LociTreeWithControls
              dialogueId={deliberationId}
              posDesignId={grouped['legacy'].find((d: any) => d.participantId === 'Proponent')?.id}
              negDesignId={grouped['legacy'].find((d: any) => d.participantId === 'Opponent')?.id}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Scope interaction component (each duo-design pair)
function ScopeInteractionView({
  scopeKey,
  scopeMetadata,
  proponentDesign,
  opponentDesign,
  deliberationId,
  isSelected,
  onSelect
}: {
  scopeKey: string;
  scopeMetadata: any;
  proponentDesign: any;
  opponentDesign: any;
  deliberationId: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { data: traceData } = useSWR(
    proponentDesign && opponentDesign
      ? `/api/ludics/step?posDesignId=${proponentDesign.id}&negDesignId=${opponentDesign.id}`
      : null,
    fetcher
  );
  
  const trace = traceData?.trace;
  const label = scopeMetadata?.label ?? scopeKey;
  
  return (
    <div 
      className={`scope-interaction rounded-lg border-2 transition ${
        isSelected 
          ? 'border-blue-400 shadow-lg' 
          : 'border-slate-200 hover:border-slate-300'
      }`}
      onClick={onSelect}
    >
      {/* Scope header */}
      <div className="scope-header bg-gradient-to-r from-slate-50 to-slate-100 p-3 rounded-t-lg border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">{label}</h3>
            <div className="text-xs text-slate-600 mt-1">
              {scopeMetadata?.moveCount && (
                <span className="mr-3">{scopeMetadata.moveCount} moves</span>
              )}
              {scopeMetadata?.actors?.all?.length > 0 && (
                <span>{scopeMetadata.actors.all.length} actors</span>
              )}
            </div>
          </div>
          
          {trace && (
            <div className={`px-3 py-1.5 rounded font-medium text-sm ${
              trace.status === 'CONVERGENT' ? 'bg-emerald-100 text-emerald-700' :
              trace.status === 'DIVERGENT' ? 'bg-rose-100 text-rose-700' :
              trace.status === 'STUCK' ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              {trace.status}
            </div>
          )}
        </div>
      </div>
      
      {/* Duo-designs side by side */}
      <div className="scope-body grid md:grid-cols-2 gap-3 p-3 bg-white/50">
        <DesignTreeView
          design={proponentDesign}
          deliberationId={deliberationId}
          trace={trace}
          highlight="positive"
        />
        
        <DesignTreeView
          design={opponentDesign}
          deliberationId={deliberationId}
          trace={trace}
          highlight="negative"
        />
      </div>
      
      {/* Interaction trace */}
      {trace && trace.pairs && trace.pairs.length > 0 && (
        <div className="scope-trace border-t p-3 bg-slate-50/50">
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-slate-700 hover:text-slate-900">
              Interaction Trace ({trace.pairs.length} steps)
            </summary>
            <div className="mt-2 space-y-1 text-xs">
              {trace.pairs.map((pair: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-slate-600">
                  <span className="font-mono text-slate-400">#{i + 1}</span>
                  <span>P ⇄ O at {pair.locusPath ?? '?'}</span>
                  {trace.decisiveIndices?.includes(i) && (
                    <span className="text-amber-600">⭐ decisive</span>
                  )}
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
```

---

### Milestone 4: Testing & Validation (Week 2)

#### 4.1 Test Scenarios

**Scenario A: Legacy Backward Compatibility**
```typescript
// Should work with existing deliberations (scope=null)
await compileFromMoves(deliberationId, { scopingStrategy: 'legacy' });
// Expect: 2 designs with scope=null
```

**Scenario B: topic-Based Scoping**
```typescript
// Create deliberation with 3 independent topics
// Each topic should get its own P/O pair
await compileFromMoves(deliberationId, { scopingStrategy: 'topic' });
// Expect: 6 designs (3 scopes × 2 polarities)
```

**Scenario C: Actor-Pair Scoping**
```typescript
// Deliberation with Alice, Bob, Carol (3 actors)
// Expect up to 3 pairs: Alice-Bob, Alice-Carol, Bob-Carol
await compileFromMoves(deliberationId, { scopingStrategy: 'actor-pair' });
// Expect: 2-6 designs depending on who interacts
```

**Scenario D: Argument-Thread Scoping**
```typescript
// Deliberation with 5 root arguments, each with challenge threads
await compileFromMoves(deliberationId, { scopingStrategy: 'argument' });
// Expect: 10 designs (5 arguments × 2 polarities)
```

#### 4.2 Validation Queries

```sql
-- Count designs per scope
SELECT scope, scopeType, COUNT(*) as design_count
FROM "LudicDesign"
WHERE "deliberationId" = 'test_deliberation_id'
GROUP BY scope, scopeType;

-- Verify P/O pairs exist for each scope
SELECT scope, 
       COUNT(*) FILTER (WHERE "participantId" = 'Proponent') as p_count,
       COUNT(*) FILTER (WHERE "participantId" = 'Opponent') as o_count
FROM "LudicDesign"
WHERE "deliberationId" = 'test_deliberation_id'
GROUP BY scope
HAVING COUNT(*) != 2;  -- Should return empty (all scopes have exactly 2 designs)
```

#### 4.3 E2E Test Script

**File:** `scripts/test-scoped-designs.ts`

```typescript
import { prisma } from '@/lib/db';
import { compileFromMoves } from '@/packages/ludics-engine/compileFromMoves';

async function testScopedDesigns() {
  console.log('🧪 Testing scoped designs architecture...\n');
  
  // Setup: Create test deliberation with known structure
  const testDelibId = await createTestDeliberation();
  
  // Test 1: Legacy mode (backward compat)
  console.log('Test 1: Legacy mode...');
  await compileFromMoves(testDelibId, { scopingStrategy: 'legacy' });
  const legacyDesigns = await prisma.ludicDesign.findMany({
    where: { deliberationId: testDelibId, scope: null }
  });
  console.assert(legacyDesigns.length === 2, 'Legacy should have 2 designs');
  console.log('✅ Legacy mode works\n');
  
  // Test 2: topic-based scoping
  console.log('Test 2: topic-based scoping...');
  await compileFromMoves(testDelibId, { scopingStrategy: 'topic' });
  const topicDesigns = await prisma.ludicDesign.findMany({
    where: { deliberationId: testDelibId, scopeType: 'topic' }
  });
  console.log(`Found ${topicDesigns.length} topic-scoped designs`);
  
  // Group by scope to verify pairs
  const grouped = groupBy(topicDesigns, d => d.scope);
  for (const [scope, designs] of Object.entries(grouped)) {
    console.assert(designs.length === 2, `Scope ${scope} should have 2 designs`);
    console.assert(
      designs.some(d => d.participantId === 'Proponent') &&
      designs.some(d => d.participantId === 'Opponent'),
      `Scope ${scope} should have P and O`
    );
  }
  console.log('✅ topic scoping works\n');
  
  // Test 3: Forest view can render
  console.log('Test 3: Forest view rendering...');
  const forestData = await fetch(`http://localhost:3000/api/ludics/designs?deliberationId=${testDelibId}`);
  const json = await forestData.json();
  console.assert(json.ok, 'API should return ok');
  console.assert(json.grouped, 'API should return grouped designs');
  console.log(`✅ Forest view has ${Object.keys(json.grouped).length} scopes\n`);
  
  console.log('🎉 All tests passed!');
}

async function createTestDeliberation(): Promise<string> {
  // Create test delib with 3 topics, multiple actors
  // Return deliberationId
  return 'test_delib_123';
}

testScopedDesigns().catch(console.error);
```

---

## Migration Strategy

### Phase 0: Preparation (Current State)
- ✅ Forest view implemented (shows 2 designs)
- ✅ Design independence recognized
- ✅ Architecture planned

### Phase 1: Schema & Backend (Week 1)
- Add `scope`, `scopeType`, `scopeMetadata` to `LudicDesign`
- Run migration (nullable fields for backward compat)
- Update `compileFromMoves` with scoping strategies
- Add `/api/ludics/compile` endpoint
- Keep default behavior as `legacy` mode

### Phase 2: topic-Based Scoping (Week 2)
- Implement `computeArgumentRoots` helper
- Enable `scopingStrategy: 'topic'` in compilation
- Update forest UI to show grouped scopes
- Test with multi-topic deliberations
- Deploy with feature flag

### Phase 3: Actor Attribution (Week 3)
- Add actor metadata to `scopeMetadata`
- Implement `computeActorPairs` helper
- Add actor-pair scoping mode
- UI: Show actor names in scope headers
- Deploy for user testing

### Phase 4: Cross-Scope Linking (Week 4+)
- Add `referencedScopes` and `crossScopeActs`
- Implement delocation for scope boundaries
- UI: Show cross-scope connections
- Advanced: Allow scope merging/splitting

---

## Configuration & Defaults

### Environment Variables

```bash
# .env.local
LUDICS_DEFAULT_SCOPING=topic     # 'legacy' | 'topic' | 'actor-pair' | 'argument'
LUDICS_ENABLE_ACTOR_ATTRIBUTION=true
LUDICS_ENABLE_CROSS_SCOPE=false  # Future feature
```

### Per-Deliberation Settings

Store in deliberation metadata:
```typescript
Deliberation {
  extJson: {
    ludicsConfig: {
      scopingStrategy: 'topic',
      autoRecompile: true,
      showScopeLabels: true
    }
  }
}
```

---

## Benefits Summary

### For Users
1. **Clarity:** See which specific topics/arguments converge vs diverge
2. **Attribution:** Know who said what within each scope
3. **Scalability:** Handle deliberations with 10+ topics without confusion
4. **Debugging:** Isolate problematic argument threads

### For Developers
1. **Modularity:** Each scope compiles independently
2. **Performance:** Parallel compilation per scope
3. **Testing:** Test individual scopes in isolation
4. **Extensibility:** Easy to add new scoping strategies

### For Ludics Theory
1. **Accuracy:** Local interactions between specific designs
2. **Orthogonality:** Per-scope convergence checks
3. **Independence:** Designs truly independent until interaction
4. **Delocation:** Natural scope boundaries for fax operations

---

## Open Questions & Future Work

### Q1: Cross-Scope References
**Question:** How to handle when topic A cites topic B?

**Options:**
- A) Create cross-scope acts (with `scope_ref` metadata)
- B) Use delocation (fax evidence from other scope)
- C) Explicit linking in `referencedScopes` field

**Recommendation:** Start with (C) metadata linking, add (B) delocation later.

---

### Q2: Scope Granularity Control
**Question:** Should users choose scoping strategy per deliberation?

**Options:**
- A) Admin setting (global default)
- B) Per-deliberation setting
- C) Runtime toggle (recompile on demand)

**Recommendation:** (B) per-deliberation with (C) toggle in dev mode.

---

### Q3: Legacy Migration
**Question:** Migrate existing deliberations to scoped designs?

**Options:**
- A) Keep legacy as-is (`scope=null`)
- B) Backfill with `topic` scoping
- C) Prompt users to choose scoping

**Recommendation:** (A) for now, offer (C) as "upgrade deliberation" feature.

---

### Q4: Performance with Many Scopes
**Question:** What if deliberation has 50+ scopes?

**Solutions:**
- Lazy-load scope traces (fetch on expand)
- Virtual scrolling in forest view
- Scope search/filter UI
- Collapse "converged" scopes by default

---

## Success Metrics

### Week 1 (Backend Complete)
- ✅ Schema migrated, no data loss
- ✅ Legacy mode still works
- ✅ topic-based compilation produces correct scopes
- ✅ Unit tests pass for all scoping strategies

### Week 2 (UI Complete)
- ✅ Forest view shows grouped scopes
- ✅ Users can toggle scoping strategy
- ✅ Interaction traces per scope
- ✅ E2E test with 3+ topics passes

### Week 3 (Production Ready)
- ✅ Deployed to staging
- ✅ User feedback collected
- ✅ Performance acceptable (< 2s compile for 100 moves)
- ✅ Documentation updated

### Week 4 (Rollout)
- ✅ Feature flag enabled for all users
- ✅ Migration guide published
- ✅ Support tickets handled
- ✅ Monitoring dashboards updated

---

## Risks & Mitigations

### Risk 1: Breaking Changes
**Risk:** Existing code expects 2 designs per deliberation

**Mitigation:** 
- Default to `legacy` mode (backward compat)
- Feature flag for scoped designs
- Comprehensive tests before rollout

### Risk 2: Performance Degradation
**Risk:** N scopes × 2 designs = 2N designs (more DB queries)

**Mitigation:**
- Batch queries with `include: { acts }`
- Cache grouped designs
- Lazy-load traces

### Risk 3: Scope Detection Errors
**Risk:** topic grouping mis-identifies argument roots

**Mitigation:**
- Fallback to `argument` scoping (fine-grained)
- Manual scope override in UI
- Audit logs for scope computation

### Risk 4: UI Complexity
**Risk:** Too many scopes overwhelm users

**Mitigation:**
- Collapsible scope cards
- "Show only unresolved" filter
- Scope search bar
- Breadcrumb navigation

---

## Next Steps

1. **Review this document** with team
2. **Approve scoping strategy** (recommend: topic-based first)
3. **Create Prisma migration** for schema changes
4. **Implement `computeScopes` helpers**
5. **Update `compileFromMoves` with strategy parameter**
6. **Build `ScopeInteractionView` component**
7. **Write E2E tests** for each scoping mode
8. **Deploy to staging** with feature flag
9. **Collect feedback** from power users
10. **Iterate and rollout** to production

---

**Questions or concerns?** Please comment on this document or reach out to the ludics team.

**Last Updated:** November 4, 2025
