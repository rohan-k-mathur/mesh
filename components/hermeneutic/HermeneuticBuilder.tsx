'use client';
import * as React from 'react';
import useSWR from 'swr';

const fetcher = (u:string) => fetch(u, { cache:'no-store' }).then(r=>r.json());

export default function HermeneuticBuilder({
  workId,
  onSaved,
}: { workId: string; onSaved?: () => void }) {
  const { data, mutate, isLoading } = useSWR<{ok:boolean; hermeneutic:any}>(`/api/works/${workId}/hermeneutic`, fetcher, { revalidateOnFocus: false });
  const [local, setLocal] = React.useState<any>(null);
  React.useEffect(()=>{ if (data?.hermeneutic) setLocal(structuredClone(data.hermeneutic)); }, [data]);

  if (isLoading || !local) return <div className="text-xs text-neutral-500">Loading hermeneutic…</div>;

  const set = (k:string, v:any) => setLocal((prev:any)=>({ ...prev, [k]: v }));

  return (
    <div className="rounded border p-3 space-y-3">
      <div className="text-sm font-medium">Hermeneutic (interpretive) builder</div>

      <div>
        <label className="block text-xs text-neutral-600">Corpus / practice URL</label>
        <input className="w-full border rounded px-2 py-1 text-sm"
               value={local.corpusUrl ?? ''} onChange={e=>set('corpusUrl', e.target.value)} />
      </div>

      {/* Facts */}
      <section>
        <div className="text-xs font-medium mb-1">Facts</div>
        <ListEditor items={local.facts} onChange={(v)=>set('facts', v)}
          emptyItem={() => ({ id: crypto.randomUUID(), text:'', source:'', justification:'INTERPRETIVE' })}/>
      </section>

      {/* Hypotheses + plausibility */}
      <section>
        <div className="text-xs font-medium mb-1">Hypotheses</div>
        <ListEditor items={local.hypotheses} onChange={(v)=>set('hypotheses', v)}
          emptyItem={() => ({ id: crypto.randomUUID(), text:'', notes:'' })}/>
        <div className="mt-2">
          <div className="text-xs font-medium">Plausibility (0–1)</div>
          {local.hypotheses?.map((h:any) => {
            const current = (local.plausibility || []).find((p:any)=>p.hypothesisId===h.id)?.score ?? 0;
            return (
              <div key={h.id} className="flex items-center gap-2 py-1">
                <span className="text-xs w-40 truncate">{h.text || h.id}</span>
                <input type="range" min={0} max={1} step={0.05} value={current}
                       onChange={e=>{
                         const s = Number(e.target.value);
                         const arr = [...(local.plausibility || [])];
                         const idx = arr.findIndex((p:any)=>p.hypothesisId===h.id);
                         if (idx>=0) arr[idx] = { hypothesisId: h.id, score: s }; else arr.push({ hypothesisId: h.id, score: s });
                         set('plausibility', arr);
                       }}/>
                <span className="text-[11px] w-10 text-right">{current.toFixed(2)}</span>
                <label className="text-[11px] ml-2">
                  <input type="checkbox"
                         checked={Array.isArray(local.selectedIds) && local.selectedIds.includes(h.id)}
                         onChange={(e)=>{
                           const ids = new Set(local.selectedIds || []);
                           e.target.checked ? ids.add(h.id) : ids.delete(h.id);
                           set('selectedIds', Array.from(ids));
                         }} />
                  <span className="ml-1">Select piece</span>
                </label>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex gap-2">
        <button className="px-3 py-1 text-sm rounded border"
                onClick={async ()=>{
                  const res = await fetch(`/api/works/${workId}/hermeneutic`, {
                    method: 'PUT',
                    headers: { 'Content-Type':'application/json' },
                    body: JSON.stringify({
                      corpusUrl: local.corpusUrl || undefined,
                      facts: local.facts || [],
                      hypotheses: local.hypotheses || [],
                      plausibility: local.plausibility || [],
                      selectedIds: local.selectedIds || [],
                    }),
                  });
                  if (!res.ok) { alert('Save failed'); return; }
                  await mutate();
                  onSaved?.();
                }}>
          Save hermeneutic
        </button>
      </div>
    </div>
  );
}

function ListEditor({ items, onChange, emptyItem }:{
  items: any[]; onChange:(v:any[])=>void; emptyItem:()=>any;
}) {
  const add = () => onChange([...(items||[]), emptyItem()]);
  const del = (i:number) => onChange(items.filter((_:any,idx:number)=>idx!==i));
  const upd = (i:number, k:string, v:any) => {
    const arr = items.map((it:any, idx:number)=> idx===i ? ({ ...it, [k]: v }) : it);
    onChange(arr);
  };
  return (
    <div className="space-y-2">
      {(items||[]).map((it:any, i:number)=>(
        <div key={it.id || i} className="grid grid-cols-12 gap-2">
          <input className="col-span-7 border rounded px-2 py-1 text-sm" placeholder="text"
                 value={it.text ?? ''} onChange={e=>upd(i,'text',e.target.value)} />
          {'source' in it &&
            <input className="col-span-3 border rounded px-2 py-1 text-sm" placeholder="source"
                   value={it.source ?? ''} onChange={e=>upd(i,'source',e.target.value)} />}
          {'justification' in it &&
            <select className="col-span-2 border rounded px-2 py-1 text-sm"
                    value={it.justification ?? 'INTERPRETIVE'}
                    onChange={e=>upd(i,'justification',e.target.value)}>
              <option>INTERPRETIVE</option>
              <option>PERCEPTION</option>
              <option>INSTRUMENT</option>
              <option>TESTIMONY</option>
            </select>}
          <div className="col-span-12">
            {'notes' in it &&
              <input className="w-full border rounded px-2 py-1 text-sm" placeholder="notes"
                     value={it.notes ?? ''} onChange={e=>upd(i,'notes',e.target.value)} />}
          </div>
          <div className="col-span-12">
            <button className="px-2 py-1 text-[11px] rounded border" onClick={()=>del(i)}>Remove</button>
          </div>
        </div>
      ))}
      <button className="px-2 py-1 text-[11px] rounded border" onClick={add}>Add</button>
    </div>
  );
}
