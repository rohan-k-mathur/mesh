/**
 * orientation.ts — Server-level instructions block + `get_orientation`
 * tool payload for the Isonomia MCP server.
 *
 * Why this exists:
 *   The MCP tool descriptions are accurate per-tool but silent on the
 *   framework. Cold-start agents (Claude eval, May 2026) had to
 *   reverse-engineer `standing`, `MOID`, `refusalSurface`, `chain`,
 *   depth tiers from field names. This module fixes that by:
 *
 *     1. SERVER_INSTRUCTIONS — short ontology + workflow pointer,
 *        loaded once per session via MCP `InitializeResult.instructions`.
 *     2. ORIENTATION_PAYLOAD — long-form glossary + workflow recipes,
 *        returned by the `get_orientation` tool only when called.
 *
 * Both are pragmatic (what do I do with this data?) rather than
 * theoretical (why is the data structured this way?). No argumentation-
 * theory background; every term is defined by its writing-time
 * implications.
 *
 * Versioning: ORIENTATION_VERSION bumps when the payload changes so
 * clients can cache it across sessions without re-reading.
 */
/**
 * Bump when ORIENTATION_PAYLOAD changes. Returned alongside the payload
 * as `version`; agents can hash + cache against this.
 */
export const ORIENTATION_VERSION = "1.8.0";
/**
 * Loaded once per MCP session via `InitializeResult.instructions`.
 * Target: ~400 tokens. Keep tight; the long form lives in
 * ORIENTATION_PAYLOAD.
 */
export const SERVER_INSTRUCTIONS = `Isonomia exposes a deliberation as a typed argument graph.

ONTOLOGY (read once):
A deliberation contains arguments. Each argument has a conclusion (a claim, identified by content-derived MOID — multiple arguments can share one), one or more premises, and an argumentation scheme (the reasoning pattern: expert-opinion, analogy, cause-to-effect, IBE, etc.). Arguments connect via typed edges: support, rebut (attack the conclusion), undercut (attack the inference), undermine (attack a premise). Each argument carries a STANDING that progresses untested-default → untested-supported → tested-attacked → tested-undermined → tested-survived, and a depth tier (thin / moderate / dense) recording how many independent challengers have engaged. Standing without depth is unreliable: "tested-undermined by 1 thin challenger" ≠ "tested-undermined by 10 dense ones". Each scheme has CRITICAL QUESTIONS the literature requires for the scheme to hold; unanswered CQs are tracked per argument. CHAINS are editor-curated paths through the graph (premises → conclusion); chainStanding is worst-link, not average. The REFUSAL SURFACE lists conclusions the graph cannot currently license because of unanswered attacks; entries are hard constraints, not suggestions.

TOOL SELECTION:
Use IDs correctly — \`get_argument\` takes an argument id, \`find_counterarguments\` takes a claim MOID. They are not interchangeable.

WORKFLOW:
For any deliberation question, call \`get_orientation\` once at session start, then \`get_synthetic_readout\` once per deliberation. Read its \`writingConstraints\` before composing output — it tells you what you must include, what you must not assert, and what you must hedge. Drill into specific arguments with \`get_argument\` and specific claims with \`find_counterarguments\` only after orientation.

WRITING TO THE GRAPH (these tools commit rows; treat as first-class, not as fallback):
Whenever the user states a position, asks you to "record / log / capture / save / register" a claim or counter-claim, drafts a thesis, or sketches an evidence-backed argument, reach for a write tool instead of replying in prose. Two write surfaces:
  • \`propose_argument\` — bare assertion. \`{ claim, reasoning?, evidence?[], deliberationId? }\`. Use only when the user has a one-line claim with no premises worth naming.
  • \`propose_structured_argument\` — PREFER THIS whenever the user gives reasons ("because…", "since…"), names an argumentation pattern (expert opinion, analogy, cause-to-effect, practical reasoning), or expects per-premise standing/CQs. \`{ conclusion, premises[], reasoning?, schemeKey?, evidence?[], deliberationId? }\`. Each premise becomes its own Claim row, so attackers can later undermine specific premises rather than the whole argument. If unsure which scheme applies, call \`list_schemes\` first; or omit \`schemeKey\` and the server will infer one (returned as a \`scheme_inferred\` warning).
Both tools return a permalink + immutable content-addressed URL. Omit \`deliberationId\` to land in the caller's "My Arguments" room; pass one to land in a specific debate. For warrants/inference-licenses against an existing argument, use \`propose_warrant\`. After any write, call \`get_argument\` on the returned id (after \`retryAfterMs\` if \`provenancePending\` is true) to verify the round-trip before claiming success. Do not invent ids or permalinks — only echo what the write tool returned.

TOOL-CLUSTER MAP (46 tools / 6 clusters — route here before scanning tool descriptions):
  1. Session start: \`get_orientation\` (full glossary + recipes), \`get_capabilities\` (cheap auth/identity probe — no round-trip).
  2. Retrieval: \`search_arguments\`, \`get_argument\`, \`get_claim\`, \`get_claim_stances\`, \`find_counterarguments\`, \`cite_argument\`, \`resolve_citation\`, \`resolve_citations_bulk\`.
  3. Authoring/WRITE: \`propose_argument\`, \`propose_structured_argument\`, \`propose_warrant\` (see above).
  4. Deliberation synthesis: \`get_synthetic_readout\` (primary), \`get_deliberation_fingerprint\`, \`get_contested_frontier\`, \`get_missing_moves\`, \`get_chains\`, \`get_cross_context\`, \`summarize_debate\`, \`get_deliberation_evidence_context\`.
  5. Algebraic/ECC: \`ecc_arrow\`, \`ecc_culprits\`, \`ecc_confidence\`, \`ecc_enthymemes\`, \`ecc_transport\`, \`ecc_aggregate\`, \`ecc_evidential\`, \`ecc_belief_revision_proposals\`; scheme catalog: \`list_schemes\`.
  6. Ludics generative substrate (only when the user mentions locus / design / behaviour / incarnation / cone / witness / articulation lattice / daimon / bind / synthesis): reads \`get_deliberation_schema\` (START HERE), \`get_behaviour_at_locus\`, \`get_exposure_map\`; lattice algebra \`get_articulation_lattice\`, \`find_minimal_incarnations\`, \`find_equivalent_articulations\`, \`find_substitute_premises\`, \`compress_articulation\`, \`compute_articulation_join\`; witness reads \`get_witnesses\`, \`get_unwitnessed_exposure\`, \`get_instantiation\`, \`get_fossil_record\`; helpers/writes \`list_bindable_moves\` (CALL BEFORE BIND — pre-pairs ludicMoveId + dialogueMoveId + canonicalText), \`bind_participant_to_design\` (iota seam — only path that mints WitnessRecord), \`propose_synthesis\` (Art(B) join write seam). Ludics rules: Inc(B) is an antichain — there is NO global bottom of a behaviour, only per-cone minima; cones are disjoint (cross-cone joins/meets return \`cross-cone-rejected\` — that's a value, not an error); never hand-build \`canonicalText\` (copy verbatim from \`list_bindable_moves\`); never echo \`participantId\` back to the user (T4 non-attribution). For the full Ludics workflow recipes (explore-layer / bind-participant) and glossary, call \`get_orientation\`.`;
/**
 * Returned by the `get_orientation` tool. Markdown-formatted for direct
 * model consumption. Target: ~1.5K tokens.
 */
export const ORIENTATION_PAYLOAD = `# Isonomia Agent Orientation

Version: ${ORIENTATION_VERSION}

## Tool clusters — route here first

46 tools across 6 clusters. Use this map before scanning individual tool descriptions. For a cheap runtime probe of auth / identity / orientation hash without re-reading this payload, call \`get_capabilities\`.

### Cluster 1 — Session start (1 tool)
- \`get_orientation\` — you are reading its output. Call once per session; cache against \`contentHash\`.

### Cluster 2 — Argument retrieval (8 tools)
Use when finding, fetching, or citing specific arguments or claims.
- \`search_arguments\` — free-text search across the graph (ranked by dialectical fitness)
- \`get_argument\` — fetch one argument by id (full: premises, evidence, standing, CQs)
- \`get_claim\` — fetch one claim by MOID (conclusion text, stance count)
- \`get_claim_stances\` — who holds a stance on a claim, scoped to a deliberation
- \`find_counterarguments\` — attacks registered against a claim MOID
- \`cite_argument\` — permalink → structured argument data
- \`resolve_citation\` — DOI/arXiv/URL → canonical citation record (call before \`propose_*\`)
- \`resolve_citations_bulk\` — batch version of \`resolve_citation\`

### Cluster 3 — Argument authoring / WRITE surface (3 tools)
Use when the user wants to record, log, register, or save a position.
- \`propose_argument\` — bare assertion (one-line claim, no explicit premises)
- \`propose_structured_argument\` — **PREFER.** Premise-typed, scheme-annotated, evidence-attached. Enables per-premise standing + CQ tracking.
- \`propose_warrant\` — attach an inference-license warrant to an existing argument.

### Cluster 4 — Deliberation synthesis (8 tools)
Use when working with a whole deliberation room, not individual arguments.
- \`get_synthetic_readout\` — **PRIMARY.** Full synthesis: fingerprint + frontier + topology + refusal surface + top arguments + writing constraints. Start here for any deliberation question.
- \`get_deliberation_fingerprint\` — lightweight freshness check (contentHash only; no synthesis)
- \`get_contested_frontier\` — open challenges (projects onto \`get_synthetic_readout.frontier\`)
- \`get_missing_moves\` — catalog gaps (projects onto \`get_synthetic_readout.missingMoves\`)
- \`get_chains\` — editor-curated traversal paths through the argument graph
- \`get_cross_context\` — cross-deliberation canonical-claim families
- \`summarize_debate\` — NLP-generated summary paragraph (unstructured; prefer \`get_synthetic_readout\` when structure matters)
- \`get_deliberation_evidence_context\` — evidence rollup for a deliberation

### Cluster 5 — Algebraic / ECC tools — Ambler-style derivation checking (8 tools)
Use when auditing the inferential structure of a specific argument or warrant. These tools operate on the closed-category derivation algebra, not on the deliberation graph directly.
- \`ecc_arrow\` — check whether a derivation arrow is valid at the given confidence tier
- \`ecc_culprits\` — find which assumption sets drive a derivation's confidence level
- \`ecc_confidence\` — compute the overall confidence level for a derivation
- \`ecc_enthymemes\` — surface implicit premises (what must be true for the inference to hold)
- \`ecc_transport\` — check whether an argument transports to a new evidential context
- \`ecc_aggregate\` — aggregate multiple derivations into a combined confidence score
- \`ecc_evidential\` — evidential closure: what can be derived from a given evidence set
- \`ecc_belief_revision_proposals\` — what would have to be retracted to block a conclusion

### Scheme catalog (1 tool)
- \`list_schemes\` — browse the argumentation-scheme catalog. Filter by \`clusterTag\` (expert | causal | practical | analogical | …). Call before \`propose_structured_argument\` when scheme is unclear.

### Cluster 6 — Ludics generative substrate (16 tools)
Use when the user mentions **locus**, **design**, **behaviour**, **incarnation**, **cone**, **witness**, **articulation lattice**, **delocation**, **daimon**, or asks to **bind a participant** / **propose a synthesis** / **compress** or **join** articulations. Skip this cluster entirely for ordinary argument-graph questions — the deliberation graph (Clusters 2–4) is the public face; Ludics is the algebraic underlay.

**Read structure (Cluster F — orientation reads):**
- \`get_deliberation_schema\` — START HERE for any Ludics question. Returns locus count, design tree, witnessing-coverage summary. Costs O(1) round-trip; tells you whether the deliberation even has a Ludics layer worth exploring.
- \`get_behaviour_at_locus\` — at a given locus, list the behaviour's designs + their cones + per-design witnessing state.
- \`get_exposure_map\` — per-locus map of walked / witnessable / latent moves; the dialectical surface a participant could engage.

**Lattice algebra (Cluster B — six Art(B) operations):**
- \`get_articulation_lattice\` — PRIMARY. Full Art(B) for a behaviour: incarnations, cones, inclusion edges, optional equivalence classes. Inc(B) is an antichain (Phase 2e): no global bottom, one minimum per cone.
- \`find_minimal_incarnations\` — antichain of per-cone bottoms. Use right after \`get_articulation_lattice\` to pick a target design for binding.
- \`find_equivalent_articulations\` — same ~_⊥⊥ biorthogonal class as a given design ("different incarnations, same testing behaviour").
- \`find_substitute_premises\` — incarnations that avoid a specified set of premises (useful for "can we still license C if we drop premise P?").
- \`compress_articulation\` — meet D₁ ∧ D₂. Partial: only defined within a single cone. Discriminated result: \`same-cone-meet\` | \`same-cone-incomparable\` | \`cross-cone-rejected\`.
- \`compute_articulation_join\` — join D₁ ∨_⊥⊥ D₂. Also partial. Discriminated result: \`same-cone-join\` | \`same-cone-delocation-required\` | \`cross-cone-rejected\`.

**Witness reads (Cluster E — read-side of the iota seam):**
- \`get_witnesses\` — active WitnessRecords for a LudicMove (T4: no participantId returned).
- \`get_unwitnessed_exposure\` — LudicMoves with non-empty exposure but no active witness.
- \`get_instantiation\` — whether a specific DialogueMove has been ι-bound to a LudicMove (verify before re-binding).
- \`list_bindable_moves\` — **HELPER for the bind workflow.** Returns LudicMoves eligible for \`bind_participant_to_design\`, each pre-paired with unused DialogueMoves carrying ready-to-submit \`canonicalText\`. Makes "bind me to design X" executable in one turn. Filter by \`designId\`, \`behaviourId\`, or \`locus\`.

**Write seams (Cluster D — the only paths that mutate Ludics state):**
- \`bind_participant_to_design\` — iota seam. The ONLY way to create a WitnessRecord. Enforces S1–S4 (locus exists, structure intact, canonicalText passes pipeline, scheme valid). Call \`list_bindable_moves\` first if you don't already have \`ludicMoveId\` + \`dialogueMoveId\` + \`canonicalText\`.
- \`propose_synthesis\` — Art(B) join write seam. Computes ∨_⊥⊥ of two designs in the same behaviour and commits the resulting Design + WitnessRecord. Discriminated result mirrors \`compute_articulation_join\`.

**Audit:**
- \`get_fossil_record\` — fossilized (retracted) WitnessRecords for a deliberation, with retract layer + reason.

---

## Glossary (operational meanings)

- **argument** — A scheme-typed inference: premises + conclusion + scheme key. Identified by an \`id\` (cuid). Use this id with \`get_argument\`, \`cite_argument\`, and inside \`chains[].edges\`.

- **claim / MOID** — A conclusion's content-derived identifier. Multiple arguments can share a MOID (different reasonings, same conclusion). Use this with \`find_counterarguments\` and \`get_claim\`. Do not pass an argument id where a MOID is expected.

- **scheme** — The reasoning pattern. Examples: \`expert_opinion\`, \`analogy\`, \`cause_to_effect\`, \`inference_to_best_explanation\`. Each scheme has its own catalog of critical questions.

- **standing** — Lifecycle label, ordered: \`untested-default\` < \`untested-supported\` < \`tested-attacked\` < \`tested-undermined\` < \`tested-survived\`. Operational meaning when writing:
  - \`untested-*\`: do not assert as established. "X has been argued" is fine; "X is shown" is not.
  - \`tested-attacked\`: under active challenge, no resolution. Hedge.
  - \`tested-undermined\`: an attack has succeeded against this argument's premise/inference and has not been answered. Do NOT cite as evidence for the conclusion. Cite as "this line of reasoning is currently undermined."
  - \`tested-survived\`: an attack was raised and answered. May cite as standing evidence — but check \`standingDepth\` first.

- **standingDepth** — \`{ tier: "thin" | "moderate" | "dense", challengerCount, reviewerCount }\`. A \`tested-survived\` at \`thin\` depth (1 challenger) is much weaker than at \`dense\` (≥5 distinct challengers AND ≥5 distinct reviewers). Always qualify standing claims by depth.

- **fitness** — A weighted sum (NOT a probability, NOT 0-1). Negative means inbound attacks outweigh supports. Components are in \`fitnessBreakdown\`. Inbound attacks are weighted by attacker standing — refuted attackers contribute ≈0, unanswered contribute full weight.

- **chain** — Editor-curated traversal of the graph from premises to a conclusion. \`chainStanding\` is the WORST-link standing in the chain (not average). \`weakestLink\` names the bottleneck argument. Many deliberations have zero chains (chains are editor-authored, not auto-derived); fall back to \`frontier\` + \`topArguments\` when \`chains.chains\` is empty.

- **refusalSurface** — \`{ cannotConcludeBecause: [{ conclusionClaimId, blockedBy, blockerIds, blockerSummaries }] }\`. Conclusions the graph cannot license. Hard constraints — output must not assert any listed conclusion. Use \`blockerSummaries\` (parallel-indexed to \`blockerIds\`) to name the obstacle in prose without a per-blocker round-trip.

- **honestyLine** — A deterministic single-sentence caveat keyed on \`contentHash\`. Include verbatim in any synthesis output.

### Ludics terms (Cluster 6 only)

- **locus** — A stable address inside a design, written like \`⊢A.1.2\`. The unit of dialectical engagement; LudicMoves live at loci.

- **design (D)** — A set of loci with a polarity discipline; one specific articulation of a position. Identified by a cuid. Carries a \`derivedBy\` provenance label.

- **derivedBy** — How a design was produced. ∈ {\`null\`, \`"join"\`, \`"meet"\`, \`"compression"\`, \`"extend"\`}. \`null\` (or any unrecognized sentinel value from legacy seed data) marks a **base incarnation**; the four named values mark designs produced by Art(B) operations.

- **behaviour (B)** — Set of designs orthogonal to a common counter-set; the "type" a design inhabits. Behaviours own the lattice Art(B).

- **incarnation** — A design that is a minimum element of its cone in Inc(B). Post-Phase 2e, Inc(B) is an antichain: every base incarnation is cone-minimal.

- **cone** — Equivalence-by-base-ancestor partition of a behaviour's designs. Each cone has exactly one base incarnation at its bottom; all derived designs (join/meet/compression/extend) live in the cone of their most specific base ancestor. **Joins and meets are partial** — they only exist within a single cone (\`cross-cone-rejected\` is a returned value, not an error).

- **biorthogonal class (~_⊥⊥)** — Equivalence under "tested by the same counter-designs." Multiple designs may articulate the same behaviour differently but share a biorthoClass. Use \`find_equivalent_articulations\` to enumerate them.

- **articulation lattice Art(B)** — The poset \`(Inc(B), ≤_⊆, ∨_⊥⊥)\` of incarnations ordered by locus-set inclusion, with the partial join.

- **LudicMove** — A move at a locus. Carries \`moveType\` ∈ {\`"positive"\`, \`"negative"\`, \`"daimon"\`} and a \`stratumLabel\` ∈ {\`"walked"\`, \`"witnessable"\`, \`"latent"\`}. \`daimon\` moves close a branch and require a \`schemeKey\` when witnessed.

- **DialogueMove** — A canonical dialogue act in the deliberation graph (kind ∈ ASSERT|WHY|GROUNDS|RETRACT|…). Becomes the \`dialogueMoveId\` parameter when binding; \`@unique\` on WitnessRecord, so each dialogue act may witness at most one LudicMove.

- **witness / WitnessRecord** — A binding of (LudicMove, DialogueMove, participantId, canonicalText). The iota seam: the ONLY way to instantiate a ludic move is through \`bind_participant_to_design\`. T4 invariant: \`participantId\` is stored but never returned in reads.

- **canonicalText** — Must equal \`JSON.stringify({ text: <NFC-normalized, whitespace-collapsed string> })\` — the output of the canonicalization pipeline. Pass straight from \`list_bindable_moves[].candidateDialogueMoves[].canonicalText\`; do not hand-construct.

- **delocation** — When a literal chronicle-set union would collide at a locus, one side must be relocated before the join can be taken. Surfaced as \`same-cone-delocation-required\` from \`compute_articulation_join\`.

- **fossilization** — Soft retraction of a WitnessRecord. \`fossilizedAt\` non-null + \`retractLayer\` ∈ {\`argument_superseded\`, \`locus_deleted\`, \`design_excised\`, \`manual_retract\`}. Fossilized witnesses are excluded from active reads but preserved for audit (\`get_fossil_record\`).

- **frontier** — Open dialectical edges: \`unansweredUndercuts\`, \`unansweredUndermines\`, \`unansweredCqs\`. Each carries a \`schemeTypical\` flag — true means the catalog expected this challenge and nobody raised it.

- **missingMoves** — Catalog-vs-actual diff. \`missingCqs\`, \`missingUndercutTypes\`, plus deliberation-level rollups (\`metaArgumentsAbsent\`, \`crossSchemeMediatorsAbsent\`).

- **writingConstraints** — Pre-computed compliance contract on every readout (added 2026-05). Read this BEFORE composing output:
  - \`mustInclude.honestyLine\` — drop verbatim into output.
  - \`mustInclude.refusalNotice\` — pre-rendered caveat sentence; non-null when refusalSurface is non-empty. Drop verbatim.
  - \`mustNotAssert[]\` — claims you may not assert as established; each entry has \`claimMoid\`, \`claimTextPreview\`, pre-rendered \`reason\`.
  - \`shouldHedge[]\` — arguments to qualify; each entry has a pre-rendered \`suggestedFraming\` you can splice into prose.
  - \`framing.stage\` ∈ {articulation | deliberation | matured} with \`advisoryNote\` you should adopt.

## Workflow recipes

### Recipe A — Synthesize the state of a debate

1. \`get_synthetic_readout(deliberationId)\`.
2. Read \`writingConstraints\`:
   - Insert \`mustInclude.honestyLine\` verbatim into your output.
   - If \`mustInclude.refusalNotice\` is non-null, include it.
   - Do not assert any claim listed in \`mustNotAssert\`.
   - For any argument referenced in \`shouldHedge\`, splice its \`suggestedFraming\` into the prose around it.
   - Adopt \`framing.advisoryNote\` for the overall framing.
3. For structure, walk \`chains[]\` in order — each has \`weakestLink\` and \`chainStanding\`. Frame each chain by what survives, not just what's claimed.
4. Use \`topArguments\` for load-bearing premises, \`mostContested\` for active disputes. Do NOT call \`get_argument\` per node — they're hydrated.
5. Stop. Do not invent a closer; localize uncertainty to specific claims.

### Recipe B — Explore "what's pushing back on claim X?"

1. From the readout (or \`get_claim\`), get the claim's MOID.
2. \`find_counterarguments(claim_moid, deliberation_id)\` — pass the deliberation id to scope to this debate. Omit it for cross-deliberation discovery (different question).
3. For each returned counterargument, check its \`standing\` and \`standingDepth\` before treating it as a real challenge. An \`untested-default\` counterargument is a registered objection, not a proven one.

### Recipe C — Walk a chain step by step

1. From the readout, pick a \`chains[i]\` by id.
2. The chain's \`edges[]\` is in topological order. Each edge has \`{ from, to, edgeType }\` where edgeType ∈ support/rebut/undercut/undermine.
3. The chain's nodes are hydrated with \`argumentText\`, \`standing\`, \`standingDepth\`. Walk in order; narrate each edge as "X supports Y" / "X undercuts Y's inference" / etc.
4. The \`weakestLink\` is the node where the chain's standing collapses — start diagnosis there.

### Recipe D — Help answer an open critical question

1. \`get_synthetic_readout\` → \`frontier.unansweredCqs[]\` lists open CQs by argument id and CQ key.
2. \`get_argument(argumentId)\` to fetch the full attestation (premises, conclusion, scheme, evidence).
3. The CQ key maps to the scheme catalog — its meaning is determined by the scheme, not by the argument. Treat the CQ as: "what would the literature require to answer this for THIS scheme on THIS argument?"
4. If composing a draft answer, structure it as a new argument that either supports the original (CQ-as-rebutted) or as an undercut of the original (CQ-as-conceded). Do not write CQ answers as free-form commentary.

### Recipe E — Record an argument (the WRITE path)

Use this whenever the user states a position, says "log this claim / save this argument / I want to register that X", drafts a thesis paragraph with reasons + sources, or asks you to capture your own synthesis as a durable artifact. Do not reply in prose when the user wants a record; create one.

**Pick the right write tool first:**
- If the user gave reasons, premises, or named a reasoning pattern (expert opinion, analogy, cause-to-effect, practical reasoning, sign, abductive, IBE) → \`propose_structured_argument\`.
- If the user has a one-line bare claim with no premises worth naming → \`propose_argument\`.
- If unsure, prefer the structured tool — a single inferred premise is fine, and the resulting card surfaces dialectical obligations the bare path hides.

#### E.1 — Bare assertion (\`propose_argument\`)

1. \`propose_argument({ claim, reasoning?, evidence?[], deliberationId? })\`:
   - \`claim\` (required, ≤2000 chars) — the conclusion sentence.
   - \`reasoning\` (optional, ≤5000 chars) — the inferential bridge between evidence and claim. Provide it; arguments without reasoning have minimum fitness.
   - \`evidence\` (optional, up to 10) — each \`{ url, title?, quote? }\`. Quotes get provenance-enriched in the background. Resolve DOIs / arXiv IDs via \`resolve_citation\` first.
   - \`deliberationId\` (optional) — omit to land in the user's "My Arguments" room.
2. The response gives \`{ argumentId, claimId, permalink, immutableUrl }\`. The immutable URL is content-addressed.
3. **Verify the round-trip** by calling \`get_argument(argumentId)\` (after \`retryAfterMs\` if \`provenancePending\` is true). Report back the immutable URL, the resulting \`standing\` (will be \`untested-default\` until challenged), and the \`fitness\`.

#### E.2 — Structured argument (\`propose_structured_argument\`)

1. (Optional) \`list_schemes\` to browse the catalog if you don't know which scheme matches the user's reasoning. Filter by \`clusterTag\` (\`expert\` | \`causal\` | \`practical\` | \`analogical\` | …) to narrow.
2. (Optional) \`resolve_citation\` for any DOI / arXiv id / publisher URL the user gave — the resolved canonical URL goes into \`evidence[].url\`.
3. \`propose_structured_argument({ conclusion, premises[], reasoning?, schemeKey?, ruleType?, evidence?[], deliberationId? })\`:
   - \`conclusion\` (required) — the sentence the argument supports.
   - \`premises[]\` (required, 1–10) — each \`{ text, isAxiom?, evidence?[] }\`. Each premise is committed as its own Claim row, so attackers can later undermine specific premises rather than the whole argument. **Per-premise evidence (recommended):** when each premise has its own distinct source (e.g. a multi-source policy argument), attach it via \`premises[i].evidence[]\` (≤ 5 per premise). The evidence lands on that premise's minted Claim row, so per-source provenance maps onto per-premise standing rather than being collapsed onto the conclusion.
   - \`reasoning\` (optional) — narrative gloss tying premises to conclusion; stored on \`Argument.text\`.
   - \`schemeKey\` (optional) — from \`list_schemes\`. Omit and the server infers one (response includes a \`scheme_inferred\` warning).
   - \`evidence[]\` (optional, up to 10) — top-level evidence attaches to the **conclusion** claim. Use this only for sources that back the overall argument rather than one specific premise; otherwise prefer per-premise \`premises[i].evidence[]\`.
   - \`deliberationId\` (optional) — omit for "My Arguments".
4. The response gives \`{ argument, claim, premises[], schemeInstance, warnings[], permalink, embedCodes, provenancePending, retryAfterMs }\`. **Read \`warnings[]\`** — \`scheme_inferred\` means the server picked the scheme (announce that to the user), \`missing_slot\` lists scheme-required slots not yet bound (mention as "v1.2 will let you bind the \`expert\` slot explicitly"), \`premise_deduped\` means duplicate-text premises collapsed into one Claim, \`premise_evidence_merged\` means a deduped premise's evidence was merged into the surviving claim (so no source is lost).
5. **Verify the round-trip** with \`get_argument(argumentId)\` (after \`retryAfterMs\` if \`provenancePending: true\`). The result should show all premises in the "Premises" section (no "bare assertion" warning), the assigned scheme, and any critical questions.
6. Do not invent ids, permalinks, or hashes — only echo values the write tool returned.

Sibling write tool — \`propose_warrant\` — attaches an inference-license warrant to an existing argument inside an ECC-typed deliberation. Use it when the user says "add a warrant" / "license this inference" against a specific argument id, not for freestanding claims.

### Recipe F — Explore a deliberation's Ludics layer

Use when the user mentions locus, design, behaviour, incarnation, cone, articulation lattice, or asks how a position is "structurally articulated".

1. \`get_deliberation_schema(deliberationId)\` — confirms a Ludics layer exists and surfaces the design tree + witnessing coverage. If \`designCount === 0\` the deliberation has not been Ludics-lifted; stop and tell the user.
2. Pick a behaviour from the schema's design tree (each Design carries a \`behaviourId\`). For a specific position the user named, use \`get_behaviour_at_locus(deliberationId, locus)\` instead to find the behaviour from the locus.
3. \`get_articulation_lattice(behaviourId)\` — returns \`{ incarnations[], cones[], edges[] }\`. Each incarnation has a \`coneId\`; \`cones[]\` lists per-cone minima (\`bottomIncarnationDesignId\`). Inc(B) is an antichain, so "the minimum" is per-cone, never global — narrate accordingly.
4. \`find_minimal_incarnations(behaviourId)\` if all the user wants is the antichain of bottoms (cheaper than the full lattice).
5. For "what else articulates the same testing-behaviour as design D?" use \`find_equivalent_articulations(designId)\`. For "can the position survive without premise P?" use \`find_substitute_premises\`.
6. Compose results by cone — never mix designs from different cones into a single "reduction" narrative. Cross-cone results from \`compress_articulation\` or \`compute_articulation_join\` are partial (\`cross-cone-rejected\` is a value, not an error); surface that explicitly to the user.

### Recipe G — Bind a participant to a chosen incarnation

Use when the user says "bind me to design X", "commit to the minimal incarnation", "witness the join", "record my position at locus Y". This is a WRITE workflow — it produces a WitnessRecord.

1. **Pick the target design.** Either:
   - \`find_minimal_incarnations(behaviourId)\` → pick the smallest / largest / user-chosen incarnation; OR
   - \`get_articulation_lattice(behaviourId)\` → pick by coneId / inclusion structure.
2. \`list_bindable_moves(deliberationId, { designId })\` → returns LudicMoves on that design with \`{ ludicMoveId, locus, moveType, witnessed, candidateDialogueMoves[] }\`. Each candidate carries a ready-to-submit \`{ dialogueMoveId, canonicalText, locusAlignedExactly }\` triple. Default scope excludes already-witnessed moves; pass \`includeWitnessed: true\` to inspect them.
3. Choose a row where \`witnessed === false\` and at least one \`candidateDialogueMoves[i].locusAlignedExactly === true\`. If none exists, tell the user no aligned dialogue act is available and stop — do not invent one.
4. \`bind_participant_to_design({ deliberationId, ludicMoveId, dialogueMoveId, canonicalText, participantId, schemeKey? })\` using the chosen triple. \`canonicalText\` MUST be the value from \`candidateDialogueMoves[i].canonicalText\` — do not re-canonicalize on the client. \`schemeKey\` is required when \`moveType === "daimon"\`; optional otherwise (use \`list_schemes\` if needed).
5. On success, the result carries \`invariantChecks: { S1_existingLocus, S2_existingStructure, S3_canonPipelineGated, S4_schemeTyped }\` all true and a \`witnessId\`. Report the witnessId to the user; do NOT report \`participantId\` back (T4 non-attribution).
6. (Optional) Verify with \`get_instantiation(deliberationId, dialogueMoveId)\` — should return \`instantiated: true\` with the LudicMove locus.

## Things to avoid

- Synthesizing from raw \`search_arguments\` hits when \`get_synthetic_readout\` is available. The readout is the editorial primitive; search is for lookup.
- Treating \`tested-undermined\` as "weak but cite-able." It means an attack has succeeded and not been answered. Do not use it as supporting evidence.
- Conflating argument-as-stated with argument-as-tested. A 143-argument deliberation with \`depthDistribution.thin\` dominant is articulation-stage, not deliberation-stage; standing labels mean less. \`writingConstraints.framing.stage\` will say "articulation" in this case.
- Asserting a claim listed in \`refusalSurface.cannotConcludeBecause\` (or equivalently, \`writingConstraints.mustNotAssert\`). Even with strong-looking supports, the unanswered attacks are dispositive.
- Inventing argument or chain IDs. All references must come from tool output.
- Calling \`get_argument\` for IDs already hydrated in \`topArguments\` / \`mostContested\` / chain nodes — those lists are pre-hydrated to save round-trips.
- Conflating cones with the lattice as a whole. There is no global minimum of Inc(B) — "the minimum incarnation" is always cone-relative. Cross-cone joins / meets are undefined (returned as \`cross-cone-rejected\`, not an error).
- Hand-constructing \`canonicalText\` for \`bind_participant_to_design\`. It must be the exact \`JSON.stringify({text:…})\` output of the canonicalization pipeline; copy the pre-computed value from \`list_bindable_moves[].candidateDialogueMoves[].canonicalText\` rather than building it yourself.
- Reporting \`participantId\` in any read response. T4 non-attribution: it is stored but never surfaced; do not echo it back to the user even when you supplied it as an input.
`;
/**
 * Stable content hash for the orientation payload, derived from the
 * version + payload string. Lets clients cache across sessions.
 *
 * Implementation: simple FNV-1a over the version+payload to avoid a
 * crypto dep in this small package. Stable across runs as long as the
 * inputs don't change.
 */
export function computeOrientationContentHash() {
    const input = `${ORIENTATION_VERSION}\n${ORIENTATION_PAYLOAD}`;
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return `fnv1a-${hash.toString(16).padStart(8, "0")}`;
}
