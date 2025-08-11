"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ArticleReader from "@/components/article/ArticleReader";
import CommentSidebar from "@/components/article/CommentSidebar";
import type { Anchor, CommentThread } from "@/types/comments";

/* ----------------------- DOM ↔ anchor helpers ----------------------- */

function nodePathFromRoot(root: Node, target: Node): number[] {
  const path: number[] = [];
  let n: Node | null = target;
  while (n && n !== root) {
    const parent = n.parentNode;
    if (!parent) break;
    const idx = Array.prototype.indexOf.call(parent.childNodes, n);
    path.unshift(idx);
    n = parent;
  }
  return path;
}

function firstTextNodeWithin(node: Node, direction: "forward" | "backward" = "forward"): Node | null {
  if (node.nodeType === Node.TEXT_NODE) return node;
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  if (direction === "forward") return walker.nextNode();
  let last: Node | null = null;
  while (walker.nextNode()) last = walker.currentNode;
  return last;
}

function coerceRangeEndsToText(range: Range): { start: Node; startOffset: number; end: Node; endOffset: number } {
  let { startContainer, startOffset, endContainer, endOffset } = range;

  // START
  if (startContainer.nodeType !== Node.TEXT_NODE) {
    const base = (startContainer.childNodes[startOffset] ?? startContainer);
    const t = firstTextNodeWithin(base, "forward") ?? firstTextNodeWithin(startContainer, "forward");
    if (t) {
      startContainer = t;
      startOffset = 0;
    }
  }

  // END
  if (endContainer.nodeType !== Node.TEXT_NODE) {
    const base = (endContainer.childNodes[endOffset - 1] ?? endContainer);
    const t = firstTextNodeWithin(base, "backward") ?? firstTextNodeWithin(endContainer, "backward");
    if (t) {
      endContainer = t;
      endOffset = (endContainer as Text).data.length;
    }
  }

  return { start: startContainer, startOffset, end: endContainer, endOffset };
}

function getAnchorRects(anchor: Anchor, root: HTMLElement): DOMRect[] {
  // Build a full text range for the anchor, then get all client rects
  let n: Node | null = root
  for (const i of anchor.startPath) n = n?.childNodes[i] ?? null
  let m: Node | null = root
  for (const i of anchor.endPath)   m = m?.childNodes[i] ?? null
  if (!n || !m) return []

  // Coerce to text if needed
  if (n.nodeType !== Node.TEXT_NODE) n = firstTextNodeWithin(n) as Node
  if (m.nodeType !== Node.TEXT_NODE) m = firstTextNodeWithin(m, "backward") as Node
  if (!n || !m) return []

  const r = document.createRange()
  r.setStart(n, anchor.startOffset)
  r.setEnd(m, anchor.endOffset)

  const base = root.getBoundingClientRect()
  return Array.from(r.getClientRects()).map(rect =>
    new DOMRect(rect.left - base.left, rect.top - base.top, rect.width, rect.height)
  )
}



type PinPos = { id: string; top: number; left: number }
function solveCollisions(items: PinPos[], minGap = 18): PinPos[] {
  const sorted = [...items].sort((a, b) => a.top - b.top)
  let last = -Infinity
  for (const p of sorted) {
    if (p.top < last + minGap) p.top = last + minGap
    last = p.top
  }
  return sorted
}

function buildAnchorFromSelection(root: HTMLElement, sel: Selection): { anchor: Anchor; rect: DOMRect } | null {
  if (!sel.rangeCount) return null;
  const r = sel.getRangeAt(0);
  if (r.collapsed) return null;

  const { start, startOffset, end, endOffset } = coerceRangeEndsToText(r);
  const startPath = nodePathFromRoot(root, start);
  const endPath   = nodePathFromRoot(root, end);

  const rect = r.getBoundingClientRect();
  const base = root.getBoundingClientRect();
  const localRect = new DOMRect(rect.left - base.left, rect.top - base.top, rect.width, rect.height);

  const anchor: Anchor = { startPath, startOffset, endPath, endOffset };
  return { anchor, rect: localRect };
}

function getAnchorStartRect(anchor: Anchor, root: HTMLElement): DOMRect | null {
  let node: Node | null = root;
  for (const idx of anchor.startPath) node = node?.childNodes[idx] ?? null;
  if (!node) return null;

  if (node.nodeType !== Node.TEXT_NODE) node = firstTextNodeWithin(node) as Node;
  if (!node) return null;

  const range = document.createRange();
  range.setStart(node, anchor.startOffset);
  range.setEnd(node, anchor.startOffset);

  const rect = range.getClientRects()[0];
  if (!rect) return null;

  const base = root.getBoundingClientRect();
  return new DOMRect(rect.left - base.left, rect.top - base.top, rect.width, rect.height);
}

/* ---------------------------- Component ----------------------------- */

type Props = {
  template: string;
  heroSrc?: string | null;
  html: string;
  threads: CommentThread[];
  articleSlug: string;                       // 👈 for API calls
  currentUser?: unknown;
};

export default function ArticleReaderWithPins({
  template,
  heroSrc,
  html,
  threads: initialThreads,
  articleSlug,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
const bubbleRef    = useRef<HTMLDivElement>(null);   // 👈 NEW
  const [openId, setOpenId] = useState<string | null>(null);
  const [threads, setThreads] = useState<CommentThread[]>(initialThreads);
  const [tick, setTick] = useState(0);
  const GUTTER = 24 // px

  const [hoverId, setHoverId] = useState<string | null>(null)
  
  const rectsByThread = useMemo(() => {
    const root = containerRef.current
    if (!root) return {} as Record<string, DOMRect[]>
    const map: Record<string, DOMRect[]> = {}
    for (const t of threads) map[t.id] = getAnchorRects(t.anchor, root)
    return map
  }, [threads, html, tick])
  // selection bubble state
  const [bubble, setBubble] = useState<{
    anchor: Anchor;
    rect: DOMRect;
    text: string;
  } | null>(null);
  const [draftBody, setDraftBody] = useState("");

  // recalc on scroll/resize
  useEffect(() => {
    const ro = new ResizeObserver(() => setTick(t => t + 1));
    const onScroll = () => setTick(t => t + 1);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // recompute pin positions
  const positions = useMemo(() => {
    const root = containerRef.current;
    if (!root) return {};
    return Object.fromEntries(
      threads.map((t) => [t.id, getAnchorStartRect(t.anchor, root)])
    );
  }, [threads, html, tick]);

  // click‑outside to close bubble
  // replace your existing "click outside" effect with this:
useEffect(() => {
  function onDocPointerDown(e: PointerEvent) {
    if (!bubble) return;

    const root = containerRef.current;
    const bub  = bubbleRef.current;
    const target = e.target as Node;

    // If you click inside the bubble, keep it open
    if (bub && bub.contains(target)) return;

    // Clicks inside the article are handled by onMouseUpCapture (selection logic),
    // so don’t close here. That handler will close if the selection is collapsed.
    if (root && root.contains(target)) return;

    // Anywhere else (outside article + bubble) → close bubble
    setBubble(null);
  }

  document.addEventListener('pointerdown', onDocPointerDown);
  return () => document.removeEventListener('pointerdown', onDocPointerDown);
}, [bubble]);

  // selection capture
  const onMouseUpCapture: React.MouseEventHandler<HTMLDivElement> = () => {
    const root = containerRef.current;
    if (!root) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setBubble(null);
      return;
    }
    const packed = buildAnchorFromSelection(root, sel);
    if (!packed) return;

    const text = sel.toString().slice(0, 280);
    setDraftBody("");
    setBubble({ anchor: packed.anchor, rect: packed.rect, text });
  };

  async function createThread() {
    if (!bubble || !draftBody.trim()) return;
    const res = await fetch(`/api/articles/${encodeURIComponent(articleSlug)}/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anchor: bubble.anchor, body: draftBody }),
    });
    if (!res.ok) return; // TODO: toast error
    const created: CommentThread = await res.json();

    // optimistic add & open
    setThreads((cur) => [created, ...cur]);
    setOpenId(created.id);
    setBubble(null);
    setDraftBody("");
  }

  return (
    <ArticleReader template={template} heroSrc={heroSrc}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Article + pins */}
        <div className="relative pl-8">
          <div
            ref={containerRef}
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
            onMouseUpCapture={onMouseUpCapture}
          />
            {/* line highlights for active/hovered thread */}
  {(openId || hoverId) && rectsByThread[openId || hoverId!]?.map((r, i) => (
    <div
      key={i}
      className="absolute pointer-events-none bg-amber-200/30 rounded-sm"
      style={{ top: r.top, left: r.left, width: r.width, height: r.height }}
    />
  ))}
<div className="md:hidden mb-3">
  <button
    className="px-3 py-1.5 rounded bg-amber-500 text-white text-sm"
    onClick={() => setOpenId(threads[0]?.id ?? null)}
  >
    View comments ({threads.length})
  </button>
</div>

  {/* pin layer in the left gutter */}
  <div className="absolute inset-y-0 left-0 w-8 select-none">
    {solveCollisions(
      threads.map(t => ({
        id: t.id,
        top: (positions[t.id]?.top ?? 0) - 8, // center the 16px pin
        left: 4, // inside gutter
      }))
    ).map(p => {
      const t = threads.find(x => x.id === p.id)!
      const active = openId === t.id
      const hovered = hoverId === t.id
      const pos = positions[t.id]
      const leaderLeft = GUTTER // content start
      const leaderRight = Math.max(leaderLeft, (pos?.left ?? leaderLeft) - 4)

      return (
        <div key={t.id} className="absolute"
             style={{ top: p.top, left: p.left }}
             onMouseEnter={() => setHoverId(t.id)}
             onMouseLeave={() => setHoverId(null)}>
          {/* pin */}
          <button
            aria-label="Open comment"
            className={`w-4 h-4 rounded-full grid place-items-center text-[10px] leading-none
                        transition-opacity ring-1 shadow
                        ${t.resolved ? "bg-neutral-300 ring-neutral-300/40" : "bg-amber-400 ring-amber-500/30"}
                        ${active ? "opacity-100" : hovered ? "opacity-90" : "opacity-40 hover:opacity-80"}`}
            onClick={() => setOpenId(t.id)}
          >
            ●
          </button>

          {/* leader line appears only on hover/active */}
          {(active || hovered) && (
            <div
              className="absolute top-2 left-4 h-px bg-current opacity-30"
              style={{ width: leaderRight - leaderLeft }}
            />
          )}
        </div>
      )
    })}
  </div>


          {/* Existing pins
          {threads.map((t) => (
            <button
              key={t.id}
              className={`absolute flex z-20 w-5 h-5 rounded-full grid place-items-center  text-xs font-semibold bg-amber-400 text-white shadow ring-1 ring-amber-500/30 ${t.resolved ? "opacity-40" : ""}`}
              style={{
                top: positions[t.id]?.top ?? 0,
                left: (positions[t.id]?.left ?? 0) - 24,
              }}
              onClick={() => setOpenId(t.id)}
              aria-label="Open comment"
            >
              ●
            </button>
          ))} */}

          {/* Floating composer bubble */}
          {bubble && (
            <div
            ref={bubbleRef}                              // 👈 NEW
              className="absolute z-30 w-72 rounded-md border bg-white shadow-lg"
              style={{
                top: Math.max(0, bubble.rect.top - 56),
                left: bubble.rect.left,
              }}
              onPointerDown={(e) => e.stopPropagation()}   // 👈 keep global handler from seeing this
              onMouseDown={(e) => e.stopPropagation()}     // (older browsers / safety)
            >
              <div className="p-3 border-b text-xs text-neutral-600 line-clamp-2">
                {bubble.text}
              </div>
              <div className="p-2 space-y-2">
                <textarea
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  placeholder="Add a comment…"
                  className="w-full resize-none border rounded p-2 text-sm outline-none"
                  rows={3}
                />
                <div className="flex items-center justify-end gap-2">
                  <button className="text-sm text-neutral-500" onClick={() => setBubble(null)}>
                    Cancel
                  </button>
                  <button
                    className="px-3 py-1.5 rounded bg-amber-500 text-white text-sm"
                    onClick={createThread}
                  >
                    Comment
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <CommentSidebar
          threads={threads}
          activeThreadId={openId}
          // wire actions later:
          // onSubmit, onResolve, onVote
        />
      </div>
    </ArticleReader>
  );
}
