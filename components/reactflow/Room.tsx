"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { supabase } from "@/lib/supabaseclient";
import { useAuth } from "@/lib/AuthContext";
import { useReactFlow } from "@xyflow/react";
import useStore from "@/lib/reactflow/store";
import { AppEdge, AppNode, AppState } from "@/lib/reactflow/types";
import { subscribeToDatabaseUpdates, subscribeToRoom } from "@/lib/utils";
import {
  convertPostToNode,
  getReactFlowOffset,
} from "@/lib/reactflow/reactflowutils";
import {
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  MarkerType,
  NodePositionChange,
  OnConnect,
  OnNodesChange,
  Panel,
  ReactFlow,
} from "@xyflow/react";
import LiveCursors, { LiveCursorHandles } from "../cursors/LiveCursors";
import OwnCursor from "../cursors/OwnCursor";
import DefaultEdge from "../edges/DefaultEdge";
import ImageComputeNode from "../nodes/ImageComputeNode";
import ImageURLNode from "../nodes/ImageURLNode";
import LiveStreamNode from "../nodes/LiveStreamNode";
import TextInputNode from "../nodes/TextInputNode";
import YoutubeNode from "../nodes/YoutubeNode";
import CollageNode from "../nodes/CollageNode";
import HamburgerMenu from "../shared/HamburgerMenu";
import NodeSidebar from "../shared/NodeSidebar";
import { createRealtimeEdge } from "@/lib/actions/realtimeedge.actions";
import { updateRealtimePost } from "@/lib/actions/realtimepost.actions";
import { RealtimePost } from "@prisma/client";

const selector = (state: AppState) => ({
  nodes: state.nodes,
  edges: state.edges,
  setNodes: state.setNodes,
  setEdges: state.setEdges,
  onNodesChangeStore: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnectStore: state.onConnect,
  addNode: state.addNode,
  removeNode: state.removeNode,
  addEdge: state.addEdge,
  removeEdge: state.removeEdge,
});

interface Props {
  roomId: string;
  initialNodes: AppNode[];
  initialEdges: AppEdge[];
}

function Room({ roomId, initialNodes, initialEdges }: Props) {
  const { user } = useAuth();
  const pathname = usePathname();

  const [isTouchScreen, setIsTouchScreen] = useState(false);

  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChangeStore,
    onEdgesChange,
    onConnectStore,
    addNode,
    removeNode,
    addEdge,
    removeEdge,
  } = useStore(useShallow(selector));

  const { updateNode, updateEdge, setViewport } = useReactFlow();

  const reactFlowRef = useRef<HTMLDivElement>(null);
  const liveCursorsRef = useRef<LiveCursorHandles>(null);

  const roomChannelRef = useRef(supabase.channel(`Realtime-${roomId}`));
  const schemaUpdatesChannelRef = useRef(supabase.channel("schema-db-changes"));

  useEffect(() => {
    function handleTouchStart() {
      setIsTouchScreen(true);
    }
    setNodes(initialNodes);
    setEdges(
      initialEdges.map((edge) => ({
        ...edge,

        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
          color: "#ffffff",
        },
      }))
    );

    window.addEventListener("touchstart", handleTouchStart);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
    };
  }, [initialNodes, initialEdges, setEdges, setNodes]);

  const updateNodeFunction = useCallback(
    (updatedObject: RealtimePost) => {
      updateNode(updatedObject.id.toString(), () =>
        convertPostToNode({
          ...updatedObject,
          x_coordinate: Number(updatedObject.x_coordinate),
          y_coordinate: Number(updatedObject.y_coordinate),
        })
      );
    },
    [updateNode]
  );

  const updateEdgeFunction = useCallback(
    (edge: AppEdge) => {
      updateEdge(edge.id.toString(), () => edge);
    },
    [updateEdge]
  );

  useEffect(() => {
    if (!user) return;

    roomChannelRef.current = supabase.channel(`Realtime-${roomId}`);
    schemaUpdatesChannelRef.current = supabase.channel("schema-db-changes");

    subscribeToRoom(roomChannelRef.current, liveCursorsRef, user);
    subscribeToDatabaseUpdates(
      schemaUpdatesChannelRef.current,
      roomId,
      addNode,
      updateNodeFunction,
      removeNode,
      addEdge,
      updateEdgeFunction,
      removeEdge
    );

    return () => {
      roomChannelRef.current.unsubscribe();
      schemaUpdatesChannelRef.current.unsubscribe();
    };
  }, [
    user,
    roomId,
    addNode,
    removeNode,
    addEdge,
    removeEdge,
    updateNodeFunction,
    updateEdgeFunction,
  ]);

  const onConnect: OnConnect = (connection: Connection): void => {
    createRealtimeEdge({
      path: pathname,
      sourceNodeId: BigInt(connection.source),
      targetNodeId: BigInt(connection.target),
      realtimeRoomId: roomId,
    }).then(() => onConnectStore(connection));
  };

  const onNodesChange: OnNodesChange<AppNode> = (changes) => {
    if (
      changes.length === 1 &&
      (changes[0] as NodePositionChange).dragging === false
    ) {
      const nodePositionChange = changes[0] as NodePositionChange;
      updateRealtimePost({
        id: nodePositionChange.id,
        path: pathname,
        coordinates: nodePositionChange.position,
        collageLayoutStyle: "grid",
        collageColumns: 3,
        collageGap: 10,
      });
    }
    onNodesChangeStore(changes);
  };

  const handleTransform = useCallback(() => {
    setViewport({ x: 0, y: 0, zoom: 0.75 }, { duration: 800 });
  }, [setViewport]);

  const birdsEyeView = useCallback(() => {
    setViewport({ x: 500, y: 200, zoom: 0.1 }, { duration: 800 });
  }, [setViewport]);

  const nodeTypes = {
    TEXT: TextInputNode,
    VIDEO: YoutubeNode,
    IMAGE: ImageURLNode,
    LIVESTREAM: LiveStreamNode,
    IMAGE_COMPUTE: ImageComputeNode,
    COLLAGE: CollageNode,
  };
  const edgeTypes = {
    DEFAULT: DefaultEdge,
  };

  return (
    <div className="absolute inset-x-0 inset-y-0 cursor-none bg-white z-0">
      <ReactFlow
        style={{ cursor: "none" }}
        ref={reactFlowRef}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        deleteKeyCode={null}
        snapToGrid
        snapGrid={[10, 10]}
        minZoom={0.4}
        maxZoom={2}
        panOnDrag
        panOnScrollSpeed={0.5}
        colorMode="dark"
        selectionOnDrag={!isTouchScreen}
        panOnScroll={!isTouchScreen}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          id="2"
          gap={50}
          color="#282828"
          variant={BackgroundVariant.Lines}
          bgColor={"#051014"}
        />
        <Background
          id="3"
          gap={400}
          color="#888888"
          variant={BackgroundVariant.Lines}
          bgColor={"transparent"}
        />

        <Panel position="top-right">
          <HamburgerMenu roomId={roomId} />
        </Panel>
        <Panel position="top-left">
          <NodeSidebar reactFlowRef={reactFlowRef} />
        </Panel>
        <Panel position="bottom-right">
          <button
            className="button relative -bottom-[0px] pl-2 pr-2"
            onClick={handleTransform}
          >
            Center
          </button>
          <button
            className="button relative -bottom-[8px] pl-2 pr-2"
            onClick={birdsEyeView}
          >
            Zoom Out
          </button>
        </Panel>
        <Controls />
      </ReactFlow>

      {user && (
        <OwnCursor
          username={user.username!}
          channel={roomChannelRef.current}
          offset={getReactFlowOffset(reactFlowRef)}
        />
      )}
      {user && (
        <LiveCursors
          ref={liveCursorsRef}
          offset={getReactFlowOffset(reactFlowRef)}
        />
      )}
    </div>
  );
}

export default Room;
