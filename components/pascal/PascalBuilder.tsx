'use client';
import * as React from 'react';
import useSWR from 'swr';

const fetcher = (u:string) => fetch(u, { cache:'no-store' }).then(r=>r.json());

export default function PascalBuilder({ workId, onSaved }:{ workId: string; onSaved?: ()=>void }) {
  const { data, mutate, isLoading } = useSWR<{ok:boolean; pascal:any}>(`/api/works/${workId}/pascal`, fetcher, { revalidateOnFocus:false });
  const [local, setLocal] = React.useState<any>(null);
  React.useEffect(()=>{ if (data?.pascal) setLocal(structuredClone(data.pascal)); }, [data]);

  if (isLoading || !local) return <div className="text-xs text-neutral-500">Loading Pascal model…</div>;

  const set = (k:string, v:any) => setLocal((p:any)=>({ ...p, [k]: v }));
  const propositions = local.propositions || [];
  const actions = local.actions || [];
  const utilities = local.utilities || {};

  const setU = (aId:string, wId:string, val:number) => {
    const u = { ...(utilities || {}) };
    u[aId] = { ...(u[aId] || {}), [wId]: val };
    set('utilities', u);
  };

  return (
    <div className="rounded border p-3 space-y-3">
      <div className="text-sm font-medium">Pascal (as‑if) builder</div>

      <label className="block text-xs text-neutral-600">Assumption / note</label>
      <input className="w-full border rounded px-2 py-1 text-sm"
             value={local.assumption ?? ''} onChange={e=>set('assumption', e.target.value)} />

      {/* Worlds / propositions */}
      <div>
        <div className="text-xs font-medium mb-1">Propositions (worlds)</div>
        <KVList items={propositions} onChange={(v)=>set('propositions', v)} keyName="statement" label="statement" />
      </div>

      {/* Actions */}
      <div>
        <div className="text-xs font-medium mb-1">Actions</div>
        <KVList items={actions} onChange={(v)=>set('actions', v)} keyName="label" label="label" />
      </div>

      {/* Utilities matrix */}
      <div className="overflow-x-auto">
        <table className="min-w-[520px] border text-sm">
          <thead>
            <tr>
              <th className="border px-2 py-1 text-left">Action \\ World</th>
              {propositions.map((w:any)=><th key={w.id} className="border px-2 py-1">{w.statement || w.id}</th>)}
            </tr>
          </thead>
          <tbody>
            {actions.map((a:any)=>(
              <tr key={a.id}>
                <td className="border px-2 py-1 font-medium">{a.label || a.id}</td>
                {propositions.map((w:any)=>(
                  <td key={w.id} className="border px-1 py-1">
                    <input type="number" className="w-24 border rounded px-1 py-0.5"
                           value={Number(utilities?.[a.id]?.[w.id] ?? 0)}
                           onChange={e=>setU(a.id, w.id, Number(e.target.value))} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-[11px] text-neutral-500 mt-1">EU computed server‑side with uniform priors.</div>
      </div>

      <div className="flex gap-2">
        <button className="px-3 py-1 text-sm rounded border"
                onClick={async ()=>{
                  const res = await fetch(`/api/works/${workId}/pascal`, {
                    method: 'PUT',
                    headers: { 'Content-Type':'application/json' },
                    body: JSON.stringify({
                      assumption: local.assumption || undefined,
                      propositions,
                      actions,
                      utilities,
                    }),
                  });
                  if (!res.ok) { alert('Save failed'); return; }
                  await mutate();
                  onSaved?.();
                }}>
          Save Pascal model
        </button>
      </div>

      {local.decision?.bestActionId && (
        <div className="rounded bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 text-sm">
          Decision: <b>{actions.find((a:any)=>a.id===local.decision.bestActionId)?.label ?? local.decision.bestActionId}</b>
        </div>
      )}
    </div>
  );
}

function KVList({ items, onChange, keyName, label }:{
  items:any[]; onChange:(v:any[])=>void; keyName:string; label:string;
}) {
  const add = () => onChange([...(items||[]), { id: crypto.randomUUID(), [keyName]: '' }]);
  const del = (i:number) => onChange(items.filter((_:any,idx:number)=>idx!==i));
  const upd = (i:number, v:string) => onChange(items.map((it:any,idx:number)=> idx===i ? ({ ...it, [keyName]: v }) : it));
  return (
    <div className="space-y-2">
      {(items||[]).map((it:any,i:number)=>(
        <div key={it.id || i} className="flex gap-2">
          <input className="flex-1 border rounded px-2 py-1 text-sm"
                 placeholder={label} value={it[keyName] ?? ''} onChange={e=>upd(i,e.target.value)} />
          <button className="px-2 py-1 text-[11px] rounded border" onClick={()=>del(i)}>Remove</button>
        </div>
      ))}
      <button className="px-2 py-1 text-[11px] rounded border" onClick={add}>Add</button>
    </div>
  );
}
