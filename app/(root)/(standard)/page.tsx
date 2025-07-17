import Modal from "@/components/modals/Modal";
import RealtimeFeed from "@/components/shared/RealtimeFeed";
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
      "MUSIC",
      "ENTROPY",
      "PORTFOLIO",

      "PLUGIN",
      "PRODUCT_REVIEW",
      "ROOM_CANVAS",


    ],
  });
  const user = await getUserFromCookies();
  if (!user) redirect("/login");

  return (
    <div>
      <Modal />
      {result.posts.length === 0 ? (
        <p className="no-result">Nothing found</p>
      ) : (
        <RealtimeFeed
          initialPosts={result.posts}
          initialIsNext={result.isNext}
          roomId="global"
          postTypes={[
            "TEXT",
            "VIDEO",
            "IMAGE",
            "IMAGE_COMPUTE",
            "GALLERY",
            "DRAW",
            "LIVECHAT",
            "MUSIC",
            "ENTROPY",
            "PORTFOLIO",
            "PLUGIN",
            "PRODUCT_REVIEW",
            "ROOM_CANVAS",
          ]}
          currentUserId={user.userId}
        />
      )}
    </div>
  );
}
