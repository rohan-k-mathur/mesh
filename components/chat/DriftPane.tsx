"use client";

import * as React from "react";
import Image from "next/image";
import { ChatMessage, ChatMessageContent, ChatMessageAvatar } from "@/components/ui/chat-message";
import { SheafMessageBubble } from "@/components/sheaf/SheafMessageBubble";
import { useChatStore } from "@/contexts/useChatStore";

function Attachment({ a }: { a: { id: string; path: string; type: string; size: number } }) {
  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/messages/attachments/${a.id}/sign`);
        if (r.ok) {
          const { url } = await r.json();
          if (!cancelled) setUrl(url);
        }
      } catch {}
    })();
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
    <a href={url} download={name || undefined} className="flex items-center gap-2 text-blue-600 underline">
      <span>📎</span>
      <span>{(a.size / 1024).toFixed(1)} KB</span>
    </a>
  );
}

export function DriftPane({
  drift,
  conversationId,
  currentUserId,
  onClose,
}: {
  drift: {
    id: string;
    title: string;
    isClosed: boolean;
    isArchived: boolean;
  };
  conversationId: string;
  currentUserId: string;
  onClose: () => void;
}) {
    const EMPTY: any[] = React.useMemo(() => [], []);
  const msgs = useChatStore(
    React.useCallback((s) => s.driftMessages[drift.id] ?? EMPTY, [drift.id, EMPTY])
  );
    const setDriftMessages = useChatStore((s) => s.setDriftMessages);
    const fetchedForRef = React.useRef<string | null>(null);

  // Lazy load exactly once per drift id (even if it has 0 messages)
  React.useEffect(() => {
        // If we already have messages for this drift, or we already fetched once, skip.
      if (msgs.length > 0 || fetchedForRef.current === drift.id) return;
        fetchedForRef.current = drift.id;
      let aborted = false;
        (async () => {
        const r = await fetch(
          `/api/sheaf/messages?driftId=${encodeURIComponent(drift.id)}&userId=${encodeURIComponent(
            currentUserId,
          )}`,
          { cache: "no-store" },
        );
        const data = await r.json();
        if (!aborted && Array.isArray(data?.messages)) {
          const sorted = [...data.messages].sort(
            (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          setDriftMessages(drift.id, sorted);
        }
      })().catch(() => {});
          return () => { aborted = true; };
        }, [drift.id, currentUserId, setDriftMessages, msgs.length]);

  return (
    <div className="mx-auto my-2 w-full max-w-[720px] rounded-xl border bg-white/70 backdrop-blur px-3 py-2 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2">
          <span>🌀</span>
          <span className="font-medium">{drift.title}</span>
          {drift.isClosed && <span className="ml-1 text-xs rounded bg-slate-200 px-2 py-0.5">closed</span>}
          {drift.isArchived && <span className="ml-1 text-xs rounded bg-slate-200 px-2 py-0.5">archived</span>}
        </div>
        <button onClick={onClose} className="text-xs px-2 py-1 rounded bg-white border hover:bg-slate-50">
          Close
        </button>
      </div>

      <hr className="my-2" />

      {/* Body */}
      <div className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto px-1 py-1">
        {msgs.map((m: any) => {
          const isMine = String(m.senderId) === String(currentUserId);
          const redacted = !!m.isRedacted;
          return (
            <ChatMessage key={m.id} id={m.id} type={isMine ? "outgoing" : "incoming"} variant="bubble">
              {!isMine && <ChatMessageAvatar imageSrc={m.sender?.image || "/assets/user-helsinki.svg"} />}
              {redacted ? (
                <ChatMessageContent content="(redacted)" className="opacity-70 italic" />
              ) : Array.isArray(m.facets) && m.facets.length > 0 ? (
                <SheafMessageBubble
                  messageId={m.id}
                  conversationId={conversationId}
                  currentUserId={currentUserId}
                  facets={m.facets}
                  defaultFacetId={m.defaultFacetId}
                />
              ) : (
                <ChatMessageContent content={m.text ?? ""} />
              )}
              {m.attachments?.length ? (
                <div className="mt-2 space-y-2">
                  {m.attachments.map((a: any) => (
                    <Attachment key={a.id} a={a} />
                  ))}
                </div>
              ) : null}
              {isMine && <ChatMessageAvatar imageSrc={m.sender?.image || "/assets/user-helsinki.svg"} />}
            </ChatMessage>
          );
        })}
      </div>

      {/* Composer */}
      <div className="mt-2">
        {/* Disabled when closed/archived */}
        <fieldset disabled={drift.isClosed || drift.isArchived} className="disabled:opacity-60">
          <div className="border rounded-lg p-2 bg-white/60">
            <p className="text-xs text-slate-600 mb-1">Reply in drift</p>
            <div className="mt-1">
              <MessageComposer
                conversationId={conversationId}
                currentUserId={currentUserId}
                driftId={drift.id}
              />
            </div>
          </div>
        </fieldset>
      </div>
    </div>
  );
}

import MessageComposer from "@/components/chat/MessageComposer";
