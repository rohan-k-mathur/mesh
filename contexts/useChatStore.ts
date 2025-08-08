"use client";
import { create } from "zustand";

interface Attachment {
  id: string;
  path: string;
  type: string;
  size: number;
}

interface Message {
  id: string;
  text: string | null;
  createdAt: string;
  senderId: string;
  attachments: Attachment[];
}

interface Conversation {
  id: string;
  title?: string | null;
}

interface ChatState {
  conversations: Record<string, Conversation>;
  currentConversation?: string;
  messages: Record<string, Message[]>;
  setCurrentConversation: (id: string) => void;
  setConversations: (list: Conversation[]) => void;
  setMessages: (id: string, msgs: Message[]) => void;
  appendMessage: (id: string, msg: Message) => void;
  sendMessage: (id: string, data: FormData) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: {},
  messages: {},
  setCurrentConversation: (id) => set({ currentConversation: id }),
  setConversations: (list) =>
    set({ conversations: Object.fromEntries(list.map((c) => [c.id, c])) }),
  setMessages: (id, msgs) =>
    set((state) => ({ messages: { ...state.messages, [id]: msgs } })),
  appendMessage: (id, msg) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [id]: [...(state.messages[id] || []), msg],
      },
    })),
  sendMessage: async (id, data) => {
    const res = await fetch(`/api/messages/${id}`, { method: "POST", body: data });
    if (!res.ok) throw new Error("Failed to send message");
    const msg = await res.json();
    get().appendMessage(id, msg);
  },
}));
