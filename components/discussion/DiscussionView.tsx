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
export default function DiscussionView({
  discussion,
  conversationId,
  initialMessages = [],         // 👈 NEW
}: {
  discussion: any;
  conversationId: string | null;   // ⬅️ string | null now
  initialMessages?: any[];

}) {
  const [tab, setTab] = React.useState<"chat" | "forum">("chat");
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
    <div className="mx-auto max-w-5xl p-3 space-y-3">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{discussion.title}</h1>
          {discussion.description && (
            <p className="text-sm text-slate-600">{discussion.description}</p>
          )}
        </div>
        <DeliberateButton discussionId={discussion.id} />
      </header>

      <div className="flex gap-2">
        <button
          className={`px-3 py-1 rounded border ${tab === "chat" ? "bg-white" : "bg-white/70"}`}
          onClick={() => setTab("chat")}
        >
          Chat
        </button>
        <button
          className={`px-3 py-1 rounded border ${tab === "forum" ? "bg-white" : "bg-white/70"}`}
          onClick={() => setTab("forum")}
        >
          Forum
        </button>
      </div>

      {tab === "chat" ? (
        conversationId ? (
          me ? (
<div>
            <div className="mt-6 space-y-6">
  
<ChatRoom
      conversationId={conversationId}
      currentUserId={me}
      currentUserName={currentUserName}
currentUserImage={currentUserImage}
      initialMessages={initialMessages}
    />
    <hr />
    <MessageComposer
      conversationId={String(conversationId)}
      currentUserId={me}
      currentUserName={currentUserName}
currentUserImage={currentUserImage}
discussionId={discussion.id}
commentId={discussion.commentId}
    />
  </div>

  </div>
          ) : (
            <div className="text-sm text-slate-600">Sign in to view this chat.</div>
          )
        ) : (
          <div className="text-sm text-slate-600">This discussion has no chat yet.</div>
        )
      ) : (
        <ForumPane
          discussionId={discussion.id}
          conversationId={conversationId}          // pass through for quote/ensure-member
        />
      )}
    </div>
  );
}



