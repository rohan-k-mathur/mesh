// components/dialogue/LegalMoveChips.tsx
'use client';
import * as React from 'react';
import useSWR from 'swr';

type Move = {
  kind: 'ASSERT'|'WHY'|'GROUNDS'|'RETRACT'|'CONCEDE';
  label: string;
  payload?: any;
  disabled?: boolean;
  reason?: string;
};

export function LegalMoveChips(props: {
  deliberationId: string;
  targetType: 'argument'|'claim'|'card';
  targetId: string;
  onPosted?: () => void;
}) {
  const { deliberationId, targetType, targetId, onPosted } = props;
  const key = deliberationId && targetId
    ? `/api/dialogue/legal-moves?deliberationId=${encodeURIComponent(deliberationId)}&targetType=${targetType}&targetId=${encodeURIComponent(targetId)}`
    : null;

  const fetcher = (u:string)=>fetch(u,{cache:'no-store'}).then(r=>r.json());
  const { data, mutate } = useSWR<{ ok:boolean; moves: Move[] }>(key, fetcher, { revalidateOnFocus:false });

  const postMove = async (m: Move) => {
    const body = {
      deliberationId, targetType, targetId,
      kind: m.kind, payload: m.payload ?? {},
      autoCompile: true, autoStep: true, phase: 'neutral' as const,
    };
    try {
      const r = await fetch('/api/dialogue/move', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(body),
      });
      // naive check; you can add toast on !r.ok
      await r.json().catch(()=>null);
      window.dispatchEvent(new CustomEvent('dialogue:moves:refresh'));
      onPosted?.();
      mutate(); // refresh legal moves (WHY→GROUNDS disappears)
    } catch {}
  };

  const moves = Array.isArray(data?.moves) ? data!.moves : [];

  if (!deliberationId || !targetId) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {moves.map((m, i) => (
        <button
          key={i}
          disabled={!!m.disabled}
          title={m.reason || m.label}
          onClick={() => postMove(m)}
          className={[
            'rounded border px-2 py-0.5 text-xs',
            m.kind === 'GROUNDS' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' :
            m.kind === 'WHY'     ? 'border-amber-300 bg-amber-50 text-amber-700' :
            m.kind === 'CONCEDE' ? 'border-slate-300 bg-white text-slate-700' :
            'border-slate-200 bg-white text-slate-700',
            m.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white'
          ].join(' ')}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
