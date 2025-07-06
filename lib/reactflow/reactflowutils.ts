import { Edge, MarkerType } from "@xyflow/react";
import {
  TextNode,
  YoutubeVidNode,
  ImageUNode,
  AppNode,
  WebcamNode,
  ImageComputeNodeProps,
  CollageNodeData,
  GalleryNodeData,
  PortalNode,
  DrawNode,
  LivechatNode,
  AudioNode,
  DocumentNode,
  ThreadNode,
  CodeNode,
  PortfolioNodeData,
  LLMInstructionNode,

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
        return {
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
      case "GALLERY":
        let galleryImages: string[] = [];
        if (realtimePost.content) {
          try {
            galleryImages = JSON.parse(realtimePost.content);
          } catch (e) {
            galleryImages = [];
          }
        }
        return {
          id: realtimePost.id.toString(),
          type: realtimePost.type,
          data: {
            images: galleryImages,
            author: authorToSet,
            locked: realtimePost.locked,
            isPublic: (realtimePost as any).isPublic ?? false,
          },
          position: {
            x: realtimePost.x_coordinate,
            y: realtimePost.y_coordinate,
          },
        } as GalleryNodeData;
        case "PORTAL":
          let portalCoords = { x: 0, y: 0 };
          if (realtimePost.content) {
            try {
              portalCoords = JSON.parse(realtimePost.content);
            } catch (e) {
              portalCoords = { x: 0, y: 0 };
            }
          }
          return {
            id: realtimePost.id.toString(),
            type: realtimePost.type,
            data: {
              x: portalCoords.x,
              y: portalCoords.y,
              author: authorToSet,
              locked: realtimePost.locked,
            },
            position: {
              x: realtimePost.x_coordinate,
              y: realtimePost.y_coordinate,
            },
          } as PortalNode;
      case "DRAW":
        return {
          id: realtimePost.id.toString(),
          type: realtimePost.type,
          data: {
            author: authorToSet,
            locked: realtimePost.locked,
            content: realtimePost.content ?? undefined,
          },
          position: {
            x: realtimePost.x_coordinate,
            y: realtimePost.y_coordinate,
          },
        } as DrawNode;
      case "LIVECHAT": {
        let inviteeId = 0;
        if (realtimePost.content) {
          try {
            inviteeId = JSON.parse(realtimePost.content).inviteeId;
          } catch (e) {
            inviteeId = 0;
          }
        }
        return {
          id: realtimePost.id.toString(),
          type: realtimePost.type,
          data: { inviteeId, author: authorToSet, locked: realtimePost.locked },
          position: { x: realtimePost.x_coordinate, y: realtimePost.y_coordinate }
        } as LivechatNode;
      }
      case "AUDIO":
        return {
          id: realtimePost.id.toString(),
          type: realtimePost.type,
          data: {
            audioUrl: realtimePost.video_url || "",
            author: authorToSet,
            locked: realtimePost.locked,
          },
          position: {
            x: realtimePost.x_coordinate,
            y: realtimePost.y_coordinate,
          },
        } as AudioNode;
      case "DOCUMENT":
        return {
          id: realtimePost.id.toString(),
          type: realtimePost.type,
          data: {
            documentUrl: realtimePost.video_url || realtimePost.image_url || "",
            author: authorToSet,
            locked: realtimePost.locked,
          },
          position: {
            x: realtimePost.x_coordinate,
            y: realtimePost.y_coordinate,
          },
        } as DocumentNode;
      case "THREAD":
        return {
          id: realtimePost.id.toString(),
          type: realtimePost.type,
          data: {
            threadId: realtimePost.content || realtimePost.id.toString(),
            author: authorToSet,
            locked: realtimePost.locked,
          },
          position: {
            x: realtimePost.x_coordinate,
            y: realtimePost.y_coordinate,
          },
        } as ThreadNode;
      case "CODE":
        return {
          id: realtimePost.id.toString(),
          type: realtimePost.type,
          data: {
            code: realtimePost.content || "",
            author: authorToSet,
            locked: realtimePost.locked,
          },
          position: {
            x: realtimePost.x_coordinate,
            y: realtimePost.y_coordinate,
          },
        } as CodeNode;
      case "PORTFOLIO": {
          let text = "";
          let images: string[] = [];
          let links: string[] = [];
          let layout: "grid" | "column" = "grid";
          let color = "bg-white";
  
          if (realtimePost.content) {
            try {
              const parsed = JSON.parse(realtimePost.content);
              text = parsed.text || "";
              images = parsed.images || [];
              links = parsed.links || [];
              layout = parsed.layout || "grid";
              color = parsed.color || "bg-white";
            } catch {
              text = realtimePost.content || "";
            }
          }
  
          if (images.length === 0 && realtimePost.image_url) {
            images = [realtimePost.image_url];
          }
          if (links.length === 0 && realtimePost.video_url) {
            links = [realtimePost.video_url];
          }
          return {
          id: realtimePost.id.toString(),
          type: realtimePost.type,
          data: {
            text,
            images,
            links,
            layout,
            color,
            author: authorToSet,
            locked: realtimePost.locked,
          },
          position: {
            x: realtimePost.x_coordinate,
            y: realtimePost.y_coordinate,
          },
        } as PortfolioNodeData;
      }

      case "PRODUCT_REVIEW": {
        let productName = "";
        let rating = 5;
        let summary = "";
        let productLink = "";
        if (realtimePost.content) {
          try {
            const parsed = JSON.parse(realtimePost.content);
            productName = parsed.productName || "";
            rating = parsed.rating || 5;
            summary = parsed.summary || "";
            productLink = parsed.productLink || "";
          } catch {}
        }
        return {
          id: realtimePost.id.toString(),
          type: realtimePost.type,
          data: {
            productName,
            rating,
            summary,
            productLink,
            author: authorToSet,
            locked: realtimePost.locked,
          },
          position: {
            x: realtimePost.x_coordinate,
            y: realtimePost.y_coordinate,
          },
        } as AppNode;
      }

      case "LLM_INSTRUCTION":
        return {
          id: realtimePost.id.toString(),
          type: realtimePost.type,
          data: {
            prompt: realtimePost.content || "",
            output: "",
            status: "pending",
            author: authorToSet,
            locked: realtimePost.locked,
          },
          position: {
            x: realtimePost.x_coordinate,
            y: realtimePost.y_coordinate,
          },
        } as LLMInstructionNode;

      case "PLUGIN": {
        const data = realtimePost.pluginData ||
          (realtimePost.content ? JSON.parse(realtimePost.content) : {});
        const nodeType = (realtimePost as any).pluginType || "PLUGIN";
        return {
          id: realtimePost.id.toString(),
          type: nodeType,
          data: { ...data, author: authorToSet, locked: realtimePost.locked },
          position: {
            x: realtimePost.x_coordinate,
            y: realtimePost.y_coordinate,
          },
        } as AppNode;
      }

      default:
        throw new Error("Unsupported real-time post type");
      }
    }
