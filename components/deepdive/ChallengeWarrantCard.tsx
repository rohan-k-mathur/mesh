'use client';
import { useState } from 'react';
import { mutate } from 'swr';

type Props = {
  cardId: string;
  claimId: string;         // target claim (the card’s claim)
  deliberationId: string;
};

export function ChallengeWarrantCard({ cardId, claimId: targetClaimId, deliberationId }: Props) {
  const [counterText, setCounterText] = useState('');
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    try {
      setMsg(null);
      setPending(true);

      const body = { counterText: counterText.trim() };

      const res = await fetch(
        `/api/deliberations/${deliberationId}/cards/${cardId}/warrant/undercut`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? 'undercut_failed');

      // ✅ Revalidate Toulmin for the TARGET claim (the card’s claim), not the counter
      mutate(`/api/claims/${targetClaimId}/toulmin`);

      try {
           await fetch('/api/dialogue/move', {
             method: 'POST', headers: { 'content-type':'application/json' },
             body: JSON.stringify({
               deliberationId,
               targetType: 'claim',
               targetId: targetClaimId,
               kind: 'WHY',
               payload: { about: 'warrant', note: 'Counter-warrant posted' },
               autoCompile: true,
               autoStep: true,
           })
           });
           window.dispatchEvent(new CustomEvent('dialogue:moves:refresh'));
         } catch {}

      setMsg('Warrant challenged ✓');
      setCounterText('');
    } catch (e: any) {
      setMsg(e?.message ?? 'Error');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-2 border rounded p-2 bg-amber-50/40">
      <div className="text-xs font-semibold text-neutral-700">Challenge warrant</div>

      {/* Quick compose only */}
      <div className="mt-2">
        <textarea
          className="w-full text-xs border rounded px-2 py-1"
          rows={3}
          placeholder="Write a counter-warrant…"
          value={counterText}
          onChange={(e) => setCounterText(e.target.value)}
          aria-label="Counter-warrant text"
        />
        <div className="mt-2">
          <button
            type="button"
            className="text-xs px-2 py-1 rounded border disabled:opacity-50"
            onClick={submit}
            disabled={pending || !counterText.trim()}
            title="Promotes counter text to Claim then creates an UNDERCUTS edge"
          >
            {pending ? 'Posting…' : 'Undercut Warrant'}
          </button>
        </div>
      </div>

      {msg && <div className="text-[11px] text-neutral-600 mt-1">{msg}</div>}
    </div>
  );
}
