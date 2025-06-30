import { fetchRealtimePostById } from "@/lib/actions/realtimepost.actions";
import { redirect, notFound } from "next/navigation";
import { getUserFromCookies } from "@/lib/serverutils";
import PostCard from "@/components/cards/PostCard";
import Modal from "@/components/modals/Modal";

const Page = async ({ params }: { params: { id: string } }) => {
  if (!params?.id && params?.id?.length !== 1) return notFound();
  const user = await getUserFromCookies();
  if (!user?.onboarded) redirect("/onboarding");
  const post = await fetchRealtimePostById({ id: params.id });
  if (!post) notFound();

  return (
    <section className="relative">
      <Modal />
      <div>
        <PostCard
          key={post.id.toString()}
          currentUserId={user?.userId}
          id={post.id}
          isRealtimePost
          likeCount={post.like_count}
          content={
            post.type === "TEXT" || post.type === "GALLERY"
              ? post.content!
              : undefined
          }
          image_url={
            post.type === "IMAGE" || post.type === "IMAGE_COMPUTE"
              ? post.image_url!
              : undefined
          }
          video_url={post.type === "VIDEO" ? post.video_url! : undefined}
          type={post.type}
          author={post.author!}
          createdAt={post.created_at.toDateString()}
        />
      </div>
    </section>
  );
};

export default Page;
