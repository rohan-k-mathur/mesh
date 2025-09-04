// components/work/SupplyAuthoringInline.tsx
'use client';
import * as React from 'react';

type Work = { id:string; title:string; theoryType:'DN'|'IH'|'TC'|'OP' };

export default function SupplyAuthoringInline({
  deliberationId,
  toWorkId,
}: { deliberationId: string; toWorkId: string }) {
  const [dnWorks, setDnWorks] = React.useState<Work[]>([]);
  const [claims, setClaims] = React.useState<{ id:string; text:string }[]>([]);
  const [selectedFromWorkId, setSelectedFromWorkId] = React.useState<string>('');
  const [selectedFromClaimId, setSelectedFromClaimId] = React.useState<string>('');
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (!deliberationId) return; // ✅ guard
    (async () => {
      const res = await fetch(`/api/works?deliberationId=${encodeURIComponent(deliberationId)}`, { cache:'no-store' });
      const json = await res.json();
      const dn = (json.works ?? []).filter((w:Work) => w.theoryType === 'DN');
      setDnWorks(dn);
    })();
    (async () => {
      const res = await fetch(`/api/claims/search?deliberationId=${encodeURIComponent(deliberationId)}&q=`, { cache:'no-store' });
      const json = await res.json();
      setClaims(json.claims ?? []);
    })();
  }, [deliberationId]);

  return (
    <div className="rounded border p-2 space-y-2 bg-white/70">
      <div className="text-xs font-medium">Add supplied premise</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] text-neutral-600 mb-1">From DN Work (optional)</label>
          <select
            className="w-full border rounded px-2 py-1 text-sm"
            value={selectedFromWorkId}
            onChange={(e)=>setSelectedFromWorkId(e.target.value)}
          >
            <option value="">— Select a DN Work —</option>
            {dnWorks.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-neutral-600 mb-1">Or from Claim (optional)</label>
          <select
            className="w-full border rounded px-2 py-1 text-sm"
            value={selectedFromClaimId}
            onChange={(e)=>setSelectedFromClaimId(e.target.value)}
          >
            <option value="">— Select a Claim —</option>
            {claims.slice(0,200).map(c => <option key={c.id} value={c.id}>{c.text.slice(0,90)}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          disabled={pending || (!selectedFromWorkId && !selectedFromClaimId)}
          className="px-2 py-1 text-sm border rounded bg-white disabled:opacity-50"
          onClick={async () => {
            if (!selectedFromWorkId && !selectedFromClaimId) return;
            setPending(true);
            try {
              const res = await fetch('/api/knowledge-edges?kind=SUPPLIES_PREMISE', {
                method: 'POST',
                headers: { 'Content-Type':'application/json' },
                body: JSON.stringify({
                  deliberationId,
                  kind: 'SUPPLIES_PREMISE',
                  fromWorkId: selectedFromWorkId || undefined,
                  fromClaimId: selectedFromClaimId || undefined,
                  toWorkId,
                }),
              });
              const text = await res.text();
              if (!res.ok) return alert(text);
              setSelectedFromClaimId('');
              setSelectedFromWorkId('');
              alert('Supply added.');
            } finally {
              setPending(false);
            }
          }}
        >
          Link as SUPPLIES_PREMISE
        </button>
        <div className="text-[11px] text-neutral-500">DN works and/or claims can supply premises to this work.</div>
      </div>
    </div>
  );
}
