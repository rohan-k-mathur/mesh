'use client';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { useDialogueMoves } from '../dialogue/useDialogueMoves';

type Props = {
  deliberationId: string;
  open: boolean;
  onClose: () => void;
  /** Optional: friendly labels for targetId → "short text…" */
  titlesByTarget?: Record<string, string>;
};

type DM = {
  id: string;
  kind: 'ASSERT'|'WHY'|'GROUNDS'|'RETRACT'|string;
  payload?: any;
  createdAt: string; // ISO
};

function timeAgo(ts: string | number) {
  const d = typeof ts === 'string' ? new Date(ts).getTime() : ts;
  const diff = Math.max(0, Date.now() - d);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d2 = Math.floor(h / 24);
  return `${d2}d ago`;
}

function hoursLeft(iso?: string) {
  if (!iso) return null;
  const ms = Date.parse(iso) - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.ceil(ms / 36e5));
}

function chip(kind: string) {
  const base = 'px-1.5 py-0.5 rounded text-[10px] border';
  if (kind === 'WHY') return <span className={`${base} bg-rose-50 border-rose-200 text-rose-700`}>WHY</span>;
  if (kind === 'GROUNDS') return <span className={`${base} bg-emerald-50 border-emerald-200 text-emerald-700`}>GROUNDS</span>;
  if (kind === 'RETRACT') return <span className={`${base} bg-slate-50 border-slate-200 text-slate-700`}>RETRACT</span>;
  if (kind === 'CONCEDE') return <span className={`${base} bg-sky-50 border-sky-200 text-sky-700`}>CONCEDE</span>;
  return <span className={`${base} bg-neutral-50 border-neutral-200 text-neutral-700`}>{kind}</span>;
}

export default function NegotiationDrawerV2({ deliberationId, open, onClose, titlesByTarget }: Props) {
  const { byTarget, latestByTarget, moves, mutate } = useDialogueMoves(deliberationId);

  // ✅ Safe defaults
  const safeByTarget = React.useMemo(() => byTarget ?? new Map<string, DM[]>(), [byTarget]);
  const safeLatest   = React.useMemo(() => latestByTarget ?? new Map<string, DM>(), [latestByTarget]);
  const safeMoves: DM[] = React.useMemo(() => (moves ?? []) as DM[], [moves]);

  const byTargetFallback = React.useMemo(() => {
    if (safeByTarget.size > 0 || safeMoves.length === 0) return null;
    const m = new Map<string, DM[]>();
    for (const mv of safeMoves) {
      const tt  = (mv as any).targetType ?? 'argument';
      const tid = (mv as any).targetId ?? '';
      const key = `${tt}:${tid}`;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(mv);
    }
    const latest = new Map<string, DM>();
    for (const [k, list] of m.entries()) {
      list.sort((a,b)=>+new Date(a.createdAt) - +new Date(b.createdAt));
      latest.set(k, list[list.length-1]);
    }
    return { m, latest };
  }, [safeByTarget, safeMoves]);

  const [q, setQ] = React.useState('');
  const [filter, setFilter] = React.useState<'all'|'why'|'resolved'|'conceded'|'retracted'>('all');
  function statusOf(latest?: DM) {
    if (!latest) return '—';
    if (latest.kind === 'WHY') return 'why';
    if (latest.kind === 'GROUNDS') return 'resolved';
    if (latest.kind === 'RETRACT') return 'retracted';
    if (latest.kind === 'ASSERT' && latest.payload?.as === 'CONCEDE') return 'conceded';
    return '—';
  }
  const [activeReplyFor, setActiveReplyFor] = React.useState<string|null>(null);

  const [loading, setLoading] = React.useState(false);
  const [postingKey, setPostingKey] = React.useState<string|null>(null);
  const [okKey, setOkKey] = React.useState<string|null>(null);
  const [quick, setQuick] = React.useState<{targetType:'argument'|'claim'|'card'; targetId:string; note:string; ttl:number}>({
    targetType: 'argument', targetId: '', note: '', ttl: 24,
  });

  // ref map to focus inputs by target
const replyRefs = React.useRef<Map<string, HTMLInputElement>>(new Map());
const setReplyRef = (key: string) => (el: HTMLInputElement | null) => {
  if (!el) { replyRefs.current.delete(key); return; }
  replyRefs.current.set(key, el);
};

  // central refresh
  const refresh = React.useCallback(async () => {
    setLoading(true);
    await mutate();
    setLoading(false);
  }, [mutate]);

  // 🔔 On open: compile+step once, then refresh the drawer
  React.useEffect(() => {
    if (!open) return;
    let aborted = false;
    (async () => {
      try {
        await fetch('/api/ludics/compile-step', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ deliberationId, phase: 'neutral' }),
        });
      } catch {}
      if (!aborted) await refresh();
    })();
    return () => { aborted = true; };
  }, [open, deliberationId, refresh]);

  async function postMove(
    targetType:'argument'|'claim'|'card',
    targetId:string,
    kind:'WHY'|'GROUNDS'|'RETRACT'|'CONCEDE',
    payload:any = {}
  ) {
    const key = `${targetType}:${targetId}`;
    setPostingKey(key); setOkKey(null);
    try {
      await fetch('/api/dialogue/move', {
        method: 'POST',
        headers: { 'content-type':'application/json' },
        body: JSON.stringify({
          deliberationId, targetType, targetId, kind, payload,
          autoCompile: true, autoStep: true,
        })
      });
      window.dispatchEvent(new CustomEvent('dialogue:moves:refresh'));
      await refresh();
      setOkKey(key);
      setTimeout(() => setOkKey(null), 1200);
    } finally {
      setPostingKey(null);
    }
  }

  if (!open) return null;

    const sourceMap = (byTargetFallback?.m ?? safeByTarget);
   const latestMap = (byTargetFallback?.latest ?? safeLatest);
   
   const sections = Array.from(sourceMap.entries())
    .map(([targetId, list]) => {
      // Fold WHY→GROUNDS within 2s into a single “resolved” visual row
      const latest = latestMap.get(targetId);
      const compact: DM[] = [];
      for (let i = 0; i < list.length; i++) {
        const m = list[i];
        if (m.kind === 'WHY' && list[i + 1]?.kind === 'GROUNDS') {
          const t1 = new Date(m.createdAt).getTime();
          const t2 = new Date(list[i + 1].createdAt).getTime();
          if (t2 - t1 <= 2000) {
            compact.push(list[i + 1]); // keep only GROUNDS
            i += 1;
            continue;
          }
        }
        compact.push(m);
      }
      return { targetId, latest, moves: compact };
    })
    .sort((a, b) => {
      const tA = a.latest ? new Date(a.latest.createdAt).getTime() : 0;
      const tB = b.latest ? new Date(b.latest.createdAt).getTime() : 0;
      return tB - tA;
    })
    //.filter(s => filter==='all' || statusOf(s.latest)===filter);
      .filter(s => {
          if (filter!=='all' && statusOf(s.latest)!==filter) return false;
          if (!q.trim()) return true;
          const title = (titlesByTarget?.[s.targetId] || s.targetId || '').toLowerCase();
          return title.includes(q.toLowerCase());
        });

  // If portal target is missing (extremely rare), bail
  if (typeof document === 'undefined' || !document.body) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* overlay (locks background click/scroll) */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      {/* drawer */}
      <div className="absolute right-0 top-0 h-full w-[480px] bg-white border-l shadow-2xl p-3 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium text-sm">Negotiation timeline</div>
          <div className="flex items-center gap-2">
            <button className="text-xs underline" onClick={refresh}>
              {loading ? 'Loading…' : 'Refresh'}
            </button>
            <button className="px-2 py-1 border rounded text-xs" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
 {/* Quick add WHY */}
<div className="mb-3 rounded border p-2 bg-slate-50/50">
  <div className="flex flex-wrap items-end gap-2">
    <label className="text-[11px] text-neutral-600">Target</label>
    <select
      className="h-7 border rounded px-1 text-xs"
      value={quick.targetType}
      onChange={e => setQuick(q => ({...q, targetType: e.target.value as any}))}
    >
      <option value="argument">argument</option>
      <option value="claim">claim</option>
      <option value="card">card</option>
    </select>

    <input
      className="mb-2 w-full border rounded px-2 py-1 text-[12px]"
      placeholder="Search target…"
      value={q}
      onChange={e=>setQ(e.target.value)}
    />

    <input
      className="h-7 border rounded px-2 text-xs flex-1 min-w-[160px]"
      placeholder="targetId…"
      value={quick.targetId}
      onChange={e => setQuick(q => ({...q, targetId: e.target.value}))}
    />

    <input
      className="h-7 border rounded px-2 text-xs flex-1 min-w-[160px]"
      placeholder="note (optional)…"
      value={quick.note}
      onChange={e => setQuick(q => ({...q, note: e.target.value}))}
    />

    {(() => {
      const key = `${quick.targetType}:${quick.targetId.trim()}`;
      const disabled = !quick.targetId.trim() || postingKey === key;
      return (
        <div className="flex items-center gap-2">
          <button
            className="h-7 px-2 border rounded text-xs disabled:opacity-50"
            disabled={disabled}
            onClick={() =>
              postMove(
                quick.targetType,
                quick.targetId.trim(),
                'WHY',
                quick.note ? { note: quick.note } : {}
              )
            }
            title="Post WHY and update Dialogue Engine"
          >
            {postingKey === key ? 'Posting…' : 'New WHY'}
          </button>
          {okKey === key && (
            <span className="text-[10px] text-emerald-700">✓ posted</span>
          )}
        </div>
      );
    })()}
  </div>
</div>
        <div className="space-y-3">
           {/* tiny debug chip so you know the drawer actually fetched moves */}
          <div className="text-[11px] text-neutral-500">
            fetched moves: <b>{safeMoves.length}</b> • groups: <b>{sections.length}</b>
          </div>
            <div className="mb-2 flex flex-wrap gap-2 text-[11px]">
    {(['all','why','resolved','conceded','retracted'] as const).map(f => (
      <button key={f}
        className={`px-2 py-0.5 rounded border ${filter===f?'bg-slate-100':'bg-white'}`}
        onClick={() => setFilter(f)}>{f}</button>
    ))}
  </div>
          {sections.map(({ targetId, latest, moves }) => {
            const conceded = latest?.kind === 'ASSERT' && latest?.payload?.as === 'CONCEDE';
            const state =
              latest?.kind === 'WHY' ? 'Open WHY' :
              latest?.kind === 'GROUNDS' ? 'Resolved' :
              latest?.kind === 'RETRACT' ? 'Retracted' :
              conceded ? 'Conceded' : '—';

            const chipEl =
              latest?.kind === 'WHY' ? chip('WHY') :
              latest?.kind === 'GROUNDS' ? chip('GROUNDS') :
              latest?.kind === 'RETRACT' ? chip('RETRACT') :
              conceded ? chip('CONCEDE') :
              chip(latest?.kind || '—');

            const ttlHrs = latest?.kind === 'WHY' ? hoursLeft(latest?.payload?.deadlineAt) : null;
            const title = titlesByTarget?.[targetId] || targetId;

            return (
              <div
                key={targetId}
                className="rounded border p-2 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => {
                  // Focus Ludics panel on this target (listeners will compile-step)
                  window.dispatchEvent(new CustomEvent('ludics:focus', {
                    detail: { deliberationId, phase: 'focus-P' }
                  }));
                }}
                title="Focus this line in Dialogue Engine"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium truncate max-w-[75%]">{title}</div>
                  <div className="flex items-center gap-2">
                    {chipEl}
                        {okKey === targetId && <span className="text-[10px] text-emerald-700">✓ posted</span>}

                      {ttlHrs !== null && latest?.kind === 'WHY' && (
    <span className={`text-[10px] px-1 py-0.5 rounded border ${
      ttlHrs <= 0 ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-amber-50 border-amber-200 text-amber-700'
    }`}>
      ⏱ {Math.max(0, ttlHrs)}h
    </span>
  )}
                    {latest && <span className="text-[10px] text-neutral-600">{timeAgo(latest.createdAt)}</span>}
                  </div>
                </div>
   {/* Row-level actions */}
                    <div className="mt-2 flex flex-wrap gap-2">
                   <button className="px-2 py-0.5 border rounded text-[11px]"
                     onClick={(e) => { e.stopPropagation(); postMove('argument',''+targetId,'WHY',{ note:'Why?' }); }}
                                  disabled={postingKey === targetId}>
                     WHY
                   </button>
                   <button className="px-2 py-0.5 border rounded text-[11px]"
                        onClick={(e) => {
                              e.stopPropagation();
                              setActiveReplyFor(targetId);
                              // optional: prefill a helpful stub
                              const input = replyRefs.current.get(targetId);
                              if (input) {
                                if (!input.value) input.value = '';
                                input.focus();
                              } else {
                                // focus after render
                                requestAnimationFrame(() => replyRefs.current.get(targetId)?.focus());
                              }
                            }}
                            disabled={postingKey === targetId}>
                            GROUNDS
                          </button>
                   <button className="px-2 py-0.5 border rounded text-[11px]"
                         onClick={(e) => { e.stopPropagation(); postMove('argument',''+targetId,'RETRACT',{ text:'Retract' }); }}
                               disabled={postingKey === targetId}>
                     RETRACT
                   </button>
                   <button className="px-2 py-0.5 border rounded text-[11px]"
                       onClick={(e) => { e.stopPropagation(); postMove('argument',''+targetId,'CONCEDE',{ note:'Concede' }); }}
                             disabled={postingKey === targetId}>
                     CONCEDE
                   </button>
                 </div>
                 <div className="mt-2 flex gap-2 items-center">
    <input
      className="border rounded px-2 py-0.5 text-[11px] flex-1"
      placeholder="Reply with grounds…"
      ref={setReplyRef(targetId)}
      onKeyDown={async (e) => {
        const el = e.currentTarget as HTMLInputElement;
        if (e.key === 'Enter' && el.value.trim()) {
          e.stopPropagation();
          await postMove('argument', ''+targetId, 'GROUNDS', { brief: el.value.trim() });
          el.value = '';
          setActiveReplyFor(null);
        }
      }}
    />
    
    <button className="px-2 py-0.5 border rounded text-[11px]"
      onClick={async (e) => {
        const box = (e.currentTarget.previousSibling as HTMLInputElement);
        const v = box.value.trim();
        if (!v) return;
        e.stopPropagation();
        await postMove('argument', ''+targetId, 'GROUNDS', { brief: v });
        box.value = '';
        setActiveReplyFor(null);
      }}>
      Send
    </button>
  </div>
                <div className="mt-2 space-y-1">
                  {moves.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 text-sm">
                      {chip(m.kind === 'ASSERT' && m.payload?.as === 'CONCEDE' ? 'CONCEDE' : m.kind)}
                      <span className="text-[11px] text-neutral-600">{timeAgo(m.createdAt)}</span>
                      {m.payload && (
                        <span className="truncate text-[11px] text-neutral-600 max-w-[65%]">
                          {m.payload.note || m.payload.deadlineAt || ''}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {!sections.length && (
            <div className="rounded border p-2 text-sm text-neutral-600">
              No dialogue moves yet.
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
