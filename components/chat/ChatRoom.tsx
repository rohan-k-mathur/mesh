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
import { QuoteBlock } from "@/components/chat/QuoteBlock";
import { LinkCard } from "@/components/chat/LinkCard";
import { useConversationRealtime } from "@/hooks/useConversationRealtime";

const ENABLE_REACTIONS = false;

type Props = {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
  highlightMessageId?: string | null;
  currentUserName?: string;
 currentUserImage?: string | null;
  onQuote?: (qr: { messageId: string; facetId?: string }) => void;
};

function excerpt(text?: string | null, len = 100) {
  if (!text) return null;
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > len ? t.slice(0, len - 1) + "…" : t;
}

// Minimal TipTap → text for inline label
function textFromTipTap(node: any): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(textFromTipTap).join("");
  if (typeof node === "object") {
    if (node.text) return String(node.text);
    if (Array.isArray(node.content))
      return node.content.map(textFromTipTap).join("");
    return textFromTipTap(node.content);
  }
  return "";
}
function toSnippet(raw: string, max = 48) {
  const s = raw.replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
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
  onOpenThread,
}: {
  m: Message;
  currentUserId: string;
  conversationId: string; // NEW
  onOpen: (peerId: string, peerName: string, peerImage?: string | null) => void;
  onPrivateReply?: (m: Message) => void;
  onCreateOptions: (m: Message) => void;
  onCreateTemp: (m: Message) => void;
  onDelete: (id: string) => void;
  onOpenThread?: (driftId: string) => void;
}) {
  const setQuoteDraft = useChatStore((s) => s.setQuoteDraft);
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
        <div
          className={[
            "relative group w-full",
            isMine ? "flex justify-end" : "flex justify-start",
          ].join(" ")}
        >
          {/* Muted tombstone bubble */}
          <ChatMessageContent
            content="(redacted)"
            className="opacity-70 italic"
          />
          {/* (Optional) you can still keep the hover menu for your own redacted msg if desired */}
        </div>
      ) : Array.isArray(m.facets) && m.facets.length > 0 ? (
        <>
          <div
            className={[
              "relative group w-full",
              isMine ? "flex justify-end" : "flex justify-start",
            ].join(" ")}
          >
            <SheafMessageBubble
              messageId={m.id}
              conversationId={conversationId}
              currentUserId={currentUserId}
              facets={m.facets as any}
              defaultFacetId={m.defaultFacetId}
            />
            {(m as any).edited ? (
              <div
                className={[
                  "mt-1 text-[11px] text-slate-500 italic",
                  isMine ? "text-right" : "text-left",
                ].join(" ")}
              >
                (edited)
              </div>
            ) : null}

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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="py-0  px-0 mr-[1px] align-center my-auto bg-indigo-500 shadow-md hover:shadow-none  rounded-md text-xs focus:outline-none"
                    title="Message actions"
                    type="button"
                  >
                    <Image
                      src="/assets/dot-mark.svg"
                      alt="actions"
                      width={32}
                      height={32}
                      className="cursor-pointer object-fill w-[10px] "
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align={isMine ? "end" : "start"}
                  sideOffset={6}
                  className="flex flex-col bg-white/30 backdrop-blur rounded-xl max-w-[400px] py-2"
                >
                  {isMine ? (
                    <>
                    
                      <DropdownMenuItem
                        onClick={() => alert("Edit is coming soon.")}
                      >
                        ✏️ Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => onDelete(m.id)}
                      >
                        🗑 Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const facetId =
                            (m as any).defaultFacetId ??
                            (Array.isArray(m.facets) && m.facets[0]?.id) ??
                            undefined;
                          useChatStore
                            .getState()
                            .setQuoteDraft(conversationId, {
                              messageId: m.id,
                              facetId,
                            });
                        }}
                      >
                        🧩 Quote
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                    <DropdownMenuItem
  onClick={async () => {
    try {
      const r = await fetch("/api/threads/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, rootMessageId: m.id }),
      });
      const data = await r.json();
      const driftId = data?.drift?.id;
      if (driftId) onOpenThread?.(driftId); // we'll pass this handler from ChatRoom
    } catch (e) {
      console.warn("[thread] start failed", e);
    }
  }}
>
  🧵 Reply in thread
</DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const facetId =
                            (m as any).defaultFacetId ??
                            (Array.isArray(m.facets) && m.facets[0]?.id) ??
                            undefined;
                          useChatStore
                            .getState()
                            .setQuoteDraft(conversationId, {
                              messageId: m.id,
                              facetId,
                            });
                        }}
                      >
                        🧩 Quote
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onPrivateReply?.(m)}>
                        ↩️ Reply in DM
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Summary below the bubble */}
        </>
      ) : (
        <>
          <div
            className={[
              "relative group w-full",
              isMine ? "flex justify-end" : "flex justify-start",
            ].join(" ")}
          >
            {m.text ? (
              <ChatMessageContent content={m.text} />
            ) : (
              // Safety: If we ever hit a “no text, no facets” non-redacted state,
              // still render a placeholder bubble so the row doesn’t collapse.
              <ChatMessageContent content="" className="min-h-6" />
            )}
            {(m as any).edited ? (
              <div className="mt-1 text-[11px] text-slate-500 italic">
                (edited)
              </div>
            ) : null}

            <div
              className={[
                "absolute top-1 z-20 flex",
                "invisible opacity-0 pointer-events-none",
                "group-hover:visible group-hover:opacity-100 group-hover:pointer-events-auto",
                "transition-opacity duration-150",
              ].join(" ")}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="py-0  px-0 mr-[1px] align-center my-auto bg-indigo-500 shadow-md hover:shadow-none  rounded-md text-xs focus:outline-none"
                    title="Message actions"
                    type="button"
                  >
                    <Image
                      src="/assets/dot-mark.svg"
                      alt="actions"
                      width={32}
                      height={32}
                      className="cursor-pointer object-fill w-[10px] "
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align={isMine ? "end" : "start"}
                  sideOffset={6}
                  className="flex flex-col bg-white/30 backdrop-blur rounded-xl max-w-[400px] py-2"
                >
                  {isMine ? (
                    <>
                      <DropdownMenuItem
                        onClick={() => alert("Edit is coming soon.")}
                      >
                        ✏️ Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => onDelete(m.id)}
                      >
                        🗑 Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const facetId =
                            (m as any).defaultFacetId ??
                            (Array.isArray(m.facets) && m.facets[0]?.id) ??
                            undefined;
                          useChatStore
                            .getState()
                            .setQuoteDraft(conversationId, {
                              messageId: m.id,
                              facetId,
                            });
                        }}
                      >
                        🧩 Quote
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                    <DropdownMenuItem
                      onClick={async () => {
                        try {
                          const r = await fetch("/api/threads/start", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ conversationId, rootMessageId: m.id }),
                          });
                          const data = await r.json();
                          const driftId = data?.drift?.id;
                          if (driftId) onOpenThread?.(driftId);
                        } catch (e) {
                          console.warn("[thread] start failed", e);
                        }
                      }}
                    >
                      🧵 Reply in thread
                    </DropdownMenuItem>
                  
                    <DropdownMenuItem
                      onClick={() => {
                        const facetId =
                          (m as any).defaultFacetId ??
                          (Array.isArray(m.facets) && m.facets[0]?.id) ??
                          undefined;
                        useChatStore.getState().setQuoteDraft(conversationId, {
                          messageId: m.id,
                          facetId,
                        });
                      }}
                    >
                      🧩 Quote
                    </DropdownMenuItem>
                  
                    <DropdownMenuItem onClick={() => onPrivateReply?.(m)}>
                      ↩️ Reply in DM
                    </DropdownMenuItem>
                  </>
                  
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </>
      )}

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
  highlightMessageId,
  currentUserName = "",
 currentUserImage = null,
}: Props) {
  const { open, state } = usePrivateChatManager();

  const driftsByAnchorId = useChatStore((s) => s.driftsByAnchorId);
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
  // Presence + typing for this conversation
  const { online, typing } = useConversationRealtime(conversationId, {
    id: String(currentUserId),
    name: currentUserName, image: currentUserImage, 
  });
  const [readers, setReaders] = useState<
    { userId: string; lastReadAt: string }[]
  >([]);

  // Throttle "read" posts
  const lastReadSentAtRef = useRef(0);
  const markRead = useCallback((convId: string) => {
    const now = Date.now();
    if (now - lastReadSentAtRef.current < 1500) return; // 1.5s throttle
    lastReadSentAtRef.current = now;
    fetch(`/api/conversations/${encodeURIComponent(convId)}/read`, {
      method: "POST",
    }).catch(() => {});
  }, []);

  const lastMsg = messages[messages.length - 1];
  const seenCount = React.useMemo(() => {
    if (!lastMsg) return 0;
    const t = new Date((lastMsg as any).createdAt ?? Date.now()).getTime();
    return readers.filter(
      (r) =>
        r.userId !== String(currentUserId) &&
        new Date(r.lastReadAt).getTime() >= t
    ).length;
  }, [readers, messages.length, currentUserId]);
  // Render helpers for presence/typing (exclude me)
  const othersOnline = React.useMemo(
    () =>
      Object.entries(online || {}).filter(
        ([uid]) => uid !== String(currentUserId)
      ),
    [online, currentUserId]
  );
  const othersTypingIds = React.useMemo(
    () =>
      Object.keys(typing || {}).filter((uid) => uid !== String(currentUserId)),
    [typing, currentUserId]
  );

  const getTypingName = useCallback((uid: string) => {
    const nameFromTyping = (typing as any)?.[uid]?.name;
    if (nameFromTyping && nameFromTyping.trim()) return nameFromTyping;
  
    const nameFromOnline = (online as any)?.[uid]?.name;
    if (nameFromOnline && nameFromOnline.trim()) return nameFromOnline;
  
    // Last resort: look up any message by that sender (we store sender names in the list)
    const msg = messages.find((mm) => String(mm.senderId) === String(uid));
    const nameFromMsg = msg?.sender?.name;
    if (nameFromMsg && nameFromMsg.trim()) return nameFromMsg;
  
    return "Someone";
  }, [typing, online, messages]);

  const appendRef = useRef(appendMessage);
  useEffect(() => {
    appendRef.current = appendMessage;
  }, [appendMessage]);

  const markAsRedacted = React.useCallback(
    (mid: string) => {
      const list = useChatStore.getState().messages[conversationId] ?? [];
      setMessages(
        conversationId,
        list.map((row) =>
          String(row.id) === String(mid)
            ? {
                ...row,
                isRedacted: true,
                is_redacted: true,
                text: null,
                attachments: [],
                facets: [],
              }
            : row
        )
      );
    },
    [conversationId, setMessages]
  );

  const handleDelete = React.useCallback(
    async (mid: string) => {
      // Optimistic tombstone
      markAsRedacted(mid);
      try {
        const res = await fetch(
          `/api/messages/item/${encodeURIComponent(mid)}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error(await res.text());
      } catch (e) {
        console.warn("[delete] failed; consider refetch or revert", e);
        // optionally revert here
      }
    },
    [markAsRedacted]
  );

  const initRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);
  const driftsListHydratedRef = useRef(false);
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
      .filter(
        (id) => !driftsByAnchorId[id] && !hydratedAnchorIdsRef.current.has(id)
      );

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

  // Lazily hydrate thread drifts for visible root ids
useEffect(() => {
  if (!messages.length) return;
  // roots for which we don't have a drift entry yet
  const unknownRoots = messages
    .map((m) => m.id)
    .filter((id) => !driftsByAnchorId[id]);

  if (unknownRoots.length === 0) return;

  fetch("/api/threads/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId, rootIds: unknownRoots }),
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data?.items) return;
      setDrifts(
        data.items.map((it: any) => ({ drift: it.drift, my: it.my }))
      );
    })
    .catch((e) => console.warn("[threads] hydrate failed:", e));
}, [messages, conversationId, driftsByAnchorId, setDrifts]);

  useEffect(() => {
    if (driftsListHydratedRef.current) return;
    driftsListHydratedRef.current = true;

    fetch(
      `/api/drifts/list?conversationId=${encodeURIComponent(conversationId)}`,
      { cache: "no-store" }
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.ok || !Array.isArray(data.items)) return;
        // Your setDrifts expects items shaped like { drift, my } and maps by drift.anchorMessageId
        setDrifts(
          data.items.map((it: any) => ({ drift: it.drift, my: it.my }))
        );
      })
      .catch((e) => console.warn("[drifts] list hydrate failed:", e));
  }, [conversationId, setDrifts]);

  

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
    const root = document.querySelector("[data-chat-root]");
    if (!root) return;

    const nodes = root.querySelectorAll("[data-msg-id]");
    const last = nodes[nodes.length - 1] as HTMLElement | null;
    if (!last) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && document.visibilityState === "visible") {
            markRead(conversationId);
          }
        }
      },
      { root: null, threshold: 0.8 }
    );

    io.observe(last);
    return () => io.disconnect();
  }, [conversationId, messages.length, markRead]);

  useEffect(() => {
    const onFocus = () => markRead(conversationId);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [conversationId, markRead]);

  useEffect(() => {
    if (!lastMsg) return;
    fetch(`/api/conversations/${encodeURIComponent(conversationId)}/readers`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.items) setReaders(data.items);
      })
      .catch(() => {});
  }, [conversationId, lastMsg?.id]);

  useEffect(() => {
    const channel = supabase.channel(`conversation-${conversationId}`);
    chRef.current = channel;

    // NEW — per-viewer hydration for layered messages
    const msgHandler = ({ payload }: any) => {
      // tolerate both shapes: {id,...} or {message:{id,...}}
      console.log("[rt] new_message payload", payload);
      const mid = String(payload?.id ?? payload?.message?.id ?? "");
       const payloadDriftId = String(
           payload?.driftId ?? payload?.message?.driftId ?? ""
         );
         const from = String(payload?.senderId ?? payload?.message?.senderId ?? "");

         // helpful debug
         console.log("[rt] new_message payload", { mid, payloadDriftId, from });
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
          const hydratedDriftId = hydrated?.driftId ? String(hydrated.driftId) : "";
          const driftKey = hydratedDriftId || payloadDriftId || "";
          console.log("[rt] hydrated", mid, { hydratedDriftId, payloadDriftId });
    
          if (hydrated) {
            if (driftKey) {
              appendDriftMessage(driftKey, hydrated);
            } else {
              appendRef.current(conversationId, hydrated);
            }
            return;
          }
    
          // No hydration? Still route to drift if payload gives us a driftId
          if (payloadDriftId) {
            appendDriftMessage(payloadDriftId, {
              id: mid,
              text: payload?.text ?? null,
              createdAt: payload?.createdAt ?? new Date().toISOString(),
              senderId: from,
              driftId: payloadDriftId,
              sender: payload?.sender ?? undefined,
              attachments: Array.isArray(payload?.attachments)
                ? payload.attachments
                : [],
            });
          } else {
            appendRef.current(conversationId, payload as Message);
          }
          console.log("[rt] hydrated", mid, { hydratedDriftId: hydrated?.driftId, payloadDriftId });
        })
        
        .catch(() => {
          // Network hiccup? Still make sure we route to the drift if we can.
          if (payloadDriftId) {
            appendDriftMessage(payloadDriftId, {
              id: mid,
              text: payload?.text ?? null,
              createdAt: payload?.createdAt ?? new Date().toISOString(),
              senderId: String(payload?.senderId ?? ""),
              driftId: payloadDriftId,
              sender: payload?.sender ?? undefined,
              attachments: Array.isArray(payload?.attachments)
                ? payload.attachments
                : [],
            });
          } else {
            appendRef.current(conversationId, payload as Message);
          }
        });
    };
    

    const linkPreviewHandler = async ({ payload }: any) => {
      const mid = String(payload?.messageId ?? "");
      if (!mid) return;
      try {
        const r = await fetch(
          `/api/sheaf/messages?userId=${encodeURIComponent(
            currentUserId
          )}&messageId=${encodeURIComponent(mid)}`,
          { cache: "no-store" }
        );
        const data = await r.json();
        const hydrated = data?.messages?.[0] ?? data?.message ?? null;
        if (!hydrated) return;
        const list = useChatStore.getState().messages[conversationId] ?? [];
        const next = list.map((row: any) =>
          String(row.id) === String(mid) ? hydrated : row
        );
        useChatStore.getState().setMessages(conversationId, next);
      } catch {}
    };
    channel.on(
      "broadcast",
      { event: "link_preview_update" },
      linkPreviewHandler
    );

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
      const { anchor, drift } = payload || payload?.payload || {};
  if (!drift) return;
  // Independent drift: append the anchor message bubble into timeline
  if (anchor && drift.kind !== "THREAD") {
    appendRef.current(conversationId, anchor);
  }
  // Both DRIFT and THREAD: index/update the drift
  upsertDrift({
    drift,
    my: { collapsed: true, pinned: false, muted: false, lastReadAt: null },
  });
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

    const readHandler = ({ payload }: any) => {
      const { userId, ts } = payload || {};
      if (!userId || !ts) return;
      setReaders((prev) => {
        const i = prev.findIndex((p) => p.userId === String(userId));
        if (i >= 0) {
          const next = prev.slice();
          next[i] = { userId: String(userId), lastReadAt: ts };
          return next;
        }
        return [...prev, { userId: String(userId), lastReadAt: ts }];
      });
    };
    channel.on("broadcast", { event: "read" }, readHandler);

    channel.on("broadcast", { event: "new_message" }, msgHandler);
    channel.on("broadcast", { event: "poll_create" }, pollCreateHandler);
    channel.on("broadcast", { event: "poll_state" }, pollStateHandler);
    channel.on("broadcast", { event: "drift_create" }, driftCreateHandler);
    channel.on("broadcast", { event: "drift_counters" }, driftCountersHandler);

    if (ENABLE_REACTIONS) {
      channel.on("broadcast", { event: "reaction_add" }, reactionAdd);
      channel.on("broadcast", { event: "reaction_remove" }, reactionRemove);
    }
    channel.on(
      "broadcast",
      { event: "message_redacted" },
      ({ payload }: any) => {
        const mid = String(payload?.id ?? payload?.messageId ?? "");
        if (!mid) return;
        markAsRedacted(mid);
      }
    );

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
    <div className="space-y-3" data-chat-root>
      {messages.map((m) => {
        const isMine = String(m.senderId) === String(currentUserId);
        const panes = Object.values(state.panes);
        const anchored = panes.find(
          (p) => p.anchor?.messageId === m.id && p.peerId === String(m.senderId)
        );
        // Drift anchor detection via store (reactive)
        const driftEntry = driftsByAnchorId[m.id]; // { drift, my } | undefined
        const isThread = driftEntry?.drift?.kind === "THREAD";
        const isDriftAnchor = !!driftEntry && driftEntry.drift.kind !== "THREAD"; // hide only pure DRIFT anchors

        // const isDriftAnchor = (m as any).meta?.kind === "DRIFT_ANCHOR";

        return (
          <div key={m.id} className="space-y-2" data-msg-id={m.id}>
            {/* Presence row */}

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
                onOpenThread={(driftId) => openDrift(driftId)}
                
              />
            )}
            {/* Render attachments OUTSIDE ChatMessage so they always show */}
            {!isDriftAnchor &&
            !(m as any).isRedacted &&
            m.attachments?.length ? (
              <div
                className={[
                  "mt-1 flex flex-col gap-2 px-3",
                  isMine ? "items-end" : "items-start",
                ].join(" ")}
              >
                {m.attachments.map((a) => (
                  <Attachment key={a.id} a={a} />
                ))}
              </div>
            ) : null}

{Array.isArray((m as any).quotes) && (m as any).quotes.length > 0 &&
  (() => {
    const q0 = (m as any).quotes[0];
    const textRaw =
      typeof q0?.body === "string"
        ? q0.body
        : q0?.body
        ? textFromTipTap(q0.body)
        : "";
    const inlineLabel = q0?.sourceAuthor?.name || toSnippet(textRaw, 48);
    return (
      <div
        className={[
          "px-3 mt-1 flex",
          isMine ? "justify-end" : "justify-start",
        ].join(" ")}
      >
        <div className="max-w-[60%]">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
            <span>Replying to&nbsp;</span>
            <span className="font-medium text-slate-700">{inlineLabel}</span>
          </div>
          <div
            className={[
              "mt-1 pl-3 border-l-2",
              isMine ? "border-fuchsia-200" : "border-sky-200",
            ].join(" ")}
          >
            {(m as any).quotes.map((q: any, i: number) => (
              <QuoteBlock key={`${m.id}-q-${i}`} q={q} compact />
            ))}
          </div>
        </div>
      </div>
    );
  })()
}

            {/* Plain message link previews */}
            {!Array.isArray((m as any).facets) &&
              Array.isArray((m as any).linkPreviews) &&
              (m as any).linkPreviews.length > 0 && (
                <div
                className={[
                  "mt-2 flex flex-col gap-2 px-3",
                  isMine ? "items-end" : "items-start",
                ].join(" ")}
              >
                  {(m as any).linkPreviews.slice(0, 3).map((p: any) => (
                    <LinkCard key={p.urlHash} p={p} />
                  ))}
                </div>
              )}

            {/* Sheaf (default facet) link previews */}
            {Array.isArray((m as any).facets) &&
              (m as any).facets.length > 0 &&
              (() => {
                const defId =
                  (m as any).defaultFacetId ?? (m as any).facets[0]?.id;
                const def =
                  (m as any).facets.find((f: any) => f.id === defId) ??
                  (m as any).facets[0];
                if (!def?.linkPreviews?.length) return null;
                return (
                  <div
                  className={[
                    "mt-2 flex flex-col gap-2 px-3",
                    isMine ? "items-end" : "items-start",
                  ].join(" ")}
                >
                    {def.linkPreviews.slice(0, 3).map((p: any) => (
                      <LinkCard key={p.urlHash} p={p} />
                    ))}
                  </div>
                );
              })()}

            {pollsByMessageId[m.id] && (
              <PollChip
                poll={pollsByMessageId[m.id]}
                onVote={(body) => onVote(pollsByMessageId[m.id], body)}
              />
            )}
          
            {/* {lastMsg && String(lastMsg.senderId) === String(currentUserId) && (
  <div className="px-3 text-[11px] text-slate-500">Seen by {seenCount}</div>
)} */}
           {/* Independent drift (old behavior) */}
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
{/* Thread chip: show under the root (we do not hide the root row) */}
{!isDriftAnchor && isThread && (
  <>
    <div className="px-3">
      <button
        className="text-[11px] px-2 py-[2px] rounded bg-white/70 border hover:bg-white"
        onClick={() => openDrift(driftEntry.drift.id)}
      >
        {driftEntry.drift.messageCount}{" "}
        {driftEntry.drift.messageCount === 1 ? "reply" : "replies"} · View thread
      </button>
    </div>
    {openDrifts[driftEntry.drift.id] && (
      <DriftPane
        key={driftEntry.drift.id}
        drift={{
          id: driftEntry.drift.id,
          title: "Thread",
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
       {/* Typing indicator */}
       {othersTypingIds.length > 0 && (
  <div className="px-3 text-[12px] text-slate-500 italic">
    {othersTypingIds.length === 1
      ? `${getTypingName(othersTypingIds[0])} is typing…`
      : "Several people are typing…"}
  </div>
)}

    </div>
    
  );

}
