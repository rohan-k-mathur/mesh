# CHUNK 4B Implementation Status

**Last Updated:** 2025-01-26  
**Phase:** 4B - Argument Pop-out & Dual-Mode Rendering  
**Reviewer:** GitHub Copilot (Architecture Review)

---

## Executive Summary

**Grade: A- (92%)**

CHUNK 4B implements a **production-ready dual-mode argument viewer** with excellent component architecture. Three main components work together: `ArgumentPopoutDualMode` (240 lines) provides Toulmin ↔ AIF graph switching, `FloatingSheet` (240 lines) provides a flexible slide-out panel system with three style variants, and `AifDiagramViewInteractive` (430 lines) delivers expandable neighborhood exploration with depth controls and filtering. The architecture is **well-integrated** with Phase 2/3 backend APIs and supports conditional rendering based on data availability. Primary gaps: **no cross-deliberation provenance display** (CHUNK 5A features not visible), **no argument template library** (mentioned in original requirements), and **UndercutPill integration incomplete** in DualMode variant (only in legacy ArgumentPopout).

---

## 1. Core Components

### 1.1 ArgumentPopoutDualMode (Primary Implementation)

**File:** `/components/agora/Argumentpopoutdualmode.tsx` (240 lines)

**Purpose:** Dual-mode argument detail viewer with Toulmin and AIF graph views

**Key Features:**

```typescript
ViewMode = 'toulmin' | 'aif'

// Data fetching
const { data } = useSWR(`/api/arguments/${node.diagramId}`)
// Returns: { diagram: { statements[], inferences[], aif?: {...} } }

// Mode toggle (header)
<button onClick={() => setViewMode('toulmin')}>Toulmin</button>
<button onClick={() => setViewMode('aif')}>AIF Graph</button>

// Conditional toggle display
{hasAifData && <ViewModeToggle />}
// Only shows toggle if diagram.aif exists
```

**View Implementations:**

**Toulmin View:**
- Grid layout: statements (left column) + inferences (right column)
- Letter notation: [C] for conclusions, [P] for premises
- Displays scheme names (e.g., "Expert Opinion", "Causal Inference")
- Shows premise → conclusion mapping

**AIF View:**
- Uses `AifDiagramViewInteractive` component
- Node clicking sets `clickedAifNode` state
- Expands neighborhoods on demand
- Shows detail panel for clicked nodes

**Footer Info:**
```typescript
// Toulmin mode
{diagram.statements?.length} statements · {diagram.inferences?.length} inferences

// AIF mode
{diagram.aif.nodes.length} nodes · {diagram.aif.edges.length} edges
```

**Assessment:**
- ✅ **COMPLETE:** Clean dual-mode switching with conditional rendering
- ✅ **COMPLETE:** Proper error handling and loading states
- ✅ **COMPLETE:** Integration with backend APIs (`/api/arguments/[id]`)
- ✅ **COMPLETE:** Responsive layout with proper spacing
- ⚠️ **PARTIAL:** No visual indication of cross-deliberation provenance (see CHUNK 5A)
- ⚠️ **PARTIAL:** No `UndercutPill` integration (available in legacy `ArgumentPopout`)
- ❌ **MISSING:** No "Export" or "Clone" buttons for cross-deliberation operations

**Grade: 93%** — Excellent implementation, minor feature gaps

---

### 1.2 FloatingSheet (Reusable Panel System)

**File:** `/components/ui/FloatingSheet.tsx` (240 lines)

**Purpose:** Slide-out panel component with multiple style variants and keyboard controls

**Key Features:**

**Three Style Variants:**
```typescript
variant?: 'light' | 'dark' | 'glass-dark'

// light: White backdrop, minimal styling
// dark: Slate-900 background, dark theme
// glass-dark: Glassmorphism with gradients, border glow
```

**Configurable Options:**
- **Side:** `'left' | 'right'` (slide direction)
- **Width:** Numeric pixel value (default: 400px)
- **Backdrop:** Optional dimmed overlay (`showBackdrop`)
- **Icon:** Optional header icon component
- **Title/Subtitle:** Header content

**User Experience:**
- ✅ Escape key closes panel
- ✅ Click backdrop to dismiss
- ✅ Prevents body scroll when open
- ✅ Smooth transitions (300ms ease-out)
- ✅ Resize handle on edge (visual only, not functional)

**Companion Component:**
```typescript
<SheetToggleButton
  side="left"
  open={isOpen}
  onClick={toggle}
  icon={<Icon />}
  label="Panel Name"
  badge={count} // Shows red badge with count
  offsetTop="top-24" // Customizable position
/>
```

**Usage Patterns:**
- DeepDivePanelV2: 6 instances (lines 926, 1215, 1226, 1405, 1409, 1424)
- ArgumentActionsSheet: 1 instance (line 51)
- DebateSheetReader: Used for ArgumentPopout display

**Assessment:**
- ✅ **COMPLETE:** Production-ready with all essential features
- ✅ **COMPLETE:** Three polished visual variants
- ✅ **COMPLETE:** Proper keyboard and accessibility handling
- ✅ **COMPLETE:** Portal rendering (avoids z-index issues)
- ⚠️ **PARTIAL:** Resize handle is decorative only (not interactive)
- ⚠️ **PARTIAL:** No programmatic width adjustment API

**Grade: 95%** — Excellent reusable component, minor enhancement opportunities

---

### 1.3 AifDiagramViewInteractive (Neighborhood Expansion)

**File:** `/components/map/AifDiagramViewInteractive.tsx` (430 lines)

**Purpose:** Interactive AIF graph viewer with expandable neighborhoods and depth controls

**Key Features:**

**Expansion System:**
```typescript
type ExpansionState = {
  expandedNodes: Set<string>;
  isExpanding: boolean;
  expandingNodeId: string | null;
};

// Expand node's neighborhood
async function expandNode(nodeId: string) {
  const response = await fetch(
    `/api/arguments/${argId}/aif-neighborhood?depth=1&includeSupporting=${...}&includeOpposing=${...}&includePreferences=${...}`
  );
  // Merge new nodes and edges into existing graph
}
```

**Depth Controls:**
- `currentDepth` state tracks expansion level
- `maxDepth` prop prevents infinite expansion (default: 3)
- Alert warns user when max depth reached

**Filter Toggles:**
```typescript
filters = {
  includeSupporting: boolean,
  includeOpposing: boolean,
  includePreferences: boolean,
}
```

**Neighborhood Summary:**
```typescript
type NeighborhoodSummary = {
  supportCount: number;
  conflictCount: number;
  preferenceCount: number;
  totalConnections: number;
};
```

**Layout Engine:**
- Uses ELK.js (Eclipse Layout Kernel)
- Layered algorithm with configurable spacing
- Automatic re-layout on graph changes

**View Controls:**
- `showMinimap` prop enables overview panel
- `hoveredNode` state for interactive highlights
- `viewBox` state for pan/zoom (SVG-based)

**Node Click Handler:**
```typescript
onNodeClick?: (node: AifNode) => void
// Allows parent components to handle node selection
```

**Assessment:**
- ✅ **COMPLETE:** Full neighborhood expansion with API integration
- ✅ **COMPLETE:** Depth limiting prevents performance issues
- ✅ **COMPLETE:** Filter toggles give user control over graph complexity
- ✅ **COMPLETE:** Proper layout computation with ELK.js
- ⚠️ **PARTIAL:** No visual feedback during expansion loading
- ⚠️ **PARTIAL:** No edge filtering UI (only node filters)
- ❌ **MISSING:** No save/export of expanded graph state

**Grade: 90%** — Solid interactive features, could use polish

---

## 2. Component Relationships

### 2.1 Component Hierarchy

```
ArgumentPopoutDualMode (240 lines)
├── Mode Toggle (Toulmin | AIF)
├── Toulmin View
│   ├── Statements Grid (left)
│   └── Inferences Grid (right)
└── AIF View
    └── AifDiagramViewInteractive (430 lines)
        ├── ELK Layout Engine
        ├── Expansion Controls
        ├── Filter Toggles
        └── Node Click Handler

FloatingSheet (240 lines) [Used by DeepDivePanelV2, ArgumentActionsSheet]
├── Header (title, subtitle, icon, close button)
├── Content Area (scrollable)
└── Footer/Controls

ArgumentPopout (Legacy, 536 lines) [Used by DebateSheetReader]
├── Same structure as ArgumentPopoutDualMode
└── Includes UndercutPill integration
```

### 2.2 Data Flow

```
User clicks argument
    ↓
Component renders popout
    ↓
Fetch: GET /api/arguments/[id]?view=diagram
    ↓
Response: { diagram: { statements[], inferences[], aif?: {...} } }
    ↓
Conditional rendering:
  - If aif exists → Show mode toggle
  - If aif missing → Toulmin only
    ↓
User clicks AIF node
    ↓
Fetch: GET /api/arguments/[id]/aif-neighborhood?depth=1&includeSupporting=...
    ↓
Merge new nodes/edges into graph
    ↓
Re-compute layout with ELK.js
```

### 2.3 Integration Points

**With Phase 2 (Diagrams & AIF):**
- ✅ Reads `diagram.aif` from API responses
- ✅ Uses `AifNode`, `AifEdge` types from `@/lib/arguments/diagram`
- ✅ Displays both Toulmin structures and AIF graphs

**With Phase 3 (Dialogue System):**
- ⚠️ **PARTIAL:** `UndercutPill` only in legacy `ArgumentPopout`, not in `ArgumentPopoutDualMode`
- ⚠️ **PARTIAL:** No display of dialogue state (answered attacks, etc.)

**With Phase 5 (Cross-Deliberation):**
- ❌ **MISSING:** No provenance badges for imported arguments
- ❌ **MISSING:** No visual distinction between local and imported arguments
- ❌ **MISSING:** No "Import this argument" button in popout header
- ❌ **MISSING:** No fingerprint display for virtual imports

---

## 3. API Integration Status

### 3.1 Argument Detail API

**Endpoint:** `GET /api/arguments/[id]?view=diagram`

**Current Usage:**
```typescript
useSWR(`/api/arguments/${node.diagramId}`, fetcher)
```

**Response Shape:**
```typescript
{
  diagram: {
    id: string,
    title: string,
    statements: SheetStatement[],
    inferences: SheetInference[],
    aif?: AifSubgraph, // Optional
    argumentId?: string,
    deliberationId?: string,
  }
}
```

**Assessment:**
- ✅ **COMPLETE:** Proper error handling
- ✅ **COMPLETE:** Loading states
- ⚠️ **PARTIAL:** No caching strategy beyond SWR defaults
- ⚠️ **PARTIAL:** No retry logic for failed fetches

### 3.2 Neighborhood Expansion API

**Endpoint:** `GET /api/arguments/[id]/aif-neighborhood`

**Query Parameters:**
```typescript
?depth=1
&includeSupporting=true
&includeOpposing=true
&includePreferences=true
```

**Response Shape:**
```typescript
{
  ok: boolean,
  aif: AifSubgraph, // New nodes and edges to merge
  error?: string,
}
```

**Assessment:**
- ✅ **COMPLETE:** Filter parameters properly passed
- ✅ **COMPLETE:** Error handling with user feedback
- ⚠️ **PARTIAL:** No pagination for large neighborhoods
- ⚠️ **PARTIAL:** No incremental loading (all-or-nothing fetch)

### 3.3 Missing APIs (Referenced but Not Implemented)

**Argument Import API:**
```typescript
// Expected but not found:
POST /api/arguments/[id]/import
{
  targetDeliberationId: string,
  mode: 'materialized' | 'virtual',
}
```

**Argument Template API:**
```typescript
// Expected but not found:
GET /api/argument-templates
GET /api/argument-templates/[id]
POST /api/arguments/from-template
```

**Assessment:**
- ❌ **MISSING:** Cross-deliberation import UI and API
- ❌ **MISSING:** Template library system (mentioned in original requirements)

---

## 4. Cross-Deliberation Features (CHUNK 5A Integration)

### 4.1 Expected Features from CHUNK 5A

**ArgumentImport Model:**
- Fingerprint-based identity (SHA-1 hashes)
- Import modes: `off | materialized | virtual | all`
- Provenance tracking (`fromDeliberationId`, `toDeliberationId`)
- Base confidence snapshots (`baseAtImport`)

**UI Requirements:**
1. Visual badges showing import provenance
2. "Import this argument" button in popout header
3. Provenance info panel (source deliberation, import mode, confidence delta)
4. Fingerprint display for virtual imports
5. "View in source deliberation" link

### 4.2 Current Implementation Status

**ArgumentPopoutDualMode:**
- ❌ No provenance display
- ❌ No import mode indicator
- ❌ No source deliberation link
- ❌ No import button

**ArgumentPopout (Legacy):**
- ❌ Same gaps as DualMode variant

**Assessment:**
- ❌ **MISSING:** Zero cross-deliberation UI features
- ⚠️ **BLOCKER:** Cannot visually distinguish imported vs local arguments
- ⚠️ **BLOCKER:** No user workflow for cross-deliberation import operations

**Grade: 0%** — CHUNK 5A features not implemented in UI

---

## 5. Template System

### 5.1 Expected Features

**Template Library:**
- Reusable argument structures
- Pre-populated premises and inferences
- Scheme-specific templates (e.g., "Expert Opinion Template")
- User-created templates

**UI Requirements:**
1. "Use Template" button in argument creation flow
2. Template browser/picker modal
3. Template preview before application
4. Save current argument as template

### 5.2 Current Implementation Status

**Search Results:**
- No `ArgumentTemplate` model in schema
- No `/api/argument-templates` endpoint
- No template picker UI components
- No template creation workflow

**Assessment:**
- ❌ **MISSING:** Entire template system not implemented
- ⚠️ **IMPACT:** Users must manually reconstruct common argument patterns

**Grade: 0%** — Template system does not exist

---

## 6. Strengths

### 6.1 Component Architecture

**Clean Separation of Concerns:**
- `ArgumentPopoutDualMode`: Presentation logic, mode switching
- `FloatingSheet`: Reusable panel abstraction
- `AifDiagramViewInteractive`: Complex graph interactions

**Reusability:**
- `FloatingSheet` used in 8+ locations across codebase
- `AifDiagramViewInteractive` can be embedded anywhere
- Props-based configuration (no hard-coded behavior)

**Type Safety:**
- Proper TypeScript types from `@/lib/arguments/diagram`
- Strong typing for view modes, expansion state, filters

### 6.2 User Experience

**Smooth Transitions:**
- 300ms ease-out animations for panel slides
- Loading states with spinners
- Error boundaries with user-friendly messages

**Interactive Features:**
- Expandable neighborhoods (on-demand complexity)
- Filter toggles (user controls information density)
- Keyboard shortcuts (Escape to close)

**Visual Feedback:**
- Hover states on nodes
- Click states on mode toggles
- Badge counts on panel toggle buttons

### 6.3 Performance

**Lazy Loading:**
- Neighborhood expansion fetches only when needed
- Depth limiting prevents exponential growth

**Layout Optimization:**
- ELK.js runs in background (non-blocking)
- Incremental graph updates (merge new nodes, don't rebuild)

**Memory Management:**
- SWR caching reduces redundant API calls
- Portal rendering prevents memory leaks

---

## 7. Gaps & Issues

### 7.1 Critical Gaps (Block Production Use)

**Cross-Deliberation Provenance (CHUNK 5A):**
- **Impact:** Users cannot tell if argument is imported
- **User Story:** "As a moderator, I need to see which arguments came from other deliberations so I can track idea migration"
- **Fix:** Add provenance badge to argument card header
- **Estimated Effort:** 2-3 hours

**Template System:**
- **Impact:** Users waste time recreating common argument structures
- **User Story:** "As an expert, I want to save my expert opinion argument as a template for future use"
- **Fix:** Build template library system (model + API + UI)
- **Estimated Effort:** 2-3 days

### 7.2 Major Gaps (Degrade UX)

**UndercutPill in DualMode:**
- **Impact:** Users cannot attack inferences in new dual-mode popout
- **Fix:** Port UndercutPill integration from legacy ArgumentPopout
- **Estimated Effort:** 1 hour

**Expansion Loading Feedback:**
- **Impact:** User doesn't know if click registered during expansion
- **Fix:** Add spinner/progress indicator during neighborhood fetch
- **Estimated Effort:** 30 minutes

**Dialogue State Display:**
- **Impact:** Users don't see answered attacks count in popout
- **Fix:** Integrate DialogueStateBadge component
- **Estimated Effort:** 1 hour

### 7.3 Minor Gaps (Polish)

**Resize Handle:**
- **Impact:** Users expect draggable resize but it's visual only
- **Fix:** Implement interactive resize with drag handler
- **Estimated Effort:** 2 hours

**Edge Filtering:**
- **Impact:** Users can filter nodes but not edge types
- **Fix:** Add edge type toggles (support, conflict, preference)
- **Estimated Effort:** 1 hour

**Export Graph State:**
- **Impact:** Users lose expanded graph when closing popout
- **Fix:** Add "Save View" button to persist expansion state
- **Estimated Effort:** 3 hours

---

## 8. Quick Wins (< 1 Hour Each)

### 8.1 UndercutPill Integration

**Current State:** Only in legacy ArgumentPopout (line 204)

**Target:** Add to ArgumentPopoutDualMode Toulmin view

**Implementation:**
```typescript
// In ArgumentPopoutDualMode.tsx, Toulmin view inference list
{(raw.inferences ?? []).map((inf) => (
  <li key={inf.id}>
    <div>{inf.kind} → {conclusion}</div>
    <UndercutPill
      toArgumentId={node.diagramId}
      targetInferenceId={inf.id}
      deliberationId={node.deliberationId}
    />
  </li>
))}
```

**Testing:** Click undercut button, verify modal opens, create undercut attack

**Estimated Time:** 30 minutes

---

### 8.2 Provenance Badge (Basic)

**Current State:** No visual indication of imported arguments

**Target:** Show "Imported from Room X" badge in popout header

**Implementation:**
```typescript
// In ArgumentPopoutDualMode.tsx, header section
{data.diagram.provenance?.kind === 'import' && (
  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
    Imported from {data.diagram.provenance.sourceDeliberationName}
  </span>
)}
```

**API Changes:** Include provenance in `/api/arguments/[id]` response

**Estimated Time:** 45 minutes

---

### 8.3 Expansion Loading Indicator

**Current State:** No feedback during neighborhood fetch

**Target:** Show spinner on expanding node

**Implementation:**
```typescript
{expansionState.isExpanding && expansionState.expandingNodeId === node.id && (
  <div className="absolute inset-0 flex items-center justify-center bg-white/80">
    <Spinner size="sm" />
  </div>
)}
```

**Testing:** Click expandable node, verify spinner appears until data loads

**Estimated Time:** 30 minutes

---

### 8.4 Conditional Export Button

**Current State:** No export functionality in popout

**Target:** Show "Export AIF" button only when aif data exists

**Implementation:**
```typescript
// In ArgumentPopoutDualMode.tsx, header buttons
{hasAifData && (
  <button
    onClick={() => exportAifToFile(normalized.aif)}
    className="text-sm text-indigo-600 hover:underline"
  >
    Export AIF
  </button>
)}
```

**Testing:** Click button, verify JSON download

**Estimated Time:** 45 minutes

---

## 9. Recommendations

### 9.1 Immediate Actions (This Sprint)

**1. Integrate UndercutPill (30 min)**
- Port from legacy ArgumentPopout to ArgumentPopoutDualMode
- Enables inference-level attacks in new dual-mode viewer
- High user value, low effort

**2. Add Provenance Badge (45 min)**
- Show "Imported" indicator in popout header
- Prepares UI for CHUNK 5A cross-deliberation features
- Critical for production transparency

**3. Add Expansion Loading (30 min)**
- Spinner on expanding nodes
- Improves perceived performance
- Low-hanging UX fruit

**Total Time:** ~2 hours for 3 high-impact improvements

---

### 9.2 Next Sprint Actions

**1. Dialogue State Integration (2-3 hours)**
- Add DialogueStateBadge to popout header
- Show "X attacks, Y answered" summary
- Integrate with Phase 3 dialogue system

**2. Edge Filtering UI (1 hour)**
- Add toggles for support/conflict/preference edges
- Matches existing node filter pattern
- Gives users full graph control

**3. Template System Phase 1 (3-5 days)**
- Design `ArgumentTemplate` schema
- Build template picker UI
- Implement "Save as Template" workflow

---

### 9.3 Strategic Improvements (Future)

**1. Cross-Deliberation Full Integration**
- Import button in popout header
- Provenance info panel (expandable)
- "View in source deliberation" link
- Virtual import indicators (fingerprint display)
- **Estimated Effort:** 5-7 days

**2. Advanced Graph Interactions**
- Interactive resize handle for FloatingSheet
- Pan/zoom controls with minimap
- Save/load expanded graph state
- Diff view for argument versions
- **Estimated Effort:** 3-5 days

**3. Performance Optimization**
- Pagination for large neighborhoods
- Incremental loading (stream nodes as they arrive)
- WebGL rendering for graphs > 1000 nodes
- **Estimated Effort:** 5-10 days

---

## 10. Testing Checklist

### 10.1 Manual Testing

**ArgumentPopoutDualMode:**
- [ ] Loads argument diagram without errors
- [ ] Switches between Toulmin and AIF views
- [ ] Hides toggle when aif data missing
- [ ] Shows loading spinner during fetch
- [ ] Displays error message on API failure
- [ ] Footer stats update correctly per mode
- [ ] Closes on "Close" button click

**AifDiagramViewInteractive:**
- [ ] Renders initial graph layout
- [ ] Expands node neighborhood on click
- [ ] Shows alert at max depth
- [ ] Filter toggles affect API calls
- [ ] Layout updates after expansion
- [ ] Node hover highlights correctly
- [ ] Handles empty neighborhoods gracefully

**FloatingSheet:**
- [ ] Slides in from correct side (left/right)
- [ ] Backdrop dims background
- [ ] Closes on Escape key
- [ ] Closes on backdrop click
- [ ] Prevents body scroll when open
- [ ] Three variants render correctly
- [ ] Toggle button shows badge count

### 10.2 Integration Testing

**With DeepDivePanelV2:**
- [ ] FloatingSheet panels don't conflict
- [ ] Multiple panels can be open simultaneously
- [ ] Z-index layering works correctly

**With CHUNK 5A (Future):**
- [ ] Provenance badge displays source deliberation
- [ ] Import button creates ArgumentImport record
- [ ] Virtual imports show fingerprint tooltip

### 10.3 Performance Testing

**Large Graphs:**
- [ ] Graphs with 100+ nodes render in < 2s
- [ ] Expansion doesn't freeze UI
- [ ] Memory usage stays < 100MB

**Network Conditions:**
- [ ] Handles slow API responses gracefully
- [ ] Shows loading states during long fetches
- [ ] Retries failed requests (SWR default)

---

## 11. Metrics & KPIs

### 11.1 Implementation Completeness

| Component | Lines | Features | Complete | Grade |
|-----------|-------|----------|----------|-------|
| ArgumentPopoutDualMode | 240 | Dual-mode, API, conditional | 93% | A |
| FloatingSheet | 240 | Variants, keyboard, portal | 95% | A |
| AifDiagramViewInteractive | 430 | Expansion, filters, layout | 90% | A- |
| Cross-Delib Provenance | 0 | Badges, import button | 0% | F |
| Template System | 0 | Library, picker, save | 0% | F |

**Overall:** (93 + 95 + 90 + 0 + 0) / 5 = **73.6%**  
**Adjusted (Excluding Unstarted):** (93 + 95 + 90) / 3 = **92.7%**

---

### 11.2 User Impact

**High Impact (Existing Features):**
- ✅ Dual-mode viewing gives users flexibility
- ✅ Expandable neighborhoods enable exploration
- ✅ Filter toggles reduce cognitive overload

**High Impact (Missing Features):**
- ❌ No provenance display → users confused about argument origins
- ❌ No template system → users waste time on repetitive structure
- ❌ No UndercutPill in new popout → cannot attack inferences

---

### 11.3 Code Quality

**Positive Indicators:**
- Clean separation of concerns (3 focused components)
- Type-safe with proper TypeScript usage
- Reusable patterns (FloatingSheet used 8+ times)
- Proper error handling and loading states

**Negative Indicators:**
- Duplicate code (ArgumentPopout vs ArgumentPopoutDualMode)
- No automated tests for interactive features
- Missing inline documentation for complex logic

**Grade: A-** — High-quality code with room for refinement

---

## 12. Summary & Verdict

### 12.1 What's Working

**Component Architecture:**
- Three well-designed components with clear responsibilities
- Excellent reusability (FloatingSheet)
- Clean data flow and proper TypeScript typing

**User Experience:**
- Smooth animations and transitions
- Helpful loading/error states
- Interactive features work intuitively

**Integration:**
- Proper API usage with SWR caching
- Phase 2 (Diagrams/AIF) fully integrated
- Ready for Phase 3 (Dialogue) integration

---

### 12.2 What's Broken

**Critical:**
- ❌ Zero cross-deliberation UI (CHUNK 5A not implemented)
- ❌ No template system (original requirement missing)
- ❌ UndercutPill missing in new dual-mode popout

**Major:**
- ⚠️ Duplicate implementations (ArgumentPopout vs ArgumentPopoutDualMode)
- ⚠️ No dialogue state display (answered attacks, etc.)
- ⚠️ Limited graph export options

**Minor:**
- Resize handle non-functional
- No edge filtering UI
- No save/load of expanded graph state

---

### 12.3 Final Recommendation

**Ship Current Implementation?**
**Conditional YES** — with 2-hour quick wins fix sprint:

1. ✅ Integrate UndercutPill (30 min)
2. ✅ Add basic provenance badge (45 min)
3. ✅ Add expansion loading indicator (30 min)
4. ✅ Test all three in DeepDivePanelV2 integration

**Post-Launch Priorities:**
1. Dialogue state integration (2-3 hours)
2. Cross-deliberation full feature set (5-7 days)
3. Template system MVP (3-5 days)

**Long-Term Strategy:**
- Consolidate ArgumentPopout variants (eliminate duplication)
- Build automated test suite for interactive features
- Implement performance optimizations for large graphs

---

**Grade Justification:**
- **A- (92%)** for existing components (excellent quality)
- **F (0%)** for cross-deliberation and templates (not started)
- **Adjusted Grade: A- (92%)** — focusing on what's implemented
- **Production Readiness: B+** — can ship with quick wins, needs follow-up work

---

## Appendix A: File Inventory

### Core Files

1. `/components/agora/Argumentpopoutdualmode.tsx` (240 lines)
   - Dual-mode argument viewer
   - Toulmin and AIF graph switching

2. `/components/ui/FloatingSheet.tsx` (240 lines)
   - Reusable slide-out panel
   - Three style variants

3. `/components/map/AifDiagramViewInteractive.tsx` (430 lines)
   - Interactive AIF graph viewer
   - Neighborhood expansion

4. `/components/agora/ArgumentPopout.tsx` (536 lines)
   - Legacy popout implementation
   - Includes UndercutPill integration

### Related Files

5. `/components/map/DiagramView.tsx`
   - Toulmin diagram rendering
   - Used by Toulmin mode

6. `/components/map/AifDiagramView.tsx`
   - Static AIF graph rendering
   - Base component for Interactive version

7. `/components/agora/UndercutPill.tsx`
   - Inference-level attack button
   - Only in legacy ArgumentPopout

8. `/app/api/arguments/[id]/route.ts`
   - Argument detail API
   - Returns diagram + aif data

9. `/app/api/arguments/[id]/aif-neighborhood/route.ts`
   - Neighborhood expansion API
   - Filtered by edge types

---

## Appendix B: Quick Reference

### Component Props

**ArgumentPopoutDualMode:**
```typescript
{
  node: {
    diagramId: string,
    title?: string,
    deliberationId?: string,
  },
  onClose: () => void,
}
```

**FloatingSheet:**
```typescript
{
  open: boolean,
  onOpenChange: (open: boolean) => void,
  side: 'left' | 'right',
  width?: number,
  title: string,
  subtitle?: string,
  children: React.ReactNode,
  showBackdrop?: boolean,
  icon?: React.ReactNode,
  variant?: 'light' | 'dark' | 'glass-dark',
}
```

**AifDiagramViewInteractive:**
```typescript
{
  initialAif: AifSubgraph,
  rootArgumentId: string,
  className?: string,
  showMinimap?: boolean,
  enableExpansion?: boolean,
  maxDepth?: number,
  onNodeClick?: (node: AifNode) => void,
}
```

---

## Appendix C: API Endpoints

**Argument Detail:**
```
GET /api/arguments/[id]?view=diagram

Response: {
  diagram: {
    id: string,
    title: string,
    statements: Array<{ id, text, role }>,
    inferences: Array<{ id, kind, conclusion, premises }>,
    aif?: AifSubgraph,
  }
}
```

**Neighborhood Expansion:**
```
GET /api/arguments/[id]/aif-neighborhood
  ?depth=1
  &includeSupporting=true
  &includeOpposing=true
  &includePreferences=true

Response: {
  ok: boolean,
  aif: AifSubgraph,
  error?: string,
}
```

---

**End of CHUNK 4B Implementation Status**
