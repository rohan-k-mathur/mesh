// components/chat/ChatRoom.tsx
"use client";

import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseclient";
import type { Message, PollUI } from "@/contexts/useChatStore";
import { useChatStore } from "@/contexts/useChatStore";
import {
  ChatMessage,
  ChatMessageContent,
  ChatMessageAvatar,
} from "@/components/ui/chat-message";
import { SheafMessageBubble } from "@/components/sheaf/SheafMessageBubble";
import { usePrivateChatManager } from "@/contexts/PrivateChatManager";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { roomKey } from "@/lib/chat/roomKey";
import PollChip from "@/components/chat/PollChip";
import QuickPollComposer from "@/components/chat/QuickPollComposer";
import type { PollStateDTO } from "@/types/poll";
import { ReactionSummary } from "@/components/reactions/ReactionSummary";
import { ReactionBar } from "@/components/reactions/ReactionBar";
import { ReactionTrigger } from "@/components/reactions/ReactionTrigger";
import { DriftChip } from "@/components/chat/DriftChip";
import { DriftPane } from "@/components/chat/DriftPane";

const ENABLE_REACTIONS = false;

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

function Attachment({
  a,
}: {
  a: { id: string; path: string; type: string; size: number };
}) {
  const [url, setUrl] = useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function signWithRetry() {
      for (let i = 0; i < 4; i++) {
        try {
          const r = await fetch(`/api/messages/attachments/${a.id}/sign`);
          if (r.ok) {
            const { url } = await r.json();
            if (!cancelled) setUrl(url);
            return;
          } else {
            const txt = await r.text();
            console.warn(
              `[attachment] sign ${a.id} try ${i + 1} failed:`,
              r.status,
              txt
            );
          }
        } catch (e) {
          console.warn(
            `[attachment] sign ${a.id} network error try ${i + 1}`,
            e
          );
        }
        await new Promise((res) => setTimeout(res, 150 * (i + 1)));
      }
      if (!cancelled) setUrl(null);
    }

    signWithRetry();
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
      <span>📎</span>
      <span>{(a.size / 1024).toFixed(1)} KB</span>
    </a>
  );
}

const MessageRow = memo(function MessageRow({
  m,
  currentUserId,
  conversationId, // NEW
  onOpen,
  onPrivateReply,
  onCreateOptions,
  onCreateTemp,
  onDelete,
}: {
  m: Message;
  currentUserId: string;
  conversationId: string; // NEW
  onOpen: (peerId: string, peerName: string, peerImage?: string | null) => void;
  onPrivateReply?: (m: Message) => void;
  onCreateOptions: (m: Message) => void;
  onCreateTemp: (m: Message) => void;
  onDelete: (id: string) => void;
}) {
  const isMine = String(m.senderId) === String(currentUserId);
  const isRedacted = Boolean((m as any).isRedacted || (m as any).is_redacted);
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
            <ChatMessageAvatar
              imageSrc={m.sender?.image || "/assets/user-helsinki.svg"}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={6}>
            <DropdownMenuItem
              onClick={() =>
                onOpen(
                  String(m.senderId),
                  m.sender?.name ?? "User",
                  m.sender?.image ?? null
                )
              }
            >
              💬 Side Chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPrivateReply?.(m)}>
              🔒 Reply To {m.sender?.name || "User"}
            </DropdownMenuItem>
            {/* <DropdownMenuItem onClick={() => onCreateOptions(m)}>
               Create poll (options…)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateTemp(m)}>
               Temperature check
            </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

{isRedacted ? (
       <div className={["relative group w-full", isMine ? "flex justify-end" : "flex justify-start"].join(" ")}>
         {/* Muted tombstone bubble */}
         <ChatMessageContent
           content="(redacted)"
           className="opacity-70 italic"
         />
         {/* (Optional) you can still keep the hover menu for your own redacted msg if desired */}
       </div>
     ) : Array.isArray(m.facets) && m.facets.length > 0 ? (
  <>
    <div className={["relative group w-full", isMine ? "flex justify-end" : "flex justify-start"].join(" ")}>
      <SheafMessageBubble
        messageId={m.id}
        conversationId={conversationId}
        currentUserId={currentUserId}
        facets={m.facets as any}
        defaultFacetId={m.defaultFacetId}
      />

{/* Hover actions overlay */}
      <div
        className={[
          "absolute top-1 z-20 flex",
          isMine ? "-right-0" : "left-0",
          "invisible opacity-0 pointer-events-none",
          "group-hover:visible group-hover:opacity-100 group-hover:pointer-events-auto",
          "transition-opacity duration-150",
        ].join(" ")}
      >
     {isMine && (
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <button
                      className="py-0 align-center my-auto px-0  shadow-md hover:shadow-none w-fit h-fit 
                      rounded-md  text-xs  focus:outline-none"
                     title="Message actions"
                     type="button"
                   >
                      <Image
                src="/assets/radio-button--checked.svg"
                alt="share"
                width={28}
                height={28}
                className="cursor-pointer object-contain w-[10px]"
              />
                   </button>
                 </DropdownMenuTrigger>
                
                 <DropdownMenuContent className="flex flex-col flex-1 bg-white/30 backdrop-blur rounded-xl max-w-[400px] py-2 max-h-[500px] w-full gap-1
                h-full text-[1rem] tracking-wide"
                 align={isMine ? "end" : "start"} sideOffset={6}>
                   <DropdownMenuItem
                                         className=" rounded-xl w-full"

                     onClick={() => {
                       // Placeholder for now
                       alert("Edit is coming soon.");
                     }}
                   >
                     ✏️ Edit
                   </DropdownMenuItem>
                   <DropdownMenuItem
                     className="text-red-600 rounded-xl w-full"

                     onClick={() => onDelete(m.id)}
                   >
                     🗑 Delete
                   </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
             )}

      </div>
    </div>

    {/* Summary below the bubble */}
  </>
) : (
  <>
  <div className={["relative group w-full", isMine ? "flex justify-end" : "flex justify-start"].join(" ")}>
  {m.text ? (
              <ChatMessageContent content={m.text} />
            ) : (
              // Safety: If we ever hit a “no text, no facets” non-redacted state,
              // still render a placeholder bubble so the row doesn’t collapse.
              <ChatMessageContent content="" className="min-h-6" />
            )}

    <div
      className={[
        "absolute top-1 z-20 flex",
        "invisible opacity-0 pointer-events-none",
        "group-hover:visible group-hover:opacity-100 group-hover:pointer-events-auto",
        "transition-opacity duration-150",
      ].join(" ")}
    >
    {isMine && !isRedacted && (
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                 <button
                     className="py-0 align-center my-auto px-0  shadow-md w-fit h-fit 
                     rounded-md  text-xs hover:shadow-none focus:outline-none"
                     title="Message actions"
                     type="button"
                   >
                      <Image
                src="/assets/radio-button--checked.svg"
                alt="share"
                width={28}
                height={28}
                className="cursor-pointer object-contain w-[10px]"
              />
                   </button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent className="flex flex-col flex-1 bg-white/30 backdrop-blur rounded-xl max-w-[400px] py-2 max-h-[500px] w-full gap-1
                h-full text-[1rem] tracking-wide"
                  align={isMine ? "end" : "start"} sideOffset={6}>
                   <DropdownMenuItem className="rounded-xl w-full" onClick={() => alert("Edit is coming soon.")}>
                     ✏️ Edit
                   </DropdownMenuItem>
                   <DropdownMenuItem className="rounded-xl w-full text-red-600" onClick={() => onDelete(m.id)}>
                     🗑 Delete
                   </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
            )}
   
    </div>
  </div>

</>
      )}
      
      {isMine && (
  <ChatMessageAvatar imageSrc={m.sender?.image || "/assets/user-helsinki.svg"} />
)}
    </ChatMessage>
  );
});

export default function ChatRoom({
  conversationId,
  currentUserId,
  initialMessages,
  highlightMessageId,
}: Props) {
  const { open, state } = usePrivateChatManager();

  const driftsByAnchorId = useChatStore(s => s.driftsByAnchorId);
    const driftMessages = useChatStore((s) => s.driftMessages);
  const setDrifts = useChatStore((s) => s.setDrifts);
  const upsertDrift = useChatStore((s) => s.upsertDrift);
  const setDriftMessages = useChatStore((s) => s.setDriftMessages);
  const appendDriftMessage = useChatStore((s) => s.appendDriftMessage);

  const [openDrifts, setOpenDrifts] = useState<Record<string, boolean>>({});
  const openDrift = React.useCallback((driftId: string) => {
    setOpenDrifts((prev) => ({ ...prev, [driftId]: true }));
  }, []);
  const closeDrift = React.useCallback((driftId: string) => {
    setOpenDrifts((prev) => ({ ...prev, [driftId]: false }));
  }, []);

  const handleOpen = useCallback(
    (peerId: string, peerName: string, peerImage?: string | null) => {
      // symmetric id so both sides land in the same room
      const rid = roomKey(conversationId, currentUserId, peerId);
      open(peerId, peerName, conversationId, {
        roomId: rid,
        peerImage: peerImage ?? null,
      });
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
  const composerOpenForRef = React.useRef<string | null>(null);
  const [composerFor, setComposerFor] = useState<string | null>(null);
  const appendRef = useRef(appendMessage);
  useEffect(() => {
    appendRef.current = appendMessage;
  }, [appendMessage]);

  const markAsRedacted = React.useCallback((mid: string) => {
      const list = useChatStore.getState().messages[conversationId] ?? [];
      setMessages(
        conversationId,
        list.map((row) =>
          String(row.id) === String(mid)
            ? { ...row, isRedacted: true, is_redacted: true, text: null, attachments: [], facets: [] }
            : row
        )
      );
    }, [conversationId, setMessages]);

    const handleDelete = React.useCallback(async (mid: string) => {
        // Optimistic tombstone
        markAsRedacted(mid);
        try {
          const res = await fetch(`/api/messages/item/${encodeURIComponent(mid)}`, { method: "DELETE" });
          if (!res.ok) throw new Error(await res.text());
        } catch (e) {
          console.warn("[delete] failed; consider refetch or revert", e);
          // optionally revert here
        }
      }, [markAsRedacted]);

  const initRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (initRef.current === conversationId) return;
    setMessages(conversationId, initialMessages);
    initRef.current = conversationId;
  }, [conversationId, setMessages, initialMessages]);

  // Hydrate existing polls for the messages we just loaded (run once per convo)
  useEffect(() => {
    if (hydratedRef.current) return;
    const list = allMessages[conversationId] ?? [];
    if (!list.length) return;
    hydratedRef.current = true;
    const ids = list.map((m) => m.id);
    fetch("/api/polls/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageIds: ids }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.items)) {
          data.items.forEach((it: any) => upsertPoll(it.poll, it.state, it.my));
        }
      })
      .catch((e) => console.warn("[polls] hydrate failed:", e));
  }, [allMessages, conversationId, upsertPoll]);

  // NEW — hydrate reactions for the current message set (runs when ids change)
  const reactionsHydratedKeyRef = useRef<string>("");
  useEffect(() => {
    if (!ENABLE_REACTIONS) return;
    const idsKey = messages.map((m) => m.id).join(",");
    if (!idsKey || idsKey === reactionsHydratedKeyRef.current) return;
    reactionsHydratedKeyRef.current = idsKey;

    const setReactionsNow = useChatStore.getState().setReactions;
    fetch(
      `/api/reactions?userId=${encodeURIComponent(
        currentUserId
      )}&messageIds=${encodeURIComponent(idsKey)}`,
      { cache: "no-store" }
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.items) return;
        data.items.forEach((row: { messageId: string; reactions: any[] }) => {
          setReactionsNow(row.messageId, row.reactions);
        });
      })
      .catch((e) => console.warn("[reactions] hydrate failed:", e));
  }, [messages, currentUserId]);

  const hydratedAnchorIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // only consider anchors not already in the store
    const unseen = messages
      .filter((m) => (m as any).meta?.kind === "DRIFT_ANCHOR")
      .map((m) => m.id)
      .filter((id) => !driftsByAnchorId[id] && !hydratedAnchorIdsRef.current.has(id));
  
    if (unseen.length === 0) return;
  
    // mark as in-flight so we don't queue multiple fetches while this effect runs
    unseen.forEach((id) => hydratedAnchorIdsRef.current.add(id));
  
    fetch("/api/drifts/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anchorMessageIds: unseen }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.ok || !Array.isArray(data.items)) return;
        setDrifts(
          data.items.map((it: any) => ({
            drift: it.drift,
            my: it.my,
          }))
        );
      })
      .catch((e) => console.warn("[drifts] hydrate failed:", e));
  }, [messages, driftsByAnchorId, setDrifts]);
  // keep a ref to the subscribed channel so we can send on it later
  const chRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Helper: unwrap Supabase payload (sometimes {poll,...}, sometimes {payload:{poll,...}})
  function unwrap<T extends object>(raw: any): any {
    if (!raw) return null;
    if (typeof raw === "object" && ("poll" in raw || "pollId" in raw))
      return raw;
    if (typeof raw === "object" && "payload" in raw)
      return (raw as any).payload;
    return raw;
  }

  useEffect(() => {
    const channel = supabase.channel(`conversation-${conversationId}`);
    chRef.current = channel;

    // NEW — per-viewer hydration for layered messages
    const msgHandler = ({ payload }: any) => {
      // tolerate both shapes: {id,...} or {message:{id,...}}
      const mid = String(payload?.id ?? payload?.message?.id ?? "");
      if (!mid) {
        // fallback for unknown payloads
        appendRef.current(conversationId, payload as Message);
        return;
      }

      // Fetch the viewer-filtered DTO (includes sender + only visible facets)
      fetch(
        `/api/sheaf/messages?userId=${encodeURIComponent(
          currentUserId
        )}&messageId=${encodeURIComponent(mid)}`
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          const hydrated = data?.messages?.[0] ?? data?.message ?? null;
          if (hydrated) {
            if (hydrated.driftId) {
                            appendDriftMessage(hydrated.driftId, hydrated);
                          } else {
                            appendRef.current(conversationId, hydrated);
                          }
          } else {
            // fallback: append raw if hydration failed
            appendRef.current(conversationId, payload as Message);
          }
        })
        .catch(() => {
          appendRef.current(conversationId, payload as Message);
        });
    };

    const pollCreateHandler = ({ payload }: any) => {
      const data = unwrap(payload);
      if (!data?.poll) {
        console.warn("[polls] poll_create missing poll:", payload);
        return;
      }
      upsertPoll(data.poll, data.state ?? null, data.my ?? null);
    };
    const pollStateHandler = ({ payload }: any) => {
      const data = unwrap(payload);
      if (!data) return;
      applyPollState(data as PollStateDTO);
    };

    // inside the supabase effect (where you already define append, upsertPollNow, etc.)
    const applyReactionDeltaNow = (
      messageId: string,
      emoji: string,
      op: "add" | "remove",
      byMe: boolean
    ) => useChatStore.getState().applyReactionDelta(messageId, emoji, op, byMe);

    const reactionAdd = ({ payload }: any) => {
      const { messageId, emoji, userId } = payload || {};
      if (!messageId || !emoji) return;
      applyReactionDeltaNow(
        messageId,
        emoji,
        "add",
        String(userId) === String(currentUserId)
      );
    };

    const reactionRemove = ({ payload }: any) => {
      const { messageId, emoji, userId } = payload || {};
      if (!messageId || !emoji) return;
      applyReactionDeltaNow(
        messageId,
        emoji,
        "remove",
        String(userId) === String(currentUserId)
      );
    };
    const driftCreateHandler = ({ payload }: any) => {
           const { anchor, drift } = payload || {};
          if (!anchor || !drift) return;
            appendRef.current(conversationId, anchor);
            upsertDrift({ drift, my: { collapsed: true, pinned: false, muted: false, lastReadAt: null } });
            
          };
      
          const driftCountersHandler = ({ payload }: any) => {
            const { driftId, messageCount, lastMessageAt } = payload || {};
            if (!driftId) return;
            useChatStore.getState().updateDriftCounters?.(driftId, {
              messageCount,
              lastMessageAt,
            });
          };
      

    const redactedHandler = ({ payload }: any) => {
            const mid = String(payload?.id ?? payload?.messageId ?? "");
            if (!mid) return;
            markAsRedacted(mid);
          };

 

    channel.on("broadcast", { event: "new_message" }, msgHandler);
    channel.on("broadcast", { event: "poll_create" }, pollCreateHandler);
    channel.on("broadcast", { event: "poll_state" }, pollStateHandler);
    channel.on("broadcast", { event: "drift_create" }, driftCreateHandler);
    channel.on("broadcast", { event: "drift_counters" }, driftCountersHandler);

 
   
    if (ENABLE_REACTIONS) {
    channel.on("broadcast", { event: "reaction_add" }, reactionAdd);
    channel.on("broadcast", { event: "reaction_remove" }, reactionRemove);
  }
  channel.on("broadcast", { event: "message_redacted" }, ({ payload }: any) => {
    const mid = String(payload?.id ?? payload?.messageId ?? "");
    if (!mid) return;
    markAsRedacted(mid);
  });
 
    channel.subscribe();

    return () => {
      chRef.current = null;
      try {
        channel.unsubscribe?.();
      } catch {}
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, upsertPoll, applyPollState]); // ← add currentUserId dep

  const onPrivateReply = useCallback(
    (m: Message) => {
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
    },
    [conversationId, currentUserId, open]
  );

  // Open inline composer under message
  const onCreateOptions = useCallback((m: Message) => {
    setComposerFor(m.id);
    composerOpenForRef.current = m.id;
  }, []);

  // Actually create the poll (reuses your existing server endpoint)
  const submitOptionsPoll = useCallback(
    async (messageId: string, options: string[]) => {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messageId,
          kind: "OPTIONS",
          options,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        console.warn("[polls] create OPTIONS failed:", data);
        alert(data?.error ?? "Failed to create poll");
        return;
      }
      const poll = data.poll;
      upsertPoll(poll, null, null);
      chRef.current?.send({
        type: "broadcast",
        event: "poll_create",
        payload: { poll, state: null, my: null },
      });
    },
    [conversationId, upsertPoll]
  );

  const onCreateTemp = useCallback(
    async (m: Message) => {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, messageId: m.id, kind: "TEMP" }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        console.warn("[polls] create TEMP failed:", data);
        alert(data?.error ?? "Failed to create poll");
        return;
      }
      const poll = data.poll;
      upsertPoll(poll, null, null);
      chRef.current?.send({
        type: "broadcast",
        event: "poll_create",
        payload: { poll, state: null, my: null },
      });
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
        setMyVote({
          kind: "OPTIONS",
          pollId: poll.poll.id,
          optionIdx: body.optionIdx,
        });
      } else {
        setMyVote({ kind: "TEMP", pollId: poll.poll.id, value: body.value });
      }
      chRef.current?.send({
        type: "broadcast",
        event: "poll_state",
        payload: state,
      });
    },
    [applyPollState, setMyVote, conversationId]
  );

  useEffect(() => {
    if (!highlightMessageId) return;
    const el = document.querySelector(
      `[data-msg-id="${highlightMessageId}"]`
    ) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.classList.add("ring-2", "ring-indigo-400", "ring-offset-2");
      setTimeout(
        () => el.classList.remove("ring-2", "ring-indigo-400", "ring-offset-2"),
        2000
      );
    }
  }, [highlightMessageId, messages.length]);

  return (
    <div className="space-y-3">
      {messages.map((m) => {
 
        const panes = Object.values(state.panes);
        const anchored = panes.find(
          (p) => p.anchor?.messageId === m.id && p.peerId === String(m.senderId)
        );
          // Drift anchor detection via store (reactive)
  const driftEntry = driftsByAnchorId[m.id]; // { drift, my } | undefined
  const isDriftAnchor = !!driftEntry;

  
        // const isDriftAnchor = (m as any).meta?.kind === "DRIFT_ANCHOR";
                return (
                  <div key={m.id} className="space-y-2" data-msg-id={m.id}>
                    {!isDriftAnchor && (
                      <MessageRow
              m={m}
              currentUserId={currentUserId}
              conversationId={conversationId} // NEW
              onOpen={handleOpen}
              onPrivateReply={onPrivateReply}
              onCreateOptions={onCreateOptions}
              onCreateTemp={onCreateTemp}
              onDelete={handleDelete}
            
            />
      )}
            {/* Render attachments OUTSIDE ChatMessage so they always show */}
            {!isDriftAnchor && !((m as any).isRedacted) && m.attachments?.length ? (
              <div
                className={[
                  "mt-1 flex flex-col gap-2 px-3",
                  String(m.senderId) === String(currentUserId)
                    ? "items-end"
                    : "items-start",
                ].join(" ")}
              >
                {m.attachments.map((a) => (
                  <Attachment key={a.id} a={a} />
                ))}
              </div>
            ) : null}
            {pollsByMessageId[m.id] && (
              <PollChip
                poll={pollsByMessageId[m.id]}
                onVote={(body) => onVote(pollsByMessageId[m.id], body)}
              />
            )}
                {/* Drift anchor chip + pane (purely store-driven; no meta) */}
{isDriftAnchor && driftEntry && (
  <>
    <DriftChip
      title={driftEntry.drift.title}
      count={driftEntry.drift.messageCount}
      onOpen={() => openDrift(driftEntry.drift.id)}
    />
    {openDrifts[driftEntry.drift.id] && (
     <DriftPane
       key={driftEntry.drift.id}
        drift={{
          id: driftEntry.drift.id,
          title: driftEntry.drift.title,
          isClosed: driftEntry.drift.isClosed,
          isArchived: driftEntry.drift.isArchived,
        }}
        conversationId={String(conversationId)}
        currentUserId={currentUserId}
        onClose={() => closeDrift(driftEntry.drift.id)}
      />
    )}
  </>
)}

             
             {anchored && (
               <button /* … existing side chat opener … */>Side chat</button>
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
