// components/monological/ToulminBox.tsx
'use client';
import * as React from 'react';

const CUES = {
  claim:     /\b(therefore|thus|so it follows|we should|hence|conclude|thereby|in conclusion)\b/i,
  grounds:   /\b(because|since|given that|as|insofar as|due to|on the grounds that)\b/i,
  warrant:   /\b(generally|as a rule|other things equal|assuming|if.*then|there is reason to think)\b/i,
  backing:   /\b(according to|as shown in|by (the|a) study|evidence from|meta-?analysis|replication)\b/i,
  qualifier: /\b(probably|likely|plausibly|maybe|possibly|almost certainly|in most cases)\b/i,
  rebuttal:  /\b(unless|except when|however|but|on the other hand|still|nevertheless)\b/i,
};

function splitSents(text: string): string[] {
  // simple sentence split; safe fallback
  const s = (text.match(/[^.!?]+[.!?]+/g) || [text]).map(t => t.trim());
  return s.filter(Boolean);
}

type Slot = 'claim'|'grounds'|'warrant'|'backing'|'qualifier'|'rebuttal';
const ORDER: Slot[] = ['grounds','warrant','backing','qualifier','rebuttal','claim'];

export function ToulminBox({
  text,
  onAddMissing,
  onPromoteConclusion,
  className,
}: {
  text: string;
  onAddMissing?: (slot: Slot) => void;
  onPromoteConclusion?: (conclusionText: string) => void;
  className?: string;
}) {
  const sents = React.useMemo(() => splitSents(text), [text]);
  const buckets = React.useMemo(() => {
    const m: Record<Slot, string[]> = { claim:[], grounds:[], warrant:[], backing:[], qualifier:[], rebuttal:[] };
    for (const s of sents) {
      let hit: Slot | null = null;
      for (const k of ORDER) {
        const re = (CUES as any)[k] as RegExp;
        if (re.test(s)) { hit = k; break; }
      }
      if (!hit) continue;
      m[hit].push(s);
    }
    return m;
  }, [sents]);

  const has = (k: Slot) => (buckets[k]?.length ?? 0) > 0;
  const completeness = (['grounds','warrant','claim'] as Slot[]).filter(has).length / 3;

  const section = (slot: Slot, title: string, color: string) => (
    <div className={`rounded border ${color} p-2`}>
      <div className="text-[11px] font-semibold mb-1">{title}</div>
      {(buckets[slot] ?? []).slice(0, 3).map((t, i) => <div key={i} className="text-[12px] mb-1">• {t}</div>)}
      {!has(slot) && (
        <button
          className="text-[11px] underline"
          onClick={() => onAddMissing?.(slot)}
          title={`Add a missing ${title.toLowerCase()}`}
        >
          + Add {title}
        </button>
      )}
    </div>
  );

  const conclusion = buckets.claim?.[0] || '';

  return (
    <div className={`mt-2 grid grid-cols-3 gap-2 ${className ?? ''}`}>
      {section('grounds',  'Grounds',   'border-emerald-200 bg-emerald-50/60')}
      {section('warrant',  'Warrant',   'border-violet-200  bg-violet-50/60')}
      {section('backing',  'Backing',   'border-sky-200     bg-sky-50/60')}
      {section('qualifier','Qualifier', 'border-amber-200   bg-amber-50/60')}
      {section('rebuttal', 'Rebuttal',  'border-rose-200    bg-rose-50/60')}
      <div className="rounded border border-blue-200 bg-blue-50/60 p-2">
        <div className="text-[11px] font-semibold mb-1">Conclusion</div>
        {conclusion ? <div className="text-[12px]">• {conclusion}</div> : <div className="italic text-[12px] text-neutral-600">not detected</div>}
        {conclusion && (
          <button className="text-[11px] underline mt-1" onClick={() => onPromoteConclusion?.(conclusion)}>
            Promote conclusion → Claim
          </button>
        )}
        <div className="mt-2 text-[10px] text-neutral-600">Completeness: {(completeness*100).toFixed(0)}%</div>
      </div>
    </div>
  );
}
