'use client';
import { useEffect, useState } from 'react';

export default function WhyThis({ selectionId }: { selectionId: string }) {
  const [reason, setReason] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const res = await fetch(`/api/amplification-events/by-origin/${selectionId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.event) { setReason(data.event.reason); setEventId(data.event.id); }
    };
    run();
  }, [selectionId]);

  if (!reason) return null;
  return (
    <span className="text-xs">
      Why this is here: {reason} {eventId && <a className="underline ml-1" href={`/ledger/${eventId}`} target="_blank">View ledger</a>}
    </span>
  );
}
