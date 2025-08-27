'use client';
import useSWR from 'swr';
import { useState } from 'react';

const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then(r => r.json());

function ChallengeWarrantCard({ cardId, deliberationId }: { cardId: string; deliberationId: string }) {
    const [counterClaimId, setCounterClaimId] = useState('');
    const [pending, setPending] = useState(false);
    const [msg, setMsg] = useState<string| null>(null);
  
    async function submit() {
      if (!counterClaimId.trim()) { setMsg('Paste a counter Claim ID'); return; }
      setPending(true); setMsg(null);
      try {
        const res = await fetch(`/api/deliberations/${deliberationId}/cards/${cardId}/warrant/undercut`, {
          method: 'POST',
          headers: { 'content-type':'application/json' },
          body: JSON.stringify({ counterClaimId }),
        });
        const json = await res.json();
        if (!res.ok || json.error) throw new Error(json.error ?? 'Failed');
        setMsg('Warrant challenged ✓');
        setCounterClaimId('');
      } catch (e: any) {
        setMsg(e?.message ?? 'Error');
      } finally {
        setPending(false);
      }
    }
  
    return (
      <div className="mt-2 border rounded p-2 bg-amber-50/40">
        <div className="text-xs font-semibold text-neutral-700">Challenge warrant</div>
        <div className="flex items-center gap-2 mt-1">
          <input
            className="text-xs border rounded px-2 py-1 flex-1"
            placeholder="Paste counter Claim ID"
            value={counterClaimId}
            onChange={e=>setCounterClaimId(e.target.value)}
          />
          <button
            className="text-xs px-2 py-1 rounded border disabled:opacity-50"
            onClick={submit}
            disabled={pending}
            title="Creates an UNDERCUTS edge from your counter claim to this card's target claim"
          >
            {pending ? 'Posting…' : 'Undercut'}
          </button>
        </div>
        {msg && <div className="text-[11px] text-neutral-600 mt-1">{msg}</div>}
      </div>
    );
  }

export default function CardList({ deliberationId }: { deliberationId: string }) {
  const { data, isLoading } = useSWR(`/api/deliberations/${deliberationId}/cards?status=published`, fetcher);
  if (isLoading) return <div className="text-xs text-neutral-500">Loading cards…</div>;
  const cards = data?.cards ?? [];
  if (!cards.length) return <div className="text-xs text-neutral-500">No published cards yet.</div>;

  return (
    <div className="space-y-3">
      {cards.map((c: any) => (
        <div key={c.id} className="border rounded p-3 space-y-2">
          <div className="text-xs text-neutral-500">
            {new Date(c.createdAt).toLocaleString()} · by {c.authorId}
          </div>

          {/* Claim */}
          <div className="text-sm font-medium">{c.claimText}</div>

          {/* Reasons */}
          {Array.isArray(c.reasonsText) && c.reasonsText.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-neutral-700">Reasons</div>
              <ul className="list-disc ml-5 text-sm">
                {c.reasonsText.map((r: string, i: number) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}

          {/* Evidence */}
          {Array.isArray(c.evidenceLinks) && c.evidenceLinks.length > 0 && (
            <div className="text-xs text-neutral-600">
              <span className="font-semibold text-neutral-700">Evidence: </span>
              {c.evidenceLinks.map((u: string) => (
                <a key={u} href={u} className="underline mr-2" target="_blank" rel="noreferrer">
                  {u}
                </a>
              ))}
            </div>
          )}

          {/* Anticipated objections */}
          {Array.isArray(c.anticipatedObjectionsText) && c.anticipatedObjectionsText.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-neutral-700">Anticipated objections</div>
              <ul className="list-disc ml-5 text-sm">
                {c.anticipatedObjectionsText.map((o: string, i: number) => <li key={i}>{o}</li>)}
              </ul>
            </div>
          )}

          {/* Warrant (if present) */}
          {c.warrantText && (
            <div className="text-sm">
              <span className="text-xs font-semibold text-neutral-700">Warrant: </span>
              <span>{c.warrantText}</span>
            </div>
          )}
          {/* Challenge warrant */}
{c.warrantText && (
  <ChallengeWarrantCard
    cardId={c.id}
    deliberationId={c.deliberationId}
  />
)}

          {/* Counter (if present) */}
          {c.counterText && (
            <div className="text-sm">
              <span className="text-xs font-semibold text-neutral-700">Counter: </span>
              <span>{c.counterText}</span>
            </div>
          )}

          {/* Confidence */}
          {typeof c.confidence === 'number' && (
            <div className="text-[11px] text-neutral-500">
              How sure: {Math.round(c.confidence * 100)}%
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
