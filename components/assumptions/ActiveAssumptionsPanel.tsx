// components/assumptions/ActiveAssumptionsPanel.tsx
"use client";
import * as React from "react";
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { AssumptionCard } from "./AssumptionCard";

interface ActiveAssumptionsPanelProps {
  deliberationId: string;
}

interface AssumptionData {
  id: string;
  assumptionText?: string | null;
  assumptionClaimId?: string | null;
  claimText?: string | null;
  role: string;
  status: "PROPOSED" | "ACCEPTED" | "RETRACTED" | "CHALLENGED";
  statusChangedAt?: Date | string;
  statusChangedBy?: string | null;
  challengeReason?: string | null;
  weight?: number | null;
  confidence?: number | null;
}

/**
 * ActiveAssumptionsPanel
 * 
 * Displays all active (accepted) assumptions for a deliberation.
 * Fetches from /api/deliberations/[id]/assumptions/active endpoint.
 * 
 * Phase 3.4.2: Active Assumptions Panel
 */
export function ActiveAssumptionsPanel({
  deliberationId,
}: ActiveAssumptionsPanelProps) {
  const [assumptions, setAssumptions] = React.useState<AssumptionData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAssumptions = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/deliberations/${deliberationId}/assumptions/active`);
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch assumptions");
      }

      const data = await res.json();
      setAssumptions(data.assumptions || []);
    } catch (err: any) {
      console.error("Failed to fetch assumptions:", err);
      setError(err.message || "Failed to load assumptions");
    } finally {
      setLoading(false);
    }
  }, [deliberationId]);

  React.useEffect(() => {
    fetchAssumptions();
  }, [fetchAssumptions]);

  const handleAssumptionStatusChange = () => {
    // Refetch to get updated list
    fetchAssumptions();
  };

  // Count by status for stats (must be before early returns)
  const stats = React.useMemo(() => {
    const accepted = assumptions.filter((a) => a.status === "ACCEPTED").length;
    const challenged = assumptions.filter((a) => a.status === "CHALLENGED").length;
    return { accepted, challenged };
  }, [assumptions]);

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-slate-200">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm text-slate-600">Loading assumptions...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-900 mb-1">
              Failed to Load Assumptions
            </h3>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={fetchAssumptions}
              className="mt-3 px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty State
  if (assumptions.length === 0) {
    return (
      <div className="text-center p-12 bg-slate-50 rounded-lg border border-slate-200">
        <CheckCircle2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-900 mb-2">
          No Active Assumptions
        </h3>
        <p className="text-sm text-slate-600 mb-1">
          This deliberation currently has no accepted assumptions.
        </p>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Assumptions are propositions accepted for the sake of argument.
          When an argument relies on an assumption, it will appear here once accepted.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Active Assumptions ({assumptions.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            These assumptions are currently accepted in this deliberation
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-slate-600">
              {stats.accepted} Accepted
            </span>
          </div>
          {stats.challenged > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-slate-600">
                {stats.challenged} Challenged
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Assumption Cards Grid */}
      <div className="grid gap-3">
        {assumptions.map((assumption) => (
          <AssumptionCard
            key={assumption.id}
            id={assumption.id}
            assumptionText={assumption.assumptionText}
            assumptionClaimId={assumption.assumptionClaimId}
            claimText={assumption.claimText}
            role={assumption.role}
            status={assumption.status}
            statusChangedAt={assumption.statusChangedAt}
            statusChangedBy={assumption.statusChangedBy}
            challengeReason={assumption.challengeReason}
            weight={assumption.weight}
            confidence={assumption.confidence}
            onStatusChange={handleAssumptionStatusChange}
          />
        ))}
      </div>

      {/* Refresh Button */}
      <div className="pt-3 border-t border-slate-200">
        <button
          onClick={fetchAssumptions}
          disabled={loading}
          className="text-xs text-slate-600 hover:text-slate-900 disabled:opacity-50 transition-colors"
        >
          Refresh assumptions
        </button>
      </div>
    </div>
  );
}
