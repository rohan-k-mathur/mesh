"use client";
import Link from "next/link";
import type { AgoraEvent } from "@/types/agora";

export function EventCard({ ev, onSelect }: { ev: AgoraEvent; onSelect?: (e: AgoraEvent)=>void }) {
    const isBundle = ev.type === ("bundle" as any);
    return (
      <div
        className="rounded-xl border bg-white/70 p-3 hover:bg-white transition cursor-default"
        onClick={() => onSelect?.(ev)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <div className="h-6 w-6 grid place-items-center rounded border bg-white text-[11px] uppercase">
              {iconEmoji(isBundle ? "move" : ev.icon)}
            </div>
            <div>
              <div className="text-sm font-medium line-clamp-2">
                {isBundle ? `Activity in this room` : ev.title}
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                {isBundle ? (ev.meta || "Several moves just happened") : ev.meta}
              </div>
              {!!ev.chips?.length && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {ev.chips!.map((t) => (
                    <span key={t} className="text-[11px] px-1.5 py-0.5 rounded border bg-white/80">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 whitespace-nowrap">
            {new Date(ev.ts).toLocaleTimeString()}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          {ev.link && (
            <a href={ev.link} className="text-xs px-2 py-1 rounded border bg-white hover:bg-slate-50">Open</a>
          )}
        </div>
      </div>
    );
  }

function iconEmoji(kind?: string) {
  switch (kind) {
    case "move": return "↪";
    case "link": return "🔗";
    case "check": return "✓";
    case "vote": return "🗳";
    case "branch": return "Y";
    case "plus": return "+";
    default: return "•";
  }
}
