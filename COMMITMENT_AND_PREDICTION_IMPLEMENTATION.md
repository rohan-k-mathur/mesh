# Claim Prediction & Outcome Tracking Implementation

**Scope**: Prediction tracking feature extracted from the Sellars roadmap (Phase 6), simplified for practical use.

**Status**: Planning

---

## Commitment System Assessment

### Result: ✅ Existing System is Adequate

After reviewing the comprehensive audit (`COMMITMENT_SYSTEM_COMPREHENSIVE_AUDIT.md`), the existing commitment infrastructure is robust:

**Already Implemented:**
- Dual commitment architecture (Dialogue + Ludics)
- Per-participant tracking with ASSERT/CONCEDE/RETRACT semantics
- `CommitmentStorePanel` UI with timeline view
- `CommitmentLudicMapping` bridge between systems
- Rich analytics (`lib/aif/commitment-analytics.ts`)
- Event-driven updates

**Known Minor Gaps (from Nov 2025 audit):**
- `locusPath` schema mismatch (simple fix)
- No caching on `getCommitmentStores()` (performance optimization)
- Missing `asOf` time-travel

**Conclusion:** No new commitment infrastructure needed. Skip to predictions.

---

## Feature: Claim Prediction & Outcome Tracking

### Purpose

Ground argumentation in reality by tracking whether claims lead to accurate predictions.

### Proposed Schema

```prisma
// Predictions derived from claims
model ClaimPrediction {
  id              String   @id @default(cuid())
  claimId         String
  deliberationId  String
  
  // The prediction
  predictionText  String   @db.Text
  targetDate      DateTime?              // When should we check?
  confidence      Float    @default(0.5) // Author's confidence 0-1
  
  // Status
  status          PredictionStatus @default(PENDING)
  
  // Authorship
  createdById     String
  createdAt       DateTime @default(now())
  
  // Resolution
  resolvedAt      DateTime?
  resolvedById    String?
  resolution      PredictionResolution?
  resolutionNote  String?  @db.Text
  
  // Relations
  claim           Claim    @relation("ClaimPredictions", fields: [claimId], references: [id], onDelete: Cascade)
  deliberation    Deliberation @relation("DeliberationPredictions", fields: [deliberationId], references: [id], onDelete: Cascade)
  outcomes        PredictionOutcome[]
  
  @@index([claimId])
  @@index([deliberationId])
  @@index([status])
  @@index([targetDate])
  @@index([createdById])
}

enum PredictionStatus {
  PENDING         // Not yet evaluated
  RESOLVED        // Has outcome
  WITHDRAWN       // Author withdrew
  EXPIRED         // Past target date, not resolved
}

enum PredictionResolution {
  CONFIRMED       // Prediction was accurate
  DISCONFIRMED    // Prediction was wrong
  PARTIALLY_CONFIRMED // Partially correct
  INDETERMINATE   // Cannot determine
}

// Evidence for prediction outcomes
model PredictionOutcome {
  id              String   @id @default(cuid())
  predictionId    String
  
  // The outcome
  outcomeText     String   @db.Text
  observedAt      DateTime @default(now())
  
  // Evidence
  evidenceUrl     String?              // Link to source
  evidenceType    EvidenceType?        // news, data, official, etc.
  
  // Authorship
  submittedById   String
  submittedAt     DateTime @default(now())
  
  // Verification (optional community verification)
  verifiedCount   Int      @default(0)
  disputedCount   Int      @default(0)
  
  // Relation
  prediction      ClaimPrediction @relation(fields: [predictionId], references: [id], onDelete: Cascade)
  
  @@index([predictionId])
  @@index([submittedById])
}

enum EvidenceType {
  NEWS_ARTICLE
  OFFICIAL_DATA
  RESEARCH_PAPER
  PRIMARY_SOURCE
  SOCIAL_MEDIA
  OTHER
}
```

### API Endpoints

```
POST   /api/deliberation/[id]/claim/[claimId]/prediction
       Body: { predictionText, targetDate?, confidence? }
       → Creates prediction for claim

GET    /api/deliberation/[id]/predictions
       Query: ?status=PENDING&claimId=X
       → Lists predictions

POST   /api/prediction/[id]/outcome
       Body: { outcomeText, evidenceUrl?, evidenceType? }
       → Records outcome evidence

POST   /api/prediction/[id]/resolve
       Body: { resolution, resolutionNote? }
       → Resolves prediction

GET    /api/claim/[id]/predictions
       → Lists predictions for a claim with outcomes

GET    /api/user/[id]/predictions
       Query: ?status=RESOLVED
       → User's prediction track record
```

### UI Integration Points

1. **Claim Detail View**: "Predictions" tab showing linked predictions
2. **Prediction Card**: Shows prediction text, target date, status, outcomes
3. **"Add Prediction" Button**: On claims that make predictive statements
4. **Prediction Resolution Modal**: For resolving with evidence
5. **User Profile**: "Prediction Track Record" showing accuracy stats

### Claim Model Extension

Add to existing `Claim` model:
```prisma
model Claim {
  // ... existing fields ...
  
  // Prediction tracking
  predictions       ClaimPrediction[] @relation("ClaimPredictions")
  hasPredictions    Boolean           @default(false)
  predictionCount   Int               @default(0)
  confirmedCount    Int               @default(0)
  disconfirmedCount Int               @default(0)
}
```

---

## Implementation Plan

### Phase 1: Schema (1 day)
- [ ] Add `ClaimPrediction` and `PredictionOutcome` models
- [ ] Add enums (`PredictionStatus`, `PredictionResolution`, `EvidenceType`)
- [ ] Add relation to `Claim` and `Deliberation`
- [ ] Run `prisma db push`

### Phase 2: Prediction API (2 days)
- [ ] Create `/api/deliberation/[id]/claim/[claimId]/prediction` POST endpoint
- [ ] Create `/api/deliberation/[id]/predictions` GET endpoint
- [ ] Create `/api/prediction/[id]` GET endpoint
- [ ] Create `/api/claim/[id]/predictions` GET endpoint

### Phase 3: Outcome & Resolution API (1-2 days)
- [ ] Create `/api/prediction/[id]/outcome` POST endpoint
- [ ] Create `/api/prediction/[id]/resolve` POST endpoint
- [ ] Create `/api/user/[id]/predictions` GET endpoint (track record)

### Phase 4: UI Components (2-3 days)
- [ ] Add prediction section to claim detail view
- [ ] Create `PredictionCreator` modal component
- [ ] Create `PredictionCard` component
- [ ] Create `OutcomeRecorder` component  
- [ ] Create `ResolutionModal` component
- [ ] Add "Prediction Track Record" to user profile

### Phase 5: Polish (1 day)
- [ ] Add prediction stats aggregation
- [ ] Add "pending predictions" notification/reminder (optional)
- [ ] Testing

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Schema deployed | ✓ |
| Prediction API working | All CRUD operations functional |
| UI components | Prediction section visible on claims |
| Prediction usage | >5% of empirical claims have predictions |
| Resolution rate | >50% of predictions get resolved |

---

## Estimated Effort

**Total: 7-9 days**

---

## Excluded from Scope

From the Sellars roadmap, we are **not** implementing:
- Enhanced commitment store (existing system is adequate)
- EntitlementBasis tracking (testimony, inference, authority, etc.)
- Developmental stages (RDR → ARSD progression)
- Scaffolding/Bildung system
- Dialectical move recommendations
- Picturing scores and reliability badges
- Full outcome verification system with disputes

These can be revisited later if the prediction feature proves valuable.
