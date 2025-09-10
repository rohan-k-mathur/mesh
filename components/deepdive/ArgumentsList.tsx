"use client";
import { useMemo, useState, useEffect } from "react";
import useSWRInfinite from "swr/infinite";
import { Virtuoso } from "react-virtuoso";
import PromoteToClaimButton from "../claims/PromoteToClaimButton";
import CitePickerInline from "@/components/citations/CitePickerInline";
import { SkeletonLines } from "@/components/ui/SkeletonB";
import React from "react";
import RhetoricText from "../rhetoric/RhetoricText";
import StyleDensityBadge from "@/components/rhetoric/StyleDensityBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Hit } from "../rhetoric/detectors";
import SaveHighlights from "../rhetoric/SaveHighlights";
import EmotionBadge from "@/components/rhetoric/EmotionBadge";
import FrameChips from "@/components/rhetoric/FrameChips";
import { analyzeLexiconsMany } from "../rhetoric/lexiconAnalyzers";

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

// Dialectic + RSA
import { useDialecticStats } from '@/packages/hooks/useDialecticStats';
import { DialBadge } from '@/packages/components/DialBadge';
import { RSAChip } from '@/packages/components/RSAChip';
import { useRSABatch } from '@/packages/hooks/useRSABatch';

import { LudicsBadge } from '@/components/dialogue/LudicsBadge';
import { InlineMoveForm } from '@/components/dialogue/InlineMoveForm';


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

function RowLexSnapshot({ text }: { text: string }) {
  const { liwcCounts, topFrames } = React.useMemo(
    () => analyzeLexiconsMany([text]),
    [text]
  );
  return (
    <span className="text-[10px] text-neutral-600 ml-2">
       certainty {liwcCounts.certainty} · tentative {liwcCounts.tentative} · neg {liwcCounts.negation}
      {topFrames.length ? <> · frames {topFrames.map((f) => f.key).join("/")}</> : null}
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
    const clusterQ = clusterId ? `&clusterId=${encodeURIComponent(clusterId)}` : "";
    return `/api/deliberations/${deliberationId}/arguments?limit=${PAGE}${cursor}&sort=createdAt:desc${clusterQ}`;
  };

  const { data, size, setSize, isValidating, error, mutate } = useSWRInfinite(
    getKey,
    fetcher,
    {
      revalidateFirstPage: false,
      keepPreviousData: true,
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

      const map: Record<string, { workId: string; title: string } | undefined> = {};
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
      const titleById = Object.fromEntries((j.works ?? []).map((w) => [w.id, w.title]));
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
    const ids = (items ?? []).slice(0, 20).map(a => `argument:${a.id}`);
    return Array.from(new Set(ids));
  }, [items]);

  const { byTarget: rsaByTarget } = useRSABatch({ deliberationId, targets: argTargets });
  const { stats: dialStats } = useDialecticStats(deliberationId);

  const titlesByTarget = useMemo(
    () => Object.fromEntries(items.map((a) => [a.id, (a.text || "").slice(0, 80)])),
    [items]
  );

  const { liwcCounts } = useMemo(
    () => analyzeLexiconsMany(items.slice(0, 10).map((a) => a.text || "")),
    [items]
  );

  useEffect(() => {
    onVisibleTextsChanged?.(items.slice(0, 40).map((a) => a.text || ""));
  }, [items, onVisibleTextsChanged]);

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

  const openDispute = async (id: string, label: string) => {
    try {
      const res = await fetch(`/api/deliberations/${deliberationId}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, links: [id] }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error("dispute failed", e);
    }
  };

  if (!data && isValidating) {
    return (
      <div className="rounded-md border p-3 space-y-2">
        <div className="text-sm font-medium">Arguments</div>
        <div className="p-2 border rounded"><SkeletonLines lines={3} /></div>
        <div className="p-2 border rounded"><SkeletonLines lines={3} /></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-md border p-3 space-y-2">
        <div className="text-sm font-medium">Arguments</div>
        <div className="text-xs text-rose-600">{String(error?.message || "Failed to load")}</div>
        <button className="text-xs underline" onClick={() => mutate()}>Retry</button>
      </div>
    );
  }
  if (!items.length) {
    return (
      <div className="rounded-md border p-3 space-y-2">
        <div className="text-sm font-medium">Arguments</div>
        <div className="text-xs text-neutral-600">
          No arguments yet — start by adding your <b>Point</b> and optional <b>Sources</b>.
        </div>
      </div>
    );
  }

  const virtuosoOverflowClass = listExpanded ? "overflow-y-auto" : "overflow-y-hidden";

  return (
    <div id="arguments-top" className="relative z-10 w-full px-2 rounded-md border">
      <div className="px-3 py-2 text-md font-medium flex items-center justify-between">
        <span>Arguments</span>
        <button
          type="button"
          className="relative max-w-[300px] w/full justify-center items-center text-center mx-auto px-4 py-1 
                     text-xs tracking-wider rounded-lg border bg-slate-100 lockbutton"
          onClick={() => setListExpanded((v) => !v)}
          aria-expanded={listExpanded}
        >
          {listExpanded ? "Lock Scrolling" : "Enable Scrolling"}
        </button>
      </div>

      <StyleDensityBadge texts={items.slice(0, 10).map((a) => a.text || "")} />
      <EmotionBadge texts={items.slice(0, 10).map((a) => a.text || "")} />
      <FrameChips texts={items.slice(0, 10).map((a) => a.text || "")} />
      <span className="ml-2 text-[11px] text-neutral-500">· Model: {modelLens}</span>
      {liwcCounts && (
        <span className="ml-2 text-[11px] text-neutral-600">
          · certainty {liwcCounts.certainty} · tentative {liwcCounts.tentative} · negation {liwcCounts.negation}
        </span>
      )}

      <div className="rounded-md border py-1">
        {modelLens === "dialogical" && (
          <>
            <div className="flex items-center justify-between px-3 py-1">
              <div className="text-sm font-medium">Dialogical view</div>
              <button
                className="px-2 py-1 border rounded text-xs"
                onClick={async () => {
                  setNegOpen(true);
                  await fetch('/api/ludics/compile-step', {
                    method: 'POST', headers:{'content-type':'application/json'},
                    body: JSON.stringify({ deliberationId, phase: 'neutral' })
                  }).catch(()=>{});
                  window.dispatchEvent(new CustomEvent('dialogue:moves:refresh'));
                }}>
                Open negotiation
              </button>
            </div>
            <DialogicalPanel deliberationId={deliberationId} nodes={nodes} edges={edges} />
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

        <div className="h-[500px]">
          <Virtuoso
            className={virtuosoOverflowClass}
            data={items}
            computeItemKey={(_index, a) => a.id}
            endReached={() => !isValidating && nextCursor && setSize((s) => s + 1)}
            itemContent={(index: number, a: Arg) =>
              modelLens === "dialogical" ? (
                <DialogicalRow
                  a={a}
                  deliberationId={deliberationId}
                  onReplyTo={onReplyTo}
                  onOpenDispute={openDispute}
                />
              ) : (
                <ArgRow
                  a={a}
                  deliberationId={deliberationId}
                  onReplyTo={onReplyTo}
                  onApprove={approve}
                  onOpenDispute={openDispute}
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
                  {isValidating ? "Loading…" : nextCursor ? "Scroll to load more" : "End"}
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
  const hasNum = /\b\d+(?:\.\d+)?\s?(%|percent|ratio|CI|R²|p[<=>])\b/i.test(text);
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
    <div className="flex flex-wrap gap-1 ">
      {pill(hasUrl, "URL")}
      {pill(hasDoi, "DOI")}
      {pill(hasNum, "#s")}
      {pill(hasYear, "Year")}
    </div>
  );
}

// ------ Row component (now *receives* Dial & RSA maps) ------
type RSARes = { R:number; S:number; A:number };
function ArgRow({
  a,
  deliberationId,
  onReplyTo,
  onApprove,
  onOpenDispute,
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
  refetch: () => void;
  modelLens: "monological" | "dialogical" | "rhetorical";
  workByClaimId: Record<string, { workId: string; title: string } | undefined>;
  rsaByTarget: Record<string, RSARes>;
  dialStats: Record<string, any> | undefined;
}) {
  const { settings } = useRhetoric();
  const [modalOpen, setModalOpen] = useState(false);
  const [lastHits, setLastHits] = useState<Hit[]>([]);

  const created = new Date(a.createdAt).toLocaleString();
  const alt = a.text ? a.text.slice(0, 50) : "argument image";

  const miniMix = useMemo(() => {
    if (!settings.enableMiniMl || !a.text) return null;
    const det = analyzeText(a.text);
    const NLP_CATS = new Set(
      ["imperative", "passive", "nominalization", "parallelism", "modal-certainty", "modal-uncertainty", "negation", "pronoun-you", "pronoun-we"] as Hit["cat"][]
    );
    const nlpHits = lastHits?.filter((h) => NLP_CATS.has(h.cat)) ?? [];
    const feats = featuresFromPipeline({ det, nlpHits, text: a.text });
    return predictMix(feats, { temperature: 1.0 });
  }, [settings.enableMiniMl, a.text, lastHits]);

  const workChip =
    a.claimId && workByClaimId[a.claimId]
      ? (
          <a
            className="px-1.5 py-0.5 rounded border text-[10px] bg-neutral-50 hover:bg-neutral-100"
            href={`/works/${workByClaimId[a.claimId]!.workId}`}
            title="Open source work"
          >
            ⇢ Work: {workByClaimId[a.claimId]!.title || "Open"}
          </a>
        )
      : null;

  // Pull batch RSA for this row
  const rsaForRow = rsaByTarget[`argument:${a.id}`];

  return (
    <div id={`arg-${a.id}`} className="p-3 border-b focus:outline-none">
      {/* badges */}
   
      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
      <div className="flex flex-col">
        {a.quantifier && (
          <span className="px-1.5 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700">
            {a.quantifier}
          </span>
        )}
        {a.modality && (
          <span className="px-1.5 py-0.5 rounded border border-violet-200 bg-violet-50 text-violet-700">
            {a.modality}
          </span>
        )}
</div>
<div className="flex flex-col  ">

        <LudicsBadge deliberationId={deliberationId} targetType="argument" targetId={a.id} />
        <DialBadge stats={dialStats} targetType="argument" targetId={a.id} />
        {rsaForRow && <RSAChip {...rsaForRow} />}

        {a.mediaType && a.mediaType !== "text" && (
          <span className="px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700">
            {a.mediaType}
          </span>
        )}
        </div>
        <div className="flex flex-col  ">

        {modelLens === "monological" && <MethodChip text={a.text} />}

        <div className="border rounded px-1.5 py-0.5">

        {modelLens === "monological" && <RowLexSnapshot text={a.text} />}
        </div>
        <div className="border rounded px-1.5 py-0.5">

        {modelLens === "monological" && <EvidenceChecklist text={a.text} />}
        </div>
        </div>
        {modelLens === "monological" && (
          <QuantifierModalityPicker
            initialQuantifier={a.quantifier ?? null}
            initialModality={a.modality ?? null}
            onChange={(q, m) => {
              fetch(`/api/arguments/${a.id}/meta`, {
                method: 'PUT', headers: {'content-type':'application/json'},
                body: JSON.stringify({ quantifier: q, modality: m }),
              }).then(()=>refetch());
            }}
          />
        )}
        {modelLens === "monological" && (
          <>
            <MiniStructureBox text={a.text} />
            <ToulminBox
              text={a.text}
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
          </>
        )}
  

        {/* Show items with open WHY ≥ 48h
        <label className="text-xs ml-2">
          <input
            type="checkbox"
            onChange={()=>{
              const openOver48 = Object.entries(dialStats ?? {})
                .filter(([, s]: any) => s.openWhy > 0 && ((Date.now() - Date.parse(s.lastWhyAt || '')) / 36e5) >= 48)
                .map(([k]) => k);
              window.dispatchEvent(new CustomEvent('mesh:list:filterOpenWhy', { detail: { keys: openOver48 } }));
            }}
          />{" "}
          Show Items
        </label> */}

        {/* Source work chip */}
        {workChip}

        {/* Mini ML */}
        {miniMix && <MixBadge mix={miniMix} className="ml-auto" />}

        {a.text && <SourceQualityBadge text={a.text} />}
        {a.text && <FallacyBadge text={a.text} />}
      </div>

      {/* Inline WHY */}
<InlineMoveForm
  placeholder="Challenge this: WHY …"
  onSubmit={async (note) => {
    // optimistic nudge
    window.dispatchEvent(new CustomEvent('dialogue:moves:refresh'));
    await fetch('/api/dialogue/move', {
      method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify({
        deliberationId, targetType:'argument', targetId: a.id,
        kind:'WHY', payload:{ note },
        autoCompile: true, autoStep: true
      })
    });
    // tell Ludics & drawer to refresh
    window.dispatchEvent(new CustomEvent('dialogue:moves:refresh'));
  }}
/>

{/* Inline GROUNDS */}
<InlineMoveForm
  placeholder="Provide grounds…"
  onSubmit={async (brief) => {
    window.dispatchEvent(new CustomEvent('dialogue:moves:refresh'));
    await fetch('/api/dialogue/move', {
      method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify({
        deliberationId, targetType:'argument', targetId: a.id,
        kind:'GROUNDS', payload:{ brief },
        autoCompile: true, autoStep: true
      })
    });
    window.dispatchEvent(new CustomEvent('dialogue:moves:refresh'));
  }}
/>

      <div className="text-xs text-neutral-500 mb-1 mt-1">{created}</div>

      {Array.isArray(a.edgesOut) && a.edgesOut.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {a.edgesOut.map((e, i) => {
            if (e.type !== "rebut" && e.type !== "undercut") return null;
            const label = e.type === "undercut" ? "inference" : e.targetScope ?? "conclusion";
            const style =
              label === "inference"
                ? "border-violet-200 bg-violet-50 text-violet-700"
                : label === "premise"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-blue-200 bg-blue-50 text-blue-700";
            return (
              <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded border ${style}`}>
                {label}
              </span>
            );
          })}
        </div>
      )}

      {/* truncated body */}
      <div className={`text-sm whitespace-pre-wrap ${a.text.length > 240 && !modalOpen ? "line-clamp-3" : ""}`}>
        <RhetoricText text={a.text} onHits={setLastHits} />
      </div>

      {a.text && a.text.length > 240 && (
        <button className="text-xs underline mt-1" onClick={() => setModalOpen(true)}>
          Expand
        </button>
      )}

      {/* full body modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[500px] bg-slate-50 rounded-xl overflow-y-auto p-4 ">
          <DialogHeader>
            <DialogTitle>Full argument</DialogTitle>
          </DialogHeader>
          <div className="whitespace-pre-wrap text-sm">
            <RhetoricText text={a.text} onHits={setLastHits} />
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
          </div>
        </DialogContent>
      </Dialog>

      {/* media */}
      {a.mediaType === "image" && a.mediaUrl && (
        <div className="mt-2">
          <img src={a.mediaUrl} alt={alt} loading="lazy" className="max-h-40 object-contain border rounded" />
        </div>
      )}
      {a.mediaType === "video" && a.mediaUrl && (
        <div className="mt-2">
          <video controls preload="metadata" className="max-h-52 border rounded">
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

      {a.confidence != null && (
        <div className="text-[11px] text-neutral-500 mt-1">How sure: {(a.confidence * 100).toFixed(0)}%</div>
      )}

      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
        <button className="px-2 py-1 border rounded text-xs" onClick={() => onReplyTo(a.id)}>
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
              await fetch('/api/dialogue/move', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                  deliberationId,
                  targetType: 'claim',
                  targetId: newClaimId,
                  kind: 'ASSERT',
                  payload: { note: 'Promoted to Claim' },
                  actorId: 'Proponent',
                  autoCompile: true,
                  autoStep: true
                })
              }).catch(()=>{});
              window.dispatchEvent(new CustomEvent('dialogue:moves:refresh'));
            }}
          />
        )}

        <CiteInline deliberationId={deliberationId} argumentId={a.id} text={a.text} />

        {a.approvedByUser ? (
          <button
            className="px-2 py-1 border rounded text-xs bg-emerald-50 border-emerald-300 text-emerald-700"
            onClick={() => onApprove(a.id, false)}
          >
            Approved ✓ (Unapprove)
          </button>
        ) : (
          <button className="px-2 py-1 border rounded text-xs" onClick={() => onApprove(a.id, true)}>
            Approve
          </button>
        )}

        {a.mediaType === "image" && (
          <>
            <button
              className="px-2 py-1 border rounded text-xs"
              onClick={() => onOpenDispute(a.id, "Image – Appropriateness")}
            >
              Dispute image (Appropriateness)
            </button>
            <button
              className="px-2 py-1 border rounded text-xs"
              onClick={() => onOpenDispute(a.id, "Image – Depiction")}
            >
              Dispute image (Depiction)
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function DialogicalRow({
  a,
  deliberationId,
  onReplyTo,
  onOpenDispute,
}: {
  a: Arg;
  deliberationId: string;
  onReplyTo: (id: string) => void;
  onOpenDispute: (id: string, label: string) => Promise<void> | void;
}) {
  const created = new Date(a.createdAt).toLocaleString();
  return (
    <div id={`arg-${a.id}`} className="p-3 border-b">
      <div className="text-xs text-neutral-500 mb-1">{created}</div>
      <div className="text-sm whitespace-pre-wrap line-clamp-3">{a.text}</div>

      <div className="mt-2 flex items-center gap-2">
        <AnchorToMapButton argumentId={a.id} />
        <DialogueMoves deliberationId={deliberationId} targetType="argument" targetId={a.id} />
        <button className="px-2 py-1 border rounded text-xs" onClick={() => onReplyTo(a.id)}>
          Reply
        </button>
        <button className="px-2 py-1 border rounded text-xs" onClick={() => onOpenDispute(a.id, "Meaning / Scope")}>
          Open issue
        </button>
      </div>
    </div>
  );
}

function CiteInline({
  deliberationId,
  argumentId,
  text,
}: {
  deliberationId: string;
  argumentId: string;
  text: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button className="px-2 py-1 border rounded text-xs" onClick={() => setOpen((o) => !o)}>
        {open ? "Close cite" : "Cite"}
      </button>
      {open && (
        <div className="mt-2">
          <CitePickerInline deliberationId={deliberationId} argumentText={text} onDone={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
