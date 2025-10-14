// components/work/editors/DNThesesEditor.tsx
'use client';
import * as React from 'react';
import { slotAnchorId } from './slot-helpers';
import PromoteSlotButton from '../PromoteSlotButton';

type Dn = {
  explanandum?: string | null;
  nomological?: string | null;
  ceterisParibus?: string | null;
};

export default function DNThesesEditor({ workId }: { workId: string }) {
  const [val, setVal] = React.useState<Dn>({});
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);

  React.useEffect(() => {
    (async () => {
      const r = await fetch(`/api/works/${workId}/dn`, { cache: 'no-store' });
      const j = await r.json();
      if (j?.dn) setVal(j.dn);
    })();
  }, [workId]);

  async function save() {
    setSaving(true);
    try {
      const r = await fetch(`/api/works/${workId}/dn`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(val),
      });
      if (!r.ok) {
        const txt = await r.text();
        alert(`Save DN failed: ${r.status} ${txt}`);
        return;
      }
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="rounded border p-2 space-y-2 bg-white/70">
      <div className="text-sm font-medium">DN Theses</div>

      <label id={slotAnchorId('DN.explanandum')} className="text-xs text-neutral-600">Explanandum (TDN)</label>
      <PromoteSlotButton workId={workId} slotKey="DN.explanandum" getText={() => val.explanandum ?? ''} />

      <textarea className="w-full border rounded px-2 py-1 text-sm" rows={2}
        placeholder="What phenomenon is described/explained?"
        value={val.explanandum ?? ''}
        onChange={e => setVal(v => ({ ...v, explanandum: e.target.value }))} />

      <label className="text-xs text-neutral-600">Nomological laws / regularities (TDN)</label>
      <textarea className="w-full border rounded px-2 py-1 text-sm" rows={3}
        placeholder="Key laws/regularities (comma or line separated)"
        value={val.nomological ?? ''}
        onChange={e => setVal(v => ({ ...v, nomological: e.target.value }))} />

      <label className="text-xs text-neutral-600">Ceteris paribus (optional)</label>
      <input className="w-full border rounded px-2 py-1 text-sm"
        placeholder="Boundary conditions, CP clauses"
        value={val.ceterisParibus ?? ''}
        onChange={e => setVal(v => ({ ...v, ceterisParibus: e.target.value }))} />

      <div className="flex items-center gap-2">
        <button className="px-2 py-1 border rounded text-xs bg-white" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save DN'}
        </button>
        {savedAt && <span className="text-[11px] text-neutral-500">Saved</span>}
      </div>
    </div>
  );
}
