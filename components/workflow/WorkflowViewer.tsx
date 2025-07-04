"use client";

import { useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { WorkflowGraph } from "@/lib/workflowExecutor";
import { useWorkflowExecution } from "./WorkflowExecutionContext";

interface ViewerProps {
  graph: WorkflowGraph;
  nodeTypes?: NodeTypes;
}

export default function WorkflowViewer({ graph, nodeTypes }: ViewerProps) {
  const { current, graph: execGraph } = useWorkflowExecution();
  const [nodes, setNodes] = useState<Node[]>(graph.nodes as Node[]);
  const [edges, setEdges] = useState<Edge[]>(graph.edges as Edge[]);

  useEffect(() => {
    if (execGraph) {
      setNodes(execGraph.nodes as Node[]);
      setEdges(execGraph.edges as Edge[]);
    }
  }, [execGraph]);

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
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes}>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
