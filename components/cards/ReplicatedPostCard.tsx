import PostCard from "./PostCard";
import { fetchPostById } from "@/lib/actions/thread.actions";

interface Props {
  id: bigint;
  originalPostId: bigint;
  currentUserId?: bigint | null;
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
  author,
  createdAt,
  likeCount,
  expirationDate,
}: Props) => {
  const original = await fetchPostById(originalPostId);
  if (!original) return null;

  return (
    <article className="flex flex-col gap-4">
      <PostCard
        id={id}
        currentUserId={currentUserId}
        content="Replicated"
        type="TEXT"
        author={author}
        createdAt={createdAt}
        likeCount={likeCount}
        expirationDate={expirationDate ?? undefined}
      />
      <div className="ml-6">
        <PostCard
          id={original.id}
          currentUserId={currentUserId}
          content={original.content}
          type="TEXT"
          author={original.author!}
          createdAt={original.created_at.toDateString()}
          likeCount={original.like_count}
          expirationDate={original.expiration_date?.toISOString() ?? null}
        />
      </div>
    </article>
  );
};

export default ReplicatedPostCard;