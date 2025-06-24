import PostCard from "@/components/cards/PostCard";
import { fetchRealtimePosts } from "@/lib/actions/realtimepost.actions";
import { getUserFromCookies } from "@/lib/serverutils";

export const metadata = {
  title: "Mesh",
  description: "A website",
};

export default async function Home() {
  const result = await fetchRealtimePosts({
    realtimeRoomId: "global",
    postTypes: ["TEXT", "VIDEO", "IMAGE", "IMAGE_COMPUTE"],
  });
  const user = await getUserFromCookies();

  return (
    <div >
      <section className="mt-[0rem] flex flex-col gap-12">
        {result.length === 0 ? (
          <p className="no-result">Nothing found</p>
        ) : (
          <>
            {result.map((realtimePost) => (
              <PostCard
                key={realtimePost.id}
                currentUserId={user?.userId}
                id={realtimePost.id}
                content={
                  realtimePost.content ? realtimePost.content : undefined
                }
                image_url={
                  realtimePost.image_url ? realtimePost.image_url : undefined
                }
                author={realtimePost.author!}
                createdAt={realtimePost.created_at.toDateString()}
              />
            ))}
          </>
        )}
      </section>
    </div>
  );
}
