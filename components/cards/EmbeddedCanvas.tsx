"use client";
import { useMemo } from "react";
import { ReactFlow, Background } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import PostCard from "./PostCard";
import { useEffect, useState } from "react";
import React from "react";

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
  // Ensure stable, serialisable data
  const safeNodes = useMemo(
    () => nodes.map((n) => ({ ...n, id: String(n.id) })), [nodes]);
  const safeEdges = useMemo(
    () => edges.map((e) => ({
      ...e,
      id: String(e.id),
      source: String(e.source),
      target: String(e.target),
    })), [edges]);
  const defaultViewport = useMemo(
    () => viewport || { x: 0, y: 0, zoom: 1 },
    [viewport]
  );
  const handleNodeClick = (_: any, node: any) => {
    window.open(`/room/${roomId}`, "_blank");
  };
  // const interactionSettings = useMemo(() => ({
  //   nodesDraggable: false,
  //   nodesConnectable: false,
  //   nodesFocusable: false,
  //   zoomOnScroll: false,
  //   panOnScroll: false,
  // }), [])
  const interaction = useMemo(() => ({
    nodesDraggable: false,
    nodesConnectable: false,
    nodesFocusable: false,
    zoomOnScroll: false,
    panOnScroll: false,
  }), []);

  return (
   
    <ReactFlow
    nodes={safeNodes}
    edges={safeEdges}
    defaultViewport={defaultViewport}
    proOptions={{ hideAttribution: true }}
    // nodesDraggable={false}
    // nodesConnectable={false}
    // nodesFocusable={false}
    // onNodeClick={handleNodeClick}
    // zoomOnScroll= {false}
    // panOnScroll= {false}
     onNodeClick={(_, node) => window.open(`/room/${roomId}`, "_blank")}
    fitView={!viewport}          // only auto‑fit if there is no saved viewport
    {...interaction}
  >
    <Background />
    
  </ReactFlow>    
          

  );
};

