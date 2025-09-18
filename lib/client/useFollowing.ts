"use client";
import useSWR from "swr";
const fetcher = (u: string) => fetch(u).then(r => r.json());

export function useFollowing() {
  const { data, mutate } = useSWR("/api/follow", fetcher, { revalidateOnFocus: false });
  const list = data?.items ?? [];

  async function followRoom(deliberationId: string) {
    await fetch("/api/follow", { method: "POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ kind:"room", targetId: deliberationId }) });
    mutate();
  }
  async function unfollowRoom(deliberationId: string) {
    const p = new URLSearchParams({ kind:"room", targetId: deliberationId });
    await fetch(`/api/follow?${p.toString()}`, { method: "DELETE" });
    mutate();
  }

  function isFollowingRoom(id: string) { return list.some((f:any)=>f.kind==='room' && f.targetId===id); }
  return { list, followRoom, unfollowRoom, isFollowingRoom };
}
