"use client";
import { useRouter } from "next/navigation";
import { useState } from "react"; 
export function TeleportButton() {
  const [justJumped, setJustJumped] = useState(false);

  const router = useRouter();
  const jump = async () => {
    const sec = await fetch("/swapmeet/api/heatmap?busy=true").then((r) => r.json());
    
    if (sec) {
      setJustJumped(true);
      setTimeout(() => setJustJumped(false), 400);
      // router.push(`/swapmeet/market/${sec.x}/${sec.y}`);
      router.push("/swapmeet/market/0/0")
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
