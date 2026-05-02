
# AI Epistemic Surface — Roadmap Pt. 4 (Brainstorm)

**Theme:** translate deep deliberation scaffolding into modular, computable artifacts that survive surfacing to LLMs and non-expert humans — without flattening into centrist-synthesis prose.

**Status:** brainstorm. Not a sprint plan. Intended to inventory what we have, identify the impedance mismatches between scaffolding-depth and surface-legibility, and lay out candidate computable objects + delivery primitives.

---

## 0a. Prioritization decision (recorded May 2026)

This document is the prioritized track. The companion proposal in [ARTICLE_EXTRACTION_DELIBERATION_BASE_AUTOMATION-LLM-OUTLINE-V2.md](Development%20and%20Ideation%20Documents/ARTICLE_EXTRACTION_DELIBERATION_BASE_AUTOMATION-LLM-OUTLINE-V2.md) — a full source → claim → argument → deliberation extraction pipeline — is **deferred**. The reasoning, for the record:

- The extraction pipeline is a cold-start mitigation. It accepts the architectural risk of producing a dense, polished, never-engaged deliberation base (the "sophisticated corpse" failure mode named in §6 below and in the Pt. 3 retrospective) in exchange for early articulation density.
- That tradeoff is wrong for this stage of the platform. The right posture is to **accept that the initial corpus takes time and concerted effort to generate**, and to spend the engineering budget making the platform *ready* for that corpus — quality control, surface legibility, anti-strawman discipline, honesty primitives — rather than synthesizing the corpus prematurely.
- Premature corpus generation also damages the platform's distinguishing claim. The Pt. 3 stress test showed that the platform's value over an LLM-with-web-search baseline is *epistemic transparency about an actually-conducted deliberation*. A corpus full of pipeline-extracted, never-tested arguments would not deliver that value; it would launder model confidence as protocol confidence and fail the same stress test.
- The pipeline document remains a sound technical design and the integration story (pipeline as a generator of Stacks blocks + Article annotations rather than direct Argument writes; humans gate via Proposition Composer) is the right architecture if and when extraction work is taken up. It is recorded here so the integration is not relitigated later, but it is not on the Pt. 4 critical path.

**What replaces it for cold-start handling:** the honesty-first surface (§6 *Honesty-first*), cross-deliberation context (§6 *Cross-deliberation density*), AI-as-materials inside the FrontierLane (§6 *AI-as-materials*), and engagement-rate telemetry on AI seeds (§6 *Engagement-rate as a quality signal*). These are sufficient. They communicate thinness honestly rather than papering over it, and they invite human participation rather than substituting for it.

**Net framing:** Pt. 4 is a readiness-and-quality-control sprint, not a content-generation sprint. The deliberations themselves are the work of the community. The platform's job is to be ready for them — and to be honest, when it isn't yet, about what it does and does not know.

---

## 0. The unsolved problem, restated

Pt. 3 closed the obvious gaps in the MCP/API surface (fitness components, CQ aggregates, standing depth, structured citations, AI-author provenance). The stress test that surfaced those gaps also surfaced a deeper one:

- The deliberation engine has substantial **depth** — claim graphs, AIF argument structure, scheme-typed CQs, ASPIC+ acceptance, ludic dialogue games, commitment stores, argument chains, living theses, plexus meta-edges, cross-room functors, canonical-claim families, snapshot diffs, attestation envelopes, dialectical fitness, standing.
- The deliberation engine has substantial **surface area** — a DeepDivePanel with ten tabs, a thesis composer with snapshot diff, plexus boards / matrices / graphs, AIF diagrams, ludic game-tree visualizations, commitment dashboards, cross-room search, room functors.
- But the **translation** from internal depth to a legible surface — one an LLM can integrate into an editorial reading, or a non-expert can read without becoming an expert — is currently *the human reader's responsibility*. The MCP exposes fields. The DeepDivePanel exposes tabs. Neither produces a *finding*.

The Pt. 3 stress test confirmed that a fluent LLM-with-web-search baseline produces something that *looks* like a finding (centrist synthesis prose) but is structurally an unearned-balance artifact. The platform's competitive answer is not to imitate that surface — it is to produce a different kind of surface, one whose epistemic shape the protocol guarantees.

This document brainstorms what that surface should be.

---

## 1. Inventory of scaffolding (what we already compute)

Organized by scope. File references kept to representative paths; full audit exists in session notes.

### 1.1 Single-argument computables

| Object | What it carries | Where it lives |
|---|---|---|
| `Argument` | premises, conclusion, scheme, author, authorKind, aiProvenance | [prisma schema](lib/models/schema.prisma), [lib/aspic/arguments.ts](lib/aspic/arguments.ts) |
| `FitnessBreakdown` | components + weights + total (CQ, support, attack, attackCAs, evidence) | [lib/citations/argumentAttestation.ts](lib/citations/argumentAttestation.ts) |
| `StandingDepth` | state, challengers, reviewers, lastChallengedAt, confidence (thin/moderate/dense) | [lib/citations/argumentAttestation.ts](lib/citations/argumentAttestation.ts), [config/standingThresholds.ts](config/standingThresholds.ts) |
| `CriticalQuestionsAggregate` | per-CQ status (missing/open/pending/partial/satisfied/disputed) projected against scheme catalog | [lib/citations/argumentAttestation.ts](lib/citations/argumentAttestation.ts) |
| `CitationBlock` | url, doi, publisher, accessedAt, quote, quoteAnchor | [lib/citation/serialize.ts](lib/citation/serialize.ts) |
| Attestation envelope | hash-stable AIF/JSON-LD/MD render with provenance chain | [app/api/a/[shortCode]/route.ts](app/api/a/[shortCode]/route.ts) |

### 1.2 Single-claim / claim-graph computables

| Object | What it carries | Where it lives |
|---|---|---|
| `Claim` | text, MOID (sha256), label (IN/OUT/UNDEC), confidence | [prisma schema](lib/models/schema.prisma), [lib/db/argument-net-queries.ts](lib/db/argument-net-queries.ts) |
| `ClaimEdge` | support / attack with strength | [prisma schema](lib/models/schema.prisma) |
| Acceptance label | grounded / preferred extensions over CEG | [lib/aspic/arguments.ts](lib/aspic/arguments.ts) |
| `Proposition` | draft → endorsed → claim lifecycle | [components/propositions/](components/propositions/) |

### 1.3 Single-deliberation computables

| Object | What it carries | Where it lives |
|---|---|---|
| `ArgumentChain` | top claim → premise traversal across multiple arguments, with edge types (PRESUPPOSES, ENABLES, ATTACKS) | [lib/types/argumentChain.ts](lib/types/argumentChain.ts), [components/deepdive/v3/tabs/ChainsTab.tsx](components/deepdive/v3/tabs/ChainsTab.tsx) |
| `Thesis` (Living Thesis V1) | hypertextual prong-based document that embeds claims/arguments/evidence; tracks live confidence + inbound attacks; produces frozen snapshots | [components/thesis/](components/thesis/), [docs/LIVING_THESIS_ROADMAP.md](docs/LIVING_THESIS_ROADMAP.md) |
| `ThesisSnapshot` + diff | frozen markdown + confidence at moment-in-time, diffable against current | [components/thesis/](components/thesis/) |
| Commitment store | per-participant assertions / concessions / retractions; dialectical-inconsistency detection | [components/aif/CommitmentStorePanel.tsx](components/aif/CommitmentStorePanel.tsx) |
| Ludic saturation | locus tree, orthogonality, incarnation lax/sharp, saturation 0–1 | [lib/ludics/](lib/ludics/) |
| `Issue` | meta-deliberation: open questions about the deliberation itself | [components/issues/](components/issues/) |
| Works / TheoryWork | strict ASPIC+ rules + grounded/preferred extensions | [lib/aspic/arguments.ts](lib/aspic/arguments.ts) |

### 1.4 Cross-deliberation computables

| Object | What it carries | Where it lives |
|---|---|---|
| `PlexusEdge` | typed edge between deliberations: xref, shared_author, claim_overlap, stack_ref, argument_import | [workers/computeSharedAuthorEdges.ts](workers/computeSharedAuthorEdges.ts) |
| `RoomFunctor` | claim/argument mapping between rooms (category-theoretic) | [app/api/room-functor/transport/route.ts](app/api/room-functor/transport/route.ts) |
| `CanonicalClaim` | claim-variant family + canonical slug + summary | [lib/crossDeliberation/canonicalRegistryService.ts](lib/crossDeliberation/canonicalRegistryService.ts) |
| `ArgumentImport` | argument transported A → B with structureJson preserved | [lib/crossDeliberation/argumentTransportService.ts](lib/crossDeliberation/argumentTransportService.ts) |

### 1.5 The MCP surface (current)

`search_arguments`, `get_argument`, `get_claim`, `find_counterarguments`, `cite_argument`, `propose_argument`. Per-argument depth post-Pt.3: fitness components, CQ aggregate, standing depth, structured citations, author kind. **No primitive operates on a deliberation as a whole** — every read is argument-or-claim-scoped.

---

## 2. The impedance mismatches

What the scaffolding computes vs what the surface delivers. Each mismatch is a place where depth-of-protocol is currently invisible to LLM/human consumers.

### 2.1 Argument-scoped depth, deliberation-scoped silence
The MCP and API can return everything about *one* argument. Neither can return: "for this deliberation, here are the load-bearing unanswered undercuts, the terminal unrebutted leaves, the depth-confidence distribution across standing labels, the schemes most underrepresented relative to the question's character." A consumer that wants this picture has to fetch all arguments and compute the integration themselves — which is exactly the work the platform's metadata is supposed to obviate.

### 2.2 Chains exist, chains are invisible
`ArgumentChain` is a built object. It is not in MCP. It is not in attestation envelopes. It is not embedded in Living Thesis V1 (D4 blocker). A chain is the closest thing the platform has to "the structural argument an editorial would be making" — and it is currently a UI-only artifact.

### 2.3 Living Thesis is a document, not a finding
A Thesis is a *human-authored synthesis* over the deliberation's claims/arguments/evidence. It is not a *protocol-derived* synthesis. The confidence formula is computed; the prose is written. For an LLM consumer, this is a closer cousin to the centrist-synthesis failure mode than to a structured finding — it's just one whose author was a human inside the deliberation rather than an LLM outside it. The thesis surface needs a counterpart: a *non-prose* finding that the protocol can guarantee, separable from any author's editorial.

### 2.4 Plexus exists, plexus does not deliver
Cross-deliberation infrastructure is in place — typed edges, canonical claims, room functors, argument imports, plexus visualizations. But there is no MCP primitive for "find canonical claim families spanning rooms," "show me how this argument was adapted across deliberations," or "where in the plexus is this conclusion tested vs untested." Cross-deliberation is the natural answer to the cold-start problem (one room is thin, but the same canonical claim may be richly tested across rooms) and the surface for it is currently a UI feature rather than a queryable substrate.

### 2.5 Ludic / commitment / chain dynamics, never surfaced
Commitment inconsistencies, ludic saturation, locus-tree orthogonality, chain edge types — these are computed and used internally. None reaches the LLM-readable surface. They are arguably the deepest signals the platform produces (they describe the *dialectical dynamics* rather than just the static graph) and they are also the signals most likely to differentiate the platform from a "well-organized wiki."

### 2.6 Cold-start manifests as silence, not as labeling
With sparse participation, depth-`thin` and CQ-`mostly-unanswered` are *labels* on individual arguments. There is no deliberation-scope summary that says: "this deliberation has 6 arguments, median challenger count 1, 73% of catalog CQs unanswered, no recorded undercut on the strongest inference; use accordingly." Such a summary would honestly communicate the cold-start state without overclaiming or underclaiming.

### 2.7 No "missing-move" detector
The protocol's anti-strawman discipline is *passive*: undercuts and undermines force atomization when made. It is not *active*: nothing tells you "this scheme typically has CQ X and undercut Y, both of which are absent in this deliberation's instance." A missing-move detector would convert the protocol's preventive function into a productive surface.

---

## 3. Modular computable objects (proposed)

The unifying idea: produce **typed deliberation-scope objects** that are deterministic functions of the graph, attestation-stable (hash-equivalent across reads), and composable into surface primitives. Each object is a finding the protocol can guarantee.

### 3.1 `DeliberationFingerprint`
Deterministic hash + summary statistics over a deliberation. Cheap. Always available. Cacheable.

```ts
type DeliberationFingerprint = {
  deliberationId: string;
  contentHash: string;                    // hash over (argumentIds, edgeIds, schemes) sorted
  argumentCount: number;
  claimCount: number;
  edgeCount: { support: number; attack: number; ca: number };
  schemeDistribution: Record<string, number>;
  authorCount: { human: number; ai: number; hybrid: number };
  participantCount: number;
  standingDistribution: Record<StandingState, number>;
  depthDistribution: { thin: number; moderate: number; dense: number };
  cqCoverage: { answered: number; partial: number; unanswered: number; total: number };
  evidenceCoverage: { withProvenance: number; withoutProvenance: number };
  computedAt: string;
};
```

Surface implication: lets an LLM say "this deliberation is *6 arguments, median depth thin, CQ coverage 27%*" before doing any other work. It is the deliberation analogue of `StandingDepth` for an argument — an honesty primitive at the deliberation scope.

### 3.2 `ContestedFrontier`
The set of dialectical *open edges* — what would actually move the deliberation if engaged.

```ts
type ContestedFrontier = {
  unansweredUndercuts: Array<{
    targetArgumentId: string;
    inferenceLocator: string;             // which inference step
    challengerArgumentId: string | null;  // null = scheme-typical undercut never raised
    schemeTypical: boolean;               // came from missing-move detector
  }>;
  unansweredUndermines: Array<{
    targetArgumentId: string;
    targetPremiseId: string;
    challengerArgumentId: string | null;
  }>;
  unansweredCQs: Array<{
    targetArgumentId: string;
    schemeKey: string;
    cqKey: string;
    cqPrompt: string;
    severity: "scheme-required" | "scheme-recommended";
  }>;
  terminalLeaves: Array<{                 // unrebutted nodes downstream of attack chains
    argumentId: string;
    chainDepth: number;
    onMainConclusionPath: boolean;
  }>;
  loadBearingnessRanking: string[];       // ordered argumentIds by frontier impact
};
```

Surface implication: this is the *anti-centrist* substrate. An LLM asked to summarize cannot produce "the truth is somewhere between" prose if the surface it's reading hands it "here are the specific undercuts that have not been answered, ranked by impact, with explicit notations of whether they are scheme-typical absences or actively-raised challenges." It forces the synthesis to name moves rather than gesture at framing.

### 3.3 `MissingMoveReport`
Per-deliberation report of scheme-typical moves the graph does not contain.

```ts
type MissingMoveReport = {
  perArgument: Record<string, {
    schemeKey: string;
    expectedCqs: string[];                // catalog CQs for this scheme
    presentCqs: string[];
    missingCqs: string[];
    expectedUndercutTypes: string[];      // e.g. "circularity", "false-cause"
    presentUndercutTypes: string[];
    missingUndercutTypes: string[];
  }>;
  perDeliberation: {
    schemesUnused: string[];              // schemes the topic typically employs but no argument uses
    metaArgumentsAbsent: boolean;         // no argument-about-the-deliberation-itself
    crossSchemeMediatorsAbsent: boolean;  // no practical-reasoning bridge across empirical disputes
  };
};
```

Surface implication: this is the productive form of the protocol's anti-strawman discipline. The "emerging middle ground" prose move dies on contact with this object — the moves it *implies* are listed by name, marked present or absent.

### 3.4 `DialecticalCenterOfGravity`
Where in the graph the deliberation is actually doing work.

```ts
type DialecticalCenterOfGravity = {
  hottestArguments: string[];             // most recent + most authored against
  loadBearingArguments: string[];         // removal would change main-claim acceptance
  bridgeArguments: string[];              // connect otherwise-disconnected sub-debates
  orphans: string[];                      // no inbound or outbound dialectical traffic
  motiveStructure: {                      // ludic locus-tree summary
    mainBranches: string[];
    saturatedBranches: string[];
    abandonedBranches: string[];
  };
};
```

Surface implication: tells a consumer what to *read* if they only have time for three arguments. Currently this is implicit in DeepDivePanel's visualizations — not in the API/MCP surface.

### 3.5 `ChainExposure`
Argument chains, finally surfaced.

```ts
type ChainExposure = {
  chains: Array<{
    id: string;
    topClaimId: string;
    arguments: string[];                  // ordered traversal
    edges: Array<{ from: string; to: string; type: "PRESUPPOSES" | "ENABLES" | "ATTACKS" }>;
    chainStanding: StandingState;         // worst-link or grounded-extension
    chainFitness: FitnessBreakdown;       // aggregated
    weakestLink: { argumentId: string; reason: string };
  }>;
  uncoveredClaims: string[];              // top-level claims with no chain reaching them
};
```

Surface implication: addresses D4 by making chains first-class in the read surface, not just the UI. An LLM reading this can produce "the strongest empirical-side chain runs A→B→C; its weakest link is B (depth thin, CQ confounding unanswered)" — a sentence the current MCP surface cannot ground.

### 3.6 `CrossDeliberationContext`
Plexus, made queryable.

```ts
type CrossDeliberationContext = {
  canonicalClaims: Array<{
    canonicalClaimId: string;
    appearsInDeliberations: Array<{
      deliberationId: string;
      localClaimId: string;
      label: ClaimLabel;
      standingDistributionLocally: Record<StandingState, number>;
    }>;
    aggregateAcceptance: "consistent-IN" | "consistent-OUT" | "contested" | "undecided";
  }>;
  plexusEdgesIn: PlexusEdge[];           // for this deliberation
  argumentImports: Array<{
    importedFrom: string;
    importedAs: string;
    adaptationKind: "reference" | "adaptation" | "reuse";
  }>;
  schemeReuseAcrossRooms: Record<string, number>;
};
```

Surface implication: cold-start mitigation that does not require AI authoring. A thin local deliberation may participate in a thick canonical-claim family — that is a fact the surface should communicate, and it currently does not.

### 3.7 `SyntheticReadout` (the editorial primitive, with teeth)
The synthesis primitive. Distinct from a Thesis; this is *protocol-derived*, not human-authored.

```ts
type SyntheticReadout = {
  fingerprint: DeliberationFingerprint;
  frontier: ContestedFrontier;
  missingMoves: MissingMoveReport;
  centerOfGravity: DialecticalCenterOfGravity;
  chains: ChainExposure;
  cross: CrossDeliberationContext | null;
  refusalSurface: {                       // explicit list of resolutions the graph will not support
    cannotConcludeBecause: Array<{
      attemptedConclusion: string;        // shape only; no actual prose
      blockedBy: "unanswered-undercut" | "unanswered-undermine" | "scheme-incompatibility" | "depth-thin";
      blockerIds: string[];
    }>;
  };
  honestyLine: string;                    // protocol-generated single-line caveat
};
```

The contract: any LLM consuming a `SyntheticReadout` can produce an editorial reading, but cannot produce a "the truth is somewhere between" closer without lying about a structured field. The `refusalSurface` is the centerpiece — it enumerates *what the graph cannot license*, by reference to specific blockers.

---

## 4. Delivery primitives (what the MCP surface should grow into)

Each is an MCP tool. All are read-only. All are deterministic given a deliberation contentHash.

| Tool | Returns | When an LLM calls it |
|---|---|---|
| `get_deliberation_fingerprint(deliberationId)` | `DeliberationFingerprint` | First read; sets honesty floor for any subsequent claims |
| `get_contested_frontier(deliberationId, sortBy?)` | `ContestedFrontier` | When asked "what's unresolved?" |
| `get_missing_moves(deliberationId)` | `MissingMoveReport` | When asked "what's underdeveloped?" or "what would strengthen this debate?" |
| `get_center_of_gravity(deliberationId)` | `DialecticalCenterOfGravity` | When asked "where should I focus?" |
| `get_chains(deliberationId)` | `ChainExposure` | When asked about main lines of argument |
| `get_cross_context(deliberationId)` | `CrossDeliberationContext` | When local depth is thin and the canonical claim has cross-room evidence |
| `get_synthetic_readout(deliberationId)` | `SyntheticReadout` | When asked "summarize" or "what's the state of this debate?" — this is the editorial primitive, replacing ad-hoc free synthesis |
| (existing) `search_arguments`, `get_argument`, `cite_argument`, `find_counterarguments`, `propose_argument` | unchanged | argument-scope reads |

A complementary `summarize_debate` tool description should explicitly instruct LLMs to call `get_synthetic_readout` rather than synthesize from raw search hits — this is the discipline tool descriptions enforced on the existing MCP and the same principle applies here.

---

## 5. Human-non-expert delivery surfaces

The same modular objects feed UI primitives. Distinct from the LLM surface because rendering, not raw shape, is the work.

### 5.1 The `DeliberationStateCard`
A single card at the top of every deliberation view. Renders fingerprint + the two highest-severity items from frontier + the single most consequential missing move. Fits in 200 vertical pixels. Functions as a *reading map*, not a summary.

### 5.2 `FrontierLane`
A horizontal lane of the unanswered-frontier items, each with a one-click "open this thread" CTA that prefills the relevant composer (attack on premise X, propose CQ-answer Y, etc.). Converts the surface from passive to participatory. This is also where AI-as-materials lands — claim cards / evidence cards offered as raw substrate the human assembles into the missing move.

### 5.3 `ChainSpine`
A vertical render of `ChainExposure.chains[i].arguments`, with weakestLink highlighted, breaking the deliberation into the 1–3 main spines a non-expert can actually read. Replaces "browse 32 arguments" with "read 3 spines."

### 5.4 `PlexusContextRibbon`
A thin ribbon under the deliberation title: "this canonical claim also appears in [Climate Policy Debate (tested-survived, dense)] [Carbon Tax Proposal (tested-attacked, moderate)]." A non-expert who lands on a thin local deliberation gets the cross-room context as a single horizontal scan.

### 5.5 The thesis distinction
`Thesis` (human editorial) and `SyntheticReadout` (protocol editorial) coexist. The Thesis is *one author's* synthesis, attestable to that author. The SyntheticReadout is *the graph's* synthesis, attestable to the contentHash. A reader sees both, labeled. They can disagree — and that disagreement is itself a piece of dialectical metadata.

---

## 6. The cold-start question, in this frame

The Pt. 3 stress test diagnosed cold-start as the binding constraint. The objects above suggest two distinct strategies, applicable in parallel:

**Honesty-first.** `DeliberationFingerprint` and `ContestedFrontier` make thinness *legible* rather than hiding it behind structurally well-formed labels. The right reading for a thin deliberation is "this is articulation-only, not yet deliberation," and the surface should say so unambiguously. This is essentially free; it is a serialization of state we already compute.

**Cross-deliberation density.** `CrossDeliberationContext` exposes the platform's accumulated cross-room work as a substrate that a single thin deliberation can borrow from. Even if Room A has been tested by one challenger, the canonical claim in question may have been challenged across five rooms by twelve distinct authors. A reader (LLM or human) entering Room A should see that aggregate immediately. This requires plexus query infrastructure that is mostly built but not exposed.

**AI-as-materials, not AI-as-arguments.** Per Pt. 3 §"corpse risk" — the next iteration of AI authoring is claim-cards and evidence-cards (with provenance) that humans assemble into arguments inside the FrontierLane. This shifts the human role from auditor to author and aligns with the extraction-pipeline critique's "materials library" recommendation. A `propose_materials` MCP tool, distinct from `propose_argument`, would carry this load.

**Engagement-rate as a quality signal.** `DeliberationFingerprint` should expose `aiSeededRatio` and `humanEngagementRateOnAiSeeds` (attacks / supports / CQ-answers per AI draft over time). Below a threshold, the surface marks the deliberation as articulation-only-not-deliberation regardless of structural metrics. This is the protective measure against the "sophisticated corpse" failure mode.

---

## 7. What the protocol *will not* deliver, by design

The seven objects above and the `SyntheticReadout` aggregate are deliberately shaped to make certain outputs structurally unavailable:

- **Centrist-synthesis prose** — "the truth is somewhere between" requires manufactured poles, which `MissingMoveReport` and `ContestedFrontier` make harder to construct because the actual moves are named.
- **Confident editorial closure on contested terrain** — `refusalSurface` enumerates exactly what the graph will not license; a synthesis that closes anyway is lying about a structured field.
- **Trajectory claims without grounding** — "the alarmed camp has gotten stronger over time" cannot be a `SyntheticReadout` field; it would have to be filed as a sign- or expert-opinion argument with explicit CQs, most of which would be `unanswered`.
- **Vibes-based prioritization** — `loadBearingnessRanking` and `centerOfGravity` are computed from the graph; "this matters more" requires reference to those structured fields.

This is the "no" the platform's distinctive architecture lets it say. It is the form the anti-strawman discipline takes once moved from preventive (you cannot attack a conclusion without naming a premise or inference) to productive (a synthesis primitive that cannot synthesize centrism).

---

## 8. Open questions / next steps

Not actionable items; questions to resolve before drafting a Pt. 4 sprint plan.

1. **`SyntheticReadout` scope.** Should it be deliberation-scoped only, or also canonical-claim-scoped (cross-deliberation)? The latter is more useful for the cold-start case but harder to compute deterministically.
2. **Refusal surface formalism.** What is the exact rule that produces `refusalSurface.cannotConcludeBecause`? Likely: any conclusion C is marked `cannot-license` if the support graph for C has at least one inbound undercut or undermine that is `unanswered` *and* is not itself attacked. This is essentially grounded-extension membership, projected onto natural-language conclusions. Worth confirming we can keep this deterministic at scale.
3. **Cost of materializing all seven objects on every read.** Caching strategy keyed on `DeliberationFingerprint.contentHash` is probably right, with worker-precomputed materializations on edit. Worth measuring before committing to MCP latency budget.
4. **Thesis ↔ SyntheticReadout disagreement surface.** When a human-authored Thesis and the protocol-derived SyntheticReadout diverge, that is itself a finding. Where does it render? Is it a third object?
5. **Materials-library MCP surface.** The "AI-as-materials" track is a separate implementation concern from `SyntheticReadout`, but the policy invariants overlap (no permalink until human-assembled, no standing inflation). Consider a parallel `docs/MATERIALS_AUTHORING_POLICY.md` companion to the existing `docs/AI_AUTHORING_POLICY.md`.
6. **Should chains be first-class on retrieval before D4 ships?** D4 is gated on Living Thesis embedding. `ChainExposure` does not require that — it's a read-side projection. May be unblockable independently.
7. **Plexus exposure ordering.** `CrossDeliberationContext` requires plexus query primitives that are partially built. The minimum viable read may be canonical-claim families only; full plexus-edge typing can come later.

---

## Appendix A — Where each Pt. 3 sprint item now sits

Pt. 3 shipped the *substrate* primitives. Pt. 4 brainstorming above proposes the *integration* primitives that consume them.

| Pt. 3 item | Pt. 4 consumer |
|---|---|
| #1 Fitness breakdown | `DeliberationFingerprint` aggregates; `ChainExposure.chainFitness` |
| #2 Critical Questions aggregate | `ContestedFrontier.unansweredCQs`; `MissingMoveReport` |
| #3 Standing depth | `DeliberationFingerprint.depthDistribution`; honesty floor across all readouts |
| #5 AI authoring | needs `engagementRateOnAiSeeds` field on fingerprint; complemented by materials-library track |
| #7 Structured citations | unchanged (already canonical) |

Deferred Pt. 3 items become natural Pt. 4 work:

| Pt. 3 deferred | Pt. 4 framing |
|---|---|
| #4 Topology endpoint | partially absorbed into `ChainExposure` and `DialecticalCenterOfGravity`; the rest is a presentation choice |
| #6 Scheme-typed query | absorbed into `MissingMoveReport.perDeliberation.schemesUnused` and as a refinement to `search_arguments` |
