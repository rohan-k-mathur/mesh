'use client';
import useSWR from 'swr';

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export function WhyThis({ deliberationId, reason }: { deliberationId: string; reason: string }) {
  const { data } = useSWR(`/api/amplification-events?deliberationId=${deliberationId}`, fetcher);
  const events = (data?.events ?? []) as { id: string; eventType: string }[];

  return (
    <div className="text-xs space-y-1">
      <div>Why this is here: {reason}</div>
      {events.length > 0 && (
        <div className="text-[11px] text-slate-600">
          Recent signals: {events.map((e) => e.eventType).join(' · ')}
        </div>
      )}
    </div>
  );
}
