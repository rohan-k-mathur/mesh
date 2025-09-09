// components/entail/EntailmentWidget.tsx
"use client";
import * as React from 'react';

export function EntailmentWidget({
  seedSentences = [],
  seedHypothesis = '',
}: { seedSentences?: string[]; seedHypothesis?: string }) {
  const [text, setText] = React.useState(seedSentences.join('\n'));
  const [hyp, setHyp] = React.useState(seedHypothesis);
  const [res, setRes] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  async function run() {
    setLoading(true);
    setRes(null);
    try {
      const sentences = text.split('\n').map(s => s.trim()).filter(Boolean);
      const r = await fetch('/api/entail/dialogical', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ textSentences: sentences, hypothesis: hyp }),
      }).then(r => r.json());
      setRes(r);
    } finally {
      setLoading(false);
    }
  }

  const badge = res?.status === 'ENTAILED'
    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
    : res?.status === 'CONTRADICTS'
    ? 'bg-rose-50 border-rose-200 text-rose-700'
    : 'bg-amber-50 border-amber-200 text-amber-700';

  return (
    <div className="rounded border p-3 space-y-2">
      <div className="text-sm font-medium">Dialogical entailment</div>
      <div className="grid gap-2">
        <textarea
          className="w-full border rounded p-2 text-sm"
          rows={4}
          placeholder="Premises (one per line)"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <input
          className="w-full border rounded p-2 text-sm"
          placeholder="Hypothesis"
          value={hyp}
          onChange={e => setHyp(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 border rounded text-xs" onClick={run} disabled={loading}>
            {loading ? 'Checking…' : 'Check entailment'}
          </button>
          {res?.ok && (
            <span className={`px-1.5 py-0.5 rounded border text-[10px] ${badge}`}>
              {res.status}
            </span>
          )}
          {Array.isArray(res?.classicalPatterns) && res.classicalPatterns.length > 0 && (
            <span className="px-1.5 py-0.5 rounded border text-[10px] bg-slate-50">
              Classical: {res.classicalPatterns.join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* Proof-ish steps */}
      {Array.isArray(res?.steps) && res.steps.length > 0 && (
        <div className="mt-2">
          <div className="text-xs font-medium">Trace</div>
          <ol className="text-xs pl-4 list-decimal">
            {res.steps.map((s:any, i:number) => (
              <li key={i} className="mt-0.5">
                <b>{s.rule}</b>{' '}
                {s.derived ? <span>⇒ <code>{s.derived}</code></span> : null}
                <span className="opacity-70"> (from {s.used.join(' ; ')})</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {res?.classicalPatterns?.length ? (
  <span className="px-1.5 py-0.5 rounded border text-[10px] bg-neutral-50">
    Classical path: {res.classicalPatterns.join(' • ')}
  </span>
) : null}

      {/* Derived closure */}
      {Array.isArray(res?.derived) && res.derived.length > 0 && (
        <div className="mt-2">
          <div className="text-xs font-medium">Derived facts</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {res.derived.map((d:string, i:number) => (
              <span key={i} className="text-[11px] px-1.5 py-0.5 rounded border bg-neutral-50">{d}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
