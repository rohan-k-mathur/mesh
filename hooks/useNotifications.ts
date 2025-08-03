"use client";
import useSWR from "swr";
import { useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseclient";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useNotifications() {
  const { user } = useAuth();
  const { data, mutate } = useSWR(
    user ? "/api/notifications?unreadOnly=false" : null,
    fetcher,
    { refreshInterval: 15000 }
  );


  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !user?.userId) return;
    const channel = supabase.channel(`notif:${user.userId}`);
    channel.on("broadcast", { event: "new" }, () => mutate());
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.userId, mutate]);


  /** optimistic helpers */
  async function deleteNotification(id: bigint) {
    /* 1. optimistic update */
    mutate((prev: any[]) => prev.filter(n => n.id !== id), { revalidate: false });
    /* 2. tell server */
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    /* 3. re‑sync */
    mutate();
  }

  async function clearNotifications() {
    mutate([], { revalidate: false });                     // optimistic
    await fetch("/api/notifications/clear", { method: "POST" });
    mutate();
  }

  return {
    notifications: data ?? [],
    refreshNotifications: mutate,
    deleteNotification,
    clearNotifications,
  };
}
  // return { notifications: data ?? [], refreshNotifications: mutate };

