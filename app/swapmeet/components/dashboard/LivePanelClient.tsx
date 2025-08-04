/* --- CLIENT-SIDE ONLY ------------------------------------ */
"use client";

import { useState, useOptimistic } from "react";
import { mutate } from "swr";

interface Props {
  stallId: number;
  initLive: boolean;
  initSrc: string | null;
}

export function LivePanelClient({ stallId, initLive, initSrc }: Props) {
  const [src, setSrc]           = useState(initSrc ?? "");

  //const [optimisticLive, setLive] = useOptimistic(initLive, (_p, n) => n);

  const [optimisticLive, setLive] = useOptimistic(initLive);

  async function start() {
    if (!src.trim()) return;
    setLive(true);
    await fetch(`/swapmeet/api/stall/${stallId}/live`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ live: true, liveSrc: src.trim() }),
    });
    mutate(`/swapmeet/api/stall/${stallId}`);   // refresh Sheet data
  }

  async function stop() {
    setLive(false);
    await fetch(`/swapmeet/api/stall/${stallId}/live`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ live: false }),
    });
    mutate(`/swapmeet/api/stall/${stallId}`);
  }

  return (
    <section className="rounded-lg border p-4 bg-white space-y-3 w-[240px]">
      <h2 className="text-lg font-semibold">Livestream control</h2>

      {optimisticLive ? (
        <>
          <p className="text-sm text-green-600">🔴 You are live</p>

          <div className="aspect-video w-full rounded overflow-hidden bg-black">
            {src && (
              <iframe
                src={src}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            )}
          </div>

          <button
            onClick={stop}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
          >
            End stream
          </button>
        </>
      ) : (
        <>
          <label className="block text-sm">
            Stream / embed URL
            <input
              value={src}
              onChange={(e) => setSrc(e.target.value)}
              placeholder="https://www.youtube.com/embed/…"
              className="mt-1 w-full rounded border p-2 text-sm"
            />
          </label>

          <button
            onClick={start}
            disabled={!src.trim()}
            className="px-4 py-2 rounded bg-emerald-600 disabled:bg-gray-400 text-white text-sm"
          >
            Go live
          </button>
        </>
      )}
    </section>
  );
}
