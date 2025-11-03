// components/arguments/ArgumentActionsSheet.tsx
"use client";

import * as React from "react";
import { FloatingSheet } from "../ui/FloatingSheet";
import { Zap, GitBranch, Shield, Target, MessageSquare } from "lucide-react";
import clsx from "clsx";
import useSWR from "swr";
import { AifDiagramViewerDagre } from "@/components/map/Aifdiagramviewerdagre";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface ArgumentActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliberationId: string;
  // Selected argument context
  selectedArgument?: {
    id: string;
    text?: string;
    conclusionText?: string;
    schemeKey?: string;
  } | null;
}

/**
 * ArgumentActionsSheet - Dedicated floating sheet for argument-level actions
 * 
 * Purpose: Provide a focused interface for argument-specific operations:
 * - Attack argument (Rebut, Undercut, Undermine)
 * - Defend argument (Community defense)
 * - Answer Critical Questions
 * - View argument structure (AIF diagram)
 * 
 * This is separate from the Explorer sheet (claims/graph navigation).
 */
export function ArgumentActionsSheet({
  open,
  onOpenChange,
  deliberationId,
  selectedArgument,
}: ArgumentActionsSheetProps) {
  const [activeAction, setActiveAction] = React.useState<
    "overview" | "attack" | "defend" | "cqs" | "diagram"
  >("overview");

  // Reset to overview when argument changes
  React.useEffect(() => {
    if (selectedArgument) {
      setActiveAction("overview");
    }
  }, [selectedArgument?.id]);

  return (
    <FloatingSheet
      open={open}
      onOpenChange={onOpenChange}
      side="right"
      width={1000}
      title="Argument Actions"
      subtitle={
        selectedArgument
          ? `Actions for argument ${selectedArgument.id.slice(0, 8)}...`
          : "Select an argument to see actions"
      }
      variant="glass-dark"
      icon={
        <Zap className="w-5 h-5" />
      }
    >
      {!selectedArgument ? (
        <EmptyState />
      ) : (
        <>
          {/* Action Selector */}
          <ActionSelector
            activeAction={activeAction}
            onSelectAction={setActiveAction}
          />

          {/* Action Content */}
          <div className="mt-6">
            {activeAction === "overview" && (
              <OverviewPanel
                argument={selectedArgument}
                onSelectAction={setActiveAction}
              />
            )}

            {activeAction === "attack" && (
              <AttackPanel
                deliberationId={deliberationId}
                argument={selectedArgument}
              />
            )}

            {activeAction === "defend" && (
              <DefendPanel
                deliberationId={deliberationId}
                argument={selectedArgument}
              />
            )}

            {activeAction === "cqs" && (
              <CQsPanel
                deliberationId={deliberationId}
                argument={selectedArgument}
              />
            )}

            {activeAction === "diagram" && (
              <DiagramPanel 
                deliberationId={deliberationId}
                argument={selectedArgument} 
              />
            )}
          </div>
        </>
      )}
    </FloatingSheet>
  );
}

// Empty State
function EmptyState() {
  return (
    <div className="rounded-xl border-2 border-dashed border-white/20 p-12 text-center">
      <Target className="w-16 h-16 text-white/30 mx-auto mb-4" />
      <div className="text-base text-white/90 font-medium mb-2">
        No argument selected
      </div>
      <div className="text-sm text-white/60">
        Click an argument card in the Models tab to see available actions
      </div>
    </div>
  );
}

// Action Selector
interface ActionSelectorProps {
  activeAction: "overview" | "attack" | "defend" | "cqs" | "diagram";
  onSelectAction: (action: "overview" | "attack" | "defend" | "cqs" | "diagram") => void;
}

function ActionSelector({ activeAction, onSelectAction }: ActionSelectorProps) {
  const actions = [
    { id: "overview", label: "Overview", icon: Target },
    { id: "attack", label: "Attack", icon: Zap },
    { id: "defend", label: "Defend", icon: Shield },
    { id: "cqs", label: "CQs", icon: MessageSquare },
    { id: "diagram", label: "Diagram", icon: GitBranch },
  ] as const;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {actions.map((action) => {
        const Icon = action.icon;
        const isActive = activeAction === action.id;
        return (
          <button
            key={action.id}
            onClick={() => onSelectAction(action.id as any)}
            className={clsx(
              "flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              "flex items-center gap-2",
              isActive
                ? "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg border border-white/20"
                : "bg-white/10 text-white/70 hover:bg-white/15 border border-white/10"
            )}
          >
            <Icon className="w-4 h-4" />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}

// Overview Panel
interface OverviewPanelProps {
  argument: {
    id: string;
    text?: string;
    conclusionText?: string;
    schemeKey?: string;
  };
  onSelectAction: (action: "attack" | "defend" | "cqs" | "diagram") => void;
}

function OverviewPanel({ argument, onSelectAction }: OverviewPanelProps) {
  const quickActions = [
    {
      id: "attack",
      title: "Challenge this argument",
      description: "Rebut conclusion, undercut inference, or undermine premises",
      icon: Zap,
      color: "from-rose-500 to-red-500",
    },
    {
      id: "defend",
      title: "Defend this argument",
      description: "Support with community defense moves",
      icon: Shield,
      color: "from-emerald-500 to-green-500",
    },
    {
      id: "cqs",
      title: "Answer Critical Questions",
      description: "Address scheme-specific questions",
      icon: MessageSquare,
      color: "from-amber-500 to-orange-500",
    },
    {
      id: "diagram",
      title: "View AIF Structure",
      description: "See argument network diagram",
      icon: GitBranch,
      color: "from-indigo-500 to-purple-500",
    },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Argument Info */}
      <div className="p-4 rounded-lg bg-white/10 border border-white/20">
        <div className="text-xs font-medium text-white/60 mb-1">Argument ID</div>
        <div className="text-sm text-white font-mono">{argument.id}</div>
        {argument.conclusionText && (
          <>
            <div className="text-xs font-medium text-white/60 mt-3 mb-1">Conclusion</div>
            <div className="text-sm text-white/90 italic">&quot;{argument.conclusionText}&quot;</div>
          </>
        )}
        {argument.schemeKey && (
          <>
            <div className="text-xs font-medium text-white/60 mt-3 mb-1">Scheme</div>
            <div className="text-sm text-cyan-300">{argument.schemeKey}</div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h4 className="text-sm font-semibold text-white/90 mb-3">Quick Actions</h4>
        <div className="grid grid-cols-1 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => onSelectAction(action.id as any)}
                className="group p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left"
              >
                <div className="flex items-start gap-3">
                  <div className={clsx(
                    "flex-shrink-0 p-2 rounded-lg bg-gradient-to-br",
                    action.color,
                    "group-hover:scale-110 transition-transform"
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                      {action.title}
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      {action.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Attack Panel
interface AttackPanelProps {
  deliberationId: string;
  argument: { id: string; conclusionText?: string };
}

function AttackPanel({ deliberationId, argument }: AttackPanelProps) {
  return (
    <div>
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-white/90 mb-1">Challenge Argument</h4>
        <p className="text-xs text-white/60">
          Choose an attack type to challenge this argument&apos;s validity
        </p>
      </div>
      
      <div className="space-y-3">
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="text-sm text-white/70 mb-4">
            To challenge this argument, use the Attack Menu from the argument card in the Models tab.
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <Zap className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">Rebut</div>
                <div className="text-xs text-white/60 mt-1">
                  Directly contradict the conclusion with a counter-claim
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Target className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">Undercut</div>
                <div className="text-xs text-white/60 mt-1">
                  Challenge the inference between premises and conclusion
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <Shield className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">Undermine</div>
                <div className="text-xs text-white/60 mt-1">
                  Contradict a specific premise with a counter-claim
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Defend Panel
interface DefendPanelProps {
  deliberationId: string;
  argument: { id: string };
}

function DefendPanel({ deliberationId, argument }: DefendPanelProps) {
  return (
    <div>
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-white/90 mb-1">Defend Argument</h4>
        <p className="text-xs text-white/60">
          Provide community defense to strengthen this argument
        </p>
      </div>
      
      <div className="space-y-3">
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="text-sm text-white/70 mb-4">
            To defend this argument, use the Community Defense Menu from the argument card.
          </div>
          
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white mb-1">Community Defense</div>
                <div className="text-xs text-white/60">
                  Support this argument with backing, reinforcement, or alternative justifications
                </div>
                <div className="text-xs text-emerald-300 mt-2">
                  Argument ID: <span className="font-mono">{argument.id.slice(0, 12)}...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// CQs Panel
interface CQsPanelProps {
  deliberationId: string;
  argument: { id: string; schemeKey?: string };
}

function CQsPanel({ deliberationId, argument }: CQsPanelProps) {
  return (
    <div>
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-white/90 mb-1">Critical Questions</h4>
        <p className="text-xs text-white/60">
          Answer scheme-specific critical questions for this argument
        </p>
      </div>
      
      {argument.schemeKey ? (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xs font-medium text-white/60 mb-1">Scheme</div>
            <div className="text-sm text-cyan-300">{argument.schemeKey}</div>
          </div>
          
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm text-white/70 mb-3">
              Critical Questions help evaluate the strength and validity of this argument based on its reasoning scheme.
            </div>
            
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white mb-1">Answer CQs</div>
                  <div className="text-xs text-white/60">
                    Use the CQ button on the argument card to view and answer scheme-specific questions
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-lg bg-white/5 border border-white/10 text-center">
          <MessageSquare className="w-8 h-8 text-white/30 mx-auto mb-2" />
          <div className="text-sm text-white/70">No scheme assigned to this argument</div>
          <div className="text-xs text-white/50 mt-1">Scheme-specific CQs are not available</div>
        </div>
      )}
    </div>
  );
}

// Diagram Panel
interface DiagramPanelProps {
  deliberationId: string;
  argument: { id: string };
}

function DiagramPanel({ deliberationId, argument }: DiagramPanelProps) {
  const { data, isLoading, error } = useSWR(
    `/api/arguments/${argument.id}/aif-neighborhood?depth=1`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  // Loading state
  if (isLoading) {
    return (
      <div>
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-white/90 mb-1">AIF Structure</h4>
          <p className="text-xs text-white/60">
            Loading diagram...
          </p>
        </div>
        <div className="p-6 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-white/70">Loading AIF diagram...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data?.ok || !data?.aif) {
    return (
      <div>
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-white/90 mb-1">AIF Structure</h4>
          <p className="text-xs text-white/60">
            Visual representation of this argument&apos;s structure
          </p>
        </div>
        <div className="p-6 rounded-lg bg-white/5 border border-white/10 text-center">
          <div className="text-sm text-red-400 mb-1">
            Unable to load AIF diagram
          </div>
          <div className="text-xs text-white/50">
            {error?.message || 'Unknown error'}
          </div>
        </div>
      </div>
    );
  }

  // Success: Render diagram
  const nodeCount = data.aif.nodes?.length || 0;
  const edgeCount = data.aif.edges?.length || 0;

  // Find the conclusion node for this argument
  // The conclusion is the I-node that is the target of a 'conclusion' edge from the RA node
  const raNodeId = `RA:${argument.id}`;
  const conclusionEdge = data.aif.edges?.find(
    (edge: { from: string; to: string; role: string }) => 
      edge.from === raNodeId && edge.role === 'conclusion'
  );
  const conclusionNodeId = conclusionEdge?.to;

  return (
    <div>
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-white/90 mb-1">AIF Structure</h4>
        <p className="text-xs text-white/60">
          {nodeCount} nodes · {edgeCount} edges · Interactive diagram
        </p>
      </div>

      {/* Diagram viewer with fixed height for sheet context - removed extra spacing */}
      <div className="h-[620px] rounded-lg overflow-hidden bg-white">
        <AifDiagramViewerDagre
          initialGraph={data.aif}
          layoutPreset="compact"
          deliberationId={deliberationId}
          initialSelectedNodeId={conclusionNodeId}
          onNodeClick={(nodeId) => {
            console.log('AIF node clicked:', nodeId);
            // TODO: Add navigation logic if needed
          }}
          className="w-full h-full"
        />
      </div>

      {/* Help text */}
      
    </div>
  );
}

