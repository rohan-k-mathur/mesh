'use client';
import * as React from 'react';

type Ih = {
  structure?: string | null;
  function?: string | null;
  objectivity?: string | null;
};

export default function IHThesesEditor({ workId }: { workId: string }) {
  const [val, setVal] = React.useState<Ih>({});
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);

  React.useEffect(() => {
    (async () => {
      const r = await fetch(`/api/works/${workId}/ih`, { cache: 'no-store' });
      const j = await r.json();
      if (j?.ih) setVal(j.ih);
    })();
  }, [workId]);

  async function save() {
    setSaving(true);
    try {
      const r = await fetch(`/api/works/${workId}/ih`, {
        method: 'PUT', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(val),
      });
      if (!r.ok) {
        const txt = await r.text();
        alert(`Save IH failed: ${r.status} ${txt}`);
        return;
      }
        } finally { setSaving(false); }
  }

  return (
    <div className="rounded border p-2 space-y-2 bg-white/70">
      <div className="text-sm font-medium">IH Theses</div>

      <label className="text-xs text-neutral-600">Structure (TIH)</label>
      <textarea className="w-full border rounded px-2 py-1 text-sm" rows={2}
        placeholder="Describe the structure of the practice/system"
        value={val.structure ?? ''} onChange={e => setVal(v => ({ ...v, structure: e.target.value }))} />

      <label className="text-xs text-neutral-600">Function (TIH)</label>
      <textarea className="w-full border rounded px-2 py-1 text-sm" rows={2}
        placeholder="What function/ends does it (should it) serve?"
        value={val.function ?? ''} onChange={e => setVal(v => ({ ...v, function: e.target.value }))} />

      <label className="text-xs text-neutral-600">Objectivity of reasons (TIH)</label>
      <textarea className="w-full border rounded px-2 py-1 text-sm" rows={2}
        placeholder="Justify that reasons are objective / intersubjectively warranted"
        value={val.objectivity ?? ''} onChange={e => setVal(v => ({ ...v, objectivity: e.target.value }))} />

      <div className="flex items-center gap-2">
        <button className="px-2 py-1 border rounded text-xs bg-white" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save IH'}
        </button>
        {savedAt && <span className="text-[11px] text-neutral-500">Saved</span>}
      </div>
    </div>
  );
}
