'use client';
import useSWR from 'swr';

const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then(r => r.json());

type Summary = {
  totals: Record<string, number>; // { all: N, authors: M }
  byArgument: Record<string, Record<string, string[]>>; // { argId: { cohort: [userIds...] } }
};

export default function ApprovalsHeatStrip({ deliberationId }: { deliberationId: string }) {
  // summary: { totals, byArgument }
  const { data: summary } = useSWR<Summary>(
    `/api/deliberations/${deliberationId}/approvals/summary?cohorts=all,authors`,
    fetcher
  );

  // get argument text
  const { data: argData } = useSWR(
    `/api/deliberations/${deliberationId}/arguments`,
    fetcher
  );

  if (!summary?.totals || !summary?.byArgument || !argData?.arguments) return null;

  const COHORTS = Object.keys(summary.totals); // e.g. ['all','authors']
  if (COHORTS.length === 0) return null;

  // id -> text
  const textMap: Record<string, string> = {};
  for (const a of argData.arguments as any[]) textMap[a.id] = a.text;

  // build rows: { id, text, columns: { cohort: pct } }
  const rows = Object.keys(summary.byArgument).map((argId) => {
    const cols: Record<string, number> = {};
    for (const cohort of COHORTS) {
      const covered = summary.byArgument[argId]?.[cohort]?.length ?? 0;
      const total = summary.totals[cohort] || 0;
      cols[cohort] = total > 0 ? covered / total : 0;
    }
    return { id: argId, text: textMap[argId] ?? argId, columns: cols };
  });

  // pick top 6 by "all" coverage (fallback to first cohort)
  const keyCohort = COHORTS.includes('all') ? 'all' : COHORTS[0];
  const top = rows
    .sort((a, b) => (b.columns[keyCohort] ?? 0) - (a.columns[keyCohort] ?? 0))
    .slice(0, 6);

  return (
    <div className="rounded border p-3 text-sm">
      <div className="mb-2 font-medium">Approvals (top arguments × cohorts)</div>
      <div className="overflow-x-auto">
        <table className="min-w-[420px] text-xs">
          <thead>
            <tr>
              <th className="text-left pr-3 py-1">Argument</th>
              {COHORTS.map((c) => (
                <th key={c} className="text-center px-2 py-1 capitalize">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {top.map((r) => (
              <tr key={r.id}>
                <td className="pr-3 py-1 align-top w-[260px]">
                  <span title={r.text}>
                    {r.text.slice(0, 90)}
                    {r.text.length > 90 ? '…' : ''}
                  </span>
                </td>
                {COHORTS.map((c) => (
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
  // greenish hue for higher pct
  const bg = `hsl(${120 * pct} 70% 85%)`;
  return (
    <div
      className="w-12 h-5 rounded border text-[11px] grid place-items-center"
      style={{ background: bg }}
      title={`${p}%`}
    >
      {p}%
    </div>
  );
}
