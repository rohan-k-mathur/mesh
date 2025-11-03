// DebateSheetReader.tsx

"use client";
import useSWR from "swr";
import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ArgumentPopout from "./ArgumentPopout";
import React from "react";
import clsx from "clsx";
import { useConfidence } from "./useConfidence";
import { fetchClaimScores, ClaimScore } from '@/lib/client/evidential';
import { SupportBar } from "../evidence/SupportBar";
import { SchemeBadge } from "@/components/aif/SchemeBadge";
import { CQStatusIndicator } from "@/components/aif/CQStatusIndicator";
import { AttackBadge } from "@/components/aif/AttackBadge";
import { PreferenceBadge } from "@/components/aif/PreferenceBadge";
import { MiniNeighborhoodPreview } from "@/components/aif/MiniNeighborhoodPreview";
import { ArgumentActionsSheet } from "@/components/arguments/ArgumentActionsSheet";
import { Waypoints } from "lucide-react";
const fetcher = (url: string) => fetch(url).then((r) => r.json());

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
  mode: "min" | "product" | "ds";
  nodes: EvNode[];
  arguments: { id: string; text?: string }[];
  meta: any;
  support?: Record<string, number>;
  dsSupport?: Record<string, { bel:number; pl:number }>;
};


export function ClaimsPane({ deliberationId, claims }: { deliberationId: string; claims: { id: string; text: string }[] }) {
  const { mode, tau } = useConfidence();
  // DS mode is now supported by the API
  const { data: scores } = useSWR(
    () => claims?.length ? ['scores', deliberationId, mode, tau, claims.map(c=>c.id).join(',')] : null,
    async () => fetchClaimScores({ deliberationId, mode: mode as any, tau, claimIds: claims.map(c=>c.id) }),
    { revalidateOnFocus: false }
  );

  const byId = new Map<string, ClaimScore>((scores ?? []).map(s => [s.id, s]));
  const items = [...claims].map(c => ({ ...c, _s: byId.get(c.id) }));
  items.sort((a,b) => ((b._s?.score ?? b._s?.bel ?? 0) - (a._s?.score ?? a._s?.bel ?? 0)));

  return (
    <ul className="space-y-2">
      {items.map(c => {
        const s = c._s;
        const v = s?.score ?? s?.bel ?? 0;
        const upperBound = mode === 'ds' ? s?.pl : undefined;
        return (
          <li key={c.id} className="flex items-center gap-2">
            <span className="text-sm">{c.text}</span>
            <SupportBar 
              value={v} 
              upperBound={upperBound}
              mode={mode}
              claimId={c.id}
              deliberationId={deliberationId}
            />
            {s?.accepted && (
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700">
                Accepted
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function DebateSheetReader({ sheetId }: { sheetId: string }) {
  const { data, error } = useSWR(
    `/api/sheets/${sheetId}`,
    r => fetch(r).then(x => x.json()),
    { refreshInterval: 0 }
  );

// const [mode, setMode] = useState<"product"|"min"|"ds">("product");
const { mode, setMode } = useConfidence();

  // Read room default mode on mount (only sync once when sheet loads)
  const [hasSyncedRoomMode, setHasSyncedRoomMode] = React.useState(false);
  React.useEffect(() => {
    if (!data?.sheet?.rulesetJson || hasSyncedRoomMode) return;
    const roomMode = (data.sheet.rulesetJson as any)?.confidence?.mode;
    if (roomMode && roomMode !== mode) {
      setMode(roomMode);
      setHasSyncedRoomMode(true);
    }
  }, [data?.sheet?.rulesetJson, mode, setMode, hasSyncedRoomMode]);

  const [openNodeId, setOpenNodeId] = useState<string | null>(null);
  const [showArgsFor, setShowArgsFor] = useState<string | null>(null); // claimId
  
  // State for MiniNeighborhoodPreview modal (button-triggered)
  const [previewNodeId, setPreviewNodeId] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  
  // State for ArgumentActionsSheet modal
  const [actionsSheetOpen, setActionsSheetOpen] = useState(false);
  const [selectedArgumentForActions, setSelectedArgumentForActions] = useState<{
    id: string;
    text?: string;
    conclusionText?: string;
    schemeKey?: string;
  } | null>(null);

const [imports, setImports] = React.useState<'off'|'materialized'|'virtual'|'all'>('off');

  // Filter state
  const [filterScheme, setFilterScheme] = useState<string | null>(null);
  const [filterOpenCQs, setFilterOpenCQs] = useState(false);
  const [filterAttacked, setFilterAttacked] = useState(false);

  // inside DebateSheetReader
const isSynthetic = sheetId.startsWith('delib:');

// when mode changes:

React.useEffect(() => {
  if (isSynthetic) return;
  const sid = data?.sheet?.id ?? sheetId; // curated id
  fetch(`/api/sheets/${sid}/ruleset`, {
    method: 'PATCH',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ confidence: { mode } }),
  }).catch(()=>{ /* non-blocking */ });
}, [mode, isSynthetic, data?.sheet?.id, sheetId]);


  const delibId = useMemo(() => {
    return data?.sheet?.deliberationId
      ?? (sheetId.startsWith("delib:") ? sheetId.slice("delib:".length) : null);
  }, [data?.sheet?.deliberationId, sheetId]);

  // Fetch AIF metadata for all arguments in this deliberation
  const { data: aifData } = useSWR(
    delibId ? `/api/deliberations/${delibId}/arguments/aif?limit=100` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Build lookup map: argumentId -> aif metadata
  const aifByArgId = useMemo(() => {
    const m = new Map<string, any>();
    if (aifData?.items) {
      for (const item of aifData.items) {
        m.set(item.id, item.aif);
      }
    }
    return m;
  }, [aifData]);

  //  const [imports, setImports] = React.useState<'none'|'virtual'>('none');
  const { data: ev, mutate: refetchEv } = useSWR<EvResp>(
    delibId ? `/api/deliberations/${delibId}/evidential?mode=${mode}&imports=${imports}` : null,
    
  (u: string) => fetch(u, { cache:'no-store' }).then(r => r.json())
);

// const { data: ev } = useSWR<EvResp>(
//   delibId ? `/api/deliberations/${delibId}/evidential?mode=${mode}` : null,
//   (u) => fetch(u, { cache: 'no-store' }).then(r => r.json())
// );


// bar value helper
function barFor(claimId?: string|null) {
  if (!claimId || !ev) return null;
  if (mode === 'ds') {
    const pair = ev.dsSupport?.[claimId];
    return pair ? { kind:'ds', bel: pair.bel, pl: pair.pl } : null;
  }
  const s = ev.support?.[claimId];
  return typeof s === 'number' ? { kind:'scalar', s } : null;
}

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

  // Fetch neighborhood for previewed node (button-triggered)
  const previewedArgumentId = useMemo(() => {
    if (!previewNodeId) return null;
    const node = data?.sheet?.nodes?.find((n: any) => n.id === previewNodeId);
    return node?.argumentId || null;
  }, [previewNodeId, data?.sheet?.nodes]);

  const { data: neighborhoodData, error: neighborhoodError, isLoading: neighborhoodLoading } = useSWR(
    previewedArgumentId ? `/api/arguments/${previewedArgumentId}/aif-neighborhood?depth=1` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // Toggle preview modal for a node
  const togglePreview = (nodeId: string) => {
    setPreviewNodeId(nodeId);
    setPreviewModalOpen(true);
  };

  // Handle node click to open ArgumentActionsSheet
  const handleNodeClick = (node: any) => {
    if (!node.argumentId) return;
    
    try {
      const aif = aifByArgId?.get(node.argumentId);
      setSelectedArgumentForActions({
        id: node.argumentId,
        text: node.title || node.id,
        conclusionText: node.title || node.id,
        schemeKey: aif?.scheme?.key,
      });
      setActionsSheetOpen(true);
    } catch (error) {
      console.error("Error opening argument actions sheet:", error);
    }
  };

  // Get unique schemes for filter dropdown (must be before early returns)
  const availableSchemes = useMemo(() => {
    const schemes = new Set<string>();
    if (!aifData?.items) return [];
    
    for (const item of aifData.items) {
      if (item.aif?.scheme?.key) {
        schemes.add(item.aif.scheme.key);
      }
    }
    return Array.from(schemes).sort();
  }, [aifData]);

  // Filter nodes based on criteria (must be before early returns)
  const filteredNodes = useMemo(() => {
    const nodes = data?.sheet?.nodes;
    if (!nodes) return [];
    let filtered = [...nodes];

    if (filterScheme) {
      filtered = filtered.filter((n: any) => {
        const aif = n.argumentId ? aifByArgId.get(n.argumentId) : null;
        return aif?.scheme?.key === filterScheme;
      });
    }

    if (filterOpenCQs) {
      filtered = filtered.filter((n: any) => {
        const aif = n.argumentId ? aifByArgId.get(n.argumentId) : null;
        return aif?.cq && aif.cq.satisfied < aif.cq.required;
      });
    }

    if (filterAttacked) {
      filtered = filtered.filter((n: any) => {
        const aif = n.argumentId ? aifByArgId.get(n.argumentId) : null;
        const total = aif?.attacks ? (aif.attacks.REBUTS + aif.attacks.UNDERCUTS + aif.attacks.UNDERMINES) : 0;
        return total > 0;
      });
    }

    return filtered;
  }, [data?.sheet?.nodes, filterScheme, filterOpenCQs, filterAttacked, aifByArgId]);

  if (error) return <div className="text-xs text-red-600">Failed to load sheet</div>;
  if (!data?.sheet) return <div className="text-xs text-neutral-500">Loading…</div>;

  const { nodes, edges, acceptance, unresolved, loci, title, deliberationId } = data.sheet;

  const argText = (id: string) => ev?.arguments?.find(a => a.id === id)?.text;

  const supportOfClaimId = (claimId?: string|null) =>
    (claimId && supportByClaim.has(claimId)) ? supportByClaim.get(claimId)! : undefined;

  function refreshEv() {
    throw new Error("Function not implemented.");
  }

  return (
    <>
    <div className="border rounded-xl p-3 bg-slate-50 flex flex-col flex-wrap w-full gap-4 ">
      <aside className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{title}</h2>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-neutral-600">Confidence</label>
            <select
              className="menuv2--lite rounded px-2 py-1 text-[12px]"
              value={mode}
              // onChange={e=>{ setMode(e.target.value as any); refreshEv(); }}
                onChange={(e) => { setMode(e.target.value as any); refetchEv(); }}

            >
              <option value="min">weakest‑link (min)</option>
              <option value="product">independent (product)</option>
              <option value="ds">DS (β/π) — (UI only for now)</option>
            </select>
            <label className="text-[11px] text-neutral-600">Imported</label>
<select
  className="menuv2--lite rounded px-2 py-1 text-[12px]"
  value={imports}
  onChange={e => setImports(e.target.value as any)}
>
  <option value="off">hide</option>
  <option value="materialized">materialized</option>
  <option value="virtual">virtual</option>
  <option value="all">all</option>
</select>

            <label className="ml-3 text-[11px] inline-flex items-center gap-1">
     <input type="checkbox" checked={imports==='virtual'}
            onChange={e=> setImports(e.target.checked ? 'virtual' : 'off')} />
     include imported lines (read‑only)
   </label>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-[11px] text-neutral-600">Filters:</label>
          <select
            className="menuv2--lite rounded px-2 py-1 text-[12px]"
            value={filterScheme ?? ""}
            onChange={(e) => setFilterScheme(e.target.value || null)}
          >
            <option value="">All schemes</option>
            {availableSchemes.map(s => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
          <label className="text-[11px] inline-flex items-center gap-1">
            <input type="checkbox" checked={filterOpenCQs} onChange={(e) => setFilterOpenCQs(e.target.checked)} />
            Open CQs only
          </label>
          <label className="text-[11px] inline-flex items-center gap-1">
            <input type="checkbox" checked={filterAttacked} onChange={(e) => setFilterAttacked(e.target.checked)} />
            Attacked only
          </label>
          {(filterScheme || filterOpenCQs || filterAttacked) && (
            <button className="text-[11px] underline text-blue-600" onClick={() => { setFilterScheme(null); setFilterOpenCQs(false); setFilterAttacked(false); }}>
              Clear filters
            </button>
          )}
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
          <div className="text-xs space-y-2 font-medium ">Unresolved CQs</div>
          <ul className="text-xs flex  mt-2 flex-wrap gap-2 ">
            {unresolved.map((u:any) => {
              // Format CQ text display
              const cqDisplay = u.cqText 
                ? u.cqText 
                : u.cqKey.replace(/^aif_attack_/, "").replace(/_/g, " ");
              
              // Get argument title from nodes array for better context
              const argNode = nodes.find((n: any) => n.id === u.nodeId || n.argumentId === u.nodeId);
              const nodeDisplay = argNode?.title 
                ? (argNode.title.length > 40 ? argNode.title.slice(0, 40) + "..." : argNode.title)
                : u.nodeId;
              
              return (
                <li key={`${u.nodeId}:${u.cqKey}`} className="border border-amber-400 rounded w-fit h-fit px-2 py-1">
                  <div className="font-medium text-amber-700">{cqDisplay}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">→ {nodeDisplay}</div>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      <main className="space-y-3">
        <div className="rounded border p-2">
          <div className="text-xs text-neutral-600 mb-2">
            Debate graph ({filteredNodes.length} {filteredNodes.length === 1 ? "node" : "nodes"})
          </div>
          <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredNodes.map((n:any) => {
              const label = acceptance.labels[n.id] ?? 'undecided';
              const s = supportOfClaimId(n.claimId);
              const v = barFor(n.claimId);
              const aif = n.argumentId ? aifByArgId.get(n.argumentId) : null;

              return (
                <li 
                  key={n.id} 
                  className="panelv2 panelv2--aurora px-4 py-3 relative transition-all"
                >
                  
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm mb-1">{n.title ?? n.id}</div>
                      {/* Metadata badges */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {aif?.scheme && (
                          <SchemeBadge schemeKey={aif.scheme.key} schemeName={aif.scheme.name} />
                        )}
                        {aif?.cq && (
                          <CQStatusIndicator required={aif.cq.required} satisfied={aif.cq.satisfied} />
                        )}
                        {aif?.attacks && (
                          <AttackBadge attacks={aif.attacks} />
                        )}
                        {aif?.preferences && (
                          <PreferenceBadge 
                            preferredBy={aif.preferences.preferredBy} 
                            dispreferredBy={aif.preferences.dispreferredBy} 
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Preview toggle button */}
                      {n.argumentId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePreview(n.id);
                          }}
                          className="p-1.5 rounded-lg border transition-all bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-gray-400"
                          title="View AIF neighborhood"
                        >
                          <Waypoints className="w-4 h-4" />
                        </button>
                      )}
                      
                      <Badge
                        variant={
                          label === 'accepted'
                            ? 'secondary'
                            : label === 'rejected'
                              ? 'destructive'
                              : 'outline'
                        }
                        className="text-[10px] shrink-0"
                      >
                        {label}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Click node card to open full argument sheet */}
                  <div 
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleNodeClick(n)}
                  >
                  {v && v.kind === 'scalar' && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-neutral-200 rounded">
                        <div className="h-1.5 rounded bg-emerald-500 transition-all" style={{ width: `${Math.max(0, Math.min(1, v.s ?? 0)) * 100}%` }} />
                      </div>
                    </div>
                  )}
                  {v && v.kind === 'ds' && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[11px] text-neutral-600 mb-0.5 gap-1">
                        <span>{"Belief:" + " "}</span>
                        <span>{typeof v.bel === "number" ? (v.bel * 100).toFixed(0) + "%" : "N/A"}</span>
                      </div>
                      <div className="h-1.5 bg-neutral-200 rounded">
                        <div className="h-1.5 rounded bg-emerald-500 transition-all" style={{ width: `${Math.max(0, Math.min(1, v.bel ?? 0)) * 100}%` }} />
                      </div>
                    </div>
                  )}

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

                  <div className="justify-end items-end align-end mt-auto text-xs flex gap-3">
                    <button 
                      className="underline disabled:opacity-50 disabled:cursor-not-allowed" 
                      onClick={() => setOpenNodeId(n.id)} 
                      disabled={!n.diagramId && !n.argumentId}
                    >
                      Expand
                    </button>
                    {n.claimId && (
                      <button className="underline" onClick={() => setShowArgsFor(n.claimId)}>
                        View contributing arguments
                      </button>
                    )}
                    <span className="text-neutral-500">
                      Edges: {edges.filter((e:any)=>e.fromId===n.id || e.toId===n.id).length}
                    </span>
                  </div>
                  </div>
                  {/* End clickable wrapper */}
                </li>
              );
            })}
          </ul>
        </div>

        {openNodeId && (
          <ArgumentPopout node={nodes.find((nn:any)=>nn.id===openNodeId)} onClose={() => setOpenNodeId(null)} />
        )}

        {showArgsFor && (
          <div className="rounded border p-3 ">
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

    {/* AIF Neighborhood Preview Modal */}
    <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
      <DialogContent className="max-w-[750px] bg-white/15 backdrop-blur-md border border-white rounded-xl ">
        <DialogHeader>
          <DialogTitle className="tracking-wide font-medium">AIF Neighborhood Preview</DialogTitle>
        </DialogHeader>
        <div className="py-0">
          <MiniNeighborhoodPreview 
            data={neighborhoodData}
            loading={neighborhoodLoading}
            error={neighborhoodError}
            maxWidth={700}
            maxHeight={400}
          />
        </div>
        <div className="text-xs text-neutral-600 text-center border-t pt-1">
          Click the node card to view the full argument with all actions
        </div>
      </DialogContent>
    </Dialog>

    {/* ArgumentActionsSheet Modal for detailed argument exploration */}
    {deliberationId && (
      <ArgumentActionsSheet
        open={actionsSheetOpen}
        onOpenChange={setActionsSheetOpen}
        deliberationId={deliberationId}
        selectedArgument={selectedArgumentForActions}
      />
    )}
    </>
  );
}
