// hooks/useConversationRealtime.ts
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseclient";

// tiny throttle (or pull from lodash)
function throttle<T extends (...a: any[]) => any>(fn: T, ms: number) {
  let last = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}

type OnlineMeta = { name: string; image: string | null };

export function useConversationRealtime(
  conversationId: string,
  currentUser: { id: string; name: string; image: string | null }
) {
  const [online, setOnline] = useState<Record<string, OnlineMeta>>({});
  const [typing, setTyping] = useState<Record<string, number>>({});
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // join + presence sync
  useEffect(() => {
    const channel = supabase.channel(`conversation-${conversationId}`, {
      config: { presence: { key: currentUser.id } },
    });

    channel.on("presence", { event: "sync" }, () => {
      // presenceState: { [userId]: [{ name, image, ... }, ...] }
      const state = channel.presenceState() as Record<string, OnlineMeta[]>;
      const flattened: Record<string, OnlineMeta> = {};
      for (const [uid, metas] of Object.entries(state)) {
        const meta = metas[0]; // first device
        if (meta) flattened[uid] = { name: meta.name, image: meta.image ?? null };
      }
      setOnline(flattened);
    });

    channel.on("broadcast", { event: "typing" }, ({ payload }) => {
      const { userId, until } = payload as { userId: string; until: number };
      if (userId === currentUser.id) return;
      setTyping((prev) => ({ ...prev, [userId]: until }));
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ name: currentUser.name, image: currentUser.image });
      }
    });

    channelRef.current = channel;

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
      setOnline({});
      setTyping({});
    };
  }, [conversationId, currentUser.id, currentUser.name, currentUser.image]);

  // expire typing flags
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      setTyping((prev) => {
        const next = { ...prev };
        for (const uid of Object.keys(next)) {
          if (next[uid] <= now) delete next[uid];
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const sendTyping = useMemo(
    () =>
      throttle(() => {
        const until = Date.now() + 3000; // visible for 3s
        channelRef.current?.send({
          type: "broadcast",
          event: "typing",
          payload: { userId: currentUser.id, until },
        });
      }, 1000), // send at most once/sec
    [currentUser.id]
  );

  return { online, typing, sendTyping };
}
