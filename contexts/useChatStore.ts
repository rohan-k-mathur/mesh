"use client";
import { create } from "zustand";
import type { PollDTO, PollStateDTO, MyVoteDTO } from "@/types/poll";

export interface Attachment {
  id: string;
  path: string;
  type: string;
  size: number;
}

export type ReactionAgg = { emoji: string; count: number; mine: boolean };

// ---- Sheaf-aware Message type (you already had this; kept here for clarity)
export interface Message {
  id: string;
  text: string | null;
  createdAt: string;
  senderId: string;
  sender?: { name: string; image: string | null };
  attachments?: Attachment[];

  facets?: {
    id: string;
    audience: any; // or AudienceSelector
    sharePolicy: "ALLOW" | "REDACT" | "FORBID";
    expiresAt: string | null;
    body: any;
    attachments?: any[];
    priorityRank: number;
    createdAt: string;
  }[];
  defaultFacetId?: string | null;
  isRedacted?: boolean;
   meta?: any;           // 👈 allow anchors to carry drift info
    driftId?: string | null;
}

interface Conversation {
  id: string;
  title?: string | null;
}
export type DriftUI = {
  drift: {
    id: string;
    conversationId: string;
    title: string;
    isClosed: boolean;
    isArchived: boolean;
    messageCount: number;
    lastMessageAt: string | null;
    anchorMessageId: string;
  };
  my?: { collapsed: boolean; pinned: boolean; muted: boolean; lastReadAt: string | null };
};


export type PollUI =
  | { kind: "OPTIONS"; poll: PollDTO; totals: number[]; count: number; myVote: number | null }
  | { kind: "TEMP"; poll: PollDTO; avg: number; count: number; myValue: number | null };

function normalizeMessage(incoming: any): Message {
  // tolerate both envelope {message:{...}} and bare message {...}
  const raw = incoming?.message ?? incoming;

  const base: Message = {
    id: String(raw.id),
    text: raw.text ?? null,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    senderId: String(raw.senderId),
    sender: raw.sender ?? undefined,
    attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
    defaultFacetId: raw.defaultFacetId ?? null,
  };

  if (Array.isArray(raw.facets)) {
    base.facets = raw.facets
      .map((f: any) => ({
        id: String(f.id),
        audience: f.audience,
        sharePolicy: f.sharePolicy,
        expiresAt: f.expiresAt ?? null,
        body: f.body,
        attachments: Array.isArray(f.attachments) ? f.attachments : [],
        priorityRank:
          typeof f.priorityRank === "number"
            ? f.priorityRank
            : 999, // last if unspecified
        createdAt: f.createdAt ?? base.createdAt,
      }))
      .sort((a, b) => a.priorityRank - b.priorityRank);
  }

  return base;
}

interface ChatState {
  conversations: Record<string, Conversation>;
  currentConversation?: string;
  messages: Record<string, Message[]>;
  pollsByMessageId: Record<string, PollUI>;
  setCurrentConversation: (id: string) => void;
  setConversations: (list: Conversation[]) => void;
  setMessages: (id: string, msgs: Message[] | any[]) => void;
  appendMessage: (id: string, msg: Message | any) => void;
  setPolls: (conversationId: string, polls: PollUI[]) => void;
  upsertPoll: (poll: PollDTO, initState: PollStateDTO | null, myVote: MyVoteDTO | null) => void;
  applyPollState: (state: PollStateDTO) => void;
  setMyVote: (my: MyVoteDTO) => void;
  sendMessage: (id: string, data: FormData) => Promise<void>;
  reactionsByMessageId: Record<string, ReactionAgg[]>;
  setReactions: (messageId: string, items: ReactionAgg[]) => void;
  applyReactionDelta: (messageId: string, emoji: string, op: 'add'|'remove', byMe: boolean) => void;
  driftsByAnchorId: Record<string, DriftUI>;
  driftMessages: Record<string /*driftId*/, any[]>;
  setDrifts: (items: DriftUI[]) => void;
  upsertDrift: (item: DriftUI) => void;
  setDriftMessages: (driftId: string, rows: any[]) => void;
  appendDriftMessage: (driftId: string, msg: any) => void;
  updateDriftCounters: (driftId: string, patch: { messageCount?: number; lastMessageAt?: string | null }) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: {},
  messages: {},
  pollsByMessageId: {},
  reactionsByMessageId: {},
  setCurrentConversation: (id) => set({ currentConversation: id }),

  setConversations: (list) =>
    set({ conversations: Object.fromEntries(list.map((c) => [c.id, c])) }),

  setMessages: (id, msgs) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [id]: (msgs ?? []).map((m) => {
          const normalized = normalizeMessage(m);
          return { ...normalized, attachments: normalized.attachments ?? [] };
        }),
      },
    })),

    setReactions: (messageId, items) =>
    set((state) => ({
      reactionsByMessageId: { ...state.reactionsByMessageId, [messageId]: items },
    })),

    applyReactionDelta: (messageId, emoji, op, byMe) =>
    set((state) => {
      const current = state.reactionsByMessageId[messageId] ?? [];
      const idx = current.findIndex((r) => r.emoji === emoji);
      if (idx === -1) {
        if (op === 'add') {
          const next = [...current, { emoji, count: 1, mine: byMe }];
          return { reactionsByMessageId: { ...state.reactionsByMessageId, [messageId]: next } };
        }
        return {}; // removing a non-existent agg: ignore
      }
      const row = { ...current[idx] };
      row.count += (op === 'add' ? 1 : -1);
      if (row.count < 0) row.count = 0;
      if (byMe) row.mine = (op === 'add');
      const next = current.slice();
      if (row.count === 0) next.splice(idx, 1);
      else next[idx] = row;
      return { reactionsByMessageId: { ...state.reactionsByMessageId, [messageId]: next } };
    }),

  appendMessage: (id, msg) =>
    set((state) => {
      const list = state.messages[id] || [];
      const normalized = normalizeMessage(msg);
      if (list.some((m) => m.id === normalized.id)) {
        return { messages: state.messages };
      }
      return {
        messages: {
          ...state.messages,
          [id]: [...list, { ...normalized, attachments: normalized.attachments ?? [] }],
        },
      };
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
    const msg = await res.json();
    get().appendMessage(id, msg);
  },
  driftsByAnchorId: {},
  driftMessages: {},
  setDrifts: (items) =>
    set((s) => {
      const copy = { ...s.driftsByAnchorId };
      items.forEach((it) => (copy[it.drift.anchorMessageId] = it));
      return { driftsByAnchorId: copy };
    }),
  upsertDrift: (item) =>
    set((s) => ({
      driftsByAnchorId: { ...s.driftsByAnchorId, [item.drift.anchorMessageId]: item },
    })),
  setDriftMessages: (driftId, rows) =>
    set((s) => ({ driftMessages: { ...s.driftMessages, [driftId]: rows } })),
  appendDriftMessage: (driftId, msg) =>
    set((s) => {
      const list = s.driftMessages[driftId] ?? [];
      return { driftMessages: { ...s.driftMessages, [driftId]: [...list, msg] } };
    }),
  updateDriftCounters: (driftId, patch) =>
    set((s) => {
      // find the anchor entry that points to this drift
      const entries = Object.entries(s.driftsByAnchorId);
      const found = entries.find(([, v]) => v.drift.id === driftId);
      if (!found) return {};
      const [anchorId, v] = found;
      return {
        driftsByAnchorId: {
          ...s.driftsByAnchorId,
          [anchorId]: {
            ...v,
            drift: {
              ...v.drift,
              messageCount: patch.messageCount ?? v.drift.messageCount,
              lastMessageAt: patch.lastMessageAt ?? v.drift.lastMessageAt,
            },
          },
        },
      };
    }),
  
}));
