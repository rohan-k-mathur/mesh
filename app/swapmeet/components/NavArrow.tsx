"use client";
import { useRouter } from "next/navigation";

const vec = { N: [0, 1], S: [0, -1], E: [1, 0], W: [-1, 0] } as const;

export function NavArrow({ dir, x, y }:{dir:"N"|"S"|"E"|"W"; x:number; y:number;}) {
  const router = useRouter();
  const [dx, dy] = vec[dir];
  return (
    <button
      onClick={() => router.push(`/swapmeet/market/${x+dx}/${y+dy}`)}
      className="fixed z-20 text-white/80 bg-[var(--ubz-street)] w-10 h-10 rounded-full grid place-content-center hover:bg-[var(--ubz-brand)] transition-transform hover:scale-105"
      style={{
        top: dir === "N" ? "10px" : undefined,
        bottom: dir === "S" ? "10px" : undefined,
        left: dir === "W" ? "10px" : undefined,
        right: dir === "E" ? "10px" : undefined,
      }}
    >
      {dir}
    </button>
  );
}
