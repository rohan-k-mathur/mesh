'use client';
import useSWR from 'swr';

const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then(r => r.json());

export default function ApprovalsHeatStrip({ deliberationId }: { deliberationId: string }) {
  const { data } = useSWR(`/api/deliberations/${deliberationId}/approvals/summary?rows=6&cohorts=all,authors`, fetcher);
  if (!data?.rows?.length) return null;

  const cols: string[] = data.columns;

  return (
    <div className="rounded border p-3 text-sm">
      <div className="mb-2 font-medium">Approvals (top arguments × cohorts)</div>
      <div className="overflow-x-auto">
        <table className="min-w-[420px] text-xs">
          <thead>
            <tr>
              <th className="text-left pr-3 py-1">Argument</th>
              {cols.map((c: string) => (
                <th key={c} className="text-center px-2 py-1 capitalize">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r: any) => (
              <tr key={r.id}>
                <td className="pr-3 py-1 align-top w-[260px]">
                  <span title={r.text}>{r.text.slice(0, 90)}{r.text.length > 90 ? '…' : ''}</span>
                </td>
                {cols.map((c: string) => (
                  <td key={c} className="px-2 py-1">
                    <Cell pct={r.columns[c]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-[11px] text-neutral-500 mt-2">
        Percent approvals per cohort (aggregated; identities hidden).
      </div>
    </div>
  );
}

function Cell({ pct }: { pct: number }) {
  const p = Math.round(pct * 100);
  const bg = `hsl(${120 * pct} 70% 80%)`;
  return (
    <div className="w-12 h-5 rounded border text-[11px] grid place-items-center" style={{ background: bg }} title={`${p}%`}>
      {p}%
    </div>
  );
}
