# Phase 2.2: Fork/Branch/Merge for Deliberations

**Sub-Phase:** 2.2 of 2.3  
**Timeline:** Weeks 5-8 of Phase 2  
**Status:** Planning  
**Depends On:** Phase 2.1 (Releases)  
**Enables:** Exploratory deliberation, alternative hypothesis testing, collaborative merging

---

## Objective

Enable scholars to fork deliberations to explore alternative assumptions, then merge insights back with full provenance. This brings Git's powerful branching model to academic discourse.

---

## User Stories

| ID | Story | Priority | Effort |
|----|-------|----------|--------|
| US-2.2.1 | As a researcher, I want to fork a debate to explore an alternative assumption | P0 | L |
| US-2.2.2 | As a participant, I want to see all forks of a deliberation | P0 | S |
| US-2.2.3 | As a fork author, I want to selectively import claims from the parent | P0 | M |
| US-2.2.4 | As a maintainer, I want to merge useful arguments from a fork back | P1 | L |
| US-2.2.5 | As a reader, I want to understand the provenance of forked content | P1 | M |
| US-2.2.6 | As a researcher, I want to compare parallel forks exploring different assumptions | P2 | M |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    FORK/BRANCH/MERGE ARCHITECTURE                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   PARENT DELIBERATION (Main Line)                                            │
│   ┌────────────────────────────────────────────────────────────────────────┐ │
│   │  "Climate Change Economics"                                            │ │
│   │  Claims: [C1, C2, C3, C4, C5]                                          │ │
│   │  Assumption: Standard economic models                                   │ │
│   │                                                                        │ │
│   │  ──────────●──────────●──────────●──────── (releases)                  │ │
│   │           v1.0       v1.1       v1.2                                   │ │
│   │                       │                                                │ │
│   └───────────────────────┼────────────────────────────────────────────────┘ │
│                           │                                                  │
│                    FORK   │                                                  │
│                           ▼                                                  │
│   FORK A: "Under Degrowth Assumptions"                                       │
│   ┌────────────────────────────────────────────────────────────────────────┐ │
│   │  forkedFrom: parent @ v1.1                                             │ │
│   │  forkReason: "Exploring degrowth economics framework"                  │ │
│   │  importedClaims: [C1, C3] (selective)                                  │ │
│   │  newClaims: [C6, C7, C8]                                               │ │
│   │                                                                        │ │
│   │  ──────────●──────────●───────────── (fork releases)                   │ │
│   │         fork-v1.0  fork-v1.1                                           │ │
│   │                       │                                                │ │
│   │                       │ MERGE REQUEST                                  │ │
│   │                       └─────────────────────────────────────────────▶  │ │
│   └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│   FORK B: "Under Circular Economy"                                           │
│   ┌────────────────────────────────────────────────────────────────────────┐ │
│   │  forkedFrom: parent @ v1.1                                             │ │
│   │  forkReason: "Circular economy model implications"                     │ │
│   │  (standalone exploration, no merge intended)                           │ │
│   └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 2.2.1: Schema Updates

**File:** `prisma/schema.prisma` (additions)

```prisma
model Deliberation {
  // Existing fields...
  
  // NEW: Forking fields
  forkedFromId        String?
  forkedFrom          Deliberation? @relation("DeliberationForks", fields: [forkedFromId], references: [id])
  forks               Deliberation[] @relation("DeliberationForks")
  
  forkedAtReleaseId   String?       // Which release was forked from
  forkedAtRelease     DebateRelease? @relation("ForkSource", fields: [forkedAtReleaseId], references: [id])
  
  forkReason          String?       @db.Text  // "Exploring assumption X"
  forkType            ForkType?     // Type of fork
  
  // Imported content tracking
  importedClaims      ImportedClaim[]
  importedArguments   ImportedArgument[]
  
  // Merge tracking
  mergeRequests       MergeRequest[] @relation("MergeTarget")
  outgoingMerges      MergeRequest[] @relation("MergeSource")
}

enum ForkType {
  ASSUMPTION_VARIANT   // Testing different assumptions
  METHODOLOGICAL       // Different analytical approach
  SCOPE_EXTENSION      // Extending to new domain
  ADVERSARIAL          // Devil's advocate exploration
  EDUCATIONAL          // Teaching/learning fork
  ARCHIVAL             // Preserving a branch
}

model ImportedClaim {
  id                  String   @id @default(cuid())
  deliberationId      String
  deliberation        Deliberation @relation(fields: [deliberationId], references: [id], onDelete: Cascade)
  
  originalClaimId     String
  originalClaim       Claim    @relation("ClaimImports", fields: [originalClaimId], references: [id])
  
  localClaimId        String   @unique
  localClaim          Claim    @relation("ImportedAs", fields: [localClaimId], references: [id])
  
  importedAt          DateTime @default(now())
  importedById        String
  syncStatus          SyncStatus @default(SYNCED)
  lastSyncedAt        DateTime?
  
  @@unique([deliberationId, originalClaimId])
  @@index([deliberationId])
}

model ImportedArgument {
  id                  String   @id @default(cuid())
  deliberationId      String
  deliberation        Deliberation @relation(fields: [deliberationId], references: [id], onDelete: Cascade)
  
  originalArgumentId  String
  originalArgument    Argument @relation("ArgumentImports", fields: [originalArgumentId], references: [id])
  
  localArgumentId     String   @unique
  localArgument       Argument @relation("ImportedAsArg", fields: [localArgumentId], references: [id])
  
  importedAt          DateTime @default(now())
  importedById        String
  
  @@unique([deliberationId, originalArgumentId])
}

enum SyncStatus {
  SYNCED              // Matches original
  DIVERGED            // Local modifications made
  ORIGINAL_UPDATED    // Original changed, needs review
  DETACHED            // No longer tracking original
}

model MergeRequest {
  id                  String   @id @default(cuid())
  
  // Source (the fork)
  sourceDeliberationId String
  sourceDeliberation  Deliberation @relation("MergeSource", fields: [sourceDeliberationId], references: [id])
  
  // Target (usually the parent)
  targetDeliberationId String
  targetDeliberation  Deliberation @relation("MergeTarget", fields: [targetDeliberationId], references: [id])
  
  title               String
  description         String?  @db.Text
  
  // Content to merge
  claimsToMerge       Json     // Array of claim IDs with merge strategy
  argumentsToMerge    Json     // Array of argument IDs
  
  // Review
  status              MergeStatus @default(OPEN)
  reviewComments      MergeComment[]
  
  authorId            String
  author              User     @relation(fields: [authorId], references: [id])
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  mergedAt            DateTime?
  mergedById          String?
  closedAt            DateTime?
  
  @@index([sourceDeliberationId])
  @@index([targetDeliberationId])
}

enum MergeStatus {
  OPEN
  IN_REVIEW
  APPROVED
  MERGED
  CLOSED
  CONFLICT
}

model MergeComment {
  id                  String   @id @default(cuid())
  mergeRequestId      String
  mergeRequest        MergeRequest @relation(fields: [mergeRequestId], references: [id], onDelete: Cascade)
  
  content             String   @db.Text
  authorId            String
  author              User     @relation(fields: [authorId], references: [id])
  
  // Optional: comment on specific claim/argument
  targetClaimId       String?
  targetArgumentId    String?
  
  createdAt           DateTime @default(now())
  
  @@index([mergeRequestId])
}
```

---

### Step 2.2.2: Fork Types Definition

**File:** `lib/forks/types.ts`

```typescript
/**
 * Type definitions for deliberation forking
 */

export interface ForkOptions {
  parentDeliberationId: string;
  forkReason: string;
  forkType: ForkType;
  title: string;
  description?: string;
  
  // What to import
  importAllClaims?: boolean;
  claimIdsToImport?: string[];
  importAllArguments?: boolean;
  argumentIdsToImport?: string[];
  
  // Fork from specific release (optional)
  fromReleaseId?: string;
  
  // Visibility
  visibility?: "public" | "private" | "organization";
  organizationId?: string;
}

export type ForkType =
  | "ASSUMPTION_VARIANT"
  | "METHODOLOGICAL"
  | "SCOPE_EXTENSION"
  | "ADVERSARIAL"
  | "EDUCATIONAL"
  | "ARCHIVAL";

export interface ForkSummary {
  id: string;
  title: string;
  forkReason: string;
  forkType: ForkType;
  forkedAt: Date;
  forkedBy: {
    id: string;
    name: string;
    image?: string;
  };
  parentTitle: string;
  parentId: string;
  forkedFromVersion?: string;
  claimCount: number;
  argumentCount: number;
  hasMergeRequest: boolean;
}

export interface MergeOptions {
  sourceDeliberationId: string;
  targetDeliberationId: string;
  title: string;
  description?: string;
  
  // What to merge
  claimsToMerge: MergeClaimSelection[];
  argumentsToMerge: MergeArgumentSelection[];
}

export interface MergeClaimSelection {
  claimId: string;
  strategy: MergeStrategy;
  targetClaimId?: string;  // For REPLACE strategy
}

export interface MergeArgumentSelection {
  argumentId: string;
  includeWithClaims: boolean;  // Auto-include if premise claims are merged
}

export type MergeStrategy =
  | "ADD_NEW"        // Add as new claim
  | "REPLACE"        // Replace existing claim
  | "LINK_SUPPORT"   // Add as supporting claim
  | "LINK_CHALLENGE" // Add as challenging claim
  | "SKIP";          // Don't merge

export interface MergeConflict {
  type: "CLAIM_EXISTS" | "ARGUMENT_ORPHAN" | "CIRCULAR_REFERENCE";
  sourceId: string;
  targetId?: string;
  description: string;
  suggestedResolution: MergeStrategy;
}

export interface MergeAnalysis {
  canMerge: boolean;
  conflicts: MergeConflict[];
  newClaims: number;
  newArguments: number;
  updatedClaims: number;
  warnings: string[];
}
```

---

### Step 2.2.3: Fork Service

**File:** `lib/forks/forkService.ts`

```typescript
/**
 * Service for forking deliberations
 */

import { prisma } from "@/lib/prisma";
import { ForkOptions, ForkSummary } from "./types";

/**
 * Create a fork of a deliberation
 */
export async function createFork(
  options: ForkOptions,
  userId: string
) {
  const {
    parentDeliberationId,
    forkReason,
    forkType,
    title,
    description,
    claimIdsToImport,
    argumentIdsToImport,
    importAllClaims,
    importAllArguments,
    fromReleaseId,
    visibility,
    organizationId,
  } = options;

  // Get parent deliberation
  const parent = await prisma.deliberation.findUnique({
    where: { id: parentDeliberationId },
    include: {
      claims: true,
      arguments: {
        include: {
          premises: { select: { id: true } },
          conclusion: { select: { id: true } },
        },
      },
      latestRelease: true,
    },
  });

  if (!parent) {
    throw new Error("Parent deliberation not found");
  }

  // Determine which claims to import
  let claimsToImport = parent.claims;
  if (!importAllClaims && claimIdsToImport) {
    claimsToImport = parent.claims.filter((c) =>
      claimIdsToImport.includes(c.id)
    );
  }

  // Determine which arguments to import
  let argumentsToImport = parent.arguments;
  if (!importAllArguments && argumentIdsToImport) {
    argumentsToImport = parent.arguments.filter((a) =>
      argumentIdsToImport.includes(a.id)
    );
  }

  // Create fork transaction
  const fork = await prisma.$transaction(async (tx) => {
    // 1. Create the forked deliberation
    const forkedDelib = await tx.deliberation.create({
      data: {
        title,
        description: description || `Fork of "${parent.title}": ${forkReason}`,
        forkedFromId: parentDeliberationId,
        forkedAtReleaseId: fromReleaseId || parent.latestRelease?.id,
        forkReason,
        forkType,
        visibility: visibility || parent.visibility,
        organizationId: organizationId || parent.organizationId,
        createdById: userId,
        // Add creator as owner
        members: {
          create: {
            userId,
            role: "OWNER",
          },
        },
      },
    });

    // 2. Import claims (create copies with tracking)
    const claimIdMap = new Map<string, string>(); // original -> new
    
    for (const claim of claimsToImport) {
      const newClaim = await tx.claim.create({
        data: {
          text: claim.text,
          type: claim.type,
          deliberationId: forkedDelib.id,
          sourceId: claim.sourceId,
          createdById: userId,
        },
      });

      claimIdMap.set(claim.id, newClaim.id);

      // Track import
      await tx.importedClaim.create({
        data: {
          deliberationId: forkedDelib.id,
          originalClaimId: claim.id,
          localClaimId: newClaim.id,
          importedById: userId,
          syncStatus: "SYNCED",
          lastSyncedAt: new Date(),
        },
      });
    }

    // 3. Import arguments (with premise/conclusion remapping)
    for (const arg of argumentsToImport) {
      // Check if all premises are imported
      const premiseIds = arg.premises.map((p) => p.id);
      const allPremisesImported = premiseIds.every((id) =>
        claimIdMap.has(id)
      );
      
      // Check if conclusion is imported
      const conclusionImported =
        arg.conclusion && claimIdMap.has(arg.conclusion.id);

      if (allPremisesImported && conclusionImported) {
        const newArg = await tx.argument.create({
          data: {
            type: arg.type,
            deliberationId: forkedDelib.id,
            schemeId: arg.schemeId,
            createdById: userId,
            // Remap premise connections
            premises: {
              connect: premiseIds.map((id) => ({
                id: claimIdMap.get(id)!,
              })),
            },
            // Remap conclusion
            conclusion: arg.conclusion
              ? { connect: { id: claimIdMap.get(arg.conclusion.id)! } }
              : undefined,
          },
        });

        // Track import
        await tx.importedArgument.create({
          data: {
            deliberationId: forkedDelib.id,
            originalArgumentId: arg.id,
            localArgumentId: newArg.id,
            importedById: userId,
          },
        });
      }
    }

    return forkedDelib;
  });

  return fork;
}

/**
 * Get all forks of a deliberation
 */
export async function getForks(deliberationId: string): Promise<ForkSummary[]> {
  const forks = await prisma.deliberation.findMany({
    where: { forkedFromId: deliberationId },
    include: {
      createdBy: {
        select: { id: true, name: true, image: true },
      },
      forkedFrom: {
        select: { id: true, title: true },
      },
      forkedAtRelease: {
        select: { version: true },
      },
      _count: {
        select: {
          claims: true,
          arguments: true,
        },
      },
      outgoingMerges: {
        where: { status: { not: "CLOSED" } },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return forks.map((fork) => ({
    id: fork.id,
    title: fork.title,
    forkReason: fork.forkReason || "",
    forkType: fork.forkType as any,
    forkedAt: fork.createdAt,
    forkedBy: fork.createdBy,
    parentTitle: fork.forkedFrom?.title || "",
    parentId: fork.forkedFromId || "",
    forkedFromVersion: fork.forkedAtRelease?.version,
    claimCount: fork._count.claims,
    argumentCount: fork._count.arguments,
    hasMergeRequest: fork.outgoingMerges.length > 0,
  }));
}

/**
 * Get fork tree (parent + all descendants)
 */
export async function getForkTree(deliberationId: string) {
  // Get the root (traverse up to find original)
  let rootId = deliberationId;
  let current = await prisma.deliberation.findUnique({
    where: { id: deliberationId },
    select: { forkedFromId: true },
  });

  while (current?.forkedFromId) {
    rootId = current.forkedFromId;
    current = await prisma.deliberation.findUnique({
      where: { id: rootId },
      select: { forkedFromId: true },
    });
  }

  // Build tree from root
  const buildTree = async (nodeId: string): Promise<any> => {
    const node = await prisma.deliberation.findUnique({
      where: { id: nodeId },
      select: {
        id: true,
        title: true,
        forkReason: true,
        forkType: true,
        createdAt: true,
        createdBy: {
          select: { id: true, name: true, image: true },
        },
        _count: {
          select: { claims: true, arguments: true },
        },
      },
    });

    const children = await prisma.deliberation.findMany({
      where: { forkedFromId: nodeId },
      select: { id: true },
    });

    const childTrees = await Promise.all(
      children.map((child) => buildTree(child.id))
    );

    return {
      ...node,
      children: childTrees,
    };
  };

  return buildTree(rootId);
}

/**
 * Check sync status for imported claims
 */
export async function checkSyncStatus(deliberationId: string) {
  const imports = await prisma.importedClaim.findMany({
    where: { deliberationId },
    include: {
      originalClaim: {
        select: { text: true, updatedAt: true },
      },
      localClaim: {
        select: { text: true, updatedAt: true },
      },
    },
  });

  const updates: Array<{
    importId: string;
    originalText: string;
    localText: string;
    status: string;
  }> = [];

  for (const imp of imports) {
    if (imp.originalClaim.text !== imp.localClaim.text) {
      // Check which changed
      if (imp.originalClaim.updatedAt > (imp.lastSyncedAt || new Date(0))) {
        updates.push({
          importId: imp.id,
          originalText: imp.originalClaim.text,
          localText: imp.localClaim.text,
          status: "ORIGINAL_UPDATED",
        });
      } else {
        updates.push({
          importId: imp.id,
          originalText: imp.originalClaim.text,
          localText: imp.localClaim.text,
          status: "DIVERGED",
        });
      }
    }
  }

  return updates;
}
```

---

### Step 2.2.4: Merge Service

**File:** `lib/forks/mergeService.ts`

```typescript
/**
 * Service for merging forks back into parent deliberations
 */

import { prisma } from "@/lib/prisma";
import {
  MergeOptions,
  MergeAnalysis,
  MergeConflict,
  MergeClaimSelection,
} from "./types";

/**
 * Analyze a potential merge for conflicts
 */
export async function analyzeMerge(
  options: MergeOptions
): Promise<MergeAnalysis> {
  const { sourceDeliberationId, targetDeliberationId, claimsToMerge } = options;

  const conflicts: MergeConflict[] = [];
  const warnings: string[] = [];

  // Get target claims for comparison
  const targetClaims = await prisma.claim.findMany({
    where: { deliberationId: targetDeliberationId },
    select: { id: true, text: true },
  });

  const targetClaimTexts = new Set(
    targetClaims.map((c) => c.text.toLowerCase().trim())
  );

  // Get source claims
  const sourceClaimIds = claimsToMerge.map((c) => c.claimId);
  const sourceClaims = await prisma.claim.findMany({
    where: { id: { in: sourceClaimIds } },
  });

  let newClaims = 0;
  let updatedClaims = 0;

  for (const selection of claimsToMerge) {
    if (selection.strategy === "SKIP") continue;

    const sourceClaim = sourceClaims.find((c) => c.id === selection.claimId);
    if (!sourceClaim) continue;

    // Check for duplicate text
    if (
      selection.strategy === "ADD_NEW" &&
      targetClaimTexts.has(sourceClaim.text.toLowerCase().trim())
    ) {
      conflicts.push({
        type: "CLAIM_EXISTS",
        sourceId: selection.claimId,
        description: `Claim "${sourceClaim.text.slice(0, 50)}..." already exists in target`,
        suggestedResolution: "LINK_SUPPORT",
      });
    }

    if (selection.strategy === "ADD_NEW") {
      newClaims++;
    } else if (selection.strategy === "REPLACE") {
      updatedClaims++;
    }
  }

  // Check for orphaned arguments
  const sourceArguments = await prisma.argument.findMany({
    where: {
      deliberationId: sourceDeliberationId,
      OR: [
        { premises: { some: { id: { in: sourceClaimIds } } } },
        { conclusionId: { in: sourceClaimIds } },
      ],
    },
    include: {
      premises: { select: { id: true } },
      conclusion: { select: { id: true } },
    },
  });

  const mergedClaimIds = new Set(
    claimsToMerge
      .filter((c) => c.strategy !== "SKIP")
      .map((c) => c.claimId)
  );

  for (const arg of sourceArguments) {
    const premiseMissing = arg.premises.some(
      (p) => !mergedClaimIds.has(p.id)
    );
    const conclusionMissing =
      arg.conclusion && !mergedClaimIds.has(arg.conclusion.id);

    if (premiseMissing || conclusionMissing) {
      warnings.push(
        `Argument ${arg.id} references claims not being merged - it will be excluded`
      );
    }
  }

  return {
    canMerge: conflicts.filter((c) => c.type === "CIRCULAR_REFERENCE").length === 0,
    conflicts,
    newClaims,
    newArguments: options.argumentsToMerge.length,
    updatedClaims,
    warnings,
  };
}

/**
 * Create a merge request
 */
export async function createMergeRequest(
  options: MergeOptions,
  userId: string
) {
  const { sourceDeliberationId, targetDeliberationId, title, description } =
    options;

  // Verify user has permission on source
  const sourceMembership = await prisma.deliberationMember.findFirst({
    where: {
      deliberationId: sourceDeliberationId,
      userId,
      role: { in: ["OWNER", "ADMIN", "MEMBER"] },
    },
  });

  if (!sourceMembership) {
    throw new Error("No permission to create merge request from this fork");
  }

  // Verify target exists and is the parent
  const source = await prisma.deliberation.findUnique({
    where: { id: sourceDeliberationId },
    select: { forkedFromId: true },
  });

  if (source?.forkedFromId !== targetDeliberationId) {
    throw new Error("Can only merge into the parent deliberation");
  }

  const mergeRequest = await prisma.mergeRequest.create({
    data: {
      sourceDeliberationId,
      targetDeliberationId,
      title,
      description,
      claimsToMerge: options.claimsToMerge,
      argumentsToMerge: options.argumentsToMerge,
      authorId: userId,
      status: "OPEN",
    },
    include: {
      author: {
        select: { id: true, name: true, image: true },
      },
      sourceDeliberation: {
        select: { id: true, title: true },
      },
      targetDeliberation: {
        select: { id: true, title: true },
      },
    },
  });

  return mergeRequest;
}

/**
 * Execute a merge
 */
export async function executeMerge(mergeRequestId: string, userId: string) {
  const mergeRequest = await prisma.mergeRequest.findUnique({
    where: { id: mergeRequestId },
    include: {
      targetDeliberation: {
        include: {
          members: true,
        },
      },
    },
  });

  if (!mergeRequest) {
    throw new Error("Merge request not found");
  }

  // Check permission to merge
  const isMaintainer = mergeRequest.targetDeliberation.members.some(
    (m) => m.userId === userId && ["OWNER", "ADMIN"].includes(m.role)
  );

  if (!isMaintainer) {
    throw new Error("Only maintainers can execute merges");
  }

  if (mergeRequest.status !== "APPROVED") {
    throw new Error("Merge request must be approved first");
  }

  const claimsToMerge = mergeRequest.claimsToMerge as MergeClaimSelection[];
  const argumentsToMerge = mergeRequest.argumentsToMerge as any[];

  // Execute merge in transaction
  await prisma.$transaction(async (tx) => {
    const claimIdMap = new Map<string, string>();

    // 1. Merge claims
    for (const selection of claimsToMerge) {
      if (selection.strategy === "SKIP") continue;

      const sourceClaim = await tx.claim.findUnique({
        where: { id: selection.claimId },
      });

      if (!sourceClaim) continue;

      if (selection.strategy === "ADD_NEW") {
        const newClaim = await tx.claim.create({
          data: {
            text: sourceClaim.text,
            type: sourceClaim.type,
            deliberationId: mergeRequest.targetDeliberationId,
            sourceId: sourceClaim.sourceId,
            createdById: userId,
            // Mark provenance
            metadata: {
              mergedFrom: {
                deliberationId: mergeRequest.sourceDeliberationId,
                claimId: sourceClaim.id,
                mergeRequestId,
              },
            },
          },
        });
        claimIdMap.set(selection.claimId, newClaim.id);
      } else if (selection.strategy === "REPLACE" && selection.targetClaimId) {
        await tx.claim.update({
          where: { id: selection.targetClaimId },
          data: {
            text: sourceClaim.text,
            type: sourceClaim.type,
          },
        });
        claimIdMap.set(selection.claimId, selection.targetClaimId);
      }
    }

    // 2. Merge arguments
    for (const argSelection of argumentsToMerge) {
      const sourceArg = await tx.argument.findUnique({
        where: { id: argSelection.argumentId },
        include: {
          premises: { select: { id: true } },
          conclusion: { select: { id: true } },
        },
      });

      if (!sourceArg) continue;

      // Check all premises and conclusion are mapped
      const premisesMapped = sourceArg.premises.every((p) =>
        claimIdMap.has(p.id)
      );
      const conclusionMapped =
        !sourceArg.conclusion || claimIdMap.has(sourceArg.conclusion.id);

      if (premisesMapped && conclusionMapped) {
        await tx.argument.create({
          data: {
            type: sourceArg.type,
            deliberationId: mergeRequest.targetDeliberationId,
            schemeId: sourceArg.schemeId,
            createdById: userId,
            premises: {
              connect: sourceArg.premises.map((p) => ({
                id: claimIdMap.get(p.id)!,
              })),
            },
            conclusion: sourceArg.conclusion
              ? { connect: { id: claimIdMap.get(sourceArg.conclusion.id)! } }
              : undefined,
          },
        });
      }
    }

    // 3. Update merge request status
    await tx.mergeRequest.update({
      where: { id: mergeRequestId },
      data: {
        status: "MERGED",
        mergedAt: new Date(),
        mergedById: userId,
      },
    });
  });

  return { success: true };
}

/**
 * Get merge requests for a deliberation
 */
export async function getMergeRequests(
  deliberationId: string,
  direction: "incoming" | "outgoing" = "incoming"
) {
  const where =
    direction === "incoming"
      ? { targetDeliberationId: deliberationId }
      : { sourceDeliberationId: deliberationId };

  return prisma.mergeRequest.findMany({
    where,
    include: {
      author: {
        select: { id: true, name: true, image: true },
      },
      sourceDeliberation: {
        select: { id: true, title: true },
      },
      targetDeliberation: {
        select: { id: true, title: true },
      },
      _count: {
        select: { reviewComments: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
```

---

## Phase 2.2 Part 1 Complete

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Schema updates | `prisma/schema.prisma` | 📋 Defined |
| 2 | Fork types | `lib/forks/types.ts` | 📋 Defined |
| 3 | Fork service | `lib/forks/forkService.ts` | 📋 Defined |
| 4 | Merge service | `lib/forks/mergeService.ts` | 📋 Defined |

---

## Next: Part 2

Continue to Phase 2.2 Part 2 for:
- API routes (fork, merge, merge requests)
- UI components (ForkButton, ForkList, MergeRequestView, ForkTreeVisualization)

---

*End of Phase 2.2 Part 1*
