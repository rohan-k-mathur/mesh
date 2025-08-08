// import { useEffect } from "react";
// import { supabase } from "@/lib/supabaseclient";
// import { Msg } from "@/contexts/PrivateChatManager";

// export function usePrivateChatSocket(paneId: string, onMsg: (m: Msg) => void) {
//   useEffect(() => {
//     const ch = supabase.channel(`esp-${paneId}`);
//     ch.on("broadcast", { event: "msg" }, ({ payload }) =>
//       onMsg({ ...payload, from: BigInt(payload.from) } as Msg),
//     );
//     ch.subscribe();
//     return () => {
//       supabase.removeChannel(ch);
//     };
//   }, [paneId, onMsg]);
//   return (body: string, from: bigint) => {
//     supabase.channel(`esp-${paneId}`).send({
//       type: "broadcast",
//       event: "msg",
//       payload: { paneId, from: from.toString(), body, ts: Date.now() },
//     });
//   };
// }
// hooks/usePrivateChatSocket.ts
"use client";
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseclient";

export function usePrivateChatSocket(
  paneId: string,
  onMessage: (m: { from: string; body: string; ts: number }) => void
) {
  const onMessageRef = useRef(onMessage);
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

  useEffect(() => {
    const channel = supabase.channel(`privchat-${paneId}`);
    channel.on("broadcast", { event: "dm" }, ({ payload }) => {
      onMessageRef.current(payload);
    });
    channel.subscribe();
    return () => {
      try { channel.unsubscribe?.(); } catch {}
      supabase.removeChannel(channel);
    };
  }, [paneId]);

  function send(body: string, from: string) {
    const payload = { from, body, ts: Date.now() };
    const ch = supabase.channel(`privchat-${paneId}`);
    ch.send({ type: "broadcast", event: "dm", payload });
    // Note: you can also optimistically echo in caller if you want immediate UI
  }

  return send;
}
