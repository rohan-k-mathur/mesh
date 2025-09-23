"use client";

import * as React from "react";
import useSWR from "swr";
import { useAuth } from "@/lib/AuthContext";

/* ----------------------------- types & utils ----------------------------- */

type ForumComment = {
  id: string;
  discussionId: string;
  parentId: string | null;
  authorId: string | number;
  body?: any;
  bodyText?: string | null;
  sourceMessageId?: string | null;
  score: number;
  createdAt: string; // ISO
  // UI-only fields:
  _children?: ForumComment[]; // future: threaded fetch
};

const fetcher = (u: string) => fetch(u, { cache: "no-store" }).then((r) => r.json());

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// --- text normalization (do NOT import from MessageComposer) ---
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

function normalizeBodyText(row: { bodyText?: string | null; body?: any }) {
  const { bodyText, body } = row;
  if (bodyText && !looksJson(bodyText)) return bodyText;
  try {
    return plainFromNode(body);
  } catch {
    return bodyText ?? "";
  }
}

// terse time-ago
function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  const y = Math.floor(mo / 12);
  return `${y}y ago`;
}

function formatCount(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

/* ------------------------------- main pane ------------------------------- */

export default function ForumPane({
  discussionId,
  conversationId, // string | null
  opUserId,       // optional (if you later pass discussion author for OP badge)
}: {
  discussionId: string;
  conversationId: string | null;
  opUserId?: string | number | null;
}) {
  // Sorting state (client side for now, but we pass to server as well)
  const [sort, setSort] = React.useState<"best" | "top" | "new" | "old">("best");
  const [limit, setLimit] = React.useState<number>(30);
  const [cursor, setCursor] = React.useState<string | null>(null); // id (BigInt as string)

  const query = React.useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("limit", String(limit));
    if (cursor) sp.set("cursor", cursor);
    // feel free to add ?sort= later on server
    sp.set("sort", sort);
    return sp.toString();
  }, [limit, cursor, sort]);

  const { data, mutate, isLoading, error } = useSWR<{ items: ForumComment[] }>(
    `/api/discussions/${discussionId}/forum?` + query,
    fetcher
  );

  const items = React.useMemo(() => {
    const rows = data?.items ?? [];
    // Client sort fallback (server can later implement exact semantics)
    const sorter = {
      best: (a: ForumComment, b: ForumComment) => b.score - a.score || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      top: (a: ForumComment, b: ForumComment) => b.score - a.score,
      new: (a: ForumComment, b: ForumComment) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      old: (a: ForumComment, b: ForumComment) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    }[sort];
    return [...rows].sort(sorter);
  }, [data?.items, sort]);

  // Composer
  const [posting, setPosting] = React.useState(false);
  const [body, setBody] = React.useState("");
  const charLimit = 5000;
  const remaining = charLimit - body.length;

  async function submitNew() {
    if (!body.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/discussions/${discussionId}/forum`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { type: "paragraph", content: [{ type: "text", text: body.slice(0, charLimit) }] },
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j?.comment) {
        await mutate((prev) => ({ items: [j.comment, ...(prev?.items ?? [])] }), { revalidate: false });
      } else {
        await mutate(); // fallback
      }
      setBody("");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header: sort & meta */}
      <div className="flex items-center justify-between">
        <SortControl sort={sort} onChange={setSort} />
        <div className="text-xs text-slate-600">
          {isLoading ? "Loading…" : `${data?.items?.length ?? 0} comment${(data?.items?.length ?? 0) === 1 ? "" : "s"}`}
        </div>
      </div>

      {/* New post composer */}
      <div className="rounded border bg-white/80 p-3">
        <textarea
          className="w-full text-sm bg-transparent outline-none resize-y min-h-[72px]"
          value={body}
          maxLength={charLimit}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment…"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              submitNew();
            }
          }}
        />
        <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
          <span>{remaining} chars left</span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded border bg-white hover:bg-slate-50 disabled:opacity-50"
              onClick={submitNew}
              disabled={posting || !body.trim()}
            >
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      </div>

      {/* Error / Empty / List */}
      {error && (
        <div className="rounded border bg-rose-50 text-rose-700 text-sm p-3">
          Failed to load comments.
        </div>
      )}

      {!isLoading && items.length === 0 && !error && (
        <div className="rounded border bg-white/70 p-6 text-center text-sm text-slate-600">
          No comments yet — be the first to post.
        </div>
      )}

      <ul className="space-y-3">
        {items.map((row) => (
          <li key={row.id} id={`c-${row.id}`}>
            <ForumCommentItem
              discussionId={discussionId}
              conversationId={conversationId}
              comment={row}
              opUserId={opUserId}
              onLocalEdit={async () => mutate()}
              onLocalDelete={async () => mutate()}
            />
          </li>
        ))}
      </ul>

      {/* Load more (cursor pagination) — if your GET returns fewer than limit, you can hide this automatically */}
      <div className="flex justify-center">
        <button
          className="text-xs px-3 py-1 rounded border bg-white hover:bg-slate-50 disabled:opacity-50"
          onClick={() => {
            const last = data?.items?.[data.items.length - 1];
            if (last) setCursor(String(last.id));
          }}
          disabled={isLoading || !data?.items?.length}
          title="Loads older comments"
        >
          Load more
        </button>
      </div>
    </div>
  );
}

/* ------------------------------- subparts ------------------------------- */

function SortControl({
  sort,
  onChange,
}: {
  sort: "best" | "top" | "new" | "old";
  onChange: (v: "best" | "top" | "new" | "old") => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-600">Sort</span>
      <div className="flex rounded border bg-white/70 overflow-hidden">
        {(["best", "top", "new", "old"] as const).map((k) => (
          <button
            key={k}
            className={cx(
              "px-3 py-1 border-r last:border-r-0",
              sort === k ? "bg-white" : "hover:bg-white/80"
            )}
            onClick={() => onChange(k)}
          >
            {k[0].toUpperCase() + k.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

function ForumCommentItem({
  discussionId,
  conversationId,
  comment,
  opUserId,
  onLocalEdit,
  onLocalDelete,
}: {
  discussionId: string;
  conversationId: string | null;
  comment: ForumComment;
  opUserId?: string | number | null;
  onLocalEdit: () => void;
  onLocalDelete: () => void;
}) {
  const { user } = useAuth();
  const meId = user?.userId ? String(user.userId) : null;

  // UI state
  const [collapsed, setCollapsed] = React.useState(false);
  const [replyOpen, setReplyOpen] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [vote, setVote] = React.useState<0 | 1 | -1>(0); // local
  const [score, setScore] = React.useState<number>(comment.score);

  const text = normalizeBodyText(comment);

  const authorIsOP = opUserId != null && String(opUserId) === String(comment.authorId);
  const mine = meId != null && String(meId) === String(comment.authorId);

  function toggleVote(dir: 1 | -1) {
    setScore((s) => s - vote + dir);
    setVote((v) => (v === dir ? 0 : dir));
    // TODO: call POST /vote with {dir} then refetch; keep optimistic
  }

  function toggleSave() {
    setSaved((v) => !v);
    // TODO: call POST /save toggle
  }

  async function handleDelete() {
    // TODO: call DELETE /api/discussions/[id]/forum/:commentId
    onLocalDelete();
  }

  async function handleEdit(next: string) {
    // TODO: call PATCH /api/discussions/[id]/forum (id + new content)
    onLocalEdit();
  }

  return (
    <article
      className={cx(
        "rounded border bg-white/80 p-3",
        collapsed && "opacity-90"
      )}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key.toLowerCase() === "r") setReplyOpen((v) => !v);
        if (e.key.toLowerCase() === "c") setCollapsed((v) => !v);
        if (e.key.toLowerCase() === "u") toggleVote(1);
      }}
      aria-expanded={!collapsed}
      aria-controls={`comment-body-${comment.id}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AvatarSeed id={comment.authorId} />
          <div className="text-sm">
            <span className="font-medium">User {String(comment.authorId)}</span>
            {authorIsOP && (
              <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                OP
              </span>
            )}
            <span className="ml-2 text-[12px] text-slate-600">{timeAgo(comment.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <VoteControls score={score} vote={vote} onVote={toggleVote} />
          <button
            className="text-xs px-2 py-1 rounded border bg-white hover:bg-slate-50"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div id={`comment-body-${comment.id}`} className="mt-2 text-sm whitespace-pre-wrap">
          {text || "(no text)"}
        </div>
      )}

      {/* Toolbar */}
      {!collapsed && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-slate-600">
          <button className="underline" onClick={() => setReplyOpen((v) => !v)}>Reply</button>
          <span>•</span>
          <QuoteInChatButton
            discussionId={discussionId}
            conversationId={conversationId}
            text={text}
          />
          <span>•</span>
          <button
            className={cx("underline", saved && "text-emerald-700")}
            onClick={toggleSave}
          >
            {saved ? "Saved" : "Save"}
          </button>
          <span>•</span>
          <ShareButton discussionId={discussionId} commentId={comment.id} />
          {mine && (
            <>
              <span>•</span>
              <EditButton initial={text} onSave={handleEdit} />
              <span>•</span>
              <button className="underline text-rose-600" onClick={handleDelete}>
                Delete
              </button>
            </>
          )}
          {/* Optional: moderation affordances (show if user has mod role) */}
          {/* <span>•</span>
          <button className="underline text-amber-700">Remove</button>
          <span>•</span>
          <button className="underline">Lock</button>
          <span>•</span>
          <button className="underline">Pin</button> */}
        </div>
      )}

      {/* Reply composer (UI only; posts to same POST with parentId) */}
      {replyOpen && !collapsed && (
        <div className="mt-3">
          <ReplyComposer
            discussionId={discussionId}
            parentId={comment.id}
            onPosted={() => {
              // Optimistic UI only; your GET currently returns only parentId=null.
              // Once you add a /forum/tree or ?parent= endpoint, this can mutate replies.
              setReplyOpen(false);
            }}
          />
        </div>
      )}

      {/* Future: render children (once API returns threaded data)
      {comment._children?.length ? (
        <div className="mt-3 pl-4 border-l space-y-2">
          {comment._children.map((child) => (
            <ForumCommentItem
              key={child.id}
              discussionId={discussionId}
              conversationId={conversationId}
              comment={child}
              opUserId={opUserId}
              onLocalEdit={onLocalEdit}
              onLocalDelete={onLocalDelete}
            />
          ))}
        </div>
      ) : null}
      */}
    </article>
  );
}

function VoteControls({
  score,
  vote,
  onVote,
}: {
  score: number;
  vote: 0 | 1 | -1;
  onVote: (dir: 1 | -1) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        className={cx(
          "h-6 w-6 rounded border bg-white hover:bg-slate-50 leading-none",
          vote === 1 && "border-emerald-400"
        )}
        title="Upvote (u)"
        onClick={() => onVote(1)}
      >
        ▲
      </button>
      <span className="text-sm min-w-[2ch] text-center">{formatCount(score)}</span>
      <button
        className={cx(
          "h-6 w-6 rounded border bg-white hover:bg-slate-50 leading-none",
          vote === -1 && "border-rose-400"
        )}
        onClick={() => onVote(-1)}
        title="Downvote"
      >
        ▼
      </button>
    </div>
  );
}

function ReplyComposer({
  discussionId,
  parentId,
  onPosted,
}: {
  discussionId: string;
  parentId: string;
  onPosted: () => void;
}) {
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const charLimit = 5000;

  async function submit() {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      await fetch(`/api/discussions/${discussionId}/forum`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId,
          content: { type: "paragraph", content: [{ type: "text", text: text.slice(0, charLimit) }] },
        }),
      });
      setText("");
      onPosted();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded border bg-white/70 p-2">
      <textarea
        className="w-full text-sm bg-transparent outline-none resize-y min-h-[56px]"
        placeholder="Write a reply…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
      />
      <div className="mt-2 flex justify-end gap-2">
        <button
          className="text-xs px-2 py-1 rounded border bg-white hover:bg-slate-50"
          onClick={() => setText("")}
          disabled={busy || !text}
        >
          Clear
        </button>
        <button
          className="text-xs px-2 py-1 rounded border bg-white hover:bg-slate-50 disabled:opacity-50"
          onClick={submit}
          disabled={busy || !text.trim()}
        >
          {busy ? "Posting…" : "Reply"}
        </button>
      </div>
    </div>
  );
}

function EditButton({
  initial,
  onSave,
}: {
  initial: string;
  onSave: (next: string) => void | Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    setBusy(true);
    try {
      await onSave(text);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className="underline" onClick={() => setOpen(true)}>Edit</button>
      {open && (
        <div className="mt-2 rounded border bg-white/70 p-2">
          <textarea
            className="w-full text-sm bg-transparent outline-none min-h-[80px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="mt-2 flex justify-end gap-2">
            <button className="text-xs px-2 py-1 rounded border bg-white hover:bg-slate-50" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              className="text-xs px-2 py-1 rounded border bg-white hover:bg-slate-50 disabled:opacity-50"
              onClick={submit}
              disabled={busy}
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function ShareButton({ discussionId, commentId }: { discussionId: string; commentId: string }) {
  async function copy() {
    try {
      const url = `${location.origin}/discussions/${discussionId}#c-${commentId}`;
      await navigator.clipboard.writeText(url);
      alert("Link copied");
    } catch {
      alert("Copy failed");
    }
  }
  return (
    <button className="underline" onClick={copy}>
      Share
    </button>
  );
}

// Minimal avatar fallback (initial-based)
function AvatarSeed({ id }: { id: string | number }) {
  const seed = String(id);
  const ch = seed.replace(/[^a-z0-9]/gi, "").charAt(0).toUpperCase() || "U";
  return (
    <div className="h-7 w-7 rounded-full bg-slate-200 text-slate-700 text-xs flex items-center justify-center border">
      {ch}
    </div>
  );
}

/* -------------------------- quote in chat button -------------------------- */

function QuoteInChatButton({
  discussionId,
  conversationId,
  text,
}: {
  discussionId: string;
  conversationId: string | null;
  text?: string;
}) {
  const safe = (text ?? "").trim();
  const asBlockquote = (t: string) => t.split("\n").map((l) => `> ${l}`).join("\n");

  async function go() {
    const payload = safe ? `> _From forum:_\n${asBlockquote(safe)}` : "> _From forum:_";
    if (conversationId) {
      await fetch(`/api/conversations/${conversationId}/ensure-member`, { method: "POST" }).catch(() => {});
      try {
        sessionStorage.setItem(`dq:conv:${conversationId}`, JSON.stringify({ text: payload }));
      } catch {}
    }
    window.dispatchEvent(
      new CustomEvent("discussion:quote-for-chat", {
        detail: { discussionId, text: payload },
      })
    );
  }

  return (
    <button className="underline" onClick={go}>
      Quote in chat
    </button>
  );
}
