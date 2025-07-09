"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  Controls,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  Node,
  Edge,
} from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { WorkflowGraph } from "@/lib/workflowExecutor";
import {
  WorkflowExecutionProvider,
  useWorkflowExecution,
} from "../WorkflowExecutionContext";
import { TriggerNode, ActionNode } from "../CustomNodes";

function ExampleInner() {
  const { run } = useWorkflowExecution();
  const [points, setPoints] = useState<[number, number][]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [height, setHeight] = useState(300);
  const [bgVariant, setBgVariant] = useState<BackgroundVariant>(BackgroundVariant.Dots);

  useEffect(() => {
    addTriggerNode();
    addActionNode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge(connection, eds));
  }, []);

  const handleTrigger = useCallback(
    (id: string) => {
      const newPoints = Array.from({ length: 12 }, (_, i) => [
        i + 1,
        Math.random() * 100,
      ]) as [number, number][];
      setPoints(newPoints);
      const updatedNodes = nodes.map((n) =>
        n.type === "action" ? { ...n, data: { ...n.data, points: newPoints } } : n
      );
      setNodes(updatedNodes);
      const startIndex = updatedNodes.findIndex((n) => n.id === id);
      const ordered =
        startIndex > -1
          ? [updatedNodes[startIndex], ...updatedNodes.filter((_, i) => i !== startIndex)]
          : updatedNodes;
      const actions = { generate: async () => {}, show: async () => {} };
      run({ nodes: ordered as any, edges }, actions);
    },
    [nodes, edges, run]
  );

  const addTriggerNode = useCallback(() => {
    const id = `trigger-${nodes.length + 1}`;
    const newNode: Node = {
      id,
      type: "trigger",
      position: { x: 50 * nodes.length, y: 0 },
      data: { trigger: "onClick", onTrigger: () => handleTrigger(id) },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [nodes, handleTrigger, setNodes]);

  const addActionNode = useCallback(() => {
    const id = `action-${nodes.length + 1}`;
    const newNode: Node = {
      id,
      type: "action",
      position: { x: 150 + 50 * nodes.length, y: 0 },
      data: { action: "createRandomLineGraph", points },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [nodes, points, setNodes]);

  const nodeTypes: NodeTypes = { trigger: TriggerNode, action: ActionNode };

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
      <div style={{ height }} className="relative border">
        <div className="absolute left-2 top-2 z-10 flex flex-col gap-2">
          <Button onClick={addTriggerNode}>Add Trigger</Button>
          <Button onClick={addActionNode}>Add Action</Button>
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background variant={bgVariant} />
          <MiniMap />
          <Controls />
        </ReactFlow>
      </div>
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

