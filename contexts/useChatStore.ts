"use client";
import { create } from "zustand";
import type { PollDTO, PollStateDTO, MyVoteDTO } from "@/types/poll";

export interface Attachment {
  id: string;
  path: string;
  type: string;
  size: number;
}

export interface Message {
  id: string;
  text: string | null;
  createdAt: string;
  senderId: string;
  sender?: { name: string; image: string | null };
  attachments?: Attachment[];
}
interface Conversation {
  id: string;
  title?: string | null;
}

export type PollUI =
  | { kind: "OPTIONS"; poll: PollDTO; totals: number[]; count: number; myVote: number | null }
  | { kind: "TEMP"; poll: PollDTO; avg: number; count: number; myValue: number | null };

interface ChatState {
  conversations: Record<string, Conversation>;
  currentConversation?: string;
  messages: Record<string, Message[]>;
  pollsByMessageId: Record<string, PollUI>;
  setCurrentConversation: (id: string) => void;
  setConversations: (list: Conversation[]) => void;
  setMessages: (id: string, msgs: Message[]) => void;
  appendMessage: (id: string, msg: Message) => void;
  setPolls: (conversationId: string, polls: PollUI[]) => void;
  upsertPoll: (poll: PollDTO, initState: PollStateDTO | null, myVote: MyVoteDTO | null) => void;
  applyPollState: (state: PollStateDTO) => void;
  setMyVote: (my: MyVoteDTO) => void;
  sendMessage: (id: string, data: FormData) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: {},
  messages: {},
  pollsByMessageId: {},
  setCurrentConversation: (id) => set({ currentConversation: id }),
  setConversations: (list) =>
    set({ conversations: Object.fromEntries(list.map((c) => [c.id, c])) }),

  setMessages: (id, msgs) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [id]: msgs.map((m) => ({ ...m, attachments: m.attachments ?? [] })),
      },
    })),

  appendMessage: (id, msg) =>
    set((state) => {
      const list = state.messages[id] || [];
      if (list.some((m) => m.id === msg.id)) return { messages: state.messages };
      const normalized = { ...msg, attachments: msg.attachments ?? [] };
      return { messages: { ...state.messages, [id]: [...list, normalized] } };
    }),

  setPolls: (_cid, polls) =>
    set((state) => ({
      pollsByMessageId: {
        ...state.pollsByMessageId,
        ...Object.fromEntries(polls.map((p) => [p.poll.messageId, p])),
      },
    })),

    upsertPoll: (poll, initState, myVote) =>
        set((state) => {
          if (!poll) {
            console.warn("[polls] upsertPoll called without poll", { initState, myVote });
            return {};
          }
      let ui: PollUI;
      if (poll.kind === "OPTIONS") {
        const totals =
          initState && initState.kind === "OPTIONS"
            ? initState.totals
            : new Array(poll.options?.length ?? 0).fill(0);
        const count =
          initState && initState.kind === "OPTIONS" ? initState.count : 0;
        const my =
          myVote && myVote.kind === "OPTIONS" ? myVote.optionIdx : null;
        ui = { kind: "OPTIONS", poll, totals, count, myVote: my };
      } else {
        const avg =
          initState && initState.kind === "TEMP" ? initState.avg : 0;
        const count =
          initState && initState.kind === "TEMP" ? initState.count : 0;
        const my = myVote && myVote.kind === "TEMP" ? myVote.value : null;
        ui = { kind: "TEMP", poll, avg, count, myValue: my };
      }
      return {
        pollsByMessageId: {
          ...state.pollsByMessageId,
          [poll.messageId]: ui,
        },
      };
    }),

  applyPollState: (incoming) =>
    set((state) => {
      const entryKey = Object.keys(state.pollsByMessageId).find(
        (k) => state.pollsByMessageId[k].poll.id === incoming.pollId
      );
      if (!entryKey) return {};
      const existing = state.pollsByMessageId[entryKey];
      let updated: PollUI | undefined;
      if (incoming.kind === "OPTIONS" && existing.kind === "OPTIONS") {
        updated = { ...existing, totals: incoming.totals, count: incoming.count };
      } else if (incoming.kind === "TEMP" && existing.kind === "TEMP") {
        updated = { ...existing, avg: incoming.avg, count: incoming.count };
      }
      if (!updated) return {};
      return {
        pollsByMessageId: { ...state.pollsByMessageId, [entryKey]: updated },
      };
    }),

  setMyVote: (my) =>
    set((state) => {
      const entryKey = Object.keys(state.pollsByMessageId).find(
        (k) => state.pollsByMessageId[k].poll.id === my.pollId
      );
      if (!entryKey) return {};
      const existing = state.pollsByMessageId[entryKey];
      let updated: PollUI | undefined;
      if (my.kind === "OPTIONS" && existing.kind === "OPTIONS") {
        updated = { ...existing, myVote: my.optionIdx };
      } else if (my.kind === "TEMP" && existing.kind === "TEMP") {
        updated = { ...existing, myValue: my.value };
      }
      if (!updated) return {};
      return {
        pollsByMessageId: { ...state.pollsByMessageId, [entryKey]: updated },
      };
    }),

  sendMessage: async (id, data) => {
    const res = await fetch(`/api/messages/${id}`, { method: "POST", body: data });
    if (!res.ok) throw new Error("Failed to send message");
    const msg: Message = await res.json();
    get().appendMessage(id, msg);
  },
}));
