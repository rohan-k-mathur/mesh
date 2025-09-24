// components/discussion/DiscussionView.tsx
"use client";
import * as React from "react";
import ChatRoom from "@/components/chat/ChatRoom";
import ForumPane from "./ForumPane";
import { DeliberateButton } from "./DeliberateButton";
import { useChatStore } from "@/contexts/useChatStore";
import { useAuth } from "@/lib/AuthContext";
import MessageComposer from "../chat/MessageComposer";
import MessengerPane from "../chat/MessengerPane";
import ThreadListSidebar from "./ThreadListSidebar";
import ForumRulesCard from "./ForumRulesCard";
import { GridBG } from "./FX";

export default function DiscussionView({
  discussion,
  conversationId,
  initialMessages = [],         // 👈 NEW
}: {
  discussion: any;
  conversationId: string | null;   // ⬅️ string | null now
  initialMessages?: any[];

}) {
  const [tab, setTab] = React.useState<"chat" | "forum">("forum");
  const setMessages = useChatStore((s) => s.setMessages);
  const { user } = useAuth();
  const me = user?.userId ? String(user.userId) : null; // real DB userId as string
  const currentUserName = user?.username ?? user?.displayName ?? "";
  const currentUserImage = user?.photoURL ?? null;



  // Seed the store with server-hydrated messages once
  React.useEffect(() => {
    if (!conversationId || !initialMessages.length) return;
    const existing = useChatStore.getState().messages[conversationId] ?? [];
    if (existing.length) return;
    setMessages(conversationId, initialMessages);
  }, [conversationId, initialMessages, setMessages]);

  // Ensure membership once when Chat is active (safe/idempotent)
  React.useEffect(() => {
    if (tab !== "chat" || !conversationId) return;
    let ran = false;
    (async () => {
      if (ran) return;
      ran = true;
      await fetch(`/api/conversations/${conversationId}/ensure-member`, { method: "POST" }).catch(() => {});
    })();
  }, [tab, conversationId]);


// Optional client hydration (fallback) if server didn’t seed
React.useEffect(() => {
    if (tab !== "chat" || !conversationId) return;

    const existing = useChatStore.getState().messages[conversationId] ?? [];
    if (existing.length) return; // already seeded

    let cancelled = false;
    (async () => {
      const url = new URL(`/api/sheaf/messages`, window.location.origin);
      url.searchParams.set("conversationId", conversationId);
      url.searchParams.set("limit", "50");
      if (me) url.searchParams.set("userId", me);
      const r = await fetch(url.toString(), { cache: "no-store" });
      if (!r.ok) return;
      const j = await r.json().catch(() => null);
      const arr = j?.messages ?? j?.items ?? [];
      if (!cancelled && Array.isArray(arr)) setMessages(conversationId, arr);
    })();
    return () => { cancelled = true; };
  }, [tab, conversationId, me, setMessages]);

  // Flip to Chat when forum triggers a quote
  React.useEffect(() => {
    const onQuote = () => setTab("chat");
    window.addEventListener("discussion:quote-for-chat", onQuote as any);
    return () => window.removeEventListener("discussion:quote-for-chat", onQuote as any);
  }, []);

  return (
    <div className="relative isolate w-full">
      <GridBG />
      <div className="relative z-10 mx-auto max-w-5xl p-3 space-y-3 w-full">
      <header className="glass-surface rounded-2xl panel-edge border bg-white/70 px-4 py-3 shadow-[0_10px_40px_-10px_rgba(2,6,23,0.12)]">
      <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold tracking-wide">{discussion.title}</h1>
              {discussion.description && (
                <p className="mt-0.5 text-sm text-slate-600">{discussion.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTab("chat")}
                className={`btnv2 btnv2--sm text-xs px-3 py-1.5 ${tab === "chat" ? "" : "btnv2--ghost"}`}
                aria-pressed={tab === "chat"}
              >
                Chat
              </button>
              <button
                onClick={() => setTab("forum")}
                className={`btnv2 btnv2--sm text-xs px-3 py-1.5 ${tab === "forum" ? "" : "btnv2--ghost"}`}
                aria-pressed={tab === "forum"}
              >
                Forum
              </button>
              <DeliberateButton discussionId={discussion.id} />
            </div>
          </div>
        </header>
 {/* Body */}
 {tab === "chat" ? (
          conversationId ? (
            me ? (
              <div className="glass-surface rounded-2xl panel-edge border bg-white/70 p-4">
                <div className="space-y-6">
                  <ChatRoom
                    conversationId={conversationId}
                    currentUserId={me}
                    currentUserName={currentUserName}
                    currentUserImage={currentUserImage}
                    initialMessages={initialMessages}
                  />
                  <hr className="border-white/60" />
                  <MessageComposer
                    conversationId={String(conversationId)}
                    currentUserId={me}
                    currentUserName={currentUserName}
                    currentUserImage={currentUserImage}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border bg-white/70 p-4 text-sm text-slate-600">
                Sign in to view this chat.
              </div>
            )
          ) : (
            <div className="rounded-xl border bg-white/70 p-4 text-sm text-slate-600">
              This discussion has no chat yet.
            </div>
          )
        ) : (
          <div className="glass-surface rounded-2xl panel-edge border bg-white/70 p-3">
            <ForumPane
              discussionId={discussion.id}
              conversationId={conversationId}
            />
          </div>
        )}
      </div>
    </div>
  );
}

