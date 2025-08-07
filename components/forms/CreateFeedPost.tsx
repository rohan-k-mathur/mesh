"use client";

import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { AnimatedDialog } from "../ui/AnimatedDialog";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { createFeedPost as createFeedPostAction } from "@/lib/actions/feed.actions";
import { feed_post_type } from "@prisma/client";
import TextNodeModal from "@/components/modals/TextNodeModal";
import ImageNodeModal from "@/components/modals/ImageNodeModal";
import YoutubeNodeModal from "@/components/modals/YoutubeNodeModal";
import CollageCreationModal from "@/components/modals/CollageCreationModal";
import GalleryNodeModal from "@/components/modals/GalleryNodeModal";
import PortalNodeModal from "@/components/modals/PortalNodeModal";
import PortfolioNodeForm from "./PortfolioNodeForm";
import PortfolioNodeModal from "../modals/PortfolioNodeModal";
import PortfolioSiteBuilderModal from "../modals/PortfolioSiteBuilderModal";
import LivechatNodeModal from "@/components/modals/LivechatNodeModal";
import EntropyNodeModal from "@/components/modals/EntropyNodeModal";
import PdfViewerNodeModal from "@/components/modals/PdfViewerNodeModal";
import ProductReviewNodeModal from "../modals/ProductReviewNodeModal";
import MusicNodeModal from "../modals/MusicNodeModal";
import SplineViewerNodeModal from "../modals/SplineViewerNodeModal";
import RoomCanvasModal from "../modals/RoomCanvasModal";
import PredictionMarketModal from "../modals/PredictionMarketModal";
import { exportRoomCanvas } from "@/lib/actions/realtimeroom.actions";
import {
  uploadFileToSupabase,
  uploadAudioToSupabase,
  serializeBigInt,
} from "@/lib/utils";
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
  PortfolioNodeValidation,
  SplineViewerPostValidation,
  ProductReviewValidation,
} from "@/lib/validations/thread";
import { AppNodeType, DEFAULT_NODE_VALUES } from "@/lib/reactflow/types";
import { useCreateFeedPost } from "@/lib/hooks/useCreateFeedPost";  // client
import { useSession }        from "@/lib/hooks/useSession";

const nodeOptions: { label: string; nodeType: string }[] = [
  { label: "TEXT", nodeType: "TEXT" },
  { label: "IMAGE", nodeType: "IMAGE" },
  { label: "VIDEO", nodeType: "VIDEO" },
  { label: "MUSIC", nodeType: "MUSIC" },
  { label: "LIVESTREAM", nodeType: "LIVESTREAM" },
  // { label: "IMAGE_COMPUTE", nodeType: "IMAGE_COMPUTE" },
  // { label: "COLLAGE", nodeType: "COLLAGE" },
  { label: "GALLERY", nodeType: "GALLERY" },
  // { label: "PORTAL", nodeType: "PORTAL" },
  { label: "DRAW", nodeType: "DRAW" },
  { label: "LIVECHAT", nodeType: "LIVECHAT" },
  { label: "PORTFOLIO", nodeType: "PORTFOLIO" },

  { label: "ENTROPY", nodeType: "ENTROPY" },
  { label: "PDF", nodeType: "PDF_VIEWER" },
  { label: "SPLINE", nodeType: "SPLINE_VIEWER" },
  { label: "PRODUCT_REVIEW", nodeType: "PRODUCT_REVIEW" },
  { label: "PREDICTION", nodeType: "PREDICTION" },
  { label: "ROOM_CANVAS", nodeType: "ROOM_CANVAS" },
];

interface Props {
  roomId?: string;
}

const CreateFeedPost = ({ roomId = "global" }: Props) => {
    const { session, loading: authLoading } = useSession();     // who is this?
  const createFeedPost = useCreateFeedPost();                 // POST helper
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("");
  const router = useRouter();

  function reset() {
    setOpen(false);
    setSelectedType("");
  }

  async function handleTextSubmit(values: z.infer<typeof TextPostValidation>) {
    if (roomId === "global") {
      await createFeedPost({
        type: "TEXT",
        content: values.postContent,
      });
    }
    if (roomId === "global") {   // ⬅ use the hook not the server action
            await createFeedPost({ type: "TEXT", content: values.postContent });     }
      else {
      await createRealtimePost({
        text: values.postContent,
        path: "/",
        coordinates: { x: 0, y: 0 },
        type: "TEXT",
        realtimeRoomId: roomId,
      });
    }
    reset();
    router.refresh();
  }

  async function handleImageSubmit(
    values: z.infer<typeof ImagePostValidation>
  ) {
    const result = await uploadFileToSupabase(values.image);
    if (!result.error) {
      if (roomId === "global") {
        await createFeedPost({
          type: "IMAGE",
          imageUrl: result.fileURL,
          caption: values.caption,
        });
      } else {
        await createRealtimePost({
          imageUrl: result.fileURL,
          text: values.caption,
          path: "/",
          coordinates: { x: 0, y: 0 },
          type: "IMAGE",
          realtimeRoomId: roomId,
        });
      }
      reset();
      router.refresh();
    }
  }

  async function handleVideoSubmit(
    values: z.infer<typeof YoutubePostValidation>
  ) {
    if (roomId === "global") {
      await createFeedPost({
        type: "VIDEO",
        videoUrl: values.videoURL,
      });
    } else {
      await createRealtimePost({
        videoUrl: values.videoURL,
        path: "/",
        coordinates: { x: 0, y: 0 },
        type: "VIDEO",
        realtimeRoomId: roomId,
      });
    }
    reset();
    router.refresh();
  }

  async function handleMusicSubmit(values: { audioFile: File; title: string }) {
    const result = await uploadAudioToSupabase(values.audioFile);
    if (result.error) return;
    if (roomId === "global") {
          // treat audio files the same way we treat images / video in the feed
          await createFeedPost({
            type: "MUSIC",                 // enum value in Prisma
           videoUrl: result.fileURL,      // ← stored in `video_url` column
           caption:  values.title.slice(0, 140) || undefined,
          });}
        // } else {
        //   await createRealtimePost({
        //     videoUrl:     result.fileURL,        // reused column
        //     text:         values.title,
        //     path:         "/",
        //     coordinates:  { x: 0, y: 0 },
        //     type:         "MUSIC",
        //   realtimeRoomId: roomId,
        //   });
        // }
    reset();
    router.refresh();
  }

  async function handleGallerySubmit(
    values: z.infer<typeof GalleryPostValidation>
  ) {
    const uploads = await Promise.all(
      values.images.map((img) => uploadFileToSupabase(img))
    );
    const urls = uploads.filter((r) => !r.error).map((r) => r.fileURL);
    if (urls.length > 0) {
      if (roomId === "global") {
        await createFeedPost({
          type: "GALLERY",
          imageUrl: urls[0],
          content: JSON.stringify(urls),
          caption: values.caption,
          isPublic: values.isPublic,
        });
      } else {
        await createRealtimePost({
          path: "/",
          coordinates: { x: 0, y: 0 },
          type: "GALLERY",
          realtimeRoomId: roomId,
          isPublic: values.isPublic,
          imageUrl: urls[0],
          text: JSON.stringify(urls),
          caption: values.caption,
        });
      }
      reset();
      router.refresh();
    }
  }

  async function handlePortfolioSubmit(
    values: z.infer<typeof PortfolioNodeValidation>
  ) {
    const uploads = await Promise.all(
      (values.images || []).map((img) => uploadFileToSupabase(img))
    );
    const urls = uploads.filter((r) => !r.error).map((r) => r.fileURL);
    const payload = {
      text: values.text,
      images: urls,
      links: values.links || [],
      layout: values.layout,
      color: values.color,
    };
    await createRealtimePost({
      text: JSON.stringify(payload),
      imageUrl: urls[0],
      videoUrl: (values.links && values.links[0]) || undefined,
      path: "/",
      coordinates: { x: 0, y: 0 },
      type: "PORTFOLIO",
      realtimeRoomId: roomId,
    });
    reset();
    router.refresh();
  }

  async function handlePortalSubmit(
    values: z.infer<typeof PortalNodeValidation>
  ) {
    await createRealtimePost({
      text: JSON.stringify(values),
      path: "/",
      coordinates: { x: 0, y: 0 },
      type: "PORTAL",
      realtimeRoomId: roomId,
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
        realtimeRoomId: roomId,
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
        realtimeRoomId: roomId,
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
        return (
          <TextNodeModal
            isOwned={true}
            currentText=""
            onSubmit={handleTextSubmit}
          />
        );
      case "IMAGE":
        return (
          <ImageNodeModal
            isOwned={true}
            currentImageURL=""
            currentCaption=""
            onSubmit={handleImageSubmit}
          />
        );
      case "VIDEO":
        return (
          <YoutubeNodeModal
            isOwned={true}
            currentVideoURL=""
            onSubmit={handleVideoSubmit}
          />
        );
      case "MUSIC":
        return (
          <MusicNodeModal
            isOwned={true}
            currentUrl=""
            currentTitle=""
            onSubmit={handleMusicSubmit}
          />
        );
      case "COLLAGE":
        return (
          <CollageCreationModal
            isOwned={true}
            onSubmit={async (vals) => {
              await createRealtimePost({
                path: "/",
                coordinates: { x: 0, y: 0 },
                type: "COLLAGE",
                realtimeRoomId: roomId,
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
            currentCaption=""
            onSubmit={handleGallerySubmit}
          />
        );
      case "PORTAL":
        return (
          <PortalNodeModal
            isOwned={true}
            onSubmit={handlePortalSubmit}
            currentX={0}
            currentY={0}
          />
        );
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
                realtimeRoomId: roomId,
                text: JSON.stringify({ inviteeId: Number(user.id) }),
              });
              reset();
              router.refresh();
            }}
          />
        );
      case "PORTFOLIO":
        return <PortfolioSiteBuilderModal />;
      case "ENTROPY":
        return (
          <EntropyNodeModal
            isOwned={true}
            currentInvitee=""
            onSubmit={async (vals) => {
              const username = vals.invitee.replace(/^@/, "");
              const user = await fetchUserByUsername(username);
              if (!user) return;
              const res = await fetch("/api/random-secret");
              const { word } = await res.json();
              await createRealtimePost({
                path: "/",
                coordinates: { x: 0, y: 0 },
                type: "ENTROPY",
                realtimeRoomId: roomId,
                text: JSON.stringify({
                  inviteeId: Number(user.id),
                  secret: word,
                  guesses: [],
                }),
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
                realtimeRoomId: roomId,
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
                realtimeRoomId: roomId,
                pluginType: "SPLINE_VIEWER",
                pluginData: { sceneUrl: vals.sceneUrl },
              });
              reset();
              router.refresh();
            }}
          />
        );
      case "ROOM_CANVAS":
        return (
          <RoomCanvasModal
            onSubmit={async (vals) => {
              const canvas = await exportRoomCanvas(vals.roomId);
              if (!canvas) return;
              const safeCanvas = serializeBigInt(canvas);
              if (JSON.stringify(safeCanvas).length > 1_000_000) {
                alert("Canvas too large to share");
                return;
              }
              await createRealtimePost({
                text: vals.description,
                path: "/",
                coordinates: { x: 0, y: 0 },
                type: "ROOM_CANVAS",
                realtimeRoomId: vals.roomId,
                roomPostContent: safeCanvas,
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
            currentImages={[]}
            onSubmit={async (vals) => {
              const uploads = await Promise.all(
                (vals.images || []).map((img) => uploadFileToSupabase(img))
              );
              const urls = uploads
                .filter((r) => !r.error)
                .map((r) => r.fileURL);
              const filtered = vals.claims.filter((c) => c.trim() !== "");
              if (roomId === "global") {
                await createFeedPostAction({
                  type: "PRODUCT_REVIEW" as feed_post_type,

                  caption: vals.summary.slice(0, 140),
                  imageUrl: urls[0] ?? null,
                  content: JSON.stringify({        // 👈 add this
                         ...vals,
                         images: urls,
                         claims: filtered,
                       }),
                  productReview: {
                    productName: vals.productName,
                    rating:      vals.rating,
                    summary:     vals.summary,
                    productLink: vals.productLink,
                    images:      urls,
                    claims:      filtered,
                  },
                });
              } else {
                await createRealtimePost({
                  text: JSON.stringify({
                    ...vals,
                    images: urls,
                    claims: filtered,
                  }),
                  path: "/",
                  coordinates: { x: 0, y: 0 },
                  type: "PRODUCT_REVIEW",
                  realtimeRoomId: roomId,
                  ...(urls.length > 0 && { imageUrl: urls[0] }),
                });
              }
              reset();
              router.refresh();
            }}
          />
        );

      case "PREDICTION":
        return (
          <PredictionMarketModal
            onSubmit={async (vals) => {
              await fetch("/api/market", {
                method: "POST",
                body: JSON.stringify({
                  question: vals.question,
                  closesAt: vals.closesAt,
                  liquidity: vals.liquidity,
                }),
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
      //     realtimeRoomId: roomId,
      //     pluginType: "PRODUCT_REVIEW",
      //     pluginData: {},
      //   });
      //   reset();
      //   router.refresh();
      // }}

      default:
        return (
          <DialogContent className="flex flex-1 p-8 bg-slate-300 border-[2px] rounded-xl border-blue max-w-[35rem]  max-h-[14rem] mt-[-6rem] ">
            <Select onValueChange={(v) => handleSelect(v)}>
              <SelectTrigger className=" ring-blue border-none ring-[2px] h-auto flex flex-1 text-[1.2rem] text-center tracking-wide focus:ring-blue focus:border-none focus:ring-[1px]">
                <SelectValue
                  placeholder="Select post type"
                  className="px-4 py-1 "
                />
              </SelectTrigger>
              <SelectContent className="max-h-[18rem] justify-center w-[95%] mx-auto border-blue border-2 rounded-xl">
                {nodeOptions.map((item) => (
                  <div key={item.nodeType}>
                    <SelectItem
                      value={item.nodeType}
                      className="px-4  hover:bg-slate-200"
                    >
                      {item.label}
                    </SelectItem>
                    <hr />
                  </div>
                ))}
              </SelectContent>
            </Select>
          </DialogContent>
        );
    }
  };
  if (authLoading) return null;        // still checking cookies

  if (!session) {
    return (
      <Button onClick={() => router.push("/login")} /* … */>
        Sign in to post
      </Button>
    );
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSelectedType("");
      }}
    >
      <DialogTrigger
      
        className="likebutton items-start justify-start leftsidebar-link  leftsidebar-item"
        asChild
      >
        <Button
          variant={"outline"}
          className="items-start justify-start  h-full w-full rounded-xl border-[1px] border-rose-300 border-opacity-80 hover:outline-[1px] hover:outline-solid hover:outline-rose-400"
        >
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
