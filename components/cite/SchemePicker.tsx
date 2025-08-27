'use client';
import { useState } from 'react';

export default function SchemePicker({
  targetType, targetId, createdById, onAttached,
}: {
  targetType: 'card'|'claim';
  targetId: string;
  createdById: string;
  onAttached?: (instance: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [expertName, setExpertName] = useState('');
  const [expertField, setExpertField] = useState('');
  const [statement, setStatement] = useState('');
  const [sourceUri, setSourceUri] = useState('');
  const [busy, setBusy] = useState(false);

  async function attach() {
    setBusy(true);
    const data = {
      expert: { name: expertName, field: expertField },
      statement, sourceUri,
    };
    const res = await fetch('/api/schemes/instances', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType, targetId, data, createdById }),
    });
    const json = await res.json();
    setBusy(false);
    if (res.ok) { onAttached?.(json); setOpen(false); }
    else alert(json.error ?? 'Failed');
  }

  return (
    <div className="inline-block">
      <button className="text-xs px-2 py-1 border rounded" onClick={() => setOpen(true)}>
        Attach “Expert Opinion”
      </button>
      {open && (
        <div className="mt-2 border rounded p-3 space-y-2 bg-white">
          <div className="text-xs font-medium">Expert Opinion</div>
          <input value={expertName} onChange={e=>setExpertName(e.target.value)} placeholder="Expert name"
                 className="w-full text-sm border rounded px-2 py-1" />
          <input value={expertField} onChange={e=>setExpertField(e.target.value)} placeholder="Domain/field"
                 className="w-full text-sm border rounded px-2 py-1" />
          <input value={statement} onChange={e=>setStatement(e.target.value)} placeholder="Statement asserted"
                 className="w-full text-sm border rounded px-2 py-1" />
          <input value={sourceUri} onChange={e=>setSourceUri(e.target.value)} placeholder="Source URL (optional)"
                 className="w-full text-sm border rounded px-2 py-1" />
          <div className="flex gap-2">
            <button disabled={busy} onClick={attach} className="text-xs px-2 py-1 bg-emerald-600 text-white rounded">
              {busy ? 'Attaching…' : 'Attach'}
            </button>
            <button className="text-xs px-2 py-1 border rounded" onClick={()=>setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
