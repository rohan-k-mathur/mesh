# Making Argument Chains a First-Class Component: Brainstorming & Ideation

**Date**: December 7, 2025  
**Status**: Ideation/Brainstorming  
**Related**: `LUDICS_ENHANCED_ALIGNMENT_ROADMAP.md`, ArgumentChain Phases 1-5, SchemeNet Implementation

---

## Executive Summary

This document explores four key enhancement areas for elevating argument chains from specialized graph tools to first-class deliberation primitives:

1. **Collaborative chain construction** (non-realtime)
2. **Thread-based UI integration** (narrative/JSON export → list views)
3. **Linear chain builder** (simplified JSON construction for import)
4. **SchemeNet ↔ ArgumentChain unification** (proof nets relationship)

---

## 1. Collaborative Argument Chain Construction (Non-Realtime)

### Problem Statement
Currently, argument chains are single-author constructs. Users cannot collaboratively build or refine chains without complex real-time synchronization infrastructure.

### Proposed Solution: Asynchronous Contribution Model

#### 1.1 Core Concept: "Chain Proposals"

Rather than real-time editing, introduce a **proposal-review workflow** for chain contributions:

```typescript
// New model: ChainProposal
model ChainProposal {
  id              String   @id @default(cuid())
  chainId         String
  proposedBy      String   // userId
  proposalType    String   // "ADD_NODE" | "ADD_EDGE" | "MODIFY_NODE" | "REMOVE_NODE" | "RESTRUCTURE"
  status          String   @default("pending") // pending | approved | rejected | superseded
  
  // The proposed changes (JSON)
  proposedChanges Json
  
  // Context for reviewers
  justification   String?
  sourceArgIds    String[] // Related arguments supporting this proposal
  
  // Review trail
  reviewedBy      String?
  reviewedAt      DateTime?
  reviewNotes     String?
  
  chain           ArgumentChain @relation(...)
  createdAt       DateTime @default(now())
}
```

#### 1.2 Workflow: Collaborative Building

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CHAIN COLLABORATION WORKFLOW                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐        │
│  │  CONTRIBUTOR │────▶│  PROPOSAL    │────▶│   REVIEW     │        │
│  │  Views Chain │     │  Creates     │     │   Queue      │        │
│  └──────────────┘     │  Proposal    │     └──────────────┘        │
│         │             └──────────────┘            │                 │
│         │                                         ▼                 │
│         │             ┌──────────────┐     ┌──────────────┐        │
│         │             │   MERGED     │◀────│  OWNER/TEAM  │        │
│         └────────────▶│   CHAIN      │     │  Approves    │        │
│                       └──────────────┘     └──────────────┘        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### 1.3 UI Components for Collaboration

**A. ProposalDiffViewer Component**
```typescript
interface ProposalDiffViewerProps {
  chainId: string;
  proposalId: string;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onModify: (modifications: ChainModification) => void;
}

// Show side-by-side: current chain vs proposed state
// Highlight: added nodes (green), removed (red), modified (yellow)
// Visual diff overlay on ReactFlow canvas
```

**B. ChainContributionPanel**
```typescript
interface ChainContributionPanelProps {
  chainId: string;
  mode: "viewer" | "contributor" | "owner";
  onPropose: (proposal: ChainProposalData) => void;
}

// Floating panel that appears when viewing chains you don't own
// "Suggest Addition" → opens node picker from deliberation arguments
// "Suggest Connection" → draws temporary edge, prompts for type
// "Suggest Restructure" → fork chain into draft mode
```

**C. ProposalInbox for Chain Owners**
```typescript
// Dashboard showing pending proposals across all owned chains
// Sort by: chain, date, contributor, proposal type
// Bulk actions: approve all from trusted contributor, etc.
```

#### 1.4 Proof Net Connection (Ludics Alignment)

From ludics theory, **proof nets** represent completed proofs without the sequential ordering of derivations. This maps to collaborative chains:

- **Individual contribution** = partial proof (visitable path fragment)
- **Merged chain** = complete proof net (orthogonal designs converging)
- **Proposal review** = checking proof net correctness (no vicious cycles)

**Implementation insight**: Use `lib/utils/chainAnalysisUtils.ts` cycle detection to validate proposals before merge.

```typescript
// In proposal validation:
import { detectCycles } from "@/lib/utils/chainAnalysisUtils";

function validateProposal(chain: ArgumentChainWithRelations, proposal: ChainProposal): ValidationResult {
  // Apply proposed changes to virtual chain copy
  const virtualChain = applyProposalVirtually(chain, proposal);
  
  // Check for introduced cycles
  const cycles = detectCycles(virtualChain.nodes, virtualChain.edges);
  if (cycles.length > 0) {
    return { 
      valid: false, 
      error: "Proposal introduces circular dependency",
      cycles 
    };
  }
  
  // Check orthogonality (does this integrate meaningfully?)
  const orthogonality = calculateOrthogonalityScore(chain, proposal.proposedChanges);
  
  return { valid: true, orthogonalityScore: orthogonality };
}
```

#### 1.5 Estimated Effort

| Task | Hours | Dependencies |
|------|-------|--------------|
| ChainProposal model + API | 6h | Prisma schema |
| ProposalDiffViewer component | 8h | ReactFlow |
| ChainContributionPanel | 4h | Existing AddNodeButton |
| ProposalInbox dashboard | 6h | SWR pagination |
| Validation utilities | 4h | chainAnalysisUtils |
| **Total** | **28h** | |

---

## 2. Thread-Based UI for Argument Chains in List Views

### Problem Statement
`AIFArgumentsListPro` displays individual arguments. How do we surface **argument chains** in this flat list view without losing the linear/sequential nature that makes chains useful?

### Proposed Solution: Chain Thread Expansion

#### 2.1 Core Concept: "Threaded Chain Cards"

Transform the narrative export into an interactive thread representation:

```
┌──────────────────────────────────────────────────────────────────────┐
│  AIFArgumentsListPro (existing list view)                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ ArgumentCard: "Climate change requires immediate action"       │  │
│  │ ├── Scheme: Practical Reasoning | CQs: 3/5                    │  │
│  │ ├── Part of Chain: [Policy Analysis Chain ▼]                  │◀──── NEW: Chain indicator
│  │ └── [Expand Thread View]                                       │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ ══ CHAIN THREAD: "Policy Analysis Chain" ══                    │  │
│  │                                                                 │  │
│  │  1. ┌─ Root: "Scientific consensus shows warming trends" ────┐ │  │
│  │     │  Scheme: Expert Opinion | Supports ↓                    │ │  │
│  │  2. ├─ "Rising temperatures cause extreme weather" ──────────┤ │  │
│  │     │  Scheme: Causal | Supports ↓                            │ │  │
│  │  3. ├─ "Extreme weather harms economies" ────────────────────┤ │  │
│  │     │  Scheme: Cause-Effect | Enables ↓                       │ │  │
│  │  4. └─ "Climate change requires immediate action" ★ current   │ │  │
│  │                                                                 │  │
│  │  [View Full Graph] [Copy Narrative] [Collapse]                 │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ ArgumentCard: (next argument in list...)                       │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

#### 2.2 Data Flow: Narrative Export → Thread Component

Leverage the existing `narrativeGenerator.ts` to create a structured thread:

```typescript
// New type for thread display
interface ChainThreadItem {
  nodeId: string;
  argumentId: string;
  position: number;
  conclusionText: string;
  schemeKey?: string;
  schemeName?: string;
  
  // Connection to next
  edgeToNext?: {
    type: "SUPPORTS" | "ENABLES" | "PRESUPPOSES" | "ATTACKS";
    strength: number;
    label?: string;
  };
  
  // Flags
  isCurrent: boolean;  // Is this the argument user clicked from?
  isRoot: boolean;
  isLeaf: boolean;
}

// Generate thread from chain JSON
function chainToThread(
  chain: ArgumentChainWithRelations,
  currentArgumentId?: string
): ChainThreadItem[] {
  // 1. Topological sort nodes
  const sorted = topologicalSortChain(chain.nodes, chain.edges);
  
  // 2. Map to thread items
  return sorted.map((node, idx) => {
    const nextEdge = chain.edges.find(e => e.sourceNodeId === node.id);
    return {
      nodeId: node.id,
      argumentId: node.argument.id,
      position: idx + 1,
      conclusionText: node.argument.text || node.argument.conclusion,
      schemeKey: node.argument.argumentSchemes?.[0]?.scheme?.key,
      schemeName: node.argument.argumentSchemes?.[0]?.scheme?.name,
      edgeToNext: nextEdge ? {
        type: nextEdge.edgeType,
        strength: nextEdge.strength,
        label: nextEdge.description,
      } : undefined,
      isCurrent: node.argument.id === currentArgumentId,
      isRoot: !chain.edges.some(e => e.targetNodeId === node.id),
      isLeaf: !chain.edges.some(e => e.sourceNodeId === node.id),
    };
  });
}
```

#### 2.3 Component: ChainThreadView

```typescript
// components/chains/ChainThreadView.tsx

interface ChainThreadViewProps {
  chainId: string;
  currentArgumentId?: string;
  collapsed?: boolean;
  onArgumentClick?: (argumentId: string) => void;
  onExpandGraph?: () => void;
}

export function ChainThreadView({
  chainId,
  currentArgumentId,
  collapsed = true,
  onArgumentClick,
  onExpandGraph,
}: ChainThreadViewProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsed);
  const [thread, setThread] = useState<ChainThreadItem[]>([]);
  
  // Fetch chain data and convert to thread
  useEffect(() => {
    async function loadThread() {
      const res = await fetch(`/api/argument-chains/${chainId}/nodes`);
      const data = await res.json();
      
      // Transform to thread structure
      const threadItems = chainToThread(data, currentArgumentId);
      setThread(threadItems);
    }
    loadThread();
  }, [chainId, currentArgumentId]);
  
  if (!isExpanded) {
    return (
      <button 
        onClick={() => setIsExpanded(true)}
        className="text-xs text-indigo-600 hover:underline"
      >
        Part of: "{thread[0]?.conclusionText?.slice(0, 30)}..." chain ({thread.length} steps)
      </button>
    );
  }
  
  return (
    <div className="border-l-2 border-indigo-200 pl-3 my-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-indigo-700">Chain Thread</span>
        <div className="flex gap-2">
          <button onClick={onExpandGraph} className="text-xs">View Graph</button>
          <button onClick={() => setIsExpanded(false)} className="text-xs">Collapse</button>
        </div>
      </div>
      
      {thread.map((item, idx) => (
        <div 
          key={item.nodeId}
          className={cn(
            "flex items-start gap-2 text-sm",
            item.isCurrent && "bg-indigo-50 rounded p-1"
          )}
        >
          <span className="text-xs text-gray-500 w-5">{item.position}.</span>
          <div className="flex-1">
            <p 
              className="cursor-pointer hover:text-indigo-600"
              onClick={() => onArgumentClick?.(item.argumentId)}
            >
              {item.conclusionText}
            </p>
            <div className="flex gap-2 text-xs text-gray-500">
              {item.schemeName && <span>{item.schemeName}</span>}
              {item.edgeToNext && (
                <span className="text-indigo-500">
                  {item.edgeToNext.type.toLowerCase()} ↓
                </span>
              )}
            </div>
          </div>
          {item.isCurrent && <span className="text-xs text-indigo-600">★</span>}
        </div>
      ))}
    </div>
  );
}
```

#### 2.4 Integration with AIFArgumentsListPro

Modify `components/arguments/AIFArgumentsListPro.tsx`:

```typescript
// In RowImpl component, after existing metadata display:

// Check if argument belongs to any chains
const { chainMemberships } = useArgumentChainMembership(a.id);

// Render chain indicator if applicable
{chainMemberships.length > 0 && (
  <div className="mt-2 border-t pt-2">
    {chainMemberships.map(chain => (
      <ChainThreadView
        key={chain.id}
        chainId={chain.id}
        currentArgumentId={a.id}
        collapsed={true}
        onArgumentClick={(argId) => {
          // Scroll to argument in list or open detail
        }}
        onExpandGraph={() => {
          // Open chain viewer modal/panel
        }}
      />
    ))}
  </div>
)}
```

#### 2.5 API Enhancement: Chain Membership Query

```typescript
// app/api/arguments/[id]/chains/route.ts

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const argumentId = params.id;
  
  // Find all chains containing this argument
  const memberships = await prisma.argumentChainNode.findMany({
    where: { argumentId },
    include: {
      chain: {
        include: {
          _count: { select: { nodes: true, edges: true } },
          creator: { select: { id: true, name: true } },
        },
      },
    },
  });
  
  return NextResponse.json({
    chains: memberships.map(m => ({
      id: m.chain.id,
      name: m.chain.chainName,
      nodeCount: m.chain._count.nodes,
      edgeCount: m.chain._count.edges,
      role: m.role,
      position: m.nodeOrder,
      creator: m.chain.creator,
    })),
  });
}
```

#### 2.6 Estimated Effort

| Task | Hours | Dependencies |
|------|-------|--------------|
| ChainThreadView component | 6h | - |
| chainToThread utility | 3h | chainAnalysisUtils |
| AIFArgumentsListPro integration | 4h | Existing component |
| Chain membership API | 2h | Prisma |
| Styling and polish | 3h | - |
| **Total** | **18h** | |

---

## 3. Linear Chain Builder: Form-Based JSON Construction

### Problem Statement
The ReactFlow graph interface is powerful but has a learning curve. Users who want to build simple **linear (serial) chains** need a simpler interface.

### Proposed Solution: Step-by-Step Form Builder

#### 3.1 Core Concept: Guided Chain Construction

A wizard-style interface that generates valid JSON for import into ReactFlow:

```
┌──────────────────────────────────────────────────────────────────────┐
│  LINEAR CHAIN BUILDER                                        Step 2/4 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Building: "Economic Impact Analysis"                                │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Step 1 (Root Premise)                                          │  │
│  │ ┌──────────────────────────────────────────────────────────┐   │  │
│  │ │ "Global temperatures have risen 1.1°C since 1850"        │   │  │
│  │ └──────────────────────────────────────────────────────────┘   │  │
│  │ Scheme: [Scientific Evidence ▼]  Role: [PREMISE ▼]            │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                          │                                            │
│                          ▼ Supports                                   │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Step 2 (Current)                                               │  │
│  │ ┌──────────────────────────────────────────────────────────┐   │  │
│  │ │ Select an argument from deliberation...          [Search]│   │  │
│  │ │ ─────────────────────────────────────────────────────── │   │  │
│  │ │ ○ "Rising sea levels threaten coastal cities"           │   │  │
│  │ │ ○ "Extreme weather events increase annually"            │   │  │
│  │ │ ○ "Agricultural yields decline in heat waves"           │   │  │
│  │ └──────────────────────────────────────────────────────────┘   │  │
│  │ Connection type: [SUPPORTS ▼] [ENABLES] [PRESUPPOSES]         │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  [+ Add Another Step]                                                │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Preview (JSON)                                    [Copy]     │    │
│  │ {                                                            │    │
│  │   "chainName": "Economic Impact Analysis",                   │    │
│  │   "chainType": "SERIAL",                                     │    │
│  │   "nodes": [...],                                            │    │
│  │   "edges": [...]                                             │    │
│  │ }                                                            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  [← Back]                              [Preview in Graph] [Create →] │
└──────────────────────────────────────────────────────────────────────┘
```

#### 3.2 Component: LinearChainBuilder

```typescript
// components/chains/LinearChainBuilder.tsx

interface ChainStep {
  id: string;
  argumentId?: string;
  argumentText?: string;
  schemeKey?: string;
  role: "PREMISE" | "INFERENCE" | "CONCLUSION";
  connectionToNext?: "SUPPORTS" | "ENABLES" | "PRESUPPOSES";
}

interface LinearChainBuilderProps {
  deliberationId: string;
  onComplete: (chainJson: ChainExportData) => void;
  onCancel: () => void;
}

export function LinearChainBuilder({
  deliberationId,
  onComplete,
  onCancel,
}: LinearChainBuilderProps) {
  const [chainName, setChainName] = useState("");
  const [steps, setSteps] = useState<ChainStep[]>([
    { id: cuid(), role: "PREMISE" }
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Fetch available arguments
  const { data: arguments } = useSWR(
    `/api/deliberations/${deliberationId}/arguments`,
    fetcher
  );
  
  const addStep = () => {
    setSteps([...steps, { 
      id: cuid(), 
      role: steps.length === 0 ? "PREMISE" : "INFERENCE",
      connectionToNext: "SUPPORTS"
    }]);
    setCurrentStep(steps.length);
  };
  
  const updateStep = (index: number, updates: Partial<ChainStep>) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setSteps(newSteps);
  };
  
  const generateJSON = (): ChainExportData => {
    // Calculate positions for linear layout
    const nodes = steps.map((step, idx) => ({
      id: step.id,
      type: "argumentNode",
      position: { x: 300, y: idx * 200 },
      data: {
        argumentId: step.argumentId,
        role: step.role,
        nodeOrder: idx + 1,
      },
    }));
    
    const edges = steps.slice(0, -1).map((step, idx) => ({
      id: `edge-${idx}`,
      source: step.id,
      target: steps[idx + 1].id,
      type: "chainEdge",
      data: {
        edgeType: step.connectionToNext || "SUPPORTS",
        strength: 1.0,
      },
    }));
    
    return {
      chainName,
      chainType: "SERIAL",
      exportedAt: new Date().toISOString(),
      nodes,
      edges,
    };
  };
  
  const handlePreview = () => {
    const json = generateJSON();
    // Open in a preview modal with ReactFlow rendering
  };
  
  const handleCreate = async () => {
    const json = generateJSON();
    
    // Create chain via API
    const res = await fetch(`/api/deliberations/${deliberationId}/argument-chains`, {
      method: "POST",
      body: JSON.stringify({
        name: chainName,
        chainType: "SERIAL",
        importData: json,
      }),
    });
    
    if (res.ok) {
      const { chain } = await res.json();
      onComplete(chain);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Linear Chain Builder</h2>
        <p className="text-sm text-gray-500">
          Build a step-by-step argument chain without the graph interface
        </p>
      </div>
      
      {/* Chain Name */}
      <div>
        <Label>Chain Name</Label>
        <Input 
          value={chainName}
          onChange={(e) => setChainName(e.target.value)}
          placeholder="e.g., Economic Impact Analysis"
        />
      </div>
      
      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <StepCard
            key={step.id}
            step={step}
            index={idx}
            isLast={idx === steps.length - 1}
            arguments={arguments?.items || []}
            onUpdate={(updates) => updateStep(idx, updates)}
            onRemove={() => {
              setSteps(steps.filter((_, i) => i !== idx));
            }}
          />
        ))}
      </div>
      
      {/* Add Step Button */}
      <Button variant="outline" onClick={addStep}>
        <Plus className="w-4 h-4 mr-2" />
        Add Step
      </Button>
      
      {/* JSON Preview (collapsible) */}
      <Collapsible>
        <CollapsibleTrigger>Preview JSON</CollapsibleTrigger>
        <CollapsibleContent>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
            {JSON.stringify(generateJSON(), null, 2)}
          </pre>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>Preview Graph</Button>
          <Button onClick={handleCreate} disabled={steps.length < 2 || !chainName}>
            Create Chain
          </Button>
        </div>
      </div>
    </div>
  );
}
```

#### 3.3 StepCard Component

```typescript
interface StepCardProps {
  step: ChainStep;
  index: number;
  isLast: boolean;
  arguments: Array<{ id: string; text: string; conclusionText?: string }>;
  onUpdate: (updates: Partial<ChainStep>) => void;
  onRemove: () => void;
}

function StepCard({ step, index, isLast, arguments, onUpdate, onRemove }: StepCardProps) {
  const [search, setSearch] = useState("");
  
  const filteredArgs = arguments.filter(arg => 
    (arg.text || arg.conclusionText || "").toLowerCase().includes(search.toLowerCase())
  );
  
  return (
    <Card className={cn(
      "p-4",
      index === 0 && "border-green-200 bg-green-50/50", // Root
      isLast && index > 0 && "border-blue-200 bg-blue-50/50", // Conclusion
    )}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Step {index + 1}</Badge>
          <Select 
            value={step.role}
            onValueChange={(v) => onUpdate({ role: v as ChainStep["role"] })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PREMISE">Premise</SelectItem>
              <SelectItem value="INFERENCE">Inference</SelectItem>
              <SelectItem value="CONCLUSION">Conclusion</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {index > 0 && (
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {/* Argument Selection */}
      <div className="space-y-2">
        <Input
          placeholder="Search arguments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        <RadioGroup
          value={step.argumentId || ""}
          onValueChange={(v) => {
            const arg = arguments.find(a => a.id === v);
            onUpdate({ 
              argumentId: v, 
              argumentText: arg?.conclusionText || arg?.text 
            });
          }}
          className="max-h-40 overflow-y-auto"
        >
          {filteredArgs.slice(0, 10).map(arg => (
            <div key={arg.id} className="flex items-start gap-2">
              <RadioGroupItem value={arg.id} />
              <Label className="text-sm">
                {arg.conclusionText || arg.text}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      {/* Connection to next (if not last) */}
      {!isLast && (
        <div className="mt-4 pt-4 border-t">
          <Label>Connection to next step</Label>
          <Select
            value={step.connectionToNext || "SUPPORTS"}
            onValueChange={(v) => onUpdate({ connectionToNext: v as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SUPPORTS">Supports →</SelectItem>
              <SelectItem value="ENABLES">Enables →</SelectItem>
              <SelectItem value="PRESUPPOSES">Presupposes →</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </Card>
  );
}
```

#### 3.4 Import API Enhancement

```typescript
// app/api/deliberations/[id]/argument-chains/route.ts

// Add import capability to POST endpoint
const { name, chainType, importData } = body;

if (importData) {
  // Validate import data structure
  const validated = ChainImportSchema.safeParse(importData);
  if (!validated.success) {
    return NextResponse.json({ error: "Invalid import data" }, { status: 400 });
  }
  
  // Create chain with imported structure
  const chain = await prisma.argumentChain.create({
    data: {
      chainName: name,
      chainType,
      deliberationId: params.id,
      createdBy: userId,
      // ... other fields
    },
  });
  
  // Create nodes from import
  for (const node of importData.nodes) {
    await prisma.argumentChainNode.create({
      data: {
        chainId: chain.id,
        argumentId: node.data.argumentId,
        role: node.data.role,
        nodeOrder: node.data.nodeOrder,
        positionX: node.position.x,
        positionY: node.position.y,
        contributorId: userId,
      },
    });
  }
  
  // Create edges from import
  for (const edge of importData.edges) {
    await prisma.argumentChainEdge.create({
      data: {
        chainId: chain.id,
        sourceNodeId: nodeIdMap[edge.source],
        targetNodeId: nodeIdMap[edge.target],
        edgeType: edge.data.edgeType,
        strength: edge.data.strength,
      },
    });
  }
}
```

#### 3.5 Estimated Effort

| Task | Hours | Dependencies |
|------|-------|--------------|
| LinearChainBuilder component | 8h | - |
| StepCard component | 4h | - |
| Import API enhancement | 4h | Existing API |
| Validation + error handling | 3h | Zod |
| Preview modal integration | 3h | ReactFlow |
| **Total** | **22h** | |

---

## 4. SchemeNet ↔ ArgumentChain Integration

### Problem Statement
Two parallel compositional systems exist:
- **SchemeNet**: Multi-scheme compositions *within* a single argument
- **ArgumentChain**: Multi-argument compositions *across* arguments

These are conceptually related (both are proof structures) but currently disconnected.

### 4.1 Theoretical Relationship: Proof Net Hierarchy

From the research documents, particularly the ludics/proof theory alignment:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PROOF STRUCTURE HIERARCHY                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  LEVEL 3: ArgumentChain                                             │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Cross-argument dependencies (I-node chains)                 │     │
│  │ "Argument A's conclusion enables Argument B's premise"      │     │
│  │ Graph visualization: ReactFlow canvas                       │     │
│  └────────────────────────────────────────────────────────────┘     │
│                          │                                           │
│                          ▼ contains                                  │
│  LEVEL 2: SchemeNet (per-argument)                                  │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Multi-scheme sequential reasoning (S-node chains)           │     │
│  │ "Expert Opinion → Sign Evidence → Causal Mechanism"         │     │
│  │ Visualization: NetGraphWithCQs or badge indicator           │     │
│  └────────────────────────────────────────────────────────────┘     │
│                          │                                           │
│                          ▼ instantiates                              │
│  LEVEL 1: ArgumentScheme (atomic)                                   │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Single scheme: premises → conclusion with CQs               │     │
│  │ "Modus Ponens", "Expert Opinion", "Practical Reasoning"     │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ════════════════════════════════════════════════════════════       │
│  LUDICS MAPPING:                                                     │
│  - ArgumentChain = Interaction between designs (orthogonality)      │
│  - SchemeNet = Sequential composition (visitable path)              │
│  - Scheme = Design address (atomic position)                        │
│  ════════════════════════════════════════════════════════════       │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Integration Strategy: Unified Visualization

#### A. ArgumentChainNode Enhancement for SchemeNet Display

The existing `ArgumentChainNode` shows a badge when the argument has a SchemeNet. Enhance this to allow **drilling down**:

```typescript
// components/chains/ArgumentChainNode.tsx - Enhanced

export function ArgumentChainNode({ data, selected }: NodeProps<ChainNodeData>) {
  const [schemeNetOpen, setSchemeNetOpen] = useState(false);
  
  const hasSchemeNet = data.argument.schemeNet !== null;
  const schemeNetSteps = data.argument.schemeNet?.steps?.length || 0;
  
  return (
    <div className={cn(
      "bg-white border-2 rounded-lg shadow-md p-4",
      "min-w-[280px] max-w-[320px]",
      selected && "ring-2 ring-sky-500",
    )}>
      {/* Header with SchemeNet indicator */}
      <div className="flex items-center justify-between mb-2">
        <Badge variant="outline">{data.role || "ARGUMENT"}</Badge>
        
        {hasSchemeNet && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSchemeNetOpen(true)}
                  className="text-purple-600"
                >
                  <GitBranch className="w-3 h-3 mr-1" />
                  {schemeNetSteps}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Multi-scheme argument ({schemeNetSteps} steps)</p>
                <p className="text-xs text-gray-500">Click to expand</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {/* Conclusion */}
      <p className="text-sm font-medium line-clamp-2">
        {data.argument.conclusion || data.argument.text}
      </p>
      
      {/* SchemeNet inline expansion */}
      {schemeNetOpen && (
        <div className="mt-3 pt-3 border-t border-purple-200">
          <SchemeNetMiniView 
            schemeNet={data.argument.schemeNet}
            onClose={() => setSchemeNetOpen(false)}
          />
        </div>
      )}
      
      {/* Handles */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

#### B. SchemeNetMiniView Component

```typescript
// components/nets/SchemeNetMiniView.tsx

interface SchemeNetMiniViewProps {
  schemeNet: SchemeNetWithSteps;
  onClose: () => void;
}

export function SchemeNetMiniView({ schemeNet, onClose }: SchemeNetMiniViewProps) {
  return (
    <div className="bg-purple-50 rounded p-2 text-xs">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-purple-700">Scheme Chain</span>
        <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
      </div>
      
      <div className="space-y-1">
        {schemeNet.steps.map((step, idx) => (
          <div key={step.id} className="flex items-center gap-2">
            <span className="w-4 text-purple-500">{idx + 1}.</span>
            <span>{step.scheme.name}</span>
            {step.confidence < 1 && (
              <Badge variant="outline" className="text-[9px]">
                {Math.round(step.confidence * 100)}%
              </Badge>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-2 pt-2 border-t border-purple-200">
        <span className="text-purple-600">
          Overall: {Math.round(schemeNet.overallConfidence * 100)}% confidence
        </span>
      </div>
    </div>
  );
}
```

### 4.3 Bidirectional Navigation

#### From SchemeNet → ArgumentChain

When viewing an argument's SchemeNet, show which chains reference this argument:

```typescript
// components/nets/NetDetailView.tsx - Add chain references

export function NetDetailView({ netId, ...props }: NetDetailViewProps) {
  // Existing code...
  
  // Fetch chain memberships
  const { data: chainMemberships } = useSWR(
    net?.argumentId ? `/api/arguments/${net.argumentId}/chains` : null,
    fetcher
  );
  
  return (
    <>
      {/* Existing NetDetailView content */}
      
      {/* Chain references section */}
      {chainMemberships?.chains?.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Part of Argument Chains</h4>
          <div className="space-y-2">
            {chainMemberships.chains.map(chain => (
              <div 
                key={chain.id}
                className="flex items-center justify-between text-xs bg-gray-50 rounded p-2"
              >
                <span>{chain.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openChain(chain.id)}
                >
                  View Chain →
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
```

#### From ArgumentChain → SchemeNet

Already covered in 4.2.A above - clicking the SchemeNet badge opens the mini-view.

### 4.4 Unified Export: Combined Proof Structure

Export both levels together for complete proof reconstruction:

```typescript
// lib/chains/unifiedExporter.ts

interface UnifiedProofExport {
  chain: {
    id: string;
    name: string;
    type: string;
    nodes: ChainNodeExport[];
    edges: ChainEdgeExport[];
  };
  schemeNets: {
    [argumentId: string]: SchemeNetExport;
  };
  metadata: {
    totalSchemes: number;
    chainDepth: number;
    overallConfidence: number;
  };
}

export function exportUnifiedProof(
  chain: ArgumentChainWithRelations
): UnifiedProofExport {
  const schemeNets: { [key: string]: SchemeNetExport } = {};
  let totalSchemes = 0;
  
  // Extract SchemeNets from each node
  for (const node of chain.nodes) {
    if (node.argument.schemeNet) {
      schemeNets[node.argument.id] = {
        steps: node.argument.schemeNet.steps.map(s => ({
          order: s.stepOrder,
          schemeName: s.scheme.name,
          schemeKey: s.scheme.key,
          confidence: s.confidence,
        })),
        overallConfidence: node.argument.schemeNet.overallConfidence,
      };
      totalSchemes += node.argument.schemeNet.steps.length;
    } else if (node.argument.argumentSchemes?.length > 0) {
      // Single scheme - still track
      totalSchemes += 1;
    }
  }
  
  return {
    chain: {
      id: chain.id,
      name: chain.chainName,
      type: chain.chainType,
      nodes: chain.nodes.map(n => ({
        id: n.id,
        argumentId: n.argument.id,
        conclusion: n.argument.conclusion || n.argument.text,
        role: n.role,
        hasSchemeNet: !!n.argument.schemeNet,
        primaryScheme: n.argument.argumentSchemes?.[0]?.scheme?.name || null,
      })),
      edges: chain.edges.map(e => ({
        id: e.id,
        source: e.sourceNodeId,
        target: e.targetNodeId,
        type: e.edgeType,
        strength: e.strength,
      })),
    },
    schemeNets,
    metadata: {
      totalSchemes,
      chainDepth: calculateMaxDepth(chain.nodes, chain.edges),
      overallConfidence: calculateWeightedConfidence(chain, schemeNets),
    },
  };
}
```

### 4.5 Analysis Integration: Combined Metrics

```typescript
// lib/chains/combinedAnalysis.ts

interface CombinedChainAnalysis {
  // Existing chain metrics
  chain: ChainAnalysis;
  
  // SchemeNet aggregates
  schemeNet: {
    nodesWithNets: number;
    nodesWithoutNets: number;
    avgStepsPerNet: number;
    weakestNetConfidence: number;
    totalSchemeInstances: number;
  };
  
  // Combined insights
  combined: {
    proofDepth: number; // Chain depth + avg scheme net depth
    vulnerabilityScore: number; // Based on weakest links at both levels
    completenessScore: number; // % of nodes with proper scheme grounding
  };
}

export function analyzeCombinedProof(
  chain: ArgumentChainWithRelations
): CombinedChainAnalysis {
  // Chain-level analysis
  const chainAnalysis = calculateChainMetrics(chain.nodes, chain.edges);
  
  // SchemeNet aggregates
  let nodesWithNets = 0;
  let totalSteps = 0;
  let minConfidence = 1;
  
  for (const node of chain.nodes) {
    if (node.argument.schemeNet) {
      nodesWithNets++;
      totalSteps += node.argument.schemeNet.steps.length;
      if (node.argument.schemeNet.overallConfidence < minConfidence) {
        minConfidence = node.argument.schemeNet.overallConfidence;
      }
    }
  }
  
  const avgSteps = nodesWithNets > 0 ? totalSteps / nodesWithNets : 0;
  
  return {
    chain: chainAnalysis,
    schemeNet: {
      nodesWithNets,
      nodesWithoutNets: chain.nodes.length - nodesWithNets,
      avgStepsPerNet: avgSteps,
      weakestNetConfidence: minConfidence,
      totalSchemeInstances: totalSteps,
    },
    combined: {
      proofDepth: chainAnalysis.maxDepth + avgSteps,
      vulnerabilityScore: Math.min(
        chainAnalysis.criticalPath?.weakestLink?.strength || 1,
        minConfidence
      ),
      completenessScore: nodesWithNets / chain.nodes.length,
    },
  };
}
```

### 4.6 Estimated Effort

| Task | Hours | Dependencies |
|------|-------|--------------|
| ArgumentChainNode SchemeNet enhancement | 4h | Existing component |
| SchemeNetMiniView component | 3h | - |
| Bidirectional navigation | 4h | API endpoints |
| Unified export function | 4h | - |
| Combined analysis utilities | 5h | chainAnalysisUtils |
| Integration tests | 3h | - |
| **Total** | **23h** | |

---

## Summary: Total Effort & Prioritization

| Feature | Effort | Priority | Dependencies |
|---------|--------|----------|--------------|
| 1. Collaborative Chain Construction | 28h | P2 | Proposal model, diff viewer |
| 2. Thread-Based UI Integration | 18h | P1 | ChainThreadView, API |
| 3. Linear Chain Builder | 22h | P1 | Form components, import API |
| 4. SchemeNet Integration | 23h | P2 | Combined analysis |
| **TOTAL** | **91h** (~2.5 weeks) | | |

### Recommended Sequencing

1. **Week 1**: Linear Chain Builder (3) + Thread UI (2)
   - These provide the most user value with fewest dependencies
   - Linear builder lowers barrier to entry
   - Thread UI makes chains discoverable in existing workflows

2. **Week 2**: SchemeNet Integration (4)
   - Deepens theoretical alignment
   - Unifies the two proof structure systems
   - Enhances analysis capabilities

3. **Week 3**: Collaborative Construction (1)
   - Most complex, builds on previous work
   - Requires proposal model and review workflow
   - Enables team-based chain building

---

## Future Considerations

### Ludics Deep Integration

These features align with the broader ludics roadmap:

1. **Proof Net Correctness**: Use collaboration validation to check orthogonality
2. **Divergence Detection**: Apply to chain proposals that don't integrate
3. **Daimon Semantics**: "Accept chain as-is" vs "Continue building"

### AIF Export Enhancement

The unified SchemeNet + ArgumentChain export could generate full AIF-RDF graphs with both S-nodes (schemes) and I-nodes (claims) properly connected.

### AI-Assisted Building

Future: LLM suggestions for:
- "What argument should come next in this chain?"
- "This step might need a supporting SchemeNet with Expert Opinion + Causal"
- "Potential conflict detected with chain X in this deliberation"

---

*Document prepared for ideation session - December 7, 2025*

