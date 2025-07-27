"use client";
import useSWR from "swr";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export function OfferLadder({ stallId }: { stallId: number }) {
  const { data } = useSWR(
    `/swapmeet/api/offers?stall=${stallId}`,
    fetcher,
    { refreshInterval: 2000 },
  );
  return (
    <div className="sticky bottom-0 bg-white/80 backdrop-blur p-2">
      {data?.map((o: any) => (
        <div
          key={o.id}
          className={`grid grid-cols-[1fr_60px] ${o.mine ? "text-green-600" : "text-red-600"}`}
        >
          <span>${o.price}</span>
          <span>{o.user}</span>
        </div>
      ))}
    </div>
  );
}
