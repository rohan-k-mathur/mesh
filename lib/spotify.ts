import axios from "axios";
// import { supabase } from "./supabaseclient";
import { createClient } from "@supabase/supabase-js";

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,   // NOT the anon key
);

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.REDIRECT_URI!,
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
  });
  const res = await axios.post("https://accounts.spotify.com/api/token", params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return res.data;
}

export async function refreshToken(refresh_token: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token,
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
  });
  const res = await axios.post("https://accounts.spotify.com/api/token", params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return res.data;
}

// export async function uploadRaw(userId: number, data: unknown) {
  
//   const key = `spotify/${userId}/${new Date().toISOString().split("T")[0]}.json`;
//   const bucket = supabase.storage.from("favorites-raw");
//   const { data: url } = await bucket.createSignedUploadUrl(key);
//   if (url) {
//     await fetch(url, { method: "PUT", body: JSON.stringify(data) });
//     console.log('[uploadRaw] key', key, 'url', !!url);	

//   }
// }
export async function uploadRaw(userId: number, data: unknown) {
  const key = `spotify/${userId}/${new Date().toISOString().split("T")[0]}.json`;
  console.log('[uploadRaw] creating signed URL for', key);

  const bucket = supabase.storage.from('favorites_raw');
  const { data: url, error } = await bucket.createSignedUploadUrl(key);

  if (error) {
    console.error('[uploadRaw] signed-url error', error);
    throw error;
  }
  if (!url) throw new Error('signedUrl is null');

  console.log('[uploadRaw] PUT → Supabase');
  const res = await fetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('[uploadRaw] PUT failed', res.status, text);
    throw new Error(`Supabase upload failed ${res.status}`);
  }

  console.log('[uploadRaw] upload complete');
}
