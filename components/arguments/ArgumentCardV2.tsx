// components/arguments/ArgumentCardV2.tsx
"use client";
import * as React from "react";
import useSWR from "swr";
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  ShieldX,
  ShieldAlert,
  Shield,
  Target,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Loader2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AttackMenuPro } from "./AttackMenuPro";
import CriticalQuestions from "@/components/claims/CriticalQuestionsV2";
import { ArgumentCriticalQuestionsModal } from "./ArgumentCriticalQuestionsModal";
import { DialogueStateBadge } from "@/components/dialogue/DialogueStateBadge";
import { StaleArgumentBadge } from "@/components/arguments/StaleArgumentBadge";
import { ConfidenceDisplay } from "@/components/confidence/ConfidenceDisplay";

const fetcher = (url: string) => fetch(url).then(r => r.json());

type Prem = { id: string; text: string };

interface ArgumentCardV2Props {
  deliberationId: string;
  authorId: string;
  id: string;
  conclusion: { id: string; text: string };
  premises: Prem[];
  onAnyChange?: () => void;
  schemeKey?: string | null;
  schemeName?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  confidence?: number;
  dsMode?: boolean; // Dempster-Shafer mode toggle
}

// ============================================================================
// DESIGN TOKENS - Visual Language for Attack Types
// ============================================================================
const ATTACK_TYPES = {
  REBUTS: {
    label: "Rebuttal",
    icon: ShieldX,
    color: "rose",
    bgClass: "bg-rose-50",
    borderClass: "border-rose-200",
    textClass: "text-rose-700",
    hoverClass: "hover:bg-rose-100",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
    description: "Challenges the conclusion"
  },
  UNDERCUTS: {
    label: "Undercut",
    icon: ShieldAlert,
    color: "amber",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
    textClass: "text-amber-700",
    hoverClass: "hover:bg-amber-100",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    description: "Challenges the inference"
  },
  UNDERMINES: {
    label: "Undermine",
    icon: Shield,
    color: "slate",
    bgClass: "bg-slate-50",
    borderClass: "border-slate-200",
    textClass: "text-slate-700",
    hoverClass: "hover:bg-slate-100",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
    description: "Challenges a premise"
  }
} as const;

const DIALOGUE_STATE = {
  answered: {
    label: "Answered",
    icon: CheckCircle2,
    bgClass: "bg-emerald-50",
    borderClass: "border-emerald-200",
    textClass: "text-emerald-700",
    badgeClass: "bg-emerald-600 text-white"
  },
  challenged: {
    label: "Challenged",
    icon: AlertCircle,
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
    textClass: "text-amber-700",
    badgeClass: "bg-amber-600 text-white"
  },
  neutral: {
    label: "Active",
    icon: MessageSquare,
    bgClass: "bg-slate-50",
    borderClass: "border-slate-200",
    textClass: "text-slate-600",
    badgeClass: "bg-slate-500 text-white"
  }
} as const;

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function AttackBadge({ 
  type, 
  count, 
  dialogueState 
}: { 
  type: keyof typeof ATTACK_TYPES; 
  count: number;
  dialogueState?: "answered" | "challenged" | "neutral";
}) {
  const attack = ATTACK_TYPES[type];
  const Icon = attack.icon;
  const state = dialogueState ? DIALOGUE_STATE[dialogueState] : null;

  return (
    <div 
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border
        ${attack.bgClass} ${attack.borderClass} ${attack.textClass}
        text-xs font-medium transition-all duration-200
      `}
      title={`${attack.description} (${count})`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{count}</span>
      {state && (
        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${state.badgeClass}`}>
          {state.label === "Answered" ? "✓" : state.label === "Challenged" ? "!" : "◉"}
        </span>
      )}
    </div>
  );
}

function CQStatusPill({ 
  required, 
  satisfied, 
  type = "claim",
  onClick 
}: { 
  required: number; 
  satisfied: number;
  type?: "claim" | "argument";
  onClick?: () => void;
}) {
  const percentage = required > 0 ? Math.round((satisfied / required) * 100) : 0;
  const isComplete = percentage === 100;
  const colorClass = isComplete 
    ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" 
    : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100";

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border
        ${colorClass}
        text-xs font-medium transition-all duration-200
      `}
      title={`${satisfied}/${required} critical questions satisfied`}
    >
      {isComplete ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
      <span>{type === "claim" ? "Claim" : "Arg"} CQ {percentage}%</span>
    </button>
  );
}

function SectionHeader({ 
  title, 
  icon: Icon, 
  count, 
  expanded, 
  onToggle,
  badge 
}: { 
  title: string; 
  icon: React.ElementType; 
  count?: number;
  expanded: boolean; 
  onToggle: () => void;
  badge?: React.ReactNode;
}) {
  return (
    <button
      onClick={onToggle}
      className="
        w-full flex items-center justify-between px-4 py-2.5
        bg-slate-50 hover:bg-slate-100 border-b border-slate-200
        transition-colors duration-200
      "
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-600" />
        <span className="text-sm font-semibold text-slate-800">{title}</span>
        {count !== undefined && (
          <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
        {badge}
      </div>
      {expanded ? (
        <ChevronDown className="w-4 h-4 text-slate-500" />
      ) : (
        <ChevronRight className="w-4 h-4 text-slate-500" />
      )}
    </button>
  );
}

function AttackItem({ attack }: { attack: any }) {
  const attackType = ATTACK_TYPES[attack.attackType as keyof typeof ATTACK_TYPES];
  const Icon = attackType?.icon || Shield;
  
  // Determine dialogue state based on WHY/GROUNDS counts
  let dialogueState: "answered" | "challenged" | "neutral" = "neutral";
  if (attack.groundsCount > 0) {
    dialogueState = "answered";
  } else if (attack.whyCount > 0) {
    dialogueState = "challenged";
  }

  const state = DIALOGUE_STATE[dialogueState];
  const StateIcon = state.icon;

  return (
    <div 
      className={`
        flex items-start justify-between gap-3 p-3 rounded-lg border
        ${state.bgClass} ${state.borderClass}
        transition-all duration-200
      `}
    >
      <div className="flex items-start gap-2 flex-1">
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${attackType?.textClass || "text-slate-600"}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold ${attackType?.textClass || "text-slate-700"}`}>
              {attackType?.label || attack.attackType}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {attack.id.slice(-6)}
            </span>
          </div>
          {/* <p className={`text-xs ${state.textClass} leading-relaxed`}>
            {attackType?.description || "Attack on argument"}
          </p> */}
          {(attack.whyCount > 0 || attack.groundsCount > 0) && (
            <div className="flex items-center gap-2 mt-1.5">
              {attack.whyCount > 0 && (
                <span className="text-[10px] font-medium text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  {attack.whyCount} WHY
                </span>
              )}
              {attack.groundsCount > 0 && (
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {attack.groundsCount} GROUNDS
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="shrink-0">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${state.badgeClass}`}>
          <StateIcon className="w-3 h-3" />
          {state.label}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ArgumentCardV2({
  deliberationId,
  authorId,
  id,
  conclusion,
  premises,
  onAnyChange,
  schemeKey,
  schemeName,
  createdAt,
  updatedAt,
  confidence,
  dsMode = false,
}: ArgumentCardV2Props) {
  const [expandedSections, setExpandedSections] = React.useState({
    premises: false,
    inference: false,
    assumptions: false,
    attacks: false,
  });
  const [loading, setLoading] = React.useState(false);
  const [attacks, setAttacks] = React.useState<any[]>([]);
  const [cqDialogOpen, setCqDialogOpen] = React.useState(false);
  const [argCqDialogOpen, setArgCqDialogOpen] = React.useState(false);

  // Fetch CQ data for the conclusion claim (claim-level CQs)
  const { data: cqData } = useSWR(
    conclusion?.id ? `/api/cqs?targetType=claim&targetId=${conclusion.id}` : null,
    fetcher
  );

  // Fetch CQ data for the argument itself (argument-level CQs)
  const { data: argCqData } = useSWR(
    id ? `/api/cqs?targetType=argument&targetId=${id}` : null,
    fetcher
  );

  // Phase 3 Quick Win: Fetch AssumptionUse records
  const { data: assumptionsData } = useSWR(
    id ? `/api/arguments/${id}/assumption-uses` : null,
    fetcher
  );

  // Compute CQ status for claim
  const cqStatus = React.useMemo(() => {
    if (!cqData) return null;
    const schemes = cqData.schemes || [];
    if (schemes.length === 0) return null;
    
    let required = 0;
    let satisfied = 0;
    schemes.forEach((scheme: any) => {
      const cqs = scheme.cqs || [];
      required += cqs.length;
      satisfied += cqs.filter((cq: any) => cq.satisfied).length;
    });
    
    if (required === 0) return null;
    return { required, satisfied };
  }, [cqData]);

  // Compute CQ status for argument
  const argCqStatus = React.useMemo(() => {
    if (!argCqData) return null;
    const schemes = argCqData.schemes || [];
    if (schemes.length === 0) return null;
    
    let required = 0;
    let satisfied = 0;
    schemes.forEach((scheme: any) => {
      const cqs = scheme.cqs || [];
      required += cqs.length;
      satisfied += cqs.filter((cq: any) => cq.satisfied).length;
    });
    
    if (required === 0) return null;
    return { required, satisfied };
  }, [argCqData]);

  // Fetch attacks when attacks section is expanded
  React.useEffect(() => {
    if (!expandedSections.attacks) return;
    
    const fetchAttacks = async () => {
      setLoading(true);
      try {
        const [edgesRes, caRes] = await Promise.all([
          fetch(`/api/arguments/${id}/attacks`, { cache: "no-store" }),
          fetch(`/api/ca?targetArgumentId=${id}`, { cache: "no-store" })
        ]);

        const edgesData = edgesRes.ok ? await edgesRes.json() : { items: [] };
        const caData = caRes.ok ? await caRes.json() : { items: [] };

        const edgeAttacks = (edgesData.items || []).map((edge: any) => ({
          id: edge.id,
          attackType: edge.attackType,
          targetScope: edge.targetScope,
          fromArgumentId: edge.fromArgumentId,
          whyCount: edge.whyCount || 0,
          groundsCount: edge.groundsCount || 0,
          dialogueStatus: edge.dialogueStatus || "neutral",
          source: "edge"
        }));

        const caAttacks = (caData.items || [])
          .filter((ca: any) => ca.conflictedArgumentId === id && ca.legacyAttackType)
          .map((ca: any) => ({
            id: ca.id,
            attackType: ca.legacyAttackType,
            targetScope: ca.legacyTargetScope,
            fromArgumentId: ca.conflictingArgumentId,
            fromClaimId: ca.conflictingClaimId,
            whyCount: 0,
            groundsCount: 0,
            dialogueStatus: "neutral",
            source: "ca"
          }));

        setAttacks([...edgeAttacks, ...caAttacks]);
      } catch (err) {
        console.error("Failed to fetch attacks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttacks();
  }, [expandedSections.attacks, id]);

  const handleRefresh = React.useCallback(() => {
    if (expandedSections.attacks) {
      // Re-trigger attack fetch
      setExpandedSections(prev => ({ ...prev, attacks: false }));
      setTimeout(() => setExpandedSections(prev => ({ ...prev, attacks: true })), 0);
    }
    onAnyChange?.();
  }, [expandedSections.attacks, onAnyChange]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Group attacks by type
  const rebutAttacks = attacks.filter(a => a.attackType === "REBUTS");
  const undercutAttacks = attacks.filter(a => a.attackType === "UNDERCUTS");
  const undermineAttacks = attacks.filter(a => a.attackType === "UNDERMINES");
  const totalAttacks = attacks.length;

  return (
    <div className="argument-card-v2 border-2 border-slate-300 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Header - Always Visible */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                  {conclusion.text}
                </h3>
              </div>
            </div>
            
            {/* Badges Row */}
            <div className="flex items-center gap-2 flex-wrap ml-7">
              {/* Phase 3: Dialogue State Badge */}
              <DialogueStateBadge 
                deliberationId={deliberationId}
                argumentId={id}
              />
              
              {/* Phase 3: Temporal Decay Badge */}
              {updatedAt && (
                <StaleArgumentBadge 
                  lastUpdatedAt={updatedAt}
                />
              )}
              
              {/* Phase 3: DS Mode Confidence Display */}
              {confidence !== undefined && (
                <ConfidenceDisplay 
                  value={confidence}
                  dsMode={dsMode}
                  showLabel={false}
                  className="text-xs"
                />
              )}
              
              {schemeName && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span className="text-xs font-medium text-indigo-700">{schemeName}</span>
                </div>
              )}
              
              {cqStatus && (
                <CQStatusPill 
                  required={cqStatus.required} 
                  satisfied={cqStatus.satisfied}
                  type="claim"
                  onClick={() => setCqDialogOpen(true)}
                />
              )}
              
              {argCqStatus && (
                <CQStatusPill 
                  required={argCqStatus.required} 
                  satisfied={argCqStatus.satisfied}
                  type="argument"
                  onClick={() => setArgCqDialogOpen(true)}
                />
              )}

              {totalAttacks > 0 && (
                <>
                  {rebutAttacks.length > 0 && (
                    <AttackBadge 
                      type="REBUTS" 
                      count={rebutAttacks.length}
                      dialogueState={rebutAttacks[0]?.dialogueStatus}
                    />
                  )}
                  {undercutAttacks.length > 0 && (
                    <AttackBadge 
                      type="UNDERCUTS" 
                      count={undercutAttacks.length}
                      dialogueState={undercutAttacks[0]?.dialogueStatus}
                    />
                  )}
                  {undermineAttacks.length > 0 && (
                    <AttackBadge 
                      type="UNDERMINES" 
                      count={undermineAttacks.length}
                      dialogueState={undermineAttacks[0]?.dialogueStatus}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Quick Action Button
          <div className="shrink-0">
            <AttackMenuPro
              deliberationId={deliberationId}
              authorId={authorId}
              target={{ id, conclusion, premises }}
              onDone={handleRefresh}
            />
          </div> */}
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="divide-y divide-slate-200">
        {/* PREMISES SECTION */}
        <div>
          <SectionHeader
            title="Premises"
            icon={Target}
            count={premises.length}
            expanded={expandedSections.premises}
            onToggle={() => toggleSection("premises")}
            badge={undermineAttacks.length > 0 ? (
              <AttackBadge 
                type="UNDERMINES" 
                count={undermineAttacks.length}
                dialogueState={undermineAttacks[0]?.dialogueStatus}
              />
            ) : undefined}
          />
          {expandedSections.premises && (
            <div className="p-4 space-y-2 bg-slate-50/50">
              {premises.length > 0 ? (
                premises.map((p, idx) => (
                  <div 
                    key={p.id}
                    className="flex items-start gap-2 p-3 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-slate-700 leading-relaxed flex-1">{p.text}</p>
                  </div>
                ))
              ) : (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>No premises found.</strong> This argument may be a bare assertion.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* INFERENCE SECTION */}
        <div>
          <SectionHeader
            title="Inference"
            icon={Sparkles}
            expanded={expandedSections.inference}
            onToggle={() => toggleSection("inference")}
            badge={undercutAttacks.length > 0 ? (
              <AttackBadge 
                type="UNDERCUTS" 
                count={undercutAttacks.length}
                dialogueState={undercutAttacks[0]?.dialogueStatus}
              />
            ) : undefined}
          />
          {expandedSections.inference && (
            <div className="p-4 bg-indigo-50/50">
              <div className="p-3 rounded-lg bg-white border border-indigo-200">
                <p className="text-sm text-indigo-900 leading-relaxed">
                  The reasoning that connects the premises to the conclusion.
                  {schemeKey && (
                    <span className="block mt-2 text-xs font-medium text-indigo-700">
                      Using scheme: <span className="font-mono">{schemeName || schemeKey}</span>
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* OPEN ASSUMPTIONS SECTION - Phase 3 Quick Win */}
        {assumptionsData?.assumptions && assumptionsData.assumptions.length > 0 && (
          <div>
            <SectionHeader
              title="Open Assumptions"
              icon={Sparkles}
              count={assumptionsData.assumptions.length}
              expanded={expandedSections.assumptions}
              onToggle={() => toggleSection("assumptions")}
            />
            {expandedSections.assumptions && (
              <div className="p-4 space-y-2 bg-blue-50/50">
                <div className="text-xs text-blue-700 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  <span>This argument relies on the following assumptions:</span>
                </div>
                {assumptionsData.assumptions.map((assumption: any, idx: number) => (
                  <div 
                    key={assumption.id}
                    className="flex items-start gap-2 p-3 rounded-lg bg-white border border-blue-200 hover:border-blue-300 transition-colors"
                  >
                    <span className="inline-flex items-center justify-center min-w-[1.75rem] h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold shrink-0">
                      λ{idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 leading-relaxed">{assumption.text}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                        {assumption.weight !== undefined && (
                          <span className="font-medium text-blue-700">
                            weight: {assumption.weight.toFixed(2)}
                          </span>
                        )}
                        {assumption.role && assumption.role !== "premise" && (
                          <span className="text-slate-500">
                            role: {assumption.role}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="text-[10px] text-blue-600 bg-blue-50 p-2 rounded border border-blue-200 mt-2">
                  💡 <strong>Tip:</strong> Retracting or challenging an assumption may affect this argument&apos;s confidence.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ATTACKS SECTION */}
        <div>
          <SectionHeader
            title="Challenges"
            icon={Shield}
            count={totalAttacks}
            expanded={expandedSections.attacks}
            onToggle={() => toggleSection("attacks")}
          />
          {expandedSections.attacks && (
            <div className="p-4 space-y-2 bg-slate-50/50">
              {loading ? (
                <div className="flex items-center justify-center gap-2 p-4">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  <span className="text-sm text-slate-600">Loading challenges...</span>
                </div>
              ) : attacks.length > 0 ? (
                <>
                  {rebutAttacks.map(attack => (
                    <AttackItem key={attack.id} attack={attack} />
                  ))}
                  {undercutAttacks.map(attack => (
                    <AttackItem key={attack.id} attack={attack} />
                  ))}
                  {undermineAttacks.map(attack => (
                    <AttackItem key={attack.id} attack={attack} />
                  ))}
                </>
              ) : (
                <div className="text-center py-6">
                  <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No challenges yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    This argument hasn&apos;t been challenged
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CQ Dialogs */}
      <Dialog open={cqDialogOpen} onOpenChange={setCqDialogOpen}>
        <DialogContent className="max-w-4xl bg-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Critical Questions - Conclusion Claim</DialogTitle>
          </DialogHeader>
          {conclusion?.id && (
            <CriticalQuestions
              targetType="claim"
              targetId={conclusion.id}
              deliberationId={deliberationId}
            />
          )}
        </DialogContent>
      </Dialog>

      <ArgumentCriticalQuestionsModal
        open={argCqDialogOpen}
        onOpenChange={setArgCqDialogOpen}
        argumentId={id}
        deliberationId={deliberationId}
      />
    </div>
  );
}
