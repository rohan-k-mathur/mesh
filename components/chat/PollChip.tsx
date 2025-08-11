import { PollUI } from "@/contexts/useChatStore";

export default function PollChip({ poll, onVote }: {
  poll: PollUI;
  onVote: (params: { optionIdx?: number; value?: number }) => void;
}) {
  if (poll.kind === "OPTIONS") {
    const { poll: p, totals, count, myVote } = poll;
    if (myVote == null) {
      return (
        <div className="inline-flex gap-2 flex-wrap">
          {p.options!.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => onVote({ optionIdx: idx })}
              className="px-2 py-1 rounded bg-white/70 border hover:bg-white text-xs"
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }
    const total = Math.max(1, count);
    return (
      <div className="flex flex-col gap-1">
        {p.options!.map((opt, idx) => {
          const pct = Math.round(((totals[idx] ?? 0) * 100) / total);
          const mine = myVote === idx;
          return (
            <div key={idx} className="text-[11px]">
              <div className="flex justify-between">
                <span className={mine ? "font-medium" : ""}>{opt}</span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded">
                <div className="h-1.5 rounded" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  } else {
    const { avg, count, myValue } = poll;
    return (
      <div className="flex items-center gap-2 text-xs">
        <input
          type="range"
          min={0}
          max={100}
          defaultValue={myValue ?? 50}
          onMouseUp={(e) => onVote({ value: Number((e.target as HTMLInputElement).value) })}
        />
        <span>
          Avg: {avg} ({count})
        </span>
      </div>
    );
  }
}
