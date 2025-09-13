// components/dialogue/NLCommitPopover.tsx
'use client';
import * as React from 'react';
import { normalizeNL } from '@/lib/nl';

export function NLCommitPopover({
  open, onOpenChange,
  deliberationId, targetType, targetId, locusPath,
  defaultOwner = 'Proponent', // 'Proponent' | 'Opponent'
  defaultPolarity = 'pos',    // 'pos' | 'neg'
  defaultText = '',
  onDone,
}: {
  open: boolean;
  onOpenChange: (v:boolean)=>void;
  deliberationId: string;
  targetType: 'argument'|'claim'|'card';
  targetId: string;
  locusPath: string;
  defaultOwner?: 'Proponent'|'Opponent';
  defaultPolarity?: 'pos'|'neg';
  defaultText?: string;
  onDone?: ()=>void;
}) {
  const [text, setText] = React.useState(defaultText);
  const [owner, setOwner] = React.useState<'Proponent'|'Opponent'>(defaultOwner);
  const [polarity, setPolarity] = React.useState<'pos'|'neg'>(defaultPolarity);
  const [busy, setBusy] = React.useState(false);
  const [preview, setPreview] = React.useState<{ kind:'fact'|'rule'; canonical:string; tips?:string[] }|null>(null);
  const [error, setError] = React.useState<string|null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!text.trim()) { setPreview(null); return; }
      const res = await normalizeNL(text);
      if (!alive) return;
      if (!res.ok) { setPreview(null); setError('Could not parse. Try “A & B -> C”.'); return; }
      if (res.kind === 'fact') setPreview({ kind:'fact', canonical: res.canonical, tips: res.suggestions });
      else setPreview({ kind:'rule', canonical: res.canonical });
      setError(null);
    })();
    return () => { alive = false; };
  }, [text]);

  const submit = async () => {
    const canonical = preview?.canonical || text.trim();
    if (!canonical) return;

    setBusy(true);
    try {
      // prefer the combined route when answering WHY; else fallback to plain commit+move pair.
      const r = await fetch('/api/dialogue/answer-and-commit', {
        method:'POST', headers:{'content-type':'application/json'},
        body: JSON.stringify({
          deliberationId, targetType, targetId,
          cqKey: 'default',                 // or pass a real cqKey if you have it in context
          locusPath,
          expression: canonical,            // canonical label or rule
          original: text, 
          commitOwner: owner,
          commitPolarity: polarity
        })
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      window.dispatchEvent(new CustomEvent('dialogue:moves:refresh'));
      window.dispatchEvent(new CustomEvent('dialogue:cs:refresh', { detail: { dialogueId, ownerId: owner } } as any));
      onDone?.();
      onOpenChange(false);
    } catch (e:any) {
      setError('Failed to post.'); 
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/10">
      <div className="w-[420px] rounded-lg border bg-white p-3 shadow-md">
        <div className="text-sm font-semibold mb-1">Answer & Commit</div>
        <div className="space-y-2">
          <textarea
            className="w-full h-20 border rounded p-2 text-sm"
            placeholder='Type a fact or rule… e.g. "Congestion downtown is high" or "congestion_high & revenue_earmarked_transit -> net_public_benefit"'
            value={text}
            onChange={(e)=>setText(e.target.value)}
          />
          {preview ? (
            <div className="text-[12px] rounded border bg-slate-50 px-2 py-1">
              <div><b>Will save:</b> <code>{preview.canonical}</code> <span className="opacity-60">({preview.kind})</span></div>
              {preview.tips?.length ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="text-[11px] opacity-60">Try:</span>
                  {preview.tips.slice(0,3).map((t,i)=>(
                    <button key={i} className="text-[11px] underline decoration-dotted" onClick={()=>setText(t)}>{t}</button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-[12px] opacity-60">Enter a fact or rule. Examples: <code>congestion_high</code> · <code>congestion_high & revenue_earmarked_transit -&gt; net_public_benefit</code></div>
          )}

          <div className="flex items-center gap-2 text-[12px]">
            <label className="inline-flex items-center gap-1">
              Owner:
              <select className="border rounded px-1" value={owner} onChange={(e)=>setOwner(e.target.value as any)}>
                <option>Proponent</option>
                <option>Opponent</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-1">
              Polarity:
              <select className="border rounded px-1" value={polarity} onChange={(e)=>setPolarity(e.target.value as any)}>
                <option value="pos">fact</option>
                <option value="neg">rule</option>
              </select>
            </label>
            <span className="ml-auto text-[11px] opacity-60">@ {locusPath}</span>
          </div>

          {error ? <div className="text-[12px] text-rose-700">{error}</div> : null}
          <div className="flex items-center justify-end gap-2">
            <button className="text-[12px] px-2 py-1 rounded border" onClick={()=>onOpenChange(false)} disabled={busy}>Cancel</button>
            <button className="text-[12px] px-2 py-1 rounded border bg-slate-900 text-white" onClick={submit} disabled={busy || !text.trim()}>
              {busy ? 'Posting…' : 'Post & Commit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
