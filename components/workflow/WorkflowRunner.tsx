"use client";

import { Button } from "@/components/ui/button";
import { WorkflowGraph } from "@/lib/workflowExecutor";
import { getWorkflowAction } from "@/lib/workflowActions";
import { registerDefaultWorkflowActions } from "@/lib/registerDefaultWorkflowActions";
import { registerIntegrationActions } from "@/lib/registerIntegrationActions";
import { IntegrationApp } from "@/lib/integrations/types";
import { useEffect } from "react";
import {
  WorkflowExecutionProvider,
  useWorkflowExecution,
} from "./WorkflowExecutionContext";
import WorkflowViewer from "./WorkflowViewer";

interface Props {
  graph: WorkflowGraph;
}

export function WorkflowRunnerInner({ graph }: Props) {
  const { run, pause, resume, paused, running, logs } = useWorkflowExecution();

  useEffect(() => {
    registerDefaultWorkflowActions();
    const integrationContext = (require as any).context(
      "../../integrations",
      false,
      /\.ts$/
    );
    const modules: Record<string, { integration?: IntegrationApp }> = {};
    integrationContext.keys().forEach((key: string) => {
      modules[key] = integrationContext(key);
    });
    registerIntegrationActions(modules);
  }, []);

  const handleRun = () => {
    const actions: Record<string, () => Promise<string | void>> = {};
    for (const node of graph.nodes) {
      const act = node.action ? getWorkflowAction(node.action) : undefined;
      actions[node.action ?? node.id] =
        act ?? (async () => `Executed ${node.id}`);
    }
    run(graph, actions);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button onClick={handleRun} disabled={running}>
          {running ? "Running..." : "Run"}
        </Button>
        {running && (
          <Button onClick={paused ? resume : pause}>
            {paused ? "Resume" : "Pause"}
          </Button>
        )}
      </div>
      <WorkflowViewer graph={graph} />
      <div className="border h-32 overflow-auto p-2 text-sm">
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  );
}

export default function WorkflowRunner({ graph }: Props) {
  return (
    <WorkflowExecutionProvider>
      <WorkflowRunnerInner graph={graph} />
    </WorkflowExecutionProvider>
  );
}
