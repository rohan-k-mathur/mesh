'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic'; // don’t pre-render on the server

export default function SpotifyCallback() {
  const [msg, setMsg] = useState('Linking your Spotify account…');
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const code = params.get('code');
    if (!code) {
      setMsg('Missing “code” parameter');
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/v2/favorites/import/spotify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        let json: any = {};
        try {
          json = await res.json(); // may be empty on 500
        } catch {
          /* ignore empty body */
        }

        if (res.ok && res.status === 202) {
          setMsg('Sync started! You can close this tab.');
          // router.replace('/favorites?sync=spotify'); // optional redirect
        } else {
          setMsg(`Error: ${json.error ?? res.statusText}`);
        }
      } catch (err) {
        console.error(err);
        setMsg('Network error – see console');
      }
    })();
  }, [params]);

  return <p style={{ padding: 32 }}>{msg}</p>;
}
