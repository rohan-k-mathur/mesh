# Argument Chain System - Deep Technical Review

**Date:** January 2025 (initial), refreshed May 2026  
**Purpose:** Comprehensive system map for understanding architecture before integration work  
**Status:** Complete Review — see §11 for post-audit changes

---

## Executive Summary

The **Argument Chain** system is a complex, full-featured graph-based argumentation tool that allows users to:
1. Construct visual argument structures using ReactFlow
2. Apply formal argumentation theory (ASPIC+, Walton schemes, Wei & Prakken structures)
3. Analyze chain strength, detect cycles, and find critical paths
4. Export chains to multiple narrative formats (prose, essay, markdown)
5. Work with hypothetical/counterfactual reasoning via scopes

The system spans ~20+ files across data layer (Prisma), API routes (12+ endpoints), state management (Zustand), UI components (23 files), and analysis utilities.

---

## 1. Data Model Architecture

### 1.1 Core Entities (Prisma Schema)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           ArgumentChain                                       │
│  ┌─────────────┐    ┌──────────────────┐    ┌─────────────────┐              │
│  │ Metadata    │    │ Structure        │    │ Permissions     │              │
│  │ - name      │    │ - chainType      │    │ - createdBy     │              │
│  │ - descrip.  │    │ - rootNodeId     │    │ - isPublic      │              │
│  │ - purpose   │    │                  │    │ - isEditable    │              │
│  └─────────────┘    └──────────────────┘    └─────────────────┘              │
│                                                                               │
│  ┌─────────────────────────────────────┐                                     │
│  │ Relations                           │                                     │
│  │ - deliberation → Deliberation       │                                     │
│  │ - creator → User                    │                                     │
│  │ - nodes[] → ArgumentChainNode       │                                     │
│  │ - edges[] → ArgumentChainEdge       │                                     │
│  │ - scopes[] → ArgumentScope          │                                     │
│  └─────────────────────────────────────┘                                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Chain Types (ArgumentChainType Enum)

| Type | Description | Visual Structure |
|------|-------------|------------------|
| `SERIAL` | Linear chain | A → B → C |
| `CONVERGENT` | Multiple premises to one conclusion | A → C, B → C |
| `DIVERGENT` | One premise to multiple conclusions | A → B, A → C |
| `TREE` | Hierarchical premise-conclusion | Tree structure |
| `GRAPH` | General DAG | Complex interdependencies |

### 1.3 Node Model (ArgumentChainNode)

```typescript
model ArgumentChainNode {
  id           String   @id @default(cuid())
  chainId      String
  argumentId   String   // Links to Argument entity
  
  // Position & Role
  nodeOrder    Int
  role         ChainNodeRole?    // PREMISE, EVIDENCE, CONCLUSION, OBJECTION, REBUTTAL, QUALIFIER, COMMENT
  positionX    Float?
  positionY    Float?
  
  // Phase 4: Epistemic Status
  epistemicStatus  EpistemicStatus   // ASSERTED, HYPOTHETICAL, COUNTERFACTUAL, CONDITIONAL, QUESTIONED, DENIED, SUSPENDED
  scopeId          String?           // Links to ArgumentScope
  dialecticalRole  DialecticalRole?  // THESIS, ANTITHESIS, SYNTHESIS, OBJECTION, RESPONSE, CONCESSION
  
  // Recursive Attack Support
  targetType   ChainAttackTargetType  // NODE or EDGE
  targetEdgeId String?                // Populated when targetType = EDGE
  
  // Contributor
  addedBy      BigInt
  addedAt      DateTime
}
```

### 1.4 Edge Model (ArgumentChainEdge)

```typescript
model ArgumentChainEdge {
  id             String   @id @default(cuid())
  chainId        String
  sourceNodeId   String
  targetNodeId   String
  
  // Relationship Semantics
  edgeType       ArgumentChainEdgeType  // 10+ types
  strength       Float @default(1.0)     // 0.0 to 1.0
  
  // Slot Mapping (for scheme integration)
  description    String?
  slotMapping    Json?    // Maps premise slots to scheme slots
  
  // Recursive Attack Support
  attackingNodes ArgumentChainNode[]  // Nodes that attack this edge
}
```

### 1.5 Edge Types (ArgumentChainEdgeType Enum)

| Category | Type | Description |
|----------|------|-------------|
| **Support** | `SUPPORTS` | A supports B (conclusion → premise) |
| | `ENABLES` | A enables B (makes B's claim possible) |
| | `PRESUPPOSES` | B presupposes A (A must be true for B) |
| **Attack** | `REFUTES` | A challenges B (attack relation) |
| | `REBUTS` | Directly contradicts conclusion |
| | `UNDERCUTS` | Challenges inference/reasoning link |
| | `UNDERMINES` | Attacks supporting premise |
| **Modifier** | `QUALIFIES` | A adds conditions to B |
| | `EXEMPLIFIES` | A is example of B's general claim |
| | `GENERALIZES` | A abstracts from B's specific case |

### 1.6 Scope Model (ArgumentScope)

Used for grouping hypothetical/counterfactual arguments:

```typescript
model ArgumentScope {
  id             String     @id @default(cuid())
  chainId        String
  scopeType      ScopeType  // HYPOTHETICAL, COUNTERFACTUAL, CONDITIONAL, OPPONENT, MODAL
  assumption     String     // "If carbon tax passes", "Had we invested earlier"
  description    String?
  
  // Nesting Support
  parentScopeId  String?
  depth          Int @default(0)
  
  // Visual
  color          String?    // Hex color for boundary
  collapsed      Boolean @default(false)
}
```

---

## 2. API Layer

### 2.1 Route Structure

```
app/api/argument-chains/
├── route.ts                           # GET (list by deliberation), POST (create)
├── from-prong/
│   └── route.ts                       # POST — create chain from a prong/branch (added post-audit)
├── [chainId]/
│   ├── route.ts                       # GET (full chain with includes)
│   ├── analyze/
│   │   └── route.ts                   # POST (run analysis)
│   ├── attack-edge/
│   │   └── route.ts                   # POST — recursive attack on an edge (added post-audit)
│   ├── export/
│   │   ├── aif/route.ts               # POST — AIF JSON-LD export (split out post-audit)
│   │   └── essay/route.ts             # POST — essay export (split out post-audit)
│   ├── nodes/
│   │   ├── route.ts                   # GET (list), POST (create)
│   │   └── [nodeId]/
│   │       └── route.ts               # GET, PATCH, DELETE
│   ├── edges/
│   │   ├── route.ts                   # GET (list), POST (create)
│   │   └── [edgeId]/
│   │       └── route.ts               # GET, PATCH, DELETE
│   └── scopes/
│       ├── route.ts                   # GET (list), POST (create)
│       └── [scopeId]/
│           └── route.ts               # GET, PATCH, DELETE

app/api/deliberations/[id]/chains/
└── route.ts                           # GET — list chains scoped to a deliberation (added post-audit)
```

> Note: The single `export/route.ts` mentioned in the original audit no longer exists. AIF and essay exports are now distinct endpoints; markdown/prose generation runs client-side via `lib/chains/*` generators.

### 2.2 Key API Behaviors

**Create Chain (POST /api/argument-chains)**
```typescript
// Request body
{
  deliberationId: string,
  name: string,
  description?: string,
  purpose?: string,
  chainType: "SERIAL" | "CONVERGENT" | "DIVERGENT" | "TREE" | "GRAPH",
  isPublic?: boolean,
  isEditable?: boolean
}
```

**Create Node (POST /api/argument-chains/[chainId]/nodes)**
```typescript
// Request body
{
  argumentId: string,
  role?: ChainNodeRole,
  position?: { x: number, y: number },
  epistemicStatus?: EpistemicStatus,
  scopeId?: string,
  dialecticalRole?: DialecticalRole
}
```

**Create Edge (POST /api/argument-chains/[chainId]/edges)**
```typescript
// Request body
{
  sourceNodeId: string,
  targetNodeId: string,
  edgeType: ArgumentChainEdgeType,
  strength?: number,      // 0.0 to 1.0
  description?: string,
  slotMapping?: object
}
```

**Analyze Chain (POST /api/argument-chains/[chainId]/analyze)**
```typescript
// Response
{
  criticalPath: {
    nodeIds: string[],
    totalStrength: number,
    avgStrength: number,
    weakestLink: { nodeId: string, edgeStrength: number },
    pathLength: number
  },
  cycles: Array<{
    nodeIds: string[],
    severity: "warning" | "error",
    avgStrength: number
  }>,
  strength: {
    overallStrength: number,       // 0.0 to 1.0
    nodeStrengths: Map<string, number>,
    vulnerableNodes: string[],
    strongNodes: string[],
    structureType: "SCS" | "SDS" | "LCS" | "LDS" | "MS" | "Unit"
  },
  suggestions: Array<...>,
  schemeInfo?: {...}
}
```

---

## 3. State Management (Zustand)

### 3.1 Store: `lib/stores/chainEditorStore.ts`

```typescript
interface ChainEditorState {
  // ReactFlow Canvas State
  nodes: Node<ChainNodeData>[];
  edges: Edge<ChainEdgeData>[];
  
  // Selection
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  
  // Chain Metadata
  chainId: string | null;
  chainName: string;
  chainType: ArgumentChainType;
  isPublic: boolean;
  isEditable: boolean;
  
  // Recursive Attack Mode
  edgeAttackMode: boolean;
  targetedEdgeId: string | null;
  
  // Connection Editor State
  connectionEditorOpen: boolean;
  pendingConnection: { source: string; target: string } | null;
}
```

### 3.2 Key Actions

| Action | Purpose |
|--------|---------|
| `setNodes(nodes)` | Replace all nodes |
| `addNode(node)` | Add single node |
| `updateNode(id, data)` | Update node data |
| `removeNode(id)` | Remove node |
| `setEdges(edges)` | Replace all edges |
| `addEdge(edge)` | Add single edge |
| `updateEdge(id, data)` | Update edge data |
| `removeEdge(id)` | Remove edge |
| `setSelectedNode(id)` | Select node |
| `setSelectedEdge(id)` | Select edge |
| `enterEdgeAttackMode()` | Enable recursive attack mode |
| `exitEdgeAttackMode()` | Disable recursive attack mode |
| `setTargetedEdge(id)` | Set edge being attacked |
| `openConnectionEditor(source, target)` | Open edge creation modal |
| `setChainMetadata({...})` | Update chain metadata |

---

## 4. Analysis Engine

### 4.1 File: `lib/utils/chainAnalysisUtils.ts` (939 lines)

#### Core Analysis Functions

| Function | Purpose | Algorithm |
|----------|---------|-----------|
| `findCriticalPath(nodes, edges)` | Find strongest reasoning chain | DFS with strength tracking |
| `detectCycles(nodes, edges)` | Detect circular reasoning | DFS with recursion stack |
| `calculateChainStrength(nodes, edges)` | WWAW strength formula | Support - Attack aggregation |
| `detectChainStructureType(nodes, edges)` | Wei & Prakken classification | Graph topology analysis |
| `aggregateSchemes(nodes)` | Scheme usage statistics | Count and group schemes |
| `generateSuggestions(analysis)` | Improvement suggestions | Rule-based recommendations |

#### WWAW Strength Formula

Based on Rahwan et al. (2007):
```
strength(node) = Σ(incoming support edges) - Σ(incoming attack edges)
```

Overall chain strength by structure type:
- **Serial chains (SCS, SDS):** Weakest link principle (`min(nodeStrengths)`)
- **Convergent (LCS):** Weighted average
- **Complex graphs (MS):** Harmonic mean (penalizes weak links)

#### Wei & Prakken Structure Types

| Type | Full Name | Description |
|------|-----------|-------------|
| `SCS` | Serial Convergent Structure | Multiple premises → single conclusion, serial |
| `SDS` | Serial Divergent Structure | Single premise → multiple conclusions, serial |
| `LCS` | Linked Convergent Structure | Interdependent premises |
| `LDS` | Linked Divergent Structure | Interdependent conclusions |
| `MS` | Mixed Structure | Complex combination |
| `Unit` | Single-inference argument | One node or minimal chain |

---

## 5. UI Component Architecture

### 5.1 Component Hierarchy

```
<ArgumentChainCanvas>               [1293 lines]
├── <ReactFlow>
│   ├── <ArgumentChainNode>         [373 lines] - Custom node renderer
│   │   ├── <EpistemicStatusIcon>   - Shows epistemic status
│   │   ├── Role Badge              - PREMISE, OBJECTION, etc.
│   │   └── Action Menu             - Support, Attack, Details
│   ├── <ArgumentChainEdge>         - Custom edge renderer
│   └── <ScopeBoundary>             - Visual scope grouping
├── <Panel> (Controls)
│   ├── <AddNodeButton>             - Add argument to chain
│   ├── <ChainMetadataPanel>        - Edit name, type, visibility
│   ├── <ChainExportButton>         - Export dropdown
│   └── Attack Mode Toggle          - Enable edge attacks
├── <ChainAnalysisPanel>            [457 lines] - Sidebar
│   └── Analysis results display
├── <EnablerPanel>                  - Enablers analysis
├── <ScopesPanel>                   - Scope management
├── <ConnectionEditor>              - Edge creation modal
├── <ChainArgumentComposer>         - In-context argument creation
└── <CreateScopeDialog>/<EditScopeDialog>
```

### 5.2 Key UI Interactions

1. **Add Node:** Click "Add Node" → Select argument from deliberation → Node appears on canvas
2. **Create Edge:** Drag from source node handle → Drop on target node → Connection Editor opens
3. **Attack Node:** Click node menu → Choose attack type (Rebuts, Undercuts, Undermines) → Composer opens
4. **Attack Edge:** Toggle "Attack Edge" mode → Click edge → Add argument → Creates UNDERCUTS edge
5. **Create Scope:** Open Scopes Panel → "New Scope" → Select type & assumption
6. **Assign to Scope:** Drag node into scope boundary (auto-detects drop zone)
7. **Hypothetical Mode:** Click "Enter Mode" on scope → All new arguments auto-assigned with HYPOTHETICAL status

---

## 6. Export System

### 6.1 Export Generators (`lib/chains/`)

| File | Format | Description |
|------|--------|-------------|
| `proseGenerator.ts` | Legal brief style | Elaborate scheme-based narratives |
| `essayGenerator.ts` | Academic essay | Structured academic format |
| `narrativeGenerator.ts` | Story format | Chronological flow narrative |
| `markdownFormatter.ts` | Markdown | Structured MD with headers |
| `chainToThread.ts` | Thread view | Linear discussion format |

### 6.2 Export Features (Phase D Enhancements)

- **Epistemic language prefixes:** "Assuming that...", "Contrary to fact..."
- **Scope grouping:** Arguments grouped by hypothetical context
- **Chain type descriptions:** Introduction varies by SERIAL, CONVERGENT, etc.
- **Critical questions:** Include scheme-specific CQs in analysis sections

---

## 7. Integration Points for AIF Neighborhood

### 7.1 Current Argument Data Access

When a node is loaded, it includes the full `Argument` with:
- `conclusion` (Claim)
- `premises[]` (Claims)
- `argumentSchemes[]` (SchemeApplication with Scheme)
- `schemeNet` (SchemeNet with steps)

### 7.2 Potential Integration Points

| Integration | Location | Mechanism |
|-------------|----------|-----------|
| View Neighborhood from Node | `ArgumentChainNode.tsx` | Add "View Neighborhood" action button |
| Import from Neighborhood | `AddNodeButton.tsx` | Browse AIF neighborhood, select arguments |
| Cross-reference Display | `ChainAnalysisPanel.tsx` | Show related arguments from neighborhood |
| Attack Suggestions | `ChainArgumentComposer.tsx` | Suggest attacks based on neighborhood attackers |
| Scheme Context | Node tooltip/expansion | Show scheme details from AIF data |

### 7.3 Data Flow for Integration

```
AIF Neighborhood API                     Argument Chain Canvas
─────────────────────                    ────────────────────
GET /api/arguments/[id]/aif-neighborhood
     │
     ▼
┌─────────────────────────┐              ┌─────────────────────────┐
│ AIFNeighborhood         │    Import    │ ReactFlow Node          │
│ - centralNode           │ ──────────► │ - id                    │
│ - premises[]            │              │ - argument (hydrated)   │
│ - conclusions[]         │              │ - role                  │
│ - attacks[]             │              │ - epistemicStatus       │
│ - supports[]            │              │                         │
└─────────────────────────┘              └─────────────────────────┘
                                                    │
                                                    ▼
                                         ┌─────────────────────────┐
                                         │ Chain Analysis          │
                                         │ - criticalPath          │
                                         │ - strength              │
                                         │ - cycles                │
                                         └─────────────────────────┘
```

---

## 8. Key Files Reference

### 8.1 Data Layer
- `lib/models/schema.prisma` (lines 6786-7050) - Chain models
- `lib/types/argumentChain.ts` - TypeScript types

### 8.2 API Routes
- `app/api/argument-chains/route.ts` - List/Create chains
- `app/api/argument-chains/[chainId]/route.ts` - Get chain details
- `app/api/argument-chains/[chainId]/analyze/route.ts` - Run analysis
- `app/api/argument-chains/[chainId]/nodes/route.ts` - Node CRUD
- `app/api/argument-chains/[chainId]/edges/route.ts` - Edge CRUD
- `app/api/argument-chains/[chainId]/scopes/route.ts` - Scope CRUD

### 8.3 State Management
- `lib/stores/chainEditorStore.ts` - Zustand store

### 8.4 Analysis Utilities
- `lib/utils/chainAnalysisUtils.ts` - All analysis algorithms
- `lib/constants/chainEdgeTypes.ts` - Edge type configurations
- `lib/utils/chainLayoutUtils.ts` - Auto-layout algorithms

### 8.5 UI Components

**Canvas (graph) view:**
- `components/chains/ArgumentChainCanvas.tsx` - Main canvas (1293 lines)
- `components/chains/ArgumentChainNode.tsx` - Node renderer (372 lines)
- `components/chains/ArgumentChainEdge.tsx` - Edge renderer (142 lines)
- `components/chains/ChainAnalysisPanel.tsx` - Analysis sidebar (456 lines)
- `components/chains/ScopeBoundary.tsx` - Scope visual (371 lines)
- `components/chains/ScopeDialogs.tsx` - Create/edit scope modals (375 lines)
- `components/chains/ScopesPanel.tsx` - Scope management panel (449 lines)
- `components/chains/EnablerPanel.tsx` - Enablers analysis (329 lines)
- `components/chains/ChainArgumentComposer.tsx` - In-context composer (455 lines)
- `components/chains/ConnectionEditor.tsx` - Edge creation modal (218 lines)
- `components/chains/AddNodeButton.tsx` - Add argument to chain (333 lines)
- `components/chains/ChainMetadataPanel.tsx` - Edit chain metadata (186 lines)

**Thread/list/prose views (added post-audit):**
- `components/chains/ArgumentChainThread.tsx` - Linear thread renderer (317 lines)
- `components/chains/ChainThreadHeader.tsx` - Header for thread view (222 lines)
- `components/chains/ThreadNode.tsx` - Single node in thread + orphan node (478 lines)
- `components/chains/ThreadAttackOverlay.tsx` - Attack overlay UI (358 lines)
- `components/chains/ChainListPanel.tsx` - Browseable list of chains (506 lines)
- `components/chains/ChainProseView.tsx` - Legal-brief prose renderer (383 lines)
- `components/chains/ChainEssayView.tsx` - Academic essay renderer (444 lines)
- `components/chains/ChainExportButton.tsx` - Export menu (384 lines)
- `components/chains/EpistemicStatusBadge.tsx` - Status badge (210 lines)
- `components/chains/ChainParticipationBadge.tsx` - Participation badge (294 lines)

### 8.6 Export Generators
- `lib/chains/proseGenerator.ts` - Legal brief prose (2127 lines)
- `lib/chains/essayGenerator.ts` - Academic essay (1618 lines)
- `lib/chains/narrativeGenerator.ts` - Story narrative (928 lines)
- `lib/chains/markdownFormatter.ts` - Markdown export (781 lines)
- `lib/chains/chainToThread.ts` - Chain → thread structure (468 lines, post-audit)

### 8.7 Consumer Components
- `components/deepdive/v3/tabs/ChainsTab.tsx` - Tab integration (660 lines). Now supports `viewMode: "list" | "thread" | "canvas" | "prose" | "essay"` plus full action-modal flow (View Details, Preview Network, Reply, Support, Attack with `AttackArgumentWizard`).
- `components/deepdive/v3/sections/ChainsSection.tsx` - Section integration (363 lines)

---

## 9. Development Phases Completed

| Phase | Focus | Status |
|-------|-------|--------|
| Phase 1 | Core data model, basic CRUD | ✅ Complete |
| Phase 2 | ReactFlow canvas, node/edge types | ✅ Complete |
| Phase 3 | Analysis engine (WWAW, cycles, critical path) | ✅ Complete |
| Phase 4 | Epistemic status, scopes, hypotheticals | ✅ Complete |
| Phase 5 | Export generators (prose, essay, narrative) | ✅ Complete |
| Phase C | Markdown export enhancements | ✅ Complete |
| Phase D | Narrative/prose epistemic language | ✅ Complete |

---

## 10. Observations & Recommendations

### 10.1 Strengths
1. **Rich formal model:** Full ASPIC+ attack types, Wei & Prakken structures
2. **Epistemic sophistication:** Hypotheticals, counterfactuals, scopes
3. **Strong analysis:** WWAW formula, cycle detection, critical path
4. **Multiple export formats:** Prose, essay, narrative, markdown

### 10.2 Integration Opportunities
1. **AIF Neighborhood browser** in AddNodeButton for selecting arguments
2. **Preview neighborhood** action on ArgumentChainNode
3. **Attack suggestions** from neighborhood attackers in composer
4. **Cross-chain references** showing where arguments appear in other chains

### 10.3 Technical Debt
1. `ArgumentChainCanvas.tsx` at 1293 lines could be refactored
2. `proseGenerator.ts` at 2128 lines could use modularization
3. Scope boundary calculation is recalculated on every render

---

*This document provides a complete technical map of the Argument Chain system for integration planning.*

---

## 11. Post-Audit Changes (May 2026 refresh)

The following changes have landed since the original January 2025 audit. The body of the doc above has been updated in place; this section summarizes what changed so reviewers can scan diffs quickly.

### 11.1 New view modes beyond the ReactFlow canvas
The system is no longer canvas-only. `ChainsTab` now exposes five mutually exclusive view modes:

| Mode | Component | Purpose |
|------|-----------|---------|
| `list` | `ChainListPanel` | Browse all chains in a deliberation, expand to inspect nodes/edges |
| `thread` | `ArgumentChainThread` | Linear, scroll-friendly rendering of a single chain (root → leaves) |
| `canvas` | `ArgumentChainCanvas` | Original ReactFlow editor |
| `prose` | `ChainProseView` | Legal-brief / academic / summary prose, copy + download |
| `essay` | `ChainEssayView` | Full essay with deliberative / academic / persuasive tone, audience level, scheme + CQ toggles, markdown download |

`ArgumentChainThread` has its own data shape (`ChainThread`) produced by `lib/chains/chainToThread.ts`, which assigns an ordering, computes `maxDepth`, and surfaces orphan/disconnected nodes separately.

### 11.2 Per-argument actions wired through every view
`ChainsTab` now centralizes the same action-modal flow used in `ThreadedDiscussionTab`:
- View Details → `ArgumentCardV2` (via `/api/arguments/[id]/aif`)
- Preview Network → `MiniNeighborhoodPreview` (via `/api/arguments/[id]/aif-neighborhood?depth=1`)
- Reply → `PropositionComposerPro`
- Support → `AIFArgumentWithSchemeComposer`
- Attack → `AttackSuggestions` → `AttackArgumentWizard`

Each child view (`ChainListPanel`, `ArgumentChainThread`, plus the canvas) accepts the same `onView/onPreview/onReply/onSupport/onAttack` callbacks, so behavior is consistent across modes.

### 11.3 New API routes
- `POST /api/argument-chains/from-prong` — create a chain from an argument prong/branch.
- `POST /api/argument-chains/[chainId]/attack-edge` — first-class endpoint for recursive edge attacks (previously implied by the `targetType: EDGE` node trick alone).
- `POST /api/argument-chains/[chainId]/export/aif` — AIF JSON-LD export.
- `POST /api/argument-chains/[chainId]/export/essay` — essay export.
- `GET  /api/deliberations/[id]/chains` — list chains for a deliberation, used by `ChainListPanel`.

The single combined `export/route.ts` referenced in the original audit no longer exists.

### 11.4 New chain components
In addition to the view-mode renderers above:
- `ChainThreadHeader`, `ThreadNode` (+ `OrphanNode`), `ThreadAttackOverlay` — thread internals.
- `ChainExportButton` — promoted from inline panel control to a standalone component (384 lines).
- `EpistemicStatusBadge`, `ChainParticipationBadge` — extracted reusable badges.
- `ScopeDialogs` — create/edit scope modals split out of the canvas.

### 11.5 No-change confirmations
The following remain accurate as of the refresh and required no edits:
- Prisma data model (`ArgumentChain`, `ArgumentChainNode`, `ArgumentChainEdge`, `ArgumentScope`) and all enums.
- Zustand store shape (`lib/stores/chainEditorStore.ts`, 182 lines).
- Analysis engine (`lib/utils/chainAnalysisUtils.ts`, 938 lines) — WWAW formula, cycle detection, Wei & Prakken structure typing all unchanged.
- Edge type taxonomy and constants (`lib/constants/chainEdgeTypes.ts`, 131 lines).
- Phase 1–5 / C / D status table.

### 11.6 Still-open items
- `ArgumentChainCanvas.tsx` is still 1293 lines — the refactor flagged in §10.3 has not happened.
- `proseGenerator.ts` is still ~2127 lines — modularization flagged in §10.3 has not happened.
- An inline TODO at `ArgumentChainCanvas.tsx:1217` still references future recursive-attack work, even though `attack-edge` is now a real endpoint — the canvas UI for it should be revisited.
