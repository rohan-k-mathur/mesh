"use client";
import { useRef, useEffect } from "react";

interface Props {
  src?: string;
  open: boolean;
}

export function VideoPane({ src, open }: Props) {
  const vidRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!open) vidRef.current?.pause();
  }, [open]);

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

