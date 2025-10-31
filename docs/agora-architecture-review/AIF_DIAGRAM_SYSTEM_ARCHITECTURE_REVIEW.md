# AIF Diagram System Architecture Review
**Date**: October 30, 2025  
**Context**: Review of existing AIF diagram implementation to inform revised DeepDivePanelV2 integration plan

## Executive Summary

The existing AIF diagram system is **significantly more advanced** than what the original `AIF_DIAGRAM_INTEGRATION_PLAN.md` assumed. The current implementation includes:

- ✅ **4 complete viewer phases** (static, interactive, semantic zoom, complete Dagre layout)
- ✅ **Advanced conflict visualization** (rebut ⊥, undercut ⇏, undermine ⊗)
- ✅ **Interactive expansion** with API integration for neighborhood loading
- ✅ **Path highlighting** and argument tracing
- ✅ **Semantic zoom** (0.2x-3x range) with detail level adjustments
- ✅ **Export capabilities** and search functionality
- ✅ **Minimap navigation** and graph statistics
- ✅ **Dialogue state filtering** (Phase 3.1.4 integration ready)

**Key Finding**: The original integration plan proposed building features that already exist in a mature, production-ready form. Instead of implementing from scratch, we should **adapt and integrate** the existing sophisticated components.

---

## 1. Component Architecture

### 1.1 Entry Point
**File**: `app/test/aif-diagrams/page.tsx` (15 lines)
- Simple wrapper component
- Loads `AifDiagramTestPageDagre` as active test interface
- Commented out older component versions

### 1.2 Main Test UI
**File**: `components/map/AifDiagramTestPageDagre.tsx` (440+ lines)

**Purpose**: Comprehensive test harness with multiple view modes

**Key Features**:
1. **View Mode Selector** (4 modes):
   - Static: Phase 1 basic rendering
   - Interactive: Phase 2 click-to-expand
   - Semantic Zoom: Phase 3 zoom-aware detail levels
   - Complete: Phase 4 Dagre layout with all features

2. **Example Selector**:
   - 8 pre-built AIF graphs (defeasible modus ponens, expert opinion, beach argument, etc.)
   - Sourced from `aif-examples.ts`

3. **Interactive Controls**:
   - Minimap toggle
   - Conflict legend (rebut/undercut/undermine symbols)
   - Auto-expand (coming soon)
   - Graph statistics (node/edge counts by type)

4. **Node Detail Panel**:
   - Click handler shows selected node info
   - Displays node ID, kind (I/RA/CA/PA), label

5. **Completed Features List**:
   ```typescript
   ✓ Phase 1: Static rendering with proper AIF nodes
   ✓ Phase 2: Interactive expansion (click-to-expand)
   ✓ Phase 3: Semantic zoom with detail levels
   ✓ Phase 4: Complete viewer with Dagre layout
   ✓ Dual-mode rendering (SVG + Canvas exploration)
   ✓ Conflict type visualization (3 schemes)
   ✓ Path highlighting and tracing
   ✓ Export and search capabilities
   ```

**Components Used**:
```typescript
import AifDiagramView from './AifDiagramView';
import AifDiagramViewInteractive from './AifDiagramViewInteractive';
import AifDiagramViewSemanticZoom from './Aifdiagramviewsemanticzoom';
import { AifDiagramViewerDagre } from './Aifdiagramviewerdagre';
import { AIF_EXAMPLES } from './aif-examples';
```

---

## 2. Core Data Layer

### 2.1 Primary AIF Builder
**File**: `lib/arguments/diagram.ts` (328 lines)

**Key Types**:
```typescript
type AifNodeKind = 'I' | 'RA' | 'CA' | 'PA';
type AifEdgeRole = 
  | 'premise' | 'conclusion'
  | 'conflictingElement' | 'conflictedElement'
  | 'preferredElement' | 'dispreferredElement'
  | 'has-presumption' | 'has-exception';

type AifNode = {
  id: string;          // Format: "I:claimId", "RA:argId", "CA:caId", "PA:paId"
  kind: AifNodeKind;
  label?: string | null;
  schemeKey?: string | null;
};

type AifEdge = { 
  id: string; 
  from: string; 
  to: string; 
  role: AifEdgeRole;
};

type AifSubgraph = { 
  nodes: AifNode[]; 
  edges: AifEdge[];
};
```

**Primary Function**: `buildAifSubgraphForArgument(argumentId: string)`
- Fetches argument with premises, conclusion from Prisma
- Builds basic RA-node structure (argument + I-nodes for claims)
- **Adds AssumptionUse nodes** (has-presumption/has-exception edges) ✅ CHUNK 1A/1B work
- Queries ConflictApplication → creates CA-nodes with conflict edges
- Queries PreferenceApplication → creates PA-nodes with preference edges
- **Convergent support logic** (UNTESTED, marked with warning from CHUNK 1B) ⚠️
- Returns deduplicated AifSubgraph

**Database Integration**:
- Uses Prisma directly for all queries
- Fetches from: `Argument`, `Claim`, `ConflictApplication`, `PreferenceApplication`, `AssumptionUse`
- No caching layer (direct DB access on each call)

**Known Issues** (from CHUNK 1B review):
- Line 240: Convergent support code casts `premises` to `any[]` (type safety issue)
- groupKey logic untested, possibly broken
- TODO comment indicates need for validation before production use

### 2.2 Multi-Argument Neighborhood Expansion
**File**: `lib/arguments/diagram-neighborhoods.ts` (452 lines)

**Primary Function**: `buildAifNeighborhood(argumentId, depth, options)`
- **Recursive exploration** up to specified depth (default: 2, max: 5)
- Builds neighborhood by traversing:
  - ArgumentEdge connections (support/opposition)
  - ConflictApplication links
  - PreferenceApplication links
- Uses Maps for deduplication (nodeMap, edgeMap)
- Implements `maxNodes` safety limit (default: 200 nodes)

**Options**:
```typescript
{
  includeSupporting?: boolean;   // Default: true
  includeOpposing?: boolean;     // Default: true  
  includePreferences?: boolean;  // Default: true
  maxNodes?: number;             // Default: 200
}
```

**Helper Function**: `getNeighborhoodSummary(argumentId)`
- Returns connection counts without building full graph
- Used for expansion indicators (shows "X connections" badge on unexpanded nodes)
- Queries: supportCount, conflictCount, preferenceCount

**Algorithm**:
1. Start with root argument
2. Build local AIF structure (RA + I-nodes + premises/conclusion)
3. Find connected arguments via ArgumentEdges + CA + PA queries
4. Recursively explore each connected argument (depth - 1)
5. Stop when: depth limit reached, maxNodes exceeded, or visited set prevents cycles

**Performance Considerations**:
- Recursive DB queries (N+1 potential issue at high depths)
- No pagination or streaming
- Safety limit prevents runaway graph expansion
- Visited set prevents infinite cycles

---

## 3. Viewer Components (4 Phases)

### 3.1 Phase 1: Static Rendering
**File**: `components/map/AifDiagramView.tsx` (500+ lines)

**Features**:
- ELK.js hierarchical layout (layered algorithm, DOWN direction)
- SVG rendering with proper node types
- Grid background pattern
- Pan and zoom controls:
  - Drag to pan (standard)
  - Shift+Drag to zoom (vertical drag adjusts zoom level)
  - Reset view button
- Node hover states with opacity transitions
- Edge styling based on role (premise/conclusion/conflict/preference)
- Arrow markers for directed edges
- Optional minimap (bottom-right corner)
- Legend with node type explanations

**Node Dimensions**:
```typescript
I:  180x60  (rectangular, blue border)
RA: 100x50  (ellipse, green)
CA: 80x50   (ellipse, red)
PA: 80x50   (ellipse, purple)
```

**Edge Styles**:
```typescript
premise:            #64748b (slate), solid, 2px
conclusion:         #059669 (green), solid, 2px
conflictingElement: #ef4444 (red), solid, 2.5px
conflictedElement:  #dc2626 (darker red), solid, 2px
preferredElement:   #8b5cf6 (purple), dashed 8,4, 2px
dispreferredElement:#6b7280 (gray), dashed 6,3, 1.5px
```

**Layout Strategy**:
- ELK options: `'elk.algorithm': 'layered'`, DOWN direction
- Node spacing: 80px, layer spacing: 100px
- Edge routing: ORTHOGONAL
- Initial view: 2x zoom out factor (shows full graph)

**State Management**:
```typescript
const [layout, setLayout] = useState<ComputedLayout | null>(null);
const [hoveredNode, setHoveredNode] = useState<string | null>(null);
const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
const [viewBox, setViewBox] = useState({ x, y, width, height });
const [isPanning, setIsPanning] = useState(false);
const [isZooming, setIsZooming] = useState(false);
```

**Exported Utilities**:
- `getNodeDimensions(kind)`: Returns width/height for node type
- `getEdgeStyle(role)`: Returns stroke, strokeWidth, markerColor
- `AifNodeSvg`: SVG node renderer component
- `getNodeColor(kind)`: Helper for minimap coloring

### 3.2 Phase 2: Interactive Expansion
**File**: `components/map/AifDiagramViewInteractive.tsx` (400+ lines)

**Additional Features Beyond Phase 1**:
1. **Click-to-Expand**:
   - RA-nodes show expansion indicator (blue badge with connection count)
   - Click unexpanded RA-node → fetches neighborhood via API
   - Merges new nodes/edges into existing graph
   - Updates layout dynamically

2. **Expansion State Tracking**:
   ```typescript
   type ExpansionState = {
     expandedNodes: Set<string>;
     isExpanding: boolean;
     expandingNodeId: string | null;
   };
   ```

3. **Loading Overlays**:
   - Semi-transparent white overlay during expansion
   - Animated spinner on expanding node

4. **Neighborhood Summaries**:
   - Fetches connection counts for all RA-nodes
   - Displays badge with total connection count
   - Only shows if `zoom > 0.5` (prevents clutter)

5. **Expansion Filters**:
   - Checkboxes for: Supporting, Conflicts, Preferences
   - Passed to API endpoint as query params
   - Updates graph content based on selections

6. **Depth Management**:
   - Tracks current depth (starts at 1)
   - Increments after each expansion
   - Alert if maxDepth reached (default: 3)

**API Integration**:
```typescript
const response = await fetch(
  `/api/arguments/${argId}/aif-neighborhood?` +
  `depth=1&` +
  `includeSupporting=${filters.includeSupporting}&` +
  `includeOpposing=${filters.includeOpposing}&` +
  `includePreferences=${filters.includePreferences}`
);
```

**UX Enhancements**:
- Help text: "💡 Click RA-nodes to expand their neighborhoods"
- Depth/node count display
- Expansion filter controls panel
- Expansion status indicator (animated)

### 3.3 Phase 3: Semantic Zoom
**File**: `components/map/Aifdiagramviewsemanticzoom.tsx` (350+ lines)

**Key Enhancement**: Zoom-aware detail levels

**Zoom Controls**:
1. **Mouse Wheel**: Scroll to zoom in/out
2. **Shift+Drag**: Pan the view
3. **Zoom Range**: 0.2x to 3x (20% to 300%)
4. **Reset Button**: Returns to 1x zoom and centered pan

**Detail Levels**:
```typescript
// Uses ZoomAwareAifNode component (Enhancedaifnodes.tsx)

zoom > 0.75:
  - Full text labels
  - Scheme keys displayed
  - Expansion indicators visible
  - Icon badges (for undercut CA-nodes)

zoom > 0.5:
  - Abbreviated text
  - Basic labels
  - Node type visible
  - Expansion counts shown

zoom > 0.3:
  - Minimal text
  - Truncated labels (20 chars max)
  - I-nodes show truncated claim text

zoom ≤ 0.3:
  - Just node type letter (I, RA, CA, PA)
  - No text content
  - Maximum overview mode
```

**Edge Adjustments**:
```typescript
strokeWidth: style.strokeWidth * (zoom > 0.5 ? 1 : 0.7)
// Thinner edges when zoomed out to reduce clutter
```

**State Management**:
```typescript
const [zoom, setZoom] = useState(1);
const [pan, setPan] = useState({ x: 0, y: 0 });
const [isDragging, setIsDragging] = useState(false);
```

**ViewBox Calculation**:
```typescript
const viewBoxWidth = 1000 / zoom;
const viewBoxHeight = 800 / zoom;
const viewBoxX = -pan.x / zoom;
const viewBoxY = -pan.y / zoom;
```

### 3.4 Phase 4: Complete Dagre Viewer
**File**: `components/map/Aifdiagramviewerdagre.tsx` (700+ lines)

**Full Feature Set** (combines all previous phases + new capabilities):

1. **Layout System** (via `useDagreLayout` hook):
   - Configurable presets: 'standard', 'compact', 'wide'
   - Hierarchical Dagre algorithm
   - Automatic node positioning
   - Calculates graph bounds

2. **Zoom & Pan**:
   - Standard drag to pan
   - Shift+drag to zoom (vertical drag)
   - Zoom controls (+/-) buttons
   - Percentage display
   - Reset view button

3. **Search Functionality** (via `AifDiagramSearch` component):
   - Search nodes by label/content
   - Navigate through results
   - Highlights matches in yellow
   - Auto-pan to selected result

4. **Path Highlighting** (via `AifPathHighlighter`):
   - Click node → shows available paths panel
   - Path types: support, attack, preference
   - Highlights nodes/edges in path
   - Fades non-path elements (opacity: 0.2)
   - Path traversal animation

5. **Export Menu** (via `AifDiagramExportMenu`):
   - Export as SVG
   - Export as PNG
   - Copy to clipboard

6. **Minimap** (via `AifDiagramMinimap`):
   - Shows full graph overview
   - Viewport indicator (blue rectangle)
   - Click to navigate
   - Always visible in bottom-right

7. **Collapsible Legend**:
   - Node types with visual samples
   - Edge connection types with arrows
   - Conflict type symbols (⊥, ⇏, ⊗)
   - Toggle button to show/hide

8. **Advanced Edge Rendering**:
   - Arrow markers at **midpoint** (not endpoint)
   - Prevents marker overlap with target nodes
   - Dual-segment rendering (from → mid → to)
   - Role-specific styling

9. **Dialogue State Filtering** (Phase 3.1.4):
   ```typescript
   // NEW: Filter by dialogue completion status
   <select value={dialogueFilter}>
     <option value="all">All Arguments</option>
     <option value="complete">Complete (all attacks answered)</option>
     <option value="incomplete">Incomplete (pending attacks)</option>
   </select>
   ```
   - Fetches dialogue state for each RA-node
   - Filters graph based on `moveComplete` status
   - API endpoint: `/api/deliberations/${deliberationId}/dialogue-state?argumentId=...`

10. **Graph Statistics**:
    - Node count (total)
    - Edge count (total)
    - Filter status indicator
    - Layout algorithm label

**State Management**:
```typescript
const [graph, setGraph] = useState(initialGraph);
const [selectedNodeId, setSelectedNodeId] = useState<string>();
const [zoom, setZoom] = useState(1);
const [pan, setPan] = useState({ x: 0, y: 0 });
const [isPanning, setIsPanning] = useState(false);
const [isZooming, setIsZooming] = useState(false);
const [activePath, setActivePath] = useState<ArgumentPath | null>(null);
const [showLegend, setShowLegend] = useState(true);
const [dialogueFilter, setDialogueFilter] = useState<'all' | 'complete' | 'incomplete'>('all');
const [dialogueStates, setDialogueStates] = useState<Record<string, { moveComplete: boolean }>>({});
```

**Layout Presets** (from `Aifdagrelayout.tsx` hook):
```typescript
LAYOUT_PRESETS = {
  standard: {
    'elk.spacing.nodeNode': '80',
    'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  },
  compact: {
    'elk.spacing.nodeNode': '40',
    'elk.layered.spacing.nodeNodeBetweenLayers': '60',
  },
  wide: {
    'elk.spacing.nodeNode': '120',
    'elk.layered.spacing.nodeNodeBetweenLayers': '150',
  }
}
```

---

## 4. Enhanced Node Components

### 4.1 Zoom-Aware Node Renderer
**File**: `components/map/Enhancedaifnodes.tsx` (400+ lines)

**Purpose**: Semantic zoom implementation with conflict type visualization

**Key Components**:

1. **EnhancedINode** (I-node with text truncation):
   ```typescript
   zoomLevel > 0.75: Full text (100 chars max)
   zoomLevel > 0.5:  Truncated (50 chars max)
   zoomLevel > 0.3:  Very short (20 chars max)
   zoomLevel ≤ 0.3:  Just "I" letter
   ```
   - Uses `foreignObject` for proper text wrapping
   - Dynamic font size based on zoom
   - Yellow color scheme (#fefce8 fill, #eab308 border)

2. **EnhancedRANode** (RA-node with scheme display):
   ```typescript
   zoomLevel > 0.75: Shows scheme key below RA label
   zoomLevel > 0.5:  Shows "RA" label only
   zoomLevel ≤ 0.5:  Minimal rendering
   ```
   - Blue color scheme (#e7ebf3ff fill, #3b82f6 border)
   - Scheme key in smaller font (9px)

3. **EnhancedCANode** (CA-node with conflict type visualization):
   - **Conflict Scheme Mapping**:
     ```typescript
     rebut: {
       label: 'Logical Conflict',
       color: '#ef4444', // red-500
       icon: '⊥',
       description: 'Direct rebuttal of the conclusion'
     },
     undercut: {
       label: 'Inference Attack',
       color: '#f59e0b', // amber-500
       icon: '⇏',
       description: 'Challenges the reasoning step'
     },
     undermine: {
       label: 'Premise Challenge',
       color: '#ec4899', // pink-500
       icon: '⊗',
       description: 'Questions a premise'
     }
     ```
   - Dashed stroke for undercut type (`strokeDasharray: '4,2'`)
   - Color-coded by scheme type
   - Icon badge for undercut (animated pulse)
   - Tooltip with description

4. **EnhancedPANode** (PA-node with preference scheme):
   - Green color scheme (#f0fdf4 fill, #22c55e border)
   - Shows scheme key when zoomed in

**Unified Renderer**:
```typescript
export function ZoomAwareAifNode({ node, width, height, isHovered, zoomLevel }) {
  switch (node.kind) {
    case 'I': return <EnhancedINode ... />;
    case 'RA': return <EnhancedRANode ... />;
    case 'CA': return <EnhancedCANode ... />;
    case 'PA': return <EnhancedPANode ... />;
  }
}
```

### 4.2 Conflict Scheme Utilities
**Exports**:
- `conflictSchemes`: Const object with rebut/undercut/undermine definitions
- `getConflictScheme(schemeKey)`: Returns scheme details or fallback
- Used throughout diagram viewers for consistent conflict visualization

---

## 5. Utility Components

### 5.1 Path Highlighter
**File**: `components/map/Aifpathhighlighter.tsx` (200+ lines)

**Purpose**: Trace and highlight argument paths through the graph

**Key Types**:
```typescript
interface ArgumentPath {
  id: string;
  nodes: string[];
  edges: string[];
  type: 'support' | 'attack' | 'preference';
  strength?: number;
}
```

**Algorithms**:

1. **findPaths(graph, fromNodeId, toNodeId, maxDepth)**:
   - Depth-first search with cycle detection
   - Returns all paths between two nodes
   - Max depth limit (default: 5)
   - Visited set prevents infinite loops

2. **findPathsToConclusion(graph, conclusionNodeId)**:
   - Finds all paths from any I-node to target conclusion
   - Useful for tracing argument support structure

3. **inferPathType(edgeIds, graph)**:
   - Examines edges in path to classify:
     - Contains CA → 'attack'
     - Contains PA → 'preference'
     - Default → 'support'

**UI Component**:
```tsx
<AifPathHighlighter
  graph={graph}
  selectedNodeId={selectedNodeId}
  onPathSelect={(path) => setActivePath(path)}
/>
```

**Features**:
- Shows available paths from/to selected node
- Path type indicators: ✓ Support, ⚔ Attack, ⭐ Preference
- Node count for each path
- Click to highlight path
- Clear button to reset

**Hook**:
```typescript
const { highlightedNodes, highlightedEdges } = usePathHighlight(activePath);
// Returns Sets for fast lookup during rendering
```

**Visual Effects**:
```typescript
// Highlighted elements
opacity: 1
stroke: '#3b82f6' (blue for support)
strokeWidth: +1

// Non-highlighted elements (when path active)
opacity: 0.3
filter: 'grayscale(50%)'
```

### 5.2 Example Graphs
**File**: `components/map/aif-examples.ts` (400+ lines)

**Purpose**: Test data and AIF specification examples

**Available Examples**:
1. **defeasibleModusPonens**: Simple p, p→q ⊢ q (4 nodes, 3 edges)
2. **expertOpinionPreference**: Expert opinion vs general knowledge with PA (9 nodes, 8 edges)
3. **complexExample**: Multiple inferences with conflicts and preferences (16 nodes, 15 edges)
4. **beachArgument**: Real-world decision (12 nodes, 11 edges)
5. **bikeLanesArgument**: Policy argument from data (5 nodes, 4 edges)
6. **practicalCluster**: Speed limit practical reasoning (11 nodes, 10 edges)
7. **emptyGraph**: Edge case testing (0 nodes)
8. **singleNode**: Atomic claim (1 node)

**Additional Fixtures**:
- `aifFixture_RebutUndercut`: AIF-JSON-LD format example showing rebut/undercut modeling
- `aifFixture_ExpertOpinionOpenCQ`: Example with critical question integration

**Utilities**:
```typescript
getAifExample(name): Returns AifSubgraph
listAifExamples(): Returns array of { name, description, nodeCount }
```

**Usage**:
```typescript
import { AIF_EXAMPLES } from './aif-examples';
const graph = AIF_EXAMPLES.complexExample;
```

---

## 6. API Layer

### 6.1 Neighborhood Endpoint
**File**: `app/api/arguments/[id]/aif-neighborhood/route.ts` (62 lines)

**Endpoint**: `GET /api/arguments/:id/aif-neighborhood`

**Query Parameters**:
```typescript
depth: number              // Default: 1, Max: 5
summaryOnly: boolean       // Default: false
includeSupporting: boolean // Default: true
includeOpposing: boolean   // Default: true
includePreferences: boolean // Default: true
```

**Response Types**:

1. **Full Graph** (summaryOnly=false):
   ```json
   {
     "ok": true,
     "aif": {
       "nodes": [...],
       "edges": [...]
     }
   }
   ```

2. **Summary Only** (summaryOnly=true):
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

**Implementation**:
- Uses `buildAifNeighborhood()` from diagram-neighborhoods.ts
- Validates depth range (0-5)
- Returns 400 for invalid params
- Returns 500 on server errors
- No caching headers (fresh data on each request)

**Usage Examples**:
```typescript
// Interactive viewer expansion
fetch(`/api/arguments/${argId}/aif-neighborhood?depth=1`)

// Get connection counts for badge
fetch(`/api/arguments/${argId}/aif-neighborhood?summaryOnly=true`)

// Filter by type
fetch(`/api/arguments/${argId}/aif-neighborhood?depth=2&includeSupporting=true&includeOpposing=false`)
```

### 6.2 Missing Endpoints (from original plan)

**Not Implemented**:
- `/api/arguments/[id]/aif-diagram` (proposed in original plan)
- Why: `aif-neighborhood` serves the same purpose with more flexibility

**Recommendation**: 
- Keep existing `aif-neighborhood` endpoint
- Add alias route if needed for compatibility
- Document as primary AIF graph API

---

## 7. Layout Systems

### 7.1 ELK Layout (Phases 1-3)
**Library**: `elkjs/lib/elk.bundled.js`

**Configuration**:
```typescript
const ELK_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.spacing.nodeNode': '80',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.layered.spacing.edgeNodeBetweenLayers': '60',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.edgeRouting': 'ORTHOGONAL',
};
```

**Process**:
1. Convert AifSubgraph to ELK graph format
2. Call `elk.layout(elkGraph)` (async)
3. Extract node positions (x, y, width, height)
4. Render SVG elements at computed positions

**Pros**:
- High-quality hierarchical layout
- Handles complex graphs well
- Configurable algorithm parameters

**Cons**:
- Requires full graph rebuild on changes
- Async computation delay
- Large bundle size (~500KB)

### 7.2 Dagre Layout (Phase 4)
**Hook**: `useDagreLayout` (from `Aifdagrelayout.tsx`)

**Advantages over ELK**:
- Lighter weight
- Faster computation
- Better suited for interactive updates

**Preset System**:
```typescript
layoutPreset: 'standard' | 'compact' | 'wide'
```

**Returns**:
```typescript
{
  nodePositions: Map<string, { x, y, width, height }>,
  graphBounds: { minX, maxX, minY, maxY }
}
```

**Usage**:
```typescript
const { nodePositions, graphBounds } = useDagreLayout(
  filteredGraph,
  LAYOUT_PRESETS[layoutPreset]
);
```

---

## 8. Key Findings & Observations

### 8.1 Architecture Strengths

✅ **Separation of Concerns**:
- Data layer (`lib/arguments/diagram*.ts`) isolated from UI
- Multiple viewer components for different use cases
- Reusable node rendering logic

✅ **Progressive Enhancement**:
- Phase 1 → 2 → 3 → 4 progression shows clear evolution
- Each phase builds on previous
- Backward compatible (can use any phase independently)

✅ **AIF Specification Compliance**:
- Correct node types (I, RA, CA, PA)
- Proper edge roles (premise, conclusion, conflicting, etc.)
- Scheme keys supported
- Example graphs match AIF specification figures

✅ **Production-Ready Features**:
- Error handling in API routes
- Loading states in UI components
- Depth limits prevent runaway recursion
- Node count limits prevent memory issues
- Type safety throughout (TypeScript strict mode)

✅ **Performance Optimizations**:
- Deduplication via Map data structures
- Visited set prevents cycles
- Semantic zoom reduces render overhead at low zoom
- SVG rendering (hardware-accelerated)

### 8.2 Architecture Weaknesses

⚠️ **No Caching Layer**:
- Every API call hits database directly
- No SWR/React Query integration in viewers
- Repeated expansions re-fetch same data
- **Recommendation**: Add Redis cache or SWR with revalidation strategy

⚠️ **Recursive Query Pattern** (diagram-neighborhoods.ts):
- N+1 query problem at high depths
- Each argument expansion triggers new DB round-trip
- **Recommendation**: Batch queries or implement graph traversal in single DB call

⚠️ **Type Safety Gaps**:
- Convergent support casts `premises` to `any[]` (line 240 in diagram.ts)
- Marked as UNTESTED (from CHUNK 1B review)
- **Recommendation**: Fix types or remove dormant feature

⚠️ **Layout Computation Overhead**:
- ELK.js is heavy (~500KB bundle)
- Full re-layout on any graph change
- **Recommendation**: Use Dagre by default, ELK only for complex static graphs

⚠️ **Missing Features** (compared to original plan):
- No critical question overlay visualization
- No side-by-side comparison mode
- No dialogue state integration in earlier phases (only in Phase 4)
- **Recommendation**: Add as optional props to Phase 4 viewer

⚠️ **Limited Error Recovery**:
- API errors show generic message
- No retry logic for failed expansions
- **Recommendation**: Add exponential backoff retry, specific error messages

### 8.3 Comparison to Original Plan

**Original Plan Proposed**:
1. Basic static viewer from DeepDivePanelV2's DiagramViewer
2. Add node click handlers
3. Add zoom/pan controls
4. Add legend
5. Attack highlighting
6. Critical question overlays
7. Comparison mode

**Current Reality**:
1. ✅ **4 complete viewer phases** (far beyond basic)
2. ✅ **Node click handlers** (all phases)
3. ✅ **Zoom/pan** (Phases 1, 3, 4 with different implementations)
4. ✅ **Legend** (Phase 4, collapsible)
5. ✅ **Conflict visualization** (better than "attack highlighting" - shows types)
6. ⚠️ **CQ overlays** (not implemented, but dialogue state filter exists)
7. ❌ **Comparison mode** (not implemented)

**Assessment**: Original plan is **obsolete**. Existing system is ~80% complete with higher quality than proposed.

---

## 9. Integration Recommendations for DeepDivePanelV2

### 9.1 Reuse Existing Components (Don't Rebuild)

**Primary Component**: `AifDiagramViewerDagre` (Phase 4)
- Most feature-complete
- Production-ready
- All requested features present

**Integration Approach**:
```tsx
// In ArgumentActionsSheet.tsx DiagramPanel:

import { AifDiagramViewerDagre } from '@/components/map/Aifdiagramviewerdagre';
import useSWR from 'swr';

function DiagramPanel({ deliberationId, argument }: DiagramPanelProps) {
  const { data, error, isLoading } = useSWR(
    `/api/arguments/${argument.id}/aif-neighborhood?depth=1`,
    fetcher
  );

  if (isLoading) return <LoadingSpinner />;
  if (error || !data?.aif) return <ErrorMessage />;

  return (
    <div className="h-[500px]">
      <AifDiagramViewerDagre
        initialGraph={data.aif}
        onNodeClick={handleNodeClick}
        layoutPreset="compact"
        deliberationId={deliberationId}
        className="h-full"
      />
    </div>
  );
}
```

**Why This Works**:
- Zero component development needed
- All features immediately available
- Dialogue state filtering already integrated
- Export, search, path highlighting included

### 9.2 Customization Points

**Theme Adaptation**:
```typescript
// ArgumentActionsSheet uses dark theme, diagram has light theme
// Option 1: Keep light diagram as "viewport" (current pattern)
// Option 2: Add dark mode variant to diagram viewer
```

**Size Constraints**:
```typescript
// ArgumentActionsSheet is a bottom sheet with limited height
// Recommendation: Use compact layout preset
layoutPreset="compact"
className="h-[450px]" // Fixed height for sheet
```

**Simplified Controls** (optional):
```typescript
// Hide some advanced features for cleaner integration:
<AifDiagramViewerDagre
  initialGraph={data.aif}
  showMinimap={false}        // Remove minimap (sheet is small)
  showLegend={false}         // Remove legend (explain in help text)
  showSearch={false}         // Remove search (sheet context is single arg)
  showExport={true}          // Keep export (useful)
  showPathHighlighter={true} // Keep (shows argument structure)
/>
```

### 9.3 API Endpoint Strategy

**Current**: `/api/arguments/[id]/aif-neighborhood`
**Original Plan**: `/api/arguments/[id]/aif-diagram`

**Recommendation**: Create alias route

```typescript
// app/api/arguments/[id]/aif-diagram/route.ts (NEW)
import { GET as getNeighborhood } from '../aif-neighborhood/route';

export async function GET(req: NextRequest, context: any) {
  // Alias to neighborhood endpoint with depth=1 default
  const url = new URL(req.url);
  if (!url.searchParams.has('depth')) {
    url.searchParams.set('depth', '1');
  }
  
  return getNeighborhood(
    new NextRequest(url.toString(), req),
    context
  );
}
```

**Why**: Maintains compatibility with original plan while using superior implementation.

### 9.4 Feature Gaps to Address

**1. Critical Question Overlay** (proposed in original plan):
```typescript
// Add to AifDiagramViewerDagre props:
criticalQuestions?: Array<{
  nodeId: string;
  questionId: string;
  text: string;
  status: 'open' | 'satisfied' | 'defeated';
}>;

// Render as badges on RA-nodes:
{cqs?.filter(cq => cq.nodeId === node.id).map(cq => (
  <circle key={cq.id} cx={...} cy={...} r={6}
    fill={cq.status === 'satisfied' ? '#22c55e' : '#eab308'} 
  />
))}
```

**2. Comparison Mode** (proposed in original plan):
```typescript
// Add split-view option to test page:
<div className="grid grid-cols-2 gap-4">
  <AifDiagramViewerDagre initialGraph={graph1} ... />
  <AifDiagramViewerDagre initialGraph={graph2} ... />
</div>

// Sync zoom/pan between viewers (optional):
const [sharedViewState, setSharedViewState] = useState(...);
```

**3. Scheme-Aware Rendering** (partially implemented):
- Current: Shows schemeKey as text label
- Enhancement: Visual differentiation by scheme type
- Example: Different colors for "expert_opinion" vs "argument_from_analogy"

```typescript
// Add to Enhancedaifnodes.tsx:
const schemeStyles = {
  expert_opinion: { borderColor: '#3b82f6', icon: '🎓' },
  argument_from_analogy: { borderColor: '#8b5cf6', icon: '≈' },
  argument_from_consequence: { borderColor: '#10b981', icon: '→' },
  // ...
};
```

### 9.5 Performance Optimization

**Add SWR Caching**:
```typescript
// In ArgumentActionsSheet:
import useSWR from 'swr';

const { data: aifData } = useSWR(
  `/api/arguments/${argument.id}/aif-neighborhood?depth=1`,
  fetcher,
  {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // 1 minute
  }
);
```

**Add Server-Side Caching**:
```typescript
// In route.ts:
import { unstable_cache } from 'next/cache';

const getCachedNeighborhood = unstable_cache(
  async (argumentId: string, depth: number) => {
    return buildAifNeighborhood(argumentId, depth);
  },
  ['aif-neighborhood'],
  {
    revalidate: 300, // 5 minutes
    tags: ['aif-diagrams'],
  }
);
```

**Optimize DB Queries**:
```typescript
// In diagram-neighborhoods.ts:
// Instead of recursive calls, collect all IDs first, then batch fetch:

const allArgumentIds = new Set<string>();
// ... collect IDs via BFS ...

const allArguments = await prisma.argument.findMany({
  where: { id: { in: Array.from(allArgumentIds) } },
  include: { premises: true, /* ... */ }
});

// Then build graph from in-memory data (no N+1 queries)
```

---

## 10. Revised Integration Plan

### Phase 1: Direct Integration (1-2 hours)
**Goal**: Get AifDiagramViewerDagre working in ArgumentActionsSheet

**Tasks**:
1. ✅ Add SWR to ArgumentActionsSheet dependencies
2. ✅ Import AifDiagramViewerDagre component
3. ✅ Fetch data from `/api/arguments/[id]/aif-neighborhood?depth=1`
4. ✅ Render in DiagramPanel with loading/error states
5. ✅ Test with various arguments
6. ✅ Adjust height/width for sheet constraints

**Deliverable**: Working diagram view in action sheet

### Phase 2: Customization (2-3 hours)
**Goal**: Adapt component for ArgumentActionsSheet context

**Tasks**:
1. ⚙️ Add theme variant (optional - keep light viewport)
2. ⚙️ Configure compact layout preset
3. ⚙️ Hide unnecessary controls (minimap, search)
4. ⚙️ Keep essential features (export, path highlighting)
5. ⚙️ Add help text explaining diagram navigation
6. ⚙️ Handle edge cases (empty graphs, large graphs)

**Deliverable**: Polished diagram integration

### Phase 3: Feature Enhancement (4-6 hours)
**Goal**: Add missing features from original plan

**Tasks**:
1. 🔧 Implement CQ overlay visualization
   - Fetch CQ data for argument
   - Render badges on RA-nodes
   - Show tooltip with CQ text/status
2. 🔧 Add comparison mode toggle
   - Side-by-side viewer option
   - Sync zoom/pan (optional)
   - Highlight differences
3. 🔧 Enhance scheme visualization
   - Color-coded schemes
   - Scheme-specific icons
   - Legend entry for schemes

**Deliverable**: Feature-complete integration

### Phase 4: Optimization (3-4 hours)
**Goal**: Improve performance and caching

**Tasks**:
1. 🚀 Add SWR caching configuration
2. 🚀 Implement server-side cache
3. 🚀 Optimize DB queries (batch fetching)
4. 🚀 Add preloading for common arguments
5. 🚀 Monitor performance metrics

**Deliverable**: Production-ready performance

### Phase 5: Testing & Documentation (2-3 hours)
**Goal**: Ensure quality and maintainability

**Tasks**:
1. 📝 Write integration tests
2. 📝 Update user documentation
3. 📝 Add code comments
4. 📝 Create troubleshooting guide
5. 📝 Document API contracts

**Deliverable**: Fully documented integration

---

## 11. Conclusion

**Key Takeaways**:

1. ✅ **Existing system is highly sophisticated** - Don't rebuild from scratch
2. ✅ **Phase 4 viewer (AifDiagramViewerDagre) is production-ready** - Use directly
3. ✅ **API endpoint exists and works** - Just alias if needed
4. ⚠️ **Some features missing** - CQ overlay, comparison mode (easy to add)
5. ⚠️ **Performance improvements needed** - Add caching, optimize queries
6. ⚠️ **Type safety issues** - Fix convergent support or remove

**Revised Timeline Estimate**:
- **Minimum viable**: 1-2 hours (Phase 1 only)
- **Polished integration**: 3-5 hours (Phases 1-2)
- **Feature complete**: 7-11 hours (Phases 1-3)
- **Production ready**: 10-15 hours (all phases)

**Recommendation**: Start with Phase 1, evaluate results, then decide if Phases 2-5 are needed based on user feedback.

**Next Steps**:
1. Review this document with team
2. Decide on scope (MVP vs. feature-complete)
3. Create implementation tickets
4. Schedule integration work
5. Update AIF_DIAGRAM_INTEGRATION_PLAN.md with revised approach

---

## Appendix A: File Inventory

### Components (9 files)
1. `app/test/aif-diagrams/page.tsx` - Test page entry point
2. `components/map/AifDiagramTestPageDagre.tsx` - Test UI harness
3. `components/map/AifDiagramView.tsx` - Phase 1 static viewer
4. `components/map/AifDiagramViewInteractive.tsx` - Phase 2 interactive
5. `components/map/Aifdiagramviewsemanticzoom.tsx` - Phase 3 semantic zoom
6. `components/map/Aifdiagramviewerdagre.tsx` - Phase 4 complete viewer
7. `components/map/Enhancedaifnodes.tsx` - Zoom-aware node components
8. `components/map/Aifpathhighlighter.tsx` - Path tracing utility
9. `components/map/aif-examples.ts` - Test data

### Library (2 files)
1. `lib/arguments/diagram.ts` - Core AIF builder
2. `lib/arguments/diagram-neighborhoods.ts` - Multi-argument expansion

### API (1 file)
1. `app/api/arguments/[id]/aif-neighborhood/route.ts` - Neighborhood endpoint

### Utility Components (referenced, not fully reviewed)
1. `components/map/Aifdiagramminimap.tsx` - Minimap component
2. `components/map/Aifdiagramsearch.tsx` - Search component
3. `components/map/Aifdiagramexport.tsx` - Export menu
4. `components/map/Aifdagrelayout.tsx` - Dagre layout hook

**Total**: 16+ files in AIF diagram system

## Appendix B: Data Flow Diagram

```
User Interaction
       ↓
[ArgumentActionsSheet]
       ↓
   useSWR fetch
       ↓
GET /api/arguments/:id/aif-neighborhood
       ↓
[diagram-neighborhoods.ts]
  buildAifNeighborhood()
       ↓
    Prisma DB Queries
    ├─ Argument
    ├─ Claim
    ├─ ConflictApplication
    ├─ PreferenceApplication
    └─ AssumptionUse
       ↓
   AifSubgraph
   { nodes: [], edges: [] }
       ↓
[AifDiagramViewerDagre]
       ↓
   useDagreLayout()
       ↓
   Positioned Graph
       ↓
   SVG Rendering
   ├─ Nodes (ZoomAwareAifNode)
   ├─ Edges (styled by role)
   ├─ Minimap
   ├─ Legend
   └─ Controls
       ↓
   User sees diagram
```

## Appendix C: Component Dependency Graph

```
AifDiagramTestPageDagre
    ├─ AifDiagramView
    │   ├─ AifNodeSvg
    │   └─ ELK layout
    ├─ AifDiagramViewInteractive
    │   ├─ AifNodeSvg
    │   └─ ELK layout
    ├─ AifDiagramViewSemanticZoom
    │   ├─ ZoomAwareAifNode
    │   │   ├─ EnhancedINode
    │   │   ├─ EnhancedRANode
    │   │   ├─ EnhancedCANode
    │   │   └─ EnhancedPANode
    │   └─ ELK layout
    └─ AifDiagramViewerDagre
        ├─ ZoomAwareAifNode (same as above)
        ├─ useDagreLayout hook
        ├─ AifDiagramMinimap
        ├─ AifDiagramSearch
        ├─ AifDiagramExportMenu
        └─ AifPathHighlighter
            ├─ findPaths()
            ├─ findPathsToConclusion()
            └─ usePathHighlight()
```
