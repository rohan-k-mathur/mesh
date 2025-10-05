'use client';
import * as React from 'react';
import { NewKbButton } from '@/components/kb/NewKbButton';

type Item = {
  id:string; title:string|null; spaceId:string;
  createdAt:string; updatedAt:string; status?:string|null;
};
export default function KbDashboard({
  initialItems, initialNextCursor, pageSize
}: {
  initialItems: Item[];
  initialNextCursor: { updatedAt:string; id:string } | null;
  pageSize: number;
}) {
  const [items, setItems] = React.useState<Item[]>(initialItems);
  const [cursor, setCursor] = React.useState(initialNextCursor);
  const [busy, setBusy] = React.useState(false);

  async function loadMore() {
    if (!cursor) return;
    setBusy(true);
    const u = new URL('/api/kb/pages/list', location.origin);
    u.searchParams.set('limit', String(pageSize));
    u.searchParams.set('cursorUpdatedAt', cursor.updatedAt);
    u.searchParams.set('cursorId', cursor.id);
    const r = await fetch(u.toString(), { cache: 'no-store' });
    const j = await r.json();
    setItems(prev => [...prev, ...j.items]);
    setCursor(j.nextCursor ?? null);
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-base font-semibold">Your KB Pages</h1>
        <NewKbButton />
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map(x => (
          <li key={x.id} className="rounded border bg-white p-3">
            <div className="text-sm font-medium truncate">{x.title || 'Untitled'}</div>
            <div className="text-[11px] text-slate-600">
              updated {new Date(x.updatedAt).toLocaleString()}
              {x.status && <> • {x.status}</>}
            </div>
            <div className="mt-2 flex gap-2 text-sm">
              <a className="rounded border px-2 py-1 hover:bg-slate-50" href={`/kb/pages/${x.id}`}>view</a>
              <a className="rounded border px-2 py-1 hover:bg-slate-50" href={`/kb/pages/${x.id}/edit`}>edit</a>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        {cursor ? (
          <button onClick={loadMore} disabled={busy}
                  className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50">
            {busy ? 'Loading…' : 'Load more'}
          </button>
        ) : (
          <div className="text-[12px] text-slate-500">No more pages.</div>
        )}
      </div>
    </div>
  );
}
