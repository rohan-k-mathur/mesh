//components/claims/CriticalQuestionsV3.tsx
"use client";

import * as React from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { suggestionForCQ } from "@/lib/argumentation/cqSuggestions";
import { LegalMoveChips } from "@/components/dialogue/LegalMoveChips";
import { useBusEffect } from "@/lib/client/useBusEffect";
import { SchemeComposerPicker } from "@/components/SchemeComposerPicker";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Sparkles,
  Target,
  Link2,
  AlertCircle,
  Search,
  Send,
  Lightbulb,
  MessageCircle,
  Plus,
} from "lucide-react";
import { TargetType } from "@prisma/client";

type RebutScope = "premise" | "inference" | "conclusion";
type Suggestion = {
  type: "undercut" | "rebut";
  scope?: RebutScope;
  options?: Array<{
    key: string;
    label: string;
    template: string;
    shape?: string;
  }>;
} | null;

type CQ = {
  key: string;
  text: string;
  satisfied: boolean;
  groundsText?: string;
  suggestion?: Suggestion;
};

type Scheme = {
  key: string;
  title: string;
  cqs: CQ[];
};

type CQsResponse = {
  targetType: "claim" | "argument";
  targetId: string;
  schemes: Scheme[];
};

const fetcher = (u: string) =>
  fetch(u, { cache: "no-store" }).then((r) => r.json());

const CQS_KEY = (type: "claim" | "argument", id: string, scheme?: string) =>
  `/api/cqs?targetType=${type}&targetId=${id}${
    scheme ? `&scheme=${scheme}` : ""
  }`;
const TOULMIN_KEY = (id: string) => `/api/claims/${id}/toulmin`;
const GRAPH_KEY = (roomId: string, lens: string, audienceId?: string) =>
  `graph:${roomId}:${lens}:${audienceId ?? "none"}`;
const ATTACH_KEY = (type: "claim" | "argument", id: string) =>
  `/api/cqs/attachments?targetType=${type}&targetId=${id}`;
const MOVES_KEY = (deliberationId: string) =>
  `/api/deliberations/${deliberationId}/moves?limit=500`;
const EDGES_KEY = (deliberationId: string) =>
  `/api/claims/edges?deliberationId=${deliberationId}`;

async function trySearchClaims(
  q: string
): Promise<Array<{ id: string; text: string }>> {
  try {
    const r = await fetch(`/api/claims/search?q=${encodeURIComponent(q)}`, {
      cache: "no-store",
    });
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j.items) ? j.items.slice(0, 10) : [];
  } catch {
    return [];
  }
}

export default function CriticalQuestionsV3({
  targetType,
  targetId,
  createdById,
  deliberationId,
  roomId,
  currentLens,
  currentAudienceId,
  selectedAttackerClaimId,
  prefilterKeys,
}: {
  targetType: "claim" | "argument";
  targetId: string;
  createdById?: string;
  deliberationId?: string;
  roomId?: string;
  currentLens?: string;
  currentAudienceId?: string;
  selectedAttackerClaimId?: string;
  prefilterKeys?: string[];
}) {
  // UI State
  const [expandedCQ, setExpandedCQ] = useState<string | null>(null);
  const [expandedMoves, setExpandedMoves] = useState<string | null>(null);
  const [composingCQ, setComposingCQ] = useState<string | null>(null);
  const [groundsInput, setGroundsInput] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState<Record<string, string>>({});
  const [searchResults, setSearchResults] = useState<
    Record<string, Array<{ id: string; text: string }>>
  >({});
  const [searchLoading, setSearchLoading] = useState<string | null>(null);
  const [quickDialogOpen, setQuickDialogOpen] = useState(false);
  const [quickCQKey, setQuickCQKey] = useState<string | null>(null);
  const [quickText, setQuickText] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerCQKey, setPickerCQKey] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  // Data fetching
  const cqsKey = CQS_KEY(targetType, targetId);
  const { data: cqData, error: cqError } = useSWR<CQsResponse>(
    cqsKey,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const attachKey = ATTACH_KEY(targetType, targetId);
  const { data: attachData } = useSWR<any>(attachKey, fetcher, {
    revalidateOnFocus: false,
  });

  const movesKey = deliberationId ? MOVES_KEY(deliberationId) : null;
  const { data: movesData } = useSWR(movesKey, fetcher, {
    revalidateOnFocus: false,
  });

  const edgesKey = deliberationId ? EDGES_KEY(deliberationId) : null;
  const { data: edgesData } = useSWR(edgesKey, fetcher, {
    revalidateOnFocus: false,
  });

  // Event-driven cache invalidation
  useBusEffect(
    [
      "cqs:changed",
      "dialogue:moves:refresh",
      "arguments:changed",
      "claims:changed",
      "claims:edges:changed",
    ],
    () => {
      globalMutate(cqsKey);
      globalMutate(attachKey);
      if (deliberationId) {
        globalMutate(MOVES_KEY(deliberationId));
        globalMutate(EDGES_KEY(deliberationId));
      }
      if (roomId && currentLens) {
        globalMutate(GRAPH_KEY(roomId, currentLens, currentAudienceId));
      }
    },
    { retry: true }
  );

  // Legacy event listeners for backwards compatibility
  React.useEffect(() => {
    const h = () => {
      globalMutate(cqsKey);
      globalMutate(attachKey);
      if (deliberationId) {
        globalMutate(MOVES_KEY(deliberationId));
        globalMutate(EDGES_KEY(deliberationId));
      }
    };
    window.addEventListener("claims:changed", h);
    window.addEventListener("arguments:changed", h);
    return () => {
      window.removeEventListener("claims:changed", h);
      window.removeEventListener("arguments:changed", h);
    };
  }, [cqsKey, attachKey, deliberationId]);

  // Helpers
  const toggleCQ = async (
    schemeKey: string,
    cqKey: string,
    satisfied: boolean
  ) => {
    const url = `/api/cqs/${targetType}/${targetId}`;
    const oldData = cqData;

    // Optimistic update
    const updatedSchemes = oldData?.schemes.map((s) => {
      if (s.key !== schemeKey) return s;
      return {
        ...s,
        cqs: s.cqs.map((c) =>
          c.key === cqKey
            ? {
                ...c,
                satisfied,
                groundsText: satisfied ? c.groundsText : undefined,
              }
            : c
        ),
      };
    });

    globalMutate(cqsKey, { ...oldData, schemes: updatedSchemes }, false);

    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          schemeKey,
          cqKey,
          satisfied,
          groundsText: satisfied ? groundsInput[cqKey] || "" : undefined,
        }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await globalMutate(cqsKey);
      window.dispatchEvent(new CustomEvent("cqs:changed"));
    } catch (err) {
      console.error("[CriticalQuestionsV3] toggleCQ error:", err);
      globalMutate(cqsKey, oldData, false);
    }
  };

  const resolveViaGrounds = async (
    schemeKey: string,
    cqKey: string,
    grounds: string
  ) => {
    if (!grounds.trim()) return;

    const url = `/api/cqs/${targetType}/${targetId}`;
    const oldData = cqData;

    const updatedSchemes = oldData?.schemes.map((s) => {
      if (s.key !== schemeKey) return s;
      return {
        ...s,
        cqs: s.cqs.map((c) =>
          c.key === cqKey ? { ...c, satisfied: true, groundsText: grounds } : c
        ),
      };
    });

    globalMutate(cqsKey, { ...oldData, schemes: updatedSchemes }, false);

    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          schemeKey,
          cqKey,
          satisfied: true,
          groundsText: grounds,
        }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await globalMutate(cqsKey);
      window.dispatchEvent(new CustomEvent("cqs:changed"));
      setGroundsInput((prev) => ({ ...prev, [cqKey]: "" }));
      setExpandedCQ(null);
    } catch (err) {
      console.error("[CriticalQuestionsV3] resolveViaGrounds error:", err);
      globalMutate(cqsKey, oldData, false);
    }
  };

  const attachWithAttacker = async (
    schemeKey: string,
    cqKey: string,
    attackerClaimId: string
  ) => {
    setPosting(true);
    try {
      const r = await fetch("/api/cqs/toggle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          schemeKey,
          cqKey,
          satisfied: false,
          attachSuggestion: true,
          attackerClaimId,
          deliberationId,
        }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await globalMutate(cqsKey);
      await globalMutate(attachKey);
      window.dispatchEvent(new CustomEvent("cqs:changed"));
      window.dispatchEvent(new CustomEvent("claims:changed"));
      setExpandedCQ(null);
      setSearchQuery((prev) => ({ ...prev, [cqKey]: "" }));
      setSearchResults((prev) => ({ ...prev, [cqKey]: [] }));
    } catch (err) {
      console.error("[CriticalQuestionsV3] attach error:", err);
      alert("Failed to attach claim. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const handleSearch = async (cqKey: string, query: string) => {
    setSearchQuery((prev) => ({ ...prev, [cqKey]: query }));
    if (query.length < 2) {
      setSearchResults((prev) => ({ ...prev, [cqKey]: [] }));
      return;
    }

    setSearchLoading(cqKey);
    const results = await trySearchClaims(query);
    setSearchResults((prev) => ({ ...prev, [cqKey]: results }));
    setSearchLoading(null);
  };

  const openQuickCompose = (schemeKey: string, cqKey: string) => {
    setQuickCQKey(cqKey);
    setQuickDialogOpen(true);
    setQuickText("");
  };

  const handleQuickSubmit = async () => {
    if (!quickText.trim() || !quickCQKey || !deliberationId) return;

    setPosting(true);
    try {
      const r = await fetch("/api/claims", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          deliberationId,
          authorId: createdById || "",
          text: quickText.trim(),
        }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      const newId = j.claim?.id || j.id;

      const schemeKey = cqData?.schemes.find((s) =>
        s.cqs.some((c) => c.key === quickCQKey)
      )?.key;
      if (!schemeKey) throw new Error("Scheme not found");

      await attachWithAttacker(schemeKey, quickCQKey, newId);
      setQuickDialogOpen(false);
      setQuickText("");
      setQuickCQKey(null);
    } catch (err) {
      console.error("[CriticalQuestionsV3] quick compose error:", err);
      alert("Failed to create claim. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const openPicker = (cqKey: string) => {
    setPickerCQKey(cqKey);
    setPickerOpen(true);
  };

  const handlePickerSelect = async (item: { id: string }) => {
    if (!pickerCQKey) return;
    const schemeKey = cqData?.schemes.find((s) =>
      s.cqs.some((c) => c.key === pickerCQKey)
    )?.key;
    if (!schemeKey) return;

    await attachWithAttacker(schemeKey, pickerCQKey, item.id);
    setPickerOpen(false);
    setPickerCQKey(null);
  };

  // Filtering
  const filteredSchemes = useMemo(() => {
    if (!cqData?.schemes) return [];
    let schemes = cqData.schemes;

    if (prefilterKeys && prefilterKeys.length > 0) {
      schemes = schemes
        .map((s) => ({
          ...s,
          cqs: s.cqs.filter((c) => prefilterKeys.includes(c.key)),
        }))
        .filter((s) => s.cqs.length > 0);
    }

    return schemes;
  }, [cqData, prefilterKeys]);

  const attachedMap = useMemo(() => {
    const map: Record<string, { id: string; text: string; count: number }[]> =
      {};
    if (!attachData?.attachments) return map;

    for (const att of attachData.attachments) {
      const key = att.cqKey;
      if (!map[key]) map[key] = [];
      map[key].push({
        id: att.attackerClaim?.id || "",
        text: att.attackerClaim?.text || "",
        count: att._count?.attackerClaim || 0,
      });
    }
    return map;
  }, [attachData]);

  if (cqError) {
    return (
      <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-900">
              Failed to Load Critical Questions
            </p>
            <p className="text-xs text-red-700 mt-1">
              {cqError?.message || "Unknown error"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!cqData) {
    return (
      <div className="space-y-3">
        <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
        <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
        <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (filteredSchemes.length === 0) {
    return (
      <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-xl text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-200 mb-3">
          <HelpCircle className="w-6 h-6 text-slate-500" />
        </div>
        <p className="text-sm font-semibold text-slate-700">
          No Critical Questions
        </p>
        <p className="text-xs text-slate-500 mt-1">
          There are no critical questions defined for this scheme.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto px-3 py-2 custom-scrollbar">
      {filteredSchemes.map((scheme) => (
        <div key={scheme.key} className="space-y-2 border border-slate-200 p-2 rounded-xl">
          <div className="flex items-center gap-3 ">
            <div className="p-2 rounded-lg bg-indigo-100">
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900">
                {scheme.title}
              </h4>
              <p className="text-xs text-slate-600">
                {scheme.cqs.filter((c) => c.satisfied).length} /{" "}
                {scheme.cqs.length} satisfied
              </p>
            </div>
          </div>

          <div className="space-y-2  ">
            {scheme.cqs.map((cq) => {
              const isExpanded = expandedCQ === cq.key;
              const attached = attachedMap[cq.key] || [];
              const suggestion = suggestionForCQ(cq.key, cq.text);

              return (
                <div
                  key={cq.key}
                  className={`
                    rounded-xl border-2 transition-all duration-300 p-1
                    ${
                      cq.satisfied
                        ? "border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-emerald-100/50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                    }
                  `}
                >
                  <div className="px-3 py-2">
                    <button
                      onClick={() => setExpandedCQ(isExpanded ? null : cq.key)}
                      className="w-full flex items-start gap-3 text-left"
                    >
                      <div className="mt-0.5 shrink-0">
                        {cq.satisfied ? (
                          <div className="p-0 rounded-full bg-emerald-200">
                            <CheckCircle2
                              className="w-5 h-5 text-emerald-700"
                              strokeWidth={2.5}
                            />
                          </div>
                        ) : (
                          <div className="p-0 rounded-full bg-slate-100">
                            <Circle
                              className="w-5 h-5 text-slate-400"
                              strokeWidth={2}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium leading-relaxed ${
                            cq.satisfied ? "text-emerald-900" : "text-slate-800"
                          }`}
                        >
                          {cq.text}
                        </p>
                        {cq.satisfied && cq.groundsText && (
                          <div className="mt-2 p-3 bg-white rounded-lg border border-emerald-200">
                            <div className="flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                              <p className="text-xs text-slate-700 leading-relaxed">
                                {cq.groundsText}
                              </p>
                            </div>
                          </div>
                        )}
                        {attached.length > 0 && (
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <Link2 className="w-4 h-4 text-indigo-500" />
                            <span className="font-medium text-indigo-700">
                              {attached.length} counter-claim
                              {attached.length !== 1 ? "s" : ""} attached
                            </span>
                          </div>
                        )}
                      </div>
                      <div
                        className={`transition-transform duration-300 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      >
                        <ChevronDown
                          className={`w-5 h-5 ${
                            cq.satisfied ? "text-emerald-600" : "text-slate-400"
                          }`}
                        />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-2 animate-in slide-in-from-top-0 duration-400">
                        {/* Quick Satisfaction Toggle */}
                        <div className="flex items-center justify-between px-3 py-1.5 bg-white rounded-lg border border-indigo-200">
                          <span className="text-sm font-medium text-slate-700">
                            Mark as {cq.satisfied ? "unsatisfied" : "satisfied"}
                          </span>
                          <button
                            onClick={() =>
                              toggleCQ(scheme.key, cq.key, !cq.satisfied)
                            }
                            className={
                              cq.satisfied
                                ? "btnv2--ghost rounded-lg px-2 py-1 border-slate-300 bg-slate-100 text-slate-800 text-xs hover:bg-slate-200"
                                : "btnv2--ghost rounded-lg px-2 py-1 text-xs "
                            }
                          >
                            {cq.satisfied ? "Unmark" : "Mark Satisfied"}
                          </button>
                        </div>

                        {/* Grounds Input */}
                        {!cq.satisfied && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <MessageCircle className="w-4 h-4 text-indigo-600" />
                              <label className="text-sm font-semibold text-slate-900">
                                Provide Grounds
                              </label>
                            </div>
                            <Textarea
                              placeholder="Explain why this question is satisfied..."
                              value={groundsInput[cq.key] || ""}
                              onChange={(e) =>
                                setGroundsInput((prev) => ({
                                  ...prev,
                                  [cq.key]: e.target.value,
                                }))
                              }
                              className="text-sm articlesearchfield resize-none"
                              rows={3}
                            />
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500">
                                {(groundsInput[cq.key] || "").length} characters
                              </span>
                              <Button
                                size="sm"
                                onClick={() =>
                                  resolveViaGrounds(
                                    scheme.key,
                                    cq.key,
                                    groundsInput[cq.key] || ""
                                  )
                                }
                                disabled={!(groundsInput[cq.key] || "").trim()}
                                className="flex items-center gap-2"
                              >
                                <Send className="w-4 h-4" />
                                Submit Grounds
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Attach Counter-Claim */}
                        <div className="space-y-2 pt-2 border-t border-slate-400/40">
                          <div className="flex items-center gap-2">
                            <Link2 className="w-4 h-4 text-indigo-600" />
                            <label className="text-sm font-semibold text-slate-900">
                              Attach Counter-Claim
                            </label>
                          </div>

                          {attached.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                                Currently Attached
                              </p>
                              {attached.map((a) => (
                                <div
                                  key={a.id}
                                  className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg"
                                >
                                  <p className="text-sm text-indigo-900">
                                    {a.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                openQuickCompose(scheme.key, cq.key)
                              }
                              className="flex flex-1 btnv2--ghost bg-white
                              rounded-lg px-3 py-2 text-sm"
                            >
                              <div className="flex  items-center align-center ">
                                <Plus className="w-4 h-4 mr-2" />
                                Create New
                              </div>
                            </button>
                            <button
                              onClick={() => openPicker(cq.key)}
                              className="flex btnv2--ghost flex-1 rounded-lg px-3 py-2 text-sm bg-white"
                            >
                              <div className="flex  items-center align-center ">
                                <Search className="w-4 h-4 mr-2" />
                                Find Existing
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Legal Moves (if available) */}
                        {deliberationId && movesData && (
                          <div className="pt-3 border-t border-slate-200">
                            <button
                              onClick={() =>
                                setExpandedMoves(
                                  expandedMoves === cq.key ? null : cq.key
                                )
                              }
                              className="w-full flex items-center justify-between text-sm font-semibold text-slate-700 hover:text-slate-900"
                            >
                              <span>Show Legal Moves</span>
                              {expandedMoves === cq.key ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            {expandedMoves === cq.key && (
                              <div className="mt-3">
                                <LegalMoveChips
                                  deliberationId={deliberationId}
                                  targetType={targetType as TargetType}
                                  targetId={targetId}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Quick Compose Dialog */}
      <Dialog open={quickDialogOpen} onOpenChange={setQuickDialogOpen}>
        <DialogContent className="max-w-2xl bg-sky-200/70 backdrop-blur-lg">
          <DialogHeader>
            <DialogTitle>Create Counter-Claim</DialogTitle>
            <DialogDescription>
              Write a new claim that addresses this critical question.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter your counter-claim..."
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            className="articlesearchfield min-h-[120px]"
            autoFocus
          />
          <DialogFooter className="gap-2">
            <button className="btnv2--ghost px-2 py-1 bg-slate-200 text-sm rounded-lg" onClick={() => setQuickDialogOpen(false)}>
              Cancel
            </button>
            <button
            className="btnv2--ghost px-2 py-1 text-sm bg-white hover:bg-slate-100 rounded-lg"
              onClick={handleQuickSubmit}
              disabled={!quickText.trim() || posting}
            >
              {posting ? "Creating..." : "Create & Attach"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scheme Picker */}
      <SchemeComposerPicker
        kind="claim"
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handlePickerSelect}
      />
    </div>
  );
}
