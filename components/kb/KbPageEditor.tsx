'use client';
import * as React from 'react';
import useSWR from 'swr';
import KbBlockRenderer from './KbBlockRenderer';

const fetcher = (u:string)=>fetch(u,{cache:'no-store'}).then(r=>r.json());

export default function KbPageEditor({ pageId }: { pageId: string }) {
  const { data, error, mutate } = useSWR(`/api/kb/pages/${pageId}`, fetcher);

  async function addBlock(type:string) {
    await fetch(`/api/kb/pages/${pageId}/blocks`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ type, data: defaultDataFor(type) })
    });
    mutate();
  }
  async function toggleLive(id:string, live:boolean) {
    await fetch(`/api/kb/blocks/${id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ live })
    });
    mutate();
  }
  async function snapshot() {
    await fetch(`/api/kb/pages/${pageId}/snapshot`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({}) });
    mutate();
  }

  if (error) return <div className="text-xs text-red-600">Failed to load page</div>;
  if (!data?.page) return <div className="text-xs text-neutral-500">Loading…</div>;

  const p = data.page as any;

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{p.title}</h1>
          <div className="text-[11px] text-slate-600">/kb/{p.spaceId}/{p.slug}</div>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="text-[12px] rounded border px-2 py-1"
            onChange={e => addBlock(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>+ block</option>
            <option value="text">text</option>
            <option value="image">image</option>
            <option value="link">link</option>
            <option value="claim">claim</option>
            <option value="argument">argument</option>
            <option value="sheet">sheet</option>
            <option value="room_summary">room summary</option>
            <option value="transport">transport</option>
          </select>
          <button className="rounded border px-2 py-1 text-[12px] hover:bg-slate-50" onClick={snapshot}>snapshot</button>
        </div>
      </header>

      <main className="space-y-3">
        {p.blocks.map((b:any) => (
          <section key={b.id} className="rounded border bg-white/70 p-2">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[11px] uppercase tracking-wide text-slate-600">{b.type}{!b.live && <span className="ml-2 px-1.5 py-[1px] rounded bg-amber-50 border border-amber-200 text-amber-700">pinned</span>}</div>
              <div className="text-[11px] flex items-center gap-2">
                <button className="underline" onClick={()=>toggleLive(b.id, !b.live)}>{b.live ? 'Pin (freeze)' : 'Unpin (live)'}</button>
                <button className="underline" onClick={async()=>{
                  await fetch(`/api/kb/blocks/${b.id}`, { method:'DELETE' });
                  mutate();
                }}>Delete</button>
              </div>
            </div>
            <KbBlockRenderer block={b} />
          </section>
        ))}
      </main>
    </div>
  );
}

function defaultDataFor(type:string){
  if (type==='text') return { markdown: 'Write here…' };
  if (type==='image') return { url:'', alt:'', caption:'' };
  if (type==='link')  return { url:'https://', title:'' };
  if (type==='claim') return { claimId:'', label:'Claim' };
  if (type==='argument') return { argumentId:'' };
  if (type==='room_summary') return { deliberationId:'', eval:{ mode:'product' }, lens:'top' };
  if (type==='sheet') return { sheetId:'', lens:'mini' };
  if (type==='transport') return { fromId:'', toId:'', showProposals:true };
  return {};
}
