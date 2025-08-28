"use client";
import { useState, useEffect, useMemo } from "react";
import { WhyThis } from "../feed/WhyThis";
import ClaimMiniMap from "@/components/claims/ClaimMiniMap";

type Arg = { id: string; text: string; confidence?: number | null };
type View = { index: number; arguments: Arg[] };
type Rule = "utilitarian" | "harmonic" | "maxcov";

export function ViewControls({
  rule,
  k,
  onApply,
}: {
  rule: Rule;
  k: number;
  onApply: (next: { rule: Rule; k: number }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [r, setR] = useState<Rule>(rule);
  const [kk, setK] = useState<number>(k);

  useEffect(() => { setR(rule); setK(k); }, [rule, k]);

  return (
    <div className="relative">
      <button
        className="text-xs px-2 py-1 border rounded-xl bg-slate-200/50"
        onClick={() => setOpen((v) => !v)}
        title="View settings"
      >
        <span aria-hidden>⚙️</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 z-20 bg-white border rounded p-3 w-56 text-xs shadow-lg">
          <label className="block mb-3">
            <span className="block mb-1 text-[11px] text-slate-600">Rule</span>
            <select
              className="w-full border rounded px-2 py-1"
              value={r}
              onChange={(e) => setR(e.target.value as Rule)}
            >
              <option value="utilitarian">Utilitarian</option>
              <option value="harmonic">Harmonic</option>
              <option value="maxcov">MaxCov</option>
            </select>
          </label>
          <label className="block mb-3">
            <span className="block mb-1 text-[11px] text-slate-600">k = {kk}</span>
            <input
              type="range"
              min={2}
              max={7}
              value={kk}
              onChange={(e) => setK(Number(e.target.value))}
              className="w-full"
            />
          </label>
          <div className="flex justify-end gap-3">
            <button className="underline" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              className="px-2 py-1 border rounded"
              onClick={() => {
                onApply({ rule: r, k: kk });
                setOpen(false);
              }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function RepresentativeViewpoints(props: {
  selection: {
    id: string;
    deliberationId: string;
    rule: Rule;
    k: number;
    coverageAvg: number;
    coverageMin: number;
    jrSatisfied: boolean;
    bestPossibleAvg?: number;
    conflictsTopPairs?: { a: string; b: string; count: number }[];
    views: View[];
  } | null;
  // NOTE: for now we keep the old signature. Parent can ignore extra args.
  onReselect?: (rule?: Rule, k?: number) => void;
}) {
  const s = props.selection;
  if (!s) return null;

  const [showCore, setShowCore] = useState(false);
  const [argsMap, setArgsMap] = useState<Record<string, string>>({});
  const [scopeMap, setScopeMap] = useState<Record<string, "inference" | "premise" | "conclusion">>({});
  const [pending, setPending] = useState(false);
  const [cohortSummary, setCohortSummary] = useState<{ totals: Record<string, number>, byArgument: Record<string, Record<string,string[]>> }|null>(null);

  function JRBadge() {
    return (
      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
        JR
      </span>
    );
  }




  // Fetch all arguments to build:
  // - id -> text (for conflicts explained)
  // - id -> scope (derive from edgesOut: undercut => inference; rebut+premise => premise; rebut else => conclusion)
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/deliberations/${s.deliberationId}/arguments`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const map: Record<string, string> = {};
      const sc: Record<string, "inference" | "premise" | "conclusion"> = {};

      (data.arguments ?? []).forEach((a: any) => {
        map[a.id] = a.text;
        const eo: any[] = a.edgesOut ?? [];
        // derive most specific scope: undercut > premise > conclusion
        if (eo.some((e) => e.type === "undercut")) {
          sc[a.id] = "inference";
        } else if (eo.some((e) => e.type === "rebut" && e.targetScope === "premise")) {
          sc[a.id] = "premise";
        } else if (eo.some((e) => e.type === "rebut")) {
          sc[a.id] = "conclusion";
        }
      });
      setArgsMap(map);
      setScopeMap(sc);
    })();
  }, [s.deliberationId]);


  function ViewCohortBar({ argIds }: { argIds: string[] }) {
    if (!cohortSummary) return null;
    const totals = cohortSummary.totals;
    // union sets of users covered by this view’s arguments
    const union = (cohort: string) => {
      const u = new Set<string>();
      for (const id of argIds) {
        const entries = cohortSummary.byArgument[id]?.[cohort] ?? [];
        for (const v of entries) u.add(v);
      }
      return u.size;
    };
    const allCovered = union('all');
    const authorsCovered = union('authors');
    const allPct = totals.all ? Math.round((allCovered / totals.all) * 100) : 0;
    const authorsPct = totals.authors ? Math.round((authorsCovered / totals.authors) * 100) : 0;
  
    return (
      <div className="mt-2 space-y-1 text-[11px] text-neutral-600">
        <div className="flex items-center gap-2" title={`All: ${allPct}%`}>
          <span className="w-12">All</span>
          <div className="h-2 bg-slate-200 rounded w-28">
            <div className="h-2 bg-emerald-500 rounded" style={{ width: `${allPct}%` }} />
          </div>
          <span>{allPct}%</span>
        </div>
        <div className="flex items-center gap-2" title={`Authors: ${authorsPct}%`}>
          <span className="w-12">Authors</span>
          <div className="h-2 bg-slate-200 rounded w-28">
            <div className="h-2 bg-indigo-500 rounded" style={{ width: `${authorsPct}%` }} />
          </div>
          <span>{authorsPct}%</span>
        </div>
      </div>
    );
  }

  // Human reason for WhyThis
  const humanReason =
    s.rule === "utilitarian"
      ? "Chosen to maximize average coverage of approvals"
      : s.rule === "harmonic"
      ? "Chosen to balance average and fairness (harmonic weights)"
      : "Chosen to maximize the count of fully represented voters (JR-oriented)";

  // Chip for scope
  const ScopeChip = ({ scope }: { scope?: "inference" | "premise" | "conclusion" }) => {
    if (!scope) return null;
    const style =
      scope === "inference"
        ? "border-violet-200 bg-violet-50 text-violet-700"
        : scope === "premise"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-blue-200 bg-blue-50 text-blue-700";
    return (
      <span
        className={`inline-block text-[10px] px-1.5 py-0.5 rounded border ${style}`}
        title={
          scope === "inference"
            ? "Undercuts the inference (warrant)"
            : scope === "premise"
            ? "Rebuts the premise"
            : "Rebuts the conclusion"
        }
      >
        {scope}
      </span>
    );
  };

  return (
    <div className="rounded-md border p-4 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold">
            Representative viewpoints (k={s.k})
            {s.rule === "maxcov" && s.jrSatisfied && <JRBadge />}
          </h3>
          {/* Controls (rule + k) */}
          <ViewControls
            rule={s.rule}
            k={s.k}
            onApply={({ rule, k }) => {
              // For now, honor current parent signature (rule only). If parent accepts k, it can read the 2nd arg.
              props.onReselect?.(rule, k);
            }}
          />
          {/* Why this */}
          <div className="text-xs text-neutral-600">
            <WhyThis deliberationId={s.deliberationId} reason={humanReason} />
          </div>
        </div>

        {/* Coverage / Best achievable */}
        <div className="text-xs text-neutral-600 flex items-center gap-3">
          <span aria-label="Coverage summary">
            Avg coverage:{" "}
            {(
              (showCore ? s.bestPossibleAvg ?? s.coverageAvg : s.coverageAvg) * 100
            ).toFixed(0)}
            %
            {!showCore && <span> · Min: {(s.coverageMin * 100).toFixed(0)}%</span>}
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
        </div>
      </div>

      {/* Conflicts explained */}
      {s.conflictsTopPairs && s.conflictsTopPairs.length > 0 && (
        <div className="text-[11px] text-neutral-600">
          Conflicts explained:&nbsp;
          {s.conflictsTopPairs.slice(0, 3).map((p, i) => (
            <span key={i} className="mr-2">
            <a href={`#arg-${p.a}`} title={argsMap[p.a] ?? p.a} className="underline">
              “{(argsMap[p.a] ?? p.a).slice(0, 38)}”
            </a>{" "}
            ×{" "}
            <a href={`#arg-${p.b}`} title={argsMap[p.b] ?? p.b} className="underline">
              “{(argsMap[p.b] ?? p.b).slice(0, 38)}”
            </a>{" "}
            ({p.count})
          </span>
          ))}
        </div>
      )}
      {s.rule === "maxcov" && (
  <div className="text-[11px] text-emerald-700">
    JR guarantee: at least one group of size ≥ n/k is fully represented
  </div>
)}

      {/* View cards */}
      <div className={`grid gap-3 md:grid-cols-${Math.max(1, s.views.length)}`}>
        {s.views.map((v) => (
          <div key={v.index} className="border rounded p-3 space-y-2">
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              View {v.index + 1}
            </div>
            <ul className="space-y-2">
              {v.arguments.slice(0, 6).map((a) => {
                const scope = scopeMap[a.id]; // derived scope if any
                return (
                  <li key={a.id} className="text-sm">
                    <div className="flex items-center gap-2">
                      <span className="block">{a.text}</span>
                      <ScopeChip scope={scope} />
                    </div>
                    {a.confidence != null && (
                      <span className="text-[11px] text-neutral-500">
                        How sure: {(a.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            <ViewCohortBar argIds={v.arguments.map(a => a.id)} />

          </div>
        ))}
      </div>
      
  
      {/* Footer actions + mini-map */}
      <div className="flex items-center justify-between">
        <button
          className="text-sm underline underline-offset-4 disabled:opacity-50"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            try {
              // refresh with current rule; if parent supports k, it will read second arg
              props.onReselect?.(s.rule, s.k);
            } finally {
              setPending(false);
            }
          }}
        >
          {pending ? "Refreshing…" : "Refresh Views"}
        </button>
        <div className="text-xs text-neutral-600 flex flex-col items-end gap-2">
          <ClaimMiniMap deliberationId={s.deliberationId} />
        </div>
      </div>
    </div>
  );
}
