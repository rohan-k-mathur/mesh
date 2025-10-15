// components/work/WorkStatusRail.tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTheoryWorkChecklist } from '@/hooks/useTheoryWorkChecklist';

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div className="h-2 w-full bg-neutral-200 rounded">
      <div className="h-2 rounded bg-neutral-700" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function WorkStatusRail({
  workId,
  deliberationId,
  className,
  onPublished,
}: {
  workId: string;
  deliberationId: string;
  className?: string;
  onPublished?: (snapshotId: string) => void;
}) {
  const router = useRouter();
  const { data, isLoading, error, structureProgress, activeOpen, cqProgress } =
    useTheoryWorkChecklist(workId);

  const [publishing, setPublishing] = React.useState(false);
  const publishable = !!data?.publishable;

  async function publish(to: 'sheet'|'kb'|'aif' = 'sheet') {
    try {
      setPublishing(true);
      const res = await fetch(`/api/theory-works/${workId}/publish`, {
        method: 'POST',
        headers: { 'content-type':'application/json' },
        body: JSON.stringify({ to })
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg);
      }
      const json = await res.json();
      onPublished?.(json?.snapshotId);
      // Prefer the canonical synthetic DebateSheet 'delib:<id>' convention
      // Resolve to Deep Dive (your DebateSheet overlay can mount there)
      if (to === 'sheet') {
        router.push(`/deepdive/${deliberationId}?sheet=1`);
      } else {
        // KB/AIF fallbacks (adjust to your routes as needed)
        router.refresh();
      }
    } catch (e: any) {
      alert(`Publish failed: ${e?.message ?? 'Unknown error'}`);
    } finally {
      setPublishing(false);
    }
  }

  // Optional quick WHY/GROUNDS post — will no-op if no target available
  async function postMove(kind: 'WHY'|'GROUNDS') {
    const target =
      data?.dialogue?.legalMoves?.find(m => m.kind === kind && m.targetId)?.targetId ??
      data?.dialogue?.sampleTargetId ?? // if server exposes it
      data?.claims?.ids?.[0];          // fallback if server exposes claim ids

    if (!target) {
      // Graceful fallback: send the user to the Deep Dive where they can act
      router.push(`/deepdive/${deliberationId}#cqs`);
      return;
    }
    try {
      const res = await fetch('/api/dialogue/moves', {
        method: 'POST',
        headers: { 'content-type':'application/json' },
        body: JSON.stringify({ kind, targetType: 'claim', targetId: target })
      });
      if (!res.ok) throw new Error(await res.text());
      // Show the locus in context
      router.push(`/deepdive/${deliberationId}#claim-${target}`);
    } catch (e: any) {
      alert(`Failed to post ${kind}: ${e?.message ?? 'Unknown error'}`);
    }
  }

  const theory = data?.work?.theoryType ?? 'DN';
  const openList = activeOpen.slice(0, 5);

  return (
    <aside className={['rounded border bg-white/60 p-3 space-y-3', className].filter(Boolean).join(' ')}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Status</div>
        {isLoading && <div className="text-[11px] text-neutral-500">Loading…</div>}
        {error && <div className="text-[11px] text-red-600">Failed to load</div>}
      </div>

      {/* Structure (DN/IH/TC/OP) */}
      <div>
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium">Structure ({theory})</div>
          <div className="text-[11px] text-neutral-500">
            {Math.round(structureProgress * 100)}%
          </div>
        </div>
        <ProgressBar value={structureProgress} />
        {!!openList.length && (
          <div className="mt-1 text-[11px] text-neutral-600">
            Missing: {openList.join(', ')}
            {activeOpen.length > openList.length && ' …'}
          </div>
        )}
      </div>

      {/* Claims & CQs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs font-medium">Claims & CQs</div>
          <div className="mt-1">
            <ProgressBar value={cqProgress} />
            <div className="mt-1 text-[11px] text-neutral-600">
              {Math.round((cqProgress ?? 0) * 100)}% CQ satisfied
              {typeof data?.claims?.count === 'number' && (
                <> • {data.claims.count} claims</>
              )}
            </div>
          </div>
          <div className="mt-1 text-[11px] text-neutral-600">
            {data?.claims?.cq?.openByScheme?.slice(0, 2).map(s => (
              <div key={s.schemeKey}>
                {s.schemeKey}: {s.satisfied}/{s.required} (open {s.open.length})
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-1">
            <button
              className="px-2 py-0.5 text-[11px] rounded border bg-white disabled:opacity-50"
              onClick={() => postMove('WHY')}
              title="Ask for grounds (attack)"
              disabled={!data}
            >
              WHY
            </button>
            <button
              className="px-2 py-0.5 text-[11px] rounded border bg-white disabled:opacity-50"
              onClick={() => postMove('GROUNDS')}
              title="Provide grounds (defend)"
              disabled={!data}
            >
              GROUNDS
            </button>
            <button
              className="px-2 py-0.5 text-[11px] rounded border bg-white"
              onClick={() => router.push(`/deepdive/${deliberationId}#dialogue`)}
              title="Open dialogue panel"
            >
              Open Dialogue
            </button>
          </div>
        </div>

        {/* Evidence & Dialogue */}
        <div>
          <div className="text-xs font-medium">Evidence & Dialogue</div>
          <div className="mt-1 text-[11px] text-neutral-600">
            Evidence items: {data?.claims?.evidence?.count ?? 0}
          </div>
          <div className="mt-1 text-[11px]">
            {data?.dialogue?.hasClosableLoci
              ? <span className="text-emerald-700">† Some loci closable</span>
              : <span className="text-neutral-600">No closable loci yet</span>}
          </div>
          {data?.dialogue?.legalMoves?.length ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {data.dialogue.legalMoves.slice(0, 4).map((m, i) => (
                <span
                  key={i}
                  className={[
                    'text-[10px] px-1.5 py-0.5 rounded border',
                    m.force === 'ATTACK' ? 'border-red-300 bg-red-50' :
                    m.force === 'SURRENDER' ? 'border-emerald-300 bg-emerald-50' :
                    'border-neutral-300 bg-neutral-50'
                  ].join(' ')}
                  title={m.relevance ? `relevance: ${m.relevance}` : ''}
                >
                  {m.kind}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Publish */}
      <div className="flex items-center justify-between">
        <div className="text-[11px] text-neutral-600">
          Publishing sends claims/edges to the debate and stores a snapshot.
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded border text-sm bg-white disabled:opacity-50"
            onClick={() => publish('sheet')}
            disabled={!publishable || publishing}
            title={publishable ? 'Publish to DebateSheet' : 'Complete required fields & CQs to enable'}
          >
            {publishing ? 'Publishing…' : 'Publish to DebateSheet'}
          </button>
        </div>
      </div>
    </aside>
  );
}
