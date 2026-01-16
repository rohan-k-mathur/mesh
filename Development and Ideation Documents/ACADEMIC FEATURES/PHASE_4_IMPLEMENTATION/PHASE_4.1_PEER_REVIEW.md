# Phase 4.1: Public Peer Review Deliberations — Part 1

**Sub-Phase:** 4.1 of 4.3  
**Focus:** Review Templates, Phases & Reviewer Commitments

---

## User Stories

| ID | Story | Priority | Effort |
|----|-------|----------|--------|
| 4.1.1 | As a journal editor, I want to create a structured peer review deliberation, so the review process is transparent | P0 | L |
| 4.1.2 | As a reviewer, I want my review positions publicly recorded, so I get credit for my contributions | P0 | M |
| 4.1.3 | As an author, I want to respond to critiques with structured moves, so my responses are clear | P0 | M |
| 4.1.4 | As a reader, I want to see the complete review history, so I understand how the paper evolved | P1 | M |

---

## Implementation Steps

### Step 4.1.1: Schema Additions

**File:** `prisma/schema.prisma` (additions)

```prisma
// ============================================================
// PEER REVIEW DELIBERATION MODELS
// ============================================================

/// Template for peer review deliberations
model ReviewTemplate {
  id              String   @id @default(cuid())
  
  // Template info
  name            String   @db.VarChar(200)
  description     String?  @db.Text
  
  // Template configuration
  phases          Json     // Array of ReviewPhaseConfig
  defaultSettings Json?    // Default settings for reviews using this template
  
  // Ownership
  organizationId  String?
  organization    Organization? @relation(fields: [organizationId], references: [id])
  createdById     String
  createdBy       User     @relation(fields: [createdById], references: [id])
  
  // Usage tracking
  isPublic        Boolean  @default(false)
  usageCount      Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  reviews         ReviewDeliberation[]
  
  @@index([organizationId])
  @@index([isPublic])
}

/// A peer review process as a deliberation
model ReviewDeliberation {
  id              String   @id @default(cuid())
  
  // Link to base deliberation
  deliberationId  String   @unique
  deliberation    Deliberation @relation(fields: [deliberationId], references: [id], onDelete: Cascade)
  
  // What is being reviewed
  targetType      ReviewTargetType
  targetPaperId   String?
  targetPaper     Paper?   @relation(fields: [targetPaperId], references: [id])
  targetUrl       String?  @db.VarChar(500)
  targetTitle     String   @db.VarChar(500)
  
  // Template used
  templateId      String?
  template        ReviewTemplate? @relation(fields: [templateId], references: [id])
  
  // Review phases
  currentPhaseId  String?
  phases          ReviewPhase[]
  
  // Review status
  status          ReviewStatus @default(INITIATED)
  decision        ReviewDecision?
  decisionDate    DateTime?
  decisionNote    String?  @db.Text
  
  // Participants
  editor          User?    @relation("ReviewEditor", fields: [editorId], references: [id])
  editorId        String?
  reviewers       ReviewerAssignment[]
  
  // Author(s) of the work being reviewed
  authorUserIds   String[] @default([])
  
  // Settings
  isBlinded       Boolean  @default(false)  // Single/double blind
  isPublicReview  Boolean  @default(true)   // Public or private review
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([status])
  @@index([targetPaperId])
}

enum ReviewTargetType {
  PAPER           // Academic paper
  PREPRINT        // Preprint
  THESIS          // Thesis/dissertation
  GRANT_PROPOSAL  // Grant proposal
  OTHER           // Other scholarly work
}

enum ReviewStatus {
  INITIATED       // Review created, not yet started
  IN_REVIEW       // Active review phase
  AUTHOR_RESPONSE // Author responding to reviews
  REVISION        // Author revising based on feedback
  FINAL_REVIEW    // Reviewing revisions
  DECISION        // Decision being made
  COMPLETED       // Review completed
  WITHDRAWN       // Review withdrawn
}

enum ReviewDecision {
  ACCEPT          // Accept as-is
  MINOR_REVISION  // Accept with minor revisions
  MAJOR_REVISION  // Major revisions required
  REJECT          // Reject
  DESK_REJECT     // Desk rejection (not sent for review)
}

/// A phase within a review process
model ReviewPhase {
  id              String   @id @default(cuid())
  
  reviewId        String
  review          ReviewDeliberation @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  
  // Phase info
  name            String   @db.VarChar(100)
  description     String?  @db.Text
  order           Int
  phaseType       ReviewPhaseType
  
  // Timing
  startDate       DateTime?
  endDate         DateTime?
  deadline        DateTime?
  
  // Status
  status          PhaseStatus @default(PENDING)
  
  // Phase-specific settings
  settings        Json?
  
  // Outcomes
  outcomes        PhaseOutcome[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([reviewId, order])
  @@index([reviewId])
}

enum ReviewPhaseType {
  INITIAL_REVIEW      // First round of reviews
  AUTHOR_RESPONSE     // Author responds to reviews
  REVISION            // Author revises manuscript
  SECOND_REVIEW       // Second round of reviews
  FINAL_DECISION      // Editor makes decision
  CUSTOM              // Custom phase
}

enum PhaseStatus {
  PENDING         // Not yet started
  ACTIVE          // Currently active
  COMPLETED       // Phase completed
  SKIPPED         // Phase was skipped
}

/// Outcome/summary of a review phase
model PhaseOutcome {
  id              String   @id @default(cuid())
  
  phaseId         String
  phase           ReviewPhase @relation(fields: [phaseId], references: [id], onDelete: Cascade)
  
  // Outcome summary
  summary         String   @db.Text
  
  // Linked arguments (key critiques/responses from this phase)
  keyArgumentIds  String[] @default([])
  
  // Who recorded the outcome
  recordedById    String
  recordedBy      User     @relation(fields: [recordedById], references: [id])
  recordedAt      DateTime @default(now())
  
  @@index([phaseId])
}

/// Assignment of a reviewer to a review
model ReviewerAssignment {
  id              String   @id @default(cuid())
  
  reviewId        String
  review          ReviewDeliberation @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  // Assignment details
  role            ReviewerRole @default(REVIEWER)
  assignedAt      DateTime @default(now())
  assignedById    String
  assignedBy      User     @relation("AssignedBy", fields: [assignedById], references: [id])
  
  // Status
  status          ReviewerStatus @default(INVITED)
  respondedAt     DateTime?
  declineReason   String?  @db.VarChar(500)
  
  // Deadline
  deadline        DateTime?
  
  // Review completion
  completedAt     DateTime?
  
  // Commitments made by this reviewer
  commitments     ReviewerCommitment[]
  
  @@unique([reviewId, userId])
  @@index([userId])
  @@index([status])
}

enum ReviewerRole {
  REVIEWER        // Standard reviewer
  SENIOR_REVIEWER // Senior/lead reviewer
  STATISTICAL_REVIEWER // Statistical review
  ETHICS_REVIEWER // Ethics review
  GUEST_EDITOR    // Guest editor (for special issues)
}

enum ReviewerStatus {
  INVITED         // Invitation sent
  ACCEPTED        // Accepted to review
  DECLINED        // Declined invitation
  IN_PROGRESS     // Review in progress
  COMPLETED       // Review submitted
  WITHDRAWN       // Withdrew from review
}

/// A reviewer's commitment/position on a specific issue
model ReviewerCommitment {
  id              String   @id @default(cuid())
  
  assignmentId    String
  assignment      ReviewerAssignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  
  // What the commitment is about
  topic           String   @db.VarChar(200)
  description     String   @db.Text
  
  // The reviewer's position
  position        CommitmentPosition
  strength        CommitmentStrength @default(MODERATE)
  
  // Supporting argument (if any)
  argumentId      String?
  argument        Argument? @relation(fields: [argumentId], references: [id])
  
  // Linked claim being evaluated
  targetClaimId   String?
  targetClaim     Claim?   @relation(fields: [targetClaimId], references: [id])
  
  // Evolution
  previousCommitmentId String?
  previousCommitment   ReviewerCommitment? @relation("CommitmentHistory", fields: [previousCommitmentId], references: [id])
  subsequentCommitments ReviewerCommitment[] @relation("CommitmentHistory")
  
  // Resolution
  isResolved      Boolean  @default(false)
  resolutionNote  String?  @db.Text
  resolvedAt      DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([assignmentId])
  @@index([targetClaimId])
}

enum CommitmentPosition {
  STRONGLY_SUPPORT    // Strongly supports the claim/approach
  SUPPORT             // Supports with reservations
  NEUTRAL             // No strong position
  CONCERN             // Has concerns
  STRONGLY_OPPOSE     // Strongly opposes
}

enum CommitmentStrength {
  WEAK                // Minor point
  MODERATE            // Moderate importance
  STRONG              // Critical point
  BLOCKING            // Must be addressed
}
```

---

### Step 4.1.2: Type Definitions

**File:** `lib/review/types.ts`

```typescript
/**
 * Types for peer review deliberations
 */

export type ReviewTargetType =
  | "PAPER"
  | "PREPRINT"
  | "THESIS"
  | "GRANT_PROPOSAL"
  | "OTHER";

export type ReviewStatus =
  | "INITIATED"
  | "IN_REVIEW"
  | "AUTHOR_RESPONSE"
  | "REVISION"
  | "FINAL_REVIEW"
  | "DECISION"
  | "COMPLETED"
  | "WITHDRAWN";

export type ReviewDecision =
  | "ACCEPT"
  | "MINOR_REVISION"
  | "MAJOR_REVISION"
  | "REJECT"
  | "DESK_REJECT";

export type ReviewPhaseType =
  | "INITIAL_REVIEW"
  | "AUTHOR_RESPONSE"
  | "REVISION"
  | "SECOND_REVIEW"
  | "FINAL_DECISION"
  | "CUSTOM";

export type ReviewerRole =
  | "REVIEWER"
  | "SENIOR_REVIEWER"
  | "STATISTICAL_REVIEWER"
  | "ETHICS_REVIEWER"
  | "GUEST_EDITOR";

export type ReviewerStatus =
  | "INVITED"
  | "ACCEPTED"
  | "DECLINED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "WITHDRAWN";

export type CommitmentPosition =
  | "STRONGLY_SUPPORT"
  | "SUPPORT"
  | "NEUTRAL"
  | "CONCERN"
  | "STRONGLY_OPPOSE";

export type CommitmentStrength =
  | "WEAK"
  | "MODERATE"
  | "STRONG"
  | "BLOCKING";

export interface ReviewPhaseConfig {
  name: string;
  type: ReviewPhaseType;
  description?: string;
  defaultDurationDays?: number;
  requiredForCompletion?: boolean;
  allowedParticipants?: ("reviewers" | "authors" | "editors")[];
}

export interface ReviewTemplateConfig {
  phases: ReviewPhaseConfig[];
  defaultSettings?: {
    isBlinded?: boolean;
    isPublicReview?: boolean;
    minReviewers?: number;
    maxReviewers?: number;
  };
}

export interface CreateReviewInput {
  targetType: ReviewTargetType;
  targetPaperId?: string;
  targetUrl?: string;
  targetTitle: string;
  templateId?: string;
  isBlinded?: boolean;
  isPublicReview?: boolean;
  initialReviewers?: string[];
}

export interface ReviewDeliberationSummary {
  id: string;
  deliberationId: string;
  targetType: ReviewTargetType;
  targetTitle: string;
  targetPaper?: {
    id: string;
    title: string;
    authors: string[];
  };
  status: ReviewStatus;
  decision?: ReviewDecision;
  currentPhase?: {
    id: string;
    name: string;
    type: ReviewPhaseType;
    status: string;
  };
  reviewerCount: number;
  editor?: { id: string; name: string };
  createdAt: Date;
}

export interface ReviewerAssignmentSummary {
  id: string;
  userId: string;
  userName: string;
  role: ReviewerRole;
  status: ReviewerStatus;
  assignedAt: Date;
  deadline?: Date;
  completedAt?: Date;
  commitmentCount: number;
  blockingConcerns: number;
}

export interface ReviewerCommitmentSummary {
  id: string;
  topic: string;
  description: string;
  position: CommitmentPosition;
  strength: CommitmentStrength;
  isResolved: boolean;
  targetClaim?: {
    id: string;
    text: string;
  };
  argument?: {
    id: string;
    summary: string;
  };
  reviewer: {
    id: string;
    name: string;
  };
  createdAt: Date;
}

export interface ReviewProgressSummary {
  status: ReviewStatus;
  phases: Array<{
    id: string;
    name: string;
    type: ReviewPhaseType;
    status: string;
    startDate?: Date;
    endDate?: Date;
  }>;
  reviewerProgress: Array<{
    reviewerId: string;
    status: ReviewerStatus;
    commitmentsMade: number;
    blockingConcerns: number;
  }>;
  openConcerns: number;
  resolvedConcerns: number;
}
```

---

### Step 4.1.3: Review Template Service

**File:** `lib/review/templateService.ts`

```typescript
/**
 * Service for managing review templates
 */

import { prisma } from "@/lib/prisma";
import { ReviewTemplateConfig, ReviewPhaseConfig } from "./types";

// Standard peer review template
export const STANDARD_PEER_REVIEW_TEMPLATE: ReviewTemplateConfig = {
  phases: [
    {
      name: "Initial Review",
      type: "INITIAL_REVIEW",
      description: "Reviewers provide initial assessment",
      defaultDurationDays: 21,
      requiredForCompletion: true,
      allowedParticipants: ["reviewers"],
    },
    {
      name: "Author Response",
      type: "AUTHOR_RESPONSE",
      description: "Authors respond to reviewer comments",
      defaultDurationDays: 14,
      requiredForCompletion: true,
      allowedParticipants: ["authors"],
    },
    {
      name: "Revision",
      type: "REVISION",
      description: "Authors revise manuscript based on feedback",
      defaultDurationDays: 30,
      requiredForCompletion: false,
      allowedParticipants: ["authors"],
    },
    {
      name: "Second Review",
      type: "SECOND_REVIEW",
      description: "Reviewers evaluate revisions",
      defaultDurationDays: 14,
      requiredForCompletion: false,
      allowedParticipants: ["reviewers"],
    },
    {
      name: "Final Decision",
      type: "FINAL_DECISION",
      description: "Editor makes final decision",
      defaultDurationDays: 7,
      requiredForCompletion: true,
      allowedParticipants: ["editors"],
    },
  ],
  defaultSettings: {
    isBlinded: false,
    isPublicReview: true,
    minReviewers: 2,
    maxReviewers: 4,
  },
};

// Open review template (faster, less formal)
export const OPEN_REVIEW_TEMPLATE: ReviewTemplateConfig = {
  phases: [
    {
      name: "Community Review",
      type: "INITIAL_REVIEW",
      description: "Open community discussion and critique",
      defaultDurationDays: 14,
      requiredForCompletion: true,
      allowedParticipants: ["reviewers", "authors"],
    },
    {
      name: "Author Integration",
      type: "AUTHOR_RESPONSE",
      description: "Authors integrate feedback",
      defaultDurationDays: 7,
      requiredForCompletion: true,
      allowedParticipants: ["authors"],
    },
    {
      name: "Final Assessment",
      type: "FINAL_DECISION",
      description: "Community consensus on acceptance",
      defaultDurationDays: 7,
      requiredForCompletion: true,
      allowedParticipants: ["reviewers", "editors"],
    },
  ],
  defaultSettings: {
    isBlinded: false,
    isPublicReview: true,
    minReviewers: 3,
    maxReviewers: 10,
  },
};

/**
 * Create a review template
 */
export async function createReviewTemplate(
  name: string,
  config: ReviewTemplateConfig,
  userId: string,
  organizationId?: string,
  isPublic = false
) {
  return prisma.reviewTemplate.create({
    data: {
      name,
      phases: config.phases as any,
      defaultSettings: config.defaultSettings as any,
      createdById: userId,
      organizationId,
      isPublic,
    },
  });
}

/**
 * Get available templates for user
 */
export async function getAvailableTemplates(
  userId: string,
  organizationId?: string
) {
  const where: any = {
    OR: [
      { isPublic: true },
      { createdById: userId },
    ],
  };

  if (organizationId) {
    where.OR.push({ organizationId });
  }

  return prisma.reviewTemplate.findMany({
    where,
    orderBy: [{ usageCount: "desc" }, { name: "asc" }],
  });
}

/**
 * Get template by ID
 */
export async function getTemplateById(templateId: string) {
  return prisma.reviewTemplate.findUnique({
    where: { id: templateId },
  });
}

/**
 * Parse template phases config
 */
export function parseTemplatePhases(template: any): ReviewPhaseConfig[] {
  if (!template?.phases || !Array.isArray(template.phases)) {
    return STANDARD_PEER_REVIEW_TEMPLATE.phases;
  }
  return template.phases as ReviewPhaseConfig[];
}
```

---

### Step 4.1.4: Review Deliberation Service

**File:** `lib/review/reviewService.ts`

```typescript
/**
 * Service for managing peer review deliberations
 */

import { prisma } from "@/lib/prisma";
import {
  CreateReviewInput,
  ReviewDeliberationSummary,
  ReviewStatus,
  ReviewDecision,
  ReviewPhaseType,
} from "./types";
import {
  parseTemplatePhases,
  STANDARD_PEER_REVIEW_TEMPLATE,
} from "./templateService";

/**
 * Create a new review deliberation
 */
export async function createReviewDeliberation(
  input: CreateReviewInput,
  userId: string
): Promise<ReviewDeliberationSummary> {
  const {
    targetType,
    targetPaperId,
    targetUrl,
    targetTitle,
    templateId,
    isBlinded = false,
    isPublicReview = true,
    initialReviewers = [],
  } = input;

  // Get template if provided
  let template = null;
  let phaseConfigs = STANDARD_PEER_REVIEW_TEMPLATE.phases;

  if (templateId) {
    template = await prisma.reviewTemplate.findUnique({
      where: { id: templateId },
    });
    if (template) {
      phaseConfigs = parseTemplatePhases(template);
    }
  }

  // Create in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create base deliberation
    const deliberation = await tx.deliberation.create({
      data: {
        title: `Review: ${targetTitle}`,
        description: `Peer review deliberation for "${targetTitle}"`,
        visibility: isPublicReview ? "public" : "private",
        createdById: userId,
        type: "PEER_REVIEW",
      },
    });

    // Create review deliberation
    const review = await tx.reviewDeliberation.create({
      data: {
        deliberationId: deliberation.id,
        targetType,
        targetPaperId,
        targetUrl,
        targetTitle,
        templateId: template?.id,
        status: "INITIATED",
        isBlinded,
        isPublicReview,
        editorId: userId,
      },
    });

    // Create phases from template
    const phases = await Promise.all(
      phaseConfigs.map((config, index) =>
        tx.reviewPhase.create({
          data: {
            reviewId: review.id,
            name: config.name,
            description: config.description,
            order: index + 1,
            phaseType: config.type,
            status: index === 0 ? "ACTIVE" : "PENDING",
            settings: config as any,
          },
        })
      )
    );

    // Update current phase
    await tx.reviewDeliberation.update({
      where: { id: review.id },
      data: { currentPhaseId: phases[0]?.id },
    });

    // Invite initial reviewers
    if (initialReviewers.length > 0) {
      await Promise.all(
        initialReviewers.map((reviewerId) =>
          tx.reviewerAssignment.create({
            data: {
              reviewId: review.id,
              userId: reviewerId,
              role: "REVIEWER",
              status: "INVITED",
              assignedById: userId,
            },
          })
        )
      );
    }

    // Update template usage count
    if (template) {
      await tx.reviewTemplate.update({
        where: { id: template.id },
        data: { usageCount: { increment: 1 } },
      });
    }

    return { review, deliberation, phases };
  });

  return formatReviewSummary(result.review, result.deliberation);
}

/**
 * Get review deliberation by ID
 */
export async function getReviewDeliberation(
  reviewId: string
): Promise<ReviewDeliberationSummary | null> {
  const review = await prisma.reviewDeliberation.findUnique({
    where: { id: reviewId },
    include: {
      deliberation: true,
      targetPaper: {
        include: {
          authors: { select: { name: true } },
        },
      },
      phases: {
        orderBy: { order: "asc" },
      },
      reviewers: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      editor: { select: { id: true, name: true } },
    },
  });

  if (!review) return null;

  return {
    id: review.id,
    deliberationId: review.deliberationId,
    targetType: review.targetType as any,
    targetTitle: review.targetTitle,
    targetPaper: review.targetPaper
      ? {
          id: review.targetPaper.id,
          title: review.targetPaper.title,
          authors: review.targetPaper.authors.map((a) => a.name),
        }
      : undefined,
    status: review.status as ReviewStatus,
    decision: review.decision as ReviewDecision | undefined,
    currentPhase: review.phases.find((p) => p.id === review.currentPhaseId)
      ? {
          id: review.currentPhaseId!,
          name: review.phases.find((p) => p.id === review.currentPhaseId)!.name,
          type: review.phases.find((p) => p.id === review.currentPhaseId)!
            .phaseType as ReviewPhaseType,
          status: review.phases.find((p) => p.id === review.currentPhaseId)!
            .status,
        }
      : undefined,
    reviewerCount: review.reviewers.length,
    editor: review.editor || undefined,
    createdAt: review.createdAt,
  };
}

/**
 * Update review status
 */
export async function updateReviewStatus(
  reviewId: string,
  status: ReviewStatus,
  userId: string
) {
  return prisma.reviewDeliberation.update({
    where: { id: reviewId },
    data: {
      status,
      updatedAt: new Date(),
    },
  });
}

/**
 * Make review decision
 */
export async function makeReviewDecision(
  reviewId: string,
  decision: ReviewDecision,
  note: string,
  userId: string
) {
  return prisma.reviewDeliberation.update({
    where: { id: reviewId },
    data: {
      decision,
      decisionNote: note,
      decisionDate: new Date(),
      status: "COMPLETED",
    },
  });
}

/**
 * Advance to next phase
 */
export async function advanceToNextPhase(reviewId: string, userId: string) {
  const review = await prisma.reviewDeliberation.findUnique({
    where: { id: reviewId },
    include: {
      phases: { orderBy: { order: "asc" } },
    },
  });

  if (!review) throw new Error("Review not found");

  const currentPhaseIndex = review.phases.findIndex(
    (p) => p.id === review.currentPhaseId
  );

  if (currentPhaseIndex === -1 || currentPhaseIndex >= review.phases.length - 1) {
    throw new Error("No next phase available");
  }

  const currentPhase = review.phases[currentPhaseIndex];
  const nextPhase = review.phases[currentPhaseIndex + 1];

  await prisma.$transaction([
    // Complete current phase
    prisma.reviewPhase.update({
      where: { id: currentPhase.id },
      data: {
        status: "COMPLETED",
        endDate: new Date(),
      },
    }),
    // Activate next phase
    prisma.reviewPhase.update({
      where: { id: nextPhase.id },
      data: {
        status: "ACTIVE",
        startDate: new Date(),
      },
    }),
    // Update review
    prisma.reviewDeliberation.update({
      where: { id: reviewId },
      data: {
        currentPhaseId: nextPhase.id,
        status: mapPhaseToStatus(nextPhase.phaseType as ReviewPhaseType),
      },
    }),
  ]);

  return nextPhase;
}

/**
 * Map phase type to review status
 */
function mapPhaseToStatus(phaseType: ReviewPhaseType): ReviewStatus {
  switch (phaseType) {
    case "INITIAL_REVIEW":
    case "SECOND_REVIEW":
      return "IN_REVIEW";
    case "AUTHOR_RESPONSE":
      return "AUTHOR_RESPONSE";
    case "REVISION":
      return "REVISION";
    case "FINAL_DECISION":
      return "DECISION";
    default:
      return "IN_REVIEW";
  }
}

/**
 * Format review for API response
 */
function formatReviewSummary(
  review: any,
  deliberation: any
): ReviewDeliberationSummary {
  return {
    id: review.id,
    deliberationId: deliberation.id,
    targetType: review.targetType,
    targetTitle: review.targetTitle,
    status: review.status,
    decision: review.decision || undefined,
    reviewerCount: 0,
    createdAt: review.createdAt,
  };
}
```

---

## Phase 4.1 Part 1 Complete

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | ReviewTemplate schema | `prisma/schema.prisma` | 📋 Part 1 |
| 2 | ReviewDeliberation schema | `prisma/schema.prisma` | 📋 Part 1 |
| 3 | ReviewPhase schema | `prisma/schema.prisma` | 📋 Part 1 |
| 4 | ReviewerAssignment schema | `prisma/schema.prisma` | 📋 Part 1 |
| 5 | ReviewerCommitment schema | `prisma/schema.prisma` | 📋 Part 1 |
| 6 | Review types | `lib/review/types.ts` | 📋 Part 1 |
| 7 | Template service | `lib/review/templateService.ts` | 📋 Part 1 |
| 8 | Review service | `lib/review/reviewService.ts` | 📋 Part 1 |

---

## Next: Part 2

Continue to Phase 4.1 Part 2 for:
- Reviewer Assignment Service
- Commitment Service
- Author Response Moves
- API Routes

---

*End of Phase 4.1 Part 1*
