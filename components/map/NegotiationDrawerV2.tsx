'use client';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { useDialogueMoves } from '../dialogue/useDialogueMoves';
import DialogueMoves from '../dialogue/DialogueMoves';
import { DialogueMove } from '../dialogue/useDialogueMoves';
type Props = {
  deliberationId: string;
  open: boolean;
  onClose: () => void;
  /** Optional: friendly labels for targetId → "short text…" */
  titlesByTarget?: Record<string, string>;
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

  const [loading, setLoading] = React.useState(false);
  const refresh = async () => {
    setLoading(true);
    await mutate();
    setLoading(false);
  };

  React.useEffect(() => { if (open) void refresh(); }, [open]);

  if (!open) return null;

  const sections = Array.from(byTarget.entries())
    .map(([targetId, list]) => {
      const latest = latestByTarget.get(targetId);
      // Fold WHY→GROUNDS pairs that are within 2s into a single “resolved” visual
      const compact: DialogueMove[] = [];
      for (let i = 0; i < list.length; i++) {
        const m = list[i];
        if (m.kind === 'WHY' && list[i + 1]?.kind === 'GROUNDS') {
          const t1 = new Date(m.createdAt).getTime();
          const t2 = new Date(list[i + 1].createdAt).getTime();
          if (t2 - t1 <= 2000) {
            compact.push(list[i + 1]); // Keep only GROUNDS
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
    });

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

        <div className="space-y-3">
          {sections.map(({ targetId, latest, moves }) => {
            const state =
              latest?.kind === 'WHY' ? 'Open WHY' :
              latest?.kind === 'GROUNDS' ? 'Resolved' :
              latest?.kind === 'RETRACT' ? 'Retracted' :
              (latest?.kind === 'ASSERT' && latest?.payload?.as === 'CONCEDE') ? 'Conceded' :
              '—';
            const chipEl =
              latest?.kind === 'WHY' ? chip('WHY') :
              latest?.kind === 'GROUNDS' ? chip('GROUNDS') :
              latest?.kind === 'RETRACT' ? chip('RETRACT') :
              (latest?.kind === 'ASSERT' && latest?.payload?.as === 'CONCEDE') ? chip('CONCEDE') :
              chip(latest?.kind || '—');

            const title = titlesByTarget?.[targetId] || targetId;

            return (
              <div key={targetId} className="rounded border p-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium truncate max-w-[75%]">{title}</div>
                  <div className="flex items-center gap-2">
                    {chipEl}
                    {latest && <span className="text-[10px] text-neutral-600">{timeAgo(latest.createdAt)}</span>}
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  {moves.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 text-sm">
                      {chip(
                        m.kind === 'ASSERT' && m.payload?.as === 'CONCEDE' ? 'CONCEDE' : m.kind
                      )}
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
