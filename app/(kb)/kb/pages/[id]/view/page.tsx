'use client';
import * as React from 'react';
import useSWR from 'swr';
import { KbBlockRenderer } from '@/components/kb/KbBlockRenderer';

const fetcher = (u:string) => fetch(u, { cache:'no-store' }).then(r => r.json());

export default function KbPageView({ params }: { params: { id: string } }) {
  const { data: meta } = useSWR(`/api/kb/pages/${params.id}`, fetcher);
  const { data: blk }  = useSWR(`/api/kb/pages/${params.id}/blocks`, fetcher);

  const [hydrated, setHydrated] = React.useState<any[]|null>(null);
  const [err, setErr] = React.useState<string|undefined>();

  // Batch transclude once both meta & blocks are ready
  React.useEffect(() => {
    (async () => {
      if (!meta?.page?.spaceId || !Array.isArray(blk?.blocks)) return;
      const items = blk.blocks.map((b:any) => toTranscludeItem(b));
      const res = await fetch('/api/kb/transclude', {
        method: 'POST', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          spaceId: meta.page.spaceId,
          eval: (meta.page.frontmatter?.eval ?? { mode:'product', imports:'off' }),
          at: null,
          items
        })
      });
      const j = await res.json();
      if (!res.ok || j?.error) { setErr(j?.error || `HTTP ${res.status}`); setHydrated(null); return; }
      setHydrated(j.items || []);
    })().catch(e => setErr(String(e)));
  }, [meta, blk]);

  if (!meta || !blk) return <div className="p-6 text-sm text-slate-600">Loading page…</div>;
  if (err) return <div className="p-6 text-sm text-rose-600">Failed to load: {err}</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">{meta.page.title}</h1>
        {!!meta.page.summary && <p className="text-slate-600">{meta.page.summary}</p>}
      </div>

      {/* Render blocks */}
      <div className="space-y-4">
        {(blk.blocks || []).map((b:any, i:number) => (
          <KbBlockRenderer key={b.id} block={b} hydrated={hydrated?.[i] ?? null} />
        ))}
      </div>
    </div>
  );
}

function toTranscludeItem(b: any) {
  // Minimal mapping; dataJson carries ids for structured blocks
  const d = b.dataJson || {};
  switch (b.type) {
    case 'text':         return { kind:'sheet', id:'noop' }; // placeholder; renderer uses raw md
    case 'claim':        return { kind:'claim', id: d.id, lens: d.lens ?? 'belpl', roomId: d.roomId };
    case 'argument':     return { kind:'argument', id: d.id, lens: d.lens ?? 'diagram' };
    case 'room_summary': return { kind:'room_summary', id: d.id, lens: d.lens ?? 'top_claims', limit: d.limit ?? 5 };
    case 'sheet':        return { kind:'sheet', id: d.id, lens: d.lens ?? 'nodes' };
    case 'transport':    return { kind:'transport', fromId: d.fromId, toId: d.toId, lens: d.lens ?? 'map' };
    default:             return { kind:'sheet', id:'noop' };
  }
}
