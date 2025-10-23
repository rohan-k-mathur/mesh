"use client";
import { useEffect, useState, useMemo } from "react";
import DeliberationComposer from "./DeliberationComposer";
import { RepresentativeViewpoints } from "./RepresentativeViewpoints";
import ArgumentsList from "./ArgumentsList";
import CardComposerTab from "@/components/deepdive/CardComposerTab";
import StatusChip from "@/components/governance/StatusChip";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "../ui/tabs";
import CegMiniMap from "./CegMiniMap";
import TopologyWidget from "./TopologyWidget";
import DiscusHelpPage from "../help/HelpPage";
import ApprovalsHeatStrip from "@/components/deepdive/ApprovalsHeatStrip";
import WorksList from "../work/WorksList";
import LudicsPanel from "./LudicsPanel";
import { FloatingSheet, SheetToggleButton } from "../ui/FloatingSheet";
import { DialogueInspector } from "@/components/dialogue/DialogueInspector";

import { AFMinimap } from '@/components/dialogue/minimap/AFMinimap';
import BehaviourInspectorCard from '@/components/ludics/BehaviourInspectorCard';
import { scrollIntoViewById } from "@/lib/client/scroll";
import { CommandCard, performCommand } from '@/components/dialogue/command-card/CommandCard';
import { CommandCardAction } from "../dialogue/command-card/types";
import type { AifSubgraph } from '@/lib/arguments/diagram';
import { movesToActions } from "@/lib/dialogue/movesToActions"; // ✅ Use newer adapter instead of legalMovesToCommandCard
import { CQContextPanel } from "../dialogue/command-card/CQContextPanel";
import { DialogueActionsButton } from "@/components/dialogue/DialogueActionsButton";
import { useMinimapData } from '@/lib/client/minimap/useMinimapData';
import useSWR, { mutate as swrMutate } from "swr";
import { AIFAuthoringPanel } from "./AIFAuthoringPanel";
import React from "react";
import clsx from "clsx";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import CardListVirtuoso from "@/components/deepdive/CardListVirtuoso";
import { useAuth } from "@/lib/AuthContext";
import AIFArgumentsListPro from '@/components/arguments/AIFArgumentsListPro';
import PropositionsList from "../propositions/PropositionsList";
import PropositionComposer from "../propositions/PropositionComposer";
import { DiagramViewer } from "../dialogue/deep-dive/DiagramViewer";
import IssuesDrawer from "@/components/issues/IssuesDrawer";
import IssueComposer from "@/components/issues/IssueComposer";
import { ConfidenceProvider } from "../agora/useConfidence";
import ClaimMiniMap from "../claims/ClaimMiniMap";
import { PropositionComposerPro } from "../propositions/PropositionComposerPro";
import IssuesList from "../issues/IssuesList";

const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then(r => r.json());

type Selection = {
  id: string;
  deliberationId: string;
  rule: "utilitarian" | "harmonic" | "maxcov";
  k: number;
  coverageAvg: number;
  coverageMin: number;
  jrSatisfied: boolean;
  views: {
    index: number;
    arguments: { id: string; text: string; confidence?: number | null }[];
  }[];
};

function useCompileStep(deliberationId: string | undefined) {
  const [state, setState] = React.useState<{
    proId?: string;
    oppId?: string;
    trace?: any;
    loading: boolean;
  }>({ loading: true });

  React.useEffect(() => {
    if (!deliberationId) return;
    setState({ loading: true });
    (async () => {
      const r = await fetch('/api/ludics/compile-step', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ deliberationId }),
      }).then(res => res.json());
      setState({ proId: r.proId, oppId: r.oppId, trace: r.trace, loading: false });
    })();
  }, [deliberationId]);

  return state;
}

function WorksCounts({ deliberationId }: { deliberationId: string }) {
  const [counts, setCounts] = useState<{ DN: number; IH: number; TC: number; OP: number }>({ DN: 0, IH: 0, TC: 0, OP: 0 });
  useEffect(() => {
    if (!deliberationId) return;
    (async () => {
      const res = await fetch(`/api/works?deliberationId=${encodeURIComponent(deliberationId)}`, { cache: 'no-store' });
      const json = await res.json();
      const tallies = { DN: 0, IH: 0, TC: 0, OP: 0 } as any;
      for (const w of (json.works ?? [])) tallies[w.theoryType] = (tallies[w.theoryType] ?? 0) + 1;
      setCounts(tallies);
    })();
  }, [deliberationId]);
  return (
    <ChipBar>
      <span className="text-[11px] text-neutral-900 py-1">
        DN <b>{counts.DN}</b> · IH <b>{counts.IH}</b> · TC <b>{counts.TC}</b> · OP <b>{counts.OP}</b>
      </span>
    </ChipBar>
  );
}

function usePersisted(key: string, def = true) {
  const [open, setOpen] = useState<boolean>(def);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(key);
      if (saved != null) {
        setOpen(saved === "1");
      }
    } catch {
      // ignore if unavailable
    }
  }, [key]);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, open ? "1" : "0");
    } catch {
      // ignore if unavailable
    }
  }, [key, open]);

  return { open, setOpen };
}

function StickyHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={clsx(
        "sticky top-0 z-20 px-4 py-2 rounded-lg transition-all duration-200",
        "bg-white/80 backdrop-blur-sm border-b border-slate-200",
        isScrolled && "shadow-md bg-white/95",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionCard({
  id,
  title,
  subtitle,
  icon,
  action,
  footer,
  children,
  className = "",
  dense = false,
  stickyHeader = false,
  busy = false,
  isLoading = false,
  emptyText,
  tone = "default",
  padded = true,
}: {
  id?: string;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  dense?: boolean;
  stickyHeader?: boolean;
  busy?: boolean;
  isLoading?: boolean;
  emptyText?: string;
  tone?: "default" | "info" | "success" | "warn" | "danger";
  padded?: boolean;
}) {
  const ringClass =
    tone === "info"
      ? "ring-sky-200/60 dark:ring-sky-400/40"
      : tone === "success"
        ? "ring-emerald-200/60 dark:ring-emerald-400/40"
        : tone === "warn"
          ? "ring-amber-200/60 dark:ring-amber-400/50"
          : tone === "danger"
            ? "ring-rose-200/60 dark:ring-rose-400/40"
            : "ring-slate-200/60 dark:ring-slate-800/60";

  const stripeClass =
    tone === "info"
      ? "bg-sky-400/60"
      : tone === "success"
        ? "bg-emerald-400/60"
        : tone === "warn"
          ? "bg-amber-400/70"
          : tone === "danger"
            ? "bg-rose-400/60"
            : "";

  const bodyPad = padded ? (dense ? "px-3 py-3" : "px-5 pt-4 pb-6") : "";

  return (
    <section
      id={id}
      className={[
        "group relative overflow-hidden  rounded-2xl",
        "panel-edge dark:border-slate-800/60",
        "bg-white/50 dark:bg-slate-900/50",
        "backdrop-blur-md supports-[backdrop-filter]:bg-white/50",
        "shadow-sm hover:shadow-md transition-shadow",
        className,
      ].join(" ")}
    >
      {busy && (
        <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden rounded-t-2xl">
          <div
            className="h-full w-[45%] animate-[mesh-indeterminate_1.6s_infinite_cubic-bezier(0.4,0,0.2,1)]
                       bg-[linear-gradient(90deg,theme(colors.indigo.400),theme(colors.fuchsia.400),theme(colors.sky.400))]"
          />
        </div>
      )}

      <div
        className={[
          "pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset",
          ringClass,
          "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity",
        ].join(" ")}
        aria-hidden
      />

      {tone !== "default" && (
        <div
          className={
            "pointer-events-none absolute left-0 top-0 h-10 w-1.5 rounded-tr-md " +
            stripeClass
          }
          aria-hidden
        />
      )}

      {(title || action || subtitle || icon) && (
        <div
          onMouseMove={(e) => {
            const t = e.currentTarget as HTMLElement;
            const r = t.getBoundingClientRect();
            t.style.setProperty('--mx', `${e.clientX - r.left}px`);
            t.style.setProperty('--my', `${e.clientY - r.top}px`);
          }}
          className={[
            stickyHeader ? "sticky top-0 z-10 -mx-px px-5 py-3" : "px-5 py-3",
            "flex items-center justify-between gap-3",
            "border-b border-slate-100/80 dark:border-slate-800/70",
            "bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm",
            "relative before:pointer-events-none before:absolute before:inset-0",
            "before:bg-[radial-gradient(120px_80px_at_var(--mx)_var(--my),rgba(99,102,241,0.10),transparent_70%)]",
            "before:opacity-0 hover:before:opacity-100 before:transition-opacity"
          ].join(" ")}
        >
          <div className="min-w-0 flex items-center gap-2">
            {icon && (
              <div className="grid size-6 shrink-0 place-items-center rounded-md bg-slate-100 dark:bg-slate-800">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="truncate text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className={bodyPad}>
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 w-3/5 rounded bg-slate-200/70 dark:bg-slate-700/60" />
            <div className="h-4 w-full rounded bg-slate-200/70 dark:bg-slate-700/60" />
            <div className="h-4 w-4/5 rounded bg-slate-200/70 dark:bg-slate-700/60" />
          </div>
        ) : emptyText ? (
          <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {emptyText}
          </div>
        ) : (
          children
        )}
      </div>

      {footer && (
        <div className="border-t border-slate-100/80 dark:border-slate-800/70 px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
          {footer}
        </div>
      )}
    </section>
  );
}

function ChipBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-md border-[.5px] border-indigo-200 bg-slate-50 px-1.5 py-1 text-xs">
      {children}
    </div>
  );
}

export default function DeepDivePanel({
  deliberationId,
  containerClassName,
  selectedClaimId,
  onClose,
  className,
}: {
  deliberationId: string;
  containerClassName?: string;
  className?: string;
  selectedClaimId?: string;
  onClose?: () => void;
}) {
  const { proId, oppId, trace, loading } = useCompileStep(deliberationId);

  const [sel, setSel] = useState<Selection | null>(null);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [tab, setTab] = useState<'debate' | 'models' | 'ludics' | 'issues'>('debate');
  const [confMode, setConfMode] = React.useState<'product' | 'min'>('product');
  const [rule, setRule] = useState<"utilitarian" | "harmonic" | "maxcov">("utilitarian");
  const { user } = useAuth();
  const authorId = user?.userId != null ? String(user.userId) : undefined;
  const [rhetoricSample, setRhetoricSample] = useState<string>('');
  const [replyTarget, setReplyTarget] = React.useState<{ id: string; preview?: string } | null>(null);
  const [cardFilter, setCardFilter] = useState<'all' | 'mine' | 'published'>('all');


  const ready = !loading && !!proId && !!oppId;

  const [diagramData, setDiagramData] = useState<AifSubgraph | null>(null);
  const [commandActions, setCommandActions] = useState<CommandCardAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Floating sheet state with persistence
  const [leftSheetOpen, setLeftSheetOpen] = useState(false);
  const [rightSheetOpen, setRightSheetOpen] = useState(false);
  const [leftSheetTab, setLeftSheetTab] = useState<'arguments' | 'claims'>('arguments');

  // at top of the component with the other state
const [issuesOpen, setIssuesOpen] = useState(false);
const [composerOpen, setComposerOpen] = useState(false);
const [issueTargetId, setIssueTargetId] = useState<string | null>(null);


  // Load sheet state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`dd:sheets:${deliberationId}`);
      if (saved) {
        const { left, right, leftTab } = JSON.parse(saved);
        setLeftSheetOpen(left ?? false);
        setRightSheetOpen(right ?? false);
        setLeftSheetTab(leftTab ?? 'arguments');
      }
    } catch (error) {
      console.error('Failed to load sheet state:', error);
    }
  }, [deliberationId]);

  // Save sheet state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        `dd:sheets:${deliberationId}`,
        JSON.stringify({
          left: leftSheetOpen,
          right: rightSheetOpen,
          leftTab: leftSheetTab,
        })
      );
    } catch (error) {
      console.error('Failed to save sheet state:', error);
    }
  }, [leftSheetOpen, rightSheetOpen, leftSheetTab, deliberationId]);

  const [selectedClaim, setSelectedClaim] = useState<{
    id: string;
    locusPath?: string | null;
  } | null>(selectedClaimId ? { id: selectedClaimId } : null);

  const handleNodeClick = (nodeId: string) => {
    handleClaimSelect(nodeId);
  };

  // Unified claim selection handler
  function handleClaimSelect(id: string, locusPath?: string | null) {
    setSelectedClaim({ id, locusPath: locusPath ?? null });

    // Scroll to the claim in the ArgumentsList
    requestAnimationFrame(() => {
      const element = document.getElementById(`row-${id}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // Derived values:
  const selectedNodeId = selectedClaim?.id;
  const hudTarget = selectedClaim ? {
    type: 'claim' as const,
    id: selectedClaim.id,
    locusPath: selectedClaim.locusPath
  } : null;

  // Use the existing useMinimapData hook instead of manual fetch
const { 
    nodes: minimapNodes, 
    edges: minimapEdges,
    loading: minimapLoading,
    error: minimapError 
  } = useMinimapData(deliberationId, {
    semantics: 'grounded',
    supportDefense: true,
    radius: 1,
    maxNodes: 400,
  });

   // Debug: Log when data changes
  useEffect(() => {
    console.log('Minimap data updated:', {
      nodes: minimapNodes?.length,
      edges: minimapEdges?.length,
      loading: minimapLoading,
      error: minimapError
    });
  }, [minimapNodes, minimapEdges, minimapLoading, minimapError]);


  // Fetch diagram data when node is selected
  useEffect(() => {
    if (!selectedNodeId) {
      setDiagramData(null);
      return;
    }

    async function fetchDiagramData() {
      setIsLoading(true);
      try {
        // First get the top argument for this claim
        const topArgResponse = await fetch(`/api/claims/${selectedNodeId}`);
        const topArgData = await topArgResponse.json();

        if (topArgData?.top?.id) {
          // Then fetch the AIF diagram for that argument
          const response = await fetch(`/api/arguments/${topArgData.top.id}?view=diagram`);
          const data = await response.json();
          setDiagramData(data.aif || data);
        } else {
          setDiagramData(null);
        }
      } catch (error) {
        console.error('Failed to fetch diagram data:', error);
        setDiagramData(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDiagramData();
  }, [selectedNodeId]);

  

  // Fetch available commands
//   useEffect(() => {
//     if (!selectedNodeId) return;

//     async function fetchCommands() {
//       try {
//         const response = await fetch(
//           `/api/dialogue/moves?deliberationId=${deliberationId}&targetId=${selectedNodeId}&targetType=claim`
//         );
//         const data = await response.json();
//         setCommandActions(data.items || []);
//       } catch (error) {
//         console.error('Failed to fetch commands:', error);
//       }
//     }

//     fetchCommands();
//   }, [deliberationId, selectedNodeId]);

  async function handleCommandPerform(action: CommandCardAction) {
    try {
      // Execute the command
      await performCommand(action);

      // Emit global refresh event first (fastest feedback)
      window.dispatchEvent(new CustomEvent('mesh:dialogue:refresh'));

      // Create parallel fetch promises for better performance
      const refreshPromises: Promise<any>[] = [];

      // Refresh diagram and commands if node is selected
      if (selectedNodeId) {
        setIsLoading(true);

        // Diagram data - fetch top argument first, then AIF
        refreshPromises.push(
          fetch(`/api/claims/${selectedNodeId}/top-argument`, { cache: 'no-store' })
            .then(res => res.json())
            .then(topArgData => {
              if (topArgData?.top?.id) {
                return fetch(`/api/arguments/${topArgData.top.id}?view=diagram`, { cache: 'no-store' })
                  .then(res => res.json())
                  .then(data => setDiagramData(data.aif || data));
              }
            })
            .catch(err => console.error('Failed to refresh diagram:', err))
        );

        // Available commands
        refreshPromises.push(
          fetch(`/api/dialogue/moves?deliberationId=${deliberationId}&targetId=${selectedNodeId}&targetType=claim`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => setCommandActions(data.items || []))
            .catch(err => console.error('Failed to refresh commands:', err))
        );
      }

      // Wait for all refreshes to complete
      await Promise.allSettled(refreshPromises);

      // Trigger SWR revalidation for any cached dialogue endpoints
      await swrMutate(
        (key: any) => typeof key === 'string' && (
          key.includes('/api/dialogue/') ||
          key.includes('/api/claims/') ||
          key.includes('/api/arguments/')
        ),
        undefined,
        { revalidate: true }
      );

      // If the action was a CLOSE or major state change, recompute viewpoints
      if (action.kind === 'CLOSE' || action.kind === 'RETRACT') {
        await compute(sel?.rule);
      }

    } catch (error) {
      console.error('Command execution failed:', error);

      // Show user-friendly error message
      const errorMessage = error instanceof Error
        ? error.message
        : 'An unexpected error occurred';

      alert(`Failed to execute ${action.label}: ${errorMessage}`);

    } finally {
      setIsLoading(false);
    }
  }

  // Progressive disclosure state hooks
  const diagnosticsState = usePersisted(`dd:diagnostics:${deliberationId}`, false);
  const worksState = usePersisted(`dd:works:${deliberationId}`, false);
  const aifArgsState = usePersisted(`dd:aifargs:${deliberationId}`, false);
  const schemeComposerState = usePersisted(`dd:scheme:${deliberationId}`, false);

  const compute = async (
    forcedRule?: "utilitarian" | "harmonic" | "maxcov",
    forcedK?: number
  ) => {
    setPending(true);
    try {
      const res = await fetch(
        `/api/deliberations/${deliberationId}/viewpoints/select`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rule: forcedRule ?? rule,
            k: forcedK ?? sel?.k ?? 3,
          }),
          cache: "no-store",
        }
      );
      if (!res.ok) {
        console.error("Viewpoints select failed", res.status);
        return;
      }
      const data = await res.json().catch(() => null);
      if (data?.selection) setSel(data.selection);
    } finally {
      setPending(false);
    }
  };

  useEffect(() => {
    fetch(
      `/api/content-status?targetType=deliberation&targetId=${deliberationId}`
    )
      .then((r) => r.json())
      .then((d) => setStatus(d.status))
      .catch(() => { });
  }, [deliberationId]);

  useEffect(() => { compute(); }, [deliberationId]);

  const ftch = (u: string) => fetch(u, { cache: 'no-store' }).then(r => r.json());

  // Fetch claim data directly (not top argument)
  const { data: claimData, error: claimError, isLoading: claimLoading } = useSWR(
    selectedNodeId ? `/api/claims/${encodeURIComponent(selectedNodeId)}` : null,
    ftch,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  // Fetch diagram only if we have a claim
  const { data: diag, error: diagError, isLoading: diagLoading } = useSWR(
    claimData?.topArgumentId ? `/api/arguments/${encodeURIComponent(claimData.topArgumentId)}?view=diagram` : null,
    ftch,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  // Debug logging
  useEffect(() => {
    console.log('Claim Data:', {
      selectedNodeId,
      loading: claimLoading,
      error: claimError,
      hasData: !!claimData,
      claimData,
    });
  }, [selectedNodeId, claimLoading, claimError, claimData]);


  const { data: topArg } = useSWR(
    hudTarget?.type === 'claim' ? `/api/claims/${encodeURIComponent(hudTarget.id)}/top-argument` : null,
    ftch
  );

//   const { data: diag } = useSWR(
//     topArg?.top?.id ? `/api/arguments/${encodeURIComponent(topArg.top.id)}?view=diagram` : null,
//     ftch
//   );

  useEffect(() => {
    const onSelect = (e: any) => {
      const { id, locusPath } = e?.detail || {};
      if (!id) return;
      handleClaimSelect(id, locusPath ?? null);
    };
    window.addEventListener('mesh:select-node', onSelect as any);
    return () => window.removeEventListener('mesh:select-node', onSelect as any);
  }, []);

  const targetRef = hudTarget
    ? { deliberationId, targetType: 'claim' as const, targetId: hudTarget.id, locusPath: hudTarget.locusPath }
    : null;

  const { data: legalMoves, error: legalMovesError, isLoading: legalMovesLoading } = useSWR(
    targetRef
      ? `/api/dialogue/legal-moves?deliberationId=${encodeURIComponent(deliberationId)}&targetType=claim&targetId=${encodeURIComponent(hudTarget!.id)}${hudTarget?.locusPath ? `&locusPath=${encodeURIComponent(hudTarget!.locusPath!)}` : ''}`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );


//   const cardActions = targetRef ? legalMovesToCommandCard(legalMoves?.moves ?? [], targetRef, true) : [];


  // ✅ Adapt the moves to CommandCardAction format using the NEWER movesToActions adapter
  const cardActions = useMemo(() => {
    if (!targetRef || !legalMoves?.moves) return [];
    return movesToActions(legalMoves.moves, targetRef);
  }, [targetRef, legalMoves]);

  // Count badges for toggle buttons - USE cardActions instead of commandActions
  const leftBadgeCount = useMemo(() => {
    let count = 0;
    if (selectedClaim?.id) count++;
    if (cardActions.length > 0) count++;
    return count;
  }, [selectedClaim, cardActions]);

  const rightBadgeCount = useMemo(() => {
    let count = 0;
    if (diag?.aif) count++;
    if (cardActions.length > 0) count++;
    return count;
  }, [diag, cardActions]);


  useEffect(() => {
    const onRefresh = () => {
      swrMutate((key: any) => typeof key === 'string' && key.startsWith('/api/dialogue/'), undefined, { revalidate: true });
    };
    window.addEventListener('mesh:dialogue:refresh', onRefresh);
    return () => window.removeEventListener('mesh:dialogue:refresh', onRefresh);
  }, []);

  function handleReplyTo(id: string, preview?: string) {
    setReplyTarget({ id, preview });
    requestAnimationFrame(() => {
      scrollIntoViewById("delib-composer-anchor", 80);
      window.dispatchEvent(new CustomEvent("mesh:composer:focus", { detail: { deliberationId } }));
    });
  }

//   // Count badges for toggle buttons
//   const leftBadgeCount = useMemo(() => {
//     let count = 0;
//     if (selectedClaim?.id) count++;
//     if (commandActions.length > 0) count++;
//     return count;
//   }, [selectedClaim, commandActions]);

//   const rightBadgeCount = useMemo(() => {
//     let count = 0;
//     if (diag?.aif) count++;
//     if (cardActions.length > 0) count++;
//     return count;
//   }, [diag, cardActions]);

  // Main content
  const inner = (
    <ConfidenceProvider>
      {/* Floating Toggle Buttons */}
      <SheetToggleButton
        side="left"
        open={leftSheetOpen}
        onClick={() => setLeftSheetOpen(!leftSheetOpen)}
        icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
        label="Explorer"
        badge={leftBadgeCount}
      />

      <SheetToggleButton
        side="right"
        open={rightSheetOpen}
        onClick={() => setRightSheetOpen(!rightSheetOpen)}
        icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
        label="Actions"
        badge={rightBadgeCount}
      />

      {/* Left Floating Sheet - Graph Explorer */}
      <FloatingSheet
        open={leftSheetOpen}
        onOpenChange={setLeftSheetOpen}
        side="left"
        width={1000}
        title="Graph Explorer"
        subtitle="Navigate argument structure"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        }
      >
        {/* Tab Selector */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setLeftSheetTab('arguments')}
            className={clsx(
              'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              leftSheetTab === 'arguments'
                ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Arguments
            </div>
          </button>
          <button
            onClick={() => setLeftSheetTab('claims')}
            className={clsx(
              'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              leftSheetTab === 'claims'
                ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Claims
            </div>
          </button>
        </div>

        {/* Tab Content */}
        {leftSheetTab === 'arguments' ? (
          <>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                Argument Flow Map (AIF)
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Interactive visualization of the structured argument network
              </p>
               {/* Loading State */}
              {minimapLoading ? (
                <div className="h-[320px] rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                    <div className="text-sm text-slate-600">Loading argument map...</div>
                  </div>
                </div>
              ) : minimapError ? (
                <div className="h-[320px] rounded-lg border border-red-200 bg-red-50 flex items-center justify-center">
                  <div className="text-center p-4">
                    <svg className="w-12 h-12 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="text-sm text-red-900 font-medium mb-1">Failed to load</div>
                    <div className="text-xs text-red-700">{String(minimapError)}</div>
                  </div>
                </div>
              ) : (!minimapNodes || minimapNodes.length === 0) ? (
                <div className="h-[320px] rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
                  <div className="text-center p-4">
                    <svg className="w-12 h-12 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <div className="text-sm text-slate-600 font-medium mb-1">No arguments yet</div>
                    <div className="text-xs text-slate-500">Start the debate to see the argument map</div>
                  </div>
                </div>
              ) : (
                <AFMinimap
                  nodes={minimapNodes}
                  edges={minimapEdges}
                  selectedId={selectedNodeId}
                  onSelectNode={(id, locusPath) => handleClaimSelect(id, locusPath)}
                  width={432}
                  height={320}
                />
              )}
            </div>

              {/* Command Card (if claim selected) */}
              {/* Dialogical Actions */}
        <div className="mb-6 w-full">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Dialogical Actions
          </h3>
          {hudTarget ? (
            <div className="space-y-3">
              {/* Selected Target Info */}
              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                <div className="text-xs font-medium text-indigo-900 mb-1">Selected Target</div>
                <div className="text-xs text-indigo-700">
                  {hudTarget.type === "claim" ? "Claim" : "Argument"}: {hudTarget.id.slice(0, 12)}...
                </div>
              </div>
              
              {/* Dialogue Actions Button */}
              <DialogueActionsButton
                deliberationId={deliberationId}
                targetType={hudTarget.type as any}
                targetId={hudTarget.id}
                locusPath="0"
                label="Open Dialogue Actions"
                variant="default"
                className="w-fit px-8 justify-center"
                onMovePerformed={() => {
                  // Refresh the graph and moves
                  swrMutate(`/api/dialogue/legal-moves?deliberationId=${deliberationId}&targetType=${hudTarget.type}&targetId=${hudTarget.id}&locus=0`);
                  window.dispatchEvent(new CustomEvent("dialogue:moves:refresh", { detail: { deliberationId } }));
                }}
              />
              
              {/* Legacy CommandCard - Keep for comparison */}
              <details className="group">
                <summary className="cursor-pointer text-xs text-slate-600 hover:text-slate-900 font-medium">
                  Show Legacy Grid View
                </summary>
                <div className="mt-3">
                  {cardActions.length > 0 ? (
                    <CommandCard
                      actions={cardActions}
                      onPerform={performCommand}
                    />
                  ) : (
                    <div className="text-xs text-slate-500 text-center py-4">
                      No actions available
                    </div>
                  )}
                </div>
              </details>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <div className="text-sm text-slate-600 font-medium mb-1">
                No claim selected
              </div>
              <div className="text-xs text-slate-500">
                Click a claim in the graph or debate to see available actions
              </div>
            </div>
          )}
        </div>

          </>
        ) : (
          <>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                Claim Graph (CEG)
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Dialectical structure with grounded semantics
              </p>
                           <div className="rounded-lg overflow-hidden">
                <CegMiniMap
                  deliberationId={deliberationId}
                  selectedClaimId={selectedClaim?.id}
                  onSelectClaim={handleClaimSelect}
                  width={800}
                  height={320}
                  
                  viewMode="graph"
                />
              </div>

            </div>
          </>
        )}

          {/* Selected Claim Info */}
        {/* Selected Claim Info - FIXED VERSION */}
          {selectedClaim?.id && (
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Selected Claim
            </h3>
            
            {claimLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                <span>Loading claim...</span>
              </div>
            ) : claimError ? (
              <div className="text-sm text-red-600">
                Error: {String(claimError)}
              </div>
            ) : claimData ? (
              <>
                {/* Claim Text */}
                <div className="text-sm text-slate-700 mb-3 leading-relaxed">
                  {claimData.text}
                </div>

                {/* Claim Metadata */}
                <div className="space-y-2 text-xs">
                  {/* Status Badge */}
                  {claimData.label && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Status:</span>
                      <span className={clsx(
                        'px-2 py-0.5 rounded-full font-medium',
                        claimData.label === 'IN' && 'bg-green-100 text-green-700',
                        claimData.label === 'OUT' && 'bg-red-100 text-red-700',
                        claimData.label === 'UNDEC' && 'bg-gray-100 text-gray-700'
                      )}>
                        {claimData.label}
                      </span>
                    </div>
                  )}

                  {/* Confidence */}
                  {claimData.confidence != null && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Confidence:</span>
                      <div className="flex items-center gap-1">
                        <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${claimData.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-slate-700 font-medium">
                          {(claimData.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                    {claimData._count?.supports != null && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-slate-600">{claimData._count.supports} support</span>
                      </div>
                    )}
                    {claimData._count?.rebuttals != null && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-slate-600">{claimData._count.rebuttals} attack</span>
                      </div>
                    )}
                  </div>

                  {/* ID */}
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-slate-400">ID:</span>
                    <code className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {selectedClaim.id.slice(0, 12)}...
                    </code>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-500">
                No claim selected
              </div>
            )}
          </div>
        )}
      </FloatingSheet>

      {/* Right Floating Sheet - Actions & Diagram */}
      <FloatingSheet
        open={rightSheetOpen}
        onOpenChange={setRightSheetOpen}
        side="right"
        width={520}
        title="Actions & Diagram"
        subtitle={hudTarget ? 'Available moves' : 'Select a claim'}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
      >
        {/* Dialogical Actions */}
        <div className="mb-6 w-full">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Dialogical Actions
          </h3>
          {hudTarget ? (
            <div className="space-y-3">
              {/* Selected Target Info */}
              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                <div className="text-xs font-medium text-indigo-900 mb-1">Selected Target</div>
                <div className="text-xs text-indigo-700">
                  {hudTarget.type === "claim" ? "Claim" : "Argument"}: {hudTarget.id.slice(0, 12)}...
                </div>
              </div>
              
              {/* Dialogue Actions Button */}
              <DialogueActionsButton
                deliberationId={deliberationId}
                targetType={hudTarget.type as any}
                targetId={hudTarget.id}
                locusPath="0"
                label="Open Dialogue Actions"
                variant="default"
                className="w-full justify-center"
                onMovePerformed={() => {
                  // Refresh the graph and moves
                  swrMutate(`/api/dialogue/legal-moves?deliberationId=${deliberationId}&targetType=${hudTarget.type}&targetId=${hudTarget.id}&locus=0`);
                  window.dispatchEvent(new CustomEvent("dialogue:moves:refresh", { detail: { deliberationId } }));
                }}
              />
              
              {/* Legacy CommandCard - Keep for comparison */}
              <details className="group">
                <summary className="cursor-pointer text-xs text-slate-600 hover:text-slate-900 font-medium">
                  Show Legacy Grid View
                </summary>
                <div className="mt-3">
                  {cardActions.length > 0 ? (
                    <CommandCard
                      actions={cardActions}
                      onPerform={performCommand}
                    />
                  ) : (
                    <div className="text-xs text-slate-500 text-center py-4">
                      No actions available
                    </div>
                  )}
                </div>
              </details>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <div className="text-sm text-slate-600 font-medium mb-1">
                No claim selected
              </div>
              <div className="text-xs text-slate-500">
                Click a claim in the graph or debate to see available actions
              </div>
            </div>
          )}
        </div>

        {/* Diagram Viewer */}
         {/* Diagram Viewer - UPDATED */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            AIF Structure Diagram
          </h3>
          
          {claimLoading ? (
            <div className="h-[500px] rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                <div className="text-sm text-slate-600">Loading claim...</div>
              </div>
            </div>
          ) : claimError ? (
            <div className="h-[500px] rounded-xl border border-red-200 bg-red-50 flex items-center justify-center">
              <div className="text-center p-4">
                <svg className="w-12 h-12 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-sm text-red-900 font-medium mb-1">Failed to load</div>
                <div className="text-xs text-red-700">{String(claimError)}</div>
              </div>
            </div>
          ) : !claimData?.topArgumentId ? (
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-sm text-slate-600 font-medium mb-1">
                No structured argument
              </div>
              <div className="text-xs text-slate-500">
                This claim doesn&apos;t have an AIF diagram yet
              </div>
            </div>
          ) : diagLoading ? (
            <div className="h-[500px] rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                <div className="text-sm text-slate-600">Loading diagram...</div>
              </div>
            </div>
          ) : diagError ? (
            <div className="h-[500px] rounded-xl border border-red-200 bg-red-50 flex items-center justify-center">
              <div className="text-center p-4">
                <svg className="w-12 h-12 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-sm text-red-900 font-medium mb-1">Failed to load diagram</div>
                <div className="text-xs text-red-700">{String(diagError)}</div>
              </div>
            </div>
          ) : diag?.aif ? (
            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
              <DiagramViewer
                graph={diag.aif}
                selectedNodeId={selectedClaim?.id}
                onNodeClick={handleNodeClick}
                height={500}
              />

              {/* Diagram Legend */}
              <div className="bg-slate-50 px-4 py-3 border-t border-slate-200">
                <div className="flex flex-wrap gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-slate-500" />
                    <span className="text-slate-600">Premise</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-emerald-600" />
                    <span className="text-slate-600">Conclusion</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-red-500" />
                    <span className="text-slate-600">Conflict</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-violet-500 border-dashed border-t-2" />
                    <span className="text-slate-600">Preference</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-xs text-slate-500">
                Select a claim to view its argument diagram
              </div>
            </div>
          )}
        </div>
      </FloatingSheet>

      {/* Main Content - Full Width, No Columns */}
      <div className="w-full px-4 py-6 max-w-7xl mx-auto space-y-4">
        {/* Sticky Header */}
        <StickyHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {status && <StatusChip status={status} />}

              <ChipBar>
                <label className="text-xs text-neutral-600 flex items-center gap-1">
                  Rule:
                  <select
                    className="text-xs menuv2--lite rounded px-2 py-0.5"
                    value={rule}
                    onChange={(e) => {
                      setRule(e.target.value as any);
                      compute(e.target.value as any);
                    }}
                  >
                    <option value="utilitarian">Utilitarian</option>
                    <option value="harmonic">Harmonic</option>
                    <option value="maxcov">MaxCov</option>
                  </select>
                </label>
              </ChipBar>

              <ChipBar>
                <label className="text-xs text-neutral-600 flex items-center gap-1">
                  Confidence:
                  <select
                    className="text-xs menuv2--lite rounded px-2 py-0.5"
                    value={confMode}
                    onChange={(e) => setConfMode(e.target.value as any)}
                  >
                    <option value="product">Product</option>
                    <option value="min">Min</option>
                  </select>
                </label>
              </ChipBar>
            </div>

            <div className="flex gap-2">
              <DiscusHelpPage />
              {pending && <div className="text-xs text-neutral-500">Computing…</div>}
            </div>
          </div>
        </StickyHeader>

        {/* Main Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="w-full">
            <TabsTrigger value="debate">Debate</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="ludics">Ludics</TabsTrigger>
            {/* <TabsTrigger value="cards">Cards</TabsTrigger> */}
            <TabsTrigger value="issues">Issues</TabsTrigger>
          </TabsList>

          {/* DEBATE TAB */}
          <TabsContent value="debate" className="w-full min-w-0 mt-4 space-y-4">
            <SectionCard title="Compose Proposition">
              {/* <PropositionComposer deliberationId={deliberationId} /> */}
              <PropositionComposerPro deliberationId={deliberationId} />
            </SectionCard>
<DialogueInspector
  deliberationId="cmgy6c8vz0000c04w4l9khiux"
  initialTargetType="claim"
  initialTargetId="cmgzyuusc000ec0leqk4cf26g"
  initialLocusPath="0"
/>
            <SectionCard>
              <PropositionsList deliberationId={deliberationId} />
            </SectionCard>

            <SectionCard >
              <ClaimMiniMap
                deliberationId={deliberationId}
                selectedClaimId={selectedClaim?.id}
                onClaimClick={handleClaimSelect}
              />
            </SectionCard>

            <SectionCard title="Arguments">
              <ArgumentsList
                deliberationId={deliberationId}
                selectedClaimId={selectedClaim?.id}
                onClaimClick={handleClaimSelect}
                onVisibleTextsChanged={(texts) => setRhetoricSample(texts.join(' '))}
                onReplyTo={handleReplyTo}
                onChanged={() => compute(sel?.rule)}
              />
            </SectionCard>

            <SectionCard title="Compose Reply">
              <DeliberationComposer
                id="delib-composer-anchor"
                deliberationId={deliberationId}
                isReplyMode={!!replyTarget}
                targetArgumentId={replyTarget?.id}
                targetPreviewText={replyTarget?.preview}
                onClearReply={() => setReplyTarget(null)}
                onPosted={() => {
                  setReplyTarget(null);
                  compute(sel?.rule);
                }}
              />
            </SectionCard>
          </TabsContent>

          {/* MODELS TAB */}
          <TabsContent value="models" className="w-full min-w-0 space-y-4 mt-4">
            {/* <SectionCard title="Representative Viewpoints">
              <RepresentativeViewpoints
                selection={sel}
                onReselect={(nextRule, nextK) => compute(nextRule, nextK)}
              />
            </SectionCard> */}

            {/* <SectionCard>
              <Collapsible open={worksState.open} onOpenChange={worksState.setOpen}>
                <CollapsibleTrigger className="w-full text-left px-3 py-2 text-sm font-semibold hover:bg-slate-50 rounded flex items-center justify-between">
                  <span>{worksState.open ? "▼" : "▶"} Theoretical Models</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <WorksCounts deliberationId={deliberationId} />
                  </div>
                  <WorksList deliberationId={deliberationId} currentUserId={authorId} />
                </CollapsibleContent>
              </Collapsible>
            </SectionCard> */}

            {/* <SectionCard title="Scheme Composer" className="w-full"> */}
            <div className="flex flex-1 min-w-0 min-h-0  max-h-screen w-full h-full">
<AIFAuthoringPanel
  deliberationId={deliberationId}
  authorId={authorId || ''} // or 'current' if you enable server fallback
  conclusionClaim={hudTarget?.id
    ? { id: hudTarget.id, text: topArg?.top?.text ?? '' }
    : { id: '', text: '' } // panel will prompt to choose
  }

/>
</div>
  {/* </SectionCard> */}
            <SectionCard title="AIF Arguments" className=" w-[1200px]" padded={false}>
              <AIFArgumentsListPro
                deliberationId={deliberationId}
                onVisibleTextsChanged={(texts) => {
                  window.dispatchEvent(new CustomEvent('mesh:texts:visible', { detail: { deliberationId, texts } }));
                }}
              />
              <span className="block p-3 text-xs text-neutral-500">
                Note: This list shows all structured arguments in the deliberation&apos;s AIF database. Some arguments may not yet be linked to claims in the debate.
              </span>
            </SectionCard>

   <SectionCard className="w-full">
              <Collapsible open={diagnosticsState.open} onOpenChange={diagnosticsState.setOpen}>
                <CollapsibleTrigger className="w-full text-left px-3 py-2 text-sm font-semibold hover:bg-slate-50 rounded flex items-center justify-between">
                  <span>{diagnosticsState.open ? "▼" : "▶"} Diagnostics</span>
                  <span className="text-xs text-neutral-500">Heat maps & topology</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-3">
                  <ApprovalsHeatStrip deliberationId={deliberationId} />
                  <TopologyWidget deliberationId={deliberationId} />
                </CollapsibleContent>
              </Collapsible>
            </SectionCard>
            {/* <SectionCard>
              <Collapsible open={schemeComposerState.open} onOpenChange={schemeComposerState.setOpen}>
                <CollapsibleTrigger className="w-full text-left px-3 py-2 text-sm font-semibold hover:bg-slate-50 rounded flex items-center justify-between">
                  <span>{schemeComposerState.open ? "▼" : "▶"} Scheme Composer</span>
                  <span className="text-xs text-neutral-500">Build structured arguments</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <AIFAuthoringPanel
                    deliberationId={deliberationId}
                    authorId={authorId || ''}
                    conclusionClaim={hudTarget?.id
                      ? { id: hudTarget.id, text: topArg?.top?.text ?? '' }
                      : { id: '', text: '' }
                    }
                  />
                </CollapsibleContent>
              </Collapsible>
            </SectionCard> */}
          </TabsContent>

          {/* LUDICS TAB */}
          <TabsContent value="ludics" className="w-full min-w-0 space-y-4">
            {proId && oppId ? (
              <>
                <SectionCard title="Ludics Panel">
                  <LudicsPanel
                    deliberationId={deliberationId}
                    proDesignId={proId}
                    oppDesignId={oppId}
                  />
                </SectionCard>
                <SectionCard title="Behaviour Inspector">
                  <BehaviourInspectorCard deliberationId={deliberationId} />
                </SectionCard>
              </>
            ) : (
              <SectionCard emptyText="Preparing designs…">
                <div className="text-sm text-neutral-600">Loading...</div>
              </SectionCard>
            )}
          </TabsContent>

          {/* CARDS TAB
          <TabsContent value="cards" className="space-y-4">
            <SectionCard
              title="Cards"
              action={
                <div className="flex gap-2">
                  <button
                    className={clsx("px-3 py-1 text-xs rounded", cardFilter === 'all' ? "bg-slate-200" : "bg-slate-100")}
                    onClick={() => setCardFilter('all')}
                  >
                    All
                  </button>
                  <button
                    className={clsx("px-3 py-1 text-xs rounded", cardFilter === 'mine' ? "bg-slate-200" : "bg-slate-100")}
                    onClick={() => setCardFilter('mine')}
                  >
                    Mine
                  </button>
                  <button
                    className={clsx("px-3 py-1 text-xs rounded", cardFilter === 'published' ? "bg-slate-200" : "bg-slate-100")}
                    onClick={() => setCardFilter('published')}
                  >
                    Published
                  </button>
                </div>
              }
            >
              {cardFilter === 'all' && (
                <CardListVirtuoso
                  deliberationId={deliberationId}
                  filters={{
                    status: 'published',
                    authorId,
                    since: '2025-08-01T00:00:00Z',
                    sort: 'createdAt:desc',
                  }}
                />
              )}
              {cardFilter === 'mine' && (
                <CardListVirtuoso
                  deliberationId={deliberationId}
                  filters={{
                    authorId,
                    sort: 'createdAt:desc',
                  }}
                />
              )}
              {cardFilter === 'published' && (
                <CardListVirtuoso
                  deliberationId={deliberationId}
                  filters={{
                    status: 'published',
                    sort: 'createdAt:desc',
                  }}
                />
              )}
            </SectionCard>

            <SectionCard title="Create Card">
              <CardComposerTab deliberationId={deliberationId} />
            </SectionCard>
          </TabsContent> */}

          {/* ISSUES TAB */}
          <TabsContent value="issues" className="w-full min-w-0 h-screen space-y-4">
            <SectionCard
              title="Issues & Objections"
              action={
                <button
                  className="px-3 py-2 btnv2 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg"
                  onClick={() => {
                    setIssueTargetId(null);
                    setComposerOpen(true);
                  }}
                >
                  New Issue
                </button>
              }
            >
              <div className="text-sm text-neutral-600 mb-3">
                Track formal objections and disputes about contributions
              </div>
       {/* <button
  className="w-full px-4 py-3 text-left border rounded-lg  hover:bg-slate-50"
  onClick={() => setIssuesOpen(true)}
>
  <div className="font-medium text-sm">View All Issues</div>
  <div className="text-xs text-neutral-500 mt-1">
    See objections, ambiguities, and formal challenges
  </div>
</button> */}
<div className="flex w-full">
<IssuesList
    deliberationId={deliberationId}

  />
  </div>
{/* 
       <IssuesDrawer
  deliberationId={deliberationId}
  open={issuesOpen}
  onOpenChange={setIssuesOpen}
  argumentId={issueTargetId ?? undefined}
/> */}

<IssueComposer
  deliberationId={deliberationId}
  initialArgumentId={issueTargetId ?? undefined}
 open={composerOpen}
 onOpenChange={setComposerOpen}
  onCreated={() => {
   setComposerOpen(false);
    window.dispatchEvent(new CustomEvent('issues:refresh', { detail: { deliberationId } }));
  }}
/>
            </SectionCard>
          </TabsContent>
        </Tabs>
      </div>
    </ConfidenceProvider>
  );

  const placeholder = (
    <div className="text-xs text-neutral-500 px-4 py-2">
      {loading ? 'Loading…' : 'No designs found'}
    </div>
  );

  const content = ready ? inner : placeholder;

  return containerClassName
    ? <div className={clsx(containerClassName)}>{content}</div>
    : content;
}