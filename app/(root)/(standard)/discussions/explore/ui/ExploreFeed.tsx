// app/(root)/(standard)/discussions/explore/ui/ExploreFeed.tsx
'use client';
import * as React from 'react';
import { DiscussionCard } from '@/components/discussion/DiscussionCard';
type Item = {
  id: string;
  title: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
  replyCount?: number;
  viewCount?: number;
  createdById: string;
};

type SortOption = 'hot' | 'new' | 'top';

export default function ExploreFeed({
  initialItems,
    currentUserId,

  hasMore: initialHasMore,
}: {
  initialItems: Item[];
  currentUserId: string;
  hasMore: boolean;
}) {
  const [items, setItems] = React.useState<Item[]>(initialItems);
  const [cursor, setCursor] = React.useState(initialHasMore ? '20' : null);
  const [sort, setSort] = React.useState<SortOption>('hot');
  const [busy, setBusy] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Reload when sort changes
  React.useEffect(() => {
    async function loadSort() {
      setBusy(true);
      try {
        const u = new URL('/api/discussions/explore', location.origin);
        u.searchParams.set('limit', '20');
        u.searchParams.set('sort', sort);
        const r = await fetch(u.toString());
        const j = await r.json();
        setItems(j.items || []);
        setCursor(j.nextCursor);
      } finally {
        setBusy(false);
      }
    }
    if (sort !== 'hot') loadSort(); // hot is initial
  }, [sort]);

  async function loadMore() {
    if (!cursor || busy) return;
    setBusy(true);
    try {
      const u = new URL('/api/discussions/explore', location.origin);
      u.searchParams.set('limit', '20');
      u.searchParams.set('cursor', cursor);
      u.searchParams.set('sort', sort);
      const r = await fetch(u.toString());
      const j = await r.json();
      setItems(prev => [...prev, ...(j.items || [])]);
      setCursor(j.nextCursor);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-0 pb-4">
        {/* Header */}
        <header
          className={`mb-8 transition-all duration-500 ${
            mounted ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
          }`}
        >
          <div className="mb-6">
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">
              Explore Discussions
            </h1>
            <p className="text-sm text-slate-600">
              Discover and join conversations from across the platform
            </p>
          </div>

          {/* Sort Pills */}
          <div className="flex gap-2">
            {(['hot', 'new', 'top'] as SortOption[]).map(option => (
              <button
                key={option}
                onClick={() => setSort(option)}
                disabled={busy}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  sort === option
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {option === 'hot' && 'Hot'}
                {option === 'new' && 'New'}
                {option === 'top' && 'Top'}
              </button>
            ))}
          </div>
        </header>

        {/* Feed */}
        {busy && items.length === 0 ? (
          <div className="flex justify-center py-16">
            <span className="kb-spinner" />
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item, idx) => (
<DiscussionCard
  key={item.id}
  item={item}
  index={idx}
  mounted={mounted}
  showAuthor={true}
  currentUserId={currentUserId} // Pass this from props
  showSubscribe={true} // Show in explore feed!
/>
            ))}
          </div>
        )}

        {/* Load More */}
        {cursor && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={loadMore}
              disabled={busy}
              className="btnv2 transition-all duration-200"
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="kb-spinner" />
                  Loading…
                </span>
              ) : (
                'Load more'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ExploreCard({ item, index, mounted }: { item: Item; index: number; mounted: boolean }) {
  const [subscribed, setSubscribed] = React.useState(false);
  const [subscribing, setSubscribing] = React.useState(false);

  // Check subscription status
  React.useEffect(() => {
    async function checkSubscription() {
      const r = await fetch(`/api/discussions/${item.id}/subscribe`);
      const j = await r.json();
      setSubscribed(j.subscribed);
    }
    checkSubscription();
  }, [item.id]);

  async function toggleSubscribe() {
    setSubscribing(true);
    try {
      const method = subscribed ? 'DELETE' : 'POST';
      const r = await fetch(`/api/discussions/${item.id}/subscribe`, { method });
      const j = await r.json();
      setSubscribed(j.subscribed);
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <article
      className={`kb-edge group rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-md ${
        mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
      style={{ transitionDelay: `${Math.min(index * 30, 200)}ms` }}
    >
      <div className="flex gap-4">
        {/* Vote Column (optional for Reddit-style) */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <div className="text-xs font-medium text-slate-700">
            {item.replyCount ?? 0}
          </div>
          <div className="text-[10px] text-slate-400">replies</div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h2 className="mb-2 text-lg font-semibold text-slate-900 group-hover:text-indigo-600">
            <a href={`/discussions/${item.id}`}>{item.title || 'Untitled Discussion'}</a>
          </h2>

          {item.description && (
            <p className="mb-3 line-clamp-2 text-sm text-slate-600">{item.description}</p>
          )}

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Updated {formatDate(item.lastActiveAt)}</span>
            {(item.viewCount ?? 0) > 0 && <span>• {item.viewCount} views</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <a
            href={`/discussions/${item.id}`}
            className="btnv2 btnv2--sm whitespace-nowrap"
          >
            View
          </a>
          <button
            onClick={toggleSubscribe}
            disabled={subscribing}
            className={`btnv2 btnv2--sm whitespace-nowrap ${
              subscribed ? 'bg-indigo-100 text-indigo-700' : ''
            }`}
          >
            {subscribing ? '...' : subscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        </div>
      </div>
    </article>
  );
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}