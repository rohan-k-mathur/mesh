/**
 * Phase 5: Behaviour Panel
 * UI for orthogonality testing and biorthogonal closure computation
 */

"use client";

import * as React from "react";
import useSWR from "swr";

const fetcher = (u: string) => fetch(u, { cache: "no-store" }).then((r) => r.json());

interface StrategyOption {
  id: string;
  designId: string;
  player: string;
  isInnocent: boolean;
  satisfiesPropagation: boolean;
  label: string;
  design?: {
    participantId?: string;
    scope?: string;
  };
}

interface BehaviourPanelProps {
  strategyId?: string;
  designId: string;
  deliberationId?: string;
  onStrategyChange?: (strategyId: string) => void;
}

type OrthogonalityResult = {
  isOrthogonal: boolean;
  strategyAId: string;
  strategyBId: string;
  reason?: string;
  counterExamples?: Array<{
    designA: string;
    designB: string;
    reason: string;
  }>;
};

type ClosureResult = {
  strategyId?: string;
  closureIds?: string[];
  closedDesignIds?: string[];
  iterationsNeeded?: number;
  iterations?: number;
  fixpointReached?: boolean;
  isClosed?: boolean;
  converged?: boolean;
  originalCount?: number;
  closedCount?: number;
};

export function BehaviourPanel({ strategyId, designId, deliberationId, onStrategyChange }: BehaviourPanelProps) {
  const [selectedStrategyId, setSelectedStrategyId] = React.useState(strategyId || "");
  const [compareStrategyId, setCompareStrategyId] = React.useState("");
  const [orthResult, setOrthResult] = React.useState<OrthogonalityResult | null>(null);
  const [closureResult, setClosureResult] = React.useState<ClosureResult | null>(null);
  const [loading, setLoading] = React.useState<"orth" | "closure" | null>(null);
  const [activeTab, setActiveTab] = React.useState<"orth" | "closure" | "game">("orth");

  // Fetch available strategies for the deliberation
  const { data: strategiesData } = useSWR<{ ok: boolean; strategies: StrategyOption[] }>(
    deliberationId ? `/api/ludics/strategies?deliberationId=${encodeURIComponent(deliberationId)}` : null,
    fetcher
  );

  const strategies = strategiesData?.strategies || [];
  const effectiveStrategyId = selectedStrategyId || strategyId;

  // Update when strategyId prop changes
  React.useEffect(() => {
    if (strategyId && strategyId !== selectedStrategyId) {
      setSelectedStrategyId(strategyId);
    }
  }, [strategyId]);

  const handleStrategyChange = (id: string) => {
    setSelectedStrategyId(id);
    setOrthResult(null);
    setClosureResult(null);
    onStrategyChange?.(id);
  };

  // Check orthogonality between two strategies
  const checkOrthogonality = async () => {
    if (!effectiveStrategyId || !compareStrategyId) return;

    setLoading("orth");
    try {
      const response = await fetch(`/api/ludics/dds/behaviours/orthogonality`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategyAId: effectiveStrategyId,
          strategyBId: compareStrategyId,
        }),
      });
      const result = await response.json();
      if (result.ok !== false) {
        setOrthResult(result);
      }
    } catch (error) {
      console.error("Orthogonality check failed:", error);
    } finally {
      setLoading(null);
    }
  };

  // Compute biorthogonal closure
  const computeClosure = async () => {
    if (!effectiveStrategyId) return;

    setLoading("closure");
    try {
      const response = await fetch(`/api/ludics/dds/behaviours/closure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategyIds: [effectiveStrategyId],
        }),
      });
      const result = await response.json();
      if (result.ok !== false) {
        setClosureResult(result);
      }
    } catch (error) {
      console.error("Closure computation failed:", error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="behaviour-panel border rounded-lg bg-white/70 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-800">Behaviour Analysis</h4>
          <div className="text-[10px] text-slate-500">Orthogonality & Biorthogonal Closure</div>
        </div>
      </div>

      {/* Strategy Selector */}
      <div className="strategy-selector">
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Select Strategy
        </label>
        <select
          value={selectedStrategyId}
          onChange={(e) => handleStrategyChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        >
          <option value="">Select a strategy...</option>
          {strategies.map((s) => (
            <option key={s.id} value={s.id}>
              {s.player}-Strategy • {s.design?.participantId || "design"} {s.isInnocent ? "✓ innocent" : ""}
            </option>
          ))}
        </select>
        {strategies.length === 0 && deliberationId && (
          <p className="text-xs text-slate-400 mt-1">
            No strategies found. Run the compiler to generate strategies from designs.
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["orth", "closure", "game"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-xs transition -mb-px ${
              activeTab === tab
                ? "border-b-2 border-purple-500 text-purple-700 font-medium"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab === "orth" ? "Orthogonality" : tab === "closure" ? "Closure" : "Game"}
          </button>
        ))}
      </div>

      {/* Orthogonality Tab */}
      {activeTab === "orth" && (
        <div className="space-y-4">
          {/* Explanation */}
          <div className="text-xs text-slate-600 bg-purple-50 border border-purple-200 rounded p-3">
            <strong>Orthogonality (⊥)</strong>
            <p className="mt-1">
              Two designs D and E are <em>orthogonal</em> (D ⊥ E) if their interaction normalizes
              to a successful termination. This extends to strategies: S ⊥ T if every pair (D, E)
              with D ∈ S and E ∈ T is orthogonal.
            </p>
          </div>

          {/* Input */}
          <div className="space-y-2">
            <div className="text-xs text-slate-600">Compare with strategy:</div>
            <div className="flex gap-2">
              <select
                value={compareStrategyId}
                onChange={(e) => setCompareStrategyId(e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs border rounded bg-white"
              >
                <option value="">Select strategy to compare...</option>
                {strategies
                  .filter(s => s.id !== effectiveStrategyId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.player}-Strategy • {s.design?.participantId || "design"}
                    </option>
                  ))
                }
              </select>
              <button
                onClick={checkOrthogonality}
                disabled={!effectiveStrategyId || !compareStrategyId || loading === "orth"}
                className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition disabled:opacity-50"
              >
                {loading === "orth" ? "Checking..." : "Check ⊥"}
              </button>
            </div>
            {strategies.filter(s => s.id !== effectiveStrategyId).length === 0 && effectiveStrategyId && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2 mt-2">
                <strong>No other strategies available.</strong> Orthogonality requires at least two strategies 
                (typically one P-strategy and one O-strategy). Run the compiler on both Proponent and Opponent 
                designs to generate their strategies.
              </p>
            )}
          </div>

          {/* No Strategy Warning */}
          {!effectiveStrategyId && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              <strong>No strategy selected.</strong> Select a strategy above or run strategy analysis first.
            </div>
          )}

          {/* Orthogonality Result */}
          {orthResult && (
            <div
              className={`rounded-lg p-4 ${
                orthResult.isOrthogonal
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{orthResult.isOrthogonal ? "⊥" : "⊥̸"}</span>
                <div>
                  <div
                    className={`font-bold ${
                      orthResult.isOrthogonal ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {orthResult.isOrthogonal ? "Orthogonal" : "Not Orthogonal"}
                  </div>
                  <div className="text-xs text-slate-600">{orthResult.reason}</div>
                </div>
              </div>

              {/* Counter-examples */}
              {orthResult.counterExamples && orthResult.counterExamples.length > 0 && (
                <div className="mt-3 border-t pt-3">
                  <div className="text-xs font-semibold text-red-800 mb-2">Counter-examples:</div>
                  <div className="space-y-2">
                    {orthResult.counterExamples.slice(0, 3).map((ce, idx) => (
                      <div key={idx} className="text-xs bg-white/50 rounded p-2 font-mono">
                        D: {ce.designA.slice(0, 12)}... ⊥̸ E: {ce.designB.slice(0, 12)}...
                        <div className="text-slate-500 mt-1">{ce.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Closure Tab */}
      {activeTab === "closure" && (
        <div className="space-y-4">
          {/* Explanation */}
          <div className="text-xs text-slate-600 bg-indigo-50 border border-indigo-200 rounded p-3">
            <strong>Biorthogonal Closure (S⊥⊥)</strong>
            <p className="mt-1">
              The biorthogonal closure S⊥⊥ of a strategy S contains all designs orthogonal to everything
              orthogonal to S. This is the smallest <em>behaviour</em> containing S.
            </p>
            <div className="font-mono text-center my-2 text-indigo-700">
              S⊥⊥ = {"{"} D | ∀E ∈ S⊥. D ⊥ E {"}"}
            </div>
          </div>

          {/* Action */}
          <div className="flex justify-between items-center">
            <div className="text-xs text-slate-600">
              Compute the behaviour generated by current strategy
            </div>
            <button
              onClick={computeClosure}
              disabled={!effectiveStrategyId || loading === "closure"}
              className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded transition disabled:opacity-50"
            >
              {loading === "closure" ? "Computing..." : "Compute S⊥⊥"}
            </button>
          </div>

          {/* No Strategy Warning */}
          {!effectiveStrategyId && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              <strong>No strategy selected.</strong> Select a strategy above first.
            </div>
          )}

          {/* Closure Result */}
          {closureResult && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">
                  {(closureResult.fixpointReached || closureResult.isClosed || closureResult.converged) ? "∞" : "↺"}
                </span>
                <div>
                  <div className="font-bold text-indigo-700">
                    {(closureResult.fixpointReached || closureResult.isClosed || closureResult.converged) 
                      ? "Fixpoint Reached" 
                      : "Closure Computed"}
                  </div>
                  <div className="text-xs text-slate-600">
                    {closureResult.iterationsNeeded || closureResult.iterations || 0} iteration(s)
                  </div>
                </div>
              </div>

              <div className="bg-white/50 rounded p-3">
                <div className="text-xs font-semibold text-indigo-800 mb-2">
                  Closure contains {closureResult.closedCount || (closureResult.closureIds || closureResult.closedDesignIds || []).length} design(s):
                </div>
                {(closureResult.closureIds || closureResult.closedDesignIds) && (closureResult.closureIds || closureResult.closedDesignIds)!.length > 0 ? (
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {(closureResult.closureIds || closureResult.closedDesignIds)!.map((id, idx) => (
                      <div key={id} className="text-xs font-mono text-slate-600">
                        {idx + 1}. {id.slice(0, 16)}...
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">
                    Original: {closureResult.originalCount || 1} → Closed: {closureResult.closedCount || 1}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game Tab */}
      {activeTab === "game" && (
        <div className="space-y-4">
          {/* Explanation */}
          <div className="text-xs text-slate-600 bg-teal-50 border border-teal-200 rounded p-3">
            <strong>Games from Behaviours</strong>
            <p className="mt-1">
              A <em>game</em> is defined as a pair of behaviours (A, A⊥) where A and A⊥ are
              mutually orthogonal. The positive player has strategies from A, the negative from A⊥.
            </p>
          </div>

          {/* Visual */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-slate-700 mb-3">Game Structure</div>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full border-2 border-blue-400 bg-blue-50 flex items-center justify-center">
                  <span className="text-blue-700 font-bold">A</span>
                </div>
                <div className="text-xs text-slate-600 mt-1">Positive</div>
              </div>
              <div className="text-lg text-slate-400">⊥</div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full border-2 border-rose-400 bg-rose-50 flex items-center justify-center">
                  <span className="text-rose-700 font-bold">A⊥</span>
                </div>
                <div className="text-xs text-slate-600 mt-1">Negative</div>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 text-center">
            Use the Closure tab to compute behaviours, then define games.
          </div>
        </div>
      )}
    </div>
  );
}

export default BehaviourPanel;
