'use client';
import * as React from 'react';
import type { CommandCardProps, CommandCardAction } from './types';

export function computeFogForNodes(
  nodeIds: string[],
  moves: Array<{ kind:'WHY'|'GROUNDS'|'CONCEDE'|'RETRACT'|'CLOSE'; targetId:string; fromId?:string; toId?:string; }>
): Record<string, boolean> {
  const explored = new Set<string>();
  moves.forEach(m => {
    if (m.kind === 'WHY' || m.kind === 'GROUNDS') {
      if (m.targetId) explored.add(m.targetId);
      if (m.fromId) explored.add(m.fromId);
      if (m.toId) explored.add(m.toId);
    }
  });
  return Object.fromEntries(nodeIds.map(id => [id, !explored.has(id)]));
}

export function CommandCard({ actions, onPerform, variant = 'full', showHotkeyHints = true }: CommandCardProps) {
  // Hotkeys
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = (e.key || '').toUpperCase();
      const a = actions.find(x => x.hotkey?.toUpperCase() === key && !x.disabled);
      if (a) { e.preventDefault(); onPerform(a); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actions, onPerform]);

  const grid = [
    actions.filter(a => a.group === 'top'),
    actions.filter(a => a.group === 'mid'),
    actions.filter(a => a.group === 'bottom'),
  ];

  return (
    <div className={`rounded-xl border bg-white/80 shadow-sm p-2 ${variant === 'compact' ? 'w-[220px]' : 'w-[260px]'}`}>
      {grid.map((row, i) => (
        <div key={i} className="grid grid-cols-3 gap-1 mb-1">
          {row.slice(0,3).map(a => (
            <button
              key={a.id}
              title={a.reason || a.label}
              disabled={!!a.disabled}
              className={[
                'h-10 rounded text-[11px] px-2 border',
                a.disabled ? 'opacity-50 cursor-not-allowed' :
                a.tone === 'danger' ? 'border-rose-200 bg-rose-50 hover:bg-rose-100' :
                a.tone === 'primary' ? 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100' :
                'border-slate-200 bg-white hover:bg-slate-100',
              ].join(' ')}
              onClick={() => onPerform(a)}
            >
              <div className="flex flex-col items-center leading-tight">
                <span className="truncate">{a.label}</span>
                {showHotkeyHints && a.hotkey && <span className="opacity-60 text-[10px]">[{a.hotkey}]</span>}
              </div>
            </button>
          ))}
          {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, j) =>
            <div key={`sp-${j}`} />
          )}
        </div>
      ))}
    </div>
  );
}
function handlePerform(a: CommandCardAction) {
  if (a.scaffold) {
    window.dispatchEvent(new CustomEvent('mesh:composer:insert', { detail: { template: a.scaffold.template } }));
    return;
  }
  // protocol action
  fetch('/api/dialogue/move', {
    method:'POST', headers:{'content-type':'application/json'},
    body: JSON.stringify({
      deliberationId: a.target.deliberationId,
      targetType: a.target.targetType,
      targetId: a.target.targetId,
      kind: a.move?.kind,
      payload: { ...(a.move?.payload || {}), ...(a.target.locusPath ? { locusPath: a.target.locusPath } : {}) },
      postAs: a.move?.postAs, autoCompile:true, autoStep:true
    })
  }).then(() => window.dispatchEvent(new CustomEvent('mesh:dialogue:refresh')));
}


// Helper to execute either a move or a scaffold
export async function performCommand(action: CommandCardAction) {
  if (action.scaffold?.template) {
    window.dispatchEvent(new CustomEvent('mesh:composer:insert', { detail: { template: action.scaffold.template } }));
    // optional analytics
    return;
  }
  if (action.move) {
    const { deliberationId, targetType, targetId, locusPath } = action.target;
    await fetch('/api/dialogue/move', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        deliberationId, targetType, targetId,
        kind: action.move.kind,
        payload: { ...(action.move.payload || {}), ...(locusPath ? { locusPath } : {}) },
        postAs: action.move.postAs,
        autoCompile: true, autoStep: true
      })
    });
    // optional: emit UI refresh event if your SWR cache key isn't auto-invalidated
    window.dispatchEvent(new CustomEvent('mesh:dialogue:refresh'));
  }
}
