# Academic Features Implementation Progress

> **Last Updated:** January 28, 2026  
> **Status:** Phase 3.2 Complete ✅ | All academic export formats implemented

---

## Overview

This document tracks the implementation progress of academic features for Mesh, enabling scholarly deliberation with proper citations, versioned releases, and structured argumentation.

---

## Phase 1: Core Academic Infrastructure

### Phase 1.1: Paper-to-Claim Pipeline ✅ Complete

**Goal:** Enable ingestion of academic papers and extraction of claims with proper source attribution.

| Component | Status | Location |
|-----------|--------|----------|
| ClaimSource model | ✅ | `lib/models/schema.prisma` |
| Paper upload API | ✅ | `app/api/papers/upload/route.ts` |
| PDF text extraction | ✅ | `lib/papers/pdfExtractor.ts` |
| Claim extraction service | ✅ | `lib/papers/claimExtractor.ts` |
| Source linking | ✅ | Claim → ClaimSource relation |

**Key Features:**
- PDF upload and text extraction
- AI-powered claim extraction from papers
- Automatic source citation linking
- Academic claim type classification

---

### Phase 1.2: Claim-Based Search & Discovery ✅ Complete (Simplified)

**Goal:** Enable discovery of related claims across deliberations.

| Component | Status | Location |
|-----------|--------|----------|
| Search service | ✅ | `lib/search/claimSearch.ts` |
| Embedding stubs | ✅ | `lib/search/claimEmbeddings.ts` |
| Indexing hooks | ✅ | `lib/search/claimIndexing.ts` |
| Barrel exports | ✅ | `lib/search/index.ts` |

**Implementation Notes:**
- **Simplified to PostgreSQL ILIKE** - Pinecone vector search deferred
- `USE_VECTOR_SEARCH` env flag allows future upgrade
- Keyword scoring for relevance ranking
- Related claims discovery via shared terms

**API Functions:**
```typescript
searchClaims(query, options)      // Text search across claims
findSimilarClaims(claimId)        // Find similar claims
findRelatedClaims(deliberationId) // Related claims in a deliberation
getChallenges(claimId)            // Get counter-claims
```

---

## Phase 2: Versioning & Memory

### Phase 2.1: Debate Releases & Versioned Memory ✅ Complete

**Goal:** Create citable, versioned snapshots of deliberation state.

#### Part 1: Backend Services ✅ Complete

| Component | Status | Location |
|-----------|--------|----------|
| DebateRelease schema | ✅ | `lib/models/schema.prisma` |
| Type definitions | ✅ | `lib/releases/types.ts` |
| Snapshot service | ✅ | `lib/releases/snapshotService.ts` |
| Changelog service | ✅ | `lib/releases/changelogService.ts` |
| Release service | ✅ | `lib/releases/releaseService.ts` |
| Barrel exports | ✅ | `lib/releases/index.ts` |

**Schema Additions:**
```prisma
model DebateRelease {
  id              String   @id @default(cuid())
  deliberationId  String
  versionMajor    Int
  versionMinor    Int
  versionPatch    Int
  title           String?
  description     String?
  claimSnapshot   Json     // Point-in-time claim state
  argumentSnapshot Json    // Point-in-time argument state
  statsSnapshot   Json?
  changelog       Json?
  changelogText   String?
  citationUri     String
  bibtex          String?
  createdById     String
  createdAt       DateTime @default(now())
}
```

**Key Services:**
```typescript
// Snapshot Generation
generateClaimSnapshot(deliberationId)     // Snapshot all claims with statuses
generateArgumentSnapshot(deliberationId)  // Snapshot arguments with acceptability
buildAttackGraph(deliberationId)          // Generate attack/support graph

// Status Calculation
calculateClaimStatuses(claims, edges)     // DEFENDED/CONTESTED/UNRESOLVED
calculateArgumentAcceptability(args)      // ASPIC+ simplified acceptability

// Changelog
generateChangelog(from, to, ...)          // Diff between snapshots
formatChangelogText(changelog)            // Markdown output

// CRUD
createRelease(input)                      // Create with auto-versioning
listReleases(deliberationId)              // List all releases
getRelease(id, versionOrId)               // Get by ID or version
compareReleases(id, from, to)             // Compare any two versions
```

#### Part 2: API Routes ✅ Complete

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/deliberations/[id]/releases` | `POST` | Create new release |
| `/api/deliberations/[id]/releases` | `GET` | List all releases |
| `/api/deliberations/[id]/releases/[releaseId]` | `GET` | Get release by ID/version |
| `/api/deliberations/[id]/releases/compare` | `GET` | Compare two releases |
| `/api/deliberations/[id]/releases/latest` | `GET` | Get most recent release |

**API Examples:**
```bash
# Create a new release
POST /api/deliberations/{id}/releases
Body: { "title": "v1.1 Release", "versionType": "minor" }

# List all releases
GET /api/deliberations/{id}/releases

# Get specific version
GET /api/deliberations/{id}/releases/1.2.0?includeSnapshots=true

# Compare versions
GET /api/deliberations/{id}/releases/compare?from=1.0.0&to=1.2.0

# Get latest release
GET /api/deliberations/{id}/releases/latest
```

#### Part 3: UI Components ✅ Complete

| Component | Status | Description |
|-----------|--------|-------------|
| VersionBadge | ✅ | Display version number with status colors |
| VersionDiff | ✅ | Show version transition (1.0.0 → 1.1.0) |
| ReleaseListItem | ✅ | Single release row with stats |
| ReleaseListPanel | ✅ | List releases with SWR data fetching |
| CreateReleaseModal | ✅ | Form to create new release with version type |
| ChangelogViewer | ✅ | Display formatted changelog with sections |
| ReleaseDetailPanel | ✅ | Tabbed panel (Overview/Changelog/Citation) |

**UI Components Location:**
```
components/releases/
├── index.ts              # Barrel exports
├── VersionBadge.tsx      # Version display + VersionDiff
├── ReleaseListItem.tsx   # Single release row + skeleton
├── ReleaseListPanel.tsx  # Full list with SWR
├── CreateReleaseModal.tsx # Create release form
├── ChangelogViewer.tsx   # Changelog display
└── ReleaseDetailPanel.tsx # Full details panel
```

---

## Phase 2.2: Fork/Branch/Merge ✅ Complete

**Goal:** Allow deliberations to be forked for alternative explorations, then merge insights back.

#### Chunk 1: Schema & Fork Service ✅ Complete

| Component | Status | Location |
|-----------|--------|----------|
| Fork schema enums | ✅ | `lib/models/schema.prisma` (ForkType, SyncStatus, MergeStatus) |
| ImportedClaim/Argument models | ✅ | `lib/models/schema.prisma` |
| MergeRequest/Comment models | ✅ | `lib/models/schema.prisma` |
| Fork type definitions | ✅ | `lib/forks/types.ts` |
| Fork service | ✅ | `lib/forks/forkService.ts` |

**Fork Types:**
- ASSUMPTION_VARIANT, METHODOLOGICAL, SCOPE_EXTENSION
- ADVERSARIAL, EDUCATIONAL, ARCHIVAL

#### Chunk 2: Merge Service & API Routes ✅ Complete

| Component | Status | Location |
|-----------|--------|----------|
| Merge service | ✅ | `lib/forks/mergeService.ts` |
| Fork API routes | ✅ | `app/api/deliberations/[id]/fork/route.ts` |
| Merge API routes | ✅ | `app/api/deliberations/[id]/merges/route.ts` |
| Merge detail routes | ✅ | `app/api/deliberations/[id]/merges/[mergeId]/route.ts` |
| Barrel exports | ✅ | `lib/forks/index.ts` |

**Merge Strategies:** ADD_NEW, REPLACE, LINK_SUPPORT, LINK_CHALLENGE, SKIP

**API Endpoints:**
```
POST/GET   /api/deliberations/{id}/fork           # Create/list forks
POST       /api/deliberations/{id}/merges         # Create merge request
POST       /api/deliberations/{id}/merges?analyze # Analyze merge (dry-run)
GET        /api/deliberations/{id}/merges         # List merge requests
GET/PATCH  /api/deliberations/{id}/merges/{id}    # Get/update merge
POST       /api/deliberations/{id}/merges/{id}?action=execute  # Execute merge
POST       /api/deliberations/{id}/merges/{id}?action=comment  # Add comment
```

#### Chunk 3: UI Components ✅ Complete

| Component | Status | Description |
|-----------|--------|-------------|
| ForkBadge | ✅ | Display fork type with icon/color |
| ForkTypePicker | ✅ | Select fork type with descriptions |
| CreateForkModal | ✅ | Two-step modal: type → details |
| ForkListItem | ✅ | Single fork row with stats |
| ForkListPanel | ✅ | List forks with SWR |
| ForkTreeView | ✅ | Hierarchical tree of forks |
| MergeStatusBadge | ✅ | Display merge request status |
| MergeRequestCard | ✅ | Single merge request card |
| MergeRequestListPanel | ✅ | Tabs: incoming/outgoing |
| MergeClaimSelector | ✅ | Select claims with strategies |
| MergeConflictViewer | ✅ | Display/resolve conflicts |
| CreateMergeRequestModal | ✅ | Three-step: claims → analysis → details |

**UI Components Location:**
```
components/forks/
├── index.ts                    # Barrel exports
├── ForkBadge.tsx              # Fork type display + picker
├── CreateForkModal.tsx        # Create fork workflow
├── ForkListPanel.tsx          # Fork list + tree views
├── MergeRequestPanel.tsx      # Merge request list
├── MergeWorkflow.tsx          # Claim selection + conflict UI
└── CreateMergeRequestModal.tsx # Create merge request workflow
```

---

## Phase 2.3: Quote Nodes & Quality Gates ✅ Complete

**Goal:** Make textual quotes first-class addressable objects for HSS scholars, enable multiple interpretations with voting.

#### Chunk 1: Schema & Services ✅ Complete

| Component | Status | Location |
|-----------|--------|----------|
| QuoteNode schema | ✅ | `lib/models/schema.prisma` |
| QuoteInterpretation schema | ✅ | `lib/models/schema.prisma` |
| InterpretationVote schema | ✅ | `lib/models/schema.prisma` |
| ClaimQuote/ArgumentQuote | ✅ | `lib/models/schema.prisma` |
| Quote types | ✅ | `lib/quotes/types.ts` |
| Quote service | ✅ | `lib/quotes/quoteService.ts` |
| Interpretation service | ✅ | `lib/quotes/interpretationService.ts` |
| Barrel exports | ✅ | `lib/quotes/index.ts` |

**Schema Additions:**
```prisma
enum LocatorType {
  PAGE, SECTION, CHAPTER, VERSE, TIMESTAMP, LINE, PARAGRAPH, CUSTOM
}

enum QuoteUsageType {
  EVIDENCE, COUNTER, CONTEXT, DEFINITION, METHODOLOGY
}

model QuoteNode {
  id              String   @id @default(cuid())
  sourceId        String
  text            String   @db.Text
  locator         String?
  locatorType     LocatorType @default(PAGE)
  context         String?  @db.Text
  language        String?  @default("en")
  isTranslation   Boolean  @default(false)
  originalQuoteId String?
  deliberationId  String?  @unique  // Mini-deliberation for discussion
  createdById     String
  interpretations QuoteInterpretation[]
  usedInClaims    ClaimQuote[]
  usedInArguments ArgumentQuote[]
}

model QuoteInterpretation {
  id           String   @id @default(cuid())
  quoteId      String
  content      String   @db.Text
  framework    String?  // e.g., "Marxist", "Phenomenological"
  authorId     String
  voteScore    Int      @default(0)
  supportsInterpretationId   String?  // Supports another interpretation
  challengesInterpretationId String?  // Challenges another interpretation
  votes        InterpretationVote[]
}

model InterpretationVote {
  id               String   @id @default(cuid())
  interpretationId String
  userId           String
  vote             Int      // +1 or -1
  @@unique([interpretationId, userId])
}
```

**Key Services:**
```typescript
// Quote Operations
createQuote(options)              // Create quote from source
getQuote(quoteId, userId?)        // Get with interpretations & user vote
searchQuotes(filters, limit, offset)  // Search by source, author, framework
linkQuoteToClaim(quoteId, claimId, usageType, userId, annotation?)
linkQuoteToArgument(quoteId, argumentId, usageType, userId, annotation?)
createQuoteDeliberation(quoteId, userId)  // Mini-deliberation for quote

// Interpretation Operations
createInterpretation(options)     // Create with optional framework
getInterpretations(quoteId, userId?, framework?, sortBy?)
voteOnInterpretation(id, userId, value)  // +1/-1 voting
updateInterpretation(id, updates)
deleteInterpretation(id)
getFrameworksInUse(deliberationId)
```

#### Chunk 2: API Routes ✅ Complete

| Route | Methods | Purpose |
|-------|---------|----------|
| `/api/quotes` | POST, GET | Create quote, search quotes |
| `/api/quotes/[quoteId]` | GET, PATCH, DELETE, POST | Quote CRUD, create deliberation |
| `/api/quotes/[quoteId]/interpretations` | POST, GET | Create/list interpretations |
| `/api/quotes/[quoteId]/interpretations/[id]` | GET, PATCH, DELETE, POST | Interpretation CRUD, voting |
| `/api/quotes/[quoteId]/link` | POST, DELETE | Link/unlink to claims/arguments |

**API Examples:**
```bash
# Create a quote
POST /api/quotes
Body: { "text": "...", "sourceId": "...", "locatorType": "PAGE", "locator": "42" }

# Search quotes
GET /api/quotes?sourceId=...&framework=Marxist&hasInterpretations=true

# Create interpretation
POST /api/quotes/{id}/interpretations
Body: { "content": "...", "framework": "Phenomenological" }

# Vote on interpretation
POST /api/quotes/{id}/interpretations/{intId}?action=vote
Body: { "value": 1 }

# Link quote to claim
POST /api/quotes/{id}/link
Body: { "type": "claim", "claimId": "...", "usageType": "EVIDENCE" }
```

#### Chunk 3: UI Components ✅ Complete

| Component | Status | Description |
|-----------|--------|-------------|
| QuoteCard | ✅ | Full quote display with source, locator, usage badge |
| QuoteCardCompact | ✅ | Inline quote with tooltip |
| QuoteCardSkeleton | ✅ | Loading state |
| QuoteList | ✅ | List with selection, empty state |
| InterpretationCard | ✅ | Full interpretation with +1/-1 voting, framework badge |
| InterpretationCardCompact | ✅ | Minimal for nested relations |
| InterpretationList | ✅ | List with owner detection |
| InterpretationsPanel | ✅ | Side panel with filtering by framework |
| CreateQuoteModal | ✅ | Create quote with locator type selection |
| QuoteLinkModal | ✅ | Link to claim/argument with usage type |
| CreateInterpretationModal | ✅ | Add interpretation with support/challenge |

**UI Components Location:**
```
components/quotes/
├── index.ts                    # Barrel exports
├── QuoteCard.tsx               # QuoteCard, QuoteCardCompact, QuoteList
├── InterpretationCard.tsx      # InterpretationCard, InterpretationList
├── InterpretationsPanel.tsx    # Full panel with SWR
└── QuoteModals.tsx             # Create/Link/Interpretation modals
```

---

## Phase 3: Provenance & External Integration

### Phase 3.1: Claim Provenance Tracking ✅ Complete

**Goal:** Track the full lifecycle of claims including versions, challenges, defenses, and cross-deliberation identity for HSS scholars.

#### Chunk 1: Schema & Types ✅ Complete

| Component | Status | Location |
|-----------|--------|----------|
| VersionChangeType enum | ✅ | `lib/models/schema.prisma` |
| ConsensusStatus enum | ✅ | `lib/models/schema.prisma` |
| ClaimAttackStatus enum | ✅ | `lib/models/schema.prisma` |
| ClaimDefenseType enum | ✅ | `lib/models/schema.prisma` |
| ClaimDefenseOutcome enum | ✅ | `lib/models/schema.prisma` |
| ClaimInstanceType enum | ✅ | `lib/models/schema.prisma` |
| ClaimVersion model | ✅ | `lib/models/schema.prisma` |
| ClaimAttack model | ✅ | `lib/models/schema.prisma` |
| ClaimDefense model | ✅ | `lib/models/schema.prisma` |
| ClaimInstance model | ✅ | `lib/models/schema.prisma` |
| Enhanced Claim model | ✅ | `lib/models/schema.prisma` (provenance fields) |
| Enhanced CanonicalClaim | ✅ | `lib/models/schema.prisma` |
| Provenance types | ✅ | `lib/provenance/types.ts` |

**New Enums:**
```prisma
enum VersionChangeType {
  CREATED, REFINED, STRENGTHENED, WEAKENED, CORRECTED, MERGED, SPLIT, IMPORTED
}

enum ConsensusStatus {
  UNDETERMINED, EMERGING, ACCEPTED, CONTESTED, REJECTED, SUPERSEDED
}

enum ClaimAttackStatus {
  PENDING, ACTIVE, DEFENDED, CONCEDED, WITHDRAWN
}

enum ClaimDefenseType {
  REBUTTAL, CLARIFICATION, EVIDENCE, QUALIFICATION, AUTHORITY, COUNTER_ATTACK
}

enum ClaimDefenseOutcome {
  PENDING, SUCCESSFUL, PARTIALLY_SUCCESSFUL, UNSUCCESSFUL
}

enum ClaimInstanceType {
  ORIGINAL, FORKED, IMPORTED, REFERENCED, MERGED
}
```

**Schema Additions:**
```prisma
model ClaimVersion {
  id              String   @id @default(cuid())
  claimId         String
  versionNumber   Int
  text            String   @db.Text
  changeType      VersionChangeType
  changeReason    String?
  previousVersionId String?
  authorId        String
  sourceIds       String[]
  metadata        Json?
  createdAt       DateTime @default(now())
}

model ClaimAttack {
  id              String   @id @default(cuid())
  targetClaimId   String
  attackerId      String?
  attackType      AttackType
  argumentId      String?
  status          ClaimAttackStatus @default(PENDING)
  defenses        ClaimDefense[]
  createdAt       DateTime @default(now())
  resolvedAt      DateTime?
}

model ClaimDefense {
  id              String   @id @default(cuid())
  attackId        String
  defenderId      String?
  defenseType     ClaimDefenseType
  argumentId      String?
  outcome         ClaimDefenseOutcome @default(PENDING)
  createdAt       DateTime @default(now())
}

model ClaimInstance {
  id              String   @id @default(cuid())
  canonicalId     String
  claimId         String   @unique
  deliberationId  String
  instanceType    ClaimInstanceType @default(ORIGINAL)
  localStatus     ConsensusStatus?
  isPrimary       Boolean @default(false)
  sourceInstanceId String?
  createdAt       DateTime @default(now())
}
```

#### Chunk 2: Provenance Service ✅ Complete

| Component | Status | Location |
|-----------|--------|----------|
| getClaimProvenance() | ✅ | `lib/provenance/provenanceService.ts` |
| createClaimVersion() | ✅ | `lib/provenance/provenanceService.ts` |
| getClaimVersions() | ✅ | `lib/provenance/provenanceService.ts` |
| compareClaimVersions() | ✅ | `lib/provenance/provenanceService.ts` |
| getClaimTimeline() | ✅ | `lib/provenance/provenanceService.ts` |
| calculateConsensusStatus() | ✅ | `lib/provenance/provenanceService.ts` |
| updateClaimConsensusStatus() | ✅ | `lib/provenance/provenanceService.ts` |
| initializeClaimVersionHistory() | ✅ | `lib/provenance/provenanceService.ts` |
| revertClaimToVersion() | ✅ | `lib/provenance/provenanceService.ts` |

**Key Functions:**
```typescript
// Version Management
createClaimVersion(claimId, text, changeType, changeReason?, authorId?, sourceIds?)
getClaimVersions(claimId, limit?)
getClaimVersion(versionId)
compareClaimVersions(versionIdA, versionIdB)
revertClaimToVersion(claimId, versionId, authorId)

// Timeline
getClaimTimeline(claimId, filters?) // Combined version/attack/defense events

// Consensus
calculateConsensusStatus(challengeCount, defendedCount, concededCount, hasOpenChallenges)
updateClaimConsensusStatus(claimId, status?)
getClaimsByConsensusStatus(deliberationId, status, limit?)

// Initialization
initializeClaimVersionHistory(claimId, authorId?)
initializeDeliberationVersionHistory(deliberationId)
```

#### Chunk 3: Challenge & Canonical Services ✅ Complete

| Component | Status | Location |
|-----------|--------|----------|
| createAttack() | ✅ | `lib/provenance/challengeService.ts` |
| getAttacksForClaim() | ✅ | `lib/provenance/challengeService.ts` |
| updateAttackStatus() | ✅ | `lib/provenance/challengeService.ts` |
| createDefense() | ✅ | `lib/provenance/challengeService.ts` |
| getDefensesForAttack() | ✅ | `lib/provenance/challengeService.ts` |
| updateDefenseOutcome() | ✅ | `lib/provenance/challengeService.ts` |
| getChallengeReport() | ✅ | `lib/provenance/challengeService.ts` |
| createCanonicalClaim() | ✅ | `lib/provenance/canonicalClaimService.ts` |
| linkClaimToCanonical() | ✅ | `lib/provenance/canonicalClaimService.ts` |
| getOrCreateCanonicalClaim() | ✅ | `lib/provenance/canonicalClaimService.ts` |
| searchCanonicalClaims() | ✅ | `lib/provenance/canonicalClaimService.ts` |
| recalculateGlobalStatus() | ✅ | `lib/provenance/canonicalClaimService.ts` |
| Barrel exports | ✅ | `lib/provenance/index.ts` |

**Challenge Service Functions:**
```typescript
// Attack Operations
createAttack(targetClaimId, attackType, attackerId?, argumentId?)
getAttack(attackId)
getAttacksForClaim(claimId, filters?)
updateAttackStatus(attackId, status, updatedById)
deleteAttack(attackId, deletedById)

// Defense Operations
createDefense(attackId, defenseType, defenderId?, argumentId?)
getDefensesForAttack(attackId)
getDefensesForClaim(claimId)
updateDefenseOutcome(defenseId, outcome, updatedById)

// Reports
getChallengeReport(claimId)
getDeliberationChallengeStats(deliberationId)
```

**Canonical Claim Service Functions:**
```typescript
// CRUD
createCanonicalClaim(representativeText, description?, createdById?)
getCanonicalClaim(canonicalId)
getCanonicalClaimBySlug(slug)
updateCanonicalClaim(canonicalId, updates)

// Instance Management
linkClaimToCanonical(claimId, canonicalId, instanceType?, isPrimary?)
unlinkClaimFromCanonical(claimId)
getCanonicalClaimInstances(canonicalId, filters?)

// Discovery
searchCanonicalClaims(query, limit?)
findSimilarCanonicalClaims(text, limit?)
getOrCreateCanonicalClaim(representativeText, claimId, createdById?)

// Status
recalculateGlobalStatus(canonicalId)
syncLocalStatusToCanonical(instanceId)
```

#### Chunk 4: API Routes ✅ Complete

| Route | Methods | Purpose |
|-------|---------|----------|
| `/api/claims/[id]/provenance` | GET | Get claim provenance overview |
| `/api/claims/[id]/versions` | GET, POST | List/create versions |
| `/api/claims/[id]/timeline` | GET | Get timeline events |
| `/api/claims/[id]/challenges` | GET, POST | List/create challenges |
| `/api/claims/[id]/challenges/[id]` | GET, PATCH, DELETE | Challenge CRUD |
| `/api/claims/[id]/challenges/[id]/defenses` | GET, POST | List/create defenses |
| `/api/claims/[id]/challenges/[id]/defenses/[id]` | PATCH | Update defense outcome |
| `/api/claims/canonical` | GET, POST | Search/create canonical claims |
| `/api/claims/canonical/[id]` | GET, PATCH | Canonical claim details |
| `/api/claims/canonical/[id]/instances` | GET, POST | List/link instances |
| `/api/claims/canonical/[id]/instances/[id]` | DELETE | Unlink instance |

**API Examples:**
```bash
# Get claim provenance
GET /api/claims/{id}/provenance

# Create new version
POST /api/claims/{id}/versions
Body: { "text": "...", "changeType": "REFINED", "changeReason": "Clarified scope" }

# Get timeline (with filters)
GET /api/claims/{id}/timeline?types=version,attack&limit=20

# Create challenge (attack)
POST /api/claims/{id}/challenges
Body: { "attackType": "REBUTS", "argumentId": "arg_123" }

# Add defense
POST /api/claims/{id}/challenges/{challengeId}/defenses
Body: { "defenseType": "REBUTTAL", "argumentId": "arg_456" }

# Search canonical claims
GET /api/claims/canonical?q=climate+change&limit=10

# Link claim to canonical
POST /api/claims/canonical/{canonicalId}/instances
Body: { "claimId": "claim_789", "instanceType": "FORKED", "isPrimary": false }
```

#### Chunk 5: UI Components ✅ Complete

| Component | Status | Description |
|-----------|--------|-------------|
| ConsensusIndicator | ✅ | Display consensus status with icon/color |
| ChallengeSummaryDisplay | ✅ | Challenge breakdown summary |
| ConsensusStatusSelect | ✅ | Select consensus status |
| ChallengeBreakdown | ✅ | Progress bar visualization |
| ProvenanceTimeline | ✅ | Full timeline of claim history |
| ProvenanceTimelineCompact | ✅ | Compact timeline for inline use |
| ChallengeCard | ✅ | Attack display with defenses |
| ChallengeReportCard | ✅ | Full challenge report with stats |
| VersionCard | ✅ | Version history entry |
| VersionList | ✅ | List of versions with actions |
| VersionBadge | ✅ | Version number with change type |
| VersionCompare | ✅ | Side-by-side version comparison |
| CanonicalClaimCard | ✅ | Cross-deliberation identity |
| CanonicalClaimBadge | ✅ | Inline canonical reference |
| CanonicalClaimLink | ✅ | Linkable canonical reference |

**UI Components Location:**
```
components/provenance/
├── index.ts                 # Barrel exports
├── ConsensusIndicator.tsx   # Status display + selection
├── ProvenanceTimeline.tsx   # Timeline + compact variant
├── ChallengeCard.tsx        # Attack/defense display
├── VersionCard.tsx          # Version history components
└── CanonicalClaimCard.tsx   # Canonical claim display
```

---

### Phase 3.2: Export Formats ✅ Complete

**Goal:** Enable export of deliberations, claims, arguments, sources, and quotes in academic citation formats (BibTeX, RIS) and documentation formats (Markdown, PDF).

#### Chunk 1: Export Types & Core Services ✅ Complete

| Component | Status | Location |
|-----------|--------|----------|
| Export types | ✅ | `lib/exports/types.ts` |
| BibTeX service | ✅ | `lib/exports/bibtexService.ts` |
| RIS service | ✅ | `lib/exports/risService.ts` |
| Barrel exports | ✅ | `lib/exports/index.ts` |

**Type Definitions:**
```typescript
// Export Formats
type ExportFormat = "bibtex" | "ris" | "markdown" | "pdf" | "csl-json" | "json"

// Export Targets
type ExportTarget = "deliberation" | "claim" | "argument" | "source" | "quote"

// Export Options
interface ExportOptions {
  includeTOC?: boolean
  includeFrontmatter?: boolean
  includeDiagrams?: boolean
  includeCover?: boolean
  paperSize?: "letter" | "a4"
  includeVersions?: boolean
  includeSources?: boolean
}

// Export Result
interface ExportResult {
  content: string
  mimeType: string
  filename: string
  format: ExportFormat
  itemCount: number
  generatedAt: string
}

// Helper Functions
getMimeType(format: ExportFormat): string
getFileExtension(format: ExportFormat): string
generateExportFilename(baseName: string, format: ExportFormat, timestamp?: boolean): string
```

**BibTeX Service Functions:**
```typescript
exportDeliberationToBibTeX(deliberation)
exportClaimsToBibTeX(claims, options?)
exportArgumentsToBibTeX(arguments, options?)
exportQuotesToBibTeX(quotes, options?)
exportSourcesToBibTeX(sources, options?)
```

**RIS Service Functions:**
```typescript
exportDeliberationToRIS(deliberation)
exportClaimsToRIS(claims, options?)
exportArgumentsToRIS(arguments, options?)
exportQuotesToRIS(quotes, options?)
exportSourcesToRIS(sources, options?)
```

#### Chunk 2: Document Export Services ✅ Complete

| Component | Status | Location |
|-----------|--------|----------|
| Markdown service | ✅ | `lib/exports/markdownService.ts` |
| PDF service | ✅ | `lib/exports/pdfService.ts` |

**Markdown Service Functions:**
```typescript
exportDeliberationToMarkdown(deliberation, options?)
exportClaimsToMarkdown(claims, options?)
exportArgumentsToMarkdown(arguments, options?)
exportQuotesToMarkdown(quotes, options?)
exportSourcesToMarkdown(sources, options?)
```

**Markdown Options:**
- `includeTOC` - Table of contents
- `includeFrontmatter` - YAML frontmatter for Obsidian/Jekyll
- `includeDiagrams` - Mermaid argument diagrams

**PDF Service Functions:**
```typescript
exportDeliberationToPDFHtml(deliberation, options?)
exportClaimsToPDFHtml(claims, options?)
exportArgumentsToPDFHtml(arguments, options?)
exportQuotesToPDFHtml(quotes, options?)
exportSourcesToPDFHtml(sources, options?)
```

**PDF Options:**
- `includeCover` - Cover page with title/date
- `paperSize` - "letter" or "a4"
- Returns HTML for browser print-to-PDF

#### Chunk 3: API Routes ✅ Complete

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/deliberations/[id]/export` | GET | Export full deliberation |
| `/api/claims/export` | GET | Export claims (by deliberation or IDs) |
| `/api/arguments/export` | GET | Export arguments (by deliberation or IDs) |
| `/api/sources/export` | GET | Export sources (by IDs) |
| `/api/quotes/export` | GET | Export quotes (by deliberation or IDs) |

**API Examples:**
```bash
# Export deliberation as BibTeX
GET /api/deliberations/{id}/export?format=bibtex

# Export deliberation as Markdown with TOC
GET /api/deliberations/{id}/export?format=markdown&includeTOC=true&includeFrontmatter=true

# Export claims as RIS
GET /api/claims/export?deliberationId={id}&format=ris

# Export specific arguments as PDF
GET /api/arguments/export?ids=arg1,arg2,arg3&format=pdf&includeCover=true

# Export sources as BibTeX
GET /api/sources/export?ids=src1,src2&format=bibtex

# Export quotes as JSON
GET /api/quotes/export?deliberationId={id}&format=json
```

**Query Parameters:**
- `format` - bibtex | ris | markdown | pdf | csl-json | json
- `deliberationId` - Filter by deliberation (claims/arguments/quotes)
- `ids` - Comma-separated list of specific IDs
- `includeTOC` - Add table of contents (markdown)
- `includeFrontmatter` - Add YAML frontmatter (markdown)
- `includeDiagrams` - Add Mermaid diagrams (markdown)
- `includeCover` - Add cover page (pdf)
- `paperSize` - letter | a4 (pdf)

#### Chunk 4: UI Components ✅ Complete

| Component | Status | Description |
|-----------|--------|-------------|
| ExportButton | ✅ | Dropdown button with format categories |
| ExportFormatSelector | ✅ | Format picker with options panel |
| ExportPreviewModal | ✅ | Preview content before download |
| Barrel exports | ✅ | `components/exports/index.ts` |

**ExportButton Features:**
- Categorized dropdown: Citation Formats, Document Formats, Data Formats
- Icons for each format (BibTeX, RIS, Markdown, PDF, etc.)
- Download handling with proper MIME types
- Loading states and error handling
- Callbacks: onExportStart, onExportComplete, onExportError

**ExportFormatSelector Features:**
- Select dropdown for format selection
- Options panel (settings icon) with format-specific options:
  - Markdown: Include TOC, YAML Frontmatter, Mermaid Diagrams
  - PDF: Cover Page, Paper Size (Letter/A4)
  - JSON: Include Versions, Include Sources

**ExportPreviewModal Features:**
- Fetch and display export preview
- Format selector for changing format
- Copy to clipboard
- Download with proper filename
- Loading and error states

**UI Components Location:**
```
components/exports/
├── index.ts                   # Barrel exports
├── ExportButton.tsx           # Dropdown export button
├── ExportFormatSelector.tsx   # Format picker with options
└── ExportPreviewModal.tsx     # Preview modal
```

---

## File Index

### Phase 1.2 Files
```
lib/search/
├── index.ts              # Barrel exports
├── claimSearch.ts        # PostgreSQL text search
├── claimEmbeddings.ts    # Vector search stubs (deferred)
└── claimIndexing.ts      # Lifecycle hooks
```

### Phase 2.1 Files
```
lib/releases/
├── index.ts              # Barrel exports
├── types.ts              # Type definitions & version utils
├── snapshotService.ts    # Claim/argument snapshot generation
├── changelogService.ts   # Diff generation & formatting
└── releaseService.ts     # Main CRUD operations

app/api/deliberations/[id]/releases/
├── route.ts              # POST (create) & GET (list)
├── [releaseId]/route.ts  # GET single release
├── compare/route.ts      # GET compare two releases
└── latest/route.ts       # GET latest release
```

### Phase 2.2 Files
```
lib/forks/
├── index.ts              # Barrel exports
├── types.ts              # Fork/merge type definitions
├── forkService.ts        # Fork CRUD operations
└── mergeService.ts       # Merge request operations

app/api/deliberations/[id]/
├── fork/route.ts         # POST/GET fork endpoints
└── merges/
    ├── route.ts          # POST/GET merge requests
    └── [mergeId]/route.ts # GET/PATCH/POST individual merge

components/forks/
├── index.ts              # Barrel exports
├── ForkBadge.tsx         # Fork type display + picker
├── CreateForkModal.tsx   # Create fork workflow
├── ForkListPanel.tsx     # Fork list + tree views
├── MergeRequestPanel.tsx # Merge request list
├── MergeWorkflow.tsx     # Claim selection + conflict UI
└── CreateMergeRequestModal.tsx # Create merge request workflow
```

### Phase 2.3 Files
```
lib/quotes/
├── index.ts                # Barrel exports
├── types.ts                # LocatorType, QuoteUsageType, helpers
├── quoteService.ts         # Quote CRUD, linking, deliberation
└── interpretationService.ts # Interpretation CRUD, voting

app/api/quotes/
├── route.ts                # POST/GET collection
└── [quoteId]/
    ├── route.ts            # GET/PATCH/DELETE + create-deliberation
    ├── interpretations/
    │   ├── route.ts        # POST/GET interpretations
    │   └── [interpretationId]/route.ts  # CRUD + voting
    └── link/route.ts       # POST/DELETE linking

components/quotes/
├── index.ts                # Barrel exports
├── QuoteCard.tsx           # QuoteCard, QuoteCardCompact, QuoteList
├── InterpretationCard.tsx  # InterpretationCard, InterpretationList
├── InterpretationsPanel.tsx # Panel with filtering
└── QuoteModals.tsx         # Create/Link/Interpretation modals
```

### Phase 3.1 Files
```
lib/provenance/
├── index.ts                  # Barrel exports
├── types.ts                  # Provenance type definitions
├── provenanceService.ts      # Version mgmt, timeline, consensus
├── challengeService.ts       # Attack/defense tracking
└── canonicalClaimService.ts  # Cross-deliberation identity

app/api/claims/[id]/
├── provenance/route.ts       # GET provenance overview
├── versions/route.ts         # GET/POST versions
├── timeline/route.ts         # GET timeline events
└── challenges/
    ├── route.ts              # GET/POST challenges
    └── [challengeId]/
        ├── route.ts          # GET/PATCH/DELETE challenge
        └── defenses/
            ├── route.ts      # GET/POST defenses
            └── [defenseId]/route.ts  # PATCH defense outcome

app/api/claims/canonical/
├── route.ts                  # GET/POST canonical claims
└── [canonicalId]/
    ├── route.ts              # GET/PATCH canonical
    └── instances/
        ├── route.ts          # GET/POST instances
        └── [instanceId]/route.ts  # DELETE instance

components/provenance/
├── index.ts                  # Barrel exports
├── ConsensusIndicator.tsx    # Status display + selection
├── ProvenanceTimeline.tsx    # Timeline + compact variant
├── ChallengeCard.tsx         # Attack/defense display
├── VersionCard.tsx           # Version history components
└── CanonicalClaimCard.tsx    # Canonical claim display
```

### Phase 3.2 Files
```
lib/exports/
├── index.ts                  # Barrel exports
├── types.ts                  # ExportFormat, ExportResult, helpers
├── bibtexService.ts          # BibTeX export functions
├── risService.ts             # RIS export functions
├── markdownService.ts        # Markdown export with TOC/frontmatter
└── pdfService.ts             # PDF HTML generation

app/api/deliberations/[id]/export/
└── route.ts                  # GET deliberation export

app/api/claims/export/
└── route.ts                  # GET claims export

app/api/arguments/export/
└── route.ts                  # GET arguments export

app/api/sources/export/
└── route.ts                  # GET sources export

app/api/quotes/export/
└── route.ts                  # GET quotes export

components/exports/
├── index.ts                  # Barrel exports
├── ExportButton.tsx          # Dropdown export button
├── ExportFormatSelector.tsx  # Format picker with options
└── ExportPreviewModal.tsx    # Preview modal
```

---

## Next Steps

1. **Database Migration** - Run `npx prisma db push` to apply all schema changes
2. **Testing** - Verify all Phase 1-3 services and API routes work correctly
3. **Phase 4** - Consider additional features:
   - DOI integration for external references
   - Argument Linting / "Argument CI" quality gates
   - Integration with external citation managers
4. **UI Integration** - Add ExportButton to deliberation/claim views

---

## Notes & Decisions

| Decision | Rationale |
|----------|-----------|
| PostgreSQL over Pinecone (Phase 1.2) | Simplify initial implementation; `USE_VECTOR_SEARCH` flag allows upgrade |
| Semantic versioning (major.minor.patch) | Familiar pattern for academics; clear version progression |
| JSON snapshots over normalized tables | Faster point-in-time queries; immutable release state |
| Simplified ASPIC+ acceptability | Full grounded semantics deferred; basic attack counting for now |
| BibTeX in releases | Academic users expect citation formats |
| PDF as HTML (Phase 3.2) | Browser print-to-PDF for cross-platform compatibility; no server-side PDF libs needed |
| Format-specific options | Markdown (TOC, frontmatter, diagrams) and PDF (cover, paper size) options for flexibility |
| DropdownMenu over Popover | Using existing UI components; no additional dependencies needed |

---

## Dependencies

```json
{
  "existing": ["prisma", "next-auth", "zod"],
  "added": [],
  "deferred": ["@pinecone-database/pinecone"]
}
```
