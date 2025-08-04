"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseclient";
import {
  ChatMessage,
  ChatMessageAvatar,
  ChatMessageContent,
} from "@/components/ui/chat-message";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePrivateChatManager } from "@/contexts/PrivateChatManager";

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
  const { open } = usePrivateChatManager();

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
    <div className="space-y-3">
      {messages.map((m) => (
        
        <ChatMessage
          key={m.id}
          type={m.sender_id === currentUserId.toString() ? "outgoing" : "incoming"}
          variant="bubble"
          id={m.id}
        >
          <ChatMessageContent content={m.text} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ChatMessageAvatar
                imageSrc={m.sender.image || "/assets/user-helsinki.svg"}
                className="cursor-pointer"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => open(BigInt(m.sender_id), conversationId)}
                disabled={m.sender_id === currentUserId.toString()}
              >
                💬 Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </ChatMessage>
      ))}
    </div>
  );
}
