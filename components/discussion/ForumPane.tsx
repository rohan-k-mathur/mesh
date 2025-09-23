// components/discussion/ForumPane.tsx
"use client";
import useSWR from "swr";
import * as React from "react";

const fetcher = (u: string) => fetch(u, { cache: "no-store" }).then((r) => r.json());

// --- local helpers (avoid importing from MessageComposer) ---
function plainFromNode(n: any): string {
  if (!n) return "";
  if (typeof n === "string") return n;
  if (Array.isArray(n)) return n.map(plainFromNode).join("");
  if (n.type === "text") return n.text || "";
  if (Array.isArray(n.content)) return n.content.map(plainFromNode).join("");
  return "";
}
function looksJson(s?: string | null) {
  if (!s) return false;
  const t = s.trim();
  return t.startsWith("{") || t.startsWith("[");
}
/** prefer bodyText; if it looks like JSON, fall back to body */
function normalizeBodyText(bodyText?: string | null, body?: any): string {
  if (bodyText && !looksJson(bodyText)) return bodyText;
  try { return plainFromNode(body); } catch { return bodyText ?? ""; }
}

export default function ForumPane({
  discussionId,
  conversationId, // string | null
}: {
  discussionId: string;
  conversationId: string | null;
}) {
  const { data, mutate, isLoading, error } = useSWR<{ items: any[] }>(
    `/api/discussions/${discussionId}/forum`,
    fetcher
  );
  const items = data?.items ?? [];

  const [body, setBody] = React.useState("");
  const [posting, setPosting] = React.useState(false);

  async function submit() {
    if (!body.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/discussions/${discussionId}/forum`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { type: "paragraph", content: [{ type: "text", text: body }] },
        }),
      });
      // If API returns {comment}, optimistic prepend; otherwise just revalidate.
      const j = await res.json().catch(() => ({}));
      if (res.ok && j?.comment) {
        await mutate(
          (prev) => ({
            items: [j.comment, ...(prev?.items ?? [])],
          }),
          { revalidate: false }
        );
      } else {
        await mutate();
      }
      setBody("");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded border bg-white/70 p-3">
        <textarea
          className="w-full text-sm bg-transparent outline-none"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment…"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="mt-2 flex justify-end">
          <button
            className="px-3 py-1 rounded border bg-white hover:bg-slate-50 disabled:opacity-50"
            onClick={submit}
            disabled={posting || !body.trim()}
          >
            {posting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>

      {isLoading && <div className="text-sm text-slate-500">Loading…</div>}
      {error && (
        <div className="text-sm text-rose-600">
          Failed to load forum comments
        </div>
      )}

      <ul className="space-y-2">
        {items.map((c: any) => {
          const displayText = normalizeBodyText(c.bodyText, c.body);
          return (
            <li id={`c-${c.id}`} key={c.id} className="rounded border bg-white/70 p-3">
              <div className="text-[13px] text-slate-600">
                {new Date(c.createdAt).toLocaleString()}
              </div>
              <div className="mt-1 text-sm whitespace-pre-wrap">
                {displayText || "(no text)"}
              </div>
              <div className="mt-2">
                <QuoteInChatButton
                  discussionId={discussionId}
                  conversationId={conversationId}
                  text={displayText} // 👈 quote the normalized text
                />
              </div>
            </li>
          );
        })}
        {!isLoading && !items.length && (
          <li className="text-sm text-slate-500">No comments yet.</li>
        )}
      </ul>
    </div>
  );
}

// --- Quote button ---
function QuoteInChatButton({
  discussionId,
  conversationId,
  text,
}: {
  discussionId: string;
  conversationId: string | null;
  text?: string;
}) {
  async function go() {
    if (conversationId) {
      await fetch(`/api/conversations/${conversationId}/ensure-member`, { method: "POST" }).catch(() => {});
      try {
        sessionStorage.setItem(
          `dq:conv:${conversationId}`,
          JSON.stringify({ text: text ?? "" })
        );
      } catch {}
    }
    window.dispatchEvent(
      new CustomEvent("discussion:quote-for-chat", {
        detail: { discussionId, text: text ?? "" },
      })
    );
  }
  return (
    <button className="text-[12px] underline" onClick={go}>
      Quote in chat
    </button>
  );
}
