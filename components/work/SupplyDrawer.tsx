'use client';
import * as React from 'react';

export default function SupplyDrawer({
  workId,
  open,
  onClose,
}: { workId:string; open:boolean; onClose:()=>void }) {
  const [data, setData] = React.useState<{edges:any[]; works:any[]; claims:any[]}|null>(null);
  const [onlyDN, setOnlyDN] = React.useState(true);

  React.useEffect(() => {
    if (!open) return;
    (async () => {
      const res = await fetch(`/api/works/${workId}/supplies`);
      const json = await res.json();
      setData(json);
    })();
  }, [open, workId]);

  if (!open) return null;
  const byId = (arr:any[]) => Object.fromEntries(arr.map(x=>[x.id,x]));

  const w = data ? byId(data.works) : {};
  const c = data ? byId(data.claims) : {};

  const items = (data?.edges ?? []).filter(e => !onlyDN || (w[e.fromWorkId]?.theoryType === 'DN'));

  return (
    <div className="fixed inset-0 bg-black/20 z-50" onClick={onClose}>
      <div className="absolute right-0 top-0 h-full w-[420px] bg-white border-l p-3" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Dependencies (supplied premises)</div>
          <button className="text-xs underline" onClick={onClose}>Close</button>
        </div>
        <div className="mt-2 text-xs">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={onlyDN} onChange={e=>setOnlyDN(e.target.checked)} />
            Only DN works
          </label>
        </div>
        <div className="mt-3 space-y-2">
          {items.map((e, i) => (
            <div key={i} className="rounded border p-2 text-sm">
              <div className="text-[11px] text-neutral-500">{e.kind}</div>
              {e.fromWorkId && <div>
                From Work: <b>{w[e.fromWorkId]?.title ?? e.fromWorkId}</b> <span className="text-[11px] text-neutral-500">[{w[e.fromWorkId]?.theoryType}]</span>
              </div>}
              {e.fromClaimId && <div>From Claim: “{c[e.fromClaimId]?.text?.slice(0,120) ?? e.fromClaimId}”</div>}
              {e.toClaimId && <div className="text-[12px] text-neutral-600">Targets Claim: “{c[e.toClaimId]?.text?.slice(0,120) ?? e.toClaimId}”</div>}
            </div>
          ))}
          {!items.length && <div className="text-xs text-neutral-500">No supplies yet.</div>}
        </div>
      </div>
    </div>
  );
}
