'use client';
import useSWR from 'swr';
const f=(u:string)=>fetch(u,{cache:'no-store'}).then(r=>r.json());
export default function SpaceHome({ params }:{ params:{ spaceId:string }}) {
  const { data } = useSWR(`/api/kb/pages?space=${params.spaceId}`, f);
  if (!data?.pages) return <div className="text-xs text-neutral-500 p-4">Loading…</div>;
  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-lg font-semibold mb-3">Pages</h1>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.pages.map((p:any)=>(
          <li key={p.id} className="rounded border bg-white/70 p-3">
            <div className="text-sm font-medium truncate">{p.title}</div>
            <div className="text-[11px] text-slate-600">tags: {(p.tags||[]).join(', ') || '—'}</div>
            <div className="mt-2">
              <a className="text-[12px] underline" href={`/kb/pages/${p.id}`}>open</a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
