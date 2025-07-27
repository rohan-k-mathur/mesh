"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const map = {
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  w: [0, 1],
  s: [0, -1],
  a: [-1, 0],
  d: [1, 0],
} as const;

export function useArrowNav(x: number, y: number) {
  const r = useRouter();
  useEffect(() => {
    let last = 0;
    const h = (e: KeyboardEvent) => {
      const v = map[e.key as keyof typeof map];
      if (v) {
        const now = Date.now();
        if (now - last < 300) return;
        last = now;
        e.preventDefault();
        r.push(`/swapmeet/market/${x + v[0]}/${y + v[1]}`);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [x, y, r]);
}
