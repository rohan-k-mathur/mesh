"use client";
import { useEffect, useMemo, useState } from "react";
import PromoteToClaimButton from "../claims/PromoteToClaimButton";
import CitePickerInline from "@/components/citations/CitePickerInline";
import { SkeletonLines, SkeletonBlock } from "@/components/ui/SkeletonB";

type Arg = {
  id: string;
  text: string;
  confidence?: number | null;
  createdAt: string;
  authorId: string;
  mediaUrl?: string;
  quantifier?: "SOME" | "MANY" | "MOST" | "ALL" | null;
  modality?: "COULD" | "LIKELY" | "NECESSARY" | null;
  mediaType?: "text" | "image" | "video" | "audio" | null;
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
  const [items, setItems] = useState<Arg[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pendingMap, setPendingMap] = useState<Record<string, boolean>>({}); // per-arg pending for approve/dispute
  const [citeOpenId, setCiteOpenId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/deliberations/${deliberationId}/arguments`,
        {
          cache: "no-store",
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json().catch(() => ({}));
      setItems(data.arguments ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load arguments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliberationId]);

  // optimistic approve
  const approve = async (id: string, approve: boolean) => {
    setPendingMap((m) => ({ ...m, [id]: true }));
    const prev = items;
    try {
      // For optimistic UI, no local count here; we just notify parent to recompute views
      const res = await fetch(`/api/deliberations/${deliberationId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ argumentId: id, approve }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onChanged?.(); // recompute views
      // optionally reload arguments if you want to reflect approvals on this list
      // await load();
    } catch (e) {
      // rollback if you had local state; here we just log
      console.error("approve failed", e);
      setItems(prev);
    } finally {
      setPendingMap((m) => ({ ...m, [id]: false }));
    }
  };

  // open dispute issue (two presets)
  const openDispute = async (id: string, label: string) => {
    setPendingMap((m) => ({ ...m, [id]: true }));
    try {
      const res = await fetch(`/api/deliberations/${deliberationId}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, links: [id] }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error("dispute failed", e);
    } finally {
      setPendingMap((m) => ({ ...m, [id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="rounded-md border p-3 space-y-2">
        <div className="text-sm font-medium">Arguments</div>
        <div className="p-2 border rounded">
          <SkeletonLines lines={3} />
        </div>
        <div className="p-2 border rounded">
          <SkeletonLines lines={3} />
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-md border p-3 space-y-2">
        <div className="text-sm font-medium">Arguments</div>
        <div className="text-xs text-rose-600">{err}</div>
        <button className="text-xs underline" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-md border p-3 space-y-2">
        <div className="text-sm font-medium">Arguments</div>
        <div className="text-xs text-neutral-600">
          No arguments yet — start by adding your **Point** and optional
          **Sources**.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="text-sm font-medium">Arguments</div>
      <ul className="space-y-2">
        {items.slice(0, 30).map((a) => {
          const busy = !!pendingMap[a.id];
          const created = new Date(a.createdAt).toLocaleString();
          const alt = a.text ? a.text.slice(0, 50) : "argument image";

          return (
            
            <li
              key={a.id}
              className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-amber-300"
              tabIndex={0}
              onKeyDown={(e) => {
                // Approve with 'A' if not typing inside a control
                const tag = (e.target as HTMLElement).tagName.toLowerCase();
                if (tag === "input" || tag === "textarea") return;
                if (e.key.toLowerCase() === "a") {
                  e.preventDefault();
                  approve(a.id, true);
                }
              }}
            >
                {/* badges */}
<div className="mt-1 flex flex-wrap gap-2 text-[11px]">
  {a.quantifier && (
    <span
      className="px-1.5 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700"
      title="Quantifier"
    >
      {a.quantifier}
    </span>
  )}
  {a.modality && (
    <span
      className="px-1.5 py-0.5 rounded border border-violet-200 bg-violet-50 text-violet-700"
      title="Modality"
    >
      {a.modality}
    </span>
  )}
  {a.mediaType && a.mediaType !== 'text' && (
    <span
      className="px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700"
      title="Media type"
    >
      {a.mediaType}
    </span>
  )}
</div>
              <div className="text-xs text-neutral-500 mb-1">
                <span title={`Author: ${a.authorId}`}>{created}</span>
              </div>

              <div className="text-sm whitespace-pre-wrap">{a.text}</div>

              {a.mediaType === "image" && a.mediaUrl && (
                <div className="mt-2">
                  <img
                    src={a.mediaUrl}
                    alt={alt}
                    loading="lazy"
                    className="max-h-40 object-contain border rounded"
                  />
                </div>
              )}
              {a.mediaType === "video" && a.mediaUrl && (
                <div className="mt-2">
                  <video
                    controls
                    preload="metadata"
                    className="max-h-52 border rounded"
                  >
                    <source src={a.mediaUrl} />
                  </video>
                </div>
              )}
              {a.mediaType === "audio" && a.mediaUrl && (
                <div className="mt-2">
                  <audio controls preload="metadata" className="w-full">
                    <source src={a.mediaUrl} />
                  </audio>
                </div>
              )}

              {a.confidence != null && (
                <div className="text-[11px] text-neutral-500 mt-1">
                  How sure: {(a.confidence * 100).toFixed(0)}%
                </div>
              )}

              <div className="mt-1 flex gap-2 text-[11px] text-neutral-600">
                {a.quantifier && (
                  <span
                    className="px-1.5 py-0.5 border rounded"
                    title="Quantifier"
                  >
                    {a.quantifier}
                  </span>
                )}
                {a.modality && (
                  <span
                    className="px-1.5 py-0.5 border rounded"
                    title="Modality"
                  >
                    {a.modality}
                  </span>
                )}
                {a.mediaType && a.mediaType !== "text" && (
                  <span
                    className="px-1.5 py-0.5 border rounded"
                    title="Media type"
                  >
                    {a.mediaType}
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  className="px-2 py-1 border rounded text-xs disabled:opacity-50"
                  onClick={() => onReplyTo(a.id)}
                  aria-label="Reply to argument"
                  disabled={busy}
                >
                  Reply
                </button>

                <PromoteToClaimButton
                  deliberationId={deliberationId}
                  target={{ type: "argument", id: a.id }}
                  onClaim={(claimId) => {
                    console.log("Got claimId", claimId);
                    // optional: auto-open CitePickerInline with this claimId
                  }}
                />
                <button
                  className="px-2 py-1 border rounded text-xs disabled:opacity-50"
                  onClick={() =>
                    setCiteOpenId((id) => (id === a.id ? null : a.id))
                  }
                  aria-expanded={citeOpenId === a.id}
                  disabled={busy}
                >
                  {citeOpenId === a.id ? "Close cite" : "Cite"}
                </button>
                <button
                  className="px-2 py-1 border rounded text-xs disabled:opacity-50"
                  onClick={() => approve(a.id, true)}
                  aria-label="Approve argument"
                  disabled={busy}
                >
                  Approve
                </button>
                <button
                  className="px-2 py-1 border rounded text-xs disabled:opacity-50"
                  onClick={() => approve(a.id, false)}
                  aria-label="Unapprove argument"
                  disabled={busy}
                >
                  Unapprove
                </button>

                {a.mediaType === "image" && (
                  <>
                    <button
                      className="px-2 py-1 border rounded text-xs disabled:opacity-50"
                      onClick={() =>
                        openDispute(a.id, "Image – Appropriateness")
                      }
                      aria-label="Dispute image appropriateness"
                      disabled={busy}
                    >
                      Dispute image (Appropriateness)
                    </button>
                    <button
                      className="px-2 py-1 border rounded text-xs disabled:opacity-50"
                      onClick={() => openDispute(a.id, "Image – Depiction")}
                      aria-label="Dispute image depiction"
                      disabled={busy}
                    >
                      Dispute image (Depiction)
                    </button>
                  </>
                )}
              </div>
              {citeOpenId === a.id && (
                <CitePickerInline
                  deliberationId={deliberationId}
                  // if you already have claimId for this arg, pass it here; else use text:
                  argumentText={a.text}
                  onDone={() => setCiteOpenId(null)}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="p-2 border rounded animate-pulse space-y-2">
      <div className="h-3 bg-neutral-200 rounded w-1/3" />
      <div className="h-3 bg-neutral-200 rounded w-5/6" />
      <div className="h-3 bg-neutral-200 rounded w-4/6" />
    </div>
  );
}
