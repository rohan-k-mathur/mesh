import PostCard from "@/components/cards/PostCard";
import Modal from "@/components/modals/Modal";
import { fetchRealtimePosts } from "@/lib/actions/realtimepost.actions";
import { getUserFromCookies } from "@/lib/serverutils";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Mesh",
  description: "A website",
};

// Force this page to be rendered dynamically on every request
export const dynamic = "force-dynamic";

export default async function Home() {
  const result = await fetchRealtimePosts({
    realtimeRoomId: "global",
    postTypes: [
      "TEXT",
      "VIDEO",
      "IMAGE",
      "IMAGE_COMPUTE",
      "GALLERY",
      "DRAW",
      "LIVECHAT",
      "PLUGIN",
    ],
  });
  const user = await getUserFromCookies();
  if (!user) redirect("/login");

  return (
    <div >
      <Modal />
      <section className="mt-[0rem] flex flex-col gap-12">
        {result.length === 0 ? (
          <p className="no-result">Nothing found</p>
        ) : (
          <>
            {result.map((realtimePost) => (
              <PostCard
                key={realtimePost.id.toString()}
                currentUserId={user?.userId}
                id={realtimePost.id}
                isRealtimePost
              likeCount={realtimePost.like_count}
              commentCount={realtimePost.commentCount}
              content={
                realtimePost.content ? realtimePost.content : undefined
              }
                image_url={
                  realtimePost.image_url ? realtimePost.image_url : undefined
                }
                video_url={
                  realtimePost.video_url ? realtimePost.video_url : undefined
                }
                pluginType={(realtimePost as any).pluginType ?? null}
                pluginData={(realtimePost as any).pluginData ?? null}
                type={realtimePost.type}
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
