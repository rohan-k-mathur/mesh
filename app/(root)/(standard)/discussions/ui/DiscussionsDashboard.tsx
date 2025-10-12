'use client';
import * as React from 'react';
import { NewDiscussionButton } from '@/components/discussion/NewDiscussionButton';
import DiscussionCard, { DiscussionListItem } from '@/components/discussion/DiscussionCard';

type Item = {
  id: string;
  title: string | null;
  description?: string | null;
  conversationId?: number | null;
  createdAt: string;
  updatedAt: string;
  status?: string | null;
};

export default function DiscussionsDashboard({
  initialItems,
  initialNextCursor,
  pageSize,
}: {
  initialItems: Item[];
  initialNextCursor: { updatedAt: string; id: string } | null;
  pageSize: number;
}) {
  const [items, setItems] = React.useState<Item[]>(initialItems);
  const [cursor, setCursor] = React.useState(initialNextCursor);
  const [busy, setBusy] = React.useState(false);

  async function loadMore() {
    if (!cursor || busy) return;
    setBusy(true);
    try {
      const u = new URL('/api/discussions/list', location.origin);
      u.searchParams.set('limit', String(pageSize));
      u.searchParams.set('cursorUpdatedAt', cursor.updatedAt);
      u.searchParams.set('cursorId', cursor.id);
      const r = await fetch(u.toString(), { cache: 'no-store' });
      const j = await r.json();
      setItems(prev => [...prev, ...j.items]);
      setCursor(j.nextCursor ?? null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-base font-semibold">Your Discussions</h1>
        <NewDiscussionButton variant="solid" />
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((x) => (
          <DiscussionCard key={x.id} item={x as DiscussionListItem} />
        ))}
      </ul>

      <div className="mt-4">
        {cursor ? (
          <button
            onClick={loadMore}
            disabled={busy}
            className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            {busy ? 'Loading…' : 'Load more'}
          </button>
        ) : (
          <div className="text-[12px] text-slate-500">No more discussions.</div>
        )}
      </div>
    </div>
  );
}
