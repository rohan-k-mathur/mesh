"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";

export function useGridNavigator(x: number, y: number) {
  const router = useRouter();

  const move = useCallback(
    (dx: number, dy: number) => {
      router.push(`/swapmeet/market/${x + dx}/${y + dy}`);
    },
    [router, x, y]
  );

  const send = useDebouncedCallback((nx: number, ny: number) => {
    fetch("/api/telemetry", {
      method: "POST",
      body: JSON.stringify({ event: "grid_viewed", coords: `${nx},${ny}` }),
    }).catch(() => {});
  }, 500);

  useEffect(() => {
    send(x, y);
  }, [x, y, send]);

  return move;
}
