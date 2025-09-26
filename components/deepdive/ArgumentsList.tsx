"use client";
import { useMemo, useState, useEffect } from "react";
import useSWRInfinite from "swr/infinite";
import useSWR from "swr";
import { Virtuoso } from "react-virtuoso";
import PromoteToClaimButton from "../claims/PromoteToClaimButton";
import CitePickerInline from "@/components/citations/CitePickerInline";
import { SkeletonLines } from "@/components/ui/SkeletonB";
import React from "react";
import RhetoricText from "../rhetoric/RhetoricText";
import StyleDensityBadge from "@/components/rhetoric/StyleDensityBadge";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Hit } from "../rhetoric/detectors";
import SaveHighlights from "../rhetoric/SaveHighlights";
import EmotionBadge from "@/components/rhetoric/EmotionBadge";
import FrameChips from "@/components/rhetoric/FrameChips";
import { analyzeLexiconsMany } from "../rhetoric/lexiconAnalyzers";
import CitePickerInlinePro from "@/components/citations/CitePickerInlinePro";
import CitePickerModal from "@/components/citations/CitePickerModal";

import { DecisionBanner } from "../decision/DecisionBanner";
// import CitePickerInline from "@/components/citations/CitePickerInline";

// Mini-ML
import { useRhetoric } from "@/components/rhetoric/RhetoricContext";
import { analyzeText } from "@/components/rhetoric/detectors";
import { featuresFromPipeline, predictMix } from "@/lib/rhetoric/mlMini";
import { MixBadge } from "@/components/rhetoric/MixBadge";

import { SourceQualityBadge } from "../rhetoric/SourceQualityBadge";
import { FallacyBadge } from "../rhetoric/FallacyBadge";
import MethodChip from "@/components/rhetoric/MethodChip";

import DialogueMoves from "@/components/dialogue/DialogueMoves";
import AnchorToMapButton from "../map/AnchorToMapButton";
import MiniStructureBox from "../rhetoric/MiniStructureBox";
import DialogicalPanel from "@/components/dialogue/DialogicalPanel";
import NegotiationDrawerV2 from "@/components/map/NegotiationDrawerV2";
import { useDeliberationAF } from "../dialogue/useGraphAF";
import { ToulminBox } from "../monological/ToulminBox";
import { QuantifierModalityPicker } from "../monological/QuantifierModalityPicker";

import { LegalMoveChips } from "../dialogue/LegalMoveChips";
import { useLudicsPhase } from '@/components/dialogue/useLudicsPhase';


// Dialectic + RSA
import { useDialecticStats } from "@/packages/hooks/useDialecticStats";
import { DialBadge } from "@/packages/components/DialBadge";
import { RSAChip } from "@/packages/components/RSAChip";
import { useRSABatch } from "@/packages/hooks/useRSABatch";
import IssuesDrawer from "@/components/issues/IssuesDrawer";
import { IssueBadge } from "@/components/issues/IssueBadge";

import IssueComposer from "@/components/issues/IssueComposer";

import { LudicsBadge } from "@/components/dialogue/LudicsBadge";
import { InlineMoveForm } from "@/components/dialogue/InlineMoveForm";
import MonologicalToolbar from "@/components/monological/MonologicalToolbar";
import { useAuth } from "@/lib/AuthContext";

import { useDialogueTarget } from '@/components/dialogue/DialogueTargetContext';


const PAGE = 20;
const fetcher = (u: string) =>
  fetch(u, { cache: "no-store" }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

type Arg = {
  id: string;
  text: string;
  confidence?: number | null;
  createdAt: string;
  authorId: string;
  mediaUrl?: string | null;
  claimId?: string | null;
  quantifier?: "SOME" | "MANY" | "MOST" | "ALL" | null;
  modality?: "COULD" | "LIKELY" | "NECESSARY" | null;
  mediaType?: "text" | "image" | "video" | "audio" | null;
  edgesOut?: Array<{
    type: "rebut" | "undercut";
    targetScope?: "premise" | "inference" | "conclusion";
  }>;
  approvedByUser?: boolean;
};

function ChipBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-md border border-slate-200 bg-slate-100/70 px-[.72rem ] py-[.36rem] text-xs">
      {children}
    </div>
  );
}

function ClampedBody({
  text,
  lines = 4,
  onMore,
}: { text: string; lines?: number; onMore: () => void }) {
  return (
    <div className="relative">
      <div className="text-sm whitespace-pre-wrap line-clamp-4">{text}</div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/90 to-transparent dark:from-slate-900/80" />
      <button className="btnv2--ghost py-0 px-6 rounded btnv2--sm absolute right-0 bottom-0 translate-y-1 translate-x-2"
              onClick={onMore}>
        More
      </button>
    </div>
  );
}

function RowLexSnapshot({ text }: { text: string }) {
  const { liwcCounts, topFrames } = React.useMemo(
    () => analyzeLexiconsMany([text]),
    [text]
  );
  return (
    <span className="text-[10px] text-neutral-600 ml-2">
      certainty {liwcCounts.certainty} · tentative {liwcCounts.tentative} · neg{" "}
      {liwcCounts.negation}
      {topFrames.length ? (
        <> · frames {topFrames.map((f) => f.key).join("/")}</>
      ) : null}
    </span>
  );
}

export default function ArgumentsList({
  deliberationId,
  onReplyTo,
  onChanged,
  onVisibleTextsChanged,
}: {
  deliberationId: string;
  onReplyTo: (id: string) => void;
  onChanged?: () => void;
  onVisibleTextsChanged?: (texts: string[]) => void;
}) {
  const [clusterId, setClusterId] = useState<string | undefined>(undefined);
  const { modelLens } = useRhetoric();
  const [negOpen, setNegOpen] = useState(false);
  const [listExpanded, setListExpanded] = useState(false);
  const [issuesOpen, setIssuesOpen] = useState(false);

    const [composerOpen, setComposerOpen] = useState(false);
  const [issueTargetId, setIssueTargetId] = useState<string | null>(null);
  const [issueInitialLabel, setIssueInitialLabel] = useState<string>('');

const [issueDrawerTargetId, setIssueDrawerTargetId] = useState<string | null>(null);

function openIssuesFor(argumentId: string) {
  setIssueDrawerTargetId(argumentId);
  setIssuesOpen(true);
}

  const handleOpenDispute = (argumentId: string, label: string) => {
    setIssueTargetId(argumentId);
    setIssueInitialLabel(label || '');
    setComposerOpen(true);
 };


 useEffect(() => {
  const handler = (ev: any) => {
    if (ev?.detail?.deliberationId !== deliberationId) return;
    setIssueDrawerTargetId(ev.detail.argumentId ?? null);
    setIssuesOpen(true);
  };
  window.addEventListener('issues:open', handler);
  return () => window.removeEventListener('issues:open', handler);
}, [deliberationId]);

<IssuesDrawer
  deliberationId={deliberationId}
  open={issuesOpen}
  onOpenChange={(o)=>{ setIssuesOpen(o); if (!o) setIssueDrawerTargetId(null); }}
  argumentId={issueDrawerTargetId ?? undefined}  // Drawer can treat as a filter
/>

  useEffect(() => {
    const handler = (ev: any) => {
      if (ev?.detail?.deliberationId !== deliberationId) return;
      const ids: string[] =
        ev.detail.clusterIds ||
        (ev.detail.clusterId ? [ev.detail.clusterId] : []);
      setClusterId(ids[0]);
      const el = document.getElementById("arguments-top");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    };
    window.addEventListener("mesh:list:filterCluster", handler as any);
    return () =>
      window.removeEventListener("mesh:list:filterCluster", handler as any);
  }, [deliberationId]);

  const getKey = (index: number, prev: any) => {
    if (prev && !prev.nextCursor) return null;
    const cursor = index === 0 ? "" : `&cursor=${prev.nextCursor}`;
    const clusterQ = clusterId
      ? `&clusterId=${encodeURIComponent(clusterId)}`
      : "";
    return `/api/deliberations/${deliberationId}/arguments?limit=${PAGE}${cursor}&sort=createdAt:desc${clusterQ}`;
  };

  const { data, size, setSize, isValidating, error, mutate } = useSWRInfinite(
    getKey,
    fetcher,
    {
          revalidateFirstPage: false,
          keepPreviousData: true,
          dedupingInterval: 1500,
          revalidateOnFocus: false,
    }
  );

  // Compute items FIRST so downstream hooks can depend on it
  const items: Arg[] = useMemo(
    () => (data ?? []).flatMap((d) => d.items),
    [data]
  );

  // AF slice for dialogical lens
  const { nodes, edges } = useDeliberationAF(deliberationId);

  // Claim IDs for work mapping
  const claimIds = useMemo(() => {
    const set = new Set<string>();
    for (const a of items) if (a.claimId) set.add(a.claimId);
    return Array.from(set);
  }, [items]);

  // Map claimId -> { workId, title }
  const [workByClaimId, setWorkByClaimId] = useState<
    Record<string, { workId: string; title: string } | undefined>
  >({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!claimIds.length) {
        setWorkByClaimId({});
        return;
      }
      // 1) fetch claim citations
      const qs = encodeURIComponent(claimIds.join(","));
      const res = await fetch(`/api/claim-citations?claimIds=${qs}`);
      if (!res.ok) return;
      const json = (await res.json()) as {
        ok: boolean;
        citations: Record<string, string[]>;
      };
      if (!json.ok) return;

      // 2) detect workIds from citation URIs
      const workIdFromUri = (u: string) => {
        const m = u.match(/^\/works\/([^#?\/]+)/);
        return m?.[1];
      };

      const map: Record<string, { workId: string; title: string } | undefined> =
        {};
      const workIds = new Set<string>();
      for (const [cid, uris] of Object.entries(json.citations)) {
        const wid = uris?.map(workIdFromUri).find(Boolean);
        if (wid) {
          map[cid] = { workId: wid!, title: "" };
          workIds.add(wid!);
        }
      }

      if (!workIds.size) {
        if (!cancelled) setWorkByClaimId(map);
        return;
      }

      // 3) hydrate titles
      const idsQS = encodeURIComponent(Array.from(workIds).join(","));
      const resp = await fetch(`/api/works/by-ids?ids=${idsQS}`);
      if (!resp.ok) {
        if (!cancelled) setWorkByClaimId(map);
        return;
      }
      const j = (await resp.json()) as {
        ok: boolean;
        works: { id: string; title: string }[];
      };
      const titleById = Object.fromEntries(
        (j.works ?? []).map((w) => [w.id, w.title])
      );
      for (const cid of Object.keys(map)) {
        const wid = map[cid]!.workId;
        map[cid]!.title = titleById[wid] ?? "Work";
      }
      if (!cancelled) setWorkByClaimId(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [claimIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // RSA (batch for first ~20) + Dialectic stats once
  const argTargets = React.useMemo(() => {
    const ids = (items ?? []).slice(0, 20).map((a) => `argument:${a.id}`);
    return Array.from(new Set(ids));
  }, [items]);

  const { byTarget: rsaByTarget } = useRSABatch({
    deliberationId,
    targets: argTargets,
  });
  const { stats: dialStats } = useDialecticStats(deliberationId);

  const titlesByTarget = useMemo(
    () =>
      Object.fromEntries(items.map((a) => [a.id, (a.text || "").slice(0, 80)])),
    [items]
  );

  const { liwcCounts } = useMemo(
    () => analyzeLexiconsMany(items.slice(0, 10).map((a) => a.text || "")),
    [items]
  );

  useEffect(() => {
    onVisibleTextsChanged?.(items.slice(0, 40).map((a) => a.text || ""));
  }, [items, onVisibleTextsChanged]);

     // Allow rows to request opening the negotiation drawer
   useEffect(() => {
     const h = (e: any) => {
       if (e?.detail?.deliberationId !== deliberationId) return;
       setNegOpen(true);
     };
     window.addEventListener('ludics:open', h);
     return () => window.removeEventListener('ludics:open', h);
  }, [deliberationId]);

  const nextCursor = data?.[data.length - 1]?.nextCursor ?? null;

  const approve = async (id: string, approve: boolean) => {
    try {
      const res = await fetch(`/api/deliberations/${deliberationId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ argumentId: id, approve }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onChanged?.();
      mutate();
    } catch (e) {
      console.error("approve failed", e);
    }
  };

  if (!data && isValidating) {
    return (
      <div className="rounded-md border p-3 space-y-2">
        <div className="text-md font-medium">Arguments</div>
        <div className="p-2 border rounded">
          <SkeletonLines lines={3} />
        </div>
        <div className="p-2 border rounded">
          <SkeletonLines lines={3} />
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-md border p-3 space-y-2">
        <div className="text-md font-medium">Arguments</div>
        <div className="text-xs text-rose-600">
          {String(error?.message || "Failed to load")}
        </div>
        <button className="text-xs underline" onClick={() => mutate()}>
          Retry
        </button>
      </div>
    );
  }
  if (!items.length) {
    return (
      <div className="rounded-md border p-3 space-y-2">
        <div className="text-md font-medium">Arguments</div>
        <div className="text-xs text-neutral-600">
          No arguments yet — start by adding your <b>Point</b> and optional{" "}
          <b>Sources</b>.
        </div>
      </div>
    );
  }

  const virtuosoOverflowClass = listExpanded
    ? "overflow-y-auto"
    : "overflow-y-hidden";

  return (
    <div
      id="arguments-top"
      className="relative z-10 w-full px-2 rounded-xl pt-1 mt-3 pb-3 mb-1 panel-edge"
    >
      <div className="px-3 py-2.5 text-md font-medium flex items-center justify-between">
        <span>Arguments</span>
        <button
          type="button"
          className="relative max-w-[300px] w-full justify-center items-center text-center mx-auto px-4 py-2.5 
                     text-[11px] tracking-wider rounded-full lockbutton"
          onClick={() => setListExpanded((v) => !v)}
          aria-expanded={listExpanded}
        >
          {listExpanded ? "Lock Scrolling" : "Enable Scrolling"}
        </button>
        <button
          className="px-4 py-2 text-[11px] btnv2  rounded-full"
          onClick={() => { setIssueDrawerTargetId(null); setIssuesOpen(true); }}

        >
          Issues
        </button>

        <IssuesDrawer
          deliberationId={deliberationId}
          open={issuesOpen}
          onOpenChange={setIssuesOpen}
          argumentId={issueDrawerTargetId ?? undefined}  // 👈 new prop

        />
        <IssueComposer
    deliberationId={deliberationId}
    initialArgumentId={issueTargetId ?? undefined}
    initialLabel={issueInitialLabel || undefined}
    open={composerOpen}
    onOpenChange={setComposerOpen}
    onCreated={() => {
      window.dispatchEvent(new CustomEvent('issues:refresh', { detail: { deliberationId } }));
    }}
  />
      </div>
      <div className="inline-flex gap-2">
        <StyleDensityBadge
          texts={items.slice(0, 10).map((a) => a.text || "")}
        />
        <EmotionBadge texts={items.slice(0, 10).map((a) => a.text || "")} />
        <FrameChips texts={items.slice(0, 10).map((a) => a.text || "")} />
      </div>
      <span className="ml-2 text-[11px] text-neutral-500">
        · Model: {modelLens}
      </span>
        {modelLens === 'monological' && (
    <DelibMixBadge deliberationId={deliberationId} />
  )}

      {liwcCounts && (
        <span className="ml-2 text-[11px] text-neutral-600">
          · certainty {liwcCounts.certainty} · tentative {liwcCounts.tentative}{" "}
          · negation {liwcCounts.negation}
        </span>
      )}

      <div className="rounded-md border py-1">
        {modelLens === "dialogical" && (
          <>
            <div className="flex items-center justify-between px-3 py-1">
              <div className="text-sm font-medium">Dialogical view</div>
              <button
                className="px-4 py-2 btnv2 rounded-full text-[11px]"
                onClick={async () => {
                  setNegOpen(true);
                  await fetch("/api/ludics/compile-step", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ deliberationId, phase: "neutral" }),
                  }).catch(() => {});
                  window.dispatchEvent(
                    new CustomEvent("dialogue:moves:refresh")
                  );
                }}
              >
                Negotiation Panel
              </button>
            </div>
            <DialogicalPanel
              deliberationId={deliberationId}
              nodes={nodes}
              edges={edges}
            />
            <div className="z-1000">
              <NegotiationDrawerV2
                deliberationId={deliberationId}
                open={negOpen}
                onClose={() => setNegOpen(false)}
                titlesByTarget={titlesByTarget}
              />
            </div>
          </>
        )}

        <div className="h-[500px] ">
          <Virtuoso
            className={virtuosoOverflowClass}
            data={items}
            computeItemKey={(_index, a) => a.id}
              increaseViewportBy={{ top: 240, bottom: 240 }}
  rangeChanged={(range) => {
    const slice = items.slice(range.startIndex, Math.min(items.length, range.endIndex +  1));
   onVisibleTextsChanged?.(slice.map(a => a.text || ''));
 }}
            endReached={() =>
              !isValidating && nextCursor && setSize((s) => s + 1)
            }
            itemContent={(index: number, a: Arg) =>
              modelLens === "dialogical" ? (
                <DialogicalRow
                  a={a}
                  deliberationId={deliberationId}
                  onReplyTo={onReplyTo}
                  onOpenDispute={handleOpenDispute}
                   // whyLocusPath={whyMeta?.locusPath /* "0.3" when known */}

                />
              ) : (
                <ArgRow
                  a={a}
                  deliberationId={deliberationId}
                  onReplyTo={onReplyTo}
                  onApprove={approve}
                  onOpenDispute={handleOpenDispute}
                  onOpenIssuesFor={openIssuesFor}   // 👈 pass through

                  refetch={mutate}
                  modelLens={modelLens as any}
                  workByClaimId={workByClaimId}
                  // NEW: pass RSA + Dial maps to the row
                  rsaByTarget={rsaByTarget}
                  dialStats={dialStats}
                />
              )
            }
            components={{
              Footer: () => (
                <div className="py-3 px-4 mx-4 text-center text-[12px] gap-4 text-neutral-500">
                  {isValidating
                    ? "Loading…"
                    : nextCursor
                    ? "Scroll to load more"
                    : "End"}
                </div>
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
}

function EvidenceChecklist({ text }: { text: string }) {
  const hasUrl = /\bhttps?:\/\/\S+/.test(text);
  const hasDoi = /\bdoi:\s*\S+/i.test(text) || /doi\.org\//i.test(text);
  const hasNum = /\b\d+(?:\.\d+)?\s?(%|percent|ratio|CI|R²|p[<=>])\b/i.test(
    text
  );
  const hasYear = /\b(19|20)\d{2}\b/.test(text);
  const pill = (ok: boolean, label: string) => (
    <span
      className={`px-1 py-0.5 rounded border text-[10px] ${
        ok
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-neutral-50 border-neutral-200 text-neutral-600"
      }`}
    >
      {label}
    </span>
  );
  return (
<div className="flex flex-wrap gap-1 rounded-md border border-slate-200 bg-white/60 px-1.5 py-1 backdrop-blur">
      {pill(hasUrl, "URL")}
      {pill(hasDoi, "DOI")}
      {pill(hasNum, "#s")}
      {pill(hasYear, "Year")}
    </div>
  );
}

// ------ Row component (now *receives* Dial & RSA maps) ------
type RSARes = { R: number; S: number; A: number };
function ArgRow({
  a,
  deliberationId,
  onReplyTo,
  onApprove,
  onOpenDispute,
  onOpenIssuesFor,     // 👈 NEW

  refetch,
  modelLens,
  workByClaimId,
  rsaByTarget,
  dialStats,
}: {
  a: Arg;
  deliberationId: string;
  onReplyTo: (id: string) => void;
  onApprove: (id: string, approve: boolean) => Promise<void> | void;
  onOpenDispute: (id: string, label: string) => Promise<void> | void;
  onOpenIssuesFor: (id: string) => void; // 👈 NEW

  refetch: () => void;
  modelLens: "monological" | "dialogical" | "rhetorical";
  workByClaimId: Record<string, { workId: string; title: string } | undefined>;
  rsaByTarget: Record<string, RSARes>;
  dialStats: Record<string, any> | undefined;
}) {
  const { settings } = useRhetoric();
  const [modalOpen, setModalOpen] = useState(false);
  const [lastHits, setLastHits] = useState<Hit[]>([]);

  const [citeOpen, setCiteOpen] = useState(false);
  const [prefillUrl, setPrefillUrl] = useState<string | undefined>(undefined);

  const { setTarget } = useDialogueTarget();
  

  const rowRef = React.useRef<HTMLDivElement | null>(null);
  // React.useEffect(() => {
  //   const el = rowRef.current;
  //   if (!el) return;
  //   function onKey(e: KeyboardEvent) {
  //     if (document.activeElement && !el.contains(document.activeElement)) return;
  //     if (e.key.toLowerCase() === 'r') { onReplyTo(a.id); scrollComposerIntoView(); }
  //     if (e.key.toLowerCase() === 'c') { setCiteOpen(true); }
  //   }
  //   el.addEventListener('keydown', onKey);
  //   return () => el.removeEventListener('keydown', onKey);
  // }, [a.id, onReplyTo]);
  function onOpenCitePicker(initialUrl?: string) {
    setPrefillUrl(initialUrl);
    setCiteOpen(true);
  }
  const [bridgeBusy, setBridgeBusy] = useState(false);
  async function openDialogue() {
    if (bridgeBusy) return;
    try {
      setBridgeBusy(true);
      await fetch("/api/monological/bridge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ argumentId: a.id }),
      });
      window.dispatchEvent(new CustomEvent("dialogue:moves:refresh"));
    } finally {
      setBridgeBusy(false);
    }
  }

  async function onPromoteWithEvidence(url: string, conclusionText?: string) {
    // 1) promote (if you have conclusion from Toulmin)
    const claimText = conclusionText || a.text.slice(0, 120);
    const ccRes = await fetch("/api/claims/quick-create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        targetArgumentId: a.id,
        text: claimText,
        deliberationId,
      }),
    });
    if (!ccRes.ok) throw new Error(await ccRes.text());
    const { claimId } = await ccRes.json();

    // 2) attach evidence quickly
    const ev = await fetch(
      `/api/claims/${encodeURIComponent(claimId)}/evidence`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ uri: url, kind: "secondary", cite: true }),
      }
    );
    if (!ev.ok) throw new Error(await ev.text());

    // 3) refresh row
    await refetch();
  }

  const created = new Date(a.createdAt).toLocaleString();
  const alt = a.text ? a.text.slice(0, 50) : "argument image";

  const miniMix = useMemo(() => {
    if (!settings.enableMiniMl || !a.text) return null;
    const det = analyzeText(a.text);
    const NLP_CATS = new Set([
      "imperative",
      "passive",
      "nominalization",
      "parallelism",
      "modal-certainty",
      "modal-uncertainty",
      "negation",
      "pronoun-you",
      "pronoun-we",
    ] as Hit["cat"][]);
    const nlpHits = lastHits?.filter((h) => NLP_CATS.has(h.cat)) ?? [];
    const feats = featuresFromPipeline({ det, nlpHits, text: a.text });
    return predictMix(feats, { temperature: 1.0 });
  }, [settings.enableMiniMl, a.text, lastHits]);
  const qmTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  function saveQualifier(q: any, m: any) {
    if (qmTimer.current) clearTimeout(qmTimer.current);
    qmTimer.current = setTimeout(() => {
      fetch(`/api/arguments/${a.id}/qualifier`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quantifier: q ?? null, modality: m ?? null }),
      })
        .then(() => refetch())
        .catch(() => {});
    }, 400);
  }



  const workChip =
    a.claimId && workByClaimId[a.claimId] ? (
      <a
        className="px-1.5 py-0.5 rounded border text-[10px] bg-neutral-50 hover:bg-neutral-100"
        href={`/works/${workByClaimId[a.claimId]!.workId}`}
        title="Open source work"
      >
        ⇢ Work: {workByClaimId[a.claimId]!.title || "Open"}
      </a>
    ) : null;

  // Pull batch RSA for this row
  const rsaForRow = rsaByTarget[`argument:${a.id}`];
  const { user } = useAuth();
    const viewerId =
      (user as any)?.userId ?? (user as any)?.id ?? (user as any)?.uid ?? (user as any)?.sub ?? null;
    const isAuthor = viewerId != null && String(viewerId) === String(a.authorId);

  return (
    <div className="relative my-2  shadow-sm">
    <div id={`arg-${a.id}`} ref={rowRef} tabIndex={0} aria-label="Argument row"
 className="group relative p-3 border-b focus:outline-none
                                   bg-white/40 hover:bg-white/65 backdrop-blur-[2px] transition-colors">
                                    
      {modelLens === "monological" && (
        <MonologicalToolbar
          deliberationId={deliberationId}
          argument={{ id: a.id, text: a.text, claimId: a.claimId ?? undefined }}
          // You can pass CQ summary bonus if you have it available here; else omit
          onChanged={() => refetch()}
        />
      )}


         {modelLens === "monological" && (
           <>
             <MiniStructureBox text={a.text} />
             <div className="px-2 py-1 border rounded-lg bg-slate-50/50 my-2">
             <ToulminBox
               text={a.text}
               argumentId={a.id}
               deliberationId={deliberationId}
               claimId={a.claimId ?? null}
               onChanged={() => refetch()}
               onAddMissing={(slot) => {
                 fetch('/api/missing-premises', {
                   method: 'POST', headers: { 'content-type': 'application/json' },
                   body: JSON.stringify({
                     deliberationId, targetType: 'argument', targetId: a.id,
                     text: slot === 'warrant' ? 'Add warrant…' : 'Add missing premise…',
                     premiseType: slot === 'warrant' ? 'warrant' : 'premise',
                   }),
                 }).catch(()=>{});
               }}
               onPromoteConclusion={(conclusion) => {
                 fetch('/api/claims/quick-create', {
                   method: 'POST', headers: { 'content-type': 'application/json' },
                   body: JSON.stringify({ targetArgumentId: a.id, text: conclusion, deliberationId }),
                 }).then(()=>refetch());
               }}
             />
             </div>
           </>
         )}

      {/* badges */}

      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
      {(a.quantifier || a.modality) && (
  <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white/70 px-1.5 py-1 text-[10px]">
    {a.quantifier && <span className="rounded border border-blue-200 bg-blue-50 px-1 text-blue-700">{a.quantifier}</span>}
    {a.modality && <span className="rounded border border-violet-200 bg-violet-50 px-1 text-violet-700">{a.modality}</span>}
  </span>
)}
        <div className="flex flex-col  ">
          {modelLens === "dialogical" && (
            <>
              <LudicsBadge
                deliberationId={deliberationId}
                targetType="argument"
                targetId={a.id}
              />
              <DecisionBanner deliberationId={deliberationId} subjectType="claim" subjectId={a.claimId}/>
              <DecisionBanner
    deliberationId={deliberationId}
    subjectType="claim"
    subjectId={a.claimId}
/>
              {/* <button
  className="text-[11px] px-2 py-0.5 border rounded"
  onClick={() => panelConfirmClaim(targetId)}
  title="Record a receipt confirming current CQ/AF state"
>
  Confirm (panel)
</button> */}
              <DialBadge
                stats={dialStats}
                targetType="argument"
                targetId={a.id}
              />
              {rsaForRow && <RSAChip {...rsaForRow} />}
            </>
          )}

<IssueBadge
  deliberationId={deliberationId}
  argumentId={a.id}
  onClick={() => {
    window.dispatchEvent(new CustomEvent('issues:open', {
      detail: { deliberationId, argumentId: a.id }
    }));
  }}
/>


          {a.mediaType && a.mediaType !== "text" && (
            <span className="px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700">
              {a.mediaType}
            </span>
          )}
        </div>
        {modelLens === "monological" && (
          <div className="rounded-md bg-white/70 border p-1">
            <div className="flex flex-col  ">
              {modelLens === "monological" && <MethodChip text={a.text} />}

              <div className="border rounded px-1.5 py-0.5">
                {modelLens === "monological" && (
                  <RowLexSnapshot text={a.text} />
                )}
              </div>
              <div className="border rounded px-1.5 py-0.5">
                {modelLens === "monological" && (
                  <EvidenceChecklist text={a.text} />
                )}
              </div>
            </div>
            {modelLens === "monological" && isAuthor && (
              <QuantifierModalityPicker
                initialQuantifier={a.quantifier ?? null}
                initialModality={a.modality ?? null}
                onChange={saveQualifier}
              />
            )}
          </div>
        )}

        {workChip}

        {/* Mini ML */}
        {modelLens === "rhetorical" && (
          <>
            {miniMix && <MixBadge mix={miniMix} className="ml-auto  " />}
            {a.text && <SourceQualityBadge text={a.text} />}
            {a.text && <FallacyBadge text={a.text} />}
          </>
        )}
      </div>
      {modelLens === "dialogical" && (
        <>
          {/* Inline WHY */}
          <InlineMoveForm
            placeholder="Challenge this: WHY …"
            onSubmit={async (note) => {
              // optimistic nudge
              window.dispatchEvent(new CustomEvent("dialogue:moves:refresh"));
              await fetch("/api/dialogue/move", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  deliberationId,
                  targetType: "argument",
                  targetId: a.id,
                  kind: "WHY",
                  payload: { note },
                  autoCompile: true,
                  autoStep: true,
                }),
              });
              // tell Ludics & drawer to refresh
              window.dispatchEvent(new CustomEvent("dialogue:moves:refresh"));
            }}
          />

          {/* Inline GROUNDS */}
          <InlineMoveForm
            placeholder="Provide grounds…"
            onSubmit={async (brief) => {
              window.dispatchEvent(new CustomEvent("dialogue:moves:refresh"));
              await fetch("/api/dialogue/move", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  deliberationId,
                  targetType: "argument",
                  targetId: a.id,
                  kind: "GROUNDS",
                  payload: { brief },
                  autoCompile: true,
                  autoStep: true,
                }),
              });
              window.dispatchEvent(new CustomEvent("dialogue:moves:refresh"));
            }}
          />
        </>
      )}
      {/* <div className="text-[9px] text-neutral-500 mb-1 mt-1">{created}</div> */}
      <div className="text-[9px] text-neutral-500 mb-1 mt-1">
  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-2 py-0.5">
    {created}
  </span>
</div>
{a.confidence != null && (

<div className="text-[9px] text-neutral-500 mb-1 mt-1">
  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-2 py-0.5">
  Certainty: {(a.confidence * 100).toFixed(0)}%

  </span>
</div>
      )}

      {Array.isArray(a.edgesOut) && a.edgesOut.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {a.edgesOut.map((e, i) => {
            if (e.type !== "rebut" && e.type !== "undercut") return null;
            const label =
              e.type === "undercut"
                ? "inference"
                : e.targetScope ?? "conclusion";
            const style =
              label === "inference"
                ? "border-violet-200 bg-violet-50 text-violet-700"
                : label === "premise"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-blue-200 bg-blue-50 text-blue-700";
            return (
              <span
                key={i}
                className={`text-[10px] px-1.5 py-0.5 rounded border ${style}`}
              >
                {label}
              </span>
            );
          })}
        </div>
      )}

      {/* truncated body */}
      <div className="w-fit h-fit px-2 py-1 bg-white shadow-md shadow-slate-300/40 border mb-3 mt-2 rounded-md">

      {/* <div
        className={`text-sm whitespace-pre-wrap ${
          a.text.length > 240 && !modalOpen ? "line-clamp-3" : ""
        }`}
      >
        <RhetoricText text={a.text} onHits={setLastHits} />
      </div>

      {a.text && a.text.length > 240 && (
        <button
          className="text-xs underline mt-1"
          onClick={() => setModalOpen(true)}
        >
          Expand
        </button>
      )} */}
      {a.text.length > 240 && !modalOpen ? (
  <ClampedBody text={a.text} onMore={() => setModalOpen(true)} />
) : (
  <div className="text-sm whitespace-pre-wrap">
    <RhetoricText text={a.text} onHits={setLastHits} />
  </div>
)}
</div>
      {/* full body modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[500px] bg-slate-50 rounded-xl overflow-y-auto p-4 ">
          <DialogHeader>
            <DialogTitle>Full argument</DialogTitle>
          </DialogHeader>
          <div className="whitespace-pre-wrap text-sm">
            <RhetoricText text={a.text} onHits={setLastHits} />
            <hr className="w-full my-2"></hr>
            <div className="flex gap-3">
            <SaveHighlights
              targetType="argument"
              targetId={a.id}
              highlights={lastHits.map((h) => ({
                kind: h.cat,
                text: h.match,
                start: h.start,
                end: h.end,
              }))}
            />
                  <DialogClose
            id="closearg"
            className={`btnv2`}
          >
            Close
          </DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* media */}
      {a.mediaType === "image" && a.mediaUrl && (
        <div className="mt-2">
          <img
            src={a.mediaUrl}
            alt={alt}
            loading="lazy"
            className="max-h-40 object-contain border rounded"
          />
        </div>
      )}
      {a.mediaType === "video" && a.mediaUrl && (
        <div className="mt-2">
          <video
            controls
            preload="metadata"
            className="max-h-52 border rounded"
          >
            <source src={a.mediaUrl} />
          </video>
        </div>
      )}
      {a.mediaType === "audio" && a.mediaUrl && (
        <div className="mt-2">
          <audio controls preload="metadata" className="w-full">
            <source src={a.mediaUrl} />
          </audio>
        </div>
      )}

      {/* {a.confidence != null && (
        <div className="text-[11px] text-neutral-500 mt-1">
          How sure: {(a.confidence * 100).toFixed(0)}%
        </div>
      )} */}
         <div className="flex " >  
      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
        <button
          className="px-2 py-1 flex-none  rounded text-xs btnv2--ghost"
          onClick={() => { onReplyTo(a.id); scrollComposerIntoView(); }}
        >
          Reply
        </button>

        {a.claimId ? (
    <span className="text-[11px] px-2 py-1 rounded border border-emerald-300 bg-emerald-50 text-emerald-700">
      Promoted ✓
    </span>
  ) : (

      <PromoteToClaimButton
        deliberationId={deliberationId}
        target={{ type: "argument", id: a.id }}
        onClaim={async (newClaimId) => {
          refetch();
          await fetch("/api/dialogue/move", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              deliberationId,
              targetType: "claim",
              targetId: newClaimId,
              kind: "ASSERT",
              payload: { note: "Promoted to Claim" },
              actorId: "Proponent",
              autoCompile: true,
              autoStep: true,
            }),
          }).catch(() => {});
          window.dispatchEvent(
            new CustomEvent("dialogue:moves:refresh")
          );
        }}
      />
    
  )}

        {a.approvedByUser ? (
          <button
            className="px-2 py-1 border rounded text-xs bg-emerald-50 border-emerald-300 text-emerald-700"
            onClick={() => onApprove(a.id, false)}
          >
            Approved ✓ (Unapprove)
          </button>
        ) : (
          <button
            className="px-2 py-1 btnv2--ghost  rounded text-xs"
            onClick={() => onApprove(a.id, true)}
          >
            Approve
          </button>
        )}
        <button
  className="px-2 py-1 btnv2--ghost rounded text-xs"
  onClick={() => {
    const url = `${location.origin}${location.pathname}#arg-${a.id}`;
    navigator.clipboard.writeText(url).catch(()=>{});
  }}
  title="Copy a direct link to this argument"
>
  Copy link
</button>
  <DiscussInLudicsButton
    deliberationId={deliberationId}
    argumentId={a.id}
    setTarget={setTarget}
  />
        {a.mediaType === "image" && (
          <>
            <button
              className="px-2 py-1  rounded text-xs btnv2--ghost"
              onClick={() => onOpenDispute(a.id, "Image – Relevance")}
            >
              Dispute image (Relevance)
            </button>
            <button
              className="px-2 py-1  rounded text-xs btnv2--ghost"
              onClick={() => onOpenDispute(a.id, "Image – Depiction")}
            >
              Dispute image (Depiction)
            </button>
          </>
        )}
      </div>
      <div className="relative flex inline gap-2 ml-2 mt-2">
<CiteInline
           deliberationId={deliberationId}
           argumentId={a.id}
           claimId={a.claimId ?? null}
           text={a.text}
           prefillUrl={prefillUrl}
           open={citeOpen}
           onClose={() => { setCiteOpen(false); setPrefillUrl(undefined); }}
           onPromoteWithEvidence={(url) => onPromoteWithEvidence(url)}
         />
         </div>
         </div>
    </div>
    </div>
  );
}

function DialogicalRow({
  a,
  deliberationId,
  onReplyTo,
  onOpenDispute,
  whyLocusPath,          // e.g., "0.3" if this row is about a specific WHY; optional

  onPosted,
}: {
  a: Arg;
  deliberationId: string;
  onReplyTo: (id: string) => void;
  onOpenDispute: (id: string, label: string) => void;
  whyLocusPath?: string;              // pass from parent when known

  onPosted?: () => void;
}) {
  const created = new Date(a.createdAt).toLocaleString();

  const phase = useLudicsPhase();     // 'neutral' | 'focus-P' | 'focus-O'
  const commitOwner = phase === 'focus-O' ? 'Opponent' : 'Proponent';


  const targetType: 'argument' | 'claim' = a.claimId ? 'claim' : 'argument';
  const targetId = a.claimId ?? a.id;

  const locusPath = whyLocusPath ?? '0';
  const showDevMoves = false; // or from env/config

  return (
    <div id={`arg-${a.id}`} className="p-3 border-b">
      <div className="text-xs text-neutral-500 mb-1">{created}</div>
      <div className="w-fit h-fit px-2 py-1 bg-slate-50 border rounded">
      <div className="text-sm whitespace-pre-wrap line-clamp-3">{a.text}</div>
</div>
      <div className="mt-2 flex items-center gap-2">
        <AnchorToMapButton argumentId={a.id} />
       
{showDevMoves && (
  <DialogueMoves
    deliberationId={deliberationId}
    targetType={targetType}
    targetId={targetId}
    onMoved={() => onPosted?.()}
/>
)}
  

<LegalMoveChips
  deliberationId={deliberationId}
  targetType={targetType}         // claim vs argument
  targetId={targetId}
  locusPath={locusPath}           // row- or thread-specific
  commitOwner={commitOwner}       // derived from phase
  onPosted={onPosted}
/>
        <button
          className="px-2 py-1 btnv2--ghost  rounded text-xs"
          onClick={() => { onReplyTo(a.id); scrollComposerIntoView(); }}
        >
          Reply
        </button>
               <button className="px-2 py-1 btnv2--ghost  rounded text-xs"
                onClick={() => onOpenDispute(a.id, 'Meaning / Scope')}>
         Open issue
       </button>
  
      </div>

    </div>
    
  );
  
}
function DiscussInLudicsButton({
  deliberationId, argumentId, setTarget
}: { deliberationId: string; argumentId: string; setTarget: (t:{type:'argument'|'claim',id:string})=>void }) {
  const [busy, setBusy] = React.useState(false);

  async function go() {
    if (busy) return;
    setBusy(true);
    try {
      // 1) bridge monological → dialogue (safe if already bridged)
      await fetch('/api/monological/bridge', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ argumentId }),
      }).catch(()=>{});

      // 2) compile/step
      await fetch('/api/ludics/compile-step', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ deliberationId, phase: 'neutral' }),
      }).catch(()=>{});

      // 3) focus the panel + set target
      setTarget({ type: 'argument', id: argumentId });
      window.dispatchEvent(new CustomEvent('dialogue:moves:refresh', { detail: { deliberationId } } as any));
      window.dispatchEvent(new CustomEvent('ludics:open',           { detail: { deliberationId } } as any));
      window.dispatchEvent(new CustomEvent('ludics:focus',          { detail: { phase: 'focus-P' } } as any));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      className="px-2 py-1 rounded text-xs btnv2--ghost"
      onClick={go}
      disabled={busy}
      aria-busy={busy}
      title="Bridge this argument into the dialogue and open the negotiation panel"
    >
      {busy ? 'Opening…' : 'Discuss in Ludics'}
    </button>
  );
}
function scrollComposerIntoView() {
  // Let any listeners open/reveal the composer first
  window.dispatchEvent(new CustomEvent('mesh:composer:focus'));
  // DOM fallback after a short delay
  setTimeout(() => {
    const el =
      document.getElementById('deliberation-composer') ||
      document.querySelector('[data-role="deliberation-composer"]');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const input = el.querySelector('textarea, [contenteditable="true"], input[type="text"]') as HTMLElement | null;
      if (input) input.focus();
    }
  }, 60);
}




function CiteInline({
  deliberationId,
  argumentId,
  claimId,
  text,
  prefillUrl,
  open: forcedOpen,
  onClose,
  onPromoteWithEvidence,
}: {
  deliberationId: string;
  argumentId: string;
  claimId?: string | null;
  text: string;
  prefillUrl?: string;
  open?: boolean;
  onClose?: () => void;
  onPromoteWithEvidence?: (url: string) => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [initialUrl, setInitialUrl] = React.useState<string | undefined>(prefillUrl);

  // respect forcedOpen (controlled opener from outside)
  React.useEffect(() => {
    if (forcedOpen !== undefined) setOpen(forcedOpen);
  }, [forcedOpen]);

  // detect URLs from the row text
  const urls = React.useMemo(() => {
    const found = (text.match(/\bhttps?:\/\/[^\s)]+/gi) ?? []).map((u) =>
      u.replace(/[),.;]+$/, "")
    );
    return Array.from(new Set(found));
  }, [text]);

  // chosen default url: prop prefill > first detected > undefined
  React.useEffect(() => {
    if (!initialUrl) {
      setInitialUrl(prefillUrl ?? urls[0] ?? undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillUrl, urls]);

  async function handleCiteAndPromote(url: string) {
    if (!onPromoteWithEvidence) return;
    setBusy(true);
    try {
      await onPromoteWithEvidence(url);
      setOpen(false);
      onClose?.();
    } finally {
      setBusy(false);
    }
  }

  // open modal, optionally with a specific url prefilled
  function openModal(url?: string) {
    if (url) setInitialUrl(url);
    setOpen(true);
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <button
          className="px-2 py-1 btnv2--ghost rounded text-xs"
          onClick={() => openModal()}
          aria-expanded={open}
        >
          Cite
        </button>

        {urls.length === 1 && (
          <>
            <button
              className="px-2 py-1 btnv2--ghost rounded text-xs"
              disabled={busy}
              title={urls[0]}
              onClick={() => openModal(urls[0])}
            >
              Cite detected link
            </button>
            {!claimId && onPromoteWithEvidence && (
              <button
                className="px-2 py-1 rounded text-xs border"
                disabled={busy}
                onClick={() => handleCiteAndPromote(urls[0])}
                title="Promote to claim and attach this link as evidence"
              >
                Cite & Promote
              </button>
            )}
          </>
        )}

        {urls.length > 1 && (
          <details className="relative">
            <summary className="list-none px-2 py-1 btnv2--ghost rounded text-xs cursor-pointer">
              Cite detected links ▾
            </summary>
            <div className="absolute z-20 mt-1 rounded border bg-white shadow p-2 min-w-[240px]">
              {urls.map((u) => (
                <div
                  key={u}
                  className="flex items-center justify-between gap-2 py-0.5"
                >
                  <button
                    className="text-[11px] underline"
                    onClick={() => openModal(u)}
                    title={u}
                  >
                    {new URL(u).hostname}
                  </button>
                  {!claimId && onPromoteWithEvidence && (
                    <button
                      className="text-[11px] border rounded px-1"
                      disabled={busy}
                      onClick={() => handleCiteAndPromote(u)}
                      title="Promote & attach"
                    >
                      Cite & Promote
                    </button>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* Modal picker */}
      <CitePickerModal
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) onClose?.();
        }}
        targetType={claimId ? "claim" : "argument"}
        targetId={claimId ?? argumentId}    
        title="Attach citation"
        initialUrl={initialUrl}
        // you can pass initialQuote/Locator here if you have them
        onDone={() => {
          setOpen(false);
          onClose?.();
        }}
      />
    </div>
  );
}


 function DelibMixBadge({ deliberationId }:{ deliberationId:string }) {
   const { data } = useSWR(
     `/api/monological/telemetry?deliberationId=${encodeURIComponent(deliberationId)}`,
     fetcher, { revalidateOnFocus:false }
   );
   if (!data?.totals) return null;
   const t = data.totals, sat = data.saturation?.likely;
   return (
     <span className={`ml-2 text-[11px] px-2 py-0.5 rounded border ${sat ? 'border-amber-300 bg-amber-50 text-amber-700' : 'bg-white/70'}`}
       title={sat ? 'Qualifiers high & rebuttals low — consider inviting counter-cases' : 'Deliberation‑level mix'}>
       Delib mix: G{t.grounds} · Q{t.qualifiers} · R{t.rebuttals}{sat ? ' · likely saturation' : ''}
     </span>
   );
 }