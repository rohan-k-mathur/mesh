# Phase 4.1: Public Peer Review Deliberations — Part 4

**Sub-Phase:** 4.1 of 4.3  
**Focus:** UI Components for Peer Review

---

## Implementation Steps (Continued)

### Step 4.1.16: Review Dashboard Component

**File:** `components/review/ReviewDashboard.tsx`

```tsx
/**
 * Main dashboard for a peer review deliberation
 */

"use client";

import React from "react";
import {
  useReview,
  useReviewProgress,
  useReviewerAssignments,
  useReviewCommitments,
} from "@/lib/review/hooks";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PhaseTimeline } from "./PhaseTimeline";
import { ReviewerPanel } from "./ReviewerPanel";
import { CommitmentPanel } from "./CommitmentPanel";
import { ReviewActions } from "./ReviewActions";

interface ReviewDashboardProps {
  reviewId: string;
}

const statusColors: Record<string, string> = {
  INITIATED: "bg-gray-500",
  IN_REVIEW: "bg-blue-500",
  AUTHOR_RESPONSE: "bg-yellow-500",
  REVISION: "bg-orange-500",
  FINAL_REVIEW: "bg-purple-500",
  DECISION: "bg-indigo-500",
  COMPLETED: "bg-green-500",
  WITHDRAWN: "bg-red-500",
};

const decisionLabels: Record<string, { label: string; color: string }> = {
  ACCEPT: { label: "Accepted", color: "text-green-600" },
  MINOR_REVISION: { label: "Minor Revisions", color: "text-blue-600" },
  MAJOR_REVISION: { label: "Major Revisions", color: "text-orange-600" },
  REJECT: { label: "Rejected", color: "text-red-600" },
  DESK_REJECT: { label: "Desk Rejected", color: "text-red-700" },
};

export function ReviewDashboard({ reviewId }: ReviewDashboardProps) {
  const { data: review, isLoading: reviewLoading } = useReview(reviewId);
  const { data: progress, isLoading: progressLoading } =
    useReviewProgress(reviewId);
  const { data: assignments } = useReviewerAssignments(reviewId);
  const { data: commitments } = useReviewCommitments(reviewId, {
    onlyUnresolved: true,
  });

  if (reviewLoading || progressLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Review not found
      </div>
    );
  }

  const completedPhases =
    progress?.phases.filter((p) => p.status === "COMPLETED").length || 0;
  const totalPhases = progress?.phases.length || 1;
  const phaseProgress = (completedPhases / totalPhases) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{review.targetTitle}</h1>
            <Badge className={statusColors[review.status]}>
              {review.status.replace(/_/g, " ")}
            </Badge>
          </div>
          {review.targetPaper && (
            <p className="text-muted-foreground">
              Authors: {review.targetPaper.authors.join(", ")}
            </p>
          )}
        </div>

        {review.decision && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Decision</p>
            <p
              className={`text-xl font-semibold ${
                decisionLabels[review.decision]?.color
              }`}
            >
              {decisionLabels[review.decision]?.label}
            </p>
          </div>
        )}
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Review Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  Phase {completedPhases} of {totalPhases}
                </span>
                <span>{Math.round(phaseProgress)}%</span>
              </div>
              <Progress value={phaseProgress} />
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">
                  {assignments?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Reviewers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {progress?.openConcerns || 0}
                </p>
                <p className="text-sm text-muted-foreground">Open Concerns</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {progress?.resolvedConcerns || 0}
                </p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Timeline */}
      {progress && (
        <PhaseTimeline
          phases={progress.phases}
          currentPhaseId={review.currentPhase?.id}
        />
      )}

      {/* Actions */}
      {progress && (
        <ReviewActions
          reviewId={reviewId}
          status={review.status}
          canAdvance={progress.canAdvance}
          blockers={progress.blockers}
        />
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reviewers */}
        <ReviewerPanel reviewId={reviewId} assignments={assignments || []} />

        {/* Commitments */}
        <CommitmentPanel
          reviewId={reviewId}
          commitments={commitments || []}
          showOnlyUnresolved
        />
      </div>
    </div>
  );
}
```

---

### Step 4.1.17: Phase Timeline Component

**File:** `components/review/PhaseTimeline.tsx`

```tsx
/**
 * Visual timeline of review phases
 */

"use client";

import React from "react";
import { CheckCircle, Circle, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Phase {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
}

interface PhaseTimelineProps {
  phases: Phase[];
  currentPhaseId?: string;
}

const statusIcons: Record<string, React.ReactNode> = {
  COMPLETED: <CheckCircle className="w-5 h-5 text-green-500" />,
  ACTIVE: <Clock className="w-5 h-5 text-blue-500 animate-pulse" />,
  PENDING: <Circle className="w-5 h-5 text-gray-300" />,
  SKIPPED: <XCircle className="w-5 h-5 text-gray-400" />,
};

export function PhaseTimeline({ phases, currentPhaseId }: PhaseTimelineProps) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <h3 className="font-semibold mb-4">Review Phases</h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-border" />

        <div className="space-y-4">
          {phases.map((phase, index) => (
            <div
              key={phase.id}
              className={cn(
                "relative pl-8 py-2",
                phase.id === currentPhaseId && "bg-blue-50 dark:bg-blue-950/30 rounded-md -ml-2 pl-10"
              )}
            >
              {/* Status icon */}
              <div className="absolute left-0 top-3">
                {statusIcons[phase.status] || statusIcons.PENDING}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-medium",
                      phase.status === "COMPLETED" && "text-green-700",
                      phase.status === "ACTIVE" && "text-blue-700"
                    )}
                  >
                    {phase.name}
                  </span>
                  {phase.id === currentPhaseId && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      Current
                    </span>
                  )}
                </div>

                {(phase.startDate || phase.endDate) && (
                  <div className="text-sm text-muted-foreground">
                    {phase.startDate && (
                      <span>
                        Started:{" "}
                        {new Date(phase.startDate).toLocaleDateString()}
                      </span>
                    )}
                    {phase.endDate && (
                      <span className="ml-4">
                        Ended: {new Date(phase.endDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### Step 4.1.18: Reviewer Panel Component

**File:** `components/review/ReviewerPanel.tsx`

```tsx
/**
 * Panel showing reviewer assignments and status
 */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { ReviewerAssignmentSummary } from "@/lib/review/types";
import { InviteReviewerDialog } from "./InviteReviewerDialog";

interface ReviewerPanelProps {
  reviewId: string;
  assignments: ReviewerAssignmentSummary[];
}

const statusConfig: Record<
  string,
  { icon: React.ReactNode; color: string; label: string }
> = {
  INVITED: {
    icon: <Clock className="w-4 h-4" />,
    color: "bg-yellow-100 text-yellow-700",
    label: "Invited",
  },
  ACCEPTED: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: "bg-blue-100 text-blue-700",
    label: "Accepted",
  },
  DECLINED: {
    icon: <XCircle className="w-4 h-4" />,
    color: "bg-red-100 text-red-700",
    label: "Declined",
  },
  IN_PROGRESS: {
    icon: <Clock className="w-4 h-4" />,
    color: "bg-purple-100 text-purple-700",
    label: "In Progress",
  },
  COMPLETED: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: "bg-green-100 text-green-700",
    label: "Completed",
  },
  WITHDRAWN: {
    icon: <XCircle className="w-4 h-4" />,
    color: "bg-gray-100 text-gray-700",
    label: "Withdrawn",
  },
};

export function ReviewerPanel({ reviewId, assignments }: ReviewerPanelProps) {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Reviewers</CardTitle>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              Invite
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Reviewer</DialogTitle>
            </DialogHeader>
            <InviteReviewerDialog
              reviewId={reviewId}
              onSuccess={() => setInviteOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-3">
        {assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No reviewers assigned yet
          </p>
        ) : (
          assignments.map((assignment) => {
            const config = statusConfig[assignment.status];
            return (
              <div
                key={assignment.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      {assignment.userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{assignment.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      {assignment.role.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {assignment.blockingConcerns > 0 && (
                    <Badge variant="outline" className="text-orange-600">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {assignment.blockingConcerns}
                    </Badge>
                  )}
                  <Badge className={config?.color}>
                    {config?.icon}
                    <span className="ml-1">{config?.label}</span>
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
```

---

### Step 4.1.19: Commitment Panel Component

**File:** `components/review/CommitmentPanel.tsx`

```tsx
/**
 * Panel showing reviewer commitments/concerns
 */

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { ReviewerCommitmentSummary } from "@/lib/review/types";
import { useResolveCommitment } from "@/lib/review/hooks";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CommitmentPanelProps {
  reviewId: string;
  commitments: ReviewerCommitmentSummary[];
  showOnlyUnresolved?: boolean;
}

const positionConfig: Record<
  string,
  { icon: React.ReactNode; color: string }
> = {
  STRONGLY_SUPPORT: {
    icon: <ThumbsUp className="w-4 h-4" />,
    color: "text-green-600",
  },
  SUPPORT: {
    icon: <ThumbsUp className="w-4 h-4" />,
    color: "text-green-500",
  },
  NEUTRAL: {
    icon: null,
    color: "text-gray-500",
  },
  CONCERN: {
    icon: <ThumbsDown className="w-4 h-4" />,
    color: "text-orange-500",
  },
  STRONGLY_OPPOSE: {
    icon: <ThumbsDown className="w-4 h-4" />,
    color: "text-red-600",
  },
};

const strengthColors: Record<string, string> = {
  WEAK: "bg-gray-100 text-gray-700",
  MODERATE: "bg-blue-100 text-blue-700",
  STRONG: "bg-orange-100 text-orange-700",
  BLOCKING: "bg-red-100 text-red-700",
};

export function CommitmentPanel({
  reviewId,
  commitments,
  showOnlyUnresolved,
}: CommitmentPanelProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const blockingCount = commitments.filter(
    (c) => c.strength === "BLOCKING" && !c.isResolved
  ).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {showOnlyUnresolved ? "Open Concerns" : "Reviewer Commitments"}
          </CardTitle>
          {blockingCount > 0 && (
            <Badge variant="destructive">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {blockingCount} blocking
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {commitments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {showOnlyUnresolved
              ? "No open concerns"
              : "No commitments recorded yet"}
          </p>
        ) : (
          commitments.map((commitment) => (
            <CommitmentCard
              key={commitment.id}
              commitment={commitment}
              reviewId={reviewId}
              expanded={expandedId === commitment.id}
              onToggle={() =>
                setExpandedId(
                  expandedId === commitment.id ? null : commitment.id
                )
              }
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function CommitmentCard({
  commitment,
  reviewId,
  expanded,
  onToggle,
}: {
  commitment: ReviewerCommitmentSummary;
  reviewId: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const resolveCommitment = useResolveCommitment(reviewId);
  const [resolving, setResolving] = React.useState(false);
  const posConfig = positionConfig[commitment.position];

  const handleResolve = async () => {
    setResolving(true);
    try {
      await resolveCommitment.mutateAsync({
        commitmentId: commitment.id,
        resolutionNote: "Addressed in author response",
      });
    } finally {
      setResolving(false);
    }
  };

  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <div
        className={`border rounded-lg p-3 ${
          commitment.isResolved ? "bg-green-50" : ""
        }`}
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-start justify-between cursor-pointer">
            <div className="flex items-start gap-2">
              <span className={posConfig?.color}>{posConfig?.icon}</span>
              <div>
                <p className="font-medium text-sm">{commitment.topic}</p>
                <p className="text-xs text-muted-foreground">
                  {commitment.reviewer.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={strengthColors[commitment.strength]}>
                {commitment.strength}
              </Badge>
              {commitment.isResolved && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-3 pt-3 border-t space-y-3">
            <p className="text-sm">{commitment.description}</p>

            {commitment.targetClaim && (
              <div className="bg-muted p-2 rounded text-sm">
                <p className="text-xs text-muted-foreground mb-1">
                  Regarding claim:
                </p>
                <p>"{commitment.targetClaim.text}"</p>
              </div>
            )}

            {!commitment.isResolved && (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResolve}
                  disabled={resolving}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Mark Resolved
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
```

---

### Step 4.1.20: Author Response Composer

**File:** `components/review/AuthorResponseComposer.tsx`

```tsx
/**
 * Composer for author responses to reviewer feedback
 */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Send } from "lucide-react";
import {
  useCreateAuthorResponse,
  useReviewCommitments,
} from "@/lib/review/hooks";
import { ResponseMoveType } from "@/lib/review/authorResponseService";

interface AuthorResponseComposerProps {
  reviewId: string;
  phaseId: string;
  onSuccess?: () => void;
}

interface MoveInput {
  id: string;
  targetCommitmentId?: string;
  moveType: ResponseMoveType;
  explanation: string;
  revisionDescription?: string;
  revisionLocation?: string;
}

const moveTypeLabels: Record<
  ResponseMoveType,
  { label: string; color: string; description: string }
> = {
  CONCEDE: {
    label: "Concede",
    color: "bg-green-100 text-green-700",
    description: "Accept the criticism and commit to addressing it",
  },
  DEFEND: {
    label: "Defend",
    color: "bg-blue-100 text-blue-700",
    description: "Defend the current approach with reasoning",
  },
  QUALIFY: {
    label: "Qualify",
    color: "bg-yellow-100 text-yellow-700",
    description: "Partially accept with nuanced response",
  },
  REVISE: {
    label: "Revise",
    color: "bg-purple-100 text-purple-700",
    description: "Describe specific revision made",
  },
  DEFER: {
    label: "Defer",
    color: "bg-gray-100 text-gray-700",
    description: "Acknowledge but defer to future work",
  },
  CLARIFY: {
    label: "Clarify",
    color: "bg-cyan-100 text-cyan-700",
    description: "Provide clarification (no change needed)",
  },
  CHALLENGE: {
    label: "Challenge",
    color: "bg-red-100 text-red-700",
    description: "Challenge the reviewer's position",
  },
};

export function AuthorResponseComposer({
  reviewId,
  phaseId,
  onSuccess,
}: AuthorResponseComposerProps) {
  const [summary, setSummary] = useState("");
  const [moves, setMoves] = useState<MoveInput[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { data: commitments } = useReviewCommitments(reviewId, {
    onlyUnresolved: true,
  });
  const createResponse = useCreateAuthorResponse(reviewId);

  const addMove = () => {
    setMoves([
      ...moves,
      {
        id: crypto.randomUUID(),
        moveType: "DEFEND",
        explanation: "",
      },
    ]);
  };

  const updateMove = (id: string, updates: Partial<MoveInput>) => {
    setMoves(moves.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  const removeMove = (id: string) => {
    setMoves(moves.filter((m) => m.id !== id));
  };

  const handleSubmit = async () => {
    if (!summary.trim() || moves.length === 0) return;

    setSubmitting(true);
    try {
      await createResponse.mutateAsync({
        phaseId,
        summary,
        moves: moves.map((m) => ({
          targetCommitmentId: m.targetCommitmentId,
          moveType: m.moveType,
          explanation: m.explanation,
          revisionDescription: m.revisionDescription,
          revisionLocation: m.revisionLocation,
        })),
      });
      onSuccess?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compose Author Response</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="space-y-2">
          <Label htmlFor="summary">Response Summary</Label>
          <Textarea
            id="summary"
            placeholder="Provide an overall summary of your response to the reviewers..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
          />
        </div>

        {/* Response Moves */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Response Moves</Label>
            <Button size="sm" variant="outline" onClick={addMove}>
              <Plus className="w-4 h-4 mr-1" />
              Add Move
            </Button>
          </div>

          {moves.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4 bg-muted rounded-lg">
              Add response moves to address specific reviewer concerns
            </p>
          ) : (
            <div className="space-y-4">
              {moves.map((move, index) => (
                <MoveEditor
                  key={move.id}
                  move={move}
                  index={index}
                  commitments={commitments || []}
                  onUpdate={(updates) => updateMove(move.id, updates)}
                  onRemove={() => removeMove(move.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!summary.trim() || moves.length === 0 || submitting}
          >
            <Send className="w-4 h-4 mr-1" />
            Submit Response
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MoveEditor({
  move,
  index,
  commitments,
  onUpdate,
  onRemove,
}: {
  move: MoveInput;
  index: number;
  commitments: any[];
  onUpdate: (updates: Partial<MoveInput>) => void;
  onRemove: () => void;
}) {
  const typeConfig = moveTypeLabels[move.moveType];

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Move {index + 1}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={onRemove}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Target Concern */}
        <div className="space-y-2">
          <Label>Responding To</Label>
          <Select
            value={move.targetCommitmentId || ""}
            onValueChange={(v) =>
              onUpdate({ targetCommitmentId: v || undefined })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select concern (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">General response</SelectItem>
              {commitments.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.topic} ({c.reviewer.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Move Type */}
        <div className="space-y-2">
          <Label>Response Type</Label>
          <Select
            value={move.moveType}
            onValueChange={(v) => onUpdate({ moveType: v as ResponseMoveType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(moveTypeLabels).map(([type, config]) => (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <Badge className={config.color}>{config.label}</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {typeConfig?.description}
          </p>
        </div>
      </div>

      {/* Explanation */}
      <div className="space-y-2">
        <Label>Explanation</Label>
        <Textarea
          placeholder="Explain your response..."
          value={move.explanation}
          onChange={(e) => onUpdate({ explanation: e.target.value })}
          rows={3}
        />
      </div>

      {/* Revision details (if REVISE type) */}
      {move.moveType === "REVISE" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Revision Location</Label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md text-sm"
              placeholder="e.g., Section 3.2"
              value={move.revisionLocation || ""}
              onChange={(e) => onUpdate({ revisionLocation: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Revision Description</Label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md text-sm"
              placeholder="Brief description of change"
              value={move.revisionDescription || ""}
              onChange={(e) =>
                onUpdate({ revisionDescription: e.target.value })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Step 4.1.21: Review Actions Component

**File:** `components/review/ReviewActions.tsx`

```tsx
/**
 * Action buttons for review management
 */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Gavel,
} from "lucide-react";
import { useAdvancePhase, useMakeDecision } from "@/lib/review/hooks";
import { ReviewDecision, ReviewStatus } from "@/lib/review/types";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface ReviewActionsProps {
  reviewId: string;
  status: ReviewStatus;
  canAdvance: boolean;
  blockers: string[];
}

const decisionOptions: Array<{ value: ReviewDecision; label: string }> = [
  { value: "ACCEPT", label: "Accept" },
  { value: "MINOR_REVISION", label: "Accept with Minor Revisions" },
  { value: "MAJOR_REVISION", label: "Major Revisions Required" },
  { value: "REJECT", label: "Reject" },
];

export function ReviewActions({
  reviewId,
  status,
  canAdvance,
  blockers,
}: ReviewActionsProps) {
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [selectedDecision, setSelectedDecision] =
    useState<ReviewDecision | null>(null);
  const [decisionNote, setDecisionNote] = useState("");

  const advancePhase = useAdvancePhase(reviewId);
  const makeDecision = useMakeDecision(reviewId);

  const showAdvance = status !== "COMPLETED" && status !== "WITHDRAWN";
  const showDecision = status === "DECISION" || status === "FINAL_REVIEW";

  const handleAdvance = async () => {
    await advancePhase.mutateAsync();
  };

  const handleDecision = async () => {
    if (!selectedDecision || !decisionNote.trim()) return;

    await makeDecision.mutateAsync({
      decision: selectedDecision,
      note: decisionNote,
    });
    setDecisionOpen(false);
  };

  if (!showAdvance && !showDecision) return null;

  return (
    <div className="space-y-4">
      {/* Blockers Alert */}
      {blockers.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Cannot Advance</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside">
              {blockers.map((blocker, i) => (
                <li key={i}>{blocker}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {showAdvance && (
          <Button
            onClick={handleAdvance}
            disabled={!canAdvance || advancePhase.isPending}
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Advance to Next Phase
          </Button>
        )}

        {showDecision && (
          <Dialog open={decisionOpen} onOpenChange={setDecisionOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                <Gavel className="w-4 h-4 mr-2" />
                Make Decision
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Review Decision</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Decision</Label>
                  <Select
                    value={selectedDecision || ""}
                    onValueChange={(v) =>
                      setSelectedDecision(v as ReviewDecision)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select decision" />
                    </SelectTrigger>
                    <SelectContent>
                      {decisionOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Decision Note</Label>
                  <Textarea
                    placeholder="Explain the reasoning for this decision..."
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setDecisionOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDecision}
                    disabled={
                      !selectedDecision ||
                      !decisionNote.trim() ||
                      makeDecision.isPending
                    }
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Decision
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
```

---

## Phase 4.1 Complete Checklist

| # | Component | File | Part |
|---|-----------|------|------|
| 1 | Schema additions | `prisma/schema.prisma` | 1, 2 |
| 2 | Types | `lib/review/types.ts` | 1 |
| 3 | Template service | `lib/review/templateService.ts` | 1 |
| 4 | Review service | `lib/review/reviewService.ts` | 1 |
| 5 | Assignment service | `lib/review/assignmentService.ts` | 2 |
| 6 | Commitment service | `lib/review/commitmentService.ts` | 2 |
| 7 | Author response service | `lib/review/authorResponseService.ts` | 2 |
| 8 | Progress service | `lib/review/progressService.ts` | 2 |
| 9 | Review API routes | `app/api/review/` | 3 |
| 10 | React Query hooks | `lib/review/hooks.ts` | 3 |
| 11 | ReviewDashboard | `components/review/ReviewDashboard.tsx` | 4 |
| 12 | PhaseTimeline | `components/review/PhaseTimeline.tsx` | 4 |
| 13 | ReviewerPanel | `components/review/ReviewerPanel.tsx` | 4 |
| 14 | CommitmentPanel | `components/review/CommitmentPanel.tsx` | 4 |
| 15 | AuthorResponseComposer | `components/review/AuthorResponseComposer.tsx` | 4 |
| 16 | ReviewActions | `components/review/ReviewActions.tsx` | 4 |

---

## Next: Phase 4.2

Continue to Phase 4.2 for **Argumentation-Based Reputation**:
- Contribution Metrics Schema & Service
- Reviewer Recognition System
- Scholar Profile Aggregation
- Reputation Calculation Engine

---

*End of Phase 4.1 Part 4*
