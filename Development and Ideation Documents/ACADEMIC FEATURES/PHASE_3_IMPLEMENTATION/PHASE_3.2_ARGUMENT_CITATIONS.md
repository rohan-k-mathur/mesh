# Phase 3.2: Argument-Level Citations — Part 1

**Sub-Phase:** 3.2 of 3.3  
**Focus:** Argument Citation Model, Permalinks & Context Tracking

---

## User Stories

| ID | Story | Priority | Effort |
|----|-------|----------|--------|
| 3.2.1 | As a scholar, I want to cite a specific argument (not just a paper), so I can give precise credit | P0 | L |
| 3.2.2 | As a reader, I want permanent links to arguments, so citations don't break | P0 | M |
| 3.2.3 | As an author, I want to see where my arguments are cited, so I can track impact | P1 | M |
| 3.2.4 | As a researcher, I want to understand the context when an argument is cited, so I know how it's being used | P1 | M |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Argument Citation Layer                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   Argument   │     │ ArgumentCite │     │   Citing     │    │
│  │  (Cited)     │────▶│  (Junction)  │◀────│  Argument    │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│         │                    │                    │             │
│         │                    ▼                    │             │
│         │           ┌──────────────┐              │             │
│         │           │  Citation    │              │             │
│         │           │   Context    │              │             │
│         │           │ (how/why)    │              │             │
│         │           └──────────────┘              │             │
│         │                                         │             │
│         ▼                                         ▼             │
│  ┌──────────────┐                        ┌──────────────┐       │
│  │  Permalink   │                        │   Citation   │       │
│  │  (Stable)    │                        │   Metrics    │       │
│  └──────────────┘                        └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 3.2.1: Schema Additions

**File:** `prisma/schema.prisma` (additions)

```prisma
// ============================================================
// ARGUMENT CITATION MODELS
// ============================================================

/// Citation relationship between arguments
model ArgumentCitation {
  id                String   @id @default(cuid())
  
  // Citation direction
  citingArgumentId  String
  citingArgument    Argument @relation("CitingArguments", fields: [citingArgumentId], references: [id], onDelete: Cascade)
  
  citedArgumentId   String
  citedArgument     Argument @relation("CitedByArguments", fields: [citedArgumentId], references: [id], onDelete: Cascade)
  
  // Citation context
  citationType      CitationType @default(SUPPORT)
  context           String?      @db.Text   // Why this argument is being cited
  excerpt           String?      @db.Text   // Relevant excerpt from cited argument
  
  // Location in citing argument
  citedInPremiseId  String?      // Which premise cites this
  citedInPremise    Claim?       @relation("PremiseCitations", fields: [citedInPremiseId], references: [id])
  
  // Metadata
  createdAt         DateTime @default(now())
  createdById       String
  createdBy         User     @relation(fields: [createdById], references: [id])
  
  // Indexes
  @@unique([citingArgumentId, citedArgumentId])
  @@index([citedArgumentId])
  @@index([citingArgumentId])
  @@index([citationType])
}

/// Type of citation relationship
enum CitationType {
  SUPPORT        // Citing to build upon
  EXTEND         // Extending the argument
  CONTRAST       // Citing to compare/contrast
  REBUT          // Citing to refute
  QUALIFY        // Adding nuance/conditions
  APPLY          // Applying to new context
  SYNTHESIZE     // Combining with other arguments
  CRITIQUE       // Methodological critique
}

/// Stable permalink for arguments
model ArgumentPermalink {
  id            String   @id @default(cuid())
  
  // Permalink identifier
  shortCode     String   @unique @db.VarChar(12)  // e.g., "arg:a7x9k2"
  slug          String?  @unique                   // Optional human-readable slug
  
  // Target
  argumentId    String   @unique
  argument      Argument @relation(fields: [argumentId], references: [id], onDelete: Cascade)
  
  // Permalink metadata
  version       Int      @default(1)              // Bumped if argument significantly changes
  createdAt     DateTime @default(now())
  
  // Access tracking
  accessCount   Int      @default(0)
  lastAccessedAt DateTime?
  
  @@index([shortCode])
  @@index([slug])
}

/// Citation analytics/metrics per argument
model ArgumentCitationMetrics {
  id            String   @id @default(cuid())
  
  argumentId    String   @unique
  argument      Argument @relation(fields: [argumentId], references: [id], onDelete: Cascade)
  
  // Citation counts
  totalCitations      Int @default(0)
  supportCitations    Int @default(0)
  rebuttalCitations   Int @default(0)
  extendCitations     Int @default(0)
  
  // Quality metrics
  citingDeliberations Int @default(0)   // Number of unique deliberations citing this
  citingUsers         Int @default(0)   // Number of unique users citing this
  
  // Time-based metrics
  citationsLastWeek   Int @default(0)
  citationsLastMonth  Int @default(0)
  
  updatedAt     DateTime @updatedAt
  
  @@index([totalCitations])
}

// Add relations to Argument model
// (In existing Argument model, add:)
//   citationsMade     ArgumentCitation[]  @relation("CitingArguments")
//   citationsReceived ArgumentCitation[]  @relation("CitedByArguments")
//   permalink         ArgumentPermalink?
//   citationMetrics   ArgumentCitationMetrics?
```

---

### Step 3.2.2: Type Definitions

**File:** `lib/citations/types.ts`

```typescript
/**
 * Types for argument-level citations
 */

export type CitationType =
  | "SUPPORT"
  | "EXTEND"
  | "CONTRAST"
  | "REBUT"
  | "QUALIFY"
  | "APPLY"
  | "SYNTHESIZE"
  | "CRITIQUE";

export const CITATION_TYPE_LABELS: Record<CitationType, { label: string; description: string; color: string }> = {
  SUPPORT: {
    label: "Supports",
    description: "Building upon this argument",
    color: "green",
  },
  EXTEND: {
    label: "Extends",
    description: "Extending to new territory",
    color: "blue",
  },
  CONTRAST: {
    label: "Contrasts",
    description: "Comparing or contrasting views",
    color: "purple",
  },
  REBUT: {
    label: "Rebuts",
    description: "Offering a counterargument",
    color: "red",
  },
  QUALIFY: {
    label: "Qualifies",
    description: "Adding conditions or nuance",
    color: "amber",
  },
  APPLY: {
    label: "Applies",
    description: "Applying to a new context",
    color: "cyan",
  },
  SYNTHESIZE: {
    label: "Synthesizes",
    description: "Combining with other arguments",
    color: "indigo",
  },
  CRITIQUE: {
    label: "Critiques",
    description: "Methodological or structural critique",
    color: "orange",
  },
};

export interface ArgumentCitationInput {
  citingArgumentId: string;
  citedArgumentId: string;
  citationType: CitationType;
  context?: string;
  excerpt?: string;
  citedInPremiseId?: string;
}

export interface ArgumentCitationSummary {
  id: string;
  citationType: CitationType;
  context?: string;
  excerpt?: string;
  citingArgument: {
    id: string;
    summary: string;
    author: { id: string; name: string };
    deliberation: { id: string; title: string };
  };
  citedArgument: {
    id: string;
    summary: string;
    author: { id: string; name: string };
    deliberation: { id: string; title: string };
  };
  createdAt: Date;
}

export interface ArgumentPermalinkInfo {
  shortCode: string;
  slug?: string;
  url: string;
  argumentId: string;
  version: number;
  accessCount: number;
}

export interface CitationMetrics {
  totalCitations: number;
  byType: Record<CitationType, number>;
  citingDeliberations: number;
  citingUsers: number;
  recentTrend: "increasing" | "stable" | "decreasing";
  topCiters: Array<{ userId: string; userName: string; count: number }>;
}

export interface ArgumentWithCitations {
  id: string;
  summary: string;
  permalink: ArgumentPermalinkInfo | null;
  citationsMade: ArgumentCitationSummary[];
  citationsReceived: ArgumentCitationSummary[];
  metrics: CitationMetrics | null;
}

export interface CitationGraphNode {
  id: string;
  type: "argument" | "deliberation";
  label: string;
  author?: string;
  citationCount: number;
}

export interface CitationGraphEdge {
  source: string;
  target: string;
  citationType: CitationType;
  weight: number;
}

export interface CitationGraph {
  nodes: CitationGraphNode[];
  edges: CitationGraphEdge[];
}
```

---

### Step 3.2.3: Permalink Service

**File:** `lib/citations/permalinkService.ts`

```typescript
/**
 * Service for managing argument permalinks
 */

import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import slugify from "slugify";
import { ArgumentPermalinkInfo } from "./types";

const PERMALINK_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://mesh.app";

/**
 * Generate a short code for permalinks
 */
function generateShortCode(): string {
  const bytes = crypto.randomBytes(6);
  // Use base62 encoding (alphanumeric)
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = "arg:";
  for (const byte of bytes) {
    result += chars[byte % 62];
  }
  return result;
}

/**
 * Generate a human-readable slug from argument text
 */
function generateSlug(text: string, deliberationTitle: string): string {
  const combined = `${deliberationTitle}-${text}`.slice(0, 100);
  return slugify(combined, {
    lower: true,
    strict: true,
    trim: true,
  });
}

/**
 * Get or create a permalink for an argument
 */
export async function getOrCreatePermalink(
  argumentId: string
): Promise<ArgumentPermalinkInfo> {
  // Check for existing permalink
  const existing = await prisma.argumentPermalink.findUnique({
    where: { argumentId },
  });

  if (existing) {
    return formatPermalinkInfo(existing);
  }

  // Get argument details for slug generation
  const argument = await prisma.argument.findUnique({
    where: { id: argumentId },
    include: {
      conclusion: { select: { text: true } },
      deliberation: { select: { title: true } },
    },
  });

  if (!argument) {
    throw new Error("Argument not found");
  }

  // Generate unique short code
  let shortCode = generateShortCode();
  let attempts = 0;
  while (attempts < 10) {
    const exists = await prisma.argumentPermalink.findUnique({
      where: { shortCode },
    });
    if (!exists) break;
    shortCode = generateShortCode();
    attempts++;
  }

  // Generate slug
  const conclusionText = argument.conclusion?.text || "argument";
  const slug = generateSlug(conclusionText, argument.deliberation.title);

  // Create permalink
  const permalink = await prisma.argumentPermalink.create({
    data: {
      argumentId,
      shortCode,
      slug,
    },
  });

  return formatPermalinkInfo(permalink);
}

/**
 * Resolve a permalink to an argument
 */
export async function resolvePermalink(
  identifier: string
): Promise<{ argumentId: string; version: number } | null> {
  // Try short code first
  let permalink = await prisma.argumentPermalink.findUnique({
    where: { shortCode: identifier },
  });

  // Try slug if not found
  if (!permalink) {
    permalink = await prisma.argumentPermalink.findUnique({
      where: { slug: identifier },
    });
  }

  if (!permalink) return null;

  // Update access stats
  await prisma.argumentPermalink.update({
    where: { id: permalink.id },
    data: {
      accessCount: { increment: 1 },
      lastAccessedAt: new Date(),
    },
  });

  return {
    argumentId: permalink.argumentId,
    version: permalink.version,
  };
}

/**
 * Get permalink info for display
 */
export async function getPermalinkInfo(
  argumentId: string
): Promise<ArgumentPermalinkInfo | null> {
  const permalink = await prisma.argumentPermalink.findUnique({
    where: { argumentId },
  });

  if (!permalink) return null;
  return formatPermalinkInfo(permalink);
}

/**
 * Bump permalink version (when argument significantly changes)
 */
export async function bumpPermalinkVersion(argumentId: string) {
  return prisma.argumentPermalink.update({
    where: { argumentId },
    data: {
      version: { increment: 1 },
    },
  });
}

/**
 * Format permalink for API response
 */
function formatPermalinkInfo(permalink: any): ArgumentPermalinkInfo {
  return {
    shortCode: permalink.shortCode,
    slug: permalink.slug || undefined,
    url: `${PERMALINK_BASE_URL}/a/${permalink.shortCode}`,
    argumentId: permalink.argumentId,
    version: permalink.version,
    accessCount: permalink.accessCount,
  };
}

/**
 * Generate copy-friendly citation text
 */
export async function generateCitationText(
  argumentId: string,
  format: "apa" | "mla" | "chicago" | "bibtex" = "apa"
): Promise<string> {
  const argument = await prisma.argument.findUnique({
    where: { id: argumentId },
    include: {
      createdBy: { select: { name: true } },
      conclusion: { select: { text: true } },
      deliberation: { select: { title: true } },
      permalink: true,
    },
  });

  if (!argument) throw new Error("Argument not found");

  const author = argument.createdBy.name;
  const title = argument.conclusion?.text || "Untitled argument";
  const deliberation = argument.deliberation.title;
  const year = argument.createdAt.getFullYear();
  const url = argument.permalink
    ? `${PERMALINK_BASE_URL}/a/${argument.permalink.shortCode}`
    : `${PERMALINK_BASE_URL}/arguments/${argumentId}`;
  const accessed = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  switch (format) {
    case "apa":
      return `${author}. (${year}). ${title}. In ${deliberation}. Mesh. ${url}`;

    case "mla":
      return `${author}. "${title}." ${deliberation}, Mesh, ${year}, ${url}. Accessed ${accessed}.`;

    case "chicago":
      return `${author}. "${title}." ${deliberation}. Mesh, ${year}. ${url}.`;

    case "bibtex":
      const key = slugify(`${author.split(" ")[0]}${year}`, { lower: true });
      return `@misc{${key},
  author = {${author}},
  title = {${title}},
  howpublished = {\\url{${url}}},
  year = {${year}},
  note = {In ${deliberation}, Mesh platform}
}`;

    default:
      return url;
  }
}
```

---

### Step 3.2.4: Citation Service

**File:** `lib/citations/citationService.ts`

```typescript
/**
 * Service for managing argument citations
 */

import { prisma } from "@/lib/prisma";
import {
  ArgumentCitationInput,
  ArgumentCitationSummary,
  CitationType,
  CitationMetrics,
  ArgumentWithCitations,
} from "./types";

/**
 * Create a citation between arguments
 */
export async function createCitation(
  input: ArgumentCitationInput,
  userId: string
): Promise<ArgumentCitationSummary> {
  // Prevent self-citation
  if (input.citingArgumentId === input.citedArgumentId) {
    throw new Error("Cannot cite the same argument");
  }

  // Check both arguments exist
  const [citingArg, citedArg] = await Promise.all([
    prisma.argument.findUnique({ where: { id: input.citingArgumentId } }),
    prisma.argument.findUnique({ where: { id: input.citedArgumentId } }),
  ]);

  if (!citingArg || !citedArg) {
    throw new Error("One or both arguments not found");
  }

  // Create citation
  const citation = await prisma.argumentCitation.create({
    data: {
      citingArgumentId: input.citingArgumentId,
      citedArgumentId: input.citedArgumentId,
      citationType: input.citationType,
      context: input.context,
      excerpt: input.excerpt,
      citedInPremiseId: input.citedInPremiseId,
      createdById: userId,
    },
    include: {
      citingArgument: {
        include: {
          createdBy: { select: { id: true, name: true } },
          conclusion: { select: { text: true } },
          deliberation: { select: { id: true, title: true } },
        },
      },
      citedArgument: {
        include: {
          createdBy: { select: { id: true, name: true } },
          conclusion: { select: { text: true } },
          deliberation: { select: { id: true, title: true } },
        },
      },
    },
  });

  // Update citation metrics for cited argument
  await updateCitationMetrics(input.citedArgumentId);

  return formatCitationSummary(citation);
}

/**
 * Get all citations for an argument
 */
export async function getArgumentCitations(
  argumentId: string
): Promise<ArgumentWithCitations | null> {
  const argument = await prisma.argument.findUnique({
    where: { id: argumentId },
    include: {
      conclusion: { select: { text: true } },
      permalink: true,
      citationsMade: {
        include: {
          citedArgument: {
            include: {
              createdBy: { select: { id: true, name: true } },
              conclusion: { select: { text: true } },
              deliberation: { select: { id: true, title: true } },
            },
          },
          citingArgument: {
            include: {
              createdBy: { select: { id: true, name: true } },
              conclusion: { select: { text: true } },
              deliberation: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      citationsReceived: {
        include: {
          citingArgument: {
            include: {
              createdBy: { select: { id: true, name: true } },
              conclusion: { select: { text: true } },
              deliberation: { select: { id: true, title: true } },
            },
          },
          citedArgument: {
            include: {
              createdBy: { select: { id: true, name: true } },
              conclusion: { select: { text: true } },
              deliberation: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      citationMetrics: true,
    },
  });

  if (!argument) return null;

  return {
    id: argument.id,
    summary: argument.conclusion?.text || "Argument",
    permalink: argument.permalink
      ? {
          shortCode: argument.permalink.shortCode,
          slug: argument.permalink.slug || undefined,
          url: `${process.env.NEXT_PUBLIC_APP_URL}/a/${argument.permalink.shortCode}`,
          argumentId: argument.id,
          version: argument.permalink.version,
          accessCount: argument.permalink.accessCount,
        }
      : null,
    citationsMade: argument.citationsMade.map(formatCitationSummary),
    citationsReceived: argument.citationsReceived.map(formatCitationSummary),
    metrics: argument.citationMetrics
      ? formatCitationMetrics(argument.citationMetrics)
      : null,
  };
}

/**
 * Get citations received by an argument (who cites this)
 */
export async function getCitationsReceived(
  argumentId: string,
  citationType?: CitationType
) {
  const where: any = { citedArgumentId: argumentId };
  if (citationType) {
    where.citationType = citationType;
  }

  const citations = await prisma.argumentCitation.findMany({
    where,
    include: {
      citingArgument: {
        include: {
          createdBy: { select: { id: true, name: true } },
          conclusion: { select: { text: true } },
          deliberation: { select: { id: true, title: true } },
        },
      },
      citedArgument: {
        include: {
          createdBy: { select: { id: true, name: true } },
          conclusion: { select: { text: true } },
          deliberation: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return citations.map(formatCitationSummary);
}

/**
 * Get citations made by an argument (what this cites)
 */
export async function getCitationsMade(
  argumentId: string,
  citationType?: CitationType
) {
  const where: any = { citingArgumentId: argumentId };
  if (citationType) {
    where.citationType = citationType;
  }

  const citations = await prisma.argumentCitation.findMany({
    where,
    include: {
      citedArgument: {
        include: {
          createdBy: { select: { id: true, name: true } },
          conclusion: { select: { text: true } },
          deliberation: { select: { id: true, title: true } },
        },
      },
      citingArgument: {
        include: {
          createdBy: { select: { id: true, name: true } },
          conclusion: { select: { text: true } },
          deliberation: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return citations.map(formatCitationSummary);
}

/**
 * Delete a citation
 */
export async function deleteCitation(citationId: string, userId: string) {
  const citation = await prisma.argumentCitation.findUnique({
    where: { id: citationId },
    select: { citedArgumentId: true, createdById: true },
  });

  if (!citation) throw new Error("Citation not found");
  if (citation.createdById !== userId) {
    throw new Error("Can only delete your own citations");
  }

  await prisma.argumentCitation.delete({
    where: { id: citationId },
  });

  // Update metrics
  await updateCitationMetrics(citation.citedArgumentId);
}

/**
 * Update citation metrics for an argument
 */
async function updateCitationMetrics(argumentId: string) {
  const citations = await prisma.argumentCitation.findMany({
    where: { citedArgumentId: argumentId },
    include: {
      citingArgument: {
        select: { deliberationId: true, createdById: true },
      },
    },
  });

  const byType: Record<string, number> = {};
  const deliberations = new Set<string>();
  const users = new Set<string>();

  for (const c of citations) {
    byType[c.citationType] = (byType[c.citationType] || 0) + 1;
    deliberations.add(c.citingArgument.deliberationId);
    users.add(c.citingArgument.createdById);
  }

  // Calculate time-based metrics
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const citationsLastWeek = citations.filter(
    (c) => c.createdAt >= oneWeekAgo
  ).length;
  const citationsLastMonth = citations.filter(
    (c) => c.createdAt >= oneMonthAgo
  ).length;

  await prisma.argumentCitationMetrics.upsert({
    where: { argumentId },
    create: {
      argumentId,
      totalCitations: citations.length,
      supportCitations: byType.SUPPORT || 0,
      rebuttalCitations: byType.REBUT || 0,
      extendCitations: byType.EXTEND || 0,
      citingDeliberations: deliberations.size,
      citingUsers: users.size,
      citationsLastWeek,
      citationsLastMonth,
    },
    update: {
      totalCitations: citations.length,
      supportCitations: byType.SUPPORT || 0,
      rebuttalCitations: byType.REBUT || 0,
      extendCitations: byType.EXTEND || 0,
      citingDeliberations: deliberations.size,
      citingUsers: users.size,
      citationsLastWeek,
      citationsLastMonth,
    },
  });
}

/**
 * Format citation for API response
 */
function formatCitationSummary(citation: any): ArgumentCitationSummary {
  return {
    id: citation.id,
    citationType: citation.citationType as CitationType,
    context: citation.context || undefined,
    excerpt: citation.excerpt || undefined,
    citingArgument: {
      id: citation.citingArgument.id,
      summary:
        citation.citingArgument.conclusion?.text || "Argument",
      author: citation.citingArgument.createdBy,
      deliberation: citation.citingArgument.deliberation,
    },
    citedArgument: {
      id: citation.citedArgument.id,
      summary:
        citation.citedArgument.conclusion?.text || "Argument",
      author: citation.citedArgument.createdBy,
      deliberation: citation.citedArgument.deliberation,
    },
    createdAt: citation.createdAt,
  };
}

/**
 * Format metrics for API response
 */
function formatCitationMetrics(metrics: any): CitationMetrics {
  const total = metrics.totalCitations;
  const lastMonth = metrics.citationsLastMonth;
  const lastWeek = metrics.citationsLastWeek;

  // Determine trend
  let recentTrend: "increasing" | "stable" | "decreasing" = "stable";
  if (lastWeek > lastMonth / 4) {
    recentTrend = "increasing";
  } else if (lastWeek < lastMonth / 8) {
    recentTrend = "decreasing";
  }

  return {
    totalCitations: total,
    byType: {
      SUPPORT: metrics.supportCitations,
      EXTEND: metrics.extendCitations,
      CONTRAST: 0, // Would need to track these
      REBUT: metrics.rebuttalCitations,
      QUALIFY: 0,
      APPLY: 0,
      SYNTHESIZE: 0,
      CRITIQUE: 0,
    },
    citingDeliberations: metrics.citingDeliberations,
    citingUsers: metrics.citingUsers,
    recentTrend,
    topCiters: [], // Would require additional query
  };
}
```

---

## Phase 3.2 Part 1 Complete

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Citation schema | `prisma/schema.prisma` | 📋 Part 1 |
| 2 | Permalink schema | `prisma/schema.prisma` | 📋 Part 1 |
| 3 | Metrics schema | `prisma/schema.prisma` | 📋 Part 1 |
| 4 | Citation types | `lib/citations/types.ts` | 📋 Part 1 |
| 5 | Permalink service | `lib/citations/permalinkService.ts` | 📋 Part 1 |
| 6 | Citation service | `lib/citations/citationService.ts` | 📋 Part 1 |

---

## Next: Part 2

Continue to Phase 3.2 Part 2 for:
- Citation Graph Service
- API routes
- UI components (CitationCard, CitationGraph, PermalinkCopyButton, etc.)

---

*End of Phase 3.2 Part 1*
