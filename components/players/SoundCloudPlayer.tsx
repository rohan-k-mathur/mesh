"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import Image from "next/image";
interface Props {
  src: string;
  title?: string;
}

const SoundCloudPlayer = ({ src, title }: Props) => {


  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  // Define the waveform gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 1)
  gradient.addColorStop(0, '#656666') // Top color
  gradient.addColorStop((canvas.height * 0.7) / canvas.height, '#64748b') // Top color
  gradient.addColorStop((canvas.height * 0.7 + 1) / canvas.height, '#94a3b8') // White line
  gradient.addColorStop((canvas.height * 0.7 + 2) / canvas.height, '#94a3b8') // White line
  gradient.addColorStop((canvas.height * 0.7 + 3) / canvas.height, '#cbd5e1') // Bottom color
  gradient.addColorStop(1, '#B1B1B1') // Bottom color
  
  // Define the progress gradient
  const progressGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 1)
  progressGradient.addColorStop(0, '#EE772F') // Top color
  progressGradient.addColorStop((canvas.height * 0.7) / canvas.height, '#f97316') // Top color
  gradient.addColorStop((canvas.height * 0.7 + 1) / canvas.height, '#fb923c') // White line
  gradient.addColorStop((canvas.height * 0.7 + 2) / canvas.height, '#fb923c') // White line
  progressGradient.addColorStop((canvas.height * 0.7 + 3) / canvas.height, '#fdba74') // Bottom color
  progressGradient.addColorStop(1, '#F6B094') // Bottom color

  const waveRef = useRef<WaveSurfer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  

  useEffect(() => {
    if (!containerRef.current) return;
    waveRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: gradient,
      progressColor: progressGradient,
      height: 100,
      width:600,
      
    });
    if (src)
      waveRef.current
        .load(src)
        .catch(() => null);
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
    <div className="w-full">
      <div className="flex items-center gap-5 w-full">
        
          {isPlaying ? 
          <button
          onClick={togglePlay}
          className="playbutton outline-transparent  bg-rose-100 bg-opacity-20 p-5 rounded-full"
        >
          <Image src="/assets/pause--filled.svg" alt="pause" width={24} height={24}></Image>          </button>

          :<button
          onClick={togglePlay}
          className="playbutton outline-transparent bg-rose-100 bg-opacity-20 p-5 rounded-full "
        > <Image src="/assets/play--filled--alt.svg" alt="play" width={24} height={24}></Image>         </button>
      }
        <div className="flex flex-1 w-full">
          {/* {title && <div className="font-semibold text-sm mb-1">{title}</div>} */}
          <div ref={containerRef} className=" px-0 py-0 rounded-full  w-full" />
        </div>
      </div>
    </div>
  );
};

export default SoundCloudPlayer;
