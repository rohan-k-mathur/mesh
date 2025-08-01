"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export const useMarket = (id: string) =>
  useSWR(`/api/market/${id}`, fetcher, { refreshInterval: 5000 });
