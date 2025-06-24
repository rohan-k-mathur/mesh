import PostThread from "@/components/forms/PostThread";
import ThreadCard from "@/components/cards/ThreadCard";
import { fetchPosts } from "@/lib/actions/thread.actions";
import { getUserFromCookies } from "@/lib/serverutils";

export const metadata = {
  title: "Mesh",
  description: "A website",
};

export default async function Home() {
  const { posts } = await fetchPosts();
  const user = await getUserFromCookies();

  return (
    <div>
      {user && (
        <div className="mb-8">
          <PostThread userId={user.userId!} />
        </div>
      )}
      <section className="mt-[0rem] flex flex-col gap-12">
        {posts.length === 0 ? (
          <p className="no-result">Nothing found</p>
        ) : (
          <>
            {posts.map((post) => (
              <ThreadCard
                key={post.id}
                id={post.id}
                currentUserId={user?.userId}
                parentId={post.parent_id}
                content={post.content}
                author={post.author}
                createdAt={post.created_at.toDateString()}
                comments={post.children}
                likeCount={post.like_count}
              />
            ))}
          </>
        )}
      </section>
    </div>
  );
}
