# Phase 3.1: Claim Provenance Tracking

**Sub-Phase:** 3.1 of 3.3  
**Timeline:** Weeks 1-4 of Phase 3  
**Status:** Planning  
**Depends On:** Phase 1.1 (Claims), Phase 2.1 (Releases)  
**Enables:** Challenge tracking, claim evolution, scholarly accountability

---

## Objective

Track the complete lifecycle of claims — from original assertion through refinements, challenges, and resolution. Enable scholars to understand how any claim evolved and what challenges it faces.

---

## User Stories

| ID | Story | Priority | Effort |
|----|-------|----------|--------|
| US-3.1.1 | As a scholar, I want to see when/where a claim was first made | P0 | M |
| US-3.1.2 | As a reader, I want to see how a claim has evolved over time | P0 | M |
| US-3.1.3 | As a researcher, I want to know what challenges a claim faces | P0 | L |
| US-3.1.4 | As a participant, I want to see if challenges have been defended | P1 | M |
| US-3.1.5 | As a scholar, I want canonical IDs for claims across contexts | P1 | L |
| US-3.1.6 | As a reader, I want to see the consensus status of a claim | P2 | M | 



---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    CLAIM PROVENANCE ARCHITECTURE                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   CLAIM LIFECYCLE                                                            │
│   ┌────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                        │ │
│   │   ORIGIN                    EVOLUTION                    CURRENT       │ │
│   │   ┌─────────────┐          ┌─────────────┐             ┌───────────┐   │ │
│   │   │ First       │          │ Version 1   │             │ Version N │   │ │
│   │   │ Assertion   │─────────▶│ (refined)   │─────...────▶│ (current) │   │ │
│   │   │             │          │             │             │           │   │ │
│   │   │ Source:     │          │ Changed:    │             │ Status:   │   │ │
│   │   │ Paper X     │          │ wording     │             │ CONTESTED │   │ │
│   │   │ Date: 2020  │          │ Date: 2022  │             │           │   │ │
│   │   │ Author: A   │          │ By: B       │             │           │   │ │
│   │   └─────────────┘          └─────────────┘             └───────────┘   │ │
│   │                                                              │         │ │
│   └──────────────────────────────────────────────────────────────┼─────────┘ │
│                                                                  │           │
│   CHALLENGE TRACKING                                             │           │
│   ┌──────────────────────────────────────────────────────────────┼─────────┐ │
│   │                                                              ▼         │ │
│   │   ┌───────────────────────────────────────────────────────────────┐   │ │
│   │   │                      CHALLENGES                               │   │ │
│   │   ├───────────────┬───────────────┬───────────────────────────────┤   │ │
│   │   │   REBUTTALS   │   UNDERCUTS   │       UNDERMINES              │   │ │
│   │   │ (conclusion)  │  (inference)  │       (premises)              │   │ │
│   │   ├───────────────┼───────────────┼───────────────────────────────┤   │ │
│   │   │ Attack A1     │ Attack B1     │ Attack C1                     │   │ │
│   │   │ Status: OPEN  │ Status: DEF.  │ Status: CONCEDED              │   │ │
│   │   │               │ Defense: D1   │                               │   │ │
│   │   └───────────────┴───────────────┴───────────────────────────────┘   │ │
│   │                                                                       │ │
│   │   Resolution: 1 OPEN, 1 DEFENDED, 1 CONCEDED → "CONTESTED"            │ │
│   │                                                                       │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│   CANONICAL IDENTITY                                                         │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                                                                       │ │
│   │   Canonical ID: claim:7f8a9b2c                                        │ │
│   │   ┌─────────────────────────────────────────────────────────────────┐ │ │
│   │   │  Appears in:                                                    │ │ │
│   │   │    ├── Deliberation A: Claim #12                                │ │ │
│   │   │    ├── Deliberation B: Claim #7 (forked)                        │ │ │
│   │   │    └── Deliberation C: Claim #3 (imported)                      │ │ │
│   │   │                                                                 │ │ │
│   │   │  Global Status: CONTESTED (2 deliberations), ACCEPTED (1)       │ │ │
│   │   └─────────────────────────────────────────────────────────────────┘ │ │
│   │                                                                       │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 3.1.1: Schema Updates

**File:** `prisma/schema.prisma` (additions)

```prisma
// Extend Claim model for provenance
model Claim {
  // Existing fields...
  
  // NEW: Provenance tracking
  canonicalId       String?           // Global identifier across contexts
  originSourceId    String?           // First paper/source to make this claim
  originSource      Source?           @relation("ClaimOrigin", fields: [originSourceId], references: [id])
  originDate        DateTime?         // When first asserted
  originAuthorId    String?           // Who first made this claim
  originAuthor      User?             @relation("ClaimOriginator", fields: [originAuthorId], references: [id])
  
  // Version tracking
  versions          ClaimVersion[]
  currentVersionId  String?           @unique
  currentVersion    ClaimVersion?     @relation("CurrentVersion", fields: [currentVersionId], references: [id])
  
  // Challenge tracking (aggregated)
  challengeCount    Int               @default(0)
  openChallenges    Int               @default(0)
  defendedCount     Int               @default(0)
  concededCount     Int               @default(0)
  
  // Consensus status
  consensusStatus   ConsensusStatus   @default(UNDETERMINED)
  consensusUpdatedAt DateTime?
  
  // Relations to attacks
  attacksReceived   Attack[]          @relation("AttackedClaim")
  defensesFor       Defense[]         @relation("DefendedClaim")
  
  @@index([canonicalId])
  @@index([consensusStatus])
}

model ClaimVersion {
  id                String   @id @default(cuid())
  claimId           String
  claim             Claim    @relation(fields: [claimId], references: [id], onDelete: Cascade)
  
  // Content at this version
  text              String   @db.Text
  type              String
  
  // Version metadata
  versionNumber     Int
  changeType        VersionChangeType
  changeReason      String?  @db.Text
  changedFields     Json?    // Which fields changed
  
  // Authorship
  authorId          String
  author            User     @relation(fields: [authorId], references: [id])
  createdAt         DateTime @default(now())
  
  // Previous version link
  previousVersionId String?
  previousVersion   ClaimVersion? @relation("VersionChain", fields: [previousVersionId], references: [id])
  nextVersions      ClaimVersion[] @relation("VersionChain")
  
  // Current version back-reference
  currentFor        Claim?   @relation("CurrentVersion")
  
  // Release association (if versioned via release)
  releaseId         String?
  
  @@unique([claimId, versionNumber])
  @@index([claimId])
}

enum VersionChangeType {
  CREATED           // Initial version
  REFINED           // Wording improved
  STRENGTHENED      // Scope narrowed for precision
  WEAKENED          // Scope broadened or qualified
  CORRECTED         // Error fixed
  MERGED            // Combined with another claim
  SPLIT             // Split from larger claim
  IMPORTED          // Brought from another deliberation
}

enum ConsensusStatus {
  UNDETERMINED      // Not enough engagement
  EMERGING          // Building support
  ACCEPTED          // Broad acceptance
  CONTESTED         // Active disagreement
  REJECTED          // Broadly rejected
  SUPERSEDED        // Replaced by refined version
}

model Attack {
  id                String   @id @default(cuid())
  
  // What is being attacked
  targetClaimId     String
  targetClaim       Claim    @relation("AttackedClaim", fields: [targetClaimId], references: [id], onDelete: Cascade)
  
  // The attacking argument
  attackingArgumentId String
  attackingArgument Argument @relation("AttackingArgument", fields: [attackingArgumentId], references: [id], onDelete: Cascade)
  
  // Attack classification
  attackType        AttackType
  attackSubtype     String?  // More specific classification
  
  // Status tracking
  status            AttackStatus @default(OPEN)
  
  // Defense tracking
  defenses          Defense[]
  
  // Resolution
  resolvedAt        DateTime?
  resolvedById      String?
  resolutionNote    String?  @db.Text
  
  createdAt         DateTime @default(now())
  createdById       String
  createdBy         User     @relation(fields: [createdById], references: [id])
  
  @@index([targetClaimId])
  @@index([status])
}

enum AttackType {
  REBUTTAL          // Attacks the conclusion directly
  UNDERCUT          // Attacks the inference/reasoning
  UNDERMINE         // Attacks a premise
}

enum AttackStatus {
  OPEN              // Not yet addressed
  UNDER_REVIEW      // Being evaluated
  DEFENDED          // Successfully defended
  PARTIALLY_DEFENDED // Partially addressed
  CONCEDED          // Attacker's point accepted
  WITHDRAWN         // Attack withdrawn by attacker
  STALEMATE         // Unresolved disagreement
}

model Defense {
  id                String   @id @default(cuid())
  
  // What is being defended
  claimId           String
  claim             Claim    @relation("DefendedClaim", fields: [claimId], references: [id], onDelete: Cascade)
  
  // Against which attack
  attackId          String
  attack            Attack   @relation(fields: [attackId], references: [id], onDelete: Cascade)
  
  // The defending argument
  defendingArgumentId String
  defendingArgument Argument @relation("DefendingArgument", fields: [defendingArgumentId], references: [id])
  
  // Defense type
  defenseType       DefenseType
  
  // Outcome
  outcome           DefenseOutcome?
  outcomeNote       String?  @db.Text
  
  createdAt         DateTime @default(now())
  createdById       String
  createdBy         User     @relation(fields: [createdById], references: [id])
  
  @@index([attackId])
  @@index([claimId])
}

enum DefenseType {
  DIRECT_REBUTTAL   // Directly counter the attack
  DISTINCTION       // Show attack misunderstands the claim
  CONCESSION_LIMIT  // Partially concede but limit scope
  EVIDENCE          // Provide additional supporting evidence
  AUTHORITY         // Appeal to expert consensus
}

enum DefenseOutcome {
  SUCCESSFUL        // Defense accepted
  PARTIAL           // Partially successful
  UNSUCCESSFUL      // Defense rejected
  PENDING           // Awaiting evaluation
}

// Canonical claim registry for cross-deliberation identity
model CanonicalClaim {
  id                String   @id @default(cuid())
  
  // The canonical identifier
  canonicalId       String   @unique
  
  // Representative text (from most authoritative instance)
  representativeText String  @db.Text
  
  // Instances across deliberations
  instances         ClaimInstance[]
  
  // Global metrics
  totalInstances    Int      @default(1)
  totalChallenges   Int      @default(0)
  globalStatus      ConsensusStatus @default(UNDETERMINED)
  
  // Discovery metadata
  firstSeenAt       DateTime @default(now())
  lastActivityAt    DateTime @default(now())
  
  // Semantic fingerprint for matching
  semanticHash      String?  // For similarity matching
  
  @@index([globalStatus])
  @@fulltext([representativeText])
}

model ClaimInstance {
  id                String   @id @default(cuid())
  
  canonicalClaimId  String
  canonicalClaim    CanonicalClaim @relation(fields: [canonicalClaimId], references: [id], onDelete: Cascade)
  
  claimId           String
  claim             Claim    @relation(fields: [claimId], references: [id], onDelete: Cascade)
  
  deliberationId    String
  deliberation      Deliberation @relation(fields: [deliberationId], references: [id], onDelete: Cascade)
  
  // Instance relationship type
  instanceType      ClaimInstanceType @default(ORIGINAL)
  
  // Local status in this deliberation
  localStatus       ConsensusStatus
  
  linkedAt          DateTime @default(now())
  linkedById        String
  
  @@unique([canonicalClaimId, claimId])
  @@index([deliberationId])
}

enum ClaimInstanceType {
  ORIGINAL          // First occurrence
  EQUIVALENT        // Marked as equivalent
  IMPORTED          // Explicitly imported
  FORKED            // Created via fork
  DERIVED           // Derived/refined from original
}
```

---

### Step 3.1.2: Provenance Types

**File:** `lib/provenance/types.ts`

```typescript
/**
 * Type definitions for claim provenance tracking
 */

export type VersionChangeType =
  | "CREATED"
  | "REFINED"
  | "STRENGTHENED"
  | "WEAKENED"
  | "CORRECTED"
  | "MERGED"
  | "SPLIT"
  | "IMPORTED";

export type ConsensusStatus =
  | "UNDETERMINED"
  | "EMERGING"
  | "ACCEPTED"
  | "CONTESTED"
  | "REJECTED"
  | "SUPERSEDED";

export type AttackType = "REBUTTAL" | "UNDERCUT" | "UNDERMINE";

export type AttackStatus =
  | "OPEN"
  | "UNDER_REVIEW"
  | "DEFENDED"
  | "PARTIALLY_DEFENDED"
  | "CONCEDED"
  | "WITHDRAWN"
  | "STALEMATE";

export interface ClaimProvenance {
  claimId: string;
  canonicalId?: string;
  
  origin: {
    sourceId?: string;
    sourceTitle?: string;
    sourceAuthors?: string[];
    date?: Date;
    authorId?: string;
    authorName?: string;
  };
  
  versions: ClaimVersionSummary[];
  currentVersion: number;
  
  consensusStatus: ConsensusStatus;
  
  challengeSummary: {
    total: number;
    open: number;
    defended: number;
    conceded: number;
    stalemate: number;
  };
}

export interface ClaimVersionSummary {
  versionNumber: number;
  text: string;
  changeType: VersionChangeType;
  changeReason?: string;
  authorName: string;
  createdAt: Date;
}

export interface CreateVersionOptions {
  claimId: string;
  text: string;
  type?: string;
  changeType: VersionChangeType;
  changeReason?: string;
}

export interface ChallengeReport {
  claim: {
    id: string;
    text: string;
    status: ConsensusStatus;
  };
  
  challenges: {
    rebuttals: AttackSummary[];
    undercuts: AttackSummary[];
    undermines: AttackSummary[];
  };
  
  defenses: DefenseSummary[];
  
  resolutionStatus: "open" | "defended" | "conceded" | "stalemate" | "mixed";
  resolutionSummary: string;
}

export interface AttackSummary {
  id: string;
  attackType: AttackType;
  status: AttackStatus;
  argument: {
    id: string;
    summary: string;
    author: { id: string; name: string };
  };
  defenseCount: number;
  createdAt: Date;
}

export interface DefenseSummary {
  id: string;
  attackId: string;
  defenseType: string;
  outcome?: string;
  argument: {
    id: string;
    summary: string;
    author: { id: string; name: string };
  };
  createdAt: Date;
}

export interface ClaimTimelineEvent {
  id: string;
  type: "version" | "attack" | "defense" | "status_change";
  date: Date;
  actor: { id: string; name: string };
  description: string;
  details: any;
}
```

---

### Step 3.1.3: Provenance Service

**File:** `lib/provenance/provenanceService.ts`

```typescript
/**
 * Service for claim provenance tracking
 */

import { prisma } from "@/lib/prisma";
import {
  ClaimProvenance,
  CreateVersionOptions,
  ClaimVersionSummary,
  ClaimTimelineEvent,
} from "./types";

/**
 * Get full provenance for a claim
 */
export async function getClaimProvenance(
  claimId: string
): Promise<ClaimProvenance | null> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      originSource: {
        select: { id: true, title: true, authors: true },
      },
      originAuthor: {
        select: { id: true, name: true },
      },
      versions: {
        include: {
          author: { select: { name: true } },
        },
        orderBy: { versionNumber: "asc" },
      },
      currentVersion: true,
    },
  });

  if (!claim) return null;

  return {
    claimId: claim.id,
    canonicalId: claim.canonicalId || undefined,
    origin: {
      sourceId: claim.originSourceId || undefined,
      sourceTitle: claim.originSource?.title,
      sourceAuthors: claim.originSource?.authors as string[] | undefined,
      date: claim.originDate || undefined,
      authorId: claim.originAuthorId || undefined,
      authorName: claim.originAuthor?.name || undefined,
    },
    versions: claim.versions.map((v) => ({
      versionNumber: v.versionNumber,
      text: v.text,
      changeType: v.changeType as any,
      changeReason: v.changeReason || undefined,
      authorName: v.author.name || "Unknown",
      createdAt: v.createdAt,
    })),
    currentVersion: claim.currentVersion?.versionNumber || 1,
    consensusStatus: claim.consensusStatus as any,
    challengeSummary: {
      total: claim.challengeCount,
      open: claim.openChallenges,
      defended: claim.defendedCount,
      conceded: claim.concededCount,
      stalemate: 0, // Calculate if needed
    },
  };
}

/**
 * Create a new version of a claim
 */
export async function createClaimVersion(
  options: CreateVersionOptions,
  userId: string
) {
  const { claimId, text, type, changeType, changeReason } = options;

  // Get current claim state
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      currentVersion: true,
    },
  });

  if (!claim) {
    throw new Error("Claim not found");
  }

  const nextVersionNumber = (claim.currentVersion?.versionNumber || 0) + 1;

  // Create version in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the new version
    const version = await tx.claimVersion.create({
      data: {
        claimId,
        text,
        type: type || claim.type,
        versionNumber: nextVersionNumber,
        changeType,
        changeReason,
        changedFields: {
          text: text !== claim.text,
          type: type ? type !== claim.type : false,
        },
        previousVersionId: claim.currentVersionId,
        authorId: userId,
      },
    });

    // Update the claim with new text and version reference
    await tx.claim.update({
      where: { id: claimId },
      data: {
        text,
        type: type || claim.type,
        currentVersionId: version.id,
        updatedAt: new Date(),
      },
    });

    return version;
  });

  return result;
}

/**
 * Set claim origin information
 */
export async function setClaimOrigin(
  claimId: string,
  origin: {
    sourceId?: string;
    date?: Date;
    authorId?: string;
  }
) {
  return prisma.claim.update({
    where: { id: claimId },
    data: {
      originSourceId: origin.sourceId,
      originDate: origin.date,
      originAuthorId: origin.authorId,
    },
  });
}

/**
 * Get claim timeline (all events)
 */
export async function getClaimTimeline(
  claimId: string
): Promise<ClaimTimelineEvent[]> {
  const events: ClaimTimelineEvent[] = [];

  // Get versions
  const versions = await prisma.claimVersion.findMany({
    where: { claimId },
    include: {
      author: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  for (const v of versions) {
    events.push({
      id: `version-${v.id}`,
      type: "version",
      date: v.createdAt,
      actor: { id: v.author.id, name: v.author.name || "Unknown" },
      description:
        v.versionNumber === 1
          ? "Claim created"
          : `Claim ${v.changeType.toLowerCase()}`,
      details: {
        versionNumber: v.versionNumber,
        changeType: v.changeType,
        changeReason: v.changeReason,
        text: v.text,
      },
    });
  }

  // Get attacks
  const attacks = await prisma.attack.findMany({
    where: { targetClaimId: claimId },
    include: {
      createdBy: { select: { id: true, name: true } },
      attackingArgument: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  for (const a of attacks) {
    events.push({
      id: `attack-${a.id}`,
      type: "attack",
      date: a.createdAt,
      actor: { id: a.createdBy.id, name: a.createdBy.name || "Unknown" },
      description: `${a.attackType.toLowerCase()} attack`,
      details: {
        attackType: a.attackType,
        status: a.status,
        argumentId: a.attackingArgumentId,
      },
    });
  }

  // Get defenses
  const defenses = await prisma.defense.findMany({
    where: { claimId },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  for (const d of defenses) {
    events.push({
      id: `defense-${d.id}`,
      type: "defense",
      date: d.createdAt,
      actor: { id: d.createdBy.id, name: d.createdBy.name || "Unknown" },
      description: `${d.defenseType.replace("_", " ").toLowerCase()} defense`,
      details: {
        defenseType: d.defenseType,
        outcome: d.outcome,
        attackId: d.attackId,
      },
    });
  }

  // Sort by date
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  return events;
}

/**
 * Update consensus status based on challenges
 */
export async function updateConsensusStatus(claimId: string) {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      attacksReceived: {
        select: { status: true },
      },
    },
  });

  if (!claim) return;

  const attacks = claim.attacksReceived;
  const total = attacks.length;
  const open = attacks.filter((a) => a.status === "OPEN").length;
  const defended = attacks.filter((a) =>
    ["DEFENDED", "WITHDRAWN"].includes(a.status)
  ).length;
  const conceded = attacks.filter((a) => a.status === "CONCEDED").length;

  // Determine consensus status
  let consensusStatus: string = "UNDETERMINED";

  if (total === 0) {
    consensusStatus = "UNDETERMINED";
  } else if (conceded > total * 0.5) {
    consensusStatus = "REJECTED";
  } else if (defended === total) {
    consensusStatus = "ACCEPTED";
  } else if (open > 0) {
    consensusStatus = "CONTESTED";
  } else if (defended > conceded) {
    consensusStatus = "EMERGING";
  } else {
    consensusStatus = "CONTESTED";
  }

  await prisma.claim.update({
    where: { id: claimId },
    data: {
      challengeCount: total,
      openChallenges: open,
      defendedCount: defended,
      concededCount: conceded,
      consensusStatus: consensusStatus as any,
      consensusUpdatedAt: new Date(),
    },
  });
}

/**
 * Initialize version history for existing claim
 */
export async function initializeClaimVersionHistory(
  claimId: string,
  userId: string
) {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: { versions: true },
  });

  if (!claim) throw new Error("Claim not found");
  if (claim.versions.length > 0) return; // Already has versions

  // Create initial version
  const version = await prisma.claimVersion.create({
    data: {
      claimId,
      text: claim.text,
      type: claim.type,
      versionNumber: 1,
      changeType: "CREATED",
      authorId: claim.createdById || userId,
      createdAt: claim.createdAt,
    },
  });

  // Link as current version
  await prisma.claim.update({
    where: { id: claimId },
    data: { currentVersionId: version.id },
  });

  return version;
}
```

---

## Phase 3.1 Part 1 Complete

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Claim provenance schema | `prisma/schema.prisma` | 📋 Defined |
| 2 | ClaimVersion model | `prisma/schema.prisma` | 📋 Defined |
| 3 | Attack/Defense models | `prisma/schema.prisma` | 📋 Defined |
| 4 | CanonicalClaim registry | `prisma/schema.prisma` | 📋 Defined |
| 5 | Provenance types | `lib/provenance/types.ts` | 📋 Defined |
| 6 | Provenance service | `lib/provenance/provenanceService.ts` | 📋 Defined |

---

## Next: Part 2

Continue to Phase 3.1 Part 2 for:
- Challenge tracking service
- Canonical claim registry service
- API routes (provenance, challenges, timeline)
- UI components (ProvenanceTimeline, ChallengeReport, ConsensusIndicator)

---

*End of Phase 3.1 Part 1*
