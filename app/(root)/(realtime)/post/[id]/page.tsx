import { fetchRealtimePostById } from "@/lib/actions/realtimepost.actions";
import { redirect, notFound } from "next/navigation";
import { getUserFromCookies } from "@/lib/serverutils";
import PostCard from "@/components/cards/PostCard";

const Page = async ({ params }: { params: { id: string } }) => {
  if (!params?.id && params?.id?.length !== 1) return notFound();
  const user = await getUserFromCookies();
  if (!user?.onboarded) redirect("/onboarding");
  const post = await fetchRealtimePostById({ id: params.id });
  if (!post) notFound();

  return (
    <section className="relative">
      <div>
        <PostCard
          key={post.id}
          currentUserId={user?.userId}
          id={post.id}
          content={post.type === "TEXT" ? post.content! : undefined}
          image_url={post.type === "IMAGE" ? post.image_url! : undefined}
          author={post.author!}
          createdAt={post.created_at.toDateString()}
        />
      </div>
    </section>
  );
};

export default Page;
