'use client';
import * as React from 'react';
import type { MinimapProps, MinimapNode } from './types';

export function AFMinimap({
  nodes, edges, selectedId, onSelectNode,
  width = 240, height = 160, showLegend = true
}: MinimapProps) {
  // naive circular layout (replace with force layout later)
  const R = Math.min(width, height) * 0.42;
  const center = { x: width/2, y: height/2 };
  const polar = (i:number, n:number) => {
    const a = (i / n) * 2 * Math.PI - Math.PI/2;
    return { x: center.x + R * Math.cos(a), y: center.y + R * Math.sin(a) };
  };

  const pos: Record<string, {x:number;y:number}> = {};
  nodes.forEach((n,i) => (pos[n.id] = polar(i, nodes.length)));

  const color = (n: MinimapNode) =>
    n.fogged ? '#C7CED6' :
    n.status === 'IN' ? '#16a34a' :
    n.status === 'OUT' ? '#dc2626' :
    '#64748b';

  return (
    <div className="rounded-xl border bg-white/80 shadow-sm p-2">
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
        {/* edges */}
        {edges.map(e => {
          const a = pos[e.from], b = pos[e.to];
          if (!a || !b) return null;
          const stroke = e.kind === 'support' ? '#64748b' : e.kind === 'rebut' ? '#dc2626' : '#a16207';
          const dash = e.kind === 'undercut' ? '4 3' : '0';
          return <line key={e.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeDasharray={dash} strokeOpacity="0.7" />;
        })}

        {/* nodes */}
        {nodes.map(n => {
          const p = pos[n.id]; if (!p) return null;
          const r = n.id === selectedId ? 8 : 6;
          const stroke = n.closable ? '#4f46e5' : '#0f172a';
          const strokeDasharray = n.closable ? '2 2' : '0';
          return (
            <g key={n.id} onClick={() => onSelectNode?.(n.id, n.locusPath ?? null)} style={{ cursor:'pointer' }}>
              <circle cx={p.x} cy={p.y} r={r} fill={color(n)} stroke={stroke} strokeDasharray={strokeDasharray} />
              {n.hasOpenCq ? (
                <text x={p.x + r + 2} y={p.y - r - 2} fontSize="8" fill="#0f172a">{n.hasOpenCq}</text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {showLegend && (
        <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-600">
          <span><span className="inline-block w-2 h-2 rounded-full bg-[#16a34a]" /> IN</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-[#dc2626]" /> OUT</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-[#64748b]" /> UNDEC</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-[#C7CED6]" /> fog</span>
          <span><span className="inline-block w-2 h-2 rounded bg-[#4f46e5]" /> † closable</span>
        </div>
      )}
    </div>
  );
}
