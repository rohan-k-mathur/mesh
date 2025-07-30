import Modal from "@/components/modals/Modal";
import RealtimeFeed from "@/components/shared/RealtimeFeed";
import { fetchFeedPosts } from "@/lib/actions/feed.actions";
import { getUserFromCookies } from "@/lib/serverutils";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Mesh",
  description: "A website",
};

// Force this page to be rendered dynamically on every request
export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await fetchFeedPosts();
  const user = await getUserFromCookies();
  if (!user) redirect("/login");

  const USE_SCROLL_ANIMATION = false;

  return (
    <div>
      <Modal />
      {posts.length === 0 ? (
        <p className="no-result">Nothing found</p>
      ) : (
        <RealtimeFeed
          initialPosts={posts}
          initialIsNext={false}
          roomId="global"
          postTypes={[]}
          currentUserId={user.userId}
          animated={USE_SCROLL_ANIMATION}
        />
      )}
    </div>
  );
}
