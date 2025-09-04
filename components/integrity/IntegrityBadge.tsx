// components/integrity/IntegrityBadge.tsx
'use client';
import useSWR from 'swr';

const fetcher = (u:string) => fetch(u, { cache: 'no-store' }).then(r => r.json());

export default function IntegrityBadge({ workId, theoryType }:{ workId: string; theoryType?: 'DN'|'IH'|'TC'|'OP' }) {
  const needsPractical = theoryType === 'IH' || theoryType === 'TC' || theoryType === 'DN';
  const { data } = useSWR(needsPractical ? `/api/works/${workId}/practical` : null, fetcher);
  if (!needsPractical) return null;

  const has = data && (Array.isArray(data.criteria) ? data.criteria.length > 0 : false);
  return has
    ? <span className="text-[11px] px-1.5 py-0.5 rounded border bg-emerald-50 border-emerald-200 text-emerald-700">Practical: present</span>
    : <span className="text-[11px] px-1.5 py-0.5 rounded border bg-amber-50 border-amber-200 text-amber-700">Tip: add Practical Argument</span>;
}
