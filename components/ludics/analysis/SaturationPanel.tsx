/**
 * Phase 5: Saturation Analysis Panel
 * UI for saturation checking and closure computation
 */

"use client";

import * as React from "react";
import useSWR from "swr";

const fetcher = (u: string) => fetch(u, { cache: "no-store" }).then((r) => r.json());

interface SaturationPanelProps {
  strategyId?: string;
  designId: string;
}

type SaturationResult = {
  strategyId: string;
  isSaturated: boolean;
  proof?: any;
  violations?: Array<{
    type: string;
    designIds: string[];
  }>;
};

export function SaturationPanel({ strategyId, designId }: SaturationPanelProps) {
  const [checkInProgress, setCheckInProgress] = React.useState(false);
  const [saturationResult, setSaturationResult] = React.useState<SaturationResult | null>(null);
  const [computeClosureMode, setComputeClosureMode] = React.useState(false);

  // Fetch existing saturation check if strategyId provided
  const { data: existingData, mutate: refetch } = useSWR(
    strategyId ? `/api/ludics/dds/analysis/saturation?strategyId=${strategyId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  React.useEffect(() => {
    if (existingData?.isSaturated !== undefined) {
      setSaturationResult(existingData);
    }
  }, [existingData]);

  const checkSaturation = async () => {
    if (!strategyId) return;
    
    setCheckInProgress(true);
    try {
      const url = computeClosureMode
        ? `/api/ludics/dds/analysis/saturation?strategyId=${strategyId}&closure=true`
        : `/api/ludics/dds/analysis/saturation?strategyId=${strategyId}`;
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.ok) {
        setSaturationResult(result);
        refetch();
      }
    } catch (error) {
      console.error("Saturation check failed:", error);
    } finally {
      setCheckInProgress(false);
    }
  };

  return (
    <div className="saturation-panel border rounded-lg bg-white/70 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-800">Saturation Analysis</h4>
          <div className="text-[10px] text-slate-500">Proposition 4.17: Views(S) = S</div>
        </div>
        {strategyId && (
          <button
            onClick={checkSaturation}
            disabled={checkInProgress}
            className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-800 text-white rounded transition disabled:opacity-50"
          >
            {checkInProgress ? "Checking..." : "Check Saturation"}
          </button>
        )}
      </div>

      {/* Explanation */}
      <div className="text-xs text-slate-600 bg-blue-50 border border-blue-200 rounded p-3">
        <strong>What is saturation?</strong>
        <p className="mt-1">
          A strategy S is <em>saturated</em> if extracting views and reconstructing gives back the same strategy:
        </p>
        <div className="font-mono text-center my-2 text-blue-700">
          Views(S) = S
        </div>
        <p>
          This is a fixpoint property that ensures the strategy is &quot;complete&quot; with respect to its view structure.
        </p>
      </div>

      {/* Options */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={computeClosureMode}
            onChange={(e) => setComputeClosureMode(e.target.checked)}
            className="rounded"
          />
          Compute saturation closure (expand to fixpoint)
        </label>
      </div>

      {/* No Strategy Warning */}
      {!strategyId && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
          <strong>No strategy selected.</strong> Run strategy analysis first to generate a strategy from this design.
        </div>
      )}

      {/* Result */}
      {saturationResult && (
        <div
          className={`rounded-lg p-4 ${
            saturationResult.isSaturated
              ? "bg-emerald-50 border border-emerald-200"
              : "bg-amber-50 border border-amber-200"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">
              {saturationResult.isSaturated ? "✓" : "⚠"}
            </span>
            <div>
              <div
                className={`font-bold ${
                  saturationResult.isSaturated ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {saturationResult.isSaturated ? "Saturated Strategy" : "Not Saturated"}
              </div>
              <div className="text-xs text-slate-600">
                {saturationResult.isSaturated
                  ? "Views(S) = S holds"
                  : "Views(S) ≠ S - expansion needed"}
              </div>
            </div>
          </div>

          {/* Violations */}
          {saturationResult.violations && saturationResult.violations.length > 0 && (
            <div className="mt-3 border-t pt-3">
              <div className="text-xs font-semibold text-amber-800 mb-2">Violations:</div>
              <div className="space-y-2">
                {saturationResult.violations.map((v, idx) => (
                  <div key={idx} className="text-xs bg-white/50 rounded p-2">
                    <div className="font-medium text-amber-700">
                      {v.type === "missing_in_reconstruction"
                        ? "Missing in reconstruction"
                        : "Extra in reconstruction"}
                    </div>
                    <div className="text-slate-600 mt-1">
                      Designs: {v.designIds.map(id => id.slice(0, 8)).join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proof (if saturated) */}
          {saturationResult.isSaturated && saturationResult.proof && (
            <div className="mt-3 border-t pt-3">
              <div className="text-xs font-semibold text-emerald-800 mb-2">Proof Structure:</div>
              <div className="text-xs text-slate-600 bg-white/50 rounded p-2 font-mono">
                Views extracted: {saturationResult.proof.views?.length ?? 0}
                <br />
                Plays computed: {saturationResult.proof.playsDesigns?.length ?? 0}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saturation Visual */}
      <div className="bg-slate-50 rounded-lg p-3">
        <div className="text-xs font-semibold text-slate-700 mb-2">Saturation Process</div>
        <div className="flex items-center gap-2 text-xs">
          <div className="px-2 py-1 bg-white rounded border">Strategy S</div>
          <span className="text-slate-400">→</span>
          <div className="px-2 py-1 bg-white rounded border">Views(S)</div>
          <span className="text-slate-400">→</span>
          <div className="px-2 py-1 bg-white rounded border">Plays(Views(S))</div>
          <span className="text-slate-400">=?</span>
          <div className={`px-2 py-1 rounded border ${
            saturationResult?.isSaturated
              ? "bg-emerald-100 border-emerald-300"
              : "bg-slate-100"
          }`}>
            S
          </div>
        </div>
      </div>
    </div>
  );
}

export default SaturationPanel;
