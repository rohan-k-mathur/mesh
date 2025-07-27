"use client";
import useSWR from "swr";
import { useEffect, useRef } from "react";

export function Minimap({ cx, cy }: { cx: number; cy: number }) {
  const { data } = useSWR(
    `/swapmeet/api/heatmap?x0=${cx-5}&x1=${cx+5}&y0=${cy-5}&y1=${cy+5}`,
    (u) => fetch(u).then((r) => r.json()),
    { refreshInterval: 3000 },
  );
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvas.current || !data) return;
    const ctx = canvas.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 200, 200);
    data.forEach(({ x, y, visitors }: { x: number; y: number; visitors: number }) => {
      const relX = x - cx + 5;
      const relY = cy - y + 5;
      const alpha = Math.min(visitors / 20, 1);
      ctx.fillStyle = `hsla(${120 - alpha * 120} 80% 50% / ${0.2 + alpha * 0.8})`;
      ctx.fillRect(relX * 18, relY * 18, 16, 16);
    });
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(5 * 18, 5 * 18, 16, 16);
  }, [data, cx, cy]);

  return (
    <canvas
      ref={canvas}
      width={200}
      height={200}
      className="absolute bottom-4 right-4 bg-white/70 rounded shadow"
    />
  );
}
