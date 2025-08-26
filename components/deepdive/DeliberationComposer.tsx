'use client';
import { useState } from 'react';
import { z } from 'zod';

type Props = { deliberationId: string; onPosted?: () => void; targetArgumentId?: string };

const schema = z.object({
  text: z.string().min(1).max(5000),
  sources: z.array(z.string().url()).optional(),
  confidence: z.number().min(0).max(1).optional(),
  isImplicit: z.boolean().optional(),
});

export default function DeliberationComposer({ deliberationId, onPosted, targetArgumentId }: Props) {
  const [text, setText] = useState('');
  const [sources, setSources] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<number | undefined>(undefined);
  const [pending, setPending] = useState(false);
  const [edgeType, setEdgeType] = useState<'support' | 'rebut' | 'undercut' | null>(null);
  const [quantifier, setQuantifier] = useState<'SOME'|'MANY'|'MOST'|'ALL'|undefined>();
 const [modality, setModality] = useState<'COULD'|'LIKELY'|'NECESSARY'|undefined>();

  const addSource = (url: string) => {
    try { new URL(url); setSources(prev => [...new Set([...prev, url])]); } catch {}
  };

  const post = async () => {
    const body = { text, sources, confidence, quantifier, modality };
    const parsed = schema.safeParse(body);
    if (!parsed.success) return alert('Please add a point (and valid sources if included).');

    setPending(true);
    try {
      // 1) create argument
      const res = await fetch(`/api/deliberations/${deliberationId}/arguments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error(await res.text());
      const { argument } = await res.json();

      // 2) if replying to a target with an edge type, add edge
      if (targetArgumentId && edgeType) {
        await fetch(`/api/deliberations/${deliberationId}/edges`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fromArgumentId: argument.id, toArgumentId: targetArgumentId, type: edgeType }),
        });
      }

      setText(''); setSources([]); setConfidence(undefined); setEdgeType(null);
      onPosted?.();
    } catch (e: any) {
      console.error(e); alert('Could not post. Please try again.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="text-sm text-neutral-600">Deep‑dive</div>
      <textarea
        className="w-full border rounded p-3" rows={4}
        placeholder="Start by showing you got it… then add your point."
        value={text} onChange={(e) => setText(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <button className="px-2 py-1 border rounded" onClick={() => {
          const url = prompt('Add source URL'); if (url) addSource(url);
        }}>Add source</button>
                {/* Quantifier chips */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-neutral-500 mr-1">Quantifier:</span>
          {(['SOME','MANY','MOST','ALL'] as const).map(q => (
            <button key={q}
              className={`px-2 py-1 border rounded ${quantifier===q?'bg-neutral-100':''}`}
              onClick={() => setQuantifier(q)}>{q}</button>
          ))}
        </div>
        {/* Modality chips */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-neutral-500 mr-1">Modality:</span>
          {(['COULD','LIKELY','NECESSARY'] as const).map(m => (
            <button key={m}
              className={`px-2 py-1 border rounded ${modality===m?'bg-neutral-100':''}`}
              onClick={() => setModality(m)}>{m}</button>
          ))}
        </div>
        <button className="px-2 py-1 border rounded" onClick={() => setConfidence(0.25)}>How sure: 25%</button>
        <button className="px-2 py-1 border rounded" onClick={() => setConfidence(0.5)}>How sure: 50%</button>
        <button className="px-2 py-1 border rounded" onClick={() => setConfidence(0.75)}>How sure: 75%</button>
        <button className="px-2 py-1 border rounded" onClick={() => setConfidence(1)}>How sure: 100%</button>
      </div>
      {sources.length > 0 && (
        <div className="text-xs text-neutral-600">
          Sources: {sources.map(s => <a key={s} href={s} target="_blank" className="underline mr-2">{s}</a>)}
        </div>
      )}
      {targetArgumentId && (
        <div className="flex gap-2 items-center">
          <span className="text-sm text-neutral-700">This is a reply:</span>
          <button className={`px-2 py-1 border rounded ${edgeType==='support'?'bg-neutral-100':''}`} onClick={() => setEdgeType('support')}>Support</button>
          <button className={`px-2 py-1 border rounded ${edgeType==='rebut'?'bg-neutral-100':''}`} onClick={() => setEdgeType('rebut')}>Rebut</button>
          <button className={`px-2 py-1 border rounded ${edgeType==='undercut'?'bg-neutral-100':''}`} onClick={() => setEdgeType('undercut')}>Undercut</button>
          <span className="text-xs text-neutral-500">(“Undercut” challenges the link, not the claim.)</span>
        </div>
      )}
      <div className="flex justify-end">
        <button disabled={pending || !text.trim()} onClick={post}
          className="px-3 py-2 rounded bg-black text-white disabled:opacity-50">
          {pending ? 'Posting…' : 'Post'}
        </button>
      </div>
    </div>
  );
}
