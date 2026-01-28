# Academic Features Implementation Progress

> **Last Updated:** January 27, 2026  
> **Status:** Phase 2.2 Complete ✅ | Phase 2.3 In Progress

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

## Phase 2.3: Quote Nodes & Quality Gates 🔄 In Progress

**Goal:** Make textual quotes first-class addressable objects, implement argument quality checks.

| Component | Status |
|-----------|--------|
| QuoteNode schema | ⏳ |
| QuoteInterpretation schema | ⏳ |
| Quote service | ⏳ |
| Interpretation service | ⏳ |
| Argument linting rules | ⏳ |
| Linting API | ⏳ |
| Quote UI components | ⏳ |

---

## Phase 3: External Integration ⏳ Not Started

### Phase 3.1: DOI/Citation Integration
- CrossRef API integration
- Automatic DOI lookup
- Citation metadata extraction

### Phase 3.2: Export Formats
- BibTeX export (basic version in releases)
- RIS export
- PDF report generation

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

---

## Next Steps

1. **Phase 2.3** - Quote nodes and argument quality gates (in progress)
2. **Database Migration** - Run `npx prisma db push` after schema changes
3. **Phase 3** - External integration (DOI/citations, export formats)
4. **Testing** - Add unit tests for services

---

## Notes & Decisions

| Decision | Rationale |
|----------|-----------|
| PostgreSQL over Pinecone (Phase 1.2) | Simplify initial implementation; `USE_VECTOR_SEARCH` flag allows upgrade |
| Semantic versioning (major.minor.patch) | Familiar pattern for academics; clear version progression |
| JSON snapshots over normalized tables | Faster point-in-time queries; immutable release state |
| Simplified ASPIC+ acceptability | Full grounded semantics deferred; basic attack counting for now |
| BibTeX in releases | Academic users expect citation formats |

---

## Dependencies

```json
{
  "existing": ["prisma", "next-auth", "zod"],
  "added": [],
  "deferred": ["@pinecone-database/pinecone"]
}
```
