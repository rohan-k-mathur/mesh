
'use client';
import { useState, useMemo, useCallback, memo } from 'react';
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

// Memoized sub-components for performance
const Dot = memo(({ label }: { label: 'IN'|'OUT'|'UNDEC' }) => {
  const cls = label === 'IN' ? 'bg-emerald-500' : label === 'OUT' ? 'bg-rose-500' : 'bg-slate-400';
  const title =
    label === 'IN' ? 'Warranted (grounded semantics)' :
    label === 'OUT' ? 'Defeated by an IN attacker' : 'Undecided';
  return <span title={title} className={`inline-block w-2.5 h-2.5 rounded-full ${cls}`} />;
});
Dot.displayName = 'Dot';

const CqMeter = memo(({ cq }: { cq?: { required: number; satisfied: number } }) => {
  const r = cq?.required ?? 0, s = cq?.satisfied ?? 0;
  const pct = r ? Math.round((s / r) * 100) : 0;
  const color = pct >= 100 ? "bg-emerald-400/15 text-emerald-900 border-emerald-500/40" :
                pct >= 50 ? "bg-amber-400/15 text-amber-900 border-amber-500/40" :
                "bg-slate-900/5 text-slate-600 border-slate-900/20";
  return (
    <span
      className={`text-[10px] px-2 py-1 rounded-lg border backdrop-blur-sm ${color} font-medium`}
      title={r ? `${s}/${r} CQs satisfied` : "No CQs yet"}
    >
      CQ {pct}%
    </span>
  );
});
CqMeter.displayName = 'CqMeter';

const SchemeBadge = memo(({ scheme }: { scheme?: { id: string; key: string; name: string } | null }) => {
  if (!scheme) return null;
  return (
    <span
      className="text-[10px] px-2 py-1 rounded-lg bg-gradient-to-br from-sky-400/15 to-cyan-400/15 text-sky-900 border border-cyan-500/30 backdrop-blur-sm font-medium shadow-sm"
      title={scheme.name}
    >
      {scheme.key}
    </span>
  );
});
SchemeBadge.displayName = 'SchemeBadge';

const AttackBadges = memo(({ attacks }: { attacks?: { REBUTS: number; UNDERCUTS: number; UNDERMINES: number } }) => {
  if (!attacks || (attacks.REBUTS + attacks.UNDERCUTS + attacks.UNDERMINES === 0)) return null;
  return (
    <div className="flex items-center gap-1.5">
      {attacks.REBUTS > 0 && (
        <span className="text-[10px] px-2 py-1 rounded-lg bg-gradient-to-br from-rose-400/15 to-red-400/15 text-rose-900 border border-rose-500/40 backdrop-blur-sm font-medium" title="Rebuttals">
          R:{attacks.REBUTS}
        </span>
      )}
      {attacks.UNDERCUTS > 0 && (
        <span className="text-[10px] px-2 py-1 rounded-lg bg-gradient-to-br from-orange-400/15 to-amber-400/15 text-orange-900 border border-orange-500/40 backdrop-blur-sm font-medium" title="Undercuts">
          U:{attacks.UNDERCUTS}
        </span>
      )}
      {attacks.UNDERMINES > 0 && (
        <span className="text-[10px] px-2 py-1 rounded-lg bg-gradient-to-br from-yellow-400/15 to-amber-400/15 text-yellow-900 border border-yellow-500/40 backdrop-blur-sm font-medium" title="Undermines">
          M:{attacks.UNDERMINES}
        </span>
      )}
    </div>
  );
});
AttackBadges.displayName = 'AttackBadges';

const DialogicalStatus = memo(({ moves }: { moves?: ClaimRow["moves"] }) => {
  if (!moves) return null;
  const hasActivity = moves.whyCount + moves.groundsCount + moves.concedeCount + moves.retractCount > 0;
  if (!hasActivity) return null;
  
  const openColor = moves.openWhys > 0 ? "text-amber-900 font-semibold" : "text-slate-600";
  
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-medium">
      {moves.whyCount > 0 && (
        <span className={openColor} title={`${moves.whyCount} WHY moves (${moves.openWhys} open)`}>
          ?{moves.whyCount}
        </span>
      )}
      {moves.groundsCount > 0 && (
        <span className="text-emerald-700" title={`${moves.groundsCount} GROUNDS responses`}>
          G:{moves.groundsCount}
        </span>
      )}
      {moves.concedeCount > 0 && (
        <span className="text-sky-700" title={`${moves.concedeCount} concessions`}>
          ✓{moves.concedeCount}
        </span>
      )}
      {moves.retractCount > 0 && (
        <span className="text-rose-700" title={`${moves.retractCount} retractions`}>
          ✗{moves.retractCount}
        </span>
      )}
    </div>
  );
});
DialogicalStatus.displayName = 'DialogicalStatus';

// Loading skeleton component
const ClaimCardSkeleton = memo(() => (
  <div className="relative flex flex-col rounded-xl backdrop-blur-md border border-slate-900/10 bg-slate-900/5 shadow-lg overflow-hidden p-4 gap-3 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="mt-1 w-2.5 h-2.5 rounded-full bg-slate-300" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-300 rounded w-3/4" />
        <div className="h-4 bg-slate-300 rounded w-1/2" />
      </div>
      <div className="shrink-0 flex items-center gap-2 flex-wrap">
        <div className="h-6 w-12 bg-slate-300 rounded-lg" />
        <div className="h-6 w-12 bg-slate-300 rounded-lg" />
        <div className="h-6 w-16 bg-slate-300 rounded-lg" />
      </div>
    </div>
  </div>
));
ClaimCardSkeleton.displayName = 'ClaimCardSkeleton';

const PAGE_SIZE = 8;

// SWR configuration for optimal caching and performance
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  keepPreviousData: true,
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  shouldRetryOnError: (error: any) => {
    // Don't retry on 404s or auth errors
    return error?.status !== 404 && error?.status !== 401 && error?.status !== 403;
  },
};

export default function ClaimMiniMap({ deliberationId, selectedClaimId, onClaimClick }: 
  { deliberationId: string; selectedClaimId?: string; onClaimClick?: (claimId: string) => void; }) {
  
  // Core data fetching with enhanced endpoints
  const { data: summary, error, isLoading, mutate: mutateSummary } = useSWR(
    deliberationId ? `/api/claims/summary?deliberationId=${deliberationId}` : null,
    fetcher,
    swrConfig
  );
  
  const { data: labelsData, mutate: mutateLabels } = useSWR(
    deliberationId ? `/api/claims/labels?deliberationId=${deliberationId}` : null,
    fetcher,
    swrConfig
  );

  // Fetch enhanced AIF metadata for all claims
  const claimIds = useMemo(() => summary?.claims?.map((c: ClaimRow) => c.id) ?? [], [summary]);
  const claimIdsStr = claimIds.join(',');
  
  const { data: aifData } = useSWR(
    claimIdsStr ? `/api/claims/batch?ids=${encodeURIComponent(claimIdsStr)}` : null,
    fetcher,
    swrConfig
  );

  // Fetch dialogical moves for all claims
  const { data: movesData } = useSWR(
    deliberationId ? `/api/deliberations/${deliberationId}/moves?limit=500` : null,
    fetcher,
    swrConfig
  );

  // Fetch edges for graph connectivity
  const { data: edgesData } = useSWR(
    deliberationId ? `/api/claims/edges?deliberationId=${deliberationId}` : null,
    fetcher,
    swrConfig
  );

  // Debounced event handler for better performance
  const handleDataRefresh = useCallback(() => {
    mutateSummary();
    mutateLabels();
  }, [mutateSummary, mutateLabels]);

  React.useEffect(() => {
    // Debounce timer to prevent excessive refreshes
    let debounceTimer: NodeJS.Timeout | null = null;
    
    const debouncedHandler = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        handleDataRefresh();
      }, 300); // 300ms debounce
    };
    
    window.addEventListener("claims:changed", debouncedHandler);
    window.addEventListener("dialogue:moves:refresh", debouncedHandler);
    window.addEventListener("arguments:changed", debouncedHandler);
    
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener("claims:changed", debouncedHandler);
      window.removeEventListener("dialogue:moves:refresh", debouncedHandler);
      window.removeEventListener("arguments:changed", debouncedHandler);
    };
  }, [handleDataRefresh]);

  const [limit, setLimit] = useState(PAGE_SIZE);
  const [cqOpenFor, setCqOpenFor] = useState<string | null>(null);
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);
  const [showMoves, setShowMoves] = useState<string | null>(null);
  const [loadingSchemes, setLoadingSchemes] = useState<Set<string>>(new Set());

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

  // Memoized handlers for better performance
  const handleEnsureSchemes = useCallback(async (claimId: string) => {
    setLoadingSchemes(prev => new Set(prev).add(claimId));
    try {
      await fetch(`/api/claims/${claimId}/ensure-schemes`, { method: "POST" });
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (err) {
      console.error("Failed to ensure schemes:", err);
    } finally {
      setLoadingSchemes(prev => {
        const next = new Set(prev);
        next.delete(claimId);
        return next;
      });
    }
  }, []);

  const handleOpenCQ = useCallback(async (claimId: string) => {
    await handleEnsureSchemes(claimId);
    await new Promise(resolve => setTimeout(resolve, 100));
    setCqOpenFor(claimId);
  }, [handleEnsureSchemes]);

  const handleToggleExpanded = useCallback(async (claimId: string) => {
    const willExpand = expandedClaim !== claimId;
    if (willExpand) {
      await handleEnsureSchemes(claimId);
    }
    setExpandedClaim(willExpand ? claimId : null);
  }, [expandedClaim, handleEnsureSchemes]);

  const handleClaimClick = useCallback((claimId: string) => {
    onClaimClick?.(claimId);
  }, [onClaimClick]);

  // Compute data unconditionally so hooks count/order is stable
  const labels: Record<string, LabelRow> = useMemo(
    () => Object.fromEntries(
      ((labelsData?.labels ?? []) as LabelRow[]).map(l => [l.claimId, l])
    ),
    [labelsData]
  );
  const visibleClaims = enrichedClaims.slice(0, limit);
  const remaining = Math.max(0, enrichedClaims.length - limit);
  const canShowMore = remaining > 0;
  const canCollapse = limit > PAGE_SIZE;

  const failed = Boolean(error || summary?.error);

  return (
    <div className="relative mt-3 rounded-xl overflow-hidden bg-white/95 backdrop-blur-xl shadow-2xl p-6 mb-1">
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/5 via-transparent to-slate-900/10 pointer-events-none" />
      
      {/* Radial light - sky tint */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(56,189,248,0.08),transparent_50%)] pointer-events-none" />
      
      {/* Water droplets */}
      <div className="absolute top-10 right-20 w-32 h-32 bg-sky-400/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-10 w-40 h-40 bg-cyan-400/8 rounded-full blur-3xl animate-pulse delay-1000" />
      
      {/* Content wrapper with z-index */}
      <div className="relative z-10">
        {isLoading ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <div className="h-7 w-48 bg-slate-300 rounded animate-pulse" />
              <div className="h-10 w-32 bg-slate-300 rounded-xl animate-pulse" />
            </div>
            {[...Array(3)].map((_, i) => (
              <ClaimCardSkeleton key={i} />
            ))}
          </div>
        ) : failed ? (
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-400/15 to-red-400/15 backdrop-blur-md border border-rose-500/40 p-5 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 via-transparent to-transparent" />
            <div className="relative flex gap-4 items-start">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500/30 to-red-500/30 shadow-lg h-fit">
                <svg className="w-5 h-5 text-rose-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold mb-1 text-rose-900 text-sm">Failed to load claims</p>
                <p className="text-xs text-rose-800">Please try refreshing the page or contact support if the issue persists.</p>
              </div>
            </div>
          </div>
        ) : (
          <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-sky-900 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
              Claims List
                            <span className="ml-2 text-sm font-normal text-slate-500">({enrichedClaims.length})</span>
            </h3>
            <button
              onClick={async () => {
                const newExpandedId = expandedClaim ? null : visibleClaims[0]?.id ?? null;
                if (newExpandedId) {
                  await handleEnsureSchemes(newExpandedId);
                }
                setExpandedClaim(newExpandedId);
              }}
              className="relative btnv2 overflow-hidden text-sm px-4 py-2 rounded-xl bg-gradient-to-b from-sky-600 to-indigo-700
              shadow-sm shadow-indigo-600/30 hover:shadow-indigo-600/70 text-white
                transition-all duration-300 disabled:opacity-50 group"
              disabled={loadingSchemes.size > 0}
            >
              {/* Glass shine */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 
              to-transparent translate-y-[50%] 
              transition-transform duration-700" />
              <span className="relative">
                {loadingSchemes.has(visibleClaims[0]?.id) ? "Loading…" : expandedClaim ? "Collapse All" : "Expand View"}
              </span>
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {visibleClaims.map((c) => {
              const lab = labels[c.id]?.label ?? "UNDEC";
              const tip = labels[c.id]?.explainJson ? JSON.stringify(labels[c.id]?.explainJson) : undefined;
              const isExpanded = expandedClaim === c.id;
              const isSelected = selectedClaimId === c.id;
              
              return (
                <div
                  key={c.id}
                  id={`row-${c.id}`}
                  data-claim-id={c.id}
                  className={`group relative flex flex-col rounded-xl transition-all duration-300 backdrop-blur-md border shadow-lg overflow-hidden p-4 gap-3 ${
                    isSelected 
                      ? "border-cyan-500/60 bg-gradient-to-br from-cyan-400/20 to-sky-400/20 shadow-cyan-400/20" 
                      : "border-slate-900/10 bg-slate-900/5 hover:bg-slate-900/10 hover:border-slate-900/20 "
                  }`}
                  title={tip}
                >
                  {/* Glass shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  {/* Selection indicator dot */}
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <div className="w-2 h-2 rounded-full bg-cyan-600 shadow-lg shadow-cyan-600/50 animate-pulse" />
                    </div>
                  )}
                  
                  {/* Main claim row */}
                  <div className="relative flex items-start gap-3">
                    <div className="mt-1"><Dot label={lab} /></div>
                    <div 
                      className={`flex-1 text-sm line-clamp-2 max-w-[34rem] cursor-pointer transition-colors duration-300 ${
                        isSelected ? "text-cyan-900 font-medium" : "text-slate-900 hover:text-sky-700"
                      }`}
                      onClick={() => handleClaimClick(c.id)}
                    >
                      {c.text}
                    </div>
                    <div className="shrink-0 flex items-center gap-2 flex-wrap">
                      {/* Support/Rebut counts */}
                      <span className="text-[11px] px-2 py-1 rounded-lg bg-gradient-to-br from-emerald-400/15 to-green-400/15 text-emerald-900 border border-emerald-500/40 backdrop-blur-sm font-medium shadow-sm">
                        +{c.counts.supports}
                      </span>
                      <span className="text-[11px] px-2 py-1 rounded-lg bg-gradient-to-br from-rose-400/15 to-red-400/15 text-rose-900 border border-rose-500/40 backdrop-blur-sm font-medium shadow-sm">
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
                        <span className="text-[10px] px-2 py-1 rounded-lg bg-gradient-to-br from-sky-400/15 to-cyan-400/15 text-sky-900 border border-cyan-500/30 backdrop-blur-sm font-medium shadow-sm" title="Arguments">
                          Args:{c.argumentCount}
                        </span>
                      )}
                      
                      {/* Action buttons */}
                      <button
                        className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-900/5 backdrop-blur-md border border-slate-900/20 text-slate-900 hover:bg-slate-900/10 hover:border-slate-900/30 transition-all duration-200 disabled:opacity-50 font-medium shadow-sm"
                        title="Open Critical Questions"
                        disabled={loadingSchemes.has(c.id)}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleOpenCQ(c.id);
                        }}
                      >
                        {loadingSchemes.has(c.id) ? "Loading…" : "CQs"}
                      </button>
                      
                      <button
                        className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-900/5 backdrop-blur-md border border-slate-900/20 text-slate-900 hover:bg-slate-900/10 hover:border-slate-900/30 transition-all duration-200 font-medium shadow-sm"
                        title="Show dialogical moves"
                        onClick={(e) => { e.stopPropagation(); setShowMoves(showMoves === c.id ? null : c.id); }}
                      >
                        Moves
                      </button>
                      
                      <button
                        className="text-[11px] px-2.5 py-1.5 rounded-lg bg-gradient-to-br from-sky-400/15 to-cyan-400/15 backdrop-blur-md border border-cyan-500/30 text-sky-900 hover:from-sky-400/20 hover:to-cyan-400/20 hover:border-cyan-500/40 transition-all duration-200 disabled:opacity-50 font-medium shadow-sm"
                        title="Expand details"
                        disabled={loadingSchemes.has(c.id)}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleToggleExpanded(c.id);
                        }}
                      >
                        {isExpanded ? "−" : "+"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded view */}
                  {isExpanded && (
                    <div className="mt-3 pl-6 border-l-2 border-cyan-500/40 space-y-3">
                      {/* Metadata */}
                      <div className="text-xs text-slate-700 space-y-1.5 bg-slate-900/5 backdrop-blur-sm p-3 rounded-lg border border-slate-900/10">
                        <div className="font-semibold text-sky-900 mb-2">Metadata</div>
                        <div><strong className="text-slate-900">ID:</strong> <span className="text-slate-600">{c.id}</span></div>
                        {c.moid && <div><strong className="text-slate-900">MOID:</strong> <span className="text-slate-600">{c.moid}</span></div>}
                        <div><strong className="text-slate-900">Created:</strong> <span className="text-slate-600">{new Date(c.createdAt).toLocaleString()}</span></div>
                        {c.topArgumentId && (
                          <div>
                            <strong className="text-slate-900">Top Argument:</strong>{" "}
                            <a href={`#arg-${c.topArgumentId}`} className="text-sky-700 hover:text-cyan-700 hover:underline transition-colors">
                              {c.topArgumentId.slice(0, 8)}…
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Edges summary */}
                      {(c.edges && (c.edges.incoming.length > 0 || c.edges.outgoing.length > 0)) && (
                        <div className="text-xs bg-slate-900/5 backdrop-blur-sm p-3 rounded-lg border border-slate-900/10">
                          <strong className="text-sky-900 font-semibold">Graph Connections:</strong>
                          {c.edges.incoming.length > 0 && (
                            <div className="ml-2 mt-1.5 text-slate-700">
                              ← {c.edges.incoming.length} incoming ({c.edges.incoming.filter((e: any) => e.type === "supports").length} supports, {c.edges.incoming.filter((e: any) => e.type === "rebuts").length} rebuts)
                            </div>
                          )}
                          {c.edges.outgoing.length > 0 && (
                            <div className="ml-2 mt-1 text-slate-700">
                              → {c.edges.outgoing.length} outgoing
                            </div>
                          )}
                        </div>
                      )}

                      {/* Critical Questions interface */}
                      <div className="pt-2 border-t border-cyan-500/20">
                        <div className="text-xs font-semibold mb-2 text-sky-900 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
                          Critical Questions:
                        </div>
                        <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-slate-900/10 shadow-lg">
                          <CriticalQuestions
                            targetType="claim"
                            targetId={c.id}
                            createdById="current"
                            deliberationId={deliberationId}
                          />
                        </div>
                      </div>

                      {/* Legal moves interface */}
                      <div className="pt-2 border-t border-cyan-500/20 mt-2">
                        <div className="text-xs font-semibold mb-2 text-sky-900 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
                          Legal Dialogical Moves:
                        </div>
                        <div className="bg-white/80 backdrop-blur-md p-3 rounded-xl border border-slate-900/10 shadow-lg">
                          <LegalMoveChips
                            deliberationId={deliberationId}
                            targetType="claim"
                            targetId={c.id}
                            locusPath="0"
                            onPosted={() => {
                              window.dispatchEvent(new CustomEvent("claims:changed"));
                              window.dispatchEvent(new CustomEvent("dialogue:moves:refresh"));
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show moves panel */}
                  {showMoves === c.id && c.moves && (
                    <div className="mt-3 pl-6 border-l-2 border-amber-500/40 bg-gradient-to-br from-amber-400/15 to-yellow-400/15 backdrop-blur-sm p-3 rounded-xl border border-amber-500/30 shadow-lg">
                      <div className="font-semibold mb-2 text-amber-900 text-xs flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                        Dialogical Activity:
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">WHY moves:</span> 
                          <span className="text-slate-700">{c.moves.whyCount} <span className="text-amber-800">(open: {c.moves.openWhys})</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">GROUNDS responses:</span> 
                          <span className="text-slate-700">{c.moves.groundsCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Concessions:</span> 
                          <span className="text-slate-700">{c.moves.concedeCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Retractions:</span> 
                          <span className="text-slate-700">{c.moves.retractCount}</span>
                        </div>
                      </div>
                      {c.moves.openWhys > 0 && (
                        <div className="mt-3 pt-2 border-t border-amber-500/20 text-amber-900 font-semibold text-xs flex items-center gap-2">
                          <span className="text-base">⚠️</span>
                          {c.moves.openWhys} open challenge{c.moves.openWhys > 1 ? "s" : ""} requiring response
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {enrichedClaims.length === 0 && (
              <div className="text-sm text-slate-500 text-center py-6 bg-slate-900/5 backdrop-blur-sm rounded-xl border border-slate-900/10">
                No claims yet.
              </div>
            )}
          </div>

          {(canShowMore || canCollapse) && (
            <div className="mt-4 flex items-center gap-3">
              {canShowMore && (
                <button
                  onClick={() => setLimit(n => n + PAGE_SIZE)}
                  className="text-sm px-4 py-2 rounded-xl bg-slate-900/5 backdrop-blur-md border border-slate-900/20 text-slate-900 hover:bg-slate-900/10 hover:border-slate-900/30 transition-all duration-200 font-medium shadow-sm"
                  aria-label={`Show ${Math.min(PAGE_SIZE, remaining)} more claims`}
                >
                  Show more{remaining > PAGE_SIZE ? ` (+${PAGE_SIZE})` : ` (+${remaining})`}
                </button>
              )}
              {canCollapse && (
                <button
                  onClick={() => setLimit(PAGE_SIZE)}
                  className="text-sm px-4 py-2 rounded-xl bg-slate-900/5 backdrop-blur-md border border-slate-900/20 text-slate-900 hover:bg-slate-900/10 hover:border-slate-900/30 transition-all duration-200 font-medium shadow-sm"
                >
                  Collapse
                </button>
              )}
              <span className="text-xs text-slate-600 font-medium">
                Showing {visibleClaims.length} of {enrichedClaims.length}
              </span>
            </div>
          )}

          <div className="text-[11px] text-slate-600 mt-5 pt-4 border-t border-slate-900/10 flex items-center gap-4 flex-wrap font-medium">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" /> IN
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" /> OUT
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-sm" /> UNDEC
            </span>
            <span className="text-slate-500">(grounded semantics)</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">R=Rebuts, U=Undercuts, M=Undermines</span>
          </div>

          {/* CQ Modal */}
          {cqOpenFor && (
            <Dialog open onOpenChange={(o) => { if (!o) setCqOpenFor(null); }}>
              <DialogContent className="relative bg-white/95 backdrop-blur-xl rounded-xl sm:max-w-[880px] shadow-2xl overflow-hidden">
                {/* Glass overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/5 via-transparent to-slate-900/10 pointer-events-none" />
                
                {/* Radial light */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(56,189,248,0.08),transparent_50%)] pointer-events-none" />
                
                {/* Water droplets */}
                <div className="absolute top-10 right-20 w-24 h-24 bg-sky-400/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 left-10 w-32 h-32 bg-cyan-400/8 rounded-full blur-3xl animate-pulse delay-1000" />
                
                <div className="relative z-10">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-sky-900 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
                      Claim-level Critical Questions
                    </DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <CriticalQuestions
                      targetType="claim"
                      targetId={cqOpenFor}
                      createdById="current"
                      deliberationId={deliberationId}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
      </div>
    </div>
  );
}
