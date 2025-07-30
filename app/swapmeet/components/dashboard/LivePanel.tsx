// components/dashboard/LivePanel.tsx
'use client';
import { useEffect, useState } from 'react';

export function LivePanel({ stallId }: { stallId: string }) {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const es = new EventSource(`/api/stalls/${stallId}/events`);
    es.onmessage = (e) => {
      setEvents((prev) => [...prev, JSON.parse(e.data)]);
    };
    return () => es.close();
  }, [stallId]);

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Live events</h2>
      <ul className="space-y-2">
        {events.map((ev, i) => (
          <li key={i} className="border p-2 rounded">
            <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(ev, null, 2)}</pre>
          </li>
        ))}
      </ul>
    </>
  );
}
