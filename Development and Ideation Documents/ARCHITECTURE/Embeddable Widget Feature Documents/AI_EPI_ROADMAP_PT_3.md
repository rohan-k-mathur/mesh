
# AI Epistemic Surface — Roadmap Pt. 3

**Theme:** cold-start-independent wins surfaced by `MCP_STRESS_TEST_4`.

The stress test confirmed the MCP surface is doing the right thing on a well-trodden topic (Haidt vs. Odgers): the model correctly identified standing states, scheme labeling, and topology as the platform's distinctive contribution, and correctly flagged participation density as the bottleneck. The items below all *increase the auditability and load-bearingness of the existing structured metadata* without depending on more humans showing up.

Ordering is rough leverage-ranked. Items 1, 2, 5 are the highest-impact; the rest compound.

---

## Sprint completion status

**Shipped (sprint 1):** #1, #2, #3, #7, #5. Schema changes pushed via `npx prisma db push --skip-generate`; Prisma client regenerated.

| Item | Status | Key files |
|---|---|---|
| #1 Fitness breakdown | ✅ shipped | [lib/citations/argumentAttestation.ts](lib/citations/argumentAttestation.ts) (`computeFitnessBreakdown`, `FITNESS_WEIGHTS`), [app/api/v3/search/arguments/route.ts](app/api/v3/search/arguments/route.ts) |
| #2 Critical Questions | ✅ shipped | [lib/citations/argumentAttestation.ts](lib/citations/argumentAttestation.ts) (`CriticalQuestionsAggregate` projecting catalog CQs against `CQStatus`) |
| #3 Standing depth | ✅ shipped | [lib/citations/argumentAttestation.ts](lib/citations/argumentAttestation.ts) (`StandingDepth`, distinct-author challenger/reviewer sets, self-author excluded), [config/standingThresholds.ts](config/standingThresholds.ts) |
| #4 Topology endpoint | ⏸ deferred | — |
| #5 AI-authored args | ✅ shipped | [lib/argument/aiAuthoring.ts](lib/argument/aiAuthoring.ts), [app/api/v3/arguments/ai-draft/route.ts](app/api/v3/arguments/ai-draft/route.ts), [app/api/v3/arguments/ai-draft/[id]/approve/route.ts](app/api/v3/arguments/ai-draft/[id]/approve/route.ts), [docs/AI_AUTHORING_POLICY.md](docs/AI_AUTHORING_POLICY.md), schema: `Argument.authorKind` + `Argument.aiProvenance` + `AuthorKind` enum in [lib/models/schema.prisma](lib/models/schema.prisma) |
| #6 Scheme-typed query | ⏸ deferred | — |
| #7 Structured citations | ✅ shipped | [lib/citation/serialize.ts](lib/citation/serialize.ts) (`CitationBlock`, `toCitationBlock`, `extractDoi`), wired into `ArgumentAttestation.structuredCitations` |

**Tests / verifiers:**
- [__tests__/lib/aiEpiPt3.test.ts](__tests__/lib/aiEpiPt3.test.ts) — `computeFitnessBreakdown` (sum=total, weights, negatives), `classifyStandingConfidence` (thin/moderate/dense), `toCitationBlock` (DOI extraction, null handling).
- [scripts/verify-ai-epi-pt3.ts](scripts/verify-ai-epi-pt3.ts) — HTTP smoke test: breakdown components sum to total, CQ buckets sum to catalog total, standing depth fields present, citation shape, `author.kind` enum.

**MCP surface updates:** [packages/isonomia-mcp/src/server.ts](packages/isonomia-mcp/src/server.ts) — `search_arguments` and `get_argument` tool descriptions now advertise `fitnessBreakdown`, `criticalQuestions`, `standingDepth`, `structuredCitations`, `author.kind`. `cite_argument` markdown output emits CQ line, standing-depth line, and author line; returned object includes the new fields.

**Hard invariants enforced for #5:**
1. AI drafts persist with `authorKind: "AI"` + `aiProvenance` blob and **do not** mint a permalink, so they are invisible to all public retrieval (which is gated by `permalink: { isNot: null }`).
2. Permalink is only minted on `approveAiDraft()` — published AI args still enter the dialectical record at the untested-default standing.

**Deferred follow-ups:** #4 (topology endpoint) and #6 (scheme-typed query primitive) per the original sprint plan. Cross-cutting items still open: `/.well-known/argument-graph` advertisement of new fields; OpenAPI `components.schemas` additions; re-run `MCP_STRESS_TEST_4` as the regression gate.

---

## 1 — Fitness score breakdown in MCP/API responses

**Why:** today the score (`10.15` vs `5.3`) lands as an oracle. The stress-test model said it was "independently grounded" but had to take that on faith. Decomposing the scalar makes the platform's epistemic claim *checkable* — the LLM can show its work, and downstream UIs can render component bars.

**Files to touch**

- `lib/argument/fitness.ts` (or wherever the score is currently computed) — refactor the computation to return a `FitnessBreakdown` object, with the existing scalar derived from it. Components, draft shape:
  ```ts
  type FitnessBreakdown = {
    total: number;
    components: {
      premisesFilled: { score: number; max: number };          // structural completeness
      evidenceLinked: { score: number; count: number };        // # premises with provenance
      criticalQuestionsAnswered: { score: number; answered: number; total: number };
      attacksOpen: { score: number; count: number };           // negative
      attacksResolved: { score: number; count: number };       // positive
      schemeCompliance: { score: number; passed: boolean };
    };
    weights: Record<string, number>;                            // make the formula self-describing
  };
  ```
- `app/api/v3/search/arguments/route.ts` and `app/api/a/[shortCode]/route.ts` — include `fitnessBreakdown` alongside `fitness` in the response. Keep `fitness` for backwards compat.
- `packages/mcp/src/tools/get_argument.ts` and `search_arguments.ts` — surface the breakdown in the tool result. Update the tool description so LLMs know it's available.
- `components/argument/FitnessBar.tsx` (new) — small stacked-bar UI primitive. Used by ArgumentCard.

**Verifier:** `scripts/verify-fitness-breakdown.ts` — pick 5 known arguments, assert `sum(weighted components) ≈ total` within float tolerance, and that each component's `max` is consistent across arguments of the same scheme.

---

## 2 — Unanswered Critical Questions as first-class structured data

**Why:** the model had to *infer absences* ("the causal-side argument doesn't have a developed response to confounding"). Each ASPIC scheme already carries a CQ list — exposing which are unanswered turns stubs from "TODO" into a concrete invitation, and gives LLMs a scheme-grounded checklist of what would move standing forward.

**Files to touch**

- `packages/sheaf-acl` or wherever the scheme registry lives — confirm each scheme has an enumerated `criticalQuestions: { id, prompt, addressedBy?: 'premise' | 'rebuttal' }[]`. Backfill where missing (start with the schemes already in active use: `cause-to-effect`, `expert-opinion`, `sign`, `practical-reasoning`, `negative-consequences`).
- `lib/argument/criticalQuestions.ts` (new) — `computeCQStatus(argument)` returns `{ answered: CQ[], unanswered: CQ[], partiallyAnswered: CQ[] }`. Logic: a CQ is answered if (a) a premise covers it via `cqId` linkage, (b) a recorded rebuttal addresses it, or (c) it's been explicitly marked dismissed by an editor.
- `prisma/schema.prisma` — add optional `cqId` field on `Premise` and `Attack` models; add `CqDismissal` table for editor-marked NA. Run `npx prisma db push`.
- API + MCP: include `criticalQuestions: { answered, unanswered, partiallyAnswered }` in the argument payload.
- `components/argument/CriticalQuestionsPanel.tsx` (new) — collapsible panel under the argument; unanswered CQs render as "Open this CQ" CTAs that prefill an attack/premise composer.
- Stub arguments: render unanswered CQs prominently — "this argument has 4 critical questions awaiting evidence."

**Verifier:** unit tests in `__tests__/lib/criticalQuestions.test.ts` — known fixtures per scheme; assert `answered + unanswered + partiallyAnswered === scheme.criticalQuestions.length`.

---

## 3 — Standing labels annotated with participation depth

**Why:** "tested-survived" with one challenger means something very different than "tested-survived" with fifty. The current label overclaims silently. This doesn't *fix* cold start but it stops the metadata from lying about itself, which is the more urgent failure mode for sophisticated consumers.

**Files to touch**

- `lib/argument/standing.ts` — extend the standing computation to also return:
  ```ts
  type StandingDepth = {
    state: StandingState;                      // existing enum
    challengers: number;                       // distinct authors who attacked
    independentReviewers: number;              // distinct authors who endorsed/voted
    lastChallengedAt: Date | null;
    lastDefendedAt: Date | null;
    confidence: 'thin' | 'moderate' | 'dense'; // derived from the counts
  };
  ```
  Thresholds for `confidence` should live in `config/standingThresholds.ts` so they're tunable without a code change.
- API + MCP: replace `standing: "tested-survived"` with `standing: { state, depth: StandingDepth }`. Keep the bare string available as `standing.state` for backwards compat.
- `components/argument/StandingBadge.tsx` — render as `tested-survived · 1 challenger · thin`. Tooltip explains the confidence tier.
- `packages/mcp/src/tools/*` — update tool descriptions so LLMs are told to consider `depth.confidence` when reporting on standing.

**Verifier:** `scripts/verify-standing-depth.ts` — sample 20 arguments, assert `challengers === COUNT(DISTINCT attack.authorId)` against the DB.

---

## 4 — Topic-level debate topology endpoint

**Why:** the model reconstructed a three-layer architecture (empirical / policy-bridge / policy-attack) from edges. The graph already knows this. Saving every consumer the reconstruction work is a one-time investment that pays out forever.

**Files to touch**

- `lib/topic/topology.ts` (new) — `computeTopology(topicId)` returns:
  ```ts
  type DebateTopology = {
    layers: {
      id: string;                               // 'empirical' | 'policy-bridge' | etc.
      label: string;
      argumentIds: string[];
    }[];
    attackChains: { from: string; to: string; resolved: boolean }[];
    mediators: string[];                        // arguments that synthesize across layers
    terminalLeaves: string[];                   // unrebutted leaves
    stubs: string[];
  };
  ```
  Layer detection: start with a heuristic (cluster by scheme family + attack-graph distance from a seed), then allow editor overrides via a `Topic.layerOverrides` JSON column.
- `app/api/v3/topics/[id]/topology/route.ts` (new) — returns the topology JSON. Edge-cache for ~5 min.
- `packages/mcp/src/tools/get_topic_topology.ts` (new tool) — exposes it to LLMs. Tool description explicitly says "use this before summarizing a debate."
- `components/topic/TopologyMap.tsx` (new, optional v1) — minimal layered DAG render. Defer if graph viz is too much for this sprint.

**Verifier:** `scripts/verify-topology.ts` — for the smartphone topic, assert layers contain expected scheme distributions and that the mediator synthesis argument appears in `mediators`.

---

## 5 — AI-authored arguments with first-class provenance

**Why:** this is the *only* item that meaningfully attacks cold start without compromising epistemics. The standing system already prevents AI-authored arguments from inflating the dialectical record — they enter as `untested-default` and stay there until a human engages. We use the existing standing machinery to safely bootstrap articulation density. The unfilled Odgers spec-curve stub is a perfect first target.

**Files to touch**

- `prisma/schema.prisma` — add to `Argument`:
  ```prisma
  authorKind     AuthorKind @default(HUMAN)   // HUMAN | AI | HYBRID
  aiProvenance   Json?                         // { model, promptHash, sourceDocs, generatedAt }
  ```
  Add `AuthorKind` enum. Run `npx prisma db push`.
- `lib/argument/aiAuthoring.ts` (new) — `proposeArgumentFromSources({ topicId, scheme, sources, model })`. Returns a draft `Argument` payload; does **not** auto-publish. Hard invariant: AI-authored args are forced to `standing.state = 'untested-default'` regardless of structural completeness.
- `app/api/v3/arguments/ai-draft/route.ts` (new) — token-gated POST. Body: `{ topicId, scheme, sourcesUrl[], hint? }`. Returns the draft for editor review.
- `app/(internal)/editor/ai-drafts/page.tsx` — internal review queue. Editors approve → publishes as `authorKind: AI`, standing stays `untested-default`. The standing label in the UI shows an "AI-drafted" chip so readers and other LLMs know.
- API + MCP: include `authorKind` and (when AI) `aiProvenance.model` in argument responses. Tool descriptions instruct LLMs to flag AI-authored arguments when reporting on a debate.
- Policy doc: short `docs/AI_AUTHORING_POLICY.md` (already a candidate, since this is the load-bearing trust move).

**Verifier:** `__tests__/api/ai-draft.test.ts` — assert AI drafts cannot be created with any standing other than `untested-default`; assert `authorKind: AI` appears in the public payload.

**Sequencing note:** ship #3 (standing depth) before #5 in user-facing form. Once depth is visible, AI-authored content at `untested-default · 0 challengers · thin` reads honestly. Without depth, AI content risks looking more authoritative than it is.

---

## 6 — Scheme-typed query primitive

**Why:** scheme labels are currently display-only. Making them load-bearing for retrieval encourages LLMs to reason scheme-by-scheme rather than flattening the debate into prose.

**Files to touch**

- `app/api/v3/search/arguments/route.ts` — already accepts a `scheme` query param (per `AI_EPI_ROADMAP_PT_2.md`). Verify it's wired through to the underlying query and indexed. Add `schemeFamily` (e.g. `causal`, `practical`, `authority`) for coarser filters.
- `prisma/schema.prisma` — add a DB index on `Argument.scheme` if not already present.
- `packages/mcp/src/tools/search_arguments.ts` — surface `scheme` and `schemeFamily` as documented parameters in the tool schema. Add example invocations to the tool description.
- `app/api/v3/topics/[id]/by-scheme/route.ts` (new, thin) — convenience endpoint returning `{ [scheme]: argumentIds[] }` for a topic.

**Verifier:** `scripts/verify-scheme-query.ts` — assert `?scheme=cause-to-effect` returns only matching args; assert `schemeFamily=causal` is a strict superset.

---

## 7 — Structured citation provenance pass-through

**Why:** sources currently appear in prose. Making each citation a structured object lets LLMs quote with attribution and lets downstream UIs render proper citation chips. Trivial to implement, large credibility multiplier.

**Files to touch**

- `prisma/schema.prisma` — confirm `Evidence` (or equivalent) has `url`, `doi?`, `quote?`, `quoteAnchor?`, `accessedAt?`, `publisher?`. Backfill if not.
- `lib/citation/serialize.ts` (new) — canonical `CitationBlock` shape used by API, MCP, and AIF attestation:
  ```ts
  type CitationBlock = {
    id: string;
    title: string;
    url?: string;
    doi?: string;
    publisher?: string;
    accessedAt?: string;
    quote?: string;
    quoteAnchor?: { selector: string; type: 'css' | 'text-quote' };
  };
  ```
- API + MCP responses: each premise's `evidence` field is `CitationBlock[]`, never inline prose.
- `components/argument/CitationChip.tsx` (new) — small reusable chip; click opens the source in a new tab with the quote anchor scrolled into view (`#:~:text=...` where supported).
- AIF attestation envelope (`app/api/a/[shortCode]/aif/route.ts`) — already produces structured citations per Pt. 2; verify alignment with the new `CitationBlock` shape so there's a single canonical type.

**Verifier:** `scripts/verify-citations.ts` — sample 30 arguments, assert every cited evidence has at least one of `url|doi`, and that `quoteAnchor` (when present) resolves against the live page (best-effort, allow 404 with warning).

---

## Sprint shape

Reasonable single-sprint cut, in order:

1. **#1 Fitness breakdown** — pure serialization refactor, 1–2 days.
2. **#2 Critical Questions** — schema + compute + UI panel; the biggest single uplift. 3–4 days.
3. **#3 Standing depth** — schema-light, mostly a SELECT + label change. 1–2 days.
4. **#7 Structured citations** — finish here so #5's AI drafts emit proper citation blocks from day one. 1–2 days.
5. **#5 AI-authored args** — gated behind #3 and #7 landing first. 3–4 days.

Defer **#4 (topology)** and **#6 (scheme query)** to a follow-up if the sprint runs long; both are additive and don't block the others.

## Cross-cutting checks

- Update `/.well-known/argument-graph` (Pt. 2 §B.1) to advertise the new fields under `formats` / `endpoints`.
- Update OpenAPI spec (Pt. 2 §B.3) — add `FitnessBreakdown`, `StandingDepth`, `CitationBlock`, `CriticalQuestion`, `AuthorKind` to `components.schemas`.
- Update MCP tool descriptions in lockstep — the stress test only worked because tool descriptions told the model what was available. Same discipline applies to every new field.
- Re-run `MCP_STRESS_TEST_4` after the sprint as a regression check: the model should now be able to (a) cite fitness components, (b) name unanswered CQs, (c) qualify standing with depth, (d) flag AI-authored content. If any of those still require inference, the surface isn't done.

---

## What the protocol is supposed to prevent (post-sprint reflection)

Re-running the stress test against the incognito-LLM-with-web-search baseline produced a synthesis whose closing move was:

> "The truth is probably somewhere between 'smartphones are destroying a generation' and 'there's nothing to see here' — closer to 'these are modestly harmful on average, significantly harmful for some vulnerable populations, and the design of platforms matters enormously.'"

This reads as nuance. Structurally it is the failure mode the deliberation protocol exists to prevent. The pattern:

1. Reduce the live debate to two caricatured poles ("alarmist" / "skeptic"), neither of which any specific scholar would sign their name to.
2. Place the synthesizer rhetorically *between* the manufactured poles.
3. Call the resulting position "the nuanced one" and treat geometry-between-strawmen as epistemic work.

It is unearned balance. The endpoints were chosen by the synthesizer; the centrism is therefore an artifact of framing, not a finding.

**Why ASPIC+ undercutters and undermines exist.** You cannot dispute a conclusion in this protocol by gesturing at "framing." You attack a specific premise (undermine) or a specific inference / warrant (undercut). Several moves the centrist synthesis bundles as prose are, under the protocol, separable nodes that have to stand on their own and answer their own critical questions:

- The seatbelt analogy (population-average variance hides subpopulation harm) — an undercut on the inference from `0.4% variance` to `policy-irrelevant`. As prose it slides past as an aside; as a node it has to answer the analogy's own CQs (does the analogy hold? what's the disanalogy? what's the subpopulation evidence?).
- "Teens are voting with their feet" (37% intentional breaks, 22% deleting apps) — a sign-scheme argument with explicit CQs (representativeness, selection effect, what the behavior actually signals).
- "The alarmed camp has gotten stronger over time" — a meta-claim about trajectory of evidence; under the protocol it's a sign or expert-opinion argument with CQs about *which* studies, *what's the trend in effect sizes specifically*, and *whether the new studies are methodologically stronger or merely more numerous*. Most of those CQs would be unanswered.

**The protocol's structural disagreement with "both sides + middle."** Heterogeneous participants do not in fact arrive sorted into two camps. A philosopher of science, a developmental psychologist, an equity-focused educator, and a parent each enter the deliberation with a different scheme repertoire and a different specific premise / inference / warrant they want to undercut or support. The two-camp framing is an artifact of media coverage, not of the epistemic landscape. Atomizing dialectical moves into typed objects is the platform's structural disagreement with that framing — and it is *load-bearing*, not decorative.

**Implication for the synthesis layer.** The natural temptation, after this stress test, is to add an MCP primitive that produces an editorial reading of a debate comparable to what the incognito instance produced. That is the wrong target. The right synthesis primitive is *anti-centrist*: it surfaces

- which inferences in the graph have unanswered undercuts;
- which premises have unanswered undermines;
- where the strongest unrebutted attack chains terminate;
- which schemes have unanswered critical questions;
- where the same author's arguments have been challenged by the most distinct authors (depth signal — now exposed via #3);

…and *refuses* to deliver a "the truth is probably somewhere between" closer. The refusal is the product. The platform's distinctive offering is not a more balanced synthesis; it is a synthesis the protocol prevents from smuggling in an unearned resolution.

**What item #2 actually does, restated.** Once unanswered CQs are first-class structured data, prose like "the alarmed camp has gotten stronger over time" cannot survive contact with the graph. It has to be filed under a sign or expert-opinion scheme, with explicit CQs, most of which are unanswered. Prose hides this. The graph surfaces it. That is the discipline #2 enforces, and it is doing more work than its line-item description suggests.

**Reframe of the "missing emerging-middle-ground node" reading.** An earlier reading suggested the graph was missing a "the question is mis-specified" node and that this was a topology gap (a partial argument for un-deferring #4). On reflection that reading was wrong. The middle ground is not missing from the graph — it is *correctly absent*. Under the protocol it dissolves into a set of specific moves (each an undercut, an undermine, or a sign-scheme argument) that have to be made explicit and answered. The fact that no single "middle ground" node exists is the protocol working as designed, not a topology defect.

---

## The remaining problem (after the sprint): translating depth into a legible surface

Everything above leaves one problem unresolved, and it is the harder one. The deliberation engine has substantial scaffolding — schemes, undercuts/undermines, CA-edges, critical questions, standing states, fitness components, depth annotations, structured citations, attestation chains — and the scaffolding is now exposed end-to-end through the MCP/API surface. But:

> The deep findings of an actually-conducted deliberation are difficult to simulate, and they are difficult to translate into a surface that an LLM (or a non-expert human) can efficiently read and interpret.

This is the core unsolved problem and it has two faces.

**The seeding/cold-start face.** The protocol's distinctive value (standing, fitness, depth, unanswered CQs) is conditional on a real deliberation having happened. With one or two participants on a topic, the metadata is structurally well-formed but evidentially thin — `tested-survived (1 challenger, 0 reviewers, thin)` is honest, but it is also not yet doing the work the architecture promises. Item #5 (AI authoring) addresses articulation density without compromising standing, but articulation is not the same as deliberation. AI drafts that no one ever attacks, supports, or answers a CQ on are the "sophisticated corpse" failure mode: a dense, polished deliberation base that has never been tested, presented through a surface that *looks like* a tested deliberation. The standing labels protect against overclaiming; they do not protect against the surface reading as livelier than the underlying activity.

**The translation face.** Even when a real deliberation has occurred, the LLM-readable surface is currently a flat projection of fields. `standingDepth.confidence: "thin"`, `criticalQuestions.unanswered: [...]`, `fitnessBreakdown.components.attackCAs: -1.4` — each of these is checkable and that is the point of the sprint. But a sophisticated reader has to do the integration work themselves: which unanswered CQ matters most? Which undercut is most load-bearing? Where is the deliberation's center of gravity? The depth is in the graph; the surface delivers it as components. The translation from "components a careful reader can integrate" to "a structured editorial that preserves the protocol's anti-centrist discipline while remaining efficiently legible" is the work that has not been done.

These two faces interact: you cannot translate findings that were never produced, and you cannot motivate participation if the surface cannot communicate why participating produces something a fluent LLM-with-web-search baseline does not. The seven sprint items strengthen the substrate. The remaining work is the surface that makes the substrate's findings legible *as findings*, not just as queryable fields.

**Concrete candidates for Pt. 4.** Not a commitment, just the shape of what the next pass would have to address:

- A `summarize_debate(deliberationId)` MCP primitive that returns a typed editorial: open undercuts ranked by load-bearingness, unanswered CQs grouped by scheme, terminal unrebutted leaves, depth-qualified standing, and an *explicit* refusal-to-resolve when the graph's open edges are not closed. The output shape should make centrist-synthesis prose impossible to construct without lying about the fields.
- AI-authoring as *materials* rather than finished arguments: claim cards + evidence cards + scheme-classified candidate premises that humans assemble into arguments. Reviewer-as-author is more engaging than reviewer-as-auditor, and it sidesteps the warrant-reconstruction circularity flagged in the extraction-pipeline critique.
- Engagement-rate telemetry on AI-seeded arguments (attacks, supports, CQ answers per AI draft over time). When engagement is below threshold, the surface should mark the region as articulation-only-not-deliberation, so consumers (LLM or human) discount accordingly.
- A "missing-move detector": for any conclusion node, surface which undercut / undermine / CQ types are *typical for the scheme but absent in the graph*. This makes the protocol's anti-strawman discipline operational — instead of a centrist instance gesturing at "framing," the graph shows that, e.g., the causal-side argument has no recorded undercut on the variance-to-irrelevance inference, which is the move the centrist synthesis was implicitly making.
