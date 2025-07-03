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
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [workflowId, setWorkflowId] = useState<string | null>(null);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, condition: "" }, eds));
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

  const onEdgeClick = (_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
  };

  return (
    <div style={{ height: 500 }}>
      <Button onClick={addState}>Add State</Button>
      <Button onClick={save}>Save</Button>
      {workflowId && (
        <a href={`/workflows/${workflowId}`}>Run Workflow</a>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
      >
        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
      {selectedEdge && (
        <div className="absolute top-2 right-2 bg-white border p-2 space-y-2">
          <div>Editing edge {selectedEdge.id}</div>
          <input
            className="border p-1"
            value={(selectedEdge as any).condition || ""}
            onChange={(e) => {
              const value = e.target.value;
              setEdges((eds) =>
                eds.map((ed) =>
                  ed.id === selectedEdge.id
                    ? { ...ed, condition: value }
                    : ed
                )
              );
              setSelectedEdge((ed) =>
                ed ? { ...ed, condition: value } : ed
              );
            }}
          />
          <button
            className="border px-2"
            onClick={() => setSelectedEdge(null)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
