# Phase 1.2: Claim-Based Search & Discovery

**Sub-Phase:** 1.2 of 1.4  
**Timeline:** Weeks 3-4  
**Status:** Planning  
**Depends On:** Phase 1.1 (Paper-to-Claim Pipeline)  
**Enables:** All subsequent phases (core discovery layer)

---

## Objective

Enable researchers to find specific claims and arguments semantically, not just papers. Build the "argument graph navigation" experience through related arguments discovery.

---

## User Stories

| ID | Story | Priority | Effort |
|----|-------|----------|--------|
| US-1.2.1 | As a researcher, I want to search for claims by meaning, not just keywords | P0 | L |
| US-1.2.2 | As a researcher, I want to filter claims by type (thesis, empirical, etc.) | P1 | S |
| US-1.2.3 | As a researcher, I want to find claims that attack a specific claim | P0 | M |
| US-1.2.4 | As a researcher, I want to find claims that support a specific claim | P0 | M |
| US-1.2.5 | As a researcher, I want to see semantically similar claims to one I'm viewing | P0 | M |
| US-1.2.6 | As a researcher, I want to filter claims by author/source | P1 | S |
| US-1.2.7 | As a researcher, I want to see a "Related Arguments" panel on claim detail | P0 | M |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLAIM SEARCH ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   User Query                                                                │
│       │                                                                     │
│       ▼                                                                     │
│   ┌──────────────────┐                                                      │
│   │ Query Parser     │  Parse filters, extract semantic query               │
│   └────────┬─────────┘                                                      │
│            │                                                                │
│            ▼                                                                │
│   ┌──────────────────┐      ┌──────────────────┐                           │
│   │ Embedding Gen    │──────│ OpenAI           │                           │
│   └────────┬─────────┘      │ text-embedding-  │                           │
│            │                │ 3-small          │                           │
│            ▼                └──────────────────┘                           │
│   ┌──────────────────┐                                                      │
│   │ Pinecone Query   │  Vector similarity search                           │
│   └────────┬─────────┘                                                      │
│            │                                                                │
│            ▼                                                                │
│   ┌──────────────────┐      ┌──────────────────┐                           │
│   │ Postgres Filter  │──────│ Type, Author,    │                           │
│   │                  │      │ Source filters   │                           │
│   └────────┬─────────┘      └──────────────────┘                           │
│            │                                                                │
│            ▼                                                                │
│   ┌──────────────────┐                                                      │
│   │ Result Ranking   │  Combine vector + filter scores                     │
│   └────────┬─────────┘                                                      │
│            │                                                                │
│            ▼                                                                │
│   Search Results                                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1.2.1: Claim Embedding Service

**File:** `lib/search/claimEmbeddings.ts`

```typescript
/**
 * Claim embedding generation and management
 * Uses OpenAI text-embedding-3-small for cost-effective embeddings
 */

import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { prisma } from "@/lib/prisma";
import { Claim, ClaimType } from "@prisma/client";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;
const CLAIMS_INDEX_NAME = process.env.PINECONE_CLAIMS_INDEX || "mesh-claims";
const BATCH_SIZE = 100;

interface ClaimMetadata {
  claimId: string;
  text: string;
  claimType: string | null;
  sourceId: string | null;
  sourceTitle: string | null;
  authorOrcids: string[];
  createdAt: string;
  deliberationId: string | null;
  humanVerified: boolean;
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data.map((d) => d.embedding);
}

/**
 * Index a single claim in Pinecone
 */
export async function indexClaim(claim: Claim & { source?: any }): Promise<void> {
  const index = pinecone.index(CLAIMS_INDEX_NAME);

  const embedding = await generateEmbedding(claim.text);

  const metadata: ClaimMetadata = {
    claimId: claim.id,
    text: claim.text,
    claimType: claim.claimType,
    sourceId: claim.sourceId,
    sourceTitle: claim.source?.title || null,
    authorOrcids: claim.source?.authorOrcids || [],
    createdAt: claim.createdAt.toISOString(),
    deliberationId: null, // Will be set when claim is used in deliberation
    humanVerified: claim.humanVerified,
  };

  await index.upsert([
    {
      id: claim.id,
      values: embedding,
      metadata,
    },
  ]);
}

/**
 * Index multiple claims in Pinecone (batch)
 */
export async function indexClaimsBatch(
  claims: Array<Claim & { source?: any }>
): Promise<{ indexed: number; failed: number }> {
  const index = pinecone.index(CLAIMS_INDEX_NAME);

  let indexed = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < claims.length; i += BATCH_SIZE) {
    const batch = claims.slice(i, i + BATCH_SIZE);
    const texts = batch.map((c) => c.text);

    try {
      const embeddings = await generateEmbeddings(texts);

      const vectors = batch.map((claim, j) => ({
        id: claim.id,
        values: embeddings[j],
        metadata: {
          claimId: claim.id,
          text: claim.text,
          claimType: claim.claimType,
          sourceId: claim.sourceId,
          sourceTitle: claim.source?.title || null,
          authorOrcids: claim.source?.authorOrcids || [],
          createdAt: claim.createdAt.toISOString(),
          deliberationId: null,
          humanVerified: claim.humanVerified,
        } as ClaimMetadata,
      }));

      await index.upsert(vectors);
      indexed += batch.length;
    } catch (error) {
      console.error(`Failed to index batch ${i / BATCH_SIZE}:`, error);
      failed += batch.length;
    }
  }

  return { indexed, failed };
}

/**
 * Delete a claim from the index
 */
export async function deleteClaimFromIndex(claimId: string): Promise<void> {
  const index = pinecone.index(CLAIMS_INDEX_NAME);
  await index.deleteOne(claimId);
}

/**
 * Update claim metadata in the index (without re-embedding)
 */
export async function updateClaimMetadata(
  claimId: string,
  metadata: Partial<ClaimMetadata>
): Promise<void> {
  const index = pinecone.index(CLAIMS_INDEX_NAME);

  // Fetch current vector
  const result = await index.fetch([claimId]);
  const current = result.records[claimId];

  if (!current) {
    throw new Error(`Claim ${claimId} not found in index`);
  }

  // Update metadata
  await index.update({
    id: claimId,
    metadata: {
      ...current.metadata,
      ...metadata,
    },
  });
}

/**
 * Reindex all claims (admin operation)
 */
export async function reindexAllClaims(): Promise<{
  total: number;
  indexed: number;
  failed: number;
}> {
  const claims = await prisma.claim.findMany({
    include: {
      source: {
        select: {
          title: true,
          authorOrcids: true,
        },
      },
    },
  });

  const result = await indexClaimsBatch(claims);

  return {
    total: claims.length,
    ...result,
  };
}
```

---

### Step 1.2.2: Claim Search Service

**File:** `lib/search/claimSearch.ts`

```typescript
/**
 * Semantic search for claims
 * Combines Pinecone vector search with Postgres filtering
 */

import { Pinecone } from "@pinecone-database/pinecone";
import { prisma } from "@/lib/prisma";
import { ClaimType } from "@prisma/client";
import { generateEmbedding } from "./claimEmbeddings";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const CLAIMS_INDEX_NAME = process.env.PINECONE_CLAIMS_INDEX || "mesh-claims";

export interface ClaimSearchParams {
  query: string;
  types?: ClaimType[];
  sourceId?: string;
  authorOrcid?: string;
  deliberationId?: string;
  excludeClaimIds?: string[];
  humanVerifiedOnly?: boolean;
  limit?: number;
  minScore?: number;
}

export interface ClaimSearchResult {
  claimId: string;
  score: number;
  text: string;
  claimType: ClaimType | null;
  sourceId: string | null;
  sourceTitle: string | null;
}

export interface SearchResponse {
  results: ClaimSearchResult[];
  total: number;
  query: string;
  filters: Record<string, any>;
}

/**
 * Search claims semantically with optional filters
 */
export async function searchClaims(
  params: ClaimSearchParams
): Promise<SearchResponse> {
  const {
    query,
    types,
    sourceId,
    authorOrcid,
    deliberationId,
    excludeClaimIds = [],
    humanVerifiedOnly = false,
    limit = 20,
    minScore = 0.5,
  } = params;

  const index = pinecone.index(CLAIMS_INDEX_NAME);

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Build Pinecone filter
  const filter: Record<string, any> = {};

  if (types && types.length > 0) {
    filter.claimType = { $in: types };
  }

  if (sourceId) {
    filter.sourceId = sourceId;
  }

  if (authorOrcid) {
    filter.authorOrcids = { $in: [authorOrcid] };
  }

  if (deliberationId) {
    filter.deliberationId = deliberationId;
  }

  if (humanVerifiedOnly) {
    filter.humanVerified = true;
  }

  // Query Pinecone
  const queryResponse = await index.query({
    vector: queryEmbedding,
    topK: limit + excludeClaimIds.length, // Get extra to account for exclusions
    includeMetadata: true,
    filter: Object.keys(filter).length > 0 ? filter : undefined,
  });

  // Process results
  let results: ClaimSearchResult[] = queryResponse.matches
    .filter(
      (match) =>
        match.score &&
        match.score >= minScore &&
        !excludeClaimIds.includes(match.id)
    )
    .slice(0, limit)
    .map((match) => ({
      claimId: match.id,
      score: match.score || 0,
      text: (match.metadata?.text as string) || "",
      claimType: (match.metadata?.claimType as ClaimType) || null,
      sourceId: (match.metadata?.sourceId as string) || null,
      sourceTitle: (match.metadata?.sourceTitle as string) || null,
    }));

  return {
    results,
    total: results.length,
    query,
    filters: { types, sourceId, authorOrcid, deliberationId, humanVerifiedOnly },
  };
}

/**
 * Find claims similar to a given claim
 */
export async function findSimilarClaims(
  claimId: string,
  limit = 10,
  minScore = 0.7
): Promise<ClaimSearchResult[]> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
  });

  if (!claim) {
    throw new Error(`Claim ${claimId} not found`);
  }

  const response = await searchClaims({
    query: claim.text,
    excludeClaimIds: [claimId],
    limit,
    minScore,
  });

  return response.results;
}

/**
 * Find claims that attack or support a given claim
 */
export async function findRelatedClaims(claimId: string): Promise<{
  attacks: RelatedClaim[];
  supports: RelatedClaim[];
  similar: ClaimSearchResult[];
}> {
  // Get direct relationships from ClaimEdge
  const edges = await prisma.claimEdge.findMany({
    where: {
      OR: [{ sourceClaimId: claimId }, { targetClaimId: claimId }],
    },
    include: {
      sourceClaim: {
        include: {
          source: { select: { title: true } },
        },
      },
      targetClaim: {
        include: {
          source: { select: { title: true } },
        },
      },
    },
  });

  const attacks: RelatedClaim[] = [];
  const supports: RelatedClaim[] = [];

  for (const edge of edges) {
    const relatedClaim =
      edge.sourceClaimId === claimId ? edge.targetClaim : edge.sourceClaim;
    const direction =
      edge.sourceClaimId === claimId ? "outgoing" : "incoming";

    const related: RelatedClaim = {
      claimId: relatedClaim.id,
      text: relatedClaim.text,
      claimType: relatedClaim.claimType,
      sourceTitle: relatedClaim.source?.title || null,
      edgeType: edge.type,
      direction,
    };

    if (edge.type === "ATTACK" || edge.type === "REBUT" || edge.type === "UNDERCUT") {
      attacks.push(related);
    } else if (edge.type === "SUPPORT" || edge.type === "ENTAIL") {
      supports.push(related);
    }
  }

  // Get semantically similar claims
  const similar = await findSimilarClaims(claimId, 5, 0.75);

  return { attacks, supports, similar };
}

interface RelatedClaim {
  claimId: string;
  text: string;
  claimType: ClaimType | null;
  sourceTitle: string | null;
  edgeType: string;
  direction: "incoming" | "outgoing";
}

/**
 * Get claims that challenge a specific claim (for "What challenges this?" feature)
 */
export async function getChallenges(claimId: string): Promise<{
  rebuttals: RelatedClaim[];
  undercuts: RelatedClaim[];
  undermines: RelatedClaim[];
}> {
  const edges = await prisma.claimEdge.findMany({
    where: {
      targetClaimId: claimId,
      type: { in: ["REBUT", "UNDERCUT", "UNDERMINE", "ATTACK"] },
    },
    include: {
      sourceClaim: {
        include: {
          source: { select: { title: true } },
          createdBy: { select: { name: true } },
        },
      },
    },
  });

  const rebuttals: RelatedClaim[] = [];
  const undercuts: RelatedClaim[] = [];
  const undermines: RelatedClaim[] = [];

  for (const edge of edges) {
    const related: RelatedClaim = {
      claimId: edge.sourceClaim.id,
      text: edge.sourceClaim.text,
      claimType: edge.sourceClaim.claimType,
      sourceTitle: edge.sourceClaim.source?.title || null,
      edgeType: edge.type,
      direction: "incoming",
    };

    switch (edge.type) {
      case "REBUT":
        rebuttals.push(related);
        break;
      case "UNDERCUT":
        undercuts.push(related);
        break;
      case "UNDERMINE":
        undermines.push(related);
        break;
      case "ATTACK":
        // Generic attack - classify as rebuttal
        rebuttals.push(related);
        break;
    }
  }

  return { rebuttals, undercuts, undermines };
}
```

---

### Step 1.2.3: Claim Search API

**File:** `app/api/search/claims/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchClaims, ClaimSearchParams } from "@/lib/search/claimSearch";
import { ClaimType } from "@prisma/client";
import { z } from "zod";

const SearchQuerySchema = z.object({
  q: z.string().min(2).max(500),
  types: z
    .string()
    .optional()
    .transform((val) =>
      val ? (val.split(",") as ClaimType[]) : undefined
    ),
  sourceId: z.string().optional(),
  authorOrcid: z.string().optional(),
  deliberationId: z.string().optional(),
  humanVerifiedOnly: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 20)),
  minScore: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : 0.5)),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const params = SearchQuerySchema.parse({
      q: searchParams.get("q"),
      types: searchParams.get("types"),
      sourceId: searchParams.get("sourceId"),
      authorOrcid: searchParams.get("authorOrcid"),
      deliberationId: searchParams.get("deliberationId"),
      humanVerifiedOnly: searchParams.get("humanVerifiedOnly"),
      limit: searchParams.get("limit"),
      minScore: searchParams.get("minScore"),
    });

    const searchParams2: ClaimSearchParams = {
      query: params.q,
      types: params.types,
      sourceId: params.sourceId,
      authorOrcid: params.authorOrcid,
      deliberationId: params.deliberationId,
      humanVerifiedOnly: params.humanVerifiedOnly,
      limit: params.limit,
      minScore: params.minScore,
    };

    const response = await searchClaims(searchParams2);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Claim search error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

### Step 1.2.4: Related Claims API

**File:** `app/api/claims/[id]/related/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  findRelatedClaims,
  findSimilarClaims,
  getChallenges,
} from "@/lib/search/claimSearch";

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: claimId } = context.params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "all" | "challenges" | "similar"

  try {
    if (type === "challenges") {
      const challenges = await getChallenges(claimId);
      return NextResponse.json({ claimId, challenges });
    }

    if (type === "similar") {
      const limit = parseInt(searchParams.get("limit") || "10");
      const minScore = parseFloat(searchParams.get("minScore") || "0.7");
      const similar = await findSimilarClaims(claimId, limit, minScore);
      return NextResponse.json({ claimId, similar });
    }

    // Default: return all related
    const related = await findRelatedClaims(claimId);
    return NextResponse.json({ claimId, ...related });
  } catch (error) {
    console.error("Related claims error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

### Step 1.2.5: Claim Indexing Hooks

**File:** `lib/hooks/claimIndexing.ts`

```typescript
/**
 * Hooks for automatic claim indexing on create/update/delete
 */

import { prisma } from "@/lib/prisma";
import {
  indexClaim,
  deleteClaimFromIndex,
  updateClaimMetadata,
} from "@/lib/search/claimEmbeddings";

// Extension to Prisma client for automatic indexing
// Add this to your Prisma middleware or use in API routes

export async function onClaimCreated(claimId: string): Promise<void> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      source: {
        select: {
          title: true,
          authorOrcids: true,
        },
      },
    },
  });

  if (claim) {
    try {
      await indexClaim(claim);
      console.log(`Indexed claim ${claimId}`);
    } catch (error) {
      console.error(`Failed to index claim ${claimId}:`, error);
      // Don't throw - indexing failure shouldn't block claim creation
    }
  }
}

export async function onClaimUpdated(claimId: string): Promise<void> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      source: {
        select: {
          title: true,
          authorOrcids: true,
        },
      },
    },
  });

  if (claim) {
    try {
      // Re-index with new text/metadata
      await indexClaim(claim);
      console.log(`Re-indexed claim ${claimId}`);
    } catch (error) {
      console.error(`Failed to re-index claim ${claimId}:`, error);
    }
  }
}

export async function onClaimDeleted(claimId: string): Promise<void> {
  try {
    await deleteClaimFromIndex(claimId);
    console.log(`Removed claim ${claimId} from index`);
  } catch (error) {
    console.error(`Failed to remove claim ${claimId} from index:`, error);
  }
}

export async function onClaimVerified(claimId: string): Promise<void> {
  try {
    await updateClaimMetadata(claimId, { humanVerified: true });
    console.log(`Updated verification status for claim ${claimId}`);
  } catch (error) {
    console.error(`Failed to update claim ${claimId} metadata:`, error);
  }
}
```

---

## UI Components

### Step 1.2.6: Claim Search Component

**File:** `components/search/ClaimSearch.tsx`

```typescript
"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { ClaimType } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  Filter,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { ClaimTypeBadge, CLAIM_TYPE_INFO } from "@/components/claims/ClaimTypeSelector";
import { cn } from "@/lib/utils";

interface ClaimSearchProps {
  onClaimSelect?: (claimId: string) => void;
  excludeClaimIds?: string[];
  initialFilters?: {
    types?: ClaimType[];
    sourceId?: string;
    humanVerifiedOnly?: boolean;
  };
}

interface SearchResult {
  claimId: string;
  score: number;
  text: string;
  claimType: ClaimType | null;
  sourceId: string | null;
  sourceTitle: string | null;
}

export function ClaimSearch({
  onClaimSelect,
  excludeClaimIds = [],
  initialFilters = {},
}: ClaimSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<ClaimType[]>(
    initialFilters.types || []
  );
  const [humanVerifiedOnly, setHumanVerifiedOnly] = useState(
    initialFilters.humanVerifiedOnly || false
  );
  const [showFilters, setShowFilters] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "claim-search",
      debouncedQuery,
      selectedTypes,
      humanVerifiedOnly,
      initialFilters.sourceId,
    ],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return null;

      const params = new URLSearchParams({
        q: debouncedQuery,
        limit: "20",
      });

      if (selectedTypes.length > 0) {
        params.set("types", selectedTypes.join(","));
      }
      if (humanVerifiedOnly) {
        params.set("humanVerifiedOnly", "true");
      }
      if (initialFilters.sourceId) {
        params.set("sourceId", initialFilters.sourceId);
      }

      const response = await fetch(`/api/search/claims?${params}`);
      if (!response.ok) throw new Error("Search failed");
      return response.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  const results: SearchResult[] = data?.results || [];
  const filteredResults = results.filter(
    (r) => !excludeClaimIds.includes(r.claimId)
  );

  const handleTypeToggle = (type: ClaimType) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setHumanVerifiedOnly(false);
  };

  const hasActiveFilters = selectedTypes.length > 0 || humanVerifiedOnly;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search claims by meaning..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => setQuery("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filters */}
      <Collapsible open={showFilters} onOpenChange={setShowFilters}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1">
                  {selectedTypes.length + (humanVerifiedOnly ? 1 : 0)}
                </Badge>
              )}
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  showFilters && "rotate-180"
                )}
              />
            </Button>
          </CollapsibleTrigger>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>

        <CollapsibleContent className="pt-4">
          <Card>
            <CardContent className="pt-4 space-y-4">
              {/* Claim Type Filters */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Claim Types</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(CLAIM_TYPE_INFO).map(([type, info]) => (
                    <Badge
                      key={type}
                      variant={
                        selectedTypes.includes(type as ClaimType)
                          ? "default"
                          : "outline"
                      }
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedTypes.includes(type as ClaimType) &&
                          info.color
                      )}
                      onClick={() => handleTypeToggle(type as ClaimType)}
                    >
                      {info.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Verified Only */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="verified-only"
                  checked={humanVerifiedOnly}
                  onCheckedChange={(checked) =>
                    setHumanVerifiedOnly(checked as boolean)
                  }
                />
                <Label htmlFor="verified-only" className="text-sm">
                  Human-verified claims only
                </Label>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Results */}
      {isLoading && debouncedQuery.length >= 2 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-red-600 text-sm">Search failed. Please try again.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && debouncedQuery.length >= 2 && filteredResults.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-medium">No claims found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      )}

      {filteredResults.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {filteredResults.length} result{filteredResults.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {filteredResults.map((result) => (
              <SearchResultCard
                key={result.claimId}
                result={result}
                onClick={() => onClaimSelect?.(result.claimId)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Search Result Card
interface SearchResultCardProps {
  result: SearchResult;
  onClick?: () => void;
}

function SearchResultCard({ result, onClick }: SearchResultCardProps) {
  const scorePercentage = Math.round(result.score * 100);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="pt-4">
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">{result.text}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {result.claimType && <ClaimTypeBadge type={result.claimType} />}
              {result.sourceTitle && (
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {result.sourceTitle}
                </span>
              )}
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                scorePercentage >= 80
                  ? "border-green-500 text-green-600"
                  : scorePercentage >= 60
                  ? "border-yellow-500 text-yellow-600"
                  : "border-gray-300"
              )}
            >
              {scorePercentage}% match
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Step 1.2.7: Related Arguments Panel

**File:** `components/claims/RelatedArgumentsPanel.tsx`

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Loader2,
  Swords,
  Target,
  ThumbsUp,
} from "lucide-react";
import { ClaimTypeBadge } from "./ClaimTypeSelector";
import { cn } from "@/lib/utils";

interface RelatedArgumentsPanelProps {
  claimId: string;
  onClaimNavigate?: (claimId: string) => void;
}

interface RelatedClaim {
  claimId: string;
  text: string;
  claimType: string | null;
  sourceTitle: string | null;
  edgeType: string;
  direction: "incoming" | "outgoing";
}

interface SimilarClaim {
  claimId: string;
  score: number;
  text: string;
  claimType: string | null;
  sourceTitle: string | null;
}

export function RelatedArgumentsPanel({
  claimId,
  onClaimNavigate,
}: RelatedArgumentsPanelProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["related-claims", claimId],
    queryFn: async () => {
      const response = await fetch(`/api/claims/${claimId}/related`);
      if (!response.ok) throw new Error("Failed to fetch related claims");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600 text-sm">Failed to load related claims</p>
        </CardContent>
      </Card>
    );
  }

  const attacks: RelatedClaim[] = data?.attacks || [];
  const supports: RelatedClaim[] = data?.supports || [];
  const similar: SimilarClaim[] = data?.similar || [];

  const totalRelated = attacks.length + supports.length + similar.length;

  if (totalRelated === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Related Arguments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No related claims found yet. Be the first to engage with this claim!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4" />
          Related Arguments
          <Badge variant="secondary">{totalRelated}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="challenges">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="challenges" className="gap-1">
              <Swords className="h-3 w-3" />
              Challenges ({attacks.length})
            </TabsTrigger>
            <TabsTrigger value="supports" className="gap-1">
              <ThumbsUp className="h-3 w-3" />
              Supports ({supports.length})
            </TabsTrigger>
            <TabsTrigger value="similar" className="gap-1">
              <Target className="h-3 w-3" />
              Similar ({similar.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="challenges" className="mt-4 space-y-3">
            {attacks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No challenges yet
              </p>
            ) : (
              attacks.map((claim) => (
                <RelatedClaimCard
                  key={claim.claimId}
                  claim={claim}
                  variant="attack"
                  onNavigate={() => onClaimNavigate?.(claim.claimId)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="supports" className="mt-4 space-y-3">
            {supports.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No supporting arguments yet
              </p>
            ) : (
              supports.map((claim) => (
                <RelatedClaimCard
                  key={claim.claimId}
                  claim={claim}
                  variant="support"
                  onNavigate={() => onClaimNavigate?.(claim.claimId)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="similar" className="mt-4 space-y-3">
            {similar.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No similar claims found
              </p>
            ) : (
              similar.map((claim) => (
                <SimilarClaimCard
                  key={claim.claimId}
                  claim={claim}
                  onNavigate={() => onClaimNavigate?.(claim.claimId)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Related Claim Card (for attacks/supports)
interface RelatedClaimCardProps {
  claim: RelatedClaim;
  variant: "attack" | "support";
  onNavigate?: () => void;
}

function RelatedClaimCard({ claim, variant, onNavigate }: RelatedClaimCardProps) {
  const isAttack = variant === "attack";
  const isIncoming = claim.direction === "incoming";

  return (
    <div
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-colors",
        isAttack
          ? "border-red-200 bg-red-50/50 hover:bg-red-50"
          : "border-green-200 bg-green-50/50 hover:bg-green-50"
      )}
      onClick={onNavigate}
    >
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "mt-0.5 p-1 rounded",
            isAttack ? "bg-red-100" : "bg-green-100"
          )}
        >
          {isIncoming ? (
            <ArrowDown
              className={cn(
                "h-3 w-3",
                isAttack ? "text-red-600" : "text-green-600"
              )}
            />
          ) : (
            <ArrowUp
              className={cn(
                "h-3 w-3",
                isAttack ? "text-red-600" : "text-green-600"
              )}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed">{claim.text}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                isAttack
                  ? "border-red-300 text-red-700"
                  : "border-green-300 text-green-700"
              )}
            >
              {claim.edgeType}
            </Badge>
            {claim.claimType && (
              <ClaimTypeBadge type={claim.claimType as any} />
            )}
          </div>
          {claim.sourceTitle && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {claim.sourceTitle}
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// Similar Claim Card
interface SimilarClaimCardProps {
  claim: SimilarClaim;
  onNavigate?: () => void;
}

function SimilarClaimCard({ claim, onNavigate }: SimilarClaimCardProps) {
  const scorePercentage = Math.round(claim.score * 100);

  return (
    <div
      className="p-3 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-50 cursor-pointer transition-colors"
      onClick={onNavigate}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed">{claim.text}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
              {scorePercentage}% similar
            </Badge>
            {claim.claimType && (
              <ClaimTypeBadge type={claim.claimType as any} />
            )}
          </div>
          {claim.sourceTitle && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {claim.sourceTitle}
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
```

---

## Admin: Reindex Command

### Step 1.2.8: Admin Reindex API

**File:** `app/api/admin/reindex-claims/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { reindexAllClaims } from "@/lib/search/claimEmbeddings";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Admin check - adjust based on your admin role system
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // You might want to add admin role check here
  // if (!session.user.isAdmin) { ... }

  try {
    const result = await reindexAllClaims();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Reindex error:", error);
    return NextResponse.json(
      { error: "Reindex failed" },
      { status: 500 }
    );
  }
}
```

---

## Testing

### Step 1.2.9: Search Tests

**File:** `__tests__/lib/search/claimSearch.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchClaims, findSimilarClaims } from "@/lib/search/claimSearch";

// Mock dependencies
vi.mock("@/lib/search/claimEmbeddings", () => ({
  generateEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
}));

vi.mock("@pinecone-database/pinecone", () => ({
  Pinecone: vi.fn().mockImplementation(() => ({
    index: vi.fn().mockReturnValue({
      query: vi.fn().mockResolvedValue({
        matches: [
          {
            id: "claim-1",
            score: 0.95,
            metadata: {
              text: "Test claim 1",
              claimType: "THESIS",
              sourceId: "source-1",
              sourceTitle: "Test Paper",
            },
          },
          {
            id: "claim-2",
            score: 0.85,
            metadata: {
              text: "Test claim 2",
              claimType: "EMPIRICAL",
              sourceId: "source-2",
              sourceTitle: "Another Paper",
            },
          },
        ],
      }),
    }),
  })),
}));

describe("Claim Search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return search results", async () => {
    const response = await searchClaims({
      query: "test query",
      limit: 10,
    });

    expect(response.results).toHaveLength(2);
    expect(response.results[0].score).toBe(0.95);
    expect(response.query).toBe("test query");
  });

  it("should filter results below minScore", async () => {
    const response = await searchClaims({
      query: "test query",
      minScore: 0.9,
    });

    expect(response.results).toHaveLength(1);
    expect(response.results[0].claimId).toBe("claim-1");
  });

  it("should exclude specified claim IDs", async () => {
    const response = await searchClaims({
      query: "test query",
      excludeClaimIds: ["claim-1"],
    });

    expect(response.results).toHaveLength(1);
    expect(response.results[0].claimId).toBe("claim-2");
  });
});
```

---

## Phase 1.2 Summary Checklist

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Claim embedding service | `lib/search/claimEmbeddings.ts` | 📋 Defined |
| 2 | Claim search service | `lib/search/claimSearch.ts` | 📋 Defined |
| 3 | Claim search API | `app/api/search/claims/route.ts` | 📋 Defined |
| 4 | Related claims API | `app/api/claims/[id]/related/route.ts` | 📋 Defined |
| 5 | Claim indexing hooks | `lib/hooks/claimIndexing.ts` | 📋 Defined |
| 6 | ClaimSearch component | `components/search/ClaimSearch.tsx` | 📋 Defined |
| 7 | RelatedArgumentsPanel | `components/claims/RelatedArgumentsPanel.tsx` | 📋 Defined |
| 8 | Admin reindex API | `app/api/admin/reindex-claims/route.ts` | 📋 Defined |
| 9 | Search tests | `__tests__/lib/search/claimSearch.test.ts` | 📋 Defined |

---

## Environment Variables Required

```env
# Add to .env
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_CLAIMS_INDEX=mesh-claims
OPENAI_API_KEY=your-openai-api-key
```

## Pinecone Index Setup

```bash
# Create index via Pinecone console or CLI
pinecone create-index mesh-claims \
  --dimension 1536 \
  --metric cosine \
  --spec serverless \
  --cloud aws \
  --region us-east-1
```

---

## Next Steps

After completing Phase 1.2:
1. Create Pinecone index
2. Run initial claim indexing
3. Test search with sample queries
4. Proceed to [Phase 1.3: Academic Deliberation Templates](./PHASE_1.3_DELIBERATION_TEMPLATES.md)

---

*End of Phase 1.2 Implementation Guide*
