# Phase 4.1: Public Peer Review Deliberations — Part 3

**Sub-Phase:** 4.1 of 4.3  
**Focus:** API Routes and React Query Hooks

---

## Implementation Steps (Continued)

### Step 4.1.10: Review API Routes

**File:** `app/api/review/route.ts`

```typescript
/**
 * Review deliberation API endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createReviewDeliberation,
  getReviewDeliberation,
} from "@/lib/review/reviewService";

const CreateReviewSchema = z.object({
  targetType: z.enum([
    "PAPER",
    "PREPRINT",
    "THESIS",
    "GRANT_PROPOSAL",
    "OTHER",
  ]),
  targetPaperId: z.string().optional(),
  targetUrl: z.string().url().optional(),
  targetTitle: z.string().min(1).max(500),
  templateId: z.string().optional(),
  isBlinded: z.boolean().default(false),
  isPublicReview: z.boolean().default(true),
  initialReviewers: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const input = CreateReviewSchema.parse(body);

    const review = await createReviewDeliberation(input, session.user.id);

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/review/[reviewId]/route.ts`

```typescript
/**
 * Single review endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getReviewDeliberation,
  updateReviewStatus,
  makeReviewDecision,
} from "@/lib/review/reviewService";

export async function GET(
  req: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const review = await getReviewDeliberation(params.reviewId);

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json(
      { error: "Failed to fetch review" },
      { status: 500 }
    );
  }
}

const UpdateStatusSchema = z.object({
  status: z.enum([
    "INITIATED",
    "IN_REVIEW",
    "AUTHOR_RESPONSE",
    "REVISION",
    "FINAL_REVIEW",
    "DECISION",
    "COMPLETED",
    "WITHDRAWN",
  ]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status } = UpdateStatusSchema.parse(body);

    const review = await updateReviewStatus(
      params.reviewId,
      status,
      session.user.id
    );

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/review/[reviewId]/decision/route.ts`

```typescript
/**
 * Review decision endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { makeReviewDecision } from "@/lib/review/reviewService";

const DecisionSchema = z.object({
  decision: z.enum([
    "ACCEPT",
    "MINOR_REVISION",
    "MAJOR_REVISION",
    "REJECT",
    "DESK_REJECT",
  ]),
  note: z.string().min(10),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { decision, note } = DecisionSchema.parse(body);

    const review = await makeReviewDecision(
      params.reviewId,
      decision,
      note,
      session.user.id
    );

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error making decision:", error);
    return NextResponse.json(
      { error: "Failed to make decision" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/review/[reviewId]/phase/advance/route.ts`

```typescript
/**
 * Advance review phase endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { advanceToNextPhase } from "@/lib/review/reviewService";
import { canAdvancePhase } from "@/lib/review/progressService";

export async function POST(
  req: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if can advance
    const { canAdvance, blockers } = await canAdvancePhase(params.reviewId);

    if (!canAdvance) {
      return NextResponse.json(
        { error: "Cannot advance phase", blockers },
        { status: 400 }
      );
    }

    const nextPhase = await advanceToNextPhase(
      params.reviewId,
      session.user.id
    );

    return NextResponse.json(nextPhase);
  } catch (error) {
    console.error("Error advancing phase:", error);
    return NextResponse.json(
      { error: "Failed to advance phase" },
      { status: 500 }
    );
  }
}
```

---

### Step 4.1.11: Assignment API Routes

**File:** `app/api/review/[reviewId]/assignments/route.ts`

```typescript
/**
 * Reviewer assignment endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  inviteReviewer,
  getReviewerAssignments,
} from "@/lib/review/assignmentService";

const InviteReviewerSchema = z.object({
  userId: z.string(),
  role: z
    .enum([
      "REVIEWER",
      "SENIOR_REVIEWER",
      "STATISTICAL_REVIEWER",
      "ETHICS_REVIEWER",
      "GUEST_EDITOR",
    ])
    .default("REVIEWER"),
  deadline: z.string().datetime().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const assignments = await getReviewerAssignments(params.reviewId);
    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, role, deadline } = InviteReviewerSchema.parse(body);

    const assignment = await inviteReviewer(
      params.reviewId,
      userId,
      role,
      session.user.id,
      deadline ? new Date(deadline) : undefined
    );

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Error inviting reviewer:", error);
    return NextResponse.json(
      { error: "Failed to invite reviewer" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/review/assignments/[assignmentId]/respond/route.ts`

```typescript
/**
 * Respond to reviewer invitation
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { respondToInvitation } from "@/lib/review/assignmentService";

const ResponseSchema = z.object({
  accept: z.boolean(),
  declineReason: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { accept, declineReason } = ResponseSchema.parse(body);

    const assignment = await respondToInvitation(
      params.assignmentId,
      session.user.id,
      accept,
      declineReason
    );

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error responding to invitation:", error);
    return NextResponse.json(
      { error: "Failed to respond to invitation" },
      { status: 500 }
    );
  }
}
```

---

### Step 4.1.12: Commitment API Routes

**File:** `app/api/review/[reviewId]/commitments/route.ts`

```typescript
/**
 * Reviewer commitment endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getReviewCommitments } from "@/lib/review/commitmentService";

export async function GET(
  req: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const onlyBlocking = searchParams.get("blocking") === "true";
    const onlyUnresolved = searchParams.get("unresolved") === "true";

    const commitments = await getReviewCommitments(params.reviewId, {
      onlyBlocking,
      onlyUnresolved,
    });

    return NextResponse.json(commitments);
  } catch (error) {
    console.error("Error fetching commitments:", error);
    return NextResponse.json(
      { error: "Failed to fetch commitments" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/review/assignments/[assignmentId]/commitments/route.ts`

```typescript
/**
 * Create commitment for an assignment
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCommitment } from "@/lib/review/commitmentService";

const CommitmentSchema = z.object({
  topic: z.string().min(1).max(200),
  description: z.string().min(10),
  position: z.enum([
    "STRONGLY_SUPPORT",
    "SUPPORT",
    "NEUTRAL",
    "CONCERN",
    "STRONGLY_OPPOSE",
  ]),
  strength: z.enum(["WEAK", "MODERATE", "STRONG", "BLOCKING"]),
  argumentId: z.string().optional(),
  targetClaimId: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const input = CommitmentSchema.parse(body);

    const commitment = await createCommitment(
      params.assignmentId,
      input,
      session.user.id
    );

    return NextResponse.json(commitment, { status: 201 });
  } catch (error) {
    console.error("Error creating commitment:", error);
    return NextResponse.json(
      { error: "Failed to create commitment" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/review/commitments/[commitmentId]/resolve/route.ts`

```typescript
/**
 * Resolve a commitment
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveCommitment } from "@/lib/review/commitmentService";

const ResolveSchema = z.object({
  resolutionNote: z.string().min(5),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { commitmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { resolutionNote } = ResolveSchema.parse(body);

    const commitment = await resolveCommitment(
      params.commitmentId,
      resolutionNote,
      session.user.id
    );

    return NextResponse.json(commitment);
  } catch (error) {
    console.error("Error resolving commitment:", error);
    return NextResponse.json(
      { error: "Failed to resolve commitment" },
      { status: 500 }
    );
  }
}
```

---

### Step 4.1.13: Author Response API Routes

**File:** `app/api/review/[reviewId]/responses/route.ts`

```typescript
/**
 * Author response endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createAuthorResponse,
  getAuthorResponses,
  getResponseSummary,
} from "@/lib/review/authorResponseService";

const MoveSchema = z.object({
  targetCommitmentId: z.string().optional(),
  targetArgumentId: z.string().optional(),
  moveType: z.enum([
    "CONCEDE",
    "DEFEND",
    "QUALIFY",
    "REVISE",
    "DEFER",
    "CLARIFY",
    "CHALLENGE",
  ]),
  explanation: z.string().min(10),
  supportingArgumentId: z.string().optional(),
  revisionDescription: z.string().optional(),
  revisionLocation: z.string().optional(),
});

const CreateResponseSchema = z.object({
  phaseId: z.string(),
  summary: z.string().min(20),
  moves: z.array(MoveSchema).min(1),
  revisionId: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const summary = searchParams.get("summary") === "true";

    if (summary) {
      const responseSummary = await getResponseSummary(params.reviewId);
      return NextResponse.json(responseSummary);
    }

    const responses = await getAuthorResponses(params.reviewId);
    return NextResponse.json(responses);
  } catch (error) {
    console.error("Error fetching responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch responses" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const input = CreateResponseSchema.parse(body);

    const response = await createAuthorResponse(
      {
        reviewId: params.reviewId,
        ...input,
      },
      session.user.id
    );

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating response:", error);
    return NextResponse.json(
      { error: "Failed to create response" },
      { status: 500 }
    );
  }
}
```

---

### Step 4.1.14: Progress & Timeline API Routes

**File:** `app/api/review/[reviewId]/progress/route.ts`

```typescript
/**
 * Review progress endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getReviewProgress,
  canAdvancePhase,
} from "@/lib/review/progressService";

export async function GET(
  req: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const progress = await getReviewProgress(params.reviewId);
    const advanceStatus = await canAdvancePhase(params.reviewId);

    return NextResponse.json({
      ...progress,
      canAdvance: advanceStatus.canAdvance,
      blockers: advanceStatus.blockers,
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/review/[reviewId]/timeline/route.ts`

```typescript
/**
 * Review timeline endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { getReviewTimeline } from "@/lib/review/progressService";

export async function GET(
  req: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const timeline = await getReviewTimeline(params.reviewId);
    return NextResponse.json(timeline);
  } catch (error) {
    console.error("Error fetching timeline:", error);
    return NextResponse.json(
      { error: "Failed to fetch timeline" },
      { status: 500 }
    );
  }
}
```

---

### Step 4.1.15: React Query Hooks

**File:** `lib/review/hooks.ts`

```typescript
/**
 * React Query hooks for peer review
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ReviewDeliberationSummary,
  ReviewerAssignmentSummary,
  ReviewerCommitmentSummary,
  ReviewProgressSummary,
  CreateReviewInput,
} from "./types";

// ===============================
// Query Keys
// ===============================

export const reviewKeys = {
  all: ["reviews"] as const,
  lists: () => [...reviewKeys.all, "list"] as const,
  list: (filters: Record<string, any>) =>
    [...reviewKeys.lists(), filters] as const,
  details: () => [...reviewKeys.all, "detail"] as const,
  detail: (id: string) => [...reviewKeys.details(), id] as const,
  assignments: (reviewId: string) =>
    [...reviewKeys.detail(reviewId), "assignments"] as const,
  commitments: (reviewId: string) =>
    [...reviewKeys.detail(reviewId), "commitments"] as const,
  responses: (reviewId: string) =>
    [...reviewKeys.detail(reviewId), "responses"] as const,
  progress: (reviewId: string) =>
    [...reviewKeys.detail(reviewId), "progress"] as const,
  timeline: (reviewId: string) =>
    [...reviewKeys.detail(reviewId), "timeline"] as const,
};

// ===============================
// Review Queries
// ===============================

export function useReview(reviewId: string) {
  return useQuery({
    queryKey: reviewKeys.detail(reviewId),
    queryFn: async (): Promise<ReviewDeliberationSummary> => {
      const res = await fetch(`/api/review/${reviewId}`);
      if (!res.ok) throw new Error("Failed to fetch review");
      return res.json();
    },
    enabled: !!reviewId,
  });
}

export function useReviewProgress(reviewId: string) {
  return useQuery({
    queryKey: reviewKeys.progress(reviewId),
    queryFn: async (): Promise<
      ReviewProgressSummary & { canAdvance: boolean; blockers: string[] }
    > => {
      const res = await fetch(`/api/review/${reviewId}/progress`);
      if (!res.ok) throw new Error("Failed to fetch progress");
      return res.json();
    },
    enabled: !!reviewId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useReviewTimeline(reviewId: string) {
  return useQuery({
    queryKey: reviewKeys.timeline(reviewId),
    queryFn: async () => {
      const res = await fetch(`/api/review/${reviewId}/timeline`);
      if (!res.ok) throw new Error("Failed to fetch timeline");
      return res.json();
    },
    enabled: !!reviewId,
  });
}

// ===============================
// Assignment Queries & Mutations
// ===============================

export function useReviewerAssignments(reviewId: string) {
  return useQuery({
    queryKey: reviewKeys.assignments(reviewId),
    queryFn: async (): Promise<ReviewerAssignmentSummary[]> => {
      const res = await fetch(`/api/review/${reviewId}/assignments`);
      if (!res.ok) throw new Error("Failed to fetch assignments");
      return res.json();
    },
    enabled: !!reviewId,
  });
}

export function useInviteReviewer(reviewId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      userId: string;
      role?: string;
      deadline?: string;
    }) => {
      const res = await fetch(`/api/review/${reviewId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to invite reviewer");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.assignments(reviewId),
      });
    },
  });
}

export function useRespondToInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      accept,
      declineReason,
    }: {
      assignmentId: string;
      accept: boolean;
      declineReason?: string;
    }) => {
      const res = await fetch(
        `/api/review/assignments/${assignmentId}/respond`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accept, declineReason }),
        }
      );
      if (!res.ok) throw new Error("Failed to respond to invitation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}

// ===============================
// Commitment Queries & Mutations
// ===============================

export function useReviewCommitments(
  reviewId: string,
  options?: { onlyBlocking?: boolean; onlyUnresolved?: boolean }
) {
  const params = new URLSearchParams();
  if (options?.onlyBlocking) params.set("blocking", "true");
  if (options?.onlyUnresolved) params.set("unresolved", "true");

  return useQuery({
    queryKey: [...reviewKeys.commitments(reviewId), options],
    queryFn: async (): Promise<ReviewerCommitmentSummary[]> => {
      const res = await fetch(
        `/api/review/${reviewId}/commitments?${params.toString()}`
      );
      if (!res.ok) throw new Error("Failed to fetch commitments");
      return res.json();
    },
    enabled: !!reviewId,
  });
}

export function useCreateCommitment(assignmentId: string, reviewId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      topic: string;
      description: string;
      position: string;
      strength: string;
      argumentId?: string;
      targetClaimId?: string;
    }) => {
      const res = await fetch(
        `/api/review/assignments/${assignmentId}/commitments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error("Failed to create commitment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.commitments(reviewId),
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.progress(reviewId),
      });
    },
  });
}

export function useResolveCommitment(reviewId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commitmentId,
      resolutionNote,
    }: {
      commitmentId: string;
      resolutionNote: string;
    }) => {
      const res = await fetch(
        `/api/review/commitments/${commitmentId}/resolve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resolutionNote }),
        }
      );
      if (!res.ok) throw new Error("Failed to resolve commitment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.commitments(reviewId),
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.progress(reviewId),
      });
    },
  });
}

// ===============================
// Response Queries & Mutations
// ===============================

export function useAuthorResponses(reviewId: string) {
  return useQuery({
    queryKey: reviewKeys.responses(reviewId),
    queryFn: async () => {
      const res = await fetch(`/api/review/${reviewId}/responses`);
      if (!res.ok) throw new Error("Failed to fetch responses");
      return res.json();
    },
    enabled: !!reviewId,
  });
}

export function useResponseSummary(reviewId: string) {
  return useQuery({
    queryKey: [...reviewKeys.responses(reviewId), "summary"],
    queryFn: async () => {
      const res = await fetch(`/api/review/${reviewId}/responses?summary=true`);
      if (!res.ok) throw new Error("Failed to fetch response summary");
      return res.json();
    },
    enabled: !!reviewId,
  });
}

export function useCreateAuthorResponse(reviewId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      phaseId: string;
      summary: string;
      moves: Array<{
        targetCommitmentId?: string;
        targetArgumentId?: string;
        moveType: string;
        explanation: string;
        supportingArgumentId?: string;
        revisionDescription?: string;
        revisionLocation?: string;
      }>;
      revisionId?: string;
    }) => {
      const res = await fetch(`/api/review/${reviewId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create response");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.responses(reviewId),
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.progress(reviewId),
      });
    },
  });
}

// ===============================
// Review Actions
// ===============================

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReviewInput) => {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to create review");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
    },
  });
}

export function useAdvancePhase(reviewId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/review/${reviewId}/phase/advance`, {
        method: "POST",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.blockers?.join(", ") || "Cannot advance phase");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.detail(reviewId) });
      queryClient.invalidateQueries({ queryKey: reviewKeys.progress(reviewId) });
    },
  });
}

export function useMakeDecision(reviewId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { decision: string; note: string }) => {
      const res = await fetch(`/api/review/${reviewId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to make decision");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.detail(reviewId) });
      queryClient.invalidateQueries({ queryKey: reviewKeys.progress(reviewId) });
    },
  });
}
```

---

## Phase 4.1 Part 3 Checklist

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Review API routes | `app/api/review/route.ts` | 📋 Part 3 |
| 2 | Single review routes | `app/api/review/[reviewId]/route.ts` | 📋 Part 3 |
| 3 | Decision API | `app/api/review/[reviewId]/decision/route.ts` | 📋 Part 3 |
| 4 | Phase advance API | `app/api/review/[reviewId]/phase/advance/route.ts` | 📋 Part 3 |
| 5 | Assignment APIs | `app/api/review/.../assignments/` | 📋 Part 3 |
| 6 | Commitment APIs | `app/api/review/.../commitments/` | 📋 Part 3 |
| 7 | Response APIs | `app/api/review/[reviewId]/responses/` | 📋 Part 3 |
| 8 | Progress & Timeline APIs | `app/api/review/[reviewId]/progress/` | 📋 Part 3 |
| 9 | React Query hooks | `lib/review/hooks.ts` | 📋 Part 3 |

---

## Next: Part 4

Continue to Phase 4.1 Part 4 for:
- UI Components (ReviewDashboard, PhaseTimeline, CommitmentPanel)
- Author Response Composer
- Decision Making Interface

---

*End of Phase 4.1 Part 3*
