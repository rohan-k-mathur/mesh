//components/arguments/SchemeSpecificCQsModal.tsx
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Target,
  Shield,
  ShieldX,
  ShieldAlert,
  Sparkles,
  Zap,
  MessageSquare,
  Activity,
  Send,
} from "lucide-react";
import { ClaimPicker } from "@/components/claims/ClaimPicker";
import { askCQ, getArgumentCQsWithProvenance } from "@/lib/client/aifApi";
import CQResponseForm from "@/components/claims/CQResponseForm";
import CQResponsesList from "@/components/claims/CQResponsesList";
import CQActivityFeed from "@/components/claims/CQActivityFeed";
import CQEndorseModal from "@/components/claims/CQEndorseModal";

type CQItem = {
  id?: string; // CQStatus ID for Phase 3 community responses
  cqKey: string;
  text: string;
  status: "open" | "answered";
  attackType: string;
  targetScope: string;
  inherited?: boolean; // Phase 6: Whether this CQ comes from a parent scheme
  sourceSchemeId?: string; // Phase 6: Parent scheme ID
  sourceSchemeName?: string; // Phase 6: Parent scheme name
  sourceSchemeKey?: string; // Phase 6: Parent scheme key
};

type AifMeta = {
  scheme?: { id: string; key: string; name: string } | null;
  conclusion?: { id: string; text: string } | null;
  premises?: Array<{ id: string; text: string; isImplicit?: boolean }> | null;
};

export function SchemeSpecificCQsModal({
  argumentId,
  deliberationId,
  authorId,
  cqs,
  meta,
  onRefresh,
  triggerButton,
}: {
  argumentId: string;
  deliberationId: string;
  authorId: string;
  cqs: CQItem[];
  meta?: AifMeta;
  onRefresh: () => void;
  triggerButton?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [expandedCQ, setExpandedCQ] = React.useState<string | null>(null);
  const [localCqs, setLocalCqs] = React.useState<CQItem[]>(cqs);
  const [posting, setPosting] = React.useState<string | null>(null);

  // Phase 6: Provenance data
  const [provenanceData, setProvenanceData] = React.useState<{
    ownCQs: CQItem[];
    inheritedCQs: CQItem[];
    allCQs: CQItem[];
    totalCount: number;
    ownCount: number;
    inheritedCount: number;
    inheritancePath: Array<{ id: string; name: string; key: string }>;
  } | null>(null);
  const [loadingProvenance, setLoadingProvenance] = React.useState(false);

  // Phase 3 modal states
  const [responseFormOpen, setResponseFormOpen] = React.useState(false);
  const [selectedCQForResponse, setSelectedCQForResponse] = React.useState<CQItem | null>(null);
  const [selectedResponseForEndorse, setSelectedResponseForEndorse] = React.useState<string | null>(null);
  const [endorseModalOpen, setEndorseModalOpen] = React.useState(false);

  // Objection form states per CQ
  const [rebutClaim, setRebutClaim] = React.useState<Record<string, { id: string; text: string } | null>>({});
  const [undercutText, setUndercutText] = React.useState<Record<string, string>>({});
  const [underminePremise, setUnderminePremise] = React.useState<Record<string, string>>({});
  const [undermineClaim, setUndermineClaim] = React.useState<Record<string, { id: string; text: string } | null>>({});

  // Sync local CQs when prop changes
  React.useEffect(() => {
    setLocalCqs(cqs);
  }, [cqs]);

  // Phase 6: Fetch provenance data when modal opens
  React.useEffect(() => {
    if (open && !provenanceData && !loadingProvenance) {
      setLoadingProvenance(true);
      getArgumentCQsWithProvenance(argumentId)
        .then((data) => {
          setProvenanceData(data);
          // Merge provenance data into localCqs
          const mergedCqs = cqs.map((cq) => {
            const provenanceCQ = data.allCQs.find((p: CQItem) => p.cqKey === cq.cqKey);
            if (provenanceCQ) {
              return {
                ...cq,
                inherited: provenanceCQ.inherited,
                sourceSchemeId: provenanceCQ.sourceSchemeId,
                sourceSchemeName: provenanceCQ.sourceSchemeName,
                sourceSchemeKey: provenanceCQ.sourceSchemeKey,
              };
            }
            return cq;
          });
          setLocalCqs(mergedCqs);
        })
        .catch((err) => {
          console.error("[SchemeSpecificCQsModal] Failed to load provenance:", err);
        })
        .finally(() => {
          setLoadingProvenance(false);
        });
    }
  }, [open, argumentId, cqs, provenanceData, loadingProvenance]);

  const handleAskCQ = async (cqKey: string) => {
    try {
      await askCQ(argumentId, cqKey, { authorId, deliberationId });
      setLocalCqs((prev) =>
        prev.map((c) => (c.cqKey === cqKey ? { ...c, status: "open" } : c))
      );
    } catch (err) {
      console.error("[SchemeSpecificCQsModal] Failed to ask CQ:", err);
    }
  };

  const postObjection = async (cq: CQItem) => {
    if (posting) return;

    const cqKey = cq.cqKey;
    setPosting(cqKey);

    try {
      if (cq.attackType === "REBUTS") {
        const claim = rebutClaim[cqKey];
        if (!claim) {
          alert("Please select a counter-claim");
          return;
        }

        await fetch("/api/ca", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            deliberationId,
            conflictingClaimId: claim.id,
            conflictedClaimId: meta?.conclusion?.id ?? "",
            legacyAttackType: "REBUTS",
            legacyTargetScope: "conclusion",
            metaJson: {
              schemeKey: meta?.scheme?.key,
              cqKey,
              cqText: cq.text,
              source: "scheme-specific-cqs-modal-rebut",
            },
          }),
        });

        // Clear form
        setRebutClaim((prev) => ({ ...prev, [cqKey]: null }));
      } else if (cq.attackType === "UNDERCUTS") {
        const text = undercutText[cqKey]?.trim();
        if (!text) {
          alert("Please enter an exception or rule-defeater");
          return;
        }

        // Create exception claim
        const r = await fetch("/api/claims", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            deliberationId,
            authorId,
            text,
          }),
        });
        const j = await r.json();
        const exceptionClaimId = j.claim?.id || j.id;

        // Post undercut
        await fetch("/api/ca", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            deliberationId,
            conflictingClaimId: exceptionClaimId,
            conflictedArgumentId: argumentId,
            legacyAttackType: "UNDERCUTS",
            legacyTargetScope: "inference",
            metaJson: {
              schemeKey: meta?.scheme?.key,
              cqKey,
              cqText: cq.text,
              source: "scheme-specific-cqs-modal-undercut",
            },
          }),
        });

        // Clear form
        setUndercutText((prev) => ({ ...prev, [cqKey]: "" }));
      } else if (cq.attackType === "UNDERMINES") {
        const premiseId = underminePremise[cqKey] || meta?.premises?.[0]?.id;
        const claim = undermineClaim[cqKey];

        if (!premiseId) {
          alert("Please select a premise to undermine");
          return;
        }
        if (!claim) {
          alert("Please select a contradicting claim");
          return;
        }

        await fetch("/api/ca", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            deliberationId,
            conflictingClaimId: claim.id,
            conflictedClaimId: premiseId,
            legacyAttackType: "UNDERMINES",
            legacyTargetScope: "premise",
            metaJson: {
              schemeKey: meta?.scheme?.key,
              cqKey,
              cqText: cq.text,
              source: "scheme-specific-cqs-modal-undermine",
            },
          }),
        });

        // Clear form
        setUndermineClaim((prev) => ({ ...prev, [cqKey]: null }));
        setUnderminePremise((prev) => ({ ...prev, [cqKey]: "" }));
      }

      // Success: fire events and refresh
      window.dispatchEvent(new CustomEvent("claims:changed", { detail: { deliberationId } } as any));
      window.dispatchEvent(new CustomEvent("arguments:changed", { detail: { deliberationId } } as any));
      
      setExpandedCQ(null);
      onRefresh();
    } catch (err) {
      console.error("[SchemeSpecificCQsModal] Failed to post objection:", err);
      alert("Failed to post objection. Please try again.");
    } finally {
      setPosting(null);
    }
  };

  const answeredCount = localCqs.filter((c) => c.status === "answered").length;
  const totalCount = localCqs.length;

  const defaultTrigger = (
    <button
      className="
        inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
        bg-indigo-50 text-indigo-700 border border-indigo-200
        hover:bg-indigo-100 hover:border-indigo-300
        transition-all duration-200 shadow-sm hover:shadow
      "
    >
      <HelpCircle className="w-4 h-4" />
      Critical Questions
      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-indigo-200 text-indigo-800 text-[10px] font-bold">
        {answeredCount}/{totalCount}
      </span>
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100">
        <DialogHeader className="space-y-2 pb-4 border-b border-slate-200">
          <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200">
              <HelpCircle className="w-6 h-6 text-indigo-700" />
            </div>
            Critical Questions
          </DialogTitle>
          <p className="text-sm text-slate-600 leading-relaxed">
            These questions test the strength of the argument scheme. Answer them as objections to challenge the argument.
          </p>
        </DialogHeader>

        {/* Scheme info */}
        {meta?.scheme && (
          <div className="p-4 bg-white rounded-xl border-2 border-indigo-200 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-100">
                <Target className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1">
                  Argument Scheme
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {meta.scheme.name}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 mb-1">Progress</div>
                <div className="text-lg font-bold text-indigo-600">
                  {answeredCount}/{totalCount}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phase 6: Provenance Summary */}
        {provenanceData && provenanceData.inheritedCount > 0 && (
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border-2 border-emerald-200 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-200">
                <Sparkles className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
                  CQ Inheritance
                </div>
                <div className="text-sm text-emerald-900">
                  <span className="font-bold">{provenanceData.ownCount} own</span>
                  {" + "}
                  <span className="font-bold">{provenanceData.inheritedCount} inherited</span>
                  {" = "}
                  <span className="font-bold">{provenanceData.totalCount} total</span>
                </div>
                {provenanceData.inheritancePath.length > 0 && (
                  <div className="mt-2 text-xs text-emerald-800">
                    Inherited from: {provenanceData.inheritancePath.map((p) => p.name).join(" → ")}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CQ List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
          {localCqs.length === 0 ? (
            <div className="p-6 bg-white rounded-xl border-2 border-slate-200 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3">
                <HelpCircle className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No critical questions</p>
              <p className="text-xs text-slate-500 mt-1">
                This argument scheme has no defined critical questions yet.
              </p>
            </div>
          ) : (
            localCqs.map((cq) => {
              const isExpanded = expandedCQ === cq.cqKey;
              const isPosting = posting === cq.cqKey;

              // Icon and theme based on attack type
              const AttackIcon =
                cq.attackType === "REBUTS"
                  ? ShieldX
                  : cq.attackType === "UNDERCUTS"
                  ? ShieldAlert
                  : Shield;

              const theme =
                cq.attackType === "REBUTS"
                  ? "rose"
                  : cq.attackType === "UNDERCUTS"
                  ? "amber"
                  : "slate";

              const themeClasses = {
                rose: {
                  border: "border-rose-200",
                  bg: "bg-gradient-to-br from-rose-50 to-rose-100",
                  badge: "bg-rose-100 text-rose-700 border-rose-200",
                  button: "bg-rose-600 hover:bg-rose-700 text-white",
                },
                amber: {
                  border: "border-amber-200",
                  bg: "bg-gradient-to-br from-amber-50 to-amber-100",
                  badge: "bg-amber-100 text-amber-700 border-amber-200",
                  button: "bg-amber-600 hover:bg-amber-700 text-white",
                },
                slate: {
                  border: "border-slate-300",
                  bg: "bg-gradient-to-br from-slate-50 to-slate-100",
                  badge: "bg-slate-200 text-slate-700 border-slate-300",
                  button: "bg-slate-700 hover:bg-slate-800 text-white",
                },
              };

              const t = themeClasses[theme];

              return (
                <div
                  key={cq.cqKey}
                  className={`
                    rounded-xl border-2 transition-all duration-300
                    ${
                      cq.status === "answered"
                        ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100"
                        : `${t.border} ${t.bg}`
                    }
                  `}
                >
                  <div className="p-4">
                    <button
                      onClick={() => setExpandedCQ(isExpanded ? null : cq.cqKey)}
                      className="w-full flex items-start gap-3 text-left"
                    >
                      <div className="mt-0.5 shrink-0">
                        {cq.status === "answered" ? (
                          <div className="p-1 rounded-full bg-emerald-200">
                            <CheckCircle2 className="w-5 h-5 text-emerald-700" strokeWidth={2.5} />
                          </div>
                        ) : (
                          <div className="p-1 rounded-full bg-amber-100">
                            <AlertTriangle className="w-5 h-5 text-amber-600" strokeWidth={2} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start gap-2 mb-2 flex-wrap">
                          <span
                            className={`
                              inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                              text-[10px] font-bold uppercase tracking-wide border
                              ${t.badge}
                            `}
                          >
                            <AttackIcon className="w-3 h-3" />
                            {cq.attackType}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                            {cq.targetScope}
                          </span>
                          {/* Phase 6: Provenance badge */}
                          {cq.inherited && cq.sourceSchemeName && (
                            <span
                              className="
                                inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                text-[10px] font-semibold tracking-wide border
                                bg-emerald-100 text-emerald-700 border-emerald-300
                              "
                              title={`Inherited from ${cq.sourceSchemeName} (${cq.sourceSchemeKey})`}
                            >
                              <Sparkles className="w-3 h-3" />
                              Inherited from {cq.sourceSchemeName}
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-sm font-medium leading-relaxed ${
                            cq.status === "answered" ? "text-emerald-900" : "text-slate-800"
                          }`}
                        >
                          {cq.text}
                        </p>
                      </div>

                      <div
                        className={`transition-transform duration-300 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      >
                        <ChevronDown
                          className={`w-5 h-5 ${
                            cq.status === "answered" ? "text-emerald-600" : "text-slate-400"
                          }`}
                        />
                      </div>
                    </button>

                    {/* Mark as asked button - outside the toggle button */}
                    {cq.status === "open" && !isExpanded && (
                      <div className="px-4 pb-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAskCQ(cq.cqKey);
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                        >
                          Mark as asked
                        </button>
                      </div>
                    )}

                    {/* Expanded objection form */}
                    {isExpanded && (
                      <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-300 pt-4 border-t border-slate-200">
                        <div className="p-3 bg-white/70 rounded-lg border border-slate-200">
                          <p className="text-xs text-slate-700 leading-relaxed">
                            <strong>How to answer:</strong> Provide an objection that addresses this question.
                            Your answer will be posted as a {cq.attackType.toLowerCase()} attacking the{" "}
                            {cq.targetScope}.
                          </p>
                        </div>

                        {/* REBUTS form */}
                        {cq.attackType === "REBUTS" && (
                          <div className="space-y-3">
                            <label className="block text-sm font-semibold text-slate-900">
                              Select Counter-Claim (contradicts conclusion)
                            </label>
                            <ClaimPicker
                              deliberationId={deliberationId}
                              authorId={authorId}
                              label={rebutClaim[cq.cqKey]?.text || "Select or create counter-claim..."}
                              onPick={(claim) =>
                                setRebutClaim((prev) => ({ ...prev, [cq.cqKey]: claim }))
                              }
                            />
                            {meta?.conclusion && (
                              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="text-xs font-semibold text-slate-700 mb-1">
                                  Target Conclusion
                                </div>
                                <div className="text-xs text-slate-600">{meta.conclusion.text}</div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* UNDERCUTS form */}
                        {cq.attackType === "UNDERCUTS" && (
                          <div className="space-y-3">
                            <label className="block text-sm font-semibold text-slate-900">
                              Exception or Rule-Defeater
                            </label>
                            <textarea
                              value={undercutText[cq.cqKey] || ""}
                              onChange={(e) =>
                                setUndercutText((prev) => ({ ...prev, [cq.cqKey]: e.target.value }))
                              }
                              placeholder="Explain why the inference doesn't hold in this case..."
                              className="
                                w-full px-3 py-2 rounded-lg border-2 border-slate-300 bg-white
                                focus:border-amber-400 focus:ring-2 focus:ring-amber-100
                                transition-all duration-200 text-sm resize-none
                              "
                              rows={3}
                            />
                            <div className="text-xs text-slate-500">
                              {(undercutText[cq.cqKey] || "").length} characters
                            </div>
                          </div>
                        )}

                        {/* UNDERMINES form */}
                        {cq.attackType === "UNDERMINES" && (
                          <div className="space-y-3">
                            <label className="block text-sm font-semibold text-slate-900">
                              Select Premise to Undermine
                            </label>
                            <select
                              value={underminePremise[cq.cqKey] || meta?.premises?.[0]?.id || ""}
                              onChange={(e) =>
                                setUnderminePremise((prev) => ({ ...prev, [cq.cqKey]: e.target.value }))
                              }
                              className="
                                w-full px-3 py-2 rounded-lg border-2 border-slate-300 bg-white
                                focus:border-slate-400 focus:ring-2 focus:ring-slate-100
                                transition-all duration-200 text-sm
                              "
                            >
                              {(meta?.premises || []).map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.text}
                                </option>
                              ))}
                            </select>

                            <label className="block text-sm font-semibold text-slate-900 mt-3">
                              Select Contradicting Claim
                            </label>
                            <ClaimPicker
                              deliberationId={deliberationId}
                              authorId={authorId}
                              label={undermineClaim[cq.cqKey]?.text || "Select or create contradicting claim..."}
                              onPick={(claim) =>
                                setUndermineClaim((prev) => ({ ...prev, [cq.cqKey]: claim }))
                              }
                            />
                          </div>
                        )}

                        {/* Submit button */}
                        <button
                          className={`
                            w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                            text-sm font-bold shadow-md hover:shadow-lg
                            disabled:opacity-50 disabled:cursor-not-allowed
                            transition-all duration-200 active:scale-95
                            ${t.button}
                          `}
                          disabled={
                            isPosting ||
                            (cq.attackType === "REBUTS" && !rebutClaim[cq.cqKey]) ||
                            (cq.attackType === "UNDERCUTS" && !undercutText[cq.cqKey]?.trim()) ||
                            (cq.attackType === "UNDERMINES" &&
                              (!undermineClaim[cq.cqKey] || !underminePremise[cq.cqKey]))
                          }
                          onClick={() => postObjection(cq)}
                        >
                          {isPosting ? (
                            <>
                              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                              Posting objection...
                            </>
                          ) : (
                            <>
                              
                              Post {cq.attackType} Objection
                            </>
                          )}
                        </button>

                        {/* Phase 3 Community Response System */}
                        {cq.id && (
                          <div className="mt-6 space-y-4 pt-4 border-t-2 border-sky-200">
                            {/* Section Header */}
                            <div className="flex items-center gap-2 mb-3">
                              <MessageSquare className="w-5 h-5 text-sky-600" />
                              <h4 className="text-sm font-bold text-sky-900">
                                Community Responses
                              </h4>
                            </div>

                            {/* Response Form Button */}
                            <button
                              onClick={() => {
                                setSelectedCQForResponse(cq);
                                setResponseFormOpen(true);
                              }}
                              className="
                                w-full inline-flex items-center justify-center gap-2 px-4 py-3
                                bg-gradient-to-br from-sky-500 to-cyan-600
                                text-white rounded-xl font-semibold text-sm
                                hover:from-sky-600 hover:to-cyan-700
                                shadow-md hover:shadow-lg
                                transition-all duration-200 active:scale-95
                              "
                            >
                              <Send className="w-4 h-4" />
                              Submit Your Response
                            </button>

                            {/* Responses List */}
                            <div className="bg-white rounded-xl border border-slate-200 overflow-y-auto">
                              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                                <Activity className="w-4 h-4 text-slate-600" />
                                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                                  All Responses
                                </h5>
                              </div>
                              <CQResponsesList
                                cqStatusId={cq.id}
                                currentUserId={authorId}
                                canModerate={false}
                                onEndorse={(responseId: string) => {
                                  setSelectedResponseForEndorse(responseId);
                                  setEndorseModalOpen(true);
                                }}
                              />
                            </div>

                            {/* Activity Timeline */}
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 overflow-hidden">
                              <div className="flex items-center gap-2 px-4 py-3 bg-indigo-100/50 border-b border-indigo-200">
                                <Activity className="w-4 h-4 text-indigo-600" />
                                <h5 className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
                                  Recent Activity
                                </h5>
                              </div>
                              <CQActivityFeed cqStatusId={cq.id} limit={5} />
                            </div>
                          </div>
                        )}

                        {/* Legacy Objection Notice */}
                        {!cq.id && cq.status === "open" && (
                          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-xs text-amber-800">
                              <strong>Note:</strong> Mark this question as "asked" to enable community responses.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>

      {/* Phase 3 CQ Response Form Modal */}
      {selectedCQForResponse && selectedCQForResponse.id && (
        <CQResponseForm
          open={responseFormOpen}
          onOpenChange={setResponseFormOpen}
          cqStatusId={selectedCQForResponse.id}
          cqText={selectedCQForResponse.text}
          onSuccess={() => {
            setResponseFormOpen(false);
            onRefresh(); // Refresh CQs to show updated counts
          }}
        />
      )}

      {/* Phase 3 Endorse Modal */}
      {selectedResponseForEndorse && selectedCQForResponse && selectedCQForResponse.id && (
        <CQEndorseModal
          open={endorseModalOpen}
          onOpenChange={setEndorseModalOpen}
          responseId={selectedResponseForEndorse}
          cqStatusId={selectedCQForResponse.id}
          onSuccess={() => {
            setEndorseModalOpen(false);
            setSelectedResponseForEndorse(null);
            onRefresh();
          }}
        />
      )}
    </Dialog>
  );
}
