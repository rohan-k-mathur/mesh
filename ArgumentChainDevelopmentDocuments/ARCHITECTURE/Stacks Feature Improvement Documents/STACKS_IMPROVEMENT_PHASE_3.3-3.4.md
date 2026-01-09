
# Phase 3.3: Cross-Platform Intelligence

**Goal**: Leverage Mesh's unique position as the only platform tracking how sources are used across multiple deliberations, arguments, and contexts. Surface insights that no single-source tool can provide.

**Timeline**: Weeks 7-10

---

## 3.3.1 Cross-Deliberation Citation Tracking

**Priority**: P1 — Core differentiator  
**Estimated Effort**: 4-5 days  
**Risk Level**: Medium (requires denormalized aggregation)

### Problem Statement

When a source is cited in multiple deliberations:
- Users can't see where else it's being discussed
- There's no way to find related conversations using similar evidence
- Researchers miss opportunities to connect with others studying the same sources

**Goal**: Show users everywhere a source is being cited across the platform, enabling discovery of related deliberations and cross-pollination of ideas.

### Schema Additions

```prisma
model SourceUsage {
  id              String   @id @default(cuid())
  sourceId        String
  
  // Aggregated counts (denormalized for performance)
  totalCitations      Int      @default(0)
  deliberationCount   Int      @default(0)
  argumentCount       Int      @default(0)
  stackCount          Int      @default(0)
  
  // Intent breakdown
  supportCount        Int      @default(0)
  refuteCount         Int      @default(0)
  contextCount        Int      @default(0)
  
  // Unique users who have cited this source
  uniqueCiters        Int      @default(0)
  
  // Trending metrics
  citationsLast7Days  Int      @default(0)
  citationsLast30Days Int      @default(0)
  trendScore          Float    @default(0)
  
  // First and most recent usage
  firstCitedAt        DateTime?
  lastCitedAt         DateTime?
  
  updatedAt           DateTime @updatedAt
  
  source              Source   @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  
  @@unique([sourceId])
  @@index([trendScore])
  @@index([totalCitations])
}

model SourceCitationContext {
  id              String   @id @default(cuid())
  sourceId        String
  
  // Where it's cited
  deliberationId  String?
  argumentId      String?
  stackId         String?
  
  // Citation details
  citationId      String   @unique
  intent          CitationIntent
  quote           String?
  
  // Visibility (for filtering public contexts)
  isPublic        Boolean  @default(false)
  
  createdAt       DateTime @default(now())
  
  source          Source       @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  deliberation    Deliberation? @relation(fields: [deliberationId], references: [id], onDelete: Cascade)
  citation        Citation     @relation(fields: [citationId], references: [id], onDelete: Cascade)
  
  @@index([sourceId, isPublic])
  @@index([deliberationId])
}
```

### Usage Aggregation Worker

```typescript
// workers/sourceUsageAggregator.ts

import { prisma } from "@/lib/prismaclient";
import { Job } from "bullmq";

interface AggregationJob {
  sourceId: string;
  triggeredBy: "citation_created" | "citation_deleted" | "scheduled";
}

export async function processSourceUsageAggregation(job: Job<AggregationJob>) {
  const { sourceId, triggeredBy } = job.data;

  console.log(`[SourceUsage] Aggregating usage for source ${sourceId} (${triggeredBy})`);

  // Get all citations for this source
  const citations = await prisma.citation.findMany({
    where: { sourceId },
    include: {
      // Get parent context visibility
    },
  });

  // Calculate aggregates
  const deliberationIds = new Set<string>();
  const argumentIds = new Set<string>();
  const stackIds = new Set<string>();
  const userIds = new Set<string>();

  let supportCount = 0;
  let refuteCount = 0;
  let contextCount = 0;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let citationsLast7Days = 0;
  let citationsLast30Days = 0;
  let firstCitedAt: Date | null = null;
  let lastCitedAt: Date | null = null;

  for (const citation of citations) {
    // Track unique contexts
    if (citation.deliberationId) deliberationIds.add(citation.deliberationId);
    if (citation.argumentId) argumentIds.add(citation.argumentId);
    if (citation.stackId) stackIds.add(citation.stackId);
    if (citation.createdBy) userIds.add(citation.createdBy);

    // Count by intent
    switch (citation.intent) {
      case "supports":
        supportCount++;
        break;
      case "refutes":
        refuteCount++;
        break;
      default:
        contextCount++;
    }

    // Time-based counts
    if (citation.createdAt >= sevenDaysAgo) citationsLast7Days++;
    if (citation.createdAt >= thirtyDaysAgo) citationsLast30Days++;

    // First/last tracking
    if (!firstCitedAt || citation.createdAt < firstCitedAt) {
      firstCitedAt = citation.createdAt;
    }
    if (!lastCitedAt || citation.createdAt > lastCitedAt) {
      lastCitedAt = citation.createdAt;
    }
  }

  // Calculate trend score (weighted recent activity)
  const trendScore = calculateTrendScore(
    citationsLast7Days,
    citationsLast30Days,
    citations.length
  );

  // Upsert usage record
  await prisma.sourceUsage.upsert({
    where: { sourceId },
    create: {
      sourceId,
      totalCitations: citations.length,
      deliberationCount: deliberationIds.size,
      argumentCount: argumentIds.size,
      stackCount: stackIds.size,
      uniqueCiters: userIds.size,
      supportCount,
      refuteCount,
      contextCount,
      citationsLast7Days,
      citationsLast30Days,
      trendScore,
      firstCitedAt,
      lastCitedAt,
    },
    update: {
      totalCitations: citations.length,
      deliberationCount: deliberationIds.size,
      argumentCount: argumentIds.size,
      stackCount: stackIds.size,
      uniqueCiters: userIds.size,
      supportCount,
      refuteCount,
      contextCount,
      citationsLast7Days,
      citationsLast30Days,
      trendScore,
      firstCitedAt,
      lastCitedAt,
    },
  });

  // Update citation contexts for discovery
  await updateCitationContexts(sourceId, citations);

  console.log(`[SourceUsage] Aggregated: ${citations.length} citations across ${deliberationIds.size} deliberations`);
}

function calculateTrendScore(
  last7Days: number,
  last30Days: number,
  total: number
): number {
  // Heavily weight recent activity
  // Score range: 0-100
  const recentWeight = 0.6;
  const monthWeight = 0.3;
  const totalWeight = 0.1;

  const recentScore = Math.min(100, last7Days * 10);
  const monthScore = Math.min(100, last30Days * 3);
  const totalScore = Math.min(100, Math.log10(total + 1) * 30);

  return (
    recentScore * recentWeight +
    monthScore * monthWeight +
    totalScore * totalWeight
  );
}

async function updateCitationContexts(sourceId: string, citations: any[]) {
  // Batch upsert citation contexts
  for (const citation of citations) {
    const isPublic = await checkContextVisibility(citation);

    await prisma.sourceCitationContext.upsert({
      where: { citationId: citation.id },
      create: {
        sourceId,
        citationId: citation.id,
        deliberationId: citation.deliberationId,
        argumentId: citation.argumentId,
        stackId: citation.stackId,
        intent: citation.intent,
        quote: citation.quote,
        isPublic,
      },
      update: {
        intent: citation.intent,
        quote: citation.quote,
        isPublic,
      },
    });
  }
}

async function checkContextVisibility(citation: any): Promise<boolean> {
  if (citation.deliberationId) {
    const deliberation = await prisma.deliberation.findUnique({
      where: { id: citation.deliberationId },
      select: { isPublic: true },
    });
    return deliberation?.isPublic ?? false;
  }
  if (citation.stackId) {
    const stack = await prisma.stack.findUnique({
      where: { id: citation.stackId },
      select: { visibility: true },
    });
    return stack?.visibility === "public";
  }
  return false;
}
```

### Citation Trigger

```typescript
// lib/triggers/citationTriggers.ts

import { sourceUsageQueue } from "@/workers/queues";

export async function onCitationCreated(citation: any) {
  await sourceUsageQueue.add(
    "aggregate-usage",
    {
      sourceId: citation.sourceId,
      triggeredBy: "citation_created",
    },
    {
      delay: 5000, // Debounce rapid citations
      jobId: `usage-${citation.sourceId}-${Date.now()}`,
    }
  );
}

export async function onCitationDeleted(citation: any) {
  await sourceUsageQueue.add(
    "aggregate-usage",
    {
      sourceId: citation.sourceId,
      triggeredBy: "citation_deleted",
    },
    {
      delay: 5000,
      jobId: `usage-${citation.sourceId}-${Date.now()}`,
    }
  );
}
```

### Cross-Citation Display Component

```tsx
// components/sources/SourceCrossReferences.tsx

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { IntentBadge } from "@/components/citations/IntentBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Zap, Layers } from "lucide-react";

interface SourceCrossReferencesProps {
  sourceId: string;
  currentDeliberationId?: string;
}

export function SourceCrossReferences({
  sourceId,
  currentDeliberationId,
}: SourceCrossReferencesProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["source-cross-refs", sourceId],
    queryFn: () =>
      fetch(`/api/sources/${sourceId}/cross-references`).then((r) => r.json()),
  });

  if (isLoading) {
    return <div className="animate-pulse h-24 bg-gray-100 rounded" />;
  }

  if (!data || data.contexts.length === 0) {
    return null;
  }

  const otherContexts = data.contexts.filter(
    (c: any) => c.deliberationId !== currentDeliberationId
  );

  if (otherContexts.length === 0) {
    return null;
  }

  // Group by deliberation
  const byDeliberation = groupBy(otherContexts, "deliberationId");
  const deliberationIds = Object.keys(byDeliberation).filter(Boolean);

  return (
    <div className="border rounded-lg p-4 bg-blue-50/50">
      <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Also cited in {deliberationIds.length} other deliberation
        {deliberationIds.length !== 1 ? "s" : ""}
      </h4>

      <div className="space-y-2">
        {deliberationIds.slice(0, 5).map((delibId) => {
          const contexts = byDeliberation[delibId];
          const firstContext = contexts[0];

          return (
            <Link
              key={delibId}
              href={`/deliberations/${delibId}`}
              className="block p-2 bg-white rounded border hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">
                  {firstContext.deliberationTitle}
                </span>
                <div className="flex items-center gap-1">
                  {contexts.some((c: any) => c.intent === "supports") && (
                    <IntentBadge intent="supports" size="xs" />
                  )}
                  {contexts.some((c: any) => c.intent === "refutes") && (
                    <IntentBadge intent="refutes" size="xs" />
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {contexts.length} citation{contexts.length !== 1 ? "s" : ""}
              </span>
            </Link>
          );
        })}
      </div>

      {deliberationIds.length > 5 && (
        <Link
          href={`/sources/${sourceId}/references`}
          className="block mt-2 text-sm text-blue-600 hover:underline"
        >
          View all {deliberationIds.length} deliberations →
        </Link>
      )}
    </div>
  );
}

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const value = String(item[key] || "");
      if (!groups[value]) groups[value] = [];
      groups[value].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}
```

### API Endpoint

```typescript
// app/api/sources/[sourceId]/cross-references/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getServerSession } from "next-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { sourceId: string } }
) {
  const session = await getServerSession();

  // Get public contexts, plus private ones user has access to
  const contexts = await prisma.sourceCitationContext.findMany({
    where: {
      sourceId: params.sourceId,
      OR: [
        { isPublic: true },
        // Add user's private deliberations if authenticated
        ...(session?.user?.id
          ? [
              {
                deliberation: {
                  participants: {
                    some: { id: session.user.id },
                  },
                },
              },
            ]
          : []),
      ],
    },
    include: {
      deliberation: {
        select: {
          id: true,
          title: true,
          isPublic: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Get usage stats
  const usage = await prisma.sourceUsage.findUnique({
    where: { sourceId: params.sourceId },
  });

  return NextResponse.json({
    contexts: contexts.map((c) => ({
      id: c.id,
      deliberationId: c.deliberationId,
      deliberationTitle: c.deliberation?.title,
      intent: c.intent,
      quote: c.quote,
      createdAt: c.createdAt,
    })),
    usage: usage
      ? {
          totalCitations: usage.totalCitations,
          deliberationCount: usage.deliberationCount,
          supportCount: usage.supportCount,
          refuteCount: usage.refuteCount,
        }
      : null,
  });
}
```

### Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Usage aggregated on citation | Create citation → SourceUsage updated |
| Cross-references shown | Source in 2+ deliberations → shows list |
| Private filtered | Private deliberation → only visible to participants |
| Intent breakdown accurate | Mixed intents → correct counts |
| Trend score calculated | Recent citations → higher score |

---

## 3.3.2 Evidence Provenance Chains

**Priority**: P1 — Transparency and trust  
**Estimated Effort**: 4-5 days  
**Risk Level**: Medium (graph traversal complexity)

### Problem Statement

When evidence flows between deliberations:
- User A cites a source in Deliberation 1
- User B lifts that citation to their Stack
- User C imports from that Stack to Deliberation 2

There's no visibility into this provenance chain. Users can't see:
- Where evidence originally came from
- Who first introduced it to the platform
- How it has been used over time

**Goal**: Track and display the full provenance chain of every piece of evidence, from first import to current usage.

### Schema Additions

```prisma
model EvidenceProvenanceEvent {
  id              String   @id @default(cuid())
  
  // The source being tracked
  sourceId        String
  
  // Event type
  eventType       ProvenanceEventType
  
  // Actor
  actorId         String
  
  // Context: where did this happen?
  fromType        String?  // "external", "stack", "deliberation", "argument"
  fromId          String?
  toType          String?  // "stack", "deliberation", "argument", "citation"
  toId            String?
  
  // Additional metadata
  metadata        Json?    // { doi: "...", importSource: "semantic_scholar", etc. }
  
  createdAt       DateTime @default(now())
  
  source          Source   @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  actor           Profile  @relation(fields: [actorId], references: [id], onDelete: Cascade)
  
  @@index([sourceId, createdAt])
  @@index([actorId])
}

enum ProvenanceEventType {
  imported           // First import to platform (from DOI, URL, etc.)
  cited              // Attached to argument/claim
  lifted_to_stack    // Lifted from citation to stack
  imported_from_stack // Imported from someone else's stack
  forked             // Stack containing this source was forked
  shared             // Shared via direct link
  exported           // Exported to reference manager
}
```

### Provenance Event Recording

```typescript
// lib/provenance/recorder.ts

import { prisma } from "@/lib/prismaclient";
import { ProvenanceEventType } from "@prisma/client";

interface RecordProvenanceOptions {
  sourceId: string;
  eventType: ProvenanceEventType;
  actorId: string;
  fromType?: string;
  fromId?: string;
  toType?: string;
  toId?: string;
  metadata?: Record<string, any>;
}

export async function recordProvenanceEvent(
  options: RecordProvenanceOptions
): Promise<void> {
  const {
    sourceId,
    eventType,
    actorId,
    fromType,
    fromId,
    toType,
    toId,
    metadata,
  } = options;

  await prisma.evidenceProvenanceEvent.create({
    data: {
      sourceId,
      eventType,
      actorId,
      fromType,
      fromId,
      toType,
      toId,
      metadata: metadata || undefined,
    },
  });

  console.log(`[Provenance] Recorded ${eventType} for source ${sourceId}`);
}

// Helper functions for common events
export async function recordSourceImport(
  sourceId: string,
  actorId: string,
  importSource: string,
  metadata?: Record<string, any>
) {
  await recordProvenanceEvent({
    sourceId,
    eventType: "imported",
    actorId,
    fromType: "external",
    fromId: importSource,
    metadata: { importSource, ...metadata },
  });
}

export async function recordCitation(
  sourceId: string,
  actorId: string,
  targetType: string,
  targetId: string
) {
  await recordProvenanceEvent({
    sourceId,
    eventType: "cited",
    actorId,
    toType: targetType,
    toId: targetId,
  });
}

export async function recordLiftToStack(
  sourceId: string,
  actorId: string,
  citationId: string,
  stackId: string
) {
  await recordProvenanceEvent({
    sourceId,
    eventType: "lifted_to_stack",
    actorId,
    fromType: "citation",
    fromId: citationId,
    toType: "stack",
    toId: stackId,
  });
}

export async function recordStackImport(
  sourceId: string,
  actorId: string,
  fromStackId: string,
  toStackId: string
) {
  await recordProvenanceEvent({
    sourceId,
    eventType: "imported_from_stack",
    actorId,
    fromType: "stack",
    fromId: fromStackId,
    toType: "stack",
    toId: toStackId,
  });
}

export async function recordStackFork(
  sourceId: string,
  actorId: string,
  originalStackId: string,
  forkedStackId: string
) {
  await recordProvenanceEvent({
    sourceId,
    eventType: "forked",
    actorId,
    fromType: "stack",
    fromId: originalStackId,
    toType: "stack",
    toId: forkedStackId,
  });
}
```

### Provenance Chain Builder

```typescript
// lib/provenance/chainBuilder.ts

import { prisma } from "@/lib/prismaclient";

interface ProvenanceNode {
  id: string;
  eventType: string;
  actor: {
    id: string;
    username: string;
    avatar?: string;
  };
  context?: {
    type: string;
    id: string;
    title?: string;
  };
  timestamp: Date;
  children?: ProvenanceNode[];
}

export async function buildProvenanceChain(
  sourceId: string
): Promise<ProvenanceNode[]> {
  // Get all events for this source, ordered chronologically
  const events = await prisma.evidenceProvenanceEvent.findMany({
    where: { sourceId },
    include: {
      actor: {
        select: { id: true, username: true, avatar: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (events.length === 0) return [];

  // Build linear chain with context enrichment
  const chain: ProvenanceNode[] = [];

  for (const event of events) {
    const context = await getEventContext(event);

    chain.push({
      id: event.id,
      eventType: event.eventType,
      actor: event.actor,
      context,
      timestamp: event.createdAt,
    });
  }

  return chain;
}

async function getEventContext(event: any): Promise<ProvenanceNode["context"]> {
  const type = event.toType || event.fromType;
  const id = event.toId || event.fromId;

  if (!type || !id) return undefined;

  switch (type) {
    case "deliberation":
      const delib = await prisma.deliberation.findUnique({
        where: { id },
        select: { title: true },
      });
      return { type, id, title: delib?.title };

    case "stack":
      const stack = await prisma.stack.findUnique({
        where: { id },
        select: { name: true },
      });
      return { type, id, title: stack?.name };

    case "argument":
      const arg = await prisma.argument.findUnique({
        where: { id },
        select: { conclusion: true },
      });
      return { type, id, title: arg?.conclusion?.slice(0, 50) };

    default:
      return { type, id };
  }
}

export async function getSourceOrigin(sourceId: string): Promise<{
  firstImporter: { id: string; username: string } | null;
  importDate: Date | null;
  importSource: string | null;
}> {
  const firstEvent = await prisma.evidenceProvenanceEvent.findFirst({
    where: {
      sourceId,
      eventType: "imported",
    },
    include: {
      actor: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!firstEvent) {
    return { firstImporter: null, importDate: null, importSource: null };
  }

  return {
    firstImporter: firstEvent.actor,
    importDate: firstEvent.createdAt,
    importSource: (firstEvent.metadata as any)?.importSource || null,
  };
}
```

### Provenance Timeline Component

```tsx
// components/sources/ProvenanceTimeline.tsx

"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Download,
  Quote,
  ArrowUpRight,
  GitFork,
  Share2,
  Upload,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface ProvenanceTimelineProps {
  sourceId: string;
  maxEvents?: number;
}

const EVENT_ICONS: Record<string, any> = {
  imported: Download,
  cited: Quote,
  lifted_to_stack: ArrowUpRight,
  imported_from_stack: Download,
  forked: GitFork,
  shared: Share2,
  exported: Upload,
};

const EVENT_LABELS: Record<string, string> = {
  imported: "imported this source",
  cited: "cited in",
  lifted_to_stack: "lifted to stack",
  imported_from_stack: "imported from stack",
  forked: "forked stack containing this",
  shared: "shared",
  exported: "exported to reference manager",
};

export function ProvenanceTimeline({
  sourceId,
  maxEvents = 10,
}: ProvenanceTimelineProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["source-provenance", sourceId],
    queryFn: () =>
      fetch(`/api/sources/${sourceId}/provenance`).then((r) => r.json()),
  });

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded" />;
  }

  if (!data?.chain || data.chain.length === 0) {
    return null;
  }

  const events = data.chain.slice(0, maxEvents);
  const hasMore = data.chain.length > maxEvents;

  return (
    <div className="border rounded-lg p-4">
      <h4 className="text-sm font-medium mb-4">Evidence History</h4>

      <div className="space-y-4">
        {events.map((event: any, index: number) => {
          const Icon = EVENT_ICONS[event.eventType] || Quote;
          const isFirst = index === 0;

          return (
            <div key={event.id} className="flex gap-3">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isFirst ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {index < events.length - 1 && (
                  <div className="w-px h-full bg-gray-200 my-1" />
                )}
              </div>

              {/* Event content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Avatar
                    src={event.actor.avatar}
                    alt={event.actor.username}
                    size="xs"
                  />
                  <Link
                    href={`/users/${event.actor.username}`}
                    className="font-medium hover:underline"
                  >
                    {event.actor.username}
                  </Link>
                  <span className="text-gray-600">
                    {EVENT_LABELS[event.eventType]}
                  </span>
                </div>

                {event.context && (
                  <Link
                    href={getContextLink(event.context)}
                    className="text-sm text-blue-600 hover:underline mt-1 block"
                  >
                    {event.context.title || event.context.id}
                  </Link>
                )}

                <span className="text-xs text-gray-500 mt-1 block">
                  {formatDistanceToNow(new Date(event.timestamp), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <Link
          href={`/sources/${sourceId}/history`}
          className="text-sm text-blue-600 hover:underline mt-2 block"
        >
          View full history ({data.chain.length} events) →
        </Link>
      )}
    </div>
  );
}

function getContextLink(context: { type: string; id: string }): string {
  switch (context.type) {
    case "deliberation":
      return `/deliberations/${context.id}`;
    case "stack":
      return `/stacks/${context.id}`;
    case "argument":
      return `/arguments/${context.id}`;
    default:
      return "#";
  }
}
```

### Provenance API Endpoint

```typescript
// app/api/sources/[sourceId]/provenance/route.ts

import { NextRequest, NextResponse } from "next/server";
import { buildProvenanceChain, getSourceOrigin } from "@/lib/provenance/chainBuilder";

export async function GET(
  req: NextRequest,
  { params }: { params: { sourceId: string } }
) {
  const chain = await buildProvenanceChain(params.sourceId);
  const origin = await getSourceOrigin(params.sourceId);

  return NextResponse.json({
    chain,
    origin,
    totalEvents: chain.length,
  });
}
```

### Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Import recorded | Add source via DOI → provenance event created |
| Citation recorded | Cite source → event with context |
| Lift recorded | Lift to stack → chain updated |
| Chain displays | View source → timeline shows history |
| Origin attribution | First importer credited |
| Context links work | Click event → navigates to context |

---

## 3.3.3 "Hot Sources" Trending

**Priority**: P2 — Discovery and engagement  
**Estimated Effort**: 3-4 days  
**Risk Level**: Low (read-only analytics)

### Problem Statement

Users don't know what evidence is gaining traction across the platform:
- Which sources are being cited most right now?
- What topics are generating the most evidentiary debate?
- Where is the most active research happening?

**Goal**: Surface trending sources, topics, and deliberations based on citation activity, enabling users to discover active conversations and relevant evidence.

### Trending Calculation Schema

```prisma
model TrendingSnapshot {
  id            String   @id @default(cuid())
  
  // Snapshot timing
  snapshotType  TrendingSnapshotType
  periodStart   DateTime
  periodEnd     DateTime
  
  // Ranking data (stored as JSON for flexibility)
  sourcesRanking    Json  // [{ sourceId, score, citations, deliberations }]
  topicsRanking     Json  // [{ topic, score, sourceCount, citationCount }]
  deliberationsRanking Json // [{ deliberationId, score, newCitations }]
  
  // Metadata
  totalCitations    Int
  totalSources      Int
  computedAt        DateTime @default(now())
  
  @@index([snapshotType, periodEnd])
}

enum TrendingSnapshotType {
  hourly
  daily
  weekly
}

// Add to Source model
model Source {
  // ... existing fields ...
  
  // Trending metadata (updated by worker)
  trendingScore     Float?
  trendingRank      Int?
  lastTrendingUpdate DateTime?
}
```

### Trending Computation Worker

```typescript
// workers/trendingComputation.ts

import { prisma } from "@/lib/prismaclient";
import { Job } from "bullmq";

interface TrendingJob {
  snapshotType: "hourly" | "daily" | "weekly";
}

export async function computeTrendingSnapshot(job: Job<TrendingJob>) {
  const { snapshotType } = job.data;

  const now = new Date();
  const periodStart = getPeriodStart(now, snapshotType);
  const periodEnd = now;

  console.log(`[Trending] Computing ${snapshotType} snapshot: ${periodStart} to ${periodEnd}`);

  // Get all citations in the period
  const recentCitations = await prisma.citation.findMany({
    where: {
      createdAt: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
    include: {
      source: {
        select: {
          id: true,
          title: true,
          topics: true,
        },
      },
    },
  });

  // Calculate source rankings
  const sourceScores = calculateSourceScores(recentCitations, snapshotType);
  const sourcesRanking = Array.from(sourceScores.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 100)
    .map(([sourceId, data], index) => ({
      sourceId,
      rank: index + 1,
      score: data.score,
      citations: data.citations,
      deliberations: data.deliberations,
      intents: data.intents,
    }));

  // Calculate topic rankings
  const topicScores = calculateTopicScores(recentCitations);
  const topicsRanking = Array.from(topicScores.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 50)
    .map(([topic, data], index) => ({
      topic,
      rank: index + 1,
      score: data.score,
      sourceCount: data.sources.size,
      citationCount: data.citations,
    }));

  // Calculate deliberation rankings (most active)
  const deliberationScores = calculateDeliberationScores(recentCitations);
  const deliberationsRanking = Array.from(deliberationScores.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 50)
    .map(([deliberationId, data], index) => ({
      deliberationId,
      rank: index + 1,
      score: data.score,
      newCitations: data.citations,
      uniqueSources: data.sources.size,
    }));

  // Save snapshot
  await prisma.trendingSnapshot.create({
    data: {
      snapshotType,
      periodStart,
      periodEnd,
      sourcesRanking,
      topicsRanking,
      deliberationsRanking,
      totalCitations: recentCitations.length,
      totalSources: sourceScores.size,
    },
  });

  // Update source trending scores for top sources
  for (const source of sourcesRanking.slice(0, 50)) {
    await prisma.source.update({
      where: { id: source.sourceId },
      data: {
        trendingScore: source.score,
        trendingRank: source.rank,
        lastTrendingUpdate: now,
      },
    });
  }

  console.log(`[Trending] Computed: ${sourcesRanking.length} sources, ${topicsRanking.length} topics`);
}

function getPeriodStart(now: Date, type: string): Date {
  const ms = now.getTime();
  switch (type) {
    case "hourly":
      return new Date(ms - 60 * 60 * 1000);
    case "daily":
      return new Date(ms - 24 * 60 * 60 * 1000);
    case "weekly":
      return new Date(ms - 7 * 24 * 60 * 60 * 1000);
    default:
      return new Date(ms - 24 * 60 * 60 * 1000);
  }
}

interface ScoreData {
  score: number;
  citations: number;
  deliberations: Set<string>;
  intents: { supports: number; refutes: number; context: number };
}

function calculateSourceScores(
  citations: any[],
  snapshotType: string
): Map<string, ScoreData> {
  const scores = new Map<string, ScoreData>();

  // Decay factor based on recency
  const decayHalfLife = snapshotType === "hourly" ? 0.5 : snapshotType === "daily" ? 6 : 24;

  for (const citation of citations) {
    const sourceId = citation.sourceId;
    const hoursAgo = (Date.now() - citation.createdAt.getTime()) / (1000 * 60 * 60);
    const recencyWeight = Math.pow(0.5, hoursAgo / decayHalfLife);

    if (!scores.has(sourceId)) {
      scores.set(sourceId, {
        score: 0,
        citations: 0,
        deliberations: new Set(),
        intents: { supports: 0, refutes: 0, context: 0 },
      });
    }

    const data = scores.get(sourceId)!;
    data.citations++;
    data.score += recencyWeight;

    if (citation.deliberationId) {
      data.deliberations.add(citation.deliberationId);
    }

    // Track intents
    if (citation.intent === "supports") data.intents.supports++;
    else if (citation.intent === "refutes") data.intents.refutes++;
    else data.intents.context++;
  }

  // Bonus for cross-deliberation usage
  for (const [, data] of scores) {
    const crossDelibBonus = Math.log2(data.deliberations.size + 1) * 2;
    data.score += crossDelibBonus;
  }

  return scores;
}

function calculateTopicScores(citations: any[]): Map<string, any> {
  const scores = new Map<string, { score: number; citations: number; sources: Set<string> }>();

  for (const citation of citations) {
    const topics = (citation.source?.topics as string[]) || [];

    for (const topic of topics) {
      if (!scores.has(topic)) {
        scores.set(topic, { score: 0, citations: 0, sources: new Set() });
      }

      const data = scores.get(topic)!;
      data.citations++;
      data.score++;
      data.sources.add(citation.sourceId);
    }
  }

  // Bonus for topic diversity (many different sources)
  for (const [, data] of scores) {
    data.score += Math.log2(data.sources.size + 1) * 3;
  }

  return scores;
}

function calculateDeliberationScores(citations: any[]): Map<string, any> {
  const scores = new Map<string, { score: number; citations: number; sources: Set<string> }>();

  for (const citation of citations) {
    if (!citation.deliberationId) continue;

    const delibId = citation.deliberationId;

    if (!scores.has(delibId)) {
      scores.set(delibId, { score: 0, citations: 0, sources: new Set() });
    }

    const data = scores.get(delibId)!;
    data.citations++;
    data.score++;
    data.sources.add(citation.sourceId);
  }

  return scores;
}
```

### Trending Cron Schedule

```typescript
// app/api/_cron/trending/route.ts

import { NextRequest, NextResponse } from "next/server";
import { trendingQueue } from "@/workers/queues";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "hourly";

  await trendingQueue.add("compute-trending", { snapshotType: type });

  return NextResponse.json({ queued: true, type });
}

// Schedule in vercel.json or cron config:
// - Hourly: every hour
// - Daily: every day at midnight
// - Weekly: every Sunday at midnight
```

### Trending API Endpoints

```typescript
// app/api/trending/sources/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "daily";
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));

  // Get latest snapshot for this period
  const snapshot = await prisma.trendingSnapshot.findFirst({
    where: { snapshotType: period as any },
    orderBy: { periodEnd: "desc" },
  });

  if (!snapshot) {
    return NextResponse.json({ sources: [], period, computed: null });
  }

  const rankings = (snapshot.sourcesRanking as any[]).slice(0, limit);

  // Enrich with source details
  const sourceIds = rankings.map((r) => r.sourceId);
  const sources = await prisma.source.findMany({
    where: { id: { in: sourceIds } },
    select: {
      id: true,
      title: true,
      authorsJson: true,
      year: true,
      doi: true,
      verificationStatus: true,
    },
  });

  const sourceMap = new Map(sources.map((s) => [s.id, s]));

  const enrichedRankings = rankings.map((r) => ({
    ...r,
    source: sourceMap.get(r.sourceId),
  }));

  return NextResponse.json({
    sources: enrichedRankings,
    period,
    computedAt: snapshot.computedAt,
    periodStart: snapshot.periodStart,
    periodEnd: snapshot.periodEnd,
  });
}
```

```typescript
// app/api/trending/topics/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "daily";
  const limit = Math.min(30, parseInt(searchParams.get("limit") || "15", 10));

  const snapshot = await prisma.trendingSnapshot.findFirst({
    where: { snapshotType: period as any },
    orderBy: { periodEnd: "desc" },
  });

  if (!snapshot) {
    return NextResponse.json({ topics: [], period, computed: null });
  }

  const topics = (snapshot.topicsRanking as any[]).slice(0, limit);

  return NextResponse.json({
    topics,
    period,
    computedAt: snapshot.computedAt,
  });
}
```

### Trending Display Components

```tsx
// components/trending/TrendingSources.tsx

"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { TrendingUp, Flame, MessageSquare } from "lucide-react";
import { VerificationBadge } from "@/components/sources/VerificationBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TrendingSourcesProps {
  limit?: number;
  showTabs?: boolean;
}

export function TrendingSources({ limit = 10, showTabs = true }: TrendingSourcesProps) {
  const [period, setPeriod] = useState<string>("daily");

  const { data, isLoading } = useQuery({
    queryKey: ["trending-sources", period, limit],
    queryFn: () =>
      fetch(`/api/trending/sources?period=${period}&limit=${limit}`).then((r) =>
        r.json()
      ),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return <TrendingSourcesSkeleton count={limit} />;
  }

  const sources = data?.sources || [];

  return (
    <div className="border rounded-lg">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Trending Sources
        </h3>

        {showTabs && (
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList className="h-8">
              <TabsTrigger value="hourly" className="text-xs px-2">
                Hour
              </TabsTrigger>
              <TabsTrigger value="daily" className="text-xs px-2">
                Day
              </TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs px-2">
                Week
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      <div className="divide-y">
        {sources.map((item: any, index: number) => (
          <div
            key={item.sourceId}
            className="p-3 flex items-start gap-3 hover:bg-gray-50"
          >
            {/* Rank badge */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                index < 3
                  ? "bg-orange-100 text-orange-600"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {index + 1}
            </div>

            <div className="flex-1 min-w-0">
              <Link
                href={`/sources/${item.sourceId}`}
                className="text-sm font-medium hover:underline line-clamp-2"
              >
                {item.source?.title || "Unknown Source"}
              </Link>

              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {item.citations} citations
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {item.deliberations} deliberations
                </span>
              </div>

              {/* Intent breakdown */}
              {item.intents && (
                <div className="flex items-center gap-2 mt-1">
                  {item.intents.supports > 0 && (
                    <span className="text-xs text-green-600">
                      +{item.intents.supports}
                    </span>
                  )}
                  {item.intents.refutes > 0 && (
                    <span className="text-xs text-red-600">
                      −{item.intents.refutes}
                    </span>
                  )}
                </div>
              )}
            </div>

            <VerificationBadge
              status={item.source?.verificationStatus}
              size="sm"
            />
          </div>
        ))}
      </div>

      <Link
        href="/trending"
        className="block p-3 text-center text-sm text-blue-600 hover:bg-gray-50 border-t"
      >
        View all trending →
      </Link>
    </div>
  );
}

function TrendingSourcesSkeleton({ count }: { count: number }) {
  return (
    <div className="border rounded-lg">
      <div className="p-4 border-b">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="divide-y">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-3 flex gap-3">
            <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

```tsx
// components/trending/TrendingTopics.tsx

"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Hash } from "lucide-react";

export function TrendingTopics({ limit = 10 }: { limit?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["trending-topics", limit],
    queryFn: () =>
      fetch(`/api/trending/topics?limit=${limit}`).then((r) => r.json()),
  });

  if (isLoading) {
    return <div className="animate-pulse h-40 bg-gray-100 rounded" />;
  }

  const topics = data?.topics || [];

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-medium mb-3 flex items-center gap-2">
        <Hash className="h-4 w-4" />
        Trending Topics
      </h3>

      <div className="flex flex-wrap gap-2">
        {topics.map((topic: any) => (
          <Link
            key={topic.topic}
            href={`/search?topic=${encodeURIComponent(topic.topic)}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
          >
            <span>{topic.topic}</span>
            <span className="text-xs text-gray-500">
              {topic.citationCount}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

### Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Hourly snapshot computed | Cron runs → snapshot created |
| Daily snapshot computed | Cron runs → snapshot created |
| Source ranking accurate | More citations → higher rank |
| Recency weighting works | Recent citations weighted higher |
| Cross-delib bonus applied | Sources in multiple deliberations boosted |
| Topic trending works | Active topics appear in ranking |
| API returns ranked sources | Request → ordered by score |
| UI displays trends | Component shows ranked list |

---

## 3.3.4 Citation Network Analysis

**Priority**: P2 — Deep research insights  
**Estimated Effort**: 5-6 days  
**Risk Level**: Medium (graph computation complexity)

### Problem Statement

Researchers want to understand how sources relate to each other:
- Which sources are frequently cited together?
- What are the foundational sources that many others build on?
- Are there citation clusters around specific topics or viewpoints?

**Goal**: Build and visualize citation networks showing relationships between sources based on co-citation patterns and citation flows.

### Schema Additions

```prisma
model SourceRelationship {
  id              String   @id @default(cuid())
  
  // Related sources
  sourceAId       String
  sourceBId       String
  
  // Relationship metrics
  coCitationCount     Int      @default(0)  // Times cited together
  coCitationScore     Float    @default(0)  // Normalized score
  
  // Context where they're co-cited
  sharedDeliberations Int      @default(0)
  sharedArguments     Int      @default(0)
  
  // Relationship type
  relationshipType    SourceRelationshipType?
  
  // Last computation
  computedAt      DateTime @default(now())
  
  sourceA         Source   @relation("SourceRelationA", fields: [sourceAId], references: [id], onDelete: Cascade)
  sourceB         Source   @relation("SourceRelationB", fields: [sourceBId], references: [id], onDelete: Cascade)
  
  @@unique([sourceAId, sourceBId])
  @@index([sourceAId, coCitationScore])
  @@index([sourceBId, coCitationScore])
}

enum SourceRelationshipType {
  co_cited        // Frequently cited together
  builds_on       // Source B builds on Source A
  contradicts     // Sources are used in opposing arguments
  methodology     // Shared methodology reference
}

model CitationCluster {
  id              String   @id @default(cuid())
  
  // Cluster metadata
  name            String?
  topic           String?
  
  // Member sources
  sourceIds       String[]
  
  // Cluster metrics
  cohesion        Float    @default(0)  // Internal connectivity
  size            Int      @default(0)
  
  // Representative source (most connected)
  centroidSourceId String?
  
  computedAt      DateTime @default(now())
  
  @@index([topic])
}
```

### Co-Citation Computation Worker

```typescript
// workers/coCitationAnalysis.ts

import { prisma } from "@/lib/prismaclient";
import { Job } from "bullmq";

export async function computeCoCitations(job: Job) {
  console.log("[CoCitation] Starting co-citation analysis...");

  // Get all deliberations with multiple citations
  const deliberationsWithCitations = await prisma.deliberation.findMany({
    where: {
      citations: {
        some: {},
      },
    },
    select: {
      id: true,
      citations: {
        select: {
          sourceId: true,
          intent: true,
        },
      },
    },
  });

  // Also check arguments with multiple citations
  const argumentsWithCitations = await prisma.argument.findMany({
    where: {
      citations: {
        some: {},
      },
    },
    select: {
      id: true,
      citations: {
        select: {
          sourceId: true,
          intent: true,
        },
      },
    },
  });

  // Build co-citation pairs
  const coCitations = new Map<string, CoCitationData>();

  // Process deliberation co-citations
  for (const delib of deliberationsWithCitations) {
    const sourceIds = [...new Set(delib.citations.map((c) => c.sourceId))];
    if (sourceIds.length < 2) continue;

    // Generate pairs
    for (let i = 0; i < sourceIds.length; i++) {
      for (let j = i + 1; j < sourceIds.length; j++) {
        const pairKey = makePairKey(sourceIds[i], sourceIds[j]);
        
        if (!coCitations.has(pairKey)) {
          coCitations.set(pairKey, {
            sourceAId: sourceIds[i] < sourceIds[j] ? sourceIds[i] : sourceIds[j],
            sourceBId: sourceIds[i] < sourceIds[j] ? sourceIds[j] : sourceIds[i],
            count: 0,
            deliberations: new Set(),
            arguments: new Set(),
          });
        }

        const data = coCitations.get(pairKey)!;
        data.count++;
        data.deliberations.add(delib.id);
      }
    }
  }

  // Process argument co-citations
  for (const arg of argumentsWithCitations) {
    const sourceIds = [...new Set(arg.citations.map((c) => c.sourceId))];
    if (sourceIds.length < 2) continue;

    for (let i = 0; i < sourceIds.length; i++) {
      for (let j = i + 1; j < sourceIds.length; j++) {
        const pairKey = makePairKey(sourceIds[i], sourceIds[j]);
        
        if (!coCitations.has(pairKey)) {
          coCitations.set(pairKey, {
            sourceAId: sourceIds[i] < sourceIds[j] ? sourceIds[i] : sourceIds[j],
            sourceBId: sourceIds[i] < sourceIds[j] ? sourceIds[j] : sourceIds[i],
            count: 0,
            deliberations: new Set(),
            arguments: new Set(),
          });
        }

        const data = coCitations.get(pairKey)!;
        data.count++;
        data.arguments.add(arg.id);
      }
    }
  }

  // Calculate normalized scores and upsert
  const maxCount = Math.max(...Array.from(coCitations.values()).map((d) => d.count));

  for (const [, data] of coCitations) {
    const normalizedScore = data.count / maxCount;

    await prisma.sourceRelationship.upsert({
      where: {
        sourceAId_sourceBId: {
          sourceAId: data.sourceAId,
          sourceBId: data.sourceBId,
        },
      },
      create: {
        sourceAId: data.sourceAId,
        sourceBId: data.sourceBId,
        coCitationCount: data.count,
        coCitationScore: normalizedScore,
        sharedDeliberations: data.deliberations.size,
        sharedArguments: data.arguments.size,
        relationshipType: "co_cited",
      },
      update: {
        coCitationCount: data.count,
        coCitationScore: normalizedScore,
        sharedDeliberations: data.deliberations.size,
        sharedArguments: data.arguments.size,
        computedAt: new Date(),
      },
    });
  }

  console.log(`[CoCitation] Processed ${coCitations.size} co-citation pairs`);
}

interface CoCitationData {
  sourceAId: string;
  sourceBId: string;
  count: number;
  deliberations: Set<string>;
  arguments: Set<string>;
}

function makePairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}
```

### Citation Network Builder

```typescript
// lib/citationNetwork/networkBuilder.ts

import { prisma } from "@/lib/prismaclient";

interface NetworkNode {
  id: string;
  title: string;
  citationCount: number;
  degree: number;  // Number of connections
  cluster?: string;
}

interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
  sharedContexts: number;
}

interface CitationNetwork {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  stats: {
    nodeCount: number;
    edgeCount: number;
    density: number;
    avgDegree: number;
  };
}

export async function buildCitationNetwork(options: {
  sourceId?: string;
  deliberationId?: string;
  topic?: string;
  minCoCitations?: number;
  maxNodes?: number;
}): Promise<CitationNetwork> {
  const {
    sourceId,
    deliberationId,
    topic,
    minCoCitations = 2,
    maxNodes = 100,
  } = options;

  // Build WHERE clause based on options
  let sourceFilter: any = {};

  if (sourceId) {
    // Get network centered on a specific source
    const relationships = await prisma.sourceRelationship.findMany({
      where: {
        OR: [{ sourceAId: sourceId }, { sourceBId: sourceId }],
        coCitationCount: { gte: minCoCitations },
      },
      orderBy: { coCitationScore: "desc" },
      take: maxNodes,
    });

    const relatedSourceIds = new Set<string>();
    relatedSourceIds.add(sourceId);

    for (const rel of relationships) {
      relatedSourceIds.add(rel.sourceAId);
      relatedSourceIds.add(rel.sourceBId);
    }

    sourceFilter = { id: { in: Array.from(relatedSourceIds) } };
  } else if (deliberationId) {
    // Get network for a deliberation's sources
    const citations = await prisma.citation.findMany({
      where: { deliberationId },
      select: { sourceId: true },
    });
    sourceFilter = { id: { in: citations.map((c) => c.sourceId) } };
  } else if (topic) {
    // Get network for a topic
    sourceFilter = { topics: { has: topic } };
  }

  // Fetch sources
  const sources = await prisma.source.findMany({
    where: sourceFilter,
    select: {
      id: true,
      title: true,
      _count: { select: { citations: true } },
    },
    take: maxNodes,
  });

  const sourceIds = sources.map((s) => s.id);

  // Fetch relationships between these sources
  const relationships = await prisma.sourceRelationship.findMany({
    where: {
      sourceAId: { in: sourceIds },
      sourceBId: { in: sourceIds },
      coCitationCount: { gte: minCoCitations },
    },
  });

  // Build nodes
  const degreeMap = new Map<string, number>();
  for (const rel of relationships) {
    degreeMap.set(rel.sourceAId, (degreeMap.get(rel.sourceAId) || 0) + 1);
    degreeMap.set(rel.sourceBId, (degreeMap.get(rel.sourceBId) || 0) + 1);
  }

  const nodes: NetworkNode[] = sources.map((s) => ({
    id: s.id,
    title: s.title,
    citationCount: s._count.citations,
    degree: degreeMap.get(s.id) || 0,
  }));

  // Build edges
  const edges: NetworkEdge[] = relationships.map((r) => ({
    source: r.sourceAId,
    target: r.sourceBId,
    weight: r.coCitationScore,
    sharedContexts: r.sharedDeliberations + r.sharedArguments,
  }));

  // Calculate network stats
  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  const maxEdges = (nodeCount * (nodeCount - 1)) / 2;
  const density = maxEdges > 0 ? edgeCount / maxEdges : 0;
  const avgDegree = nodeCount > 0 ? (edgeCount * 2) / nodeCount : 0;

  return {
    nodes,
    edges,
    stats: {
      nodeCount,
      edgeCount,
      density,
      avgDegree,
    },
  };
}

export async function getRelatedSources(
  sourceId: string,
  limit: number = 10
): Promise<Array<{ source: any; score: number; sharedContexts: number }>> {
  const relationships = await prisma.sourceRelationship.findMany({
    where: {
      OR: [{ sourceAId: sourceId }, { sourceBId: sourceId }],
    },
    orderBy: { coCitationScore: "desc" },
    take: limit,
  });

  const relatedIds = relationships.map((r) =>
    r.sourceAId === sourceId ? r.sourceBId : r.sourceAId
  );

  const sources = await prisma.source.findMany({
    where: { id: { in: relatedIds } },
    select: {
      id: true,
      title: true,
      authorsJson: true,
      year: true,
      verificationStatus: true,
    },
  });

  const sourceMap = new Map(sources.map((s) => [s.id, s]));

  return relationships.map((r) => {
    const relatedId = r.sourceAId === sourceId ? r.sourceBId : r.sourceAId;
    return {
      source: sourceMap.get(relatedId),
      score: r.coCitationScore,
      sharedContexts: r.sharedDeliberations + r.sharedArguments,
    };
  });
}
```

### Citation Network Visualization

```tsx
// components/sources/CitationNetworkGraph.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as d3 from "d3";

interface CitationNetworkGraphProps {
  sourceId?: string;
  deliberationId?: string;
  topic?: string;
  width?: number;
  height?: number;
}

export function CitationNetworkGraph({
  sourceId,
  deliberationId,
  topic,
  width = 800,
  height = 600,
}: CitationNetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["citation-network", sourceId, deliberationId, topic],
    queryFn: () => {
      const params = new URLSearchParams();
      if (sourceId) params.set("sourceId", sourceId);
      if (deliberationId) params.set("deliberationId", deliberationId);
      if (topic) params.set("topic", topic);
      return fetch(`/api/citation-network?${params}`).then((r) => r.json());
    },
  });

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { nodes, edges } = data;

    // Create force simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(edges)
          .id((d: any) => d.id)
          .distance(100)
          .strength((d: any) => d.weight)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    // Create container with zoom
    const container = svg
      .append("g")
      .attr("class", "container");

    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on("zoom", (event) => {
          container.attr("transform", event.transform);
        }) as any
    );

    // Draw edges
    const link = container
      .append("g")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d: any) => Math.max(1, d.weight * 3));

    // Draw nodes
    const node = container
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(drag(simulation) as any);

    // Node circles
    node
      .append("circle")
      .attr("r", (d: any) => Math.max(8, Math.sqrt(d.citationCount) * 3))
      .attr("fill", (d: any) =>
        d.id === sourceId ? "#3b82f6" : "#6b7280"
      )
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Node labels
    node
      .append("text")
      .text((d: any) => truncate(d.title, 20))
      .attr("x", 12)
      .attr("y", 4)
      .attr("font-size", "10px")
      .attr("fill", "#374151");

    // Hover tooltip
    node
      .on("mouseenter", function (event, d: any) {
        d3.select(this).select("circle").attr("stroke", "#3b82f6");
        setSelectedNode(d.id);
      })
      .on("mouseleave", function () {
        d3.select(this).select("circle").attr("stroke", "#fff");
        setSelectedNode(null);
      })
      .on("click", (event, d: any) => {
        window.location.href = `/sources/${d.id}`;
      });

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [data, width, height, sourceId]);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ width, height }}
      >
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border rounded-lg bg-white"
      />

      {/* Stats overlay */}
      {data?.stats && (
        <div className="absolute top-4 left-4 bg-white/90 rounded-lg p-3 text-xs shadow">
          <div>Nodes: {data.stats.nodeCount}</div>
          <div>Connections: {data.stats.edgeCount}</div>
          <div>Avg. degree: {data.stats.avgDegree.toFixed(1)}</div>
        </div>
      )}

      {/* Selected node info */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg p-3 shadow">
          <SelectedNodeInfo
            nodeId={selectedNode}
            nodes={data?.nodes || []}
          />
        </div>
      )}
    </div>
  );
}

function drag(simulation: any) {
  return d3
    .drag()
    .on("start", (event) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    })
    .on("drag", (event) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    })
    .on("end", (event) => {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    });
}

function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + "..." : str;
}

function SelectedNodeInfo({
  nodeId,
  nodes,
}: {
  nodeId: string;
  nodes: any[];
}) {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  return (
    <div>
      <div className="font-medium text-sm">{node.title}</div>
      <div className="text-xs text-gray-500 mt-1">
        {node.citationCount} citations · {node.degree} connections
      </div>
    </div>
  );
}
```

### Related Sources Component

```tsx
// components/sources/RelatedSources.tsx

"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { GitBranch } from "lucide-react";
import { VerificationBadge } from "@/components/sources/VerificationBadge";

interface RelatedSourcesProps {
  sourceId: string;
  limit?: number;
}

export function RelatedSources({ sourceId, limit = 5 }: RelatedSourcesProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["related-sources", sourceId, limit],
    queryFn: () =>
      fetch(`/api/sources/${sourceId}/related?limit=${limit}`).then((r) =>
        r.json()
      ),
  });

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded" />;
  }

  if (!data?.related || data.related.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-lg p-4">
      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
        <GitBranch className="h-4 w-4" />
        Frequently Cited Together
      </h4>

      <div className="space-y-3">
        {data.related.map((item: any) => (
          <Link
            key={item.source.id}
            href={`/sources/${item.source.id}`}
            className="block p-2 -mx-2 rounded hover:bg-gray-50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium line-clamp-2">
                  {item.source.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Co-cited in {item.sharedContexts} context
                  {item.sharedContexts !== 1 ? "s" : ""}
                </div>
              </div>
              <VerificationBadge
                status={item.source.verificationStatus}
                size="sm"
              />
            </div>
          </Link>
        ))}
      </div>

      <Link
        href={`/sources/${sourceId}/network`}
        className="block mt-3 text-sm text-blue-600 hover:underline"
      >
        View citation network →
      </Link>
    </div>
  );
}
```

### API Endpoints

```typescript
// app/api/citation-network/route.ts

import { NextRequest, NextResponse } from "next/server";
import { buildCitationNetwork } from "@/lib/citationNetwork/networkBuilder";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const sourceId = searchParams.get("sourceId") || undefined;
  const deliberationId = searchParams.get("deliberationId") || undefined;
  const topic = searchParams.get("topic") || undefined;
  const minCoCitations = parseInt(searchParams.get("minCoCitations") || "2", 10);
  const maxNodes = parseInt(searchParams.get("maxNodes") || "50", 10);

  const network = await buildCitationNetwork({
    sourceId,
    deliberationId,
    topic,
    minCoCitations,
    maxNodes,
  });

  return NextResponse.json(network);
}
```

```typescript
// app/api/sources/[sourceId]/related/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getRelatedSources } from "@/lib/citationNetwork/networkBuilder";

export async function GET(
  req: NextRequest,
  { params }: { params: { sourceId: string } }
) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const related = await getRelatedSources(params.sourceId, limit);

  return NextResponse.json({ related });
}
```

### Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Co-citations computed | Worker runs → relationships created |
| Scores normalized | Highest co-citation → score = 1 |
| Network builds | Request network → nodes + edges returned |
| Graph renders | Component → D3 visualization |
| Node sizing correct | More citations → larger node |
| Related sources accurate | Frequent co-citation → appears in list |
| Zoom/pan works | Interaction → graph responds |
| Click navigates | Click node → go to source page |

---

## Phase 3.3 Completion Checklist

### Pre-Launch Requirements

| Item | Owner | Status |
|------|-------|--------|
| SourceUsage model + migration | Backend | ☐ |
| SourceCitationContext model | Backend | ☐ |
| Usage aggregation worker | Backend | ☐ |
| Citation triggers | Backend | ☐ |
| Cross-references API | Backend | ☐ |
| Cross-references component | Frontend | ☐ |
| EvidenceProvenanceEvent model | Backend | ☐ |
| Provenance recorder | Backend | ☐ |
| Provenance chain builder | Backend | ☐ |
| Provenance timeline component | Frontend | ☐ |
| TrendingSnapshot model | Backend | ☐ |
| Trending computation worker | Backend | ☐ |
| Trending cron jobs (hourly/daily/weekly) | Backend | ☐ |
| Trending API endpoints | Backend | ☐ |
| Trending sources component | Frontend | ☐ |
| Trending topics component | Frontend | ☐ |
| SourceRelationship model | Backend | ☐ |
| Co-citation analysis worker | Backend | ☐ |
| Citation network builder | Backend | ☐ |
| Network graph component (D3) | Frontend | ☐ |
| Related sources component | Frontend | ☐ |
| Network API endpoints | Backend | ☐ |

### Testing Requirements

| Test Type | Coverage |
|-----------|----------|
| Unit tests | Trend score calculation |
| Unit tests | Co-citation pair generation |
| Unit tests | Provenance event recording |
| Integration tests | Full aggregation pipeline |
| Integration tests | Network build from citations |
| E2E tests | Trending page load + display |
| E2E tests | Network visualization interaction |
| Performance tests | Large network rendering |

### External Dependencies

| Dependency | Required | Notes |
|------------|----------|-------|
| D3.js | Yes | For network visualization |
| Redis (Upstash) | Recommended | For caching trending data |
| Cron service | Yes | For scheduled trending computation |

---

**Estimated Phase 3.3 Duration**: 3-4 weeks

---

# Phase 3.4: Discovery & Exploration

**Goal**: Help users discover relevant evidence, related conversations, and opposing viewpoints they wouldn't find on their own. Transform Mesh from a tool into an exploration environment.

**Timeline**: Weeks 11-14

---

## 3.4.1 Knowledge Graph View

**Priority**: P1 — Visual exploration  
**Estimated Effort**: 5-6 days  
**Risk Level**: Medium (graph complexity, performance)

### Problem Statement

Users currently explore evidence linearly (lists, search results). They can't:
- See how concepts, sources, and deliberations connect
- Discover unexpected relationships between topics
- Navigate the knowledge space visually

**Goal**: Interactive knowledge graph showing connections between sources, topics, claims, and deliberations, enabling visual exploration and serendipitous discovery.

### Graph Data Model

```prisma
model KnowledgeNode {
  id            String   @id @default(cuid())
  
  // Node type and reference
  nodeType      KnowledgeNodeType
  referenceId   String   // ID of the actual entity
  
  // Display properties
  label         String
  description   String?
  
  // Metadata for rendering
  weight        Float    @default(1)  // Node importance/size
  color         String?  // Custom color override
  
  // Computed properties
  connectionCount Int    @default(0)
  lastActivityAt  DateTime?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Edges where this is source
  outgoingEdges KnowledgeEdge[] @relation("EdgeSource")
  // Edges where this is target
  incomingEdges KnowledgeEdge[] @relation("EdgeTarget")
  
  @@unique([nodeType, referenceId])
  @@index([nodeType])
  @@index([weight])
}

model KnowledgeEdge {
  id            String   @id @default(cuid())
  
  sourceNodeId  String
  targetNodeId  String
  
  // Edge type
  edgeType      KnowledgeEdgeType
  
  // Edge properties
  weight        Float    @default(1)
  label         String?
  
  // Metadata
  metadata      Json?
  
  createdAt     DateTime @default(now())
  
  sourceNode    KnowledgeNode @relation("EdgeSource", fields: [sourceNodeId], references: [id], onDelete: Cascade)
  targetNode    KnowledgeNode @relation("EdgeTarget", fields: [targetNodeId], references: [id], onDelete: Cascade)
  
  @@unique([sourceNodeId, targetNodeId, edgeType])
  @@index([sourceNodeId])
  @@index([targetNodeId])
}

enum KnowledgeNodeType {
  source
  topic
  claim
  deliberation
  argument
  author
  institution
}

enum KnowledgeEdgeType {
  cites           // Source → Source
  discusses       // Deliberation → Topic
  contains        // Deliberation → Claim
  supports        // Source → Claim
  refutes         // Source → Claim
  authored_by     // Source → Author
  affiliated_with // Author → Institution
  related_to      // Topic → Topic
  builds_on       // Claim → Claim
}
```

### Graph Builder Worker

```typescript
// workers/knowledgeGraphBuilder.ts

import { prisma } from "@/lib/prismaclient";
import { Job } from "bullmq";

interface GraphBuildJob {
  scope: "full" | "incremental";
  entityType?: string;
  entityId?: string;
}

export async function buildKnowledgeGraph(job: Job<GraphBuildJob>) {
  const { scope, entityType, entityId } = job.data;

  console.log(`[KnowledgeGraph] Building graph (${scope})...`);

  if (scope === "full") {
    await buildFullGraph();
  } else if (entityType && entityId) {
    await updateGraphForEntity(entityType, entityId);
  }
}

async function buildFullGraph() {
  // Clear existing graph
  await prisma.knowledgeEdge.deleteMany({});
  await prisma.knowledgeNode.deleteMany({});

  // Build source nodes
  const sources = await prisma.source.findMany({
    select: {
      id: true,
      title: true,
      abstract: true,
      topics: true,
      _count: { select: { citations: true } },
    },
  });

  for (const source of sources) {
    await prisma.knowledgeNode.create({
      data: {
        nodeType: "source",
        referenceId: source.id,
        label: source.title,
        description: source.abstract?.slice(0, 200),
        weight: Math.log10(source._count.citations + 1) + 1,
        connectionCount: source._count.citations,
      },
    });
  }

  // Build topic nodes
  const allTopics = new Set<string>();
  for (const source of sources) {
    const topics = (source.topics as string[]) || [];
    topics.forEach((t) => allTopics.add(t));
  }

  for (const topic of allTopics) {
    const sourceCount = sources.filter((s) =>
      ((s.topics as string[]) || []).includes(topic)
    ).length;

    await prisma.knowledgeNode.create({
      data: {
        nodeType: "topic",
        referenceId: topic,
        label: topic,
        weight: Math.log10(sourceCount + 1) + 1,
        connectionCount: sourceCount,
      },
    });
  }

  // Build deliberation nodes
  const deliberations = await prisma.deliberation.findMany({
    where: { isPublic: true },
    select: {
      id: true,
      title: true,
      description: true,
      _count: { select: { arguments: true, citations: true } },
    },
  });

  for (const delib of deliberations) {
    await prisma.knowledgeNode.create({
      data: {
        nodeType: "deliberation",
        referenceId: delib.id,
        label: delib.title,
        description: delib.description?.slice(0, 200),
        weight: Math.log10(delib._count.arguments + delib._count.citations + 1) + 1,
        connectionCount: delib._count.arguments,
      },
    });
  }

  // Build edges
  await buildSourceTopicEdges();
  await buildCitationEdges();
  await buildDeliberationTopicEdges();

  console.log("[KnowledgeGraph] Full graph build complete");
}

async function buildSourceTopicEdges() {
  const sources = await prisma.source.findMany({
    select: { id: true, topics: true },
  });

  for (const source of sources) {
    const topics = (source.topics as string[]) || [];

    for (const topic of topics) {
      const sourceNode = await prisma.knowledgeNode.findUnique({
        where: { nodeType_referenceId: { nodeType: "source", referenceId: source.id } },
      });
      const topicNode = await prisma.knowledgeNode.findUnique({
        where: { nodeType_referenceId: { nodeType: "topic", referenceId: topic } },
      });

      if (sourceNode && topicNode) {
        await prisma.knowledgeEdge.create({
          data: {
            sourceNodeId: sourceNode.id,
            targetNodeId: topicNode.id,
            edgeType: "discusses",
            weight: 1,
          },
        });
      }
    }
  }
}

async function buildCitationEdges() {
  const citations = await prisma.citation.findMany({
    where: {
      targetType: { in: ["claim", "argument"] },
    },
    select: {
      sourceId: true,
      targetId: true,
      targetType: true,
      intent: true,
    },
  });

  for (const citation of citations) {
    const sourceNode = await prisma.knowledgeNode.findUnique({
      where: { nodeType_referenceId: { nodeType: "source", referenceId: citation.sourceId } },
    });

    if (!sourceNode) continue;

    // Create edge based on intent
    const edgeType = citation.intent === "refutes" ? "refutes" : "supports";

    // For claims/arguments, we'd create nodes and edges
    // Simplified: just track the relationship
  }
}

async function buildDeliberationTopicEdges() {
  // Connect deliberations to topics via their citations' sources
  const deliberations = await prisma.deliberation.findMany({
    where: { isPublic: true },
    select: {
      id: true,
      citations: {
        select: {
          source: {
            select: { topics: true },
          },
        },
      },
    },
  });

  for (const delib of deliberations) {
    const topicsInDelib = new Set<string>();

    for (const citation of delib.citations) {
      const topics = (citation.source?.topics as string[]) || [];
      topics.forEach((t) => topicsInDelib.add(t));
    }

    const delibNode = await prisma.knowledgeNode.findUnique({
      where: { nodeType_referenceId: { nodeType: "deliberation", referenceId: delib.id } },
    });

    if (!delibNode) continue;

    for (const topic of topicsInDelib) {
      const topicNode = await prisma.knowledgeNode.findUnique({
        where: { nodeType_referenceId: { nodeType: "topic", referenceId: topic } },
      });

      if (topicNode) {
        await prisma.knowledgeEdge.upsert({
          where: {
            sourceNodeId_targetNodeId_edgeType: {
              sourceNodeId: delibNode.id,
              targetNodeId: topicNode.id,
              edgeType: "discusses",
            },
          },
          create: {
            sourceNodeId: delibNode.id,
            targetNodeId: topicNode.id,
            edgeType: "discusses",
            weight: 1,
          },
          update: {
            weight: { increment: 1 },
          },
        });
      }
    }
  }
}

async function updateGraphForEntity(entityType: string, entityId: string) {
  // Incremental update when a specific entity changes
  // Re-compute edges connected to this entity
  console.log(`[KnowledgeGraph] Updating for ${entityType}:${entityId}`);
  // Implementation depends on entity type
}
```

### Graph Query API

```typescript
// lib/knowledgeGraph/queryGraph.ts

import { prisma } from "@/lib/prismaclient";

interface GraphQueryOptions {
  centerNodeType?: string;
  centerNodeId?: string;
  depth?: number;
  maxNodes?: number;
  nodeTypes?: string[];
  edgeTypes?: string[];
}

interface GraphData {
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    weight: number;
    referenceId: string;
    depth: number;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
    weight: number;
  }>;
}

export async function queryKnowledgeGraph(
  options: GraphQueryOptions
): Promise<GraphData> {
  const {
    centerNodeType,
    centerNodeId,
    depth = 2,
    maxNodes = 100,
    nodeTypes,
    edgeTypes,
  } = options;

  // If no center, get top nodes by weight
  if (!centerNodeType || !centerNodeId) {
    return getTopNodesGraph(maxNodes, nodeTypes);
  }

  // BFS from center node
  const centerNode = await prisma.knowledgeNode.findUnique({
    where: {
      nodeType_referenceId: {
        nodeType: centerNodeType as any,
        referenceId: centerNodeId,
      },
    },
  });

  if (!centerNode) {
    return { nodes: [], edges: [] };
  }

  const visitedNodes = new Map<string, number>(); // nodeId -> depth
  const collectedEdges: any[] = [];
  const queue: Array<{ nodeId: string; currentDepth: number }> = [
    { nodeId: centerNode.id, currentDepth: 0 },
  ];

  while (queue.length > 0 && visitedNodes.size < maxNodes) {
    const { nodeId, currentDepth } = queue.shift()!;

    if (visitedNodes.has(nodeId)) continue;
    if (currentDepth > depth) continue;

    visitedNodes.set(nodeId, currentDepth);

    // Get connected edges
    const edges = await prisma.knowledgeEdge.findMany({
      where: {
        OR: [{ sourceNodeId: nodeId }, { targetNodeId: nodeId }],
        ...(edgeTypes && { edgeType: { in: edgeTypes as any[] } }),
      },
      include: {
        sourceNode: true,
        targetNode: true,
      },
    });

    for (const edge of edges) {
      // Filter by node types if specified
      if (nodeTypes) {
        if (
          !nodeTypes.includes(edge.sourceNode.nodeType) ||
          !nodeTypes.includes(edge.targetNode.nodeType)
        ) {
          continue;
        }
      }

      collectedEdges.push(edge);

      const neighborId =
        edge.sourceNodeId === nodeId ? edge.targetNodeId : edge.sourceNodeId;

      if (!visitedNodes.has(neighborId)) {
        queue.push({ nodeId: neighborId, currentDepth: currentDepth + 1 });
      }
    }
  }

  // Fetch all visited nodes
  const nodeIds = Array.from(visitedNodes.keys());
  const nodes = await prisma.knowledgeNode.findMany({
    where: { id: { in: nodeIds } },
  });

  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.nodeType,
      label: n.label,
      weight: n.weight,
      referenceId: n.referenceId,
      depth: visitedNodes.get(n.id) || 0,
    })),
    edges: collectedEdges.map((e) => ({
      id: e.id,
      source: e.sourceNodeId,
      target: e.targetNodeId,
      type: e.edgeType,
      weight: e.weight,
    })),
  };
}

async function getTopNodesGraph(
  maxNodes: number,
  nodeTypes?: string[]
): Promise<GraphData> {
  const nodes = await prisma.knowledgeNode.findMany({
    where: nodeTypes ? { nodeType: { in: nodeTypes as any[] } } : undefined,
    orderBy: { weight: "desc" },
    take: maxNodes,
  });

  const nodeIds = nodes.map((n) => n.id);

  const edges = await prisma.knowledgeEdge.findMany({
    where: {
      sourceNodeId: { in: nodeIds },
      targetNodeId: { in: nodeIds },
    },
  });

  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.nodeType,
      label: n.label,
      weight: n.weight,
      referenceId: n.referenceId,
      depth: 0,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.sourceNodeId,
      target: e.targetNodeId,
      type: e.edgeType,
      weight: e.weight,
    })),
  };
}
```

### Knowledge Graph Visualization

```tsx
// components/explore/KnowledgeGraphExplorer.tsx

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as d3 from "d3";
import { useRouter } from "next/navigation";
import { Search, Filter, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const NODE_COLORS: Record<string, string> = {
  source: "#3b82f6",      // Blue
  topic: "#10b981",       // Green
  deliberation: "#8b5cf6", // Purple
  claim: "#f59e0b",       // Amber
  argument: "#ef4444",    // Red
  author: "#6366f1",      // Indigo
  institution: "#ec4899", // Pink
};

interface KnowledgeGraphExplorerProps {
  initialNodeType?: string;
  initialNodeId?: string;
}

export function KnowledgeGraphExplorer({
  initialNodeType,
  initialNodeId,
}: KnowledgeGraphExplorerProps) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [centerNode, setCenterNode] = useState<{ type: string; id: string } | null>(
    initialNodeType && initialNodeId
      ? { type: initialNodeType, id: initialNodeId }
      : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleNodeTypes, setVisibleNodeTypes] = useState<string[]>([
    "source",
    "topic",
    "deliberation",
  ]);
  const [depth, setDepth] = useState(2);
  const [hoveredNode, setHoveredNode] = useState<any>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["knowledge-graph", centerNode, depth, visibleNodeTypes],
    queryFn: () => {
      const params = new URLSearchParams();
      if (centerNode) {
        params.set("centerType", centerNode.type);
        params.set("centerId", centerNode.id);
      }
      params.set("depth", String(depth));
      params.set("nodeTypes", visibleNodeTypes.join(","));
      return fetch(`/api/knowledge-graph?${params}`).then((r) => r.json());
    },
  });

  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    const container = svg.append("g");

    // Build simulation
    const simulation = d3
      .forceSimulation(data.nodes)
      .force(
        "link",
        d3
          .forceLink(data.edges)
          .id((d: any) => d.id)
          .distance(80)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d: any) => d.weight * 10 + 15));

    // Draw edges
    const link = container
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(data.edges)
      .join("line")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", (d: any) => Math.max(1, d.weight))
      .attr("stroke-opacity", 0.6);

    // Draw nodes
    const node = container
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(drag(simulation) as any);

    // Node circles
    node
      .append("circle")
      .attr("r", (d: any) => d.weight * 5 + 8)
      .attr("fill", (d: any) => NODE_COLORS[d.type] || "#94a3b8")
      .attr("stroke", (d: any) =>
        centerNode && d.referenceId === centerNode.id ? "#000" : "#fff"
      )
      .attr("stroke-width", (d: any) =>
        centerNode && d.referenceId === centerNode.id ? 3 : 2
      );

    // Node labels
    node
      .append("text")
      .text((d: any) => truncate(d.label, 15))
      .attr("text-anchor", "middle")
      .attr("dy", (d: any) => d.weight * 5 + 20)
      .attr("font-size", "11px")
      .attr("fill", "#374151")
      .attr("pointer-events", "none");

    // Type badges
    node
      .append("text")
      .text((d: any) => getTypeEmoji(d.type))
      .attr("text-anchor", "middle")
      .attr("dy", 4)
      .attr("font-size", "12px")
      .attr("pointer-events", "none");

    // Interactions
    node
      .on("mouseenter", (event, d: any) => {
        setHoveredNode(d);
        d3.select(event.currentTarget)
          .select("circle")
          .attr("stroke", "#3b82f6")
          .attr("stroke-width", 3);
      })
      .on("mouseleave", (event, d: any) => {
        setHoveredNode(null);
        d3.select(event.currentTarget)
          .select("circle")
          .attr("stroke", centerNode && d.referenceId === centerNode.id ? "#000" : "#fff")
          .attr("stroke-width", centerNode && d.referenceId === centerNode.id ? 3 : 2);
      })
      .on("click", (event, d: any) => {
        event.stopPropagation();
        handleNodeClick(d);
      })
      .on("dblclick", (event, d: any) => {
        event.stopPropagation();
        setCenterNode({ type: d.type, id: d.referenceId });
      });

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [data, centerNode]);

  const handleNodeClick = (node: any) => {
    const paths: Record<string, string> = {
      source: `/sources/${node.referenceId}`,
      deliberation: `/deliberations/${node.referenceId}`,
      topic: `/search?topic=${encodeURIComponent(node.referenceId)}`,
    };

    const path = paths[node.type];
    if (path) {
      router.push(path);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    // Search for matching nodes and center on first result
    const response = await fetch(
      `/api/knowledge-graph/search?q=${encodeURIComponent(searchQuery)}`
    );
    const results = await response.json();
    if (results.nodes?.length > 0) {
      const first = results.nodes[0];
      setCenterNode({ type: first.type, id: first.referenceId });
    }
  };

  const toggleNodeType = (type: string) => {
    setVisibleNodeTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r p-4 space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Search</label>
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find node..."
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button size="icon" variant="outline" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Node Types</label>
          <div className="space-y-2">
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <label key={type} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={visibleNodeTypes.includes(type)}
                  onCheckedChange={() => toggleNodeType(type)}
                />
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {type}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Depth: {depth}
          </label>
          <input
            type="range"
            min={1}
            max={4}
            value={depth}
            onChange={(e) => setDepth(parseInt(e.target.value, 10))}
            className="w-full"
          />
        </div>

        {centerNode && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setCenterNode(null)}
          >
            Clear Focus
          </Button>
        )}
      </div>

      {/* Graph canvas */}
      <div ref={containerRef} className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}

        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          className="bg-gray-50"
        />

        {/* Hovered node info */}
        {hoveredNode && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: NODE_COLORS[hoveredNode.type] }}
              />
              <span className="text-xs uppercase text-gray-500">
                {hoveredNode.type}
              </span>
            </div>
            <h4 className="font-medium text-sm">{hoveredNode.label}</h4>
            <p className="text-xs text-gray-500 mt-1">
              Click to view · Double-click to explore
            </p>
          </div>
        )}

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button size="icon" variant="outline">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-2">Legend</div>
          <div className="flex flex-wrap gap-3">
            {visibleNodeTypes.map((type) => (
              <div key={type} className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: NODE_COLORS[type] }}
                />
                <span className="text-xs">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function drag(simulation: any) {
  return d3
    .drag()
    .on("start", (event) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    })
    .on("drag", (event) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    })
    .on("end", (event) => {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    });
}

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + "..." : str;
}

function getTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    source: "📄",
    topic: "#",
    deliberation: "💬",
    claim: "💡",
    argument: "⚔️",
    author: "👤",
    institution: "🏛️",
  };
  return emojis[type] || "•";
}
```

### API Endpoints

```typescript
// app/api/knowledge-graph/route.ts

import { NextRequest, NextResponse } from "next/server";
import { queryKnowledgeGraph } from "@/lib/knowledgeGraph/queryGraph";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const centerType = searchParams.get("centerType") || undefined;
  const centerId = searchParams.get("centerId") || undefined;
  const depth = parseInt(searchParams.get("depth") || "2", 10);
  const nodeTypes = searchParams.get("nodeTypes")?.split(",");
  const maxNodes = parseInt(searchParams.get("maxNodes") || "100", 10);

  const graph = await queryKnowledgeGraph({
    centerNodeType: centerType,
    centerNodeId: centerId,
    depth,
    maxNodes,
    nodeTypes,
  });

  return NextResponse.json(graph);
}
```

```typescript
// app/api/knowledge-graph/search/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ nodes: [] });
  }

  const nodes = await prisma.knowledgeNode.findMany({
    where: {
      label: { contains: query, mode: "insensitive" },
    },
    take: 20,
    orderBy: { weight: "desc" },
  });

  return NextResponse.json({ nodes });
}
```

### Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Graph builds | Worker runs → nodes + edges created |
| Query returns subgraph | Request with center → connected nodes returned |
| D3 renders | Component mounts → visualization appears |
| Node filtering works | Toggle type → nodes appear/disappear |
| Search finds nodes | Query → matching nodes returned |
| Click navigates | Single click → goes to entity page |
| Double-click explores | Double click → centers graph on node |
| Zoom/pan works | Interaction → graph responds |

---

## 3.4.2 Related Stacks & Deliberations

**Priority**: P1 — Cross-pollination  
**Estimated Effort**: 3-4 days  
**Risk Level**: Low (similarity computation)

### Problem Statement

Users in a deliberation don't know about:
- Other deliberations discussing similar topics or using similar sources
- Stacks that contain relevant evidence they haven't discovered
- Users with expertise in the same areas

**Goal**: Surface related content based on topic overlap, citation similarity, and participant overlap.

### Similarity Computation

```typescript
// lib/similarity/computeSimilarity.ts

import { prisma } from "@/lib/prismaclient";

interface SimilarityScore {
  id: string;
  type: "deliberation" | "stack";
  title: string;
  score: number;
  reasons: string[];
}

export async function findRelatedDeliberations(
  deliberationId: string,
  limit: number = 10
): Promise<SimilarityScore[]> {
  // Get current deliberation's characteristics
  const current = await prisma.deliberation.findUnique({
    where: { id: deliberationId },
    include: {
      citations: {
        select: { sourceId: true },
      },
      arguments: {
        select: { id: true },
      },
    },
  });

  if (!current) return [];

  const currentSourceIds = new Set(current.citations.map((c) => c.sourceId));

  // Get topics from sources
  const sources = await prisma.source.findMany({
    where: { id: { in: Array.from(currentSourceIds) } },
    select: { topics: true },
  });

  const currentTopics = new Set<string>();
  for (const source of sources) {
    const topics = (source.topics as string[]) || [];
    topics.forEach((t) => currentTopics.add(t));
  }

  // Find other public deliberations
  const otherDelibs = await prisma.deliberation.findMany({
    where: {
      id: { not: deliberationId },
      isPublic: true,
    },
    include: {
      citations: {
        select: { sourceId: true },
      },
    },
  });

  // Score each deliberation
  const scores: SimilarityScore[] = [];

  for (const delib of otherDelibs) {
    const reasons: string[] = [];
    let score = 0;

    // Source overlap
    const delibSourceIds = new Set(delib.citations.map((c) => c.sourceId));
    const sharedSources = [...currentSourceIds].filter((id) =>
      delibSourceIds.has(id)
    );

    if (sharedSources.length > 0) {
      const sourceScore = sharedSources.length * 10;
      score += sourceScore;
      reasons.push(`${sharedSources.length} shared sources`);
    }

    // Topic overlap
    const delibSources = await prisma.source.findMany({
      where: { id: { in: Array.from(delibSourceIds) } },
      select: { topics: true },
    });

    const delibTopics = new Set<string>();
    for (const source of delibSources) {
      const topics = (source.topics as string[]) || [];
      topics.forEach((t) => delibTopics.add(t));
    }

    const sharedTopics = [...currentTopics].filter((t) => delibTopics.has(t));
    if (sharedTopics.length > 0) {
      const topicScore = sharedTopics.length * 5;
      score += topicScore;
      reasons.push(`${sharedTopics.length} shared topics`);
    }

    if (score > 0) {
      scores.push({
        id: delib.id,
        type: "deliberation",
        title: delib.title,
        score,
        reasons,
      });
    }
  }

  // Sort by score and return top N
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function findRelatedStacks(
  deliberationId: string,
  limit: number = 10
): Promise<SimilarityScore[]> {
  // Get current deliberation's sources
  const current = await prisma.deliberation.findUnique({
    where: { id: deliberationId },
    include: {
      citations: {
        select: { sourceId: true },
      },
    },
  });

  if (!current) return [];

  const currentSourceIds = new Set(current.citations.map((c) => c.sourceId));

  // Find stacks with overlapping sources
  const stackItems = await prisma.stackItem.findMany({
    where: {
      sourceId: { in: Array.from(currentSourceIds) },
      stack: {
        visibility: { in: ["public", "unlisted"] },
      },
    },
    include: {
      stack: {
        select: {
          id: true,
          name: true,
          visibility: true,
          _count: { select: { items: true } },
        },
      },
    },
  });

  // Group by stack and count overlaps
  const stackScores = new Map<
    string,
    { stack: any; sharedCount: number }
  >();

  for (const item of stackItems) {
    const existing = stackScores.get(item.stackId);
    if (existing) {
      existing.sharedCount++;
    } else {
      stackScores.set(item.stackId, {
        stack: item.stack,
        sharedCount: 1,
      });
    }
  }

  // Convert to scores
  const scores: SimilarityScore[] = [];

  for (const [stackId, data] of stackScores) {
    const overlapRatio = data.sharedCount / data.stack._count.items;
    const score = data.sharedCount * 10 + overlapRatio * 20;

    scores.push({
      id: stackId,
      type: "stack",
      title: data.stack.name,
      score,
      reasons: [
        `${data.sharedCount} shared sources`,
        `${Math.round(overlapRatio * 100)}% overlap`,
      ],
    });
  }

  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
```

### Related Content Components

```tsx
// components/deliberation/RelatedDeliberations.tsx

"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { MessageSquare, BookOpen, Users } from "lucide-react";

interface RelatedDeliberationsProps {
  deliberationId: string;
  limit?: number;
}

export function RelatedDeliberations({
  deliberationId,
  limit = 5,
}: RelatedDeliberationsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["related-deliberations", deliberationId],
    queryFn: () =>
      fetch(`/api/deliberations/${deliberationId}/related?limit=${limit}`).then(
        (r) => r.json()
      ),
  });

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded" />;
  }

  if (!data?.deliberations || data.deliberations.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-lg p-4">
      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Related Deliberations
      </h4>

      <div className="space-y-3">
        {data.deliberations.map((item: any) => (
          <Link
            key={item.id}
            href={`/deliberations/${item.id}`}
            className="block p-2 -mx-2 rounded hover:bg-gray-50"
          >
            <div className="font-medium text-sm line-clamp-1">{item.title}</div>
            <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
              {item.reasons.map((reason: string, i: number) => (
                <span key={i} className="bg-gray-100 px-2 py-0.5 rounded">
                  {reason}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

```tsx
// components/deliberation/RelatedStacks.tsx

"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Layers } from "lucide-react";

interface RelatedStacksProps {
  deliberationId: string;
  limit?: number;
}

export function RelatedStacks({
  deliberationId,
  limit = 5,
}: RelatedStacksProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["related-stacks", deliberationId],
    queryFn: () =>
      fetch(`/api/deliberations/${deliberationId}/related-stacks?limit=${limit}`).then(
        (r) => r.json()
      ),
  });

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded" />;
  }

  if (!data?.stacks || data.stacks.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-lg p-4">
      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
        <Layers className="h-4 w-4" />
        Related Evidence Stacks
      </h4>

      <div className="space-y-3">
        {data.stacks.map((item: any) => (
          <Link
            key={item.id}
            href={`/stacks/${item.id}`}
            className="block p-2 -mx-2 rounded hover:bg-gray-50"
          >
            <div className="font-medium text-sm">{item.title}</div>
            <div className="text-xs text-gray-500 mt-1">
              {item.reasons.join(" · ")}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

### API Endpoints

```typescript
// app/api/deliberations/[deliberationId]/related/route.ts

import { NextRequest, NextResponse } from "next/server";
import { findRelatedDeliberations } from "@/lib/similarity/computeSimilarity";

export async function GET(
  req: NextRequest,
  { params }: { params: { deliberationId: string } }
) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const deliberations = await findRelatedDeliberations(
    params.deliberationId,
    limit
  );

  return NextResponse.json({ deliberations });
}
```

```typescript
// app/api/deliberations/[deliberationId]/related-stacks/route.ts

import { NextRequest, NextResponse } from "next/server";
import { findRelatedStacks } from "@/lib/similarity/computeSimilarity";

export async function GET(
  req: NextRequest,
  { params }: { params: { deliberationId: string } }
) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const stacks = await findRelatedStacks(params.deliberationId, limit);

  return NextResponse.json({ stacks });
}
```

### Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Related deliberations found | Shared sources → appears in list |
| Related stacks found | Overlapping items → appears in list |
| Score ordering correct | Higher overlap → higher rank |
| Reasons displayed | Shows why related |
| Click navigates | Click item → goes to page |

---

## 3.4.3 Timeline View

**Priority**: P2 — Temporal exploration  
**Estimated Effort**: 3-4 days  
**Risk Level**: Low (visualization layer)

### Problem Statement

Evidence evolves over time:
- When were key sources published?
- How has research in a topic progressed?
- When did specific claims emerge in a deliberation?

Users can't see the temporal dimension of evidence. Everything appears flat.

**Goal**: Provide timeline views showing when sources were published, when they were cited, and how conversations evolved over time.

### Timeline Data Types

```typescript
// lib/timeline/types.ts

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: Date;
  title: string;
  description?: string;
  
  // Reference to entity
  entityType: string;
  entityId: string;
  
  // Metadata for rendering
  color?: string;
  icon?: string;
  importance?: number; // 1-5 scale
}

export type TimelineEventType =
  | "source_published"
  | "source_cited"
  | "argument_created"
  | "deliberation_started"
  | "claim_made"
  | "retraction"
  | "correction";

export interface TimelineFilter {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: TimelineEventType[];
  minImportance?: number;
}

export interface TimelineData {
  events: TimelineEvent[];
  dateRange: {
    earliest: Date;
    latest: Date;
  };
  summary: {
    totalEvents: number;
    byType: Record<string, number>;
    byYear: Record<number, number>;
  };
}
```

### Timeline Builder

```typescript
// lib/timeline/buildTimeline.ts

import { prisma } from "@/lib/prismaclient";
import { TimelineEvent, TimelineFilter, TimelineData } from "./types";

export async function buildSourceTimeline(
  sourceIds: string[],
  filter?: TimelineFilter
): Promise<TimelineData> {
  const events: TimelineEvent[] = [];

  // Get sources with publication dates
  const sources = await prisma.source.findMany({
    where: { id: { in: sourceIds } },
    select: {
      id: true,
      title: true,
      year: true,
      publicationDate: true,
      retractionStatus: true,
      retractionDate: true,
    },
  });

  for (const source of sources) {
    // Publication event
    const pubDate = source.publicationDate || (source.year ? new Date(source.year, 0, 1) : null);
    
    if (pubDate) {
      events.push({
        id: `pub-${source.id}`,
        type: "source_published",
        date: pubDate,
        title: source.title,
        entityType: "source",
        entityId: source.id,
        icon: "📄",
        importance: 3,
      });
    }

    // Retraction event
    if (source.retractionStatus === "retracted" && source.retractionDate) {
      events.push({
        id: `retract-${source.id}`,
        type: "retraction",
        date: source.retractionDate,
        title: `Retracted: ${source.title}`,
        entityType: "source",
        entityId: source.id,
        icon: "⚠️",
        color: "#ef4444",
        importance: 5,
      });
    }
  }

  // Get citation events
  const citations = await prisma.citation.findMany({
    where: { sourceId: { in: sourceIds } },
    select: {
      id: true,
      sourceId: true,
      createdAt: true,
      source: { select: { title: true } },
      deliberation: { select: { title: true } },
    },
  });

  for (const citation of citations) {
    events.push({
      id: `cite-${citation.id}`,
      type: "source_cited",
      date: citation.createdAt,
      title: `Cited in: ${citation.deliberation?.title || "Unknown"}`,
      description: citation.source.title,
      entityType: "citation",
      entityId: citation.id,
      icon: "🔗",
      importance: 2,
    });
  }

  // Apply filters
  let filteredEvents = events;

  if (filter?.startDate) {
    filteredEvents = filteredEvents.filter((e) => e.date >= filter.startDate!);
  }
  if (filter?.endDate) {
    filteredEvents = filteredEvents.filter((e) => e.date <= filter.endDate!);
  }
  if (filter?.eventTypes?.length) {
    filteredEvents = filteredEvents.filter((e) =>
      filter.eventTypes!.includes(e.type)
    );
  }
  if (filter?.minImportance) {
    filteredEvents = filteredEvents.filter(
      (e) => (e.importance || 1) >= filter.minImportance!
    );
  }

  // Sort by date
  filteredEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Build summary
  const byType: Record<string, number> = {};
  const byYear: Record<number, number> = {};

  for (const event of filteredEvents) {
    byType[event.type] = (byType[event.type] || 0) + 1;
    const year = event.date.getFullYear();
    byYear[year] = (byYear[year] || 0) + 1;
  }

  return {
    events: filteredEvents,
    dateRange: {
      earliest: filteredEvents[0]?.date || new Date(),
      latest: filteredEvents[filteredEvents.length - 1]?.date || new Date(),
    },
    summary: {
      totalEvents: filteredEvents.length,
      byType,
      byYear,
    },
  };
}

export async function buildDeliberationTimeline(
  deliberationId: string,
  filter?: TimelineFilter
): Promise<TimelineData> {
  const events: TimelineEvent[] = [];

  // Get deliberation
  const deliberation = await prisma.deliberation.findUnique({
    where: { id: deliberationId },
    select: {
      id: true,
      title: true,
      createdAt: true,
    },
  });

  if (deliberation) {
    events.push({
      id: `delib-start-${deliberation.id}`,
      type: "deliberation_started",
      date: deliberation.createdAt,
      title: "Deliberation started",
      description: deliberation.title,
      entityType: "deliberation",
      entityId: deliberation.id,
      icon: "💬",
      importance: 4,
    });
  }

  // Get arguments
  const arguments_ = await prisma.argument.findMany({
    where: { deliberationId },
    select: {
      id: true,
      conclusion: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  for (const arg of arguments_) {
    events.push({
      id: `arg-${arg.id}`,
      type: "argument_created",
      date: arg.createdAt,
      title: arg.conclusion?.slice(0, 100) || "New argument",
      entityType: "argument",
      entityId: arg.id,
      icon: "⚔️",
      importance: 3,
    });
  }

  // Get citations with source publication dates
  const citations = await prisma.citation.findMany({
    where: { deliberationId },
    include: {
      source: {
        select: {
          id: true,
          title: true,
          year: true,
          publicationDate: true,
        },
      },
    },
  });

  for (const citation of citations) {
    // Citation added event
    events.push({
      id: `cite-${citation.id}`,
      type: "source_cited",
      date: citation.createdAt,
      title: `Source cited: ${citation.source.title.slice(0, 60)}...`,
      entityType: "citation",
      entityId: citation.id,
      icon: "📎",
      importance: 2,
    });
  }

  // Apply filters and sort
  let filteredEvents = events;

  if (filter?.startDate) {
    filteredEvents = filteredEvents.filter((e) => e.date >= filter.startDate!);
  }
  if (filter?.endDate) {
    filteredEvents = filteredEvents.filter((e) => e.date <= filter.endDate!);
  }

  filteredEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  const byType: Record<string, number> = {};
  const byYear: Record<number, number> = {};

  for (const event of filteredEvents) {
    byType[event.type] = (byType[event.type] || 0) + 1;
    const year = event.date.getFullYear();
    byYear[year] = (byYear[year] || 0) + 1;
  }

  return {
    events: filteredEvents,
    dateRange: {
      earliest: filteredEvents[0]?.date || new Date(),
      latest: filteredEvents[filteredEvents.length - 1]?.date || new Date(),
    },
    summary: {
      totalEvents: filteredEvents.length,
      byType,
      byYear,
    },
  };
}
```

### Timeline Visualization Component

```tsx
// components/timeline/TimelineView.tsx

"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Calendar, Filter, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface TimelineViewProps {
  type: "source" | "deliberation" | "stack";
  id: string;
  sourceIds?: string[];
}

const EVENT_COLORS: Record<string, string> = {
  source_published: "#3b82f6",
  source_cited: "#10b981",
  argument_created: "#8b5cf6",
  deliberation_started: "#f59e0b",
  claim_made: "#ec4899",
  retraction: "#ef4444",
  correction: "#f97316",
};

export function TimelineView({ type, id, sourceIds }: TimelineViewProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["timeline", type, id, sourceIds],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("type", type);
      params.set("id", id);
      if (sourceIds) params.set("sourceIds", sourceIds.join(","));
      return fetch(`/api/timeline?${params}`).then((r) => r.json());
    },
  });

  const filteredEvents = useMemo(() => {
    if (!data?.events) return [];
    if (selectedTypes.length === 0) return data.events;
    return data.events.filter((e: any) => selectedTypes.includes(e.type));
  }, [data?.events, selectedTypes]);

  // Group events by year
  const eventsByYear = useMemo(() => {
    const groups: Record<number, any[]> = {};
    for (const event of filteredEvents) {
      const year = new Date(event.date).getFullYear();
      if (!groups[year]) groups[year] = [];
      groups[year].push(event);
    }
    return groups;
  }, [filteredEvents]);

  const toggleEventType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-gray-100 rounded" />;
  }

  const years = Object.keys(eventsByYear)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="flex gap-6">
      {/* Filters sidebar */}
      <div className="w-48 shrink-0">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </h4>

        <div className="space-y-2 mb-4">
          {Object.entries(data?.summary?.byType || {}).map(([eventType, count]) => (
            <label key={eventType} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selectedTypes.length === 0 || selectedTypes.includes(eventType)}
                onCheckedChange={() => toggleEventType(eventType)}
              />
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: EVENT_COLORS[eventType] }}
              />
              <span className="flex-1">{formatEventType(eventType)}</span>
              <span className="text-gray-400">{count as number}</span>
            </label>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="text-xs text-gray-500 mb-2">Zoom</div>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setZoomLevel((z) => Math.min(2, z + 0.25))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-x-auto">
        <div
          className="relative"
          style={{ minHeight: 400, transform: `scaleX(${zoomLevel})`, transformOrigin: "left" }}
        >
          {/* Year headers */}
          <div className="flex border-b mb-4">
            {years.map((year) => (
              <div
                key={year}
                className="flex-1 text-center text-sm font-medium py-2"
                style={{ minWidth: 200 }}
              >
                {year}
              </div>
            ))}
          </div>

          {/* Timeline track */}
          <div className="relative">
            {/* Horizontal line */}
            <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-200" />

            {/* Events */}
            <div className="flex">
              {years.map((year) => (
                <div key={year} className="flex-1" style={{ minWidth: 200 }}>
                  <div className="relative pt-4">
                    {eventsByYear[year].map((event: any, index: number) => (
                      <TimelineEventNode
                        key={event.id}
                        event={event}
                        index={index}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineEventNode({ event, index }: { event: any; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const topOffset = 40 + (index % 4) * 80;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2"
      style={{ top: topOffset }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Connector line */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-gray-300"
        style={{ top: -topOffset + 32, height: topOffset - 32 }}
      />

      {/* Event dot */}
      <div
        className="w-4 h-4 rounded-full border-2 border-white shadow cursor-pointer"
        style={{ backgroundColor: EVENT_COLORS[event.type] || "#6b7280" }}
      />

      {/* Hover card */}
      {isHovered && (
        <div className="absolute left-1/2 -translate-x-1/2 top-6 z-10 w-64 bg-white rounded-lg shadow-lg p-3 border">
          <div className="text-xs text-gray-500 mb-1">
            {format(new Date(event.date), "MMM d, yyyy")}
          </div>
          <div className="text-sm font-medium line-clamp-2">{event.title}</div>
          {event.description && (
            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
              {event.description}
            </div>
          )}
          <Link
            href={getEventLink(event)}
            className="text-xs text-blue-600 mt-2 block hover:underline"
          >
            View →
          </Link>
        </div>
      )}
    </div>
  );
}

function formatEventType(type: string): string {
  const labels: Record<string, string> = {
    source_published: "Published",
    source_cited: "Cited",
    argument_created: "Argument",
    deliberation_started: "Started",
    claim_made: "Claim",
    retraction: "Retraction",
    correction: "Correction",
  };
  return labels[type] || type;
}

function getEventLink(event: any): string {
  switch (event.entityType) {
    case "source":
      return `/sources/${event.entityId}`;
    case "deliberation":
      return `/deliberations/${event.entityId}`;
    case "argument":
      return `/arguments/${event.entityId}`;
    case "citation":
      return "#";
    default:
      return "#";
  }
}
```

### Timeline API Endpoint

```typescript
// app/api/timeline/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  buildSourceTimeline,
  buildDeliberationTimeline,
} from "@/lib/timeline/buildTimeline";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  const sourceIdsParam = searchParams.get("sourceIds");

  if (!type || !id) {
    return NextResponse.json(
      { error: "type and id required" },
      { status: 400 }
    );
  }

  let timeline;

  switch (type) {
    case "deliberation":
      timeline = await buildDeliberationTimeline(id);
      break;
    case "source":
      timeline = await buildSourceTimeline([id]);
      break;
    case "stack":
      // Build from stack's sources
      const sourceIds = sourceIdsParam?.split(",") || [];
      timeline = await buildSourceTimeline(sourceIds);
      break;
    default:
      return NextResponse.json(
        { error: "Invalid type" },
        { status: 400 }
      );
  }

  return NextResponse.json(timeline);
}
```

### Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Source timeline builds | Source IDs → publication + citation events |
| Deliberation timeline builds | Deliberation ID → arguments + citations |
| Events sorted chronologically | Events appear in date order |
| Filter by event type | Toggle type → events filtered |
| Zoom works | Adjust zoom → timeline scales |
| Hover shows details | Hover event → card appears |
| Click navigates | Click link → goes to entity |

---

## 3.4.4 Opposing View Finder

**Priority**: P2 — Intellectual honesty  
**Estimated Effort**: 4-5 days  
**Risk Level**: Medium (requires good intent classification)

### Problem Statement

Confirmation bias is a major challenge in evidence-based discussions:
- Users naturally seek sources that support their views
- Counter-evidence is often overlooked
- Deliberations can become echo chambers

**Goal**: Actively surface sources and arguments that present opposing viewpoints, helping users engage with the strongest counter-arguments.

### Opposing View Detection

```typescript
// lib/opposingViews/findOpposingViews.ts

import { prisma } from "@/lib/prismaclient";

interface OpposingEvidence {
  id: string;
  type: "source" | "argument" | "citation";
  title: string;
  summary?: string;
  oppositionScore: number;  // How strongly it opposes
  oppositionReason: string;
  sourceUrl?: string;
}

interface OpposingViewsResult {
  forClaim: OpposingEvidence[];
  forArgument: OpposingEvidence[];
  fromOtherDeliberations: OpposingEvidence[];
  suggestions: string[];
}

export async function findOpposingViews(
  targetType: "claim" | "argument" | "deliberation",
  targetId: string
): Promise<OpposingViewsResult> {
  const result: OpposingViewsResult = {
    forClaim: [],
    forArgument: [],
    fromOtherDeliberations: [],
    suggestions: [],
  };

  if (targetType === "argument") {
    // Find counter-citations for this argument
    const argument = await prisma.argument.findUnique({
      where: { id: targetId },
      include: {
        citations: {
          where: { intent: { in: ["refutes", "challenges", "qualifies"] } },
          include: {
            source: {
              select: {
                id: true,
                title: true,
                abstract: true,
                url: true,
              },
            },
          },
        },
        // Get the conclusion to find opposing arguments
      },
    });

    if (argument) {
      // Existing refuting citations
      for (const citation of argument.citations) {
        result.forArgument.push({
          id: citation.id,
          type: "citation",
          title: citation.source.title,
          summary: citation.source.abstract?.slice(0, 200),
          oppositionScore: citation.intent === "refutes" ? 1 : 0.7,
          oppositionReason: `Cited as ${citation.intent}`,
          sourceUrl: citation.source.url || undefined,
        });
      }

      // Find other arguments with opposing conclusions
      const opposingArgs = await findOpposingArguments(argument);
      for (const oppArg of opposingArgs) {
        result.forArgument.push({
          id: oppArg.id,
          type: "argument",
          title: oppArg.conclusion || "Opposing argument",
          oppositionScore: oppArg.score,
          oppositionReason: oppArg.reason,
        });
      }
    }
  }

  if (targetType === "deliberation") {
    // For a deliberation, find sources used to refute across all arguments
    const deliberation = await prisma.deliberation.findUnique({
      where: { id: targetId },
      include: {
        citations: {
          where: { intent: "refutes" },
          include: {
            source: {
              select: { id: true, title: true, abstract: true, url: true },
            },
          },
        },
        arguments: {
          select: { id: true, conclusion: true },
        },
      },
    });

    if (deliberation) {
      // Get refuting sources
      for (const citation of deliberation.citations) {
        result.forClaim.push({
          id: citation.sourceId,
          type: "source",
          title: citation.source.title,
          summary: citation.source.abstract?.slice(0, 200),
          oppositionScore: 0.9,
          oppositionReason: "Used to refute a claim",
          sourceUrl: citation.source.url || undefined,
        });
      }

      // Find opposing views from other deliberations
      const otherOpposing = await findOpposingFromOtherDeliberations(
        targetId,
        deliberation.arguments.map((a) => a.conclusion).filter(Boolean) as string[]
      );
      result.fromOtherDeliberations = otherOpposing;
    }
  }

  // Generate suggestions for finding more opposing views
  result.suggestions = generateOpposingSearchSuggestions(targetType, targetId);

  return result;
}

async function findOpposingArguments(argument: any): Promise<
  Array<{ id: string; conclusion: string | null; score: number; reason: string }>
> {
  // Find arguments in the same deliberation that attack this one
  const attacks = await prisma.argumentAttack.findMany({
    where: {
      targetArgumentId: argument.id,
    },
    include: {
      attackingArgument: {
        select: { id: true, conclusion: true },
      },
    },
  });

  return attacks.map((attack) => ({
    id: attack.attackingArgument.id,
    conclusion: attack.attackingArgument.conclusion,
    score: 0.9,
    reason: `Attacks this argument (${attack.attackType})`,
  }));
}

async function findOpposingFromOtherDeliberations(
  deliberationId: string,
  claims: string[]
): Promise<OpposingEvidence[]> {
  // This would use semantic search to find opposing arguments in other deliberations
  // Simplified implementation: find refuting citations in related deliberations

  // Get topics from this deliberation's sources
  const citations = await prisma.citation.findMany({
    where: { deliberationId },
    include: { source: { select: { topics: true } } },
  });

  const topics = new Set<string>();
  for (const c of citations) {
    const t = (c.source.topics as string[]) || [];
    t.forEach((topic) => topics.add(topic));
  }

  if (topics.size === 0) return [];

  // Find other deliberations with same topics
  const otherSources = await prisma.source.findMany({
    where: {
      topics: { hasSome: Array.from(topics) },
    },
    select: { id: true },
  });

  const otherCitations = await prisma.citation.findMany({
    where: {
      sourceId: { in: otherSources.map((s) => s.id) },
      deliberationId: { not: deliberationId },
      intent: "refutes",
    },
    include: {
      source: { select: { id: true, title: true, abstract: true } },
      deliberation: { select: { title: true } },
    },
    take: 10,
  });

  return otherCitations.map((c) => ({
    id: c.id,
    type: "source" as const,
    title: c.source.title,
    summary: `Used to refute in "${c.deliberation?.title}"`,
    oppositionScore: 0.7,
    oppositionReason: "Counter-evidence from related discussion",
  }));
}

function generateOpposingSearchSuggestions(
  targetType: string,
  targetId: string
): string[] {
  // Generate search queries to help find opposing views
  return [
    "criticism of [topic]",
    "[topic] debunked",
    "problems with [topic]",
    "counter-arguments to [topic]",
    "[topic] limitations",
  ];
}
```

### Opposing Views Component

```tsx
// components/deliberation/OpposingViewFinder.tsx

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Scale, AlertTriangle, Search, ExternalLink, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface OpposingViewFinderProps {
  targetType: "claim" | "argument" | "deliberation";
  targetId: string;
}

export function OpposingViewFinder({
  targetType,
  targetId,
}: OpposingViewFinderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["opposing-views", targetType, targetId],
    queryFn: () =>
      fetch(`/api/opposing-views?type=${targetType}&id=${targetId}`).then((r) =>
        r.json()
      ),
    enabled: isOpen,
  });

  const totalOpposing =
    (data?.forClaim?.length || 0) +
    (data?.forArgument?.length || 0) +
    (data?.fromOtherDeliberations?.length || 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Find Opposing Views
            {totalOpposing > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                {totalOpposing} found
              </span>
            )}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-100 rounded" />
            <div className="h-16 bg-gray-100 rounded" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Info banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <AlertTriangle className="h-4 w-4 inline mr-2" />
              Engaging with opposing views strengthens your argument. These are sources and arguments that challenge or contradict the current position.
            </div>

            {/* Opposing from current context */}
            {data?.forArgument?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Counter-Evidence ({data.forArgument.length})
                </h4>
                <div className="space-y-2">
                  {data.forArgument.map((item: any) => (
                    <OpposingViewCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {data?.forClaim?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Refuting Sources ({data.forClaim.length})
                </h4>
                <div className="space-y-2">
                  {data.forClaim.map((item: any) => (
                    <OpposingViewCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* From other deliberations */}
            {data?.fromOtherDeliberations?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">
                  From Other Discussions ({data.fromOtherDeliberations.length})
                </h4>
                <div className="space-y-2">
                  {data.fromOtherDeliberations.map((item: any) => (
                    <OpposingViewCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Search suggestions */}
            {data?.suggestions?.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">
                  Search for More Counter-Evidence
                </h4>
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="Search academic databases..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button variant="outline">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.suggestions.map((suggestion: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSearchQuery(suggestion)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {totalOpposing === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Scale className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No opposing views found yet.</p>
                <p className="text-xs mt-1">
                  Try searching academic databases or add counter-evidence manually.
                </p>
              </div>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function OpposingViewCard({ item }: { item: any }) {
  return (
    <div className="p-3 border rounded-lg hover:border-amber-300 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="text-sm font-medium line-clamp-2">{item.title}</div>
          {item.summary && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {item.summary}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
              {item.oppositionReason}
            </span>
            <OppositionStrengthBadge score={item.oppositionScore} />
          </div>
        </div>

        <div className="flex gap-1">
          {item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ExternalLink className="h-4 w-4 text-gray-500" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function OppositionStrengthBadge({ score }: { score: number }) {
  const strength = score >= 0.8 ? "Strong" : score >= 0.5 ? "Moderate" : "Weak";
  const color =
    score >= 0.8
      ? "text-red-600 bg-red-50"
      : score >= 0.5
        ? "text-amber-600 bg-amber-50"
        : "text-gray-600 bg-gray-50";

  return (
    <span className={`text-xs px-2 py-0.5 rounded ${color}`}>
      {strength}
    </span>
  );
}
```

### Opposing Views API

```typescript
// app/api/opposing-views/route.ts

import { NextRequest, NextResponse } from "next/server";
import { findOpposingViews } from "@/lib/opposingViews/findOpposingViews";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as "claim" | "argument" | "deliberation";
  const id = searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json(
      { error: "type and id required" },
      { status: 400 }
    );
  }

  const opposingViews = await findOpposingViews(type, id);

  return NextResponse.json(opposingViews);
}
```

### Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Finds refuting citations | Argument with refutes → appears in list |
| Finds attacking arguments | Argument attack exists → appears |
| Cross-deliberation search | Related delib has refutes → appears |
| Score reflects strength | Direct refute → higher score |
| Suggestions generated | View opens → search suggestions shown |
| Collapsible works | Toggle → panel expands/collapses |
| Links work | Click source → opens source |

---

## Phase 3.4 Completion Checklist

### Pre-Launch Requirements

| Item | Owner | Status |
|------|-------|--------|
| KnowledgeNode model + migration | Backend | ☐ |
| KnowledgeEdge model + migration | Backend | ☐ |
| Graph builder worker | Backend | ☐ |
| Graph query API | Backend | ☐ |
| Graph search API | Backend | ☐ |
| Knowledge graph explorer component | Frontend | ☐ |
| Similarity computation | Backend | ☐ |
| Related deliberations API | Backend | ☐ |
| Related stacks API | Backend | ☐ |
| Related deliberations component | Frontend | ☐ |
| Related stacks component | Frontend | ☐ |
| Timeline builder | Backend | ☐ |
| Timeline API | Backend | ☐ |
| Timeline visualization component | Frontend | ☐ |
| Opposing view finder | Backend | ☐ |
| Opposing views API | Backend | ☐ |
| Opposing view finder component | Frontend | ☐ |

### Testing Requirements

| Test Type | Coverage |
|-----------|----------|
| Unit tests | Graph query traversal |
| Unit tests | Similarity scoring |
| Unit tests | Timeline event generation |
| Unit tests | Opposition detection |
| Integration tests | Full graph build pipeline |
| Integration tests | Timeline from deliberation |
| E2E tests | Knowledge graph interaction |
| E2E tests | Timeline navigation |
| Performance tests | Large graph rendering |

### External Dependencies

| Dependency | Required | Notes |
|------------|----------|-------|
| D3.js | Yes | For graph and timeline visualizations |
| date-fns | Yes | For timeline date handling |

---

**Estimated Phase 3.4 Duration**: 3-4 weeks

---

*End of Part 7. Continue with Part 8 for Phase 3.5 (AI-Enhanced Features) and Final Summary.*
