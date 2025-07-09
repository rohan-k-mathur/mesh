"use client";

import { useCallback, useState, useEffect } from "react";
import {
  NodeProps,
  NodeTypes,
  BackgroundVariant,
  Handle,
  Position,
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Background,
  Controls,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { WorkflowGraph } from "@/lib/workflowExecutor";
import {
  WorkflowExecutionProvider,
  useWorkflowExecution,
} from "../WorkflowExecutionContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function TriggerNode({ data }: NodeProps) {
  return (
    <div className="relative p-2 bg-white border rounded">
      <button className="nodrag" onClick={data.onTrigger}>
        Generate Data
      </button>
      <Handle
        type="target"
        position={Position.Top}
        className="orange-node_handle"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="orange-node_handle"
      />
    </div>
  );
}

function GraphNode({ data }: NodeProps) {
  const points: [number, number][] = data.points || [];
  const chartType: "line" | "bar" = data.chartType ?? "line";
  const width = 200;
  const height = 100;
  if (points.length === 0) {
    return (
      <div className="relative p-2 bg-white border rounded">
        No Data
        <Handle
          type="target"
          position={Position.Top}
          className="orange-node_handle"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          className="orange-node_handle"
        />
      </div>
    );
  }
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scaleX = (x: number) => ((x - minX) / (maxX - minX || 1)) * width;
  const scaleY = (y: number) => height - ((y - minY) / (maxY - minY || 1)) * height;
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${scaleX(p[0])},${scaleY(p[1])}`)
    .join(" ");
  return (
    <div
      className="relative p-2 bg-white border rounded"
      onClick={data.onOpenPanel}
    >
      <svg width={width} height={height}>
        {chartType === "line" ? (
          <path d={path} fill="none" stroke="black" />
        ) : (
          points.map((p, i) => (
            <line
              key={i}
              x1={scaleX(p[0])}
              y1={height}
              x2={scaleX(p[0])}
              y2={scaleY(p[1])}
              stroke="black"
            />
          ))
        )}
        {points.map((p, i) => (
          <circle key={i} cx={scaleX(p[0])} cy={scaleY(p[1])} r={3} fill="red" />
        ))}
      </svg>
      <Handle
        type="target"
        position={Position.Top}
        className="orange-node_handle"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="orange-node_handle"
      />
    </div>
  );
}

function ExampleInner() {
  const { run } = useWorkflowExecution();
  const [points, setPoints] = useState<[number, number][]>([]);
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [panelOpen, setPanelOpen] = useState(false);
  const [height, setHeight] = useState(300);
  const [bgVariant, setBgVariant] = useState<BackgroundVariant>(BackgroundVariant.Dots);
  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: "trigger",
      type: "trigger",
      position: { x: 0, y: 0 },
      data: { onTrigger: () => {} },
    },
    {
      id: "graph",
      type: "graph",
      position: { x: 150, y: 0 },
      data: { points: [] },
    },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [ready, setReady] = useState(false);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const handleTrigger = useCallback(() => {
    if (!ready) return;
    if (!edges.find((e) => e.source === "trigger" && e.target === "graph")) return;
    const newPoints = Array.from({ length: 12 }, (_, i) => [
      i + 1,
      Math.random() * 100,
    ]) as [number, number][];
    const actions = {
      generate: async () => {
        setPoints(newPoints);
      },
      show: async () => {},
    };
    const graph: WorkflowGraph = {
      nodes: [
        { id: "trigger", type: "trigger", action: "generate" },
        { id: "graph", type: "graph", action: "show" },
      ],
      edges,
    };
    run(graph, actions);
    setReady(false);
  }, [edges, run, ready]);

  const openPanel = () => setPanelOpen(true);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === "graph"
          ? {
              ...n,
              data: {
                points,
                chartType,
                onOpenPanel: openPanel,
              },
            }
          : n.id === "trigger"
          ? { ...n, data: { onTrigger: handleTrigger } }
          : n
      )
    );
  }, [points, handleTrigger, chartType, setNodes]);

  const nodeTypes: NodeTypes = { trigger: TriggerNode, graph: GraphNode };

  return (
    <div className="space-y-2">
      <div className="flex gap-4 items-center">
        <label className="flex items-center gap-1 text-sm">
          Height:
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="border p-1 w-20"
          />
        </label>
        <label className="flex items-center gap-1 text-sm">
          Background:
          <select
            value={bgVariant}
            onChange={(e) => setBgVariant(e.target.value as BackgroundVariant)}
            className="border p-1"
          >
            <option value={BackgroundVariant.Dots}>Dots</option>
            <option value={BackgroundVariant.Lines}>Lines</option>
            <option value={BackgroundVariant.Cross}>Cross</option>
          </select>
        </label>
        <button
          onClick={() => setReady(true)}
          className="border px-2 py-1 rounded bg-blue-600 text-white text-sm"
        >
          Run
        </button>
      </div>
      <div style={{ height }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background variant={bgVariant} />
          <Controls />
        </ReactFlow>
      </div>
      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent side="right" className="w-48 space-y-4 mr-2">
          <SheetHeader>
            <SheetTitle>Chart Type</SheetTitle>
          </SheetHeader>
          <Select
            value={chartType}
            onValueChange={(v) => setChartType(v as "line" | "bar")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="bar">Bar</SelectItem>
            </SelectContent>
          </Select>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function RandomDataPlotExample() {
  return (
    <WorkflowExecutionProvider>
      <ExampleInner />
    </WorkflowExecutionProvider>
  );
}
