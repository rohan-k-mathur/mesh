# Academic Collaboration Features Brainstorm

## Mesh for Open-Source Academia & Research Communities

**Session Date:** December 15, 2025  
**Session Type:** Strategic Ideation & Feature Discovery  
**Guiding Vision:** Build infrastructure for scholarly discourse that fosters cross-institutional and interdisciplinary collaboration

---

## Table of Contents

1. [Vision Alignment](#1-vision-alignment)
2. [Competitive Landscape Analysis](#2-competitive-landscape-analysis)
3. [Scholar Persona Analysis](#3-scholar-persona-analysis)
4. [Feature Categories](#4-feature-categories)
5. [Tier 1: Research Discovery & Navigation](#5-tier-1-research-discovery--navigation)
6. [Tier 2: Cross-Institutional Collaboration](#6-tier-2-cross-institutional-collaboration)
7. [Tier 3: Structured Academic Discourse](#7-tier-3-structured-academic-discourse)
8. [Tier 4: Knowledge Graph & Citation Intelligence](#8-tier-4-knowledge-graph--citation-intelligence)
9. [Tier 5: Open Peer Review & Reputation](#9-tier-5-open-peer-review--reputation)
10. [Tier 6: Interdisciplinary Bridge-Building](#10-tier-6-interdisciplinary-bridge-building)
11. [Infrastructure Leverage Map](#11-infrastructure-leverage-map)
12. [Prioritization Matrix](#12-prioritization-matrix)
13. [Implementation Roadmap](#13-implementation-roadmap)

---

## 1. Vision Alignment

### 1.1 Core Mesh Vision (from existing docs)

> "What if your discussions produced more than chat logs? Mesh is reasoning infrastructure — traceable claims, visible arguments, discussions that produce artifacts you can search, cite, and build upon."

### 1.2 Academic Application of Vision

| Mesh Principle | Academic Translation |
|----------------|---------------------|
| **Claims are canonical objects** | Research claims become citable, versionable entities across papers |
| **Arguments have visible structure** | Theoretical frameworks expose their inferential dependencies |
| **Disagreement is typed and tracked** | Scientific debates become navigable with clear attack/support semantics |
| **Discussions produce artifacts** | Peer review produces exportable argument graphs, not just PDFs |
| **Progressive formalization** | From informal lab meeting to formal publication-ready argumentation |

### 1.3 The Academic Knowledge Crisis (Problem Statement)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CURRENT STATE OF ACADEMIC DISCOURSE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐    ┌──────────────────────┐                       │
│  │  SILOED DISCOVERY    │    │  STATIC PUBLICATIONS │                       │
│  │                      │    │                      │                       │
│  │ • Discipline-bound   │    │ • PDF as final form  │                       │
│  │   search             │    │ • No structured      │                       │
│  │ • Citation networks  │    │   argument data      │                       │
│  │   but no argument    │    │ • Debates happen in  │                       │
│  │   networks           │    │   isolated response  │                       │
│  │ • Serendipity is     │    │   papers             │                       │
│  │   rare               │    │                      │                       │
│  └──────────────────────┘    └──────────────────────┘                       │
│                                                                              │
│  ┌──────────────────────┐    ┌──────────────────────┐                       │
│  │  OPAQUE PEER REVIEW  │    │  REPUTATION SILOS    │                       │
│  │                      │    │                      │                       │
│  │ • Anonymous but not  │    │ • H-index measures   │                       │
│  │   accountable        │    │   citations, not     │                       │
│  │ • No structured      │    │   argument quality   │                       │
│  │   dialogue           │    │ • Cross-discipline   │                       │
│  │ • Labor extracted,   │    │   contributions      │                       │
│  │   not credited       │    │   invisible          │                       │
│  └──────────────────────┘    └──────────────────────┘                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Mesh's Unique Position

Unlike existing platforms, Mesh offers:

| Differentiator | What It Enables |
|----------------|-----------------|
| **Argumentation-first data model** | Papers as argument chains, not just text blobs |
| **AIF compliance** | Interoperability with formal argumentation tools |
| **Walton schemes** | Recognizing 60+ reasoning patterns in research |
| **ASPIC+ evaluation** | Formal acceptability analysis for competing theories |
| **Categorical semantics** | Cross-deliberation transport (research area → research area) |
| **Commitment tracking** | Visible intellectual positions that evolve |

---

## 2. Competitive Landscape Analysis

### 2.1 Current Research Platforms

| Platform | Core Value | Mesh Can Differentiate By |
|----------|------------|---------------------------|
| **arXiv** | Preprint distribution | *Adding structured discourse layer atop papers* |
| **ResearchGate** | Academic social network | *Arguments, not just follows; debates, not just shares* |
| **Research Rabbit** | Citation-based discovery | *Argument-based discovery (who challenged claim X?)* |
| **PubMed** | Biomedical literature search | *Adding deliberation to systematic reviews* |
| **Zotero** | Personal reference management | *Collaborative stacks with citation-to-argument links* |
| **Semantic Scholar** | AI-powered literature analysis | *Human-structured argument networks* |
| **OpenReview** | Open peer review | *Formal attack/support tracking, scheme-based review* |
| **Hypothesis** | Web annotation | *Annotations that become arguments in deliberations* |

### 2.2 Gap Analysis

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MARKET GAP MESH CAN FILL                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  EXISTING: Papers → Citations → Metrics                                      │
│                                                                              │
│  MISSING:  Papers → CLAIMS → ARGUMENTS → DEBATES → SYNTHESIS                │
│                           ↓        ↓           ↓                            │
│                      Typed     Scheme-    Commitment                         │
│                      links     based      stores with                        │
│                               attacks     provenance                         │
│                                                                              │
│  MESH FILLS THE "ARGUMENT GRAPH" LAYER BETWEEN PAPERS AND METRICS           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Scholar Persona Analysis

### 3.1 Primary Personas

#### Persona A: The Interdisciplinary Researcher

| Attribute | Description |
|-----------|-------------|
| **Role** | Faculty member working at intersection of 2+ fields |
| **Pain Points** | Can't find who's making similar arguments in adjacent fields; citation metrics don't capture cross-disciplinary impact |
| **Needs** | Discover researchers by *claim similarity*, not just citation overlap |
| **Mesh Value** | Plexus visualization across deliberation rooms; transport functors to bring arguments from Field A to Field B |

#### Persona B: The PhD Candidate

| Attribute | Description |
|-----------|-------------|
| **Role** | Early-career researcher building literature foundation |
| **Pain Points** | Overwhelmed by paper volume; unclear which debates are "live" vs. settled |
| **Needs** | Map of contested vs. accepted claims in the field; who's defending what |
| **Mesh Value** | Commitment stores show who stands where; debate sheets visualize open questions |

#### Persona C: The Systematic Reviewer

| Attribute | Description |
|-----------|-------------|
| **Role** | Researcher conducting literature review or meta-analysis |
| **Pain Points** | Extracting claims from papers manually; tracking which studies attack/support which conclusions |
| **Needs** | Structured extraction of claims and evidence from papers |
| **Mesh Value** | Citation → Claim pipeline; argument chain visualization; evidence aggregation |

#### Persona D: The Open Science Advocate

| Attribute | Description |
|-----------|-------------|
| **Role** | Researcher pushing for transparent, reproducible science |
| **Pain Points** | Peer review is opaque; replication debates scattered across venues |
| **Needs** | Public, structured peer review; traceable argument evolution |
| **Mesh Value** | Open deliberation rooms per paper; typed attacks on methodology |

#### Persona E: The Research Group Lead

| Attribute | Description |
|-----------|-------------|
| **Role** | PI managing a lab with multiple research threads |
| **Pain Points** | Institutional knowledge lost when students graduate; internal debates not captured |
| **Needs** | Persistent group reasoning; onboard new members to intellectual context |
| **Mesh Value** | Stacks as group libraries; deliberations as persistent lab notebooks |

### 3.2 Secondary Personas

| Persona | Key Need | Mesh Opportunity |
|---------|----------|------------------|
| **Science Journalist** | Understand who's debating what in a field | Read-only access to deliberation summaries |
| **Funding Agency** | Track intellectual lineage of funded work | Argument provenance from grants to claims |
| **Policy Analyst** | Find scientific consensus/dissent on issues | Aggregated claim confidence across deliberations |

---

## 4. Feature Categories

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FEATURE CATEGORY TAXONOMY                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  TIER 1: RESEARCH DISCOVERY & NAVIGATION                            │    │
│  │  • Paper-to-argument extraction                                     │    │
│  │  • Claim-based search                                               │    │
│  │  • "Related arguments" (not just "related papers")                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  TIER 2: CROSS-INSTITUTIONAL COLLABORATION                          │    │
│  │  • Shared stacks across institutions                                │    │
│  │  • Multi-author argument chains                                     │    │
│  │  • Federated room discovery                                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  TIER 3: STRUCTURED ACADEMIC DISCOURSE                              │    │
│  │  • Journal club deliberation template                               │    │
│  │  • Paper response deliberations                                     │    │
│  │  • Conference session deliberations                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  TIER 4: KNOWLEDGE GRAPH & CITATION INTELLIGENCE                    │    │
│  │  • Argument-level citations (not just paper-level)                  │    │
│  │  • Claim provenance across papers                                   │    │
│  │  • "What challenges this claim?" queries                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  TIER 5: OPEN PEER REVIEW & REPUTATION                              │    │
│  │  • Public peer review deliberations                                 │    │
│  │  • Reviewer commitment tracking                                     │    │
│  │  • Reputation from argument quality, not just citations             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  TIER 6: INTERDISCIPLINARY BRIDGE-BUILDING                          │    │
│  │  • Cross-field claim mapping                                        │    │
│  │  • Translation deliberations                                        │    │
│  │  • Shared vocabulary negotiation                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Tier 1: Research Discovery & Navigation

### 5.1 Feature: Paper-to-Argument Extraction Pipeline

**Vision:** When a researcher adds a paper to their Stack, the system offers to extract structured claims and arguments.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PAPER-TO-ARGUMENT PIPELINE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PDF Upload                                                                  │
│      │                                                                       │
│      ▼                                                                       │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  1. CLAIM EXTRACTION (AI-assisted + human verified)                │     │
│  │     • Identify thesis statements                                   │     │
│  │     • Extract numbered hypotheses                                  │     │
│  │     • Parse conclusion sections                                    │     │
│  │     • Flag methodological claims                                   │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│      │                                                                       │
│      ▼                                                                       │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  2. ARGUMENT STRUCTURE INFERENCE                                    │     │
│  │     • Premises → Conclusion chains                                  │     │
│  │     • Scheme detection (e.g., "argument from statistical evidence")│     │
│  │     • Critical question surfacing                                   │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│      │                                                                       │
│      ▼                                                                       │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  3. CITATION-TO-CLAIM LINKING                                       │     │
│  │     • Which citation supports which premise?                        │     │
│  │     • Parse citation context for support/attack intent              │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│      │                                                                       │
│      ▼                                                                       │
│  Structured Argument Chain → Ready for Deliberation                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Implementation Notes:**
- Leverages existing `LibraryPost` → `Source` → `Citation` pipeline
- Extends with `ClaimExtraction` model linking to source
- AI-assisted with human-in-the-loop verification UI

### 5.2 Feature: Claim-Based Search

**Vision:** Search the platform not just by paper title or author, but by *claim content*.

| Search Type | Example Query | Returns |
|-------------|---------------|---------|
| **Claim search** | "neural networks are universal approximators" | Claims making this assertion |
| **Attack search** | "challenges to backpropagation" | Arguments attacking claims about backprop |
| **Scheme search** | "arguments from statistical significance in psychology" | Arguments using this scheme in this field |
| **Author-claim** | "claims by Kahneman about heuristics" | Tracked claims by author |

**Implementation:**
- Vector embeddings for claim text (Pinecone already in stack)
- Semantic similarity + scheme/attack filtering
- Surfaces `Claim` entities, not just documents

### 5.3 Feature: "Related Arguments" Discovery

**Vision:** When viewing an argument, show not just related papers but related *arguments* from anywhere in the Mesh network.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              RELATED ARGUMENTS PANEL                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  VIEWING: "fMRI studies show activity in prefrontal cortex during..."       │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  SIMILAR CLAIMS (semantic)                                          │    │
│  │  • "Prefrontal activity correlates with working memory" (0.89)     │    │
│  │  • "Executive function localizes to dorsolateral PFC" (0.84)       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  SUPPORTING ARGUMENTS (same conclusion, different premises)         │    │
│  │  • EEG study by [Author] reaching same conclusion                   │    │
│  │  • Meta-analysis pooling 12 fMRI datasets                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  ATTACKING ARGUMENTS (challenges this claim)                        │    │
│  │  • [Rebut] "fMRI activation doesn't imply causal role"             │    │
│  │  • [Undercut] "Reverse inference fallacy applies here"              │    │
│  │  • [Undermine] "Sample size insufficient for this conclusion"       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  FROM OTHER FIELDS (transport functor matches)                      │    │
│  │  • Philosophy of Mind: "Neural correlates ≠ explanations"          │    │
│  │  • Cognitive Psychology: "Behavioral data contradicts..."           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Tier 2: Cross-Institutional Collaboration

### 6.1 Feature: Academic Organization Profiles

**Vision:** Institutions, departments, and research groups have collective presence on Mesh.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              ORGANIZATION ENTITY MODEL                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Organization                                                                │
│  ├── type: university | department | lab | consortium | journal             │
│  ├── members: User[]                                                        │
│  ├── stacks: Stack[] (institutional libraries)                              │
│  ├── deliberations: Deliberation[] (public org discussions)                 │
│  ├── claims: Claim[] (aggregated from member activity)                      │
│  └── relationships: OrgRelationship[]                                       │
│        ├── parent: Organization (e.g., Dept → University)                   │
│        └── collaborators: Organization[] (formal partnerships)              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Institutional Stacks (shared reference libraries)
- Cross-org deliberation rooms with institutional affiliation badges
- Org-level commitment aggregation ("MIT's stated position on X")

### 6.2 Feature: Multi-Institution Deliberation Rooms

**Vision:** A deliberation that explicitly spans institutions, tracking contributions by affiliation.

| Feature | Description |
|---------|-------------|
| **Affiliation badges** | Each participant's institution shown on contributions |
| **Institutional commitment stores** | Aggregate what each institution's members have committed to |
| **Cross-institution visualization** | Plexus view colored by institution |
| **Facilitated dialogue** | Designated moderators from neutral institutions |

### 6.3 Feature: Shared Research Stacks

**Vision:** Collaborative document collections that persist across institutional boundaries.

```
Scenario: Three universities collaborating on a systematic review

┌──────────────────────────────────────────────────────────────────────────┐
│  SHARED STACK: "Climate Adaptation Meta-Analysis 2025"                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Collaborators:                                                          │
│  • MIT (owner) - 3 members                                               │
│  • Stanford (editor) - 2 members                                         │
│  • Oxford (editor) - 2 members                                           │
│                                                                          │
│  Contents: 147 papers                                                    │
│  ├── 89 included in analysis                                             │
│  ├── 32 excluded (with tracked reasons)                                  │
│  └── 26 under discussion                                                 │
│                                                                          │
│  Active Deliberations:                                                   │
│  • "Inclusion criteria for longitudinal studies" (12 participants)       │
│  • "Coding disagreement: paper #47" (4 participants)                     │
│                                                                          │
│  Extracted Claims: 312                                                   │
│  Argument Chains: 78                                                     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Tier 3: Structured Academic Discourse

### 7.1 Feature: Journal Club Deliberation Template

**Vision:** A pre-configured deliberation format for the classic academic journal club.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              JOURNAL CLUB DELIBERATION TEMPLATE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PHASES (timed, facilitator-managed):                                        │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  1. CLAIM EXTRACTION (20 min)                                       │     │
│  │     • Participants surface main claims from paper                   │     │
│  │     • Automatic deduplication and voting on central claim           │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  2. METHODOLOGY CHALLENGE (15 min)                                  │     │
│  │     • Structured attacks on methods                                 │     │
│  │     • Pre-populated critical questions for common schemes           │     │
│  │       (statistical inference, experimental design, etc.)            │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  3. THEORETICAL FRAMING (15 min)                                    │     │
│  │     • How does this connect to existing literature?                 │     │
│  │     • Transport existing arguments from other deliberations         │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  4. SYNTHESIS (10 min)                                              │     │
│  │     • Debate sheet generation                                       │     │
│  │     • "Our take" thesis document                                    │     │
│  │     • Open questions for future reading                             │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│  OUTPUT: Exportable AIF graph + summary + reading recommendations           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Feature: Paper Response Deliberation

**Vision:** When responding to a published paper, structure the response as a deliberation.

| Component | Implementation |
|-----------|----------------|
| **Original paper claims** | Auto-extracted or manually entered as propositions |
| **Response claims** | New claims linked as supports/attacks to originals |
| **Typed responses** | Rebut (conclusion wrong), Undercut (inference flawed), Undermine (premise false) |
| **Response document** | Thesis generator produces structured response paper |
| **Linked to original** | When original paper is in Mesh, creates cross-reference |

### 7.3 Feature: Conference Session Deliberation

**Vision:** Live deliberation during conference presentations.

```
During a conference talk:

┌─────────────────────────────────────────────────────────────────────────────┐
│  LIVE SESSION: "New Results in Quantum Error Correction"                    │
│  Speaker: Dr. Jane Smith, MIT                                               │
│  Conference: QIP 2025                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CLAIM STREAM (live capture):                                               │
│  • 10:02 - "Surface codes achieve threshold at 1%" [3 👍 2 ❓]              │
│  • 10:07 - "Our new decoder reduces overhead by 40%" [5 👍 1 🔥]            │
│  • 10:12 - "This enables fault-tolerant gates at room temp" [2 👍 4 ❓]     │
│                                                                              │
│  Q&A QUEUE:                                                                  │
│  1. [Challenge] "What about correlated errors?" - @bob_quantum              │
│  2. [Clarify] "Define 'overhead' in this context" - @alice_codes            │
│                                                                              │
│  LIVE PARTICIPANTS: 47                                                       │
│  REMOTE VIEWERS: 312                                                         │
│                                                                              │
│  POST-SESSION: Deliberation persists for async follow-up                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Tier 4: Knowledge Graph & Citation Intelligence

### 8.1 Feature: Argument-Level Citations

**Vision:** Cite specific arguments, not just papers.

| Current State | Mesh Enhancement |
|---------------|------------------|
| "Smith et al. 2023" | "Smith et al. 2023, Argument 3 (response to Jones's rebuttal)" |
| Paper-level granularity | Claim-level granularity with stable IDs |
| Citation context lost | Citation context preserved in argument graph |

**Implementation:**
- Extend `Citation` model with `targetArgumentId`, `targetClaimId`
- Generate citable permalinks for arguments
- Export citation formats (BibTeX, RIS) with argument-level resolution

### 8.2 Feature: Claim Provenance Tracking

**Vision:** For any claim, see its complete intellectual history.

```
CLAIM: "Transformer attention is not Turing complete"

┌─────────────────────────────────────────────────────────────────────────────┐
│              CLAIM PROVENANCE                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ORIGIN:                                                                     │
│  └── First asserted: Pérez et al. 2019 (ICLR submission)                    │
│                                                                              │
│  EVOLUTION:                                                                  │
│  ├── 2019-03: Initial formulation                                           │
│  ├── 2020-01: Refined by Yun et al. (added conditions)                      │
│  ├── 2020-06: Challenged by Dehghani et al. (undercut)                      │
│  ├── 2021-02: Defended with additional proof (Pérez response)               │
│  └── 2023-09: Current consensus: conditional acceptance                     │
│                                                                              │
│  CURRENT STATUS:                                                             │
│  ├── Acceptability: PREFERRED (under ASPIC+ grounded semantics)             │
│  ├── Active challenges: 2                                                   │
│  ├── Undefeated defenses: 3                                                 │
│  └── Confidence: 0.78 (DS aggregated)                                       │
│                                                                              │
│  CANONICAL ID: mesh://claims/turing-complete-attention-2019                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Feature: "What Challenges This?" Query

**Vision:** For any claim or argument, instantly find all attacks.

```
Query: mesh.attacks("backpropagation is biologically plausible")

Returns:
┌─────────────────────────────────────────────────────────────────────────────┐
│  ATTACKS ON: "Backpropagation is biologically plausible"                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  REBUTTALS (12):                                                             │
│  • "Weight transport problem makes BP implausible" (Lillicrap 2016)         │
│  • "BP requires symmetric weights; biology doesn't" (Crick 1989)            │
│                                                                              │
│  UNDERCUTS (8):                                                              │
│  • "Similarity != mechanism; inference fallacy" (Philosophy of Mind)        │
│  • "Predictive coding explains same phenomena differently"                   │
│                                                                              │
│  UNDERMINES (5):                                                             │
│  • "Evidence for BP in biology is correlational" (Methods critique)          │
│  • "Sample sizes in key studies insufficient"                                │
│                                                                              │
│  DEFENSES AVAILABLE: 15 (from BP proponents)                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Tier 5: Open Peer Review & Reputation

### 9.1 Feature: Public Peer Review Deliberations

**Vision:** Peer review as structured, public deliberation.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              OPEN PEER REVIEW DELIBERATION                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PAPER: "A Novel Approach to Protein Folding Prediction"                    │
│  SUBMITTED TO: Mesh Open Biology                                            │
│  STATUS: Under Review (Day 12 of 30)                                        │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  REVIEWER COMMITMENTS (public, attributed):                          │   │
│  │                                                                      │   │
│  │  @reviewer_A (Stanford Structural Bio):                              │   │
│  │  ├── CONCEDED: "Method is novel" ✓                                  │   │
│  │  ├── CHALLENGED: "Statistical validation insufficient" ⚡            │   │
│  │  └── AWAITING: Author response on validation                         │   │
│  │                                                                      │   │
│  │  @reviewer_B (DeepMind):                                             │   │
│  │  ├── SUPPORTED: "Benchmark improvements are real" ✓                 │   │
│  │  ├── UNDERCUT: "Comparison to AlphaFold2 unfair" ⚡                  │   │
│  │  └── SUGGESTED: Add head-to-head on CASP14                          │   │
│  │                                                                      │   │
│  │  @community_member (Oxford):                                         │   │
│  │  └── NOTED: "Prior work by [X] not cited" 📝                        │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  AUTHOR RESPONSES: 8 (linked to specific challenges)                        │
│  OPEN ISSUES: 3                                                             │
│  RESOLVED ISSUES: 5                                                         │
│                                                                              │
│  DECISION FACTORS (visible):                                                 │
│  • Methodology attacks: 2/4 resolved                                        │
│  • Novelty confirmed: Yes                                                   │
│  • Ethics concerns: None                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Feature: Argumentation-Based Reputation

**Vision:** Reputation derived from argument quality, not just citation counts.

| Metric | Description | Implementation |
|--------|-------------|----------------|
| **Defense Success Rate** | % of your claims that survive challenges | Track claim status over time |
| **Attack Precision** | % of your attacks that result in retractions | Track attack → target retraction |
| **Scheme Diversity** | Variety of argumentation schemes used | Count scheme types in your arguments |
| **Cross-Disciplinary Reach** | Arguments transported to other fields | Count transport functor usage |
| **Constructive Contribution** | Synthesis vs. pure attack ratio | Classify argument role |
| **Commitment Stability** | Consistency of positions over time | Analyze commitment store diffs |

### 9.3 Feature: Reviewer Recognition

**Vision:** Credit reviewers for their intellectual labor.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              REVIEWER PROFILE CARD                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  @jane_methodologist                                                         │
│  Stanford Quantitative Methods                                               │
│                                                                              │
│  REVIEW CONTRIBUTIONS:                                                       │
│  • Papers reviewed: 47                                                       │
│  • Arguments contributed during review: 312                                  │
│  • Issues identified that led to revisions: 89                              │
│  • Papers improved by your methodology critiques: 34                         │
│                                                                              │
│  REVIEW SPECIALTIES (from scheme analysis):                                  │
│  • Statistical reasoning ████████████ 89%                                    │
│  • Causal inference     ████████░░░ 67%                                     │
│  • Experimental design  ███████░░░░ 58%                                     │
│                                                                              │
│  REVIEW STYLE:                                                               │
│  • Constructive/Critical ratio: 2.3:1                                       │
│  • Average response time: 4 days                                            │
│  • Completion rate: 94%                                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Tier 6: Interdisciplinary Bridge-Building

### 10.1 Feature: Cross-Field Claim Mapping

**Vision:** Automatically surface when claims in different fields address similar questions.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              CROSS-FIELD CLAIM MAP                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CONCEPT: "Free will"                                                        │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  PHILOSOPHY                    │  NEUROSCIENCE                      │    │
│  │                                │                                    │    │
│  │  "Libertarian free will is    │  "Libet experiments show decisions │    │
│  │   incompatible with           │   are made unconsciously before    │    │
│  │   determinism"                │   conscious awareness"             │    │
│  │         │                     │          │                         │    │
│  │         └───────ATTACKS───────┴──────────┘                         │    │
│  │                                                                     │    │
│  │  "Compatibilism reconciles    │  "Readiness potential doesn't      │    │
│  │   free will with causation"   │   preclude conscious veto"         │    │
│  │         │                     │          │                         │    │
│  │         └───────SUPPORTS──────┴──────────┘                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  PSYCHOLOGY                   │  LAW                                │    │
│  │                               │                                     │    │
│  │  "Sense of agency is         │  "Criminal responsibility requires │    │
│  │   constructed post-hoc"      │   mens rea (guilty mind)"          │    │
│  │                              │                                     │    │
│  │         └───────INFORMS──────┴──────────┘                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  CROSS-FIELD DELIBERATION: "Free Will Across Disciplines" (23 participants) │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Feature: Translation Deliberations

**Vision:** Dedicated spaces for translating concepts between fields.

| Component | Purpose |
|-----------|---------|
| **Concept mapping** | "X in Field A = Y in Field B" claims |
| **Vocabulary negotiation** | Track terminological disagreements |
| **Translation arguments** | "Why we should interpret A's X as B's Y" |
| **Translation attacks** | "This translation loses crucial nuance" |

### 10.3 Feature: Interdisciplinary Collaboration Matching

**Vision:** Surface potential collaborators across fields based on argument alignment.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  COLLABORATION SUGGESTION                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  You (@cognitive_scientist) might want to collaborate with:                  │
│                                                                              │
│  @philosopher_of_mind (Oxford)                                               │
│  • SHARED CLAIMS: 7                                                          │
│    - "Mental representations have syntax-like structure"                     │
│    - "Modularity thesis is approximately correct"                            │
│  • COMPLEMENTARY ATTACKS: 3                                                  │
│    - You attack from empirical side                                          │
│    - They attack from conceptual side                                        │
│  • POTENTIAL SYNERGY: "Empirical philosophy of cognitive architecture"       │
│                                                                              │
│  @computational_linguist (MIT)                                               │
│  • SHARED CLAIMS: 4                                                          │
│  • METHODOLOGICAL OVERLAP: Both use surprisal measures                       │
│  • POTENTIAL SYNERGY: "Neural correlates of syntactic prediction"            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Infrastructure Leverage Map

### 11.1 Existing Infrastructure → Academic Features

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              INFRASTRUCTURE → FEATURE MAPPING                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  EXISTING INFRASTRUCTURE        │  ACADEMIC FEATURE ENABLED                 │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  Stack/Library System           │  Research group shared libraries           │
│  ├── LibraryPost + Source      │  Paper-to-claim extraction pipeline        │
│  ├── Citation model             │  Argument-level citations                  │
│  └── StackReference            │  Cross-stack knowledge links               │
│                                                                              │
│  Deliberation System            │  Journal club templates                    │
│  ├── Walton Schemes            │  Research argumentation patterns           │
│  ├── ASPIC+ Evaluation         │  Theory acceptability analysis             │
│  ├── Commitment Stores         │  Reviewer commitment tracking              │
│  └── Debate Sheets             │  Structured peer review                    │
│                                                                              │
│  Agora Feed                     │  Research discovery feed                   │
│  ├── Following system          │  Follow researchers by argument activity   │
│  ├── Plexus visualization      │  Cross-field claim mapping                 │
│  └── Event stream              │  Real-time conference deliberations        │
│                                                                              │
│  Article System                 │  Academic paper hosting                    │
│  ├── TipTap editor             │  Collaborative paper writing               │
│  ├── Annotation system         │  Structured paper commentary               │
│  └── Deliberation hosting      │  Paper response deliberations              │
│                                                                              │
│  Categorical Foundations        │  Transport across research areas           │
│  ├── RoomFunctor               │  Import arguments between fields           │
│  └── Canonical claims          │  Universal claim identifiers               │
│                                                                              │
│  Social/Profile System          │  Academic profiles & org pages             │
│  ├── User profiles             │  Researcher profiles with affiliations     │
│  └── Following                 │  Cross-institution connections             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 New Infrastructure Needed

| New Component | Purpose | Builds On |
|---------------|---------|-----------|
| **Organization model** | Institution/department/lab entities | User model |
| **ClaimExtraction pipeline** | PDF → structured claims | Source + LibraryPost |
| **Academic scheme set** | Research-specific argumentation patterns | Walton schemes |
| **Review workflow** | Peer review state machine | Deliberation phases |
| **Cross-discipline matching** | Semantic similarity for collaboration | Pinecone embeddings |

---

## 12. Prioritization Matrix

### 12.1 Impact vs. Effort Analysis

```
                         HIGH IMPACT
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           │  ★ Claim-based   │  ★ Paper-to-     │
           │    search        │    argument      │
           │                  │    extraction    │
           │  ★ Related       │                  │
           │    arguments     │  ★ Open peer     │
           │                  │    review        │
           │  ★ Journal club  │                  │
           │    template      │  ★ Organization  │
 LOW EFFORT├──────────────────┼──────────────────┤ HIGH EFFORT
           │                  │                  │
           │  ★ Conference    │  ★ Cross-field   │
           │    deliberations │    claim mapping │
           │                  │                  │
           │  ★ Argument-     │  ★ Translation   │
           │    level         │    deliberations │
           │    citations     │                  │
           │                  │  ★ AI reputation │
           │                  │    system        │
           │                  │                  │
           └──────────────────┼──────────────────┘
                              │
                         LOW IMPACT
```

### 12.2 Recommended Phasing

| Phase | Focus | Features |
|-------|-------|----------|
| **Phase 1: Foundation** | Enable academic workflows | Journal club template, Claim-based search, Related arguments |
| **Phase 2: Collaboration** | Cross-institutional features | Organization profiles, Shared research stacks, Multi-institution rooms |
| **Phase 3: Discovery** | Knowledge graph intelligence | Paper-to-argument extraction, Claim provenance, Attack queries |
| **Phase 4: Reputation** | Open science infrastructure | Public peer review, Argumentation reputation, Reviewer recognition |
| **Phase 5: Interdisciplinary** | Bridge-building features | Cross-field mapping, Translation deliberations, Collaboration matching |

---

## 13. Implementation Roadmap

### 13.1 Q1 2025: Academic Foundation

```
Week 1-4: Journal Club Deliberation Template
├── Define phase schema for journal club workflow
├── Create deliberation template model
├── Build phase-based UI with timed transitions
└── Add claim voting and aggregation

Week 5-8: Claim-Based Search
├── Extend Pinecone index with claim embeddings
├── Build claim search API with scheme/attack filters
├── Create search UI with claim-centric results
└── Add "Related arguments" panel to claim view

Week 9-12: Academic Profile Extensions
├── Add affiliation fields to User model
├── Create Organization model with relationships
├── Build organization profile pages
└── Add institutional badges to contributions
```

### 13.2 Q2 2025: Collaboration Infrastructure

```
Week 1-4: Shared Research Stacks
├── Extend Stack model with multi-org ownership
├── Build cross-institution collaboration UI
├── Add institutional access controls
└── Create stack discovery by field/topic

Week 5-8: Paper-to-Argument Pipeline (MVP)
├── Design ClaimExtraction model
├── Build AI-assisted claim extraction (GPT-4 + human verify)
├── Create extraction UI in Stack context
└── Link extracted claims to Source/Citation

Week 9-12: Multi-Institution Deliberations
├── Add affiliation tracking to deliberation participation
├── Build institutional commitment aggregation
├── Create cross-institution Plexus visualization
└── Add moderation tools for multi-org rooms
```

### 13.3 Q3-Q4 2025: Knowledge Graph & Open Science

```
Q3: Knowledge Graph Features
├── Claim provenance tracking
├── "What challenges this?" query engine
├── Argument-level citation support
└── Cross-deliberation claim mapping

Q4: Open Peer Review
├── Review workflow state machine
├── Public reviewer commitment tracking
├── Decision factor visibility
└── Reviewer recognition profiles
```

---

## 14. Open Questions for Further Exploration

### 14.1 Strategic Questions

1. **Partnership model**: Should Mesh partner with journals/conferences, or build independent reputation?
2. **Migration path**: How do researchers import existing citation libraries (Zotero, Mendeley)?
3. **Incentive design**: What motivates researchers to contribute structured arguments vs. just citing papers?
4. **Disciplinary customization**: Do different fields need different argumentation schemes?
5. **AI role**: How much claim extraction should be automated vs. human-verified?

### 14.2 Technical Questions

1. **Claim identity**: How to handle paraphrase/restatement across papers?
2. **Evidence quality**: How to weight different evidence types (RCT vs. case study)?
3. **Versioning**: How to handle claim evolution as research progresses?
4. **Scale**: How to maintain graph performance with millions of claims?
5. **Interoperability**: What export formats do researchers actually use?

### 14.3 Community Questions

1. **Moderation**: Who moderates academic deliberations? Disciplinary experts?
2. **Anonymity**: When is anonymous participation appropriate in academic contexts?
3. **Power dynamics**: How to handle professor/student dynamics in deliberations?
4. **Controversy**: How to handle politically charged scientific debates?
5. **Inclusivity**: How to make structured argumentation accessible to non-native speakers?

---

## 15. Summary: The Vision

Mesh is uniquely positioned to become the **infrastructure layer for scholarly discourse** that the academic community is missing. Unlike platforms focused on:

- **Distribution** (arXiv) → Mesh adds structured deliberation
- **Social networking** (ResearchGate) → Mesh adds formal argumentation
- **Citation tracking** (Semantic Scholar) → Mesh adds argument tracking
- **Reference management** (Zotero) → Mesh adds claim extraction and linking

Mesh can provide the **argument graph layer** that transforms how researchers:

1. **Discover** knowledge (by claims and arguments, not just papers)
2. **Collaborate** across institutions (through shared stacks and rooms)
3. **Debate** ideas (with typed attacks and commitment tracking)
4. **Review** work (with public, accountable, structured review)
5. **Build** on each other (through transportable arguments and canonical claims)

The existing infrastructure — Stacks, Deliberations, Plexus, ASPIC+, AIF — provides a foundation that no other platform has. The academic features proposed here are **extensions** of that foundation, not new systems.

**The goal**: Make Mesh the place where "Smith et al. 2023" becomes not just a citation, but a **living node in a global argument graph** that researchers can navigate, challenge, extend, and build upon.

---

*This document is a living brainstorm. Add ideas, challenge proposals, and iterate.*
