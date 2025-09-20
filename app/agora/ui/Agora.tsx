"use client";

import React from "react";
import { useBusEffect } from "@/lib/client/useBusEffect";
import type { AgoraEvent, BusEvent } from "@/types/agora";
import { EventCard } from "./EventCard";
import { FiltersPanel } from "./FiltersPanels";
import { RightRail } from "./RightRail";
import { TopBar } from "./TopBar";
import { useFollowing } from "@/lib/client/useFollowing";

import { useStackFollowing } from "@/lib/client/useStackFollowing";



type BundleState = {
    byRoom: Map<string, { ts: number; count: number; kinds: Record<string, number> }>;
    list: AgoraEvent[];
  };
// Helpers near the top
function niceDomain(url?: string | null, fallback?: string | null) {
  if (fallback) return fallback;
  if (!url) return null;
  try { return new URL(url).hostname.replace(/^www\./, "") || null; } catch { return null; }
}
function titleFromUrl(url: string) {
  try {
    const u = new URL(url);
    const domain = u.hostname.replace(/^www\./, "");
    const tail = decodeURIComponent(u.pathname.split("/").filter(Boolean).pop() || "").slice(0, 80);
    return tail ? `${domain} · ${tail}` : domain;
  } catch { return url; }
}
function niceTitle(m: any) {
  const t = (m.title || "").trim();
  if (t && !/^https?:\/\//i.test(t)) return t;
  if (m.url && String(m.url).includes("doi.org")) {
    try { const u = new URL(m.url); return `doi:${decodeURIComponent(u.pathname.replace(/^\/+/, ""))}`; } catch {}
  }
  return m.url ? titleFromUrl(m.url) : (m.domain || "Source");
}
function cleanPreview(s?: string | null) {
  if (!s) return "";
  const x = s.replace(/\s+/g, " ").trim();
  // drop placeholder-only previews like "Sources:"
  if (/^sources:\s*$/i.test(x)) return "";
  return x;
}

// helper
// function coalesce(prev: AgoraEvent[], ev: AgoraEvent): AgoraEvent[] {
//   if (ev.type !== "dialogue:changed" || !ev.deliberationId) return [ev, ...prev];
//   const room = ev.deliberationId;
//   const idx = prev.findIndex(
//     (e) => e.type === "dialogue:changed" && e.deliberationId === room && ev.ts - e.ts <= BUNDLE_WINDOW_MS
//   );
//   const bIdx = prev.findIndex(
//     (e) => e.type === "bundle" && e.deliberationId === room && ev.ts - e.ts <= BUNDLE_WINDOW_MS
//   );

//   // found an existing bundle → increment
//   if (bIdx >= 0) {
//     const b = prev[bIdx];
//     const kinds = { ...(b as any).kinds };
//     const k = (ev.chips?.[0] || "MOVE") as string;
//     kinds[k] = (kinds[k] || 0) + 1;
//     const upd = { ...b, ts: ev.ts, title: `Room burst`, meta: `${Object.entries(kinds).map(([kk,v])=>`${v} ${kk}`).join(" · ")}`, kinds };
//     return [upd, ...prev.filter((_, i) => i !== bIdx)];
//   }

//   // convert single prior event to a bundle
//   if (idx >= 0) {
//     const base = prev[idx];
//     const kinds: Record<string, number> = {};
//     const k1 = (base.chips?.[0] || "MOVE") as string;
//     const k2 = (ev.chips?.[0] || "MOVE") as string;
//     kinds[k1] = (kinds[k1] || 0) + 1;
//     kinds[k2] = (kinds[k2] || 0) + 1;

//     const bundle: AgoraEvent & { kinds: Record<string, number> } = {
//       id: `bd:${room}:${ev.ts}`,
//       type: "bundle" as any,
//       ts: ev.ts,
//       title: "Room burst",
//       meta: `${Object.entries(kinds).map(([kk,v])=>`${v} ${kk}`).join(" · ")}`,
//       chips: [`room:${room.slice(0,6)}…`],
//       link: `/deliberation/${room}`,
//       deliberationId: room,
//       icon: "move",
//       kinds,
//     };

//     const trimmed = prev.filter((_, i) => i !== idx);
//     return [bundle, ...trimmed];
//   }

const BUNDLE_WINDOW_MS = 3 * 60 * 1000;
const CITATION_BUNDLE_WINDOW_MS = 2 * 60 * 1000;


function coalesce(prev: AgoraEvent[], ev: AgoraEvent): AgoraEvent[] {
  /* ---------- CITATIONS: bundle by target (targetType + targetId) ---------- */
  if (ev.type === "citations:changed") {
    const tgtType = (ev as any).targetType;
    const tgtId   = (ev as any).targetId;
    const tgtKey  = `${tgtType}:${tgtId}`;

    // Existing citations bundle for same target & within window?
    const bundleIdx = prev.findIndex(
      (e: any) =>
        e.type === "bundle" &&
        e.subtype === "citations" &&
        e.tgtKey === tgtKey &&
        ev.ts - e.ts <= CITATION_BUNDLE_WINDOW_MS
    );
    if (bundleIdx >= 0) {
      const b: any = prev[bundleIdx];
      const count = (b.count || 1) + 1;
      const upd = {
        ...b,
        ts: ev.ts,
        count,
        title: `${count} sources attached`,
        meta: b.meta, // keep target preview
      };
      return [upd, ...prev.filter((_, i) => i !== bundleIdx)];
    }

    // Single prior citation → convert to bundle(2)
    const priorIdx = prev.findIndex(
      (e: any) =>
        e.type === "citations:changed" &&
        `${e.targetType}:${e.targetId}` === tgtKey &&
        ev.ts - e.ts <= CITATION_BUNDLE_WINDOW_MS
    );
    if (priorIdx >= 0) {
      const base: any = prev[priorIdx];
      const bundle: any = {
        id: `bd:cit:${tgtKey}:${ev.ts}`,
        type: "bundle" as any,
        subtype: "citations",
        ts: ev.ts,
        tgtKey,
        count: 2,
        title: "2 sources attached",
        meta: base.meta,
        chips: ["sources"],
        link: base.link,
        icon: "link",
      };
      const trimmed = prev.filter((_, i) => i !== priorIdx);
      return [bundle, ...trimmed];
    }

    return [ev, ...prev];
  }

  /* ---------------- DIALOGUE MOVES: bundle by deliberationId ---------------- */
  if (ev.type === "dialogue:changed" && ev.deliberationId) {
    const room = ev.deliberationId;

    // Existing room bundle?
    const roomBundleIdx = prev.findIndex(
      (e) => e.type === "bundle" && e.deliberationId === room && ev.ts - e.ts <= BUNDLE_WINDOW_MS
    );
    if (roomBundleIdx >= 0) {
      const b: any = prev[roomBundleIdx];
      const kinds = { ...(b.kinds || {}) };
      const k = (ev.chips?.[0] || "MOVE") as string;
      kinds[k] = (kinds[k] || 0) + 1;
      const upd = {
        ...b,
        ts: ev.ts,
        title: "Room burst",
        meta: Object.entries(kinds).map(([kk, v]) => `${v} ${kk}`).join(" · "),
        kinds,
      };
      return [upd, ...prev.filter((_, i) => i !== roomBundleIdx)];
    }

    // Single prior move → convert to bundle
    const priorMoveIdx = prev.findIndex(
      (e) => e.type === "dialogue:changed" && e.deliberationId === room && ev.ts - e.ts <= BUNDLE_WINDOW_MS
    );
    if (priorMoveIdx >= 0) {
      const base = prev[priorMoveIdx];
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
        meta: Object.entries(kinds).map(([kk, v]) => `${v} ${kk}`).join(" · "),
        chips: [`room:${room.slice(0, 6)}…`],
        link: `/deliberation/${room}`,
        deliberationId: room,
        icon: "move",
        kinds,
      };
      const trimmed = prev.filter((_, i) => i !== priorMoveIdx);
      return [bundle, ...trimmed];
    }

    return [ev, ...prev];
  }

  /* -------------------------------- default -------------------------------- */
  return [ev, ...prev];
}




  // if (ev.type === "citations:changed") {
  //   const tgtKey = `${(ev as any).targetType}:${(ev as any).targetId}`;
  //   const idx = prev.findIndex(
  //     (e:any) =>
  //       e.type === "citations:changed" &&
  //       `${e.targetType}:${e.targetId}` === tgtKey &&
  //       ev.ts - e.ts <= CITATION_BUNDLE_WINDOW_MS
  //   );
  //   const bIdx = prev.findIndex(
  //     (e:any) =>
  //       e.type === "bundle" &&
  //       e.subtype === "citations" &&
  //       e.tgtKey === tgtKey &&
  //       ev.ts - e.ts <= CITATION_BUNDLE_WINDOW_MS
  //   );

  //   if (bIdx >= 0) {
  //     const b:any = prev[bIdx];
  //     const count = (b.count || 1) + 1;
  //     const upd = {
  //       ...b,
  //       ts: ev.ts,
  //       count,
  //       title: `${count} sources attached`,
  //       meta: b.meta, // keep target preview
  //     };
  //     return [upd, ...prev.filter((_, i) => i !== bIdx)];
  //   }

  //   if (idx >= 0) {
  //     const base:any = prev[idx];
  //     const bundle:any = {
  //       id: `bd:cit:${tgtKey}:${ev.ts}`,
  //       type: "bundle" as any,
  //       subtype: "citations",
  //       ts: ev.ts,
  //       tgtKey,
  //       count: 2,
  //       title: "2 sources attached",
  //       meta: base.meta,
  //       chips: ["sources"],
  //       link: base.link,
  //       icon: "link",
  //     };
  //     const trimmed = prev.filter((_, i) => i !== idx);
  //     return [bundle, ...trimmed];
  //   }
  // }

  // no bundle, just push
//   return [ev, ...prev];
// }

export default function Agora({ initialEvents }: { initialEvents: AgoraEvent[] }) {
  const [events, setEvents] = React.useState<AgoraEvent[]>(initialEvents);
  const [paused, setPaused] = React.useState(false);
  const [tab, setTab] = React.useState<"all" | "following" | "calls" | "votes" | "accepted">("all");
  const [q, setQ] = React.useState("");
  const [selected, setSelected] = React.useState<AgoraEvent | null>(null);

  const { roomSet, tagSet, isFollowingRoom, isFollowingTag, followRoom, unfollowRoom } = useFollowing();
  const { stackSet, isFollowingStack } = useStackFollowing();

  // 👇 NEW: in-flight + ok flashes
  const [pending, setPending] = React.useState<Set<string>>(new Set());
  const [ok, setOk] = React.useState<Set<string>>(new Set());

  function setPendingOn(id: string, on: boolean) {
    setPending((prev) => {
      const n = new Set(prev);
      on ? n.add(id) : n.delete(id);
      return n;
    });
  }

  function flashOk(id: string, ms = 1200) {
    setOk((prev) => {
      const n = new Set(prev);
      n.add(id);
      return n;
    });
    setTimeout(() => {
      setOk((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }, ms);
  }

  async function doFollow(roomId: string) {
    setPendingOn(roomId, true);
    try {
      await followRoom(roomId);                // assumes Promise<void> in your hook
      flashOk(roomId);
      // optional: let other panes react if they want
      window.dispatchEvent(new CustomEvent("follow:changed", {
        detail: { kind: "room", id: roomId, following: true }
      }));
    } finally {
      setPendingOn(roomId, false);
    }
  }

  async function doUnfollow(roomId: string) {
    setPendingOn(roomId, true);
    try {
      await unfollowRoom(roomId);
      flashOk(roomId);
      window.dispatchEvent(new CustomEvent("follow:changed", {
        detail: { kind: "room", id: roomId, following: false }
      }));
    } finally {
      setPendingOn(roomId, false);
    }
  }

  // Live wire (your existing bus processing) ...
  useBusEffect("*", (m) => {
    if (paused) return;
  
    const t = m?.type as BusEvent | undefined;
    if (!t || !m) return;
  
    const ts = m.ts || Date.now();
    let ev: AgoraEvent | null = null;
  
    // Map bus payloads → minimal feed items (no bundling here!)
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
    }
    
    
else if (t === "citations:changed") {
  const titleTxt   = niceTitle(m);
  const targetLabel =
    m.targetType === "comment" ? "Comment" :
    m.targetType === "claim"   ? "Claim"   :
    (m.targetType || "Target");

    const loc      = m.locator ? ` · ${m.locator}` : "";
    const domLabel = niceDomain(m.url, m.domain);
    const dom      = domLabel ? ` · ${domLabel}` : "";
    const preview  = cleanPreview(m.targetPreview);


    const quoteChip = m.quote ? `“${String(m.quote).slice(0,120)}${String(m.quote).length>120?"…":""}”` : null;
    const noteChip  = m.note  ? `Note: ${String(m.note).slice(0,80)}${String(m.note).length>80?"…":""}` : null;
    const kindChip  = m.kind ? String(m.kind) : null;        // 'pdf' | 'web' | 'dataset' …
    const platChip  = m.platform ? String(m.platform) : null; // 'arxiv' | 'library' | 'web'

      // avoid duplicate 'web' when kind===platform
  const rawChips = [
    ...(quoteChip ? [quoteChip] : []),
    ...(noteChip  ? [noteChip]  : []),
    ...(kindChip  ? [kindChip]  : []),
    ...(platChip && platChip !== kindChip ? [platChip] : []),
    "source",
  ];
  const chips = Array.from(new Set(rawChips)); // de-dupe

  const contextLink =
  m.stackId && m.targetType === "comment" ? `/stacks/${m.stackId}#c=${m.targetId}` :
  m.targetType === "claim" ? `/claim/${m.targetId}` :
  undefined;
  
  ev = {
    id: `ct:${ts}:${m.sourceId || ""}:${m.targetId || ""}`,
    type: "citations:changed",
    ts,
    title: `Added source: ${titleTxt}`,
    meta: `${targetLabel}${loc}${dom}${preview ? ` · ${preview}` : ""}`,
    chips,
    link: m.url || contextLink,
    contextLink,
    icon: "link",
    // keep for bundling
    targetType: m.targetType,
    targetId:   m.targetId,
    deliberationId: m.deliberationId || undefined,  // 👈 NEW (lets RightRail react)

  } as any;
}
    
    else if (t === "decision:changed") {
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
    }
    else if (t === "votes:changed") {
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
    }
    else if (t === "xref:changed") {
      ev = {
        id: `xr:${ts}`,
        type: "xref:changed",
        ts,
        title: "Cross-link added",
        meta: m.relation || "",
        chips: ["xref"],
        link: m.toType === "deliberation" ? `/deliberation/${m.toId}` : undefined,
        deliberationId: m.toType === "deliberation" ? m.toId : undefined,
        icon: "branch",
      };
    }
    else if (t === "deliberations:created") {
      const delibId = m.id || m.deliberationId;
      ev = {
        id: `dl:${delibId || ts}`,
        type: "deliberations:created",
        ts,
        title: "Discussion opened",
        meta: `${m.hostType || ""}:${m.hostId || ""}`,
        chips: ["spawn"],
        link: delibId ? `/deliberation/${delibId}` : undefined,
        deliberationId: delibId,
        icon: "plus",
      };
    }
    else if (t === "stacks:changed") {
      const op = m.op || "update";
      const titleMap: Record<string, string> = {
        subscribe: "Subscribed to a stack",
        unsubscribe: "Unsubscribed from a stack",
        reorder: "Stack reordered",
        remove: "Item removed from stack",
      };
      ev = {
        id: `st:${ts}`,
        type: "stacks:changed",
        ts,
        title: titleMap[op] || "Stack updated",
        meta: m.stackId ? `stack:${String(m.stackId).slice(0, 6)}…` : undefined,
        chips: [op],
        link: m.stackId ? `/stacks/${m.stackId}` : undefined,
        icon: "stack",
      };
    }
    else if (t === "comments:changed") {
      const op = m.op || "update";
      const title =
        op === "add"    ? "New comment on a stack" :
        op === "delete" ? "Comment removed" :
        "Comments updated";
      ev = {
        id: `cm:${ts}`,
        type: "comments:changed",
        ts,
        title,
        meta: m.stackId ? `stack:${String(m.stackId).slice(0, 6)}…` : undefined,
        chips: ["comment"],
        link: m.stackId ? `/stacks/${m.stackId}` : undefined,
        icon: "chat",
      };
    }
  
    if (ev) setEvents((prev) => coalesce(prev, ev).slice(0, 200));
  });
  

  // Filters (unchanged)
  const filtered = React.useMemo(() => {
    let list = events;
    if (tab === "accepted") list = list.filter((e) => e.type === "decision:changed");
    if (tab === "votes")    list = list.filter((e) => e.type === "votes:changed");

    if (tab === "following") {
      list = list.filter((e) => {
        const inRooms = e.deliberationId ? roomSet.has(e.deliberationId) : false;
        const inTags = (e.chips || []).some((c) => isFollowingTag(c));
        const inStacks = (e.type === "stacks:changed" || e.type === "comments:changed") && (e as any).link?.includes("/stacks/")
        ? isFollowingStack((e as any).link?.split("/stacks/")[1])
        : false;
      return inRooms || inTags || inStacks;
      });
    }
    if (q) {
      const ql = q.toLowerCase();
      list = list.filter(
        (e) =>
          (e.title ?? "").toLowerCase().includes(ql) ||
          (e.meta ?? "").toLowerCase().includes(ql) ||
          (e.chips ?? []).some((c) => c.toLowerCase().includes(ql))
      );
    }
    return list;
  }, [events, tab, q, roomSet, tagSet, isFollowingTag, isFollowingStack]);

  return (
    <div className="mx-auto w-full max-w-screen">
      <TopBar tab={tab} onTab={setTab} q={q} onQ={setQ} paused={paused} onPause={() => setPaused(p => !p)} />
      <div className="grid grid-cols-12 gap-4 mt-3">
        <aside className="hidden lg:block col-span-3">
          <FiltersPanel />
        </aside>

        <main className="col-span-12 lg:col-span-6 space-y-2">
          {filtered.map((e) => {
            const rid = e.deliberationId || "";
            const following = !!rid && isFollowingRoom(rid);
            const isPending = !!rid && pending.has(rid);
            const isOk = !!rid && ok.has(rid);

            return (
              <EventCard
                key={e.id}
                ev={e}
                onSelect={(x) => setSelected(x)}
                isFollowing={following}
                onFollow={() => rid && doFollow(rid)}
                onUnfollow={() => rid && doUnfollow(rid)}
                pending={isPending}        // 👈 NEW
                ok={isOk}                  // 👈 NEW
              />
            );
          })}
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
