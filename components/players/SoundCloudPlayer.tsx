"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import Image from "next/image";

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
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 1);
    gradient.addColorStop(0, "#818cf8");
    // gradient.addColorStop((canvas.height * 0.65 ) / canvas.height, "#E8E8E8");

    // gradient.addColorStop((canvas.height * 0.65) / canvas.height, "#464646");
    gradient.addColorStop(1, "#4f46e5");

    const progressGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 1);
    progressGradient.addColorStop(0, "#fdba74");
    // progressGradient.addColorStop((canvas.height * 0.65) / canvas.height, "#f97316");
    // progressGradient.addColorStop((canvas.height * 0.65) / canvas.height, "#fb923c");
    progressGradient.addColorStop(1, "#ea580c");

    waveRef.current = WaveSurfer.create({
      container: containerRef.current,
      // waveColor: "#000000",
      waveColor: gradient,

      progressColor: progressGradient,
      height: 100,
      width: 600,
      normalize: true,
      barWidth: 6,
      barGap: 3,
      barRadius: 40,


    });
    if (src) waveRef.current.load(src).catch(() => null);
    return () => {
      try {
        waveRef.current?.destroy();
      } catch (err) {
        console.error("WaveSurfer destroy failed", err);
      }
    };
  }, [src]);

  const togglePlay = () => {
    if (!waveRef.current) return;
    waveRef.current.playPause();
    setIsPlaying(waveRef.current.isPlaying());
  };

  return (
    <div className="w-full flex-col">
            <h1 className="text-center tracking-wide text-[1.6rem] mt-0  pb-2">{title}</h1>

      <div className="flex items-center gap-5 w-full">
        {isPlaying ? (
          <button
            onClick={togglePlay}
            className="playbutton outline-transparent  bg-rose-100 bg-opacity-20 p-5 rounded-full"
          >
            <Image src="/assets/pause--filled.svg" alt="pause" width={24} height={24} />
          </button>
        ) : (
          <button
            onClick={togglePlay}
            className="playbutton outline-transparent bg-rose-100 bg-opacity-20 p-5 rounded-full "
          >
            <Image src="/assets/play--filled--alt.svg" alt="play" width={24} height={24} />
          </button>
        )}
        <div className="flex flex-1 w-full">
          <div ref={containerRef} className=" px-0 py-0 rounded-full  w-full" />
        </div>
      </div>
    </div>
  );
};

export default SoundCloudPlayer;
