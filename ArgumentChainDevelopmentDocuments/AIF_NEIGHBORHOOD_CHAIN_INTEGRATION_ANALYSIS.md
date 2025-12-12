# AIF Neighborhood ↔ Argument Chain Integration Analysis

**Date:** December 12, 2025  
**Status:** Analysis & Proposal  
**Author:** Copilot Agent

---

## 1. Executive Summary

The **AIF Neighborhood System** and **Argument Chain System** are two complementary but currently separate features in Mesh. This analysis identifies integration opportunities that could create powerful synergies between the systems.

| System | Purpose | Key Entities | Primary Use |
|--------|---------|--------------|-------------|
| **AIF Neighborhood** | Explore argument relationships from a single argument's perspective | `AifNode`, `AifEdge`, `AifSubgraph` | Real-time exploration, conflict/preference visualization |
| **Argument Chain** | Curate and compose multi-argument reasoning structures | `ArgumentChainNode`, `ArgumentChainEdge`, `ArgumentScope` | Deliberate construction, export, sharing |

### Key Insight

The AIF Neighborhood provides **discovery** (what arguments relate to X?), while Argument Chains provide **curation** (which relationships matter for my thesis?). Integrating them enables a powerful **discover → curate → analyze** workflow.

---

## 2. System Comparison

### 2.1 Data Model Comparison

| Concept | AIF Neighborhood | Argument Chain |
|---------|------------------|----------------|
| **Core nodes** | `AifNode` (I, RA, CA, PA types) | `ArgumentChainNode` → `Argument` |
| **Edges** | `AifEdge` with `role` (premise, conclusion, conflict, etc.) | `ArgumentChainEdge` with `edgeType` (SUPPORTS, REFUTES, etc.) |
| **Conflict representation** | `CA` nodes (explicit conflict application entities) | `REFUTES`, `UNDERMINES`, `UNDERCUTS` edge types |
| **Preference representation** | `PA` nodes (explicit preference applications) | Not directly modeled (future opportunity) |
| **Scoping** | None | `ArgumentScope` (hypothetical, counterfactual, etc.) |
| **Epistemic status** | Via enhanced metadata (`epistemicStatus`, `locutionType`) | `EpistemicStatus` enum on nodes |
| **Depth exploration** | Configurable depth (0-5 hops) | Full graph always loaded |

### 2.2 Type Mappings

```
AIF Neighborhood Types          Argument Chain Types
─────────────────────────────────────────────────────────────
AifNode.kind = 'RA'         →   ArgumentChainNode.argument
AifNode.kind = 'I'          →   Argument.conclusion / premises
AifNode.kind = 'CA'         →   ArgumentChainEdge.edgeType = 'REFUTES'/'UNDERMINES'
AifNode.kind = 'PA'         →   Not directly mapped (opportunity!)

AifEdge.role = 'premise'    →   Implicit via Argument.premises
AifEdge.role = 'conclusion' →   Implicit via Argument.conclusion
AifEdge.role = 'conflictingElement' → ArgumentChainEdge (attack types)
AifEdge.role = 'preferredElement'   → Not directly mapped
```

### 2.3 API Comparison

| Operation | AIF Neighborhood | Argument Chain |
|-----------|------------------|----------------|
| **Fetch graph** | `GET /api/arguments/[id]/aif-neighborhood?depth=2` | `GET /api/argument-chains/[chainId]` |
| **Export to AIF** | Inline in response | `GET /api/argument-chains/[chainId]/export/aif` |
| **Get summary** | `?summaryOnly=true` | Via `_count` in response |
| **Filter by type** | `?includeSupporting=true&includeOpposing=true` | Via chain structure |

---

## 3. Integration Opportunities

### 3.1 🔍 **Neighborhood Discovery → Chain Building** (High Value)

**Concept:** Allow users to explore an argument's neighborhood and selectively import discovered arguments into an Argument Chain.

**User Flow:**
1. User opens an Argument Chain canvas
2. User right-clicks a node → "Explore Neighborhood"
3. Mini-neighborhood preview appears showing related arguments (using `MiniNeighborhoodPreview`)
4. User can click "Add to Chain" on any discovered argument
5. System creates a new `ArgumentChainNode` and suggests appropriate edge type

**Implementation:**

```typescript
// New API: Import argument from neighborhood into chain
// POST /api/argument-chains/[chainId]/import-from-neighborhood

interface ImportFromNeighborhoodRequest {
  sourceArgumentId: string;      // The argument in the chain we're exploring
  targetArgumentId: string;      // The discovered argument to import
  suggestedEdgeType?: ArgumentChainEdgeType;  // Auto-detected from neighborhood
  position?: { x: number; y: number };
}
```

**Components to Create:**
- `NeighborhoodExplorer.tsx` - Embedded in chain canvas as a side panel
- `ImportArgumentButton.tsx` - In MiniNeighborhoodPreview for each node
- Hook: `useNeighborhoodDiscovery(argumentId)` - Manages neighborhood state

**Estimated Effort:** 8-12 hours

---

### 3.2 🔗 **Chain to Neighborhood View** (Medium Value)

**Concept:** Generate a live AIF neighborhood view from an Argument Chain, showing the chain's structure in the AIF visualization style.

**User Flow:**
1. User has an Argument Chain open
2. User clicks "View as AIF Graph"
3. System renders the chain using AIF node/edge styling (colored by type)
4. User can toggle between Canvas view and AIF Graph view

**Implementation:**

```typescript
// New utility: Convert ArgumentChain to AifSubgraph (for visualization)
// lib/chains/chainToNeighborhood.ts

export function convertChainToAifSubgraph(
  chain: ArgumentChainWithRelations
): AifSubgraph {
  const nodes: AifNode[] = [];
  const edges: AifEdge[] = [];
  
  // Convert each ArgumentChainNode to RA-node + I-node pair
  for (const chainNode of chain.nodes) {
    const raId = `RA:${chainNode.argumentId}`;
    const iId = `I:${chainNode.argument.conclusionClaimId}`;
    
    nodes.push({
      id: raId,
      kind: 'RA',
      label: chainNode.argument.text,
      epistemicStatus: chainNode.epistemicStatus,
      // ...
    });
    
    nodes.push({
      id: iId,
      kind: 'I',
      label: chainNode.argument.conclusion?.text,
    });
    
    edges.push({
      id: `e:${chainNode.id}:concl`,
      from: raId,
      to: iId,
      role: 'conclusion',
    });
  }
  
  // Convert chain edges to AIF edge roles
  for (const chainEdge of chain.edges) {
    const role = mapChainEdgeToAifRole(chainEdge.edgeType);
    // ...
  }
  
  return { nodes, edges };
}

function mapChainEdgeToAifRole(edgeType: ArgumentChainEdgeType): AifEdgeRole {
  switch (edgeType) {
    case 'SUPPORTS': return 'premise';
    case 'REFUTES': return 'conflictedElement';
    case 'UNDERMINES': return 'conflictedElement';
    case 'UNDERCUTS': return 'conflictedElement';
    default: return 'premise';
  }
}
```

**Estimated Effort:** 6-8 hours

---

### 3.3 🧩 **Shared AIF Type System** (Foundation)

**Concept:** Unify the AIF types used by both systems into a shared type definition.

**Current State:**
- `lib/arguments/diagram.ts` defines `AifNode`, `AifEdge`, `AifSubgraph`
- `lib/utils/chainToAif.ts` defines separate `AifNode`, `AifEdge`, `AifDocument`

**Proposal:** Create `lib/types/aif.ts` as the canonical AIF type definitions:

```typescript
// lib/types/aif.ts

// Core AIF node kinds (AIF Ontology)
export type AifNodeKind = 
  | 'I'    // Information (claims, propositions)
  | 'RA'   // Rule Application (inference)
  | 'CA'   // Conflict Application (attack)
  | 'PA'   // Preference Application
  | 'MA'   // Modal Application
  | 'TA'   // Transition (dialogue)
  | 'YA'   // Yet-to-be-resolved
  | 'CTX'  // Context (Mesh extension for scopes)
  | 'S';   // Scheme reference

// Edge roles (AIF Ontology + Mesh extensions)
export type AifEdgeRole =
  | 'premise'
  | 'conclusion'
  | 'conflictingElement'
  | 'conflictedElement'
  | 'preferredElement'
  | 'dispreferredElement'
  | 'has-presumption'
  | 'has-exception'
  | 'scope-member'       // Mesh extension
  | 'scope-parent';      // Mesh extension

// Unified AifNode with all optional extensions
export interface AifNode {
  id: string;
  kind: AifNodeKind;
  label?: string | null;
  text?: string;         // Full text (for export)
  timestamp?: string;
  
  // Scheme metadata
  schemeKey?: string | null;
  schemeName?: string | null;
  
  // Dialogue/locution metadata
  dialogueMoveId?: string | null;
  locutionType?: string | null;
  
  // Critical Question status
  cqStatus?: {
    total: number;
    answered: number;
    open: number;
    keys: string[];
  } | null;
  
  // Phase 4: Epistemic/scope extensions
  epistemicStatus?: EpistemicStatus;
  dialecticalRole?: DialecticalRole | null;
  scopeId?: string | null;
  scopeType?: ScopeType;
  
  // Import tracking
  isImported?: boolean;
  importedFrom?: string[] | null;
  
  // Toulmin structure
  toulminDepth?: number | null;
}

export interface AifEdge {
  id: string;
  from: string;
  to: string;
  role?: AifEdgeRole;
  label?: string;
}

export interface AifSubgraph {
  nodes: AifNode[];
  edges: AifEdge[];
}
```

**Migration:**
1. Create `lib/types/aif.ts` with unified types
2. Update `lib/arguments/diagram.ts` to import from `lib/types/aif.ts`
3. Update `lib/utils/chainToAif.ts` to import from `lib/types/aif.ts`
4. Update components to use shared types

**Estimated Effort:** 3-4 hours

---

### 3.4 📊 **Neighborhood Statistics in Chain Analysis** (Medium Value)

**Concept:** Enhance the Chain Analysis Panel to show neighborhood statistics for each node.

**User Flow:**
1. User opens Chain Analysis Panel
2. Each argument shows a "Connections" badge: "5 supports, 2 conflicts, 1 preference"
3. Clicking the badge opens the neighborhood explorer

**Implementation:**

```typescript
// New hook: useNodeNeighborhoodStats
export function useNodeNeighborhoodStats(argumentIds: string[]) {
  return useQuery({
    queryKey: ['neighborhood-stats', argumentIds],
    queryFn: async () => {
      const results = await Promise.all(
        argumentIds.map(id => 
          fetch(`/api/arguments/${id}/aif-neighborhood?summaryOnly=true`)
            .then(r => r.json())
        )
      );
      return Object.fromEntries(
        argumentIds.map((id, i) => [id, results[i].summary])
      );
    },
  });
}
```

**UI Addition to ChainAnalysisPanel:**

```tsx
// In argument card within analysis
<div className="flex gap-2 text-xs text-gray-500">
  {stats?.supportCount > 0 && (
    <Badge variant="outline" className="text-green-600">
      +{stats.supportCount} supports
    </Badge>
  )}
  {stats?.conflictCount > 0 && (
    <Badge variant="outline" className="text-red-600">
      ⚔ {stats.conflictCount} conflicts
    </Badge>
  )}
  {stats?.preferenceCount > 0 && (
    <Badge variant="outline" className="text-purple-600">
      ★ {stats.preferenceCount} preferences
    </Badge>
  )}
</div>
```

**Estimated Effort:** 4-6 hours

---

### 3.5 🎯 **Preference Application Support in Chains** (High Value, Larger Scope)

**Concept:** The AIF Neighborhood system supports Preference Applications (PA nodes), but Argument Chains don't have direct preference modeling. Add preference edges/nodes to chains.

**Schema Addition:**

```prisma
// New edge type
enum ArgumentChainEdgeType {
  // ... existing types
  PREFERS      // This argument is preferred over target
}

// Or: Dedicated preference model
model ArgumentChainPreference {
  id                String   @id @default(cuid())
  chainId           String
  preferredNodeId   String
  dispreferredNodeId String
  reason            String?
  schemeId          String?  // Link to preference scheme
  
  chain             ArgumentChain     @relation(...)
  preferredNode     ArgumentChainNode @relation("PreferredNode", ...)
  dispreferredNode  ArgumentChainNode @relation("DispreferredNode", ...)
  
  @@index([chainId])
}
```

**Benefit:** Enables richer dialectical modeling where users can explicitly mark preference orderings between conflicting arguments.

**Estimated Effort:** 12-16 hours (schema + API + UI)

---

### 3.6 🔄 **Bidirectional Sync: Chain ↔ Deliberation** (Advanced)

**Concept:** When an argument in a chain is attacked in the main deliberation, show a notification in the chain canvas.

**Implementation Sketch:**

```typescript
// Realtime subscription for chain nodes
useEffect(() => {
  const argumentIds = chain.nodes.map(n => n.argumentId);
  
  const subscription = supabase
    .channel('chain-argument-updates')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'ConflictApplication',
      filter: `conflictedArgumentId=in.(${argumentIds.join(',')})`,
    }, (payload) => {
      // Show notification: "Argument X was attacked!"
      showChainNotification({
        type: 'conflict',
        argumentId: payload.new.conflictedArgumentId,
        attackerId: payload.new.conflictingArgumentId,
      });
    })
    .subscribe();
    
  return () => subscription.unsubscribe();
}, [chain.nodes]);
```

**Estimated Effort:** 8-10 hours

---

## 4. Priority Ranking

| # | Feature | Value | Effort | Priority |
|---|---------|-------|--------|----------|
| 1 | **Neighborhood Discovery → Chain Building** | High | 8-12h | ⭐⭐⭐ P1 |
| 2 | **Shared AIF Type System** | Foundation | 3-4h | ⭐⭐⭐ P1 |
| 3 | **Neighborhood Statistics in Chain Analysis** | Medium | 4-6h | ⭐⭐ P2 |
| 4 | **Chain to Neighborhood View** | Medium | 6-8h | ⭐⭐ P2 |
| 5 | **Preference Application in Chains** | High | 12-16h | ⭐ P3 |
| 6 | **Bidirectional Sync** | Medium | 8-10h | ⭐ P3 |

---

## 5. Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Create `lib/types/aif.ts` with unified AIF types
- [ ] Migrate `diagram.ts` and `chainToAif.ts` to use shared types
- [ ] Add neighborhood summary to `ArgumentChainNode` hover cards

### Phase 2: Discovery Integration (Week 2)
- [ ] Create `NeighborhoodExplorerPanel` component
- [ ] Add "Explore Neighborhood" context menu in chain canvas
- [ ] Implement `POST /api/argument-chains/[chainId]/import-from-neighborhood`
- [ ] Add "Add to Chain" buttons in MiniNeighborhoodPreview

### Phase 3: Visualization & Statistics (Week 3)
- [ ] Create `chainToNeighborhood.ts` converter
- [ ] Add "View as AIF Graph" toggle in chain canvas
- [ ] Integrate neighborhood statistics into ChainAnalysisPanel

### Phase 4: Advanced Features (Week 4+)
- [ ] Add preference edges to argument chains
- [ ] Implement realtime conflict notifications
- [ ] Add preference import from PA nodes

---

## 6. Files to Modify/Create

### New Files
```
lib/types/aif.ts                          # Unified AIF types
lib/chains/chainToNeighborhood.ts         # Chain → AIF visualization
components/chains/NeighborhoodExplorerPanel.tsx
components/chains/ImportFromNeighborhoodButton.tsx
app/api/argument-chains/[chainId]/import-from-neighborhood/route.ts
```

### Modified Files
```
lib/arguments/diagram.ts                  # Use shared types
lib/arguments/diagram-neighborhoods.ts    # Use shared types
lib/utils/chainToAif.ts                   # Use shared types
components/aif/MiniNeighborhoodPreview.tsx # Add "Add to Chain" action
components/chains/ArgumentChainCanvas.tsx # Add neighborhood explorer
components/chains/ChainAnalysisPanel.tsx  # Add neighborhood stats
```

---

## 7. Conclusion

The AIF Neighborhood and Argument Chain systems have significant overlap in their underlying models (both work with arguments, relationships, and AIF semantics) but serve complementary purposes. The highest-value integration is **Neighborhood Discovery → Chain Building**, which would create a powerful workflow for researchers to discover related arguments and curate them into structured chains.

The recommended first step is **unifying the AIF type system** to establish a clean foundation, followed by implementing the discovery-to-curation workflow.
