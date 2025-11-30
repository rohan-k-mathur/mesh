"use client";

import * as React from "react";
import useSWR from "swr";
import { StrategyInspector } from "../StrategyInspector";
import { CorrespondenceViewer } from "../CorrespondenceViewer";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="stat-card border rounded-lg p-3 bg-white">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-semibold text-slate-600">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
    </div>
  );
}

export function AnalysisOverview({ designId }: { designId: string }) {
  const [runningAnalysis, setRunningAnalysis] = React.useState(false);

  // Fetch basic stats
  const { data: designData, mutate: mutateDesign } = useSWR(
    designId ? `/api/ludics/designs/${designId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: viewsData, mutate: mutateViews } = useSWR(
    designId ? `/api/ludics/dds/views?designId=${designId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: chroniclesData, mutate: mutateChronicles } = useSWR(
    designId ? `/api/ludics/dds/chronicles?designId=${designId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: strategyData, mutate: mutateStrategy } = useSWR(
    designId ? `/api/ludics/dds/strategy/innocence?designId=${designId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const runFullAnalysis = async () => {
    setRunningAnalysis(true);
    try {
      // Run all analyses in parallel
      await Promise.all([
        fetch(`/api/ludics/dds/views`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ designId }),
        }),
        fetch(`/api/ludics/dds/chronicles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ designId }),
        }),
        fetch("/api/ludics/dds/strategy/innocence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ designId }),
        }),
        fetch("/api/ludics/dds/strategy/propagation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ designId }),
        }),
      ]);

      // Refetch all data
      await Promise.all([
        mutateDesign(),
        mutateViews(),
        mutateChronicles(),
        mutateStrategy(),
      ]);
    } finally {
      setRunningAnalysis(false);
    }
  };

  const actsCount = designData?.design?.acts?.length || 0;
  const viewsCount = viewsData?.views?.length || viewsData?.count || 0;
  const chroniclesCount = chroniclesData?.chronicles?.length || chroniclesData?.count || 0;

  return (
    <div className="analysis-overview space-y-4">
      {/* Header with Run Analysis Button */}
      <div className="flex items-center justify-between pb-3 border-b">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Design Analysis</h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Complete Games Semantics correspondence check
          </p>
        </div>
        <button
          onClick={runFullAnalysis}
          disabled={runningAnalysis}
          className="px-4 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 font-medium"
        >
          {runningAnalysis ? "Analyzing..." : "Run Full Analysis"}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Actions" value={actsCount} icon="🔷" />
        <StatCard label="Views" value={viewsCount} icon="👁" />
        <StatCard label="Chronicles" value={chroniclesCount} icon="📜" />
      </div>

      {/* Strategy Status */}
      {strategyData && (
        <div className="strategy-status border rounded-lg p-3 bg-slate-50">
          <div className="text-xs font-semibold text-slate-700 mb-2">Strategy Status</div>
          <div className="flex gap-2">
            <span
              className={`px-2 py-1 rounded text-xs font-bold ${
                strategyData.isInnocent
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {strategyData.isInnocent ? "✓ Innocent" : "⚠ Not Innocent"}
            </span>
          </div>
        </div>
      )}

      {/* Inline Strategy Analysis */}
      <div className="strategy-section">
        <StrategyInspector designId={designId} />
      </div>

      {/* Inline Correspondence */}
      <div className="correspondence-section">
        <CorrespondenceViewer
          designId={designId}
          strategyId={strategyData?.strategyId}
        />
      </div>
    </div>
  );
}
