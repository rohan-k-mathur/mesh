# Stacks Further Improvement Development Roadmap

> **Status**: Draft  
> **Created**: January 5, 2026  
> **Source**: [STACKS_IMPROVEMENT_BRAINSTORM.md](STACKS_IMPROVEMENT_BRAINSTORM.md)  
> **Goal**: Transform Stacks from PDF-centric collections into a full Are.na-parity knowledge graph with deliberation superpowers

---

## Executive Summary

This roadmap executes the improvements outlined in the Stacks Improvement Brainstorm, organized into three phases:

| Phase | Focus | Duration | Outcome |
|-------|-------|----------|---------|
| **Phase 1** | Are.na Parity | 4-5 weeks | Multi-stack connections, block types, visibility modes |
| **Phase 2** | Evidence UX | 3-4 weeks | Citation anchors, lift carries citations, evidence intent |
| **Phase 3** | Unique Moat | 4-5 weeks | Verification, health metrics, knowledge graph |

**Total Estimated Duration**: 11-14 weeks (Q1 2026)

---

## Phase 1: Are.na Parity

**Objective**: Make Stacks feel as capable as Are.na for collecting, organizing, and connecting content.

### 1.1 StackItem Join Table Migration

**Priority**: P0 — Foundation for all multi-stack features  
**Estimated Effort**: 5-7 days  
**Risk**: Medium (data migration required)

#### 1.1.1 Schema Changes

```prisma
model StackItem {
  id        String   @id @default(cuid())
  stackId   String
  blockId   String   // LibraryPost.id during transition
  kind      StackItemKind @default(block)
  position  Float    // Float for cheap insertion
  addedById String
  createdAt DateTime @default(now())
  note      String?  // Optional connection note

  stack     Stack    @relation(fields: [stackId], references: [id], onDelete: Cascade)
  block     LibraryPost @relation(fields: [blockId], references: [id], onDelete: Cascade)

  @@unique([stackId, blockId])
  @@index([stackId, position])
  @@index([blockId])
}

enum StackItemKind {
  block
  stack_embed
}
```

#### 1.1.2 Migration Tasks

- [ ] Create `StackItem` model in schema.prisma
- [ ] Write migration script to populate StackItem from existing `Stack.order[]` + `LibraryPost.stack_id`
- [ ] Update `getStack` action to query via StackItem join
- [ ] Update `reorderStack` action to use StackItem.position
- [ ] Deprecate but preserve `Stack.order[]` field during transition
- [ ] Add API endpoints: `POST /api/stacks/:id/connect`, `DELETE /api/stacks/:id/disconnect/:blockId`

#### 1.1.3 Acceptance Criteria

- [ ] Existing stacks display identically after migration
- [ ] LibraryPost can appear in multiple stacks
- [ ] Reordering updates StackItem.position (not array rewrite)
- [ ] "Connected in X stacks" count available on LibraryPost

---

### 1.2 Block Types: Link + Text

**Priority**: P0 — Core content diversity  
**Estimated Effort**: 4-5 days  
**Dependency**: 1.1 (StackItem exists)

#### 1.2.1 Schema Extension

```prisma
// Option A: Extend LibraryPost with type discriminator
model LibraryPost {
  // ... existing fields
  blockType   BlockType @default(pdf)
  linkUrl     String?   // For link blocks
  linkMeta    Json?     // OG metadata, screenshot URL
  textContent String?   // For text/markdown blocks
}

enum BlockType {
  pdf
  link
  text
  image
  video
  dataset
}
```

#### 1.2.2 Implementation Tasks

- [ ] Add `blockType`, `linkUrl`, `linkMeta`, `textContent` fields to LibraryPost
- [ ] Create `LinkBlockCard` component with OG preview
- [ ] Create `TextBlockCard` component with markdown rendering
- [ ] Add "Add Link" action to StackComposer
- [ ] Add "Add Note" action to StackComposer
- [ ] Implement link metadata extraction (background job or on-save)
- [ ] Update stack grid to render mixed block types

#### 1.2.3 Background Processing

- [ ] Create `BlockProcessingJob` for async extraction
- [ ] Link blocks: fetch OG metadata, screenshot, readable text
- [ ] Store processing status: `queued | running | done | failed`

---

### 1.3 Connect UI + Contexts Panel

**Priority**: P1 — Key UX for multi-stack mental model  
**Estimated Effort**: 3-4 days  
**Dependency**: 1.1 (StackItem exists)

#### 1.3.1 Components

- [ ] `ConnectModal` — Select stacks to connect a block to
- [ ] `ContextsPanel` — "This block appears in X stacks" with links
- [ ] `ConnectButton` — Global action on blocks, search results, feed cards
- [ ] Batch connect: select multiple blocks → connect all to stack

#### 1.3.2 API Endpoints

- [ ] `GET /api/blocks/:id/contexts` — List stacks containing this block
- [ ] `POST /api/blocks/:id/connect` — Connect block to stack(s)
- [ ] `DELETE /api/blocks/:id/disconnect/:stackId` — Remove connection

---

### 1.4 Stack Embeds (Stacks Containing Stacks)

**Priority**: P2 — Advanced organization  
**Estimated Effort**: 2-3 days  
**Dependency**: 1.1 (StackItem with kind enum)

#### 1.4.1 Tasks

- [ ] Add `stackEmbedId` field to StackItem (nullable, alternative to blockId)
- [ ] Create `StackEmbedCard` component (preview of embedded stack)
- [ ] Add "Embed Stack" action to StackComposer
- [ ] Prevent circular embeds (A embeds B which embeds A)
- [ ] Decide on depth limit for nested rendering (recommend: 1 level inline, then "click to expand")

---

### 1.5 Visibility Modes

**Priority**: P1 — Matches user expectations  
**Estimated Effort**: 2 days  
**Dependency**: None (independent)

#### 1.5.1 Schema Change

```prisma
model Stack {
  // ... existing
  visibility StackVisibility @default(public_closed)
}

enum StackVisibility {
  public_open    // Anyone can view + add
  public_closed  // Anyone can view, collaborators add
  private        // Only collaborators
  unlisted       // Link-only access
}
```

#### 1.5.2 Tasks

- [ ] Add `visibility` enum to Stack model
- [ ] Migrate existing `is_public` → `visibility` (true → public_closed, false → private)
- [ ] Update authorization checks in all stack endpoints
- [ ] Add visibility selector to StackSettings UI
- [ ] For `public_open`: add moderation queue for non-collaborator additions

---

### 1.6 Export Functionality

**Priority**: P2 — Trust & portability  
**Estimated Effort**: 2-3 days  
**Dependency**: None

#### 1.6.1 Export Formats

- [ ] **ZIP Export**: All files + `manifest.json` with metadata/ordering
- [ ] **Markdown Export**: One `.md` per block with stable permalinks
- [ ] **Bibliography Export**: BibTeX, CSL-JSON, RIS for all Sources in stack

#### 1.6.2 Implementation

- [ ] `GET /api/stacks/:id/export?format=zip|md|bibtex`
- [ ] Background job for large stacks (queue + notify on completion)
- [ ] Export button in StackSettings dropdown

---

### Phase 1 Milestone Checklist

- [ ] StackItem migration complete, old ordering preserved
- [ ] Link and text blocks can be added to stacks
- [ ] Blocks can appear in multiple stacks with "Contexts" visible
- [ ] Visibility modes working (open/closed/private/unlisted)
- [ ] At least one export format functional

---

## Phase 2: Evidence UX

**Objective**: Make citations executable, carry evidence through workflows, and add semantic intent.

### 2.1 Citation Anchors

**Priority**: P0 — Core evidence UX improvement  
**Estimated Effort**: 4-5 days  
**Dependency**: Annotation system exists

#### 2.1.1 Schema Extension

```prisma
model Citation {
  // ... existing fields
  anchorType   CitationAnchorType?
  anchorId     String?  // annotationId, or inline anchor ref
  anchorData   Json?    // textRange, timestamp, coordinates
}

enum CitationAnchorType {
  annotation   // PDF highlight
  text_range   // Web capture selection
  timestamp    // Video/audio
  page         // Page-level (no selection)
}
```

#### 2.1.2 Tasks

- [ ] Add anchor fields to Citation model
- [ ] In PDF viewer: "Cite Selection" creates annotation + citation in one flow
- [ ] Clicking citation in claim/argument → opens PDF → jumps to page → highlights region
- [ ] Auto-populate: page → `locator`, selection → `quote`, annotation → `anchorId`
- [ ] For video blocks: timestamp anchor with seek-to-timestamp behavior

#### 2.1.3 UX Flow

```
User selects text in PDF viewer
  → "Cite this" button appears
  → Modal: confirm quote, add note, select target (current claim/argument/comment)
  → Creates: Annotation + Citation with anchorId
```

---

### 2.2 Lift Carries Citations

**Priority**: P0 — Critical workflow improvement  
**Estimated Effort**: 2-3 days  
**Dependency**: Lift route exists

#### 2.2.1 Current State

The lift route at `app/api/comments/lift/route.ts` creates:
- Claim from comment text
- DialogueMove for provenance
- But does **NOT** copy citations from comment to claim

#### 2.2.2 Implementation Tasks

- [ ] In lift route: query `Citation` where `targetType="comment"` and `targetId=commentId`
- [ ] For each: create new Citation with `targetType="claim"` and `targetId=newClaimId`
- [ ] Preserve: sourceId, locator, quote, note, anchorType, anchorId, anchorData
- [ ] Add `liftedFromCitationId` for traceability (optional)
- [ ] Emit event: `citations:lifted` for UI refresh

#### 2.2.3 Test Cases

- [ ] Comment with 0 citations → lift → claim has 0 citations ✓
- [ ] Comment with 3 citations → lift → claim has 3 identical citations ✓
- [ ] Original comment citations remain (not moved, copied) ✓

---

### 2.3 Citation Intent

**Priority**: P1 — Semantic evidence layer  
**Estimated Effort**: 2 days  
**Dependency**: 2.1 (anchors helpful but not required)

#### 2.3.1 Schema Addition

```prisma
model Citation {
  // ... existing
  intent CitationIntent @default(supports)
}

enum CitationIntent {
  supports
  refutes
  context
  defines
  method
  background
  acknowledges
}
```

#### 2.3.2 Tasks

- [ ] Add `intent` field to Citation
- [ ] Add intent selector to citation creation flow
- [ ] Display intent badge on citation cards
- [ ] In claim/argument view: group citations by intent (Pro | Con | Context)
- [ ] Compute "evidence balance" metric (supports vs refutes count)

---

### 2.4 Evidence List Upgrades

**Priority**: P2 — Enhanced filtering  
**Estimated Effort**: 2 days  
**Dependency**: 2.3 (intent exists)

#### 2.4.1 Features

- [ ] Filter by intent type
- [ ] Filter by source type (PDF, link, etc.)
- [ ] Filter by publication year range
- [ ] Sort by: relevance, recency, rating
- [ ] "Missing evidence" prompts (e.g., "No counter-evidence cited")

---

### Phase 2 Milestone Checklist

- [ ] Clicking a citation navigates to exact location in source
- [ ] Lifted claims inherit all citations from source comment
- [ ] Citations have semantic intent (supports/refutes/etc.)
- [ ] Evidence lists filterable and sortable

---

## Phase 3: Unique Moat

**Objective**: Build differentiated features that make Mesh the evidence-first knowledge platform.

### 3.1 Source Verification & Archiving

**Priority**: P1 — Trust infrastructure  
**Estimated Effort**: 4-5 days  
**Dependency**: Source model exists

#### 3.1.1 Schema Additions

```prisma
model Source {
  // ... existing
  verifiedAt      DateTime?
  verifiedStatus  SourceVerificationStatus?
  httpStatus      Int?
  canonicalUrl    String?
  archiveStatus   ArchiveStatus @default(none)
}

enum SourceVerificationStatus {
  verified
  unverified
  broken
  redirected
}

enum ArchiveStatus {
  none
  pending
  archived
  failed
}
```

#### 3.1.2 Tasks

- [ ] On source creation: background job to verify URL (HTTP status, follow redirects)
- [ ] Store `canonicalUrl` after redirect resolution
- [ ] Integration with archive service (Wayback Machine API or self-hosted)
- [ ] Auto-archive option for new sources
- [ ] Nightly job: re-verify popular sources, flag broken links
- [ ] UI badges: "Verified ✅", "Unverified ⚠️", "Broken ❌", "Archived 📦"

---

### 3.2 Evidence Health Metrics

**Priority**: P2 — Quality signals  
**Estimated Effort**: 3-4 days  
**Dependency**: 3.1 (verification), 2.3 (intent)

#### 3.2.1 Computed Metrics

```typescript
interface EvidenceHealth {
  diversity: number;       // Unique sources / total citations
  freshness: number;       // Median publication year score
  primaryRatio: number;    // Primary sources / total
  archiveCoverage: number; // Archived / total
  balanceScore: number;    // Presence of supports + refutes
  overall: "strong" | "mixed" | "weak";
}
```

#### 3.2.2 Tasks

- [ ] Implement `computeEvidenceHealth(deliberationId)` function
- [ ] Store cached health scores (recompute on citation changes)
- [ ] Display health badge on deliberation cards
- [ ] Health explainer panel (breakdown of each metric)
- [ ] "Improve evidence" suggestions based on weak dimensions

---

### 3.3 Multi-Dimensional Source Reviews

**Priority**: P3 — Advanced trust layer  
**Estimated Effort**: 3 days  
**Dependency**: SourceRating exists

#### 3.3.1 Schema Extension

```prisma
model SourceReview {
  id          String @id @default(cuid())
  sourceId    String
  userId      String
  
  // Dimensional ratings (1-5 or null if not rated)
  rigor       Int?   // Methodological rigor
  relevance   Int?   // Relevance to claim
  bias        Int?   // Bias/conflicts (inverted: 5 = no bias)
  clarity     Int?   // Clarity of presentation
  primaryness Int?   // Primary data vs commentary
  
  rationale   String? // Required for extreme scores
  createdAt   DateTime @default(now())
  
  source      Source @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  
  @@unique([sourceId, userId])
}
```

#### 3.3.2 Tasks

- [ ] Create SourceReview model
- [ ] Multi-dimensional rating UI (optional expansion from simple 1-10)
- [ ] Compute weighted overall score with transparency
- [ ] Show disagreement variance (controversial sources highlighted)
- [ ] Require rationale for scores 1-2 or 9-10

---

### 3.4 Knowledge Graph View

**Priority**: P3 — Exploration & discovery  
**Estimated Effort**: 5-7 days  
**Dependency**: 1.1 (StackItem), 2.1 (anchors)

#### 3.4.1 Features

- [ ] Visual graph: Stacks ↔ Blocks ↔ Sources ↔ Claims ↔ Deliberations
- [ ] Interactive exploration (click node to expand)
- [ ] Filter by entity type, time range, user
- [ ] "Related stacks" recommendations based on shared sources
- [ ] "Evidence trails" — trace a source through claims to deliberations

#### 3.4.2 Technical Approach

- [ ] Graph data model (nodes + edges) computed from existing relations
- [ ] Consider using StackReference model for cross-deliberation edges
- [ ] Frontend: D3.js or similar for interactive rendering
- [ ] API: `GET /api/graph?centerId=...&depth=2`

---

### Phase 3 Milestone Checklist

- [ ] Sources show verification status with visual badges
- [ ] Deliberations display evidence health scores
- [ ] Optional multi-dimensional source reviews available
- [ ] Knowledge graph view navigable

---

## Cross-Cutting Concerns

### Security: Private Thumbnail Leakage

**Priority**: P1 — Fix before scaling  
**Effort**: 1 day

- [ ] Audit thumbnail storage for private stacks
- [ ] Move private stack thumbs to signed-URL bucket OR
- [ ] Generate blurred/obscured thumbs for private content

### API Surface

**Priority**: P2 — Power user enablement  
**Effort**: 2-3 days

- [ ] `GET /api/public/stacks/:slug` — Public stack metadata + items
- [ ] `GET /api/public/blocks/:id` — Public block details
- [ ] `GET /api/public/blocks/:id/contexts` — Stacks containing block
- [ ] API key management + rate limiting
- [ ] Embed widget generation

---

## Quarterly Timeline (Q1 2026)

```
Week 1-2:   1.1 StackItem Migration (foundation)
Week 3:     1.2 Link + Text Blocks
Week 4:     1.3 Connect UI + 1.5 Visibility Modes
Week 5:     1.4 Stack Embeds + 1.6 Export
            ─── Phase 1 Complete ───
Week 6-7:   2.1 Citation Anchors
Week 8:     2.2 Lift Carries Citations + 2.3 Citation Intent
Week 9:     2.4 Evidence List Upgrades
            ─── Phase 2 Complete ───
Week 10-11: 3.1 Source Verification & Archiving
Week 12:    3.2 Evidence Health Metrics
Week 13-14: 3.3 Multi-Dimensional Reviews + 3.4 Knowledge Graph
            ─── Phase 3 Complete ───
```

---

## Success Metrics

| Metric | Baseline | Target (End Q1) |
|--------|----------|-----------------|
| Blocks in multiple stacks | 0% | 15% |
| Non-PDF blocks created | 0% | 25% of new blocks |
| Citations with anchors | 0% | 40% |
| Lifted claims with inherited citations | 0% | 100% |
| Sources with verification status | 0% | 80% |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| StackItem migration breaks existing stacks | Medium | High | Parallel arrays during transition; extensive testing |
| Link metadata extraction rate-limited | Medium | Low | Graceful degradation; queue with retry |
| Knowledge graph performance at scale | Low | Medium | Limit depth; pagination; caching |
| User confusion with visibility modes | Low | Medium | Clear UI labels; migration defaults to `public_closed` |

---

## Appendix A: Migration Script Outline (StackItem)

```typescript
// scripts/migrateStackToStackItem.ts
async function migrate() {
  const stacks = await prisma.stack.findMany({
    select: { id: true, order: true, owner_id: true },
  });
  
  for (const stack of stacks) {
    const order = stack.order ?? [];
    for (let i = 0; i < order.length; i++) {
      await prisma.stackItem.upsert({
        where: { stackId_blockId: { stackId: stack.id, blockId: order[i] } },
        create: {
          stackId: stack.id,
          blockId: order[i],
          position: i * 1000, // Leave gaps for insertions
          addedById: stack.owner_id,
        },
        update: {},
      });
    }
  }
  
  // Also migrate LibraryPosts with stack_id but not in any order array
  const orphans = await prisma.libraryPost.findMany({
    where: { stack_id: { not: null } },
    select: { id: true, stack_id: true, uploader_id: true },
  });
  // ... create StackItems for orphans at end of position range
}
```

---

## Appendix B: Related Documents

- [STACKS_IMPROVEMENT_BRAINSTORM.md](STACKS_IMPROVEMENT_BRAINSTORM.md) — Source brainstorm
- [STACKS_LIBRARY_SYSTEM_ARCHITECTURE.md](STACKS_LIBRARY_SYSTEM_ARCHITECTURE.md) — Current architecture
- [STACKS_LIBRARY_SYSTEM_AUDIT.md](STACKS_LIBRARY_SYSTEM_AUDIT.md) — System audit
- [STRATEGIC_PRIORITIZATION_ANALYSIS.md](STRATEGIC_PRIORITIZATION_ANALYSIS.md) — Tier 1 prioritization context

---

*Last updated: January 5, 2026*
