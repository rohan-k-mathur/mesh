// components/af/DefenseTree.tsx
'use client';
import * as React from 'react';

type Labeling = {
  IN: Set<string>;
  OUT: Set<string>;
  UNDEC: Set<string>;
};

type Edge = [string, string]; // [attacker, target]

export function DefenseTree({
  targetId,
  R,
  idToText,
  labeling,
  maxDepth = 3,
}: {
  targetId: string;
  R: Edge[];
  idToText: (id: string) => string;
  labeling: Labeling;
  maxDepth?: number;
}) {
  const attackersOf = React.useCallback((y: string) => {
    const res: string[] = [];
    for (const [x, t] of R) if (t === y) res.push(x);
    return res;
  }, [R]);

  const status = (id: string) =>
    labeling.IN.has(id) ? 'IN' : labeling.OUT.has(id) ? 'OUT' : 'UNDEC';

  function NodeLine({ id }: { id: string }) {
    const st = status(id);
    const chip =
      st === 'IN' ? 'bg-emerald-600 text-white' :
      st === 'OUT' ? 'bg-rose-600 text-white' :
      'bg-amber-600 text-white';
    return (
      <div className="flex items-start gap-2">
        <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded ${chip}`}>{st}</span>
        <span className="text-sm">{idToText(id)}</span>
      </div>
    );
  }

  function renderLayer(id: string, depth: number): React.ReactNode {
    if (depth > maxDepth) return null;
    const atks = attackersOf(id);
    if (!atks.length) return null;

    return (
      <ul className="ml-4 border-l pl-3 space-y-2">
        {atks.map(a => (
          <li key={`${id}->${a}`}>
            {/* attacker */}
            <NodeLine id={a} />
            {/* defenders of attacker */}
            {renderDefendersOfAttacker(a, depth + 1)}
          </li>
        ))}
      </ul>
    );
  }

  function renderDefendersOfAttacker(attackerId: string, depth: number): React.ReactNode {
    if (depth > maxDepth) return null;
    const defenders = attackersOf(attackerId); // attackers of attacker = defenders of target
    if (!defenders.length) return null;
    return (
      <ul className="ml-4 border-l pl-3 space-y-2">
        {defenders.map(d => (
          <li key={`${attackerId}->${d}`}>
            <NodeLine id={d} />
            {/* recurse: counter‑counter attackers */}
            {renderLayer(d, depth + 1)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="rounded border p-2">
      <div className="text-xs font-semibold mb-1">Defense tree</div>
      {/* target */}
      <NodeLine id={targetId} />
      {/* attackers of target */}
      {renderLayer(targetId, 1)}
    </div>
  );
}
