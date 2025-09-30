'use client';
import useSWR from 'swr';
import React from 'react';
import clsx from 'clsx';

type RoomNode = {
  id: string;
  title?: string | null;
  nArgs: number;
  nEdges: number;
  accepted: number;
  rejected: number;
  undecided: number;
  tags?: string[];
  updatedAt?: string;
};

type MetaEdge = { from: string; to: string; kind: 'xref' | 'overlap'; weight: number };

type Network = {
  scope: 'public' | 'following';
  version: number;
  rooms: RoomNode[];
  edges: MetaEdge[];
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
    (u) => fetch(u, { cache: 'no-store' }).then((r) => r.json())
  );

  React.useEffect(() => {
    const bump = () => mutate();
    const evts = ['dialogue:changed', 'xref:changed', 'deliberations:created'];
    evts.forEach((t) => window.addEventListener(t, bump as any));
    return () => evts.forEach((t) => window.removeEventListener(t, bump as any));
  }, [mutate]);

  if (error) return <div className="text-xs text-red-600">Failed to load network</div>;
  if (!data) return <div className="text-xs text-neutral-500">Loading network…</div>;

  const R = data.rooms;
  const E = data.edges;

  // simple radial layout (no external deps)
  const W = 720,
    H = 460;
  const cx = W / 2,
    cy = H / 2,
    RADIUS = Math.min(W, H) / 2 - 60;
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

      <div className="relative overflow-hidden rounded-lg bg-slate-50">
        <svg width={W} height={H} className="block">
          {/* edges */}
          {E.map((e, i) => {
            const a = coords.get(e.from),
              b = coords.get(e.to);
            if (!a || !b) return null;
            const w = Math.min(6, 1 + (e.weight ?? 1));
            const color = e.kind === 'xref' ? '#6366f1' : '#ef4444'; // indigo xref, red overlap
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeOpacity={0.25} strokeWidth={w} />;
          })}

          {/* nodes */}
          {R.map((r) => {
            const p = coords.get(r.id)!;
            const total = Math.max(1, r.accepted + r.rejected + r.undecided);
            const acc = r.accepted / total; // 0..1
            const size = 18 + Math.sqrt(r.nArgs) * 3;
            const isSel = selectedRoomId === r.id;

            const ringLen = 2 * Math.PI * (size + 5);
            return (
              <g key={r.id} transform={`translate(${p.x},${p.y})`} style={{ cursor: 'pointer' }} onClick={() => onSelectRoom?.(r.id)}>
                <circle
                  r={size}
                  fill={isSel ? '#10b981' : '#0ea5e9'}
                  fillOpacity={isSel ? 0.9 : 0.75}
                  stroke={isSel ? '#065f46' : '#0369a1'}
                  strokeWidth={isSel ? 2 : 1}
                />
                {/* acceptance ring */}
                <circle
                  r={size + 5}
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeDasharray={`${ringLen * acc} ${ringLen}`}
                  transform="rotate(-90)"
                  fill="none"
                />
                {/* label */}
                <text textAnchor="middle" y={size + 14} className="fill-slate-700 text-[10px]">
                  {r.title ?? `room:${r.id.slice(0, 6)}…`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 text-[11px] text-neutral-600">
        Node size ∝ #arguments; green ring = accepted share; link color: indigo (explicit cross‑ref), red (canonical‑claim overlap).
      </div>
    </div>
  );
}
