import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseclient";
import { v4 as uuidv4 } from "uuid";

function getPresenceKey() {
  if (typeof window === "undefined") return uuidv4();
  const existing = localStorage.getItem("presence-key");
  if (existing) return existing;
  const key = uuidv4();
  localStorage.setItem("presence-key", key);
  return key;
}

export function useStallPresence(stallId: number, track = false) {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const key = getPresenceKey();
    const channel = supabase.channel(`stall-${stallId}`, {
      config: { presence: { key } },
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<Record<string, unknown>>();
      setOnline(Object.keys(state).length > 0);
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED" && track) {
        channel.track({});
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [stallId, track]);

  return online;
}
