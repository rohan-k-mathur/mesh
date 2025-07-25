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
    <div className="flex gap-4 ">
      <input
        className="flex-1 border rounded-xl px-4 bg-transparent shadow-md border-black send-message-box text-black"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button className=" bg-transparent send-message-box shadow-md border border-black w-fit text-black  
       rounded-xl px-8 py-2 hover:shadow-none "
      onClick={send}>
        Send
      </button>
    </div>
  );
}
