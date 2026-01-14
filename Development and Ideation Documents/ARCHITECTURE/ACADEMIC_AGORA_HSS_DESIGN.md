# Academic Agora: Humanities & Social Sciences Design Document

## Purpose

This document explores the specific design, user flows, system architecture, and integration requirements for Academic Agora as applied to the humanities and social sciences (HSS). Unlike STEM fields where replication and data sharing are central, HSS discourse is primarily interpretive, textual, and argumentative—making it an ideal initial domain for Mesh's capabilities.

**Key Insight**: Humanities and social sciences are *already* structured around argumentation. The core activity is making claims, marshaling evidence (textual, archival, ethnographic), and responding to other scholars' interpretations. Mesh's architecture maps directly to this practice.

---

## Table of Contents

1. [Why HSS First](#1-why-hss-first)
2. [Disciplinary Landscape](#2-disciplinary-landscape)
3. [Core User Flows](#3-core-user-flows)
4. [System Architecture](#4-system-architecture)
5. [Data Pipeline](#5-data-pipeline)
6. [Integration Ecosystem](#6-integration-ecosystem)
7. [Platform & Tool Integrations](#7-platform--tool-integrations)
8. [HSS-Specific Features](#8-hss-specific-features)
9. [Community Design](#9-community-design)
10. [Pilot Strategy](#10-pilot-strategy)

---

## 1. Why HSS First

### 1.1 Natural Fit

| Characteristic | HSS Reality | Mesh Alignment |
|----------------|-------------|----------------|
| **Core activity** | Interpretation and argument | Argumentation is Mesh's foundation |
| **Evidence type** | Texts, archives, qualitative data | Linkable, quotable, discussable |
| **Validation method** | Peer critique and debate | Structured dialogue is the method |
| **Replication needs** | Low (interpretation, not experiment) | No lab/data infrastructure needed |
| **Publication pace** | Books take years; articles take months | Async dialogue fits timeline |
| **Citation culture** | Dense engagement with prior work | Claim-level linking natural |

### 1.2 Lower Barriers

| STEM Barrier | HSS Advantage |
|--------------|---------------|
| Need to share datasets | Primary sources often public (texts, archives) |
| Need to replicate experiments | Interpretation can be evaluated directly |
| Statistical complexity | Arguments evaluated on reasoning quality |
| Lab resource requirements | Individual scholars can participate fully |
| Rapid obsolescence | Long-form engagement is valued |

### 1.3 Existing Frustrations

HSS scholars report:
- **Slow publication cycles**: Years between submission and response
- **Limited space for debate**: Journals rarely publish responses
- **Scattered discussion**: Blog posts, Twitter threads, conference Q&A
- **No synthesis**: Same debates recur across decades without resolution
- **Invisible reasoning**: Published work shows conclusions, not the path

---

## 2. Disciplinary Landscape

### 2.1 Primary HSS Domains

| Domain | Discourse Characteristics | Key Needs |
|--------|--------------------------|-----------|
| **Philosophy** | Explicit argumentation; formal logic common | Scheme-based reasoning; objection tracking |
| **History** | Archival evidence; interpretive claims | Source linking; competing interpretations |
| **Literary Studies** | Textual interpretation; theoretical frameworks | Quote-level engagement; framework mapping |
| **Political Science** | Empirical and normative claims mixed | Causal arguments; normative schemes |
| **Sociology** | Theory + qualitative/quantitative evidence | Method debates; framework disputes |
| **Anthropology** | Ethnographic evidence; reflexive methods | Contextual claims; positionality |
| **Religious Studies** | Textual, historical, phenomenological | Multi-tradition sources; hermeneutics |
| **Law** | Explicit argumentation; precedent-based | Legal schemes; case linking |
| **Area Studies** | Interdisciplinary; regional expertise | Cross-domain synthesis |
| **Classics** | Philological + interpretive | Ancient source linking; translation debates |

### 2.2 Cross-Cutting Characteristics

**Shared HSS Features**:
- Heavy reliance on textual evidence
- Importance of theoretical frameworks
- Long-form argument (books, not just articles)
- Dense citation practices
- Interpretive pluralism as norm
- Conference culture for real-time exchange
- Book review as discussion format

### 2.3 Existing Discussion Venues

| Venue | Function | Limitation |
|-------|----------|------------|
| **Book reviews** | Single response to major work | One-shot; no dialogue |
| **Response articles** | Published reply to article | Years delay; high bar |
| **Conference Q&A** | Real-time exchange | Ephemeral; unrecorded |
| **Edited volumes** | Collected perspectives | Static after publication |
| **Blogs (e.g., Crooked Timber)** | Informal discussion | Scattered; not citable |
| **Twitter/Bluesky** | Quick takes | Ephemeral; unstructured |
| **H-Net lists** | Email discussion | Linear; hard to search |
| **PhilPapers comments** | Paper-level comments | No structure; sparse use |

---

## 3. Core User Flows

### 3.1 Flow A: Responding to a Published Article

**Scenario**: A political theorist reads an article arguing that "deliberative democracy requires economic equality." They disagree with a key premise and want to respond publicly.

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER FLOW: Article Response                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. DISCOVERY                                                    │
│     ├── User finds article via JSTOR/library/DOI                │
│     ├── Clicks "Discuss on Academic Agora" (browser extension)  │
│     └── OR: Searches Agora for existing discussion              │
│                                                                  │
│  2. ARTICLE LANDING                                              │
│     ├── System fetches metadata (DOI → Crossref/OpenAlex)       │
│     ├── Shows existing claims extracted/registered              │
│     ├── Shows existing discussion threads if any                │
│     └── User can browse or add new engagement                   │
│                                                                  │
│  3. CLAIM SELECTION                                              │
│     ├── User identifies claim to engage: "Premise 3: Economic   │
│     │   equality is necessary for genuine deliberation"         │
│     ├── If claim exists: joins existing thread                  │
│     └── If not: registers new claim (quote + location)          │
│                                                                  │
│  4. MOVE SELECTION                                               │
│     ├── User chooses move type:                                 │
│     │   ○ CHALLENGE (dispute the claim)                         │
│     │   ○ SUPPORT (add supporting argument)                     │
│     │   ○ EXTEND (derive new conclusion)                        │
│     │   ○ CLARIFY (request clarification)                       │
│     └── System prompts for appropriate structure                │
│                                                                  │
│  5. ARGUMENT CONSTRUCTION                                        │
│     ├── User selects scheme: "Argument from Counterexample"     │
│     ├── System provides template:                               │
│     │   "Claim X asserts all A are B.                          │
│     │    Case C is A but not B.                                 │
│     │    Therefore X is false or requires qualification."       │
│     ├── User fills in with specific content                     │
│     ├── User links evidence (other papers, historical cases)    │
│     └── User submits                                            │
│                                                                  │
│  6. PUBLICATION                                                  │
│     ├── Contribution added to public record                     │
│     ├── Original author notified (if on platform)               │
│     ├── Followers of paper/topic notified                       │
│     ├── Contribution gets stable URI                            │
│     └── Commitment store updated (user committed to this claim) │
│                                                                  │
│  7. ONGOING DIALOGUE                                             │
│     ├── Author or others can respond with their own moves       │
│     ├── Thread develops with attack/defense structure           │
│     ├── System tracks resolution status                         │
│     └── Eventually: produces summary artifact                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Flow B: Engaging with a Monograph (Book)

**Scenario**: A historian wants to engage with a major new book in their field, specifically challenging its central thesis.

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER FLOW: Book Engagement                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. BOOK REGISTRATION                                            │
│     ├── User searches by ISBN/title/author                      │
│     ├── If book exists: sees existing discussion                │
│     ├── If not: registers book (metadata from OpenLibrary/OCLC) │
│     └── Book becomes an "Agora space" with structure            │
│                                                                  │
│  2. CLAIM MAPPING                                                │
│     ├── User (or community) extracts key claims:                │
│     │   ○ Central thesis                                        │
│     │   ○ Chapter-level arguments                               │
│     │   ○ Key interpretive moves                                │
│     ├── Claims linked to page numbers/chapters                  │
│     └── Creates navigable "argument map" of the book            │
│                                                                  │
│  3. STRUCTURED ENGAGEMENT                                        │
│     ├── User selects claim to engage                            │
│     ├── Chooses move type and scheme                            │
│     ├── Evidence can include:                                   │
│     │   ○ Other books/articles (linked via DOI/ISBN)            │
│     │   ○ Primary sources (linked via archive/URI)              │
│     │   ○ Passages from the book itself (internal citation)     │
│     └── Contribution published to book's Agora                  │
│                                                                  │
│  4. COMMUNITY REVIEW                                             │
│     ├── Functions like distributed book review                  │
│     ├── Multiple scholars can engage different claims           │
│     ├── Author can respond to specific challenges               │
│     └── Over time: comprehensive critical engagement emerges    │
│                                                                  │
│  5. SYNTHESIS                                                    │
│     ├── System can generate "Discussion Summary"                │
│     ├── Shows: defended claims, challenged claims, open issues  │
│     └── Becomes citable artifact ("Smith 2024, as discussed     │
│         in Academic Agora [URI]")                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Flow C: Cross-Work Synthesis

**Scenario**: A comparative literature scholar sees connections between arguments made in three different papers about postcolonial theory and wants to synthesize them.

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER FLOW: Synthesis                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. WORKSPACE CREATION                                           │
│     ├── User creates new "Synthesis Project"                    │
│     ├── Names the inquiry: "Comparing approaches to             │
│     │   colonial epistemology in Spivak, Mignolo, Mbembe"       │
│     └── Project becomes a dedicated Agora space                 │
│                                                                  │
│  2. CLAIM COLLECTION                                             │
│     ├── User imports claims from three papers:                  │
│     │   ○ Spivak on subaltern knowledge                         │
│     │   ○ Mignolo on epistemic delinking                        │
│     │   ○ Mbembe on necropolitics and knowledge                 │
│     ├── Claims retain link to source                            │
│     └── All three visible in synthesis workspace                │
│                                                                  │
│  3. RELATIONSHIP MAPPING                                         │
│     ├── User creates relationships between claims:              │
│     │   ○ "Mignolo's X agrees with Spivak's Y"                  │
│     │   ○ "Mbembe's Z challenges both on grounds W"             │
│     ├── Relationship types: SUPPORTS, CONTRADICTS, EXTENDS,     │
│     │   PARALLELS, QUALIFIES                                    │
│     └── Visual graph shows cross-work structure                 │
│                                                                  │
│  4. ORIGINAL CONTRIBUTION                                        │
│     ├── User adds their own synthetic claim:                    │
│     │   "Despite apparent differences, all three share          │
│     │    assumption A, which can be questioned on grounds B"    │
│     ├── Links to all three sources plus new evidence            │
│     └── Constructs argument using appropriate scheme            │
│                                                                  │
│  5. PUBLICATION                                                  │
│     ├── Synthesis published as standalone artifact              │
│     ├── Appears in each source paper's discussion               │
│     ├── Citable as original scholarly contribution              │
│     └── Others can respond, extend, challenge                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Flow D: Seminar/Course Integration

**Scenario**: A professor teaching a graduate seminar wants students to engage with course readings using structured argumentation.

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER FLOW: Seminar Integration               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. COURSE SPACE CREATION                                        │
│     ├── Instructor creates private Agora space for course       │
│     ├── Links to syllabus readings (DOIs, ISBNs)                │
│     ├── Sets visibility: Course-only OR public                  │
│     └── Invites enrolled students                               │
│                                                                  │
│  2. WEEKLY ENGAGEMENT                                            │
│     ├── For each reading, instructor may:                       │
│     │   ○ Pre-extract key claims for discussion                 │
│     │   ○ Pose guiding questions as Issues                      │
│     │   ○ Require students to make N contributions              │
│     └── Students engage asynchronously before class             │
│                                                                  │
│  3. STUDENT CONTRIBUTIONS                                        │
│     ├── Each student must:                                      │
│     │   ○ Identify a claim and take a position                  │
│     │   ○ Use appropriate scheme for their argument             │
│     │   ○ Respond to at least one peer's contribution           │
│     ├── Contributions visible to classmates                     │
│     └── Builds discussion before synchronous meeting            │
│                                                                  │
│  4. IN-CLASS USE                                                 │
│     ├── Instructor projects Agora discussion                    │
│     ├── Uses as springboard for live discussion                 │
│     ├── Can add live contributions during class                 │
│     └── Post-class: students can continue online                │
│                                                                  │
│  5. ASSESSMENT                                                   │
│     ├── Instructor can see contribution quality/quantity        │
│     ├── Commitment stores show student positions over time      │
│     ├── Can evaluate argumentation quality, not just volume     │
│     └── End-of-term: students may write paper building on       │
│         their Agora contributions                               │
│                                                                  │
│  6. OPTIONAL: PUBLICATION                                        │
│     ├── Best discussions can be made public                     │
│     ├── Students get citable contributions                      │
│     └── Builds portfolio of scholarly engagement                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.5 Flow E: Conference Extension

**Scenario**: A conference wants to extend panel discussions beyond the 15-minute Q&A.

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER FLOW: Conference Extension              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. PRE-CONFERENCE                                               │
│     ├── Presenters upload papers/abstracts                      │
│     ├── Key claims extracted                                    │
│     ├── Attendees can pre-submit questions as Issues            │
│     └── Presenters can respond before panel                     │
│                                                                  │
│  2. DURING CONFERENCE                                            │
│     ├── Live attendees can add quick contributions              │
│     ├── Questions that don't get answered live: captured        │
│     ├── Remote attendees can participate equally                │
│     └── Discussion continues between panels                     │
│                                                                  │
│  3. POST-CONFERENCE                                              │
│     ├── All panel discussions have persistent home              │
│     ├── Presenters respond to unaddressed questions             │
│     ├── Non-attendees can join discussion                       │
│     └── "Conference proceedings" become living discussions      │
│                                                                  │
│  4. LONG-TERM                                                    │
│     ├── Multi-year conferences build cumulative discourse       │
│     ├── Debates evolve across annual meetings                   │
│     ├── Newcomers can see history of field debates              │
│     └── Produces genuine disciplinary memory                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ACADEMIC AGORA ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         PRESENTATION LAYER                           │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  Web App    │  Browser Extension  │  Mobile App  │  API Consumers   │    │
│  │  (Next.js)  │  (Chrome/Firefox)   │  (React Nat) │  (Zotero, etc)   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                          APPLICATION LAYER                           │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │                                                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │   Identity   │  │   Source     │  │  Discourse   │               │    │
│  │  │   Service    │  │   Service    │  │   Service    │               │    │
│  │  │              │  │              │  │              │               │    │
│  │  │ • ORCID Auth │  │ • DOI Lookup │  │ • Claims     │               │    │
│  │  │ • Inst. SSO  │  │ • ISBN Res.  │  │ • Arguments  │               │    │
│  │  │ • Profiles   │  │ • PDF Link   │  │ • Moves      │               │    │
│  │  │ • Reputation │  │ • Metadata   │  │ • Schemes    │               │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │    │
│  │                                                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │  Evaluation  │  │   Artifact   │  │ Notification │               │    │
│  │  │   Service    │  │   Service    │  │   Service    │               │    │
│  │  │              │  │              │  │              │               │    │
│  │  │ • ASPIC+     │  │ • Thesis Gen │  │ • Email      │               │    │
│  │  │ • Accept.    │  │ • KB Pages   │  │ • In-app     │               │    │
│  │  │ • CQ Gen     │  │ • Export     │  │ • Digest     │               │    │
│  │  │ • Scoring    │  │ • Citation   │  │ • Webhooks   │               │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                            DATA LAYER                                │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │                                                                      │    │
│  │  ┌──────────────────────┐    ┌──────────────────────┐               │    │
│  │  │   PostgreSQL/Prisma  │    │      Supabase        │               │    │
│  │  │                      │    │                      │               │    │
│  │  │  • Claims            │    │  • Real-time sync    │               │    │
│  │  │  • Arguments         │    │  • Auth              │               │    │
│  │  │  • Chains            │    │  • Storage           │               │    │
│  │  │  • Commitments       │    │                      │               │    │
│  │  │  • Users             │    │                      │               │    │
│  │  └──────────────────────┘    └──────────────────────┘               │    │
│  │                                                                      │    │
│  │  ┌──────────────────────┐    ┌──────────────────────┐               │    │
│  │  │       Redis          │    │      Pinecone        │               │    │
│  │  │                      │    │                      │               │    │
│  │  │  • Caching           │    │  • Semantic search   │               │    │
│  │  │  • Queue (BullMQ)    │    │  • Claim similarity  │               │    │
│  │  │  • Sessions          │    │  • Recommendations   │               │    │
│  │  └──────────────────────┘    └──────────────────────┘               │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        INTEGRATION LAYER                             │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │                                                                      │    │
│  │  Crossref │ OpenAlex │ ORCID │ Zotero │ Hypothesis │ Internet       │    │
│  │   (DOI)   │ (Papers) │(Auth) │ (Refs) │  (Annot)   │ Archive        │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Pipeline

### 5.1 Source Ingestion Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SOURCE INGESTION PIPELINE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   INPUT     │    │  RESOLVER   │    │  ENRICHER   │    │   STORAGE   │  │
│  │   SOURCES   │───▶│   SERVICE   │───▶│   SERVICE   │───▶│   LAYER     │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│                                                                              │
│  Input Types:        Resolution:         Enrichment:        Storage:        │
│  • DOI               • Crossref API      • Abstract         • PostgreSQL    │
│  • ISBN              • OpenAlex          • Keywords         • Pinecone      │
│  • URL               • OCLC/WorldCat     • Citations        • (embeddings)  │
│  • arXiv ID          • Google Books      • Author data      • S3 (PDFs)     │
│  • JSTOR stable      • HathiTrust        • Related works                    │
│  • Manual entry      • Internet Archive                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Claim Extraction Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLAIM EXTRACTION PIPELINE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                         ┌─────────────────────┐                             │
│                         │    SOURCE DOCUMENT   │                             │
│                         │    (PDF/HTML/Text)   │                             │
│                         └──────────┬──────────┘                             │
│                                    │                                         │
│                    ┌───────────────┼───────────────┐                        │
│                    ▼               ▼               ▼                        │
│           ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│           │    MANUAL    │ │  AI-ASSISTED │ │   IMPORTED   │               │
│           │  EXTRACTION  │ │  EXTRACTION  │ │    (APIs)    │               │
│           └──────────────┘ └──────────────┘ └──────────────┘               │
│                    │               │               │                        │
│                    └───────────────┼───────────────┘                        │
│                                    ▼                                         │
│                         ┌─────────────────────┐                             │
│                         │   CLAIM CANDIDATES   │                             │
│                         │                      │                             │
│                         │  • Text content      │                             │
│                         │  • Source location   │                             │
│                         │  • Claim type guess  │                             │
│                         │  • Confidence score  │                             │
│                         └──────────┬──────────┘                             │
│                                    │                                         │
│                                    ▼                                         │
│                         ┌─────────────────────┐                             │
│                         │   HUMAN REVIEW      │                             │
│                         │                      │                             │
│                         │  • Confirm/reject   │                             │
│                         │  • Edit wording     │                             │
│                         │  • Classify type    │                             │
│                         │  • Link to context  │                             │
│                         └──────────┬──────────┘                             │
│                                    │                                         │
│                                    ▼                                         │
│                         ┌─────────────────────┐                             │
│                         │   REGISTERED CLAIM   │                             │
│                         │                      │                             │
│                         │  • Stable URI       │                             │
│                         │  • Source link      │                             │
│                         │  • Claim type       │                             │
│                         │  • Ready for disc.  │                             │
│                         └─────────────────────┘                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Claim Types for HSS

| Claim Type | Description | Example |
|------------|-------------|---------|
| **Thesis** | Central argument of a work | "Foucault's conception of power is fundamentally relational" |
| **Interpretive** | Reading of a text/event | "In this passage, Kant means X by 'transcendental'" |
| **Historical** | Factual claim about the past | "The 1848 revolutions were driven by X" |
| **Conceptual** | Definition or analysis of concept | "Democracy requires more than majority rule" |
| **Normative** | Evaluative or prescriptive claim | "We ought to prioritize X over Y" |
| **Methodological** | Claim about how to study | "Ethnographic methods are essential for understanding X" |
| **Comparative** | Claim relating two things | "Rawls and Nozick share assumption X despite disagreements" |
| **Causal** | Claim about causation | "Economic factors caused the decline of X" |
| **Meta-level** | Claim about the field/debate | "Previous scholarship has neglected X" |

### 5.4 Discourse Flow Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DISCOURSE FLOW PIPELINE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │  USER   │    │  MOVE   │    │ SCHEME  │    │  GRAPH  │    │  EVAL   │  │
│  │  INPUT  │───▶│ PARSING │───▶│ BINDING │───▶│ UPDATE  │───▶│ UPDATE  │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│                                                                              │
│  User Input:     Move Parse:     Scheme Bind:    Graph Update:  Eval:       │
│  • Raw text      • Move type     • Match scheme  • Add node     • ASPIC+    │
│  • Target claim  • Target ref    • Extract CQs   • Add edges    • Accept.   │
│  • Intent signal • Evidence      • Validate      • Update chain • Status    │
│  • Citations     • Commit type   • Store         • Notify       • Score     │
│                                                                              │
│                                     │                                        │
│                                     ▼                                        │
│                         ┌─────────────────────┐                             │
│                         │   ARTIFACT GEN      │                             │
│                         │                      │                             │
│                         │  • Update KB page   │                             │
│                         │  • Regen summaries  │                             │
│                         │  • Export updates   │                             │
│                         └─────────────────────┘                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Integration Ecosystem

### 6.1 Integration Categories

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INTEGRATION ECOSYSTEM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     IDENTITY & AUTHENTICATION                        │   │
│   │   ORCID │ InCommon/Shibboleth │ Google Scholar │ Institutional SSO  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     BIBLIOGRAPHIC METADATA                           │   │
│   │   Crossref │ OpenAlex │ Semantic Scholar │ OCLC │ Google Books      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     CONTENT SOURCES                                  │   │
│   │   JSTOR │ Project MUSE │ PhilPapers │ SSRN │ HathiTrust │ arXiv     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     REFERENCE MANAGEMENT                             │   │
│   │   Zotero │ Mendeley │ EndNote │ BibDesk │ Papers │ Paperpile        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     ANNOTATION & READING                             │   │
│   │   Hypothesis │ Zotero PDF Reader │ Adobe Acrobat │ MarginNote       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     WRITING & COLLABORATION                          │   │
│   │   Overleaf │ Google Docs │ Scrivener │ Word │ Notion │ Obsidian     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     DISCOVERY & SEARCH                               │   │
│   │   Google Scholar │ Semantic Scholar │ PhilPapers │ Connected Papers │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     LEARNING MANAGEMENT                              │   │
│   │   Canvas │ Blackboard │ Moodle │ Brightspace │ Perusall             │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     ARCHIVES & PRIMARY SOURCES                       │   │
│   │   Internet Archive │ HathiTrust │ DPLA │ Europeana │ Gallica        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Platform & Tool Integrations

### 7.1 Reference Manager Integrations

#### 7.1.1 Zotero Integration

| Integration Point | Direction | Implementation | Value |
|-------------------|-----------|----------------|-------|
| **Import from Zotero** | Zotero → Agora | Zotero Connector plugin | Add papers from library to Agora |
| **Export to Zotero** | Agora → Zotero | BibTeX/RIS export | Save Agora discussions as Zotero items |
| **Sync annotations** | Bidirectional | Zotero API | Annotations become potential claims |
| **One-click discuss** | Zotero → Agora | Context menu action | "Discuss in Agora" from Zotero |
| **Claim → annotation** | Agora → Zotero | PDF annotation sync | Registered claims appear in PDF |

**Technical Implementation**:
```
Zotero Plugin Architecture:
├── zotero-agora-connector/
│   ├── bootstrap.js          # Plugin initialization
│   ├── content/
│   │   ├── overlay.xul       # UI overlay
│   │   └── agora.js          # Core logic
│   ├── resource/
│   │   └── api.js            # Agora API client
│   └── install.rdf           # Plugin manifest
```

**User Flow**:
1. User right-clicks paper in Zotero
2. Selects "Discuss in Academic Agora"
3. Plugin opens Agora with paper pre-loaded
4. Paper metadata auto-filled from Zotero
5. User proceeds to claim selection/creation

#### 7.1.2 Mendeley Integration

| Integration Point | Implementation | Value |
|-------------------|----------------|-------|
| **OAuth connection** | Mendeley OAuth 2.0 | Access user library |
| **Library sync** | Periodic pull | Keep Agora aware of user's reading |
| **Annotation import** | Mendeley API | User notes become claim candidates |
| **Group libraries** | Mendeley Groups API | Shared libraries map to Agora spaces |

### 7.2 Browser Extension

#### 7.2.1 Core Features

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BROWSER EXTENSION FEATURES                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     PAGE DETECTION                                   │   │
│  │                                                                      │   │
│  │  • Detect academic paper (JSTOR, journal sites, PDFs)               │   │
│  │  • Extract DOI/ISBN from page metadata                               │   │
│  │  • Show indicator badge if paper has Agora discussion               │   │
│  │  • Inject "Discuss" button on supported sites                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     SIDEBAR PANEL                                    │   │
│  │                                                                      │   │
│  │  • Show existing claims for current paper                           │   │
│  │  • Show existing discussion threads                                 │   │
│  │  • Quick-add claim from selected text                               │   │
│  │  • Quick-respond to existing claim                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     TEXT SELECTION                                   │   │
│  │                                                                      │   │
│  │  • Select text on page → popup with options:                        │   │
│  │    ○ "Register as claim"                                            │   │
│  │    ○ "Challenge this"                                               │   │
│  │    ○ "Support with evidence"                                        │   │
│  │    ○ "Add to synthesis"                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     PDF INTEGRATION                                  │   │
│  │                                                                      │   │
│  │  • Detect when viewing PDF                                          │   │
│  │  • Extract text selection from PDF                                  │   │
│  │  • Record page number for citation                                  │   │
│  │  • Sync with Hypothesis if installed                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 7.2.2 Supported Sites (Priority)

| Site Category | Examples | Detection Method |
|---------------|----------|------------------|
| **Journal platforms** | JSTOR, Project MUSE, Taylor & Francis | DOI meta tag |
| **Preprint servers** | SSRN, PhilArchive, OSF Preprints | URL pattern |
| **Open access** | DOAJ, OpenEdition, Érudit | DOI/OAI |
| **Book platforms** | Google Books, HathiTrust | ISBN detection |
| **Institutional repos** | DSpace, EPrints sites | URL pattern |
| **PDFs** | Any PDF in browser | Content type |

### 7.3 Hypothesis Integration

| Integration Type | Description | Implementation |
|------------------|-------------|----------------|
| **Annotation import** | Pull user's Hypothesis annotations | Hypothesis API |
| **Claim sync** | Registered claims appear as Hypothesis annotations | Hypothesis Publisher API |
| **Bidirectional linking** | Click annotation → Agora; click claim → page | Deep linking |
| **Group sharing** | Hypothesis groups map to Agora spaces | Group API |

**User Flow**:
```
1. User annotates paper in Hypothesis
2. Annotation syncs to Agora as "claim candidate"
3. User can "promote" annotation to registered claim
4. Registered claim appears back in Hypothesis with Agora link
5. Others see the claim when viewing same paper
```

### 7.4 Writing Tool Integrations

#### 7.4.1 Overleaf Integration

| Feature | Implementation | Value |
|---------|----------------|-------|
| **Cite Agora discussions** | LaTeX package + API | `\citeagora{claim-uri}` |
| **Import claims** | Overleaf plugin | Paste claim with proper citation |
| **Export to Agora** | Overleaf extension | Submit draft claims from paper |

**LaTeX Package**:
```latex
% agora.sty
\newcommand{\citeagora}[1]{%
  \href{https://agora.mesh.io/claim/#1}{[Agora:#1]}%
}

\newcommand{\agoraclaim}[2]{%
  \begin{quote}
    #2 \citeagora{#1}
  \end{quote}
}
```

#### 7.4.2 Obsidian Integration

| Feature | Implementation | Value |
|---------|----------------|-------|
| **Claim linking** | Obsidian plugin | Link notes to Agora claims |
| **Sync reading notes** | Plugin + API | Notes become claim candidates |
| **Argument graphs** | Canvas integration | Visualize Agora structures |
| **Export synthesis** | Plugin action | Publish note as Agora synthesis |

**Plugin Features**:
```
Obsidian Agora Plugin:
├── Agora Link syntax: [[agora:claim-uri]]
├── Claim embed: ![[agora:claim-uri]]
├── Quick add: Cmd+Shift+A → Add to Agora
├── Sync status: See which notes are synced
└── Argument view: Visualize connected claims
```

#### 7.4.3 Scrivener Integration

| Feature | Implementation | Value |
|---------|----------------|-------|
| **Research folder sync** | Scrivener extension | Import Agora discussions |
| **Draft to Agora** | Export action | Submit argument for feedback |
| **Citation manager** | Scrivener sync | Agora claims in bibliography |

### 7.5 LMS Integrations

#### 7.5.1 Canvas Integration

| Feature | Implementation | Value |
|---------|----------------|-------|
| **LTI integration** | LTI 1.3 | Embed Agora in Canvas |
| **Assignment type** | Canvas assignment | "Agora Discussion" assignment |
| **Gradebook sync** | Canvas API | Contribution metrics → grades |
| **Reading links** | Deep linking | Link readings to Agora discussions |

**Assignment Configuration**:
```yaml
canvas_agora_assignment:
  type: agora_discussion
  settings:
    source_paper: doi:10.1000/example
    required_contributions: 3
    required_responses: 2
    scheme_requirement: true
    due_date: 2025-12-15
    visibility: course_only
  grading:
    rubric: argumentation_quality
    auto_score: contribution_metrics
    manual_review: required
```

#### 7.5.2 Perusall Integration

| Feature | Implementation | Value |
|---------|----------------|-------|
| **Annotation sync** | Perusall API | Perusall annotations → Agora |
| **Discussion bridge** | LTI | Link Perusall reading to Agora discussion |
| **Metrics sync** | API | Combined engagement metrics |

### 7.6 Discovery Platform Integrations

#### 7.6.1 Semantic Scholar

| Integration | Direction | Value |
|-------------|-----------|-------|
| **Paper metadata** | SS → Agora | Auto-fill paper details |
| **Citation graph** | SS → Agora | Show related papers |
| **TLDR summaries** | SS → Agora | AI summaries as context |
| **Agora badge** | Agora → SS | Show discussion indicator |

#### 7.6.2 Connected Papers

| Integration | Direction | Value |
|-------------|-----------|-------|
| **Graph embed** | CP → Agora | Visual citation context |
| **Discussion links** | Agora → CP | Click node → Agora discussion |

#### 7.6.3 PhilPapers (Philosophy-specific)

| Integration | Direction | Value |
|-------------|-----------|-------|
| **Category mapping** | PP → Agora | Philosophy taxonomy |
| **Author profiles** | PP ↔ Agora | Linked scholarly identity |
| **Bibliography sync** | Bidirectional | Shared reference data |
| **Discussion hosting** | Partnership | PhilPapers → Agora for discussion |

### 7.7 Archive Integrations

#### 7.7.1 Internet Archive

| Feature | Implementation | Value |
|---------|----------------|-------|
| **Wayback links** | IA API | Permanent source links |
| **Full-text access** | IA lending | Access to discussed books |
| **Archive embedding** | BookReader | Read sources in Agora |

#### 7.7.2 HathiTrust

| Feature | Implementation | Value |
|---------|----------------|-------|
| **Book access** | HT API | Access public domain texts |
| **Page-level linking** | HT URIs | Link claims to specific pages |
| **Full-text search** | HT search API | Find passages across corpus |

#### 7.7.3 Primary Source Archives

| Archive | Integration Potential | HSS Value |
|---------|----------------------|-----------|
| **DPLA** | API access to digital collections | American history sources |
| **Europeana** | European cultural heritage | European studies |
| **Gallica (BnF)** | French national library | French literature/history |
| **Perseus Digital Library** | Classical texts | Classics, ancient philosophy |
| **EEBO/ECCO** | Early modern texts | Early modern studies |

---

## 8. HSS-Specific Features

### 8.1 Interpretive Argument Schemes

HSS reasoning differs fundamentally from STEM argumentation. The platform must support argument patterns native to humanistic inquiry.

#### 8.1.1 Hermeneutic Schemes

```
┌─────────────────────────────────────────────────────────────────┐
│                    HERMENEUTIC ARGUMENT TYPES                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TEXTUAL INTERPRETATION                                         │
│  ├─ Philological: "The Greek term X here means..."             │
│  ├─ Contextual: "Given the historical context..."              │
│  ├─ Intertextual: "This passage echoes..."                     │
│  └─ Authorial Intent: "The author here is responding to..."    │
│                                                                 │
│  CONCEPTUAL ANALYSIS                                            │
│  ├─ Definition: "By X, we should understand..."                │
│  ├─ Distinction: "X and Y differ in that..."                   │
│  ├─ Genealogy: "The concept of X emerged from..."              │
│  └─ Reconstruction: "The underlying argument is..."            │
│                                                                 │
│  COMPARATIVE INTERPRETATION                                     │
│  ├─ Parallel: "Similar to X's treatment of..."                 │
│  ├─ Contrast: "Unlike X, Y argues that..."                     │
│  ├─ Synthesis: "Combining X and Y yields..."                   │
│  └─ Dialectical: "X overcomes the limitations of Y by..."      │
│                                                                 │
│  CRITICAL READING                                               │
│  ├─ Symptomatic: "What the text doesn't say reveals..."        │
│  ├─ Deconstructive: "The text undermines itself when..."       │
│  ├─ Ideological: "This position serves to..."                  │
│  └─ Genealogical: "This discourse emerged to..."               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 8.1.2 Historical Argument Schemes

| Scheme Type | Structure | Example |
|-------------|-----------|---------|
| **Causal** | Event X led to Y because... | "The grain crisis precipitated revolt because..." |
| **Counterfactual** | Without X, Y would not have... | "Without the Reformation, the Thirty Years War..." |
| **Analogical** | X is like Y in relevant respects | "The fall of the Soviet Union parallels..." |
| **Periodization** | X marks transition because... | "1789 marks rupture because..." |
| **Revisionist** | Received view of X is wrong because... | "Contrary to the standard account..." |
| **Source-Critical** | Source S shows X because... | "The parish records indicate..." |

#### 8.1.3 Literary-Critical Schemes

| Scheme Type | Structure | Example |
|-------------|-----------|---------|
| **Formal** | The structure of X produces effect Y | "The sonnet's volta creates..." |
| **Generic** | X belongs to/subverts genre Y | "The novel queers the bildungsroman by..." |
| **Intertextual** | X alludes to/revises Y | "Woolf's response to Joyce..." |
| **Thematic** | X instantiates/complicates theme Y | "The garden trope signifies..." |
| **Contextual** | X must be read against Y | "Given Reconstruction politics..." |
| **Reception** | X was read as Y because... | "Victorian readers understood this as..." |

### 8.2 Quotation and Passage Handling

HSS argumentation is deeply textual. The platform must handle quoted material sophisticatedly.

#### 8.2.1 Passage Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      PASSAGE OBJECT MODEL                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Passage                                                        │
│  ├─ source_work: Work                                          │
│  ├─ location: Location                                         │
│  │   ├─ page_numbers?: string                                  │
│  │   ├─ line_numbers?: string                                  │
│  │   ├─ paragraph?: number                                     │
│  │   ├─ chapter/section?: string                               │
│  │   └─ standard_reference?: string (e.g., "Stephanus 514a")   │
│  │                                                              │
│  ├─ text_versions: TextVersion[]                               │
│  │   ├─ language: string                                       │
│  │   ├─ edition: Edition                                       │
│  │   ├─ text: string                                           │
│  │   └─ is_original: boolean                                   │
│  │                                                              │
│  ├─ editorial_marks: EditorialMark[]                           │
│  │   ├─ ellipsis: { start: number, end: number }              │
│  │   ├─ insertion: { position: number, text: string }         │
│  │   └─ emphasis: { start: number, end: number, type: string } │
│  │                                                              │
│  └─ claims_referencing: Claim[]                                │
│      └─ claim_role: "evidence" | "target" | "context"          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 8.2.2 Translation Handling

```
┌─────────────────────────────────────────────────────────────────┐
│                   MULTI-LANGUAGE PASSAGE VIEW                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ORIGINAL (Greek)                                          │ │
│  │ "πάντες ἄνθρωποι τοῦ εἰδέναι ὀρέγονται φύσει"           │ │
│  │ — Aristotle, Metaphysics 980a21                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                           ↓                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ TRANSLATION A (Ross 1924)                                 │ │
│  │ "All men by nature desire to know"                        │ │
│  │ [Standard/canonical translation]                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                           ↓                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ TRANSLATION B (Sachs 1999)                                │ │
│  │ "All human beings by nature stretch themselves out        │ │
│  │  toward knowing"                                          │ │
│  │ [Emphasizes active reaching; contested interpretation]    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                           ↓                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ TRANSLATION DEBATE                                        │ │
│  │ Claim: "Sachs's translation better captures ὀρέγονται     │ │
│  │ because..." [Links to discourse thread]                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Theoretical Framework Mapping

HSS scholars work within theoretical traditions. The platform should make these frameworks explicit and navigable.

#### 8.3.1 Framework Ontology

```
┌─────────────────────────────────────────────────────────────────┐
│                    THEORETICAL FRAMEWORK MAP                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Framework                                                      │
│  ├─ name: string                                               │
│  ├─ key_figures: Thinker[]                                     │
│  ├─ foundational_texts: Work[]                                 │
│  ├─ core_concepts: Concept[]                                   │
│  ├─ methodological_commitments: string[]                       │
│  ├─ relations_to_other_frameworks: FrameworkRelation[]         │
│  │   ├─ extends: Framework[]                                   │
│  │   ├─ opposes: Framework[]                                   │
│  │   ├─ synthesizes: Framework[]                               │
│  │   └─ revises: Framework[]                                   │
│  └─ applications: Application[]                                │
│      ├─ domain: string                                         │
│      └─ exemplary_works: Work[]                                │
│                                                                 │
│  EXAMPLE: Post-structuralism                                   │
│  ├─ key_figures: [Derrida, Foucault, Deleuze, Barthes]        │
│  ├─ foundational_texts: [Of Grammatology, The Order of Things] │
│  ├─ core_concepts: [différance, discourse, rhizome, death of   │
│  │                  author]                                    │
│  ├─ methodological_commitments:                                │
│  │   - Critique of presence/essence                            │
│  │   - Attention to language/textuality                        │
│  │   - Genealogical/archaeological method                      │
│  ├─ relations:                                                 │
│  │   - extends: Structuralism                                  │
│  │   - opposes: Phenomenology (contested), Marxism (partly)   │
│  │   - synthesizes: Nietzsche + Heidegger + Saussure          │
│  └─ applications: Literary criticism, Cultural studies,        │
│                   History, Political theory                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 8.3.2 Framework-Aware Discourse

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Framework tagging** | Claims tagged with theoretical orientation | Dropdown/autocomplete from framework ontology |
| **Incommensurability awareness** | Flag when debaters operate from incompatible frameworks | Detect framework mismatch; suggest meta-level discussion |
| **Translation between frameworks** | Facilitate cross-framework dialogue | Template for "In framework X terms, this claim would be..." |
| **Framework genealogy** | Show intellectual lineage | Graph visualization of framework relations |
| **Internal critique vs. external critique** | Distinguish immanent from transcendent criticism | Tag attacks as "internal" or "external" |

### 8.4 Long-Form Argument Support

HSS scholarship often involves extended, book-length arguments. The platform must handle scale.

#### 8.4.1 Monograph Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONOGRAPH ARGUMENT MAP                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BOOK: "The Structural Transformation of the Public Sphere"    │
│  ├─ THESIS: The bourgeois public sphere emerged in the 18th    │
│  │          century and has since been structurally transformed │
│  │          by mass media and consumer capitalism              │
│  │                                                              │
│  ├─ CHAPTER 1: Genesis of the Bourgeois Public Sphere          │
│  │   ├─ Sub-thesis 1.1: Separation of public/private           │
│  │   ├─ Sub-thesis 1.2: Role of coffee houses, salons          │
│  │   └─ Evidence: Historical sources on 18th c. sociability    │
│  │                                                              │
│  ├─ CHAPTER 2: Structures of the Public Sphere                 │
│  │   ├─ Sub-thesis 2.1: Ideal of rational-critical debate      │
│  │   ├─ Sub-thesis 2.2: Access as property-based               │
│  │   └─ Tension: Ideal vs. actual exclusions                   │
│  │                                                              │
│  ├─ CHAPTER 3: Political Functions                             │
│  │   └─ [Structure continues...]                               │
│  │                                                              │
│  └─ RESPONSES                                                   │
│      ├─ Nancy Fraser: "Rethinking the Public Sphere" (1990)    │
│      │   └─ Challenge: Exclusion of subaltern counterpublics   │
│      ├─ Michael Warner: Publics and Counterpublics (2002)      │
│      │   └─ Extension: Stranger sociability                    │
│      └─ [Additional responses mapped...]                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 8.4.2 Argument Archaeology

| Feature | Description | Value |
|---------|-------------|-------|
| **Nested claim structures** | Multi-level argument decomposition | Navigate complex argumentation |
| **Argument reconstruction** | Formalize implicit reasoning | Make tacit moves explicit |
| **Dialectical mapping** | Track argument evolution across works | See how debates develop |
| **Critical lineage** | Map responses, revisions, extensions | Understand intellectual history |
| **Collaborative reconstruction** | Multiple scholars contribute to mapping | Crowdsource argument analysis |

### 8.5 Disciplinary-Specific Vocabularies

Each HSS field has specialized terminology requiring tailored support.

#### 8.5.1 Discipline Modules

| Discipline | Key Vocabularies | Special Features |
|------------|------------------|------------------|
| **Philosophy** | Technical terms (a priori, phenomenological reduction, etc.) | Integration with PhilPapers taxonomy |
| **History** | Periodization terms, historiographical concepts | Timeline integration, source typing |
| **Literary Studies** | Generic terms, formal vocabulary, theoretical terminology | Integration with MLA bibliography |
| **Political Theory** | Concepts of power, legitimacy, justice | Connection to normative vs. empirical |
| **Sociology** | Theoretical frameworks (Weber, Durkheim, Bourdieu) | Mixed-methods awareness |
| **Anthropology** | Ethnographic concepts, kinship terms | Fieldwork context handling |
| **Religious Studies** | Comparative religion terminology | Multi-tradition sensitivity |
| **Art History** | Period styles, formal analysis vocabulary | Image integration |

---

## 9. Community Design

### 9.1 Academic Norms and Moderation

Academic discourse requires distinctive norms that balance rigor with openness.

#### 9.1.1 Norm Framework

```
┌─────────────────────────────────────────────────────────────────┐
│                   ACADEMIC DISCOURSE NORMS                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  EPISTEMIC NORMS                                                │
│  ├─ Claim substantiation required                              │
│  │   └─ Claims must link to sources or reasoning               │
│  ├─ Good faith interpretation                                  │
│  │   └─ Principle of charity in reconstruction                 │
│  ├─ Acknowledge uncertainty                                    │
│  │   └─ Distinguish strong claims from tentative ones          │
│  └─ Engage with strongest version                              │
│      └─ Address steel-man, not straw-man                       │
│                                                                 │
│  DISCURSIVE NORMS                                               │
│  ├─ Professional tone                                          │
│  │   └─ Critique ideas, not persons                            │
│  ├─ Proportionate response                                     │
│  │   └─ Match response length/depth to claim importance        │
│  ├─ Acknowledgment of contributions                            │
│  │   └─ Credit intellectual debts                              │
│  └─ Responsiveness                                             │
│      └─ Engage with direct challenges                          │
│                                                                 │
│  DISCIPLINARY NORMS                                             │
│  ├─ Methodological transparency                                │
│  │   └─ Make theoretical commitments explicit                  │
│  ├─ Evidence standards                                         │
│  │   └─ Follow field-specific evidentiary norms               │
│  └─ Citation practices                                         │
│      └─ Adhere to disciplinary citation conventions            │
│                                                                 │
│  COMMUNITY NORMS                                                │
│  ├─ Inclusive participation                                    │
│  │   └─ Welcome newcomers, especially students                 │
│  ├─ Constructive criticism                                     │
│  │   └─ Aim for improvement, not demolition                    │
│  └─ Collaborative knowledge-building                           │
│      └─ Contribute to collective understanding                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 9.1.2 Moderation Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODERATION ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TIER 1: Automated Filtering                                   │
│  ├─ Spam detection                                             │
│  ├─ Obviously abusive content                                  │
│  └─ Duplicate detection                                        │
│                                                                 │
│  TIER 2: Community Flagging                                    │
│  ├─ User reports                                               │
│  ├─ Low-engagement signals                                     │
│  └─ Quality indicators                                         │
│                                                                 │
│  TIER 3: Rotating Peer Review                                  │
│  ├─ Field-specific reviewers                                   │
│  ├─ Adjudicate flagged content                                 │
│  └─ Rotating panel to distribute burden                        │
│                                                                 │
│  TIER 4: Editorial Board                                       │
│  ├─ Disciplinary experts                                       │
│  ├─ Appeals process                                            │
│  └─ Norm interpretation/development                            │
│                                                                 │
│  ACTIONS (graduated)                                           │
│  ├─ Quality label (needs substantiation, off-topic, etc.)     │
│  ├─ Visibility reduction (not deletion)                        │
│  ├─ Author notification with guidance                          │
│  ├─ Revision request                                           │
│  └─ Removal (rare, preserved for author)                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Reputation and Recognition

Academic work requires proper attribution and recognition without gamification.

#### 9.2.1 Contribution Types

| Contribution | Description | Recognition |
|--------------|-------------|-------------|
| **Original argument** | Novel claim with reasoning | Primary attribution |
| **Substantive response** | Engaged critique or support | Response attribution |
| **Source contribution** | Adding bibliographic/textual material | Contributor credit |
| **Reconstruction** | Mapping existing arguments | Reconstructor credit |
| **Synthesis** | Connecting disparate threads | Synthesis attribution |
| **Translation** | Providing translations | Translator credit |
| **Editorial** | Improving clarity, fixing errors | Editor credit |

#### 9.2.2 Reputation Model

```
┌─────────────────────────────────────────────────────────────────┐
│                  REPUTATION ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PRINCIPLES                                                     │
│  ├─ No gamification (no points, levels, badges)               │
│  ├─ Transparent contribution history                           │
│  ├─ Field-contextualized standing                              │
│  └─ Emphasis on intellectual contribution, not popularity      │
│                                                                 │
│  VISIBLE SIGNALS                                                │
│  ├─ Institutional affiliation (verified via ORCID/SSO)        │
│  ├─ Contribution history (claims, responses, edits)            │
│  ├─ Engagement received (responses to their work)              │
│  ├─ Field participation (disciplines active in)                │
│  └─ Peer recognition (acknowledged by others)                  │
│                                                                 │
│  TRUST MECHANISMS                                               │
│  ├─ Verified academic identity (ORCID-linked)                  │
│  ├─ Institutional vouching (university affiliation)            │
│  ├─ Community endorsement (peer recognition)                   │
│  └─ Track record (history of quality contributions)            │
│                                                                 │
│  ANTI-PATTERNS AVOIDED                                          │
│  ├─ No "upvotes" or "likes" (prevents popularity bias)        │
│  ├─ No leaderboards (prevents competition for its own sake)   │
│  ├─ No badges (prevents credentialism)                         │
│  └─ No public metrics optimization                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.3 Junior-Senior Dynamics

Academic hierarchies create barriers; the platform should mitigate while respecting expertise.

#### 9.3.1 Status-Aware Design

| Challenge | Design Response |
|-----------|-----------------|
| **Graduate student hesitation** | Anonymous participation option; "student forum" spaces |
| **Power differential in critique** | Blind review option for critiques of senior scholars |
| **Professorial dismissiveness** | Norms enforcing response to substantive critique regardless of source |
| **Mentorship opportunities** | Faculty can "adopt" promising threads; visible mentorship |
| **Career risk** | Pseudonymous option; delayed public attribution |

#### 9.3.2 Pseudonymity Model

```
┌─────────────────────────────────────────────────────────────────┐
│                   IDENTITY FLEXIBILITY                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FULL IDENTITY                                                  │
│  ├─ Real name + institution                                    │
│  ├─ ORCID-linked                                               │
│  └─ Full accountability and recognition                        │
│                                                                 │
│  VERIFIED PSEUDONYM                                             │
│  ├─ Pseudonymous display name                                  │
│  ├─ Verified academic identity (known to platform)             │
│  ├─ Can be de-pseudonymized by user later                      │
│  └─ Use case: Graduate students, contingent faculty            │
│                                                                 │
│  INSTITUTIONAL ONLY                                             │
│  ├─ "Verified academic at R1 university"                       │
│  ├─ No individual identity visible                             │
│  └─ Use case: Critique of powerful figures                     │
│                                                                 │
│  CONSTRAINTS                                                    │
│  ├─ Single identity per person (no sockpuppets)               │
│  ├─ Persistent pseudonym (reputation carries)                  │
│  └─ Platform knows real identity (abuse prevention)            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.4 Field-Specific Spaces

Different disciplines have different discourse cultures requiring tailored spaces.

#### 9.4.1 Space Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      SPACE HIERARCHY                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GLOBAL                                                         │
│  └─ Cross-disciplinary discourse                               │
│      └─ Philosophy of Science ↔ History of Science debates     │
│                                                                 │
│  DISCIPLINE                                                     │
│  ├─ Philosophy                                                 │
│  │   └─ Sub-fields: Epistemology, Ethics, Metaphysics...      │
│  ├─ History                                                    │
│  │   └─ Sub-fields: Medieval, Modern, Social...               │
│  └─ [Other disciplines]                                        │
│                                                                 │
│  TOPIC/DEBATE                                                   │
│  ├─ The Historikerstreit                                       │
│  ├─ Moral realism vs. anti-realism                             │
│  └─ [Specific ongoing debates]                                 │
│                                                                 │
│  WORK                                                           │
│  ├─ Discussions around specific texts                          │
│  └─ Responses to specific articles/books                       │
│                                                                 │
│  SEMINAR/COURSE                                                 │
│  ├─ Private or semi-private course discussions                 │
│  └─ Instructor-moderated                                       │
│                                                                 │
│  WORKING GROUP                                                  │
│  ├─ Collaborative research groups                              │
│  └─ Pre-publication discussion                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Pilot Strategy

### 10.1 Pilot Selection Criteria

#### 10.1.1 Ideal Pilot Community Characteristics

| Criterion | Rationale | Weight |
|-----------|-----------|--------|
| **Active debate culture** | Existing discourse to migrate | High |
| **Frustrated with current tools** | Pain point creates adoption motivation | High |
| **Networked community** | Word-of-mouth can spread | High |
| **Champion available** | Respected advocate willing to seed | High |
| **Manageable size** | Large enough for network effects, small enough to support | Medium |
| **Citation-dense** | Benefits from claim-level linking | Medium |
| **Interdisciplinary interest** | Values cross-field connection | Medium |
| **Graduate student community** | Early career scholars more willing to try new tools | Medium |
| **Conference-oriented** | Annual gatherings for promotion | Low-Medium |

### 10.2 Candidate Pilot Communities

#### 10.2.1 Philosophy Candidates

| Community | Size | Debate Culture | Champion Potential | Assessment |
|-----------|------|----------------|-------------------|------------|
| **Philosophy of Mind** | Medium | Very active (consciousness debates) | Multiple prominent figures | ⭐⭐⭐⭐⭐ |
| **Political Philosophy** | Large | Highly active (justice, democracy) | Politically engaged scholars | ⭐⭐⭐⭐ |
| **Epistemology** | Medium | Active (internalism/externalism) | Established bloggers (e.g., Certain Doubts) | ⭐⭐⭐⭐ |
| **Philosophy of Science** | Medium | Active (realism, models) | Interdisciplinary connections | ⭐⭐⭐⭐ |
| **Ethics** | Large | Very active (applied ethics debates) | Public intellectuals | ⭐⭐⭐ |
| **History of Philosophy** | Medium | Moderate (textual debates) | PhilPapers integration natural | ⭐⭐⭐ |

#### 10.2.2 History Candidates

| Community | Size | Debate Culture | Champion Potential | Assessment |
|-----------|------|----------------|-------------------|------------|
| **Intellectual History** | Medium | Active (ideas in context) | Natural fit with concept-mapping | ⭐⭐⭐⭐⭐ |
| **History of Science** | Medium | Active (Kuhn debates continue) | Bridges STEM/HSS | ⭐⭐⭐⭐ |
| **Political History** | Large | Active (revisionist debates) | Public interest | ⭐⭐⭐ |
| **Digital Humanities** | Medium | Very active (method debates) | Tech-savvy, early adopter culture | ⭐⭐⭐⭐⭐ |

#### 10.2.3 Other HSS Candidates

| Community | Size | Debate Culture | Champion Potential | Assessment |
|-----------|------|----------------|-------------------|------------|
| **Comparative Literature** | Medium | Active (theory debates) | Theory-heavy, good fit | ⭐⭐⭐⭐ |
| **Political Theory** | Medium | Very active (normative debates) | Bridges philosophy/polisci | ⭐⭐⭐⭐⭐ |
| **Science & Technology Studies** | Medium | Active (constructivism debates) | Reflexive about platforms | ⭐⭐⭐⭐ |
| **Religious Studies** | Medium | Moderate | Comparative focus | ⭐⭐⭐ |
| **Critical Theory** | Small-Medium | Active (Frankfurt School + beyond) | Theoretical sophistication | ⭐⭐⭐⭐ |

### 10.3 Seeding Strategy

#### 10.3.1 Content Seeding

```
┌─────────────────────────────────────────────────────────────────┐
│                     SEEDING PIPELINE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PHASE 1: FOUNDATIONAL CONTENT (Pre-launch)                    │
│  ├─ Import key debates from PhilPapers/JSTOR                   │
│  ├─ Map canonical argument structures                           │
│  │   (e.g., the Gettier problem, trolley problems)             │
│  ├─ Link to existing syllabi and reading lists                 │
│  └─ Seed with summaries of major positions                     │
│                                                                 │
│  PHASE 2: CHAMPION ACTIVATION (Launch)                         │
│  ├─ Recruit 5-10 respected scholars per pilot field            │
│  ├─ Champions post initial claims/responses                    │
│  ├─ Champions invite their networks                            │
│  └─ Champions model good discourse practices                   │
│                                                                 │
│  PHASE 3: GRADUATE STUDENT CULTIVATION                         │
│  ├─ Partner with graduate programs                             │
│  ├─ Integrate into proseminar/methods courses                  │
│  ├─ Offer as venue for dissertation chapter feedback           │
│  └─ Create "graduate student forum" spaces                     │
│                                                                 │
│  PHASE 4: CONFERENCE INTEGRATION                               │
│  ├─ Partner with APA, AHA, MLA divisions                       │
│  ├─ Pre-conference discussion threads                          │
│  ├─ Post-conference Q&A continuation                           │
│  └─ Paper session response forums                              │
│                                                                 │
│  PHASE 5: JOURNAL INTEGRATION                                  │
│  ├─ Partner with open-access journals                          │
│  ├─ Article discussion threads                                 │
│  ├─ Referee report integration (anonymized)                    │
│  └─ Author response forums                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 10.3.2 Debate Seeding Examples

| Seed Debate | Field | Why Seed | Expected Engagement |
|-------------|-------|----------|---------------------|
| **Consciousness and the hard problem** | Phil Mind | Ongoing, heated, public interest | Very high |
| **Rawls vs. communitarians** | Political Phil | Classic debate, ongoing relevance | High |
| **Linguistic turn assessment** | Intellectual History | Historiographical stakes | Medium-high |
| **Digital humanities legitimacy** | DH | Meta-disciplinary, reflexive | High (for DH) |
| **Replication crisis implications** | Phil Science/STS | Cross-disciplinary, timely | High |
| **Critical race theory debates** | Multiple | Public salience, need for rigor | Very high (but risky) |

### 10.4 Success Metrics

#### 10.4.1 Pilot KPIs

| Metric | Target (6 months) | Measurement |
|--------|-------------------|-------------|
| **Active users** | 500+ per pilot community | Monthly active contributors |
| **Claim creation** | 5,000+ claims | New claims per month |
| **Response rate** | 40%+ claims receive substantive response | Responses / claims |
| **Return rate** | 50%+ users return weekly | Weekly active / monthly active |
| **Source linking** | 80%+ claims link to sources | Claims with bibliography links |
| **Cross-thread connection** | 20%+ claims link to other threads | Inter-thread references |
| **Graduate student participation** | 30%+ users are students | Self-reported status |
| **Net Promoter Score** | 50+ | Survey |

#### 10.4.2 Qualitative Indicators

| Indicator | How to Assess |
|-----------|---------------|
| **Discourse quality** | Expert review of sample threads |
| **Norm compliance** | Moderation intervention rate |
| **Intellectual progress** | Do debates advance? (scholar assessment) |
| **Cross-disciplinary flow** | Are ideas moving between fields? |
| **Career safety** | Any negative career consequences? (exit survey) |
| **Integration with workflow** | Are scholars using alongside writing? |

### 10.5 Growth Path

#### 10.5.1 Expansion Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│                      GROWTH TRAJECTORY                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  YEAR 1: Pilot Phase                                           │
│  ├─ Q1-Q2: 2-3 pilot communities (Philosophy of Mind,          │
│  │         Political Theory, Intellectual History)             │
│  ├─ Q3: Add 2-3 adjacent communities based on pilot success    │
│  └─ Q4: Iterate on features based on feedback                  │
│                                                                 │
│  YEAR 2: HSS Expansion                                         │
│  ├─ Q1-Q2: Cover major HSS disciplines                         │
│  ├─ Q3: Cross-disciplinary features mature                     │
│  └─ Q4: Begin graduate program partnerships at scale           │
│                                                                 │
│  YEAR 3: Institutional Integration                             │
│  ├─ Q1-Q2: University-level partnerships (library, provost)    │
│  ├─ Q3: Journal and press partnerships                         │
│  └─ Q4: Professional association integrations                  │
│                                                                 │
│  YEAR 4+: Platform Maturity                                    │
│  ├─ Consider STEM expansion (with replication infrastructure)  │
│  ├─ Policy/civic discourse extensions                          │
│  └─ International expansion and multilingual support           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Conclusion

The Humanities and Social Sciences present an ideal initial domain for the Agora platform:

1. **Natural Fit**: HSS scholarship is already argumentation-based; the platform structure maps directly to disciplinary practice

2. **Lower Barriers**: No replication infrastructure, datasets, or lab equipment required—just structured discourse about texts and ideas

3. **Existing Frustration**: Scholars are frustrated with Twitter/X, blog comments, and slow journal response cycles

4. **Dense Citation**: HSS's textual focus and citation practices align with claim-level source linking

5. **Interpretive Pluralism**: Multiple valid interpretations coexist, creating ongoing discourse rather than settled answers

6. **Graduate Student Need**: Early career scholars need low-stakes, high-visibility venues for intellectual development

The design articulated in this document—with HSS-specific argument schemes, sophisticated passage handling, theoretical framework mapping, and careful community design—can create the scholarly infrastructure that academic discourse currently lacks.

**The path forward**: Start with 2-3 tightly-defined pilot communities, seed with respected champions, cultivate graduate student participation, and iterate rapidly based on usage patterns. The goal is not to replace existing publication venues but to create the missing layer of structured, persistent, claim-level discourse that makes scholarly debate cumulative rather than ephemeral.

---

*End of document.*
