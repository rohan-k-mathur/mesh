"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";

interface Msg {
  id: string;
  user: string;
  text: string;
  at: string;
}

export function ChatPane({ stallId }: { stallId: number }) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const es = new EventSource(`/swapmeet/api/stall/${stallId}/events`);
    es.onmessage = e => {
      const data = JSON.parse(e.data);
      if (data.chat) {
        setMsgs(prev => [...prev, ...data.chat]);
      }
    };
    return () => es.close();
  }, [stallId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function send() {
    const txt = input.trim();
    if (!txt) return;
    setInput("");
    await fetch("/swapmeet/api/chat", {
      method: "POST",
      body: JSON.stringify({ stallId, text: txt }),
    });
  }

  return (
    <div className="flex flex-col h-full w-[50%] border-2 border-white rounded-xl ">
      <div className="flex-1 overflow-y-auto space-y-1 px-4 py-2">
        {msgs.map(m => (
          <p
            key={m.id}
            className={
              m.user === user?.displayName
                ? "text-right text-[var(--ubz-brand)]"
                : "text-gray-800"
            }
          >
            <span className="font-medium">{m.user}: </span>
            {m.text}
          </p>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={e => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2 border-t p-2"
      >
        <input
          className="flex-1 border rounded px-2 py-1 text-sm"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Say something…"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="btn-primary px-3 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
