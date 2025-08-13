import { notFound } from "next/navigation";
import { getStackPageData, toggleStackSubscription, reorderStack, removeFromStack } from "@/lib/actions/stack.actions";
import StackAddModal from "@/components/modals/StackAddModal";
import PdfLightbox from "@/components/modals/PdfLightbox";

export default async function StackPage({ params }: { params: { id: string } }) {
  const data = await getStackPageData(params.id);
  if ((data as any).notFound) return notFound();
  const { stack, posts, viewer } = data as any;

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
        </div>
        <div className="flex items-center gap-2">
          <form action={toggleStackSubscription}>
            <input type="hidden" name="stackId" value={stack.id} />
            <input type="hidden" name="op" value={viewer.subscribed ? "unsubscribe" : "subscribe"} />
            <button className="px-3 py-2 rounded border">
              {viewer.subscribed ? "Unsubscribe" : "Subscribe"}
            </button>
          </form>
          {viewer.editable && <StackAddModal stackId={stack.id} />}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {posts.map((p: any) => {
          const cover = p.thumb_urls?.[0] || "/assets/pdf-placeholder.png";
          return (
            <div key={p.id} className="group relative rounded border overflow-hidden bg-white">
              <PdfLightbox
                trigger={
                  <img
                    src={cover}
                    alt={p.title || "PDF"}
                    className="w-full aspect-[4/3] object-cover cursor-pointer"
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
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Discussion</h2>
        <p className="text-sm text-muted-foreground">
          (Optional) Reuse your existing Feed post comments by creating a top-level <code>FeedPost</code> with <code>stack_id</code> and rendering the thread here.
        </p>
      </div>
    </div>
  );
}
