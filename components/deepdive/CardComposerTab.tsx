'use client';
import { useState } from 'react';

export default function CardComposerTab(props: {
  deliberationId: string;
  hostEmbed?: 'article'|'post'|'room_thread';
  hostId?: string;
  onSaved?: (id: string) => void;
}) {
  const [claim, setClaim] = useState('');
  const [reasons, setReasons] = useState<string[]>(['']);
  const [evidence, setEvidence] = useState<string[]>([]);
  const [obs, setObs] = useState<string[]>([]);
  const [counter, setCounter] = useState('');
  const [conf, setConf] = useState(0.5);
  const [status, setStatus] = useState<'draft'|'published'>('draft');
  const [busy, setBusy] = useState(false);
  const [warrant, setWarrant] = useState<string>('');
  const [quantifier, setQuantifier] = useState<"SOME"|"MANY"|"MOST"|"ALL"|undefined>();
const [modality, setModality] = useState<"COULD"|"LIKELY"|"NECESSARY"|undefined>();


  function update<T>(setter: (x: T) => void) {
    return (idx: number, arr: T[], val: T) => {
      const copy = [...arr]; (copy as any)[idx] = val; setter(copy as any);
    };
  }
  const updReasons = update(setReasons);
  const updEvidence = update(setEvidence);
  const updObs = update(setObs);

  async function save() {
    if (!claim.trim() || !reasons[0].trim()) return;
    setBusy(true);
    const res = await fetch(`/api/deliberations/${props.deliberationId}/cards`, {
      method: 'POST',
      headers: { 'content-type':'application/json' },
      body: JSON.stringify({
        status: 'published',           // 👈 ensure publish mode

        claimText: claim.trim(),
        reasonsText: reasons.filter(Boolean),
        evidenceLinks: evidence.filter(Boolean),
        anticipatedObjectionsText: obs.filter(Boolean),
        counterText: counter.trim() || undefined,
        quantifier,
        modality,
        confidence: conf,
        warrantText: warrant,

        hostEmbed: props.hostEmbed,
        hostId: props.hostId,
      }),
    }).then(r=>r.json());
    setBusy(false);
    if (res?.id && props.onSaved) props.onSaved(res.id);
  }

  return (
    <div className="space-y-3">
      <input value={claim} onChange={e=>setClaim(e.target.value)} placeholder="Claim" className="w-full border rounded px-2 py-1" />
      <div>
        <div className="text-sm font-medium mb-1">Reasons</div>
        {reasons.map((r,i)=>(
          <input key={i} value={r} onChange={e=>updReasons(i, reasons, e.target.value)} placeholder={`Reason ${i+1}`} className="w-full border rounded px-2 py-1 mb-1" />
        ))}
        <button className="text-xs text-neutral-700" onClick={()=>setReasons([...reasons, ''])}>+ add reason</button>
      </div>
      <div>
        <div className="text-sm font-medium mb-1">Evidence links (optional)</div>
        {evidence.map((r,i)=>(
          <input key={i} value={r} onChange={e=>updEvidence(i, evidence, e.target.value)} placeholder="https://…" className="w-full border rounded px-2 py-1 mb-1" />
        ))}
        <button className="text-xs text-neutral-700" onClick={()=>setEvidence([...evidence, ''])}>+ add link</button>
      </div>
      <div>
        <div className="text-sm font-medium mb-1">Anticipated objections (optional)</div>
        {obs.map((r,i)=>(
          <input key={i} value={r} onChange={e=>updObs(i, obs, e.target.value)} placeholder="Objection…" className="w-full border rounded px-2 py-1 mb-1" />
        ))}
        <button className="text-xs text-neutral-700" onClick={()=>setObs([...obs, ''])}>+ add objection</button>
      </div>
<label className="text-xs block mt-2">Warrant (rule that links reasons to claim)
  <textarea className="w-full text-sm border rounded px-2 py-1 mt-1"
            value={warrant} onChange={e=>setWarrant(e.target.value)}
            placeholder="e.g., If expert consensus holds in domain D, accept P unless rebutted" />
</label>
{/* Quantifier */}
<div className="flex items-center gap-2 text-sm">
  <span className="text-neutral-500">Quantifier:</span>
  {(["SOME", "MANY", "MOST", "ALL"] as const).map(q => (
    <button
      key={q}
      type="button"
      onClick={() => setQuantifier(q)}
      className={`px-2 py-1 border rounded ${quantifier===q ? "bg-neutral-200" : "bg-white"}`}
    >
      {q}
    </button>
  ))}
</div>

{/* Modality */}
<div className="flex items-center gap-2 text-sm">
  <span className="text-neutral-500">Modality:</span>
  {(["COULD", "LIKELY", "NECESSARY"] as const).map(m => (
    <button
      key={m}
      type="button"
      onClick={() => setModality(m)}
      className={`px-2 py-1 border rounded ${modality===m ? "bg-neutral-200" : "bg-white"}`}
    >
      {m}
    </button>
  ))}
</div>
      <input value={counter} onChange={e=>setCounter(e.target.value)} placeholder="Counter (optional)" className="w-full border rounded px-2 py-1" />
      <div className="flex items-center gap-3">
        <label className="text-sm">How sure:</label>
        <input type="range" min={0} max={1} step={0.05} value={conf} onChange={e=>setConf(parseFloat(e.target.value))} />
        <span className="text-sm">{Math.round(conf*100)}%</span>
        <select value={status} onChange={e=>setStatus(e.target.value as any)} className="border rounded px-2 py-1 text-sm ml-auto">
          <option value="draft">Draft</option>
          <option value="published">Publish</option>
        </select>
        <button onClick={save} disabled={busy} className="px-3 py-1.5 rounded bg-amber-500 text-white text-sm">{busy ? 'Saving…' : 'Save card'}</button>
      </div>
    </div>
  );
}
