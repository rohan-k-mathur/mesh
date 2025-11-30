"use client";

import * as React from "react";
import useSWR from "swr";
import type { View } from "@/packages/ludics-core/dds/views";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function ViewCard({
  view,
  index,
  selected,
  onSelect,
}: {
  view: View;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`view-card text-left p-2 rounded border transition ${
        selected
          ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200"
          : "bg-white hover:bg-slate-50 border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono font-semibold text-slate-700">
          View {index + 1}
        </span>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
            view.player === "P"
              ? "bg-sky-100 text-sky-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {view.player}
        </span>
      </div>
      <div className="text-[10px] text-slate-500">
        {view.sequence?.length || 0} actions
      </div>
    </button>
  );
}

export function ViewsExplorer({
  designId,
  selectedView,
  onSelectView,
}: {
  designId: string;
  selectedView: View | null;
  onSelectView: (view: View) => void;
}) {
  const { data, isLoading, mutate } = useSWR(
    designId ? `/api/ludics/dds/views?designId=${designId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const views = (data?.views || []) as View[];

  const computeViews = async () => {
    await fetch(`/api/ludics/dds/views`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ designId }),
    });
    await mutate();
  };

  return (
    <div className="views-explorer space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">Views Explorer</h3>
        <button
          onClick={computeViews}
          className="px-3 py-1 text-xs rounded bg-slate-700 text-white hover:bg-slate-800"
        >
          Recompute Views
        </button>
      </div>

      {/* Description */}
      <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border">
        <strong>Views</strong> extract the P-visible subsequence from positions.
        Definition 3.5: p̄ = subsequence of p containing only P actions and their
        immediate O heirs.
      </div>

      {/* Views List */}
      {isLoading ? (
        <div className="text-xs text-slate-500">Loading views...</div>
      ) : (
        <div className="views-grid grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
          {views.map((view, idx) => (
            <ViewCard
              key={view.id || idx}
              view={view}
              index={idx}
              selected={selectedView?.id === view.id}
              onSelect={() => onSelectView(view)}
            />
          ))}
        </div>
      )}

      {!isLoading && views.length === 0 && (
        <div className="text-xs text-slate-500 italic text-center py-8">
          No views found. Click &quot;Recompute Views&quot; to extract.
        </div>
      )}

      {/* Selected View Details */}
      {selectedView && (
        <div className="selected-view-details border-t pt-3 mt-3">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">
            View Details
          </h4>
          <div className="bg-white border rounded p-3 space-y-2 text-xs">
            <div>
              <span className="font-semibold">Player:</span> {selectedView.player}
            </div>
            <div>
              <span className="font-semibold">Length:</span>{" "}
              {selectedView.sequence?.length || 0} actions
            </div>
            <div>
              <span className="font-semibold">Sequence:</span>
              <pre className="mt-1 p-2 bg-slate-50 rounded text-[10px] overflow-x-auto">
                {JSON.stringify(selectedView.sequence, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
