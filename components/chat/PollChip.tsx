  import * as React from "react";
  import { PollUI } from "@/contexts/useChatStore";
  
  type VoteBody = { optionIdx?: number; value?: number };
  
  function SmallMeta({ children }: { children: React.ReactNode }) {
    return <div className="text-[11px] leading-4 text-slate-600">{children}</div>;
  }
  
  export default function PollChip({
    poll,
    onVote,
  }: {
    poll: PollUI;
    onVote: (params: VoteBody) => void;
  }) {
    if (poll.kind === "OPTIONS") return <OptionsPoll poll={poll} onVote={onVote} />;
    return <TempPoll poll={poll} onVote={onVote} />;
  }
  
  function OptionsPoll({ poll, onVote }: { poll: Extract<PollUI, { kind: "OPTIONS" }>; onVote: (b: VoteBody) => void }) {
    const { poll: p, totals, count, myVote } = poll;
    const [submitting, setSubmitting] = React.useState<number | null>(null);
    const total = Math.max(1, count);
  
    const handle = async (idx: number) => {
      try {
        setSubmitting(idx);
        await onVote({ optionIdx: idx });
      } finally {
        setSubmitting(null);
      }
    };
  
    // Not voted yet — show compact option chips
    if (myVote == null) {
      return (
        <div className="inline-flex flex-col gap-1 rounded-md border bg-white/70 px-2 py-2">
          <SmallMeta>📊 Poll · choose one</SmallMeta>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {p.options!.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handle(idx)}
                disabled={submitting !== null}
                className="px-2 py-1 rounded-full border bg-white/80 hover:bg-white text-xs transition disabled:opacity-60"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      );
    }
  
    // Voted — show results with animated bars (click row to change)
    return (
      <div
        className="rounded-md border bg-white/70 px-2 py-2"
        role="group"
        aria-label="Poll results"
      >
        <div className="flex justify-between items-baseline">
          <SmallMeta>📊 Poll · {count} vote{count === 1 ? "" : "s"}</SmallMeta>
          <SmallMeta>Tap an option to change</SmallMeta>
        </div>
        <div className="mt-1.5 space-y-1.5">
          {p.options!.map((opt, idx) => {
            const pct = Math.round(((totals[idx] ?? 0) * 100) / total);
            const mine = myVote === idx;
            return (
              <button
                key={idx}
                onClick={() => handle(idx)}
                className="block w-full text-left"
                aria-pressed={mine}
              >
                <div className="flex items-baseline justify-between text-[12px]">
                  <span className={mine ? "font-semibold" : ""}>
                    {mine ? "✓ " : ""}
                    {opt}
                  </span>
                  <span className="tabular-nums">{pct}%</span>
                </div>
                <div className="mt-0.5 h-1.5 rounded bg-slate-200 overflow-hidden">
                  <div
                    className={`h-1.5 rounded transition-all duration-300 ${mine ? "bg-indigo-500" : "bg-slate-400"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  
  function TempPoll({ poll, onVote }: { poll: Extract<PollUI, { kind: "TEMP" }>; onVote: (b: VoteBody) => void }) {
    const { avg, count, myValue } = poll;
    const [value, setValue] = React.useState<number>(myValue ?? 50);
    const [dragging, setDragging] = React.useState(false);
    const [pending, setPending] = React.useState(false);
  
    // Commit only when interaction ends → good for mobile    avoids spamming the server
    const commit = async (v: number) => {
      setPending(true);
      try {
        await onVote({ value: v });
      } finally {
        setPending(false);
      }
    };
  
    return (
      <div className="rounded-md border bg-white/70 px-3 py-2">
        <div className="flex items-baseline justify-between">
          <SmallMeta>🌡 Temperature check</SmallMeta>
          <SmallMeta>
            Avg <span className="tabular-nums">{avg}</span> · {count} vote{count === 1 ? "" : "s"}
          </SmallMeta>
        </div>
  
        <div className="mt-2">
          {/* custom track with avg tick */}
          <div className="relative">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              onPointerDown={() => setDragging(true)}
              onPointerUp={() => { setDragging(false); commit(value); }}
              className="w-full"
              aria-label="Set your temperature"
            />
            {/* avg tick */}
            <div
              className="pointer-events-none absolute -top-1.5 h-4 w-px bg-indigo-500 opacity-70"
              style={{ left: `${avg}%` }}
              aria-hidden
            />
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-slate-600">
            <span>0 · Nope</span>
            <span>50 · Meh</span>
            <span>100 · Yes</span>
          </div>
        </div>
  
        <div className="mt-1 text-[11px] text-slate-700">
          Your value: <span className="tabular-nums">{value}</span>
          {pending ? " • saving…" : dragging ? " • release to save" : null}
        </div>
      </div>
    );
  }



  