"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
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
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useChainEditorStore } from "@/lib/stores/chainEditorStore";
import ArgumentChainNode from "./ArgumentChainNode";
import ArgumentChainEdge from "./ArgumentChainEdge";
import { getLayoutedElements } from "@/lib/utils/chainLayoutUtils";
import { ChainAnalysisPanel } from "./ChainAnalysisPanel";
import AddNodeButton from "./AddNodeButton";
import ConnectionEditor from "./ConnectionEditor";
import ChainMetadataPanel from "./ChainMetadataPanel";
import ChainExportButton from "./ChainExportButton";

const nodeTypes = {
  argumentNode: ArgumentChainNode,
};

const edgeTypes = {
  chainEdge: ArgumentChainEdge,
};

interface ArgumentChainCanvasProps {
  chainId: string; // Required for analysis
  deliberationId: string; // Required for AddNodeButton
  isEditable?: boolean;
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
}

const ArgumentChainCanvasInner: React.FC<ArgumentChainCanvasProps> = ({
  chainId,
  deliberationId,
  isEditable = true,
  onNodeClick,
  onEdgeClick,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    setChainMetadata,
  } = useChainEditorStore();

  // Initialize chain metadata in store
  useEffect(() => {
    setChainMetadata({ chainId });
  }, [chainId, setChainMetadata]);

  // Fetch and load chain data
  useEffect(() => {
    const loadChain = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/argument-chains/${chainId}/nodes`);
        if (response.ok) {
          const data = await response.json();
          
          // Transform nodes to ReactFlow format
          const loadedNodes = (data.nodes || []).map((node: any) => ({
            id: node.id,
            type: "argumentNode",
            position: { 
              x: node.positionX ?? Math.random() * 500, 
              y: node.positionY ?? Math.random() * 500 
            },
            data: {
              argument: node.argument,
              role: node.role,
              nodeOrder: node.nodeOrder,
              addedBy: node.contributor,
            },
          }));

          // Transform edges to ReactFlow format
          const loadedEdges = (data.edges || []).map((edge: any) => ({
            id: edge.id,
            source: edge.sourceNodeId,
            target: edge.targetNodeId,
            type: "chainEdge",
            data: {
              edgeType: edge.edgeType,
              strength: edge.strength,
              description: edge.description,
              slotMapping: edge.slotMapping,
            },
          }));

          setNodes(loadedNodes);
          setEdges(loadedEdges);

          // Auto-layout if nodes don't have positions
          if (loadedNodes.length > 0 && loadedNodes.every((n: any) => !n.data.positionX)) {
            setTimeout(() => {
              const layouted = getLayoutedElements(loadedNodes, loadedEdges, "TB");
              setNodes(layouted.nodes);
              setEdges(layouted.edges);
              fitView({ padding: 0.2, duration: 400 });
            }, 100);
          } else if (loadedNodes.length > 0) {
            setTimeout(() => {
              fitView({ padding: 0.2, duration: 400 });
            }, 100);
          }
        }
      } catch (error) {
        console.error("Failed to load chain:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChain();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId]); // Only reload when chainId changes

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

  // Handle node highlighting from analysis panel
  const handleHighlightNodes = useCallback((nodeIds: string[]) => {
    setHighlightedNodes(nodeIds);
    
    // Clear highlights after 3 seconds
    setTimeout(() => {
      setHighlightedNodes([]);
    }, 3000);
    
    // Fit view to highlighted nodes if any exist
    if (nodeIds.length > 0) {
      const nodesToFit = nodes.filter((n) => nodeIds.includes(n.id));
      if (nodesToFit.length > 0) {
        fitView({ 
          nodes: nodesToFit,
          padding: 0.3,
          duration: 400,
        });
      }
    }
  }, [nodes, fitView]);

  // Show loading state
  if (isLoading) {
    return (
      <div ref={reactFlowWrapper} className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chain...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={reactFlowWrapper} className="w-full h-full relative flex">
      {/* Main Canvas */}
      <div className={`flex-1 transition-all duration-300 ${showAnalysisPanel ? 'mr-96' : ''}`}>
        <ReactFlow
          nodes={nodes.map((node) => ({
            ...node,
            // Add highlight styling to node data
            data: {
              ...node.data,
              isHighlighted: highlightedNodes.includes(node.id),
            },
          }))}
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
                EVIDENCE: "#14b8a6",
                CONCLUSION: "#10b981",
                OBJECTION: "#ef4444",
                REBUTTAL: "#f97316",
                QUALIFIER: "#a855f7",
              };
              const role = (node.data as any)?.role || "PREMISE";
              return roleColors[role] || "#6b7280";
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
            position="bottom-right"
          />
          
          {/* Control Panel */}
          {isEditable && (
            <Panel position="top-right" className="space-y-2">
              <div className="bg-white p-3 rounded-lg shadow-md space-y-2">
                <AddNodeButton deliberationId={deliberationId} />
                <ChainMetadataPanel />
                <ChainExportButton chainName={nodes.length > 0 ? "argument-chain" : undefined} />
                <button
                  onClick={handleAutoLayout}
                  className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                >
                  Auto Layout
                </button>
                <button
                  onClick={() => setShowAnalysisPanel(!showAnalysisPanel)}
                  className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  {showAnalysisPanel ? (
                    <>
                      <ChevronRight className="h-4 w-4" />
                      Hide Analysis
                    </>
                  ) : (
                    <>
                      <ChevronLeft className="h-4 w-4" />
                      Show Analysis
                    </>
                  )}
                </button>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* Analysis Panel Sidebar */}
      {showAnalysisPanel && (
        <div className="absolute top-0 right-0 w-96 h-full bg-white border-l border-gray-200 shadow-xl overflow-y-auto z-10">
          <ChainAnalysisPanel
            chainId={chainId}
            onHighlightNodes={handleHighlightNodes}
          />
        </div>
      )}

      {/* Connection Editor Modal */}
      <ConnectionEditor />
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
