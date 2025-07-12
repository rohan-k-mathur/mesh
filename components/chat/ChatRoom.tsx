"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseclient";
import {
  ChatMessage,
  ChatMessageAvatar,
  ChatMessageContent,
} from "@/components/ui/chat-message";
import Image from "next/image";

interface UserLite {
  name: string;
  image: string | null;
}

interface MessageData {
  id: string;
  text: string;
  created_at: string;
  sender_id: string;
  sender: UserLite;
}

interface Props {
  conversationId: bigint;
  currentUserId: bigint;
  initialMessages: MessageData[];
}

export default function ChatRoom({
  conversationId,
  currentUserId,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<MessageData[]>(initialMessages);

  useEffect(() => {
    const channel = supabase.channel(`conversation-${conversationId.toString()}`);
    channel.on("broadcast", { event: "new-message" }, ({ payload }) => {
      setMessages((prev) => [...prev, payload as MessageData]);
    });
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return (
    <div className="space-y-2">
      {messages.map((m) => (
        <ChatMessage
          key={m.id}
          type={m.sender_id === currentUserId.toString() ? "outgoing" : "incoming"}
          variant="bubble"
          id={m.id}
        >
          <ChatMessageAvatar imageSrc={m.sender.image || "/assets/user-helsinki.svg"} />
          <ChatMessageContent content={m.text} />
        </ChatMessage>
      ))}
    </div>
  );
}
