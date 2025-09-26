// components/dialogue/CommitmentsPopover.tsx
import useSWR from 'swr';

export function CommitmentsPopover({ deliberationId, participantId }: { deliberationId: string; participantId?: string }) {
  const qs = new URLSearchParams({ deliberationId, ...(participantId ? { participantId } : {}), activeOnly: 'true' }).toString();
  const { data } = useSWR<{ ok:boolean; items: Array<{ proposition:string; isRetracted:boolean; participantId:string }> }>(
    `/api/dialogue/commitments?${qs}`, (u) => fetch(u, { cache:'no-store' }).then(r => r.json())
  );

  const items = data?.items ?? [];
  return (
    <div className="rounded-xl border bg-white/80 p-3 panel-edge text-sm">
      <div className="font-medium mb-2">Commitments</div>
      {!items.length ? <div className="text-slate-500 text-sm">None yet.</div> :
        <ul className="list-disc pl-4 space-y-1">
          {items.map((c,i) => <li key={i}><span className="font-medium">{c.participantId}</span>: {c.proposition}</li>)}
        </ul>}
    </div>
  );
}
