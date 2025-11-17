"use client";

import React, { useCallback, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider,
  Connection,
  ConnectionMode,
  MarkerType,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

import { useChainEditorStore } from "@/lib/stores/chainEditorStore";
import ArgumentChainNode from "./ArgumentChainNode";
import ArgumentChainEdge from "./ArgumentChainEdge";
import { getLayoutedElements } from "@/lib/utils/chainLayoutUtils";

const nodeTypes = {
  argumentNode: ArgumentChainNode,
};

const edgeTypes = {
  chainEdge: ArgumentChainEdge,
};

interface ArgumentChainCanvasProps {
  isEditable?: boolean;
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
}

const ArgumentChainCanvasInner: React.FC<ArgumentChainCanvasProps> = ({
  isEditable = true,
  onNodeClick,
  onEdgeClick,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    setSelectedNode,
    setSelectedEdge,
    openConnectionEditor,
    setNodes,
    setEdges,
  } = useChainEditorStore();

  // Handle node selection
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      setSelectedNode(node.id);
      if (onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [setSelectedNode, onNodeClick]
  );

  // Handle edge selection
  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: any) => {
      setSelectedEdge(edge.id);
      if (onEdgeClick) {
        onEdgeClick(edge.id);
      }
    },
    [setSelectedEdge, onEdgeClick]
  );

  // Handle connection start
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      
      // Open connection editor modal to define edge type and strength
      openConnectionEditor(connection.source, connection.target);
    },
    [openConnectionEditor]
  );

  // Auto-layout handler
  const handleAutoLayout = useCallback(() => {
    const layouted = getLayoutedElements(nodes, edges, "TB");
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
    
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 });
    }, 50);
  }, [nodes, edges, setNodes, setEdges, fitView]);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={isEditable}
        nodesConnectable={isEditable}
        elementsSelectable={true}
        defaultEdgeOptions={{
          type: "chainEdge",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: "#6b7280",
          },
          animated: false,
        }}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls showInteractive={isEditable} />
        <MiniMap
          nodeColor={(node) => {
            // Color minimap nodes by role
            const roleColors: Record<string, string> = {
              PREMISE: "#3b82f6",
              INFERENCE: "#a855f7",
              CONCLUSION: "#10b981",
              OBJECTION: "#ef4444",
              SUPPORT: "#14b8a6",
              REBUTTAL: "#f97316",
              SYNTHESIS: "#6366f1",
            };
            const role = (node.data as any)?.role || "PREMISE";
            return roleColors[role] || "#6b7280";
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          position="bottom-right"
        />
        
        {/* Control Panel */}
        {isEditable && (
          <Panel position="top-right" className="bg-white p-3 rounded-lg shadow-md space-y-2">
            <button
              onClick={handleAutoLayout}
              className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              Auto Layout
            </button>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

const ArgumentChainCanvas: React.FC<ArgumentChainCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ArgumentChainCanvasInner {...props} />
    </ReactFlowProvider>
  );
};

export default ArgumentChainCanvas;
