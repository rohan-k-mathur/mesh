"use client";

import PostCard from "@/components/cards/PostCard";
import { useInfiniteRealtimePosts } from "@/lib/hooks/useInfiniteRealtimePosts";
import Spinner from "@/components/ui/spinner";
import { realtime_post_type } from "@prisma/client";
import { useMemo } from "react";
import ScrollList from "./ScrollList";

interface Props {
  initialPosts: any[];
  initialIsNext: boolean;
  roomId?: string;
  postTypes?: realtime_post_type[];
  currentUserId?: bigint;
  animated?: boolean;
}

export default function RealtimeFeed({
  initialPosts,
  initialIsNext,
  roomId,
  postTypes,
  currentUserId,
  animated = false,
}: Props) {
  const fetchPage = useMemo(() => {
    if (roomId && postTypes && postTypes.length > 0) {
      return async (page: number) => {
        const params = new URLSearchParams({
          roomId,
          page: page.toString(),
          types: postTypes.join(","),
        });
        const res = await fetch(`/api/realtime-posts?${params.toString()}`);
        return res.json();
      };
    }
    return async (_page: number) => {
      const res = await fetch(`/api/feed`);
      return { posts: await res.json(), isNext: false };
    };
  }, [roomId, postTypes]);

  const isFeed = roomId === "global" && (!postTypes || postTypes.length === 0);

  const { posts, loaderRef, loading } = useInfiniteRealtimePosts(
    fetchPage,
    initialPosts,
    initialIsNext
  );

  const items = posts.map((realtimePost) => (
    <div key={realtimePost.id.toString()} className={animated ? "scroll-list__item js-scroll-list-item" : ""}>
      <PostCard
        currentUserId={currentUserId}
        id={realtimePost.id}
        isRealtimePost={Boolean(roomId && postTypes && postTypes.length > 0)}
        isFeedPost={isFeed}
        likeCount={realtimePost.like_count}
        commentCount={realtimePost.commentCount ?? 0}
        content={realtimePost.content ? realtimePost.content : undefined}
        roomPostContent={(realtimePost as any).room_post_content}
        image_url={realtimePost.image_url ? realtimePost.image_url : undefined}
        video_url={realtimePost.video_url ? realtimePost.video_url : undefined}
        pluginType={(realtimePost as any).pluginType ?? null}
        pluginData={(realtimePost as any).pluginData ?? null}
        caption={(realtimePost as any).caption ?? null}
        type={realtimePost.type}
        author={realtimePost.author!}
        createdAt={new Date(realtimePost.created_at).toDateString()}
        claimIds={realtimePost.productReview?.claims.map((c: any) => c.id.toString()) ?? []}
      />
    </div>
  ));

  const content = (
    <>
      {items}
      <div ref={loaderRef} className="h-1" />
      {loading && (
        <div className="flex justify-center mt-0 mb-4">
          <Spinner className="w-[3rem] h-[3rem]" />
        </div>
      )}
    </>
  );

  return animated ? (
    <ScrollList>{content}</ScrollList>
  ) : (
    <section className="mt-[0rem] flex flex-col gap-8">{content}</section>
  );
}
