"use client";
import { useRouter } from "next/navigation";

export function EdgeNav({ x, y }: { x: number; y: number }) {
  const { push } = useRouter();
  return (
    <>
      <div onMouseEnter={() => push(`/swapmeet/market/${x}/${y + 1}`)} className="fixed top-0 left-0 h-4 w-full" />
      <div onMouseEnter={() => push(`/swapmeet/market/${x}/${y - 1}`)} className="fixed bottom-0 left-0 h-4 w-full" />
      <div onMouseEnter={() => push(`/swapmeet/market/${x - 1}/${y}`)} className="fixed top-0 left-0 w-4 h-full" />
      <div onMouseEnter={() => push(`/swapmeet/market/${x + 1}/${y}`)} className="fixed top-0 right-0 w-4 h-full" />
    </>
  );
}
