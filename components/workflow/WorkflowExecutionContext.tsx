"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  ReactNode,
} from "react";
import { Node } from "@xyflow/react";
import { WorkflowGraph } from "@/lib/workflowExecutor";
import {
  WORKFLOW_CHANNEL,
  WORKFLOW_CURRENT_EVENT,
  WORKFLOW_EXECUTED_EVENT,
  WORKFLOW_LOG_EVENT,
} from "@/constants";

interface ExecutionContextValue {
  current: string | null;
  executed: string[];
  logs: string[];
  running: boolean;
  paused: boolean;
  run: (
    graph: WorkflowGraph,
    actions: Record<string, () => Promise<string | void>>,
    evaluate?: (condition: string) => boolean
  ) => Promise<void>;
  pause: () => void;
  resume: () => void;
  graph: WorkflowGraph | null;
  addNode: (node: Node) => void;
}

const WorkflowExecutionContext = createContext<ExecutionContextValue | null>(null);

export const useWorkflowExecution = () => {
  const ctx = useContext(WorkflowExecutionContext);
  if (!ctx) throw new Error("WorkflowExecutionContext not found");
  return ctx;
};

export function WorkflowExecutionProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<string | null>(null);
  const [executed, setExecuted] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [graphState, setGraphState] = useState<WorkflowGraph | null>(null);
  const resumeRef = useRef<() => void>();

  const waitIfPaused = () =>
    paused
      ? new Promise<void>((resolve) => {
          resumeRef.current = resolve;
        })
      : Promise.resolve();

  const pause = () => setPaused(true);
  const resume = () => {
    setPaused(false);
    resumeRef.current?.();
  };

  const addNode = (node: Node) => {
    setGraphState((g) => (g ? { ...g, nodes: [...g.nodes, node] } : g));
  };

  const run = async (
    graph: WorkflowGraph,
    actions: Record<string, () => Promise<string | void>>,
    evaluate: (condition: string) => boolean = () => true
  ) => {
    setRunning(true);
    setExecuted([]);
    setLogs([]);
    setCurrent(null);
    setGraphState(graph);

    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
    let currentNode = graph.nodes[0];
    while (currentNode) {
      setCurrent(currentNode.id);
      await fetch("/api/workflow-broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: WORKFLOW_CURRENT_EVENT,
          payload: { id: currentNode.id },
        }),
      });
      const actionKey = currentNode.action ?? currentNode.id;
      const result = await actions[actionKey]?.();
      if (typeof result === "string") {
        setLogs((prev) => [...prev, result]);
        await fetch("/api/workflow-broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: WORKFLOW_LOG_EVENT,
            payload: { log: result },
          }),
        });
      }
      setExecuted((prev) => [...prev, currentNode.id]);
      await fetch("/api/workflow-broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: WORKFLOW_EXECUTED_EVENT,
          payload: { id: currentNode.id },
        }),
      });
      await waitIfPaused();
      const outgoing = graph.edges.filter((e) => e.source === currentNode.id);
      if (outgoing.length === 0) break;
      const nextEdge = outgoing.find((e) => !e.condition || evaluate(e.condition));
      if (!nextEdge) break;
      currentNode = nodeMap.get(nextEdge.target)!;
    }
    setCurrent(null);
    await fetch("/api/workflow-broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: WORKFLOW_CURRENT_EVENT,
        payload: { id: null },
      }),
    });
    setRunning(false);
  };

  return (
    <WorkflowExecutionContext.Provider
      value={{
        current,
        executed,
        logs,
        running,
        paused,
        run,
        pause,
        resume,
        graph: graphState,
        addNode,
      }}
    >
      {children}
    </WorkflowExecutionContext.Provider>
  );
}
