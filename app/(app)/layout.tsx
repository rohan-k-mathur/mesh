'use client';
import { useEffect } from 'react';

function LiveEvents() {
  useEffect(() => {
    const es = new EventSource('/api/events'); 
    es.onmessage = (ev) => {
      try {
        const m = JSON.parse(ev.data);
        window.dispatchEvent(new CustomEvent(m.type, { detail: m }));
      } catch {}
    };
    return () => es.close();
  }, []);
  return null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Global SSE wire — runs once per tab */}
        <LiveEvents />
        {children}
      </body>
    </html>
  );
}
