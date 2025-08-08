"use client";
import { useState } from "react";
import { useChatStore } from "@/contexts/useChatStore";

interface Props { conversationId: string }


export default function MessageForm({ conversationId }: Props) {
  const [text, setText] = useState("");
  const sendMessage = useChatStore((s) => s.sendMessage);
  async function send() {
    if (!text.trim()) return;
    const form = new FormData();
    form.append("text", text);
    await sendMessage(conversationId.toString(), form);
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
