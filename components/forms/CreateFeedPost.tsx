"use client";

import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import TextNodeModal from "@/components/modals/TextNodeModal";
import ImageNodeModal from "@/components/modals/ImageNodeModal";
import YoutubeNodeModal from "@/components/modals/YoutubeNodeModal";
import CollageCreationModal from "@/components/modals/CollageCreationModal";
import GalleryNodeModal from "@/components/modals/GalleryNodeModal";
import PortalNodeModal from "@/components/modals/PortalNodeModal";
import LivechatNodeModal from "@/components/modals/LivechatNodeModal";
import PdfViewerNodeModal from "@/components/modals/PdfViewerNodeModal";
import ProductReviewNodeModal from "../modals/ProductReviewNodeModal";
import SplineViewerNodeModal from "../modals/SplineViewerNodeModal";
import { uploadFileToSupabase } from "@/lib/utils";
import { createRealtimePost } from "@/lib/actions/realtimepost.actions";
import { fetchUserByUsername } from "@/lib/actions/user.actions";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  TextPostValidation,
  ImagePostValidation,
  YoutubePostValidation,
  GalleryPostValidation,
  PortalNodeValidation,
  PdfViewerPostValidation,
  SplineViewerPostValidation,
  ProductReviewValidation
} from "@/lib/validations/thread";
import { AppNodeType, DEFAULT_NODE_VALUES } from "@/lib/reactflow/types";

const nodeOptions: { label: string; nodeType: string }[] = [
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
  { label: "PDF", nodeType: "PDF_VIEWER" },
  { label: "SPLINE", nodeType: "SPLINE_VIEWER" },
  { label: "PRODUCT_REVIEW", nodeType: "PRODUCT_REVIEW" },

];

const CreateFeedPost = () => {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("");
  const router = useRouter();

  function reset() {
    setOpen(false);
    setSelectedType("");
  }

  async function handleTextSubmit(values: z.infer<typeof TextPostValidation>) {
    await createRealtimePost({
      text: values.postContent,
      path: "/",
      coordinates: { x: 0, y: 0 },
      type: "TEXT",
      realtimeRoomId: "global",
    });
    reset();
    router.refresh();
  }

  async function handleImageSubmit(values: z.infer<typeof ImagePostValidation>) {
    const result = await uploadFileToSupabase(values.image);
    if (!result.error) {
      await createRealtimePost({
        imageUrl: result.fileURL,
        path: "/",
        coordinates: { x: 0, y: 0 },
        type: "IMAGE",
        realtimeRoomId: "global",
      });
      reset();
      router.refresh();
    }
  }

  async function handleVideoSubmit(values: z.infer<typeof YoutubePostValidation>) {
    await createRealtimePost({
      videoUrl: values.videoURL,
      path: "/",
      coordinates: { x: 0, y: 0 },
      type: "VIDEO",
      realtimeRoomId: "global",
    });
    reset();
    router.refresh();
  }

  async function handleGallerySubmit(values: z.infer<typeof GalleryPostValidation>) {
    const uploads = await Promise.all(
      values.images.map((img) => uploadFileToSupabase(img))
    );
    const urls = uploads.filter((r) => !r.error).map((r) => r.fileURL);
    if (urls.length > 0) {
      await createRealtimePost({
        path: "/",
        coordinates: { x: 0, y: 0 },
        type: "GALLERY",
        realtimeRoomId: "global",
        isPublic: values.isPublic,
        imageUrl: urls[0],
        text: JSON.stringify(urls),
      });
      reset();
      router.refresh();
    }
  }

  async function handlePortalSubmit(values: z.infer<typeof PortalNodeValidation>) {
    await createRealtimePost({
      text: JSON.stringify(values),
      path: "/",
      coordinates: { x: 0, y: 0 },
      type: "PORTAL",
      realtimeRoomId: "global",
    });
    reset();
    router.refresh();
  }

  const handleSelect = async (value: string) => {
    if (value === "LIVESTREAM" || value === "DRAW") {
      await createRealtimePost({
        path: "/",
        coordinates: { x: 0, y: 0 },
        type: value as AppNodeType,
        realtimeRoomId: "global",
      });
      reset();
      router.refresh();
      return;
    }

    if (value === "IMAGE_COMPUTE") {
      await createRealtimePost({
        path: "/",
        coordinates: { x: 0, y: 0 },
        type: "IMAGE_COMPUTE",
        realtimeRoomId: "global",
        imageUrl: DEFAULT_NODE_VALUES["IMAGE_COMPUTE"],
      });
      reset();
      router.refresh();
      return;
    }

    setSelectedType(value);
  };

  const renderModal = () => {
    switch (selectedType) {
      case "TEXT":
        return <TextNodeModal isOwned={true} currentText="" onSubmit={handleTextSubmit} />;
      case "IMAGE":
        return <ImageNodeModal isOwned={true} currentImageURL="" onSubmit={handleImageSubmit} />;
      case "VIDEO":
        return <YoutubeNodeModal isOwned={true} currentVideoURL="" onSubmit={handleVideoSubmit} />;
      case "COLLAGE":
        return (
          <CollageCreationModal
            isOwned={true}
            onSubmit={async (vals) => {
              await createRealtimePost({
                path: "/",
                coordinates: { x: 0, y: 0 },
                type: "COLLAGE",
                realtimeRoomId: "global",
                collageLayoutStyle: vals.layoutStyle,
                collageColumns: vals.columns,
                collageGap: vals.gap,
              });
              reset();
              router.refresh();
            }}
          />
        );
      case "GALLERY":
        return (
          <GalleryNodeModal
            isOwned={true}
            isPublic={false}
            currentImages={[]}
            onSubmit={handleGallerySubmit}
          />
        );
      case "PORTAL":
        return <PortalNodeModal isOwned={true} onSubmit={handlePortalSubmit} currentX={0} currentY={0} />;
      case "LIVECHAT":
        return (
          <LivechatNodeModal
            isOwned={true}
            currentInvitee=""
            onSubmit={async (vals) => {
              const username = vals.invitee.replace(/^@/, "");
              const user = await fetchUserByUsername(username);
              if (!user) return;
              await createRealtimePost({
                path: "/",
                coordinates: { x: 0, y: 0 },
                type: "LIVECHAT",
                realtimeRoomId: "global",
                text: JSON.stringify({ inviteeId: Number(user.id) }),
              });
              reset();
              router.refresh();
            }}
          />
        );
      case "PDF_VIEWER":
        return (
          <PdfViewerNodeModal
            isOwned={true}
            currentUrl=""
            onSubmit={async (vals) => {
              await createRealtimePost({
                path: "/",
                coordinates: { x: 0, y: 0 },
                type: "PLUGIN",
                realtimeRoomId: "global",
                pluginType: "PDF_VIEWER",
                pluginData: { pdfUrl: vals.pdfUrl },
              });
              reset();
              router.refresh();
            }}
          />
        );
      case "SPLINE_VIEWER":
        return (
          <SplineViewerNodeModal
            isOwned={true}
            currentUrl=""
            onSubmit={async (vals) => {
              await createRealtimePost({
                path: "/",
                coordinates: { x: 0, y: 0 },
                type: "PLUGIN",
                realtimeRoomId: "global",
                pluginType: "SPLINE_VIEWER",
                pluginData: { sceneUrl: vals.sceneUrl },
              });
              reset();
              router.refresh();
            }}
          />
        );
      case "PRODUCT_REVIEW":
        return (
          <ProductReviewNodeModal
            isOwned={true}
            currentProductName=""
            currentRating={5}
            currentSummary=""
            currentProductLink=""
            currentClaims={[]}
            onSubmit={async (vals) => {
              await createRealtimePost({
                text: JSON.stringify(vals),
                path: "/",
                coordinates: { x: 0, y: 0 },
                type: "PRODUCT_REVIEW",
                realtimeRoomId: "global",
              });
              reset();
              router.refresh();
            }}
          />
        );
                  
              // onSubmit={async (vals) => {
              //   await createRealtimePost({
              //     path: "/",
              //     coordinates: { x: 0, y: 0 },
              //     type: "PLUGIN",
              //     realtimeRoomId: "global",
              //     pluginType: "PRODUCT_REVIEW",
              //     pluginData: {},
              //   });
              //   reset();
              //   router.refresh();
              // }}
       
      default:
        return (
          <DialogContent className="p-8 bg-slate-200 border-[2px] border-blue max-w-[34rem] max-h-[20rem]">
            <Select onValueChange={(v) => handleSelect(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select post type" className="px-4" />
              </SelectTrigger> 
              <SelectContent  className="max-h-[14rem]">
                {nodeOptions.map((item) => (
                  <SelectItem key={item.nodeType} value={item.nodeType} className="hover:bg-slate-200">
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DialogContent>
        );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSelectedType("");
      }}
    >
      <DialogTrigger className="likebutton items-start justify-start leftsidebar-link  leftsidebar-item" asChild>
        <Button           variant={"outline"}
 className="items-start justify-start  h-full w-full rounded-md border-[1px] border-rose-300 border-opacity-80 hover:outline-2 hover:outline-double hover:outline-emerald-400">
          <Image
            src="/assets/create-new.svg"
            alt="create post"
            width={24}
            height={24}
          />
          <p className="text-black ml-3  max-lg:hidden">{"New Post"}</p>

        </Button>

      </DialogTrigger>
      {renderModal()}
    </Dialog>
  );
};

export default CreateFeedPost;
