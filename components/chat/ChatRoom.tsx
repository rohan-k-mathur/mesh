// components/chat/ChatRoom.tsx
"use client";

import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseclient";
import type { Message } from "@/contexts/useChatStore";
import { useChatStore } from "@/contexts/useChatStore";
import { ChatMessage, ChatMessageContent, ChatMessageAvatar } from "@/components/ui/chat-message";
import { usePrivateChatManager } from "@/contexts/PrivateChatManager";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { roomKey } from "@/lib/chat/roomKey";

type Props = {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
};

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
}: {
  m: Message;
  currentUserId: string;
  onOpen: (peerId: string, peerName: string, peerImage?: string | null) => void;
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
              onClick={() => onOpen(String(m.senderId), m.sender?.name ?? "User", m.sender?.image ?? null)}
            >
              💬 Chat
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

export default function ChatRoom({ conversationId, currentUserId, initialMessages }: Props) {
  const { open } = usePrivateChatManager();

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
    channel.subscribe();
    return () => { try { channel.unsubscribe?.(); } catch {} supabase.removeChannel(channel); };
  }, [conversationId]);

  return (
    <div className="space-y-3">
    {messages.map((m) => (
      <MessageRow
        key={m.id}
        m={m}
        currentUserId={currentUserId}
        onOpen={handleOpen}
      />
    ))}
  </div>
  );
}
