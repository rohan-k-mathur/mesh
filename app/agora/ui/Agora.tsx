"use client";

import React from "react";
import { useBusEffect } from "@/lib/client/useBusEffect";
import type { AgoraEvent, BusEvent } from "@/types/agora";
import { EventCard } from "./EventCard";
import { FiltersPanel } from "./FiltersPanels";
import { RightRail } from "./RightRail";
import { TopBar } from "./TopBar";

type BundleState = {
    byRoom: Map<string, { ts: number; count: number; kinds: Record<string, number> }>;
    list: AgoraEvent[];
  };
  const BUNDLE_WINDOW_MS = 3 * 60 * 1000;


// helper
function coalesce(prev: AgoraEvent[], ev: AgoraEvent): AgoraEvent[] {
  if (ev.type !== "dialogue:changed" || !ev.deliberationId) return [ev, ...prev];
  const room = ev.deliberationId;
  const idx = prev.findIndex(
    (e) => e.type === "dialogue:changed" && e.deliberationId === room && ev.ts - e.ts <= BUNDLE_WINDOW_MS
  );
  const bIdx = prev.findIndex(
    (e) => e.type === "bundle" && e.deliberationId === room && ev.ts - e.ts <= BUNDLE_WINDOW_MS
  );

  // found an existing bundle → increment
  if (bIdx >= 0) {
    const b = prev[bIdx];
    const kinds = { ...(b as any).kinds };
    const k = (ev.chips?.[0] || "MOVE") as string;
    kinds[k] = (kinds[k] || 0) + 1;
    const upd = { ...b, ts: ev.ts, title: `Room burst`, meta: `${Object.entries(kinds).map(([kk,v])=>`${v} ${kk}`).join(" · ")}`, kinds };
    return [upd, ...prev.filter((_, i) => i !== bIdx)];
  }

  // convert single prior event to a bundle
  if (idx >= 0) {
    const base = prev[idx];
    const kinds: Record<string, number> = {};
    const k1 = (base.chips?.[0] || "MOVE") as string;
    const k2 = (ev.chips?.[0] || "MOVE") as string;
    kinds[k1] = (kinds[k1] || 0) + 1;
    kinds[k2] = (kinds[k2] || 0) + 1;

    const bundle: AgoraEvent & { kinds: Record<string, number> } = {
      id: `bd:${room}:${ev.ts}`,
      type: "bundle" as any,
      ts: ev.ts,
      title: "Room burst",
      meta: `${Object.entries(kinds).map(([kk,v])=>`${v} ${kk}`).join(" · ")}`,
      chips: [`room:${room.slice(0,6)}…`],
      link: `/deliberation/${room}`,
      deliberationId: room,
      icon: "move",
      kinds,
    };

    const trimmed = prev.filter((_, i) => i !== idx);
    return [bundle, ...trimmed];
  }

  // no bundle, just push
  return [ev, ...prev];
}

export default function Agora({ initialEvents }: { initialEvents: AgoraEvent[] }) {
  const [events, setEvents] = React.useState<AgoraEvent[]>(initialEvents);
  const [paused, setPaused] = React.useState(false);
  const [tab, setTab] = React.useState<"all" | "following" | "calls" | "votes" | "accepted">("all");
  const [q, setQ] = React.useState("");
  const [selected, setSelected] = React.useState<AgoraEvent | null>(null);

  // Live wire: coarsely map bus payloads → minimal feed items
  useBusEffect("*", (m) => {
    if (paused) return;

    const t = m?.type as BusEvent | undefined;
    if (!t || !m) return;

    const ts = m.ts || Date.now();
    let ev: AgoraEvent | null = null;

    if (t === "dialogue:moves:refresh") {
      ev = {
        id: `mv:${m.moveId || ts}`,
        type: "dialogue:changed",
        ts,
        title: `New move${m.kind ? ` (${m.kind})` : ""}`,
        meta: m.deliberationId ? `room:${String(m.deliberationId).slice(0, 6)}…` : undefined,
        chips: m.kind ? [m.kind] : [],
        link: m.deliberationId ? `/deliberation/${m.deliberationId}` : undefined,
        deliberationId: m.deliberationId,
        icon: "move",
      };
    } else if (t === "citations:changed") {
      ev = {
        id: `ct:${ts}:${m.targetId || ""}`,
        type: "citations:changed",
        ts,
        title: "Citation updated",
        meta: m.targetType ? `${m.targetType}:${String(m.targetId || "").slice(0, 6)}…` : undefined,
        chips: ["source"],
        link: m.targetType === "claim" ? `/claim/${m.targetId}` : undefined,
        icon: "link",
      };
    } else if (t === "decision:changed") {
      ev = {
        id: `dc:${ts}`,
        type: "decision:changed",
        ts,
        title: "Decision recorded",
        meta: m.rationale || "",
        chips: [m.kind || "decision"],
        link: m.deliberationId ? `/deliberation/${m.deliberationId}` : undefined,
        deliberationId: m.deliberationId,
        icon: "check",
      };
    } else if (t === "votes:changed") {
      ev = {
        id: `vt:${ts}`,
        type: "votes:changed",
        ts,
        title: "Vote updated",
        meta: m.sessionId ? `session:${String(m.sessionId).slice(0, 6)}…` : undefined,
        chips: [m.method || "vote"],
        link: m.deliberationId ? `/deliberation/${m.deliberationId}` : undefined,
        deliberationId: m.deliberationId,
        icon: "vote",
      };
    } else if (t === "xref:changed") {
      ev = {
        id: `xr:${ts}`,
        type: "xref:changed",
        ts,
        title: "Cross‑link added",
        meta: m.relation || "",
        chips: ["xref"],
        link: m.toType === "deliberation" ? `/deliberation/${m.toId}` : undefined,
        deliberationId: m.toType === "deliberation" ? m.toId : undefined,
        icon: "branch",
      };
    } else if (t === "deliberations:created") {
      ev = {
        id: `dl:${m.id || ts}`,
        type: "deliberations:created",
        ts,
        title: "Discussion opened",
        meta: `${m.host?.type || ""}:${m.host?.id || ""}`,
        chips: ["spawn"],
        link: `/deliberation/${m.id}`,
        deliberationId: m.id,
        icon: "plus",
      };
    }

    if (ev) setEvents((prev) => coalesce(prev, ev).slice(0, 200));

  });

  // Filters (very light for v1)
  const filtered = React.useMemo(() => {
    let list = events;
    if (tab === "accepted") list = list.filter((e) => e.type === "decision:changed");
    if (tab === "votes")    list = list.filter((e) => e.type === "votes:changed");
    if (q) {
      const ql = q.toLowerCase();
      list = list.filter((e) =>
        (e.title?.toLowerCase().includes(ql) || e.meta?.toLowerCase().includes(ql) || e.chips?.some(c => c.toLowerCase().includes(ql)))
      );
    }
    return list;
  }, [events, tab, q]);

  return (
    <div className="mx-auto max-w-screen px-4 pb-10">
      <TopBar tab={tab} onTab={setTab} q={q} onQ={setQ} paused={paused} onPause={() => setPaused(p => !p)} />
      <div className="grid grid-cols-12 gap-4 mt-3">
        <aside className="hidden lg:block col-span-3">
          <FiltersPanel />
        </aside>

        <main className="col-span-12 lg:col-span-6 space-y-2">
          {filtered.map((e) => <EventCard key={e.id} ev={e} onSelect={(x)=>setSelected(x)}/>)}
          {!filtered.length && (
            <div className="text-sm text-slate-600 border rounded-xl bg-white/70 p-3">No events yet.</div>
          )}
        </main>

        <aside className="hidden xl:block col-span-3">
          <RightRail selected={selected}/>
        </aside>
      </div>
    </div>
  );
}
