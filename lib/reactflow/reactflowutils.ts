import { Edge, MarkerType } from "@xyflow/react";
import {
  TextNode,
  YoutubeVidNode,
  ImageUNode,
  AppNode,
  WebcamNode,
  ImageComputeNodeProps,
  CollageNodeData,
  AppEdge,
} from "./types";

import { RealtimeEdge, RealtimePost, User } from "@prisma/client";

export function getReactFlowOffset(
  reactFlowRef: React.RefObject<HTMLDivElement>
): {
  top: number;
  left: number;
} {
  return reactFlowRef.current
    ? {
        top: reactFlowRef.current.getBoundingClientRect().top,
        left: reactFlowRef.current.getBoundingClientRect().left,
      }
    : { top: 0, left: 0 };
}

export function convertRealtimeEdgeToEdge(realtimeEdge: RealtimeEdge): AppEdge {
  return {
    id: realtimeEdge.id.toString(),
    source: realtimeEdge.source_node_id.toString(),
    target: realtimeEdge.target_node_id.toString(),
    style: {
      strokeWidth: 3,
      stroke: "#ffffff",
    },
    type: "DEFAULT",
  };
}
export function convertPostToNode(
  realtimePost: Omit<RealtimePost, "x_coordinate" | "y_coordinate"> & {
    x_coordinate: number;
    y_coordinate: number;
  },
  author?: User
): AppNode {
  const authorToSet = author ? author : { id: realtimePost.author_id };
  switch (realtimePost.type) {
    case "TEXT":
      return {
        id: realtimePost.id.toString(),
        type: realtimePost.type,
        data: {
          text: realtimePost.content,
          author: authorToSet,
          locked: realtimePost.locked,
        },
        position: {
          x: realtimePost.x_coordinate,
          y: realtimePost.y_coordinate,
        },
      } as TextNode;
    case "VIDEO":
      return {
        id: realtimePost.id.toString(),
        type: realtimePost.type,
        data: {
          videoid: realtimePost.video_url,
          author: authorToSet,
          locked: realtimePost.locked,
        },
        position: {
          x: realtimePost.x_coordinate,
          y: realtimePost.y_coordinate,
        },
      } as YoutubeVidNode;
    case "IMAGE":
      return {
        id: realtimePost.id.toString(),
        type: realtimePost.type,
        data: {
          imageurl: realtimePost.image_url,
          author: authorToSet,
          locked: realtimePost.locked,
        },
        position: {
          x: realtimePost.x_coordinate,
          y: realtimePost.y_coordinate,
        },
      } as ImageUNode;
    case "LIVESTREAM":
      return {
        id: realtimePost.id.toString(),
        type: realtimePost.type,
        data: {
          author: authorToSet,
          locked: realtimePost.locked,
        },
        position: {
          x: realtimePost.x_coordinate,
          y: realtimePost.y_coordinate,
        },
      } as WebcamNode;
    case "IMAGE_COMPUTE":
      return {
        id: realtimePost.id.toString(),
        type: realtimePost.type,
        data: {
          imageurl: realtimePost.image_url,
          author: authorToSet,
          locked: realtimePost.locked,
        },
        position: {
          x: realtimePost.x_coordinate,
          y: realtimePost.y_coordinate,
        },
      } as ImageComputeNodeProps;
      case "COLLAGE": 
        return{
          id: realtimePost.id.toString(),
          type: realtimePost.type, // literal string
          data: {
            images: [], // or gather them from DB if you store them
            author: authorToSet,
            locked: realtimePost.locked,
          },
          position: {
            x: realtimePost.x_coordinate,
            y: realtimePost.y_coordinate,
          },
        }  as CollageNodeData;
      
    default:
      throw new Error("Unsupported real-time post type");
      
  }
  
}
