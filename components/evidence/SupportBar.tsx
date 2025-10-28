// components/evidence/SupportBar.tsx
"use client";
import * as React from "react";
import { ConfidenceBreakdown, type ExplainData } from "@/components/confidence/ConfidenceBreakdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SupportBarProps {
  value: number;
  label?: string;
  claimId?: string;
  deliberationId?: string;
  mode?: "min" | "product" | "ds";
  showBreakdown?: boolean;
}

export function SupportBar({ 
  value, 
  label, 
  claimId,
  deliberationId,
  mode = "product",
  showBreakdown = true 
}: SupportBarProps) {
  const v = Math.max(0, Math.min(1, value ?? 0));
  const [explain, setExplain] = React.useState<ExplainData | null>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchExplanation = React.useCallback(async () => {
    if (!claimId || !deliberationId || explain) return;
    
    setLoading(true);
    try {
      const res = await fetch(
        `/api/evidential/score?deliberationId=${deliberationId}&ids=${claimId}&explain=1&mode=${mode}`
      );
      const data = await res.json();
      const item = data.items?.find((i: any) => i.id === claimId);
      if (item?.explain?.lines?.[0]) {
        setExplain({
          schemeBase: item.explain.lines[0].schemeBase,
          premiseProduct: item.explain.lines[0].premises?.reduce((a: number, b: number) => a * b, 1),
          premiseMin: item.explain.lines[0].premises ? Math.min(...item.explain.lines[0].premises) : undefined,
          cqPenalty: item.explain.lines[0].cqPenalty,
          unsatisfiedCQs: item.explain.lines[0].unsatisfiedCQs,
          final: item.score ?? value,
        });
      }
    } catch (err) {
      console.error("Failed to fetch confidence explanation:", err);
    } finally {
      setLoading(false);
    }
  }, [claimId, deliberationId, explain, mode, value]);

  const bar = (
    <div className="w-44">
      <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
        <span>{label ?? "Support"}</span>
        <span>{(v * 100).toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded bg-slate-200/70">
        <div className="h-2 rounded bg-emerald-500" style={{ width: `${v * 100}%` }} />
      </div>
    </div>
  );

  // If no claimId/deliberationId provided, or showBreakdown disabled, just show bar
  if (!showBreakdown || !claimId || !deliberationId) {
    return bar;
  }

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) fetchExplanation(); }}>
      <DropdownMenuTrigger asChild>
        <div className="cursor-help hover:opacity-80 transition-opacity">
          {bar}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="p-3">
        {loading ? (
          <div className="text-xs text-slate-500">Loading breakdown...</div>
        ) : explain ? (
          <ConfidenceBreakdown explain={explain} mode={mode} />
        ) : (
          <div className="text-xs text-slate-500">No explanation available</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

