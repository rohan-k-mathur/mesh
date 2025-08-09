"use client";

import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseclient";
import type { Message } from "@/contexts/useChatStore";
import { useChatStore } from "@/contexts/useChatStore";
import { ChatMessage, ChatMessageContent, ChatMessageAvatar } from "@/components/ui/chat-message";
import { usePrivateChatManager } from "@/contexts/PrivateChatManager";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

type Props = {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
};

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(1)} ${units[i]}`;
}

function Attachment({
  a,
}: {
  a: { id: string; path: string; type: string; size: number };
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/messages/attachments/${a.id}/sign`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(({ url }) => {
        if (!cancelled) setUrl(url);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [a.id]);

  if (!url) return null;

  if (a.type.startsWith("image/")) {
    return (
      <Image
        src={url}
        alt="attachment"
        width={256}
        height={256}
        className="rounded-md max-h-64 object-cover"
      />
    );
  }

  const name = a.path.split("/").pop();
  return (
    <a
      href={url}
      download={name || undefined}
      className="flex items-center gap-2 text-blue-600 underline"
    >
      {/* you can swap to lucide-react icon if you prefer */}
      <span>📎</span>
      <span>{formatBytes(a.size)}</span>
    </a>
  );
}
const MessageRow = memo(function MessageRow({
  m,
  currentUserId,
  conversationId,          // <-- add this
  onOpen,                  // <-- pass a callback from parent (cleaner)
}: {
  m: Message;
  currentUserId: string;
  conversationId: string;
  onOpen: (peerId: string, peerName: string) => void;
}) {
  const isMine = String(m.senderId) === String(currentUserId);

  return (
    <ChatMessage type={isMine ? "outgoing" : "incoming"} id={m.id} variant="bubble">
      {!isMine && (
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer">
            <ChatMessageAvatar imageSrc={m.sender?.image || "/assets/user-helsinki.svg"} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={6}>
            <DropdownMenuItem
              onClick={() => onOpen(String(m.senderId), m.sender?.name ?? "User")}
            >
              💬 Chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {m.text && <ChatMessageContent content={m.text} />}
  
      {m.attachments?.length ? (
        <div className="mt-2 space-y-2">
          {m.attachments.map((a) => (
            <Attachment key={a.id} a={a} />
          ))}
        </div>
      ) : null}
  
      {/* Outgoing: avatar on the right */}
      {isMine && (
        <ChatMessageAvatar
          imageSrc={m.sender?.image || "/assets/user-helsinki.svg"}
        />
      )}
    </ChatMessage>
  );
});

export default function ChatRoom({
  conversationId,
  currentUserId,
  initialMessages,
}: Props) {
  const { open } = usePrivateChatManager();
  const handleOpen = useCallback(
    (peerId: string, peerName: string, peerImage?: string | null) => {
      open(peerId, peerName, conversationId, { peerImage }); // <- pass image so the dock tab can show it
    },
    [open, conversationId]
  );


  // Selectors split to avoid new object each render
  const messages = useChatStore(
    useCallback((s) => s.messages[conversationId] ?? [], [conversationId])
  );
  const setMessages = useChatStore((s) => s.setMessages);
  const appendMessage = useChatStore((s) => s.appendMessage);

  // Keep a ref to the append function to avoid stale closures in the socket handler
  const appendRef = useRef(appendMessage);
  useEffect(() => {
    appendRef.current = appendMessage;
  }, [appendMessage]);

  // Hydrate exactly once per conversation
  const initRef = useRef<string | null>(null);
  useEffect(() => {
    if (initRef.current === conversationId) return;
    setMessages(conversationId, initialMessages);
    initRef.current = conversationId;
  }, [conversationId, setMessages, initialMessages]);

  // Stable Realtime subscription
  useEffect(() => {
    const channel = supabase.channel(`conversation-${conversationId}`);
    const handler = ({ payload }: any) => {
      // server payload already JSON-safe; attachments may be missing -> store normalizes to []
      appendRef.current(conversationId, payload as Message);
    };

    channel.on("broadcast", { event: "new_message" }, handler);
    channel.subscribe();

    return () => {
      try {
        channel.unsubscribe?.();
      } catch {}
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return (
    <div className="space-y-3">
      {messages.map((m) => (
        <MessageRow key={m.id} m={m} currentUserId={currentUserId} 
        conversationId={conversationId}     // <-- pass it
        onOpen={handleOpen}                 
        />
      ))}
    </div>
  );
}
