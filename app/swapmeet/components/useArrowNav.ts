"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const map = {
  ArrowUp:    [0,  1],
  ArrowDown:  [0, -1],
  ArrowLeft:  [-1, 0],
  ArrowRight: [1,  0],
  w: [0,  1],
  s: [0, -1],
  a: [-1, 0],
  d: [1,  0],
} as const;

function isTyping(target: EventTarget | null) {
  if (!target || !(target as HTMLElement).tagName) return false;
  const tag = (target as HTMLElement).tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || (target as HTMLElement).isContentEditable;
}

export function useArrowNav(x: number, y: number) {
  const router = useRouter();

  useEffect(() => {
    let last = 0;

    function onKey(e: KeyboardEvent) {
      const delta = map[e.key as keyof typeof map];
      if (!delta) return;

      /* 1️⃣  Ignore if any Radix Sheet/Dialog is open */
      if (document.querySelector("[data-radix-modal-content]")) return;

      /* 2️⃣  Ignore while user is typing in an input/textarea/contenteditable */
      if (isTyping(e.target)) return;

      /* throttle to one navigation / 300 ms */
      const now = Date.now();
      if (now - last < 300) return;
      last = now;

      e.preventDefault();
      router.push(`/swapmeet/market/${x + delta[0]}/${y + delta[1]}`);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [x, y, router]);
}
