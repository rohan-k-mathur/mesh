// components/dialogue/LegalMoveToolbar.tsx
"use client";
import * as React from "react";
import useSWR from "swr";
import { NLCommitPopover } from "@/components/dialogue/NLCommitPopover";
import { CommandCard, performCommand } from "@/components/dialogue/command-card/CommandCard";
import { movesToActions } from "@/lib/dialogue/movesToActions";

type Force = "ATTACK" | "SURRENDER" | "NEUTRAL";
type MoveKind = "ASSERT" | "WHY" | "GROUNDS" | "RETRACT" | "CONCEDE" | "CLOSE";
export type Move = {
  kind: MoveKind;
  label: string;
  payload?: any;
  disabled?: boolean;
  reason?: string;
  force?: Force;
  relevance?: "likely" | "unlikely" | null;
  postAs?: { targetType: "argument" | "claim" | "card"; targetId: string };
};

const fetcher = (u: string) => fetch(u, { cache: "no-store" }).then(r => r.json());

export function LegalMoveToolbar({
  deliberationId,
  targetType,
  targetId,
  locusPath = "0",
  commitOwner = "Proponent",
  onPosted,
}: {
  deliberationId: string;
  targetType: "argument" | "claim" | "card";
  targetId: string;
  locusPath?: string;
  commitOwner?: "Proponent" | "Opponent";
  onPosted?: () => void;
}) {
  const qs = new URLSearchParams({ deliberationId, targetType, targetId, locusPath }).toString();
  const { data, mutate } = useSWR<{ ok: boolean; moves: Move[] }>(`/api/dialogue/legal-moves?${qs}`, fetcher, { revalidateOnFocus: false });

  const moves = (data?.moves ?? []).filter(Boolean);
  const attacks   = moves.filter(m => m.force === "ATTACK"   && !m.disabled);
  const resolves  = moves.filter(m => m.force === "SURRENDER" && !m.disabled);
  const neutrals  = moves.filter(m => m.force === "NEUTRAL"  && !m.disabled);

  const hasClose  = resolves.some(m => m.kind === "CLOSE");
  const why       = attacks.find(m => m.kind === "WHY");
  const answers   = attacks.filter(m => m.kind === "GROUNDS"); // can be >1 for different CQ keys

  const [intent, setIntent] = React.useState<"challenge"|"resolve"|"more">(
    answers.length ? "challenge" : hasClose ? "resolve" : "challenge"
  );

  const [showAll, setShowAll] = React.useState(false);
  const [openCommit, setOpenCommit] = React.useState<Move | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [inlineWhy, setInlineWhy] = React.useState(false);
  const [whyNote, setWhyNote] = React.useState("");
  const [useCommandCard, setUseCommandCard] = React.useState(true); // ✅ Changed: Grid view is now default

  async function postMove(m: Move, extraPayload: any = {}) {
    if (busy || m.disabled) return;
    setBusy(true);
    try {
      const postTargetType = m.postAs?.targetType ?? targetType;
      const postTargetId   = m.postAs?.targetId   ?? targetId;
      const body = {
        deliberationId,
        targetType: postTargetType,
        targetId: postTargetId,
        kind: m.kind,
        payload: { locusPath, ...(m.payload ?? {}), ...(extraPayload ?? {}) },
        autoCompile: true, autoStep: true, phase: "neutral" as const,
      };
      const r = await fetch("/api/dialogue/move", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      onPosted?.();
      mutate();
      window.dispatchEvent(new CustomEvent("dialogue:moves:refresh", { detail: { deliberationId } } as any));
    } finally {
      setBusy(false);
    }
  }

  function Pill({ tone, children }:{ tone:"attack"|"resolve"|"more"; children: React.ReactNode }) {
    const base = "px-2 py-1 rounded-full text-[11px] border";
    const cls = tone==="attack"
      ? "border-amber-300 bg-amber-50 text-amber-800"
      : tone==="resolve"
      ? "border-sky-300 bg-sky-50 text-sky-800"
      : "border-slate-200 bg-white/70 text-slate-700";
    return <span className={`${base} ${cls}`}>{children}</span>;
  }

  function Segmented() {
    return (
      <div role="tablist" aria-label="Move intent" className="inline-flex rounded-md border border-slate-200/80 bg-white/70 p-0">
        {[
          ["challenge","Challenge"] as const,
          ["resolve","Resolve"] as const,
          ["more","More"] as const,
        ].map(([key, label]) => {
          const active = intent === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              onClick={() => setIntent(key as any)}
              className={`px-2.5 py-1 text-xs rounded ${active ? "bg-slate-100 text-slate-900" : "text-slate-900 hover:bg-slate-200"}`}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  // hide illegal by default; showAll exposes disabled with dotted style
  const disabled = (data?.moves ?? []).filter(m => m.disabled);

  return (
    <div className="rounded-md border border-slate-200 bg-white/60 p-2 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Segmented />
          <Pill tone="attack">WHY {why ? "available" : "—"}</Pill>
          <Pill tone="resolve">{hasClose ? "Closable (†)" : "Not closable"}</Pill>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="text-[11px] px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
            onClick={() => setUseCommandCard(!useCommandCard)}
            title={useCommandCard ? "Switch to list view" : "Switch to grid view"}
          >
            {useCommandCard ? '📋 List View' : '⚖️ Grid View'}
          </button>
          {disabled.length > 0 && (
            <button className="text-[11px] underline underline-offset-4 decoration-dotted " onClick={() => setShowAll(v => !v)}>
              {showAll ? "Hide restricted" : `Show ${disabled.length} restricted`}
            </button>
          )}
        </div>
      </div>

      {/* COMMAND CARD GRID */}
      {useCommandCard ? (
        <CommandCard
          actions={movesToActions(moves, {
            deliberationId,
            targetType,
            targetId,
            locusPath
          })}
          onPerform={async (action) => {
            await performCommand(action);
            mutate();
            onPosted?.();
          }}
        />
      ) : (
        <>
          {/* CHALLENGE */}
          {intent === "challenge" && (
        <div className="flex flex-wrap gap-2">
          {/* Ask WHY */}
          {why && (
            <div className="flex items-start gap-2">
              {!inlineWhy ? (
                <button
                  className="px-2 py-1 rounded text-xs border border-amber-200 text-amber-700 hover:bg-amber-50"
                  onClick={() => setInlineWhy(true)}
                  title={why.reason || "Ask WHY"}
                  disabled={!!why.disabled || busy}
                >
                  {why.label || "Ask WHY"}
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1">
                    <input
                      className="text-xs rounded border px-2 py-1 w-80"
                      placeholder='e.g. "What evidence supports this?" or "How do you know this?"'
                      value={whyNote}
                      onChange={e => setWhyNote(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && whyNote.trim() && !busy) { postMove(why, { note: whyNote.trim() }).then(()=>{ setInlineWhy(false); setWhyNote(""); }); } }}
                    />
                    <button
                      className="px-2 py-1 rounded text-xs border border-amber-200 text-amber-700 hover:bg-amber-100"
                      disabled={!whyNote.trim() || busy}
                      onClick={() => postMove(why, { note: whyNote.trim() }).then(()=>{ setInlineWhy(false); setWhyNote(""); })}
                    >
                      {busy ? "Posting..." : "Post WHY"}
                    </button>
                    <button className="text-[11px] hover:text-slate-700 text-slate-500" onClick={() => { setInlineWhy(false); setWhyNote(""); }}>Cancel</button>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">💡 Tip: Ask a specific question about why they make this claim</p>
                </div>
              )}
            </div>
          )}

          {/* Answer (GROUNDS) – can be multiple CQs */}
          {answers.map((m, i) => (
            <div key={`${m.kind}-${m.label}-${i}`} className="inline-flex items-center gap-1">
              <button
                className="px-2 py-1 rounded text-xs border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => setOpenCommit(m)}
                disabled={!!m.disabled || busy}
                title={m.reason || m.label}
              >
                {m.label || "Answer"}
              </button>
              <button
                className="text-[11px] underline decoration-dotted"
                onClick={() => setOpenCommit(m)}
                title="Answer & commit"
              >
                + commit
              </button>
            </div>
          ))}
        </div>
      )}

      {/* RESOLVE */}
      {intent === "resolve" && (
        <div className="flex flex-wrap gap-2">
          {resolves.map((m, i) => (
            <button
              key={`${m.kind}-${i}`}
              className={[
                "px-2 py-1 rounded text-xs border transition",
                m.kind === "CLOSE" ? "border-indigo-300 text-indigo-800 bg-indigo-50 hover:bg-indigo-100 font-semibold" :
                m.kind === "CONCEDE" ? "border-sky-200 text-sky-800 hover:bg-sky-50" :
                "border-slate-200 text-slate-700 hover:bg-slate-50"
              ].join(" ")}
              disabled={!!m.disabled || busy}
              onClick={() => postMove(m)}
              title={m.reason || m.label}
            >
              {m.label || m.kind}
            </button>
          ))}
        </div>
      )}

      {/* MORE */}
      {intent === "more" && (
        <div className="flex flex-wrap gap-2">
          {neutrals.map((m, i) => (
            <button
              key={`${m.kind}-${i}`}
              className="px-2 py-1 rounded text-xs border border-slate-200 text-slate-700 hover:bg-slate-50"
              disabled={!!m.disabled || busy}
              onClick={() => postMove(m)}
              title={m.reason || m.label}
            >
              {m.label || m.kind}
            </button>
          ))}
        </div>
      )}

          {/* Show illegal/disabled on demand */}
          {showAll && (
            <div className="pt-1 border-t border-slate-200/70">
              <div className="text-[11px] text-neutral-500 mb-1">Currently illegal</div>
              <div className="flex flex-wrap gap-2">
                {disabled.map((m, i) => (
                  <span key={`${m.kind}-d-${i}`} className="px-2 py-1 rounded text-[11px] border border-slate-200/70 text-neutral-500 opacity-70" title={m.reason || "Illegal in current state"}>
                    {m.label || m.kind}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Commit popover for GROUNDS */}
      {openCommit && (
        <NLCommitPopover
          open={!!openCommit}
          onOpenChange={(v) => { if (!v) setOpenCommit(null); }}
          deliberationId={deliberationId}
          targetType={targetType}
          targetId={targetId}
          locusPath={openCommit.payload?.justifiedByLocus ?? locusPath}
          defaultOwner={commitOwner}
          onDone={() => { setOpenCommit(null); mutate(); onPosted?.(); }}
        />
      )}
    </div>
  );
}
