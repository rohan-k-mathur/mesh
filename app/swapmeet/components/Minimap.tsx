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
    ctx.font = "14px sans-serif";
    data.forEach(
      ({
        x,
        y,
        visitors,
        liveCount,
        auctionCount,
      }: {
        x: number;
        y: number;
        visitors: number;
        liveCount: number;
        auctionCount: number;
      }) => {
        const relX = x - cx + 5;
        const relY = cy - y + 5;
        const alpha = Math.min(visitors / 20, 1);
        ctx.fillStyle = `hsla(${120 - alpha * 120} 80% 50% / ${0.2 + alpha * 0.8})`;
        ctx.fillRect(relX * 18, relY * 18, 16, 16);
        if (liveCount > 0) {
          ctx.fillStyle = "#16a34a";
          ctx.fillText("⧉", relX * 18 + 4, relY * 18 + 14);
        }
        if (auctionCount > 0) {
          ctx.fillStyle = "#eab308";
          ctx.fillText("⚡", relX * 18 + 4, relY * 18 + 14);
        }
      },
    );
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(5 * 18, 5 * 18, 16, 16);
  }, [data, cx, cy]);

  return (
    <div className="fixed bottom-4 right-4">
      <canvas
        ref={canvas}
        width={200}
        height={200}
        className="bg-white/70 rounded shadow"
      />
      <div className="mt-1 flex gap-2 text-xs bg-white/70 rounded px-1">
        <span className="text-green-600">⧉ live</span>
        <span className="text-yellow-500">⚡ auction</span>
      </div>
    </div>
  );
}
