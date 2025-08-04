"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function TeleportButton({ x, y }: { x: number; y: number }) {
  const [justJumped, setJustJumped] = useState(false);
  const router = useRouter();
  const jump = async () => {
    const useV2 = process.env.NEXT_PUBLIC_FEATURE_TELEPORT_V2 === "1";
    const url = useV2
      ? `/swapmeet/api/teleport?x=${x}&y=${y}`
      : "/swapmeet/api/heatmap?busy=true";
    const sec = await fetch(url).then((r) => r.json());

    if (sec) {
      setJustJumped(true);
      setTimeout(() => setJustJumped(false), 400);
      router.push(`/swapmeet/market/${sec.x}/${sec.y}`);
    }
  };
  return (
    <button
      onClick={jump}
      className={`fixed bottom-4 left-4 w-12 h-12 rounded-full bg-[var(--ubz-brand)] text-white text-xl animate-spin-slow hover:animate-none ${justJumped ? "animate-wiggle" : ""}`}
    >
      🎲
    </button>
  );
}
