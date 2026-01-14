# Stacks Improvement Phase 3.5 & Appendices

> **Document**: Phase 3.5 (AI-Enhanced Features) Outline + Final Summary & Appendices  
> **Parent Document**: STACKS_IMPROVEMENT_PHASE_3.md  
> **Status**: Planning (Phase 3.5 deferred until after 3.1-3.4 complete)  
> **Last Updated**: January 2026

---

# Phase 3.5: AI-Enhanced Features (Deferred)

**Goal**: Leverage AI to automate tedious evidence tasks, enhance discovery, and provide intelligent assistance without replacing human judgment.

**Timeline**: Post Phase 3.4 (estimated Weeks 15-20)

**Strategic Note**: Per project priorities, AI features are deferred until the end of the development process. This phase should only begin after Phases 3.1-3.4 are complete and stable. The first AI feature to implement is **Auto-Citation Extraction**.

---

## 3.5.1 Auto-Citation Extraction (First Priority)

**Priority**: P1 — First AI feature to implement  
**Estimated Effort**: 5-7 days  
**Risk Level**: Medium (AI accuracy, user trust)

### Overview

Automatically extract and suggest citations when users paste text containing references.

### Key Capabilities

| Capability | Description |
|------------|-------------|
| Reference Detection | Identify in-text citations (Author, Year), footnote markers, DOI mentions |
| Metadata Extraction | Parse author names, publication year, title fragments |
| Source Matching | Match extracted references to existing sources or external databases |
| Batch Import | Allow users to accept/reject multiple suggestions at once |

### Technical Approach (Outline)

```
1. Input Processing
   - Detect pasted text with potential citations
   - Parse common citation formats (APA, MLA, Chicago, Vancouver)
   - Extract structured reference data

2. Source Resolution
   - Search local source database first
   - Query external APIs (Semantic Scholar, CrossRef, OpenAlex)
   - Rank matches by confidence

3. User Confirmation
   - Present extracted citations with confidence scores
   - Allow bulk accept/reject/edit
   - Learn from user corrections (optional enhancement)
```

### UI Sketch

```
┌─────────────────────────────────────────────────────┐
│ 📋 Citations Detected                               │
├─────────────────────────────────────────────────────┤
│ We found 3 potential citations in your text:       │
│                                                     │
│ ☑ Smith et al. (2023)                    [95%]    │
│   → "Machine Learning in Healthcare"               │
│   → DOI: 10.1234/example                           │
│                                                     │
│ ☑ Johnson & Lee (2022)                   [87%]    │
│   → "Data Privacy Frameworks"                      │
│   → Matched to existing source                     │
│                                                     │
│ ☐ (Brown, 2021)                          [62%]    │
│   → Multiple matches found - click to select       │
│                                                     │
│ [Import Selected (2)]  [Skip All]  [Edit Manually] │
└─────────────────────────────────────────────────────┘
```

### Acceptance Criteria (Draft)

- Detects 80%+ of standard citation formats
- Matches to correct source 90%+ when source exists in database
- User can override any suggestion
- No citation added without user confirmation

---

## 3.5.2 Smart Evidence Suggestions

**Priority**: P2  
**Estimated Effort**: 5-7 days  
**Risk Level**: Medium

### Overview

Suggest relevant sources based on the content of claims, arguments, or deliberations.

### Key Capabilities

| Capability | Description |
|------------|-------------|
| Claim Analysis | Understand what evidence would support/refute a claim |
| Context-Aware Search | Search based on deliberation context, not just keywords |
| Diverse Suggestions | Include supporting, opposing, and contextual sources |
| Explanation | Explain why each source is suggested |

### Technical Approach (Outline)

```
1. Content Embedding
   - Generate embeddings for claims/arguments
   - Store embeddings for all sources (abstract + title)

2. Semantic Search
   - Find sources with similar/related embeddings
   - Apply intent classification (support vs. refute)
   - Filter by quality signals (verification, citation count)

3. Ranking & Presentation
   - Rank by relevance + diversity
   - Group by intent (supporting, opposing, background)
   - Provide brief explanation for each suggestion
```

### Deferred Implementation Details

- Embedding model selection (OpenAI ada-002, local alternatives)
- Vector database integration (Pinecone already in deps)
- Relevance threshold tuning
- A/B testing framework for suggestion quality

---

## 3.5.3 Evidence Quality Scoring

**Priority**: P2  
**Estimated Effort**: 4-5 days  
**Risk Level**: Medium (interpretability concerns)

### Overview

AI-assisted scoring of source quality beyond basic verification.

### Key Capabilities

| Capability | Description |
|------------|-------------|
| Methodology Assessment | Evaluate research methodology indicators |
| Bias Detection | Flag potential conflicts of interest, funding sources |
| Replication Status | Track if findings have been replicated |
| Aggregated Score | Combine signals into interpretable quality tiers |

### Scoring Dimensions (Draft)

| Dimension | Signals |
|-----------|---------|
| Authority | Journal impact, author h-index, institutional affiliation |
| Methodology | Sample size, study design, peer review status |
| Transparency | Data availability, pre-registration, code sharing |
| Corroboration | Citation count, replication studies, meta-analyses |
| Recency | Publication date, field update frequency |

### Transparency Requirements

- All scoring factors visible to user
- No "black box" quality scores
- Users can weight factors based on context
- Clear distinction between AI-assessed and verified signals

---

## 3.5.4 Argument Strength Analysis

**Priority**: P3  
**Estimated Effort**: 5-7 days  
**Risk Level**: High (subjective, controversial)

### Overview

Analyze the logical and evidential strength of arguments.

### Key Capabilities (Cautious Approach)

| Capability | Description |
|------------|-------------|
| Evidence Gap Detection | Identify claims lacking citations |
| Premise Coverage | Check if all premises have support |
| Counter-Argument Awareness | Flag if opposing views addressed |
| Logical Structure | Basic validity checking |

### What This Feature Should NOT Do

- Declare arguments "right" or "wrong"
- Score arguments against each other
- Replace human judgment on argument quality
- Make political or value judgments

### Implementation Philosophy

> This feature assists, not judges. It highlights what might be missing or underexplored, leaving evaluation to users.

---

## 3.5.5 AI-Assisted Summarization

**Priority**: P3  
**Estimated Effort**: 3-4 days  
**Risk Level**: Low

### Overview

Generate summaries of sources, stacks, and deliberations.

### Key Capabilities

| Capability | Description |
|------------|-------------|
| Source Summaries | Concise abstract when none exists |
| Stack Overviews | Synthesize themes across stack items |
| Deliberation Recaps | Summarize key points and evidence used |
| Diff Summaries | Highlight changes since last visit |

### Implementation Notes

- Use existing LLM APIs (OpenAI already integrated)
- Cache summaries, regenerate on content change
- Always label as "AI-generated summary"
- Include "View original" links

---

## Phase 3.5 Implementation Order

Based on user impact and technical dependencies:

```
1. Auto-Citation Extraction (3.5.1) — First AI feature
   ↓ Establishes AI integration patterns
2. Smart Evidence Suggestions (3.5.2)
   ↓ Builds on embedding infrastructure
3. AI-Assisted Summarization (3.5.5)
   ↓ Low risk, high utility
4. Evidence Quality Scoring (3.5.3)
   ↓ Requires careful UX design
5. Argument Strength Analysis (3.5.4)
   ↓ Most cautious approach needed
```

---

## Phase 3.5 Completion Checklist (Deferred)

| Item | Owner | Status |
|------|-------|--------|
| Citation extraction parser | Backend | ☐ |
| Citation matching service | Backend | ☐ |
| Citation extraction UI | Frontend | ☐ |
| Source embedding pipeline | Backend | ☐ |
| Vector search integration | Backend | ☐ |
| Evidence suggestion API | Backend | ☐ |
| Evidence suggestion component | Frontend | ☐ |
| Quality scoring model | Backend | ☐ |
| Quality score display | Frontend | ☐ |
| Summarization service | Backend | ☐ |
| Summary caching layer | Backend | ☐ |
| Argument analysis service | Backend | ☐ |
| Evidence gap indicator | Frontend | ☐ |

---

**Estimated Phase 3.5 Duration**: 4-6 weeks (post 3.1-3.4)

---

# Final Summary

## Phase 3 Overview

Phase 3 ("Unique Moat") establishes Mesh's differentiation from simple research tools by building features that leverage its unique position as a platform where evidence is actively used in structured deliberation.

### Phase 3.1: Trust Infrastructure (Weeks 1-3)
**Theme**: Verify and monitor source integrity

| Feature | Purpose |
|---------|---------|
| Source Verification System | Automated URL/DOI verification with status badges |
| Source Archiving | Wayback Machine integration for link permanence |
| Retraction Alerts | Monitor sources for retractions/corrections |
| Conflict of Interest | Structured disclosure collection |

### Phase 3.2: Integration & Interoperability (Weeks 4-6)
**Theme**: Connect Mesh to the academic ecosystem

| Feature | Purpose |
|---------|---------|
| Academic Database Integration | Semantic Scholar, OpenAlex, CrossRef APIs |
| Reference Manager Sync | Bidirectional Zotero sync |
| Embeddable Widgets | Share evidence outside Mesh |
| Public API | Developer access to evidence data |

### Phase 3.3: Cross-Platform Intelligence (Weeks 7-10)
**Theme**: Insights from cross-deliberation analysis

| Feature | Purpose |
|---------|---------|
| Cross-Deliberation Tracking | See where sources are discussed |
| Evidence Provenance | Track evidence flow and attribution |
| Hot Sources Trending | Surface actively-cited sources |
| Citation Network Analysis | Co-citation relationships and clusters |

### Phase 3.4: Discovery & Exploration (Weeks 11-14)
**Theme**: Visual exploration and serendipitous discovery

| Feature | Purpose |
|---------|---------|
| Knowledge Graph View | Interactive visualization of connections |
| Related Content | Find similar stacks and deliberations |
| Timeline View | Temporal exploration of evidence |
| Opposing View Finder | Surface counter-evidence and critiques |

### Phase 3.5: AI-Enhanced Features (Weeks 15-20, Deferred)
**Theme**: Intelligent automation and assistance

| Feature | Purpose |
|---------|---------|
| Auto-Citation Extraction | Detect and import citations from text |
| Smart Evidence Suggestions | Context-aware source recommendations |
| Evidence Quality Scoring | Multi-factor quality assessment |
| Argument Strength Analysis | Identify gaps and weak points |
| AI Summarization | Automated summaries of content |

---

## Total Estimated Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 3.1 | 3 weeks | Not Started |
| Phase 3.2 | 3-4 weeks | Not Started |
| Phase 3.3 | 3-4 weeks | Not Started |
| Phase 3.4 | 3-4 weeks | Not Started |
| Phase 3.5 | 4-6 weeks | Deferred |
| **Total** | **16-21 weeks** | — |

---

## Success Metrics

### Trust & Quality Metrics
- % of sources with verification status
- Time from retraction to user notification
- User engagement with verification badges

### Integration Metrics
- Sources imported via academic search
- Active Zotero connections
- API key registrations
- Embed views per month

### Discovery Metrics
- Cross-deliberation navigation rate
- Knowledge graph exploration sessions
- Opposing views engagement
- Timeline interactions

### AI Feature Metrics (Phase 3.5)
- Citation extraction accuracy
- Suggestion acceptance rate
- Summary read rate

---

# Appendix A: Complete Schema Additions

## Phase 3.1 Schema

```prisma
// Source model extensions
model Source {
  // Existing fields...
  
  // Phase 3.1 additions
  verificationStatus    SourceVerificationStatus @default(unverified)
  verificationCheckedAt DateTime?
  verificationError     String?
  
  archiveStatus         ArchiveStatus @default(none)
  archiveUrl            String?
  archiveDate           DateTime?
  
  retractionStatus      RetractionStatus @default(none)
  retractionDate        DateTime?
  retractionReason      String?
  correctionNotes       String?
  
  contentHash           String?
  lastContentCheck      DateTime?
  canonicalUrl          String?
}

model SourceAlert {
  id              String   @id @default(cuid())
  sourceId        String
  alertType       SourceAlertType
  title           String
  description     String?
  severity        AlertSeverity
  externalUrl     String?
  detectedAt      DateTime @default(now())
  acknowledgedAt  DateTime?
  acknowledgedBy  String?
  isActive        Boolean  @default(true)
  metadata        Json?
  
  source          Source   @relation(fields: [sourceId], references: [id])
  notifications   SourceAlertNotification[]
}

model SourceAlertNotification {
  id          String   @id @default(cuid())
  alertId     String
  userId      String
  sentAt      DateTime @default(now())
  readAt      DateTime?
  channel     String   @default("in_app")
  
  alert       SourceAlert @relation(fields: [alertId], references: [id])
  user        Profile     @relation(fields: [userId], references: [id])
}

model SourceDisclosure {
  id              String   @id @default(cuid())
  sourceId        String
  disclosureType  DisclosureType
  description     String
  entities        String[]
  severity        DisclosureSeverity @default(low)
  verifiedBy      String?
  verifiedAt      DateTime?
  createdBy       String
  createdAt       DateTime @default(now())
  
  source          Source   @relation(fields: [sourceId], references: [id])
}

enum SourceVerificationStatus {
  unverified
  verified
  redirected
  unavailable
  broken
  paywalled
}

enum ArchiveStatus {
  none
  pending
  archived
  failed
}

enum RetractionStatus {
  none
  retracted
  corrected
  expression_of_concern
  under_investigation
}

enum SourceAlertType {
  retraction
  correction
  expression_of_concern
  url_broken
  content_changed
  duplicate_detected
}

enum AlertSeverity {
  low
  medium
  high
  critical
}

enum DisclosureType {
  funding
  employment
  financial_interest
  personal_relationship
  prior_publication
  other
}

enum DisclosureSeverity {
  low
  medium
  high
}
```

## Phase 3.2 Schema

```prisma
model ReferenceManagerConnection {
  id              String   @id @default(cuid())
  userId          String
  provider        ReferenceManagerProvider
  accessToken     String
  refreshToken    String?
  expiresAt       DateTime?
  syncEnabled     Boolean  @default(true)
  defaultStackId  String?
  lastSyncAt      DateTime?
  lastSyncError   String?
  syncDirection   SyncDirection @default(bidirectional)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            Profile  @relation(fields: [userId], references: [id])
  items           ReferenceManagerItem[]
}

model ReferenceManagerItem {
  id              String   @id @default(cuid())
  connectionId    String
  externalId      String
  sourceId        String?
  stackItemId     String?
  syncStatus      SyncStatus @default(pending)
  lastSyncedAt    DateTime?
  syncError       String?
  metadata        Json?
  
  connection      ReferenceManagerConnection @relation(fields: [connectionId], references: [id])
  source          Source?  @relation(fields: [sourceId], references: [id])
}

model ApiKey {
  id              String   @id @default(cuid())
  userId          String
  name            String
  keyHash         String
  keyPrefix       String
  scopes          String[]
  tier            ApiKeyTier @default(free)
  rateLimitOverride Int?
  lastUsedAt      DateTime?
  requestCount    Int      @default(0)
  isActive        Boolean  @default(true)
  expiresAt       DateTime?
  revokedAt       DateTime?
  revokedReason   String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            Profile  @relation(fields: [userId], references: [id])
}

enum ReferenceManagerProvider {
  zotero
  mendeley
}

enum SyncStatus {
  pending
  synced
  error
  conflict
}

enum SyncDirection {
  import_only
  export_only
  bidirectional
}

enum ApiKeyTier {
  free
  pro
  partner
  unlimited
}
```

## Phase 3.3 Schema

```prisma
model SourceUsage {
  id                  String   @id @default(cuid())
  sourceId            String   @unique
  totalCitations      Int      @default(0)
  deliberationCount   Int      @default(0)
  argumentCount       Int      @default(0)
  stackCount          Int      @default(0)
  supportCount        Int      @default(0)
  refuteCount         Int      @default(0)
  contextCount        Int      @default(0)
  uniqueCiters        Int      @default(0)
  citationsLast7Days  Int      @default(0)
  citationsLast30Days Int      @default(0)
  trendScore          Float    @default(0)
  firstCitedAt        DateTime?
  lastCitedAt         DateTime?
  updatedAt           DateTime @updatedAt
  
  source              Source   @relation(fields: [sourceId], references: [id])
}

model SourceCitationContext {
  id              String   @id @default(cuid())
  sourceId        String
  deliberationId  String?
  argumentId      String?
  stackId         String?
  citationId      String   @unique
  intent          CitationIntent
  quote           String?
  isPublic        Boolean  @default(false)
  createdAt       DateTime @default(now())
  
  source          Source   @relation(fields: [sourceId], references: [id])
  deliberation    Deliberation? @relation(fields: [deliberationId], references: [id])
  citation        Citation @relation(fields: [citationId], references: [id])
}

model EvidenceProvenanceEvent {
  id              String   @id @default(cuid())
  sourceId        String
  eventType       ProvenanceEventType
  actorId         String
  fromType        String?
  fromId          String?
  toType          String?
  toId            String?
  metadata        Json?
  createdAt       DateTime @default(now())
  
  source          Source   @relation(fields: [sourceId], references: [id])
  actor           Profile  @relation(fields: [actorId], references: [id])
}

model TrendingSnapshot {
  id                  String   @id @default(cuid())
  snapshotType        TrendingSnapshotType
  periodStart         DateTime
  periodEnd           DateTime
  sourcesRanking      Json
  topicsRanking       Json
  deliberationsRanking Json
  totalCitations      Int
  totalSources        Int
  computedAt          DateTime @default(now())
}

model SourceRelationship {
  id                  String   @id @default(cuid())
  sourceAId           String
  sourceBId           String
  coCitationCount     Int      @default(0)
  coCitationScore     Float    @default(0)
  sharedDeliberations Int      @default(0)
  sharedArguments     Int      @default(0)
  relationshipType    SourceRelationshipType?
  computedAt          DateTime @default(now())
  
  sourceA             Source   @relation("SourceRelationA", fields: [sourceAId], references: [id])
  sourceB             Source   @relation("SourceRelationB", fields: [sourceBId], references: [id])
  
  @@unique([sourceAId, sourceBId])
}

model CitationCluster {
  id              String   @id @default(cuid())
  name            String?
  topic           String?
  sourceIds       String[]
  cohesion        Float    @default(0)
  size            Int      @default(0)
  centroidSourceId String?
  computedAt      DateTime @default(now())
}

enum ProvenanceEventType {
  imported
  cited
  lifted_to_stack
  imported_from_stack
  forked
  shared
  exported
}

enum TrendingSnapshotType {
  hourly
  daily
  weekly
}

enum SourceRelationshipType {
  co_cited
  builds_on
  contradicts
  methodology
}
```

## Phase 3.4 Schema

```prisma
model KnowledgeNode {
  id              String   @id @default(cuid())
  nodeType        KnowledgeNodeType
  referenceId     String
  label           String
  description     String?
  weight          Float    @default(1)
  color           String?
  connectionCount Int      @default(0)
  lastActivityAt  DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  outgoingEdges   KnowledgeEdge[] @relation("EdgeSource")
  incomingEdges   KnowledgeEdge[] @relation("EdgeTarget")
  
  @@unique([nodeType, referenceId])
}

model KnowledgeEdge {
  id              String   @id @default(cuid())
  sourceNodeId    String
  targetNodeId    String
  edgeType        KnowledgeEdgeType
  weight          Float    @default(1)
  label           String?
  metadata        Json?
  createdAt       DateTime @default(now())
  
  sourceNode      KnowledgeNode @relation("EdgeSource", fields: [sourceNodeId], references: [id])
  targetNode      KnowledgeNode @relation("EdgeTarget", fields: [targetNodeId], references: [id])
  
  @@unique([sourceNodeId, targetNodeId, edgeType])
}

enum KnowledgeNodeType {
  source
  topic
  claim
  deliberation
  argument
  author
  institution
}

enum KnowledgeEdgeType {
  cites
  discusses
  contains
  supports
  refutes
  authored_by
  affiliated_with
  related_to
  builds_on
}
```

---

# Appendix B: API Endpoint Reference

## Phase 3.1 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sources/[id]/verification` | Get verification status |
| POST | `/api/sources/[id]/verify` | Trigger verification |
| GET | `/api/sources/[id]/archive` | Get archive status |
| POST | `/api/sources/[id]/archive` | Request archiving |
| GET | `/api/sources/[id]/alerts` | Get active alerts |
| POST | `/api/sources/[id]/alerts/[alertId]/acknowledge` | Acknowledge alert |
| GET | `/api/sources/[id]/disclosures` | Get disclosures |
| POST | `/api/sources/[id]/disclosures` | Add disclosure |

## Phase 3.2 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/academic-search` | Search academic databases |
| POST | `/api/academic-search/import` | Import source from search |
| GET | `/api/reference-managers` | List connections |
| POST | `/api/reference-managers/connect/zotero` | Connect Zotero |
| POST | `/api/reference-managers/[id]/sync` | Trigger sync |
| GET | `/api/widgets/embed` | Get embed codes |
| GET | `/api/oembed` | oEmbed endpoint |
| GET | `/api/v1/sources` | Public API: List sources |
| GET | `/api/v1/sources/[id]` | Public API: Get source |
| GET | `/api/v1/stacks/[id]` | Public API: Get stack |

## Phase 3.3 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sources/[id]/cross-references` | Get cross-deliberation usage |
| GET | `/api/sources/[id]/provenance` | Get provenance chain |
| GET | `/api/trending/sources` | Get trending sources |
| GET | `/api/trending/topics` | Get trending topics |
| GET | `/api/citation-network` | Get citation network graph |
| GET | `/api/sources/[id]/related` | Get co-cited sources |

## Phase 3.4 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/knowledge-graph` | Query knowledge graph |
| GET | `/api/knowledge-graph/search` | Search nodes |
| GET | `/api/deliberations/[id]/related` | Get related deliberations |
| GET | `/api/deliberations/[id]/related-stacks` | Get related stacks |
| GET | `/api/timeline` | Get timeline data |
| GET | `/api/opposing-views` | Find opposing views |

---

# Appendix C: Component Index

## Phase 3.1 Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `VerificationBadge` | `components/sources/` | Display verification status |
| `ArchiveBadge` | `components/sources/` | Display archive status |
| `AlertBanner` | `components/sources/` | Show active alerts |
| `RetractionWarning` | `components/sources/` | Prominent retraction notice |
| `DisclosurePrompt` | `components/sources/` | Collect disclosures |
| `DisclosureDisplay` | `components/sources/` | Show existing disclosures |

## Phase 3.2 Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `AcademicSearchModal` | `components/sources/` | Search academic databases |
| `AcademicSourceCard` | `components/sources/` | Display search result |
| `ZoteroConnectButton` | `components/settings/` | OAuth connection |
| `ZoteroSyncStatus` | `components/settings/` | Show sync state |
| `EmbedCodeGenerator` | `components/embed/` | Generate embed codes |
| `StackEmbedPage` | `app/embed/stack/` | Embed display page |
| `EvidenceEmbedPage` | `app/embed/evidence/` | Embed display page |

## Phase 3.3 Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `SourceCrossReferences` | `components/sources/` | Show cross-delib usage |
| `ProvenanceTimeline` | `components/sources/` | Display provenance chain |
| `TrendingSources` | `components/trending/` | Trending sources list |
| `TrendingTopics` | `components/trending/` | Trending topics cloud |
| `CitationNetworkGraph` | `components/sources/` | D3 network visualization |
| `RelatedSources` | `components/sources/` | Co-cited sources list |

## Phase 3.4 Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `KnowledgeGraphExplorer` | `components/explore/` | Interactive graph explorer |
| `RelatedDeliberations` | `components/deliberation/` | Similar deliberations |
| `RelatedStacks` | `components/deliberation/` | Similar stacks |
| `TimelineView` | `components/timeline/` | Timeline visualization |
| `TimelineEventNode` | `components/timeline/` | Individual event display |
| `OpposingViewFinder` | `components/deliberation/` | Counter-evidence finder |

---

# Appendix D: Worker & Cron Jobs

## Background Workers

| Worker | Queue | Purpose | Trigger |
|--------|-------|---------|---------|
| `verificationWorker` | `source-verification` | Verify source URLs | On source create, scheduled |
| `archiveWorker` | `source-archive` | Archive to Wayback | On request, after verification |
| `retractionMonitorWorker` | `retraction-monitor` | Check Retraction Watch | Scheduled daily |
| `zoteroSyncWorker` | `zotero-sync` | Sync with Zotero | On connect, scheduled |
| `sourceUsageAggregator` | `source-usage` | Aggregate citation data | On citation create/delete |
| `trendingComputation` | `trending` | Compute trending scores | Cron hourly/daily |
| `coCitationAnalysis` | `co-citation` | Compute co-citations | Scheduled weekly |
| `knowledgeGraphBuilder` | `knowledge-graph` | Build/update graph | Scheduled, on changes |

## Cron Schedule

| Job | Schedule | Endpoint |
|-----|----------|----------|
| Hourly trending | `0 * * * *` | `/api/_cron/trending?type=hourly` |
| Daily trending | `0 0 * * *` | `/api/_cron/trending?type=daily` |
| Weekly trending | `0 0 * * 0` | `/api/_cron/trending?type=weekly` |
| Retraction check | `0 6 * * *` | `/api/_cron/retraction-check` |
| Verification refresh | `0 3 * * *` | `/api/_cron/verification-refresh` |
| Co-citation analysis | `0 4 * * 0` | `/api/_cron/co-citation` |
| Graph rebuild | `0 5 * * 1` | `/api/_cron/knowledge-graph` |

---

# Appendix E: External API Dependencies

## Required Integrations

| Service | Purpose | Rate Limits | Auth |
|---------|---------|-------------|------|
| Semantic Scholar | Paper search, metadata | 100/5min (free) | API key optional |
| OpenAlex | Works search | Unlimited (polite) | Email header |
| CrossRef | DOI metadata | 50/sec (polite) | Email header |
| Wayback Machine | URL archiving | Polite use | None |
| Retraction Watch | Retraction database | TBD | API key |
| Zotero | Reference sync | Generous | OAuth |

## Optional Integrations

| Service | Purpose | Notes |
|---------|---------|-------|
| PubMed | Biomedical papers | NCBI E-utilities |
| arXiv | Preprints | OAI-PMH |
| CORE | Open access content | API key required |
| Unpaywall | Open access links | Email-based |
| OpenAI | AI features (Phase 3.5) | Already integrated |
| Pinecone | Vector search (Phase 3.5) | Already in deps |

---

# Appendix F: Migration Checklist

## Database Migrations

Run in order:

```bash
# Phase 3.1
npx prisma db push  # After adding 3.1 schema changes

# Phase 3.2
npx prisma db push  # After adding 3.2 schema changes

# Phase 3.3
npx prisma db push  # After adding 3.3 schema changes

# Phase 3.4
npx prisma db push  # After adding 3.4 schema changes
```

## Data Backfill Tasks

| Phase | Task | Command/Approach |
|-------|------|------------------|
| 3.1 | Verify existing sources | Run `verificationWorker` for all sources |
| 3.3 | Aggregate existing citations | Run `sourceUsageAggregator` for all sources |
| 3.3 | Compute initial trending | Run `trendingComputation` for all periods |
| 3.3 | Build co-citation graph | Run `coCitationAnalysis` |
| 3.4 | Build knowledge graph | Run `knowledgeGraphBuilder` with scope: full |

---

# Appendix G: Feature Flags

Recommended feature flags for phased rollout:

```typescript
const PHASE_3_FLAGS = {
  // Phase 3.1
  "source-verification": true,
  "source-archiving": true,
  "retraction-alerts": true,
  "conflict-disclosure": true,
  
  // Phase 3.2
  "academic-search": true,
  "zotero-sync": true,
  "embed-widgets": true,
  "public-api": true,
  
  // Phase 3.3
  "cross-deliberation-tracking": true,
  "evidence-provenance": true,
  "trending-sources": true,
  "citation-network": true,
  
  // Phase 3.4
  "knowledge-graph": true,
  "related-content": true,
  "timeline-view": true,
  "opposing-view-finder": true,
  
  // Phase 3.5 (all false initially)
  "auto-citation-extraction": false,
  "smart-suggestions": false,
  "quality-scoring": false,
  "argument-analysis": false,
  "ai-summarization": false,
};
```

---

# Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | January 2026 | Initial Phase 3 planning complete |

---

*End of Phase 3 Documentation*
