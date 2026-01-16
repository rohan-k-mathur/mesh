# Phase 3.1: Claim Provenance Tracking — Part 2

**Sub-Phase:** 3.1 of 3.3 (Continued)  
**Focus:** Challenge Tracking, APIs & UI Components

---

## Implementation Steps (Continued)

### Step 3.1.4: Challenge Service

**File:** `lib/provenance/challengeService.ts`

```typescript
/**
 * Service for tracking challenges (attacks) and defenses on claims
 */

import { prisma } from "@/lib/prisma";
import {
  ChallengeReport,
  AttackSummary,
  DefenseSummary,
  AttackType,
  AttackStatus,
} from "./types";
import { updateConsensusStatus } from "./provenanceService";

/**
 * Get comprehensive challenge report for a claim
 */
export async function getChallengeReport(
  claimId: string
): Promise<ChallengeReport | null> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    select: {
      id: true,
      text: true,
      consensusStatus: true,
    },
  });

  if (!claim) return null;

  // Get all attacks with their arguments
  const attacks = await prisma.attack.findMany({
    where: { targetClaimId: claimId },
    include: {
      attackingArgument: {
        include: {
          createdBy: { select: { id: true, name: true } },
          conclusion: { select: { text: true } },
        },
      },
      defenses: {
        select: { id: true },
      },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get all defenses
  const defenses = await prisma.defense.findMany({
    where: { claimId },
    include: {
      defendingArgument: {
        include: {
          createdBy: { select: { id: true, name: true } },
          conclusion: { select: { text: true } },
        },
      },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group attacks by type
  const rebuttals: AttackSummary[] = [];
  const undercuts: AttackSummary[] = [];
  const undermines: AttackSummary[] = [];

  for (const attack of attacks) {
    const summary: AttackSummary = {
      id: attack.id,
      attackType: attack.attackType as AttackType,
      status: attack.status as AttackStatus,
      argument: {
        id: attack.attackingArgument.id,
        summary:
          attack.attackingArgument.conclusion?.text ||
          "Argument without conclusion",
        author: attack.attackingArgument.createdBy,
      },
      defenseCount: attack.defenses.length,
      createdAt: attack.createdAt,
    };

    switch (attack.attackType) {
      case "REBUTTAL":
        rebuttals.push(summary);
        break;
      case "UNDERCUT":
        undercuts.push(summary);
        break;
      case "UNDERMINE":
        undermines.push(summary);
        break;
    }
  }

  // Map defenses
  const defenseSummaries: DefenseSummary[] = defenses.map((d) => ({
    id: d.id,
    attackId: d.attackId,
    defenseType: d.defenseType,
    outcome: d.outcome || undefined,
    argument: {
      id: d.defendingArgument.id,
      summary:
        d.defendingArgument.conclusion?.text || "Defense without conclusion",
      author: d.defendingArgument.createdBy,
    },
    createdAt: d.createdAt,
  }));

  // Determine resolution status
  const totalAttacks = attacks.length;
  const openAttacks = attacks.filter((a) => a.status === "OPEN").length;
  const defendedAttacks = attacks.filter((a) =>
    ["DEFENDED", "WITHDRAWN"].includes(a.status)
  ).length;
  const concededAttacks = attacks.filter((a) => a.status === "CONCEDED").length;

  let resolutionStatus: ChallengeReport["resolutionStatus"];
  let resolutionSummary: string;

  if (totalAttacks === 0) {
    resolutionStatus = "open";
    resolutionSummary = "No challenges recorded";
  } else if (defendedAttacks === totalAttacks) {
    resolutionStatus = "defended";
    resolutionSummary = `All ${totalAttacks} challenge(s) successfully defended`;
  } else if (concededAttacks === totalAttacks) {
    resolutionStatus = "conceded";
    resolutionSummary = `All ${totalAttacks} challenge(s) conceded`;
  } else if (openAttacks === 0 && defendedAttacks > concededAttacks) {
    resolutionStatus = "defended";
    resolutionSummary = `${defendedAttacks} defended, ${concededAttacks} conceded`;
  } else if (openAttacks === 0 && concededAttacks >= defendedAttacks) {
    resolutionStatus = "conceded";
    resolutionSummary = `${concededAttacks} conceded, ${defendedAttacks} defended`;
  } else if (attacks.some((a) => a.status === "STALEMATE")) {
    resolutionStatus = "stalemate";
    resolutionSummary = "Some challenges remain unresolved";
  } else {
    resolutionStatus = "mixed";
    resolutionSummary = `${openAttacks} open, ${defendedAttacks} defended, ${concededAttacks} conceded`;
  }

  return {
    claim: {
      id: claim.id,
      text: claim.text,
      status: claim.consensusStatus as any,
    },
    challenges: {
      rebuttals,
      undercuts,
      undermines,
    },
    defenses: defenseSummaries,
    resolutionStatus,
    resolutionSummary,
  };
}

/**
 * Record a new attack on a claim
 */
export async function createAttack(
  targetClaimId: string,
  attackingArgumentId: string,
  attackType: AttackType,
  userId: string,
  attackSubtype?: string
) {
  const attack = await prisma.attack.create({
    data: {
      targetClaimId,
      attackingArgumentId,
      attackType,
      attackSubtype,
      status: "OPEN",
      createdById: userId,
    },
    include: {
      attackingArgument: {
        select: { id: true },
      },
    },
  });

  // Update claim's challenge counts
  await updateConsensusStatus(targetClaimId);

  return attack;
}

/**
 * Record a defense against an attack
 */
export async function createDefense(
  claimId: string,
  attackId: string,
  defendingArgumentId: string,
  defenseType: string,
  userId: string
) {
  const defense = await prisma.defense.create({
    data: {
      claimId,
      attackId,
      defendingArgumentId,
      defenseType: defenseType as any,
      createdById: userId,
    },
  });

  return defense;
}

/**
 * Update attack status (e.g., mark as defended)
 */
export async function updateAttackStatus(
  attackId: string,
  status: AttackStatus,
  userId: string,
  resolutionNote?: string
) {
  const attack = await prisma.attack.update({
    where: { id: attackId },
    data: {
      status,
      resolvedAt: ["DEFENDED", "CONCEDED", "WITHDRAWN", "STALEMATE"].includes(
        status
      )
        ? new Date()
        : undefined,
      resolvedById: userId,
      resolutionNote,
    },
  });

  // Update claim's consensus status
  await updateConsensusStatus(attack.targetClaimId);

  return attack;
}

/**
 * Update defense outcome
 */
export async function updateDefenseOutcome(
  defenseId: string,
  outcome: "SUCCESSFUL" | "PARTIAL" | "UNSUCCESSFUL",
  outcomeNote?: string
) {
  const defense = await prisma.defense.update({
    where: { id: defenseId },
    data: {
      outcome,
      outcomeNote,
    },
    include: {
      attack: true,
    },
  });

  // If defense successful, update attack status
  if (outcome === "SUCCESSFUL") {
    await updateAttackStatus(defense.attackId, "DEFENDED", defense.createdById);
  }

  return defense;
}

/**
 * Get attack history for a claim
 */
export async function getAttackHistory(claimId: string) {
  return prisma.attack.findMany({
    where: { targetClaimId: claimId },
    include: {
      attackingArgument: {
        include: {
          createdBy: { select: { id: true, name: true } },
          premises: { select: { text: true } },
          conclusion: { select: { text: true } },
        },
      },
      defenses: {
        include: {
          defendingArgument: {
            include: {
              createdBy: { select: { id: true, name: true } },
            },
          },
        },
      },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get claims with most challenges (for discovery)
 */
export async function getMostContestedClaims(
  deliberationId?: string,
  limit = 10
) {
  const where: any = {
    challengeCount: { gt: 0 },
  };

  if (deliberationId) {
    where.deliberationId = deliberationId;
  }

  return prisma.claim.findMany({
    where,
    select: {
      id: true,
      text: true,
      consensusStatus: true,
      challengeCount: true,
      openChallenges: true,
      defendedCount: true,
      concededCount: true,
    },
    orderBy: { challengeCount: "desc" },
    take: limit,
  });
}
```

---

### Step 3.1.5: Canonical Claim Service

**File:** `lib/provenance/canonicalService.ts`

```typescript
/**
 * Service for managing canonical claim identities across deliberations
 */

import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Generate a canonical ID for a claim
 */
export function generateCanonicalId(): string {
  const randomBytes = crypto.randomBytes(8);
  return `claim:${randomBytes.toString("hex")}`;
}

/**
 * Generate semantic hash for similarity matching
 */
function generateSemanticHash(text: string): string {
  // Simple approach: normalize and hash
  // In production, use embeddings for semantic similarity
  const normalized = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

/**
 * Register a claim in the canonical registry
 */
export async function registerCanonicalClaim(
  claimId: string,
  userId: string
) {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      deliberation: { select: { id: true } },
    },
  });

  if (!claim) throw new Error("Claim not found");
  if (claim.canonicalId) {
    // Already registered, return existing
    return prisma.canonicalClaim.findUnique({
      where: { canonicalId: claim.canonicalId },
    });
  }

  const canonicalId = generateCanonicalId();
  const semanticHash = generateSemanticHash(claim.text);

  // Create canonical entry and link claim in transaction
  const result = await prisma.$transaction(async (tx) => {
    const canonical = await tx.canonicalClaim.create({
      data: {
        canonicalId,
        representativeText: claim.text,
        semanticHash,
        totalInstances: 1,
      },
    });

    // Link the claim to the canonical entry
    await tx.claim.update({
      where: { id: claimId },
      data: { canonicalId },
    });

    // Create instance record
    await tx.claimInstance.create({
      data: {
        canonicalClaimId: canonical.id,
        claimId,
        deliberationId: claim.deliberationId,
        instanceType: "ORIGINAL",
        localStatus: claim.consensusStatus,
        linkedById: userId,
      },
    });

    return canonical;
  });

  return result;
}

/**
 * Link a claim to an existing canonical claim
 */
export async function linkToCanonicalClaim(
  claimId: string,
  canonicalId: string,
  instanceType: "EQUIVALENT" | "IMPORTED" | "FORKED" | "DERIVED",
  userId: string
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

  await prisma.$transaction(async (tx) => {
    // Update claim's canonical ID
    await tx.claim.update({
      where: { id: claimId },
      data: { canonicalId },
    });

    // Create instance record
    await tx.claimInstance.create({
      data: {
        canonicalClaimId: canonical.id,
        claimId,
        deliberationId: claim.deliberationId,
        instanceType,
        localStatus: claim.consensusStatus,
        linkedById: userId,
      },
    });

    // Update instance count
    await tx.canonicalClaim.update({
      where: { id: canonical.id },
      data: {
        totalInstances: { increment: 1 },
        lastActivityAt: new Date(),
      },
    });
  });

  return canonical;
}

/**
 * Find potential canonical matches for a claim
 */
export async function findSimilarCanonicalClaims(
  text: string,
  limit = 5
) {
  const semanticHash = generateSemanticHash(text);

  // First try exact semantic hash match
  const exactMatches = await prisma.canonicalClaim.findMany({
    where: { semanticHash },
    include: {
      instances: {
        include: {
          claim: {
            select: { id: true, text: true, consensusStatus: true },
          },
          deliberation: {
            select: { id: true, title: true },
          },
        },
      },
    },
    take: limit,
  });

  if (exactMatches.length > 0) {
    return exactMatches;
  }

  // Fall back to text search
  const textMatches = await prisma.canonicalClaim.findMany({
    where: {
      representativeText: {
        search: text.split(" ").slice(0, 5).join(" & "),
      },
    },
    include: {
      instances: {
        include: {
          claim: {
            select: { id: true, text: true, consensusStatus: true },
          },
          deliberation: {
            select: { id: true, title: true },
          },
        },
      },
    },
    take: limit,
  });

  return textMatches;
}

/**
 * Get all instances of a canonical claim
 */
export async function getCanonicalClaimInstances(canonicalId: string) {
  return prisma.canonicalClaim.findUnique({
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
}

/**
 * Update global status based on all instances
 */
export async function updateGlobalCanonicalStatus(canonicalId: string) {
  const canonical = await prisma.canonicalClaim.findUnique({
    where: { canonicalId },
    include: {
      instances: {
        include: {
          claim: {
            select: { consensusStatus: true, challengeCount: true },
          },
        },
      },
    },
  });

  if (!canonical) return;

  // Aggregate status from all instances
  const statuses = canonical.instances.map((i) => i.claim.consensusStatus);
  const totalChallenges = canonical.instances.reduce(
    (sum, i) => sum + i.claim.challengeCount,
    0
  );

  // Determine global status
  let globalStatus = "UNDETERMINED";

  if (statuses.every((s) => s === "ACCEPTED")) {
    globalStatus = "ACCEPTED";
  } else if (statuses.every((s) => s === "REJECTED")) {
    globalStatus = "REJECTED";
  } else if (statuses.some((s) => s === "CONTESTED")) {
    globalStatus = "CONTESTED";
  } else if (statuses.some((s) => s === "ACCEPTED")) {
    globalStatus = "EMERGING";
  }

  await prisma.canonicalClaim.update({
    where: { canonicalId },
    data: {
      globalStatus: globalStatus as any,
      totalChallenges,
      lastActivityAt: new Date(),
    },
  });
}
```

---

### Step 3.1.6: API Routes

**File:** `app/api/claims/[claimId]/provenance/route.ts`

```typescript
/**
 * GET /api/claims/:claimId/provenance
 * Get full provenance for a claim
 */

import { NextRequest, NextResponse } from "next/server";
import { getClaimProvenance } from "@/lib/provenance/provenanceService";

export async function GET(
  req: NextRequest,
  { params }: { params: { claimId: string } }
) {
  try {
    const provenance = await getClaimProvenance(params.claimId);

    if (!provenance) {
      return NextResponse.json(
        { error: "Claim not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(provenance);
  } catch (error) {
    console.error("Get provenance error:", error);
    return NextResponse.json(
      { error: "Failed to get provenance" },
      { status: 500 }
    );
  }
}
```

---

**File:** `app/api/claims/[claimId]/challenges/route.ts`

```typescript
/**
 * GET /api/claims/:claimId/challenges
 * Get comprehensive challenge report for a claim
 */

import { NextRequest, NextResponse } from "next/server";
import { getChallengeReport } from "@/lib/provenance/challengeService";

export async function GET(
  req: NextRequest,
  { params }: { params: { claimId: string } }
) {
  try {
    const report = await getChallengeReport(params.claimId);

    if (!report) {
      return NextResponse.json(
        { error: "Claim not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Get challenges error:", error);
    return NextResponse.json(
      { error: "Failed to get challenges" },
      { status: 500 }
    );
  }
}
```

---

**File:** `app/api/claims/[claimId]/timeline/route.ts`

```typescript
/**
 * GET /api/claims/:claimId/timeline
 * Get claim lifecycle timeline
 */

import { NextRequest, NextResponse } from "next/server";
import { getClaimTimeline } from "@/lib/provenance/provenanceService";

export async function GET(
  req: NextRequest,
  { params }: { params: { claimId: string } }
) {
  try {
    const timeline = await getClaimTimeline(params.claimId);
    return NextResponse.json(timeline);
  } catch (error) {
    console.error("Get timeline error:", error);
    return NextResponse.json(
      { error: "Failed to get timeline" },
      { status: 500 }
    );
  }
}
```

---

**File:** `app/api/claims/[claimId]/versions/route.ts`

```typescript
/**
 * POST /api/claims/:claimId/versions
 * Create a new version of a claim
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClaimVersion } from "@/lib/provenance/provenanceService";

const CreateVersionSchema = z.object({
  text: z.string().min(1).max(5000),
  type: z.string().optional(),
  changeType: z.enum([
    "REFINED",
    "STRENGTHENED",
    "WEAKENED",
    "CORRECTED",
    "MERGED",
    "SPLIT",
  ]),
  changeReason: z.string().max(1000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { claimId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = CreateVersionSchema.parse(body);

    const version = await createClaimVersion(
      {
        claimId: params.claimId,
        ...validatedData,
      },
      session.user.id
    );

    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create version error:", error);
    return NextResponse.json(
      { error: "Failed to create version" },
      { status: 500 }
    );
  }
}
```

---

**File:** `app/api/attacks/route.ts`

```typescript
/**
 * POST /api/attacks
 * Record an attack on a claim
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAttack } from "@/lib/provenance/challengeService";

const CreateAttackSchema = z.object({
  targetClaimId: z.string(),
  attackingArgumentId: z.string(),
  attackType: z.enum(["REBUTTAL", "UNDERCUT", "UNDERMINE"]),
  attackSubtype: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { targetClaimId, attackingArgumentId, attackType, attackSubtype } =
      CreateAttackSchema.parse(body);

    const attack = await createAttack(
      targetClaimId,
      attackingArgumentId,
      attackType,
      session.user.id,
      attackSubtype
    );

    return NextResponse.json(attack, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create attack error:", error);
    return NextResponse.json(
      { error: "Failed to create attack" },
      { status: 500 }
    );
  }
}
```

---

**File:** `app/api/attacks/[attackId]/status/route.ts`

```typescript
/**
 * PATCH /api/attacks/:attackId/status
 * Update attack status
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateAttackStatus } from "@/lib/provenance/challengeService";

const UpdateStatusSchema = z.object({
  status: z.enum([
    "OPEN",
    "UNDER_REVIEW",
    "DEFENDED",
    "PARTIALLY_DEFENDED",
    "CONCEDED",
    "WITHDRAWN",
    "STALEMATE",
  ]),
  resolutionNote: z.string().max(2000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { attackId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status, resolutionNote } = UpdateStatusSchema.parse(body);

    const attack = await updateAttackStatus(
      params.attackId,
      status,
      session.user.id,
      resolutionNote
    );

    return NextResponse.json(attack);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update attack status error:", error);
    return NextResponse.json(
      { error: "Failed to update attack status" },
      { status: 500 }
    );
  }
}
```

---

**File:** `app/api/canonical-claims/search/route.ts`

```typescript
/**
 * GET /api/canonical-claims/search
 * Search for similar canonical claims
 */

import { NextRequest, NextResponse } from "next/server";
import { findSimilarCanonicalClaims } from "@/lib/provenance/canonicalService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get("text");
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    if (!text) {
      return NextResponse.json(
        { error: "Text parameter required" },
        { status: 400 }
      );
    }

    const matches = await findSimilarCanonicalClaims(text, limit);
    return NextResponse.json(matches);
  } catch (error) {
    console.error("Search canonical claims error:", error);
    return NextResponse.json(
      { error: "Failed to search canonical claims" },
      { status: 500 }
    );
  }
}
```

---

## Phase 3.1 Part 2 Complete

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 7 | Challenge service | `lib/provenance/challengeService.ts` | 📋 Part 2 |
| 8 | Canonical claim service | `lib/provenance/canonicalService.ts` | 📋 Part 2 |
| 9 | Provenance API | `app/api/claims/[claimId]/provenance/route.ts` | 📋 Part 2 |
| 10 | Challenges API | `app/api/claims/[claimId]/challenges/route.ts` | 📋 Part 2 |
| 11 | Timeline API | `app/api/claims/[claimId]/timeline/route.ts` | 📋 Part 2 |
| 12 | Versions API | `app/api/claims/[claimId]/versions/route.ts` | 📋 Part 2 |
| 13 | Attacks API | `app/api/attacks/route.ts` | 📋 Part 2 |
| 14 | Canonical search API | `app/api/canonical-claims/search/route.ts` | 📋 Part 2 |

---

## Next: Part 3

Continue to Phase 3.1 Part 3 for:
- UI components (ProvenanceTimeline, ChallengeReport, ConsensusIndicator, VersionHistory)

---

*End of Phase 3.1 Part 2*
