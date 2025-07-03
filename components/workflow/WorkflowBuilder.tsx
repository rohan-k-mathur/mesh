"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundProps,
  BackgroundVariant,
  addEdge,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  NodeMouseHandler,
  EdgeMouseHandler,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { WorkflowGraph } from "@/lib/actions/workflow.actions";
import WorkflowSidePanel from "./WorkflowSidePanel";
import { registerDefaultWorkflowActions } from "@/lib/registerDefaultWorkflowActions";
import { registerIntegrationActions } from "@/lib/registerIntegrationActions";
import { listWorkflowActions } from "@/lib/workflowActions";
import { IntegrationApp } from "@/lib/integrations/types";

interface Props {
  initialGraph?: WorkflowGraph;
  onSave: (graph: WorkflowGraph) => Promise<{ id: string }>;
}
const proOptions = { hideAttribution: true };

export default function WorkflowBuilder({ initialGraph, onSave }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>(
    initialGraph?.nodes || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>(
    initialGraph?.edges || []
  );
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [actions, setActions] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const { screenToFlowPosition } = useReactFlow();

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
    setActions(listWorkflowActions());
  }, []);

  const exportJson = () => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const text = await files[0].text();
      const graph = JSON.parse(text) as WorkflowGraph;
      setNodes(graph.nodes as Node[]);
      setEdges(graph.edges as Edge[]);
    } catch {
      // ignore invalid file
    }
  };


  const onNodeClick: NodeMouseHandler = (_event, node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  };

  const onEdgeClick: EdgeMouseHandler = (event, edge) => {
    event.stopPropagation();
    setSelectedEdge(edge);
    setSelectedNode(null);
  };

  const onPaneClick = () => {
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, condition: "" }, eds));
  }, []);
  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData("application/reactflow");
    if (!type) return;
    if (!wrapperRef.current) return;
    const position = screenToFlowPosition({
      x: event.clientX - wrapperRef.current.getBoundingClientRect().left,
      y: event.clientY - wrapperRef.current.getBoundingClientRect().top,
    });
    const id = `state-${nodes.length + 1}`;
    const newNode: Node = {
      id,
      position,
      data: { label: id },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const updateNode = (updated: Node) => {
    setNodes((nds) => nds.map((n) => (n.id === updated.id ? updated : n)));
    setSelectedNode(updated);
  };

  const updateEdge = (updated: Edge) => {
    setEdges((eds) => eds.map((e) => (e.id === updated.id ? updated : e)));
    setSelectedEdge(updated);
  };

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
    <div style={{ height: 640, position: "relative" }} ref={wrapperRef}>
      <div className="absolute  left-2 top-2 z-10 flex flex-col gap-2">
        <div
          className="dndnode w-full rounded-md"
          draggable
          onDragStart={(e) =>
            e.dataTransfer.setData("application/reactflow", "state")
          }
        >
          State
        </div>
        <Button onClick={addState}>Add State</Button>
        <Button onClick={() => importRef.current?.click()}>Import</Button>
        <input
          type="file"
          accept="application/json"
          ref={importRef}
          aria-label="Import Workflow"
          className="hidden"
          onChange={(e) => importJson(e.target.files)}
        />
        <Button onClick={exportJson}>Export</Button>
        <Button onClick={save}>Save</Button>
        {workflowId && (
          <a href={`/workflows/${workflowId}`}>Run Workflow</a>
        )}
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        proOptions={proOptions}
        fitView
      >
        <Background 
          id="1"
          gap={10}
        color="#000000"
        variant={BackgroundVariant.Dots}/>
        <MiniMap       />
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
      <WorkflowSidePanel
        node={selectedNode ?? undefined}
        edge={selectedEdge ?? undefined}
        actions={actions}
        onUpdateNode={updateNode}
        onUpdateEdge={updateEdge}
        onClose={() => {
          setSelectedNode(null);
          setSelectedEdge(null);
        }}
      />
    </div>
  );
}
