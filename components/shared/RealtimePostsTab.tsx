import PostCard from "@/components/cards/PostCard";
import { fetchUserRealtimePosts } from "@/lib/actions/realtimepost.actions";
import { fetchRealtimeLikeForCurrentUser } from "@/lib/actions/like.actions";
import { redirect } from "next/navigation";

interface Props {
  currentUserId: bigint;
  accountId: bigint;
}

const RealtimePostsTab = async ({ currentUserId, accountId }: Props) => {
  const posts = await fetchUserRealtimePosts({
    realtimeRoomId: "global",
    userId: accountId,
    postTypes: ["TEXT", "VIDEO", "IMAGE", "IMAGE_COMPUTE", "GALLERY", "DRAW"],
  });

  if (!posts) redirect("/");

  const postsWithLikes = await Promise.all(
    posts.map(async (post) => {
      const like = currentUserId
        ? await fetchRealtimeLikeForCurrentUser({
            realtimePostId: post.id,
            userId: currentUserId,
          })
        : null;
      return { post, like };
    })
  );

  return (
    <section className="mt-[3rem] flex flex-col gap-12">
      {postsWithLikes.length === 0 ? (
        <p className="no-result">Nothing found</p>
      ) : (
        <>
          {postsWithLikes.map(({ post, like }) => (
            <PostCard
              key={post.id.toString()}
              currentUserId={currentUserId}
              currentUserLike={like}
              id={post.id}
              isRealtimePost
              likeCount={post.like_count}
              commentCount={post.commentCount}
              content={post.content ? post.content : undefined}
              image_url={post.image_url ? post.image_url : undefined}
              video_url={post.video_url ? post.video_url : undefined}
              pluginType={(post as any).pluginType ?? null}
              pluginData={(post as any).pluginData ?? null}
              type={post.type}
              author={post.author!}
              createdAt={post.created_at.toDateString()}
              claimIds={post.productReview?.claims.map((c) => c.id.toString()) ?? []}
            />
          ))}
        </>
      )}
    </section>
  );
};

export default RealtimePostsTab;
