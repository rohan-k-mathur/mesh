import Image from "next/image";
import Link from "next/link";
import LikeButton from "../buttons/LikeButton";
import ShareButton from "../buttons/ShareButton";
import ExpandButton from "../buttons/ExpandButton";
import ReplicateButton from "../buttons/ReplicateButton";
// import { fetchLikeForCurrentUser } from "@/lib/actions/like.actions";
import { Like } from "@prisma/client";
import React from "react";
import localFont from 'next/font/local'
const founders = localFont({ src: '/NewEdgeTest-RegularRounded.otf' })

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
}

const PostCard = async ({
  id,
  content,
  author,
  image_url,
  video_url,
  type,
  createdAt,
  isRealtimePost = false,
}: Props) => {
  let currentUserLike: Like | null = null;
  let likeCount = 0;
  return (
    <article className="flex w-full flex-col postcard  p-7 ">
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
              <h4 className="cursor-pointer  text-[1.25rem] tracking-[.05rem] font-semibold text-black relative right-[.3rem] top-[.1rem]">
                {author.name}
              </h4>
              </div>
            </Link>
            <hr className="mt-3 mb-4 w-[48rem] h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-75" />
            {type === "TEXT" && content && (
              <p className="mt-2  text-[1.2rem] text-black tracking-[.05rem]">{content}</p>
            )}
            {(type === "IMAGE" || type === "IMAGE_COMPUTE") && image_url && (

              <Image
                className="img-frame flex border-indigo-500 rounded-lg mt-[.8rem] mb-[2rem]  ml-[7.5rem] mr-[8rem] p-2 items-center"
                src={image_url}
                alt="image not found"
                width={0}
                height={0}
                sizes="200vw"
              />
            )}
                        {type === "VIDEO" && video_url && (
              <div className="yt-container mt-2 mb-2">
                <iframe
                  title="video"
                  width={560}
                  height={315}
                  src={video_url}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                ></iframe>
              </div>
            )}
            {type === "GALLERY" && content && (
              <div className="flex flex-wrap gap-2 mt-2 mb-2">
                {JSON.parse(content).map((url: string, idx: number) => (
                  <div key={idx} className="relative w-32 h-32">
                    <Image src={url} alt={`img-${idx}`} fill style={{ objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            )}
            <hr className="mt-4 mb-3 w-[48rem] h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-75" />

            <div className="mt-4 flex flex-col gap-x-3 gap-y-4">
              <div className="flex gap-x-12 gap-y-8">
                <LikeButton
                  {...(isRealtimePost
                    ? { realtimePostId: id.toString() }
                    : { postId: id })}
                  likeCount={likeCount}
                  initialLikeState={currentUserLike}
                />
                {!isRealtimePost && (
                  <>
                    <ExpandButton postId={id} />
                  </>
                )}
                {!isRealtimePost && <ReplicateButton postId={id} />}
                {!isRealtimePost && <ShareButton postId={id} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
