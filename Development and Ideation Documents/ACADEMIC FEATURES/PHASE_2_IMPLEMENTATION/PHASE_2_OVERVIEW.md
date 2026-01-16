# Phase 2: Discourse Substrate — GitHub-for-Scholarship Patterns

**Phase:** 2 of 6  
**Timeline:** Q2 2026 (Weeks 1-12)  
**Status:** Planning  
**Depends On:** Phase 1 (Foundation)  
**Theme:** *Treat deliberations like open-source projects with versioning, forking, and governance*

---

## Strategic Vision

Open-source software demonstrated that distributed collaboration can produce high-quality collective artifacts when supported by proper versioning and governance infrastructure. Academic debates have the same needs but lack the tooling. Phase 2 brings Git-like patterns to scholarly discourse.

---

## Sub-Phase Breakdown

| Sub-Phase | Name | Timeline | Description |
|-----------|------|----------|-------------|
| 2.1 | Debate Releases & Versioned Memory | Weeks 1-4 | Snapshot deliberation state, version numbering, changelogs, citable artifacts |
| 2.2 | Fork/Branch/Merge | Weeks 5-8 | Fork deliberations, explore alternatives, merge back with provenance |
| 2.3 | Peer Review & Quality Gates | Weeks 9-12 | Pull requests for arguments, review workflows, quality signals |

---

## Phase 2 Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 2: DISCOURSE SUBSTRATE                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   VERSIONING LAYER                                                           │
│   ┌────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                        │ │
│   │   Deliberation                                                         │ │
│   │   ├── Release v1.0.0 ─────────────────────────────────────────────┐   │ │
│   │   │   ├── ClaimSnapshot (status at release)                       │   │ │
│   │   │   ├── ArgumentSnapshot (acceptability)                        │   │ │
│   │   │   └── CitationURI / DOI                                       │   │ │
│   │   │                                                               │   │ │
│   │   ├── Release v1.1.0 ────────────────────────────────────────┐    │   │ │
│   │   │   ├── Changelog (diff from v1.0.0)                       │    │   │ │
│   │   │   └── ...                                                │    │   │ │
│   │   │                                                          │    │   │ │
│   │   └── Current (HEAD)                                         │    │   │ │
│   │       ├── Live claims & arguments                            │    │   │ │
│   │       └── Pending PRs                                        │    │   │ │
│   │                                                              │    │   │ │
│   └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│   FORKING LAYER                                                              │
│   ┌────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                        │ │
│   │   Main Deliberation ──────┬───────────────────────────────────────┐   │ │
│   │                           │                                       │   │ │
│   │                           ├── Fork A ("Under assumption X")       │   │ │
│   │                           │   └── May merge back                  │   │ │
│   │                           │                                       │   │ │
│   │                           └── Fork B ("Alternative framework")    │   │ │
│   │                               └── Standalone exploration          │   │ │
│   │                                                                        │ │
│   └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│   REVIEW LAYER                                                               │
│   ┌────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                        │ │
│   │   Argument PR ────────────────────────────────────────────────────┐   │ │
│   │   ├── Proposed claims/arguments                                   │   │ │
│   │   ├── Review comments                                             │   │ │
│   │   ├── Status: OPEN → IN_REVIEW → APPROVED/REJECTED               │   │ │
│   │   └── Merge → Deliberation                                        │   │ │
│   │                                                                        │ │
│   └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Deliverables

### 2.1 Debate Releases & Versioned Memory

| Deliverable | Description | Validation Criteria |
|-------------|-------------|---------------------|
| DebateRelease model | Snapshot deliberation state | Schema deployed, CRUD working |
| Version numbering | Semantic versioning (v1.0.0) | Auto-increment, manual override |
| Changelog generation | Diff between releases | Accurate claim/argument tracking |
| Citation export | BibTeX/RIS for releases | Valid academic citation format |
| Release UI | Create, view, compare releases | User can publish releases |

### 2.2 Fork/Branch/Merge

| Deliverable | Description | Validation Criteria |
|-------------|-------------|---------------------|
| Fork action | Create derivative deliberation | Provenance preserved |
| Selective import | Choose claims to fork | UI for selection, validation |
| Fork registry | List all forks of a deliberation | Discoverable, linked |
| Merge workflow | Integrate fork changes back | Conflict detection, resolution |

### 2.3 Peer Review & Quality Gates

| Deliverable | Description | Validation Criteria |
|-------------|-------------|---------------------|
| ArgumentPR model | Propose arguments for inclusion | Full lifecycle support |
| Review workflow | Comment, request changes, approve | State transitions work |
| Quality signals | Contributor reputation, review count | Visible badges/indicators |
| Notifications | Alert on PR activity | Timely delivery |

---

## Technical Dependencies

| Dependency | Purpose | Phase 1 Component |
|------------|---------|-------------------|
| Claim model | Snapshots reference claims | Phase 1.1 |
| Argument model | Snapshots reference arguments | Existing |
| ASPIC+ evaluation | Determine claim status | Existing |
| User model | Track release authors, reviewers | Phase 1.4 |
| Notification system | Alerts on releases, PRs | Existing |

---

## New Data Models

### DebateRelease

```prisma
model DebateRelease {
  id                    String   @id @default(cuid())
  deliberationId        String
  deliberation          Deliberation @relation(fields: [deliberationId], references: [id])
  version               String   // Semantic version
  title                 String
  summary               String?  @db.Text
  claimSnapshot         Json     // Full claim state
  argumentSnapshot      Json     // Full argument state
  changelogFromPrevious String?  @db.Text
  releasedById          String
  releasedBy            User     @relation(fields: [releasedById], references: [id])
  releasedAt            DateTime @default(now())
  citationUri           String?
  doi                   String?
  
  @@unique([deliberationId, version])
}
```

### Deliberation Extensions (Forking)

```prisma
model Deliberation {
  // Existing...
  forkedFromId    String?
  forkedFrom      Deliberation? @relation("Forks")
  forks           Deliberation[] @relation("Forks")
  forkReason      String?
}
```

### ArgumentPullRequest

```prisma
model ArgumentPullRequest {
  id              String   @id @default(cuid())
  deliberationId  String
  deliberation    Deliberation @relation(fields: [deliberationId], references: [id])
  title           String
  description     String?  @db.Text
  status          PRStatus @default(OPEN)
  authorId        String
  author          User     @relation(fields: [authorId], references: [id])
  proposedClaims  Json     // Claims to add
  proposedArgs    Json     // Arguments to add
  reviews         PRReview[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  mergedAt        DateTime?
  mergedById      String?
}

enum PRStatus {
  OPEN
  IN_REVIEW
  CHANGES_REQUESTED
  APPROVED
  MERGED
  CLOSED
}
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Complex merge conflicts | Medium | High | Start with simple merge, manual conflict resolution |
| Snapshot size explosion | Medium | Medium | Compress JSON, prune old releases |
| DOI minting complexity | Low | Low | Start without DOI, add later |
| Fork proliferation | Medium | Low | Discovery UI, archive inactive forks |
| Review fatigue | Medium | Medium | Smart assignment, async workflows |

---

## Testing Strategy

| Test Type | Coverage | Tools |
|-----------|----------|-------|
| Unit | Snapshot generation, diff algorithm, version parsing | Jest |
| Integration | Release creation flow, fork workflow, PR lifecycle | Supertest |
| E2E | Full release publish, fork & merge, PR review | Playwright |
| Performance | Large snapshot handling, diff computation | Custom benchmarks |

---

## Rollout Plan

| Week | Focus | Milestone |
|------|-------|-----------|
| 1-2 | DebateRelease schema & API | Can create/read releases |
| 3-4 | Changelog generation & UI | Can compare releases, view changes |
| 5-6 | Fork model & action | Can fork deliberations |
| 7-8 | Merge workflow | Can merge forks back |
| 9-10 | ArgumentPR model & workflow | Can create/review PRs |
| 11-12 | Quality signals & polish | Full review workflow, badges |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Releases published | 50+ in first month | Database query |
| Forks created | 20+ in first month | Database query |
| PRs opened | 100+ in first month | Database query |
| PR merge rate | >60% | Merged / Total PRs |
| Time to first review | <48 hours median | Timestamp diff |

---

## Definition of Done

- [ ] All schema migrations applied and tested
- [ ] All API endpoints documented and tested
- [ ] UI components reviewed and accessible
- [ ] Integration tests passing at >80% coverage
- [ ] Performance benchmarks met (snapshot gen <5s)
- [ ] Documentation complete in roadmap docs
- [ ] Rollout to staging environment
- [ ] User acceptance testing passed

---

## Sub-Phase Implementation Guides

- [Phase 2.1: Debate Releases & Versioned Memory](./PHASE_2.1_DEBATE_RELEASES.md)
- [Phase 2.2: Fork/Branch/Merge](./PHASE_2.2_FORK_BRANCH_MERGE.md)
- [Phase 2.3: Peer Review & Quality Gates](./PHASE_2.3_PEER_REVIEW.md)

---

*End of Phase 2 Overview*
