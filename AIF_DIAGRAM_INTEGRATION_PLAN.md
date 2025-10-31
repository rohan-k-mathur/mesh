# AIF Diagram Integration Plan (REVISED)

**Status**: ✅ REVISED based on architecture review (October 30, 2025)  
**Original Plan**: Obsolete - proposed building features that already exist  
**New Strategy**: Adapt and integrate existing sophisticated AIF diagram system

> **⚠️ Major Revision**: A comprehensive architecture review revealed that the AIF diagram system is **far more advanced** than originally assumed. This plan has been completely revised to leverage existing production-ready components instead of building from scratch.
> 
> **See**: `docs/agora-architecture-review/AIF_DIAGRAM_SYSTEM_ARCHITECTURE_REVIEW.md` for full details.

---

## Executive Summary

### Original Plan vs. Reality

| Feature | Original Plan | Current Reality | Status |
|---------|--------------|-----------------|--------|
| Static viewer | Build basic SVG renderer | ✅ 4 complete viewer phases exist | **Already Done** |
| Node interactions | Add click handlers | ✅ All viewers have click handlers | **Already Done** |
| Zoom/Pan | Implement controls | ✅ Multiple zoom implementations (wheel, drag, buttons) | **Already Done** |
| Legend | Create visual guide | ✅ Collapsible legend with all node types | **Already Done** |
| Attack visualization | Highlight conflicts | ✅ Advanced conflict type visualization (rebut/undercut/undermine) | **Already Done** |
| Expansion | Manual proposal | ✅ Interactive API-driven expansion with depth control | **Already Done** |
| Export | Future feature | ✅ SVG/PNG export with clipboard support | **Already Done** |
| Search | Not planned | ✅ Full-text search with navigation | **Already Done** |
| Path tracing | Not planned | ✅ Path highlighting with support/attack/preference detection | **Already Done** |

**Assessment**: Original plan is **~80% obsolete**. The system needs integration, not implementation.

---

## Current State

### Existing AIF Diagram System Architecture

**Production-Ready Components** (already implemented):

1. **`AifDiagramViewerDagre`** (Phase 4 - Complete Viewer)
   - Location: `components/map/Aifdiagramviewerdagre.tsx` (700+ lines)
   - Features: Dagre layout, zoom/pan, search, export, minimap, path highlighting, dialogue state filtering
   - Status: **Ready to integrate**

2. **Data Layer**:
   - `lib/arguments/diagram.ts` - Core AIF subgraph builder
   - `lib/arguments/diagram-neighborhoods.ts` - Multi-argument expansion with depth control
   - Status: **Production-ready**

3. **API Endpoint**:
   - `GET /api/arguments/[id]/aif-neighborhood` - Fetches AIF graphs with configurable depth
   - Query params: `depth`, `includeSupporting`, `includeOpposing`, `includePreferences`, `summaryOnly`
   - Status: **Live and working**

4. **Supporting Components**:
   - `Enhancedaifnodes.tsx` - Zoom-aware node rendering with conflict type visualization
   - `Aifpathhighlighter.tsx` - Path tracing and highlighting utilities
   - `aif-examples.ts` - 8 test graphs for validation
   - Status: **All functional**

### ArgumentActionsSheet Current State
**Location**: `/components/arguments/ArgumentActionsSheet.tsx`

**Diagram Panel** (lines ~380-400) - **Placeholder waiting for integration**:
```tsx
function DiagramPanel({ deliberationId, argument }: DiagramPanelProps) {
  return (
    <div>
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-white/90 mb-1">AIF Structure</h4>
        <p className="text-xs text-white/60">
          Visual representation of this argument&apos;s structure
        </p>
      </div>
      
      <div className="p-6 rounded-lg bg-white/5 border border-white/10 text-center">
        <div className="text-sm text-white/70">
          Argument ID: <span className="font-mono">{argument.id.slice(0, 12)}...</span>
        </div>
        <div className="text-xs text-white/50 mt-2">
          (Diagram viewer will be integrated here)
        </div>
      </div>
    </div>
  );
}
```

---

## Revised Implementation Strategy

### Overview
**Goal**: Integrate existing `AifDiagramViewerDagre` component into ArgumentActionsSheet  
**Timeline**: 10-15 hours total (vs. weeks in original plan)  
**Approach**: Direct integration → Customization → Enhancement → Optimization

---

### Phase 1: Direct Integration (1-2 hours) ✅ READY TO START

**Goal**: Get AifDiagramViewerDagre working in ArgumentActionsSheet with minimal changes

#### 1.1 Add Dependencies
```bash
# Already installed, verify in package.json:
# - swr (for data fetching)
# - elkjs (for layout - already used by viewer)
```

#### 1.2 Update DiagramPanel Component
**File**: `components/arguments/ArgumentActionsSheet.tsx`

```tsx
import { AifDiagramViewerDagre } from '@/components/map/Aifdiagramviewerdagre';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function DiagramPanel({ deliberationId, argument }: DiagramPanelProps) {
  const { data, isLoading, error } = useSWR(
    `/api/arguments/${argument.id}/aif-neighborhood?depth=1`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-white/70">Loading AIF diagram...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data?.ok || !data?.aif) {
    return (
      <div className="p-6 rounded-lg bg-white/5 border border-white/10 text-center">
        <div className="text-sm text-red-400">
          Unable to load AIF diagram
        </div>
        <div className="text-xs text-white/50 mt-1">
          {error?.message || 'Unknown error'}
        </div>
      </div>
    );
  }

  // Success: Render diagram
  const nodeCount = data.aif.nodes?.length || 0;
  const edgeCount = data.aif.edges?.length || 0;

  return (
    <div>
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-white/90 mb-1">AIF Structure</h4>
        <p className="text-xs text-white/60">
          {nodeCount} nodes · {edgeCount} edges · Interactive diagram
        </p>
      </div>
      
      {/* Diagram viewer with fixed height for sheet context */}
      <div className="h-[450px] rounded-lg overflow-hidden bg-white">
        <AifDiagramViewerDagre
          initialGraph={data.aif}
          layoutPreset="compact"
          deliberationId={deliberationId}
          onNodeClick={(nodeId) => {
            console.log('AIF node clicked:', nodeId);
            // TODO: Add navigation logic if needed
          }}
          className="w-full h-full"
        />
      </div>

      {/* Help text */}
      <div className="mt-3 p-2 rounded bg-white/5 border border-white/10 text-xs text-white/60">
        <div className="font-semibold mb-1">Controls:</div>
        <div>• Drag to pan • Shift+Drag to zoom • Click nodes to explore</div>
        <div>• Use search (top) to find nodes • Export via menu (top-right)</div>
      </div>
    </div>
  );
}
```

#### 1.3 Verify API Endpoint
**No action needed** - Endpoint already exists:
- `GET /api/arguments/[id]/aif-neighborhood`
- Location: `app/api/arguments/[id]/aif-neighborhood/route.ts`
- Status: ✅ Production-ready

#### 1.4 Testing Checklist
- [ ] Diagram loads successfully for test arguments
- [ ] Loading state shows spinner
- [ ] Error state handles missing data gracefully
- [ ] Zoom/pan controls work
- [ ] Node clicks log to console
- [ ] Layout fits within sheet height constraint (450px)

**Deliverable**: Working AIF diagram in ArgumentActionsSheet (basic integration)

---

### Phase 2: Customization for Sheet Context (2-3 hours)

**Goal**: Adapt viewer for ArgumentActionsSheet's specific needs and constraints

#### 2.1 Configure Viewer Props
```tsx
<AifDiagramViewerDagre
  initialGraph={data.aif}
  layoutPreset="compact"              // Optimized for small spaces
  deliberationId={deliberationId}     // Enables dialogue state filtering
  onNodeClick={handleNodeClick}       // Custom navigation logic
  
  // Optional: Hide some features for cleaner UI in constrained space
  // showMinimap={false}              // Remove minimap (redundant in small view)
  // showLegend={false}               // Remove legend (explain in help text)
  // showSearch={true}                // Keep search (useful)
  
  className="w-full h-full"
/>
```

#### 2.2 Add Node Navigation Logic
```tsx
function handleNodeClick(nodeId: string) {
  // Parse node ID format: "I:claimId", "RA:argId", "CA:caId", "PA:paId"
  const [nodeType, entityId] = nodeId.split(':');
  
  switch (nodeType) {
    case 'I': // I-node (claim)
      // Navigate to claim in deliberation
      window.dispatchEvent(new CustomEvent('mesh:claim:focus', {
        detail: { claimId: entityId }
      }));
      break;
      
    case 'RA': // RA-node (argument)
      // Switch to different argument in same sheet
      setSelectedArgument({ id: entityId });
      setActivePanel('details'); // Show details for new argument
      break;
      
    case 'CA': // CA-node (conflict)
      // Could show conflict details modal
      console.log('Conflict node clicked:', entityId);
      break;
      
    case 'PA': // PA-node (preference)
      // Could show preference details
      console.log('Preference node clicked:', entityId);
      break;
  }
}
```

#### 2.3 Add Depth Control (Optional)
```tsx
const [depth, setDepth] = useState(1);

// Update SWR key when depth changes
const { data } = useSWR(
  `/api/arguments/${argument.id}/aif-neighborhood?depth=${depth}`,
  fetcher
);

// Add depth selector UI
<div className="mb-2 flex items-center gap-2">
  <span className="text-xs text-white/60">Neighborhood depth:</span>
  <select
    value={depth}
    onChange={(e) => setDepth(Number(e.target.value))}
    className="text-xs bg-white/10 border border-white/20 rounded px-2 py-1"
  >
    <option value={0}>Current only</option>
    <option value={1}>1 hop</option>
    <option value={2}>2 hops</option>
    <option value={3}>3 hops</option>
  </select>
</div>
```

#### 2.4 Theme Consideration
**Decision Point**: Keep light diagram theme or adapt to dark sheet theme?

**Recommendation**: Keep light theme (current approach in DeepDivePanelV2)
- Diagram acts as "viewport" into graph structure
- Light background provides better contrast for colored nodes
- Maintains consistency with test page
- Users already familiar with this pattern

**Alternative**: Add dark mode variant (requires more work)
```tsx
// Would need to update all node/edge colors in Enhancedaifnodes.tsx
// Estimated effort: +3-4 hours
```

**Deliverable**: Customized diagram integration optimized for ArgumentActionsSheet context

---

### Phase 3: Feature Enhancement (4-6 hours)

**Goal**: Add features from original plan that don't exist yet

#### 3.1 Critical Question Overlay 🆕

**Missing Feature**: Show CQ status directly on RA-nodes in diagram

```tsx
// Fetch CQs for this argument
const { data: cqData } = useSWR(
  `/api/arguments/${argument.id}/critical-questions`,
  fetcher
);

// Pass to diagram viewer
<AifDiagramViewerDagre
  initialGraph={data.aif}
  criticalQuestions={cqData?.questions}
  ...
/>
```

**Update AifDiagramViewerDagre.tsx** to support CQ overlay:
```tsx
// Add to props
criticalQuestions?: Array<{
  nodeId: string;
  questionId: string;
  text: string;
  status: 'open' | 'satisfied' | 'defeated';
}>;

// In node rendering loop:
{criticalQuestions?.filter(cq => cq.nodeId === node.id).map(cq => (
  <g key={cq.questionId}>
    <circle
      cx={pos.width - 8}
      cy={8}
      r={6}
      fill={cq.status === 'satisfied' ? '#22c55e' : cq.status === 'defeated' ? '#ef4444' : '#eab308'}
      stroke="#fff"
      strokeWidth={1}
    />
    <title>{cq.text} - {cq.status}</title>
  </g>
))}
```

#### 3.2 Comparison Mode 🆕

**Missing Feature**: Side-by-side diagram comparison for two arguments

**Option A**: Add to ArgumentActionsSheet
```tsx
const [comparisonArgId, setComparisonArgId] = useState<string | null>(null);
const [showComparison, setShowComparison] = useState(false);

// Fetch second diagram
const { data: comparisonData } = useSWR(
  comparisonArgId ? `/api/arguments/${comparisonArgId}/aif-neighborhood?depth=1` : null,
  fetcher
);

// Toggle button
<button onClick={() => setShowComparison(!showComparison)}>
  Compare with another argument
</button>

// Split view when comparison active
{showComparison ? (
  <div className="grid grid-cols-2 gap-2 h-[450px]">
    <AifDiagramViewerDagre initialGraph={data.aif} className="h-full" />
    <AifDiagramViewerDagre initialGraph={comparisonData?.aif} className="h-full" />
  </div>
) : (
  <div className="h-[450px]">
    <AifDiagramViewerDagre initialGraph={data.aif} className="h-full" />
  </div>
)}
```

**Option B**: Separate comparison view (modal or new page)
- Less cramped UI
- Can show more details
- Better UX for detailed comparison

#### 3.3 Scheme-Specific Visualization 🔧

**Enhancement**: Visual differentiation by argumentation scheme

**Update Enhancedaifnodes.tsx**:
```tsx
// Add scheme style mapping
const SCHEME_STYLES = {
  expert_opinion: { 
    borderColor: '#3b82f6', 
    icon: '🎓',
    label: 'Expert Opinion' 
  },
  argument_from_analogy: { 
    borderColor: '#8b5cf6', 
    icon: '≈',
    label: 'Analogy' 
  },
  argument_from_consequence: { 
    borderColor: '#10b981', 
    icon: '→',
    label: 'Consequence' 
  },
  // Add more schemes as needed
};

// In EnhancedRANode:
const schemeStyle = node.schemeKey ? SCHEME_STYLES[node.schemeKey] : null;

{schemeStyle && (
  <>
    <rect
      stroke={schemeStyle.borderColor}
      // ... other styling
    />
    <text>{schemeStyle.icon}</text>
  </>
)}
```

#### 3.4 Export Enhancement 🔧

**Current**: AifDiagramExportMenu component exists with SVG/PNG export

**Enhancement**: Add export with metadata
```tsx
// Add to export menu
function exportWithMetadata() {
  const metadata = {
    argumentId: argument.id,
    deliberationId: deliberationId,
    exportDate: new Date().toISOString(),
    nodeCount: data.aif.nodes.length,
    edgeCount: data.aif.edges.length,
  };
  
  // Include metadata in export
  // ... export logic
}
```

**Deliverable**: Feature-complete integration with CQ overlay, comparison mode, and enhanced scheme visualization

---

### Phase 4: Performance Optimization (3-4 hours)

**Goal**: Improve loading speed and reduce database load

#### 4.1 Client-Side Caching (SWR Configuration)
```tsx
// Already added in Phase 1, verify configuration:
useSWR(
  `/api/arguments/${argument.id}/aif-neighborhood?depth=${depth}`,
  fetcher,
  {
    revalidateOnFocus: false,      // Don't refetch on window focus
    revalidateOnReconnect: false,  // Don't refetch on reconnect
    dedupingInterval: 60000,       // Dedupe requests within 1 minute
    revalidateIfStale: true,       // Revalidate if data is stale
    refreshInterval: 0,            // No automatic refresh
  }
);
```

#### 4.2 Server-Side Caching
**File**: `app/api/arguments/[id]/aif-neighborhood/route.ts`

**Option A**: Next.js unstable_cache
```typescript
import { unstable_cache } from 'next/cache';

const getCachedNeighborhood = unstable_cache(
  async (argumentId: string, depth: number, options: any) => {
    return buildAifNeighborhood(argumentId, depth, options);
  },
  ['aif-neighborhood'],
  {
    revalidate: 300,              // 5 minutes
    tags: ['aif-diagrams'],       // For manual invalidation
  }
);

export async function GET(req: NextRequest, { params }: any) {
  // ... parse params
  const aif = await getCachedNeighborhood(argumentId, depth, options);
  // ... return response
}
```

**Option B**: Redis cache layer
```typescript
import { redis } from '@/lib/redis';

const cacheKey = `aif:${argumentId}:d${depth}:${optionsHash}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return NextResponse.json({ ok: true, aif: JSON.parse(cached) });
}

const aif = await buildAifNeighborhood(argumentId, depth, options);
await redis.set(cacheKey, JSON.stringify(aif), 'EX', 300); // 5 min TTL

return NextResponse.json({ ok: true, aif });
```

#### 4.3 Database Query Optimization
**File**: `lib/arguments/diagram-neighborhoods.ts`

**Current Issue**: Recursive queries cause N+1 problem

**Solution**: Batch fetching
```typescript
// Instead of recursive explore() with individual DB calls:

async function buildAifNeighborhood(argumentId: string, depth: number, options: any) {
  // Phase 1: Collect all argument IDs via BFS
  const argumentIds = new Set<string>([argumentId]);
  const queue = [{ id: argumentId, depth: 0 }];
  const visited = new Set<string>();
  
  while (queue.length > 0) {
    const { id, depth: currentDepth } = queue.shift()!;
    if (currentDepth >= depth || visited.has(id)) continue;
    visited.add(id);
    
    // Collect connected IDs (lightweight query)
    const connected = await getConnectedArgumentIds(id, options);
    for (const connId of connected) {
      argumentIds.add(connId);
      queue.push({ id: connId, depth: currentDepth + 1 });
    }
  }
  
  // Phase 2: Batch fetch all arguments and related data
  const [arguments, conflicts, preferences] = await Promise.all([
    prisma.argument.findMany({
      where: { id: { in: Array.from(argumentIds) } },
      include: { premises: true },
    }),
    prisma.conflictApplication.findMany({
      where: {
        OR: [
          { conflictingArgumentId: { in: Array.from(argumentIds) } },
          { conflictedArgumentId: { in: Array.from(argumentIds) } },
        ]
      }
    }),
    prisma.preferenceApplication.findMany({
      where: {
        OR: [
          { preferredArgumentId: { in: Array.from(argumentIds) } },
          { dispreferredArgumentId: { in: Array.from(argumentIds) } },
        ]
      }
    }),
  ]);
  
  // Phase 3: Build graph from in-memory data (no more DB calls)
  return buildGraphFromData(arguments, conflicts, preferences);
}
```

**Estimated improvement**: 5-10x faster for depth > 1

#### 4.4 Preloading Strategy
```tsx
// In ArgumentActionsSheet, preload diagram when argument is selected
useEffect(() => {
  if (selectedArgument?.id) {
    // Prefetch diagram data
    fetch(`/api/arguments/${selectedArgument.id}/aif-neighborhood?depth=1`)
      .then(r => r.json())
      .catch(() => {}); // Silent fail, SWR will handle actual request
  }
}, [selectedArgument?.id]);
```

#### 4.5 Performance Monitoring
```tsx
// Add performance tracking
useEffect(() => {
  if (data && !isLoading) {
    const loadTime = performance.now() - startTime;
    console.log(`AIF diagram loaded in ${loadTime.toFixed(0)}ms`, {
      nodes: data.aif.nodes.length,
      edges: data.aif.edges.length,
      depth,
    });
    
    // Optional: Send to analytics
    // trackEvent('aif_diagram_loaded', { loadTime, nodeCount, ... });
  }
}, [data, isLoading]);
```

**Deliverable**: Optimized integration with 5-10x faster loading and reduced server load

---

### Phase 5: Testing & Documentation (2-3 hours)

**Goal**: Ensure quality and provide maintainability documentation

#### 5.1 Integration Tests
```typescript
// tests/integration/aif-diagram-integration.test.tsx

describe('AIF Diagram Integration', () => {
  it('should load diagram for valid argument', async () => {
    const { getByTestId } = render(<DiagramPanel argument={mockArg} ... />);
    await waitFor(() => {
      expect(getByTestId('aif-diagram')).toBeInTheDocument();
    });
  });
  
  it('should show loading state', () => {
    const { getByText } = render(<DiagramPanel ... />);
    expect(getByText(/Loading AIF diagram/i)).toBeInTheDocument();
  });
  
  it('should handle API errors gracefully', async () => {
    server.use(
      rest.get('/api/arguments/:id/aif-neighborhood', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );
    
    const { getByText } = render(<DiagramPanel ... />);
    await waitFor(() => {
      expect(getByText(/Unable to load/i)).toBeInTheDocument();
    });
  });
  
  it('should navigate to claim on I-node click', async () => {
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
    // ... test node click navigation
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'mesh:claim:focus',
      })
    );
  });
});
```

#### 5.2 User Documentation
**File**: `docs/user-guides/AIF_DIAGRAM_USAGE.md` (NEW)

```markdown
# Using AIF Diagrams in Mesh

## Overview
AIF (Argument Interchange Format) diagrams visualize the structure of arguments,
showing premises, conclusions, conflicts, and preferences in a standardized format.

## Accessing Diagrams
1. Open any argument in the deliberation
2. Click "Diagram" tab in the ArgumentActionsSheet
3. The AIF diagram loads automatically

## Node Types
- **I-nodes** (Yellow rectangles): Information/Claims
- **RA-nodes** (Blue circles): Regular Arguments (inferences)
- **CA-nodes** (Red): Conflict Applications (attacks)
- **PA-nodes** (Green): Preference Applications

## Controls
- **Pan**: Click and drag
- **Zoom**: Shift + drag vertically
- **Node selection**: Click any node
- **Search**: Use search box (top) to find nodes by text
- **Export**: Menu (top-right) → SVG or PNG
- **Path highlighting**: Click node → see available paths panel

## Conflict Types
- ⊥ Rebut: Direct contradiction of conclusion
- ⇏ Undercut: Challenges the inference step
- ⊗ Undermine: Questions a premise

## Advanced Features
- **Depth control**: Expand to see connected arguments
- **Dialogue filtering**: Filter by completion status
- **Path tracing**: Visualize support/attack paths
```

#### 5.3 Developer Documentation
**File**: `docs/dev/AIF_DIAGRAM_ARCHITECTURE.md` (link to existing review doc)

```markdown
# AIF Diagram Architecture

See comprehensive review: `docs/agora-architecture-review/AIF_DIAGRAM_SYSTEM_ARCHITECTURE_REVIEW.md`

## Quick Reference

### Components
- `AifDiagramViewerDagre` - Main viewer (Phase 4, production-ready)
- `Enhancedaifnodes` - Zoom-aware node rendering
- `Aifpathhighlighter` - Path tracing utilities

### Data Flow
ArgumentActionsSheet 
  → useSWR fetch 
  → /api/arguments/:id/aif-neighborhood 
  → buildAifNeighborhood() 
  → Prisma queries 
  → AifSubgraph 
  → AifDiagramViewerDagre 
  → SVG rendering

### Adding New Features
1. Check if feature exists in test page (app/test/aif-diagrams/page.tsx)
2. If exists, enable via props
3. If not, extend AifDiagramViewerDagre or create new viewer variant

### Performance Tips
- Use SWR caching (already configured)
- Keep depth ≤ 2 for interactive use
- Batch DB queries for depth > 1
- Monitor node count (200+ nodes may slow layout)
```

#### 5.4 Code Comments
Add JSDoc comments to key integration points:

```tsx
/**
 * DiagramPanel - Renders AIF diagram for selected argument
 * 
 * Uses AifDiagramViewerDagre (Phase 4 complete viewer) with:
 * - Dagre hierarchical layout
 * - Interactive expansion
 * - Zoom/pan controls
 * - Search and export
 * - Path highlighting
 * 
 * Data fetched from /api/arguments/[id]/aif-neighborhood
 * with depth=1 (immediate neighbors only)
 * 
 * @param deliberationId - For dialogue state filtering
 * @param argument - Selected argument to visualize
 */
function DiagramPanel({ deliberationId, argument }: DiagramPanelProps) {
  // ...
}
```

#### 5.5 Troubleshooting Guide
**File**: `docs/troubleshooting/AIF_DIAGRAMS.md` (NEW)

```markdown
# AIF Diagram Troubleshooting

## Common Issues

### Diagram not loading
- **Check**: API endpoint returns 200 OK
- **Check**: Response has `ok: true` and `aif` property
- **Fix**: Verify argument exists in database
- **Fix**: Check network tab for errors

### Layout looks broken
- **Cause**: Node count > 200 (layout computation expensive)
- **Fix**: Reduce depth or use filters
- **Fix**: Consider showing "graph too large" message

### Zoom/pan not working
- **Check**: Event handlers not blocked by parent
- **Fix**: Ensure `<svg>` has proper event listeners
- **Fix**: Check browser console for errors

### Nodes overlapping
- **Cause**: Layout algorithm needs tuning for specific graph shape
- **Fix**: Try different layoutPreset ('standard', 'compact', 'wide')
- **Fix**: Adjust spacing in useDagreLayout configuration

## Performance Issues

### Slow initial load
- **Check**: Network tab - is API call taking > 1s?
- **Fix**: Add server-side caching (Phase 4)
- **Fix**: Optimize DB queries (batch fetching)

### Laggy interactions
- **Cause**: Too many nodes rendering
- **Fix**: Implement node virtualization (future work)
- **Fix**: Reduce depth or use filters
```

**Deliverable**: Fully tested and documented integration

---

## Timeline & Effort Estimate

### Revised Estimates (based on architecture review)

| Phase | Original Estimate | Revised Estimate | Reason for Change |
|-------|------------------|------------------|-------------------|
| Phase 1: Direct Integration | N/A (build from scratch) | **1-2 hours** | Component already exists |
| Phase 2: Customization | N/A | **2-3 hours** | Minor prop configuration |
| Phase 3: Enhancement | ~8-10 hours | **4-6 hours** | Only missing features (CQ, comparison) |
| Phase 4: Optimization | Not planned | **3-4 hours** | Add caching and batch queries |
| Phase 5: Testing & Docs | 2-3 hours | **2-3 hours** | Same as original |
| **TOTAL** | **~15-20 hours** | **12-18 hours** | 20-40% faster |

### Minimum Viable Integration
**Phases 1-2 only**: 3-5 hours
- Working diagram in ArgumentActionsSheet
- Basic customization
- Ready for user feedback

### Feature-Complete Integration
**Phases 1-3**: 7-11 hours
- All features from original plan
- CQ overlay + comparison mode
- Enhanced scheme visualization

### Production-Ready Integration
**All phases**: 12-18 hours
- Optimized performance
- Full test coverage
- Complete documentation

---

## Success Criteria

### Phase 1 Complete ✅
- [ ] AIF diagram renders in ArgumentActionsSheet
- [ ] Loading and error states work
- [ ] Zoom/pan controls functional
- [ ] Node clicks log to console
- [ ] Layout fits sheet height (450px)

### Phase 2 Complete ✅
- [ ] Navigation logic implemented (I-node → claim, RA-node → argument)
- [ ] Compact layout preset applied
- [ ] Help text added
- [ ] Depth control working (optional)
- [ ] Theme decision documented

### Phase 3 Complete ✅
- [ ] CQ overlay showing on RA-nodes
- [ ] Comparison mode functional
- [ ] Scheme-specific styling working
- [ ] Export includes metadata

### Phase 4 Complete ✅
- [ ] SWR caching configured
- [ ] Server-side cache implemented
- [ ] DB queries optimized (batch fetching)
- [ ] Load time < 500ms for depth=1
- [ ] Performance metrics tracked

### Phase 5 Complete ✅
- [ ] Integration tests passing
- [ ] User documentation complete
- [ ] Developer documentation complete
- [ ] Troubleshooting guide created
- [ ] Code comments added

---

## Risk Assessment & Mitigation

### Low Risk ✅
- **Integration itself** - Component is production-ready
- **API endpoint** - Already working and tested
- **Basic functionality** - All core features exist

### Medium Risk ⚠️
- **Performance at high depth** (depth > 2)
  - **Mitigation**: Implement Phase 4 optimizations early
  - **Mitigation**: Add depth warnings in UI
  - **Mitigation**: Default to depth=1

- **Theme integration** (light diagram in dark sheet)
  - **Mitigation**: Keep current pattern (works in DeepDivePanelV2)
  - **Mitigation**: Document decision
  - **Mitigation**: Add dark mode as future enhancement if users request

- **Sheet height constraints**
  - **Mitigation**: Use compact layout preset
  - **Mitigation**: Fixed height (450px) with overflow handling
  - **Mitigation**: Test with various graph sizes

### High Risk 🔴
- **None identified** - Existing system is mature and stable

---

## Dependencies

### Required (Already Available)
- ✅ `AifDiagramViewerDagre` component
- ✅ `lib/arguments/diagram-neighborhoods.ts`
- ✅ `/api/arguments/[id]/aif-neighborhood` endpoint
- ✅ SWR (already in dependencies)
- ✅ ELK.js (already in dependencies)

### Optional (Future Enhancements)
- ⏳ Redis cache (for Phase 4 optimization)
- ⏳ CQ API endpoint (for Phase 3 CQ overlay)
- ⏳ Dark theme variant (if users request)

---

## Migration Notes

### From Original Plan
**Breaking Changes**: None - original plan never implemented

**API Changes**: None needed
- Original plan proposed `/api/arguments/[id]/aif-diagram`
- Existing endpoint `/api/arguments/[id]/aif-neighborhood` is superior
- Can add alias if needed for compatibility

**Component Changes**: None needed
- Original plan proposed using basic DiagramViewer from DeepDivePanelV2
- Using AifDiagramViewerDagre instead (far more capable)

### Backward Compatibility
- No existing integrations to maintain
- First production use of AIF diagram system in argument context
- Test page (app/test/aif-diagrams/page.tsx) remains unchanged

---

## Future Enhancements (Beyond This Plan)

### Short-Term (Next Quarter)
1. **Dialogue Integration**
   - Show move status on RA-nodes
   - Filter by dialogue phase
   - Highlight arguments awaiting response

2. **Scheme Library**
   - Visual scheme picker
   - Scheme template application
   - Scheme-specific validation

3. **Mobile Optimization**
   - Touch gestures (pinch-to-zoom)
   - Responsive layout
   - Simplified UI for small screens

### Medium-Term (6 Months)
1. **Collaborative Features**
   - Multi-user cursor positions
   - Real-time updates
   - Annotation/comments on nodes

2. **Advanced Analytics**
   - Argument strength visualization
   - Path analysis (strongest support/attack paths)
   - Graph metrics dashboard

3. **AI Integration**
   - Suggest missing premises
   - Detect implicit arguments
   - Recommend relevant schemes

### Long-Term (12+ Months)
1. **3D Visualization**
   - Hierarchical 3D layout
   - VR/AR support
   - Interactive exploration

2. **Import/Export Standards**
   - AIF-JSON-LD full support
   - Integration with external tools (OVA, Rationale)
   - Standard format compliance

---

## Appendix A: Component Comparison

### AifDiagramViewerDagre (Recommended)
**Pros**:
- ✅ Most feature-complete
- ✅ Production-ready
- ✅ Dialogue state filtering
- ✅ Search, export, path highlighting
- ✅ Collapsible legend
- ✅ Minimap

**Cons**:
- ⚠️ Heavy (includes all features)
- ⚠️ May need customization for constrained spaces

**Best For**: Primary integration in ArgumentActionsSheet

### AifDiagramViewSemanticZoom (Alternative)
**Pros**:
- ✅ Semantic zoom (detail levels)
- ✅ Interactive expansion
- ✅ Lighter than Dagre version

**Cons**:
- ❌ No search
- ❌ No export menu
- ❌ No minimap
- ❌ No path highlighting

**Best For**: Embedded views where space is very limited

### AifDiagramViewInteractive (Alternative)
**Pros**:
- ✅ Interactive expansion
- ✅ Expansion filters
- ✅ Lightweight

**Cons**:
- ❌ No zoom
- ❌ No search/export
- ❌ Basic layout only

**Best For**: Simple expansion-focused views

### AifDiagramView (Alternative)
**Pros**:
- ✅ Simplest option
- ✅ Static rendering
- ✅ Lightweight

**Cons**:
- ❌ No expansion
- ❌ No zoom (only pan)
- ❌ No advanced features

**Best For**: Static diagram exports or documentation

---

## Appendix B: API Endpoint Details

### GET /api/arguments/:id/aif-neighborhood

**Query Parameters**:
```typescript
depth?: number              // 0-5, default: 1
summaryOnly?: boolean       // default: false
includeSupporting?: boolean // default: true
includeOpposing?: boolean   // default: true
includePreferences?: boolean // default: true
```

**Response (Full Graph)**:
```json
{
  "ok": true,
  "aif": {
    "nodes": [
      {
        "id": "I:claim123",
        "kind": "I",
        "label": "Claim text...",
        "schemeKey": null
      },
      {
        "id": "RA:arg456",
        "kind": "RA",
        "label": "Argument 456",
        "schemeKey": "expert_opinion"
      }
    ],
    "edges": [
      {
        "id": "e:arg456:prem:claim123",
        "from": "I:claim123",
        "to": "RA:arg456",
        "role": "premise"
      }
    ]
  }
}
```

**Response (Summary Only)**:
```json
{
  "ok": true,
  "summary": {
    "supportCount": 3,
    "conflictCount": 2,
    "preferenceCount": 1,
    "totalConnections": 6
  }
}
```

**Error Response**:
```json
{
  "ok": false,
  "error": "Failed to fetch neighborhood"
}
```

---

## Appendix C: Resources

### Documentation
- [AIF Diagram System Architecture Review](docs/agora-architecture-review/AIF_DIAGRAM_SYSTEM_ARCHITECTURE_REVIEW.md) - Comprehensive analysis
- [CHUNK 1B Fixes](docs/agora-architecture-review/CHUNK_1B_FIXES.md) - Related AIF improvements

### Test Resources
- Test page: `app/test/aif-diagrams/page.tsx`
- Example graphs: `components/map/aif-examples.ts`
- API testing: Postman/Bruno collection (TBD)

### External References
- [AIF Specification](http://www.arg.tech/aif)
- [Argument Web](http://www.argumentationsoftware.com)
- [ELK.js Documentation](https://eclipse.dev/elk/)
- [Dagre Documentation](https://github.com/dagrejs/dagre)

---

## Change Log

### v2.0 (October 30, 2025) - MAJOR REVISION
- **Complete rewrite based on architecture review**
- Discovered existing AIF diagram system is production-ready
- Changed strategy from "build" to "integrate and enhance"
- Reduced timeline from weeks to 12-18 hours
- Added comprehensive component analysis
- Added performance optimization phase
- Added testing and documentation phase

### v1.0 (Original) - OBSOLETE
- Proposed building AIF diagram from scratch
- Assumed basic DiagramViewer from DeepDivePanelV2
- Estimated weeks of work
- Did not account for existing sophisticated system

---

**Document Status**: ✅ READY FOR IMPLEMENTATION  
**Next Step**: Begin Phase 1 (Direct Integration)  
**Owner**: TBD  
**Target Completion**: TBD

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAIFSubgraph } from "@/lib/arguments/diagram";

/**
 * GET /api/arguments/[id]/aif-diagram
 * 
 * Returns AIF subgraph for an argument including:
 * - All nodes (I-nodes, S-nodes, RA-nodes)
 * - Edges (premise, conclusion, conflict, preference)
 * - Scheme metadata
 * - Critical questions
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const argumentId = params.id;

  try {
    // Use existing diagram generation logic
    const aif = await getAIFSubgraph({
      targetType: "argument",
      targetId: argumentId,
      includeAttacks: true,
      includeSupports: true,
      depth: 2, // Include immediate neighbors
    });

    return NextResponse.json(
      { ok: true, aif },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[aif-diagram] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to generate AIF diagram" },
      { status: 500 }
    );
  }
}
```

#### 1.3 Import DiagramViewer
Add to ArgumentActionsSheet.tsx:

```tsx
import { DiagramViewer } from "@/components/dialogue/deep-dive/DiagramViewer";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());
```

### Phase 2: Enhanced Features

#### 2.1 Interactive Node Clicks
Allow users to click nodes in the diagram to navigate:

```tsx
<DiagramViewer
  aifSubgraph={aifData.aif}
  width={600}
  height={450}
  onNodeClick={(nodeId, nodeData) => {
    // Navigate to related claim or argument
    if (nodeData.type === "I") {
      // I-node: Navigate to claim
      window.dispatchEvent(new CustomEvent("mesh:claim:focus", {
        detail: { claimId: nodeId }
      }));
    } else if (nodeData.type === "RA") {
      // RA-node: Select different argument
      setSelectedArgument({ id: nodeId });
    }
  }}
/>
```

#### 2.2 Diagram Controls
Add zoom, pan, reset controls:

```tsx
<div className="mb-3 flex items-center gap-2">
  <button className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs">
    Zoom In
  </button>
  <button className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs">
    Zoom Out
  </button>
  <button className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs">
    Reset View
  </button>
  <button className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs">
    Export SVG
  </button>
</div>
```

#### 2.3 Legend
Add visual legend explaining node types:

```tsx
<div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
  <div className="text-xs font-semibold text-white/80 mb-2">Legend</div>
  <div className="grid grid-cols-2 gap-2 text-xs">
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-blue-400" />
      <span className="text-white/70">Information (I-node)</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-green-400" />
      <span className="text-white/70">Scheme (S-node)</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-purple-400" />
      <span className="text-white/70">Rule App (RA-node)</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-0.5 bg-red-500" />
      <span className="text-white/70">Conflict</span>
    </div>
  </div>
</div>
```

### Phase 3: Advanced Visualization

#### 3.1 Attack Highlighting
Highlight incoming attacks in the diagram:

```tsx
const highlightedEdges = useMemo(() => {
  if (!aifData?.attacks) return [];
  return aifData.attacks.map((attack: any) => ({
    from: attack.fromArgumentId,
    to: argument.id,
    type: attack.attackType, // REBUTS, UNDERCUTS, UNDERMINES
    color: "red",
    width: 2,
  }));
}, [aifData, argument.id]);

<DiagramViewer
  aifSubgraph={aifData.aif}
  highlightedEdges={highlightedEdges}
  width={600}
  height={450}
/>
```

#### 3.2 Critical Questions Overlay
Show CQ status directly on the diagram:

```tsx
const cqOverlay = useMemo(() => {
  if (!aifData?.cqs) return null;
  return aifData.cqs.map((cq: any) => ({
    nodeId: cq.targetNodeId,
    badge: cq.satisfied ? "✅" : "❓",
    tooltip: cq.question,
  }));
}, [aifData]);

<DiagramViewer
  aifSubgraph={aifData.aif}
  overlays={cqOverlay}
  width={600}
  height={450}
/>
```

#### 3.3 Comparison Mode
Side-by-side comparison of multiple arguments:

```tsx
const [comparisonArgumentId, setComparisonArgumentId] = useState<string | null>(null);

// Fetch second diagram
const { data: comparisonAif } = useSWR(
  comparisonArgumentId ? `/api/arguments/${comparisonArgumentId}/aif-diagram` : null,
  fetcher
);

// Render split view
<div className="grid grid-cols-2 gap-4">
  <DiagramViewer aifSubgraph={aifData.aif} width={280} height={400} />
  <DiagramViewer aifSubgraph={comparisonAif?.aif} width={280} height={400} />
</div>
```

## Technical Details

### AIF Subgraph Structure
```typescript
interface AifSubgraph {
  nodes: Array<{
    nodeID: string;
    text: string;
    type: "I" | "S" | "RA" | "CA" | "PA" | "MA";
    metadata?: {
      schemeKey?: string;
      schemeName?: string;
      claimId?: string;
      argumentId?: string;
    };
  }>;
  edges: Array<{
    fromID: string;
    toID: string;
    formEdgeID?: string;
  }>;
  locutions?: any[];
  schemeSets?: any[];
}
```

### Existing Diagram Generation
**File**: `/lib/arguments/diagram.ts`

Functions available:
- `getAIFSubgraph()`: Generate AIF structure from argument
- `buildNodeMap()`: Create node lookup map
- `buildEdgeList()`: Extract edges from AIF
- `layoutNodes()`: Position nodes for visualization

### DiagramViewer Props
```typescript
interface DiagramViewerProps {
  aifSubgraph: AifSubgraph;
  width?: number;
  height?: number;
  onNodeClick?: (nodeId: string, nodeData: any) => void;
  highlightedEdges?: Array<{ from: string; to: string; color: string }>;
  overlays?: Array<{ nodeId: string; badge: string; tooltip: string }>;
  interactive?: boolean;
  showLabels?: boolean;
}
```

## Implementation Checklist

### Phase 1: Basic Integration ✅
- [ ] Create `/app/api/arguments/[id]/aif-diagram/route.ts`
- [ ] Add `useSWR` hook to DiagramPanel
- [ ] Import DiagramViewer component
- [ ] Add loading/error states
- [ ] Render basic diagram
- [ ] Test with real argument data

### Phase 2: Enhanced Features
- [ ] Add interactive node clicks
- [ ] Implement zoom/pan controls
- [ ] Add diagram legend
- [ ] Add export functionality
- [ ] Test navigation between arguments

### Phase 3: Advanced Visualization
- [ ] Implement attack highlighting
- [ ] Add CQ status overlays
- [ ] Build comparison mode
- [ ] Add filters (show/hide attack types)
- [ ] Performance optimization for large diagrams

## Dependencies

### Required Imports
```tsx
// ArgumentActionsSheet.tsx
import { DiagramViewer } from "@/components/dialogue/deep-dive/DiagramViewer";
import useSWR from "swr";
import type { AifSubgraph } from "@/lib/arguments/diagram";
```

### Required Functions
```typescript
// /lib/arguments/diagram.ts (existing)
export { getAIFSubgraph, buildNodeMap, buildEdgeList };
```

### API Endpoint
```typescript
// /app/api/arguments/[id]/aif-diagram/route.ts (NEW)
```

## Expected Behavior

### User Flow
1. User clicks argument card in Models tab
2. Notification badge appears on Actions sheet button
3. User clicks Actions button to open sheet
4. User navigates to Diagram tab
5. Loading spinner appears while fetching AIF data
6. Diagram renders with nodes, edges, labels
7. User can click nodes to navigate
8. User can zoom/pan to explore structure

### Diagram Features
- **Nodes**: Colored by type (I-node blue, S-node green, RA-node purple)
- **Edges**: Directed arrows showing relationships
- **Labels**: Truncated text for readability
- **Tooltips**: Full text on hover
- **Interactivity**: Click to navigate, drag to pan
- **Performance**: Fast rendering for ~50 nodes

## Testing Strategy

### Unit Tests
- DiagramPanel component renders correctly
- API endpoint returns valid AIF structure
- Loading/error states display properly
- Node click handlers fire correctly

### Integration Tests
- Full flow: Select argument → Open sheet → View diagram
- Navigation between arguments via diagram clicks
- Diagram updates when different argument selected
- Error handling when AIF data unavailable

### Visual Regression
- Screenshot comparison for diagram layouts
- Color/styling consistency with design system
- Legend matches actual node colors
- Labels readable at default zoom level

## Timeline Estimate

### Phase 1 (Basic Integration): 2-3 hours
- Create API endpoint: 30 min
- Add DiagramViewer to panel: 30 min
- Implement loading/error states: 30 min
- Testing and debugging: 1 hour

### Phase 2 (Enhanced Features): 3-4 hours
- Interactive clicks: 1 hour
- Zoom/pan controls: 1 hour
- Legend and exports: 1 hour
- Testing: 1 hour

### Phase 3 (Advanced): 4-6 hours
- Attack highlighting: 2 hours
- CQ overlays: 1 hour
- Comparison mode: 2 hours
- Testing and polish: 1 hour

**Total Estimated Time**: 9-13 hours for full implementation

## Success Criteria

✅ Diagram renders correctly for any argument
✅ All node types displayed with proper colors
✅ Edges show correct relationships
✅ Loading states communicate progress
✅ Error states guide user recovery
✅ Interactive features work smoothly
✅ Performance acceptable for large graphs (~50+ nodes)
✅ Visual consistency with design system (glass-dark theme)

## Open Questions

1. **Diagram Size**: Should diagram be resizable? Fixed aspect ratio?
2. **Node Limits**: How to handle arguments with 100+ nodes?
3. **Export Format**: SVG only, or also PNG/PDF?
4. **Persistence**: Save user's zoom/pan preferences?
5. **Mobile**: How to handle diagrams on small screens?

## Next Steps

1. Review plan with team
2. Create API endpoint prototype
3. Test with sample argument data
4. Integrate DiagramViewer component
5. Iterate based on user feedback

---

**Notes**:
- DiagramViewer already exists and is battle-tested in DeepDivePanelV2
- AIF diagram generation logic is mature (`/lib/arguments/diagram.ts`)
- Main work is creating endpoint + wiring up data flow
- Phase 1 should be straightforward and low-risk
