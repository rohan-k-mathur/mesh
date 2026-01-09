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
