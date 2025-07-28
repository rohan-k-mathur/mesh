"use client";
import { useRouter } from "next/navigation";

export function useMove(x: number, y: number) {
  const router = useRouter();

  return (dx: number, dy: number) => {
    router.push(`/swapmeet/market/${x + dx}/${y + dy}`);
  };
}
