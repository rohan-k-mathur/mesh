'use client';

import { useState } from "react";
import { buildAuthUrl } from "@/lib/spotify";
import { nanoid } from "nanoid";
import Image from "next/image";

export default function SpotifyConnectButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    const state = nanoid();
    localStorage.setItem("spotify_oauth_state", state);
    window.location.href = buildAuthUrl(state);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-60"
    >
      <Image src="/logo/spotify.svg" width={20} height={20} alt="" />
      {loading ? "Redirecting…" : "Connect Spotify"}
    </button>
  );
}
