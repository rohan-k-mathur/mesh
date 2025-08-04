import { useEffect } from "react";
import { supabase } from "@/lib/supabaseclient";
import { Msg } from "@/contexts/PrivateChatManager";

export function usePrivateChatSocket(paneId: string, onMsg: (m: Msg) => void) {
  useEffect(() => {
    const ch = supabase.channel(`esp-${paneId}`);
    ch.on("broadcast", { event: "msg" }, ({ payload }) => onMsg(payload as Msg));
    ch.subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [paneId, onMsg]);
  return (body: string, from: bigint) => {
    supabase.channel(`esp-${paneId}`).send({
      type: "broadcast",
      event: "msg",
      payload: { paneId, from, body, ts: Date.now() },
    });
  };
}
