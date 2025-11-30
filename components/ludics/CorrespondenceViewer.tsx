"use client";

import * as React from "react";
import type {
  Correspondence,
  IsomorphismResults,
  IsomorphismCheck,
} from "@/packages/ludics-core/dds/correspondence";

interface CorrespondenceViewerProps {
  designId: string;
  strategyId?: string;
  correspondence?: Correspondence;
  onVerify?: () => void;
  isVerifying?: boolean;
}

export function CorrespondenceViewer({
  designId,
  strategyId,
  correspondence,
  onVerify,
  isVerifying = false,
}: CorrespondenceViewerProps) {
  const isomorphisms = correspondence?.isomorphisms;

  return (
    <div className="correspondence-viewer border rounded-lg p-4 bg-white/70 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">
          Design ↔ Strategy Correspondence
        </h3>
        {strategyId && onVerify && (
          <button
            onClick={onVerify}
            disabled={isVerifying}
            className="px-3 py-1 text-xs rounded bg-indigo-700 text-white hover:bg-indigo-800 disabled:opacity-50"
          >
            {isVerifying ? "Verifying..." : "Verify Isomorphisms"}
          </button>
        )}
      </div>

      {/* Verification Status */}
      {correspondence?.isVerified ? (
        <div className="verified-badge bg-emerald-50 border border-emerald-200 rounded p-3">
          <div className="flex items-center gap-2 text-emerald-700">
            <span className="text-xl">✓</span>
            <div>
              <div className="font-bold">Correspondence Verified</div>
              <div className="text-xs mt-1">
                Design D ≅ Strategy S (Proposition 4.27)
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="unverified-badge bg-slate-50 border border-slate-200 rounded p-3">
          <div className="text-xs text-slate-600">
            {strategyId
              ? "Correspondence not yet verified. Click 'Verify Isomorphisms' to check."
              : "Select a strategy to verify correspondence."}
          </div>
        </div>
      )}

      {/* Isomorphism Checklist */}
      {isomorphisms && (
        <div className="isomorphisms-section">
          <div className="text-xs font-semibold text-slate-600 mb-2">
            Isomorphism Checks
          </div>
          <div className="grid grid-cols-2 gap-2">
            <IsomorphismBadge
              name="Plays(Views(S)) = S"
              reference="Prop 4.18"
              check={isomorphisms.playsViews}
            />
            <IsomorphismBadge
              name="Views(Plays(V)) = V"
              reference="Prop 4.18"
              check={isomorphisms.viewsPlays}
            />
            <IsomorphismBadge
              name="Disp(Ch(S)) = S"
              reference="Prop 4.27"
              check={isomorphisms.dispCh}
            />
            <IsomorphismBadge
              name="Ch(Disp(D)) = D"
              reference="Prop 4.27"
              check={isomorphisms.chDisp}
            />
          </div>
        </div>
      )}

      {/* IDs Display */}
      <div className="ids-section border-t pt-3">
        <div className="text-xs text-slate-500 space-y-1">
          <div>
            <span className="font-medium">Design:</span>{" "}
            <code className="bg-slate-100 px-1 rounded">{designId}</code>
          </div>
          {strategyId && (
            <div>
              <span className="font-medium">Strategy:</span>{" "}
              <code className="bg-slate-100 px-1 rounded">{strategyId}</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface IsomorphismBadgeProps {
  name: string;
  reference: string;
  check: IsomorphismCheck;
}

function IsomorphismBadge({ name, reference, check }: IsomorphismBadgeProps) {
  if (!check.checked) {
    return (
      <div className="p-2 rounded border border-slate-200 bg-slate-50">
        <div className="text-[10px] font-mono text-slate-600">{name}</div>
        <div className="text-[9px] text-slate-400">{reference}</div>
        <div className="text-xs text-slate-500 mt-1">Not checked</div>
      </div>
    );
  }

  return (
    <div
      className={`p-2 rounded border ${
        check.holds
          ? "bg-emerald-50 border-emerald-200"
          : "bg-rose-50 border-rose-200"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className={check.holds ? "text-emerald-700" : "text-rose-700"}>
          {check.holds ? "✓" : "✗"}
        </span>
        <div className="text-[10px] font-mono text-slate-700">{name}</div>
      </div>
      <div className="text-[9px] text-slate-500 mt-0.5">{reference}</div>
      {check.evidence && !check.holds && (
        <div className="text-[9px] text-rose-600 mt-1">
          {check.evidence.error ||
            `${check.evidence.difference?.inOriginal || 0} missing, ${
              check.evidence.difference?.inReconstructed || 0
            } extra`}
        </div>
      )}
    </div>
  );
}

export default CorrespondenceViewer;
