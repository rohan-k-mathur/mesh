"use client";

import { useState, useCallback } from "react";
import { NodeProps, NodeTypes } from "@xyflow/react";
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
        {
          id: "trigger",
          type: "trigger",
          action: "increment",
          data: { onTrigger: handleTrigger },
          position: { x: 0, y: 0 },
        },
        {
          id: "display",
          type: "display",
          action: "show",
          data: { count: newCount },
          position: { x: 150, y: 0 },
        },
      ],
      edges: [{ id: "e1", source: "trigger", target: "display" }],
    };
    run(graph, actions);
  }, [count, run]);

  const graph: WorkflowGraph = {
    nodes: [
      {
        id: "trigger",
        type: "trigger",
        action: "increment",
        data: { onTrigger: handleTrigger },
        position: { x: 0, y: 0 },
      },
      {
        id: "display",
        type: "display",
        action: "show",
        data: { count },
        position: { x: 150, y: 0 },
      },
    ],
    edges: [{ id: "e1", source: "trigger", target: "display" }],
  };

  const nodeTypes: NodeTypes = { trigger: TriggerNode, display: DisplayNode };

  return <WorkflowRunnerInner graph={graph} nodeTypes={nodeTypes} />;
}

export default function TriggerButtonExample() {
  return (
    <WorkflowExecutionProvider>
      <ExampleInner />
    </WorkflowExecutionProvider>
  );
}
