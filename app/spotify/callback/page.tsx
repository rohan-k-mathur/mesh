'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';           // don’t pre‑render

export default function SpotifyCallback() {
  // simple UX state
  const [msg, setMsg] = useState('Linking your Spotify account…');
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const code = params.get('code');
    if (!code) { setMsg('Missing code'); return; }

    (async () => {
      try {
        const res = await fetch('/api/v2/favorites/import/spotify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        const json = await res.json();
        if (res.status === 202) {
          setMsg('Sync started! You can close this tab.');
          // Optionally redirect somewhere nicer:
          // router.replace('/favorites?sync=spotify');
        } else {
          setMsg(`Error: ${json.error ?? 'unknown'}`);
        }
      } catch (e) {
        setMsg('Network error – check console');
        console.error(e);
      }
    })();
  }, [params]);

  return <p style={{ padding: 32 }}>{msg}</p>;
}
