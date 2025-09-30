'use client';
import useSWR from 'swr';
import React from 'react';

type EdgeKind = 'xref' | 'overlap' | 'stack_ref' | 'imports' | 'shared_author';

type RoomNode = {
  id: string;
  title?: string | null;
  nArgs: number;
  nEdges: number;
  accepted: number;
  rejected: number;
  undecided: number;
};

type MetaEdge = { from: string; to: string; kind: EdgeKind; weight: number };
type Network = { scope: 'public' | 'following'; version: number; rooms: RoomNode[]; edges: MetaEdge[] };

const KIND_COLOR: Record<EdgeKind, string> = {
  xref: '#6366f1',         // indigo
  overlap: '#ef4444',      // red
  stack_ref: '#14b8a6',    // teal
  imports: '#f59e0b',      // amber
  shared_author: '#64748b' // slate
};

const COLORS: Record<EdgeKind, string> = {
  xref: '#6366f1',          // indigo
  overlap: '#ef4444',       // red
  stack_ref: '#0891b2',     // cyan
  imports: '#f59e0b',       // amber
  shared_author: '#10b981', // emerald
};


export default function Plexus({
  scope = 'public',
  selectedRoomId,
  onSelectRoom,
}: {
  scope?: 'public' | 'following';
  selectedRoomId?: string | null;
  onSelectRoom?: (id: string) => void;
}) {
  const { data, error, mutate } = useSWR<Network>(
    `/api/agora/network?scope=${scope}`,
    (u: any) => fetch(u, { cache: 'no-store' }).then((r) => r.json())
  );

  const [kindsOn, setKindsOn] = React.useState<Record<EdgeKind, boolean>>({
    xref: true, overlap: true, stack_ref: true, imports: true, shared_author: false
  });

  const [show, setShow] = React.useState<Record<string, boolean>>({
  xref: true, overlap: true, stack_ref: true, imports: true, shared_author: true
});

  const E =
    data?.edges
      ? (data.edges as Array<{ from: string; to: string; kind: EdgeKind; weight: number }>)
          .filter(e => kindsOn[e.kind])
      : [];

                const edges = E.filter(e => visible[e.kind]);


  React.useEffect(() => {
    const bump = () => mutate();
    ['dialogue:changed', 'xref:changed', 'deliberations:created'].forEach(t =>
      window.addEventListener(t, bump as any)
    );
    return () => ['dialogue:changed', 'xref:changed', 'deliberations:created'].forEach(t =>
      window.removeEventListener(t, bump as any)
    );
  }, [mutate]);

  // toggles
  const [visible, setVisible] = React.useState<Record<EdgeKind, boolean>>({
    xref: true, overlap: true, stack_ref: true, imports: true, shared_author: true
  });
  const toggle = (k: EdgeKind) => setVisible(v => ({ ...v, [k]: !v[k] }));

  if (error) return <div className="text-xs text-red-600">Failed to load network</div>;
  if (!data) return <div className="text-xs text-neutral-500">Loading network…</div>;

  const R = data.rooms;
 // const E = data.edges;


  // radial layout
  const W = 720, H = 460;
  const cx = W / 2, cy = H / 2, RADIUS = Math.min(W, H) / 2 - 60;
  const N = Math.max(1, R.length);
  const coords = new Map<string, { x: number; y: number }>();
  R.forEach((r, i) => {
    const a = (i / N) * 2 * Math.PI;
    coords.set(r.id, { x: cx + RADIUS * Math.cos(a), y: cy + RADIUS * Math.sin(a) });
  });

  return (
    <div className="rounded-xl border bg-white/70 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Plexus</div>
        <div className="text-[11px] text-neutral-600">
          Scope: {data.scope} · rooms {R.length} · links {E.length}
        </div>
      </div>

      {/* Legend */}
      {/* <div className="flex flex-wrap items-center gap-3 mb-2">
        {(Object.keys(KIND_COLOR) as EdgeKind[]).map(k => (
          <label key={k} className="inline-flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={visible[k]}
              onChange={() => toggle(k)}
            />
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-1.5 rounded-sm" style={{ background: KIND_COLOR[k] }} />
              {k.replace('_',' ')}
            </span>
          </label>
        ))}
      </div> */}

        {/* Legend / toggles */}
      <div className="flex flex-wrap gap-2 mb-2">
        {(Object.keys(COLORS) as EdgeKind[]).map(k => (
          <label key={k} className="inline-flex items-center gap-1 text-[11px]">
            <input type="checkbox" checked={kindsOn[k]}
              onChange={e => setKindsOn(s => ({ ...s, [k]: e.target.checked }))} />
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-1.5 rounded" style={{ background: COLORS[k] }} />
              {k.replace('_',' ')}
            </span>
          </label>
        ))}
      </div>
     
<div className="flex flex-wrap items-center gap-3 mb-2 text-[11px]">
  {(['xref','overlap','stack_ref','imports','shared_author'] as const).map(k => (
    <label key={k} className="inline-flex items-center gap-1 cursor-pointer">
      <input type="checkbox" checked={!!show[k]} onChange={()=>setShow(s=>({ ...s, [k]: !s[k] }))}/>
      <span className="inline-flex items-center gap-1">
        <span className="w-3 h-1 rounded-sm" style={{background:
          k==='xref' ? '#6366f1' :
          k==='overlap' ? '#ef4444' :
          k==='stack_ref' ? '#10b981' :
          k==='imports' ? '#f59e0b' :
          '#64748b' }} />
        {k}
      </span>
    </label>
  ))}
</div>

         <div className="relative overflow-hidden rounded-lg bg-slate-50">
        <svg width={W} height={H} className="block">
         {E.filter(e => show[e.kind]).map((e, i) => { 
            const a = coords.get(e.from), b = coords.get(e.to);
            if (!a || !b) return null;
            const w = Math.min(6, 1 + (e.weight ?? 1));
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                         stroke={COLORS[e.kind]} strokeOpacity={0.28} strokeWidth={w} />;
          })}

          {/* nodes */}
          {R.map((r) => {
            const p = coords.get(r.id)!;
            const total = Math.max(1, r.accepted + r.rejected + r.undecided);
            const acc = r.accepted / total;
            const size = 18 + Math.sqrt(r.nArgs) * 3;
            const isSel = selectedRoomId === r.id;
            const ringLen = 2 * Math.PI * (size + 5);
            return (
              <g key={r.id} transform={`translate(${p.x},${p.y})`} style={{ cursor: 'pointer' }} onClick={() => onSelectRoom?.(r.id)}>
                <circle r={size} fill={isSel ? '#10b981' : '#0ea5e9'} fillOpacity={isSel ? 0.9 : 0.75} stroke={isSel ? '#065f46' : '#0369a1'} strokeWidth={isSel ? 2 : 1} />
                <circle r={size + 5} stroke="#10b981" strokeWidth="3" strokeDasharray={`${ringLen * acc} ${ringLen}`} transform="rotate(-90)" fill="none" />
                <text textAnchor="middle" y={size + 14} className="fill-slate-700 text-[10px]">
                  {r.title ?? `room:${r.id.slice(0, 6)}…`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

       <div className="mt-2 text-[11px] text-neutral-600">
        Node size ∝ #arguments; green ring = accepted share; link colors: indigo(xref), red(overlap), cyan(stack),
        amber(imports), emerald(shared author).
      </div>
    </div>
  );
}