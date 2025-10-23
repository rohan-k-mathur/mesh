//components/arguments/AttackMenuProV2.tsx
"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldX,
  ShieldAlert,
  Shield,
  Target,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Swords,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Zap,
  CheckCircle2,
  Users,
} from "lucide-react";
import { SchemeComposerPicker } from "../SchemeComposerPicker";
import CriticalQuestionsV2 from "@/components/claims/CriticalQuestionsV2";
import { NonCanonicalResponseForm } from "@/components/agora/NonCanonicalResponseForm";
import { CommunityResponsesTab } from "@/components/agora/CommunityResponsesTab";
import { CommunityResponseBadge } from "@/components/agora/CommunityResponseBadge";
import { NonCanonicalResponseFormLight } from "../agora/NonCanonicalResponseFormLight";
type ClaimRef = { id: string; text: string };
type Prem = { id: string; text: string };

export function AttackMenuProV2({
  deliberationId,
  authorId,
  target,
  onDone,
}: {
  deliberationId: string;
  authorId: string;
  target: { id: string; conclusion: ClaimRef; premises: Prem[] };
  onDone?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"attacks" | "cqs" | "community">("attacks");
  const [helpDefendOpen, setHelpDefendOpen] = React.useState(false);
  const titleRef = React.useRef<HTMLDivElement | null>(null);

  const handleOpenChange = React.useCallback((v: boolean) => {
    setOpen(v);
    if (v) {
      requestAnimationFrame(() => setMounted(true));
    }
  }, []);

  const handleDone = React.useCallback(() => {
    setOpen(false);
    onDone?.();
  }, [onDone]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          className="
            inline-flex btnv2--sunset items-center gap-2 px-4 py-2 rounded-lg text-sm  rounded-lg 
          "
        >
          <Swords className="w-4 h-4" />
          Challenge Argument
        </button>
      </DialogTrigger>

      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto  custom-scrollbar
         bg-gradient-to-br from-slate-50 to-slate-100"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          titleRef.current?.focus();
        }}
      >
        <DialogHeader className="space-y-2 pb-4 border-b border-slate-200">
          <DialogTitle
            ref={titleRef as any}
            tabIndex={-1}
            className="outline-none text-2xl font-bold text-slate-900 flex items-center gap-3"
          >
            <div className="p-2 rounded-lg bg-gradient-to-br from-rose-50 to-rose-100">
              <Swords className="w-6 h-6 text-rose-700" />
            </div>
            Challenge This Argument
          </DialogTitle>
          <p className="text-sm text-slate-600 leading-relaxed">
            Choose a strategic attack type or explore critical questions to identify weaknesses.
          </p>
        </DialogHeader>

        {/* Target summary card */}
        <div className="p-4 bg-white rounded-xl border-2 border-slate-200 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-100">
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Target Argument
              </div>
              <div className="text-sm font-semibold text-slate-900 mb-2">
                {target.conclusion.text}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="font-medium">{target.premises.length} premise:{target.premises.length !== 1 ? 's' : ''}</span>
                <span className="font-light">{target.premises.map(p => p.text).join(", ")}</span>
                <span className="text-slate-400">•</span>
                {/* <span>ID: {target.id.slice(0, 20)}...</span> */}
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-3 w-full bg-slate-200">
            <TabsTrigger value="attacks" className="flex items-center gap-2 data-[state=active]:bg-slate-700">
              <Swords className="w-4 h-4" />
              Formal Attacks
            </TabsTrigger>
            {/* <TabsTrigger value="cqs" className="flex items-center gap-2 data-[state=active]:bg-white">
              <HelpCircle className="w-4 h-4" />
              Critical Questions
            </TabsTrigger> */}
            <TabsTrigger value="community" className="flex items-center gap-2 data-[state=active]:bg-slate-700">
              <Users className="w-4 h-4" />
              Community
              <CommunityResponseBadge
                targetId={target.id}
                targetType="argument"
                variant="compact"
              />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attacks" className="flex-1 overflow-y-auto mt-4 pr-2">
            {mounted ? (
              <AttackMenuContent
                deliberationId={deliberationId}
                authorId={authorId}
                target={target}
                onDone={handleDone}
              />
            ) : (
              <div className="space-y-4">
                <div className="h-32 rounded-xl border border-slate-200 bg-white animate-pulse" />
                <div className="h-32 rounded-xl border border-slate-200 bg-white animate-pulse" />
                <div className="h-32 rounded-xl border border-slate-200 bg-white animate-pulse" />
              </div>
            )}
          </TabsContent>

          {/* <TabsContent value="cqs" className="flex-1 overflow-y-auto mt-4 pr-2">
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100">
                    <HelpCircle className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-indigo-900 mb-1">
                      Critical Questions Guide
                    </h3>
                    <p className="text-xs text-indigo-700 leading-relaxed">
                      Critical questions reveal weaknesses in argument schemes. Unsatisfied questions
                      indicate where the argument may be vulnerable to challenge.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border-2 border-slate-200 p-4">
                <CriticalQuestionsV2
                  targetType="claim"
                  targetId={target.conclusion.id}
                  deliberationId={deliberationId}
                />
              </div>
            </div>
          </TabsContent> */}

          <TabsContent value="community" className="flex-1 overflow-y-auto mt-4 pr-2">
            <div className="space-y-4">
              {/* Info Banner */}
              <div className="p-4 bg-indigo-50 border-2 border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">
                      Community Defense
                    </h3>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Help strengthen this argument by providing supporting responses. Your contributions
                      will be submitted to the author for approval before becoming canonical moves.
                    </p>
                  </div>
                </div>
              </div>

              {/* Help Defend Button */}
              <button
                className="
                  w-fit btnv2 flex items-center justify-center mx-auto gap-2 px-5 py-3 rounded-xl
                  text-sm font-bold bg-gradient-to-b from-sky-500/70 to-sky-700/70 text-slate-100 
                  hover:from-blue-700 hover:to-blue-800
                  transition-all duration-200 shadow-md hover:shadow-lg active:scale-95
                "
                onClick={() => setHelpDefendOpen(true)}
              >
                <Users className="w-5 h-5" />
                Help Defend This Argument
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Community Responses List */}
              <div className="bg-white rounded-xl border-2 border-slate-200 p-4">
                <CommunityResponsesTab
                  targetId={target.id}
                  targetType="argument"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Help Defend Modal */}
      <NonCanonicalResponseFormLight
        open={helpDefendOpen}
        onOpenChange={setHelpDefendOpen}
        deliberationId={deliberationId}
        targetType="argument"
        targetId={target.id}
        targetLabel={`Argument: ${target.conclusion.text}`}
        onSuccess={() => {
          // Refresh community tab after submission
          setActiveTab("community");
        }}
      />
    </Dialog>
  );
}

function AttackMenuContent({
  deliberationId,
  authorId,
  target,
  onDone,
}: {
  deliberationId: string;
  authorId: string;
  target: { id: string; conclusion: ClaimRef; premises: Prem[] };
  onDone?: () => void;
}) {
  const [busy, setBusy] = React.useState<null | "REBUTS" | "UNDERCUTS" | "UNDERMINES">(null);
  const [expandedCard, setExpandedCard] = React.useState<string | null>(null);

  // Attack-specific states
  const [rebut, setRebut] = React.useState<ClaimRef | null>(null);
  const [undercutText, setUndercutText] = React.useState("");
  const [premiseId, setPremiseId] = React.useState(target.premises[0]?.id ?? "");
  const [undermine, setUndermine] = React.useState<ClaimRef | null>(null);

  // Picker modals
  const [pickerRebutOpen, setPickerRebutOpen] = React.useState(false);
  const [pickerUndermineOpen, setPickerUndermineOpen] = React.useState(false);

  React.useEffect(() => {
    setPremiseId(target.premises[0]?.id ?? "");
  }, [target.premises]);

  const createClaim = React.useCallback(
    async (text: string, signal?: AbortSignal) => {
      const r = await fetch("/api/claims", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ deliberationId, authorId, text }),
        signal,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.ok === false) throw new Error(j?.error || `HTTP ${r.status}`);
      return (j.claim?.id || j.id) as string;
    },
    [authorId, deliberationId]
  );

  const postAssumption = React.useCallback(
    async (
      argumentId: string,
      assumptionClaimId: string,
      role: "exception" | "presumption",
      meta?: any,
      signal?: AbortSignal
    ) => {
      const r = await fetch(`/api/arguments/${argumentId}/assumptions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          deliberationId,
          items: [{ assumptionId: assumptionClaimId, role, metaJson: meta ?? null }],
        }),
        signal,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.ok === false) throw new Error(j?.error || `HTTP ${r.status}`);
    },
    [deliberationId]
  );

  const postCA = React.useCallback(async (body: any, signal?: AbortSignal) => {
    const r = await fetch("/api/ca", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j?.error || `HTTP ${r.status}`);
    }
  }, []);

  const fire = React.useCallback(
    async (kind: "REBUTS" | "UNDERCUTS" | "UNDERMINES") => {
      if (busy) return;
      setBusy(kind);
      const ctrl = new AbortController();
      try {
        if (kind === "REBUTS") {
          if (!rebut || !rebut.id) return;

          // Try to detect CQ context
          let cqMetadata: any = {};
          try {
            const cqRes = await fetch(
              `/api/cqs?targetType=claim&targetId=${target.conclusion.id}`,
              { cache: "no-store", signal: ctrl.signal }
            );
            if (cqRes.ok) {
              const cqData = await cqRes.json();
              const schemes = cqData.schemes || [];
              for (const scheme of schemes) {
                for (const cq of scheme.cqs || []) {
                  if (!cq.satisfied && cq.key) {
                    cqMetadata = {
                      cqId: cq.key,
                      schemeKey: scheme.key,
                      cqText: cq.text,
                      cqContext: `Attacking: ${cq.text}`,
                    };
                    break;
                  }
                }
                if (cqMetadata.cqId) break;
              }
            }
          } catch (err) {
            console.warn("[AttackMenuProV2] Could not fetch CQs:", err);
          }

          await postCA(
            {
              deliberationId,
              conflictingClaimId: rebut.id,
              conflictedClaimId: target.conclusion.id,
              legacyAttackType: "REBUTS",
              legacyTargetScope: "conclusion",
              metaJson: cqMetadata,
            },
            ctrl.signal
          );
        } else if (kind === "UNDERCUTS") {
          const txt = undercutText.trim();
          if (!txt) return;
          const exceptionClaimId = await createClaim(txt, ctrl.signal);

          let cqMetadata: any = { descriptorKey: "exception" };
          const schemeKey = (target as any)?.schemeKey ?? null;
          if (schemeKey) {
            cqMetadata.schemeKey = schemeKey;
            try {
              const cqRes = await fetch(
                `/api/cqs?targetType=argument&targetId=${target.id}`,
                { cache: "no-store", signal: ctrl.signal }
              );
              if (cqRes.ok) {
                const cqData = await cqRes.json();
                const schemes = cqData.schemes || [];
                for (const scheme of schemes) {
                  for (const cq of scheme.cqs || []) {
                    if (
                      !cq.satisfied &&
                      cq.text &&
                      (cq.text.toLowerCase().includes("inference") ||
                        cq.text.toLowerCase().includes("reasoning") ||
                        cq.text.toLowerCase().includes("warrant"))
                    ) {
                      cqMetadata.cqId = cq.key;
                      cqMetadata.cqText = cq.text;
                      cqMetadata.cqContext = `Exception: ${cq.text}`;
                      break;
                    }
                  }
                  if (cqMetadata.cqId) break;
                }
              }
            } catch (err) {
              console.warn("[AttackMenuProV2] Could not fetch CQs for undercut:", err);
            }
          }

          await postCA(
            {
              deliberationId,
              conflictingClaimId: exceptionClaimId,
              conflictedArgumentId: target.id,
              legacyAttackType: "UNDERCUTS",
              legacyTargetScope: "inference",
              metaJson: cqMetadata,
            },
            ctrl.signal
          );

          await postAssumption(target.id, exceptionClaimId, "exception", cqMetadata, ctrl.signal);
        } else {
          if (!premiseId || !undermine || !undermine.id) return;

          let cqMetadata: any = {};
          try {
            const cqRes = await fetch(`/api/cqs?targetType=claim&targetId=${premiseId}`, {
              cache: "no-store",
              signal: ctrl.signal,
            });
            if (cqRes.ok) {
              const cqData = await cqRes.json();
              const schemes = cqData.schemes || [];
              for (const scheme of schemes) {
                for (const cq of scheme.cqs || []) {
                  if (!cq.satisfied && cq.key) {
                    cqMetadata = {
                      cqId: cq.key,
                      schemeKey: scheme.key,
                      cqText: cq.text,
                      cqContext: `Undermining premise: ${cq.text}`,
                    };
                    break;
                  }
                }
                if (cqMetadata.cqId) break;
              }
            }
          } catch (err) {
            console.warn("[AttackMenuProV2] Could not fetch CQs for undermine:", err);
          }

          await postCA(
            {
              deliberationId,
              conflictingClaimId: undermine.id,
              conflictedClaimId: premiseId,
              legacyAttackType: "UNDERMINES",
              legacyTargetScope: "premise",
              metaJson: cqMetadata,
            },
            ctrl.signal
          );
        }

        // Success notification
        window.dispatchEvent(new CustomEvent("claims:changed"));
        window.dispatchEvent(new CustomEvent("arguments:changed"));

        setRebut(null);
        setUndercutText("");
        setUndermine(null);
        onDone?.();
      } catch (err) {
        console.error(`[AttackMenuProV2] Failed to execute ${kind}:`, err);
        alert(`Failed to post attack: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setBusy(null);
        ctrl.abort();
      }
    },
    [
      busy,
      rebut,
      undercutText,
      premiseId,
      undermine,
      postCA,
      createClaim,
      postAssumption,
      deliberationId,
      target,
      onDone,
    ]
  );

  const isExpanded = (card: string) => expandedCard === card;
  const toggleExpand = (card: string) => setExpandedCard(isExpanded(card) ? null : card);

  return (
    <div className="space-y-4">
      {/* REBUT Card */}
      <div className="group relative rounded-xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100 overflow-hidden transition-all duration-300 hover:shadow-lg">
        <div className="p-5">
          <button
            onClick={() => toggleExpand("rebut")}
            className="w-full flex items-start justify-between gap-4 text-left"
          >
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 rounded-xl bg-white shadow-sm">
                <ShieldX className="w-6 h-6 text-rose-600" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-rose-900 mb-1 flex items-center gap-2">
                  Rebut
                  {rebut && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                </h3>
                <p className="text-sm text-rose-700 leading-relaxed">
                  Directly contradict the <span className="font-semibold">conclusion</span>
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-rose-200 text-rose-800 font-medium">
                    High Impact
                  </span>
                  <span className="text-rose-600">• Attacks the core claim</span>
                </div>
              </div>
            </div>
            <div className={`transition-transform duration-300 ${isExpanded("rebut") ? "rotate-180" : ""}`}>
              <ChevronDown className="w-5 h-5 text-rose-600" />
            </div>
          </button>

          {isExpanded("rebut") && (
            <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="p-4 bg-white rounded-lg border border-rose-100 shadow-sm">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-rose-700 uppercase tracking-wide mb-1">
                      Target Conclusion
                    </div>
                    <div className="text-sm text-slate-800 leading-relaxed">
                      {target.conclusion.text}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900">
                  Your Counter-Claim
                </label>
                <button
                  className="w-full px-4 py-3 rounded-lg border-2 border-rose-300 bg-white text-sm text-left hover:border-rose-400 hover:bg-rose-50 transition-all duration-200 shadow-sm"
                  onClick={() => setPickerRebutOpen(true)}
                >
                  {rebut ? (
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span className="text-slate-900">{rebut.text}</span>
                    </div>
                  ) : (
                    <span className="text-slate-500">Select or create a counter-claim...</span>
                  )}
                </button>

                <button
                  className="
                    w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                    text-sm font-bold bg-gradient-to-r from-rose-600 to-rose-700 text-white
                    hover:from-rose-700 hover:to-rose-800
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-rose-600
                    transition-all duration-200 shadow-md hover:shadow-lg active:scale-95
                  "
                  disabled={!rebut || !rebut.id || !!busy}
                  onClick={() => fire("REBUTS")}
                  aria-busy={busy === "REBUTS"}
                >
                  {busy === "REBUTS" ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      Posting rebuttal...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Post Rebuttal
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* UNDERCUT Card */}
      <div className="group relative rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 overflow-hidden transition-all duration-300 hover:shadow-lg">
        <div className="p-5">
          <button
            onClick={() => toggleExpand("undercut")}
            className="w-full flex items-start justify-between gap-4 text-left"
          >
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 rounded-xl bg-white shadow-sm">
                <ShieldAlert className="w-6 h-6 text-amber-600" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-amber-900 mb-1 flex items-center gap-2">
                  Undercut
                  {undercutText.trim() && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                </h3>
                <p className="text-sm text-amber-700 leading-relaxed">
                  Challenge the <span className="font-semibold">reasoning</span> by providing an exception
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-amber-200 text-amber-800 font-medium">
                    Strategic
                  </span>
                  <span className="text-amber-600">• Attacks the inference</span>
                </div>
              </div>
            </div>
            <div className={`transition-transform duration-300 ${isExpanded("undercut") ? "rotate-180" : ""}`}>
              <ChevronDown className="w-5 h-5 text-amber-600" />
            </div>
          </button>

          {isExpanded("undercut") && (
            <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3 p-4 bg-amber-100 border border-amber-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-900 leading-relaxed">
                  Explain why the premises don't necessarily lead to the conclusion in this case.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900">
                  Exception or Rule-Defeater
                </label>
                <textarea
                  value={undercutText}
                  onChange={(e) => setUndercutText(e.target.value)}
                  placeholder="E.g., 'However, the expert's opinion was given before key evidence emerged...'"
                  className="
                    w-full px-4 py-3 rounded-lg border-2 border-amber-300 bg-white
                    focus:border-amber-400 focus:ring-2 focus:ring-amber-100 focus:outline-none
                    transition-all duration-200 resize-none text-sm leading-relaxed
                    placeholder:text-slate-400
                  "
                  rows={4}
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{undercutText.length} characters</span>
                  {undercutText.trim() && (
                    <div className="flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Ready to post
                    </div>
                  )}
                </div>
              </div>

              <button
                className="
                  w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                  text-sm font-bold bg-gradient-to-r from-amber-600 to-amber-700 text-white
                  hover:from-amber-700 hover:to-amber-800
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-amber-600
                  transition-all duration-200 shadow-md hover:shadow-lg active:scale-95
                "
                disabled={!undercutText.trim() || !!busy}
                onClick={() => fire("UNDERCUTS")}
                aria-busy={busy === "UNDERCUTS"}
              >
                {busy === "UNDERCUTS" ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Posting undercut...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Post Undercut
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* UNDERMINE Card */}
      <div className="group relative rounded-xl border-2 border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden transition-all duration-300 hover:shadow-lg">
        <div className="p-5">
          <button
            onClick={() => toggleExpand("undermine")}
            className="w-full flex items-start justify-between gap-4 text-left"
          >
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 rounded-xl bg-white shadow-sm">
                <Shield className="w-6 h-6 text-slate-700" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                  Undermine
                  {undermine && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Contradict a specific <span className="font-semibold">premise</span>
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-slate-200 text-slate-800 font-medium">
                    Targeted
                  </span>
                  <span className="text-slate-600">• Attacks foundational claims</span>
                </div>
              </div>
            </div>
            <div className={`transition-transform duration-300 ${isExpanded("undermine") ? "rotate-180" : ""}`}>
              <ChevronDown className="w-5 h-5 text-slate-600" />
            </div>
          </button>

          {isExpanded("undermine") && (
            <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900">
                  Select Target Premise
                </label>
                <select
                  className="
                    w-full px-4 py-3 rounded-lg border-2 border-slate-300 bg-white
                    focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none
                    transition-all duration-200 text-sm font-medium
                  "
                  value={premiseId}
                  onChange={(e) => setPremiseId(e.target.value)}
                >
                  {target.premises.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.text}
                    </option>
                  ))}
                </select>
              </div>

              {premiseId && (
                <div className="p-4 bg-white border-2 border-slate-200 rounded-lg shadow-sm">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                        Target Premise
                      </div>
                      <div className="text-sm text-slate-800 leading-relaxed">
                        {target.premises.find((p) => p.id === premiseId)?.text}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900">
                  Your Contradicting Claim
                </label>
                <button
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 bg-white text-sm text-left hover:border-slate-400 hover:bg-slate-50 transition-all duration-200 shadow-sm"
                  onClick={() => setPickerUndermineOpen(true)}
                >
                  {undermine ? (
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span className="text-slate-900">{undermine.text}</span>
                    </div>
                  ) : (
                    <span className="text-slate-500">Select or create contradicting claim...</span>
                  )}
                </button>
              </div>

              <button
                className="
                  w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                  text-sm font-bold bg-gradient-to-r from-slate-700 to-slate-800 text-white
                  hover:from-slate-800 hover:to-slate-900
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-slate-700
                  transition-all duration-200 shadow-md hover:shadow-lg active:scale-95
                "
                disabled={!premiseId || !undermine || !undermine.id || !!busy}
                onClick={() => fire("UNDERMINES")}
                aria-busy={busy === "UNDERMINES"}
              >
                {busy === "UNDERMINES" ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Posting undermine...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Post Undermine
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Picker Modals */}
      <SchemeComposerPicker
        kind="claim"
        open={pickerRebutOpen}
        onClose={() => setPickerRebutOpen(false)}
        onPick={(it) => {
          setRebut({ id: it.id, text: it.label });
          setPickerRebutOpen(false);
        }}
      />
      <SchemeComposerPicker
        kind="claim"
        open={pickerUndermineOpen}
        onClose={() => setPickerUndermineOpen(false)}
        onPick={(it) => {
          setUndermine({ id: it.id, text: it.label });
          setPickerUndermineOpen(false);
        }}
      />
    </div>
  );
}
