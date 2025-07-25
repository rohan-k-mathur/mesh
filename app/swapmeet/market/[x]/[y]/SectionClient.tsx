"use client";

import useSWR, { mutate } from "swr";
import { useEffect } from "react";
import { GridNavControls } from "@/components/GridNavControls";
import { Minimap } from "@/components/Minimap";
import { upsertSectionPing } from "@/lib/analytics/upsertSectionPing";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SectionClient({ x, y }: { x: number; y: number }) {
  const { data } = useSWR(`/api/section?x=${x}&y=${y}`, fetcher);

  useEffect(() => {
    const neighbours = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
    ];
    neighbours.forEach(({ dx, dy }) => {
      const url = `/api/section?x=${x + dx}&y=${y + dy}`;
      mutate(url, fetcher(url));
    });
  }, [x, y]);

  useEffect(() => {
    const id = setInterval(() => {
      upsertSectionPing(x, y);
    }, 15000);
    upsertSectionPing(x, y);
    return () => clearInterval(id);
  }, [x, y]);

  const stalls = data?.stalls ?? [];

  return (
    <div className="relative">
      <h1>{`Section (${x}, ${y})`}</h1>
      <GridNavControls x={x} y={y} />
      <Minimap x={x} y={y} />
      <ul>
        {stalls.map((s: any) => (
          <li key={s.id}>{s.name}</li>
        ))}
      </ul>
    </div>
  );
}
