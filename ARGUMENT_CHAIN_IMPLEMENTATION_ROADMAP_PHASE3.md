# ArgumentChain Implementation Roadmap - Phase 3

**Phase 3: Analysis Features**  
**Duration**: 1.5-2 weeks  
**Goal**: Advanced chain analysis, visualization, and export capabilities  
**Prerequisite**: Phase 2 complete (visual editor working)

---

## Table of Contents

- [Part 5: Phase 3 Overview](#part-5-phase-3-overview)
- [Critical Path Visualization](#critical-path-visualization)
- [Chain Analysis Dashboard](#chain-analysis-dashboard)
- [Export & Sharing](#export--sharing)
- [Chain Comparison Tools](#chain-comparison-tools)

---

## Part 5: Phase 3 Overview

### Phase 3 Goals

**What We're Building**:
Advanced analytical tools that help users:
1. Identify the weakest links in argument chains
2. Visualize critical paths from premises to conclusions
3. Export chains in multiple formats (PNG, JSON, PDF)
4. Compare different chains addressing the same topic
5. Get AI-powered suggestions for strengthening chains

**Key Features**:
- **Critical Path Highlighting**: Visual emphasis on most important reasoning paths
- **Weakest Link Detection**: Identify and highlight connections that need strengthening
- **Chain Metrics**: Complexity, depth, breadth, coherence scores
- **Export Options**: Image, JSON, PDF report, shareable link
- **Chain Comparison**: Side-by-side view of alternative reasoning approaches

---

### 4.1 Critical Path Visualization

#### Task 4.1: Implement Critical Path Algorithm (Frontend)
**File**: `lib/utils/chainAnalysisUtils.ts`

```typescript
import { Node, Edge } from "reactflow";
import { ChainNodeData, ChainEdgeData } from "@/lib/types/argumentChain";

export interface PathSegment {
  nodeId: string;
  edgeId?: string;
}

export interface CriticalPath {
  nodes: string[];
  edges: string[];
  overallStrength: number;
  weakestLink: {
    edgeId: string;
    sourceNodeId: string;
    targetNodeId: string;
    strength: number;
  } | null;
  pathLength: number;
}

/**
 * Find all paths from root nodes to conclusion nodes
 */
export function findAllPaths(
  nodes: Node<ChainNodeData>[],
  edges: Edge<ChainEdgeData>[]
): string[][] {
  // Find root nodes (no incoming edges)
  const rootNodeIds = nodes
    .filter((node) => !edges.some((edge) => edge.target === node.id))
    .map((node) => node.id);

  // Find conclusion nodes (no outgoing edges)
  const conclusionNodeIds = nodes
    .filter((node) => !edges.some((edge) => edge.source === node.id))
    .map((node) => node.id);

  const allPaths: string[][] = [];

  // For each root-conclusion pair, find all paths
  rootNodeIds.forEach((rootId) => {
    conclusionNodeIds.forEach((conclusionId) => {
      const paths = findPathsBetween(rootId, conclusionId, edges);
      allPaths.push(...paths);
    });
  });

  return allPaths;
}

/**
 * Recursive path finding between two nodes
 */
function findPathsBetween(
  startNodeId: string,
  endNodeId: string,
  edges: Edge<ChainEdgeData>[],
  visited: Set<string> = new Set()
): string[][] {
  if (startNodeId === endNodeId) {
    return [[startNodeId]];
  }

  visited.add(startNodeId);
  const paths: string[][] = [];

  // Find all outgoing edges from current node
  const outgoingEdges = edges.filter((e) => e.source === startNodeId);

  for (const edge of outgoingEdges) {
    if (!visited.has(edge.target)) {
      const subPaths = findPathsBetween(
        edge.target,
        endNodeId,
        edges,
        new Set(visited)
      );
      
      for (const subPath of subPaths) {
        paths.push([startNodeId, ...subPath]);
      }
    }
  }

  return paths;
}

/**
 * Calculate critical path (path with lowest overall strength)
 */
export function calculateCriticalPath(
  nodes: Node<ChainNodeData>[],
  edges: Edge<ChainEdgeData>[]
): CriticalPath | null {
  const allPaths = findAllPaths(nodes, edges);

  if (allPaths.length === 0) {
    return null;
  }

  let criticalPath: CriticalPath | null = null;
  let lowestStrength = Infinity;

  // Evaluate each path
  allPaths.forEach((nodePath) => {
    // Get edges for this path
    const pathEdges: Edge<ChainEdgeData>[] = [];
    let minStrength = 1.0;
    let weakestEdge: Edge<ChainEdgeData> | null = null;

    for (let i = 0; i < nodePath.length - 1; i++) {
      const edge = edges.find(
        (e) => e.source === nodePath[i] && e.target === nodePath[i + 1]
      );
      
      if (edge) {
        pathEdges.push(edge);
        const strength = edge.data?.strength ?? 1.0;
        
        if (strength < minStrength) {
          minStrength = strength;
          weakestEdge = edge;
        }
      }
    }

    // Critical path is the one with lowest minimum strength (weakest link principle)
    if (minStrength < lowestStrength) {
      lowestStrength = minStrength;
      criticalPath = {
        nodes: nodePath,
        edges: pathEdges.map((e) => e.id),
        overallStrength: minStrength,
        weakestLink: weakestEdge
          ? {
              edgeId: weakestEdge.id,
              sourceNodeId: weakestEdge.source,
              targetNodeId: weakestEdge.target,
              strength: weakestEdge.data?.strength ?? 1.0,
            }
          : null,
        pathLength: nodePath.length,
      };
    }
  });

  return criticalPath;
}

/**
 * Calculate chain complexity metrics
 */
export function calculateChainMetrics(
  nodes: Node<ChainNodeData>[],
  edges: Edge<ChainEdgeData>[]
): {
  nodeCount: number;
  edgeCount: number;
  averageDegree: number;
  maxDepth: number;
  cyclomaticComplexity: number;
  averageStrength: number;
  rootNodes: string[];
  conclusionNodes: string[];
  disconnectedNodes: string[];
} {
  const nodeCount = nodes.length;
  const edgeCount = edges.length;

  // Calculate degree for each node
  const degrees = nodes.map((node) => {
    const inDegree = edges.filter((e) => e.target === node.id).length;
    const outDegree = edges.filter((e) => e.source === node.id).length;
    return inDegree + outDegree;
  });

  const averageDegree = nodeCount > 0 
    ? degrees.reduce((sum, d) => sum + d, 0) / nodeCount 
    : 0;

  // Find root nodes (no incoming edges)
  const rootNodes = nodes
    .filter((node) => !edges.some((e) => e.target === node.id))
    .map((node) => node.id);

  // Find conclusion nodes (no outgoing edges)
  const conclusionNodes = nodes
    .filter((node) => !edges.some((e) => e.source === node.id))
    .map((node) => node.id);

  // Find disconnected nodes
  const connectedNodeIds = new Set([
    ...edges.map((e) => e.source),
    ...edges.map((e) => e.target),
  ]);
  const disconnectedNodes = nodes
    .filter((node) => !connectedNodeIds.has(node.id))
    .map((node) => node.id);

  // Calculate max depth (longest path from root to conclusion)
  const allPaths = findAllPaths(nodes, edges);
  const maxDepth = allPaths.length > 0 
    ? Math.max(...allPaths.map((path) => path.length)) 
    : 0;

  // Cyclomatic complexity: E - N + 2P (P = connected components, simplified to 1)
  const cyclomaticComplexity = edgeCount - nodeCount + 2;

  // Average strength
  const strengths = edges.map((e) => e.data?.strength ?? 1.0);
  const averageStrength = strengths.length > 0
    ? strengths.reduce((sum, s) => sum + s, 0) / strengths.length
    : 1.0;

  return {
    nodeCount,
    edgeCount,
    averageDegree,
    maxDepth,
    cyclomaticComplexity,
    averageStrength,
    rootNodes,
    conclusionNodes,
    disconnectedNodes,
  };
}

/**
 * Generate suggestions for improving the chain
 */
export function generateChainSuggestions(
  nodes: Node<ChainNodeData>[],
  edges: Edge<ChainEdgeData>[],
  criticalPath: CriticalPath | null
): Array<{
  type: "warning" | "info" | "suggestion";
  title: string;
  description: string;
  affectedNodeIds: string[];
  affectedEdgeIds: string[];
}> {
  const suggestions: Array<{
    type: "warning" | "info" | "suggestion";
    title: string;
    description: string;
    affectedNodeIds: string[];
    affectedEdgeIds: string[];
  }> = [];

  const metrics = calculateChainMetrics(nodes, edges);

  // Check for disconnected nodes
  if (metrics.disconnectedNodes.length > 0) {
    suggestions.push({
      type: "warning",
      title: "Disconnected Arguments",
      description: `${metrics.disconnectedNodes.length} argument(s) are not connected to the chain. Consider connecting them or removing them.`,
      affectedNodeIds: metrics.disconnectedNodes,
      affectedEdgeIds: [],
    });
  }

  // Check for weak links
  const weakEdges = edges.filter((e) => (e.data?.strength ?? 1.0) < 0.5);
  if (weakEdges.length > 0) {
    suggestions.push({
      type: "warning",
      title: "Weak Connections",
      description: `${weakEdges.length} connection(s) have strength below 50%. These may weaken your overall argument.`,
      affectedNodeIds: [],
      affectedEdgeIds: weakEdges.map((e) => e.id),
    });
  }

  // Check for weakest link in critical path
  if (criticalPath?.weakestLink && criticalPath.weakestLink.strength < 0.7) {
    suggestions.push({
      type: "warning",
      title: "Critical Path Weakness",
      description: `Your chain's critical path has a weak link (${Math.round(criticalPath.weakestLink.strength * 100)}% strength). Strengthening this connection would improve the entire chain.`,
      affectedNodeIds: [
        criticalPath.weakestLink.sourceNodeId,
        criticalPath.weakestLink.targetNodeId,
      ],
      affectedEdgeIds: [criticalPath.weakestLink.edgeId],
    });
  }

  // Check for missing conclusions
  if (metrics.conclusionNodes.length === 0 && metrics.nodeCount > 0) {
    suggestions.push({
      type: "info",
      title: "No Conclusion",
      description: "Your chain doesn't have a clear conclusion argument. Consider adding one or marking an existing argument as the conclusion.",
      affectedNodeIds: [],
      affectedEdgeIds: [],
    });
  }

  // Check for missing premises
  if (metrics.rootNodes.length === 0 && metrics.nodeCount > 0) {
    suggestions.push({
      type: "info",
      title: "No Root Premises",
      description: "Your chain doesn't have clear starting premises. Consider identifying the foundational arguments.",
      affectedNodeIds: [],
      affectedEdgeIds: [],
    });
  }

  // Check chain complexity
  if (metrics.nodeCount > 20) {
    suggestions.push({
      type: "suggestion",
      title: "Complex Chain",
      description: "This chain has many arguments. Consider breaking it into smaller sub-chains or using the auto-layout feature.",
      affectedNodeIds: [],
      affectedEdgeIds: [],
    });
  }

  // Check for very short chains
  if (metrics.maxDepth <= 2 && metrics.nodeCount >= 3) {
    suggestions.push({
      type: "suggestion",
      title: "Shallow Chain",
      description: "This chain has few reasoning steps. Consider adding intermediate arguments to strengthen the connection between premises and conclusion.",
      affectedNodeIds: [],
      affectedEdgeIds: [],
    });
  }

  return suggestions;
}
```

**Acceptance Criteria**:
- [x] Find all paths from roots to conclusions
- [x] Calculate critical path (weakest link principle)
- [x] Identify weakest link in chain
- [x] Calculate comprehensive metrics
- [x] Generate actionable suggestions
- [x] Handle edge cases (cycles, disconnected nodes)

**Estimated Time**: 3 hours

---

#### Task 4.2: Create CriticalPathOverlay Component
**File**: `components/chains/CriticalPathOverlay.tsx`

```typescript
"use client";

import React, { useEffect } from "react";
import { useChainEditorStore } from "@/lib/stores/chainEditorStore";
import { calculateCriticalPath } from "@/lib/utils/chainAnalysisUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function CriticalPathOverlay() {
  const { nodes, edges } = useChainEditorStore();
  const [criticalPath, setCriticalPath] = React.useState<ReturnType<typeof calculateCriticalPath>>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  useEffect(() => {
    if (nodes.length > 0 && edges.length > 0) {
      const path = calculateCriticalPath(nodes, edges);
      setCriticalPath(path);
    } else {
      setCriticalPath(null);
    }
  }, [nodes, edges]);

  const handleHighlight = () => {
    if (!criticalPath) return;

    // Update node/edge styles to highlight critical path
    useChainEditorStore.setState((state) => ({
      nodes: state.nodes.map((node) => ({
        ...node,
        className: criticalPath.nodes.includes(node.id)
          ? "critical-path-node"
          : "",
      })),
      edges: state.edges.map((edge) => ({
        ...edge,
        className: criticalPath.edges.includes(edge.id)
          ? "critical-path-edge"
          : "",
        animated: criticalPath.edges.includes(edge.id),
      })),
    }));

    setIsVisible(true);
  };

  const handleClear = () => {
    // Remove highlighting
    useChainEditorStore.setState((state) => ({
      nodes: state.nodes.map((node) => ({
        ...node,
        className: "",
      })),
      edges: state.edges.map((edge) => ({
        ...edge,
        className: "",
        animated: false,
      })),
    }));

    setIsVisible(false);
  };

  if (!criticalPath) {
    return null;
  }

  const strengthPercentage = Math.round(criticalPath.overallStrength * 100);
  const isWeak = criticalPath.overallStrength < 0.7;

  return (
    <div className="absolute top-20 left-4 z-10">
      <div
        className={cn(
          "bg-background border rounded-lg shadow-lg p-4 space-y-3 w-80",
          isVisible && "ring-2 ring-primary/20"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <h3 className="font-semibold text-sm">Critical Path</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              The reasoning path that determines overall strength
            </p>
          </div>
          {isVisible && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Metrics */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Path Length:</span>
            <Badge variant="secondary">{criticalPath.pathLength} arguments</Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Overall Strength:</span>
            <Badge
              variant={isWeak ? "destructive" : "default"}
              className={!isWeak ? "bg-green-100 text-green-800" : ""}
            >
              {strengthPercentage}%
            </Badge>
          </div>
        </div>

        {/* Weakest Link Warning */}
        {criticalPath.weakestLink && (
          <div className="bg-amber-50 border border-amber-200 rounded p-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-medium text-amber-900">Weakest Link</p>
                <p className="text-amber-700">
                  One connection has {Math.round(criticalPath.weakestLink.strength * 100)}%
                  strength. Strengthening this will improve the entire chain.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {!isVisible ? (
            <Button size="sm" onClick={handleHighlight} className="flex-1">
              Highlight Path
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={handleClear} className="flex-1">
              Clear Highlight
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Add to**: `components/chains/ChainCanvas.tsx` (import and render)

```typescript
import { CriticalPathOverlay } from "./CriticalPathOverlay";

// Inside ChainCanvasInner, add to render:
<ReactFlow {...props}>
  {/* ...existing content... */}
  <CriticalPathOverlay />
</ReactFlow>
```

**Add CSS**: `app/globals.css`

```css
/* Critical Path Highlighting */
.critical-path-node {
  filter: drop-shadow(0 0 8px rgb(59 130 246 / 0.5));
}

.critical-path-edge {
  stroke-width: 3px !important;
  filter: drop-shadow(0 0 4px rgb(59 130 246 / 0.5));
}
```

**Acceptance Criteria**:
- [x] Calculates critical path on nodes/edges change
- [x] Shows path length and overall strength
- [x] Highlights weakest link
- [x] Highlight/Clear buttons toggle visual emphasis
- [x] Warning for weak links (<70%)
- [x] Integrates with canvas

**Estimated Time**: 2 hours

---

### 4.2 Chain Analysis Dashboard

#### Task 4.3: Create ChainAnalysisDashboard Component
**File**: `components/chains/ChainAnalysisDashboard.tsx`

```typescript
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  calculateChainMetrics,
  calculateCriticalPath,
  generateChainSuggestions,
} from "@/lib/utils/chainAnalysisUtils";
import { useChainEditorStore } from "@/lib/stores/chainEditorStore";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Info,
  Lightbulb,
  Download,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface ChainAnalysisDashboardProps {
  chainId?: string;
}

export function ChainAnalysisDashboard({ chainId }: ChainAnalysisDashboardProps) {
  const { nodes, edges } = useChainEditorStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [serverAnalysis, setServerAnalysis] = useState<any>(null);

  // Client-side analysis
  const metrics = calculateChainMetrics(nodes, edges);
  const criticalPath = calculateCriticalPath(nodes, edges);
  const suggestions = generateChainSuggestions(nodes, edges, criticalPath);

  // Fetch server-side analysis
  const fetchServerAnalysis = async () => {
    if (!chainId) return;

    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/argument-chains/${chainId}/analyze`);
      if (!res.ok) throw new Error("Failed to fetch analysis");
      const data = await res.json();
      setServerAnalysis(data);
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to fetch analysis");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (chainId) {
      fetchServerAnalysis();
    }
  }, [chainId]);

  // Categorize suggestions
  const warnings = suggestions.filter((s) => s.type === "warning");
  const infos = suggestions.filter((s) => s.type === "info");
  const tips = suggestions.filter((s) => s.type === "suggestion");

  const exportAnalysis = () => {
    const analysisData = {
      metrics,
      criticalPath,
      suggestions,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(analysisData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chain-analysis-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Analysis exported");
  };

  return (
    <div className="w-96 border-l bg-muted/30 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <h3 className="font-semibold">Chain Analysis</h3>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchServerAnalysis}
              disabled={!chainId || isRefreshing}
              title="Refresh analysis"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={exportAnalysis}
              title="Export analysis"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Insights and metrics for your argument chain
        </p>
      </div>

      <ScrollArea className="flex-1">
        <Tabs defaultValue="metrics" className="p-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="path">Critical Path</TabsTrigger>
            <TabsTrigger value="suggestions">
              Suggestions
              {suggestions.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {suggestions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Structure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Arguments</span>
                  <Badge variant="secondary">{metrics.nodeCount}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Connections</span>
                  <Badge variant="secondary">{metrics.edgeCount}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Max Depth</span>
                  <Badge variant="secondary">{metrics.maxDepth} steps</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Avg Degree</span>
                  <Badge variant="secondary">{metrics.averageDegree.toFixed(1)}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quality</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">Avg Strength</span>
                    <span className="text-xs font-medium">
                      {Math.round(metrics.averageStrength * 100)}%
                    </span>
                  </div>
                  <Progress value={metrics.averageStrength * 100} />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Root Premises</span>
                  <Badge variant="secondary">{metrics.rootNodes.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Conclusions</span>
                  <Badge variant="secondary">{metrics.conclusionNodes.length}</Badge>
                </div>
                {metrics.disconnectedNodes.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Disconnected</span>
                    <Badge variant="destructive">{metrics.disconnectedNodes.length}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Complexity</CardTitle>
                <CardDescription className="text-xs">
                  Cyclomatic complexity: {metrics.cyclomaticComplexity}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {metrics.cyclomaticComplexity < 5
                    ? "Simple chain - easy to follow"
                    : metrics.cyclomaticComplexity < 10
                    ? "Moderate complexity"
                    : "Complex chain - consider simplification"}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Critical Path Tab */}
          <TabsContent value="path" className="space-y-4">
            {criticalPath ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Overall Strength</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold">
                          {Math.round(criticalPath.overallStrength * 100)}%
                        </span>
                        <TrendingUp
                          className={`h-5 w-5 ${
                            criticalPath.overallStrength >= 0.7
                              ? "text-green-600"
                              : "text-amber-600"
                          }`}
                        />
                      </div>
                      <Progress value={criticalPath.overallStrength * 100} />
                      <p className="text-xs text-muted-foreground">
                        Your chain is as strong as its weakest link
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Path Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Length</span>
                      <Badge variant="secondary">{criticalPath.pathLength} args</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Connections</span>
                      <Badge variant="secondary">{criticalPath.edges.length}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {criticalPath.weakestLink && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        Weakest Link
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Strength</span>
                          <Badge variant="secondary">
                            {Math.round(criticalPath.weakestLink.strength * 100)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Improving this connection will strengthen your entire argument
                          chain.
                        </p>
                        <Button size="sm" variant="outline" className="w-full mt-2">
                          Focus on This Link
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground text-center">
                    Add more arguments and connections to see critical path analysis
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-4">
            {warnings.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Warnings ({warnings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {warnings.map((warning, idx) => (
                    <div key={idx} className="text-xs">
                      <p className="font-medium text-red-900">{warning.title}</p>
                      <p className="text-red-700 mt-1">{warning.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {infos.length > 0 && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    Information ({infos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {infos.map((info, idx) => (
                    <div key={idx} className="text-xs">
                      <p className="font-medium text-blue-900">{info.title}</p>
                      <p className="text-blue-700 mt-1">{info.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {tips.length > 0 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-600" />
                    Suggestions ({tips.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tips.map((tip, idx) => (
                    <div key={idx} className="text-xs">
                      <p className="font-medium text-yellow-900">{tip.title}</p>
                      <p className="text-yellow-700 mt-1">{tip.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {suggestions.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <Lightbulb className="h-8 w-8 text-green-600 mx-auto" />
                    <p className="text-sm font-medium text-green-900">Looking good!</p>
                    <p className="text-xs text-muted-foreground">
                      No major issues detected in your chain
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );
}
```

**Acceptance Criteria**:
- [x] Three tabs: Metrics, Critical Path, Suggestions
- [x] Real-time metrics calculation
- [x] Visual quality indicators (progress bars, badges)
- [x] Categorized suggestions (warnings, info, tips)
- [x] Export analysis as JSON
- [x] Refresh from server analysis
- [x] Complexity scoring

**Estimated Time**: 4 hours

---

#### Task 4.4: Integrate Analysis Dashboard into Constructor
**File**: `components/chains/ArgumentChainConstructor.tsx`

```typescript
import { ChainAnalysisDashboard } from "./ChainAnalysisDashboard";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { useState } from "react";

// Add state for toggling dashboard
const [showAnalysis, setShowAnalysis] = useState(true);

// Update render:
<div className="flex flex-1 overflow-hidden">
  <ArgumentPalette {...props} />
  <ChainCanvas {...props} />
  
  {/* Toggle button when dashboard is hidden */}
  {!showAnalysis && (
    <Button
      size="sm"
      variant="outline"
      className="absolute top-4 right-4 z-10"
      onClick={() => setShowAnalysis(true)}
    >
      <BarChart3 className="h-4 w-4 mr-2" />
      Show Analysis
    </Button>
  )}
  
  {/* Analysis Dashboard */}
  {showAnalysis && (
    <div className="relative">
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2 z-10"
        onClick={() => setShowAnalysis(false)}
      >
        ×
      </Button>
      <ChainAnalysisDashboard chainId={chainId} />
    </div>
  )}
</div>
```

**Estimated Time**: 0.5 hours

---

**Phase 3 Part 5 Summary**:
- **Total Tasks**: 4 tasks (4.1-4.4)
- **Estimated Time**: 9.5 hours
- **Deliverable**: Critical path visualization and comprehensive analysis dashboard

---

## Part 6: Export & Sharing

### 4.3 Export Functionality

#### Task 4.5: Create ChainExportModal Component
**File**: `components/chains/ChainExportModal.tsx`

```typescript
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChainEditorStore } from "@/lib/stores/chainEditorStore";
import { useReactFlow } from "reactflow";
import { toPng, toJpeg, toSvg } from "html-to-image";
import { toast } from "sonner";
import { Download, Copy, Share2, FileJson, FileImage, Link as LinkIcon } from "lucide-react";

interface ChainExportModalProps {
  chainId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ChainExportModal({ chainId, isOpen, onClose }: ChainExportModalProps) {
  const { nodes, edges, chainName } = useChainEditorStore();
  const reactFlowInstance = useReactFlow();

  const [exportFormat, setExportFormat] = useState<"png" | "jpeg" | "svg" | "json">("png");
  const [includeAnalysis, setIncludeAnalysis] = useState(true);
  const [imageQuality, setImageQuality] = useState("high");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [isExporting, setIsExporting] = useState(false);
  const [shareableLink, setShareableLink] = useState("");

  // Export as Image
  const exportAsImage = async () => {
    setIsExporting(true);

    try {
      const viewport = document.querySelector(".react-flow__viewport");
      if (!viewport) throw new Error("Canvas not found");

      const exportOptions = {
        backgroundColor,
        quality: imageQuality === "high" ? 1 : imageQuality === "medium" ? 0.8 : 0.6,
        pixelRatio: imageQuality === "high" ? 2 : 1,
        filter: (node: HTMLElement) => {
          // Exclude UI controls from export
          if (node.classList?.contains("react-flow__controls")) return false;
          if (node.classList?.contains("react-flow__minimap")) return false;
          if (node.classList?.contains("react-flow__panel")) return false;
          return true;
        },
      };

      let dataUrl: string;
      
      if (exportFormat === "png") {
        dataUrl = await toPng(viewport as HTMLElement, exportOptions);
      } else if (exportFormat === "jpeg") {
        dataUrl = await toJpeg(viewport as HTMLElement, exportOptions);
      } else if (exportFormat === "svg") {
        dataUrl = await toSvg(viewport as HTMLElement, exportOptions);
      } else {
        throw new Error("Unsupported format");
      }

      // Download
      const link = document.createElement("a");
      link.download = `${chainName || "argument-chain"}-${Date.now()}.${exportFormat}`;
      link.href = dataUrl;
      link.click();

      toast.success(`Exported as ${exportFormat.toUpperCase()}`);
      onClose();
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export image");
    } finally {
      setIsExporting(false);
    }
  };

  // Export as JSON
  const exportAsJSON = () => {
    setIsExporting(true);

    try {
      const chainData = {
        metadata: {
          name: chainName,
          chainId,
          exportedAt: new Date().toISOString(),
          version: "1.0",
        },
        nodes: nodes.map((node) => ({
          id: node.id,
          position: node.position,
          data: node.data,
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          data: edge.data,
        })),
      };

      // Optionally include analysis
      if (includeAnalysis) {
        const { calculateChainMetrics, calculateCriticalPath } = require("@/lib/utils/chainAnalysisUtils");
        (chainData as any).analysis = {
          metrics: calculateChainMetrics(nodes, edges),
          criticalPath: calculateCriticalPath(nodes, edges),
        };
      }

      const blob = new Blob([JSON.stringify(chainData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${chainName || "argument-chain"}-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Exported as JSON");
      onClose();
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export JSON");
    } finally {
      setIsExporting(false);
    }
  };

  // Generate shareable link
  const generateShareableLink = async () => {
    setIsExporting(true);

    try {
      // Create shareable link with chain ID
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/app/chains/${chainId}/view?share=true`;
      
      setShareableLink(link);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(link);
      toast.success("Link copied to clipboard");
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to generate link");
    } finally {
      setIsExporting(false);
    }
  };

  // Export PDF (server-side)
  const exportAsPDF = async () => {
    setIsExporting(true);

    try {
      const res = await fetch(`/api/argument-chains/${chainId}/export/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          includeAnalysis,
          format: "a4",
        }),
      });

      if (!res.ok) throw new Error("Failed to generate PDF");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${chainName || "argument-chain"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Exported as PDF");
      onClose();
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    if (exportFormat === "json") {
      exportAsJSON();
    } else {
      exportAsImage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Argument Chain</DialogTitle>
          <DialogDescription>
            Export your chain in various formats or generate a shareable link
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </TabsTrigger>
            <TabsTrigger value="share">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </TabsTrigger>
          </TabsList>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4 pt-4">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label>Export Format</Label>
              <RadioGroup value={exportFormat} onValueChange={(v: any) => setExportFormat(v)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="png" id="png" />
                  <Label htmlFor="png" className="flex items-center gap-2 cursor-pointer">
                    <FileImage className="h-4 w-4" />
                    PNG Image (Recommended)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="jpeg" id="jpeg" />
                  <Label htmlFor="jpeg" className="flex items-center gap-2 cursor-pointer">
                    <FileImage className="h-4 w-4" />
                    JPEG Image
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="svg" id="svg" />
                  <Label htmlFor="svg" className="flex items-center gap-2 cursor-pointer">
                    <FileImage className="h-4 w-4" />
                    SVG (Vector)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="json" id="json" />
                  <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer">
                    <FileJson className="h-4 w-4" />
                    JSON Data
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Image Options */}
            {exportFormat !== "json" && (
              <>
                <div className="space-y-3">
                  <Label>Image Quality</Label>
                  <RadioGroup value={imageQuality} onValueChange={setImageQuality}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="high" id="high" />
                      <Label htmlFor="high" className="cursor-pointer">High (2x resolution)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label htmlFor="medium" className="cursor-pointer">Medium</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="low" id="low" />
                      <Label htmlFor="low" className="cursor-pointer">Low (Faster)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bgColor">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="bgColor"
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="flex-1"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </>
            )}

            {/* JSON Options */}
            {exportFormat === "json" && (
              <div className="flex items-center justify-between p-3 border rounded">
                <div className="space-y-0.5">
                  <Label>Include Analysis</Label>
                  <p className="text-xs text-muted-foreground">
                    Add metrics and critical path data
                  </p>
                </div>
                <Switch
                  checked={includeAnalysis}
                  onCheckedChange={setIncludeAnalysis}
                />
              </div>
            )}

            {/* PDF Option */}
            <div className="border-t pt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={exportAsPDF}
                disabled={isExporting}
              >
                <FileImage className="h-4 w-4 mr-2" />
                Export as PDF Report
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Generates a detailed PDF with argument text and analysis
              </p>
            </div>
          </TabsContent>

          {/* Share Tab */}
          <TabsContent value="share" className="space-y-4 pt-4">
            <div className="space-y-3">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm mb-3">
                  Generate a shareable link that allows others to view this chain
                  (read-only).
                </p>
                
                {shareableLink ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={shareableLink}
                        readOnly
                        className="flex-1 font-mono text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(shareableLink);
                          toast.success("Link copied");
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Link copied to clipboard! Share it with anyone in the deliberation.
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={generateShareableLink}
                    disabled={isExporting}
                    className="w-full"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Generate Shareable Link
                  </Button>
                )}
              </div>

              {/* Share Settings */}
              <div className="space-y-2 border-t pt-4">
                <Label className="text-sm font-semibold">Share Settings</Label>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Allow Comments</Label>
                    <p className="text-xs text-muted-foreground">
                      Viewers can leave feedback
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Embed Preview</Label>
                    <p className="text-xs text-muted-foreground">
                      Show preview when link is shared
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Acceptance Criteria**:
- [x] Multiple export formats (PNG, JPEG, SVG, JSON)
- [x] Image quality settings
- [x] Background color picker
- [x] JSON with optional analysis data
- [x] PDF export (server-side)
- [x] Shareable link generation
- [x] Share settings (comments, preview)
- [x] Copy to clipboard functionality

**Estimated Time**: 3 hours

---

#### Task 4.6: Create PDF Export API Endpoint
**File**: `app/api/argument-chains/[chainId]/export/pdf/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import PDFDocument from "pdfkit";
import { Readable } from "stream";

const exportSchema = z.object({
  includeAnalysis: z.boolean().default(true),
  format: z.enum(["a4", "letter"]).default("a4"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { chainId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chainId } = params;
    const body = await req.json();
    const { includeAnalysis, format } = exportSchema.parse(body);

    // Fetch chain with all relations
    const chain = await prisma.argumentChain.findUnique({
      where: { id: chainId },
      include: {
        creator: true,
        deliberation: true,
        nodes: {
          include: {
            argument: {
              include: {
                author: true,
                schemes: true,
              },
            },
            addedBy: true,
          },
          orderBy: { nodeOrder: "asc" },
        },
        edges: {
          include: {
            sourceNode: {
              include: {
                argument: true,
              },
            },
            targetNode: {
              include: {
                argument: true,
              },
            },
          },
        },
      },
    });

    if (!chain) {
      return NextResponse.json({ error: "Chain not found" }, { status: 404 });
    }

    // Check permissions
    const isMember = await prisma.deliberationMember.findFirst({
      where: {
        deliberationId: chain.deliberationId,
        userId: session.user.id,
      },
    });

    const canView =
      chain.createdBy === session.user.id ||
      chain.isPublic ||
      isMember;

    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create PDF
    const doc = new PDFDocument({
      size: format === "a4" ? "A4" : "LETTER",
      margin: 50,
    });

    // Pipe to buffer
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));

    // Title
    doc.fontSize(24).text(chain.name, { align: "center" });
    doc.moveDown();

    // Metadata
    doc.fontSize(12).text(`Chain Type: ${chain.chainType}`, { align: "left" });
    doc.text(`Created by: ${chain.creator.name}`);
    doc.text(`Created: ${new Date(chain.createdAt).toLocaleDateString()}`);
    if (chain.description) {
      doc.moveDown();
      doc.fontSize(10).text(chain.description, { align: "justify" });
    }
    doc.moveDown(2);

    // Arguments
    doc.fontSize(18).text("Arguments in Chain", { underline: true });
    doc.moveDown();

    chain.nodes.forEach((node, index) => {
      doc.fontSize(14).text(`${index + 1}. ${node.role || "Argument"}`, {
        continued: false,
      });
      doc.fontSize(12).fillColor("#333333");
      doc.text(node.argument.conclusion, { indent: 20 });
      doc.fontSize(10).fillColor("#666666");
      doc.text(`By: ${node.argument.author.name}`, { indent: 20 });
      doc.moveDown();
      doc.fillColor("#000000");
    });

    // Connections
    if (chain.edges.length > 0) {
      doc.addPage();
      doc.fontSize(18).text("Connections", { underline: true });
      doc.moveDown();

      chain.edges.forEach((edge, index) => {
        const sourceArg = edge.sourceNode.argument.conclusion.substring(0, 50);
        const targetArg = edge.targetNode.argument.conclusion.substring(0, 50);
        
        doc.fontSize(12);
        doc.text(`${index + 1}. ${edge.edgeType}`, { continued: false });
        doc.fontSize(10).fillColor("#666666");
        doc.text(`From: "${sourceArg}..."`, { indent: 20 });
        doc.text(`To: "${targetArg}..."`, { indent: 20 });
        doc.text(`Strength: ${Math.round(edge.strength * 100)}%`, { indent: 20 });
        if (edge.description) {
          doc.text(`Note: ${edge.description}`, { indent: 20 });
        }
        doc.moveDown();
        doc.fillColor("#000000");
      });
    }

    // Analysis (if requested)
    if (includeAnalysis) {
      // Calculate analysis
      const metrics = {
        nodeCount: chain.nodes.length,
        edgeCount: chain.edges.length,
        averageStrength: chain.edges.length > 0
          ? chain.edges.reduce((sum, e) => sum + e.strength, 0) / chain.edges.length
          : 1,
      };

      doc.addPage();
      doc.fontSize(18).text("Analysis", { underline: true });
      doc.moveDown();

      doc.fontSize(12).text(`Total Arguments: ${metrics.nodeCount}`);
      doc.text(`Total Connections: ${metrics.edgeCount}`);
      doc.text(`Average Strength: ${Math.round(metrics.averageStrength * 100)}%`);
    }

    // Finalize PDF
    doc.end();

    // Wait for PDF to finish
    await new Promise((resolve) => doc.on("end", resolve));

    const pdfBuffer = Buffer.concat(chunks);

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${chain.name}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
```

**Dependencies**: Add to `package.json`:
```json
{
  "pdfkit": "^0.13.0",
  "@types/pdfkit": "^0.12.12"
}
```

**Acceptance Criteria**:
- [x] Generates PDF with chain metadata
- [x] Lists all arguments with authors
- [x] Shows all connections with types and strength
- [x] Optional analysis section
- [x] A4 or Letter format
- [x] Permission checks
- [x] Returns PDF as download

**Estimated Time**: 2.5 hours

---

### 4.4 Chain Comparison Tools

#### Task 4.7: Create ChainComparisonView Component
**File**: `components/chains/ChainComparisonView.tsx`

```typescript
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ArrowLeftRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";

interface ChainSummary {
  id: string;
  name: string;
  chainType: string;
  nodeCount: number;
  edgeCount: number;
  averageStrength: number;
  createdBy: { name: string };
  createdAt: string;
}

interface ChainComparisonViewProps {
  deliberationId: string;
  initialChainId?: string;
}

export function ChainComparisonView({
  deliberationId,
  initialChainId,
}: ChainComparisonViewProps) {
  const [chains, setChains] = useState<ChainSummary[]>([]);
  const [chainA, setChainA] = useState<string>(initialChainId || "");
  const [chainB, setChainB] = useState<string>("");
  const [analysisA, setAnalysisA] = useState<any>(null);
  const [analysisB, setAnalysisB] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch available chains
  useEffect(() => {
    async function fetchChains() {
      try {
        const res = await fetch(`/api/deliberations/${deliberationId}/argument-chains`);
        if (!res.ok) throw new Error("Failed to fetch chains");
        const data = await res.json();
        setChains(data.chains || []);
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load chains");
      }
    }

    fetchChains();
  }, [deliberationId]);

  // Fetch analysis for selected chains
  useEffect(() => {
    async function fetchAnalysis() {
      if (!chainA || !chainB) return;

      setIsLoading(true);
      try {
        const [resA, resB] = await Promise.all([
          fetch(`/api/argument-chains/${chainA}/analyze`),
          fetch(`/api/argument-chains/${chainB}/analyze`),
        ]);

        if (!resA.ok || !resB.ok) throw new Error("Failed to fetch analysis");

        const [dataA, dataB] = await Promise.all([resA.json(), resB.json()]);
        setAnalysisA(dataA);
        setAnalysisB(dataB);
      } catch (error) {
        console.error("Analysis error:", error);
        toast.error("Failed to load analysis");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalysis();
  }, [chainA, chainB]);

  const chainAData = chains.find((c) => c.id === chainA);
  const chainBData = chains.find((c) => c.id === chainB);

  const ComparisonMetric = ({
    label,
    valueA,
    valueB,
    unit = "",
    higherIsBetter = true,
  }: {
    label: string;
    valueA: number;
    valueB: number;
    unit?: string;
    higherIsBetter?: boolean;
  }) => {
    const diff = valueA - valueB;
    const isDifferent = Math.abs(diff) > 0.01;
    const isABetter = higherIsBetter ? diff > 0 : diff < 0;

    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant={isABetter && isDifferent ? "default" : "secondary"}>
              {valueA.toFixed(1)}
              {unit}
            </Badge>
            {isDifferent && (
              <>
                {isABetter ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </>
            )}
            {!isDifferent && <Minus className="h-4 w-4 text-muted-foreground" />}
          </div>
          <span className="text-muted-foreground">vs</span>
          <div className="flex items-center gap-2">
            {isDifferent && (
              <>
                {!isABetter ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </>
            )}
            <Badge variant={!isABetter && isDifferent ? "default" : "secondary"}>
              {valueB.toFixed(1)}
              {unit}
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Compare Argument Chains</h1>
        <p className="text-muted-foreground">
          Analyze and compare different reasoning approaches side-by-side
        </p>
      </div>

      {/* Chain Selectors */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Chain A</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={chainA} onValueChange={setChainA}>
              <SelectTrigger>
                <SelectValue placeholder="Select first chain..." />
              </SelectTrigger>
              <SelectContent>
                {chains.map((chain) => (
                  <SelectItem key={chain.id} value={chain.id} disabled={chain.id === chainB}>
                    {chain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {chainAData && (
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p>Type: {chainAData.chainType}</p>
                <p>By: {chainAData.createdBy.name}</p>
                <p>
                  {chainAData.nodeCount} arguments, {chainAData.edgeCount} connections
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Chain B</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={chainB} onValueChange={setChainB}>
              <SelectTrigger>
                <SelectValue placeholder="Select second chain..." />
              </SelectTrigger>
              <SelectContent>
                {chains.map((chain) => (
                  <SelectItem key={chain.id} value={chain.id} disabled={chain.id === chainA}>
                    {chain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {chainBData && (
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p>Type: {chainBData.chainType}</p>
                <p>By: {chainBData.createdBy.name}</p>
                <p>
                  {chainBData.nodeCount} arguments, {chainBData.edgeCount} connections
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparison Results */}
      {analysisA && analysisB && (
        <div className="space-y-6">
          {/* Structure Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5" />
                Structure Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ComparisonMetric
                label="Arguments"
                valueA={analysisA.complexity.nodeCount}
                valueB={analysisB.complexity.nodeCount}
                higherIsBetter={false}
              />
              <ComparisonMetric
                label="Connections"
                valueA={analysisA.complexity.edgeCount}
                valueB={analysisB.complexity.edgeCount}
                higherIsBetter={false}
              />
              <ComparisonMetric
                label="Max Depth"
                valueA={analysisA.complexity.maxDepth}
                valueB={analysisB.complexity.maxDepth}
              />
              <ComparisonMetric
                label="Avg Degree"
                valueA={analysisA.complexity.averageDegree}
                valueB={analysisB.complexity.averageDegree}
                higherIsBetter={false}
              />
            </CardContent>
          </Card>

          {/* Quality Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Quality Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Overall Strength</span>
                  <div className="flex gap-4 text-sm">
                    <span className="font-medium">
                      {analysisA.criticalPath
                        ? `${Math.round(analysisA.criticalPath.overallStrength * 100)}%`
                        : "N/A"}
                    </span>
                    <span className="text-muted-foreground">vs</span>
                    <span className="font-medium">
                      {analysisB.criticalPath
                        ? `${Math.round(analysisB.criticalPath.overallStrength * 100)}%`
                        : "N/A"}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Progress
                    value={
                      analysisA.criticalPath
                        ? analysisA.criticalPath.overallStrength * 100
                        : 0
                    }
                  />
                  <Progress
                    value={
                      analysisB.criticalPath
                        ? analysisB.criticalPath.overallStrength * 100
                        : 0
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Root Premises</p>
                  <Badge variant="secondary">
                    {analysisA.complexity.rootNodes.length}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Root Premises</p>
                  <Badge variant="secondary">
                    {analysisB.complexity.rootNodes.length}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Conclusions</p>
                  <Badge variant="secondary">
                    {analysisA.complexity.conclusionNodes.length}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Conclusions</p>
                  <Badge variant="secondary">
                    {analysisB.complexity.conclusionNodes.length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issues Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Chain A Issues</CardTitle>
              </CardHeader>
              <CardContent>
                {analysisA.suggestions.length > 0 ? (
                  <ScrollArea className="h-40">
                    <div className="space-y-2">
                      {analysisA.suggestions.map((suggestion: any, idx: number) => (
                        <div key={idx} className="text-xs p-2 border rounded">
                          <p className="font-medium">{suggestion.type}</p>
                          <p className="text-muted-foreground">{suggestion.message}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No issues detected
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Chain B Issues</CardTitle>
              </CardHeader>
              <CardContent>
                {analysisB.suggestions.length > 0 ? (
                  <ScrollArea className="h-40">
                    <div className="space-y-2">
                      {analysisB.suggestions.map((suggestion: any, idx: number) => (
                        <div key={idx} className="text-xs p-2 border rounded">
                          <p className="font-medium">{suggestion.type}</p>
                          <p className="text-muted-foreground">{suggestion.message}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No issues detected
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => window.open(`/app/chains/${chainA}`, "_blank")}>
              View Chain A
            </Button>
            <Button variant="outline" onClick={() => window.open(`/app/chains/${chainB}`, "_blank")}>
              View Chain B
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!chainA || !chainB) && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select two chains to compare</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p>Loading analysis...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

**Acceptance Criteria**:
- [x] Select two chains from deliberation
- [x] Side-by-side comparison
- [x] Structure metrics comparison
- [x] Quality metrics comparison
- [x] Visual indicators (better/worse)
- [x] Lists issues for each chain
- [x] Links to view individual chains
- [x] Loading and empty states

**Estimated Time**: 3.5 hours

---

**Phase 3 Part 6 Summary**:
- **Total Tasks**: 3 tasks (4.5-4.7)
- **Estimated Time**: 9 hours
- **Deliverable**: Complete export functionality (image, JSON, PDF, sharing) and chain comparison tools

**Phase 3 Complete Summary**:
- **Total Tasks**: 7 tasks (4.1-4.7)
- **Estimated Time**: 18.5 hours (1.5-2 weeks)
- **Deliverable**: Advanced analysis, export, and comparison features

**Next**: Phase 4 will cover Collaboration & Real-time features, and Phase 5 will cover Integration & Polish.

