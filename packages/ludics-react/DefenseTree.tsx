'use client';
import * as React from 'react';

type ActRef = { posActId: string; negActId: string; ts: number };
type TraceLike = {
  steps?: ActRef[] | null;
  status?: 'ONGOING'|'CONVERGENT'|'DIVERGENT';
  endedAtDaimonForParticipantId?: string;
};

export function DefenseTree(props: {
  designs?: any[];                   // make optional + default
  trace?: TraceLike | null;          // <-- make optional + default
  decisiveWindow?: number;
  highlightIndices?: number[];
}) {
  const designs = props.designs ?? [];
  const steps: ActRef[] = Array.isArray(props.trace?.steps) ? props.trace!.steps as ActRef[] : [];
  const status: 'ONGOING'|'CONVERGENT'|'DIVERGENT' = props.trace?.status ?? 'ONGOING';
  const windowSize = Math.max(1, props.decisiveWindow ?? 3);

  // map actId -> act (+participant)
  const byId = new Map<string, any>();
  for (const d of designs) for (const a of (d.acts ?? [])) {
    byId.set(a.id, { ...a, _who: d.participantId });
  }

  // empty state (pre-step or cleared)
  if (steps.length === 0) {
    return (
      <div className="border rounded p-2 text-xs opacity-60">
        Defense tree: no traversal yet.
      </div>
    );
  }

  const n = steps.length;
  const startHi = status === 'CONVERGENT' ? Math.max(0, n - windowSize) : -1;
  const isDecisive = (i: number) =>
    (props.highlightIndices && props.highlightIndices.includes(i)) ||
    (startHi >= 0 && i >= startHi);

  return (
    <div className="border rounded p-2">
      <div className="text-sm font-semibold mb-2 flex items-center gap-2">
        Defense tree (last traversal)
        {status === 'CONVERGENT' && (
          <span className="text-xs px-2 py-0.5 border rounded bg-green-50">
            converged at † for <b>{props.trace?.endedAtDaimonForParticipantId ?? '—'}</b>
          </span>
        )}
      </div>

      <ol className="text-xs space-y-1">
        {steps.map((s, i) => {
          const P = byId.get(s.posActId), O = byId.get(s.negActId);
          const decisive = isDecisive(i);
          return (
            <li
              key={i}
              className={`flex flex-wrap gap-2 items-center rounded ${
                decisive ? 'border-2 border-green-400/70 bg-green-50/40 p-1' : ''
              }`}
            >
              <span className="opacity-70">#{i + 1}</span>
              <span className="px-1.5 py-0.5 border rounded">
                {P?._who ?? 'P'}: {P?.expression ?? P?.kind}
              </span>
              <span>⇄</span>
              <span className="px-1.5 py-0.5 border rounded">
                {O?._who ?? 'O'}: {O?.expression ?? O?.kind}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-2 text-[11px] opacity-75">
        {status === 'CONVERGENT'
          ? <>Highlighted block shows the <b>decisive chain</b> (last {Math.min(windowSize, n)} pairs).</>
          : <>No decisive block highlighted (status: <b>{status}</b>).</>}
      </div>
    </div>
  );
}
