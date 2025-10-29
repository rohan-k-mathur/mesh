// components/deliberations/DeliberationSettingsPanel.tsx
"use client";
import * as React from "react";
import { Settings } from "lucide-react";

interface DeliberationSettingsPanelProps {
  deliberationId: string;
  initialSettings?: {
    dsMode?: boolean;
    proofMode?: string;
    title?: string;
    nliThreshold?: number;
  };
  onUpdate?: () => void;
}

/**
 * Panel for configuring deliberation settings.
 * Phase 2.3: Includes toggle for Dempster-Shafer mode.
 * Phase 2.5: Includes NLI threshold slider.
 */
export function DeliberationSettingsPanel({
  deliberationId,
  initialSettings,
  onUpdate,
}: DeliberationSettingsPanelProps) {
  const [dsMode, setDsMode] = React.useState(initialSettings?.dsMode ?? false);
  const [nliThreshold, setNliThreshold] = React.useState(
    initialSettings?.nliThreshold ?? 0.5
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  // Fetch current settings on mount
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/deliberations/${deliberationId}/settings`);
        if (res.ok) {
          const data = await res.json();
          setDsMode(data.dsMode ?? false);
          setNliThreshold(data.nliThreshold ?? 0.5);
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      }
    };

    if (!initialSettings) {
      fetchSettings();
    }
  }, [deliberationId, initialSettings]);

  const handleToggleDS = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const newValue = !dsMode;
      const res = await fetch(`/api/deliberations/${deliberationId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dsMode: newValue }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update settings");
      }

      setDsMode(newValue);
      setSuccess(true);
      onUpdate?.();

      // Clear success message after 2 seconds
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to update DS mode");
    } finally {
      setLoading(false);
    }
  };

  const handleNliThresholdChange = async (value: number) => {
    setNliThreshold(value);

    // Debounced update (wait 500ms after user stops sliding)
    if ((window as any).nliThresholdTimeout) {
      clearTimeout((window as any).nliThresholdTimeout);
    }

    (window as any).nliThresholdTimeout = setTimeout(async () => {
      setLoading(true);
      setError(null);
      setSuccess(false);

      try {
        const res = await fetch(`/api/deliberations/${deliberationId}/settings`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nliThreshold: value }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update NLI threshold");
        }

        setSuccess(true);
        onUpdate?.();

        // Clear success message after 2 seconds
        setTimeout(() => setSuccess(false), 2000);
      } catch (err: any) {
        setError(err.message || "Failed to update NLI threshold");
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-4">
      <div className="flex items-center gap-2 text-slate-700 font-semibold">
        <Settings className="w-5 h-5" />
        <span>Deliberation Settings</span>
      </div>

      {/* Dempster-Shafer Mode Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-medium text-slate-900">
              Dempster-Shafer Mode
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Use belief/plausibility intervals instead of single confidence values.
              Shows epistemic uncertainty: [Bel(A), Pl(A)].
            </div>
          </div>

          <button
            onClick={handleToggleDS}
            disabled={loading}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${dsMode ? "bg-indigo-600" : "bg-slate-300"}
              ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
            aria-label={`Toggle Dempster-Shafer mode ${dsMode ? "off" : "on"}`}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${dsMode ? "translate-x-6" : "translate-x-1"}
              `}
            />
          </button>
        </div>

        {/* Status Badge */}
        {dsMode && (
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-50 border border-indigo-200">
            <div className="text-xs font-medium text-indigo-700">
              DS Mode Active: Showing Bel(A) and Pl(A)
            </div>
          </div>
        )}
      </div>

      {/* NLI Threshold Slider */}
      <div className="space-y-2 pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-medium text-slate-900">
              NLI Confidence Threshold
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Minimum confidence score (0.0 to 1.0) for Natural Language Inference
              detection. Higher values require stronger entailment signals.
            </div>
          </div>
          <div className="text-sm font-semibold text-indigo-600 ml-4">
            {nliThreshold.toFixed(2)}
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={nliThreshold}
            onChange={(e) => handleNliThresholdChange(parseFloat(e.target.value))}
            disabled={loading}
            className={`
              w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-indigo-600
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-moz-range-thumb]:w-4
              [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-indigo-600
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:cursor-pointer
              ${loading ? "opacity-50 cursor-not-allowed" : ""}
            `}
            aria-label="NLI threshold slider"
          />

          {/* Threshold Labels */}
          <div className="flex justify-between text-xs text-slate-500">
            <span>0.0 (Low)</span>
            <span>0.5 (Default)</span>
            <span>1.0 (High)</span>
          </div>

          {/* Interpretation Guide */}
          <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
            {nliThreshold < 0.3 && (
              <>
                <strong>Low threshold ({nliThreshold.toFixed(2)}):</strong> Detects
                weak entailments. May include false positives.
              </>
            )}
            {nliThreshold >= 0.3 && nliThreshold < 0.7 && (
              <>
                <strong>Medium threshold ({nliThreshold.toFixed(2)}):</strong> Balanced
                detection. Good for general argumentation.
              </>
            )}
            {nliThreshold >= 0.7 && (
              <>
                <strong>High threshold ({nliThreshold.toFixed(2)}):</strong> Only
                strong entailments detected. More conservative.
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-3 rounded-md bg-green-50 border border-green-200 text-sm text-green-700">
          Settings updated successfully
        </div>
      )}

      {/* Info Box */}
      <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600">
        <strong>About Dempster-Shafer Theory:</strong>
        <ul className="mt-1 space-y-1 ml-4 list-disc">
          <li>
            <strong>Belief (Bel):</strong> Lower bound - mass directly supporting hypothesis
          </li>
          <li>
            <strong>Plausibility (Pl):</strong> Upper bound - mass not contradicting hypothesis
          </li>
          <li>
            <strong>Uncertainty:</strong> Interval width [Bel, Pl] represents epistemic uncertainty
          </li>
        </ul>
      </div>
    </div>
  );
}
