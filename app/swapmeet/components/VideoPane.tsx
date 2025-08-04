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

  useEffect(() => {
    if (!open) vidRef.current?.pause();
  }, [open]);

  useEffect(() => {
    if (feature && live && user) {
      fetch(`/api/livekit-token?room=${stallId}&name=${user.uid}`)
        .then(res => res.json())
        .then(d => setToken(d.token));
    }
  }, [feature, live, stallId, user]);

  if (!feature) {
    if (!src) return null;
    return (
      <video
        ref={vidRef}
        src={src}
        className="w-full aspect-video bg-black"
        autoPlay
        muted
        playsInline
      />
    );
  }

  if (!live || !token) return null;

  return (
    <LiveKitRoom token={token} serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}>
      <BroadcastControls />
    </LiveKitRoom>
  );
}

function BroadcastControls() {
  const { localParticipant, isCameraEnabled, isMicrophoneEnabled } =
    useLocalParticipant();
  return (
    <div className="flex gap-2 p-2">
      <button
        onClick={() =>
          localParticipant.setCameraEnabled(!isCameraEnabled)
        }
        className="border px-2 py-1"
      >
        Toggle Cam
      </button>
      <button
        onClick={() =>
          localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)
        }
        className="border px-2 py-1"
      >
        Toggle Mic
      </button>
    </div>
  );
}

