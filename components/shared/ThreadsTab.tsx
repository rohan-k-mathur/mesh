import { fetchUserThreads } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import ThreadCard from "@/components/cards/ThreadCard";

interface Props {
  currentUserId: bigint;
  accountId: bigint;
}
const ThreadsTab = async ({ currentUserId, accountId }: Props) => {
  let result = await fetchUserThreads(accountId);

  if (!result) redirect("/");

  return (
    <section className="mt-9 flex flex-col gap-10">
      {result.posts.map((post) => (
        <ThreadCard
          key={post.id}
          id={post.id}
          currentUserId={currentUserId}
          parentId={post.parent_id}
          content={post.content}
          author={{
            name: post.author.name,
            image: post.author.image,
            id: post.author.id,
          }}
          createdAt={post.created_at.toString()}
          comments={post.children}
          likeCount={post.like_count}
        />
      ))}
    </section>
  );
};

export default ThreadsTab;
