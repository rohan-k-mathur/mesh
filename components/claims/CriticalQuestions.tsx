'use client';
import useSWR from 'swr';
import { useState } from 'react';

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function CriticalQuestions({
  targetType, targetId, createdById, counterFromClaimId,
}: {
  targetType: 'card'|'claim';
  targetId: string;
  createdById: string;
  counterFromClaimId?: string; // a claim you want to use as counter; for MVP pass it
}) {
  const { data, mutate } = useSWR(
    `/api/schemes/instances?targetType=${targetType}&targetId=${targetId}`,
    fetcher
  );
  const [posting, setPosting] = useState<string | null>(null);

  async function postCounter(cqId: string) {
    if (!counterFromClaimId) { alert('Provide a counter claim first.'); return; }
    setPosting(cqId);
    const res = await fetch(`/api/schemes/questions/${cqId}/counter`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ counterFromClaimId, createdById }),
    });
    setPosting(null);
    if (res.ok) mutate();
    else alert('Failed to post counter');
  }

  const instances = data?.instances ?? [];
  if (instances.length === 0) return null;

  return (
    <div className="mt-2">
      {instances.map((inst: any) => (
        <div key={inst.id} className="mb-2">
          <div className="text-xs text-slate-600">
            Scheme: {inst.scheme?.title ?? inst.schemeId}
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            {(inst.criticalQuestions ?? []).map((q: any) => (
              <span key={q.id} className="inline-flex items-center gap-2 text-xs border rounded px-2 py-1">
                {q.text}
                <span className="text-[10px] px-1 rounded bg-slate-100">{q.attackKind}</span>
                {q.status === 'open' && (
                  <button
                    className="underline"
                    onClick={() => postCounter(q.id)}
                    disabled={posting === q.id}
                    title="Create a counter edge of the indicated attack kind"
                  >
                    {posting === q.id ? 'Posting…' : 'Post counter'}
                  </button>
                )}
                {q.status !== 'open' && <span className="text-[10px] text-emerald-700">resolved</span>}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
