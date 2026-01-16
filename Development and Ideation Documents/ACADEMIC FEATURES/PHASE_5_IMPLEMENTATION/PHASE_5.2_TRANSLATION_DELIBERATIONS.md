# Phase 5.2: Translation Deliberations (Part 1)

**Sub-Phase:** 5.2 of 5.3  
**Focus:** Negotiation Spaces for Cross-Field Term Translation

---

## User Stories

| ID | Story | Priority | Effort |
|----|-------|----------|--------|
| 5.2.1 | As a scholar, I want a dedicated space to negotiate term meanings across fields | P0 | M |
| 5.2.2 | As a translator, I want to propose bridge claims that connect field assumptions | P0 | M |
| 5.2.3 | As a moderator, I want structured phases for translation deliberations | P1 | M |
| 5.2.4 | As an institution, I want to track successful translations for impact | P1 | S |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                 TRANSLATION DELIBERATION                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │                  TRANSLATION SPACE                       │       │
│  │                                                          │       │
│  │  Field A Terms  ←──────────────────→  Field B Terms     │       │
│  │  ──────────────      Negotiation      ──────────────    │       │
│  │  "Agency"                                "Self-Efficacy"│       │
│  │  "Habitus"                               "Schema"       │       │
│  │  "Doxa"                                  "Implicit Bias"│       │
│  │                                                          │       │
│  └─────────────────────────────────────────────────────────┘       │
│                           │                                         │
│                           ▼                                         │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │                   BRIDGE CLAIMS                          │       │
│  │                                                          │       │
│  │  IF Field A accepts X                                   │       │
│  │  AND Field B accepts Y                                  │       │
│  │  THEN common ground Z follows                           │       │
│  │                                                          │       │
│  │  Assumption Tags: [Empirical] [Normative] [Interpretive]│       │
│  │                                                          │       │
│  └─────────────────────────────────────────────────────────┘       │
│                           │                                         │
│                           ▼                                         │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │                TRANSLATION OUTCOME                       │       │
│  │                                                          │       │
│  │  • Equivalence mappings created                         │       │
│  │  • Bridge claims established                            │       │
│  │  • Caveats documented                                   │       │
│  │  • Incompatibilities noted                              │       │
│  │                                                          │       │
│  └─────────────────────────────────────────────────────────┘       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 5.2.1: Translation Deliberation Schema

**File:** `prisma/schema.prisma` (additions)

```prisma
// ============================================================
// TRANSLATION DELIBERATIONS
// ============================================================

/// A deliberation for negotiating cross-field term translation
model TranslationDeliberation {
  id              String   @id @default(cuid())
  
  // Core identity
  title           String   @db.VarChar(300)
  description     String   @db.Text
  
  // Fields being bridged
  fieldAId        String
  fieldA          AcademicField @relation("TranslationFieldA", fields: [fieldAId], references: [id])
  
  fieldBId        String
  fieldB          AcademicField @relation("TranslationFieldB", fields: [fieldBId], references: [id])
  
  // Terms being translated
  termMappings    TermMapping[]
  
  // Bridge claims
  bridgeClaims    BridgeClaim[]
  
  // Phases
  currentPhase    TranslationPhase @default(TERM_COLLECTION)
  phases          TranslationPhaseRecord[]
  
  // Status
  status          TranslationStatus @default(ACTIVE)
  
  // Outcome
  outcome         TranslationOutcome?
  
  // Participants
  facilitatorId   String
  facilitator     User     @relation("TranslationFacilitator", fields: [facilitatorId], references: [id])
  participants    TranslationParticipant[]
  
  // Discussion
  discussionThreadId String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  completedAt     DateTime?
  
  @@index([fieldAId, fieldBId])
  @@index([status])
}

enum TranslationPhase {
  TERM_COLLECTION       // Gathering terms from each field
  INITIAL_MAPPING       // Proposing equivalences
  NEGOTIATION           // Discussing differences
  BRIDGE_BUILDING       // Creating bridge claims
  CAVEAT_DOCUMENTATION  // Documenting limitations
  FINALIZATION          // Final review
  COMPLETED             // Done
}

enum TranslationStatus {
  ACTIVE
  PAUSED
  COMPLETED
  ABANDONED
}

/// A term mapping proposal in a translation
model TermMapping {
  id              String   @id @default(cuid())
  
  translationId   String
  translation     TranslationDeliberation @relation(fields: [translationId], references: [id], onDelete: Cascade)
  
  // Field A term
  termAId         String?  // Concept ID if exists
  termAName       String   @db.VarChar(200)
  termADefinition String   @db.Text
  termAField      String   // Field ID
  
  // Field B term
  termBId         String?  // Concept ID if exists
  termBName       String   @db.VarChar(200)
  termBDefinition String   @db.Text
  termBField      String   // Field ID
  
  // Proposed relationship
  proposedType    EquivalenceType
  confidence      Float    @default(0.5)
  
  // Discussion
  justification   String?  @db.Text
  caveats         String[] // Known limitations
  
  // Votes
  votes           TermMappingVote[]
  
  // Status
  status          MappingStatus @default(PROPOSED)
  
  proposedById    String
  proposedBy      User     @relation(fields: [proposedById], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([translationId])
}

enum MappingStatus {
  PROPOSED
  UNDER_DISCUSSION
  ACCEPTED
  REJECTED
  MODIFIED
}

/// Vote on a term mapping
model TermMappingVote {
  id              String   @id @default(cuid())
  
  mappingId       String
  mapping         TermMapping @relation(fields: [mappingId], references: [id], onDelete: Cascade)
  
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  vote            VoteType
  comment         String?  @db.Text
  
  createdAt       DateTime @default(now())
  
  @@unique([mappingId, userId])
}

enum VoteType {
  AGREE
  DISAGREE
  NEEDS_MODIFICATION
  ABSTAIN
}

/// Bridge claim connecting assumptions across fields
model BridgeClaim {
  id              String   @id @default(cuid())
  
  translationId   String
  translation     TranslationDeliberation @relation(fields: [translationId], references: [id], onDelete: Cascade)
  
  // Structure: IF A accepts X AND B accepts Y THEN Z
  fieldAAssumption String  @db.Text  // What Field A accepts
  fieldBAssumption String  @db.Text  // What Field B accepts
  commonGround     String  @db.Text  // What follows
  
  // Assumption types
  fieldAAssumptionType AssumptionType
  fieldBAssumptionType AssumptionType
  
  // Supporting arguments
  supportingArgumentIds String[]
  
  // Status
  status          BridgeClaimStatus @default(PROPOSED)
  
  // Votes
  votes           BridgeClaimVote[]
  
  proposedById    String
  proposedBy      User     @relation(fields: [proposedById], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([translationId])
}

enum AssumptionType {
  EMPIRICAL       // Based on data/evidence
  NORMATIVE       // Based on values
  INTERPRETIVE    // Based on reading/meaning
  METHODOLOGICAL  // Based on how to study
  THEORETICAL     // Based on theory
}

enum BridgeClaimStatus {
  PROPOSED
  UNDER_REVIEW
  ACCEPTED
  REJECTED
  CONDITIONAL   // Accepted with caveats
}

/// Vote on a bridge claim
model BridgeClaimVote {
  id              String   @id @default(cuid())
  
  bridgeClaimId   String
  bridgeClaim     BridgeClaim @relation(fields: [bridgeClaimId], references: [id], onDelete: Cascade)
  
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  vote            VoteType
  comment         String?  @db.Text
  
  createdAt       DateTime @default(now())
  
  @@unique([bridgeClaimId, userId])
}

/// Participant in a translation
model TranslationParticipant {
  id              String   @id @default(cuid())
  
  translationId   String
  translation     TranslationDeliberation @relation(fields: [translationId], references: [id], onDelete: Cascade)
  
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  // Role
  role            TranslationRole
  
  // Which field they represent
  representingFieldId String?
  
  joinedAt        DateTime @default(now())
  
  @@unique([translationId, userId])
}

enum TranslationRole {
  FACILITATOR
  FIELD_A_EXPERT
  FIELD_B_EXPERT
  BRIDGE_SCHOLAR    // Has expertise in both fields
  OBSERVER
}

/// Phase record for a translation
model TranslationPhaseRecord {
  id              String   @id @default(cuid())
  
  translationId   String
  translation     TranslationDeliberation @relation(fields: [translationId], references: [id], onDelete: Cascade)
  
  phase           TranslationPhase
  
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  
  // Phase outcomes
  summary         String?  @db.Text
  decisions       Json?    // Key decisions made
  
  @@index([translationId])
}

/// Final outcome of a translation
model TranslationOutcome {
  id              String   @id @default(cuid())
  
  translationId   String   @unique
  translation     TranslationDeliberation @relation(fields: [translationId], references: [id])
  
  // Summary
  summary         String   @db.Text
  
  // Results
  equivalencesCreated   Int    @default(0)
  bridgeClaimsAccepted  Int    @default(0)
  caveatsDocumented     Int    @default(0)
  
  // Detailed outcome
  equivalenceIds  String[] // Created concept equivalences
  
  // Incompatibilities discovered
  incompatibilities String[] // Terms that cannot be translated
  
  // Recommendations
  recommendations String?  @db.Text
  
  createdAt       DateTime @default(now())
}
```

---

### Step 5.2.2: Translation Types

**File:** `lib/translation/types.ts`

```typescript
/**
 * Types for translation deliberations
 */

export type TranslationPhase =
  | "TERM_COLLECTION"
  | "INITIAL_MAPPING"
  | "NEGOTIATION"
  | "BRIDGE_BUILDING"
  | "CAVEAT_DOCUMENTATION"
  | "FINALIZATION"
  | "COMPLETED";

export type TranslationStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "ABANDONED";

export type MappingStatus =
  | "PROPOSED"
  | "UNDER_DISCUSSION"
  | "ACCEPTED"
  | "REJECTED"
  | "MODIFIED";

export type AssumptionType =
  | "EMPIRICAL"
  | "NORMATIVE"
  | "INTERPRETIVE"
  | "METHODOLOGICAL"
  | "THEORETICAL";

export type BridgeClaimStatus =
  | "PROPOSED"
  | "UNDER_REVIEW"
  | "ACCEPTED"
  | "REJECTED"
  | "CONDITIONAL";

export type TranslationRole =
  | "FACILITATOR"
  | "FIELD_A_EXPERT"
  | "FIELD_B_EXPERT"
  | "BRIDGE_SCHOLAR"
  | "OBSERVER";

export type VoteType = "AGREE" | "DISAGREE" | "NEEDS_MODIFICATION" | "ABSTAIN";

// ============================================================
// Translation Deliberation Types
// ============================================================

export interface TranslationSummary {
  id: string;
  title: string;
  description: string;
  fieldA: { id: string; name: string };
  fieldB: { id: string; name: string };
  currentPhase: TranslationPhase;
  status: TranslationStatus;
  participantCount: number;
  mappingCount: number;
  bridgeClaimCount: number;
  createdAt: Date;
}

export interface TranslationWithDetails {
  id: string;
  title: string;
  description: string;
  fieldA: { id: string; name: string; epistemicStyle: string };
  fieldB: { id: string; name: string; epistemicStyle: string };
  currentPhase: TranslationPhase;
  status: TranslationStatus;
  facilitator: { id: string; name: string };
  participants: TranslationParticipantData[];
  termMappings: TermMappingData[];
  bridgeClaims: BridgeClaimData[];
  phases: PhaseRecordData[];
  outcome?: TranslationOutcomeData;
  createdAt: Date;
  completedAt?: Date;
}

export interface TranslationParticipantData {
  id: string;
  userId: string;
  userName: string;
  role: TranslationRole;
  representingFieldId?: string;
  representingFieldName?: string;
  joinedAt: Date;
}

// ============================================================
// Term Mapping Types
// ============================================================

export interface TermMappingData {
  id: string;
  termA: {
    id?: string;
    name: string;
    definition: string;
    fieldId: string;
    fieldName: string;
  };
  termB: {
    id?: string;
    name: string;
    definition: string;
    fieldId: string;
    fieldName: string;
  };
  proposedType: string;
  confidence: number;
  justification?: string;
  caveats: string[];
  status: MappingStatus;
  votes: {
    agree: number;
    disagree: number;
    needsModification: number;
  };
  proposedBy: { id: string; name: string };
  createdAt: Date;
}

export interface CreateTermMappingInput {
  translationId: string;
  termAId?: string;
  termAName: string;
  termADefinition: string;
  termBId?: string;
  termBName: string;
  termBDefinition: string;
  proposedType: string;
  justification?: string;
}

// ============================================================
// Bridge Claim Types
// ============================================================

export interface BridgeClaimData {
  id: string;
  fieldAAssumption: string;
  fieldBAssumption: string;
  commonGround: string;
  fieldAAssumptionType: AssumptionType;
  fieldBAssumptionType: AssumptionType;
  status: BridgeClaimStatus;
  votes: {
    agree: number;
    disagree: number;
    needsModification: number;
  };
  proposedBy: { id: string; name: string };
  createdAt: Date;
}

export interface CreateBridgeClaimInput {
  translationId: string;
  fieldAAssumption: string;
  fieldBAssumption: string;
  commonGround: string;
  fieldAAssumptionType: AssumptionType;
  fieldBAssumptionType: AssumptionType;
}

// ============================================================
// Phase & Outcome Types
// ============================================================

export interface PhaseRecordData {
  id: string;
  phase: TranslationPhase;
  startedAt: Date;
  completedAt?: Date;
  summary?: string;
}

export interface TranslationOutcomeData {
  id: string;
  summary: string;
  equivalencesCreated: number;
  bridgeClaimsAccepted: number;
  caveatsDocumented: number;
  incompatibilities: string[];
  recommendations?: string;
}

// ============================================================
// Phase Transition
// ============================================================

export const PHASE_ORDER: TranslationPhase[] = [
  "TERM_COLLECTION",
  "INITIAL_MAPPING",
  "NEGOTIATION",
  "BRIDGE_BUILDING",
  "CAVEAT_DOCUMENTATION",
  "FINALIZATION",
  "COMPLETED",
];

export const PHASE_DESCRIPTIONS: Record<TranslationPhase, string> = {
  TERM_COLLECTION:
    "Gather key terms from each field that need translation",
  INITIAL_MAPPING:
    "Propose initial equivalences between terms",
  NEGOTIATION:
    "Discuss and refine term mappings through deliberation",
  BRIDGE_BUILDING:
    "Create bridge claims connecting field assumptions",
  CAVEAT_DOCUMENTATION:
    "Document limitations and incompatibilities",
  FINALIZATION:
    "Review and finalize all mappings and claims",
  COMPLETED:
    "Translation deliberation complete",
};
```

---

### Step 5.2.3: Translation Service

**File:** `lib/translation/translationService.ts`

```typescript
/**
 * Service for managing translation deliberations
 */

import { prisma } from "@/lib/prisma";
import {
  TranslationSummary,
  TranslationWithDetails,
  TranslationPhase,
  TranslationStatus,
  PHASE_ORDER,
} from "./types";

/**
 * Create a new translation deliberation
 */
export async function createTranslation(
  userId: string,
  data: {
    title: string;
    description: string;
    fieldAId: string;
    fieldBId: string;
  }
): Promise<TranslationSummary> {
  const translation = await prisma.translationDeliberation.create({
    data: {
      title: data.title,
      description: data.description,
      fieldAId: data.fieldAId,
      fieldBId: data.fieldBId,
      facilitatorId: userId,
      currentPhase: "TERM_COLLECTION",
      status: "ACTIVE",
      participants: {
        create: {
          userId,
          role: "FACILITATOR",
        },
      },
      phases: {
        create: {
          phase: "TERM_COLLECTION",
        },
      },
    },
    include: {
      fieldA: true,
      fieldB: true,
      _count: {
        select: {
          participants: true,
          termMappings: true,
          bridgeClaims: true,
        },
      },
    },
  });

  return {
    id: translation.id,
    title: translation.title,
    description: translation.description,
    fieldA: { id: translation.fieldA.id, name: translation.fieldA.name },
    fieldB: { id: translation.fieldB.id, name: translation.fieldB.name },
    currentPhase: translation.currentPhase as TranslationPhase,
    status: translation.status as TranslationStatus,
    participantCount: translation._count.participants,
    mappingCount: translation._count.termMappings,
    bridgeClaimCount: translation._count.bridgeClaims,
    createdAt: translation.createdAt,
  };
}

/**
 * Get translation with full details
 */
export async function getTranslation(
  translationId: string
): Promise<TranslationWithDetails | null> {
  const translation = await prisma.translationDeliberation.findUnique({
    where: { id: translationId },
    include: {
      fieldA: true,
      fieldB: true,
      facilitator: { select: { id: true, name: true } },
      participants: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      termMappings: {
        include: {
          proposedBy: { select: { id: true, name: true } },
          votes: true,
        },
        orderBy: { createdAt: "desc" },
      },
      bridgeClaims: {
        include: {
          proposedBy: { select: { id: true, name: true } },
          votes: true,
        },
        orderBy: { createdAt: "desc" },
      },
      phases: {
        orderBy: { startedAt: "asc" },
      },
      outcome: true,
    },
  });

  if (!translation) return null;

  return {
    id: translation.id,
    title: translation.title,
    description: translation.description,
    fieldA: {
      id: translation.fieldA.id,
      name: translation.fieldA.name,
      epistemicStyle: translation.fieldA.epistemicStyle,
    },
    fieldB: {
      id: translation.fieldB.id,
      name: translation.fieldB.name,
      epistemicStyle: translation.fieldB.epistemicStyle,
    },
    currentPhase: translation.currentPhase as TranslationPhase,
    status: translation.status as TranslationStatus,
    facilitator: translation.facilitator,
    participants: translation.participants.map((p) => ({
      id: p.id,
      userId: p.userId,
      userName: p.user.name || "Unknown",
      role: p.role as any,
      representingFieldId: p.representingFieldId || undefined,
      joinedAt: p.joinedAt,
    })),
    termMappings: translation.termMappings.map((m) => ({
      id: m.id,
      termA: {
        id: m.termAId || undefined,
        name: m.termAName,
        definition: m.termADefinition,
        fieldId: m.termAField,
        fieldName: translation.fieldA.name,
      },
      termB: {
        id: m.termBId || undefined,
        name: m.termBName,
        definition: m.termBDefinition,
        fieldId: m.termBField,
        fieldName: translation.fieldB.name,
      },
      proposedType: m.proposedType,
      confidence: m.confidence,
      justification: m.justification || undefined,
      caveats: m.caveats,
      status: m.status as any,
      votes: {
        agree: m.votes.filter((v) => v.vote === "AGREE").length,
        disagree: m.votes.filter((v) => v.vote === "DISAGREE").length,
        needsModification: m.votes.filter((v) => v.vote === "NEEDS_MODIFICATION").length,
      },
      proposedBy: m.proposedBy,
      createdAt: m.createdAt,
    })),
    bridgeClaims: translation.bridgeClaims.map((b) => ({
      id: b.id,
      fieldAAssumption: b.fieldAAssumption,
      fieldBAssumption: b.fieldBAssumption,
      commonGround: b.commonGround,
      fieldAAssumptionType: b.fieldAAssumptionType as any,
      fieldBAssumptionType: b.fieldBAssumptionType as any,
      status: b.status as any,
      votes: {
        agree: b.votes.filter((v) => v.vote === "AGREE").length,
        disagree: b.votes.filter((v) => v.vote === "DISAGREE").length,
        needsModification: b.votes.filter((v) => v.vote === "NEEDS_MODIFICATION").length,
      },
      proposedBy: b.proposedBy,
      createdAt: b.createdAt,
    })),
    phases: translation.phases.map((p) => ({
      id: p.id,
      phase: p.phase as TranslationPhase,
      startedAt: p.startedAt,
      completedAt: p.completedAt || undefined,
      summary: p.summary || undefined,
    })),
    outcome: translation.outcome
      ? {
          id: translation.outcome.id,
          summary: translation.outcome.summary,
          equivalencesCreated: translation.outcome.equivalencesCreated,
          bridgeClaimsAccepted: translation.outcome.bridgeClaimsAccepted,
          caveatsDocumented: translation.outcome.caveatsDocumented,
          incompatibilities: translation.outcome.incompatibilities,
          recommendations: translation.outcome.recommendations || undefined,
        }
      : undefined,
    createdAt: translation.createdAt,
    completedAt: translation.completedAt || undefined,
  };
}

/**
 * List translations for a field
 */
export async function getTranslationsForField(
  fieldId: string,
  status?: TranslationStatus
): Promise<TranslationSummary[]> {
  const translations = await prisma.translationDeliberation.findMany({
    where: {
      OR: [{ fieldAId: fieldId }, { fieldBId: fieldId }],
      ...(status && { status }),
    },
    include: {
      fieldA: true,
      fieldB: true,
      _count: {
        select: {
          participants: true,
          termMappings: true,
          bridgeClaims: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return translations.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    fieldA: { id: t.fieldA.id, name: t.fieldA.name },
    fieldB: { id: t.fieldB.id, name: t.fieldB.name },
    currentPhase: t.currentPhase as TranslationPhase,
    status: t.status as TranslationStatus,
    participantCount: t._count.participants,
    mappingCount: t._count.termMappings,
    bridgeClaimCount: t._count.bridgeClaims,
    createdAt: t.createdAt,
  }));
}

/**
 * Advance to next phase
 */
export async function advancePhase(
  translationId: string,
  phaseSummary?: string
): Promise<TranslationPhase> {
  const translation = await prisma.translationDeliberation.findUnique({
    where: { id: translationId },
    select: { currentPhase: true },
  });

  if (!translation) {
    throw new Error("Translation not found");
  }

  const currentIndex = PHASE_ORDER.indexOf(
    translation.currentPhase as TranslationPhase
  );
  if (currentIndex === -1 || currentIndex >= PHASE_ORDER.length - 1) {
    throw new Error("Cannot advance phase");
  }

  const nextPhase = PHASE_ORDER[currentIndex + 1];

  await prisma.$transaction([
    // Complete current phase
    prisma.translationPhaseRecord.updateMany({
      where: {
        translationId,
        phase: translation.currentPhase,
        completedAt: null,
      },
      data: {
        completedAt: new Date(),
        summary: phaseSummary,
      },
    }),
    // Start next phase
    prisma.translationPhaseRecord.create({
      data: {
        translationId,
        phase: nextPhase,
      },
    }),
    // Update translation
    prisma.translationDeliberation.update({
      where: { id: translationId },
      data: {
        currentPhase: nextPhase,
        ...(nextPhase === "COMPLETED" && {
          status: "COMPLETED",
          completedAt: new Date(),
        }),
      },
    }),
  ]);

  return nextPhase;
}

/**
 * Join translation as participant
 */
export async function joinTranslation(
  translationId: string,
  userId: string,
  role: string,
  representingFieldId?: string
): Promise<void> {
  await prisma.translationParticipant.upsert({
    where: {
      translationId_userId: {
        translationId,
        userId,
      },
    },
    create: {
      translationId,
      userId,
      role: role as any,
      representingFieldId,
    },
    update: {
      role: role as any,
      representingFieldId,
    },
  });
}

/**
 * Create translation outcome
 */
export async function createOutcome(
  translationId: string,
  data: {
    summary: string;
    equivalencesCreated: number;
    bridgeClaimsAccepted: number;
    caveatsDocumented: number;
    incompatibilities: string[];
    recommendations?: string;
  }
): Promise<void> {
  await prisma.translationOutcome.create({
    data: {
      translationId,
      ...data,
    },
  });
}
```

---

### Step 5.2.4: Term Mapping Service

**File:** `lib/translation/termMappingService.ts`

```typescript
/**
 * Service for managing term mappings in translations
 */

import { prisma } from "@/lib/prisma";
import { CreateTermMappingInput, MappingStatus, VoteType } from "./types";

/**
 * Create a term mapping proposal
 */
export async function createTermMapping(
  userId: string,
  input: CreateTermMappingInput
): Promise<string> {
  const translation = await prisma.translationDeliberation.findUnique({
    where: { id: input.translationId },
    select: { fieldAId: true, fieldBId: true },
  });

  if (!translation) {
    throw new Error("Translation not found");
  }

  const mapping = await prisma.termMapping.create({
    data: {
      translationId: input.translationId,
      termAId: input.termAId,
      termAName: input.termAName,
      termADefinition: input.termADefinition,
      termAField: translation.fieldAId,
      termBId: input.termBId,
      termBName: input.termBName,
      termBDefinition: input.termBDefinition,
      termBField: translation.fieldBId,
      proposedType: input.proposedType,
      justification: input.justification,
      proposedById: userId,
      status: "PROPOSED",
    },
  });

  return mapping.id;
}

/**
 * Vote on a term mapping
 */
export async function voteOnMapping(
  mappingId: string,
  userId: string,
  vote: VoteType,
  comment?: string
): Promise<void> {
  await prisma.termMappingVote.upsert({
    where: {
      mappingId_userId: {
        mappingId,
        userId,
      },
    },
    create: {
      mappingId,
      userId,
      vote,
      comment,
    },
    update: {
      vote,
      comment,
    },
  });

  // Check if mapping should auto-advance
  await checkMappingStatus(mappingId);
}

/**
 * Check and update mapping status based on votes
 */
async function checkMappingStatus(mappingId: string): Promise<void> {
  const mapping = await prisma.termMapping.findUnique({
    where: { id: mappingId },
    include: {
      votes: true,
      translation: {
        include: { _count: { select: { participants: true } } },
      },
    },
  });

  if (!mapping) return;

  const totalParticipants = mapping.translation._count.participants;
  const totalVotes = mapping.votes.length;
  const agreeVotes = mapping.votes.filter((v) => v.vote === "AGREE").length;
  const disagreeVotes = mapping.votes.filter(
    (v) => v.vote === "DISAGREE"
  ).length;

  // Require majority participation
  if (totalVotes < Math.ceil(totalParticipants / 2)) return;

  let newStatus: MappingStatus | null = null;

  // Check for consensus
  if (agreeVotes > totalVotes * 0.7) {
    newStatus = "ACCEPTED";
  } else if (disagreeVotes > totalVotes * 0.7) {
    newStatus = "REJECTED";
  } else if (totalVotes >= totalParticipants * 0.8) {
    // If most have voted but no consensus
    newStatus = "UNDER_DISCUSSION";
  }

  if (newStatus && newStatus !== mapping.status) {
    await prisma.termMapping.update({
      where: { id: mappingId },
      data: { status: newStatus },
    });
  }
}

/**
 * Update mapping with caveats
 */
export async function addCaveatToMapping(
  mappingId: string,
  caveat: string
): Promise<void> {
  const mapping = await prisma.termMapping.findUnique({
    where: { id: mappingId },
    select: { caveats: true },
  });

  if (!mapping) {
    throw new Error("Mapping not found");
  }

  await prisma.termMapping.update({
    where: { id: mappingId },
    data: {
      caveats: [...mapping.caveats, caveat],
    },
  });
}

/**
 * Modify mapping confidence
 */
export async function updateMappingConfidence(
  mappingId: string,
  confidence: number
): Promise<void> {
  await prisma.termMapping.update({
    where: { id: mappingId },
    data: {
      confidence: Math.max(0, Math.min(1, confidence)),
      status: "MODIFIED",
    },
  });
}

/**
 * Finalize accepted mappings into concept equivalences
 */
export async function finalizeAcceptedMappings(
  translationId: string,
  userId: string
): Promise<number> {
  const acceptedMappings = await prisma.termMapping.findMany({
    where: {
      translationId,
      status: "ACCEPTED",
    },
  });

  let created = 0;

  for (const mapping of acceptedMappings) {
    // Only create equivalence if both terms have concept IDs
    if (mapping.termAId && mapping.termBId) {
      try {
        await prisma.conceptEquivalence.create({
          data: {
            sourceConceptId: mapping.termAId,
            targetConceptId: mapping.termBId,
            equivalenceType: mapping.proposedType as any,
            confidence: mapping.confidence,
            justification: mapping.justification,
            deliberationId: translationId,
            proposedById: userId,
            status: "VERIFIED",
          },
        });
        created++;
      } catch (e) {
        // Equivalence may already exist
        console.warn("Could not create equivalence:", e);
      }
    }
  }

  return created;
}
```

---

### Step 5.2.5: Bridge Claim Service

**File:** `lib/translation/bridgeClaimService.ts`

```typescript
/**
 * Service for managing bridge claims in translations
 */

import { prisma } from "@/lib/prisma";
import {
  CreateBridgeClaimInput,
  BridgeClaimStatus,
  VoteType,
} from "./types";

/**
 * Create a bridge claim
 */
export async function createBridgeClaim(
  userId: string,
  input: CreateBridgeClaimInput
): Promise<string> {
  const bridgeClaim = await prisma.bridgeClaim.create({
    data: {
      translationId: input.translationId,
      fieldAAssumption: input.fieldAAssumption,
      fieldBAssumption: input.fieldBAssumption,
      commonGround: input.commonGround,
      fieldAAssumptionType: input.fieldAAssumptionType,
      fieldBAssumptionType: input.fieldBAssumptionType,
      proposedById: userId,
      status: "PROPOSED",
    },
  });

  return bridgeClaim.id;
}

/**
 * Vote on a bridge claim
 */
export async function voteOnBridgeClaim(
  bridgeClaimId: string,
  userId: string,
  vote: VoteType,
  comment?: string
): Promise<void> {
  await prisma.bridgeClaimVote.upsert({
    where: {
      bridgeClaimId_userId: {
        bridgeClaimId,
        userId,
      },
    },
    create: {
      bridgeClaimId,
      userId,
      vote,
      comment,
    },
    update: {
      vote,
      comment,
    },
  });

  // Check if bridge claim should auto-advance
  await checkBridgeClaimStatus(bridgeClaimId);
}

/**
 * Check and update bridge claim status based on votes
 */
async function checkBridgeClaimStatus(bridgeClaimId: string): Promise<void> {
  const claim = await prisma.bridgeClaim.findUnique({
    where: { id: bridgeClaimId },
    include: {
      votes: true,
      translation: {
        include: { _count: { select: { participants: true } } },
      },
    },
  });

  if (!claim) return;

  const totalParticipants = claim.translation._count.participants;
  const totalVotes = claim.votes.length;
  const agreeVotes = claim.votes.filter((v) => v.vote === "AGREE").length;
  const disagreeVotes = claim.votes.filter((v) => v.vote === "DISAGREE").length;
  const modificationVotes = claim.votes.filter(
    (v) => v.vote === "NEEDS_MODIFICATION"
  ).length;

  // Require majority participation
  if (totalVotes < Math.ceil(totalParticipants / 2)) return;

  let newStatus: BridgeClaimStatus | null = null;

  // Check for consensus
  if (agreeVotes > totalVotes * 0.7) {
    newStatus = "ACCEPTED";
  } else if (disagreeVotes > totalVotes * 0.7) {
    newStatus = "REJECTED";
  } else if (modificationVotes > totalVotes * 0.4) {
    // Significant modification requests → conditional
    newStatus = "CONDITIONAL";
  } else if (totalVotes >= totalParticipants * 0.8) {
    newStatus = "UNDER_REVIEW";
  }

  if (newStatus && newStatus !== claim.status) {
    await prisma.bridgeClaim.update({
      where: { id: bridgeClaimId },
      data: { status: newStatus },
    });
  }
}

/**
 * Update bridge claim status manually
 */
export async function updateBridgeClaimStatus(
  bridgeClaimId: string,
  status: BridgeClaimStatus
): Promise<void> {
  await prisma.bridgeClaim.update({
    where: { id: bridgeClaimId },
    data: { status },
  });
}

/**
 * Get bridge claims summary for a translation
 */
export async function getBridgeClaimsSummary(translationId: string): Promise<{
  total: number;
  accepted: number;
  rejected: number;
  conditional: number;
  pending: number;
}> {
  const claims = await prisma.bridgeClaim.findMany({
    where: { translationId },
    select: { status: true },
  });

  return {
    total: claims.length,
    accepted: claims.filter((c) => c.status === "ACCEPTED").length,
    rejected: claims.filter((c) => c.status === "REJECTED").length,
    conditional: claims.filter((c) => c.status === "CONDITIONAL").length,
    pending: claims.filter(
      (c) => c.status === "PROPOSED" || c.status === "UNDER_REVIEW"
    ).length,
  };
}
```

---

## Phase 5.2 Part 1 Checklist

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Translation deliberation schema | `prisma/schema.prisma` | ✅ |
| 2 | Term mapping schema | `prisma/schema.prisma` | ✅ |
| 3 | Bridge claim schema | `prisma/schema.prisma` | ✅ |
| 4 | Participant & phase schemas | `prisma/schema.prisma` | ✅ |
| 5 | Translation outcome schema | `prisma/schema.prisma` | ✅ |
| 6 | Translation types | `lib/translation/types.ts` | ✅ |
| 7 | Translation service | `lib/translation/translationService.ts` | ✅ |
| 8 | Term mapping service | `lib/translation/termMappingService.ts` | ✅ |
| 9 | Bridge claim service | `lib/translation/bridgeClaimService.ts` | ✅ |

---

*Continued in Part 2: API Routes, React Query Hooks & UI Components*
