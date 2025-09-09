// components/dialogue/LudicsBadge.tsx
'use client';
import * as React from 'react';

export function LudicsBadge({
  deliberationId, targetType, targetId,
}: { deliberationId: string; targetType:'argument'|'claim'|'card'; targetId: string }) {
  const [unresolved, setUnresolved] = React.useState(false);
  React.useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch(`/api/deliberations/${deliberationId}/moves`).then(r=>r.json()).catch(()=>null);
      if (!alive || !res?.ok) return;
      const k = `${targetType}:${targetId}`;
      setUnresolved(!!res.unresolvedByTarget?.[k]);
    })();
    const h = () => {
      fetch(`/api/deliberations/${deliberationId}/moves`).then(r=>r.json()).then(j=>{
        const k = `${targetType}:${targetId}`; setUnresolved(!!j?.unresolvedByTarget?.[k]);
      }).catch(()=>{});
    };
    window.addEventListener('dialogue:moves:refresh', h as any);
    return () => { alive=false; window.removeEventListener('dialogue:moves:refresh', h as any); };
  }, [deliberationId, targetType, targetId]);

  return (
    <span className={`px-1.5 py-0.5 rounded border text-[10px] ${unresolved ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
      title={unresolved ? 'Open WHY challenge — click to focus in Ludics' : 'No open WHY'}
      onClick={() => {
        window.dispatchEvent(new CustomEvent('ludics:focus', {
          detail: { deliberationId, target: { type: targetType, id: targetId } }
        }));
      }}
      style={{ cursor:'pointer' }}
    >
      Ludics {unresolved ? 'WHY' : 'OK'}
    </span>
  );
}
