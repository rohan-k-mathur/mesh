# ArgumentChain Phase 3: Analysis & Validation (Research-Enhanced)

**Status:** Ready to implement  
**Duration:** 5-6 days (was 2-3 days before research integration)  
**Prerequisites:** Phase 1 ✅ Complete, Phase 2 ✅ Complete, Research papers analyzed ✅

---

## Overview

Phase 3 adds **computational analysis** to ArgumentChain visual editor, transforming it from a diagram tool into an **argumentation reasoning engine**. This phase integrates insights from three research papers:

1. **Wei & Prakken (2019)** - Argument structure taxonomy for formal classification
2. **Rahwan et al. (2007)** - WWAW strength calculation using support/attack aggregation
3. **Prakken (2012)** - ASPIC+ preference orderings for advanced analysis (Phase 4 prep)

---

## Tasks

### Core Analysis Features (Original Plan)

#### Task 3.1: Critical Path Detection (8 hours)

**Goal:** Identify the strongest reasoning path through the chain.

**Implementation:**

```typescript
// lib/utils/chainAnalysisUtils.ts (NEW FILE)

import { ArgumentChainNode, ArgumentChainEdge } from "@/lib/types/argumentChain";

interface CriticalPath {
  nodeIds: string[];
  totalStrength: number;
  avgStrength: number;
  weakestLink: { nodeId: string; strength: number };
}

/**
 * Find the path with highest cumulative strength from premises to conclusion
 * Uses modified Dijkstra's algorithm with strength as weight
 */
export function findCriticalPath(
  nodes: ArgumentChainNode[],
  edges: ArgumentChainEdge[]
): CriticalPath {
  // Build adjacency list
  const graph = new Map<string, Array<{ target: string; strength: number }>>();
  for (const edge of edges) {
    if (!graph.has(edge.sourceNodeId)) graph.set(edge.sourceNodeId, []);
    graph.get(edge.sourceNodeId)!.push({
      target: edge.targetNodeId,
      strength: edge.strength,
    });
  }

  // Find premise nodes (no incoming edges)
  const premiseNodes = nodes.filter(
    (n) => !edges.some((e) => e.targetNodeId === n.id)
  );

  // Find conclusion nodes (no outgoing edges)
  const conclusionNodes = nodes.filter(
    (n) => !edges.some((e) => e.sourceNodeId === n.id)
  );

  // For each premise → conclusion path, calculate cumulative strength
  let bestPath: CriticalPath | null = null;

  for (const premise of premiseNodes) {
    for (const conclusion of conclusionNodes) {
      const path = findPathWithStrength(premise.id, conclusion.id, graph);
      if (path && (!bestPath || path.totalStrength > bestPath.totalStrength)) {
        bestPath = path;
      }
    }
  }

  return bestPath || { nodeIds: [], totalStrength: 0, avgStrength: 0, weakestLink: { nodeId: "", strength: 0 } };
}

/**
 * DFS to find path with strength tracking
 */
function findPathWithStrength(
  start: string,
  end: string,
  graph: Map<string, Array<{ target: string; strength: number }>>
): CriticalPath | null {
  const visited = new Set<string>();
  const path: string[] = [];
  const strengths: number[] = [];

  function dfs(current: string): boolean {
    visited.add(current);
    path.push(current);

    if (current === end) return true;

    const neighbors = graph.get(current) || [];
    for (const { target, strength } of neighbors) {
      if (!visited.has(target)) {
        strengths.push(strength);
        if (dfs(target)) return true;
        strengths.pop();
      }
    }

    path.pop();
    return false;
  }

  if (!dfs(start)) return null;

  const totalStrength = strengths.reduce((sum, s) => sum + s, 0);
  const avgStrength = strengths.length > 0 ? totalStrength / strengths.length : 0;
  const weakestLink = {
    nodeId: path[strengths.indexOf(Math.min(...strengths))],
    strength: Math.min(...strengths),
  };

  return { nodeIds: path, totalStrength, avgStrength, weakestLink };
}
```

**API Endpoint:**

```typescript
// app/api/argument-chains/[chainId]/analyze/route.ts (NEW FILE)

import { prisma } from "@/lib/db/serverutils";
import { findCriticalPath, detectCycles, calculateChainStrength } from "@/lib/utils/chainAnalysisUtils";

export async function POST(
  req: Request,
  { params }: { params: { chainId: string } }
) {
  const chain = await prisma.argumentChain.findUnique({
    where: { id: params.chainId },
    include: { nodes: true, edges: true },
  });

  if (!chain) {
    return Response.json({ error: "Chain not found" }, { status: 404 });
  }

  const criticalPath = findCriticalPath(chain.nodes, chain.edges);
  const cycles = detectCycles(chain.nodes, chain.edges);
  const strength = calculateChainStrength(chain.nodes, chain.edges);

  return Response.json({
    criticalPath,
    cycles,
    strength,
    suggestions: [], // Task 3.4
  });
}
```

**UI Component:**

```typescript
// components/chains/ChainAnalysisPanel.tsx (NEW FILE)

export function ChainAnalysisPanel({ chainId }: { chainId: string }) {
  const [analysis, setAnalysis] = useState<ChainAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    const res = await fetch(`/api/argument-chains/${chainId}/analyze`, {
      method: "POST",
    });
    const data = await res.json();
    setAnalysis(data);
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chain Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={runAnalysis} disabled={loading}>
          {loading ? "Analyzing..." : "Run Analysis"}
        </Button>

        {analysis && (
          <div className="mt-4 space-y-4">
            {/* Critical Path */}
            <div>
              <h3 className="font-semibold">Critical Path</h3>
              <p className="text-sm text-muted-foreground">
                Strongest reasoning chain (avg strength: {analysis.criticalPath.avgStrength.toFixed(2)})
              </p>
              <div className="flex gap-2 mt-2">
                {analysis.criticalPath.nodeIds.map((nodeId) => (
                  <Badge key={nodeId}>{nodeId}</Badge>
                ))}
              </div>
            </div>

            {/* Cycles Warning */}
            {analysis.cycles.length > 0 && (
              <Alert variant="destructive">
                <AlertTitle>Circular Reasoning Detected</AlertTitle>
                <AlertDescription>
                  {analysis.cycles.length} cycle(s) found. Review highlighted nodes.
                </AlertDescription>
              </Alert>
            )}

            {/* Overall Strength */}
            <div>
              <h3 className="font-semibold">Overall Strength</h3>
              <Progress value={analysis.strength.overallStrength * 100} className="mt-2" />
              <p className="text-sm text-muted-foreground mt-1">
                {(analysis.strength.overallStrength * 100).toFixed(0)}% (weakest link principle)
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Files to create:**
- ✅ `lib/utils/chainAnalysisUtils.ts`
- ✅ `app/api/argument-chains/[chainId]/analyze/route.ts`
- ✅ `components/chains/ChainAnalysisPanel.tsx`

---

#### Task 3.2: Cycle Detection (4 hours)

**Goal:** Detect circular reasoning in GRAPH-type chains.

**Implementation:**

```typescript
// Add to lib/utils/chainAnalysisUtils.ts

interface Cycle {
  nodeIds: string[];
  severity: "warning" | "error"; // warning = weak cycle, error = strong cycle
}

/**
 * Detect cycles using Tarjan's strongly connected components algorithm
 */
export function detectCycles(
  nodes: ArgumentChainNode[],
  edges: ArgumentChainEdge[]
): Cycle[] {
  const graph = buildAdjacencyList(edges);
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycles: Cycle[] = [];

  function dfs(nodeId: string, path: string[]): void {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const { target, strength } of neighbors) {
      if (!visited.has(target)) {
        dfs(target, path);
      } else if (recursionStack.has(target)) {
        // Cycle detected
        const cycleStart = path.indexOf(target);
        const cycleNodes = path.slice(cycleStart);
        
        // Calculate cycle severity based on edge strengths
        const cycleStrength = neighbors
          .filter((n) => cycleNodes.includes(n.target))
          .reduce((sum, n) => sum + n.strength, 0) / cycleNodes.length;

        cycles.push({
          nodeIds: cycleNodes,
          severity: cycleStrength > 0.7 ? "error" : "warning",
        });
      }
    }

    recursionStack.delete(nodeId);
    path.pop();
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  }

  return cycles;
}
```

**UI Update:** Highlight cycle nodes in red on canvas when analysis runs.

---

#### Task 3.3: Chain Strength Calculation (6 hours)

**Goal:** Calculate overall chain strength using **WWAW formula** from research paper.

**Implementation:**

```typescript
// Add to lib/utils/chainAnalysisUtils.ts

interface ChainStrength {
  overallStrength: number;
  nodeStrengths: Map<string, number>;
  vulnerableNodes: string[]; // Nodes with strength < 0.5
  strongNodes: string[];     // Nodes with strength > 0.8
}

/**
 * WWAW Strength Formula: strength(node) = Σ(supports) - Σ(attacks)
 * Reference: Rahwan et al. (2007) - "Towards Large Scale Argumentation Support"
 */
export function calculateChainStrength(
  nodes: ArgumentChainNode[],
  edges: ArgumentChainEdge[]
): ChainStrength {
  const nodeStrengths = new Map<string, number>();

  // Calculate per-node strength
  for (const node of nodes) {
    const incomingEdges = edges.filter((e) => e.targetNodeId === node.id);

    // Support edge types
    const supportStrength = incomingEdges
      .filter((e) => ["SUPPORTS", "ENABLES", "PRESUPPOSES", "EXEMPLIFIES"].includes(e.edgeType))
      .reduce((sum, e) => sum + e.strength, 0);

    // Attack edge types
    const attackStrength = incomingEdges
      .filter((e) => ["REFUTES", "QUALIFIES"].includes(e.edgeType))
      .reduce((sum, e) => sum + e.strength, 0);

    nodeStrengths.set(node.id, supportStrength - attackStrength);
  }

  // Overall chain strength depends on chain type
  const chainStructure = detectChainStructureType(nodes, edges); // Task 3.5
  let overallStrength: number;

  if (chainStructure === "SERIAL") {
    // Weakest link principle for serial chains
    overallStrength = Math.min(...Array.from(nodeStrengths.values()));
  } else if (chainStructure === "CONVERGENT") {
    // Weighted average for convergent structures
    const total = Array.from(nodeStrengths.values()).reduce((a, b) => a + b, 0);
    overallStrength = total / nodes.length;
  } else {
    // Harmonic mean for complex graphs (penalizes weak links)
    const reciprocalSum = Array.from(nodeStrengths.values())
      .map((s) => 1 / (s + 0.01)) // Add 0.01 to avoid division by zero
      .reduce((a, b) => a + b, 0);
    overallStrength = nodes.length / reciprocalSum;
  }

  return {
    overallStrength: Math.max(0, Math.min(1, overallStrength)), // Clamp to [0, 1]
    nodeStrengths,
    vulnerableNodes: nodes.filter((n) => nodeStrengths.get(n.id)! < 0.5).map((n) => n.id),
    strongNodes: nodes.filter((n) => nodeStrengths.get(n.id)! > 0.8).map((n) => n.id),
  };
}
```

**UI Update:** Color nodes by strength in minimap (red = vulnerable, green = strong).

---

#### Task 3.4: AI Suggestions for Missing Arguments (8 hours)

**Goal:** Use OpenAI to suggest arguments that would strengthen the chain.

**Implementation:**

```typescript
// lib/ai/chainSuggestions.ts (NEW FILE)

import { OpenAI } from "openai";
import { ArgumentChain, ChainStrength } from "@/lib/types/argumentChain";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface Suggestion {
  type: "missing_premise" | "missing_support" | "counter_refutation";
  targetNodeId: string;
  suggestedText: string;
  reasoning: string;
  priority: "high" | "medium" | "low";
}

export async function generateChainSuggestions(
  chain: ArgumentChainWithRelations,
  strength: ChainStrength
): Promise<Suggestion[]> {
  const vulnerableNodes = chain.nodes.filter((n) =>
    strength.vulnerableNodes.includes(n.id)
  );

  if (vulnerableNodes.length === 0) {
    return []; // Chain is already strong
  }

  // Build context for GPT
  const chainContext = `
Chain: ${chain.name}
Type: ${chain.chainType}
Arguments:
${chain.nodes.map((n) => `- ${n.argument.title}: ${n.argument.claimText}`).join("\n")}

Weak Points (strength < 0.5):
${vulnerableNodes.map((n) => `- Node ${n.id}: ${n.argument.title}`).join("\n")}
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are an expert in argumentation theory. Analyze argument chains and suggest missing premises, supporting evidence, or rebuttals to attacks.`,
      },
      {
        role: "user",
        content: `${chainContext}\n\nSuggest 3-5 arguments that would strengthen the weak points. Format as JSON array with: { type, targetNodeId, suggestedText, reasoning, priority }`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const suggestions = JSON.parse(response.choices[0].message.content || "{}").suggestions || [];
  return suggestions;
}
```

**API Update:**

```typescript
// In app/api/argument-chains/[chainId]/analyze/route.ts
const suggestions = await generateChainSuggestions(chain, strength);

return Response.json({
  criticalPath,
  cycles,
  strength,
  suggestions, // Now populated
});
```

**UI Component:**

```typescript
// Add to ChainAnalysisPanel.tsx
{analysis.suggestions.length > 0 && (
  <div>
    <h3 className="font-semibold">Suggestions to Strengthen Chain</h3>
    <div className="space-y-2 mt-2">
      {analysis.suggestions.map((s, i) => (
        <Card key={i}>
          <CardContent className="pt-4">
            <Badge variant={s.priority === "high" ? "destructive" : "secondary"}>
              {s.type.replace("_", " ")}
            </Badge>
            <p className="text-sm mt-2">{s.suggestedText}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.reasoning}</p>
            <Button size="sm" className="mt-2">
              Add Argument
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
)}
```

**Files to create:**
- ✅ `lib/ai/chainSuggestions.ts`

---

### Research-Informed Enhancements (NEW)

#### Task 3.5: Wei & Prakken Structure Type Detection (6 hours)

**Goal:** Auto-classify chains into formal structure taxonomy (SCS, SDS, LCS, LDS, MS).

**Research Reference:** Wei & Prakken (2019) - "Argument Structures Taxonomy"

**Implementation:**

```typescript
// Add to lib/utils/chainAnalysisUtils.ts

type StructureType = "SCS" | "SDS" | "LCS" | "LDS" | "MS" | "Unit";

interface StructureAnalysis {
  detectedType: StructureType;
  description: string;
  matchesUserSelection: boolean;
  confidence: number;
}

/**
 * Classify chain structure based on Wei & Prakken (2019) taxonomy
 * 
 * - SCS: Serial Convergent Structure (multiple premises → single conclusion, serial)
 * - SDS: Serial Divergent Structure (single premise → multiple conclusions, serial)
 * - LCS: Linked Convergent Structure (multiple linked premises → single conclusion)
 * - LDS: Linked Divergent Structure (single premise → multiple linked conclusions)
 * - MS: Mixed Structure (combination of patterns)
 * - Unit: Single-inference argument
 */
export function detectChainStructureType(
  nodes: ArgumentChainNode[],
  edges: ArgumentChainEdge[]
): StructureAnalysis {
  // Build degree maps
  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    outDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    inDegree.set(edge.targetNodeId, inDegree.get(edge.targetNodeId)! + 1);
    outDegree.set(edge.sourceNodeId, outDegree.get(edge.sourceNodeId)! + 1);
  }

  // Analyze patterns
  const hasConvergence = Array.from(inDegree.values()).some((deg) => deg > 1);
  const hasDivergence = Array.from(outDegree.values()).some((deg) => deg > 1);
  const hasLinking = checkForLinking(nodes, edges); // Helper function

  // Classify
  let detectedType: StructureType;
  let description: string;

  if (nodes.length === 2 && edges.length === 1) {
    detectedType = "Unit";
    description = "Single-inference argument (one premise, one conclusion)";
  } else if (!hasConvergence && !hasDivergence) {
    detectedType = "SCS";
    description = "Serial chain (linear inference path)";
  } else if (hasConvergence && !hasDivergence) {
    if (hasLinking) {
      detectedType = "LCS";
      description = "Linked convergent (multiple interdependent premises)";
    } else {
      detectedType = "SCS";
      description = "Serial convergent (multiple independent premises)";
    }
  } else if (!hasConvergence && hasDivergence) {
    if (hasLinking) {
      detectedType = "LDS";
      description = "Linked divergent (single premise, interdependent conclusions)";
    } else {
      detectedType = "SDS";
      description = "Serial divergent (single premise, independent conclusions)";
    }
  } else {
    detectedType = "MS";
    description = "Mixed structure (complex graph with multiple patterns)";
  }

  return {
    detectedType,
    description,
    matchesUserSelection: true, // TODO: Compare with chain.chainType
    confidence: 0.95, // Heuristic confidence score
  };
}

function checkForLinking(nodes: ArgumentChainNode[], edges: ArgumentChainEdge[]): boolean {
  // Linking = premises/conclusions reference each other
  // Simplified check: Are there edges between same-level nodes?
  const levels = calculateNodeLevels(nodes, edges);
  for (const edge of edges) {
    if (levels.get(edge.sourceNodeId) === levels.get(edge.targetNodeId)) {
      return true; // Same-level edge = linking
    }
  }
  return false;
}
```

**UI Update:**

```typescript
// Add to ChainMetadataPanel.tsx
const structureAnalysis = detectChainStructureType(nodes, edges);

<div className="space-y-2">
  <Label>Detected Structure</Label>
  <div className="flex items-center gap-2">
    <Badge variant="outline">{structureAnalysis.detectedType}</Badge>
    <span className="text-sm text-muted-foreground">
      {structureAnalysis.description}
    </span>
  </div>
  {!structureAnalysis.matchesUserSelection && (
    <Alert variant="warning">
      <AlertTitle>Structure Mismatch</AlertTitle>
      <AlertDescription>
        Selected type "{chainType}" doesn't match detected structure "{structureAnalysis.detectedType}".
      </AlertDescription>
    </Alert>
  )}
</div>
```

**Files to update:**
- ✅ `lib/utils/chainAnalysisUtils.ts` (add functions)
- ✅ `components/chains/ChainMetadataPanel.tsx` (add UI)

---

#### Task 3.6: SchemeNet Integration Indicators (4 hours)

**Goal:** Show when `ArgumentChainNode` contains multi-scheme argument (SchemeNet).

**Implementation:**

```typescript
// Update ArgumentChainNode.tsx
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ArgumentChainNode: React.FC<ArgumentChainNodeProps> = ({ data, selected }) => {
  const hasSchemeNet = data.argument.schemeNet !== null;
  const schemeNetSteps = data.argument.schemeNet?.steps.length || 0;

  return (
    <div className={`...`}>
      {/* Existing node content */}
      
      {/* NEW: SchemeNet indicator badge */}
      {hasSchemeNet && (
        <div className="absolute -top-2 -right-2 z-10">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="secondary" className="text-[9px] h-5 px-1.5 shadow-sm">
                  🔗 {schemeNetSteps}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <p className="font-semibold">Multi-Scheme Argument</p>
                  <p className="text-muted-foreground">
                    {schemeNetSteps} schemes in chain
                  </p>
                  {data.argument.schemeNet.steps.map((step, i) => (
                    <p key={i} className="text-[10px]">
                      {i + 1}. {step.scheme.name}
                    </p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
};
```

**API Update:**

```typescript
// Extend GET /api/argument-chains/[chainId] to include SchemeNet
const chain = await prisma.argumentChain.findUnique({
  where: { id: params.chainId },
  include: {
    nodes: {
      include: {
        argument: {
          include: {
            schemeNet: {
              include: {
                steps: {
                  include: { scheme: true },
                  orderBy: { stepOrder: "asc" },
                },
              },
            },
          },
        },
      },
    },
    edges: true,
  },
});
```

**Files to update:**
- ✅ `components/chains/ArgumentChainNode.tsx`
- ✅ `app/api/argument-chains/[chainId]/route.ts`

---

#### Task 3.7: WWAW Strength Visualization (6 hours)

**Goal:** Color-code nodes by strength in canvas minimap.

**Implementation:**

```typescript
// Update ArgumentChainCanvas.tsx
import { calculateChainStrength } from "@/lib/utils/chainAnalysisUtils";

const ArgumentChainCanvasInner = ({ chainId, deliberationId }: Props) => {
  const { nodes, edges } = useChainEditorStore();
  const [strengthAnalysis, setStrengthAnalysis] = useState<ChainStrength | null>(null);

  useEffect(() => {
    if (nodes.length > 0) {
      const analysis = calculateChainStrength(nodes, edges);
      setStrengthAnalysis(analysis);
    }
  }, [nodes, edges]);

  // Minimap node color based on strength
  const getNodeColor = (nodeId: string) => {
    if (!strengthAnalysis) return "#e2e8f0"; // gray-200
    const strength = strengthAnalysis.nodeStrengths.get(nodeId) || 0;
    
    if (strength > 0.8) return "#22c55e"; // green-500 (strong)
    if (strength > 0.5) return "#eab308"; // yellow-500 (moderate)
    return "#ef4444"; // red-500 (vulnerable)
  };

  return (
    <ReactFlow ...>
      <MiniMap
        nodeColor={(node) => getNodeColor(node.id)}
        maskColor="rgba(0, 0, 0, 0.2)"
      />
      {/* ... rest of canvas */}
    </ReactFlow>
  );
};
```

**Files to update:**
- ✅ `components/chains/ArgumentChainCanvas.tsx`

---

#### Task 3.8: AIF Export for Chains (6 hours)

**Goal:** Export `ArgumentChain` to AIF JSON-LD for interoperability with WWAW tools.

**Implementation:**

```typescript
// lib/aif/chainExporter.ts (NEW FILE)

import { ArgumentChainWithRelations } from "@/lib/types/argumentChain";
import { AIF_NAMESPACE, MESH_NAMESPACE } from "@/lib/aif/constants";

export function exportChainToJSONLD(chain: ArgumentChainWithRelations) {
  return {
    "@context": {
      "aif": AIF_NAMESPACE,
      "mesh": MESH_NAMESPACE,
      "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
    },
    "@graph": [
      // Chain metadata
      {
        "@id": `http://mesh-platform.io/aif/chains/${chain.id}`,
        "@type": "mesh:ArgumentChain",
        "rdfs:label": chain.name,
        "mesh:chainType": chain.chainType,
        "mesh:isPublic": chain.isPublic,
      },
      // I-nodes (arguments)
      ...chain.nodes.map((node) => ({
        "@id": `http://mesh-platform.io/aif/arguments/${node.argumentId}`,
        "@type": "aif:I-node",
        "aif:text": node.argument.claimText,
        "mesh:nodeRole": node.role,
      })),
      // RA-nodes (edges)
      ...chain.edges.map((edge) => ({
        "@id": `http://mesh-platform.io/aif/edges/${edge.id}`,
        "@type": "aif:RA-node",
        "aif:premise": `http://mesh-platform.io/aif/arguments/${edge.sourceNodeId}`,
        "aif:conclusion": `http://mesh-platform.io/aif/arguments/${edge.targetNodeId}`,
        "mesh:edgeType": edge.edgeType,
        "mesh:strength": edge.strength,
      })),
    ],
  };
}
```

**API Endpoint:**

```typescript
// app/api/argument-chains/[chainId]/aif/route.ts (NEW FILE)

import { exportChainToJSONLD } from "@/lib/aif/chainExporter";

export async function GET(
  req: Request,
  { params }: { params: { chainId: string } }
) {
  const chain = await prisma.argumentChain.findUnique({
    where: { id: params.chainId },
    include: {
      nodes: { include: { argument: true } },
      edges: true,
    },
  });

  if (!chain) {
    return Response.json({ error: "Chain not found" }, { status: 404 });
  }

  const jsonld = exportChainToJSONLD(chain);

  return Response.json(jsonld, {
    headers: { "Content-Type": "application/ld+json" },
  });
}
```

**UI Update:**

```typescript
// Update ChainExportButton.tsx
const handleExportAIF = async () => {
  const response = await fetch(`/api/argument-chains/${chainId}/aif`);
  const jsonld = await response.json();
  downloadJSON(jsonld, `${chainName}-aif.jsonld`);
};

<DropdownMenuItem onClick={handleExportAIF}>
  <FileJson className="mr-2 h-4 w-4" />
  Export to AIF (JSON-LD)
</DropdownMenuItem>
```

**Files to create:**
- ✅ `lib/aif/chainExporter.ts`
- ✅ `app/api/argument-chains/[chainId]/aif/route.ts`

**Files to update:**
- ✅ `components/chains/ChainExportButton.tsx`

---

## File Summary

### New Files (11)

1. `lib/utils/chainAnalysisUtils.ts` (~400 lines)
2. `app/api/argument-chains/[chainId]/analyze/route.ts` (~80 lines)
3. `components/chains/ChainAnalysisPanel.tsx` (~200 lines)
4. `lib/ai/chainSuggestions.ts` (~100 lines)
5. `lib/aif/chainExporter.ts` (~80 lines)
6. `app/api/argument-chains/[chainId]/aif/route.ts` (~40 lines)

### Updated Files (4)

7. `components/chains/ArgumentChainNode.tsx` (+20 lines for SchemeNet badge)
8. `components/chains/ArgumentChainCanvas.tsx` (+30 lines for strength minimap)
9. `components/chains/ChainMetadataPanel.tsx` (+40 lines for structure detection)
10. `components/chains/ChainExportButton.tsx` (+10 lines for AIF export)
11. `app/api/argument-chains/[chainId]/route.ts` (+SchemeNet include)

**Total LOC:** ~1,000 lines of new code

---

## Testing Checklist

### Unit Tests

- [ ] `chainAnalysisUtils.test.ts`
  - [ ] Critical path detection (serial chains)
  - [ ] Critical path detection (convergent chains)
  - [ ] Cycle detection (no cycles)
  - [ ] Cycle detection (with cycles)
  - [ ] WWAW strength calculation (supports > attacks)
  - [ ] WWAW strength calculation (attacks > supports)
  - [ ] Structure type detection (all 6 types)

### Integration Tests

- [ ] `POST /api/argument-chains/[chainId]/analyze`
  - [ ] Returns all analysis fields
  - [ ] Handles empty chains gracefully
  - [ ] AI suggestions populated correctly
- [ ] `GET /api/argument-chains/[chainId]/aif`
  - [ ] Valid JSON-LD output
  - [ ] Includes all nodes and edges
  - [ ] Correct AIF namespace usage

### E2E Tests

- [ ] Run analysis from UI
- [ ] View critical path highlighted on canvas
- [ ] See strength heatmap in minimap
- [ ] Export to AIF and reimport (interoperability)
- [ ] Structure type auto-detection matches manual selection

---

## Documentation Updates

### Create New Docs

- [ ] `ARGUMENT_CHAIN_PHASE3_COMPLETE.md` (phase summary)
- [ ] `docs/AIF_ASPIC_MESH_MAPPING.md` (research integration guide)

### Update Existing Docs

- [ ] `ARGUMENT_CHAIN_RESEARCH_INTEGRATION_GUIDE.md` (mark Phase 3 complete)
- [ ] `README.md` (add Phase 3 feature showcase)

---

## Dependencies

All dependencies already installed in Phase 2:
- ✅ `reactflow` (for canvas minimap colors)
- ✅ `openai` (for AI suggestions)
- ✅ `zustand` (for state management)

No new packages needed.

---

## Timeline

| Task | Duration | Dependencies |
|------|----------|--------------|
| 3.1 Critical Path Detection | 8 hours | None |
| 3.2 Cycle Detection | 4 hours | None |
| 3.3 WWAW Strength Calculation | 6 hours | None |
| 3.4 AI Suggestions | 8 hours | 3.1, 3.2, 3.3 |
| 3.5 Structure Type Detection | 6 hours | None (parallel with 3.1-3.4) |
| 3.6 SchemeNet Indicators | 4 hours | None (parallel) |
| 3.7 Strength Visualization | 6 hours | 3.3 |
| 3.8 AIF Export | 6 hours | None (parallel) |

**Total:** 48 hours = **6 working days** (8 hours/day)

**Parallelization possible:**
- Days 1-2: Tasks 3.1, 3.2, 3.5 (independent)
- Days 3-4: Tasks 3.3, 3.6, 3.8 (independent)
- Days 5-6: Tasks 3.4, 3.7 (depend on earlier tasks)

---

## Success Criteria

Phase 3 is complete when:

1. ✅ All 8 tasks implemented and tested
2. ✅ `npm run lint` passes with no errors
3. ✅ Unit tests achieve >80% coverage for analysis utils
4. ✅ E2E test demonstrates full analysis workflow
5. ✅ Documentation updated with research integration details
6. ✅ AIF export validated against AIF spec (use http://aifdb.org validator)

---

## Next Phase Preview

**Phase 4: Collaboration & Permissions** (8-10 days)

Research-informed features:
- Prakken-style preference orderings (ASPIC+ defeat calculation)
- Strict rule library (axioms for formal reasoning)
- Real-time collaborative editing (AGORA-NET adversarial feedback)
- Node-level permissions (who can edit which arguments)

See: `ARGUMENT_CHAIN_IMPLEMENTATION_ROADMAP_PHASE4.md` (to be created)

---

**Status:** ✅ Ready to implement  
**Last Updated:** November 16, 2025  
**Research Integration:** WWAW + Wei & Prakken + ASPIC+ concepts
