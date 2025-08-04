"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { NickCompleter } from "./NickCompleter";

dayjs.extend(relativeTime);

interface RVW {
  id: string;
  user: string;
  text: string;
  at: string;
}

export function ReviewPane({ stallId }: { stallId: number }) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<RVW[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const handleSelect = (nick: string) =>
    setInput(prev => `${prev}@${nick} `);

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
    <div className="flex flex-col max-h-[15rem] h-full w-[50%] border-[1px] border-white bg-white/50 shadow-xl  rounded-xl ">
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
            <span className="ml-2 text-xs text-gray-500">
              {dayjs(m.at).fromNow()}
            </span>
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
          className="flex-1 border-[2px] border-slate-300 rounded px-2 py-2 text-sm"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Leave Reviews, Testimonials, Feedback and Comments Here..."
          autoFocus
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="likebutton bg-white bg-opacity-50 px-3  py-2 border-[2px] border-slate-300  disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
