'use client';
import * as React from 'react';

export function IntegrityBadge({
  workId, theoryType,
}: { workId:string; theoryType:'DN'|'IH'|'TC'|'OP' }) {
  const [state, setState] = React.useState<{ hasHerm?:boolean; hasPrac?:boolean; hasPascal?:boolean; hasStd?:boolean }|null>(null);

  React.useEffect(() => {
    (async () => {
      const res = await fetch(`/api/works/${workId}/integrity`);
      const j = await res.json();
      setState(j ?? null);
    })();
  }, [workId]);

  if (!state) return null;

  let ok = false; let msg = '';
  if (theoryType === 'IH') { ok = !!(state.hasHerm && state.hasPrac && state.hasStd); msg = ok?'Complete':'Add hermeneutic + practical + standard output'; }
  if (theoryType === 'TC') { ok = !!(state.hasPrac && state.hasStd); msg = ok?'Complete':'Add practical + standard output'; }
  if (theoryType === 'OP') { ok = !!state.hasPascal; msg = ok?'Complete':'Add Pascal decision'; }
  if (theoryType === 'DN') { ok = true; msg = 'Extract claims & link supplies (optional)'; }

  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] border ${ok?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-amber-50 border-amber-200 text-amber-800'}`}>
      {msg}
    </span>
  );
}
