# Phase 4.1: Public Peer Review Deliberations — Part 2

**Sub-Phase:** 4.1 of 4.3  
**Focus:** Reviewer Assignments, Commitments, and Author Response Moves

---

## Implementation Steps (Continued)

### Step 4.1.5: Reviewer Assignment Service

**File:** `lib/review/assignmentService.ts`

```typescript
/**
 * Service for managing reviewer assignments
 */

import { prisma } from "@/lib/prisma";
import {
  ReviewerRole,
  ReviewerStatus,
  ReviewerAssignmentSummary,
} from "./types";

/**
 * Invite a reviewer
 */
export async function inviteReviewer(
  reviewId: string,
  userId: string,
  role: ReviewerRole,
  assignedById: string,
  deadline?: Date
): Promise<ReviewerAssignmentSummary> {
  // Check if already assigned
  const existing = await prisma.reviewerAssignment.findUnique({
    where: {
      reviewId_userId: { reviewId, userId },
    },
  });

  if (existing) {
    throw new Error("Reviewer already assigned to this review");
  }

  const assignment = await prisma.reviewerAssignment.create({
    data: {
      reviewId,
      userId,
      role,
      status: "INVITED",
      assignedById,
      deadline,
    },
    include: {
      user: { select: { id: true, name: true } },
      commitments: true,
    },
  });

  return formatAssignmentSummary(assignment);
}

/**
 * Respond to reviewer invitation
 */
export async function respondToInvitation(
  assignmentId: string,
  userId: string,
  accept: boolean,
  declineReason?: string
) {
  const assignment = await prisma.reviewerAssignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment || assignment.userId !== userId) {
    throw new Error("Assignment not found or unauthorized");
  }

  if (assignment.status !== "INVITED") {
    throw new Error("Invitation already responded to");
  }

  return prisma.reviewerAssignment.update({
    where: { id: assignmentId },
    data: {
      status: accept ? "ACCEPTED" : "DECLINED",
      respondedAt: new Date(),
      declineReason: accept ? null : declineReason,
    },
  });
}

/**
 * Start review (mark as in progress)
 */
export async function startReview(assignmentId: string, userId: string) {
  const assignment = await prisma.reviewerAssignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment || assignment.userId !== userId) {
    throw new Error("Assignment not found or unauthorized");
  }

  if (assignment.status !== "ACCEPTED") {
    throw new Error("Must accept invitation before starting review");
  }

  return prisma.reviewerAssignment.update({
    where: { id: assignmentId },
    data: { status: "IN_PROGRESS" },
  });
}

/**
 * Complete review
 */
export async function completeReview(assignmentId: string, userId: string) {
  const assignment = await prisma.reviewerAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      commitments: {
        where: {
          strength: "BLOCKING",
          isResolved: false,
        },
      },
    },
  });

  if (!assignment || assignment.userId !== userId) {
    throw new Error("Assignment not found or unauthorized");
  }

  // Warn about unresolved blocking concerns
  if (assignment.commitments.length > 0) {
    console.warn(
      `Reviewer ${userId} completing review with ${assignment.commitments.length} unresolved blocking concerns`
    );
  }

  return prisma.reviewerAssignment.update({
    where: { id: assignmentId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });
}

/**
 * Get reviewer assignments for a review
 */
export async function getReviewerAssignments(
  reviewId: string
): Promise<ReviewerAssignmentSummary[]> {
  const assignments = await prisma.reviewerAssignment.findMany({
    where: { reviewId },
    include: {
      user: { select: { id: true, name: true } },
      commitments: true,
    },
    orderBy: { assignedAt: "asc" },
  });

  return assignments.map(formatAssignmentSummary);
}

/**
 * Get assignments for a user
 */
export async function getUserAssignments(
  userId: string,
  status?: ReviewerStatus[]
) {
  const where: any = { userId };
  if (status && status.length > 0) {
    where.status = { in: status };
  }

  return prisma.reviewerAssignment.findMany({
    where,
    include: {
      review: {
        include: {
          deliberation: { select: { title: true } },
        },
      },
    },
    orderBy: { deadline: "asc" },
  });
}

/**
 * Format assignment for API response
 */
function formatAssignmentSummary(assignment: any): ReviewerAssignmentSummary {
  const blockingConcerns = assignment.commitments?.filter(
    (c: any) => c.strength === "BLOCKING" && !c.isResolved
  ).length || 0;

  return {
    id: assignment.id,
    userId: assignment.userId,
    userName: assignment.user?.name || "Anonymous",
    role: assignment.role,
    status: assignment.status,
    assignedAt: assignment.assignedAt,
    deadline: assignment.deadline || undefined,
    completedAt: assignment.completedAt || undefined,
    commitmentCount: assignment.commitments?.length || 0,
    blockingConcerns,
  };
}
```

---

### Step 4.1.6: Reviewer Commitment Service

**File:** `lib/review/commitmentService.ts`

```typescript
/**
 * Service for managing reviewer commitments
 */

import { prisma } from "@/lib/prisma";
import {
  CommitmentPosition,
  CommitmentStrength,
  ReviewerCommitmentSummary,
} from "./types";

export interface CreateCommitmentInput {
  topic: string;
  description: string;
  position: CommitmentPosition;
  strength: CommitmentStrength;
  argumentId?: string;
  targetClaimId?: string;
}

/**
 * Create a reviewer commitment
 */
export async function createCommitment(
  assignmentId: string,
  input: CreateCommitmentInput,
  userId: string
): Promise<ReviewerCommitmentSummary> {
  // Verify assignment belongs to user
  const assignment = await prisma.reviewerAssignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment || assignment.userId !== userId) {
    throw new Error("Assignment not found or unauthorized");
  }

  const commitment = await prisma.reviewerCommitment.create({
    data: {
      assignmentId,
      topic: input.topic,
      description: input.description,
      position: input.position,
      strength: input.strength,
      argumentId: input.argumentId,
      targetClaimId: input.targetClaimId,
    },
    include: {
      assignment: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      targetClaim: { select: { id: true, text: true } },
      argument: { select: { id: true, summary: true } },
    },
  });

  return formatCommitmentSummary(commitment);
}

/**
 * Update a commitment (creates new version)
 */
export async function updateCommitment(
  commitmentId: string,
  updates: Partial<CreateCommitmentInput>,
  userId: string
): Promise<ReviewerCommitmentSummary> {
  const existing = await prisma.reviewerCommitment.findUnique({
    where: { id: commitmentId },
    include: {
      assignment: true,
    },
  });

  if (!existing || existing.assignment.userId !== userId) {
    throw new Error("Commitment not found or unauthorized");
  }

  // Create new commitment that supersedes the old one
  const newCommitment = await prisma.reviewerCommitment.create({
    data: {
      assignmentId: existing.assignmentId,
      topic: updates.topic ?? existing.topic,
      description: updates.description ?? existing.description,
      position: (updates.position ?? existing.position) as any,
      strength: (updates.strength ?? existing.strength) as any,
      argumentId: updates.argumentId ?? existing.argumentId,
      targetClaimId: updates.targetClaimId ?? existing.targetClaimId,
      previousCommitmentId: commitmentId,
    },
    include: {
      assignment: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      targetClaim: { select: { id: true, text: true } },
      argument: { select: { id: true, summary: true } },
    },
  });

  return formatCommitmentSummary(newCommitment);
}

/**
 * Resolve a commitment
 */
export async function resolveCommitment(
  commitmentId: string,
  resolutionNote: string,
  userId: string
) {
  // Verify user has permission (reviewer or editor)
  const commitment = await prisma.reviewerCommitment.findUnique({
    where: { id: commitmentId },
    include: {
      assignment: {
        include: {
          review: true,
        },
      },
    },
  });

  if (!commitment) {
    throw new Error("Commitment not found");
  }

  const isReviewer = commitment.assignment.userId === userId;
  const isEditor = commitment.assignment.review.editorId === userId;

  if (!isReviewer && !isEditor) {
    throw new Error("Unauthorized to resolve this commitment");
  }

  return prisma.reviewerCommitment.update({
    where: { id: commitmentId },
    data: {
      isResolved: true,
      resolutionNote,
      resolvedAt: new Date(),
    },
  });
}

/**
 * Get commitments for a review
 */
export async function getReviewCommitments(
  reviewId: string,
  options?: {
    onlyBlocking?: boolean;
    onlyUnresolved?: boolean;
  }
): Promise<ReviewerCommitmentSummary[]> {
  const where: any = {
    assignment: { reviewId },
  };

  if (options?.onlyBlocking) {
    where.strength = "BLOCKING";
  }

  if (options?.onlyUnresolved) {
    where.isResolved = false;
  }

  const commitments = await prisma.reviewerCommitment.findMany({
    where,
    include: {
      assignment: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      targetClaim: { select: { id: true, text: true } },
      argument: { select: { id: true, summary: true } },
    },
    orderBy: [{ strength: "desc" }, { createdAt: "desc" }],
  });

  return commitments.map(formatCommitmentSummary);
}

/**
 * Get commitment history (all versions)
 */
export async function getCommitmentHistory(
  commitmentId: string
): Promise<ReviewerCommitmentSummary[]> {
  const history: any[] = [];
  let currentId: string | null = commitmentId;

  while (currentId) {
    const commitment = await prisma.reviewerCommitment.findUnique({
      where: { id: currentId },
      include: {
        assignment: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        targetClaim: { select: { id: true, text: true } },
        argument: { select: { id: true, summary: true } },
      },
    });

    if (!commitment) break;

    history.push(formatCommitmentSummary(commitment));
    currentId = commitment.previousCommitmentId;
  }

  return history;
}

/**
 * Get blocking concerns summary for a review
 */
export async function getBlockingConcernsSummary(reviewId: string) {
  const concerns = await prisma.reviewerCommitment.findMany({
    where: {
      assignment: { reviewId },
      strength: "BLOCKING",
    },
    include: {
      assignment: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  const resolved = concerns.filter((c) => c.isResolved);
  const unresolved = concerns.filter((c) => !c.isResolved);

  return {
    total: concerns.length,
    resolved: resolved.length,
    unresolved: unresolved.length,
    unresolvedConcerns: unresolved.map((c) => ({
      id: c.id,
      topic: c.topic,
      reviewer: c.assignment.user?.name || "Anonymous",
      position: c.position,
    })),
  };
}

/**
 * Format commitment for API response
 */
function formatCommitmentSummary(commitment: any): ReviewerCommitmentSummary {
  return {
    id: commitment.id,
    topic: commitment.topic,
    description: commitment.description,
    position: commitment.position,
    strength: commitment.strength,
    isResolved: commitment.isResolved,
    targetClaim: commitment.targetClaim || undefined,
    argument: commitment.argument || undefined,
    reviewer: {
      id: commitment.assignment?.userId || "",
      name: commitment.assignment?.user?.name || "Anonymous",
    },
    createdAt: commitment.createdAt,
  };
}
```

---

### Step 4.1.7: Author Response Types and Schema

**File:** `prisma/schema.prisma` (additional models)

```prisma
// ============================================================
// AUTHOR RESPONSE MODELS
// ============================================================

/// An author's response to reviewer feedback
model AuthorResponse {
  id              String   @id @default(cuid())
  
  // Link to review
  reviewId        String
  review          ReviewDeliberation @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  
  // Which phase this response is for
  phaseId         String
  phase           ReviewPhase @relation(fields: [phaseId], references: [id])
  
  // The author responding
  authorId        String
  author          User     @relation(fields: [authorId], references: [id])
  
  // Response content
  summary         String   @db.Text
  
  // Individual moves
  moves           AuthorResponseMove[]
  
  // Linked revision (if any)
  revisionId      String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([reviewId])
  @@index([phaseId])
  @@index([authorId])
}

/// A specific move in an author's response
model AuthorResponseMove {
  id              String   @id @default(cuid())
  
  responseId      String
  response        AuthorResponse @relation(fields: [responseId], references: [id], onDelete: Cascade)
  
  // What this move responds to
  targetCommitmentId String?
  targetCommitment   ReviewerCommitment? @relation(fields: [targetCommitmentId], references: [id])
  
  // Alternative: respond to a specific argument
  targetArgumentId   String?
  targetArgument     Argument? @relation(fields: [targetArgumentId], references: [id])
  
  // The move type
  moveType        ResponseMoveType
  
  // Move content
  explanation     String   @db.Text
  
  // Supporting argument (author's counter or defense)
  supportingArgumentId String?
  supportingArgument   Argument? @relation("SupportingArgument", fields: [supportingArgumentId], references: [id])
  
  // For revise moves: what changed
  revisionDescription String?  @db.Text
  revisionLocation    String?  @db.VarChar(200)  // e.g., "Section 3.2"
  
  createdAt       DateTime @default(now())
  
  @@index([responseId])
  @@index([targetCommitmentId])
}

enum ResponseMoveType {
  CONCEDE         // Accept the criticism, will address
  DEFEND          // Defend current approach
  QUALIFY         // Partially accept, provide nuance
  REVISE          // Describe revision made
  DEFER           // Acknowledge but defer to future work
  CLARIFY         // Provide clarification (not a change)
  CHALLENGE       // Challenge the reviewer's position
}
```

---

### Step 4.1.8: Author Response Service

**File:** `lib/review/authorResponseService.ts`

```typescript
/**
 * Service for managing author responses
 */

import { prisma } from "@/lib/prisma";

export type ResponseMoveType =
  | "CONCEDE"
  | "DEFEND"
  | "QUALIFY"
  | "REVISE"
  | "DEFER"
  | "CLARIFY"
  | "CHALLENGE";

export interface AuthorResponseMoveInput {
  targetCommitmentId?: string;
  targetArgumentId?: string;
  moveType: ResponseMoveType;
  explanation: string;
  supportingArgumentId?: string;
  revisionDescription?: string;
  revisionLocation?: string;
}

export interface CreateAuthorResponseInput {
  reviewId: string;
  phaseId: string;
  summary: string;
  moves: AuthorResponseMoveInput[];
  revisionId?: string;
}

/**
 * Create an author response
 */
export async function createAuthorResponse(
  input: CreateAuthorResponseInput,
  userId: string
) {
  const { reviewId, phaseId, summary, moves, revisionId } = input;

  // Verify user is an author on this review
  const review = await prisma.reviewDeliberation.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new Error("Review not found");
  }

  if (!review.authorUserIds.includes(userId)) {
    throw new Error("User is not an author on this review");
  }

  // Create response with moves
  return prisma.authorResponse.create({
    data: {
      reviewId,
      phaseId,
      authorId: userId,
      summary,
      revisionId,
      moves: {
        create: moves.map((move) => ({
          targetCommitmentId: move.targetCommitmentId,
          targetArgumentId: move.targetArgumentId,
          moveType: move.moveType,
          explanation: move.explanation,
          supportingArgumentId: move.supportingArgumentId,
          revisionDescription: move.revisionDescription,
          revisionLocation: move.revisionLocation,
        })),
      },
    },
    include: {
      moves: {
        include: {
          targetCommitment: { select: { id: true, topic: true } },
          targetArgument: { select: { id: true, summary: true } },
        },
      },
      author: { select: { id: true, name: true } },
    },
  });
}

/**
 * Get author responses for a review
 */
export async function getAuthorResponses(reviewId: string) {
  return prisma.authorResponse.findMany({
    where: { reviewId },
    include: {
      moves: {
        include: {
          targetCommitment: { select: { id: true, topic: true } },
          targetArgument: { select: { id: true, summary: true } },
        },
      },
      author: { select: { id: true, name: true } },
      phase: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get response summary by move type
 */
export async function getResponseSummary(reviewId: string) {
  const responses = await prisma.authorResponse.findMany({
    where: { reviewId },
    include: {
      moves: true,
    },
  });

  const moveCounts: Record<ResponseMoveType, number> = {
    CONCEDE: 0,
    DEFEND: 0,
    QUALIFY: 0,
    REVISE: 0,
    DEFER: 0,
    CLARIFY: 0,
    CHALLENGE: 0,
  };

  responses.forEach((response) => {
    response.moves.forEach((move) => {
      moveCounts[move.moveType as ResponseMoveType]++;
    });
  });

  const totalMoves = Object.values(moveCounts).reduce((a, b) => a + b, 0);

  return {
    responseCount: responses.length,
    totalMoves,
    moveCounts,
    concessionRate:
      totalMoves > 0 ? (moveCounts.CONCEDE + moveCounts.QUALIFY) / totalMoves : 0,
    revisionRate: totalMoves > 0 ? moveCounts.REVISE / totalMoves : 0,
  };
}

/**
 * Find unaddressed commitments
 */
export async function getUnaddressedCommitments(reviewId: string) {
  // Get all commitments
  const commitments = await prisma.reviewerCommitment.findMany({
    where: {
      assignment: { reviewId },
    },
    select: { id: true },
  });

  // Get all addressed commitment IDs
  const addressedIds = await prisma.authorResponseMove.findMany({
    where: {
      response: { reviewId },
      targetCommitmentId: { not: null },
    },
    select: { targetCommitmentId: true },
  });

  const addressedSet = new Set(addressedIds.map((a) => a.targetCommitmentId));
  const unaddressedIds = commitments
    .filter((c) => !addressedSet.has(c.id))
    .map((c) => c.id);

  // Fetch full commitment details for unaddressed
  return prisma.reviewerCommitment.findMany({
    where: { id: { in: unaddressedIds } },
    include: {
      assignment: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
    orderBy: [{ strength: "desc" }, { createdAt: "asc" }],
  });
}

/**
 * Analyze author response patterns
 */
export async function analyzeResponsePatterns(authorId: string) {
  const responses = await prisma.authorResponse.findMany({
    where: { authorId },
    include: {
      moves: true,
      review: { select: { decision: true } },
    },
  });

  const patterns = {
    totalResponses: responses.length,
    reviewsWithConcession: 0,
    reviewsWithDefense: 0,
    averageMovesPerResponse: 0,
    acceptanceRateAfterConcession: 0,
    acceptanceRateAfterDefense: 0,
  };

  let totalMoves = 0;
  let concessionsLeadingToAccept = 0;
  let defensesLeadingToAccept = 0;
  let reviewsWithConcession = 0;
  let reviewsWithDefense = 0;

  responses.forEach((response) => {
    totalMoves += response.moves.length;

    const hasConcession = response.moves.some(
      (m) => m.moveType === "CONCEDE" || m.moveType === "QUALIFY"
    );
    const hasDefense = response.moves.some(
      (m) => m.moveType === "DEFEND" || m.moveType === "CHALLENGE"
    );
    const wasAccepted =
      response.review.decision === "ACCEPT" ||
      response.review.decision === "MINOR_REVISION";

    if (hasConcession) {
      reviewsWithConcession++;
      if (wasAccepted) concessionsLeadingToAccept++;
    }

    if (hasDefense) {
      reviewsWithDefense++;
      if (wasAccepted) defensesLeadingToAccept++;
    }
  });

  patterns.reviewsWithConcession = reviewsWithConcession;
  patterns.reviewsWithDefense = reviewsWithDefense;
  patterns.averageMovesPerResponse =
    responses.length > 0 ? totalMoves / responses.length : 0;
  patterns.acceptanceRateAfterConcession =
    reviewsWithConcession > 0
      ? concessionsLeadingToAccept / reviewsWithConcession
      : 0;
  patterns.acceptanceRateAfterDefense =
    reviewsWithDefense > 0 ? defensesLeadingToAccept / reviewsWithDefense : 0;

  return patterns;
}
```

---

### Step 4.1.9: Review Progress Service

**File:** `lib/review/progressService.ts`

```typescript
/**
 * Service for tracking review progress
 */

import { prisma } from "@/lib/prisma";
import { ReviewProgressSummary } from "./types";

/**
 * Get comprehensive review progress
 */
export async function getReviewProgress(
  reviewId: string
): Promise<ReviewProgressSummary> {
  const review = await prisma.reviewDeliberation.findUnique({
    where: { id: reviewId },
    include: {
      phases: {
        orderBy: { order: "asc" },
      },
      reviewers: {
        include: {
          commitments: true,
        },
      },
    },
  });

  if (!review) {
    throw new Error("Review not found");
  }

  // Calculate concerns
  let openConcerns = 0;
  let resolvedConcerns = 0;

  const reviewerProgress = review.reviewers.map((r) => {
    const blocking = r.commitments.filter(
      (c) => c.strength === "BLOCKING" && !c.isResolved
    );
    const resolved = r.commitments.filter((c) => c.isResolved);

    openConcerns += blocking.length;
    resolvedConcerns += resolved.length;

    return {
      reviewerId: r.userId,
      status: r.status,
      commitmentsMade: r.commitments.length,
      blockingConcerns: blocking.length,
    };
  });

  return {
    status: review.status,
    phases: review.phases.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.phaseType,
      status: p.status,
      startDate: p.startDate || undefined,
      endDate: p.endDate || undefined,
    })),
    reviewerProgress,
    openConcerns,
    resolvedConcerns,
  };
}

/**
 * Check if review can advance to next phase
 */
export async function canAdvancePhase(
  reviewId: string
): Promise<{ canAdvance: boolean; blockers: string[] }> {
  const review = await prisma.reviewDeliberation.findUnique({
    where: { id: reviewId },
    include: {
      phases: { orderBy: { order: "asc" } },
      reviewers: {
        include: {
          commitments: {
            where: { strength: "BLOCKING", isResolved: false },
          },
        },
      },
    },
  });

  if (!review) {
    return { canAdvance: false, blockers: ["Review not found"] };
  }

  const blockers: string[] = [];

  // Find current phase
  const currentPhase = review.phases.find(
    (p) => p.id === review.currentPhaseId
  );

  if (!currentPhase) {
    return { canAdvance: false, blockers: ["No current phase"] };
  }

  // Check if all active reviewers have completed
  if (currentPhase.phaseType === "INITIAL_REVIEW" ||
      currentPhase.phaseType === "SECOND_REVIEW") {
    const activeReviewers = review.reviewers.filter(
      (r) => r.status === "IN_PROGRESS"
    );
    if (activeReviewers.length > 0) {
      blockers.push(
        `${activeReviewers.length} reviewer(s) still in progress`
      );
    }
  }

  // Check for unresolved blocking concerns if moving to decision
  if (currentPhase.phaseType === "AUTHOR_RESPONSE") {
    const blockingCount = review.reviewers.reduce(
      (sum, r) => sum + r.commitments.length,
      0
    );
    if (blockingCount > 0) {
      blockers.push(`${blockingCount} unresolved blocking concern(s)`);
    }
  }

  return {
    canAdvance: blockers.length === 0,
    blockers,
  };
}

/**
 * Get review timeline
 */
export async function getReviewTimeline(reviewId: string) {
  const events: Array<{
    type: string;
    date: Date;
    actor?: string;
    details: string;
  }> = [];

  // Get review with phases
  const review = await prisma.reviewDeliberation.findUnique({
    where: { id: reviewId },
    include: {
      phases: { orderBy: { order: "asc" } },
      reviewers: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
  });

  if (!review) return events;

  // Review created
  events.push({
    type: "REVIEW_CREATED",
    date: review.createdAt,
    details: `Review initiated for "${review.targetTitle}"`,
  });

  // Reviewer invitations and acceptances
  review.reviewers.forEach((r) => {
    events.push({
      type: "REVIEWER_INVITED",
      date: r.assignedAt,
      actor: r.user?.name || "Unknown",
      details: `${r.user?.name || "Reviewer"} invited to review`,
    });

    if (r.respondedAt) {
      events.push({
        type: r.status === "ACCEPTED" ? "REVIEWER_ACCEPTED" : "REVIEWER_DECLINED",
        date: r.respondedAt,
        actor: r.user?.name || "Unknown",
        details: `${r.user?.name || "Reviewer"} ${
          r.status === "ACCEPTED" ? "accepted" : "declined"
        } invitation`,
      });
    }

    if (r.completedAt) {
      events.push({
        type: "REVIEW_SUBMITTED",
        date: r.completedAt,
        actor: r.user?.name || "Unknown",
        details: `${r.user?.name || "Reviewer"} submitted review`,
      });
    }
  });

  // Phase transitions
  review.phases.forEach((p) => {
    if (p.startDate) {
      events.push({
        type: "PHASE_STARTED",
        date: p.startDate,
        details: `Phase "${p.name}" started`,
      });
    }
    if (p.endDate) {
      events.push({
        type: "PHASE_COMPLETED",
        date: p.endDate,
        details: `Phase "${p.name}" completed`,
      });
    }
  });

  // Sort by date
  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}
```

---

## Phase 4.1 Part 2 Checklist

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Reviewer assignment service | `lib/review/assignmentService.ts` | 📋 Part 2 |
| 2 | Commitment service | `lib/review/commitmentService.ts` | 📋 Part 2 |
| 3 | AuthorResponse schema | `prisma/schema.prisma` | 📋 Part 2 |
| 4 | Author response service | `lib/review/authorResponseService.ts` | 📋 Part 2 |
| 5 | Review progress service | `lib/review/progressService.ts` | 📋 Part 2 |

---

## Next: Part 3

Continue to Phase 4.1 Part 3 for:
- API Routes (create review, assignments, commitments, responses)
- React Query Hooks
- UI Components (ReviewDashboard, CommitmentPanel, ResponseComposer)

---

*End of Phase 4.1 Part 2*
