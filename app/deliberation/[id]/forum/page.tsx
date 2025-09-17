// app/deliberation/[id]/forum/page.tsx
import ForumLens from './ui/ForumLens';
export default function Page({ params }:{ params:{ id:string }}) {
  return <ForumLens deliberationId={params.id} />;
}

// app/deliberation/[id]/forum/ui/ForumLens.tsx
"use client";
import useSWR from 'swr';
export default function ForumLens({ deliberationId }:{ deliberationId:string }) {
  const { data } = useSWR(`/api/dialogue/moves?deliberationId=${deliberationId}`, (u)=>fetch(u).then(r=>r.json()));
  const moves = data?.items ?? [];
  // naive: render ASSERT as roots, WHY/GROUNDS threaded by childSuffix/locusPath if present.
  return (
    <div className="p-3 space-y-3">
      {moves.map((m:any)=>(
        <div key={m.id} className="rounded border bg-white/70 p-2">
          <div className="text-[11px] text-slate-500">{m.kind} · {m.actorId}</div>
          <div className="text-sm">{m.payload?.text || m.payload?.brief || m.payload?.note || ''}</div>
        </div>
      ))}
    </div>
  );
}
