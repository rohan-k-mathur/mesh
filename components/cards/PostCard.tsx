"use client";

import Image from "next/image";
import Link from "next/link";
import LikeButton from "../buttons/LikeButton";
import ShareButton from "../buttons/ShareButton";
import ExpandButton from "../buttons/ExpandButton";
import TimerButton from "../buttons/TimerButton";
import ReplicateButton from "../buttons/ReplicateButton";
import { canRepost } from "@/lib/repostPolicy";
import ReplicatedPostCard from "./ReplicatedPostCard";
import ProductReviewCard from "./ProductReviewCard";
import PortfolioCard from "./PortfolioCard";
import DeleteCardButton from "../buttons/DeleteCardButton";
import ImageCard from "./ImageCard";
import GalleryCarousel from "./GalleryCarousel";
import SoundCloudPlayer from "../players/SoundCloudPlayer";
import Spline from "@splinetool/react-spline";
import dynamic from "next/dynamic";
import PredictionMarketCard from "./PredictionMarketCard";
import { PortfolioPayload } from "@/lib/actions/realtimepost.actions";
//import EmbeddedCanvas from "./EmbeddedCanvas";
import type { Like, RealtimeLike } from "@prisma/client";
import React from "react";
import localFont from "next/font/local";

import type { Node, Edge } from "@xyflow/react"; // if you have these types
const EmbeddedCanvas = dynamic(() => import("./EmbeddedCanvas"), {
  ssr: false,
});

interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  viewport?: { x: number; y: number; zoom: number };
  roomId?: string;
}

const founders = localFont({ src: "./NewEdgeTest-RegularRounded.otf" });
const DrawCanvas = dynamic(() => import("./DrawCanvas"), { ssr: false });
const LivechatCard = dynamic(() => import("./LivechatCard"), { ssr: false });
const EntropyCard = dynamic(() => import("./EntropyCard"), { ssr: false });

interface Props {
  id: bigint;
  currentUserId?: bigint | null;
  currentUserLike?: Like | RealtimeLike | null;
  image_url?: string;
  video_url?: string;
  portfolio?: PortfolioPayload;
  content?: string;
  roomPostContent?: CanvasState | null;
  type: string;

  caption?: string | null;

  author: {
    name: string | null;
    image: string | null;
    id: bigint;
  };
  createdAt: string;
  isRealtimePost?: boolean;
  isFeedPost?: boolean;
  likeCount?: number;
  commentCount?: number;
  expirationDate?: string | null;
  embedPost?: React.ReactNode;
  pluginType?: string | null;
  pluginData?: Record<string, any> | null;
  claimIds?: (string | number | bigint)[];
  predictionMarket?: any | null;
}

const PostCard = ({
  id,
  currentUserId,
  currentUserLike = null,
  content,
  roomPostContent = null,
  author,
  image_url,
  video_url,
  portfolio,
  caption,
  type,
  createdAt,
  isRealtimePost = false,
  isFeedPost = false,
  likeCount = 0,
  commentCount = 0,
  expirationDate = null,
  embedPost,
  pluginType = null,
  pluginData = null,
  claimIds,
  predictionMarket = null,
}: Props) => {
  if (content && content.startsWith("REPLICATE:")) {
    const dataStr = content.slice("REPLICATE:".length);
    // let originalId: bigint | null = null;
    // let replicateText = "Replicated";
       let originalId: bigint | null = null;
   let replicateText = "Replicated";
   let source: "feed" | "realtime" = "realtime";
    try {
      const parsed = JSON.parse(dataStr);
      originalId = BigInt(parsed.id);
      replicateText = parsed.text || replicateText;
      source         = parsed.source || "realtime"
    } catch (e) {
      try {
        originalId = BigInt(dataStr);
      } catch {
        originalId = null;
      }
    }

    if (!originalId) return null;

    return (
      <ReplicatedPostCard
        id={id}
        originalPostId={originalId}
        source={source}
        isRealtimePost={isRealtimePost}
        currentUserId={currentUserId}
        author={author}
        createdAt={createdAt}
        likeCount={likeCount}
        expirationDate={expirationDate ?? undefined}
        text={replicateText}
      />
    );
  }
  return (
    <article className="relative flex w-full flex-col postcard p-7 ">
      <div className="flex items-start justify-between ">
        <div className="flex w-full flex-1 flex-row gap-4 ">
          <div className="flex flex-col items-center  ">
            <Link
              href={`/profile/${author.id}`}
              className="relative h-[2.75rem] w-[2.75rem] left-[.65rem] top-[.1rem]  "
            >
              <Image
                src={author.image || "/assets/user-helsinki.svg"}
                alt="Profile Image"
                fill
                style={{ objectFit: "cover" }}
                className="cursor-pointer rounded-full border-[.05rem] border-indigo-300 profile-shadow hover:shadow-none 

                "
              />
            </Link>
          </div>
          <div className=""></div>
          <div>
            <Link href={`/profile/${author.id}`} className="w-fit ">
              <div className={`${founders.className} `}>
                <p className="cursor-pointer  text-[1.08rem] tracking-[.05rem] font-semibold text-black relative top-[.2rem] right-[.25rem] ">
                  {author.name}
                </p>
              </div>
            </Link>
            <div className="relative right-[.25rem] text-[.75rem] text-gray-500">
              {createdAt}
            </div>

            <hr className="mt-2 mb-3 w-full h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-55" />
            {type === "TEXT" && content && (
              <p className="mt-2 ml-1 text-left  text-[1.08rem] text-black tracking-[.05rem] max-w-[90%]">
                {content}
              </p>
            )}
            {(type === "IMAGE" || type === "IMAGE_COMPUTE") && image_url && (
              <ImageCard id={id} imageurl={image_url} caption={caption || undefined} />

              // <Image
              //   className=" flex img-feed-frame ml-[19%] mr-[19%] rounded-sm mt-[1rem] mb-[1rem] "
              //   src={image_url}
              //   alt="image not found"
              //   width={0}
              //   height={0}
              //   sizes="200vw"
              // />
            )}
            {type === "VIDEO" && video_url && (
              <div className="mt-2 mb-2 w-[70%] border-none loginbutton hover:loginbutton ">
                <iframe
                  title="video"
                  width={696}
                  height={378}
                  src={video_url}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                ></iframe>
              </div>
            )}
            {type === "MUSIC" && video_url && (
              // <div className="mt-2 mb-2 ">
              <SoundCloudPlayer src={video_url} title={content || undefined} />
              // </div>
            )}
            {type === "GALLERY" && content && (
              // <div className="ml-[7rem] w-[500px] justify-center items-center">
              <div className="grid justify-center items-center align-center w-full ">
              <GalleryCarousel urls={JSON.parse(content)} caption={caption || undefined} />
             </div>
            )}
            {type === "LIVECHAT" &&
              content &&
              (() => {
                let inviteeId = 0;
                try {
                  inviteeId = JSON.parse(content).inviteeId;
                } catch (e) {
                  inviteeId = 0;
                }
                return (
                  <div className="mt-2 mb-2 flex justify-center items-center">
                    <LivechatCard
                      id={id.toString()}
                      inviteeId={inviteeId}
                      authorId={Number(author.id)}
                    />
                  </div>
                );
              })()}
            {type === "ENTROPY" &&
              content &&
              (() => {
                let inviteeId = 0;
                try {
                  inviteeId = JSON.parse(content).inviteeId;
                } catch (e) {
                  inviteeId = 0;
                }
                return (
                  <div className="mt-2 mb-2 flex justify-center items-center">
                    <EntropyCard
                      id={id.toString()}
                      content={content}
                      inviteeId={inviteeId}
                      authorId={Number(author.id)}
                    />
                  </div>
                );
              })()}
            {type === "DRAW" && (
              <div className="mt-2 mb-2 flex justify-center items-center">
                <DrawCanvas id={id.toString()} content={content} />
              </div>
            )}
            {/* {type === "ROOM_CANVAS" && roomPostContent && (
              <div className="mt-2 mb-2 flex flex-col items-center justify-center">
                <EmbeddedCanvas canvas={roomPostContent} roomId={roomPostContent.roomId || "global"} />
              </div>
            )}
            {type === "ROOM_CANVAS" && content && (
              <p className="mt-2 text-[1.08rem] text-black tracking-[.05rem]">{content}</p>
            )} */}
            {type === "ROOM_CANVAS" && roomPostContent && (
              <div className="flex flex-col w-full mx-auto px-10 h-fit items-center justify-center ">
                <div className="h-[14rem]  justify-center w-full border-black border-[1px] rounded-xl">
                  <EmbeddedCanvas
                    canvas={roomPostContent}
                    roomId={roomPostContent.roomId ?? "global"}
                  />
                </div>
              </div>
            )}
            {type === "PORTFOLIO" &&
              content &&
              (() => {
                /* ‑‑ Parse once, bail on failure ‑‑ */
                let data: any = null;
                try {
                  data = JSON.parse(content);
                } catch {
                  /* ignore */
                }

                if (!data) return null;

                /* 🔹 New schema preferred:
         {
           "pageUrl": "/portfolio/abc123",
           "snapshot": "https://…/snapshot.png"   // optional
         }
       Fallbacks to legacy keys if pageUrl missing. */
                if (data.pageUrl) {
                  return (
                    <PortfolioCard
                      pageUrl={data.pageUrl}
                      snapshot={data.snapshot}
                    />
                  );
                }

                /* 🕜  Legacy (raw text/images) */
                return (
                  <PortfolioCard
                    pageUrl="" /* empty => shows legacy content only */
                    snapshot={undefined}
                    text={data.text}
                    images={data.images || []}
                    links={data.links || []}
                    layout={data.layout}
                    color={data.color}
                  />
                );
              })()}
            {type === "PRODUCT_REVIEW" &&
              content &&
              (() => {
                let vals: any = null;
                try {
                  vals = JSON.parse(content);
                } catch (e) {
                  vals = null;
                }
                return (
                  vals && (
                    <ProductReviewCard
                      productName={vals.productName}
                      rating={vals.rating}
                      summary={vals.summary}
                      productLink={vals.productLink}
                      claims={vals.claims || []}
                      claimIds={claimIds}
                      productimages={vals.images || []}
                    />
                  )
                );
              })()}
            {type === "PREDICTION" && predictionMarket && (
              <PredictionMarketCard
                key={id.toString()}
                post={{ id, predictionMarket }}
              />
            )}
            {type === "PLUGIN" && pluginType === "PDF_VIEWER" && pluginData && (
              <div className="mt-2 mb-2 flex img-feed-frame w-[100%] ml-[23%]  justify-center items-center">
                <object
                  data={(pluginData as any).pdfUrl}
                  type="application/pdf"
                  width="200%"
                  height="500"
                >
                  <p>
                    <a href={(pluginData as any).pdfUrl}>Download PDF</a>
                  </p>
                </object>
              </div>
            )}
            {type === "PLUGIN" &&
              pluginType === "SPLINE_VIEWER" &&
              pluginData && (
                <div className="mt-2 mb-2 flex justify-center items-center  ml-1/2 w-full">
                  <Spline
                    scene={(pluginData as any).sceneUrl}
                    className="w-[100%] h-[30vw]"
                  />
                </div>
              )}
            <div className="items-start justify-start  px-12  w-full">
              
              {embedPost && (
                <>
                            <hr className="mt-2 mb-4 w-full h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-55" />

                <div className="flex flex-2 mt-2   items-center scale-85">
                  
                  {embedPost}
                </div>
                </>
              )}
            </div>
            <hr className="mt-3 mb-3 w-full h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-55" />

            <div className="mt-4 flex flex-col gap-x-3 gap-y-4">
              <div className="flex gap-x-10 gap-y-8">
                <LikeButton
                  {...(isRealtimePost
                    ? { realtimePostId: id.toString() }
                    : isFeedPost
                    ? { feedPostId: id }
                    : { postId: id })}
                  likeCount={likeCount}
                  initialLikeState={currentUserLike}
                />
                <>
                  <ExpandButton
                    {...(isRealtimePost
                      ? { realtimePostId: id.toString() }
                      : isFeedPost
                      ? { postId: id }
                      : { postId: id })}
                    commentCount={commentCount}
                  />
                </>
                {canRepost(type) && (
                  <ReplicateButton
                    type={type}
                    {...(isRealtimePost
                      ? { realtimePostId: id.toString() }
                      : isFeedPost
                      ? { feedPostId: id }
                      : { postId: id })}
                  />
                )}
                <ShareButton postId={id} />
        
                  <TimerButton
                    {...(isRealtimePost
                      ? { realtimePostId: id.toString() }
                      : isFeedPost
                      ? { feedPostId: id }
                      : { postId: id })}
                    isOwned={currentUserId === author.id}
                    expirationDate={expirationDate ?? undefined}
                  />
         
                {currentUserId === author.id && (
                  <DeleteCardButton
                    {...(isRealtimePost
                      ? { realtimePostId: id.toString() }
                      : isFeedPost
                      ? { feedPostId: id }
                      : { postId: id })}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
