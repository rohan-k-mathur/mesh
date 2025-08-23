"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useReceipts(messageId?: string | number | null) {
  const id = messageId ? String(messageId) : null;
  const { data, mutate, error, isLoading } = useSWR(
    id ? `/api/messages/${encodeURIComponent(id)}/receipts?latest=1` : null,
    fetcher
  );
  const latest = data?.items?.[0] ?? null;
  return { latest, list: data?.items ?? [], refreshReceipts: mutate, isLoading, error };
}
