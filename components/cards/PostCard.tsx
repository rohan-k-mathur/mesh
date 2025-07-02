
import Image from "next/image";
import Link from "next/link";
import LikeButton from "../buttons/LikeButton";
import ShareButton from "../buttons/ShareButton";
import ExpandButton from "../buttons/ExpandButton";
import TimerButton from "../buttons/TimerButton";
import ReplicateButton from "../buttons/ReplicateButton";
import ReplicatedPostCard from "./ReplicatedPostCard";

import DeleteCardButton from "../buttons/DeleteCardButton";
import GalleryCarousel from "./GalleryCarousel";
import dynamic from "next/dynamic";
import {
  fetchLikeForCurrentUser,
  fetchRealtimeLikeForCurrentUser,
} from "@/lib/actions/like.actions";
import { Like, RealtimeLike } from "@prisma/client";
import React from "react";
import localFont from 'next/font/local'
const founders = localFont({ src: './NewEdgeTest-RegularRounded.otf' })
const DrawCanvas = dynamic(() => import("./DrawCanvas"), { ssr: false })
const LivechatCard = dynamic(() => import("./LivechatCard"), { ssr: false })

interface Props {
  id: bigint;
  currentUserId?: bigint | null;
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
}

const PostCard = async ({
  id,
  currentUserId,
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
  }: Props) => {
  let currentUserLike: Like | RealtimeLike | null = null;
  if (currentUserId) {
    currentUserLike = isRealtimePost
      ? await fetchRealtimeLikeForCurrentUser({
          realtimePostId: id,
          userId: currentUserId,
        })
      : await fetchLikeForCurrentUser({ postId: id, userId: currentUserId });
  }
  if (content && content.startsWith("REPLICATE:")) {
    const originalId = BigInt(content.split(":" )[1]);
    return (
      <ReplicatedPostCard
        id={id}
        originalPostId={originalId}
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
              className="relative h-[2rem] w-[2rem] left-[.5rem]"
            >
              <Image
                src={author.image || "/assets/user-helsinki.svg"}
                alt="Profile Image"
                fill
                objectFit="cover"
                className="cursor-pointer rounded-full border-[.05rem] border-indigo-300 profile-shadow hover:shadow-none 

                "
              />
            </Link>
          </div>
          <div className=""></div>
          <div>
            <Link href={`/profile/${author.id}`} className="w-fit ">
              <div className={`${founders.className} `}>
                <p className="cursor-pointer  text-[1.08rem] tracking-[.05rem] font-semibold text-black relative right-[.25rem] top-[.3rem]">
                  {author.name}
                </p>
              </div>
            </Link>
            <p className="text-xs text-gray-500 mt-1">Posted at {createdAt}</p>
            <hr className="mt-3 mb-4 w-full h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-75" />
            {type === "TEXT" && content && (
              <p className="mt-2  text-[1.08rem] text-black tracking-[.05rem]">{content}</p>
            )}
            {(type === "IMAGE" || type === "IMAGE_COMPUTE") && image_url && (

              <Image
                className=" flex img-feed-frame  rounded-sm mt-[.8rem] mb-[2rem]  ml-[7.5rem] mr-[8rem] items-center"
                src={image_url}
                alt="image not found"
                width={0}
                height={0}
                sizes="200vw"
              />
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
            {type === "GALLERY" && content && (
              <div className="ml-[7rem] w-[500px] justify-center items-center">
                <GalleryCarousel urls={JSON.parse(content)} />
              </div>
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
            {type === "DRAW" && (
              <div className="mt-2 mb-2 flex justify-center items-center">
                <DrawCanvas id={id.toString()} content={content} />
              </div>
            )}
            {embedPost && <div className="mt-4 scale-90">{embedPost}</div>}
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
          <DeleteCardButton
            {...(isRealtimePost
              ? { realtimePostId: id.toString() }
              : { postId: id })}
          />

              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostCard;