"use client";

import { useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { WorkflowGraph } from "@/lib/workflowExecutor";
import { useWorkflowExecution } from "./WorkflowExecutionContext";

interface ViewerProps {
  graph: WorkflowGraph;
}

export default function WorkflowViewer({ graph }: ViewerProps) {
  const { current } = useWorkflowExecution();
  const [nodes, setNodes] = useState<Node[]>(graph.nodes as Node[]);
  const [edges] = useState<Edge[]>(graph.edges as Edge[]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === current
          ? { ...n, className: "bg-yellow-100 border-2 border-blue-500" }
          : { ...n, className: "" }
      )
    );
  }, [current]);

  return (
    <div style={{ height: 300 }}>
      <ReactFlow nodes={nodes} edges={edges}>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
