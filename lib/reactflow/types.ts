import { User } from "@prisma/client";
import {
  Node,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Edge,
} from "@xyflow/react";
import TextNodeModal from "@/components/modals/TextNodeModal";
import ImageNodeModal from "@/components/modals/ImageNodeModal";
import YoutubeNodeModal from "@/components/modals/YoutubeNodeModal";
import CollageCreationModal from "@/components/modals/CollageCreationModal";

import { RefObject } from "react";

export type AuthorOrAuthorId = User | Pick<User, "id">;

export type TextNode = Node<
  {
    text: string;
    author: AuthorOrAuthorId;
    locked: boolean;
  },
  "TEXT"
>;

export type YoutubeVidNode = Node<
  {
    videoid: string;
    author: AuthorOrAuthorId;
    locked: boolean;
  },
  "VIDEO"
>;

export type ImageUNode = Node<
  {
    imageurl: string;
    author: AuthorOrAuthorId;
    locked: boolean;
  },
  "IMAGE"
>;

export type WebcamNode = Node<
  {
    streamid?: string;
    author: AuthorOrAuthorId;
    locked: boolean;
  },
  "LIVESTREAM"
>;

export type ImageComputeNodeProps = Node<
  {
    imageurl: string;
    author: AuthorOrAuthorId;
    locked: boolean;
  },
  "IMAGE_COMPUTE"
>;

export type CollageNodeData = Node<
  {
    images: string[];
    author: AuthorOrAuthorId;
    locked: boolean;
    layoutStyle?: string;
    columns?: number;
    gap?: number;
  },
  "COLLAGE"
>;



export type DefaultEdge = Edge<{}, "DEFAULT">;

export const NodeTypeMap = {
  TEXT: {} as TextNode,
  VIDEO: {} as YoutubeVidNode,
  IMAGE: {} as ImageUNode,
  LIVESTREAM: {} as WebcamNode,
  IMAGE_COMPUTE: {} as ImageComputeNodeProps,
  COLLAGE: {} as CollageNodeData,
};

export interface AppEdgeMapping {
  DEFAULT: DefaultEdge;
}

export type AppNodeMapping = typeof NodeTypeMap;
export type AppNodeType = keyof AppNodeMapping;

export const NodeTypeToModalMap = {
  TEXT: TextNodeModal,
  IMAGE: ImageNodeModal,
  VIDEO: YoutubeNodeModal,
  COLLAGE: CollageCreationModal,
};

export type AppNode =
  | TextNode
  | YoutubeVidNode
  | ImageUNode
  | WebcamNode
  | ImageComputeNodeProps
  | CollageNodeData;

export type AppEdgeType = keyof AppEdgeMapping;

export type AppEdge = DefaultEdge;

export const DEFAULT_NODE_VALUES: Record<AppNodeType, string> = {
  ["TEXT"]: "",
  ["IMAGE"]: "https://live.staticflickr.com/5702/23230527751_b14f3cd11d_b.jpg",
  ["VIDEO"]: "https://www.youtube.com/embed/vtuekd0rsa8?si=IR5QKuol1_CL1xZf",
  ["LIVESTREAM"]: "",
  ["IMAGE_COMPUTE"]:
    "https://live.staticflickr.com/5702/23230527751_b14f3cd11d_b.jpg",
  ["COLLAGE"]:"",
};

export type AppState = {
  nodes: AppNode[];
  edges: AppEdge[];
  selectedNodeType: AppNodeType;
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange<AppEdge>;
  onConnect: OnConnect;
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: AppEdge[]) => void;
  addNode: (node: AppNode) => void;
  addEdge: (edge: AppEdge) => void;
  removeNode: (idToRemove: string) => void;
  removeEdge: (idToRemove: string) => void;
  setSelectedNodeType: (type: AppNodeType) => void;
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
  reactFlowRef: RefObject<HTMLDivElement> | null;
  setReactFlowRef: (ref: RefObject<HTMLDivElement>) => void;
  changePostLockState: (id: string, lockState: boolean) => void;
};
