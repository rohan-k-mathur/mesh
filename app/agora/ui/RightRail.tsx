"use client";
import useSWR from "swr";

const fetcher = (u:string)=>fetch(u,{cache:"no-store"}).then(r=>r.json());

export function RightRail({ selected }: { selected?: any | null }) {
  const toDelib = selected?.deliberationId || selected?.toId;
  const { data } = useSWR(
    toDelib ? `/api/xref?toType=deliberation&toId=${encodeURIComponent(toDelib)}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  const backlinks = data?.items ?? [];

  return (
    <div className="space-y-3">
      {/* Votes / Calls / Accepted blocks same as before... */}

      <div className="rounded-xl border bg-white/70 p-3">
        <div className="text-sm font-medium">Navigator</div>
        {!toDelib ? (
          <div className="text-[12px] text-slate-600 mt-1">Select a card to see backlinks.</div>
        ) : backlinks.length ? (
          <ul className="mt-2 space-y-1 text-[12px]">
            {backlinks.map((x:any)=>(
              <li key={x.id} className="flex items-center justify-between gap-2">
                <span className="truncate">{x.relation} from {x.fromType}:{String(x.fromId).slice(0,6)}…</span>
                {x.fromType==='deliberation' && <a className="underline" href={`/deliberation/${x.fromId}`}>Open</a>}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-[12px] text-slate-600 mt-1">No backlinks.</div>
        )}
      </div>
    </div>
  );
}
