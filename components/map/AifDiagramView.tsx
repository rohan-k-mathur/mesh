// components/map/AifDiagramView.tsx
'use client';

import * as React from 'react';
import { useEffect, useMemo, useRef, useState, useId } from 'react';
import type { AifSubgraph, AifNode, AifEdge } from '@/lib/arguments/diagram';

// tiny css helpers
const cls = (...xs:(string|false|null|undefined)[]) => xs.filter(Boolean).join(' ');

function nodeStyle(n: AifNode) {
  switch (n.kind) {
    case 'I':  return 'bg-emerald-50 border-emerald-200';
    case 'RA': return 'bg-slate-50 border-slate-300';
    case 'CA': return 'bg-rose-50 border-rose-200';
    case 'PA': return 'bg-sky-50 border-sky-200';
    default:   return 'bg-white border-slate-200';
  }
}
function edgeColor(role: AifEdge['role']) {
  if (role === 'premise') return 'stroke-indigo-400';
  if (role === 'conclusion') return 'stroke-emerald-500';
  if (role === 'conflictingElement' || role === 'conflictedElement') return 'stroke-rose-500';
  if (role === 'preferredElement' || role === 'dispreferredElement') return 'stroke-sky-500';
  return 'stroke-slate-400';
}

/** Layout assumption: one focal RA, its premises above, conclusion below; CA/PA flank sides. */
export default function AifDiagramView({
  aif, className
}: { aif: AifSubgraph; className?: string }) {
  // pick the focal RA: either the only RA or the one that has a conclusion edge
  const raId = useMemo(() => {
    const ras = aif.nodes.filter(n => n.kind === 'RA');
    if (ras.length <= 1) return ras[0]?.id ?? null;
    const set = new Set(aif.edges.filter(e => e.role === 'conclusion').map(e => e.from));
    for (const n of ras) if (set.has(n.id)) return n.id;
    return ras[0]?.id ?? null;
  }, [aif]);

  const ra = aif.nodes.find(n => n.id === raId);
  const premises = useMemo(() => {
    if (!ra) return [];
    const inPrem = aif.edges.filter(e => e.role==='premise' && e.to===ra.id).map(e=>e.from);
    return inPrem.map(id => aif.nodes.find(n => n.id === id)).filter(Boolean) as AifNode[];
  }, [aif, ra]);
  const conclusion = useMemo(() => {
    if (!ra) return null;
    const out = aif.edges.find(e => e.role==='conclusion' && e.from===ra.id);
    return out ? aif.nodes.find(n => n.id === out.to) ?? null : null;
  }, [aif, ra]);

  const cas = useMemo(() => aif.nodes.filter(n=>n.kind==='CA'), [aif]);
  const pas = useMemo(() => aif.nodes.filter(n=>n.kind==='PA'), [aif]);

  // measure lines (similar to DiagramView)
  const rootRef = useRef<HTMLDivElement|null>(null);
  const idRef = useRef<Record<string, HTMLDivElement|null>>({});
  const [paths, setPaths] = useState<Array<{d:string; role:AifEdge['role']}>>([]);
  const marker = useId();

  const recompute = React.useCallback(() => {
    const root = rootRef.current; if (!root) return;
    const R = (id:string) => idRef.current[id]?.getBoundingClientRect();
    const base = root.getBoundingClientRect();
    const toLocal = (r:DOMRect) => ({ x: r.left - base.left + r.width/2, y: r.top - base.top + r.height/2 });

    const next: Array<{d:string; role:AifEdge['role']}> = [];
    for (const e of aif.edges) {
      const fr = idRef.current[e.from]; const to = idRef.current[e.to];
      if (!fr || !to) continue;
      const r1 = toLocal(fr.getBoundingClientRect()); const r2 = toLocal(to.getBoundingClientRect());
      const dx = Math.abs(r2.x - r1.x);
      const curv = Math.min(180, Math.max(40, dx * 0.4));
      const d = `M ${r1.x} ${r1.y} C ${r1.x} ${r1.y + curv}, ${r2.x} ${r2.y - curv}, ${r2.x} ${r2.y}`;
      next.push({ d, role: e.role });
    }
    setPaths(next);
  }, [aif]);

  useEffect(() => {
    recompute();
    const on = () => recompute();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [recompute]);

  // very light layout: 3 rows (premises, RA row flanked by CA/PA, conclusion)
  return (
    <div ref={rootRef} className={cls('relative w-full', className)}>
      {/* edges */}
      <svg className="pointer-events-none absolute inset-0" width="100%" height="100%">
        <defs><marker id={`m-${marker}`} markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" className="fill-slate-400" />
        </marker></defs>
        {paths.map((p,i) => (
          <path key={i} d={p.d}
                className={cls('fill-none stroke-2', edgeColor(p.role))}
                markerEnd={`url(#m-${marker})`} />
        ))}
      </svg>

      {/* premises */}
      <div className="grid gap-2 md:gap-3 mb-6"
           style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {premises.map((n) => (
          <div key={n.id} ref={el => (idRef.current[n.id]=el)}
               className={cls('rounded-2xl border p-3 md:p-4 shadow-sm', nodeStyle(n))}>
            <div className="text-[11px] uppercase tracking-wide text-slate-600 mb-1">premise</div>
            <div className="text-sm whitespace-pre-wrap">{n.label ?? n.id}</div>
          </div>
        ))}
      </div>

      {/* middle row: CA | RA | PA */}
      <div className="grid grid-cols-5 md:grid-cols-7 gap-2 md:gap-3 items-start mb-6">
        <div className="col-span-2 space-y-2">
          {cas.map(n => (
            <div key={n.id} ref={el => (idRef.current[n.id]=el)}
                 className={cls('rounded-xl border p-2 shadow-sm text-[12px]', nodeStyle(n))}>
              <div className="font-medium">CA</div>
              <div className="text-slate-700">{n.label ?? n.id}</div>
            </div>
          ))}
        </div>

        <div className="col-span-1 col-start-3 md:col-start-4">
          {ra && (
            <div ref={el => (idRef.current[ra.id]=el)}
                 className={cls('rounded-full border px-4 py-3 md:px-6 md:py-4 text-center shadow-sm', nodeStyle(ra))}>
              <div className="text-[11px] uppercase tracking-wide text-slate-600">RA</div>
              <div className="text-[13px] whitespace-pre-wrap">{ra.label ?? ra.id}</div>
            </div>
          )}
        </div>

        <div className="col-span-2 col-start-4 md:col-start-5 space-y-2">
          {pas.map(n => (
            <div key={n.id} ref={el => (idRef.current[n.id]=el)}
                 className={cls('rounded-xl border p-2 shadow-sm text-[12px]', nodeStyle(n))}>
              <div className="font-medium">PA</div>
              <div className="text-slate-700">{n.label ?? n.id}</div>
            </div>
          ))}
        </div>
      </div>

      {/* conclusion */}
      {conclusion && (
        <div className="max-w-3xl mx-auto" >
          <div ref={el => (idRef.current[conclusion.id]=el)}
               className={cls('rounded-2xl border p-4 md:p-5 shadow-sm', nodeStyle(conclusion))}>
            <div className="text-[11px] uppercase tracking-wide text-emerald-700">conclusion</div>
            <div className="text-slate-900 text-[15px] md:text-base whitespace-pre-wrap">
              {conclusion.label ?? conclusion.id}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
