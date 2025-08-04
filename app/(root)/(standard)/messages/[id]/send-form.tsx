"use client";
import { useState } from "react";

interface Props {
  conversationId: bigint;
}

export default function MessageForm({ conversationId }: Props) {
  const [text, setText] = useState("");
  async function send() {
    if (!text.trim()) return;
    await fetch(`/api/messages/${conversationId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    setText("");
  }
  return (
    <div className="flex gap-8 ">
      <input
        className="flex-1 h-full bg-white bg-opacity-20 rounded-xl px-5 py-4 bg-transparent messagefield text-black"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button className=" bg-white/20 sendbutton w-fit text-black  tracking-widest text-[1.1rem] text-shadow-xl
       rounded-xl px-5 py-2 "
      onClick={send}>
        Send
      </button>
    </div>
  );
}
