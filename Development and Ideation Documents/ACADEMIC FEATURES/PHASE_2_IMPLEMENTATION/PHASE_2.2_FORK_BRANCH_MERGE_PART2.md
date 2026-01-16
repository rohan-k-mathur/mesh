# Phase 2.2: Fork/Branch/Merge for Deliberations — Part 2

**Sub-Phase:** 2.2 of 2.3 (Continued)  
**Focus:** API Routes & UI Components

---

## Implementation Steps (Continued)

### Step 2.2.5: Fork API Routes

**File:** `app/api/deliberations/[id]/fork/route.ts`

```typescript
/**
 * POST /api/deliberations/:id/fork
 * Create a fork of a deliberation
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createFork } from "@/lib/forks/forkService";

const ForkSchema = z.object({
  title: z.string().min(1).max(500),
  forkReason: z.string().min(1).max(2000),
  forkType: z.enum([
    "ASSUMPTION_VARIANT",
    "METHODOLOGICAL",
    "SCOPE_EXTENSION",
    "ADVERSARIAL",
    "EDUCATIONAL",
    "ARCHIVAL",
  ]),
  description: z.string().optional(),
  importAllClaims: z.boolean().default(false),
  claimIdsToImport: z.array(z.string()).optional(),
  importAllArguments: z.boolean().default(false),
  argumentIdsToImport: z.array(z.string()).optional(),
  fromReleaseId: z.string().optional(),
  visibility: z.enum(["public", "private", "organization"]).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = ForkSchema.parse(body);

    const fork = await createFork(
      {
        parentDeliberationId: params.id,
        ...validatedData,
      },
      session.user.id
    );

    return NextResponse.json(fork, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Fork creation error:", error);
    return NextResponse.json(
      { error: "Failed to create fork" },
      { status: 500 }
    );
  }
}
```

---

**File:** `app/api/deliberations/[id]/forks/route.ts`

```typescript
/**
 * GET /api/deliberations/:id/forks
 * List all forks of a deliberation
 */

import { NextRequest, NextResponse } from "next/server";
import { getForks, getForkTree } from "@/lib/forks/forkService";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const includeTree = searchParams.get("tree") === "true";

    if (includeTree) {
      const tree = await getForkTree(params.id);
      return NextResponse.json(tree);
    }

    const forks = await getForks(params.id);
    return NextResponse.json(forks);
  } catch (error) {
    console.error("Get forks error:", error);
    return NextResponse.json(
      { error: "Failed to get forks" },
      { status: 500 }
    );
  }
}
```

---

### Step 2.2.6: Merge Request API Routes

**File:** `app/api/deliberations/[id]/merge-requests/route.ts`

```typescript
/**
 * GET/POST /api/deliberations/:id/merge-requests
 * List or create merge requests
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createMergeRequest,
  getMergeRequests,
  analyzeMerge,
} from "@/lib/forks/mergeService";

const MergeRequestSchema = z.object({
  targetDeliberationId: z.string(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  claimsToMerge: z.array(
    z.object({
      claimId: z.string(),
      strategy: z.enum([
        "ADD_NEW",
        "REPLACE",
        "LINK_SUPPORT",
        "LINK_CHALLENGE",
        "SKIP",
      ]),
      targetClaimId: z.string().optional(),
    })
  ),
  argumentsToMerge: z.array(
    z.object({
      argumentId: z.string(),
      includeWithClaims: z.boolean().default(true),
    })
  ),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const direction = searchParams.get("direction") as
      | "incoming"
      | "outgoing"
      | null;

    const mergeRequests = await getMergeRequests(
      params.id,
      direction || "incoming"
    );
    return NextResponse.json(mergeRequests);
  } catch (error) {
    console.error("Get merge requests error:", error);
    return NextResponse.json(
      { error: "Failed to get merge requests" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = MergeRequestSchema.parse(body);

    // Analyze merge first
    const analysis = await analyzeMerge({
      sourceDeliberationId: params.id,
      ...validatedData,
    });

    if (!analysis.canMerge) {
      return NextResponse.json(
        {
          error: "Merge has blocking conflicts",
          analysis,
        },
        { status: 409 }
      );
    }

    const mergeRequest = await createMergeRequest(
      {
        sourceDeliberationId: params.id,
        ...validatedData,
      },
      session.user.id
    );

    return NextResponse.json(
      { mergeRequest, analysis },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create merge request error:", error);
    return NextResponse.json(
      { error: "Failed to create merge request" },
      { status: 500 }
    );
  }
}
```

---

**File:** `app/api/merge-requests/[mrId]/route.ts`

```typescript
/**
 * GET/PATCH /api/merge-requests/:mrId
 * Get or update a merge request
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const UpdateMergeRequestSchema = z.object({
  status: z
    .enum(["OPEN", "IN_REVIEW", "APPROVED", "CLOSED", "CONFLICT"])
    .optional(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { mrId: string } }
) {
  try {
    const mergeRequest = await prisma.mergeRequest.findUnique({
      where: { id: params.mrId },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        sourceDeliberation: {
          select: {
            id: true,
            title: true,
            claims: {
              select: { id: true, text: true, type: true },
            },
          },
        },
        targetDeliberation: {
          select: {
            id: true,
            title: true,
            claims: {
              select: { id: true, text: true, type: true },
            },
          },
        },
        reviewComments: {
          include: {
            author: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!mergeRequest) {
      return NextResponse.json(
        { error: "Merge request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(mergeRequest);
  } catch (error) {
    console.error("Get merge request error:", error);
    return NextResponse.json(
      { error: "Failed to get merge request" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { mrId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = UpdateMergeRequestSchema.parse(body);

    // Check permission (author or target maintainer)
    const mergeRequest = await prisma.mergeRequest.findUnique({
      where: { id: params.mrId },
      include: {
        targetDeliberation: {
          include: { members: true },
        },
      },
    });

    if (!mergeRequest) {
      return NextResponse.json(
        { error: "Merge request not found" },
        { status: 404 }
      );
    }

    const isAuthor = mergeRequest.authorId === session.user.id;
    const isMaintainer = mergeRequest.targetDeliberation.members.some(
      (m) => m.userId === session.user.id && ["OWNER", "ADMIN"].includes(m.role)
    );

    if (!isAuthor && !isMaintainer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only maintainers can approve
    if (validatedData.status === "APPROVED" && !isMaintainer) {
      return NextResponse.json(
        { error: "Only maintainers can approve" },
        { status: 403 }
      );
    }

    const updated = await prisma.mergeRequest.update({
      where: { id: params.mrId },
      data: {
        ...validatedData,
        ...(validatedData.status === "CLOSED" ? { closedAt: new Date() } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update merge request error:", error);
    return NextResponse.json(
      { error: "Failed to update merge request" },
      { status: 500 }
    );
  }
}
```

---

**File:** `app/api/merge-requests/[mrId]/merge/route.ts`

```typescript
/**
 * POST /api/merge-requests/:mrId/merge
 * Execute a merge
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeMerge } from "@/lib/forks/mergeService";

export async function POST(
  req: NextRequest,
  { params }: { params: { mrId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await executeMerge(params.mrId, session.user.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Execute merge error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute merge" },
      { status: 500 }
    );
  }
}
```

---

**File:** `app/api/merge-requests/[mrId]/comments/route.ts`

```typescript
/**
 * POST /api/merge-requests/:mrId/comments
 * Add a review comment to a merge request
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CommentSchema = z.object({
  content: z.string().min(1).max(10000),
  targetClaimId: z.string().optional(),
  targetArgumentId: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { mrId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = CommentSchema.parse(body);

    const comment = await prisma.mergeComment.create({
      data: {
        mergeRequestId: params.mrId,
        authorId: session.user.id,
        ...validatedData,
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Add comment error:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}
```

---

### Step 2.2.7: UI Components

**File:** `components/forks/ForkButton.tsx`

```tsx
"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GitFork, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface ForkButtonProps {
  deliberationId: string;
  deliberationTitle: string;
  claims: Array<{ id: string; text: string }>;
}

const FORK_TYPES = [
  {
    value: "ASSUMPTION_VARIANT",
    label: "Alternative Assumptions",
    description: "Explore different foundational assumptions",
  },
  {
    value: "METHODOLOGICAL",
    label: "Different Method",
    description: "Apply different analytical approach",
  },
  {
    value: "SCOPE_EXTENSION",
    label: "Scope Extension",
    description: "Extend to new domain or context",
  },
  {
    value: "ADVERSARIAL",
    label: "Devil's Advocate",
    description: "Challenge main conclusions",
  },
  {
    value: "EDUCATIONAL",
    label: "Teaching Fork",
    description: "For learning or demonstration",
  },
  {
    value: "ARCHIVAL",
    label: "Archive",
    description: "Preserve this version",
  },
];

export function ForkButton({
  deliberationId,
  deliberationTitle,
  claims,
}: ForkButtonProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(`Fork of: ${deliberationTitle}`);
  const [forkReason, setForkReason] = useState("");
  const [forkType, setForkType] = useState<string>("ASSUMPTION_VARIANT");
  const [selectedClaims, setSelectedClaims] = useState<Set<string>>(
    new Set(claims.map((c) => c.id))
  );
  const [importAll, setImportAll] = useState(true);

  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  const forkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/deliberations/${deliberationId}/fork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          forkReason,
          forkType,
          importAllClaims: importAll,
          claimIdsToImport: importAll ? undefined : Array.from(selectedClaims),
          importAllArguments: importAll,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create fork");
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Fork created",
        description: "Your fork is ready. Redirecting...",
      });
      queryClient.invalidateQueries({
        queryKey: ["deliberation-forks", deliberationId],
      });
      setOpen(false);
      router.push(`/deliberations/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Fork failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleClaim = (claimId: string) => {
    const next = new Set(selectedClaims);
    if (next.has(claimId)) {
      next.delete(claimId);
    } else {
      next.add(claimId);
    }
    setSelectedClaims(next);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <GitFork className="h-4 w-4 mr-2" />
          Fork
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fork Deliberation</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Fork Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title"
            />
          </div>

          {/* Fork Type */}
          <div className="space-y-2">
            <Label htmlFor="forkType">Fork Type</Label>
            <Select value={forkType} onValueChange={setForkType}>
              <SelectTrigger>
                <SelectValue placeholder="Select fork type" />
              </SelectTrigger>
              <SelectContent>
                {FORK_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {type.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fork Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Fork Reason / Hypothesis</Label>
            <Textarea
              id="reason"
              value={forkReason}
              onChange={(e) => setForkReason(e.target.value)}
              placeholder="What alternative assumption or approach will you explore?"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Explain why you're creating this fork — this helps others
              understand the divergent line of inquiry.
            </p>
          </div>

          {/* Claim Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Claims to Import</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setImportAll(!importAll);
                  if (!importAll) {
                    setSelectedClaims(new Set(claims.map((c) => c.id)));
                  }
                }}
              >
                {importAll ? "Select specific" : "Import all"}
              </Button>
            </div>

            {!importAll && (
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                {claims.map((claim) => (
                  <label
                    key={claim.id}
                    className="flex items-start gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClaims.has(claim.id)}
                      onChange={() => toggleClaim(claim.id)}
                      className="mt-1"
                    />
                    <span className="text-sm">{claim.text}</span>
                  </label>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {importAll
                ? `All ${claims.length} claims will be imported`
                : `${selectedClaims.size} of ${claims.length} claims selected`}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => forkMutation.mutate()}
              disabled={!forkReason.trim() || forkMutation.isPending}
            >
              {forkMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <GitFork className="h-4 w-4 mr-2" />
                  Create Fork
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

**File:** `components/forks/ForkList.tsx`

```tsx
"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { GitFork, GitMerge, ExternalLink, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ForkSummary } from "@/lib/forks/types";

interface ForkListProps {
  deliberationId: string;
}

const FORK_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  ASSUMPTION_VARIANT: { label: "Alt. Assumptions", color: "bg-blue-100 text-blue-800" },
  METHODOLOGICAL: { label: "Different Method", color: "bg-purple-100 text-purple-800" },
  SCOPE_EXTENSION: { label: "Extended Scope", color: "bg-green-100 text-green-800" },
  ADVERSARIAL: { label: "Devil's Advocate", color: "bg-red-100 text-red-800" },
  EDUCATIONAL: { label: "Educational", color: "bg-yellow-100 text-yellow-800" },
  ARCHIVAL: { label: "Archive", color: "bg-gray-100 text-gray-800" },
};

export function ForkList({ deliberationId }: ForkListProps) {
  const { data: forks, isLoading } = useQuery<ForkSummary[]>({
    queryKey: ["deliberation-forks", deliberationId],
    queryFn: async () => {
      const res = await fetch(`/api/deliberations/${deliberationId}/forks`);
      if (!res.ok) throw new Error("Failed to fetch forks");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!forks?.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <GitFork className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            No forks yet. Fork this deliberation to explore alternative
            assumptions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Forks ({forks.length})</h3>
      </div>

      {forks.map((fork) => (
        <Card key={fork.id} className="hover:border-primary/50 transition-colors">
          <CardContent className="py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={`/deliberations/${fork.id}`}
                    className="font-medium hover:underline truncate"
                  >
                    {fork.title}
                  </Link>
                  <Badge
                    variant="secondary"
                    className={FORK_TYPE_LABELS[fork.forkType]?.color}
                  >
                    {FORK_TYPE_LABELS[fork.forkType]?.label || fork.forkType}
                  </Badge>
                  {fork.hasMergeRequest && (
                    <Badge variant="outline" className="gap-1">
                      <GitMerge className="h-3 w-3" />
                      MR Open
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {fork.forkReason}
                </p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={fork.forkedBy.image} />
                      <AvatarFallback>
                        {fork.forkedBy.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {fork.forkedBy.name}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(fork.forkedAt), {
                      addSuffix: true,
                    })}
                  </div>
                  {fork.forkedFromVersion && (
                    <span>from v{fork.forkedFromVersion}</span>
                  )}
                  <span>{fork.claimCount} claims</span>
                  <span>{fork.argumentCount} arguments</span>
                </div>
              </div>

              <Link href={`/deliberations/${fork.id}`}>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

---

**File:** `components/forks/ForkTreeVisualization.tsx`

```tsx
"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { GitFork, Circle, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ForkTreeVisualizationProps {
  deliberationId: string;
  currentId?: string;
}

interface TreeNode {
  id: string;
  title: string;
  forkReason?: string;
  forkType?: string;
  children: TreeNode[];
  createdAt?: string;
  _count?: { claims: number; arguments: number };
}

function TreeNodeComponent({
  node,
  currentId,
  depth = 0,
}: {
  node: TreeNode;
  currentId?: string;
  depth?: number;
}) {
  const isCurrent = node.id === currentId;

  return (
    <div className="relative">
      {/* Connector line */}
      {depth > 0 && (
        <div
          className="absolute left-0 top-0 h-4 w-4 border-l-2 border-b-2 border-muted-foreground/30 rounded-bl"
          style={{ marginLeft: `${(depth - 1) * 24 + 8}px` }}
        />
      )}

      <div
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-md transition-colors",
          isCurrent ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"
        )}
        style={{ marginLeft: `${depth * 24}px` }}
      >
        {depth === 0 ? (
          <Circle className="h-4 w-4 text-primary fill-primary" />
        ) : (
          <GitFork className="h-4 w-4 text-muted-foreground" />
        )}

        <Link
          href={`/deliberations/${node.id}`}
          className={cn(
            "font-medium hover:underline truncate flex-1",
            isCurrent && "text-primary"
          )}
        >
          {node.title}
        </Link>

        {node.forkType && (
          <Badge variant="secondary" className="text-xs">
            {node.forkType.replace("_", " ")}
          </Badge>
        )}

        {isCurrent && (
          <Badge variant="default" className="text-xs">
            Current
          </Badge>
        )}
      </div>

      {/* Children */}
      {node.children?.map((child) => (
        <TreeNodeComponent
          key={child.id}
          node={child}
          currentId={currentId}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export function ForkTreeVisualization({
  deliberationId,
  currentId,
}: ForkTreeVisualizationProps) {
  const { data: tree, isLoading } = useQuery<TreeNode>({
    queryKey: ["deliberation-fork-tree", deliberationId],
    queryFn: async () => {
      const res = await fetch(
        `/api/deliberations/${deliberationId}/forks?tree=true`
      );
      if (!res.ok) throw new Error("Failed to fetch fork tree");
      return res.json();
    },
  });

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!tree) {
    return null;
  }

  // Count total nodes
  const countNodes = (node: TreeNode): number =>
    1 + (node.children?.reduce((sum, c) => sum + countNodes(c), 0) || 0);

  const totalNodes = countNodes(tree);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <GitFork className="h-4 w-4" />
          Fork Tree ({totalNodes} deliberation{totalNodes !== 1 ? "s" : ""})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TreeNodeComponent node={tree} currentId={currentId || deliberationId} />
      </CardContent>
    </Card>
  );
}
```

---

**File:** `components/forks/MergeRequestView.tsx`

```tsx
"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GitMerge,
  GitPullRequest,
  Check,
  X,
  MessageSquare,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";

interface MergeRequestViewProps {
  mergeRequestId: string;
  isOwnerOrAdmin?: boolean;
}

const STATUS_CONFIG: Record<
  string,
  { color: string; icon: React.ReactNode; label: string }
> = {
  OPEN: { color: "bg-green-100 text-green-800", icon: <GitPullRequest className="h-3 w-3" />, label: "Open" },
  IN_REVIEW: { color: "bg-yellow-100 text-yellow-800", icon: <MessageSquare className="h-3 w-3" />, label: "In Review" },
  APPROVED: { color: "bg-blue-100 text-blue-800", icon: <Check className="h-3 w-3" />, label: "Approved" },
  MERGED: { color: "bg-purple-100 text-purple-800", icon: <GitMerge className="h-3 w-3" />, label: "Merged" },
  CLOSED: { color: "bg-gray-100 text-gray-800", icon: <X className="h-3 w-3" />, label: "Closed" },
  CONFLICT: { color: "bg-red-100 text-red-800", icon: <AlertTriangle className="h-3 w-3" />, label: "Conflict" },
};

export function MergeRequestView({
  mergeRequestId,
  isOwnerOrAdmin = false,
}: MergeRequestViewProps) {
  const [comment, setComment] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mr, isLoading } = useQuery({
    queryKey: ["merge-request", mergeRequestId],
    queryFn: async () => {
      const res = await fetch(`/api/merge-requests/${mergeRequestId}`);
      if (!res.ok) throw new Error("Failed to fetch merge request");
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/merge-requests/${mergeRequestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["merge-request", mergeRequestId],
      });
      toast({ title: "Status updated" });
    },
  });

  const mergeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/merge-requests/${mergeRequestId}/merge`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to merge");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["merge-request", mergeRequestId],
      });
      toast({ title: "Merge successful!", description: "Changes have been merged." });
    },
    onError: (error: Error) => {
      toast({
        title: "Merge failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/merge-requests/${mergeRequestId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment }),
      });
      if (!res.ok) throw new Error("Failed to add comment");
      return res.json();
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({
        queryKey: ["merge-request", mergeRequestId],
      });
    },
  });

  if (isLoading || !mr) {
    return <div className="animate-pulse h-96 bg-muted rounded-lg" />;
  }

  const statusConfig = STATUS_CONFIG[mr.status] || STATUS_CONFIG.OPEN;
  const claimsToMerge = mr.claimsToMerge as any[];
  const canMerge = mr.status === "APPROVED" && isOwnerOrAdmin;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitPullRequest className="h-5 w-5" />
                {mr.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {mr.sourceDeliberation.title} → {mr.targetDeliberation.title}
              </p>
            </div>
            <Badge className={statusConfig.color}>
              {statusConfig.icon}
              <span className="ml-1">{statusConfig.label}</span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {mr.description && (
            <p className="text-sm">{mr.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Avatar className="h-5 w-5">
                <AvatarImage src={mr.author.image} />
                <AvatarFallback>{mr.author.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              {mr.author.name}
            </div>
            <span>
              opened {formatDistanceToNow(new Date(mr.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Merge Summary */}
          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-medium mb-2">Changes to merge</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Claims:</span>{" "}
                {claimsToMerge.filter((c: any) => c.strategy !== "SKIP").length}
              </div>
              <div>
                <span className="text-muted-foreground">Arguments:</span>{" "}
                {(mr.argumentsToMerge as any[]).length}
              </div>
              <div>
                <span className="text-muted-foreground">Comments:</span>{" "}
                {mr.reviewComments?.length || 0}
              </div>
            </div>
          </div>

          {/* Actions */}
          {mr.status !== "MERGED" && mr.status !== "CLOSED" && (
            <div className="flex gap-2 pt-2">
              {isOwnerOrAdmin && (
                <>
                  {mr.status === "OPEN" && (
                    <Button
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate("IN_REVIEW")}
                      disabled={updateStatusMutation.isPending}
                    >
                      Start Review
                    </Button>
                  )}
                  {mr.status === "IN_REVIEW" && (
                    <Button
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate("APPROVED")}
                      disabled={updateStatusMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  )}
                  {canMerge && (
                    <Button
                      onClick={() => mergeMutation.mutate()}
                      disabled={mergeMutation.isPending}
                    >
                      {mergeMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <GitMerge className="h-4 w-4 mr-1" />
                      )}
                      Merge
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => updateStatusMutation.mutate("CLOSED")}
                    disabled={updateStatusMutation.isPending}
                  >
                    Close
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Discussion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mr.reviewComments?.map((c: any) => (
            <div key={c.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={c.author.image} />
                <AvatarFallback>{c.author.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{c.author.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm">{c.content}</p>
              </div>
            </div>
          ))}

          <Separator />

          <div className="space-y-2">
            <Textarea
              placeholder="Leave a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            <Button
              size="sm"
              onClick={() => addCommentMutation.mutate()}
              disabled={!comment.trim() || addCommentMutation.isPending}
            >
              {addCommentMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4 mr-1" />
              )}
              Comment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

**File:** `components/forks/CreateMergeRequestButton.tsx`

```tsx
"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { GitPullRequest, Loader2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { MergeClaimSelection, MergeStrategy } from "@/lib/forks/types";

interface CreateMergeRequestButtonProps {
  sourceDeliberationId: string;
  targetDeliberationId: string;
  sourceClaims: Array<{ id: string; text: string; type: string }>;
  targetClaims: Array<{ id: string; text: string; type: string }>;
}

const STRATEGY_OPTIONS: Array<{ value: MergeStrategy; label: string }> = [
  { value: "ADD_NEW", label: "Add as new claim" },
  { value: "REPLACE", label: "Replace existing" },
  { value: "LINK_SUPPORT", label: "Link as support" },
  { value: "SKIP", label: "Don't merge" },
];

export function CreateMergeRequestButton({
  sourceDeliberationId,
  targetDeliberationId,
  sourceClaims,
  targetClaims,
}: CreateMergeRequestButtonProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [claimSelections, setClaimSelections] = useState<
    Record<string, MergeClaimSelection>
  >(() =>
    Object.fromEntries(
      sourceClaims.map((c) => [c.id, { claimId: c.id, strategy: "ADD_NEW" as MergeStrategy }])
    )
  );

  const { toast } = useToast();
  const router = useRouter();

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/deliberations/${sourceDeliberationId}/merge-requests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetDeliberationId,
            title,
            description,
            claimsToMerge: Object.values(claimSelections),
            argumentsToMerge: [], // Could add argument selection UI
          }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create merge request");
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Merge request created",
        description: "Your merge request is ready for review.",
      });
      setOpen(false);
      router.push(`/merge-requests/${data.mergeRequest.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create merge request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateClaimStrategy = (claimId: string, strategy: MergeStrategy) => {
    setClaimSelections((prev) => ({
      ...prev,
      [claimId]: { ...prev[claimId], strategy },
    }));
  };

  const selectedCount = Object.values(claimSelections).filter(
    (s) => s.strategy !== "SKIP"
  ).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <GitPullRequest className="h-4 w-4 mr-2" />
          Create Merge Request
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Merge Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of changes to merge"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain why these changes should be merged..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Claims to Merge ({selectedCount} selected)</Label>
            <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
              {sourceClaims.map((claim) => (
                <div key={claim.id} className="p-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">{claim.text}</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {claim.type}
                    </Badge>
                  </div>
                  <Select
                    value={claimSelections[claim.id]?.strategy || "ADD_NEW"}
                    onValueChange={(v) =>
                      updateClaimStrategy(claim.id, v as MergeStrategy)
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STRATEGY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!title.trim() || selectedCount === 0 || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <GitPullRequest className="h-4 w-4 mr-2" />
                  Create Merge Request
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Phase 2.2 Checklist

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Schema updates (fork models) | `prisma/schema.prisma` | 📋 Part 1 |
| 2 | Fork types | `lib/forks/types.ts` | 📋 Part 1 |
| 3 | Fork service | `lib/forks/forkService.ts` | 📋 Part 1 |
| 4 | Merge service | `lib/forks/mergeService.ts` | 📋 Part 1 |
| 5 | Fork API (create) | `app/api/deliberations/[id]/fork/route.ts` | 📋 Part 2 |
| 6 | Forks list API | `app/api/deliberations/[id]/forks/route.ts` | 📋 Part 2 |
| 7 | Merge request APIs | `app/api/.../merge-requests/` | 📋 Part 2 |
| 8 | ForkButton component | `components/forks/ForkButton.tsx` | 📋 Part 2 |
| 9 | ForkList component | `components/forks/ForkList.tsx` | 📋 Part 2 |
| 10 | ForkTreeVisualization | `components/forks/ForkTreeVisualization.tsx` | 📋 Part 2 |
| 11 | MergeRequestView | `components/forks/MergeRequestView.tsx` | 📋 Part 2 |
| 12 | CreateMergeRequestButton | `components/forks/CreateMergeRequestButton.tsx` | 📋 Part 2 |

---

## Key Integration Points

### Deliberation Detail Page Integration

```tsx
// In your deliberation detail page, add:
import { ForkButton } from "@/components/forks/ForkButton";
import { ForkList } from "@/components/forks/ForkList";
import { ForkTreeVisualization } from "@/components/forks/ForkTreeVisualization";

// In the toolbar/header:
<ForkButton 
  deliberationId={deliberation.id}
  deliberationTitle={deliberation.title}
  claims={deliberation.claims}
/>

// In a sidebar or tab:
<ForkTreeVisualization 
  deliberationId={deliberation.id}
  currentId={deliberation.id}
/>

// Fork listing section:
<ForkList deliberationId={deliberation.id} />
```

### For Forked Deliberations

```tsx
// Show provenance banner if this is a fork
{deliberation.forkedFromId && (
  <ProvenanceBanner
    parentId={deliberation.forkedFromId}
    parentTitle={deliberation.forkedFrom?.title}
    forkReason={deliberation.forkReason}
  />
)}

// Show merge request button for forks
{deliberation.forkedFromId && (
  <CreateMergeRequestButton
    sourceDeliberationId={deliberation.id}
    targetDeliberationId={deliberation.forkedFromId}
    sourceClaims={deliberation.claims}
    targetClaims={parentClaims}
  />
)}
```

---

## Next: Phase 2.3

Continue to **Phase 2.3: Peer Review & Quality Gates** for:
- ArgumentPullRequest model (propose arguments via PR workflow)
- Review assignments and voting
- Quality scoring and acceptance thresholds
- Notification system for reviews

---

*End of Phase 2.2*
