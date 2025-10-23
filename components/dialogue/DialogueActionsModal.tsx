// components/dialogue/DialogueActionsModal.tsx
"use client";

import * as React from "react";
import { useState, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NLCommitPopover } from "@/components/dialogue/NLCommitPopover";
import { StructuralMoveModal } from "@/components/dialogue/StructuralMoveModal";
import { CQContextPanel } from "@/components/dialogue/command-card/CQContextPanel";
import type { CommandCardAction, ProtocolKind } from "@/components/dialogue/command-card/types";
import { TargetType } from "@prisma/client";
import useSWR from "swr";
import {
  MessageSquare,
  Scale,
  Flag,
  XCircle,
  CheckCircle,
  GitBranch,
  Sparkles,
  HelpCircle,
  Shield,
  Zap,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export interface DialogueActionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  // Target context
  deliberationId: string;
  targetType: TargetType;
  targetId: string;
  locusPath?: string;
  
  // Optional: pre-selected move kind (e.g., opened from "Ask WHY" button)
  initialMove?: ProtocolKind;
  
  // Callbacks
  onMovePerformed?: () => void;
  
  // Optional: CQ context if opened from a CQ button
  cqContext?: {
    cqKey: string;
    cqText: string;
    status: "open" | "answered";
  };
  
  // Optional: show only specific categories
  categories?: ("protocol" | "structural" | "cqs" | "scaffold")[];
}

interface Move {
  kind: ProtocolKind;
  disabled: boolean;
  disabledReason?: string;
  payload?: Record<string, any>;
}

// ============================================================================
// FETCHER
// ============================================================================

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

// ============================================================================
// MOVE CONFIGURATIONS
// ============================================================================

const MOVE_CONFIG: Record<
  ProtocolKind,
  {
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: "primary" | "danger" | "default";
    category: "protocol" | "structural" | "cqs";
  }
> = {
  WHY: {
    label: "Ask WHY",
    description: "Challenge the justification for this claim or argument",
    icon: HelpCircle,
    tone: "default",
    category: "protocol",
  },
  GROUNDS: {
    label: "Provide GROUNDS",
    description: "Answer a WHY challenge with justification",
    icon: Shield,
    tone: "primary",
    category: "protocol",
  },
  CONCEDE: {
    label: "CONCEDE",
    description: "Accept the opponent's position on this point",
    icon: Flag,
    tone: "danger",
    category: "protocol",
  },
  RETRACT: {
    label: "RETRACT",
    description: "Withdraw your previous claim or commitment",
    icon: XCircle,
    tone: "danger",
    category: "protocol",
  },
  CLOSE: {
    label: "CLOSE (†)",
    description: "Mark this dialogue thread as concluded",
    icon: CheckCircle,
    tone: "default",
    category: "protocol",
  },
  ACCEPT_ARGUMENT: {
    label: "ACCEPT",
    description: "Accept this argument as valid",
    icon: CheckCircle,
    tone: "primary",
    category: "protocol",
  },
  THEREFORE: {
    label: "THEREFORE",
    description: "Introduce a conclusion that follows from previous premises",
    icon: GitBranch,
    tone: "primary",
    category: "structural",
  },
  SUPPOSE: {
    label: "SUPPOSE",
    description: "Introduce a hypothetical assumption for argumentation",
    icon: Sparkles,
    tone: "default",
    category: "structural",
  },
  DISCHARGE: {
    label: "DISCHARGE",
    description: "Close a SUPPOSE scope and conclude the hypothetical",
    icon: Zap,
    tone: "default",
    category: "structural",
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DialogueActionsModal({
  open,
  onOpenChange,
  deliberationId,
  targetType,
  targetId,
  locusPath = "0",
  initialMove,
  onMovePerformed,
  cqContext,
  categories = ["protocol", "structural", "cqs"],
}: DialogueActionsModalProps) {
  // State
  const [activeTab, setActiveTab] = useState<string>(
    initialMove
      ? MOVE_CONFIG[initialMove]?.category || "protocol"
      : categories[0] || "protocol"
  );
  const [executingMove, setExecutingMove] = useState<string | null>(null);
  const [groundsModalOpen, setGroundsModalOpen] = useState(false);
  const [pendingGroundsPayload, setPendingGroundsPayload] = useState<any>(null);
  const [structuralModalOpen, setStructuralModalOpen] = useState(false);
  const [structuralMoveKind, setStructuralMoveKind] = useState<
    "THEREFORE" | "SUPPOSE" | "DISCHARGE" | null
  >(null);

  // Fetch legal moves
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      deliberationId,
      targetType,
      targetId,
      locus: locusPath,
    });
    return `/api/dialogue/legal-moves?${params}`;
  }, [deliberationId, targetType, targetId, locusPath]);

  const { data, error, isLoading, mutate } = useSWR<{ moves: Move[] }>(
    open ? apiUrl : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  const moves = data?.moves || [];

  // Fetch CQ context if available
  const cqApiUrl = useMemo(() => {
    if (targetType !== ("argument" as TargetType)) return null;
    return `/api/arguments/${targetId}/aif-cqs`;
  }, [targetType, targetId]);

  const { data: cqData } = useSWR<{
    items: Array<{
      cqKey: string;
      text: string;
      status: "open" | "answered";
      attackType: string;
      targetScope: string;
    }>;
  }>(cqApiUrl, fetcher, {
    revalidateOnFocus: false,
  });

  const cqs = cqData?.items || [];
  
  // Filter WHY/GROUNDS moves related to CQs for CQContextPanel
  const cqActions = useMemo(() => {
    return moves
      .filter((m) => (m.kind === "WHY" || m.kind === "GROUNDS") && m.payload?.cqId)
      .map((m) => ({
        id: `${m.kind}-${m.payload?.cqId}`,
        kind: m.kind,
        label: MOVE_CONFIG[m.kind]?.label || m.kind,
        force: "NEUTRAL" as const,
        disabled: m.disabled,
        reason: m.disabledReason,
        move: {
          kind: m.kind,
          payload: m.payload,
        },
        target: {
          deliberationId,
          targetType: targetType as "argument" | "claim" | "card",
          targetId,
          locusPath,
        },
        tone: "default" as const,
      }));
  }, [moves, deliberationId, targetType, targetId, locusPath]);

  // Group moves by category
  const groupedMoves = useMemo(() => {
    const protocol: Move[] = [];
    const structural: Move[] = [];

    moves.forEach((move) => {
      const config = MOVE_CONFIG[move.kind];
      if (!config) return;

      if (config.category === "protocol") {
        protocol.push(move);
      } else if (config.category === "structural") {
        structural.push(move);
      }
    });

    return { protocol, structural };
  }, [moves]);

  // Handle move execution
  const executeMove = useCallback(
    async (move: Move) => {
      if (move.disabled || executingMove) return;

      setExecutingMove(move.kind);

      try {
        // Special handling for GROUNDS - open commit modal
        if (move.kind === "GROUNDS") {
          setPendingGroundsPayload(move.payload || {});
          setExecutingMove(null);
          // Close the main dialog first to release focus trap
          onOpenChange(false);
          // Open NLCommitPopover after a brief delay to ensure dialog has released focus
          setTimeout(() => {
            setGroundsModalOpen(true);
          }, 100);
          return;
        }

        // Special handling for structural moves - open modal
        if (
          move.kind === "THEREFORE" ||
          move.kind === "SUPPOSE" ||
          move.kind === "DISCHARGE"
        ) {
          setStructuralMoveKind(move.kind);
          setStructuralModalOpen(true);
          setExecutingMove(null);
          return;
        }

        // Regular move - post directly
        const response = await fetch("/api/dialogue/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deliberationId,
            targetType,
            targetId,
            kind: move.kind,
            locusPath,
            payload: move.payload || {},
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || `HTTP ${response.status}`);
        }

        // Success! Refresh and notify
        await mutate();
        onMovePerformed?.();

        // Dispatch events for listeners
        window.dispatchEvent(
          new CustomEvent("dialogue:moves:refresh", {
            detail: { deliberationId },
          })
        );

        // Auto-close after successful non-interactive move
        const interactiveMoves = ["GROUNDS", "THEREFORE", "SUPPOSE", "DISCHARGE"];
        if (!interactiveMoves.includes(move.kind)) {
          setTimeout(() => onOpenChange(false), 500);
        }
      } catch (err) {
        console.error("Failed to execute move:", err);
        alert(`Failed to execute move: ${err instanceof Error ? err.message : "Unknown error"}`);
      } finally {
        setExecutingMove(null);
      }
    },
    [
      deliberationId,
      targetType,
      targetId,
      locusPath,
      executingMove,
      mutate,
      onMovePerformed,
      onOpenChange,
    ]
  );

  // Handle structural move submission
  const handleStructuralMoveSubmit = useCallback(
    async (text: string) => {
      if (!structuralMoveKind) return;

      try {
        // Build payload based on move kind
        const payload: Record<string, any> = {
          locusPath,
        };

        // THEREFORE and SUPPOSE require 'expression' field
        if (structuralMoveKind === "THEREFORE" || structuralMoveKind === "SUPPOSE") {
          payload.expression = text;
        } else {
          // DISCHARGE and other moves use 'text'
          payload.text = text;
        }

        const response = await fetch("/api/dialogue/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deliberationId,
            targetType,
            targetId,
            kind: structuralMoveKind,
            locusPath,
            payload,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || `HTTP ${response.status}`);
        }

        // Success!
        await mutate();
        onMovePerformed?.();
        setStructuralModalOpen(false);
        setStructuralMoveKind(null);

        window.dispatchEvent(
          new CustomEvent("dialogue:moves:refresh", {
            detail: { deliberationId },
          })
        );

        setTimeout(() => onOpenChange(false), 500);
      } catch (err) {
        console.error("Failed to submit structural move:", err);
        throw err;
      }
    },
    [
      structuralMoveKind,
      deliberationId,
      targetType,
      targetId,
      locusPath,
      mutate,
      onMovePerformed,
      onOpenChange,
    ]
  );

  // Render move button
  const renderMoveButton = (move: Move) => {
    const config = MOVE_CONFIG[move.kind];
    if (!config) return null;

    const Icon = config.icon;
    const isExecuting = executingMove === move.kind;

    return (
      <button
        key={move.kind}
        onClick={() => executeMove(move)}
        disabled={move.disabled || isExecuting}
        className={`
          group relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all duration-200
          ${
            move.disabled
              ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200"
              : config.tone === "primary"
              ? "border-indigo-300 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-400 hover:shadow-md"
              : config.tone === "danger"
              ? "border-rose-300 bg-rose-50 hover:bg-rose-100 hover:border-rose-400 hover:shadow-md"
              : "border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 hover:shadow-md"
          }
          ${isExecuting ? "scale-95 opacity-75" : "hover:scale-[1.02]"}
        `}
        aria-label={config.label}
        title={move.disabled ? move.disabledReason : config.description}
      >
        {/* Loading overlay */}
        {isExecuting && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
            <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Icon and label */}
        <div className="flex items-center gap-3 w-full">
          <div
            className={`
            p-2 rounded-lg transition-colors
            ${
              config.tone === "primary"
                ? "bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200"
                : config.tone === "danger"
                ? "bg-rose-100 text-rose-600 group-hover:bg-rose-200"
                : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
            }
          `}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm text-slate-900">{config.label}</div>
          </div>
        </div>

        {/* Description */}
        <div className="text-xs text-slate-600 leading-relaxed">
          {move.disabled ? move.disabledReason : config.description}
        </div>
      </button>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-indigo-600" />
              Dialogue Actions
            </DialogTitle>
            <p className="text-sm text-slate-600">
              Choose a dialogical move to perform on this {targetType}
            </p>
          </DialogHeader>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-600">Loading available moves...</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
              <strong>Error:</strong> {error.message || "Failed to load moves"}
            </div>
          )}

          {/* Content */}
          {!isLoading && !error && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                {categories.includes("protocol") && (
                  <TabsTrigger value="protocol" className="flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    Protocol Moves
                  </TabsTrigger>
                )}
                {categories.includes("structural") && (
                  <TabsTrigger value="structural" className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    Structural
                  </TabsTrigger>
                )}
                {categories.includes("cqs") && targetType === ("argument" as TargetType) && (
                  <TabsTrigger value="cqs" className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Critical Questions
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Protocol Moves Tab */}
              {categories.includes("protocol") && (
                <TabsContent value="protocol" className="space-y-3 mt-4">
                  {groupedMoves.protocol.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      No protocol moves available for this target.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {groupedMoves.protocol.map((move) => renderMoveButton(move))}
                    </div>
                  )}
                </TabsContent>
              )}

              {/* Structural Moves Tab */}
              {categories.includes("structural") && (
                <TabsContent value="structural" className="space-y-3 mt-4">
                  {groupedMoves.structural.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      No structural moves available for this target.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {groupedMoves.structural.map((move) => renderMoveButton(move))}
                    </div>
                  )}
                </TabsContent>
              )}

              {/* Critical Questions Tab */}
              {categories.includes("cqs") && targetType === ("argument" as TargetType) && (
                <TabsContent value="cqs" className="space-y-3 mt-4">
                  {cqActions.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      No critical questions available for this argument.
                    </div>
                  ) : (
                    <CQContextPanel
                      deliberationId={deliberationId}
                      targetType={targetType as "argument" | "claim"}
                      targetId={targetId}
                      actions={cqActions}
                    />
                  )}
                </TabsContent>
              )}
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* NL Commit Popover for GROUNDS moves */}
      {groundsModalOpen && (
        <NLCommitPopover
          open={groundsModalOpen}
          onOpenChange={setGroundsModalOpen}
          deliberationId={deliberationId}
          targetType={targetType as "argument" | "claim" | "card"}
          targetId={targetId}
          locusPath={pendingGroundsPayload?.justifiedByLocus ?? locusPath}
          cqKey={
            pendingGroundsPayload?.cqId ??
            pendingGroundsPayload?.schemeKey ??
            "default"
          }
          defaultOwner="Proponent"
          onDone={() => {
            mutate();
            onMovePerformed?.();
            setGroundsModalOpen(false);
            onOpenChange(false);
          }}
        />
      )}

      {/* Structural Move Modal */}
      {structuralModalOpen && structuralMoveKind && (
        <StructuralMoveModal
          open={structuralModalOpen}
          onOpenChange={setStructuralModalOpen}
          kind={structuralMoveKind}
          onSubmit={handleStructuralMoveSubmit}
        />
      )}
    </>
  );
}
