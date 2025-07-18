// lib/spotifyServer.ts
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

/* ------------------------------------------------------------------ */
/* Supabase (service‑role) – stays on the server                      */
/* ------------------------------------------------------------------ */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,     // project URL
  process.env.SUPABASE_SERVICE_ROLE_KEY!,    // secret – never in client
  { auth: { persistSession: false } },
);

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
export interface TokenResponse {
  access_token:  string;
  refresh_token?: string;
  expires_in:    number;
}

/* ------------------------------------------------------------------ */
/* Spotify token helpers                                               */
/* ------------------------------------------------------------------ */
export async function exchangeCode(code: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type:    'authorization_code',
    code,
    redirect_uri:  process.env.REDIRECT_URI!,
    client_id:     process.env.SPOTIFY_CLIENT_ID!,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
  });

  const { data } = await axios.post(
    'https://accounts.spotify.com/api/token',
    body.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );
  return data;
}

export async function refreshToken(refresh_token: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type:    'refresh_token',
    refresh_token,
    client_id:     process.env.SPOTIFY_CLIENT_ID!,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
  });

  const { data } = await axios.post(
    'https://accounts.spotify.com/api/token',
    body.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );
  return data;
}

/* ------------------------------------------------------------------ */
/* Upload raw favourites JSON to Supabase Storage                     */
/* ------------------------------------------------------------------ */
export async function uploadRaw(userId: number, payload: unknown) {
  const key = `spotify/${userId}/${new Date().toISOString().split('T')[0]}.json`;
  const bucket = supabase.storage.from('favorites-raw');

  // 60‑second signed PUT URL
  const { data, error } = await bucket.createSignedUploadUrl(key, 60);
  if (error) throw error;

  await fetch(data.signedUrl, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  console.log('[uploadRaw] uploaded ->', data.path);
}
