'use client';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { useDialogueMoves } from '../dialogue/useDialogueMoves'; // ensure this is your current hook

type Props = {
  deliberationId: string;
  open: boolean;
  onClose: () => void;
  /** Optional: friendly labels for "type:id" or for just id */
  titlesByTarget?: Record<string, string>;
};

type DM = {
  id: string;
  kind: 'ASSERT'|'WHY'|'GROUNDS'|'RETRACT'|string;
  payload?: any;
  createdAt: string; // ISO
  // some APIs include these:
  targetType?: 'argument'|'claim'|'card';
  targetId?: string;
};

function timeAgo(ts: string | number) {
  const d = typeof ts === 'string' ? new Date(ts).getTime() : ts;
  const diff = Math.max(0, Date.now() - d);
  const s = Math.floor(diff / 1000); if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d2 = Math.floor(h / 24); return `${d2}d ago`;
}

function hoursLeft(iso?: string) {
  if (!iso) return null;
  const ms = Date.parse(iso) - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.ceil(ms / 36e5));
}

function chip(kind: string) {
  const base = 'px-1.5 py-0.5 rounded text-[10px] border';
  if (kind === 'WHY')     return <span className={`${base} bg-rose-50 border-rose-200 text-rose-700`}>WHY</span>;
  if (kind === 'GROUNDS') return <span className={`${base} bg-emerald-50 border-emerald-200 text-emerald-700`}>GROUNDS</span>;
  if (kind === 'RETRACT') return <span className={`${base} bg-slate-50 border-slate-200 text-slate-700`}>RETRACT</span>;
  if (kind === 'CONCEDE') return <span className={`${base} bg-sky-50 border-sky-200 text-sky-700`}>CONCEDE</span>;
  return <span className={`${base} bg-neutral-50 border-neutral-200 text-neutral-700`}>{kind}</span>;
}

function statusOf(latest?: DM) {
  if (!latest) return '—';
  if (latest.kind === 'WHY') return 'why';
  if (latest.kind === 'GROUNDS') return 'resolved';
  if (latest.kind === 'RETRACT') return 'retracted';
  if (latest.kind === 'ASSERT' && latest.payload?.as === 'CONCEDE') return 'conceded';
  return '—';
}

export default function NegotiationDrawerV2({ deliberationId, open, onClose, titlesByTarget }: Props) {
  const { moves, mutate } = useDialogueMoves(deliberationId);

     // track which row's reply box is active (optional, used for focus UX)
   const [activeReplyFor, setActiveReplyFor] = React.useState<string | null>(null);
   // keep per-row reply input refs so we can focus them
   const replyRefs = React.useRef<Map<string, HTMLInputElement>>(new Map());
   const setReplyRef = React.useCallback(
     (key: string) => (el: HTMLInputElement | null) => {
       const map = replyRefs.current;
       if (!el) map.delete(key);
       else map.set(key, el);
     },
     []
   );

  const safeMoves: DM[] = React.useMemo(() => Array.isArray(moves) ? moves as DM[] : [], [moves]);

  // Group by target type/id robustly
  const sections = React.useMemo(() => {
    if (!safeMoves.length) return [] as Array<{ key:string; tType:'argument'|'claim'|'card'; tId:string; latest?:DM; moves:DM[] }>;

    const groups = new Map<string, { tType:'argument'|'claim'|'card'; tId:string; list:DM[] }>();

    for (const mv of safeMoves) {
      const tType = (mv.targetType ?? mv.payload?.targetType ?? 'argument') as 'argument'|'claim'|'card';
      const tId   = String(mv.targetId ?? mv.payload?.targetId ?? '');
      const key   = `${tType}:${tId}`;
      if (!groups.has(key)) groups.set(key, { tType, tId, list:[] });
      groups.get(key)!.list.push(mv);
    }

    const out: Array<{ key:string; tType:'argument'|'claim'|'card'; tId:string; latest?:DM; moves:DM[] }> = [];
    for (const [key, g] of groups.entries()) {
      // Fold WHY→GROUNDS within 2s for display
      const sorted = g.list.slice().sort((a,b)=>+new Date(a.createdAt) - +new Date(b.createdAt));
      const compact: DM[] = [];
      for (let i = 0; i < sorted.length; i++) {
        const m = sorted[i];
        if (m.kind === 'WHY' && sorted[i+1]?.kind === 'GROUNDS') {
          const t1 = +new Date(m.createdAt);
          const t2 = +new Date(sorted[i+1].createdAt);
          if (t2 - t1 <= 2000) { compact.push(sorted[i+1]); i+=1; continue; }
        }
        compact.push(m);
      }
      const latest = compact[compact.length - 1];
      out.push({ key, tType: g.tType, tId: g.tId, latest, moves: compact });
    }

    out.sort((a,b)=> (+new Date(b.latest?.createdAt ?? 0)) - (+new Date(a.latest?.createdAt ?? 0)));
    return out;
  }, [safeMoves]);

  const [q, setQ] = React.useState('');
  const [filter, setFilter] = React.useState<'all'|'why'|'resolved'|'conceded'|'retracted'>('all');

  const filtered = React.useMemo(() => {
    return sections.filter(s => {
      if (filter !== 'all' && statusOf(s.latest) !== filter) return false;
      if (!q.trim()) return true;
      const titleKey = s.key;            // "type:id"
      const fallback = titlesByTarget?.[titleKey] || titlesByTarget?.[s.tId] || titleKey;
      return fallback.toLowerCase().includes(q.toLowerCase());
    });
  }, [sections, filter, q, titlesByTarget]);

  const [loading, setLoading] = React.useState(false);
  const [postingKey, setPostingKey] = React.useState<string|null>(null);
  const [okKey, setOkKey] = React.useState<string|null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    await mutate();
    setLoading(false);
  }, [mutate]);

  // On open: compile+step once, then refresh
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
    targetId: string,
    kind:'WHY'|'GROUNDS'|'RETRACT'|'CONCEDE',
    payload:any = {}
  ) {
    const key = `${targetType}:${targetId}`;
    setPostingKey(key); setOkKey(null);
    try {
      const r = await fetch('/api/dialogue/move', {
        method: 'POST',
        headers: { 'content-type':'application/json' },
        body: JSON.stringify({
          deliberationId, targetType, targetId, kind,
          payload,
          autoCompile: true, autoStep: true,
        })
      });
      if (!r.ok) console.warn('postMove failed', await r.text());
      window.dispatchEvent(new CustomEvent('dialogue:moves:refresh'));
      await refresh();
      setOkKey(key);
      setTimeout(() => setOkKey(null), 1200);
    } finally {
      setPostingKey(null);
    }
  }

  if (!open) return null;
  if (typeof document === 'undefined' || !document.body) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[480px] bg-white border-l shadow-2xl p-3 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium text-sm">Negotiation timeline</div>
          <div className="flex items-center gap-2">
            <button className="text-xs underline" onClick={refresh}>{loading ? 'Loading…' : 'Refresh'}</button>
            <button className="px-2 py-1 border rounded text-xs" onClick={onClose}>Close</button>
          </div>
        </div>

        {/* Quick add WHY */}
        <QuickWhyComposer deliberationId={deliberationId} postingKey={postingKey} okKey={okKey} onPost={postMove} />

        <div className="space-y-3">
          <div className="text-[11px] text-neutral-500">
            fetched moves: <b>{safeMoves.length}</b> • groups: <b>{filtered.length}</b>
          </div>

          <div className="mb-2 flex flex-wrap gap-2 text-[11px]">
            {(['all','why','resolved','conceded','retracted'] as const).map(f => (
              <button key={f}
                className={`px-2 py-0.5 rounded border ${filter===f?'bg-slate-100':'bg-white'}`}
                onClick={() => setFilter(f)}>{f}</button>
            ))}
            <input
              className="ml-auto border rounded px-2 py-0.5 text-[11px]"
              placeholder="Filter by title…"
              value={q}
              onChange={e=>setQ(e.target.value)}
            />
          </div>

          {filtered.map(({ key, tType, tId, latest, moves }) => {
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
            const title = titlesByTarget?.[key] || titlesByTarget?.[tId] || key;

            return (
              <div
                key={key}
                className="rounded border p-2 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => {
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
                    {okKey === key && <span className="text-[10px] text-emerald-700">✓ posted</span>}
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

                {/* Row actions */}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button className="px-2 py-0.5 border rounded text-[11px]"
                    onClick={(e) => { e.stopPropagation(); postMove(tType, tId, 'WHY', { note:'Why?' }); }}
                    disabled={postingKey === key}>
                    WHY
                  </button>
                  <button className="px-2 py-0.5 border rounded text-[11px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveReplyFor(key);
                      requestAnimationFrame(() => replyRefs.current.get(key)?.focus());
                    }}
                    disabled={postingKey === key}>
                    GROUNDS
                  </button>
                  <button className="px-2 py-0.5 border rounded text-[11px]"
                    onClick={(e) => { e.stopPropagation(); postMove(tType, tId, 'RETRACT', { text:'Retract' }); }}
                    disabled={postingKey === key}>
                    RETRACT
                  </button>
                  <button className="px-2 py-0.5 border rounded text-[11px]"
                    onClick={(e) => { e.stopPropagation(); postMove(tType, tId, 'CONCEDE', { note:'Concede' }); }}
                    disabled={postingKey === key}>
                    CONCEDE
                  </button>
                  {/* Row-level actions (add Close †) */}
<button className="px-2 py-0.5 border rounded text-[11px]"
  onClick={(e) => { e.stopPropagation(); postMove('argument',''+targetId,'CLOSE',{ locusPath: '0' }); }}
  disabled={postingKey === targetId}
  title="Close this thread (†)">
  Close (†)
</button>
                </div>

                {/* Reply inline */}
                <div className="mt-2 flex gap-2 items-center">
                  <input
                    className="border rounded px-2 py-0.5 text-[11px] flex-1"
                    placeholder="Reply with grounds…"
                    ref={setReplyRef(key)}
                    onKeyDown={async (e) => {
                      const el = e.currentTarget as HTMLInputElement;
                      if (e.key === 'Enter' && el.value.trim()) {
                        e.stopPropagation();
                        await postMove(tType, tId, 'GROUNDS', { brief: el.value.trim(), locusPath:'0' });
                        el.value = '';
                        setActiveReplyFor(null);
                      }
                    }}
                  />
                  <button className="px-2 py-0.5 border rounded text-[11px]"
                    onClick={async (e) => {
                      const box = (e.currentTarget.previousSibling as HTMLInputElement);
                      const v = box.value.trim(); if (!v) return;
                      e.stopPropagation();
                      setActiveReplyFor(key);
  requestAnimationFrame(() => replyRefs.current.get(key)?.focus());
                      await postMove(tType, tId, 'GROUNDS', { brief: v, locusPath:'0' });
                      box.value = ''; setActiveReplyFor(null);
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
                          {/* show something meaningful */}
                          {m.payload.note || m.payload.brief || m.payload.expression || ''}
                        </span>
                      )}
                      {Array.isArray(m.payload?.acts) && m.payload.acts.length > 0 ? (
      <span className="truncate text-[11px] text-neutral-600 max-w-[65%]">
        {m.payload.acts.map((a:any, i:number) => a.polarity==='daimon' ? '†' : (a.expression || '…')).join(' · ')}
      </span>
    ) : m.payload && (
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

          {!filtered.length && (
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

/* ---------- Quick WHY box extracted for clarity ---------- */
function QuickWhyComposer({
  deliberationId,
  postingKey,
  okKey,
  onPost,
}: {
  deliberationId: string;
  postingKey: string|null;
  okKey: string|null;
  onPost: (tType:'argument'|'claim'|'card', tId:string, k:'WHY'|'GROUNDS'|'RETRACT'|'CONCEDE', p?:any)=>Promise<void>;
}) {
  const [q, setQ] = React.useState('');
  const [quick, setQuick] = React.useState<{targetType:'argument'|'claim'|'card'; targetId:string; note:string}>({
    targetType: 'argument', targetId: '', note: '',
  });

  const key = `${quick.targetType}:${quick.targetId.trim()}`;
  const disabled = !quick.targetId.trim() || postingKey === key;

  return (
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

        <div className="flex items-center gap-2">
          <button
            className="h-7 px-2 border rounded text-xs disabled:opacity-50"
            disabled={disabled}
            onClick={() =>
              onPost(
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
          {okKey === key && <span className="text-[10px] text-emerald-700">✓ posted</span>}
        </div>
      </div>
    </div>
  );
}
