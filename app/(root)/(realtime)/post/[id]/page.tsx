import { fetchRealtimePostTreeById } from "@/lib/actions/realtimepost.actions";
import { redirect, notFound } from "next/navigation";
import { getUserFromCookies } from "@/lib/serverutils";
import PostCard from "@/components/cards/PostCard";
import { fetchRealtimeLikeForCurrentUser } from "@/lib/actions/like.actions";
import Modal from "@/components/modals/Modal";
import Comment from "@/components/forms/Comment";
import CommentTree from "@/components/shared/CommentTree";

const Page = async ({ params }: { params: { id: string } }) => {
  if (!params?.id && params?.id?.length !== 1) return notFound();
  // const user = await getUserFromCookies();
  // if (!user?.onboarded) redirect("/onboarding");
  // const post = await fetchRealtimePostTreeById({ id: params.id });
  // if (!post) notFound();
  // if (!params?.id) notFound();
  if (!params?.id || params.id === 'undefined') notFound();
    
    const user = await getUserFromCookies();
    if (!user?.onboarded) redirect("/onboarding");
    const post = await fetchRealtimePostTreeById({ id: params.id });
    if (!post) notFound();
  const currentUserLike = user
    ? await fetchRealtimeLikeForCurrentUser({
        realtimePostId: post.id,
        userId: user.userId,
      })
    : null;

  return (
    <section className="relative">
      <Modal />
      <div>
        <PostCard
          key={post.id.toString()}
          currentUserId={user?.userId}
          currentUserLike={currentUserLike}
          id={post.id}
          isRealtimePost
          likeCount={post.like_count}
          commentCount={post.commentCount}
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
          caption={(post as any).caption ?? null}
          video_url={post.type === "VIDEO" ? post.video_url! : undefined}
          pluginType={(post as any).pluginType ?? null}
          pluginData={(post as any).pluginData ?? null}
          type={post.type}
          author={post.author!}
          createdAt={post.created_at.toDateString()}
          claimIds={post.productReview?.claims.map((c) => c.id.toString()) ?? []}
        />
      </div>
      <div className="flex-1 flex-row w-full mt-6 ml-4">
        <Comment
          realtimePostId={post.id.toString()}
          currentUserImg={user.photoURL!}
          currentUserId={user.userId!}
        />
      </div>
      <hr className="mt-4 mb-3 w-full h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-slate-900 to-transparent opacity-75" />
      <div className="flex-1 flex-row w-full mt-2 ml-4">
        <CommentTree
          comments={post.children}
          currentUserId={user.userId!}
          currentUserImg={user.photoURL!}
          depth={1}
          isRealtimePost
        />
      </div>
    </section>
  );
};

export default Page;
