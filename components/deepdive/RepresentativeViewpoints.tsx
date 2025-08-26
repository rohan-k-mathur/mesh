"use client";
import WhyThis from "@/components/feed/WhyThis";
import ClaimMiniMap from "@/components/claims/ClaimMiniMap";
import { useState, useEffect } from "react";
type Arg = { id: string; text: string; confidence?: number | null };
type View = { index: number; arguments: Arg[] };

function JRBadge() {
  return (
    <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
      JR
    </span>
  );
}

export function RepresentativeViewpoints(props: {
  deliberationId: string;
  selection: {
    id: string;
    rule: "utilitarian" | "harmonic" | "maxcov";
    k: number;
    coverageAvg: number;
    coverageMin: number;
    jrSatisfied: boolean;
    bestPossibleAvg?: number;
    conflictsTopPairs?: { a: string; b: string; count: number }[];
    views: View[];
  } | null;
  onReselect?: (rule?: "utilitarian" | "harmonic" | "maxcov") => void;
}) {
  const s = props.selection;
  if (!s) return null;
  const [showCore, setShowCore] = useState(false);
  const [argsMap, setArgsMap] = useState<Record<string, string>>({});

  // fetch id->text once for conflict labels
  useEffect(() => {
    (async () => {
      const res = await fetch(
        `/api/deliberations/${props.deliberationId}/arguments`
      );
      if (!res.ok) return;
      const data = await res.json();
      const map: Record<string, string> = {};
      (data.arguments ?? []).forEach((a: any) => {
        map[a.id] = a.text;
      });
      setArgsMap(map);
    })();
  }, [props.deliberationId]);

  return (
    <div className="rounded-md border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          Representative viewpoints (k={s.k})
        </div>
        <h3 className="text-sm font-semibold">
          Representative viewpoints (k={k})
          {rule === "maxcov" && jr_satisfied && <JRBadge />}
        </h3>
        <div className="text-xs text-neutral-600 flex items-center gap-3">
          <span>
            Avg coverage:{" "}
            {(
              (showCore ? s.bestPossibleAvg ?? s.coverageAvg : s.coverageAvg) *
              100
            ).toFixed(0)}
            %
            {!showCore && (
              <span> · Min: {(s.coverageMin * 100).toFixed(0)}%</span>
            )}
          </span>
          {typeof s.bestPossibleAvg === "number" && (
            <label className="inline-flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showCore}
                onChange={(e) => setShowCore(e.target.checked)}
              />
              <span>Best possible</span>
            </label>
          )}
          {s.rule === "maxcov" && s.jrSatisfied && (
            <span className="ml-2 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border">
              JR
            </span>
          )}
        </div>
      </div>

      {s.conflictsTopPairs && s.conflictsTopPairs.length > 0 && (
        <div className="text-[11px] text-neutral-600">
          Conflicts explained:&nbsp;
          {s.conflictsTopPairs.slice(0, 3).map((p, i) => (
            <span key={i} className="mr-2">
              “{(argsMap[p.a] ?? p.a).slice(0, 38)}” × “
              {(argsMap[p.b] ?? p.b).slice(0, 38)}” ({p.count})
            </span>
          ))}
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-3">
        {s.views.map((v) => (
          <div key={v.index} className="border rounded p-3 space-y-2">
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              View {v.index + 1}
            </div>
            <ul className="space-y-2">
              {v.arguments.slice(0, 5).map((a) => (
                <li key={a.id} className="text-sm">
                  <span className="block">{a.text}</span>
                  {a.confidence != null && (
                    <span className="text-[11px] text-neutral-500">
                      How sure: {(a.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                  {/* if you extend selection route to include quantifier/modality in future, render them here too */}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <button
          className="text-xs underline"
          onClick={() => props.onReselect?.(s.rule)}
        >
          Recompute
        </button>
        <div className="text-xs text-neutral-600">
          <WhyThis selectionId={s.id} />
          <ClaimMiniMap deliberationId={deliberationId} />
        </div>
      </div>
    </div>
  );
}
