"use client"

import { useRef, useState, useMemo } from "react"
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
  let node: Node | null = root
  for (const index of anchor.startPath) {
    node = node?.childNodes[index] ?? null
    if (!node) return null
  }
  const range = document.createRange()
  range.setStart(node!, anchor.startOffset)
  range.setEnd(node!, anchor.startOffset)
  const rect = range.getClientRects()[0]
  return rect ?? null
}

export default function ArticleReaderWithPins({
  template,
  heroSrc,
  html,
  threads,
  currentUser,
  onSubmit,
  onResolve,
  onVote,
}: ArticleReaderWithPinsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const positions = useMemo(() => {
    const root = containerRef.current
    if (!root) return {}
    return Object.fromEntries(
      threads.map((t) => [t.id, getAnchorRect(t.anchor, root)])
    )
  }, [threads, html])

  return (
    <ArticleReader template={template} heroSrc={heroSrc}>
      <div className="relative">
        <div
          ref={containerRef}
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {threads.map((t) => (
          <button
            key={t.id}
            style={{
              position: "absolute",
              top: positions[t.id]?.top ?? 0,
              left: (positions[t.id]?.left ?? 0) - 24,
            }}
            className={t.resolved ? "opacity-30" : ""}
            onClick={() => setOpenId(t.id)}
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
  )
}
