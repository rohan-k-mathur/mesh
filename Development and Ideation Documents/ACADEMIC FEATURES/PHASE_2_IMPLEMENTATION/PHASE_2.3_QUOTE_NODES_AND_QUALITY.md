# Phase 2.3: Quote Nodes & Argument Quality Gates

**Sub-Phase:** 2.3 of 2.3  
**Timeline:** Weeks 9-12 of Phase 2  
**Status:** Planning  
**Depends On:** Phase 2.1 (Releases), Phase 2.2 (Forks)  
**Enables:** HSS-native evidence handling, argument quality assurance

---

## Objective

Make textual quotes first-class addressable objects for humanities/social sciences, and implement "Argument CI" — automatic quality checks before content is merged into canonical threads.

---

## User Stories

| ID | Story | Priority | Effort |
|----|-------|----------|--------|
| US-2.3.1 | As an HSS scholar, I want to create addressable quote nodes from sources | P0 | M |
| US-2.3.2 | As a reader, I want to see multiple interpretations of a quote | P0 | M |
| US-2.3.3 | As an author, I want to use the same quote in multiple arguments | P1 | S |
| US-2.3.4 | As a maintainer, I want automatic quality checks on submitted arguments | P0 | L |
| US-2.3.5 | As an author, I want to see linting warnings before submitting | P1 | M |
| US-2.3.6 | As a community, I want to discuss the meaning of specific passages | P2 | M |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    QUOTE NODES & QUALITY GATES                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   QUOTE NODES (First-Class Objects)                                          │
│   ┌────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                        │ │
│   │   SOURCE (Book/Paper/Transcript)                                       │ │
│   │   ┌──────────────────────────────────────────────────────────────────┐ │ │
│   │   │  "Being and Time" by Heidegger                                   │ │ │
│   │   └──────────────────────────────────────────────────────────────────┘ │ │
│   │                          │                                             │ │
│   │                          ▼                                             │ │
│   │   ┌────────────────────────────────────────────────────────────────┐   │ │
│   │   │  QUOTE NODE                                                    │   │ │
│   │   │  "Dasein is in each case mine to be..."                        │   │ │
│   │   │  📍 §9, p.42                                                   │   │ │
│   │   │                                                                │   │ │
│   │   │  ┌─────────────────┐  ┌─────────────────┐                      │   │ │
│   │   │  │ Interpretation A│  │ Interpretation B│                      │   │ │
│   │   │  │ (Existentialist)│  │ (Phenomenolog.) │                      │   │ │
│   │   │  └────────┬────────┘  └────────┬────────┘                      │   │ │
│   │   └───────────┼────────────────────┼───────────────────────────────┘   │ │
│   │               │                    │                                   │ │
│   │               ▼                    ▼                                   │ │
│   │   ┌───────────────────┐  ┌───────────────────┐                        │ │
│   │   │ Used in Argument 1│  │ Used in Claim A   │                        │ │
│   │   │ (supports premise)│  │ (textual evidence)│                        │ │
│   │   └───────────────────┘  └───────────────────┘                        │ │
│   └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│   ARGUMENT CI (Quality Gates)                                                │
│   ┌────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                        │ │
│   │   New Argument Submitted                                               │ │
│   │          │                                                             │ │
│   │          ▼                                                             │ │
│   │   ┌──────────────────────────────────────────────────────────────────┐ │ │
│   │   │                    LINTER PIPELINE                               │ │ │
│   │   │                                                                  │ │ │
│   │   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │ │ │
│   │   │  │ Citation │ │ CQ       │ │ Duplicate│ │ Downstream│            │ │ │
│   │   │  │ Check    │→│ Coverage │→│ Detection│→│ Impact   │            │ │ │
│   │   │  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │ │ │
│   │   │                                                                  │ │ │
│   │   │  Results: [✓ pass] [⚠ warning] [✗ error] [ℹ info]               │ │ │
│   │   └──────────────────────────────────────────────────────────────────┘ │ │
│   │          │                                                             │ │
│   │          ▼                                                             │ │
│   │   [Errors?] ──Yes──▶ Block submission                                  │ │
│   │       │No                                                              │ │
│   │       ▼                                                                │ │
│   │   [Warnings?] ──▶ Show warnings, allow proceed                         │ │
│   │       │                                                                │ │
│   │       ▼                                                                │ │
│   │   ✓ Argument Accepted                                                  │ │
│   └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 2.3.1: Quote Node Schema

**File:** `prisma/schema.prisma` (additions)

```prisma
model QuoteNode {
  id              String   @id @default(cuid())
  
  // Source reference
  sourceId        String
  source          Source   @relation(fields: [sourceId], references: [id])
  
  // Quote content
  text            String   @db.Text
  locator         String?  // Page number, section, timestamp, verse
  locatorType     LocatorType @default(PAGE)
  context         String?  @db.Text  // Surrounding text for context
  
  // Metadata
  language        String?  @default("en")
  isTranslation   Boolean  @default(false)
  originalQuoteId String?  // Link to original language quote
  originalQuote   QuoteNode? @relation("QuoteTranslations", fields: [originalQuoteId], references: [id])
  translations    QuoteNode[] @relation("QuoteTranslations")
  
  // Interpretations
  interpretations QuoteInterpretation[]
  
  // Usage tracking
  usedInClaims    ClaimQuote[]
  usedInArguments ArgumentQuote[]
  
  // Mini-deliberation for discussing the quote
  deliberationId  String?  @unique
  deliberation    Deliberation? @relation("QuoteDeliberation", fields: [deliberationId], references: [id])
  
  // Ownership
  createdById     String
  createdBy       User     @relation(fields: [createdById], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([sourceId])
  @@index([createdById])
  @@fulltext([text])
}

enum LocatorType {
  PAGE          // p. 42
  SECTION       // §3.2
  CHAPTER       // Ch. 5
  VERSE         // 3:16
  TIMESTAMP     // 01:23:45
  LINE          // line 123
  PARAGRAPH     // ¶12
  CUSTOM        // User-defined
}

model QuoteInterpretation {
  id              String   @id @default(cuid())
  quoteId         String
  quote           QuoteNode @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  
  // The interpretation
  interpretation  String   @db.Text  // "This passage means..."
  framework       String?  // Theoretical framework applied (e.g., "Marxist", "Poststructuralist")
  methodology     String?  // Interpretive method used
  
  // Scholarly apparatus
  supportingCitations Citation[]
  relatedClaims   Claim[]  @relation("InterpretationClaims")
  
  // Community engagement
  votes           InterpretationVote[]
  voteScore       Int      @default(0)
  
  // Relations to other interpretations
  supportsId      String?
  supports        QuoteInterpretation? @relation("InterpretationSupport", fields: [supportsId], references: [id])
  supportedBy     QuoteInterpretation[] @relation("InterpretationSupport")
  
  challengesId    String?
  challenges      QuoteInterpretation? @relation("InterpretationChallenge", fields: [challengesId], references: [id])
  challengedBy    QuoteInterpretation[] @relation("InterpretationChallenge")
  
  // Authorship
  authorId        String
  author          User     @relation(fields: [authorId], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([quoteId])
  @@index([authorId])
}

model InterpretationVote {
  id                  String   @id @default(cuid())
  interpretationId    String
  interpretation      QuoteInterpretation @relation(fields: [interpretationId], references: [id], onDelete: Cascade)
  
  userId              String
  user                User     @relation(fields: [userId], references: [id])
  
  vote                Int      // +1 or -1
  createdAt           DateTime @default(now())
  
  @@unique([interpretationId, userId])
}

// Junction tables for many-to-many quote usage
model ClaimQuote {
  id              String   @id @default(cuid())
  claimId         String
  claim           Claim    @relation(fields: [claimId], references: [id], onDelete: Cascade)
  
  quoteId         String
  quote           QuoteNode @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  
  usageType       QuoteUsageType @default(EVIDENCE)
  usageNote       String?  @db.Text  // Why this quote is being used
  
  addedById       String
  addedAt         DateTime @default(now())
  
  @@unique([claimId, quoteId])
}

model ArgumentQuote {
  id              String   @id @default(cuid())
  argumentId      String
  argument        Argument @relation(fields: [argumentId], references: [id], onDelete: Cascade)
  
  quoteId         String
  quote           QuoteNode @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  
  usageType       QuoteUsageType @default(EVIDENCE)
  premiseIndex    Int?     // Which premise this supports (0-indexed)
  usageNote       String?  @db.Text
  
  addedById       String
  addedAt         DateTime @default(now())
  
  @@unique([argumentId, quoteId])
}

enum QuoteUsageType {
  EVIDENCE        // Quote supports the claim/argument
  COUNTER         // Quote challenges the claim/argument
  CONTEXT         // Quote provides background
  DEFINITION      // Quote defines a key term
  METHODOLOGY     // Quote describes method
}
```

---

### Step 2.3.2: Quote Types

**File:** `lib/quotes/types.ts`

```typescript
/**
 * Type definitions for quote nodes and interpretations
 */

export type LocatorType =
  | "PAGE"
  | "SECTION"
  | "CHAPTER"
  | "VERSE"
  | "TIMESTAMP"
  | "LINE"
  | "PARAGRAPH"
  | "CUSTOM";

export type QuoteUsageType =
  | "EVIDENCE"
  | "COUNTER"
  | "CONTEXT"
  | "DEFINITION"
  | "METHODOLOGY";

export interface CreateQuoteOptions {
  sourceId: string;
  text: string;
  locator?: string;
  locatorType?: LocatorType;
  context?: string;
  language?: string;
  isTranslation?: boolean;
  originalQuoteId?: string;
}

export interface QuoteNodeSummary {
  id: string;
  text: string;
  locator?: string;
  locatorType: LocatorType;
  source: {
    id: string;
    title: string;
    authors: string[];
    year?: number;
  };
  interpretationCount: number;
  usageCount: number;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: Date;
}

export interface CreateInterpretationOptions {
  quoteId: string;
  interpretation: string;
  framework?: string;
  methodology?: string;
  supportsId?: string;
  challengesId?: string;
}

export interface InterpretationWithVotes {
  id: string;
  interpretation: string;
  framework?: string;
  methodology?: string;
  author: {
    id: string;
    name: string;
    image?: string;
  };
  voteScore: number;
  userVote?: number;
  supportedBy: InterpretationWithVotes[];
  challengedBy: InterpretationWithVotes[];
  createdAt: Date;
}

export interface QuoteSearchFilters {
  sourceId?: string;
  authorId?: string;
  framework?: string;
  hasInterpretations?: boolean;
  searchText?: string;
}
```

---

### Step 2.3.3: Quote Service

**File:** `lib/quotes/quoteService.ts`

```typescript
/**
 * Service for managing quote nodes
 */

import { prisma } from "@/lib/prisma";
import {
  CreateQuoteOptions,
  QuoteNodeSummary,
  QuoteSearchFilters,
} from "./types";

/**
 * Create a new quote node
 */
export async function createQuote(
  options: CreateQuoteOptions,
  userId: string
): Promise<QuoteNodeSummary> {
  const quote = await prisma.quoteNode.create({
    data: {
      sourceId: options.sourceId,
      text: options.text,
      locator: options.locator,
      locatorType: options.locatorType || "PAGE",
      context: options.context,
      language: options.language || "en",
      isTranslation: options.isTranslation || false,
      originalQuoteId: options.originalQuoteId,
      createdById: userId,
    },
    include: {
      source: {
        select: {
          id: true,
          title: true,
          authors: true,
          year: true,
        },
      },
      createdBy: {
        select: { id: true, name: true },
      },
      _count: {
        select: {
          interpretations: true,
          usedInClaims: true,
          usedInArguments: true,
        },
      },
    },
  });

  return {
    id: quote.id,
    text: quote.text,
    locator: quote.locator || undefined,
    locatorType: quote.locatorType as any,
    source: {
      id: quote.source.id,
      title: quote.source.title,
      authors: quote.source.authors as string[],
      year: quote.source.year || undefined,
    },
    interpretationCount: quote._count.interpretations,
    usageCount: quote._count.usedInClaims + quote._count.usedInArguments,
    createdBy: quote.createdBy,
    createdAt: quote.createdAt,
  };
}

/**
 * Get a quote by ID with full details
 */
export async function getQuote(quoteId: string, userId?: string) {
  const quote = await prisma.quoteNode.findUnique({
    where: { id: quoteId },
    include: {
      source: {
        select: {
          id: true,
          title: true,
          authors: true,
          year: true,
          type: true,
        },
      },
      createdBy: {
        select: { id: true, name: true, image: true },
      },
      interpretations: {
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
          votes: userId
            ? {
                where: { userId },
                select: { vote: true },
              }
            : false,
          supportedBy: {
            include: {
              author: { select: { id: true, name: true } },
            },
          },
          challengedBy: {
            include: {
              author: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { voteScore: "desc" },
      },
      usedInClaims: {
        include: {
          claim: {
            select: { id: true, text: true, type: true },
          },
        },
      },
      usedInArguments: {
        include: {
          argument: {
            select: { id: true, type: true },
          },
        },
      },
      translations: {
        select: { id: true, language: true, text: true },
      },
      originalQuote: {
        select: { id: true, language: true, text: true },
      },
      deliberation: {
        select: { id: true, title: true },
      },
    },
  });

  if (!quote) return null;

  // Process interpretations to include user vote
  const interpretations = quote.interpretations.map((interp) => ({
    ...interp,
    userVote: Array.isArray(interp.votes) && interp.votes[0]?.vote,
  }));

  return {
    ...quote,
    interpretations,
  };
}

/**
 * Search quotes with filters
 */
export async function searchQuotes(
  filters: QuoteSearchFilters,
  limit = 20,
  offset = 0
) {
  const where: any = {};

  if (filters.sourceId) {
    where.sourceId = filters.sourceId;
  }

  if (filters.authorId) {
    where.createdById = filters.authorId;
  }

  if (filters.hasInterpretations !== undefined) {
    if (filters.hasInterpretations) {
      where.interpretations = { some: {} };
    } else {
      where.interpretations = { none: {} };
    }
  }

  if (filters.searchText) {
    where.text = {
      contains: filters.searchText,
      mode: "insensitive",
    };
  }

  if (filters.framework) {
    where.interpretations = {
      some: {
        framework: {
          contains: filters.framework,
          mode: "insensitive",
        },
      },
    };
  }

  const [quotes, total] = await Promise.all([
    prisma.quoteNode.findMany({
      where,
      include: {
        source: {
          select: {
            id: true,
            title: true,
            authors: true,
            year: true,
          },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            interpretations: true,
            usedInClaims: true,
            usedInArguments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.quoteNode.count({ where }),
  ]);

  return {
    quotes: quotes.map((q) => ({
      id: q.id,
      text: q.text,
      locator: q.locator,
      locatorType: q.locatorType,
      source: {
        id: q.source.id,
        title: q.source.title,
        authors: q.source.authors as string[],
        year: q.source.year || undefined,
      },
      interpretationCount: q._count.interpretations,
      usageCount: q._count.usedInClaims + q._count.usedInArguments,
      createdBy: q.createdBy,
      createdAt: q.createdAt,
    })),
    total,
    hasMore: offset + quotes.length < total,
  };
}

/**
 * Get quotes from a specific source
 */
export async function getQuotesBySource(sourceId: string) {
  return prisma.quoteNode.findMany({
    where: { sourceId },
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
      _count: {
        select: {
          interpretations: true,
          usedInClaims: true,
          usedInArguments: true,
        },
      },
    },
    orderBy: [{ locator: "asc" }, { createdAt: "asc" }],
  });
}

/**
 * Link a quote to a claim
 */
export async function linkQuoteToClaim(
  quoteId: string,
  claimId: string,
  usageType: string,
  usageNote: string | undefined,
  userId: string
) {
  return prisma.claimQuote.create({
    data: {
      quoteId,
      claimId,
      usageType: usageType as any,
      usageNote,
      addedById: userId,
    },
  });
}

/**
 * Link a quote to an argument
 */
export async function linkQuoteToArgument(
  quoteId: string,
  argumentId: string,
  usageType: string,
  premiseIndex: number | undefined,
  usageNote: string | undefined,
  userId: string
) {
  return prisma.argumentQuote.create({
    data: {
      quoteId,
      argumentId,
      usageType: usageType as any,
      premiseIndex,
      usageNote,
      addedById: userId,
    },
  });
}

/**
 * Create a mini-deliberation for discussing a quote
 */
export async function createQuoteDeliberation(quoteId: string, userId: string) {
  const quote = await prisma.quoteNode.findUnique({
    where: { id: quoteId },
    include: {
      source: { select: { title: true } },
    },
  });

  if (!quote) throw new Error("Quote not found");
  if (quote.deliberationId) throw new Error("Quote already has a deliberation");

  // Create deliberation in transaction
  const deliberation = await prisma.$transaction(async (tx) => {
    const delib = await tx.deliberation.create({
      data: {
        title: `Discussion: "${quote.text.slice(0, 50)}..."`,
        description: `A focused discussion on the interpretation and meaning of this passage from "${quote.source.title}"`,
        type: "QUOTE_INTERPRETATION",
        createdById: userId,
        members: {
          create: {
            userId,
            role: "OWNER",
          },
        },
      },
    });

    await tx.quoteNode.update({
      where: { id: quoteId },
      data: { deliberationId: delib.id },
    });

    return delib;
  });

  return deliberation;
}
```

---

### Step 2.3.4: Interpretation Service

**File:** `lib/quotes/interpretationService.ts`

```typescript
/**
 * Service for managing quote interpretations
 */

import { prisma } from "@/lib/prisma";
import { CreateInterpretationOptions, InterpretationWithVotes } from "./types";

/**
 * Create a new interpretation
 */
export async function createInterpretation(
  options: CreateInterpretationOptions,
  userId: string
) {
  const interpretation = await prisma.quoteInterpretation.create({
    data: {
      quoteId: options.quoteId,
      interpretation: options.interpretation,
      framework: options.framework,
      methodology: options.methodology,
      supportsId: options.supportsId,
      challengesId: options.challengesId,
      authorId: userId,
    },
    include: {
      author: {
        select: { id: true, name: true, image: true },
      },
      quote: {
        select: { id: true, text: true },
      },
    },
  });

  return interpretation;
}

/**
 * Get interpretations for a quote
 */
export async function getInterpretations(
  quoteId: string,
  userId?: string
): Promise<InterpretationWithVotes[]> {
  const interpretations = await prisma.quoteInterpretation.findMany({
    where: { quoteId },
    include: {
      author: {
        select: { id: true, name: true, image: true },
      },
      votes: userId
        ? {
            where: { userId },
            select: { vote: true },
          }
        : { select: { vote: true } },
      supportedBy: {
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
      },
      challengedBy: {
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
      },
    },
    orderBy: { voteScore: "desc" },
  });

  return interpretations.map((i) => ({
    id: i.id,
    interpretation: i.interpretation,
    framework: i.framework || undefined,
    methodology: i.methodology || undefined,
    author: i.author,
    voteScore: i.voteScore,
    userVote: userId && i.votes[0] ? i.votes[0].vote : undefined,
    supportedBy: i.supportedBy.map((s) => ({
      id: s.id,
      interpretation: s.interpretation,
      framework: s.framework || undefined,
      methodology: s.methodology || undefined,
      author: s.author,
      voteScore: s.voteScore,
      supportedBy: [],
      challengedBy: [],
      createdAt: s.createdAt,
    })),
    challengedBy: i.challengedBy.map((c) => ({
      id: c.id,
      interpretation: c.interpretation,
      framework: c.framework || undefined,
      methodology: c.methodology || undefined,
      author: c.author,
      voteScore: c.voteScore,
      supportedBy: [],
      challengedBy: [],
      createdAt: c.createdAt,
    })),
    createdAt: i.createdAt,
  }));
}

/**
 * Vote on an interpretation
 */
export async function voteOnInterpretation(
  interpretationId: string,
  userId: string,
  vote: 1 | -1
) {
  // Upsert the vote
  const existingVote = await prisma.interpretationVote.findUnique({
    where: {
      interpretationId_userId: {
        interpretationId,
        userId,
      },
    },
  });

  if (existingVote) {
    if (existingVote.vote === vote) {
      // Remove vote if same
      await prisma.$transaction([
        prisma.interpretationVote.delete({
          where: { id: existingVote.id },
        }),
        prisma.quoteInterpretation.update({
          where: { id: interpretationId },
          data: { voteScore: { decrement: vote } },
        }),
      ]);
      return { action: "removed", newScore: null };
    } else {
      // Change vote
      await prisma.$transaction([
        prisma.interpretationVote.update({
          where: { id: existingVote.id },
          data: { vote },
        }),
        prisma.quoteInterpretation.update({
          where: { id: interpretationId },
          data: { voteScore: { increment: vote * 2 } }, // Swing from -1 to +1 or vice versa
        }),
      ]);
      return { action: "changed", newScore: null };
    }
  } else {
    // New vote
    await prisma.$transaction([
      prisma.interpretationVote.create({
        data: {
          interpretationId,
          userId,
          vote,
        },
      }),
      prisma.quoteInterpretation.update({
        where: { id: interpretationId },
        data: { voteScore: { increment: vote } },
      }),
    ]);
    return { action: "created", newScore: null };
  }
}

/**
 * Get interpretation frameworks used in a deliberation
 */
export async function getFrameworksInUse(deliberationId: string) {
  const frameworks = await prisma.quoteInterpretation.groupBy({
    by: ["framework"],
    where: {
      quote: {
        usedInClaims: {
          some: {
            claim: {
              deliberationId,
            },
          },
        },
      },
      framework: { not: null },
    },
    _count: true,
  });

  return frameworks
    .filter((f) => f.framework)
    .map((f) => ({
      framework: f.framework!,
      count: f._count,
    }))
    .sort((a, b) => b.count - a.count);
}
```

---

## Phase 2.3 Part 1 Complete

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | QuoteNode schema | `prisma/schema.prisma` | 📋 Defined |
| 2 | QuoteInterpretation schema | `prisma/schema.prisma` | 📋 Defined |
| 3 | Quote types | `lib/quotes/types.ts` | 📋 Defined |
| 4 | Quote service | `lib/quotes/quoteService.ts` | 📋 Defined |
| 5 | Interpretation service | `lib/quotes/interpretationService.ts` | 📋 Defined |

---

## Next: Part 2

Continue to Phase 2.3 Part 2 for:
- Argument Linting system (rules, runner, results)
- Quality gate enforcement
- API routes for quotes and linting
- UI components (QuoteCard, InterpretationPanel, LintResultsDisplay)

---

*End of Phase 2.3 Part 1*
