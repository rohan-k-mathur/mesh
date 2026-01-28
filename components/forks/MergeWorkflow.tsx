"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Link2,
  Plus,
  Replace,
  Shield,
  Swords,
  X,
} from "lucide-react";

/**
 * Merge Workflow Components
 * 
 * Phase 2.2: Fork/Branch/Merge for Deliberations
 * 
 * - MergeStrategy selector
 * - MergeClaimSelector: Select claims to merge with strategy
 * - MergeConflictViewer: Display and resolve merge conflicts
 */

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export type MergeStrategy =
  | "ADD_NEW"
  | "REPLACE"
  | "LINK_SUPPORT"
  | "LINK_CHALLENGE"
  | "SKIP";

export type MergeConflictType =
  | "CLAIM_EXISTS"
  | "ARGUMENT_ORPHAN"
  | "DELETED_IN_TARGET";

export interface ClaimForMerge {
  id: string;
  content: string;
  status?: string;
  importedFromId?: string;
  syncStatus?: string;
}

export interface MergeClaimSelection {
  claimId: string;
  strategy: MergeStrategy;
  targetClaimId?: string;
  claim: ClaimForMerge;
}

export interface MergeConflict {
  type: MergeConflictType;
  claimId: string;
  claim: ClaimForMerge;
  existingClaimId?: string;
  existingClaim?: ClaimForMerge;
  message: string;
}

// ─────────────────────────────────────────────────────────
// Strategy Configuration
// ─────────────────────────────────────────────────────────

const STRATEGY_CONFIG: Record<MergeStrategy, {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = {
  ADD_NEW: {
    label: "Add as New",
    description: "Create a new claim in the target",
    icon: Plus,
    color: "text-green-600",
  },
  REPLACE: {
    label: "Replace",
    description: "Replace the existing claim",
    icon: Replace,
    color: "text-blue-600",
  },
  LINK_SUPPORT: {
    label: "Link as Support",
    description: "Add as supporting argument",
    icon: Shield,
    color: "text-emerald-600",
  },
  LINK_CHALLENGE: {
    label: "Link as Challenge",
    description: "Add as challenging argument",
    icon: Swords,
    color: "text-red-600",
  },
  SKIP: {
    label: "Skip",
    description: "Don't merge this claim",
    icon: X,
    color: "text-slate-400",
  },
};

// ─────────────────────────────────────────────────────────
// MergeStrategySelect
// ─────────────────────────────────────────────────────────

export interface MergeStrategySelectProps {
  value: MergeStrategy;
  onChange: (strategy: MergeStrategy) => void;
  availableStrategies?: MergeStrategy[];
  disabled?: boolean;
  className?: string;
}

export function MergeStrategySelect({
  value,
  onChange,
  availableStrategies = ["ADD_NEW", "REPLACE", "LINK_SUPPORT", "LINK_CHALLENGE", "SKIP"],
  disabled = false,
  className,
}: MergeStrategySelectProps) {
  const config = STRATEGY_CONFIG[value];
  const Icon = config.icon;

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={cn("w-[160px]", className)}>
        <SelectValue>
          <div className="flex items-center gap-2">
            <Icon className={cn("w-3.5 h-3.5", config.color)} />
            <span className="text-xs">{config.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {availableStrategies.map((strategy) => {
          const strategyConfig = STRATEGY_CONFIG[strategy];
          const StrategyIcon = strategyConfig.icon;
          return (
            <SelectItem key={strategy} value={strategy}>
              <div className="flex items-center gap-2">
                <StrategyIcon className={cn("w-3.5 h-3.5", strategyConfig.color)} />
                <div>
                  <div className="text-sm">{strategyConfig.label}</div>
                  <div className="text-xs text-slate-500">
                    {strategyConfig.description}
                  </div>
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

// ─────────────────────────────────────────────────────────
// MergeClaimRow
// ─────────────────────────────────────────────────────────

interface MergeClaimRowProps {
  selection: MergeClaimSelection;
  onStrategyChange: (strategy: MergeStrategy) => void;
  onToggle: (selected: boolean) => void;
  isSelected: boolean;
  hasConflict?: boolean;
  conflictMessage?: string;
}

function MergeClaimRow({
  selection,
  onStrategyChange,
  onToggle,
  isSelected,
  hasConflict,
  conflictMessage,
}: MergeClaimRowProps) {
  const [expanded, setExpanded] = React.useState(false);
  const claim = selection.claim;

  return (
    <div
      className={cn(
        "border rounded-lg transition-colors",
        hasConflict
          ? "border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10"
          : isSelected
          ? "border-primary/50 bg-primary/5"
          : "border-slate-200 dark:border-slate-700"
      )}
    >
      <div className="flex items-start gap-3 p-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
          className="mt-0.5"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div
              className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
              onClick={() => setExpanded(!expanded)}
            >
              <span className={cn(!expanded && "line-clamp-2")}>
                {claim.content}
              </span>
              {claim.content.length > 100 && (
                <button
                  type="button"
                  className="text-xs text-primary hover:underline ml-1"
                >
                  {expanded ? (
                    <ChevronUp className="w-3 h-3 inline" />
                  ) : (
                    <ChevronDown className="w-3 h-3 inline" />
                  )}
                </button>
              )}
            </div>

            <MergeStrategySelect
              value={selection.strategy}
              onChange={onStrategyChange}
              disabled={!isSelected}
            />
          </div>

          {/* Sync status indicator */}
          {claim.syncStatus && (
            <div className="flex items-center gap-1 mt-1">
              <Badge variant="outline" className="text-xs">
                {claim.syncStatus === "SYNCED" && "Synced with original"}
                {claim.syncStatus === "DIVERGED" && "Modified in fork"}
                {claim.syncStatus === "ORIGINAL_UPDATED" && "Original updated"}
                {claim.syncStatus === "DETACHED" && "Detached from original"}
              </Badge>
            </div>
          )}

          {/* Conflict warning */}
          {hasConflict && conflictMessage && (
            <div className="flex items-center gap-2 mt-2 p-2 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{conflictMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MergeClaimSelector
// ─────────────────────────────────────────────────────────

export interface MergeClaimSelectorProps {
  claims: ClaimForMerge[];
  selections: MergeClaimSelection[];
  onSelectionsChange: (selections: MergeClaimSelection[]) => void;
  conflicts?: MergeConflict[];
  className?: string;
}

export function MergeClaimSelector({
  claims,
  selections,
  onSelectionsChange,
  conflicts = [],
  className,
}: MergeClaimSelectorProps) {
  // Initialize selections if empty
  React.useEffect(() => {
    if (selections.length === 0 && claims.length > 0) {
      onSelectionsChange(
        claims.map((claim) => ({
          claimId: claim.id,
          strategy: "ADD_NEW",
          claim,
        }))
      );
    }
  }, [claims, selections.length, onSelectionsChange]);

  const selectedCount = selections.filter((s) => s.strategy !== "SKIP").length;
  const conflictMap = React.useMemo(
    () => new Map(conflicts.map((c) => [c.claimId, c])),
    [conflicts]
  );

  const handleToggle = (claimId: string, selected: boolean) => {
    onSelectionsChange(
      selections.map((s) =>
        s.claimId === claimId
          ? { ...s, strategy: selected ? "ADD_NEW" : "SKIP" }
          : s
      )
    );
  };

  const handleStrategyChange = (claimId: string, strategy: MergeStrategy) => {
    onSelectionsChange(
      selections.map((s) =>
        s.claimId === claimId ? { ...s, strategy } : s
      )
    );
  };

  const selectAll = () => {
    onSelectionsChange(
      selections.map((s) => ({ ...s, strategy: "ADD_NEW" }))
    );
  };

  const deselectAll = () => {
    onSelectionsChange(
      selections.map((s) => ({ ...s, strategy: "SKIP" }))
    );
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Select Claims to Merge
          <span className="text-slate-400 font-normal ml-2">
            ({selectedCount} of {claims.length} selected)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={selectAll} className="h-7 text-xs">
            Select All
          </Button>
          <Button variant="ghost" size="sm" onClick={deselectAll} className="h-7 text-xs">
            Deselect All
          </Button>
        </div>
      </div>

      {/* Conflict summary */}
      {conflicts.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm text-amber-700 dark:text-amber-300">
            {conflicts.length} conflict{conflicts.length > 1 ? "s" : ""} detected
          </span>
        </div>
      )}

      {/* Claims list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {selections.map((selection) => {
          const conflict = conflictMap.get(selection.claimId);
          return (
            <MergeClaimRow
              key={selection.claimId}
              selection={selection}
              isSelected={selection.strategy !== "SKIP"}
              onToggle={(selected) => handleToggle(selection.claimId, selected)}
              onStrategyChange={(strategy) =>
                handleStrategyChange(selection.claimId, strategy)
              }
              hasConflict={!!conflict}
              conflictMessage={conflict?.message}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MergeConflictViewer
// ─────────────────────────────────────────────────────────

const CONFLICT_TYPE_CONFIG: Record<MergeConflictType, {
  label: string;
  description: string;
  color: string;
}> = {
  CLAIM_EXISTS: {
    label: "Claim Exists",
    description: "A similar claim already exists in the target",
    color: "text-amber-600",
  },
  ARGUMENT_ORPHAN: {
    label: "Orphan Argument",
    description: "Referenced claim not included in merge",
    color: "text-red-600",
  },
  DELETED_IN_TARGET: {
    label: "Deleted in Target",
    description: "The original claim was deleted in the target",
    color: "text-slate-600",
  },
};

export interface MergeConflictViewerProps {
  conflicts: MergeConflict[];
  onResolve?: (claimId: string, strategy: MergeStrategy) => void;
  className?: string;
}

export function MergeConflictViewer({
  conflicts,
  onResolve,
  className,
}: MergeConflictViewerProps) {
  if (conflicts.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <Check className="w-8 h-8 mx-auto text-green-500 mb-2" />
        <p className="text-sm text-slate-500">No conflicts detected</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-amber-500" />
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {conflicts.length} Conflict{conflicts.length > 1 ? "s" : ""} to Resolve
        </h3>
      </div>

      <div className="space-y-3">
        {conflicts.map((conflict, index) => {
          const config = CONFLICT_TYPE_CONFIG[conflict.type];

          return (
            <div
              key={`${conflict.claimId}-${index}`}
              className="p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={cn("text-xs", config.color)}>
                      {config.label}
                    </Badge>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                    {conflict.message}
                  </p>

                  {/* Show both claims for comparison */}
                  {conflict.existingClaim && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="text-xs font-medium text-slate-500 mb-1">
                          Source (Fork)
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3">
                          {conflict.claim.content}
                        </div>
                      </div>
                      <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="text-xs font-medium text-slate-500 mb-1">
                          Target (Existing)
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3">
                          {conflict.existingClaim.content}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {onResolve && (
                  <div className="flex-shrink-0">
                    <MergeStrategySelect
                      value="SKIP"
                      onChange={(strategy) => onResolve(conflict.claimId, strategy)}
                      availableStrategies={["REPLACE", "LINK_SUPPORT", "LINK_CHALLENGE", "SKIP"]}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
