"use client";
import { WhyThis } from "../feed/WhyThis";
import ClaimMiniMap from "@/components/claims/ClaimMiniMap";
import { useState, useEffect } from "react";

type Arg = { id: string; text: string; confidence?: number | null };
type View = { index: number; arguments: Arg[] };


function ViewControls({ rule, k, onApply }:{
    rule: 'utilitarian'|'harmonic'|'maxcov';
    k: number;
    onApply: (next:{ rule: 'utilitarian'|'harmonic'|'maxcov'; k:number }) => void;
  }) {
    const [open, setOpen] = useState(false);
    const [r, setR] = useState(rule);
    const [kk, setK] = useState(k);
  
    return (
      <div className="relative">
        <button className="text-xs px-2 py-1 border rounded" onClick={()=>setOpen(v=>!v)} title="View settings">⚙️</button>
        {open && (
          <div className="absolute right-0 mt-2 z-10 bg-white border rounded p-3 w-48 text-xs shadow">
            <label className="block mb-2">Rule
              <select className="w-full border rounded px-2 py-1 mt-1"
                value={r} onChange={e=>setR(e.target.value as any)}>
                <option value="utilitarian">Utilitarian</option>
                <option value="harmonic">Harmonic</option>
                <option value="maxcov">MaxCov</option>
              </select>
            </label>
            <label className="block mb-2">k = {kk}
              <input type="range" min={2} max={7} value={kk} onChange={e=>setK(Number(e.target.value))} className="w-full" />
            </label>
            <div className="flex justify-end gap-2">
              <button className="underline" onClick={()=>setOpen(false)}>Cancel</button>
              <button className="px-2 py-1 border rounded"
                onClick={()=>{ onApply({ rule: r, k: kk }); setOpen(false); }}>
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

export function RepresentativeViewpoints(props: {
  // deliberationId no longer required – we use s.deliberationId returned by API
  selection: {
    id: string;
    deliberationId: string; // ✅ ensure route includes this
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
  const [pending, setPending] = useState(false);
  
function ViewControls({ rule, k, onApply }:{
  rule: 'utilitarian'|'harmonic'|'maxcov';
  k: number;
  onApply: (next:{ rule: 'utilitarian'|'harmonic'|'maxcov'; k:number }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [r, setR] = useState(rule);
  const [kk, setK] = useState(k);

  return (
    <div className="relative">
        
      <button className="text-xs px-2 py-1 border rounded" onClick={()=>setOpen(v=>!v)} title="View settings">⚙️</button>
      {open && (
        <div className="absolute right-0 mt-2 z-10 bg-white border rounded p-3 w-48 text-xs shadow">
          <label className="block mb-2">Rule
            <select className="w-full border rounded px-2 py-1 mt-1"
              value={r} onChange={e=>setR(e.target.value as any)}>
              <option value="utilitarian">Utilitarian</option>
              <option value="harmonic">Harmonic</option>
              <option value="maxcov">MaxCov</option>
            </select>
          </label>
          <label className="block mb-2">k = {kk}
            <input type="range" min={2} max={7} value={kk} onChange={e=>setK(Number(e.target.value))} className="w-full" />
          </label>
          <div className="flex justify-end gap-2">
            <button className="underline" onClick={()=>setOpen(false)}>Cancel</button>
            <button className="px-2 py-1 border rounded"
              onClick={()=>{ onApply({ rule: r, k: kk }); setOpen(false); }}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

  function JRBadge() {
    return (
      <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
        JR
      </span>
    );
  }

  // fetch id->text once for conflict labels
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/deliberations/${s.deliberationId}/arguments`);
      if (!res.ok) return;
      const data = await res.json();
      const map: Record<string, string> = {};
      (data.arguments ?? []).forEach((a: any) => {
        map[a.id] = a.text;
      });
      setArgsMap(map);
    })();
  }, [s.deliberationId]);

  // tiny helper to verbalize rule for WhyThis
  const humanReason =
    s.rule === "utilitarian"
      ? "Chosen to maximize average coverage of approvals"
      : s.rule === "harmonic"
      ? "Chosen to balance average and fairness (harmonic weights)"
      : "Chosen to maximize the count of fully represented voters (JR-oriented)";

  return (
    <div className="rounded-md border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Representative viewpoints (k={s.k})
          <ViewControls
  rule={s.rule}
  k={s.k}
  onApply={({ rule, k }) => props.onReselect?.(rule)} // if your onReselect supports k, pass it too
/>
          {s.rule === "maxcov" && s.jrSatisfied && <JRBadge />}
          <WhyThis deliberationId={s.deliberationId} reason={humanReason} />

        </h3>
        <div className="text-xs text-neutral-600 flex items-center gap-3">
          <span aria-label="Coverage summary">
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
        </div>
      </div>

      {s.conflictsTopPairs && s.conflictsTopPairs.length > 0 && (
        <div className="text-[11px] text-neutral-600">
          Conflicts explained:&nbsp;
          {s.conflictsTopPairs.slice(0, 3).map((p, i) => (
            <span key={i} className="mr-2">
              <span title={argsMap[p.a] ?? p.a}>
                “{(argsMap[p.a] ?? p.a).slice(0, 38)}”
              </span>{" "}
              ×{" "}
              <span title={argsMap[p.b] ?? p.b}>
                “{(argsMap[p.b] ?? p.b).slice(0, 38)}”
              </span>{" "}
              ({p.count})
            </span>
          ))}
        </div>
      )}

      <div className={`grid gap-3 md:grid-cols-${Math.max(1, s.views.length)}`}>
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
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
      <button
           className="text-xs underline disabled:opacity-50"
           disabled={pending}
           onClick={async () => {
             setPending(true);
             try {
               await props.onReselect?.(s.rule);
             } finally {
               setPending(false);
             }
           }}
         >
           {pending ? "Refreshing…" : "Refresh views"}
        </button>
        <div className="text-xs text-neutral-600 flex flex-col items-end gap-2">
          <ClaimMiniMap deliberationId={s.deliberationId} />
        </div>
      </div>
    </div>
  );
}
