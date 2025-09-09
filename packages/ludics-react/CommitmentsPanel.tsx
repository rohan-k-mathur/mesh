'use client';
import * as React from 'react';

type Item = string | { label: string; entitled?: boolean; derived?: boolean };
const toObj = (x: Item): { label: string; entitled?: boolean; derived?: boolean } =>
  typeof x === 'string' ? { label: x, entitled: true } : x;

export function CommitmentsPanel(props: {
  dialogueId: string;
  ownerId: string; // 'Proponent' | 'Opponent' (or user id)
  onChanged?: (summary: any) => void;
}) {
  const [facts, setFacts] = React.useState<Array<{label:string; entitled?: boolean; derived?: boolean}>>([]);
  const [rules, setRules] = React.useState<Array<{label:string}>>([]);
  const [label, setLabel] = React.useState('');
  const [summary, setSummary] = React.useState<{derived?: {label:string}[]; contradictions?: {a:string;b:string}[]}>({});

  async function apply(autoPersistDerived = true) {
    const body = {
      dialogueId: props.dialogueId,
      ownerId: props.ownerId,
      ops: {
        add: [
          ...facts.map(f => ({ label: f.label, basePolarity: 'pos' as const, baseLocusPath: '0' })),
          ...rules.map(r => ({ label: r.label, basePolarity: 'neg' as const, baseLocusPath: '0' })),
        ],
      },
      autoPersistDerived,
    };
    const res = await fetch('/api/commitments/apply', {
      method: 'POST',
      headers: {'content-type':'application/json'},
      body: JSON.stringify(body),
    }).then(r => r.json());

    // Show derived facts & contradictions as badges
    const derived = (res?.derivedFacts ?? []) as {label:string}[];
    const contradictions = (res?.contradictions ?? []) as {a:string;b:string}[];
    setSummary({ derived, contradictions });

    // Merge newly-derived into the facts list (visual only)
    if (derived.length) {
      const derivedSet = new Set(derived.map(d => d.label));
      setFacts(prev => {
        const known = new Set(prev.map(p => p.label));
        const add = [...derivedSet].filter(x => !known.has(x)).map(x => ({ label: x, entitled: true, derived: true }));
        return [...prev, ...add];
      });
    }

    props.onChanged?.(res);
  }

  function addFact() {
    const v = label.trim();
    if (v) setFacts(prev => Array.from(new Map([...prev, {label: v}].map(o=>[o.label,o]))).values());
    setLabel('');
  }
  function addRule() {
    const v = label.trim();
    if (v) setRules(prev => Array.from(new Map([...prev, {label: v}].map(o=>[o.label,o]))).values());
    setLabel('');
  }

  React.useEffect(() => { (async () => {
    const res = await fetch(`/api/commitments/state?dialogueId=${encodeURIComponent(props.dialogueId)}&ownerId=${encodeURIComponent(props.ownerId)}`).then(r=>r.json());
    if (res?.ok) {
      setFacts((res.facts ?? []).map(toObj));
      setRules((res.rules ?? []).map((x: Item) => ({ label: typeof x === 'string' ? x : x.label })));
      // If the endpoint starts returning {label, entitled}, the UI will pick it up automatically.
    }
  })(); }, [props.dialogueId, props.ownerId]);

  return (
    <div className="border rounded p-3 space-y-2">
      <div className="flex items-center justify-between">
        <strong>Commitments — {props.ownerId}</strong>
      </div>

      <div className="flex gap-2">
        <input
          className="border rounded px-2 py-1 text-sm flex-1"
          placeholder="label (e.g., contract, delivered, r1, notPaid)"
          value={label}
          onChange={e=>setLabel(e.target.value)}
        />
        <button className="px-2 py-1 border rounded text-sm" onClick={addFact}>+ Fact</button>
        <button className="px-2 py-1 border rounded text-sm" onClick={addRule}>+ Rule</button>
      </div>

      {/* Summary badges from last Apply */}
      {(summary.derived?.length || summary.contradictions?.length) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {summary.derived?.map(d => (
            <span key={'der-'+d.label} className="px-2 py-0.5 border rounded bg-green-50">
              + derived: <b>{d.label}</b>
            </span>
          ))}
          {summary.contradictions?.map((c, i) => (
            <span key={'con-'+i} className="px-2 py-0.5 border rounded bg-rose-50 border-rose-300">
              ⟂ {c.a} vs {c.b}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <b>Facts</b>
          <ul className="mt-1 space-y-1">
            {facts.map((f,i)=>(
              <li key={f.label+'#'+i} className="flex items-center gap-2">
                <span className={`px-2 py-0.5 border rounded ${f.derived ? 'bg-green-50' : ''}`}>
                  {f.label}{' '}
                  <span title={f.entitled === false ? 'Entitlement suspended' : 'Entitled'}>
                    {f.entitled === false ? '⚠' : '✅'}
                  </span>
                </span>
                <button className="text-xs opacity-70" onClick={()=>setFacts(prev => prev.filter(x=>x.label!==f.label))}>×</button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <b>Rules</b>
          <ul className="mt-1 space-y-1">
            {rules.map((r,i)=>(
              <li key={r.label+'#'+i} className="flex items-center gap-2">
                <span className="px-2 py-0.5 border rounded">{r.label}</span>
                <button className="text-xs opacity-70" onClick={()=>setRules(prev => prev.filter(x=>x.label!==r.label))}>×</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="px-2 py-1 border rounded text-sm" onClick={()=>apply(true)}>Apply reasoning</button>
        <button className="px-2 py-1 border rounded text-sm" onClick={()=>apply(false)}>Apply (don’t persist derived)</button>
      </div>

      <div className="text-[11px] opacity-70">
        <span className="mr-3">Legend: ✅ entitled, ⚠ suspended, green = derived</span>
      </div>
    </div>
  );
}
