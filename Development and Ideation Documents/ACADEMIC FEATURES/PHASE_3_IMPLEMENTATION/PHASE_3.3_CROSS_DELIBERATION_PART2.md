# Phase 3.3: Cross-Deliberation Claim Mapping — Part 2

**Sub-Phase:** 3.3 of 3.3 (Final)  
**Focus:** Argument Transport, APIs & UI Components

---

## Implementation Steps (Continued)

### Step 3.3.4: Argument Transport Service

**File:** `lib/crossDeliberation/argumentTransportService.ts`

```typescript
/**
 * Service for importing/transporting arguments between deliberations
 */

import { prisma } from "@/lib/prisma";
import {
  ArgumentImportInput,
  ArgumentImportResult,
  ImportType,
} from "./types";
import { linkClaimToCanonical } from "./canonicalRegistryService";

/**
 * Import an argument from another deliberation
 */
export async function importArgument(
  input: ArgumentImportInput,
  userId: string
): Promise<ArgumentImportResult> {
  const {
    sourceArgumentId,
    targetDeliberationId,
    importType,
    importReason,
    preserveAttribution = true,
    modifications,
  } = input;

  // Get source argument with full structure
  const sourceArgument = await prisma.argument.findUnique({
    where: { id: sourceArgumentId },
    include: {
      createdBy: { select: { id: true, name: true } },
      deliberation: { select: { id: true, title: true } },
      conclusion: true,
      premises: {
        include: {
          claim: true,
        },
      },
      scheme: true,
    },
  });

  if (!sourceArgument) {
    throw new Error("Source argument not found");
  }

  // Check target deliberation exists
  const targetDeliberation = await prisma.deliberation.findUnique({
    where: { id: targetDeliberationId },
  });

  if (!targetDeliberation) {
    throw new Error("Target deliberation not found");
  }

  // Prevent importing to same deliberation
  if (sourceArgument.deliberationId === targetDeliberationId) {
    throw new Error("Cannot import to the same deliberation");
  }

  const linkedClaims: string[] = [];

  const result = await prisma.$transaction(async (tx) => {
    // Create imported claims based on import type
    let importedConclusion: any;
    const importedPremises: any[] = [];

    if (importType === "REFERENCE") {
      // Just create a reference citation, no actual copy
      return {
        importedArgumentId: sourceArgumentId,
        sourceArgumentId,
        importRecord: {
          id: "reference",
          importType: "REFERENCE" as ImportType,
          wasModified: false,
        },
        linkedClaims: [],
      };
    }

    // Import conclusion (unless modified)
    if (modifications?.newConclusion) {
      importedConclusion = await tx.claim.create({
        data: {
          text: modifications.newConclusion,
          type: sourceArgument.conclusion?.type || "THESIS",
          deliberationId: targetDeliberationId,
          createdById: userId,
        },
      });
    } else if (sourceArgument.conclusion && importType !== "PREMISES_ONLY") {
      // Import existing conclusion
      importedConclusion = await tx.claim.create({
        data: {
          text: sourceArgument.conclusion.text,
          type: sourceArgument.conclusion.type,
          canonicalId: sourceArgument.conclusion.canonicalId,
          deliberationId: targetDeliberationId,
          createdById: userId,
          originalClaimId: sourceArgument.conclusion.id,
        },
      });

      // Link to canonical if exists
      if (sourceArgument.conclusion.canonicalId) {
        linkedClaims.push(importedConclusion.id);
        await linkClaimToCanonical(
          importedConclusion.id,
          sourceArgument.conclusion.canonicalId,
          "IMPORTED",
          userId
        );
      }
    }

    // Import premises (unless skeleton)
    if (importType !== "SKELETON") {
      const excludeIds = new Set(modifications?.excludePremises || []);

      for (const premise of sourceArgument.premises) {
        if (excludeIds.has(premise.claimId)) continue;

        const importedPremiseClaim = await tx.claim.create({
          data: {
            text: premise.claim.text,
            type: premise.claim.type,
            canonicalId: premise.claim.canonicalId,
            deliberationId: targetDeliberationId,
            createdById: userId,
            originalClaimId: premise.claimId,
          },
        });

        // Link to canonical if exists
        if (premise.claim.canonicalId) {
          linkedClaims.push(importedPremiseClaim.id);
          await linkClaimToCanonical(
            importedPremiseClaim.id,
            premise.claim.canonicalId,
            "IMPORTED",
            userId
          );
        }

        importedPremises.push({
          claimId: importedPremiseClaim.id,
          order: premise.order,
          role: premise.role,
        });
      }

      // Add new premises if specified
      if (modifications?.addPremises) {
        for (let i = 0; i < modifications.addPremises.length; i++) {
          const newPremiseClaim = await tx.claim.create({
            data: {
              text: modifications.addPremises[i],
              type: "EVIDENCE",
              deliberationId: targetDeliberationId,
              createdById: userId,
            },
          });

          importedPremises.push({
            claimId: newPremiseClaim.id,
            order: importedPremises.length + 1,
            role: "ADDED",
          });
        }
      }
    }

    // Create imported argument
    const importedArgument = await tx.argument.create({
      data: {
        deliberationId: targetDeliberationId,
        createdById: userId,
        conclusionId: importedConclusion?.id,
        schemeId: sourceArgument.schemeId,
        premises: {
          create: importedPremises.map((p) => ({
            claimId: p.claimId,
            order: p.order,
            role: p.role,
          })),
        },
      },
    });

    // Create import record
    const importRecord = await tx.argumentImport.create({
      data: {
        sourceArgumentId,
        sourceDeliberationId: sourceArgument.deliberationId,
        importedArgumentId: importedArgument.id,
        targetDeliberationId,
        importType,
        importReason,
        preserveAttribution,
        originalAuthorId: preserveAttribution ? sourceArgument.createdById : null,
        wasModified: !!(
          modifications?.newConclusion ||
          modifications?.excludePremises?.length ||
          modifications?.addPremises?.length
        ),
        modificationNotes: modifications
          ? JSON.stringify(modifications)
          : null,
        importedById: userId,
      },
    });

    return {
      importedArgumentId: importedArgument.id,
      sourceArgumentId,
      importRecord: {
        id: importRecord.id,
        importType: importRecord.importType as ImportType,
        wasModified: importRecord.wasModified,
      },
      linkedClaims,
    };
  });

  return result;
}

/**
 * Get import provenance for an argument
 */
export async function getArgumentImportProvenance(argumentId: string) {
  const importRecord = await prisma.argumentImport.findUnique({
    where: { importedArgumentId: argumentId },
    include: {
      importedBy: { select: { id: true, name: true } },
    },
  });

  if (!importRecord) return null;

  // Get source argument info
  const sourceArgument = await prisma.argument.findUnique({
    where: { id: importRecord.sourceArgumentId },
    include: {
      createdBy: { select: { id: true, name: true } },
      deliberation: { select: { id: true, title: true } },
      conclusion: { select: { text: true } },
    },
  });

  return {
    importRecord: {
      id: importRecord.id,
      importType: importRecord.importType,
      importReason: importRecord.importReason,
      preserveAttribution: importRecord.preserveAttribution,
      wasModified: importRecord.wasModified,
      modificationNotes: importRecord.modificationNotes,
      importedAt: importRecord.importedAt,
      importedBy: importRecord.importedBy,
    },
    sourceArgument: sourceArgument
      ? {
          id: sourceArgument.id,
          summary: sourceArgument.conclusion?.text || "Argument",
          author: sourceArgument.createdBy,
          deliberation: sourceArgument.deliberation,
        }
      : null,
  };
}

/**
 * Get all arguments imported to a deliberation
 */
export async function getDeliberationImports(deliberationId: string) {
  return prisma.argumentImport.findMany({
    where: { targetDeliberationId: deliberationId },
    include: {
      importedArgument: {
        include: {
          conclusion: { select: { text: true } },
        },
      },
      importedBy: { select: { id: true, name: true } },
    },
    orderBy: { importedAt: "desc" },
  });
}

/**
 * Get where an argument has been imported to
 */
export async function getArgumentExports(argumentId: string) {
  return prisma.argumentImport.findMany({
    where: { sourceArgumentId: argumentId },
    include: {
      importedArgument: {
        include: {
          conclusion: { select: { text: true } },
          deliberation: { select: { id: true, title: true } },
        },
      },
      importedBy: { select: { id: true, name: true } },
    },
    orderBy: { importedAt: "desc" },
  });
}
```

---

### Step 3.3.5: Cross-Room Search Service

**File:** `lib/crossDeliberation/crossRoomSearchService.ts`

```typescript
/**
 * Service for searching claims across deliberations
 */

import { prisma } from "@/lib/prisma";
import { CrossRoomSearchResult, GlobalClaimStatus } from "./types";

interface CrossRoomSearchParams {
  query: string;
  excludeDeliberationId?: string;
  fields?: string[];
  statuses?: GlobalClaimStatus[];
  minInstances?: number;
  limit?: number;
}

/**
 * Search for claims across all deliberations
 */
export async function searchClaimsAcrossRooms(
  params: CrossRoomSearchParams
): Promise<CrossRoomSearchResult[]> {
  const {
    query,
    excludeDeliberationId,
    fields,
    statuses,
    minInstances = 1,
    limit = 20,
  } = params;

  // Search canonical claims
  const where: any = {
    totalInstances: { gte: minInstances },
  };

  // Text search
  if (query) {
    where.OR = [
      { representativeText: { search: query.split(" ").join(" & ") } },
      { representativeText: { contains: query, mode: "insensitive" } },
    ];
  }

  // Field filter
  if (fields && fields.length > 0) {
    where.primaryField = { in: fields };
  }

  // Status filter
  if (statuses && statuses.length > 0) {
    where.globalStatus = { in: statuses };
  }

  const canonicals = await prisma.canonicalClaim.findMany({
    where,
    include: {
      instances: {
        where: excludeDeliberationId
          ? { deliberationId: { not: excludeDeliberationId } }
          : undefined,
        include: {
          claim: {
            select: {
              id: true,
              text: true,
              consensusStatus: true,
              challengeCount: true,
            },
          },
          deliberation: {
            select: {
              id: true,
              title: true,
              visibility: true,
            },
          },
        },
        take: 10,
      },
    },
    orderBy: [
      { totalInstances: "desc" },
      { lastActivityAt: "desc" },
    ],
    take: limit,
  });

  // Calculate match scores and format results
  return canonicals
    .filter((c) => c.instances.length > 0)
    .map((canonical) => {
      // Simple relevance scoring
      let matchScore = 0;
      let matchReason = "";

      const queryLower = query.toLowerCase();
      const textLower = canonical.representativeText.toLowerCase();

      if (textLower === queryLower) {
        matchScore = 1.0;
        matchReason = "Exact match";
      } else if (textLower.includes(queryLower)) {
        matchScore = 0.8;
        matchReason = "Contains query";
      } else {
        // Word overlap
        const queryWords = new Set(queryLower.split(/\s+/));
        const textWords = new Set(textLower.split(/\s+/));
        const overlap = [...queryWords].filter((w) => textWords.has(w)).length;
        matchScore = Math.min(0.7, overlap * 0.1 + 0.3);
        matchReason = `${overlap} word(s) in common`;
      }

      // Boost by instance count
      matchScore *= Math.min(1.5, 1 + canonical.totalInstances * 0.05);

      return {
        canonicalClaim: {
          id: canonical.id,
          canonicalId: canonical.canonicalId,
          representativeText: canonical.representativeText,
          globalStatus: canonical.globalStatus as GlobalClaimStatus,
          totalInstances: canonical.totalInstances,
          totalChallenges: canonical.totalChallenges,
          primaryField: canonical.primaryField || undefined,
          instances: canonical.instances.map((inst) => ({
            id: inst.id,
            claimId: inst.claim.id,
            claimText: inst.claim.text,
            deliberation: inst.deliberation,
            instanceType: inst.instanceType as any,
            localStatus: inst.claim.consensusStatus,
          })),
        },
        instances: canonical.instances.map((inst) => ({
          deliberation: inst.deliberation,
          claim: {
            id: inst.claim.id,
            text: inst.claim.text,
            status: inst.claim.consensusStatus,
          },
          challengeCount: inst.claim.challengeCount,
          supportCount: 0, // Would need to calculate
        })),
        matchScore,
        matchReason,
      } as CrossRoomSearchResult;
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Find deliberations discussing similar topics
 */
export async function findRelatedDeliberations(
  deliberationId: string,
  limit = 10
) {
  // Get canonical claims from this deliberation
  const instances = await prisma.claimInstance.findMany({
    where: { deliberationId },
    select: { canonicalClaimId: true },
    distinct: ["canonicalClaimId"],
  });

  const canonicalIds = instances.map((i) => i.canonicalClaimId);

  if (canonicalIds.length === 0) {
    return [];
  }

  // Find other deliberations with same canonical claims
  const relatedInstances = await prisma.claimInstance.findMany({
    where: {
      canonicalClaimId: { in: canonicalIds },
      deliberationId: { not: deliberationId },
    },
    include: {
      deliberation: {
        select: {
          id: true,
          title: true,
          description: true,
          visibility: true,
        },
      },
    },
  });

  // Group by deliberation and count shared claims
  const deliberationMap = new Map<
    string,
    { deliberation: any; sharedClaimCount: number }
  >();

  for (const inst of relatedInstances) {
    const existing = deliberationMap.get(inst.deliberationId);
    if (existing) {
      existing.sharedClaimCount++;
    } else {
      deliberationMap.set(inst.deliberationId, {
        deliberation: inst.deliberation,
        sharedClaimCount: 1,
      });
    }
  }

  return Array.from(deliberationMap.values())
    .sort((a, b) => b.sharedClaimCount - a.sharedClaimCount)
    .slice(0, limit);
}

/**
 * Get cross-room claim status overview
 */
export async function getClaimCrossRoomStatus(claimId: string) {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    select: { canonicalId: true },
  });

  if (!claim?.canonicalId) {
    return null;
  }

  const canonical = await prisma.canonicalClaim.findUnique({
    where: { canonicalId: claim.canonicalId },
    include: {
      instances: {
        include: {
          claim: {
            select: {
              id: true,
              text: true,
              consensusStatus: true,
              challengeCount: true,
            },
          },
          deliberation: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  if (!canonical) return null;

  // Aggregate status across instances
  const statusCounts: Record<string, number> = {};
  let totalChallenges = 0;

  for (const inst of canonical.instances) {
    const status = inst.claim.consensusStatus || "UNDETERMINED";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    totalChallenges += inst.claim.challengeCount;
  }

  return {
    canonicalId: canonical.canonicalId,
    globalStatus: canonical.globalStatus,
    totalInstances: canonical.instances.length,
    statusBreakdown: statusCounts,
    totalChallenges,
    instances: canonical.instances.map((inst) => ({
      deliberationId: inst.deliberation.id,
      deliberationTitle: inst.deliberation.title,
      claimId: inst.claim.id,
      localStatus: inst.claim.consensusStatus,
      challengeCount: inst.claim.challengeCount,
    })),
  };
}
```

---

### Step 3.3.6: API Routes

**File:** `app/api/canonical-claims/route.ts`

```typescript
/**
 * GET/POST /api/canonical-claims
 * Search and register canonical claims
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  searchCanonicalClaims,
  findOrCreateCanonicalClaim,
} from "@/lib/crossDeliberation/canonicalRegistryService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || undefined;
    const field = searchParams.get("field") || undefined;
    const globalStatus = searchParams.get("status") || undefined;
    const minInstances = parseInt(searchParams.get("minInstances") || "1", 10);

    const results = await searchCanonicalClaims({
      query,
      field,
      globalStatus: globalStatus as any,
      minInstances,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search canonical claims error:", error);
    return NextResponse.json(
      { error: "Failed to search claims" },
      { status: 500 }
    );
  }
}

const RegisterSchema = z.object({
  claimId: z.string(),
  field: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { claimId, field } = RegisterSchema.parse(body);

    const canonical = await findOrCreateCanonicalClaim(
      claimId,
      session.user.id,
      field
    );

    return NextResponse.json(canonical, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Register canonical claim error:", error);
    return NextResponse.json(
      { error: "Failed to register claim" },
      { status: 500 }
    );
  }
}
```

---

**File:** `app/api/cross-room-search/route.ts`

```typescript
/**
 * GET /api/cross-room-search
 * Search claims across all deliberations
 */

import { NextRequest, NextResponse } from "next/server";
import { searchClaimsAcrossRooms } from "@/lib/crossDeliberation/crossRoomSearchService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const excludeDeliberationId = searchParams.get("exclude") || undefined;
    const fields = searchParams.get("fields")?.split(",") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter required" },
        { status: 400 }
      );
    }

    const results = await searchClaimsAcrossRooms({
      query,
      excludeDeliberationId,
      fields,
      limit: Math.min(limit, 50),
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Cross-room search error:", error);
    return NextResponse.json(
      { error: "Failed to search" },
      { status: 500 }
    );
  }
}
```

---

**File:** `app/api/arguments/[argumentId]/import/route.ts`

```typescript
/**
 * POST /api/arguments/:argumentId/import
 * Import an argument to another deliberation
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { importArgument } from "@/lib/crossDeliberation/argumentTransportService";

const ImportSchema = z.object({
  targetDeliberationId: z.string(),
  importType: z.enum(["FULL", "PREMISES_ONLY", "SKELETON", "REFERENCE"]),
  importReason: z.string().max(500).optional(),
  preserveAttribution: z.boolean().default(true),
  modifications: z
    .object({
      newConclusion: z.string().optional(),
      excludePremises: z.array(z.string()).optional(),
      addPremises: z.array(z.string()).optional(),
    })
    .optional(),
});

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
    const validatedData = ImportSchema.parse(body);

    const result = await importArgument(
      {
        sourceArgumentId: params.argumentId,
        ...validatedData,
      },
      session.user.id
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Import argument error:", error);
    return NextResponse.json(
      { error: "Failed to import argument" },
      { status: 500 }
    );
  }
}
```

---

**File:** `app/api/deliberations/[deliberationId]/related/route.ts`

```typescript
/**
 * GET /api/deliberations/:deliberationId/related
 * Find related deliberations by shared claims
 */

import { NextRequest, NextResponse } from "next/server";
import { findRelatedDeliberations } from "@/lib/crossDeliberation/crossRoomSearchService";

export async function GET(
  req: NextRequest,
  { params }: { params: { deliberationId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const related = await findRelatedDeliberations(
      params.deliberationId,
      Math.min(limit, 20)
    );

    return NextResponse.json(related);
  } catch (error) {
    console.error("Find related deliberations error:", error);
    return NextResponse.json(
      { error: "Failed to find related deliberations" },
      { status: 500 }
    );
  }
}
```

---

### Step 3.3.7: React Query Hooks

**File:** `lib/crossDeliberation/hooks.ts`

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CanonicalClaimSummary,
  CrossRoomSearchResult,
  ArgumentImportResult,
  ImportType,
} from "./types";

// Query keys
export const crossDelibKeys = {
  all: ["cross-delib"] as const,
  canonical: (id: string) => [...crossDelibKeys.all, "canonical", id] as const,
  search: (query: string) => [...crossDelibKeys.all, "search", query] as const,
  related: (id: string) => [...crossDelibKeys.all, "related", id] as const,
  claimStatus: (id: string) => [...crossDelibKeys.all, "claim-status", id] as const,
};

// ===== Queries =====

export function useCrossRoomSearch(
  query: string,
  excludeDeliberationId?: string
) {
  return useQuery({
    queryKey: crossDelibKeys.search(query),
    queryFn: async (): Promise<CrossRoomSearchResult[]> => {
      const params = new URLSearchParams({ query });
      if (excludeDeliberationId) {
        params.set("exclude", excludeDeliberationId);
      }
      const res = await fetch(`/api/cross-room-search?${params}`);
      if (!res.ok) throw new Error("Failed to search");
      return res.json();
    },
    enabled: query.length >= 3,
  });
}

export function useCanonicalClaims(searchParams?: {
  query?: string;
  field?: string;
  minInstances?: number;
}) {
  const queryString = new URLSearchParams(
    Object.entries(searchParams || {})
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();

  return useQuery({
    queryKey: [...crossDelibKeys.all, "canonicals", queryString],
    queryFn: async (): Promise<CanonicalClaimSummary[]> => {
      const res = await fetch(`/api/canonical-claims?${queryString}`);
      if (!res.ok) throw new Error("Failed to fetch canonical claims");
      return res.json();
    },
  });
}

export function useRelatedDeliberations(deliberationId: string) {
  return useQuery({
    queryKey: crossDelibKeys.related(deliberationId),
    queryFn: async () => {
      const res = await fetch(`/api/deliberations/${deliberationId}/related`);
      if (!res.ok) throw new Error("Failed to fetch related deliberations");
      return res.json();
    },
    enabled: !!deliberationId,
  });
}

export function useClaimCrossRoomStatus(claimId: string) {
  return useQuery({
    queryKey: crossDelibKeys.claimStatus(claimId),
    queryFn: async () => {
      const res = await fetch(`/api/claims/${claimId}/cross-room-status`);
      if (!res.ok) throw new Error("Failed to fetch cross-room status");
      return res.json();
    },
    enabled: !!claimId,
  });
}

// ===== Mutations =====

export function useRegisterCanonicalClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      claimId,
      field,
    }: {
      claimId: string;
      field?: string;
    }): Promise<CanonicalClaimSummary> => {
      const res = await fetch("/api/canonical-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, field }),
      });
      if (!res.ok) throw new Error("Failed to register claim");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crossDelibKeys.all });
    },
  });
}

export function useImportArgument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sourceArgumentId,
      targetDeliberationId,
      importType,
      importReason,
      preserveAttribution,
      modifications,
    }: {
      sourceArgumentId: string;
      targetDeliberationId: string;
      importType: ImportType;
      importReason?: string;
      preserveAttribution?: boolean;
      modifications?: {
        newConclusion?: string;
        excludePremises?: string[];
        addPremises?: string[];
      };
    }): Promise<ArgumentImportResult> => {
      const res = await fetch(`/api/arguments/${sourceArgumentId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetDeliberationId,
          importType,
          importReason,
          preserveAttribution,
          modifications,
        }),
      });
      if (!res.ok) throw new Error("Failed to import argument");
      return res.json();
    },
    onSuccess: (_, { targetDeliberationId }) => {
      queryClient.invalidateQueries({
        queryKey: ["deliberation", targetDeliberationId],
      });
    },
  });
}
```

---

### Step 3.3.8: UI Components

**File:** `components/crossDeliberation/CrossRoomSearchPanel.tsx`

```tsx
"use client";

import React, { useState } from "react";
import { useCrossRoomSearch } from "@/lib/crossDeliberation/hooks";
import { CrossRoomSearchResult } from "@/lib/crossDeliberation/types";
import { Search, Globe, Users, AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";

interface CrossRoomSearchPanelProps {
  currentDeliberationId?: string;
  onSelectClaim?: (result: CrossRoomSearchResult) => void;
}

export default function CrossRoomSearchPanel({
  currentDeliberationId,
  onSelectClaim,
}: CrossRoomSearchPanelProps) {
  const [query, setQuery] = useState("");
  const { data: results, isLoading } = useCrossRoomSearch(
    query,
    currentDeliberationId
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Cross-Room Search</h3>
      </div>

      {/* Search input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search claims across all deliberations..."
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Results */}
      {isLoading && query.length >= 3 && (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded" />
          ))}
        </div>
      )}

      {!isLoading && results && results.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {results.map((result) => (
            <CrossRoomResultCard
              key={result.canonicalClaim.canonicalId}
              result={result}
              onSelect={() => onSelectClaim?.(result)}
            />
          ))}
        </div>
      )}

      {!isLoading && query.length >= 3 && results?.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No claims found across other deliberations</p>
        </div>
      )}

      {query.length > 0 && query.length < 3 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          Type at least 3 characters to search
        </div>
      )}
    </div>
  );
}

function CrossRoomResultCard({
  result,
  onSelect,
}: {
  result: CrossRoomSearchResult;
  onSelect: () => void;
}) {
  const statusColors: Record<string, string> = {
    ACCEPTED_BROADLY: "bg-green-100 text-green-700",
    ACCEPTED_LOCALLY: "bg-green-50 text-green-600",
    CONTESTED: "bg-amber-100 text-amber-700",
    REJECTED_BROADLY: "bg-red-100 text-red-700",
    UNDETERMINED: "bg-gray-100 text-gray-600",
    EMERGING: "bg-blue-100 text-blue-600",
  };

  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition"
    >
      {/* Claim text */}
      <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
        {result.canonicalClaim.representativeText}
      </p>

      {/* Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {result.canonicalClaim.totalInstances} deliberation(s)
          </span>
          {result.canonicalClaim.totalChallenges > 0 && (
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {result.canonicalClaim.totalChallenges} challenge(s)
            </span>
          )}
        </div>
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            statusColors[result.canonicalClaim.globalStatus]
          }`}
        >
          {result.canonicalClaim.globalStatus.replace("_", " ")}
        </span>
      </div>

      {/* Sample deliberations */}
      <div className="mt-2 flex flex-wrap gap-1">
        {result.instances.slice(0, 3).map((inst) => (
          <span
            key={inst.deliberation.id}
            className="text-xs px-2 py-0.5 bg-gray-100 rounded truncate max-w-[150px]"
          >
            {inst.deliberation.title}
          </span>
        ))}
        {result.instances.length > 3 && (
          <span className="text-xs text-gray-500">
            +{result.instances.length - 3} more
          </span>
        )}
      </div>
    </button>
  );
}
```

---

**File:** `components/crossDeliberation/ArgumentImportModal.tsx`

```tsx
"use client";

import React, { useState } from "react";
import { useImportArgument } from "@/lib/crossDeliberation/hooks";
import { ImportType } from "@/lib/crossDeliberation/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Download,
  FileText,
  Layers,
  Link,
  Check,
  AlertCircle,
} from "lucide-react";

interface ArgumentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceArgument: {
    id: string;
    summary: string;
    author: { name: string };
    deliberation: { id: string; title: string };
  };
  targetDeliberationId: string;
}

const importTypeOptions: Array<{
  type: ImportType;
  label: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    type: "FULL",
    label: "Full Import",
    description: "Import complete argument with all premises and conclusion",
    icon: Download,
  },
  {
    type: "PREMISES_ONLY",
    label: "Premises Only",
    description: "Import premises but write your own conclusion",
    icon: FileText,
  },
  {
    type: "SKELETON",
    label: "Structure Only",
    description: "Import argument structure without specific claims",
    icon: Layers,
  },
  {
    type: "REFERENCE",
    label: "Reference",
    description: "Just cite the argument without copying",
    icon: Link,
  },
];

export default function ArgumentImportModal({
  isOpen,
  onClose,
  sourceArgument,
  targetDeliberationId,
}: ArgumentImportModalProps) {
  const [importType, setImportType] = useState<ImportType>("FULL");
  const [preserveAttribution, setPreserveAttribution] = useState(true);
  const [importReason, setImportReason] = useState("");

  const importMutation = useImportArgument();

  const handleImport = async () => {
    try {
      await importMutation.mutateAsync({
        sourceArgumentId: sourceArgument.id,
        targetDeliberationId,
        importType,
        importReason: importReason || undefined,
        preserveAttribution,
      });
      onClose();
    } catch (error) {
      console.error("Import failed:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Import Argument
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Source argument info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900 line-clamp-2">
              {sourceArgument.summary}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              by {sourceArgument.author.name} in {sourceArgument.deliberation.title}
            </p>
          </div>

          {/* Import type selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Import Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {importTypeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = importType === option.type;

                return (
                  <button
                    key={option.type}
                    onClick={() => setImportType(option.type)}
                    className={`p-3 rounded-lg border text-left transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon
                        className={`w-4 h-4 ${
                          isSelected ? "text-blue-600" : "text-gray-500"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          isSelected ? "text-blue-900" : "text-gray-900"
                        }`}
                      >
                        {option.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Attribution toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <span className="text-sm font-medium text-gray-700">
                Preserve attribution
              </span>
              <p className="text-xs text-gray-500">
                Credit the original author
              </p>
            </div>
            <button
              onClick={() => setPreserveAttribution(!preserveAttribution)}
              className={`relative w-10 h-6 rounded-full transition ${
                preserveAttribution ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  preserveAttribution ? "left-5" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Import reason */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Reason for import (optional)
            </label>
            <textarea
              value={importReason}
              onChange={(e) => setImportReason(e.target.value)}
              placeholder="Why are you importing this argument?"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={importMutation.isPending}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
          >
            {importMutation.isPending ? (
              <>
                <span className="animate-spin">⏳</span>
                Importing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Import
              </>
            )}
          </button>
        </div>

        {importMutation.isError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4" />
            Failed to import argument. Please try again.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

---

## Phase 3.3 Complete Checklist

| # | Task | File(s) | Part |
|---|------|---------|------|
| 1 | Enhanced CanonicalClaim schema | `prisma/schema.prisma` | 1 |
| 2 | ClaimInstance schema | `prisma/schema.prisma` | 1 |
| 3 | ClaimEquivalence schema | `prisma/schema.prisma` | 1 |
| 4 | ArgumentImport schema | `prisma/schema.prisma` | 1 |
| 5 | Cross-deliberation types | `lib/crossDeliberation/types.ts` | 1 |
| 6 | Canonical registry service | `lib/crossDeliberation/canonicalRegistryService.ts` | 1 |
| 7 | Argument transport service | `lib/crossDeliberation/argumentTransportService.ts` | 2 |
| 8 | Cross-room search service | `lib/crossDeliberation/crossRoomSearchService.ts` | 2 |
| 9 | Canonical claims API | `app/api/canonical-claims/route.ts` | 2 |
| 10 | Cross-room search API | `app/api/cross-room-search/route.ts` | 2 |
| 11 | Import argument API | `app/api/arguments/[argumentId]/import/route.ts` | 2 |
| 12 | Related deliberations API | `app/api/deliberations/[deliberationId]/related/route.ts` | 2 |
| 13 | React Query hooks | `lib/crossDeliberation/hooks.ts` | 2 |
| 14 | CrossRoomSearchPanel | `components/crossDeliberation/CrossRoomSearchPanel.tsx` | 2 |
| 15 | ArgumentImportModal | `components/crossDeliberation/ArgumentImportModal.tsx` | 2 |

---

## Phase 3 Complete!

All three sub-phases of Phase 3 (Knowledge Graph) are now documented:

### Phase 3.1: Claim Provenance Tracking
- Version history for claims
- Attack/defense tracking (rebuttals, undercuts, undermines)
- Consensus status management
- Provenance timeline UI

### Phase 3.2: Argument-Level Citations
- Argument citation model with citation types
- Stable permalinks
- Citation metrics
- Citation graph visualization

### Phase 3.3: Cross-Deliberation Claim Mapping
- Canonical claim registry
- Cross-room search
- Argument transport with full provenance
- Related deliberation discovery

---

## Next: Phase 4

Continue to **Phase 4: Reputation & Review — Scholarly Infrastructure** for:
- Public peer review deliberations
- Argumentation-based reputation metrics
- Academic credit integration (ORCID)

---

*End of Phase 3*
