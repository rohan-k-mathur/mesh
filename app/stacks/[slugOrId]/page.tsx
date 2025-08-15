import { notFound } from "next/navigation";
import {
  getStackPageData,
  toggleStackSubscription,
  reorderStack,
  removeFromStack,
  addCollaborator,
} from "@/lib/actions/stack.actions";
import StackAddModal from "@/components/modals/StackAddModal";
import PdfLightbox from "@/components/modals/PdfLightbox";
import { prisma } from "@/lib/prismaclient";
import StackDiscussion from "@/components/stack/StackDiscussion";
import Image from "next/image";
import SortablePdfGrid from "@/components/stack/SortablePdfGrid";

export default async function StackPage({ params }: { params: { slugOrId: string } }) {
  const { slugOrId } = params;
  const bySlug = await prisma.stack.findUnique({
    where: { slug: slugOrId },
    select: { id: true },
  });
  const id = bySlug?.id ?? slugOrId;
  const data = await getStackPageData(id);
  if ((data as any).notFound) return notFound();
  const { stack, posts, viewer, discussionPostId } = data as any;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{stack.name}</h1>
          {stack.description && (
            <p className="mt-2 text-sm text-muted-foreground">{stack.description}</p>
          )}
          <div className="mt-2 text-xs text-slate-500">
            Visibility: {stack.is_public ? "Public" : "Private"}
          </div>
          {stack.slug && (
            <div className="mt-1 text-xs text-slate-400">Slug: /stacks/{stack.slug}</div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <form action={toggleStackSubscription}>
            <input type="hidden" name="stackId" value={stack.id} />
            <input
              type="hidden"
              name="op"
              value={viewer.subscribed ? "unsubscribe" : "subscribe"}
            />
      <button className="px-3 py-1 text-sm bg-rose-700/70 sendbutton rounded-md text-center text-slate-100 ">
              {viewer.subscribed ? "Unsubscribe" : "Subscribe"}
            </button>
          </form>
          {viewer.editable && <StackAddModal stackId={stack.id} />}
        </div>
      </div>
      {viewer.isOwner && (
        <div className="mt-6 rounded-xl  bg-white/30 px-3 py-4">
          <div className="text-[1.0rem] mb-2 tracking-wide">Collaborators</div>
          <form action={addCollaborator} className="flex items-center gap-2">
            <input type="hidden" name="stackId" value={stack.id} />
            <div className="flex gap-4 ">
            <input
              name="userId"
              placeholder="User ID"
              className="bg-white/70 commentfield  rounded-xl px-4 py-1 text-sm"
            />
            <input
              name="username"
              placeholder="Username"
              className="bg-white/70 commentfield rounded-xl px-3 py-1 text-sm"
            />
            <select name="role" className="border-none rounded-xl px-3 py-1 bg-white/70 text-sm text-start focus:border-none sendbutton">
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <button className="px-3 py-1 bg-white/50 sendbutton text-center text-sm rounded-xl ">Add</button>
            </div>
          </form>
         
        </div>
      )}

      {/* <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {posts.map((p: any) => {
          const cover = p.thumb_urls?.[0] || "/assets/pdf-placeholder.png";
          return (
            <div key={p.id} className="group relative rounded border overflow-hidden bg-white">
              <PdfLightbox
                trigger={
                  <Image
                    src={cover}
                    alt={p.title || "PDF"}
                    width={400}
                    height={300}
                    unoptimized
                    className="w-full aspect-[4/3] object-cover cursor-pointer"
                    loading="lazy"
                  />
                }
                fileUrl={p.file_url}
                title={p.title ?? "PDF"}
              />
              {viewer.editable && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <form action={reorderStack}>
                    <input type="hidden" name="stackId" value={stack.id} />
                    <input type="hidden" name="postId" value={p.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button className="px-2 py-1 text-xs rounded bg-white/90 border">↑</button>
                  </form>
                  <form action={reorderStack}>
                    <input type="hidden" name="stackId" value={stack.id} />
                    <input type="hidden" name="postId" value={p.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button className="px-2 py-1 text-xs rounded bg-white/90 border">↓</button>
                  </form>
                  <form action={removeFromStack}>
                    <input type="hidden" name="stackId" value={stack.id} />
                    <input type="hidden" name="postId" value={p.id} />
                    <button className="px-2 py-1 text-xs rounded bg-white/90 border">Remove</button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div> */}
       <SortablePdfGrid
        stackId={stack.id}
        editable={viewer.editable}
        posts={posts}
      />
              <hr className="mt-5 border-slate-500"></hr>


      <div className="mt-10">
        <h2 className="text-[1.5rem] px-1 tracking-wider font-semibold py-1 ">Comments</h2>
        <StackDiscussion feedPostId={discussionPostId} />
      </div>
    </div>
  );
}
