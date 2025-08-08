"use client";
import { useEffect } from "react";
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
import { useChatStore } from "@/contexts/useChatStore";

interface UserLite {
  name: string;
  image: string | null;
}

interface MessageData {
  id: string;
  text: string | null;
  createdAt: string;
  senderId: string;
  sender: UserLite;
  attachments?: { id: string; path: string; type: string; size: number }[];
}

// ChatRoom.tsx
interface Props {
  conversationId: string;
  currentUserId: string;
  initialMessages: MessageData[];
}

export default function ChatRoom({
  conversationId,
  currentUserId,
  initialMessages,
}: Props) {
  const { appendMessage, setMessages, messages } = useChatStore((s) => ({
    appendMessage: s.appendMessage,
    setMessages: s.setMessages,
    messages: s.messages[conversationId.toString()] || [],
  }));
  const { open } = usePrivateChatManager();

  useEffect(() => {
    setMessages(conversationId.toString(), initialMessages);
  }, [conversationId, initialMessages, setMessages]);

  useEffect(() => {
    const channel = supabase.channel(`conversation-${conversationId.toString()}`);
    channel.on("broadcast", { event: "new_message" }, ({ payload }) => {
      appendMessage(conversationId.toString(), payload as MessageData);
    });
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, appendMessage]);

  return (
    <div className="space-y-3">
      {messages.map((m) => (
        
        <ChatMessage
          key={m.id}
          type={m.senderId === currentUserId.toString() ? "outgoing" : "incoming"}
          variant="bubble"
          id={m.id}
        >
          <ChatMessageContent content={m.text ?? ""} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ChatMessageAvatar
                imageSrc={m.sender.image || "/assets/user-helsinki.svg"}
                className="cursor-pointer"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
          onClick={() =>
            open(
              BigInt(m.senderId),
              m.sender.name,
              conversationId
            )
          }
          disabled={m.senderId === currentUserId.toString()}
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
