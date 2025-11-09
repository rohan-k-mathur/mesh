# Deliberation System Overhaul - Implementation Plan Part 2
## Core Architecture: Multi-Scheme Arguments & Dependencies

**Date**: November 8, 2025  
**Status**: Implementation Roadmap - Part 2  
**Prerequisite**: Part 1 (Phase 0) completed  
**Scope**: Phases 1-2 - Fundamental architectural transformation

---

## Part 2 Overview

This document covers the **most critical architectural changes** identified in the strategy document:

- **Phase 1**: Multi-Scheme Arguments (ArgumentNet model)
- **Phase 2**: Dependencies & Explicitness Tracking

These phases transform Mesh from **single-scheme argument tracking** to **multi-scheme argument nets**, enabling representation of real argumentation as described in Section 7 of the research.

### Why These Phases Are Critical

From strategy document Part 4:
> "Current Mesh `Argument` model with single `schemeId` is architecturally insufficient. Real arguments instantiate multiple schemes in interdependent nets."

Without this transformation, we cannot accurately model real-world arguments like the Hague speech example (classification → commitment → consequences).

### Phase Dependencies

```
Phase 0 (Foundation) 
    ↓
Phase 1 (ArgumentNet Model) ← YOU ARE HERE
    ↓
Phase 2 (Dependencies & Explicitness)
    ↓
Phase 3 (Navigation)
    ↓
Phase 4 (Generation)
```

**Estimated Total Time**: 4-5 weeks (160-200 hours)

---

## Phase 1: Multi-Scheme Arguments (Weeks 2-3)
**Goal**: Support arguments that instantiate multiple schemes simultaneously

### Phase 1 Overview

| Component | Effort | Impact | Risk |
|-----------|--------|--------|------|
| 1.1: ArgumentNet Data Model | Large | Critical | High |
| 1.2: Migration from Single Scheme | Large | Critical | High |
| 1.3: API Layer Updates | Medium | Critical | Medium |
| 1.4: UI Components - Read Only | Medium | High | Low |
| 1.5: UI Components - Editing | Large | High | Medium |
| 1.6: Backward Compatibility | Medium | Critical | High |

**Total Estimated Time**: 2 weeks (80 hours)

---

## Phase 1.1: ArgumentNet Data Model
**Effort**: 20-24 hours | **Priority**: 🔴 Critical | **Risk**: High

### Context

Current model:
```typescript
model Argument {
  id String @id
  claimId String
  schemeId String? // ❌ Single scheme
}
```

Required: Model nets of schemes with explicit structure.

### Decision: Two Approaches Evaluated

#### Approach A: Multi-Scheme on Argument (Simpler)
```typescript
model Argument {
  schemes ArgumentSchemeInstance[]
}

model ArgumentSchemeInstance {
  argumentId String
  schemeId String
  role String
  explicitness String
}
```

**Pros**: Minimal disruption, keeps Argument as main entity  
**Cons**: Harder to model complex dependencies between schemes

#### Approach B: Argument as Net (Research-Aligned) ⭐ RECOMMENDED
```typescript
model ArgumentNet {
  nodes ArgumentNode[]
  edges ArgumentEdge[]
}

model ArgumentNode {
  type String // "premise" | "conclusion" | "intermediate"
  content String
}

model ArgumentEdge {
  schemeId String // Scheme connecting nodes
  sourceNodeId String
  targetNodeId String
}
```

**Pros**: Exact match to research model, supports complex nets  
**Cons**: Larger architectural change

### Chosen Approach: Hybrid

Use **Approach A for Phase 1** (faster delivery), with schema designed to enable **Approach B migration in Phase 4**.

This gives immediate multi-scheme support while preserving path to full net model.

### Implementation

#### Step 1: Schema Design (4 hours)

**File**: `prisma/schema.prisma`

```prisma
// Existing Argument model (keep for backward compatibility)
model Argument {
  id              String   @id @default(cuid())
  claimId         String
  deliberationId  String
  authorId        String
  content         String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Legacy single-scheme support (nullable for migration)
  schemeId        String?  
  scheme          ArgumentScheme? @relation("ArgumentToScheme", fields: [schemeId], references: [id])
  
  // NEW: Multi-scheme support
  schemeInstances ArgumentSchemeInstance[]
  dependencies    ArgumentDependency[] @relation("SourceDependencies")
  dependedOnBy    ArgumentDependency[] @relation("TargetDependencies")
  
  // Existing relations
  claim           Claim @relation(fields: [claimId], references: [id], onDelete: Cascade)
  author          User @relation(fields: [authorId], references: [id])
  premises        ArgumentPremise[]
  // ... other existing relations
  
  @@index([claimId])
  @@index([schemeId])
  @@index([deliberationId])
}

// NEW: Represents one scheme used within an argument
model ArgumentSchemeInstance {
  id              String   @id @default(cuid())
  argumentId      String
  schemeId        String
  
  // Role in argument structure
  role            String   // "primary" | "supporting" | "presupposed" | "implicit"
  
  // Explicitness level (from research Part 4)
  explicitness    String   @default("explicit") // "explicit" | "presupposed" | "implied"
  
  // Optional: Text evidence if explicit
  textEvidence    String?
  
  // Optional: Justification if reconstructed
  justification   String?
  
  // Display order in UI
  order           Int
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  argument        Argument @relation(fields: [argumentId], references: [id], onDelete: Cascade)
  scheme          ArgumentScheme @relation(fields: [schemeId], references: [id])
  
  @@unique([argumentId, schemeId, order]) // Prevent duplicate scheme instances
  @@index([argumentId])
  @@index([schemeId])
}

// NEW: Represents dependencies between arguments or between schemes within an argument
model ArgumentDependency {
  id              String   @id @default(cuid())
  
  // Source and target arguments
  sourceArgId     String
  targetArgId     String
  
  // Optional: Specific scheme instances involved
  sourceSchemeInstanceId String?
  targetSchemeInstanceId String?
  
  // Type of dependency (from research Part 4)
  dependencyType  String   // "premise_conclusion" | "presuppositional" | "support" | "justificational" | "sequential"
  
  // Whether dependency is explicit in text or reconstructed
  isExplicit      Boolean  @default(false)
  
  // Optional: Explanation of dependency
  justification   String?
  
  // Display order for sequential dependencies
  order           Int?
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  sourceArg       Argument @relation("SourceDependencies", fields: [sourceArgId], references: [id], onDelete: Cascade)
  targetArg       Argument @relation("TargetDependencies", fields: [targetArgId], references: [id], onDelete: Cascade)
  
  @@unique([sourceArgId, targetArgId, dependencyType]) // Prevent duplicate dependencies
  @@index([sourceArgId])
  @@index([targetArgId])
  @@index([dependencyType])
}

// NEW: Common patterns of scheme nets (knowledge base)
model SchemeNetPattern {
  id              String   @id @default(cuid())
  
  // Pattern identification
  name            String   @unique
  description     String
  domain          String   // "policy" | "legal" | "scientific" | "general"
  
  // Pattern structure (JSON)
  schemeIds       String[] // Array of scheme IDs typically used together
  typicalStructure Json    // Structure: { nodes: [...], edges: [...] }
  
  // Examples and usage
  exampleTexts    String[] // Real-world examples
  usageCount      Int      @default(0) // Track popularity
  
  // Tags for discovery
  tags            String[]
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([domain])
}
```

#### Step 2: Migration Strategy (6 hours)

**Challenge**: Existing arguments have single `schemeId`. Must migrate without breaking.

**Strategy**: Three-phase migration
1. Add new tables (non-breaking)
2. Backfill data (create SchemeInstances from existing schemes)
3. Update application code (use new models)
4. Deprecate old field (Phase 4, optional)

**File**: `prisma/migrations/XXX_add_multi_scheme_support/migration.sql`

```sql
-- Phase 1: Create new tables
CREATE TABLE "ArgumentSchemeInstance" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "argumentId" TEXT NOT NULL,
  "schemeId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "explicitness" TEXT NOT NULL DEFAULT 'explicit',
  "textEvidence" TEXT,
  "justification" TEXT,
  "order" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "ArgumentSchemeInstance_argumentId_fkey" 
    FOREIGN KEY ("argumentId") REFERENCES "Argument"("id") ON DELETE CASCADE,
  CONSTRAINT "ArgumentSchemeInstance_schemeId_fkey"
    FOREIGN KEY ("schemeId") REFERENCES "ArgumentScheme"("id")
);

CREATE UNIQUE INDEX "ArgumentSchemeInstance_argumentId_schemeId_order_key" 
  ON "ArgumentSchemeInstance"("argumentId", "schemeId", "order");
CREATE INDEX "ArgumentSchemeInstance_argumentId_idx" ON "ArgumentSchemeInstance"("argumentId");
CREATE INDEX "ArgumentSchemeInstance_schemeId_idx" ON "ArgumentSchemeInstance"("schemeId");

CREATE TABLE "ArgumentDependency" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sourceArgId" TEXT NOT NULL,
  "targetArgId" TEXT NOT NULL,
  "sourceSchemeInstanceId" TEXT,
  "targetSchemeInstanceId" TEXT,
  "dependencyType" TEXT NOT NULL,
  "isExplicit" BOOLEAN NOT NULL DEFAULT false,
  "justification" TEXT,
  "order" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "ArgumentDependency_sourceArgId_fkey"
    FOREIGN KEY ("sourceArgId") REFERENCES "Argument"("id") ON DELETE CASCADE,
  CONSTRAINT "ArgumentDependency_targetArgId_fkey"
    FOREIGN KEY ("targetArgId") REFERENCES "Argument"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "ArgumentDependency_sourceArgId_targetArgId_dependencyType_key"
  ON "ArgumentDependency"("sourceArgId", "targetArgId", "dependencyType");
CREATE INDEX "ArgumentDependency_sourceArgId_idx" ON "ArgumentDependency"("sourceArgId");
CREATE INDEX "ArgumentDependency_targetArgId_idx" ON "ArgumentDependency"("targetArgId");
CREATE INDEX "ArgumentDependency_dependencyType_idx" ON "ArgumentDependency"("dependencyType");

CREATE TABLE "SchemeNetPattern" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "schemeIds" TEXT[],
  "typicalStructure" JSONB NOT NULL,
  "exampleTexts" TEXT[],
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "tags" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "SchemeNetPattern_domain_idx" ON "SchemeNetPattern"("domain");

-- Phase 2: Backfill data - create ArgumentSchemeInstance for each existing Argument.schemeId
INSERT INTO "ArgumentSchemeInstance" (
  "id",
  "argumentId",
  "schemeId", 
  "role",
  "explicitness",
  "order",
  "createdAt",
  "updatedAt"
)
SELECT 
  'inst_' || "id" as "id",
  "id" as "argumentId",
  "schemeId",
  'primary' as "role",
  'explicit' as "explicitness",
  0 as "order",
  "createdAt",
  "updatedAt"
FROM "Argument"
WHERE "schemeId" IS NOT NULL;

-- Phase 3: Make Argument.schemeId nullable (already done in schema above)
-- Note: We keep the field for backward compatibility but it's now optional
```

**File**: `scripts/verify-multi-scheme-migration.ts`

```typescript
/**
 * Verify migration integrity
 */
async function verifyMigration() {
  console.log("Verifying multi-scheme migration...\n");
  
  // Check 1: Every Argument with schemeId has a SchemeInstance
  const argsWithScheme = await prisma.argument.count({
    where: { schemeId: { not: null } }
  });
  
  const schemeInstances = await prisma.argumentSchemeInstance.count({
    where: { role: "primary" }
  });
  
  console.log(`Arguments with schemeId: ${argsWithScheme}`);
  console.log(`Primary scheme instances: ${schemeInstances}`);
  
  if (argsWithScheme !== schemeInstances) {
    console.error("❌ Mismatch! Some arguments missing scheme instances.");
    process.exit(1);
  }
  
  // Check 2: All SchemeInstances reference valid Arguments
  const orphanedInstances = await prisma.argumentSchemeInstance.count({
    where: { argument: null }
  });
  
  if (orphanedInstances > 0) {
    console.error(`❌ Found ${orphanedInstances} orphaned scheme instances!`);
    process.exit(1);
  }
  
  // Check 3: No duplicate primary schemes per argument
  const duplicates = await prisma.$queryRaw`
    SELECT "argumentId", COUNT(*) as count
    FROM "ArgumentSchemeInstance"
    WHERE "role" = 'primary'
    GROUP BY "argumentId"
    HAVING COUNT(*) > 1
  `;
  
  if (duplicates.length > 0) {
    console.error(`❌ Found ${duplicates.length} arguments with multiple primary schemes!`);
    console.error(duplicates);
    process.exit(1);
  }
  
  console.log("\n✅ Migration verification passed!");
}

verifyMigration();
```

Run: `tsx scripts/verify-multi-scheme-migration.ts`

#### Step 3: TypeScript Types (2 hours)

**File**: `lib/types/argument-net.ts`

```typescript
export type SchemeRole = "primary" | "supporting" | "presupposed" | "implicit";
export type ExplicitnessLevel = "explicit" | "presupposed" | "implied";
export type DependencyType = 
  | "premise_conclusion"  // One scheme's conclusion → another's premise
  | "presuppositional"    // One scheme presupposes another holds
  | "support"             // One scheme provides evidence for another
  | "justificational"     // One scheme justifies applicability of another
  | "sequential";         // Schemes applied in cognitive order

export interface ArgumentSchemeInstance {
  id: string;
  argumentId: string;
  schemeId: string;
  role: SchemeRole;
  explicitness: ExplicitnessLevel;
  textEvidence?: string;
  justification?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Populated relations
  scheme?: ArgumentScheme;
}

export interface ArgumentDependency {
  id: string;
  sourceArgId: string;
  targetArgId: string;
  sourceSchemeInstanceId?: string;
  targetSchemeInstanceId?: string;
  dependencyType: DependencyType;
  isExplicit: boolean;
  justification?: string;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArgumentWithSchemes {
  id: string;
  claimId: string;
  content: string;
  // Legacy
  schemeId?: string;
  scheme?: ArgumentScheme;
  
  // New multi-scheme support
  schemeInstances: ArgumentSchemeInstance[];
  dependencies: ArgumentDependency[];
  
  // Computed helpers
  primaryScheme?: ArgumentSchemeInstance;
  supportingSchemes: ArgumentSchemeInstance[];
  implicitSchemes: ArgumentSchemeInstance[];
}

export interface SchemeNetPattern {
  id: string;
  name: string;
  description: string;
  domain: "policy" | "legal" | "scientific" | "general";
  schemeIds: string[];
  typicalStructure: {
    nodes: Array<{ id: string; role: SchemeRole }>;
    edges: Array<{ from: string; to: string; type: DependencyType }>;
  };
  exampleTexts: string[];
  usageCount: number;
  tags: string[];
}
```

#### Step 4: Helper Functions (3 hours)

**File**: `lib/utils/argument-net-helpers.ts`

```typescript
import { ArgumentWithSchemes, SchemeRole, ExplicitnessLevel } from "@/lib/types/argument-net";

/**
 * Get primary scheme (main inferential pattern)
 */
export function getPrimaryScheme(arg: ArgumentWithSchemes) {
  return arg.schemeInstances.find(si => si.role === "primary");
}

/**
 * Get supporting schemes (enabling premises)
 */
export function getSupportingSchemes(arg: ArgumentWithSchemes) {
  return arg.schemeInstances.filter(si => si.role === "supporting");
}

/**
 * Get implicit schemes (presupposed or implied)
 */
export function getImplicitSchemes(arg: ArgumentWithSchemes) {
  return arg.schemeInstances.filter(si => 
    si.role === "presupposed" || si.role === "implicit"
  );
}

/**
 * Check if argument uses multiple schemes
 */
export function isMultiSchemeArgument(arg: ArgumentWithSchemes): boolean {
  return arg.schemeInstances.length > 1;
}

/**
 * Get scheme instance by role and order
 */
export function getSchemeByRole(
  arg: ArgumentWithSchemes, 
  role: SchemeRole, 
  order = 0
) {
  return arg.schemeInstances.find(si => si.role === role && si.order === order);
}

/**
 * Get explicitness level styling
 */
export function getExplicitnessStyle(level: ExplicitnessLevel) {
  const styles = {
    explicit: {
      border: "border-solid border-2",
      label: "Explicit",
      description: "Stated in text",
      color: "border-blue-500"
    },
    presupposed: {
      border: "border-dashed border-2",
      label: "Presupposed",
      description: "Taken for granted, necessary for reconstruction",
      color: "border-amber-500"
    },
    implied: {
      border: "border-dotted border-2",
      label: "Implied",
      description: "Recoverable from context",
      color: "border-gray-400"
    }
  };
  
  return styles[level];
}

/**
 * Validate argument net structure
 */
export function validateArgumentNet(arg: ArgumentWithSchemes): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Must have at least one scheme
  if (arg.schemeInstances.length === 0) {
    errors.push("Argument must have at least one scheme instance");
  }
  
  // Must have exactly one primary scheme
  const primaryCount = arg.schemeInstances.filter(si => si.role === "primary").length;
  if (primaryCount === 0) {
    errors.push("Argument must have one primary scheme");
  } else if (primaryCount > 1) {
    errors.push("Argument cannot have multiple primary schemes");
  }
  
  // Order must be unique per role
  const ordersByRole = arg.schemeInstances.reduce((acc, si) => {
    if (!acc[si.role]) acc[si.role] = [];
    acc[si.role].push(si.order);
    return acc;
  }, {} as Record<SchemeRole, number[]>);
  
  Object.entries(ordersByRole).forEach(([role, orders]) => {
    const unique = new Set(orders);
    if (unique.size !== orders.length) {
      errors.push(`Duplicate order values for role: ${role}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Format dependency type for display
 */
export function formatDependencyType(type: DependencyType): {
  label: string;
  description: string;
  icon: string;
} {
  const formats = {
    premise_conclusion: {
      label: "Premise → Conclusion",
      description: "One scheme's conclusion becomes another's premise",
      icon: "ArrowRight"
    },
    presuppositional: {
      label: "Presupposes",
      description: "One scheme presupposes another holds",
      icon: "Layers"
    },
    support: {
      label: "Supports",
      description: "Provides evidential support",
      icon: "ThumbsUp"
    },
    justificational: {
      label: "Justifies",
      description: "Justifies applicability",
      icon: "CheckCircle"
    },
    sequential: {
      label: "Sequential",
      description: "Applied in cognitive order",
      icon: "List"
    }
  };
  
  return formats[type];
}
```

#### Step 5: Database Access Layer (4 hours)

**File**: `lib/db/argument-net-queries.ts`

```typescript
import { prisma } from "@/lib/prisma";
import type { ArgumentWithSchemes } from "@/lib/types/argument-net";

/**
 * Get argument with all scheme instances and dependencies
 */
export async function getArgumentWithSchemes(argumentId: string): Promise<ArgumentWithSchemes | null> {
  const arg = await prisma.argument.findUnique({
    where: { id: argumentId },
    include: {
      // Legacy single scheme
      scheme: true,
      
      // Multi-scheme support
      schemeInstances: {
        include: {
          scheme: {
            include: {
              criticalQuestions: {
                orderBy: { order: "asc" }
              }
            }
          }
        },
        orderBy: [
          { role: "asc" },
          { order: "asc" }
        ]
      },
      
      // Dependencies
      dependencies: {
        include: {
          targetArg: {
            select: {
              id: true,
              content: true
            }
          }
        }
      },
      dependedOnBy: {
        include: {
          sourceArg: {
            select: {
              id: true,
              content: true
            }
          }
        }
      },
      
      // Other relations
      claim: true,
      author: {
        select: {
          id: true,
          username: true,
          displayName: true
        }
      },
      premises: true
    }
  });
  
  if (!arg) return null;
  
  return arg as ArgumentWithSchemes;
}

/**
 * Get all arguments for a claim with scheme instances
 */
export async function getClaimArgumentsWithSchemes(claimId: string): Promise<ArgumentWithSchemes[]> {
  const args = await prisma.argument.findMany({
    where: { claimId },
    include: {
      scheme: true,
      schemeInstances: {
        include: {
          scheme: true
        },
        orderBy: [
          { role: "asc" },
          { order: "asc" }
        ]
      },
      dependencies: true,
      author: {
        select: {
          id: true,
          username: true,
          displayName: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  
  return args as ArgumentWithSchemes[];
}

/**
 * Add scheme instance to argument
 */
export async function addSchemeToArgument(
  argumentId: string,
  schemeId: string,
  role: SchemeRole,
  explicitness: ExplicitnessLevel = "explicit",
  options?: {
    textEvidence?: string;
    justification?: string;
    order?: number;
  }
) {
  // Get current max order for this role
  const maxOrder = await prisma.argumentSchemeInstance.aggregate({
    where: {
      argumentId,
      role
    },
    _max: {
      order: true
    }
  });
  
  const order = options?.order ?? (maxOrder._max.order ?? -1) + 1;
  
  return prisma.argumentSchemeInstance.create({
    data: {
      argumentId,
      schemeId,
      role,
      explicitness,
      textEvidence: options?.textEvidence,
      justification: options?.justification,
      order
    },
    include: {
      scheme: true
    }
  });
}

/**
 * Remove scheme instance from argument
 */
export async function removeSchemeFromArgument(instanceId: string) {
  return prisma.argumentSchemeInstance.delete({
    where: { id: instanceId }
  });
}

/**
 * Update scheme instance
 */
export async function updateSchemeInstance(
  instanceId: string,
  data: {
    role?: SchemeRole;
    explicitness?: ExplicitnessLevel;
    textEvidence?: string;
    justification?: string;
    order?: number;
  }
) {
  return prisma.argumentSchemeInstance.update({
    where: { id: instanceId },
    data,
    include: {
      scheme: true
    }
  });
}

/**
 * Add dependency between arguments
 */
export async function addArgumentDependency(
  sourceArgId: string,
  targetArgId: string,
  dependencyType: DependencyType,
  options?: {
    sourceSchemeInstanceId?: string;
    targetSchemeInstanceId?: string;
    isExplicit?: boolean;
    justification?: string;
    order?: number;
  }
) {
  return prisma.argumentDependency.create({
    data: {
      sourceArgId,
      targetArgId,
      dependencyType,
      sourceSchemeInstanceId: options?.sourceSchemeInstanceId,
      targetSchemeInstanceId: options?.targetSchemeInstanceId,
      isExplicit: options?.isExplicit ?? false,
      justification: options?.justification,
      order: options?.order
    }
  });
}

/**
 * Get arguments that depend on this argument
 */
export async function getArgumentDependents(argumentId: string) {
  return prisma.argumentDependency.findMany({
    where: { targetArgId: argumentId },
    include: {
      sourceArg: {
        include: {
          schemeInstances: {
            include: { scheme: true }
          }
        }
      }
    }
  });
}

/**
 * Get arguments this argument depends on
 */
export async function getArgumentDependencies(argumentId: string) {
  return prisma.argumentDependency.findMany({
    where: { sourceArgId: argumentId },
    include: {
      targetArg: {
        include: {
          schemeInstances: {
            include: { scheme: true }
          }
        }
      }
    }
  });
}
```

#### Step 6: Testing Infrastructure (3 hours)

**File**: `__tests__/lib/db/argument-net-queries.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { 
  getArgumentWithSchemes,
  addSchemeToArgument,
  addArgumentDependency 
} from "@/lib/db/argument-net-queries";
import { prisma } from "@/lib/prisma";

describe("Argument Net Queries", () => {
  let testUserId: string;
  let testDeliberationId: string;
  let testClaimId: string;
  let testSchemeId1: string;
  let testSchemeId2: string;
  let testArgumentId: string;
  
  beforeEach(async () => {
    // Create test data
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        username: "testuser"
      }
    });
    testUserId = user.id;
    
    const delib = await prisma.deliberation.create({
      data: {
        title: "Test Deliberation",
        creatorId: testUserId
      }
    });
    testDeliberationId = delib.id;
    
    const claim = await prisma.claim.create({
      data: {
        content: "Test claim",
        deliberationId: testDeliberationId,
        authorId: testUserId
      }
    });
    testClaimId = claim.id;
    
    const scheme1 = await prisma.argumentScheme.create({
      data: {
        name: "Test Scheme 1",
        description: "First test scheme"
      }
    });
    testSchemeId1 = scheme1.id;
    
    const scheme2 = await prisma.argumentScheme.create({
      data: {
        name: "Test Scheme 2",
        description: "Second test scheme"
      }
    });
    testSchemeId2 = scheme2.id;
    
    const arg = await prisma.argument.create({
      data: {
        claimId: testClaimId,
        deliberationId: testDeliberationId,
        authorId: testUserId,
        content: "Test argument"
      }
    });
    testArgumentId = arg.id;
  });
  
  afterEach(async () => {
    // Cleanup
    await prisma.argument.deleteMany();
    await prisma.argumentScheme.deleteMany();
    await prisma.claim.deleteMany();
    await prisma.deliberation.deleteMany();
    await prisma.user.deleteMany();
  });
  
  describe("addSchemeToArgument", () => {
    it("adds primary scheme to argument", async () => {
      const instance = await addSchemeToArgument(
        testArgumentId,
        testSchemeId1,
        "primary"
      );
      
      expect(instance.argumentId).toBe(testArgumentId);
      expect(instance.schemeId).toBe(testSchemeId1);
      expect(instance.role).toBe("primary");
      expect(instance.order).toBe(0);
    });
    
    it("adds supporting scheme with correct order", async () => {
      // Add primary first
      await addSchemeToArgument(testArgumentId, testSchemeId1, "primary");
      
      // Add supporting
      const supporting = await addSchemeToArgument(
        testArgumentId,
        testSchemeId2,
        "supporting"
      );
      
      expect(supporting.role).toBe("supporting");
      expect(supporting.order).toBe(0); // First supporting scheme
    });
    
    it("increments order for multiple schemes of same role", async () => {
      await addSchemeToArgument(testArgumentId, testSchemeId1, "supporting");
      const second = await addSchemeToArgument(testArgumentId, testSchemeId2, "supporting");
      
      expect(second.order).toBe(1);
    });
  });
  
  describe("getArgumentWithSchemes", () => {
    it("returns argument with scheme instances", async () => {
      await addSchemeToArgument(testArgumentId, testSchemeId1, "primary");
      await addSchemeToArgument(testArgumentId, testSchemeId2, "supporting");
      
      const arg = await getArgumentWithSchemes(testArgumentId);
      
      expect(arg).not.toBeNull();
      expect(arg!.schemeInstances).toHaveLength(2);
      expect(arg!.schemeInstances[0].role).toBe("primary");
      expect(arg!.schemeInstances[1].role).toBe("supporting");
    });
    
    it("includes scheme details", async () => {
      await addSchemeToArgument(testArgumentId, testSchemeId1, "primary");
      
      const arg = await getArgumentWithSchemes(testArgumentId);
      
      expect(arg!.schemeInstances[0].scheme).toBeDefined();
      expect(arg!.schemeInstances[0].scheme!.name).toBe("Test Scheme 1");
    });
  });
  
  describe("addArgumentDependency", () => {
    let targetArgumentId: string;
    
    beforeEach(async () => {
      const targetArg = await prisma.argument.create({
        data: {
          claimId: testClaimId,
          deliberationId: testDeliberationId,
          authorId: testUserId,
          content: "Target argument"
        }
      });
      targetArgumentId = targetArg.id;
    });
    
    it("creates dependency between arguments", async () => {
      const dep = await addArgumentDependency(
        testArgumentId,
        targetArgumentId,
        "premise_conclusion"
      );
      
      expect(dep.sourceArgId).toBe(testArgumentId);
      expect(dep.targetArgId).toBe(targetArgumentId);
      expect(dep.dependencyType).toBe("premise_conclusion");
    });
    
    it("stores justification for implicit dependencies", async () => {
      const dep = await addArgumentDependency(
        testArgumentId,
        targetArgumentId,
        "presuppositional",
        {
          isExplicit: false,
          justification: "This presupposes that target holds"
        }
      );
      
      expect(dep.isExplicit).toBe(false);
      expect(dep.justification).toBe("This presupposes that target holds");
    });
  });
});
```

**File**: `__tests__/lib/utils/argument-net-helpers.test.ts`

```typescript
import { describe, it, expect } from "@jest/globals";
import {
  getPrimaryScheme,
  getSupportingSchemes,
  isMultiSchemeArgument,
  validateArgumentNet,
  getExplicitnessStyle
} from "@/lib/utils/argument-net-helpers";
import type { ArgumentWithSchemes } from "@/lib/types/argument-net";

describe("Argument Net Helpers", () => {
  const mockArgument: ArgumentWithSchemes = {
    id: "arg1",
    claimId: "claim1",
    content: "Test argument",
    schemeInstances: [
      {
        id: "inst1",
        argumentId: "arg1",
        schemeId: "scheme1",
        role: "primary",
        explicitness: "explicit",
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "inst2",
        argumentId: "arg1",
        schemeId: "scheme2",
        role: "supporting",
        explicitness: "presupposed",
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    dependencies: []
  };
  
  describe("getPrimaryScheme", () => {
    it("returns the primary scheme instance", () => {
      const primary = getPrimaryScheme(mockArgument);
      expect(primary).toBeDefined();
      expect(primary?.role).toBe("primary");
      expect(primary?.id).toBe("inst1");
    });
  });
  
  describe("getSupportingSchemes", () => {
    it("returns all supporting scheme instances", () => {
      const supporting = getSupportingSchemes(mockArgument);
      expect(supporting).toHaveLength(1);
      expect(supporting[0].role).toBe("supporting");
    });
  });
  
  describe("isMultiSchemeArgument", () => {
    it("returns true for arguments with multiple schemes", () => {
      expect(isMultiSchemeArgument(mockArgument)).toBe(true);
    });
    
    it("returns false for single-scheme arguments", () => {
      const singleScheme: ArgumentWithSchemes = {
        ...mockArgument,
        schemeInstances: [mockArgument.schemeInstances[0]]
      };
      expect(isMultiSchemeArgument(singleScheme)).toBe(false);
    });
  });
  
  describe("validateArgumentNet", () => {
    it("validates correct argument structure", () => {
      const result = validateArgumentNet(mockArgument);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it("fails validation without primary scheme", () => {
      const invalid: ArgumentWithSchemes = {
        ...mockArgument,
        schemeInstances: [mockArgument.schemeInstances[1]] // Only supporting
      };
      
      const result = validateArgumentNet(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Argument must have one primary scheme");
    });
    
    it("fails validation with multiple primary schemes", () => {
      const invalid: ArgumentWithSchemes = {
        ...mockArgument,
        schemeInstances: [
          mockArgument.schemeInstances[0],
          { ...mockArgument.schemeInstances[0], id: "inst3" }
        ]
      };
      
      const result = validateArgumentNet(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Argument cannot have multiple primary schemes");
    });
  });
  
  describe("getExplicitnessStyle", () => {
    it("returns solid border for explicit", () => {
      const style = getExplicitnessStyle("explicit");
      expect(style.border).toContain("border-solid");
    });
    
    it("returns dashed border for presupposed", () => {
      const style = getExplicitnessStyle("presupposed");
      expect(style.border).toContain("border-dashed");
    });
    
    it("returns dotted border for implied", () => {
      const style = getExplicitnessStyle("implied");
      expect(style.border).toContain("border-dotted");
    });
  });
});
```

---

## Phase 1.2: Migration from Single Scheme (Week 2 continued)
**Effort**: 8 hours | **Priority**: 🔴 Critical

### Context

Existing codebase assumes `argument.schemeId` exists. Must update all references while maintaining backward compatibility.

### Implementation Strategy

1. **Dual Read**: Code reads from both old and new fields
2. **Write to Both**: Updates write to both places
3. **Gradual Migration**: Move components one at a time
4. **Feature Flag**: `ENABLE_MULTI_SCHEME` controls rollout

#### Step 1: Create Compatibility Layer (2 hours)

**File**: `lib/utils/argument-scheme-compat.ts`

```typescript
import type { ArgumentWithSchemes, ArgumentSchemeInstance } from "@/lib/types/argument-net";

/**
 * Compatibility layer for reading scheme from old or new structure
 */
export function getArgumentScheme(arg: ArgumentWithSchemes): ArgumentScheme | undefined {
  // Try new multi-scheme structure first
  const primary = arg.schemeInstances?.find(si => si.role === "primary");
  if (primary?.scheme) {
    return primary.scheme;
  }
  
  // Fallback to legacy single scheme
  return arg.scheme;
}

/**
 * Get scheme ID from either structure
 */
export function getArgumentSchemeId(arg: ArgumentWithSchemes): string | undefined {
  const primary = arg.schemeInstances?.find(si => si.role === "primary");
  return primary?.schemeId ?? arg.schemeId;
}

/**
 * Check if argument uses new multi-scheme structure
 */
export function usesMultiScheme(arg: ArgumentWithSchemes): boolean {
  return (arg.schemeInstances?.length ?? 0) > 0;
}

/**
 * Convert legacy single-scheme argument to multi-scheme structure (in-memory)
 */
export function normalizeArgumentSchemes(arg: ArgumentWithSchemes): ArgumentWithSchemes {
  // If already has scheme instances, return as-is
  if (arg.schemeInstances && arg.schemeInstances.length > 0) {
    return arg;
  }
  
  // If has legacy schemeId, create instance
  if (arg.schemeId && arg.scheme) {
    return {
      ...arg,
      schemeInstances: [{
        id: `temp_${arg.id}_${arg.schemeId}`,
        argumentId: arg.id,
        schemeId: arg.schemeId,
        role: "primary",
        explicitness: "explicit",
        order: 0,
        createdAt: arg.createdAt,
        updatedAt: arg.updatedAt,
        scheme: arg.scheme
      }]
    };
  }
  
  // No schemes
  return arg;
}
```

#### Step 2: Update API Endpoints (3 hours)

**File**: `app/api/arguments/[id]/route.ts`

```typescript
import { getArgumentWithSchemes } from "@/lib/db/argument-net-queries";
import { normalizeArgumentSchemes } from "@/lib/utils/argument-scheme-compat";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const arg = await getArgumentWithSchemes(params.id);
    
    if (!arg) {
      return NextResponse.json({ error: "Argument not found" }, { status: 404 });
    }
    
    // Normalize to always include schemeInstances
    const normalized = normalizeArgumentSchemes(arg);
    
    return NextResponse.json({ argument: normalized });
  } catch (error) {
    console.error("Error fetching argument:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**File**: `app/api/arguments/[id]/schemes/route.ts` (NEW)

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { addSchemeToArgument, removeSchemeFromArgument } from "@/lib/db/argument-net-queries";

/**
 * POST /api/arguments/[id]/schemes - Add scheme to argument
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const body = await req.json();
    const { schemeId, role, explicitness, textEvidence, justification } = body;
    
    // Validate
    if (!schemeId || !role) {
      return NextResponse.json(
        { error: "schemeId and role are required" },
        { status: 400 }
      );
    }
    
    const instance = await addSchemeToArgument(
      params.id,
      schemeId,
      role,
      explicitness || "explicit",
      {
        textEvidence,
        justification
      }
    );
    
    return NextResponse.json({ schemeInstance: instance });
  } catch (error) {
    console.error("Error adding scheme:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/arguments/[id]/schemes/[instanceId] - Remove scheme
 */
export async function DELETE(
  req: Request, 
  { params }: { params: { id: string; instanceId: string } }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    await removeSchemeFromArgument(params.instanceId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing scheme:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

#### Step 3: Update Existing Components (3 hours)

**File**: `components/arguments/ArgumentCard.tsx`

Update to use compatibility layer:

```typescript
import { getArgumentScheme } from "@/lib/utils/argument-scheme-compat";
import { isMultiSchemeArgument } from "@/lib/utils/argument-net-helpers";

export function ArgumentCard({ argument }: Props) {
  const scheme = getArgumentScheme(argument);
  const isMultiScheme = isMultiSchemeArgument(argument);
  
  return (
    <Card>
      <CardHeader>
        {scheme && (
          <div className="flex items-center gap-2">
            <Badge>{scheme.name}</Badge>
            {isMultiScheme && (
              <Badge variant="outline">
                +{argument.schemeInstances.length - 1} more
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Existing content */}
      </CardContent>
    </Card>
  );
}
```

---

## Phase 1 Summary & Checkpoints

### Checkpoint 1: After Database Migration (Day 3)

**Verify**:
- [ ] Migration runs successfully
- [ ] All existing arguments have SchemeInstances
- [ ] No data loss
- [ ] Rollback plan tested

**Stop if**: Any data integrity issues

### Checkpoint 2: After API Updates (Day 5)

**Verify**:
- [ ] New endpoints work
- [ ] Old endpoints still work  
- [ ] Compatibility layer functions correctly
- [ ] Tests pass

**Stop if**: Backward compatibility broken

### Checkpoint 3: After UI Updates (Day 7)

**Verify**:
- [ ] UI displays multi-scheme arguments
- [ ] Single-scheme arguments still work
- [ ] No regressions in existing features

**Rollout**: Enable for power users

### Phase 1 Complete (End Week 2)

**Deliverables**:
- ✅ ArgumentNet data model in database
- ✅ Backward-compatible API
- ✅ Updated components using compat layer
- ✅ Tests passing
- ✅ Documentation updated

**What Users See**:
- Arguments can now have multiple schemes
- Badge shows "+N more" for multi-scheme args
- Existing single-scheme args work unchanged

---

## Phase 1.3: UI Components - Read Only Display
**Effort**: 12-16 hours | **Priority**: 🔴 Critical | **Risk**: Low

### Context

With ArgumentNet model in place, we need UI components to **display** multi-scheme arguments. This phase focuses on read-only views before adding editing capabilities (Phase 1.4).

### Goals

1. Show all schemes used in an argument
2. Distinguish primary vs supporting vs implicit schemes
3. Visual styling for explicitness levels (solid/dashed/dotted)
4. Hover/tooltip details for each scheme
5. Composed CQ counts from all schemes

### Implementation

#### Step 1: Multi-Scheme Badge Component (2 hours)

**File**: `components/arguments/MultiSchemeBadge.tsx` (NEW)

```typescript
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Layers, FileText, Eye, EyeOff } from "lucide-react";
import type { ArgumentSchemeInstance } from "@/lib/types/argument-net";
import { getExplicitnessStyle } from "@/lib/utils/argument-net-helpers";
import { cn } from "@/lib/utils";

interface MultiSchemeBadgeProps {
  schemeInstance: ArgumentSchemeInstance;
  size?: "sm" | "md" | "lg";
  showExplicitness?: boolean;
}

export function MultiSchemeBadge({ 
  schemeInstance, 
  size = "md", 
  showExplicitness = true 
}: MultiSchemeBadgeProps) {
  const explicitnessStyle = getExplicitnessStyle(schemeInstance.explicitness);
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5"
  };
  
  const roleColors = {
    primary: "bg-blue-100 text-blue-800 border-blue-300",
    supporting: "bg-green-100 text-green-800 border-green-300",
    presupposed: "bg-amber-100 text-amber-800 border-amber-300",
    implicit: "bg-gray-100 text-gray-800 border-gray-300"
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              sizeClasses[size],
              roleColors[schemeInstance.role],
              showExplicitness && explicitnessStyle.border,
              showExplicitness && explicitnessStyle.color,
              "cursor-help transition-all hover:shadow-sm"
            )}
          >
            {/* Role icon */}
            {schemeInstance.role === "primary" && <Layers className="w-3 h-3 mr-1" />}
            {schemeInstance.role === "supporting" && <FileText className="w-3 h-3 mr-1" />}
            {schemeInstance.role === "presupposed" && <Eye className="w-3 h-3 mr-1" />}
            {schemeInstance.role === "implicit" && <EyeOff className="w-3 h-3 mr-1" />}
            
            {/* Scheme name */}
            <span className="font-medium">
              {schemeInstance.scheme?.name || "Unknown Scheme"}
            </span>
          </Badge>
        </TooltipTrigger>
        
        <TooltipContent side="bottom" className="max-w-sm">
          <div className="space-y-2">
            {/* Scheme name and role */}
            <div>
              <p className="font-semibold text-sm">
                {schemeInstance.scheme?.name}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {schemeInstance.role} scheme
              </p>
            </div>
            
            {/* Explicitness info */}
            {showExplicitness && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium">{explicitnessStyle.label}</p>
                <p className="text-xs text-muted-foreground">
                  {explicitnessStyle.description}
                </p>
              </div>
            )}
            
            {/* Text evidence if available */}
            {schemeInstance.textEvidence && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium">Evidence in text:</p>
                <p className="text-xs text-muted-foreground italic">
                  "{schemeInstance.textEvidence}"
                </p>
              </div>
            )}
            
            {/* Justification for implicit/presupposed */}
            {(schemeInstance.role === "presupposed" || schemeInstance.role === "implicit") 
              && schemeInstance.justification && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium">Why reconstructed:</p>
                <p className="text-xs text-muted-foreground">
                  {schemeInstance.justification}
                </p>
              </div>
            )}
            
            {/* CQ count */}
            {schemeInstance.scheme?.criticalQuestions && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  {schemeInstance.scheme.criticalQuestions.length} critical questions
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

#### Step 2: Scheme List Component (3 hours)

**File**: `components/arguments/ArgumentSchemeList.tsx` (NEW)

```typescript
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MultiSchemeBadge } from "./MultiSchemeBadge";
import type { ArgumentWithSchemes } from "@/lib/types/argument-net";
import { 
  getPrimaryScheme, 
  getSupportingSchemes, 
  getImplicitSchemes 
} from "@/lib/utils/argument-net-helpers";
import { Layers, FileText, Eye, HelpCircle } from "lucide-react";

interface ArgumentSchemeListProps {
  argument: ArgumentWithSchemes;
  variant?: "compact" | "detailed";
  showLegend?: boolean;
}

export function ArgumentSchemeList({ 
  argument, 
  variant = "detailed",
  showLegend = true 
}: ArgumentSchemeListProps) {
  const primaryScheme = getPrimaryScheme(argument);
  const supportingSchemes = getSupportingSchemes(argument);
  const implicitSchemes = getImplicitSchemes(argument);
  
  if (!primaryScheme) {
    return (
      <div className="text-sm text-muted-foreground">
        No schemes identified for this argument
      </div>
    );
  }
  
  if (variant === "compact") {
    return (
      <div className="flex flex-wrap gap-2 items-center">
        <MultiSchemeBadge schemeInstance={primaryScheme} size="sm" />
        
        {supportingSchemes.length > 0 && (
          <>
            <span className="text-xs text-muted-foreground">+</span>
            {supportingSchemes.map(si => (
              <MultiSchemeBadge 
                key={si.id} 
                schemeInstance={si} 
                size="sm" 
              />
            ))}
          </>
        )}
        
        {implicitSchemes.length > 0 && (
          <Badge variant="outline" className="text-xs">
            +{implicitSchemes.length} implicit
          </Badge>
        )}
      </div>
    );
  }
  
  // Detailed variant
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Argumentation Schemes Used</CardTitle>
        <CardDescription>
          This argument combines {argument.schemeInstances.length} scheme
          {argument.schemeInstances.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Primary scheme */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-semibold">Primary Scheme</h4>
          </div>
          <MultiSchemeBadge schemeInstance={primaryScheme} size="md" />
          {primaryScheme.scheme?.description && (
            <p className="text-xs text-muted-foreground mt-2">
              {primaryScheme.scheme.description}
            </p>
          )}
        </div>
        
        {/* Supporting schemes */}
        {supportingSchemes.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-green-600" />
                <h4 className="text-sm font-semibold">Supporting Schemes</h4>
                <Badge variant="secondary" className="text-xs">
                  {supportingSchemes.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {supportingSchemes.map(si => (
                  <div key={si.id}>
                    <MultiSchemeBadge schemeInstance={si} size="md" />
                    {si.scheme?.description && (
                      <p className="text-xs text-muted-foreground mt-1 ml-4">
                        {si.scheme.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        
        {/* Implicit schemes */}
        {implicitSchemes.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-amber-600" />
                <h4 className="text-sm font-semibold">Implicit Schemes</h4>
                <Badge variant="secondary" className="text-xs">
                  {implicitSchemes.length}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                These schemes are presupposed or implied by the argument structure
              </p>
              <div className="space-y-2">
                {implicitSchemes.map(si => (
                  <div key={si.id}>
                    <MultiSchemeBadge schemeInstance={si} size="md" />
                    {si.justification && (
                      <p className="text-xs text-muted-foreground mt-1 ml-4 italic">
                        Reconstructed: {si.justification}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        
        {/* Legend */}
        {showLegend && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-4 h-4" />
                <h4 className="text-xs font-semibold text-muted-foreground">
                  Border Style Legend
                </h4>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-8 h-4 border-2 border-solid border-blue-500 rounded" />
                  <span className="text-muted-foreground">Explicit</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-8 h-4 border-2 border-dashed border-amber-500 rounded" />
                  <span className="text-muted-foreground">Presupposed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-8 h-4 border-2 border-dotted border-gray-400 rounded" />
                  <span className="text-muted-foreground">Implied</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

#### Step 3: Update ArgumentCard Component (2 hours)

**File**: `components/arguments/ArgumentCard.tsx`

Update existing component to show multi-scheme info:

```typescript
import { ArgumentSchemeList } from "./ArgumentSchemeList";
import { isMultiSchemeArgument } from "@/lib/utils/argument-net-helpers";

export function ArgumentCard({ argument, ...props }: ArgumentCardProps) {
  const isMultiScheme = isMultiSchemeArgument(argument);
  
  return (
    <Card className={props.className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{argument.content}</CardTitle>
            <CardDescription className="text-xs">
              By {argument.author?.displayName || "Unknown"}
            </CardDescription>
          </div>
          
          {/* Multi-scheme indicator */}
          {isMultiScheme && (
            <Badge variant="secondary" className="text-xs">
              <Layers className="w-3 h-3 mr-1" />
              Multi-Scheme
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Existing content: premises, etc. */}
        
        {/* NEW: Scheme list (compact by default) */}
        <div className="pt-3 border-t">
          <ArgumentSchemeList 
            argument={argument} 
            variant="compact"
            showLegend={false}
          />
        </div>
        
        {/* Existing actions */}
      </CardContent>
    </Card>
  );
}
```

#### Step 4: Expandable Scheme Details Panel (3 hours)

**File**: `components/arguments/ArgumentSchemeDetailsPanel.tsx` (NEW)

```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArgumentSchemeList } from "./ArgumentSchemeList";
import type { ArgumentWithSchemes } from "@/lib/types/argument-net";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";
import { isMultiSchemeArgument } from "@/lib/utils/argument-net-helpers";

interface ArgumentSchemeDetailsPanelProps {
  argument: ArgumentWithSchemes;
  defaultOpen?: boolean;
}

export function ArgumentSchemeDetailsPanel({ 
  argument, 
  defaultOpen = false 
}: ArgumentSchemeDetailsPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isMultiScheme = isMultiSchemeArgument(argument);
  
  if (!isMultiScheme && !argument.schemeInstances.length) {
    return null; // No schemes to show
  }
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span className="font-medium">
              {isMultiScheme 
                ? `View ${argument.schemeInstances.length} Schemes` 
                : "View Scheme Details"
              }
            </span>
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="pt-4">
        <ArgumentSchemeList 
          argument={argument} 
          variant="detailed"
          showLegend={isMultiScheme}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
```

#### Step 5: Composed CQ Counter (2 hours)

**File**: `components/arguments/ComposedCQCounter.tsx` (NEW)

```typescript
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import type { ArgumentWithSchemes } from "@/lib/types/argument-net";

interface ComposedCQCounterProps {
  argument: ArgumentWithSchemes;
  variant?: "simple" | "detailed";
}

export function ComposedCQCounter({ 
  argument, 
  variant = "simple" 
}: ComposedCQCounterProps) {
  // Count CQs from all scheme instances
  const cqCounts = argument.schemeInstances.reduce((acc, si) => {
    const cqs = si.scheme?.criticalQuestions || [];
    
    return {
      total: acc.total + cqs.length,
      byRole: {
        ...acc.byRole,
        [si.role]: (acc.byRole[si.role] || 0) + cqs.length
      },
      byAttackType: cqs.reduce((typeAcc, cq) => ({
        ...typeAcc,
        [cq.attackType]: (typeAcc[cq.attackType] || 0) + 1
      }), acc.byAttackType)
    };
  }, {
    total: 0,
    byRole: {} as Record<string, number>,
    byAttackType: {} as Record<string, number>
  });
  
  if (variant === "simple") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="cursor-help">
              <HelpCircle className="w-3 h-3 mr-1" />
              {cqCounts.total} CQs
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                {cqCounts.total} Total Critical Questions
              </p>
              <p className="text-xs text-muted-foreground">
                Composed from {argument.schemeInstances.length} scheme
                {argument.schemeInstances.length !== 1 ? "s" : ""}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Detailed variant
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <HelpCircle className="w-4 h-4" />
        <span className="text-sm font-semibold">
          {cqCounts.total} Critical Questions
        </span>
      </div>
      
      {/* By role */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">By Role:</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(cqCounts.byRole).map(([role, count]) => (
            <Badge key={role} variant="outline" className="text-xs capitalize">
              {role}: {count}
            </Badge>
          ))}
        </div>
      </div>
      
      {/* By attack type */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">By Type:</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(cqCounts.byAttackType).map(([type, count]) => (
            <Badge key={type} variant="outline" className="text-xs">
              {type}: {count}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
```

#### Step 6: Update FloatingSheet Argument Detail (2 hours)

**File**: `components/floating-sheet/ArgumentDetailSheet.tsx`

Enhance to show full scheme details:

```typescript
import { ArgumentSchemeList } from "@/components/arguments/ArgumentSchemeList";
import { ArgumentSchemeDetailsPanel } from "@/components/arguments/ArgumentSchemeDetailsPanel";
import { ComposedCQCounter } from "@/components/arguments/ComposedCQCounter";

export function ArgumentDetailSheet({ argumentId }: Props) {
  const { data: argument } = useQuery({
    queryKey: ["argument", argumentId],
    queryFn: () => fetch(`/api/arguments/${argumentId}`).then(r => r.json())
  });
  
  if (!argument) return <div>Loading...</div>;
  
  return (
    <div className="space-y-6">
      {/* Existing content: author, content, premises */}
      
      {/* NEW: Scheme information section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Argumentation Structure</h3>
        
        {/* Composed CQ counter */}
        <ComposedCQCounter argument={argument} variant="detailed" />
        
        {/* Expandable scheme details */}
        <ArgumentSchemeDetailsPanel 
          argument={argument}
          defaultOpen={isMultiSchemeArgument(argument)}
        />
      </div>
      
      {/* Existing: CQs, attacks, etc. */}
    </div>
  );
}
```

#### Step 7: Testing (2 hours)

**File**: `__tests__/components/arguments/MultiSchemeBadge.test.tsx`

```typescript
import { render, screen } from "@testing-library/react";
import { MultiSchemeBadge } from "@/components/arguments/MultiSchemeBadge";
import type { ArgumentSchemeInstance } from "@/lib/types/argument-net";

describe("MultiSchemeBadge", () => {
  const mockSchemeInstance: ArgumentSchemeInstance = {
    id: "inst1",
    argumentId: "arg1",
    schemeId: "scheme1",
    role: "primary",
    explicitness: "explicit",
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    scheme: {
      id: "scheme1",
      name: "Expert Opinion",
      description: "Argument from expert testimony"
    }
  };
  
  it("renders scheme name", () => {
    render(<MultiSchemeBadge schemeInstance={mockSchemeInstance} />);
    expect(screen.getByText("Expert Opinion")).toBeInTheDocument();
  });
  
  it("applies primary role styling", () => {
    render(<MultiSchemeBadge schemeInstance={mockSchemeInstance} />);
    const badge = screen.getByText("Expert Opinion").parentElement;
    expect(badge).toHaveClass("bg-blue-100");
  });
  
  it("applies supporting role styling", () => {
    const supporting = { ...mockSchemeInstance, role: "supporting" as const };
    render(<MultiSchemeBadge schemeInstance={supporting} />);
    const badge = screen.getByText("Expert Opinion").parentElement;
    expect(badge).toHaveClass("bg-green-100");
  });
  
  it("applies solid border for explicit", () => {
    render(<MultiSchemeBadge schemeInstance={mockSchemeInstance} />);
    const badge = screen.getByText("Expert Opinion").parentElement;
    expect(badge).toHaveClass("border-solid");
  });
  
  it("applies dashed border for presupposed", () => {
    const presupposed = { 
      ...mockSchemeInstance, 
      explicitness: "presupposed" as const 
    };
    render(<MultiSchemeBadge schemeInstance={presupposed} />);
    const badge = screen.getByText("Expert Opinion").parentElement;
    expect(badge).toHaveClass("border-dashed");
  });
});
```

**File**: `__tests__/components/arguments/ArgumentSchemeList.test.tsx`

```typescript
import { render, screen } from "@testing-library/react";
import { ArgumentSchemeList } from "@/components/arguments/ArgumentSchemeList";
import type { ArgumentWithSchemes } from "@/lib/types/argument-net";

describe("ArgumentSchemeList", () => {
  const mockArgument: ArgumentWithSchemes = {
    id: "arg1",
    claimId: "claim1",
    content: "Test argument",
    schemeInstances: [
      {
        id: "inst1",
        argumentId: "arg1",
        schemeId: "scheme1",
        role: "primary",
        explicitness: "explicit",
        order: 0,
        scheme: {
          id: "scheme1",
          name: "Expert Opinion",
          description: "Argument from expert testimony"
        }
      },
      {
        id: "inst2",
        argumentId: "arg1",
        schemeId: "scheme2",
        role: "supporting",
        explicitness: "explicit",
        order: 0,
        scheme: {
          id: "scheme2",
          name: "Argument from Values",
          description: "Value-based reasoning"
        }
      }
    ],
    dependencies: []
  };
  
  it("renders primary scheme", () => {
    render(<ArgumentSchemeList argument={mockArgument} />);
    expect(screen.getByText("Expert Opinion")).toBeInTheDocument();
  });
  
  it("renders supporting schemes", () => {
    render(<ArgumentSchemeList argument={mockArgument} />);
    expect(screen.getByText("Argument from Values")).toBeInTheDocument();
  });
  
  it("shows scheme count", () => {
    render(<ArgumentSchemeList argument={mockArgument} />);
    expect(screen.getByText(/combines 2 scheme/i)).toBeInTheDocument();
  });
  
  it("compact variant shows inline badges", () => {
    render(<ArgumentSchemeList argument={mockArgument} variant="compact" />);
    // Both schemes should be visible but in compact format
    expect(screen.getByText("Expert Opinion")).toBeInTheDocument();
    expect(screen.getByText("Argument from Values")).toBeInTheDocument();
  });
  
  it("detailed variant shows sections", () => {
    render(<ArgumentSchemeList argument={mockArgument} variant="detailed" />);
    expect(screen.getByText("Primary Scheme")).toBeInTheDocument();
    expect(screen.getByText("Supporting Schemes")).toBeInTheDocument();
  });
});
```

#### Step 8: Documentation (1 hour)

**File**: `docs/features/multi-scheme-arguments.md` (NEW)

```markdown
# Multi-Scheme Arguments

## Overview

Arguments in Mesh can now use multiple argumentation schemes simultaneously, reflecting how real-world arguments work. This document explains how multi-scheme arguments are displayed in the UI.

## Concept

From research (Macagno, Walton & Reed 2017):
> "Argumentation schemes appear in nets instead of in clear and independent occurrences. A single scheme captures only one passage of reasoning, while nets map more complex argumentative strategies."

**Example**: A policy argument might combine:
- **Primary**: Practical reasoning (action recommendation)
- **Supporting**: Argument from values (justification)
- **Supporting**: Argument from consequences (outcomes)
- **Presupposed**: Expert opinion (backing for consequences)

## UI Components

### MultiSchemeBadge

Displays a single scheme instance with:
- **Color** indicates role (blue=primary, green=supporting, amber=presupposed, gray=implicit)
- **Border style** indicates explicitness (solid=explicit, dashed=presupposed, dotted=implied)
- **Tooltip** shows details on hover

### ArgumentSchemeList

Shows all schemes in an argument:

**Compact variant**: Inline badges for card views
**Detailed variant**: Organized sections with descriptions

### ComposedCQCounter

Counts critical questions from ALL schemes:
- Total CQ count across all schemes
- Breakdown by role
- Breakdown by attack type

## Role Types

**Primary**: Main inferential pattern (every argument has exactly one)
**Supporting**: Enables premises for primary scheme
**Presupposed**: Taken for granted, necessary for reconstruction
**Implicit**: Recoverable from context/common knowledge

## Explicitness Levels

**Explicit**: Stated in text (solid border)
**Presupposed**: Necessary but unstated (dashed border)
**Implied**: Context-dependent (dotted border)

## Where You'll See It

- **ArgumentCard**: Compact scheme list in card footer
- **ArgumentDetailSheet**: Full scheme details with expandable panel
- **FloatingSheet**: Composed CQ counter and detailed view
```

---

## Phase 1.3 Acceptance Criteria

**Functionality**:
- [ ] MultiSchemeBadge renders with correct styling for each role
- [ ] Border styles distinguish explicitness levels
- [ ] Tooltips show scheme details on hover
- [ ] ArgumentSchemeList displays all schemes organized by role
- [ ] Compact and detailed variants render correctly
- [ ] ComposedCQCounter accurately totals CQs from all schemes
- [ ] ArgumentCard shows multi-scheme indicator
- [ ] Expandable panel works smoothly

**Visual**:
- [ ] Color coding is consistent (blue/green/amber/gray)
- [ ] Border styles are clearly distinguishable
- [ ] Tooltips are readable and informative
- [ ] Spacing and layout are clean
- [ ] Mobile responsive

**Testing**:
- [ ] Component tests pass for all new components
- [ ] Integration tests with real data
- [ ] Visual regression tests
- [ ] Accessibility tests (keyboard navigation, screen readers)

**Documentation**:
- [ ] Feature documentation complete
- [ ] Component API documented
- [ ] Examples added to Storybook (if used)

---

## Phase 1.3 Deployment Strategy

### Stage 1: Internal Testing (Days 8-9)

Deploy to development environment:
```bash
# Build with feature flag
ENABLE_MULTI_SCHEME_DISPLAY=true npm run build

# Deploy to dev
./deploy-dev.sh
```

**Test Checklist**:
- [ ] View arguments with single scheme (backward compat)
- [ ] View arguments with multiple schemes
- [ ] Hover tooltips work
- [ ] Expandable panels toggle smoothly
- [ ] Mobile view renders correctly

### Stage 2: Staging with Real Data (Day 10)

Deploy to staging:
```bash
# Enable for staging
ENABLE_MULTI_SCHEME_DISPLAY=true npm run deploy:staging
```

**Validation**:
- [ ] Import real arguments from production
- [ ] Verify scheme display accuracy
- [ ] Check performance with large argument sets
- [ ] User testing session with 3-5 power users

### Stage 3: Production Rollout (Day 11)

Gradual rollout:
1. Enable for admin users (1 hour)
2. Enable for power users (4 hours)
3. Enable for all users (24 hours)

**Monitor**:
- Error rates in Sentry
- Performance metrics (render times)
- User feedback via in-app surveys

---

## Phase 1.3 Complete Deliverables

✅ **Components**:
- MultiSchemeBadge with role/explicitness styling
- ArgumentSchemeList (compact + detailed variants)
- ArgumentSchemeDetailsPanel (expandable)
- ComposedCQCounter (simple + detailed)

✅ **Updates**:
- ArgumentCard shows multi-scheme info
- ArgumentDetailSheet includes scheme section
- FloatingSheet enhanced with scheme details

✅ **Testing**:
- Unit tests for all components
- Integration tests with mock data
- Visual regression tests

✅ **Documentation**:
- Feature guide for multi-scheme arguments
- Component API documentation

---

**What Users See After Phase 1.3**:

👀 **Before**: Single scheme badge on argument  
👀 **After**: Full scheme composition visible with roles and explicitness levels

🎯 **Value**: Users can understand complete argumentative strategy, not just primary scheme

📊 **Metrics**: Track how often users expand scheme details, hover for tooltips

---

*End of Phase 1.3. Ready to proceed with Phase 1.4 (UI Components - Editing) when you're ready.*

---

## Phase 1.4: UI Components - Editing Interface
**Effort**: 16-20 hours | **Priority**: 🔴 Critical | **Risk**: Medium

### Context

Phase 1.3 provided read-only views. Now we need editing capabilities: adding schemes to arguments, removing schemes, changing roles, and reordering scheme instances. This phase enables users to construct multi-scheme arguments.

### Goals

1. Add new schemes to existing arguments
2. Remove scheme instances (with validation)
3. Edit scheme roles and explicitness
4. Reorder scheme instances
5. Validate scheme compositions (must have exactly one primary)
6. Preserve text evidence and justification

### Implementation

#### Step 1: Scheme Selector Component (3 hours)

**File**: `components/arguments/SchemeSelector.tsx` (NEW)

```typescript
import { useState, useMemo } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArgumentationScheme } from "@prisma/client";

interface SchemeSelectorProps {
  schemes: ArgumentationScheme[];
  selectedSchemeIds: string[];
  onSchemeToggle: (schemeId: string) => void;
  multiSelect?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SchemeSelector({
  schemes,
  selectedSchemeIds,
  onSchemeToggle,
  multiSelect = false,
  disabled = false,
  className
}: SchemeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  // Group schemes by category
  const groupedSchemes = useMemo(() => {
    const groups: Record<string, ArgumentationScheme[]> = {};
    
    schemes.forEach(scheme => {
      const category = scheme.category || "Other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(scheme);
    });
    
    return groups;
  }, [schemes]);
  
  // Filter by search
  const filteredGroups = useMemo(() => {
    if (!search) return groupedSchemes;
    
    const filtered: Record<string, ArgumentationScheme[]> = {};
    const searchLower = search.toLowerCase();
    
    Object.entries(groupedSchemes).forEach(([category, categorySchemes]) => {
      const matching = categorySchemes.filter(
        s => s.name.toLowerCase().includes(searchLower) ||
             s.description?.toLowerCase().includes(searchLower)
      );
      
      if (matching.length > 0) {
        filtered[category] = matching;
      }
    });
    
    return filtered;
  }, [groupedSchemes, search]);
  
  const selectedCount = selectedSchemeIds.length;
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between", className)}
        >
          <span className="flex items-center gap-2">
            {selectedCount === 0 ? (
              <>
                <Search className="w-4 h-4 opacity-50" />
                Select scheme{multiSelect ? "s" : ""}...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {selectedCount} scheme{selectedCount !== 1 ? "s" : ""} selected
              </>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search schemes..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No schemes found.</CommandEmpty>
            
            {Object.entries(filteredGroups).map(([category, categorySchemes]) => (
              <CommandGroup key={category} heading={category}>
                {categorySchemes.map(scheme => {
                  const isSelected = selectedSchemeIds.includes(scheme.id);
                  
                  return (
                    <CommandItem
                      key={scheme.id}
                      value={scheme.id}
                      onSelect={() => {
                        onSchemeToggle(scheme.id);
                        if (!multiSelect) {
                          setOpen(false);
                        }
                      }}
                      className="flex items-start gap-2 py-3"
                    >
                      <div className={cn(
                        "mt-0.5 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : "opacity-50"
                      )}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {scheme.name}
                        </p>
                        {scheme.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {scheme.description}
                          </p>
                        )}
                        {scheme.criticalQuestions && (
                          <Badge variant="secondary" className="text-xs">
                            {scheme.criticalQuestions.length} CQs
                          </Badge>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

#### Step 2: Add Scheme Modal (4 hours)

**File**: `components/arguments/AddSchemeToArgumentModal.tsx` (NEW)

```typescript
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SchemeSelector } from "./SchemeSelector";
import { Loader2, AlertCircle } from "lucide-react";
import type { SchemeRole, ExplicitnessLevel } from "@/lib/types/argument-net";

interface AddSchemeToArgumentModalProps {
  argumentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddSchemeToArgumentModal({
  argumentId,
  open,
  onOpenChange,
  onSuccess
}: AddSchemeToArgumentModalProps) {
  const queryClient = useQueryClient();
  
  // Form state
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);
  const [role, setRole] = useState<SchemeRole>("supporting");
  const [explicitness, setExplicitness] = useState<ExplicitnessLevel>("explicit");
  const [textEvidence, setTextEvidence] = useState("");
  const [justification, setJustification] = useState("");
  
  // Fetch available schemes
  const { data: allSchemes, isLoading: schemesLoading } = useQuery({
    queryKey: ["schemes"],
    queryFn: () => fetch("/api/schemes").then(r => r.json())
  });
  
  // Fetch current argument schemes
  const { data: argument } = useQuery({
    queryKey: ["argument", argumentId],
    queryFn: () => fetch(`/api/arguments/${argumentId}`).then(r => r.json())
  });
  
  // Add scheme mutation
  const addSchemeMutation = useMutation({
    mutationFn: async (data: {
      schemeId: string;
      role: SchemeRole;
      explicitness: ExplicitnessLevel;
      textEvidence?: string;
      justification?: string;
    }) => {
      const response = await fetch(`/api/arguments/${argumentId}/schemes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add scheme");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["argument", argumentId] });
      onSuccess?.();
      handleClose();
    }
  });
  
  const handleClose = () => {
    setSelectedSchemeId(null);
    setRole("supporting");
    setExplicitness("explicit");
    setTextEvidence("");
    setJustification("");
    addSchemeMutation.reset();
    onOpenChange(false);
  };
  
  const handleSubmit = () => {
    if (!selectedSchemeId) return;
    
    addSchemeMutation.mutate({
      schemeId: selectedSchemeId,
      role,
      explicitness,
      textEvidence: textEvidence.trim() || undefined,
      justification: justification.trim() || undefined
    });
  };
  
  // Check if scheme already used
  const existingSchemeIds = argument?.schemeInstances?.map((si: any) => si.schemeId) || [];
  const availableSchemes = allSchemes?.filter((s: any) => 
    !existingSchemeIds.includes(s.id)
  ) || [];
  
  // Validation
  const hasPrimaryScheme = argument?.schemeInstances?.some((si: any) => si.role === "primary");
  const canSetPrimary = !hasPrimaryScheme || role !== "primary";
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Argumentation Scheme</DialogTitle>
          <DialogDescription>
            Add another scheme to enrich this argument's structure. Multi-scheme arguments better reflect complex reasoning.
          </DialogDescription>
        </DialogHeader>
        
        {schemesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Scheme selector */}
            <div className="space-y-2">
              <Label>Select Scheme</Label>
              <SchemeSelector
                schemes={availableSchemes}
                selectedSchemeIds={selectedSchemeId ? [selectedSchemeId] : []}
                onSchemeToggle={setSelectedSchemeId}
                multiSelect={false}
              />
              {existingSchemeIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {existingSchemeIds.length} scheme{existingSchemeIds.length !== 1 ? "s" : ""} already in use
                </p>
              )}
            </div>
            
            {/* Role selection */}
            <div className="space-y-3">
              <Label>Role in Argument</Label>
              <RadioGroup value={role} onValueChange={(v) => setRole(v as SchemeRole)}>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="primary" id="role-primary" disabled={hasPrimaryScheme} />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="role-primary" className={hasPrimaryScheme ? "opacity-50" : ""}>
                      Primary {hasPrimaryScheme && "(Already set)"}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Main inferential pattern (exactly one per argument)
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="supporting" id="role-supporting" />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="role-supporting">Supporting</Label>
                    <p className="text-xs text-muted-foreground">
                      Enables premises for the primary scheme
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="presupposed" id="role-presupposed" />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="role-presupposed">Presupposed</Label>
                    <p className="text-xs text-muted-foreground">
                      Taken for granted, necessary for reconstruction
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="implicit" id="role-implicit" />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="role-implicit">Implicit</Label>
                    <p className="text-xs text-muted-foreground">
                      Recoverable from context or common knowledge
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
            
            {/* Explicitness level */}
            <div className="space-y-3">
              <Label>Explicitness Level</Label>
              <RadioGroup value={explicitness} onValueChange={(v) => setExplicitness(v as ExplicitnessLevel)}>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="explicit" id="exp-explicit" />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="exp-explicit">Explicit (Solid border)</Label>
                    <p className="text-xs text-muted-foreground">
                      Clearly stated in the argument text
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="presupposed" id="exp-presupposed" />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="exp-presupposed">Presupposed (Dashed border)</Label>
                    <p className="text-xs text-muted-foreground">
                      Necessary but unstated background assumption
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="implied" id="exp-implied" />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="exp-implied">Implied (Dotted border)</Label>
                    <p className="text-xs text-muted-foreground">
                      Recoverable from context or common knowledge
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
            
            {/* Text evidence (for explicit) */}
            {explicitness === "explicit" && (
              <div className="space-y-2">
                <Label htmlFor="textEvidence">Text Evidence (Optional)</Label>
                <Textarea
                  id="textEvidence"
                  placeholder="Quote or reference showing this scheme in the text..."
                  value={textEvidence}
                  onChange={(e) => setTextEvidence(e.target.value)}
                  rows={3}
                />
              </div>
            )}
            
            {/* Justification (for presupposed/implicit) */}
            {(explicitness === "presupposed" || explicitness === "implied" || role === "presupposed" || role === "implicit") && (
              <div className="space-y-2">
                <Label htmlFor="justification">Justification</Label>
                <Textarea
                  id="justification"
                  placeholder="Explain why this scheme is presupposed/implicit..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Required for presupposed and implicit schemes
                </p>
              </div>
            )}
            
            {/* Validation warnings */}
            {!canSetPrimary && role === "primary" && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This argument already has a primary scheme. You must remove the existing primary scheme first.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Error display */}
            {addSchemeMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {addSchemeMutation.error?.message || "Failed to add scheme"}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={addSchemeMutation.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={
              !selectedSchemeId || 
              addSchemeMutation.isPending ||
              !canSetPrimary
            }
          >
            {addSchemeMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Add Scheme
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### Step 3: Edit Scheme Instance Modal (3 hours)

**File**: `components/arguments/EditSchemeInstanceModal.tsx` (NEW)

```typescript
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import type { ArgumentSchemeInstance, SchemeRole, ExplicitnessLevel } from "@/lib/types/argument-net";

interface EditSchemeInstanceModalProps {
  schemeInstance: ArgumentSchemeInstance | null;
  argumentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canChangePrimary?: boolean;
}

export function EditSchemeInstanceModal({
  schemeInstance,
  argumentId,
  open,
  onOpenChange,
  canChangePrimary = true
}: EditSchemeInstanceModalProps) {
  const queryClient = useQueryClient();
  
  const [role, setRole] = useState<SchemeRole>(schemeInstance?.role || "supporting");
  const [explicitness, setExplicitness] = useState<ExplicitnessLevel>(schemeInstance?.explicitness || "explicit");
  const [textEvidence, setTextEvidence] = useState(schemeInstance?.textEvidence || "");
  const [justification, setJustification] = useState(schemeInstance?.justification || "");
  
  // Reset form when instance changes
  useEffect(() => {
    if (schemeInstance) {
      setRole(schemeInstance.role);
      setExplicitness(schemeInstance.explicitness);
      setTextEvidence(schemeInstance.textEvidence || "");
      setJustification(schemeInstance.justification || "");
    }
  }, [schemeInstance]);
  
  const updateMutation = useMutation({
    mutationFn: async (data: {
      role: SchemeRole;
      explicitness: ExplicitnessLevel;
      textEvidence?: string;
      justification?: string;
    }) => {
      const response = await fetch(
        `/api/arguments/${argumentId}/schemes/${schemeInstance!.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update scheme");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["argument", argumentId] });
      onOpenChange(false);
    }
  });
  
  const handleSubmit = () => {
    if (!schemeInstance) return;
    
    updateMutation.mutate({
      role,
      explicitness,
      textEvidence: textEvidence.trim() || undefined,
      justification: justification.trim() || undefined
    });
  };
  
  if (!schemeInstance) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Scheme Instance</DialogTitle>
          <DialogDescription>
            Modify how "{schemeInstance.scheme?.name}" functions in this argument
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Role selection */}
          <div className="space-y-3">
            <Label>Role in Argument</Label>
            <RadioGroup value={role} onValueChange={(v) => setRole(v as SchemeRole)}>
              <div className="flex items-start space-x-2">
                <RadioGroupItem 
                  value="primary" 
                  id="edit-role-primary" 
                  disabled={!canChangePrimary && schemeInstance.role !== "primary"}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label 
                    htmlFor="edit-role-primary"
                    className={!canChangePrimary && schemeInstance.role !== "primary" ? "opacity-50" : ""}
                  >
                    Primary
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Main inferential pattern
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="supporting" id="edit-role-supporting" />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="edit-role-supporting">Supporting</Label>
                  <p className="text-xs text-muted-foreground">
                    Enables premises for primary scheme
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="presupposed" id="edit-role-presupposed" />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="edit-role-presupposed">Presupposed</Label>
                  <p className="text-xs text-muted-foreground">
                    Necessary background assumption
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="implicit" id="edit-role-implicit" />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="edit-role-implicit">Implicit</Label>
                  <p className="text-xs text-muted-foreground">
                    Recoverable from context
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          {/* Explicitness */}
          <div className="space-y-3">
            <Label>Explicitness Level</Label>
            <RadioGroup value={explicitness} onValueChange={(v) => setExplicitness(v as ExplicitnessLevel)}>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="explicit" id="edit-exp-explicit" />
                <Label htmlFor="edit-exp-explicit">Explicit</Label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="presupposed" id="edit-exp-presupposed" />
                <Label htmlFor="edit-exp-presupposed">Presupposed</Label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="implied" id="edit-exp-implied" />
                <Label htmlFor="edit-exp-implied">Implied</Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Text evidence */}
          {explicitness === "explicit" && (
            <div className="space-y-2">
              <Label htmlFor="edit-textEvidence">Text Evidence</Label>
              <Textarea
                id="edit-textEvidence"
                value={textEvidence}
                onChange={(e) => setTextEvidence(e.target.value)}
                rows={3}
              />
            </div>
          )}
          
          {/* Justification */}
          {(explicitness !== "explicit" || role === "presupposed" || role === "implicit") && (
            <div className="space-y-2">
              <Label htmlFor="edit-justification">Justification</Label>
              <Textarea
                id="edit-justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={3}
              />
            </div>
          )}
          
          {updateMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {updateMutation.error?.message || "Failed to update"}
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### Step 4: Remove Scheme Confirmation (2 hours)

**File**: `components/arguments/RemoveSchemeButton.tsx` (NEW)

```typescript
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import type { ArgumentSchemeInstance } from "@/lib/types/argument-net";

interface RemoveSchemeButtonProps {
  schemeInstance: ArgumentSchemeInstance;
  argumentId: string;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "destructive";
  onSuccess?: () => void;
}

export function RemoveSchemeButton({
  schemeInstance,
  argumentId,
  size = "sm",
  variant = "ghost",
  onSuccess
}: RemoveSchemeButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const queryClient = useQueryClient();
  
  const removeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/arguments/${argumentId}/schemes/${schemeInstance.id}`,
        { method: "DELETE" }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to remove scheme");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["argument", argumentId] });
      onSuccess?.();
      setShowConfirm(false);
    }
  });
  
  const isPrimary = schemeInstance.role === "primary";
  
  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowConfirm(true)}
        disabled={removeMutation.isPending}
      >
        {removeMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </Button>
      
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {isPrimary ? "Primary " : ""}Scheme?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to remove "{schemeInstance.scheme?.name}" from this argument?
              </p>
              
              {isPrimary && (
                <p className="font-semibold text-destructive">
                  ⚠️ This is the PRIMARY scheme. Removing it will require you to set a new primary scheme.
                </p>
              )}
              
              {schemeInstance.scheme?.criticalQuestions && schemeInstance.scheme.criticalQuestions.length > 0 && (
                <p className="text-sm">
                  This will also remove {schemeInstance.scheme.criticalQuestions.length} associated critical questions.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeMutation.mutate()}
              disabled={removeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Remove Scheme
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

#### Step 5: Reorder Schemes Interface (3 hours)

**File**: `components/arguments/ReorderSchemesPanel.tsx` (NEW)

```typescript
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { MultiSchemeBadge } from "./MultiSchemeBadge";
import { GripVertical, Save, X } from "lucide-react";
import type { ArgumentSchemeInstance } from "@/lib/types/argument-net";

interface ReorderSchemesPanelProps {
  schemeInstances: ArgumentSchemeInstance[];
  argumentId: string;
  onClose: () => void;
}

export function ReorderSchemesPanel({
  schemeInstances,
  argumentId,
  onClose
}: ReorderSchemesPanelProps) {
  const queryClient = useQueryClient();
  const [orderedInstances, setOrderedInstances] = useState(
    [...schemeInstances].sort((a, b) => a.order - b.order)
  );
  
  const reorderMutation = useMutation({
    mutationFn: async (newOrder: { id: string; order: number }[]) => {
      const response = await fetch(
        `/api/arguments/${argumentId}/schemes/reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: newOrder })
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reorder");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["argument", argumentId] });
      onClose();
    }
  });
  
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(orderedInstances);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setOrderedInstances(items);
  };
  
  const handleSave = () => {
    const newOrder = orderedInstances.map((inst, index) => ({
      id: inst.id,
      order: index
    }));
    
    reorderMutation.mutate(newOrder);
  };
  
  const hasChanges = orderedInstances.some(
    (inst, index) => inst.id !== schemeInstances.find(si => si.order === index)?.id
  );
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">Reorder Schemes</CardTitle>
            <CardDescription>
              Drag to change the display order of schemes
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="schemes">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {orderedInstances.map((inst, index) => (
                  <Draggable key={inst.id} draggableId={inst.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg border bg-card
                          ${snapshot.isDragging ? "shadow-lg" : ""}
                        `}
                      >
                        <div {...provided.dragHandleProps}>
                          <GripVertical className="w-5 h-5 text-muted-foreground" />
                        </div>
                        
                        <div className="flex-1">
                          <MultiSchemeBadge 
                            schemeInstance={inst} 
                            size="md"
                            showExplicitness={false}
                          />
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          #{index + 1}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!hasChanges || reorderMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Order
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Step 6: Integrated Scheme Management Panel (3 hours)

**File**: `components/arguments/ArgumentSchemeManagementPanel.tsx` (NEW)

```typescript
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AddSchemeToArgumentModal } from "./AddSchemeToArgumentModal";
import { EditSchemeInstanceModal } from "./EditSchemeInstanceModal";
import { RemoveSchemeButton } from "./RemoveSchemeButton";
import { ReorderSchemesPanel } from "./ReorderSchemesPanel";
import { MultiSchemeBadge } from "./MultiSchemeBadge";
import { Plus, Edit, ArrowUpDown, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ArgumentWithSchemes, ArgumentSchemeInstance } from "@/lib/types/argument-net";
import { getPrimaryScheme } from "@/lib/utils/argument-net-helpers";

interface ArgumentSchemeManagementPanelProps {
  argument: ArgumentWithSchemes;
}

export function ArgumentSchemeManagementPanel({
  argument
}: ArgumentSchemeManagementPanelProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInstance, setEditingInstance] = useState<ArgumentSchemeInstance | null>(null);
  const [showReorder, setShowReorder] = useState(false);
  
  const primaryScheme = getPrimaryScheme(argument);
  const sortedInstances = [...argument.schemeInstances].sort((a, b) => a.order - b.order);
  
  if (showReorder) {
    return (
      <ReorderSchemesPanel
        schemeInstances={sortedInstances}
        argumentId={argument.id}
        onClose={() => setShowReorder(false)}
      />
    );
  }
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">Manage Schemes</CardTitle>
              <CardDescription>
                Add, edit, or reorder argumentation schemes
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {sortedInstances.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReorder(true)}
                >
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Reorder
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Scheme
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!primaryScheme && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This argument needs a primary scheme. Add one to complete the argument structure.
              </AlertDescription>
            </Alert>
          )}
          
          {sortedInstances.map((inst, index) => (
            <div key={inst.id}>
              {index > 0 && <Separator className="my-3" />}
              
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-2">
                  <MultiSchemeBadge 
                    schemeInstance={inst} 
                    size="md"
                  />
                  
                  {inst.textEvidence && (
                    <p className="text-xs text-muted-foreground italic pl-4">
                      "{inst.textEvidence}"
                    </p>
                  )}
                  
                  {inst.justification && (
                    <p className="text-xs text-muted-foreground pl-4">
                      <strong>Justification:</strong> {inst.justification}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingInstance(inst)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <RemoveSchemeButton
                    schemeInstance={inst}
                    argumentId={argument.id}
                    size="sm"
                    variant="ghost"
                  />
                </div>
              </div>
            </div>
          ))}
          
          {sortedInstances.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No schemes added yet</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="mt-2"
              >
                Add your first scheme
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modals */}
      <AddSchemeToArgumentModal
        argumentId={argument.id}
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />
      
      <EditSchemeInstanceModal
        schemeInstance={editingInstance}
        argumentId={argument.id}
        open={!!editingInstance}
        onOpenChange={(open) => !open && setEditingInstance(null)}
        canChangePrimary={sortedInstances.filter(si => si.role === "primary").length <= 1}
      />
    </>
  );
}
```

#### Step 7: API Endpoints (2 hours)

**File**: `app/api/arguments/[id]/schemes/route.ts`

Add new endpoints for scheme management:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const addSchemeSchema = z.object({
  schemeId: z.string(),
  role: z.enum(["primary", "supporting", "presupposed", "implicit"]),
  explicitness: z.enum(["explicit", "presupposed", "implied"]),
  textEvidence: z.string().optional(),
  justification: z.string().optional()
});

// POST - Add scheme to argument
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const argumentId = params.id;
    const body = await req.json();
    const data = addSchemeSchema.parse(body);
    
    // Verify argument exists and user has permission
    const argument = await prisma.argument.findUnique({
      where: { id: argumentId },
      include: { 
        schemeInstances: true,
        claim: { select: { deliberationId: true } }
      }
    });
    
    if (!argument) {
      return NextResponse.json({ error: "Argument not found" }, { status: 404 });
    }
    
    // Check if setting primary but one already exists
    if (data.role === "primary") {
      const hasPrimary = argument.schemeInstances.some(si => si.role === "primary");
      if (hasPrimary) {
        return NextResponse.json(
          { error: "Argument already has a primary scheme" },
          { status: 400 }
        );
      }
    }
    
    // Get next order
    const maxOrder = argument.schemeInstances.reduce(
      (max, si) => Math.max(max, si.order),
      -1
    );
    
    // Create scheme instance
    const schemeInstance = await prisma.argumentSchemeInstance.create({
      data: {
        argumentId,
        schemeId: data.schemeId,
        role: data.role,
        explicitness: data.explicitness,
        textEvidence: data.textEvidence,
        justification: data.justification,
        order: maxOrder + 1
      },
      include: {
        scheme: true
      }
    });
    
    return NextResponse.json(schemeInstance);
  } catch (error) {
    console.error("Error adding scheme:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**File**: `app/api/arguments/[id]/schemes/[instanceId]/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const updateSchemeSchema = z.object({
  role: z.enum(["primary", "supporting", "presupposed", "implicit"]).optional(),
  explicitness: z.enum(["explicit", "presupposed", "implied"]).optional(),
  textEvidence: z.string().optional(),
  justification: z.string().optional()
});

// PATCH - Update scheme instance
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; instanceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id: argumentId, instanceId } = params;
    const body = await req.json();
    const data = updateSchemeSchema.parse(body);
    
    // Check if changing to primary
    if (data.role === "primary") {
      const existingPrimary = await prisma.argumentSchemeInstance.findFirst({
        where: {
          argumentId,
          role: "primary",
          id: { not: instanceId }
        }
      });
      
      if (existingPrimary) {
        return NextResponse.json(
          { error: "Another primary scheme already exists" },
          { status: 400 }
        );
      }
    }
    
    const updated = await prisma.argumentSchemeInstance.update({
      where: { id: instanceId },
      data,
      include: { scheme: true }
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating scheme:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove scheme instance
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; instanceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { instanceId } = params;
    
    await prisma.argumentSchemeInstance.delete({
      where: { id: instanceId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing scheme:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**File**: `app/api/arguments/[id]/schemes/reorder/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const reorderSchema = z.object({
  order: z.array(z.object({
    id: z.string(),
    order: z.number()
  }))
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    const { order } = reorderSchema.parse(body);
    
    // Update in transaction
    await prisma.$transaction(
      order.map(item =>
        prisma.argumentSchemeInstance.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      )
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering schemes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

#### Step 8: Testing (2 hours)

**File**: `__tests__/components/arguments/AddSchemeToArgumentModal.test.tsx`

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddSchemeToArgumentModal } from "@/components/arguments/AddSchemeToArgumentModal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe("AddSchemeToArgumentModal", () => {
  it("renders form fields", async () => {
    render(
      <AddSchemeToArgumentModal
        argumentId="arg1"
        open={true}
        onOpenChange={() => {}}
      />,
      { wrapper }
    );
    
    await waitFor(() => {
      expect(screen.getByText("Add Argumentation Scheme")).toBeInTheDocument();
    });
    
    expect(screen.getByText("Select Scheme")).toBeInTheDocument();
    expect(screen.getByText("Role in Argument")).toBeInTheDocument();
    expect(screen.getByText("Explicitness Level")).toBeInTheDocument();
  });
  
  it("disables primary role if already set", async () => {
    // Mock argument with primary scheme
    global.fetch = jest.fn((url) => {
      if (url.includes("/api/arguments/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: "arg1",
            schemeInstances: [{
              role: "primary",
              schemeId: "scheme1"
            }]
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }) as jest.Mock;
    
    render(
      <AddSchemeToArgumentModal
        argumentId="arg1"
        open={true}
        onOpenChange={() => {}}
      />,
      { wrapper }
    );
    
    await waitFor(() => {
      const primaryRadio = screen.getByRole("radio", { name: /primary/i });
      expect(primaryRadio).toBeDisabled();
    });
  });
});
```

---

## Phase 1.4 Acceptance Criteria

**Functionality**:
- [ ] Users can add new schemes to arguments via modal
- [ ] Scheme selector shows available schemes with search/filter
- [ ] Role and explicitness can be set for each scheme
- [ ] Text evidence field appears for explicit schemes
- [ ] Justification field required for presupposed/implicit
- [ ] Cannot set multiple primary schemes
- [ ] Users can edit existing scheme instances
- [ ] Users can remove scheme instances with confirmation
- [ ] Warning shown when removing primary scheme
- [ ] Users can drag-drop to reorder schemes
- [ ] Order saves persist correctly

**Validation**:
- [ ] Exactly one primary scheme enforced
- [ ] Cannot add duplicate schemes
- [ ] Justification required for implicit/presupposed
- [ ] API validates data before saving

**UX**:
- [ ] Modal flows are intuitive
- [ ] Loading states shown during mutations
- [ ] Error messages are clear
- [ ] Success feedback provided
- [ ] Drag-drop feels smooth

**Testing**:
- [ ] Component tests for all new components
- [ ] API endpoint tests
- [ ] Integration tests for full flows
- [ ] E2E tests for add/edit/remove/reorder

---

## Phase 1.4 Deployment Strategy

### Stage 1: Internal Testing (Days 12-13)

Feature flag: `ENABLE_MULTI_SCHEME_EDITING=true`

**Test Scenarios**:
1. Add scheme to argument with single scheme
2. Add multiple supporting schemes
3. Try to add second primary (should fail)
4. Edit scheme role and explicitness
5. Remove non-primary scheme
6. Remove primary scheme (check warning)
7. Reorder 3+ schemes via drag-drop
8. Cancel/save flow for each action

### Stage 2: Beta Users (Day 14)

Invite 10 power users to test:
- Provide test arguments
- Ask them to construct multi-scheme arguments
- Collect feedback on:
  - Modal clarity
  - Role/explicitness concepts
  - Reordering UX
  - Error messages

### Stage 3: Production Rollout (Day 15)

Gradual rollout:
1. Admin users (2 hours)
2. Moderators (4 hours)
3. All users (24 hours)

**Monitor**:
- Mutation success/error rates
- Average schemes per argument
- Most common scheme combinations
- User dropout rate in modal flows

---

## Phase 1.4 Complete Deliverables

✅ **Components**:
- SchemeSelector (searchable, grouped by category)
- AddSchemeToArgumentModal (full form with validation)
- EditSchemeInstanceModal (update role/explicitness)
- RemoveSchemeButton (confirmation with warnings)
- ReorderSchemesPanel (drag-drop interface)
- ArgumentSchemeManagementPanel (integrated management)

✅ **API Endpoints**:
- POST `/api/arguments/[id]/schemes` - Add scheme
- PATCH `/api/arguments/[id]/schemes/[instanceId]` - Update scheme
- DELETE `/api/arguments/[id]/schemes/[instanceId]` - Remove scheme
- POST `/api/arguments/[id]/schemes/reorder` - Reorder schemes

✅ **Validation**:
- Exactly one primary scheme enforced
- Duplicate prevention
- Required field validation
- Permission checks

✅ **Testing**:
- Unit tests for components
- API endpoint tests
- Integration tests
- E2E test scenarios

---

**What Users Can Do After Phase 1.4**:

✏️ **Before**: View schemes but cannot edit  
✏️ **After**: Full CRUD for multi-scheme arguments

🎯 **Value**: Users can construct complex argumentative strategies reflecting real reasoning

📊 **Metrics**: 
- Average schemes per argument (target: 2-3)
- Percentage of arguments using 2+ schemes (target: 40%+)
- Editing session completion rate (target: 80%+)

---

*End of Phase 1.4. Ready for Phase 1.5 (SchemeSpecificCQsModal Updates) when you're ready.*

---

## Phase 1.5: SchemeSpecificCQsModal Updates
**Effort**: 10-12 hours | **Priority**: 🔴 Critical | **Risk**: Medium

### Context

The existing `SchemeSpecificCQsModal` shows critical questions from a single scheme. With multi-scheme arguments, we need to:
1. Compose CQs from all schemes in an argument
2. Group CQs by their source scheme
3. Show relationships between schemes' CQs
4. Handle CQ interactions (attacks) across multiple schemes

### Goals

1. Display composed CQ sets from all schemes
2. Visual grouping by source scheme
3. Filter/toggle CQs by scheme
4. Show which scheme each CQ attacks
5. Maintain existing attack/response functionality
6. Performance optimization for large CQ sets

### Implementation

#### Step 1: Composed CQ Data Structure (2 hours)

**File**: `lib/types/composed-cqs.ts` (NEW)

```typescript
import type { CriticalQuestion, ArgumentSchemeInstance } from "@prisma/client";

export interface ComposedCriticalQuestion extends CriticalQuestion {
  // Source scheme info
  sourceSchemeInstance: ArgumentSchemeInstance;
  sourceSchemeName: string;
  sourceSchemeRole: "primary" | "supporting" | "presupposed" | "implicit";
  
  // Targeting info
  targetsSchemeRole?: "primary" | "supporting" | "presupposed" | "implicit";
  
  // Composition metadata
  compositionOrder: number; // Order in composed set
  isFromPrimaryScheme: boolean;
  
  // Relationships
  relatedCQIds?: string[]; // CQs from other schemes that are related
}

export interface ComposedCQSet {
  argumentId: string;
  totalCQs: number;
  
  // CQs organized by source scheme
  byScheme: {
    schemeInstanceId: string;
    schemeName: string;
    schemeRole: "primary" | "supporting" | "presupposed" | "implicit";
    cqs: ComposedCriticalQuestion[];
  }[];
  
  // CQs organized by attack type
  byAttackType: {
    attackType: string;
    cqs: ComposedCriticalQuestion[];
  }[];
  
  // CQs organized by target (which scheme they attack)
  byTarget: {
    targetRole: "primary" | "supporting" | "presupposed" | "implicit";
    cqs: ComposedCriticalQuestion[];
  }[];
  
  // Statistics
  stats: {
    fromPrimary: number;
    fromSupporting: number;
    fromPresupposed: number;
    fromImplicit: number;
    byAttackType: Record<string, number>;
  };
}
```

#### Step 2: Compose CQs Helper (2 hours)

**File**: `lib/utils/compose-critical-questions.ts` (NEW)

```typescript
import type { ArgumentWithSchemes } from "@/lib/types/argument-net";
import type { ComposedCQSet, ComposedCriticalQuestion } from "@/lib/types/composed-cqs";

export function composeCriticalQuestions(argument: ArgumentWithSchemes): ComposedCQSet {
  const composedCQs: ComposedCriticalQuestion[] = [];
  let order = 0;
  
  // Sort scheme instances by order (primary first)
  const sortedInstances = [...argument.schemeInstances].sort((a, b) => {
    // Primary always first
    if (a.role === "primary") return -1;
    if (b.role === "primary") return 1;
    // Then by order
    return a.order - b.order;
  });
  
  // Compose CQs from each scheme
  sortedInstances.forEach(instance => {
    const cqs = instance.scheme?.criticalQuestions || [];
    
    cqs.forEach(cq => {
      composedCQs.push({
        ...cq,
        sourceSchemeInstance: instance,
        sourceSchemeName: instance.scheme?.name || "Unknown",
        sourceSchemeRole: instance.role,
        isFromPrimaryScheme: instance.role === "primary",
        compositionOrder: order++,
        // Determine what this CQ targets based on attack type
        targetsSchemeRole: determineTargetRole(cq, instance)
      });
    });
  });
  
  // Group by scheme
  const byScheme = sortedInstances.map(instance => ({
    schemeInstanceId: instance.id,
    schemeName: instance.scheme?.name || "Unknown",
    schemeRole: instance.role,
    cqs: composedCQs.filter(cq => cq.sourceSchemeInstance.id === instance.id)
  }));
  
  // Group by attack type
  const attackTypes = new Set(composedCQs.map(cq => cq.attackType));
  const byAttackType = Array.from(attackTypes).map(attackType => ({
    attackType,
    cqs: composedCQs.filter(cq => cq.attackType === attackType)
  }));
  
  // Group by target role
  const targetRoles: Array<"primary" | "supporting" | "presupposed" | "implicit"> = 
    ["primary", "supporting", "presupposed", "implicit"];
  const byTarget = targetRoles.map(role => ({
    targetRole: role,
    cqs: composedCQs.filter(cq => cq.targetsSchemeRole === role)
  })).filter(group => group.cqs.length > 0);
  
  // Calculate statistics
  const stats = {
    fromPrimary: composedCQs.filter(cq => cq.sourceSchemeRole === "primary").length,
    fromSupporting: composedCQs.filter(cq => cq.sourceSchemeRole === "supporting").length,
    fromPresupposed: composedCQs.filter(cq => cq.sourceSchemeRole === "presupposed").length,
    fromImplicit: composedCQs.filter(cq => cq.sourceSchemeRole === "implicit").length,
    byAttackType: Object.fromEntries(
      Array.from(attackTypes).map(type => [
        type,
        composedCQs.filter(cq => cq.attackType === type).length
      ])
    )
  };
  
  return {
    argumentId: argument.id,
    totalCQs: composedCQs.length,
    byScheme,
    byAttackType,
    byTarget,
    stats
  };
}

function determineTargetRole(
  cq: any,
  sourceInstance: any
): "primary" | "supporting" | "presupposed" | "implicit" | undefined {
  // CQs from supporting schemes typically target primary
  if (sourceInstance.role === "supporting") {
    return "primary";
  }
  
  // CQs from primary scheme target the primary itself
  if (sourceInstance.role === "primary") {
    return "primary";
  }
  
  // Presupposed/implicit CQs can target any scheme
  // This would need more sophisticated logic based on CQ content
  return undefined;
}

export function filterComposedCQs(
  composedSet: ComposedCQSet,
  filters: {
    schemeInstanceIds?: string[];
    attackTypes?: string[];
    sourceRoles?: Array<"primary" | "supporting" | "presupposed" | "implicit">;
    targetRoles?: Array<"primary" | "supporting" | "presupposed" | "implicit">;
  }
): ComposedCriticalQuestion[] {
  let filtered = composedSet.byScheme.flatMap(group => group.cqs);
  
  if (filters.schemeInstanceIds?.length) {
    filtered = filtered.filter(cq =>
      filters.schemeInstanceIds!.includes(cq.sourceSchemeInstance.id)
    );
  }
  
  if (filters.attackTypes?.length) {
    filtered = filtered.filter(cq =>
      filters.attackTypes!.includes(cq.attackType)
    );
  }
  
  if (filters.sourceRoles?.length) {
    filtered = filtered.filter(cq =>
      filters.sourceRoles!.includes(cq.sourceSchemeRole)
    );
  }
  
  if (filters.targetRoles?.length) {
    filtered = filtered.filter(cq =>
      cq.targetsSchemeRole && filters.targetRoles!.includes(cq.targetsSchemeRole)
    );
  }
  
  return filtered;
}
```

#### Step 3: Update SchemeSpecificCQsModal (4 hours)

**File**: `components/arguments/SchemeSpecificCQsModal.tsx`

Major refactor to handle composed CQs:

```typescript
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MultiSchemeBadge } from "./MultiSchemeBadge";
import { CriticalQuestionCard } from "./CriticalQuestionCard";
import { composeCriticalQuestions, filterComposedCQs } from "@/lib/utils/compose-critical-questions";
import { Filter, Layers, Target, AlertCircle } from "lucide-react";
import type { ArgumentWithSchemes } from "@/lib/types/argument-net";
import type { ComposedCriticalQuestion } from "@/lib/types/composed-cqs";

interface SchemeSpecificCQsModalProps {
  argument: ArgumentWithSchemes;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SchemeSpecificCQsModal({
  argument,
  open,
  onOpenChange
}: SchemeSpecificCQsModalProps) {
  const [selectedTab, setSelectedTab] = useState<"byScheme" | "byAttack" | "byTarget">("byScheme");
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter state
  const [selectedSchemeIds, setSelectedSchemeIds] = useState<string[]>([]);
  const [selectedAttackTypes, setSelectedAttackTypes] = useState<string[]>([]);
  const [selectedSourceRoles, setSelectedSourceRoles] = useState<string[]>([]);
  
  // Compose CQs from all schemes
  const composedSet = useMemo(
    () => composeCriticalQuestions(argument),
    [argument]
  );
  
  // Apply filters
  const filteredCQs = useMemo(() => {
    if (
      selectedSchemeIds.length === 0 &&
      selectedAttackTypes.length === 0 &&
      selectedSourceRoles.length === 0
    ) {
      return composedSet.byScheme.flatMap(g => g.cqs);
    }
    
    return filterComposedCQs(composedSet, {
      schemeInstanceIds: selectedSchemeIds.length > 0 ? selectedSchemeIds : undefined,
      attackTypes: selectedAttackTypes.length > 0 ? selectedAttackTypes : undefined,
      sourceRoles: selectedSourceRoles.length > 0 
        ? selectedSourceRoles as any 
        : undefined
    });
  }, [composedSet, selectedSchemeIds, selectedAttackTypes, selectedSourceRoles]);
  
  const toggleSchemeFilter = (schemeId: string) => {
    setSelectedSchemeIds(prev =>
      prev.includes(schemeId)
        ? prev.filter(id => id !== schemeId)
        : [...prev, schemeId]
    );
  };
  
  const toggleAttackTypeFilter = (attackType: string) => {
    setSelectedAttackTypes(prev =>
      prev.includes(attackType)
        ? prev.filter(t => t !== attackType)
        : [...prev, attackType]
    );
  };
  
  const toggleSourceRoleFilter = (role: string) => {
    setSelectedSourceRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };
  
  const clearFilters = () => {
    setSelectedSchemeIds([]);
    setSelectedAttackTypes([]);
    setSelectedSourceRoles([]);
  };
  
  const hasActiveFilters = 
    selectedSchemeIds.length > 0 ||
    selectedAttackTypes.length > 0 ||
    selectedSourceRoles.length > 0;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                Critical Questions
                <Badge variant="secondary">
                  {composedSet.totalCQs} total
                </Badge>
                {hasActiveFilters && (
                  <Badge variant="outline">
                    {filteredCQs.length} filtered
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Composed from {argument.schemeInstances.length} argumentation scheme
                {argument.schemeInstances.length !== 1 ? "s" : ""}
              </DialogDescription>
            </div>
            
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </DialogHeader>
        
        {/* Filter Panel */}
        {showFilters && (
          <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Filter Critical Questions</h4>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              )}
            </div>
            
            {/* By Scheme */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">By Scheme</Label>
              <div className="space-y-2">
                {composedSet.byScheme.map(group => (
                  <div key={group.schemeInstanceId} className="flex items-center gap-2">
                    <Checkbox
                      id={`scheme-${group.schemeInstanceId}`}
                      checked={selectedSchemeIds.includes(group.schemeInstanceId)}
                      onCheckedChange={() => toggleSchemeFilter(group.schemeInstanceId)}
                    />
                    <Label
                      htmlFor={`scheme-${group.schemeInstanceId}`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span className="text-sm">{group.schemeName}</span>
                      <Badge variant="outline" className="text-xs">
                        {group.cqs.length} CQs
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            {/* By Attack Type */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">By Attack Type</Label>
              <div className="flex flex-wrap gap-2">
                {composedSet.byAttackType.map(group => (
                  <div key={group.attackType}>
                    <Checkbox
                      id={`attack-${group.attackType}`}
                      checked={selectedAttackTypes.includes(group.attackType)}
                      onCheckedChange={() => toggleAttackTypeFilter(group.attackType)}
                      className="sr-only"
                    />
                    <Label
                      htmlFor={`attack-${group.attackType}`}
                      className={`
                        inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs cursor-pointer
                        border transition-colors
                        ${selectedAttackTypes.includes(group.attackType)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted"
                        }
                      `}
                    >
                      {group.attackType}
                      <Badge variant="secondary" className="text-xs">
                        {group.cqs.length}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            {/* By Source Role */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">By Source Role</Label>
              <div className="grid grid-cols-2 gap-2">
                {["primary", "supporting", "presupposed", "implicit"].map(role => {
                  const count = composedSet.stats[`from${role.charAt(0).toUpperCase() + role.slice(1)}` as keyof typeof composedSet.stats] as number;
                  if (count === 0) return null;
                  
                  return (
                    <div key={role} className="flex items-center gap-2">
                      <Checkbox
                        id={`role-${role}`}
                        checked={selectedSourceRoles.includes(role)}
                        onCheckedChange={() => toggleSourceRoleFilter(role)}
                      />
                      <Label
                        htmlFor={`role-${role}`}
                        className="flex items-center gap-2 cursor-pointer capitalize"
                      >
                        <span className="text-sm">{role}</span>
                        <Badge variant="outline" className="text-xs">
                          {count}
                        </Badge>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {/* Tabs for different groupings */}
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="byScheme">
              <Layers className="w-4 h-4 mr-2" />
              By Scheme
            </TabsTrigger>
            <TabsTrigger value="byAttack">
              <Target className="w-4 h-4 mr-2" />
              By Attack Type
            </TabsTrigger>
            <TabsTrigger value="byTarget">
              <AlertCircle className="w-4 h-4 mr-2" />
              By Target
            </TabsTrigger>
          </TabsList>
          
          {/* By Scheme Tab */}
          <TabsContent value="byScheme" className="space-y-4">
            <Accordion type="multiple" defaultValue={composedSet.byScheme.map(g => g.schemeInstanceId)}>
              {composedSet.byScheme.map(group => {
                const visibleCQs = filteredCQs.filter(
                  cq => cq.sourceSchemeInstance.id === group.schemeInstanceId
                );
                
                if (hasActiveFilters && visibleCQs.length === 0) {
                  return null;
                }
                
                return (
                  <AccordionItem key={group.schemeInstanceId} value={group.schemeInstanceId}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className={
                              group.schemeRole === "primary"
                                ? "bg-blue-100 text-blue-800 border-blue-300"
                                : group.schemeRole === "supporting"
                                ? "bg-green-100 text-green-800 border-green-300"
                                : "bg-amber-100 text-amber-800 border-amber-300"
                            }
                          >
                            {group.schemeName}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {visibleCQs.length} / {group.cqs.length} CQs
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {visibleCQs.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No critical questions match current filters
                          </p>
                        ) : (
                          visibleCQs.map(cq => (
                            <CriticalQuestionCard
                              key={cq.id}
                              criticalQuestion={cq}
                              argumentId={argument.id}
                              showSchemeSource={false} // Already grouped by scheme
                              showAttackType={true}
                            />
                          ))
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </TabsContent>
          
          {/* By Attack Type Tab */}
          <TabsContent value="byAttack" className="space-y-4">
            <Accordion type="multiple" defaultValue={composedSet.byAttackType.map(g => g.attackType)}>
              {composedSet.byAttackType.map(group => {
                const visibleCQs = filteredCQs.filter(
                  cq => cq.attackType === group.attackType
                );
                
                if (hasActiveFilters && visibleCQs.length === 0) {
                  return null;
                }
                
                return (
                  <AccordionItem key={group.attackType} value={group.attackType}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{group.attackType}</span>
                        <Badge variant="secondary">
                          {visibleCQs.length} / {group.cqs.length} CQs
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {visibleCQs.map(cq => (
                          <CriticalQuestionCard
                            key={cq.id}
                            criticalQuestion={cq}
                            argumentId={argument.id}
                            showSchemeSource={true} // Show which scheme it's from
                            showAttackType={false} // Already grouped by attack type
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </TabsContent>
          
          {/* By Target Tab */}
          <TabsContent value="byTarget" className="space-y-4">
            <Accordion type="multiple" defaultValue={composedSet.byTarget.map(g => g.targetRole)}>
              {composedSet.byTarget.map(group => {
                const visibleCQs = filteredCQs.filter(
                  cq => cq.targetsSchemeRole === group.targetRole
                );
                
                if (hasActiveFilters && visibleCQs.length === 0) {
                  return null;
                }
                
                return (
                  <AccordionItem key={group.targetRole} value={group.targetRole}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-3">
                        <span className="font-medium capitalize">
                          Targets {group.targetRole} Scheme
                        </span>
                        <Badge variant="secondary">
                          {visibleCQs.length} / {group.cqs.length} CQs
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {visibleCQs.map(cq => (
                          <CriticalQuestionCard
                            key={cq.id}
                            criticalQuestion={cq}
                            argumentId={argument.id}
                            showSchemeSource={true}
                            showAttackType={true}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </TabsContent>
        </Tabs>
        
        {/* Summary footer */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{composedSet.stats.fromPrimary}</p>
              <p className="text-xs text-muted-foreground">From Primary</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{composedSet.stats.fromSupporting}</p>
              <p className="text-xs text-muted-foreground">From Supporting</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{composedSet.stats.fromPresupposed}</p>
              <p className="text-xs text-muted-foreground">From Presupposed</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{composedSet.totalCQs}</p>
              <p className="text-xs text-muted-foreground">Total CQs</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

#### Step 4: Update CriticalQuestionCard (1 hour)

**File**: `components/arguments/CriticalQuestionCard.tsx`

Add scheme source indicator:

```typescript
import { Badge } from "@/components/ui/badge";
import { MultiSchemeBadge } from "./MultiSchemeBadge";
import type { ComposedCriticalQuestion } from "@/lib/types/composed-cqs";

interface CriticalQuestionCardProps {
  criticalQuestion: ComposedCriticalQuestion;
  argumentId: string;
  showSchemeSource?: boolean;
  showAttackType?: boolean;
}

export function CriticalQuestionCard({
  criticalQuestion,
  argumentId,
  showSchemeSource = true,
  showAttackType = true
}: CriticalQuestionCardProps) {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      {/* Header with metadata */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          {/* Scheme source */}
          {showSchemeSource && (
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  criticalQuestion.sourceSchemeRole === "primary"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : criticalQuestion.sourceSchemeRole === "supporting"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }
              >
                {criticalQuestion.sourceSchemeName}
              </Badge>
              {criticalQuestion.isFromPrimaryScheme && (
                <Badge variant="secondary" className="text-xs">
                  Primary
                </Badge>
              )}
            </div>
          )}
          
          {/* Attack type */}
          {showAttackType && (
            <Badge variant="outline" className="text-xs">
              {criticalQuestion.attackType}
            </Badge>
          )}
        </div>
        
        {/* Target indicator */}
        {criticalQuestion.targetsSchemeRole && (
          <Badge variant="outline" className="text-xs">
            → {criticalQuestion.targetsSchemeRole}
          </Badge>
        )}
      </div>
      
      {/* Question text */}
      <p className="text-sm font-medium">{criticalQuestion.question}</p>
      
      {/* Existing attack/response UI */}
      {/* ... rest of existing component ... */}
    </div>
  );
}
```

#### Step 5: Performance Optimization (1 hour)

**File**: `lib/utils/compose-critical-questions.ts`

Add memoization for large CQ sets:

```typescript
import { useMemo } from "react";
import { memoize } from "lodash-es";

// Memoize composition for performance
export const composeCriticalQuestionsMemoized = memoize(
  composeCriticalQuestions,
  (argument) => `${argument.id}-${argument.schemeInstances.map(si => si.id).join("-")}`
);

// Hook for easy use in components
export function useComposedCriticalQuestions(argument: ArgumentWithSchemes) {
  return useMemo(
    () => composeCriticalQuestionsMemoized(argument),
    [argument]
  );
}

// Virtualization for large lists (if needed)
export function getVisibleCQRange(
  totalCQs: number,
  scrollTop: number,
  containerHeight: number,
  itemHeight: number = 100
): { start: number; end: number } {
  const start = Math.floor(scrollTop / itemHeight);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(start + visibleCount + 5, totalCQs); // +5 for buffer
  
  return { start: Math.max(0, start - 5), end };
}
```

#### Step 6: Testing (2 hours)

**File**: `__tests__/lib/utils/compose-critical-questions.test.ts`

```typescript
import { composeCriticalQuestions, filterComposedCQs } from "@/lib/utils/compose-critical-questions";
import type { ArgumentWithSchemes } from "@/lib/types/argument-net";

describe("composeCriticalQuestions", () => {
  const mockArgument: ArgumentWithSchemes = {
    id: "arg1",
    schemeInstances: [
      {
        id: "inst1",
        role: "primary",
        order: 0,
        scheme: {
          name: "Expert Opinion",
          criticalQuestions: [
            { id: "cq1", question: "Is the expert credible?", attackType: "undermining" },
            { id: "cq2", question: "Is the expert biased?", attackType: "rebutting" }
          ]
        }
      },
      {
        id: "inst2",
        role: "supporting",
        order: 1,
        scheme: {
          name: "Argument from Values",
          criticalQuestions: [
            { id: "cq3", question: "Is the value appropriate?", attackType: "undermining" }
          ]
        }
      }
    ],
    dependencies: []
  };
  
  it("composes CQs from all schemes", () => {
    const composed = composeCriticalQuestions(mockArgument);
    
    expect(composed.totalCQs).toBe(3);
    expect(composed.byScheme).toHaveLength(2);
  });
  
  it("prioritizes primary scheme CQs", () => {
    const composed = composeCriticalQuestions(mockArgument);
    
    const firstSchemeGroup = composed.byScheme[0];
    expect(firstSchemeGroup.schemeRole).toBe("primary");
  });
  
  it("calculates correct statistics", () => {
    const composed = composeCriticalQuestions(mockArgument);
    
    expect(composed.stats.fromPrimary).toBe(2);
    expect(composed.stats.fromSupporting).toBe(1);
    expect(composed.stats.byAttackType.undermining).toBe(2);
    expect(composed.stats.byAttackType.rebutting).toBe(1);
  });
  
  it("filters by scheme instance", () => {
    const composed = composeCriticalQuestions(mockArgument);
    const filtered = filterComposedCQs(composed, {
      schemeInstanceIds: ["inst1"]
    });
    
    expect(filtered).toHaveLength(2);
    expect(filtered.every(cq => cq.sourceSchemeInstance.id === "inst1")).toBe(true);
  });
  
  it("filters by attack type", () => {
    const composed = composeCriticalQuestions(mockArgument);
    const filtered = filterComposedCQs(composed, {
      attackTypes: ["undermining"]
    });
    
    expect(filtered).toHaveLength(2);
    expect(filtered.every(cq => cq.attackType === "undermining")).toBe(true);
  });
});
```

**File**: `__tests__/components/arguments/SchemeSpecificCQsModal.test.tsx`

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SchemeSpecificCQsModal } from "@/components/arguments/SchemeSpecificCQsModal";

describe("SchemeSpecificCQsModal", () => {
  const mockArgument = {
    id: "arg1",
    schemeInstances: [
      {
        id: "inst1",
        role: "primary",
        order: 0,
        scheme: {
          name: "Expert Opinion",
          criticalQuestions: [
            { id: "cq1", question: "Is the expert credible?", attackType: "undermining" }
          ]
        }
      },
      {
        id: "inst2",
        role: "supporting",
        order: 1,
        scheme: {
          name: "Values",
          criticalQuestions: [
            { id: "cq2", question: "Is the value appropriate?", attackType: "undermining" }
          ]
        }
      }
    ],
    dependencies: []
  };
  
  it("displays total CQ count", () => {
    render(
      <SchemeSpecificCQsModal
        argument={mockArgument}
        open={true}
        onOpenChange={() => {}}
      />
    );
    
    expect(screen.getByText("2 total")).toBeInTheDocument();
  });
  
  it("groups CQs by scheme", () => {
    render(
      <SchemeSpecificCQsModal
        argument={mockArgument}
        open={true}
        onOpenChange={() => {}}
      />
    );
    
    expect(screen.getByText("Expert Opinion")).toBeInTheDocument();
    expect(screen.getByText("Values")).toBeInTheDocument();
  });
  
  it("filters CQs when scheme selected", async () => {
    const user = userEvent.setup();
    
    render(
      <SchemeSpecificCQsModal
        argument={mockArgument}
        open={true}
        onOpenChange={() => {}}
      />
    );
    
    // Open filters
    await user.click(screen.getByText("Filters"));
    
    // Select one scheme
    const checkbox = screen.getByRole("checkbox", { name: /Expert Opinion/i });
    await user.click(checkbox);
    
    // Should show filtered count
    await waitFor(() => {
      expect(screen.getByText("1 filtered")).toBeInTheDocument();
    });
  });
});
```

---

## Phase 1.5 Acceptance Criteria

**Functionality**:
- [ ] Modal displays composed CQ set from all schemes
- [ ] CQs grouped by scheme with accordion UI
- [ ] CQs grouped by attack type
- [ ] CQs grouped by target role
- [ ] Filters work for scheme/attack/role
- [ ] Clear filters button resets all
- [ ] Statistics shown in footer
- [ ] Scheme source badges visible
- [ ] Performance acceptable with 50+ CQs

**Visual**:
- [ ] Tabbed interface is intuitive
- [ ] Filtering UI is discoverable
- [ ] Scheme badges use consistent colors
- [ ] Accordion states clear
- [ ] Statistics footer readable

**UX**:
- [ ] Tabs switch smoothly
- [ ] Filters provide immediate feedback
- [ ] No lag with large CQ sets
- [ ] Mobile responsive

**Testing**:
- [ ] Unit tests for composition logic
- [ ] Unit tests for filtering
- [ ] Component tests for modal
- [ ] Integration tests for full flow

---

## Phase 1.5 Deployment Strategy

### Stage 1: Internal Testing (Days 16-17)

Test scenarios:
1. Argument with 2 schemes, 10 CQs total
2. Argument with 4 schemes, 30+ CQs total
3. Filter by single scheme
4. Filter by multiple attack types
5. Switch between tabs
6. Clear filters and verify reset

### Stage 2: Beta Testing (Day 18)

Metrics to track:
- Most common tab used (by scheme vs by attack vs by target)
- Filter usage rate
- Average time in modal
- Click-through rate on individual CQs

### Stage 3: Production (Day 19)

Rollout plan:
1. Enable for arguments with 2 schemes (4 hours)
2. Enable for all multi-scheme arguments (8 hours)
3. Enable for single-scheme arguments (use new UI for consistency) (12 hours)

**Monitor**:
- Modal load time (target: <500ms for 50 CQs)
- Filter interaction rate
- Tab usage distribution
- Error rates

---

## Phase 1.5 Complete Deliverables

✅ **Data Structures**:
- ComposedCriticalQuestion type with source metadata
- ComposedCQSet with multiple groupings
- Statistics calculation

✅ **Logic**:
- composeCriticalQuestions() with ordering
- filterComposedCQs() with multiple criteria
- Performance optimization with memoization

✅ **UI Components**:
- Refactored SchemeSpecificCQsModal with tabs
- Filter panel with checkboxes
- CriticalQuestionCard with scheme badges
- Statistics footer

✅ **Testing**:
- Composition logic tests
- Filtering tests
- Component integration tests

---

**What Users Experience After Phase 1.5**:

🔍 **Before**: Single scheme's CQs shown  
🔍 **After**: All CQs from all schemes, organized and filterable

🎯 **Value**: Users can see complete attack surface and understand how schemes interact

📊 **Metrics**:
- Average CQs per multi-scheme argument (target: 15-25)
- Filter usage rate (target: 30%+)
- Tab distribution (expect 60% "by scheme", 25% "by attack", 15% "by target")

---

*End of Phase 1.5. Ready for Phase 1.6 (Testing & Deployment) when you're ready.*

---

## Phase 1.6: Testing & Deployment
**Effort**: 12-16 hours | **Priority**: 🔴 Critical | **Risk**: High

### Context

Phase 1 (Multi-Scheme Arguments) is complete from an implementation perspective. Now we need comprehensive testing, deployment infrastructure, monitoring, and rollout strategy to ensure a smooth launch.

### Goals

1. Complete test coverage (unit, integration, E2E)
2. Performance benchmarking and optimization
3. Feature flag infrastructure
4. Gradual rollout strategy
5. Monitoring and alerting
6. Rollback plan
7. User documentation

### Implementation

#### Step 1: Comprehensive Test Suite (4 hours)

**File**: `__tests__/features/multi-scheme-arguments.e2e.test.ts` (NEW)

```typescript
import { test, expect } from "@playwright/test";
import { prisma } from "@/lib/prisma";

test.describe("Multi-Scheme Arguments E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto("/login");
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "password");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");
  });
  
  test("User can create multi-scheme argument", async ({ page }) => {
    // Navigate to deliberation
    await page.goto("/deliberation/test-delib-id");
    
    // Create a claim
    await page.click('button:has-text("Add Claim")');
    await page.fill('[name="claimText"]', "Climate action is urgent");
    await page.click('button:has-text("Submit")');
    
    // Add an argument
    await page.click('button:has-text("Add Argument")');
    await page.fill('[name="content"]', "97% of climate scientists agree");
    
    // Select primary scheme
    await page.click('[data-testid="scheme-selector"]');
    await page.fill('[placeholder="Search schemes..."]', "Expert Opinion");
    await page.click('text=Argument from Expert Opinion');
    
    await page.click('button:has-text("Submit Argument")');
    
    // Verify argument created
    await expect(page.locator('text=97% of climate scientists agree')).toBeVisible();
    await expect(page.locator('text=Expert Opinion')).toBeVisible();
    
    // Add supporting scheme
    await page.hover('text=97% of climate scientists agree');
    await page.click('button[aria-label="Manage schemes"]');
    await page.click('button:has-text("Add Scheme")');
    
    // Select supporting scheme
    await page.click('[data-testid="scheme-selector"]');
    await page.fill('[placeholder="Search schemes..."]', "Consequences");
    await page.click('text=Argument from Consequences');
    
    // Set role to supporting
    await page.click('input[value="supporting"]');
    await page.click('button:has-text("Add Scheme")');
    
    // Verify multi-scheme badge
    await expect(page.locator('text=Multi-Scheme')).toBeVisible();
    await expect(page.locator('text=2 schemes')).toBeVisible();
  });
  
  test("Critical questions composed from all schemes", async ({ page }) => {
    // Navigate to argument with multiple schemes
    await page.goto("/deliberation/test-delib-id/argument/multi-scheme-arg-id");
    
    // Open CQ modal
    await page.click('button:has-text("Critical Questions")');
    
    // Verify composed count
    await expect(page.locator('text=/\\d+ total/')).toBeVisible();
    
    // Verify tabs present
    await expect(page.locator('text=By Scheme')).toBeVisible();
    await expect(page.locator('text=By Attack Type')).toBeVisible();
    await expect(page.locator('text=By Target')).toBeVisible();
    
    // Switch to "By Attack Type" tab
    await page.click('text=By Attack Type');
    
    // Verify attack type groupings
    await expect(page.locator('text=undermining')).toBeVisible();
    
    // Test filtering
    await page.click('button:has-text("Filters")');
    await page.click('text=Expert Opinion');
    
    // Verify filtered count
    await expect(page.locator('text=/\\d+ filtered/')).toBeVisible();
  });
  
  test("User can reorder schemes via drag-drop", async ({ page }) => {
    await page.goto("/deliberation/test-delib-id/argument/multi-scheme-arg-id");
    
    // Open scheme management
    await page.click('button:has-text("Manage Schemes")');
    await page.click('button:has-text("Reorder")');
    
    // Drag second scheme to first position
    const secondScheme = page.locator('[data-testid="scheme-item"]').nth(1);
    const firstScheme = page.locator('[data-testid="scheme-item"]').nth(0);
    
    await secondScheme.dragTo(firstScheme);
    
    // Save order
    await page.click('button:has-text("Save Order")');
    
    // Verify toast notification
    await expect(page.locator('text=Order saved')).toBeVisible();
  });
  
  test("Cannot create argument without primary scheme", async ({ page }) => {
    await page.goto("/deliberation/test-delib-id");
    
    await page.click('button:has-text("Add Argument")');
    await page.fill('[name="content"]', "Test argument");
    
    // Try to submit without scheme
    await page.click('button:has-text("Submit Argument")');
    
    // Verify error message
    await expect(page.locator('text=/primary scheme.*required/i')).toBeVisible();
  });
  
  test("Cannot add duplicate scheme", async ({ page }) => {
    await page.goto("/deliberation/test-delib-id/argument/single-scheme-arg-id");
    
    await page.click('button:has-text("Manage Schemes")');
    await page.click('button:has-text("Add Scheme")');
    
    // Try to add the same scheme already in use
    await page.click('[data-testid="scheme-selector"]');
    await page.click('text=Expert Opinion'); // Already the primary
    
    // Should be disabled or show error
    await page.click('button:has-text("Add Scheme")');
    await expect(page.locator('text=/already in use/i')).toBeVisible();
  });
});
```

**File**: `__tests__/integration/multi-scheme-api.test.ts` (NEW)

```typescript
import { POST, GET, PATCH, DELETE } from "@/app/api/arguments/[id]/schemes/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

jest.mock("next-auth");
jest.mock("@/lib/prisma", () => ({
  prisma: {
    argument: {
      findUnique: jest.fn(),
    },
    argumentSchemeInstance: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe("Multi-Scheme API Integration", () => {
  beforeEach(() => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user1", email: "test@example.com" },
    });
  });
  
  describe("POST /api/arguments/[id]/schemes", () => {
    it("adds scheme to argument", async () => {
      const mockArgument = {
        id: "arg1",
        schemeInstances: [],
        claim: { deliberationId: "delib1" },
      };
      
      (prisma.argument.findUnique as jest.Mock).mockResolvedValue(mockArgument);
      (prisma.argumentSchemeInstance.create as jest.Mock).mockResolvedValue({
        id: "inst1",
        argumentId: "arg1",
        schemeId: "scheme1",
        role: "primary",
        explicitness: "explicit",
        order: 0,
      });
      
      const req = new Request("http://localhost/api/arguments/arg1/schemes", {
        method: "POST",
        body: JSON.stringify({
          schemeId: "scheme1",
          role: "primary",
          explicitness: "explicit",
        }),
      });
      
      const response = await POST(req, { params: { id: "arg1" } });
      
      expect(response.status).toBe(200);
      expect(prisma.argumentSchemeInstance.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          argumentId: "arg1",
          schemeId: "scheme1",
          role: "primary",
          explicitness: "explicit",
          order: 0,
        }),
        include: { scheme: true },
      });
    });
    
    it("rejects duplicate primary scheme", async () => {
      const mockArgument = {
        id: "arg1",
        schemeInstances: [{ id: "inst1", role: "primary" }],
        claim: { deliberationId: "delib1" },
      };
      
      (prisma.argument.findUnique as jest.Mock).mockResolvedValue(mockArgument);
      
      const req = new Request("http://localhost/api/arguments/arg1/schemes", {
        method: "POST",
        body: JSON.stringify({
          schemeId: "scheme2",
          role: "primary",
          explicitness: "explicit",
        }),
      });
      
      const response = await POST(req, { params: { id: "arg1" } });
      
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toMatch(/already has a primary scheme/i);
    });
  });
  
  describe("DELETE /api/arguments/[id]/schemes/[instanceId]", () => {
    it("removes scheme instance", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: "user1" },
      });
      
      (prisma.argumentSchemeInstance.delete as jest.Mock).mockResolvedValue({
        id: "inst1",
      });
      
      const req = new Request("http://localhost/api/arguments/arg1/schemes/inst1", {
        method: "DELETE",
      });
      
      const response = await DELETE(req, {
        params: { id: "arg1", instanceId: "inst1" },
      });
      
      expect(response.status).toBe(200);
      expect(prisma.argumentSchemeInstance.delete).toHaveBeenCalledWith({
        where: { id: "inst1" },
      });
    });
  });
});
```

#### Step 2: Performance Benchmarking (2 hours)

**File**: `__tests__/performance/multi-scheme.bench.ts` (NEW)

```typescript
import { performance } from "perf_hooks";
import { composeCriticalQuestions } from "@/lib/utils/compose-critical-questions";
import type { ArgumentWithSchemes } from "@/lib/types/argument-net";

describe("Multi-Scheme Performance", () => {
  function generateMockArgument(schemeCount: number, cqsPerScheme: number): ArgumentWithSchemes {
    const schemeInstances = Array.from({ length: schemeCount }, (_, i) => ({
      id: `inst${i}`,
      argumentId: "arg1",
      schemeId: `scheme${i}`,
      role: i === 0 ? "primary" as const : "supporting" as const,
      explicitness: "explicit" as const,
      order: i,
      createdAt: new Date(),
      updatedAt: new Date(),
      scheme: {
        id: `scheme${i}`,
        name: `Scheme ${i}`,
        description: `Test scheme ${i}`,
        criticalQuestions: Array.from({ length: cqsPerScheme }, (_, j) => ({
          id: `cq${i}-${j}`,
          schemeId: `scheme${i}`,
          question: `Question ${j} for scheme ${i}?`,
          attackType: j % 2 === 0 ? "undermining" : "rebutting",
          order: j,
        })),
      },
    }));
    
    return {
      id: "arg1",
      claimId: "claim1",
      content: "Test argument",
      schemeInstances,
      dependencies: [],
    } as any;
  }
  
  it("composes CQs for small argument (2 schemes, 5 CQs each) in <10ms", () => {
    const arg = generateMockArgument(2, 5);
    
    const start = performance.now();
    const composed = composeCriticalQuestions(arg);
    const end = performance.now();
    
    expect(end - start).toBeLessThan(10);
    expect(composed.totalCQs).toBe(10);
  });
  
  it("composes CQs for medium argument (4 schemes, 10 CQs each) in <50ms", () => {
    const arg = generateMockArgument(4, 10);
    
    const start = performance.now();
    const composed = composeCriticalQuestions(arg);
    const end = performance.now();
    
    expect(end - start).toBeLessThan(50);
    expect(composed.totalCQs).toBe(40);
  });
  
  it("composes CQs for large argument (6 schemes, 15 CQs each) in <100ms", () => {
    const arg = generateMockArgument(6, 15);
    
    const start = performance.now();
    const composed = composeCriticalQuestions(arg);
    const end = performance.now();
    
    expect(end - start).toBeLessThan(100);
    expect(composed.totalCQs).toBe(90);
  });
  
  it("filters composed CQs in <5ms", () => {
    const arg = generateMockArgument(4, 10);
    const composed = composeCriticalQuestions(arg);
    
    const start = performance.now();
    const filtered = composed.byScheme.flatMap(g => g.cqs).filter(
      cq => cq.attackType === "undermining"
    );
    const end = performance.now();
    
    expect(end - start).toBeLessThan(5);
    expect(filtered.length).toBeGreaterThan(0);
  });
});
```

#### Step 3: Feature Flag Infrastructure (2 hours)

**File**: `lib/feature-flags.ts` (NEW)

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type FeatureFlag = 
  | "MULTI_SCHEME_ARGUMENTS"
  | "MULTI_SCHEME_EDITING"
  | "COMPOSED_CQS";

interface FeatureFlagConfig {
  enabled: boolean;
  rolloutPercentage?: number; // 0-100
  allowedUserIds?: string[];
  allowedRoles?: string[];
  requiresAuth?: boolean;
}

const featureFlags: Record<FeatureFlag, FeatureFlagConfig> = {
  MULTI_SCHEME_ARGUMENTS: {
    enabled: process.env.ENABLE_MULTI_SCHEME_ARGUMENTS === "true",
    rolloutPercentage: parseInt(process.env.MULTI_SCHEME_ROLLOUT_PERCENT || "0"),
    allowedRoles: ["admin", "moderator"],
    requiresAuth: true,
  },
  MULTI_SCHEME_EDITING: {
    enabled: process.env.ENABLE_MULTI_SCHEME_EDITING === "true",
    rolloutPercentage: parseInt(process.env.MULTI_SCHEME_EDITING_ROLLOUT_PERCENT || "0"),
    allowedRoles: ["admin", "moderator"],
    requiresAuth: true,
  },
  COMPOSED_CQS: {
    enabled: process.env.ENABLE_COMPOSED_CQS === "true",
    rolloutPercentage: parseInt(process.env.COMPOSED_CQS_ROLLOUT_PERCENT || "0"),
    allowedRoles: ["admin"],
    requiresAuth: true,
  },
};

export async function isFeatureEnabled(
  flag: FeatureFlag,
  userId?: string
): Promise<boolean> {
  const config = featureFlags[flag];
  
  // Feature disabled globally
  if (!config.enabled) {
    return false;
  }
  
  // Requires auth but no user provided
  if (config.requiresAuth && !userId) {
    return false;
  }
  
  // Check if user is in allowed list
  if (config.allowedUserIds && userId) {
    if (config.allowedUserIds.includes(userId)) {
      return true;
    }
  }
  
  // Check user role
  if (config.allowedRoles && userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    
    if (user && config.allowedRoles.includes(user.role)) {
      return true;
    }
  }
  
  // Rollout percentage (deterministic per user)
  if (config.rolloutPercentage && config.rolloutPercentage > 0 && userId) {
    const hash = hashUserId(userId);
    const bucket = hash % 100;
    return bucket < config.rolloutPercentage;
  }
  
  return false;
}

export async function getFeatureFlagsForUser(userId?: string): Promise<Record<FeatureFlag, boolean>> {
  const flags = {} as Record<FeatureFlag, boolean>;
  
  for (const flag of Object.keys(featureFlags) as FeatureFlag[]) {
    flags[flag] = await isFeatureEnabled(flag, userId);
  }
  
  return flags;
}

// Simple hash function for deterministic rollout
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Client-side hook
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const [enabled, setEnabled] = useState(false);
  
  useEffect(() => {
    fetch(`/api/feature-flags/${flag}`)
      .then(r => r.json())
      .then(data => setEnabled(data.enabled))
      .catch(() => setEnabled(false));
  }, [flag]);
  
  return enabled;
}
```

**File**: `app/api/feature-flags/[flag]/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isFeatureEnabled, type FeatureFlag } from "@/lib/feature-flags";

export async function GET(
  req: NextRequest,
  { params }: { params: { flag: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    const enabled = await isFeatureEnabled(params.flag as FeatureFlag, userId);
    
    return NextResponse.json({ enabled });
  } catch (error) {
    return NextResponse.json({ enabled: false });
  }
}
```

#### Step 4: Monitoring & Alerting (2 hours)

**File**: `lib/analytics/multi-scheme-events.ts` (NEW)

```typescript
import { analytics } from "@/lib/analytics";

export function trackMultiSchemeEvent(
  eventName: string,
  properties: Record<string, any>
) {
  analytics.track(eventName, {
    ...properties,
    feature: "multi-scheme-arguments",
    timestamp: new Date().toISOString(),
  });
}

// Specific tracking functions

export function trackSchemeAdded(data: {
  argumentId: string;
  schemeId: string;
  role: string;
  explicitness: string;
  previousSchemeCount: number;
}) {
  trackMultiSchemeEvent("Scheme Added", data);
}

export function trackSchemeRemoved(data: {
  argumentId: string;
  schemeId: string;
  role: string;
  remainingSchemeCount: number;
}) {
  trackMultiSchemeEvent("Scheme Removed", data);
}

export function trackSchemesReordered(data: {
  argumentId: string;
  schemeCount: number;
}) {
  trackMultiSchemeEvent("Schemes Reordered", data);
}

export function trackComposedCQsViewed(data: {
  argumentId: string;
  totalCQs: number;
  schemeCount: number;
  viewMode: "byScheme" | "byAttack" | "byTarget";
}) {
  trackMultiSchemeEvent("Composed CQs Viewed", data);
}

export function trackCQFilterApplied(data: {
  argumentId: string;
  filterType: "scheme" | "attackType" | "sourceRole";
  filterValue: string;
  resultCount: number;
}) {
  trackMultiSchemeEvent("CQ Filter Applied", data);
}

export function trackMultiSchemeArgumentCreated(data: {
  argumentId: string;
  schemeCount: number;
  primaryScheme: string;
  supportingSchemes: string[];
}) {
  trackMultiSchemeEvent("Multi-Scheme Argument Created", data);
}
```

**File**: `lib/monitoring/multi-scheme-metrics.ts` (NEW)

```typescript
import { prisma } from "@/lib/prisma";

export async function getMultiSchemeMetrics() {
  const [
    totalArguments,
    multiSchemeArguments,
    averageSchemesPerArgument,
    mostCommonSchemeCount,
    argumentsBySchemeCount,
  ] = await Promise.all([
    // Total arguments
    prisma.argument.count(),
    
    // Arguments with 2+ schemes
    prisma.argument.count({
      where: {
        schemeInstances: {
          some: {
            id: { not: undefined },
          },
        },
      },
    }),
    
    // Average schemes per argument
    prisma.argumentSchemeInstance.groupBy({
      by: ["argumentId"],
      _count: true,
    }).then(results => {
      const avg = results.reduce((sum, r) => sum + r._count, 0) / results.length;
      return Math.round(avg * 100) / 100;
    }),
    
    // Most common scheme count
    prisma.argumentSchemeInstance.groupBy({
      by: ["argumentId"],
      _count: true,
    }).then(results => {
      const counts = results.map(r => r._count);
      const mode = counts.sort((a, b) =>
        counts.filter(v => v === a).length - counts.filter(v => v === b).length
      ).pop();
      return mode || 1;
    }),
    
    // Distribution of arguments by scheme count
    prisma.argumentSchemeInstance.groupBy({
      by: ["argumentId"],
      _count: true,
    }).then(results => {
      const distribution: Record<number, number> = {};
      results.forEach(r => {
        distribution[r._count] = (distribution[r._count] || 0) + 1;
      });
      return distribution;
    }),
  ]);
  
  return {
    totalArguments,
    multiSchemeArguments,
    multiSchemePercentage: Math.round((multiSchemeArguments / totalArguments) * 100),
    averageSchemesPerArgument,
    mostCommonSchemeCount,
    argumentsBySchemeCount,
  };
}

export async function getSchemeUsageStats() {
  const schemeUsage = await prisma.argumentSchemeInstance.groupBy({
    by: ["schemeId", "role"],
    _count: true,
  });
  
  const schemes = await prisma.argumentationScheme.findMany({
    where: {
      id: {
        in: schemeUsage.map(s => s.schemeId),
      },
    },
    select: {
      id: true,
      name: true,
    },
  });
  
  return schemeUsage.map(usage => ({
    schemeId: usage.schemeId,
    schemeName: schemes.find(s => s.id === usage.schemeId)?.name || "Unknown",
    role: usage.role,
    count: usage._count,
  }));
}
```

#### Step 5: Rollback Plan (1 hour)

**File**: `scripts/rollback-multi-scheme.ts` (NEW)

```typescript
import { prisma } from "@/lib/prisma";

/**
 * Rollback script for multi-scheme arguments feature.
 * 
 * This script:
 * 1. Migrates data back to single-scheme model
 * 2. Keeps only primary scheme for each argument
 * 3. Preserves data in backup tables
 * 
 * Usage: tsx scripts/rollback-multi-scheme.ts [--dry-run]
 */

async function rollbackMultiScheme(dryRun = false) {
  console.log("Starting multi-scheme rollback...");
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);
  
  // Step 1: Backup current state
  if (!dryRun) {
    console.log("\n1. Creating backup...");
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ArgumentSchemeInstance_Backup_${Date.now()}" AS
      SELECT * FROM "ArgumentSchemeInstance";
    `;
    console.log("✓ Backup created");
  }
  
  // Step 2: Find arguments with multiple schemes
  console.log("\n2. Finding multi-scheme arguments...");
  const multiSchemeArgs = await prisma.argument.findMany({
    where: {
      schemeInstances: {
        some: {},
      },
    },
    include: {
      schemeInstances: {
        include: { scheme: true },
        orderBy: { order: "asc" },
      },
    },
  });
  
  console.log(`Found ${multiSchemeArgs.length} arguments with schemes`);
  
  // Step 3: Migrate to single scheme (keep primary)
  console.log("\n3. Migrating to single scheme...");
  let migratedCount = 0;
  let errors = 0;
  
  for (const arg of multiSchemeArgs) {
    const primaryScheme = arg.schemeInstances.find(si => si.role === "primary");
    
    if (!primaryScheme) {
      console.warn(`⚠ Argument ${arg.id} has no primary scheme, using first scheme`);
      const firstScheme = arg.schemeInstances[0];
      
      if (!dryRun && firstScheme) {
        try {
          await prisma.argument.update({
            where: { id: arg.id },
            data: { schemeId: firstScheme.schemeId },
          });
          migratedCount++;
        } catch (error) {
          console.error(`✗ Error migrating ${arg.id}:`, error);
          errors++;
        }
      }
    } else {
      if (!dryRun) {
        try {
          await prisma.argument.update({
            where: { id: arg.id },
            data: { schemeId: primaryScheme.schemeId },
          });
          migratedCount++;
        } catch (error) {
          console.error(`✗ Error migrating ${arg.id}:`, error);
          errors++;
        }
      } else {
        console.log(`Would migrate ${arg.id} to scheme ${primaryScheme.scheme?.name}`);
      }
    }
  }
  
  console.log(`\n✓ Migrated ${migratedCount} arguments`);
  if (errors > 0) {
    console.error(`✗ ${errors} errors occurred`);
  }
  
  // Step 4: Archive scheme instances (don't delete)
  if (!dryRun) {
    console.log("\n4. Archiving scheme instances...");
    const archived = await prisma.argumentSchemeInstance.updateMany({
      data: {
        // Add archived flag if schema supports it
        // Otherwise they remain but are ignored
      },
    });
    console.log(`✓ Archived ${archived.count} scheme instances`);
  }
  
  console.log("\n✓ Rollback complete");
  console.log("\nNote: Scheme instances are preserved in backup table");
  console.log("To restore, run: restore-multi-scheme.ts");
}

// Run
const dryRun = process.argv.includes("--dry-run");
rollbackMultiScheme(dryRun)
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Rollback failed:", error);
    process.exit(1);
  });
```

#### Step 6: User Documentation (1 hour)

**File**: `docs/user-guide/multi-scheme-arguments.md` (NEW)

```markdown
# Multi-Scheme Arguments User Guide

## What are Multi-Scheme Arguments?

In real-world reasoning, arguments rarely follow a single pattern. Multi-scheme arguments reflect how we naturally combine different types of reasoning:

**Example**: Arguing for climate policy
- **Primary**: Practical reasoning (we should take action)
- **Supporting**: Argument from consequences (to avoid disaster)
- **Supporting**: Argument from expert opinion (scientists agree)
- **Presupposed**: Argument from values (we value future generations)

## Creating Multi-Scheme Arguments

### Basic Workflow

1. **Create your argument** with a primary scheme
   - Every argument must have exactly one primary scheme
   - This is the main inferential pattern

2. **Add supporting schemes** to strengthen your argument
   - Click "Manage Schemes" on your argument
   - Click "Add Scheme"
   - Select scheme, set role, and provide evidence

3. **View composed critical questions**
   - Click "Critical Questions" to see all CQs from all schemes
   - Filter by scheme, attack type, or source role

### Scheme Roles Explained

**Primary** (Required, exactly one)
- The main pattern of inference
- Example: "Practical Reasoning" for a policy recommendation

**Supporting**
- Enables or justifies premises of the primary scheme
- Example: "Expert Opinion" supporting a factual claim

**Presupposed**
- Background assumptions necessary for the argument
- Example: "Argument from Values" underlying a policy debate

**Implicit**
- Recoverable from context or common knowledge
- Example: Unstated causal connections

### Explicitness Levels

**Explicit** (Solid border)
- Clearly stated in the argument text
- Provide text evidence to highlight where it appears

**Presupposed** (Dashed border)
- Necessary but unstated
- Provide justification for why it's presupposed

**Implied** (Dotted border)
- Recoverable from context
- Provide justification for the reconstruction

## Best Practices

### When to Use Multiple Schemes

✅ **Good use cases**:
- Complex policy arguments with multiple premises
- Arguments combining factual and normative reasoning
- Arguments with implicit background assumptions

❌ **Avoid**:
- Adding schemes just to inflate CQ count
- Redundant schemes that don't add new dimensions
- Mixing schemes that target unrelated conclusions

### Composing CQs

When you add multiple schemes, their critical questions are **composed**:

- **By Scheme**: See which CQs come from which scheme
- **By Attack Type**: See all undermining, rebutting, etc.
- **By Target**: See which CQs target which scheme

Use filters to focus on specific aspects of the attack surface.

### Reordering Schemes

The order of schemes affects display:
1. Primary scheme always appears first
2. Supporting schemes follow
3. Implicit/presupposed schemes last

Reorder schemes to reflect argumentative priority.

## Examples

### Example 1: Policy Argument

**Claim**: "We should implement a carbon tax"

**Schemes**:
- **Primary**: Practical Reasoning
  - Major premise: Carbon tax reduces emissions
  - Minor premise: We should reduce emissions
  - Conclusion: We should implement carbon tax

- **Supporting**: Argument from Expert Opinion
  - Supports: "Carbon tax reduces emissions"
  - Evidence: "97% of economists agree..."

- **Supporting**: Argument from Consequences
  - Supports: "We should reduce emissions"
  - Evidence: "Climate change will cause..."

- **Presupposed**: Argument from Values
  - Supports: Implicit value judgment
  - Justification: "Assumes we value environmental sustainability"

**Composed CQs**: 23 total
- 8 from Practical Reasoning
- 6 from Expert Opinion
- 5 from Consequences
- 4 from Values

### Example 2: Factual Claim

**Claim**: "Vitamin D deficiency causes depression"

**Schemes**:
- **Primary**: Argument from Correlation to Cause
  - Studies show correlation between deficiency and depression

- **Supporting**: Argument from Expert Opinion
  - Supports the causal interpretation
  - Psychiatrists support this link

- **Implicit**: Argument from Sign
  - Justification: "Assumes biological mechanisms (not explicit in text)"

## Troubleshooting

**Q: Why can't I add a second primary scheme?**
A: Arguments can have only one primary scheme by design. To change the primary, first edit the existing primary to a supporting role, then promote the new one.

**Q: Why are so many schemes presupposed or implicit?**
A: Good argument reconstruction often reveals unstated reasoning. Be judicious and provide clear justification for each.

**Q: How do I know which schemes to use?**
A: Start with the primary (what's the main inference?), then ask what enables each premise. The system will suggest common patterns.

## FAQ

**Q: Do multi-scheme arguments have higher burden of proof?**
A: No, burden is set at the claim level. However, each scheme's CQs must be addressed.

**Q: Can I use the same scheme twice?**
A: No, schemes cannot be duplicated within an argument.

**Q: What happens to my CQ responses if I remove a scheme?**
A: CQ responses are preserved but archived. If you re-add the scheme, they can be restored.
```

---

## Phase 1.6 Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (unit, integration, E2E)
- [ ] Performance benchmarks meet targets (<100ms for 90 CQs)
- [ ] Feature flags configured in environment
- [ ] Monitoring dashboards created
- [ ] Rollback script tested in staging
- [ ] User documentation published
- [ ] Team training completed

### Deployment Stages

**Stage 1: Internal Testing (Days 20-21)**
- [ ] Deploy to dev with flags enabled for admins only
- [ ] Manual testing of all flows
- [ ] Performance testing with production-like data
- [ ] Bug fixes if needed

**Stage 2: Closed Beta (Days 22-24)**
- [ ] Enable for 10-20 beta users
- [ ] Monitor error rates (<1% target)
- [ ] Collect qualitative feedback
- [ ] Track key metrics (avg schemes/arg, CQ usage)

**Stage 3: Gradual Rollout (Days 25-30)**
- [ ] Day 25: Enable for moderators (10% of users)
- [ ] Day 26: Increase to 25% of users
- [ ] Day 27: Increase to 50% of users
- [ ] Day 28: Increase to 75% of users
- [ ] Day 29: Enable for all users
- [ ] Day 30: Remove feature flag (fully deployed)

### Post-Deployment

- [ ] Monitor key metrics for 1 week
- [ ] Address user feedback
- [ ] Write postmortem/retrospective
- [ ] Plan Phase 2 (Dependencies & Explicitness)

---

## Phase 1.6 Success Metrics

### Technical Metrics

**Performance**:
- [ ] P50 CQ composition time: <20ms
- [ ] P95 CQ composition time: <50ms
- [ ] P99 CQ composition time: <100ms
- [ ] Modal load time: <500ms
- [ ] API endpoint latency: <200ms

**Reliability**:
- [ ] Error rate: <0.5%
- [ ] Successful scheme additions: >98%
- [ ] Successful deletions: >99%
- [ ] Reorder success rate: >99%

### User Metrics

**Adoption**:
- [ ] % multi-scheme arguments: >30% (target: 40%)
- [ ] Avg schemes per multi-scheme arg: 2.5-3.5
- [ ] % users who add 2nd scheme: >25%
- [ ] % users who add 3+ schemes: >10%

**Engagement**:
- [ ] CQ modal open rate: >40%
- [ ] Filter usage rate: >30%
- [ ] Tab switch rate: >50%
- [ ] Avg time in CQ modal: 2-5 minutes

**Quality**:
- [ ] % arguments with justified implicit schemes: >80%
- [ ] % arguments with text evidence: >60%
- [ ] Scheme removal rate (regret): <5%

---

## Phase 1.6 Complete Deliverables

✅ **Testing**:
- E2E test suite (6 major flows)
- API integration tests
- Performance benchmarks
- Load testing scenarios

✅ **Infrastructure**:
- Feature flag system
- Gradual rollout mechanism
- Analytics tracking (6 events)
- Monitoring dashboard

✅ **Safety**:
- Rollback script with backup
- Error alerting
- Performance monitoring
- User-facing error messages

✅ **Documentation**:
- User guide with examples
- Developer documentation
- Troubleshooting guide
- FAQ

---

**Phase 1 (Multi-Scheme Arguments) Complete Summary**:

**Total Effort**: ~80 hours (2 weeks)

**Deliverables**:
- ✅ Data model (3 new tables)
- ✅ Migration strategy (3-phase, backward compatible)
- ✅ UI components (read + edit, 12 components)
- ✅ API endpoints (4 new routes)
- ✅ CQ composition system
- ✅ Testing infrastructure
- ✅ Feature flags
- ✅ Monitoring
- ✅ Documentation

**User Value**:
- Construct complex argumentative strategies
- See complete attack surface
- Understand scheme relationships
- Better reflect real-world reasoning

**Next**: Phase 2 (Dependencies & Explicitness) - Building the full ArgumentNet

---

*End of Phase 1. Ready to proceed with Phase 2 when you're ready.*

---
---

# Phase 2: Dependencies & Explicitness (80 hours, 2 weeks)

**Goal**: Complete the ArgumentNet model by adding dependency tracking, visualization, and explicitness styling throughout the UI. This phase transforms multi-scheme arguments from a collection of schemes into a structured **argumentative network** with explicit relationships.

**Research Foundation**: Macagno & Walton (2017) - "Practical Reasoning Arguments: A Modular Approach"
- Premise-conclusion dependencies
- Presuppositional structures
- Sequential reasoning chains
- Support vs justificational roles

**User Value**:
- See how schemes connect to form coherent arguments
- Understand implicit vs explicit reasoning
- Recognize common argument patterns
- Validate argument structure

**Technical Scope**:
- Dependency graph visualization
- Automatic dependency detection
- Global explicitness styling system
- Pattern recognition and matching
- Net validation rules
- Enhanced testing and documentation


## Phase 2.1: Dependency Graph Visualization (16 hours)

**Goal**: Create interactive graph component showing ArgumentSchemeInstances as nodes and ArgumentDependencies as edges.

**Key Deliverables**:
- `ArgumentNetGraph.tsx` - React Flow component with hierarchical/force-directed layouts
- `DependencyDetailModal.tsx` - Shows dependency details on edge click
- Integration into `ArgumentDetailsPanel` with "Network View" tab
- API endpoint `/api/arguments/[id]/dependencies` with cycle detection
- Mini-map for navigation, legend for dependency types

**Implementation Steps**:
1. Install React Flow library (`yarn add reactflow`)
2. Create ArgumentNetGraph component (6 hours)
   - Node styling by role (blue=primary, green=supporting, purple=presupposed)
   - Border styling by explicitness (solid/dashed/dotted)
   - Edge styling by dependency type with Unicode symbols (⟶ ⊨ ↗ ∵ →)
   - Layout algorithms (hierarchical arranges by order, force-directed spreads evenly)
3. Integrate into ArgumentDetailsPanel (3 hours)
   - Add "Network View" tab alongside "Schemes" and "CQs"
   - Click scheme → highlight in network view
   - Click node → show details
4. Create DependencyDetailModal (3 hours)
   - Show dependency type, description, justification
   - Warn for implicit dependencies
   - Display source/target schemes
5. Update types for ArgumentDependency (1 hour)
6. Add API endpoint with validation (2 hours)
   - POST /api/arguments/[id]/dependencies
   - Validate instances belong to argument
   - Check for circular dependencies (BFS algorithm)
   - Return created dependency with relations

**Testing**:
- Unit tests for ArgumentNetGraph (render, click handlers, highlighting)
- API tests for dependency creation and cycle detection
- Visual regression tests for graph rendering

**Acceptance Criteria**:
- [ ] Graph renders nodes and edges correctly
- [ ] Click handlers work for navigation
- [ ] Layouts arrange schemes logically
- [ ] Cycle detection prevents invalid dependencies
- [ ] All tests passing

**Time**: 16 hours | **Complexity**: Medium | **Risk**: Low

---

## Phase 2.2: Automatic Dependency Detection (12 hours)

**Goal**: Implement inference algorithm that automatically detects likely dependencies between schemes, reducing manual work.

**Key Deliverables**:
- `server/services/dependencyInference.ts` - 5 pattern detection algorithms
- `DependencySuggestionsPanel.tsx` - UI for accepting/rejecting suggestions
- API endpoint `/api/arguments/[id]/dependencies/infer`
- Integration into ArgumentSchemeManagementPanel

**Inference Patterns**:
1. **Premise-Conclusion Chains** (confidence 0.7-1.0)
   - Match scheme A's conclusion to scheme B's premise using textual similarity
   - `calculateSimilarity()` uses word overlap
   - Example: "X is true" (conclusion) → "X is true" (premise)

2. **Presuppositional Dependencies** (confidence 0.9)
   - Role-based: presupposed schemes → primary scheme
   - Automatically inferred from role assignment

3. **Support Relationships** (confidence 0.85)
   - Role-based: supporting schemes → primary scheme
   - Provides additional evidence

4. **Sequential Reasoning** (confidence 0.7)
   - Order-based: consecutive non-primary schemes form chains
   - Scheme[i] → Scheme[i+1]

5. **Justificational Dependencies** (confidence 0.8)
   - Scheme-type based: Expert Opinion, Authority, Witness → other schemes
   - Provides justification for claims

**Implementation Steps**:
1. Create dependency inference service (5 hours)
   - `inferDependencies()` - main entry point
   - 5 pattern detection functions
   - `parseFormalStructure()` - extract premises/conclusions
   - `findStructuralMatch()` - textual similarity scoring
   - Deduplication and confidence sorting
2. Create DependencySuggestionsPanel UI (4 hours)
   - Display suggestions with confidence scores
   - Accept/reject buttons
   - Batch dismiss
   - Color-coded by dependency type
3. Add inference API endpoint (2 hours)
   - GET /api/arguments/[id]/dependencies/infer
   - Returns sorted suggestions
4. Integrate into editing flow (1 hour)
   - Show suggestions after adding 2+ schemes
   - Accept → create ArgumentDependency with `isExplicit: false`
   - Justification from inference reason

**Testing**:
- Unit tests for each pattern detection algorithm
- Integration tests for inference service
- E2E tests for suggestion acceptance flow

**Acceptance Criteria**:
- [ ] All 5 patterns detect correctly
- [ ] Suggestions sorted by confidence
- [ ] UI allows accept/reject with feedback
- [ ] Accepted suggestions create dependencies
- [ ] Inferred dependencies marked as implicit
- [ ] All tests passing

**Time**: 12 hours | **Complexity**: High | **Risk**: Medium (false positives possible)

---

## Phase 2.3: Global Explicitness Styling (12 hours)

**Goal**: Establish consistent visual language for explicitness levels (explicit/presupposed/implied) across all components.

**Key Deliverables**:
- `styles/explicitness.css` - Global CSS utility classes
- `lib/explicitnessUtils.ts` - Helper functions
- Updated ArgumentCard, MultiSchemeBadge with explicitness borders
- `ExplicitnessFilter.tsx` - Filter UI component
- `ExplicitnessLegend.tsx` - Explanatory popover

**Visual Language**:
- **Explicit**: Solid borders (●), normal font, 100% opacity
- **Presupposed**: Dashed borders (◐), italic font, 75% opacity  
- **Implied**: Dotted borders (○), italic font, 50% opacity

**Implementation Steps**:
1. Create explicitness utilities (2 hours)
   - CSS classes: `.explicitness-explicit/presupposed/implied`
   - Helper functions: `getExplicitnessBorderClass()`, `getExplicitnessIcon()`, etc.
   - Descriptions for each level
2. Update ArgumentCard component (2 hours)
   - Apply explicitness border to card
   - Show explicitness icon
   - Warning for implicit arguments
3. Update MultiSchemeBadge component (2 hours)
   - Add explicitness borders to badges
   - Include explicitness icon
4. Create ExplicitnessFilter component (3 hours)
   - Checkbox for each level
   - Icons and labels
   - Filter arguments by primary scheme explicitness
5. Create ExplicitnessLegend component (2 hours)
   - Popover with "Understanding Explicitness" guide
   - Visual examples (border styles)
   - Tip about finding implicit reasoning
6. Update ArgumentList with filter (1 hour)
   - Sidebar with ExplicitnessFilter
   - Header with ExplicitnessLegend button
   - Filter applied to displayed arguments

**Testing**:
- Unit tests for utility functions
- Visual regression tests for styling
- Component tests for filter functionality

**Acceptance Criteria**:
- [ ] Consistent explicitness styling across all components
- [ ] Filter works correctly
- [ ] Legend explains visual language
- [ ] Warning shown for implicit arguments
- [ ] All tests passing

**Time**: 12 hours | **Complexity**: Low | **Risk**: Low (visual changes)

---

## Phase 2.4: Pattern Recognition (16 hours)

**Goal**: Identify and suggest common ArgumentNet patterns (policy arguments, legal precedents, etc.).

**Key Deliverables**:
- `SchemeNetPattern` seeding script with 10+ common patterns
- `matchPattern()` function in dependencyInference service
- Pattern badge/indicator in UI
- Pattern suggestion during argument creation
- Pattern library browser

**Common Patterns to Seed**:
1. **Policy Argument** (PR + Values + Consequences)
2. **Legal Precedent** (Case-to-Case + Authority + Analogy)
3. **Scientific Argument** (Sign + Expert + Correlation)
4. **Value-Based PR** (Values + PR)
5. **Slippery Slope** (Consequences chains)
6. **Ethical Dilemma** (Values + Consequences + Counterargument)
7. **Historical Analogy** (Example + Case-to-Case + Authority)
8. **Causal Chain** (Sign + Cause-to-Effect sequences)
9. **Burden Shift** (PR + Negative Consequences + Authority)
10. **Compromise** (Multiple Values + Multiple PR)

**Implementation Steps**:
1. Seed SchemeNetPattern table (3 hours)
   - Define 10+ patterns with:
     - `name`, `description`, `domain`
     - `schemeIds[]` - typical schemes used
     - `typicalStructure` - JSON with roles and dependencies
     - `usageCount` - track adoption
2. Create pattern matching algorithm (5 hours)
   - `matchPattern()` - compare argument structure to patterns
   - Scoring: scheme overlap + dependency similarity + role alignment
   - Return ranked matches with confidence scores
3. Create PatternBadge component (2 hours)
   - "This argument uses [Pattern Name]" indicator
   - Click to see pattern details
   - Confidence meter
4. Add pattern suggestion to creation flow (3 hours)
   - After adding 2+ schemes, suggest matching patterns
   - "Complete this pattern?" prompt
   - One-click to add remaining schemes
5. Create pattern library browser (3 hours)
   - Browse all patterns by domain
   - See example arguments
   - Filter by scheme types
   - Usage statistics

**Testing**:
- Unit tests for pattern matching algorithm
- Integration tests for pattern suggestions
- E2E tests for pattern-based creation

**Acceptance Criteria**:
- [ ] 10+ patterns seeded with correct structures
- [ ] Matching algorithm scores accurately
- [ ] UI shows pattern badges
- [ ] Suggestions work during creation
- [ ] Pattern library browsable
- [ ] All tests passing

**Time**: 16 hours | **Complexity**: Medium | **Risk**: Medium (pattern definitions)

---

## Phase 2.5: Net Validation (12 hours)

**Goal**: Implement validation rules to ensure ArgumentNet structural integrity.

**Key Deliverables**:
- `server/services/netValidation.ts` - Validation rules engine
- Real-time validation during editing
- Validation dashboard for admins
- Auto-fix suggestions

**Validation Rules**:
1. **No Circular Dependencies**: Cycles break logical flow
2. **Supporting Schemes Have Targets**: All supporting schemes must support something
3. **Presupposed Schemes Have Dependents**: Presuppositions must be used
4. **Explicit Dependencies Have Justification**: User must explain explicit connections
5. **Primary Scheme Exists**: Every argument needs a primary inference
6. **Orphaned Schemes**: No schemes disconnected from the net (except primary)
7. **Dependency Type Consistency**: Edge types match scheme roles

**Implementation Steps**:
1. Create validation service (6 hours)
   - `validateArgumentNet()` - main entry point
   - Individual rule validators (7 functions)
   - `ValidationResult` type with errors/warnings
   - Severity levels (error, warning, info)
2. Add real-time validation to UI (4 hours)
   - Validate on scheme add/remove/edit
   - Show errors in editing panel
   - Block save if critical errors
   - Allow warnings with confirmation
3. Create auto-fix suggestions (2 hours)
   - "Remove orphaned scheme X"
   - "Add justification for dependency Y"
   - "Convert presupposed role to supporting"
   - One-click fixes where possible

**Testing**:
- Unit tests for each validation rule
- Integration tests for validation service
- E2E tests for error display and auto-fix

**Acceptance Criteria**:
- [ ] All 7 validation rules implemented
- [ ] Real-time validation during editing
- [ ] Errors displayed with helpful messages
- [ ] Auto-fix suggestions work
- [ ] Critical errors block save
- [ ] All tests passing

**Time**: 12 hours | **Complexity**: Medium | **Risk**: Low (clear rules)

---

## Phase 2.6: Testing & Documentation (12 hours)

**Goal**: Comprehensive testing and documentation for Phase 2 features.

**Key Deliverables**:
- Unit tests for all Phase 2 services
- Integration tests for API endpoints
- E2E tests for user workflows
- Performance tests for inference and validation
- User documentation for dependencies and patterns
- Developer documentation for extending patterns

**Testing Scope**:

**Unit Tests** (4 hours):
- `dependencyInference.test.ts` - All 5 pattern detectors
- `netValidation.test.ts` - All 7 validation rules
- `explicitnessUtils.test.ts` - Utility functions
- `patternMatching.test.ts` - Pattern algorithm

**Integration Tests** (3 hours):
- API endpoint tests with mocked Prisma
- Dependency creation with cycle detection
- Inference endpoint with various argument structures
- Validation endpoint with rule checking

**E2E Tests** (3 hours):
- Create multi-scheme argument → see suggestions → accept → verify dependency
- View network graph → click edge → see details
- Filter by explicitness → verify results
- Match pattern → complete pattern → verify structure

**Performance Benchmarks** (1 hour):
- Inference: <100ms for 6-scheme argument
- Validation: <50ms for complex net
- Graph rendering: <500ms for 10-node net
- Pattern matching: <200ms for 10 patterns

**Documentation** (1 hour):
- User guide: Understanding Dependencies, Patterns, and Explicitness
- Developer guide: Adding new patterns, extending inference
- Admin guide: Reviewing nets, seeding patterns

**Acceptance Criteria**:
- [ ] 90%+ test coverage for Phase 2 code
- [ ] All performance benchmarks met
- [ ] User documentation published
- [ ] Developer documentation complete
- [ ] All tests passing in CI

**Time**: 12 hours | **Complexity**: Low | **Risk**: Low

---

## Phase 2 Summary

**Total Effort**: 80 hours (2 weeks)

**Deliverables**:
- ✅ Interactive dependency graph with React Flow
- ✅ Automatic dependency detection (5 patterns)
- ✅ Global explicitness styling system
- ✅ Pattern recognition and matching (10+ patterns)
- ✅ Net validation rules (7 rules)
- ✅ Comprehensive testing and documentation

**User Value**:
- **Understand Structure**: See how schemes connect in argumentative networks
- **Save Time**: Automatic dependency detection reduces manual work
- **Identify Implicit Reasoning**: Explicitness styling reveals assumptions
- **Leverage Patterns**: Recognize and use common argument structures
- **Ensure Validity**: Validation catches structural errors

**Technical Value**:
- **Complete ArgumentNet Model**: Structure (Phase 1) + Semantics (Phase 2)
- **Foundation for Visualization**: Dependency data enables advanced graph features
- **Research Alignment**: Implements Macagno & Walton presuppositional structures
- **Extensible Patterns**: Easy to add new patterns and inference rules

**Next Steps**:
After Phase 2, the ArgumentNet model is complete. Recommended next phases:
- **Phase 3**: Multi-Entry Navigation (Weeks 5-8) - Dichotomic tree, cluster browser
- **Phase 4**: Argument Generation (Weeks 9-12) - Attack/support suggestions, construction wizard
- **Phase 5**: Advanced Visualization (Weeks 13-16) - Multi-net analysis, comparative views

---

## Phase 2 Deployment Checklist

### Pre-Deployment
- [ ] All Phase 2.1-2.6 tests passing
- [ ] Performance benchmarks met (<100ms inference, <50ms validation)
- [ ] Dependency graph renders correctly for 10+ node nets
- [ ] Pattern library seeded with 10+ patterns
- [ ] Validation rules tested with edge cases
- [ ] Feature flags configured for gradual rollout
- [ ] User documentation published
- [ ] Team training on dependencies and patterns

### Deployment (Days 31-40)

**Stage 1: Internal Testing (Days 31-32)**
- [ ] Deploy to dev environment
- [ ] Test with internal arguments (5-10 complex cases)
- [ ] Verify inference accuracy (>80% useful suggestions)
- [ ] Check validation catches errors
- [ ] Performance testing with production data

**Stage 2: Beta Release (Days 33-35)**
- [ ] Enable for 20-30 beta users
- [ ] Monitor inference acceptance rate (target >50%)
- [ ] Track pattern usage
- [ ] Collect qualitative feedback
- [ ] Fix critical bugs

**Stage 3: Gradual Rollout (Days 36-40)**
- [ ] Day 36: 25% of users
- [ ] Day 37: 50% of users
- [ ] Day 38: 75% of users
- [ ] Day 39: 100% of users
- [ ] Day 40: Remove feature flags

### Post-Deployment
- [ ] Monitor key metrics for 1 week:
  - Dependency creation rate (manual + auto)
  - Inference acceptance rate (target >50%)
  - Pattern match accuracy
  - Validation error frequency
  - Graph view engagement
- [ ] Address user feedback
- [ ] Write postmortem
- [ ] Plan Phase 3 (Multi-Entry Navigation)

---

## Phase 2 Success Metrics

### Technical Metrics

**Performance**:
- [ ] Dependency inference: <100ms P95
- [ ] Net validation: <50ms P95
- [ ] Graph rendering: <500ms for 10 nodes
- [ ] Pattern matching: <200ms P95

**Reliability**:
- [ ] Inference accuracy: >80% useful suggestions
- [ ] Validation false positive rate: <5%
- [ ] Graph rendering success: >99%
- [ ] API error rate: <0.5%

### User Metrics

**Adoption**:
- [ ] % arguments with dependencies: >40%
- [ ] Avg dependencies per argument: 2-4
- [ ] Inference acceptance rate: >50%
- [ ] Pattern usage rate: >20% of multi-scheme args

**Engagement**:
- [ ] Network view open rate: >30%
- [ ] Explicitness filter usage: >15%
- [ ] Pattern library visits: >10% of users
- [ ] Dependency editing: >25% of multi-scheme args

**Quality**:
- [ ] % arguments with validated nets: >90%
- [ ] % implicit dependencies justified: >70%
- [ ] % pattern matches accurate: >85%
- [ ] Validation error fix rate: >95%

---

**Phase 2 Complete!**

With Phase 2 complete, the ArgumentNet model is fully implemented:
- **Phase 1**: Multi-scheme arguments (structure)
- **Phase 2**: Dependencies & explicitness (semantics)

**Ready for**: Phase 3 (Multi-Entry Navigation) - Help users discover and compose schemes through dichotomic trees, cluster browsing, and identification conditions.

---

*End of Phase 2. Ready for Phase 3 when you're ready.*

