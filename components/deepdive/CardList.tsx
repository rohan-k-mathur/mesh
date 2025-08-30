'use client';
import { useState } from 'react';
import SchemePicker from '@/components/cite/SchemePicker';
import CriticalQuestions from '@/components/claims/CriticalQuestions';
import ToulminMini from '@/components/deepdive/ToulminMini';
import useSWR, { mutate } from 'swr';

const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then(r => r.json());

function ChallengeWarrantCard({ cardId, deliberationId, currentUserId }: { cardId: string; deliberationId: string; currentUserId?: string }) {
  const [mode, setMode] = useState<'claimId'|'text'>('claimId');
  const [counterClaimId, setCounterClaimId] = useState('');
  const [counterText, setCounterText] = useState('');
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string| null>(null);

  async function promoteCounterTextToClaim(): Promise<string> {
    const res = await fetch('/api/claims', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        deliberationId,
        text: counterText.trim(),
      }),
    });
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(json.error ?? 'promote_failed');
    return json.claim?.id as string;
  }

  async function submit() {
    try {
      setMsg(null); setPending(true);
      let claimId = counterClaimId.trim();

      if (mode === 'text') {
        if (!counterText.trim()) throw new Error('Write a counter text or switch to “Use claim ID”.');
        claimId = await promoteCounterTextToClaim();
      } else {
        if (!claimId) throw new Error('Paste a counter Claim ID or switch to “Write text”.');
      }

      const res = await fetch(`/api/deliberations/${deliberationId}/cards/${cardId}/warrant/undercut`, {
        method: 'POST',
        headers: { 'content-type':'application/json' },
        body: JSON.stringify({ counterClaimId: claimId }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? 'undercut_failed');

      setMsg('Warrant challenged ✓');
      setCounterClaimId('');
      setCounterText('');
    } catch (e:any) {
      setMsg(e?.message ?? 'Error');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-2 border rounded p-2 bg-amber-50/40">
      <div className="text-xs font-semibold text-neutral-700">Challenge warrant</div>

      <div className="mt-1 flex gap-2 text-[11px]">
        <button
          className={`px-2 py-0.5 rounded border ${mode==='claimId'?'bg-white':'bg-transparent'}`}
          onClick={()=>setMode('claimId')}
        >Use claim ID</button>
        <button
          className={`px-2 py-0.5 rounded border ${mode==='text'?'bg-white':'bg-transparent'}`}
          onClick={()=>setMode('text')}
        >Write counter text</button>
      </div>

      {mode === 'claimId' && (
        <div className="flex items-center gap-2 mt-2">
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
      )}

      {mode === 'text' && (
        <div className="mt-2">
          <textarea
            className="w-full text-xs border rounded px-2 py-1"
            rows={3}
            placeholder="Write a short counter…"
            value={counterText}
            onChange={e=>setCounterText(e.target.value)}
          />
          <div className="mt-2">
            <button
              className="text-xs px-2 py-1 rounded border disabled:opacity-50"
              onClick={submit}
              disabled={pending}
              title="Promotes counter text to Claim then creates an UNDERCUTS edge"
            >
              {pending ? 'Posting…' : 'Promote & undercut'}
            </button>
          </div>
        </div>
      )}

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
           {/* Schemes & Critical Questions */}
           <div className="mt-2 rounded border border-slate-200 p-2 bg-white">
  <div className="flex items-center justify-start gap-8">
    <div className="text-sm font-semibold text-neutral-700">Schemes</div>
    {c.claimId && (
  <SchemePicker
    targetType="claim"
    targetId={c.claimId}
    createdById={c.authorId}
    onAttached={() => mutate(`/api/claims/${c.claimId}/toulmin`)}
  />
)}

  </div>

  {c.claimId && <ToulminMini claimId={c.claimId} />}

  <div className="mt-2">
    {c.claimId && (
      <CriticalQuestions
        targetType="claim"     // ✅ fix
        targetId={c.claimId}   // ✅ fix
        createdById={c.authorId}
        counterFromClaimId=""
      />
    )}
  </div>
</div>

        </div>
        
      ))}
     
    </div>
  );
}
