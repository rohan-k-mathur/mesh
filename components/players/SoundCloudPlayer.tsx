"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

interface Props {
  src: string;
  title?: string;
}

const SoundCloudPlayer = ({ src, title }: Props) => {
  const waveRef = useRef<WaveSurfer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    waveRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#d1d5db",
      progressColor: "#f97316",
      height: 64,
      responsive: true,
    });
    if (src) waveRef.current.load(src);
    return () => {
      waveRef.current?.destroy();
    };
  }, [src]);

  const togglePlay = () => {
    if (!waveRef.current) return;
    waveRef.current.playPause();
    setIsPlaying(waveRef.current.isPlaying());
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 w-full">
        <button
          onClick={togglePlay}
          className="likebutton text-[1rem] button p-2 rounded-full"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <div className="flex flex-col w-full">
          {title && <div className="font-semibold text-sm mb-1">{title}</div>}
          <div ref={containerRef} className="w-full" />
        </div>
      </div>
    </div>
  );
};

export default SoundCloudPlayer;
