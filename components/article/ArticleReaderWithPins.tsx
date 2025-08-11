"use client"

import { useRef, useState, useMemo, useEffect } from "react"
import ArticleReader from "@/components/article/ArticleReader"
import CommentSidebar from "@/components/article/CommentSidebar"
import { CommentThread, Anchor } from "@/types/comments"

interface ArticleReaderWithPinsProps {
  template: string
  heroSrc?: string | null
  html: string
  threads: CommentThread[]
  currentUser?: unknown
  onSubmit?: (threadId: string, body: string) => void
  onResolve?: (threadId: string) => void
  onVote?: (commentId: string, delta: number) => void
}
function getAnchorRect(anchor: Anchor, root: HTMLElement): DOMRect | null {
  let node: Node | null = root;
  for (const idx of anchor.startPath) {
    node = node?.childNodes[idx] ?? null;
    if (!node) return null;
  }

  // Ensure we point at a TEXT node
  if (node.nodeType !== Node.TEXT_NODE) {
    const tw = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    node = tw.nextNode();
    if (!node) return null;
  }

  const range = document.createRange();
  range.setStart(node, anchor.startOffset);
  range.setEnd(node, anchor.startOffset);

  const rect = range.getClientRects()[0];
  if (!rect) return null;

  const base = root.getBoundingClientRect();
  return new DOMRect(rect.left - base.left, rect.top - base.top, rect.width, rect.height);
}

export default function ArticleReaderWithPins(props: {
  template: string;
  heroSrc?: string | null;
  html: string;
  threads: CommentThread[];
  currentUser?: unknown;
  onSubmit?: (threadId: string, body: string) => void;
  onResolve?: (threadId: string) => void;
  onVote?: (commentId: string, delta: number) => void;
}) {
  const { template, heroSrc, html, threads, currentUser, onSubmit, onResolve, onVote } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const ro = new ResizeObserver(() => setTick(t => t + 1));
    const onScroll = () => setTick(t => t + 1);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const positions = useMemo(() => {
    const root = containerRef.current;
    if (!root) return {};
    return Object.fromEntries(
      threads.map(t => [t.id, getAnchorRect(t.anchor, root)])
    );
  }, [threads, html, tick]);

  return (
    <ArticleReader template={template} heroSrc={heroSrc}>
      <div className="relative">
        <div
          ref={containerRef}
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {threads.map(t => (
          <button
            key={t.id}
            className={`pin ${t.resolved ? "pin--resolved" : ""} absolute z-20`}
            style={{
              top:  positions[t.id]?.top  ?? 0,
              left: (positions[t.id]?.left ?? 0) - 24,
            }}
            onClick={() => setOpenId(t.id)}
            aria-label="Open comment"
          >
            ●
          </button>
        ))}
        <CommentSidebar
          threads={threads}
          activeThreadId={openId}
          onSubmit={onSubmit}
          onResolve={onResolve}
          onVote={onVote}
          currentUser={currentUser}
        />
      </div>
    </ArticleReader>
  );
}
