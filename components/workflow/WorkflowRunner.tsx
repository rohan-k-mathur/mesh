"use client";

import { Button } from "@/components/ui/button";
import { WorkflowGraph } from "@/lib/workflowExecutor";
import { getWorkflowAction } from "@/lib/workflowActions";
import { registerDefaultWorkflowActions } from "@/lib/registerDefaultWorkflowActions";
import { registerIntegrationActions } from "@/lib/registerIntegrationActions";
import { IntegrationApp } from "@/lib/integrations/types";
import { useEffect, useState } from "react";
import {
  WorkflowExecutionProvider,
  useWorkflowExecution,
} from "./WorkflowExecutionContext";
import WorkflowViewer from "./WorkflowViewer";
import { NodeTypes } from "@xyflow/react";
import { supabase } from "@/lib/supabaseclient";
import {
  WORKFLOW_CHANNEL,
  WORKFLOW_CURRENT_EVENT,
  WORKFLOW_EXECUTED_EVENT,
  WORKFLOW_LOG_EVENT,
} from "@/constants";

interface Props {
  graph: WorkflowGraph;
  nodeTypes?: NodeTypes;
}

export function WorkflowRunnerInner({ graph, nodeTypes }: Props) {
  const { run, pause, resume, paused, running, logs } = useWorkflowExecution();
  const [remoteLogs, setRemoteLogs] = useState<string[]>([]);
  const [remoteCurrent, setRemoteCurrent] = useState<string | null>(null);
  const [remoteExecuted, setRemoteExecuted] = useState<string[]>([]);

  useEffect(() => {
    const ch = supabase.channel(WORKFLOW_CHANNEL);
    ch
      .on("broadcast", { event: WORKFLOW_LOG_EVENT }, ({ payload }) => {
        setRemoteLogs((p) => [...p, payload.log]);
      })
      .on("broadcast", { event: WORKFLOW_CURRENT_EVENT }, ({ payload }) => {
        setRemoteCurrent(payload.id);
      })
      .on("broadcast", { event: WORKFLOW_EXECUTED_EVENT }, ({ payload }) => {
        setRemoteExecuted((p) => [...p, payload.id]);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

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
      <WorkflowViewer graph={graph} nodeTypes={nodeTypes} />
      <div className="border h-32 overflow-auto p-2 text-sm">
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
        {remoteLogs.map((log, i) => (
          <div key={`r-${i}`} className="text-blue-600">
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WorkflowRunner({ graph, nodeTypes }: Props) {
  return (
    <WorkflowExecutionProvider>
      <WorkflowRunnerInner graph={graph} nodeTypes={nodeTypes} />
    </WorkflowExecutionProvider>
  );
}
