"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AppState, DEFAULT_NODE_VALUES } from "@/lib/reactflow/types";
import useStore from "@/lib/reactflow/store";
import { z } from "zod";
import {
  ImagePostValidation,
  GalleryPostValidation,
  TextPostValidation,
  YoutubePostValidation,
  PortfolioNodeValidation,
  SplineViewerPostValidation,
  ProductReviewValidation,

} from "@/lib/validations/thread";
import { usePathname, useParams } from "next/navigation";
import {
  createRealtimePost,
  CreateRealtimePostParams,
} from "@/lib/actions/realtimepost.actions";
import { convertPostToNode } from "@/lib/reactflow/reactflowutils";
import { useReactFlow } from "@xyflow/react";
import { uploadFileToSupabase } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import useMousePosition from "../hooks/MousePosition";
import pluginImporters from "@/lib/pluginImporters";
import { loadPluginsAsync } from "@/lib/pluginLoader";


// Import your modals
import TextNodeModal from "@/components/modals/TextNodeModal";
import ImageNodeModal from "@/components/modals/ImageNodeModal";
import YoutubeNodeModal from "@/components/modals/YoutubeNodeModal";
import CollageCreationModal from "@/components/modals/CollageCreationModal";
import PortalNodeModal from "@/components/modals/PortalNodeModal";
import GalleryNodeModal from "@/components/modals/GalleryNodeModal";
import LivechatNodeModal from "@/components/modals/LivechatNodeModal";
import PortfolioNodeModal from "@/components/modals/PortfolioNodeModal";
import SplineViewerNodeModal from "@/components/modals/SplineViewerNodeModal";
import ProductReviewNodeModal from "@/components/modals/ProductReviewNodeModal";

import { fetchUserByUsername } from "@/lib/actions/user.actions";


export default function NodeSidebar({
  reactFlowRef,
}: {
  reactFlowRef: React.RefObject<HTMLDivElement>;
}) {
  const pathname = usePathname();
  const user = useAuth().user;
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);

  const store = useStore(
    useShallow((state: AppState) => ({
      addNode: state.addNode,
      closeModal: state.closeModal,
      openModal: state.openModal,
      pluginDescriptors: state.pluginDescriptors,
    }))
  );
  const { pluginDescriptors } = store;

  useEffect(() => {
    if (pluginDescriptors.length === 0) {
      loadPluginsAsync(pluginImporters).then((descriptors) => {
        useStore.getState().registerPlugins(descriptors);
      });
    }
  }, [pluginDescriptors.length]);
  const params = useParams<{ id: string }>();
  const roomId = params.id;

  const { screenToFlowPosition } = useReactFlow();

  // If ref is not ready, return null
  if (!reactFlowRef?.current) return null;

  const centerPosition = screenToFlowPosition({
    x: reactFlowRef.current.getBoundingClientRect().width / 2,
    y: reactFlowRef.current.getBoundingClientRect().height / 2,
  });

  // If user is not logged in or onboarded, redirect
  const verifyAndRedirectUserIfNotLoggedIn = () => {
    if (!user) {
      router.push("/register");
    }
    if (!user!.onboarded) {
      router.push("/onboarding");
    }
  };

  // Create post, add node
  async function createPostAndAddToCanvas(params: CreateRealtimePostParams) {
    verifyAndRedirectUserIfNotLoggedIn();
    const realtimePost = await createRealtimePost(params);
    store.addNode(convertPostToNode(realtimePost, realtimePost.author));
    store.closeModal();
    setIsOpen(false);
  }

  const builtinNodeTypes: { label: string; nodeType: string }[] = [
    { label: "TEXT", nodeType: "TEXT" },
    { label: "IMAGE", nodeType: "IMAGE" },
    { label: "VIDEO", nodeType: "VIDEO" },
    { label: "LIVESTREAM", nodeType: "LIVESTREAM" },
    { label: "IMAGE_COMPUTE", nodeType: "IMAGE_COMPUTE" },
    { label: "COLLAGE", nodeType: "COLLAGE" },
    { label: "GALLERY", nodeType: "GALLERY" },
    { label: "PORTAL", nodeType: "PORTAL" },
    { label: "DRAW", nodeType: "DRAW" },
    { label: "LIVECHAT", nodeType: "LIVECHAT" },
    { label: "AUDIO", nodeType: "AUDIO" },
    { label: "LLM", nodeType: "LLM_INSTRUCTION" },
    { label: "PORTFOLIO", nodeType: "PORTFOLIO" },
    { label: "PRODUCT_REVIEW", nodeType: "PRODUCT_REVIEW" },

  ];

  const nodeTypes = [
    ...builtinNodeTypes,
    ...pluginDescriptors.map((p) => ({
      label: (p.config as any).label ?? p.type,
      nodeType: p.type,
    })),
  ];

  // Handler for each node type
  const openNodeCreationMenu = (nodeType: string) => {
    verifyAndRedirectUserIfNotLoggedIn();

    switch (nodeType) {
      case "TEXT":
        store.openModal(
          <TextNodeModal
            isOwned={true}
            currentText=""
            onSubmit={(values: z.infer<typeof TextPostValidation>) => {
              createPostAndAddToCanvas({
                text: values.postContent,
                path: pathname,
                coordinates: centerPosition,
                type: "TEXT",
                realtimeRoomId: roomId,
              });
            }}
          />
        );
        break;

      case "IMAGE":
        store.openModal(
          <ImageNodeModal
            isOwned={true}
            currentImageURL=""
            onSubmit={(values: z.infer<typeof ImagePostValidation>) => {
              uploadFileToSupabase(values.image).then((result) => {
                if (result.error) return;
                createPostAndAddToCanvas({
                  imageUrl: result.fileURL,
                  path: pathname,
                  coordinates: centerPosition,
                  type: "IMAGE",
                  realtimeRoomId: roomId,
                });
              });
            }}
          />
        );
        break;

      case "VIDEO":
        store.openModal(
          <YoutubeNodeModal
            isOwned={true}
            currentVideoURL=""
            onSubmit={(values: z.infer<typeof YoutubePostValidation>) => {
              createPostAndAddToCanvas({
                videoUrl: values.videoURL,
                path: pathname,
                coordinates: centerPosition,
                type: "VIDEO",
                realtimeRoomId: roomId,
              });
            }}
          />
        );
        break;

      case "LIVESTREAM":
        createPostAndAddToCanvas({
          path: pathname,
          coordinates: centerPosition,
          type: "LIVESTREAM",
          realtimeRoomId: roomId,
        });
        break;

      case "IMAGE_COMPUTE":
        createPostAndAddToCanvas({
          path: pathname,
          imageUrl: DEFAULT_NODE_VALUES["IMAGE_COMPUTE"],
          coordinates: centerPosition,
          type: "IMAGE_COMPUTE",
          realtimeRoomId: roomId,
        });
        break;

      case "COLLAGE":
        // We OPEN the modal as a JSX element:
        store.openModal(
          <CollageCreationModal
            isOwned={true}
            onSubmit={(vals) => {
              // user’s config for layout style, columns, gap
              createPostAndAddToCanvas({
                path: pathname,
                coordinates: centerPosition,
                type: "COLLAGE",
                realtimeRoomId: roomId,
                collageLayoutStyle: vals.layoutStyle,
                collageColumns: vals.columns,
                collageGap: vals.gap,
              });
            }}
          />
        );
        break;

      case "GALLERY":
        store.openModal(
          <GalleryNodeModal
            isOwned={true}
            isPublic={false}
            currentImages={[]}
            onSubmit={async (vals) => {
              const uploads = await Promise.all(
                vals.images.map((img) => uploadFileToSupabase(img))
              );
              const urls = uploads
                .filter((r) => !r.error)
                .map((r) => r.fileURL);
              if (urls.length > 0) {
                createPostAndAddToCanvas({
                  path: pathname,
                  coordinates: centerPosition,
                  type: "GALLERY",
                  realtimeRoomId: roomId,
                  isPublic: vals.isPublic,
                  imageUrl: urls[0],
                  text: JSON.stringify(urls),
                });
              }
            }}
          />
        );
        break;

      case "PORTAL":
        store.openModal(
          <PortalNodeModal
          currentX={1}
          currentY={1}
            isOwned={true}
            onSubmit={(values) => {
              createPostAndAddToCanvas({
                text: JSON.stringify(values),
                path: pathname,
                coordinates: centerPosition,
                type: "PORTAL",
                realtimeRoomId: roomId,
              });
            }}
          />
        );
        break;

      case "DRAW":
        createPostAndAddToCanvas({
          path: pathname,
          coordinates: centerPosition,
          type: "DRAW",
          realtimeRoomId: roomId,
        });
        break;

        case "LIVECHAT":
          store.openModal(
            <LivechatNodeModal
              isOwned={true}
              currentInvitee=""
              onSubmit={async (vals) => {
                const username = vals.invitee.replace(/^@/, "");
                const user = await fetchUserByUsername(username);
                if (!user) return;
                createPostAndAddToCanvas({
                  path: pathname,
                  coordinates: centerPosition,
                  type: "LIVECHAT",
                  realtimeRoomId: roomId,
                  text: JSON.stringify({ inviteeId: Number(user.id) }),
                });
              }}
            />
          );
          break;
        case "SPLINE_VIEWER":
          store.openModal(
            <SplineViewerNodeModal
              isOwned={true}
              currentUrl=""
              onSubmit={(vals: z.infer<typeof SplineViewerPostValidation>) => {
                createPostAndAddToCanvas({
                  path: pathname,
                  coordinates: centerPosition,
                  type: "PLUGIN",
                  pluginType: "SPLINE_VIEWER",
                  pluginData: { sceneUrl: vals.sceneUrl },
                  realtimeRoomId: roomId,
                });
              }}
            />
          );
          break;
        case "PORTFOLIO":
          store.openModal(
            <PortfolioNodeModal
              isOwned={true}
              currentText=""
              currentImages={[]}
              currentLinks={[]}
              currentLayout="grid"
              currentColor="bg-white"
              onSubmit={async (vals) => {
                const uploads = await Promise.all(
                  (vals.images || []).map((img) => uploadFileToSupabase(img))
                );
                const urls = uploads
                  .filter((r) => !r.error)
                  .map((r) => r.fileURL);
                const payload = {
                  text: vals.text,
                  images: urls,
                  links: vals.links || [],
                  layout: vals.layout,
                  color: vals.color,
                };
                createPostAndAddToCanvas({
                  text: JSON.stringify(payload),
                  imageUrl: urls[0],
                  videoUrl: (vals.links && vals.links[0]) || undefined,
                  path: pathname,
                  coordinates: centerPosition,
                  type: "PORTFOLIO",
                  realtimeRoomId: roomId,
                });
              }}
            />
          );
          break;

        case "PRODUCT_REVIEW":
          store.openModal(
            <ProductReviewNodeModal
              isOwned={true}
              currentProductName=""
              currentRating={5}
              currentSummary=""
              currentProductLink=""
              onSubmit={(vals: z.infer<typeof ProductReviewValidation>) => {
                createPostAndAddToCanvas({
                  text: JSON.stringify(vals),
                  path: pathname,
                  coordinates: centerPosition,
                  type: "PRODUCT_REVIEW",
                  realtimeRoomId: roomId,
                });
              }}
            />
          );
          break;

      case "AUDIO":
        createPostAndAddToCanvas({
          path: pathname,
          coordinates: centerPosition,
          type: "AUDIO",
          realtimeRoomId: roomId,
        });
        break;

      case "LLM_INSTRUCTION":
        createPostAndAddToCanvas({
          path: pathname,
          coordinates: centerPosition,
          type: "LLM_INSTRUCTION",
          realtimeRoomId: roomId,
        });
        break;
      default:
        if (pluginDescriptors.find((p) => p.type === nodeType)) {
          createPostAndAddToCanvas({
            path: pathname,
            coordinates: centerPosition,
            type: "PLUGIN",
            pluginType: nodeType,
            realtimeRoomId: roomId,
          });
        }
        break;  
  
        
    
      

 
    
  }};

  return (
    <>
      <div className="fixed top-4 right-4 z-50 overscroll-auto">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button  size="icon" className="rounded-full bg-white shadow-none  hover:bg-slate-200">
              <Plus className=" h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>

          <SheetContent
            side="right"
            className="w-[200px] sm:w-[250px]  border-l border-primary/20  overscroll-y-auto"
          >
            <SheetTitle className="text-[2rem] mt-4">Add Node</SheetTitle>
            <nav className="flex flex-col space-y-4 mt-4  overscroll-y-auto" >
              {nodeTypes.map((item) => (
                <div
                  key={item.nodeType}
                  className="dndnode h-[.3rem] hover:cursor-pointer"
                  onClick={() => openNodeCreationMenu(item.nodeType)}
                >
                  {item.label}
                </div>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Gray overlay when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
