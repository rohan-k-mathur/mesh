"use client";

import * as React from "react";
import useSWR from "swr";
import { LociTree } from "packages/ludics-react/LociTree";
import { TraceRibbon } from "packages/ludics-react/TraceRibbon";
import { JudgeConsole } from "packages/ludics-react/JudgeConsole";
import { CommitmentsPanel } from "packages/ludics-react/CommitmentsPanel";
import { DefenseTree } from "packages/ludics-react/DefenseTree";
import { ActInspector } from "@/packages/ludics-react/ActInspector";
import { narrateTrace } from "@/components/dialogue/narrateTrace";
import { mergeDesignsToTree } from "packages/ludics-react/mergeDesignsToTree";
import { CommitmentDelta } from "@/components/dialogue/CommitmentDelta";
import { NLCommitPopover } from "@/components/dialogue/NLCommitPopover";
import { useDialogueTarget } from "@/components/dialogue/DialogueTargetContext";
import type { StepResult } from "@/packages/ludics-core/types";
import LociTreeWithControls from "@/components/ludics/LociTreeWithControls";
import { LudicsForest } from "@/components/ludics/LudicsForest";
import { InsightsBadge, PolarityBadge } from "@/components/ludics/InsightsBadges";
import { InsightsTooltip } from "@/components/ludics/InsightsTooltip";
import type { LudicsInsights } from "@/lib/ludics/computeInsights";
import {
  isPath,
  dualPath,
  type Act as VeAct,
} from "@/packages/ludics-core/ve/pathCheck";

// Phase 1-5 Analysis Components
import {
  AnalysisPanel,
  createDefaultAnalysisState,
  type LudicsAnalysisState,
} from "@/components/ludics/analysis";
import { StrategyInspector } from "@/components/ludics/StrategyInspector";
import { ViewInspector } from "@/components/ludics/ViewInspector";
import { ChronicleViewer } from "@/components/ludics/ChronicleViewer";
import { CorrespondenceViewer } from "@/components/ludics/CorrespondenceViewer";
import { BehaviourHUD } from "@/components/ludics/BehaviourHUD";

const fetcher = (u: string) =>
  fetch(u, { cache: "no-store" }).then((r) => r.json());

// type TraceLike = {
//   steps: { posActId?: string; negActId?: string; locusPath?: string; ts?: number }[];
//   status?: 'ONGOING' | 'CONVERGENT' | 'DIVERGENT';
//   decisiveIndices?: number[];
// };

function asTraceLike(t?: StepResult | null) {
  if (!t) return null;
  return {
    steps: (t.pairs ?? [])
      .map((p) => {
        // Only include if posActId and negActId are defined (as required by ActRef)
        if (typeof p.posActId === "string" && typeof p.negActId === "string") {
          return {
            posActId: p.posActId,
            negActId: p.negActId,
            locusPath: p.locusPath ?? "",
            ts: p.ts ?? 0,
          };
        }
        // If not, skip this entry
        return null;
      })
      .filter(
        (
          x
        ): x is {
          posActId: string;
          negActId: string;
          locusPath: string;
          ts: number;
        } => x !== null
      ),
    // map STUCK → ONGOING so it fits the older UI type
    status: t.status === "STUCK" ? "ONGOING" : t.status,
    decisiveIndices: t.decisiveIndices,
  };
}

/* ------------------------ UI helpers (consistent) ----------------------- */
function ChipBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1.5 rounded-md border border-slate-200/80 bg-white/70 px-2.5 py-1 text-[11px] backdrop-blur">
      {children}
    </div>
  );
}

function useMicroToast() {
  const [msg, setMsg] = React.useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);
  const show = React.useCallback(
    (text: string, kind: "ok" | "err" = "ok", ms = 1600) => {
      setMsg({ kind, text });
      const id = setTimeout(() => setMsg(null), ms);
      return () => clearTimeout(id);
    },
    []
  );
  const node = msg ? (
    <div
      aria-live="polite"
      className={[
        "fixed bottom-4 right-4 z-50 rounded-md border px-3 py-2 text-xs shadow",
        "backdrop-blur bg-white/90",
        msg.kind === "ok"
          ? "border-emerald-200 text-emerald-700"
          : "border-rose-200 text-rose-700",
      ].join(" ")}
    >
      {msg.text}
    </div>
  ) : null;
  return { show, node };
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  ariaLabel?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex rounded-md border border-slate-200/80 bg-white/70 p-0.5 backdrop-blur"
    >
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={[
              "px-2.5 py-1 text-xs rounded transition",
              active
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-white",
            ].join(" ")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="border rounded-lg p-3 bg-white/60">
      <div className="h-4 w-28 bg-slate-200/60 rounded mb-2" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 w-full bg-slate-200/50 rounded mb-1" />
      ))}
    </div>
  );
}

/* ------------------------------- Types ---------------------------------- */
// type StepResult = {
//   steps: Array<{ posActId: string; negActId: string; ts?: number }>;
//   status: 'ONGOING' | 'CONVERGENT' | 'DIVERGENT';
//   endedAtDaimonForParticipantId?: string;
//   endorsement?: { locusPath: string; byParticipantId: string; viaActId: string };
//   decisiveIndices?: number[];
//   usedAdditive?: Record<string, string>;
// };

/* -------------------------------- Panel --------------------------------- */
export default function LudicsPanel({
  deliberationId,
  proDesignId,
  oppDesignId,
}: {
  deliberationId: string;
  proDesignId?: string;
  oppDesignId?: string;
}) {
  // Designs SWR
  const {
    data: designsData,
    mutate: mutateDesigns,
    error: designsError,
    isLoading: isDesignsLoading,
  } = useSWR(
    `/api/ludics/designs?deliberationId=${encodeURIComponent(deliberationId)}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  const designs = designsData?.designs ?? [];
  const pro =
    designs.find((d: any) => d.participantId === "Proponent") ?? designs[0];
  const opp =
    designs.find((d: any) => d.participantId === "Opponent") ??
    designs[1] ??
    designs[0];

  // Panel local UI state
  const [trace, setTrace] = React.useState<StepResult | null>(null);
  const [badges, setBadges] = React.useState<Record<number, string>>({});
  const [stable, setStable] = React.useState<number | null>(null);
  const [orthogonal, setOrthogonal] = React.useState<boolean | null>(null);
  const [focusIdx, setFocusIdx] = React.useState<number | null>(null);
  const [showGuide, setShowGuide] = React.useState(false);
  const [phase, setPhase] = React.useState<"neutral" | "focus-P" | "focus-O">(
    "neutral"
  );
  const [viewMode, setViewMode] = React.useState<"forest" | "unified" | "split">(
    "forest"
  );
  const [commitOpen, setCommitOpen] = React.useState(false);
  const [commitPath, setCommitPath] = React.useState<string | null>(null);

  // NLI per-scope results (Task 6: Week 2)
  const [nliResultsByScope, setNliResultsByScope] = React.useState<
    Record<string, { contradictions: number; timestamp: string }>
  >({});

  // Stable sets per-scope results (Task 7: Week 2)
  const [stableSetsByScope, setStableSetsByScope] = React.useState<
    Record<string, number>
  >({});

  // Scoped designs state - activeScope filters which scope to show/analyze
  const [activeScope, setActiveScope] = React.useState<string | null>(null);

  // Append Daimon controls (Task 5: Week 2) - moved here before useMemo that uses them
  const [showAppendDaimon, setShowAppendDaimon] = React.useState(false);
  const [daimonTargetLocus, setDaimonTargetLocus] = React.useState<string>("");
  const [daimonTargetScope, setDaimonTargetScope] = React.useState<string | null>(null);

  // Phase 1-5 Analysis Panel State
  const [showAnalysisPanel, setShowAnalysisPanel] = React.useState(false);
  const [analysisState, setAnalysisState] = React.useState<LudicsAnalysisState>(() =>
    createDefaultAnalysisState()
  );
  const handleAnalysisUpdate = React.useCallback((update: Partial<LudicsAnalysisState>) => {
    setAnalysisState((prev) => ({ ...prev, ...update }));
  }, []);

  // Compute scopes and labels
  const scopes = React.useMemo(() => {
    const scopeSet = new Set<string>();
    designs.forEach((d: any) => {
      const scope = d.scope ?? "legacy";
      scopeSet.add(scope);
    });
    return Array.from(scopeSet);
  }, [designs]);

  const scopeLabels = React.useMemo(() => {
    const labels: Record<string, string> = {};
    designs.forEach((d: any) => {
      const scope = d.scope ?? "legacy";
      if (scope === "legacy") {
        labels[scope] = "Legacy (All)";
      } else if (d.scopeMetadata?.label) {
        labels[scope] = d.scopeMetadata.label;
      } else {
        labels[scope] = scope;
      }
    });
    return labels;
  }, [designs]);

  // Auto-select first scope if activeScope is null
  React.useEffect(() => {
    if (scopes.length > 0 && !activeScope) {
      setActiveScope(scopes[0]);
    }
  }, [scopes, activeScope]);

  // Compute available loci for daimon append (from ALL designs in scope, not just Opponent)
  const availableLoci = React.useMemo(() => {
    const targetScope = daimonTargetScope ?? activeScope;
    const scopeDesigns = designs.filter(
      (d: any) => (d.scope ?? "legacy") === targetScope
    );
    
    // Get unique locus paths from ALL acts across all designs in scope
    const lociSet = new Set<string>();
    scopeDesigns.forEach((design: any) => {
      if (design.acts) {
        design.acts.forEach((act: any) => {
          if (act.locus?.path) {
            lociSet.add(act.locus.path);
          }
        });
      }
    });
    
    // Always include root locus "0" as an option
    if (lociSet.size === 0) {
      lociSet.add("0");
    }
    
    return Array.from(lociSet).sort((a, b) => {
      // Sort by depth (number of dots) then alphabetically
      const depthA = (a.match(/\./g) || []).length;
      const depthB = (b.match(/\./g) || []).length;
      return depthA - depthB || a.localeCompare(b);
    });
  }, [designs, daimonTargetScope, activeScope]);

  // Auto-select first locus when available loci change
  React.useEffect(() => {
    if (availableLoci.length > 0 && !daimonTargetLocus) {
      setDaimonTargetLocus(availableLoci[0]);
    }
  }, [availableLoci, daimonTargetLocus]);

  // Sync daimon target scope with active scope
  React.useEffect(() => {
    if (!showAppendDaimon) {
      setDaimonTargetScope(activeScope);
    }
  }, [showAppendDaimon, activeScope]);

  // Fetch Ludics insights (Phase 1: Week 2)
  const { data: insightsData, isLoading: insightsLoading } = useSWR<{
    ok: boolean;
    insights: LudicsInsights | null;
  }>(
    `/api/ludics/insights?deliberationId=${deliberationId}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 } // Cache for 1 min client-side
  );

  const [showAttach, setShowAttach] = React.useState(false);
  const [attachLoading, setAttachLoading] = React.useState(false);
  const [attachPick, setAttachPick] = React.useState(""); // selected workId
  const [attachTargetScope, setAttachTargetScope] = React.useState<string | null>(null); // Task 8: Week 2
  const [attachCandidates, setAttachCandidates] = React.useState<
    { id: string; title: string; theoryType: "IH" | "TC" | "DN" | "OP" }[]
  >([]);

  // When the attach section opens, list IH/TC works in this deliberation

  // When the attach section opens, list IH/TC works in this deliberation
  React.useEffect(() => {
    if (!showAttach) return;
    // Sync scope with active scope when opening
    setAttachTargetScope(activeScope);
    let cancelled = false;
    (async () => {
      try {
        setAttachLoading(true);
        const r = await fetch(
          `/api/works?deliberationId=${encodeURIComponent(deliberationId)}`,
          { cache: "no-store" }
        );
        const j = await r.json();
        if (cancelled) return;
        setAttachCandidates(
          (j.works ?? []).filter(
            (w: any) => w.theoryType === "IH" || w.theoryType === "TC"
          )
        );
      } finally {
        if (!cancelled) setAttachLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showAttach, deliberationId]);

  const { target } = useDialogueTarget();
  const targetIdFromContext = target?.id ?? null;
  const targetTypeFromContext = target?.type ?? "claim"; // sensible default

  const commitAtPath = React.useCallback((path: string) => {
    setCommitPath(path);
    setCommitOpen(true);
  }, []);

  // Broadcast phase so other components (e.g., row chips) can derive commitOwner
  React.useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("ludics:phase", { detail: { phase } })
    );
  }, [phase]);

  // Throttled compile-step control
  const compRef = React.useRef(false);
  const lastCompileAt = React.useRef(0);
  const [busy, setBusy] = React.useState<
    false | "compile" | "step" | "nli" | "orth" | "append"
  >(false);
  const toast = useMicroToast();

  // Map acts by id from current designs (for NLI/Inspector, heatmap)
  const byAct = React.useMemo(() => {
    const map = new Map<string, any>();
    for (const d of designs) for (const a of d.acts ?? []) map.set(a.id, a);
    return map;
  }, [designs]);

  // ------------------------------------------------------------------
  // Orthogonal SWR (trace   acts for narration & stable heatmap)
  const { data: orthoData, mutate: refreshOrth } = useSWR(
    deliberationId
      ? `/api/ludics/orthogonal?dialogueId=${encodeURIComponent(
          deliberationId
        )}&phase=neutral`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  React.useEffect(() => {
    const h = () => refreshOrth();
    window.addEventListener("dialogue:moves:refresh", h as any);
    return () => window.removeEventListener("dialogue:moves:refresh", h as any);
  }, [refreshOrth]);

  // keep local trace in sync with ortho trace
  React.useEffect(() => {
    const t = orthoData?.trace;
    if (t) {
      setTrace({
        pairs: t.pairs ?? [],
        status: t.status,
        endedAtDaimonForParticipantId: t.endedAtDaimonForParticipantId,
        endorsement: t.endorsement,
        decisiveIndices: t.decisiveIndices,
        usedAdditive: t.usedAdditive,
      });
    }
  }, [orthoData]);

  // 1) step index by act id (for tiny ① ② superscripts)
  const stepIndexByActId = React.useMemo(() => {
    const m: Record<string, number> = {};
    (trace?.pairs ?? []).forEach((p, i) => {
      // if (!p.posActId && !p.negActId) return;
      // if (m[p.posActId || ''] && m[p.negActId || '']) return; // already indexed
      if (p.posActId !== undefined) m[p.posActId] = i + 1;
      if (p.negActId !== undefined) m[p.negActId] = i + 1;
    });
    return m;
  }, [trace]);

  // 2) locus heatmap (frequency; bump decisive hits)
  const heatmap = React.useMemo(() => {
    const hm: Record<string, number> = {};
    const t = orthoData?.trace;
    const acts = (orthoData?.acts ?? {}) as Record<
      string,
      { locusPath?: string }
    >;
    if (!t) return hm;
    (t.pairs ?? []).forEach((p) => {
      const path = acts[p.posActId]?.locusPath ?? acts[p.negActId]?.locusPath;
      if (!path) return;
      hm[path] = (hm[path] ?? 0) + 1;
    });
    (t.decisiveIndices ?? []).forEach((i) => {
      const p = t.pairs?.[i];
      if (!p) return;
      const path = acts[p.posActId]?.locusPath ?? acts[p.negActId]?.locusPath;
      if (!path) return;
      hm[path] = (hm[path] ?? 0) + 2; // extra weight for decisive
    });
    return hm;
  }, [orthoData]);

  // 3) focused locus path (keeps narration ↔ tree synced)
  const focusPath = React.useMemo(() => {
    if (focusIdx == null || !trace) return null;
    const p = trace.pairs[focusIdx];
    if (!p) return null; // Handle summary lines that don't have pairs
    const pos = byAct.get(p.posActId ?? "");
    const neg = byAct.get(p.negActId ?? "");
    return pos?.locus?.path ?? neg?.locus?.path ?? null;
  }, [focusIdx, trace, byAct]);

  // Handle "Focus" click from the tree toolbar
  const onFocusPathChange = React.useCallback(
    (path: string) => {
      const idx = (trace?.pairs ?? []).findIndex(
        (p) =>
          String(byAct.get(p.posActId)?.locus?.path) === path ||
          String(byAct.get(p.negActId)?.locus?.path) === path
      );
      if (idx >= 0) setFocusIdx(idx);
    },
    [trace, byAct]
  );
const suggestClose = React.useCallback((path: string) => {
  const t = orthoData?.trace;
  if (!t) return false;
  const last = t.pairs?.[t.pairs.length - 1]?.locusPath;
  return last === path && (t.status === 'CONVERGENT' || t.status === 'STUCK');
}, [orthoData]);
  // Narration lines
  const actsForNarration = orthoData?.acts ?? {};
  const lines = orthoData?.trace
    ? narrateTrace(orthoData.trace, actsForNarration)
    : [];

  /* ------------------------------- Actions ------------------------------- */
  const compileStep = React.useCallback(
    async (p: "neutral" | "focus-P" | "focus-O" = phase) => {
      const now = Date.now();
      if (now - lastCompileAt.current < 1200) return;
      if (compRef.current) return;
      compRef.current = true;
      setBusy("compile");
      try {
        // Use new /api/ludics/compile endpoint (uses existing designs' scoping)
        const compileRes = await fetch("/api/ludics/compile", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            deliberationId,
            forceRecompile: true,
          }),
        }).then((r) => r.json());

        if (!compileRes.ok) {
          toast.show(compileRes.error || "Compilation failed", "err");
          return;
        }

        // Sync to AIF
        await fetch("/api/ludics/sync-to-aif", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ deliberationId }),
        }).catch(() => {
          console.warn("[LudicsPanel] AIF sync failed (non-fatal)");
        });

        // Invalidate insights cache
        await fetch("/api/ludics/insights/invalidate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ deliberationId }),
        }).catch(() => {
          console.warn("[LudicsPanel] Cache invalidation failed (non-fatal)");
        });

        // Step the active scope if available
        await mutateDesigns();
        
        // Note: We don't auto-step here to avoid circular dependency
        // User can click Step button after compilation
      } finally {
        compRef.current = false;
        setBusy(false);
        lastCompileAt.current = Date.now();
      }
    },
    [deliberationId, phase, mutateDesigns, activeScope, toast]
  );
  const compileStepRef = React.useRef(compileStep);
  React.useEffect(() => {
    compileStepRef.current = compileStep;
  }, [compileStep]);

  React.useEffect(() => {
    function onRefresh(e: any) {
      const id = e?.detail?.deliberationId;
      if (id && id !== deliberationId) return;
      compileStepRef.current("neutral");
    }
    window.addEventListener("dialogue:moves:refresh", onRefresh);
    return () =>
      window.removeEventListener("dialogue:moves:refresh", onRefresh);
  }, [deliberationId]);

  const step = React.useCallback(async () => {
    if (!designs?.length) return;
    setBusy("step");
    try {
      // Filter designs by active scope
      const scopeDesigns = designs.filter(
        (d: any) => (d.scope ?? "legacy") === activeScope
      );

      if (scopeDesigns.length === 0) {
        toast.show(
          `No designs found for scope: ${scopeLabels[activeScope ?? "legacy"] || activeScope}`,
          "err"
        );
        return;
      }

      const pos = scopeDesigns.find(
        (d: any) => d.participantId === "Proponent"
      );
      const neg = scopeDesigns.find(
        (d: any) => d.participantId === "Opponent"
      );

      if (!pos || !neg) {
        toast.show(
          `No P/O pair found for scope: ${scopeLabels[activeScope ?? "legacy"] || activeScope}`,
          "err"
        );
        return;
      }

      const res = await fetch("/api/ludics/step", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          dialogueId: deliberationId,
          posDesignId: pos.id,
          negDesignId: neg.id,
        }),
      }).then((r) => r.json());
      setTrace({
        steps: res.pairs || [],
        status: res.status,
        endedAtDaimonForParticipantId: res.endedAtDaimonForParticipantId,
        endorsement: res.endorsement,
        decisiveIndices: res.decisiveIndices,
        usedAdditive: res.usedAdditive,
      });
      const scopeLabel = scopeLabels[activeScope ?? "legacy"] || activeScope;
      toast.show(`Stepped scope: ${scopeLabel}`, "ok");
    } finally {
      setBusy(false);
    }
  }, [deliberationId, designs, activeScope, scopeLabels, toast]);

  const appendDaimonToNext = React.useCallback(async () => {
    if (!designs?.length) return;
    
    // Validate inputs
    if (!daimonTargetLocus) {
      toast.show("Please select a locus for the daimon", "err");
      return;
    }

    const targetScope = daimonTargetScope ?? activeScope;
    
    // Filter designs by target scope
    const scopeDesigns = designs.filter(
      (d: any) => (d.scope ?? "legacy") === targetScope
    );
    
    const B = scopeDesigns.find((d: any) => d.participantId === "Opponent");
    if (!B) {
      toast.show(
        `No Opponent design found for scope: ${scopeLabels[targetScope ?? "legacy"] || targetScope}`,
        "err"
      );
      return;
    }
    
    setBusy("append");
    try {
      const res = await fetch("/api/ludics/acts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          designId: B.id,
          enforceAlternation: false,
          acts: [{ 
            kind: "DAIMON",
            locusPath: daimonTargetLocus,
          }],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to append daimon");
      }
      
      const scopeLabel = scopeLabels[targetScope ?? "legacy"] || targetScope;
      toast.show(
        `Daimon appended at ${daimonTargetLocus} in scope: ${scopeLabel}`,
        "ok"
      );
      
      // Re-step only the affected scope
      if (targetScope === activeScope) {
        await step();
      } else {
        // If different scope, just refresh designs
        await mutateDesigns();
      }
      
      // Close the append panel after success
      setShowAppendDaimon(false);
    } catch (e: any) {
      toast.show(e?.message || "Append failed", "err");
    } finally {
      setBusy(false);
    }
  }, [
    designs,
    daimonTargetLocus,
    daimonTargetScope,
    activeScope,
    scopeLabels,
    step,
    mutateDesigns,
    toast,
  ]);

  const pickAdditive = React.useCallback(
    async (parentPath: string, child: string) => {
      if (!designs?.length) return;
      const pos =
        designs.find((d: any) => d.participantId === "Proponent") ?? designs[0];
      const neg =
        designs.find((d: any) => d.participantId === "Opponent") ??
        designs[1] ??
        designs[0];
      try {
        const r = await fetch("/api/ludics/additive/pick", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            dialogueId: deliberationId,
            posDesignId: pos.id,
            negDesignId: neg.id,
            parentPath,
            childSuffix: child,
          }),
        });
        const j = await r.json().catch(() => null);
        if (!r.ok || !j?.ok) throw new Error(j?.error || "Pick failed");
        toast.show(`Choice locked for ${parentPath} → ${child}`, "ok");
        await compileStep("focus-P");
      } catch (e: any) {
        toast.show(`Pick failed: ${e?.message ?? "error"}`, "err");
      }
    },
    [designs, deliberationId, compileStep, toast]
  );

  const checkOrthogonal = React.useCallback(async () => {
    if (!designs?.length) return;
    setBusy("orth");
    try {
      // Filter designs by active scope
      const scopeDesigns = designs.filter(
        (d: any) => (d.scope ?? "legacy") === activeScope
      );

      const A = scopeDesigns.find((d: any) => d.participantId === "Proponent");
      const B = scopeDesigns.find((d: any) => d.participantId === "Opponent");
      
      if (!A || !B) {
        toast.show(
          `Missing P/O pair for scope: ${scopeLabels[activeScope ?? "legacy"] || activeScope}`,
          "err"
        );
        return;
      }
      const r = await fetch(
        `/api/ludics/orthogonal?dialogueId=${encodeURIComponent(
          deliberationId
        )}&posDesignId=${A.id}&negDesignId=${B.id}`
      ).then((r) => r.json());
      setOrthogonal(r?.orthogonal ?? null);
      if (r?.trace) {
        setTrace({
          steps: r.trace.pairs ?? [],
          status: r.trace.status,
          endedAtDaimonForParticipantId: r.trace.endedAtDaimonForParticipantId,
          endorsement: r.trace.endorsement,
          decisiveIndices: r.trace.decisiveIndices,
          usedAdditive: r.trace.usedAdditive,
        });
      }
      const scopeLabel = scopeLabels[activeScope ?? "legacy"] || activeScope;
      toast.show(
        r?.orthogonal
          ? `Orthogonal ✓ (${scopeLabel})`
          : `Not orthogonal (${scopeLabel})`,
        r?.orthogonal ? "ok" : "err"
      );
      refreshOrth();
    } finally {
      setBusy(false);
    }
  }, [designs, deliberationId, activeScope, scopeLabels, toast, refreshOrth]);

  const analyzeNLI = React.useCallback(async () => {
    if (!trace || !designs?.length) return;
    setBusy("nli");
    try {
      const pairs = (trace.pairs ?? []).map((p) => ({
        premise: String(byAct.get(p.posActId)?.expression ?? ""),
        hypothesis: String(byAct.get(p.negActId)?.expression ?? ""),
      })).filter(p => p.premise && p.hypothesis); // Filter out empty pairs
      
      if (pairs.length === 0) {
        toast.show("No valid pairs to analyze", "err");
        return;
      }
      
      const res = await fetch("/api/nli/batch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pairs }), // Fixed: was 'items', API expects 'pairs'
      }).then((r) => r.json());

      const TAU = Number(process.env.NEXT_PUBLIC_CQ_NLI_THRESHOLD ?? "0.72");
      const b: Record<number, string> = {};
      let contradictionCount = 0;
      
      res?.results?.forEach((r: any, i: number) => {
        if (r?.relation === "contradicts" && (r.score ?? 0) >= TAU) {
          b[i] = "NLI⊥";
          contradictionCount++;
        }
      });
      
      setBadges(b);
      
      // Store NLI results per scope
      const scopeKey = activeScope ?? "legacy";
      const scopeLabel = scopeLabels[scopeKey] || scopeKey;
      
      setNliResultsByScope(prev => ({
        ...prev,
        [scopeKey]: {
          contradictions: contradictionCount,
          timestamp: new Date().toISOString(),
        },
      }));
      
      // Persist to trace extJson (if trace has an ID)
      // Note: This would require a trace update endpoint which may not exist yet
      // For now, we store in component state
      
      toast.show(
        contradictionCount > 0
          ? `Found ${contradictionCount} contradiction(s) in scope: ${scopeLabel}`
          : `No contradictions found in scope: ${scopeLabel}`,
        contradictionCount > 0 ? "err" : "ok"
      );
    } finally {
      setBusy(false);
    }
  }, [trace, designs, byAct, activeScope, scopeLabels, toast]);

  const checkStable = React.useCallback(async () => {
    setBusy("orth"); // Reuse busy state
    try {
      const scopeKey = activeScope ?? "legacy";
      const scopeLabel = scopeLabels[scopeKey] || scopeKey;
      
      // Add scope parameter to API call
      const url = new URL(
        `/api/af/stable`,
        window.location.origin
      );
      url.searchParams.set("deliberationId", deliberationId);
      
      // Add scope parameter if not legacy
      if (scopeKey !== "legacy") {
        url.searchParams.set("scope", scopeKey);
      }
      
      const res = await fetch(url.toString()).then((r) => r.json());
      
      if (!res.ok) {
        toast.show(res.error || "Failed to compute stable sets", "err");
        return;
      }
      
      const count = res.count ?? 0;
      
      // Update global stable state (for backward compat)
      setStable(count);
      
      // Store per-scope result
      setStableSetsByScope(prev => ({
        ...prev,
        [scopeKey]: count,
      }));
      
      toast.show(
        `Found ${count} stable extension(s) in scope: ${scopeLabel}`,
        "ok"
      );
    } catch (e: any) {
      toast.show("Stable sets computation failed", "err");
    } finally {
      setBusy(false);
    }
  }, [deliberationId, activeScope, scopeLabels, toast]);

  // Build prefix path up to index i from the trace, as (pol,locus) acts:
  const prefixActs = React.useCallback(
    (i: number): VeAct[] => {
      const out: VeAct[] = [];
      for (let k = 0; k <= i; k++) {
        const p = trace?.pairs?.[k];
        if (!p) break;
        const P = byAct.get(p.posActId ?? "");
        const O = byAct.get(p.negActId ?? "");
        if (P?.locus?.path)
          out.push({ pol: "pos", locus: String(P.locus.path) });
        if (O?.locus?.path)
          out.push({ pol: "neg", locus: String(O.locus.path) });
      }
      return out;
    },
    [trace, byAct]
  );

  // ⊙ failures per pair index (i): dual(prefix) is *not* a path
  const revFail = React.useMemo(() => {
    const m: Record<number, true> = {};
    const n = trace?.pairs?.length ?? 0;
    for (let i = 0; i < n; i++) {
      const acts = prefixActs(i);
      const dual = dualPath(acts);
      const ok = isPath(dual).ok;
      if (!ok) m[i] = true;
    }
    return m;
  }, [trace, prefixActs]);

  const onConcede = React.useCallback(
    async (locus: string, proposition: string, conceding?: "Proponent" | "Opponent") => {
      const concedingParticipantId = conceding ?? "Opponent";
      const receiver = concedingParticipantId === "Proponent" ? "Opponent" : "Proponent";
      
      // Find the conceding design
      const scopeDesigns = designs.filter(
        (d: any) => (d.scope ?? "legacy") === activeScope
      );
      const concedingDesign = scopeDesigns.find(
        (d: any) => d.participantId === concedingParticipantId
      );
      
      if (!concedingDesign) {
        toast.show(`No ${concedingParticipantId} design found`, "err");
        return;
      }
      
      try {
        await fetch("/api/ludics/concession", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            dialogueId: deliberationId,
            concedingParticipantId,
            receiverParticipantId: receiver,
            anchorDesignId: concedingDesign.id,
            anchorLocus: locus,
            proposition: { text: proposition, csLocus: locus },
          }),
        });
        await mutateDesigns();
        await step();
        toast.show(`Concession recorded at ${locus}`, "ok");
      } catch (e: any) {
        toast.show(e?.message || "Concession failed", "err");
      }
    },
    [deliberationId, designs, activeScope, mutateDesigns, step, toast]
  );

  const onForceConcession = React.useCallback(
    async (locus: string, text: string, target?: "Proponent" | "Opponent") => {
      if (!designs?.length) return;
      
      const targetParticipant = target ?? "Opponent";
      const scopeDesigns = designs.filter(
        (d: any) => (d.scope ?? "legacy") === activeScope
      );
      const targetDesign = scopeDesigns.find(
        (d: any) => d.participantId === targetParticipant
      );
      
      if (!targetDesign) {
        toast.show(`No ${targetParticipant} design found`, "err");
        return;
      }
      
      try {
        await fetch("/api/ludics/judge/force", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            dialogueId: deliberationId,
            action: "FORCE_CONCESSION",
            target: { designId: targetDesign.id, locusPath: locus },
            data: { text },
          }),
        });
        await mutateDesigns();
        await step();
        toast.show(`Forced concession at ${locus}`, "ok");
      } catch (e: any) {
        toast.show(e?.message || "Force concession failed", "err");
      }
    },
    [designs, deliberationId, activeScope, mutateDesigns, step, toast]
  );

  const onCloseBranch = React.useCallback(
    async (locus: string, target?: "Proponent" | "Opponent") => {
      if (!designs?.length) return;
      
      const targetParticipant = target ?? "Opponent";
      const scopeDesigns = designs.filter(
        (d: any) => (d.scope ?? "legacy") === activeScope
      );
      const targetDesign = scopeDesigns.find(
        (d: any) => d.participantId === targetParticipant
      );
      
      if (!targetDesign) {
        toast.show(`No ${targetParticipant} design found`, "err");
        return;
      }
      
      try {
        await fetch("/api/ludics/judge/force", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            dialogueId: deliberationId,
            action: "CLOSE_BRANCH",
            target: { designId: targetDesign.id, locusPath: locus },
          }),
        });
        await mutateDesigns();
        await step();
        toast.show(`Branch closed at ${locus}`, "ok");
      } catch (e: any) {
        toast.show(e?.message || "Close branch failed", "err");
      }
    },
    [designs, deliberationId, activeScope, mutateDesigns, step, toast]
  );

  //    const commitAtPath = React.useCallback(async (path: string) => {
  //    const label = window.prompt('New commitment label (fact):', '');
  //    if (!label) return;
  //    try {
  //      await fetch('/api/commitments/apply', {
  //        method:'POST', headers:{'content-type':'application/json'},
  //        body: JSON.stringify({
  //          dialogueId: deliberationId,
  //          ownerId: 'Proponent',               // or current side
  //          autoPersistDerived: false,
  //          ops: { add: [{ label, basePolarity: 'pos', baseLocusPath: path, entitled: true }] }
  //        })
  //      });
  //      window.dispatchEvent(new CustomEvent('dialogue:cs:refresh', { detail: { dialogueId: deliberationId, ownerId: 'Proponent' }}));
  //      toast.show(`Committed “${label}” @ ${path}`, 'ok');
  //    } catch (e:any) {
  //      toast.show('Commit failed', 'err');
  //    }
  // }, [deliberationId, toast]);

  /* ------------------------- Sync + keyboard hooks ----------------------- */
  React.useEffect(() => {
    const onFocus = async (e: any) => {
      const { phase } = e?.detail || {};
      await compileStep(phase ?? "focus-P");
    };
    window.addEventListener("ludics:focus", onFocus as any);
    return () => window.removeEventListener("ludics:focus", onFocus as any);
  }, [compileStep]);

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      )
        return;
      if (e.key === "c") compileStep();
      else if (e.key === "s") step();
      else if (e.key === "o") checkOrthogonal();
      else if (e.key === "n") analyzeNLI();
      else if (e.key === "l") setShowGuide((v) => !v);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [compileStep, step, checkOrthogonal, analyzeNLI]);

  /* ------------------------------ Rendering ------------------------------ */
  const steps = trace?.pairs ?? [];
  const actsCount = designs.reduce(
    (acc: number, d: any) => acc + (d.acts?.length ?? 0),
    0
  );
  const traceLike = asTraceLike(trace) ?? {
    steps: [],
    status: "ONGOING" as const,
  };

  return (
    <div className="space-y-3 rounded-2xl  p-3 panelv2 hover:translate-y-0 bg-white/10 backdrop-blur-md">
      {/* Ludics Insights Section (Phase 1: Week 2) */}
      {insightsData?.insights && (
        <div className="rounded-lg bg-white/80 border border-slate-200/80 p-3 space-y-4">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-semibold text-slate-700">
              Interaction Metrics
            </h3>
            <div className="flex items-center gap-4">
              <InsightsTooltip insights={insightsData.insights}>
                <InsightsBadge
                  complexityScore={insightsData.insights.interactionComplexity}
                  size="sm"
                />
              </InsightsTooltip>
              <PolarityBadge
                positive={insightsData.insights.polarityDistribution.positive}
                negative={insightsData.insights.polarityDistribution.negative}
                neutral={insightsData.insights.polarityDistribution.neutral}
                size="sm"
              />
            </div>
         
          <div className="flex border-l pl-8 ml-4 border-slate-500/50 tracking-wide  text-xs gap-8">
            <div className="text-center ">
              <div className="font-bold text-slate-900">{insightsData.insights.totalActs}</div>
              <div className="text-slate-600">Acts</div>

            </div>

            <div className="text-center">
              <div className="font-bold text-slate-900">{insightsData.insights.totalLoci}</div>
              <div className="text-slate-600">Loci</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-slate-900">{insightsData.insights.maxDepth}</div>
              <div className="text-slate-600">Depth</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-slate-900">{insightsData.insights.branchFactor.toFixed(1)}</div>
              <div className="text-slate-600">Branches</div>
            </div>
          </div>
           </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ChipBar>
            <span>|D| {designs.length}</span>
            <span>|acts| {actsCount}</span>
            <span>|pairs| {steps.length}</span>
            {trace?.status && (
              <span
                className={[
                  "px-1.5 py-0.5 rounded border",
                  trace.status === "CONVERGENT"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : trace.status === "DIVERGENT"
                    ? "bg-rose-50 border-rose-200 text-rose-700"
                    : "bg-slate-50 border-slate-200 text-slate-700",
                ].join(" ")}
              >
                {trace.status === "CONVERGENT" ? "† CONVERGENT" : trace.status}
              </span>
            )}
            {typeof stable === "number" && <span>stable {stable}</span>}
            {orthogonal !== null && (
              <span
                className={[
                  "px-1.5 py-0.5 rounded border",
                  orthogonal
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-amber-50 border-amber-200 text-amber-700",
                ].join(" ")}
              >
                {orthogonal ? "orthogonal ✓" : "not orthogonal"}
              </span>
            )}
          </ChipBar>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Active Scope Selector (for filtering results) */}
          {scopes.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-md border border-slate-200/80 bg-white/70 px-2 py-1 text-[11px] backdrop-blur">
              <label className="text-slate-600 font-medium">Scope:</label>
              <select
                value={activeScope ?? ""}
                onChange={(e) => setActiveScope(e.target.value || null)}
                className="border-0 bg-transparent text-[11px] font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 max-w-[200px]"
                disabled={!!busy}
              >
                {scopes.map((scope) => (
                  <option key={scope} value={scope}>
                    {scopeLabels[scope] || scope}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Segmented
            ariaLabel="Phase"
            value={phase}
            onChange={(v) => {
              setPhase(v);
              compileStep(v);
            }}
            options={[
              { value: "neutral", label: "Neutral" },
              { value: "focus-P", label: "Focus P" },
              { value: "focus-O", label: "Focus O" },
            ]}
          />
          <Segmented
            ariaLabel="Tree layout"
            value={viewMode}
            onChange={(v) => setViewMode(v)}
            options={[
              { value: "forest", label: "Forest" },
              { value: "unified", label: "Unified" },
              { value: "split", label: "Split" },
            ]}
          />

          <button
            className="btnv2"
            aria-label="Compile from moves"
            onClick={() => compileStep("neutral")}
            disabled={!!busy}
            title="Recompile designs from dialogue moves"
          >
            {busy === "compile" ? "Compiling…" : "Compile"}
          </button>
          <button
            className="btnv2"
            aria-label="Step"
            onClick={step}
            disabled={!!busy}
          >
            {busy === "step" ? "Stepping…" : "Step"}
          </button>
          <button
            className="btnv2"
            aria-label="Append daimon"
            onClick={() => setShowAppendDaimon((v) => !v)}
            aria-expanded={showAppendDaimon}
          >
            {showAppendDaimon ? "Hide †" : "Append †"}
          </button>
          <button
            className="btnv2"
            aria-label="Check orthogonality"
            onClick={checkOrthogonal}
            disabled={!!busy}
          >
            {busy === "orth" ? "Checking…" : "Orthogonality"}
          </button>
          <button
            className="btnv2"
            aria-label="Analyze NLI"
            onClick={analyzeNLI}
            disabled={!!busy}
            title={
              nliResultsByScope[activeScope ?? "legacy"]
                ? `Last analyzed: ${new Date(
                    nliResultsByScope[activeScope ?? "legacy"].timestamp
                  ).toLocaleTimeString()}`
                : "Analyze Natural Language Inference"
            }
          >
            {busy === "nli" ? "Analyzing…" : (
              <>
                NLI
                {nliResultsByScope[activeScope ?? "legacy"] && (
                  <span className="ml-1 text-[10px] opacity-70">
                    ({nliResultsByScope[activeScope ?? "legacy"].contradictions})
                  </span>
                )}
              </>
            )}
          </button>
          <button
            className="btnv2 btnv2--ghost"
            aria-label="Trace Log"
            onClick={() => setShowGuide((v) => !v)}
          >
            {showGuide ? "Hide log" : "Trace log"}
          </button>
          <button
            className="btnv2 btnv2--ghost"
            aria-label="Stable sets"
            onClick={checkStable}
            title={
              stableSetsByScope[activeScope ?? "legacy"] !== undefined
                ? `${stableSetsByScope[activeScope ?? "legacy"]} stable extension(s) in this scope`
                : "Compute stable sets for active scope"
            }
          >
            Stable sets
            {stableSetsByScope[activeScope ?? "legacy"] !== undefined && (
              <span className="ml-1 text-[10px] opacity-70">
                ({stableSetsByScope[activeScope ?? "legacy"]})
              </span>
            )}
          </button>
          <button
            className="btnv2 btnv2--ghost"
            onClick={() => setShowAttach((v) => !v)}
            aria-expanded={showAttach}
          >
            {showAttach ? "Hide testers" : "Attach testers"}
          </button>
          <button
            className={`btnv2 ${showAnalysisPanel ? "btnv2--primary" : "btnv2--ghost"}`}
            onClick={() => setShowAnalysisPanel((v) => !v)}
            aria-expanded={showAnalysisPanel}
            title="Phase 1-5 Analysis Panel: Views, Chronicles, Strategy, Types, Behaviours"
          >
            {showAnalysisPanel ? "◀ Analysis" : "▶ Analysis"}
          </button>
        </div>
      </div>

      {/* Ribbon */}
      <div className="rounded-md border border-slate-200 bg-white/60 p-2">
        {traceLike ? (
          <TraceRibbon
            steps={traceLike.steps}
            status={traceLike.status}
            badges={badges}
            decisiveIndices={trace?.decisiveIndices}
            revFailIndices={Object.keys(revFail).map(Number)}
          />
        ) : (
          <div className="text-xs text-neutral-500">No traversal yet.</div>
        )}
        {trace?.decisiveIndices?.length ? (
          <div className="mt-1 text-[11px] text-indigo-700">
            decisive: {trace.decisiveIndices.map((i) => i + 1).join(", ")}
          </div>
        ) : null}
        {/* commitment delta overlay */}
        <CommitmentDelta
          dialogueId={deliberationId}
          refreshKey={`${trace?.status}:${trace?.pairs?.length ?? 0}`}
        />
      </div>
      {/* Append Daimon Panel (Task 5: Week 2) */}
      {showAppendDaimon && (
        <div className="rounded border border-amber-200 bg-amber-50/80 p-3 text-xs space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-amber-900">Append Daimon (†)</h4>
            <button
              className="text-xs text-amber-600 hover:text-amber-800 underline"
              onClick={() => setShowAppendDaimon(false)}
            >
              Close
            </button>
          </div>
          
          <div className="grid gap-2">
            {/* Scope selector (if multiple scopes) */}
            {scopes.length > 1 && (
              <div className="flex items-center gap-2">
                <label className="text-amber-800 font-medium min-w-[60px]">
                  Scope:
                </label>
                <select
                  className="border rounded px-2 py-1 bg-white flex-1"
                  value={daimonTargetScope ?? ""}
                  onChange={(e) => {
                    setDaimonTargetScope(e.target.value || null);
                    setDaimonTargetLocus(""); // Reset locus when scope changes
                  }}
                  disabled={!!busy}
                >
                  {scopes.map((scope) => (
                    <option key={scope} value={scope}>
                      {scopeLabels[scope] || scope}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Locus selector */}
            <div className="flex items-center gap-2">
              <label className="text-amber-800 font-medium min-w-[60px]">
                Locus:
              </label>
              <select
                className="border rounded px-2 py-1 bg-white flex-1 font-mono text-[11px]"
                value={daimonTargetLocus}
                onChange={(e) => setDaimonTargetLocus(e.target.value)}
                disabled={!!busy || availableLoci.length === 0}
              >
                {availableLoci.length === 0 ? (
                  <option value="">No loci available</option>
                ) : (
                  <>
                    <option value="">— Select locus —</option>
                    {availableLoci.map((locus) => (
                      <option key={locus} value={locus}>
                        {locus}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
            
            {/* Append button */}
            <div className="flex items-center justify-between pt-2 border-t border-amber-200">
              <div className="text-[11px] text-amber-700">
                {availableLoci.length} loci available
              </div>
              <button
                className="px-3 py-1.5 border rounded bg-white hover:bg-amber-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={appendDaimonToNext}
                disabled={!!busy || !daimonTargetLocus || availableLoci.length === 0}
              >
                {busy === "append" ? "Appending…" : "Append †"}
              </button>
            </div>
          </div>
          
          <div className="text-[10px] text-amber-600 bg-amber-100 rounded p-2 mt-2">
            <strong>Tip:</strong> Appending a daimon (†) to a locus marks it as terminal/closed.
            This signals convergence or concession at that point in the interaction.
          </div>
        </div>
      )}

      {showAttach && (
        <div className="mt-2 rounded border bg-white/60 p-2 text-xs">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-neutral-600">Target Scope:</span>
            <select
              className="border rounded px-2 py-1 text-xs"
              value={attachTargetScope ?? ""}
              onChange={(e) => setAttachTargetScope(e.target.value || null)}
            >
              {scopes.map((s) => (
                <option key={s} value={s}>
                  {scopeLabels[s] ?? s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-600">Source Work:</span>
            <select
              className="border rounded px-2 py-1"
              value={attachPick}
              onChange={(e) => setAttachPick(e.target.value)}
            >
              <option value="">— Select IH/TC Work —</option>
              {attachCandidates.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title} [{w.theoryType}]
                </option>
              ))}
            </select>

            <button
              className="px-2 py-1 border rounded bg-white"
              disabled={!attachPick || attachLoading || isDesignsLoading}
              onClick={async () => {
                try {
                  setAttachLoading(true);
                  // Get suggested testers from the selected Work
                  const j = await fetch(
                    `/api/works/${attachPick}/ludics-testers`,
                    { cache: "no-store" }
                  )
                    .then((r) => r.json())
                    .catch(() => null);

                  const targetScope = attachTargetScope ?? activeScope;
                  const scopeKey = targetScope ?? "legacy";
                  const scopeLabel = scopeLabels[scopeKey] ?? scopeKey;

                  // Filter designs by target scope
                  const scopeDesigns = designs.filter(
                    (d: any) => (d.scope ?? "legacy") === scopeKey
                  );
                  
                  // Resolve designs (pos/neg) from filtered scope designs
                  const pos = scopeDesigns.find((d: any) => d.participantId === "Proponent")?.id;
                  const neg = scopeDesigns.find((d: any) => d.participantId === "Opponent")?.id;
                  if (!pos || !neg) throw new Error(`Missing P/O designs in scope: ${scopeLabel}`);

                  // Attach testers by stepping with them
                  const r = await fetch("/api/ludics/step", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      dialogueId: deliberationId,
                      posDesignId: pos,
                      negDesignId: neg,
                      testers: j?.testers ?? [],
                      fuel: 2048,
                    }),
                  });

                  if (!r.ok) throw new Error(await r.text());
                  toast.show(`Testers attached to scope: ${scopeLabel}`, "ok");

                  // Refresh panels that depend on the run/designs
                  await Promise.all([refreshOrth(), mutateDesigns()]);
                } catch (e: any) {
                  toast.show(`Attach failed: ${e?.message ?? "error"}`, "err");
                } finally {
                  setAttachLoading(false);
                }
              }}
            >
              {attachLoading ? "Attaching…" : "Attach"}
            </button>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Tip: Testers will be attached to the selected scope. Refine loci in Evaluation/Loci tools after attaching.
          </div>
        </div>
      )}

      {/* Enhanced Trace Log */}
      {showGuide && (
        <div className="grid gap-4">
          {/* Plain Text Trace Output */}
          {lines.length > 0 && (
            <div className="border rounded-lg bg-slate-100 p-4 font-mono text-sm">
              <div className="flex items-center justify-between mb-3">
                
              </div>
              <div className="text-slate-800 space-y-1 max-h-48 overflow-y-auto">
                {lines.map((l, i) => (
                  <div key={i} className="hover:bg-slate-200 px-2 py-1 rounded transition-colors">
                    <span className="text-slate-500">{i + 1}.</span> {l.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Header with Stats */}
          <div className="border rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900">Trace Log Analysis</h3>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1.5 text-xs bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors"
                  onClick={() => {
                    if (!lines.length) return;
                    const txt = lines
                      .map((l, i) => `${i + 1}. ${l.text}`)
                      .join("\n");
                    navigator.clipboard?.writeText(txt).catch(() => {});
                  }}
                  title="Copy narrated trace to clipboard"
                >
                  📋 Copy
                </button>
                <button
                  className="px-3 py-1.5 text-xs bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors"
                  onClick={() => setShowGuide(false)}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Trace Statistics */}
            {trace && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-xs text-slate-600 mb-1">Total Pairs</div>
                  <div className="text-2xl font-bold text-slate-900">{trace.pairs.length}</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-xs text-slate-600 mb-1">Decisive Steps</div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {trace.decisiveIndices?.length ?? 0}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-xs text-slate-600 mb-1">Status</div>
                  <div className={[
                    "text-sm font-bold uppercase",
                    trace.status === "CONVERGENT" ? "text-emerald-600" :
                    trace.status === "DIVERGENT" ? "text-rose-600" :
                    "text-amber-600"
                  ].join(" ")}>
                    {trace.status === "CONVERGENT" ? "✓ Convergent" :
                     trace.status === "DIVERGENT" ? "✗ Divergent" :
                     "⋯ Ongoing"}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-xs text-slate-600 mb-1">Unique Loci</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {new Set(trace.pairs.map(p => {
                      const pos = byAct.get(p.posActId ?? "");
                      const neg = byAct.get(p.negActId ?? "");
                      return pos?.locus?.path ?? neg?.locus?.path ?? "0";
                    })).size}
                  </div>
                </div>
              </div>
            )}

            {/* Outcome Summary */}
            {trace && trace.status === "CONVERGENT" && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">✓</div>
                  <div className="flex-1">
                    <div className="font-semibold text-emerald-900 mb-1">
                      Dialogue Converged Successfully
                    </div>
                    <div className="text-sm text-emerald-700">
                      {trace.endedAtDaimonForParticipantId && (
                        <span>Ended with daimon by <strong>{trace.endedAtDaimonForParticipantId}</strong></span>
                      )}
                      {trace.endorsement && (
                        <span className="ml-2">
                          • Endorsed by <strong>{trace.endorsement.byParticipantId}</strong> at locus <code className="bg-emerald-100 px-1 rounded">{trace.endorsement.locusPath}</code>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {trace && trace.status === "DIVERGENT" && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">✗</div>
                  <div className="flex-1">
                    <div className="font-semibold text-rose-900 mb-1">
                      Dialogue Diverged
                    </div>
                    <div className="text-sm text-rose-700">
                      Unresolved obligations remain. Further moves required to reach convergence.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content: Legend and Trace */}
          <div className="grid gap-4 md:grid-cols-[300px_1fr]">
            {/* Legend Panel */}
            <div className="border rounded-lg p-4 bg-white h-fit">
              <div className="font-semibold text-sm mb-3 text-slate-900">Quick Reference</div>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="font-medium text-slate-700 mb-1">Participants</div>
                  <div className="space-y-1 text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">P</span>
                      <span>Proponent (positive polarity)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[10px]">O</span>
                      <span>Opponent (negative polarity)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <div className="font-medium text-slate-700 mb-1">Move Types</div>
                  <div className="space-y-1 text-slate-600">
                    <div><strong>Assert:</strong> Initial claim at locus</div>
                    <div><strong>Challenge (WHY):</strong> Question/attack</div>
                    <div><strong>Grounds:</strong> Supporting evidence</div>
                    <div><strong>† Daimon:</strong> Terminal/acceptance</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <div className="font-medium text-slate-700 mb-1">Locus Notation</div>
                  <div className="space-y-1 text-slate-600">
                    <div><code className="bg-slate-100 px-1 rounded">0</code> = Root position</div>
                    <div><code className="bg-slate-100 px-1 rounded">0.1</code> = First child of root</div>
                    <div><code className="bg-slate-100 px-1 rounded">0.1.2</code> = Second child of 0.1</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <div className="font-medium text-slate-700 mb-1">Indicators</div>
                  <div className="space-y-1 text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold">✓</span>
                      <span>Decisive step</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">⊕</span>
                      <span>Additive choice</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold">⊙</span>
                      <span>Reversibility failure</span>
                    </div>
                  </div>
                </div>

                {badges && Object.keys(badges).length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <div className="font-medium text-slate-700 mb-1">NLI Results</div>
                    <div className="text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold">NLI⊥</span>
                        <span>Detected contradiction</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Narrated Trace */}
            <div className="border rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-sm text-slate-900">Step-by-Step Narrative</div>
                {lines.length > 0 && (
                  <div className="text-xs text-slate-500">
                    {lines.length} step{lines.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {!trace ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3 opacity-30">📝</div>
                  <div className="text-sm text-slate-600 font-medium mb-1">No trace yet</div>
                  <div className="text-xs text-slate-500">
                    Start the dialogue by posting WHY or GROUNDS moves
                  </div>
                </div>
              ) : lines.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3 opacity-30">⏳</div>
                  <div className="text-sm text-slate-600 font-medium mb-1">Trace processing</div>
                  <div className="text-xs text-slate-500">
                    Click &quot;Step&quot; to generate the trace narrative
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {lines.map((ln, i) => {
                    const isDecisive = ln.decisive;
                    const isSelected = focusIdx === i;
                    const hasNLI = badges[i];
                    const hasRevFail = revFail[i];
                    const pair = trace?.pairs[i];
                    const hasValidPair = pair && (pair.posActId || pair.negActId);
                    
                    return (
                      <div key={i} className="space-y-2">
                        <div
                          className={[
                            "group relative rounded-lg border p-3 transition-all cursor-pointer",
                            isSelected 
                              ? "bg-sky-50 border-sky-300 shadow-sm" 
                              : "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300",
                            isDecisive && "ring-2 ring-indigo-200"
                          ].join(" ")}
                          onClick={() => setFocusIdx(i)}
                        >
                          {/* Step number and badges */}
                          <div className="flex items-start gap-3">
                            <div className={[
                              "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                              isSelected
                                ? "bg-sky-600 text-white"
                                : isDecisive
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-300 text-slate-700"
                            ].join(" ")}>
                              {i + 1}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              {/* Main text */}
                              <div className={[
                                "text-sm leading-relaxed mb-1",
                                isDecisive ? "font-semibold text-slate-900" : "text-slate-700"
                              ].join(" ")}>
                                {ln.text}
                              </div>
                              
                              {/* Hover details */}
                              {ln.hover && (
                                <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200">
                                  <div className="font-medium mb-1">Full expressions:</div>
                                  <div className="space-y-1 font-mono text-[10px] bg-slate-100 p-2 rounded">
                                    {ln.hover.split(' • ').map((expr, idx) => (
                                      <div key={idx} className="truncate">{expr}</div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Badges */}
                            <div className="flex flex-col gap-1 items-end">
                              {isDecisive && (
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold">
                                  ✓ DECISIVE
                                </span>
                              )}
                              {hasNLI && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">
                                  NLI⊥
                                </span>
                              )}
                              {hasRevFail && (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold">
                                  ⊙
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Inline Act Inspector - only show for valid pairs */}
                        {isSelected && hasValidPair && pair && (
                          <div className="ml-10 border-l-2 border-sky-400 pl-4">
                            <ActInspector
                              pos={byAct.get(pair.posActId ?? "")}
                              neg={byAct.get(pair.negActId ?? "")}
                              onClose={() => setFocusIdx(null)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Trees */}
      <div className="grid  gap-4">
        {viewMode === "forest" ? (
          <LudicsForest deliberationId={deliberationId} />
        ) : viewMode === "unified" ? (
          <div className="border rounded-lg p-2 bg-white/60">
            <div className="text-xs mb-1 flex items-center gap-2">
              <b>Unified loci</b>
              <span className="px-1.5 py-0.5 rounded border bg-slate-50">
                acts {actsCount}
              </span>
            </div>
            {/* <LociTree
              root={mergeDesignsToTree(designs)}
              usedAdditive={trace?.usedAdditive}
              onPickBranch={pickAdditive}
              focusPath={focusPath}
              onCommitHere={commitAtPath}
              onFocusPathChange={onFocusPathChange}
              defaultCollapsedDepth={1}
              showExpressions
              heatmap={heatmap}
              stepIndexByActId={stepIndexByActId}
              autoScrollOnFocus
              enableKeyboardNav
            /> */}
            <LociTreeWithControls
              dialogueId={deliberationId}
              posDesignId={proDesignId}
              negDesignId={oppDesignId}
              defaultMode="assoc"
              suggestCloseDaimonAt={suggestClose}
            />

            {commitOpen && commitPath && targetIdFromContext && (
              <NLCommitPopover
                open={commitOpen}
                onOpenChange={setCommitOpen}
                deliberationId={deliberationId}
                targetType={targetTypeFromContext}
                targetId={targetIdFromContext}
                locusPath={commitPath}
                defaultOwner="Proponent"
                onDone={() => {
                  /* refresh */
                }}
              />
            )}
          </div>
        ) : (
          // Split view: one per design (kept for debugging/teaching)
          <div className="grid md:grid-cols-2 gap-4">
            {isDesignsLoading && (
              <>
                <SkeletonCard lines={4} />
                <SkeletonCard lines={4} />
              </>
            )}
            {designsError && (
              <div className="col-span-2 text-xs text-rose-600 border rounded p-2">
                Failed to load designs.
              </div>
            )}
            {designs?.map((d: any) => (
              <div key={d.id} className="border rounded-lg p-2 bg-white/60">
                <div className="text-xs mb-1 flex items-center gap-2">
                  <b>{d.participantId}</b> · {d.id.slice(0, 6)}
                  {(() => {
                    const first = (d.acts ?? [])[0];
                    const start =
                      first?.polarity === "O"
                        ? "Start: Negative"
                        : first?.polarity === "P"
                        ? "Start: Positive"
                        : "Start: —";
                    return (
                      <span className="px-1.5 py-0.5 rounded border bg-slate-50">
                        {start}
                      </span>
                    );
                  })()}
                  <span className="px-1.5 py-0.5 rounded border bg-slate-50">
                    acts {d.acts?.length ?? 0}
                  </span>
                </div>
                <LociTree
                  root={shapeToTree(d)}
                  onPickBranch={pickAdditive}
                  usedAdditive={trace?.usedAdditive}
                  focusPath={focusPath}
                  onFocusPathChange={onFocusPathChange}
                  defaultCollapsedDepth={1}
                  showExpressions
                  heatmap={heatmap}
                  stepIndexByActId={stepIndexByActId}
                  autoScrollOnFocus
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commitments */}
      <div className="grid md:grid-cols-2 gap-4">
        <CommitmentsPanel
          dialogueId={deliberationId}
          ownerId="Proponent"
          onChanged={() => {}}
        />
        <CommitmentsPanel
          dialogueId={deliberationId}
          ownerId="Opponent"
          onChanged={() => {}}
        />
      </div>

      {/* Defense tree */}
      <DefenseTree
        designs={designs}
        trace={traceLike}
        decisiveWindow={3}
        highlightIndices={trace?.decisiveIndices}
      />

      {/* Judge tools */}
      <JudgeConsole
        onForceConcession={onForceConcession}
        onCloseBranch={onCloseBranch}
        onConcede={onConcede}
        onStepNow={step}
        locusSuggestions={availableLoci.length > 0 ? availableLoci : ["0"]}
        defaultTarget="Opponent"
      />

      {/* Phase 1-5 Analysis Panel (DDS Analysis: Views, Chronicles, Strategy, Types, Behaviours) */}
      {showAnalysisPanel && (pro?.id || designs.length > 0) && (
        <div className="border-t border-slate-200 pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="text-base">📊</span>
              DDS Analysis Panel
              <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                Phases 1-5
              </span>
            </h3>
            <button
              className="text-xs text-slate-500 hover:text-slate-700 underline"
              onClick={() => setShowAnalysisPanel(false)}
            >
              Close
            </button>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white/80 shadow-sm overflow-hidden">
            <AnalysisPanel
              designId={pro?.id || designs[0]?.id || ""}
              deliberationId={deliberationId}
              analysisState={analysisState}
              onAnalysisUpdate={handleAnalysisUpdate}
            />
          </div>
        </div>
      )}

      {toast.node}
    </div>
  );
}

/* ------------------------------ Utilities ------------------------------- */
function shapeToTree(d: any) {
  const nodes = new Map<string, any>();
  const ensure = (path: string) => {
    if (!nodes.has(path))
      nodes.set(path, { id: path, path, acts: [], children: [] });
    return nodes.get(path);
  };

  for (const a of d.acts ?? []) {
    const p = a?.locus?.path ?? "0";
    ensure(p).acts.push({
      id: a.id,
      polarity: a.polarity,
      expression: a.expression,
      isAdditive: a.isAdditive || a.additive,
    });
    const parts = p.split(".");
    for (let i = 1; i < parts.length; i++) ensure(parts.slice(0, i).join("."));
  }

  const all = Array.from(nodes.values());
  const byPath = Object.fromEntries(all.map((n: any) => [n.path, n]));
  for (const n of all) {
    const parent = n.path.includes(".")
      ? n.path.split(".").slice(0, -1).join(".")
      : null;
    if (parent && byPath[parent]) byPath[parent].children.push(n);
  }
  return (
    byPath["0"] || all[0] || { id: "0", path: "0", acts: [], children: [] }
  );
}
