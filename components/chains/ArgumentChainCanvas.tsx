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
  BackgroundVariant,
  MarkerType,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useChainEditorStore } from "@/lib/stores/chainEditorStore";
import ArgumentChainNode from "./ArgumentChainNode";
import ArgumentChainEdge from "./ArgumentChainEdge";
import { getLayoutedElements } from "@/lib/utils/chainLayoutUtils";
import { ChainAnalysisPanel } from "./ChainAnalysisPanel";
import { EnablerPanel } from "./EnablerPanel";
import AddNodeButton from "./AddNodeButton";
import ConnectionEditor from "./ConnectionEditor";
import ChainMetadataPanel from "./ChainMetadataPanel";
import ChainExportButton from "./ChainExportButton";
import ChainArgumentComposer, { ChainComposerContext } from "./ChainArgumentComposer";

const nodeTypes = {
  argumentNode: ArgumentChainNode,
};

const edgeTypes = {
  chainEdge: ArgumentChainEdge,
};

interface ArgumentChainCanvasProps {
  chainId: string; // Required for analysis
  deliberationId: string; // Required for AddNodeButton
  currentUserId?: string | null; // Required for creating new arguments
  isEditable?: boolean;
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
}

const ArgumentChainCanvasInner: React.FC<ArgumentChainCanvasProps> = ({
  chainId,
  deliberationId,
  currentUserId,
  isEditable = true,
  onNodeClick,
  onEdgeClick,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [edgeAttacks, setEdgeAttacks] = useState<Record<string, number>>({});
  
  // Composer dialog state
  const [showComposer, setShowComposer] = useState(false);
  const [composerContext, setComposerContext] = useState<ChainComposerContext | null>(null);

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
    edgeAttackMode,
    targetedEdgeId,
    enterEdgeAttackMode,
    exitEdgeAttackMode,
    setTargetedEdge,
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

          // Count attacks per edge
          const attackCounts: Record<string, number> = {};
          loadedNodes.forEach((node: any) => {
            if (node.data.targetType === "EDGE" && node.data.targetEdgeId) {
              attackCounts[node.data.targetEdgeId] = (attackCounts[node.data.targetEdgeId] || 0) + 1;
            }
          });
          setEdgeAttacks(attackCounts);

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
      if (edgeAttackMode) {
        // In attack mode, selecting an edge targets it
        setTargetedEdge(edge.id);
      } else {
        // Normal mode, just select the edge
        setSelectedEdge(edge.id);
      }
      
      if (onEdgeClick) {
        onEdgeClick(edge.id);
      }
    },
    [setSelectedEdge, onEdgeClick, edgeAttackMode, setTargetedEdge]
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

  // Open composer for supporting an argument
  const handleSupportNode = useCallback((nodeId: string, argumentId: string, conclusionText?: string) => {
    setComposerContext({
      mode: "support",
      targetNode: {
        nodeId,
        argumentId,
        conclusionText,
      },
      suggestedRole: "PREMISE",
      suggestedScheme: "SUPPORTS",
    });
    setShowComposer(true);
  }, []);

  // Open composer for attacking an argument (REBUTS)
  const handleAttackNode = useCallback((
    nodeId: string, 
    argumentId: string, 
    conclusionId?: string,
    conclusionText?: string,
    attackType: "REBUTS" | "UNDERCUTS" | "UNDERMINES" = "REBUTS"
  ) => {
    setComposerContext({
      mode: "attack",
      attackType,
      targetNode: {
        nodeId,
        argumentId,
        conclusionId,
        conclusionText,
      },
      suggestedRole: "OBJECTION",
    });
    setShowComposer(true);
  }, []);

  // Open composer for attacking an edge (UNDERCUTS)
  const handleAttackEdge = useCallback((edgeId: string, sourceNodeId: string, targetNodeId: string) => {
    setComposerContext({
      mode: "attack",
      attackType: "UNDERCUTS",
      targetEdge: {
        edgeId,
        sourceNodeId,
        targetNodeId,
      },
      suggestedRole: "OBJECTION",
    });
    setShowComposer(true);
  }, []);

  // Handle argument created from composer
  const handleComposerCreated = useCallback(async (argument: any) => {
    // Add the new argument as a node
    try {
      const response = await fetch(`/api/argument-chains/${chainId}/nodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          argumentId: argument.id,
          role: composerContext?.suggestedRole || "PREMISE",
        }),
      });

      if (response.ok) {
        const newNode = await response.json();
        
        // Add to ReactFlow
        const nodePosition = { 
          x: Math.random() * 300, 
          y: Math.random() * 300 
        };
        
        setNodes([
          ...nodes,
          {
            id: newNode.id,
            type: "argumentNode",
            position: nodePosition,
            data: {
              argument: argument,
              role: newNode.role,
              nodeOrder: newNode.nodeOrder,
              addedBy: newNode.contributor || null,
            },
          },
        ]);

        // Auto-create edge if we have a target
        if (composerContext?.targetNode?.nodeId) {
          const edgeType = composerContext.mode === "support" ? "SUPPORTS" : 
            composerContext.attackType || "REBUTS";
          
          const edgeResponse = await fetch(`/api/argument-chains/${chainId}/edges`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceNodeId: newNode.id,
              targetNodeId: composerContext.targetNode.nodeId,
              edgeType,
              strength: 1.0,
            }),
          });

          if (edgeResponse.ok) {
            const newEdge = await edgeResponse.json();
            setEdges([
              ...edges,
              {
                id: newEdge.id,
                source: newNode.id,
                target: composerContext.targetNode.nodeId,
                type: "chainEdge",
                data: {
                  edgeType: newEdge.edgeType,
                  strength: newEdge.strength,
                },
              },
            ]);
          }
        } else if (composerContext?.targetEdge?.edgeId) {
          // For edge attacks (undercuts), we need different handling
          // The new node attacks an edge, which requires special edge representation
          // For now, we'll create a node-to-target-node edge as UNDERCUTS
          const targetNodeId = composerContext.targetEdge.targetNodeId;
          
          const edgeResponse = await fetch(`/api/argument-chains/${chainId}/edges`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceNodeId: newNode.id,
              targetNodeId: targetNodeId,
              edgeType: "UNDERCUTS",
              strength: 1.0,
              description: `Challenges inference in edge ${composerContext.targetEdge.edgeId}`,
            }),
          });

          if (edgeResponse.ok) {
            const newEdge = await edgeResponse.json();
            setEdges([
              ...edges,
              {
                id: newEdge.id,
                source: newNode.id,
                target: targetNodeId,
                type: "chainEdge",
                data: {
                  edgeType: newEdge.edgeType,
                  strength: newEdge.strength,
                  description: newEdge.description,
                },
              },
            ]);
          }
        }

        // Auto-layout after adding
        setTimeout(() => {
          const layouted = getLayoutedElements(
            [...nodes, { 
              id: newNode.id, 
              type: "argumentNode", 
              position: nodePosition, 
              data: { 
                argument, 
                role: newNode.role,
                nodeOrder: newNode.nodeOrder,
                addedBy: newNode.contributor || null,
              } 
            }],
            edges,
            "TB"
          );
          setNodes(layouted.nodes);
          setEdges(layouted.edges);
          fitView({ padding: 0.2, duration: 400 });
        }, 100);
      }
    } catch (error) {
      console.error("Failed to add node to chain:", error);
    }

    setShowComposer(false);
    setComposerContext(null);
  }, [chainId, composerContext, nodes, edges, setNodes, setEdges, fitView]);

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
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
            // Add highlight styling and action handlers to node data
            data: {
              ...node.data,
              isHighlighted: highlightedNodes.includes(node.id),
              isEditable,
              onSupport: handleSupportNode,
              onAttack: handleAttackNode,
            },
          }))}
          edges={edges.map((edge) => ({
            ...edge,
            // Add targeted styling to edge data
            data: {
              ...edge.data,
              isTargeted: targetedEdgeId === edge.id,
              attackCount: edgeAttacks[edge.id] || 0,
              isEditable,
              onAttackEdge: handleAttackEdge,
            },
            // Update edge styling when targeted
            ...(targetedEdgeId === edge.id && {
              animated: true,
              style: { stroke: "#ef4444", strokeWidth: 3 },
            }),
          }))}
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
          <Background           variant={BackgroundVariant.Lines}
           color="#e5e7eb" gap={20} />

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
                {/* Edge Attack Mode Toggle */}
                {edgeAttackMode ? (
                  <div className="bg-red-50 border border-red-200 rounded p-2">
                    <p className="text-xs text-red-700 font-medium mb-2">
                      🎯 Attack Mode: Click an edge to target it
                    </p>
                    <button
                      onClick={exitEdgeAttackMode}
                      className="w-full px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors"
                    >
                      Exit Attack Mode
                    </button>
                    {targetedEdgeId && (
                      <p className="text-xs text-red-600 mt-2">
                        Edge targeted. Add argument to attack this inference.
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={enterEdgeAttackMode}
                    className="w-full px-3 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                  >
                    🎯 Attack Edge
                  </button>
                )}
                
                <AddNodeButton deliberationId={deliberationId} userId={currentUserId || undefined} />
                <ChainMetadataPanel />
                <ChainExportButton chainName={nodes.length > 0 ? "argument-chain" : undefined} />
                <button
                  onClick={handleAutoLayout}
                  className="w-full px-3 py-2 text-sm font-medium text-white bg-sky-600 rounded hover:bg-sky-700 transition-colors"
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
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="enablers">Enablers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analysis" className="mt-0">
              <ChainAnalysisPanel
                chainId={chainId}
                onHighlightNodes={handleHighlightNodes}
              />
            </TabsContent>
            
            <TabsContent value="enablers" className="mt-0 p-4">
              <EnablerPanel
                nodes={nodes}
                chainId={chainId}
                onHighlightNode={(nodeId) => handleHighlightNodes([nodeId])}
                onChallengeEnabler={(nodeId, schemeName, enablerText) => {
                  // Select the node to highlight it
                  setSelectedNode(nodeId);
                  handleHighlightNodes([nodeId]);
                  
                  // Show informational alert about challenging
                  alert(
                    `Challenging Inference Assumption\n\n` +
                    `Node: ${nodeId}\n` +
                    `Scheme: ${schemeName}\n\n` +
                    `Assumption to challenge:\n"${enablerText}"\n\n` +
                    `To challenge this assumption, you would create an UNDERCUTS attack ` +
                    `that targets the inference rule itself rather than the premises or conclusion.\n\n` +
                    `This feature will be fully integrated with recursive attack support in the next phase.`
                  );
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Connection Editor Modal */}
      <ConnectionEditor />

      {/* Chain Argument Composer for contextual argument creation */}
      {currentUserId && deliberationId && (
        <ChainArgumentComposer
          open={showComposer}
          onOpenChange={(open) => {
            setShowComposer(open);
            if (!open) setComposerContext(null);
          }}
          context={composerContext || undefined}
          deliberationId={deliberationId}
          userId={currentUserId}
          chainId={chainId}
          onCreated={handleComposerCreated}
        />
      )}
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
