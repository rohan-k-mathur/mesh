"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useMarket(id: string) {
  const { data, mutate } = useSWR(
    `/api/market/${id}`,
    fetcher,
    { refreshInterval: 5000 }
  );
  return { market: data, mutate };
}
