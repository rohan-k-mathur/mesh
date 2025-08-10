// components/chat/PrivateChatPane.tsx
"use client";
import Draggable from "react-draggable";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePrivateChatSocket } from "@/hooks/usePrivateChatSocket";
import { usePrivateChatManager, Msg } from "@/contexts/PrivateChatManager";
import Image from "next/image";
import { useAuth } from "@/lib/AuthContext";
import { dmRoomId } from "@/lib/chat/roomId";
// components/chat/PrivateChatPane.tsx
type PaneProps = {
  pane: {
    id: string;                   // roomId
    conversationId: string;       // make sure Pane includes this
    peerId: string;
    peerName: string;
    peerImage?: string | null;
    msgs: Msg[];
    minimised: boolean;
    pos: { x: number; y: number };
  };
  currentUserId?: string;
  currentUserName?: string | null;
  currentUserImage?: string | null;
};


export default function PrivateChatPane({
  pane,
  currentUserId,
  currentUserName,
  currentUserImage,
}: PaneProps) {
  const { dispatch } = usePrivateChatManager();
   // NEVER end up as "", fallback only if falsy


  const [text, setText] = useState("");
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  
  const selfId =
  currentUserId ??
  (user?.userId ? String(user.userId) : undefined) ??
  ((typeof window !== "undefined" ? String((window as any).__ME_ID__ || "") : "") ||
  "me"); // last-resort dev fallback

const meName =
  currentUserName ??
  user?.name ??
  (user as any)?.username ??
  (typeof window !== "undefined" ? (window as any).__ME_NAME__ ?? null : null);

const meImage =
  currentUserImage ??
  user?.image ??
  (typeof window !== "undefined" ? (window as any).__ME_IMAGE__ ?? null : null);

  useEffect(() => {
    console.log("[pane mount]", {
      roomId: pane.id,
      conversationId: pane.conversationId,
      selfId,
      peerId: pane.peerId,
      meName,
      meImage
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
const { sendOpen, sendMessage } = usePrivateChatSocket(
  {
    roomId: pane.id,
    conversationId: pane.conversationId,
    meId: selfId,               // <-- REAL id, not "me"
    peerId: pane.peerId,
    meName,
    meImage,
  },
  (evt) => {
    if (evt.kind === "message") {
      dispatch({
        type: "ADD_MSG",
        id: pane.id,
        msg: { paneId: pane.id, from: evt.from, body: evt.body, ts: evt.ts },
      });
    }
  }
);

// Call sendOpen exactly once per mount
const openedRef = React.useRef(false);
useEffect(() => {
  if (openedRef.current) return;
  openedRef.current = true;
  sendOpen();
}, [sendOpen]);


  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [pane.msgs.length]);

  const handleSend = () => {
    const body = text.trim();
    if (!body) return;
    dispatch({
      type: "ADD_MSG",
      id: pane.id,
      msg: { paneId: pane.id, from: selfId, body, ts: Date.now() },
    });
    sendMessage(body);
    setText("");
  };

  const title = useMemo(
    () => `Chat with ${pane.peerName || `User ${pane.peerId}`}`,
    [pane.peerName, pane.peerId]
  );
  useEffect(() => {
    console.log("[pane mount]", { roomId: pane.id, conversationId: pane.conversationId, selfId, peerId: pane.peerId });
  }, []);
  

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".pcp-header"
      position={pane.pos}
      cancel=".pcp-input,button,a"
      onStop={(_, d) =>
        dispatch({ type: "SET_POS", id: pane.id, pos: { x: d.x, y: d.y } })
      }
    >
      <div
        ref={nodeRef}
        className="fixed pointer-events-auto w-80 h-[400px] rounded-xl bg-slate-200/10 backdrop-blur-md border border-white shadow-xl flex flex-col"
      >
        <div className="pcp-header flex items-center justify-between bg-white/80 px-2 py-1 rounded-t-xl cursor-move">
          <span className="flex items-center gap-2 tracking-wide px-2 text-sm font-medium">
            {pane.peerImage ? (
              <Image
                src={pane.peerImage}
                alt=""
                width={20}
                height={20}
                className="rounded-full object-cover"
              />
            ) : (
              <span className="inline-block w-5 h-5 rounded-full bg-slate-300" />
            )}
            {title}
          </span>
          <div className="space-x-1">
            <button
              onClick={() => dispatch({ type: "MINIMISE", id: pane.id })}
              className="rounded px-2 py-1 hover:bg-black/5"
              aria-label="Minimize"
            >
              –
            </button>
            <button
              onClick={() => dispatch({ type: "CLOSE", id: pane.id })}
              className="rounded px-2 py-1 hover:bg-black/5"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {!pane.minimised && (
          <>
            <div
              ref={messagesRef}
              className="flex flex-col flex-1 overflow-y-auto px-4 py-3 space-y-2 text-sm text-slate-700 break-words"
            >
              {pane.msgs.map((m, i) => {
                const isSelf = String(m.from) === selfId;
                return (
                  <div
                    key={i}
                    className={`flex ${
                      isSelf ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`px-2 py-[.2rem] rounded-xl max-w-[70%] ${
                        isSelf
                          ? "bg-indigo-100 text-right"
                          : "bg-white text-left"
                      }`}
                    >
                      {m.body}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-2 py-3 border-t flex">
              <input
                className="pcp-input bg-white/80 flex-1 border px-3 py-2 rounded-xl text-sm outline-none"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Send a message…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                className="ml-2 rounded-xl px-3 py-1 text-sm text-slate-700 bg-white/80"
                onClick={handleSend}
                disabled={!text.trim()}
              >
                <Image
                  src="/assets/send--alt.svg"
                  alt="send"
                  width={20}
                  height={20}
                />
              </button>
            </div>
          </>
        )}
      </div>
    </Draggable>
  );
}
