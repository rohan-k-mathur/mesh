"use client";

import { useState, useCallback, useEffect } from "react";
import {
  NodeProps,
  NodeTypes,
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Background,
  Controls,
  BackgroundVariant,
} from "@xyflow/react";
import { WorkflowGraph } from "@/lib/workflowExecutor";
import {
  WorkflowExecutionProvider,
  useWorkflowExecution,
} from "../WorkflowExecutionContext";

function TriggerNode({ data }: NodeProps) {
  return (
    <div className="p-2 bg-white border rounded">
      <button className="nodrag" onClick={data.onTrigger}>
        Trigger
      </button>
    </div>
  );
}

function DisplayNode({ data }: NodeProps) {
  return <div className="p-2 bg-white border rounded">Count: {data.count}</div>;
}

function ExampleInner() {
  const { run } = useWorkflowExecution();
  const [count, setCount] = useState(0);

  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: "trigger",
      type: "trigger",
      position: { x: 0, y: 0 },
      data: { onTrigger: () => {} },
    },
    {
      id: "display",
      type: "display",
      position: { x: 150, y: 0 },
      data: { count: 0 },
    },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const handleTrigger = useCallback(() => {
    const newCount = count + 1;
    const actions = {
      increment: async () => {
        setCount(newCount);
      },
      show: async () => {},
    };
    const graph: WorkflowGraph = {
      nodes: [
        { id: "trigger", type: "trigger", action: "increment" },
        { id: "display", type: "display", action: "show" },
      ],
      edges,
    };
    if (edges.find((e) => e.source === "trigger" && e.target === "display")) {
      run(graph, actions);
    }
  }, [count, run, edges]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === "display"
          ? { ...n, data: { count } }
          : n.id === "trigger"
          ? { ...n, data: { onTrigger: handleTrigger } }
          : n
      )
    );
  }, [count, handleTrigger, setNodes]);

  const nodeTypes: NodeTypes = { trigger: TriggerNode, display: DisplayNode };

  return (
    <div className="h-64">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default function TriggerButtonExample() {
  return (
    <WorkflowExecutionProvider>
      <ExampleInner />
    </WorkflowExecutionProvider>
  );
}
