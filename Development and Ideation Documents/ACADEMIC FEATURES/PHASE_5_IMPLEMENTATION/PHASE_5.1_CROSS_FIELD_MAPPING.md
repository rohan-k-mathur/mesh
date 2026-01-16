# Phase 5.1: Cross-Field Claim Mapping (Part 1)

**Sub-Phase:** 5.1 of 5.3  
**Focus:** Concept Equivalence, Field Taxonomy & Cross-Field Alerts

---

## User Stories

| ID | Story | Priority | Effort |
|----|-------|----------|--------|
| 5.1.1 | As a scholar, I want to tag claims by discipline, so others in my field can find them | P0 | S |
| 5.1.2 | As a researcher, I want to map concepts across fields, so I can discover related work | P0 | M |
| 5.1.3 | As a scholar, I want alerts when similar claims appear in other fields | P1 | M |
| 5.1.4 | As a journal club, I want to explore cross-field perspectives on our topic | P1 | M |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                 CROSS-FIELD MAPPING ENGINE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────┐                                                 │
│  │  FIELD         │                                                 │
│  │  TAXONOMY      │                                                 │
│  │  ────────────  │                                                 │
│  │  • Hierarchy   │                                                 │
│  │  • Aliases     │                                                 │
│  │  • Styles      │                                                 │
│  └───────┬────────┘                                                 │
│          │                                                          │
│          ▼                                                          │
│  ┌────────────────────────────────────────────────────┐             │
│  │              CONCEPT EQUIVALENCE                    │             │
│  │  ┌────────┐    ┌────────┐    ┌────────┐           │             │
│  │  │Concept │ ←→ │Concept │ ←→ │Concept │           │             │
│  │  │Field A │    │Field B │    │Field C │           │             │
│  │  └────────┘    └────────┘    └────────┘           │             │
│  └────────────────────────────────────────────────────┘             │
│          │                                                          │
│          ▼                                                          │
│  ┌────────────────┐    ┌────────────────┐                          │
│  │  CROSS-FIELD   │    │  SEMANTIC      │                          │
│  │  ALERTS        │    │  MATCHING      │                          │
│  │  ────────────  │    │  ────────────  │                          │
│  │  • Similar     │    │  • Embeddings  │                          │
│  │  • Related     │    │  • Similarity  │                          │
│  │  • Overlapping │    │  • Clustering  │                          │
│  └────────────────┘    └────────────────┘                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 5.1.1: Field Taxonomy Schema

**File:** `prisma/schema.prisma` (additions)

```prisma
// ============================================================
// ACADEMIC FIELD TAXONOMY
// ============================================================

/// Academic discipline/field taxonomy
model AcademicField {
  id              String   @id @default(cuid())
  
  // Core identity
  name            String   @unique @db.VarChar(200)
  slug            String   @unique @db.VarChar(200)
  description     String?  @db.Text
  
  // Hierarchy
  parentFieldId   String?
  parentField     AcademicField? @relation("FieldHierarchy", fields: [parentFieldId], references: [id])
  subFields       AcademicField[] @relation("FieldHierarchy")
  
  // Discovery
  aliases         String[] // Alternative names
  keyTerms        String[] // Key vocabulary
  
  // Epistemic characterization
  epistemicStyle  EpistemicStyle @default(MIXED)
  
  // Relationships
  relatedFields   FieldRelation[] @relation("SourceField")
  relatedTo       FieldRelation[] @relation("TargetField")
  
  // Usage
  claims          Claim[]
  concepts        Concept[]
  userExpertise   ScholarExpertise[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([parentFieldId])
}

enum EpistemicStyle {
  EMPIRICAL       // Data-driven, hypothesis testing
  INTERPRETIVE    // Hermeneutic, meaning-focused
  FORMAL          // Logic, mathematics, modeling
  NORMATIVE       // Value-based, prescriptive
  HISTORICAL      // Archival, narrative
  MIXED           // Combination approaches
}

/// Relationships between fields
model FieldRelation {
  id              String   @id @default(cuid())
  
  sourceFieldId   String
  sourceField     AcademicField @relation("SourceField", fields: [sourceFieldId], references: [id])
  
  targetFieldId   String
  targetField     AcademicField @relation("TargetField", fields: [targetFieldId], references: [id])
  
  relationType    FieldRelationType
  strength        Float    @default(0.5) // 0-1
  
  createdAt       DateTime @default(now())
  
  @@unique([sourceFieldId, targetFieldId])
}

enum FieldRelationType {
  PARENT_CHILD    // Hierarchical
  OVERLAPPING     // Shared concerns
  COMPLEMENTARY   // Different angles on same problems
  METHODOLOGICAL  // Shares methods
  HISTORICAL      // Emerged from
  INTERDISCIPLINARY // Bridge field
}

// ============================================================
// CONCEPT MAPPING
// ============================================================

/// A concept within a field
model Concept {
  id              String   @id @default(cuid())
  
  // Core
  name            String   @db.VarChar(300)
  definition      String   @db.Text
  
  // Field association
  fieldId         String
  field           AcademicField @relation(fields: [fieldId], references: [id])
  
  // Variations
  aliases         String[]
  relatedTerms    String[]
  
  // Source
  keySourceId     String?  // Canonical source for definition
  
  // Equivalences
  equivalencesAs  ConceptEquivalence[] @relation("SourceConcept")
  equivalentTo    ConceptEquivalence[] @relation("TargetConcept")
  
  // Claims using this concept
  claims          Claim[]
  
  // Embeddings for matching
  embedding       Float[]  @db.DoublePrecision
  
  createdById     String
  createdBy       User     @relation(fields: [createdById], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([fieldId, name])
  @@index([fieldId])
}

/// Cross-field concept equivalence
model ConceptEquivalence {
  id              String   @id @default(cuid())
  
  // Linked concepts
  sourceConceptId String
  sourceConcept   Concept  @relation("SourceConcept", fields: [sourceConceptId], references: [id])
  
  targetConceptId String
  targetConcept   Concept  @relation("TargetConcept", fields: [targetConceptId], references: [id])
  
  // Relationship type
  equivalenceType EquivalenceType
  confidence      Float    @default(0.5) // 0-1
  
  // Evidence
  justification   String?  @db.Text
  deliberationId  String?  // Where mapping was negotiated
  
  // Verification
  verifiedBy      User[]   @relation("ConceptVerifiers")
  verificationCount Int    @default(0)
  
  // Status
  status          EquivalenceStatus @default(PROPOSED)
  
  proposedById    String
  proposedBy      User     @relation(fields: [proposedById], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([sourceConceptId, targetConceptId])
}

enum EquivalenceType {
  IDENTICAL       // Same concept, different name
  SIMILAR         // Very close, minor differences
  OVERLAPPING     // Partial overlap
  RELATED         // Conceptually linked but distinct
  TRANSLATES_TO   // Can be translated with caveats
  CONTRASTING     // Intentionally different approaches
}

enum EquivalenceStatus {
  PROPOSED        // Awaiting review
  UNDER_REVIEW    // Being deliberated
  VERIFIED        // Community verified
  CONTESTED       // Active disagreement
  REJECTED        // Deemed incorrect
}

// ============================================================
// CROSS-FIELD ALERTS
// ============================================================

/// Alert for cross-field discoveries
model CrossFieldAlert {
  id              String   @id @default(cuid())
  
  // Recipient
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  // Alert type
  alertType       CrossFieldAlertType
  
  // Referenced items
  sourceClaimId   String?
  targetClaimId   String?
  conceptId       String?
  equivalenceId   String?
  
  // Context
  sourceField     String?
  targetField     String?
  matchScore      Float?   // Similarity score
  
  // Content
  title           String   @db.VarChar(300)
  description     String   @db.Text
  
  // Status
  status          AlertStatus @default(UNREAD)
  
  createdAt       DateTime @default(now())
  readAt          DateTime?
  actionedAt      DateTime?
  
  @@index([userId, status])
  @@index([createdAt])
}

enum CrossFieldAlertType {
  SIMILAR_CLAIM     // Similar claim in another field
  NEW_EQUIVALENCE   // Concept mapping created
  TRANSLATION_READY // Translation deliberation completed
  FIELD_DISCUSSION  // Active discussion in related field
  COLLABORATION_MATCH // Potential collaborator found
}

enum AlertStatus {
  UNREAD
  READ
  DISMISSED
  ACTIONED
}
```

---

### Step 5.1.2: Field Taxonomy Types

**File:** `lib/crossfield/types.ts`

```typescript
/**
 * Types for cross-field mapping and discovery
 */

export type EpistemicStyle =
  | "EMPIRICAL"
  | "INTERPRETIVE"
  | "FORMAL"
  | "NORMATIVE"
  | "HISTORICAL"
  | "MIXED";

export type FieldRelationType =
  | "PARENT_CHILD"
  | "OVERLAPPING"
  | "COMPLEMENTARY"
  | "METHODOLOGICAL"
  | "HISTORICAL"
  | "INTERDISCIPLINARY";

export type EquivalenceType =
  | "IDENTICAL"
  | "SIMILAR"
  | "OVERLAPPING"
  | "RELATED"
  | "TRANSLATES_TO"
  | "CONTRASTING";

export type EquivalenceStatus =
  | "PROPOSED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "CONTESTED"
  | "REJECTED";

export type CrossFieldAlertType =
  | "SIMILAR_CLAIM"
  | "NEW_EQUIVALENCE"
  | "TRANSLATION_READY"
  | "FIELD_DISCUSSION"
  | "COLLABORATION_MATCH";

export type AlertStatus = "UNREAD" | "READ" | "DISMISSED" | "ACTIONED";

// ============================================================
// Field Taxonomy Types
// ============================================================

export interface AcademicFieldSummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentFieldId?: string;
  parentFieldName?: string;
  epistemicStyle: EpistemicStyle;
  subFieldCount: number;
  claimCount: number;
  conceptCount: number;
}

export interface FieldHierarchy {
  id: string;
  name: string;
  slug: string;
  epistemicStyle: EpistemicStyle;
  children: FieldHierarchy[];
}

export interface FieldWithRelations {
  id: string;
  name: string;
  slug: string;
  description?: string;
  epistemicStyle: EpistemicStyle;
  aliases: string[];
  keyTerms: string[];
  parent?: AcademicFieldSummary;
  subFields: AcademicFieldSummary[];
  relatedFields: Array<{
    field: AcademicFieldSummary;
    relationType: FieldRelationType;
    strength: number;
  }>;
}

// ============================================================
// Concept Types
// ============================================================

export interface ConceptSummary {
  id: string;
  name: string;
  definition: string;
  fieldId: string;
  fieldName: string;
  aliases: string[];
  equivalenceCount: number;
  claimCount: number;
}

export interface ConceptWithEquivalences {
  id: string;
  name: string;
  definition: string;
  field: AcademicFieldSummary;
  aliases: string[];
  relatedTerms: string[];
  equivalences: Array<{
    targetConcept: ConceptSummary;
    equivalenceType: EquivalenceType;
    confidence: number;
    status: EquivalenceStatus;
  }>;
}

export interface ConceptEquivalenceProposal {
  sourceConceptId: string;
  targetConceptId: string;
  equivalenceType: EquivalenceType;
  justification: string;
}

// ============================================================
// Alert Types
// ============================================================

export interface CrossFieldAlertData {
  id: string;
  alertType: CrossFieldAlertType;
  title: string;
  description: string;
  sourceField?: string;
  targetField?: string;
  matchScore?: number;
  sourceClaimId?: string;
  targetClaimId?: string;
  conceptId?: string;
  status: AlertStatus;
  createdAt: Date;
}

export interface AlertPreferences {
  similarClaims: boolean;
  newEquivalences: boolean;
  translationReady: boolean;
  fieldDiscussions: boolean;
  collaborationMatches: boolean;
  fieldsOfInterest: string[];
  minMatchScore: number;
}

// ============================================================
// Search & Discovery Types
// ============================================================

export interface CrossFieldSearchParams {
  query: string;
  sourceField?: string;
  targetFields?: string[];
  minSimilarity?: number;
  includeRelatedConcepts?: boolean;
  limit?: number;
}

export interface CrossFieldSearchResult {
  claims: Array<{
    claim: any; // Claim type
    field: AcademicFieldSummary;
    similarity: number;
    matchedConcepts: string[];
  }>;
  concepts: Array<{
    concept: ConceptSummary;
    equivalentTo: ConceptSummary[];
    similarity: number;
  }>;
  suggestedEquivalences: Array<{
    sourceConcept: ConceptSummary;
    targetConcept: ConceptSummary;
    confidence: number;
  }>;
}
```

---

### Step 5.1.3: Field Service

**File:** `lib/crossfield/fieldService.ts`

```typescript
/**
 * Service for managing academic field taxonomy
 */

import { prisma } from "@/lib/prisma";
import {
  AcademicFieldSummary,
  EpistemicStyle,
  FieldHierarchy,
  FieldRelationType,
  FieldWithRelations,
} from "./types";

/**
 * Get all top-level fields
 */
export async function getTopLevelFields(): Promise<AcademicFieldSummary[]> {
  const fields = await prisma.academicField.findMany({
    where: { parentFieldId: null },
    include: {
      _count: {
        select: {
          subFields: true,
          claims: true,
          concepts: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return fields.map((f) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    description: f.description || undefined,
    epistemicStyle: f.epistemicStyle as EpistemicStyle,
    subFieldCount: f._count.subFields,
    claimCount: f._count.claims,
    conceptCount: f._count.concepts,
  }));
}

/**
 * Get field hierarchy (tree structure)
 */
export async function getFieldHierarchy(): Promise<FieldHierarchy[]> {
  const allFields = await prisma.academicField.findMany({
    orderBy: { name: "asc" },
  });

  // Build tree
  const fieldMap = new Map<string, FieldHierarchy>();
  const roots: FieldHierarchy[] = [];

  // First pass: create nodes
  allFields.forEach((f) => {
    fieldMap.set(f.id, {
      id: f.id,
      name: f.name,
      slug: f.slug,
      epistemicStyle: f.epistemicStyle as EpistemicStyle,
      children: [],
    });
  });

  // Second pass: build tree
  allFields.forEach((f) => {
    const node = fieldMap.get(f.id)!;
    if (f.parentFieldId) {
      const parent = fieldMap.get(f.parentFieldId);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/**
 * Get field with all relationships
 */
export async function getFieldWithRelations(
  fieldId: string
): Promise<FieldWithRelations | null> {
  const field = await prisma.academicField.findUnique({
    where: { id: fieldId },
    include: {
      parentField: true,
      subFields: {
        include: {
          _count: { select: { claims: true, concepts: true } },
        },
      },
      relatedFields: {
        include: {
          targetField: {
            include: {
              _count: { select: { claims: true, concepts: true } },
            },
          },
        },
      },
    },
  });

  if (!field) return null;

  return {
    id: field.id,
    name: field.name,
    slug: field.slug,
    description: field.description || undefined,
    epistemicStyle: field.epistemicStyle as EpistemicStyle,
    aliases: field.aliases,
    keyTerms: field.keyTerms,
    parent: field.parentField
      ? {
          id: field.parentField.id,
          name: field.parentField.name,
          slug: field.parentField.slug,
          epistemicStyle: field.parentField.epistemicStyle as EpistemicStyle,
          subFieldCount: 0,
          claimCount: 0,
          conceptCount: 0,
        }
      : undefined,
    subFields: field.subFields.map((sf) => ({
      id: sf.id,
      name: sf.name,
      slug: sf.slug,
      epistemicStyle: sf.epistemicStyle as EpistemicStyle,
      subFieldCount: 0,
      claimCount: sf._count.claims,
      conceptCount: sf._count.concepts,
    })),
    relatedFields: field.relatedFields.map((r) => ({
      field: {
        id: r.targetField.id,
        name: r.targetField.name,
        slug: r.targetField.slug,
        epistemicStyle: r.targetField.epistemicStyle as EpistemicStyle,
        subFieldCount: 0,
        claimCount: r.targetField._count.claims,
        conceptCount: r.targetField._count.concepts,
      },
      relationType: r.relationType as FieldRelationType,
      strength: r.strength,
    })),
  };
}

/**
 * Create a new academic field
 */
export async function createField(data: {
  name: string;
  description?: string;
  parentFieldId?: string;
  aliases?: string[];
  keyTerms?: string[];
  epistemicStyle?: EpistemicStyle;
}): Promise<AcademicFieldSummary> {
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const field = await prisma.academicField.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      parentFieldId: data.parentFieldId,
      aliases: data.aliases || [],
      keyTerms: data.keyTerms || [],
      epistemicStyle: data.epistemicStyle || "MIXED",
    },
    include: {
      _count: {
        select: { subFields: true, claims: true, concepts: true },
      },
    },
  });

  return {
    id: field.id,
    name: field.name,
    slug: field.slug,
    description: field.description || undefined,
    epistemicStyle: field.epistemicStyle as EpistemicStyle,
    subFieldCount: field._count.subFields,
    claimCount: field._count.claims,
    conceptCount: field._count.concepts,
  };
}

/**
 * Add relationship between fields
 */
export async function addFieldRelation(
  sourceFieldId: string,
  targetFieldId: string,
  relationType: FieldRelationType,
  strength = 0.5
): Promise<void> {
  await prisma.fieldRelation.upsert({
    where: {
      sourceFieldId_targetFieldId: {
        sourceFieldId,
        targetFieldId,
      },
    },
    create: {
      sourceFieldId,
      targetFieldId,
      relationType,
      strength,
    },
    update: {
      relationType,
      strength,
    },
  });

  // Create reverse relationship if complementary/overlapping
  if (relationType === "OVERLAPPING" || relationType === "COMPLEMENTARY") {
    await prisma.fieldRelation.upsert({
      where: {
        sourceFieldId_targetFieldId: {
          sourceFieldId: targetFieldId,
          targetFieldId: sourceFieldId,
        },
      },
      create: {
        sourceFieldId: targetFieldId,
        targetFieldId: sourceFieldId,
        relationType,
        strength,
      },
      update: {
        relationType,
        strength,
      },
    });
  }
}

/**
 * Search fields by name or alias
 */
export async function searchFields(query: string): Promise<AcademicFieldSummary[]> {
  const fields = await prisma.academicField.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { aliases: { has: query } },
        { keyTerms: { hasSome: query.split(" ") } },
      ],
    },
    include: {
      _count: {
        select: { subFields: true, claims: true, concepts: true },
      },
    },
    take: 20,
  });

  return fields.map((f) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    description: f.description || undefined,
    epistemicStyle: f.epistemicStyle as EpistemicStyle,
    subFieldCount: f._count.subFields,
    claimCount: f._count.claims,
    conceptCount: f._count.concepts,
  }));
}

/**
 * Get fields related to a set of claims
 */
export async function getFieldsForClaims(
  claimIds: string[]
): Promise<Map<string, AcademicFieldSummary[]>> {
  const claims = await prisma.claim.findMany({
    where: { id: { in: claimIds } },
    include: { field: true },
  });

  const result = new Map<string, AcademicFieldSummary[]>();

  claims.forEach((claim) => {
    if (claim.field) {
      const existing = result.get(claim.id) || [];
      existing.push({
        id: claim.field.id,
        name: claim.field.name,
        slug: claim.field.slug,
        epistemicStyle: claim.field.epistemicStyle as EpistemicStyle,
        subFieldCount: 0,
        claimCount: 0,
        conceptCount: 0,
      });
      result.set(claim.id, existing);
    }
  });

  return result;
}
```

---

### Step 5.1.4: Concept Service

**File:** `lib/crossfield/conceptService.ts`

```typescript
/**
 * Service for managing concepts and their cross-field equivalences
 */

import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/embeddings";
import {
  ConceptSummary,
  ConceptWithEquivalences,
  ConceptEquivalenceProposal,
  EquivalenceStatus,
  EquivalenceType,
} from "./types";

/**
 * Create a new concept
 */
export async function createConcept(
  userId: string,
  data: {
    name: string;
    definition: string;
    fieldId: string;
    aliases?: string[];
    relatedTerms?: string[];
    keySourceId?: string;
  }
): Promise<ConceptSummary> {
  // Generate embedding for similarity matching
  const embeddingText = `${data.name}: ${data.definition}`;
  const embedding = await generateEmbedding(embeddingText);

  const concept = await prisma.concept.create({
    data: {
      name: data.name,
      definition: data.definition,
      fieldId: data.fieldId,
      aliases: data.aliases || [],
      relatedTerms: data.relatedTerms || [],
      keySourceId: data.keySourceId,
      embedding,
      createdById: userId,
    },
    include: {
      field: true,
      _count: {
        select: { equivalencesAs: true, claims: true },
      },
    },
  });

  return {
    id: concept.id,
    name: concept.name,
    definition: concept.definition,
    fieldId: concept.fieldId,
    fieldName: concept.field.name,
    aliases: concept.aliases,
    equivalenceCount: concept._count.equivalencesAs,
    claimCount: concept._count.claims,
  };
}

/**
 * Get concept with all equivalences
 */
export async function getConceptWithEquivalences(
  conceptId: string
): Promise<ConceptWithEquivalences | null> {
  const concept = await prisma.concept.findUnique({
    where: { id: conceptId },
    include: {
      field: {
        include: {
          _count: { select: { claims: true, concepts: true } },
        },
      },
      equivalencesAs: {
        include: {
          targetConcept: {
            include: {
              field: true,
              _count: { select: { equivalencesAs: true, claims: true } },
            },
          },
        },
      },
      equivalentTo: {
        include: {
          sourceConcept: {
            include: {
              field: true,
              _count: { select: { equivalencesAs: true, claims: true } },
            },
          },
        },
      },
    },
  });

  if (!concept) return null;

  // Combine both directions of equivalences
  const equivalences = [
    ...concept.equivalencesAs.map((e) => ({
      targetConcept: {
        id: e.targetConcept.id,
        name: e.targetConcept.name,
        definition: e.targetConcept.definition,
        fieldId: e.targetConcept.fieldId,
        fieldName: e.targetConcept.field.name,
        aliases: e.targetConcept.aliases,
        equivalenceCount: e.targetConcept._count.equivalencesAs,
        claimCount: e.targetConcept._count.claims,
      },
      equivalenceType: e.equivalenceType as EquivalenceType,
      confidence: e.confidence,
      status: e.status as EquivalenceStatus,
    })),
    ...concept.equivalentTo.map((e) => ({
      targetConcept: {
        id: e.sourceConcept.id,
        name: e.sourceConcept.name,
        definition: e.sourceConcept.definition,
        fieldId: e.sourceConcept.fieldId,
        fieldName: e.sourceConcept.field.name,
        aliases: e.sourceConcept.aliases,
        equivalenceCount: e.sourceConcept._count.equivalencesAs,
        claimCount: e.sourceConcept._count.claims,
      },
      equivalenceType: e.equivalenceType as EquivalenceType,
      confidence: e.confidence,
      status: e.status as EquivalenceStatus,
    })),
  ];

  return {
    id: concept.id,
    name: concept.name,
    definition: concept.definition,
    field: {
      id: concept.field.id,
      name: concept.field.name,
      slug: concept.field.slug,
      epistemicStyle: concept.field.epistemicStyle as any,
      subFieldCount: 0,
      claimCount: concept.field._count.claims,
      conceptCount: concept.field._count.concepts,
    },
    aliases: concept.aliases,
    relatedTerms: concept.relatedTerms,
    equivalences,
  };
}

/**
 * Propose concept equivalence
 */
export async function proposeEquivalence(
  userId: string,
  proposal: ConceptEquivalenceProposal
): Promise<void> {
  // Ensure different fields
  const [source, target] = await Promise.all([
    prisma.concept.findUnique({ where: { id: proposal.sourceConceptId } }),
    prisma.concept.findUnique({ where: { id: proposal.targetConceptId } }),
  ]);

  if (!source || !target) {
    throw new Error("Concept not found");
  }

  if (source.fieldId === target.fieldId) {
    throw new Error("Concepts must be from different fields");
  }

  await prisma.conceptEquivalence.create({
    data: {
      sourceConceptId: proposal.sourceConceptId,
      targetConceptId: proposal.targetConceptId,
      equivalenceType: proposal.equivalenceType,
      justification: proposal.justification,
      proposedById: userId,
      status: "PROPOSED",
    },
  });
}

/**
 * Verify concept equivalence
 */
export async function verifyEquivalence(
  equivalenceId: string,
  userId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Add verifier
    await tx.conceptEquivalence.update({
      where: { id: equivalenceId },
      data: {
        verifiedBy: {
          connect: { id: userId },
        },
        verificationCount: { increment: 1 },
      },
    });

    // Check if threshold met
    const equivalence = await tx.conceptEquivalence.findUnique({
      where: { id: equivalenceId },
      select: { verificationCount: true },
    });

    if (equivalence && equivalence.verificationCount >= 3) {
      await tx.conceptEquivalence.update({
        where: { id: equivalenceId },
        data: { status: "VERIFIED" },
      });
    }
  });
}

/**
 * Find similar concepts across fields
 */
export async function findSimilarConcepts(
  conceptId: string,
  minSimilarity = 0.7
): Promise<Array<{ concept: ConceptSummary; similarity: number }>> {
  const sourceConcept = await prisma.concept.findUnique({
    where: { id: conceptId },
    select: { embedding: true, fieldId: true },
  });

  if (!sourceConcept || !sourceConcept.embedding) {
    return [];
  }

  // Find concepts in other fields with similar embeddings
  // Using cosine similarity (simplified - in production use pgvector)
  const otherConcepts = await prisma.concept.findMany({
    where: {
      fieldId: { not: sourceConcept.fieldId },
      embedding: { isEmpty: false },
    },
    include: {
      field: true,
      _count: { select: { equivalencesAs: true, claims: true } },
    },
    take: 100, // Limit for performance
  });

  const results: Array<{ concept: ConceptSummary; similarity: number }> = [];

  for (const concept of otherConcepts) {
    if (!concept.embedding || concept.embedding.length === 0) continue;

    const similarity = cosineSimilarity(
      sourceConcept.embedding,
      concept.embedding
    );

    if (similarity >= minSimilarity) {
      results.push({
        concept: {
          id: concept.id,
          name: concept.name,
          definition: concept.definition,
          fieldId: concept.fieldId,
          fieldName: concept.field.name,
          aliases: concept.aliases,
          equivalenceCount: concept._count.equivalencesAs,
          claimCount: concept._count.claims,
        },
        similarity,
      });
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Get concepts by field
 */
export async function getConceptsByField(
  fieldId: string
): Promise<ConceptSummary[]> {
  const concepts = await prisma.concept.findMany({
    where: { fieldId },
    include: {
      field: true,
      _count: { select: { equivalencesAs: true, claims: true } },
    },
    orderBy: { name: "asc" },
  });

  return concepts.map((c) => ({
    id: c.id,
    name: c.name,
    definition: c.definition,
    fieldId: c.fieldId,
    fieldName: c.field.name,
    aliases: c.aliases,
    equivalenceCount: c._count.equivalencesAs,
    claimCount: c._count.claims,
  }));
}

/**
 * Search concepts across all fields
 */
export async function searchConcepts(
  query: string,
  fieldId?: string
): Promise<ConceptSummary[]> {
  const concepts = await prisma.concept.findMany({
    where: {
      AND: [
        fieldId ? { fieldId } : {},
        {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { definition: { contains: query, mode: "insensitive" } },
            { aliases: { has: query } },
          ],
        },
      ],
    },
    include: {
      field: true,
      _count: { select: { equivalencesAs: true, claims: true } },
    },
    take: 30,
  });

  return concepts.map((c) => ({
    id: c.id,
    name: c.name,
    definition: c.definition,
    fieldId: c.fieldId,
    fieldName: c.field.name,
    aliases: c.aliases,
    equivalenceCount: c._count.equivalencesAs,
    claimCount: c._count.claims,
  }));
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

---

## Phase 5.1 Part 1 Checklist

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Field taxonomy schema | `prisma/schema.prisma` | ✅ |
| 2 | Concept schema | `prisma/schema.prisma` | ✅ |
| 3 | Concept equivalence schema | `prisma/schema.prisma` | ✅ |
| 4 | Cross-field alert schema | `prisma/schema.prisma` | ✅ |
| 5 | CrossField types | `lib/crossfield/types.ts` | ✅ |
| 6 | Field service | `lib/crossfield/fieldService.ts` | ✅ |
| 7 | Concept service | `lib/crossfield/conceptService.ts` | ✅ |

---

*Continued in Part 2: Alert Service, API Routes, React Query Hooks*
