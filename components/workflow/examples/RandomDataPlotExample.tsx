"use client";

import { useCallback, useState } from "react";
import { NodeProps, NodeTypes, BackgroundVariant } from "@xyflow/react";
import { WorkflowGraph } from "@/lib/workflowExecutor";
import {
  WorkflowExecutionProvider,
  useWorkflowExecution,
} from "../WorkflowExecutionContext";
import { WorkflowRunnerInner } from "../WorkflowRunner";

function TriggerNode({ data }: NodeProps) {
  return (
    <div className="p-2 bg-white border rounded">
      <button className="nodrag" onClick={data.onTrigger}>
        Generate Data
      </button>
    </div>
  );
}

function GraphNode({ data }: NodeProps) {
  const points: [number, number][] = data.points || [];
  const width = 200;
  const height = 100;
  if (points.length === 0) {
    return <div className="p-2 bg-white border rounded">No Data</div>;
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
    <div className="p-2 bg-white border rounded">
      <svg width={width} height={height}>
        <path d={path} fill="none" stroke="black" />
        {points.map((p, i) => (
          <circle key={i} cx={scaleX(p[0])} cy={scaleY(p[1])} r={3} fill="red" />
        ))}
      </svg>
    </div>
  );
}

function ExampleInner() {
  const { run } = useWorkflowExecution();
  const [points, setPoints] = useState<[number, number][]>([]);
  const [height, setHeight] = useState(300);
  const [bgVariant, setBgVariant] = useState<BackgroundVariant>(BackgroundVariant.Dots);

  const handleTrigger = useCallback(() => {
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
        {
          id: "trigger",
          type: "trigger",
          action: "generate",
          data: { onTrigger: handleTrigger },
          position: { x: 0, y: 0 },
        },
        {
          id: "graph",
          type: "graph",
          action: "show",
          data: { points: newPoints },
          position: { x: 150, y: 0 },
        },
      ],
      edges: [{ id: "e1", source: "trigger", target: "graph" }],
    };
    run(graph, actions);
  }, [run]);

  const graph: WorkflowGraph = {
    nodes: [
      {
        id: "trigger",
        type: "trigger",
        action: "generate",
        data: { onTrigger: handleTrigger },
        position: { x: 0, y: 0 },
      },
      {
        id: "graph",
        type: "graph",
        action: "show",
        data: { points },
        position: { x: 150, y: 0 },
      },
    ],
    edges: [{ id: "e1", source: "trigger", target: "graph" }],
  };

  const nodeTypes: NodeTypes = { trigger: TriggerNode, graph: GraphNode };

  return (
    <div className="space-y-2">
      <div className="flex gap-4">
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
      </div>
      <WorkflowRunnerInner
        graph={graph}
        nodeTypes={nodeTypes}
        height={height}
        bgVariant={bgVariant}
      />
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
