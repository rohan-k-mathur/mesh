# Academic Features Implementation Progress

> **Last Updated:** January 26, 2026  
> **Status:** Phase 2.1 Part 2 Complete

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

### Phase 2.1: Debate Releases & Versioned Memory 🔄 In Progress

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

#### Part 3: UI Components ⏳ Not Started

| Component | Status | Description |
|-----------|--------|-------------|
| ReleaseListPanel | ⏳ | List releases with version badges |
| VersionBadge | ⏳ | Display version number with status colors |
| CreateReleaseModal | ⏳ | Form to create new release |
| ChangelogViewer | ⏳ | Display formatted changelog |
| ReleaseDiffView | ⏳ | Side-by-side comparison of releases |

---

## Phase 2.2: Forking & Branching ⏳ Not Started

**Goal:** Allow deliberations to be forked for alternative explorations.

| Component | Status |
|-----------|--------|
| Fork schema fields | ⏳ (Added to Deliberation) |
| Fork service | ⏳ |
| Fork API | ⏳ |
| Fork UI | ⏳ |

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

---

## Next Steps

1. **Phase 2.1 Part 3** - UI components for release management
2. **Database Migration** - Run `npx prisma db push` to add DebateRelease table
3. **Phase 2.2** - Forking system for deliberation branches
4. **Testing** - Add unit tests for release services

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
