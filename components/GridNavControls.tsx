"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useKeyPress } from "@/hooks/useKeyPress";
import { ArrowUp, ArrowRight, ArrowDown, ArrowLeft, SendHorizonal } from "lucide-react";

export function GridNavControls({ x, y }: { x: number; y: number }) {
  const router = useRouter();
  const go = useCallback(
    (dx: number, dy: number) => {
      router.push(`/market/${x + dx}/${y + dy}`);
    },
    [x, y, router],
  );

  useKeyPress("w", () => go(0, -1));
  useKeyPress("a", () => go(-1, 0));
  useKeyPress("s", () => go(0, 1));
  useKeyPress("d", () => go(1, 0));

  async function teleport() {
    try {
      const res = await fetch("/api/heatmap?busy=true");
      const data = await res.json();
      if (data && typeof data.x === "number" && typeof data.y === "number") {
        router.push(`/market/${data.x}/${data.y}`);
      }
    } catch (err) {
      console.error("Teleport failed", err);
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none">
      <button onClick={() => go(0, -1)} className="nav north" aria-label="North">
        <ArrowUp className="w-4 h-4" />
      </button>
      <button onClick={() => go(1, 0)} className="nav east" aria-label="East">
        <ArrowRight className="w-4 h-4" />
      </button>
      <button onClick={() => go(0, 1)} className="nav south" aria-label="South">
        <ArrowDown className="w-4 h-4" />
      </button>
      <button onClick={() => go(-1, 0)} className="nav west" aria-label="West">
        <ArrowLeft className="w-4 h-4" />
      </button>
      <button onClick={teleport} className="nav teleport" aria-label="Teleport">
        <SendHorizonal className="w-4 h-4" />
      </button>
    </div>
  );
}
