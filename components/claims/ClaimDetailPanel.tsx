"use client";
import * as React from "react";
import useSWR from "swr";
import { Activity, Link as LinkIcon, Tag } from "lucide-react";
import { ClaimContraryManager } from "@/components/claims/ClaimContraryManager";

const fetcher = (url: string) => fetch(url).then(r => r.json());

type ClaimDetailPanelProps = {
  claimId: string;
  deliberationId: string;
  className?: string;
  claimText?: string; // Optional: Claim text for contraries manager
};

/**
 * ClaimDetailPanel - Expandable panel showing rich metadata for a claim
 * Used in ArgumentCardV2 for premises and conclusion
 * 
 * Fetches data from:
 * - /api/deliberations/[id]/ceg/mini/[claimId] - CEG label, confidence, metrics (support/attack strength, controversial flag, hub status)
 * - /api/deliberations/[id]/moves?targetId=[claimId] - Dialogical activity (WHY, GROUNDS, CONCEDE, RETRACT)
 * - /api/claims/[id]/citations - Citations attached to the claim
 * - /api/cqs?targetType=claim&targetId=[claimId] - Critical Question completion status
 * 
 * Displays:
 * - CEG Labels (IN, OUT, UNDEC) with confidence
 * - CEG Metrics (Controversial, Hub with centrality score)
 * - Dialogical Activity (WHY, GROUNDS, Concessions, Retractions)
 * - Critical Question completion percentage
 * - Citations with links
 */
export function ClaimDetailPanel({ claimId, deliberationId, className = "", claimText }: ClaimDetailPanelProps) {
  const [expanded, setExpanded] = React.useState(false);

  // Fetch CEG data for this specific claim (includes label, confidence, metrics)
  const { data: cegData } = useSWR(
    expanded ? `/api/deliberations/${deliberationId}/ceg/mini/${claimId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Fetch dialogical moves
  const { data: movesData } = useSWR(
    expanded ? `/api/deliberations/${deliberationId}/moves?targetId=${claimId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Fetch citations
  const { data: citationsData } = useSWR(
    expanded ? `/api/claims/${claimId}/citations` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Fetch CQ status
  const { data: cqData } = useSWR(
    expanded ? `/api/cqs?targetType=claim&targetId=${claimId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const cegNode = cegData?.node;
  const citations = citationsData?.citations || [];
  const label = cegNode?.label || "UNDEC";
  const isControversial = cegNode?.isControversial || false;
  
  // Compute dialogical activity from moves
  const dialogicalActivity = React.useMemo(() => {
    const allMoves = movesData?.moves || [];
    const whyMoves = allMoves.filter((m: any) => m.kind === "WHY");
    const groundsMoves = allMoves.filter((m: any) => m.kind === "GROUNDS");
    const concessions = allMoves.filter((m: any) => m.kind === "CONCEDE");
    const retractions = allMoves.filter((m: any) => m.kind === "RETRACT");
    const openWhys = whyMoves.filter((m: any) => !m.resolved).length;
    
    return {
      whyCount: whyMoves.length,
      openWhys,
      groundsCount: groundsMoves.length,
      concedeCount: concessions.length,
      retractCount: retractions.length
    };
  }, [movesData]);

  // Compute CQ completion
  const cqCompletion = React.useMemo(() => {
    if (!cqData?.schemes) return null;
    let required = 0;
    let satisfied = 0;
    cqData.schemes.forEach((scheme: any) => {
      const cqs = scheme.cqs || [];
      required += cqs.length;
      satisfied += cqs.filter((cq: any) => cq.satisfied).length;
    });
    if (required === 0) return null;
    return { required, satisfied, percentage: Math.round((satisfied / required) * 100) };
  }, [cqData]);

  const hasActivity = dialogicalActivity.whyCount + dialogicalActivity.groundsCount + 
                      dialogicalActivity.concedeCount + dialogicalActivity.retractCount > 0;
  
  // Check if claim has any meaningful data to display
  const hasCegData = cegNode && (
    cegNode.inDegree > 0 || 
    cegNode.outDegree > 0 || 
    cegNode.isControversial ||
    cegNode.label !== "UNDEC"
  );
  
  const hasContent = hasActivity || citations.length > 0 || hasCegData || cqCompletion !== null;

  // Always show the expand button, even if no content yet
  return (
    <div className={`${className}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100/50 rounded-lg transition-colors flex items-center justify-between group"
      >
        <span className="flex items-center gap-2">
          <span className={`transform transition-transform ${expanded ? "rotate-90" : ""}`}>▶</span>
          <span>Claim Details</span>
          {!expanded && hasContent && (
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded-full">
              {[
                hasActivity && "activity",
                citations.length > 0 && `${citations.length} cite`,
                isControversial && "controversial",
                label !== "UNDEC" && label
              ].filter(Boolean).join(", ")}
            </span>
          )}
         
        </span>
      </button>

      {expanded && (
        <div className="px-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Show message if no content yet */}
          {!hasContent && (
            <div className="px-2 py-1 text-xs text-slate-500 italic bg-slate-50/50 rounded-lg border border-slate-200">
              No additional data yet. Check back after dialogical activity, citations, or CEG evaluation.
            </div>
          )}

          {/* Metrics Row */}
          {hasContent && (
            <div className="flex items-center gap-2 flex-wrap px-3">
              {cqCompletion && (
                <span className={`text-[11px] px-2 py-1 rounded-lg font-medium border ${
                  cqCompletion.percentage === 100
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  CQ {cqCompletion.percentage}%
                </span>
              )}
              {label !== "UNDEC" && (
                <span className="text-[11px] px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {label}
                </span>
              )}
              {isControversial && (
                <span className="text-[11px] px-2 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 font-medium">
                  ⚖️ Controversial
                </span>
              )}
              {cegNode && cegNode.centrality > 4 && (
                <span className="text-[11px] px-2 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                  🔗 Hub ({cegNode.centrality})
                </span>
              )}
            </div>
          )}

          {/* CEG Graph Structure */}
          {cegNode && (cegNode.inDegree > 0 || cegNode.outDegree > 0) && (
            <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-xs font-semibold text-slate-700 mb-2">
                Graph Position
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                {cegNode.inDegree > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Incoming edges:</span>
                    <span className="font-medium">{cegNode.inDegree}</span>
                  </div>
                )}
                {cegNode.outDegree > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Outgoing edges:</span>
                    <span className="font-medium">{cegNode.outDegree}</span>
                  </div>
                )}
                {cegNode.supportStrength > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-600">Support strength:</span>
                    <span className="font-medium text-emerald-700">{cegNode.supportStrength.toFixed(1)}</span>
                  </div>
                )}
                {cegNode.attackStrength > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-rose-600">Attack strength:</span>
                    <span className="font-medium text-rose-700">{cegNode.attackStrength.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dialogical Activity */}
          {hasActivity && (
            <div className="px-3 py-2 bg-amber-50/50 rounded-lg border border-amber-200">
              <div className="text-xs font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" />
                Dialogical Activity
              </div>
              <div className="space-y-1 text-xs text-slate-700">
                {dialogicalActivity.whyCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span>WHY moves:</span>
                    <span className="font-medium">
                      {dialogicalActivity.whyCount}
                      {dialogicalActivity.openWhys > 0 && (
                        <span className="text-amber-700"> ({dialogicalActivity.openWhys} open)</span>
                      )}
                    </span>
                  </div>
                )}
                {dialogicalActivity.groundsCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span>GROUNDS responses:</span>
                    <span className="font-medium">{dialogicalActivity.groundsCount}</span>
                  </div>
                )}
                {dialogicalActivity.concedeCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Concessions:</span>
                    <span className="font-medium">{dialogicalActivity.concedeCount}</span>
                  </div>
                )}
                {dialogicalActivity.retractCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Retractions:</span>
                    <span className="font-medium">{dialogicalActivity.retractCount}</span>
                  </div>
                )}
              </div>
              {dialogicalActivity.openWhys > 0 && (
                <div className="mt-2 pt-2 border-t border-amber-300 text-amber-900 font-semibold text-xs flex items-center gap-2">
                  ⚠️ {dialogicalActivity.openWhys} open challenge{dialogicalActivity.openWhys > 1 ? "s" : ""}
                </div>
              )}
            </div>
          )}

          {/* Contrary Claims (ASPIC+ Phase D-1) */}
          <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
            <ClaimContraryManager
              deliberationId={deliberationId}
              claimId={claimId}
              claimText={claimText || cegNode?.text || ""}
            />
          </div>

          {/* Citations */}
          {citations.length > 0 && (
            <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <LinkIcon className="w-3.5 h-3.5" />
                Citations ({citations.length})
              </div>
              <div className="space-y-1.5">
                {citations.map((citation: any) => (
                  <a
                    key={citation.id}
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-slate-600 hover:text-indigo-600 hover:underline truncate"
                  >
                    {citation.title || citation.url}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
