"use client";
import { useState } from "react";
import { executeWorkflow, WorkflowGraph } from "@/lib/workflowExecutor";
import { Button } from "@/components/ui/button";

interface Props {
  graph: WorkflowGraph;
}

export default function WorkflowRunner({ graph }: Props) {
  const [executed, setExecuted] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    setExecuted([]);
    const actions: Record<string, () => Promise<void>> = {};
    for (const node of graph.nodes) {
      actions[node.id] = async () => {
        setExecuted((prev) => [...prev, node.id]);
      };
    }
    await executeWorkflow(graph, actions);
    setRunning(false);
  };

  return (
    <div className="space-y-2">
      <Button onClick={run} disabled={running}>
        {running ? "Running..." : "Run"}
      </Button>
      <div>
        {executed.map((id) => (
          <div key={id}>{id}</div>
        ))}
      </div>
    </div>
  );
}
