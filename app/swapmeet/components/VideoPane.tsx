// app/swapmeet/components/VideoPane.tsx
"use client";
import { useRef, useEffect, useState } from "react";
import { LiveKitRoom, useLocalParticipant } from "@livekit/components-react";
import { useAuth } from "@/lib/AuthContext";

interface Props {
  stallId: number;
  live: boolean;
  src?: string;
  open: boolean;
}

export function VideoPane({ stallId, live, src, open }: Props) {
  const vidRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const [token, setToken] = useState<string>();
  const feature = process.env.NEXT_PUBLIC_FEATURE_LIVE_VIDEO === "true";
  const simpleEmbed = !feature;

  // Hooks must be unconditional (top-level)
  useEffect(() => {
    if (!open) vidRef.current?.pause();
  }, [open]);

  useEffect(() => {
    if (!feature || !live || !user) return;
    fetch(`/api/livekit-token?room=${stallId}&name=${user.uid}`)
      .then((res) => res.json())
      .then((d) => setToken(d.token))
      .catch(() => setToken(undefined));
  }, [feature, live, stallId, user]);

  // Now do all conditional returns *after* hooks
  if (!open) return null;

  if (simpleEmbed) {
    if (!live || !src) {
      return (
        <div className="h-48 w-full flex items-center justify-center bg-gray-900/20">
          <span className="text-sm text-gray-500">Stream offline</span>
        </div>
      );
    }
    return (
      <div className="aspect-video w-full overflow-hidden rounded bg-black">
        <iframe src={src} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />
      </div>
    );
  }

  if (!live || !token) {
    return (
      <div className="h-48 w-full flex items-center justify-center bg-gray-900/20">
        <span className="text-sm text-gray-500">Stream offline</span>
      </div>
    );
  }

  return (
    <div className="w-[100px] h-[100px]">
      <LiveKitRoom token={token} serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}>
        <BroadcastControls />
      </LiveKitRoom>
    </div>
  );
}

function BroadcastControls() {
  const { localParticipant, isCameraEnabled, isMicrophoneEnabled } = useLocalParticipant();
  return (
    <div className="flex gap-2 p-2">
      <button
        onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
        className="border px-2 py-1"
      >
        Toggle Cam
      </button>
      <button
        onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
        className="border px-2 py-1"
      >
        Toggle Mic
      </button>
    </div>
  );
}
