// components/issues/IssuesList.tsx
"use client";
import * as React from "react";
import useSWR, { mutate as globalMutate } from "swr";
import IssueDetail from "./IssueDetail";
import { useBusEffect } from "@/lib/client/useBusEffect";
const fetcher = (u: string) => fetch(u, { cache: "no-store" }).then((r) => r.json());

export default function IssuesList({
  deliberationId,
}: {
  deliberationId: string;
}) {
  const [focus, setFocus] = React.useState<string | null>(null);

  const key = `/api/deliberations/${encodeURIComponent(deliberationId)}/issues?state=all`;
  const { data, isLoading } = useSWR<{ ok: true; issues: any[] }>(key, fetcher, {
    revalidateOnFocus: false,
  });

  useBusEffect(["issues:changed"], (p) => {
    if (p?.deliberationId !== deliberationId) return;
    globalMutate(key);
  });

  return (
    <div className="flex flex-2 w-screen  h-fit flex-col mt-3">
      {/* List */}
      <div className="space-y-3">
        {isLoading && <div className="text-xs text-neutral-500">Loading…</div>}
        {(data?.issues ?? []).map((it) => (
          <div
            key={it.id}
            className="rounded-lg panel-edge bg-indigo-50/70 p-4 backdrop-blur hover:bg-slate-50 cursor-pointer"
            onClick={() => setFocus(it.id)}
          >
            <div className="text-sm font-medium flex items-center justify-between">
              <span>{it.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border ${
                  it.state === "open"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                {it.state}
              </span>
            </div>
            <div className="text-[11px] text-neutral-600 mt-1">
              {it.description?.slice(0, 160) || "—"}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1">
              links: {it._count?.links ?? it.links?.length ?? 0}
            </div>
          </div>
        ))}
        {!isLoading && (data?.issues ?? []).length === 0 && (
          <div className="text-xs text-neutral-500">No issues.</div>
        )}
      </div>

      {/* Detail modal */}
      {focus && (
        <IssueDetail
          deliberationId={deliberationId}
          issueId={focus}
          onClose={() => setFocus(null)}
        />
      )}
    </div>
  );
}
