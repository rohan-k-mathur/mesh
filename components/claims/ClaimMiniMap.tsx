
'use client';
import { useState, useMemo } from 'react';
import useSWR from 'swr';
import React from 'react';
const fetcher = (url: string) => fetch(url).then((r) => r.json());
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from '@/components/ui/dialog';
  import CriticalQuestions from '@/components/claims/CriticalQuestionsV3';
  import { LegalMoveChips } from '@/components/dialogue/LegalMoveChips';

// Enhanced claim row with full AIF + dialogical integration
type ClaimRow = {
  id: string;
  text: string;
  moid?: string;
  createdAt: string;
  counts: { supports: number; rebuts: number };
  cq?: { required: number; satisfied: number };
  // AIF metadata
  argumentCount?: number;
  topArgumentId?: string | null;
  // Scheme info (from top argument)
  scheme?: { id: string; key: string; name: string } | null;
  // Attack counts (incoming)
  attacks?: { REBUTS: number; UNDERCUTS: number; UNDERMINES: number };
  // Dialogical status
  moves?: {
    whyCount: number;
    groundsCount: number;
    concedeCount: number;
    retractCount: number;
    openWhys: number;
  };
  // Edges
  edges?: {
    incoming: Array<{ id: string; type: string; attackType?: string; fromClaimId: string }>;
    outgoing: Array<{ id: string; type: string; attackType?: string; toClaimId: string }>;
  };
};
type LabelRow = { claimId: string; label: 'IN'|'OUT'|'UNDEC'; explainJson?: any };

function Dot({ label }: { label: 'IN'|'OUT'|'UNDEC' }) {
  const cls = label === 'IN' ? 'bg-emerald-500' : label === 'OUT' ? 'bg-rose-500' : 'bg-slate-400';
  const title =
    label === 'IN' ? 'Warranted (grounded semantics)' :
    label === 'OUT' ? 'Defeated by an IN attacker' : 'Undecided';
  return <span title={title} className={`inline-block w-2.5 h-2.5 rounded-full ${cls}`} />;
}

function CqMeter({ cq }: { cq?: { required: number; satisfied: number } }) {
  const r = cq?.required ?? 0, s = cq?.satisfied ?? 0;
  const pct = r ? Math.round((s / r) * 100) : 0;
  const color = pct >= 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                pct >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-slate-50 text-slate-600 border-slate-200';
  return (
    <span
      className={`text-[10px] px-1 py-0.5 rounded border ${color}`}
      title={r ? `${s}/${r} CQs satisfied` : 'No CQs yet'}
    >
      CQ {pct}%
    </span>
  );
}

function SchemeBadge({ scheme }: { scheme?: { id: string; key: string; name: string } | null }) {
  if (!scheme) return null;
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200"
      title={scheme.name}
    >
      {scheme.key}
    </span>
  );
}

function AttackBadges({ attacks }: { attacks?: { REBUTS: number; UNDERCUTS: number; UNDERMINES: number } }) {
  if (!attacks || (attacks.REBUTS + attacks.UNDERCUTS + attacks.UNDERMINES === 0)) return null;
  return (
    <div className="flex items-center gap-1">
      {attacks.REBUTS > 0 && (
        <span className="text-[10px] px-1 py-0.5 rounded bg-red-50 text-red-700 border border-red-200" title="Rebuttals">
          R:{attacks.REBUTS}
        </span>
      )}
      {attacks.UNDERCUTS > 0 && (
        <span className="text-[10px] px-1 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200" title="Undercuts">
          U:{attacks.UNDERCUTS}
        </span>
      )}
      {attacks.UNDERMINES > 0 && (
        <span className="text-[10px] px-1 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-200" title="Undermines">
          M:{attacks.UNDERMINES}
        </span>
      )}
    </div>
  );
}

function DialogicalStatus({ moves }: { moves?: ClaimRow['moves'] }) {
  if (!moves) return null;
  const hasActivity = moves.whyCount + moves.groundsCount + moves.concedeCount + moves.retractCount > 0;
  if (!hasActivity) return null;
  
  const openColor = moves.openWhys > 0 ? 'text-amber-600' : 'text-slate-500';
  
  return (
    <div className="flex items-center gap-1 text-[10px]">
      {moves.whyCount > 0 && (
        <span className={openColor} title={`${moves.whyCount} WHY moves (${moves.openWhys} open)`}>
          ?{moves.whyCount}
        </span>
      )}
      {moves.groundsCount > 0 && (
        <span className="text-emerald-600" title={`${moves.groundsCount} GROUNDS responses`}>
          G:{moves.groundsCount}
        </span>
      )}
      {moves.concedeCount > 0 && (
        <span className="text-blue-600" title={`${moves.concedeCount} concessions`}>
          ✓{moves.concedeCount}
        </span>
      )}
      {moves.retractCount > 0 && (
        <span className="text-rose-600" title={`${moves.retractCount} retractions`}>
          ✗{moves.retractCount}
        </span>
      )}
    </div>
  );
}

const PAGE_SIZE = 8;

export default function ClaimMiniMap({ deliberationId, selectedClaimId, onClaimClick }: 
  { deliberationId: string; selectedClaimId?: string; onClaimClick?: (claimId: string) => void; }) {
  
  // Core data fetching with enhanced endpoints
  const { data: summary, error, isLoading } = useSWR(
    `/api/claims/summary?deliberationId=${deliberationId}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 1200 }
  );
  
  const { data: labelsData } = useSWR(
    `/api/claims/labels?deliberationId=${deliberationId}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 1200 }
  );

  // Fetch enhanced AIF metadata for all claims
  const claimIds = useMemo(() => summary?.claims?.map((c: ClaimRow) => c.id) ?? [], [summary]);
  const claimIdsStr = claimIds.join(',');
  
  const { data: aifData } = useSWR(
    claimIdsStr ? `/api/claims/batch?ids=${encodeURIComponent(claimIdsStr)}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 1200 }
  );

  // Fetch dialogical moves for all claims
  const { data: movesData } = useSWR(
    deliberationId ? `/api/deliberations/${deliberationId}/moves?limit=500` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 1200 }
  );

  // Fetch edges for graph connectivity
  const { data: edgesData } = useSWR(
    deliberationId ? `/api/claims/edges?deliberationId=${deliberationId}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 1200 }
  );

  // Global mutators for event-driven updates
  const { mutate: mutateSummary } = useSWR(`/api/claims/summary?deliberationId=${deliberationId}`, fetcher, { revalidateOnFocus: false });
  const { mutate: mutateLabels }  = useSWR(`/api/claims/labels?deliberationId=${deliberationId}`,  fetcher, { revalidateOnFocus: false });

  React.useEffect(() => {
    const h = () => {
      mutateSummary();
      mutateLabels();
    };
    window.addEventListener('claims:changed', h);
    window.addEventListener('dialogue:moves:refresh', h);
    window.addEventListener('arguments:changed', h);
    return () => {
      window.removeEventListener('claims:changed', h);
      window.removeEventListener('dialogue:moves:refresh', h);
      window.removeEventListener('arguments:changed', h);
    };
  }, [mutateSummary, mutateLabels]);

  const [limit, setLimit] = useState(PAGE_SIZE);
  const [cqOpenFor, setCqOpenFor] = useState<string | null>(null);
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);
  const [showMoves, setShowMoves] = useState<string | null>(null);
  const [ensuringSchemes, setEnsuringSchemes] = useState(false);

  // Enrich claims with AIF + dialogical data
  const enrichedClaims: ClaimRow[] = useMemo(() => {
    const baseClaims = summary?.claims ?? [];
    const aifMap = new Map((aifData?.claims ?? []).map((c: any) => [c.id, c]));
    const movesByTarget = new Map<string, any[]>();
    const edgesByTarget = { incoming: new Map<string, any[]>(), outgoing: new Map<string, any[]>() };

    // Group moves by targetId
    (movesData?.moves ?? []).forEach((m: any) => {
      if (m.targetType === 'claim') {
        const list = movesByTarget.get(m.targetId) ?? [];
        list.push(m);
        movesByTarget.set(m.targetId, list);
      }
    });

    // Group edges
    (edgesData?.edges ?? []).forEach((e: any) => {
      const incoming = edgesByTarget.incoming.get(e.toClaimId) ?? [];
      incoming.push(e);
      edgesByTarget.incoming.set(e.toClaimId, incoming);
      
      const outgoing = edgesByTarget.outgoing.get(e.fromClaimId) ?? [];
      outgoing.push(e);
      edgesByTarget.outgoing.set(e.fromClaimId, outgoing);
    });

    return baseClaims.map((c: ClaimRow) => {
      const aif = aifMap.get(c.id);
      const moves = movesByTarget.get(c.id) ?? [];
      
      const whyMoves = moves.filter((m: any) => m.kind === 'WHY');
      const groundsMoves = moves.filter((m: any) => m.kind === 'GROUNDS');
      const openWhys = whyMoves.filter((w: any) => {
        const answered = groundsMoves.some((g: any) => 
          new Date(g.createdAt) > new Date(w.createdAt) &&
          g.payload?.cqId === w.payload?.cqId
        );
        return !answered;
      }).length;

      return {
        ...c,
        argumentCount: (aif as any)?._count?.arguments ?? 0,
        topArgumentId: (aif as any)?.topArgumentId ?? null,
        scheme: (aif as any)?.scheme ?? null,
        attacks: (aif as any)?.attacks ?? { REBUTS: 0, UNDERCUTS: 0, UNDERMINES: 0 },
        moves: {
          whyCount: whyMoves.length,
          groundsCount: groundsMoves.length,
          concedeCount: moves.filter((m: any) => m.kind === 'CONCEDE').length,
          retractCount: moves.filter((m: any) => m.kind === 'RETRACT').length,
          openWhys,
        },
        edges: {
          incoming: edgesByTarget.incoming.get(c.id) ?? [],
          outgoing: edgesByTarget.outgoing.get(c.id) ?? [],
        },
      };
    });
  }, [summary, aifData, movesData, edgesData]);

  // Compute data unconditionally so hooks count/order is stable
  const labels: Record<string, LabelRow> = Object.fromEntries(
    ((labelsData?.labels ?? []) as LabelRow[]).map(l => [l.claimId, l])
  );
  const visibleClaims = enrichedClaims.slice(0, limit);
  const remaining = Math.max(0, enrichedClaims.length - limit);
  const canShowMore = remaining > 0;
  const canCollapse = limit > PAGE_SIZE;

  const failed = Boolean(error || summary?.error);

  return (
    <div className="mt-3 rounded-lg border border-indigo-200 p-3 shadow-sm shadow-slate-500/30 mb-1">
      {isLoading ? (
        <div className="text-sm text-slate-500">Loading claims…</div>
      ) : failed ? (
        <div className="text-sm text-rose-600">Failed to load claims</div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[16px] font-semibold">
              Claims List
              <span className="ml-2 text-sm text-slate-500">({enrichedClaims.length})</span>
            </h3>
            <button
              onClick={async () => {
                const newExpandedId = expandedClaim ? null : visibleClaims[0]?.id ?? null;
                
                // If expanding, ensure the claim has schemes
                if (newExpandedId) {
                  setEnsuringSchemes(true);
                  try {
                    await fetch(`/api/claims/${newExpandedId}/ensure-schemes`, { method: 'POST' });
                    await new Promise(resolve => setTimeout(resolve, 200));
                  } catch (err) {
                    console.error('Failed to ensure schemes:', err);
                  } finally {
                    setEnsuringSchemes(false);
                  }
                }
                
                setExpandedClaim(newExpandedId);
              }}
              className="text-xs px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
              disabled={ensuringSchemes}
            >
              {ensuringSchemes ? 'Loading…' : expandedClaim ? 'Collapse All' : 'Expand View'}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {visibleClaims.map((c) => {
              const lab = labels[c.id]?.label ?? 'UNDEC';
              const tip = labels[c.id]?.explainJson ? JSON.stringify(labels[c.id]?.explainJson) : undefined;
              const isExpanded = expandedClaim === c.id;
              const isSelected = selectedClaimId === c.id;
              
              return (
                <div
                  key={c.id}
                  id={`row-${c.id}`}
                  data-claim-id={c.id}
                  className={`flex flex-col border rounded-lg p-2 gap-2 bg-slate-50 transition-all ${
                    isSelected ? 'ring-2 ring-indigo-400 border-indigo-300' : 'border-slate-200'
                  } ${isExpanded ? 'shadow-md' : ''}`}
                  title={tip}
                >
                  {/* Main claim row */}
                  <div className="flex items-start gap-3">
                    <div className="mt-1"><Dot label={lab} /></div>
                    <div 
                      className="flex-1 text-sm line-clamp-2 max-w-[34rem] cursor-pointer hover:text-indigo-600"
                      onClick={() => onClaimClick?.(c.id)}
                    >
                      {c.text}
                    </div>
                    <div className="shrink-0 flex items-center gap-2 flex-wrap">
                      {/* Support/Rebut counts */}
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        +{c.counts.supports}
                      </span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        −{c.counts.rebuts}
                      </span>
                      
                      {/* CQ Status */}
                      <CqMeter cq={c.cq} />
                      
                      {/* Scheme badge */}
                      <SchemeBadge scheme={c.scheme} />
                      
                      {/* Attack types */}
                      <AttackBadges attacks={c.attacks} />
                      
                      {/* Dialogical status */}
                      <DialogicalStatus moves={c.moves} />
                      
                      {/* Argument count */}
                      {(c.argumentCount ?? 0) > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200" title="Arguments">
                          Args:{c.argumentCount}
                        </span>
                      )}
                      
                      {/* Action buttons */}
                      <button
                        className="text-[11px] px-1.5 py-0.5 rounded border bg-white hover:bg-slate-50 disabled:opacity-50"
                        title="Open Critical Questions"
                        disabled={ensuringSchemes}
                        onClick={async (e) => { 
                          e.stopPropagation(); 
                          // Ensure claim has schemes before opening CQ modal
                          setEnsuringSchemes(true);
                          try {
                            await fetch(`/api/claims/${c.id}/ensure-schemes`, { method: 'POST' });
                            // Brief delay to let cache update
                            await new Promise(resolve => setTimeout(resolve, 300));
                            setCqOpenFor(c.id);
                          } catch (err) {
                            console.error('Failed to ensure schemes:', err);
                            // Still open modal even if ensure fails
                            setCqOpenFor(c.id);
                          } finally {
                            setEnsuringSchemes(false);
                          }
                        }}
                      >
                        {ensuringSchemes ? 'Loading…' : 'CQs'}
                      </button>
                      
                      <button
                        className="text-[11px] px-1.5 py-0.5 rounded border bg-white hover:bg-slate-50"
                        title="Show dialogical moves"
                        onClick={(e) => { e.stopPropagation(); setShowMoves(showMoves === c.id ? null : c.id); }}
                      >
                        Moves
                      </button>
                      
                      <button
                        className="text-[11px] px-1.5 py-0.5 rounded border bg-white hover:bg-indigo-50 disabled:opacity-50"
                        title="Expand details"
                        disabled={ensuringSchemes}
                        onClick={async (e) => { 
                          e.stopPropagation(); 
                          
                          // If expanding, ensure schemes
                          if (!isExpanded) {
                            setEnsuringSchemes(true);
                            try {
                              await fetch(`/api/claims/${c.id}/ensure-schemes`, { method: 'POST' });
                              await new Promise(resolve => setTimeout(resolve, 200));
                            } catch (err) {
                              console.error('Failed to ensure schemes:', err);
                            } finally {
                              setEnsuringSchemes(false);
                            }
                          }
                          
                          setExpandedClaim(isExpanded ? null : c.id); 
                        }}
                      >
                        {isExpanded ? '−' : '+'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded view */}
                  {isExpanded && (
                    <div className="mt-2 pl-6 border-l-2 border-indigo-200 space-y-2">
                      {/* Metadata */}
                      <div className="text-xs text-slate-600 space-y-1">
                        <div><strong>ID:</strong> {c.id}</div>
                        {c.moid && <div><strong>MOID:</strong> {c.moid}</div>}
                        <div><strong>Created:</strong> {new Date(c.createdAt).toLocaleString()}</div>
                        {c.topArgumentId && (
                          <div>
                            <strong>Top Argument:</strong>{' '}
                            <a href={`#arg-${c.topArgumentId}`} className="text-indigo-600 hover:underline">
                              {c.topArgumentId.slice(0, 8)}…
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Edges summary */}
                      {(c.edges && (c.edges.incoming.length > 0 || c.edges.outgoing.length > 0)) && (
                        <div className="text-xs">
                          <strong>Graph Connections:</strong>
                          {c.edges.incoming.length > 0 && (
                            <div className="ml-2 text-slate-600">
                              ← {c.edges.incoming.length} incoming ({c.edges.incoming.filter((e: any) => e.type === 'supports').length} supports, {c.edges.incoming.filter((e: any) => e.type === 'rebuts').length} rebuts)
                            </div>
                          )}
                          {c.edges.outgoing.length > 0 && (
                            <div className="ml-2 text-slate-600">
                              → {c.edges.outgoing.length} outgoing
                            </div>
                          )}
                        </div>
                      )}

                      {/* Critical Questions interface */}
                      <div className="pt-2 border-t border-slate-200">
                        <div className="text-xs font-semibold mb-2 text-slate-700">
                          Critical Questions:
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <CriticalQuestions
                            targetType="claim"
                            targetId={c.id}
                            createdById="current"
                            deliberationId={deliberationId}
                          />
                        </div>
                      </div>

                      {/* Legal moves interface */}
                      <div className="pt-2 border-t border-slate-200 mt-2">
                        <div className="text-xs font-semibold mb-1 text-slate-700">Legal Dialogical Moves:</div>
                        <LegalMoveChips
                          deliberationId={deliberationId}
                          targetType="claim"
                          targetId={c.id}
                          locusPath="0"
                          onPosted={() => {
                            window.dispatchEvent(new CustomEvent('claims:changed'));
                            window.dispatchEvent(new CustomEvent('dialogue:moves:refresh'));
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Show moves panel */}
                  {showMoves === c.id && c.moves && (
                    <div className="mt-2 pl-6 border-l-2 border-amber-200 bg-amber-50/30 p-2 rounded text-xs">
                      <div className="font-semibold mb-1">Dialogical Activity:</div>
                      <div className="space-y-1 text-slate-700">
                        <div>WHY moves: {c.moves.whyCount} (open: {c.moves.openWhys})</div>
                        <div>GROUNDS responses: {c.moves.groundsCount}</div>
                        <div>Concessions: {c.moves.concedeCount}</div>
                        <div>Retractions: {c.moves.retractCount}</div>
                      </div>
                      {c.moves.openWhys > 0 && (
                        <div className="mt-2 text-amber-700 font-medium">
                          ⚠️ {c.moves.openWhys} open challenge{c.moves.openWhys > 1 ? 's' : ''} requiring response
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {enrichedClaims.length === 0 && <div className="text-xs text-slate-500">No claims yet.</div>}
          </div>

          {(canShowMore || canCollapse) && (
            <div className="mt-3 flex items-center gap-2">
              {canShowMore && (
                <button
                  onClick={() => setLimit(n => n + PAGE_SIZE)}
                  className="text-xs px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50"
                  aria-label={`Show ${Math.min(PAGE_SIZE, remaining)} more claims`}
                >
                  Show more{remaining > PAGE_SIZE ? ` (+${PAGE_SIZE})` : ` (+${remaining})`}
                </button>
              )}
              {canCollapse && (
                <button
                  onClick={() => setLimit(PAGE_SIZE)}
                  className="text-xs px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50"
                >
                  Collapse
                </button>
              )}
              <span className="text-[11px] text-slate-500">
                Showing {visibleClaims.length} of {enrichedClaims.length}
              </span>
            </div>
          )}

          <div className="text-[11px] text-slate-500 mt-4 flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> IN</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> OUT</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> UNDEC</span>
            <span className="opacity-70">(grounded semantics)</span>
            <span className="ml-2 opacity-70">|</span>
            <span className="opacity-70">R=Rebuts, U=Undercuts, M=Undermines</span>
          </div>

          {/* CQ Modal */}
          {cqOpenFor && (
            <Dialog open onOpenChange={(o) => { if (!o) setCqOpenFor(null); }}>
              <DialogContent className="bg-white rounded-xl sm:max-w-[880px]">
                <DialogHeader>
                  <DialogTitle>Claim-level Critical Questions</DialogTitle>
                </DialogHeader>
                <div className="mt-2">
                  <CriticalQuestions
                    targetType="claim"
                    targetId={cqOpenFor}
                    createdById="current"
                    deliberationId={deliberationId}
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </div>
  );
}
