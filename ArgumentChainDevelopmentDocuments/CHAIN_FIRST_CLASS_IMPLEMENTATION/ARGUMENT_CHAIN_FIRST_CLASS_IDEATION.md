# Making Argument Chains a First-Class Component: Ideation Session

**Date**: December 7, 2025  
**Status**: 🧠 **BRAINSTORMING / IDEATION**  
**Context**: Exploring how to elevate Argument Chains from a graph-only feature to a fully integrated, collaborative, multi-UI component

---

## Current State Summary

### What We Have

| Component | Purpose | Status |
|-----------|---------|--------|
| **ArgumentChain (Prisma model)** | Data model: chains, nodes, edges, roles | ✅ Complete |
| **ArgumentChainCanvas (ReactFlow)** | Graph-based visual construction/editing | ✅ Complete |
| **NarrativeGenerator** | JSON → Natural language (text/markdown) | ✅ Complete |
| **AIF Export** | JSON-LD export for interoperability | ✅ Complete |
| **ChainAnalysis** | Critical path, WWAW strength, cycle detection | ✅ Complete |
| **AIFArgumentsListPro** | List-based argument display (no chain awareness) | ✅ Complete |
| **SchemeNet** | Intra-argument scheme composition | ✅ Complete |

### What's Missing

1. **Collaborative chain construction** (non-realtime)
2. **Thread/list-based UI for chains** (alternative to graph)
3. **Linear chain builder** (JSON export for graph import)
4. **Scheme Net ↔ Argument Chain integration**

---

## Ideation Area 1: Collaborative Argument Chain Construction (Non-Realtime)

### The Problem
Currently, chains are single-author constructs. Real deliberation involves multiple participants building reasoning together over time.

### Design Patterns to Consider

#### Pattern A: "Suggest & Approve" Model
```
┌─────────────────────────────────────────────────────┐
│ Chain: "Carbon Tax Policy Argument"                │
│ Created by: Alice | Status: Collaborative          │
├─────────────────────────────────────────────────────┤
│                                                     │
│ [PENDING ADDITIONS]                                 │
│ ┌─────────────────────────────────────────────────┐│
│ │ Bob suggests adding:                            ││
│ │ "Economic Impact Analysis" → "Cost Assessment"  ││
│ │ Edge: SUPPORTS (strength: 0.8)                  ││
│ │ [✓ Accept] [✗ Reject] [💬 Discuss]              ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ [ACCEPTED NODES]                                    │
│ ○ Alice: "Climate Evidence" (root)                 │
│ ○ Alice: "Policy Recommendation"                   │
│ ○ Carol: "Legal Precedent" ← approved 2 days ago   │
└─────────────────────────────────────────────────────┘
```

**Data Model Extensions:**
```typescript
// New table for collaboration requests
model ChainContributionRequest {
  id              String   @id @default(cuid())
  chainId         String
  requestorId     String
  status          ContributionStatus // PENDING, APPROVED, REJECTED
  
  // What they want to add
  nodeData        Json?    // ArgumentChainNode data
  edgeData        Json?    // ArgumentChainEdge data
  
  // Review
  reviewerId      String?
  reviewedAt      DateTime?
  reviewNotes     String?
  
  createdAt       DateTime @default(now())
}

enum ContributionStatus {
  PENDING
  APPROVED
  REJECTED
  WITHDRAWN
}
```

#### Pattern B: "Branch & Merge" Model (Git-style)
```
main:     [A] ──→ [B] ──→ [C]
                    │
bob-fork:           └──→ [B'] ──→ [D]
                          │
                    ← merge request →
```

- Users can fork chains to explore alternatives
- Merge conflicts = same node with different edges
- Maintainer reviews and merges branches

#### Pattern C: "Open Contributions" Model
- Anyone in deliberation can add nodes/edges
- No approval required
- Owner can revert/delete
- Activity log shows all changes

### Recommended Approach: Hybrid Suggest & Approve

**Rationale:**
- Preserves chain integrity (owner maintains control)
- Low barrier to contribution (suggest without breaking)
- Supports async collaboration (no realtime needed)
- Aligns with deliberation permission model

**Implementation Sketch:**
```typescript
// API: POST /api/deliberations/[id]/chains/[chainId]/suggest
interface ContributionSuggestion {
  type: "ADD_NODE" | "ADD_EDGE" | "MODIFY_EDGE" | "REMOVE_NODE";
  nodeData?: Partial<ArgumentChainNode>;
  edgeData?: Partial<ArgumentChainEdge>;
  rationale: string; // Why this addition helps the chain
}

// UI: ChainContributionPanel component
// - Shows pending suggestions
// - Allows owner to preview, accept, reject
// - Threaded discussion on each suggestion
```

### Notification Flow
```
1. Bob views Alice's chain in deliberation
2. Bob clicks "Suggest Addition"
3. Bob selects existing argument (or creates new one)
4. Bob proposes edge type + target
5. Alice gets notification: "Bob suggested addition to your chain"
6. Alice reviews in chain view or notification panel
7. Alice accepts/rejects with optional comment
8. Bob notified of decision
```

---

## Ideation Area 2: Thread/List-Based UI for Argument Chains

### The Problem
Not everyone thinks in graphs. The ReactFlow canvas is powerful but:
- Overwhelming for casual viewers
- Doesn't integrate with existing list-based argument views
- Hard to use on mobile

### Concept: "ArgumentChainThread" Component

A linear, scrollable representation of the chain using the narrative export as the structural backbone.

```
┌──────────────────────────────────────────────────────────┐
│ 🔗 Argument Chain: "Carbon Tax Reasoning"                │
│ 7 arguments • 6 connections • Created by Alice          │
│ [📊 View Graph] [📄 Export] [⚙️ Settings]                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ 1️⃣ ROOT PREMISE                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ "Scientific consensus shows climate change is real"│   │
│ │ by @alice • Expert Opinion                         │   │
│ │ 🎯 Confidence: 0.92 • 3 critical questions open   │   │
│ │ [View Full Argument] [Discuss] [Attack]           │   │
│ └────────────────────────────────────────────────────┘   │
│            │                                             │
│            ├── SUPPORTS ──────────────────────┐          │
│            │                                  │          │
│            ▼                                  ▼          │
│ 2️⃣ ENABLING CLAIM                   3️⃣ SUPPORTING DATA │
│ ┌──────────────────────────┐        ┌──────────────────┐│
│ │ "CO2 is primary driver"  │        │ "Temp data 1880-"││
│ │ by @bob • Causal         │        │ by @carol • Sign ││
│ │ [View] [Discuss]         │        │ [View] [Discuss] ││
│ └──────────────────────────┘        └──────────────────┘│
│            │                                             │
│            ├── ENABLES PREMISE ───────────────────────── │
│            ▼                                             │
│ 4️⃣ INTERMEDIATE CONCLUSION                               │
│ ┌────────────────────────────────────────────────────┐   │
│ │ "Human activity causes warming"                    │   │
│ │ by @dave • Practical Reasoning                     │   │
│ │ ⚠️ Undercut by 1 argument (see below)              │   │
│ └────────────────────────────────────────────────────┘   │
│            │                                             │
│   ┌────────┴───────────────────────────────────────┐    │
│   │ ⚔️ UNDERCUT: @eve challenges inference          │    │
│   │ "Correlation ≠ causation without mechanism"    │    │
│   │ [View Attack] [Respond]                        │    │
│   └────────────────────────────────────────────────┘    │
│            │                                             │
│            ▼                                             │
│ 5️⃣ FINAL CONCLUSION                                      │
│ ┌────────────────────────────────────────────────────┐   │
│ │ "Therefore, carbon tax policy is justified"        │   │
│ │ by @alice • Practical Reasoning                    │   │
│ │ 📊 Chain Strength: 0.78 (weakest: node 4)         │   │
│ └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### Integration with AIFArgumentsListPro

**Option A: Inline Chain Preview**
```tsx
// In AIFArgumentsListPro row, show chain participation
<AifRow>
  <ArgumentContent {...} />
  {argument.chainParticipation?.length > 0 && (
    <ChainParticipationBadges chains={argument.chainParticipation} />
  )}
</AifRow>

// Clicking badge expands inline chain preview
<ChainParticipationBadges>
  <Badge onClick={expandChain}>
    🔗 Part of "Carbon Tax Chain" (node 3/7)
  </Badge>
</ChainParticipationBadges>
```

**Option B: Chain Filter Mode**
```tsx
// Filter to show only arguments in a specific chain
<AIFArgumentsListPro
  chainFilter={selectedChainId}
  showChainContext={true} // Shows connecting edges
/>

// When filtered, arguments render with chain context:
// "This argument SUPPORTS the next argument in chain..."
```

**Option C: Chain Overlay Tab**
```tsx
// New tab in deliberation view alongside Arguments, Dialogue, etc.
<Tabs>
  <Tab>Arguments</Tab>
  <Tab>Chains ({chainCount})</Tab>  {/* ← NEW */}
  <Tab>Dialogue</Tab>
</Tabs>

// Chains tab shows list of chains with expandable thread view
```

### Data Requirements

```typescript
// Extend AifRow to include chain context
interface AifRowWithChainContext extends AifRow {
  chainParticipation: Array<{
    chainId: string;
    chainName: string;
    nodeId: string;
    role: ChainNodeRole;
    position: number; // Order in chain
    totalNodes: number;
    incomingEdges: Array<{
      fromArgumentId: string;
      fromArgumentSnippet: string;
      edgeType: ArgumentChainEdgeType;
    }>;
    outgoingEdges: Array<{
      toArgumentId: string;
      toArgumentSnippet: string;
      edgeType: ArgumentChainEdgeType;
    }>;
  }>;
}
```

### Component Architecture

```
ArgumentChainThread.tsx
├── ChainThreadHeader (name, stats, actions)
├── ChainThreadBody
│   ├── ThreadNode (for each node)
│   │   ├── ArgumentPreviewCard (compact argument display)
│   │   ├── EdgeConnector (visual line + label)
│   │   └── AttackOverlay (if node/edge is attacked)
│   └── ThreadBranch (for convergent/divergent chains)
└── ChainThreadFooter (analysis summary, export options)
```

---

## Ideation Area 3: Linear Interface for Chain JSON Construction

### The Problem
The ReactFlow canvas requires spatial thinking. Some users prefer:
- Form-based construction
- Step-by-step wizards
- Keyboard-driven workflows

### Concept: "ChainBuilder Wizard"

A linear, form-based tool that outputs valid JSON for import into ReactFlow.

```
┌──────────────────────────────────────────────────────────┐
│ 🏗️ Argument Chain Builder                                │
│ Step 2 of 4: Add Second Argument                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ── Current Chain ──────────────────────────────────────  │
│ 1. "Climate change is real" (Root)                      │
│    ↓ [SUPPORTS]                                         │
│ 2. ← You are here                                       │
│                                                          │
│ ── Add Argument ───────────────────────────────────────  │
│                                                          │
│ Select from deliberation:                               │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 🔍 Search arguments...                             │  │
│ │                                                    │  │
│ │ ○ "CO2 levels are rising" - @bob                  │  │
│ │ ○ "Temperature data shows trends" - @carol        │  │
│ │ ● "Human activity is the cause" - @dave ✓         │  │
│ │ ○ "Mitigation is possible" - @eve                 │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ Connection to previous:                                 │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Edge Type: [SUPPORTS ▼]                           │  │
│ │ Strength:  [●●●●○] 0.8                            │  │
│ │ Description: (optional)                           │  │
│ │ ┌──────────────────────────────────────────────┐  │  │
│ │ │ Premise X of argument 2 relies on...        │  │  │
│ │ └──────────────────────────────────────────────┘  │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│                    [← Back] [Add & Continue →]          │
└──────────────────────────────────────────────────────────┘
```

### Wizard Steps

1. **Initialize Chain**
   - Name, description, purpose
   - Chain type hint (serial, convergent, divergent)
   - Select root argument(s)

2. **Build Structure** (repeatable)
   - Select next argument
   - Define edge to existing node
   - Set role, strength, slot mapping

3. **Review & Validate**
   - Preview as thread view
   - Run analysis (find disconnected nodes, weak links)
   - AI suggestions for missing connections

4. **Export / Create**
   - Option 1: Create chain in database
   - Option 2: Export JSON for later import
   - Option 3: Copy as ReactFlow JSON

### JSON Export Format

```typescript
interface ChainBuilderExport {
  version: "1.0";
  metadata: {
    name: string;
    description?: string;
    chainType: ArgumentChainType;
    exportedAt: string;
    deliberationId: string;
  };
  nodes: Array<{
    tempId: string; // Local reference
    argumentId: string; // Real argument ID
    role: ChainNodeRole;
    order: number;
  }>;
  edges: Array<{
    source: string; // tempId reference
    target: string; // tempId reference
    type: ArgumentChainEdgeType;
    strength: number;
    description?: string;
    slotMapping?: Record<string, string>;
  }>;
}
```

### Import API

```typescript
// POST /api/deliberations/[id]/chains/import
interface ImportChainRequest {
  json: ChainBuilderExport;
  layoutPreference: "auto" | "dagre-tb" | "dagre-lr" | "manual";
}

// Response includes created chain with real IDs
interface ImportChainResponse {
  chainId: string;
  nodeIdMap: Record<string, string>; // tempId → realId
  edgeIds: string[];
}
```

### Alternative: "Chain from Selection"

Quick action from `AIFArgumentsListPro`:

```
1. User multi-selects arguments in list (checkbox mode)
2. Clicks "Create Chain from Selection"
3. Modal opens with linear edge definition:
   
   ┌─────────────────────────────────────────┐
   │ Define connections for 4 selected args │
   ├─────────────────────────────────────────┤
   │                                         │
   │ 1. "Climate change is real"            │
   │    ↓ Connection: [SUPPORTS ▼] [0.9]    │
   │                                         │
   │ 2. "CO2 is primary driver"             │
   │    ↓ Connection: [ENABLES_PREMISE ▼]   │
   │                                         │
   │ 3. "Human activity causes it"          │
   │    ↓ Connection: [LEADS_TO ▼] [0.85]   │
   │                                         │
   │ 4. "Carbon tax is justified"           │
   │                                         │
   │ [Preview Graph] [Create Chain]         │
   └─────────────────────────────────────────┘
```

---

## Ideation Area 4: SchemeNet ↔ ArgumentChain Integration

### The Conceptual Relationship

```
HIERARCHY:

Deliberation
└── ArgumentChain (inter-argument structure)
    └── ArgumentChainNode (wrapper)
        └── Argument
            └── SchemeNet (intra-argument structure)
                └── SchemeNetStep (one scheme in sequence)
                    └── ArgumentScheme (scheme definition)
```

**Key Insight:**
- **SchemeNet** = How ONE argument is internally constructed (scheme composition)
- **ArgumentChain** = How MULTIPLE arguments connect (argument composition)

### Integration Opportunities

#### A. SchemeNet-Aware Chain Analysis

Current chain analysis ignores internal argument structure. Enhancement:

```typescript
interface EnhancedChainAnalysis extends ChainAnalysis {
  schemeNetAnalysis: {
    // Per-node scheme net info
    nodeSchemeNets: Array<{
      nodeId: string;
      hasSchemeNet: boolean;
      schemeCount: number;
      weakestStepConfidence: number;
      schemes: string[];
    }>;
    
    // Cross-node scheme patterns
    schemeFlow: Array<{
      edgeId: string;
      sourceSchemes: string[];
      targetSchemes: string[];
      schemeAlignment: "compatible" | "tension" | "neutral";
      // e.g., "Expert Opinion → Causal" = compatible
      // "Ad Hominem → Expert Opinion" = tension
    }>;
    
    // Aggregate insights
    dominantSchemes: Array<{ scheme: string; count: number }>;
    schemeGaps: string[]; // Suggested schemes to strengthen
  };
}
```

#### B. Scheme-Based Edge Suggestions

Use SchemeNet structure to suggest connections:

```typescript
// If source argument uses "Causal Reasoning" and target uses "Sign Evidence"
// Suggest: "The sign evidence could serve as an EFFECT_EVIDENCE for the causal claim"

interface EdgeSuggestion {
  sourceNodeId: string;
  targetNodeId: string;
  suggestedEdgeType: ArgumentChainEdgeType;
  confidence: number;
  rationale: string; // Based on scheme compatibility
  slotMappingHint?: Record<string, string>;
}
```

#### C. SchemeNet Viewer in Chain Node

Expand ArgumentChainNode to show SchemeNet:

```tsx
// In ArgumentChainNode.tsx
{argument.schemeNet && (
  <Collapsible>
    <CollapsibleTrigger>
      📐 View Internal Structure ({argument.schemeNet.steps.length} steps)
    </CollapsibleTrigger>
    <CollapsibleContent>
      <SchemeNetMiniVisualization 
        net={argument.schemeNet}
        compact={true}
      />
    </CollapsibleContent>
  </Collapsible>
)}
```

#### D. "Explode" SchemeNet into Chain

Allow converting a complex SchemeNet argument into an ArgumentChain:

```
Before (Single Argument with 4-step SchemeNet):
┌────────────────────────────────────────┐
│ Argument: "Carbon tax is justified"   │
│ SchemeNet:                            │
│   Step 1: Expert Opinion              │
│   Step 2: Causal Reasoning            │
│   Step 3: Sign Evidence               │
│   Step 4: Practical Reasoning         │
└────────────────────────────────────────┘

After "Explode" (ArgumentChain with 4 nodes):
[Expert Claim] → [Causal Link] → [Evidence] → [Conclusion]

Each node becomes a new "sub-argument" derived from the original.
```

**Use Case:** When an argument is too complex and would benefit from collaborative refinement of each step.

#### E. "Collapse" Chain into SchemeNet

Inverse operation: convert a linear ArgumentChain into a single argument with SchemeNet:

```
Before (4-node ArgumentChain):
[Premise A] → [Premise B] → [Link C] → [Conclusion D]

After "Collapse" (Single Argument):
┌────────────────────────────────────────┐
│ Argument: "Synthesized Conclusion"    │
│ SchemeNet:                            │
│   Step 1: A's scheme                  │
│   Step 2: B's scheme                  │
│   Step 3: C's scheme                  │
│   Step 4: D's scheme                  │
│ Text: Auto-generated synthesis        │
└────────────────────────────────────────┘
```

**Use Case:** When a collaborative chain has reached consensus and should be "published" as a single coherent argument.

---

## Cross-Cutting Concerns

### Permissions Model

```typescript
interface ChainPermissions {
  // Viewing
  canView: boolean; // Based on deliberation access + chain.isPublic
  
  // Editing
  canEdit: boolean; // chain.createdBy === userId || chain.isEditable
  canAddNodes: boolean;
  canRemoveNodes: boolean;
  canModifyEdges: boolean;
  
  // Collaboration
  canSuggestAdditions: boolean; // Any deliberation member
  canApproveSuggestions: boolean; // chain.createdBy only
  
  // Admin
  canDeleteChain: boolean; // chain.createdBy || deliberation.createdBy
  canTransferOwnership: boolean;
}
```

### Activity Logging

```typescript
model ChainActivity {
  id          String   @id @default(cuid())
  chainId     String
  userId      String
  action      ChainActionType
  details     Json     // Action-specific data
  createdAt   DateTime @default(now())
}

enum ChainActionType {
  CHAIN_CREATED
  NODE_ADDED
  NODE_REMOVED
  EDGE_ADDED
  EDGE_MODIFIED
  EDGE_REMOVED
  SUGGESTION_MADE
  SUGGESTION_ACCEPTED
  SUGGESTION_REJECTED
  CHAIN_EXPORTED
  CHAIN_FORKED
}
```

### Analytics / Insights

```typescript
interface ChainInsights {
  participation: {
    uniqueContributors: number;
    contributorBreakdown: Array<{ userId: string; nodeCount: number }>;
  };
  evolution: {
    createdAt: Date;
    lastModified: Date;
    totalEdits: number;
    growthRate: number; // nodes per day
  };
  engagement: {
    viewCount: number;
    discussionCount: number;
    forkCount: number;
    exportCount: number;
  };
}
```

---

## Implementation Prioritization

### Phase 1: Thread/List-Based UI (Ideation Area 2)
1. `ArgumentChainThread` component
2. Chain context in `AIFArgumentsListPro`
3. Chains tab in deliberation view

### Phase 2: Linear Chain Construction (Ideation Area 3)
1. `ChainBuilderWizard` component
2. "Create Chain from Selection" action
3. JSON import/export API

### Phase 3: SchemeNet Integration (Ideation Area 4)
1. SchemeNet-aware analysis
2. SchemeNet viewer in chain nodes
3. Explode/Collapse operations

### Phase 4: Collaborative Construction (Ideation Area 1)
1. `ChainContributionRequest` model
2. Suggest & Approve workflow
3. Notifications integration

---

## Decisions on Open Questions

| Question | Decision | Rationale |
|----------|----------|-----------|
| **Graph ↔ Thread Sync** | Async update on reload | Will improve over time with realtime/workers/cron |
| **Mobile Experience** | Defer | Desktop is primary target for now |
| **AI Assistance** | Defer | Advanced AI features not in scope |
| **Version History** | Activity log sufficient | No git-like versioning needed |
| **Cross-Deliberation Chains** | Defer | Will integrate via Plexus system later |
| **Nested Chains** | Defer | Will incorporate via Thesis Builder feature later |

---

## Development Roadmap

### Phase 1: Thread/List-Based UI (~18 hours)

**Goal**: Make argument chains visible and navigable without requiring graph view.

#### Week 1, Tasks 1.1–1.3: Core Thread Component

| Task | Description | Files | Hours | Status |
|------|-------------|-------|-------|--------|
| **1.1** | Create `ArgumentChainThread` component shell | `components/chains/ArgumentChainThread.tsx` | 2h | ✅ Complete |
| **1.2** | Implement `ChainThreadHeader` (name, stats, actions) | `components/chains/ChainThreadHeader.tsx` | 2h | ✅ Complete |
| **1.3** | Implement `ThreadNode` (argument preview + edge connector) | `components/chains/ThreadNode.tsx` | 3h | ✅ Complete |

#### Week 1, Tasks 1.4–1.6: Data & Integration

| Task | Description | Files | Hours | Status |
|------|-------------|-------|-------|--------|
| **1.4** | Create `chainToThread()` utility (topological sort → linear) | `lib/chains/chainToThread.ts` | 2h | ✅ Complete |
| **1.5** | Add `/api/arguments/[id]/chains` endpoint (chain membership) | `app/api/arguments/[id]/chains/route.ts` | 2h | ✅ Complete |
| **1.6** | Add `ChainParticipationBadge` to `AIFArgumentsListPro` | `components/chains/ChainParticipationBadge.tsx`, `components/arguments/AIFArgumentsListPro.tsx` | 3h | ✅ Complete |

#### Week 2, Tasks 1.7–1.9: Deliberation Integration

| Task | Description | Files | Hours | Status |
|------|-------------|-------|-------|--------|
| **1.7** | Add "Chains" tab to deliberation view | `components/deliberations/DeliberationTabs.tsx` | 2h | |
| **1.8** | Create `ChainListPanel` (list of chains with expand) | `components/chains/ChainListPanel.tsx` | 2h | |
| **1.9** | Handle attack overlays in thread view | `components/chains/ThreadAttackOverlay.tsx` | 2h | |

**Phase 1 Deliverables:**
- [x] Users can view any chain as a scrollable thread (Tasks 1.1–1.4)
- [x] Arguments in list view show chain participation badges (Tasks 1.5–1.6)
- [ ] Deliberation has dedicated "Chains" tab (Tasks 1.7–1.9)

---

### Phase 2: Linear Chain Construction (~22 hours)

**Goal**: Enable form-based chain building without spatial/graph thinking.

#### Week 3, Tasks 2.1–2.3: Wizard Foundation

| Task | Description | Files | Hours |
|------|-------------|-------|-------|
| **2.1** | Create `ChainBuilderWizard` shell with step navigation | `components/chains/ChainBuilderWizard.tsx` | 3h |
| **2.2** | Implement Step 1: Initialize (name, type, root selection) | `components/chains/wizard/InitializeStep.tsx` | 3h |
| **2.3** | Implement Step 2: Build (argument search, edge definition) | `components/chains/wizard/BuildStep.tsx` | 4h |

#### Week 3, Tasks 2.4–2.6: Review & Export

| Task | Description | Files | Hours |
|------|-------------|-------|-------|
| **2.4** | Implement Step 3: Review (thread preview, validation) | `components/chains/wizard/ReviewStep.tsx` | 3h |
| **2.5** | Implement Step 4: Export (create/export/copy JSON) | `components/chains/wizard/ExportStep.tsx` | 2h |
| **2.6** | Create `ChainBuilderExport` type + JSON generation | `lib/chains/chainBuilderExport.ts` | 2h |

#### Week 4, Tasks 2.7–2.9: Quick Actions & Import

| Task | Description | Files | Hours |
|------|-------------|-------|-------|
| **2.7** | Add multi-select mode to `AIFArgumentsListPro` | `components/arguments/AIFArgumentsListPro.tsx` | 2h |
| **2.8** | Create "Chain from Selection" modal | `components/chains/ChainFromSelectionModal.tsx` | 3h |
| **2.9** | Add `POST /api/deliberations/[id]/chains/import` endpoint | `app/api/deliberations/[id]/chains/import/route.ts` | 2h |

**Phase 2 Deliverables:**
- [ ] Users can build chains step-by-step via wizard
- [ ] Users can multi-select arguments and create chain in one action
- [ ] JSON import/export fully functional

---

### Phase 3: SchemeNet Integration (~20 hours)

**Goal**: Connect intra-argument (SchemeNet) and inter-argument (Chain) structures.

#### Week 5, Tasks 3.1–3.3: Analysis Enhancement

| Task | Description | Files | Hours |
|------|-------------|-------|-------|
| **3.1** | Extend `ChainAnalysis` with `schemeNetAnalysis` field | `lib/types/argumentChain.ts` | 2h |
| **3.2** | Implement scheme flow analysis (cross-node patterns) | `lib/chains/schemeFlowAnalysis.ts` | 4h |
| **3.3** | Add scheme compatibility scoring | `lib/chains/schemeCompatibility.ts` | 3h |

#### Week 5, Tasks 3.4–3.6: UI Integration

| Task | Description | Files | Hours |
|------|-------------|-------|-------|
| **3.4** | Add SchemeNet mini-viewer to `ArgumentChainNode` | `components/chains/ArgumentChainNode.tsx` | 3h |
| **3.5** | Create `SchemeNetMiniVisualization` component | `components/nets/SchemeNetMiniVisualization.tsx` | 2h |
| **3.6** | Show scheme flow insights in chain analysis panel | `components/chains/ChainAnalysisPanel.tsx` | 2h |

#### Week 6, Tasks 3.7–3.8: Explode/Collapse Operations

| Task | Description | Files | Hours |
|------|-------------|-------|-------|
| **3.7** | Implement "Explode SchemeNet → Chain" operation | `lib/chains/explodeSchemeNet.ts` | 4h |
| **3.8** | Implement "Collapse Chain → SchemeNet" operation | `lib/chains/collapseToSchemeNet.ts` | 4h |

**Phase 3 Deliverables:**
- [ ] Chain analysis shows scheme-level insights
- [ ] Chain nodes can expand to show internal SchemeNet
- [ ] Users can explode/collapse between representations

---

### Phase 4: Collaborative Construction (~28 hours)

**Goal**: Enable multiple users to build chains together asynchronously.

#### Week 7, Tasks 4.1–4.3: Data Model

| Task | Description | Files | Hours |
|------|-------------|-------|-------|
| **4.1** | Add `ChainContributionRequest` model to Prisma | `prisma/schema.prisma` | 2h |
| **4.2** | Add `ChainActivity` model for audit logging | `prisma/schema.prisma` | 1h |
| **4.3** | Run migration, update generated types | `npx prisma db push` | 1h |

#### Week 7, Tasks 4.4–4.6: API Layer

| Task | Description | Files | Hours |
|------|-------------|-------|-------|
| **4.4** | Create `POST /chains/[chainId]/suggest` endpoint | `app/api/.../chains/[chainId]/suggest/route.ts` | 3h |
| **4.5** | Create `GET/PATCH /chains/[chainId]/suggestions` endpoint | `app/api/.../chains/[chainId]/suggestions/route.ts` | 3h |
| **4.6** | Add validation using `chainAnalysisUtils` (cycle detection) | `lib/chains/validateSuggestion.ts` | 2h |

#### Week 8, Tasks 4.7–4.9: UI Components

| Task | Description | Files | Hours |
|------|-------------|-------|-------|
| **4.7** | Create `SuggestAdditionButton` for chain viewer | `components/chains/SuggestAdditionButton.tsx` | 2h |
| **4.8** | Create `ChainContributionPanel` (pending suggestions list) | `components/chains/ChainContributionPanel.tsx` | 4h |
| **4.9** | Create `SuggestionReviewModal` (preview, accept, reject) | `components/chains/SuggestionReviewModal.tsx` | 4h |

#### Week 8, Tasks 4.10–4.12: Notifications & Polish

| Task | Description | Files | Hours |
|------|-------------|-------|-------|
| **4.10** | Integrate with notification system | `lib/notifications/chainNotifications.ts` | 3h |
| **4.11** | Add activity logging on all chain mutations | `lib/chains/logChainActivity.ts` | 2h |
| **4.12** | Add permission checks (`ChainPermissions` interface) | `lib/chains/chainPermissions.ts` | 3h |

**Phase 4 Deliverables:**
- [ ] Users can suggest additions to chains they don't own
- [ ] Chain owners see pending suggestions and can approve/reject
- [ ] Full activity log for audit trail
- [ ] Notifications for suggestion lifecycle

---

## Summary

| Phase | Focus | Hours | Weeks |
|-------|-------|-------|-------|
| **Phase 1** | Thread/List UI | 18h | 1.5 |
| **Phase 2** | Linear Construction | 22h | 1.5 |
| **Phase 3** | SchemeNet Integration | 20h | 1.5 |
| **Phase 4** | Collaboration | 28h | 2 |
| **Total** | | **88h** | **~6.5 weeks** |

---

## Next Steps

- [x] Finalize implementation order ✓
- [x] Resolve open questions ✓
- [ ] Begin Phase 1, Task 1.1: `ArgumentChainThread` component
- [ ] Set up feature branch: `feature/argument-chain-first-class`
