"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Feature flag controlling automatic proximity edge creation
const PROXIMITY_CONNECT_ENABLED = false;
import { usePathname } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { supabase } from "@/lib/supabaseclient";
import { useAuth } from "@/lib/AuthContext";
import { useReactFlow, useStoreApi } from "@xyflow/react";
import useStore from "@/lib/reactflow/store";
import { AppEdge, AppNode, AppState } from "@/lib/reactflow/types";
import { loadPlugins, PluginDescriptor } from "@/lib/pluginLoader";
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
import EmojiReactions from "../reactions/EmojiReactions";
import DefaultEdge from "../edges/DefaultEdge";
import ImageComputeNode from "../nodes/ImageComputeNode";
import ImageURLNode from "../nodes/ImageURLNode";
import LiveStreamNode from "../nodes/LiveStreamNode";
import TextInputNode from "../nodes/TextInputNode";
import PortalNode from "../nodes/PortalNode";
import YoutubeNode from "../nodes/YoutubeNode";
import CollageNode from "../nodes/CollageNode";
import GalleryNode from "../nodes/GalleryNode";
import DrawNode from "../nodes/DrawNode";
import LivechatNode from "../nodes/LivechatNode";
import AudioNode from "../nodes/AudioNode";
import LLMInstructionNode from "../nodes/LLMInstructionNode";
import HamburgerMenu from "../shared/HamburgerMenu";
import NodeSidebar from "../shared/NodeSidebar";
import { createRealtimeEdge } from "@/lib/actions/realtimeedge.actions";
import { updateRealtimePost } from "@/lib/actions/realtimepost.actions";
import { RealtimePost } from "@prisma/client";

// Load plug-ins from the plugins directory using webpack's require.context
const pluginContext = (require as any).context("../../plugins", false, /\\.tsx$/);
const pluginModules: Record<string, { descriptor?: PluginDescriptor }> = {};
pluginContext.keys().forEach((key: string) => {
  pluginModules[key] = pluginContext(key);
});
const pluginDescriptors = loadPlugins(pluginModules);
useStore.getState().registerPlugins(pluginDescriptors);

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
  const storeApi = useStoreApi();

  const MIN_DISTANCE = 150;

  const getClosestEdge = useCallback(
    (node: AppNode) => {
      if (!PROXIMITY_CONNECT_ENABLED) return null;
      const { nodeLookup } = storeApi.getState();
      const storeNodes = Array.from(nodeLookup.values());

      const closestNode = storeNodes.reduce(
        (res, n) => {
          if (n.id !== node.id) {
            const dx =
              (n.positionAbsolute?.x ?? 0) - (node.positionAbsolute?.x ?? 0);
            const dy =
              (n.positionAbsolute?.y ?? 0) - (node.positionAbsolute?.y ?? 0);
            const d = Math.sqrt(dx * dx + dy * dy);

            if (d < res.distance && d < MIN_DISTANCE) {
              res.distance = d;
              res.node = n;
            }
          }
          return res;
        },
        { distance: Number.MAX_VALUE, node: null as typeof node | null }
      );

      if (!closestNode.node) {
        return null;
      }

      const closeNodeIsSource =
        (closestNode.node.positionAbsolute?.x ?? 0) <
        (node.positionAbsolute?.x ?? 0);

      return {
        id: `${node.id}-${closestNode.node.id}`,
        source: closeNodeIsSource ? closestNode.node.id : node.id,
        target: closeNodeIsSource ? node.id : closestNode.node.id,
      };
    },
    [storeApi]
  );

  const onNodeDrag = useCallback(
    (_: any, node: AppNode) => {
      if (!PROXIMITY_CONNECT_ENABLED) return;
      const closeEdge = getClosestEdge(node);

      let nextEdges = edges.filter((e) => e.className !== "temp");

      if (
        closeEdge &&
        !nextEdges.find(
          (ne) => ne.source === closeEdge.source && ne.target === closeEdge.target
        )
      ) {
        nextEdges = [...nextEdges, { ...closeEdge, className: "temp" }];
      }

      setEdges(nextEdges);
    },
    [edges, getClosestEdge, setEdges]
  );

  const onConnect: OnConnect = useCallback((connection: Connection): void => {
    const edgeWithMarker = {
      ...connection,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
        color: "#ffffff",
      },
    };

    createRealtimeEdge({
      path: pathname,
      sourceNodeId: BigInt(connection.source),
      targetNodeId: BigInt(connection.target),
      realtimeRoomId: roomId,
    }).then(() => onConnectStore(edgeWithMarker));
  }, [onConnectStore, pathname, roomId]);

  const onNodeDragStop = useCallback(
    (_: any, node: AppNode) => {
      if (!PROXIMITY_CONNECT_ENABLED) return;
      const closeEdge = getClosestEdge(node);

      const nextEdges = edges.filter((e) => e.className !== "temp");

      setEdges(nextEdges);

      if (closeEdge) {
        onConnect({ source: closeEdge.source, target: closeEdge.target });
      }
    },
    [edges, getClosestEdge, onConnect, setEdges]
  );

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


  const onNodesChange: OnNodesChange<AppNode> = (changes) => {
    if (
      changes.length === 1 &&
      (changes[0] as NodePositionChange).dragging === false
    ) {
      const nodePositionChange = changes[0] as NodePositionChange;
      const existing = nodes.find((n) => n.id === nodePositionChange.id);
      if (
        existing &&
        (existing.position.x !== nodePositionChange.position.x ||
          existing.position.y !== nodePositionChange.position.y)
      ) {
        const authorId = (existing.data.author as any).id;
        if (user && Number(authorId) === Number(user.userId)) {
          updateRealtimePost({
            id: nodePositionChange.id,
            path: pathname,
            coordinates: nodePositionChange.position,
          });
        }
      }
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
    GALLERY: GalleryNode,
    PORTAL: PortalNode,
    DRAW: DrawNode,
    LIVECHAT: LivechatNode,
    AUDIO: AudioNode,
    LLM_INSTRUCTION: LLMInstructionNode,
  };
  pluginDescriptors.forEach((p) => {
    (nodeTypes as any)[p.type] = p.component as any;
  });
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
        onNodeDrag={PROXIMITY_CONNECT_ENABLED ? onNodeDrag : undefined}
        onNodeDragStop={
          PROXIMITY_CONNECT_ENABLED ? onNodeDragStop : undefined
        }
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
      {user && (
        <EmojiReactions
          channel={roomChannelRef.current}
          username={user.username!}
        />
      )}
    </div>
  );
}

export default Room;
