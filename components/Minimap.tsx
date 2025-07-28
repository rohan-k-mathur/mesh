"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function Minimap({ x, y }: { x: number; y: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { data } = useSWR(
    `/swapmeet/api/heatmap?x0=${x - 5}&x1=${x + 5}&y0=${y - 5}&y1=${y + 5}`,
    fetcher,
    { refreshInterval: 3000 },
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const size = 18;
    for (const sec of data) {
      const sx = sec.x - (x - 5);
      const sy = sec.y - (y - 5);
      const opacity = Math.min(1, sec.visitors / 10);
      ctx.fillStyle = `rgba(255,0,0,${opacity})`;
      ctx.fillRect(sx * size, sy * size, size - 2, size - 2);
    }
  }, [data, x, y]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      className="fixed bottom-4 right-4 border-2 border-black bg-white/50 backdrop-blur-sm"
    />
  );
}
