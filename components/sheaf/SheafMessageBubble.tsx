"use client";

import * as React from "react";
import type { CSSProperties } from "react";
import { ReactionSummary } from "../reactions/ReactionSummary";
import { ReactionBar } from "../reactions/ReactionBar";
type FacetDTO = {
  id: string;
  audience: any;
  sharePolicy: "ALLOW" | "REDACT" | "FORBID";
  expiresAt: string | null;
  body: any;
  attachments?: { id?: string; name?: string; mime?: string; size?: number; path?: string; sha256?: string }[];
  priorityRank: number;
  createdAt: string;
};


function textFromTipTap(node: any): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (node.text) return node.text;
  if (Array.isArray(node.content)) return node.content.map(textFromTipTap).join("");
  if (typeof node === "object") return textFromTipTap(node.content);
  return "";
}

function renderBody(body: any) {
  if (!body) return null;

  // 1) Simple shape: { text: "..." }
  if (typeof body === "object" && typeof body.text === "string") {
    return <p className="whitespace-pre-wrap">{body.text}</p>;
  }

  // 2) TipTap JSON: { type:"doc", content:[...] }
  if (typeof body === "object" && body.type === "doc") {
    const txt = textFromTipTap(body);
    if (txt.trim().length > 0) {
      return <p className="whitespace-pre-wrap">{txt}</p>;
    }
  }

  // 3) Fallback (visible during dev only)
  try {
    const short = JSON.stringify(body);
    return <pre className="text-xs text-slate-500 overflow-x-auto">{short}</pre>;
  } catch {
    return null;
  }
}

export function SheafMessageBubble(props: {
  messageId: string;
  conversationId: string;
  currentUserId: string;
  facets: FacetDTO[];
  defaultFacetId?: string | null;
  style?: CSSProperties;
  className?: string;
}) {
  // const { facets, defaultFacetId } = props;
  const { messageId, conversationId, currentUserId, facets, defaultFacetId } = props;
  const [activeId, setActiveId] = React.useState<string>(defaultFacetId ?? facets[0].id);

  // const [activeId, setActiveId] = React.useState<string | null>(
    // defaultFacetId ?? facets[0]?.id ?? null
  

  React.useEffect(() => {
    // If defaultFacetId changes (or the message re-renders), keep it in sync.
    if (!activeId && (defaultFacetId || facets[0])) {
      setActiveId(defaultFacetId ?? facets[0]?.id ?? null);
    }
  }, [defaultFacetId, facets, activeId]);

  const active =
    (activeId && facets.find((f) => f.id === activeId)) || facets[0] || null;

  if (!active) return null;

  return (
    <div className="bg-slate-100/70 align-center    px-3  h-fit pt-1 rounded-xl tracking-wide max-w-[60%]  sheaf-bubble outline-transparent 
    text-[.9rem] text-shadow-md text-slate-950 dark:bg-slate-50 dark:text-slate-900">
      {facets.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {facets.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveId(f.id)}
              className={[
                "text-[.9rem] ",
                f.id === activeId ? "bg-indigo-500 text-white" : "bg-white/80",
              ].join(" ")}
              title={
                typeof f.audience === "object" && f.audience?.kind
                  ? `Layer: ${f.audience.kind}`
                  : "Layer"
              }
            >
              {f.audience?.kind === "EVERYONE"
                ? "Everyone"
                : f.audience?.kind === "ROLE"
                ? `Role: ${f.audience?.role ?? "?"}`
                : f.audience?.kind === "LIST"
                ? `List: ${f.audience?.listId ?? "?"}`
                : f.audience?.kind === "USERS"
                ? "Specific people"
                : "Layer"}
            </button>
          ))}
        </div>
      )}

      {/* Body */}
      <div>{renderBody(active.body)}</div>

      {/* Facet-level attachments (optional) */}
      {Array.isArray(active.attachments) && active.attachments.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs">
          {active.attachments.map((a, i) => (
            <li key={a.sha256 ?? a.id ?? i} className="flex items-center gap-2">
              <span>📎</span>
              <span className="truncate">
                {a.name ?? a.path ?? a.sha256 ?? "file"}{" "}
                {typeof a.size === "number" && (
                  <span className="text-slate-400">({(a.size / 1024).toFixed(1)} KB)</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      <ReactionSummary messageId={messageId} />
      <ReactionBar
        conversationId={conversationId}
        messageId={messageId}
        userId={currentUserId}
        activeFacetId={activeId}
      />
    </div>
  );
}
