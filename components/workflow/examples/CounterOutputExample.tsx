"use client";

import { useEffect } from "react";
import { Node } from "@xyflow/react";
import { WorkflowGraph } from "@/lib/workflowExecutor";
import { registerWorkflowAction } from "@/lib/workflowActions";
import {
  WorkflowExecutionProvider,
  useWorkflowExecution,
} from "../WorkflowExecutionContext";
import { WorkflowRunnerInner } from "../WorkflowRunner";

const sampleGraph: WorkflowGraph = {
  nodes: [
    {
      id: "counter",
      type: "trigger",
      action: "sample:counter",
      data: { label: "counter" },
      position: { x: 0, y: 0 },
    },
    {
      id: "action",
      type: "action",
      action: "sample:createOutput",
      data: { label: "action" },
      position: { x: 150, y: 0 },
    },
  ],
  edges: [{ id: "e1", source: "counter", target: "action" }],
};

function SampleRunner() {
  const { addNode } = useWorkflowExecution();

  useEffect(() => {
    registerWorkflowAction("sample:counter", async () => {
      for (let i = 0; i <= 100; i++) {
        await new Promise((r) => setTimeout(r, 1000));
      }
      return "Counter reached 100";
    });

    registerWorkflowAction("sample:createOutput", async () => {
      const node: Node = {
        id: `output-${Date.now()}`,
        data: { label: "output" },
        position: { x: 150, y: 150 },
      } as Node;
      addNode(node);
      return "Output node created";
    });
  }, [addNode]);

  return <WorkflowRunnerInner graph={sampleGraph} />;
}

export default function CounterOutputExample() {
  return (
    <WorkflowExecutionProvider>
      <SampleRunner />
    </WorkflowExecutionProvider>
  );
}
