'use client';
import { useState } from 'react';

type Props =
  | { deliberationId?: string; target: { type: 'argument' | 'card'; id: string }; label?: string }
  | { deliberationId?: string; text: string; label?: string };

export default function PromoteToClaimButton(props: Props) {
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function promote() {
    setBusy(true);
    setOk(null); setErr(null);
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(props as any), text: (props as any).text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setOk(data.created ? 'Claim created' : 'Already a claim');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      disabled={busy}
      onClick={promote}
      className="text-xs px-2 py-1 rounded border border-slate-300 hover:bg-slate-50"
      title="Promote to Claim (thin CEG)"
    >
      {busy ? 'Promoting…' : (('label' in props && props.label) || 'Promote to Claim')}
      {ok && <span className="ml-2 text-emerald-600">{ok}</span>}
      {err && <span className="ml-2 text-rose-600">{err}</span>}
    </button>
  );
}
