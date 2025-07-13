"use client";

import PostCard from "@/components/cards/PostCard";
import { useInfiniteRealtimePosts } from "@/lib/hooks/useInfiniteRealtimePosts";
import Spinner from "@/components/ui/spinner";
import { realtime_post_type } from "@prisma/client";
import { useMemo } from "react";

interface Props {
  initialPosts: any[];
  initialIsNext: boolean;
  roomId: string;
  postTypes: realtime_post_type[];
  currentUserId?: bigint;
}

export default function RealtimeFeed({
  initialPosts,
  initialIsNext,
  roomId,
  postTypes,
  currentUserId,
}: Props) {
  const fetchPage = useMemo(
    () => async (page: number) => {
      const params = new URLSearchParams({
        roomId,
        page: page.toString(),
        types: postTypes.join(","),
      });
      const res = await fetch(`/api/realtime-posts?${params.toString()}`);
      return res.json();
    },
    [roomId, postTypes]
  );

  const { posts, loaderRef, loading } = useInfiniteRealtimePosts(
    fetchPage,
    initialPosts,
    initialIsNext
  );

  return (
    <section className="mt-[0rem] flex flex-col gap-12">
      {posts.map((realtimePost) => (
        <PostCard
          key={realtimePost.id.toString()}
          currentUserId={currentUserId}
          id={realtimePost.id}
          isRealtimePost
          likeCount={realtimePost.like_count}
          commentCount={realtimePost.commentCount}
          content={realtimePost.content ? realtimePost.content : undefined}
          image_url={realtimePost.image_url ? realtimePost.image_url : undefined}
          video_url={realtimePost.video_url ? realtimePost.video_url : undefined}
          pluginType={(realtimePost as any).pluginType ?? null}
          pluginData={(realtimePost as any).pluginData ?? null}
          type={realtimePost.type}
          author={realtimePost.author!}
          createdAt={new Date(realtimePost.created_at).toDateString()}
          claimIds={realtimePost.productReview?.claims.map((c: any) => c.id.toString()) ?? []}
        />
      ))}
      <div ref={loaderRef} className="h-1" />
      {loading && (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      )}
    </section>
  );
}
