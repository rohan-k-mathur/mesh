"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AppNodeType, AppState, DEFAULT_NODE_VALUES } from "@/lib/reactflow/types";
import useStore from "@/lib/reactflow/store";
import { z } from "zod";
import {
  ImagePostValidation,
  TextPostValidation,
  YoutubePostValidation,
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

// A simple static array of node types
const nodeTypes: { label: string; nodeType: AppNodeType }[] = [
  { label: "TEXT", nodeType: "TEXT" },
  { label: "IMAGE", nodeType: "IMAGE" },
  { label: "VIDEO", nodeType: "VIDEO" },
  { label: "LIVESTREAM", nodeType: "LIVESTREAM" },
  { label: "IMAGE_COMPUTE", nodeType: "IMAGE_COMPUTE" },
  { label: "COLLAGE", nodeType: "COLLAGE" },
];

// Import your modals
import TextNodeModal from "@/components/modals/TextNodeModal";
import ImageNodeModal from "@/components/modals/ImageNodeModal";
import YoutubeNodeModal from "@/components/modals/YoutubeNodeModal";
import CollageCreationModal from "@/components/modals/CollageCreationModal";

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
    }))
  );
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

  // Handler for each node type
  const openNodeCreationMenu = (nodeType: AppNodeType) => {
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

      default:
        break;
    }
  };

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full">
              <Plus className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>

          <SheetContent
            side="right"
            className="w-[200px] sm:w-[250px] border-l border-primary/20"
          >
            <SheetTitle>Node Menu</SheetTitle>
            <nav className="flex flex-col space-y-4 mt-8">
              {nodeTypes.map((item) => (
                <div
                  key={item.nodeType}
                  className="dndnode hover:cursor-pointer"
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
