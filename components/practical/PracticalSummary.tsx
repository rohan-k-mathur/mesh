// components/practical/PracticalSummary.tsx
'use client';

import * as React from 'react';

export default function PracticalSummary({
  workId,
  className = '',
}: {
  workId: string;
  className?: string;
}) {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    let abort = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/works/${workId}/practical`, { cache: 'no-store' });
        const json = await res.json();
        if (abort) return;
        setData(json?.justification ?? null);
      } catch (e) {
        console.error('summary load failed', e);
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, [workId]);

  if (loading) return <div className={`text-xs text-neutral-500 ${className}`}>Loading…</div>;
  if (!data)   return <div className={`text-xs text-neutral-500 ${className}`}>No practical justification yet.</div>;

  const result = data.result ?? {};
  const bestId = result.bestOptionId as string | undefined;
  const totals: Record<string, number> = result.totals ?? {};
  const options: Array<{ id: string; label: string }> = data.options ?? [];

  return (
    <div className={`rounded border p-3 ${className}`}>
      <div className="text-sm font-medium mb-2">Practical Justification — Summary</div>
      {bestId ? (
        <div className="mb-2 text-sm">
          Best option: <b>{options.find(o => o.id === bestId)?.label ?? bestId}</b>
        </div>
      ) : (
        <div className="mb-2 text-xs text-neutral-500">No computed result yet.</div>
      )}

      {!!Object.keys(totals).length && (
        <div className="overflow-x-auto">
          <table className="min-w-[420px] text-sm border">
            <thead>
              <tr className="bg-slate-50">
                <th className="border px-2 py-1 text-left">Option</th>
                <th className="border px-2 py-1 text-left">Total (0–1)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(totals)
                .sort((a, b) => b[1] - a[1])
                .map(([optId, total]) => (
                  <tr key={optId}>
                    <td className="border px-2 py-1">
                      {options.find(o => o.id === optId)?.label ?? optId}
                    </td>
                    <td className="border px-2 py-1">{total.toFixed(3)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
