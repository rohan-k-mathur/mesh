// lib/spotifyClient.ts
/**
 * Browser‑safe helper to craft the Spotify OAuth URL.
 * No secrets included — can be imported in Client Components.
 */
export function buildAuthUrl(state: string) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
      redirect_uri:  process.env.NEXT_PUBLIC_REDIRECT_URI!,
      scope:         'user-library-read user-read-private',
      state,
      show_dialog:   'true',
    });
    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }
  