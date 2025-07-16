"use client";

import Image from "next/image";
import Link from "next/link";
import LikeButton from "../buttons/LikeButton";
import ShareButton from "../buttons/ShareButton";
import ExpandButton from "../buttons/ExpandButton";
import TimerButton from "../buttons/TimerButton";
import ReplicateButton from "../buttons/ReplicateButton";
import ReplicatedPostCard from "./ReplicatedPostCard";
import ProductReviewCard from "./ProductReviewCard";
import PortfolioCard from "./PortfolioCard";
import DeleteCardButton from "../buttons/DeleteCardButton";
import ImageCard from "./ImageCard";
import GalleryCarousel from "./GalleryCarousel";
import SoundCloudPlayer from "../players/SoundCloudPlayer";
import Spline from "@splinetool/react-spline";
import dynamic from "next/dynamic";
import type { Like, RealtimeLike } from "@prisma/client";
import React from "react";
import localFont from 'next/font/local'
const founders = localFont({ src: './NewEdgeTest-RegularRounded.otf' })
const DrawCanvas = dynamic(() => import("./DrawCanvas"), { ssr: false })
const LivechatCard = dynamic(() => import("./LivechatCard"), { ssr: false })
const EntropyCard = dynamic(() => import("./EntropyCard"), { ssr: false })

interface Props {
  id: bigint;
  currentUserId?: bigint | null;
  currentUserLike?: Like | RealtimeLike | null;
  image_url?: string;
  video_url?: string;

  content?: string;
  type: string;

  author: {
    name: string | null;
    image: string | null;
    id: bigint;
  };
  createdAt: string;
  isRealtimePost?: boolean;
  likeCount?: number;
  commentCount?: number;
  expirationDate?: string | null;
  embedPost?: React.ReactNode;
  pluginType?: string | null;
  pluginData?: Record<string, any> | null;
  claimIds?: (string | number | bigint)[];
}

const PostCard = ({
  id,
  currentUserId,
  currentUserLike = null,
  content,
  author,
  image_url,
  video_url,
  type,
  createdAt,
  isRealtimePost = false,
  likeCount = 0,
  commentCount = 0,
  expirationDate = null,
  embedPost,
  pluginType = null,
  pluginData = null,
  claimIds,
  }: Props) => {
  if (content && content.startsWith("REPLICATE:")) {
    const originalId = BigInt(content.split(":" )[1]);
    return (
      <ReplicatedPostCard
        id={id}
        originalPostId={originalId}
        isRealtimePost={isRealtimePost}
        currentUserId={currentUserId}
        author={author}
        createdAt={createdAt}
        likeCount={likeCount}
        expirationDate={expirationDate ?? undefined}
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
              className="relative h-[2.75rem] w-[2.75rem] left-[.65rem] top-[.1rem] "
            >
              <Image
                src={author.image || "/assets/user-helsinki.svg"}
                alt="Profile Image"
                fill
                style={{ objectFit: 'cover' }}
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
            <div className="relative right-[.25rem] text-[.75rem] text-gray-500">{createdAt}</div>


            <hr className="mt-3 mb-4 w-full h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-75" />
            {type === "TEXT" && content && (
              <p className="mt-2  text-[1.08rem] text-black tracking-[.05rem]">{content}</p>
            )}
            {(type === "IMAGE" || type === "IMAGE_COMPUTE") && image_url && (
              <ImageCard id = {id} imageurl={image_url} ></ImageCard>

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
                <GalleryCarousel urls={JSON.parse(content)} />
              // </div>
            )}
            {type === "LIVECHAT" && content && (
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
              })()
            )}
            {type === "ENTROPY" && content && (
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
              })()
            )}
            {type === "DRAW" && (
              <div className="mt-2 mb-2 flex justify-center items-center">
                <DrawCanvas id={id.toString()} content={content} />
              </div>
            )}
            {type === "PORTFOLIO" && content && (
              (() => {
                let vals: any = null;
                try {
                  vals = JSON.parse(content);
                } catch (e) {
                  vals = null;
                }
                return (
                  vals && (
                    <PortfolioCard
                      text={vals.text}
                      images={vals.images || []}
                      links={vals.links || []}
                      layout={vals.layout}
                      color={vals.color}
                    />
                  )
                );
              })()
            )}
            {type === "PRODUCT_REVIEW" && content && (
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
              })()
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
            {type === "PLUGIN" && pluginType === "SPLINE_VIEWER" && pluginData && (
              <div className="mt-2 mb-2 flex justify-center items-center  ml-1/2 w-full">
                <Spline scene={(pluginData as any).sceneUrl} className="w-[100%] h-[30vw]" />
              </div>
            )}
            <div className="items-start justify-start mx-[0%] px-8 w-full">
            {embedPost && <div className="flex flex-2 mt-4  items-center scale-85">{embedPost}</div>}
            </div>
            <hr className="mt-4 mb-3 w-full h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-75" />

            <div className="mt-4 flex flex-col gap-x-3 gap-y-4">
              <div className="flex gap-x-12 gap-y-8">
                <LikeButton
                  {...(isRealtimePost
                    ? { realtimePostId: id.toString() }
                    : { postId: id })}
                  likeCount={likeCount}
                  initialLikeState={currentUserLike}
                />
                  <>
                    <ExpandButton
                      {...(isRealtimePost
                        ? { realtimePostId: id.toString() }
                        : { postId: id })}
                      commentCount={commentCount}
                    />
                  </>
           <ReplicateButton {...(isRealtimePost
                        ? { realtimePostId: id.toString() }
                        : { postId: id })}/>
          <ShareButton postId={id} />
          <TimerButton
            postId={id}
            isOwned={currentUserId === author.id}
            expirationDate={expirationDate ?? undefined}
          />
          {currentUserId === author.id && (
            <DeleteCardButton
              {...(isRealtimePost
                ? { realtimePostId: id.toString() }
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