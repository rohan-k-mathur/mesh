'use client';

import * as React from 'react';
import { useEffect, useMemo, useRef, useState, useId } from 'react';
import { motion } from 'framer-motion';

// ---------------- Types ----------------
export type StatementKind = 'claim' | 'premise' | 'warrant' | 'backing' | 'rebuttal';
export type Statement = { id: string; text: string; kind: StatementKind };
export type Inference = {
  id: string;
  conclusionId: string;
  premiseIds: string[];
  scheme?: string | null;
};
export type EvidenceItem = { id: string; uri: string; note?: string | null };
export type Diagram = {
  id: string;
  title?: string | null;
  statements: Statement[];
  inferences: Inference[];
  evidence: EvidenceItem[];
};

// ---------------- Helpers ----------------
function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

function kindColors(kind: StatementKind) {
  switch (kind) {
    case 'claim':
      return 'bg-emerald-50 border-emerald-200';
    case 'premise':
      return 'bg-indigo-50 border-indigo-200';
    case 'warrant':
      return 'bg-amber-50 border-amber-200';
    case 'backing':
      return 'bg-cyan-50 border-cyan-200';
    case 'rebuttal':
      return 'bg-rose-50 border-rose-200';
    default:
      return 'bg-slate-50 border-slate-200';
  }
}

function useResizeObserver(cb: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver(() => cb());
    ro.observe(el);
    window.addEventListener('resize', cb);
    const t = setTimeout(cb, 0); // after first paint
    return () => {
      clearTimeout(t);
      ro.disconnect();
      window.removeEventListener('resize', cb);
    };
  }, [cb]);
  return ref;
}

// ---------------- Component ----------------
export default function DiagramView({
  diagram: inputDiagram,
  className,
  compact = false,
  onStatementClick,
}: {
  diagram?: Diagram; // if omitted, a tiny demo diagram is shown
  className?: string;
  compact?: boolean;
  onStatementClick?: (id: string) => void;
}) {
  // Fallback sample for preview environments
  const demo: Diagram = useMemo(
    () => ({
      id: 'demo-1',
      title: 'Why the city should add protected bike lanes on Maple Ave',
      statements: [
        { id: 'c', text: 'The city should add protected bike lanes on Maple Ave.', kind: 'claim' },
        { id: 'p1', text: 'Protected lanes reduce injuries by 40–50% in peer cities.', kind: 'premise' },
        { id: 'p2', text: 'Maple Ave carries heavy bike and scooter traffic from two schools.', kind: 'premise' },
        { id: 'w1', text: 'If an intervention reduces injuries and demand is high, the city ought to implement it.', kind: 'warrant' },
      ],
      inferences: [
        { id: 'inf1', conclusionId: 'c', premiseIds: ['p1', 'p2', 'w1'] },
      ],
      evidence: [
        { id: 'e1', uri: 'https://example.org/safety-meta', note: 'Safety meta‑analysis (2023)' },
      ],
    }),
    []
  );

  const diagram = inputDiagram ?? demo;

  // Index statements for quick lookup
  const byId = useMemo(() => new Map(diagram.statements.map((s) => [s.id, s])), [diagram]);
  const inf = diagram.inferences[0]; // minimal pop‑out focuses on the primary inference

  const containerRef = useRef<HTMLDivElement | null>(null);
  const premiseRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const conclusionRef = useRef<HTMLDivElement | null>(null);

  const [paths, setPaths] = useState<Array<{ d: string; fromId: string }>>([]);
  const [svgSize, setSvgSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [hoverId, setHoverId] = useState<string | null>(null);
  const markerId = useId();

  // Measure and draw connectors
  const recompute = React.useCallback(() => {
    const root = containerRef.current;
    if (!root || !inf) return;
    const rootRect = root.getBoundingClientRect();
    const concEl = conclusionRef.current;
    if (!concEl) return;
    const cRect = concEl.getBoundingClientRect();

    const newPaths: Array<{ d: string; fromId: string }> = [];
    inf.premiseIds.forEach((pid) => {
      const el = premiseRefs.current[pid];
      if (!el) return;
      const pRect = el.getBoundingClientRect();
      const x1 = pRect.left - rootRect.left + pRect.width / 2;
      const y1 = pRect.top - rootRect.top + pRect.height; // bottom center of premise
      const x2 = cRect.left - rootRect.left + cRect.width / 2;
      const y2 = cRect.top - rootRect.top; // top center of conclusion
      const dx = Math.abs(x2 - x1);
      const curv = Math.min(160, Math.max(48, dx * 0.4));
      const d = `M ${x1} ${y1} C ${x1} ${y1 + curv}, ${x2} ${y2 - curv}, ${x2} ${y2}`;
      newPaths.push({ d, fromId: pid });
    });

    // Update svg size to container box
    setSvgSize({ w: rootRect.width, h: root.scrollHeight });
    setPaths(newPaths);
  }, [inf]);

  const roRef = useResizeObserver(recompute);
  useEffect(() => {
    recompute();
  }, [diagram, recompute]);

  // Trigger once refs are set (next frame)
  useEffect(() => {
    const t = requestAnimationFrame(recompute);
    return () => cancelAnimationFrame(t);
  }, [recompute]);

  // --------------- UI ---------------
  const conclusion = inf ? byId.get(inf.conclusionId) : undefined;
  const premises = inf ? inf.premiseIds.map((id) => byId.get(id)).filter(Boolean) as Statement[] : [];

  return (
    <div ref={(el) => { containerRef.current = el; roRef.current = el; }}
         className={classNames('relative w-full', className)}>
      {/* SVG connectors */}
      <svg className="pointer-events-none absolute inset-0" width={svgSize.w} height={svgSize.h} viewBox={`0 0 ${svgSize.w} ${svgSize.h}`}>
        <defs>
          <marker id={`arrow-${markerId}`} markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-slate-400" />
          </marker>
        </defs>
        {paths.map((p) => (
          <path key={p.fromId}
                d={p.d}
                className={classNames('fill-none stroke-slate-400', hoverId === p.fromId && 'stroke-2', !hoverId && 'stroke-[1.5]')}
                markerEnd={`url(#arrow-${markerId})`} />
        ))}
      </svg>

      {/* Legend (top-right) */}
      <div className="absolute right-2 top-2 z-10 text-xs text-slate-600 bg-white/70 backdrop-blur rounded-full px-2 py-1 shadow">
        <span className="inline-flex items-center gap-1 mr-2"><span className="w-2 h-2 rounded-sm bg-indigo-300"></span>Premise</span>
        <span className="inline-flex items-center gap-1 mr-2"><span className="w-2 h-2 rounded-sm bg-emerald-300"></span>Conclusion</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-300"></span>Link</span>
      </div>

      {/* Title */}
      {diagram.title && (
        <div className="mb-3 pl-1 pr-14">
          <h3 className="text-sm font-medium text-slate-700">{diagram.title}</h3>
        </div>
      )}

      {/* Premises grid */}
      <div className="grid gap-3 md:gap-4 mb-6"
           style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {premises.map((s) => (
          <motion.div
            key={s.id}
            ref={(el) => (premiseRefs.current[s.id] = el)}
            onMouseEnter={() => setHoverId(s.id)}
            onMouseLeave={() => setHoverId(null)}
            onClick={() => onStatementClick?.(s.id)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={classNames(
              'relative rounded-2xl border p-3 md:p-4 shadow-sm cursor-default',
              kindColors(s.kind),
              'hover:shadow-md hover:border-indigo-300'
            )}
          >
            <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">{s.kind}</div>
            <div className={classNames('text-sm text-slate-800 whitespace-pre-wrap', compact && 'text-[13px]')}>{s.text}</div>
          </motion.div>
        ))}
      </div>

      {/* Conclusion */}
      {conclusion && (
        <motion.div
          ref={conclusionRef}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={classNames(
            'max-w-3xl mx-auto rounded-2xl border p-4 md:p-5 shadow-sm',
            'bg-emerald-50 border-emerald-200'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="text-[11px] uppercase tracking-wide text-emerald-700">Conclusion</div>
            {inf.scheme && (
              <span className="text-[11px] text-emerald-700/80 bg-emerald-100 rounded-full px-2 py-[2px]">{inf.scheme}</span>
            )}
          </div>
          <div className="text-slate-900 text-[15px] md:text-base whitespace-pre-wrap">{conclusion.text}</div>

          {/* Evidence (optional) */}
          {diagram.evidence?.length ? (
            <div className="mt-3 pt-3 border-t border-emerald-200/60">
              <div className="text-[11px] uppercase tracking-wide text-emerald-700 mb-1">Evidence</div>
              <ul className="text-sm text-slate-800 list-disc pl-5 space-y-1">
                {diagram.evidence.map((e) => (
                  <li key={e.id}>
                    <a className="underline decoration-dotted underline-offset-2 hover:decoration-solid" href={e.uri} target="_blank" rel="noreferrer">
                      {e.note || e.uri}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </motion.div>
      )}

      {/* Footer note when multiple inferences exist */}
      {diagram.inferences.length > 1 && (
        <div className="mt-3 text-xs text-slate-500 text-center">
          Showing primary inference. ({diagram.inferences.length - 1} more available)
        </div>
      )}
    </div>
  );
}

// ---------------- Usage Notes ----------------
// 1) Fetch your diagram via: GET /api/arguments/:id?view=diagram
//    then render <DiagramView diagram={data.diagram} /> inside a modal/dialog.
// 2) The component auto-measures and draws smooth connectors from each premise
//    to the conclusion, and adapts on resize.
// 3) Pass onStatementClick to hook into node clicks (e.g., open the source card).
