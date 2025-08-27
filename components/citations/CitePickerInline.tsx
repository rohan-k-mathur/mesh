'use client';
import { useState } from 'react';

export default function CitePickerInline({
  deliberationId,
  claimId: initialClaimId,
  argumentText, // used only if we need to promote
  onDone,
}: {
  deliberationId: string;
  claimId?: string;
  argumentText?: string;
  onDone?: () => void;
}) {
  const [url, setUrl] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setPending(true); setMsg(null);
    try {
      let claimId = initialClaimId;

      // Promote to claim if no claimId provided
      if (!claimId) {
        if (!argumentText?.trim()) throw new Error('Argument text required to promote');
        const r = await fetch('/api/claims', {
          method: 'POST',
          headers: {'content-type':'application/json'},
          body: JSON.stringify({ deliberationId, text: argumentText }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d?.error ?? 'promote failed');
        claimId = d?.claim?.id;
      }

      // Snapshot + excerpt hash
      const snap = await fetch('/api/snapshots', {
        method: 'POST',
        headers: {'content-type':'application/json'},
        body: JSON.stringify({ url, excerpt }),
      }).then(r=>r.json());
      if (snap.error) throw new Error(snap.error);

      // Create citation
      const cit = await fetch(`/api/claims/${claimId}/citations`, {
        method: 'POST',
        headers: {'content-type':'application/json'},
        body: JSON.stringify({
          uri: url,
          excerptHash: snap.excerptHash,
          snapshotKey: snap.snapshotKey,
        }),
      }).then(r=>r.json());
      if (cit.error) throw new Error(cit.error);

      setMsg('Citation attached ✓');
      onDone?.();
      setUrl(''); setExcerpt('');
    } catch (e: any) {
      setMsg(e?.message ?? 'Failed to cite');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-2 rounded border p-2 space-y-2 bg-white">
      <input
        className="w-full border rounded px-2 py-1 text-sm"
        placeholder="Source URL"
        value={url}
        onChange={(e)=>setUrl(e.target.value)}
      />
      <textarea
        className="w-full border rounded px-2 py-1 text-sm"
        rows={3}
        placeholder="Paste exact excerpt"
        value={excerpt}
        onChange={(e)=>setExcerpt(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <button
          className="text-xs px-2 py-1 rounded bg-amber-500 text-white disabled:opacity-50"
          disabled={pending || !url || !excerpt}
          onClick={run}
        >
          {pending ? 'Attaching…' : 'Attach citation'}
        </button>
        {msg && <div className="text-xs text-neutral-600">{msg}</div>}
      </div>
    </div>
  );
}
