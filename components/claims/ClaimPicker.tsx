// components/claims/ClaimPicker.tsx
'use client';
import * as React from 'react';
import { searchClaims, createClaim, ClaimLite } from '@/lib/client/aifApi';

type Props = {
  deliberationId: string;
  authorId: string;
  label?: string;
  placeholder?: string;
  onPick: (c: ClaimLite) => void;
  allowCreate?: boolean;
};

export function ClaimPicker({ deliberationId, authorId, label = 'Claim', placeholder = 'Search or enter new…', onPick, allowCreate = true }: Props) {
  const [q, setQ] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [items, setItems] = React.useState<ClaimLite[]>([]);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    const run = async () => {
      if (!q.trim()) { setItems([]); return; }
      try { const r = await searchClaims(q, deliberationId); if (alive) setItems(r); } catch { /* ignore */ }
    };
    const id = setTimeout(run, 180);
    return () => { alive = false; clearTimeout(id); };
  }, [q, deliberationId]);

  async function createNew() {
    const text = q.trim();
    if (!text) return;
    setBusy(true); setErr(null);
    try {
      const id = await createClaim({ deliberationId, authorId, text });
      onPick({ id, text });
      setQ('');
      setItems([]);
    } catch (e: any) { setErr(e.message || 'Failed'); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-1">
      {label && <div className="text-xs text-neutral-600">{label}</div>}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="w-full border rounded px-2 py-1"
      />
      {err && <div className="text-[11px] text-rose-700">{err}</div>}
      <div className="rounded border bg-white divide-y max-h-44 overflow-auto">
        {items.map(x => (
          <button
            key={x.id}
            className="w-full text-left px-2 py-1 text-sm hover:bg-slate-50"
            onClick={() => onPick(x)}
            title={x.text}
          >
            {x.text}
          </button>
        ))}
        {allowCreate && q.trim() && (
          <button
            disabled={busy}
            className="w-full text-left px-2 py-1 text-sm bg-emerald-50 hover:bg-emerald-100"
            onClick={createNew}
            title="Create and select"
          >
            + Create “{q.trim()}”
          </button>
        )}
      </div>
    </div>
  );
}
