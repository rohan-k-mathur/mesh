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
  onSave: (graph: WorkflowGraph) => Promise<{ id: string }>;
}

export default function WorkflowBuilder({ initialGraph, onSave }: Props) {
  const [nodes, setNodes] = useState<Node[]>(initialGraph?.nodes || []);
  const [edges, setEdges] = useState<Edge[]>(initialGraph?.edges || []);
  const [workflowId, setWorkflowId] = useState<string | null>(null);

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

  const save = async () => {
    const result = await onSave({ nodes, edges });
    setWorkflowId(result.id);
  };

  return (
    <div style={{ height: 500 }}>
      <Button onClick={addState}>Add State</Button>
      <Button onClick={save}>Save</Button>
      {workflowId && (
        <a href={`/workflows/${workflowId}`}>Run Workflow</a>
      )}
      <ReactFlow nodes={nodes} edges={edges} onConnect={onConnect}>
        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
}
