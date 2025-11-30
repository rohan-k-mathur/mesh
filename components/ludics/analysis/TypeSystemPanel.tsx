/**
 * Phase 5: Type System Panel
 * UI for incarnation checking and type inference
 */

"use client";

import * as React from "react";
import useSWR from "swr";

const fetcher = (u: string) => fetch(u, { cache: "no-store" }).then((r) => r.json());

interface TypeSystemPanelProps {
  designId: string;
  deliberationId?: string;
  strategyId?: string;
}

type TypeStructure = {
  kind: "base" | "arrow" | "product" | "sum" | "variable";
  name?: string;
  left?: TypeStructure;
  right?: TypeStructure;
};

type TypeInference = {
  designId: string;
  inferredType: TypeStructure;
  confidence: number;
  method: "structural" | "behavioural";
  alternatives?: TypeStructure[];
};

type IncarnationResult = {
  sourceDesignId: string;
  targetDesignId: string;
  type: "lax" | "sharp";
  isValid: boolean;
  witnessActions?: any[];
};

export function TypeSystemPanel({ designId, deliberationId, strategyId }: TypeSystemPanelProps) {
  const [activeTab, setActiveTab] = React.useState<"inference" | "incarnation" | "check">("inference");
  const [checkInProgress, setCheckInProgress] = React.useState(false);
  const [incarnationResult, setIncarnationResult] = React.useState<IncarnationResult | null>(null);
  const [selectedTargetDesign, setSelectedTargetDesign] = React.useState<string>("");

  // Fetch type inference
  const { data: inferenceData, isLoading: inferenceLoading, mutate: refetchInference } = useSWR<{
    ok: boolean;
    inference: TypeInference;
  }>(
    designId ? `/api/ludics/dds/types/infer?designId=${designId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Fetch designs for incarnation comparison - use deliberationId if provided
  const { data: designsData } = useSWR(
    deliberationId ? `/api/ludics/designs?deliberationId=${deliberationId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  const designs = designsData?.designs ?? [];
  const otherDesigns = designs.filter((d: any) => d.id !== designId);

  const checkIncarnation = async (type: "lax" | "sharp") => {
    if (!selectedTargetDesign) return;
    
    setCheckInProgress(true);
    try {
      const response = await fetch("/api/ludics/dds/types/incarnation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceDesignId: designId,
          targetDesignId: selectedTargetDesign,
          type,
        }),
      });
      const result = await response.json();
      if (result.ok) {
        setIncarnationResult(result.incarnation);
      }
    } catch (error) {
      console.error("Incarnation check failed:", error);
    } finally {
      setCheckInProgress(false);
    }
  };

  const inference = inferenceData?.inference;

  return (
    <div className="type-system-panel border rounded-lg bg-white/70 overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b bg-slate-50">
        <button
          onClick={() => setActiveTab("inference")}
          className={`px-4 py-2 text-xs font-medium transition ${
            activeTab === "inference"
              ? "bg-white border-b-2 border-indigo-600 text-indigo-700"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          🔍 Type Inference
        </button>
        <button
          onClick={() => setActiveTab("incarnation")}
          className={`px-4 py-2 text-xs font-medium transition ${
            activeTab === "incarnation"
              ? "bg-white border-b-2 border-indigo-600 text-indigo-700"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          ⊂ Incarnation
        </button>
        <button
          onClick={() => setActiveTab("check")}
          className={`px-4 py-2 text-xs font-medium transition ${
            activeTab === "check"
              ? "bg-white border-b-2 border-indigo-600 text-indigo-700"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          ✓ Type Check
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Type Inference Tab */}
        {activeTab === "inference" && (
          <div className="inference-content">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-800">Inferred Type</h4>
              <button
                onClick={() => refetchInference()}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded transition"
              >
                Refresh
              </button>
            </div>

            {inferenceLoading && (
              <div className="text-xs text-slate-500 animate-pulse">Computing type...</div>
            )}

            {inference && (
              <div className="space-y-3">
                {/* Main Type Display */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                  <div className="font-mono text-sm text-indigo-800">
                    <TypeDisplay type={inference.inferredType} />
                  </div>
                </div>

                {/* Confidence */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">Confidence:</span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all"
                      style={{ width: `${inference.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-slate-700">
                    {(inference.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Method */}
                <div className="text-xs text-slate-500">
                  <span className="font-medium">Method:</span>{" "}
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded">
                    {inference.method}
                  </span>
                </div>

                {/* Alternatives */}
                {inference.alternatives && inference.alternatives.length > 0 && (
                  <div className="border-t pt-2">
                    <div className="text-xs text-slate-600 mb-1">Alternative typings:</div>
                    <div className="space-y-1">
                      {inference.alternatives.map((alt, idx) => (
                        <div
                          key={idx}
                          className="font-mono text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded"
                        >
                          <TypeDisplay type={alt} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!inference && !inferenceLoading && (
              <div className="text-xs text-slate-500">No type inference available</div>
            )}
          </div>
        )}

        {/* Incarnation Tab */}
        {activeTab === "incarnation" && (
          <div className="incarnation-content space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-800">Incarnation Check</h4>
              <div className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Definition 6.3
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
              Check if this design incarnates in (is a refinement of) another design.
              <br />
              <strong>Lax:</strong> D ⊂ E (actions subset) | <strong>Sharp:</strong> D ⊂⊂ E (branch containment)
            </div>

            {/* Target Selection */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600">Target Design:</label>
              <select
                value={selectedTargetDesign}
                onChange={(e) => setSelectedTargetDesign(e.target.value)}
                className="flex-1 text-xs border rounded px-2 py-1"
              >
                <option value="">Select a design...</option>
                {otherDesigns.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.participantId} ({d.id.slice(0, 8)}...)
                  </option>
                ))}
              </select>
            </div>

            {/* Check Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => checkIncarnation("lax")}
                disabled={!selectedTargetDesign || checkInProgress}
                className="flex-1 px-3 py-2 text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 rounded transition disabled:opacity-50"
              >
                {checkInProgress ? "Checking..." : "Lax (⊂)"}
              </button>
              <button
                onClick={() => checkIncarnation("sharp")}
                disabled={!selectedTargetDesign || checkInProgress}
                className="flex-1 px-3 py-2 text-xs bg-rose-100 hover:bg-rose-200 text-rose-800 rounded transition disabled:opacity-50"
              >
                {checkInProgress ? "Checking..." : "Sharp (⊂⊂)"}
              </button>
            </div>

            {/* Result */}
            {incarnationResult && (
              <div
                className={`rounded-lg p-3 ${
                  incarnationResult.isValid
                    ? "bg-emerald-50 border border-emerald-200"
                    : "bg-rose-50 border border-rose-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {incarnationResult.isValid ? "✓" : "✗"}
                  </span>
                  <span
                    className={`font-semibold ${
                      incarnationResult.isValid ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {incarnationResult.isValid
                      ? `${incarnationResult.type === "sharp" ? "Sharp" : "Lax"} Incarnation Holds`
                      : `No ${incarnationResult.type === "sharp" ? "Sharp" : "Lax"} Incarnation`}
                  </span>
                </div>
                {incarnationResult.witnessActions && incarnationResult.witnessActions.length > 0 && (
                  <div className="text-xs text-slate-600">
                    Witness actions: {incarnationResult.witnessActions.length}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Type Check Tab */}
        {activeTab === "check" && (
          <div className="type-check-content">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">Type Checking</h4>
            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded">
              <p className="mb-2">
                Verify that a design has a specific type (D : A judgment).
              </p>
              <p>
                Type checking validates that a design belongs to the inhabitants of a type&apos;s
                behaviour. This is coming soon.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TypeDisplay({ type }: { type: TypeStructure }) {
  if (!type) return <span>?</span>;

  switch (type.kind) {
    case "base":
      return <span className="text-indigo-700">{type.name || "Base"}</span>;
    case "arrow":
      return (
        <span>
          (<TypeDisplay type={type.left!} /> → <TypeDisplay type={type.right!} />)
        </span>
      );
    case "product":
      return (
        <span>
          (<TypeDisplay type={type.left!} /> × <TypeDisplay type={type.right!} />)
        </span>
      );
    case "sum":
      return (
        <span>
          (<TypeDisplay type={type.left!} /> + <TypeDisplay type={type.right!} />)
        </span>
      );
    case "variable":
      return <span className="text-purple-600">{type.name || "T"}</span>;
    default:
      return <span>Unknown</span>;
  }
}

export default TypeSystemPanel;
