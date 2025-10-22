// components/arguments/ArgumentCard.tsx
"use client";
import * as React from "react";
import { ChevronDown, ChevronRight, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import useSWR from "swr";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AttackMenuPro } from "./AttackMenuPro";
import CriticalQuestions from "@/components/claims/CriticalQuestionsV2";

const fetcher = (url: string) => fetch(url).then(r => r.json());

type Prem = { id: string; text: string };

interface ArgumentCardProps {
  deliberationId: string;
  authorId: string;
  id: string;
  conclusion: { id: string; text: string };
  premises: Prem[];
  onAnyChange?: () => void;
  schemeKey?: string | null;
  schemeName?: string | null;
}

export function ArgumentCard({
  deliberationId,
  authorId,
  id,
  conclusion,
  premises,
  onAnyChange,
  schemeKey,
  schemeName,
}: ArgumentCardProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [attacks, setAttacks] = React.useState<any[]>([]);
  const [cqDialogOpen, setCqDialogOpen] = React.useState(false);

  // Fetch CQ data for the conclusion claim
  const { data: cqData } = useSWR(
    conclusion?.id ? `/api/cqs?targetType=claim&targetId=${conclusion.id}` : null,
    fetcher
  );

  // Compute CQ status
  const cqStatus = React.useMemo(() => {
    if (!cqData) return null;
    // Handle different API response formats
    const cqArray = Array.isArray(cqData) ? cqData : (cqData?.items || cqData?.cqs || []);
    if (cqArray.length === 0) return null;
    const required = cqArray.length;
    const satisfied = cqArray.filter((cq: any) => cq.satisfied).length;
    const percentage = required > 0 ? Math.round((satisfied / required) * 100) : 0;
    return { required, satisfied, percentage };
  }, [cqData]);

  // Fetch attacks when expanded - from both ArgumentEdge and ConflictApplication
  // We need both sources because:
  // - ArgumentEdge: Created when both attacking and target are Arguments
  // - ConflictApplication: Created when attacking with a Claim (e.g., undercuts with exception text)
  React.useEffect(() => {
    if (!expanded) return;
    
    const fetchAttacks = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch from both sources in parallel
        const [edgesRes, caRes] = await Promise.all([
          fetch(`/api/arguments/${id}/attacks`, { cache: "no-store" }),
          fetch(`/api/ca?targetArgumentId=${id}`, { cache: "no-store" })
        ]);

        const edgesData = edgesRes.ok ? await edgesRes.json() : { items: [] };
        const caData = caRes.ok ? await caRes.json() : { items: [] };

        // Combine ArgumentEdge items
        const edgeAttacks = (edgesData.items || []).map((edge: any) => ({
          id: edge.id,
          attackType: edge.attackType,
          targetScope: edge.targetScope,
          fromArgumentId: edge.fromArgumentId,
          source: "edge"
        }));

        // Convert ConflictApplications to attack format
        const caAttacks = (caData.items || [])
          .filter((ca: any) => ca.conflictedArgumentId === id && ca.legacyAttackType)
          .map((ca: any) => ({
            id: ca.id,
            attackType: ca.legacyAttackType,
            targetScope: ca.legacyTargetScope,
            fromArgumentId: ca.conflictingArgumentId,
            fromClaimId: ca.conflictingClaimId,
            source: "ca"
          }));

        // Merge both sources
        const allAttacks = [...edgeAttacks, ...caAttacks];
        setAttacks(allAttacks);
      } catch (err) {
        console.error("Failed to fetch attacks:", err);
        setError("Failed to load attacks");
      } finally {
        setLoading(false);
      }
    };

    fetchAttacks();
  }, [expanded, id]);

  const handleRefresh = React.useCallback(() => {
    // Refresh local attack list from both sources
    if (expanded) {
      Promise.all([
        fetch(`/api/arguments/${id}/attacks`, { cache: "no-store" }),
        fetch(`/api/ca?targetArgumentId=${id}`, { cache: "no-store" })
      ]).then(async ([edgesRes, caRes]) => {
        const edgesData = edgesRes.ok ? await edgesRes.json() : { items: [] };
        const caData = caRes.ok ? await caRes.json() : { items: [] };

        const edgeAttacks = (edgesData.items || []).map((edge: any) => ({
          id: edge.id,
          attackType: edge.attackType,
          targetScope: edge.targetScope,
          fromArgumentId: edge.fromArgumentId,
          source: "edge"
        }));

        const caAttacks = (caData.items || [])
          .filter((ca: any) => ca.conflictedArgumentId === id && ca.legacyAttackType)
          .map((ca: any) => ({
            id: ca.id,
            attackType: ca.legacyAttackType,
            targetScope: ca.legacyTargetScope,
            fromArgumentId: ca.conflictingArgumentId,
            fromClaimId: ca.conflictingClaimId,
            source: "ca"
          }));

        setAttacks([...edgeAttacks, ...caAttacks]);
      }).catch(console.error);
    }
    // Notify parent
    onAnyChange?.();
  }, [expanded, id, onAnyChange]);

  const rebutAttacks = attacks.filter(a => a.attackType === "REBUTS");
  const undercutAttacks = attacks.filter(a => a.attackType === "UNDERCUTS");
  const undermineAttacks = attacks.filter(a => a.attackType === "UNDERMINES");

  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                {conclusion.text}
              </div>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                {schemeName && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200">
                    <div className="text-[10px] font-medium text-indigo-700 uppercase tracking-wide">
                      {schemeName}
                    </div>
                  </div>
                )}
                {cqStatus && cqStatus.required > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200">
                    <div className="text-[10px] font-medium text-amber-700">
                      CQ {cqStatus.percentage}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* CQs button */}
          {cqStatus && cqStatus.required > 0 && (
            <button
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition-colors duration-200"
              onClick={() => setCqDialogOpen(true)}
              aria-label="View critical questions"
            >
              CQs
            </button>
          )}
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors duration-200 shrink-0"
            onClick={() => setExpanded(x => !x)}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse argument" : "Expand argument"}
          >
            {expanded ? (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                Collapse
              </>
            ) : (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                Expand
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview when collapsed */}
      {!expanded && premises.length > 0 && (
        <div className="text-xs text-slate-600 leading-relaxed border-l-2 border-slate-200 pl-3">
          <span className="font-medium text-slate-700">Premises:</span>{" "}
          {premises.map(p => p.text).join(" • ")}
        </div>
      )}

      {/* Expanded view */}
      {expanded && (
        <div className="space-y-4 pt-2 border-t border-slate-200">
          {/* Premises section */}
          {premises.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Premises
                </h4>
                {undermineAttacks.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] font-medium text-amber-700">
                    <AlertCircle className="w-3 h-3" />
                    {undermineAttacks.length} challenge{undermineAttacks.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <ul className="space-y-2">
                {premises.map(p => (
                  <li
                    key={p.id}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span className="text-xs text-slate-700 leading-relaxed flex-1">
                      {p.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-800 leading-relaxed">
                  <strong>No premises found.</strong> This argument may be a bare assertion.
                </div>
              </div>
            </div>
          )}

          {/* Inference/Reasoning section */}
          <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-indigo-900 uppercase tracking-wide">
                Inference
              </h4>
              {undercutAttacks.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-300 text-[10px] font-medium text-amber-700">
                  <AlertCircle className="w-3 h-3" />
                  {undercutAttacks.length} exception{undercutAttacks.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <p className="text-xs text-indigo-800 leading-relaxed">
              The reasoning that connects the premises to the conclusion.
              {schemeKey && (
                <span className="block mt-1 font-medium">
                  Using scheme: {schemeName || schemeKey}
                </span>
              )}
            </p>
          </div>

          {/* Attacks summary */}
          {(loading || attacks.length > 0) && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Active Challenges
              </h4>
              {loading ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  <span className="text-xs text-slate-600">Loading challenges...</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {rebutAttacks.length > 0 && (
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                      <span className="text-xs font-medium text-rose-700">
                        {rebutAttacks.length} Rebuttal{rebutAttacks.length !== 1 ? "s" : ""} (challenging conclusion)
                      </span>
                    </div>
                  )}
                  {undercutAttacks.length > 0 && (
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                      <span className="text-xs font-medium text-amber-700">
                        {undercutAttacks.length} Undercut{undercutAttacks.length !== 1 ? "s" : ""} (challenging reasoning)
                      </span>
                    </div>
                  )}
                  {undermineAttacks.length > 0 && (
                    <div className="p-2 rounded-lg bg-orange-50 border border-orange-200">
                      <span className="text-xs font-medium text-orange-700">
                        {undermineAttacks.length} Undermine{undermineAttacks.length !== 1 ? "s" : ""} (challenging premises)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <div className="text-xs text-red-800">{error}</div>
              </div>
            </div>
          )}

          {/* Attack menu */}
          <div className="pt-2 border-t border-slate-200">
            <AttackMenuPro
              deliberationId={deliberationId}
              authorId={authorId}
              target={{ id, conclusion, premises }}
              onDone={handleRefresh}
            />
          </div>
        </div>
      )}

      {/* CQ Dialog */}
      <Dialog open={cqDialogOpen} onOpenChange={setCqDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Critical Questions</DialogTitle>
          </DialogHeader>
          {conclusion?.id && (
            <CriticalQuestions
              targetType="claim"
              targetId={conclusion.id}
              deliberationId={deliberationId}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
