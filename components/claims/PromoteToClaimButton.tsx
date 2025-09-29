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
           const ctrl = new AbortController();
     const t = setTimeout(() => ctrl.abort(), 12000);
          const forArgument = 'target' in props && props.target?.type === 'argument';
     const url = forArgument ? '/api/claims' : '/api/claims';
     const payload = forArgument
       ? { deliberationId: props.deliberationId, targetArgumentId: props.target.id, text: (props as any).text }
       : { deliberationId: props.deliberationId, target: (props as any).target, text: (props as any).text };
     const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload), signal: ctrl.signal });
        
       clearTimeout(t);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
     const claimId = data?.claim?.id ?? data?.claimId;
      // Let claim lists update themselves
 if (claimId) {
   window.dispatchEvent(new CustomEvent('claims:changed', { detail: { claimId } }));
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
        className="text-xs px-2 py-1 btnv2--ghost rounded"
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
