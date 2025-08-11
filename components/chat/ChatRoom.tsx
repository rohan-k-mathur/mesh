// components/chat/ChatRoom.tsx
"use client";

import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseclient";
import type { Message, PollUI } from "@/contexts/useChatStore";
import { useChatStore } from "@/contexts/useChatStore";
import { ChatMessage, ChatMessageContent, ChatMessageAvatar } from "@/components/ui/chat-message";
import { usePrivateChatManager } from "@/contexts/PrivateChatManager";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { roomKey } from "@/lib/chat/roomKey";
import PollChip from "@/components/chat/PollChip";
import type { PollStateDTO } from "@/types/poll";

type Props = {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
  highlightMessageId?: string | null;
};


function excerpt(text?: string | null, len = 100) {
  if (!text) return null;
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > len ? t.slice(0, len - 1) + "…" : t;
}


function Attachment({ a }: { a: { id: string; path: string; type: string; size: number } }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/messages/attachments/${a.id}/sign`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(({ url }) => { if (!cancelled) setUrl(url); })
      .catch(() => { if (!cancelled) setUrl(null); });
    return () => { cancelled = true; };
  }, [a.id]);
  if (!url) return null;

  if (a.type.startsWith("image/")) {
    return <Image src={url} alt="attachment" width={256} height={256} className="rounded-md max-h-64 object-cover" />;
  }

  const name = a.path.split("/").pop();
  return (
    <a href={url} download={name || undefined} className="flex items-center gap-2 text-blue-600 underline">
      <span>📎</span>
      <span>{(a.size / 1024).toFixed(1)} KB</span>
    </a>
  );
}

const MessageRow = memo(function MessageRow({
  m,
  currentUserId,
  onOpen,
  onPrivateReply,
  onCreateOptions,
  onCreateTemp,
}: {
  m: Message;
  currentUserId: string;
  onOpen: (peerId: string, peerName: string, peerImage?: string | null) => void;
  onPrivateReply?: (m: Message) => void;
  onCreateOptions: (m: Message) => void;
  onCreateTemp: (m: Message) => void;
}) {
  const isMine = String(m.senderId) === String(currentUserId);

  return (
    <ChatMessage
    type={isMine ? "outgoing" : "incoming"}
    id={m.id}
    variant="bubble"
    data-msg-id={m.id}
  >
      {!isMine && (
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer">
            <ChatMessageAvatar imageSrc={m.sender?.image || "/assets/user-helsinki.svg"} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={6}>
            <DropdownMenuItem
              onClick={() => onOpen(String(m.senderId), m.sender?.name ?? "User", m.sender?.image ?? null)}
            >
              💬 Chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPrivateReply?.(m)}>
              🔒 Reply privately with {m.sender?.name || "User"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateOptions(m)}>
              📊 Create poll (options…)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateTemp(m)}>
              🌡 Temperature check
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {m.text && <ChatMessageContent content={m.text} />}

      {m.attachments?.length ? (
        <div className="mt-2 space-y-2">
          {m.attachments.map((a) => <Attachment key={a.id} a={a} />)}
        </div>
      ) : null}

      {isMine && <ChatMessageAvatar imageSrc={m.sender?.image || "/assets/user-helsinki.svg"} />}
    </ChatMessage>
  );
});

export default function ChatRoom({ conversationId, currentUserId, initialMessages, highlightMessageId }: Props) {
  const { open, state } = usePrivateChatManager();

  const handleOpen = useCallback(
    (peerId: string, peerName: string, peerImage?: string | null) => {
      // symmetric id so both sides land in the same room
      const rid = roomKey(conversationId, currentUserId, peerId);
      open(peerId, peerName, conversationId, { roomId: rid, peerImage: peerImage ?? null });
    },
    [open, conversationId, currentUserId]
  );

  const allMessages = useChatStore((s) => s.messages); // stable selector
  const messages = React.useMemo(
    () => allMessages[conversationId] ?? [],
    [allMessages, conversationId]
  );
  const setMessages = useChatStore((s) => s.setMessages);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const pollsByMessageId = useChatStore((s) => s.pollsByMessageId);
  const upsertPoll = useChatStore((s) => s.upsertPoll);
  const applyPollState = useChatStore((s) => s.applyPollState);
  const setMyVote = useChatStore((s) => s.setMyVote);

  const appendRef = useRef(appendMessage);
  useEffect(() => { appendRef.current = appendMessage; }, [appendMessage]);

  const initRef = useRef<string | null>(null);
  useEffect(() => {
    if (initRef.current === conversationId) return;
    setMessages(conversationId, initialMessages);
    initRef.current = conversationId;
  }, [conversationId, setMessages, initialMessages]);

  useEffect(() => {
    const channel = supabase.channel(`conversation-${conversationId}`);
    const handler = ({ payload }: any) => appendRef.current(conversationId, payload as Message);
    channel.on("broadcast", { event: "new_message" }, handler);
    channel.on("broadcast", { event: "poll_create" }, ({ payload }) => {
      upsertPoll(payload.poll, payload.state ?? null, payload.my ?? null);
    });
    channel.on("broadcast", { event: "poll_state" }, ({ payload }) => {
      applyPollState(payload as PollStateDTO);
    });
    channel.subscribe();
    return () => {
      try {
        channel.unsubscribe?.();
      } catch {}
      supabase.removeChannel(channel);
    };
  }, [conversationId, upsertPoll, applyPollState]);


  const onPrivateReply = useCallback((m: Message) => {
    const authorId = String(m.senderId);
    if (authorId === String(currentUserId)) return;
    const rid = roomKey(conversationId, currentUserId, authorId);
    open(authorId, m.sender?.name ?? "User", conversationId, {
      roomId: rid,
      peerImage: m.sender?.image ?? null,
      anchor: {
        messageId: m.id,
        messageText: excerpt(m.text),
        authorId,
        authorName: m.sender?.name ?? "User",
        conversationId,
      },
    });
  }, [conversationId, currentUserId, open]);

  const onCreateOptions = useCallback(
    async (m: Message) => {
      const options: string[] = [];
      for (let i = 0; i < 4; i++) {
        const val = window.prompt(`Option ${i + 1}`);
        if (!val) break;
        options.push(val);
      }
      if (options.length < 2) return;
      const { poll } = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messageId: m.id,
          kind: "OPTIONS",
          options,
        }),
      }).then((r) => r.json());
      upsertPoll(poll, null, null);
      supabase
        .channel(`conversation-${conversationId}`)
        .send({ type: "broadcast", event: "poll_create", payload: { poll, state: null, my: null } });
    },
    [conversationId, upsertPoll]
  );

  const onCreateTemp = useCallback(
    async (m: Message) => {
      const { poll } = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, messageId: m.id, kind: "TEMP" }),
      }).then((r) => r.json());
      upsertPoll(poll, null, null);
      supabase
        .channel(`conversation-${conversationId}`)
        .send({ type: "broadcast", event: "poll_create", payload: { poll, state: null, my: null } });
    },
    [conversationId, upsertPoll]
  );

  const onVote = useCallback(
    async (poll: PollUI, body: any) => {
      const { state } = await fetch(`/api/polls/${poll.poll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: poll.kind, ...body }),
      }).then((r) => r.json());
      applyPollState(state);
      if (poll.kind === "OPTIONS") {
        setMyVote({ kind: "OPTIONS", pollId: poll.poll.id, optionIdx: body.optionIdx });
      } else {
        setMyVote({ kind: "TEMP", pollId: poll.poll.id, value: body.value });
      }
      supabase
        .channel(`conversation-${conversationId}`)
        .send({ type: "broadcast", event: "poll_state", payload: state });
    },
    [applyPollState, setMyVote, conversationId]
  );

  useEffect(() => {
    if (!highlightMessageId) return;
    const el = document.querySelector(`[data-msg-id="${highlightMessageId}"]`) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.classList.add("ring-2", "ring-indigo-400", "ring-offset-2");
      setTimeout(() => el.classList.remove("ring-2", "ring-indigo-400", "ring-offset-2"), 2000);
    }
  }, [highlightMessageId, messages.length]);


  return (
    <div className="space-y-3">
       {messages.map((m) => {
        const panes = Object.values(state.panes);
        const anchored = panes.find(
          (p) => p.anchor?.messageId === m.id && p.peerId === String(m.senderId)
        );
        return (
          <div key={m.id} className="space-y-1" data-msg-id={m.id}>
            <MessageRow
              m={m}
              currentUserId={currentUserId}
              onOpen={handleOpen}
              onPrivateReply={onPrivateReply}
              onCreateOptions={onCreateOptions}
              onCreateTemp={onCreateTemp}
            />
            {pollsByMessageId[m.id] && (
              <PollChip
                poll={pollsByMessageId[m.id]}
                onVote={(body) => onVote(pollsByMessageId[m.id], body)}
              />
            )}
            {anchored && (
              <button
                className="text-[11px] px-2 py-[2px] rounded bg-white/70 border hover:bg-white"
                onClick={() =>
                  open(anchored.peerId, anchored.peerName, conversationId, {
                    roomId: anchored.id,
                    peerImage: anchored.peerImage ?? null,
                  })
                }
                title="Open private side chat"
              >
                Side chat
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
