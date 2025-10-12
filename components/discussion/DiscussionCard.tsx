'use client';
import * as React from 'react';

export type DiscussionListItem = {
  id: string;
  title: string | null;
  description?: string | null;
  updatedAt: string;           // ISO string
  createdAt?: string;
  conversationId?: number | null;
  // Optional extras for future: linked entity, counts, badges, etc.
  status?: string | null;
};

export default function DiscussionCard({ item }: { item: DiscussionListItem }) {
  const title = (item.title ?? '').trim() || 'Untitled';
  const updated = new Date(item.updatedAt).toLocaleString();

  return (
    <li className="rounded border bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{title}</div>
          {item.description && (
            <p className="mt-0.5 line-clamp-2 text-[12px] text-slate-600">
              {item.description}
            </p>
          )}
          <div className="mt-1 text-[11px] text-slate-600">
            updated {updated}
            {item.status && <> • {item.status}</>}
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        <a
          className="rounded border px-2 py-1 hover:bg-slate-50"
          href={`/discussions/${item.id}`}
        >
          open
        </a>
        {item.conversationId != null && (
          <a
            className="rounded border px-2 py-1 hover:bg-slate-50"
            href={`/messages/${item.conversationId}`}
          >
            chat
          </a>
        )}
      </div>
    </li>
  );
}
