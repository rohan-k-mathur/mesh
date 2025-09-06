Below is a consolidated, hardened roadmap that merges everything we planned so far with the new pillars (ludics, eristics, operationalized inferential semantics, textual‑entailment). It’s written to be directly actionable in your stack (Next.js/Prisma/TypeScript), with crisp acceptance criteria, schema/API stubs, and risks.

0) What to strengthen from the planning phase (quick audit)
Keep (already good):
* Bidirectional transforms (NL → atoms; atoms/analytics → NL).
* Provenance-first events (AiTransformEvent) and narrative cache.
* CQ assistant loop; “attach rebut/undercut” UX.
* Viewpoint selection & conflicts; monological lenses (MethodChip, MiniStructureBox).
* Early “dialogical” surface (DialogueMoves, AF overlays).
Harden / extend:
1. Proof‑guarded CQ satisfaction Gate “satisfied: true” on attached counter‑move and a TE/NLI relation consistent with the expected attack (rebut/undercut). Surface why a box unlocks/locks.
2. TE/NLI adjudicator as a first‑class service Centralize entailment/contradiction checks for: edge validation, view Γ ⊢ Δ status, “best counter” ranking, evidence scoring.
3. Dialogical validity signals (ludics‑lite) Track polarity blocks (P/O), loci (addresses), and a normalization check that tells us whether all legal attacks are currently answered. Show “open legal attacks”.
4. Eristic route overlay + DE‑meter Detect common stratagems (loaded question, scope shift/equivocation, quibble) and nudge toward “honest routes”. Compute a rolling discourse‑ethics score (reasons, answered CQs, reciprocity, clarity).
5. Sequent lens for views Treat each representative view as Γ ⊢ Δ; estimate entailment strength with NLI and show missing premise prompts.
6. Operationalized inferential semantics Add a legal‑move recommender (→, ∧, ∨, ∀, ∃, presuppositions) to the reply composer and WHY dialogs. This makes the dialogical lens feel like a game with rules, not just a log.

1) Principles (updated) & System Map
New principles
* Dialogical primacy: status depends on open legal attacks vs defended attacks.
* Proof‑guarded UX: sensitive actions (CQ satisfied, edge type) require attached move + TE/NLI evidence.
* Eristic‑aware coaching: flag tactics and provide constructive alternatives (CQ, define terms, split claims).
System map deltas
* Add NLI adjudicator in analytics core.
* Add Ludics adapter to compute open/answered legal attacks over recent DialogueMoves.
* Add Eristic detector alongside rhetoric detectors.

2) Core transforms (bridges) — finalized
* T0. TE/NLI adjudicator (new) Input: pairs (premise, hypothesis) or (attacker, target, relationHint). Output: { relation: 'entails'|'contradicts'|'neutral', score }. Uses: edge validation, CQ gating, Γ ⊢ Δ badge, “best counter” rank.
* T1. NL → Atoms (extend) Emit: claims, roles, edges, scheme instances, CQ triggers, logical shape cues (→ ∧ ∨ ∀ ∃), presupposition flags, eristic hints.
* T1b. Edge typing + TE confidence (new micro‑transform) On propose support/rebut: call T0; store NLILink with confidence.
* T2. Atoms → NL (extend) For views/claims, explain dialogical trace (open vs answered legal attacks), Γ ⊢ Δ strength, missing steps.
* T3. Atoms → Analytics (extend) Dialogical scoreboard, DE‑meter (reasons, answered CQs, reciprocity, clarity), EristicMark counts.
* T4. NL → Graph Ops (extend) Compile intents + legal‑move suggestions into precise operations (challenge antecedent, pick disjunct, instantiate ∀, define presupposition).
* T5. Retrieval/Evidence (unchanged; tighter loop) When a CQ needs evidence, propose citations; on attach, update CQ + TE status and dialogical scoreboard.

3) Minimal data model additions (Prisma)
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
  tactic         String   // 'loaded_question'|'equivocation'|'quibble'|...
  detector       String   // 'rule'|'ml'|'mod'
  strength       Float    @default(0)
  createdById    String?
  createdAt      DateTime @default(now())
  @@index([deliberationId, targetType, targetId])
}

model DialogueLocus {
  id             String   @id @default(cuid())
  deliberationId String
  address        String   // '0/1/2'
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

// Extend existing:
model DialogueMove {
  // ...existing fields...
  polarity       String?   // 'P'|'O'
  locusId        String?
  endsWithDaimon Boolean    @default(false)
}
Compatibility: all new fields are optional; no breaking changes to Arguments/Claims/Edges.

4) API contracts (thin, typed)
/api/nli/batch (POST) Body:
type NLIPair = { premise: string; hypothesis: string; hint?: 'supports'|'rebuts'|'undercuts' };
type NLIRequest = { pairs: NLIPair[] };
type NLIResult = { relation: 'entails'|'contradicts'|'neutral'; score: number };
type NLIResponse = { results: NLIResult[] };
/api/cqs/toggle (POST) – server guard Add checks for satisfied:true:
* If CQ expects rebut: require a ClaimEdge(type='rebuts') or NLILink.relation='contradicts' with score≥τ_rebut.
* If undercut: require an attached undercut edge or (conclusion neutral/weak) && (warrant contradicted) above thresholds. Return structured reason if blocked.
/api/dialogue/chronicle (GET) ?deliberationId=...&k=... → last K moves with polarity, locus.address, block groupings.
/api/dialogue/normalize (POST) { deliberationId, window?: number } → { converged: boolean, openAttacks: AttackSpec[], forkPath?: string[] }.
/api/eristic/scan (POST) { deliberationId, window?: number } → writes EristicMark[], returns counts.

5) Algorithms, thresholds, and explainability
* NLI thresholds (configurable): τ_rebut = 0.75 (contradicts), τ_support = 0.75 (entails), τ_neutral = 0.55 boundary. Always return score + textual rationale (short span matches where available); store NLILink.
* Γ ⊢ Δ aggregation: For each δ∈Δ, compute max_{g∈Γ} score(entails(g, δ)). View status: strong (all δ ≥ τ_support), weak (some δ below), incoherent (any δ contradicted by Γ).
* Legal‑move recommender:
    * if ... then ... → offer challenge antecedent or ask for consequent.
    * and → challenge either conjunct.
    * or → ask disjunct choice (opponent picks).
    * every/each (∀) → instantiate counterexample.
    * some (∃) → request witness or challenge existence.
    * Presupposition (loaded question) → suggest define term / split claim.
* Ludics‑lite normalization: Group DialogueMoves into P/O blocks. “Converged” if the last non‑empty opponent block has no legal attack left unanswered. Otherwise list openAttacks.
* DE‑meter (0–100): reasonsGivenRate (grounds/support edges present), answeredCQsRate, reciprocityIndex (reply balance across parties), clarityScore (inverse of Eristic marks). Weighted sum with room‑level config. Expose sub‑bars in UI.

6) Staged Roadmap (8 sprints; each is PR‑sized work)
A1 — TE/NLI foundation
* /api/nli/batch + NLILink.
* On ClaimEdge create/update → call NLI; store link. Acceptance: NLI tooltips on edges (relation+score).
A2 — CQ proof‑guard
* Server guard in /api/cqs/toggle.
* UI explains disabled checkbox (needs: attack edge + NLI score). Acceptance: After attaching a counter‑claim that passes NLI, the box enables without reload.
A3 — Legal‑move recommender
* legalAttacksFor(text) util + buttons in reply/WHY composer. Acceptance: Buttons insert structured replies tied to attack type.
A4 — Loci & normalization
* Migrations: DialogueLocus, DialogueChronicle; extend DialogueMove.
* normalizeLastK engine + “Interaction Trace” UI rail (P/O blocks, fork). Acceptance: Dialogical panel shows open legal attacks or “resolved”.
A5 — Eristic overlay
* Rules: loaded_question, equivocation/scope‑shift, quibble.
* EristicMark + overlay toggle + “honest route” prompt (CQ/define). Acceptance: Overlay highlights tactics with one‑click fixes.
A6 — Sequent lens in RepresentativeViewpoints
* Compute Γ, Δ per view; NLI aggregate; badge + “missing premise” suggestions. Acceptance: Badge correlates with facilitator judgments on a test set.
A7 — DE‑meter
* Rolling compute + header widget (sub‑bars; click → actionable to‑dos). Acceptance: Meter responds to answering CQs and providing reasons.
A8 — Optional LF assist & AIF export (feature‑flag)
* Narrow LF parsing for conditionals/quantifiers to sharpen TE on hard edges.
* AIF JSON export of Claims/Edges/Schemes. Acceptance: Export opens in external AIF tools; LF improves a small curated suite.

7) Evaluation & test plan
* Unit fixtures (repo): 40–60 micro‑examples hitting →, ∧, ∨, ∀, ∃, presupposition; gold labels for legal‑move suggestions and NLI relations.
* Product metrics:
    * CQ false‑unlock rate < 5%.
    * % replies using legal‑move buttons (target rising trend).
    * View entailment badge matches moderator rating ≥ 0.75 agreement.
    * DE‑meter improves after nudges (A/B or time‑series within rooms).
* Observability: log model + prompt hash in AiTransformEvent; store TE decisions in NLILink; show traces in admin.

8) Risks & mitigations
* NLI brittleness: cache results (NLILink), use conservative thresholds, always allow moderator override with reason (audit).
* Latency: batch NLI calls; pre‑fetch hot pairs from open views; consider local ONNX inference for MNLI‑class models.
* UX complexity: progressive disclosure (beginner: simple prompts; advanced lens toggles gated in controls), inline explanations.
* Moderation bias: Eristic overlay is assistive, not punitive; language is suggestive (“possible tactic”) with concrete fixes.

9) “Ready‑to‑cut” PRs (first 3)
PR‑1 — TE/NLI API + cache
* Prisma migration: NLILink.
* Route: /api/nli/batch (Zod‑validated).
* Hook ClaimEdge create/update → call NLI; write NLILink.
PR‑2 — CQ hard guard
* Patch /api/cqs/toggle: enforce attached edge + NLILink threshold; return {ok, reason, nli?: {relation, score}}.
* Front‑end: in CriticalQuestions, read nli to explain gating.
PR‑3 — Legal‑move suggester
* Add legalAttacksFor(text) util (cues for → ∧ ∨ ∀ ∃ + presupposition).
* Reply composer/WHY modal buttons create structured replies matched to attack type; wire to /api/dialogue/move (existing).
(You already have AiTransformEvent and AiNarrativeCache; keep using those for provenance and caching.)

10) Implementation notes (in your stack)
* RepresentativeViewpoints: Add EntailmentBadge fed by /api/nli/batch over Γ×Δ with caching; show “missing premise” chips → quick CQ prompts.
* ArgumentsList (monological): Keep MethodChip, MiniStructureBox, EvidenceChecklist; add “presupposition” hint + one‑click “Define terms” template reply.
* Dialogical panel: Add Interaction Trace (P/O blocks), open‑attacks list, Normalize button; Eristic overlay toggle aligned with your rhetoric controls.
* CQ modal: Already shows attach flow; now add why disabled tooltip + live enable once attach + NLI pass.

11) Final checklist before coding
* ✅ Agree on NLI thresholds & override UX copy.
* ✅ Green‑light the four mini tables above (or confirm alternatives).
* ✅ Confirm where to run NLI (adapter abstraction lets you start with any local/remote model).
* ✅ Decide feature flags per room (Eristic overlay, Sequent lens, LF assist).
When you’re ready, I’ll draft the exact TypeScript route stubs (Zod schemas + handlers) and Prisma migration blocks matching your conventions for PR‑1/2/3 so you can drop them in.












—

awesome stuff thank you -- before we begin development can you just review the output of the planning phase of this thread and strengthen/improve whatever you see needs hardening and consolidate a comprehensive roadmap for moving forward: wonderful stuff thanks -- last step in the planning stage for this thread: can you please update the ai/ml roadmap to incorporate eristics, ludics, operationalized inferential semantics, textual entailment etc that were explored in the two most recent research reviews and roadmaps--

current ml/ai roadmap: This is exactly the right direction. Below is a practical, end‑to‑end roadmap for weaving ML/AI into your deliberation engine so users (and internal jobs) can move both ways between informal language ↔ formal atoms (claims/edges/CQs/works) ↔ computed analytics (Dung AF, coverage, integrity) ↔ narrative views (briefs, syntheses, “why this”). It’s organized as:
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
  key         String   @unique // e.g., ${delibId}:view:${viewIndex}:why
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

Research Roadmap 1: Great prompt. I read the chapter version of the paper you pointed to (“Logical Semantics, Dialogical Argumentation, and Textual Entailment,” Catta, Moot, Retoré). It presents a dialogical proof system for classical first‑order logic that’s aligned with natural‑language use, proves completeness (winning strategy ⇔ classical validity), and then plugs a grammar/semantics parser (Grail) to show how natural‑language textual entailment (TE) examples (e.g., FraCaS) can be handled by dialogical rules. This is squarely usable to strengthen Discus’ theoretical core and several concrete features we already have in flight (CQ gating, dialogical lens, negotiation, etc.). (ar5iv)
Below is (1) a tight summary of the bits that matter for Discus, then (2) how to plug them into what we’ve built, and (3) a practical work plan with actionable tasks you can pick up immediately.

1) What the paper gives us (the pieces we should import)
* Inferentialist semantics, operationalized. Meaning = inferential use (assertions + justifications + refutations). Validity is dialogical: a claim is “valid” when the proponent has a winning strategy in a regulated attack/defense game. This is ideal for our DialogueMoves and the dialogical lens. (ar5iv)
* Two‑sided sequent view. They show strategies correspond to two‑sided sequent derivations (multiple hypotheses / multiple conclusions), which is the right formal backdrop for our “viewpoint = sequent” idea (Γ ⊢ Δ per view). (ar5iv)
* Attack/defense rules at formula shape. The dialogical rules cover how to attack/defend →, ∧, ∨, ∀, ∃ (e.g., opponent picks the antecedent on →; universal can be attacked by instantiation; etc.). This gives us a precise catalog of challenge prompts and response expectations for our “WHY/GROUNDS/RETRACT” move types. (ar5iv)
* Bridge to textual entailment (TE). They connect natural language to logic via type‑logical grammars and the Grail parser (delivering DRS‑like logical forms), then decide TE using the dialogical engine on FraCaS‑style examples. For Discus, this justifies plugging an NLI/TE layer to score whether a move actually supports or attacks as claimed. (ar5iv)
Why this matters for Discus: We already have a dialogical surface (moves), a Dung/Bipolar slice, and a CQ scheme layer. Catta et al. justify (i) using dialogical status (who can force a reply) as a first‑class semantic, (ii) representing each “view” as a two‑sided sequent (great for the Representative Viewpoints panel), and (iii) validating support/attack with an entailment test rather than heuristics. That’s the theoretical foundation we want.

2) Where it strengthens Discus now (feature by feature)
A) CQ gating + “Attach rebuttal/undercut”
* What we already did: UI gating that prevents ticking a CQ as satisfied unless an actual attack is attached; optional server guard.
* Upgrade with the paper: Treat each CQ action as a dialogical attack on a specific formula shape (e.g., expert‑opinion CQ often undercuts an implicit ⇒). Pair it with TE/NLI checks: the attached counter‑claim should be contradictory (rebut) or undercutting the rule (fails entailment from grounds to conclusion). This mirrors the paper’s formal attack rules and replaces “checkboxes” with proof‑obligations. (ar5iv)
Implementation hooks
* Keep your suggestionForCQ(schemeKey, cqKey) → {type: rebut|undercut, scope}.
* Add an /api/nli/batch that returns entails / contradicts / neutral + score for (attacker, target) pairs.
* Server guard (already sketched): only allow satisfied:true if we either (a) see the right ClaimEdge (rebuts/undercuts), or (b) NLI says contradiction/undercut above a threshold. This instantiates the dialogical rule + entailment bridge.
B) Dialogical lens (games, “winningness”, sequents)
* What we have: DialogueMoves, a panel, and an AF overlay.
* Upgrade with the paper:
    1. Maintain a scoreboard per thread/view: Γ (opponent’s challenges, context) and Δ (proponent’s active goals).
    2. Mark a node won when the last legit attack is defended and no further legal attack exists. That is exactly the “winning strategy” notion, but we implement a practical finite check (no more legal attacks given what’s asserted).
    3. Render mini two‑sided sequent boxes in the panel: left (available commitments), right (targets), with move types colored by →, ∧, ∨, ∀, ∃ attacks/defenses (we can infer shape from heuristics we already use in MiniStructureBox, plus NLI cues for conditionals).
Implementation hooks
* Keep using the DialogueMove.kind you already defined (ASSERT/WHY/GROUNDS/RETRACT).
* Add an in‑memory “legal moves recommender” that, when someone asserts A → B, auto‑offers the opponent the two standard attacks (assert A; ask B). That’s straight from the attack table in the paper. (ar5iv)
C) Representative Viewpoints → “Sequent lens”
* What we have: K‑view selection; conflicts/top pairs; CQ aggregate.
* Upgrade with the paper: interpret each view as Γ ⊢ Δ, where Γ = claims/grounds the view commits to; Δ = the view’s main conclusions. Use NLI aggregation to estimate whether Γ entails Δ (strong), fails to entail (needs work), or is contradicted (self‑defeating). That lets us surface “View 2 needs a premise for ⇒ step” rather than generic advice.
D) Monological lens → micro proof obligations
* Use the same attack/defense table to generate targeted prompts when we detect “therefore/ because / if … then …” in MiniStructureBox:
    * If text contains “because” → expect an attack on a premise; we can pre‑fill the “WHY?” modal with a premise‑challenge template.
    * If text contains “if … then …” → offer either antecedent challenge or ask‑for‑consequent defense, mirroring → rule. (ar5iv)
E) Evaluation harness
* The paper uses FraCaS‑style examples to test TE with the dialogical+grammar route. For Discus, spin a small dev suite of 20–50 micro items (conditionals, quantifiers, simple disjunctions) and run our NLI guard + legal move recommender against them so we don’t regress. (ar5iv)

3) Concrete work plan (wires into your current codebase)
Now (2–3 short tasks; all incremental)
1. NLI service
    * Add /api/nli/batch with input: { pairs: [{premise, hypothesis}] } → output: { relation: 'entails'|'contradicts'|'neutral', score }[].
    * Use any local NLI (e.g., a RoBERTa‑MNLI or DeBERTa‑MNLI checkpoint) behind an adapter; keep the API stable so we can swap models later.
    * Persist lightweight results: NLILink { fromId, toId, relation, score, createdAt } for cache/analytics.
2. CQ guard (server)
    * Extend /api/cqs/toggle: on satisfied:true, if suggestionForCQ demands rebut/undercut, require either a matching ClaimEdge or an NLI relation that’s contradicts (for rebut) or “does not entail + weakens rule” (for undercut; we approximate as neutral wrt conclusion plus contradicts wrt the rule’s warrant claim, if present).
    * Return {ok, satisfied, nliChecked: true, relation, score} so the UI can explain why a box became available.
3. Dialogical legal‑moves helper
    * New helper: legalAttacksFor(text) → returns { on:'conditional'|'conjunction'|'disjunction'|'forall'|'exists', options:[...] } by combining your MiniStructureBox cues with a few token patterns (if, and, or, every, some).
    * Surface it in DialogueMoves as suggested attacks and in the reply composer as pre‑filled buttons (“Challenge the antecedent”, “Ask to assert the consequent”, etc.). This matches the paper’s attack table. (ar5iv)
Next (2–4 weeks)
4. View = sequent status in RepresentativeViewpoints
    * Build Γ (the set of claims that this view accepts/supports) and Δ (the view’s 1–3 headline conclusions).
    * Call /api/nli/batch to evaluate Γ ⇒ Δ (aggregate entailment, e.g., max‑min or learned combiner).
    * UI: a tiny badge per view: “Entailment: strong / weak / incoherent”, with a click‑through list of missing steps (generate “WHY?” prompts from attack rules).
5. Winningness heuristic in DialogicalPanel
    * Given the move log, label each pending attack “legally unanswered” vs “answered”.
    * When all open legal attacks are answered (and NLI doesn’t find a contradiction), mark the node Proponent‑won (for now). That’s the practical cousin of “winning strategy” the paper proves for the idealized case. (ar5iv)
6. Richer CQ presets
    * For each scheme, tag which logical shape it typically challenges (e.g., Expert Opinion often undercuts an implicit → from testimony to conclusion).
    * Drive the attach‑UI with the correct attack buttons from the rule table.
Later (when we want deeper semantics)
7. Optional grammar/semantics hook
    * Paper uses Grail to turn sentences into DRS‑like logical forms; that’s French‑focused, but the architectural idea stands. We can pilot an English LF path (e.g., AMR → LF or a CCG‑to‑DRS route) for narrow, critical edges (conditionals and quantifiers). Keep this as an opt‑in “semantic assist” for hard cases rather than a hard dependency. (ar5iv)

Quick mapping: paper ideas → our code
Paper concept	Discus surface now	What to add/change
Winning strategy / dialogical validity	DialogueMoves, DialogicalPanel	Label “open legal attacks,” compute won/contested per claim; show legal move prompts derived from attack rules. (ar5iv)
Two‑sided sequents (Γ ⊢ Δ)	Representative views	Compute Γ/Δ per view; add Entailment status via /api/nli/batch. (ar5iv)
Attack/defense rules for →, ∧, ∨, ∀, ∃	MiniStructureBox, WHY/GROUNDS	Offer rule‑shaped challenge/defense shortcuts; drive CQ attach options. (ar5iv)
TE bridge via grammar	NLI guard not yet present	Add /api/nli/batch; verify support/attack claims; gate CQ satisfaction. (ar5iv)
Why this is a good theoretical anchor
* It aligns with our dialogical model lens (what counts is the ability to defend under a regulated exchange).
* It justifies protocol‑aware UI (the attack/defense menu is not arbitrary; it’s the formal game).
* It provides a principled way to integrate textual entailment so our “support/rebut” edges and CQ status are more than surface heuristics—there’s a logic‑backed check in the loop. (ar5iv)

Risks & how we mitigate
* NLI brittleness: modern NLI models aren’t perfect. We mitigate with explanations (“Contradiction score 0.86”) and always allow human override (with a reason).
* Parsing to LF is heavy: keep the grammar route optional and scoped; default to NLI‑only for most flows; reserve LF for high‑stakes edges (conditionals/quantifiers). (ar5iv)
* UI complexity: we’ll progressively disclose advanced dialogical options; beginners still get natural‑language composition + our structure assist.

If you want, I can draft the two small endpoints and the front‑end hooks next:
* /api/nli/batch (contract + minimal adapter)
* Server‑side CQ hard guard (the 5‑liner you okayed, extended to check NLILink)
…and wire the “legal attacks” suggester into DialogueMoves so the dialogical lens starts feeling like a game with rules rather than a free‑form log.

Research Roadmap 2- Fantastic prompt. I read the three pieces and translated their most usable ideas into concrete upgrades for **Discus** that dovetail with the monological/dialogical lenses, the CQ system, and your Knowledge/Supply and Works plumbing. I’ll summarize the *why*, then the *how* (schema, APIs, algorithms, UI), and close with a phased build plan and crisp “next tickets”.

---

## What these papers give us (and why they fit Discus)

### 1) Lecomte & Quatrini — *Ludics & NL Semantics*

**Core takeaway:** treat meaning (and debate) as **interaction** between strategies (“designs”), not static truth conditions. Dialogues unfold as alternating **positive/negative moves** anchored at **loci** (addresses). Two strategies are **orthogonal** when their interaction (normalization) converges; **behaviours** are sets of strategies closed under bi‑orthogonality. The **daïmon** ends play; **focalization** groups same‑polarity steps; “Fax” captures identity/equivalence. This gives a rigorous way to model turn‑taking, retractions, and fallacies like loaded questions (presuppositions). ([ar5iv][1])

> Why it helps: your dialogical lens (DialogueMove, GraphEdge) already captures “assert/why/grounds/retract”. Ludics gives us a principled **engine** to (a) track when a dialogue segment *converges* (success), *diverges* (stalemate), or is *derailed* (eristic tactic), (b) annotate **where** the conversation branches (loci/forks), and (c) detect **stratagems** such as scope‑narrowing and presupposition injection (you already show scope chips and have a detectors pipeline; Ludics clarifies the state machine to power them). ([ar5iv][1])

### 2) Lemanski — *Logic Diagrams as Argument Maps in Eristic Dialectics*

**Core takeaway:** formalize **eristic** (winning‑oriented) dialogues with **logic diagrams** that show *routes* arguments can take. Schopenhauer‑style stratagems can be diagrammed as **argument maps**; diagrams help reveal detours and unfair maneuvers. ([SpringerLink][2])

> Why it helps: your Conflicts header, dialogical map, and issue tracker can get a new “**Eristic route overlay**” that visually highlights **how** a position is being defended (honest route vs. stratagem route) and where users should deploy **CQs**. It complements CQBar and the “Attach rebut/undercut” flow you just wired.

### 3) Lemanski — *Discourse Ethics and Eristic*

**Core takeaway:** contrast **discourse‑ethical** norms (reciprocity, sincerity, justification) with **eristic** tactics. Provides criteria to **score** a dialogue’s procedural quality (e.g., reasons offered, willingness to answer challenges, avoidance of ambiguity/shift). ([SpringerLink][2])

> Why it helps: adds a **normative meter** to Discus (“DE‑compliance index”) and targeted **prompts** in your coaching UI (“Please answer the pending CQ before asserting a new claim”; “Define key terms to avoid equivocation”). This plugs right into your CQStatus, DialogueMove, and moderation scaffolding.

---

## How to fold this into Discus (data → engine → UI)

Below I keep changes **minimal and additive** to your current schema (so you can ship in sprints).

### A) Data model extensions (small, explicit)

1. **Dialogue loci & chronicles (Ludics)**

* **New table:** DialogueLocus
  id, deliberationId, parentLocusId?, address (string path like '0/1/2'), openedByMoveId
* **New table:** DialogueChronicle
  id, deliberationId, locusId, order (int), moveId, polarity ('P'|'O'), note?

2. **Moves enriched with polarity and focalization**

* **Extend** DialogueMove with:
  polarity: 'P'|'O' | null, locusId: string | null, focusGroupId: string | null, endsWithDaimon: boolean @default(false)

  * *Mapping:* your existing kinds (ASSERT, WHY, GROUNDS, RETRACT) map to positive/negative under Ludics: positive = act (assert/ask), negative = receive/register/plan next. ([ar5iv][1])

3. **Eristic signals**

* **New enum:** EristicTactic (e.g., equivocation, loaded_question, quibble_scope, ad_hominem, …)
* **New table:** EristicMark
  id, deliberationId, targetType ('argument'|'claim'|'move'), targetId, tactic: EristicTactic, detector: 'rule'|'ml'|'mod', strength: float, createdById, createdAt

4. **Normative footprint (Discourse Ethics)**

* **New table:** DialogueNormScore
  id, deliberationId, windowStart, windowEnd, deScore: float, details Json (answeredCQs, reasonsGiven, equivocationsAvoided, reciprocityIndex), computedAt

These are all independent add‑ons; the core Argument/Claim schema stays intact.

---

### B) Reasoning engine modules

1. **ludics-core.ts (self‑contained utility)**

* **Design, Move, Fork** types (addresses as arrays, positive/negative moves, optional daïmon).
* **normalize(designA, designB)** → { converged:boolean, steps:number, reason:'daimon'|'mismatch'|'limit' }
* **orthogonal(a,b)** iff normalize converges (daïmon) within bound N.
* **focusBlocks(moves\[])** groups contiguous same‑polarity moves (focalization). ([ar5iv][1])

2. **ludics-adapter.ts (bridge to Discus data)**

* Compile a pair of participants’ recent DialogueMoves into two **Designs** (A vs B), anchored by DialogueLocus addresses; run **normalize**:

  * Converged → tag the segment “**resolved**” and auto‑close related **Issue**;
  * Mismatch/diverge → surface **where** the fork failed (great pointer for **CQ** prompts);
  * Detect **presupposition/loaded question** as in Ludics example (“Do you still…?”) and auto‑suggest a **CQ** or **rebut premise**. ([ar5iv][1])

3. **eristic-detector.ts**

* Implement a ruleset matching Lemanski’s eristic routes; mark **EristicMark** on arguments/moves; offer a *clean* route alternative suggestion (“define term”, “answer pending CQ”) with a one‑click template. ([SpringerLink][2])

4. **de-score.ts**

* Compute a rolling **discourse‑ethics score** per window: % of assertions with reasons, % of answered CQs, # of equivocations caught/avoided, willingness to engage (reply reciprocity). Persist to DialogueNormScore. ([SpringerLink][2])

---

### C) API routes (thin)

* POST /api/dialogue/loci → open/close a locus, return address path (0/1/…).
* GET  /api/dialogue/chronicle?deliberationId=… → last N moves with polarity blocks & loci.
* POST /api/diag/ludics/normalize → { windowSize?, participants? } → { converged, fork, suggestion }.
* POST /api/eristic/scan → run rules/ML over recent moves; create **EristicMark** records.
* GET  /api/dialogue/de-score?window=… → latest discourse‑ethics meter.

These can be feature‑flagged per room.

---

### D) UI: minimal, powerful overlays

1. **“Interaction Trace”** (Dialogical Panel)
   Add a small side rail that shows **loci as a tree** and **polarity blocks** (P/O). Clicking a fork reveals *why* normalization failed (exact move pair). Good for “where did we talk past each other?”. ([ar5iv][1])

2. **“Eristic route overlay”**
   Toggle that colors edges/moves when a route uses a known stratagem (equivocation, loaded question) and draws the **alternate honest route** as dashed guidance (from the diagram idea). Tie each highlight to a CQ or “define term” nudge. ([SpringerLink][2])

3. **“DE‑meter”**
   A compact gauge (0–100) with 3–4 sub‑bars: *reasons given*, *CQs answered*, *reciprocity*, *clarity*; clicks open concrete to‑dos (e.g., “2 open CQs on Claim X”). ([SpringerLink][2])

4. **Prompts blended with your composer**
   If a positive move is about to start a new block while previous negative block has unresolved CQs, show a gentle pre‑flight prompt: “**Answer open CQ Y first?**”. This operationalizes focalization and DE norms. ([ar5iv][1], [SpringerLink][2])

---

## Where this plugs into your current stack

* **Monological lens** (your current focus):

  * Keep MethodChip & MiniStructureBox; extend detectors to flag **presupposition** and **scope‑narrowing** (both in *Ludics examples*). These map to CQ suggestions: *“rebut premise / define scope”*. ([ar5iv][1])
  * Add a tiny “**Therefore?** / **Because?**” hint when we see unfocused alternation (encourages focalized blocks). ([ar5iv][1])

* **Dialogical lens** (next):

  * Surface **loci/chronicle** and **normalization** result.
  * Show **eristic overlay** and **DE‑meter** side by side.

* **CQ system** (you just hardened it):

  * When a CQ is attached with an undercut/rebut, mark that the *negative* step responded to a *positive* step in the same focal block; allow satisfying the CQ only if the block aligns (hard guard is consistent with **orthogonality** idea). ([ar5iv][1])

* **Moderation / Integrity**:

  * Use **EristicMark** counts as soft signals in ContentStatus for *WORKSHOP* vs *OK*. ([SpringerLink][2])

---

## Phased build plan (6–8 weeks)

**Phase 1 (week 1–2): foundations**

* Add EristicMark, DialogueNormScore.
* Extend DialogueMove with polarity, endsWithDaimon.
* Detectors: add **presupposition** & **scope‑shift** rules; show “honest route” prompt.
* UI: DE‑meter v0 (computed from existing CQ + reasons rates).

**Phase 2 (week 3–4): Ludics core & overlays**

* Implement ludics-core.ts + ludics-adapter.ts and a small “**Normalize last N moves**” button in DialogicalPanel.
* Persist DialogueLocus/DialogueChronicle only when Dialogical lens is on (feature flag).
* UI: **Interaction Trace** rail; show convergence/failure locus.

**Phase 3 (week 5–6): Eristic route diagrams**

* Encode 6–8 Schopenhauer‑style routes as rules → **EristicMark** + alternate route suggestions (map to CQ templates).
* UI toggle “**Eristic overlay**”.

**Phase 4 (week 7–8): Polishing & research hooks**

* Hard‑guard CQ satisfaction by *attached attack* (you already added client guard; add server‑side one).
* Expose /api/dialogue/de-score and a facilitator dashboard widget.
* Add a data export stub (JSON) that could later map to AIF for interoperability.

---

## Immediate “ready-to-ticket” items

1. **Schema PR** (tiny): add tables for EristicMark, DialogueNormScore; extend DialogueMove with polarity, endsWithDaimon.
2. **Detectors**: add loaded_question + scope_narrowing rules → raise CQ suggestions. (Maps directly to your detectors.ts and CQBar prompts.) ([ar5iv][1])
3. **DE‑meter v0**: compute reasonsGivenRate, answeredCQsRate, reciprocityIndex; render in DeepDive header. ([SpringerLink][2])
4. **Normalize prototype**: utility normalizeLastK(deliberationId, k=12) → JSON with {converged,forkPath,suggestion}; simple “Normalize” button in DialogicalPanel. ([ar5iv][1])
5. **Eristic overlay v0**: highlight equivocation & loaded_question with tooltips linking to “Attach rebut/undercut” quick action + CQ.

---

## Why this is theoretically sound **and** practical

* You keep the **monological** gains (Toulmin, method chip, structure box) while giving the **dialogical** lens a formal engine for **success/failure** (orthogonality) and **stateful turn‑taking** (focalization, loci). ([ar5iv][1])
* You transform the CQ feature from a checklist into a **game‑theoretic guardrail**: CQs become the exact places where normalization can resume.
* You provide facilitators with **visual eristic routes** and a **normative dial** (DE‑meter) to keep conversations constructive without heavy‑handed moderation. ([SpringerLink][2])

If you want, I can draft the exact Prisma snippets for EristicMark and DialogueNormScore, plus the normalize utility’s function signature using your existing DialogueMove model names—so you can merge Phase‑1/2 quickly.

[1]: https://ar5iv.org/pdf/0910.1484 "[0910.1484] Ludics and Its Applications to Natural Language Semantics"
[2]: https://link.springer.com/content/pdf/10.1007/s10503-022-09587-1.pdf "Logic Diagrams as Argument Maps in Eristic Dialectics"
ChatGPT said:
Request for GPT-5 Pro
Reasoned for 3m 47s

Absolutely—here’s a consolidated AI/ML Roadmap v2 that folds in ludics, eristics, operationalized inferential semantics, and textual entailment (TE/NLI) on top of the plan you already have. I’ve kept the same backbone (principles → transforms → data → staged sprints → eval/guardrails → ready‑to‑cut PRs) and highlighted what’s new or changed.

0) Executive summary — what changes vs. v1

Dialogical validity as a first‑class signal. We model “who’s forced to reply?” and “is the attack legally answered?” via a lightweight ludics layer: loci (addresses), polarity blocks, and a normalization check over recent moves.

CQ satisfaction becomes a proof‑obligation. A CQ can only be marked “met” if there’s a matching attached counter‑move (rebut/undercut) and/or TE/NLI confirms the intended relation (contradiction/undercut).

Sequent lens for views. Treat each representative view as a two‑sided sequent Γ ⊢ Δ and estimate entailment with NLI aggregation; surface missing premises/weak steps.

Eristic route detection & coaching. Detect and visualize eristic stratagems (loaded question, scope‑shift/equivocation, etc.) and suggest “honest routes” (targeted CQs or define‑terms prompts).

Operationalized inferential semantics. We track micro attack/defense rules for → ∧ ∨ ∀ ∃ (as cues), drive legal‑move suggestions, and use TE/NLI to validate support/attack edges.

1) Principles & system map (updated)

New principles

Dialogical primacy: A claim’s status is tied to the existence of a winning response pattern (all open legal attacks answered), not just static counts.

Proof‑guarded UX: Certain actions (mark CQ “satisfied”, “supports/rebuts” labels) require attached moves + TE/NLI confirmation above a threshold.

Eristic‑aware nudging: We don’t punish; we surface stratagem routes and offer quick, constructive alternatives (CQs, define scope, add warrant).

System map deltas

Add a TE/NLI adjudicator in Analytics layer.

Add Ludics adapter in Reasoning to compute open/answered legal attacks and normalization outcomes.

Add Eristic detector parallel to Rhetoric detectors.

2) Core transforms (“bridges”) — with new/changed ones

T0. TE/NLI adjudicator (new)

In: pairs/triples of texts: (premise, hypothesis) or (attacker, target, relationHint).

Out: { relation: 'entails'|'contradicts'|'neutral', score }.

Use: validate supports/rebuts; gate CQ satisfaction; rate sequent entailment Γ⇒Δ; rank “best counter”.

T1. NL → Atoms (formalize) (extended)

Add detection of logical shapes (if/then, and/or, quantifiers) and presuppositions; emit legalAttacks suggestions for the reply UI.

Emit eristicHints (e.g., loaded_question, equivocation_scope) as soft marks.

T1b. Edge typing w/ TE (new micro‑transform)

When the user proposes a support/rebut edge, call TE/NLI to annotate edge.confidence + why (matched spans).

T2. Atoms → NL (explain) (extended)

Include dialogical trace: which legal attacks remain, what was answered (with links).

For views, narrate Γ ⊢ Δ status and suggest “missing premise” where TE is weak.

T3. Atoms → Analytics (compute) (extended)

Dialogical scoreboard: open vs. answered legal attacks; normalization result on last N moves.

DE‑meter: discourse‑ethics score (reasons rate, answered CQs, reciprocity, clarity).

Eristic marks statistics (counts by tactic).

T4. NL → Graph Ops (control) (extended)

Add legal‑move recommender: “Challenge the antecedent”, “Ask for consequent”, “Pick disjunct”, etc., derived from shape cues.

T5. Retrieval/Evidence (unchanged but connected)

When a CQ requires evidence, the retrieval transform proposes citations; successful attach updates CQ status and dialogical scoreboard.

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

POST /api/nli/batch → TE adjudicator.

POST /api/cqs/toggle (server guard): refuse satisfied:true unless (a) matching ClaimEdge exists and/or (b) NLILink shows contradiction/undercut above τ.

GET /api/dialogue/chronicle → last N moves with loci/polarity.

POST /api/dialogue/normalize → normalize last K moves; return converged/fork info.

POST /api/eristic/scan → run detectors, write EristicMark.

4) Staged roadmap (8 sprints)
Sprint A1 — TE/NLI foundation

Add /api/nli/batch + NLILink cache.

Wire edge creation to log an NLILink (supports/rebuts confidence).

Deliverable: TE labels appear in dev logs and can be shown on hover tooltips (“contradiction .86”).

Sprint A2 — CQ proof‑guard

Server‑side guard in /api/cqs/toggle: block satisfied:true unless attached attacker edge and NLILink matches expected relation (rebut: contradiction; undercut: target’s warrant weakened).

UI: show why a box unlocks/locks (edge present? TE score?).

Sprint A3 — Legal‑move recommender

Detector of logical shapes (→ ∧ ∨ ∀ ∃, presupposition).

UI: buttons in reply/WHY composer: “Challenge antecedent”, “Pick disjunct”, “Instantiate ∀”, “Ask to define presupposition”.

Deliverable: dialogical replies feel “rule‑driven”, not free‑form only.

Sprint A4 — Ludics loci & normalization

Data: DialogueLocus, DialogueChronicle; extend DialogueMove with polarity.

Engine: normalizeLastK() returns {converged, forkPath, suggestion}.

UI: “Interaction Trace” rail in Dialogical panel with P/O blocks and the fork locus.

Sprint A5 — Eristic overlay

Rules: loaded_question, equivocation/scope‑shift, quibble → mark EristicMark.

UI toggle: color eristic routes and show an honest route suggestion (mapped to CQ templates / define terms).

Sprint A6 — Sequent lens for views

Compute Γ ⊢ Δ per representative view; call TE/NLI to estimate entailment strength.

UI: “Entailment: strong/weak/incoherent” badge; click shows missing steps (suggest CQs/bridges).

Sprint A7 — Discourse‑Ethics meter

Compute rolling DE‑score; show gauge (reasons given, answered CQs, reciprocity, clarity).

Nudges: when starting a new assertion while open CQs exist, prompt: “Answer CQ X first?”

Sprint A8 — Optional LF assist & AIF bridge

Optional LF parsing (for conditionals/quantifiers) behind a feature flag to sharpen TE on hard cases.

AIF export stub for interoperability (arguments/attacks/schemes).

5) Evaluation, datasets, and metrics

Unit fixtures: 30–50 micro‑items (if/then; and/or; every/some; presuppositions).
Goal: legal‑move suggestions match ground truth; NLI relation aligns ≥75%.

Datasets: small curated set per room (opt‑in), plus public NLI sets for regression sanity (MNLI subset; FraCaS‑style).

Product metrics:

CQ false‑unlock rate < 5%,

% replies using legal‑move buttons,

View Entailment badge correlation with moderator judgments,

DE‑score improves after nudges (A/B).

6) Guardrails & risks

NLI brittleness: keep thresholds conservative, always allow human override with reason (audit in AiTransformEvent). Show TE score when gating.

Latency: batch NLI calls; cache NLILink; pre‑fetch pairs from hot threads/views.

UX complexity: progressive disclosure (beginner sees simple prompts; power users toggle Dialogical/Eristic overlays).

Fairness: eristic detection is assistive, not punitive; phrasing: “Possible tactic detected (equivocation). Would you like to clarify the term ‘X’?”

7) “Ready‑to‑cut” PRs (next 1–2 weeks)

PR‑1: TE/NLI API + cache

Add NLILink model.

POST /api/nli/batch (adapter skeleton, we can swap models later).

On ClaimEdge create, call NLI and store NLILink.

PR‑2: CQ hard guard

Patch /api/cqs/toggle to require (edge present) ∧ (NLILink matches) for satisfied:true.

UI: in the modal, show why a box is disabled/enabled (edge? NLI?).

PR‑3: Legal‑move suggester

legalAttacksFor(text) util; expose buttons in DialogueMoves and the reply composer.

Add simple presupposition & quantifier patterns.

PR‑4: Loci/chronicle (foundations)

Migrations: DialogueLocus, DialogueChronicle; extend DialogueMove.

Minimal UI: Interaction Trace rail listing last N moves grouped by polarity.

(We can line these up exactly in your repo structure; I kept it tool‑agnostic here to stay concise.)

8) Where this plugs into your current surfaces

RepresentativeViewpoints

Adds “Entailment badge” per view; “missing steps” link generates CQ prompts.

CQ modal already proof‑guarded (client). Server guard closes the loop.

ArgumentsList (monological lens)

Use MethodChip + MiniStructureBox to trigger legal‑move buttons and presupposition clarifications.

When a rebuttal is added, show TE/NLI tooltip (“contradiction .82”).

Dialogical panel

Interaction Trace (loci, P/O blocks), Normalize button.

Eristic overlay toggle with “honest route” suggestions.

CQ system

Satisfaction requires attached attack + TE threshold (unless moderator overrides).

“Attach rebut/undercut” buttons select from legal options derived from shape.

Quick notes (opinions)

Keep TE/NLI assistive—we adjudicate, we don’t auto‑write. Humans accept/override with a reason (stored).

Ludics gives you a principled, lightweight game engine; you don’t need full proof search—just enough to gate CQs, suggest moves, and show “open legal attacks.”

Eristics should feel like a coach, not a cop: “Looks like a loaded question—split it into two claims?” with one‑click templates.

If you want, I can paste the exact Prisma migration blocks for the four new tables and a minimal /api/nli/batch contract (Zod types + stub handler) so you can start PR‑1 immediately.
