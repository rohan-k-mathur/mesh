# Sellarsian Mesh Platform: Implementation Roadmap

**Purpose:** Translate the Sellarsian philosophical foundation into concrete development work for the Mesh platform.

**Foundation Documents:**
- `SELLARS_DEEP_STUDY.md` (Part 1: Core synthesis)
- `SELLARS_DEEP_STUDY_PT2.md` (Part 2: Applications, EnhancedArgumentScheme, Component Mapping)
- `SELLARS_DEEP_STUDY_PT3.md` (Part 3: Advanced integration, Final Synthesis)

**Document Status:** Phase 1 in development

---

## Roadmap Overview

| Phase | Focus | Key Deliverables | Sellarsian Concepts |
|-------|-------|-----------------|---------------------|
| **1** | **Core Infrastructure** | **Dual Characterization Data Models** | **Janus-faced representations** |
| 2 | Inference Ticket System | Scheme + CQ Implementation | Material inference, Inference tickets |
| 3 | Grounding Semantics | Label Propagation, Defeat Handling | Normative status, Space of reasons |
| 4 | Developmental Scaffolding | ARSA → ARSD UX Patterns | Bildung, Ought-to-be's |
| 5 | Community Substrate | We-Intentions, Collective Memory | Linguistic community as minimal unit |
| 6 | Picturing Layer | Evidence Links, Outcome Tracking | Signifying vs. Picturing |

---

# Phase 1: Core Infrastructure — Dual Characterization Data Models

## 1.1 Requirements: What Dual Characterization Means

### The Sellarsian Principle

Every contribution in the platform is **Janus-faced**:
1. **Space of Reasons (Signifying):** Its meaning as determined by inferential role, normative status, commitments, entitlements
2. **Realm of Law (Picturing):** Its causal history, correspondence to domain facts, practical outcomes

These are **irreducible** to each other. We must track both explicitly.

### Current Schema Analysis

The existing Mesh schema has **partial** coverage of both faces, but they're not explicitly separated:

| Entity | Current "Signifying" Coverage | Current "Picturing" Coverage | Gaps |
|--------|------------------------------|------------------------------|------|
| **Claim** | ClaimLabel (IN/OUT/UNDEC), ClaimEdge (support/attack), ClaimStats | createdById, createdAt, ClaimEvidence, ClaimCitation | No explicit commitment tracking per-user; no outcome tracking |
| **Argument** | scheme relations, ArgumentEdge (attack types), premises/conclusion | authorId, createdAt, sources | No defeat status; no prediction/outcome links |
| **ClaimEdge** | type, attackType, targetScope | createdAt, metaJson | No entitlement propagation tracking |
| **Deliberation** | Cluster, tags, arguments, claims | createdById, createdAt | No community-level commitment aggregation |

### Requirements for Dual Characterization

#### R1: Explicit Signifying Model per Contribution

Each Claim and Argument needs an explicit **inferential position** record:

```typescript
interface InferentialPosition {
  // Identity
  entityType: 'Claim' | 'Argument';
  entityId: string;
  deliberationId: string;
  
  // Inferential relations (computed from edges, but cached for performance)
  entails: string[];         // What this entity licenses
  entailedBy: string[];      // What licenses this entity
  incompatibleWith: string[];// What contradicts this entity
  presupposes: string[];     // What this entity requires
  
  // Normative status (from grounding semantics + defeat analysis)
  labelStatus: 'IN' | 'OUT' | 'UNDEC';
  defeatStatus: 'undefeated' | 'rebutted' | 'undercut' | 'undermined';
  defeaterId?: string;       // Which entity defeated this one
  
  // Scheme participation
  schemeRoles: SchemeRoleRecord[];
  
  // Computed at / version tracking
  computedAt: Date;
  version: number;
}
```

#### R2: Explicit Commitment Tracking

Who is committed to what claims? Currently `Commitment` exists but is under-utilized.

```typescript
interface CommitmentRecord {
  deliberationId: string;
  participantId: string;      // User who is committed
  claimId: string;            // What they're committed to
  commitmentType: 'assert' | 'concede' | 'presuppose' | 'challenge-burden';
  
  // Commitment lifecycle
  status: 'active' | 'retracted' | 'superseded';
  introducedAt: Date;
  introducedVia: string;      // DialogueMove or direct action
  retractedAt?: Date;
  retractedVia?: string;
  
  // Entitlement tracking
  entitlementBasis: 'testimony' | 'inference' | 'default' | 'authority';
  challengeCount: number;
  defenseCount: number;
}
```

#### R3: Explicit Picturing Model per Contribution

Each Claim needs a **domain correspondence** record:

```typescript
interface PicturingRecord {
  // Identity
  claimId: string;
  deliberationId: string;
  
  // Causal provenance (realm of law)
  authorId: string;
  createdAt: Date;
  editHistory: EditRecord[];
  sourceTrigger?: string;     // What caused this claim to be made
  
  // Domain correspondence
  domainReferences: DomainReference[];  // Links to external entities/facts
  evidenceLinks: EvidenceLink[];        // ClaimEvidence expanded
  
  // Outcome tracking (for practical failure visibility)
  predictions: PredictionRecord[];
  outcomes: OutcomeRecord[];
  
  // Picturing accuracy (computed from outcomes)
  predictionAccuracy?: number;  // 0.0-1.0 based on confirmed outcomes
  lastOutcomeAt?: Date;
}
```

#### R4: Unified Dual-Characterization View

A unified interface that combines both faces:

```typescript
interface DualCharacterization {
  entityType: 'Claim' | 'Argument';
  entityId: string;
  
  // Face 1: Space of Reasons
  signifying: {
    inferentialPosition: InferentialPosition;
    commitments: CommitmentRecord[];
    schemeParticipation: SchemeRoleRecord[];
  };
  
  // Face 2: Realm of Law
  picturing: {
    provenance: ProvenanceRecord;
    domainCorrespondence: DomainCorrespondence;
    outcomeTracking: OutcomeTracking;
  };
  
  // Neither face reducible to the other
  // Both maintained in parallel
}
```

---

## 1.2 Schema Design: Prisma Model Extensions

### New Models to Add

#### 1.2.1 InferentialPosition Model

```prisma
// Sellarsian Dual Characterization: Signifying Face
// Caches the inferential position of each claim/argument in the space of reasons
model InferentialPosition {
  id             String   @id @default(cuid())
  deliberationId String
  
  // Polymorphic reference to Claim or Argument
  entityType     String   // 'Claim' | 'Argument'
  entityId       String
  
  // Cached inferential relations (computed from edges)
  entails        String[] @default([])
  entailedBy     String[] @default([])
  incompatibleWith String[] @default([])
  presupposes    String[] @default([])
  
  // Normative status
  labelStatus    GroundLabel @default(UNDEC)
  defeatStatus   DefeatStatus @default(undefeated)
  defeaterId     String?
  defeaterType   String?      // 'Claim' | 'Argument' | 'ClaimEdge'
  
  // Version tracking for cache invalidation
  computedAt     DateTime @default(now())
  version        Int      @default(1)
  
  // Indexes
  @@unique([entityType, entityId])
  @@index([deliberationId])
  @@index([deliberationId, labelStatus])
  @@index([deliberationId, defeatStatus])
}

enum DefeatStatus {
  undefeated
  rebutted
  undercut
  undermined
}
```

#### 1.2.2 Enhanced Commitment Model

```prisma
// Sellarsian Commitment Tracking
// Who is committed to what, and with what entitlement basis
model ClaimCommitment {
  id             String   @id @default(cuid())
  deliberationId String
  participantId  String   // userId
  claimId        String
  
  // Commitment type following dialogue game semantics
  commitmentType CommitmentType @default(assert)
  
  // Lifecycle
  status         CommitmentStatus @default(active)
  introducedAt   DateTime @default(now())
  introducedVia  String?  // DialogueMove ID or 'direct'
  retractedAt    DateTime?
  retractedVia   String?
  supersededBy   String?  // New commitment that replaces this one
  
  // Entitlement tracking (Brandom/Sellars)
  entitlementBasis EntitlementBasis @default(testimony)
  challengeCount Int      @default(0)
  defenseCount   Int      @default(0)
  
  // Relations
  claim          Claim    @relation("ClaimCommitments", fields: [claimId], references: [id], onDelete: Cascade)
  
  @@unique([deliberationId, participantId, claimId, status])
  @@index([deliberationId, participantId])
  @@index([deliberationId, claimId])
  @@index([participantId, status])
}

enum CommitmentType {
  assert         // Direct assertion
  concede        // Conceded to opponent's point
  presuppose     // Background commitment
  challengeBurden // Committed via burden shift from challenge
  infer          // Derived commitment from inference
}

enum CommitmentStatus {
  active
  retracted
  superseded
  defeated       // Commitment stands but claim is defeated
}

enum EntitlementBasis {
  testimony      // Someone said so (default)
  inference      // Derived from other commitments
  defaultRule    // Default presumption
  authority      // Expert/authoritative source
  evidence       // Empirical evidence
  concession     // Opponent conceded
}
```

#### 1.2.3 PicturingRecord Model

```prisma
// Sellarsian Dual Characterization: Picturing Face
// Tracks domain correspondence and practical outcomes
model PicturingRecord {
  id             String   @id @default(cuid())
  deliberationId String
  claimId        String   @unique
  
  // Provenance (causal history)
  authorId       String
  createdAt      DateTime @default(now())
  lastEditedAt   DateTime @default(now())
  editCount      Int      @default(0)
  sourceTrigger  String?  // What caused this claim (e.g., "response to X")
  
  // Domain correspondence
  domainType     String?  // 'empirical' | 'normative' | 'procedural' | 'definitional'
  domainEntities Json?    // External entity references
  
  // Outcome tracking
  hasPredictions Boolean  @default(false)
  predictionCount Int     @default(0)
  confirmedCount Int      @default(0)
  disconfirmedCount Int   @default(0)
  pendingCount   Int      @default(0)
  
  // Computed accuracy (null if no predictions)
  predictionAccuracy Float?
  lastOutcomeAt  DateTime?
  
  // Relations
  claim          Claim    @relation("ClaimPicturing", fields: [claimId], references: [id], onDelete: Cascade)
  predictions    ClaimPrediction[]
  outcomes       ClaimOutcome[]
  
  @@index([deliberationId])
  @@index([deliberationId, hasPredictions])
  @@index([authorId])
}

// Prediction made based on a claim
model ClaimPrediction {
  id             String   @id @default(cuid())
  picturingId    String
  claimId        String
  
  // The prediction
  predictionText String   @db.Text
  targetDate     DateTime?
  confidence     Float    @default(0.5)
  
  // Status
  status         PredictionStatus @default(pending)
  outcomeId      String?
  
  createdAt      DateTime @default(now())
  createdById    String
  
  picturing      PicturingRecord @relation(fields: [picturingId], references: [id], onDelete: Cascade)
  outcome        ClaimOutcome?   @relation(fields: [outcomeId], references: [id])
  
  @@index([picturingId])
  @@index([claimId])
  @@index([status])
}

enum PredictionStatus {
  pending
  confirmed
  disconfirmed
  superseded
  withdrawn
}

// Observed outcome linked to predictions
model ClaimOutcome {
  id             String   @id @default(cuid())
  deliberationId String
  
  // The outcome
  outcomeText    String   @db.Text
  observedAt     DateTime @default(now())
  observedById   String
  
  // Evidence for outcome
  evidenceLinks  Json?    // Links to external verification
  
  // Linked predictions
  predictions    ClaimPrediction[]
  
  createdAt      DateTime @default(now())
  
  @@index([deliberationId])
  @@index([observedAt])
}
```

#### 1.2.4 Claim Model Extensions

```prisma
// Add to existing Claim model:
model Claim {
  // ... existing fields ...
  
  // NEW: Dual Characterization relations
  inferentialPosition InferentialPosition? @relation("ClaimInferentialPosition")
  picturingRecord     PicturingRecord?     @relation("ClaimPicturing")
  commitments         ClaimCommitment[]    @relation("ClaimCommitments")
  
  // NEW: Quick access flags (computed, for filtering)
  hasActiveCommitments Boolean @default(false)
  hasPredictions       Boolean @default(false)
  
  // ... existing relations ...
}
```

---

## 1.3 API Layer Design

### 1.3.1 Core Service: DualCharacterizationService

```typescript
// services/dualCharacterization.ts

interface DualCharacterizationService {
  // === SIGNIFYING OPERATIONS ===
  
  /**
   * Recompute inferential position for an entity after graph changes
   */
  recomputeInferentialPosition(
    entityType: 'Claim' | 'Argument',
    entityId: string,
    deliberationId: string
  ): Promise<InferentialPosition>;
  
  /**
   * Get all commitments for a claim
   */
  getClaimCommitments(claimId: string): Promise<ClaimCommitment[]>;
  
  /**
   * Record a new commitment (with entitlement basis)
   */
  recordCommitment(params: {
    deliberationId: string;
    participantId: string;
    claimId: string;
    commitmentType: CommitmentType;
    entitlementBasis: EntitlementBasis;
    introducedVia?: string;
  }): Promise<ClaimCommitment>;
  
  /**
   * Retract a commitment
   */
  retractCommitment(
    commitmentId: string,
    retractedVia?: string
  ): Promise<ClaimCommitment>;
  
  /**
   * Propagate defeat status after attack
   */
  propagateDefeat(
    attackEdgeId: string,
    defeatType: DefeatStatus
  ): Promise<InferentialPosition[]>;
  
  // === PICTURING OPERATIONS ===
  
  /**
   * Initialize picturing record for new claim
   */
  initializePicturing(
    claimId: string,
    authorId: string,
    domainType?: string
  ): Promise<PicturingRecord>;
  
  /**
   * Add a prediction to a claim
   */
  addPrediction(params: {
    claimId: string;
    predictionText: string;
    targetDate?: Date;
    confidence?: number;
    createdById: string;
  }): Promise<ClaimPrediction>;
  
  /**
   * Record an outcome
   */
  recordOutcome(params: {
    deliberationId: string;
    outcomeText: string;
    observedById: string;
    evidenceLinks?: string[];
    linkedPredictionIds?: string[];
  }): Promise<ClaimOutcome>;
  
  /**
   * Recompute picturing accuracy after new outcome
   */
  recomputePicturingAccuracy(claimId: string): Promise<PicturingRecord>;
  
  // === UNIFIED OPERATIONS ===
  
  /**
   * Get full dual characterization for an entity
   */
  getDualCharacterization(
    entityType: 'Claim' | 'Argument',
    entityId: string
  ): Promise<DualCharacterization>;
  
  /**
   * Batch recompute for deliberation (after major changes)
   */
  recomputeDeliberation(deliberationId: string): Promise<{
    positionsUpdated: number;
    commitmentsUpdated: number;
    picturingUpdated: number;
  }>;
}
```

### 1.3.2 API Endpoints

```typescript
// New endpoints for /api/deliberation/[id]/

// GET /api/deliberation/[id]/claim/[claimId]/characterization
// Returns full dual characterization for a claim
interface ClaimCharacterizationResponse {
  claim: Claim;
  signifying: {
    inferentialPosition: InferentialPosition;
    commitments: ClaimCommitment[];
    schemeRoles: SchemeRoleRecord[];
    labelStatus: GroundLabel;
    defeatStatus: DefeatStatus;
  };
  picturing: {
    provenance: {
      authorId: string;
      createdAt: Date;
      editCount: number;
    };
    domainType: string | null;
    predictions: ClaimPrediction[];
    outcomes: ClaimOutcome[];
    accuracy: number | null;
  };
}

// POST /api/deliberation/[id]/claim/[claimId]/commitment
// Record a commitment to this claim
interface RecordCommitmentRequest {
  commitmentType: CommitmentType;
  entitlementBasis?: EntitlementBasis;
}

// DELETE /api/deliberation/[id]/commitment/[commitmentId]
// Retract a commitment

// POST /api/deliberation/[id]/claim/[claimId]/prediction
// Add a prediction based on this claim
interface AddPredictionRequest {
  predictionText: string;
  targetDate?: string;
  confidence?: number;
}

// POST /api/deliberation/[id]/outcome
// Record an observed outcome
interface RecordOutcomeRequest {
  outcomeText: string;
  evidenceLinks?: string[];
  linkedPredictionIds?: string[];
}
```

---

## 1.4 Migration Strategy

### Step 1: Add New Models (Non-Breaking)

```bash
# Add the new models to schema.prisma
# Run migration
npx prisma db push
```

### Step 2: Backfill InferentialPosition

```typescript
// scripts/backfill-inferential-positions.ts

async function backfillInferentialPositions() {
  // Get all deliberations
  const deliberations = await prisma.deliberation.findMany({
    select: { id: true }
  });
  
  for (const delib of deliberations) {
    // Get all claims in deliberation
    const claims = await prisma.claim.findMany({
      where: { deliberationId: delib.id },
      include: {
        ClaimLabel: true,
        edgesFrom: true,
        edgesTo: true,
      }
    });
    
    for (const claim of claims) {
      // Compute inferential position from existing edges
      const entails = claim.edgesFrom
        .filter(e => e.type === 'SUPPORTS')
        .map(e => e.toClaimId);
      const entailedBy = claim.edgesTo
        .filter(e => e.type === 'SUPPORTS')
        .map(e => e.fromClaimId);
      const incompatibleWith = [
        ...claim.edgesFrom.filter(e => e.attackType).map(e => e.toClaimId),
        ...claim.edgesTo.filter(e => e.attackType).map(e => e.fromClaimId),
      ];
      
      await prisma.inferentialPosition.upsert({
        where: { entityType_entityId: { entityType: 'Claim', entityId: claim.id } },
        create: {
          deliberationId: delib.id,
          entityType: 'Claim',
          entityId: claim.id,
          entails,
          entailedBy,
          incompatibleWith,
          labelStatus: claim.ClaimLabel?.label ?? 'UNDEC',
          defeatStatus: 'undefeated', // Will be computed by grounding semantics
        },
        update: {
          entails,
          entailedBy,
          incompatibleWith,
          labelStatus: claim.ClaimLabel?.label ?? 'UNDEC',
        }
      });
    }
  }
}
```

### Step 3: Backfill PicturingRecord

```typescript
// scripts/backfill-picturing-records.ts

async function backfillPicturingRecords() {
  // Get all claims
  const claims = await prisma.claim.findMany({
    include: {
      ClaimEvidence: true,
    }
  });
  
  for (const claim of claims) {
    await prisma.picturingRecord.upsert({
      where: { claimId: claim.id },
      create: {
        deliberationId: claim.deliberationId ?? '',
        claimId: claim.id,
        authorId: claim.createdById,
        createdAt: claim.createdAt,
        hasPredictions: false,
        domainType: inferDomainType(claim.text), // Heuristic
      },
      update: {}
    });
  }
}

function inferDomainType(text: string): string {
  // Simple heuristic - can be improved with NLP
  if (text.match(/should|ought|must|right|wrong/i)) return 'normative';
  if (text.match(/will|predict|expect|forecast/i)) return 'empirical';
  if (text.match(/means|defined as|refers to/i)) return 'definitional';
  return 'empirical'; // default
}
```

### Step 4: Hook Into Existing Operations

Update existing claim/argument creation and edge operations to maintain dual characterization:

```typescript
// In claim creation flow
async function createClaim(params: CreateClaimParams) {
  const claim = await prisma.claim.create({ ... });
  
  // Initialize dual characterization
  await dualCharacterizationService.initializePicturing(
    claim.id,
    params.authorId,
    params.domainType
  );
  
  // Initialize inferential position (empty, will be populated by edges)
  await prisma.inferentialPosition.create({
    data: {
      deliberationId: params.deliberationId,
      entityType: 'Claim',
      entityId: claim.id,
      labelStatus: 'UNDEC',
      defeatStatus: 'undefeated',
    }
  });
  
  // Auto-commit author if not a question/challenge
  if (params.commitmentType !== 'challenge') {
    await dualCharacterizationService.recordCommitment({
      deliberationId: params.deliberationId,
      participantId: params.authorId,
      claimId: claim.id,
      commitmentType: 'assert',
      entitlementBasis: 'testimony',
    });
  }
  
  return claim;
}

// In edge creation flow
async function createClaimEdge(params: CreateClaimEdgeParams) {
  const edge = await prisma.claimEdge.create({ ... });
  
  // Recompute inferential positions for affected claims
  await dualCharacterizationService.recomputeInferentialPosition(
    'Claim', params.fromClaimId, params.deliberationId
  );
  await dualCharacterizationService.recomputeInferentialPosition(
    'Claim', params.toClaimId, params.deliberationId
  );
  
  // If attack, propagate defeat
  if (params.attackType) {
    await dualCharacterizationService.propagateDefeat(
      edge.id,
      mapAttackTypeToDefeatStatus(params.attackType)
    );
  }
  
  return edge;
}
```

---

## 1.5 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Schema migration complete | 100% | All new models created, no errors |
| Backfill complete | 100% | All existing claims have InferentialPosition and PicturingRecord |
| API endpoints functional | 100% | All new endpoints return valid responses |
| Dual characterization accessible | < 100ms | getDualCharacterization p95 latency |
| Commitment tracking active | > 50% | Claims with at least one commitment |

---

## Phase 1 Status

- [x] 1.1 Requirements — Complete
- [x] 1.2 Schema Design — Complete
- [x] 1.3 API Layer Design — Complete
- [x] 1.4 Migration Strategy — Complete
- [ ] 1.5 Implementation — Not started
- [ ] 1.6 Testing — Not started

---

## Next Steps

After Phase 1 implementation:
1. **Phase 2:** Implement inference ticket system (schemes as authorization structures)
2. **Phase 3:** Integrate grounding semantics with defeat propagation
3. **Phase 4:** Build adaptive scaffolding based on user developmental stage

---

*Last updated: 2025-12-28*
