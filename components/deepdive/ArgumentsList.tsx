"use client";
import { useEffect, useState } from "react";
import PromoteToClaimButton from "../claims/PromoteToClaimButton";
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

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/deliberations/${deliberationId}/arguments`);
    const data = await res.json();
    setItems(data.arguments ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [deliberationId]);

  const approve = async (id: string, approve: boolean) => {
    await fetch(`/api/deliberations/${deliberationId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ argumentId: id, approve }),
    });
    onChanged?.();
  };

  if (loading)
    return <div className="text-xs text-neutral-500">Loading arguments…</div>;

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="text-sm font-medium">Arguments</div>
      <ul className="space-y-2">
        {items.slice(0, 30).map((a) => (
          <li key={a.id} className="p-2 border rounded">
            <div className="text-sm">{a.text}</div>
            {a.mediaType === "image" && a.mediaUrl && (
              <div className="mt-2">
                <img
                  src={a.mediaUrl}
                  alt="arg-img"
                  className="max-h-40 object-contain border rounded"
                />
              </div>
            )}
            {a.confidence != null && (
              <div className="text-[11px] text-neutral-500">
                How sure: {(a.confidence * 100).toFixed(0)}%
              </div>
            )}
            <div className="mt-1 flex gap-2 text-[11px] text-neutral-600">
              {a.quantifier && (
                <span className="px-1.5 py-0.5 border rounded">
                  {a.quantifier}
                </span>
              )}
              {a.modality && (
                <span className="px-1.5 py-0.5 border rounded">
                  {a.modality}
                </span>
              )}
              {a.mediaType && a.mediaType !== "text" && (
                <span className="px-1.5 py-0.5 border rounded">
                  {a.mediaType}
                </span>
              )}
            </div>
            <div className="mt-2 flex gap-2">
              <button
                className="px-2 py-1 border rounded"
                onClick={() => onReplyTo(a.id)}
              >
                Reply
              </button>
              <PromoteToClaimButton
                deliberationId={deliberationId}
                target={{ type: "argument", id: argument.id }}
              />
              <button
                className="px-2 py-1 border rounded"
                onClick={() => approve(a.id, true)}
              >
                Approve
              </button>
              <button
                className="px-2 py-1 border rounded"
                onClick={() => approve(a.id, false)}
              >
                Unapprove
              </button>
              {a.mediaType === "image" && (
                <>
                  <button
                    className="px-2 py-1 border rounded"
                    onClick={async () => {
                      await fetch(
                        `/api/deliberations/${deliberationId}/issues`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            label: "Image – Appropriateness",
                            links: [a.id],
                          }),
                        }
                      );
                      alert("Opened issue: Image – Appropriateness");
                    }}
                  >
                    Dispute image (Appropriateness)
                  </button>
                  <button
                    className="px-2 py-1 border rounded"
                    onClick={async () => {
                      await fetch(
                        `/api/deliberations/${deliberationId}/issues`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            label: "Image – Depiction",
                            links: [a.id],
                          }),
                        }
                      );
                      alert("Opened issue: Image – Depiction");
                    }}
                  >
                    Dispute image (Depiction)
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
