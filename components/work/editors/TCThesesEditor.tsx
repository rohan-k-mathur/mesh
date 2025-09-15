'use client';
import * as React from 'react';

type Tc = {
  instrumentFunction?: string | null;
  explanation?: string | null;
  applications?: string[] | null;
};

export default function TCThesesEditor({ workId }: { workId: string }) {
  const [val, setVal] = React.useState<Tc>({});
  const [appsInput, setAppsInput] = React.useState<string>('');
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);

  React.useEffect(() => {
    (async () => {
      const r = await fetch(`/api/works/${workId}/tc`, { cache: 'no-store' });
      if (!r.ok) {
        const txt = await r.text();
        alert(`Save TC failed: ${r.status} ${txt}`);
        return;
      }
      setSavedAt(Date.now());
      const j = await r.json();
      if (j?.tc) {
        setVal(j.tc);
        setAppsInput((j.tc.applications ?? []).join('\n'));
      }
    })();
  }, [workId]);

  async function save() {
    setSaving(true);
    try {
      const payload: Tc = {
        instrumentFunction: val.instrumentFunction ?? '',
        explanation: val.explanation ?? '',
        applications: appsInput
          .split('\n')
          .map(s => s.trim()).filter(Boolean),
      };
      const r = await fetch(`/api/works/${workId}/tc`, {
        method: 'PUT', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const txt = await r.text();
        alert(`Save TC failed: ${r.status} ${txt}`);
        return;
      }
    } finally { setSaving(false); }
  }

  return (
    <div className="rounded border p-2 space-y-2 bg-white/70">
      <div className="text-sm font-medium">TC Theses</div>

      <label className="text-xs text-neutral-600">Instrument function (TTC)</label>
      <textarea className="w-full border rounded px-2 py-1 text-sm" rows={2}
        placeholder="What function does the instrument perform?"
        value={val.instrumentFunction ?? ''} onChange={e => setVal(v => ({ ...v, instrumentFunction: e.target.value }))} />

      <label className="text-xs text-neutral-600">Explanation of functioning (TTC)</label>
      <textarea className="w-full border rounded px-2 py-1 text-sm" rows={2}
        placeholder="How does it work? (algorithm/causal chain)"
        value={val.explanation ?? ''} onChange={e => setVal(v => ({ ...v, explanation: e.target.value }))} />

      <label className="text-xs text-neutral-600">Applications (one per line)</label>
      <textarea className="w-full border rounded px-2 py-1 text-sm" rows={3}
        placeholder="Context A\nContext B"
        value={appsInput} onChange={e => setAppsInput(e.target.value)} />

      <div className="flex items-center gap-2">
        <button className="px-2 py-1 border rounded text-xs bg-white" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save TC'}
        </button>
        {savedAt && <span className="text-[11px] text-neutral-500">Saved</span>}
      </div>
    </div>
  );
}
