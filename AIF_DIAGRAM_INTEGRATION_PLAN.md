# AIF Diagram Integration Plan

## Overview

Integrate AIF (Argument Interchange Format) diagram visualization into the Diagram panel of ArgumentActionsSheet. This will allow users to see the full argumentation structure for a selected argument, including nodes, premises, conclusion, schemes, and critical questions.

## Current State

### ArgumentActionsSheet Structure
**Location**: `/components/arguments/ArgumentActionsSheet.tsx`

**Diagram Panel** (lines ~380-400):
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

### Available Components

**DiagramViewer** (already exists in DeepDivePanelV2):
```tsx
// Location: /components/dialogue/deep-dive/DiagramViewer.tsx
<DiagramViewer
  aifSubgraph={diag.aif}
  width={600}
  height={500}
/>
```

**Current Usage** (DeepDivePanelV2, lines ~1280-1340):
- Used for displaying claim-based AIF diagrams
- Shows in RIGHT sheet when claim is selected
- Renders SVG with nodes, edges, labels
- Interactive (click nodes, zoom, pan)

## Implementation Strategy

### Phase 1: Basic Integration (Straightforward)

#### 1.1 Add Data Fetching
Fetch AIF subgraph for the selected argument:

```tsx
function DiagramPanel({ deliberationId, argument }: DiagramPanelProps) {
  const { data: aifData, isLoading, error } = useSWR(
    `/api/arguments/${argument.id}/aif-diagram`,
    fetcher
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-sm text-white/70">Loading diagram...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !aifData?.aif) {
    return (
      <div className="p-6 rounded-lg bg-white/5 border border-white/10 text-center">
        <div className="text-sm text-white/70">
          Unable to load AIF diagram for this argument
        </div>
      </div>
    );
  }

  // Success: Render diagram
  return (
    <div>
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-white/90 mb-1">AIF Structure</h4>
        <p className="text-xs text-white/60">
          Visual representation of argument structure with {aifData.aif.nodes?.length || 0} nodes
        </p>
      </div>
      
      <DiagramViewer
        aifSubgraph={aifData.aif}
        width={600}
        height={450}
      />
    </div>
  );
}
```

#### 1.2 Create API Endpoint
**File**: `/app/api/arguments/[id]/aif-diagram/route.ts` (NEW)

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
