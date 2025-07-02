"use client";

import { useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  Edge,
  Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { WorkflowGraph } from "@/lib/actions/workflow.actions";

interface Props {
  initialGraph?: WorkflowGraph;
  onSave: (graph: WorkflowGraph) => void;
}

export default function WorkflowBuilder({ initialGraph, onSave }: Props) {
  const [nodes, setNodes] = useState<Node[]>(initialGraph?.nodes || []);
  const [edges, setEdges] = useState<Edge[]>(initialGraph?.edges || []);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge(connection, eds));
  }, []);

  const addState = () => {
    const id = `state-${nodes.length + 1}`;
    setNodes((nds) => [
      ...nds,
      {
        id,
        data: { label: id },
        position: { x: 50 * nds.length, y: 50 * nds.length },
      },
    ]);
  };

  const save = () => {
    onSave({ nodes, edges });
  };

  return (
    <div style={{ height: 500 }}>
      <Button onClick={addState}>Add State</Button>
      <Button onClick={save}>Save</Button>
      <ReactFlow nodes={nodes} edges={edges} onConnect={onConnect}>
        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
}
