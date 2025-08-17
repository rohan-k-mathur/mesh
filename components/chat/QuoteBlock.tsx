"use client";
import React from "react";

type Quote = {
  sourceMessageId: string;
  sourceFacetId?: string | null;
  status: "ok" | "redacted" | "unavailable";
  body?: unknown | string | null;
  attachments?: Array<{ id: string; name?: string; mime: string; size: number; sha256?: string; path?: string | null }>;
  isEdited?: boolean;
  sourceAuthor?: { name: string | null; image: string | null } | null;
  updatedAt?: string | null;
};

export function QuoteBlock({ q }: { q: Quote }) {
  if (q.status === "redacted") {
    return (
      <div className="mt-1 rounded-md border bg-slate-50 px-2 py-1 text-slate-500 italic">
        (redacted)
      </div>
    );
  }
  if (q.status === "unavailable") {
    return (
      <div className="mt-1 rounded-md border bg-slate-50 px-2 py-1 text-slate-500 italic">
        (unavailable)
      </div>
    );
  }
  // ok
  const text =
    typeof q.body === "string"
      ? q.body
      : typeof q.body === "object"
      ? JSON.stringify(q.body)
      : q.body ?? "";

  return (
    <div className="mt-1 rounded-md border bg-white px-3 py-1.5 shadow-sm">
      <div className="text-[12px] text-slate-500 mb-1">
        {q.sourceAuthor?.name ?? "Quoted message"} {q.isEdited ? <span className="ml-1 italic">(edited)</span> : null}
      </div>
      <div className="text-[14px] whitespace-pre-wrap break-words">
        {String(text || "").slice(0, 800)}
      </div>
      {q.attachments?.length ? (
        <div className="mt-2 text-[12px] text-slate-600">
          {q.attachments.length} attachment{q.attachments.length === 1 ? "" : "s"}
        </div>
      ) : null}
    </div>
  );
}
