# Phase 2.1: Debate Releases & Versioned Memory

**Sub-Phase:** 2.1 of 2.3  
**Timeline:** Weeks 1-4 of Phase 2  
**Status:** Planning  
**Depends On:** Phase 1 (Claims, Arguments, Deliberations)  
**Enables:** Citation of debate states, changelog tracking, academic integration

---

## Objective

Enable deliberations to publish versioned "releases" — snapshots of the current debate state that can be cited, compared, and tracked over time. Like software releases, these provide stable reference points in an evolving discussion.

---

## User Stories

| ID | Story | Priority | Effort |
|----|-------|----------|--------|
| US-2.1.1 | As a facilitator, I want to publish a release when we reach consensus | P0 | M |
| US-2.1.2 | As a researcher, I want to cite a specific version of a debate | P0 | S |
| US-2.1.3 | As a participant, I want to see what changed between releases | P0 | L |
| US-2.1.4 | As a reader, I want to view the state of debate at a past release | P1 | M |
| US-2.1.5 | As an author, I want to generate a BibTeX citation for a release | P1 | S |
| US-2.1.6 | As a journal, I want a DOI for a significant debate release | P2 | L |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    RELEASE ARCHITECTURE                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Deliberation (Live State)                                                  │
│   ┌────────────────────────────────────────────────────────────────────────┐ │
│   │  Claims: [C1, C2, C3, C4, C5]                                          │ │
│   │  Arguments: [A1→C1, A2→C2, A3 attacks C1]                              │ │
│   │  Status: {C1: DEFENDED, C2: CONTESTED, C3: UNRESOLVED}                 │ │
│   └────────────────────────────────────────────────────────────────────────┘ │
│                              │                                               │
│                              │ CREATE RELEASE                                │
│                              ▼                                               │
│   DebateRelease v1.0.0                                                       │
│   ┌────────────────────────────────────────────────────────────────────────┐ │
│   │  version: "1.0.0"                                                      │ │
│   │  title: "Initial Consensus"                                            │ │
│   │  claimSnapshot: {                                                      │ │
│   │    claims: [{id, text, type, status: "DEFENDED"}, ...]                 │ │
│   │    stats: {total: 5, defended: 2, contested: 2, unresolved: 1}        │ │
│   │  }                                                                     │ │
│   │  argumentSnapshot: {                                                   │ │
│   │    arguments: [{id, type, premises, conclusion, acceptable}, ...]      │ │
│   │    attackGraph: {...}                                                  │ │
│   │  }                                                                     │ │
│   │  citationUri: "mesh.agora/d/abc123/v1.0.0"                            │ │
│   └────────────────────────────────────────────────────────────────────────┘ │
│                              │                                               │
│                              │ COMPARE (DIFF)                                │
│                              ▼                                               │
│   DebateRelease v1.1.0                                                       │
│   ┌────────────────────────────────────────────────────────────────────────┐ │
│   │  changelogFromPrevious: {                                              │ │
│   │    newClaims: [C6],                                                    │ │
│   │    removedClaims: [],                                                  │ │
│   │    statusChanges: [{claim: C2, from: "CONTESTED", to: "DEFENDED"}],    │ │
│   │    newArguments: [A4],                                                 │ │
│   │    resolvedIssues: ["Methodological concern"]                          │ │
│   │  }                                                                     │ │
│   └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 2.1.1: Schema Definition

**File:** `prisma/schema.prisma` (additions)

```prisma
model DebateRelease {
  id                    String   @id @default(cuid())
  deliberationId        String
  deliberation          Deliberation @relation(fields: [deliberationId], references: [id], onDelete: Cascade)
  
  // Version info
  version               String   // Semantic version: "1.0.0", "1.1.0", etc.
  major                 Int      // For easy querying
  minor                 Int
  patch                 Int
  
  // Content
  title                 String
  summary               String?  @db.Text
  releaseNotes          String?  @db.Text
  
  // Snapshots (JSON for flexibility)
  claimSnapshot         Json     // Full claim state at release
  argumentSnapshot      Json     // Full argument state at release
  statsSnapshot         Json     // Summary statistics
  
  // Changelog
  changelogFromPrevious Json?    // Diff from previous version
  previousReleaseId     String?
  previousRelease       DebateRelease? @relation("ReleaseChain", fields: [previousReleaseId], references: [id])
  nextReleases          DebateRelease[] @relation("ReleaseChain")
  
  // Citation
  citationUri           String?  @unique  // Stable URI for citation
  doi                   String?  @unique  // Optional DOI
  bibtex                String?  @db.Text  // Pre-generated BibTeX
  
  // Metadata
  releasedById          String
  releasedBy            User     @relation(fields: [releasedById], references: [id])
  releasedAt            DateTime @default(now())
  isLatest              Boolean  @default(true)
  
  @@unique([deliberationId, version])
  @@index([deliberationId])
  @@index([releasedAt])
}

// Add relation to Deliberation
model Deliberation {
  // Existing fields...
  releases              DebateRelease[]
  latestReleaseId       String?  @unique
}
```

---

### Step 2.1.2: Snapshot Type Definitions

**File:** `lib/releases/types.ts`

```typescript
/**
 * Type definitions for debate release snapshots
 */

export interface ClaimSnapshot {
  claims: ClaimSnapshotItem[];
  stats: ClaimStats;
  generatedAt: string;  // ISO date
}

export interface ClaimSnapshotItem {
  id: string;
  text: string;
  type: string;  // ClaimType
  status: ClaimStatus;
  sourceId?: string;
  sourceTitle?: string;
  createdById: string;
  createdByName: string;
  attackCount: number;
  supportCount: number;
  createdAt: string;
}

export type ClaimStatus =
  | "DEFENDED"      // Has support, attacks defeated
  | "CONTESTED"     // Under active attack
  | "UNRESOLVED"    // No clear status
  | "WITHDRAWN"     // Author withdrew
  | "ACCEPTED";     // Consensus accepted

export interface ClaimStats {
  total: number;
  defended: number;
  contested: number;
  unresolved: number;
  withdrawn: number;
  accepted: number;
}

export interface ArgumentSnapshot {
  arguments: ArgumentSnapshotItem[];
  attackGraph: AttackGraphSnapshot;
  stats: ArgumentStats;
  generatedAt: string;
}

export interface ArgumentSnapshotItem {
  id: string;
  type: string;  // ArgumentType or scheme
  premises: string[];  // Claim IDs
  conclusion: string;  // Claim ID
  schemeId?: string;
  schemeName?: string;
  acceptable: boolean;  // ASPIC+ acceptability
  attackedBy: string[];  // Argument IDs that attack this
  attacks: string[];     // Argument IDs this attacks
  createdById: string;
  createdByName: string;
  createdAt: string;
}

export interface AttackGraphSnapshot {
  nodes: { id: string; type: "claim" | "argument" }[];
  edges: { from: string; to: string; type: "attack" | "support" | "undercut" }[];
}

export interface ArgumentStats {
  total: number;
  acceptable: number;
  defeated: number;
  attackEdges: number;
  supportEdges: number;
}

export interface Changelog {
  fromVersion: string;
  toVersion: string;
  generatedAt: string;
  
  claims: {
    added: ChangelogClaim[];
    removed: ChangelogClaim[];
    statusChanged: ChangelogStatusChange[];
    modified: ChangelogModification[];
  };
  
  arguments: {
    added: ChangelogArgument[];
    removed: ChangelogArgument[];
    acceptabilityChanged: ChangelogAcceptabilityChange[];
  };
  
  summary: {
    claimsAdded: number;
    claimsRemoved: number;
    statusChanges: number;
    argumentsAdded: number;
    argumentsRemoved: number;
    netDefended: number;  // Change in defended count
  };
}

export interface ChangelogClaim {
  id: string;
  text: string;
  type: string;
  status: ClaimStatus;
}

export interface ChangelogStatusChange {
  claimId: string;
  claimText: string;
  fromStatus: ClaimStatus;
  toStatus: ClaimStatus;
}

export interface ChangelogModification {
  claimId: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export interface ChangelogArgument {
  id: string;
  type: string;
  conclusionText: string;
}

export interface ChangelogAcceptabilityChange {
  argumentId: string;
  conclusionText: string;
  fromAcceptable: boolean;
  toAcceptable: boolean;
}

// Version parsing
export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
  raw: string;
}

export function parseVersion(version: string): SemanticVersion {
  const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    raw: version.startsWith("v") ? version : `v${version}`,
  };
}

export function formatVersion(v: SemanticVersion): string {
  return `${v.major}.${v.minor}.${v.patch}`;
}

export function incrementVersion(
  current: SemanticVersion,
  type: "major" | "minor" | "patch"
): SemanticVersion {
  switch (type) {
    case "major":
      return { major: current.major + 1, minor: 0, patch: 0, raw: "" };
    case "minor":
      return { major: current.major, minor: current.minor + 1, patch: 0, raw: "" };
    case "patch":
      return { major: current.major, minor: current.minor, patch: current.patch + 1, raw: "" };
  }
}
```

---

### Step 2.1.3: Snapshot Generation Service

**File:** `lib/releases/snapshotService.ts`

```typescript
/**
 * Service for generating deliberation snapshots
 */

import { prisma } from "@/lib/prisma";
import {
  ClaimSnapshot,
  ClaimSnapshotItem,
  ClaimStatus,
  ArgumentSnapshot,
  ArgumentSnapshotItem,
  AttackGraphSnapshot,
} from "./types";

/**
 * Generate a complete claim snapshot for a deliberation
 */
export async function generateClaimSnapshot(
  deliberationId: string
): Promise<ClaimSnapshot> {
  const claims = await prisma.claim.findMany({
    where: { deliberationId },
    include: {
      source: { select: { id: true, title: true } },
      createdBy: { select: { id: true, name: true } },
      _count: {
        select: {
          attackedBy: true,
          supportedBy: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Calculate status for each claim
  const claimStatuses = await calculateClaimStatuses(deliberationId);

  const snapshotItems: ClaimSnapshotItem[] = claims.map((claim) => ({
    id: claim.id,
    text: claim.text,
    type: claim.type || "THESIS",
    status: claimStatuses.get(claim.id) || "UNRESOLVED",
    sourceId: claim.source?.id,
    sourceTitle: claim.source?.title,
    createdById: claim.createdBy.id,
    createdByName: claim.createdBy.name || "Unknown",
    attackCount: claim._count.attackedBy,
    supportCount: claim._count.supportedBy,
    createdAt: claim.createdAt.toISOString(),
  }));

  // Calculate stats
  const stats = {
    total: snapshotItems.length,
    defended: snapshotItems.filter((c) => c.status === "DEFENDED").length,
    contested: snapshotItems.filter((c) => c.status === "CONTESTED").length,
    unresolved: snapshotItems.filter((c) => c.status === "UNRESOLVED").length,
    withdrawn: snapshotItems.filter((c) => c.status === "WITHDRAWN").length,
    accepted: snapshotItems.filter((c) => c.status === "ACCEPTED").length,
  };

  return {
    claims: snapshotItems,
    stats,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Calculate claim statuses based on ASPIC+ evaluation
 */
async function calculateClaimStatuses(
  deliberationId: string
): Promise<Map<string, ClaimStatus>> {
  const statuses = new Map<string, ClaimStatus>();

  // Get all claims and their attack/support relationships
  const claims = await prisma.claim.findMany({
    where: { deliberationId },
    include: {
      attackedBy: {
        include: {
          premises: true,
        },
      },
      supportedBy: {
        include: {
          premises: true,
        },
      },
    },
  });

  for (const claim of claims) {
    // Simple heuristic for now (can be replaced with full ASPIC+ later)
    const hasUndefeatedAttacks = claim.attackedBy.some((arg) => {
      // Check if attacking argument is itself undefeated
      // Simplified: if it has premises, it's considered active
      return arg.premises.length > 0;
    });

    const hasSupport = claim.supportedBy.length > 0;

    if (hasUndefeatedAttacks) {
      statuses.set(claim.id, "CONTESTED");
    } else if (hasSupport) {
      statuses.set(claim.id, "DEFENDED");
    } else {
      statuses.set(claim.id, "UNRESOLVED");
    }
  }

  return statuses;
}

/**
 * Generate argument snapshot
 */
export async function generateArgumentSnapshot(
  deliberationId: string
): Promise<ArgumentSnapshot> {
  const arguments_ = await prisma.argument.findMany({
    where: { deliberationId },
    include: {
      premises: { select: { id: true, text: true } },
      conclusion: { select: { id: true, text: true } },
      scheme: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      attackedBy: { select: { id: true } },
      attacks: { select: { id: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Calculate acceptability (simplified)
  const acceptability = await calculateArgumentAcceptability(deliberationId);

  const snapshotItems: ArgumentSnapshotItem[] = arguments_.map((arg) => ({
    id: arg.id,
    type: arg.type || "DEDUCTIVE",
    premises: arg.premises.map((p) => p.id),
    conclusion: arg.conclusion?.id || "",
    schemeId: arg.scheme?.id,
    schemeName: arg.scheme?.name,
    acceptable: acceptability.get(arg.id) ?? true,
    attackedBy: arg.attackedBy.map((a) => a.id),
    attacks: arg.attacks.map((a) => a.id),
    createdById: arg.createdBy.id,
    createdByName: arg.createdBy.name || "Unknown",
    createdAt: arg.createdAt.toISOString(),
  }));

  // Build attack graph
  const attackGraph = buildAttackGraph(arguments_);

  const stats = {
    total: snapshotItems.length,
    acceptable: snapshotItems.filter((a) => a.acceptable).length,
    defeated: snapshotItems.filter((a) => !a.acceptable).length,
    attackEdges: attackGraph.edges.filter((e) => e.type === "attack").length,
    supportEdges: attackGraph.edges.filter((e) => e.type === "support").length,
  };

  return {
    arguments: snapshotItems,
    attackGraph,
    stats,
    generatedAt: new Date().toISOString(),
  };
}

async function calculateArgumentAcceptability(
  deliberationId: string
): Promise<Map<string, boolean>> {
  // Simplified acceptability calculation
  // In production, use full ASPIC+ grounded semantics
  const acceptability = new Map<string, boolean>();

  const arguments_ = await prisma.argument.findMany({
    where: { deliberationId },
    include: {
      attackedBy: true,
    },
  });

  for (const arg of arguments_) {
    // Simple: acceptable if not attacked
    acceptability.set(arg.id, arg.attackedBy.length === 0);
  }

  return acceptability;
}

function buildAttackGraph(arguments_: any[]): AttackGraphSnapshot {
  const nodes: AttackGraphSnapshot["nodes"] = [];
  const edges: AttackGraphSnapshot["edges"] = [];
  const seenNodes = new Set<string>();

  for (const arg of arguments_) {
    // Add argument node
    if (!seenNodes.has(arg.id)) {
      nodes.push({ id: arg.id, type: "argument" });
      seenNodes.add(arg.id);
    }

    // Add conclusion as claim node
    if (arg.conclusion && !seenNodes.has(arg.conclusion.id)) {
      nodes.push({ id: arg.conclusion.id, type: "claim" });
      seenNodes.add(arg.conclusion.id);
    }

    // Add support edge from argument to conclusion
    if (arg.conclusion) {
      edges.push({
        from: arg.id,
        to: arg.conclusion.id,
        type: "support",
      });
    }

    // Add attack edges
    for (const attacked of arg.attacks || []) {
      edges.push({
        from: arg.id,
        to: attacked.id,
        type: "attack",
      });
    }
  }

  return { nodes, edges };
}
```

---

### Step 2.1.4: Changelog Generation Service

**File:** `lib/releases/changelogService.ts`

```typescript
/**
 * Service for generating changelogs between releases
 */

import {
  Changelog,
  ClaimSnapshot,
  ArgumentSnapshot,
  ChangelogClaim,
  ChangelogStatusChange,
  ChangelogArgument,
  ChangelogAcceptabilityChange,
} from "./types";

/**
 * Generate changelog between two snapshots
 */
export function generateChangelog(
  fromVersion: string,
  toVersion: string,
  fromClaims: ClaimSnapshot,
  toClaims: ClaimSnapshot,
  fromArguments: ArgumentSnapshot,
  toArguments: ArgumentSnapshot
): Changelog {
  // Build lookup maps
  const fromClaimMap = new Map(fromClaims.claims.map((c) => [c.id, c]));
  const toClaimMap = new Map(toClaims.claims.map((c) => [c.id, c]));
  const fromArgMap = new Map(fromArguments.arguments.map((a) => [a.id, a]));
  const toArgMap = new Map(toArguments.arguments.map((a) => [a.id, a]));

  // Find claim changes
  const claimsAdded: ChangelogClaim[] = [];
  const claimsRemoved: ChangelogClaim[] = [];
  const statusChanges: ChangelogStatusChange[] = [];

  // Claims added
  for (const claim of toClaims.claims) {
    if (!fromClaimMap.has(claim.id)) {
      claimsAdded.push({
        id: claim.id,
        text: claim.text,
        type: claim.type,
        status: claim.status,
      });
    }
  }

  // Claims removed
  for (const claim of fromClaims.claims) {
    if (!toClaimMap.has(claim.id)) {
      claimsRemoved.push({
        id: claim.id,
        text: claim.text,
        type: claim.type,
        status: claim.status,
      });
    }
  }

  // Status changes
  for (const toClaim of toClaims.claims) {
    const fromClaim = fromClaimMap.get(toClaim.id);
    if (fromClaim && fromClaim.status !== toClaim.status) {
      statusChanges.push({
        claimId: toClaim.id,
        claimText: toClaim.text,
        fromStatus: fromClaim.status,
        toStatus: toClaim.status,
      });
    }
  }

  // Find argument changes
  const argumentsAdded: ChangelogArgument[] = [];
  const argumentsRemoved: ChangelogArgument[] = [];
  const acceptabilityChanges: ChangelogAcceptabilityChange[] = [];

  // Arguments added
  for (const arg of toArguments.arguments) {
    if (!fromArgMap.has(arg.id)) {
      const conclusion = toClaims.claims.find((c) => c.id === arg.conclusion);
      argumentsAdded.push({
        id: arg.id,
        type: arg.type,
        conclusionText: conclusion?.text || "Unknown",
      });
    }
  }

  // Arguments removed
  for (const arg of fromArguments.arguments) {
    if (!toArgMap.has(arg.id)) {
      const conclusion = fromClaims.claims.find((c) => c.id === arg.conclusion);
      argumentsRemoved.push({
        id: arg.id,
        type: arg.type,
        conclusionText: conclusion?.text || "Unknown",
      });
    }
  }

  // Acceptability changes
  for (const toArg of toArguments.arguments) {
    const fromArg = fromArgMap.get(toArg.id);
    if (fromArg && fromArg.acceptable !== toArg.acceptable) {
      const conclusion = toClaims.claims.find((c) => c.id === toArg.conclusion);
      acceptabilityChanges.push({
        argumentId: toArg.id,
        conclusionText: conclusion?.text || "Unknown",
        fromAcceptable: fromArg.acceptable,
        toAcceptable: toArg.acceptable,
      });
    }
  }

  // Calculate summary
  const netDefended =
    toClaims.stats.defended - fromClaims.stats.defended;

  return {
    fromVersion,
    toVersion,
    generatedAt: new Date().toISOString(),
    claims: {
      added: claimsAdded,
      removed: claimsRemoved,
      statusChanged: statusChanges,
      modified: [], // Text modifications tracked separately
    },
    arguments: {
      added: argumentsAdded,
      removed: argumentsRemoved,
      acceptabilityChanged: acceptabilityChanges,
    },
    summary: {
      claimsAdded: claimsAdded.length,
      claimsRemoved: claimsRemoved.length,
      statusChanges: statusChanges.length,
      argumentsAdded: argumentsAdded.length,
      argumentsRemoved: argumentsRemoved.length,
      netDefended,
    },
  };
}

/**
 * Generate human-readable changelog text
 */
export function formatChangelogText(changelog: Changelog): string {
  const lines: string[] = [];

  lines.push(`# Changelog: ${changelog.fromVersion} → ${changelog.toVersion}`);
  lines.push(`Generated: ${changelog.generatedAt}`);
  lines.push("");

  // Summary
  lines.push("## Summary");
  lines.push(`- Claims added: ${changelog.summary.claimsAdded}`);
  lines.push(`- Claims removed: ${changelog.summary.claimsRemoved}`);
  lines.push(`- Status changes: ${changelog.summary.statusChanges}`);
  lines.push(`- Arguments added: ${changelog.summary.argumentsAdded}`);
  lines.push(`- Arguments removed: ${changelog.summary.argumentsRemoved}`);
  lines.push(`- Net defended claims: ${changelog.summary.netDefended > 0 ? "+" : ""}${changelog.summary.netDefended}`);
  lines.push("");

  // Claims added
  if (changelog.claims.added.length > 0) {
    lines.push("## New Claims");
    for (const claim of changelog.claims.added) {
      lines.push(`+ [${claim.status}] "${truncate(claim.text, 100)}"`);
    }
    lines.push("");
  }

  // Claims removed
  if (changelog.claims.removed.length > 0) {
    lines.push("## Removed Claims");
    for (const claim of changelog.claims.removed) {
      lines.push(`- "${truncate(claim.text, 100)}"`);
    }
    lines.push("");
  }

  // Status changes
  if (changelog.claims.statusChanged.length > 0) {
    lines.push("## Status Changes");
    for (const change of changelog.claims.statusChanged) {
      const arrow = isStatusImprovement(change.fromStatus, change.toStatus)
        ? "↑"
        : "↓";
      lines.push(
        `${arrow} "${truncate(change.claimText, 80)}" ${change.fromStatus} → ${change.toStatus}`
      );
    }
    lines.push("");
  }

  // Arguments added
  if (changelog.arguments.added.length > 0) {
    lines.push("## New Arguments");
    for (const arg of changelog.arguments.added) {
      lines.push(`+ [${arg.type}] Supporting: "${truncate(arg.conclusionText, 80)}"`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length - 3) + "...";
}

function isStatusImprovement(from: string, to: string): boolean {
  const order = ["WITHDRAWN", "CONTESTED", "UNRESOLVED", "DEFENDED", "ACCEPTED"];
  return order.indexOf(to) > order.indexOf(from);
}
```

---

### Step 2.1.5: Release Service

**File:** `lib/releases/releaseService.ts`

```typescript
/**
 * Main service for creating and managing releases
 */

import { prisma } from "@/lib/prisma";
import {
  generateClaimSnapshot,
  generateArgumentSnapshot,
} from "./snapshotService";
import { generateChangelog, formatChangelogText } from "./changelogService";
import {
  parseVersion,
  formatVersion,
  incrementVersion,
  SemanticVersion,
} from "./types";

interface CreateReleaseInput {
  deliberationId: string;
  title: string;
  summary?: string;
  releaseNotes?: string;
  versionType?: "major" | "minor" | "patch";
  customVersion?: string;
  releasedById: string;
}

export async function createRelease(input: CreateReleaseInput) {
  const { deliberationId, releasedById } = input;

  // Get latest release for version calculation
  const latestRelease = await prisma.debateRelease.findFirst({
    where: { deliberationId, isLatest: true },
    orderBy: { releasedAt: "desc" },
  });

  // Calculate next version
  let version: SemanticVersion;
  if (input.customVersion) {
    version = parseVersion(input.customVersion);
  } else if (latestRelease) {
    const current = parseVersion(latestRelease.version);
    version = incrementVersion(current, input.versionType || "minor");
  } else {
    version = { major: 1, minor: 0, patch: 0, raw: "1.0.0" };
  }

  const versionString = formatVersion(version);

  // Generate snapshots
  const claimSnapshot = await generateClaimSnapshot(deliberationId);
  const argumentSnapshot = await generateArgumentSnapshot(deliberationId);

  // Generate changelog if there's a previous release
  let changelog = null;
  let changelogText = null;
  if (latestRelease) {
    changelog = generateChangelog(
      latestRelease.version,
      versionString,
      latestRelease.claimSnapshot as any,
      claimSnapshot,
      latestRelease.argumentSnapshot as any,
      argumentSnapshot
    );
    changelogText = formatChangelogText(changelog);
  }

  // Generate citation URI
  const deliberation = await prisma.deliberation.findUnique({
    where: { id: deliberationId },
    select: { id: true, title: true },
  });

  const citationUri = `mesh.agora/d/${deliberationId}/v${versionString}`;

  // Generate BibTeX
  const bibtex = generateBibTeX({
    title: input.title || deliberation?.title || "Untitled Debate",
    version: versionString,
    uri: citationUri,
    year: new Date().getFullYear(),
  });

  // Mark previous release as not latest
  if (latestRelease) {
    await prisma.debateRelease.update({
      where: { id: latestRelease.id },
      data: { isLatest: false },
    });
  }

  // Create release
  const release = await prisma.debateRelease.create({
    data: {
      deliberationId,
      version: versionString,
      major: version.major,
      minor: version.minor,
      patch: version.patch,
      title: input.title,
      summary: input.summary,
      releaseNotes: input.releaseNotes,
      claimSnapshot,
      argumentSnapshot,
      statsSnapshot: {
        claims: claimSnapshot.stats,
        arguments: argumentSnapshot.stats,
      },
      changelogFromPrevious: changelog,
      previousReleaseId: latestRelease?.id,
      citationUri,
      bibtex,
      releasedById,
      isLatest: true,
    },
    include: {
      releasedBy: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  // Update deliberation with latest release reference
  await prisma.deliberation.update({
    where: { id: deliberationId },
    data: { latestReleaseId: release.id },
  });

  return release;
}

function generateBibTeX(params: {
  title: string;
  version: string;
  uri: string;
  year: number;
}): string {
  const key = `agora_${params.version.replace(/\./g, "_")}`;
  return `@misc{${key},
  title = {${params.title} (Release ${params.version})},
  howpublished = {Mesh Agora},
  url = {${params.uri}},
  year = {${params.year}},
  note = {Debate release snapshot}
}`;
}

/**
 * Get all releases for a deliberation
 */
export async function getReleases(deliberationId: string) {
  return prisma.debateRelease.findMany({
    where: { deliberationId },
    orderBy: { releasedAt: "desc" },
    include: {
      releasedBy: {
        select: { id: true, name: true, image: true },
      },
    },
  });
}

/**
 * Get a specific release
 */
export async function getRelease(releaseId: string) {
  return prisma.debateRelease.findUnique({
    where: { id: releaseId },
    include: {
      releasedBy: {
        select: { id: true, name: true, image: true },
      },
      deliberation: {
        select: { id: true, title: true },
      },
      previousRelease: {
        select: { id: true, version: true },
      },
    },
  });
}

/**
 * Get release by version
 */
export async function getReleaseByVersion(
  deliberationId: string,
  version: string
) {
  return prisma.debateRelease.findUnique({
    where: {
      deliberationId_version: {
        deliberationId,
        version,
      },
    },
    include: {
      releasedBy: {
        select: { id: true, name: true, image: true },
      },
    },
  });
}

/**
 * Compare two releases
 */
export async function compareReleases(
  releaseId1: string,
  releaseId2: string
) {
  const [release1, release2] = await Promise.all([
    prisma.debateRelease.findUnique({ where: { id: releaseId1 } }),
    prisma.debateRelease.findUnique({ where: { id: releaseId2 } }),
  ]);

  if (!release1 || !release2) {
    throw new Error("One or both releases not found");
  }

  // Ensure consistent ordering (earlier first)
  const [from, to] =
    release1.releasedAt < release2.releasedAt
      ? [release1, release2]
      : [release2, release1];

  return generateChangelog(
    from.version,
    to.version,
    from.claimSnapshot as any,
    to.claimSnapshot as any,
    from.argumentSnapshot as any,
    to.argumentSnapshot as any
  );
}
```

---

### Step 2.1.6: Release API Routes

**File:** `app/api/deliberations/[id]/releases/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createRelease, getReleases } from "@/lib/releases/releaseService";
import { z } from "zod";

interface RouteContext {
  params: { id: string };
}

const CreateReleaseSchema = z.object({
  title: z.string().min(3).max(200),
  summary: z.string().max(2000).optional(),
  releaseNotes: z.string().max(10000).optional(),
  versionType: z.enum(["major", "minor", "patch"]).optional(),
  customVersion: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
});

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const releases = await getReleases(context.params.id);
  return NextResponse.json({ releases });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const input = CreateReleaseSchema.parse(body);

    const release = await createRelease({
      deliberationId: context.params.id,
      ...input,
      releasedById: session.user.id,
    });

    return NextResponse.json({ release }, { status: 201 });
  } catch (error) {
    console.error("Create release error:", error);
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

**File:** `app/api/deliberations/[id]/releases/[releaseId]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRelease } from "@/lib/releases/releaseService";

interface RouteContext {
  params: { id: string; releaseId: string };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const release = await getRelease(context.params.releaseId);

  if (!release || release.deliberation.id !== context.params.id) {
    return NextResponse.json({ error: "Release not found" }, { status: 404 });
  }

  return NextResponse.json({ release });
}
```

**File:** `app/api/deliberations/[id]/releases/compare/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { compareReleases } from "@/lib/releases/releaseService";
import { z } from "zod";

interface RouteContext {
  params: { id: string };
}

const CompareSchema = z.object({
  from: z.string(),
  to: z.string(),
});

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  
  try {
    const input = CompareSchema.parse({
      from: searchParams.get("from"),
      to: searchParams.get("to"),
    });

    const changelog = await compareReleases(input.from, input.to);
    return NextResponse.json({ changelog });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Missing from/to release IDs" },
        { status: 400 }
      );
    }
    throw error;
  }
}
```

---

## Phase 2.1 Summary Checklist

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | DebateRelease schema | `prisma/schema.prisma` | 📋 Defined |
| 2 | Snapshot type definitions | `lib/releases/types.ts` | 📋 Defined |
| 3 | Snapshot generation service | `lib/releases/snapshotService.ts` | 📋 Defined |
| 4 | Changelog generation service | `lib/releases/changelogService.ts` | 📋 Defined |
| 5 | Release service | `lib/releases/releaseService.ts` | 📋 Defined |
| 6 | List/create releases API | `app/api/deliberations/[id]/releases/route.ts` | 📋 Defined |
| 7 | Get release API | `app/api/deliberations/[id]/releases/[releaseId]/route.ts` | 📋 Defined |
| 8 | Compare releases API | `app/api/deliberations/[id]/releases/compare/route.ts` | 📋 Defined |

---

## Next: UI Components

Continue to [Phase 2.1 Part 2: UI Components](./PHASE_2.1_DEBATE_RELEASES_PART2.md) for:
- ReleaseList component
- CreateReleaseModal
- ReleaseDetailView
- ChangelogViewer
- CitationExport

---

*End of Phase 2.1 Part 1*
