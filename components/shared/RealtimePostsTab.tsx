import PostCard from "@/components/cards/PostCard";
import { fetchUserRealtimePosts } from "@/lib/actions/realtimepost.actions";
import { redirect } from "next/navigation";

interface Props {
  currentUserId: bigint;
  accountId: bigint;
}

const RealtimePostsTab = async ({ currentUserId, accountId }: Props) => {
  const posts = await fetchUserRealtimePosts({
    realtimeRoomId: "global",
    userId: accountId,
    postTypes: ["TEXT", "VIDEO", "IMAGE", "IMAGE_COMPUTE", "GALLERY"],
  });

  if (!posts) redirect("/");

  return (
    <section className="mt-[0rem] flex flex-col gap-12">
      {posts.length === 0 ? (
        <p className="no-result">Nothing found</p>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              currentUserId={currentUserId}
              id={post.id}
              isRealtimePost
              content={post.content ? post.content : undefined}
              image_url={post.image_url ? post.image_url : undefined}
              video_url={post.video_url ? post.video_url : undefined}
              type={post.type}
              author={post.author!}
              createdAt={post.created_at.toDateString()}
            />
          ))}
        </>
      )}
    </section>
  );
};

export default RealtimePostsTab;
