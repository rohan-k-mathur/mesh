import { supabase } from "@/lib/supabaseclient";
import { useCallback, useEffect, useRef } from "react";

type OpenPayload = {
  kind: "open";
  roomId: string;
  conversationId: string;
  from: string;
  to: string;
  ts: number;
  fromName?: string | null;
  fromImage?: string | null;
};
type MessagePayload = {
  kind: "message";
  roomId: string;
  conversationId: string;
  from: string;
  to: string;
  body: string;
  ts: number;
  fromName?: string | null;
  fromImage?: string | null;
};
type Event = OpenPayload | MessagePayload;

export function usePrivateChatSocket(
  ids: {
    roomId: string;
    conversationId: string;
    meId: string;
    peerId: string;
    meName?: string | null;
    meImage?: string | null;
  },
  onEvent: (e: Event) => void
) {
  const { roomId, conversationId, meId, peerId, meName, meImage } = ids;

  const roomRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const inboxRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const handlerRef = useRef(onEvent);
  const chRef = useRef<any>(null);
  useEffect(() => { handlerRef.current = onEvent; }, [onEvent]);
// Subscribe to the room once
useEffect(() => {
  const ch = supabase.channel(roomId, { config: { broadcast: { self: false } } });
  roomRef.current = ch;
  ch.on("broadcast", { event: "priv" }, ({ payload }) => {
    if (payload?.roomId === roomId) {
      // console.log("[room recv]", roomId, payload);
      handlerRef.current(payload as Event);
    }
  });
  ch.subscribe();
  return () => { supabase.removeChannel(ch); roomRef.current = null; };
}, [roomId]);

 // Subscribe to the peer’s inbox once
 useEffect(() => {
  const inbox = supabase.channel(`inbox:${peerId}`, { config: { broadcast: { self: false } } });
  inboxRef.current = inbox;
  inbox.subscribe((status) => {
    // console.log("[inbox sender status]", status, `inbox:${peerId}`);
  });
  return () => { supabase.removeChannel(inbox); inboxRef.current = null; };
}, [peerId]);


const notifyPeerInbox = useCallback((event: "priv_open" | "priv_message", payload: Event) => {
  const ch = inboxRef.current;
  if (!ch) return console.warn("[notify] inbox not ready for", peerId);
  ch.send({ type: "broadcast", event, payload });
}, [peerId]);


const sendOpen = useCallback(() => {
  const payload: OpenPayload = {
    kind: "open",
    roomId,
    conversationId,
    from: meId,
    to: peerId,
    ts: Date.now(),
    fromName: meName ?? null,
    fromImage: meImage ?? null,
  };
  roomRef.current?.send({ type: "broadcast", event: "priv", payload });
  notifyPeerInbox("priv_open", payload);
}, [roomId, conversationId, meId, peerId, meName, meImage, notifyPeerInbox]);

const sendMessage = useCallback((body: string) => {
  const payload: MessagePayload = {
    kind: "message",
    roomId,
    conversationId,
    from: meId,
    to: peerId,
    body,
    ts: Date.now(),
    fromName: meName ?? null,
    fromImage: meImage ?? null,
  };
  roomRef.current?.send({ type: "broadcast", event: "priv", payload });
  notifyPeerInbox("priv_message", payload);
}, [roomId, conversationId, meId, peerId, meName, meImage, notifyPeerInbox]);

return { sendOpen, sendMessage };
}
// }

  
// // hooks/usePrivateChatSocket.ts
// const notifyPeerInbox = useCallback(
//   (event: "priv_open" | "priv_message", payload: Event) => {
//     const inbox = supabase.channel(`inbox:${peerId}`, { config: { broadcast: { self: false } } });
//     inbox.subscribe((status) => {
//       if (status === "SUBSCRIBED") {
//         inbox.send({ type: "broadcast", event, payload });
//         setTimeout(() => { try { supabase.removeChannel(inbox); } catch {} }, 0);
//       }
//     });
//   },
//   [peerId]
// );

//   const sendOpen = useCallback(() => {
//     const payload: OpenPayload = {
//       kind: "open",
//       roomId,
//       conversationId,
//       from: meId,
//       to: peerId,
//       ts: Date.now(),
//       fromName: meName ?? null,
//       fromImage: meImage ?? null,
//     };
//     chRef.current?.send({ type: "broadcast", event: "priv", payload });
//     notifyPeerInbox("priv_open", payload);
//   }, [roomId, conversationId, meId, peerId, meName, meImage, notifyPeerInbox]);

//   const sendMessage = useCallback((body: string) => {
//     const payload: MessagePayload = {
//       kind: "message",
//       roomId,
//       conversationId,
//       from: meId,
//       to: peerId,
//       body,
//       ts: Date.now(),
//       fromName: meName ?? null,
//       fromImage: meImage ?? null,
//     };
//     chRef.current?.send({ type: "broadcast", event: "priv", payload });
//     notifyPeerInbox("priv_message", payload);
//   }, [roomId, conversationId, meId, peerId, meName, meImage, notifyPeerInbox]);

//   return { sendOpen, sendMessage };
// }
