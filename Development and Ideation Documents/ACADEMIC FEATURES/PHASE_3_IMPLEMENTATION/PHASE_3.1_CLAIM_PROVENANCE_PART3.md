# Phase 3.1: Claim Provenance Tracking — Part 3

**Sub-Phase:** 3.1 of 3.3 (Final)  
**Focus:** UI Components for Provenance & Challenges

---

## Implementation Steps (Continued)

### Step 3.1.7: React Query Hooks

**File:** `lib/provenance/hooks.ts`

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ClaimProvenance,
  ChallengeReport,
  ClaimTimelineEvent,
  AttackType,
  AttackStatus,
} from "./types";

// ===== Query Keys =====
export const provenanceKeys = {
  all: ["provenance"] as const,
  claim: (claimId: string) => [...provenanceKeys.all, "claim", claimId] as const,
  challenges: (claimId: string) => [...provenanceKeys.all, "challenges", claimId] as const,
  timeline: (claimId: string) => [...provenanceKeys.all, "timeline", claimId] as const,
  canonical: (canonicalId: string) => [...provenanceKeys.all, "canonical", canonicalId] as const,
};

// ===== Provenance Queries =====

export function useClaimProvenance(claimId: string) {
  return useQuery({
    queryKey: provenanceKeys.claim(claimId),
    queryFn: async (): Promise<ClaimProvenance> => {
      const res = await fetch(`/api/claims/${claimId}/provenance`);
      if (!res.ok) throw new Error("Failed to fetch provenance");
      return res.json();
    },
    enabled: !!claimId,
  });
}

export function useChallengeReport(claimId: string) {
  return useQuery({
    queryKey: provenanceKeys.challenges(claimId),
    queryFn: async (): Promise<ChallengeReport> => {
      const res = await fetch(`/api/claims/${claimId}/challenges`);
      if (!res.ok) throw new Error("Failed to fetch challenges");
      return res.json();
    },
    enabled: !!claimId,
  });
}

export function useClaimTimeline(claimId: string) {
  return useQuery({
    queryKey: provenanceKeys.timeline(claimId),
    queryFn: async (): Promise<ClaimTimelineEvent[]> => {
      const res = await fetch(`/api/claims/${claimId}/timeline`);
      if (!res.ok) throw new Error("Failed to fetch timeline");
      return res.json();
    },
    enabled: !!claimId,
  });
}

// ===== Mutations =====

export function useCreateVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      claimId,
      text,
      changeType,
      changeReason,
    }: {
      claimId: string;
      text: string;
      changeType: string;
      changeReason?: string;
    }) => {
      const res = await fetch(`/api/claims/${claimId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, changeType, changeReason }),
      });
      if (!res.ok) throw new Error("Failed to create version");
      return res.json();
    },
    onSuccess: (_, { claimId }) => {
      queryClient.invalidateQueries({ queryKey: provenanceKeys.claim(claimId) });
      queryClient.invalidateQueries({ queryKey: provenanceKeys.timeline(claimId) });
    },
  });
}

export function useCreateAttack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetClaimId,
      attackingArgumentId,
      attackType,
      attackSubtype,
    }: {
      targetClaimId: string;
      attackingArgumentId: string;
      attackType: AttackType;
      attackSubtype?: string;
    }) => {
      const res = await fetch("/api/attacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetClaimId,
          attackingArgumentId,
          attackType,
          attackSubtype,
        }),
      });
      if (!res.ok) throw new Error("Failed to create attack");
      return res.json();
    },
    onSuccess: (_, { targetClaimId }) => {
      queryClient.invalidateQueries({ queryKey: provenanceKeys.challenges(targetClaimId) });
      queryClient.invalidateQueries({ queryKey: provenanceKeys.claim(targetClaimId) });
    },
  });
}

export function useUpdateAttackStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      attackId,
      status,
      resolutionNote,
      targetClaimId,
    }: {
      attackId: string;
      status: AttackStatus;
      resolutionNote?: string;
      targetClaimId: string;
    }) => {
      const res = await fetch(`/api/attacks/${attackId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolutionNote }),
      });
      if (!res.ok) throw new Error("Failed to update attack status");
      return res.json();
    },
    onSuccess: (_, { targetClaimId }) => {
      queryClient.invalidateQueries({ queryKey: provenanceKeys.challenges(targetClaimId) });
      queryClient.invalidateQueries({ queryKey: provenanceKeys.claim(targetClaimId) });
    },
  });
}
```

---

### Step 3.1.8: Provenance Timeline Component

**File:** `components/provenance/ProvenanceTimeline.tsx`

```tsx
"use client";

import React from "react";
import { useClaimTimeline } from "@/lib/provenance/hooks";
import { ClaimTimelineEvent } from "@/lib/provenance/types";
import { format, formatDistanceToNow } from "date-fns";
import {
  FilePlus,
  Edit3,
  ShieldAlert,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Link,
  GitBranch,
} from "lucide-react";

interface ProvenanceTimelineProps {
  claimId: string;
  maxEvents?: number;
  showDetails?: boolean;
}

const eventIcons: Record<ClaimTimelineEvent["type"], React.ElementType> = {
  CREATED: FilePlus,
  VERSION_CREATED: Edit3,
  ATTACKED: ShieldAlert,
  DEFENDED: Shield,
  STATUS_CHANGED: CheckCircle,
  ORIGIN_SET: Link,
  LINKED_TO_CANONICAL: GitBranch,
};

const eventColors: Record<ClaimTimelineEvent["type"], string> = {
  CREATED: "bg-green-100 text-green-700 border-green-300",
  VERSION_CREATED: "bg-blue-100 text-blue-700 border-blue-300",
  ATTACKED: "bg-red-100 text-red-700 border-red-300",
  DEFENDED: "bg-purple-100 text-purple-700 border-purple-300",
  STATUS_CHANGED: "bg-amber-100 text-amber-700 border-amber-300",
  ORIGIN_SET: "bg-slate-100 text-slate-700 border-slate-300",
  LINKED_TO_CANONICAL: "bg-cyan-100 text-cyan-700 border-cyan-300",
};

export default function ProvenanceTimeline({
  claimId,
  maxEvents = 20,
  showDetails = true,
}: ProvenanceTimelineProps) {
  const { data: timeline, isLoading, error } = useClaimTimeline(claimId);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm">Failed to load timeline</div>
    );
  }

  const events = timeline?.slice(0, maxEvents) || [];

  if (events.length === 0) {
    return (
      <div className="text-gray-500 text-sm text-center py-4">
        No history recorded yet
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

      <div className="space-y-4">
        {events.map((event, index) => {
          const Icon = eventIcons[event.type] || Clock;
          const colorClass = eventColors[event.type] || "bg-gray-100 text-gray-700";

          return (
            <div key={event.id || index} className="relative flex gap-4">
              {/* Icon */}
              <div
                className={`z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 ${colorClass}`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-gray-900">
                    {event.description}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(event.timestamp), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                {showDetails && event.metadata && (
                  <div className="mt-1 text-xs text-gray-600">
                    {event.metadata.actor && (
                      <span>by {event.metadata.actor.name}</span>
                    )}
                    {event.metadata.changeReason && (
                      <span className="ml-2 italic">
                        &ldquo;{event.metadata.changeReason}&rdquo;
                      </span>
                    )}
                  </div>
                )}

                {showDetails && event.metadata?.previousValue && (
                  <div className="mt-2 text-xs">
                    <span className="text-gray-500">Changed from: </span>
                    <span className="line-through text-gray-400">
                      {event.metadata.previousValue}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {timeline && timeline.length > maxEvents && (
        <div className="text-center mt-4">
          <button className="text-sm text-blue-600 hover:underline">
            View all {timeline.length} events
          </button>
        </div>
      )}
    </div>
  );
}
```

---

### Step 3.1.9: Challenge Report Component

**File:** `components/provenance/ChallengeReportPanel.tsx`

```tsx
"use client";

import React, { useState } from "react";
import { useChallengeReport } from "@/lib/provenance/hooks";
import { AttackSummary, DefenseSummary, AttackType } from "@/lib/provenance/types";
import {
  ShieldAlert,
  Shield,
  Swords,
  Target,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  User,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ChallengeReportPanelProps {
  claimId: string;
  onAttackClick?: (attackId: string) => void;
  onDefenseClick?: (defenseId: string) => void;
}

const attackTypeLabels: Record<AttackType, { label: string; icon: React.ElementType; description: string }> = {
  REBUTTAL: {
    label: "Rebuttals",
    icon: Swords,
    description: "Direct contradictions of the claim",
  },
  UNDERCUT: {
    label: "Undercuts",
    icon: Target,
    description: "Attacks on supporting arguments",
  },
  UNDERMINE: {
    label: "Undermines",
    icon: HelpCircle,
    description: "Attacks on premises or evidence",
  },
};

const statusColors: Record<string, string> = {
  OPEN: "bg-yellow-100 text-yellow-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800",
  DEFENDED: "bg-green-100 text-green-800",
  PARTIALLY_DEFENDED: "bg-lime-100 text-lime-800",
  CONCEDED: "bg-red-100 text-red-800",
  WITHDRAWN: "bg-gray-100 text-gray-600",
  STALEMATE: "bg-purple-100 text-purple-800",
};

function AttackCard({
  attack,
  onClick,
}: {
  attack: AttackSummary;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 line-clamp-2">
            {attack.argument.summary}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex items-center text-xs text-gray-500">
              <User className="w-3 h-3 mr-1" />
              {attack.argument.author.name}
            </div>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(attack.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[attack.status]}`}>
            {attack.status.toLowerCase().replace("_", " ")}
          </span>
          {attack.defenseCount > 0 && (
            <span className="text-xs text-gray-500">
              {attack.defenseCount} defense{attack.defenseCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function AttackTypeSection({
  type,
  attacks,
  onAttackClick,
}: {
  type: AttackType;
  attacks: AttackSummary[];
  onAttackClick?: (attackId: string) => void;
}) {
  const [expanded, setExpanded] = useState(attacks.length > 0);
  const { label, icon: Icon, description } = attackTypeLabels[type];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-sm">{label}</span>
          <span className="text-xs text-gray-500">({attacks.length})</span>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="p-3 space-y-2">
          {attacks.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-2">
              No {label.toLowerCase()} recorded
            </p>
          ) : (
            attacks.map((attack) => (
              <AttackCard
                key={attack.id}
                attack={attack}
                onClick={() => onAttackClick?.(attack.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function ChallengeReportPanel({
  claimId,
  onAttackClick,
  onDefenseClick,
}: ChallengeReportPanelProps) {
  const { data: report, isLoading, error } = useChallengeReport(claimId);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-16 bg-gray-200 rounded-lg" />
        <div className="h-24 bg-gray-200 rounded-lg" />
        <div className="h-24 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="text-red-500 text-sm text-center py-4">
        Failed to load challenge report
      </div>
    );
  }

  const totalChallenges =
    report.challenges.rebuttals.length +
    report.challenges.undercuts.length +
    report.challenges.undermines.length;

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">Challenge Summary</h3>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              report.resolutionStatus === "defended"
                ? "bg-green-100 text-green-800"
                : report.resolutionStatus === "conceded"
                ? "bg-red-100 text-red-800"
                : report.resolutionStatus === "stalemate"
                ? "bg-purple-100 text-purple-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {report.resolutionStatus}
          </span>
        </div>
        <p className="text-sm text-gray-600">{report.resolutionSummary}</p>
        <div className="flex gap-4 mt-3 text-sm">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <span>{totalChallenges} challenges</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-green-500" />
            <span>{report.defenses.length} defenses</span>
          </div>
        </div>
      </div>

      {/* Attack Sections */}
      <div className="space-y-3">
        <AttackTypeSection
          type="REBUTTAL"
          attacks={report.challenges.rebuttals}
          onAttackClick={onAttackClick}
        />
        <AttackTypeSection
          type="UNDERCUT"
          attacks={report.challenges.undercuts}
          onAttackClick={onAttackClick}
        />
        <AttackTypeSection
          type="UNDERMINE"
          attacks={report.challenges.undermines}
          onAttackClick={onAttackClick}
        />
      </div>

      {/* Defenses Section */}
      {report.defenses.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-3">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-600" />
            Defenses ({report.defenses.length})
          </h4>
          <div className="space-y-2">
            {report.defenses.map((defense) => (
              <button
                key={defense.id}
                onClick={() => onDefenseClick?.(defense.id)}
                className="w-full text-left p-2.5 rounded border border-gray-100 hover:border-gray-200 hover:bg-gray-50"
              >
                <p className="text-sm text-gray-900 line-clamp-2">
                  {defense.argument.summary}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span className="capitalize">{defense.defenseType.toLowerCase()}</span>
                  {defense.outcome && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span
                        className={
                          defense.outcome === "SUCCESSFUL"
                            ? "text-green-600"
                            : defense.outcome === "UNSUCCESSFUL"
                            ? "text-red-600"
                            : "text-amber-600"
                        }
                      >
                        {defense.outcome.toLowerCase()}
                      </span>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Step 3.1.10: Consensus Status Indicator

**File:** `components/provenance/ConsensusIndicator.tsx`

```tsx
"use client";

import React from "react";
import { ConsensusStatus } from "@/lib/provenance/types";
import {
  HelpCircle,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

interface ConsensusIndicatorProps {
  status: ConsensusStatus;
  challengeCount?: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const statusConfig: Record<
  ConsensusStatus,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    description: string;
  }
> = {
  UNDETERMINED: {
    label: "Undetermined",
    icon: HelpCircle,
    color: "text-gray-500",
    bgColor: "bg-gray-100",
    description: "Consensus not yet established",
  },
  EMERGING: {
    label: "Emerging",
    icon: TrendingUp,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    description: "Building consensus, some support",
  },
  ACCEPTED: {
    label: "Accepted",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100",
    description: "Generally accepted by community",
  },
  CONTESTED: {
    label: "Contested",
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    description: "Under active debate",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-100",
    description: "Generally rejected by community",
  },
  SUPERSEDED: {
    label: "Superseded",
    icon: ArrowRight,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    description: "Replaced by newer formulation",
  },
};

const sizeClasses = {
  sm: { icon: "w-3 h-3", text: "text-xs", padding: "px-1.5 py-0.5" },
  md: { icon: "w-4 h-4", text: "text-sm", padding: "px-2 py-1" },
  lg: { icon: "w-5 h-5", text: "text-base", padding: "px-3 py-1.5" },
};

export default function ConsensusIndicator({
  status,
  challengeCount,
  showLabel = true,
  size = "md",
}: ConsensusIndicatorProps) {
  const config = statusConfig[status];
  const sizes = sizeClasses[size];
  const Icon = config.icon;

  const content = (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full ${config.bgColor} ${sizes.padding}`}
    >
      <Icon className={`${sizes.icon} ${config.color}`} />
      {showLabel && (
        <span className={`font-medium ${sizes.text} ${config.color}`}>
          {config.label}
        </span>
      )}
      {challengeCount !== undefined && challengeCount > 0 && (
        <span
          className={`${sizes.text} opacity-75 ${config.color}`}
        >
          ({challengeCount})
        </span>
      )}
    </div>
  );

  return (
    <Tooltip content={config.description}>
      {content}
    </Tooltip>
  );
}

/**
 * Compact version for lists
 */
export function ConsensusIndicatorCompact({
  status,
}: {
  status: ConsensusStatus;
}) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Tooltip content={`${config.label}: ${config.description}`}>
      <Icon className={`w-4 h-4 ${config.color}`} />
    </Tooltip>
  );
}
```

---

### Step 3.1.11: Version History Component

**File:** `components/provenance/VersionHistory.tsx`

```tsx
"use client";

import React, { useState } from "react";
import { useClaimProvenance } from "@/lib/provenance/hooks";
import { ClaimVersionSummary } from "@/lib/provenance/types";
import { format, formatDistanceToNow } from "date-fns";
import {
  History,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  User,
  MessageSquare,
} from "lucide-react";

interface VersionHistoryProps {
  claimId: string;
  onVersionSelect?: (versionId: string) => void;
}

const changeTypeLabels: Record<string, { label: string; color: string }> = {
  CREATED: { label: "Created", color: "text-green-600 bg-green-50" },
  REFINED: { label: "Refined", color: "text-blue-600 bg-blue-50" },
  STRENGTHENED: { label: "Strengthened", color: "text-emerald-600 bg-emerald-50" },
  WEAKENED: { label: "Weakened", color: "text-orange-600 bg-orange-50" },
  CORRECTED: { label: "Corrected", color: "text-amber-600 bg-amber-50" },
  MERGED: { label: "Merged", color: "text-purple-600 bg-purple-50" },
  SPLIT: { label: "Split", color: "text-indigo-600 bg-indigo-50" },
  IMPORTED: { label: "Imported", color: "text-cyan-600 bg-cyan-50" },
};

function VersionCard({
  version,
  isLatest,
  showDiff,
  onSelect,
}: {
  version: ClaimVersionSummary;
  isLatest: boolean;
  showDiff: boolean;
  onSelect?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const typeConfig = changeTypeLabels[version.changeType] || {
    label: version.changeType,
    color: "text-gray-600 bg-gray-50",
  };

  return (
    <div
      className={`border rounded-lg overflow-hidden ${
        isLatest ? "border-blue-300 bg-blue-50/30" : "border-gray-200"
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-gray-500">
            <History className="w-4 h-4" />
            <span className="text-sm font-mono">v{version.versionNumber}</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${typeConfig.color}`}
          >
            {typeConfig.label}
          </span>
          {isLatest && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
              Current
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
          </span>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-gray-100">
          {/* Text content */}
          <div className="pt-3">
            <p className="text-sm text-gray-800">{version.text}</p>
          </div>

          {/* Change reason */}
          {version.changeReason && (
            <div className="flex items-start gap-2 text-sm">
              <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
              <span className="text-gray-600 italic">
                &ldquo;{version.changeReason}&rdquo;
              </span>
            </div>
          )}

          {/* Changed fields */}
          {version.changedFields && version.changedFields.length > 0 && (
            <div className="text-xs text-gray-500">
              Changed: {version.changedFields.join(", ")}
            </div>
          )}

          {/* Author and date */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            {version.author && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{version.author.name}</span>
              </div>
            )}
            <span>{format(new Date(version.createdAt), "PPp")}</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            {onSelect && !isLatest && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
                className="text-xs px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 transition"
              >
                View this version
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VersionHistory({
  claimId,
  onVersionSelect,
}: VersionHistoryProps) {
  const { data: provenance, isLoading, error } = useClaimProvenance(claimId);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error || !provenance) {
    return (
      <div className="text-red-500 text-sm text-center py-4">
        Failed to load version history
      </div>
    );
  }

  const versions = provenance.versions || [];

  if (versions.length === 0) {
    return (
      <div className="text-gray-500 text-sm text-center py-8">
        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No version history</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-900">
          Version History ({versions.length})
        </h3>
      </div>

      <div className="space-y-2">
        {versions.map((version, index) => (
          <VersionCard
            key={version.id}
            version={version}
            isLatest={index === 0}
            showDiff={index < versions.length - 1}
            onSelect={() => onVersionSelect?.(version.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

---

### Step 3.1.12: Combined Provenance Panel

**File:** `components/provenance/ClaimProvenancePanel.tsx`

```tsx
"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import ProvenanceTimeline from "./ProvenanceTimeline";
import ChallengeReportPanel from "./ChallengeReportPanel";
import VersionHistory from "./VersionHistory";
import ConsensusIndicator from "./ConsensusIndicator";
import { useClaimProvenance } from "@/lib/provenance/hooks";
import {
  Clock,
  ShieldAlert,
  History,
  Link,
  ExternalLink,
} from "lucide-react";

interface ClaimProvenancePanelProps {
  claimId: string;
  className?: string;
}

export default function ClaimProvenancePanel({
  claimId,
  className = "",
}: ClaimProvenancePanelProps) {
  const { data: provenance, isLoading } = useClaimProvenance(claimId);
  const [activeTab, setActiveTab] = useState("timeline");

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-12 bg-gray-200 rounded mb-4" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Claim Provenance</h2>
          {provenance && (
            <ConsensusIndicator
              status={provenance.consensusStatus}
              challengeCount={provenance.challengeCount}
            />
          )}
        </div>

        {/* Origin info */}
        {provenance?.origin && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <Link className="w-4 h-4" />
            <span>
              Originated from{" "}
              <a
                href={provenance.origin.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                {provenance.origin.sourceName}
                <ExternalLink className="w-3 h-3" />
              </a>
            </span>
          </div>
        )}

        {/* Quick stats */}
        {provenance && (
          <div className="mt-3 flex gap-4 text-sm text-gray-500">
            <span>{provenance.versions.length} version(s)</span>
            <span>{provenance.challengeCount} challenge(s)</span>
            {provenance.canonicalId && (
              <span className="text-blue-600">
                Canonical: {provenance.canonicalId.slice(0, 12)}...
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="px-4 border-b border-gray-100">
          <TabsTrigger value="timeline" className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            Challenges
            {provenance && provenance.challengeCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                {provenance.challengeCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="versions" className="flex items-center gap-1.5">
            <History className="w-4 h-4" />
            Versions
          </TabsTrigger>
        </TabsList>

        <div className="p-4">
          <TabsContent value="timeline">
            <ProvenanceTimeline claimId={claimId} />
          </TabsContent>

          <TabsContent value="challenges">
            <ChallengeReportPanel claimId={claimId} />
          </TabsContent>

          <TabsContent value="versions">
            <VersionHistory claimId={claimId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
```

---

## Phase 3.1 Complete Checklist

| # | Task | File(s) | Part |
|---|------|---------|------|
| 1 | ClaimVersion schema | `prisma/schema.prisma` | 1 |
| 2 | Attack/Defense schema | `prisma/schema.prisma` | 1 |
| 3 | CanonicalClaim schema | `prisma/schema.prisma` | 1 |
| 4 | Provenance types | `lib/provenance/types.ts` | 1 |
| 5 | Provenance service | `lib/provenance/provenanceService.ts` | 1 |
| 6 | Initialize version history | `lib/provenance/provenanceService.ts` | 1 |
| 7 | Challenge service | `lib/provenance/challengeService.ts` | 2 |
| 8 | Canonical claim service | `lib/provenance/canonicalService.ts` | 2 |
| 9 | Provenance API | `app/api/claims/[claimId]/provenance/route.ts` | 2 |
| 10 | Challenges API | `app/api/claims/[claimId]/challenges/route.ts` | 2 |
| 11 | Timeline API | `app/api/claims/[claimId]/timeline/route.ts` | 2 |
| 12 | Versions API | `app/api/claims/[claimId]/versions/route.ts` | 2 |
| 13 | Attacks API | `app/api/attacks/route.ts` | 2 |
| 14 | Canonical search API | `app/api/canonical-claims/search/route.ts` | 2 |
| 15 | React Query hooks | `lib/provenance/hooks.ts` | 3 |
| 16 | ProvenanceTimeline | `components/provenance/ProvenanceTimeline.tsx` | 3 |
| 17 | ChallengeReportPanel | `components/provenance/ChallengeReportPanel.tsx` | 3 |
| 18 | ConsensusIndicator | `components/provenance/ConsensusIndicator.tsx` | 3 |
| 19 | VersionHistory | `components/provenance/VersionHistory.tsx` | 3 |
| 20 | ClaimProvenancePanel | `components/provenance/ClaimProvenancePanel.tsx` | 3 |

---

## Next: Phase 3.2

Continue to **Phase 3.2: Argument-Level Citations** for:
- Argument citation model (cite specific arguments)
- Argument permalinks
- Citation context tracking
- Citation graph visualization

---

*End of Phase 3.1*
