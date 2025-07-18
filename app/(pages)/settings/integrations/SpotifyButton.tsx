// // app/(pages)/settings/integrations/SpotifyButton.tsx
// 'use client';
// import { buildAuthUrl } from '@/lib/spotifyClient';

// import { useState, useEffect } from 'react';
// import { nanoid }              from 'nanoid';
// import Image                   from 'next/image';
// import { supabase, uploadRaw, exchangeCode } from '@/lib/spotifyServer';


// export default function SpotifyButton() {
//   const [loading, setLoading]  = useState(false);
//   const [mounted, setMounted]  = useState(false);   // avoid SSR flash
//   useEffect(() => setMounted(true), []);

//   const handleClick = () => {
//     setLoading(true);
//     const state = nanoid();
//     localStorage.setItem('spotify_oauth_state', state);
//     window.location.href = buildAuthUrl(state);
//   };

//   return (
//     <button
//       onClick={handleClick}
//       disabled={!mounted || loading}
//       className="flex items-center gap-2 rounded-full bg-green-600 px-4 py-2
//                  text-white transition-colors hover:bg-green-700
//                  disabled:opacity-50"
//     >
//       <Image src="/logo/spotify.svg" width={20} height={20} alt="" />
//       {loading ? 'Redirecting…' : 'Connect Spotify'}
//     </button>
//   );
// }
// app/(pages)/settings/integrations/SpotifyButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { nanoid }              from 'nanoid';
import Image                   from 'next/image';

import { buildAuthUrl }        from '@/lib/spotifyClient';   // ✅ client‑side helper

export default function SpotifyButton() {
    const [hydrated, setHydrated] = useState(false);          // SSR‑flash guard

  const [loading, setLoading] = useState(false);
//   const [mounted, setMounted] = useState(false);   // avoid SSR flash
useEffect(() => setHydrated(true), []);

//   useEffect(() => setMounted(true), []);

  const handleClick = () => {
    setLoading(true);

    // CSRF token for OAuth
    const state = nanoid();
    localStorage.setItem('spotify_oauth_state', state);

    // off we go …
    window.location.href = buildAuthUrl(state);
  };

  return (
    <button
      onClick={handleClick}
      disabled={!hydrated || loading}
      className="flex items-center gap-2 rounded-full bg-green-600 px-4 py-2
                 text-white transition-colors hover:bg-green-700
                 disabled:opacity-50"
    >
      <Image src="/logo/spotify.svg" width={20} height={20} alt="" />
      {loading ? 'Redirecting…' : 'Connect Spotify'}
    </button>
  );
}
