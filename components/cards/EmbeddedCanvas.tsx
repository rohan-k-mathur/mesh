"use client";
import { useMemo } from "react";
import { ReactFlow, Background } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useState } from "react";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Spinner from "@/components/ui/spinner";

interface Props {
  canvas: { nodes: any[]; edges: any[]; viewport?: { x: number; y: number; zoom: number } };
  roomId: string;

}


// const ReplicatedPostCard = ({
//   id,
//   originalPostId,
//   currentUserId,
//   isRealtimePost = false,
//   author,
//   createdAt,
//   likeCount,
//   expirationDate,
// }: Props) => {

export default function EmbeddedCanvas({ canvas, roomId }: Props) {
  const { nodes = [], edges = [], viewport } = canvas;
  const [loading, setLoading] = useState(true);
  const [showCanvas, setShowCanvas] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // Ensure stable, serialisable data
  const safeNodes = useMemo(
    () => nodes.map((n) => ({ ...n, id: String(n.id) })),
    [nodes]
  );
  const safeEdges = useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        id: String(e.id),
        source: String(e.source),
        target: String(e.target),
      })),
    [edges]
  );
  const defaultViewport = useMemo(
    () => viewport || { x: 0, y: 0, zoom: 1 },
    [viewport]
  );

  const interaction = useMemo(
    () => ({
      nodesDraggable: false,
      nodesConnectable: false,
      nodesFocusable: false,
      zoomOnScroll: false,
      panOnScroll: false,
    }),
    []
  );

  if (loading) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <Skeleton className="w-full h-full" />
        <div className="absolute">
          <Spinner className="h-8 w-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {showCanvas && (
        <ReactFlow
          nodes={safeNodes}
          edges={safeEdges}
          defaultViewport={defaultViewport}
          proOptions={{ hideAttribution: true }}
          onNodeClick={(_, node) => window.open(`/room/${roomId}`, "_blank")}
          fitView={!viewport}
          {...interaction}
        >
          <Background />
        </ReactFlow>
      )}
      {!showCanvas && <div className="w-full h-full" />}
      {!showCanvas && (
        <div
          className="absolute inset-0 bg-white/60 flex items-center justify-center cursor-pointer"
          onClick={() => setShowCanvas(true)}
        >
          <span className="text-sm">Click to load canvas</span>
        </div>
      )}
    </div>
  );
}

