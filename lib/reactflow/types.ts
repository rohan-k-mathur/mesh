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
import GalleryNodeModal from "@/components/modals/GalleryNodeModal";
import PortfolioNodeModal from "@/components/modals/PortfolioNodeModal";
import ProductReviewNodeModal from "@/components/modals/ProductReviewNodeModal";
import ShareRoomModal from "@/components/modals/ShareRoomModal";
import MusicNodeModal from "@/components/modals/MusicNodeModal";
import { PluginDescriptor } from "../pluginLoader";
// there is currently no dedicated modal for portal nodes

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

export type GalleryNodeData = Node<
  {
    images: string[];
    author: AuthorOrAuthorId;
    locked: boolean;
    isPublic: boolean;
    layoutStyle?: string;
    columns?: number;
    gap?: number;
  },
  "GALLERY"
>;

export type PortalNode = Node<
  {
    x: number;
    y: number;
    author: AuthorOrAuthorId;
    locked: boolean;
  },
  "PORTAL"
>;

export type DrawNode = Node<
  {
    author: AuthorOrAuthorId;
    locked: boolean;
    content?: string;
  },
  "DRAW"
>;

export type LivechatNode = Node<
  {
    inviteeId: number;
    author: AuthorOrAuthorId;
    locked: boolean;
  },
  "LIVECHAT"
>;

export type EntropyNode = Node<
  {
    inviteeId: number;
    author: AuthorOrAuthorId;
    locked: boolean;
    secret?: string;
    guesses?: string[];
  },
  "ENTROPY"
>;

export type AudioNode = Node<
  {
    audioUrl: string;
    author: AuthorOrAuthorId;
    locked: boolean;
  },
  "AUDIO"
>;

export type MusicNode = Node<
  {
    audioUrl: string;
    title: string;
    author: AuthorOrAuthorId;
    locked: boolean;
  },
  "MUSIC"
>;

export type DocumentNode = Node<
  {
    documentUrl: string;
    author: AuthorOrAuthorId;
    locked: boolean;
  },
  "DOCUMENT"
>;

export type ThreadNode = Node<
  {
    threadId: string;
    author: AuthorOrAuthorId;
    locked: boolean;
  },
  "THREAD"
>;

export type CodeNode = Node<
  {
    code: string;
    author: AuthorOrAuthorId;
    locked: boolean;
  },
  "CODE"
>;

export type PortfolioNodeData = Node<
  {
    text: string;
    images: string[];
    links: string[];
    layout: "grid" | "column";
    color: string;
    author: AuthorOrAuthorId;
    locked: boolean;
  },
  "PORTFOLIO"

  >;

export type LLMInstructionNode = Node<
  {
    prompt: string;
    output: string;
    status: "pending" | "running" | "complete";
    author: AuthorOrAuthorId;
    locked: boolean;
    model?: string;
  },
  "LLM_INSTRUCTION"
>;

export type ProductReviewNodeData = Node<
  {
    productName: string;
    rating: number;
    summary: string;
    productLink: string;
    images: string[];
    claims: string[];
    author: AuthorOrAuthorId;
    locked: boolean;
  },
  "PRODUCT_REVIEW"
>;



export type DefaultEdge = Edge<{}, "DEFAULT">;

export const NodeTypeMap = {
  TEXT: {} as TextNode,
  VIDEO: {} as YoutubeVidNode,
  IMAGE: {} as ImageUNode,
  LIVESTREAM: {} as WebcamNode,
  IMAGE_COMPUTE: {} as ImageComputeNodeProps,
  COLLAGE: {} as CollageNodeData,
  GALLERY: {} as GalleryNodeData,
  PORTAL: {} as PortalNode,
  DRAW: {} as DrawNode,
  LIVECHAT: {} as LivechatNode,
  ENTROPY: {} as EntropyNode,
  AUDIO: {} as AudioNode,
  MUSIC: {} as MusicNode,
  DOCUMENT: {} as DocumentNode,
  THREAD: {} as ThreadNode,
  CODE: {} as CodeNode,
  PORTFOLIO: {} as PortfolioNodeData,
  LLM_INSTRUCTION: {} as LLMInstructionNode,
  PRODUCT_REVIEW: {} as ProductReviewNodeData,
  PLUGIN: {} as PluginDescriptor,
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
  GALLERY: GalleryNodeModal,
  PORTFOLIO: PortfolioNodeModal,
  PRODUCT_REVIEW: ProductReviewNodeModal,
  PORTAL: ShareRoomModal,
  LIVECHAT: ShareRoomModal,
  ENTROPY: ShareRoomModal,
  MUSIC: MusicNodeModal,
};

export type AppNode =
  | TextNode
  | YoutubeVidNode
  | ImageUNode
  | WebcamNode
  | ImageComputeNodeProps
  | CollageNodeData
  | GalleryNodeData
  | PortalNode
  | DrawNode
  | LivechatNode
  | EntropyNode
  | AudioNode
  | MusicNode
  | DocumentNode
  | ThreadNode
  | CodeNode
  | PortfolioNodeData
  | LLMInstructionNode
  | ProductReviewNodeData
  | PluginDescriptor;

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
  ["GALLERY"]: "",
  ["PORTAL"]: "",
  ["DRAW"]: "",
  ["LIVECHAT"]: "",
  ["ENTROPY"]: "",
  ["AUDIO"]: "",
  ["MUSIC"]: "",
  ["DOCUMENT"]: "",
  ["THREAD"]: "",
  ["CODE"]: "",
  ["PORTFOLIO"]: "",
  ["LLM_INSTRUCTION"]: "",
  ["PRODUCT_REVIEW"]: "",
  ["PLUGIN"]: "",
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
  pluginDescriptors: PluginDescriptor[];
  registerPlugins: (plugins: PluginDescriptor[]) => void;
};
