"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
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
import { File as FileIcon } from "lucide-react";

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
    a: { path: string; type: string; size: number };
  }) {
    const [url, setUrl] = useState<string | null>(null);
    useEffect(() => {
      supabase.storage
        .from("message-attachments")
        .createSignedUrl(a.path, 60 * 60)
        .then(({ data }) => setUrl(data?.signedUrl || null));
    }, [a.path]);
    if (!url) return null;
    const isImage = a.type.startsWith("image/");
    if (isImage) {
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
        <FileIcon className="w-4 h-4" />
        <span>{formatBytes(a.size)}</span>
      </a>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((m) => (
        <ChatMessage
          key={m.id}
          type={m.senderId === currentUserId.toString() ? "outgoing" : "incoming"}
          variant="bubble"
          id={m.id}
        >
          {m.text && <ChatMessageContent content={m.text} />}
          {m.attachments && m.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {m.attachments.map((a) => (
                <Attachment key={a.id} a={a} />
              ))}
            </div>
          )}
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
                  open(BigInt(m.senderId), m.sender.name, conversationId)
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
