"use client";
import Draggable from "react-draggable";
import { useState } from "react";
import { usePrivateChatSocket } from "@/hooks/usePrivateChatSocket";
import { usePrivateChatManager, Msg } from "@/contexts/PrivateChatManager";

export default function PrivateChatPane({ pane }: { pane: { id: string; peerId: bigint; msgs: Msg[]; minimised: boolean; pos: { x: number; y: number } } }) {
  const { dispatch } = usePrivateChatManager();
  const [text, setText] = useState("");
  const send = usePrivateChatSocket(pane.id, (m) => dispatch({ type: "ADD_MSG", id: pane.id, msg: m }));

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
      position={pane.pos}
      onStop={(_, data) => dispatch({ type: "SET_POS", id: pane.id, pos: { x: data.x, y: data.y } })}
    >
      <div className="fixed z-50 w-80 h-[420px] bg-white border shadow flex flex-col">
        <div className="esp-header flex justify-between items-center bg-gray-200 px-2 py-1">
          <span>Chat</span>
          <div className="space-x-1">
            <button onClick={() => dispatch({ type: "MINIMISE", id: pane.id })}>_</button>
            <button onClick={() => dispatch({ type: "CLOSE", id: pane.id })}>×</button>
          </div>
        </div>
        {!pane.minimised && (
          <>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {pane.msgs.map((m, i) => (
                <div key={i}>{m.body}</div>
              ))}
            </div>
            <div className="p-2 border-t flex">
              <input
                className="flex-1 border px-2 py-1"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button className="ml-2" onClick={handleSend}>
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </Draggable>
  );
}
