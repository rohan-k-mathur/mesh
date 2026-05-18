# Ludics System Architecture

## Overview

The Isonomia platform implements a **Ludics** subsystem for game-theoretic argumentation, based on Girard's interaction-as-meaning programme and extended for use as a deliberation substrate. Ludics complements the platform's AIF (Argument Interchange Format) ontology and ASPIC+ rule layer by providing a *geometric* account of dialogue: positions are loci in a tree, moves are polarised acts, meaning is computed by *interaction* (normalisation against a counter-design), and validity is witnessed by *orthogonality* rather than by external semantics.

This document describes the system design, data model, runtime engine, and integration surfaces of that subsystem.

Ludics in Isonomia is based on:
- Girard, J.-Y. (2001). "Locus Solum: from the rules of logic to the logic of rules"
- Faggian, C. & Hyland, M. (2002). "Designs, disputes and strategies"
- Terui, K. (2011). "Computational ludics"
- Fouqueré, C. & Quatrini, M. (2013). "Ludics and natural language: first approaches"

The Isonomia implementation extends classical ludics with:
- **Scoped designs** — topic / actor-pair / argument scoping so a single deliberation can host many parallel design forests instead of one monolithic tree (Phase 4).
- **Behaviour & incarnation layer** — first-class behaviours (⊢ξ), material designs, incarnations, and saturation checks usable as a typing discipline for dialogue (Phase 5, in progress).
- **DDS layer** — Designs, Disputes & Strategies framework realising Faggian–Hyland strategies, innocence/propagation checks, plays, views, chronicles, and arena/game simulation (Phases 2–3).
- **AIF correspondence** — bidirectional mapping between ludics designs and AIF I/RA/CA nodes, with verification and repair tooling.
- **Commitment grounding** — dialogue commitments are anchored in loci via `LudicCommitmentElement`, giving the commitment store a geometric semantics.
- **Cross-scope delocation** — fax / shift operations let a design reference a locus that lives in another scope, supporting analogical and cross-topic argumentation.

---

## Table of Contents

| # | Section | What's in it |
| --- | --- | --- |
| 1 | [Overview](#overview) | Subsystem purpose, theoretical basis, Isonomia-specific extensions. |
| 2 | [System Architecture Diagram](#system-architecture-diagram) | End-to-end ASCII diagram from UI through API, engine, and persistence. |
| 3 | [Theoretical Foundations](#theoretical-foundations) | Loci, polarised acts, designs, interaction, orthogonality, behaviours/incarnations *(Phase 5)*, strategies/plays/chronicles, delocation. |
| 4 | [Core Domain Model](#core-domain-model) | Per-entity walk of `LudicLocus`, `LudicDesign`, `LudicAct`, `LudicTrace`, `LudicChronicle` with field tables. |
| 5 | [Type Definitions](#type-definitions) | Core TS types from `packages/ludics-core/types.ts`, engine option types, Zod boundary schemas, "where to look first". |
| 6 | [Data Pipeline](#data-pipeline) | Primary pipeline + sequence diagrams for compile, step, and AIF sync; side-pipelines for behaviours, strategies/DDS, and game/arena. |
| 7 | [The DDS Framework](#the-dds-framework) | Faggian–Hyland framework: designs ↔ strategies, innocence + propagation, four correspondence isomorphisms, code map of `dds/` subdirs. |
| 8 | [Engine Subsystems](#engine-subsystems) | Module-by-module walk of `packages/ludics-engine/` (Compiler, Stepper, Orthogonality, Transformations, Behaviours, Strategies, Judge·Concession·Daimon, VE, AIF bridge, Plugins). |
| 9 | [API Layer](#api-layer) | Route tables: classic engine routes, design routes, DDS routes; generate→verify→render sequence. |
| 10 | [UI Components](#ui-components) | `packages/ludics-react/` primitives, `components/ludics/` shell (top-level, DDS, analysis, arena, game, viewers), `LudicsPanel` orchestration. |
| 11 | [Persistence Layer](#persistence-layer) | Schema cluster overview (Geometry / Interaction / DDS / DDS caches / Behaviours-Types-Arena), detail per cluster, migration convention. |
| 12 | [Integration Points](#integration-points) | Cross-system bridges: AIF, ASPIC, Dialogue, Commitments, Deliberation, Insights. |
| 13 | [Caching & Concurrency](#caching--concurrency) | Three cache layers (Postgres / Redis / SWR), two concurrency primitives (in-process mutex + Postgres advisory lock), coherence invariants. |
| 14 | [Phases & Implementation History](#phases--implementation-history) | Six-phase history with status (1–4 ✅ Landed, 5 🔄 In progress, 6 🔄 Starting). |
| 15 | [Theory Postulates](#theory-postulates) | 15 numbered postulates (P1–P15) with theory provenance + enforcing module. |
| 16 | [Extensions & Open Issues](#extensions--open-issues) | Isonomia extensions over classical ludics; open technical issues; roadmap pointers. |
| 17 | [References](#references) | Primary theory, companion Isonomia docs, in-repo code anchors. |

### Quick-reference: "I want to…"

| Goal | Start here |
| --- | --- |
| Understand the runtime as a whole | §2 → §6 |
| Find the model for a database entity | §4 (geometry) → §11 (full schema map) |
| Locate the right API endpoint | §9 |
| Identify the engine module to change | §8 + §3 for the theory it implements |
| Understand the DDS / Faggian–Hyland layer | §7 |
| Check what theoretical postulate a piece of code enforces | §15 |
| Find a UI component | §10 |
| Trace cross-system effects (AIF / ASPIC / Commitments) | §12 |
| Know what's done vs. in progress | §14 |
| Cite a paper | §17.1 |

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    USER INTERFACE                                     │
│                                                                                      │
│  DeepDive tab → components/deepdive/LudicsPanel.tsx (orchestrator)                  │
│                                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────┐ │
│  │ LudicsForest │  │ LociTree-    │  │ Behaviour-   │  │ Analysis-    │  │ Arena/ │ │
│  │  (scopes)    │  │ WithControls │  │ Inspector    │  │ Panel        │  │ Game   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────┬───┘ │
│         │                 │                 │                 │               │     │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐  ┌────┴───┐ │
│  │ Design-      │  │ TraceRibbon  │  │ TensorProbe  │  │ Views/       │  │ Inter- │ │
│  │ TreeView     │  │ JudgeConsole │  │ Saturation   │  │ Chronicles   │  │ action │ │
│  │ Commitments- │  │ ActInspector │  │ TypeSystem   │  │ Explorer     │  │ Player │ │
│  │ Panel        │  │ DefenseTree  │  │ (Phase 5)    │  │ (Phase 4)    │  │ (Ph 6) │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  └────────┘ │
│                                                                                      │
│  Reusable primitives: packages/ludics-react/*                                       │
└───────────────────────────────────────────┬─────────────────────────────────────────┘
                                            │  fetch / SWR
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                     API LAYER                                        │
│                                 app/api/ludics/**                                    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  Compile / Step                                                              │    │
│  │  POST /compile          dialogue → designs (with scoping strategy)          │    │
│  │  POST /step             one interaction step against a design pair           │    │
│  │  POST /compile-step     compile + step, also extract-path / landscape /      │    │
│  │                         analyze-strength                                     │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────────┐   │
│  │ Designs              │  │ Acts / Traces        │  │ Orthogonality / Insights │   │
│  │ GET  /designs         │  │ POST /acts            │  │ GET /orthogonal           │   │
│  │ GET  /designs/by-     │  │ (append acts /        │  │ GET /insights             │   │
│  │      deliberation     │  │  daimon)              │  │                            │   │
│  │ GET  /designs/[id]/   │  │                      │  │                            │   │
│  │      semantic         │  │                      │  │                            │   │
│  │ POST /designs/        │  │                      │  │                            │   │
│  │      semantic/batch   │  │                      │  │                            │   │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────────────┘   │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────────┐   │
│  │ Transformations      │  │ Additive / Uniform.  │  │ Judge / Concession       │   │
│  │ POST /fax            │  │ POST /additive/pick  │  │ POST /judge/force          │   │
│  │ POST /fax/clone      │  │ GET  /uniformity/    │  │ POST /concession           │   │
│  │ POST /fax/branch     │  │      check           │  │                            │   │
│  │ POST /delocate       │  │                      │  │                            │   │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────────────┘   │
│                                                                                      │
│  Adjacent: app/api/loci/**, app/api/compose/**, app/api/orthogonality/**,           │
│            app/api/aif-sync/                                                        │
│  Validation: packages/ludics-rest/zod.ts                                            │
└───────────────────────────────────────────┬─────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               ENGINE LIBRARY LAYER                                   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  packages/ludics-core/  —  pure theory                                       │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│    │
│  │  │  types.ts   │ │   paths.ts  │ │   errors.ts │ │  ve.ts / ve/pathCheck   ││    │
│  │  │ (Act/Locus) │ │ (LocusPath) │ │ (LudicError)│ │  (virtual evaluation)   ││    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────────┘│    │
│  │  ┌──────────────────────────  dds/ (the DDS framework)  ───────────────────┐│    │
│  │  │ types/  interaction/  arena/  game/  behaviours/  correspondence/        ││    │
│  │  │ extraction/  landscape/  strategy/  adapters/  analysis/                 ││    │
│  │  └──────────────────────────────────────────────────────────────────────────┘│    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  packages/ludics-engine/  —  runtime                                         │    │
│  │  stepper · compileFromMoves · orthogonal · checkOrthogonal · decisive       │    │
│  │  uniformity · concession · faxClone · delocate · copy · appendActs · judge  │    │
│  │  testers · visibility · locks · defenseTree · daimon · policies · saturation│    │
│  │  detect-collisions · rule-parser · aif-sync · plugins/  examples/           │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  lib/ludics/  —  app glue                                                    │    │
│  │  ensureBaseline · computeInsights · insightsCache · aifCorrespondence       │    │
│  │  syncToAif · appendActs · visibility · locks · delocate                     │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  packages/ludics-react/  —  reusable UI primitives                           │    │
│  │  LociTree · TraceRibbon · DefenseTree · JudgeConsole · CommitmentsPanel     │    │
│  │  ActInspector · mergeDesignsToTree · modeLabels                             │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────┬─────────────────────────────────────────┘
                                            │  Prisma
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               DATA PERSISTENCE LAYER                                 │
│                          (Prisma + PostgreSQL, ~25+ models)                          │
│                                                                                      │
│  Core game-theoretic                  Strategic analysis (DDS)                       │
│  ┌────────────────┐ ┌─────────────┐   ┌──────────────┐ ┌──────────────┐              │
│  │  LudicLocus    │ │ LudicDesign │   │ LudicStrategy│ │  LudicPlay   │              │
│  │  LudicAct      │ │ LudicTrace  │   │ LudicStrate- │ │  LudicInno-  │              │
│  │  LudicChronicle│ │             │   │   gyView     │ │  cenceCheck  │              │
│  └────────────────┘ └─────────────┘   └──────────────┘ └──────────────┘              │
│                                                                                      │
│  Property checks                       Correspondence / typing                       │
│  ┌──────────────────────┐              ┌────────────────────┐ ┌─────────────────┐    │
│  │ LudicOrthogonality-  │              │ LudicCorrespondence│ │ LudicBehaviour  │    │
│  │   Check              │              │ LudicIsomorphism-  │ │ LudicMaterial-  │    │
│  │ LudicPropagation-    │              │   Check            │ │   Design        │    │
│  │   Check              │              │                    │ │ LudicIncarnation│    │
│  │ LudicBiorthogonal-   │              │                    │ │ LudicPosition   │    │
│  │   Closure            │              │                    │ │ LudicGame /     │    │
│  └──────────────────────┘              └────────────────────┘ │ LudicGame-      │    │
│                                                                │   Position      │    │
│                                                                └─────────────────┘    │
│  Commitments & decisions               Utilities & caches                            │
│  ┌──────────────────────┐              ┌────────────────────┐ ┌─────────────────┐    │
│  │ LudicCommitment-     │              │   LudicView        │ │ LudicFaxMap     │    │
│  │   Element / State    │              │   LudicDispute     │ │ LudicDispute-   │    │
│  │ LudicDecisionReceipt │              │                    │ │   Cache         │    │
│  │ CommitmentLudic-     │              │                    │ │ LudicChronicle- │    │
│  │   Mapping            │              │                    │ │   Cache         │    │
│  └──────────────────────┘              └────────────────────┘ └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Theoretical Foundations

Ludics replaces the syntax/semantics distinction of classical logic with a single notion: **designs interact**. A design is a strategy in a debating game whose positions are addressed by **loci** (paths in an infinite forest). Two designs of opposite polarity (Proponent / Opponent) reduce against one another; the reduction either **converges** at a `†` (daimon) — witnessing agreement — or **diverges** — witnessing a disagreement that cannot be resolved within the current strategies. Isonomia adopts this picture verbatim and adds an operational vocabulary suited to deliberation.

### Loci

A **locus** is a finite sequence of natural numbers `ξ = 0.i₁.i₂.…` representing a node in the ludics forest. In Isonomia, loci are persisted as [`LudicLocus`](lib/models/schema.prisma#L5281) records with a string `path` field (`"0.1.2"`), a `parentId`, and a `dialogueId` scope so the same path can be reused safely across deliberations without collision. The root path is `"0"`.

| Ludics concept | Isonomia realisation |
| --- | --- |
| Locus `ξ` | `LudicLocus.path` (scoped by `dialogueId`) |
| Sub-locus `ξ·i` | child `LudicLocus` with `parentId` set |
| Ramification `{i₁, …, iₙ}` | `LudicAct.ramification: string[]` |
| Locus tree under `ξ` | recursive query over `LudicLocus` parent/child |

### Acts and polarity

An **act** is either *proper* — a positive or negative move that opens a ramification at a locus — or the **daimon** `†`, the act that closes a play by giving up further interaction. Polarity alternates: positive acts (`P`) are owned by Proponent, negative acts (`O`) by Opponent. Isonomia's [`LudicAct`](lib/models/schema.prisma#L5350) carries `kind ∈ {PROPER, DAIMON}`, `polarity ∈ {P, O}`, a `locusId`, a `ramification` array, an optional `expression` (natural-language gloss), and an `isAdditive` flag distinguishing exclusive from cumulative branching.

```
positive act at ξ        negative act at ξ          daimon
       †                                              †
   ┌───┴───┐               ξ      ↑                   │
   ξ·0    ξ·1              ↑ │                       end of play
   (P opens {0,1})         (O focuses on ξ)         (agreement)
```

The act type surface lives in [packages/ludics-core/types.ts](packages/ludics-core/types.ts) (`ProperAct`, `DaimonAct`, `DialogueAct`, `Polarity`, `LocusPath`).

### Designs

A **design** is a coherent set of acts forming a strategy: it tells you, at every reachable position of one polarity, what the player does. In Isonomia a design is a [`LudicDesign`](lib/models/schema.prisma#L5302) row associated with a `participantId` ("Proponent" / "Opponent" by convention, or a user id), a `rootLocusId`, and an ordered `acts` collection. A deliberation typically has at least one Proponent design and one Opponent design per *scope*; the scope columns (`scope`, `scopeType`, `scopeMetadata`) are Isonomia's extension allowing many design pairs in the same room without collision.

### Interaction (normalisation)

Two designs of opposite polarity interact by walking their respective trees in lockstep. At each step the active player picks a ramification; the other player must respond at one of those children. The walk produces a **trace** — Isonomia's [`LudicTrace`](lib/models/schema.prisma#L5386) — with `status ∈ {ONGOING, CONVERGENT, DIVERGENT, STUCK}` and an ordered `steps` array of `{posActId, negActId, locusPath, ts}` pairs. **Convergence** occurs when both players reach `†` at the same locus; **divergence** when no compatible move exists.

### Orthogonality

Two designs `D` and `E` are **orthogonal** (`D ⊥ E`) iff their interaction converges. Orthogonality is the fundamental relation in ludics — types/behaviours are defined as biorthogonal closures `A = A^⊥⊥`. Isonomia exposes orthogonality via `GET /api/ludics/orthogonal` and caches results in [`LudicOrthogonalityCheck`](lib/models/schema.prisma); biorthogonal closures are persisted as [`LudicBiorthogonalClosure`](lib/models/schema.prisma).

### Behaviours, incarnations and uniformity *(Phase 5, in progress)*

A **behaviour** at base `⊢ξ` is a set of designs closed under biorthogonality — Isonomia's [`LudicBehaviour`](lib/models/schema.prisma) row. An **incarnation** is a representative material design realising membership in a behaviour ([`LudicMaterialDesign`](lib/models/schema.prisma), [`LudicIncarnation`](lib/models/schema.prisma)). **Uniformity** is the regularity condition asking that a design treat fresh sub-loci interchangeably; Isonomia verifies it through `packages/ludics-engine/uniformity.ts` and the `/api/ludics/uniformity/check` endpoint, with `uniformBound` cached on `LudicBehaviour`. **Saturation** bounds the behavioural reach of a design and is checked by `packages/ludics-engine/saturation.ts`.

### Strategies, plays, chronicles, views (DDS layer)

The Faggian–Hyland reformulation re-presents designs as **strategies** consisting of **plays** (complete interaction paths), with **innocence** (a play depends only on the player's own view) and **propagation** (consistency across plays) as the key properties. Isonomia implements this layer explicitly:

- [`LudicStrategy`](lib/models/schema.prisma) — innocent / propagation flags, play count
- [`LudicPlay`](lib/models/schema.prisma) — individual play with terminal acts and a `locusPath`
- [`LudicStrategyView`](lib/models/schema.prisma) — projection of the strategy as seen by a player
- [`LudicChronicle`](lib/models/schema.prisma#L5377) — ordered record of acts realising a play
- [`LudicInnocenceCheck`](lib/models/schema.prisma) / [`LudicPropagationCheck`](lib/models/schema.prisma) — verification artefacts

See [§6 The DDS Framework](#the-dds-framework) for the full treatment.

### Delocation (fax)

A locus can be **delocated** — renamed by a `LocusPath → LocusPath` map — without changing the underlying design. This is the formal device that lets two designs originally living in different loci interact. In Isonomia, delocation is the basis for cross-scope reasoning: a design in scope `topic:foo` may reference a locus in `topic:bar` via a `LudicFaxMap` row, and the engine modules [`faxClone.ts`](packages/ludics-engine/faxClone.ts) and [`delocate.ts`](packages/ludics-engine/delocate.ts) materialise the renaming during compilation and stepping.

### Why this matters for deliberation

Ludics gives Isonomia four things its other argumentation layers do not:

1. **A purely interactional notion of meaning.** A claim's content is its behaviour under attack — not a fixed proposition. This matches how participants actually argue.
2. **Convergence as agreement.** Mutual `†` is a *structural* witness of consensus, distinct from majority vote or grounded labelling.
3. **A geometric commitment store.** Commitments live at loci, so retraction and concession map to concrete tree operations rather than predicate manipulation.
4. **A type discipline for dialogue.** Behaviours classify designs by their conduct; over time this gives the platform a way to recognise *kinds* of arguments structurally.

---

## Core Domain Model

The Isonomia ludics domain is built from five core entities and their relationships:

```
                          ┌─────────────────────┐
                          │   LudicLocus        │
                          │  (path, dialogueId) │◄──────────────┐
                          └─────────┬───────────┘               │
                                    │ rootLocus                 │ locus
                                    │                           │
                                    ▼                           │
       deliberationId    ┌─────────────────────┐                │
       participantId     │   LudicDesign       │                │
       scope, scopeType  │  (P or O strategy)  │                │
       ─────────────────►│                     │◄───────────┐   │
                         └────┬──────────┬─────┘            │   │
                              │          │                  │   │
                       acts   │          │ chronicles       │   │
                              ▼          ▼                  │   │
                   ┌──────────────┐  ┌──────────────────┐   │   │
                   │  LudicAct    │  │ LudicChronicle   │   │   │
                   │ (P/O/Daimon, │  │ (ordered acts    │   │   │
                   │  ramification)──►│  realising play) │   │   │
                   └──────┬───────┘  └──────────────────┘   │   │
                          │                                  │   │
                          └──────────────────────────────────┼───┘
                                                             │
                          ┌─────────────────────┐            │
                          │   LudicTrace        │  posDesign │
                          │ (status, steps[],   │────────────┤
                          │  decisiveIndices)   │  negDesign │
                          └─────────────────────┘────────────┘
```

### LudicLocus — addresses in the forest

[`LudicLocus`](lib/models/schema.prisma#L5281) is the addressing primitive. A locus has a `path` (e.g. `"0.1.2"`), an optional `parentId` (enabling tree queries), a `dialogueId` scope (so `"0"` is per-dialogue rather than global), and an opaque `extJson` for engine-specific annotations. The composite unique key `(dialogueId, path)` is the invariant that prevents collisions when many deliberations or scopes co-exist.

Loci are *created lazily* during compilation: when a move opens a fresh ramification, the engine writes the new child loci and links them via `parentId`. The `LudicFaxMap` join table records delocation pairs (`fromLocusId → toLocusId`) so that cross-scope references can be resolved without copying the underlying tree.

### LudicDesign — the strategy

[`LudicDesign`](lib/models/schema.prisma#L5302) is the unit of strategic content. Every design is bound to a `deliberationId` and a `participantId`, anchored at a `rootLocus`, and carries a `semantics` tag (currently `"ludics-v1"`) and a monotonically increasing `version` for cache invalidation. The `hasDaimon` flag marks whether the design has been closed by a `†` somewhere.

Isonomia extends the classical design with four columns critical to scaling beyond single-debate examples:

| Column | Purpose |
| --- | --- |
| `scope` | Scope key (`"topic:<id>"`, `"actors:<id1>:<id2>"`, `"argument:<id>"`, or null for legacy / global) |
| `scopeType` | Discriminator (`"topic"`, `"actor-pair"`, `"argument"`) |
| `scopeMetadata` | JSON with label, actor ids, source topic/argument id, move count |
| `referencedScopes` / `crossScopeActIds` | Delocation: scopes this design imports loci from, and which acts carry the import |

A typical room with three topics and two active actors will therefore have many `LudicDesign` rows — one Proponent + one Opponent per scope, optionally with cross-scope references — instead of a single P/O pair. [`LudicsForest`](components/ludics/LudicsForest.tsx) is the UI that surfaces these as a paginated forest grouped by scope.

### LudicAct — the moves

[`LudicAct`](lib/models/schema.prisma#L5350) records a single move within a design. Key fields:

| Field | Meaning |
| --- | --- |
| `kind` | `PROPER` (positive/negative move) or `DAIMON` (`†`) |
| `polarity` | `P` (Proponent) or `O` (Opponent); null for daimon |
| `locusId` | The locus this act acts at (null for some daimons) |
| `ramification` | String suffixes of children opened by this act (e.g. `["0", "1"]`) |
| `expression` | Optional natural-language gloss |
| `isAdditive` | True ⇒ the ramification is exclusive (one child must be picked) |
| `orderInDesign` | Compile-time ordering for replay |

Acts are the only entities the engine *executes*. The stepper walks two designs by reading their acts in order, matching ramification suffixes, and emitting trace pairs. Each `LudicAct` has at most one back-reference from an `AifNode` — the bridge that lets ludics moves appear as RA/CA-nodes in the AIF graph (see §11).

### LudicTrace — the interaction record

[`LudicTrace`](lib/models/schema.prisma#L5386) captures a single interaction between two designs. Fields:

| Field | Meaning |
| --- | --- |
| `deliberationId`, `posDesignId`, `negDesignId` | Scope and participating designs |
| `startLocusId` | Locus interaction started at (typically the root) |
| `steps` (JSON) | Ordered `{posActId, negActId, locusPath, ts}[]` |
| `status` | `ONGOING` \| `CONVERGENT` \| `DIVERGENT` \| `STUCK` (engine-only) |
| `endedAtDaimonForParticipantId` | Which player played `†` at convergence |
| `extJson` | Phase / composition mode / decisive indices / additive choices |

The engine also tracks fields that don't yet have first-class columns and are written into `extJson`: `decisiveIndices` (forced steps), `usedAdditive` (which child suffix was picked at each additive locus), `endorsement` (cross-locus convergence witness), and `daimonHints` (suggestions when the design has no moves left).

### LudicChronicle — the play record

[`LudicChronicle`](lib/models/schema.prisma#L5377) is the design-side counterpart to a trace: it records, *for one design*, the ordered sequence of acts realising a particular play. Where `LudicTrace` is symmetric (two designs interacting), `LudicChronicle` is the projection onto one player's view, which is what the DDS strategy layer (§6) consumes.

### Relationships at a glance

```
LudicLocus  1 ── *  LudicLocus           (parent/child within the forest)
LudicLocus  1 ── *  LudicAct             (every act acts at a locus)
LudicLocus  1 ── *  LudicDesign          (rootLocus pointer)
LudicLocus  1 ── *  LudicFaxMap          (as source or target of delocation)
LudicLocus  1 ── *  LudicCommitmentElement (commitments are grounded in loci)

LudicDesign 1 ── *  LudicAct
LudicDesign 1 ── *  LudicChronicle
LudicDesign 1 ── *  LudicTrace           (as posDesign or negDesign)
LudicDesign 1 ── *  LudicStrategy        (DDS layer — §6)
LudicDesign * ── *  LudicCommitmentElement
LudicDesign 1 ── *  LudicView            (projections / explorers)
LudicDesign 1 ── *  LudicCorrespondence  (AIF ↔ ludics bridge)

LudicAct    0..1 ── 1  AifNode           (back-reference; how ludics shows up in AIF)
```

---

## Type Definitions

This section enumerates the TypeScript surface that every other layer programs against. There are three concentric rings: the pure theory types in [packages/ludics-core/types.ts](packages/ludics-core/types.ts), the runtime result/option types in [packages/ludics-engine/](packages/ludics-engine/), and the API boundary schemas in [packages/ludics-rest/zod.ts](packages/ludics-rest/zod.ts).

### Core types — `packages/ludics-core/types.ts`

```ts
// addressing
export type LocusPath    = string;            // "0.1.2"
export type Polarity     = "P" | "O" | "pos" | "neg" | "daimon";
export type TravelStatus = "ONGOING" | "CONVERGENT" | "DIVERGENT";
export type FocusPhase   = "focus-P" | "focus-O" | "neutral";
```

**Acts.** A `ProperAct` is a polarised move at a locus that opens a `ramification` (the suffixes of children it makes available). A `DaimonAct` is the terminator `†`. `DialogueAct` is the wire-format superset accepted by the engine and the API; it tolerates both `'P' | 'O'` and `'pos' | 'neg' | 'daimon'` so callers can use either convention.

```ts
export type ProperAct = {
  kind:        "PROPER";
  polarity:    Polarity;
  locus:       LocusPath;        // must exist or be created in LudicLocus
  ramification: string[];        // child suffixes / named slots
  expression?: string;
  additive?:   boolean;          // additive gate at this locus
  isAdditive?: boolean;
  meta?:       Record<string, unknown>;
};

export type DaimonAct = {
  kind:        "DAIMON";
  expression?: string;           // optional reason / label for †
};

export type DialogueAct = {
  kind?:        string;
  polarity?:    "pos" | "neg" | "daimon" | "O" | "P";
  locus?:       string;
  ramification?: string[];
  locusPath?:   string;
  openings?:    string[];        // children opened by this act
  expression?:  string;
  additive?:    boolean;
};
```

**Designs and moves.** A `LudicDesign` (the engine value, not the Prisma row) carries a `base` (initial loci) and an ordered `acts`. The `MovePayload` shape is what flows in from the dialogue side via `compileFromMoves`:

```ts
export type LudicDesign = {
  id?:   string;
  base?: LocusPath[];            // default ["0"]
  acts:  DialogueAct[];
};

export type MovePayload = {
  cqId?:       string;           // critical-question id when the move targets one
  locusPath?:  string;           // defaults to "0"
  expression?: string;
  original?:   string;
  acts?:       DialogueAct[];    // explicit acts override
};
```

**Traces.** Interaction produces a `TracePair` sequence; the high-level engine output is `StepResult`, the type every UI consumer reads:

```ts
export type TracePair = {
  posActId: string;
  negActId: string;
  ts:       number;
  actor?:   string;
};

export type StepResult = {
  status:    "ONGOING" | "CONVERGENT" | "DIVERGENT" | "STUCK";
  pairs:     { posActId?: string; negActId?: string; locusPath: string; ts: number }[];
  decisiveIndices?:           number[];                  // why interaction ended
  endedAtDaimonForParticipantId?: "Proponent" | "Opponent";
  usedAdditive?:              Record<string, string>;    // parentPath → chosen suffix
  daimonHints?:               DaimonHint[];              // suggested closures
  endorsement?:               Endorsement;               // cross-locus convergence
  reason?:                    "timeout" | "incoherent-move" | "additive-violation"
                            | "no-response" | "consensus-draw" | "dir-collision";
  collisions?:                { base: string; dirs: string[] }[];
  shiftInserted?:             boolean;
  terminated?:                boolean;
  terminatedFor?:             ("Proponent" | "Opponent")[];
  traceId?:                   string;
};

export type DaimonHint = {
  locusPath: string;
  act: { polarity: "daimon"; locus: string; openings: []; additive: false;
         reason: "no-openings" };
};

export type Endorsement = {
  locusPath:       string;
  byParticipantId: string;
  viaActId:        string;
};
```

### Engine option types — `packages/ludics-engine/`

The runtime adds three orthogonal axes on top of the core types:

| Axis | Values | Where set | Effect |
| --- | --- | --- | --- |
| `phase` | `focus-P` \| `focus-O` \| `neutral` | `stepInteraction` opts; `?phase=` query | Restrict moves to one player or allow both |
| `compositionMode` | `assoc` \| `partial` \| `spiritual` | `stepInteraction` opts; preflight | Inference style governing how loci are opened and shared |
| `scopingStrategy` | `legacy` \| `topic` \| `actor-pair` \| `argument` | `compileFromMoves` opts | How moves are grouped into design pairs |

The `stepInteraction` option object also accepts virtual testers — synthetic O-acts (`virtualNegPaths`) and consensus draw markers (`drawAtPaths`) — used by the Behaviour Inspector to probe a design without permanently committing acts.

```ts
// packages/ludics-engine/stepper.ts
export async function stepInteraction(opts: {
  dialogueId:       string;
  posDesignId:      string;
  negDesignId:      string;
  startPosActId?:   string;
  maxPairs?:        number;
  phase?:           FocusPhase;
  maskNamesAt?:     string[];                    // hide child names from testers
  virtualNegPaths?: string[];                    // synthesise O at these paths
  drawAtPaths?:    string[];                    // treat no-response as draw
  compositionMode?: CompositionMode;
  focusAt?:         string | null;               // pin traversal under this locus
}): Promise<StepResult>;

// packages/ludics-engine/compileFromMoves.ts
export type ScopingStrategy = "legacy" | "topic" | "actor-pair" | "argument";

export async function compileFromMoves(
  deliberationId: string,
  options?: { scopingStrategy?: ScopingStrategy; forceRecompile?: boolean }
): Promise<CompileResult>;
```

### API boundary — `packages/ludics-rest/zod.ts`

Every API route validates its body / query against a Zod schema co-located in the REST package. The most important schemas:

| Schema | Used by | Shape (abbreviated) |
| --- | --- | --- |
| `zStep` | `POST /api/ludics/step` (basic) | `{ dialogueId, posDesignId, negDesignId, startPosActId?, maxPairs? }` |
| `zStepExtended` | `POST /api/ludics/step` (full) | `zStep` + `{ phase, fuel ≤ 10000, compositionMode, testers[] }` |
| `zAppendActs` | `POST /api/ludics/acts` | `{ designId, enforceAlternation?, acts: ProperAct \| DaimonAct }` |
| `zOrthogonal` | `GET /api/ludics/orthogonal` | `{ dialogueId, posDesignId, negDesignId }` |
| `zFax` | `POST /api/ludics/fax` | `{ fromLocusPath, toLocusPath }` |
| `zConcession` | `POST /api/ludics/concession` | `{ dialogueId, concedingParticipantId, receiverParticipantId, anchorDesignId, proposition: { text, csLocus }, anchorLocus }` |
| `zJudgeForce` | `POST /api/ludics/judge/force` | `{ dialogueId, action: FORCE_CONCESSION \| ASSIGN_BURDEN \| CLOSE_BRANCH, target?, data? }` |
| `zApplyCS` | commitment-store ops | `{ ownerId, add?, erase? }` |
| `zCommitmentsApply` | `POST /api/dialogue/commitments/apply` | `{ dialogueId, ownerId, ops: { add[], erase[] }, autoPersistDerived? }` |

`zStepExtended` is the canonical engine call shape: it constrains `fuel` to a server-safe ceiling (10 000 pairs) and provides the `testers` discriminated union used by the Behaviour Inspector:

```ts
testers: ({ kind: "herd-to";      parentPath: string; child: string } |
          { kind: "timeout-draw"; atPath: string })[]
```

### Where to look first

| Need | File |
| --- | --- |
| Add a new act kind | [packages/ludics-core/types.ts](packages/ludics-core/types.ts) → engine handlers → Prisma `LudicActKind` enum |
| Change step semantics | [packages/ludics-engine/stepper.ts](packages/ludics-engine/stepper.ts) |
| Extend the public API | [packages/ludics-rest/zod.ts](packages/ludics-rest/zod.ts) + corresponding `app/api/ludics/**/route.ts` |
| Add a scoping rule | [packages/ludics-engine/compileFromMoves.ts](packages/ludics-engine/compileFromMoves.ts) (`ScopingStrategy`) |
| Surface a new metric | [lib/ludics/computeInsights.ts](lib/ludics/computeInsights.ts) → [lib/ludics/insightsCache.ts](lib/ludics/insightsCache.ts) → `GET /api/ludics/insights` |

---

## Data Pipeline

The ludics subsystem has one primary pipeline (dialogue → designs → interaction → AIF) and three side pipelines (behaviour analysis, strategy/DDS, game/arena). This section gives the canonical flow followed by sequence diagrams for each operation.

### Primary pipeline

```
   Dialogue Moves                                AIF Graph
  (DialogueMove rows)                          (AifNode + AifEdge)
         │                                              ▲
         │                                              │
         │  compileFromMoves                            │  syncLudicsToAif
         ▼                                              │
   LudicDesign(s)        stepInteraction         LudicCorrespondence
   LudicLocus tree   ─────────────────────►      (1-to-1 act ↔ node map)
   LudicAct stream                                      ▲
         │                                              │
         │  appendActs / fax / delocate                 │  verifyAifCorrespondence
         ▼                                              │
   LudicTrace ─── LudicChronicle ─── LudicStrategy ─────┘
   (status,            (per-design       (innocence,
    pairs[],            ordered act       propagation,
    decisive idx)       sequence)         plays, views)
```

### Sequence 1 — Compile from dialogue moves

`POST /api/ludics/compile` materialises dialogue moves into ludics designs. The route delegates to [`compileFromMoves`](packages/ludics-engine/compileFromMoves.ts), which runs inside a Prisma transaction.

```
Client                /api/ludics/    compileFrom      lib/ludics/   Prisma
                      compile         Moves            locks
  │                      │              │                  │           │
  │ POST {deliber-       │              │                  │           │
  │  ationId,            │              │                  │           │
  │  scopingStrategy}    │              │                  │           │
  │ ───────────────────► │              │                  │           │
  │                      │ withCompileLock(deliberationId) ──────────► │
  │                      │              │   (advisory lock acquired)   │
  │                      │ compileFromMoves(deliberationId, opts) ──►  │
  │                      │              │ ensureRoot(dialogueId="0") ► │
  │                      │              │ loadMoves(deliberationId) ─► │
  │                      │              │ groupByScope(strategy)       │
  │                      │              │   ├─ topic    → "topic:<id>"│
  │                      │              │   ├─ actors   → "actors:.."  │
  │                      │              │   └─ argument → "argument:.."│
  │                      │              │ for each scope:              │
  │                      │              │   upsert LudicDesign(P)  ──► │
  │                      │              │   upsert LudicDesign(O)  ──► │
  │                      │              │   for each move:             │
  │                      │              │     expandActsFromMove(m)    │
  │                      │              │     upsert LudicLocus     ─► │
  │                      │              │     insert LudicAct       ─► │
  │                      │              │     (linkAifNode if origin   │
  │                      │              │      move had aifNodeId)     │
  │                      │              │ resolveCrossScopeRefs        │
  │                      │              │   → LudicFaxMap entries   ─► │
  │                      │              │ invalidateInsightsCache   ─► │
  │                      │ ◄── { designs: [...], scopes: [...] }       │
  │ ◄── 200 OK { ok:true, designs, scopes, stats }                     │
```

Notes:
- The advisory lock from [`lib/ludics/locks.ts`](lib/ludics/locks.ts) serialises compilation per deliberation; concurrent calls wait rather than producing duplicate designs.
- `expandActsFromMove` is the small interpreter that turns a single `DialogueMove` (with its `kind`, `polarity`, `payload.acts?`) into one or more `DialogueAct` values.
- `forceRecompile: true` drops the existing `LudicDesign` rows for the deliberation before re-running; otherwise compilation is incremental.

### Sequence 2 — Step interaction

`POST /api/ludics/step` is the workhorse for everything game-theoretic. The stepper walks the two designs in lockstep, producing a `StepResult`.

```
Client            /api/ludics/   stepInteraction     Prisma     packages/ludics-core/
                  step                                            ve (path check)
  │                  │                │                │             │
  │ POST zStep-      │                │                │             │
  │  Extended        │                │                │             │
  │ ───────────────► │                │                │             │
  │                  │ stepInteraction(opts) ────────► │             │
  │                  │                │ resolvePair(posId,negId)     │
  │                  │                │   load LudicDesign + acts  ► │
  │                  │                │   (fallback: by deliberation)│
  │                  │                │ loadLoci(rootLocus.path) ──► │
  │                  │                │                │             │
  │                  │                │ ┌── traversal loop ──────────│
  │                  │                │ │ pick next act by phase     │
  │                  │                │ │   (focus-P / focus-O /     │
  │                  │                │ │    neutral alternation)    │
  │                  │                │ │ apply compositionMode      │
  │                  │                │ │   (assoc / partial /       │
  │                  │                │ │    spiritual)              │
  │                  │                │ │ match ramification ──────► │ pathCheck(act, view)
  │                  │                │ │   ◄─ legal? duality?       │
  │                  │                │ │ if additive locus:         │
  │                  │                │ │   record usedAdditive[p]   │
  │                  │                │ │ append TracePair           │
  │                  │                │ │ apply testers              │
  │                  │                │ │   (virtualNegPaths,        │
  │                  │                │ │    drawAtPaths)            │
  │                  │                │ │ check termination:         │
  │                  │                │ │   † on both sides          │
  │                  │                │ │     → CONVERGENT           │
  │                  │                │ │   no legal response        │
  │                  │                │ │     → DIVERGENT / STUCK    │
  │                  │                │ │   fuel exhausted           │
  │                  │                │ │     → ONGOING (reason)     │
  │                  │                │ └────────────────────────────│
  │                  │                │                │             │
  │                  │                │ persistTrace(steps,status) ► │
  │                  │                │ derive decisiveIndices       │
  │                  │                │ emit StepResult              │
  │                  │ ◄── StepResult │                │             │
  │ ◄── 200 { ok, trace: StepResult } │                │             │
```

Notes:
- The traversal is deterministic given (designs, phase, mode, testers); the same inputs always produce the same `pairs`. This is what makes the trace shareable as a permalink.
- `STUCK` is engine-internal; the API surface narrows it to `ONGOING` with a `reason`.
- `decisiveIndices` are the steps where no legal alternative existed — these are the moves that *forced* the outcome and are highlighted in `TraceRibbon`.

### Sequence 3 — AIF correspondence sync & verify

After compilation (or after an `appendActs` edit), the ludics tree must be reflected as AIF nodes so AF labelling, CQ tracking, and ASPIC+ all see it. [`lib/ludics/syncToAif.ts`](lib/ludics/syncToAif.ts) is idempotent — repeated calls converge on a 1-to-1 `LudicAct ↔ AifNode` mapping.

```
Trigger            syncLudics    Prisma         aifCorrespond-    insightsCache
(compile / edit)   ToAif                        ence
  │                   │            │                 │                │
  │ syncLudicsToAif(deliberationId)│                 │                │
  │ ─────────────────►│            │                 │                │
  │                   │ loadActs(deliberationId) ──► │                │
  │                   │            │  include design,locus,aifNode    │
  │                   │ loadExistingAifNodes(actIds) ──────────────►  │
  │                   │            │                 │                │
  │                   │ ┌── for each LudicAct ─────────────────────┐  │
  │                   │ │ map polarity → AIF type                  │  │
  │                   │ │   P + claim          → I-node            │  │
  │                   │ │   P + argument       → RA-node           │  │
  │                   │ │   O + attack meta    → CA-node           │  │
  │                   │ │   DAIMON             → DM-node           │  │
  │                   │ │ if existing: update extJson, locusPath ► │  │
  │                   │ │ else:        insert AifNode (ludicActId) │  │
  │                   │ │ if attack: insert CA-node + conflict edge│  │
  │                   │ │ emit "justifiedBy" edge per visibility   │  │
  │                   │ │   (mirrors chronicle dependency)         │  │
  │                   │ └─────────────────────────────────────────┘   │
  │                   │ upsert LudicCorrespondence(designId,        ► │
  │                   │   aifNodeMap, lastVerified)                   │
  │                   │ verifyAifCorrespondence(deliberationId) ───►  │ verifyAifCorrespondence
  │                   │            │                 │  scan for:      │
  │                   │            │                 │   - orphan AifNodes
  │                   │            │                 │   - missing ludicActId
  │                   │            │                 │   - duplicate mappings
  │                   │            │                 │  → issues[]    │
  │                   │ ◄── { nodesCreated, edgesCreated,             │
  │                   │      caNodesCreated, errors }                 │
  │                   │ invalidateInsightsCache(deliberationId) ───────────────►
  │ ◄── result                                                          │
```

If verify returns issues, callers can run `repairCorrespondence(deliberationId)` (in [`lib/ludics/aifCorrespondence.ts`](lib/ludics/aifCorrespondence.ts)) which reconciles dangling nodes either by re-linking them to an extant `LudicAct` or by routing them to `cleanupOrphanedAifNodes`.

### Side pipeline A — Behaviour analysis *(Phase 5, in progress)*

```
LudicDesign ──► saturation.run(designId) ──► saturated paths
                                              │
                                              ▼
                                       LudicBehaviour
                                       (base, polarity, uniformBound)
                                              │
                                              ▼
                                       LudicMaterialDesign (incarnations)
                                              │
                                              ▼
                                       LudicIncarnation (variantTag, payload)
                                              │
                                              ▼
                                       TypeSystemPanel / BehaviourPanel UI
```

The behaviour layer treats orthogonality as a pre-order: a design realises a behaviour `B` iff it is orthogonal to every counter-design in `B^⊥`. `uniformity.check` provides the bound; `saturation.run` provides the closure approximation.

### Side pipeline B — Strategy & plays (DDS)

```
LudicDesign ──► extractPlays(design)  ──►  LudicPlay[]
                                              │
                                              ▼
                                       LudicStrategy
                                       (isInnocent, satisfiesPropagation)
                                              │
                              ┌───────────────┼───────────────┐
                              ▼               ▼               ▼
                      LudicInnocence-   LudicPropagation-  LudicStrategyView
                        Check              Check            (projections)
```

The strategy pipeline is consumed by [`StrategyInspector`](components/ludics/StrategyInspector.tsx) and [`PlaysList`](components/ludics/PlaysList.tsx); see [§7 DDS Framework](#the-dds-framework) for the full treatment.

### Side pipeline C — Game / arena

```
LudicStrategy(P) + LudicStrategy(O) ──► LudicGame (status, moveCount)
                                              │
                                              ▼
                                       LudicGamePosition[]
                                       (posPlayerActs, negPlayerActs,
                                        nextLegalMoves)
                                              │
                                              ▼
                          ArenaViewer · InteractionPlayer ·
                          LandscapeHeatMap · ProofNarrative
                          (components/ludics/viewers/)
```

The game pipeline replays a strategy pair as a positional game. [`LudicPosition`](lib/models/schema.prisma) caches the strategy payload at each locus, so `ArenaViewer` can render the full arena without re-walking the designs.

### Triggers — when does each pipeline run?

| Trigger | Pipelines run | Where |
| --- | --- | --- |
| `POST /api/ludics/compile` | Primary (compile → sync) | API route + `compileFromMoves` |
| `POST /api/ludics/step` | Primary (step only) | API route |
| `POST /api/ludics/compile-step` | Primary (compile + step + optional landscape) | `app/api/ludics/compile-step/route.ts` |
| `POST /api/ludics/acts` | Primary (sync after append) | `appendActs` → `syncLudicsToAif` |
| `POST /api/ludics/fax` / `/delocate` | Primary (rewrite loci, then sync) | engine modules |
| Behaviour Inspector card | Side A (saturation, uniformity) | `BehaviourInspectorCard.tsx` |
| Strategy Inspector | Side B (extract plays, check innocence) | `StrategyInspector.tsx` |
| Arena tab in LudicsPanel | Side C (create arena from designs) | `LudicsPanel.tsx` → `ArenaViewer.tsx` |

---

## The DDS Framework

**DDS** stands for **Designs, Disputes & Strategies** — the reformulation of Girard's ludics due to Faggian & Hyland (2002) that re-presents designs as *strategies* in an HO-style game and recovers Girard's results via a correspondence theorem. The Isonomia DDS layer is a first-class subsystem rather than an internal detail of the engine: it has its own theoretical objects, its own Prisma models, and its own UI surfaces. This section describes that layer end to end.

### Why DDS?

Girard's original presentation defines a design as a (possibly infinite) set of chronicles satisfying coherence axioms. This is mathematically elegant but operationally awkward — every reasoning task ends up walking the chronicle structure by hand. The Faggian–Hyland reformulation moves to *plays*:

| Girardian | Faggian–Hyland (DDS) | Isonomia table |
| --- | --- | --- |
| Design (set of chronicles) | Strategy (set of plays) | `LudicStrategy` / `LudicPlay` |
| Chronicle | Play | `LudicChronicle` / `LudicPlay` |
| View | View | `LudicStrategyView` |
| Dispute (interaction) | Dispute | `LudicDispute` |
| Position (legal sequence) | Position | `LudicPosition` |
| Orthogonality | Game-equivalence + closure | `LudicOrthogonalityCheck`, `LudicBiorthogonalClosure` |
| Behaviour | Behaviour | `LudicBehaviour` / `LudicMaterialDesign` |
| (no direct analogue) | **Correspondence** | `LudicCorrespondence`, `LudicIsomorphismCheck` |

The correspondence — that designs and strategies are interchangeable under four explicit isomorphisms (plays↔views, views↔plays, disp↔ch, ch↔disp) — is the technical content the framework adds, and Isonomia persists each of those checks individually.

### Conceptual model

```
                      ┌──────────────────────┐
                      │      LudicDesign     │
                      └──────────┬───────────┘
                                 │ one-to-one per player
                                 ▼
                      ┌──────────────────────┐
                      │     LudicStrategy    │
                      │ (P or O, innocent?,  │
                      │  satisfiesPropagation│
                      └──┬───────────────┬───┘
                         │               │
              extract    │               │  derive views
                         ▼               ▼
              ┌────────────────┐   ┌──────────────────┐
              │   LudicPlay    │   │ LudicStrategy-   │
              │  (sequence of  │◄──┤   View           │
              │   acts)        │   │ (player view +   │
              └────────┬───────┘   │  determined move)│
                       │           └──────────────────┘
                       │ pair with O-strategy
                       ▼
              ┌────────────────┐
              │  LudicDispute  │  ── positions ──► LudicPosition
              │ (interaction   │                   (legality flags)
              │  P × O)        │
              └────────┬───────┘
                       │
                       ▼
              ┌────────────────────────┐
              │ LudicCorrespondence    │
              │ (design ↔ strategy)    │ ─► four LudicIsomorphismCheck
              └────────────────────────┘    (plays-views, views-plays,
                                             disp-ch, ch-disp)
```

### Core definitions, as Isonomia implements them

**Play.** A finite alternating sequence of acts in a single design that ends on the player's own polarity (`isPositive: true` on `LudicPlay`). Plays are extracted from a design's chronicles by [`packages/ludics-core/dds/strategy/construct.ts`](packages/ludics-core/dds/strategy/construct.ts).

**Strategy.** A set of plays for a fixed player (`player ∈ {"P","O"}`), closed under prefix and view-determined extension. Stored as [`LudicStrategy`](lib/models/schema.prisma#L5573) with unique `(designId, player)`.

**View.** What a player "sees" — the projection of a play onto their own moves and the moves they justify. Persisted in [`LudicStrategyView`](lib/models/schema.prisma#L5618); each row records the view sequence, the move (if any) that this view determines for the player, and how many plays share it.

**Innocence (Definition 4.8).** A strategy is **innocent** iff (i) it is *deterministic* — `s̄·b, s̄·c ∈ S†  ⇒  b = c`, the player makes the same choice in indistinguishable situations — and (ii) it is *view-stable* — `Views(S) ⊆ S`, every view is itself a play in the strategy. Both clauses are stored separately on [`LudicInnocenceCheck`](lib/models/schema.prisma#L5635) (`isDeterministic`, `isViewStable`) so the UI can distinguish "loses determinism" from "loses view-stability". Computed by [`packages/ludics-core/dds/strategy/innocence.ts`](packages/ludics-core/dds/strategy/innocence.ts).

**Propagation (Definition 4.25).** A strategy *propagates* iff plays that share a prefix open the same addresses thereafter. This is the structural rigidity that makes the design ↔ strategy correspondence go through. Stored on [`LudicPropagationCheck`](lib/models/schema.prisma#L5650) with the violating prefix pairs in `violations`. Computed by [`packages/ludics-core/dds/strategy/propagation.ts`](packages/ludics-core/dds/strategy/propagation.ts).

**Dispute.** A persisted interaction between two designs of opposite polarity, modelled as [`LudicDispute`](lib/models/schema.prisma#L5478) with `actionPairs`, `status`, `length`, and an optional cached `isLegal` flag plus a `legalityLog`. Disputes are walked by [`packages/ludics-core/dds/interaction/stepper.ts`](packages/ludics-core/dds/interaction/stepper.ts).

**Position.** A *legal* prefix of a dispute — [`LudicPosition`](lib/models/schema.prisma#L5520). The four legality conditions get individual flags:

| Flag | Condition |
| --- | --- |
| `isLinear` | No address appears twice in the sequence |
| `isParity` | Polarity alternates strictly |
| `isJustified` | Each non-initial move is justified by an earlier move |
| `isVisible` | The justifier lies in the active player's view |
| `isLegal` | All four hold |

This flag-per-condition design means the UI can explain *which* aspect of legality fails when a candidate move is rejected — important because in practice users want to know "why isn't this move legal here?".

**Correspondence.** [`LudicCorrespondence`](lib/models/schema.prisma#L5668) records, per `(designId, strategyId)` pair, which of the four Faggian–Hyland isomorphisms hold:

| `isomorphismType` | Statement |
| --- | --- |
| `"plays-views"` | Plays of `D` ≅ views of the corresponding strategy `S` |
| `"views-plays"` | Views of `D` ≅ plays of `S` |
| `"disp-ch"` | Disputes against `D` ≅ chronicles of `S` |
| `"ch-disp"` | Chronicles of `D` ≅ disputes against `S` |

Each is stored as a [`LudicIsomorphismCheck`](lib/models/schema.prisma#L5688) row with `holds: boolean` and evidence/counterexample. The four together witness Propositions 4.18 and 4.27. Computed by [`packages/ludics-core/dds/correspondence/isomorphisms.ts`](packages/ludics-core/dds/correspondence/isomorphisms.ts).

### Sequence — strategy extraction + innocence check

```
UI                     /api/ludics/        dds/strategy/      Prisma
(StrategyInspector)    designs/[id]/       construct +
                       semantic            innocence
  │                       │                    │                │
  │ GET /designs/:id/     │                    │                │
  │     semantic          │                    │                │
  │ ────────────────────► │                    │                │
  │                       │ loadDesign(id) ──────────────────►  │
  │                       │ loadChronicles(designId) ────────►  │
  │                       │ constructStrategy(design,player)  ► │
  │                       │   ├─ enumerate plays from           │
  │                       │   │   chronicles                    │
  │                       │   ├─ derive views per play          │
  │                       │   └─ build determined-move map      │
  │                       │ ◄── { plays[], views[],             │
  │                       │       determined: Map<view,move> }  │
  │                       │ upsert LudicStrategy ────────────►  │
  │                       │ upsert LudicPlay[] ──────────────►  │
  │                       │ upsert LudicStrategyView[] ──────►  │
  │                       │                    │                │
  │                       │ checkInnocence(strategy) ─────────► │
  │                       │   ├─ isDeterministic = ∀ s̄b,s̄c.     │
  │                       │   │   determined[view(s̄)] is unique │
  │                       │   └─ isViewStable    = Views ⊆ S    │
  │                       │ upsert LudicInnocenceCheck ─────►   │
  │                       │ checkPropagation(strategy) ───────► │
  │                       │ upsert LudicPropagationCheck ───►   │
  │                       │ ◄── { strategy, innocence,          │
  │                       │       propagation, plays, views }   │
  │ ◄── 200 OK { ok: true, semantic: { ... } }                  │
```

The corresponding `POST /api/ludics/designs/semantic/batch` route runs this pipeline for many design ids at once and is what [`LudicsForest`](components/ludics/LudicsForest.tsx) calls to enrich the visible page.

### DDS modules — code map

The implementation lives almost entirely in [`packages/ludics-core/dds/`](packages/ludics-core/dds/). Each subdirectory corresponds to a DDS concept cluster:

| Subdir | Purpose | Key files |
| --- | --- | --- |
| `types/` | Shared algebraic types (Action, View, Play, etc.) | `types.ts` |
| `chronicles.ts` | Chronicle extraction & manipulation | (top-level) |
| `views.ts` | View computation (projection from plays) | (top-level) |
| `legality.ts` | Four-flag legality check (linear/parity/justified/visible) | (top-level) |
| `strategy/` | Strategy construction, innocence, propagation, ops | `construct.ts`, `innocence.ts`, `propagation.ts`, `operations.ts` |
| `interaction/` | Dispute stepper, play enumeration, outcomes | `stepper.ts`, `play.ts`, `strategy.ts`, `outcome.ts` |
| `correspondence/` | Four isomorphisms; design ↔ strategy transforms | `isomorphisms.ts`, `transform.ts`, `disp.ts`, `ch.ts` |
| `behaviours/` | Behaviour membership, biorthogonal closure, game-equivalence | `closure.ts`, `orthogonality.ts`, `game.ts` |
| `arena/` | Game arena construction, addresses, ludicability check | `arena.ts`, `arena-construction.ts`, `positions.ts`, `ludicability.ts`, `deliberation-address.ts`, `deliberation-queries.ts`, `client.ts` |
| `game/` | Game simulation, AI strategies, persistence, encoding | `game.ts` (via index), `simulation.ts`, `construction.ts`, `play.ts`, `ai.ts`, `persistence.ts`, `encoding.ts` |
| `extraction/` | Path / narrative extraction from interactions | (per files) |
| `landscape/` | Landscape generation (heat-map data) | (per files) |
| `adapters/` | Dialogue-protocol → DDS adapters | (per files) |
| `analysis/` | Aggregated metrics over plays / strategies | (per files) |

Each cluster has its own `__tests__/` directory; the canonical theory test is [`packages/ludics-core/dds/__tests__/ludics-theory.test.ts`](packages/ludics-core/dds/__tests__/ludics-theory.test.ts), which covers the four correspondence isomorphisms against worked examples from Faggian & Hyland.

### Caches & invariants

Because innocence/propagation/correspondence are pure functions of immutable strategy data, results are cached:

| Cache | Key | Invalidated by |
| --- | --- | --- |
| `LudicInnocenceCheck` | `strategyId` (unique) | Re-extraction after design mutation |
| `LudicPropagationCheck` | `strategyId` (unique) | Re-extraction after design mutation |
| `LudicCorrespondence` | `(designId, strategyId)` (unique) | Either side mutated |
| `LudicIsomorphismCheck` | `(correspondenceId, isomorphismType)` (unique) | Parent correspondence touched |
| `LudicDisputeCache` | `designId` (unique) | New disputes recorded |
| `LudicChronicleCache` | `strategyId` (unique) | New chronicles ingested |

Two structural invariants are enforced at the schema level and relied on by the engine:

1. **One strategy per `(design, player)`.** The `@@unique([designId, player])` on `LudicStrategy` rules out divergent strategies for the same projection.
2. **One correspondence per `(design, strategy)`.** The `@@unique([designId, strategyId])` on `LudicCorrespondence` makes the isomorphism set deterministic — there is exactly one place where the four checks for a given pair live.

### Where DDS surfaces in the UI

| Component | DDS objects shown |
| --- | --- |
| [`StrategyInspector`](components/ludics/StrategyInspector.tsx) | `LudicStrategy`, innocence/propagation, view determinism map |
| [`PlaysList`](components/ludics/PlaysList.tsx) | `LudicPlay[]` |
| [`ChronicleViewer`](components/ludics/ChronicleViewer.tsx) / [`ChroniclesList`](components/ludics/ChroniclesList.tsx) | `LudicChronicle[]`, with view-projection toggle |
| [`CorrespondenceViewer`](components/ludics/CorrespondenceViewer.tsx) | `LudicCorrespondence` + the four `LudicIsomorphismCheck` rows |
| [`DisputesList`](components/ludics/DisputesList.tsx) / [`DisputeTraceViewer`](components/ludics/analysis/DisputeTraceViewer.tsx) | `LudicDispute`, with the four-flag legality breakdown |
| [`ViewInspector`](components/ludics/ViewInspector.tsx) / [`ViewsExplorer`](components/ludics/analysis/ViewsExplorer.tsx) | `LudicView` / `LudicStrategyView` |
| Arena & Game panels (§7 of [components/ludics/](components/ludics/)) | `LudicPosition`, `LudicGame`, `LudicGamePosition` |

---

## Engine Subsystems

This section walks [`packages/ludics-engine/`](packages/ludics-engine/) module by module, organised into the clusters used in the architecture diagram. Each entry gives the module's contract — what it consumes, what it produces, and what other modules it calls — so a reader can locate where to make a change without re-reading the source.

### 8.1 Compiler — `compileFromMoves.ts`, `delocate.ts`, `detect-collisions.ts`, `rule-parser.ts`

| Module | Contract |
| --- | --- |
| [`compileFromMoves.ts`](packages/ludics-engine/compileFromMoves.ts) | `compileFromMoves(deliberationId, { scopingStrategy, forceRecompile })` → upserts `LudicDesign`/`LudicLocus`/`LudicAct` rows from `DialogueMove` rows. Internally uses `expandActsFromMove`, `ensureRoot`, `computeArgumentRoots`, and the scoping switch. |
| [`delocate.ts`](packages/ludics-engine/delocate.ts) | Rename loci across scopes; idempotent. Used by the compiler when an act references a locus living under a different `scope`. |
| [`detect-collisions.ts`](packages/ludics-engine/detect-collisions.ts) | Pre-flight check returning `{ base, dirs }[]` for cases where two acts would open conflicting ramifications at the same locus. Surfaced to the user in the Behaviour Inspector. |
| [`rule-parser.ts`](packages/ludics-engine/rule-parser.ts) | Small parser for the optional rule DSL used in seeded `examples/`. |

**Inputs:** `DialogueMove[]`, scope strategy. **Outputs:** persisted designs + `LudicFaxMap` entries. **Calls:** [`lib/ludics/locks.ts`](lib/ludics/locks.ts) (advisory lock), `prisma` transaction. **Called by:** `app/api/ludics/compile/route.ts`, `app/api/ludics/compile-step/route.ts`, `lib/ludics/ensureBaseline.ts`.

### 8.2 Stepper — `stepper.ts`, `policies.ts`, `compose.ts`, `scopeTraces.ts`

| Module | Contract |
| --- | --- |
| [`stepper.ts`](packages/ludics-engine/stepper.ts) | `stepInteraction(opts) → StepResult`. The single entry point for interaction. Implements phase selection, ramification matching, additive tracking, virtual testers, and termination. Also exports `closedLocusSuggestions` for the "where could † go?" hint. |
| [`policies.ts`](packages/ludics-engine/policies.ts) | The three composition modes (`assoc`, `partial`, `spiritual`) as pluggable policy objects. The stepper reads policy methods (`canOpen`, `canShare`, …) to decide locus visibility per step. |
| [`compose.ts`](packages/ludics-engine/compose.ts) | Composition pre-flight: given (P,O) and a mode, return any blocking collisions before stepping. Surfaced via `/api/compose/preflight`. |
| [`scopeTraces.ts`](packages/ludics-engine/scopeTraces.ts) | Convenience: enumerate traces grouped by scope for a deliberation; used by the analysis panels. |

**Calls:** [`packages/ludics-core/ve.ts`](packages/ludics-core/ve.ts) for path-check / duality, `policies.ts` for mode, `testers.ts` for virtual O-acts. **Called by:** `app/api/ludics/step/route.ts`, `app/api/ludics/compile-step/route.ts`, `BehaviourInspectorCard`.

### 8.3 Orthogonality & decisive analysis — `orthogonal.ts`, `checkOrthogonal.ts`, `decisive.ts`

| Module | Contract |
| --- | --- |
| [`orthogonal.ts`](packages/ludics-engine/orthogonal.ts) | Full orthogonality check: runs `stepInteraction` in neutral phase, persists `LudicOrthogonalityCheck`, returns `{ orthogonal, trace, acts }`. |
| [`checkOrthogonal.ts`](packages/ludics-engine/checkOrthogonal.ts) | Fast path used inside hot loops (e.g. behaviour closure) — skips persistence, returns boolean + reason. |
| [`decisive.ts`](packages/ludics-engine/decisive.ts) | Given a completed trace, computes `decisiveIndices` — the steps where the active player had no legal alternative. Drives the "forced moves" highlights in `TraceRibbon`. |

**Called by:** `app/api/ludics/orthogonal/route.ts`, `behaviours/closure.ts` (DDS), Behaviour Inspector.

### 8.4 Transformations — `fax.ts`, `faxClone.ts`, `delocate.ts`, `copy.ts`

| Module | Contract |
| --- | --- |
| [`fax.ts`](packages/ludics-engine/fax.ts) | Primitive locus rename `from → to`; writes a `LudicFaxMap` row. |
| [`faxClone.ts`](packages/ludics-engine/faxClone.ts) | Clone an entire sub-design under a shifted locus; preserves act order. |
| [`copy.ts`](packages/ludics-engine/copy.ts) | Create N fresh children of a base locus (`/api/loci/copy`); used by the uniformity harness to generate test loci. |

**Called by:** `/api/ludics/fax`, `/api/ludics/fax/clone`, `/api/ludics/fax/branch`, `/api/ludics/delocate`, `/api/loci/copy`. **Invariant:** every fax must round-trip — applying `fax` then the inverse mapping leaves the design semantically unchanged.

### 8.5 Behaviours & saturation *(Phase 5, in progress)* — `saturation.ts`, `uniformity.ts`

| Module | Contract |
| --- | --- |
| [`saturation.ts`](packages/ludics-engine/saturation.ts) | Approximates the biorthogonal closure of a single design; persists results into `LudicBiorthogonalClosure`. |
| [`uniformity.ts`](packages/ludics-engine/uniformity.ts) | `checkUniformity({ posDesignId, negDesignId, baseLocus, childA, childB, fuel })` — verifies that the design behaves identically on two fresh sibling loci. Returns `{ uniform, counterexample? }`. Backs `/api/ludics/uniformity/check`. |

The bound discovered by `uniformity` is cached as `LudicBehaviour.uniformBound`; saturation results feed the type-system panels.

### 8.6 Strategies & defenses — `defenseTree.ts`

| Module | Contract |
| --- | --- |
| [`defenseTree.ts`](packages/ludics-engine/defenseTree.ts) | Builds the defense tree for a Proponent design — for each Opponent attack, the sub-tree of legal P-responses. Consumed by [`DefenseTree`](packages/ludics-react/DefenseTree.tsx) in the panel. |

DDS-side strategy construction lives in [`packages/ludics-core/dds/strategy/`](packages/ludics-core/dds/strategy/) (see §7), not in the engine; the engine module here is the geometric / tree-shaped view used in the UI.

### 8.7 Judge, concession, daimon, testers, visibility, locks, commitments

| Module | Contract |
| --- | --- |
| [`judge.ts`](packages/ludics-engine/judge.ts) | Moderator actions: `FORCE_CONCESSION`, `ASSIGN_BURDEN`, `CLOSE_BRANCH`. Writes a `LudicDecisionReceipt` with `kind: "procedural"` and the target locus/design. |
| [`concession.ts`](packages/ludics-engine/concession.ts) | Mutual concession protocol: anchor a conceding participant's proposition into the receiver's commitment store and rewrite the affected locus. |
| [`daimon.ts`](packages/ludics-engine/daimon.ts) | Helpers for appending `†` correctly — preserves `endedAtDaimonForParticipantId`, marks `hasDaimon` on the design, emits a `daimonHints` candidate when no legal move remains. |
| [`testers.ts`](packages/ludics-engine/testers.ts) | The discriminated union of virtual testers (`herd-to`, `timeout-draw`) consumed by `stepInteraction`. Lets the UI probe a design without persisting acts. |
| [`visibility.ts`](packages/ludics-engine/visibility.ts) | Static check that an act's justifier lies in the active player's view — the same condition `LudicPosition.isVisible` records. |
| [`locks.ts`](packages/ludics-engine/locks.ts) | Postgres advisory locks keyed by deliberation id; used by the compiler to serialise concurrent compiles. |
| [`commitments.ts`](packages/ludics-engine/commitments.ts) | Ledger ops over `LudicCommitmentElement` / `LudicCommitmentState`: add, erase, promote-from-dialogue. |
| [`appendActs.ts`](packages/ludics-engine/appendActs.ts) | Bulk append acts to a design with optional alternation enforcement; mirrored by [`lib/ludics/appendActs.ts`](lib/ludics/appendActs.ts) which adds AIF sync afterwards. |

### 8.8 Virtual evaluation — `packages/ludics-core/ve.ts`, `ve/pathCheck.ts`

| Module | Contract |
| --- | --- |
| [`ve.ts`](packages/ludics-core/ve.ts) | Virtual evaluator: takes a locus tree + a candidate path and answers "is this path legal under the design's view?" without producing any persistent state. The pure computational kernel. |
| [`ve/pathCheck.ts`](packages/ludics-core/ve/pathCheck.ts) | Specialised path-check including duality (a P-path is legal iff its dual is reachable for O). |

The stepper calls into these for every candidate step; the DDS legality checker calls them for every `LudicPosition` flag.

### 8.9 AIF bridge — `aif-sync.ts`

| Module | Contract |
| --- | --- |
| [`packages/ludics-engine/aif-sync.ts`](packages/ludics-engine/aif-sync.ts) | Engine-side helpers for ludics ↔ AIF; the app-glue counterpart is [`lib/ludics/syncToAif.ts`](lib/ludics/syncToAif.ts). Keeps the polarity → node-type map (P/claim→I, P/argument→RA, O/attack→CA, †→DM) in one place. |

See [§6 sequence 3](#sequence-3--aif-correspondence-sync--verify) for the full flow and [§11 Integration Points](#integration-points) for the cross-system view.

### 8.10 Plugins, hooks, examples

| Module | Purpose |
| --- | --- |
| [`hooks.ts`](packages/ludics-engine/hooks.ts) | Lifecycle hooks (`onCompile`, `onStep`, `onAppend`) used by plugins. |
| [`plugins/`](packages/ludics-engine/plugins/) | Optional engine extensions; each plugin registers via `hooks.ts`. Currently used for experimental schemes (e.g. CQ-aware compilers). |
| [`examples/`](packages/ludics-engine/examples/) | Seeded designs and dialogues used by tests and by `/api/ludics/examples/dialogues-in-ludics`. |

### Call-graph at a glance

```
                       app/api/ludics/*  (routes)
                                │
                ┌───────────────┼────────────────┐
                ▼               ▼                ▼
        compileFromMoves  stepInteraction   orthogonal /
                │               │            checkOrthogonal
                │               │                │
                ├──► delocate   ├──► policies    │
                ├──► fax/clone  ├──► testers     │
                │               ├──► visibility  │
                │               ├──► daimon      │
                │               └──► ve / pathCheck (core)
                │                       ▲
                ▼                       │
        lib/ludics/locks           dds/* (strategy,
                │                       interaction, etc.)
                ▼
        prisma  ◄──── lib/ludics/syncToAif ◄──── aif-sync.ts
                ▲
                │
        lib/ludics/computeInsights ─► lib/ludics/insightsCache
```

Every UI surface calls one or two routes; every route calls one of three engine entry points (`compileFromMoves`, `stepInteraction`, an orthogonality variant); those entry points call the same small set of policy/visibility/ve modules.

---

## API Layer

The ludics HTTP surface lives entirely under [`app/api/ludics/`](app/api/ludics/) and is grouped into two tiers: **classic engine routes** (compile / step / orthogonal / fax / judge / commitments / insights) and **DDS routes** (strategies, disputes, behaviours, arena, games, correspondence, chronicles, views, positions). All requests and responses are validated by the Zod schemas in [`packages/ludics-rest/schemas.ts`](packages/ludics-rest/schemas.ts); no route should reach the engine without going through one.

### Conventions

- **Method semantics.** `GET` is read-only and free of side-effects; `POST` may compile, step, or compute (and may cache). The DDS layer also uses `POST` for *verify* operations because they upsert a check row.
- **Identifier shape.** `deliberationId` keys long-lived state; `designId`, `strategyId`, `disputeId`, etc. key specific objects. Route segments use `[id]` for the primary entity.
- **Error envelope.** All routes return `{ ok: boolean, error?: string, data?: T }` (or a flat domain object when `ok: true`). Engine exceptions are caught at the route boundary and turned into `{ ok: false, error }`.
- **Auth.** Standard Isonomia session middleware; ludics routes do not introduce their own auth model.
- **Tracing.** Every mutating route emits a `ludics.*` server log line including the deliberation id and entity counts.

### 9.1 Classic engine routes

| Route | Method | Purpose |
| --- | --- | --- |
| [`/api/ludics/compile`](app/api/ludics/compile/route.ts) | POST | Compile a deliberation's `DialogueMove`s into designs (`compileFromMoves`). |
| [`/api/ludics/compile-step`](app/api/ludics/compile-step/route.ts) | POST | Compile then immediately step in one round trip — used by the "ensure baseline + run" UX. |
| [`/api/ludics/step`](app/api/ludics/step/route.ts) | POST | `stepInteraction({ deliberationId, posDesignId, negDesignId, mode, ... })`. |
| [`/api/ludics/orthogonal`](app/api/ludics/orthogonal/route.ts) | POST | Persisted orthogonality check; writes `LudicOrthogonalityCheck`. |
| [`/api/ludics/delocate`](app/api/ludics/delocate/route.ts) | POST | Rename loci across scopes. |
| [`/api/ludics/fax`](app/api/ludics/fax/route.ts) | POST | Primitive locus rename (`from → to`). |
| [`/api/ludics/fax/clone`](app/api/ludics/fax/clone/route.ts) | POST | Sub-design clone. |
| [`/api/ludics/fax/branch`](app/api/ludics/fax/branch/route.ts) | POST | Open a fresh ramification under an existing locus. |
| [`/api/ludics/loci/positions`](app/api/ludics/loci/positions/route.ts) | GET | Per-locus position summary for a design. |
| [`/api/ludics/loci/delocate`](app/api/ludics/loci/delocate/route.ts) | POST | Locus-scoped delocation. |
| [`/api/ludics/acts`](app/api/ludics/acts/route.ts) | POST | Append acts (proper, daimon, or virtual). Server-side mirror of `appendActs`. |
| [`/api/ludics/judge`](app/api/ludics/judge/route.ts) | POST | Moderator actions; emits `LudicDecisionReceipt`. |
| [`/api/ludics/concession`](app/api/ludics/concession/route.ts) | POST | Mutual concession protocol. |
| [`/api/ludics/uniformity/check`](app/api/ludics/uniformity/route.ts) | POST | *(Phase 5, in progress)* Run `checkUniformity` and cache the bound onto `LudicBehaviour`. |
| [`/api/ludics/aif-sync`](app/api/ludics/aif-sync/route.ts) | POST | Run the bridge: ludics → AIF nodes/edges. |
| [`/api/ludics/sync-to-aif`](app/api/ludics/sync-to-aif/route.ts) | POST | Higher-level convenience wrapper used by `lib/ludics/syncToAif.ts`. |
| [`/api/ludics/insights`](app/api/ludics/insights/route.ts) | GET | Compute (or read cached) `LudicsInsights` for a deliberation. |
| [`/api/ludics/insights/invalidate`](app/api/ludics/insights/invalidate/route.ts) | POST | Drop the insights cache for a deliberation. |
| [`/api/ludics/landscape`](app/api/ludics/landscape/route.ts) | GET | Aggregated landscape heat-map data. |
| [`/api/ludics/interactions`](app/api/ludics/interactions/route.ts) | GET/POST | List or create persisted interactions. |
| [`/api/ludics/interactions/[id]`](app/api/ludics/interactions/[id]/route.ts) | GET | Detail for a single interaction. |
| [`/api/ludics/examples/dialogues-in-ludics`](app/api/ludics/examples/dialogues-in-ludics/route.ts) | GET | Seeded examples for the playground. |

### 9.2 Design routes

| Route | Method | Purpose |
| --- | --- | --- |
| [`/api/ludics/designs`](app/api/ludics/designs/route.ts) | GET/POST | List or create designs. |
| [`/api/ludics/designs/[id]`](app/api/ludics/designs/[id]/route.ts) | GET/PATCH/DELETE | Design CRUD. |
| [`/api/ludics/designs/[id]/semantic`](app/api/ludics/designs/[id]/semantic/route.ts) | GET/POST | Recompute & return the full DDS bundle for one design (strategy, plays, views, innocence, propagation). |
| [`/api/ludics/designs/by-deliberation`](app/api/ludics/designs/by-deliberation/route.ts) | GET | All designs for a deliberation, with insights badges. |
| [`/api/ludics/designs/semantic/batch`](app/api/ludics/designs/semantic/route.ts) | POST | The same bundle for many designs at once (drives `LudicsForest`). |

### 9.3 DDS routes

Each DDS concept gets its own sub-tree under [`app/api/ludics/dds/`](app/api/ludics/dds/). Naming convention:

- `…/route.ts` — list / create the entity.
- `…/extract/route.ts` — recompute from source (design → strategy, dispute → chronicle, …).
- `…/verify/route.ts` — run a verification and upsert the corresponding cache row.

| Route | Method | Purpose |
| --- | --- | --- |
| [`/api/ludics/dds/strategies/generate`](app/api/ludics/dds/strategies/generate/route.ts) | POST | Generate a `LudicStrategy` (and plays/views) from a `(designId, player)`. |
| [`/api/ludics/dds/strategies/innocence`](app/api/ludics/dds/strategies/innocence/route.ts) | POST | Run `checkInnocence`, upsert `LudicInnocenceCheck`. |
| [`/api/ludics/dds/strategies/propagation`](app/api/ludics/dds/strategies/propagation/route.ts) | POST | Run `checkPropagation`, upsert `LudicPropagationCheck`. |
| [`/api/ludics/dds/strategies/plays`](app/api/ludics/dds/strategies/plays/route.ts) | GET | Plays of a strategy. |
| [`/api/ludics/dds/strategies/views`](app/api/ludics/dds/strategies/views/route.ts) | GET | Views of a strategy (with determined-move map). |
| [`/api/ludics/dds/strategy/innocence`](app/api/ludics/dds/strategy/innocence/route.ts) | GET | Read-only inspector for a single strategy's innocence cache. |
| [`/api/ludics/dds/strategy/propagation`](app/api/ludics/dds/strategy/propagation/route.ts) | GET | Read-only inspector for the propagation cache. |
| [`/api/ludics/dds/disputes`](app/api/ludics/dds/disputes/route.ts) | GET/POST | List / record `LudicDispute` rows. |
| [`/api/ludics/dds/positions`](app/api/ludics/dds/positions/route.ts) | GET | Per-dispute legal positions with the four legality flags. |
| [`/api/ludics/dds/chronicles/extract`](app/api/ludics/dds/chronicles/extract/route.ts) | POST | Recompute chronicles from a design. |
| [`/api/ludics/dds/views/extract`](app/api/ludics/dds/views/extract/route.ts) | POST | Recompute persisted `LudicView` rows. |
| [`/api/ludics/dds/correspondence`](app/api/ludics/dds/correspondence/route.ts) | GET/POST | List or create a `LudicCorrespondence` for `(designId, strategyId)`. |
| [`/api/ludics/dds/correspondence/verify`](app/api/ludics/dds/correspondence/verify/route.ts) | POST | Run all four isomorphism checks; upsert `LudicIsomorphismCheck` rows. |
| [`/api/ludics/dds/correspondence/verify-aif`](app/api/ludics/dds/correspondence/verify-aif/route.ts) | POST | Cross-check that the AIF mirror agrees with the isomorphisms. |
| [`/api/ludics/dds/correspondence/disp`](app/api/ludics/dds/correspondence/disp/route.ts) | GET | Disp ↔ chronicle witnesses. |
| [`/api/ludics/dds/correspondence/ch`](app/api/ludics/dds/correspondence/ch/route.ts) | GET | Ch ↔ dispute witnesses. |
| [`/api/ludics/dds/correspondence/transform`](app/api/ludics/dds/correspondence/transform/route.ts) | POST | Apply a design ↔ strategy transform. |
| [`/api/ludics/dds/behaviours`](app/api/ludics/dds/behaviours/route.ts) | GET/POST | List / create `LudicBehaviour` rows. |
| [`/api/ludics/dds/behaviours/closure`](app/api/ludics/dds/behaviours/closure/route.ts) | POST | Biorthogonal closure; persists into `LudicBiorthogonalClosure`. |
| [`/api/ludics/dds/behaviours/orthogonality`](app/api/ludics/dds/behaviours/orthogonality/route.ts) | POST | Game-equivalence + orthogonality witness for a behaviour. |
| [`/api/ludics/dds/arena`](app/api/ludics/dds/arena/route.ts) | GET/POST | Materialise an arena from a design set; persists addresses. |
| [`/api/ludics/dds/games`](app/api/ludics/dds/games/route.ts) | GET/POST | `LudicGame` CRUD. |
| [`/api/ludics/dds/games/play`](app/api/ludics/dds/games/play/route.ts) | POST | Append a `LudicGamePosition` to an active game. |
| [`/api/ludics/dds/games/simulate`](app/api/ludics/dds/games/simulate/route.ts) | POST | Run the AI player from `dds/game/ai.ts` against a position. |
| [`/api/ludics/dds/analysis/properties`](app/api/ludics/dds/analysis/properties/route.ts) | POST | Bulk-verify innocence / propagation / orthogonality for selected designs. |
| [`/api/ludics/dds/analysis/saturation`](app/api/ludics/dds/analysis/saturation/route.ts) | POST | *(Phase 5, in progress)* Run saturation; persist into `LudicBiorthogonalClosure`. |
| [`/api/ludics/dds/stats`](app/api/ludics/dds/stats/route.ts) | GET | Aggregate counts for the analysis dashboard. |
| [`/api/ludics/dds/step`](app/api/ludics/dds/step/route.ts) | POST | DDS-side stepper (for dispute simulation that doesn't mutate the underlying designs). |
| [`/api/ludics/dds/types/validate`](app/api/ludics/dds/types/validate/route.ts) | POST | *(Phase 5, in progress)* Type-system check against a behaviour. |
| [`/api/ludics/arenas`](app/api/ludics/arenas/route.ts) | GET/POST | Top-level arena registry (distinct from per-DDS arena). |
| [`/api/ludics/arenas/[arenaId]`](app/api/ludics/arenas/[arenaId]/route.ts) | GET | Arena detail. |
| [`/api/ludics/strategies`](app/api/ludics/strategies/route.ts) | GET | Cross-design strategy listing (read-only convenience). |

### 9.4 Sequence — typical "compile-step + verify" call from LudicsPanel

```
LudicsPanel             /api/ludics/        engine          /api/ludics/dds/        DDS core
                        compile-step        modules         correspondence/verify   modules
   │                       │                  │                  │                    │
   │ POST compile-step ──► │                  │                  │                    │
   │                       │ compileFromMoves │                  │                    │
   │                       │ stepInteraction ─► (designs,        │                    │
   │                       │                     trace)          │                    │
   │ ◄── { ok, trace } ────│                  │                  │                    │
   │                                                                                  │
   │ POST dds/strategies/generate (for P) ─────────────────────────────────────────►  │
   │                                                            construct + persist   │
   │ ◄── { strategy }                                                                 │
   │                                                                                  │
   │ POST dds/strategies/innocence ─────────────────────────────────────────────────► │
   │                                                            checkInnocence        │
   │ ◄── { isInnocent, isDeterministic, isViewStable }                                │
   │                                                                                  │
   │ POST dds/correspondence/verify ──────────────────────────► verify-isomorphisms ► │
   │ ◄── { plays-views, views-plays, disp-ch, ch-disp }       (upserts 4 rows)        │
   │                                                                                  │
   │ render badges via InsightsBadge / CorrespondenceViewer                           │
```

Every panel that needs DDS data follows the same trio: **generate → verify → render**.

---

## UI Components

UI lives in two locations:

- [`packages/ludics-react/`](packages/ludics-react/) — primitive, theory-aligned widgets (loci tree, trace ribbon, judge console, defense tree). These are pure presentational components with no data fetching and can be reused outside Isonomia.
- [`components/ludics/`](components/ludics/) — Isonomia-flavoured components that fetch from the routes in §9 and compose the primitives. This is what the deep-dive page mounts.

### 10.1 Primitives — `packages/ludics-react/`

| Component | Purpose |
| --- | --- |
| [`LociTree`](packages/ludics-react/LociTree.tsx) | Render the locus tree of one or many designs. The canonical "structure" view. |
| [`LociTreeLegacy`](packages/ludics-react/LociTreeLegacy.tsx) | Pre-merge implementation, kept for fallback. |
| [`TraceRibbon`](packages/ludics-react/TraceRibbon.tsx) | Horizontal ribbon of a step trace; highlights decisive indices and daimon. |
| [`ActInspector`](packages/ludics-react/ActInspector.tsx) | Detail view for a single `LudicAct` (polarity, ramification, justifier). |
| [`JudgeConsole`](packages/ludics-react/JudgeConsole.tsx) | Buttons & receipt log for `judge.ts` actions. |
| [`CommitmentsPanel`](packages/ludics-react/CommitmentsPanel.tsx) | Visualises the commitment ledger plus dialogue ↔ ludics deltas. |
| [`DefenseTree`](packages/ludics-react/DefenseTree.tsx) | Tree of legal P-responses to each O-attack. |
| [`mergeDesignsToTree`](packages/ludics-react/mergeDesignsToTree.ts) | Pure helper: combine many designs into one locus tree for `LociTree`. |
| [`modeLabels`](packages/ludics-react/modeLabels.ts) | Display labels for the three composition modes (`assoc`/`partial`/`spiritual`). |

### 10.2 Isonomia shell — `components/ludics/` (top level)

| Component | Role |
| --- | --- |
| [`LudicsForest`](components/ludics/LudicsForest.tsx) | Multi-design overview; calls `/api/ludics/designs/semantic/batch` and renders rows with insight badges. |
| [`LudicsTreePanel`](components/ludics/LudicsTreePanel.tsx) | Single-design tree view wrapping `LociTree`. |
| [`LudicsTraceViewer`](components/ludics/LudicsTraceViewer.tsx) | Wraps `TraceRibbon` plus step controls and `StepResult` display. |
| [`LudicsActionsToolbar`](components/ludics/LudicsActionsToolbar.tsx) | Compile / step / orthogonal / fax buttons. |
| [`LudicsCommitmentsView`](components/ludics/LudicsCommitmentsView.tsx) | Isonomia-styled wrapper around `CommitmentsPanel`. |
| [`LociTreeWithControls`](components/ludics/LociTreeWithControls.tsx) | `LociTree` + per-locus actions (close, fax, branch). |
| [`LocusControls`](components/ludics/LocusControls.tsx) | The per-locus action menu used by `LociTreeWithControls`. |
| [`TransformationControls`](components/ludics/TransformationControls.tsx) | Delocate / fax / clone forms. |
| [`InsightsBadges`](components/ludics/InsightsBadges.tsx) | `InsightsBadge`, `LocusBadge`, `PolarityBadge` — see [`components/ludics/README.md`](components/ludics/README.md). |
| [`InsightsTooltip`](components/ludics/InsightsTooltip.tsx) | Rich hover-popover wrapping any badge. |
| [`LegalityBadge`](components/ludics/LegalityBadge.tsx) | Four-flag breakdown for `LudicPosition`. |
| [`UniformityPill`](components/ludics/UniformityPill.tsx) | *(Phase 5, in progress)* Inline uniformity result. |
| [`BehaviourHUD`](components/ludics/BehaviourHUD.tsx) | Live behaviour membership / closure indicator. |
| [`BehaviourInspectorCard`](components/ludics/BehaviourInspectorCard.tsx) | Detail card for a single `LudicBehaviour`, drives saturation/uniformity runs. |
| [`TensorProbeCard`](components/ludics/TensorProbeCard.tsx) | Composition mode probe (the three policies). |
| [`DesignTreeView`](components/ludics/DesignTreeView.tsx) | Alternative tree layout used in analysis panels. |
| [`ArgumentSchemeView`](components/ludics/ArgumentSchemeView.tsx) | Scheme-aware design overlay (CQ debt visualisation). |

### 10.3 DDS components — `components/ludics/` (DDS row)

| Component | DDS object | Notes |
| --- | --- | --- |
| [`StrategyInspector`](components/ludics/StrategyInspector.tsx) | `LudicStrategy` | Innocence / propagation / view-determinism map. |
| [`PlaysList`](components/ludics/PlaysList.tsx) | `LudicPlay[]` | Sorted by length; ⊕ marker on positive plays. |
| [`ChronicleViewer`](components/ludics/ChronicleViewer.tsx) | `LudicChronicle` | Single-chronicle drill-down with view-projection toggle. |
| [`ChroniclesList`](components/ludics/ChroniclesList.tsx) | `LudicChronicle[]` | List + filter by player. |
| [`ViewInspector`](components/ludics/ViewInspector.tsx) | `LudicStrategyView` | Determined-move map per view. |
| [`CorrespondenceViewer`](components/ludics/CorrespondenceViewer.tsx) | `LudicCorrespondence` + 4× `LudicIsomorphismCheck` | The "Faggian–Hyland card". |
| [`DisputesList`](components/ludics/DisputesList.tsx) | `LudicDispute[]` | Filter by `LudicDisputeStatus`. |

### 10.4 Analysis subdir — `components/ludics/analysis/`

The analysis dashboard is the read-mostly observability surface across one deliberation's ludics state.

| Component | Role |
| --- | --- |
| [`AnalysisDashboard`](components/ludics/analysis/AnalysisDashboard.tsx) | Top-level container; mounts filters + overview + tables. |
| [`AnalysisPanel`](components/ludics/analysis/AnalysisPanel.tsx) | The pane embedded into `LudicsPanel`. |
| [`AnalysisOverview`](components/ludics/analysis/AnalysisOverview.tsx) | Headline metric tiles. |
| [`AnalysisFilters`](components/ludics/analysis/AnalysisFilters.tsx) | Design / player / status filter bar. |
| [`AnalysisSummaryTable`](components/ludics/analysis/AnalysisSummaryTable.tsx) | Per-design row with innocence / propagation / orthogonality columns. |
| [`BatchAnalysisControls`](components/ludics/analysis/BatchAnalysisControls.tsx) | "Verify all" runner; calls `/api/ludics/dds/analysis/properties`. |
| [`DesignAnalysisBadges`](components/ludics/analysis/DesignAnalysisBadges.tsx) | Per-design badge cluster. |
| [`QuickAnalysisActions`](components/ludics/analysis/QuickAnalysisActions.tsx) | One-click "extract chronicles" / "recompute strategy" buttons. |
| [`BehaviourPanel`](components/ludics/analysis/BehaviourPanel.tsx) | `LudicBehaviour` + `LudicMaterialDesign` viewer. |
| [`SaturationPanel`](components/ludics/analysis/SaturationPanel.tsx) | *(Phase 5, in progress)* Biorthogonal-closure runner & viewer. |
| [`TypeSystemPanel`](components/ludics/analysis/TypeSystemPanel.tsx) | *(Phase 5, in progress)* Type / behaviour membership checker. |
| [`ChronicleNavigator`](components/ludics/analysis/ChronicleNavigator.tsx) | Step-through chronicle browser. |
| [`ChroniclesExplorer`](components/ludics/analysis/ChroniclesExplorer.tsx) | Faceted chronicle search. |
| [`ViewDebugger`](components/ludics/analysis/ViewDebugger.tsx) | View-stability counterexample explorer. |
| [`ViewsExplorer`](components/ludics/analysis/ViewsExplorer.tsx) | Aggregated view browser with determinism heat-map. |
| [`DisputeTraceViewer`](components/ludics/analysis/DisputeTraceViewer.tsx) | Per-dispute trace with `LudicPosition` legality breakdown. |
| [`StrategyComparison`](components/ludics/analysis/StrategyComparison.tsx) | Side-by-side P vs O strategy diff. |
| [`PerformanceMonitor`](components/ludics/analysis/PerformanceMonitor.tsx) | Engine timing / cache-hit metrics. |

### 10.5 Arena & Game subdirs

[`components/ludics/arena/`](components/ludics/arena/) renders the geometric arena (game frame derived from a design set), independent of any specific play:

| Component | Role |
| --- | --- |
| [`ArenaPanel`](components/ludics/arena/ArenaPanel.tsx) | Arena container; calls `/api/ludics/dds/arena`. |
| [`ArenaTreeView`](components/ludics/arena/ArenaTreeView.tsx) | The arena as a tree of addresses. |
| [`PositionExplorer`](components/ludics/arena/PositionExplorer.tsx) | List of legal positions with legality flag filters. |
| [`PositionDetailPanel`](components/ludics/arena/PositionDetailPanel.tsx) | Single-position drill-down. |

[`components/ludics/game/`](components/ludics/game/) wraps the simulation/AI loop on top of an arena:

| Component | Role |
| --- | --- |
| [`GamePanel`](components/ludics/game/GamePanel.tsx) | Game container; mounts setup → play → analysis. |
| [`GameSetupPanel`](components/ludics/game/GameSetupPanel.tsx) | Pick designs, player roles, mode. |
| [`GamePlayPanel`](components/ludics/game/GamePlayPanel.tsx) | Interactive play UI; calls `/api/ludics/dds/games/play`. |
| [`GameSimulatorPanel`](components/ludics/game/GameSimulatorPanel.tsx) | AI vs AI runner using `dds/game/ai.ts`. |
| [`WinningAnalysisPanel`](components/ludics/game/WinningAnalysisPanel.tsx) | Win/loss decomposition for a completed game. |

### 10.6 Viewers subdir

[`components/ludics/viewers/`](components/ludics/viewers/) hosts presentational viewers used outside the deep-dive shell (e.g. embedded in dialogue cards):

| Component | Role |
| --- | --- |
| [`ArenaViewer`](components/ludics/viewers/ArenaViewer.tsx) | Read-only arena diagram. |
| [`InteractionPlayer`](components/ludics/viewers/InteractionPlayer.tsx) | Play back a recorded interaction. |
| [`LandscapeHeatMap`](components/ludics/viewers/LandscapeHeatMap.tsx) | Density map across designs of a deliberation. |
| [`ProofNarrative`](components/ludics/viewers/ProofNarrative.tsx) | Narrate a trace into prose via `narrateTrace`. |

### 10.7 Orchestration — `LudicsPanel`

[`components/deepdive/LudicsPanel.tsx`](components/deepdive/LudicsPanel.tsx) is the deep-dive surface that ties everything together. It is the single largest component in the ludics UI (~3.3 kloc) and behaves as a thin orchestration layer over the primitives in §10.1–10.6:

```
LudicsPanel
├── header
│   ├── Segmented (design/trace/commitments/analysis/arena/game)
│   ├── LudicsActionsToolbar (compile, step, orthogonal, fax)
│   └── InsightsBadge + InsightsTooltip
│
├── design panel ── LociTreeWithControls
│                  └── LocusControls (close, fax, branch)
│
├── trace panel  ── TraceRibbon
│                  ├── ActInspector (selected act)
│                  └── ProofNarrative (narrateTrace)
│
├── commitments  ── CommitmentsPanel (+ CommitmentDelta, NLCommitPopover)
│
├── analysis     ── AnalysisPanel
│                  ├── StrategyInspector
│                  ├── ViewInspector / ChronicleViewer / CorrespondenceViewer
│                  └── BehaviourHUD / SaturationPanel (Phase 5)
│
├── arena        ── ArenaPanel (with embedded ArenaViewer)
│
├── game         ── GameViewPanel (local Segmented: player/arena/landscape/narrative)
│                  ├── GamePlayPanel
│                  ├── LandscapeHeatMap
│                  └── ProofNarrative
│
└── judge        ── JudgeConsole (always-visible footer)
```

Data flow follows the rule **fetch high, render low**: `LudicsPanel` owns the `useSWR` calls against the §9 routes and passes resolved data downward as props. Child components are stateless wrt server data — they receive shaped values and emit callbacks for mutating routes. This makes the surface trivially testable and lets the same primitives be embedded in non-deep-dive contexts (e.g. dialogue cards using `viewers/`).

---

## Persistence Layer

All ludics state lives in PostgreSQL via Prisma. The full schema for the subsystem occupies [`lib/models/schema.prisma`](lib/models/schema.prisma) lines ~5281–5820 and groups into five clusters.

### 11.1 Cluster overview

| Cluster | Models | Purpose |
| --- | --- | --- |
| **Geometry** | `LudicLocus`, `LudicDesign`, `LudicAct`, `LudicChronicle`, `LudicFaxMap` | The core Girardian objects + locus rename ledger. |
| **Interaction** | `LudicTrace`, `LudicCommitmentElement`, `LudicCommitmentState`, `LudicDecisionReceipt` | Step-traces, the commitment ledger, moderator receipts. |
| **DDS Phase 1–3** | `LudicView`, `LudicDispute`, `LudicPosition`, `LudicStrategy`, `LudicPlay`, `LudicStrategyView`, `LudicInnocenceCheck`, `LudicPropagationCheck`, `LudicCorrespondence`, `LudicIsomorphismCheck` | The Faggian–Hyland layer (§7) and its verification caches. |
| **DDS caches** | `LudicDisputeCache`, `LudicChronicleCache`, `LudicOrthogonalityCheck`, `LudicBiorthogonalClosure` | Materialised aggregates keyed by `designId` / `strategyId`. |
| **Behaviours / Types / Arena** *(Phase 5–6)* | `LudicBehaviour`, `LudicMaterialDesign`, `LudicGame`, `LudicGamePosition`, `LudicIncarnation`, `LudicType` | Type-system and game-theoretic layer; Phase 5 in progress. |

### 11.2 Geometry detail

[`LudicLocus`](lib/models/schema.prisma#L5281) is keyed on `(dialogueId, path)` — the `dialogueId` scoping was added explicitly to break the global "0" collisions that the original schema suffered. `LudicLocus` is self-referential via `parentId` and carries a `createdByTurnId` for provenance.

[`LudicDesign`](lib/models/schema.prisma#L5303) attaches a design to `(deliberationId, participantId, rootLocusId)` and carries the **scoped design** triple (`scope`, `scopeType`, `scopeMetadata`) introduced in Phase 4. `referencedScopes[]` and `crossScopeActIds[]` (also Phase 4) record cross-scope delocations so the engine can detect implicit dependencies. The composite indexes `[deliberationId, scope]` and `[deliberationId, participantId, scope]` are what make per-scope "find the P/O pair" queries cheap.

[`LudicAct`](lib/models/schema.prisma#L5345) is ordered within its parent design by `orderInDesign` (the index `[designId, orderInDesign]` is the hot path for stepper enumeration). The optional back-relation `aifNode` is what bridges into the AIF subsystem.

[`LudicChronicle`](lib/models/schema.prisma#L5371) is intentionally minimal — `(designId, order, actId)` — because chronicles are derived; they're persisted only when they need to be cited (e.g. as evidence in a `LudicIsomorphismCheck`).

[`LudicFaxMap`](lib/models/schema.prisma#L5421) is the rename ledger. Every fax / clone / branch / delocate writes a row, so the history of locus identity is fully auditable.

### 11.3 Interaction detail

[`LudicTrace`](lib/models/schema.prisma#L5380) records a single `stepInteraction` run as `(deliberationId, posDesignId, negDesignId, status, steps: Json)`. The `endedAtDaimonForParticipantId` field is the only place that records *who* the † was attributed to.

[`LudicCommitmentElement`](lib/models/schema.prisma#L5401) and [`LudicCommitmentState`](lib/models/schema.prisma#L5425) form the commitment ledger. An element is the (owner, polarity, locus, label, entitled?) tuple; a state is an owner's bag of elements over time. `commitmentMappings` links into [`CommitmentLudicMapping`](lib/models/schema.prisma), the bridge to the dialogue layer's `CommitmentStore`.

[`LudicDecisionReceipt`](lib/models/schema.prisma) is the moderator audit trail with `kind ∈ {epistemic, procedural, allocative, editorial}`. The dialogue layer also produces decision receipts, but ludics receipts always carry a locus or design pointer.

### 11.4 DDS detail

Covered exhaustively in §7. The key persistence-layer points:

- **Unique constraints** carry the theory: `(designId, player)` on `LudicStrategy`, `(designId, strategyId)` on `LudicCorrespondence`, `(correspondenceId, isomorphismType)` on `LudicIsomorphismCheck`, `(sourceDesignId, targetDesignId, incarnationType)` on `LudicIncarnation` — each rules out a class of meaningless duplicates.
- **Cached check rows** are 1:1 with the entity they describe (`LudicInnocenceCheck.strategyId @unique`, same for propagation), so recomputation is a simple `upsert`.
- **JSON columns** hold sequences/violations that don't need to be queried inside Postgres — `viewSequence`, `actionPairs`, `violationLog`, `evidence`, `arenaJson`, `positionsJson`. The corresponding Zod schemas in `packages/ludics-rest/schemas.ts` enforce shape at the API boundary.

### 11.5 Migrations

All ludics schema changes ship via `npx prisma db push` (per repo convention — never `prisma migrate dev`). Phase boundaries (§14) correspond to migration batches; the Phase 4 scoped-design migration was the only one to require a data backfill, handled by [`scripts/`](scripts/) one-shots that populated `scope`/`scopeType` from existing `extJson`.

---

## Integration Points

The ludics subsystem is deliberately non-isolated: it both consumes and exports state across the platform. The map below names every cross-system bridge.

### 12.1 AIF ↔ Ludics

The richest integration. See [§6 sequence 3](#sequence-3--aif-correspondence-sync--verify) for the runtime flow and the [AIF System Architecture](AIF_ONTOLOGY_SYSTEM_ARCHITECTURE.md) for the AIF side.

| Direction | Mechanism | Files |
| --- | --- | --- |
| Ludics → AIF | After every compile, [`lib/ludics/syncToAif.ts`](lib/ludics/syncToAif.ts) walks the new designs and emits `AifNode`/`AifEdge` rows. Polarity drives node type: `P+claim → I`, `P+argument → RA`, `O+attack → CA`, `† → DM`. The `LudicAct.aifNode` back-relation pins the mapping. | [`packages/ludics-engine/aif-sync.ts`](packages/ludics-engine/aif-sync.ts), [`lib/ludics/syncToAif.ts`](lib/ludics/syncToAif.ts) |
| AIF → Ludics | The DDS correspondence verifier optionally cross-checks against the AIF mirror via [`/api/ludics/dds/correspondence/verify-aif`](app/api/ludics/dds/correspondence/verify-aif/route.ts) — a disagreement between the two is reported as a structured `LudicCorrespondence.isomorphisms` failure. | [`lib/ludics/aifCorrespondence.ts`](lib/ludics/aifCorrespondence.ts) |

The single canonical bridge is `LudicAct.aifNode` (1:0..1). Any new bridge should go through that relation rather than introducing parallel tables.

### 12.2 ASPIC ↔ Ludics

ASPIC arguments materialise into ludics designs through the **argument-as-design** mapping (the *argumentation as ludics* interpretation): each ASPIC argument becomes a design rooted at a fresh locus, with rule applications becoming positive acts and undercutters/rebutters becoming O-attacks. The bridge is read-only from ludics' perspective — ludics consumes ASPIC outputs but never mutates them.

| Direction | Mechanism |
| --- | --- |
| ASPIC → Ludics | The compiler's `scopingStrategy` accepts `"argument"` scope; the resulting designs carry `scope: "argument:<argId>"` and `scopeType: "argument"`. |
| Ludics → ASPIC | Read-only — DDS correspondence results are surfaced as badges on ASPIC argument cards via the deliberation page, not written back. |

See the [ASPIC System Architecture](ASPIC_SYSTEM_ARCHITECTURE.md) for the other side.

### 12.3 Dialogue protocol ↔ Ludics

`DialogueMove` rows are the *primary input* to the ludics compiler. The relationship is one-directional and continuous: every new move appended to a deliberation triggers a recompile (debounced) via the cron route in [`app/api/_cron/`](app/api/_cron/). The protocol's `CommitmentStore` is reflected into `LudicCommitmentElement` via [`packages/ludics-engine/commitments.ts`](packages/ludics-engine/commitments.ts) so that locus-level commitments stay in sync with proposition-level ones.

[`packages/ludics-core/dds/adapters/`](packages/ludics-core/dds/adapters/) contains protocol-shape → DDS adapters used when running disputes that aren't themselves driven by the live dialogue (e.g. simulated games in `dds/game/`).

### 12.4 Commitments ↔ Ludics

Two-way:

- Ludics → Commitments: appending a `daimon` for P updates P's commitment state via [`packages/ludics-engine/daimon.ts`](packages/ludics-engine/daimon.ts).
- Commitments → Ludics: the concession protocol ([`packages/ludics-engine/concession.ts`](packages/ludics-engine/concession.ts)) reads from `CommitmentStore`, anchors the conceded proposition in the receiver's `LudicCommitmentElement` set, and rewrites the affected locus.

### 12.5 Deliberation ↔ Ludics

Every `LudicDesign` is indexed by `deliberationId`; every `LudicTrace`, `LudicDispute`, `LudicGame`, `LudicBehaviour`, and `LudicType` carries one too. Deletion of a deliberation cascades to all ludics state. The `/api/ludics/insights` route is the read-side that the deliberation page calls to render its ludics badges.

### 12.6 Insights ↔ UI

`LudicsInsights` (computed by [`lib/ludics/computeInsights.ts`](lib/ludics/computeInsights.ts)) is the projection most non-ludics surfaces consume — argument cards, deliberation summaries, search results. It is the only cross-surface data shape that does *not* require the consumer to understand the underlying schema; everything else is opt-in.

---

## Caching & Concurrency

Three caching layers and two concurrency primitives.

### 13.1 Cache layers

**Layer 1 — Postgres cache rows.** The verification caches in §11.4 (`LudicInnocenceCheck`, `LudicPropagationCheck`, `LudicCorrespondence`, `LudicIsomorphismCheck`, `LudicOrthogonalityCheck`, `LudicBiorthogonalClosure`, `LudicDisputeCache`, `LudicChronicleCache`). Keyed on the entity id; invalidated by re-extraction or by parent mutation. These exist because the underlying computations are pure but expensive and the inputs are immutable enough that the cache hit-rate is high.

**Layer 2 — Redis insights cache.** [`lib/ludics/insightsCache.ts`](lib/ludics/insightsCache.ts) wraps `computeInsights` in `getOrSet` with a **5-minute TTL**. Keyed `ludics:insights:<deliberationId>` (and `ludics:insights:<deliberationId>:<locusPath>` for the locus variant). Falls back to direct compute on Redis failure, never blocks. Invalidated explicitly by [`/api/ludics/insights/invalidate`](app/api/ludics/insights/invalidate/route.ts) on compile / step / fax.

**Layer 3 — SWR client cache.** Every `LudicsPanel` `useSWR` call benefits from the browser's request dedup + stale-while-revalidate behaviour. The default revalidation rules apply; no custom mutator wiring beyond `mutate('/api/ludics/...')` after writes.

### 13.2 Concurrency primitives

**In-process compile mutex.** [`packages/ludics-engine/locks.ts`](packages/ludics-engine/locks.ts) implements a keyed-mutex via promise chaining:

```ts
withCompileLock(deliberationId, () => compileFromMoves(deliberationId))
```

This serialises concurrent compiles for the *same* deliberation within a single Node process. It does *not* protect across processes.

**Postgres advisory locks.** The application-glue [`lib/ludics/locks.ts`](lib/ludics/locks.ts) (called from the route layer) uses `pg_try_advisory_lock` keyed by `hash(deliberationId)` to serialise compiles across processes. The combination of in-process and advisory locks means: no two compile runs for the same deliberation ever execute concurrently, anywhere in the cluster.

The stepper deliberately does **not** lock — interaction stepping is read-only against `LudicDesign`/`LudicAct` and only writes the resulting `LudicTrace`, which is keyed by its own primary key. Concurrent steps are fine.

### 13.3 Cache-coherence invariants

| Invariant | Enforced by |
| --- | --- |
| Recompile invalidates insights | `/api/ludics/compile*` routes call `/api/ludics/insights/invalidate` post-success. |
| Re-extracting a strategy invalidates innocence/propagation | `dds/strategies/generate` upserts with `playCount: 0` and clears the cached check rows. |
| Mutating a design invalidates correspondence | `LudicCorrespondence.updatedAt` is bumped; the verifier refuses stale rows. |
| Fax/delocate preserves act identity | `LudicFaxMap` row written; ramification rewrites use the map, so step trace re-runs converge. |

---

## Phases & Implementation History

The ludics subsystem was built in six phases, four landed and two in progress.

| Phase | Title | Status | Key landings |
| --- | --- | --- | --- |
| **1** | Core geometry + insights | ✅ Landed | `LudicLocus`/`LudicDesign`/`LudicAct`/`LudicChronicle`; compile-from-moves; `computeInsights` + Redis cache; primitive UI (loci tree, trace ribbon). |
| **2** | Interaction & receipts | ✅ Landed | Stepper with three composition modes; orthogonality + decisive analysis; commitment ledger; judge/concession/daimon; `LudicDecisionReceipt`. |
| **3** | DDS Phase 1–2 | ✅ Landed | First-class `LudicView`, `LudicDispute`, `LudicPosition` (with four legality flags); `LudicStrategy`, `LudicPlay`, `LudicStrategyView`; innocence + propagation. |
| **4** | Scoped designs + DDS Phase 3 | ✅ Landed | `scope`/`scopeType`/`scopeMetadata` on `LudicDesign`; cross-scope delocation (`crossScopeActIds`); `LudicCorrespondence` + four-isomorphism verifier; AIF mirror cross-check. |
| **5** | Type system & behaviours | 🔄 **In progress** | `LudicBehaviour`, `LudicMaterialDesign` landed; uniformity / saturation / types `validate` routes scaffolded; `SaturationPanel`, `TypeSystemPanel`, `BehaviourInspectorCard`, `UniformityPill` shipping behind feature surfaces. Biorthogonal closure approximation needs tightening against worked Faggian–Hyland examples. |
| **6** | Arena & game viewers | 🔄 **Starting** | `LudicGame`, `LudicGamePosition`, `LudicIncarnation` models landed; arena/game routes + components written; `dds/game/ai.ts` simulator runs. Remaining: stable arena UX, winning-strategy visualisation polish, replay export. |

Annotations of *"(Phase 5, in progress)"* and *"(Phase 6)"* throughout this document mark the surfaces affected.

---

## Theory Postulates

The implementation is faithful to a small set of theoretical postulates. Each is stated here as a one-liner with its provenance and the module that enforces it; together they form the contract that distinguishes "Isonomia ludics" from a generic step engine.

| # | Postulate | Provenance | Enforced by |
| --- | --- | --- | --- |
| P1 | Polarity strictly alternates within a play. | Girard 1997 §1 | `policies.ts`, `LudicPosition.isParity` |
| P2 | Loci form a tree; ramification opens fresh children. | Girard 1997 §2 | `LudicLocus.parentId`, `compileFromMoves.ts` |
| P3 | Every non-initial act has a justifier earlier in the play. | Girard 1997 §3 | `visibility.ts`, `LudicPosition.isJustified` |
| P4 | A justifier must lie in the active player's view. | Girard 1997 §3 (visibility) | `visibility.ts`, `LudicPosition.isVisible` |
| P5 | Daimon (`†`) is the unique loss/give-up move. | Girard 1997 §4 | `daimon.ts`, `LudicDesign.hasDaimon` |
| P6 | Orthogonality: `D ⊥ E` iff their interaction converges. | Girard 1997 §5 | `orthogonal.ts`, `LudicOrthogonalityCheck` |
| P7 | Innocence = determinism ∧ view-stability. | Faggian–Hyland 2002 Def 4.8 | `dds/strategy/innocence.ts`, `LudicInnocenceCheck` (split flags) |
| P8 | Propagation: same prefix ⇒ same opened addresses. | Faggian–Hyland 2002 Def 4.25 | `dds/strategy/propagation.ts`, `LudicPropagationCheck` |
| P9 | Design ↔ strategy correspondence via the four isomorphisms. | Faggian–Hyland 2002 Prop 4.18, 4.27 | `dds/correspondence/isomorphisms.ts`, `LudicIsomorphismCheck` |
| P10 | Behaviours are biorthogonally closed sets of designs. | Girard 1997 §6 | `dds/behaviours/closure.ts`, `LudicBiorthogonalClosure` |
| P11 | Material design (incarnation) is the minimal generator of a behaviour. | Faggian–Hyland 2002 Def 6.3 | `LudicMaterialDesign`, `LudicIncarnation` |
| P12 | Uniformity: behaviour on fresh siblings is invariant under fax. | Terui 2011 | `uniformity.ts`, `LudicBehaviour.uniformBound` *(Phase 5)* |
| P13 | Fax is identity up to renaming — round-trips must commute with stepping. | Girard 1997 §7 (delocation) | `fax.ts`, `LudicFaxMap`; tested in `__tests__/` |
| P14 | The four moderator-receipt kinds — *epistemic*, *procedural*, *allocative*, *editorial* — partition all decisions. | Isonomia extension | `LudicDecisionReceipt.kind` enum |
| P15 | Cross-scope acts must declare their origin via `crossScopeActIds` + `LudicFaxMap`. | Isonomia extension (Phase 4) | `LudicDesign.crossScopeActIds`, `delocate.ts` |

Postulates P14 and P15 are Isonomia extensions; the rest are direct implementations of the cited theory. Anywhere the implementation knowingly departs from theory (e.g. the saturation approximation in Phase 5) is flagged in §16.

---

## Extensions & Open Issues

### 16.1 Isonomia extensions over classical ludics

These are the deliberate departures from Girard / Faggian–Hyland that are now part of the persisted schema and the API contract:

1. **Scoped designs** (Phase 4). A single deliberation hosts many designs, scoped by topic, actor-pair, or argument; cross-scope references are explicit (`crossScopeActIds`, `LudicFaxMap`). Classical ludics has no notion of scope.
2. **Behaviours as first-class** (Phase 5). `LudicBehaviour` + `LudicMaterialDesign` are persisted, not derived on the fly, so the type system can be queried like any other table.
3. **DDS as a sibling subsystem.** The Faggian–Hyland reformulation gets its own routes, models, and UI rather than being collapsed into the engine; the **four isomorphisms are persisted individually** so users can see *which* equivalence fails.
4. **AIF correspondence as a built-in cross-check.** Every ludics compile mirrors into AIF; the DDS verifier optionally cross-checks against the mirror.
5. **Commitment grounding.** Locus-level commitments and proposition-level commitments are kept in sync, with concession defined operationally.
6. **Decision receipts.** The four-way receipt kinds (P14) are a Isonomia contract; classical ludics has only † as a decision primitive.

### 16.2 Open issues

| Issue | Affects | Notes |
| --- | --- | --- |
| Biorthogonal-closure approximation. | Phase 5 behaviours | `dds/behaviours/closure.ts` enumerates a bounded fragment; we have no proof of completeness for arbitrary designs. Tracked by a behaviour-test corpus. |
| Uniformity bound discovery. | Phase 5 | `checkUniformity` requires a fuel parameter; we don't yet have an automated minimum-fuel search. |
| Game UX. | Phase 6 | Replay export and winning-strategy visualisation still rough; AI player is single-policy. |
| Cross-process correspondence cache invalidation. | DDS | `LudicCorrespondence.updatedAt` works in practice but isn't a hard invariant — a fast mutation+verify race could read a stale row before invalidation propagates. |
| Postgres `Json` column size. | Disputes, strategies | Long disputes serialise large `actionPairs`; we don't currently shard, but the schema leaves room. |
| AIF mirror lag. | Integration | The mirror is updated post-compile, not transactionally; consumers should treat it as eventually consistent. |
| Performance Monitor instrumentation gaps. | Analysis dashboard | Engine-side timings are reported per route; per-module timings (e.g. `ve` vs `policies`) are not yet broken out. |

### 16.3 Roadmap pointers

- **Phase 7 (planned)** — Probabilistic ludics for prediction-grounded designs; preliminary discussion in [`Internal_Documents/`](Internal_Documents/) and the prediction roadmap.
- **Phase 8 (speculative)** — Categorical glue between ludics behaviours and AIF schemes (the synthesis referenced in [`Agora_Reference_Documents/A Synthesis of Categorical, Logical, and Argumentative Frameworks.txt`](Agora_Reference_Documents/A%20Synthesis%20of%20Categorical%2C%20Logical%2C%20and%20Argumentative%20Frameworks.txt)).

---

## References

### Primary theory

- **Girard, J.-Y. (1997).** *Locus Solum: from the rules of logic to the logic of rules.* The foundational ludics paper; defines loci, designs, chronicles, daimon, orthogonality, and behaviours.
- **Faggian, C. & Hyland, J. M. E. (2002).** *Designs, disputes and strategies.* The DDS reformulation; defines strategies (Def 4.6), innocence (Def 4.8), propagation (Def 4.25), the four correspondence isomorphisms (Prop 4.18, 4.27), and incarnation (Def 6.3, 6.4).
- **Terui, K. (2011).** *Computational ludics.* The computational presentation used as the engine's operational reference; provides the uniformity formulation.
- **Fouqueré, C. & Quatrini, M. (2013).** *Ludics and natural language: first approaches.* Source for the dialogue-protocol → design encoding.

### Companion Isonomia documents

- [ASPIC System Architecture](ASPIC_SYSTEM_ARCHITECTURE.md) — argumentation framework that supplies designs via the `"argument"` scope.
- [AIF Ontology System Architecture](AIF_ONTOLOGY_SYSTEM_ARCHITECTURE.md) — the I/RA/CA/PA/MA/DM mirror.
- [Direct Message SRS](../../Direct_Message_SRS.md) and [Linear Workflow Builder SRS](../../Linear_Workflow_Builder_SRS.md) — surrounding deliberation infrastructure.
- [`Commonplace: the memory-infrastructure.md`](../../Commonplace:%20the%20memory-infrastructure.md) — substrate context.
- [`Agora_Reference_Documents/`](../../Agora_Reference_Documents/) — categorical/logical synthesis notes.

### In-repo code anchors

| Topic | Anchor |
| --- | --- |
| Core types | [`packages/ludics-core/types.ts`](packages/ludics-core/types.ts) |
| Engine entry points | [`packages/ludics-engine/compileFromMoves.ts`](packages/ludics-engine/compileFromMoves.ts), [`stepper.ts`](packages/ludics-engine/stepper.ts) |
| DDS theory implementation | [`packages/ludics-core/dds/`](packages/ludics-core/dds/) |
| API surface | [`app/api/ludics/`](app/api/ludics/) |
| UI primitives | [`packages/ludics-react/`](packages/ludics-react/) |
| UI shell | [`components/ludics/`](components/ludics/), [`components/deepdive/LudicsPanel.tsx`](components/deepdive/LudicsPanel.tsx) |
| App-glue | [`lib/ludics/`](lib/ludics/) |
| Schemas | [`lib/models/schema.prisma`](lib/models/schema.prisma) (lines ~5281–5820), [`packages/ludics-rest/schemas.ts`](packages/ludics-rest/schemas.ts) |
| Tests | [`packages/ludics-core/dds/__tests__/`](packages/ludics-core/dds/__tests__/), [`packages/ludics-engine/__tests__/`](packages/ludics-engine/__tests__/), [`__tests__/ludics/`](__tests__/ludics/) |

