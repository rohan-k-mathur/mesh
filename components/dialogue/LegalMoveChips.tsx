// components/dialogue/LegalMoveChips.tsx
'use client';
import * as React from 'react';
import useSWR from 'swr';
import { NLCommitPopover } from '@/components/dialogue/NLCommitPopover';

type Move = {
  kind: 'ASSERT'|'WHY'|'GROUNDS'|'RETRACT'|'CONCEDE';
  label: string;
  payload?: any;
  disabled?: boolean;
  reason?: string;
};

function useMicroToast() {
  const [msg, setMsg] = React.useState<{ kind:'ok'|'err'; text:string }|null>(null);
  const show = React.useCallback((text:string, kind:'ok'|'err'='ok', ms=1400) => {
    setMsg({ kind, text });
    const id = setTimeout(()=>setMsg(null), ms);
    return () => clearTimeout(id);
  }, []);
  const node = msg ? (
    <div className={[
      'fixed bottom-3 right-3 z-50 rounded border px-2 py-1 text-xs shadow backdrop-blur bg-white/90',
      msg.kind === 'ok' ? 'border-emerald-200 text-emerald-700' : 'border-rose-200 text-rose-700'
    ].join(' ')}>
      {msg.text}
    </div>
  ) : null;
  return { show, node };
}

export function LegalMoveChips({
  deliberationId,
  targetType,
  targetId,
  locusPath = '0',               // 👈 pass the locus you’re answering at
  commitOwner = 'Proponent',     // 'Proponent' | 'Opponent'
  onPosted,
}: {
  deliberationId: string;
  targetType: 'argument'|'claim'|'card';
  targetId: string;
  locusPath?: string;
  commitOwner?: 'Proponent'|'Opponent';
  onPosted?: () => void;
}) {
  const key = deliberationId && targetId
    ? `/api/dialogue/legal-moves?deliberationId=${encodeURIComponent(deliberationId)}&targetType=${targetType}&targetId=${encodeURIComponent(targetId)}`
    : null;

  const fetcher = (u:string)=>fetch(u,{cache:'no-store'}).then(r=>r.json());
  const { data, mutate } = useSWR<{ ok:boolean; moves: Move[] }>(key, fetcher, { revalidateOnFocus:false });

  const toast = useMicroToast();
  const [open, setOpen] = React.useState(false);
 const [pendingMove, setPendingMove] = React.useState<Move | null>(null);

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
      const j = await r.json().catch(() => ({}));
   if (!r.ok || j?.ok === false) throw new Error(j?.error ?? `HTTP ${r.status}`);
      window.dispatchEvent(new CustomEvent('dialogue:moves:refresh'));
      onPosted?.();
      mutate();
      toast.show(`${m.kind} posted`, 'ok');
    } catch (e:any) {
      toast.show(`Failed: ${m.kind}`, 'err');
    }
  };

  const answerAndCommit = async (m: Move) => {
    // Ask for the fact/rule label to commit (you can replace with a nicer modal)
    const expression = (window.prompt('Commit label (fact or rule, e.g. "contract" or "A & B -> C")','') ?? '').trim();
    if (!expression) return;
    const cqKey = m.payload?.cqId ?? m.payload?.schemeKey ?? 'default';
    try {
      const r = await fetch('/api/dialogue/answer-and-commit', {
        method:'POST', headers:{'content-type':'application/json'},
        body: JSON.stringify({
          deliberationId, targetType, targetId,
          cqKey,
          locusPath,
          expression,
          commitOwner,
          commitPolarity: 'pos', // keep pos for now; you can add a picker later
        })
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await r.json().catch(()=>null);
      window.dispatchEvent(new CustomEvent('dialogue:moves:refresh'));
      window.dispatchEvent(new CustomEvent('dialogue:cs:refresh', { detail: { dialogueId: deliberationId, ownerId: commitOwner }} as any));
      mutate();
      onPosted?.();
      toast.show('Answered & committed', 'ok');
    } catch {
      toast.show('Answer & commit failed', 'err');
    }
  };

  const moves = Array.isArray(data?.moves) ? data!.moves : [];
  if (!deliberationId || !targetId || !Array.isArray(moves)) return null;



  const cls = (m: Move) => [
    'px-2 py-1  btnv2--ghost  rounded  text-xs ',
    m.kind === 'GROUNDS' ? ' text-emerald-700' :
    m.kind === 'WHY'     ? ' text-amber-700 ' :
    m.kind === 'CONCEDE' ? 'text-slate-700 ' :
    m.kind === 'RETRACT' ? 'text-slate-700 ' :
                           ' text-slate-700 ',
    (m.disabled ? 'opacity-50 cursor-not-allowed' : '')
  ].join(' ');

  return (
    <>
      <div className="flex flex-wrap gap-1">
        {moves.map((m, i) => (
          <div key={`${m.kind}-${i}`} className="inline-flex items-center gap-1">
            <button
              disabled={!!m.disabled}
              title={m.reason || m.label}
              onClick={() => postMove(m)}
              className={cls(m)}
            >
              {m.kind === 'GROUNDS' ? `Answer ${m.label}` :
               m.kind === 'WHY'     ? (m.label || 'CHALLENGE') :
               m.label}
            </button>

            {/* Answer & commit is available only for GROUNDS */}
            {m.kind === 'GROUNDS' && !m.disabled && (
               <button className="text-[11px] underline decoration-dotted" onClick={()=>{ setPendingMove(m); setOpen(true); }}>
                              + commit
                            </button>
            )}
          </div>
        ))}
      </div>
      {open && pendingMove && (
        <NLCommitPopover
          open={open}
          onOpenChange={setOpen}
          deliberationId={deliberationId}
          targetType={targetType}
          targetId={targetId}
          locusPath={pendingMove.payload?.justifiedByLocus ?? locusPath}
          defaultOwner={commitOwner}
          onDone={() => { mutate(); onPosted?.(); }}
        />
      )}
      {toast.node}
    </>
  );
}
