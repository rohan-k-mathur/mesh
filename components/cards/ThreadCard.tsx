import { fetchLikeForCurrentUser, fetchRealtimeLikeForCurrentUser } from "@/lib/actions/like.actions";
import type { Like, RealtimeLike } from "@prisma/client";
import PostCard from "./PostCard";
import localFont from "next/font/local";
const founders = localFont({ src: "./NewEdgeTest-RegularRounded.otf" });

interface Props {
  id: bigint;
  currentUserId?: bigint | null;
  parentId: bigint | null;
  content?: string;
  image_url?: string;
  video_url?: string;
  type?: string;

  author: {
    name: string | null;
    image: string | null;
    id: bigint;
  };
  createdAt: string;
  comments: {
    author: {
      image: string | null;
    } | null;
  }[];
  isComment?: boolean;
  isRealtimePost?: boolean;
  likeCount: number;
  commentCount?: number;
  expirationDate?: string | null;
  pluginType?: string | null;
  pluginData?: Record<string, any> | null;
  claimIds?: (string | number | bigint)[];
}

const ThreadCard = async ({
  id,
  currentUserId,
  parentId,
  content,
  image_url,
  video_url,
  type = "TEXT",
  author,
  createdAt,
  comments,
  isComment,
  isRealtimePost = false,
  likeCount,
  commentCount = 0,
  expirationDate = null,
  pluginType = null,
  pluginData = null,
  claimIds,
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

  return (
    <PostCard
      id={id}
      currentUserId={currentUserId}
      currentUserLike={currentUserLike}
      image_url={image_url}
      video_url={video_url}
      content={content}
      type={type}
      author={author}
      createdAt={createdAt}
      isRealtimePost={isRealtimePost}
      likeCount={likeCount}
      commentCount={commentCount}
      expirationDate={expirationDate ?? undefined}
      pluginType={pluginType}
      pluginData={pluginData}
      claimIds={claimIds}
    />
  );
};

export default ThreadCard;
