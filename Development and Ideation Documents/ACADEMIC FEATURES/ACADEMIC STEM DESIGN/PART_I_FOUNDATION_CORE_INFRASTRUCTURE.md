# Part I: Foundation & Core Infrastructure

**Parent Document**: [STEM_IMPLEMENTATION_ROADMAP_OUTLINE.md](./STEM_IMPLEMENTATION_ROADMAP_OUTLINE.md)  
**Source**: [academic-agora-stem-design-exploration.md](../academic-agora-stem-design-exploration.md)  
**Created**: January 31, 2026  
**Status**: Detailed Planning

---

## Overview

Part I establishes the foundational infrastructure required before any STEM-specific features can be built. This includes auditing the existing HSS platform, extending the claim ontology to support STEM claim types, and implementing the grounding status computation engine.

**Dependencies**: None (this is the foundation)  
**Unlocks**: Parts II-XII (all subsequent phases depend on this foundation)

---

## Phase 0: Prerequisites & Audit

### 0.1 Existing Platform Capability Assessment

**Objective**: Document current HSS platform architecture to identify extension points.

#### Tasks

| ID | Task | Description | Complexity | Est. Hours |
|----|------|-------------|------------|------------|
| 0.1.1 | Claim model audit | Document current Claim Prisma model, all fields and relations | Low | 4 |
| 0.1.2 | Argument model audit | Document Argument model and relation to schemes | Low | 4 |
| 0.1.3 | Scheme model audit | Document existing HSS schemes, CQ implementation | Medium | 8 |
| 0.1.4 | Attack/Support audit | Document attack types, undermining, undercutting, rebutting | Low | 4 |
| 0.1.5 | Commitment model audit | Document commitment/endorsement tracking | Low | 4 |
| 0.1.6 | API endpoint inventory | Catalog all existing claim/argument API routes | Medium | 8 |
| 0.1.7 | UI component inventory | Catalog claim cards, argument views, scheme selectors | Medium | 8 |

**Deliverable**: `PLATFORM_AUDIT_REPORT.md` documenting:
- Current Prisma schema (relevant models)
- API endpoint catalog
- UI component catalog
- Identified extension points
- Potential breaking change risks

#### Acceptance Criteria
- [ ] All Claim-related Prisma models documented
- [ ] All Argument/Scheme models documented
- [ ] API routes mapped with request/response shapes
- [ ] UI components cataloged with prop interfaces
- [ ] Extension points identified and ranked by risk

---

### 0.2 Database Schema Extension Points

**Objective**: Identify how to extend Prisma schema without breaking existing functionality.

#### Tasks

| ID | Task | Description | Complexity | Est. Hours |
|----|------|-------------|------------|------------|
| 0.2.1 | Schema extension strategy | Define approach: new tables vs. extended fields vs. polymorphism | Medium | 8 |
| 0.2.2 | Enum extension analysis | Determine if existing enums can be extended or need new enums | Low | 4 |
| 0.2.3 | Relation mapping | Map new STEM models to existing Claim/Argument models | Medium | 8 |
| 0.2.4 | Index planning | Identify indexes needed for STEM query patterns | Medium | 8 |
| 0.2.5 | Migration strategy | Plan incremental migrations that don't disrupt HSS | Medium | 8 |

**Deliverable**: `SCHEMA_EXTENSION_PLAN.md` documenting:
- Extension approach decision
- New tables to create
- Existing tables to modify
- Migration sequence
- Rollback strategy

#### Key Decisions Required

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ DECISION: Claim Type Extension Strategy                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Option A: Single ClaimType Enum Extension                                   │
│   • Add 27 STEM types to existing ClaimType enum                            │
│   • Pros: Simple, single source of truth                                    │
│   • Cons: Large enum, HSS/STEM coupling                                     │
│                                                                             │
│ Option B: Separate STEMClaimType Enum                                       │
│   • Create new enum, add claimCategory field to Claim                       │
│   • Pros: Clean separation, discipline-specific typing                      │
│   • Cons: More complex queries, two enums to maintain                       │
│                                                                             │
│ Option C: Polymorphic Claims via Discriminated Union                        │
│   • Base Claim + STEMClaim extension table                                  │
│   • Pros: Full flexibility, discipline-specific fields                      │
│   • Cons: More complex joins, ORM overhead                                  │
│                                                                             │
│ RECOMMENDATION: Option B for initial implementation, with migration path    │
│ to Option C if discipline-specific fields become complex                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 0.3 API Versioning Strategy

**Objective**: Ensure backward compatibility for existing HSS consumers.

#### Tasks

| ID | Task | Description | Complexity | Est. Hours |
|----|------|-------------|------------|------------|
| 0.3.1 | Version scheme selection | Choose versioning approach (URL path, header, query param) | Low | 2 |
| 0.3.2 | Deprecation policy | Define timeline for deprecating old endpoints | Low | 2 |
| 0.3.3 | Response shape evolution | Define rules for adding fields without breaking clients | Low | 4 |
| 0.3.4 | OpenAPI spec setup | Set up API documentation generation | Medium | 8 |

**Deliverable**: `API_VERSIONING_POLICY.md`

#### Recommended Approach

```typescript
// URL-based versioning for major changes
// /api/v1/claims - existing HSS endpoints
// /api/v2/claims - extended for STEM (backward compatible)

// Response evolution rules:
// 1. New optional fields can be added without version bump
// 2. New required fields require version bump
// 3. Field removal requires deprecation period + version bump
// 4. Type changes require version bump

// Example: Extended Claim response (v2)
interface ClaimResponseV2 extends ClaimResponseV1 {
  // New optional STEM fields
  stemClaimType?: STEMClaimType;
  groundingStatus?: GroundingStatus;
  groundingAnchors?: GroundingAnchor[];
}
```

---

### 0.4 Current Claim/Argument/Scheme Architecture

**Objective**: Deep-dive into existing architecture for integration planning.

#### Expected Current Structure (to be validated)

```prisma
// Expected existing models (to be confirmed in audit)

model Claim {
  id              String   @id @default(cuid())
  content         String
  claimType       ClaimType
  source          Source?  @relation(...)
  arguments       Argument[]
  attacks         Attack[]  @relation("AttackedClaim")
  supports        Support[]
  commitments     Commitment[]
  // ... other fields
}

enum ClaimType {
  THESIS
  INTERPRETIVE
  HISTORICAL
  NORMATIVE
  METHODOLOGICAL
  // ... HSS types
}

model Argument {
  id              String   @id @default(cuid())
  claimId         String
  claim           Claim    @relation(...)
  schemeId        String
  scheme          Scheme   @relation(...)
  premises        Premise[]
  // ... other fields
}

model Scheme {
  id              String   @id @default(cuid())
  name            String
  description     String
  criticalQuestions CriticalQuestion[]
  // ... other fields
}
```

#### Integration Points for STEM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INTEGRATION POINTS IDENTIFICATION                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CLAIM MODEL EXTENSIONS:                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ + stemClaimType: STEMClaimType?    // New field                     │   │
│  │ + groundingStatus: GroundingStatus? // Computed or stored           │   │
│  │ + datasetAnchors: DatasetAnchor[]   // New relation                 │   │
│  │ + codeAnchors: CodeAnchor[]         // New relation                 │   │
│  │ + protocolAnchors: ProtocolAnchor[] // New relation                 │   │
│  │ + replications: Replication[]       // New relation                 │   │
│  │ + predictions: ClaimPrediction[]    // New relation                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  SCHEME MODEL EXTENSIONS:                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ + schemeCategory: SchemeCategory    // HSS, EMPIRICAL, COMPUTATIONAL│   │
│  │ + requiredGrounding: GroundingType[]// What grounding scheme needs  │   │
│  │ + verificationRules: Json           // Automated check config       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  NEW MODELS REQUIRED:                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • DatasetAnchor      • ProtocolAnchor    • VerificationReport       │   │
│  │ • CodeAnchor         • ModelAnchor       • Replication              │   │
│  │ • ClaimPrediction    • ClaimOutcome      • StatisticalCheck         │   │
│  │ • DomainExpert       • ConflictDeclaration                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Extended Claim Ontology

### 1.1 STEM Claim Type Enumeration

**Objective**: Define all 27 STEM claim types across 7 categories.

#### STEM Claim Type Enum

```prisma
// New enum to be added to schema.prisma

enum STEMClaimType {
  // ═══════════════════════════════════════════════════════════════════════
  // EMPIRICAL CLAIMS (5 types)
  // ═══════════════════════════════════════════════════════════════════════
  EMPIRICAL_OBSERVATION      // "We observed X in conditions Y"
  EMPIRICAL_MEASUREMENT      // "The measured value of X is Y ± Z"
  EMPIRICAL_CORRELATION      // "X correlates with Y (r = Z)"
  EMPIRICAL_CAUSAL           // "X causes Y"
  EMPIRICAL_EFFECT_SIZE      // "The effect of X on Y is d = Z"

  // ═══════════════════════════════════════════════════════════════════════
  // STATISTICAL CLAIMS (4 types)
  // ═══════════════════════════════════════════════════════════════════════
  STATISTICAL_SIGNIFICANCE   // "p < 0.05 for H0: X"
  STATISTICAL_INFERENCE      // "Based on data, we infer θ = X"
  STATISTICAL_PREDICTION     // "Model predicts Y with accuracy Z"
  STATISTICAL_POWER          // "Study has power β to detect effect d"

  // ═══════════════════════════════════════════════════════════════════════
  // METHODOLOGICAL CLAIMS (3 types)
  // ═══════════════════════════════════════════════════════════════════════
  METHODOLOGICAL_VALIDITY    // "Method X validly measures construct Y"
  METHODOLOGICAL_RELIABILITY // "Method X has reliability r"
  METHODOLOGICAL_PROTOCOL    // "Protocol X should be followed for Y"

  // ═══════════════════════════════════════════════════════════════════════
  // MECHANISTIC CLAIMS (3 types)
  // ═══════════════════════════════════════════════════════════════════════
  MECHANISTIC_EXPLANATION    // "Mechanism M explains phenomenon P"
  MECHANISTIC_PATHWAY        // "Process proceeds via steps A→B→C"
  MECHANISTIC_COMPONENT      // "Component X is necessary for function Y"

  // ═══════════════════════════════════════════════════════════════════════
  // MODEL-BASED CLAIMS (4 types)
  // ═══════════════════════════════════════════════════════════════════════
  MODEL_SPECIFICATION        // "Phenomenon P is described by model M"
  MODEL_ASSUMPTION           // "Model M assumes condition C"
  MODEL_PREDICTION           // "Model M predicts observation O"
  MODEL_FIT                  // "Model M fits data D with goodness G"

  // ═══════════════════════════════════════════════════════════════════════
  // COMPUTATIONAL CLAIMS (3 types)
  // ═══════════════════════════════════════════════════════════════════════
  COMPUTATIONAL_RESULT       // "Algorithm A produces output O on input I"
  COMPUTATIONAL_COMPLEXITY   // "Algorithm A has complexity O(f(n))"
  COMPUTATIONAL_CORRECTNESS  // "Implementation I correctly implements A"

  // ═══════════════════════════════════════════════════════════════════════
  // META-SCIENTIFIC CLAIMS (3 types)
  // ═══════════════════════════════════════════════════════════════════════
  META_REPLICATION           // "Finding F has replicated / failed to replicate"
  META_AGGREGATION           // "Meta-analysis yields effect d across k studies"
  META_HETEROGENEITY         // "Effect varies across conditions (I² = X)"
}
```

#### Tasks

| ID | Task | Description | Complexity | Est. Hours |
|----|------|-------------|------------|------------|
| 1.1.1 | Define enum in Prisma | Add STEMClaimType enum to schema.prisma | Low | 2 |
| 1.1.2 | Create TypeScript types | Generate corresponding TS types | Low | 2 |
| 1.1.3 | Add claimCategory field | Add field to Claim model to distinguish HSS/STEM | Low | 2 |
| 1.1.4 | Create claim type metadata | Define display names, descriptions, icons per type | Medium | 8 |
| 1.1.5 | Build type selector UI | Create UI component for selecting STEM claim types | Medium | 16 |

#### Claim Type Metadata Structure

```typescript
// lib/stem/claim-types.ts

interface STEMClaimTypeMetadata {
  type: STEMClaimType;
  category: 'EMPIRICAL' | 'STATISTICAL' | 'METHODOLOGICAL' | 'MECHANISTIC' | 'MODEL' | 'COMPUTATIONAL' | 'META';
  displayName: string;
  description: string;
  example: string;
  icon: string;  // Lucide icon name
  requiredGrounding: GroundingType[];
  optionalGrounding: GroundingType[];
  suggestedSchemes: string[];  // Scheme IDs
}

export const STEM_CLAIM_TYPE_METADATA: Record<STEMClaimType, STEMClaimTypeMetadata> = {
  EMPIRICAL_OBSERVATION: {
    type: 'EMPIRICAL_OBSERVATION',
    category: 'EMPIRICAL',
    displayName: 'Empirical Observation',
    description: 'A claim about what was directly observed under specific conditions',
    example: '"We observed increased neural activity in the prefrontal cortex during task performance"',
    icon: 'Eye',
    requiredGrounding: ['DATA', 'PROTOCOL'],
    optionalGrounding: ['CODE'],
    suggestedSchemes: ['argument-from-observation', 'argument-from-statistical-inference'],
  },
  EMPIRICAL_MEASUREMENT: {
    type: 'EMPIRICAL_MEASUREMENT',
    category: 'EMPIRICAL',
    displayName: 'Empirical Measurement',
    description: 'A claim reporting a specific measured value with uncertainty',
    example: '"The reaction time was 423ms (SD = 67ms)"',
    icon: 'Ruler',
    requiredGrounding: ['DATA', 'PROTOCOL'],
    optionalGrounding: ['CODE', 'EQUIPMENT'],
    suggestedSchemes: ['argument-from-measurement', 'argument-from-statistical-inference'],
  },
  // ... remaining 25 types
};
```

---

### 1.2 Grounding Requirements Model

**Objective**: Define what grounding is required for each claim type to be evaluable.

#### Grounding Types Enum

```prisma
enum GroundingType {
  DATA              // Dataset (measurements, observations)
  CODE              // Analysis code, algorithms
  PROTOCOL          // Experimental/methodological protocol
  MODEL             // Computational or statistical model
  EQUIPMENT         // Equipment specifications, calibration
  PREREGISTRATION   // Pre-registered analysis plan
  RAW_DATA          // Unprocessed raw data
  ENVIRONMENT       // Computational environment spec
}
```

#### Grounding Requirements Matrix

```typescript
// lib/stem/grounding-requirements.ts

interface GroundingRequirement {
  claimType: STEMClaimType;
  required: GroundingType[];
  optional: GroundingType[];
  verificationLevel: 'MINIMAL' | 'STANDARD' | 'COMPREHENSIVE';
}

export const GROUNDING_REQUIREMENTS: Record<STEMClaimType, GroundingRequirement> = {
  EMPIRICAL_MEASUREMENT: {
    claimType: 'EMPIRICAL_MEASUREMENT',
    required: ['DATA', 'PROTOCOL'],
    optional: ['RAW_DATA', 'EQUIPMENT', 'CODE'],
    verificationLevel: 'STANDARD',
  },
  STATISTICAL_SIGNIFICANCE: {
    claimType: 'STATISTICAL_SIGNIFICANCE',
    required: ['DATA', 'CODE'],
    optional: ['PREREGISTRATION', 'RAW_DATA'],
    verificationLevel: 'COMPREHENSIVE',
  },
  COMPUTATIONAL_RESULT: {
    claimType: 'COMPUTATIONAL_RESULT',
    required: ['CODE', 'DATA', 'ENVIRONMENT'],
    optional: ['MODEL'],
    verificationLevel: 'COMPREHENSIVE',
  },
  META_AGGREGATION: {
    claimType: 'META_AGGREGATION',
    required: ['DATA', 'CODE', 'PROTOCOL'],  // Included studies, analysis code, coding protocol
    optional: ['PREREGISTRATION'],
    verificationLevel: 'COMPREHENSIVE',
  },
  // ... remaining types
};
```

#### Tasks

| ID | Task | Description | Complexity | Est. Hours |
|----|------|-------------|------------|------------|
| 1.2.1 | Define GroundingType enum | Add to Prisma schema | Low | 2 |
| 1.2.2 | Create requirements matrix | Define required/optional grounding per claim type | Medium | 8 |
| 1.2.3 | Build validation logic | Function to check if claim meets grounding requirements | Medium | 8 |
| 1.2.4 | Create UI indicators | Show grounding requirements on claim creation | Medium | 12 |

---

### 1.3 GroundedClaim Prisma Schema

**Objective**: Extend the Claim model to support empirical grounding.

#### Schema Extensions

```prisma
// schema.prisma additions

// ═══════════════════════════════════════════════════════════════════════════
// CLAIM MODEL EXTENSION
// ═══════════════════════════════════════════════════════════════════════════

model Claim {
  // ... existing fields ...
  
  // STEM Extensions
  claimCategory       ClaimCategory    @default(HSS)
  stemClaimType       STEMClaimType?
  
  // Grounding relations
  groundingStatus     GroundingStatus  @default(UNGROUNDED)
  groundingStatusUpdatedAt DateTime?
  
  datasetAnchors      DatasetAnchor[]
  codeAnchors         CodeAnchor[]
  protocolAnchors     ProtocolAnchor[]
  modelAnchors        ModelAnchor[]
  
  // Verification & Replication
  verificationReports VerificationReport[]
  replications        Replication[]    @relation("OriginalClaim")
  replicatingClaims   Replication[]    @relation("ReplicatingClaim")
  
  // Predictions (Picturing Face)
  predictions         ClaimPrediction[]
}

enum ClaimCategory {
  HSS     // Humanities & Social Sciences (existing)
  STEM    // Science, Technology, Engineering, Mathematics
  MIXED   // Claims that span both
}

enum GroundingStatus {
  UNGROUNDED          // No empirical grounding linked
  PARTIALLY_GROUNDED  // Some required grounding missing
  GROUNDED            // All required grounding linked, not verified
  VERIFIED            // Grounding verified accessible/valid
  REPRODUCED          // Independent reproduction succeeded
  VERIFICATION_FAILED // Verification or reproduction failed
  CONTESTED           // Conflicting verification/reproduction results
}

// ═══════════════════════════════════════════════════════════════════════════
// GROUNDING ANCHOR MODELS
// ═══════════════════════════════════════════════════════════════════════════

model DatasetAnchor {
  id              String   @id @default(cuid())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Claim relation
  claimId         String
  claim           Claim    @relation(fields: [claimId], references: [id], onDelete: Cascade)
  
  // External reference
  repositoryType  DataRepository
  externalId      String          // DOI or repository-specific ID
  externalUrl     String
  
  // Specificity
  subset          String?         // Which part of dataset (table, column, rows)
  version         String?         // Dataset version
  
  // Verification
  accessStatus    AccessStatus    @default(UNKNOWN)
  lastVerified    DateTime?
  hashAtVerification String?      // Hash of data at verification time
  
  // Metadata
  title           String?
  description     String?
  dataType        DataType?
  sizeBytes       BigInt?
  
  // Audit
  createdById     BigInt
  createdBy       User            @relation(fields: [createdById], references: [id])
  
  @@index([claimId])
  @@index([repositoryType, externalId])
}

model CodeAnchor {
  id              String   @id @default(cuid())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Claim relation
  claimId         String
  claim           Claim    @relation(fields: [claimId], references: [id], onDelete: Cascade)
  
  // External reference
  repositoryType  CodeRepository
  repositoryUrl   String
  commitHash      String?         // Specific commit (immutable reference)
  tag             String?         // Release tag
  branch          String?         // Branch name (mutable, for reference only)
  
  // Specificity
  filePath        String?         // Specific file
  lineStart       Int?            // Start line
  lineEnd         Int?            // End line
  functionName    String?         // Specific function/method
  
  // Environment
  language        String?
  languageVersion String?
  dependencies    Json?           // Parsed requirements.txt, package.json, etc.
  dockerImage     String?         // Container reference
  binderUrl       String?         // Binder launch URL
  
  // Verification
  accessStatus    AccessStatus    @default(UNKNOWN)
  lastVerified    DateTime?
  executableStatus ExecutableStatus?
  
  // Metadata
  title           String?
  description     String?
  
  // Audit
  createdById     BigInt
  createdBy       User            @relation(fields: [createdById], references: [id])
  
  @@index([claimId])
  @@index([repositoryType, repositoryUrl])
}

model ProtocolAnchor {
  id              String   @id @default(cuid())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Claim relation
  claimId         String
  claim           Claim    @relation(fields: [claimId], references: [id], onDelete: Cascade)
  
  // External reference
  repositoryType  ProtocolRepository
  externalId      String
  externalUrl     String
  
  // Specificity
  section         String?         // Which section of protocol
  stepNumber      Int?            // Which step
  version         String?
  
  // Verification
  accessStatus    AccessStatus    @default(UNKNOWN)
  lastVerified    DateTime?
  
  // Metadata
  title           String?
  description     String?
  
  // Audit
  createdById     BigInt
  createdBy       User            @relation(fields: [createdById], references: [id])
  
  @@index([claimId])
}

model ModelAnchor {
  id              String   @id @default(cuid())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Claim relation
  claimId         String
  claim           Claim    @relation(fields: [claimId], references: [id], onDelete: Cascade)
  
  // External reference
  repositoryType  ModelRepository
  externalId      String
  externalUrl     String
  
  // Model details
  modelType       String?         // "neural_network", "statistical", "simulation", etc.
  framework       String?         // "pytorch", "tensorflow", "stan", etc.
  version         String?
  
  // Verification
  accessStatus    AccessStatus    @default(UNKNOWN)
  lastVerified    DateTime?
  
  // Metadata
  title           String?
  description     String?
  
  // Audit
  createdById     BigInt
  createdBy       User            @relation(fields: [createdById], references: [id])
  
  @@index([claimId])
}

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS FOR ANCHORS
// ═══════════════════════════════════════════════════════════════════════════

enum DataRepository {
  ZENODO
  FIGSHARE
  DRYAD
  OSF
  DATAVERSE
  PANGAEA
  GENBANK
  PDB
  GEO
  ARRAYEXPRESS
  ICPSR
  UK_DATA_SERVICE
  HUGGINGFACE
  KAGGLE
  OPENML
  CUSTOM
}

enum CodeRepository {
  GITHUB
  GITLAB
  BITBUCKET
  ZENODO
  CODE_OCEAN
  BINDER
  SOFTWARE_HERITAGE
  HUGGINGFACE
  PYPI
  NPM
  CUSTOM
}

enum ProtocolRepository {
  PROTOCOLS_IO
  NATURE_PROTOCOLS
  JOVE
  STAR_PROTOCOLS
  PROTOCOL_EXCHANGE
  CUSTOM
}

enum ModelRepository {
  HUGGINGFACE
  PYTORCH_HUB
  TENSORFLOW_HUB
  MODEL_ZOO
  ZENODO
  CUSTOM
}

enum AccessStatus {
  UNKNOWN           // Not yet checked
  ACCESSIBLE        // Publicly accessible
  RESTRICTED        // Requires authentication/approval
  EMBARGOED         // Temporarily unavailable
  UNAVAILABLE       // Not accessible (404, removed)
}

enum ExecutableStatus {
  UNTESTED          // Not yet executed
  PASSES            // Execution succeeded
  FAILS             // Execution failed
  PARTIAL           // Some tests pass, some fail
}

enum DataType {
  TABULAR           // CSV, Excel, etc.
  IMAGE             // Image files
  SEQUENCE          // Genomic/protein sequences
  TEXT              // Text corpora
  AUDIO             // Audio files
  VIDEO             // Video files
  TIMESERIES        // Time series data
  GRAPH             // Network/graph data
  SPATIAL           // GIS/geospatial
  MIXED             // Multiple types
}
```

#### Tasks

| ID | Task | Description | Complexity | Est. Hours |
|----|------|-------------|------------|------------|
| 1.3.1 | Add enums to schema | Add all new enums (STEMClaimType, GroundingStatus, etc.) | Low | 4 |
| 1.3.2 | Extend Claim model | Add STEM fields and relations to Claim | Medium | 8 |
| 1.3.3 | Create anchor models | Add DatasetAnchor, CodeAnchor, ProtocolAnchor, ModelAnchor | Medium | 8 |
| 1.3.4 | Create migration | Generate and test Prisma migration | Medium | 8 |
| 1.3.5 | Update Prisma client | Regenerate client, verify TypeScript types | Low | 2 |
| 1.3.6 | Add indexes | Ensure proper indexing for query performance | Low | 4 |

#### Migration Strategy

```sql
-- Migration: Add STEM claim extensions

-- Step 1: Add new enums (Prisma handles this)

-- Step 2: Add columns to Claim table
ALTER TABLE "Claim" ADD COLUMN "claimCategory" "ClaimCategory" DEFAULT 'HSS';
ALTER TABLE "Claim" ADD COLUMN "stemClaimType" "STEMClaimType";
ALTER TABLE "Claim" ADD COLUMN "groundingStatus" "GroundingStatus" DEFAULT 'UNGROUNDED';
ALTER TABLE "Claim" ADD COLUMN "groundingStatusUpdatedAt" TIMESTAMP;

-- Step 3: Create anchor tables (Prisma handles this)

-- Step 4: Backfill existing claims
UPDATE "Claim" SET "claimCategory" = 'HSS' WHERE "claimCategory" IS NULL;
```

---

### 1.4 GroundingStatus Computation Engine

**Objective**: Implement logic to compute and update grounding status for claims.

#### Computation Logic

```typescript
// lib/stem/grounding-status.ts

import { Claim, GroundingStatus, STEMClaimType } from "@prisma/client";
import { GROUNDING_REQUIREMENTS } from "./grounding-requirements";

interface ClaimWithAnchors extends Claim {
  datasetAnchors: Array<{ accessStatus: AccessStatus }>;
  codeAnchors: Array<{ accessStatus: AccessStatus; executableStatus?: ExecutableStatus }>;
  protocolAnchors: Array<{ accessStatus: AccessStatus }>;
  modelAnchors: Array<{ accessStatus: AccessStatus }>;
  replications: Array<{ status: ReplicationStatus }>;
  verificationReports: Array<{ verdict: VerificationVerdict }>;
}

export function computeGroundingStatus(claim: ClaimWithAnchors): GroundingStatus {
  // Non-STEM claims are always considered grounded differently
  if (claim.claimCategory !== "STEM" || !claim.stemClaimType) {
    return GroundingStatus.UNGROUNDED; // Or handle HSS differently
  }

  const requirements = GROUNDING_REQUIREMENTS[claim.stemClaimType];
  if (!requirements) {
    return GroundingStatus.UNGROUNDED;
  }

  // Check which grounding types are present
  const presentGrounding = new Set<GroundingType>();
  
  if (claim.datasetAnchors.length > 0) presentGrounding.add("DATA");
  if (claim.codeAnchors.length > 0) presentGrounding.add("CODE");
  if (claim.protocolAnchors.length > 0) presentGrounding.add("PROTOCOL");
  if (claim.modelAnchors.length > 0) presentGrounding.add("MODEL");

  // Check if all required grounding is present
  const missingRequired = requirements.required.filter(
    (g) => !presentGrounding.has(g)
  );

  if (missingRequired.length === requirements.required.length) {
    return GroundingStatus.UNGROUNDED;
  }

  if (missingRequired.length > 0) {
    return GroundingStatus.PARTIALLY_GROUNDED;
  }

  // All required grounding present - check accessibility
  const allAnchors = [
    ...claim.datasetAnchors,
    ...claim.codeAnchors,
    ...claim.protocolAnchors,
    ...claim.modelAnchors,
  ];

  const accessStatuses = allAnchors.map((a) => a.accessStatus);

  // Check for any unavailable resources
  if (accessStatuses.some((s) => s === "UNAVAILABLE")) {
    return GroundingStatus.VERIFICATION_FAILED;
  }

  // Check for unknown (not yet verified) status
  if (accessStatuses.some((s) => s === "UNKNOWN")) {
    return GroundingStatus.GROUNDED;
  }

  // All accessible - check replications
  if (claim.replications.length > 0) {
    const successful = claim.replications.filter(
      (r) => r.status === "SUCCESSFUL"
    );
    const failed = claim.replications.filter((r) => r.status === "FAILED");

    if (successful.length > 0 && failed.length > 0) {
      return GroundingStatus.CONTESTED;
    }
    if (successful.length > 0) {
      return GroundingStatus.REPRODUCED;
    }
    if (failed.length > 0) {
      return GroundingStatus.VERIFICATION_FAILED;
    }
  }

  // Check verification reports
  if (claim.verificationReports.length > 0) {
    const latestReport = claim.verificationReports[0]; // Assume sorted by date
    if (latestReport.verdict === "VERIFIED") {
      return GroundingStatus.VERIFIED;
    }
    if (latestReport.verdict === "NOT_VERIFIED") {
      return GroundingStatus.VERIFICATION_FAILED;
    }
  }

  // All resources accessible but not independently verified
  return GroundingStatus.VERIFIED;
}

// Background job to recompute grounding status
export async function recomputeGroundingStatusForClaim(
  claimId: string
): Promise<GroundingStatus> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      datasetAnchors: { select: { accessStatus: true } },
      codeAnchors: { select: { accessStatus: true, executableStatus: true } },
      protocolAnchors: { select: { accessStatus: true } },
      modelAnchors: { select: { accessStatus: true } },
      replications: { select: { status: true } },
      verificationReports: {
        select: { verdict: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!claim) {
    throw new Error(`Claim ${claimId} not found`);
  }

  const newStatus = computeGroundingStatus(claim);

  if (newStatus !== claim.groundingStatus) {
    await prisma.claim.update({
      where: { id: claimId },
      data: {
        groundingStatus: newStatus,
        groundingStatusUpdatedAt: new Date(),
      },
    });
  }

  return newStatus;
}
```

#### Tasks

| ID | Task | Description | Complexity | Est. Hours |
|----|------|-------------|------------|------------|
| 1.4.1 | Implement computation function | Core `computeGroundingStatus` function | Medium | 8 |
| 1.4.2 | Create update trigger | Update status on anchor add/remove/update | Medium | 8 |
| 1.4.3 | Build background recomputation job | Worker job to periodically recompute statuses | Medium | 12 |
| 1.4.4 | Add status change events | Emit events when grounding status changes | Medium | 8 |
| 1.4.5 | Create API endpoints | GET/POST endpoints for grounding status | Medium | 8 |
| 1.4.6 | Write unit tests | Test all status computation paths | Medium | 12 |

---

### 1.5 Migration Strategy for Existing Claims

**Objective**: Safely migrate existing HSS claims without disruption.

#### Migration Approach

```typescript
// scripts/migrations/migrate-to-stem-ontology.ts

import { prisma } from "@/lib/prisma";

export async function migrateClaimsToSTEMOntology() {
  console.log("Starting STEM ontology migration...");

  // Step 1: Set all existing claims to HSS category
  const updateResult = await prisma.claim.updateMany({
    where: {
      claimCategory: null,
    },
    data: {
      claimCategory: "HSS",
      groundingStatus: "UNGROUNDED", // HSS claims start ungrounded (no STEM grounding)
    },
  });

  console.log(`Updated ${updateResult.count} claims to HSS category`);

  // Step 2: Verify migration
  const hssCount = await prisma.claim.count({
    where: { claimCategory: "HSS" },
  });

  const stemCount = await prisma.claim.count({
    where: { claimCategory: "STEM" },
  });

  const nullCount = await prisma.claim.count({
    where: { claimCategory: null },
  });

  console.log(`Migration complete:`);
  console.log(`  HSS claims: ${hssCount}`);
  console.log(`  STEM claims: ${stemCount}`);
  console.log(`  Null category: ${nullCount}`);

  if (nullCount > 0) {
    console.warn("WARNING: Some claims still have null category!");
  }
}

// Rollback function
export async function rollbackSTEMOntologyMigration() {
  console.log("Rolling back STEM ontology migration...");

  // Remove STEM-specific fields (set to null)
  await prisma.claim.updateMany({
    data: {
      stemClaimType: null,
      groundingStatus: "UNGROUNDED",
      groundingStatusUpdatedAt: null,
    },
  });

  // Delete any anchor records
  await prisma.datasetAnchor.deleteMany({});
  await prisma.codeAnchor.deleteMany({});
  await prisma.protocolAnchor.deleteMany({});
  await prisma.modelAnchor.deleteMany({});

  console.log("Rollback complete");
}
```

#### Tasks

| ID | Task | Description | Complexity | Est. Hours |
|----|------|-------------|------------|------------|
| 1.5.1 | Write migration script | Script to categorize existing claims as HSS | Low | 4 |
| 1.5.2 | Write rollback script | Script to reverse migration if needed | Low | 4 |
| 1.5.3 | Test on staging | Run migration on staging environment | Medium | 8 |
| 1.5.4 | Create backup procedure | Document database backup before migration | Low | 2 |
| 1.5.5 | Execute production migration | Run migration on production with monitoring | Medium | 4 |

---

## Phase 0-1 Summary

### Total Estimated Hours

| Phase | Hours |
|-------|-------|
| Phase 0: Prerequisites & Audit | 70 |
| Phase 1: Extended Claim Ontology | 130 |
| **Total** | **200 hours** |

### Deliverables Checklist

- [ ] `PLATFORM_AUDIT_REPORT.md` - Current architecture documentation
- [ ] `SCHEMA_EXTENSION_PLAN.md` - Database extension strategy
- [ ] `API_VERSIONING_POLICY.md` - API evolution rules
- [ ] Extended Prisma schema with all new models and enums
- [ ] Migration files for schema changes
- [ ] `computeGroundingStatus` function with tests
- [ ] Grounding status update triggers
- [ ] Background job for status recomputation
- [ ] API endpoints for grounding status
- [ ] Migration scripts for existing claims

### Dependencies Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 0-1 DEPENDENCY GRAPH                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  0.1 Platform Audit ──┐                                                     │
│                       ├──▶ 0.2 Schema Extension Points                      │
│  0.3 API Versioning ──┘              │                                      │
│                                      │                                      │
│  0.4 Architecture ───────────────────┤                                      │
│                                      ▼                                      │
│                          ┌───────────────────────┐                          │
│                          │ 1.1 STEM Claim Types  │                          │
│                          └───────────┬───────────┘                          │
│                                      │                                      │
│                                      ▼                                      │
│                          ┌───────────────────────┐                          │
│                          │ 1.2 Grounding Reqs    │                          │
│                          └───────────┬───────────┘                          │
│                                      │                                      │
│                                      ▼                                      │
│                          ┌───────────────────────┐                          │
│                          │ 1.3 Prisma Schema     │                          │
│                          └───────────┬───────────┘                          │
│                                      │                                      │
│                          ┌───────────┴───────────┐                          │
│                          ▼                       ▼                          │
│              ┌───────────────────┐   ┌───────────────────┐                  │
│              │ 1.4 Status Engine │   │ 1.5 Migration     │                  │
│              └───────────────────┘   └───────────────────┘                  │
│                          │                       │                          │
│                          └───────────┬───────────┘                          │
│                                      ▼                                      │
│                          ┌───────────────────────┐                          │
│                          │ READY FOR PART II     │                          │
│                          │ (Empirical Grounding) │                          │
│                          └───────────────────────┘                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Risk Register (Part I)

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Existing claim queries break | High | Medium | Thorough testing, default values, gradual rollout |
| Large enum causes TypeScript issues | Low | Low | Generate types incrementally, use string unions if needed |
| Migration corrupts existing data | Critical | Low | Full backup, staging test, rollback scripts ready |
| Grounding status computation too slow | Medium | Medium | Async computation, caching, background jobs |
| API breaking changes affect clients | High | Medium | Versioning, deprecation warnings, client communication |

---

## Next Steps

After Part I completion:
1. **Part II: Empirical Grounding Layer** - Implement anchor creation, external repository integration, and verification engine
2. Begin parallel work on **Part VI: STEM Argumentation Schemes** (low dependency on Part II)

---

*Document created: January 31, 2026*  
*Next review: After Phase 0 completion*
