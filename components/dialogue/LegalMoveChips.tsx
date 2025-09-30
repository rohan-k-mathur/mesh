'use client';
import * as React from 'react';
import useSWR from 'swr';
import { useMemo } from 'react';
import { NLCommitPopover } from '@/components/dialogue/NLCommitPopover';
import { useBusEffect } from '@/lib/client/useBusEffect';
import type { Move } from '@/app/api/dialogue/legal-moves/route';

function useMicroToast() {
  const [msg, setMsg] = React.useState<{ kind:'ok'|'err'; text:string }|null>(null);
  const show = React.useCallback((text:string, kind:'ok'|'err'='ok', ms=1400) => {
    setMsg({ kind, text }); const id = setTimeout(()=>setMsg(null), ms); return () => clearTimeout(id);
  }, []);
  const node = msg ? (
    <div className={[
      'fixed bottom-3 right-3 z-50 rounded border px-2 py-1 text-xs shadow backdrop-blur bg-white/90',
      msg.kind === 'ok' ? 'border-emerald-200 text-emerald-700' : 'border-rose-200 text-rose-700'
    ].join(' ')}>{msg.text}</div>
  ) : null;
  return { show, node };
}

export function LegalMoveChips({
  deliberationId,
  targetType,
  targetId,
  locusPath = '0',
  commitOwner = 'Proponent',
  onPosted,
  onPick,
}: {
  deliberationId: string;
  targetType: 'argument'|'claim'|'card';
  targetId: string;
  locusPath?: string;
  commitOwner?: 'Proponent'|'Opponent';
  onPosted?: () => void;
  onPick?: (m: Move) => void;
}) {
  const qs = new URLSearchParams({
    deliberationId, targetType, targetId, locusPath
  }).toString();
  const key = `/api/dialogue/legal-moves?${qs}`;

  const fetcher = (u:string)=>fetch(u,{cache:'no-store'}).then(r=>r.json());
  const { data, mutate, isLoading } = useSWR<{ ok:boolean; moves: Move[] }>(key, fetcher, { revalidateOnFocus:false });

  

  // live refresh on server events
  useBusEffect(['dialogue:changed','dialogue:moves:refresh'], () => mutate(), { retry: true });

  const toast = useMicroToast();
  const [open, setOpen] = React.useState(false);
  const [pendingMove, setPendingMove] = React.useState<Move | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);

  const postMove = async (m: Move) => {
    if (m.disabled || busy) return;
    if (onPick) { onPick(m); return; }

    setBusy(m.kind);
    try {
      const postTargetType = m.postAs?.targetType ?? targetType;
      const postTargetId   = m.postAs?.targetId   ?? targetId;
      const body = {
        deliberationId,
        targetType: postTargetType,
        targetId: postTargetId,
        kind: m.kind,
        payload: { locusPath, ...(m.payload ?? {}) },
        autoCompile: true, autoStep: true, phase: 'neutral' as const,
      };
      const r = await fetch('/api/dialogue/move', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const j = await r.json().catch(()=>({}));
      if (!r.ok || j?.ok === false) throw new Error(j?.error ?? `HTTP ${r.status}`);

      onPosted?.();
      mutate();
      toast.show(`${m.label || m.kind} posted`, 'ok');
    } catch (e:any) {
      toast.show(`Failed: ${m.label || m.kind}`, 'err');
    } finally {
      setBusy(null);
    }
  };

  const answerAndCommit = async (m: Move) => {
    if (busy) return;
    const expression = (window.prompt('Commit label (fact or rule, e.g. "contract" or "A & B -> C")','') ?? '').trim();
    if (!expression) return;
    const cqKey = m.payload?.cqId ?? m.payload?.schemeKey ?? 'default';
    setBusy('COMMIT');
    try {
      const r = await fetch('/api/dialogue/answer-and-commit', {
        method:'POST', headers:{'content-type':'application/json'},
        body: JSON.stringify({ deliberationId, targetType, targetId, cqKey, locusPath, expression, commitOwner, commitPolarity:'pos' })
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await r.json().catch(()=>null);
      onPosted?.(); mutate(); toast.show('Answered & committed', 'ok');
    } catch { toast.show('Answer & commit failed', 'err'); }
    finally { setBusy(null); }
  };

  const moves = Array.isArray(data?.moves) ? (data!.moves as Move[]) : [];

  // 👇 priority: CLOSE (†) first, then GROUNDS, WHY, CONCEDE, RETRACT, everything else.
  const priority = (m: Move) =>
    m.kind === 'CLOSE'   && !m.disabled ? 0 :
    m.kind === 'GROUNDS' && !m.disabled ? 1 :
    m.kind === 'WHY'     && !m.disabled ? 2 :
    m.kind === 'CONCEDE' ? 3 :
    m.kind === 'RETRACT' ? 4 : 9;

  const sorted = useMemo(() => [...moves].sort((a,b) => priority(a) - priority(b)), [moves]);

  if (!deliberationId || !targetId || (!isLoading && !moves.length)) return null;



  const cls = (m: Move) => [
    'px-2 py-1 rounded text-xs btnv2--ghost',
    m.kind === 'GROUNDS' ? ' text-emerald-700' :
    m.kind === 'WHY'     ? ' text-amber-700'  :
    m.kind === 'CONCEDE' ? ' text-slate-700'  :
    m.kind === 'RETRACT' ? ' text-slate-700'  : ' text-slate-700',
    m.kind === 'CLOSE' && !m.disabled ? ' font-semibold ring-1 ring-emerald-400/70' : '',
    m.disabled ? ' opacity-50 cursor-not-allowed' : ''
  ].join(' ');

  const btnClass = (m: Move) => [
    'px-2 py-1 rounded text-xs border transition',
    m.kind === 'CLOSE'
      ? 'border-indigo-300 text-indigo-800 bg-indigo-50 hover:bg-indigo-100 font-semibold'
      : m.kind === 'GROUNDS'
      ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
      : m.kind === 'WHY'
      ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
      : 'border-slate-200 text-slate-700 hover:bg-slate-50',
    (m.disabled || !!busy) ? 'opacity-50 cursor-not-allowed' : ''
  ].join(' ');
 return (
    <>
      <div className="flex flex-wrap gap-1">
        {sorted.map((m, i) => (
          <div key={`${m.kind}-${i}`} className="inline-flex items-center gap-1">
            <button
              disabled={!!m.disabled}
              title={m.reason || m.label}
              onClick={() => postMove(m)}
              className={cls(m)}
            >
              {m.kind === 'CLOSE'   ? (m.label || 'Close (†)') :
               m.kind === 'GROUNDS' ? `Answer ${m.label}` :
               m.kind === 'WHY'     ? (m.label || 'CHALLENGE') :
               m.label}
            </button>

            {/* Answer & commit is available only for GROUNDS */}
            {m.kind === 'GROUNDS' && !m.disabled && (
              <button
                className="text-[11px] underline decoration-dotted"
                onClick={()=>{ setPendingMove(m); setOpen(true); }}
              >
                + commit
              </button>
            )}
          </div>
        ))}
        {sorted.map(m => (
  <div key={`${m.kind}-${m.label ?? ""}`} className="inline-flex items-center gap-1">
    <button
      disabled={!!m.disabled || !!busy || m.relevance === 'unlikely'}
      title={m.reason || m.label}
      onClick={() => postMove(m)}
      className={[
        'px-2 py-1 rounded text-xs border transition',
        m.force === 'ATTACK' ? 'border-amber-200 hover:bg-amber-50' :
        m.force === 'SURRENDER' ? 'border-slate-200 hover:bg-slate-50' :
        'border-slate-200',
        m.relevance === 'unlikely' ? 'opacity-60 cursor-not-allowed' : ''
      ].join(' ')}
    >
      {m.label || m.kind}
    </button>
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