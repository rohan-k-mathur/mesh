"use client";
import { useMemo, useRef, useEffect } from "react";
import useSWRInfinite from "swr/infinite";
import { Virtuoso } from "react-virtuoso";
import PromoteToClaimButton from "../claims/PromoteToClaimButton";
import CitePickerInline from "@/components/citations/CitePickerInline";
import { SkeletonLines } from "@/components/ui/SkeletonB";
import React from "react";

const PAGE = 20;
const fetcher = (u: string) => fetch(u, { cache: "no-store" }).then(r => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
});

type Arg = {
  id: string;
  text: string;
  confidence?: number | null;
  createdAt: string;
  authorId: string;
  mediaUrl?: string | null;
  claimId?: string | null;
  quantifier?: "SOME" | "MANY" | "MOST" | "ALL" | null;
  modality?: "COULD" | "LIKELY" | "NECESSARY" | null;
  mediaType?: "text" | "image" | "video" | "audio" | null;
  edgesOut?: Array<{ type: "rebut" | "undercut"; targetScope?: "premise" | "inference" | "conclusion" }>;
  approvedByUser?: boolean;
};

export default function ArgumentsList({
  deliberationId,
  onReplyTo,
  onChanged,
}: {
  deliberationId: string;
  onReplyTo: (id: string) => void;
  onChanged?: () => void;
}) {
  const getKey = (index: number, prev: any) => {
    if (prev && !prev.nextCursor) return null;
    const cursor = index === 0 ? "" : `&cursor=${prev.nextCursor}`;
    return `/api/deliberations/${deliberationId}/arguments?limit=${PAGE}${cursor}&sort=createdAt:desc`;
  };

  const { data, size, setSize, isValidating, error, mutate } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
    keepPreviousData: true,
  });

  const items: Arg[] = useMemo(() => (data ?? []).flatMap((d) => d.items), [data]);
  const nextCursor = data?.[data.length - 1]?.nextCursor ?? null;

  // Approve action (kept as-is, optimistically revalidates lists + any parent recompute)
  const approve = async (id: string, approve: boolean) => {
    try {
      const res = await fetch(`/api/deliberations/${deliberationId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ argumentId: id, approve }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onChanged?.();
      mutate(); // refresh first page
    } catch (e) {
      console.error("approve failed", e);
    }
  };

  const openDispute = async (id: string, label: string) => {
    try {
      const res = await fetch(`/api/deliberations/${deliberationId}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, links: [id] }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error("dispute failed", e);
    }
  };

  if (!data && isValidating) {
    return (
      <div className="rounded-md border p-3 space-y-2">
        <div className="text-sm font-medium">Arguments</div>
        <div className="p-2 border rounded"><SkeletonLines lines={3} /></div>
        <div className="p-2 border rounded"><SkeletonLines lines={3} /></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-md border p-3 space-y-2">
        <div className="text-sm font-medium">Arguments</div>
        <div className="text-xs text-rose-600">{String(error?.message || 'Failed to load')}</div>
        <button className="text-xs underline" onClick={() => mutate()}>Retry</button>
      </div>
    );
  }
  if (!items.length) {
    return (
      <div className="rounded-md border p-3 space-y-2">
        <div className="text-sm font-medium">Arguments</div>
        <div className="text-xs text-neutral-600">No arguments yet — start by adding your <b>Point</b> and optional <b>Sources</b>.</div>
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full px-2 rounded-md border ">
      <div className="px-3 py-2 text-md font-medium">Arguments</div>
      <div className="rounded-md border py-1">
      <Virtuoso
        style={{ height: 520 }}
        data={items}
        endReached={() => !isValidating && nextCursor && setSize((s) => s + 1)}
        itemContent={(index, a) => {
          const created = new Date(a.createdAt).toLocaleString();
          const alt = a.text ? a.text.slice(0, 50) : "argument image";
          return (
            <div id={`arg-${a.id}`} className="p-3 border-b focus:outline-none">
              {/* badges */}
              <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                {a.quantifier && <span className="px-1.5 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700">{a.quantifier}</span>}
                {a.modality &&  <span className="px-1.5 py-0.5 rounded border border-violet-200 bg-violet-50 text-violet-700">{a.modality}</span>}
                {a.mediaType && a.mediaType !== "text" && (
                  <span className="px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700">{a.mediaType}</span>
                )}
              </div>

              <div className="text-xs text-neutral-500 mb-1">{created}</div>

              {Array.isArray(a.edgesOut) && a.edgesOut.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {a.edgesOut.map((e, i) => {
                    if (e.type !== "rebut" && e.type !== "undercut") return null;
                    const label = e.type === "undercut" ? "inference" : (e.targetScope ?? "conclusion");
                    const style =
                      label === "inference" ? "border-violet-200 bg-violet-50 text-violet-700"
                      : label === "premise" ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-blue-200 bg-blue-50 text-blue-700";
                    return <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded border ${style}`}>{label}</span>;
                  })}
                </div>
              )}

              <div className="text-sm whitespace-pre-wrap line-clamp-3">{a.text}</div>

              {a.mediaType === "image" && a.mediaUrl && (
                <div className="mt-2"><img src={a.mediaUrl} alt={alt} loading="lazy" className="max-h-40 object-contain border rounded" /></div>
              )}
              {a.mediaType === "video" && a.mediaUrl && (
                <div className="mt-2"><video controls preload="metadata" className="max-h-52 border rounded"><source src={a.mediaUrl} /></video></div>
              )}
              {a.mediaType === "audio" && a.mediaUrl && (
                <div className="mt-2"><audio controls preload="metadata" className="w-full"><source src={a.mediaUrl} /></audio></div>
              )}

              {a.confidence != null && (
                <div className="text-[11px] text-neutral-500 mt-1">How sure: {(a.confidence * 100).toFixed(0)}%</div>
              )}

              <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                <button className="px-2 py-1 border rounded text-xs" onClick={() => onReplyTo(a.id)}>Reply</button>
                {a.claimId ? (
                  <span className="text-[11px] px-2 py-1 rounded border border-emerald-300 bg-emerald-50 text-emerald-700">Promoted ✓</span>
                ) : (
                  <PromoteToClaimButton
                    deliberationId={deliberationId}
                    target={{ type: "argument", id: a.id }}
                    onClaim={() => mutate()}
                  />
                )}
                <CiteInline deliberationId={deliberationId} argumentId={a.id} text={a.text} />
                {a.approvedByUser ? (
                  <button className="px-2 py-1 border rounded text-xs bg-emerald-50 border-emerald-300 text-emerald-700"
                    onClick={() => approve(a.id, false)}>Approved ✓ (Unapprove)</button>
                ) : (
                  <button className="px-2 py-1 border rounded text-xs" onClick={() => approve(a.id, true)}>Approve</button>
                )}
                {a.mediaType === "image" && (
                  <>
                    <button className="px-2 py-1 border rounded text-xs" onClick={() => openDispute(a.id, "Image – Appropriateness")}>Dispute image (Appropriateness)</button>
                    <button className="px-2 py-1 border rounded text-xs" onClick={() => openDispute(a.id, "Image – Depiction")}>Dispute image (Depiction)</button>
                  </>
                )}
              </div>
            </div>
          );
        }}
        components={{
          Footer: () => (
            <div className="py-3 text-center text-xs text-neutral-500">
              {isValidating ? 'Loading…' : nextCursor ? 'Scroll to load more' : 'End'}
            </div>
          ),
        }}
      />
      </div>
    </div>
  );
}

function CiteInline({ deliberationId, argumentId, text }: { deliberationId: string; argumentId: string; text: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button className="px-2 py-1 border rounded text-xs" onClick={() => setOpen(o => !o)}>
        {open ? "Close cite" : "Cite"}
      </button>
      {open && (
        <div className="mt-2">
          <CitePickerInline deliberationId={deliberationId} argumentText={text} onDone={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
