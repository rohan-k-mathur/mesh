# Agora Deliberation System Architecture
## Version 2.0 — Comprehensive Platform Documentation

---

## Executive Summary

### The Crisis of Collective Reasoning

Democratic societies depend on a capacity that current infrastructure actively undermines: the ability to reason together about complex questions. Climate adaptation, healthcare policy, technology governance, institutional reform—these challenges require collective intelligence that emerges from structured dialogue, not engagement metrics. Yet the platforms where public discourse occurs are optimized for attention capture, not deliberation. The result is predictable: polarization accelerates, trust erodes, and institutions lose the ability to justify their decisions to the publics they serve.

This is not a content moderation problem. It is an infrastructure problem. We lack the basic tooling to connect evidence to claims, claims to arguments, arguments to counter-arguments, and the entire structure to outcomes that communities can cite, audit, and build upon.

### What Agora Provides

The **Mesh Digital Agora** is a deliberation platform that treats reasoning as infrastructure. It provides:

- **Structured claim management**: Canonical assertions with stable identifiers, typed relationships (supports, rebuts, undercuts, undermines), and evidence linking
- **Scheme-based argumentation**: Arguments constructed using established patterns (Walton schemes) with automatically surfaced critical questions
- **Dialogue protocol enforcement**: Every assertion, challenge, and concession recorded as a dialogue move with provenance tracking
- **Composable knowledge artifacts**: Deliberations produce thesis documents, knowledge base pages, and exportable AIF graphs that persist as institutional memory

The platform implements a **progressive formalization architecture**—structure emerges on-demand as discourse complexity increases, rather than being imposed upfront. A casual discussion can remain lightweight. A policy deliberation can upgrade to full formal reasoning with scheme-based arguments, attack/defense tracking, and commitment stores. The same infrastructure serves both use cases.

### Architecture at a Glance

The system organizes reasoning into three layers:

| Layer | Purpose | Key Artifacts |
|-------|---------|---------------|
| **Claims & Evidence** | Transform informal ideas into canonical, evidence-linked assertions | Propositions, Claims, ClaimEdges, Evidence |
| **Arguments & Dialogue** | Structure reasoning with premises, conclusions, schemes, and tracked moves | Arguments, ArgumentChains, DialogueMoves, Commitments |
| **Outputs & Artifacts** | Compose reasoning into publishable, citable documents | Thesis, TheoryWorks, KbPages, DebateSheets |

All structures conform to the **Argument Interchange Format (AIF)** ontology, enabling interoperability with academic argumentation tools and ensuring that reasoning graphs can be exported, analyzed, and verified independently.

### Document Organization

This document is organized into three parts:

| Part | Sections | Purpose |
|------|----------|---------|
| **Part I: Conceptual Architecture** | 1–2 | Why the system exists, what problems it solves, and the design philosophy |
| **Part II: Technical Architecture** | 3–4 | Technology stack, data flows, and platform subsystems |
| **Part III: Reference Materials** | 5–7 | API routes, component hierarchies, theoretical foundations, and quick-reference guides |

For developers new to the codebase, start with Section 1 for conceptual orientation, then jump to the relevant subsystem in Section 4. The central UI orchestration component is `DeepDivePanelV2` (located at `components/deepdive/DeepDivePanelV2.tsx`), which connects all subsystems through a tabbed interface.

---

## Table of Contents

### Part I: Conceptual Architecture

1. [The Problem & Solution](#1-the-problem--solution)
   - [1.1 Why Good Decisions Are Hard](#11-why-good-decisions-are-hard)
   - [1.2 What's Broken Today](#12-whats-broken-today)
   - [1.3 What We Build Instead](#13-what-we-build-instead)

2. [Design Philosophy & Principles](#2-design-philosophy--principles)
   - [2.1 Progressive Formalization](#21-progressive-formalization)
   - [2.2 AIF-Centric Architecture](#22-aif-centric-architecture)
   - [2.3 Dialogue-First Reasoning](#23-dialogue-first-reasoning)
   - [2.4 Confidence & Uncertainty](#24-confidence--uncertainty)
   - [2.5 The Three Conceptual Layers](#25-the-three-conceptual-layers)
   - [2.6 Design Principles (Implemented)](#26-design-principles-implemented)

### Part II: Technical Architecture

3. [Platform Infrastructure](#3-platform-infrastructure)
   - [3.1 Technology Stack](#31-technology-stack)
   - [3.2 Three-Layer Formal Argumentation Engine](#32-three-layer-formal-argumentation-engine)
   - [3.3 Full Platform Architecture](#33-full-platform-architecture)
   - [3.4 Database Model Relationships](#34-database-model-relationships)
   - [3.5 State Management Architecture](#35-state-management-architecture)
   - [3.6 Background Processing](#36-background-processing)

4. [Subsystem Deep Dives](#4-subsystem-deep-dives)
   - [4.1 DeepDivePanelV2 — Central Hub](#41-deepdivepanelv2--central-hub)
   - [4.2 Dialogue Subsystem](#42-dialogue-subsystem)
   - [4.3 Claims Subsystem](#43-claims-subsystem)
   - [4.4 Arguments Subsystem](#44-arguments-subsystem)
   - [4.5 Schemes Subsystem](#45-schemes-subsystem)
   - [4.6 Chains Subsystem](#46-chains-subsystem)
   - [4.7 Ludics Subsystem](#47-ludics-subsystem)
   - [4.8 ASPIC Subsystem](#48-aspic-subsystem)
   - [4.9 Thesis & Outputs Subsystem](#49-thesis--outputs-subsystem)

### Part III: Reference Materials

5. [API Reference](#5-api-reference)
   - [5.1 API Route Organization](#51-api-route-organization)
   - [5.2 Key Response Shapes](#52-key-response-shapes)

6. [Theoretical Foundations](#6-theoretical-foundations)
   - [6.1 Abstract Argumentation (Dung)](#61-abstract-argumentation-dung)
   - [6.2 ASPIC+ Framework](#62-aspic-framework)
   - [6.3 Argument Interchange Format (AIF)](#63-argument-interchange-format-aif)
   - [6.4 Ludics (Girard)](#64-ludics-girard)
   - [6.5 PPD Protocol Rules](#65-ppd-protocol-rules)

7. [Quick Reference](#7-quick-reference)
   - [7.1 File Location Guide](#71-file-location-guide)
   - [7.2 Component Hierarchy](#72-component-hierarchy)
   - [7.3 Data Flow Diagrams](#73-data-flow-diagrams)
   - [7.4 Glossary](#74-glossary)

---

# Part I: Conceptual Architecture

This part explains *why* the system exists and the design philosophy that shapes it. Read this first if you're new to the project or need to understand the reasoning behind architectural decisions.

---

## 1. The Problem & Solution

### 1.1 Why Good Decisions Are Hard

Every organization—whether a company, a government agency, a nonprofit, or a community group—faces the same fundamental challenge: **how do you reason well together?**

Good collective decisions require several things that are surprisingly difficult to achieve:

1. **You need to see the reasoning, not just the conclusion.** When someone proposes "we should do X," you need to understand *why*—what evidence supports it, what assumptions underlie it, what alternatives were considered. Without this, you can't evaluate the decision or improve it.

2. **You need to navigate complexity.** Real questions generate dozens of claims, each supported or challenged by others, referencing different sources. Linear documents and threaded comments can't represent this structure. People either oversimplify or get lost.

3. **You need to know who said what and why.** Ideas shouldn't float anonymously. Every claim should have an author, a source, and a context. When claims conflict, there should be a clear way to trace the disagreement.

4. **You need arguments to get better, not just louder.** When someone finds a flaw in reasoning, there should be a path to address it—to strengthen the premise, acknowledge the limitation, or revise the conclusion. Most platforms reward winning arguments, not refining them.

5. **You need to build on prior work.** When a team spends months analyzing a question, that analysis shouldn't disappear when the project ends. Future teams facing similar questions should be able to find, reference, and extend that work.

These aren't exotic requirements. They're what thoughtful reasoning looks like. But current digital tools make all five nearly impossible.

### 1.2 What's Broken Today

The platforms where groups discuss important questions—email threads, Slack channels, Google Docs, comment sections—were not designed for structured reasoning. They're optimized for conversation, not deliberation.

| Problem | What Happens | What It Costs |
|---------|--------------|---------------|
| **No shared structure** | Ideas exist as prose, not as claims with explicit relationships | Disagreements become rhetorical battles rather than structured analysis |
| **Evidence is disconnected** | Sources live in attachments, footnotes, or separate documents | No way to trace a claim back to its grounds, or see what depends on disputed evidence |
| **No institutional memory** | Reasoning scatters across threads, docs, meetings, and email | Every discussion starts from scratch; past conclusions can't be cited or audited |
| **No path to resolution** | Comments pile up but don't converge toward conclusions | Decisions get made elsewhere (or not at all), without clear justification |

These aren't just inconveniences. They erode the ability of institutions to justify their decisions, of teams to learn from past analysis, and of communities to resolve disagreements constructively.

### 1.3 What We Build Instead

**The solution isn't "better comments."** It's infrastructure for reasoning—a method and data model that treats arguments as structured objects rather than unstructured text.

Agora provides:

- **Canonical claims**: Discrete assertions with stable identifiers that persist across contexts. When you reference "Claim #247," everyone is talking about the same thing.

- **Typed relationships**: Explicit structure showing how claims relate. Does A *support* B, *rebut* it, *undercut* the inference, or *undermine* a premise? The system distinguishes these.

- **Scheme-based reasoning**: Arguments built using recognized patterns (e.g., argument from expert opinion, argument from analogy) with automatically surfaced questions that challenge each pattern.

- **Dialogue tracking**: Every assertion, challenge, and concession recorded as a move in an ongoing dialogue, with full provenance (who, when, in response to what).

- **Composable outputs**: Deliberations produce documents, knowledge base pages, and exportable graphs that persist as institutional memory—citable, auditable, and extensible.

---

## 2. Design Philosophy & Principles

The architecture embodies four key principles that distinguish Agora from both traditional forums and document-centric collaboration tools.

### 2.1 Progressive Formalization

Not all conversations require formal structure. A team checking in on project status doesn't need argumentation schemes. A policy working group evaluating regulatory options does.

The system applies **progressive disclosure**: structure activates only when complexity warrants it. Users can stay in lightweight discussion mode indefinitely, or upgrade to full deliberation when formalization becomes valuable. The same platform serves casual check-ins and multi-year institutional deliberations.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PROGRESSIVE FORMALIZATION                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   INFORMAL                                                      FORMAL       │
│   ◄──────────────────────────────────────────────────────────────────►      │
│                                                                              │
│   Discussion     Proposition      Claim         Argument      Thesis/KB     │
│   (chat/forum)   (workshopping)   (canonical)   (structured)  (published)   │
│        │              │              │              │              │         │
│        │   upgrade    │   promote    │    link      │   publish    │         │
│        └──────────────┴──────────────┴──────────────┴──────────────┘         │
│                                                                              │
│   Structure emerges on-demand, not imposed upfront                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Currently Implemented Transitions**:

| Transition | Component | Description |
|------------|-----------|-------------|
| Discussion → Deliberation | `DeliberateButton` | Creates linked deliberation space from discussion |
| Proposition → Claim | `PromoteToClaimButton` | Elevates validated propositions to canonical claims |
| Claim → Argument | `AIFArgumentWithSchemeComposer` | Creates structured arguments with scheme selection |
| Argument → Thesis | `ThesisComposer` | Composes claims/arguments into legal-style documents |

### 2.2 AIF-Centric Architecture

Academic argumentation research has produced a standard for representing argument structures: the **Argument Interchange Format (AIF)**. Rather than inventing proprietary representations, Agora implements AIF as its canonical data model. This provides:

- **Interoperability**: Export to tools used in argumentation research and formal verification
- **Theoretical grounding**: Decades of research on argument semantics, attack types, and extension computation
- **Explicit structure**: Clear distinction between content (I-nodes), inference (RA-nodes), conflict (CA-nodes), and preference (PA-nodes)

| AIF Node Type | Description | Implementation |
|---------------|-------------|----------------|
| **I-node** (Information) | Propositions/claims containing content | `Claim`, `AifNode` (nodeKind='I') |
| **RA-node** (Rule of Application) | Inference steps applying schemes | `Argument`, `AifNode` (nodeKind='RA') |
| **CA-node** (Conflict Application) | Attack relations (rebut/undercut/undermine) | `ArgumentEdge`, `AifNode` (nodeKind='CA') |
| **PA-node** (Preference Application) | Priority/ordering relations | `AifNode` (nodeKind='PA') |
| **DM-node** (Dialogue Move) | Locutions in dialogue (WHY, GROUNDS, CONCEDE) | `DialogueMove`, `AifNode` (nodeKind='DM') |

### 2.3 Dialogue-First Reasoning

Arguments don't exist in isolation—they emerge through **structured dialogue**. Someone asserts a claim. Another participant challenges it ("WHY do you believe that?"). The original author provides grounds. A third party undercuts the inference. Each of these is a **dialogue move** with explicit semantics.

This dialogue-first approach means every structure in the system has provenance: who created it, when, in response to what. Arguments are not free-floating logical objects but moves in an ongoing conversation.

```
DialogueMove (locution) → creates → AifNode (content)
                       → records → who said what, when, in reply to what
```

**Implemented Move Types**: `ASSERT`, `WHY`, `GROUNDS`, `CONCEDE`, `RETRACT`, `CLOSE`

### 2.4 Confidence & Uncertainty

Real-world reasoning involves uncertainty. Premises may be likely rather than certain. Evidence may be partial. The system treats confidence as first-class, tracking it at multiple levels:

| Scope | Implementation | UI |
|-------|----------------|-----|
| Per-argument | `Argument.confidence` (0.0-1.0) | Confidence sliders in composers |
| Aggregation mode | `DeliberationState.confMode` | Product / Min toggle |
| Dempster-Shafer intervals | `Deliberation.dsMode` | DS Mode toggle in header |
| Temporal decay | `Argument.lastUpdatedAt` | Stale badges on old arguments |

This allows the system to distinguish between strongly-supported conclusions and tentative hypotheses, and to surface when previously confident conclusions have become stale due to lack of recent validation.

### 2.5 The Three Conceptual Layers

The platform organizes reasoning into three distinct but connected layers. Each layer builds on the one below, adding structure and formalization as needed.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         THREE CONCEPTUAL LAYERS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  LAYER 3: OUTPUTS & ARTIFACTS                                       │    │
│  │  Thesis • TheoryWorks • DebateSheets • KbPages • Briefs             │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │  Structured documents, visual maps, publishable knowledge            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              ▲                                               │
│                              │ composes                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  LAYER 2: ARGUMENTS & DIALOGUE                                      │    │
│  │  Arguments • ArgumentChains • Schemes • DialogueMoves • Commitments │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │  Scheme-based reasoning, attack/defense, formal dialogue protocol   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              ▲                                               │
│                              │ builds on                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  LAYER 1: CLAIMS & EVIDENCE                                         │    │
│  │  Discussions • Propositions • Claims • ClaimEdges • Evidence        │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │  Community input, workshopping, canonical atomic assertions          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Layer 1: Claims & Evidence

**Purpose**: Transform informal ideas into canonical, evidence-linked assertions.

The foundation of structured reasoning is the **claim**—a discrete assertion that can be referenced, linked, attacked, and defended. Claims emerge from informal discussion, get refined through community workshopping, and graduate to canonical status when they've proven their value.

| Component | Model | Key Features |
|-----------|-------|--------------|
| Discussions | `Discussion` | Forum-style threads, chat mode, upgradable to deliberation |
| Propositions | `Proposition` | Workshopping with votes, endorsements, replies |
| Claims | `Claim` | Canonical assertions with MOID identifiers, negation relations |
| ClaimEdges | `ClaimEdge` | Typed relations: SUPPORTS, REBUTS, UNDERCUTS, UNDERMINES |
| Evidence | `ClaimEvidence` | Citations with confidence, source URLs, CSL metadata |
| Contraries | `ClaimContrary` | ASPIC+ explicit contrary relations between claims |

#### Layer 2: Arguments & Dialogue

**Purpose**: Structure reasoning with explicit premises, conclusions, and inferential steps.

Arguments connect claims through inference. They reference **schemes**—recognized patterns of reasoning with **critical questions** that expose vulnerabilities. All activity is mediated by **dialogue moves** with explicit semantics.

| Component | Model | Key Features |
|-----------|-------|--------------|
| Arguments | `Argument` | Premise claims → conclusion claim, scheme reference, confidence |
| Premises | `ArgumentPremise` | Links claims as premises with role/order |
| Edges | `ArgumentEdge` | Inter-argument relations: ATTACK, SUPPORT |
| Schemes | `ArgumentScheme`, `ArgumentSchemeInstance` | Walton schemes with critical questions |
| Chains | `ArgumentChain`, `ArgumentChainNode`, `ArgumentChainEdge` | Threaded reasoning with scopes |
| Dialogue Moves | `DialogueMove` | ASSERT, WHY, GROUNDS, CONCEDE, RETRACT, CLOSE |
| Commitments | `Commitment` | Participant commitment stores for dialogue tracking |

#### Layer 3: Outputs & Artifacts

**Purpose**: Compose reasoning into publishable, citable artifacts.

Deliberation produces durable outputs that persist as institutional memory—citable, auditable, and available for future groups.

| Component | Model | Key Features |
|-----------|-------|--------------|
| Thesis | `Thesis`, `ThesisProng`, `ThesisProngArgument` | Legal-style structured documents |
| TheoryWorks | `TheoryWork` | Longform DN/IH/TC/OP frameworks |
| DebateSheet | `DebateSheet`, `DebateNode`, `DebateEdge` | Visual debate mapping |
| KbPages | `KbPage`, `KbBlock` | Knowledge base pages with block system |
| Briefs | `BriefCompiler` | Generated summaries from deliberation content |

### 2.6 Design Principles (Implemented)

These principles are not aspirations—they are constraints that the existing codebase satisfies. Each links to concrete implementation evidence.

| Principle | Description | Implementation |
|-----------|-------------|----------------|
| **AIF Compliance** | Argument graphs follow AIF ontology | `AifNode`, `AifEdge` with nodeKind (I/RA/CA/PA/DM) |
| **Dialogue Provenance** | Every structure has creator/move tracking | `createdByMoveId`, `introducedByMoveId` on models |
| **Scheme-Based Reasoning** | Arguments reference Walton schemes | `ArgumentScheme`, `ArgumentSchemeInstance`, CQ system |
| **Progressive Disclosure** | Simple tools first, power on-demand | Discussion → Deliberation, Proposition → Claim |
| **Commitment Tracking** | Participant positions are recorded | `Commitment` model, `CommitmentStorePanel` |
| **Attack Taxonomy** | Rebut/Undercut/Undermine distinguished | `ArgumentEdge.attackType`, `ArgumentAttackSubtype` |
| **Confidence Quantification** | Uncertainty modeled explicitly | Per-argument confidence, DS mode, temporal decay |
| **Composable Outputs** | Artifacts build on each other | Thesis references claims/arguments, KB cites deliberations |

---

# Part II: Technical Architecture

This part explains *how* the system is built. Read this when you need to understand implementation details, data flows, or specific subsystems.

---

## 3. Platform Infrastructure

### 3.1 Technology Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TECHNOLOGY STACK                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PRESENTATION        Next.js 14 (App Router) + React 18 + TypeScript        │
│                      Tailwind CSS, Radix UI, Tiptap (rich text)             │
│                      ReactFlow (graph visualization)                         │
│                                                                              │
│  STATE MANAGEMENT    SWR (data fetching & caching)                          │
│                      React Context + custom hooks                            │
│                      localStorage persistence for UI state                   │
│                                                                              │
│  API LAYER           Next.js Route Handlers (app/api/*)                     │
│                      REST conventions with JSON payloads                     │
│                                                                              │
│  DATA LAYER          Prisma ORM + PostgreSQL                                │
│                      Supabase (auth, realtime, storage)                     │
│                      Redis (caching, queues via BullMQ)                     │
│                                                                              │
│  EXTERNAL SERVICES   OpenAI (embeddings, generation)                        │
│                      Pinecone (vector search)                               │
│                      LiveKit (real-time communication)                      │
│                      Stripe (payments)                                      │
│                                                                              │
│  INFRASTRUCTURE      Node 18+, Yarn workspaces                              │
│                      AWS (S3, SES, KMS)                                     │
│                      Docker → Kubernetes (production)                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Three-Layer Formal Argumentation Engine

The core reasoning engine implements a three-layer formal argumentation architecture drawn from computational argumentation research:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AGORA DELIBERATION ENGINE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ LAYER 1: PROTOCOL (Social/Dialogue)                                   │  │
│  │ ─────────────────────────────────────────────────────────────────────  │  │
│  │ What moves are legal? What must you do after a challenge?              │  │
│  │                                                                        │  │
│  │ • Move types: ASSERT, WHY, GROUNDS, CONCEDE, RETRACT, CLOSE           │  │
│  │ • Force classification: ATTACK, SURRENDER, NEUTRAL                    │  │
│  │ • Legal move computation based on dialogue state                       │  │
│  │ • Commitment tracking per participant                                  │  │
│  │                                                                        │  │
│  │ Implementation: lib/dialogue/*, app/api/dialogue/*                    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                       │                                      │
│                                       ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ LAYER 2: GEOMETRY (Strategic/Game-Theoretic — Ludics)                 │  │
│  │ ─────────────────────────────────────────────────────────────────────  │  │
│  │ Where are we in the dialogue tree? Who has the initiative?             │  │
│  │                                                                        │  │
│  │ • Loci: Addresses in the interaction tree (e.g., "0.1.2.3")           │  │
│  │ • Polarity: P (proponent) vs O (opponent)                             │  │
│  │ • Acts: PROPER (regular) vs DAIMON (†, convergence)                   │  │
│  │ • Designs: Player strategies at each locus                            │  │
│  │ • Travel status: ONGOING, CONVERGENT, DIVERGENT                       │  │
│  │                                                                        │  │
│  │ Implementation: LudicDesign, LudicAct, app/api/ludics/*               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                       │                                      │
│                                       ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ LAYER 3: CONTENT (Semantic/Logical — AIF + Walton + ASPIC+)           │  │
│  │ ─────────────────────────────────────────────────────────────────────  │  │
│  │ What are the arguments? How do they relate? What's defensible?         │  │
│  │                                                                        │  │
│  │ • AIF nodes: I, RA, CA, PA, DM                                        │  │
│  │ • Argumentation schemes with Critical Questions                        │  │
│  │ • ASPIC+ attack types: REBUT, UNDERCUT, UNDERMINE                     │  │
│  │ • Grounded semantics: IN / OUT / UNDEC labeling                       │  │
│  │                                                                        │  │
│  │ Implementation: AifNode, AifEdge, ArgumentScheme, app/api/aif/*       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Layer Mappings to Codebase**:

| Layer | Subsystem | Key Models | Key API Endpoints | Key Components |
|-------|-----------|------------|-------------------|----------------|
| Protocol | Dialogue | `DialogueMove`, `Commitment` | `/api/dialogue/legal-moves`, `/api/dialogue/move` | `DialogueActionsButton`, `CommandCard`, `DialogueInspector` |
| Geometry | Ludics | `LudicDesign`, `LudicAct`, `LudicLocus` | `/api/ludics/designs`, `/api/ludics/step` | `LudicsPanel`, `LociTreeWithControls`, `BehaviourInspectorCard` |
| Content | Arguments/Claims | `AifNode`, `AifEdge`, `Argument`, `Claim` | `/api/aif/graph`, `/api/arguments/*`, `/api/claims/*` | `AIFArgumentsListPro`, `AifDiagramViewerDagre`, `AspicTheoryPanel` |

### 3.3 Full Platform Architecture

The three-layer engine is the core, but the full platform includes entry points, output generators, AI services, and background workers:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              MESH AGORA: FULL PLATFORM ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              ENTRY POINTS & CONTEXTS                                       │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │  Discussions │  │   Articles   │  │    Stacks    │  │     Rooms    │  │   KB Pages   │ │ │
│  │  │  (forum/chat)│  │  (longform)  │  │  (curated)   │  │  (real-time) │  │  (knowledge) │ │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │ │
│  │         └─────────────────┴─────────────────┼─────────────────┴─────────────────┘          │ │
│  │                                             ▼                                              │ │
│  │                               ┌──────────────────────────┐                                 │ │
│  │                               │      Deliberation        │                                 │ │
│  │                               │    (central container)   │                                 │ │
│  │                               └────────────┬─────────────┘                                 │ │
│  └────────────────────────────────────────────┼───────────────────────────────────────────────┘ │
│                                               ▼                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              CORE DELIBERATION ENGINE                                      │ │
│  │                                                                                            │ │
│  │  Claims & Evidence → Arguments & Schemes → Dialogue & Commitments                         │ │
│  │        ↓                     ↓                      ↓                                      │ │
│  │  Chains & Scopes → Ludics & Game Theory → AIF Graph (Unified)                             │ │
│  │                                                                                            │ │
│  └────────────────────────────────────────────┬───────────────────────────────────────────────┘ │
│                                               ▼                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              OUTPUT GENERATORS & ARTIFACTS                                 │ │
│  │      Thesis (legal-style) • TheoryWorks • DebateSheet • KB Pages • Briefs                 │ │
│  └────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              AI & COMPUTATIONAL SERVICES                                   │ │
│  │    OpenAI (generation) • Pinecone (search) • NLI (entailment) • Grounded Semantics        │ │
│  └────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              BACKGROUND WORKERS & CRON                                     │ │
│  │    Confidence Decay • Reembed (vectors) • KNN Builder • Shared Authors • Cron Jobs        │ │
│  └────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Entry Points**:

| Entry Point | Model | Description | Path to Deliberation |
|-------------|-------|-------------|---------------------|
| Discussion | `Discussion` | Lightweight forum/chat threads | `DeliberateButton` upgrades to deliberation |
| Article | `Article` | Longform content with annotations | Annotations spawn focused deliberations |
| Stack | `Stack`, `StackItem` | Curated collections | Stack items can anchor deliberations |
| Room | `AgoraRoom` | Real-time synchronous spaces | Deliberation is the room's primary content |
| KB Page | `KbPage` | Knowledge base entries | Can embed or link to deliberations |

### 3.4 Database Model Relationships

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CORE MODEL RELATIONSHIPS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                           ┌──────────────────┐                               │
│                           │   Deliberation   │                               │
│                           │   (root anchor)  │                               │
│                           └────────┬─────────┘                               │
│               ┌────────────────────┼────────────────────┐                    │
│               ▼                    ▼                    ▼                    │
│     ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │
│     │  DialogueMove   │  │      Claim      │  │   LudicDesign   │           │
│     │ (protocol acts) │  │ (content atoms) │  │ (geometry)      │           │
│     └────────┬────────┘  └────────┬────────┘  └────────┬────────┘           │
│              │                    │                    │                     │
│              │ creates            │ links to           │ contains            │
│              ▼                    ▼                    ▼                     │
│     ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │
│     │    Argument     │  │   ClaimEdge     │  │    LudicAct     │           │
│     │ (RA-node equiv) │  │ (support/attack)│  │ (moves @ loci)  │           │
│     └────────┬────────┘  └─────────────────┘  └────────┬────────┘           │
│              │                                         │                     │
│              │ syncs to                                │ syncs to            │
│              ▼                                         ▼                     │
│     ┌───────────────────────────────────────────────────────────┐           │
│     │                       AifNode / AifEdge                    │           │
│     │         (unified graph representation for export)          │           │
│     └───────────────────────────────────────────────────────────┘           │
│                                                                              │
│  Provenance tracking:                                                        │
│  • Argument.createdByMoveId → DialogueMove                                  │
│  • Claim.introducedByMoveId → DialogueMove                                  │
│  • AifNode.dialogueMoveId → DialogueMove                                    │
│  • AifNode.ludicActId → LudicAct                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.5 State Management Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       STATE MANAGEMENT LAYERS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  SERVER STATE (Prisma/PostgreSQL)                                   │    │
│  │  • All domain models (Deliberation, Claim, Argument, etc.)          │    │
│  │  • Fetched via Next.js Route Handlers                               │    │
│  │  • Single source of truth                                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              ▲                                               │
│                              │ fetch / mutate                                │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  SWR CACHE (Client)                                                 │    │
│  │  • Automatic caching and revalidation                               │    │
│  │  • Optimistic updates for mutations                                 │    │
│  │  • Real-time refresh via Supabase channels                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              ▲                                               │
│                              │ consume                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  COMPONENT STATE (React hooks)                                      │    │
│  │  • useDeliberationState - tab, config, UI toggles                   │    │
│  │  • useSheetPersistence - floating sheet open/close state            │    │
│  │  • useMinimapData - graph visualization data                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              ▲                                               │
│                              │ persist                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  PERSISTENT STATE (localStorage)                                    │    │
│  │  • Sheet positions and sizes                                        │    │
│  │  • User preferences                                                 │    │
│  │  • Draft content                                                    │    │
│  │  Key pattern: dd:sheets:${deliberationId}                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.6 Background Processing

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       BACKGROUND PROCESSING                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  WORKERS (BullMQ + Redis)                    Location: workers/              │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • decayConfidenceJob     - Decay argument confidence over time             │
│  • reembed                - Re-compute vector embeddings                    │
│  • user-knn-builder       - Build user similarity graphs                    │
│  • candidate-builder      - Build recommendation candidates                  │
│  • shared-authors-worker  - Sync shared authorship data                     │
│                                                                              │
│  CRON JOBS                                   Location: app/api/_cron/        │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • close_auctions         - Close expired auctions                          │
│  • daily_digest           - Send daily digest emails                        │
│  • cleanup                - Database maintenance                            │
│                                                                              │
│  QUEUE CONFIGURATION                         Location: lib/queue.ts          │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Redis connection via lib/redis.ts                                        │
│  • Job types defined per worker                                             │
│  • Retry policies and backoff configured                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Subsystem Deep Dives

Each subsystem handles a distinct aspect of the reasoning process. This section provides consistent documentation for each.

### 4.1 DeepDivePanelV2 — Central Hub

**Location**: `components/deepdive/DeepDivePanelV2.tsx` (~1861 lines)

**Purpose**: Central orchestration hub for all deliberation interfaces. Every deliberation in Mesh renders through this component.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEEPDIVEPANELV2 STRUCTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ FLOATING SHEETS                                                     │    │
│  │  Left: Graph Explorer (Claims/Arguments/Commitments/Analytics)      │    │
│  │  Right: Actions Sheet (Dialogue moves, AIF diagram viewer)          │    │
│  │  Terms: Deliberation Dictionary (Glossary)                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ HEADER                                                              │    │
│  │  StatusChip | Confidence Mode | DS Mode | Settings Toggle           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ MAIN TABS                                                           │    │
│  │  [Debate] [Arguments] [Chains] [Ludics] [Admin] [Sources]          │    │
│  │  [Thesis] [Analytics]                                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tab Details**:

| Tab | Primary Components | Purpose |
|-----|-------------------|---------|
| Debate | `DebateTab`, `PropositionsList`, `ClaimDetailPanel` | Main workspace for claims and propositions |
| Arguments | `AIFArgumentsListPro`, `SchemeBreakdown`, `AspicTheoryPanel` | Structured argument browsing with scheme analysis |
| Chains | `ChainsTab`, `ArgumentChainCanvas` | Build threaded argument chains with hypothetical scopes |
| Ludics | `LudicsPanel`, `BehaviourInspectorCard` | Game-theoretic dialogue analysis |
| Admin | `DiscourseDashboard`, `IssuesList`, `ActiveAssumptionsPanel` | Moderation and issue tracking |
| Sources | `EvidenceList` | View and rate evidence sources |
| Thesis | `ThesisListView`, `ThesisComposer` | Create legal-style structured documents |
| Analytics | `AnalyticsTab`, `CommitmentAnalyticsDashboard` | Participant agreement matrices |

**Key Imports**:

```typescript
// Tab Components
import { ArgumentsTab, AnalyticsTab, DebateTab } from "./v3/tabs";
import { ChainsTab } from "./v3/tabs/ChainsTab";

// State Hooks
import { useDeliberationState } from "./v3/hooks/useDeliberationState";
import { useSheetPersistence } from "./v3/hooks/useSheetPersistence";

// Visualization
import { AFMinimap } from '@/components/dialogue/minimap/AFMinimap';
import { AifDiagramViewerDagre } from "@/components/map/Aifdiagramviewerdagre";
```

### 4.2 Dialogue Subsystem

**Purpose**: Manages formal dialogue protocol (PPD moves), commitment tracking, and legal move computation.

**Key Models**: `DialogueMove`, `Commitment`, `DialogueVisualizationNode`

**API Endpoints**:
- `GET /api/dialogue/legal-moves` — Compute available moves for a target
- `POST /api/dialogue/move` — Execute a dialogue move
- `GET /api/dialogue/commitments` — Track participant commitments
- `GET /api/dialogue/contradictions` — Detect inconsistencies

```
┌───────────────────────────────────────────────────────────────┐
│                    DIALOGUE SUBSYSTEM                          │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  Move Types:                                                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ ASSERT  │ │  WHY    │ │ GROUNDS │ │ RETRACT │ │ CONCEDE │  │
│  │(neutral)│ │(attack) │ │(attack) │ │(surrender)│(surrender)│  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│                                                                │
│  Force Classification:                                         │
│  • ATTACK: WHY, GROUNDS                                        │
│  • SURRENDER: RETRACT, CLOSE, CONCEDE                         │
│  • NEUTRAL: ASSERT, THEREFORE                                  │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

**Key Components**:

| Component | Location | Purpose |
|-----------|----------|---------|
| `DialogueActionsButton` | `components/dialogue/DialogueActionsButton.tsx` | Trigger dialogue moves |
| `CommandCard` | `components/dialogue/command-card/CommandCard.tsx` | Visual move interface |
| `DialogueInspector` | `components/dialogue/DialogueInspector.tsx` | Move history viewer |
| `CommitmentStorePanel` | `components/aif/CommitmentStorePanel.tsx` | Track commitments |

**Key Libraries**:

| File | Purpose |
|------|---------|
| `lib/dialogue/legalMoves.ts` | Compute legal moves from dialogue state |
| `lib/dialogue/types.ts` | MoveKind, MoveForce type definitions |
| `lib/dialogue/movesToActions.ts` | Map moves to UI actions |
| `lib/dialogue/validate.ts` | Move validation rules |

### 4.3 Claims Subsystem

**Purpose**: Manage canonical atomic assertions, their relationships, and evidence linking.

**Key Models**: `Claim`, `ClaimEdge`, `ClaimEvidence`, `ClaimContrary`

**API Endpoints**:
- `GET/PATCH/DELETE /api/claims/[id]` — Claim CRUD
- `GET /api/claims/[id]/edges` — Claim relationships
- `POST /api/claims/[id]/label` — Compute semantic label (IN/OUT/UNDEC)
- `GET /api/claims/[id]/cq/summary` — Critical question status

```
┌───────────────────────────────────────────────────────────────┐
│                     CLAIMS SUBSYSTEM                           │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  Claim Status (Grounded Semantics):                           │
│  ┌────────┐ ┌────────┐ ┌────────┐                             │
│  │   IN   │ │  OUT   │ │ UNDEC  │                             │
│  │ (green)│ │  (red) │ │ (gray) │                             │
│  └────────┘ └────────┘ └────────┘                             │
│                                                                │
│  Claim Relationships (ClaimEdge types):                       │
│  • SUPPORTS: Claim A supports Claim B                         │
│  • REBUTS: Claim A attacks Claim B's conclusion               │
│  • UNDERCUTS: Claim A attacks the inference to B              │
│  • UNDERMINES: Claim A attacks a premise of B                 │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

**Key Components**:

| Component | Location | Purpose |
|-----------|----------|---------|
| `ClaimMiniMap` | `components/claims/ClaimMiniMap.tsx` | Network visualization |
| `CegMiniMap` | `components/deepdive/CegMiniMap.tsx` | Claim-evidence graph |
| `ClaimDetailPanel` | `components/claims/ClaimDetailPanel.tsx` | Claim inspector |
| `CriticalQuestionsV3` | `components/claims/CriticalQuestionsV3.tsx` | CQ interface |
| `PromoteToClaimButton` | `components/claims/PromoteToClaimButton.tsx` | Elevate proposition |

### 4.4 Arguments Subsystem

**Purpose**: Structured argumentation using the Argument Interchange Format (AIF).

**Key Models**: `Argument`, `ArgumentPremise`, `ArgumentEdge`, `ArgumentDiagram`, `AifNode`, `AifEdge`

**API Endpoints**:
- `GET/PATCH/DELETE /api/arguments/[id]` — Argument CRUD
- `GET /api/arguments/[id]/diagram` — AIF diagram data
- `POST /api/arguments/batch` — Bulk operations
- `GET /api/aif/graph` — Full AIF graph for deliberation
- `POST /api/aif/evaluate` — Compute grounded semantics

```
┌───────────────────────────────────────────────────────────────┐
│                   ARGUMENTS SUBSYSTEM (AIF)                    │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  AIF Node Types:                                               │
│  ┌────┐  I-Node: Information (claims, propositions)           │
│  │ I  │                                                        │
│  └────┘                                                        │
│  ┌────┐  RA-Node: Rule of Inference Application               │
│  │RA  │  (connects premises → conclusion via scheme)           │
│  └────┘                                                        │
│  ┌────┐  CA-Node: Conflict Application                        │
│  │CA  │  (attack relationships)                                │
│  └────┘                                                        │
│  ┌────┐  PA-Node: Preference Application                      │
│  │PA  │  (preference over conflicts)                           │
│  └────┘                                                        │
│                                                                │
│  Edge Roles:                                                   │
│  • premise: I → RA                                             │
│  • conclusion: RA → I                                          │
│  • conflictingElement: Attacker → CA                          │
│  • conflictedElement: CA → Target                             │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

**Key Components**:

| Component | Location | Purpose |
|-----------|----------|---------|
| `AIFArgumentsListPro` | `components/arguments/AIFArgumentsListPro.tsx` | Argument list with filters |
| `AIFArgumentWithSchemeComposer` | `components/arguments/AIFArgumentWithSchemeComposer.tsx` | Create with scheme |
| `ArgumentActionsSheet` | `components/arguments/ArgumentActionsSheet.tsx` | Attack/defend actions |
| `AifDiagramViewerDagre` | `components/map/Aifdiagramviewerdagre.tsx` | Graph visualization |

### 4.5 Schemes Subsystem

**Purpose**: Argumentation schemes (Walton) and critical questions.

**Key Models**: `ArgumentScheme`, `ArgumentSchemeInstance`, `CriticalQuestion`

**API Endpoints**:
- `GET /api/aif/schemes` — Full scheme catalog
- `GET /api/schemes/match` — Match text to schemes
- `GET /api/schemes/[key]` — Individual scheme details

```
┌───────────────────────────────────────────────────────────────┐
│                    SCHEMES SUBSYSTEM                           │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  Example: Argument from Expert Opinion                         │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Premises:                                                 │ │
│  │   P1: E is an expert in domain D                         │ │
│  │   P2: E asserts that A is true                           │ │
│  │   P3: A is within domain D                               │ │
│  │ Conclusion:                                               │ │
│  │   C: A is true (presumably)                              │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ Critical Questions:                                       │ │
│  │   CQ1: How credible is E as an expert?                   │ │
│  │   CQ2: Is E an expert in domain D?                       │ │
│  │   CQ3: What did E actually assert?                       │ │
│  │   CQ4: Is E reliable?                                    │ │
│  │   CQ5: Is A consistent with other experts?               │ │
│  │   CQ6: Is E's assertion based on evidence?               │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Attack Types (derived from CQs):                             │
│  • REBUTS: Attacks the conclusion directly                    │
│  • UNDERCUTS: Attacks the inference rule                      │
│  • UNDERMINES: Attacks a premise                              │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

**Key Components**:

| Component | Location | Purpose |
|-----------|----------|---------|
| `SchemeBreakdown` | `components/arguments/SchemeBreakdown.tsx` | Visual scheme structure |
| `SchemeNavigator` | `components/arguments/SchemeNavigator.tsx` | Browse scheme catalog |
| `SchemeSuggester` | `components/arguments/SchemeSuggester.tsx` | AI-assisted scheme matching |
| `ArgumentCriticalQuestionsModal` | `components/arguments/ArgumentCriticalQuestionsModal.tsx` | CQ interface |

### 4.6 Chains Subsystem

**Purpose**: Link arguments into coherent threads with epistemic scoping, visual canvas editing, and export capabilities.

**Key Models**: `ArgumentChain`, `ArgumentChainNode`, `ArgumentChainEdge`, `ArgumentScope`

**API Endpoints**:
- `GET/POST /api/chains` — Chain CRUD
- `GET/PATCH/DELETE /api/chains/[chainId]` — Individual chain
- `POST /api/chains/[chainId]/nodes` — Add node to chain
- `POST /api/chains/[chainId]/edges` — Create edge
- `GET/POST /api/chains/[chainId]/scopes` — Scope management
- `GET /api/chains/[chainId]/export/prose` — Export as prose
- `POST /api/chains/[chainId]/export/essay` — Generate AI essay

```
┌───────────────────────────────────────────────────────────────┐
│                    CHAINS SUBSYSTEM                            │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  Chain Types:                                                  │
│  • SERIAL: Linear sequence of arguments                       │
│  • LINKED: Multiple premises supporting one conclusion        │
│  • CONVERGENT: Independent arguments for same conclusion      │
│  • DIVERGENT: One argument supporting multiple conclusions    │
│                                                                │
│  Epistemic Status (per node):                                 │
│  ┌────────────┐  ASSERTED - claimed as true (default)        │
│  │     ✓      │                                               │
│  └────────────┘                                               │
│  ┌────────────┐  HYPOTHETICAL - "Suppose X..."               │
│  │    💡      │                                               │
│  └────────────┘                                               │
│  ┌────────────┐  COUNTERFACTUAL - "Had X been the case..."   │
│  │    🔮      │                                               │
│  └────────────┘                                               │
│  ┌────────────┐  QUESTIONED - under active challenge         │
│  │    🤔      │                                               │
│  └────────────┘                                               │
│  ┌────────────┐  DENIED - explicitly rejected                │
│  │    ✗       │                                               │
│  └────────────┘                                               │
│                                                                │
│  Scope Types (for hypothetical reasoning):                    │
│  • HYPOTHETICAL: "Suppose X..."                               │
│  • COUNTERFACTUAL: "Had X been the case..."                  │
│  • CONDITIONAL: "If X, then..."                              │
│  • OPPONENT: "The opponent might argue..."                   │
│  • MODAL: "It is possible that..."                           │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

**View Modes**:

| Mode | Purpose |
|------|---------|
| List | Simple list of all chains in deliberation |
| Thread | Linear conversation-style display |
| Canvas | Interactive ReactFlow graph visualization |
| Prose | Narrative text export |
| Essay | AI-generated structured essay |

**Key Components**:

| Component | Location | Purpose |
|-----------|----------|---------|
| `ChainsTab` | `components/deepdive/v3/tabs/ChainsTab.tsx` | Tab orchestration |
| `ArgumentChainCanvas` | `components/chains/ArgumentChainCanvas.tsx` | ReactFlow canvas |
| `ChainArgumentNode` | `components/chains/ChainArgumentNode.tsx` | Custom ReactFlow node |
| `ScopeBoundary` | `components/chains/ScopeBoundary.tsx` | Visual scope container |
| `EpistemicStatusBadge` | `components/chains/EpistemicStatusBadge.tsx` | Status indicator |
| `ChainProseView` | `components/chains/ChainProseView.tsx` | Prose export |
| `ChainEssayView` | `components/chains/ChainEssayView.tsx` | AI essay generation |

### 4.7 Ludics Subsystem

**Purpose**: Game-theoretic analysis of dialogue based on Girard's Ludics.

**Key Models**: `LudicDesign`, `LudicAct`, `LudicLocus`, `LudicTrace`, `LudicStrategy`

**API Endpoints**:
- `GET/POST /api/ludics/designs` — Design CRUD
- `GET/POST /api/ludics/acts` — Act CRUD
- `POST /api/ludics/step` — Execute interaction step
- `POST /api/ludics/sync-to-aif` — Sync geometry → content layer

```
┌───────────────────────────────────────────────────────────────┐
│                    LUDICS SUBSYSTEM                            │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  Core Concepts:                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Locus (α): Address in dialogue tree (e.g., "0.1.2")     │  │
│  │ Polarity: P (positive/asserts) or O (negative/queries)  │  │
│  │ Daimon (†): Termination marker (dialogue converges)     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  Act Types:                                                    │
│  • PROPER: Regular move with polarity and locus               │
│  • DAIMON: Termination signal (†)                             │
│                                                                │
│  Travel Status:                                                │
│  ┌──────────┐ ┌────────────┐ ┌────────────┐                   │
│  │ ONGOING  │ │ CONVERGENT │ │ DIVERGENT  │                   │
│  │(playing) │ │ (†,agreed) │ │(disagreed) │                   │
│  └──────────┘ └────────────┘ └────────────┘                   │
│                                                                │
│  Design Structure (Player Strategy):                          │
│  ┌───────────────────────────────────────┐                    │
│  │ Design for participant P              │                    │
│  │ ├── Act at locus "0" (positive)       │                    │
│  │ │   └── ramification: ["0.1", "0.2"]  │                    │
│  │ └── Act at locus "0.1.1" (positive)   │                    │
│  └───────────────────────────────────────┘                    │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

**Key Components**:

| Component | Location | Purpose |
|-----------|----------|---------|
| `LudicsPanel` | `components/deepdive/LudicsPanel.tsx` | Main ludics interface |
| `LociTreeWithControls` | `components/ludics/LociTreeWithControls.tsx` | Locus tree visualization |
| `TraceRibbon` | `components/ludics/TraceRibbon.tsx` | Interaction trace display |
| `BehaviourInspectorCard` | `components/ludics/BehaviourInspectorCard.tsx` | Strategy analysis |
| `JudgeConsole` | `components/ludics/JudgeConsole.tsx` | Ludics judge interface |

### 4.8 ASPIC Subsystem

**Purpose**: Formal argumentation framework (ASPIC+) for defeasible reasoning.

**Key Models**: `ClaimContrary`, grounded extension computation

**API Endpoints**:
- `GET/POST /api/contraries` — Contrary relation CRUD
- `POST /api/aif/evaluate` — Compute grounded extension

```
┌───────────────────────────────────────────────────────────────┐
│                    ASPIC+ SUBSYSTEM                            │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ASPIC+ Components:                                            │
│  • Strict Rules: ψ₁, ..., ψₙ → φ (cannot be attacked)         │
│  • Defeasible Rules: ψ₁, ..., ψₙ ⇒ φ (can be undercut)       │
│  • Contraries: ¬φ is contrary of φ                            │
│  • Preferences: Rule/premise ordering                         │
│                                                                │
│  Attack Types:                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Rebutting: A attacks B on conclusion                    │   │
│  │ Undermining: A attacks B on ordinary premise           │   │
│  │ Undercutting: A attacks B on defeasible rule           │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  Extension Semantics:                                          │
│  • Grounded: Unique minimal skeptical extension               │
│  • Preferred: Maximal admissible sets                         │
│  • Complete: All admissible with defended attacks             │
│                                                                │
│  Labeling:                                                     │
│  • IN: Argument is in the grounded extension                  │
│  • OUT: Argument is attacked by an IN argument                │
│  • UNDEC: Argument status is undecided                        │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

**Key Components**:

| Component | Location | Purpose |
|-----------|----------|---------|
| `AspicTheoryPanel` | `components/aspic/AspicTheoryPanel.tsx` | Theory visualization |
| `ConflictResolutionPanel` | `components/aspic/ConflictResolutionPanel.tsx` | Resolve conflicts |
| `GroundedExtensionPanel` | `components/aspic/GroundedExtensionPanel.tsx` | Show grounded set |
| `RationalityChecklist` | `components/aspic/RationalityChecklist.tsx` | Check argument quality |

### 4.9 Thesis & Outputs Subsystem

**Purpose**: Compose reasoning into publishable, citable artifacts.

**Key Models**: `Thesis`, `ThesisProng`, `ThesisProngArgument`, `TheoryWork`, `DebateSheet`, `KbPage`, `KbBlock`

**API Endpoints**:
- `GET/POST /api/thesis` — Thesis CRUD
- `GET/POST /api/thesis/[id]/prongs` — Prong management
- `GET/POST /api/theoryworks` — TheoryWork CRUD
- `GET/POST /api/kb/pages` — KB page CRUD

```
┌───────────────────────────────────────────────────────────────┐
│                    THESIS & OUTPUTS                            │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  Thesis Structure (Legal-style):                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Thesis                                                    │ │
│  │ ├── Title, Abstract                                       │ │
│  │ ├── ThesisProng (Claim 1)                                │ │
│  │ │   ├── ThesisProngArgument (supports prong)             │ │
│  │ │   └── ThesisProngArgument (supports prong)             │ │
│  │ ├── ThesisProng (Claim 2)                                │ │
│  │ │   └── ThesisProngArgument                              │ │
│  │ └── Conclusion                                            │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  TheoryWork Frameworks:                                        │
│  • DN: Deontological                                          │
│  • IH: Instrumental Harm                                      │
│  • TC: Teleological Consequentialist                         │
│  • OP: Original Position                                      │
│                                                                │
│  Other Outputs:                                                │
│  • DebateSheet: Visual debate mapping                         │
│  • KbPage: Knowledge base entries with blocks                 │
│  • Brief: AI-generated summaries                              │
│  • GlossaryTerm: Per-deliberation definitions                 │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

**Key Components**:

| Component | Location | Purpose |
|-----------|----------|---------|
| `ThesisComposer` | `components/thesis/ThesisComposer.tsx` | Create thesis documents |
| `ThesisRenderer` | `components/thesis/ThesisRenderer.tsx` | View thesis documents |
| `ThesisListView` | `components/thesis/ThesisListView.tsx` | List theses |
| `WorksList` | `components/works/WorksList.tsx` | Browse TheoryWorks |
| `KbPageEditor` | `components/kb/KbPageEditor.tsx` | Block-based KB editor |
| `BriefCompiler` | `components/brief/BriefCompiler.tsx` | AI brief generation |
| `DefinitionSheet` | `components/glossary/DefinitionSheet.tsx` | Glossary management |

---

# Part III: Reference Materials

This part provides quick-reference guides, API documentation, and theoretical background. Use this when you need to look something up quickly.

---

## 5. API Reference

### 5.1 API Route Organization

```
/api
├── dialogue/                    # Protocol layer
│   ├── legal-moves/            # GET - Compute available moves
│   ├── move/                   # POST - Execute a dialogue move
│   ├── move-aif/               # POST - AIF-aware move execution
│   ├── commitments/            # GET - Track commitments
│   ├── contradictions/         # GET - Detect contradictions
│   ├── open-cqs/               # GET - Open critical questions
│   └── forum/                  # Forum-mode dialogue
│
├── ludics/                      # Geometry layer
│   ├── designs/                # CRUD for LudicDesign
│   ├── acts/                   # CRUD for LudicAct
│   ├── step/                   # POST - Execute interaction step
│   ├── sync-to-aif/            # POST - Sync geometry → content
│   ├── strategies/             # Strategy analysis
│   └── correspondences/        # Behavior correspondence
│
├── aif/                         # Content layer (AIF)
│   ├── graph/                  # GET - Full AIF graph
│   ├── graph-with-dialogue/    # GET - Graph with dialogue context
│   ├── nodes/                  # CRUD for AifNode
│   ├── schemes/                # GET - Scheme catalog
│   ├── conflicts/              # CA-node management
│   ├── preferences/            # PA-node management
│   ├── evaluate/               # POST - Compute grounded semantics
│   ├── export/                 # GET - AIF-compliant export
│   └── validate/               # POST - Graph validation
│
├── arguments/                   # Argument CRUD
│   ├── [id]/                   # Individual argument
│   │   ├── route.ts            # GET/PATCH/DELETE
│   │   ├── diagram/            # GET - AIF diagram data
│   │   └── top-argument/       # GET - Best supporting
│   ├── batch/                  # POST - Bulk operations
│   └── search/                 # GET - Search arguments
│
├── claims/                      # Claim CRUD
│   ├── [id]/                   # Individual claim
│   │   ├── route.ts            # GET/PATCH/DELETE
│   │   ├── edges/              # GET - Relationships
│   │   ├── label/              # POST - Compute status
│   │   ├── ca/                 # POST - Create CA
│   │   └── cq/summary/         # GET - CQ status
│   ├── batch/                  # POST - Bulk operations
│   └── search/                 # GET - Search claims
│
├── chains/                      # Argument chains
│   ├── route.ts                # GET/POST - List/create
│   └── [chainId]/
│       ├── route.ts            # GET/PATCH/DELETE
│       ├── nodes/              # Node CRUD
│       ├── edges/              # Edge CRUD
│       ├── scopes/             # Scope CRUD
│       └── export/             # Prose/essay export
│
├── schemes/                     # Scheme catalog & matching
├── contraries/                  # ASPIC+ contrary relations
├── thesis/                      # Thesis documents
├── theoryworks/                 # TheoryWork CRUD
├── kb/                          # Knowledge base
│   └── pages/                  # KbPage CRUD
│
└── deliberations/               # Deliberation management
    └── [id]/
        ├── ludics/             # Ludics designs
        ├── viewpoints/         # Viewpoint selection
        └── chains/             # Argument chains
```

### 5.2 Key Response Shapes

```typescript
// Legal Moves Response
interface LegalMovesResponse {
  moves: LegalMove[];
  targetId: string;
  targetType: 'claim' | 'argument' | 'proposition';
  locusPath: string;
}

interface LegalMove {
  kind: MoveKind;       // ASSERT, WHY, GROUNDS, RETRACT, CONCEDE, CLOSE
  force: MoveForce;     // ATTACK, SURRENDER, NEUTRAL
  targetId: string;
  locusPath: string;
  cqId?: string;
  schemeKey?: string;
  label: string;
  description: string;
  enabled: boolean;
  disabledReason?: string;
}

// AIF Graph Response
interface AIFGraphResponse {
  nodes: AIFNode[];
  edges: AIFEdge[];
}

interface AIFNode {
  id: string;
  kind: 'I' | 'RA' | 'CA' | 'PA' | 'DM';
  label: string;
  schemeKey?: string;
  schemeName?: string;
  dialogueMoveId?: string;
  locutionType?: string;
}

interface AIFEdge {
  id: string;
  from: string;
  to: string;
  role: 'premise' | 'conclusion' | 'conflictingElement' | 
        'conflictedElement' | 'preferredElement';
}

// Commitment Store Response
interface CommitmentStoreResponse {
  participants: {
    userId: string;
    username: string;
    commitments: {
      claimId: string;
      claimText: string;
      status: 'ASSERTED' | 'CONCEDED' | 'RETRACTED';
      moveId: string;
      createdAt: string;
    }[];
  }[];
}
```

---

## 6. Theoretical Foundations

### 6.1 Abstract Argumentation (Dung)

```
An Abstract Argumentation Framework (AF) is a pair ⟨A, R⟩ where:
- A is a set of arguments
- R ⊆ A × A is an attack relation

Key Definitions:
- Conflict-free: S ⊆ A is conflict-free iff ∄a,b ∈ S: (a,b) ∈ R
- Admissible: S is admissible iff S is conflict-free and defends itself
- Grounded Extension: Unique minimal complete extension (skeptical)
- Preferred Extension: Maximal admissible sets (credulous)
```

### 6.2 ASPIC+ Framework

```
ASPIC+ extends Dung's AF with internal structure:

Components:
- Strict rules: X₁, ..., Xₙ → Y (deductive, cannot be attacked)
- Defeasible rules: X₁, ..., Xₙ ⇒ Y (presumptive, can be undercut)
- Contrariness function: ¯ (maps formulas to their contraries)
- Preference ordering: ≺ (over rules and/or premises)

Attack Types:
- Rebutting: Argument for ¬φ attacks argument for φ on its conclusion
- Undermining: Argument for ¬ψ attacks ordinary premise ψ
- Undercutting: Argument attacks the applicability of a defeasible rule
```

### 6.3 Argument Interchange Format (AIF)

```
AIF Ontology - Node Types:
┌──────────────────────────────────────────────────────────────┐
│  I-nodes (Information)                                        │
│  └── Content-bearing nodes (claims, propositions, data)       │
│                                                               │
│  S-nodes (Scheme Application)                                 │
│  ├── RA-nodes: Rule Application (inference steps)            │
│  ├── CA-nodes: Conflict Application (attacks)                │
│  ├── PA-nodes: Preference Application (priorities)           │
│  └── TA-nodes: Transition Application (dialogue acts)        │
└──────────────────────────────────────────────────────────────┘

Edge Types:
- Scheme fulfillment edges (premise → RA, RA → conclusion)
- Conflict edges (attacker → CA → target)
- Preference edges (PA → preferred element)
```

### 6.4 Ludics (Girard)

```
Ludics provides a game-theoretic semantics for dialogue:

Core Concepts:
- Locus (α): Address in interaction space (e.g., "0.1.2.3")
- Designs: Sets of chronicles (interaction sequences)
- Polarity: 
  - Positive (+): Asserts, provides content
  - Negative (−): Questions, challenges, requests
- Daimon (†): Termination marker indicating convergence

Interaction:
- Two designs interact by matching positive/negative acts at loci
- Convergent (†): Reaches daimon, indicating agreement/termination
- Divergent: Blocked, indicating unresolved disagreement

Application in Agora:
- DialogueMoves map to LudicActs
- Locus paths track dialogue tree position
- Travel status indicates deliberation convergence
```

### 6.5 PPD Protocol Rules

The system implements a Protocol for Persuasion Dialogues:

```
┌─────────────┬──────────────┬──────────────────────────────────┐
│ Move Kind   │ Force        │ Effect                           │
├─────────────┼──────────────┼──────────────────────────────────┤
│ ASSERT      │ NEUTRAL      │ Adds claim to commitment store   │
│ WHY         │ ATTACK       │ Challenges a commitment          │
│ GROUNDS     │ ATTACK       │ Provides justification           │
│ RETRACT     │ SURRENDER    │ Withdraws a commitment           │
│ CONCEDE     │ SURRENDER    │ Accepts opponent's claim         │
│ CLOSE       │ SURRENDER    │ Ends branch (daimon †)           │
│ THEREFORE   │ NEUTRAL      │ Derives conclusion               │
│ SUPPOSE     │ NEUTRAL      │ Hypothetical assertion           │
│ DISCHARGE   │ NEUTRAL      │ Exits supposition                │
└─────────────┴──────────────┴──────────────────────────────────┘

Key Invariants:
- R4: No duplicate reply to same target/locus/key
- R5: No attacks on surrendered/closed targets
- R7: Cannot concede directly if WHY was answered by GROUNDS
```

---

## 7. Quick Reference

### 7.1 File Location Guide

**Core Panel**:
| File | Purpose |
|------|---------|
| `components/deepdive/DeepDivePanelV2.tsx` | Main orchestration (~1861 lines) |

**V3 Tab Components**:
| File | Purpose |
|------|---------|
| `components/deepdive/v3/tabs/DebateTab.tsx` | Debate tab |
| `components/deepdive/v3/tabs/ArgumentsTab.tsx` | Arguments tab |
| `components/deepdive/v3/tabs/ChainsTab.tsx` | Chains tab |
| `components/deepdive/v3/tabs/AnalyticsTab.tsx` | Analytics tab |

**V3 Hooks**:
| File | Purpose |
|------|---------|
| `components/deepdive/v3/hooks/useDeliberationState.ts` | Deliberation state |
| `components/deepdive/v3/hooks/useSheetPersistence.ts` | Sheet persistence |

**Dialogue**:
| File | Purpose |
|------|---------|
| `components/dialogue/DialogueActionsButton.tsx` | Trigger moves |
| `components/dialogue/command-card/CommandCard.tsx` | Move interface |
| `components/dialogue/DialogueInspector.tsx` | Move history |
| `lib/dialogue/legalMoves.ts` | Legal move computation |
| `lib/dialogue/types.ts` | Type definitions |

**Arguments**:
| File | Purpose |
|------|---------|
| `components/arguments/AIFArgumentsListPro.tsx` | Argument list |
| `components/arguments/AIFArgumentWithSchemeComposer.tsx` | Argument composer |
| `components/arguments/SchemeBreakdown.tsx` | Scheme visualization |
| `components/arguments/ArgumentActionsSheet.tsx` | Attack menu |

**Visualization**:
| File | Purpose |
|------|---------|
| `components/map/Aifdiagramviewerdagre.tsx` | AIF graph |
| `components/claims/ClaimMiniMap.tsx` | Claim network |
| `components/deepdive/CegMiniMap.tsx` | Claim-evidence graph |

**Ludics**:
| File | Purpose |
|------|---------|
| `components/deepdive/LudicsPanel.tsx` | Ludics interface |
| `components/ludics/LociTreeWithControls.tsx` | Locus tree |
| `packages/ludics-core/types.ts` | Core types |

**ASPIC**:
| File | Purpose |
|------|---------|
| `components/aspic/AspicTheoryPanel.tsx` | Theory panel |
| `components/aspic/ConflictResolutionPanel.tsx` | Conflict resolution |

**Backend Services**:
| File | Purpose |
|------|---------|
| `app/server/services/ArgumentGenerationService.ts` | Argument generation |
| `app/server/services/NetIdentificationService.ts` | Net identification |

**Database**:
| File | Purpose |
|------|---------|
| `lib/models/schema.prisma` | Full schema (~6989 lines) |
| `lib/prismaclient.ts` | Prisma client singleton |
| `lib/redis.ts` | Redis client |
| `lib/queue.ts` | BullMQ queue setup |

### 7.2 Component Hierarchy

```
DeepDivePanelV2
├── ConfidenceProvider (Context)
│
├── StickyHeader
│   ├── StatusChip
│   ├── ChipBar (Rule, Confidence, DS Mode)
│   └── DiscusHelpPage
│
├── FloatingSheet [Left] - "Graph Explorer"
│   ├── Tab: Arguments → DialogueAwareGraphPanel
│   ├── Tab: Claims → CegMiniMap
│   ├── Tab: Commitments → CommitmentStorePanel
│   └── Tab: Analytics → CommitmentAnalyticsDashboard
│
├── FloatingSheet [Right] - "Actions & Diagram"
│   ├── DialogueActionsButton
│   ├── CommandCard
│   └── DiagramViewer
│
├── FloatingSheet [Terms] - "Dictionary"
│   └── DefinitionSheet
│
└── Tabs (Main Content)
    ├── "debate" → DebateTab
    │   ├── Discussion → ThreadedDiscussionTab
    │   ├── Propositions → PropositionComposerPro, PropositionsList
    │   ├── Claims → ClaimMiniMap, DialogueInspector
    │   └── Sheet View → DebateSheetReader
    │
    ├── "arguments" → ArgumentsTab
    │   ├── All Arguments → AIFArgumentsListPro
    │   ├── Create → AIFArgumentWithSchemeComposer
    │   ├── Schemes → SchemesSection
    │   ├── Networks → NetworksSection
    │   └── ASPIC → AspicTheoryPanel
    │
    ├── "chains" → ChainsTab
    │   ├── ChainListPanel
    │   ├── ArgumentChainThread
    │   ├── ArgumentChainCanvas
    │   ├── ChainProseView
    │   └── ChainEssayView
    │
    ├── "ludics" → LudicsPanel
    │   ├── LociTreeWithControls
    │   ├── TraceRibbon
    │   ├── JudgeConsole
    │   └── BehaviourInspectorCard
    │
    ├── "admin"
    │   ├── DiscourseDashboard
    │   ├── IssuesList
    │   ├── CQ Review Dashboard
    │   └── ActiveAssumptionsPanel
    │
    ├── "sources" → EvidenceList
    │
    ├── "thesis"
    │   ├── ThesisListView
    │   ├── ThesisComposer (Modal)
    │   └── ThesisRenderer (Modal)
    │
    └── "analytics" → AnalyticsTab
```

### 7.3 Data Flow Diagrams

**Dialogue Move Flow**:
```
User clicks Claim
      │
      ▼
Fetch Legal Moves (/api/dialogue/legal-moves)
      │
      ▼
Show CommandCard with available moves
      │
      ▼
User selects move
      │
      ▼
POST /api/dialogue/move
      │
      ├─── Create DialogueMove
      ├─── Update Commitments
      ├─── Sync to LudicAct
      └─── Sync to AifNode
      │
      ▼
SWR revalidation → UI updates
```

**Argument Creation Flow**:
```
User fills scheme form
      │
      ▼
POST /api/arguments
      │
      ├─── Create Argument
      ├─── Create ArgumentSchemeInstance
      ├─── Create I-nodes (AIF)
      ├─── Create RA-node (AIF)
      └─── Create edges
      │
      ▼
Link to Claim (conclusion)
      │
      ▼
Refresh AIFArgumentsListPro
```

**Commitment Store Flow**:
```
┌─────────────────────────────────────────────────────────────────┐
│  User A: ASSERT(φ) → Commitment Store A: {φ}                    │
│                                                                  │
│  User B: WHY(φ)? → Challenge pending on φ                       │
│                                                                  │
│  User A: GROUNDS(ψ→φ) → Commitment Store A: {φ, ψ→φ}           │
│                                                                  │
│  User B: CONCEDE(φ) → Commitment Store B: {φ}                   │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 Glossary

| Term | Definition |
|------|------------|
| **AIF** | Argument Interchange Format — standard ontology for representing argumentation |
| **ASPIC+** | Structured argumentation framework with strict/defeasible rules and attack types |
| **CA-node** | Conflict Application node — represents an attack relationship in AIF |
| **CQ** | Critical Question — challenge specific to an argumentation scheme |
| **Daimon (†)** | Termination marker in Ludics indicating convergence/agreement |
| **Deliberation** | A structured discussion/debate instance in Mesh |
| **Grounded Extension** | Unique minimal skeptical extension of arguments (IN/OUT/UNDEC) |
| **I-node** | Information node — content-bearing node in AIF (claims, propositions) |
| **Locus** | Address in Ludics interaction space (e.g., "0.1.2") |
| **PA-node** | Preference Application node — priority/ordering in AIF |
| **Polarity** | P (positive/assertive) or O (negative/questioning) in Ludics |
| **PPD** | Protocol for Persuasion Dialogues |
| **RA-node** | Rule Application node — inference step in AIF |
| **Rebut** | Attack on an argument's conclusion |
| **Scheme** | Argumentation pattern (e.g., Argument from Expert Opinion) |
| **Undercut** | Attack on an argument's inference rule |
| **Undermine** | Attack on an argument's premise |

---

*Document Version: 2.0*
*Last Updated: December 12, 2025*
*Status: Comprehensive Platform Documentation*

