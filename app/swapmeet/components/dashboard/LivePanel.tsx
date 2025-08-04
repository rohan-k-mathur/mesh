/* LivePanel.tsx */
"use client";
import useSWR from "swr";
import { LivePanelClient } from "./LivePanelClient";

const fetcher = (u: string) => fetch(u).then(r => r.json());

export function LivePanel({ stallId }: { stallId: number }) {
  const { data } = useSWR(`/swapmeet/api/stall/${stallId}`, fetcher);
  if (!data) return null;               // loading

  return (
    <LivePanelClient
      stallId={stallId}
      initLive={Boolean(data.live)}
      initSrc={data.liveSrc ?? null}
    />
  );
}
