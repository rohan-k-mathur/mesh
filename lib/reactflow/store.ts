import { addEdge, applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import { create } from "zustand";
import {
  AppNode,
  AppState,
  TextNode,
  ImageUNode,
  YoutubeVidNode,
  WebcamNode,
  CollageNodeData,
  AppEdge,
} from "./types";

function isTextNode(node: AppNode): node is TextNode {
  return node.type === "TEXT";
}
function isYoutubeNode(node: AppNode): node is YoutubeVidNode {
  return node.type === "VIDEO";
}
function isImageUNode(node: AppNode): node is ImageUNode {
  return node.type === "IMAGE";
}
function isWebcamNode(node: AppNode): node is WebcamNode {
  return node.type === "LIVESTREAM";
}
function isCollageNode(node: AppNode): node is CollageNodeData {
  return node.type === "COLLAGE";
}

function isDefaultEdge(edge: AppEdge): edge is AppEdge {
  return edge.type === "DEFAULT";
}
// this is our useStore hook that we can use in our components to get parts of the store and call actions
const useStore = create<AppState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeType: "TEXT",
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },
  setNodes: (nodes) => {
    set({ nodes });
  },
  addNode: (newNode) => {
    set({
      nodes: [...get().nodes, newNode],
    });
  },
  addEdge: (newEdge) => {
    set({
      edges: [...get().edges, newEdge],
    });
  },
  removeNode: (idToRemove) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== idToRemove),
    });
  },
  removeEdge: (idToRemove) => {
    set({
      edges: get().edges.filter((edge) => edge.id !== idToRemove),
    });
  },
  setEdges: (edges) => {
    set({ edges });
  },
  setSelectedNodeType: (type) => {
    set({ selectedNodeType: type });
  },
  isModalOpen: false,
  modalContent: null,
  openModal: (modalContent) => set({ isModalOpen: true, modalContent }),
  closeModal: () => set({ isModalOpen: false, modalContent: null }),
  reactFlowRef: null,
  setReactFlowRef: (ref) => set({ reactFlowRef: ref }),
  changePostLockState: (id, lockState) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === id ? { ...node, locked: lockState } : node
      ),
    });
  },
}));

export default useStore;
