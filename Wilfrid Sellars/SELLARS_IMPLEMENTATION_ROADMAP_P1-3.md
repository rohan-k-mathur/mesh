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

# Phase 2: Inference Ticket System — Schemes as Authorization Structures

## 2.1 Requirements: The Sellarsian Inference Ticket

### The Philosophical Foundation

From the Sellars Deep Study, an **inference ticket** is not a description but an *authorization*:

> "The scheme is not describing what inferences people make, but *authorizing* certain inferential moves as legitimate within the community's rational practice."

Key characteristics:
1. **Authorization, not description:** Schemes license moves, they don't just catalog patterns
2. **Defeasibility built-in:** Every ticket has conditions under which it can be revoked (CQs)
3. **Burden allocation:** Tickets specify who must prove what
4. **Community-relative:** Valid tickets are those the community endorses

### Current Schema Analysis

The existing Mesh schema has **strong** argumentation scheme support, but lacks explicit *inference ticket semantics*:

| Component | Current State | Gap for Inference Tickets |
|-----------|--------------|---------------------------|
| **ArgumentScheme** | Rich metadata, CQs, ASPIC+ mapping, hierarchy | No explicit authorization/licensing model |
| **CriticalQuestion** | attackKind, burdenOfProof, premiseType | No defeat condition formalization |
| **CQStatus** | Multi-layer workflow (OPEN→SATISFIED) | No connection to inference authorization |
| **ArgumentSchemeInstance** | Links arguments to schemes with confidence | No ticket "validity" status |

### Requirements for Inference Ticket System

#### R1: Explicit InferenceTicket Model

Each scheme application should generate an explicit "ticket" that tracks authorization status:

```typescript
interface InferenceTicket {
  id: string;
  
  // What transition is authorized
  schemeId: string;
  argumentId: string;           // The argument using this scheme
  deliberationId: string;
  
  // The licensed transition
  from: {
    premiseClaimIds: string[];  // What claims are the premises
    premiseRoles: PremiseRole[];// How each maps to scheme slots
  };
  to: {
    conclusionClaimId: string;  // What claim is licensed
    conclusionRole: string;     // How it maps to scheme conclusion
  };
  
  // Authorization status
  status: TicketStatus;         // 'valid' | 'suspended' | 'revoked' | 'challenged'
  validSince: Date;
  suspendedAt?: Date;
  revokedAt?: Date;
  
  // Strength of authorization
  strength: InferenceStrength;  // 'presumptive' | 'plausibilistic' | 'deductive'
  confidence: number;           // 0.0-1.0
  
  // Defeat conditions (from CQs)
  defeatConditions: DefeatCondition[];
  activeDefeaterId?: string;    // What's currently defeating this ticket
  
  // Burden allocation
  initialBurden: 'proponent' | 'opponent';
  currentBurden: 'proponent' | 'opponent';
  burdenShifts: BurdenShift[];
}
```

#### R2: DefeatCondition Formalization

Each CQ generates formal defeat conditions that can revoke the ticket:

```typescript
interface DefeatCondition {
  id: string;
  ticketId: string;
  cqId: string;                 // Which CQ this comes from
  
  // Type of defeat
  defeatType: 'undercutter' | 'rebuttal' | 'underminer';
  
  // Target of defeat
  target: {
    type: 'inference' | 'premise' | 'conclusion';
    elementId?: string;         // Specific premise/conclusion if applicable
  };
  
  // Trigger condition (what makes this defeat active)
  triggerCondition: {
    type: 'cq-unanswered' | 'cq-negative' | 'counter-evidence' | 'contrary-claim';
    cqKey?: string;
    contraryClaimId?: string;
  };
  
  // Current state
  isActive: boolean;
  activatedAt?: Date;
  activatedBy?: string;         // Who/what activated this defeat
}
```

#### R3: CQ-to-Defeat Mapping

Explicit mapping from each CQ type to its defeat effect:

```typescript
interface CQDefeatMapping {
  cqId: string;
  schemeId: string;
  cqKey: string;
  
  // What kind of defeat this CQ can produce
  defeatType: 'undercutter' | 'rebuttal' | 'underminer';
  
  // What it targets
  targetType: 'inference' | 'premise' | 'conclusion';
  targetPremiseKey?: string;    // If targeting specific premise
  
  // Burden semantics
  burden: {
    initial: 'proponent' | 'opponent';
    shiftsOn: 'challenge' | 'negative-answer' | 'never';
    shiftsTo: 'proponent' | 'opponent';
  };
  
  // ASPIC+ mapping
  aspicMapping: {
    attackType: 'undermining' | 'rebutting' | 'undercutting';
    ruleId?: string;
    preferenceRelevant: boolean;
  };
}
```

#### R4: Ticket Lifecycle State Machine

Tickets follow a formal lifecycle:

```
                    ┌─────────────────┐
                    │    PENDING      │ ← Initial (CQs not evaluated)
                    └────────┬────────┘
                             │ all CQs satisfied or burden-shifted
                             ▼
                    ┌─────────────────┐
          ┌────────│     VALID       │ ← Authorization active
          │        └────────┬────────┘
          │                 │ CQ challenge raised
          │                 ▼
          │        ┌─────────────────┐
          │        │   CHALLENGED    │ ← Under dispute
          │        └────────┬────────┘
          │                 │
          │    ┌────────────┴────────────┐
          │    │                         │
          │    ▼ challenge               ▼ challenge
          │ defeated                  succeeds
          │    │                         │
          │    ▼                         ▼
          │ ┌─────────────────┐  ┌─────────────────┐
          │ │  REINSTATED     │  │   SUSPENDED     │
          │ │  (back to VALID)│  │                 │
          │ └─────────────────┘  └────────┬────────┘
          │                               │ defeat upheld / escalated
          │                               ▼
          │                      ┌─────────────────┐
          └──────────────────────│    REVOKED      │ ← Authorization removed
                                 └─────────────────┘
```

---

## 2.2 Schema Design: Prisma Model Extensions

### New Models to Add

#### 2.2.1 InferenceTicket Model

```prisma
// Sellarsian Inference Ticket
// Represents the authorization granted by applying a scheme to an argument
model InferenceTicket {
  id             String   @id @default(cuid())
  deliberationId String
  
  // The scheme and argument this ticket authorizes
  schemeId       String
  scheme         ArgumentScheme @relation("SchemeTickets", fields: [schemeId], references: [id], onDelete: Cascade)
  
  argumentId     String   @unique
  argument       Argument @relation("ArgumentTicket", fields: [argumentId], references: [id], onDelete: Cascade)
  
  // The licensed transition (cached for performance)
  premiseClaimIds   String[]
  conclusionClaimId String?
  
  // Authorization status
  status         TicketStatus @default(PENDING)
  validSince     DateTime?
  suspendedAt    DateTime?
  revokedAt      DateTime?
  
  // Strength classification
  strength       InferenceStrength @default(PRESUMPTIVE)
  confidence     Float             @default(1.0)
  
  // Burden tracking
  initialBurden  BurdenHolder @default(PROPONENT)
  currentBurden  BurdenHolder @default(PROPONENT)
  
  // Active defeater (if any)
  activeDefeaterId   String?
  activeDefeaterType String?  // 'DefeatCondition' | 'ClaimEdge' | 'Argument'
  
  // Relations
  defeatConditions   DefeatCondition[]
  burdenShifts       BurdenShift[]
  ticketChallenges   TicketChallenge[]
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@index([deliberationId])
  @@index([schemeId])
  @@index([status])
  @@index([deliberationId, status])
}

enum TicketStatus {
  PENDING       // CQs not yet evaluated
  VALID         // Authorization active
  CHALLENGED    // Under active dispute
  SUSPENDED     // Temporarily invalid (pending resolution)
  REVOKED       // Authorization removed
  REINSTATED    // Was challenged, now valid again
}

enum InferenceStrength {
  DEDUCTIVE      // Cannot be defeated (strict rule)
  PRESUMPTIVE    // Valid unless defeated (default)
  PLAUSIBILISTIC // Probabilistically weighted
  TENTATIVE      // Exploratory, low commitment
}

enum BurdenHolder {
  PROPONENT      // Arguer must defend
  OPPONENT       // Challenger must prove defeat
  SHARED         // Both have obligations
}
```

#### 2.2.2 DefeatCondition Model

```prisma
// Formal Defeat Conditions
// Each CQ generates defeat conditions that can suspend/revoke tickets
model DefeatCondition {
  id             String   @id @default(cuid())
  ticketId       String
  ticket         InferenceTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  
  // Link to originating CQ
  cqId           String?
  cq             CriticalQuestion? @relation("CQDefeatConditions", fields: [cqId], references: [id], onDelete: SetNull)
  cqKey          String?
  
  // Defeat classification (ASPIC+ aligned)
  defeatType     DefeatType
  
  // What this condition targets
  targetType     DefeatTarget
  targetElementId String?  // Specific premise/claim if applicable
  
  // Trigger specification
  triggerType    DefeatTrigger
  triggerConfig  Json?    // Additional trigger parameters
  
  // State
  isActive       Boolean  @default(false)
  activatedAt    DateTime?
  activatedBy    String?  // What activated it (claim ID, edge ID, etc.)
  
  // Resolution
  resolvedAt     DateTime?
  resolvedBy     String?  // User who resolved
  resolution     DefeatResolution?
  
  createdAt      DateTime @default(now())
  
  @@index([ticketId])
  @@index([ticketId, isActive])
  @@index([cqId])
}

enum DefeatType {
  UNDERCUTTER    // Attacks the inference rule itself
  REBUTTAL       // Attacks the conclusion with contrary
  UNDERMINER     // Attacks a premise
}

enum DefeatTarget {
  INFERENCE      // The inference step
  PREMISE        // A specific premise
  CONCLUSION     // The conclusion
  WARRANT        // The backing/warrant
}

enum DefeatTrigger {
  CQ_UNANSWERED  // CQ raised but not satisfied
  CQ_NEGATIVE    // CQ answered negatively
  CONTRARY_CLAIM // Contradicting claim introduced
  COUNTER_EVIDENCE // Evidence against premise
  EXCEPTION_RAISED // Exception to defeasible rule
}

enum DefeatResolution {
  ANSWERED       // CQ was satisfactorily answered
  RETRACTED      // Challenger withdrew
  OVERRIDDEN     // Preference ordering favored ticket
  UPHELD         // Defeat stands, ticket suspended/revoked
}
```

#### 2.2.3 BurdenShift Model

```prisma
// Burden of Proof Shifts
// Tracks when and why burden shifts between parties
model BurdenShift {
  id             String   @id @default(cuid())
  ticketId       String
  ticket         InferenceTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  
  // What caused the shift
  trigger        BurdenShiftTrigger
  triggerId      String?  // CQ challenge, claim, etc.
  
  // The shift
  fromHolder     BurdenHolder
  toHolder       BurdenHolder
  
  // Provenance
  shiftedAt      DateTime @default(now())
  shiftedBy      String?  // User who caused the shift
  reason         String?  // Explanation
  
  // Is this shift still active?
  isActive       Boolean  @default(true)
  supersededBy   String?  // Later shift that replaced this
  
  @@index([ticketId])
  @@index([ticketId, isActive])
}

enum BurdenShiftTrigger {
  CQ_RAISED           // Challenger raised a CQ
  CQ_ANSWERED         // Proponent answered CQ
  EVIDENCE_PRESENTED  // Evidence shifted burden
  EXCEPTION_CLAIMED   // Exception to rule claimed
  CONCESSION          // Party conceded point
  DEFAULT_RESET       // Reset to default burden
}
```

#### 2.2.4 TicketChallenge Model

```prisma
// Challenges to Inference Tickets
// Explicit record of each challenge attempt
model TicketChallenge {
  id             String   @id @default(cuid())
  ticketId       String
  ticket         InferenceTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  
  // What's being challenged
  challengeType  ChallengeType
  defeatConditionId String?
  defeatCondition DefeatCondition? @relation(fields: [defeatConditionId], references: [id], onDelete: SetNull)
  
  // The challenge
  challengerId   String   // User who challenged
  challengeText  String?  @db.Text
  evidenceClaimIds String[] // Supporting claims
  
  // Status
  status         ChallengeStatus @default(OPEN)
  
  // Resolution
  resolvedAt     DateTime?
  resolvedBy     String?
  resolution     ChallengeResolution?
  resolutionNote String?  @db.Text
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@index([ticketId])
  @@index([ticketId, status])
  @@index([challengerId])
}

enum ChallengeType {
  CQ_CHALLENGE        // Raising a critical question
  PREMISE_ATTACK      // Attacking a premise
  CONCLUSION_CONTRARY // Presenting contrary conclusion
  INFERENCE_UNDERCUT  // Attacking the inference itself
  EXCEPTION_CLAIM     // Claiming an exception applies
}

enum ChallengeStatus {
  OPEN           // Active challenge
  UNDER_REVIEW   // Being evaluated
  RESOLVED       // Has resolution
  WITHDRAWN      // Challenger withdrew
}

enum ChallengeResolution {
  DEFEATED       // Challenge was defeated
  UPHELD         // Challenge succeeded
  PARTIALLY_UPHELD // Partial success
  MOOTED         // No longer relevant
}
```

#### 2.2.5 CQDefeatMapping Model

```prisma
// CQ to Defeat Mapping
// Pre-defines how each CQ type maps to defeat conditions
model CQDefeatMapping {
  id             String   @id @default(cuid())
  schemeId       String
  scheme         ArgumentScheme @relation("SchemeCQMappings", fields: [schemeId], references: [id], references: [id], onDelete: Cascade)
  
  cqKey          String
  
  // Defeat semantics
  defeatType     DefeatType
  targetType     DefeatTarget
  targetPremiseKey String?  // If targeting specific premise
  
  // Burden semantics
  initialBurden  BurdenHolder @default(PROPONENT)
  shiftsOnChallenge Boolean  @default(true)
  shiftsTo       BurdenHolder @default(OPPONENT)
  
  // ASPIC+ mapping
  aspicAttackType String?  // 'undermining' | 'rebutting' | 'undercutting'
  preferenceRelevant Boolean @default(false)
  
  // Generation rules
  autoGenerate   Boolean  @default(true)  // Auto-create DefeatCondition when ticket created
  
  @@unique([schemeId, cqKey])
  @@index([schemeId])
}
```

#### 2.2.6 Schema Updates for Relations

```prisma
// Add to existing ArgumentScheme model:
model ArgumentScheme {
  // ... existing fields ...
  
  // NEW: Inference ticket relations
  tickets        InferenceTicket[] @relation("SchemeTickets")
  cqDefeatMappings CQDefeatMapping[] @relation("SchemeCQMappings")
}

// Add to existing Argument model:
model Argument {
  // ... existing fields ...
  
  // NEW: Inference ticket relation
  inferenceTicket InferenceTicket? @relation("ArgumentTicket")
}

// Add to existing CriticalQuestion model:
model CriticalQuestion {
  // ... existing fields ...
  
  // NEW: Defeat condition relations
  defeatConditions DefeatCondition[] @relation("CQDefeatConditions")
}
```

---

## 2.3 API Layer Design

### 2.3.1 InferenceTicketService

```typescript
// services/inferenceTicket.ts

interface InferenceTicketService {
  // === TICKET LIFECYCLE ===
  
  /**
   * Create ticket when argument applies scheme
   */
  createTicket(params: {
    argumentId: string;
    schemeId: string;
    deliberationId: string;
    premiseClaimIds: string[];
    conclusionClaimId?: string;
    strength?: InferenceStrength;
  }): Promise<InferenceTicket>;
  
  /**
   * Validate ticket (check all defeat conditions)
   */
  validateTicket(ticketId: string): Promise<{
    isValid: boolean;
    status: TicketStatus;
    activeDefeatConditions: DefeatCondition[];
  }>;
  
  /**
   * Suspend ticket due to active defeat
   */
  suspendTicket(
    ticketId: string,
    defeatConditionId: string,
    reason?: string
  ): Promise<InferenceTicket>;
  
  /**
   * Revoke ticket (permanent defeat)
   */
  revokeTicket(
    ticketId: string,
    reason: string
  ): Promise<InferenceTicket>;
  
  /**
   * Reinstate ticket (challenge defeated)
   */
  reinstateTicket(
    ticketId: string,
    reason?: string
  ): Promise<InferenceTicket>;
  
  // === DEFEAT CONDITIONS ===
  
  /**
   * Generate defeat conditions from scheme CQs
   */
  generateDefeatConditions(ticketId: string): Promise<DefeatCondition[]>;
  
  /**
   * Activate defeat condition (CQ raised or contrary introduced)
   */
  activateDefeatCondition(
    conditionId: string,
    activatedBy: string,
    trigger: DefeatTrigger
  ): Promise<DefeatCondition>;
  
  /**
   * Resolve defeat condition
   */
  resolveDefeatCondition(
    conditionId: string,
    resolution: DefeatResolution,
    resolvedBy: string
  ): Promise<DefeatCondition>;
  
  // === BURDEN TRACKING ===
  
  /**
   * Get current burden holder for ticket
   */
  getCurrentBurden(ticketId: string): Promise<{
    holder: BurdenHolder;
    reason: string;
    shiftHistory: BurdenShift[];
  }>;
  
  /**
   * Record burden shift
   */
  recordBurdenShift(params: {
    ticketId: string;
    trigger: BurdenShiftTrigger;
    triggerId?: string;
    toHolder: BurdenHolder;
    reason?: string;
    shiftedBy?: string;
  }): Promise<BurdenShift>;
  
  // === CHALLENGES ===
  
  /**
   * Create challenge to ticket
   */
  createChallenge(params: {
    ticketId: string;
    challengeType: ChallengeType;
    challengerId: string;
    challengeText?: string;
    evidenceClaimIds?: string[];
    defeatConditionId?: string;
  }): Promise<TicketChallenge>;
  
  /**
   * Resolve challenge
   */
  resolveChallenge(
    challengeId: string,
    resolution: ChallengeResolution,
    resolvedBy: string,
    note?: string
  ): Promise<TicketChallenge>;
  
  // === QUERIES ===
  
  /**
   * Get ticket with full defeat analysis
   */
  getTicketWithDefeatAnalysis(ticketId: string): Promise<{
    ticket: InferenceTicket;
    defeatConditions: DefeatCondition[];
    activeChallenges: TicketChallenge[];
    burdenState: BurdenState;
    cqStatuses: CQStatus[];
  }>;
  
  /**
   * Get all tickets for deliberation with status
   */
  getDeliberationTickets(deliberationId: string): Promise<{
    valid: InferenceTicket[];
    challenged: InferenceTicket[];
    suspended: InferenceTicket[];
    revoked: InferenceTicket[];
  }>;
}
```

### 2.3.2 Integration with Existing CQ System

```typescript
// services/cqIntegration.ts

interface CQTicketIntegration {
  /**
   * When CQ status changes, update related ticket
   */
  onCQStatusChange(params: {
    cqStatusId: string;
    oldStatus: CQStatusEnum;
    newStatus: CQStatusEnum;
  }): Promise<void>;
  
  /**
   * When CQ is raised, activate defeat condition
   */
  onCQRaised(params: {
    schemeKey: string;
    cqKey: string;
    targetId: string;
    raisedById: string;
  }): Promise<{
    defeatCondition: DefeatCondition;
    ticketStatus: TicketStatus;
    burdenShift?: BurdenShift;
  }>;
  
  /**
   * When CQ is satisfied, resolve defeat condition
   */
  onCQSatisfied(params: {
    cqStatusId: string;
    satisfiedBy: string;
  }): Promise<{
    resolution: DefeatResolution;
    ticketStatus: TicketStatus;
  }>;
}
```

### 2.3.3 API Endpoints

```typescript
// New endpoints for /api/deliberation/[id]/

// GET /api/deliberation/[id]/argument/[argId]/ticket
// Get inference ticket for an argument
interface TicketResponse {
  ticket: InferenceTicket;
  defeatAnalysis: {
    activeConditions: DefeatCondition[];
    pendingChallenges: TicketChallenge[];
  };
  burden: {
    current: BurdenHolder;
    shifts: BurdenShift[];
  };
  cqStatuses: CQStatus[];
}

// POST /api/deliberation/[id]/argument/[argId]/ticket
// Create inference ticket for argument (if using scheme)
interface CreateTicketRequest {
  schemeId: string;
  strength?: InferenceStrength;
  premiseClaimIds: string[];
  conclusionClaimId?: string;
}

// POST /api/deliberation/[id]/ticket/[ticketId]/challenge
// Challenge an inference ticket
interface ChallengeTicketRequest {
  challengeType: ChallengeType;
  challengeText?: string;
  evidenceClaimIds?: string[];
  targetCQKey?: string;  // If challenging via CQ
}

// PUT /api/deliberation/[id]/ticket/[ticketId]/challenge/[challengeId]
// Resolve a challenge
interface ResolveChallengeRequest {
  resolution: ChallengeResolution;
  note?: string;
}

// GET /api/deliberation/[id]/tickets
// Get all tickets with summary
interface TicketsSummaryResponse {
  summary: {
    total: number;
    valid: number;
    challenged: number;
    suspended: number;
    revoked: number;
  };
  tickets: TicketWithStatus[];
}
```

---

## 2.4 CQ-to-Defeat Mapping: Seed Data

For the core Walton schemes, pre-define CQ defeat mappings:

```typescript
// seeds/cqDefeatMappings.ts

const EXPERT_OPINION_MAPPINGS: CQDefeatMapping[] = [
  {
    schemeId: 'expert_opinion',
    cqKey: 'CQ1_EXPERTISE',
    defeatType: 'UNDERMINER',
    targetType: 'PREMISE',
    targetPremiseKey: 'P1_expertise',
    initialBurden: 'OPPONENT',  // Expertise presumed
    shiftsOnChallenge: true,
    shiftsTo: 'PROPONENT',
    aspicAttackType: 'undermining',
    preferenceRelevant: false,
  },
  {
    schemeId: 'expert_opinion',
    cqKey: 'CQ2_FIELD',
    defeatType: 'UNDERCUTTER',
    targetType: 'INFERENCE',
    initialBurden: 'OPPONENT',
    shiftsOnChallenge: true,
    shiftsTo: 'PROPONENT',
    aspicAttackType: 'undercutting',
    preferenceRelevant: false,
  },
  {
    schemeId: 'expert_opinion',
    cqKey: 'CQ3_CONSISTENCY',
    defeatType: 'UNDERMINER',
    targetType: 'PREMISE',
    targetPremiseKey: 'P2_assertion',
    initialBurden: 'OPPONENT',
    shiftsOnChallenge: true,
    shiftsTo: 'PROPONENT',
    aspicAttackType: 'undermining',
    preferenceRelevant: false,
  },
  {
    schemeId: 'expert_opinion',
    cqKey: 'CQ4_BIAS',
    defeatType: 'UNDERCUTTER',
    targetType: 'INFERENCE',
    initialBurden: 'OPPONENT',
    shiftsOnChallenge: true,
    shiftsTo: 'PROPONENT',
    aspicAttackType: 'undercutting',
    preferenceRelevant: true,  // May affect preference ordering
  },
  {
    schemeId: 'expert_opinion',
    cqKey: 'CQ5_AGREEMENT',
    defeatType: 'REBUTTAL',
    targetType: 'CONCLUSION',
    initialBurden: 'OPPONENT',
    shiftsOnChallenge: false,  // Must provide counter-expert
    aspicAttackType: 'rebutting',
    preferenceRelevant: true,
  },
];

// Similar mappings for other core schemes...
const CAUSE_TO_EFFECT_MAPPINGS: CQDefeatMapping[] = [
  {
    schemeId: 'cause_to_effect',
    cqKey: 'CQ1_CORRELATION',
    defeatType: 'UNDERMINER',
    targetType: 'PREMISE',
    targetPremiseKey: 'P1_causal_relation',
    initialBurden: 'PROPONENT',  // Must show causation, not just correlation
    shiftsOnChallenge: false,
    aspicAttackType: 'undermining',
    preferenceRelevant: false,
  },
  // ... etc
];
```

---

## 2.5 Migration Strategy

### Step 1: Add New Models

```bash
# Add models to schema.prisma
npx prisma db push
```

### Step 2: Seed CQ Defeat Mappings

```typescript
// scripts/seed-cq-defeat-mappings.ts

async function seedCQDefeatMappings() {
  const schemes = await prisma.argumentScheme.findMany({
    include: { cqs: true }
  });
  
  for (const scheme of schemes) {
    // Get predefined mappings or generate defaults
    const mappings = PREDEFINED_MAPPINGS[scheme.key] ?? 
                     generateDefaultMappings(scheme);
    
    for (const mapping of mappings) {
      await prisma.cQDefeatMapping.upsert({
        where: { schemeId_cqKey: { schemeId: scheme.id, cqKey: mapping.cqKey } },
        create: mapping,
        update: mapping,
      });
    }
  }
}

function generateDefaultMappings(scheme: ArgumentScheme): CQDefeatMapping[] {
  // Default: each CQ is an undercutter with burden on opponent
  return scheme.cqs.map(cq => ({
    schemeId: scheme.id,
    cqKey: cq.cqKey ?? cq.id,
    defeatType: 'UNDERCUTTER',
    targetType: 'INFERENCE',
    initialBurden: 'OPPONENT',
    shiftsOnChallenge: true,
    shiftsTo: 'PROPONENT',
    autoGenerate: true,
  }));
}
```

### Step 3: Backfill Tickets for Existing Arguments

```typescript
// scripts/backfill-inference-tickets.ts

async function backfillInferenceTickets() {
  // Find arguments with scheme applications but no ticket
  const arguments = await prisma.argument.findMany({
    where: {
      argumentSchemes: { some: {} },
      inferenceTicket: null,
    },
    include: {
      argumentSchemes: { include: { scheme: true } },
      premises: true,
      conclusion: true,
    }
  });
  
  for (const arg of arguments) {
    // Use primary scheme (or first)
    const primaryInstance = arg.argumentSchemes.find(s => s.isPrimary) 
                           ?? arg.argumentSchemes[0];
    
    if (!primaryInstance) continue;
    
    // Create ticket
    const ticket = await inferenceTicketService.createTicket({
      argumentId: arg.id,
      schemeId: primaryInstance.schemeId,
      deliberationId: arg.deliberationId,
      premiseClaimIds: arg.premises.map(p => p.claimId),
      conclusionClaimId: arg.conclusionClaimId ?? undefined,
      strength: mapRuleTypeToStrength(primaryInstance.ruleType),
    });
    
    // Generate defeat conditions
    await inferenceTicketService.generateDefeatConditions(ticket.id);
    
    // Validate based on existing CQ statuses
    await inferenceTicketService.validateTicket(ticket.id);
  }
}
```

### Step 4: Hook Into Argument Creation

```typescript
// In argument creation flow
async function createArgumentWithScheme(params: CreateArgumentParams) {
  const argument = await prisma.argument.create({ ... });
  
  if (params.schemeId) {
    // Create inference ticket
    const ticket = await inferenceTicketService.createTicket({
      argumentId: argument.id,
      schemeId: params.schemeId,
      deliberationId: params.deliberationId,
      premiseClaimIds: params.premiseClaimIds,
      conclusionClaimId: params.conclusionClaimId,
    });
    
    // Auto-generate defeat conditions from scheme CQs
    await inferenceTicketService.generateDefeatConditions(ticket.id);
  }
  
  return argument;
}
```

---

## 2.6 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Schema migration complete | 100% | All new models created |
| CQ mappings seeded | 100% | All schemes have defeat mappings |
| Tickets backfilled | 100% | All scheme-using arguments have tickets |
| Ticket status accurate | > 95% | Ticket status matches CQ analysis |
| Challenge workflow complete | 100% | Challenge → resolution flow works |
| p95 ticket validation | < 50ms | validateTicket performance |

---

## Phase 2 Status

- [x] 2.1 Requirements — Complete
- [x] 2.2 Schema Design — Complete
- [x] 2.3 API Layer Design — Complete
- [x] 2.4 CQ-Defeat Mapping — Complete
- [x] 2.5 Migration Strategy — Complete
- [ ] 2.6 Implementation — Not started
- [ ] 2.7 Testing — Not started

---

## Connection to Sellarsian Framework

| Sellarsian Concept | Phase 2 Implementation |
|-------------------|----------------------|
| **Inference Ticket** | `InferenceTicket` model — explicit authorization |
| **Defeasibility** | `DefeatCondition` with types: undercutter, rebuttal, underminer |
| **Burden of Proof** | `BurdenShift` tracking proponent/opponent obligations |
| **Material Inference** | Scheme → ticket → licensed transition |
| **Community Authorization** | Tickets are valid if community hasn't successfully challenged |

---

# Phase 3: Grounding Semantics Integration — Defeat Propagation Network

## 3.1 Overview: The Sellarsian Connection

From the Deep Study synthesis, Sellars's framework demands that **rational standing is holistic**:

> "A claim's rational standing depends on its *connections* — what supports it, what it supports, what challenges it. The 'space of reasons' is a *network*, not isolated propositions."

The current Mesh grounding semantics (`lib/ceg/grounded.ts`, `lib/aspic/semantics.ts`) computes IN/OUT/UNDEC labels for claims and arguments. Phase 3 extends this to:

1. **Integrate Phase 1 InferentialPositions** — Claims carry dual characterization
2. **Integrate Phase 2 InferenceTickets** — Ticket status propagates through attack graph
3. **Defeat propagation** — When a ticket is revoked, downstream conclusions lose support

### Current Infrastructure Analysis

| Component | Location | Current State |
|-----------|----------|---------------|
| `groundedLabels()` | `lib/eval/af.ts` | Pure function, IN/OUT/UNDEC labeling |
| `computeGroundedExtension()` | `lib/aspic/semantics.ts` | ASPIC+ aware, defeat relations |
| `recomputeGroundedForDelib()` | `lib/ceg/grounded.ts` | DB-aware, persists ClaimLabel rows |
| `ClaimLabel` model | schema.prisma:3463 | Stores semantic label per claim |
| `SheetAcceptance` model | schema.prisma:5720 | DebateSheet-level labeling |

### The Gap

Current semantics are **claim-centric** but don't account for:
- **InferentialPosition** status from Phase 1
- **InferenceTicket** validity from Phase 2
- **Cascading defeat** when upstream tickets are revoked
- **Picturing/prediction outcomes** affecting claim credibility

---

## 3.2 Requirements

### R1: InferentialPosition-Aware Labeling

Extend grounded semantics to consider a claim's dual characterization:

```typescript
interface PositionAwareNode {
  claimId: string;
  
  // Standard attack graph
  attackedBy: string[];   // Claim IDs that attack this
  supports: string[];     // Claim IDs this supports
  
  // Phase 1: InferentialPosition data
  position?: {
    commitmentStrength: CommitmentStrength;
    defeatStatus: DefeatStatus;
    groundingStatus: GroundingStatus;  // 'grounded' | 'ungrounded' | 'floating'
    predictionSuccessRate?: number;
  };
  
  // Phase 2: InferenceTicket data
  tickets?: {
    argumentId: string;
    ticketStatus: TicketStatus;
    activeDefeatConditions: number;
  }[];
}
```

### R2: Ticket-to-Label Propagation

When an InferenceTicket changes status, propagate to:
1. The argument's conclusion claim
2. All claims supported by that conclusion
3. All tickets that depend on that claim as a premise

```
Ticket REVOKED
    │
    ▼
Conclusion claim loses "IN support"
    │
    ▼
Recompute grounded labels
    │
    ▼
Downstream claims may become OUT or UNDEC
    │
    ▼
Tickets using those claims may suspend
```

### R3: Defeat Cascade Control

Prevent "defeat explosion" with:
- **Dampening:** Defeat impact decays over inference distance
- **Isolation:** Some claims are "axiomatically grounded" (not defeasible)
- **Queuing:** Batch propagation for efficiency

### R4: Multi-Semantics Support

Support multiple semantics with different propagation behaviors:

| Semantics | Behavior | Use Case |
|-----------|----------|----------|
| `grounded` | Skeptical, only accept defended | High-stakes deliberation |
| `preferred` | Credulous, accept if defensible | Exploratory discussion |
| `grounded-picturing` | Grounded + prediction outcomes | Evidence-sensitive |
| `ticket-aware` | Full Phase 1-2 integration | Complete Sellarsian |

---

## 3.3 Schema Extensions

### 3.3.1 Enhanced ClaimLabel

```prisma
// Extend existing ClaimLabel with position/ticket awareness
model ClaimLabel {
  id             String      @id @default(cuid())
  deliberationId String?
  claimId        String      @unique
  
  // Current fields
  semantics      String      // 'grounded' | 'preferred' | 'grounded-picturing' | 'ticket-aware'
  label          GroundLabel // IN | OUT | UNDEC
  explainJson    Json?
  computedAt     DateTime    @default(now())
  
  // NEW: Phase 3 extensions
  
  // Position-aware factors
  positionId         String?
  position           InferentialPosition? @relation(fields: [positionId], references: [id], onDelete: SetNull)
  positionContribution Float?  // How much position affects label [-1.0, 1.0]
  
  // Ticket-aware factors
  supportingTicketIds String[] // Tickets that support this claim's IN status
  blockingTicketIds   String[] // Tickets that block (attacked and failed) this claim
  ticketContribution  Float?   // Net ticket effect [-1.0, 1.0]
  
  // Picturing-aware factors (from Phase 1)
  predictionSuccessRate Float?  // If claim made predictions
  groundingContribution Float?  // Effect on label [-1.0, 1.0]
  
  // Composite confidence
  compositeScore      Float?   // Weighted combination of all factors
  
  // Provenance
  computationVersion  Int       @default(1)  // Schema version for migrations
  computationInputs   Json?     // Snapshot of inputs for debugging
  
  claim Claim @relation(fields: [claimId], references: [id], onDelete: Cascade)

  @@index([deliberationId])
  @@index([semantics])
  @@index([label])
  @@index([deliberationId, semantics])
}
```

### 3.3.2 DefeatPropagationEvent

Track propagation for debugging and replay:

```prisma
// Record defeat propagation events
model DefeatPropagationEvent {
  id             String   @id @default(cuid())
  deliberationId String
  
  // Trigger
  triggerType    PropagationTrigger
  triggerId      String   // TicketId, ClaimId, CQStatusId, etc.
  
  // Scope
  affectedClaimIds   String[]
  affectedTicketIds  String[]
  labelChanges       Json     // { claimId: { from: 'IN', to: 'OUT' } }
  
  // Metrics
  propagationDepth   Int      // How many hops from trigger
  claimsRecomputed   Int
  ticketsRevalidated Int
  durationMs         Int
  
  // Rollback support
  inputSnapshot      Json?    // For replay/debugging
  rollbackPossible   Boolean  @default(true)
  rolledBackAt       DateTime?
  
  createdAt          DateTime @default(now())
  
  @@index([deliberationId])
  @@index([triggerId])
  @@index([triggerType])
  @@index([createdAt])
}

enum PropagationTrigger {
  TICKET_REVOKED
  TICKET_SUSPENDED
  TICKET_REINSTATED
  CQ_STATUS_CHANGED
  CLAIM_ATTACKED
  CLAIM_SUPPORTED
  POSITION_DEFEATED
  PREDICTION_OUTCOME
  MANUAL_RECOMPUTE
}
```

### 3.3.3 SemanticsConfiguration

Per-deliberation configuration for which semantics to use:

```prisma
// Deliberation-level semantics configuration
model SemanticsConfig {
  id             String   @id @default(cuid())
  deliberationId String   @unique
  
  // Primary semantics
  primarySemantics   String   @default("grounded") // 'grounded' | 'preferred' | 'ticket-aware'
  
  // Propagation settings
  enableDefeatPropagation Boolean @default(true)
  maxPropagationDepth     Int     @default(10)
  dampeningFactor         Float   @default(0.9)  // Decay per hop
  
  // Position integration (Phase 1)
  positionWeight          Float   @default(0.3)  // Weight of position in composite
  requireGrounding        Boolean @default(false) // Require picturing for IN?
  
  // Ticket integration (Phase 2)
  ticketWeight            Float   @default(0.5)  // Weight of ticket status
  cascadeOnRevocation     Boolean @default(true) // Auto-cascade on ticket revoke
  
  // Performance
  batchRecompute          Boolean @default(true) // Batch multiple triggers
  batchWindowMs           Int     @default(100)  // Debounce window
  
  // Axioms (claims immune to defeat)
  axiomClaimIds           String[] // Claims that are always IN
  
  deliberation Deliberation @relation(fields: [deliberationId], references: [id], onDelete: Cascade)
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

---

## 3.4 API Layer: Integrated Semantics Service

### 3.4.1 IntegratedSemanticsService

```typescript
// services/integratedSemantics.ts

interface SemanticsInput {
  deliberationId: string;
  
  // Graph structure
  claims: ClaimNode[];
  edges: ClaimEdgeNode[];
  arguments: ArgumentNode[];
  
  // Phase 1 data
  positions: Map<string, InferentialPosition>;
  predictions: Map<string, PredictionOutcome>;
  
  // Phase 2 data
  tickets: Map<string, InferenceTicket>;
  defeatConditions: Map<string, DefeatCondition[]>;
}

interface SemanticsResult {
  labels: Map<string, GroundLabel>;
  explanations: Map<string, LabelExplanation>;
  compositeScores: Map<string, number>;
  propagationEvents: DefeatPropagationEvent[];
  computationTime: number;
}

interface IntegratedSemanticsService {
  // === CORE COMPUTATION ===
  
  /**
   * Compute full integrated semantics for deliberation
   */
  computeIntegratedLabels(
    deliberationId: string,
    options?: {
      semantics?: 'grounded' | 'preferred' | 'ticket-aware';
      forceRecompute?: boolean;
      includeExplanations?: boolean;
    }
  ): Promise<SemanticsResult>;
  
  /**
   * Incremental update after specific trigger
   */
  propagateDefeat(params: {
    deliberationId: string;
    trigger: PropagationTrigger;
    triggerId: string;
    maxDepth?: number;
  }): Promise<{
    affectedClaims: string[];
    affectedTickets: string[];
    labelChanges: LabelChange[];
    event: DefeatPropagationEvent;
  }>;
  
  // === POSITION INTEGRATION (Phase 1) ===
  
  /**
   * Factor position data into labeling
   */
  computePositionContribution(
    claimId: string,
    position: InferentialPosition
  ): Promise<{
    contribution: number;  // [-1.0, 1.0]
    explanation: string;
  }>;
  
  /**
   * Factor prediction outcomes into labeling
   */
  computeGroundingContribution(
    claimId: string,
    predictions: PredictionOutcome[]
  ): Promise<{
    successRate: number;
    contribution: number;
    explanation: string;
  }>;
  
  // === TICKET INTEGRATION (Phase 2) ===
  
  /**
   * Factor ticket status into claim labeling
   */
  computeTicketContribution(
    claimId: string,
    tickets: InferenceTicket[]
  ): Promise<{
    supportingTickets: InferenceTicket[];
    blockingTickets: InferenceTicket[];
    contribution: number;
    explanation: string;
  }>;
  
  /**
   * Handle ticket status change
   */
  onTicketStatusChange(params: {
    ticketId: string;
    oldStatus: TicketStatus;
    newStatus: TicketStatus;
  }): Promise<SemanticsResult>;
  
  // === COMPOSITE SCORING ===
  
  /**
   * Compute weighted composite score
   */
  computeCompositeScore(params: {
    claimId: string;
    graphLabel: GroundLabel;
    positionContribution: number;
    ticketContribution: number;
    groundingContribution: number;
    config: SemanticsConfig;
  }): Promise<{
    compositeScore: number;
    finalLabel: GroundLabel;
    breakdown: ScoreBreakdown;
  }>;
  
  // === CONFIGURATION ===
  
  /**
   * Get/set semantics configuration for deliberation
   */
  getConfig(deliberationId: string): Promise<SemanticsConfig>;
  updateConfig(deliberationId: string, updates: Partial<SemanticsConfig>): Promise<SemanticsConfig>;
  
  // === QUERIES ===
  
  /**
   * Get propagation history for debugging
   */
  getPropagationHistory(
    deliberationId: string,
    options?: {
      since?: Date;
      triggerId?: string;
      limit?: number;
    }
  ): Promise<DefeatPropagationEvent[]>;
  
  /**
   * Explain why a claim has its current label
   */
  explainLabel(claimId: string): Promise<{
    label: GroundLabel;
    graphExplanation: string;
    positionExplanation?: string;
    ticketExplanation?: string;
    groundingExplanation?: string;
    compositeBreakdown: ScoreBreakdown;
  }>;
}
```

### 3.4.2 Propagation Algorithm

```typescript
// lib/semantics/propagation.ts

interface PropagationContext {
  deliberationId: string;
  config: SemanticsConfig;
  
  // Current state
  labels: Map<string, GroundLabel>;
  tickets: Map<string, InferenceTicket>;
  positions: Map<string, InferentialPosition>;
  
  // Graph structure
  attackGraph: Map<string, string[]>;     // claimId → attackers
  supportGraph: Map<string, string[]>;    // claimId → supporters
  ticketGraph: Map<string, string[]>;     // claimId → tickets using as premise
}

/**
 * Propagate defeat from a trigger through the network
 * 
 * Uses breadth-first traversal with dampening to prevent explosion.
 * Respects axiom claims (always IN) and max depth limits.
 */
async function propagateDefeat(
  ctx: PropagationContext,
  trigger: {
    type: PropagationTrigger;
    id: string;
    initialImpact: number;  // 1.0 = full defeat
  }
): Promise<PropagationResult> {
  const affected = new Map<string, LabelChange>();
  const visited = new Set<string>();
  const queue: PropagationNode[] = [];
  
  // Initialize queue based on trigger type
  switch (trigger.type) {
    case 'TICKET_REVOKED':
      const ticket = ctx.tickets.get(trigger.id);
      if (ticket?.conclusionClaimId) {
        queue.push({
          claimId: ticket.conclusionClaimId,
          depth: 0,
          impact: trigger.initialImpact,
          source: 'ticket',
          sourceId: trigger.id,
        });
      }
      break;
      
    case 'POSITION_DEFEATED':
      const position = ctx.positions.get(trigger.id);
      if (position?.claimId) {
        queue.push({
          claimId: position.claimId,
          depth: 0,
          impact: trigger.initialImpact,
          source: 'position',
          sourceId: trigger.id,
        });
      }
      break;
      
    // ... other trigger types
  }
  
  // BFS propagation with dampening
  while (queue.length > 0) {
    const node = queue.shift()!;
    
    // Skip if visited or beyond max depth
    if (visited.has(node.claimId)) continue;
    if (node.depth > ctx.config.maxPropagationDepth) continue;
    
    visited.add(node.claimId);
    
    // Skip axiom claims
    if (ctx.config.axiomClaimIds.includes(node.claimId)) continue;
    
    // Recompute label for this claim
    const oldLabel = ctx.labels.get(node.claimId);
    const newLabel = await recomputeClaimLabel(ctx, node.claimId);
    
    if (oldLabel !== newLabel) {
      affected.set(node.claimId, {
        claimId: node.claimId,
        from: oldLabel,
        to: newLabel,
        depth: node.depth,
        impact: node.impact,
      });
      
      // Propagate to dependents with dampened impact
      const dampenedImpact = node.impact * ctx.config.dampeningFactor;
      
      // Claims supported by this claim
      const supporters = ctx.supportGraph.get(node.claimId) ?? [];
      for (const dep of supporters) {
        queue.push({
          claimId: dep,
          depth: node.depth + 1,
          impact: dampenedImpact,
          source: 'claim',
          sourceId: node.claimId,
        });
      }
      
      // Tickets using this claim as premise
      const dependentTickets = ctx.ticketGraph.get(node.claimId) ?? [];
      for (const ticketId of dependentTickets) {
        // Mark ticket for revalidation
        await revalidateTicket(ctx, ticketId, dampenedImpact);
      }
    }
  }
  
  return {
    affectedClaims: [...affected.keys()],
    labelChanges: [...affected.values()],
    visitedCount: visited.size,
  };
}

/**
 * Recompute label for a single claim considering all factors
 */
async function recomputeClaimLabel(
  ctx: PropagationContext,
  claimId: string
): Promise<GroundLabel> {
  const attackers = ctx.attackGraph.get(claimId) ?? [];
  const supporters = ctx.supportGraph.get(claimId) ?? [];
  
  // Base graph semantics
  const attackerLabels = attackers.map(a => ctx.labels.get(a) ?? 'UNDEC');
  const supporterLabels = supporters.map(s => ctx.labels.get(s) ?? 'UNDEC');
  
  const hasInAttacker = attackerLabels.includes('IN');
  const allAttackersOut = attackers.length === 0 || 
                          attackerLabels.every(l => l === 'OUT');
  const hasInSupporter = supporterLabels.includes('IN');
  
  // Standard grounded logic
  let baseLabel: GroundLabel;
  if (hasInAttacker) {
    baseLabel = 'OUT';
  } else if (allAttackersOut && (hasInSupporter || attackers.length === 0)) {
    baseLabel = 'IN';
  } else {
    baseLabel = 'UNDEC';
  }
  
  // Apply position and ticket modifiers if using integrated semantics
  if (ctx.config.primarySemantics === 'ticket-aware') {
    const position = ctx.positions.get(claimId);
    const tickets = [...ctx.tickets.values()].filter(
      t => t.conclusionClaimId === claimId || t.premiseClaimIds.includes(claimId)
    );
    
    const positionMod = position ? computePositionModifier(position) : 0;
    const ticketMod = computeTicketModifier(tickets);
    
    // Weighted composite
    const composite = 
      (labelToScore(baseLabel) * (1 - ctx.config.positionWeight - ctx.config.ticketWeight)) +
      (positionMod * ctx.config.positionWeight) +
      (ticketMod * ctx.config.ticketWeight);
    
    return scoreToLabel(composite);
  }
  
  return baseLabel;
}
```

### 3.4.3 Event Hooks for Integration

```typescript
// services/semanticsHooks.ts

/**
 * Hook into Phase 2 ticket status changes
 */
export async function onTicketStatusChange(event: {
  ticketId: string;
  oldStatus: TicketStatus;
  newStatus: TicketStatus;
  deliberationId: string;
}): Promise<void> {
  // Determine propagation trigger
  let trigger: PropagationTrigger | null = null;
  
  if (event.newStatus === 'REVOKED') {
    trigger = 'TICKET_REVOKED';
  } else if (event.newStatus === 'SUSPENDED') {
    trigger = 'TICKET_SUSPENDED';
  } else if (event.newStatus === 'VALID' && 
             (event.oldStatus === 'SUSPENDED' || event.oldStatus === 'REVOKED')) {
    trigger = 'TICKET_REINSTATED';
  }
  
  if (trigger) {
    const service = getIntegratedSemanticsService();
    await service.propagateDefeat({
      deliberationId: event.deliberationId,
      trigger,
      triggerId: event.ticketId,
    });
  }
}

/**
 * Hook into Phase 1 position changes
 */
export async function onPositionDefeatStatusChange(event: {
  positionId: string;
  oldStatus: DefeatStatus;
  newStatus: DefeatStatus;
  deliberationId: string;
}): Promise<void> {
  if (event.newStatus === 'DEFEATED' || event.newStatus === 'SUSPENDED') {
    const service = getIntegratedSemanticsService();
    await service.propagateDefeat({
      deliberationId: event.deliberationId,
      trigger: 'POSITION_DEFEATED',
      triggerId: event.positionId,
    });
  }
}

/**
 * Hook into prediction outcomes (picturing)
 */
export async function onPredictionOutcome(event: {
  predictionId: string;
  outcome: 'VERIFIED' | 'FALSIFIED' | 'EXPIRED';
  claimId: string;
  deliberationId: string;
}): Promise<void> {
  if (event.outcome === 'FALSIFIED') {
    const service = getIntegratedSemanticsService();
    await service.propagateDefeat({
      deliberationId: event.deliberationId,
      trigger: 'PREDICTION_OUTCOME',
      triggerId: event.predictionId,
      maxDepth: 3,  // Limit blast radius for failed predictions
    });
  }
}
```

---

## 3.5 Extended Grounded Computation

Update `lib/ceg/grounded.ts` to integrate Phase 1-3:

```typescript
// lib/ceg/grounded-v2.ts

import { prisma } from '@/lib/prismaclient';
import type { SemanticsConfig } from '@prisma/client';

interface IntegratedNode {
  id: string;
  attackers: string[];
  supporters: string[];
  
  // Phase 1
  position?: {
    commitmentStrength: number;
    defeatStatus: string;
    groundingStatus: string;
  };
  predictionSuccessRate?: number;
  
  // Phase 2
  tickets?: {
    status: string;
    strength: string;
    activeDefeatConditions: number;
  }[];
}

export async function recomputeIntegratedLabels(
  deliberationId: string,
  config?: Partial<SemanticsConfig>
): Promise<{
  labels: Map<string, 'IN' | 'OUT' | 'UNDEC'>;
  compositeScores: Map<string, number>;
  propagationEvent?: any;
}> {
  // Load configuration
  const cfg = await loadOrCreateConfig(deliberationId, config);
  
  // Build integrated graph
  const nodes = await buildIntegratedGraph(deliberationId);
  
  // Compute base grounded labels
  const baseLabels = computeGroundedLabels(nodes);
  
  // Apply position and ticket modifiers if enabled
  const compositeScores = new Map<string, number>();
  const finalLabels = new Map<string, 'IN' | 'OUT' | 'UNDEC'>();
  
  for (const [nodeId, baseLabel] of baseLabels) {
    const node = nodes.get(nodeId);
    if (!node) {
      finalLabels.set(nodeId, baseLabel);
      continue;
    }
    
    let score = labelToScore(baseLabel);
    
    // Position contribution
    if (cfg.positionWeight > 0 && node.position) {
      const posMod = computePositionModifier(node.position);
      score = score * (1 - cfg.positionWeight) + posMod * cfg.positionWeight;
    }
    
    // Ticket contribution
    if (cfg.ticketWeight > 0 && node.tickets?.length) {
      const ticketMod = computeTicketModifier(node.tickets);
      score = score * (1 - cfg.ticketWeight) + ticketMod * cfg.ticketWeight;
    }
    
    // Grounding contribution (prediction success)
    if (node.predictionSuccessRate !== undefined) {
      const groundingMod = node.predictionSuccessRate * 2 - 1; // [0,1] → [-1,1]
      const groundingWeight = 0.1; // Small but meaningful
      score = score * (1 - groundingWeight) + groundingMod * groundingWeight;
    }
    
    compositeScores.set(nodeId, score);
    finalLabels.set(nodeId, scoreToLabel(score));
  }
  
  // Persist results
  await persistLabels(deliberationId, finalLabels, compositeScores, cfg);
  
  return { labels: finalLabels, compositeScores };
}

async function buildIntegratedGraph(
  deliberationId: string
): Promise<Map<string, IntegratedNode>> {
  const nodes = new Map<string, IntegratedNode>();
  
  // Load claims
  const claims = await prisma.claim.findMany({
    where: { deliberationId },
    select: { id: true },
  });
  
  for (const claim of claims) {
    nodes.set(claim.id, {
      id: claim.id,
      attackers: [],
      supporters: [],
    });
  }
  
  // Load edges
  const edges = await prisma.claimEdge.findMany({
    where: { deliberationId },
    select: { fromClaimId: true, toClaimId: true, type: true, attackType: true },
  });
  
  for (const edge of edges) {
    const node = nodes.get(edge.toClaimId);
    if (!node) continue;
    
    const isAttack = edge.type === 'rebuts' || 
                     edge.attackType === 'UNDERCUTS' || 
                     edge.attackType === 'UNDERMINES';
    
    if (isAttack) {
      node.attackers.push(edge.fromClaimId);
    } else {
      node.supporters.push(edge.fromClaimId);
    }
  }
  
  // Load Phase 1: InferentialPositions (if exists)
  try {
    const positions = await prisma.inferentialPosition.findMany({
      where: { deliberationId },
      select: {
        claimId: true,
        commitmentStrength: true,
        defeatStatus: true,
        groundingStatus: true,
      },
    });
    
    for (const pos of positions) {
      const node = nodes.get(pos.claimId);
      if (node) {
        node.position = {
          commitmentStrength: strengthToNumber(pos.commitmentStrength),
          defeatStatus: pos.defeatStatus,
          groundingStatus: pos.groundingStatus,
        };
      }
    }
  } catch {
    // InferentialPosition may not exist yet
  }
  
  // Load prediction success rates
  try {
    const predictions = await prisma.claimPrediction.groupBy({
      by: ['claimId'],
      where: { 
        deliberationId,
        outcome: { isSet: true },
      },
      _count: { id: true },
      _avg: { 
        // Assuming outcome.verified as numeric
      },
    });
    
    // Simplified: would need proper aggregation
  } catch {
    // ClaimPrediction may not exist yet
  }
  
  // Load Phase 2: InferenceTickets (if exists)
  try {
    const tickets = await prisma.inferenceTicket.findMany({
      where: { deliberationId },
      select: {
        conclusionClaimId: true,
        status: true,
        strength: true,
        defeatConditions: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });
    
    for (const ticket of tickets) {
      if (!ticket.conclusionClaimId) continue;
      const node = nodes.get(ticket.conclusionClaimId);
      if (node) {
        if (!node.tickets) node.tickets = [];
        node.tickets.push({
          status: ticket.status,
          strength: ticket.strength,
          activeDefeatConditions: ticket.defeatConditions.length,
        });
      }
    }
  } catch {
    // InferenceTicket may not exist yet
  }
  
  return nodes;
}

function computePositionModifier(position: {
  commitmentStrength: number;
  defeatStatus: string;
  groundingStatus: string;
}): number {
  let mod = 0;
  
  // Commitment strength contributes positively
  mod += position.commitmentStrength * 0.5; // [0, 0.5]
  
  // Defeat status
  switch (position.defeatStatus) {
    case 'UNDEFEATED': mod += 0.3; break;
    case 'CHALLENGED': mod += 0.0; break;
    case 'SUSPENDED': mod -= 0.3; break;
    case 'DEFEATED': mod -= 0.5; break;
  }
  
  // Grounding status
  switch (position.groundingStatus) {
    case 'GROUNDED': mod += 0.2; break;
    case 'FLOATING': mod += 0.0; break;
    case 'UNGROUNDED': mod -= 0.2; break;
  }
  
  // Clamp to [-1, 1]
  return Math.max(-1, Math.min(1, mod));
}

function computeTicketModifier(tickets: {
  status: string;
  strength: string;
  activeDefeatConditions: number;
}[]): number {
  if (tickets.length === 0) return 0;
  
  let totalMod = 0;
  for (const ticket of tickets) {
    let ticketMod = 0;
    
    // Status
    switch (ticket.status) {
      case 'VALID': ticketMod += 0.5; break;
      case 'CHALLENGED': ticketMod += 0.1; break;
      case 'SUSPENDED': ticketMod -= 0.3; break;
      case 'REVOKED': ticketMod -= 0.5; break;
    }
    
    // Strength
    switch (ticket.strength) {
      case 'DEDUCTIVE': ticketMod *= 1.2; break;
      case 'PRESUMPTIVE': ticketMod *= 1.0; break;
      case 'PLAUSIBILISTIC': ticketMod *= 0.8; break;
      case 'TENTATIVE': ticketMod *= 0.5; break;
    }
    
    // Active defeat conditions reduce confidence
    ticketMod -= ticket.activeDefeatConditions * 0.1;
    
    totalMod += ticketMod;
  }
  
  // Average and clamp
  return Math.max(-1, Math.min(1, totalMod / tickets.length));
}

function labelToScore(label: 'IN' | 'OUT' | 'UNDEC'): number {
  switch (label) {
    case 'IN': return 1.0;
    case 'UNDEC': return 0.0;
    case 'OUT': return -1.0;
  }
}

function scoreToLabel(score: number): 'IN' | 'OUT' | 'UNDEC' {
  if (score > 0.33) return 'IN';
  if (score < -0.33) return 'OUT';
  return 'UNDEC';
}
```

---

## 3.6 Migration Strategy

### Step 1: Add New Schema

```bash
# Add SemanticsConfig, extend ClaimLabel, add DefeatPropagationEvent
npx prisma db push
```

### Step 2: Create Default Configurations

```typescript
// scripts/seed-semantics-config.ts

async function seedSemanticsConfigs() {
  const deliberations = await prisma.deliberation.findMany({
    where: { semanticsConfig: null },
    select: { id: true },
  });
  
  for (const delib of deliberations) {
    await prisma.semanticsConfig.create({
      data: {
        deliberationId: delib.id,
        primarySemantics: 'grounded',  // Default to existing behavior
        enableDefeatPropagation: false, // Opt-in for new behavior
        positionWeight: 0.0,            // No position integration yet
        ticketWeight: 0.0,              // No ticket integration yet
      },
    });
  }
}
```

### Step 3: Add Event Hooks

```typescript
// lib/ceg/grounded.ts - add at end of recomputeGroundedForDelib

export async function recomputeGroundedForDelib(deliberationId?: string | null) {
  // ... existing code ...
  
  // NEW: Check if integrated semantics is enabled
  if (deliberationId) {
    const config = await prisma.semanticsConfig.findUnique({
      where: { deliberationId },
    });
    
    if (config?.primarySemantics === 'ticket-aware') {
      // Use new integrated computation
      const result = await recomputeIntegratedLabels(deliberationId, config);
      return { count: result.labels.size, integrated: true };
    }
  }
  
  // ... continue with existing logic for backwards compatibility ...
}
```

### Step 4: Wire Up Event Triggers

Update Phase 2 InferenceTicketService to call semantics hooks:

```typescript
// In inferenceTicketService.suspendTicket, revokeTicket, reinstateTicket:

await onTicketStatusChange({
  ticketId,
  oldStatus: previousStatus,
  newStatus: newTicket.status,
  deliberationId: ticket.deliberationId,
});
```

---

## 3.7 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Schema migration | 100% | New models created |
| Config seeded | 100% | All deliberations have SemanticsConfig |
| Event hooks wired | 100% | Ticket/position changes trigger propagation |
| Label accuracy | > 95% | Labels match expected semantics |
| Propagation depth avg | < 3 | Average hops per propagation |
| p95 recompute time | < 200ms | Full deliberation recompute |
| Backwards compatibility | 100% | `grounded` semantics unchanged |

---

## Phase 3 Status

- [x] 3.1 Overview — Complete
- [x] 3.2 Requirements — Complete
- [x] 3.3 Schema Extensions — Complete
- [x] 3.4 API Layer — Complete
- [x] 3.5 Extended Grounded Computation — Complete
- [x] 3.6 Migration Strategy — Complete
- [ ] 3.7 Implementation — Not started
- [ ] 3.8 Testing — Not started

---

## Connection to Sellarsian Framework

| Sellarsian Concept | Phase 3 Implementation |
|-------------------|----------------------|
| **Space of Reasons as Network** | Defeat propagation through connected claims |
| **Holistic Rational Standing** | Composite score from multiple factors |
| **Picturing Grounds Signifying** | Prediction success affects label |
| **Defeasibility** | Cascading defeat when tickets revoked |
| **Developmental Stages** | Configuration allows tuning semantics per deliberation |

---

## Next Steps

After Phase 3 implementation:
1. **Phase 4:** Build adaptive scaffolding based on user developmental stage
2. **Phase 5:** Implement dialectical move recommendations
3. **Phase 6:** Create picturing-based feedback systems

---

# Phase 4: Adaptive Scaffolding — Developmental Bildung System

## 4.1 Overview: The Sellarsian Developmental Framework

From the Deep Study synthesis, Sellars (and Koons & Sachs) outline a **developmental hierarchy**:

```
RDR → ARSA → ARSD
 │      │       │
 │      │       └── Discursive ARS (full linguistic/conceptual)
 │      └────────── Associative ARS (Humean inference, animal cognition)
 └──────────────── Reliable Differential Responder (mere causal response)
```

**Key Insight:** Users enter the platform at different developmental stages and need different support:

- **Novice (RDR→ARSA transition):** Needs heavy scaffolding, pattern enforcement, simple guidance
- **Intermediate (ARSA level):** Can make associative inferences, needs structure for complex reasoning
- **Advanced (ARSA→ARSD transition):** Developing meta-awareness, can start to articulate norms
- **Expert (ARSD level):** Full conceptual command, can teach others, minimal scaffolding needed

### The Ought-to-Be / Ought-to-Do Distinction

| Concept | Definition | Platform Implementation |
|---------|------------|------------------------|
| **Ought-to-Be** | Norms subjects conform to *without* conceptual grasp | UI structure, defaults, required fields |
| **Ought-to-Do** | Norms subjects follow *with* conceptual understanding | Explicit guidance, tutorials, recommendations |
| **Transition** | Moving from conformance to mastery | Progressive disclosure, feedback, achievement |

### Current State Analysis

The existing Mesh platform has:
- Basic `User` model with `onboarded` boolean
- `UserAttributes` for profile data
- `expertiseTags` array on User
- No explicit skill/development tracking for argumentation

---

## 4.2 Requirements

### R1: Developmental Stage Model

Track each user's argumentative development across multiple dimensions:

```typescript
interface DevelopmentalProfile {
  userId: string;
  
  // Overall stage (coarse-grained)
  overallStage: 'RDR' | 'ARSA_EARLY' | 'ARSA_MATURE' | 'ARSD_EMERGING' | 'ARSD_FLUENT';
  
  // Dimensional competencies (fine-grained)
  competencies: {
    // Claim-level skills
    claimFormulation: CompetencyLevel;      // Making clear, atomic claims
    evidenceRecognition: CompetencyLevel;   // Citing appropriate evidence
    
    // Argument-level skills
    premiseConclusionStructure: CompetencyLevel;  // Basic argument structure
    schemeRecognition: CompetencyLevel;     // Recognizing argument patterns
    schemeApplication: CompetencyLevel;     // Correctly applying schemes
    
    // Attack-level skills
    attackTyping: CompetencyLevel;          // Distinguishing rebut/undercut/undermine
    defeatRecognition: CompetencyLevel;     // Recognizing when arguments are defeated
    cqUsage: CompetencyLevel;               // Using critical questions effectively
    
    // Meta-level skills
    commitmentTracking: CompetencyLevel;    // Tracking own and others' commitments
    dialecticalAwareness: CompetencyLevel;  // Understanding dialogue dynamics
    normArticulation: CompetencyLevel;      // Can explain argumentation norms
  };
  
  // Learning trajectory
  trajectory: {
    startDate: Date;
    progressionEvents: ProgressionEvent[];
    currentMilestones: Milestone[];
    suggestedNextSteps: LearningStep[];
  };
}

type CompetencyLevel = 
  | 'UNAWARE'       // Doesn't know this exists
  | 'CONFORMING'    // Follows patterns but can't articulate
  | 'RECOGNIZING'   // Can identify but not produce
  | 'APPLYING'      // Can apply with guidance
  | 'FLUENT'        // Automatic, no guidance needed
  | 'TEACHING'      // Can help others learn
```

### R2: Adaptive UI Scaffolding

Dynamically adjust UI complexity based on developmental stage:

```typescript
interface AdaptiveScaffolding {
  // Scaffolding levels
  levels: {
    HEAVY: {
      // For RDR → ARSA_EARLY
      features: [
        'pre-structured-forms',      // Fill in blanks
        'forced-choice-options',     // Select from options
        'inline-examples',           // See examples at every step
        'validation-guardrails',     // Prevent malformed inputs
        'celebratory-feedback',      // Positive reinforcement
      ];
      hidden: ['advanced-options', 'raw-mode', 'bulk-actions'];
    };
    
    MODERATE: {
      // For ARSA_EARLY → ARSA_MATURE
      features: [
        'guided-forms-with-hints',   // Hints available on hover
        'scheme-suggestions',        // Suggest applicable schemes
        'cq-prompts',               // Prompt for CQ consideration
        'peer-examples',            // Show how others structured
      ];
      hidden: ['expert-mode', 'api-access'];
    };
    
    LIGHT: {
      // For ARSA_MATURE → ARSD_EMERGING
      features: [
        'optional-hints',           // Available but not shown by default
        'advanced-options-visible', // Full options available
        'scheme-authoring',         // Can create new schemes
        'moderation-tools',         // Help guide discussions
      ];
    };
    
    NONE: {
      // For ARSD_FLUENT
      features: [
        'full-expert-mode',         // All options, no hand-holding
        'teaching-tools',           // Can annotate for learners
        'norm-articulation',        // Can document community norms
        'scaffolding-admin',        // Can adjust scaffolding for others
      ];
    };
  };
}
```

### R3: Progression Tracking and Triggers

Track behavior and trigger stage transitions:

```typescript
interface ProgressionTracking {
  // Behaviors that demonstrate competency
  competencySignals: {
    claimFormulation: [
      { action: 'created_atomic_claim', weight: 1 },
      { action: 'claim_accepted_no_edits', weight: 2 },
      { action: 'claim_cited_by_others', weight: 3 },
    ];
    
    schemeApplication: [
      { action: 'applied_scheme_correctly', weight: 2 },
      { action: 'all_cqs_satisfied', weight: 3 },
      { action: 'scheme_not_challenged', weight: 1 },
    ];
    
    attackTyping: [
      { action: 'correct_attack_type_first_try', weight: 2 },
      { action: 'attack_not_reclassified', weight: 1 },
      { action: 'attack_sustained_to_defeat', weight: 3 },
    ];
    
    normArticulation: [
      { action: 'helped_novice_user', weight: 3 },
      { action: 'documented_pattern', weight: 4 },
      { action: 'created_scheme', weight: 5 },
    ];
  };
  
  // Thresholds for level transitions
  transitionThresholds: {
    UNAWARE_to_CONFORMING: 5,    // Started doing it
    CONFORMING_to_RECOGNIZING: 15, // Can identify
    RECOGNIZING_to_APPLYING: 30,   // Can do with guidance
    APPLYING_to_FLUENT: 60,        // Automatic
    FLUENT_to_TEACHING: 100,       // Can teach
  };
}
```

### R4: Contextual Guidance System

Provide just-in-time learning based on current activity:

```typescript
interface ContextualGuidance {
  // When to show guidance
  triggers: {
    // Action-based
    onAction: {
      'creating_claim': ['claim-structure-tips', 'evidence-reminder'];
      'creating_argument': ['scheme-suggestion', 'premise-completeness'];
      'creating_attack': ['attack-type-explainer', 'defeat-conditions'];
      'responding_to_cq': ['burden-of-proof-guide', 'evidence-types'];
    };
    
    // Context-based
    onContext: {
      'first_time_in_deliberation': ['deliberation-overview'];
      'complex_argument_graph': ['graph-navigation-tips'];
      'high_defeat_rate': ['argument-improvement-tips'];
      'stalled_discussion': ['move-suggestion', 'synthesis-prompt'];
    };
    
    // Time-based
    onTime: {
      'idle_in_form': ['help-prompt-after-30s'];
      'rapid_errors': ['slow-down-guidance'];
    };
  };
  
  // How to show guidance
  presentation: {
    TOOLTIP: { intrusiveness: 'low', dismissible: true };
    SIDEBAR_HINT: { intrusiveness: 'low', persistent: true };
    MODAL_TUTORIAL: { intrusiveness: 'high', blocking: true };
    INLINE_EXAMPLE: { intrusiveness: 'medium', contextual: true };
    VIDEO_CLIP: { intrusiveness: 'medium', optional: true };
  };
  
  // Respect user stage
  stageAdjustment: {
    HEAVY: 'show-all-guidance';
    MODERATE: 'show-on-hover-or-error';
    LIGHT: 'show-on-explicit-request';
    NONE: 'hide-unless-new-feature';
  };
}
```

---

## 4.3 Schema Design

### 4.3.1 ArgumentationProfile Model

```prisma
// User's argumentation developmental profile
model ArgumentationProfile {
  id             String   @id @default(cuid())
  userId         BigInt   @unique
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Overall developmental stage
  overallStage   DevelopmentalStage @default(RDR)
  stageUpdatedAt DateTime           @default(now())
  
  // Scaffolding preferences
  scaffoldingLevel ScaffoldingLevel @default(HEAVY)
  scaffoldingOverride Boolean       @default(false)  // User manually set level
  
  // Competency scores (0-100)
  claimFormulation       Int @default(0)
  evidenceRecognition    Int @default(0)
  premiseConclusionStructure Int @default(0)
  schemeRecognition      Int @default(0)
  schemeApplication      Int @default(0)
  attackTyping           Int @default(0)
  defeatRecognition      Int @default(0)
  cqUsage                Int @default(0)
  commitmentTracking     Int @default(0)
  dialecticalAwareness   Int @default(0)
  normArticulation       Int @default(0)
  
  // Aggregate stats
  totalContributions     Int @default(0)
  successfulArguments    Int @default(0)  // IN status sustained
  effectiveAttacks       Int @default(0)  // Led to defeat
  cqsRaised              Int @default(0)
  cqsAnswered            Int @default(0)
  helpActionsGiven       Int @default(0)  // Helped novices
  
  // Learning state
  currentMilestoneId     String?
  currentMilestone       BildungMilestone? @relation("CurrentMilestone", fields: [currentMilestoneId], references: [id], onDelete: SetNull)
  
  // Onboarding state
  onboardingComplete     Boolean  @default(false)
  onboardingStep         Int      @default(0)
  
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  
  // Relations
  progressionEvents      ProgressionEvent[]
  completedMilestones    BildungMilestone[] @relation("CompletedMilestones")
  guidanceHistory        GuidanceEvent[]
  
  @@index([userId])
  @@index([overallStage])
  @@index([scaffoldingLevel])
}

enum DevelopmentalStage {
  RDR            // Reliable Differential Responder (pre-conceptual)
  ARSA_EARLY     // Early Associative ARS
  ARSA_MATURE    // Mature Associative ARS
  ARSD_EMERGING  // Emerging Discursive ARS
  ARSD_FLUENT    // Fluent Discursive ARS
}

enum ScaffoldingLevel {
  HEAVY          // Maximum support
  MODERATE       // Guided with hints
  LIGHT          // Optional hints
  NONE           // Expert mode
}
```

### 4.3.2 ProgressionEvent Model

```prisma
// Track competency-building events
model ProgressionEvent {
  id              String   @id @default(cuid())
  profileId       String
  profile         ArgumentationProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  
  // What happened
  eventType       ProgressionEventType
  competency      String   // Which competency this affects
  points          Int      // Points earned (can be negative)
  
  // Context
  deliberationId  String?
  contributionId  String?  // Claim, Argument, Edge ID
  contributionType String? // 'claim' | 'argument' | 'edge' | 'cq'
  
  // Outcome
  previousScore   Int
  newScore        Int
  triggeredLevelUp Boolean @default(false)
  
  // Metadata
  context         Json?    // Additional context
  createdAt       DateTime @default(now())
  
  @@index([profileId])
  @@index([profileId, competency])
  @@index([createdAt])
  @@index([eventType])
}

enum ProgressionEventType {
  // Positive events
  CLAIM_CREATED
  CLAIM_ACCEPTED
  CLAIM_CITED
  ARGUMENT_CREATED
  ARGUMENT_SUSTAINED    // Maintained IN status
  SCHEME_APPLIED
  CQ_SATISFIED
  ATTACK_TYPED_CORRECTLY
  ATTACK_SUSTAINED
  DEFEAT_ACHIEVED
  NOVICE_HELPED
  PATTERN_DOCUMENTED
  SCHEME_CREATED
  
  // Negative/corrective events
  CLAIM_REJECTED
  ARGUMENT_DEFEATED
  ATTACK_RECLASSIFIED
  CQ_UNANSWERED
  GUIDANCE_NEEDED
  
  // Neutral/tracking
  TUTORIAL_COMPLETED
  MILESTONE_ACHIEVED
  STAGE_TRANSITION
}
```

### 4.3.3 BildungMilestone Model

```prisma
// Learning milestones in the Bildung journey
model BildungMilestone {
  id              String   @id @default(cuid())
  
  // Milestone definition
  key             String   @unique
  name            String
  description     String   @db.Text
  
  // Requirements
  requiredStage   DevelopmentalStage
  requiredCompetencies Json  // { competency: minLevel, ... }
  requiredActions Json?      // { action: count, ... }
  
  // Rewards/unlocks
  unlocks         String[]   // Feature keys unlocked
  badgeKey        String?    // Badge awarded
  scaffoldingChange ScaffoldingLevel?  // New scaffolding level
  
  // Ordering
  category        String     // 'core' | 'advanced' | 'mastery' | 'teaching'
  order           Int
  
  // Relations
  currentFor      ArgumentationProfile[] @relation("CurrentMilestone")
  completedBy     ArgumentationProfile[] @relation("CompletedMilestones")
  
  createdAt       DateTime @default(now())
  
  @@index([requiredStage])
  @@index([category, order])
}
```

### 4.3.4 GuidanceEvent Model

```prisma
// Track guidance shown and user response
model GuidanceEvent {
  id              String   @id @default(cuid())
  profileId       String
  profile         ArgumentationProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  
  // What guidance was shown
  guidanceType    GuidanceType
  guidanceKey     String    // Specific guidance content key
  
  // Context
  triggerContext  String    // What triggered this guidance
  deliberationId  String?
  
  // User response
  response        GuidanceResponse?
  responseAt      DateTime?
  
  // Outcome tracking
  helpedUser      Boolean?  // Did user succeed after guidance?
  
  createdAt       DateTime  @default(now())
  
  @@index([profileId])
  @@index([guidanceType])
  @@index([profileId, createdAt])
}

enum GuidanceType {
  TOOLTIP
  SIDEBAR_HINT
  MODAL_TUTORIAL
  INLINE_EXAMPLE
  VIDEO_CLIP
  ONBOARDING_STEP
  CONTEXTUAL_TIP
}

enum GuidanceResponse {
  DISMISSED
  FOLLOWED
  SKIPPED
  REQUESTED_MORE
  MARKED_HELPFUL
  MARKED_NOT_HELPFUL
}
```

### 4.3.5 User Model Extension

```prisma
// Add to existing User model:
model User {
  // ... existing fields ...
  
  // NEW: Argumentation profile
  argumentationProfile ArgumentationProfile?
}
```

---

## 4.4 API Layer: Bildung Service

### 4.4.1 BildungService Interface

```typescript
// services/bildung.ts

interface BildungService {
  // === PROFILE MANAGEMENT ===
  
  /**
   * Get or create user's argumentation profile
   */
  getProfile(userId: string): Promise<ArgumentationProfile>;
  
  /**
   * Initialize profile for new user
   */
  initializeProfile(userId: string): Promise<ArgumentationProfile>;
  
  // === COMPETENCY TRACKING ===
  
  /**
   * Record a progression event
   */
  recordEvent(params: {
    userId: string;
    eventType: ProgressionEventType;
    competency: string;
    points: number;
    context?: {
      deliberationId?: string;
      contributionId?: string;
      contributionType?: string;
      metadata?: Record<string, any>;
    };
  }): Promise<{
    event: ProgressionEvent;
    profileUpdated: boolean;
    levelUp?: { competency: string; newLevel: string };
    stageTransition?: { from: DevelopmentalStage; to: DevelopmentalStage };
    milestoneAchieved?: BildungMilestone;
  }>;
  
  /**
   * Get competency level for a specific skill
   */
  getCompetencyLevel(
    userId: string, 
    competency: string
  ): Promise<{
    score: number;
    level: CompetencyLevel;
    nextLevelAt: number;
    recentProgress: ProgressionEvent[];
  }>;
  
  /**
   * Check if user should transition stages
   */
  evaluateStageTransition(userId: string): Promise<{
    currentStage: DevelopmentalStage;
    recommendedStage: DevelopmentalStage;
    transitionReady: boolean;
    blockers: string[];
  }>;
  
  // === SCAFFOLDING ===
  
  /**
   * Get appropriate scaffolding level for user
   */
  getScaffoldingLevel(userId: string): Promise<{
    level: ScaffoldingLevel;
    isOverride: boolean;
    features: string[];
    hiddenFeatures: string[];
  }>;
  
  /**
   * Get scaffolded UI config for context
   */
  getUIConfig(params: {
    userId: string;
    context: 'claim_creation' | 'argument_creation' | 'attack_creation' | 
             'cq_response' | 'deliberation_view' | 'scheme_selection';
  }): Promise<{
    scaffoldingLevel: ScaffoldingLevel;
    visibleFields: string[];
    hiddenFields: string[];
    requiredFields: string[];
    hints: Hint[];
    examples: Example[];
    validation: ValidationConfig;
  }>;
  
  /**
   * User manually adjusts scaffolding level
   */
  setScaffoldingOverride(
    userId: string, 
    level: ScaffoldingLevel
  ): Promise<ArgumentationProfile>;
  
  // === GUIDANCE ===
  
  /**
   * Get contextual guidance for current action
   */
  getContextualGuidance(params: {
    userId: string;
    action: string;
    context: Record<string, any>;
  }): Promise<{
    guidance: Guidance[];
    priority: 'critical' | 'helpful' | 'optional';
    presentation: GuidanceType;
  }>;
  
  /**
   * Record user's response to guidance
   */
  recordGuidanceResponse(params: {
    eventId: string;
    response: GuidanceResponse;
    helpedUser?: boolean;
  }): Promise<GuidanceEvent>;
  
  /**
   * Get next suggested learning step
   */
  getNextLearningStep(userId: string): Promise<{
    milestone: BildungMilestone;
    progress: number;  // 0-100%
    suggestedActions: string[];
    estimatedEffort: string;
  }>;
  
  // === MILESTONES ===
  
  /**
   * Get user's milestone progress
   */
  getMilestoneProgress(userId: string): Promise<{
    completed: BildungMilestone[];
    current: BildungMilestone;
    upcoming: BildungMilestone[];
    overallProgress: number;
  }>;
  
  /**
   * Check and award milestone if completed
   */
  checkMilestoneCompletion(userId: string): Promise<{
    newlyCompleted: BildungMilestone[];
    unlocked: string[];
  }>;
  
  // === ANALYTICS ===
  
  /**
   * Get learning analytics for user
   */
  getLearningAnalytics(userId: string): Promise<{
    stage: DevelopmentalStage;
    competencyRadar: Record<string, number>;
    progressionTrend: { date: Date; score: number }[];
    strengths: string[];
    growthAreas: string[];
    activitySummary: {
      last7Days: number;
      last30Days: number;
      totalContributions: number;
    };
  }>;
}
```

### 4.4.2 Event Hooks for Progression

```typescript
// services/bildungHooks.ts

/**
 * Hook into contribution creation to track progression
 */
export async function onContributionCreated(event: {
  type: 'claim' | 'argument' | 'edge' | 'cq_response';
  id: string;
  userId: string;
  deliberationId: string;
  metadata: Record<string, any>;
}): Promise<void> {
  const bildung = getBildungService();
  
  switch (event.type) {
    case 'claim':
      await bildung.recordEvent({
        userId: event.userId,
        eventType: 'CLAIM_CREATED',
        competency: 'claimFormulation',
        points: 1,
        context: {
          deliberationId: event.deliberationId,
          contributionId: event.id,
          contributionType: 'claim',
        },
      });
      break;
      
    case 'argument':
      // Multiple competencies affected
      await bildung.recordEvent({
        userId: event.userId,
        eventType: 'ARGUMENT_CREATED',
        competency: 'premiseConclusionStructure',
        points: 2,
        context: { contributionId: event.id },
      });
      
      if (event.metadata.schemeId) {
        await bildung.recordEvent({
          userId: event.userId,
          eventType: 'SCHEME_APPLIED',
          competency: 'schemeApplication',
          points: 3,
          context: { 
            contributionId: event.id,
            metadata: { schemeId: event.metadata.schemeId },
          },
        });
      }
      break;
      
    case 'edge':
      if (event.metadata.isAttack) {
        await bildung.recordEvent({
          userId: event.userId,
          eventType: 'ATTACK_TYPED_CORRECTLY',
          competency: 'attackTyping',
          points: 2,
          context: { contributionId: event.id },
        });
      }
      break;
      
    case 'cq_response':
      await bildung.recordEvent({
        userId: event.userId,
        eventType: 'CQ_SATISFIED',
        competency: 'cqUsage',
        points: 3,
        context: { 
          contributionId: event.id,
          metadata: { cqKey: event.metadata.cqKey },
        },
      });
      break;
  }
}

/**
 * Hook into label changes to track argument success
 */
export async function onLabelChanged(event: {
  claimId: string;
  argumentId?: string;
  oldLabel: string;
  newLabel: string;
  deliberationId: string;
}): Promise<void> {
  const bildung = getBildungService();
  
  // Find the argument author
  const argument = event.argumentId ? 
    await prisma.argument.findUnique({
      where: { id: event.argumentId },
      select: { createdById: true },
    }) : null;
  
  if (argument && event.newLabel === 'IN' && event.oldLabel !== 'IN') {
    await bildung.recordEvent({
      userId: argument.createdById,
      eventType: 'ARGUMENT_SUSTAINED',
      competency: 'premiseConclusionStructure',
      points: 5,
      context: { contributionId: event.argumentId },
    });
  } else if (argument && event.newLabel === 'OUT' && event.oldLabel === 'IN') {
    await bildung.recordEvent({
      userId: argument.createdById,
      eventType: 'ARGUMENT_DEFEATED',
      competency: 'premiseConclusionStructure',
      points: -2,
      context: { contributionId: event.argumentId },
    });
  }
}

/**
 * Hook into help actions
 */
export async function onHelpGiven(event: {
  helperId: string;
  helpedUserId: string;
  deliberationId: string;
  helpType: string;
}): Promise<void> {
  const bildung = getBildungService();
  
  // Check if helped user is a novice
  const helpedProfile = await bildung.getProfile(event.helpedUserId);
  
  if (helpedProfile.overallStage === 'RDR' || 
      helpedProfile.overallStage === 'ARSA_EARLY') {
    await bildung.recordEvent({
      userId: event.helperId,
      eventType: 'NOVICE_HELPED',
      competency: 'normArticulation',
      points: 5,
      context: {
        metadata: {
          helpedUserId: event.helpedUserId,
          helpType: event.helpType,
        },
      },
    });
  }
}
```

### 4.4.3 Scaffolding Configuration

```typescript
// config/scaffolding.ts

export const SCAFFOLDING_CONFIGS: Record<ScaffoldingLevel, ScaffoldingConfig> = {
  HEAVY: {
    level: 'HEAVY',
    description: 'Maximum support for new users',
    
    claim_creation: {
      visibleFields: ['text'],
      hiddenFields: ['evidence', 'sources', 'commitmentLevel', 'advancedOptions'],
      requiredFields: ['text'],
      hints: [
        { field: 'text', content: 'State one clear point. What do you want to say?' },
      ],
      examples: [
        { label: 'Good example', text: 'Climate change is caused primarily by human activity.' },
        { label: 'Too vague', text: 'Climate is bad.' },
      ],
      validation: {
        minLength: 10,
        maxLength: 500,
        requiresEvidence: false,
      },
    },
    
    argument_creation: {
      visibleFields: ['conclusion', 'premises'],
      hiddenFields: ['scheme', 'strength', 'cqs', 'advancedOptions'],
      requiredFields: ['conclusion', 'premises'],
      hints: [
        { field: 'conclusion', content: 'What are you trying to prove?' },
        { field: 'premises', content: 'What reasons support your conclusion?' },
      ],
      examples: [
        {
          label: 'Simple argument',
          conclusion: 'We should invest in solar energy.',
          premises: ['Solar energy is renewable', 'Solar costs have dropped 90% in a decade'],
        },
      ],
      validation: {
        minPremises: 1,
        maxPremises: 3,  // Keep simple for beginners
        requiresScheme: false,
      },
    },
    
    attack_creation: {
      visibleFields: ['targetClaim', 'attackType', 'reason'],
      hiddenFields: ['defeatType', 'aspicMapping', 'preferenceOrder'],
      requiredFields: ['targetClaim', 'attackType', 'reason'],
      hints: [
        { 
          field: 'attackType', 
          content: 'Choose how your response challenges the claim.',
          options: [
            { value: 'REBUTS', label: 'I disagree with the conclusion', icon: '🔄' },
            { value: 'UNDERCUTS', label: 'The reasoning is flawed', icon: '✂️' },
            { value: 'UNDERMINES', label: 'A premise is wrong', icon: '🎯' },
          ],
        },
      ],
      validation: {
        requiresReason: true,
        minReasonLength: 20,
      },
    },
  },
  
  MODERATE: {
    level: 'MODERATE',
    description: 'Guided with hints available on hover',
    
    claim_creation: {
      visibleFields: ['text', 'evidence', 'commitmentLevel'],
      hiddenFields: ['advancedOptions'],
      requiredFields: ['text'],
      hints: [
        { field: 'evidence', content: 'Add sources to strengthen your claim (optional)' },
      ],
      validation: {
        minLength: 10,
        maxLength: 1000,
        requiresEvidence: false,
      },
    },
    
    argument_creation: {
      visibleFields: ['conclusion', 'premises', 'scheme'],
      hiddenFields: ['advancedOptions'],
      requiredFields: ['conclusion', 'premises'],
      hints: [
        { field: 'scheme', content: 'Try using an argument pattern to strengthen your reasoning' },
      ],
      schemeSuggestions: true,  // Show relevant schemes
      validation: {
        minPremises: 1,
        maxPremises: 5,
        requiresScheme: false,  // Encouraged but not required
      },
    },
    
    attack_creation: {
      visibleFields: ['targetClaim', 'attackType', 'reason', 'defeatType'],
      requiredFields: ['targetClaim', 'attackType', 'reason'],
      validation: {
        requiresReason: true,
      },
    },
  },
  
  LIGHT: {
    level: 'LIGHT',
    description: 'Optional hints, advanced options visible',
    
    claim_creation: {
      visibleFields: ['text', 'evidence', 'sources', 'commitmentLevel', 'advancedOptions'],
      requiredFields: ['text'],
      validation: {
        minLength: 5,
        maxLength: 2000,
      },
    },
    
    argument_creation: {
      visibleFields: 'all',
      requiredFields: ['conclusion'],  // Only conclusion required
      schemeAuthoring: true,  // Can create new schemes
      validation: {
        maxPremises: 10,
      },
    },
    
    attack_creation: {
      visibleFields: 'all',
      requiredFields: ['targetClaim', 'attackType'],
      aspicMappingVisible: true,
    },
  },
  
  NONE: {
    level: 'NONE',
    description: 'Full expert mode',
    
    claim_creation: {
      visibleFields: 'all',
      requiredFields: [],  // User knows what they're doing
      bulkMode: true,
      apiAccess: true,
    },
    
    argument_creation: {
      visibleFields: 'all',
      requiredFields: [],
      rawMode: true,
      schemeAuthoring: true,
      cqManagement: true,
    },
    
    attack_creation: {
      visibleFields: 'all',
      requiredFields: [],
      preferenceEditing: true,
    },
  },
};
```

---

## 4.5 Milestone Seed Data

```typescript
// seeds/bildung-milestones.ts

export const CORE_MILESTONES: BildungMilestone[] = [
  // === RDR STAGE ===
  {
    key: 'first_claim',
    name: 'First Words',
    description: 'Create your first claim in a deliberation.',
    requiredStage: 'RDR',
    requiredCompetencies: {},
    requiredActions: { claim_created: 1 },
    unlocks: [],
    category: 'core',
    order: 1,
  },
  {
    key: 'first_argument',
    name: 'Making a Case',
    description: 'Create your first argument with premises and conclusion.',
    requiredStage: 'RDR',
    requiredCompetencies: { claimFormulation: 5 },
    requiredActions: { argument_created: 1 },
    unlocks: ['argument_creation'],
    scaffoldingChange: 'HEAVY',
    category: 'core',
    order: 2,
  },
  
  // === ARSA_EARLY STAGE ===
  {
    key: 'first_challenge',
    name: 'Entering the Fray',
    description: 'Challenge another user\'s claim or argument.',
    requiredStage: 'ARSA_EARLY',
    requiredCompetencies: { premiseConclusionStructure: 10 },
    requiredActions: { attack_created: 1 },
    unlocks: ['attack_creation'],
    category: 'core',
    order: 3,
  },
  {
    key: 'scheme_novice',
    name: 'Pattern Recognition',
    description: 'Apply an argument scheme to structure your reasoning.',
    requiredStage: 'ARSA_EARLY',
    requiredCompetencies: { premiseConclusionStructure: 15 },
    requiredActions: { scheme_applied: 3 },
    unlocks: ['scheme_browser'],
    category: 'core',
    order: 4,
  },
  {
    key: 'cq_responder',
    name: 'Standing Up to Scrutiny',
    description: 'Successfully answer 5 critical questions raised against your arguments.',
    requiredStage: 'ARSA_EARLY',
    requiredCompetencies: { schemeApplication: 15 },
    requiredActions: { cq_satisfied: 5 },
    unlocks: ['cq_panel'],
    scaffoldingChange: 'MODERATE',
    category: 'core',
    order: 5,
  },
  
  // === ARSA_MATURE STAGE ===
  {
    key: 'effective_attacker',
    name: 'Sharp Critique',
    description: 'Your attacks have led to 5 defeats.',
    requiredStage: 'ARSA_MATURE',
    requiredCompetencies: { attackTyping: 25, defeatRecognition: 20 },
    requiredActions: { defeat_achieved: 5 },
    unlocks: ['defeat_analysis'],
    category: 'advanced',
    order: 6,
  },
  {
    key: 'scheme_adept',
    name: 'Argument Architect',
    description: 'Successfully apply 5 different argument schemes.',
    requiredStage: 'ARSA_MATURE',
    requiredCompetencies: { schemeRecognition: 30, schemeApplication: 30 },
    requiredActions: { unique_schemes_used: 5 },
    unlocks: ['all_schemes'],
    category: 'advanced',
    order: 7,
  },
  {
    key: 'sustained_reasoner',
    name: 'Reliable Reasoner',
    description: '10 of your arguments have maintained IN status.',
    requiredStage: 'ARSA_MATURE',
    requiredCompetencies: { premiseConclusionStructure: 40 },
    requiredActions: { argument_sustained: 10 },
    scaffoldingChange: 'LIGHT',
    category: 'advanced',
    order: 8,
  },
  
  // === ARSD_EMERGING STAGE ===
  {
    key: 'commitment_tracker',
    name: 'Keeping Score',
    description: 'Demonstrate awareness of your commitments and their implications.',
    requiredStage: 'ARSD_EMERGING',
    requiredCompetencies: { commitmentTracking: 40, dialecticalAwareness: 30 },
    unlocks: ['commitment_dashboard'],
    category: 'mastery',
    order: 9,
  },
  {
    key: 'cq_challenger',
    name: 'Critical Questioner',
    description: 'Raise critical questions that lead to 5 ticket suspensions.',
    requiredStage: 'ARSD_EMERGING',
    requiredCompetencies: { cqUsage: 40 },
    requiredActions: { cq_led_to_suspension: 5 },
    unlocks: ['cq_authoring'],
    category: 'mastery',
    order: 10,
  },
  
  // === ARSD_FLUENT STAGE ===
  {
    key: 'novice_guide',
    name: 'Guide',
    description: 'Help 10 novice users improve their contributions.',
    requiredStage: 'ARSD_FLUENT',
    requiredCompetencies: { normArticulation: 50 },
    requiredActions: { novice_helped: 10 },
    unlocks: ['mentorship_tools'],
    category: 'teaching',
    order: 11,
  },
  {
    key: 'scheme_author',
    name: 'Pattern Maker',
    description: 'Create a new argument scheme adopted by the community.',
    requiredStage: 'ARSD_FLUENT',
    requiredCompetencies: { schemeApplication: 60, normArticulation: 60 },
    requiredActions: { scheme_created_and_used: 1 },
    unlocks: ['scheme_authoring'],
    badgeKey: 'scheme_author',
    category: 'teaching',
    order: 12,
  },
  {
    key: 'master_dialectician',
    name: 'Master Dialectician',
    description: 'Achieve fluency across all argumentation competencies.',
    requiredStage: 'ARSD_FLUENT',
    requiredCompetencies: {
      claimFormulation: 60,
      evidenceRecognition: 60,
      premiseConclusionStructure: 60,
      schemeRecognition: 60,
      schemeApplication: 60,
      attackTyping: 60,
      defeatRecognition: 60,
      cqUsage: 60,
      commitmentTracking: 60,
      dialecticalAwareness: 60,
      normArticulation: 60,
    },
    scaffoldingChange: 'NONE',
    badgeKey: 'master_dialectician',
    category: 'teaching',
    order: 13,
  },
];
```

---

## 4.6 Migration Strategy

### Step 1: Add New Models

```bash
# Add ArgumentationProfile, ProgressionEvent, BildungMilestone, GuidanceEvent
npx prisma db push
```

### Step 2: Seed Milestones

```typescript
// scripts/seed-bildung-milestones.ts

async function seedBildungMilestones() {
  for (const milestone of CORE_MILESTONES) {
    await prisma.bildungMilestone.upsert({
      where: { key: milestone.key },
      create: milestone,
      update: milestone,
    });
  }
  console.log(`Seeded ${CORE_MILESTONES.length} milestones`);
}
```

### Step 3: Backfill User Profiles

```typescript
// scripts/backfill-argumentation-profiles.ts

async function backfillArgumentationProfiles() {
  const users = await prisma.user.findMany({
    where: { argumentationProfile: null },
    select: { id: true },
  });
  
  for (const user of users) {
    await prisma.argumentationProfile.create({
      data: {
        userId: user.id,
        overallStage: 'RDR',  // Start at beginning
        scaffoldingLevel: 'HEAVY',
      },
    });
  }
  
  console.log(`Created profiles for ${users.length} users`);
}
```

### Step 4: Wire Up Event Hooks

Add hooks to existing contribution flows:
- `onClaimCreated` → recordEvent
- `onArgumentCreated` → recordEvent
- `onEdgeCreated` → recordEvent
- `onCQResponseCreated` → recordEvent
- `onLabelChanged` → recordEvent
- `onHelpGiven` → recordEvent

### Step 5: Integrate Scaffolding in UI

```typescript
// components/ArgumentForm.tsx (example)

export function ArgumentForm({ deliberationId }: Props) {
  const { data: scaffolding } = useScaffolding('argument_creation');
  
  return (
    <form>
      {scaffolding.visibleFields.includes('conclusion') && (
        <ClaimInput
          label="Conclusion"
          required={scaffolding.requiredFields.includes('conclusion')}
          hint={scaffolding.hints.find(h => h.field === 'conclusion')?.content}
        />
      )}
      
      {scaffolding.visibleFields.includes('premises') && (
        <PremiseList
          max={scaffolding.validation.maxPremises}
          hint={scaffolding.hints.find(h => h.field === 'premises')?.content}
        />
      )}
      
      {scaffolding.visibleFields.includes('scheme') && (
        <SchemeSelector
          suggestions={scaffolding.schemeSuggestions}
          required={scaffolding.validation.requiresScheme}
        />
      )}
      
      {scaffolding.examples && (
        <ExamplePanel examples={scaffolding.examples} />
      )}
    </form>
  );
}
```

---

## 4.7 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Profile creation | 100% | All users have ArgumentationProfile |
| Milestone seeding | 100% | All milestones seeded |
| Event tracking | > 95% | Contributions trigger events |
| Stage accuracy | > 80% | Stage matches observable behavior |
| Scaffolding applied | 100% | UI respects scaffolding level |
| Progression rate | > 50% | Users advance at least 1 competency/month |
| Milestone completion | > 30% | Users complete at least 3 milestones |
| User satisfaction | > 4.0/5 | Scaffolding helpfulness rating |

---

## Phase 4 Status

- [x] 4.1 Overview — Complete
- [x] 4.2 Requirements — Complete
- [x] 4.3 Schema Design — Complete
- [x] 4.4 API Layer — Complete
- [x] 4.5 Milestone Seed Data — Complete
- [x] 4.6 Migration Strategy — Complete
- [ ] 4.7 Implementation — Not started
- [ ] 4.8 Testing — Not started

---

## Connection to Sellarsian Framework

| Sellarsian Concept | Phase 4 Implementation |
|-------------------|----------------------|
| **RDR → ARS** | DevelopmentalStage progression model |
| **ARSA → ARSD** | Competency levels track associative → discursive |
| **Ought-to-Be's** | HEAVY scaffolding enforces norms without concepts |
| **Ought-to-Do's** | LIGHT/NONE scaffolding for conceptual mastery |
| **Bildung (Second Nature)** | Progressive disclosure, milestone journey |
| **Pattern-Governed → Rule-Obeying** | Transition from CONFORMING to TEACHING |
| **Linguistic Community** | Novice helping tracks community self-perpetuation |

---

## Next Steps

After Phase 4 implementation:
1. **Phase 5:** Implement dialectical move recommendations
2. **Phase 6:** Create picturing-based feedback systems

---

# Phase 5: Dialectical Move Recommendations — The Game of Giving and Asking for Reasons

## 5.1 Overview: Sellarsian Dialectics

From the Deep Study synthesis, Sellars frames rational discourse as a **game**:

> "The space of reasons is constituted by moves in the game of giving and asking for reasons. Each move creates obligations, licenses responses, and shifts the dialectical landscape."

Key Sellarsian concepts for move recommendations:

| Concept | Description | Platform Relevance |
|---------|-------------|-------------------|
| **Illocutionary Force** | What a speech act *does* (assert, question, concede) | DialogueMove.kind/illocution |
| **Commitment Incurrence** | What you become committed to by making a move | Commitment tracking |
| **Entitlement Challenge** | WHY-moves that demand justification | CQ raising, burden shifting |
| **Licensed Responses** | What moves are appropriate given the state | Move recommendations |
| **Dialectical Obligations** | What you *must* do to maintain standing | Pending obligations tracking |

### Current Infrastructure Analysis

The existing Mesh platform has:

| Component | Location | Current State |
|-----------|----------|---------------|
| `DialogueMove` | schema.prisma:3880 | Full model with kind, illocution, payload, threading |
| `Illocution` enum | schema.prisma:3788 | Assert, Question, Argue, Concede, Retract, Close, etc. |
| `DialogueVisualizationNode` | schema.prisma:3944 | Pure dialogue moves (WHY, CONCEDE, etc.) |
| `CQStatus` / `CQAttack` | schema.prisma | CQ lifecycle tracking |
| `Commitment` | schema.prisma | User commitment stores |

### The Gap

Current system tracks moves but doesn't:
- **Recommend** next moves based on dialectical state
- **Enforce** dialectical obligations (e.g., must respond to WHY)
- **Surface** opportunities (e.g., this claim is vulnerable to CQ X)
- **Adapt** recommendations to user developmental stage (Phase 4)

---

## 5.2 Requirements

### R1: Dialectical State Model

Track the current "state of play" for each deliberation:

```typescript
interface DialecticalState {
  deliberationId: string;
  
  // Active participants and their roles
  participants: {
    userId: string;
    role: 'proponent' | 'opponent' | 'neutral' | 'moderator';
    currentBurden: string[];  // What obligations they have
  }[];
  
  // Pending obligations (must respond)
  pendingObligations: {
    obligatedUserId: string;
    obligationType: 'respond_to_why' | 'satisfy_cq' | 'provide_grounds' | 'address_attack';
    targetMoveId: string;
    deadline?: Date;
    urgency: 'critical' | 'high' | 'normal' | 'low';
  }[];
  
  // Open loci (unresolved issues)
  openLoci: {
    locusId: string;
    locusType: 'claim' | 'argument' | 'cq';
    status: 'contested' | 'challenged' | 'undefended';
    activeParticipants: string[];
  }[];
  
  // Recent move context
  recentMoves: {
    moveId: string;
    kind: string;
    actorId: string;
    licensedResponses: string[];
  }[];
  
  // Phase state
  currentPhase: 'opening' | 'argumentation' | 'closing' | 'resolved';
}
```

### R2: Move Recommendation Engine

Generate contextual move recommendations:

```typescript
interface MoveRecommendation {
  id: string;
  
  // What move is recommended
  moveType: DialogueMoveKind;
  target?: {
    type: 'claim' | 'argument' | 'move' | 'cq';
    id: string;
  };
  
  // Why this move
  rationale: string;
  dialecticalReason: DialecticalReason;
  
  // Scoring
  priority: 'critical' | 'high' | 'medium' | 'low' | 'optional';
  relevanceScore: number;  // 0-100
  
  // Scaffolding integration (Phase 4)
  developmentalStage: DevelopmentalStage;  // Appropriate for users at this stage
  scaffoldingHints: string[];
  
  // Preview of move effects
  effects: {
    commitments: CommitmentDelta;
    burdenShifts: BurdenShift[];
    expectedResponses: string[];
  };
}

type DialecticalReason =
  | 'obligation_pending'      // You must respond to this
  | 'opportunity_attack'      // This claim is vulnerable
  | 'opportunity_support'     // This claim needs support
  | 'cq_unaddressed'         // CQ remains open
  | 'synthesis_available'    // Can synthesize positions
  | 'closure_possible'       // Can close this locus
  | 'commitment_conflict'    // Your commitments conflict
  | 'position_undefended'    // Your position needs defense
  | 'new_evidence_relevant'  // New evidence affects your claims
  | 'dialogue_stalled'       // Discussion needs movement
```

### R3: Move Licensing Rules

Define what moves are licensed in each state:

```typescript
interface MoveLicensingRules {
  // After ASSERT
  afterAssert: {
    licensed: ['WHY', 'GROUNDS', 'CONCEDE', 'ATTACK', 'SUPPORT'];
    required: [];  // No obligation
    prohibited: ['CLOSE'];  // Can't close immediately
  };
  
  // After WHY (challenge)
  afterWhy: {
    licensed: ['GROUNDS', 'RETRACT', 'REDIRECT'];
    required: ['GROUNDS' | 'RETRACT'];  // Must respond
    prohibited: [];
    obligationHolder: 'target_of_why';
    deadline: 'P3D';  // 3 days to respond
  };
  
  // After GROUNDS (response to WHY)
  afterGrounds: {
    licensed: ['CONCEDE', 'WHY', 'ATTACK', 'ACCEPT'];
    required: [];
    prohibited: [];
  };
  
  // After ATTACK
  afterAttack: {
    licensed: ['DEFEND', 'CONCEDE', 'RETRACT', 'COUNTER'];
    required: ['DEFEND' | 'CONCEDE' | 'RETRACT'];  // Must respond
    obligationHolder: 'author_of_attacked';
    deadline: 'P5D';
  };
  
  // After CQ_RAISE
  afterCqRaise: {
    licensed: ['CQ_SATISFY', 'CQ_REBUT', 'RETRACT'];
    required: ['CQ_SATISFY' | 'CQ_REBUT' | 'RETRACT'];
    obligationHolder: 'author_of_argument';
    deadline: 'P7D';
    burdenShift: true;
  };
  
  // After CONCEDE
  afterConcede: {
    licensed: ['CLOSE', 'THEREFORE', 'REDIRECT'];
    required: [];
    prohibited: [];
  };
  
  // After RETRACT
  afterRetract: {
    licensed: ['CLOSE', 'NEW_ASSERT'];
    required: [];
    prohibited: [];
  };
}
```

### R4: Stage-Aware Recommendations

Adapt recommendations to user's developmental stage (Phase 4):

```typescript
interface StageAwareRecommendations {
  // RDR / ARSA_EARLY: Simple, guided moves
  HEAVY: {
    maxRecommendations: 3;
    moveTypes: ['ASSERT', 'SUPPORT', 'WHY'];  // Simple moves only
    explanationLevel: 'detailed';
    showExamples: true;
    hideAdvanced: ['SUPPOSE', 'DISCHARGE', 'REDIRECT'];
  };
  
  // ARSA_MATURE: More options
  MODERATE: {
    maxRecommendations: 5;
    moveTypes: ['ASSERT', 'SUPPORT', 'WHY', 'ATTACK', 'GROUNDS', 'CONCEDE'];
    explanationLevel: 'summary';
    showExamples: false;
    hideAdvanced: ['SUPPOSE', 'DISCHARGE'];
  };
  
  // ARSD_EMERGING: Full tactical awareness
  LIGHT: {
    maxRecommendations: 8;
    moveTypes: 'all';
    explanationLevel: 'minimal';
    showStrategicAnalysis: true;
  };
  
  // ARSD_FLUENT: Complete control
  NONE: {
    maxRecommendations: 10;
    moveTypes: 'all';
    explanationLevel: 'none';  // User knows what to do
    showOpponentAnalysis: true;
    showCommitmentGraph: true;
  };
}
```

---

## 5.3 Schema Design

### 5.3.1 DialecticalState Model

```prisma
// Current dialectical state of a deliberation
model DialecticalState {
  id             String   @id @default(cuid())
  deliberationId String   @unique
  
  // Phase tracking
  currentPhase   DialecticalPhase @default(OPENING)
  phaseStartedAt DateTime         @default(now())
  
  // Computed state snapshot (cached, refreshed on moves)
  stateSnapshot  Json?    // Full DialecticalState object
  snapshotAt     DateTime @default(now())
  
  // Activity metrics
  totalMoves     Int      @default(0)
  lastMoveAt     DateTime?
  activeParticipantCount Int @default(0)
  
  // Stall detection
  isStalled      Boolean  @default(false)
  stalledSince   DateTime?
  stallReason    String?
  
  deliberation   Deliberation @relation(fields: [deliberationId], references: [id], onDelete: Cascade)
  
  // Relations
  obligations    DialecticalObligation[]
  openLoci       OpenLocus[]
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@index([deliberationId])
  @@index([currentPhase])
  @@index([isStalled])
}

enum DialecticalPhase {
  OPENING        // Initial claims being made
  ARGUMENTATION  // Active argument/counter-argument
  SYNTHESIS      // Finding common ground
  CLOSING        // Wrapping up
  RESOLVED       // Deliberation complete
}
```

### 5.3.2 DialecticalObligation Model

```prisma
// Pending dialectical obligations
model DialecticalObligation {
  id              String   @id @default(cuid())
  dialecticalStateId String
  dialecticalState DialecticalState @relation(fields: [dialecticalStateId], references: [id], onDelete: Cascade)
  
  // Who is obligated
  obligatedUserId String
  
  // What they must do
  obligationType  ObligationType
  
  // What triggered this obligation
  triggerMoveId   String
  triggerMoveKind String
  
  // Target of response
  targetType      String   // 'claim' | 'argument' | 'move' | 'cq'
  targetId        String
  
  // Timing
  createdAt       DateTime @default(now())
  deadline        DateTime?
  urgency         ObligationUrgency @default(NORMAL)
  
  // Resolution
  status          ObligationStatus @default(PENDING)
  resolvedAt      DateTime?
  resolvedByMoveId String?
  resolutionType  String?  // 'satisfied' | 'waived' | 'defaulted' | 'superseded'
  
  @@index([dialecticalStateId])
  @@index([obligatedUserId])
  @@index([status])
  @@index([deadline])
  @@index([obligatedUserId, status])
}

enum ObligationType {
  RESPOND_TO_WHY    // Must provide grounds or retract
  SATISFY_CQ        // Must address critical question
  DEFEND_ATTACK     // Must defend against attack
  PROVIDE_GROUNDS   // Must justify assertion
  CLARIFY           // Must clarify ambiguous claim
  RESOLVE_CONFLICT  // Must address commitment conflict
}

enum ObligationUrgency {
  CRITICAL   // Immediate response needed
  HIGH       // Should respond soon
  NORMAL     // Standard timeframe
  LOW        // Optional/soft deadline
}

enum ObligationStatus {
  PENDING     // Not yet addressed
  OVERDUE     // Past deadline
  SATISFIED   // Fulfilled
  WAIVED      // Explicitly waived by challenger
  DEFAULTED   // User failed to respond
  SUPERSEDED  // Replaced by new obligation
}
```

### 5.3.3 OpenLocus Model

```prisma
// Open issues/loci in the deliberation
model OpenLocus {
  id              String   @id @default(cuid())
  dialecticalStateId String
  dialecticalState DialecticalState @relation(fields: [dialecticalStateId], references: [id], onDelete: Cascade)
  
  // What the locus is about
  locusType       LocusType
  targetType      String   // 'claim' | 'argument' | 'cq'
  targetId        String
  
  // Status
  status          LocusStatus @default(CONTESTED)
  
  // Participants
  proponentIds    String[]
  opponentIds     String[]
  
  // Tracking
  openedAt        DateTime @default(now())
  lastActivityAt  DateTime @default(now())
  closedAt        DateTime?
  closedByMoveId  String?
  
  // Analysis
  moveCount       Int      @default(0)
  depth           Int      @default(0)  // How deep in argument tree
  
  @@index([dialecticalStateId])
  @@index([status])
  @@index([locusType])
  @@index([dialecticalStateId, status])
}

enum LocusType {
  CONTESTED_CLAIM     // Claim with active challenges
  UNDEFENDED_CLAIM    // Claim without support
  OPEN_CQ             // Unanswered critical question
  ACTIVE_ATTACK       // Unresolved attack
  SYNTHESIS_POINT     // Potential agreement area
}

enum LocusStatus {
  CONTESTED    // Active disagreement
  CHALLENGED   // Under challenge, awaiting response
  UNDEFENDED   // Needs support
  RESOLVED     // Issue closed
  ABANDONED    // No longer pursued
}
```

### 5.3.4 MoveRecommendation Model

```prisma
// Generated move recommendations
model MoveRecommendation {
  id              String   @id @default(cuid())
  deliberationId  String
  forUserId       String
  
  // The recommendation
  moveType        String   // DialogueMove kind
  targetType      String?  // 'claim' | 'argument' | 'move' | 'cq'
  targetId        String?
  
  // Scoring
  priority        RecommendationPriority
  relevanceScore  Int      // 0-100
  
  // Reasoning
  dialecticalReason String
  rationale       String   @db.Text
  
  // Scaffolding (from Phase 4)
  forStage        String?  // DevelopmentalStage this is appropriate for
  scaffoldingHints Json?   // Hints for the user
  
  // Effect preview
  effectsPreview  Json?    // Commitment delta, burden shifts, etc.
  
  // Status
  status          RecommendationStatus @default(ACTIVE)
  dismissedAt     DateTime?
  actedOnAt       DateTime?
  actedOnMoveId   String?  // If user made this move
  
  createdAt       DateTime @default(now())
  expiresAt       DateTime?
  
  @@index([deliberationId, forUserId])
  @@index([forUserId, status])
  @@index([deliberationId, priority])
  @@index([createdAt])
}

enum RecommendationPriority {
  CRITICAL   // Must do this (obligation)
  HIGH       // Strong suggestion
  MEDIUM     // Good opportunity
  LOW        // Minor improvement
  OPTIONAL   // Nice to have
}

enum RecommendationStatus {
  ACTIVE     // Currently relevant
  DISMISSED  // User dismissed
  ACTED_ON   // User followed recommendation
  EXPIRED    // No longer relevant
  SUPERSEDED // Replaced by newer recommendation
}
```

### 5.3.5 MoveLicenseRule Model

```prisma
// Move licensing rules (configurable)
model MoveLicenseRule {
  id              String   @id @default(cuid())
  
  // After what move type
  afterMoveKind   String
  
  // What's licensed
  licensedMoves   String[]
  requiredMoves   String[]
  prohibitedMoves String[]
  
  // Obligation creation
  createsObligation Boolean @default(false)
  obligationType  String?
  obligationFor   String?  // 'actor' | 'target_author' | 'all_participants'
  deadline        String?  // ISO 8601 duration (e.g., 'P3D')
  urgency         String?
  
  // Burden effects
  shiftsBurden    Boolean  @default(false)
  burdenFrom      String?
  burdenTo        String?
  
  // Conditions
  conditions      Json?    // Additional conditions for this rule
  
  // Priority for rule resolution
  priority        Int      @default(0)
  
  createdAt       DateTime @default(now())
  
  @@unique([afterMoveKind])
  @@index([afterMoveKind])
}
```

### 5.3.6 Deliberation Model Extension

```prisma
// Add to existing Deliberation model:
model Deliberation {
  // ... existing fields ...
  
  // NEW: Dialectical state relation
  dialecticalState DialecticalState?
}
```

---

## 5.4 API Layer: Dialectical Recommendation Service

### 5.4.1 DialecticalRecommendationService

```typescript
// services/dialecticalRecommendation.ts

interface DialecticalRecommendationService {
  // === STATE MANAGEMENT ===
  
  /**
   * Get or create dialectical state for deliberation
   */
  getDialecticalState(deliberationId: string): Promise<DialecticalState>;
  
  /**
   * Update state after a move
   */
  onMoveCreated(move: DialogueMove): Promise<{
    state: DialecticalState;
    obligationsCreated: DialecticalObligation[];
    obligationsSatisfied: DialecticalObligation[];
    lociOpened: OpenLocus[];
    lociClosed: OpenLocus[];
  }>;
  
  /**
   * Refresh state snapshot
   */
  refreshStateSnapshot(deliberationId: string): Promise<DialecticalState>;
  
  // === RECOMMENDATIONS ===
  
  /**
   * Get recommendations for a user
   */
  getRecommendations(params: {
    deliberationId: string;
    userId: string;
    limit?: number;
    minPriority?: RecommendationPriority;
  }): Promise<MoveRecommendation[]>;
  
  /**
   * Generate fresh recommendations
   */
  generateRecommendations(params: {
    deliberationId: string;
    userId: string;
  }): Promise<MoveRecommendation[]>;
  
  /**
   * Get recommendations for specific context
   */
  getContextualRecommendations(params: {
    deliberationId: string;
    userId: string;
    context: 'viewing_claim' | 'viewing_argument' | 'in_thread' | 'overview';
    targetId?: string;
  }): Promise<MoveRecommendation[]>;
  
  /**
   * Record user response to recommendation
   */
  recordRecommendationResponse(params: {
    recommendationId: string;
    response: 'dismissed' | 'acted_on';
    moveId?: string;  // If acted on
  }): Promise<MoveRecommendation>;
  
  // === OBLIGATIONS ===
  
  /**
   * Get pending obligations for user
   */
  getPendingObligations(params: {
    userId: string;
    deliberationId?: string;
  }): Promise<DialecticalObligation[]>;
  
  /**
   * Check for overdue obligations
   */
  checkOverdueObligations(): Promise<{
    newlyOverdue: DialecticalObligation[];
    notified: string[];  // User IDs notified
  }>;
  
  // === OPEN LOCI ===
  
  /**
   * Get open loci for deliberation
   */
  getOpenLoci(params: {
    deliberationId: string;
    status?: LocusStatus;
    type?: LocusType;
  }): Promise<OpenLocus[]>;
  
  /**
   * Find synthesis opportunities
   */
  findSynthesisOpportunities(deliberationId: string): Promise<{
    loci: OpenLocus[];
    potentialAgreements: {
      locusId: string;
      participants: string[];
      commonGround: string[];
    }[];
  }>;
  
  // === MOVE LICENSING ===
  
  /**
   * Get licensed moves for current state
   */
  getLicensedMoves(params: {
    deliberationId: string;
    userId: string;
    afterMoveId?: string;
  }): Promise<{
    licensed: string[];
    required: string[];
    prohibited: string[];
    recommendations: MoveRecommendation[];
  }>;
  
  /**
   * Check if a move is licensed
   */
  isMoveAllowed(params: {
    deliberationId: string;
    userId: string;
    moveType: string;
    targetId?: string;
  }): Promise<{
    allowed: boolean;
    reason?: string;
    alternatives?: string[];
  }>;
  
  // === STALL DETECTION ===
  
  /**
   * Detect and handle stalled deliberations
   */
  detectStalls(): Promise<{
    stalledDeliberations: string[];
    suggestions: {
      deliberationId: string;
      reason: string;
      suggestedMoves: MoveRecommendation[];
    }[];
  }>;
  
  // === ANALYTICS ===
  
  /**
   * Get dialectical analytics for deliberation
   */
  getDialecticalAnalytics(deliberationId: string): Promise<{
    phaseHistory: { phase: string; duration: number }[];
    obligationStats: {
      created: number;
      satisfied: number;
      defaulted: number;
    };
    participantBalance: {
      userId: string;
      moveCount: number;
      obligationsSatisfied: number;
      attacksLaunched: number;
      attacksReceived: number;
    }[];
    effectiveMoves: {
      moveId: string;
      effect: string;
    }[];
  }>;
}
```

### 5.4.2 Recommendation Generation Algorithm

```typescript
// lib/dialectical/recommendations.ts

interface RecommendationContext {
  deliberation: Deliberation;
  state: DialecticalState;
  user: User;
  profile: ArgumentationProfile;  // From Phase 4
  
  // User's current position
  userClaims: Claim[];
  userArguments: Argument[];
  userCommitments: Commitment[];
  
  // Deliberation state
  allClaims: Claim[];
  allArguments: Argument[];
  labels: Map<string, GroundLabel>;  // From Phase 3
  tickets: Map<string, InferenceTicket>;  // From Phase 2
}

/**
 * Generate move recommendations for a user
 */
async function generateRecommendations(
  ctx: RecommendationContext
): Promise<MoveRecommendation[]> {
  const recommendations: MoveRecommendation[] = [];
  
  // 1. CRITICAL: Pending obligations (must do)
  const obligations = ctx.state.obligations.filter(
    o => o.obligatedUserId === ctx.user.id && o.status === 'PENDING'
  );
  
  for (const obligation of obligations) {
    recommendations.push({
      moveType: getObligationResponseMove(obligation),
      targetType: obligation.targetType,
      targetId: obligation.targetId,
      priority: obligation.urgency === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      dialecticalReason: 'obligation_pending',
      rationale: generateObligationRationale(obligation),
      relevanceScore: 100 - getObligationAgeScore(obligation),
      forStage: 'all',  // Obligations apply to all stages
      effectsPreview: previewObligationResponse(obligation),
    });
  }
  
  // 2. HIGH: Attack opportunities (opponent vulnerabilities)
  const vulnerableClaims = findVulnerableClaims(ctx);
  for (const claim of vulnerableClaims) {
    if (ctx.profile.overallStage !== 'RDR') {  // Not for beginners
      recommendations.push({
        moveType: 'ATTACK',
        targetType: 'claim',
        targetId: claim.id,
        priority: 'HIGH',
        dialecticalReason: 'opportunity_attack',
        rationale: `This claim (${truncate(claim.text)}) has ${claim.vulnerabilities.join(', ')}`,
        relevanceScore: claim.vulnerabilityScore,
        forStage: claim.vulnerabilityComplexity,
        effectsPreview: previewAttack(claim),
      });
    }
  }
  
  // 3. HIGH: Defend own positions under attack
  const attackedPositions = findAttackedUserPositions(ctx);
  for (const position of attackedPositions) {
    recommendations.push({
      moveType: 'DEFEND',
      targetType: position.type,
      targetId: position.id,
      priority: 'HIGH',
      dialecticalReason: 'position_undefended',
      rationale: `Your ${position.type} is under attack and needs defense`,
      relevanceScore: 90,
      forStage: 'all',
      effectsPreview: previewDefense(position),
    });
  }
  
  // 4. MEDIUM: Unaddressed CQs on own arguments
  const openCQs = findOpenCQsForUser(ctx);
  for (const cq of openCQs) {
    recommendations.push({
      moveType: 'CQ_SATISFY',
      targetType: 'cq',
      targetId: cq.id,
      priority: 'MEDIUM',
      dialecticalReason: 'cq_unaddressed',
      rationale: `Critical question "${cq.text}" remains open on your argument`,
      relevanceScore: 85,
      forStage: getStageForCQ(cq),
      scaffoldingHints: getCQScaffoldingHints(cq, ctx.profile),
    });
  }
  
  // 5. MEDIUM: Support opportunities (strengthen positions)
  const supportOpportunities = findSupportOpportunities(ctx);
  for (const opp of supportOpportunities) {
    recommendations.push({
      moveType: 'SUPPORT',
      targetType: 'claim',
      targetId: opp.claimId,
      priority: 'MEDIUM',
      dialecticalReason: 'opportunity_support',
      rationale: opp.rationale,
      relevanceScore: opp.score,
      forStage: 'ARSA_EARLY',  // Good for beginners
    });
  }
  
  // 6. LOW: Synthesis opportunities
  if (ctx.profile.overallStage === 'ARSD_EMERGING' || 
      ctx.profile.overallStage === 'ARSD_FLUENT') {
    const synthOpps = findSynthesisOpportunities(ctx);
    for (const synth of synthOpps) {
      recommendations.push({
        moveType: 'SYNTHESIS',
        targetType: 'locus',
        targetId: synth.locusId,
        priority: 'LOW',
        dialecticalReason: 'synthesis_available',
        rationale: `Potential for synthesis between ${synth.participants.join(' and ')}`,
        relevanceScore: synth.score,
        forStage: 'ARSD_EMERGING',
      });
    }
  }
  
  // 7. OPTIONAL: Closure opportunities
  const closureOpps = findClosureOpportunities(ctx);
  for (const closure of closureOpps) {
    recommendations.push({
      moveType: 'CLOSE',
      targetType: 'locus',
      targetId: closure.locusId,
      priority: 'OPTIONAL',
      dialecticalReason: 'closure_possible',
      rationale: `This discussion point can be closed: ${closure.reason}`,
      relevanceScore: closure.score,
      forStage: 'ARSA_MATURE',
    });
  }
  
  // Filter by stage
  const filteredRecs = filterByStage(recommendations, ctx.profile);
  
  // Sort by priority and relevance
  return sortRecommendations(filteredRecs);
}

/**
 * Find claims vulnerable to attack
 */
function findVulnerableClaims(ctx: RecommendationContext): VulnerableClaim[] {
  const vulnerabilities: VulnerableClaim[] = [];
  
  for (const claim of ctx.allClaims) {
    // Skip user's own claims
    if (claim.createdById === ctx.user.id) continue;
    
    const vulns: string[] = [];
    let score = 0;
    let complexity: DevelopmentalStage = 'ARSA_EARLY';
    
    // Check: No evidence
    if (!claim.evidence?.length) {
      vulns.push('no evidence cited');
      score += 20;
    }
    
    // Check: Unsatisfied CQs on supporting arguments
    const supportingArgs = ctx.allArguments.filter(
      a => a.conclusionClaimId === claim.id
    );
    for (const arg of supportingArgs) {
      const ticket = ctx.tickets.get(arg.id);
      if (ticket?.status === 'CHALLENGED' || ticket?.status === 'SUSPENDED') {
        vulns.push('supporting argument has unsatisfied CQs');
        score += 30;
        complexity = 'ARSA_MATURE';
      }
    }
    
    // Check: Contradicts user's commitments
    const contradicts = findContradictions(claim, ctx.userCommitments);
    if (contradicts.length > 0) {
      vulns.push(`contradicts your commitment to "${contradicts[0]}"`);
      score += 40;
      complexity = 'ARSD_EMERGING';
    }
    
    // Check: Label is UNDEC (weakly defended)
    const label = ctx.labels.get(claim.id);
    if (label === 'UNDEC') {
      vulns.push('currently undecided status');
      score += 15;
    }
    
    if (vulns.length > 0) {
      vulnerabilities.push({
        id: claim.id,
        text: claim.text,
        vulnerabilities: vulns,
        vulnerabilityScore: Math.min(score, 100),
        vulnerabilityComplexity: complexity,
      });
    }
  }
  
  return vulnerabilities.sort((a, b) => b.vulnerabilityScore - a.vulnerabilityScore);
}
```

### 5.4.3 Move Event Hooks

```typescript
// services/dialecticalHooks.ts

/**
 * Hook into DialogueMove creation
 */
export async function onDialogueMoveCreated(move: DialogueMove): Promise<void> {
  const service = getDialecticalRecommendationService();
  
  // 1. Update dialectical state
  const { obligationsCreated, obligationsSatisfied } = await service.onMoveCreated(move);
  
  // 2. Check if this move satisfies any obligations
  if (obligationsSatisfied.length > 0) {
    // Log satisfaction for Bildung tracking (Phase 4)
    for (const obligation of obligationsSatisfied) {
      await bildungService.recordEvent({
        userId: move.actorId,
        eventType: 'OBLIGATION_SATISFIED',
        competency: 'dialecticalAwareness',
        points: 3,
        context: { obligationId: obligation.id },
      });
    }
  }
  
  // 3. Create new obligations if move requires response
  if (obligationsCreated.length > 0) {
    // Notify obligated users
    for (const obligation of obligationsCreated) {
      await notifyObligatedUser(obligation);
    }
  }
  
  // 4. Regenerate recommendations for affected users
  const affectedUsers = getAffectedUsers(move);
  for (const userId of affectedUsers) {
    await service.generateRecommendations({
      deliberationId: move.deliberationId,
      userId,
    });
  }
  
  // 5. Check for stalls
  await service.detectStalls();
}

/**
 * Notify user of pending obligation
 */
async function notifyObligatedUser(obligation: DialecticalObligation): Promise<void> {
  await prisma.notification.create({
    data: {
      user_id: obligation.obligatedUserId,
      type: 'DIALECTICAL_OBLIGATION',
      content: {
        obligationType: obligation.obligationType,
        targetId: obligation.targetId,
        deadline: obligation.deadline,
        urgency: obligation.urgency,
        deliberationId: obligation.dialecticalState.deliberationId,
      },
    },
  });
}
```

---

## 5.5 UI Integration

### 5.5.1 Recommendation Panel Component

```typescript
// components/dialectical/RecommendationPanel.tsx

interface RecommendationPanelProps {
  deliberationId: string;
  userId: string;
  context: 'sidebar' | 'inline' | 'modal';
}

export function RecommendationPanel({ deliberationId, userId, context }: Props) {
  const { data: recommendations } = useRecommendations(deliberationId, userId);
  const { data: profile } = useArgumentationProfile(userId);
  
  // Filter by scaffolding level
  const visibleRecs = filterByScaffolding(recommendations, profile.scaffoldingLevel);
  
  return (
    <div className="recommendation-panel">
      {/* Critical obligations first */}
      {visibleRecs.filter(r => r.priority === 'CRITICAL').map(rec => (
        <ObligationCard 
          key={rec.id} 
          recommendation={rec}
          onAct={handleAct}
          onDismiss={handleDismiss}
        />
      ))}
      
      {/* Other recommendations */}
      {visibleRecs.filter(r => r.priority !== 'CRITICAL').map(rec => (
        <RecommendationCard
          key={rec.id}
          recommendation={rec}
          showHints={profile.scaffoldingLevel === 'HEAVY'}
          onAct={handleAct}
          onDismiss={handleDismiss}
        />
      ))}
      
      {visibleRecs.length === 0 && (
        <EmptyState 
          message="No suggested moves right now. You're doing great!"
          stage={profile.overallStage}
        />
      )}
    </div>
  );
}

function RecommendationCard({ recommendation, showHints, onAct, onDismiss }: CardProps) {
  return (
    <div className={`rec-card priority-${recommendation.priority}`}>
      <div className="rec-header">
        <MoveIcon type={recommendation.moveType} />
        <span className="rec-type">{formatMoveType(recommendation.moveType)}</span>
        <PriorityBadge priority={recommendation.priority} />
      </div>
      
      <p className="rec-rationale">{recommendation.rationale}</p>
      
      {showHints && recommendation.scaffoldingHints && (
        <div className="rec-hints">
          {recommendation.scaffoldingHints.map((hint, i) => (
            <Hint key={i}>{hint}</Hint>
          ))}
        </div>
      )}
      
      {recommendation.effectsPreview && (
        <EffectsPreview effects={recommendation.effectsPreview} />
      )}
      
      <div className="rec-actions">
        <Button onClick={() => onAct(recommendation)}>
          Make This Move
        </Button>
        <Button variant="ghost" onClick={() => onDismiss(recommendation)}>
          Not Now
        </Button>
      </div>
    </div>
  );
}
```

### 5.5.2 Obligation Notification Component

```typescript
// components/dialectical/ObligationNotification.tsx

export function ObligationNotification({ obligation }: Props) {
  const timeRemaining = getTimeRemaining(obligation.deadline);
  const isOverdue = obligation.status === 'OVERDUE';
  
  return (
    <div className={`obligation-notification ${isOverdue ? 'overdue' : ''}`}>
      <AlertIcon />
      
      <div className="obligation-content">
        <h4>{getObligationTitle(obligation.obligationType)}</h4>
        <p>{getObligationDescription(obligation)}</p>
        
        {obligation.deadline && (
          <div className="deadline">
            <ClockIcon />
            <span>
              {isOverdue 
                ? `Overdue by ${formatDuration(-timeRemaining)}`
                : `Respond within ${formatDuration(timeRemaining)}`
              }
            </span>
          </div>
        )}
      </div>
      
      <Button 
        variant={isOverdue ? 'danger' : 'primary'}
        onClick={() => navigateToObligation(obligation)}
      >
        Respond Now
      </Button>
    </div>
  );
}
```

---

## 5.6 Migration Strategy

### Step 1: Add New Models

```bash
npx prisma db push
```

### Step 2: Seed Move License Rules

```typescript
// scripts/seed-move-license-rules.ts

const MOVE_LICENSE_RULES: MoveLicenseRule[] = [
  {
    afterMoveKind: 'ASSERT',
    licensedMoves: ['WHY', 'GROUNDS', 'CONCEDE', 'ATTACK', 'SUPPORT'],
    requiredMoves: [],
    prohibitedMoves: ['CLOSE'],
    createsObligation: false,
  },
  {
    afterMoveKind: 'WHY',
    licensedMoves: ['GROUNDS', 'RETRACT', 'REDIRECT'],
    requiredMoves: ['GROUNDS', 'RETRACT'],
    prohibitedMoves: [],
    createsObligation: true,
    obligationType: 'RESPOND_TO_WHY',
    obligationFor: 'target_author',
    deadline: 'P3D',
    urgency: 'HIGH',
    shiftsBurden: true,
    burdenTo: 'target_author',
  },
  {
    afterMoveKind: 'ATTACK',
    licensedMoves: ['DEFEND', 'CONCEDE', 'RETRACT', 'COUNTER'],
    requiredMoves: ['DEFEND', 'CONCEDE', 'RETRACT'],
    prohibitedMoves: [],
    createsObligation: true,
    obligationType: 'DEFEND_ATTACK',
    obligationFor: 'target_author',
    deadline: 'P5D',
    urgency: 'HIGH',
  },
  {
    afterMoveKind: 'CQ_RAISE',
    licensedMoves: ['CQ_SATISFY', 'CQ_REBUT', 'RETRACT'],
    requiredMoves: ['CQ_SATISFY', 'CQ_REBUT', 'RETRACT'],
    prohibitedMoves: [],
    createsObligation: true,
    obligationType: 'SATISFY_CQ',
    obligationFor: 'target_author',
    deadline: 'P7D',
    urgency: 'NORMAL',
    shiftsBurden: true,
  },
  // ... more rules
];

async function seedMoveLicenseRules() {
  for (const rule of MOVE_LICENSE_RULES) {
    await prisma.moveLicenseRule.upsert({
      where: { afterMoveKind: rule.afterMoveKind },
      create: rule,
      update: rule,
    });
  }
}
```

### Step 3: Initialize Dialectical States

```typescript
// scripts/init-dialectical-states.ts

async function initDialecticalStates() {
  const deliberations = await prisma.deliberation.findMany({
    where: { dialecticalState: null },
    select: { id: true },
  });
  
  for (const delib of deliberations) {
    await prisma.dialecticalState.create({
      data: {
        deliberationId: delib.id,
        currentPhase: 'ARGUMENTATION',  // Default for existing
      },
    });
    
    // Generate initial open loci from existing claims/arguments
    await generateInitialLoci(delib.id);
  }
}
```

### Step 4: Wire Up Event Hooks

Add hooks to DialogueMove creation flow:

```typescript
// In dialogue move creation handler:
await onDialogueMoveCreated(newMove);
```

---

## 5.7 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Schema migration | 100% | All new models created |
| License rules seeded | 100% | All move types have rules |
| Dialectical states initialized | 100% | All deliberations have state |
| Recommendation accuracy | > 70% | Recommendations acted on vs dismissed |
| Obligation satisfaction rate | > 80% | Obligations satisfied before deadline |
| Stall detection | > 90% | Stalls detected within 24h |
| User engagement | +15% | Move count after recommendations |
| Stage-appropriate recs | > 85% | Recs match user developmental stage |

---

## Phase 5 Status

- [x] 5.1 Overview — Complete
- [x] 5.2 Requirements — Complete
- [x] 5.3 Schema Design — Complete
- [x] 5.4 API Layer — Complete
- [x] 5.5 UI Integration — Complete
- [x] 5.6 Migration Strategy — Complete
- [ ] 5.7 Implementation — Not started
- [ ] 5.8 Testing — Not started

---

## Connection to Sellarsian Framework

| Sellarsian Concept | Phase 5 Implementation |
|-------------------|----------------------|
| **Game of Giving and Asking for Reasons** | Move licensing, obligations, recommendations |
| **Illocutionary Force** | DialogueMove types create different effects |
| **Commitment Incurrence** | Moves create/modify commitments |
| **Entitlement Challenge** | WHY moves create obligations |
| **Licensed Responses** | MoveLicenseRule defines what's allowed |
| **Dialectical Obligations** | DialecticalObligation tracks what users must do |
| **Space of Reasons as Practice** | Recommendations guide users in the practice |
| **Pattern-Governed Behavior** | Recommendations scaffold norm conformance |

---

## Next Steps

After Phase 5 implementation:
1. **Phase 6:** Create picturing-based feedback systems

---

*Last updated: 2025-12-31*
