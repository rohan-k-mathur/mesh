"use client";

import useSWR from "swr";
import * as React from "react";
import { useBusMutate } from "@/components/hooks/useBusMutate";

const fetcher = (u: string) => fetch(u, { cache: "no-store" }).then(r => r.json());

export default function Hub() {
  const [q, setQ] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [calls, setCalls] = React.useState<"any" | "open">("any");

  const params = new URLSearchParams({ q, calls, tags: tags.join(",") });
  const key = `/api/hub/deliberations?${params.toString()}`;
  const { data, mutate } = useSWR(key, fetcher);

  // live refresh when core events happen
  useBusMutate(
    ["deliberations:created", "decision:changed", "votes:changed", "dialogue:changed", "comments:changed", "xref:changed"],
    key,
    undefined,
    150
  );

  const items = data?.items ?? [];

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <div className="flex gap-2 items-center">
        <input className="border rounded px-2 py-1 text-sm" placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)} />
        <select className="border rounded px-2 py-1 text-sm" value={calls} onChange={e=>setCalls(e.target.value as any)}>
          <option value="any">All deliberations</option>
          <option value="open">Open calls for input</option>
        </select>
        {/* TODO: Tag picker chips (discipline, topic, method) */}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {items.map((d: any) => (
          <div key={d.id} className="rounded border bg-white/70 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{d.title ?? d.host?.type ?? "Deliberation"}</div>
                <div className="text-xs text-slate-600 mt-1">
                  {(d.tags ?? []).join(" · ")}
                </div>
                {d.call && <div className="mt-2 text-xs text-amber-700">Call: {d.call.description}</div>}
                <div className="mt-2 text-xs">
                  Claims: <b>{d.stats.claims}</b> · Open CQs: <b>{d.stats.openCQs}</b>
                  {" · Last update: "}
                  <span className="text-slate-600">{new Date(d.updatedAt).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <a className="text-xs underline" href={`/deliberation/${d.id}`}>Open</a>
                <a className="text-xs underline" href={`/deliberation/${d.id}?mode=panel`}>Panel</a>
                <a className="text-xs underline" href={`/deliberation/${d.id}?mode=synthesis`}>Synthesis</a>
              </div>
            </div>
          </div>
        ))}
        {!items.length && <div className="text-sm text-slate-600">No matches.</div>}
      </div>
    </div>
  );
}
