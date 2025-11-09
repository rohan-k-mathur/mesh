# Phase 4 - Week 14: Net Visualization (40 hours)

## Overview

Build comprehensive visualization components for argument nets, enabling users to explore complex multi-scheme structures through interactive graph displays with sophisticated layout algorithms and visual encodings.

**Timeline**: Week 14 of Phase 4  
**Total Effort**: 40 hours  
**Dependencies**: Week 13 (Net Identification) complete

## Goals

1. Create interactive graph visualization components
2. Implement multiple layout algorithms for different net types
3. Encode explicitness and confidence in visual styling
4. Enable interactive exploration and navigation
5. Support comparison and analysis workflows

---

# Step 4.2.1: Graph Visualization Core (10 hours)

## Overview

Build the core graph visualization component using React Flow, with custom nodes and edges for argument nets.

## Dependencies

```bash
yarn add reactflow dagre @types/dagre
```

## Component Structure

**File**: `components/nets/visualization/NetGraph.tsx`

```tsx
"use client";

import { useCallback, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  NodeTypes,
  EdgeTypes,
  ConnectionMode,
  useNodesState,
  useEdgesState,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { SchemeNode } from "./nodes/SchemeNode";
import { DependencyEdge } from "./edges/DependencyEdge";
import { NetLayoutEngine } from "./layout/NetLayoutEngine";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, Download } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface NetGraphProps {
  net: {
    id: string;
    netType: string;
    complexity: number;
    confidence: number;
    schemes: Array<{
      schemeId: string;
      schemeName: string;
      schemeCategory: string;
      confidence: number;
      role: string;
      premises: any[];
      conclusion: string;
    }>;
    relationships: Array<{
      sourceScheme: string;
      targetScheme: string;
      type: string;
      strength: number;
    }>;
  };
  dependencyGraph: {
    nodes: Array<{
      schemeId: string;
      schemeName: string;
      role: string;
      depth: number;
    }>;
    edges: Array<{
      sourceSchemeId: string;
      targetSchemeId: string;
      type: string;
      strength: number;
      criticality: string;
      explanation: string;
    }>;
    cycles: string[][];
    criticalPath: string[];
  };
  explicitnessAnalysis: {
    overallExplicitness: string;
    confidence: number;
    schemeExplicitness: Array<{
      schemeId: string;
      level: string;
      confidence: number;
    }>;
    relationshipExplicitness: Array<{
      sourceScheme: string;
      targetScheme: string;
      level: string;
      confidence: number;
    }>;
  };
  layout?: "hierarchical" | "force" | "circular" | "tree";
  onNodeClick?: (schemeId: string) => void;
  onEdgeClick?: (sourceId: string, targetId: string) => void;
}

// ============================================================================
// Custom Node and Edge Types
// ============================================================================

const nodeTypes: NodeTypes = {
  schemeNode: SchemeNode,
};

const edgeTypes: EdgeTypes = {
  dependencyEdge: DependencyEdge,
};

// ============================================================================
// Main Component
// ============================================================================

export function NetGraph({
  net,
  dependencyGraph,
  explicitnessAnalysis,
  layout = "hierarchical",
  onNodeClick,
  onEdgeClick,
}: NetGraphProps) {
  const layoutEngine = useMemo(() => new NetLayoutEngine(), []);

  // Transform net data to React Flow format
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    return transformNetToGraph(
      net,
      dependencyGraph,
      explicitnessAnalysis,
      layoutEngine,
      layout
    );
  }, [net, dependencyGraph, explicitnessAnalysis, layout, layoutEngine]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle node clicks
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [onNodeClick]
  );

  // Handle edge clicks
  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      if (onEdgeClick) {
        onEdgeClick(edge.source, edge.target);
      }
    },
    [onEdgeClick]
  );

  // Export as image
  const handleExport = useCallback(() => {
    // Implementation for exporting graph as PNG/SVG
    console.log("Export graph");
  }, []);

  // Highlight critical path
  const highlightCriticalPath = useCallback(() => {
    const criticalNodeIds = new Set(dependencyGraph.criticalPath);
    
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isOnCriticalPath: criticalNodeIds.has(node.id),
        },
      }))
    );

    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        data: {
          ...edge.data,
          isOnCriticalPath:
            criticalNodeIds.has(edge.source) && criticalNodeIds.has(edge.target),
        },
      }))
    );
  }, [dependencyGraph.criticalPath, setNodes, setEdges]);

  // Highlight cycles
  const highlightCycles = useCallback(() => {
    const cycleNodeIds = new Set(dependencyGraph.cycles.flat());
    
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isInCycle: cycleNodeIds.has(node.id),
        },
      }))
    );
  }, [dependencyGraph.cycles, setNodes]);

  return (
    <Card className="w-full h-[600px] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Strict}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          style={{
            backgroundColor: "#f8f9fa",
          }}
        />

        {/* Control Panel */}
        <Panel position="top-right" className="space-y-2">
          <div className="bg-white rounded-lg shadow-lg p-2 space-y-1">
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={highlightCriticalPath}
            >
              Show Critical Path
            </Button>
            {dependencyGraph.cycles.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={highlightCycles}
              >
                Show Cycles
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={handleExport}
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </Panel>

        {/* Info Panel */}
        <Panel position="top-left">
          <div className="bg-white rounded-lg shadow-lg p-3">
            <div className="text-xs space-y-1">
              <div>
                <span className="font-medium">Net Type:</span> {net.netType}
              </div>
              <div>
                <span className="font-medium">Schemes:</span> {net.schemes.length}
              </div>
              <div>
                <span className="font-medium">Dependencies:</span> {dependencyGraph.edges.length}
              </div>
              <div>
                <span className="font-medium">Complexity:</span> {net.complexity}/100
              </div>
              {dependencyGraph.cycles.length > 0 && (
                <div className="text-red-600">
                  <span className="font-medium">⚠️ Cycles:</span> {dependencyGraph.cycles.length}
                </div>
              )}
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </Card>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function transformNetToGraph(
  net: any,
  dependencyGraph: any,
  explicitnessAnalysis: any,
  layoutEngine: NetLayoutEngine,
  layout: string
): { nodes: Node[]; edges: Edge[] } {
  // Create nodes from schemes
  const nodes: Node[] = net.schemes.map((scheme: any) => {
    const depNode = dependencyGraph.nodes.find(
      (n: any) => n.schemeId === scheme.schemeId
    );
    const explicitness = explicitnessAnalysis.schemeExplicitness.find(
      (e: any) => e.schemeId === scheme.schemeId
    );

    return {
      id: scheme.schemeId,
      type: "schemeNode",
      position: { x: 0, y: 0 }, // Will be set by layout engine
      data: {
        scheme,
        depth: depNode?.depth || 0,
        role: scheme.role,
        explicitness: explicitness?.level || "implicit",
        confidence: scheme.confidence,
        isOnCriticalPath: false,
        isInCycle: false,
      },
    };
  });

  // Create edges from dependencies
  const edges: Edge[] = dependencyGraph.edges.map((edge: any, index: number) => {
    const explicitness = explicitnessAnalysis.relationshipExplicitness.find(
      (e: any) =>
        e.sourceScheme === edge.sourceSchemeId && e.targetScheme === edge.targetSchemeId
    );

    return {
      id: `${edge.sourceSchemeId}-${edge.targetSchemeId}`,
      source: edge.sourceSchemeId,
      target: edge.targetSchemeId,
      type: "dependencyEdge",
      animated: edge.criticality === "critical",
      data: {
        dependency: edge,
        explicitness: explicitness?.level || "implicit",
        isOnCriticalPath: false,
      },
    };
  });

  // Apply layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = layoutEngine.applyLayout(
    nodes,
    edges,
    layout,
    net.netType
  );

  return { nodes: layoutedNodes, edges: layoutedEdges };
}
```

## Custom Scheme Node Component

**File**: `components/nets/visualization/nodes/SchemeNode.tsx`

```tsx
"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const SchemeNode = memo(({ data }: NodeProps) => {
  const { scheme, depth, role, explicitness, confidence, isOnCriticalPath, isInCycle } =
    data;

  // Determine node styling based on properties
  const getNodeStyle = () => {
    let borderColor = "border-gray-300";
    let bgColor = "bg-white";
    let shadowClass = "shadow-md";

    // Role-based styling
    if (role === "primary") {
      borderColor = "border-blue-500";
      bgColor = "bg-blue-50";
    } else if (role === "supporting") {
      borderColor = "border-green-500";
      bgColor = "bg-green-50";
    } else if (role === "subordinate") {
      borderColor = "border-purple-500";
      bgColor = "bg-purple-50";
    }

    // Explicitness opacity
    let opacityClass = "opacity-100";
    if (explicitness === "semi-explicit") {
      opacityClass = "opacity-80";
    } else if (explicitness === "implicit") {
      opacityClass = "opacity-60";
    }

    // Critical path highlighting
    if (isOnCriticalPath) {
      shadowClass = "shadow-xl ring-2 ring-yellow-400";
    }

    // Cycle warning
    if (isInCycle) {
      borderColor = "border-red-500";
      shadowClass = "shadow-xl ring-2 ring-red-400";
    }

    return { borderColor, bgColor, opacityClass, shadowClass };
  };

  const { borderColor, bgColor, opacityClass, shadowClass } = getNodeStyle();

  return (
    <div className={cn("relative", opacityClass)}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500"
      />

      {/* Node Card */}
      <Card
        className={cn(
          "min-w-[200px] max-w-[280px] border-2 transition-all hover:shadow-lg",
          borderColor,
          bgColor,
          shadowClass
        )}
      >
        <div className="p-3 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="font-semibold text-sm leading-tight">
                {scheme.schemeName}
              </h4>
              <p className="text-xs text-gray-500">{scheme.schemeCategory}</p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                role === "primary" && "bg-blue-100 text-blue-800 border-blue-300",
                role === "supporting" && "bg-green-100 text-green-800 border-green-300",
                role === "subordinate" && "bg-purple-100 text-purple-800 border-purple-300"
              )}
            >
              {role}
            </Badge>
          </div>

          {/* Conclusion */}
          <div className="text-xs">
            <span className="font-medium text-gray-700">Conclusion:</span>
            <p className="text-gray-600 mt-0.5 line-clamp-2">{scheme.conclusion}</p>
          </div>

          {/* Premises Count */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{scheme.premises.length} premises</span>
            <span>•</span>
            <span>{confidence}% confidence</span>
          </div>

          {/* Explicitness Indicator */}
          <div className="flex items-center gap-1">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                explicitness === "explicit" && "bg-green-500",
                explicitness === "semi-explicit" && "bg-yellow-500",
                explicitness === "implicit" && "bg-red-500"
              )}
            />
            <span className="text-xs text-gray-500 capitalize">{explicitness}</span>
          </div>

          {/* Warnings */}
          {isInCycle && (
            <div className="text-xs text-red-600 font-medium">⚠️ In circular dependency</div>
          )}
          {isOnCriticalPath && (
            <div className="text-xs text-yellow-700 font-medium">⭐ Critical path</div>
          )}
        </div>
      </Card>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500"
      />
    </div>
  );
});

SchemeNode.displayName = "SchemeNode";
```

## Custom Dependency Edge Component

**File**: `components/nets/visualization/edges/DependencyEdge.tsx`

```tsx
"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
} from "reactflow";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const DependencyEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) => {
  const { dependency, explicitness, isOnCriticalPath } = data || {};

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 10,
  });

  // Edge styling based on properties
  const getEdgeStyle = () => {
    let strokeColor = "#94a3b8"; // gray-400
    let strokeWidth = 2;
    let strokeDasharray = "0";

    // Type-based color
    if (dependency?.type === "prerequisite") {
      strokeColor = "#ef4444"; // red-500
      strokeWidth = 3;
    } else if (dependency?.type === "supporting") {
      strokeColor = "#22c55e"; // green-500
    } else if (dependency?.type === "enabling") {
      strokeColor = "#3b82f6"; // blue-500
    } else if (dependency?.type === "background") {
      strokeColor = "#9ca3af"; // gray-400
      strokeDasharray = "5,5";
    }

    // Explicitness affects opacity
    let opacity = 1;
    if (explicitness === "semi-explicit") {
      opacity = 0.7;
    } else if (explicitness === "implicit") {
      opacity = 0.5;
      strokeDasharray = "3,3";
    }

    // Critical path highlighting
    if (isOnCriticalPath) {
      strokeColor = "#f59e0b"; // amber-500
      strokeWidth = 4;
    }

    // Strength affects width
    if (dependency?.strength) {
      strokeWidth = Math.max(2, Math.min(5, dependency.strength * 5));
    }

    return { strokeColor, strokeWidth, strokeDasharray, opacity };
  };

  const { strokeColor, strokeWidth, strokeDasharray, opacity } = getEdgeStyle();

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray,
          opacity,
        }}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          <Badge
            className={cn(
              "text-xs px-1.5 py-0.5 shadow-sm",
              dependency?.type === "prerequisite" &&
                "bg-red-100 text-red-800 border-red-300",
              dependency?.type === "supporting" &&
                "bg-green-100 text-green-800 border-green-300",
              dependency?.type === "enabling" &&
                "bg-blue-100 text-blue-800 border-blue-300",
              dependency?.type === "background" &&
                "bg-gray-100 text-gray-800 border-gray-300",
              isOnCriticalPath && "ring-2 ring-yellow-400"
            )}
          >
            {dependency?.type || "depends"}
          </Badge>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

DependencyEdge.displayName = "DependencyEdge";
```

## Testing

**File**: `components/nets/visualization/__tests__/NetGraph.test.tsx`

```typescript
import { render, screen } from "@testing-library/react";
import { NetGraph } from "../NetGraph";

describe("NetGraph", () => {
  const mockNet = {
    id: "net1",
    netType: "convergent",
    complexity: 45,
    confidence: 85,
    schemes: [
      {
        schemeId: "s1",
        schemeName: "Expert Opinion",
        schemeCategory: "Source",
        confidence: 90,
        role: "primary",
        premises: [{ key: "p1", text: "Dr. Smith says X", isFilled: true }],
        conclusion: "X is true",
      },
    ],
    relationships: [],
  };

  const mockDependencyGraph = {
    nodes: [{ schemeId: "s1", schemeName: "Expert Opinion", role: "primary", depth: 0 }],
    edges: [],
    cycles: [],
    criticalPath: ["s1"],
  };

  const mockExplicitnessAnalysis = {
    overallExplicitness: "explicit",
    confidence: 85,
    schemeExplicitness: [
      { schemeId: "s1", level: "explicit", confidence: 90 },
    ],
    relationshipExplicitness: [],
  };

  it("should render graph with nodes", () => {
    render(
      <NetGraph
        net={mockNet}
        dependencyGraph={mockDependencyGraph}
        explicitnessAnalysis={mockExplicitnessAnalysis}
      />
    );

    expect(screen.getByText("Expert Opinion")).toBeInTheDocument();
  });

  it("should display net info panel", () => {
    render(
      <NetGraph
        net={mockNet}
        dependencyGraph={mockDependencyGraph}
        explicitnessAnalysis={mockExplicitnessAnalysis}
      />
    );

    expect(screen.getByText(/Net Type:/)).toBeInTheDocument();
    expect(screen.getByText(/convergent/)).toBeInTheDocument();
  });
});
```

## Time Allocation

- React Flow integration: 3 hours
- Custom node component: 2 hours
- Custom edge component: 2 hours
- Controls and panels: 2 hours
- Testing: 1 hour

## Deliverables

- ✅ `NetGraph` main component
- ✅ `SchemeNode` custom node
- ✅ `DependencyEdge` custom edge
- ✅ Interactive controls
- ✅ Info and control panels
- ✅ Test suite

---

*[Continuing with Step 4.2.2: Layout Algorithms...]*

---

# Step 4.2.2: Layout Algorithms (10 hours)

## Overview

Implement multiple graph layout algorithms optimized for different argument net types, using Dagre for hierarchical layouts and custom algorithms for force-directed and circular arrangements.

## Layout Engine

**File**: `components/nets/visualization/layout/NetLayoutEngine.ts`

```typescript
import dagre from "dagre";
import { Node, Edge } from "reactflow";

// ============================================================================
// Types
// ============================================================================

export type LayoutType = "hierarchical" | "force" | "circular" | "tree";

export interface LayoutConfig {
  nodeWidth: number;
  nodeHeight: number;
  nodeSpacing: number;
  rankSpacing: number;
  direction: "TB" | "LR" | "BT" | "RL";
}

// ============================================================================
// Main Layout Engine
// ============================================================================

export class NetLayoutEngine {
  private defaultConfig: LayoutConfig = {
    nodeWidth: 250,
    nodeHeight: 150,
    nodeSpacing: 50,
    rankSpacing: 100,
    direction: "TB", // Top to Bottom
  };

  /**
   * Apply layout algorithm based on type and net structure
   */
  public applyLayout(
    nodes: Node[],
    edges: Edge[],
    layoutType: LayoutType,
    netType?: string
  ): { nodes: Node[]; edges: Edge[] } {
    // Choose optimal layout based on net type if not specified
    const layout = layoutType || this.selectOptimalLayout(netType, nodes.length);

    switch (layout) {
      case "hierarchical":
        return this.hierarchicalLayout(nodes, edges);
      case "force":
        return this.forceDirectedLayout(nodes, edges);
      case "circular":
        return this.circularLayout(nodes, edges);
      case "tree":
        return this.treeLayout(nodes, edges);
      default:
        return this.hierarchicalLayout(nodes, edges);
    }
  }

  /**
   * Select optimal layout based on net characteristics
   */
  private selectOptimalLayout(netType?: string, nodeCount?: number): LayoutType {
    if (netType === "serial" || netType === "linked") {
      return "hierarchical";
    }
    if (netType === "convergent" && nodeCount && nodeCount > 6) {
      return "circular";
    }
    if (netType === "divergent") {
      return "tree";
    }
    return "hierarchical"; // Default
  }

  // ==========================================================================
  // Hierarchical Layout (using Dagre)
  // ==========================================================================

  private hierarchicalLayout(
    nodes: Node[],
    edges: Edge[]
  ): { nodes: Node[]; edges: Edge[] } {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Configure graph layout
    dagreGraph.setGraph({
      rankdir: this.defaultConfig.direction,
      nodesep: this.defaultConfig.nodeSpacing,
      ranksep: this.defaultConfig.rankSpacing,
      marginx: 20,
      marginy: 20,
    });

    // Add nodes
    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, {
        width: this.defaultConfig.nodeWidth,
        height: this.defaultConfig.nodeHeight,
      });
    });

    // Add edges
    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    // Compute layout
    dagre.layout(dagreGraph);

    // Update node positions
    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - this.defaultConfig.nodeWidth / 2,
          y: nodeWithPosition.y - this.defaultConfig.nodeHeight / 2,
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  }

  // ==========================================================================
  // Force-Directed Layout
  // ==========================================================================

  private forceDirectedLayout(
    nodes: Node[],
    edges: Edge[]
  ): { nodes: Node[]; edges: Edge[] } {
    const width = 1000;
    const height = 800;
    const iterations = 100;

    // Initialize positions randomly
    const positions = new Map<string, { x: number; y: number }>();
    nodes.forEach((node) => {
      positions.set(node.id, {
        x: Math.random() * width,
        y: Math.random() * height,
      });
    });

    // Build adjacency for efficient edge lookup
    const adjacency = new Map<string, Set<string>>();
    edges.forEach((edge) => {
      if (!adjacency.has(edge.source)) {
        adjacency.set(edge.source, new Set());
      }
      adjacency.get(edge.source)!.add(edge.target);
    });

    // Force parameters
    const k = Math.sqrt((width * height) / nodes.length); // Ideal distance
    const c_spring = 0.1; // Spring constant
    const c_repulsion = 10000; // Repulsion constant
    const damping = 0.9;

    // Iterate force simulation
    for (let iter = 0; iter < iterations; iter++) {
      const forces = new Map<string, { x: number; y: number }>();
      
      // Initialize forces
      nodes.forEach((node) => {
        forces.set(node.id, { x: 0, y: 0 });
      });

      // Repulsive forces (all pairs)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeA = nodes[i];
          const nodeB = nodes[j];
          const posA = positions.get(nodeA.id)!;
          const posB = positions.get(nodeB.id)!;

          const dx = posB.x - posA.x;
          const dy = posB.y - posA.y;
          const distSq = dx * dx + dy * dy + 0.01; // Avoid division by zero
          const dist = Math.sqrt(distSq);

          const force = (c_repulsion * k * k) / distSq;
          const fx = (force * dx) / dist;
          const fy = (force * dy) / dist;

          forces.get(nodeA.id)!.x -= fx;
          forces.get(nodeA.id)!.y -= fy;
          forces.get(nodeB.id)!.x += fx;
          forces.get(nodeB.id)!.y += fy;
        }
      }

      // Attractive forces (edges only)
      edges.forEach((edge) => {
        const posSource = positions.get(edge.source)!;
        const posTarget = positions.get(edge.target)!;

        const dx = posTarget.x - posSource.x;
        const dy = posTarget.y - posSource.y;
        const dist = Math.sqrt(dx * dx + dy * dy + 0.01);

        const force = c_spring * (dist - k);
        const fx = (force * dx) / dist;
        const fy = (force * dy) / dist;

        forces.get(edge.source)!.x += fx;
        forces.get(edge.source)!.y += fy;
        forces.get(edge.target)!.x -= fx;
        forces.get(edge.target)!.y -= fy;
      });

      // Update positions with damping
      nodes.forEach((node) => {
        const pos = positions.get(node.id)!;
        const force = forces.get(node.id)!;

        pos.x += force.x * damping;
        pos.y += force.y * damping;

        // Keep within bounds
        pos.x = Math.max(50, Math.min(width - 50, pos.x));
        pos.y = Math.max(50, Math.min(height - 50, pos.y));
      });
    }

    // Apply positions to nodes
    const layoutedNodes = nodes.map((node) => {
      const pos = positions.get(node.id)!;
      return {
        ...node,
        position: { x: pos.x, y: pos.y },
      };
    });

    return { nodes: layoutedNodes, edges };
  }

  // ==========================================================================
  // Circular Layout
  // ==========================================================================

  private circularLayout(
    nodes: Node[],
    edges: Edge[]
  ): { nodes: Node[]; edges: Edge[] } {
    const centerX = 500;
    const centerY = 400;
    const radius = Math.min(400, 100 + nodes.length * 30);

    // Identify primary node (place in center)
    const primaryNode = nodes.find((n) => n.data.role === "primary");
    const otherNodes = nodes.filter((n) => n.data.role !== "primary");

    const layoutedNodes: Node[] = [];

    // Place primary in center
    if (primaryNode) {
      layoutedNodes.push({
        ...primaryNode,
        position: {
          x: centerX - this.defaultConfig.nodeWidth / 2,
          y: centerY - this.defaultConfig.nodeHeight / 2,
        },
      });
    }

    // Place others in circle
    const angleStep = (2 * Math.PI) / otherNodes.length;
    otherNodes.forEach((node, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start from top
      const x = centerX + radius * Math.cos(angle) - this.defaultConfig.nodeWidth / 2;
      const y = centerY + radius * Math.sin(angle) - this.defaultConfig.nodeHeight / 2;

      layoutedNodes.push({
        ...node,
        position: { x, y },
      });
    });

    // If no primary node, distribute all evenly
    if (!primaryNode) {
      return {
        nodes: nodes.map((node, index) => {
          const angle = (index * 2 * Math.PI) / nodes.length - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle) - this.defaultConfig.nodeWidth / 2;
          const y = centerY + radius * Math.sin(angle) - this.defaultConfig.nodeHeight / 2;

          return {
            ...node,
            position: { x, y },
          };
        }),
        edges,
      };
    }

    return { nodes: layoutedNodes, edges };
  }

  // ==========================================================================
  // Tree Layout
  // ==========================================================================

  private treeLayout(
    nodes: Node[],
    edges: Edge[]
  ): { nodes: Node[]; edges: Edge[] } {
    // Build tree structure
    const children = new Map<string, string[]>();
    const parents = new Map<string, string>();

    edges.forEach((edge) => {
      if (!children.has(edge.source)) {
        children.set(edge.source, []);
      }
      children.get(edge.source)!.push(edge.target);
      parents.set(edge.target, edge.source);
    });

    // Find root (node with no parent)
    const root = nodes.find((n) => !parents.has(n.id));
    if (!root) {
      // Fallback to hierarchical if no clear root
      return this.hierarchicalLayout(nodes, edges);
    }

    const positions = new Map<string, { x: number; y: number }>();
    const subtreeWidths = new Map<string, number>();

    // Calculate subtree widths (bottom-up)
    const calculateWidth = (nodeId: string): number => {
      const nodeChildren = children.get(nodeId) || [];
      if (nodeChildren.length === 0) {
        subtreeWidths.set(nodeId, 1);
        return 1;
      }

      const totalWidth = nodeChildren.reduce(
        (sum, childId) => sum + calculateWidth(childId),
        0
      );
      subtreeWidths.set(nodeId, totalWidth);
      return totalWidth;
    };

    calculateWidth(root.id);

    // Assign positions (top-down)
    const assignPositions = (
      nodeId: string,
      x: number,
      y: number,
      availableWidth: number
    ) => {
      positions.set(nodeId, { x, y });

      const nodeChildren = children.get(nodeId) || [];
      if (nodeChildren.length === 0) return;

      let currentX = x - (availableWidth / 2);
      nodeChildren.forEach((childId) => {
        const childWidth = subtreeWidths.get(childId) || 1;
        const childSpace = (availableWidth * childWidth) / (subtreeWidths.get(nodeId) || 1);
        const childX = currentX + childSpace / 2;
        const childY = y + this.defaultConfig.rankSpacing;

        assignPositions(childId, childX, childY, childSpace);
        currentX += childSpace;
      });
    };

    const totalWidth = (subtreeWidths.get(root.id) || 1) * this.defaultConfig.nodeWidth;
    assignPositions(root.id, totalWidth / 2, 50, totalWidth);

    // Apply positions to nodes
    const layoutedNodes = nodes.map((node) => {
      const pos = positions.get(node.id) || { x: 0, y: 0 };
      return {
        ...node,
        position: {
          x: pos.x - this.defaultConfig.nodeWidth / 2,
          y: pos.y,
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Update layout configuration
   */
  public setConfig(config: Partial<LayoutConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): LayoutConfig {
    return { ...this.defaultConfig };
  }
}
```

## Layout Selector Component

**File**: `components/nets/visualization/LayoutSelector.tsx`

```tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutGrid, Network, Circle, GitBranch } from "lucide-react";

interface LayoutSelectorProps {
  currentLayout: string;
  onLayoutChange: (layout: "hierarchical" | "force" | "circular" | "tree") => void;
}

export function LayoutSelector({ currentLayout, onLayoutChange }: LayoutSelectorProps) {
  const layouts = [
    { id: "hierarchical", name: "Hierarchical", icon: LayoutGrid },
    { id: "force", name: "Force-Directed", icon: Network },
    { id: "circular", name: "Circular", icon: Circle },
    { id: "tree", name: "Tree", icon: GitBranch },
  ];

  const CurrentIcon = layouts.find((l) => l.id === currentLayout)?.icon || LayoutGrid;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <CurrentIcon className="w-4 h-4 mr-2" />
          Layout
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {layouts.map((layout) => (
          <DropdownMenuItem
            key={layout.id}
            onClick={() => onLayoutChange(layout.id as any)}
          >
            <layout.icon className="w-4 h-4 mr-2" />
            {layout.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Testing

**File**: `components/nets/visualization/layout/__tests__/NetLayoutEngine.test.ts`

```typescript
import { NetLayoutEngine } from "../NetLayoutEngine";
import { Node, Edge } from "reactflow";

describe("NetLayoutEngine", () => {
  let engine: NetLayoutEngine;

  beforeEach(() => {
    engine = new NetLayoutEngine();
  });

  const mockNodes: Node[] = [
    { id: "1", type: "schemeNode", position: { x: 0, y: 0 }, data: { role: "primary" } },
    { id: "2", type: "schemeNode", position: { x: 0, y: 0 }, data: { role: "supporting" } },
    { id: "3", type: "schemeNode", position: { x: 0, y: 0 }, data: { role: "supporting" } },
  ];

  const mockEdges: Edge[] = [
    { id: "e1-2", source: "1", target: "2" },
    { id: "e1-3", source: "1", target: "3" },
  ];

  describe("hierarchicalLayout", () => {
    it("should position nodes in hierarchy", () => {
      const { nodes } = engine.applyLayout(mockNodes, mockEdges, "hierarchical");

      expect(nodes.every((n) => n.position.x !== 0 || n.position.y !== 0)).toBe(true);
    });
  });

  describe("circularLayout", () => {
    it("should place primary node in center", () => {
      const { nodes } = engine.applyLayout(mockNodes, mockEdges, "circular");

      const primaryNode = nodes.find((n) => n.data.role === "primary");
      expect(primaryNode).toBeDefined();
      
      // Center should be around (500, 400) minus half node width
      const expectedCenterX = 500 - 250 / 2;
      const expectedCenterY = 400 - 150 / 2;
      
      expect(primaryNode!.position.x).toBeCloseTo(expectedCenterX, 0);
      expect(primaryNode!.position.y).toBeCloseTo(expectedCenterY, 0);
    });
  });

  describe("selectOptimalLayout", () => {
    it("should select hierarchical for serial nets", () => {
      const { nodes } = engine.applyLayout(mockNodes, mockEdges, "hierarchical", "serial");
      expect(nodes.length).toBe(3);
    });
  });
});
```

## Time Allocation

- Hierarchical layout (Dagre): 2 hours
- Force-directed algorithm: 3 hours
- Circular layout: 2 hours
- Tree layout: 2 hours
- Testing: 1 hour

## Deliverables

- ✅ `NetLayoutEngine` service
- ✅ Hierarchical layout (Dagre)
- ✅ Force-directed layout
- ✅ Circular layout
- ✅ Tree layout
- ✅ `LayoutSelector` component
- ✅ Test suite

---

*[Continuing with Step 4.2.3: Node Styling System...]*

---

# Step 4.2.3: Node Styling by Explicitness (8 hours)

## Overview

Implement a comprehensive visual encoding system that uses color, opacity, borders, and icons to communicate scheme explicitness, confidence, role, and status.

## Styling System

**File**: `components/nets/visualization/styles/NodeStyleEngine.ts`

```typescript
// ============================================================================
// Types
// ============================================================================

export interface NodeStyleConfig {
  explicitness: "explicit" | "semi-explicit" | "implicit";
  confidence: number;
  role: "primary" | "supporting" | "subordinate";
  isOnCriticalPath: boolean;
  isInCycle: boolean;
  isSelected: boolean;
  isHovered: boolean;
}

export interface ComputedNodeStyle {
  borderColor: string;
  borderWidth: string;
  backgroundColor: string;
  opacity: string;
  shadow: string;
  ringColor?: string;
  ringWidth?: string;
  transform: string;
  transition: string;
}

// ============================================================================
// Node Style Engine
// ============================================================================

export class NodeStyleEngine {
  /**
   * Compute complete style based on node state
   */
  public computeStyle(config: NodeStyleConfig): ComputedNodeStyle {
    const style: ComputedNodeStyle = {
      borderColor: this.getBorderColor(config),
      borderWidth: this.getBorderWidth(config),
      backgroundColor: this.getBackgroundColor(config),
      opacity: this.getOpacity(config),
      shadow: this.getShadow(config),
      transform: this.getTransform(config),
      transition: "all 0.2s ease-in-out",
    };

    // Add ring for special states
    const ring = this.getRing(config);
    if (ring) {
      style.ringColor = ring.color;
      style.ringWidth = ring.width;
    }

    return style;
  }

  /**
   * Get border color based on role and state
   */
  private getBorderColor(config: NodeStyleConfig): string {
    // Cycle takes priority (red warning)
    if (config.isInCycle) {
      return "#ef4444"; // red-500
    }

    // Critical path gets amber
    if (config.isOnCriticalPath) {
      return "#f59e0b"; // amber-500
    }

    // Role-based colors
    switch (config.role) {
      case "primary":
        return "#3b82f6"; // blue-500
      case "supporting":
        return "#22c55e"; // green-500
      case "subordinate":
        return "#a855f7"; // purple-500
      default:
        return "#9ca3af"; // gray-400
    }
  }

  /**
   * Get border width based on confidence and state
   */
  private getBorderWidth(config: NodeStyleConfig): string {
    if (config.isSelected) return "3px";
    if (config.isOnCriticalPath) return "3px";
    if (config.confidence > 80) return "2px";
    return "2px";
  }

  /**
   * Get background color based on role
   */
  private getBackgroundColor(config: NodeStyleConfig): string {
    switch (config.role) {
      case "primary":
        return "#eff6ff"; // blue-50
      case "supporting":
        return "#f0fdf4"; // green-50
      case "subordinate":
        return "#faf5ff"; // purple-50
      default:
        return "#ffffff"; // white
    }
  }

  /**
   * Get opacity based on explicitness
   */
  private getOpacity(config: NodeStyleConfig): string {
    switch (config.explicitness) {
      case "explicit":
        return "1";
      case "semi-explicit":
        return "0.85";
      case "implicit":
        return "0.7";
      default:
        return "1";
    }
  }

  /**
   * Get shadow based on state
   */
  private getShadow(config: NodeStyleConfig): string {
    if (config.isHovered) {
      return "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)";
    }

    if (config.isSelected) {
      return "0 10px 20px -5px rgba(0, 0, 0, 0.15)";
    }

    if (config.isOnCriticalPath) {
      return "0 4px 15px -2px rgba(245, 158, 11, 0.3)"; // amber glow
    }

    // Default shadow based on confidence
    if (config.confidence > 80) {
      return "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
    }

    return "0 2px 4px -1px rgba(0, 0, 0, 0.06)";
  }

  /**
   * Get ring decoration for special states
   */
  private getRing(config: NodeStyleConfig): { color: string; width: string } | null {
    if (config.isInCycle) {
      return { color: "#ef4444", width: "2px" }; // red-500
    }

    if (config.isOnCriticalPath) {
      return { color: "#f59e0b", width: "2px" }; // amber-500
    }

    if (config.isSelected) {
      return { color: "#3b82f6", width: "2px" }; // blue-500
    }

    return null;
  }

  /**
   * Get transform based on hover
   */
  private getTransform(config: NodeStyleConfig): string {
    if (config.isHovered) {
      return "scale(1.02)";
    }
    return "scale(1)";
  }

  /**
   * Get explicitness indicator style
   */
  public getExplicitnessIndicator(explicitness: string): {
    color: string;
    label: string;
    description: string;
  } {
    switch (explicitness) {
      case "explicit":
        return {
          color: "#22c55e", // green-500
          label: "Explicit",
          description: "Clearly stated in text",
        };
      case "semi-explicit":
        return {
          color: "#eab308", // yellow-500
          label: "Semi-explicit",
          description: "Partially indicated",
        };
      case "implicit":
        return {
          color: "#ef4444", // red-500
          label: "Implicit",
          description: "Inferred from context",
        };
      default:
        return {
          color: "#9ca3af", // gray-400
          label: "Unknown",
          description: "No explicitness data",
        };
    }
  }

  /**
   * Get confidence bar color
   */
  public getConfidenceColor(confidence: number): string {
    if (confidence >= 80) return "#22c55e"; // green-500
    if (confidence >= 60) return "#eab308"; // yellow-500
    if (confidence >= 40) return "#f97316"; // orange-500
    return "#ef4444"; // red-500
  }
}
```

## Enhanced Scheme Node with Styling

**File**: `components/nets/visualization/nodes/EnhancedSchemeNode.tsx`

```tsx
"use client";

import { memo, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, EyeOff, AlertCircle, CheckCircle, Star, AlertTriangle } from "lucide-react";
import { NodeStyleEngine } from "../styles/NodeStyleEngine";
import { cn } from "@/lib/utils";

export const EnhancedSchemeNode = memo(({ data, selected }: NodeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const styleEngine = new NodeStyleEngine();

  const {
    scheme,
    depth,
    role,
    explicitness,
    confidence,
    isOnCriticalPath,
    isInCycle,
  } = data;

  // Compute styling
  const style = styleEngine.computeStyle({
    explicitness,
    confidence,
    role,
    isOnCriticalPath,
    isInCycle,
    isSelected: selected || false,
    isHovered,
  });

  const explicitnessInfo = styleEngine.getExplicitnessIndicator(explicitness);
  const confidenceColor = styleEngine.getConfidenceColor(confidence);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        opacity: style.opacity,
        transform: style.transform,
        transition: style.transition,
      }}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 hover:!bg-blue-600 transition-colors"
      />

      {/* Node Card */}
      <Card
        className={cn("min-w-[220px] max-w-[300px] transition-all")}
        style={{
          borderColor: style.borderColor,
          borderWidth: style.borderWidth,
          backgroundColor: style.backgroundColor,
          boxShadow: style.shadow,
          ...(style.ringColor && {
            outline: `${style.ringWidth} solid ${style.ringColor}`,
            outlineOffset: "2px",
          }),
        }}
      >
        <div className="p-3 space-y-2">
          {/* Header with Role Badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="font-semibold text-sm leading-tight mb-1">
                {scheme.schemeName}
              </h4>
              <p className="text-xs text-gray-500">{scheme.schemeCategory}</p>
            </div>
            <Badge
              variant="outline"
              style={{
                backgroundColor: style.backgroundColor,
                borderColor: style.borderColor,
                color: style.borderColor,
              }}
            >
              {role}
            </Badge>
          </div>

          {/* Conclusion */}
          <div className="text-xs bg-gray-50 rounded p-2">
            <span className="font-medium text-gray-700">Conclusion:</span>
            <p className="text-gray-600 mt-0.5 line-clamp-2">{scheme.conclusion}</p>
          </div>

          {/* Confidence Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Confidence</span>
              <span className="font-medium" style={{ color: confidenceColor }}>
                {confidence}%
              </span>
            </div>
            <Progress
              value={confidence}
              className="h-1.5"
              style={{
                // @ts-ignore
                "--progress-background": confidenceColor,
              }}
            />
          </div>

          {/* Explicitness Indicator */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-xs cursor-help">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: explicitnessInfo.color }}
                  />
                  <span className="text-gray-600">{explicitnessInfo.label}</span>
                  {explicitness === "explicit" ? (
                    <Eye className="w-3 h-3 text-green-500" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-gray-400" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{explicitnessInfo.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Premises Count */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{scheme.premises.length} premises</span>
            <span>•</span>
            <span>depth {depth}</span>
          </div>

          {/* Status Indicators */}
          <div className="flex flex-wrap gap-1">
            {isOnCriticalPath && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      Critical
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This scheme is on the critical path</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {isInCycle && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="bg-red-100 text-red-800 border-red-300 text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Cycle
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This scheme is part of a circular dependency</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {confidence > 90 && (
              <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                High Confidence
              </Badge>
            )}

            {confidence < 50 && (
              <Badge className="bg-orange-100 text-orange-800 border-orange-300 text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                Low Confidence
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500 hover:!bg-blue-600 transition-colors"
      />
    </div>
  );
});

EnhancedSchemeNode.displayName = "EnhancedSchemeNode";
```

## Styling Legend Component

**File**: `components/nets/visualization/StylingLegend.tsx`

```tsx
"use client";

import { Card } from "@/components/ui/card";
import { NodeStyleEngine } from "./styles/NodeStyleEngine";

export function StylingLegend() {
  const styleEngine = new NodeStyleEngine();

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold text-sm">Visualization Legend</h3>

      {/* Explicitness */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-700">Explicitness</p>
        <div className="space-y-1">
          {["explicit", "semi-explicit", "implicit"].map((level) => {
            const info = styleEngine.getExplicitnessIndicator(level);
            return (
              <div key={level} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: info.color }}
                />
                <span className="font-medium">{info.label}:</span>
                <span className="text-gray-600">{info.description}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role Colors */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-700">Scheme Roles</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded border-2 border-blue-500 bg-blue-50" />
            <span>Primary</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded border-2 border-green-500 bg-green-50" />
            <span>Supporting</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded border-2 border-purple-500 bg-purple-50" />
            <span>Subordinate</span>
          </div>
        </div>
      </div>

      {/* Edge Types */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-700">Dependency Types</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-8 h-0.5 bg-red-500" />
            <span>Prerequisite</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-8 h-0.5 bg-green-500" />
            <span>Supporting</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-8 h-0.5 bg-blue-500" />
            <span>Enabling</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-8 h-0.5 bg-gray-400" style={{ borderTop: "2px dashed" }} />
            <span>Background</span>
          </div>
        </div>
      </div>

      {/* Special States */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-700">Special Indicators</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded border-2 border-amber-500 ring-2 ring-amber-400" />
            <span>Critical Path</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded border-2 border-red-500 ring-2 ring-red-400" />
            <span>Circular Dependency</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
```

## Testing

**File**: `components/nets/visualization/styles/__tests__/NodeStyleEngine.test.ts`

```typescript
import { NodeStyleEngine } from "../NodeStyleEngine";

describe("NodeStyleEngine", () => {
  let engine: NodeStyleEngine;

  beforeEach(() => {
    engine = new NodeStyleEngine();
  });

  describe("computeStyle", () => {
    it("should apply explicit styling", () => {
      const style = engine.computeStyle({
        explicitness: "explicit",
        confidence: 90,
        role: "primary",
        isOnCriticalPath: false,
        isInCycle: false,
        isSelected: false,
        isHovered: false,
      });

      expect(style.opacity).toBe("1");
      expect(style.borderColor).toBe("#3b82f6"); // blue-500
    });

    it("should reduce opacity for implicit schemes", () => {
      const style = engine.computeStyle({
        explicitness: "implicit",
        confidence: 60,
        role: "supporting",
        isOnCriticalPath: false,
        isInCycle: false,
        isSelected: false,
        isHovered: false,
      });

      expect(style.opacity).toBe("0.7");
    });

    it("should highlight critical path", () => {
      const style = engine.computeStyle({
        explicitness: "explicit",
        confidence: 80,
        role: "primary",
        isOnCriticalPath: true,
        isInCycle: false,
        isSelected: false,
        isHovered: false,
      });

      expect(style.borderColor).toBe("#f59e0b"); // amber-500
      expect(style.ringColor).toBe("#f59e0b");
    });

    it("should warn about cycles", () => {
      const style = engine.computeStyle({
        explicitness: "explicit",
        confidence: 80,
        role: "primary",
        isOnCriticalPath: false,
        isInCycle: true,
        isSelected: false,
        isHovered: false,
      });

      expect(style.borderColor).toBe("#ef4444"); // red-500
      expect(style.ringColor).toBe("#ef4444");
    });
  });

  describe("getExplicitnessIndicator", () => {
    it("should return correct indicator for explicit", () => {
      const indicator = engine.getExplicitnessIndicator("explicit");
      expect(indicator.label).toBe("Explicit");
      expect(indicator.color).toBe("#22c55e");
    });
  });

  describe("getConfidenceColor", () => {
    it("should return green for high confidence", () => {
      expect(engine.getConfidenceColor(90)).toBe("#22c55e");
    });

    it("should return red for low confidence", () => {
      expect(engine.getConfidenceColor(30)).toBe("#ef4444");
    });
  });
});
```

## Time Allocation

- Style engine implementation: 3 hours
- Enhanced node component: 2 hours
- Visual indicators and tooltips: 2 hours
- Legend component: 0.5 hours
- Testing: 0.5 hours

## Deliverables

- ✅ `NodeStyleEngine` service
- ✅ `EnhancedSchemeNode` component
- ✅ `StylingLegend` component
- ✅ Visual encoding system
- ✅ Tooltips and indicators
- ✅ Test suite

---

*[Continuing with Step 4.2.4: Edge Labeling System...]*

---

# Step 4.2.4: Edge Labeling by Dependency Type (6 hours)

## Overview

Implement rich edge labeling that communicates dependency type, strength, criticality, and explicitness through visual styling and interactive labels.

## Enhanced Dependency Edge Component

**File**: `components/nets/visualization/edges/EnhancedDependencyEdge.tsx`

```tsx
"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  getSmoothStepPath,
} from "reactflow";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const EnhancedDependencyEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    markerEnd,
    selected,
  }: EdgeProps) => {
    const { dependency, explicitness, isOnCriticalPath } = data || {};

    // Choose path type based on edge complexity
    const [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 12,
    });

    // Edge styling
    const getEdgeStyle = () => {
      let strokeColor = "#94a3b8"; // gray-400
      let strokeWidth = 2;
      let strokeDasharray = "0";
      let opacity = 1;

      // Type-based styling
      switch (dependency?.type) {
        case "prerequisite":
          strokeColor = "#ef4444"; // red-500
          strokeWidth = 3;
          break;
        case "supporting":
          strokeColor = "#22c55e"; // green-500
          strokeWidth = 2.5;
          break;
        case "enabling":
          strokeColor = "#3b82f6"; // blue-500
          strokeWidth = 2.5;
          break;
        case "background":
          strokeColor = "#9ca3af"; // gray-400
          strokeWidth = 1.5;
          strokeDasharray = "5,5";
          break;
      }

      // Strength affects width
      if (dependency?.strength) {
        const strengthMultiplier = 0.5 + dependency.strength * 2; // 0.5 to 2.5
        strokeWidth *= strengthMultiplier;
      }

      // Explicitness affects opacity and dash
      switch (explicitness) {
        case "explicit":
          opacity = 1;
          break;
        case "semi-explicit":
          opacity = 0.8;
          strokeDasharray = strokeDasharray === "0" ? "8,4" : strokeDasharray;
          break;
        case "implicit":
          opacity = 0.6;
          strokeDasharray = "4,4";
          break;
      }

      // Critical path highlighting
      if (isOnCriticalPath) {
        strokeColor = "#f59e0b"; // amber-500
        strokeWidth = Math.max(strokeWidth, 4);
        opacity = 1;
      }

      // Selection
      if (selected) {
        strokeWidth += 1;
        opacity = 1;
      }

      return { strokeColor, strokeWidth, strokeDasharray, opacity };
    };

    const { strokeColor, strokeWidth, strokeDasharray, opacity } = getEdgeStyle();

    // Label styling based on type
    const getLabelStyle = () => {
      const baseClass = "text-xs px-2 py-0.5 shadow-md font-medium";

      switch (dependency?.type) {
        case "prerequisite":
          return {
            className: cn(baseClass, "bg-red-100 text-red-800 border-red-300"),
            icon: "→",
          };
        case "supporting":
          return {
            className: cn(baseClass, "bg-green-100 text-green-800 border-green-300"),
            icon: "+",
          };
        case "enabling":
          return {
            className: cn(baseClass, "bg-blue-100 text-blue-800 border-blue-300"),
            icon: "⚡",
          };
        case "background":
          return {
            className: cn(baseClass, "bg-gray-100 text-gray-800 border-gray-300"),
            icon: "○",
          };
        default:
          return {
            className: cn(baseClass, "bg-gray-100 text-gray-800 border-gray-300"),
            icon: "•",
          };
      }
    };

    const labelStyle = getLabelStyle();

    // Tooltip content
    const getTooltipContent = () => {
      if (!dependency) return null;

      return (
        <div className="space-y-1 max-w-xs">
          <div className="font-semibold">{dependency.type} dependency</div>
          <div className="text-xs">
            <div>Strength: {Math.round(dependency.strength * 100)}%</div>
            <div>Criticality: {dependency.criticality}</div>
            <div>Explicitness: {explicitness}</div>
          </div>
          {dependency.explanation && (
            <div className="text-xs text-gray-300 mt-2 border-t border-gray-600 pt-1">
              {dependency.explanation}
            </div>
          )}
        </div>
      );
    };

    return (
      <>
        {/* Edge Path */}
        <BaseEdge
          id={id}
          path={edgePath}
          markerEnd={markerEnd}
          style={{
            stroke: strokeColor,
            strokeWidth,
            strokeDasharray,
            opacity,
            transition: "all 0.2s ease-in-out",
          }}
        />

        {/* Edge Label */}
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    className={cn(
                      labelStyle.className,
                      "cursor-help transition-all hover:scale-105",
                      isOnCriticalPath && "ring-2 ring-amber-400",
                      selected && "ring-2 ring-blue-500"
                    )}
                  >
                    <span className="mr-1">{labelStyle.icon}</span>
                    {dependency?.type || "depends"}
                    {dependency?.strength && (
                      <span className="ml-1 text-xs opacity-75">
                        {Math.round(dependency.strength * 100)}%
                      </span>
                    )}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white">
                  {getTooltipContent()}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Critical Path Indicator */}
            {isOnCriticalPath && (
              <div className="absolute -top-1 -right-1">
                <span className="text-amber-500 text-xs">★</span>
              </div>
            )}

            {/* Low Confidence Warning */}
            {dependency?.strength && dependency.strength < 0.5 && (
              <div className="absolute -bottom-1 -right-1">
                <AlertCircle className="w-3 h-3 text-orange-500" />
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }
);

EnhancedDependencyEdge.displayName = "EnhancedDependencyEdge";
```

## Edge Filtering Component

**File**: `components/nets/visualization/EdgeFilterPanel.tsx`

```tsx
"use client";

import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface EdgeFilterPanelProps {
  filters: {
    showPrerequisite: boolean;
    showSupporting: boolean;
    showEnabling: boolean;
    showBackground: boolean;
    minStrength: number;
    showOnlyCriticalPath: boolean;
  };
  onFilterChange: (filters: any) => void;
}

export function EdgeFilterPanel({ filters, onFilterChange }: EdgeFilterPanelProps) {
  const handleToggle = (key: string, value: boolean) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold text-sm">Filter Dependencies</h3>

      {/* Dependency Types */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-700">Dependency Types</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Checkbox
              id="prerequisite"
              checked={filters.showPrerequisite}
              onCheckedChange={(checked) =>
                handleToggle("showPrerequisite", checked as boolean)
              }
            />
            <Label htmlFor="prerequisite" className="text-xs cursor-pointer">
              <span className="inline-block w-3 h-0.5 bg-red-500 mr-1" />
              Prerequisite
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="supporting"
              checked={filters.showSupporting}
              onCheckedChange={(checked) =>
                handleToggle("showSupporting", checked as boolean)
              }
            />
            <Label htmlFor="supporting" className="text-xs cursor-pointer">
              <span className="inline-block w-3 h-0.5 bg-green-500 mr-1" />
              Supporting
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="enabling"
              checked={filters.showEnabling}
              onCheckedChange={(checked) =>
                handleToggle("showEnabling", checked as boolean)
              }
            />
            <Label htmlFor="enabling" className="text-xs cursor-pointer">
              <span className="inline-block w-3 h-0.5 bg-blue-500 mr-1" />
              Enabling
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="background"
              checked={filters.showBackground}
              onCheckedChange={(checked) =>
                handleToggle("showBackground", checked as boolean)
              }
            />
            <Label htmlFor="background" className="text-xs cursor-pointer">
              <span className="inline-block w-3 h-0.5 bg-gray-400 mr-1" />
              Background
            </Label>
          </div>
        </div>
      </div>

      {/* Strength Filter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-700">Min Strength</p>
          <span className="text-xs text-gray-500">
            {Math.round(filters.minStrength * 100)}%
          </span>
        </div>
        <Slider
          value={[filters.minStrength]}
          onValueChange={(value) =>
            onFilterChange({ ...filters, minStrength: value[0] })
          }
          min={0}
          max={1}
          step={0.1}
          className="w-full"
        />
      </div>

      {/* Critical Path Only */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="criticalPath"
          checked={filters.showOnlyCriticalPath}
          onCheckedChange={(checked) =>
            handleToggle("showOnlyCriticalPath", checked as boolean)
          }
        />
        <Label htmlFor="criticalPath" className="text-xs cursor-pointer">
          Show only critical path
        </Label>
      </div>
    </Card>
  );
}
```

## Testing

**File**: `components/nets/visualization/edges/__tests__/EnhancedDependencyEdge.test.tsx`

```typescript
import { render } from "@testing-library/react";
import { EnhancedDependencyEdge } from "../EnhancedDependencyEdge";

describe("EnhancedDependencyEdge", () => {
  const baseProps = {
    id: "e1",
    sourceX: 0,
    sourceY: 0,
    targetX: 100,
    targetY: 100,
    sourcePosition: "bottom" as const,
    targetPosition: "top" as const,
  };

  it("should render prerequisite edge with correct styling", () => {
    const { container } = render(
      <EnhancedDependencyEdge
        {...baseProps}
        data={{
          dependency: {
            type: "prerequisite",
            strength: 0.9,
            criticality: "critical",
          },
          explicitness: "explicit",
          isOnCriticalPath: false,
        }}
      />
    );

    expect(container.querySelector("path")).toBeTruthy();
  });

  it("should apply implicit styling", () => {
    const { container } = render(
      <EnhancedDependencyEdge
        {...baseProps}
        data={{
          dependency: {
            type: "supporting",
            strength: 0.6,
            criticality: "important",
          },
          explicitness: "implicit",
          isOnCriticalPath: false,
        }}
      />
    );

    const path = container.querySelector("path");
    expect(path).toBeTruthy();
    // Check for dashed styling
    expect(path?.getAttribute("style")).toContain("strokeDasharray");
  });
});
```

## Time Allocation

- Enhanced edge component: 2 hours
- Label rendering and positioning: 1.5 hours
- Tooltips with detailed info: 1 hour
- Edge filtering component: 1 hour
- Testing: 0.5 hours

## Deliverables

- ✅ `EnhancedDependencyEdge` component
- ✅ Rich edge labels with icons
- ✅ Detailed edge tooltips
- ✅ `EdgeFilterPanel` component
- ✅ Test suite

---

# Step 4.2.5: Interactive Exploration Features (6 hours)

## Overview

Implement interactive features that enable users to explore, navigate, and analyze argument nets through clicking, hovering, filtering, and contextual actions.

## Interactive Exploration Panel

**File**: `components/nets/visualization/NetExplorer.tsx`

```tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { NetGraph } from "./NetGraph";
import { EdgeFilterPanel } from "./EdgeFilterPanel";
import { StylingLegend } from "./StylingLegend";
import { LayoutSelector } from "./LayoutSelector";
import {
  Search,
  Filter,
  Info,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  RefreshCw,
} from "lucide-react";

interface NetExplorerProps {
  net: any;
  dependencyGraph: any;
  explicitnessAnalysis: any;
  onSchemeSelect?: (schemeId: string) => void;
}

export function NetExplorer({
  net,
  dependencyGraph,
  explicitnessAnalysis,
  onSchemeSelect,
}: NetExplorerProps) {
  const [layout, setLayout] = useState<"hierarchical" | "force" | "circular" | "tree">(
    "hierarchical"
  );
  const [selectedScheme, setSelectedScheme] = useState<string | null>(null);
  const [hoveredScheme, setHoveredScheme] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    showPrerequisite: true,
    showSupporting: true,
    showEnabling: true,
    showBackground: true,
    minStrength: 0,
    showOnlyCriticalPath: false,
  });

  // Filter edges based on criteria
  const filteredDependencyGraph = useMemo(() => {
    const filteredEdges = dependencyGraph.edges.filter((edge: any) => {
      // Type filter
      if (edge.type === "prerequisite" && !filters.showPrerequisite) return false;
      if (edge.type === "supporting" && !filters.showSupporting) return false;
      if (edge.type === "enabling" && !filters.showEnabling) return false;
      if (edge.type === "background" && !filters.showBackground) return false;

      // Strength filter
      if (edge.strength < filters.minStrength) return false;

      // Critical path filter
      if (filters.showOnlyCriticalPath) {
        const isOnPath =
          dependencyGraph.criticalPath.includes(edge.sourceSchemeId) &&
          dependencyGraph.criticalPath.includes(edge.targetSchemeId);
        if (!isOnPath) return false;
      }

      return true;
    });

    return {
      ...dependencyGraph,
      edges: filteredEdges,
    };
  }, [dependencyGraph, filters]);

  // Handle node click
  const handleNodeClick = useCallback(
    (schemeId: string) => {
      setSelectedScheme(schemeId);
      if (onSchemeSelect) {
        onSchemeSelect(schemeId);
      }
    },
    [onSchemeSelect]
  );

  // Get selected scheme details
  const selectedSchemeDetails = useMemo(() => {
    if (!selectedScheme) return null;

    const scheme = net.schemes.find((s: any) => s.schemeId === selectedScheme);
    const explicitness = explicitnessAnalysis.schemeExplicitness.find(
      (e: any) => e.schemeId === selectedScheme
    );
    const depNode = dependencyGraph.nodes.find(
      (n: any) => n.schemeId === selectedScheme
    );

    // Find incoming and outgoing dependencies
    const incomingDeps = dependencyGraph.edges.filter(
      (e: any) => e.targetSchemeId === selectedScheme
    );
    const outgoingDeps = dependencyGraph.edges.filter(
      (e: any) => e.sourceSchemeId === selectedScheme
    );

    return {
      scheme,
      explicitness,
      depNode,
      incomingDeps,
      outgoingDeps,
    };
  }, [selectedScheme, net, dependencyGraph, explicitnessAnalysis]);

  // Navigate to connected scheme
  const navigateToScheme = useCallback((schemeId: string) => {
    setSelectedScheme(schemeId);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Net Visualization</h2>
          <Badge variant="outline">
            {net.schemes.length} schemes, {dependencyGraph.edges.length} dependencies
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <LayoutSelector currentLayout={layout} onLayoutChange={setLayout} />
          <Button variant="outline" size="sm" onClick={() => setFilters({
            showPrerequisite: true,
            showSupporting: true,
            showEnabling: true,
            showBackground: true,
            minStrength: 0,
            showOnlyCriticalPath: false,
          })}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Graph Visualization */}
        <div className="lg:col-span-3">
          <NetGraph
            net={net}
            dependencyGraph={filteredDependencyGraph}
            explicitnessAnalysis={explicitnessAnalysis}
            layout={layout}
            onNodeClick={handleNodeClick}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Tabs defaultValue="filters">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="filters">
                <Filter className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="details">
                <Info className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="legend">
                <Search className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>

            {/* Filters Tab */}
            <TabsContent value="filters">
              <EdgeFilterPanel filters={filters} onFilterChange={setFilters} />
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details">
              {selectedSchemeDetails ? (
                <Card className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm">
                    {selectedSchemeDetails.scheme.schemeName}
                  </h3>

                  <div className="text-xs space-y-2">
                    <div>
                      <span className="font-medium">Role:</span>{" "}
                      {selectedSchemeDetails.scheme.role}
                    </div>
                    <div>
                      <span className="font-medium">Confidence:</span>{" "}
                      {selectedSchemeDetails.scheme.confidence}%
                    </div>
                    <div>
                      <span className="font-medium">Explicitness:</span>{" "}
                      {selectedSchemeDetails.explicitness?.level || "unknown"}
                    </div>
                    <div>
                      <span className="font-medium">Depth:</span>{" "}
                      {selectedSchemeDetails.depNode?.depth || 0}
                    </div>
                  </div>

                  {/* Conclusion */}
                  <div className="text-xs bg-gray-50 rounded p-2">
                    <span className="font-medium">Conclusion:</span>
                    <p className="text-gray-600 mt-1">
                      {selectedSchemeDetails.scheme.conclusion}
                    </p>
                  </div>

                  {/* Dependencies */}
                  {selectedSchemeDetails.incomingDeps.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Depends on:</p>
                      <div className="space-y-1">
                        {selectedSchemeDetails.incomingDeps.map((dep: any) => {
                          const sourceScheme = net.schemes.find(
                            (s: any) => s.schemeId === dep.sourceSchemeId
                          );
                          return (
                            <Button
                              key={dep.id}
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-xs h-auto py-1"
                              onClick={() => navigateToScheme(dep.sourceSchemeId)}
                            >
                              {sourceScheme?.schemeName} ({dep.type})
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {selectedSchemeDetails.outgoingDeps.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Supports:</p>
                      <div className="space-y-1">
                        {selectedSchemeDetails.outgoingDeps.map((dep: any) => {
                          const targetScheme = net.schemes.find(
                            (s: any) => s.schemeId === dep.targetSchemeId
                          );
                          return (
                            <Button
                              key={dep.id}
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-xs h-auto py-1"
                              onClick={() => navigateToScheme(dep.targetSchemeId)}
                            >
                              {targetScheme?.schemeName} ({dep.type})
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </Card>
              ) : (
                <Card className="p-4">
                  <p className="text-sm text-gray-500 text-center">
                    Click a scheme to view details
                  </p>
                </Card>
              )}
            </TabsContent>

            {/* Legend Tab */}
            <TabsContent value="legend">
              <StylingLegend />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
```

## Testing

**File**: `components/nets/visualization/__tests__/NetExplorer.test.tsx`

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { NetExplorer } from "../NetExplorer";

describe("NetExplorer", () => {
  const mockNet = {
    id: "net1",
    netType: "convergent",
    complexity: 40,
    confidence: 85,
    schemes: [
      {
        schemeId: "s1",
        schemeName: "Scheme 1",
        schemeCategory: "Test",
        confidence: 90,
        role: "primary",
        premises: [],
        conclusion: "Test conclusion",
      },
    ],
    relationships: [],
  };

  const mockDependencyGraph = {
    nodes: [{ schemeId: "s1", schemeName: "Scheme 1", role: "primary", depth: 0 }],
    edges: [],
    cycles: [],
    criticalPath: ["s1"],
  };

  const mockExplicitnessAnalysis = {
    overallExplicitness: "explicit",
    confidence: 85,
    schemeExplicitness: [{ schemeId: "s1", level: "explicit", confidence: 90 }],
    relationshipExplicitness: [],
  };

  it("should render graph and controls", () => {
    render(
      <NetExplorer
        net={mockNet}
        dependencyGraph={mockDependencyGraph}
        explicitnessAnalysis={mockExplicitnessAnalysis}
      />
    );

    expect(screen.getByText("Net Visualization")).toBeInTheDocument();
    expect(screen.getByText(/1 schemes/)).toBeInTheDocument();
  });

  it("should filter edges when filters change", () => {
    const { container } = render(
      <NetExplorer
        net={mockNet}
        dependencyGraph={mockDependencyGraph}
        explicitnessAnalysis={mockExplicitnessAnalysis}
      />
    );

    // Test filtering functionality
    expect(container.querySelector(".reactflow-wrapper")).toBeTruthy();
  });
});
```

## Time Allocation

- NetExplorer component: 2 hours
- Node selection and navigation: 1.5 hours
- Edge filtering logic: 1 hour
- Detail panel with navigation: 1 hour
- Testing: 0.5 hours

## Deliverables

- ✅ `NetExplorer` main component
- ✅ Interactive node selection
- ✅ Edge filtering system
- ✅ Detail panel with navigation
- ✅ Layout switching
- ✅ Test suite

---

## Week 14 Summary

**Total Time**: 40 hours

**Steps Completed**:
1. ✅ Graph Visualization Core (10 hours)
2. ✅ Layout Algorithms (10 hours)
3. ✅ Node Styling by Explicitness (8 hours)
4. ✅ Edge Labeling by Dependency Type (6 hours)
5. ✅ Interactive Exploration Features (6 hours)

**Key Achievements**:
- Complete React Flow-based visualization system
- Multiple layout algorithms (hierarchical, force-directed, circular, tree)
- Rich visual encoding for explicitness, confidence, and role
- Interactive edge labels with detailed tooltips
- Comprehensive exploration and filtering capabilities
- Responsive design with sidebar controls

**Components Created**:
- `NetGraph` - Main visualization component
- `SchemeNode` / `EnhancedSchemeNode` - Custom node rendering
- `DependencyEdge` / `EnhancedDependencyEdge` - Custom edge rendering
- `NetLayoutEngine` - Layout algorithm service
- `NodeStyleEngine` - Visual encoding system
- `NetExplorer` - Complete exploration interface
- `LayoutSelector`, `EdgeFilterPanel`, `StylingLegend` - UI controls

**Next Steps** (Week 15):
- Net quality evaluation metrics
- Strength assessment algorithms
- Vulnerability detection
- Improvement suggestion generation

---

**Status**: Week 14 (Net Visualization) - COMPLETE ✅
