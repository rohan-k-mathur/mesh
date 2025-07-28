"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function Minimap({ x, y }: { x: number; y: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const CELL = 18;          // size of each square you already draw
const PULSE_FRAMES = 60;  // 60 fps → 1 sec per full cycle
  const { data } = useSWR(
    `/swapmeet/api/heatmap?x0=${x - 5}&x1=${x + 5}&y0=${y - 5}&y1=${y + 5}`,
    fetcher,
    { refreshInterval: 3000 },
  );

  // useEffect(() => {
  //   const canvas = canvasRef.current;
  //   if (!canvas || !data) return;
  //   const ctx = canvas.getContext("2d");
  //   let t = 0, raf: number;

  //   if (!ctx) return;
  //   ctx.clearRect(0, 0, canvas.width, canvas.height);
  //   const size = 18;
  //   for (const sec of data) {
  //     const sx = sec.x - (x - 5);
  //     const sy = sec.y - (y - 5);
  //     const opacity = Math.min(1, sec.visitors / 10);
  //     ctx.fillStyle = `rgba(255,0,0,${opacity})`;
  //     ctx.fillRect(sx * size, sy * size, size - 2, size - 2);
  //   }
  // }, [data, x, y]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext("2d")!;

    let frame = 0, rafId: number;

    const draw = () => {
      // 1️⃣ clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 2️⃣ draw heat‑map cells
      for (const sec of data) {
        const sx = sec.x - (x - 5);
        const sy = sec.y - (y - 5);
        const opacity = Math.min(1, sec.visitors / 10);
        ctx.fillStyle = `rgba(255,0,0,${opacity})`;
        ctx.fillRect(sx * CELL, sy * CELL, CELL - 2, CELL - 2);
      }

      // 3️⃣ pulse on the **current** section (always index 5,5)
      const alpha = 1 - (frame % PULSE_FRAMES) / PULSE_FRAMES; // 1 → 0
      const w = 8 + 12 * alpha;                                // 8 → 20 px
      const cx = 5 * CELL + CELL / 2;   // centre of current square+
      const cy = 5 * CELL + CELL / 2;

      ctx.save();
      ctx.globalAlpha = alpha * 0.8;
      ctx.strokeStyle = "#16a34a";       // accent colour
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - w / 2, cy - w / 2, w, w);
      ctx.restore();

      frame++;
      rafId = requestAnimationFrame(draw);
    };

    draw();                        // kick off
    return () => cancelAnimationFrame(rafId); // cleanup on unmount / data change
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
