'use client';
import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import ArgumentPopout from './ArgumentPopout';

function parseDelibId(sheetId:string){ return sheetId.startsWith('delib:') ? sheetId.slice(6) : null; }


export default function DebateSheetReader({ sheetId }: { sheetId: string }) {
  const { data, error } = useSWR(`/api/sheets/${sheetId}`, r => fetch(r).then(x => x.json()), { refreshInterval: 0 });
  const delibId = parseDelibId(sheetId);

  const { data: ev } = useSWR(delibId ? `/api/deliberations/${delibId}/evidential?mode=product&includeContributors=1` : null,
    r => fetch(r).then(x=>x.json()));
  const scoreBy = useMemo(()=> {
    const m = new Map<string, {score:number; list:any[]}>();
    (ev?.items || []).forEach((it:any)=> m.set(it.claimId, { score: it.score, list: it.contributors || [] }));
    return m;
  }, [ev]);

  const [openNodeId, setOpenNodeId] = useState<string | null>(null);


  if (error) return <div className="text-xs text-red-600">Failed to load sheet</div>;
  if (!data?.sheet) return <div className="text-xs text-neutral-500">Loading…</div>;

  const { nodes, edges, acceptance, unresolved, loci, title } = data.sheet;
  return (
    <div className="border rounded-xl p-3 bg-slate-50 flex flex-col flex-wrap w-full gap-4">
      <aside className="space-y-3">
        <h2 className="font-semibold">{title}</h2>
        <div className="text-xs">Semantics: {acceptance.semantics}</div>
        <div className="space-y-1">
          {loci.map((l:any) => (
            <div key={l.id} className="flex items-center justify-between text-xs border rounded px-2 py-1">
              <span>Locus {l.locusPath}</span>
              <Badge variant={l.open ? 'default' : 'secondary'}>{l.open ? (l.closable ? 'closable' : 'open') : 'closed'}</Badge>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <div className="text-xs font-medium mb-1">Unresolved CQs</div>
          <ul className="text-xs space-y-1">
            {unresolved.map((u:any) => <li key={`${u.nodeId}:${u.cqKey}`}>• {u.nodeId} — {u.cqKey}</li>)}
          </ul>
        </div>
      </aside>

      <main className="space-y-3">
        <div className="rounded border p-2">
          <div className="text-xs text-neutral-600 mb-2">Debate graph</div>
          <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
            {nodes.map((n:any) => {
              const label = acceptance.labels[n.id] ?? 'undecided';
              return (
                <li key={n.id} className="border rounded p-2">
                    
               
                  <div className="mt-2 text-xs flex gap-2">
                    <button className="underline" onClick={() => setOpenNodeId(n.id)} disabled={!n.diagramId}>Expand</button>
                    <span className="text-neutral-500">Edges: {edges.filter((e:any)=>e.fromId===n.id || e.toId===n.id).length}</span>
                  </div>
                     <div className="flex flex-col gap-2">
                    <div className="font-medium text-xs">{n.title ?? n.id}</div>
                    <Badge className=' w-fit' variant={label.includes('accepted') ? 'secondary' : label === 'rejected' ? 'destructive' : 'outline'}>{label}</Badge>
                  </div>
           
                  {/* support bar */}
{scoreBy.has(n.id) && (
  <div className="mt-2">
    <div className="h-1.5 bg-slate-200 rounded">
      <div className="h-1.5 bg-emerald-500 rounded" style={{ width: `${Math.round((scoreBy.get(n.id)!.score || 0)*100)}%` }} />
    </div>
    <div className="mt-1 flex flex-wrap gap-1">
      {(scoreBy.get(n.id)!.list || []).slice(0,4).map((c:any)=>(
        <span key={c.argumentId} className="px-1.5 py-[1px] rounded bg-emerald-50 text-[10px] text-emerald-700">
          {Math.round(c.chainStrength*100)}% · {c.text?.slice(0,40) || c.argumentId.slice(0,6)+'…'}
        </span>
      ))}
    </div>
  </div>
)}
                </li>
              );
            })}
          </ul>
        </div>
<div className='fixed top-[200px] left-0'>
        {openNodeId && (
          <ArgumentPopout node={nodes.find((n:any)=>n.id===openNodeId)} onClose={() => setOpenNodeId(null)} />
        )}
        </div>
      </main>
    </div>
  );
}
