// hooks/useUserInbox.ts
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseclient";
import { usePrivateChatManager } from "@/contexts/PrivateChatManager";

// keep channels alive per-user
const inboxMap: Record<string, ReturnType<typeof supabase.channel>> = {};

export function useUserInbox(me: string) {
  const { state, dispatch } = usePrivateChatManager();
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    if (!me) return;

    let inbox = inboxMap[me];
    if (!inbox) {
      inbox = supabase.channel(`inbox:${me}`, { config: { broadcast: { self: false } } });
      inboxMap[me] = inbox;

      inbox.on("broadcast", { event: "priv_open" }, ({ payload }) => {
        const { roomId, from, fromName, fromImage, conversationId } = payload || {};
        if (!roomId || !conversationId || !from) return;
        if (String(from) === String(me)) return;

        dispatch({
          type: "OPEN_OR_CREATE",
          pane: {
            id: String(roomId),
            conversationId: String(conversationId),
            peerId: String(from),
            peerName: fromName ?? "User",
            peerImage: fromImage ?? null,
            pos: { x: 420, y: 24 },
          },
          bump: false, // <-- do NOT bump on open
        });
      });

      inbox.on("broadcast", { event: "priv_message" }, ({ payload }) => {
        const { roomId, from, body, ts, conversationId, fromName, fromImage } = payload || {};
        if (!roomId || !conversationId || !from || !body) return;
        if (String(from) === String(me)) return;

        const pane = stateRef.current.panes[String(roomId)];
        const paneOpen = pane && !pane.minimised;

        // Ensure pane exists (minimised) but don't bump here
        dispatch({
          type: "OPEN_OR_CREATE",
          pane: {
            id: String(roomId),
            conversationId: String(conversationId),
            peerId: String(from),
            peerName: fromName ?? (pane?.peerName || "User"),
            peerImage: fromImage ?? pane?.peerImage ?? null,
            pos: { x: 420, y: 24 },
          },
          bump: false,
        });

        // If pane is not open, append (ADD_MSG will bump once)
        // If pane is open, the room socket will append → avoid double-append
        if (!paneOpen) {
          dispatch({
            type: "ADD_MSG",
            id: String(roomId),
            msg: { paneId: String(roomId), from: String(from), body, ts: ts ?? Date.now() },
          });
        }
      });
    }

    // subscribe if needed
    if (inbox.state !== "joined" && inbox.state !== "joining") {
      inbox.subscribe((status) => {
        console.log("[inbox listener status]", status, `inbox:${me}`);
      });
    }

    // keep alive in dev/StrictMode
    return () => {};
  }, [me, dispatch]);
}
