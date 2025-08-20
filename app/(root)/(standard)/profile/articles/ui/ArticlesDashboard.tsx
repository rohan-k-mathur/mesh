"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
type Item = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
  heroImageKey: string | null;
  template: string;
};

export default function ArticlesDashboard({
  initialItems,
}: {
  initialItems: Item[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initialItems);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | "DRAFT" | "PUBLISHED">("ALL");
  const [view, setView] = useState<"active" | "trash">("active");
  const [template, setTemplate] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isPending, startTransition] = useTransition();
  const [total, setTotal] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const base = items
      .filter((i) => (status === "ALL" ? true : i.status === status))
      .filter((i) => (template === "ALL" ? true : i.template === template));
    if (!q.trim()) return base;
    const qq = q.toLowerCase();
    return base.filter(
      (i) =>
        i.title.toLowerCase().includes(qq) || i.slug.toLowerCase().includes(qq)
    );
  }, [items, q, status, template]);


  async function refresh() {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      q,
      view,
      sort: 'updatedAt:desc',
      ...(status === 'ALL' ? {} : { status }),
      ...(template === 'ALL' ? {} : { template }),
    })
    const res = await fetch(`/api/articles?${params.toString()}`, { cache: 'no-store' })
    if (!res.ok) return
    const json = await res.json()
    setItems(json.items)
    setTotal(json.total)
  }


  async function createNew() {
    router.push("/article/new");
  }

  async function rename(id: string, title: string) {
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, title } : i)));
    toast.success("Title updated");
    await fetch(`/api/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  }


  async function remove(id: string) {
    if (!confirm('Move to Trash?')) return
    setItems(cur => cur.filter(i => i.id !== id))
    toast.success('Moved to Trash')
    await fetch(`/api/articles/${id}`, { method: 'DELETE' })
    startTransition(refresh)
  }

  async function restore(id: string) {
    toast.loading('Restoring…', { id })
    await fetch(`/api/articles/${id}/restore`, { method: 'POST' })
    toast.success('Restored', { id })
    startTransition(refresh)
  }

  function viewArticle(i: Item) {
    router.push(`/article/${i.slug}`)
  }


  function edit(i: Item) {
    router.push(`/article/by-id/${i.id}/edit`)
  }
  function copyLink(i: Item) {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    navigator.clipboard.writeText(`${origin}/article/${i.slug}`)
    toast.success('Link copied')
  }
  // trigger refresh on filter/paginate change
  // (keep this simple; could use useEffect)
  async function onPageChange(next: number) {
    setPage(next)
    startTransition(refresh)
  }

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6 mt-[-3rem] custom-scrollbar">
      <div className="flex items-center px-4 justify-between gap-3 ">
        <div className="text-[1.8rem] text-slate-800  font-semibold">Your Articles</div>
        <button
          onClick={createNew}
          className="px-3  py-1.5 rounded-xl bg-amber-300 lockbutton text-black text-sm"
        >
          New article
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center px-2">
                <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search..."
          className="border-[1px] border-indigo-300/80 rounded-xl w-[40%]  articlesearchfield px-2 py-[5px] text-sm"
        />
        <select
          className="border-[1px] border-indigo-300/80 rounded px-2 py-1.5 rounded-xl text-sm selectfield"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
        >
          <option value="ALL">All</option>
          <option value="DRAFT">Drafts</option>
          <option value="PUBLISHED">Published</option>
        </select>
 

<select className="border-[1px] border-indigo-300/80 rounded-xl px-2 py-1.5 text-sm selectfield " value={template} onChange={e => setTemplate(e.target.value)}>
          <option value="ALL">All Templates</option>
          <option value="standard">Standard</option>
          <option value="feature">Feature</option>
          {/* add more templates if you have them */}
        </select>

        <div className="ml-auto flex items-center gap-3">
        {isPending && <span className="text-sm text-neutral-500">Loading…</span>}

          <button className={`px-2 py-0 lockbutton  rounded-xl text-[.9rem] ${view==='active'?'px-2  border rounded text-[.9rem] bg-neutral-100':'px-2  border rounded text-[.9rem] bg-neutral-50/30'}`} onClick={() => { setView('active'); setPage(1); startTransition(refresh) }}>Active</button>
          <button className={`px-2 py-0 lockbutton  rounded-xl text-[.9rem]${view==='trash'?'px-2  border rounded text-[.9rem] bg-neutral-100':'px-2  border rounded text-[.9rem] bg-neutral-50/30'}`} onClick={() => { setView('trash'); setPage(1); startTransition(refresh) }}>Archived</button>
        </div>
      </div>



      <div className="overflow-x-auto rounded-xl px-1 border-[1px] border-transparent  bg-white/30 backdrop-blur-lg   editor-shadow">
        <table className="min-w-full text-sm">
          {/* <thead className="bg-neutral-50  text-neutral-600">
            <tr>
              <th className="text-left px-5 py-2">Title</th>
              <th className="text-left px-5 py-2">Status</th>
              <th className="text-left px-5 py-2">Updated</th>
              <th className="text-left px-[10rem] py-2">Actions</th>
            </tr>
          </thead> */}

          <tbody>
            {filtered.map((i) => (
  

              <tr key={i.id} className="border-t-0 border-b-[1px]   border-slate-400 rounded-xl">
                <td className="align-center py-4  px-4 my-auto text-[1.0rem] leading-none tracking-wide font-light">
                  <InlineTitle
                    initial={i.title}
                    onSave={t => rename(i.id, t)}
                  />
                </td>
                
                <td className="px-1 text-center py-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      i.status === "PUBLISHED"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {i.status.toLowerCase()}
                  </span>
                </td>
                <td className="px-5 text-center py-2 text-neutral-600">
                  {new Date(i.updatedAt).toLocaleString()}
                </td>
                <td className="px-3 py-2">

                   <div className="flex items-center gap-2 justify-end px-2">
                    {view === 'trash' ? (
                      <>
                        <button className="px-2 py-1 border rounded" onClick={() => restore(i.id)}>Restore</button>
                        <button className="px-2 py-1 border rounded text-red-600" onClick={() => fetch(`/api/articles/${i.id}?hard=1`, { method: 'DELETE' }).then(() => { toast.success('Deleted'); startTransition(refresh) })}>Delete forever</button>
                      </>
                    ) : (
                      <>
                        <button className="px-2 py-.5 bg-white/30  rounded-xl savebutton" onClick={() => edit(i)}>Edit</button>
                        <button className="px-2 py-.5 bg-white/30  rounded-xl savebutton" onClick={() => viewArticle(i)}>View</button>
                        <button className="px-2 py-.5 bg-white/30  rounded-xl savebutton" onClick={() => copyLink(i)}>Copy link</button>
                        <button className="px-2 py-.5 bg-white/30  rounded-xl text-red-600 savebutton" onClick={() => remove(i.id)}>Delete</button>
                      </>
                    )}
                  </div>

                </td>

              </tr>
                   

            ))}
            {!filtered.length && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-10 text-center text-neutral-500"
                >
                  No articles found.
                </td>
              </tr>
            )}
            
          </tbody>

        </table>
        
      </div>
      <div className="flex items-center px-4 justify-between text-sm">
        <div>{total !== null ? `Total: ${total}` : ''}</div>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1  rounded bg-white/70 lockbutton" disabled={page<=1} onClick={() => onPageChange(page-1)}>Prev</button>
          <span>Page {page}</span>
          <button className="px-2 py-1  rounded bg-white/70 lockbutton" onClick={() => onPageChange(page+1)}>Next</button>
        </div>
        </div>
    </div>
  );
}

function InlineTitle({ initial, onSave }: { initial: string; onSave: (t: string) => void }) {
    const [val, setVal] = useState(initial)
    return (
      <input
        className="w-full  outline-none bg-transparent"
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => { if (val.trim() && val !== initial) onSave(val.trim()) }}
        onKeyDown={e => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur() }}
      />
    )
  }