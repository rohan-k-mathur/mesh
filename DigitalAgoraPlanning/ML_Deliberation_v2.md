Absolutely—here’s a consolidated AI/ML Roadmap v2 that folds in ludics, eristics, operationalized inferential semantics, and textual entailment (TE/NLI) on top of the plan you already have. I’ve kept the same backbone (principles → transforms → data → staged sprints → eval/guardrails → ready‑to‑cut PRs) and highlighted what’s new or changed.

0) Executive summary — what changes vs. v1
* Dialogical validity as a first‑class signal. We model “who’s forced to reply?” and “is the attack legally answered?” via a lightweight ludics layer: loci (addresses), polarity blocks, and a normalization check over recent moves.
* CQ satisfaction becomes a proof‑obligation. A CQ can only be marked “met” if there’s a matching attached counter‑move (rebut/undercut) and/or TE/NLI confirms the intended relation (contradiction/undercut).
* Sequent lens for views. Treat each representative view as a two‑sided sequent Γ ⊢ Δ and estimate entailment with NLI aggregation; surface missing premises/weak steps.
* Eristic route detection & coaching. Detect and visualize eristic stratagems (loaded question, scope‑shift/equivocation, etc.) and suggest “honest routes” (targeted CQs or define‑terms prompts).
* Operationalized inferential semantics. We track micro attack/defense rules for → ∧ ∨ ∀ ∃ (as cues), drive legal‑move suggestions, and use TE/NLI to validate support/attack edges.

1) Principles & system map (updated)
New principles
* Dialogical primacy: A claim’s status is tied to the existence of a winning response pattern (all open legal attacks answered), not just static counts.
* Proof‑guarded UX: Certain actions (mark CQ “satisfied”, “supports/rebuts” labels) require attached moves + TE/NLI confirmation above a threshold.
* Eristic‑aware nudging: We don’t punish; we surface stratagem routes and offer quick, constructive alternatives (CQs, define scope, add warrant).
System map deltas
* Add a TE/NLI adjudicator in Analytics layer.
* Add Ludics adapter in Reasoning to compute open/answered legal attacks and normalization outcomes.
* Add Eristic detector parallel to Rhetoric detectors.

2) Core transforms (“bridges”) — with new/changed ones
T0. TE/NLI adjudicator (new)
* In: pairs/triples of texts: (premise, hypothesis) or (attacker, target, relationHint).
* Out: { relation: 'entails'|'contradicts'|'neutral', score }.
* Use: validate supports/rebuts; gate CQ satisfaction; rate sequent entailment Γ⇒Δ; rank “best counter”.
T1. NL → Atoms (formalize) (extended)
* Add detection of logical shapes (if/then, and/or, quantifiers) and presuppositions; emit legalAttacks suggestions for the reply UI.
* Emit eristicHints (e.g., loaded_question, equivocation_scope) as soft marks.
T1b. Edge typing w/ TE (new micro‑transform)
* When the user proposes a support/rebut edge, call TE/NLI to annotate edge.confidence + why (matched spans).
T2. Atoms → NL (explain) (extended)
* Include dialogical trace: which legal attacks remain, what was answered (with links).
* For views, narrate Γ ⊢ Δ status and suggest “missing premise” where TE is weak.
T3. Atoms → Analytics (compute) (extended)
* Dialogical scoreboard: open vs. answered legal attacks; normalization result on last N moves.
* DE‑meter: discourse‑ethics score (reasons rate, answered CQs, reciprocity, clarity).
* Eristic marks statistics (counts by tactic).
T4. NL → Graph Ops (control) (extended)
* Add legal‑move recommender: “Challenge the antecedent”, “Ask for consequent”, “Pick disjunct”, etc., derived from shape cues.
T5. Retrieval/Evidence (unchanged but connected)
* When a CQ requires evidence, the retrieval transform proposes citations; successful attach updates CQ status and dialogical scoreboard.

3) Data & service plumbing (minimal, additive)
3.1 New/extended tables (Prisma‑style sketch)
model NLILink {
  id        String   @id @default(cuid())
  fromId    String   // claimId or argumentId
  toId      String   // claimId or argumentId
  relation  String   // 'entails'|'contradicts'|'neutral'
  score     Float
  createdAt DateTime @default(now())

  @@index([fromId, toId])
}

model EristicMark {
  id             String   @id @default(cuid())
  deliberationId String
  targetType     String   // 'argument'|'claim'|'move'
  targetId       String
  tactic         String   // 'loaded_question'|'equivocation'|...
  detector       String   // 'rule'|'ml'|'mod'
  strength       Float    @default(0)
  createdById    String?
  createdAt      DateTime @default(now())

  @@index([deliberationId, targetType, targetId])
}

model DialogueLocus {
  id             String   @id @default(cuid())
  deliberationId String
  address        String   // e.g., '0/1/2'
  parentLocusId  String?
  openedByMoveId String
  createdAt      DateTime @default(now())

  @@index([deliberationId, address])
}

model DialogueChronicle {
  id             String   @id @default(cuid())
  deliberationId String
  locusId        String
  order          Int
  moveId         String
  polarity       String   // 'P'|'O'
  note           String?
  createdAt      DateTime @default(now())

  @@index([deliberationId, locusId, order])
}

model DialogueNormScore {
  id             String   @id @default(cuid())
  deliberationId String
  windowStart    DateTime
  windowEnd      DateTime
  deScore        Float
  details        Json
  computedAt     DateTime @default(now())

  @@index([deliberationId, computedAt])
}
Extend your existing DialogueMove with:
// add fields (null-safe for backward compat)
polarity        String?  // 'P'|'O'
locusId         String?
endsWithDaimon  Boolean  @default(false)
(No breaking changes to Arguments/Claims/Edges/Works.)
3.2 Services/APIs
* POST /api/nli/batch → TE adjudicator.
* POST /api/cqs/toggle (server guard): refuse satisfied:true unless (a) matching ClaimEdge exists and/or (b) NLILink shows contradiction/undercut above τ.
* GET /api/dialogue/chronicle → last N moves with loci/polarity.
* POST /api/dialogue/normalize → normalize last K moves; return converged/fork info.
* POST /api/eristic/scan → run detectors, write EristicMark.

4) Staged roadmap (8 sprints)
Sprint A1 — TE/NLI foundation
* Add /api/nli/batch + NLILink cache.
* Wire edge creation to log an NLILink (supports/rebuts confidence).
* Deliverable: TE labels appear in dev logs and can be shown on hover tooltips (“contradiction .86”).
Sprint A2 — CQ proof‑guard
* Server‑side guard in /api/cqs/toggle: block satisfied:true unless attached attacker edge and NLILink matches expected relation (rebut: contradiction; undercut: target’s warrant weakened).
* UI: show why a box unlocks/locks (edge present? TE score?).
Sprint A3 — Legal‑move recommender
* Detector of logical shapes (→ ∧ ∨ ∀ ∃, presupposition).
* UI: buttons in reply/WHY composer: “Challenge antecedent”, “Pick disjunct”, “Instantiate ∀”, “Ask to define presupposition”.
* Deliverable: dialogical replies feel “rule‑driven”, not free‑form only.
Sprint A4 — Ludics loci & normalization
* Data: DialogueLocus, DialogueChronicle; extend DialogueMove with polarity.
* Engine: normalizeLastK() returns {converged, forkPath, suggestion}.
* UI: “Interaction Trace” rail in Dialogical panel with P/O blocks and the fork locus.
Sprint A5 — Eristic overlay
* Rules: loaded_question, equivocation/scope‑shift, quibble → mark EristicMark.
* UI toggle: color eristic routes and show an honest route suggestion (mapped to CQ templates / define terms).
Sprint A6 — Sequent lens for views
* Compute Γ ⊢ Δ per representative view; call TE/NLI to estimate entailment strength.
* UI: “Entailment: strong/weak/incoherent” badge; click shows missing steps (suggest CQs/bridges).
Sprint A7 — Discourse‑Ethics meter
* Compute rolling DE‑score; show gauge (reasons given, answered CQs, reciprocity, clarity).
* Nudges: when starting a new assertion while open CQs exist, prompt: “Answer CQ X first?”
Sprint A8 — Optional LF assist & AIF bridge
* Optional LF parsing (for conditionals/quantifiers) behind a feature flag to sharpen TE on hard cases.
* AIF export stub for interoperability (arguments/attacks/schemes).

5) Evaluation, datasets, and metrics
* Unit fixtures: 30–50 micro‑items (if/then; and/or; every/some; presuppositions). Goal: legal‑move suggestions match ground truth; NLI relation aligns ≥75%.
* Datasets: small curated set per room (opt‑in), plus public NLI sets for regression sanity (MNLI subset; FraCaS‑style).
* Product metrics:
    * CQ false‑unlock rate < 5%,
    * % replies using legal‑move buttons,
    * View Entailment badge correlation with moderator judgments,
    * DE‑score improves after nudges (A/B).

6) Guardrails & risks
* NLI brittleness: keep thresholds conservative, always allow human override with reason (audit in AiTransformEvent). Show TE score when gating.
* Latency: batch NLI calls; cache NLILink; pre‑fetch pairs from hot threads/views.
* UX complexity: progressive disclosure (beginner sees simple prompts; power users toggle Dialogical/Eristic overlays).
* Fairness: eristic detection is assistive, not punitive; phrasing: “Possible tactic detected (equivocation). Would you like to clarify the term ‘X’?”

7) “Ready‑to‑cut” PRs (next 1–2 weeks)
PR‑1: TE/NLI API + cache
* Add NLILink model.
* POST /api/nli/batch (adapter skeleton, we can swap models later).
* On ClaimEdge create, call NLI and store NLILink.
PR‑2: CQ hard guard
* Patch /api/cqs/toggle to require (edge present) ∧ (NLILink matches) for satisfied:true.
* UI: in the modal, show why a box is disabled/enabled (edge? NLI?).
PR‑3: Legal‑move suggester
* legalAttacksFor(text) util; expose buttons in DialogueMoves and the reply composer.
* Add simple presupposition & quantifier patterns.
PR‑4: Loci/chronicle (foundations)
* Migrations: DialogueLocus, DialogueChronicle; extend DialogueMove.
* Minimal UI: Interaction Trace rail listing last N moves grouped by polarity.
(We can line these up exactly in your repo structure; I kept it tool‑agnostic here to stay concise.)

8) Where this plugs into your current surfaces
* RepresentativeViewpoints
    * Adds “Entailment badge” per view; “missing steps” link generates CQ prompts.
    * CQ modal already proof‑guarded (client). Server guard closes the loop.
* ArgumentsList (monological lens)
    * Use MethodChip + MiniStructureBox to trigger legal‑move buttons and presupposition clarifications.
    * When a rebuttal is added, show TE/NLI tooltip (“contradiction .82”).
* Dialogical panel
    * Interaction Trace (loci, P/O blocks), Normalize button.
    * Eristic overlay toggle with “honest route” suggestions.
* CQ system
    * Satisfaction requires attached attack + TE threshold (unless moderator overrides).
    * “Attach rebut/undercut” buttons select from legal options derived from shape.

Quick notes (opinions)
* Keep TE/NLI assistive—we adjudicate, we don’t auto‑write. Humans accept/override with a reason (stored).
* Ludics gives you a principled, lightweight game engine; you don’t need full proof search—just enough to gate CQs, suggest moves, and show “open legal attacks.”
* Eristics should feel like a coach, not a cop: “Looks like a loaded question—split it into two claims?” with one‑click templates.
If you want, I can paste the exact Prisma migration blocks for the four new tables and a minimal /api/nli/batch contract (Zod types + stub handler) so you can start PR‑1 immediately.



v1: 

This is exactly the right direction. Below is a practical, end‑to‑end roadmap for weaving ML/AI into your deliberation engine so users (and internal jobs) can move both ways between informal language ↔ formal atoms (claims/edges/CQs/works) ↔ computed analytics (Dung AF, coverage, integrity) ↔ narrative views (briefs, syntheses, “why this”). It’s organized as:
1. Principles & system map
2. Core transforms (bi‑directional “bridges”)
3. Data & service plumbing you’ll need
4. A staged roadmap (6–8 sprints with PR‑sized work)
5. Evaluation, safety, and guardrails
6. “Ready-to-cut” first three PRs

1) Principles & system map
Goals
* Bidirectionality: NL → Atoms (extraction) and Atoms/Graphs → NL (explanation, scaffolding, learning).
* Provenance-first: everything emits who/what/why; attach URNs, source doc spans, model+prompt hashes.
* Human-in-the-loop: model suggestions are drafts until accepted; show diffs and “reason-why” traces.
* Composable: every transform is a small, observable job; chain them (fan-in/out) via queues.
* Minimize migrations: reuse your schema; where needed, add slim “aux tables” for AI outputs/caches.
System map (conceptual)
* Ingress (NL): user writes free text → extractAtoms → {claims, warrants, evidence, edges, scheme hits, CQ triggers}.
* Graph core: atoms land in Argument, Claim, ClaimEdge, ClaimCitation, EvidenceLink, ArgumentEdge, DialogueMove, KnowledgeEdge, …
* Analytics: jobs compute Dung AF, coverage, JR, cluster views, integrity, supply overlays, claim stats/labels.
* Egress (NL): renderNarrative synthesizes briefs, viewpoint explainers, conflict explainers, bridge prompts, synthesis cards.
* Round‑trip: NL → atoms (formalization), edits → recompute analytics → narrative back to humans → accept/reject → persist → learn.

2) Core transforms (the “bridges”)
Each transform is a stateless function with structured I/O, run as a queue job, persisted as events.
T1. NL → Atoms (formalize)
Input: free text (argument, work paragraph, comment), optional context (deliberationId, host article, selected text offsets). Output: JSON atoms:
* Claims (text, quantifier/modality hints, optional promote to claim),
* Argument roles (grounds, warrant, backing, qualifier, rebuttal),
* Edges (support/rebut/undercut + target scope),
* Scheme instances (e.g., expert_opinion with filled slots),
* CQ triggers (unmet CQs by scheme),
* Citations candidates (URLs/spans for ClaimCitation/EvidenceLink),
* Values (candidate Value weights).
Implementation: LLM function‑calling with strict JSON schema (Zod) + light post‑rules. Show a “proposed changes” diff for acceptance.
T2. Atoms → NL (explain)
Input: nodes/edges/analytics slice (e.g., a view, or a claim with its incoming edges). Output: one or more:
* Explainability text: “Why is View 2 representative?” “Why is Claim C labeled IN?”
* Conflict explainer: short paragraphs referencing specific claims/arguments and counts.
* Bridge prompt: targeted ask (“what evidence would connect Cluster A→B?”).
Implementation: templated prompts + RAG over your own DB text (work bodies, claims, arguments, brief versions). Always include grounding quotes + links.
T3. Atoms → Analytics (compute)
* Dung AF (grounded/preferred/stable) from ArgumentEdge/ClaimEdge.
* Coverage & JR metrics from approvals/selection.
* Integrity for Works; Supply overlays via KnowledgeEdge.
* Cluster metrics (SCCs/topo; topic/affinity).
* ClaimStats & labels.
Implementation: deterministic TypeScript jobs (you already have most). Emit “explain” payloads that T2 can narrate.
T4. NL → Graph Query / Ops (control)
* Interpret user asks like “show me the best counter to X” → Graph query (edges to X with type=rebuts, rank by strength).
* “Promote selection → claim”, “Attach undercut from this evidence”, “Address CQ #2”.
Implementation: LLM → a small DSL or JSON “intent” with parameters, compiled to Prisma calls. Always present a confirmation.
T5. Retrieval / Evidence
* Given a claim, propose relevant sources (internal first; optionally external).
* Turn an unmet CQ + attacker claim into a retrieval ask; propose citations.
Implementation: embedding search over internal corpus (Works, Arguments, BriefVersions, linked PDFs) + optional web search connector. Emit ClaimCitation/EvidenceLink drafts.

3) Data & service plumbing
Keep existing schema; add slim tables for AI job outputs & caches:
model AiTransformEvent {
  id          String   @id @default(cuid())
  deliberationId String?
  targetType  String   // 'argument'|'claim'|'work'|'view'|'selection'
  targetId    String?
  transform   String   // 'extractAtoms'|'renderNarrative'|'computeDung'|...
  inputHash   String
  input       Json
  output      Json
  status      String   @default("ok") // 'ok'|'rejected'|'error'
  modelInfo   Json?    // {provider, model, promptHash}
  createdById String?  // user or 'system'
  createdAt   DateTime @default(now())
}

model AiNarrativeCache {
  id          String   @id @default(cuid())
  key         String   @unique // e.g., `${delibId}:view:${viewIndex}:why`
  text        String   @db.Text
  meta        Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
Jobs & orchestration
* Use your existing BullMQ + Redis for ai.extractAtoms, ai.renderNarrative, analytics.recompute, retrieval.findEvidence.
* SSE endpoints you already use → stream job progress to the UI.
Function calling contracts (Zod types) Define once, reuse across job workers and UI guards:
* ExtractAtomsRequest/Response
* ExplainSelectionRequest/Response
* ResolveIntentRequest/Response (for NL→ops)
* FindEvidenceRequest/Response
Observability Emit structured logs from each job; write AiTransformEvent rows with hashes so we can dedupe/regenerate when inputs change.

4) Staged roadmap (PR‑sized, 6–8 sprints)
Sprint 1 — Semantic I/O foundation (NL → atoms)
* Feature: “Make this formal” in composer and Work detail.
* Worker: ai.extractAtoms (function‑calling → atoms) with propose‑changes diff:
    * Creates draft Claim, ClaimEdge, ArgumentEdge, ClaimCitation, EvidenceLink, SchemeInstance, CQStatus.
    * UI shows Review & Accept; on accept → upsert; on reject → log AiTransformEvent(status='rejected').
* UI: “Extraction Drawer” with tabs: Atoms, Edges, CQs, Citations, Values.
* Acceptance: Creating a Work paragraph and clicking Formalize yields valid drafts; accepting persists; edges appear in the graph.
Sprint 2 — Narrative surfaces (Atoms/Analytics → NL)
* Feature: “Explain this view” and “Explain label IN/UNDEC” buttons.
* Worker: ai.renderNarrative with templates:
    * View Why: uses ViewpointSelection, approvals, conflictsTopPairs, sample quotes.
    * Claim Label Why: walk Dung defense and inbound edges, present defend/attack chain in 3–5 sentences.
* Cache: AiNarrativeCache keyed by (delibId, view index, params).
* Acceptance: Toggling between views regenerates a short explanation in <1s (cache hit).
Sprint 3 — CQ assistant loop
* Feature: In “Address CQs” modal, add “Suggest counter‑claim” and “Suggest evidence” inline.
* Workers:
    * ai.suggestCounterClaim (given unmet CQ + target claim) → draft counter claim + suggested edge (undercut/rebut scope).
    * ai.findEvidence (internal first) → draft ClaimCitation/EvidenceLink.
* Acceptance: One‑click attach creates an attacker claim + edge (or adds citation) and updates CQ counts; UI shows success with linger state (you already patched the linger UX).
Sprint 4 — NL → Graph Ops (intent compilation)
* Feature: Natural commands box (“add a rebuttal to Claim X that …”, “cluster the last 10 arguments by topic”).
* Worker: ai.resolveIntent → JSON plan (entity ids + operations) → confirmation modal → executes via APIs.
* Acceptance: 10–15 canonical intents supported and unit‑tested; wrong/unsafe plans blocked with descriptive errors.
Sprint 5 — Viewpoint & cluster intelligence
* Feature: “Recompute representatives with fairness constraint λ” and “Suggest bridges between clusters A and B”.
* Workers:
    * analytics.reselect (you have rules utilitarian/harmonic/maxcov). Add optional embedding‑based diversity regularizer.
    * ai.suggestBridge uses retrieval across A↔B to propose a bridge card outline (claim + reasons + sources).
* Acceptance: Bridge button drafts a DeliberationCard; selection explainers mention fairness/diversity terms used.
Sprint 6 — Evidence & provenance
* Feature: Evidence inspector that ranks citations by support strength and provenance.
* Workers: retrieval.scoreEvidence → features (source type, recency, agreement with claim text) → score.
* Acceptance: Clicking “Why this citation?” shows a short rationale + extracted quote.
Sprint 7 — Learning & evaluation loop
* Feature: Disagreement queue (where users corrected AI drafts).
* Infra: Log “gold” corrections; build test sets for extraction, edge typing, scope prediction, CQ suggestion.
* Metrics: precision@accept for each transform, explanation helpfulness (thumbs), time‑to‑accept, coverage of CQs.
* Acceptance: Dashboard with per‑transform precision ≥ target (e.g., 0.75 for extraction).
Sprint 8 — Brief & synthesis automation
* Feature: “Generate brief v2” from selected claims/works; propose deltas vs v1 with citations.
* Worker: ai.renderBrief composes sections + CSL JSON; writes BriefVersion draft and a change log.
* Acceptance: Editors accept/annotate; brief pipeline shows safe, grounded summaries with proper links.

5) Evaluation, safety, and guardrails
* Strict schemas + validators (Zod) for function outputs; on parse error → show raw JSON for debugging but do not commit.
* No silent writes: all NL→ops must go through a confirmation UI unless the user is explicitly in “fast‑apply” mode.
* Content policy: disallow external retrieval in private rooms unless owners toggle it. Always label AI content.
* Attribution & reproducibility: store modelInfo with prompt hash and seed; keep input/output in AiTransformEvent.
* Telemetry & tests:
    * Unit tests for transforms with curated fixtures (arguments with known Toulmin roles, edges with known scopes).
    * Playwright flows: formalize paragraph → accept → see chip in ArgumentsList; Address CQ → counter attaches, linger shows.

6) “Ready‑to‑cut” PRs (concrete next steps)
PR‑1: Function contracts + worker skeletons
* packages/shared/ai/contracts.ts
    * ExtractAtomsRequest/Response, ExplainSelectionRequest/Response, ResolveIntentRequest/Response, FindEvidenceRequest/Response (Zod).
* apps/api/queues/ai.extractAtoms.ts (BullMQ consumer)
* apps/api/routes/ai/extract (POST) → enqueues job; SSE progress.
* Acceptance: POST with a paragraph returns well‑typed atoms; event row in AiTransformEvent.
PR‑2: Extraction Drawer UI
* Button in DeliberationComposer & WorkDetailClient → opens Drawer.
* Panels for Atoms, Edges, CQs, Citations; accept all / accept individually.
* Acceptance: Accept creates rows in Prisma and shows success toast; rejected drafts are tracked.
PR‑3: Narrative “Why this view?”
* Route GET /api/selection/:id/explain → assembles context (rules, coverage, conflictsTopPairs, exemplar quotes) → ai.renderNarrative.
* UI hook in RepresentativeViewpoints next to WhyThis: swap static with AI narrative (cached in AiNarrativeCache).
* Acceptance: Content matches the view’s data (check templated variables + links present).

Model & feature notes (opinions)
* Function‑calling LLMs are perfect for T1/T4; force JSON via schema + partial credit extraction (don’t fail whole job for one atom).
* Retrieval strategy: default to internal corpora first (works, claims, arguments, brief versions). You’ll get higher precision and better provenance than web.
* Edge typing and scope: combine heuristic rules (keywords, discourse markers) with LLM suggestions; human approval closes the loop.
* Explanations: don’t rely on freeform “LLM magic.” Feed explicit traces (which edges defended what in Dung) into the prompt so text is faithful.
* Caching: narrative outputs change only when inputs change — key caches by hashes of the selected nodes/metrics.
* UX: always render what will be written (diff block) before it’s written. This keeps trust high.

What I’ll need (when you want me to wire PR‑1/2/3)
* Confirm where you want the queues to live (you already have BullMQ + Redis).
* Thumbs‑up on the two mini tables (AiTransformEvent, AiNarrativeCache) or pointers to an equivalent you prefer.
* The Article/Work text sources for extraction inputs (already in article.astJson and TheoryWork.body, good).
* Any style constraints for narratives (tone, length).
If you drop in those details, I’ll slice the exact file paths, Zod contracts, and job/route scaffolds matching your house style.

