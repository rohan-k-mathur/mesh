import ThreadCard from "@/components/cards/ThreadCard";
import Comment from "@/components/forms/Comment";
import { fetchPostTreeById } from "@/lib/actions/thread.actions";
import { fetchPostById } from "@/lib/actions/thread.actions";
import CommentTree from "@/components/shared/CommentTree";
import { redirect, notFound } from "next/navigation";
import { getUserFromCookies } from "@/lib/serverutils";
import PostCard from "@/components/cards/PostCard";

const Page = async ({ params }: { params: { id: string } }) => {
  if (!params?.id && params?.id?.length !== 1) return notFound();
  const user = await getUserFromCookies();
  if (!user?.onboarded) redirect("/onboarding");
  const post = await fetchPostById(BigInt(params.id));
  if (!post) notFound();
  
  return (
    <section className="sticky ">
                <main className=" bg-transparent">

      <div className="flex flex-row">
        {/* <PostCard
          key={post.id}
          currentUserId={user?.userId}
          id={post.id}
          parentId={post.parent_id}
          content={post.content}
          author={post.author!}
          createdAt={post.created_at.toDateString()}
          comments={post.children}
          likeCount={post.like_count}
        /> */}
        <ThreadCard
                key={post.id}
                currentUserId={user?.userId}
                id={post.id}
                parentId={post.parent_id}

                likeCount={post.like_count}
                content={
                  post.content ? post.content : undefined
                }
                comments={post.children}

                author={post.author!}
                createdAt={post.created_at.toDateString()}
              />
      </div>

      <div className="flex-1 flex-row w-full  mt-6 ml-4">
      <hr className="mt-4 mb-3 w-full h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-slate-900 to-transparent opacity-75" />

        <Comment
          postId={post.id}
          currentUserImg={user.photoURL!}
          currentUserId={user.userId!}
        />
      </div >
      <hr className="mt-4 mb-3 w-full h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-slate-900 to-transparent opacity-75" />

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
