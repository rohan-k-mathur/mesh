import PostCard from "./PostCard";
import { fetchPostById } from "@/lib/actions/thread.actions";
import { fetchRealtimePostById } from "@/lib/actions/realtimepost.actions";
import {
  fetchLikeForCurrentUser,
  fetchRealtimeLikeForCurrentUser,
} from "@/lib/actions/like.actions";

interface Props {
  id: bigint;
  originalPostId: bigint;
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
}

const ReplicatedPostCard = async ({
  id,
  originalPostId,
  currentUserId,
  isRealtimePost = false,
  author,
  createdAt,
  likeCount,
  expirationDate,
}: Props) => {
  const original = isRealtimePost
    ? await fetchRealtimePostById({ id: originalPostId.toString() })
    : await fetchPostById(originalPostId);
  if (!original) return null;

  const currentUserLike = currentUserId
    ? isRealtimePost
      ? await fetchRealtimeLikeForCurrentUser({
          realtimePostId: id,
          userId: currentUserId,
        })
      : await fetchLikeForCurrentUser({ postId: id, userId: currentUserId })
    : null;

  const originalUserLike = currentUserId
    ? isRealtimePost
      ? await fetchRealtimeLikeForCurrentUser({
          realtimePostId: original.id,
          userId: currentUserId,
        })
      : await fetchLikeForCurrentUser({ postId: original.id, userId: currentUserId })
    : null;

  return (
    <PostCard
      id={id}
      currentUserId={currentUserId}
      currentUserLike={currentUserLike}
      content="Replicated"
      type="TEXT"
      isRealtimePost={isRealtimePost}
      author={author}
      createdAt={createdAt}
      likeCount={likeCount}
      expirationDate={expirationDate ?? undefined}
      embedPost={
        <PostCard
          id={original.id}
          currentUserId={currentUserId}
          currentUserLike={originalUserLike}
          content={original.content ?? undefined}
          image_url={(original as any).image_url ?? undefined}
          video_url={(original as any).video_url ?? undefined}
          type={original.type}
          author={original.author!}
          createdAt={original.created_at.toDateString()}
          likeCount={original.like_count}
          commentCount={(original as any).commentCount ?? 0}
          expirationDate={(original as any).expiration_date?.toISOString?.() ?? null}
          isRealtimePost={isRealtimePost}
          pluginType={(original as any).pluginType ?? null}
          pluginData={(original as any).pluginData ?? null}
          claimIds={(original as any).productReview?.claims.map((c: any) => c.id.toString()) ?? []}
        />
      }
    />
  );
};

export default ReplicatedPostCard;