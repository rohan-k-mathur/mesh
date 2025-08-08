// "use client";
// import Draggable from "react-draggable";
// import { useState } from "react";
// import { usePrivateChatSocket } from "@/hooks/usePrivateChatSocket";
// import { usePrivateChatManager, Msg } from "@/contexts/PrivateChatManager";

// export default function PrivateChatPane({
//   pane,
// }: {
//   pane: {
//     id: string;
//     peerId: bigint;
//     peerName: string;
//     msgs: Msg[];
//     minimised: boolean;
//     pos: { x: number; y: number };
//   };
// }) {
//   const { dispatch } = usePrivateChatManager();
//   const selfId = typeof window !== "undefined" ? (window as any).__ME_ID__ ?? "me" : "me";

//   const [text, setText] = useState("");
//   const send = usePrivateChatSocket(pane.id, (m) =>
//     dispatch({ type: "ADD_MSG", id: pane.id, msg: m })
//   );

//   const handleSend = () => {
//     if (!text.trim()) return;
//     const msg: Msg = { paneId: pane.id, from: 0n, body: text, ts: Date.now() };
//     dispatch({ type: "ADD_MSG", id: pane.id, msg });
//     send(text, 0n);
//     setText("");
//   };

//   return (
//     <Draggable
//       handle=".esp-header"
//       defaultPosition={pane.pos}
//       // onStop={(_, data) => dispatch({ type: "SET_POS", id: pane.id, pos: { x: data.x, y: data.y } })}
//       onStop={(_, data) =>
//         dispatch({
//           type: "SET_POS",
//           id: pane.id,
//           pos: { x: data.x, y: data.y },
//         })
//       }
//     >
//       <div
//         className="fixed  inset-4 z-[9999] w-80 h-[400px] rounded-xl bg-slate-200/10 backdrop-blur-md
//       border-[1px] border-white shadow-xl flex flex-col"
//       >
//         <div className="esp-header flex justify-between items-center bg-white px-2 py-2 rounded-lg border-none">
//           <span className="tracking-wide px-2">Chat</span>
//           <div className="space-x-1">
//             <button onClick={() => dispatch({ type: "MINIMISE", id: pane.id })}>
//               -
//             </button>
//             <button onClick={() => dispatch({ type: "CLOSE", id: pane.id })}>
//               ×
//             </button>
//           </div>
//         </div>
//         {!pane.minimised && (
//           <>
//             <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0 ">
//               {pane.msgs.map((m, i) => {
//                 const isSelf = m.from === selfId;
//                 return (
//                   <div key={i}>
//                     <span className="font-semibold">
//                       {isSelf ? "You" : pane.peerName || `User ${pane.peerId}`}:
//                     </span>{" "}
//                     {m.body}
//                   </div>
//                 );
//               })}
//             </div>
//             <hr className="border-indigo-300"></hr>
//             <div className="px-2 py-4 border-t flex">
//               <input
//                 className="flex-1 border px-4 py-2 rounded-xl searchfield text-[.9rem]"
//                 value={text}
//                 onChange={(e) => setText(e.target.value)}
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter") {
//                     e.preventDefault();
//                     handleSend();
//                   }
//                 }}
//               />
//               <button className="ml-2 savebutton rounded-full p-2 text-[.9rem] bg-white/20" onClick={handleSend}>
//                 Send
//               </button>
//             </div>
//           </>
//         )}
//       </div>
//     </Draggable>
//   );
// }
"use client";
import Draggable from "react-draggable";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePrivateChatSocket } from "@/hooks/usePrivateChatSocket";
import { usePrivateChatManager, Msg } from "@/contexts/PrivateChatManager";

type PaneProps = {
  pane: {
    id: string;
    peerId: string; // <-- string, not bigint
    peerName: string;
    msgs: Msg[];
    minimised: boolean;
    pos: { x: number; y: number };
  };
  currentUserId?: string; // <-- pass from page if you have it
};

export default function PrivateChatPane({ pane, currentUserId }: PaneProps) {
  const { dispatch } = usePrivateChatManager();

  // Resolve our own id (prefer prop, fallback to window)
  const selfId =
    (currentUserId && String(currentUserId)) ||
    (typeof window !== "undefined" ? String((window as any).__ME_ID__ ?? "me") : "me");

  const [text, setText] = useState("");
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  // Wire up ephemeral socket
  const send = usePrivateChatSocket(pane.id, (m) => {
    // m: { from: string; body: string; ts: number }
    dispatch({ type: "ADD_MSG", id: pane.id, msg: { ...m, paneId: pane.id } });
  });

  // Auto-scroll on new message
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [pane.msgs.length]);

  const handleSend = () => {
    const body = text.trim();
    if (!body) return;
    const msg: Msg = { paneId: pane.id, from: selfId, body, ts: Date.now() };
    // Optimistic append
    dispatch({ type: "ADD_MSG", id: pane.id, msg });
    // Broadcast
    send(body, selfId);
    setText("");
  };

  // Nice title
  const title = useMemo(
    () => `Chat with ${pane.peerName || `User ${pane.peerId}`}`,
    [pane.peerName, pane.peerId]
  );
  const [bounds, setBounds] = useState<{left:number; top:number; right:number; bottom:number}>();
  
  useEffect(() => {
    function calc() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const rect = nodeRef.current?.getBoundingClientRect();
      const pw = rect?.width ?? 320;   // pane width fallback
      const ph = rect?.height ?? 400;  // pane height fallback
      setBounds({ left: 0, top: 0, right: w - pw, bottom: h - ph });
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return (
<Draggable
  nodeRef={nodeRef}
  handle=".pcp-header"
  position={pane.pos}
  bounds={bounds}
  cancel=".pcp-input,button,a"
  onStop={(_, d) => dispatch({ type: "SET_POS", id: pane.id, pos: { x: d.x, y: d.y } })}
>
      <div
        ref={nodeRef}
        className="fixed pointer-events-auto  w-80 h-[400px] rounded-xl bg-slate-200/10 backdrop-blur-md
                   border border-white shadow-xl flex flex-col "
      >
        <div className="pcp-header flex justify-between items-center bg-white px-2 py-2 rounded-t-xl border-none cursor-move">
          <span className="tracking-wide px-2 text-sm font-medium">{title}</span>
          <div className="space-x-1">
            <button
              type="button"
              aria-label={pane.minimised ? "Expand" : "Minimize"}
              onClick={() => dispatch({ type: "MINIMISE", id: pane.id })}
              className="rounded px-2 py-1 hover:bg-black/5"
            >
              {pane.minimised ? "▢" : "–"}
            </button>
            <button
              type="button"
              aria-label="Close"
              onClick={() => dispatch({ type: "CLOSE", id: pane.id })}
              className="rounded px-2 py-1 hover:bg-black/5"
            >
              ×
            </button>
          </div>
        </div>

        {!pane.minimised && (
          <>
            <div
              ref={messagesRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-1 text-sm"
            >
              {pane.msgs.map((m, i) => {
                const isSelf = String(m.from) === selfId;
                return (
                  <div key={i} className="leading-5">
                    <span className="font-semibold">
                      {isSelf ? "You" : pane.peerName || `User ${pane.peerId}`}:
                    </span>{" "}
                    {m.body}
                  </div>
                );
              })}
            </div>

            <hr className="border-indigo-300/50" />

            <div className="px-2 py-3 border-t flex">
              <input
                className="pcp-input flex-1 border px-3 py-2 rounded-xl text-sm outline-none
                           focus:ring-2 focus:ring-indigo-300"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                type="button"
                className="ml-2 rounded-full px-3 py-2 text-sm bg-white/20 hover:bg-white/30"
                onClick={handleSend}
                disabled={!text.trim()}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </Draggable>
  );
}
