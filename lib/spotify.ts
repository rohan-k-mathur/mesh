import axios from "axios";
import { supabase } from "./supabaseclient";

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

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

export async function uploadRaw(userId: number, data: unknown) {
  const key = `spotify/${userId}/${new Date().toISOString().split("T")[0]}.json`;
  const bucket = supabase.storage.from("favorites_raw");
  const { data: url } = await bucket.createSignedUploadUrl(key);
  if (url) {
    await fetch(url, { method: "PUT", body: JSON.stringify(data) });
  }
}
