# ArgumentChain Implementation Roadmap - Phase 2

**Phase 2: Visual Editor & UX**  
**Duration**: 2-3 weeks  
**Goal**: Professional ReactFlow-based visual editor with drag & drop  
**Prerequisite**: Phase 1 complete (database schema + APIs)

---

## Table of Contents

- [Part 3: Phase 2 Overview](#part-3-phase-2-overview)
- [ReactFlow Setup & Configuration](#reactflow-setup--configuration)
- [Custom Node Components](#custom-node-components)
- [Custom Edge Components](#custom-edge-components)
- [Argument Palette Sidebar](#argument-palette-sidebar)
- [Main Canvas Container](#main-canvas-container)
- [Drag & Drop Implementation](#drag--drop-implementation)
- [Connection Editor Modal](#connection-editor-modal)

---

## Part 3: Phase 2 Overview

### Phase 2 Goals

**What We're Building**:
A visual graph editor that allows users to:
1. Drag arguments from a palette onto a canvas
2. Connect arguments with typed edges
3. Edit node positions, roles, and connections
4. See real-time visual feedback
5. Auto-arrange nodes with layout algorithms
6. Export chains as images

**Key Technologies**:
- **ReactFlow** (v11.10+): Graph visualization library
- **Dagre**: Auto-layout algorithm for DAGs
- **Zustand**: Local state management for canvas
- **React DnD**: Drag and drop (built into ReactFlow)
- **html-to-image**: Export canvas as PNG/SVG

---

### 3.1 Dependencies Installation

#### Task 3.1: Install Required Packages
**File**: `package.json`

```bash
# Install ReactFlow and related packages
npm install reactflow@11.10.4
npm install dagre@0.8.5
npm install @types/dagre@0.7.52 --save-dev
npm install html-to-image@1.11.11
npm install zustand@4.4.7
```

**Verify installation**:
```bash
npm list reactflow dagre html-to-image zustand
```

**Acceptance Criteria**:
- [x] ReactFlow v11.10.4 installed
- [x] Dagre for auto-layout
- [x] html-to-image for export
- [x] Zustand for state management
- [x] Type definitions for TypeScript

**Estimated Time**: 0.5 hours

---

### 3.2 ReactFlow Setup & Configuration

#### Task 3.2: Create ReactFlow Utilities
**File**: `lib/utils/chainLayoutUtils.ts`

```typescript
import dagre from "dagre";
import { Node, Edge, Position } from "reactflow";

export const NODE_WIDTH = 280;
export const NODE_HEIGHT = 180;

/**
 * Auto-layout nodes using Dagre algorithm
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB" // Top-to-Bottom or Left-to-Right
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 100,
    ranksep: 150,
  });

  // Add nodes to dagre
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: NODE_WIDTH, 
      height: NODE_HEIGHT 
    });
  });

  // Add edges to dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

/**
 * Calculate bounding box of all nodes
 */
export function getNodesBounds(nodes: Node[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + NODE_WIDTH);
    maxY = Math.max(maxY, node.position.y + NODE_HEIGHT);
  });

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Center viewport on nodes
 */
export function centerViewport(
  nodes: Node[],
  viewportWidth: number,
  viewportHeight: number
): { x: number; y: number; zoom: number } {
  const bounds = getNodesBounds(nodes);
  
  if (bounds.width === 0 || bounds.height === 0) {
    return { x: 0, y: 0, zoom: 1 };
  }

  // Calculate zoom to fit all nodes with padding
  const padding = 50;
  const zoomX = (viewportWidth - padding * 2) / bounds.width;
  const zoomY = (viewportHeight - padding * 2) / bounds.height;
  const zoom = Math.min(zoomX, zoomY, 1); // Max zoom is 1

  // Calculate center position
  const centerX = bounds.minX + bounds.width / 2;
  const centerY = bounds.minY + bounds.height / 2;

  const x = viewportWidth / 2 - centerX * zoom;
  const y = viewportHeight / 2 - centerY * zoom;

  return { x, y, zoom };
}

/**
 * Find optimal position for new node
 */
export function getNewNodePosition(
  existingNodes: Node[],
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  // If no nodes, place in center
  if (existingNodes.length === 0) {
    return {
      x: canvasWidth / 2 - NODE_WIDTH / 2,
      y: canvasHeight / 2 - NODE_HEIGHT / 2,
    };
  }

  // Find bottom-most node and place below it
  const maxY = Math.max(...existingNodes.map((n) => n.position.y));
  return {
    x: canvasWidth / 2 - NODE_WIDTH / 2,
    y: maxY + NODE_HEIGHT + 100,
  };
}
```

**Acceptance Criteria**:
- [x] Dagre layout algorithm implemented
- [x] Supports vertical (TB) and horizontal (LR) layouts
- [x] Calculates bounding box of nodes
- [x] Centers viewport on nodes
- [x] Finds optimal position for new nodes

**Estimated Time**: 2 hours

---

#### Task 3.3: Create Chain Store (Zustand)
**File**: `lib/stores/chainEditorStore.ts`

```typescript
import { create } from "zustand";
import { Node, Edge, OnNodesChange, OnEdgesChange, applyNodeChanges, applyEdgeChanges } from "reactflow";
import { ChainNodeData, ChainEdgeData } from "@/lib/types/argumentChain";

interface ChainEditorState {
  // Canvas state
  nodes: Node<ChainNodeData>[];
  edges: Edge<ChainEdgeData>[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  
  // UI state
  showConnectionEditor: boolean;
  pendingConnection: {
    sourceNodeId: string;
    targetNodeId: string;
  } | null;
  
  // Metadata
  chainId: string | null;
  chainName: string;
  chainType: "SERIAL" | "CONVERGENT" | "DIVERGENT" | "TREE" | "GRAPH";
  isPublic: boolean;
  isEditable: boolean;
  
  // Actions
  setNodes: (nodes: Node<ChainNodeData>[]) => void;
  setEdges: (edges: Edge<ChainEdgeData>[]) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  
  addNode: (node: Node<ChainNodeData>) => void;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, data: Partial<ChainNodeData>) => void;
  
  addEdge: (edge: Edge<ChainEdgeData>) => void;
  removeEdge: (edgeId: string) => void;
  updateEdge: (edgeId: string, data: Partial<ChainEdgeData>) => void;
  
  setSelectedNode: (nodeId: string | null) => void;
  setSelectedEdge: (edgeId: string | null) => void;
  
  openConnectionEditor: (sourceId: string, targetId: string) => void;
  closeConnectionEditor: () => void;
  
  setChainMetadata: (metadata: {
    chainId?: string;
    chainName?: string;
    chainType?: "SERIAL" | "CONVERGENT" | "DIVERGENT" | "TREE" | "GRAPH";
    isPublic?: boolean;
    isEditable?: boolean;
  }) => void;
  
  reset: () => void;
}

const initialState = {
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  showConnectionEditor: false,
  pendingConnection: null,
  chainId: null,
  chainName: "",
  chainType: "SERIAL" as const,
  isPublic: false,
  isEditable: false,
};

export const useChainEditorStore = create<ChainEditorState>((set, get) => ({
  ...initialState,
  
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  
  addNode: (node) => {
    set((state) => ({
      nodes: [...state.nodes, node],
    }));
  },
  
  removeNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    }));
  },
  
  updateNode: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    }));
  },
  
  addEdge: (edge) => {
    set((state) => ({
      edges: [...state.edges, edge],
    }));
  },
  
  removeEdge: (edgeId) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
      selectedEdgeId: state.selectedEdgeId === edgeId ? null : state.selectedEdgeId,
    }));
  },
  
  updateEdge: (edgeId, data) => {
    set((state) => ({
      edges: state.edges.map((e) =>
        e.id === edgeId ? { ...e, data: { ...e.data, ...data } } : e
      ),
    }));
  },
  
  setSelectedNode: (nodeId) => {
    set({ selectedNodeId: nodeId, selectedEdgeId: null });
  },
  
  setSelectedEdge: (edgeId) => {
    set({ selectedEdgeId: edgeId, selectedNodeId: null });
  },
  
  openConnectionEditor: (sourceId, targetId) => {
    set({
      showConnectionEditor: true,
      pendingConnection: { sourceNodeId: sourceId, targetNodeId: targetId },
    });
  },
  
  closeConnectionEditor: () => {
    set({
      showConnectionEditor: false,
      pendingConnection: null,
    });
  },
  
  setChainMetadata: (metadata) => {
    set(metadata);
  },
  
  reset: () => set(initialState),
}));
```

**Acceptance Criteria**:
- [x] Zustand store for canvas state
- [x] Node/edge CRUD operations
- [x] Selection state management
- [x] Connection editor state
- [x] Chain metadata state
- [x] Reset functionality

**Estimated Time**: 1.5 hours

---

### 3.3 Custom Node Components

#### Task 3.4: Create ArgumentChainNode Component
**File**: `components/chains/ArgumentChainNode.tsx`

```typescript
"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ChainNodeData } from "@/lib/types/argumentChain";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Tag, Network, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

function ArgumentChainNodeComponent({ data, selected, id }: NodeProps<ChainNodeData>) {
  const { argument, role, addedBy, nodeOrder } = data;

  const handleRemove = () => {
    // Will be connected to store action
    console.log("Remove node:", id);
  };

  const handleViewDetails = () => {
    console.log("View details:", id);
  };

  // Role colors
  const roleColors: Record<string, string> = {
    PREMISE: "bg-blue-100 text-blue-800 border-blue-200",
    EVIDENCE: "bg-green-100 text-green-800 border-green-200",
    CONCLUSION: "bg-purple-100 text-purple-800 border-purple-200",
    OBJECTION: "bg-red-100 text-red-800 border-red-200",
    REBUTTAL: "bg-orange-100 text-orange-800 border-orange-200",
    QUALIFIER: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };

  return (
    <div
      className={cn(
        "bg-background border-2 rounded-lg shadow-lg",
        "w-[280px] transition-all duration-200",
        selected && "border-primary ring-2 ring-primary/20 shadow-xl",
        !selected && "border-border hover:border-primary/50 hover:shadow-xl"
      )}
    >
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-primary border-2 border-background"
      />

      {/* Header */}
      <div className="border-b p-3 bg-muted/50">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {role && (
              <Badge
                variant="outline"
                className={cn("mb-1", roleColors[role] || "bg-gray-100")}
              >
                {role}
              </Badge>
            )}
            <h4 className="font-semibold text-sm line-clamp-2 break-words">
              {argument.conclusion}
            </h4>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleViewDetails}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRemove} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Remove from Chain
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2 text-xs">
        {/* Author */}
        <div className="flex items-center gap-2">
          <Avatar className="h-5 w-5">
            <AvatarImage src={argument.author.image || undefined} />
            <AvatarFallback className="text-xs">
              {argument.author.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-muted-foreground truncate">
            {argument.author.name}
          </span>
        </div>

        {/* Schemes Count */}
        {argument.schemes && argument.schemes.length > 0 && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Tag className="h-3 w-3" />
            <span>
              {argument.schemes.length} scheme{argument.schemes.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* SchemeNet Indicator */}
        {argument.schemeNet && (
          <div className="flex items-center gap-1 text-blue-600">
            <Network className="h-3 w-3" />
            <span>
              Has reasoning chain ({argument.schemeNet.steps.length} steps)
            </span>
          </div>
        )}

        {/* Added By */}
        <div className="pt-1 border-t text-muted-foreground">
          Added by {addedBy.name}
        </div>
      </div>

      {/* Footer - Node Order Badge */}
      <div className="px-3 pb-2">
        <Badge variant="secondary" className="text-xs">
          #{nodeOrder}
        </Badge>
      </div>

      {/* Connection Handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-primary border-2 border-background"
      />
    </div>
  );
}

export const ArgumentChainNode = memo(ArgumentChainNodeComponent);
```

**Acceptance Criteria**:
- [x] Displays argument conclusion as title
- [x] Shows role badge with color coding
- [x] Displays author avatar and name
- [x] Shows scheme count and SchemeNet indicator
- [x] Node order badge
- [x] Action menu (view details, remove)
- [x] Connection handles (top and bottom)
- [x] Selected state styling
- [x] Responsive width (280px)

**Estimated Time**: 3 hours

---

#### Task 3.5: Create Node Variants for Different Roles
**File**: `components/chains/ArgumentChainNode.tsx` (add styling variants)

```typescript
// Add to existing component - enhanced styling based on role

const getRoleStyling = (role?: string) => {
  switch (role) {
    case "PREMISE":
      return "border-l-4 border-l-blue-500";
    case "EVIDENCE":
      return "border-l-4 border-l-green-500";
    case "CONCLUSION":
      return "border-l-4 border-l-purple-500";
    case "OBJECTION":
      return "border-l-4 border-l-red-500";
    case "REBUTTAL":
      return "border-l-4 border-l-orange-500";
    case "QUALIFIER":
      return "border-l-4 border-l-yellow-500";
    default:
      return "border-l-4 border-l-gray-300";
  }
};

// Update main div className
<div
  className={cn(
    "bg-background border-2 rounded-lg shadow-lg",
    "w-[280px] transition-all duration-200",
    getRoleStyling(role), // Add role-based left border
    selected && "border-primary ring-2 ring-primary/20 shadow-xl",
    !selected && "border-border hover:border-primary/50 hover:shadow-xl"
  )}
>
```

**Acceptance Criteria**:
- [x] Left border color indicates role
- [x] Consistent visual hierarchy
- [x] Easy to distinguish at a glance

**Estimated Time**: 0.5 hours

---

### 3.4 Custom Edge Components

#### Task 3.6: Create ArgumentChainEdge Component
**File**: `components/chains/ArgumentChainEdge.tsx`

```typescript
"use client";

import React, { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  useReactFlow,
} from "reactflow";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { ChainEdgeData } from "@/lib/types/argumentChain";
import { cn } from "@/lib/utils";

function ArgumentChainEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<ChainEdgeData>) {
  const { setEdges } = useReactFlow();
  const { edgeType, strength, description } = data || {};

  // Color based on edge type
  const edgeColors: Record<string, string> = {
    SUPPORTS: "#22c55e", // green
    ENABLES: "#3b82f6", // blue
    PRESUPPOSES: "#a855f7", // purple
    REFUTES: "#ef4444", // red
    QUALIFIES: "#f59e0b", // amber
    EXEMPLIFIES: "#14b8a6", // teal
    GENERALIZES: "#8b5cf6", // violet
  };

  const edgeColor = edgeColors[edgeType || "SUPPORTS"] || "#64748b";

  // Stroke width based on strength
  const strokeWidth = 1 + (strength || 1) * 3; // 1-4px

  // Calculate path
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleRemove = () => {
    setEdges((edges) => edges.filter((e) => e.id !== id));
  };

  // Format edge type for display
  const formatEdgeType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <>
      {/* Main edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: selected ? strokeWidth + 1 : strokeWidth,
          opacity: selected ? 1 : 0.8,
        }}
        markerEnd={`url(#arrow-${edgeType || "default"})`}
      />

      {/* Edge label */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          <div
            className={cn(
              "bg-background border rounded px-2 py-1 shadow-sm",
              "flex items-center gap-2 text-xs",
              selected && "ring-2 ring-primary/20"
            )}
          >
            <Badge
              variant="outline"
              style={{
                borderColor: edgeColor,
                color: edgeColor,
              }}
            >
              {formatEdgeType(edgeType || "SUPPORTS")}
            </Badge>

            {strength !== undefined && strength < 1 && (
              <span className="text-muted-foreground">
                {Math.round(strength * 100)}%
              </span>
            )}

            {selected && (
              <Button
                size="sm"
                variant="ghost"
                className="h-4 w-4 p-0"
                onClick={handleRemove}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Description tooltip on hover */}
          {description && selected && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-48 bg-popover text-popover-foreground text-xs p-2 rounded border shadow-lg z-50">
              {description}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>

      {/* Arrow marker definitions */}
      <defs>
        <marker
          id={`arrow-${edgeType || "default"}`}
          markerWidth="12"
          markerHeight="12"
          viewBox="-10 -10 20 20"
          refX="0"
          refY="0"
          orient="auto"
        >
          <polyline
            stroke={edgeColor}
            strokeWidth="1"
            fill={edgeColor}
            points="-5,-4 0,0 -5,4 -5,-4"
          />
        </marker>
      </defs>
    </>
  );
}

export const ArgumentChainEdge = memo(ArgumentChainEdgeComponent);
```

**Acceptance Criteria**:
- [x] Color-coded by edge type
- [x] Stroke width based on strength
- [x] Edge label with type badge
- [x] Strength percentage display (if < 100%)
- [x] Delete button when selected
- [x] Description tooltip on hover
- [x] Animated arrow marker
- [x] Selected state styling

**Estimated Time**: 2.5 hours

---

#### Task 3.7: Create Edge Type Definitions
**File**: `lib/constants/chainEdgeTypes.ts`

```typescript
export const EDGE_TYPE_LABELS: Record<string, string> = {
  SUPPORTS: "Supports",
  ENABLES: "Enables",
  PRESUPPOSES: "Presupposes",
  REFUTES: "Refutes",
  QUALIFIES: "Qualifies",
  EXEMPLIFIES: "Exemplifies",
  GENERALIZES: "Generalizes",
};

export const EDGE_TYPE_DESCRIPTIONS: Record<string, string> = {
  SUPPORTS: "Source's conclusion becomes Target's premise",
  ENABLES: "Source makes Target's claim possible",
  PRESUPPOSES: "Target assumes Source is true",
  REFUTES: "Source challenges Target",
  QUALIFIES: "Source adds conditions to Target",
  EXEMPLIFIES: "Source is example of Target's general claim",
  GENERALIZES: "Source abstracts from Target's specific case",
};

export const EDGE_TYPE_COLORS: Record<string, string> = {
  SUPPORTS: "#22c55e",
  ENABLES: "#3b82f6",
  PRESUPPOSES: "#a855f7",
  REFUTES: "#ef4444",
  QUALIFIES: "#f59e0b",
  EXEMPLIFIES: "#14b8a6",
  GENERALIZES: "#8b5cf6",
};

export type EdgeTypeOption = {
  value: string;
  label: string;
  description: string;
  color: string;
};

export const EDGE_TYPE_OPTIONS: EdgeTypeOption[] = [
  {
    value: "SUPPORTS",
    label: EDGE_TYPE_LABELS.SUPPORTS,
    description: EDGE_TYPE_DESCRIPTIONS.SUPPORTS,
    color: EDGE_TYPE_COLORS.SUPPORTS,
  },
  {
    value: "ENABLES",
    label: EDGE_TYPE_LABELS.ENABLES,
    description: EDGE_TYPE_DESCRIPTIONS.ENABLES,
    color: EDGE_TYPE_COLORS.ENABLES,
  },
  {
    value: "PRESUPPOSES",
    label: EDGE_TYPE_LABELS.PRESUPPOSES,
    description: EDGE_TYPE_DESCRIPTIONS.PRESUPPOSES,
    color: EDGE_TYPE_COLORS.PRESUPPOSES,
  },
  {
    value: "REFUTES",
    label: EDGE_TYPE_LABELS.REFUTES,
    description: EDGE_TYPE_DESCRIPTIONS.REFUTES,
    color: EDGE_TYPE_COLORS.REFUTES,
  },
  {
    value: "QUALIFIES",
    label: EDGE_TYPE_LABELS.QUALIFIES,
    description: EDGE_TYPE_DESCRIPTIONS.QUALIFIES,
    color: EDGE_TYPE_COLORS.QUALIFIES,
  },
  {
    value: "EXEMPLIFIES",
    label: EDGE_TYPE_LABELS.EXEMPLIFIES,
    description: EDGE_TYPE_DESCRIPTIONS.EXEMPLIFIES,
    color: EDGE_TYPE_COLORS.EXEMPLIFIES,
  },
  {
    value: "GENERALIZES",
    label: EDGE_TYPE_LABELS.GENERALIZES,
    description: EDGE_TYPE_DESCRIPTIONS.GENERALIZES,
    color: EDGE_TYPE_COLORS.GENERALIZES,
  },
];
```

**Estimated Time**: 0.5 hours

---

### 3.5 Argument Palette Sidebar

#### Task 3.8: Create Argument Palette Component
**File**: `components/chains/ArgumentPalette.tsx`

```typescript
"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, User, Tag, Network } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ArgumentCardProps {
  argument: any; // Full Argument type
  onDragStart: (argument: any) => void;
  onDoubleClick: (argument: any) => void;
  isInChain: boolean;
}

function ArgumentCard({
  argument,
  onDragStart,
  onDoubleClick,
  isInChain,
}: ArgumentCardProps) {
  return (
    <div
      className={cn(
        "p-3 border rounded-lg cursor-move hover:border-primary transition-colors",
        "bg-background hover:bg-accent/50",
        isInChain && "opacity-50 cursor-not-allowed"
      )}
      draggable={!isInChain}
      onDragStart={(e) => {
        if (!isInChain) {
          e.dataTransfer.setData(
            "application/argument",
            JSON.stringify(argument)
          );
          e.dataTransfer.effectAllowed = "move";
          onDragStart(argument);
        }
      }}
      onDoubleClick={() => !isInChain && onDoubleClick(argument)}
      title={isInChain ? "Already in chain" : "Drag to canvas or double-click to add"}
    >
      <div className="space-y-2">
        {/* Conclusion */}
        <p className="text-sm font-medium line-clamp-2">
          {argument.conclusion}
        </p>

        {/* Author */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Avatar className="h-4 w-4">
            <AvatarImage src={argument.author.image || undefined} />
            <AvatarFallback className="text-xs">
              {argument.author.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{argument.author.name}</span>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-2 text-xs">
          {argument.schemes && argument.schemes.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {argument.schemes.length}
            </Badge>
          )}
          {argument.schemeNet && (
            <Badge variant="secondary" className="text-xs text-blue-600">
              <Network className="h-3 w-3 mr-1" />
              Net
            </Badge>
          )}
          {isInChain && (
            <Badge variant="outline" className="text-xs">
              In chain
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

interface ArgumentPaletteProps {
  deliberationId: string;
  arguments: any[];
  argumentsInChain: Set<string>;
  onArgumentAdd: (argument: any) => void;
  onCreateNew: () => void;
}

export function ArgumentPalette({
  deliberationId,
  arguments: allArguments,
  argumentsInChain,
  onArgumentAdd,
  onCreateNew,
}: ArgumentPaletteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [authorFilter, setAuthorFilter] = useState<string>("all");
  const [schemeFilter, setSchemeFilter] = useState<string>("all");

  // Extract unique authors
  const authors = useMemo(() => {
    const authorSet = new Map();
    allArguments.forEach((arg) => {
      if (arg.author) {
        authorSet.set(arg.author.id, arg.author.name);
      }
    });
    return Array.from(authorSet, ([id, name]) => ({ id, name }));
  }, [allArguments]);

  // Filter arguments
  const filteredArguments = useMemo(() => {
    return allArguments.filter((arg) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!arg.conclusion.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Author filter
      if (authorFilter !== "all" && arg.author?.id !== authorFilter) {
        return false;
      }

      // Scheme filter
      if (schemeFilter !== "all") {
        if (schemeFilter === "has-net" && !arg.schemeNet) {
          return false;
        }
        if (schemeFilter === "no-net" && arg.schemeNet) {
          return false;
        }
        // Could add specific scheme type filters here
      }

      return true;
    });
  }, [allArguments, searchQuery, authorFilter, schemeFilter]);

  return (
    <div className="w-80 border-r bg-muted/30 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-2">Available Arguments</h3>
        <p className="text-xs text-muted-foreground">
          Drag arguments onto the canvas or double-click to add
        </p>
      </div>

      {/* Filters */}
      <div className="p-4 space-y-3 border-b">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search arguments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Author Filter */}
        <Select value={authorFilter} onValueChange={setAuthorFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by author" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Authors</SelectItem>
            {authors.map((author) => (
              <SelectItem key={author.id} value={author.id}>
                {author.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Scheme Filter */}
        <Select value={schemeFilter} onValueChange={setSchemeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by scheme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Arguments</SelectItem>
            <SelectItem value="has-net">Has SchemeNet</SelectItem>
            <SelectItem value="no-net">No SchemeNet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Argument List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filteredArguments.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No arguments found
            </div>
          ) : (
            filteredArguments.map((arg) => (
              <ArgumentCard
                key={arg.id}
                argument={arg}
                onDragStart={(argument) => {
                  console.log("Drag started:", argument.id);
                }}
                onDoubleClick={onArgumentAdd}
                isInChain={argumentsInChain.has(arg.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Create New Button */}
      <div className="p-4 border-t">
        <Button variant="outline" className="w-full" onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Argument
        </Button>
      </div>
    </div>
  );
}
```

**Acceptance Criteria**:
- [x] Displays all arguments from deliberation
- [x] Search by conclusion text
- [x] Filter by author
- [x] Filter by SchemeNet status
- [x] Visual indicators (schemes, SchemeNet, already in chain)
- [x] Drag and drop support
- [x] Double-click to add
- [x] Disabled state for arguments already in chain
- [x] Create new argument button

**Estimated Time**: 3 hours

---

**Phase 2 Part 3 Summary**:
- **Total Tasks**: 8 tasks (3.1-3.8)
- **Estimated Time**: 13-15 hours
- **Deliverable**: Core visual components (nodes, edges, palette)

---

## Part 4: Main Canvas & Interactions

### 3.6 Main Canvas Container

#### Task 3.9: Create ChainCanvas Component
**File**: `components/chains/ChainCanvas.tsx`

```typescript
"use client";

import React, { useCallback, useRef, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Connection,
  Node,
  Edge,
  ReactFlowProvider,
  useReactFlow,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { useChainEditorStore } from "@/lib/stores/chainEditorStore";
import { ArgumentChainNode } from "./ArgumentChainNode";
import { ArgumentChainEdge } from "./ArgumentChainEdge";
import { ChainNodeData, ChainEdgeData } from "@/lib/types/argumentChain";
import { getLayoutedElements, getNewNodePosition, NODE_WIDTH, NODE_HEIGHT } from "@/lib/utils/chainLayoutUtils";
import { Button } from "@/components/ui/button";
import { Download, Maximize2, LayoutGrid } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";

// Node and Edge Types
const nodeTypes = {
  argumentChainNode: ArgumentChainNode,
};

const edgeTypes = {
  argumentChainEdge: ArgumentChainEdge,
};

interface ChainCanvasInnerProps {
  onArgumentAdd: (argument: any, position: { x: number; y: number }) => void;
  onConnectionCreate: (connection: Connection) => void;
}

function ChainCanvasInner({
  onArgumentAdd,
  onConnectionCreate,
}: ChainCanvasInnerProps) {
  const reactFlowInstance = useReactFlow();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    setSelectedNode,
    setSelectedEdge,
    openConnectionEditor,
  } = useChainEditorStore();

  // Handle connection - open editor modal
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        openConnectionEditor(connection.source, connection.target);
      }
    },
    [openConnectionEditor]
  );

  // Handle node selection
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  // Handle edge selection
  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      setSelectedEdge(edge.id);
    },
    [setSelectedEdge]
  );

  // Handle canvas click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, [setSelectedNode, setSelectedEdge]);

  // Handle drop from palette
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const argumentData = event.dataTransfer.getData("application/argument");
      if (!argumentData) return;

      const argument = JSON.parse(argumentData);
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      onArgumentAdd(argument, position);
    },
    [reactFlowInstance, onArgumentAdd]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Auto-layout
  const handleAutoLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      "TB"
    );
    
    useChainEditorStore.setState({
      nodes: layoutedNodes,
      edges: layoutedEdges,
    });

    // Fit view after layout
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
    }, 50);

    toast.success("Layout applied");
  }, [nodes, edges, reactFlowInstance]);

  // Fit view
  const handleFitView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
  }, [reactFlowInstance]);

  // Export as PNG
  const handleExport = useCallback(async () => {
    if (!canvasRef.current) return;

    try {
      const dataUrl = await toPng(canvasRef.current, {
        backgroundColor: "#ffffff",
        filter: (node) => {
          // Exclude controls and minimap from export
          if (node.classList?.contains("react-flow__controls")) return false;
          if (node.classList?.contains("react-flow__minimap")) return false;
          if (node.classList?.contains("react-flow__panel")) return false;
          return true;
        },
      });

      // Download
      const link = document.createElement("a");
      link.download = `argument-chain-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Chain exported as image");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export chain");
    }
  }, []);

  // Initialize viewport on mount
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2, duration: 0 });
      }, 100);
    }
  }, []);

  return (
    <div ref={canvasRef} className="flex-1 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: "argumentChainEdge",
          animated: false,
        }}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.1}
        maxZoom={2}
        snapToGrid
        snapGrid={[15, 15]}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        
        <Controls showInteractive={false} />
        
        <MiniMap
          nodeStrokeWidth={3}
          pannable
          zoomable
          className="bg-background border"
        />

        {/* Custom Controls Panel */}
        <Panel position="top-right" className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleAutoLayout}
            title="Auto-arrange nodes"
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Auto Layout
          </Button>
          
          <Button
            size="sm"
            variant="secondary"
            onClick={handleFitView}
            title="Fit view to nodes"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="secondary"
            onClick={handleExport}
            title="Export as PNG"
          >
            <Download className="h-4 w-4" />
          </Button>
        </Panel>

        {/* Empty State */}
        {nodes.length === 0 && (
          <Panel position="top-center">
            <div className="bg-background border rounded-lg p-6 shadow-lg max-w-md">
              <h3 className="font-semibold mb-2">Start Building Your Chain</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag arguments from the left panel onto this canvas, or double-click
                an argument to add it automatically.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Drag to position nodes</li>
                <li>• Connect nodes by dragging from one handle to another</li>
                <li>• Click nodes or edges to select them</li>
                <li>• Use the minimap to navigate large chains</li>
              </ul>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

interface ChainCanvasProps {
  onArgumentAdd: (argument: any, position: { x: number; y: number }) => void;
  onConnectionCreate: (connection: Connection) => void;
}

export function ChainCanvas(props: ChainCanvasProps) {
  return (
    <ReactFlowProvider>
      <ChainCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
```

**Acceptance Criteria**:
- [x] ReactFlow canvas with custom node/edge types
- [x] Drag and drop from palette
- [x] Click to select nodes/edges
- [x] Connect nodes by dragging handles
- [x] Auto-layout with dagre
- [x] Fit view functionality
- [x] Export as PNG
- [x] MiniMap for navigation
- [x] Background grid with snap
- [x] Empty state instructions
- [x] Custom controls panel

**Estimated Time**: 4 hours

---

### 3.7 Drag & Drop Implementation

#### Task 3.10: Implement Add Node Logic
**File**: `components/chains/ArgumentChainConstructor.tsx`

```typescript
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChainCanvas } from "./ChainCanvas";
import { ArgumentPalette } from "./ArgumentPalette";
import { ConnectionEditorModal } from "./ConnectionEditorModal";
import { ChainMetadataPanel } from "./ChainMetadataPanel";
import { useChainEditorStore } from "@/lib/stores/chainEditorStore";
import { getNewNodePosition } from "@/lib/utils/chainLayoutUtils";
import { Connection } from "reactflow";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ArgumentChainConstructorProps {
  chainId?: string; // If editing existing chain
  deliberationId: string;
}

export function ArgumentChainConstructor({
  chainId,
  deliberationId,
}: ArgumentChainConstructorProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [arguments, setArguments] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const {
    nodes,
    edges,
    addNode,
    addEdge,
    chainName,
    chainType,
    isPublic,
    isEditable,
    reset,
  } = useChainEditorStore();

  // Fetch chain data (if editing) and arguments
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      
      try {
        // Fetch all arguments in deliberation
        const argsRes = await fetch(
          `/api/deliberations/${deliberationId}/arguments`
        );
        if (!argsRes.ok) throw new Error("Failed to fetch arguments");
        const argsData = await argsRes.json();
        setArguments(argsData.arguments || []);

        // If editing existing chain, load it
        if (chainId) {
          const chainRes = await fetch(`/api/argument-chains/${chainId}`);
          if (!chainRes.ok) throw new Error("Failed to fetch chain");
          const chainData = await chainRes.json();

          // Populate store with existing chain data
          useChainEditorStore.setState({
            chainId: chainData.id,
            chainName: chainData.name,
            chainType: chainData.chainType,
            isPublic: chainData.isPublic,
            isEditable: chainData.isEditable,
            nodes: chainData.nodes.map((node: any) => ({
              id: node.id,
              type: "argumentChainNode",
              position: { x: node.positionX || 0, y: node.positionY || 0 },
              data: {
                argument: node.argument,
                role: node.role,
                addedBy: node.addedBy,
                nodeOrder: node.nodeOrder,
              },
            })),
            edges: chainData.edges.map((edge: any) => ({
              id: edge.id,
              source: edge.sourceNodeId,
              target: edge.targetNodeId,
              type: "argumentChainEdge",
              data: {
                edgeType: edge.edgeType,
                strength: edge.strength,
                description: edge.description,
                slotMapping: edge.slotMapping,
              },
            })),
          });
        }
      } catch (error) {
        console.error("Load error:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();

    // Cleanup on unmount
    return () => reset();
  }, [chainId, deliberationId, reset]);

  // Get arguments already in chain
  const argumentsInChain = new Set(
    nodes.map((node) => node.data.argument.id)
  );

  // Handle adding argument to canvas
  const handleArgumentAdd = useCallback(
    async (argument: any, position?: { x: number; y: number }) => {
      // Check if already in chain
      if (argumentsInChain.has(argument.id)) {
        toast.error("This argument is already in the chain");
        return;
      }

      // If no position provided, calculate optimal position
      const nodePosition = position || getNewNodePosition(nodes, 800, 600);

      // Generate temporary ID for optimistic update
      const tempNodeId = `temp-${Date.now()}`;

      // Add node to local state immediately (optimistic)
      const newNode = {
        id: tempNodeId,
        type: "argumentChainNode",
        position: nodePosition,
        data: {
          argument,
          role: "PREMISE", // Default role
          addedBy: { id: "current-user", name: "You" }, // Will be replaced by server
          nodeOrder: nodes.length + 1,
        },
      };

      addNode(newNode);

      // If chain exists, persist to backend
      if (chainId) {
        try {
          const res = await fetch(`/api/argument-chains/${chainId}/nodes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              argumentId: argument.id,
              role: "PREMISE",
              positionX: nodePosition.x,
              positionY: nodePosition.y,
            }),
          });

          if (!res.ok) throw new Error("Failed to add node");

          const { node: serverNode } = await res.json();

          // Update node with server ID and data
          useChainEditorStore.setState((state) => ({
            nodes: state.nodes.map((n) =>
              n.id === tempNodeId
                ? {
                    ...n,
                    id: serverNode.id,
                    data: {
                      argument: serverNode.argument,
                      role: serverNode.role,
                      addedBy: serverNode.addedBy,
                      nodeOrder: serverNode.nodeOrder,
                    },
                  }
                : n
            ),
          }));

          toast.success("Argument added to chain");
        } catch (error) {
          console.error("Add node error:", error);
          
          // Rollback optimistic update
          useChainEditorStore.setState((state) => ({
            nodes: state.nodes.filter((n) => n.id !== tempNodeId),
          }));
          
          toast.error("Failed to add argument");
        }
      }
    },
    [chainId, nodes, argumentsInChain, addNode]
  );

  // Handle connection creation (opens modal)
  const handleConnectionCreate = useCallback(
    (connection: Connection) => {
      // Modal will handle the actual edge creation
      console.log("Connection initiated:", connection);
    },
    []
  );

  // Handle creating new argument
  const handleCreateNewArgument = useCallback(() => {
    // Navigate to argument constructor in new tab
    window.open(
      `/app/deliberations/${deliberationId}/arguments/new`,
      "_blank"
    );
  }, [deliberationId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Metadata Panel */}
      <ChainMetadataPanel
        chainId={chainId}
        deliberationId={deliberationId}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Argument Palette */}
        <ArgumentPalette
          deliberationId={deliberationId}
          arguments={arguments}
          argumentsInChain={argumentsInChain}
          onArgumentAdd={(arg) => handleArgumentAdd(arg)}
          onCreateNew={handleCreateNewArgument}
        />

        {/* Canvas */}
        <ChainCanvas
          onArgumentAdd={handleArgumentAdd}
          onConnectionCreate={handleConnectionCreate}
        />
      </div>

      {/* Connection Editor Modal */}
      <ConnectionEditorModal chainId={chainId} />
    </div>
  );
}
```

**Acceptance Criteria**:
- [x] Loads existing chain data (if editing)
- [x] Fetches all arguments from deliberation
- [x] Tracks which arguments are already in chain
- [x] Handles drag & drop from palette
- [x] Handles double-click to add from palette
- [x] Calculates optimal position for new nodes
- [x] Optimistic updates with rollback
- [x] Persists to backend if chain exists
- [x] Opens new tab for creating arguments
- [x] Loading states

**Estimated Time**: 3.5 hours

---

### 3.8 Connection Editor Modal

#### Task 3.11: Create ConnectionEditorModal Component
**File**: `components/chains/ConnectionEditorModal.tsx`

```typescript
"use client";

import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChainEditorStore } from "@/lib/stores/chainEditorStore";
import { EDGE_TYPE_OPTIONS } from "@/lib/constants/chainEdgeTypes";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

interface ConnectionEditorModalProps {
  chainId?: string;
}

export function ConnectionEditorModal({ chainId }: ConnectionEditorModalProps) {
  const {
    showConnectionEditor,
    pendingConnection,
    nodes,
    edges,
    addEdge,
    closeConnectionEditor,
  } = useChainEditorStore();

  const [edgeType, setEdgeType] = useState("SUPPORTS");
  const [strength, setStrength] = useState([1.0]);
  const [description, setDescription] = useState("");
  const [slotMapping, setSlotMapping] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get source and target nodes
  const sourceNode = pendingConnection
    ? nodes.find((n) => n.id === pendingConnection.sourceNodeId)
    : null;
  const targetNode = pendingConnection
    ? nodes.find((n) => n.id === pendingConnection.targetNodeId)
    : null;

  // Reset form when modal opens
  useEffect(() => {
    if (showConnectionEditor) {
      setEdgeType("SUPPORTS");
      setStrength([1.0]);
      setDescription("");
      setSlotMapping("");
    }
  }, [showConnectionEditor]);

  const handleCreate = async () => {
    if (!pendingConnection || !sourceNode || !targetNode) return;

    // Check for duplicate edge
    const isDuplicate = edges.some(
      (e) =>
        e.source === pendingConnection.sourceNodeId &&
        e.target === pendingConnection.targetNodeId
    );

    if (isDuplicate) {
      toast.error("Connection already exists between these arguments");
      return;
    }

    // Check for self-loop
    if (pendingConnection.sourceNodeId === pendingConnection.targetNodeId) {
      toast.error("Cannot connect an argument to itself");
      return;
    }

    const tempEdgeId = `temp-edge-${Date.now()}`;

    // Add edge locally (optimistic)
    const newEdge = {
      id: tempEdgeId,
      source: pendingConnection.sourceNodeId,
      target: pendingConnection.targetNodeId,
      type: "argumentChainEdge",
      data: {
        edgeType,
        strength: strength[0],
        description: description.trim() || undefined,
        slotMapping: slotMapping.trim() || undefined,
      },
    };

    addEdge(newEdge);
    closeConnectionEditor();

    // If chain exists, persist to backend
    if (chainId) {
      setIsSubmitting(true);
      
      try {
        const res = await fetch(`/api/argument-chains/${chainId}/edges`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceNodeId: pendingConnection.sourceNodeId,
            targetNodeId: pendingConnection.targetNodeId,
            edgeType,
            strength: strength[0],
            description: description.trim() || null,
            slotMapping: slotMapping.trim() || null,
          }),
        });

        if (!res.ok) throw new Error("Failed to create edge");

        const { edge: serverEdge } = await res.json();

        // Update edge with server ID
        useChainEditorStore.setState((state) => ({
          edges: state.edges.map((e) =>
            e.id === tempEdgeId ? { ...e, id: serverEdge.id } : e
          ),
        }));

        toast.success("Connection created");
      } catch (error) {
        console.error("Create edge error:", error);
        
        // Rollback
        useChainEditorStore.setState((state) => ({
          edges: state.edges.filter((e) => e.id !== tempEdgeId),
        }));
        
        toast.error("Failed to create connection");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const selectedEdgeType = EDGE_TYPE_OPTIONS.find((opt) => opt.value === edgeType);

  return (
    <Dialog open={showConnectionEditor} onOpenChange={closeConnectionEditor}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Connection</DialogTitle>
          <DialogDescription>
            Define how these arguments relate to each other
          </DialogDescription>
        </DialogHeader>

        {/* Connection Preview */}
        {sourceNode && targetNode && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-1">
                <Badge variant="secondary" className="text-xs">
                  Source
                </Badge>
                <p className="text-sm font-medium">
                  {sourceNode.data.argument.conclusion}
                </p>
              </div>
              
              <div className="flex items-center justify-center py-4">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
              
              <div className="flex-1 space-y-1">
                <Badge variant="secondary" className="text-xs">
                  Target
                </Badge>
                <p className="text-sm font-medium">
                  {targetNode.data.argument.conclusion}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 py-4">
          {/* Edge Type */}
          <div className="space-y-2">
            <Label>Connection Type</Label>
            <Select value={edgeType} onValueChange={setEdgeType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EDGE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: option.color }}
                      />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedEdgeType && (
              <p className="text-xs text-muted-foreground">
                {selectedEdgeType.description}
              </p>
            )}
          </div>

          {/* Strength Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Connection Strength</Label>
              <span className="text-sm font-medium">{Math.round(strength[0] * 100)}%</span>
            </div>
            <Slider
              value={strength}
              onValueChange={setStrength}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              How strongly does the source argument support/affect the target?
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Explain how these arguments are connected..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Slot Mapping (Advanced) */}
          <div className="space-y-2">
            <Label htmlFor="slotMapping">
              Slot Mapping (Advanced, Optional)
            </Label>
            <Textarea
              id="slotMapping"
              placeholder='e.g., {"source_conclusion": "target_premise_1"}'
              value={slotMapping}
              onChange={(e) => setSlotMapping(e.target.value)}
              rows={2}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              JSON mapping of which specific parts connect (for advanced users)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={closeConnectionEditor}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Connection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Acceptance Criteria**:
- [x] Shows source and target argument previews
- [x] Select from 7 edge types with descriptions
- [x] Strength slider (0-100%)
- [x] Optional description field
- [x] Optional slot mapping (JSON)
- [x] Validates no duplicates
- [x] Validates no self-loops
- [x] Optimistic updates with rollback
- [x] Persists to backend if chain exists
- [x] Color-coded edge type selector

**Estimated Time**: 2.5 hours

---

### 3.9 Chain Metadata Panel

#### Task 3.12: Create ChainMetadataPanel Component
**File**: `components/chains/ChainMetadataPanel.tsx`

```typescript
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useChainEditorStore } from "@/lib/stores/chainEditorStore";
import { Save, Settings, ArrowLeft, Info } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface ChainMetadataPanelProps {
  chainId?: string;
  deliberationId: string;
}

export function ChainMetadataPanel({
  chainId,
  deliberationId,
}: ChainMetadataPanelProps) {
  const router = useRouter();
  const {
    chainName,
    chainType,
    isPublic,
    isEditable,
    nodes,
    edges,
    setChainMetadata,
  } = useChainEditorStore();

  const [isSaving, setIsSaving] = useState(false);
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState("");

  const handleSave = async () => {
    // Validation
    if (!chainName.trim()) {
      toast.error("Please enter a chain name");
      return;
    }

    if (nodes.length === 0) {
      toast.error("Please add at least one argument to the chain");
      return;
    }

    setIsSaving(true);

    try {
      if (chainId) {
        // Update existing chain
        const res = await fetch(`/api/argument-chains/${chainId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: chainName,
            description: description.trim() || null,
            purpose: purpose.trim() || null,
            chainType,
            isPublic,
            isEditable,
          }),
        });

        if (!res.ok) throw new Error("Failed to update chain");

        toast.success("Chain updated");
      } else {
        // Create new chain
        const res = await fetch("/api/argument-chains", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deliberationId,
            name: chainName,
            description: description.trim() || null,
            purpose: purpose.trim() || null,
            chainType,
            isPublic,
            isEditable,
          }),
        });

        if (!res.ok) throw new Error("Failed to create chain");

        const { chain } = await res.json();
        setChainMetadata({ chainId: chain.id });

        toast.success("Chain created");
        
        // Redirect to edit mode
        router.push(
          `/app/deliberations/${deliberationId}/chains/${chain.id}/edit`
        );
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error(chainId ? "Failed to update chain" : "Failed to create chain");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/app/deliberations/${deliberationId}/chains`);
  };

  return (
    <div className="border-b bg-background px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Back + Name */}
        <div className="flex items-center gap-3 flex-1">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex-1 max-w-md">
            <Input
              placeholder="Chain name..."
              value={chainName}
              onChange={(e) => setChainMetadata({ chainName: e.target.value })}
              className="font-semibold"
            />
          </div>

          <Badge variant="secondary">
            {nodes.length} argument{nodes.length !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="secondary">
            {edges.length} connection{edges.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Right: Settings + Save */}
        <div className="flex items-center gap-2">
          {/* Settings Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3">Chain Settings</h4>
                </div>

                {/* Chain Type */}
                <div className="space-y-2">
                  <Label>Chain Type</Label>
                  <Select
                    value={chainType}
                    onValueChange={(value: any) =>
                      setChainMetadata({ chainType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SERIAL">Serial (Linear)</SelectItem>
                      <SelectItem value="CONVERGENT">Convergent</SelectItem>
                      <SelectItem value="DIVERGENT">Divergent</SelectItem>
                      <SelectItem value="TREE">Tree</SelectItem>
                      <SelectItem value="GRAPH">Graph (Complex)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    placeholder="Describe this chain..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Purpose */}
                <div className="space-y-2">
                  <Label>Purpose (Optional)</Label>
                  <Textarea
                    placeholder="What is this chain trying to establish?"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Public Switch */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Public</Label>
                    <p className="text-xs text-muted-foreground">
                      Anyone in the deliberation can view
                    </p>
                  </div>
                  <Switch
                    checked={isPublic}
                    onCheckedChange={(checked) =>
                      setChainMetadata({ isPublic: checked })
                    }
                  />
                </div>

                {/* Editable Switch */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Collaborative</Label>
                    <p className="text-xs text-muted-foreground">
                      Others can add arguments and connections
                    </p>
                  </div>
                  <Switch
                    checked={isEditable}
                    onCheckedChange={(checked) =>
                      setChainMetadata({ isEditable: checked })
                    }
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : chainId ? "Save Changes" : "Create Chain"}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Acceptance Criteria**:
- [x] Inline name editing
- [x] Node/edge count badges
- [x] Settings popover with:
  - Chain type selector
  - Description field
  - Purpose field
  - Public toggle
  - Collaborative (editable) toggle
- [x] Save/Create button with loading state
- [x] Back button to chains list
- [x] Validation before save
- [x] Creates new chain if none exists
- [x] Updates existing chain

**Estimated Time**: 2.5 hours

---

**Phase 2 Part 4 Summary**:
- **Total Tasks**: 4 tasks (3.9-3.12)
- **Estimated Time**: 12.5 hours
- **Deliverable**: Complete interactive canvas with drag & drop, connection editor, and metadata panel

**Phase 2 Total** (Parts 3-4):
- **Total Tasks**: 12 tasks (3.1-3.12)
- **Estimated Time**: 25.5-27.5 hours
- **Deliverable**: Fully functional visual editor

**Next**: Part 5 will cover Phase 3 (Analysis Features) including critical path visualization, export options, and chain analytics.

