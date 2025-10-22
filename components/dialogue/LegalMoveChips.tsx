// components/dialogue/LegalMoveChips.tsx
'use client';
import * as React from 'react';
import useSWR from 'swr';
import { useMemo } from 'react';
import { NLCommitPopover } from '@/components/dialogue/NLCommitPopover';
import { useBusEffect } from '@/lib/client/useBusEffect';
import type { Move } from '@/app/api/dialogue/legal-moves/route';
import { TargetType } from '@prisma/client';

function useMicroToast() {
  const [msg, setMsg] = React.useState<{ kind:'ok'|'err'; text:string }|null>(null);
  const show = React.useCallback((text:string, kind:'ok'|'err'='ok', ms=4000) => { // ✅ Increased from 1400ms to 4000ms
    setMsg({ kind, text }); const id = setTimeout(()=>setMsg(null), ms); return () => clearTimeout(id);
  }, []);
  const node = msg ? (
    <div className={[
      'fixed bottom-4 right-4 z-50 rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur bg-white/95 animate-in slide-in-from-bottom-2', // ✅ Better styling
      msg.kind === 'ok' ? 'border-emerald-300 text-emerald-800 bg-emerald-50/95' : 'border-rose-300 text-rose-800 bg-rose-50/95'
    ].join(' ')}>
      <div className="flex items-center gap-2">
        <span className="text-base">{msg.kind === 'ok' ? '✓' : '✕'}</span>
        <span className="font-medium">{msg.text}</span>
      </div>
    </div>
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
  targetType: TargetType;
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
      // ✅ Better success messages
      const successMsg = 
        m.kind === 'WHY' ? 'Challenge posted! Waiting for response.' :
        m.kind === 'GROUNDS' ? 'Response posted successfully!' :
        m.kind === 'CLOSE' ? 'Discussion closed.' :
        m.kind === 'CONCEDE' ? 'Conceded - added to your commitments.' :
        m.kind === 'RETRACT' ? 'Retracted successfully.' :
        `${m.label || m.kind} posted`;
      toast.show(successMsg, 'ok');
    } catch (e:any) {
      toast.show(`Failed to post ${m.label || m.kind}: ${e.message}`, 'err');
    } finally {
      setBusy(null);
    }
  };

  // Removed: answerAndCommit now handled by NLCommitPopover modal
  // No more browser prompt() - all GROUNDS moves now use the "+ commit" modal flow

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
              disabled={!!m.disabled || !!busy || m.relevance === "unlikely"}
              title={
                m.disabled ? m.reason : 
                m.kind === "WHY" ? "Challenge this claim - ask for justification" :
                m.kind === "GROUNDS" ? "Respond to the challenge with your reasoning" :
                m.kind === "CLOSE" ? "End this discussion and accept the current state" :
                m.kind === "CONCEDE" ? "Accept this claim and add it to your commitments" :
                m.kind === "RETRACT" ? "Withdraw your previous statement" :
                m.label
              }
              onClick={() => {
                // For GROUNDS moves, always open the modal (no more prompt!)
                if (m.kind === "GROUNDS") {
                  setPendingMove(m);
                  setOpen(true);
                } else {
                  postMove(m);
                }
              }}
              className={(m.kind === "ASSERT" && (m as any)?.payload?.as === "ACCEPT_ARGUMENT")
                ? "px-2 py-1 rounded text-xs border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                : cls(m)}
            >
              {m.kind === "CLOSE"   ? (m.label || "Close (†)") :
               m.kind === "GROUNDS" ? `Answer ${m.label}` :
               m.kind === "WHY"     ? (m.label || "CHALLENGE") :
               m.label}
            </button>
          </div>
        ))}
      </div>

      {open && pendingMove && (
        <NLCommitPopover
          open={open}
          onOpenChange={setOpen}
          deliberationId={deliberationId}
          targetType={targetType as "argument" | "claim" | "card"}
          targetId={targetId}
          locusPath={pendingMove.payload?.justifiedByLocus ?? locusPath}
          cqKey={pendingMove.payload?.cqId ?? pendingMove.payload?.schemeKey ?? "default"}
          defaultOwner={commitOwner}
          onDone={() => { mutate(); onPosted?.(); }}
        />
      )}
      {toast.node}
    </>
  );
}