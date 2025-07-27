"use client";
import { useRouter } from "next/navigation";

export function TeleportButton() {
  const router = useRouter();
  const jump = async () => {
    const sec = await fetch("/swapmeet/api/heatmap?busy=true").then((r) => r.json());
    if (sec) {
      router.push(`/swapmeet/market/${sec.x}/${sec.y}`);
    }
  };
  return (
    <button
      onClick={jump}
      className="fixed bottom-4 left-4 w-12 h-12 rounded-full bg-[var(--ubz-brand)] text-white text-xl animate-spin-slow hover:animate-none"
    >
      🎲
    </button>
  );
}
