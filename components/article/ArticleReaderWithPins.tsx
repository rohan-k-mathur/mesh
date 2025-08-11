"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ArticleReader from "@/components/article/ArticleReader";
import CommentSidebar from "@/components/article/CommentSidebar";
import type { Anchor, CommentThread } from "@/types/comments";

/* ----------------------- DOM ↔ anchor helpers ----------------------- */

type Cluster = { top: number; items: string[] }  // ids

function clusterByTop(positions: Record<string, DOMRect | undefined>, threshold = 40): Cluster[] {
  const entries = Object.entries(positions)
    .filter(([, r]) => r)
    .map(([id, r]) => ({ id, top: r!.top }))
    .sort((a, b) => a.top - b.top)

  const clusters: Cluster[] = []
  for (const e of entries) {
    const last = clusters[clusters.length - 1]
    if (!last || Math.abs(e.top - last.top) > threshold) {
      clusters.push({ top: e.top, items: [e.id] })
    } else {
      last.items.push(e.id)
      // nudge centroid slightly
      last.top = (last.top * (last.items.length - 1) + e.top) / last.items.length
    }
  }
  return clusters
}

function findTextForwardFromBoundary(root: Node, container: Node, offset: number): { node: Text; offset: number } | null {
  if (container.nodeType === Node.TEXT_NODE) {
    const t = container as Text
    return { node: t, offset: Math.min(offset, t.data.length) }
  }

  // Prefer the first text node inside child at `offset` (the node to the RIGHT of the boundary)
  const parent = container as Node
  const child = (parent.childNodes[offset] ?? null)
  if (child) {
    const t = firstTextNodeWithin(child, "forward") as Text | null
    if (t) return { node: t, offset: 0 }
  }

  // Otherwise, walk forward in DOM order from the boundary
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  // position the walker just before/at the boundary
  let prev: Node | null = null
  while (walker.nextNode()) {
    if (walker.currentNode === child) break
    prev = walker.currentNode
  }
  // we might not be aligned; do a simple forward scan for first text node after boundary
  let n: Node | null = child ?? prev?.nextSibling ?? (parent.childNodes[offset] ?? parent.nextSibling)
  while (n) {
    const t = firstTextNodeWithin(n, "forward") as Text | null
    if (t) return { node: t, offset: 0 }
    n = n.nextSibling
  }

  // fallback: first text in the subtree
  const t = firstTextNodeWithin(parent, "forward") as Text | null
  return t ? { node: t, offset: 0 } : null
}

function findTextBackwardFromBoundary(root: Node, container: Node, offset: number): { node: Text; offset: number } | null {
  if (container.nodeType === Node.TEXT_NODE) {
    const t = container as Text
    return { node: t, offset: Math.min(offset, t.data.length) }
  }

  const parent = container as Node
  const childIdx = offset - 1
  let child: Node | null = childIdx >= 0 ? parent.childNodes[childIdx] : null
  while (child) {
    const t = firstTextNodeWithin(child, "backward") as Text | null
    if (t) return { node: t, offset: t.data.length }
    child = child.previousSibling
  }

  // fallback: last text in the subtree
  const t = firstTextNodeWithin(parent, "backward") as Text | null
  return t ? { node: t, offset: t.data.length } : null
}

function normalizeRangeToTextNodes(root: HTMLElement, r: Range) {
  // Both ends prefer going FORWARD to the nearest text node when the boundary
  // sits between elements. This matches the visual caret users expect.
  const s = findTextForwardFromBoundary(root, r.startContainer, r.startOffset)
  const e =
    findTextForwardFromBoundary(root, r.endContainer,   r.endOffset) ??
    findTextBackwardFromBoundary(root, r.endContainer,  r.endOffset)

  if (!s || !e) return null
  return { start: s.node, startOffset: s.offset, end: e.node, endOffset: e.offset }
}

function buildAnchorFromSelection(root: HTMLElement, sel: Selection): { anchor: Anchor; rect: DOMRect } | null {
  if (!sel.rangeCount) return null
  const r = sel.getRangeAt(0)
  if (r.collapsed) return null

  const norm = normalizeRangeToTextNodes(root, r)
  if (!norm) return null

  const { start, startOffset, end, endOffset } = norm
  const startPath = nodePathFromRoot(root, start)
  const endPath   = nodePathFromRoot(root, end)

  const rect = r.getBoundingClientRect()
  const base = root.getBoundingClientRect()
  const localRect = new DOMRect(rect.left - base.left, rect.top - base.top, rect.width, rect.height)

  const anchor: Anchor = { startPath, startOffset, endPath, endOffset }
  return { anchor, rect: localRect }
}

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

function CommentRail({
  threads,
  positions,
  openId,
  setOpenId,
}: {
  threads: CommentThread[]
  positions: Record<string, DOMRect | undefined>
  openId: string | null
  setOpenId: (id: string | null) => void
}) {
  // one-line items, collision-resolved
  const items = solveCollisions(
    threads.map(t => ({ id: t.id, top: (positions[t.id]?.top ?? 0) - 8, left: 0 }))
  )

  return (
    <div className="relative min-h-[1px] h-full">
      {items.map(p => {
        const t = threads.find(x => x.id === p.id)!
        const active = openId === t.id
        const firstLine = t.comments[0]?.body ?? ''
        return (
          <div className="space-y-4 gap-4 h-full">
          <button
            key={t.id}
            className={`absolute right-0 translate-y-[-50%] truncate w-full text-left m-2
                       text-xs px-2 py-1 rounded border bg-white/30 backdrop-blur
                       shadow-sm hover:bg-white transition
                       ${active ? 'border-amber-400' : 'border-neutral-200'}`}
            style={{ top: p.top }}
            onClick={() => setOpenId(t.id)}
            title={firstLine}
          >
            {firstLine.length > 60 ? firstLine.slice(0, 57) + '…' : firstLine}
          </button>
          </div>
        )
      })}
    </div>
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

// function buildAnchorFromSelection(root: HTMLElement, sel: Selection): { anchor: Anchor; rect: DOMRect } | null {
//   if (!sel.rangeCount) return null;
//   const r = sel.getRangeAt(0);
//   if (r.collapsed) return null;

//   const { start, startOffset, end, endOffset } = coerceRangeEndsToText(r);
//   const startPath = nodePathFromRoot(root, start);
//   const endPath   = nodePathFromRoot(root, end);

//   const rect = r.getBoundingClientRect();
//   const base = root.getBoundingClientRect();
//   const localRect = new DOMRect(rect.left - base.left, rect.top - base.top, rect.width, rect.height);

//   const anchor: Anchor = { startPath, startOffset, endPath, endOffset };
//   return { anchor, rect: localRect };
// }

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
  const [adder, setAdder] = useState<{ anchor: Anchor; rect: DOMRect } | null>(null)
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
    const root = containerRef.current
    if (!root) return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) {
      setAdder(null)
      setBubble(null)
      return
    }
    const packed = buildAnchorFromSelection(root, sel)
    if (!packed) return
  
    setAdder({ anchor: packed.anchor, rect: packed.rect })
    setBubble(null) // don’t open yet
  }

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
  const clusters = useMemo(() => clusterByTop(positions, 40), [positions]);
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null); // cluster key = `${top}` or a generated id

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
 
<div className="absolute inset-y-0 left-0 w-8 select-none hidden md:block">
  {clusters.map((c, i) => {
    const key = `c${i}-${Math.round(c.top)}`
    const many = c.items.length > 3
    const expanded = expandedCluster === key

    if (many && !expanded) {
      // collapsed badge
      return (
        <div key={key} className="absolute" style={{ top: c.top - 8, left: 4 }}>
          <button
            className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs shadow ring-1 ring-amber-500/30"
            onClick={() => setExpandedCluster(key)}
            title={`${c.items.length} comments`}
          >
            {c.items.length}
          </button>
        </div>
      )
    }

    // expanded or small cluster → show individual pins stacked
    const stack = solveCollisions(
      c.items.map((id, idx) => ({ id, top: c.top + idx * 16 - 8, left: 4 })), 14
    )
    return stack.map(p => {
      const t = threads.find(x => x.id === p.id)!
      const active = openId === t.id
      return (
        <div key={`${key}-${t.id}`} className="absolute" style={{ top: p.top, left: p.left }}
             onMouseEnter={() => setHoverId(t.id)} onMouseLeave={() => setHoverId(null)}>
          <button
            className={`w-4 h-4 rounded-full grid place-items-center text-[10px] leading-none
                        ring-1 shadow ${t.resolved ? 'bg-neutral-300 ring-neutral-300/40' : 'bg-amber-400 ring-amber-500/30'}
                        ${active ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
            onClick={() => { setOpenId(t.id); setExpandedCluster(null) }}
            aria-label="Open comment"
          >●</button>
        </div>
      )
    })
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
          {/* Small “+” adder above selection */}
{adder && (
  <button
    className="absolute z-30 w-6 h-6 rounded-full bg-amber-500 text-white text-sm grid place-items-center shadow-lg"
    style={{
      top: Math.max(0, adder.rect.top - 28),
      left: adder.rect.left + adder.rect.width / 2 - 12,
    }}
    onMouseDown={e => e.preventDefault()}       // keep selection
    onClick={() => {
      // open composer bubble with the same anchor
      const root = containerRef.current!
      const rects = getAnchorRects(adder.anchor, root)
      const first = rects[0] ?? adder.rect
      setBubble({ anchor: adder.anchor, rect: first, text: window.getSelection()?.toString().slice(0, 280) ?? '' })
      setAdder(null)
    }}
    aria-label="Comment on selection"
  >
    +
  </button>
)}

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

        <div className="relative">
      <CommentRail
        threads={threads}
        positions={positions}
        openId={openId}
        setOpenId={setOpenId}
      />
          </div>
      </div>
    </ArticleReader>
  );
}
