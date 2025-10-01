"use client";
import useSWR from "swr";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import ArgumentPopout from "./ArgumentPopout";

type EvNode = {
  id: string; // claimId
  diagramId: string | null; // concluding argument id for this claim (when present)
  text?: string;
  score: number; // support for the claim
  top: { argumentId: string; score: number }[];
};
type EvResp = {
  ok: boolean;
  deliberationId: string;
  mode: "min" | "product";
  nodes: EvNode[];
  arguments: { id: string; text?: string }[];
  meta: any;
};

export default function DebateSheetReader({ sheetId }: { sheetId: string }) {
  const { data, error } = useSWR(
    `/api/sheets/${sheetId}`,
    r => fetch(r).then(x => x.json()),
    { refreshInterval: 0 }
  );

  const [mode, setMode] = useState<"product" | "min" | "ds">("product");
  const [openNodeId, setOpenNodeId] = useState<string | null>(null);
  const [showArgsFor, setShowArgsFor] = useState<string | null>(null); // claimId

  const delibId = useMemo(() => {
    return data?.sheet?.deliberationId
      ?? (sheetId.startsWith("delib:") ? sheetId.slice("delib:".length) : null);
  }, [data?.sheet?.deliberationId, sheetId]);

  const { data: ev, mutate: refreshEv } = useSWR<EvResp>(
    delibId ? `/api/deliberations/${delibId}/evidential?mode=${mode === 'ds' ? 'product' : mode}` : null,
    (u) => fetch(u, { cache: 'no-store' }).then(r => r.json())
  );

  // Build quick lookup maps from ev.nodes
  const supportByClaim = useMemo(() => {
    const m = new Map<string, number>();
    (ev?.nodes ?? []).forEach(n => m.set(n.id, n.score));
    return m;
  }, [ev]);

  const topByClaim = useMemo(() => {
    const m = new Map<string, { argumentId: string; score: number }[]>();
    (ev?.nodes ?? []).forEach(n => m.set(n.id, n.top ?? []));
    return m;
  }, [ev]);

  if (error) return <div className="text-xs text-red-600">Failed to load sheet</div>;
  if (!data?.sheet) return <div className="text-xs text-neutral-500">Loading…</div>;

  const { nodes, edges, acceptance, unresolved, loci, title } = data.sheet;

  const argText = (id: string) => ev?.arguments?.find(a => a.id === id)?.text;

  const supportOfClaimId = (claimId?: string|null) =>
    (claimId && supportByClaim.has(claimId)) ? supportByClaim.get(claimId)! : undefined;

  return (
    <div className="border rounded-xl p-3 bg-slate-50 flex flex-col flex-wrap w-full gap-4">
      <aside className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{title}</h2>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-neutral-600">Confidence</label>
            <select
              className="menuv2--lite rounded px-2 py-1 text-[12px]"
              value={mode}
              onChange={e=>{ setMode(e.target.value as any); refreshEv(); }}
            >
              <option value="min">weakest‑link (min)</option>
              <option value="product">independent (product)</option>
              <option value="ds">DS (β/π) — (UI only for now)</option>
            </select>
          </div>
        </div>

        <div className="text-xs">Semantics: {acceptance.semantics}</div>

        <div className="space-y-1">
          {loci.map((l:any) => (
            <div key={l.id} className="flex items-center justify-between text-xs border rounded px-2 py-1">
              <span>Locus {l.locusPath}</span>
              <Badge variant={l.open ? 'default' : 'secondary'}>
                {l.open ? (l.closable ? 'closable' : 'open') : 'closed'}
              </Badge>
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
              const s = supportOfClaimId(n.claimId);
              return (
                <li key={n.id} className="border rounded p-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{n.title ?? n.id}</div>
                    <Badge
                      variant={
                        label === 'accepted'
                          ? 'secondary'
                          : label === 'rejected'
                            ? 'destructive'
                            : 'outline'
                      }
                      className="text-[10px]"
                    >
                      {label}
                    </Badge>
                  </div>

                  {typeof s === 'number' && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[11px] text-neutral-600 mb-0.5">
                        <span>Support</span>
                        <span>{(s*100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-neutral-200 rounded">
                        <div className="h-1.5 rounded bg-emerald-500 transition-all"
                             style={{ width: `${Math.max(0,Math.min(1,s))*100}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="mt-2 text-xs flex gap-3">
                    <button className="underline" onClick={() => setOpenNodeId(n.id)} disabled={!n.diagramId}>Expand</button>
                    {n.claimId && (
                      <button className="underline" onClick={() => setShowArgsFor(n.claimId)}>
                        View contributing arguments
                      </button>
                    )}
                    <span className="text-neutral-500">
                      Edges: {edges.filter((e:any)=>e.fromId===n.id || e.toId===n.id).length}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {openNodeId && (
          <ArgumentPopout node={nodes.find((nn:any)=>nn.id===openNodeId)} onClose={() => setOpenNodeId(null)} />
        )}

        {showArgsFor && (
          <div className="rounded border p-3 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Contributing arguments (I → φ)</div>
              <button className="text-xs underline" onClick={()=>setShowArgsFor(null)}>Close</button>
            </div>
            <p className="text-[11px] text-neutral-600 mb-2">
              Mode: <code>{mode}</code>. These are the lines of support accrued by ∨ for this claim.
            </p>
            <ul className="space-y-2 text-sm">
              {(topByClaim.get(showArgsFor) ?? []).map((c) => (
                <li key={c.argumentId} className="p-2 border rounded flex items-center justify-between">
                  <div className="truncate">
                    {argText(c.argumentId) ?? `Argument ${c.argumentId.slice(0,8)}…`}
                  </div>
                  <div className="text-[11px] tabular-nums">{Math.round(c.score*100)}%</div>
                </li>
              ))}
              {!(topByClaim.get(showArgsFor)?.length) && (
                <li className="text-xs text-neutral-600">No atomic supports recorded yet.</li>
              )}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
