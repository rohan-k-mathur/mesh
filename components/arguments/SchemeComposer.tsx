// components/arguments/SchemeComposer.tsx
import React from 'react';

type Scheme = {
  id: string; key: string; name: string;
  slotHints?: { premises?: { role: string; label: string }[] } | null;
  cqs?: { cqKey: string; text: string; attackType: 'REBUTS'|'UNDERCUTS'|'UNDERMINES'; targetScope: 'conclusion'|'inference'|'premise'; }[];
};

type CQItem = Scheme['cqs'][number] & { status: 'open'|'answered' };

type Props = {
  deliberationId: string;
  authorId: string;
  // The claim this RA will support — minimally its id; if you have a picker, pass that result in.
  conclusionClaim: { id: string; text?: string };
  defaultSchemeKey?: string;
  onCreated?: (argumentId: string) => void;
};

export function SchemeComposer(props: Props) {
  const { deliberationId, authorId, conclusionClaim, defaultSchemeKey, onCreated } = props;
  const [schemes, setSchemes] = React.useState<Scheme[]>([]);
  const [schemeKey, setSchemeKey] = React.useState<string>(defaultSchemeKey || '');
  const [premiseIds, setPremiseIds] = React.useState<string[]>([]);
  const [creating, setCreating] = React.useState(false);
  const [argumentId, setArgumentId] = React.useState<string | null>(null);
  const [cqs, setCqs] = React.useState<CQItem[]>([]);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let abort = new AbortController();
    fetch('/api/schemes', { signal: abort.signal })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(d => setSchemes(d.items ?? d ?? []))
      .catch(() => void 0);
    return () => abort.abort();
  }, []);

  const selected = schemes.find(s => s.key === schemeKey) || null;

  async function createArgument() {
    setErr(null);
    if (!premiseIds.length) { setErr('Add at least one premise.'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/arguments', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          deliberationId,
          authorId,
          conclusionClaimId: conclusionClaim.id,
          premiseClaimIds: premiseIds,
          schemeId: selected?.id ?? null,
          implicitWarrant: null
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to create argument');
      setArgumentId(json.argumentId || json.argument?.id);
      onCreated?.(json.argumentId || json.argument?.id);
      // Load CQs for live chips
      if (json.argumentId) {
        const r = await fetch(`/api/arguments/${json.argumentId}/cqs`);
        const q = await r.json();
        setCqs((q.items ?? []).map((x: any) => ({ ...x, status: x.status || 'open' })));
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function askCQ(cqKey: string) {
    if (!argumentId) return;
    await fetch(`/api/arguments/${argumentId}/cqs/${encodeURIComponent(cqKey)}/ask`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ authorId, deliberationId })
    });
    setCqs(cs => cs.map(c => c.cqKey === cqKey ? { ...c, status: 'open' } : c));
  }

  return (
    <div className="scheme-composer">
      <div className="row">
        <div className="cell">
          <label className="lbl">Scheme</label>
          <select className="sel" value={schemeKey} onChange={(e)=>setSchemeKey(e.target.value)}>
            <option value="">(choose a scheme)</option>
            {schemes.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
          </select>
          {selected?.slotHints?.premises?.length ? (
            <div className="hint">
              {selected.slotHints.premises.map(p => (
                <span key={p.role} className="chip hint">{p.label}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="row">
        <div className="cell">
          <label className="lbl">Conclusion</label>
          <div className="box">{conclusionClaim.text ?? conclusionClaim.id}</div>
        </div>
      </div>

      <div className="row">
        <div className="cell">
          <label className="lbl">Premises (claim IDs)</label>
          <PremiseEditor value={premiseIds} onChange={setPremiseIds} />
          <div className="subtle">Use your real ClaimPicker here; this version accepts IDs for speed.</div>
        </div>
      </div>

      <div className="row actions">
        <button className="btn primary" disabled={creating || !schemeKey || !premiseIds.length} onClick={createArgument}>
          {creating ? 'Creating…' : 'Create Argument'}
        </button>
        {err && <span className="err">{err}</span>}
      </div>

      {argumentId && !!cqs.length && (
        <div className="cq-panel">
          <div className="lbl">Critical Questions</div>
          <div className="chips">
            {cqs.map(c => (
              <button
                key={c.cqKey}
                className={`chip cq ${c.status === 'answered' ? 'ok' : 'warn'}`}
                title={`${c.attackType} → ${c.targetScope}`}
                onClick={() => askCQ(c.cqKey)}
              >
                {c.text}{c.status === 'answered' ? ' ✓' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .scheme-composer { border:1px solid #e5e7eb; border-radius:10px; padding:16px; background:#fff }
        .row { display:flex; gap:16px; margin-bottom:12px; }
        .cell { flex:1; }
        .lbl { font-size:12px; font-weight:600; color:#374151; display:block; margin-bottom:6px; text-transform:uppercase; letter-spacing:.02em }
        .sel, .box, .input { width:100%; border:1px solid #d1d5db; border-radius:8px; padding:8px 10px; }
        .box { background:#f9fafb }
        .hint { margin-top:6px }
        .chip.hint { margin-right:6px; background:#eef2ff; color:#4338ca; border-radius:999px; padding:2px 8px; font-size:12px; }
        .actions { align-items:center }
        .btn { border:1px solid #d1d5db; border-radius:8px; padding:8px 12px; background:#f3f4f6; }
        .btn.primary { background:#111827; color:white; border-color:#111827; }
        .err { color:#b91c1c; margin-left:10px; font-size:13px; }
        .cq-panel { border-top:1px dashed #e5e7eb; padding-top:12px; margin-top:8px; }
        .chips { display:flex; flex-wrap:wrap; gap:8px; }
        .chip.cq { border:1px solid #e5e7eb; border-radius:999px; padding:4px 10px; background:#fff; font-size:13px; }
        .chip.cq.warn { background:#fff7ed; border-color:#fed7aa; }
        .chip.cq.ok { background:#ecfdf5; border-color:#a7f3d0; }
        .subtle { color:#6b7280; font-size:12px; margin-top:6px; }
      `}</style>
    </div>
  );
}

function PremiseEditor(props: { value: string[]; onChange: (v:string[])=>void }) {
  const [text, setText] = React.useState(props.value.join(','));
  React.useEffect(() => setText(props.value.join(',')), [props.value]);
  return (
    <input
      className="input"
      placeholder="premise-claim-id-1, premise-claim-id-2, …"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        props.onChange(
          e.target.value.split(',').map(s => s.trim()).filter(Boolean)
        );
      }}
    />
  );
}
