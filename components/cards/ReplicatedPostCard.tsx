"use client";

import PostCard from "./PostCard";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { Fetcher } from "swr";
interface Props {
  id: bigint;
  originalPostId: bigint;
  source: "feed" | "realtime";
  currentUserId?: bigint | null;
  isRealtimePost?: boolean;
  author: {
    name: string | null;
    image: string | null;
    id: bigint;
  };
  createdAt: string;
  likeCount: number;
  expirationDate?: string | null;
  text?: string;
}

export default function ReplicatedPostCard(props: Props) {
  const {
    id,
    originalPostId,
    source,
    currentUserId,
    author,
    createdAt,
    likeCount,
    expirationDate,
    text = "Replicated"
  } = props;

  const fetcher = (u: string) => fetch(u).then(r => r.json());

/* ------------------------------------------------------------------ */
  /* 1. fetch the original post (SWR keeps it fresh & caches automatically)
  /* ------------------------------------------------------------------ */
  const { data: original, isLoading } = useSWR(
    `/api/${source === "feed" ? "feed" : "realtime-posts"}/${originalPostId}`,
    fetcher
  );

  if (isLoading || !original) return null;

  /* ------------------------------------------------------------------ */
  /* 2. render a wrapper PostCard that embeds the original PostCard
  /* ------------------------------------------------------------------ */
  return (
    <PostCard
      id={id}
      type="TEXT"
      content={text}
      author={author}
      createdAt={createdAt}
      likeCount={likeCount}
      expirationDate={expirationDate ?? undefined}
      currentUserId={currentUserId}
      /* replicate cards live in the same “namespace” as their parent */
      isRealtimePost={source === "realtime"}
      isFeedPost={source === "feed"} 
      embedPost={
        <PostCard
          id={original.id}
          type={original.type}
          content={original.content ?? undefined}
          image_url={original.image_url ?? undefined}
          video_url={original.video_url ?? undefined}
          pluginType={original.pluginType ?? null}
          pluginData={original.pluginData ?? null}
          author={original.author}
          createdAt={new Date(original.created_at).toDateString()}
          likeCount={original.like_count}
          commentCount={original.commentCount ?? 0}
          expirationDate={original.expiration_date ?? null}
          currentUserId={currentUserId}
          isRealtimePost={source === "realtime"}
          isFeedPost={source === "feed"} 

          /* extras for product‑review */
          claimIds={
            original.productReview?.claims?.map((c: any) =>
              c.id.toString()
            ) ?? []
          }
        />
      }
    />
  );
}


// const ReplicatedPostCard = ({
//   id,
//   originalPostId,
//   source,
//   currentUserId,
//   isRealtimePost = false,
//   author,
//   createdAt,
//   likeCount,
//   expirationDate,
//   text = "Replicated",
// }: Props) => {
//   const [original, setOriginal] = useState<any | null>(null);
//   const [currentUserLike, setCurrentUserLike] = useState<any | null>(null);
//   const [originalUserLike, setOriginalUserLike] = useState<any | null>(null);

//   useEffect(() => {
//     async function load() {
//       const params = new URLSearchParams({
//         id: id.toString(),
//         originalId: originalPostId.toString(),
//         isRealtime: String(isRealtimePost),
//       });
//       if (currentUserId) params.append("userId", currentUserId.toString());
//       const res = await fetch(`/api/replicated-post?${params.toString()}`);
//       if (!res.ok) return;
//       const data = await res.json();
//       setOriginal(data.original);
//       setCurrentUserLike(data.currentUserLike);
//       setOriginalUserLike(data.originalUserLike);
//     }
//     load();
//   }, [id, originalPostId, currentUserId, isRealtimePost]);

//   if (!original) return null;

//   return (
//     <PostCard
//       id={id}
//       currentUserId={currentUserId}
//       currentUserLike={currentUserLike}
//       content={text}
//       type="TEXT"
//       isRealtimePost={isRealtimePost}
//       author={author}
//       createdAt={createdAt}
//       likeCount={likeCount}
//       expirationDate={expirationDate ?? undefined}
//       embedPost={
//         <PostCard
//           id={original.id}
//           currentUserId={currentUserId}
//           currentUserLike={originalUserLike}
//           content={original.content ?? undefined}
//           image_url={(original as any).image_url ?? undefined}
//           video_url={(original as any).video_url ?? undefined}
//           type={original.type}
//           author={original.author!}
//           createdAt={new Date(original.created_at).toDateString()}
//           likeCount={original.like_count}
//           commentCount={(original as any).commentCount ?? 0}
//           expirationDate={(original as any).expiration_date ?? null}
//           isRealtimePost={isRealtimePost}
//           pluginType={(original as any).pluginType ?? null}
//           pluginData={(original as any).pluginData ?? null}
//           claimIds={(original as any).productReview?.claims.map((c: any) => c.id.toString()) ?? []}
//         />
//       }
//     />
//   );
// };

// export default ReplicatedPostCard;