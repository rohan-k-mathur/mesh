'use client';

import * as React from 'react';
import useSWRInfinite from 'swr/infinite';
import { Virtuoso } from 'react-virtuoso';
import { mutate as globalMutate } from 'swr';

import CQBar from './CQBar';
import { useCQSummaryBatch } from '@/components/cq/useCQSummaryBatch';

// Detail modules
import SchemePicker from '@/components/cite/SchemePicker';
import CriticalQuestions from '@/components/claims/CriticalQuestions';
import ToulminMini from '@/components/deepdive/ToulminMini';
import { AddGround, AddRebut } from './AddGroundRebut';
import { ChallengeWarrantCard } from './ChallengeWarrantCard';

// shadcn/ui
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const PAGE = 10;
const fetcher = (u: string) =>
  fetch(u, { cache: 'no-store' }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

export type CardFilters = {
  status?: 'published' | 'draft';
  authorId?: string;
  since?: string;
  until?: string;
  sort?: 'createdAt:desc' | 'createdAt:asc';
};

function qs(base: string, params: Record<string, string | number | undefined>) {
  const url = new URL(base, 'http://x');
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  });
  return url.pathname + url.search + url.hash;
}

export default function CardListVirtuoso({
  deliberationId,
  filters: initialFilters = {},
}: {
  deliberationId: string;
  filters?: CardFilters;
}) {
  // filters
  const [status, setStatus] = React.useState<'published' | 'draft'>(initialFilters.status ?? 'published');
  const [author, setAuthor] = React.useState<string>(initialFilters.authorId ?? '');
  const [since, setSince] = React.useState<string>(initialFilters.since ?? '');
  const [until, setUntil] = React.useState<string>(initialFilters.until ?? '');
  const [sort, setSort] = React.useState<'createdAt:desc' | 'createdAt:asc'>(initialFilters.sort ?? 'createdAt:desc');

  // debounce author
  const [authorDebounced, setAuthorDebounced] = React.useState(author);
  React.useEffect(() => {
    const id = setTimeout(() => setAuthorDebounced(author.trim() || ''), 250);
    return () => clearTimeout(id);
  }, [author]);

  // SWR Infinite
  const getKey = (index: number, prev: any) => {
    if (prev && !prev.nextCursor) return null;
    const cursor = index === 0 ? undefined : prev.nextCursor;
    return qs(`/api/deliberations/${deliberationId}/cards`, {
      page: 1,
      status,
      authorId: authorDebounced || undefined,
      since: since || undefined,
      until: until || undefined,
      sort,
      limit: PAGE,
      cursor,
    });
  };

  const { data, size, setSize, isValidating, error, mutate } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
    keepPreviousData: true,
  });

  const items = React.useMemo(() => (data ?? []).flatMap((d) => d.items ?? []), [data]);
  const nextCursor = data?.[data.length - 1]?.nextCursor ?? null;

  // compute CQ summaries for the visible page
  const visibleClaimIds = React.useMemo(
    () => (items as any[]).map((c) => c.claimId).filter(Boolean) as string[],
    [items]
  );
  const { byId: cqById } = useCQSummaryBatch(deliberationId, visibleClaimIds);

  function resetFilters() {
    setStatus('published');
    setAuthor('');
    setSince('');
    setUntil('');
    setSort('createdAt:desc');
    mutate();
  }

  if (error) {
    return (
      <div className="text-xs text-rose-600">
        Failed to load cards. <button className="underline" onClick={() => mutate()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-2 rounded border p-2 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-600">Status</span>
          <Tabs value={status} onValueChange={(v) => setStatus(v as any)}>
            <TabsList>
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-neutral-600">Author</label>
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="authorId…" className="h-8 w-[160px]" />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-neutral-600">Since</label>
          <Input type="date" value={since} onChange={(e) => setSince(e.target.value)} className="h-8" />
          <label className="text-xs text-neutral-600">Until</label>
          <Input type="date" value={until} onChange={(e) => setUntil(e.target.value)} className="h-8" />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-neutral-600">Sort</label>
          <Select value={sort} onValueChange={(v) => setSort(v as any)}>
            <SelectTrigger className="h-8 w-[160px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt:desc">Newest first</SelectItem>
              <SelectItem value="createdAt:asc">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => mutate()}>Refresh</Button>
          <Button variant="ghost" size="sm" onClick={resetFilters}>Reset</Button>
        </div>
      </div>

      {/* List */}
      {!data && isValidating ? (
        <div className="text-xs text-neutral-500">Loading cards…</div>
      ) : !items.length ? (
        <div className="text-xs text-neutral-500">No cards.</div>
      ) : (
        <Virtuoso
          style={{ height: 520 }}
          data={items}
          itemKey={(i, c: any) => c.id}
          overscan={200}
          endReached={() => !isValidating && nextCursor && setSize((s) => s + 1)}
          itemContent={(i, c: any) => (
            <CardRow c={c} cqById={cqById} />
          )}
          components={{
            Footer: () => (
              <div className="py-3 text-center text-xs text-neutral-500">
                {isValidating ? 'Loading…' : nextCursor ? 'Scroll to load more' : 'End'}
              </div>
            ),
          }}
        />
      )}
    </div>
  );
}

/** CQ section for one card (safe hooks) */
function CardCQSection({ claimId, authorId, cqSummary,deliberationId }: {
  claimId: string;
  authorId: string;
  deliberationId: string;
  cqSummary?: { satisfied: number; required: number; openByScheme: Record<string,string[]> };
}) {
  const [showCq, setShowCq] = React.useState(false);
  return (
    <div className="mt-2">
      {cqSummary && <CQBar satisfied={cqSummary.satisfied} required={cqSummary.required} />}
      <div className="mt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCq((v) => !v)}
          disabled={!cqSummary || !cqSummary.required}
          title="Address open critical questions"
          className="text-xs px-2 py-1 h-7"
        >
          Address CQs
        </Button>
      </div>
      {showCq && (
        <div className="mt-2">
          <CriticalQuestions
            targetType="claim"
            targetId={claimId}
            createdById={authorId}
            counterFromClaimId=""
            deliberationId={deliberationId}   // 👈 now passed properly

            // prefilterKeys={Object.entries(cqSummary?.openByScheme ?? {}).flatMap(([sk, arr]) => arr.map(k => ({ schemeKey: sk, cqKey: k })))}
          />
        </div>
      )}
    </div>
  );
}

/** Row (memoized) */
const CardRow = React.memo(function CardRow({ c, cqById }: { c: any; cqById: Map<string, any> }) {
  const cqSummary = c.claimId ? cqById.get(c.claimId) : undefined;

  return (
    <div className="border rounded p-3 space-y-2 mb-2 bg-white">
      {/* Meta */}
      <div className="text-xs text-neutral-500">
        {new Date(c.createdAt).toLocaleString()} · by {c.authorId}
      </div>

      {/* Claim */}
      <div className="text-sm font-medium">{c.claimText}</div>

      {/* Reasons */}
      {Array.isArray(c.reasonsText) && c.reasonsText.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-neutral-700">Reasons</div>
          <ul className="list-disc ml-5 text-sm">
            {c.reasonsText.map((r: string, idx: number) => <li key={idx}>{r}</li>)}
          </ul>
        </div>
      )}

      {/* Evidence */}
      {Array.isArray(c.evidenceLinks) && c.evidenceLinks.length > 0 && (
        <div className="text-xs text-neutral-600">
          <span className="font-semibold text-neutral-700">Evidence: </span>
          {c.evidenceLinks.map((u: string) => (
            <a key={u} href={u} className="underline mr-2" target="_blank" rel="noreferrer">{u}</a>
          ))}
        </div>
      )}

      {/* Anticipated objections */}
      {Array.isArray(c.anticipatedObjectionsText) && c.anticipatedObjectionsText.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-neutral-700">Anticipated objections</div>
          <ul className="list-disc ml-5 text-sm">
            {c.anticipatedObjectionsText.map((o: string, idx: number) => <li key={idx}>{o}</li>)}
          </ul>
        </div>
      )}

      {/* Warrant */}
      {c.warrantText && (
        <div className="text-sm">
          <span className="text-xs font-semibold text-neutral-700">Warrant: </span>
          <span>{c.warrantText}</span>
        </div>
      )}

      {/* Challenge warrant */}
      {c.claimId && <ChallengeWarrantCard cardId={c.id} claimId={c.claimId} deliberationId={c.deliberationId} />}

      {/* Counter */}
      {c.counterText && (
        <div className="text-sm">
          <span className="text-xs font-semibold text-neutral-700">Counter: </span>
          <span>{c.counterText}</span>
        </div>
      )}

      {/* Confidence */}
      {typeof c.confidence === 'number' && (
        <div className="text-[11px] text-neutral-500">How sure: {Math.round(c.confidence * 100)}%</div>
      )}

      {/* Schemes + Toulmin + CQ + Ground/Rebut */}
      <div className="mt-2 rounded border border-slate-200 p-2 bg-white">
        <div className="flex items-center justify-start gap-8">
          <div className="text-sm font-semibold text-neutral-700">Schemes</div>
          {c.claimId && (
            <SchemePicker
              targetType="claim"
              targetId={c.claimId}
              createdById={c.authorId}
              onAttached={() => globalMutate(`/api/claims/${c.claimId}/toulmin`)}
            />
          )}
        </div>

        {c.claimId && <ToulminMini claimId={c.claimId} />}

        <div className="mt-2 grid gap-2">
          {c.claimId && (
            <>
              <AddGround claimId={c.claimId} deliberationId={c.deliberationId} createdById={c.authorId} />
              <AddRebut claimId={c.claimId} deliberationId={c.deliberationId} createdById={c.authorId} />
            </>
          )}
        </div>

        {/* CQ section */}
        {c.claimId && <CardCQSection claimId={c.claimId} authorId={c.authorId} cqSummary={cqSummary} deliberationId={c.deliberationId} />}
      </div>
    </div>
  );
});
CardRow.displayName = 'CardRow';
