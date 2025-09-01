// components/rhetoric/RhetoricControls.tsx
'use client';
import { useMemo } from 'react';
import { useRhetoric, RhetoricCategory } from './RhetoricContext';
import { RX } from './detect';

export default function RhetoricControls({ sample }: { sample?: string }) {
  const { mode, setMode, enabled, toggle } = useRhetoric();

  const counts = useMemo(() => {
    if (!sample) return null;
    const safe = sample;
    const cats = Object.keys(RX) as RhetoricCategory[];
    const per = cats.reduce((acc, k) => {
      const re = new RegExp(RX[k].source, 'gi'); // counts are case-insensitive aggregate
      const m = safe.match(re);
      acc[k] = m?.length ?? 0;
      return acc;
    }, {} as Record<RhetoricCategory, number>);
    const words = safe.trim().split(/\s+/).filter(Boolean).length || 1;
    const totalMarks = cats.reduce((s,k)=>s+per[k],0);
    const per100w = Math.round((totalMarks / words) * 100);
    return { per, totalMarks, words, per100w };
  }, [sample]);

  const cats: { key: RhetoricCategory; label: string }[] = [
    { key:'hedge',       label:'Hedges' },
    { key:'intensifier', label:'Intensifiers' },
    { key:'absolute',    label:'Absolutes' },
    { key:'analogy',     label:'Analogies' },
    { key:'metaphor',    label:'Metaphors' },
    { key:'allcaps',     label:'ALL-CAPS' },
    { key:'exclaim',     label:'Exclamations' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <label className="flex items-center gap-1">
        Lens:
        <select className="border rounded px-1 py-0.5" value={mode} onChange={e=>setMode(e.target.value as any)}>
          <option value="content">Content</option>
          <option value="style">Style</option>
        </select>
      </label>

      {cats.map(({ key, label }) => (
        <button
          key={key}
          className={`px-2 py-0.5 rounded border ${enabled[key] ? 'bg-white' : 'opacity-50'}`}
          onClick={() => toggle(key)}
          title={counts ? `${label}: ${counts.per[key]}` : label}
        >
          {label}{counts ? ` (${counts.per[key]})` : ''}
        </button>
      ))}

      {counts && (
        <span className="ml-2 text-neutral-600">
          Style density: <b>{counts.per100w}</b> / 100w
        </span>
      )}
    </div>
  );
}
