'use client';
import useSWR from 'swr';
export default function CegMiniMap({ deliberationId }: { deliberationId: string }) {
  const { data } = useSWR(`/api/deliberations/${deliberationId}/ceg/mini`, (u)=>fetch(u).then(r=>r.json()));
  if (!data) return null;

  return (
    <div className="rounded border p-3 text-sm">
      <div className="mb-2 font-medium">Support vs Counter</div>
      <div className="flex items-center gap-3">
      <Bar
          label="Support"
          pct={data.supportPct}
          title={`Weighted support: ${data.supportWeighted.toFixed(2)} (confidence-weighted)`}
        />
        <Bar
          label="Counter"
          pct={data.counterPct}
          title={`Weighted counter: ${data.counterWeighted.toFixed(2)} (rebuts + undercuts)`}
        />
      </div>
      <div className="text-xs text-neutral-500 mt-1">
        Weighted by author confidence; undercuts counted in counter.
      </div>
    </div>
  );
}

function Bar({ label, pct, title }: { label: string; pct: number; title?: string }) {
    const width = Math.round(pct * 100);
  return (
    <div className="flex-1" title={title}>
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span><span>{width}%</span>
      </div>
      <div className="h-2 bg-neutral-200 rounded">
        <div className="h-2 rounded" style={{ width: `${width}%`, background: 'currentColor' }} />
      </div>
    </div>
  );
}
