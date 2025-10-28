# CHUNK 4B: Argument Pop-out & Dual-Mode Rendering

**Phase 4 Focus:** Two-Level Representation (debate-level ↔ argument-internals)

---

## Executive Summary

**Grade: A- (90%)**

The system implements a sophisticated **two-level navigation architecture** enabling users to seamlessly move from debate-level overviews (DebateSheetReader) to detailed argument internals (ArgumentPopout with dual Toulmin/AIF views). Components demonstrate strong integration with the evidential category subsystem, supporting both scalar and Dempster-Shafer confidence propagation. The AIF graph rendering includes professional zoom/pan controls and semantic edge styling. Primary gaps: no sunburst/radial drill-down visualization, confidence values not overlaid on AIF diagrams, and cross-room argument imports remain partially implemented.

---

## 1. Component Analysis

### 1.1 ArgumentPopoutDualMode.tsx (219 lines)

**Purpose:** Enhanced ArgumentPopout enabling toggle between Toulmin and AIF graph views.

**Key Features:**
- **Dual-Mode Toggle:** Segmented control switches between `'toulmin'` and `'aif'` views
- **Data Fetching:** Uses SWR to fetch `/api/arguments/${node.diagramId}` with diagram structure
- **Toulmin View:** Grid layout showing statements (left) and inferences (right) with role labels [C/P/D]
- **AIF View:** Renders `AifDiagramViewInteractive` with interactive node selection
  - Props: `initialAif`, `rootArgumentId`, `enableExpansion={true}`, `maxDepth={2}`
  - Click handling: `onNodeClick={setClickedAifNode}` displays selected node metadata
- **Node Details Panel:** Shows clicked AIF node's kind, ID, scheme, and content
- **Footer Stats:** Displays node/edge counts for AIF, statement/inference counts for Toulmin

**Integration Points:**
- Imports `AifDiagramViewInteractive` from `../map/`
- Expects `diagram.aif` structure with `nodes` and `edges` arrays
- Falls back gracefully when AIF data unavailable

**Assessment:**
- ✅ **COMPLETE:** Toggle mechanism functional with clear UI
- ✅ **COMPLETE:** Node click handling with metadata display
- ⚠️ **PARTIAL:** No confidence values shown on inferences or AIF edges
- ⚠️ **PARTIAL:** No CQ status indicators on scheme nodes

---

### 1.2 ArgumentPopout.tsx (536 lines)

**Purpose:** Production ArgumentPopout component used by DebateSheetReader for detailed argument display.

**Key Features:**
- **View Mode State:** `useState<ViewMode>('aif')` — defaults to AIF view
- **Flexible Data Loading:** Accepts `node.diagramId` OR `node.argumentId` for lookup
- **Data Normalization:** Transforms raw API response to `Diagram` type with statements/inferences/evidence
- **Dual-Panel Layout:**
  - **Left Panel (w-96):** Text summary with indigo-themed cards showing:
    - Statements list with role-based prefixes [C/P/S]
    - Inferences with scheme name, conclusion text, premise sources
    - **UndercutPill** integration for each inference (dialogical attack UI)
  - **Right Panel (flex-1):** Visual diagram (500px min height)
    - Toulmin mode: `DiagramView` with box-and-arrow layout
    - AIF mode: `AifDiagramViewerDagre` with dagre layout + node click handling
- **Node Details Section:** Shows selected AIF node with grid of ID/kind/label/scheme
- **Footer Stats:** Counts for nodes/edges, conflict/preference node tallies

**Integration Points:**
- Used by `DebateSheetReader.tsx` (line 6: `import ArgumentPopout from "./ArgumentPopout"`)
- Receives `node` prop with `diagramId`, `argumentId`, `title`, `deliberationId`
- Calls `onClose()` to dismiss pop-out
- Integrates `UndercutPill` for inference-level attack UI

**Assessment:**
- ✅ **COMPLETE:** Production-ready dual-mode viewer with rich metadata
- ✅ **COMPLETE:** UndercutPill integration provides dialogical attack path
- ✅ **COMPLETE:** `AifDiagramViewerDagre` uses professional graph layout
- ⚠️ **PARTIAL:** Commented-out old implementation (lines 1-251) should be removed
- ❌ **MISSING:** Confidence values not displayed on inferences/edges
- ❌ **MISSING:** CQ indicators not shown for schemes

---

### 1.3 DiagramViewer.tsx (275 lines)

**Purpose:** Interactive SVG-based AIF graph viewer with zoom/pan controls.

**Key Features:**
- **Layout Integration:** Uses `useDagreLayout` hook with `LAYOUT_PRESETS.compact`
- **SVG Rendering:** Transforms AIF graph into positioned nodes + styled edges
- **Edge Styling:** `getEdgeStyle` function returns colors by semantic role:
  - `premise` → slate (`#64748b`)
  - `conclusion` → green (`#10b981`)
  - `conflict` → red (`#ef4444`)
  - `preference` → purple (`#a855f7`)
  - Default → gray
- **Zoom/Pan Controls:**
  - `useZoomPan` hook manages transform state
  - `onWheel` for zoom, `onMouseDown/Move/Up` for pan
  - Reset button returns to auto-centered view
- **Stats Display:** Shows node count and edge count in header
- **Minimap Integration:** Commented code suggests minimap support via `bounds` calculation

**Component Structure:**
```tsx
<svg viewBox={...} ref={containerRef}>
  <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
    {/* Edges rendered as paths */}
    {/* Nodes rendered as circles + text */}
  </g>
</svg>
<div className="controls">
  <button onClick={handleZoomIn}>+</button>
  <button onClick={handleZoomOut}>-</button>
  <button onClick={handleReset}>⟲</button>
</div>
```

**Assessment:**
- ✅ **COMPLETE:** Professional zoom/pan implementation
- ✅ **COMPLETE:** Semantic edge coloring by AIF role
- ✅ **COMPLETE:** Auto-centering and bounds calculation
- ⚠️ **PARTIAL:** Minimap code commented out (lines 200-250 approx)
- ❌ **MISSING:** No confidence value overlays on edges
- ❌ **MISSING:** No node shape variation by AIF kind (all circles)

---

### 1.4 AFMinimap.tsx (405 lines)

**Purpose:** Compact force-directed argument framework visualization with semantic labeling.

**Key Features:**
- **Custom Force Simulation:** `useForceLayout` hook implements lightweight physics:
  - Center gravity force pulls nodes toward middle
  - Repulsion force (800 strength) prevents overlap
  - Edge attraction (0.02 strength) clusters connected nodes
  - Damping (0.85) and cooling schedule (alpha) stabilize layout
  - 300 iterations by default
- **Semantic Coloring:** `getNodeColor` by Dung semantics label:
  - `IN` → emerald (`#16a34a`) — warranted/grounded
  - `OUT` → rose (`#dc2626`) — defeated
  - `UNDEC` → slate (`#64748b`) — undecided
  - Fogged nodes → light gray (`#C7CED6`)
- **Edge Styling:** `getEdgeStyle` returns stroke/dash by kind:
  - `support` → solid slate
  - `rebut` → solid red
  - `undercut` → dashed amber (`4 3`)
- **Interactive Features:**
  - Node click: `onSelectNode(nodeId, locusPath)`
  - Node hover: Highlights connected nodes, shows tooltip with node data
  - Tooltip displays node type, status, fogged state
- **Compact Design:** 240×160px default size, rounded border, semi-transparent background

**Integration Points:**
- Expects `MinimapNode[]` with `{ id, status, fogged, locusPath }`
- Expects `MinimapEdge[]` with `{ from, to, kind }`
- Callbacks: `onSelectNode`, `onHoverNode`

**Assessment:**
- ✅ **COMPLETE:** Sophisticated force-directed layout with semantic colors
- ✅ **COMPLETE:** Interactive hover/click with connected node highlighting
- ✅ **COMPLETE:** Dung semantics visualization (IN/OUT/UNDEC)
- ⚠️ **PARTIAL:** Legend prop available but not rendered inline
- ❌ **MISSING:** No zoom controls (fixed viewport)
- ❌ **MISSING:** No depth/expansion controls for nested arguments

---

### 1.5 ClaimMiniMap.tsx (851 lines)

**Purpose:** Comprehensive claim dashboard with AIF metadata, dialogical moves, CQ status, and semantic labels.

**Key Features:**
- **Enhanced Claim Cards:** Each `ClaimRow` includes:
  - Semantic label (`IN/OUT/UNDEC`) with colored dot
  - CQ satisfaction meter with percentage + color coding (emerald ≥100%, amber ≥50%, gray <50%)
  - Scheme badge showing top argument's scheme key
  - Attack badges (REBUTS/UNDERCUTS/UNDERMINES counts)
  - Dialogical status: WHY moves (open count), GROUNDS, CONCEDE, RETRACT tallies
- **Data Fetching:**
  - `/api/claims/summary?deliberationId=...` → ClaimRow[]
  - `/api/claims/labels?deliberationId=...` → LabelRow[]
  - SWR config: `revalidateOnFocus: false`, `keepPreviousData: true`, smart error retry
- **Performance Optimizations:**
  - Memoized sub-components: `Dot`, `CqMeter`, `SchemeBadge`, `AttackBadges`, `DialogicalStatus`
  - Pagination: `PAGE_SIZE = 8`, shows skeleton loaders during fetch
- **Critical Questions Integration:**
  - Click claim → opens dialog with `CriticalQuestionsV3` component
  - Shows CQ satisfaction percentage in card
- **Dialogue Actions:**
  - `DialogueActionsButton` integration for each claim
  - `LegalMoveChips` show available moves based on protocol state

**Component Structure:**
```tsx
<ClaimCard>
  <Dot label={IN|OUT|UNDEC} />
  <GlossaryText>{claim.text}</GlossaryText>
  <CqMeter cq={satisfied/required} />
  <SchemeBadge scheme={topArg.scheme} />
  <AttackBadges attacks={REBUTS:n, UNDERCUTS:m} />
  <DialogicalStatus moves={WHY:x, GROUNDS:y} />
  <DialogueActionsButton />
</ClaimCard>
<Dialog>
  <CriticalQuestionsV3 claimId={selectedClaimId} />
</Dialog>
```

**Assessment:**
- ✅ **COMPLETE:** Comprehensive AIF + dialogical integration in one view
- ✅ **COMPLETE:** CQ status with visual feedback (percentage + color)
- ✅ **COMPLETE:** Attack type breakdown (REBUTS/UNDERCUTS/UNDERMINES)
- ✅ **COMPLETE:** Dialogical move indicators with open count tracking
- ✅ **COMPLETE:** Performance-optimized with memoization + pagination
- ⚠️ **PARTIAL:** No CEG graph visualization in this component (despite name "MiniMap")
- ❌ **MISSING:** No confidence bars per claim (uses summary endpoint but doesn't display support values)

---

## 2. Two-Level Integration Architecture

### Level 1: Debate Sheet (DebateSheetReader)

**File:** `components/agora/DebateSheetReader.tsx` (331 lines)

**Function:**
- **Primary View:** Debate sheet with claim nodes arranged by acceptance/unresolved status
- **Evidential Integration:**
  - Fetches `/api/deliberations/${delibId}/evidential?mode=${mode}&imports=${imports}`
  - Returns `EvResp` with `{ nodes: EvNode[], support: Record<claimId, score>, dsSupport: Record<claimId, {bel, pl}> }`
  - Mode: `'min' | 'product' | 'ds'` (Dempster-Shafer)
- **Support Bar Display:** `SupportBar` component shows confidence per claim
- **Click Interaction:**
  - State: `[openNodeId, setOpenNodeId]` tracks selected claim
  - State: `[showArgsFor, setShowArgsFor]` tracks which claim's arguments to display
  - Clicking claim → renders `ArgumentPopout` with `node={{ diagramId, argumentId, title, deliberationId }}`
- **Import Controls:** Toggle `'off'|'materialized'|'virtual'|'all'` for cross-deliberation argument imports

**Code Pattern:**
```tsx
{showArgsFor && (
  <ArgumentPopout 
    node={{
      argumentId: topArg.argumentId,
      diagramId: claim.diagramId,
      title: claim.text,
      deliberationId: delibId
    }}
    onClose={() => setShowArgsFor(null)}
  />
)}
```

**Assessment:**
- ✅ **COMPLETE:** Clean two-level navigation (debate → argument detail)
- ✅ **COMPLETE:** Confidence propagation from evidential API
- ✅ **COMPLETE:** Support for DS belief/plausibility intervals
- ⚠️ **PARTIAL:** Import mode UI exists but backend support unclear
- ❌ **MISSING:** No visual indication which claims have pop-outs available

---

### Level 2: Argument Internals (ArgumentPopout)

**Navigation Flow:**
1. User clicks claim in DebateSheetReader
2. `setShowArgsFor(claimId)` triggers conditional render
3. ArgumentPopout fetches `/api/arguments/${diagramId}?view=diagram`
4. Response includes Toulmin structure (statements/inferences) + AIF graph
5. User toggles between Toulmin (list view) and AIF (graph view)
6. Clicking AIF node → displays node details panel with scheme/kind/content
7. UndercutPill allows user to initiate undercut attack on specific inference

**Expand/Collapse Mechanics:**
- **Debate Sheet Level:** Pop-out opens/closes via state toggle
- **Argument Level:** AIF graph uses `maxDepth={2}` for neighborhood expansion
- **Node Details:** Selected node displays in separate panel (not nested expand)

**Assessment:**
- ✅ **COMPLETE:** Smooth state-driven navigation
- ✅ **COMPLETE:** Depth-limited AIF expansion prevents overwhelming user
- ⚠️ **PARTIAL:** No accordion-style expand for statements/inferences
- ❌ **MISSING:** No breadcrumb or "back to debate" button in pop-out

---

## 3. Expand/Collapse Mechanics Assessment

| Component | Mechanism | Status |
|-----------|-----------|--------|
| **ClaimMiniMap** | Pagination (8 claims/page), dialog for CQ details | ✅ COMPLETE |
| **ArgumentPopout** | Open/close via parent state, no internal collapse | ✅ COMPLETE |
| **AifDiagramViewInteractive** | `maxDepth` prop limits expansion radius | ✅ COMPLETE |
| **DiagramViewer** | Full graph shown, zoom/pan for navigation | ✅ COMPLETE (no collapse) |
| **AFMinimap** | Fixed layout, no expand/collapse | ✅ COMPLETE (minimap style) |
| **Toulmin Statement List** | No accordion, all visible | ⚠️ PARTIAL (could add) |
| **Inference Details** | Inline display, no toggle | ⚠️ PARTIAL (could add) |

**Recommendations:**
1. Add accordion-style expand for inferences in Toulmin view (show premises on demand)
2. Implement "Show More" for AIF subgraphs (incrementally reveal neighborhood beyond maxDepth)
3. Add visual "expand" icon on claims in DebateSheetReader that have pop-outs available

---

## 4. Gaps & Recommendations

### 4.1 Critical Gaps

#### ❌ **Sunburst / Hierarchical Drill-Down Missing**
**Impact:** HIGH  
**Description:** No radial or circular visualization for multi-level argument structure. Research literature emphasizes importance of hierarchical overview for complex argumentation.  
**Recommendation:**
- Implement `HierarchicalViewer.tsx` with D3 sunburst or radial tree layout
- Outer ring: debate claims, middle ring: top-level arguments, inner ring: sub-arguments
- Click ring segment → zoom to that subtree
- Integrate with existing AIF graph data

#### ❌ **Confidence Values Not Overlaid on Argument Diagrams**
**Impact:** HIGH  
**Description:** ArgumentPopout shows AIF graph structure but no per-edge or per-inference confidence. User cannot see which inferences are strong vs. weak.  
**Recommendation:**
- Add `SupportBar` micro-component to each inference edge in DiagramViewer
- Color-code edges by confidence threshold (green >0.7, amber 0.4-0.7, red <0.4)
- Add tooltip on edge hover showing exact confidence value + mode

#### ❌ **CQ Status Not Visible on Argument Diagrams**
**Impact:** MEDIUM  
**Description:** When viewing AIF graph with scheme nodes, user cannot see which CQs are open/satisfied without navigating away.  
**Recommendation:**
- Add small badge on RA nodes showing CQ satisfaction (e.g., "3/5 CQs")
- Click badge → open CriticalQuestionsV3 dialog for that scheme
- Color-code badge (green = all satisfied, amber = partial, red = none)

#### ⚠️ **Cross-Room Argument Imports Incomplete**
**Impact:** MEDIUM  
**Description:** DebateSheetReader has `imports` toggle UI but unclear if backend `/api/deliberations/.../evidential?imports=all` fully implements cross-deliberation argument merging.  
**Recommendation:**
- Verify backend support for `imports` parameter
- Add visual distinction for imported arguments (e.g., dashed border, "external" badge)
- Document plexus semantics for cross-room argument identity

---

### 4.2 Enhancement Opportunities

#### ⭐ **Argument Preview Tooltip**
**Impact:** LOW  
**Description:** Hovering over claim in DebateSheetReader could show mini-preview of top argument without full pop-out.  
**Implementation:**
- Render small ArgumentPopoutDualMode in tooltip with limited height
- Show only Toulmin view (more compact)
- Click tooltip → open full pop-out

#### ⭐ **Proof Obligation Context Panel**
**Impact:** MEDIUM  
**Description:** When viewing inference in ArgumentPopout, show which proof obligations (CQs) are pending.  
**Implementation:**
- Add `ProofObligationPanel.tsx` below selected inference
- List open CQs with "Answer" button → opens modal to address CQ
- Update UndercutPill to also show proof obligation status

#### ⭐ **Minimap Navigation Integration**
**Impact:** MEDIUM  
**Description:** AFMinimap and ClaimMiniMap operate independently, no coordination.  
**Implementation:**
- When user hovers node in AFMinimap → highlight corresponding claim in ClaimMiniMap
- When user selects claim in ClaimMiniMap → center AFMinimap on that node
- Shared context provider for selection/hover state

---

## 5. Integration with Categorical Architecture

### 5.1 Hom-Set Interpretation

**Two-Level Navigation as Morphisms:**
- **Level 1 (Debate Sheet):** Objects in category are claims (C)
- **Level 2 (Argument Internals):** Objects are statements/inferences (S, I)
- **Pop-out Action:** Functor F: **Claims** → **Arguments**, mapping claim C to argument A concluding C
- **AIF Toggle:** Natural transformation τ: Toulmin ⇒ AIF preserving structure

**Code Evidence:**
- `ArgumentPopout` receives `node.diagramId` (claim object) → fetches `diagram` (argument object)
- Dual-mode rendering ensures structural equivalence: both views display same premises/conclusions

### 5.2 Join Operation in Evidential Lattice

**Support Bars as Order Relations:**
- `SupportBar` in DebateSheetReader visualizes ⊑ relation in confidence lattice
- `barFor(claimId)` computes supremum of supporting argument confidences
- DS mode: `{bel, pl}` pair represents interval in belief lattice

**Code Evidence:**
```tsx
// DebateSheetReader.tsx line ~130
function barFor(claimId?: string|null) {
  if (!claimId || !ev) return null;
  if (mode === 'ds') {
    const pair = ev.dsSupport?.[claimId];
    return pair ? { kind:'ds', bel: pair.bel, pl: pair.pl } : null;
  }
  const s = ev.support?.[claimId];
  return typeof s === 'number' ? { kind:'scalar', s } : null;
}
```

**Assessment:**
- ✅ Join operation correctly implemented in backend (evidential API)
- ✅ UI visualizes join result (SupportBar per claim)
- ❌ Join visualization missing at inference level in ArgumentPopout

---

## 6. Code Quality & Patterns

### Strengths
1. **Consistent SWR Usage:** All components use SWR for data fetching with proper config
2. **Memoization:** ClaimMiniMap uses `memo()` for performance-critical sub-components
3. **Type Safety:** Strong TypeScript typing (Diagram, AifSubgraph, ClaimRow types)
4. **Separation of Concerns:** DiagramViewer handles layout, ArgumentPopout handles data/state
5. **Graceful Degradation:** Components handle missing AIF data with fallback messages

### Weaknesses
1. **Commented Code:** ArgumentPopout.tsx has 250 lines of commented-out old implementation
2. **Magic Numbers:** Force layout parameters (800, 0.02, 0.85) hardcoded without explanation
3. **State Management:** Multiple `useState` calls in DebateSheetReader could use reducer
4. **Error Handling:** Some components silently fail (e.g., AFMinimap with invalid node IDs)
5. **Accessibility:** No ARIA labels on zoom controls, minimap nodes lack keyboard nav

### Recommendations
1. Remove commented code from ArgumentPopout.tsx
2. Extract force layout constants to config object with explanatory comments
3. Consider using `useReducer` for complex state in DebateSheetReader
4. Add error boundaries around ArgumentPopout and DiagramViewer
5. Add keyboard navigation and ARIA labels to interactive components

---

## 7. Next Steps

### Immediate (Phase 4 Completion)
1. **Remove Dead Code:** Clean up commented sections in ArgumentPopout.tsx
2. **Add Confidence Overlays:** Integrate SupportBar into DiagramViewer edges
3. **CQ Badge on Schemes:** Show CQ satisfaction count on RA nodes in AIF view
4. **Test Import Mode:** Verify backend support for cross-deliberation imports

### Phase 5: Plexus & Cross-Room Semantics
1. Review cross-deliberation argument referencing backend
2. Analyze plexus identity resolution (same argument in multiple deliberations)
3. Assess join operation for multi-room confidence aggregation
4. Document categorical semantics of cross-room morphisms

### Phase 6: Knowledge Base & Export
1. AIF JSON export from ArgumentPopout
2. PDF rendering of argument diagrams with confidence overlays
3. CSV export of claim scores + CQ status
4. Integration with external argumentation tools (AIFDB, Carneades)

---

## 8. Overall Assessment

| Criterion | Score | Notes |
|-----------|-------|-------|
| **Dual-Mode Rendering** | 95% | Smooth Toulmin ↔ AIF toggle, clean UI |
| **Two-Level Navigation** | 90% | Debate → Argument flow works well, lacks breadcrumbs |
| **Expand/Collapse Mechanics** | 80% | maxDepth limiting works, but no incremental expansion |
| **Minimap Integration** | 85% | AFMinimap strong, ClaimMiniMap comprehensive, but not coordinated |
| **Confidence Visualization** | 65% | Good at debate level, missing at argument level |
| **CQ Status Display** | 70% | ClaimMiniMap shows CQ%, but not in ArgumentPopout |
| **Code Quality** | 85% | Strong typing, SWR usage, but some cleanup needed |
| **Categorical Alignment** | 90% | Hom-set interpretation clear, join operation correct |

**Overall Phase 4B Grade: A- (90%)**

---

## 9. Key Findings for Architecture Review

1. **Two-level representation fully functional** with clear separation between debate-level (DebateSheetReader) and argument-level (ArgumentPopout) views
2. **Dual-mode rendering sophisticated** with Toulmin and AIF modes maintaining structural equivalence
3. **Evidential integration strong** at debate level with SupportBar and DS interval support, but **missing at argument level** (no confidence on inferences/edges)
4. **CQ status tracking comprehensive** in ClaimMiniMap but **not integrated into AIF graph** views
5. **Force-directed minimap** (AFMinimap) provides excellent semantic visualization with Dung labels
6. **Performance optimized** with memoization, pagination, and smart SWR caching
7. **Critical gap:** No hierarchical/sunburst visualization for multi-level drill-down
8. **Critical gap:** Cross-room argument imports UI exists but backend support unclear

**Next phase (5A/5B) should focus on cross-deliberation semantics and plexus architecture.**
