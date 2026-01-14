# Academic Agora Development Roadmap

**Created:** January 13, 2026  
**Status:** Active Development Plan  
**Foundation Documents:**
- `ACADEMIC_AGORA_HSS_DESIGN.md` (1554 lines)
- `ACADEMIC_COLLABORATION_FEATURES_BRAINSTORM.md` (977 lines)
- `ACADEMIC_AGORA_USE_CASE.md`
- `NETWORKED_ACADEMIC_RESEARCH_MESH.md` (Historical Research)

---

## Executive Summary

Academic Agora is the next missing layer in the 200-year evolution of networked academic research:

```
1800s–1900s: Learned societies, journals    → Publication = unit of record
1900s–2000s: Peer review, conferences       → Evaluation + discovery
2000s–2020s: Preprints, OA, social media    → Speed + access + chatter
2025+:       ACADEMIC AGORA                  → Claims + arguments + synthesis = unit of record
```

**Core Insight:** The unit of networking keeps shrinking (people → papers → metadata objects) but has not yet reached **claims and arguments**. Academic Agora fills this gap.

**Tagline:** *From papers-as-PDFs to papers-as-debatable, composable claim graphs.*

---

## Roadmap Overview

| Phase | Name | Focus | Timeline | Effort |
|-------|------|-------|----------|--------|
| **1** | **Foundation** | Academic workflows + claim-level engagement | Q1 2026 | 8-10 weeks |
| **2** | **Discourse Substrate** | GitHub-for-scholarship patterns + versioning | Q2 2026 | 8-10 weeks |
| **3** | **Knowledge Graph** | Claim provenance + argument-level citations | Q3 2026 | 8-10 weeks |
| **4** | **Open Review & Credit** | Living peer review + scholar recognition | Q4 2026 | 8-10 weeks |
| **5** | **Interdisciplinary Bridge** | Cross-field mapping + translation deliberations | Q1 2027 | 6-8 weeks |
| **6** | **External Presence** | Embeds, badges, platform integrations | Q2 2027 | 6-8 weeks |

---

# Phase 1: Foundation — Academic Workflows & Claim-Level Engagement

**Goal:** Enable core academic use patterns with minimal friction.

**Historical Justification:** Every scholarly infrastructure layer emerged to solve a scaling problem. Phase 1 solves: *"I want to engage with specific claims in papers, not just cite whole papers."*

## Phase 1.1: Paper-to-Claim Pipeline

**Problem:** Scholars read papers but can only engage at paper level. Claims are buried in PDFs.

### 1.1.1 Source Registration Enhancement

| Task | Description | Builds On |
|------|-------------|-----------|
| DOI auto-resolution | Paste DOI → full metadata from Crossref/OpenAlex | Existing Source model |
| ISBN/arXiv support | Expand identifier types for books + preprints | Source.identifier |
| PDF upload → metadata | Extract DOI from uploaded PDFs | LibraryPost pipeline |
| ORCID author linking | Link sources to author profiles | User model |

**Schema:**
```prisma
model Source {
  // Existing fields...
  identifierType  String?  // "doi" | "isbn" | "arxiv" | "url" | "manual"
  openAlexId      String?  // OpenAlex work ID for enrichment
  authorOrcids    String[] // ORCID IDs for authors
  abstractText    String?  // For semantic search
  keywords        String[] // Subject keywords
}
```

### 1.1.2 Claim Extraction UI

| Task | Description | Builds On |
|------|-------------|-----------|
| Manual claim creation | Form: claim text + source location (page/section) | Claim model |
| AI-assisted extraction | GPT-4 suggests claims from abstract/PDF | OpenAI integration |
| Claim type classification | Thesis/Interpretive/Historical/Normative/Methodological | ClaimType enum |
| Quote linking | Link claim to exact quote with page/paragraph | Citation.quote |
| Verification workflow | Human confirms/edits AI suggestions | Proposition → Claim flow |

**UI Flow:**
```
Source Detail Page
├── "Extract Claims" button
├── AI Suggestions Panel (dismissible, editable)
├── Manual Add Claim form
│   ├── Claim text
│   ├── Claim type dropdown
│   ├── Source location (page/section)
│   └── Supporting quote (optional)
└── Existing Claims list with discussion counts
```

### 1.1.3 Claim Types for HSS

```typescript
enum ClaimType {
  THESIS        = "thesis",        // Central argument of a work
  INTERPRETIVE  = "interpretive",  // Reading of text/event
  HISTORICAL    = "historical",    // Factual claim about past
  CONCEPTUAL    = "conceptual",    // Definition/analysis
  NORMATIVE     = "normative",     // Evaluative/prescriptive
  METHODOLOGICAL = "methodological", // How to study X
  COMPARATIVE   = "comparative",   // Relating two things
  CAUSAL        = "causal",        // Causation claim
  META          = "meta",          // Claim about field/debate
  EMPIRICAL     = "empirical",     // Data-based claim
}
```

**Files to create/modify:**
- `lib/models/schema.prisma` — Add ClaimType enum, update Claim model
- `app/api/claims/extract/route.ts` — AI extraction endpoint
- `components/claims/ClaimExtractionPanel.tsx` — Extraction UI
- `components/claims/ClaimTypeSelector.tsx` — Type picker

---

## Phase 1.2: Claim-Based Search & Discovery

**Problem:** Researchers can find papers but not specific claims or arguments.

### 1.2.1 Semantic Claim Search

| Task | Description | Builds On |
|------|-------------|-----------|
| Claim embeddings | Generate embeddings for all claims | Pinecone |
| Semantic search API | Search claims by meaning, not just text | `/api/search/claims` |
| Scheme filter | Filter by argument scheme type | Walton schemes |
| Attack filter | "Show claims that attack X" | ClaimEdge types |
| Author filter | "Claims by [ORCID/name]" | Source.authorOrcids |

**API:**
```typescript
// GET /api/search/claims
interface ClaimSearchParams {
  q: string;           // Semantic query
  type?: ClaimType[];  // Filter by claim type
  scheme?: string[];   // Filter by argument scheme
  attackedBy?: string; // Show claims attacked by this claim
  attacks?: string;    // Show claims that attack this claim
  author?: string;     // Author ORCID or name
  since?: string;      // Date filter
  limit?: number;
}
```

### 1.2.2 Related Arguments Panel

| Task | Description | Builds On |
|------|-------------|-----------|
| Similar claims | Semantic similarity to current claim | Pinecone |
| Supporting arguments | Arguments that support same conclusion | ArgumentChain |
| Attacking arguments | Typed attacks (rebut/undercut/undermine) | ClaimEdge |
| Cross-field matches | Claims from other deliberations on similar topics | RoomFunctor concept |

**UI:**
```
┌─────────────────────────────────────────────────────────────────┐
│  RELATED TO: "Democratic deliberation requires economic..."     │
├─────────────────────────────────────────────────────────────────┤
│  SIMILAR CLAIMS (3)                                              │
│  • "Economic inequality undermines political equality" (0.89)   │
│  • "Rawls's difference principle addresses..." (0.84)           │
│                                                                  │
│  SUPPORTING ARGUMENTS (2)                                        │
│  • [Empirical] Gilens & Page 2014 data                          │
│  • [Normative] Habermas ideal speech conditions                 │
│                                                                  │
│  CHALLENGES (4)                                                  │
│  • [Rebut] "Nordic countries show high deliberation + inequality"|
│  • [Undercut] "Correlation ≠ causation in the evidence"         │
└─────────────────────────────────────────────────────────────────┘
```

**Files to create:**
- `app/api/search/claims/route.ts` — Semantic claim search
- `components/claims/RelatedArgumentsPanel.tsx` — Related arguments UI
- `lib/search/claimEmbeddings.ts` — Embedding generation

---

## Phase 1.3: Academic Deliberation Templates

**Problem:** Scholars want structured discussion formats they already know.

### 1.3.1 Journal Club Template

| Task | Description | Builds On |
|------|-------------|-----------|
| Template schema | Phases, roles, timing, required moves | Deliberation model |
| Phase transitions | Claim extraction → Methodology → Theory → Synthesis | DialogueMoveType |
| Role assignments | Facilitator, presenter, discussants | Deliberation.members |
| Output generation | Auto-generate summary KB page | ThesisSidebar |

**Template Schema:**
```typescript
interface DeliberationTemplate {
  id: string;
  name: string;
  description: string;
  phases: Phase[];
  roles: Role[];
  outputType: "debate_sheet" | "thesis" | "kb_page";
}

interface Phase {
  name: string;
  description: string;
  durationMinutes?: number;
  requiredMoveTypes: DialogueMoveType[];
  completionCriteria: string;
}

// Journal Club Template
const JOURNAL_CLUB_TEMPLATE: DeliberationTemplate = {
  id: "journal-club",
  name: "Journal Club",
  phases: [
    { name: "Claim Extraction", durationMinutes: 20, requiredMoveTypes: ["ASSERT"] },
    { name: "Methodology Challenge", durationMinutes: 15, requiredMoveTypes: ["WHY", "GROUNDS"] },
    { name: "Theoretical Framing", durationMinutes: 15, requiredMoveTypes: ["SUPPORT", "EXTEND"] },
    { name: "Synthesis", durationMinutes: 10, requiredMoveTypes: ["RESOLVE"] },
  ],
  roles: [
    { name: "Facilitator", permissions: ["advance_phase", "moderate"] },
    { name: "Presenter", permissions: ["present_claims"] },
    { name: "Discussant", permissions: ["contribute"] },
  ],
  outputType: "debate_sheet",
};
```

### 1.3.2 Paper Response Template

| Task | Description | Builds On |
|------|-------------|-----------|
| Target paper registration | Link response to original paper | Source |
| Typed responses | Rebut/Undercut/Undermine selection | AttackType |
| Citation requirement | Enforce evidence for attacks | Citation model |
| Response document export | Generate structured response paper | Thesis export |

### 1.3.3 Seminar/Course Template

| Task | Description | Builds On |
|------|-------------|-----------|
| Private course spaces | Visibility controls | Deliberation.visibility |
| Reading assignments | Link to source materials | Stack integration |
| Contribution requirements | N claims, N responses per student | Participation tracking |
| Instructor dashboard | View student contributions, positions | Commitment stores |

**Files to create:**
- `lib/models/deliberationTemplates.ts` — Template definitions
- `app/api/deliberations/templates/route.ts` — Template API
- `components/deliberations/TemplateSelector.tsx` — Template picker UI
- `components/deliberations/JournalClubView.tsx` — Journal club UI
- `components/deliberations/SeminarDashboard.tsx` — Instructor view

---

## Phase 1.4: Academic Identity & Affiliation

**Problem:** Scholars need institutional identity for credibility.

### 1.4.1 Academic Profile Extensions

| Task | Description | Builds On |
|------|-------------|-----------|
| ORCID integration | Link/verify ORCID | User model |
| Institution field | University/department affiliation | UserAttributes |
| Position field | Professor/PhD/Postdoc etc. | UserAttributes |
| Research areas | Subject tags | expertiseTags |
| Publication list | Import from ORCID/OpenAlex | User.sources |

**Schema:**
```prisma
model User {
  // Existing fields...
  orcidId         String?   @unique
  orcidVerified   Boolean   @default(false)
  institution     String?
  department      String?
  position        String?   // "Professor" | "PhD Candidate" | etc.
  researchAreas   String[]
}
```

### 1.4.2 Organization Model

| Task | Description | Builds On |
|------|-------------|-----------|
| Organization entity | University/department/lab/consortium | New model |
| Member management | Link users to orgs | User.organizations |
| Org stacks | Shared institutional libraries | Stack model |
| Affiliation badges | Show affiliation on contributions | UI components |

**Schema:**
```prisma
model Organization {
  id              String   @id @default(cuid())
  name            String
  type            OrgType  // university | department | lab | consortium | journal
  parentId        String?
  parent          Organization? @relation("OrgHierarchy", fields: [parentId], references: [id])
  children        Organization[] @relation("OrgHierarchy")
  members         OrganizationMember[]
  stacks          Stack[]
  deliberations   Deliberation[]
  createdAt       DateTime @default(now())
}

enum OrgType {
  university
  department
  lab
  consortium
  journal
  society
}

model OrganizationMember {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id])
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  role            OrgRole  // admin | member | affiliate
  joinedAt        DateTime @default(now())
  
  @@unique([organizationId, userId])
}
```

**Files to create:**
- `lib/models/schema.prisma` — Organization models
- `app/api/organizations/route.ts` — Org CRUD
- `app/api/users/orcid/route.ts` — ORCID verification
- `components/profile/AcademicProfileForm.tsx` — Profile editor
- `components/organizations/OrgProfilePage.tsx` — Org page

---

## Phase 1 Deliverables Summary

| Deliverable | Description | User Value |
|-------------|-------------|------------|
| Paper → Claim pipeline | Extract/register claims from sources | Engage at claim level |
| Claim-based search | Find claims, not just papers | Discover arguments |
| Related arguments panel | See attacks/supports for any claim | Navigate debate space |
| Journal club template | Structured paper discussion format | Ready-to-use workflow |
| Academic profiles | ORCID + affiliation | Professional credibility |
| Organization model | Institutional presence | Lab/department identity |

---

# Phase 2: Discourse Substrate — GitHub-for-Scholarship Patterns

**Goal:** Treat deliberations like open-source projects with versioning, forking, and governance.

**Historical Justification:** Open-source showed that distributed collaboration can produce high-quality collective artifacts when there's good versioning and governance infrastructure. Scholarship needs the same.

## Phase 2.1: Debate Releases & Versioned Memory

**Insight from historical research:** *"Most academic debates don't end; they just accrete. But you can still ship snapshots."*

### 2.1.1 Debate Release Model

| Task | Description | Builds On |
|------|-------------|-----------|
| Release entity | Snapshot of deliberation state | New model |
| Version numbering | Semantic versioning (v1.0, v1.1) | Release.version |
| Status snapshot | What's defended/contested/unresolved | ASPIC+ evaluation |
| Changelog generation | What changed since last release | Diff algorithm |
| Citable artifact | DOI minting or stable URI | Release.uri |

**Schema:**
```prisma
model DebateRelease {
  id              String   @id @default(cuid())
  deliberationId  String
  deliberation    Deliberation @relation(fields: [deliberationId], references: [id])
  version         String   // "1.0.0", "1.1.0", etc.
  title           String
  summary         String?  @db.Text
  
  // Snapshot data
  claimSnapshot   Json     // Claims and their status at release time
  argumentSnapshot Json    // Arguments and acceptability
  changelogFromPrevious String? @db.Text
  
  // Metadata
  releasedBy      String
  releasedAt      DateTime @default(now())
  citationUri     String?  // Stable citable URI
  doi             String?  // Optional DOI
  
  @@unique([deliberationId, version])
}
```

### 2.1.2 Changelog View

| Task | Description | Builds On |
|------|-------------|-----------|
| Diff computation | Compare releases | ClaimSnapshot |
| Visual changelog | "What changed since v1.0" | UI component |
| Claim status timeline | Track claim status over time | Time series |
| Notification on release | Alert followers | Notification system |

**UI:**
```
┌─────────────────────────────────────────────────────────────────┐
│  RELEASE v1.2.0 — "Post-Conference Update"                      │
│  Released: January 15, 2026                                      │
├─────────────────────────────────────────────────────────────────┤
│  CHANGES FROM v1.1.0:                                            │
│                                                                  │
│  NEW CLAIMS (3)                                                  │
│  + "Counter-evidence from longitudinal study" [DEFENDED]        │
│  + "Methodological refinement proposed" [UNDER DISCUSSION]      │
│  + "Synthesis of positions A and B" [DEFENDED]                  │
│                                                                  │
│  STATUS CHANGES (2)                                              │
│  ↑ "Original thesis" CONTESTED → DEFENDED (after defense)       │
│  ↓ "Alternative hypothesis" DEFENDED → CONTESTED (new attack)   │
│                                                                  │
│  RESOLVED ISSUES (4)                                             │
│  ✓ "Statistical significance concern" — addressed               │
│  ✓ "Missing citation" — added                                   │
│                                                                  │
│  [Cite This Release] [Export AIF] [View Full State]             │
└─────────────────────────────────────────────────────────────────┘
```

### 2.1.3 Release Citation

| Task | Description | Builds On |
|------|-------------|-----------|
| Citation format | BibTeX/RIS export for releases | Citation export |
| Cite-in-paper | "As of Agora Release v1.2..." | Academic norms |
| DOI integration | Optional DOI minting via DataCite | External API |

---

## Phase 2.2: Fork/Branch/Merge for Deliberations

**Insight:** *"Fork a debate to explore an alternative assumption set, then merge back with provenance."*

### 2.2.1 Deliberation Forking

| Task | Description | Builds On |
|------|-------------|-----------|
| Fork action | Create derivative deliberation | Deliberation model |
| Provenance tracking | Link fork to parent | New relation |
| Assumption scoping | "Under assumption X..." | Scope model |
| Selective import | Choose which claims/arguments to fork | UI for selection |

**Schema:**
```prisma
model Deliberation {
  // Existing fields...
  forkedFromId    String?
  forkedFrom      Deliberation? @relation("DeliberationForks", fields: [forkedFromId], references: [id])
  forks           Deliberation[] @relation("DeliberationForks")
  forkReason      String?       // "Exploring alternative assumption X"
}
```

### 2.2.2 Pull Requests for Arguments

| Task | Description | Builds On |
|------|-------------|-----------|
| Argument PR | Propose argument for inclusion | New model |
| Review workflow | Accept/reject/request changes | PR state machine |
| Downstream impact | Show what breaks if premise changes | ArgumentChain |
| Merge action | Integrate PR into main deliberation | Transaction |

**Schema:**
```prisma
model ArgumentPullRequest {
  id              String   @id @default(cuid())
  deliberationId  String
  deliberation    Deliberation @relation(fields: [deliberationId], references: [id])
  authorId        String
  author          User     @relation(fields: [authorId], references: [id])
  
  title           String
  description     String?  @db.Text
  proposedChanges Json     // What claims/arguments to add/modify
  impactAnalysis  Json?    // What downstream arguments are affected
  
  status          PRStatus @default(OPEN)
  reviewers       User[]   @relation("PRReviewers")
  comments        PRComment[]
  
  createdAt       DateTime @default(now())
  mergedAt        DateTime?
  closedAt        DateTime?
}

enum PRStatus {
  OPEN
  UNDER_REVIEW
  APPROVED
  MERGED
  CLOSED
}
```

### 2.2.3 Maintainers & Governance

| Task | Description | Builds On |
|------|-------------|-----------|
| Maintainer role | Users who can merge PRs | Deliberation.members |
| Governance model | Who can become maintainer | Configurable rules |
| Topic spaces | Curated canonical claim formulations | Tag/category system |
| Merge permissions | Only maintainers can merge | Access control |

---

## Phase 2.3: Quote Nodes as First-Class Objects

**Insight from research:** *"Make Quote a first-class object, not just a field."*

### 2.3.1 Quote Node Model

| Task | Description | Builds On |
|------|-------------|-----------|
| QuoteNode entity | Addressable, discussable quotes | New model |
| Quote interpretations | Multiple readings of same quote | Relation |
| Quote deliberations | "What does this passage mean?" | Mini-deliberations |
| Cross-reference | Same quote used in multiple arguments | Many-to-many |

**Schema:**
```prisma
model QuoteNode {
  id              String   @id @default(cuid())
  sourceId        String
  source          Source   @relation(fields: [sourceId], references: [id])
  
  text            String   @db.Text
  locator         String?  // Page, section, timestamp
  context         String?  @db.Text  // Surrounding text
  
  interpretations QuoteInterpretation[]
  usedInClaims    Claim[]  @relation("ClaimQuotes")
  usedInArguments Argument[] @relation("ArgumentQuotes")
  
  createdById     String
  createdBy       User     @relation(fields: [createdById], references: [id])
  createdAt       DateTime @default(now())
}

model QuoteInterpretation {
  id              String   @id @default(cuid())
  quoteId         String
  quote           QuoteNode @relation(fields: [quoteId], references: [id])
  
  interpretation  String   @db.Text  // "This passage means..."
  framework       String?  // Theoretical framework applied
  
  authorId        String
  author          User     @relation(fields: [authorId], references: [id])
  
  supports        QuoteInterpretation[] @relation("InterpretationSupport")
  challenges      QuoteInterpretation[] @relation("InterpretationChallenge")
  
  createdAt       DateTime @default(now())
}
```

### 2.3.2 Quote Exhibit Threads

| Task | Description | Builds On |
|------|-------------|-----------|
| Quote deliberation | Dedicated discussion for quote interpretation | Deliberation |
| Interpretation voting | Community consensus on readings | Voting model |
| HSS-specific schemes | "Textual evidence → interpretive claim → implication" | Scheme templates |

---

## Phase 2.4: Argument CI (Continuous Integration)

**Insight:** *"Automatic checks before merging into canonical thread."*

### 2.4.1 Argument Linting

| Task | Description | Builds On |
|------|-------------|-----------|
| Missing citation check | Empirical claims need evidence | Citation requirement |
| CQ coverage | Are critical questions addressed? | Scheme CQs |
| Duplicate detection | Same claim phrased differently | Semantic similarity |
| Downstream breakage | What arguments weaken if this changes | ArgumentChain |

**Linter Rules:**
```typescript
interface LinterRule {
  id: string;
  name: string;
  severity: "error" | "warning" | "info";
  check: (argument: Argument) => LintResult;
}

const LINTER_RULES: LinterRule[] = [
  {
    id: "empirical-citation",
    name: "Empirical claims require citations",
    severity: "warning",
    check: (arg) => {
      if (arg.scheme?.category === "EMPIRICAL" && arg.citations.length === 0) {
        return { pass: false, message: "Add citation for empirical claim" };
      }
      return { pass: true };
    },
  },
  {
    id: "cq-coverage",
    name: "Critical questions should be addressed",
    severity: "info",
    check: (arg) => {
      const unanswered = arg.scheme?.criticalQuestions?.filter(
        cq => !arg.cqResponses?.includes(cq.id)
      );
      if (unanswered?.length) {
        return { 
          pass: false, 
          message: `${unanswered.length} critical questions unanswered`,
          details: unanswered,
        };
      }
      return { pass: true };
    },
  },
  // ... more rules
];
```

### 2.4.2 Pre-Merge Checks

| Task | Description | Builds On |
|------|-------------|-----------|
| Run linter on PR | Check before merge | ArgumentPullRequest |
| Block on errors | Prevent merge with errors | Merge workflow |
| Warning display | Show warnings but allow merge | UI feedback |
| Fix suggestions | Auto-suggest fixes | AI assistance |

---

## Phase 2 Deliverables Summary

| Deliverable | Description | User Value |
|-------------|-------------|------------|
| Debate releases | Versioned snapshots with changelog | Citable state of debate |
| Deliberation forking | Explore alternative assumptions | Parallel exploration |
| Argument PRs | Propose changes for review | Quality control |
| Quote nodes | First-class addressable quotes | HSS-native engagement |
| Argument CI | Automatic quality checks | Maintain rigor |

---

# Phase 3: Knowledge Graph — Claim Provenance & Citation Intelligence

**Goal:** Build the "argument graph layer" between papers and metrics.

**Historical Justification:** Citation indexing (1964) transformed discovery by linking papers. Argument-level linking is the next layer.

## Phase 3.1: Claim Provenance Tracking

### 3.1.1 Claim History Model

| Task | Description | Builds On |
|------|-------------|-----------|
| Claim origin tracking | First assertion (paper + date) | Claim.originSource |
| Evolution timeline | Refinements, challenges, status changes | Claim versions |
| Consensus tracking | Current acceptance status | ASPIC+ evaluation |
| Canonical ID | Stable identifier across contexts | Claim.canonicalId |

### 3.1.2 "What Challenges This?" Query

| Task | Description | Builds On |
|------|-------------|-----------|
| Attack query API | Find all attacks on a claim | ClaimEdge |
| Attack type grouping | Group by rebut/undercut/undermine | AttackType |
| Defense tracking | Show defenses against attacks | Argument responses |
| Resolution status | Is the attack resolved? | Attack lifecycle |

**API:**
```typescript
// GET /api/claims/:id/challenges
interface ChallengeResponse {
  claim: Claim;
  challenges: {
    rebuttals: Attack[];     // Challenge the conclusion
    undercuts: Attack[];     // Challenge the inference
    undermines: Attack[];    // Challenge a premise
  };
  defenses: Defense[];       // Responses to challenges
  resolutionStatus: "open" | "defended" | "conceded" | "stalemate";
}
```

## Phase 3.2: Argument-Level Citations

### 3.2.1 Argument Citation Model

| Task | Description | Builds On |
|------|-------------|-----------|
| Cite specific argument | "Smith 2023, Argument 3" | Citation.targetArgumentId |
| Argument permalinks | Stable URIs for arguments | Argument.permalink |
| Citation context | Why is this argument being cited? | Citation.context |
| Export formats | BibTeX/RIS with argument-level resolution | Citation export |

### 3.2.2 Citation Graph Visualization

| Task | Description | Builds On |
|------|-------------|-----------|
| Argument citation network | Visualize who cites which arguments | Graph component |
| Claim dependency graph | Show premise → conclusion chains | ArgumentChain viz |
| Cross-deliberation links | Arguments imported across rooms | RoomFunctor |

---

## Phase 3.3: Cross-Deliberation Claim Mapping

### 3.3.1 Canonical Claim Registry

| Task | Description | Builds On |
|------|-------------|-----------|
| Canonical claim IDs | Same claim across contexts | Claim.canonicalId |
| Claim equivalence | Mark claims as equivalent | ClaimEquivalence |
| Cross-room search | Find claim in other deliberations | Global search |

### 3.3.2 Argument Transport

| Task | Description | Builds On |
|------|-------------|-----------|
| Import argument | Bring argument from other deliberation | RoomFunctor concept |
| Provenance preservation | Track origin on import | Import metadata |
| Adaptation layer | Adjust for new context | User review |

---

# Phase 4: Open Review & Credit — Living Peer Review

**Goal:** Transform peer review from opaque gatekeeping to structured, credited discourse.

**Historical Justification:** Peer review is 350 years old but still opaque. Team science makes granular credit essential.

## Phase 4.1: Public Peer Review Deliberations

### 4.1.1 Review Deliberation Template

| Task | Description | Builds On |
|------|-------------|-----------|
| Review template | Phases: initial review → author response → revision | Template system |
| Reviewer commitments | Public record of reviewer positions | Commitment stores |
| Decision transparency | Visible decision factors | Review outcome model |
| Author response moves | Structured responses to critiques | DialogueMoves |

### 4.1.2 Living Peer Review

**Insight:** *"Review as argument graph; Author response as structured moves; Outcome = exportable claim map."*

| Task | Description | Builds On |
|------|-------------|-----------|
| Review = arguments | Each critique is a typed argument | Argument model |
| Response = moves | Author concedes/defends/revises | DialogueMoves |
| Outcome artifact | "Reviewed claim map" as appendix | Export format |
| Continuous updates | Review continues post-publication | Perpetual deliberation |

## Phase 4.2: Argumentation-Based Reputation

### 4.2.1 Scholar Contribution Metrics

| Task | Description | Builds On |
|------|-------------|-----------|
| Contribution types | Curation/review/synthesis/objection/etc. | Contribution taxonomy |
| Defense success rate | % of claims surviving challenges | Claim status tracking |
| Attack precision | % of attacks leading to concessions | Attack outcomes |
| Downstream usage | Others building on your arguments | Citation tracking |

### 4.2.2 Reviewer Recognition

| Task | Description | Builds On |
|------|-------------|-----------|
| Review portfolio | Public record of review contributions | User profile |
| Review specialties | Inferred from scheme usage | Scheme analysis |
| Review style metrics | Constructive/critical ratio, response time | Behavior analysis |

## Phase 4.3: Academic Credit Integration

### 4.3.1 Contribution Export

| Task | Description | Builds On |
|------|-------------|-----------|
| ORCID works | Push contributions to ORCID | ORCID API |
| CV export | Generate academic CV section | Export format |
| Institutional reporting | Aggregate for annual review | Org dashboard |

---

# Phase 5: Interdisciplinary Bridge — Cross-Field Mapping

**Goal:** Connect epistemic vocabularies across disciplines.

## Phase 5.1: Cross-Field Claim Mapping

| Task | Description | Builds On |
|------|-------------|-----------|
| Concept mapping | "X in field A ≈ Y in field B" | Equivalence model |
| Field tagging | Classify claims by discipline | Taxonomy |
| Cross-field alerts | Notify when similar claims appear in other fields | Semantic matching |

## Phase 5.2: Translation Deliberations

| Task | Description | Builds On |
|------|-------------|-----------|
| Translation space | Dedicated space for term negotiation | Deliberation template |
| Bridge claims | "If A accepts X and B accepts Y, then..." | Claim type |
| Assumption translation | Empirical/normative/interpretive tagging | Claim attributes |

## Phase 5.3: Collaboration Matching

| Task | Description | Builds On |
|------|-------------|-----------|
| Claim similarity matching | Find researchers with similar positions | Semantic matching |
| Complementary attacks | "You attack from empirical, they from conceptual" | Attack pattern analysis |
| Collaboration suggestions | Proactive recommendations | Recommendation engine |

---

# Phase 6: External Presence — Platform Integrations

**Goal:** Agora shows up where scholars already are.

## Phase 6.1: Embeddable Components

| Task | Description | Builds On |
|------|-------------|-----------|
| "Discuss on Agora" badge | Embeddable badge for papers | oEmbed |
| Claim cards | Iframe embeddable claim status | Embed widgets |
| Debate summary embed | Current state of a deliberation | Export format |

## Phase 6.2: Browser Extension

| Task | Description | Builds On |
|------|-------------|-----------|
| DOI detection | Detect papers on any site | Content script |
| Quick claim add | Add claim from any page | Extension popup |
| Existing discussion link | Show if discussion exists | API integration |

## Phase 6.3: Tool Integrations

| Task | Description | Builds On |
|------|-------------|-----------|
| Zotero connector | Import/export with Zotero | Zotero API |
| Hypothesis bridge | Annotations ↔ claims | Hypothesis API |
| Overleaf LaTeX package | `\citeagora{claim-uri}` | LaTeX package |
| Obsidian plugin | Link notes to Agora claims | Plugin development |

## Phase 6.4: LMS Integration

| Task | Description | Builds On |
|------|-------------|-----------|
| Canvas LTI | Embed Agora in Canvas | LTI 1.3 |
| Assignment type | "Agora Discussion" as assignment | LTI grade sync |
| Perusall bridge | Reading annotations → Agora | API integration |

---

# Implementation Priority Matrix

```
                         HIGH IMPACT
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           │  ★ Claim search  │  ★ Paper-to-     │
           │  ★ Related args  │    claim extract │
           │  ★ Journal club  │  ★ Debate        │
           │    template      │    releases      │
           │  ★ Quote nodes   │  ★ Open peer     │
           │                  │    review        │
 LOW EFFORT├──────────────────┼──────────────────┤ HIGH EFFORT
           │                  │                  │
           │  ★ Arg citations │  ★ Cross-field   │
           │  ★ Academic      │    mapping       │
           │    profiles      │  ★ Translation   │
           │  ★ Embed widgets │    deliberations │
           │                  │  ★ Full CI/CD    │
           │                  │                  │
           └──────────────────┼──────────────────┘
                              │
                         LOW IMPACT
```

---

# Success Metrics

| Phase | Key Metric | Target |
|-------|------------|--------|
| 1 | Claims registered per source | 5+ claims per active source |
| 1 | Search → engagement rate | 30% of searches lead to contribution |
| 2 | Releases per deliberation | 1+ release per mature deliberation |
| 2 | Fork utilization | 10% of active deliberations forked |
| 3 | Cross-room claim links | 20% of claims linked across rooms |
| 4 | Review completion rate | 80% of started reviews completed |
| 5 | Cross-field discoveries | 5% of matches lead to collaboration |
| 6 | External embed views | 10K+ monthly badge impressions |

---

# North Star Statement

> **Academic Agora turns the informal networked layer of scholarly conversation into a structured, citable, versioned layer of knowledge production—so debate itself compounds like publications do.**

---

# Appendix: File Structure for Implementation

```
app/
├── api/
│   ├── claims/
│   │   ├── route.ts              # Claim CRUD
│   │   ├── extract/route.ts      # AI extraction
│   │   ├── [id]/
│   │   │   ├── route.ts          # Single claim
│   │   │   └── challenges/route.ts
│   │   └── search/route.ts       # Semantic search
│   ├── deliberations/
│   │   ├── templates/route.ts    # Templates
│   │   ├── [id]/
│   │   │   ├── releases/route.ts # Releases
│   │   │   ├── fork/route.ts     # Forking
│   │   │   └── prs/route.ts      # Pull requests
│   ├── organizations/
│   │   └── route.ts              # Org CRUD
│   ├── quotes/
│   │   └── route.ts              # Quote nodes
│   └── search/
│       └── claims/route.ts       # Claim search
│
components/
├── claims/
│   ├── ClaimExtractionPanel.tsx
│   ├── ClaimTypeSelector.tsx
│   └── RelatedArgumentsPanel.tsx
├── deliberations/
│   ├── TemplateSelector.tsx
│   ├── JournalClubView.tsx
│   ├── ReleasePanel.tsx
│   ├── ForkDialog.tsx
│   └── PRReviewPanel.tsx
├── quotes/
│   ├── QuoteNode.tsx
│   └── InterpretationThread.tsx
├── organizations/
│   ├── OrgProfilePage.tsx
│   └── OrgBadge.tsx
└── profile/
    └── AcademicProfileForm.tsx

lib/
├── claims/
│   ├── extraction.ts             # AI extraction
│   ├── search.ts                 # Semantic search
│   └── provenance.ts             # History tracking
├── deliberations/
│   ├── templates.ts              # Template definitions
│   ├── releases.ts               # Release generation
│   └── fork.ts                   # Fork/merge logic
├── linter/
│   └── argumentLinter.ts         # CI rules
└── integrations/
    ├── orcid.ts                  # ORCID API
    ├── crossref.ts               # DOI resolution
    └── openAlex.ts               # Paper enrichment
```

---

*This roadmap synthesizes requirements from 4 design documents totaling 4000+ lines of strategic specification. Implementation should proceed phase-by-phase with user testing between phases.*
