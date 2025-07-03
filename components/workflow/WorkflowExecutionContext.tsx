"use client";

import { createContext, useContext, useRef, useState, ReactNode } from "react";
import { WorkflowGraph } from "@/lib/workflowExecutor";

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

  const run = async (
    graph: WorkflowGraph,
    actions: Record<string, () => Promise<string | void>>,
    evaluate: (condition: string) => boolean = () => true
  ) => {
    setRunning(true);
    setExecuted([]);
    setLogs([]);
    setCurrent(null);

    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
    let currentNode = graph.nodes[0];
    while (currentNode) {
      setCurrent(currentNode.id);
      const result = await actions[currentNode.id]?.();
      if (typeof result === "string") {
        setLogs((prev) => [...prev, result]);
      }
      setExecuted((prev) => [...prev, currentNode.id]);
      await waitIfPaused();
      const outgoing = graph.edges.filter((e) => e.source === currentNode.id);
      if (outgoing.length === 0) break;
      const nextEdge = outgoing.find((e) => !e.condition || evaluate(e.condition));
      if (!nextEdge) break;
      currentNode = nodeMap.get(nextEdge.target)!;
    }
    setCurrent(null);
    setRunning(false);
  };

  return (
    <WorkflowExecutionContext.Provider
      value={{ current, executed, logs, running, paused, run, pause, resume }}
    >
      {children}
    </WorkflowExecutionContext.Provider>
  );
}
