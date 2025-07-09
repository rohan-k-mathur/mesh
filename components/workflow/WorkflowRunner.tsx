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
import { NodeTypes, BackgroundVariant } from "@xyflow/react";
import { TriggerNode, ActionNode } from "./CustomNodes";
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
  workflowId?: string;
  height?: number;
  bgVariant?: BackgroundVariant;
}

export function WorkflowRunnerInner({
  graph,
  nodeTypes,
  workflowId,
  height,
  bgVariant,
}: Props) {
  const { run, pause, resume, paused, running, logs, executed } =
    useWorkflowExecution();
  const [remoteLogs, setRemoteLogs] = useState<string[]>([]);
  const [remoteCurrent, setRemoteCurrent] = useState<string | null>(null);
  const [remoteExecuted, setRemoteExecuted] = useState<string[]>([]);
  const [pointsMap, setPointsMap] = useState<Record<string, [number, number][]>>(
    {}
  );

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
    const integrationContext = typeof (require as any).context === "function"
      ? (require as any).context("../../integrations", false, /\.ts$/)
      : { keys: () => [], context: () => ({}) };
    const modules: Record<string, { integration?: IntegrationApp }> = {};
    integrationContext.keys().forEach((key: string) => {
      modules[key] = integrationContext(key);
    });
    registerIntegrationActions(modules);
  }, []);

  const handleRun = async () => {
    const actions: Record<string, () => Promise<string | void>> = {};
    for (const node of graph.nodes) {
      if (node.action === "createRandomLineGraph") {
        actions[node.action] = async () => {
          const pts = Array.from({ length: 12 }, (_, i) => [
            i + 1,
            Math.random() * 100,
          ]) as [number, number][];
          setPointsMap((m) => ({ ...m, [node.id]: pts }));
        };
      } else {
        const act = node.action ? getWorkflowAction(node.action) : undefined;
        actions[node.action ?? node.id] =
          act ?? (async () => `Executed ${node.id}`);
      }
    }
    const start = new Date();
    await run(graph, actions);
    const finish = new Date();
    if (workflowId) {
      await fetch(`/api/workflows/${workflowId}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          executed,
          startedAt: start.toISOString(),
          finishedAt: finish.toISOString(),
        }),
      });
    }
  };

  const computedGraph: WorkflowGraph = {
    nodes: graph.nodes.map((n) => {
      const data: any = { ...n.data };
      if (n.type === "trigger" && n.data?.trigger === "onClick") {
        data.onTrigger = handleRun;
      }
      if (pointsMap[n.id]) data.points = pointsMap[n.id];
      return { ...n, data } as any;
    }),
    edges: graph.edges,
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
      <WorkflowViewer
        graph={computedGraph}
        nodeTypes={nodeTypes ?? { trigger: TriggerNode, action: ActionNode }}
        height={height}
        bgVariant={bgVariant}
      />
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

export default function WorkflowRunner({
  graph,
  nodeTypes,
  workflowId,
  height,
  bgVariant,
}: Props) {
  return (
    <WorkflowExecutionProvider>
      <WorkflowRunnerInner
        graph={graph}
        nodeTypes={nodeTypes}
        workflowId={workflowId}
        height={height}
        bgVariant={bgVariant}
      />
    </WorkflowExecutionProvider>
  );
}
