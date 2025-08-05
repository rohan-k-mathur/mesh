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
    <>        <h2 className="text-[1.37rem] font-semibold">Stream Control Panel</h2>

    <section className="border-[1px] border-white bg-white/50 shadow-xl  rounded-xl p-4 m-4 bg-white space-y-3 w-[400px] h-[300px]">

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
            className="px-4 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
          >
            Stop
          </button>
        </>
      ) : (
        <>
          <label className="block text-[.9rem] text-center ">
            Stream / Embed URL
            <input
              value={src}
              onChange={(e) => setSrc(e.target.value)}
              placeholder="https://www.youtube.com/embed/…"
              className="w-full rounded bg-white/30 px-2 py-3 text-sm modalfield mt-2"
            />
          </label>

          <button
            onClick={start}
            disabled={!src.trim()}
            className="px-4 py-1 rounded-xl bg-white/30 text-[1.1rem] savebutton disabled:bg-gray-400 text-gray-700 tracking-wide disabled:text-gray-100"
          >
            Start
          </button>
        </>
      )}
    </section>
    </>
  );
}
