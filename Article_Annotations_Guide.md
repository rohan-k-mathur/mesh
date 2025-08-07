Below is a **concept‑to‑code roadmap** for turning your published‑article view into an **annotatable document** that feels familiar to Google Docs side‑comments and SoundCloud waveform markers, yet remains lightweight enough for a blog/article site.

---

## 1 .  UX at a glance

| Action                            | Reader experience                                                                                                                                                                                                           | Author / moderator experience                                                           |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Select text → **“Comment”**       | Text keeps its normal styling; a translucent highlight appears only for *you* until you post. After posting, a **pin icon** (or superscript bubble) is rendered in the left margin at the first character of the selection. | Author sees pins + a threaded panel. They can reply, resolve, delete, or lock a thread. |
| Hover / focus a pin               | The corresponding text range is softly highlighted (CSS `background: rgba(255,239,213,.45)`) and the sidebar scrolls to the comment.                                                                                        | Same.                                                                                   |
| Click a pin                       | Sidebar thread opens, allowing replies, emoji‑react, up/down‑vote.                                                                                                                                                          | Author gets “Resolve” / “Delete” buttons.                                               |
| Add comment with nothing selected | Treated as a “whole document” / general comment, pinned at the top of the sidebar.                                                                                                                                          | –                                                                                       |

> **Key design rule:** *Pins* live in the **overlay layer**, never altering the canonical article HTML. Selection ranges are stored as *immutable*\* anchor data (see §3).

---

## 2 .  Data model — Minimal but future‑proof

```ts
/* Prisma schema or Firestore doc ---------------------------------------- */
model CommentThread {
  id          String   @id @default(cuid())
  articleId   String
  anchor      Json     // see Anchor type below
  resolved    Boolean  @default(false)
  createdBy   String   // userId
  createdAt   DateTime @default(now())

  comments Comment[]   // threaded posts
}

model Comment {
  id          String   @id @default(cuid())
  threadId    String   @index
  body        String
  createdBy   String   // userId
  createdAt   DateTime @default(now())
  upvotes     Int      @default(0)
  downvotes   Int      @default(0)
}
```

```ts
/* Anchor – enough to survive DOM changes */
type Anchor = {
  startPath: number[];   // ProseMirror JSON path to first node
  startOffset: number;   // char offset in leaf text node
  endPath:   number[];
  endOffset: number;
};
```

*Why paths not plain indexes?* When you re‑hydrate an article you can walk the JSON tree to find the exact DOM indexes even after minor edits (as long as the content before the anchor hasn’t changed).

---

## 3 .  Capturing a selection

1. **Reader selects** text in the `.article` container.
2. Use `window.getSelection()` to retrieve `range`.
3. Convert `Range` → `Anchor` by traversing from root element to each boundary node, recording index steps (child #).
   *TipTap already has helpers: `posToDOM` / `domToPos`; you can mimic them on the static reader side by serialising data‑attributes (`data-pos`) into the HTML while rendering, or ship the article JSON and use TipTap’s `generateHTML` client‑side in read‑only mode so you retain positions.*
4. Display a floating “Comment” bubble next to the cursor; on click open comment composer.

---

\## 4.  Rendering pins & overlay highlights

```tsx
/* ArticleReaderWithPins.tsx -------------------------------------------- */
export default function ArticleReaderWithPins({
  html,            // article html string
  threads,         // CommentThread[]
  currentUser,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // map Anchor → DOMRect on every resize / scroll
  const positions = useMemo(() => {
    if (!containerRef.current) return {};
    return Object.fromEntries(
      threads.map(t => [t.id, getAnchorRect(t.anchor, containerRef.current!)]),
    );
  }, [threads]);

  return (
    <div className="relative">
      {/* base article */}
      <div
        ref={containerRef}
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* pins layer */}
      {threads.map(t => (
        <button
          key={t.id}
          style={{
            position: 'absolute',
            top:  positions[t.id]?.top  ?? 0,
            left: positions[t.id]?.left - 24,   // margin gutter
          }}
          className={`pin ${t.resolved ? 'opacity-30' : ''}`}
          onClick={() => openThread(t.id)}
        >
          ●
        </button>
      ))}

      {/* sidebar */}
      <CommentSidebar
        threads={threads}
        activeThreadId={openId}
        onSubmit={createComment}
        onResolve={resolveThread}
        onVote={vote}
        currentUser={currentUser}
      />
    </div>
  );
}
```

* `getAnchorRect` walks `anchor.startPath` to find the start text node, then `getClientRects()[0]` for its top/left.
* Use `ResizeObserver` + throttled `scroll` to recalc positions.

---

\## 5.  Posting / editing

* POST `/api/articles/{id}/comments`
  Body: `{ anchor, firstCommentBody }`.
  Backend creates a `CommentThread` + first `Comment`.
* Replies: `POST /comments/{threadId}`.
  Body: `{ body }`.
* Upvote/Downvote: `POST /comments/{id}/vote { delta: +1 | -1 }`.

---

\## 6.  Permissions & anti‑abuse

| Role                   | Abilities                                                      |
| ---------------------- | -------------------------------------------------------------- |
| **Reader** (logged‑in) | Add, edit own, delete own, vote                                |
| **Author**             | Everything + resolve / reopen thread                           |
| **Site mods**          | Delete anything, ban user/IP                                   |
| **Anonymous**          | *Option*: view comments only or create w/ rate‑limit + CAPTCHA |

*Add Cloudflare Turnstile or hCaptcha if you open to guests.*

---

\## 7.  Performance & pagination

* Don’t load *all* threads at once for long pieces → request only anchors for viewport + some buffer (`/comments?after=…&limit=…`).
* WebSocket / `SWR` subscription so other readers see new comments appear live.
* Use IntersectionObserver to lazy‑render a thread in sidebar when its pin scrolls into view.

---

\## 8.  Design polish

* Pin states

  * **yellow** = unresolved, **grey** = resolved, **blue** (or outline) when selected.
* Hover highlight uses `::after` overlay on text via `Range` + CSS variables – no permanent class injection.
* Sidebar width 320 px collapsible on mobile.
* Animation: `pin` floats in with `animate-bounce` the first time a user adds it.

---

\## 9.  Edge cases & gotchas

1. **Article edited after publication**

   * Lock anchors to the last published *revisionID*.
   * When author updates article, run a text‑diff; if anchors break, mark thread *“outdated – check v1”*.
2. **Copy‑paste / select across multiple paragraphs** (allowed – anchor holds start+end).
3. **Accessibility** – pins need `aria-describedby="comment‑{id}"`, sidebar threads get `role="complementary"`.

---

### 10.  Next incremental milestones

| Step                                                    | Effort | Result                        |
| ------------------------------------------------------- | -----: | ----------------------------- |
| **MVP** – highlight → pin → sidebar thread; store to DB |  \~3 d | Collaborative inline comments |
| Live websockets updates via Pusher / Ably / self‑host   |    1 d | Real‑time                     |
| Voting & sort (“top” / “new”)                           |  0.5 d | Quality surfacing             |
| **Email / in‑app notifications** to author              |    1 d | Engage authors                |
| **Analytics** (“Most‑commented paragraphs”)             |  0.5 d | Surface hotspots              |
| “Quote‑tweet” a passage to social post                  |  0.5 d | Virality                      |

With this roadmap you can iteratively land a production‑ready, document‑anchored comment system that feels natural to users coming from Docs or Medium and keeps your article content pristine.

Let me know when you’re ready to dive into a specific slice—e.g. Range ↔ Anchor conversion code, the sidebar UI, or WebSocket listeners—and we’ll flesh it out in code.
