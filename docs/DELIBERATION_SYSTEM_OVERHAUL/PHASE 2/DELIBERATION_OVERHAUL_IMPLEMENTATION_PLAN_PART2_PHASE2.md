# Phase 2: Dependencies & Explicitness - Detailed Implementation

This document contains the detailed implementation steps for Phase 2.1-2.6 of the Deliberation System Overhaul.

**Total Estimated Time**: 80 hours (2 weeks)

---

## Phase 2.1: Dependency Graph Visualization (16 hours)

### Goal
Create an interactive graph component that visualizes ArgumentSchemeInstances as nodes and ArgumentDependencies as edges, allowing users to understand argument structure at a glance.

### Prerequisites
- Phase 1.1 complete (ArgumentSchemeInstance, ArgumentDependency tables exist)
- React Flow library added to dependencies

### Step 1: Add Dependencies (1 hour)

```bash
# Install React Flow for graph visualization
yarn add reactflow

# Install types
yarn add -D @types/reactflow
```

**package.json**:
```json
{
  "dependencies": {
    "reactflow": "^11.10.0"
  }
}
```

### Step 2: Create ArgumentNetGraph Component (6 hours)

**File**: `components/argument/ArgumentNetGraph.tsx`

```typescript
"use client";

import React, { useCallback, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { ArgumentSchemeInstance, ArgumentDependency } from "@/types/argument";
import { cn } from "@/lib/utils";

interface ArgumentNetGraphProps {
  instances: ArgumentSchemeInstance[];
  dependencies: ArgumentDependency[];
  onNodeClick?: (instanceId: string) => void;
  onEdgeClick?: (dependencyId: string) => void;
  highlightedInstanceId?: string;
  layout?: "hierarchical" | "force" | "manual";
  editable?: boolean;
}

// Node styling based on role and explicitness
const getNodeStyle = (
  role: string,
  explicitness: string,
  isHighlighted: boolean
) => {
  const baseClasses = "px-4 py-2 rounded-lg border-2 shadow-md";
  
  // Role colors
  const roleColors = {
    primary: "bg-blue-100 border-blue-500",
    supporting: "bg-green-100 border-green-500",
    presupposed: "bg-purple-100 border-purple-500",
    implicit: "bg-gray-100 border-gray-400",
  };

  // Explicitness border styles
  const explicitnessStyles = {
    explicit: "border-solid",
    presupposed: "border-dashed",
    implied: "border-dotted",
  };

  const highlightStyle = isHighlighted
    ? "ring-4 ring-yellow-300"
    : "";

  return cn(
    baseClasses,
    roleColors[role as keyof typeof roleColors] || roleColors.supporting,
    explicitnessStyles[explicitness as keyof typeof explicitnessStyles] || explicitnessStyles.explicit,
    highlightStyle
  );
};

// Edge styling based on dependency type
const getEdgeStyle = (dependencyType: string) => {
  const styles = {
    premise_conclusion: { stroke: "#3b82f6", strokeWidth: 2, label: "⟶" },
    presuppositional: { stroke: "#8b5cf6", strokeWidth: 2, label: "⊨", strokeDasharray: "5,5" },
    support: { stroke: "#10b981", strokeWidth: 2, label: "↗" },
    justificational: { stroke: "#f59e0b", strokeWidth: 2, label: "∵" },
    sequential: { stroke: "#6366f1", strokeWidth: 2, label: "→" },
  };

  return styles[dependencyType as keyof typeof styles] || styles.support;
};

export function ArgumentNetGraph({
  instances,
  dependencies,
  onNodeClick,
  onEdgeClick,
  highlightedInstanceId,
  layout = "hierarchical",
  editable = false,
}: ArgumentNetGraphProps) {
  // Convert instances to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    return instances.map((instance, idx) => {
      const isHighlighted = highlightedInstanceId === instance.id;

      return {
        id: instance.id,
        type: "default",
        position: { x: idx * 200, y: 0 }, // Will be updated by layout
        data: {
          label: (
            <div className={getNodeStyle(instance.role, instance.explicitness, isHighlighted)}>
              <div className="font-semibold text-sm">
                {instance.argumentScheme.name}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {instance.role}
              </div>
            </div>
          ),
          instance,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
    });
  }, [instances, highlightedInstanceId]);

  // Convert dependencies to React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    return dependencies.map((dep) => {
      const style = getEdgeStyle(dep.dependencyType);

      return {
        id: dep.id,
        source: dep.sourceInstanceId,
        target: dep.targetInstanceId,
        type: "default",
        label: style.label,
        style: {
          stroke: style.stroke,
          strokeWidth: style.strokeWidth,
          strokeDasharray: style.strokeDasharray,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: style.stroke,
        },
        data: { dependency: dep },
      };
    });
  }, [dependencies]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Apply layout algorithm
  React.useEffect(() => {
    if (layout === "hierarchical") {
      applyHierarchicalLayout();
    } else if (layout === "force") {
      applyForceDirectedLayout();
    }
  }, [layout, instances, dependencies]);

  const applyHierarchicalLayout = () => {
    // Simple hierarchical layout: arrange by order
    const layoutedNodes = nodes.map((node, idx) => {
      const instance = instances.find((i) => i.id === node.id);
      const order = instance?.order || idx;
      
      return {
        ...node,
        position: {
          x: order * 250,
          y: instance?.role === "primary" ? 100 : 250,
        },
      };
    });

    setNodes(layoutedNodes);
  };

  const applyForceDirectedLayout = () => {
    // Simple force-directed: spread nodes evenly
    const layoutedNodes = nodes.map((node, idx) => {
      const angle = (idx / nodes.length) * 2 * Math.PI;
      const radius = 200;

      return {
        ...node,
        position: {
          x: 300 + radius * Math.cos(angle),
          y: 300 + radius * Math.sin(angle),
        },
      };
    });

    setNodes(layoutedNodes);
  };

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [onNodeClick]
  );

  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      if (onEdgeClick) {
        onEdgeClick(edge.id);
      }
    },
    [onEdgeClick]
  );

  return (
    <div className="w-full h-[600px] border rounded-lg bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={editable ? onNodesChange : undefined}
        onEdgesChange={editable ? onEdgesChange : undefined}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const instance = node.data.instance;
            if (instance?.role === "primary") return "#3b82f6";
            if (instance?.role === "supporting") return "#10b981";
            if (instance?.role === "presupposed") return "#8b5cf6";
            return "#9ca3af";
          }}
        />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md text-xs">
        <div className="font-semibold mb-2">Dependency Types</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-blue-500"></div>
            <span>⟶ Premise → Conclusion</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-purple-500 border-dashed"></div>
            <span>⊨ Presuppositional</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-green-500"></div>
            <span>↗ Support</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-amber-500"></div>
            <span>∵ Justificational</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-indigo-500"></div>
            <span>→ Sequential</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Key Features**:
- Color-coded nodes by role (blue=primary, green=supporting, purple=presupposed)
- Border styles by explicitness (solid/dashed/dotted)
- Edge labels with Unicode symbols
- Click handlers for navigation
- Layout algorithms (hierarchical, force-directed)
- Mini-map for large nets
- Legend for dependency types

### Step 3: Integrate into ArgumentDetailsPanel (3 hours)

**File**: `components/argument/ArgumentDetailsPanel.tsx`

Add a "Network View" tab to the argument details:

```typescript
import { ArgumentNetGraph } from "./ArgumentNetGraph";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ArgumentDetailsPanel({ argument }: { argument: ArgumentWithSchemes }) {
  const [activeTab, setActiveTab] = useState<"schemes" | "network" | "cqs">("schemes");
  const [highlightedInstanceId, setHighlightedInstanceId] = useState<string>();

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="schemes">Schemes</TabsTrigger>
          <TabsTrigger value="network">Network View</TabsTrigger>
          <TabsTrigger value="cqs">Critical Questions</TabsTrigger>
        </TabsList>

        <TabsContent value="schemes">
          <ArgumentSchemeList
            instances={argument.schemeInstances}
            onInstanceClick={(id) => {
              setHighlightedInstanceId(id);
              setActiveTab("network");
            }}
          />
        </TabsContent>

        <TabsContent value="network">
          <ArgumentNetGraph
            instances={argument.schemeInstances}
            dependencies={argument.dependencies || []}
            highlightedInstanceId={highlightedInstanceId}
            onNodeClick={(id) => setHighlightedInstanceId(id)}
            layout="hierarchical"
          />
        </TabsContent>

        <TabsContent value="cqs">
          <SchemeSpecificCQsModal argument={argument} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Step 4: Create DependencyDetailModal (3 hours)

**File**: `components/argument/DependencyDetailModal.tsx`

Show dependency details when edge is clicked:

```typescript
"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArgumentDependency } from "@/types/argument";
import { Badge } from "@/components/ui/badge";

interface DependencyDetailModalProps {
  dependency: ArgumentDependency | null;
  open: boolean;
  onClose: () => void;
}

const DEPENDENCY_INFO = {
  premise_conclusion: {
    label: "Premise → Conclusion",
    description: "The source scheme's conclusion serves as a premise for the target scheme",
    icon: "⟶",
    color: "blue",
  },
  presuppositional: {
    label: "Presuppositional",
    description: "The target scheme presupposes the source scheme's validity",
    icon: "⊨",
    color: "purple",
  },
  support: {
    label: "Support",
    description: "The source scheme provides additional support for the target scheme",
    icon: "↗",
    color: "green",
  },
  justificational: {
    label: "Justificational",
    description: "The source scheme justifies the reasoning in the target scheme",
    icon: "∵",
    color: "amber",
  },
  sequential: {
    label: "Sequential",
    description: "The schemes form a sequential chain of reasoning",
    icon: "→",
    color: "indigo",
  },
};

export function DependencyDetailModal({
  dependency,
  open,
  onClose,
}: DependencyDetailModalProps) {
  if (!dependency) return null;

  const info = DEPENDENCY_INFO[dependency.dependencyType as keyof typeof DEPENDENCY_INFO];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{info.icon}</span>
            {info.label}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Description</div>
            <p className="text-sm text-gray-600">{info.description}</p>
          </div>

          {dependency.justification && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Justification</div>
              <p className="text-sm text-gray-600 italic">{dependency.justification}</p>
            </div>
          )}

          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Connection Type</div>
            <Badge variant={info.color as any}>
              {dependency.isExplicit ? "Explicit" : "Implicit"}
            </Badge>
          </div>

          {!dependency.isExplicit && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3">
              <div className="text-sm font-medium text-amber-800 mb-1">
                ⚠️ Implicit Dependency
              </div>
              <p className="text-xs text-amber-700">
                This connection is not explicitly stated in the argument text but is inferred from
                the logical structure. Consider making it explicit for clarity.
              </p>
            </div>
          )}

          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Source Scheme</div>
            <div className="text-sm text-gray-600">
              {dependency.sourceInstance?.argumentScheme.name}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Target Scheme</div>
            <div className="text-sm text-gray-600">
              {dependency.targetInstance?.argumentScheme.name}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Step 5: Update Types (1 hour)

**File**: `types/argument.ts`

Ensure ArgumentDependency includes full relations:

```typescript
export interface ArgumentDependency {
  id: string;
  sourceInstanceId: string;
  targetInstanceId: string;
  dependencyType: "premise_conclusion" | "presuppositional" | "support" | "justificational" | "sequential";
  isExplicit: boolean;
  justification?: string;
  sourceInstance?: ArgumentSchemeInstance;
  targetInstance?: ArgumentSchemeInstance;
  createdAt: Date;
}
```

### Step 6: Add API Endpoint for Dependencies (2 hours)

**File**: `app/api/arguments/[id]/dependencies/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const dependencies = await prisma.argumentDependency.findMany({
    where: {
      OR: [
        { sourceInstance: { argumentId: params.id } },
        { targetInstance: { argumentId: params.id } },
      ],
    },
    include: {
      sourceInstance: {
        include: { argumentScheme: true },
      },
      targetInstance: {
        include: { argumentScheme: true },
      },
    },
  });

  return NextResponse.json(dependencies);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { sourceInstanceId, targetInstanceId, dependencyType, isExplicit, justification } = body;

  // Validate instances belong to this argument
  const instances = await prisma.argumentSchemeInstance.findMany({
    where: {
      id: { in: [sourceInstanceId, targetInstanceId] },
      argumentId: params.id,
    },
  });

  if (instances.length !== 2) {
    return NextResponse.json(
      { error: "Invalid scheme instances" },
      { status: 400 }
    );
  }

  // Check for circular dependencies
  const wouldCreateCycle = await checkForCycle(sourceInstanceId, targetInstanceId);
  if (wouldCreateCycle) {
    return NextResponse.json(
      { error: "Cannot create circular dependency" },
      { status: 400 }
    );
  }

  const dependency = await prisma.argumentDependency.create({
    data: {
      sourceInstanceId,
      targetInstanceId,
      dependencyType,
      isExplicit: isExplicit ?? true,
      justification,
    },
    include: {
      sourceInstance: { include: { argumentScheme: true } },
      targetInstance: { include: { argumentScheme: true } },
    },
  });

  return NextResponse.json(dependency);
}

async function checkForCycle(sourceId: string, targetId: string): Promise<boolean> {
  // BFS to detect cycle
  const visited = new Set<string>();
  const queue = [targetId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === sourceId) return true;
    if (visited.has(current)) continue;

    visited.add(current);

    const dependencies = await prisma.argumentDependency.findMany({
      where: { sourceInstanceId: current },
      select: { targetInstanceId: true },
    });

    queue.push(...dependencies.map((d) => d.targetInstanceId));
  }

  return false;
}
```

### Testing (Phase 2.1)

**File**: `__tests__/components/ArgumentNetGraph.test.tsx`

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { ArgumentNetGraph } from "@/components/argument/ArgumentNetGraph";

describe("ArgumentNetGraph", () => {
  const mockInstances = [
    {
      id: "inst1",
      role: "primary",
      explicitness: "explicit",
      order: 0,
      argumentScheme: { name: "Practical Reasoning" },
    },
    {
      id: "inst2",
      role: "supporting",
      explicitness: "explicit",
      order: 1,
      argumentScheme: { name: "Expert Opinion" },
    },
  ];

  const mockDependencies = [
    {
      id: "dep1",
      sourceInstanceId: "inst2",
      targetInstanceId: "inst1",
      dependencyType: "support",
      isExplicit: true,
    },
  ];

  it("renders nodes for each instance", () => {
    render(
      <ArgumentNetGraph
        instances={mockInstances}
        dependencies={mockDependencies}
      />
    );

    expect(screen.getByText("Practical Reasoning")).toBeInTheDocument();
    expect(screen.getByText("Expert Opinion")).toBeInTheDocument();
  });

  it("calls onNodeClick when node is clicked", () => {
    const handleClick = jest.fn();
    render(
      <ArgumentNetGraph
        instances={mockInstances}
        dependencies={mockDependencies}
        onNodeClick={handleClick}
      />
    );

    const node = screen.getByText("Practical Reasoning");
    fireEvent.click(node);

    expect(handleClick).toHaveBeenCalledWith("inst1");
  });

  it("highlights selected node", () => {
    const { container } = render(
      <ArgumentNetGraph
        instances={mockInstances}
        dependencies={mockDependencies}
        highlightedInstanceId="inst1"
      />
    );

    const highlightedNode = container.querySelector(".ring-yellow-300");
    expect(highlightedNode).toBeInTheDocument();
  });
});
```

### Acceptance Criteria (Phase 2.1)

- [ ] ArgumentNetGraph component renders nodes and edges correctly
- [ ] Nodes styled by role (color) and explicitness (border style)
- [ ] Edges styled by dependency type with Unicode symbols
- [ ] Click handlers work for nodes and edges
- [ ] Hierarchical layout arranges schemes logically
- [ ] Mini-map shows overview of large networks
- [ ] Legend explains dependency types
- [ ] Integrated into ArgumentDetailsPanel with tab
- [ ] DependencyDetailModal shows edge details
- [ ] API endpoint creates dependencies with cycle detection
- [ ] All tests passing

**Time Estimate**: 16 hours  
**Complexity**: Medium (React Flow learning curve)  
**Risk**: Low (isolated component, clear interface)

---

**Note**: Due to length limitations, Phase 2.2-2.6 are documented in Part 2 of the main implementation plan. This file provides the detailed technical specifications for Phase 2.1.

See `DELIBERATION_OVERHAUL_IMPLEMENTATION_PLAN_PART2.md` for the complete Phase 2 documentation.


