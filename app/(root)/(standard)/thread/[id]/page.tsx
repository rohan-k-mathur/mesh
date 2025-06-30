import Comment from "@/components/forms/Comment";
import { fetchPostTreeById } from "@/lib/actions/thread.actions";
import CommentTree from "@/components/shared/CommentTree";
import { redirect, notFound } from "next/navigation";
import { getUserFromCookies } from "@/lib/serverutils";
import PostCard from "@/components/cards/PostCard";
import Modal from "@/components/modals/Modal";

const Page = async ({ params }: { params: { id: string } }) => {
  if (!params?.id && params?.id?.length !== 1) return notFound();
  const user = await getUserFromCookies();
  if (!user?.onboarded) redirect("/onboarding");
  const post = await fetchPostTreeById(BigInt(params.id));
  if (!post) notFound();
  
  return (
    <section className="sticky ">
                <main className=" bg-transparent">
                  
      <Modal />

      <div className="flex flex-row">
        <PostCard
          key={post.id.toString()}
          currentUserId={user?.userId}
          id={post.id}
          parentId={post.parent_id}
          content={post.content ?? undefined}
          image_url={post.image_url ?? undefined}
          video_url={post.video_url ?? undefined}
          type={post.type}
          comments={post.children}
          author={post.author!}
          createdAt={post.created_at.toDateString()}
          likeCount={post.like_count}
          expirationDate={post.expiration_date?.toISOString() ?? null}
        />
      </div>
      

      <div className="flex-1 flex-row w-full  mt-6 ml-4">

        <Comment
          postId={post.id}
          currentUserImg={user.photoURL!}
          currentUserId={user.userId!}
        />
      </div >

      <div className="flex-1 flex-row w-full mt-2 ml-4">

      <CommentTree
      
        comments={post.children}
        currentUserId={user.userId!}
        currentUserImg={user.photoURL!}
        depth={1}
      />
      </div>

          </main>

    </section>
  );
};

export default Page;
