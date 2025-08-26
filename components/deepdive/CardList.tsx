'use client';
import useSWR from 'swr';

export function CardList({ deliberationId }: { deliberationId: string }) {
  const { data } = useSWR(`/api/deliberations/${deliberationId}/cards`, (u)=>fetch(u).then(r=>r.json()));
  const cards = data?.cards ?? [];
  return (
    <div className="space-y-3">
      {cards.map((c: any) => (
        <div key={c.id} className="border rounded p-3">
          <div className="text-sm text-neutral-600">Card</div>
          <div className="font-medium">{c.claimText}</div>
          <ul className="list-disc ml-5 text-sm mt-2">
            {c.reasonsText?.map((r: string, i: number)=> <li key={i}>{r}</li>)}
          </ul>
          {c.evidenceLinks?.length ? (
            <div className="mt-2 text-sm">
              Evidence: {c.evidenceLinks.map((u: string, i: number)=> <a key={i} href={u} className="underline mr-2" target="_blank">{new URL(u).hostname}</a>)}
            </div>
          ) : null}
          {c.counterText ? <div className="mt-2 text-sm">Counter: {c.counterText}</div> : null}
        </div>
      ))}
    </div>
  );
}
