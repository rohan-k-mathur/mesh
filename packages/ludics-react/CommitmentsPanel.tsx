// components/ludics/CommitmentsPanel.tsx
'use client';
import * as React from 'react';

type FactRow = { label: string; entitled?: boolean; derived?: boolean; locusPath?: string };
type RuleRow = { label: string; locusPath?: string };

const toFact = (x: string | FactRow): FactRow =>
  typeof x === 'string' ? { label: x, entitled: true } : x;

export function CommitmentsPanel({
  dialogueId, ownerId, onChanged,
}: {
  dialogueId: string;
  ownerId: string; // 'Proponent' | 'Opponent'
  onChanged?: (summary: any) => void;
}) {
  const [facts, setFacts] = React.useState<FactRow[]>([]);
  const [rules, setRules] = React.useState<RuleRow[]>([]);
  const [label, setLabel] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [summary, setSummary] = React.useState<{derived?: {label:string}[]; contradictions?: {a:string;b:string}[]}>({});
  const [persistDerived, setPersistDerived] = React.useState(true);
  const [filter, setFilter] = React.useState('');

  const load = React.useCallback(async () => {
    const res = await fetch(
      `/api/commitments/state?dialogueId=${encodeURIComponent(dialogueId)}&ownerId=${encodeURIComponent(ownerId)}`,
      { cache:'no-store' }
    ).then(r=>r.json()).catch(()=>null);
    if (res?.ok) {
      setFacts((res.facts ?? []).map(toFact));
      setRules((res.rules ?? []) as RuleRow[]);
    }
  }, [dialogueId, ownerId]);

  React.useEffect(() => { load(); }, [load]);

  // event bus refresh (optional)
  React.useEffect(() => {
    const h = (e: any) => {
      const d = e?.detail;
      if (d?.dialogueId === dialogueId && d?.ownerId === ownerId) load();
    };
    window.addEventListener('dialogue:cs:refresh', h as any);
    return () => window.removeEventListener('dialogue:cs:refresh', h as any);
  }, [dialogueId, ownerId, load]);

  async function apply() {
    setBusy(true);
    try {
      const body = {
        dialogueId, ownerId, autoPersistDerived: persistDerived,
        ops: {
          add: [
            ...facts.map(f => ({ label: f.label, basePolarity: 'pos' as const, baseLocusPath: f.locusPath ?? '0', derived: !!f.derived })),
            ...rules.map(r => ({ label: r.label, basePolarity: 'neg' as const, baseLocusPath: r.locusPath ?? '0' })),
          ],
        },
      };
      const res = await fetch('/api/commitments/apply', {
        method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(body),
      }).then(r => r.json());

      const derived = (res?.derivedFacts ?? []) as {label:string}[];
      const contradictions = (res?.contradictions ?? []) as {a:string;b:string}[];

      setSummary({ derived, contradictions });
  if ((contradictions ?? []).length) {
    fetch('/api/eristic/marks', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        deliberationId,
        marks: contradictions.map((c:any) => ({
          targetType: 'commitments',
          targetId: ownerId,
          tactic: 'CS_CONTRADICTION',
          detector: 'commitments',
          strength: 1
        }))
      })
    }).catch(()=>{});
}
      onChanged?.(res);

      await load();
      // toast could use res.code === 'CS_CONTRADICTION'
    } finally { setBusy(false); }
  }

  const addFact = async () => {
    const v = label.trim();
    if (!v) return;
    setLabel('');
    setBusy(true);
    try {
      await fetch('/api/commitments/apply', {
        method:'POST', headers:{'content-type':'application/json'},
        body: JSON.stringify({
          dialogueId, ownerId, autoPersistDerived: false,
          ops: { add: [{ label: v, basePolarity: 'pos' as const, baseLocusPath: '0' }] }
        }),
      });
      await load();
    } finally { setBusy(false); }
  };

  const addRule = async () => {
    const v = label.trim();
    if (!v) return;
    setLabel('');
    setBusy(true);
    try {
      await fetch('/api/commitments/apply', {
        method:'POST', headers:{'content-type':'application/json'},
        body: JSON.stringify({
          dialogueId, ownerId, autoPersistDerived: false,
          ops: { add: [{ label: v, basePolarity: 'neg' as const, baseLocusPath: '0' }] }
        }),
      });
      await load();
    } finally { setBusy(false); }
  };

  const erase = async (label: string) => {
    setBusy(true);
    try {
      await fetch('/api/commitments/apply', {
        method:'POST', headers:{'content-type':'application/json'},
        body: JSON.stringify({
          dialogueId, ownerId, autoPersistDerived: false,
          ops: { erase: [{ byLabel: label, byLocusPath: '0' }] }
        }),
      });
      await load();
    } finally { setBusy(false); }
  };

  const toggleEntitled = async (f: FactRow) => {
    setBusy(true);
    try {
      await fetch('/api/commitments/entitlement', {
        method:'POST', headers:{'content-type':'application/json'},
        body: JSON.stringify({
          dialogueId, ownerId, label: f.label, entitled: !(f.entitled !== false),
        }),
      });
      await load();
    } finally { setBusy(false); }
  };
   function parseRule(s: string) {
       const raw = (s ?? '').trim();
       const sep = raw.includes('->') ? '->' : (raw.includes('=>') ? '=>' : null);
       if (!sep) return null;
       const [lhs, rhs] = raw.split(sep);
       const ifAll = (lhs ?? '').split(/[,&]/).map(x=>x.trim()).filter(Boolean);
       const then  = (rhs ?? '').trim();
       if (!ifAll.length || !then) return null;
       return { ifAll, then };
    }
  const clearDerived = async () => {
    // remove all derived facts by label
    setBusy(true);
    try {
      const derived = facts.filter(f=>f.derived).map(f=>f.label);
      if (!derived.length) return;
      await fetch('/api/commitments/apply', {
        method:'POST', headers:{'content-type':'application/json'},
        body: JSON.stringify({
          dialogueId, ownerId, autoPersistDerived: false,
          ops: { erase: derived.map(l => ({ byLabel: l, byLocusPath: '0' })) }
        }),
      });
      await load();
    } finally { setBusy(false); }
  };

  const q = (filter ?? '').toLowerCase();
   const filteredFacts = (facts ?? []).filter(f => (f?.label ?? '').toLowerCase().includes(q));
    const filteredRules = (rules ?? []).filter(r => (r?.label ?? '').toLowerCase().includes(q));

  return (
    <div className="rounded-lg border border-slate-200 bg-white/70 p-3 space-y-2 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <strong className="text-sm">Commitments — {ownerId}</strong>
          <span className="text-[11px] px-1.5 py-0.5 rounded border bg-slate-50">facts {facts.length}</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded border bg-slate-50">rules {rules.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] inline-flex items-center gap-1">
            <input type="checkbox" checked={persistDerived} onChange={e=>setPersistDerived(e.target.checked)} />
            persist derived
          </label>
          {busy ? <span className="text-[11px] opacity-70">Working…</span> : null}
        </div>
      </div>

      <div className="flex gap-2">
        <input
          className="discussionfield rounded-md border px-2 py-1 text-sm flex-1"
          placeholder='Add a fact or a rule…  e.g. fact: congestion_high   •   rule: congestion_high & revenue_earmarked_transit -> net_public_benefit'
          value={label}
          onChange={e=>setLabel(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              // heuristics: if looks like a rule, addRule else addFact
              /[-=]>\s|,|&/.test(label) ? addRule() : addFact();
            }
          }}
        />
        
          {/[=-]>\s|,|&/.test(label) && (
    <div className="text-[11px] mt-1 px-2 py-1 rounded border bg-slate-50">
      {parseRule(label)
        ? <>Rule looks good: <code>{label}</code></>
        : <span className="text-rose-700">Malformed rule — try “A &amp; B -&gt; C”.</span>}
    </div>
 )}
        <button className="px-2 py-1 btnv2 rounded-lg text-xs" onClick={addFact} disabled={busy}>+ Fact</button>
          <button
    className="px-2 py-1 btnv2 rounded-lg text-xs"
    onClick={addRule}
    disabled={busy || (/[=-]>\s|,|&/.test(label) && !parseRule(label))}
  >+ Rule</button>
      </div>

      <details className="rounded border bg-slate-200 px-2 py-1 text-[12px]">
  <summary className="cursor-pointer select-none">How to write rules</summary>
  <div className="mt-1 space-y-2 leading-relaxed">
    <div>
      <b>Facts</b> are single labels you believe are true now, e.g.
      <code className="mx-1">contract</code>,
      <code className="mx-1">delivered</code>,
      <code className="mx-1">to.pay</code>.
    </div>
    <div>
      <b>Rules</b> are written as <i>IF … THEN …</i>:
      <div className="mt-1 rounded bg-white/70 p-2 text-[11px]">
        <div><b>Format:</b> <code>A &amp; B -&gt; C</code> or <code>A,B =&gt; C</code></div>
        <div className="mt-1"><b>Negation:</b> <code>not X</code> or <code>¬X</code></div>
      </div>
    </div>
    <div>
      <b>Examples</b>
      <ul className="mt-1 list-disc pl-5">
        <li><code>contract &amp; delivered -&gt; to.pay</code></li>
        <li><code>charge_on_access &amp; not equity_program_in_place -&gt; regressive_impact</code></li>
        <li><code>regressive_impact -&gt; not net_public_benefit</code></li>
      </ul>
    </div>
    <div className="text-[11px] opacity-80">
      Contradiction is flagged when <code>X</code> and <code>not X</code> both hold.
      Only <b>entitled</b> items are used during inference (you can suspend a fact at any time).
    </div>
  </div>
</details>

      {(summary.derived?.length || summary.contradictions?.length) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {summary.derived?.map(d => (
            <span key={'der-'+d.label} className="px-2 py-0.5 border rounded bg-emerald-50 border-emerald-200 text-emerald-700">
              + derived: <b>{d.label}</b>
            </span>
          ))}
          {summary.contradictions?.map((c, i) => (
            <span key={'con-'+i} className="px-2 py-0.5 border rounded bg-rose-50 border-rose-300 text-rose-700">
              ⟂ {c.a} vs {c.b}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          className="border rounded minorfield px-2 py-1 text-[12px] flex-1"
          placeholder="Filter…"
          value={filter}
          onChange={e=>setFilter(e.target.value)}
        />
        <button className="text-[11px] px-2 py-1 rounded btnv2--ghost bg-white" onClick={load} disabled={busy}>Reload</button>
        <button className="text-[11px] px-2 py-1 rounded btnv2--ghost bg-white" onClick={clearDerived} disabled={busy}>Clear derived</button>
        <button className="px-2 py-1 btnv2 rounded-lg text-xs" onClick={apply} disabled={busy}>Infer</button>
      </div>

      <div className="grid md:grid-cols-2 gap-3 text-sm">
        <div>
          <b>Facts</b>
          <ul className="mt-1 space-y-1">
            {filteredFacts.map((f) => (
              <li key={'f:'+f.label} className="flex items-center gap-2">
                <span className={[
                  'px-2 py-0.5 rounded border',
                  f.derived ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white'
                ].join(' ')}>
                  {f.label}
                  {f.locusPath ? (
     <button
       className="ml-1 text-[11px] underline decoration-dotted text-sky-700"
       title="Focus this locus"
       onClick={() => {
         window.dispatchEvent(new CustomEvent('ludics:focus', {
           detail: { deliberationId: dialogueId, phase: 'focus-P' }
         }));
         // also nudge LociTree’s onFocusPathChange via the event; it already listens
         window.dispatchEvent(new CustomEvent('dialogue:moves:refresh'));
       }}
     >
       @{f.locusPath}
     </button>
  ) : null}
                </span>
                <button
                  className="text-[11px] px-1 py-0.5 rounded border bg-white"
                  title={f.entitled === false ? 'Entitlement suspended' : 'Entitled'}
                  onClick={() => toggleEntitled(f)}
                >
                  {f.entitled === false ? '⚠ suspend' : '✅ entitled'}
                </button>
                <button className="text-xs opacity-70" onClick={() => erase(f.label)} title="Remove">×</button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <b>Rules</b>
          <ul className="mt-1 space-y-1">
            {filteredRules.map((r) => (
              <li key={'r:'+r.label} className="flex items-center gap-2">
                <span className="px-2 py-0.5 border rounded bg-white">{r.label}{r.locusPath ? <span className="ml-1 text-[11px] opacity-60">@{r.locusPath}</span> : null}</span>
                <button className="text-xs opacity-70" onClick={() => erase(r.label)} title="Remove">×</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="text-[11px] opacity-70">
        <span className="mr-3">Legend: ✅ entitled, ⚠ suspended, green = derived</span>
      </div>
    </div>
  );
}
