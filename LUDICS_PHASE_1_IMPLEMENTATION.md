# Ludics Phase 1: Foundation - AIF Integration

**Date**: November 3, 2025  
**Status**: 🚧 In Progress  
**Timeline**: 2 weeks  
**Goal**: Link Ludics acts to AIF nodes, enable automatic syncing, surface basic insights

---

## Overview

Phase 1 establishes the foundational integration between Ludics and the AIF (Argument Interchange Format) system. By the end of this phase:

✅ Every LudicAct will have a corresponding AifNode  
✅ Ludics compilation will automatically sync to AIF graph  
✅ Insights endpoint will provide actionable data for UI  
✅ Background processing runs transparently on every dialogue move  

---

## Week 1: Schema & Backend Integration

### Task 1.1: Extend Database Schema ✅

**File**: `lib/models/schema.prisma`

**Changes**:
```prisma
model AifNode {
  // ... existing fields ...
  
  // NEW: Ludics integration
  ludicActId  String?     @unique
  ludicAct    LudicAct?   @relation(fields: [ludicActId], references: [id], onDelete: SetNull)
  
  // NEW: Locus annotations (denormalized for performance)
  locusPath   String?     // e.g., "0.1.2"
  locusRole   String?     // "opener" | "responder" | "daimon"
  
  @@index([ludicActId])
  @@index([locusPath])
}

model LudicAct {
  // ... existing fields ...
  
  // NEW: Back-relation to AIF
  aifNode     AifNode?
}
```

**Migration**:
```bash
# Generate migration
npx prisma migrate dev --name add_ludics_to_aif

# Apply to database
npx prisma generate
```

**DoD**:
- [ ] Schema changes applied
- [ ] Migration runs successfully
- [ ] No breaking changes to existing code
- [ ] `prisma generate` completes

---

### Task 1.2: Create AIF Sync Service

**File**: `lib/ludics/syncToAif.ts` (NEW)

```typescript
import { prisma } from "@/lib/prismaclient";
import type { AifNodeKind } from "@prisma/client";

/**
 * Sync LudicAct rows to AifNode rows for a deliberation.
 * Creates AifNode for each act that doesn't have one.
 * Updates locusPath and locusRole.
 */
export async function syncLudicsToAif(deliberationId: string): Promise<{
  nodesCreated: number;
  nodesUpdated: number;
  edgesCreated: number;
}> {
  let nodesCreated = 0;
  let nodesUpdated = 0;
  let edgesCreated = 0;

  // 1. Fetch all LudicActs for this deliberation
  const acts = await prisma.ludicAct.findMany({
    where: { design: { deliberationId } },
    include: {
      design: true,
      locus: true,
      aifNode: true, // Check if already synced
    },
    orderBy: { orderInDesign: "asc" },
  });

  // 2. For each act, ensure AifNode exists
  for (const act of acts) {
    const locusPath = act.locus?.path ?? "0";
    const locusRole = determineLocusRole(act);
    
    if (!act.aifNode) {
      // Create new AifNode
      const nodeKind = mapActToNodeKind(act);
      
      const aifNode = await prisma.aifNode.create({
        data: {
          deliberationId,
          nodeKind,
          ludicActId: act.id,
          locusPath,
          locusRole,
          text: act.expression ?? "",
          metaJson: {
            ...act.metaJson,
            ludicPolarity: act.polarity,
            ludicKind: act.kind,
            isAdditive: act.isAdditive,
          },
        },
      });
      
      nodesCreated++;
      
      // 3. Create AifEdge for justification pointer
      const justifiedByLocus = (act.metaJson as any)?.justifiedByLocus;
      if (justifiedByLocus) {
        const parentAct = acts.find(
          (a) => a.locus?.path === justifiedByLocus && a.design.id === act.design.id
        );
        
        if (parentAct?.aifNode) {
          await prisma.aifEdge.create({
            data: {
              deliberationId,
              sourceId: aifNode.id,
              targetId: parentAct.aifNode.id,
              edgeType: "JUSTIFIED_BY",
              metaJson: { ludicJustification: true },
            },
          }).catch(() => {}); // Ignore duplicates
          
          edgesCreated++;
        }
      }
    } else {
      // Update existing AifNode (in case locus changed)
      await prisma.aifNode.update({
        where: { id: act.aifNode.id },
        data: {
          locusPath,
          locusRole,
          text: act.expression ?? act.aifNode.text,
        },
      });
      
      nodesUpdated++;
    }
  }

  return { nodesCreated, nodesUpdated, edgesCreated };
}

/**
 * Determine locus role from act properties
 */
function determineLocusRole(act: any): string {
  if (act.kind === "DAIMON") return "daimon";
  if (act.polarity === "P") return "opener";
  if (act.polarity === "O") return "responder";
  return "neutral";
}

/**
 * Map LudicAct to AifNodeKind
 */
function mapActToNodeKind(act: any): AifNodeKind {
  if (act.kind === "DAIMON") return "L_NODE"; // Locution (end of sequence)
  
  // Use metaJson to determine if this is tied to an argument/claim
  const meta = act.metaJson as any;
  if (meta?.targetType === "argument") return "RA_NODE"; // Inference
  if (meta?.targetType === "claim") return "I_NODE"; // Information
  
  // Default: treat as locution in dialogue
  return "L_NODE";
}
```

**DoD**:
- [ ] Service created and exports `syncLudicsToAif`
- [ ] Handles existing AifNodes (idempotent)
- [ ] Creates justification edges
- [ ] Batches operations for performance
- [ ] Error handling doesn't fail compilation

---

### Task 1.3: Integrate Sync into Dialogue Move

**File**: `app/api/dialogue/move/route.ts`

**Change** (around line 517):
```typescript
  // compile & step
  let step: any = null;
  if (autoCompile && !(dedup && (kind === 'WHY' || kind === 'GROUNDS'))) {
    await compileFromMoves(deliberationId).catch(() => {});
    
    // NEW: Sync Ludics to AIF immediately after compilation
    try {
      await syncLudicsToAif(deliberationId);
    } catch (err) {
      console.error('[ludics] AIF sync failed:', err);
      // Don't fail the move if sync fails
    }
  }
  
  if (autoStep) {
    const designs = await prisma.ludicDesign.findMany({
      where: { deliberationId },
      orderBy: [{ participantId:'asc' }, { id:'asc' }],
      select: { id:true, participantId:true },
    });
    // ... rest of stepping logic
  }
```

**Import** (top of file):
```typescript
import { syncLudicsToAif } from '@/lib/ludics/syncToAif';
```

**DoD**:
- [ ] Sync runs after every `compileFromMoves`
- [ ] Errors are logged but don't break move creation
- [ ] Performance impact <50ms
- [ ] Works for WHY, GROUNDS, ASSERT moves

---

### Task 1.4: Create Insights Computation Service

**File**: `lib/ludics/computeInsights.ts` (NEW)

```typescript
import { prisma } from "@/lib/prismaclient";

export interface LudicsInsights {
  deliberationId: string;
  traceStatus: "ONGOING" | "CONVERGENT" | "DIVERGENT" | "STUCK" | null;
  decisiveSteps: number[]; // indices in trace
  orthogonal: boolean | null;
  daimonHints: Array<{ locusPath: string; reason: string }>;
  
  // Per-argument insights
  argumentInsights: Map<string, {
    locusPath: string;
    isDecisive: boolean;
    needsResponse: boolean;
    hasContradiction: boolean;
  }>;
}

/**
 * Compute high-level insights for a deliberation's Ludics state.
 */
export async function computeLudicsInsights(
  deliberationId: string
): Promise<LudicsInsights> {
  // 1. Get latest trace
  const trace = await prisma.ludicTrace.findFirst({
    where: { deliberationId },
    orderBy: { createdAt: "desc" },
    include: {
      posDesign: { include: { acts: { include: { locus: true } } } },
      negDesign: { include: { acts: { include: { locus: true } } } },
    },
  });

  if (!trace) {
    return {
      deliberationId,
      traceStatus: null,
      decisiveSteps: [],
      orthogonal: null,
      daimonHints: [],
      argumentInsights: new Map(),
    };
  }

  const extJson = trace.extJson as any;
  const decisiveIndices = extJson?.decisiveIndices ?? [];

  // 2. Check orthogonality
  const orthogonal = trace.status === "CONVERGENT";

  // 3. Build argument insights map
  const argumentInsights = new Map<string, any>();
  
  const allActs = [
    ...trace.posDesign.acts,
    ...trace.negDesign.acts,
  ];

  for (const act of allActs) {
    const meta = act.metaJson as any;
    if (!meta?.targetId) continue;

    const locusPath = act.locus?.path ?? "0";
    const actIndex = findActIndexInTrace(act.id, trace);
    const isDecisive = actIndex !== null && decisiveIndices.includes(actIndex);
    
    // Check if this locus needs a response (no dual found)
    const needsResponse = checkNeedsResponse(act, allActs);
    
    // Check for contradictions (placeholder - expand later)
    const hasContradiction = false;

    argumentInsights.set(meta.targetId, {
      locusPath,
      isDecisive,
      needsResponse,
      hasContradiction,
    });
  }

  // 4. Compute daimon hints (closed loci)
  const daimonHints = computeDaimonHints(allActs);

  return {
    deliberationId,
    traceStatus: trace.status as any,
    decisiveSteps: decisiveIndices,
    orthogonal,
    daimonHints,
    argumentInsights,
  };
}

function findActIndexInTrace(actId: string, trace: any): number | null {
  const steps = (trace.steps as any)?.pairs ?? [];
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].posActId === actId || steps[i].negActId === actId) {
      return i;
    }
  }
  return null;
}

function checkNeedsResponse(act: any, allActs: any[]): boolean {
  if (act.polarity !== "P") return false; // Only positive acts need responses
  
  const locusPath = act.locus?.path;
  if (!locusPath) return false;
  
  // Check if there's a negative act at this locus
  const hasResponse = allActs.some(
    (a) => a.polarity === "O" && a.locus?.path === locusPath
  );
  
  return !hasResponse;
}

function computeDaimonHints(acts: any[]): Array<{ locusPath: string; reason: string }> {
  const hints: Array<{ locusPath: string; reason: string }> = [];
  
  // Find loci with no openings (closed branches)
  const lociWithOpenings = new Set<string>();
  const allLoci = new Set<string>();
  
  for (const act of acts) {
    const locusPath = act.locus?.path;
    if (!locusPath) continue;
    
    allLoci.add(locusPath);
    
    if (Array.isArray(act.ramification) && act.ramification.length > 0) {
      lociWithOpenings.add(locusPath);
    }
  }
  
  for (const locus of allLoci) {
    if (!lociWithOpenings.has(locus)) {
      hints.push({
        locusPath: locus,
        reason: "no-openings",
      });
    }
  }
  
  return hints;
}
```

**DoD**:
- [ ] Service computes insights from trace
- [ ] Returns decisive steps, orthogonality, daimon hints
- [ ] Per-argument insights mapped to targetId
- [ ] Performance <100ms for typical deliberations

---

### Task 1.5: Create Insights API Endpoint

**File**: `app/api/ludics/insights/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { computeLudicsInsights } from "@/lib/ludics/computeInsights";
import { redis } from "@/lib/redis";

/**
 * GET /api/ludics/insights?deliberationId=xxx
 * Returns computed insights for the deliberation.
 * Cached for 5 minutes.
 */
export async function GET(req: NextRequest) {
  const deliberationId = req.nextUrl.searchParams.get("deliberationId");
  
  if (!deliberationId) {
    return NextResponse.json(
      { error: "deliberationId required" },
      { status: 400 }
    );
  }

  const cacheKey = `ludics:insights:${deliberationId}`;

  // Try cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached), {
        headers: { "X-Cache": "HIT" },
      });
    }
  } catch (err) {
    console.warn("[ludics] Redis cache miss:", err);
  }

  // Compute fresh
  const insights = await computeLudicsInsights(deliberationId);
  
  // Convert Map to object for JSON serialization
  const serializable = {
    ...insights,
    argumentInsights: Object.fromEntries(insights.argumentInsights),
  };

  // Cache for 5 minutes
  try {
    await redis.set(cacheKey, JSON.stringify(serializable), "EX", 300);
  } catch (err) {
    console.warn("[ludics] Redis cache set failed:", err);
  }

  return NextResponse.json(serializable, {
    headers: { "X-Cache": "MISS" },
  });
}

/**
 * POST /api/ludics/insights/invalidate
 * Invalidate cache for a deliberation (called after moves)
 */
export async function POST(req: NextRequest) {
  const { deliberationId } = await req.json();
  
  if (!deliberationId) {
    return NextResponse.json(
      { error: "deliberationId required" },
      { status: 400 }
    );
  }

  const cacheKey = `ludics:insights:${deliberationId}`;
  
  try {
    await redis.del(cacheKey);
  } catch (err) {
    console.warn("[ludics] Redis cache delete failed:", err);
  }

  return NextResponse.json({ ok: true });
}
```

**DoD**:
- [ ] GET endpoint returns insights
- [ ] Redis caching works (5min TTL)
- [ ] POST endpoint invalidates cache
- [ ] Falls back gracefully if Redis unavailable
- [ ] Performance <50ms (cached) or <150ms (uncached)

---

### Task 1.6: Invalidate Cache on Move

**File**: `app/api/dialogue/move/route.ts`

**Add after sync** (around line 520):
```typescript
  if (autoCompile && !(dedup && (kind === 'WHY' || kind === 'GROUNDS'))) {
    await compileFromMoves(deliberationId).catch(() => {});
    
    // Sync Ludics to AIF
    try {
      await syncLudicsToAif(deliberationId);
    } catch (err) {
      console.error('[ludics] AIF sync failed:', err);
    }
    
    // NEW: Invalidate insights cache
    try {
      await fetch(new URL('/api/ludics/insights/invalidate', req.url), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ deliberationId }),
      });
    } catch (err) {
      console.error('[ludics] Cache invalidation failed:', err);
    }
  }
```

**DoD**:
- [ ] Cache invalidated after every move
- [ ] Errors logged but don't fail move
- [ ] Next insights request recomputes fresh

---

## Week 2: UI Integration - Basic Badges

### Task 2.1: Create Badge Components

**File**: `components/ludics/LudicsInsightBadges.tsx` (NEW)

```tsx
"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Zap, MapPin, AlertTriangle } from "lucide-react";

interface LudicsInsightBadgesProps {
  argumentId: string;
  deliberationId: string;
  compact?: boolean;
}

export function LudicsInsightBadges({
  argumentId,
  deliberationId,
  compact = false,
}: LudicsInsightBadgesProps) {
  const [insights, setInsights] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    
    (async () => {
      try {
        const res = await fetch(
          `/api/ludics/insights?deliberationId=${encodeURIComponent(deliberationId)}`
        );
        const data = await res.json();
        
        if (!cancelled) {
          const argInsights = data.argumentInsights?.[argumentId];
          setInsights(argInsights);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[ludics] Failed to fetch insights:", err);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [argumentId, deliberationId]);

  if (loading || !insights) return null;

  return (
    <div className="flex items-center gap-1.5">
      {insights.isDecisive && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
              <Zap className="h-3 w-3 mr-1" />
              {!compact && "Decisive"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              This argument is decisive in the debate trace.
              <br />
              It has no valid counterargument.
            </p>
          </TooltipContent>
        </Tooltip>
      )}

      {insights.locusPath && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-xs">
              <MapPin className="h-3 w-3 mr-1" />
              {insights.locusPath}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              Position in interaction tree
              <br />
              Root: 0, Children: 0.1, 0.2, etc.
            </p>
          </TooltipContent>
        </Tooltip>
      )}

      {insights.needsResponse && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="destructive" className="bg-rose-500">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {!compact && "Needs Response"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              This claim has no opposing argument.
              <br />
              Consider adding grounds or a rebuttal.
            </p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
```

**DoD**:
- [ ] Component renders badges based on insights
- [ ] Tooltips explain each badge
- [ ] Compact mode for dense layouts
- [ ] Graceful loading/error states
- [ ] No layout shift while loading

---

### Task 2.2: Integrate Badges into ArgumentCardV2

**File**: `components/arguments/ArgumentCardV2.tsx`

**Add import**:
```tsx
import { LudicsInsightBadges } from "@/components/ludics/LudicsInsightBadges";
```

**Add to card layout** (near conclusion/metadata section):
```tsx
export function ArgumentCardV2({ argument, deliberationId, ...props }: Props) {
  // ... existing code ...
  
  return (
    <div className="argument-card">
      {/* Existing header */}
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Existing badges (confidence, scheme, etc.) */}
          
          {/* NEW: Ludics insights */}
          <LudicsInsightBadges
            argumentId={argument.id}
            deliberationId={deliberationId}
            compact={false}
          />
        </div>
      </div>
      
      {/* Rest of card */}
    </div>
  );
}
```

**DoD**:
- [ ] Badges appear on all argument cards
- [ ] No performance regression (parallel loading)
- [ ] Works in all contexts (DeepDivePanel, AIFArgumentsListPro, etc.)
- [ ] Graceful degradation if insights fail

---

### Task 2.3: Add to AIFArgumentsListPro

**File**: `components/arguments/AIFArgumentsListPro.tsx`

**Verify ArgumentCardV2 is used**:
```tsx
// This component already uses ArgumentCardV2, so badges will appear automatically
// Just ensure deliberationId is passed:

<ArgumentCardV2
  argument={arg}
  deliberationId={deliberationId} // Ensure this prop exists
  // ... other props
/>
```

**DoD**:
- [ ] Badges visible in Models tab
- [ ] deliberationId prop wired correctly
- [ ] No console errors

---

### Task 2.4: Test End-to-End Flow

**Manual Testing Checklist**:

1. **Create New Argument**:
   - [ ] Open deliberation
   - [ ] Create argument via command card
   - [ ] Verify badge appears within 2 seconds
   - [ ] Tooltip works on hover

2. **Create Challenge (WHY move)**:
   - [ ] Add WHY challenge to argument
   - [ ] Verify "Needs Response" badge appears on original
   - [ ] Verify locus path updates (e.g., 0.1)

3. **Add Grounds**:
   - [ ] Add GROUNDS to challenged argument
   - [ ] Verify "Needs Response" badge disappears
   - [ ] Verify new locus path (e.g., 0.1.1)

4. **Check Decisive Steps**:
   - [ ] Create argument chain with no counter
   - [ ] Verify "⚡ Decisive" badge appears
   - [ ] Tooltip explains why

5. **Cache Performance**:
   - [ ] Reload page
   - [ ] Badges appear <100ms (from cache)
   - [ ] Network tab shows X-Cache: HIT

**DoD**:
- [ ] All manual tests pass
- [ ] No console errors
- [ ] Performance acceptable (<2s for cold load)
- [ ] Badges update on new moves

---

## Week 2 Stretch Goals (if time permits)

### Task 2.5: Add Diagram Overlay (Preview)

**File**: `components/aif/LudicsOverlay.tsx` (NEW)

Skeleton for Phase 3:
```tsx
export function LudicsOverlay({ deliberationId }: { deliberationId: string }) {
  // TODO Phase 3: Render interaction traces on AIF diagram
  return null;
}
```

**File**: `components/aif/AifDiagramViewerDagre.tsx`

Add toggle (disabled for now):
```tsx
<DiagramToolbar>
  {/* Other controls */}
  
  <Button variant="ghost" disabled title="Coming soon: Ludics overlay">
    Show Interaction Trace
  </Button>
</DiagramToolbar>
```

---

## Migration Strategy

### For Existing Deliberations

**Problem**: Deliberations created before Phase 1 have DialogueMoves but no LudicActs/AifNodes.

**Solution**: Lazy backfill on first insights request.

**Implementation** (already in `computeLudicsInsights`):
```typescript
const trace = await prisma.ludicTrace.findFirst({
  where: { deliberationId },
  orderBy: { createdAt: "desc" },
});

if (!trace) {
  // No Ludics data yet - trigger backfill
  await compileFromMoves(deliberationId);
  await syncLudicsToAif(deliberationId);
  
  // Retry
  return computeLudicsInsights(deliberationId);
}
```

**User Experience**:
1. User opens old deliberation
2. No badges initially (no data)
3. First insights request triggers backfill
4. Badges appear after 1-2 seconds
5. Cached for 5 minutes thereafter

---

## Testing Plan

### Unit Tests

**File**: `tests/lib/ludics/syncToAif.test.ts` (NEW)

```typescript
import { syncLudicsToAif } from "@/lib/ludics/syncToAif";
import { prisma } from "@/lib/prismaclient";

describe("syncLudicsToAif", () => {
  it("creates AifNode for each LudicAct", async () => {
    // Arrange: Create test deliberation with acts
    // Act: Run sync
    // Assert: AifNodes created with correct ludicActId
  });

  it("is idempotent (doesn't duplicate nodes)", async () => {
    // Arrange: Run sync once
    // Act: Run sync again
    // Assert: No duplicate AifNodes
  });

  it("creates justification edges", async () => {
    // Arrange: Acts with justifiedByLocus
    // Act: Run sync
    // Assert: AifEdges created
  });
});
```

### Integration Tests

**File**: `tests/api/dialogue/move.test.ts` (existing, add tests)

```typescript
describe("POST /api/dialogue/move", () => {
  it("syncs to AIF after compilation", async () => {
    // Create deliberation
    // Post move with autoCompile=true
    // Verify AifNode exists with ludicActId
  });

  it("invalidates insights cache", async () => {
    // Post move
    // Verify cache invalidated
    // Next insights request recomputes
  });
});
```

---

## Performance Targets

| Operation | Target | Current Baseline |
|-----------|--------|------------------|
| syncLudicsToAif | <50ms | N/A (new) |
| computeLudicsInsights | <100ms | N/A (new) |
| GET /api/ludics/insights (cached) | <20ms | N/A (new) |
| GET /api/ludics/insights (uncached) | <150ms | N/A (new) |
| Total overhead per move | <100ms | 0ms (no sync) |

**Monitoring**: Add timings to console logs (development only).

---

## Rollback Plan

If Phase 1 causes issues:

1. **Revert schema changes**:
   ```bash
   npx prisma migrate revert
   ```

2. **Remove sync call** from `app/api/dialogue/move/route.ts`:
   ```typescript
   // Comment out:
   // await syncLudicsToAif(deliberationId);
   ```

3. **Hide badges** in ArgumentCardV2:
   ```tsx
   {/* Temporarily disabled
   <LudicsInsightBadges ... />
   */}
   ```

**Data**: No data loss (AifNodes are additive, not destructive).

---

## Success Criteria

Phase 1 is complete when:

✅ Every LudicAct has a corresponding AifNode  
✅ Badges appear automatically on argument cards  
✅ Tooltips explain insights clearly  
✅ Performance targets met (<100ms overhead)  
✅ No breaking changes to existing features  
✅ Manual tests pass (create arg → see badge)  

---

## Next Phase Preview

**Phase 2** (Week 3-4): UI Modernization
- Refactor LudicsPanel into smaller components
- Add command-card actions (compile, commit at locus)
- Enhance badges with more insights (contradictions, CQ status)

**Phase 3** (Week 5-6): Diagram Integration
- LudicsOverlay component (render traces on AIF diagrams)
- DebateNode annotations (locus paths)
- Interactive drill-down (click node → see ludics details)

---

## Daily Progress Log

### Day 1 (Nov 3):
- [x] Created implementation plan
- [ ] Schema changes drafted
- [ ] Ready to begin coding

### Day 2:
- [ ] Schema migration applied
- [ ] syncToAif service implemented
- [ ] Initial tests written

### Day 3:
- [ ] Integrated sync into dialogue move
- [ ] computeInsights service implemented
- [ ] Insights endpoint created

### Day 4:
- [ ] Badge component created
- [ ] Integrated into ArgumentCardV2
- [ ] Manual testing begun

### Day 5:
- [ ] Bug fixes from manual testing
- [ ] Performance optimization
- [ ] Documentation updated

---

## Questions & Decisions

**Q1**: Should we sync to AIF synchronously or async (background job)?  
**A**: Synchronous for Phase 1 (simpler). Can optimize to async in Phase 2 if needed.

**Q2**: What if compileFromMoves fails but sync succeeds?  
**A**: Sync happens after compile, so if compile fails, sync doesn't run.

**Q3**: Cache TTL - 5 minutes too long?  
**A**: Start with 5min. Can shorten to 1min if users report stale badges.

---

## Resources

- **Schema docs**: `lib/models/schema.prisma`
- **Existing compile logic**: `packages/ludics-engine/compileFromMoves.ts`
- **AIF models**: Search codebase for `AifNode`, `AifEdge`
- **Badge examples**: `components/ui/badge.tsx`, existing confidence badges

---

## Notes

- Keep changes **minimal and focused** for Phase 1
- Prioritize **stability** over features
- Badge UI can be refined in Phase 2
- Full diagram overlay deferred to Phase 3
- Settings/toggles deferred (user's request)
