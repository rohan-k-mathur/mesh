// components/work/editors/OPThesesEditor.tsx
'use client';
import * as React from 'react';
import { slotAnchorId } from './slot-helpers';
import PromoteSlotButton from '../PromoteSlotButton';


type Op = {
  unrecognizability?: string | null;
  alternatives?: string[] | null;
};

export default function OPThesesEditor({ workId }: { workId: string }) {
  const [val, setVal] = React.useState<Op>({});
  const [altsInput, setAltsInput] = React.useState<string>('');
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);

  React.useEffect(() => {
    (async () => {
      const r = await fetch(`/api/works/${workId}/op`, { cache: 'no-store' });
      const j = await r.json();
      if (j?.op) {
        setVal(j.op);
        setAltsInput((j.op.alternatives ?? []).join('\n'));
      }
    })();
  }, [workId]);

  async function save() {
    setSaving(true);
    try {
      const payload: Op = {
        unrecognizability: val.unrecognizability ?? '',
        alternatives: altsInput.split('\n').map(s => s.trim()).filter(Boolean),
      };
      const r = await fetch(`/api/works/${workId}/op`, {
        method: 'PUT', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const txt = await r.text();
        alert(`Save OP failed: ${r.status} ${txt}`);
        return;
      }
    } finally { setSaving(false); }
  }

  return (
    <div className="rounded border p-2 space-y-2 bg-white/70">
      <div className="text-sm font-medium">OP Theses</div>

      <label id={slotAnchorId('OP.unrecognizability')} className="text-xs text-neutral-600">Unrecognizability (TOP)</label>
      <PromoteSlotButton workId={workId} slotKey="OP.unrecognizability" getText={() => val.unrecognizability ?? ''} />

      <textarea className="w-full border rounded px-2 py-1 text-sm" rows={2}
        placeholder="Why no adequate theoretical evidence is possible"
        value={val.unrecognizability ?? ''} onChange={e => setVal(v => ({ ...v, unrecognizability: e.target.value }))} />

      <label className="text-xs text-neutral-600">Alternatives (one per line)</label>
      <textarea className="w-full border rounded px-2 py-1 text-sm" rows={3}
        placeholder="Alt A\nAlt B"
        value={altsInput} onChange={e => setAltsInput(e.target.value)} />

      <div className="flex items-center gap-2">
        <button className="px-2 py-1 border rounded text-xs bg-white" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save OP'}
        </button>
        {savedAt && <span className="text-[11px] text-neutral-500">Saved</span>}
      </div>
    </div>
  );
}
