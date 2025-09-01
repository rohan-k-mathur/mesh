'use client';
import { useEffect, useMemo, useState } from 'react';

function looksConclusive(text: string) {
  const t = text.toLowerCase();
  const markers = ['therefore', 'so we must', 'hence', 'thus', 'it follows', 'consequently'];
  return markers.some(m => t.includes(m));
}

export default function EnthymemeNudge({
  targetType, targetId, draft, onPosted,
}: {
  targetType: 'argument'|'card';
  targetId?: string;          // nudge only if replying to something
  draft: string;
  onPosted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [ptype, setPtype] = useState<'premise'|'warrant'>('premise');

  const suggest = useMemo(() => targetId && looksConclusive(draft), [targetId, draft]);
  useEffect(()=>{ if (!suggest) setOpen(false); }, [suggest]);

  const post = async () => {
    if (!targetId || !text.trim()) return;
    const res = await fetch('/api/missing-premises', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ targetType, targetId, text: text.trim(), premiseType: ptype }),
    });
    if (res.ok) {
      setOpen(false); setText('');
      onPosted?.();
    }
  };

  return (
    <div className="mt-2">
      {suggest && !open && (
        <button className="text-[11px] px-2 py-0.5 border rounded"
          onClick={()=>setOpen(true)}
          title="Add implicit premise/warrant to the parent you’re replying to">
          Add missing premise/warrant
        </button>
      )}
      {open && (
        <div className="mt-2 rounded border p-2 bg-amber-50/40">
          <div className="text-[11px] text-neutral-700 mb-1">
            What unstated idea links your point to the conclusion?
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <label className="inline-flex items-center gap-1">
              Kind:
              <select className="border rounded px-1 py-0.5" value={ptype} onChange={(e)=>setPtype(e.target.value as any)}>
                <option value="premise">Premise</option>
                <option value="warrant">Warrant</option>
              </select>
            </label>
          </div>
          <textarea rows={3} className="w-full text-xs border rounded px-2 py-1 mt-1"
            placeholder="Write the missing premise/warrant…" value={text} onChange={e=>setText(e.target.value)} />
          <div className="mt-1 flex gap-2">
            <button className="text-xs px-2 py-0.5 border rounded" onClick={post} disabled={!text.trim()}>Propose</button>
            <button className="text-xs text-neutral-600" onClick={()=>setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
