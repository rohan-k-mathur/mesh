'use client';
import React from 'react';
import useSWR from 'swr';
import clsx from 'clsx';
import { useConfidence } from './useConfidence';
import { useRoomGraphPrefetch } from '@/components/agora/useRoomGraphPrefetch';

/** ---------------- Types & constants ---------------- */
type EdgeKind = 'xref'|'overlap'|'stack_ref'|'imports'|'shared_author';
type LinkSketchKind = EdgeKind | 'transport';

type RoomNode = {
  id: string;
  title?: string | null;
  nArgs: number;
  nEdges: number;
  accepted: number;
  rejected: number;
  undecided: number;
  tags?: string[];
  updatedAt?: string | null;
};

type MetaEdge = { from: string; to: string; kind: EdgeKind; weight: number };
type Network = { scope: 'public'|'following'; version: number; rooms: RoomNode[]; edges: MetaEdge[] };

const EDGE_COLORS: Record<EdgeKind,string> = {
  xref:'#6366f1',          // indigo
  overlap:'#ef4444',       // red
  stack_ref:'#f59e0b',     // amber
  imports:'#14b8a6',       // teal
  shared_author:'#64748b', // slate
};
const EDGE_LABELS: Record<EdgeKind,string> = {
  xref:'Cross‑ref', overlap:'Overlap', stack_ref:'Stack ref', imports:'Imports', shared_author:'Shared author'
};

type OrderBy   = 'recent'|'size'|'accept'|'alpha';
type LabelMode = 'auto'|'hover'|'always';

/** ------------- Local persistence utility ------------- */
function usePersistentState<T>(key: string, initial: T) {
  const [state, set] = React.useState<T>(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch { return initial; }
  });
  React.useEffect(() => { try { localStorage.setItem(key, JSON.stringify(state)); } catch {} }, [key, state]);
  return [state, set] as const;
}

/** -------------------- Main component -------------------- */
export default function Plexus({
  scope = 'public',
  selectedRoomId,
  onSelectRoom,
  onLinkCreated,
}: {
  scope?: 'public'|'following';
  selectedRoomId?: string | null;
  onSelectRoom?: (id: string) => void;
  onLinkCreated?: () => void;
}) {
  const { mode, tau } = useConfidence();
  const prefetch = useRoomGraphPrefetch();

  const { data, error, mutate } = useSWR<Network>(
    `/api/agora/network?scope=${scope}`,
    (u) => fetch(u, { cache: 'no-store' }).then((r) => r.json()),
    { revalidateOnFocus: false }
  );

  // Confidence gating cache
  const gatedShare = React.useRef(new Map<string, number>());
  React.useEffect(() => { gatedShare.current.clear(); }, [mode, tau]);
  const fetchGated = React.useCallback(async (rid: string) => {
    if (gatedShare.current.has(rid)) return gatedShare.current.get(rid)!;
    const gm = mode === 'ds' ? 'product' : mode;
    const qs = new URLSearchParams({ semantics:'preferred', mode: gm, ...(tau!=null?{confidence:String(tau)}:{}) });
    const r = await fetch(`/api/deliberations/${rid}/graph?`+qs, { cache:'no-store' }).catch(()=>null);
    const g = await r?.json().catch(()=>null);
    const total = Array.isArray(g?.nodes) ? g.nodes.length : 0;
    const inCount = total ? g.nodes.filter((n: any) => n.label === 'IN').length : 0;
    const share = total ? inCount / total : 0;
    gatedShare.current.set(rid, share);
    return share;
  }, [mode, tau]);

  // System events → refresh
  React.useEffect(() => {
    const bump = () => mutate();
    const evts = ['dialogue:changed','xref:changed','deliberations:created','plexus:links:changed','roomFunctor:changed'];
    evts.forEach((t) => window.addEventListener(t, bump as any));
    return () => evts.forEach((t) => window.removeEventListener(t, bump as any));
  }, [mutate]);

  /** ---------- UI state ---------- */
  const [edgeOn, setEdgeOn] = usePersistentState<Record<EdgeKind, boolean>>(
    'plexus:edgeOn',
    { xref:true, overlap:true, stack_ref:true, imports:true, shared_author:false }
  );
  const [bundleEdges, setBundleEdges] = usePersistentState<boolean>('plexus:bundle', true);
  const [orderBy, setOrderBy]       = usePersistentState<OrderBy>('plexus:order', 'recent');
  const [labelMode, setLabelMode]   = usePersistentState<LabelMode>('plexus:labels', 'auto');
  const [q, setQ]                   = usePersistentState<string>('plexus:q', '');
  const [sel, setSel]               = React.useState<string[]>([]); // up to 2 rooms
  const [hoverRoom, setHoverRoom]   = React.useState<string|null>(null);
  const [hoverEdge, setHoverEdge]   = React.useState<MetaEdge|null>(null);

  // Tag filters
  const allRooms = data?.rooms ?? [];
  const allEdges = (data?.edges ?? []).filter(e => edgeOn[e.kind]);
  const allTags  = React.useMemo(() => {
    const s = new Set<string>();
    allRooms.forEach(r => (r.tags ?? []).forEach(t => s.add(t)));
    return Array.from(s).sort((a,b)=>a.localeCompare(b));
  }, [allRooms]);
  const [selectedTags, setSelectedTags] = usePersistentState<string[]>('plexus:tags', []);

  // Link sketch mode
  const [linkMode, setLinkMode] = usePersistentState<boolean>('plexus:linkMode', false);
  const [linkKind, setLinkKind] = usePersistentState<LinkSketchKind>('plexus:linkKind', 'imports');
  const [drag, setDrag] = React.useState<{ srcId: string; x: number; y: number } | null>(null);
  const [dragTarget, setDragTarget] = React.useState<string | null>(null);

  // Keyboard helpers
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSel([]); setDrag(null); setDragTarget(null); }
      if (e.key.toLowerCase() === 'f' && (e.ctrlKey || e.metaKey)) {
        (document.getElementById('plexus-search') as HTMLInputElement | null)?.focus();
        e.preventDefault();
      }
      if (e.key.toLowerCase() === 'l') setLinkMode(v => !v);
      if (e.key === 'Enter' && sel.length === 2) {
        window.location.assign(`/functor/transport?from=${sel[0]}&to=${sel[1]}`);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sel]);


  /** ---------------- Filter / order rooms ---------------- */
  const qNorm = q.trim().toLowerCase();
  const tagSet = new Set(selectedTags);
  const rooms = React.useMemo(() => {
    const tagged = allRooms.filter(r => tagSet.size === 0 || (r.tags ?? []).some(t => tagSet.has(t)));
    const src = qNorm
      ? tagged.filter(r => (r.title ?? '').toLowerCase().includes(qNorm) || r.id.toLowerCase().includes(qNorm))
      : tagged;

    const accShare = (r: RoomNode) => {
      const t = Math.max(1, r.accepted + r.rejected + r.undecided);
      return r.accepted / t;
    };
    const hash = (s: string) => { let h = 2166136261 >>> 0; for (let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h = Math.imul(h, 16777619);} return h>>>0; };

    return src.slice().sort((a, b) => {
      if (orderBy === 'recent') {
        const ta = a.updatedAt ? +new Date(a.updatedAt) : 0;
        const tb = b.updatedAt ? +new Date(b.updatedAt) : 0;
        return tb - ta;
      }
      if (orderBy === 'size')   return (b.nArgs|0) - (a.nArgs|0);
      if (orderBy === 'accept') return accShare(b) - accShare(a);
      return (hash(a.id)%1000) - (hash(b.id)%1000); // α‑order (stable-ish)
    });
  }, [allRooms, selectedTags, qNorm, orderBy]);

  const visibleIds = new Set(rooms.map(r => r.id));

  // Edge filter for visible rooms only
  const filteredEdges = allEdges.filter(e => visibleIds.has(e.from) && visibleIds.has(e.to));

  // Edge bundling (group by pair+kind)
  const edges = React.useMemo(() => {
    if (!bundleEdges) return filteredEdges;
    const m = new Map<string, { from:string; to:string; kind:EdgeKind; weight:number; count:number }>();
    for (const e of filteredEdges) {
      const a = e.from < e.to ? e.from : e.to;
      const b = e.from < e.to ? e.to   : e.from;
      const k = `${a}|${b}|${e.kind}`;
      const cur = m.get(k);
      if (cur) { cur.weight += e.weight; cur.count += 1; }
      else m.set(k, { from:a, to:b, kind:e.kind, weight:e.weight, count:1 });
    }
    return Array.from(m.values()).map(v => ({ from:v.from, to:v.to, kind:v.kind, weight:v.weight })) as MetaEdge[];
  }, [filteredEdges, bundleEdges]);

  /** ---------------- Layout & interaction ---------------- */
  const { ref: wrapRef, w, h } = useMeasure();
  const { svgRef, transform, handlers, resetZoom, clientToWorld, centerOn } = useZoomPan({ width: w, height: h });

  // Radial coordinates (stable & memoized)
  const coords = React.useMemo(() => {
    const cx = w/2, cy = h/2;
    const RADIUS = Math.max(120, Math.min(w, h)/2 - 70);
    const out = new Map<string, { x: number; y: number }>();
    const N = Math.max(1, rooms.length);
    rooms.forEach((r, i) => {
      const a = (i / N) * 2 * Math.PI;
      out.set(r.id, { x: cx + RADIUS * Math.cos(a), y: cy + RADIUS * Math.sin(a) });
    });
    return out;
  }, [rooms, w, h]);

  React.useEffect(() => {
  const svg = svgRef.current;
  if (!svg) return;
  const handler = (e: WheelEvent) => { e.preventDefault(); };
  // Make sure this listener is non-passive to allow preventDefault
  svg.addEventListener('wheel', handler, { passive: false });
  return () => svg.removeEventListener('wheel', handler);
}, [svgRef]);

  // Hit‑testing for link sketch mode
  const nearestRoom = React.useCallback((wx: number, wy: number) => {
    let best: { id: string; d2: number } | null = null;
    for (const r of rooms) {
      const p = coords.get(r.id)!;
      const dx = wx - p.x, dy = wy - p.y;
      const d2 = dx*dx + dy*dy;
      const size = 18 + Math.sqrt(Math.max(0, r.nArgs)) * 3;
      const hitR = size + 18; // generous (outer ring)
      if (d2 <= (hitR*hitR) && (!best || d2 < best.d2)) best = { id: r.id, d2 };
    }
    return best?.id ?? null;
  }, [rooms, coords]);


  function toggleSel(id: string, meta?: boolean) {
    setSel(prev => {
      if (!meta) return prev.includes(id) ? [] : [id];
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length === 2)  return [prev[1], id];
      return [...prev, id];
    });
    onSelectRoom?.(id);
  }

  async function createLink(kind: Exclude<EdgeKind,'overlap'|'shared_author'>, fromId: string, toId: string) {
    const r = await fetch('/api/agora/links', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ kind, fromId, toId })
    });
    if (!r.ok) throw new Error(await r.text());
    window.dispatchEvent(new CustomEvent('plexus:links:changed'));
    onLinkCreated?.();
  }

  // Labels: render decision
  const showLabel = (id: string, isHovered: boolean, isSelected: boolean) => {
    if (labelMode === 'always') return true;
    if (labelMode === 'hover')  return isHovered || isSelected;
    // auto: show when zoomed in or hovered/selected
    return isHovered || isSelected || transform.k >= 1.25;
  };

  /** --------------------- Rendering ---------------------- */
  const edgeTooltip = hoverEdge ? `${EDGE_LABELS[hoverEdge.kind]} • weight ${Math.round(hoverEdge.weight)}` : null;

  // Content bounds (for minimap)
  const bounds = React.useMemo(() => {
    if (!rooms.length) return { minX:0, minY:0, maxX:w, maxY:h };
    let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
    for (const r of rooms) {
      const p = coords.get(r.id)!;
      const size = 18 + Math.sqrt(Math.max(0, r.nArgs)) * 3 + 22; // include rings
      minX = Math.min(minX, p.x - size); maxX = Math.max(maxX, p.x + size);
      minY = Math.min(minY, p.y - size); maxY = Math.max(maxY, p.y + size);
    }
    return { minX, minY, maxX, maxY };
  }, [rooms, coords, w, h]);


  if (error) return <div className="text-xs text-red-600">Failed to load network</div>;
  if (!data)  return <div className="text-xs text-neutral-500 ml-10">Loading network…</div>;


  return (
    <div className="rounded-xl border bg-white/80 p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 gap-3">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold">Plexus</div>
          <span className="text-[11px] text-neutral-600">Scope: {data.scope}</span>
          <span className="text-[11px] text-neutral-600">• rooms {rooms.length}</span>
          <span className="text-[11px] text-neutral-600">• links {edges.length}</span>
        </div>

        {/* Controls: tags + search + order + label + bundle + link mode */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tag pills */}
          {!!allTags.length && (
            <div className="flex items-center gap-1 max-w-[420px] overflow-x-auto">
              {allTags.map(t => {
                const active = selectedTags.includes(t);
                return (
                  <button
                    key={t}
                    className={clsx(
                      'px-1.5 py-[2px] rounded-full border text-[11px]',
                      active ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 hover:bg-slate-50'
                    )}
                    onClick={() => setSelectedTags(a => active ? a.filter(x=>x!==t) : [...a, t])}
                    title={`Filter by ${t}`}
                  >
                    {t}
                  </button>
                );
              })}
              {selectedTags.length > 0 && (
                <button className="px-1.5 py-[2px] rounded-full border text-[11px]" onClick={()=>setSelectedTags([])} title="Clear tag filters">clear</button>
              )}
            </div>
          )}

          <input
            id="plexus-search"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder="Search rooms…"
            className="px-2 py-1 text-[12px] rounded border bg-white/70"
          />
          <select
            className="px-2 py-1 text-[12px] rounded border bg-white/70"
            value={orderBy}
            onChange={(e)=>setOrderBy(e.target.value as OrderBy)}
            title="Order"
          >
            <option value="recent">recent</option>
            <option value="size">size</option>
            <option value="accept">acceptance</option>
            <option value="alpha">α‑order</option>
          </select>
          <select
            className="px-2 py-1 text-[12px] rounded border bg-white/70"
            value={labelMode}
            onChange={(e)=>setLabelMode(e.target.value as LabelMode)}
            title="Label mode"
          >
            <option value="auto">labels: auto</option>
            <option value="hover">labels: hover</option>
            <option value="always">labels: always</option>
          </select>
          <label className="inline-flex items-center gap-1 text-[12px]">
            <input type="checkbox" className="accent-slate-600" checked={bundleEdges} onChange={e=>setBundleEdges(e.target.checked)} />
            <span>bundle edges</span>
          </label>

          {/* Link sketch mode */}
          <label className="inline-flex items-center gap-1 text-[12px]">
            <input type="checkbox" className="accent-slate-600" checked={linkMode} onChange={e=>setLinkMode(e.target.checked)} />
            <span>link mode</span>
          </label>
          <select
            className="px-2 py-1 text-[12px] rounded border bg-white/70"
            value={linkKind}
            onChange={(e)=>setLinkKind(e.target.value as LinkSketchKind)}
            title="Link kind"
            disabled={!linkMode}
          >
            <option value="imports">imports</option>
            <option value="xref">xref</option>
            <option value="stack_ref">stack_ref</option>
            <option value="transport">transport</option>
          </select>
          <button className="px-2 py-1 text-[12px] rounded border bg-white/70" onClick={resetZoom}>reset</button>
        </div>
      </div>

      {/* Edge toggles */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] mb-2">
        {(Object.keys(EDGE_COLORS) as EdgeKind[]).map(k => (
          <label key={k} className="inline-flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox" className="accent-slate-600"
              checked={edgeOn[k]}
              onChange={e=>setEdgeOn(s=>({ ...s, [k]: e.target.checked }))}
            />
            <span className="inline-block w-2 h-2 rounded" style={{ background: EDGE_COLORS[k] }} />
            <span>{k.replace('_',' ')}</span>
          </label>
        ))}
        <div className="ml-auto text-[11px] text-neutral-500">
          {sel.length ? `Selected: ${sel.map(s => s.slice(0,6)+'…').join(' → ')}` : 'Click to select; Ctrl/Cmd‑click multi‑select • L toggles link mode'}
        </div>
      </div>

      {/* Canvas */}
      <div ref={wrapRef}
        className="relative overflow-hidden rounded-lg bg-slate-50 border h-[520px] md:h-[560px]">
        <svg
          ref={svgRef}
          width={w} height={h} className="block"
          onWheel={handlers.onWheel}
          onPointerDown={(e) => {
            if (!linkMode) handlers.onPointerDown(e as any);
          }}
          onPointerMove={(e) => {
            if (drag) {
              const pt = clientToWorld(e);
              setDrag(d => d ? { ...d, x: pt.x, y: pt.y } : d);
              setDragTarget(nearestRoom(pt.x, pt.y));
            } else {
              handlers.onPointerMove(e as any);
            }
          }}
          onPointerUp={(e) => {
            if (drag) {
              const src = drag.srcId;
              const tgt = dragTarget;
              setDrag(null); setDragTarget(null);
              if (tgt && tgt !== src) {
                if (linkKind === 'transport') {
                  window.location.assign(`/functor/transport?from=${src}&to=${tgt}`);
                } else {
                  const kind = linkKind as Exclude<LinkSketchKind,'transport'>;
                  createLink(kind, src, tgt).catch(err => { console.error(err); alert('Failed to create link'); });
                }
              }
            }
            handlers.onPointerUp(e as any);
          }}
          style={{ touchAction:'none', cursor: (drag ? 'grabbing' : (handlers as any)._cursor ?? (linkMode ? 'crosshair' : 'default')) }}
        >
          <defs>
            <marker id="arrow-tip" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#334155" />
            </marker>
          </defs>

          <g transform={`translate(${transform.tx},${transform.ty}) scale(${transform.k})`}>
            {/* Edges */}
            {edges.map((e, i) => {
              const a = coords.get(e.from), b = coords.get(e.to);
              if (!a || !b) return null;
              const wgt = Math.min(10, Math.max(1, Math.sqrt(Math.max(1, e.weight)))); // bundle → thicker
              const dx = b.x - a.x, dy = b.y - a.y;
              const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
              const nx = -dy, ny = dx;
              const norm = Math.hypot(nx, ny) || 1;
              const off = 10; // gentle curvature
              const cx = mx + (nx / norm) * off;
              const cy = my + (ny / norm) * off;
              const color = EDGE_COLORS[e.kind];

              return (
                <path
                  key={i}
                  d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`}
                  fill="none"
                  stroke={color}
                  strokeOpacity={hoverEdge === e ? 0.6 : 0.22}
                  strokeWidth={wgt}
                  onMouseEnter={() => setHoverEdge(e)}
                  onMouseLeave={() => setHoverEdge(null)}
                />
              );
            })}

            {/* Nodes */}
            {rooms.map(r => {
              const p = coords.get(r.id)!;
              const total = Math.max(1, r.accepted + r.rejected + r.undecided);
              const acc = r.accepted / total;
              const rej = r.rejected / total;
              const und = r.undecided / total;
              const size = 18 + Math.sqrt(Math.max(0, r.nArgs)) * 3;
              const isSel = (selectedRoomId === r.id) || sel.includes(r.id);
              const faded = selectedTags.length > 0 && !(r.tags ?? []).some(t => tagSet.has(t));

              const ring = (rad:number, color:string, share:number, w=3) => {
                const L = 2 * Math.PI * rad;
                return (
                  <circle
                    r={rad}
                    stroke={color}
                    strokeWidth={w}
                    strokeDasharray={`${L * share} ${L}`}
                    transform="rotate(-90)"
                    fill="none"
                  />
                );
              };

              return (
                <g
                  key={r.id}
                  transform={`translate(${p.x},${p.y})`}
                  style={{ cursor: linkMode ? 'crosshair' : 'pointer', opacity: faded ? 0.35 : 1 }}
                  onClick={(e) => !linkMode && toggleSel(r.id, e.metaKey || e.ctrlKey)}
                  onDoubleClick={() => !linkMode && window.location.assign(`/deliberation/${r.id}`)}
                  onMouseEnter={() => { prefetch(r.id); setHoverRoom(r.id); fetchGated(r.id); }}
                  onMouseLeave={() => setHoverRoom(cur => (cur === r.id ? null : cur))}
                  onPointerDown={(e) => {
                    if (linkMode) {
                      e.stopPropagation();
                      const pt = clientToWorld(e);
                      setDrag({ srcId: r.id, x: pt.x, y: pt.y });
                    }
                  }}
                >
                  {/* Node body */}
                  <circle
                    r={size}
                    fill={isSel ? '#10b981' : '#0ea5e9'}
                    fillOpacity={isSel ? 0.95 : 0.8}
                    stroke={isSel ? '#065f46' : '#0369a1'}
                    strokeWidth={isSel ? 2 : 1}
                    style={{ filter:'drop-shadow(0 1px 0.5px rgba(0,0,0,0.05))' }}
                  />
                  {/* Donut rings */}
                  {ring(size+6,  '#10b981', acc, 3)}
                  {ring(size+10, '#f43f5e', rej, 2)}
                  {ring(size+14, '#94a3b8', und, 2)}
                  {/* τ‑gated ring (violet) */}
                  {tau!=null && gatedShare.current.has(r.id) && (() => {
                    const gated = gatedShare.current.get(r.id)!;
                    const L = 2 * Math.PI * (size + 18);
                    return (
                      <circle
                        r={size + 18}
                        stroke="#7c3aed"
                        strokeWidth="2"
                        strokeDasharray={`${L * gated} ${L}`}
                        transform="rotate(-90)"
                        fill="none"
                        opacity={0.95}
                      />
                    );
                  })()}
                  {/* Label */}
                  {showLabel(r.id, hoverRoom === r.id, isSel) && (
                    <text textAnchor="middle" y={size + 16} className="fill-slate-700 text-[10px] pointer-events-none">
                      {r.title ?? `room:${r.id.slice(0, 6)}…`}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Link sketch ghost arrow */}
            {drag && (() => {
              const a = coords.get(drag.srcId);
              if (!a) return null;
              const x2 = dragTarget ? coords.get(dragTarget)!.x : drag.x;
              const y2 = dragTarget ? coords.get(dragTarget)!.y : drag.y;
              const mx = (a.x + x2) / 2, my = (a.y + y2) / 2;
              const dx = x2 - a.x, dy = y2 - a.y;
              const nx = -dy, ny = dx;
              const norm = Math.hypot(nx, ny) || 1;
              const off = 10;
              const cx = mx + (nx / norm) * off;
              const cy = my + (ny / norm) * off;

              return (
                <path
                  d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${x2} ${y2}`}
                  fill="none"
                  stroke="#334155"
                  strokeWidth={2}
                  strokeOpacity={0.7}
                  markerEnd="url(#arrow-tip)"
                />
              );
            })()}
          </g>
        </svg>

        {/* Edge tooltip */}
        {edgeTooltip && (
          <div className="absolute bottom-2 right-2 text-[11px] px-2 py-1 rounded bg-black/70 text-white pointer-events-none">
            {edgeTooltip}
          </div>
        )}

        {/* Room hover card */}
        {hoverRoom && (() => {
          const r = allRooms.find(x => x.id === hoverRoom);
          if (!r) return null;
          const total = Math.max(1, r.accepted + r.rejected + r.undecided);
          const acc = r.accepted / total, rej = r.rejected / total, und = r.undecided / total;
          const gated = gatedShare.current.get(r.id);
          return (
            <div className="absolute top-2 left-2 rounded-lg bg-white/90 backdrop-blur border px-3 py-2 text-[12px] shadow-sm">
              <div className="font-medium text-[12px] truncate max-w-[320px]">{r.title ?? r.id}</div>
              <div className="text-[11px] text-slate-600">
                args {r.nArgs} • edges {r.nEdges} • acc {Math.round(acc*100)}% • rej {Math.round(rej*100)}% • und {Math.round(und*100)}%
                {tau!=null && gated!=null && <> • τ‑gated IN {Math.round(gated*100)}%</>}
              </div>
              <div className="mt-1 flex gap-1">
                {!linkMode && (
                  <>
                    <button className="px-1.5 py-0.5 rounded border hover:bg-slate-50" onClick={() => window.location.assign(`/deliberation/${r.id}`)}>open</button>
                    <button className="px-1.5 py-0.5 rounded border hover:bg-slate-50" onClick={() => window.location.assign(`/sheets/delib:${r.id}`)}>sheet</button>
                    {sel.length === 1 && sel[0] !== r.id && (
                      <button className="px-1.5 py-0.5 rounded border hover:bg-slate-50" onClick={() => window.location.assign(`/functor/transport?from=${sel[0]}&to=${r.id}`)}>
                        transport {sel[0].slice(0,4)}→{r.id.slice(0,4)}
                      </button>
                    )}
                  </>
                )}
                {linkMode && <span className="text-[11px] text-slate-600">link: {linkKind}</span>}
              </div>
            </div>
          );
        })()}

        {/* Minimap */}
        <Minimap
          rooms={rooms} coords={coords} edges={edges}
          bounds={bounds} transform={transform}
           mainSvgRef={svgRef}
          onJump={(wx, wy) => centerOn(wx, wy)}
        />
      </div>

      {/* Action bar (still available for explicit two‑select) */}
      {sel.length === 2 && !linkMode && (
        <div className="mt-2 flex items-center gap-2 text-[12px]">
          <div className="text-neutral-600">Create link:</div>
          <button className="px-2 py-1 rounded border hover:bg-slate-50"
                  onClick={() => window.location.assign(`/functor/transport?from=${sel[0]}&to=${sel[1]}`)}>
            transport
          </button>
          <button className="px-2 py-1 rounded border hover:bg-indigo-50" onClick={() => createLink('xref', sel[0], sel[1])}>xref</button>
          <button className="px-2 py-1 rounded border hover:bg-amber-50" onClick={() => createLink('stack_ref', sel[0], sel[1])}>stack_ref</button>
          <button className="px-2 py-1 rounded border hover:bg-teal-50" onClick={() => createLink('imports', sel[0], sel[1])}>imports</button>
          <div className="ml-auto text-[11px] text-neutral-500">Tip: double‑click a room to open • Esc clears • Enter = transport • L toggles link mode</div>
        </div>
      )}

      <div className="mt-2 text-[11px] text-neutral-600">
        Node size ∝ #arguments. Rings: <span className="text-emerald-600">green=accepted</span>, <span className="text-rose-600">red=rejected</span>, <span className="text-slate-500">slate=undecided</span>{tau!=null && <>; <span className="text-violet-600">violet=τ‑gated IN</span></>}. Edge color reflects type; toggles filter visibility.
      </div>
    </div>
  );
}

/** ---------------------- Minimap ---------------------- */
function Minimap({
  rooms,
  coords,
  edges,
  bounds,
  transform,
  onJump,
  mainSvgRef,
}: {
  rooms: RoomNode[];
  coords: Map<string,{x:number;y:number}>;
  edges: MetaEdge[];
  bounds: { minX:number; minY:number; maxX:number; maxY:number };
  transform: { k:number; tx:number; ty:number };
  onJump: (wx:number, wy:number) => void;
    mainSvgRef: React.RefObject<SVGSVGElement>;

}) {
  const W = 180, H = 120, P = 8;
  const width  = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  const sx = (W - 2*P) / width;
  const sy = (H - 2*P) / height;
  const s  = Math.min(sx, sy);

    const mainRect = mainSvgRef.current?.getBoundingClientRect();
  const mainW = mainRect?.width ?? 800;
  const mainH = mainRect?.height ?? 480;
  const invK = 1 / transform.k;
  const wx0 = (-transform.tx) * invK;
  const wy0 = (-transform.ty) * invK;
  const vx1 = wx0 + mainW * invK;
  const vy1 = wy0 + mainH * invK;



  const toMini = (x:number,y:number) => ({
    x: P + (x - bounds.minX) * s,
    y: P + (y - bounds.minY) * s
  });

  const viewA = toMini(wx0, wy0);
  const viewB = toMini(vx1, vy1);

  return (
    <div className="absolute bottom-2 left-2 rounded border bg-white/90 backdrop-blur px-1.5 py-1 shadow-sm">
      <svg width={W} height={H}
           onClick={(e) => {
             const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
             const mx = e.clientX - r.left, my = e.clientY - r.top;
             const wx = bounds.minX + (mx - P) / s;
             const wy = bounds.minY + (my - P) / s;
             onJump(wx, wy);
           }}
           style={{ cursor:'zoom-in' }}>
        {/* edges */}
        {edges.slice(0,500).map((e,i) => {
          const a = coords.get(e.from), b = coords.get(e.to);
          if (!a || !b) return null;
          const A = toMini(a.x, a.y), B = toMini(b.x, b.y);
          return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#94a3b8" strokeOpacity="0.45" strokeWidth="1" />;
        })}
        {/* nodes */}
        {rooms.map(r => {
          const p = coords.get(r.id)!;
          const M = toMini(p.x, p.y);
          return <circle key={r.id} cx={M.x} cy={M.y} r={2} fill="#0ea5e9" />;
        })}
        {/* viewport */}
        <rect x={Math.min(viewA.x, viewB.x)} y={Math.min(viewA.y, viewB.y)}
              width={Math.abs(viewB.x - viewA.x)} height={Math.abs(viewB.y - viewA.y)}
              fill="none" stroke="#111827" strokeOpacity="0.6" strokeWidth={1}/>
      </svg>
    </div>
  );
}

/** ---------------------- Hooks (local) ---------------------- */
function useMeasure() {
  const ref = React.useRef<HTMLDivElement|null>(null);
  const [w, setW] = React.useState(760);
  // Height is controlled by CSS (wrapper has h-[…]); we return a stable number
  const [h] = React.useState(520);

  React.useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      // Only width changes based on layout; floor to avoid 1px “creep”
      setW(Math.max(320, Math.floor(r.width)));
    });
    ro.observe(el);
    // initial
    const init = el.getBoundingClientRect();
    setW(Math.max(320, Math.floor(init.width)));
    return () => ro.disconnect();
  }, []);

  return { ref, w, h } as const;
}

function useZoomPan({ width, height }: { width: number; height: number }) {
  const svgRef = React.useRef<SVGSVGElement|null>(null);
  const [k, setK] = React.useState(1);
  const [tx, setTx] = React.useState(0);
  const [ty, setTy] = React.useState(0);
  const dragging = React.useRef(false);
  const last = React.useRef<{ x: number; y: number } | null>(null);
  const [cursor, setCursor] = React.useState<string|undefined>(undefined);

  const onWheel = React.useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = -e.deltaY;
    const factor = Math.exp(delta * 0.001);
    const nk = Math.min(4, Math.max(0.4, k * factor));
    // Zoom around cursor
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const dx = cx - tx, dy = cy - ty;
    setTx(cx - dx * (nk / k));
    setTy(cy - dy * (nk / k));
    setK(nk);
  }, [k, tx, ty]);

  const onPointerDown = React.useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    (e.currentTarget as any).setPointerCapture(e.pointerId);
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    setCursor('grabbing');
  }, []);
  const onPointerMove = React.useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current || !last.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    setTx(v => v + dx);
    setTy(v => v + dy);
    last.current = { x: e.clientX, y: e.clientY };
  }, []);
  const onPointerUp = React.useCallback((_e: React.PointerEvent<SVGSVGElement>) => {
    dragging.current = false;
    last.current = null;
    setCursor(undefined);
  }, []);

  function clientToWorld(e: React.PointerEvent<SVGSVGElement>) {
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    return { x: (sx - tx) / k, y: (sy - ty) / k };
  }
  function centerOn(wx: number, wy: number) {
    // center the main viewport on (wx,wy)
    setTx(width/2 - k * wx);
    setTy(height/2 - k * wy);
  }

  return {
    svgRef,
    transform: { k, tx, ty },
    handlers: { onWheel, onPointerDown, onPointerMove, onPointerUp, _cursor: cursor } as any,
    resetZoom: () => { setK(1); setTx(0); setTy(0); },
    clientToWorld,
    centerOn
  } as const;
}
