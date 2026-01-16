# Phase 3.2: Argument-Level Citations — Part 2

**Sub-Phase:** 3.2 of 3.3 (Continued)  
**Focus:** Citation Graph, APIs & UI Components

---

## Implementation Steps (Continued)

### Step 3.2.5: Citation Graph Service

**File:** `lib/citations/citationGraphService.ts`

```typescript
/**
 * Service for building and querying citation graphs
 */

import { prisma } from "@/lib/prisma";
import {
  CitationGraph,
  CitationGraphNode,
  CitationGraphEdge,
  CitationType,
} from "./types";

/**
 * Build citation graph for an argument (ego-centric)
 */
export async function buildArgumentCitationGraph(
  argumentId: string,
  depth: number = 2,
  includeIndirect: boolean = true
): Promise<CitationGraph> {
  const nodes: Map<string, CitationGraphNode> = new Map();
  const edges: CitationGraphEdge[] = [];
  const visited = new Set<string>();

  // BFS to collect citations up to depth
  const queue: Array<{ id: string; currentDepth: number }> = [
    { id: argumentId, currentDepth: 0 },
  ];

  while (queue.length > 0) {
    const { id, currentDepth } = queue.shift()!;

    if (visited.has(id) || currentDepth > depth) continue;
    visited.add(id);

    // Get argument details
    const argument = await prisma.argument.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true } },
        conclusion: { select: { text: true } },
        citationsMade: {
          include: {
            citedArgument: {
              select: { id: true },
            },
          },
        },
        citationsReceived: {
          include: {
            citingArgument: {
              select: { id: true },
            },
          },
        },
        citationMetrics: {
          select: { totalCitations: true },
        },
      },
    });

    if (!argument) continue;

    // Add node
    nodes.set(id, {
      id,
      type: "argument",
      label: argument.conclusion?.text?.slice(0, 80) || "Argument",
      author: argument.createdBy.name,
      citationCount: argument.citationMetrics?.totalCitations || 0,
    });

    // Add edges and queue next level
    if (includeIndirect || currentDepth < depth) {
      // Outgoing citations (this argument cites)
      for (const citation of argument.citationsMade) {
        edges.push({
          source: id,
          target: citation.citedArgument.id,
          citationType: citation.citationType as CitationType,
          weight: 1,
        });

        if (!visited.has(citation.citedArgument.id) && currentDepth + 1 <= depth) {
          queue.push({
            id: citation.citedArgument.id,
            currentDepth: currentDepth + 1,
          });
        }
      }

      // Incoming citations (this argument is cited by)
      for (const citation of argument.citationsReceived) {
        edges.push({
          source: citation.citingArgument.id,
          target: id,
          citationType: citation.citationType as CitationType,
          weight: 1,
        });

        if (!visited.has(citation.citingArgument.id) && currentDepth + 1 <= depth) {
          queue.push({
            id: citation.citingArgument.id,
            currentDepth: currentDepth + 1,
          });
        }
      }
    }
  }

  return {
    nodes: Array.from(nodes.values()),
    edges: deduplicateEdges(edges),
  };
}

/**
 * Build citation graph for a deliberation
 */
export async function buildDeliberationCitationGraph(
  deliberationId: string,
  includeExternalCitations: boolean = true
): Promise<CitationGraph> {
  const nodes: Map<string, CitationGraphNode> = new Map();
  const edges: CitationGraphEdge[] = [];

  // Get all arguments in deliberation
  const arguments_ = await prisma.argument.findMany({
    where: { deliberationId },
    include: {
      createdBy: { select: { name: true } },
      conclusion: { select: { text: true } },
      citationsMade: {
        include: {
          citedArgument: {
            include: {
              deliberation: { select: { id: true, title: true } },
              createdBy: { select: { name: true } },
              conclusion: { select: { text: true } },
            },
          },
        },
      },
      citationsReceived: {
        include: {
          citingArgument: {
            include: {
              deliberation: { select: { id: true, title: true } },
              createdBy: { select: { name: true } },
              conclusion: { select: { text: true } },
            },
          },
        },
      },
      citationMetrics: {
        select: { totalCitations: true },
      },
    },
  });

  // Add deliberation as central node
  const deliberation = await prisma.deliberation.findUnique({
    where: { id: deliberationId },
    select: { title: true },
  });

  // Add argument nodes
  for (const arg of arguments_) {
    nodes.set(arg.id, {
      id: arg.id,
      type: "argument",
      label: arg.conclusion?.text?.slice(0, 80) || "Argument",
      author: arg.createdBy.name,
      citationCount: arg.citationMetrics?.totalCitations || 0,
    });

    // Add citations made
    for (const citation of arg.citationsMade) {
      const isExternal = citation.citedArgument.deliberation.id !== deliberationId;

      if (!isExternal || includeExternalCitations) {
        // Add cited argument node if external
        if (isExternal) {
          const cited = citation.citedArgument;
          if (!nodes.has(cited.id)) {
            nodes.set(cited.id, {
              id: cited.id,
              type: "argument",
              label: `[${cited.deliberation.title}] ${cited.conclusion?.text?.slice(0, 50) || ""}`,
              author: cited.createdBy.name,
              citationCount: 0,
            });
          }
        }

        edges.push({
          source: arg.id,
          target: citation.citedArgument.id,
          citationType: citation.citationType as CitationType,
          weight: 1,
        });
      }
    }

    // Add citations received from external
    if (includeExternalCitations) {
      for (const citation of arg.citationsReceived) {
        const isExternal = citation.citingArgument.deliberation.id !== deliberationId;

        if (isExternal) {
          const citing = citation.citingArgument;
          if (!nodes.has(citing.id)) {
            nodes.set(citing.id, {
              id: citing.id,
              type: "argument",
              label: `[${citing.deliberation.title}] ${citing.conclusion?.text?.slice(0, 50) || ""}`,
              author: citing.createdBy.name,
              citationCount: 0,
            });
          }

          edges.push({
            source: citing.id,
            target: arg.id,
            citationType: citation.citationType as CitationType,
            weight: 1,
          });
        }
      }
    }
  }

  return {
    nodes: Array.from(nodes.values()),
    edges: deduplicateEdges(edges),
  };
}

/**
 * Get most cited arguments across platform
 */
export async function getMostCitedArguments(limit: number = 20) {
  return prisma.argumentCitationMetrics.findMany({
    where: {
      totalCitations: { gt: 0 },
    },
    include: {
      argument: {
        include: {
          createdBy: { select: { id: true, name: true } },
          conclusion: { select: { text: true } },
          deliberation: { select: { id: true, title: true } },
          permalink: { select: { shortCode: true } },
        },
      },
    },
    orderBy: { totalCitations: "desc" },
    take: limit,
  });
}

/**
 * Find citation paths between two arguments
 */
export async function findCitationPath(
  fromArgumentId: string,
  toArgumentId: string,
  maxDepth: number = 5
): Promise<string[][] | null> {
  const paths: string[][] = [];
  const visited = new Set<string>();

  async function dfs(currentId: string, path: string[]): Promise<void> {
    if (currentId === toArgumentId) {
      paths.push([...path]);
      return;
    }

    if (path.length >= maxDepth || visited.has(currentId)) return;
    visited.add(currentId);

    const citations = await prisma.argumentCitation.findMany({
      where: { citingArgumentId: currentId },
      select: { citedArgumentId: true },
    });

    for (const citation of citations) {
      await dfs(citation.citedArgumentId, [...path, citation.citedArgumentId]);
    }

    visited.delete(currentId);
  }

  await dfs(fromArgumentId, [fromArgumentId]);

  return paths.length > 0 ? paths : null;
}

/**
 * Remove duplicate edges (keep highest weight)
 */
function deduplicateEdges(edges: CitationGraphEdge[]): CitationGraphEdge[] {
  const edgeMap = new Map<string, CitationGraphEdge>();

  for (const edge of edges) {
    const key = `${edge.source}->${edge.target}`;
    const existing = edgeMap.get(key);

    if (!existing || edge.weight > existing.weight) {
      edgeMap.set(key, edge);
    }
  }

  return Array.from(edgeMap.values());
}
```

---

### Step 3.2.6: API Routes

**File:** `app/api/arguments/[argumentId]/citations/route.ts`

```typescript
/**
 * GET/POST /api/arguments/:argumentId/citations
 * Manage citations for an argument
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getArgumentCitations,
  createCitation,
} from "@/lib/citations/citationService";

const CreateCitationSchema = z.object({
  citedArgumentId: z.string(),
  citationType: z.enum([
    "SUPPORT",
    "EXTEND",
    "CONTRAST",
    "REBUT",
    "QUALIFY",
    "APPLY",
    "SYNTHESIZE",
    "CRITIQUE",
  ]),
  context: z.string().max(1000).optional(),
  excerpt: z.string().max(500).optional(),
  citedInPremiseId: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { argumentId: string } }
) {
  try {
    const citations = await getArgumentCitations(params.argumentId);

    if (!citations) {
      return NextResponse.json(
        { error: "Argument not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(citations);
  } catch (error) {
    console.error("Get citations error:", error);
    return NextResponse.json(
      { error: "Failed to get citations" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { argumentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = CreateCitationSchema.parse(body);

    const citation = await createCitation(
      {
        citingArgumentId: params.argumentId,
        ...validatedData,
      },
      session.user.id
    );

    return NextResponse.json(citation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create citation error:", error);
    return NextResponse.json(
      { error: "Failed to create citation" },
      { status: 500 }
    );
  }
}
```

---

**File:** `app/api/arguments/[argumentId]/permalink/route.ts`

```typescript
/**
 * GET /api/arguments/:argumentId/permalink
 * Get or create permalink for an argument
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getOrCreatePermalink,
  generateCitationText,
} from "@/lib/citations/permalinkService";

export async function GET(
  req: NextRequest,
  { params }: { params: { argumentId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") as "apa" | "mla" | "chicago" | "bibtex" | null;

    const permalink = await getOrCreatePermalink(params.argumentId);

    // If citation format requested, include citation text
    if (format) {
      const citationText = await generateCitationText(params.argumentId, format);
      return NextResponse.json({
        ...permalink,
        citation: citationText,
      });
    }

    return NextResponse.json(permalink);
  } catch (error) {
    console.error("Get permalink error:", error);
    return NextResponse.json(
      { error: "Failed to get permalink" },
      { status: 500 }
    );
  }
}
```

---

**File:** `app/api/arguments/[argumentId]/citation-graph/route.ts`

```typescript
/**
 * GET /api/arguments/:argumentId/citation-graph
 * Get citation graph centered on an argument
 */

import { NextRequest, NextResponse } from "next/server";
import { buildArgumentCitationGraph } from "@/lib/citations/citationGraphService";

export async function GET(
  req: NextRequest,
  { params }: { params: { argumentId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const depth = parseInt(searchParams.get("depth") || "2", 10);
    const includeIndirect = searchParams.get("includeIndirect") !== "false";

    const graph = await buildArgumentCitationGraph(
      params.argumentId,
      Math.min(depth, 4), // Cap at 4 to prevent huge graphs
      includeIndirect
    );

    return NextResponse.json(graph);
  } catch (error) {
    console.error("Get citation graph error:", error);
    return NextResponse.json(
      { error: "Failed to get citation graph" },
      { status: 500 }
    );
  }
}
```

---

**File:** `app/api/a/[identifier]/route.ts`

```typescript
/**
 * GET /api/a/:identifier
 * Resolve a permalink and redirect to argument
 */

import { NextRequest, NextResponse } from "next/server";
import { resolvePermalink } from "@/lib/citations/permalinkService";

export async function GET(
  req: NextRequest,
  { params }: { params: { identifier: string } }
) {
  try {
    const result = await resolvePermalink(params.identifier);

    if (!result) {
      return NextResponse.json(
        { error: "Permalink not found" },
        { status: 404 }
      );
    }

    // Return argument info for API calls, or redirect for browser
    const accept = req.headers.get("accept") || "";
    if (accept.includes("application/json")) {
      return NextResponse.json(result);
    }

    // Redirect to argument page
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    return NextResponse.redirect(
      `${baseUrl}/arguments/${result.argumentId}`
    );
  } catch (error) {
    console.error("Resolve permalink error:", error);
    return NextResponse.json(
      { error: "Failed to resolve permalink" },
      { status: 500 }
    );
  }
}
```

---

**File:** `app/api/deliberations/[deliberationId]/citation-graph/route.ts`

```typescript
/**
 * GET /api/deliberations/:deliberationId/citation-graph
 * Get citation graph for entire deliberation
 */

import { NextRequest, NextResponse } from "next/server";
import { buildDeliberationCitationGraph } from "@/lib/citations/citationGraphService";

export async function GET(
  req: NextRequest,
  { params }: { params: { deliberationId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const includeExternal = searchParams.get("includeExternal") !== "false";

    const graph = await buildDeliberationCitationGraph(
      params.deliberationId,
      includeExternal
    );

    return NextResponse.json(graph);
  } catch (error) {
    console.error("Get deliberation citation graph error:", error);
    return NextResponse.json(
      { error: "Failed to get citation graph" },
      { status: 500 }
    );
  }
}
```

---

### Step 3.2.7: React Query Hooks

**File:** `lib/citations/hooks.ts`

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArgumentWithCitations,
  CitationGraph,
  CitationType,
  ArgumentPermalinkInfo,
} from "./types";

// Query keys
export const citationKeys = {
  all: ["citations"] as const,
  argument: (id: string) => [...citationKeys.all, "argument", id] as const,
  graph: (id: string) => [...citationKeys.all, "graph", id] as const,
  deliberationGraph: (id: string) => [...citationKeys.all, "deliberation-graph", id] as const,
  permalink: (id: string) => [...citationKeys.all, "permalink", id] as const,
};

// ===== Queries =====

export function useArgumentCitations(argumentId: string) {
  return useQuery({
    queryKey: citationKeys.argument(argumentId),
    queryFn: async (): Promise<ArgumentWithCitations> => {
      const res = await fetch(`/api/arguments/${argumentId}/citations`);
      if (!res.ok) throw new Error("Failed to fetch citations");
      return res.json();
    },
    enabled: !!argumentId,
  });
}

export function useArgumentCitationGraph(argumentId: string, depth = 2) {
  return useQuery({
    queryKey: [...citationKeys.graph(argumentId), depth],
    queryFn: async (): Promise<CitationGraph> => {
      const res = await fetch(
        `/api/arguments/${argumentId}/citation-graph?depth=${depth}`
      );
      if (!res.ok) throw new Error("Failed to fetch citation graph");
      return res.json();
    },
    enabled: !!argumentId,
  });
}

export function useDeliberationCitationGraph(
  deliberationId: string,
  includeExternal = true
) {
  return useQuery({
    queryKey: [...citationKeys.deliberationGraph(deliberationId), includeExternal],
    queryFn: async (): Promise<CitationGraph> => {
      const res = await fetch(
        `/api/deliberations/${deliberationId}/citation-graph?includeExternal=${includeExternal}`
      );
      if (!res.ok) throw new Error("Failed to fetch citation graph");
      return res.json();
    },
    enabled: !!deliberationId,
  });
}

export function usePermalink(argumentId: string) {
  return useQuery({
    queryKey: citationKeys.permalink(argumentId),
    queryFn: async (): Promise<ArgumentPermalinkInfo & { citation?: string }> => {
      const res = await fetch(`/api/arguments/${argumentId}/permalink`);
      if (!res.ok) throw new Error("Failed to fetch permalink");
      return res.json();
    },
    enabled: !!argumentId,
  });
}

// ===== Mutations =====

export function useCreateCitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      citingArgumentId,
      citedArgumentId,
      citationType,
      context,
      excerpt,
    }: {
      citingArgumentId: string;
      citedArgumentId: string;
      citationType: CitationType;
      context?: string;
      excerpt?: string;
    }) => {
      const res = await fetch(`/api/arguments/${citingArgumentId}/citations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          citedArgumentId,
          citationType,
          context,
          excerpt,
        }),
      });
      if (!res.ok) throw new Error("Failed to create citation");
      return res.json();
    },
    onSuccess: (_, { citingArgumentId, citedArgumentId }) => {
      queryClient.invalidateQueries({ queryKey: citationKeys.argument(citingArgumentId) });
      queryClient.invalidateQueries({ queryKey: citationKeys.argument(citedArgumentId) });
    },
  });
}

export function useDeleteCitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      citationId,
      argumentId,
    }: {
      citationId: string;
      argumentId: string;
    }) => {
      const res = await fetch(`/api/citations/${citationId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete citation");
    },
    onSuccess: (_, { argumentId }) => {
      queryClient.invalidateQueries({ queryKey: citationKeys.argument(argumentId) });
    },
  });
}
```

---

### Step 3.2.8: UI Components

**File:** `components/citations/CitationBadge.tsx`

```tsx
"use client";

import React from "react";
import { CitationType, CITATION_TYPE_LABELS } from "@/lib/citations/types";
import { Tooltip } from "@/components/ui/Tooltip";

interface CitationBadgeProps {
  type: CitationType;
  size?: "sm" | "md";
  showLabel?: boolean;
}

const colorClasses: Record<string, string> = {
  green: "bg-green-100 text-green-700 border-green-200",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
  red: "bg-red-100 text-red-700 border-red-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
  cyan: "bg-cyan-100 text-cyan-700 border-cyan-200",
  indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
};

export default function CitationBadge({
  type,
  size = "md",
  showLabel = true,
}: CitationBadgeProps) {
  const config = CITATION_TYPE_LABELS[type];
  const sizeClass = size === "sm" ? "text-xs px-1.5 py-0.5" : "text-sm px-2 py-1";

  return (
    <Tooltip content={config.description}>
      <span
        className={`inline-flex items-center rounded border font-medium ${colorClasses[config.color]} ${sizeClass}`}
      >
        {showLabel ? config.label : type.slice(0, 3)}
      </span>
    </Tooltip>
  );
}
```

---

**File:** `components/citations/CitationCard.tsx`

```tsx
"use client";

import React from "react";
import { ArgumentCitationSummary } from "@/lib/citations/types";
import CitationBadge from "./CitationBadge";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, User, MessageSquare } from "lucide-react";
import Link from "next/link";

interface CitationCardProps {
  citation: ArgumentCitationSummary;
  direction: "made" | "received";
  onArgumentClick?: (argumentId: string) => void;
}

export default function CitationCard({
  citation,
  direction,
  onArgumentClick,
}: CitationCardProps) {
  const targetArgument =
    direction === "made" ? citation.citedArgument : citation.citingArgument;

  return (
    <div className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Citation type and direction */}
          <div className="flex items-center gap-2 mb-2">
            <CitationBadge type={citation.citationType} size="sm" />
            <ArrowRight
              className={`w-4 h-4 text-gray-400 ${
                direction === "received" ? "rotate-180" : ""
              }`}
            />
            <span className="text-xs text-gray-500">
              {direction === "made" ? "cites" : "cited by"}
            </span>
          </div>

          {/* Target argument */}
          <button
            onClick={() => onArgumentClick?.(targetArgument.id)}
            className="text-left w-full"
          >
            <p className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-blue-600">
              {targetArgument.summary}
            </p>
          </button>

          {/* Context */}
          {citation.context && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-gray-600">
              <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
              <span className="italic line-clamp-2">{citation.context}</span>
            </div>
          )}

          {/* Meta info */}
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{targetArgument.author.name}</span>
            </div>
            <span>•</span>
            <Link
              href={`/deliberations/${targetArgument.deliberation.id}`}
              className="hover:underline truncate max-w-[150px]"
            >
              {targetArgument.deliberation.title}
            </Link>
            <span>•</span>
            <span>
              {formatDistanceToNow(new Date(citation.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

**File:** `components/citations/PermalinkCopyButton.tsx`

```tsx
"use client";

import React, { useState } from "react";
import { usePermalink } from "@/lib/citations/hooks";
import {
  Link,
  Check,
  Copy,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

interface PermalinkCopyButtonProps {
  argumentId: string;
  variant?: "button" | "icon";
}

export default function PermalinkCopyButton({
  argumentId,
  variant = "button",
}: PermalinkCopyButtonProps) {
  const { data: permalink, isLoading } = usePermalink(argumentId);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyUrl = () => {
    if (permalink) {
      copyToClipboard(permalink.url, "url");
    }
  };

  const handleCopyCitation = async (format: string) => {
    const res = await fetch(
      `/api/arguments/${argumentId}/permalink?format=${format}`
    );
    const data = await res.json();
    if (data.citation) {
      copyToClipboard(data.citation, format);
    }
  };

  if (isLoading) {
    return variant === "icon" ? (
      <div className="w-8 h-8 bg-gray-100 rounded animate-pulse" />
    ) : (
      <div className="h-9 w-24 bg-gray-100 rounded animate-pulse" />
    );
  }

  if (variant === "icon") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-2 rounded hover:bg-gray-100 transition">
            <Link className="w-4 h-4 text-gray-600" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleCopyUrl}>
            {copied === "url" ? (
              <Check className="w-4 h-4 mr-2 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            Copy link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCopyCitation("apa")}>
            {copied === "apa" ? (
              <Check className="w-4 h-4 mr-2 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            Copy APA citation
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCopyCitation("bibtex")}>
            {copied === "bibtex" ? (
              <Check className="w-4 h-4 mr-2 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            Copy BibTeX
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleCopyUrl}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-l transition"
      >
        {copied === "url" ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Link className="w-4 h-4" />
        )}
        <span>{permalink?.shortCode || "Get link"}</span>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="px-2 py-2 bg-gray-100 hover:bg-gray-200 rounded-r border-l border-gray-200 transition">
            <ChevronDown className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleCopyCitation("apa")}>
            Copy APA citation
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCopyCitation("mla")}>
            Copy MLA citation
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCopyCitation("chicago")}>
            Copy Chicago citation
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCopyCitation("bibtex")}>
            Copy BibTeX
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

---

**File:** `components/citations/CitationMetricsCard.tsx`

```tsx
"use client";

import React from "react";
import { CitationMetrics, CITATION_TYPE_LABELS, CitationType } from "@/lib/citations/types";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Quote,
  Users,
  BookOpen,
} from "lucide-react";

interface CitationMetricsCardProps {
  metrics: CitationMetrics;
  className?: string;
}

export default function CitationMetricsCard({
  metrics,
  className = "",
}: CitationMetricsCardProps) {
  const TrendIcon =
    metrics.recentTrend === "increasing"
      ? TrendingUp
      : metrics.recentTrend === "decreasing"
      ? TrendingDown
      : Minus;

  const trendColor =
    metrics.recentTrend === "increasing"
      ? "text-green-600"
      : metrics.recentTrend === "decreasing"
      ? "text-red-600"
      : "text-gray-500";

  // Get top citation types
  const topTypes = (Object.entries(metrics.byType) as [CitationType, number][])
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <h3 className="font-semibold text-gray-900 mb-3">Citation Impact</h3>

      {/* Main stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Quote className="w-4 h-4 text-gray-400" />
            <span className="text-2xl font-bold text-gray-900">
              {metrics.totalCitations}
            </span>
          </div>
          <span className="text-xs text-gray-500">Citations</span>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <span className="text-2xl font-bold text-gray-900">
              {metrics.citingDeliberations}
            </span>
          </div>
          <span className="text-xs text-gray-500">Deliberations</span>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-2xl font-bold text-gray-900">
              {metrics.citingUsers}
            </span>
          </div>
          <span className="text-xs text-gray-500">Scholars</span>
        </div>
      </div>

      {/* Trend */}
      <div className="flex items-center justify-between py-2 border-t border-gray-100">
        <span className="text-sm text-gray-600">Trend</span>
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon className="w-4 h-4" />
          <span className="text-sm font-medium capitalize">
            {metrics.recentTrend}
          </span>
        </div>
      </div>

      {/* Citation type breakdown */}
      {topTypes.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500 mb-2 block">
            Citation types
          </span>
          <div className="flex flex-wrap gap-2">
            {topTypes.map(([type, count]) => (
              <div
                key={type}
                className="flex items-center gap-1 text-xs bg-gray-50 px-2 py-1 rounded"
              >
                <span className="text-gray-600">
                  {CITATION_TYPE_LABELS[type].label}
                </span>
                <span className="font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Phase 3.2 Complete Checklist

| # | Task | File(s) | Part |
|---|------|---------|------|
| 1 | Citation schema | `prisma/schema.prisma` | 1 |
| 2 | Permalink schema | `prisma/schema.prisma` | 1 |
| 3 | Metrics schema | `prisma/schema.prisma` | 1 |
| 4 | Citation types | `lib/citations/types.ts` | 1 |
| 5 | Permalink service | `lib/citations/permalinkService.ts` | 1 |
| 6 | Citation service | `lib/citations/citationService.ts` | 1 |
| 7 | Citation graph service | `lib/citations/citationGraphService.ts` | 2 |
| 8 | Citations API | `app/api/arguments/[argumentId]/citations/route.ts` | 2 |
| 9 | Permalink API | `app/api/arguments/[argumentId]/permalink/route.ts` | 2 |
| 10 | Citation graph API | `app/api/arguments/[argumentId]/citation-graph/route.ts` | 2 |
| 11 | Permalink resolver | `app/api/a/[identifier]/route.ts` | 2 |
| 12 | Deliberation graph API | `app/api/deliberations/[deliberationId]/citation-graph/route.ts` | 2 |
| 13 | React Query hooks | `lib/citations/hooks.ts` | 2 |
| 14 | CitationBadge | `components/citations/CitationBadge.tsx` | 2 |
| 15 | CitationCard | `components/citations/CitationCard.tsx` | 2 |
| 16 | PermalinkCopyButton | `components/citations/PermalinkCopyButton.tsx` | 2 |
| 17 | CitationMetricsCard | `components/citations/CitationMetricsCard.tsx` | 2 |

---

## Next: Phase 3.3

Continue to **Phase 3.3: Cross-Deliberation Claim Mapping** for:
- Canonical claim registry
- Claim equivalence matching
- Cross-room search
- Argument transport with provenance

---

*End of Phase 3.2*
