"use client";
import Draggable from "react-draggable";
import { useState } from "react";
import { usePrivateChatSocket } from "@/hooks/usePrivateChatSocket";
import { usePrivateChatManager, Msg } from "@/contexts/PrivateChatManager";

export default function PrivateChatPane({
  pane,
}: {
  pane: {
    id: string;
    peerId: bigint;
    peerName: string;
    msgs: Msg[];
    minimised: boolean;
    pos: { x: number; y: number };
  };
}) {
  const { dispatch } = usePrivateChatManager();
  const selfId = 0n;

  const [text, setText] = useState("");
  const send = usePrivateChatSocket(pane.id, (m) =>
    dispatch({ type: "ADD_MSG", id: pane.id, msg: m })
  );

  const handleSend = () => {
    if (!text.trim()) return;
    const msg: Msg = { paneId: pane.id, from: 0n, body: text, ts: Date.now() };
    dispatch({ type: "ADD_MSG", id: pane.id, msg });
    send(text, 0n);
    setText("");
  };

  return (
    <Draggable
      handle=".esp-header"
      defaultPosition={pane.pos}
      // onStop={(_, data) => dispatch({ type: "SET_POS", id: pane.id, pos: { x: data.x, y: data.y } })}
      onStop={(_, data) =>
        dispatch({
          type: "SET_POS",
          id: pane.id,
          pos: { x: data.x, y: data.y },
        })
      }
    >
      <div
        className="fixed  inset-4 z-[9999] w-80 h-[400px] rounded-xl bg-slate-200/10 backdrop-blur-md
      border-[1px] border-white shadow-xl flex flex-col"
      >
        <div className="esp-header flex justify-between items-center bg-white px-2 py-2 rounded-lg border-none">
          <span className="tracking-wide px-2">Chat</span>
          <div className="space-x-1">
            <button onClick={() => dispatch({ type: "MINIMISE", id: pane.id })}>
              -
            </button>
            <button onClick={() => dispatch({ type: "CLOSE", id: pane.id })}>
              ×
            </button>
          </div>
        </div>
        {!pane.minimised && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0 ">
              {pane.msgs.map((m, i) => {
                const isSelf = m.from === selfId;
                return (
                  <div key={i}>
                    <span className="font-semibold">
                      {isSelf ? "You" : pane.peerName || `User ${pane.peerId}`}:
                    </span>{" "}
                    {m.body}
                  </div>
                );
              })}
            </div>
            <hr className="border-indigo-300"></hr>
            <div className="px-2 py-4 border-t flex">
              <input
                className="flex-1 border px-4 py-2 rounded-xl searchfield text-[.9rem]"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button className="ml-2 savebutton rounded-full p-2 text-[.9rem] bg-white/20" onClick={handleSend}>
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </Draggable>
  );
}
