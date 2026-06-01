# MCP tool surface ↔ rigorous scheme ontology — design note

**Status:** design note (substrate prerequisites now largely shipped; ready for
roadmap promotion). Surfaces alignment work between the MCP tool surface in
[packages/isonomia-mcp/src/server.ts](../../packages/isonomia-mcp/src/server.ts)
and the scheme-ontology programme summarised in
[FROM_FOLKSONOMY_TO_ONTOLOGY_SCHEMES.md](FROM_FOLKSONOMY_TO_ONTOLOGY_SCHEMES.md).
Per-tool proposals here are promoted to the implementation roadmap once their
substrate prerequisite is green in the capability ledger (§1.5).

**Reconciliation note (2026-05-31).** This file was first drafted while Specs 2–5
were in flight, so much of the original prose is future-tense ("as WF1–WF3 flip
to error", "the `aif` format *will* start carrying `mesh:behaviourFingerprint`").
The substrate has since shipped: the behaviour-equality verifier, the
materialised `ArgumentScheme.fingerprint` column, the AIF round-trip with
`mesh:behaviourFingerprint`, the non-redundancy panel, AIF version-pinning
(Q-023), the Carneades `premiseType` column, Q-022 provenance + Q-024 timestamps,
and the Phase 4d catalogue-redundancy audit. §1.5 is the authoritative ledger;
where §2/§3 prose still reads future-tense, the ledger overrides it.

**Orientation:**

- Today's tool surface: [packages/isonomia-mcp/src/server.ts](../../packages/isonomia-mcp/src/server.ts) (≈ 47 tools across 6 clusters: session / retrieval / write / synthesis / ECC / Ludics).
- Today's overview-doc framing of "the citation primitive": [docs/isonomia-overview-general.md](../../docs/isonomia-overview-general.md) §I–§III.
- Today's demo page tracking what's shipped: [app/test/ai-epistemic/page.tsx](../../app/test/ai-epistemic/page.tsx) (pillars + tracks A–H).
- Ontology programme: [SCHEMES_THEORETICAL_FOUNDATIONS.md](SCHEMES_THEORETICAL_FOUNDATIONS.md), [SCHEMES_ONTOLOGY_DECISION.md](SCHEMES_ONTOLOGY_DECISION.md), [SCHEMES_IMPL_OVERVIEW.md](SCHEMES_IMPL_OVERVIEW.md), Specs 2–5, [T003](../../RESEARCH_PROGRAMME/02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md), and the Q-018 / Q-020 audits under [audits/](../../audits/).
- Closed-loop checklist this design note tracks against: [FROM_FOLKSONOMY_TO_ONTOLOGY_SCHEMES.md](FROM_FOLKSONOMY_TO_ONTOLOGY_SCHEMES.md).
- Write-tool roadmap this note feeds: [docs/MCP_STRUCTURED_ARGUMENT_ROADMAP.md](../../docs/MCP_STRUCTURED_ARGUMENT_ROADMAP.md).

---

## §1 What the MCP surface is *for* under the new ontology

A reframe before listing gaps. Today's tool descriptions treat the scheme as **a string the LLM picks from a catalogue**. Under the layered ontology (T003: scheme `S = ⟨⟦S⟧, 𝒮_S, π_S⟩` fibred over `CQ(S)`) the scheme is **a behaviour-fibre with an obligation bundle**, and `ArgumentScheme.key` is just a *presentation handle* into that fibre. The MCP surface therefore has four jobs:

1. **Let agents discover the catalogue at its current ontological resolution** (cluster + behaviour-fingerprint + premise typology + epistemic mode), not just by key.
2. **Let agents commit to a scheme at write-time** in a way that is *checkable* against the substrate's WF1/WF2/WF3 rules and the verifier's `equal / subset / incomparable / inconclusive` predicate.
3. **Let agents read back the consequences** of that commitment — open CQs, premise types, soundness gate status on `SchemeInstance`, fingerprint hits, soundness-relevant round-trip warnings.
4. **Refuse honestly** when the catalogue is still folksonomic in the area the agent is touching (duplicate-candidate cluster, missing clusterTag, deprecated key, retired-by-Shape-A migration).

The current surface does #1 partially, #2 implicitly, #3 partially, and #4 not at all.

### §1.4 The architectural seam: scheme-definition writes vs argument writes

A distinction the original draft blurred, and the most important one for getting
the roadmap right. There are **two** write boundaries, and they gate on different
invariants:

1. **Scheme-definition writes** — creating or editing an `ArgumentScheme` row.
   Surface: admin `SchemeCreator` → `POST /api/schemes`, `PUT /api/schemes/[id]`.
   Gated by: **WF1/WF2/WF3** (Spec 2 well-formedness), the non-redundancy
   panel (Spec 4 phase 4b), and the materialised-fingerprint partial-unique
   index. These are **already error-level** ([app/api/schemes/[id]/route.ts](../../app/api/schemes/[id]/route.ts)
   returns `400` with `violations` on WF failure). No MCP tool currently writes
   schemes, and none should without an explicit, separately-specced surface.

2. **Argument writes** — creating an `Argument` that *references* an existing
   scheme by key. Surface: MCP `propose_structured_argument` →
   `POST /api/arguments/quick-structured`. This is the boundary the MCP surface
   actually touches. It does **not** validate scheme *definitions* (the scheme
   already exists and already passed WF); it must instead validate **scheme
   selection** — that the chosen `schemeKey` names a healthy *argument-pattern*
   row (`kind='argument-scheme'`, not a dialogue-meta entry, not a test
   placeholder, not a duplicate-candidate) and that the resulting
   `ArgumentSchemeInstance` will be in a coherent play-time state.

Conflating these leads to the wrong gate. WF1–WF3 are **not** the MCP write
tool's concern — they already fired upstream when the scheme was authored. The
MCP write tool's concern is **scheme-health selection** + **per-instance
soundness state**. Sections §2 and §3 below should be read with this seam in
mind: "reject unhealthy `schemeKey`" is a *selection* check, not a re-run of WF.

### §1.5 Substrate capability ledger (as of 2026-05-31)

Every MCP proposal in this note depends on a substrate capability. This ledger
pins each to a concrete shipped artifact or marks it pending, so the
implementation roadmap (§ to follow) can be derived mechanically: an MCP item is
**buildable now** iff its prerequisite row is ✅.

| Capability | Status | Artifact / prerequisite |
|---|---|---|
| Behaviour-equality verifier (`equal/subset/incomparable/inconclusive`) | ✅ shipped | [lib/schemes/verifier](../../lib/schemes/verifier) — `verifyBehaviourEquality` |
| Pure behaviour fingerprint (incl. `epistemicMode`, Q-020) | ✅ shipped | `lib/schemes/verifier/computeFingerprint.ts` — `computeBehaviourFingerprint` |
| Materialised `fingerprint` column + partial-unique index | ✅ shipped | `ArgumentScheme.fingerprint`; `scripts/migrations/04-phase2-fingerprint-materialize.ts` |
| Fingerprint→scheme resolution (O(1) candidate lookup) | ✅ shipped | [lib/aif/behaviourFingerprint.ts](../../lib/aif/behaviourFingerprint.ts) — `resolveSchemeByFingerprint` |
| Conservative import resolution (attach-on-equal / mint-otherwise) | ✅ shipped | `lib/aif/behaviourFingerprint.ts` — `decideImportResolution` |
| Non-redundancy candidate selection + admin panel | ✅ shipped | `lib/schemes/verifier/selectCandidates.ts`; `components/admin/SchemeNonRedundancyPanel.tsx`; `app/api/schemes/non-redundancy-check/route.ts` |
| `nonRedundancyJustification` override audit trail | ✅ shipped | `ArgumentScheme.nonRedundancyJustification` |
| AIF `mesh:behaviourFingerprint` export + import round-trip | ✅ shipped | `lib/aif/jsonld.ts`, `lib/aif/graphBuilder.ts`, `packages/aif-core/src/import.ts` |
| AIF version pin (Q-023) + stamp validator | ✅ shipped | `lib/aif/version.ts` — `checkAifVersionStamp` |
| Catalogue-redundancy audit (Phase 4d; baseline 0 equal / 0 subset) | ✅ shipped | `scripts/audits/audit-catalogue-redundancy.ts`; `audits/catalogue-redundancy-20260531.md` |
| WF1/WF2/WF3 error-level on scheme-definition writes | ✅ shipped | `lib/schemes/validation` — `validateSchemePresentation`; enforced in `app/api/schemes/[id]/route.ts` |
| Carneades `premiseType` on CQ | ✅ shipped (column) | `CriticalQuestion.premiseType` (`ordinary/assumption/exception`) |
| Q-022 per-scheme provenance | ✅ shipped (columns) | `ArgumentScheme.{sourceCatalogue,sourceId,sourceVersion,importedAt,importerVersion}` |
| Q-024 chronological auditing | ✅ shipped (columns) | `ArgumentScheme.{createdAt,updatedAt,createdBy}` |
| `kind` discriminator (argument-scheme vs dialogue-meta) | ✅ shipped | `ArgumentScheme.kind` |
| Q-018 rigidity classification | ⏳ audit-only | `audits/q018-ontoclean-20260528.json` exists; **not** a queryable column |
| `catalogueHealth` flags (`isDeprecated/duplicateOf/canonicalKey/isTestPlaceholder`) | ⏳ pending | derivable from `kind` + key-naming + fingerprint collisions; **no** dedicated columns yet |
| Spec 3 close-hook → `SchemeInstance.status` transitions exposed via API | ⏳ partial | close-gate logic shipped; **no** read endpoint projecting `openObligations` to MCP |
| Wagemans PTA `subjectType` (Q-026) | ⏳ undecided | Phase 6 open question; column not added |

**Reading the ledger.** Everything an MCP write/read tool needs to consult the
*verifier* and *fingerprint* — the core honesty machinery — is ✅. The gaps are
(a) a queryable **catalogue-health projection** (today the signals exist as an
audit JSON + derivable heuristics, not a column or endpoint), and (b) a
**`SchemeInstance` state read API**. Those two are the critical-path substrate
work the MCP roadmap must either depend on or carry.

---

## §2 Per-tool diagnostic (existing tools)

Each row: current shape → ontology gap → proposed change. Severity rough: ⚠ = breaks honesty, ◇ = enrichment.

### `list_schemes` (read primer)

- **Today:** returns key / name / summary / whenToUse / slotHints / materialRelation / reasoningType / epistemicMode / clusterTag / difficulty / tags / `ownCQCount` / `totalCQCount`. Optional `clusterTag` filter (free string).
- **Gap ⚠ (Q-018 §3.2–§3.4):** the catalogue still ships test placeholders (`scheme_test`, `test_scheme`), dialogue-meta entries (`bare_assertion`, `claim_*`), 3 duplicate-candidate pairs, and 9/31 schemes without a `clusterTag`. The current `list_schemes` exposes all of these uniformly. An agent that picks `expert-opinion` instead of `expert_opinion` gets no signal that it picked the duplicate.
- **Gap ⚠ (Q-019 closed):** `inheritCQs` field is still in scope. After Shape A retires it, the projection needs updating; meanwhile its semantics in the response are misleading (audit returned 0 rows so it's load-bearing for nothing).
- **Gap ◇ (Q-020):** no fingerprint exposed; agents cannot tell whether two schemes are behaviourally equivalent without a separate verifier call.
- **Gap ◇ (Q-018 §1):** no rigidity / identity / unity / dependence projection. (Probably not all four are useful at the MCP layer, but `rigidity` is — it tells the agent whether the scheme is anti-rigid in a way that changes CQ defaults.)
- **Proposed:**
  - Add `catalogueHealth: { isDeprecated, deprecationReason, canonicalKey, duplicateOf, isTestPlaceholder, isDialogueMeta, clusterTagMissing }` per row. Field-default `false`; set per the audit signals (initially hand-curated; later populated by the [Q-018 classifier output](../../audits/q018-ontoclean-20260528.json)).
  - Add `behaviourFingerprint` (Spec 4 §4.3) — now a **materialised column** (`ArgumentScheme.fingerprint`, [04-phase2-fingerprint-materialize.ts](../../scripts/migrations/04-phase2-fingerprint-materialize.ts)), so it is returned directly rather than computed on demand. Two schemes with the same fingerprint do **not** count as equal at this layer (P3 / Q-021 foreclose canonical-form route); the field is for agent triage only and must be labelled `"necessary-but-not-sufficient pre-filter"` in the description. The canonical pre-filter-then-verify discipline is already implemented in [decideImportResolution](../../lib/aif/behaviourFingerprint.ts) — MCP tools should describe it identically.
  - Add `rigidity` from the Q-018 classifier output (`rigid | non-rigid | anti-rigid`).
  - Add `parentSchemeKey` / `inheritsCQsFromParent` / `inheritedCQs[]` (currently expressed only as a count). A write-side agent should see *which* CQs it'll be on the hook for.
  - Add a top-level `catalogueOntologyState: "folksonomy-in-practice" | "transitional" | "ontology-in-practice"` enum keyed to phase exits in [FROM_FOLKSONOMY_TO_ONTOLOGY_SCHEMES.md](FROM_FOLKSONOMY_TO_ONTOLOGY_SCHEMES.md). Lets agents adjust their refusal behaviour.
  - Optional new param `excludeUnhealthy: boolean` (default `true` after Phase 0 of the checklist completes; `false` until then so existing behaviour doesn't regress).

### `propose_structured_argument` (write)

- **Today:** `schemeKey?: string`; if omitted server infers and returns `scheme_inferred` warning. `missing_slot` warning is non-fatal.
- **Not a gap here (see §1.4):** WF1–WF3 are now error-level, but they gate **scheme-definition** writes ([app/api/schemes/[id]/route.ts](../../app/api/schemes/[id]/route.ts)), which this tool does not perform. This tool selects an *existing* scheme and writes an argument; its real obligation is **scheme-health selection**, not re-running WF. (The original future-tense "as WF1–WF3 flip to error this tool will start hard-failing" was a category error and is retired.)
- **Gap ⚠ (Q-018 §3.2–§3.3 and the SchemeInstance verdict):** `schemeKey` accepts dialogue-meta entries and test placeholders today. An LLM proposing an argument with `schemeKey: "claim_clarity"` would land an `ArgumentSchemeInstance` row that is structurally legitimate but ontologically nonsense.
- **Gap ⚠ (Spec 3 §3.1 verdict — SchemeInstance is the play-time anchor):** no per-premise `premiseType` (Carneades). The CQ obligation bundle that the close-hook gates on is invisible at write-time. Agents cannot deliberately mark a premise as `assumption` vs `ordinary` vs `exception`. **Substrate ready:** the `CriticalQuestion.premiseType` column (`ordinary/assumption/exception`) already ships; only the write-tool param + plumbing remain.
- **Gap ◇ (Spec 4 verifier):** the write does not consult `verifyBehaviourEquality` against same-fingerprint candidates. An agent can mint a duplicate scheme-instance without any signal. **Substrate ready:** [resolveSchemeByFingerprint](../../lib/aif/behaviourFingerprint.ts) (O(1) candidate lookup via the partial-unique index) + `decideImportResolution` already implement the exact attach-on-`equal` / mint-otherwise posture; the write tool should call the same path. Note this tool mints *argument instances*, not schemes, so "attach" means *reuse the existing scheme key*, not silently merge two catalogue rows.
- **Gap ◇ (Q-022 provenance):** no `schemeProvenance: { sourceCatalogue, sourceId, sourceVersion }` field. **Substrate ready:** the `ArgumentScheme.{sourceCatalogue,sourceId,sourceVersion,importedAt,importerVersion}` columns already ship; the write tool can record/echo provenance now.
- **Gap ◇ (Q-020 fingerprint widening):** `epistemicMode` is currently inferred or defaulted — agents cannot set it explicitly even though it now participates in the fingerprint domain.
- **Proposed:**
  - Reject `schemeKey` values flagged `isTestPlaceholder` or `isDialogueMeta` with a typed error code `SCHEME_NOT_ARGUMENT_PATTERN` (and a pointer to `list_schemes(excludeUnhealthy: true)`).
  - When `schemeKey` is flagged `duplicateOf`, **auto-redirect to the canonical key** and return a `scheme_canonicalized` warning with the original key preserved for audit.
  - Accept `premises[i].premiseType: "ordinary" | "assumption" | "exception"` per Carneades (Spec 3 phase 3d). Default `ordinary`. Defaults documented per scheme via the response from `list_schemes`.
  - Accept `epistemicMode: "factual" | "hypothetical" | "counterfactual"` at the top level. Default copied from the scheme's catalogue value.
  - Return `schemeInstance: { id, status, openObligations: CQ[], closeHookGate: "open" | "closed" }` so the agent can reason about whether its instance is "in play".
  - Return `verifierVerdict: "equal" | "subset" | "incomparable" | "inconclusive" | "skipped"` against same-fingerprint candidates. `"skipped"` when fingerprint catalogue is empty in this cluster.
  - Add typed warning codes: `wf1_violated`, `wf2_cluster_mismatch`, `wf3_inherit_cqs_misuse`, `scheme_canonicalized`, `epistemic_mode_changed_fingerprint`.
  - Accept and echo `schemeProvenance: { sourceCatalogue, sourceId, sourceVersion }` (columns already present; for argument writes this is read-back of the referenced scheme's provenance, not a new write).

### `get_argument` (read)

- **Today:** attestation envelope includes `scheme: { key, name }`, `criticalQuestions[]`, `dialecticalStatus`, `provenance.unattestedPremises`, optional `format: jsonld | aif`.
- **Gap ⚠ (Spec 3):** `criticalQuestions[].status` is exposed but the obligation typology isn't (`scheme-required` vs `optional`, `premiseType` per CQ, `attackKind`).
- **Gap ⚠ (Spec 4 phase 4c — round-trip, now shipped):** the `aif` format **now carries** `mesh:behaviourFingerprint` ([lib/aif/jsonld.ts](../../lib/aif/jsonld.ts)) and the soundness predicate is `≡_substrate-relevant`; the import side re-resolves it ([packages/aif-core/src/import.ts](../../packages/aif-core/src/import.ts)). The remaining gap is narrower: the response still gives the consumer no machine-readable handle on which fields are `exposed` vs `representable-but-absent` per the Q-020 classification.
- **Gap ⚠ (Q-018 duplicate signals):** if the argument's scheme is a duplicate-candidate, the consumer sees no signal that the *categorisation* is contested.
- **Proposed:**
  - Add `scheme: { key, name, canonicalKey?, catalogueHealth, behaviourFingerprint, rigidity }`.
  - Add `criticalQuestions[].premiseType`, `.attackKind`, `.isSchemeRequired`, `.inheritedFromParentScheme`.
  - Add `schemeInstance: { id, status, openObligations, lastTransitionAt, transitionBy }` mirroring the write tool's return shape.
  - In `format: "aif"`: emit fingerprint per Spec 4 §3.5 (already widened to include `epistemicMode`); add a `mesh:roundTripSoundness: "lossless-by-construction" | "lossless-by-convention" | "lossy"` annotation per field group, surfacing the §4 classification.

### `find_counterarguments` + `search_arguments`

- **Today:** ranking is `recent` or `dialectical_fitness`; `scheme: string` filter. `tested_only` flag exists.
- **Gap ⚠:** filter takes any string; a typo silently returns empty. Should validate against `list_schemes()` and return a typed error.
- **Gap ◇ (Spec 4 verifier):** no `behaviourFingerprintMatch` ranking mode. A counter-argument that uses a behaviourally-equivalent scheme to the target's scheme is structurally interesting (same machinery aimed in opposite directions) and currently invisible. **Substrate ready:** with `fingerprint` materialised on every scheme row, a same-fingerprint join is now a cheap indexed lookup rather than a per-query sweep.
- **Gap ◇ (Q-018 §3.1):** `scheme` filter applied to a duplicate-candidate key silently splits results. Should at minimum warn `duplicate_candidate_in_filter` and offer the canonical key.
- **Proposed:**
  - Validate `scheme` against `list_schemes(excludeUnhealthy: true)`; return `SCHEME_UNKNOWN` or `SCHEME_UNHEALTHY` with the canonical alternative.
  - Add `sort: "behaviour_fingerprint_resonance"` mode (post-Phase 2 of the checklist).
  - Add `excludeSchemeHealth: ["test-placeholder", "dialogue-meta", "duplicate-candidate"]` filter, default `["test-placeholder", "dialogue-meta"]`.

### `cite_argument`

- **Today:** returns markdown / APA / MLA / Chicago / BibTeX / RIS / CSL with optional `strongestObjection`.
- **Gap ⚠ (Spec 4):** citations today don't include a *scheme-health* line. A reader who follows a citation to a duplicate-candidate scheme has no signal that the categorisation is contested.
- **Gap ◇:** no `criticalQuestionsOpen` summary in plain-text formats; the dialectical-status block is in markdown but not in APA/MLA.
- **Proposed:**
  - Add a `schemeHealthFootnote: boolean` (default `true`) that appends a single-line "Categorised under scheme `X` (clusterTag: `Y`; behaviour-fingerprint: `Z…`; verifier-verdict against catalogue: `incomparable`)" to the citation.
  - Add `includeCriticalQuestions: "open" | "all" | "none"` (default `open`).

### `get_missing_moves`

- **Today:** "scheme-typical absences".
- **Gap ⚠ (Spec 2 WF1):** "scheme-typical" today means "CQs the scheme catalogue lists for this scheme key". Under the new ontology this is "CQs in the obligation bundle `CQ(S)` that haven't been discharged on the `SchemeInstance`". Subtle but materially different — a scheme that inherits from a parent should surface inherited CQs that the parent's CQ-of-CQ recursion makes load-bearing.
- **Proposed:** rename the response field `missingMoves` to `openObligations`; group by `{ ownCQ, inheritedCQ, cqOfCq }`; per-row `premiseType` and `attackKind`.

### `bind_participant_to_design` (Ludics write seam)

- **Today:** `schemeKey` required for `moveType==='daimon'`; validated against the catalogue (S4).
- **Gap ⚠ (Spec 3):** Ludics daimon binding lands on the `SchemeInstance` that the close-hook gates on. After Spec 3 ships, this tool needs to know whether the bind is creating a new `SchemeInstance` or attaching to an existing one, and whether the bind transitions `status: open → closed`.
- **Proposed:** add `schemeInstanceMode: "create" | "attach" | "auto"` (default `auto`); add `transitionTo: "open" | "closed" | "no-change"` to the response; emit `S4_SCHEME_UNHEALTHY` when the supplied `schemeKey` fails the same health check as `propose_structured_argument`.

### ECC tools (`ecc_*`)

- **Today:** typed-algebra reads against `Hom(I, claim)`; deterministic; no scheme-shape dependence.
- **Gap ◇ (T003 §): the layered coherence theorem makes `𝓑(𝒮_S) = ⟦S⟧` an explicit invariant. The ECC layer projects evidence onto claims; with the scheme ontology surfaced it can also project onto *scheme-instances* and ask: "is the evidence-arrow for this claim consistent with the obligation bundle of the scheme instance that introduced the claim?"
- **Proposed:** new derived tool `ecc_scheme_instance_consistency(deliberationId, schemeInstanceId, mode)` returning `{ obligationsDischarged, evidenceBackingPerObligation, consistencyVerdict }`. Lightweight (composes existing tools). Land after Phase 4 of the checklist.

---

## §3 New tools the ontology unlocks

Each new tool corresponds to a phase of [FROM_FOLKSONOMY_TO_ONTOLOGY_SCHEMES.md](FROM_FOLKSONOMY_TO_ONTOLOGY_SCHEMES.md). None should ship before its phase exits, otherwise the tool returns nonsense. Per-header status (✅ substrate ready / ⏳ substrate gap) is keyed to §1.5.

### Phase-0 dependent — ⏳ substrate gap (no `catalogueHealth` projection yet)

- `get_catalogue_health()` — returns a single object summarising the most recent audit run (counts of unhealthy entries by category, audit file path, `catalogueOntologyState`). Cheap, cacheable, called by long-running agents to decide whether to refresh `list_schemes`.

### Phase-1 dependent (Q-022 / Q-024) — ✅ substrate ready (provenance + timestamp columns shipped)

- `get_scheme_provenance(schemeKey)` — returns `{ sourceCatalogue, sourceId, sourceVersion, importedAt, importerVersion, createdBy }`. Critical for "is this Mesh-authored or imported from WRM-2008?".
- `compare_scheme_provenance(keyA, keyB)` — returns `{ sameSource: bool, sourceDelta: …, behaviourFingerprintEqual: bool }`. The "are these the same scheme under two presentations?" diagnostic.

### Phase-2 dependent (Spec 4 verifier) — ✅ substrate ready (verifier + materialised fingerprint + `resolveSchemeByFingerprint` shipped)

- `verify_scheme_equality(keyA, keyB)` — direct exposure of `verifyBehaviourEquality`. Returns `{ verdict: "equal" | "subset" | "incomparable" | "inconclusive", witnessOrCounter, runtimeMs, fingerprintsMatched }`. Read-only; no write side-effects. Frames the result as "necessary-but-not-sufficient" up top, so consumers don't treat `inconclusive` as `incomparable`.
- `compute_scheme_fingerprint(schemeKey)` — pure-function exposure of `computeBehaviourFingerprint`. Useful for agents building their own scheme-similarity heuristics; documented as a pre-filter only.
- `find_behaviourally_similar_schemes(schemeKey, k=5)` — fingerprint-bucket then verifier-confirm. The structural-redundancy radar an agent would actually use before proposing a new scheme.

### Phase-3 dependent (Spec 2 WF1–WF3) — ✅ substrate ready (`validateSchemePresentation` shipped + error-level on admin write)

- `validate_scheme_proposal(draft: SchemeDraft)` — dry-run validator for *new* schemes (not arguments). Returns `{ wf1: pass | fail, wf2: pass | fail, wf3: pass | fail, errors[], warnings[] }`. Lets an agent test a draft before invoking a write tool. The validator core already exists ([validatePresentation.ts](../../lib/schemes/validation/validatePresentation.ts)); this is a thin read-only MCP wrapper around it. Only relevant if/when an MCP **scheme-definition** write surface is specced (§1.4) — today no MCP tool authors schemes.

### Phase-4 dependent (Spec 3 close-hook) — ⏳ partial (close-gate logic shipped; no `SchemeInstance` state read API)

- `get_scheme_instance_state(schemeInstanceId)` — returns `{ status, openObligations, dischargedObligations, lastTransitionAt, closeHookEligible }`.
- `discharge_obligation(schemeInstanceId, cqId, dischargingMoveId)` — write tool that records a CQ-discharge against a `SchemeInstance` and triggers the close-hook check. Returns the new status. Probably the most-used write tool agents will reach for under the new ontology.

### Phase-5 dependent (Spec 4 phase 4c) — ✅ substrate ready (AIF round-trip + `mesh:behaviourFingerprint` shipped)

- `aif_round_trip_check(argumentId | schemeId)` — exports → imports → diffs; returns the `≡_substrate-relevant` verdict per Spec 4 phase 4c. Honest about what changed between presentation copies.

### Phase-6 dependent (optional — only if Q-025 / Q-026 close in favour of adoption)

- `get_scheme_typology(schemeKey)` — returns the full Wagemans PTA placement + ASPIC+ classification + Carneades premiseType defaults. Probably not worth a dedicated tool unless an agent persona explicitly needs cross-typology placement.

### Phase-7 dependent (inter-rater)

- *(none — purely a methodological phase; doesn't change the tool surface.)*

---

## §3.5 Argument-chain creation as an ontology consumer

The current MCP write surface mints **single** structured arguments
(`propose_structured_argument`). The next write capability on the roadmap is
**chain creation** — composing multiple arguments where one argument's
conclusion feeds another's premise (and, eventually, scheme-net composition).
[docs/MCP_STRUCTURED_ARGUMENT_ROADMAP.md](../../docs/MCP_STRUCTURED_ARGUMENT_ROADMAP.md)
§6 currently lists "multi-argument chain construction", "argument-net / scheme-net
composition", and "premise reuse across arguments by claim id" as out-of-scope
for v1, gated behind a missing `mint_claim` / reusable-claim-id primitive
(roadmap decision #8). This section records how chain creation must consume the
scheme ontology, so the eventual chain-creation dev spec inherits the same
honesty guarantees as single-argument writes.

**Why chains are an ontology stress-test.** A chain multiplies every
single-argument concern across N links:

- **Claim reuse vs duplication.** Chains require a reusable claim id (`mint_claim`)
  so link *k*'s conclusion is *literally the same node* as link *k+1*'s premise.
  Without it, chains are fictions — two text-identical claims that the substrate
  treats as distinct. The reusable-claim primitive is the **blocking
  precondition**; it is a *claim*-layer dedup question, parallel to (but distinct
  from) the *scheme*-layer dedup that `decideImportResolution` already solves.
- **Per-link scheme health.** Every link selects a `schemeKey` and is subject to
  the §1.4 scheme-health gate. A chain is only as healthy as its weakest link:
  if any link references a dialogue-meta / test-placeholder / duplicate-candidate
  scheme the whole chain's `chainStanding` is compromised. This mirrors the
  existing `get_chains` worst-link `chainStanding` semantics (editor-curated,
  read-only today).
- **Author-time redundancy across links.** When two links in the same chain use
  behaviourally-equal schemes, that is a *signal* (possibly a circular or
  redundant inference), not necessarily an error. Chain creation should run the
  same pre-filter-then-verify discipline as
  [decideImportResolution](../../lib/aif/behaviourFingerprint.ts) — fingerprint
  bucket → `verifyBehaviourEquality` — but at the **link** granularity, surfacing
  `equal`/`subset` verdicts as advisory warnings rather than silently merging.
- **Obligation accumulation.** Each link's `SchemeInstance` carries its own CQ
  obligation bundle (Spec 3). A chain's aggregate open-obligation set is the
  union across links; the close-hook for the chain's terminal conclusion is only
  eligible once every link's obligations are discharged. This is the
  `get_scheme_instance_state` read API (§3 Phase-4) lifted to chain scope.

**Inherited posture (non-negotiable for the chain spec).** Chain creation must
adopt the **conservative, no-silent-merge** posture already shipped for scheme
import:

1. Reuse a claim id only on an **exact** match the author/agent explicitly
   selects — never auto-merge two distinct claims on textual similarity.
2. Reuse a scheme key only when it is **healthy** (§1.4) — never silently
   redirect a chain link to a "canonical" scheme without a `scheme_canonicalized`
   warning the agent can audit.
3. Route `inconclusive` verifier verdicts to a **warn-and-ship-with-flag** path,
   not a silent accept (this is MCP-Q-B at chain scope — see §6).

**Substrate readiness for chains.** Per §1.5: the *scheme*-layer machinery
(verifier, fingerprint, health-by-`kind`) is ✅ ready and reusable at link
granularity. The gaps chain creation must carry are (a) the `mint_claim` /
reusable-claim-id primitive (claim-layer dedup — **not** yet built), (b) a
`SchemeInstance` state read API to aggregate per-link obligations, and (c) a
catalogue-health projection so per-link health checks are a query, not an audit
re-run. The chain-creation dev spec is therefore best sequenced **after** the
single-argument MCP roadmap lands the health-selection gate on
`propose_structured_argument`, since chains reuse that gate verbatim.

> **Implemented as:** [CHAIN_CREATION_OVER_MCP_SPEC.md](CHAIN_CREATION_OVER_MCP_SPEC.md)
> (PART 3 dev spec). That spec reframes precondition (a): claim reuse **already**
> works via MOID content-hash dedup, so the `mint_claim` blocker is softer than
> stated here — the spec resolves it with *intra-chain claim threading* (reuse by
> id or by content hash, with a no-silent-fork guard) rather than a standalone
> orphan-claim primitive.

---

## §4 Cross-cutting concerns

### §4.1 Error-code discipline

Today the write tools mix warnings (`scheme_inferred`, `missing_slot`, `premise_deduped`) and unstructured errors. Under the new ontology there are at least eight new typed errors:

| Code | Cause | Phase introduced |
|---|---|---|
| `SCHEME_UNKNOWN` | Key not in `list_schemes` | 0 |
| `SCHEME_UNHEALTHY` | Test placeholder / dialogue-meta | 0 |
| `SCHEME_DEPRECATED` | Retired by Shape A migration | 3 |
| `SCHEME_CANONICALIZED` | Duplicate auto-redirected to canonical | 0–2 (initial hand-curation; verifier-confirmed by Phase 2) |
| `WF1_VIOLATED` | CQ-bundle consistency error | 3 |
| `WF2_CLUSTER_MISMATCH` | parent / child clusterTag disagreement | 3 |
| `WF3_INHERIT_CQS_MISUSE` | (vestigial after Q-019, may never fire) | 3 |
| `PREMISE_TYPE_INCONSISTENT` | premiseType conflicts with scheme default | 4 |

Suggest a top-level `error.code` enum + `error.canonical` field carrying the redirected key / fixed value where applicable, so agent retry logic is mechanical.

### §4.2 Tool descriptions as ontology surface

A subtle point: the *prose* in each tool's `description` field is the LLM's primary interface to the ontology. Today's descriptions encode the folksonomy framing ("`expert_opinion`, `practical_reasoning`, `cause_to_effect`" inline as examples). Once the catalogue's canonical keys stabilise (Phase 2 exit) the example lists in descriptions should be either:

1. removed in favour of "call `list_schemes` first" (forces agents to read the live catalogue), or
2. machine-generated from `list_schemes(canonical: true)` at server-build time so they cannot drift.

Option 2 is the more invasive change but it makes the tool descriptions an *attestation* of the catalogue's state, not a snapshot.

### §4.3 The `catalogueOntologyState` flag is the agent contract

Adding the `catalogueOntologyState` field to `list_schemes` (§2) creates a soft contract: as the catalogue moves from `folksonomy-in-practice` → `transitional` → `ontology-in-practice` an agent can:

- Refuse to propose new schemes while `folksonomy-in-practice` (recommend hand-curation).
- Accept duplicate warnings as advisory while `transitional`.
- Treat the verifier verdict as authoritative once `ontology-in-practice`.

This is the equivalent of the "[refusalSurface](../../app/test/ai-epistemic/page.tsx)" pattern already in play for the deliberation-scope readouts — refusing honestly when the substrate isn't ready.

### §4.4 Backwards compatibility

Phase 0 adds fields to existing tools; Phase 2+ adds new tools and **may** add new typed errors. The breaking-change window for the MCP surface is **not** the admin WF1–WF3 flip (that already shipped and gates only scheme-definition writes — §1.4); it is the moment `propose_structured_argument` starts **rejecting** unhealthy `schemeKey` selections that today only warn. Suggest pre-announcing via:

- A `mcp.deliberation/scheme-policy-changing` announcement (the bus already exists for Ludics events per [packages/isonomia-mcp/src/server.ts](../../packages/isonomia-mcp/src/server.ts) H.7).
- A `list_schemes()` response field `upcomingBreakingChanges: [{ date, change, mitigation }]` populated from this doc.

---

## §5 Hand-offs / candidate spec promotions

When the ideas in this design note stabilise, candidates for promotion. **All MCP-surface items below are now sequenced in [SCHEMES_MCP_ALIGNMENT_ROADMAP.md](SCHEMES_MCP_ALIGNMENT_ROADMAP.md)** (the implementation roadmap derived from §1.5); the table records where each *also* touches a substrate-side spec.

| Design-note item | Promote to |
|---|---|
| `list_schemes` health + fingerprint + rigidity projection | New phase of [SCHEMES_IMPL_ADMIN_TIGHTENING.md](SCHEMES_IMPL_ADMIN_TIGHTENING.md) (admin-side already governs the catalogue projection; MCP is just a consumer) |
| `propose_structured_argument` reject-unhealthy + Carneades `premiseType` | [SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md](SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md) phase 3d (premiseType rollout) extends to MCP |
| `verify_scheme_equality` MCP tool | [SCHEMES_IMPL_VERIFIER.md](SCHEMES_IMPL_VERIFIER.md) phase 4a (verifier endpoint already specified; MCP wrapper is a small additional task) |
| `get_scheme_provenance` MCP tool | Whatever spec lands [Q-022](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-022) (a new "Spec 6 — Provenance" or a phase added to an existing spec) |
| AIF round-trip soundness annotation | [SCHEMES_IMPL_VERIFIER.md](SCHEMES_IMPL_VERIFIER.md) phase 4c (already has `≡_substrate-relevant` in the soundness predicate; MCP just needs to surface it) |
| Tool-description machine-generation from `list_schemes` | New small spec; possibly an addendum to [SCHEMES_IMPL_OVERVIEW.md](SCHEMES_IMPL_OVERVIEW.md) §appendix |

---

## §6 Open questions surfaced by this design note

Candidates for the research-programme registry; opening these here rather than directly in [01_OPEN_QUESTIONS_REGISTRY.md](../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md) until they settle.

- **MCP-Q-A:** Should `propose_structured_argument` block on `WF1_VIOLATED` once WF1 is error-level, or downgrade to warning when called via MCP (on the theory that an LLM agent may have less context than a UI user)? Argues either way.
- **MCP-Q-B:** Where should `verifierVerdict: "inconclusive"` route? Today (single-argument writes): ship the argument and log. The Phase 4d catalogue-redundancy audit has now **shipped** with a clean baseline (0 equal / 0 subset across 24 schemes / 276 pairs — [audits/catalogue-redundancy-20260531.md](../../audits/catalogue-redundancy-20260531.md)), so the catalogue is currently un-polluted; the open question is the *write-time policy* that keeps it that way. Recommended resolution: route `inconclusive` (and `subset`/`equal` at link scope) to a **warn-and-ship-with-flag** path, persisting the verdict so the 4d audit can track drift. This becomes load-bearing at **chain** scope (§3.5), where a single chain multiplies the number of verdicts that could pollute the catalogue.
- **MCP-Q-C:** Does the "machine-generated tool descriptions" idea (§4.2) actually help LLM tool-selection, or does it degrade by removing the inline examples that current models lean on for few-shot pattern-matching? Empirical question; A/B-test-able.
- **MCP-Q-D:** Should the Ludics `bind_participant_to_design` write seam respect `catalogueOntologyState: "folksonomy-in-practice"` and refuse to bind to unhealthy schemes? Probably yes for `dialogue-meta` and `test-placeholder`; unclear for `duplicate-candidate`.
- **MCP-Q-E (chains):** When two links in one chain use behaviourally-`equal` schemes, is that a redundancy warning, a circularity signal, or benign repetition? Needs a worked taxonomy before the chain-creation spec (§3.5) can decide the warning surface.

---

## §7 Where this design note fits in the larger doc graph

```
RESEARCH_PROGRAMME/00_CHARTER.md
  ├─ 01_OPEN_QUESTIONS_REGISTRY.md (Q-018, Q-020 closed; Q-022..Q-026, MCP-Q-A..D open)
  └─ 02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md

Development and Ideation Documents/ARCHITECTURE/
  ├─ SCHEMES_THEORETICAL_FOUNDATIONS.md
  ├─ SCHEMES_ONTOLOGY_DECISION.md
  ├─ SCHEMES_IMPL_OVERVIEW.md
  ├─ SCHEMES_IMPL_ADMIN_TIGHTENING.md  (Spec 2 — WF1/WF2/WF3)
  ├─ SCHEMES_IMPL_AUDIT_PROTOCOLS.md   (Spec 5 — Q-018/Q-019/Q-020)
  ├─ SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md (Spec 3 — SchemeInstance close-hook)
  ├─ SCHEMES_IMPL_VERIFIER.md          (Spec 4 — verifier + fingerprint + AIF round-trip)
  ├─ FROM_FOLKSONOMY_TO_ONTOLOGY_SCHEMES.md  (the checklist)
  ├─ SCHEMES_MCP_TOOL_ALIGNMENT.md  ← (this file; design note)
  └─ SCHEMES_MCP_ALIGNMENT_ROADMAP.md  (implementation roadmap derived from §1.5)
```

This file is the consumer-side complement to Specs 2–5: the substrate-side specs say *what the catalogue commits to*; this design note says *what the MCP surface has to do so external agents respect those commitments*. With the substrate prerequisites in §1.5 now largely green, the next deliverable is an **implementation dev roadmap** that mechanically maps each ✅ ledger row to a concrete MCP surface change, followed by a **chain-creation dev spec** (§3.5) once the single-argument health-selection gate lands.
