'use client';
import { useState } from 'react';

type Props =
  | {
      deliberationId?: string;
      target: { type: 'argument' | 'card'; id: string };
      label?: string;
      onClaim?: (claimId: string) => void;
    }
  | {
      deliberationId?: string;
      text: string;
      label?: string;
      onClaim?: (claimId: string) => void;
    };

export default function PromoteToClaimButton(props: Props) {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function promote() {
    setBusy(true);
    setToast(null);
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(props as any),
          text: (props as any).text, // safe for the text variant
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      const claimId = data?.claim?.id;
      if (claimId && 'onClaim' in props && props.onClaim) {
        props.onClaim(claimId);
      }
      setToast(data.created ? 'Claim created ✓' : 'Already promoted');
      // auto-dismiss toast after 2.5s
      setTimeout(() => setToast(null), 2500);
    } catch (e: any) {
      setToast(e.message ?? 'Error promoting');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        disabled={busy}
        onClick={promote}
        className="text-xs px-2 py-1 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
        title="Promote to Claim (thin CEG)"
      >
        {busy ? 'Promoting…' : (('label' in props && props.label) || 'Promote to Claim')}
      </button>
      {toast && (
        <span
          className={`text-[11px] ${
            toast.includes('✓') ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {toast}
        </span>
      )}
    </div>
  );
}
