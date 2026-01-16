# Phase 3.3: Cross-Deliberation Claim Mapping — Part 1

**Sub-Phase:** 3.3 of 3.3  
**Focus:** Canonical Claim Registry & Cross-Room Search

---

## User Stories

| ID | Story | Priority | Effort |
|----|-------|----------|--------|
| 3.3.1 | As a scholar, I want to discover where the same claim appears across deliberations, so I can see different perspectives | P0 | L |
| 3.3.2 | As a moderator, I want to link equivalent claims across rooms, so knowledge can be connected | P0 | M |
| 3.3.3 | As a researcher, I want to import arguments from other deliberations with full provenance, so I can build on others' work | P1 | L |
| 3.3.4 | As a platform admin, I want a canonical registry of claims, so we can track the evolution of ideas | P1 | M |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                Cross-Deliberation Knowledge Layer                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Canonical Claim Registry                     │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐            │   │
│  │  │ Canonical  │ │ Canonical  │ │ Canonical  │            │   │
│  │  │  Claim 1   │ │  Claim 2   │ │  Claim 3   │            │   │
│  │  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘            │   │
│  └────────│──────────────│──────────────│───────────────────┘   │
│           │              │              │                        │
│           ▼              ▼              ▼                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Claim Instances                        │   │
│  │  ┌─────────────────────┐  ┌─────────────────────┐        │   │
│  │  │   Deliberation A    │  │   Deliberation B    │        │   │
│  │  │ ┌───┐ ┌───┐ ┌───┐  │  │ ┌───┐ ┌───┐ ┌───┐  │        │   │
│  │  │ │C1 │ │C2 │ │C3 │  │  │ │C1'│ │C2'│ │C4 │  │        │   │
│  │  │ └─┬─┘ └─┬─┘ └───┘  │  │ └─┬─┘ └─┬─┘ └───┘  │        │   │
│  │  │   │     │          │  │   │     │          │        │   │
│  │  └───│─────│──────────┘  └───│─────│──────────┘        │   │
│  └──────│─────│─────────────────│─────│──────────────────┘   │
│         │     └─────────────────┼─────┘                       │
│         └───────────────────────┘                             │
│              (Same canonical claim)                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Argument Transport                           │   │
│  │                                                           │   │
│  │  Source Delib ─── [Import] ──▶ Target Delib              │   │
│  │     Argument         │         Imported Arg               │   │
│  │                      │         with Provenance            │   │
│  │               (Full attribution)                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 3.3.1: Enhanced Schema

**File:** `prisma/schema.prisma` (additions)

```prisma
// ============================================================
// CROSS-DELIBERATION MAPPING MODELS
// ============================================================

/// Extended canonical claim with global tracking
model CanonicalClaim {
  id              String   @id @default(cuid())
  
  // Global identifier
  canonicalId     String   @unique @db.VarChar(50)  // e.g., "claim:abc123xyz"
  
  // Representative text (from first/primary instance)
  representativeText String @db.Text
  
  // Semantic matching
  semanticHash    String   @db.VarChar(64)  // For quick similarity lookup
  embedding       Bytes?                     // Vector embedding for semantic search
  
  // Statistics across all instances
  totalInstances  Int      @default(0)
  totalChallenges Int      @default(0)
  
  // Global consensus (aggregated from instances)
  globalStatus    GlobalClaimStatus @default(UNDETERMINED)
  
  // Field/domain tagging
  primaryField    String?  @db.VarChar(100)
  secondaryFields String[] @default([])
  
  // Timestamps
  createdAt       DateTime @default(now())
  lastActivityAt  DateTime @default(now())
  
  // Relations
  instances       ClaimInstance[]
  equivalences    ClaimEquivalence[] @relation("PrimaryEquivalences")
  equivalentTo    ClaimEquivalence[] @relation("EquivalentClaims")
  
  @@index([semanticHash])
  @@index([globalStatus])
  @@index([primaryField])
}

enum GlobalClaimStatus {
  UNDETERMINED
  EMERGING
  ACCEPTED_LOCALLY      // Accepted in some deliberations
  ACCEPTED_BROADLY      // Accepted across many deliberations
  CONTESTED             // Under debate
  REJECTED_LOCALLY      // Rejected in some
  REJECTED_BROADLY      // Rejected across many
}

/// Instance of a canonical claim in a specific deliberation
model ClaimInstance {
  id              String   @id @default(cuid())
  
  // Link to canonical
  canonicalClaimId String
  canonicalClaim   CanonicalClaim @relation(fields: [canonicalClaimId], references: [id], onDelete: Cascade)
  
  // Link to local claim
  claimId         String
  claim           Claim    @relation(fields: [claimId], references: [id], onDelete: Cascade)
  
  // Deliberation context
  deliberationId  String
  deliberation    Deliberation @relation(fields: [deliberationId], references: [id], onDelete: Cascade)
  
  // Instance type
  instanceType    InstanceType @default(ORIGINAL)
  
  // Local status in this deliberation
  localStatus     String?  @db.VarChar(50)
  
  // Linking metadata
  linkedAt        DateTime @default(now())
  linkedById      String
  linkedBy        User     @relation(fields: [linkedById], references: [id])
  
  // Variation notes (if claim differs from canonical)
  variationNotes  String?  @db.Text
  
  @@unique([canonicalClaimId, claimId])
  @@index([deliberationId])
  @@index([canonicalClaimId])
}

enum InstanceType {
  ORIGINAL        // First instance, created independently
  EQUIVALENT      // Manually marked as equivalent
  IMPORTED        // Imported from another deliberation
  FORKED          // Created by forking from another
  DERIVED         // Derived/evolved from canonical
}

/// Equivalence relationship between canonical claims
model ClaimEquivalence {
  id              String   @id @default(cuid())
  
  // Primary claim (the "official" version)
  primaryClaimId  String
  primaryClaim    CanonicalClaim @relation("PrimaryEquivalences", fields: [primaryClaimId], references: [id], onDelete: Cascade)
  
  // Equivalent claim
  equivalentClaimId String
  equivalentClaim   CanonicalClaim @relation("EquivalentClaims", fields: [equivalentClaimId], references: [id], onDelete: Cascade)
  
  // Equivalence type
  equivalenceType EquivalenceType @default(SEMANTIC)
  
  // Confidence/strength
  confidence      Float    @default(0.5)  // 0-1 score
  isVerified      Boolean  @default(false)
  
  // Notes explaining the relationship
  notes           String?  @db.Text
  
  // Who established this
  createdAt       DateTime @default(now())
  createdById     String
  createdBy       User     @relation(fields: [createdById], references: [id])
  
  @@unique([primaryClaimId, equivalentClaimId])
}

enum EquivalenceType {
  SEMANTIC        // Same meaning, different words
  TERMINOLOGICAL  // Different field terminology
  SUBSET          // One is more specific
  SUPERSET        // One is more general
  CONTRAPOSITIVE  // Logically equivalent formulation
  REFORMULATION   // Structural reformulation
}

/// Imported argument tracking
model ArgumentImport {
  id              String   @id @default(cuid())
  
  // Source
  sourceArgumentId    String
  sourceDeliberationId String
  
  // Destination
  importedArgumentId  String  @unique
  importedArgument    Argument @relation(fields: [importedArgumentId], references: [id], onDelete: Cascade)
  targetDeliberationId String
  
  // Import metadata
  importType      ImportType @default(FULL)
  importReason    String?    @db.Text
  
  // Attribution
  preserveAttribution Boolean @default(true)
  originalAuthorId    String?
  
  // Modifications
  wasModified     Boolean  @default(false)
  modificationNotes String? @db.Text
  
  // Timestamps
  importedAt      DateTime @default(now())
  importedById    String
  importedBy      User     @relation(fields: [importedById], references: [id])
  
  @@index([sourceArgumentId])
  @@index([targetDeliberationId])
}

enum ImportType {
  FULL            // Complete argument structure
  PREMISES_ONLY   // Only premises, new conclusion
  SKELETON        // Structure without specific claims
  REFERENCE       // Just a reference/citation
}

// Add to existing Argument model:
//   importRecord  ArgumentImport?
```

---

### Step 3.3.2: Type Definitions

**File:** `lib/crossDeliberation/types.ts`

```typescript
/**
 * Types for cross-deliberation claim mapping
 */

export type GlobalClaimStatus =
  | "UNDETERMINED"
  | "EMERGING"
  | "ACCEPTED_LOCALLY"
  | "ACCEPTED_BROADLY"
  | "CONTESTED"
  | "REJECTED_LOCALLY"
  | "REJECTED_BROADLY";

export type InstanceType =
  | "ORIGINAL"
  | "EQUIVALENT"
  | "IMPORTED"
  | "FORKED"
  | "DERIVED";

export type EquivalenceType =
  | "SEMANTIC"
  | "TERMINOLOGICAL"
  | "SUBSET"
  | "SUPERSET"
  | "CONTRAPOSITIVE"
  | "REFORMULATION";

export type ImportType =
  | "FULL"
  | "PREMISES_ONLY"
  | "SKELETON"
  | "REFERENCE";

export interface CanonicalClaimSummary {
  id: string;
  canonicalId: string;
  representativeText: string;
  globalStatus: GlobalClaimStatus;
  totalInstances: number;
  totalChallenges: number;
  primaryField?: string;
  instances: ClaimInstanceSummary[];
}

export interface ClaimInstanceSummary {
  id: string;
  claimId: string;
  claimText: string;
  deliberation: {
    id: string;
    title: string;
    visibility: string;
  };
  instanceType: InstanceType;
  localStatus?: string;
  variationNotes?: string;
}

export interface ClaimEquivalenceSummary {
  id: string;
  equivalenceType: EquivalenceType;
  confidence: number;
  isVerified: boolean;
  notes?: string;
  claim: {
    id: string;
    canonicalId: string;
    representativeText: string;
    globalStatus: GlobalClaimStatus;
  };
}

export interface CrossRoomSearchResult {
  canonicalClaim: CanonicalClaimSummary;
  instances: Array<{
    deliberation: {
      id: string;
      title: string;
      visibility: string;
    };
    claim: {
      id: string;
      text: string;
      status: string;
    };
    challengeCount: number;
    supportCount: number;
  }>;
  matchScore: number;
  matchReason: string;
}

export interface ArgumentImportInput {
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
}

export interface ArgumentImportResult {
  importedArgumentId: string;
  sourceArgumentId: string;
  importRecord: {
    id: string;
    importType: ImportType;
    wasModified: boolean;
  };
  linkedClaims: string[];
}

export interface CanonicalClaimSearchParams {
  query?: string;
  field?: string;
  globalStatus?: GlobalClaimStatus;
  minInstances?: number;
  excludeDeliberationId?: string;
}
```

---

### Step 3.3.3: Canonical Registry Service

**File:** `lib/crossDeliberation/canonicalRegistryService.ts`

```typescript
/**
 * Service for managing the canonical claim registry
 */

import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import {
  CanonicalClaimSummary,
  GlobalClaimStatus,
  CanonicalClaimSearchParams,
  EquivalenceType,
} from "./types";

/**
 * Generate canonical ID
 */
function generateCanonicalId(): string {
  const bytes = crypto.randomBytes(8);
  return `claim:${bytes.toString("hex")}`;
}

/**
 * Generate semantic hash for similarity matching
 */
function generateSemanticHash(text: string): string {
  const normalized = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

/**
 * Register or find canonical claim
 */
export async function findOrCreateCanonicalClaim(
  claimId: string,
  userId: string,
  field?: string
): Promise<CanonicalClaimSummary> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      deliberation: { select: { id: true, title: true, visibility: true } },
    },
  });

  if (!claim) throw new Error("Claim not found");

  // Check if already linked
  if (claim.canonicalId) {
    const existing = await getCanonicalClaimByCanonicalId(claim.canonicalId);
    if (existing) return existing;
  }

  // Check for similar existing canonical claims
  const semanticHash = generateSemanticHash(claim.text);
  const similar = await prisma.canonicalClaim.findFirst({
    where: { semanticHash },
  });

  if (similar) {
    // Link to existing canonical
    await linkClaimToCanonical(claimId, similar.canonicalId, "EQUIVALENT", userId);
    return (await getCanonicalClaimByCanonicalId(similar.canonicalId))!;
  }

  // Create new canonical
  const canonicalId = generateCanonicalId();

  const canonical = await prisma.$transaction(async (tx) => {
    // Create canonical claim
    const created = await tx.canonicalClaim.create({
      data: {
        canonicalId,
        representativeText: claim.text,
        semanticHash,
        primaryField: field,
        totalInstances: 1,
      },
    });

    // Update local claim
    await tx.claim.update({
      where: { id: claimId },
      data: { canonicalId },
    });

    // Create instance record
    await tx.claimInstance.create({
      data: {
        canonicalClaimId: created.id,
        claimId,
        deliberationId: claim.deliberationId,
        instanceType: "ORIGINAL",
        localStatus: claim.consensusStatus,
        linkedById: userId,
      },
    });

    return created;
  });

  return formatCanonicalSummary(canonical, [
    {
      claim,
      deliberation: claim.deliberation,
      instanceType: "ORIGINAL",
    },
  ]);
}

/**
 * Link a claim to an existing canonical claim
 */
export async function linkClaimToCanonical(
  claimId: string,
  canonicalId: string,
  instanceType: "EQUIVALENT" | "IMPORTED" | "FORKED" | "DERIVED",
  userId: string,
  variationNotes?: string
) {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: { deliberation: { select: { id: true } } },
  });

  if (!claim) throw new Error("Claim not found");

  const canonical = await prisma.canonicalClaim.findUnique({
    where: { canonicalId },
  });

  if (!canonical) throw new Error("Canonical claim not found");

  // Check for existing link
  const existingLink = await prisma.claimInstance.findFirst({
    where: { claimId, canonicalClaimId: canonical.id },
  });

  if (existingLink) {
    return existingLink;
  }

  return prisma.$transaction(async (tx) => {
    // Update local claim
    await tx.claim.update({
      where: { id: claimId },
      data: { canonicalId },
    });

    // Create instance
    const instance = await tx.claimInstance.create({
      data: {
        canonicalClaimId: canonical.id,
        claimId,
        deliberationId: claim.deliberationId,
        instanceType,
        localStatus: claim.consensusStatus,
        linkedById: userId,
        variationNotes,
      },
    });

    // Update counts
    await tx.canonicalClaim.update({
      where: { id: canonical.id },
      data: {
        totalInstances: { increment: 1 },
        lastActivityAt: new Date(),
      },
    });

    return instance;
  });
}

/**
 * Get canonical claim with all instances
 */
export async function getCanonicalClaimByCanonicalId(
  canonicalId: string
): Promise<CanonicalClaimSummary | null> {
  const canonical = await prisma.canonicalClaim.findUnique({
    where: { canonicalId },
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
              visibility: true,
            },
          },
        },
        orderBy: { linkedAt: "desc" },
      },
    },
  });

  if (!canonical) return null;
  return formatCanonicalSummary(canonical, canonical.instances);
}

/**
 * Search canonical claims
 */
export async function searchCanonicalClaims(
  params: CanonicalClaimSearchParams,
  limit = 20
): Promise<CanonicalClaimSummary[]> {
  const where: any = {};

  if (params.query) {
    where.representativeText = {
      search: params.query.split(" ").join(" & "),
    };
  }

  if (params.field) {
    where.primaryField = params.field;
  }

  if (params.globalStatus) {
    where.globalStatus = params.globalStatus;
  }

  if (params.minInstances) {
    where.totalInstances = { gte: params.minInstances };
  }

  const canonicals = await prisma.canonicalClaim.findMany({
    where,
    include: {
      instances: {
        include: {
          claim: {
            select: {
              id: true,
              text: true,
              consensusStatus: true,
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
        take: 5, // Limit instances per canonical
      },
    },
    orderBy: { totalInstances: "desc" },
    take: limit,
  });

  return canonicals.map((c) => formatCanonicalSummary(c, c.instances));
}

/**
 * Find claims similar to given text (for suggestions)
 */
export async function findSimilarClaims(
  text: string,
  excludeDeliberationId?: string,
  limit = 10
): Promise<CanonicalClaimSummary[]> {
  const semanticHash = generateSemanticHash(text);

  // First try exact semantic match
  const exactMatches = await prisma.canonicalClaim.findMany({
    where: {
      semanticHash,
      instances: excludeDeliberationId
        ? { none: { deliberationId: excludeDeliberationId } }
        : undefined,
    },
    include: {
      instances: {
        include: {
          claim: { select: { id: true, text: true, consensusStatus: true } },
          deliberation: { select: { id: true, title: true, visibility: true } },
        },
        take: 5,
      },
    },
    take: limit,
  });

  if (exactMatches.length >= limit) {
    return exactMatches.map((c) => formatCanonicalSummary(c, c.instances));
  }

  // Fall back to text search
  const textMatches = await prisma.canonicalClaim.findMany({
    where: {
      AND: [
        {
          representativeText: {
            search: text.split(" ").slice(0, 5).join(" & "),
          },
        },
        { NOT: { semanticHash } }, // Exclude exact matches
      ],
    },
    include: {
      instances: {
        include: {
          claim: { select: { id: true, text: true, consensusStatus: true } },
          deliberation: { select: { id: true, title: true, visibility: true } },
        },
        take: 5,
      },
    },
    take: limit - exactMatches.length,
  });

  return [...exactMatches, ...textMatches].map((c) =>
    formatCanonicalSummary(c, c.instances)
  );
}

/**
 * Create equivalence between canonical claims
 */
export async function createClaimEquivalence(
  primaryCanonicalId: string,
  equivalentCanonicalId: string,
  equivalenceType: EquivalenceType,
  userId: string,
  notes?: string,
  confidence = 0.5
) {
  const [primary, equivalent] = await Promise.all([
    prisma.canonicalClaim.findUnique({ where: { canonicalId: primaryCanonicalId } }),
    prisma.canonicalClaim.findUnique({ where: { canonicalId: equivalentCanonicalId } }),
  ]);

  if (!primary || !equivalent) {
    throw new Error("One or both canonical claims not found");
  }

  return prisma.claimEquivalence.create({
    data: {
      primaryClaimId: primary.id,
      equivalentClaimId: equivalent.id,
      equivalenceType,
      confidence,
      notes,
      createdById: userId,
    },
  });
}

/**
 * Update global status based on all instances
 */
export async function updateGlobalStatus(canonicalId: string) {
  const canonical = await prisma.canonicalClaim.findUnique({
    where: { canonicalId },
    include: {
      instances: {
        include: {
          claim: { select: { consensusStatus: true, challengeCount: true } },
        },
      },
    },
  });

  if (!canonical) return;

  const statuses = canonical.instances.map((i) => i.claim.consensusStatus);
  const totalChallenges = canonical.instances.reduce(
    (sum, i) => sum + i.claim.challengeCount,
    0
  );

  // Determine global status
  let globalStatus: GlobalClaimStatus = "UNDETERMINED";
  const acceptedCount = statuses.filter((s) => s === "ACCEPTED").length;
  const rejectedCount = statuses.filter((s) => s === "REJECTED").length;
  const contestedCount = statuses.filter((s) => s === "CONTESTED").length;
  const total = statuses.length;

  if (total === 0) {
    globalStatus = "UNDETERMINED";
  } else if (acceptedCount === total) {
    globalStatus = total > 2 ? "ACCEPTED_BROADLY" : "ACCEPTED_LOCALLY";
  } else if (rejectedCount === total) {
    globalStatus = total > 2 ? "REJECTED_BROADLY" : "REJECTED_LOCALLY";
  } else if (contestedCount > 0 || (acceptedCount > 0 && rejectedCount > 0)) {
    globalStatus = "CONTESTED";
  } else if (acceptedCount > rejectedCount) {
    globalStatus = "EMERGING";
  }

  await prisma.canonicalClaim.update({
    where: { canonicalId },
    data: {
      globalStatus,
      totalChallenges,
      lastActivityAt: new Date(),
    },
  });
}

/**
 * Format canonical claim for API response
 */
function formatCanonicalSummary(
  canonical: any,
  instances: any[]
): CanonicalClaimSummary {
  return {
    id: canonical.id,
    canonicalId: canonical.canonicalId,
    representativeText: canonical.representativeText,
    globalStatus: canonical.globalStatus as GlobalClaimStatus,
    totalInstances: canonical.totalInstances,
    totalChallenges: canonical.totalChallenges,
    primaryField: canonical.primaryField || undefined,
    instances: instances.map((inst) => ({
      id: inst.id || inst.claim?.id,
      claimId: inst.claim?.id || inst.claimId,
      claimText: inst.claim?.text || inst.text,
      deliberation: inst.deliberation,
      instanceType: inst.instanceType,
      localStatus: inst.localStatus || inst.claim?.consensusStatus,
      variationNotes: inst.variationNotes || undefined,
    })),
  };
}
```

---

## Phase 3.3 Part 1 Complete

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Enhanced CanonicalClaim schema | `prisma/schema.prisma` | 📋 Part 1 |
| 2 | ClaimInstance schema | `prisma/schema.prisma` | 📋 Part 1 |
| 3 | ClaimEquivalence schema | `prisma/schema.prisma` | 📋 Part 1 |
| 4 | ArgumentImport schema | `prisma/schema.prisma` | 📋 Part 1 |
| 5 | Cross-deliberation types | `lib/crossDeliberation/types.ts` | 📋 Part 1 |
| 6 | Canonical registry service | `lib/crossDeliberation/canonicalRegistryService.ts` | 📋 Part 1 |

---

## Next: Part 2

Continue to Phase 3.3 Part 2 for:
- Argument Transport Service (importing arguments with provenance)
- Cross-room search service
- API routes
- UI components (CanonicalClaimCard, CrossRoomSearch, ArgumentImportModal)

---

*End of Phase 3.3 Part 1*
