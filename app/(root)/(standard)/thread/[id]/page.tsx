import ThreadCard from "@/components/cards/ThreadCard";
import Comment from "@/components/forms/Comment";
import { fetchPostById } from "@/lib/actions/thread.actions";
import { redirect, notFound } from "next/navigation";
import { getUserFromCookies } from "@/lib/serverutils";

const Page = async ({ params }: { params: { id: string } }) => {
  if (!params?.id && params?.id?.length !== 1) return notFound();
  const user = await getUserFromCookies();
  if (!user?.onboarded) redirect("/onboarding");
  const post = await fetchPostById(BigInt(params.id));
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
      <section className="mt-10 flex flex-col gap-1">
        {post.children.map((childItem) => (
          <ThreadCard
            key={childItem.id}
            currentUserId={user?.userId}
            id={childItem.id}
            parentId={childItem.parent_id}
            content={childItem.content}
            author={childItem.author}
            createdAt={childItem.created_at.toDateString()}
            comments={childItem.children}
            isComment
            likeCount={childItem.like_count}
          />
        ))}
      </section>
    </section>
  );
};

export default Page;
