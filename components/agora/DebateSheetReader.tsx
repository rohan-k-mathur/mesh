"use client";
import useSWR from "swr";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import ArgumentPopout from "./ArgumentPopout";

export default function DebateSheetReader({ sheetId }: { sheetId: string }) {
  const { data, error } = useSWR(
    `/api/sheets/${sheetId}`,
    r => fetch(r).then(x => x.json()),
    { refreshInterval: 0 }
  );

  // 1) Define mode BEFORE using it in SWR below
  const [mode, setMode] = useState<"product" | "min">("product");
  const [openNodeId, setOpenNodeId] = useState<string | null>(null);

  // Prefer server-provided deliberationId; fallback to "delib:<id>" prefix
  const delibId = useMemo(() => {
    return data?.sheet?.deliberationId
      ?? (sheetId.startsWith("delib:") ? sheetId.slice("delib:".length) : null);
  }, [data?.sheet?.deliberationId, sheetId]);

  // Evidential scores (claim-level, bridged via diagramId=concluding argument id)
  type EvNode = { id: string; diagramId: string | null; score: number; top: { argumentId: string; score: number }[] };
  type EvResp = { nodes: EvNode[]; arguments: { id: string; text?: string }[] };

  const { data: ev } = useSWR<EvResp>(
    () => (delibId ? `/api/deliberations/${delibId}/evidential?mode=${mode}` : null),
    u => fetch(u).then(r => r.json()),
    { refreshInterval: 0 }
  );

  // 2) Build TWO maps: by argumentId (preferred) and by claimId (fallback)
  const evByArg = useMemo(() => {
    const m = new Map<string, { score: number; top: { argumentId: string; score: number }[] }>();
    if (ev?.nodes) for (const n of ev.nodes) {
      const argKey = n.diagramId ?? undefined; // argument id when known
      if (argKey) m.set(argKey, { score: n.score, top: n.top });
    }
    return m;
  }, [ev]);

  const evByClaim = useMemo(() => {
    const m = new Map<string, { score: number; top: { argumentId: string; score: number }[] }>();
    if (ev?.nodes) for (const n of ev.nodes) {
      m.set(n.id, { score: n.score, top: n.top }); // n.id is claimId
    }
    return m;
  }, [ev]);

  if (error) return <div className="text-xs text-red-600">Failed to load sheet</div>;
  if (!data?.sheet) return <div className="text-xs text-neutral-500">Loading…</div>;

  const { nodes, edges, acceptance, unresolved, loci, title } = data.sheet;

  return (
    <div className="border rounded-xl p-3 bg-slate-50 flex flex-col flex-wrap w-full gap-4">
      <aside className="space-y-3">
        <h2 className="font-semibold">{title}</h2>
        <div className="text-xs flex items-center gap-2">
          <span>Semantics: {acceptance.semantics}</span>
          {delibId && (
            <>
              <span className="text-neutral-500">•</span>
              <label className="flex items-center gap-1">
                Confidence:
                <select
                  className="text-xs menuv2--lite rounded px-2 py-[2px]"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as any)}
                >
                  <option value="product">Product</option>
                  <option value="min">Min</option>
                </select>
              </label>
            </>
          )}
        </div>

        <div className="space-y-1">
          {loci.map((l: any) => (
            <div key={l.id} className="flex items-center justify-between text-xs border rounded px-2 py-1">
              <span>Locus {l.locusPath}</span>
              <Badge variant={l.open ? "default" : "secondary"}>
                {l.open ? (l.closable ? "closable" : "open") : "closed"}
              </Badge>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <div className="text-xs font-medium mb-1">Unresolved CQs</div>
          <ul className="text-xs space-y-1">
            {unresolved.map((u: any) => (
              <li key={`${u.nodeId}:${u.cqKey}`}>• {u.nodeId} — {u.cqKey}</li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="space-y-3">
        <div className="rounded border p-2">
          <div className="text-xs text-neutral-600 mb-2">Debate graph</div>

          <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
            {nodes.map((n: any) => {
              const label = acceptance.labels[n.id] ?? "undecided";

              // 3) Prefer argument id (node.id or node.diagramId), else fall back to claimId
              const evEntry =
                evByArg.get(n.diagramId ?? n.id) ??
                (n.claimId ? evByClaim.get(n.claimId) : undefined);

              const s = evEntry?.score; // undefined if no score for this node
              const contributors = evEntry?.top ?? [];

              return (
                <li key={n.id} className="border rounded px-2 py-1">
                  <div className="my-1 text-xs flex gap-2">
                    <div className="font-medium truncate">{n.title ?? n.id}</div>
                  </div>

                  <div className="flex flex-col gap-2 my-2">
                    <Badge
                      className="text-[10px] w-fit"
                      variant={
                        label.includes("accepted")
                          ? "secondary"
                          : label === "rejected"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {label}
                    </Badge>
                  </div>

                  {/* Support bar only when we actually have a score */}
                  {s !== undefined && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[11px] text-neutral-600">
                        <span>Support</span><span>{Math.round(s * 100)}%</span>
                      </div>
                      <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div className="h-2 bg-emerald-500" style={{ width: `${Math.round(s * 100)}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Contributors */}
                  {!!contributors.length && (
                    <div className="mt-2">
                      <div className="text-[11px] text-neutral-600 mb-1">Top arguments</div>
                      <ul className="space-y-1">
                        {contributors.map((c) => (
                          <li key={c.argumentId} className="text-[11px] flex items-center justify-between">
                            <span className="truncate">
                              {ev?.arguments?.find((a:any)=>a.id===c.argumentId)?.text ?? `arg:${c.argumentId.slice(0,6)}…`}
                            </span>
                            <span className="tabular-nums">{Math.round(c.score * 100)}%</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="my-1 text-xs flex gap-2">
                    <button className="underline" onClick={() => setOpenNodeId(n.id)} disabled={!n.diagramId}>
                      Expand
                    </button>
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
          <div className="fixed top-[200px] left-0">
            <ArgumentPopout
              node={nodes.find((n: any) => n.id === openNodeId)}
              onClose={() => setOpenNodeId(null)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
