'use client';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

const fetcher=(u:string)=>fetch(u).then(r=>r.json());

// export default function WhyThis({ selectionId }: { selectionId: string }) {
//   const [reason, setReason] = useState<string | null>(null);
//   const [eventId, setEventId] = useState<string | null>(null);

//   useEffect(() => {
//     const run = async () => {
//       const res = await fetch(`/api/amplification-events/by-origin/${selectionId}`);
//       if (!res.ok) return;
//       const data = await res.json();
//       if (data?.event) { setReason(data.event.reason); setEventId(data.event.id); }
//     };
//     run();
//   }, [selectionId]);

//   if (!reason) return null;
//   return (
//     <span className="text-xs">
//       Why this is here: {reason} {eventId && <a className="underline ml-1" href={`/ledger/${eventId}`} target="_blank">View ledger</a>}
//     </span>
//   );
// }
export function WhyThis({ deliberationId, reason }: { deliberationId: string; reason: string }) {
    const { data } = useSWR(`/api/amplification-events?deliberationId=${deliberationId}`, fetcher);
    const events = data?.events ?? [];
    return (
      <div className="text-sm space-y-2">
        <div>{reason}</div>
        {events.length>0 && (
          <div className="text-xs text-slate-600">
            Recent signals: {events.map((e:any)=>e.eventType).join(' · ')}
          </div>
        )}
      </div>
    );
  }
