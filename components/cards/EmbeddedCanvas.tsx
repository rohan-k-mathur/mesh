"use client";
import { useMemo } from "react";
import { ReactFlow, Background } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface Props {
  canvas: { nodes: any[]; edges: any[]; viewport?: { x: number; y: number; zoom: number } };
  roomId: string;
}

export default function EmbeddedCanvas({ canvas, roomId }: Props) {
  const { nodes, edges, viewport } = canvas;
  const defaultViewport = useMemo(
    () => viewport || { x: 0, y: 0, zoom: 1 },
    [viewport]
  );
  const handleNodeClick = (_: any, node: any) => {
    window.open(`/room/${roomId}`, "_blank");
  };
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      defaultViewport={defaultViewport}
      nodesDraggable={false}
      nodesConnectable={false}
      nodesFocusable={false}
      onNodeClick={handleNodeClick}
      fitView
    >
      <Background />
    </ReactFlow>
  );
}
