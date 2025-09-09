'use client';
import * as React from 'react';

type Step = { posActId: string; negActId: string; ts: number };

export function TraceRibbon(props: {
  steps?: Step[] | null;                      // ← make optional
  status?: 'ONGOING'|'CONVERGENT'|'DIVERGENT';
  badges?: Record<number, string>;
  onFocus?: (pairIndex: number) => void;
}) {
  // Defensive defaults
  const steps: Step[] = Array.isArray(props.steps) ? props.steps : [];
  const status = props.status ?? 'ONGOING';
  const badges = props.badges ?? {};

  if (steps.length === 0) {
    // Render a tiny placeholder or return null — your choice:
    return <div className="text-xs opacity-60">No steps yet.</div>;
    // return null;
  }

  return (
    <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
      {steps.map((s, i) => (
        <div key={i}
             onClick={() => props.onFocus?.(i)}
             style={{display:'flex',gap:6,alignItems:'center',cursor:'pointer', padding:4, border:'1px solid #ddd', borderRadius:6}}>
          <span title={s.posActId}>P:{s.posActId.slice(0,4)}</span>
          <span>⇄</span>
          <span title={s.negActId}>O:{s.negActId.slice(0,4)}</span>
          {badges[i] && (
            <span style={{fontSize:10, padding:'1px 4px', border:'1px solid #f59e0b', borderRadius:4}}>
              {badges[i]}
            </span>
          )}
        </div>
      ))}
      <strong>{status === 'CONVERGENT' ? '†' : status}</strong>
    </div>
  );
}
