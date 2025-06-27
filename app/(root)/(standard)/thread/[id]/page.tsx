import ThreadCard from "@/components/cards/ThreadCard";
import Comment from "@/components/forms/Comment";
import { fetchPostTreeById } from "@/lib/actions/thread.actions";
import CommentTree from "@/components/shared/CommentTree";
import { redirect, notFound } from "next/navigation";
import { getUserFromCookies } from "@/lib/serverutils";

const Page = async ({ params }: { params: { id: string } }) => {
  if (!params?.id && params?.id?.length !== 1) return notFound();
  const user = await getUserFromCookies();
  if (!user?.onboarded) redirect("/onboarding");
  const post = await fetchPostTreeById(BigInt(params.id));
  if (!post) notFound();

  return (
    <section className="relative">
      <div>
        <ThreadCard
          key={post.id}
          currentUserId={user?.userId}
          id={post.id}
          parentId={post.parent_id}
          content={post.content}
          author={post.author!}
          createdAt={post.created_at.toDateString()}
          comments={post.children}
          likeCount={post.like_count}
        />
      </div>
      <div className="mt-7">
        <Comment
          postId={post.id}
          currentUserImg={user.photoURL!}
          currentUserId={user.userId!}
        />
      </div>
      <CommentTree
        comments={post.children}
        currentUserId={user.userId!}
        currentUserImg={user.photoURL!}
      />
    </section>
  );
};

export default Page;
