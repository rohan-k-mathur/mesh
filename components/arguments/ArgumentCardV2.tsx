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
  PanelBottomOpen,
  StepForward,
  MessageSquare,
  Loader2,
  Link as LinkIcon
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AttackMenuPro } from "./AttackMenuPro";
import CriticalQuestionsV3 from "@/components/claims/CriticalQuestionsV3";
import { ArgumentCriticalQuestionsModal } from "./ArgumentCriticalQuestionsModal";
import { SchemeBreakdownModal } from "./SchemeBreakdownModal";
import { DialogueStateBadge } from "@/components/dialogue/DialogueStateBadge";
import { StaleArgumentBadge } from "@/components/arguments/StaleArgumentBadge";
import { ConfidenceDisplay } from "@/components/confidence/ConfidenceDisplay";
import { DialogueActionsButton } from "@/components/dialogue/DialogueActionsButton";
import { DialogueProvenanceBadge, type DialogueMoveKind } from "@/components/aif/DialogueMoveNode";
import { DialogueMoveDetailModal } from "@/components/dialogue/DialogueMoveDetailModal";
import { OrthogonalityBadge, DecisiveBadge, CommitmentAnchorBadge } from "@/components/ludics/InsightsBadges";
import type { LudicsInsights } from "@/lib/ludics/computeInsights";
import { ClaimDetailPanel } from "@/components/claims/ClaimDetailPanel";

const fetcher = (url: string) => fetch(url).then(r => r.json());

type Prem = { id: string; text: string };

interface ArgumentCardV2Props {
  deliberationId: string;
  authorId: string;
  id: string;
  conclusion: { id: string; text: string };
  premises: Prem[];
  onAnyChange?: () => void;
  schemeKey?: string | null; // DEPRECATED: Use schemes array instead (Phase 4)
  schemeName?: string | null; // DEPRECATED: Use schemes array instead (Phase 4)
  schemes?: Array<{ // Phase 4: Multi-scheme support
    schemeId: string;
    schemeKey: string;
    schemeName: string;
    confidence: number;
    isPrimary: boolean;
  }>;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  confidence?: number;
  dsMode?: boolean; // Dempster-Shafer mode toggle
  provenance?: {
    kind: string;
    sourceDeliberationId: string;
    sourceDeliberationName: string;
    fingerprint?: string;
  } | null;
  // Phase 3: Dialogue Visualization - Dialogue Provenance
  dialogueProvenance?: {
    moveId: string;
    moveKind: DialogueMoveKind;
    speakerName?: string;
  } | null;
  // Phase 3: Dialogue Tab Navigation
  onViewDialogueMove?: (moveId: string, deliberationId: string) => void;
  // Phase 2 Week 2: Ludics Integration
  showLudicsBadges?: boolean; // Default true
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
  
  // Phase 8: ASPIC+ attack type styling
  const getAspicStyle = (aspicType: string | undefined) => {
    if (!aspicType) return null;
    
    switch (aspicType.toLowerCase()) {
      case 'rebutting':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', label: 'REBUTS' };
      case 'undercutting':
        return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', label: 'UNDERCUTS' };
      case 'undermining':
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', label: 'UNDERMINES' };
      default:
        return null;
    }
  };
  
  const aspicStyle = getAspicStyle(attack.aspicAttackType);

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
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-semibold ${attackType?.textClass || "text-slate-700"}`}>
              {attackType?.label || attack.attackType}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {attack.id.slice(-6)}
            </span>
            {/* Phase 8: ASPIC+ Attack Type Badge */}
            {aspicStyle && (
              <span 
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${aspicStyle.bg} ${aspicStyle.text} border ${aspicStyle.border}`}
                title={`ASPIC+ Classification: ${attack.aspicAttackType}`}
              >
                ⚔️ {aspicStyle.label}
              </span>
            )}
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
  schemes: propsSchemes = [],
  createdAt,
  updatedAt,
  confidence,
  dsMode = false,
  provenance,
  dialogueProvenance,
  onViewDialogueMove,
  showLudicsBadges = true
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
  const [schemeDialogOpen, setSchemeDialogOpen] = React.useState(false);
  const [citations, setCitations] = React.useState<any[]>([]);
  const [loadingCitations, setLoadingCitations] = React.useState(false);
  
  // Phase 3: Dialogue Move Detail Modal
  const [dialogueMoveModalOpen, setDialogueMoveModalOpen] = React.useState(false);
  const [selectedDialogueMoveId, setSelectedDialogueMoveId] = React.useState<string | null>(null);

  // Phase 2 Week 2: Fetch Ludics insights for this deliberation
  const { data: ludicsInsights } = useSWR<LudicsInsights>(
    showLudicsBadges ? `/api/ludics/insights?deliberationId=${deliberationId}` : null,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  // Phase 4: Fetch multi-scheme data if not provided via props
  // Always fetch if we don't have scheme data, even when schemeName is provided (legacy support)
  const shouldFetchSchemes = (!propsSchemes || propsSchemes.length === 0) && id;
  const { data: schemesData } = useSWR(
    shouldFetchSchemes ? `/api/arguments/${id}/schemes` : null,
    fetcher
  );

  // Use schemes from props or fetched data
  const schemes = propsSchemes || schemesData?.schemes || [];

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

  // Fetch citations for the argument
  React.useEffect(() => {
    let cancel = false;
    (async () => {
      setLoadingCitations(true);
      try {
        const r = await fetch(`/api/arguments/${encodeURIComponent(id)}/citations`, { cache: "no-store" });
        const j = await r.json().catch(() => ({}));
        if (!cancel && j?.ok && j?.citations) {
          setCitations(j.citations);
        }
      } catch {
        // Silent fail - citations not critical
      } finally {
        if (!cancel) setLoadingCitations(false);
      }
    })();
    return () => { cancel = true; };
  }, [id]);

  // Listen for citation changes
  React.useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.targetType === "argument" && e.detail?.targetId === id) {
        // Refetch citations
        (async () => {
          try {
            const r = await fetch(`/api/arguments/${encodeURIComponent(id)}/citations`, { cache: "no-store" });
            const j = await r.json().catch(() => ({}));
            if (j?.ok && j?.citations) {
              setCitations(j.citations);
            }
          } catch {
            // Silent fail
          }
        })();
      }
    };
    window.addEventListener("citations:changed", handler);
    return () => window.removeEventListener("citations:changed", handler);
  }, [id]);

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
            aspicAttackType: ca.aspicAttackType, // Phase 8: ASPIC+ attack type
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
                
                {/* Collapsible Claim Details */}
                <ClaimDetailPanel 
                  claimId={conclusion.id}
                  deliberationId={deliberationId}
                  claimText={conclusion.text}
                  className="mt-2"
                />
              </div>
            </div>
            
            {/* Badges Row */}
            <div className="flex items-center gap-2 flex-wrap ml-7">
              {/* Phase 3: Dialogue Provenance Badge */}
              {dialogueProvenance && (
                <DialogueProvenanceBadge
                  moveId={dialogueProvenance.moveId}
                  moveKind={dialogueProvenance.moveKind}
                  speakerName={dialogueProvenance.speakerName}
                  onClick={() => {
                    setSelectedDialogueMoveId(dialogueProvenance.moveId);
                    setDialogueMoveModalOpen(true);
                  }}
                />
              )}
              
              {/* Phase 5A: Provenance Badge for Imported Arguments */}
              {provenance && (
                <a
                  href={`/room/${provenance.sourceDeliberationId}?highlightArg=${provenance.fingerprint?.split(":")[1] || ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-medium hover:bg-amber-100 hover:border-amber-300 transition-colors cursor-pointer"
                  title={`View source argument in "${provenance.sourceDeliberationName}" (fingerprint: ${provenance.fingerprint?.slice(0, 8)}...)`}
                  onClick={(e) => e.stopPropagation()}
                >
                  📥 From {provenance.sourceDeliberationName}
                </a>
              )}
              
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
              
              {/* Scheme badge - clickable to open modal */}
              {(schemeName || schemes.length > 0) && (
                <button
                  onClick={() => setSchemeDialogOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition-all cursor-pointer"
                  title="View scheme breakdown"
                >
                  <span className="text-xs font-medium text-indigo-700">
                    {schemes.length > 0 
                      ? `${schemes.length} scheme${schemes.length > 1 ? 's' : ''}`
                      : schemeName
                    }
                  </span>
                </button>
              )}
              
              {cqStatus && (
                <CQStatusPill 
                  required={cqStatus.required} 
                  satisfied={cqStatus.satisfied}
                  type="claim"
                  onClick={() => setCqDialogOpen(true)}
                />
              )}
              
              {/* Dialogue Actions for Conclusion Claim */}
              <DialogueActionsButton
                deliberationId={deliberationId}
                targetType="claim"
                targetId={conclusion.id}
                locusPath="0"
                variant="compact"
                label="Dialogue"
                onMovePerformed={onAnyChange}
              />
              
              {argCqStatus && (
                <CQStatusPill 
                  required={argCqStatus.required} 
                  satisfied={argCqStatus.satisfied}
                  type="argument"
                  onClick={() => setArgCqDialogOpen(true)}
                />
              )}

              {/* Citations Badge */}
              {citations.length > 0 && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium">
                  <LinkIcon className="w-3 h-3" />
                  <span>{citations.length}</span>
                </div>
              )}

              {/* Phase 2 Week 2: Ludics Badges */}
              {showLudicsBadges && ludicsInsights && (
                <>
                  {/* Orthogonality Status Badge */}
                  {ludicsInsights.orthogonalityStatus && (
                    <OrthogonalityBadge 
                      status={ludicsInsights.orthogonalityStatus}
                      size="sm"
                    />
                  )}
                  
                  {/* Decisive Steps Badge */}
                  {ludicsInsights.decisiveSteps && ludicsInsights.decisiveSteps > 0 && (
                    <DecisiveBadge 
                      count={ludicsInsights.decisiveSteps}
                      size="sm"
                    />
                  )}
                  
                  {/* Commitment Anchor Badge - show if argument has commitments */}
                  {ludicsInsights.totalActs && ludicsInsights.totalActs > 0 && (
                    <CommitmentAnchorBadge 
                      count={ludicsInsights.totalActs}
                      size="sm"
                    />
                  )}
                </>
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
                    className="flex flex-col gap-2 p-3 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 leading-relaxed">{p.text}</p>
                        
                        {/* Collapsible Claim Details */}
                        <ClaimDetailPanel 
                          claimId={p.id}
                          deliberationId={deliberationId}
                          claimText={p.text}
                          className="mt-2"
                        />
                      </div>
                      {/* Dialogue Actions for Premise Claim */}
                      <DialogueActionsButton
                        deliberationId={deliberationId}
                        targetType="claim"
                        targetId={p.id}
                        locusPath="0"
                        variant="icon"
                        onMovePerformed={onAnyChange}
                      />
                    </div>
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
            icon={StepForward}
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
            <div className="p-2 bg-indigo-50/50">
              <div className="px-5 py-3 rounded-lg bg-white border border-indigo-200">
                <p className="text-sm text-indigo-900 leading-relaxed">
                  The reasoning that connects the premises to the conclusion.
                </p>
                
                {/* Phase 4: Multi-scheme display */}
                {schemes.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-indigo-700">
                        Argumentation Scheme{schemes.length > 1 ? "s" : ""}:
                      </div>
                      <button
                        onClick={() => setSchemeDialogOpen(true)}
                        className="flex text-sm text-indigo-600 hover:text-indigo-800 underline font-medium"
                      >
                        View full breakdown →
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-indigo-200">
                      {schemes.map((scheme: any) => (
                        <button
                          key={scheme.schemeId}
                          onClick={() => setSchemeDialogOpen(true)}
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition-all hover:scale-105 ${
                            scheme.isPrimary
                              ? "bg-indigo-100 border-indigo-300 text-indigo-800 hover:bg-indigo-200"
                              : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
                          }`}
                          title={scheme.isPrimary ? "Primary scheme - click for details" : "Click for details"}
                        >
                          <span className="font-semibold">{scheme.schemeName}</span>
                          <span className="text-xs opacity-75">
                            {Math.round(scheme.confidence * 100)}%
                          </span>
                          {scheme.isPrimary && (
                            <span className="ml-0.5 text-[10px] font-bold">★</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Fallback to legacy single scheme display
                  schemeKey && (
                    <button
                      onClick={() => setSchemeDialogOpen(true)}
                      className="block mt-2 text-xs font-medium text-indigo-700 hover:text-indigo-900 underline"
                    >
                      Using scheme: <span className="font-mono">{schemeName || schemeKey}</span> →
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* OPEN ASSUMPTIONS SECTION - Phase 3 Quick Win */}
        {assumptionsData?.assumptions && assumptionsData.assumptions.length > 0 && (
          <div>
            <SectionHeader
              title="Open Assumptions"
              icon={PanelBottomOpen}
              count={assumptionsData.assumptions.length}
              expanded={expandedSections.assumptions}
              onToggle={() => toggleSection("assumptions")}
            />
            {expandedSections.assumptions && (
              <div className="p-4 space-y-2 bg-sky-50/50">
                <div className="text-xs text-sky-700 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  <span>This argument relies on the following assumptions:</span>
                </div>
                {assumptionsData.assumptions.map((assumption: any, idx: number) => (
                  <div 
                    key={assumption.id}
                    className="flex items-start gap-2 p-3 rounded-lg bg-white border border-sky-200 hover:border-sky-300 transition-colors"
                  >
                    <span className="inline-flex items-center justify-center min-w-[1.75rem] h-7 rounded-full bg-sky-100 text-sky-700 text-xs font-bold shrink-0">
                      λ{idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 leading-relaxed">{assumption.text}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                        {assumption.weight !== undefined && (
                          <span className="font-medium text-sky-700">
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
                <div className="text-[10px] text-sky-600 bg-sky-50 p-2 rounded border border-sky-200 mt-2">
                  💡 <strong>Tip:</strong> Retracting or challenging an assumption may affect this argument&apos;s confidence.
                </div>
              </div>
            )}
          </div>
        )}

        {/* CITATIONS SECTION */}
        {citations.length > 0 && (
          <div>
            <SectionHeader
              title="Evidence & Citations"
              icon={LinkIcon}
              count={citations.length}
              expanded={expandedSections.assumptions}
              onToggle={() => toggleSection("assumptions")}
            />
            {expandedSections.assumptions && (
              <div className="p-4 space-y-2 bg-slate-50/50">
                {citations.map((citation: any) => (
                  <a
                    key={citation.id}
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 p-3 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
                  >
                    <LinkIcon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0 group-hover:text-indigo-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 group-hover:text-indigo-700 leading-tight">
                        {citation.title}
                      </p>
                      {citation.authors && (
                        <p className="text-xs text-slate-600 mt-0.5">
                          {Array.isArray(citation.authors) 
                            ? citation.authors.map((a: any) => a.family || a.literal).join(", ")
                            : citation.authors
                          }
                        </p>
                      )}
                      {citation.text && (
                        <p className="text-xs text-slate-500 mt-1 italic border-l-2 border-slate-300 pl-2">
                          &ldquo;{citation.text}&rdquo;
                        </p>
                      )}
                      {citation.locator && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          {citation.locator}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
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
        <DialogContent className="!z-[60] bg-white/95 backdrop-blur-xl rounded-xl max-w-[90vw] w-full sm:max-w-[880px] max-h-[85vh] overflow-y-auto shadow-2xl">
          {/* Water droplets */}
          <div className="absolute top-10 right-20 w-24 h-24 bg-sky-400/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
          <div className="absolute bottom-20 left-10 w-32 h-32 bg-cyan-400/8 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none" />
          
          <div className="relative z-10">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-sky-900 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
                Claim-level Critical Questions
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {conclusion?.id && (
                <CriticalQuestionsV3
                  targetType="claim"
                  targetId={conclusion.id}
                  createdById={authorId}
                  deliberationId={deliberationId}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ArgumentCriticalQuestionsModal
        open={argCqDialogOpen}
        onOpenChange={setArgCqDialogOpen}
        argumentId={id}
        deliberationId={deliberationId}
      />

      {/* Scheme Breakdown Modal */}
      <SchemeBreakdownModal
        open={schemeDialogOpen}
        onOpenChange={setSchemeDialogOpen}
        argumentId={id}
        argumentText={conclusion.text}
      />
      
      {/* Phase 3: Dialogue Move Detail Modal */}
      <DialogueMoveDetailModal
        moveId={selectedDialogueMoveId}
        open={dialogueMoveModalOpen}
        onOpenChange={setDialogueMoveModalOpen}
        onViewFullDialogue={(moveId, delibId) => {
          if (onViewDialogueMove) {
            onViewDialogueMove(moveId, delibId);
          }
        }}
      />
    </div>
  );
}
