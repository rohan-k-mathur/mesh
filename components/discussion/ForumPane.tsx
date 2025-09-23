// components/discussion/ForumPane.tsx
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
  _children?: ForumComment[]; // for future threaded rendering
};

const fetcher = (u: string) => fetch(u, { cache: "no-store" }).then((r) => r.json());

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function collectIds(list: ForumComment[]): string[] {
    const out: string[] = [];
    const walk = (n: ForumComment) => {
      out.push(String(n.id));
      (n._children ?? []).forEach(walk);
    };
    list.forEach(walk);
    return Array.from(new Set(out));
  }

// --- text normalization (keep local to avoid cross-imports) ---
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
  opUserId,
}: {
  discussionId: string;
  conversationId: string | null;
  opUserId?: string | number | null;
}) {
  const [sort, setSort] = React.useState<"best" | "top" | "new" | "old">("best");
  const [limit, setLimit] = React.useState<number>(30);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [compact, setCompact] = React.useState(false);

  // Track URL hash for anchor highlight
  const [highlightId, setHighlightId] = React.useState<string | null>(null);
  React.useEffect(() => {
    const get = () => {
      const h = (location.hash || "").replace(/^#c-/, "");
      setHighlightId(h || null);
    };
    get();
    const onHash = () => get();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Build query (server can later support ?sort=…)
  const query = React.useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("limit", String(limit));
    if (cursor) sp.set("cursor", cursor);
    sp.set("sort", sort);
    return sp.toString();
  }, [limit, cursor, sort]);

  const { data, mutate, isLoading, error } = useSWR<{ items: ForumComment[] }>(
    `/api/discussions/${discussionId}/forum?${query}&includeReplies=all`,
    fetcher
  );

  const items = React.useMemo(() => {
    const rows = data?.items ?? [];
    const sorter = {
      best: (a: ForumComment, b: ForumComment) => b.score - a.score || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      top: (a: ForumComment, b: ForumComment) => b.score - a.score,
      new: (a: ForumComment, b: ForumComment) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      old: (a: ForumComment, b: ForumComment) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    }[sort];
    return [...rows].sort(sorter);
  }, [data?.items, sort]);

  // collect all ids for me-state fetch
const allIds = React.useMemo(() => collectIds(items), [items]);

const { data: meState } = useSWR<{ ok: boolean; votes: Record<string, number>; saves: Record<string, boolean> }>(
  allIds.length ? `/api/discussions/${discussionId}/forum/me?ids=${allIds.join(",")}` : null,
  fetcher
);
const meVotes = meState?.votes ?? {};
const meSaves = meState?.saves ?? {};

  // --- Draft persistence for the top composer
  const DRAFT_KEY = `forum:draft:${discussionId}`;
  const [posting, setPosting] = React.useState(false);
  const [body, setBody] = React.useState("");
  const charLimit = 5000;
  const remaining = charLimit - body.length;

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) setBody(saved);
    } catch {}
  }, [DRAFT_KEY]);

  React.useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, body);
    } catch {}
  }, [DRAFT_KEY, body]);

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
        await mutate();
      }
      setBody("");
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
    } finally {
      setPosting(false);
    }
  }

  // Collapse/expand all (broadcast simple events consumed by items)
  function collapseAll() {
    window.dispatchEvent(new CustomEvent("forum:collapse", { detail: { discussionId } }));
  }
  function expandAll() {
    window.dispatchEvent(new CustomEvent("forum:expand", { detail: { discussionId } }));
  }

  return (
    <div className="space-y-4 w-full">
      {/* Header: sort & meta */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <SortControl sort={sort} onChange={setSort} />
          <div className="flex items-center gap-2">
            <button className="text-xs px-2 py-1 rounded border bg-white hover:bg-slate-50" onClick={collapseAll}>
              Collapse all
            </button>
            <button className="text-xs px-2 py-1 rounded border bg-white hover:bg-slate-50" onClick={expandAll}>
              Expand all
            </button>
            <label className="text-xs inline-flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={compact} onChange={(e) => setCompact(e.target.checked)} />
              Compact
            </label>
          </div>
        </div>
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

 <ul className={cx("space-y-3", compact && "space-y-2")}>
  {items.map((row) => {
    // ✅ local const: no "?" in a const type
    const keyWithState =
      `${row.id}:${meVotes[row.id] ?? 0}:${meSaves[row.id] ? 1 : 0}`;

    return (
      <li key={keyWithState} id={`c-${row.id}`}>
        <ForumCommentItem
          discussionId={discussionId}
          conversationId={conversationId}
          comment={row}
          opUserId={opUserId}
          compact={compact}
          highlighted={highlightId === String(row.id)}
          onLocalEdit={async () => mutate()}
          onLocalDelete={async () => mutate()}
          // ✅ cast to the union your prop expects
          initialVote={(meVotes[row.id] ?? 0) as 0 | 1 | -1}
          initialSaved={!!meSaves[row.id]}
        />
      </li>
    );
  })}
</ul>

      {/* Load more (cursor pagination) */}
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
  compact,
  highlighted,
  onLocalEdit,
  onLocalDelete,
  initialVote = 0,
  initialSaved = false,
}: {
  discussionId: string;
  conversationId: string | null;
  comment: ForumComment;
  opUserId?: string | number | null;
  compact?: boolean;
  highlighted?: boolean;
  onLocalEdit: () => void;
  onLocalDelete: () => void;
  initialVote?: 0 | 1 | -1;
  initialSaved?: boolean;
}) {
  const { user } = useAuth();
  const meId = user?.userId ? String(user.userId) : null;

  const [collapsed, setCollapsed] = React.useState(false);
  const [replyOpen, setReplyOpen] = React.useState(false);
  const [saved, setSaved] = React.useState(initialSaved);
  const [vote, setVote] = React.useState<0 | 1 | -1>(initialVote);
  const [score, setScore] = React.useState<number>(comment.score);

  const text = normalizeBodyText(comment);
  const authorIsOP = opUserId != null && String(opUserId) === String(comment.authorId);
  const mine = meId != null && String(meId) === String(comment.authorId);

  // Listen to global collapse/expand
  React.useEffect(() => {
    const onCollapse = (e: any) => {
      if (e?.detail?.discussionId === discussionId) setCollapsed(true);
    };
    const onExpand = (e: any) => {
      if (e?.detail?.discussionId === discussionId) setCollapsed(false);
    };
    window.addEventListener("forum:collapse", onCollapse as any);
    window.addEventListener("forum:expand", onExpand as any);
    return () => {
      window.removeEventListener("forum:collapse", onCollapse as any);
      window.removeEventListener("forum:expand", onExpand as any);
    };
  }, [discussionId]);

  // Soft highlight when navigated by hash
  const [flash, setFlash] = React.useState(false);
  React.useEffect(() => {
    if (!highlighted) return;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 1800);
    return () => clearTimeout(t);
  }, [highlighted]);

function toggleVote(dir: 1 | -1) {
    const next = vote === dir ? 0 : dir;
    setScore((s) => s - vote + next);
    setVote(next);
    fetch(`/api/discussions/${discussionId}/forum/${comment.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dir: next }),
    })
      .then((r) => r.json().catch(() => null))
      .then((j) => {
        if (!j?.ok) return;
        if (typeof j.score === "number") setScore(j.score);
        if (typeof j.vote === "number") setVote(j.vote);
      })
      .catch(() => {});
  }
  function toggleSave() {
    const next = !saved;
    setSaved(next);
    fetch(`/api/discussions/${discussionId}/forum/${comment.id}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saved: next }),
    }).catch(() => {});
  }

  async function handleDelete() {
    // Soft delete (tombstone)
    const res = await fetch(
      `/api/discussions/${discussionId}/forum/${comment.id}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      alert(`Delete failed: ${res.status} ${t}`);
      return;
    }
    onLocalDelete(); // parent calls mutate()
  }
  
  async function handleEdit(next: string) {
    const payload = {
      content: { type: "paragraph", content: [{ type: "text", text: next }] },
    };
    const res = await fetch(
      `/api/discussions/${discussionId}/forum/${comment.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      alert(`Save failed: ${res.status} ${t}`);
      return;
    }
    onLocalEdit(); // parent calls mutate()
  }
  return (
    <article
      className={cx(
        "rounded border bg-white/80 p-3 transition-shadow",
        compact && "p-2",
        flash && "ring-2 ring-indigo-300 bg-indigo-50/70"
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AvatarSeed id={comment.authorId} />
          <div className={cx("text-sm", compact && "text-[12px]")}>
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
          <VoteControls score={score} vote={vote} onVote={toggleVote} compact={!!compact} />
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
        <div
          id={`comment-body-${comment.id}`}
          className={cx("mt-2 whitespace-pre-wrap", compact ? "text-[13px]" : "text-sm")}
        >
          {text || "(no text)"}
        </div>
      )}

      {/* Toolbar */}
      {!collapsed && (
        <div className={cx("mt-2 flex flex-wrap items-center gap-2 text-[12px] text-slate-600", compact && "mt-1")}>
          <button className="underline" onClick={() => setReplyOpen((v) => !v)}>Reply</button>
          <span>•</span>
          <QuoteInChatButton discussionId={discussionId} conversationId={conversationId} text={text} />
          <span>•</span>
          <SaveButton saved={saved} onToggle={toggleSave} />
          <span>•</span>
          <ShareButton discussionId={discussionId} commentId={comment.id} />
          {mine && (
            <>
              <span>•</span>
              <EditButton initial={text} onSave={handleEdit} />
              <span>•</span>
              <button className="underline text-rose-600" onClick={handleDelete}>Delete</button>
            </>
          )}
        </div>
      )}
{/* Replies (one level) */}
{!collapsed && (comment._children?.length ?? 0) > 0 && (
  <div className={cx("mt-3 pl-4 border-l", compact ? "space-y-2" : "space-y-3")}>
    {comment._children!.map((child) => (
      <ForumCommentItem
        key={child.id}
        discussionId={discussionId}
        conversationId={conversationId}
        comment={child}
        opUserId={opUserId}
        compact={compact}
        highlighted={false}
        onLocalEdit={onLocalEdit}
        onLocalDelete={onLocalDelete}
      />
    ))}
  </div>
)}
{/* {!collapsed && (
  <Replies
    discussionId={discussionId}
    parentId={comment.id}
    have={comment._children ?? null}
    conversationId={conversationId}
    onBump={() => { onLocalEdit(); }}
    compact={compact}
    opUserId={opUserId}
  />
)} */}
      {/* Reply composer */}
      {replyOpen && !collapsed && (
        <div className="mt-3">
          <ReplyComposer
            discussionId={discussionId}
            parentId={comment.id}
            onPosted={() => setReplyOpen(false)}
          />
        </div>
      )}
    </article>
  );
}

function VoteControls({
  score,
  vote,
  onVote,
  compact,
}: {
  score: number;
  vote: 0 | 1 | -1;
  onVote: (dir: 1 | -1) => void;
  compact?: boolean;
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
      <span className={cx("min-w-[2ch] text-center", compact ? "text-[12px]" : "text-sm")}>
        {formatCount(score)}
      </span>
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
        <button className="text-xs px-2 py-1 rounded border bg-white hover:bg-slate-50" onClick={() => setText("")} disabled={busy || !text}>
          Clear
        </button>
        <button className="text-xs px-2 py-1 rounded border bg-white hover:bg-slate-50 disabled:opacity-50" onClick={submit} disabled={busy || !text.trim()}>
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
            <button className="text-xs px-2 py-1 rounded border bg-white hover:bg-slate-50 disabled:opacity-50" onClick={submit} disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function SaveButton({ saved, onToggle }: { saved: boolean; onToggle: () => void }) {
  return (
    <button className={cx("underline", saved && "text-emerald-700")} onClick={onToggle}>
      {saved ? "Saved" : "Save"}
    </button>
  );
}

function ShareButton({ discussionId, commentId }: { discussionId: string; commentId: string }) {
  const [copied, setCopied] = React.useState(false);
  async function copy() {
    try {
      const url = `${location.origin}/discussions/${discussionId}#c-${commentId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // fallback
      alert("Copy failed");
    }
  }
  return (
    <button className="underline" onClick={copy}>
      {copied ? "Copied!" : "Share"}
    </button>
  );
}

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

  return <button className="underline" onClick={go}>Quote in chat</button>;
}

function Replies({
    discussionId,
    parentId,
    have,
    conversationId,
    compact,
    opUserId,
    onBump,
  }: {
    discussionId: string;
    parentId: string;
    have: any[] | null;
    conversationId: string | null;
    compact?: boolean;
    opUserId?: string | number | null;
    onBump: () => void;
  }) {
    const [open, setOpen] = React.useState(!!have && have.length > 0);
    const { data, isLoading } = useSWR<{ items: any[] }>(
      open && !have ? `/api/discussions/${discussionId}/forum?parentId=${parentId}` : null,
      (u) => fetch(u, { cache: "no-store" }).then((r) => r.json())
    );
    const kids = have ?? data?.items ?? [];
  
    if (!open) {
      return (
        <button className="mt-2 text-[12px] underline" onClick={() => setOpen(true)}>
          View replies
        </button>
      );
    }
  
    if (!kids.length && isLoading) {
      return <div className="mt-2 text-[12px] text-slate-500">Loading…</div>;
    }
  
    if (!kids.length) return null;
  
    return (
      <div className={cx("mt-3 pl-4 border-l", compact ? "space-y-2" : "space-y-3")}>
        {kids.map((child) => (
          <ForumCommentItem
            key={child.id}
            discussionId={discussionId}
            conversationId={conversationId}
            comment={child}
            opUserId={opUserId}
            compact={compact}
            highlighted={false}
            onLocalEdit={onBump}
            onLocalDelete={onBump}
          />
        ))}
      </div>
    );
  }