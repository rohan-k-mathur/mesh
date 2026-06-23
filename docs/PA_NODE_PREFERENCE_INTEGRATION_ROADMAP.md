# PA Node (Preference Application) Integration Roadmap

**Status:** Planning · **Created:** 2026-06-14 · **Owner:** Rohan Mathur
**Scope:** AIF Preference Application (PA) nodes — `PreferenceScheme` / `PreferenceApplication`
**Related docs:** `AIF_ASPIC_MESH_MAPPING.md`, `AIF_ONTOLOGY_GUIDE.md`, overview §VII (foundations), §VIII (Pollock trichotomy + scheme-rivalry conjecture)

---

## 0. Purpose

PA nodes are the AIF construct that expresses a **preference between two elements** (claims, arguments, or schemes). In ASPIC+ a preference ordering is what turns a symmetric *attack* into an asymmetric *defeat*, and thereby determines grounded-extension membership (which arguments survive).

The overview (§VII) lists ASPIC+ grounded extensions and AIF as foundations that are *"fully implemented and operational."* **An audit (2026-06-14) found PA nodes are the exception:** the data model and the core algorithm are sound, but the wiring between stored preferences and live evaluation is broken, and preferences touch no part of the confidence/support scoring pipeline. This roadmap closes that gap.

This doc is the **plan**. Implementation is recorded in the Change Log (§7) as phases complete; a `PA_NODE_PREFERENCE_INTEGRATION_COMPLETE.md` summary is written when the roadmap is fully discharged.

---

## 1. Current State (Audit Summary — 2026-06-14)

Full method: three parallel read-only audits over data model, ASPIC+/AIF evaluation, and scoring consumption.

### ✅ Sound
- **Data model** — `PreferenceScheme` + `PreferenceApplication` ([lib/models/schema.prisma:3030-3079](../lib/models/schema.prisma)) carry full ASPIC+ metadata: `orderingPolicy` (last-link/weakest-link), `setComparison` (elitist/democratic), `weight`, conflict-resolution fields, and preferred/dispreferred refs to claim | argument | scheme.
- **First-class AIF node** — `'PA'` is a real `NodeType` in [lib/aif/types.ts:51](../lib/aif/types.ts) and [packages/aif-core/src/types.ts](../packages/aif-core/src/types.ts); round-trips through JSON-LD / AIF import & export.
- **Preference→defeat algorithm** — [lib/aspic/defeats.ts:82-94](../lib/aspic/defeats.ts) genuinely converts a symmetric attack into an asymmetric defeat; unit-tested at `tests/aspic/core.test.ts:421-456`.
- **UI creation path** — `PreferenceAttackModal` → `POST /api/pa` (auth'd, validated) is reachable from `AIFArgumentsListPro`.

### ⚠️ Broken / Incomplete
| # | Issue | Location | Severity |
|---|-------|----------|----------|
| A | **Key-format mismatch** — DB→ASPIC keys rule prefs by `scheme.id`; constructed args key top rule as `RA:<argumentId>`. Lookup always misses → preferences never apply on live data. | [lib/aspic/translation/aifToASPIC.ts:106](../lib/aspic/translation/aifToASPIC.ts) vs [app/api/aspic/evaluate/route.ts:334](../app/api/aspic/evaluate/route.ts) | **Critical** |
| B | **Premise preferences dropped** in default last-link mode (only `rulePreferences` consulted). | [lib/aspic/defeats.ts:160](../lib/aspic/defeats.ts) | High |
| C | `/api/aif/evaluate` never loads stored `PreferenceApplication`s — only reads PA nodes embedded in the request body. | [app/api/aif/evaluate/route.ts](../app/api/aif/evaluate/route.ts) | High |
| D | `pref`/`premise` aliasing — `computeAspicSemantics` sets both pref arrays to one flat pool. | [lib/aif/translation/aifToAspic.ts:486-487](../lib/aif/translation/aifToAspic.ts) | Medium |
| E | **Import bug** — `lib/aif/import.ts` writes `preferredKind`/`dispreferredKind` fields that don't exist on the model → JSON-LD PA import fails. | [lib/aif/import.ts:167](../lib/aif/import.ts) | High |
| F | **Unauth'd endpoint** — `POST /api/aif/preferences` has no auth and trusts client-supplied `createdById`; uses `z.parse` (500s on bad input). | [app/api/aif/preferences/route.ts](../app/api/aif/preferences/route.ts) | High (security) |
| G | `app/api/arguments/[id]/defeats` is an explicit placeholder returning empty defeats; `PreferenceBadge` shows preference *existence*, not effect. | [app/api/arguments/[id]/defeats/route.ts](../app/api/arguments/[id]/defeats/route.ts) | Medium |
| H | **No scoring integration** — no confidence/support/acceptability module reads `PreferenceApplication`. (May be intended — see §4.) | `lib/confidence/*`, `lib/argumentation/*`, `lib/aif/counts.ts` | Design decision |
| I | Coverage gaps — `/api/pa` HTTP test is `test.skip`; `/api/aif/preferences` untested; no table-creation migration; no seed. | `__tests__/aspic/phase4-integration.test.ts:535` | Medium |
| J | Surface fragmentation — two creation endpoints (`/api/pa` vs `/api/aif/preferences`); `AttackMenuProV2` has no preference wiring; `aifExporter.ts` omits PA. | various | Low |
| K | **(Found during Phase 0)** `/api/batch/aif` passes the raw `@graph` object straight to `importAifJSONLD`, but that importer reads `graph.nodes`/`graph.edges` — fields absent on a raw `@graph` body — so the import throws (`graph.nodes.map`) before reaching any node handling. The route computes a `normalize()` → `{nodes,edges}` but never passes it. Separate from E; whole import path is currently broken via this route. **Not yet fixed** (out of Phase 0.1 scope). | [app/api/batch/aif/route.ts](../app/api/batch/aif/route.ts), [lib/aif/import.ts:24](../lib/aif/import.ts) | High |

### Key takeaway
The engine works when keys align (proven by hand-built tests); on real deliberations preferences are silently inert (A–D), one import path is broken (E), one write path is insecure (F), and preferences influence no score (H). **Net effect: PA nodes are presently decorative on live data.**

---

## 2. Goals & Non-Goals

**Goals**
1. Make stored `PreferenceApplication`s actually affect ASPIC+ evaluation outcomes on live deliberations (defeat + grounded-extension membership).
2. Fix the broken import path and secure the write path.
3. Surface real preference→defeat effects in the per-argument UI (not placeholder).
4. Decide and (if approved) implement how preferences relate to confidence/support scoring.
5. Backfill tests, a migration, and a seed so the behavior is regression-protected.

**Non-Goals (this roadmap)**
- The scheme-rivalry "fourth attack type" research (overview §VIII, conjectures C009/C016) — tracked separately; PA work should stay compatible with it but not block on it.
- Reworking the log-odds confidence semiring itself.
- Multi-hop / cross-room preference transport (Plexus) — out of scope until single-room is correct.

---

## 3. Phased Plan

### Phase 0 — Correctness & security quick wins (low risk, do first)
- **0.1** Fix import bug **E**: align `lib/aif/import.ts` PA creation with the actual schema fields (drop phantom `preferredKind`/`dispreferredKind`; resolve to `preferred*Id`/`dispreferred*Id`). Add a round-trip import test.
- **0.2** Consolidate creation onto `/api/pa` (decision Q3). Repoint the `/api/aif/preferences` caller (`AttackMenuPro.postPA`) to `/api/pa`, mapping its `{kind,id}` payload to the `/api/pa` shape. Mark `POST /api/aif/preferences` deprecated (410 or a thin forward), eliminating the unauth'd path **F** entirely rather than patching it.
- **0.3** Un-skip the `/api/pa` HTTP test (`__tests__/aspic/phase4-integration.test.ts:535`) and add a `/api/aif/preferences` test.
- **Acceptance:** import round-trips; unauth'd write rejected (401); both endpoints covered.

### Phase 1 — Make preferences affect evaluation (the core fix)
- **1.1** Resolve key-format mismatch **A** per **decision Q1: canonical key = RA-node id** (`RA:<argumentId>`). Make `populateKBPreferencesFromAIF`'s rule-preference keys agree with the rule ids used during argument construction in `/api/aspic/evaluate`. Scheme↔scheme preferences resolve to the RA-node(s) instantiating that scheme at eval time.
- **1.2** Fix premise-preference handling **B/D**: ensure `premisePreferences` are consulted in last-link mode where appropriate, and stop aliasing the two pref pools in `computeAspicSemantics`.
- **1.3** Make `/api/aif/evaluate` load stored `PreferenceApplication`s **C** (call `populateKBPreferencesFromAIF(deliberationId)` and merge with graph-supplied PA nodes).
- **1.4** Add an **end-to-end test**: create PA rows in DB → run evaluation → assert grounded-extension membership flips vs. the no-preference baseline. This is the test that would have caught **A**.
- **1.5 (folded in: issue K)** Fix the `/api/batch/aif` import path: pass the normalized `{nodes,edges}` to `importAifJSONLD` (or make `importAifJSONLD` accept the raw `@graph` and normalize internally). Independent of the key-format work but kept here so the import/eval path is correct end-to-end. Add a test that a PA-bearing `@graph` imports without throwing.
- **Acceptance:** a stored preference demonstrably changes `groundedExtension` / `justificationStatus` for a real deliberation fixture; a PA-bearing AIF graph imports cleanly via `/api/batch/aif`.

### Phase 2 — Surface effects in the UI
- **2.1** Replace the placeholder `app/api/arguments/[id]/defeats` **G** with a real (bounded) defeat computation, or repoint `PreferenceBadge` at the deliberation-scope evaluate result.
- **2.2** Wire preference creation into `AttackMenuProV2` → `/api/pa` (per Q3 consolidation) so the V2 attack flow can express preferences, not just the separate modal.
- **2.3** Fix response mislabeling in `/api/aspic/evaluate` (`premisePreferences`/`rulePreferences` swapped in the payload).
- **Acceptance:** the argument card reflects whether a preference actually changed standing.

### Phase 3 — Standing integration (per decision Q2: standing only, not confidence float)
- **3.1** Ensure preference-driven defeat drives the **standing classification** (in/out/undec) only; the displayed **confidence float stays preference-independent** (log-odds over support). No change to the confidence semiring. Where standing is computed/displayed, source it from the grounded-extension result that now respects preferences (Phase 1).
- **3.2** Reflect standing on the argument card and Living-Thesis confidence cards (which already display standing labels) so a preference-induced standing change is visible without implying a confidence change.
- **Acceptance:** a preference flips standing (in↔out) on a fixture while the confidence float is unchanged; tests assert both halves.

> **Scoping finding (2026-06-14).** There are **two distinct "standing" notions** in the repo: (a) the **count-based dialectical taxonomy** (`computeStandingState` in [lib/citations/argumentAttestation.ts](../lib/citations/argumentAttestation.ts) — inputs are `incomingAttacks`/`incomingSupports`/`criticalQuestionsAnswered`; `tested-survived`/`untested-default`/… ; used in search cards, citations, attestation) which is **NOT** grounded-extension-based and **NOT** preference-aware; and (b) the **ASPIC grounded standing** (`in`/`out`/`undec` from `justificationStatus`) which **IS** preference-aware (Phase 1) but surfaced only in the diagnostic `GroundedExtensionPanel`. Phase 3 therefore **surfaces (b) as a distinct new signal** rather than retrofitting (a) — retrofitting would conflate two epistemic axes and ripple across citations/search/attestation. Consistent with Q2 (standing kept separate from confidence).

### Phase 4 — Hardening
- **4.1 — RESOLVED (no file; documentation).** The repo manages schema via **`prisma db push` from `schema.prisma`** (CLAUDE.md), not a migration history — *no* model has a table-creation migration. `PreferenceApplication`/`PreferenceScheme` are defined in `schema.prisma` (source of truth) and applied via `db push`; a standalone CREATE TABLE migration would be off-convention and redundant.
- **4.2 — DONE.** Demo seed [scripts/seed-preference-demo.ts](../scripts/seed-preference-demo.ts) builds a deliberation with two mutually-rebutting arguments (claim-level conflicts) + a preference, showing standing flip undecided → in/out. Shape validated by the new end-to-end test (below); **not run against a live DB here**.
- **4.3 — RESOLVED (no code; documentation, was a false positive — issue J).** `aifExporter.ts` is the **scheme-catalogue → AIF/RDF** exporter (`exportSchemeToAIF`/`exportAllSchemes`), exporting the scheme *ontology*. PA-nodes are deliberation-*instance* data, exported by [lib/aif/jsonld.ts](../lib/aif/jsonld.ts) and [lib/aif/export.ts](../lib/aif/export.ts). `aifExporter` correctly omits PA — different exporter, different domain.
- **4.4 — DONE.** Referential validation added to [POST /api/pa](../app/api/pa/route.ts): preferred/dispreferred IDs are polymorphic (claim|argument|scheme) so they can't be DB FKs; the route now verifies argument/claim refs exist in the deliberation (also rejects self-preference). Scheme-side refs left unvalidated (rare; not deliberation-scoped).
- **4.5 (issue K full fix, decision Q5)** Unify AIF serialization on the JSON-LD `@graph` form: rewrite `lib/aif/import.ts` to consume `@graph` (array `@type`, `aif:text`, role-typed edge nodes) as produced by `lib/aif/jsonld.ts`; pass the raw graph through `/api/batch/aif`; retire the divergent `{nodes,edges}` shape from `lib/aif/export.ts`. Add a true export→import round-trip test (now possible once formats match). Removes the fail-fast guard added in 1.5.

---

## 4. Decisions (RESOLVED 2026-06-14)

- **Q1 (Phase 1) — RESOLVED: RA-node id.** Canonical rule-preference key is the **RA-node id** (`RA:<argumentId>`), since defeats operate over argument instances, not scheme types. `populateKBPreferencesFromAIF` and argument construction must agree on this key. Scheme↔scheme preferences (where the preferred/dispreferred ref is a `schemeId`) are resolved to the RA-node(s) instantiating that scheme at evaluation time, so they still reduce to RA-keyed lookups.
- **Q2 (Phase 3) — RESOLVED: standing only.** Preferences affect the **standing classification** (in/out/undec via defeat + grounded extension), NOT the displayed confidence float. Confidence remains log-odds folding over *support* derivations (overview §VIII: "a classified dialectical state, not an opaque float"). The two epistemic axes stay separate: support strength = confidence; defeat status = standing.
- **Q3 (Phase 0/2) — RESOLVED: consolidate.** Single creation endpoint `/api/pa` (auth'd, validated, full field support). `POST /api/aif/preferences` is **deprecated** and its callers repointed to `/api/pa`. Affects 0.2 and 2.2.
- **Q4 — RESOLVED: defer.** The scheme-rivalry "fourth attack" conjecture (C009/C016) still needs theoretical resolution in the research programme before it informs implementation. PA work proceeds independently; it must not foreclose a future PA-adjacent node type but should not design around an unsettled construct. Revisit when the conjecture matures.
- **Q5 (issue K) — RESOLVED: standardize on the JSON-LD `@graph` form.** It is the public/interop format (overview §IV). Follow-up work (tracked in Phase 4.5): rewrite `lib/aif/import.ts` to consume the `@graph` produced by `lib/aif/jsonld.ts` (array `@type`, `aif:text`, role-typed edge nodes), then have `/api/batch/aif` pass the raw graph through; deprecate/retire the divergent `{nodes,edges}` shape from `lib/aif/export.ts`. Until that lands, `importAifJSONLD` fails fast with a clear error (shipped in Phase 1.5).
- **Q6 (issue C) — RESOLVED: keep `/api/aif/evaluate` stateless.** It stays a pure evaluator of the posted graph (already honors graph-embedded PA nodes); the canonical DB-backed path is `GET /api/aspic/evaluate`. The `?includeStoredPreferences=true` opt-in is **deferred** (not built now). Issue C is therefore *by design, no action*.

---

## 5. Risks
- The key-format fix (1.1) touches the hot path of ASPIC+ evaluation; regressions could silently change grounded-extension results platform-wide. Mitigation: the Phase 1.4 end-to-end fixture + snapshot of current evaluation outputs before/after.
- Scoring integration (Phase 3) risks conflating two epistemic axes (support strength vs. defeat status); the §4 Q2 decision must be settled first.

## 6. Test Strategy
- Unit: extend `tests/aspic/core.test.ts` for premise-pref + scheme-pref cases.
- Integration: new DB→evaluate→grounded-extension flip test (1.4).
- Contract: round-trip import/export of a PA node (0.1).
- Run via `npm test` (jest) and `npm run vitest` for package-level; remember `prisma db push` (not `migrate dev`) per repo convention.

---

## 7. Change Log (record as phases complete)

> Append an entry per shipped change: date · phase · commit · what changed · tests.

### 2026-06-14 — Phase 0 (Correctness & security quick wins) — committed `0c26ed3b`, merged to main (PR #635)

- **0.1 (issue E) — Fixed PA import.** Removed phantom `preferredKind`/`dispreferredKind` fields from the `preferenceApplication.create` call in [lib/aif/import.ts](../lib/aif/import.ts) (they don't exist on the model and threw against real Prisma). Confirmed the import's preferred→PA→dispreferred edge-direction matching is correct vs. [lib/aif/export.ts](../lib/aif/export.ts) — the suspected asymmetry was a non-bug. Added regression test [`__tests__/aif/import-preferences.test.ts`](../__tests__/aif/import-preferences.test.ts) (mock-based; the harness stubs Prisma, so a live round-trip isn't unit-testable).
- **0.2 (issue F, decision Q3) — Consolidated creation onto `/api/pa`.** Repointed [`components/arguments/AttackMenuPro.tsx`](../components/arguments/AttackMenuPro.tsx) `postPA` from `/api/aif/preferences` → `/api/pa` (drops client-supplied `createdById`; server derives it). Retired [`app/api/aif/preferences/route.ts`](../app/api/aif/preferences/route.ts) to a `410 Gone` pointing at `/api/pa`, eliminating the unauthenticated write path entirely.
- **0.3 — Endpoint coverage.** Added [`__tests__/api/pa.test.ts`](../__tests__/api/pa.test.ts): `/api/pa` 401 (unauth), 400 (not exactly-one), 200 happy-path with server-derived `createdById`; and `/api/aif/preferences` 410 deprecation. Chose direct handler tests over un-skipping the localhost E2E `test.skip` in `phase4-integration.test.ts:535` (needs a live server; left in place).
- **New finding (issue K)** logged in §1 — `/api/batch/aif` import path is broken independently of E; deferred (not Phase 0 scope).
- **Tests:** `npx jest __tests__/api/pa.test.ts __tests__/aif/import-preferences.test.ts` → 5 passing.

### 2026-06-14 — Phase 1 (Make preferences affect evaluation) — committed `0c26ed3b`, merged to main (PR #635)

- **1.1 (issue A) — FIXED, the core change.** `getRuleIdFromArgument` ([lib/aspic/translation/aifToASPIC.ts](../lib/aspic/translation/aifToASPIC.ts)) now returns the canonical RA-node key `RA:<argumentId>` instead of `scheme.id`. This is the key that argument construction assigns to defeasible rules, so stored rule preferences now actually match and gate defeats. Regression + end-to-end proof in [`__tests__/aspic/preference-key-format.test.ts`](../__tests__/aspic/preference-key-format.test.ts): Test A locks cross-layer key agreement; **Test B proves a stored RA-keyed preference flips grounded-extension standing** (without pref → both `undec`; with `RA:argA > RA:argB` → argA `in`, argB `out`). Updated the now-stale assertion in `phase4-integration.test.ts:166` (skipped suite) from scheme.id to RA-keys.
- **1.2 (issues B, D) — NO CHANGE NEEDED (re-analysis).** Reading the code showed both are non-bugs: **(D) aliasing is benign** — `premisePreferences` are keyed by claim *text* and `rulePreferences` by `RA:<id>`, disjoint key spaces, so the union-in-both-buckets in `computeAspicSemantics` never cross-matches. **(B)** last-link ignoring premise preferences is *correct* ASPIC+ semantics (premise prefs apply in weakest-link, which reads `premisePreferenceMap` keyed by claim text — works after the 1.1 fix). Documented; no edit.
- **1.3 (issue C) — DEFERRED → decision Q6.** `/api/aif/evaluate` is a stateless evaluator of a posted graph and already honors graph-embedded PA nodes; loading DB preferences is a design choice, not a bug. Raised as Q6 rather than silently changing endpoint semantics. The canonical DB-backed path (`GET /api/aspic/evaluate`) is fixed by 1.1.
- **1.5 (issue K) — HARDENED, full fix → decision Q5.** Found K is deeper than a one-liner: `import.ts` and the `/api/batch/aif` route assume two *incompatible* AIF serializations. Hardened `importAifJSONLD` ([lib/aif/import.ts](../lib/aif/import.ts)) to fail fast with a clear message instead of a cryptic `undefined.map`. Full importer/exporter format unification raised as Q5 (recommend standardizing on the JSON-LD `@graph` interop form).
- **Tests:** `npx jest __tests__/aspic/preference-key-format.test.ts __tests__/aif/import-preferences.test.ts __tests__/api/pa.test.ts tests/aspic/core.test.ts` → 28 passing (incl. existing aspic core suite, no regressions).
- **Net outcome:** stored preferences now demonstrably change evaluation standing on the canonical path — the Phase 1 acceptance criterion is met. Q5/Q6 carry the remaining, lower-priority surface work.

### 2026-06-14 — Phase 4.5 (issue K full fix, decision Q5) + Phase 2 — uncommitted (working tree)

**Phase 4.5 — AIF import format unified on `@graph`.**
- Rewrote [lib/aif/import.ts](../lib/aif/import.ts) to consume the canonical JSON-LD `@graph` form from `lib/aif/jsonld.ts`: handles array `@type` (RA nodes), `aif:text`, role-typed edge nodes (`aif:from`/`aif:to`), and `S:`/`I:`/`CA:`/`PA:` id prefixes; imports I/RA/CA/PA with scheme resolution and the conflict→attack-type mapping (UNDERCUTS/UNDERMINES/REBUTS). [app/api/batch/aif](../app/api/batch/aif/route.ts) now passes the raw graph straight through; its `normalize()` counts updated for the `@graph` shape. Test: [`__tests__/aif/import-graph.test.ts`](../__tests__/aif/import-graph.test.ts) (claims + scheme-resolved args + PA preference; rejects non-`@graph`). Removed the obsolete Phase-0.1 `import-preferences.test.ts` (tested the retired `{nodes,edges}` path; its phantom-`*Kind` guard folded into the new test). NOTE: `lib/aif/export.ts`'s `{nodes,edges}` exporter + `packages/aif-core/src/import.ts` remain for their own callers (kb export-aif, validate.ts) — internally consistent, not broken; fully retiring that shape is a later cleanup.

**Phase 2 — surfacing.**
- **2.1 (issue G) — real defeat computation.** New self-contained [lib/aspic/deliberationEvaluation.ts](../lib/aspic/deliberationEvaluation.ts) builds the deliberation's AIF graph from the DB (RA/I/CA + PA prefs, `RA:<id>` keys) and evaluates it; `getArgumentDefeats` returns defeats-by/defeated-by for an argument. [app/api/arguments/[id]/defeats](../app/api/arguments/[id]/defeats/route.ts) no longer a placeholder — returns real `defeatsBy`/`defeatedBy` + accurate `preferenceStats` (direct PA counts), matching the fields `PreferenceBadge` reads (previously mismatched: route returned `defeatsOn`/`relatedPreferences`). Bounded build (no scheme-instance ruleType/assumptions/CQ) — `GET /api/aspic/evaluate` stays authoritative. Test: [`__tests__/aspic/deliberation-evaluation.test.ts`](../__tests__/aspic/deliberation-evaluation.test.ts).
- **2.2 (issue J) — preference creation on the V2 surface.** `AttackMenuProV2` is live in [components/arguments/ArgumentActionsSheet.tsx](../components/arguments/ArgumentActionsSheet.tsx); added a "Preference" button + `PreferenceAttackModal` (→ `/api/pa`) beside it, mirroring `AIFArgumentsListPro`'s `PreferenceQuick`. (Did not build a counterpart-picker inside the 917-line V2 — reused the existing modal, which a preference inherently needs since it requires a second argument.)
- **2.3 — response labels.** `/api/aspic/evaluate` now reports the real `premisePreferences`/`rulePreferences` split instead of the combined pool mislabeled as `premisePreferences` with empty `rulePreferences`.
- **Tests:** 31 passing across the PA suites + `tests/aspic/core.test.ts` (no regressions). UI changes (2.1 route shape, 2.2 modal wiring) are not unit-covered for rendering — worth a manual `/verify` with the app running before relying on them visually.
- **Decisions closed:** Q5 (this phase), issue C (Q6, by-design). Remaining: Phase 3 (reflect standing on cards) and Phase 4 (migration, seed, FK constraints, export-format cleanup).

### 2026-06-14 — Phase 3 (Standing integration) — uncommitted (working tree)

- **Scoping (recorded above):** found two distinct standings — the count-based dialectical taxonomy (`computeStandingState`, not grounded/preference-aware) vs the ASPIC grounded `in`/`out`/`undec` (preference-aware). Phase 3 surfaces the latter as a **distinct new signal**, not a retrofit of the former.
- **3.1 — preference-aware standing helper + endpoint.** Extended `getArgumentDefeats` ([lib/aspic/deliberationEvaluation.ts](../lib/aspic/deliberationEvaluation.ts)) to also return `standing: { status: 'in'|'out'|'undec'|'unknown', preferenceApplied }`, derived from the same preference-aware `computeAspicSemantics` evaluation (a DB arg stands `in` if any of its constructed args is `in`, `out` if all `out`, else `undec`). Surfaced in the [/api/arguments/[id]/defeats](../app/api/arguments/[id]/defeats/route.ts) response. The confidence float is untouched (card still reads `Argument.confidence` via `ConfidenceDisplay` — verified).
- **3.2 — surfaced on the argument surfaces.** Added a grounded-standing row (IN/OUT/UNDECIDED, colour-coded, "· preference applied" marker) to [PreferenceBadge](../components/aif/PreferenceBadge.tsx) — live in the deepdive debate surfaces (`ArgumentNetworkCard`, `ThreadedDiscussionTab`), fetched **on-demand** (tooltip open) so no per-card eval cost. **Deferred 3.2b:** a prominent always-on standing badge on every `ArgumentCardV2` needs a **deliberation-level batch standing endpoint** (one eval distributed to all cards) to avoid O(args²) per-card evaluation — `/api/aspic/evaluate` already computes the batch; wiring a per-argument distribution is the follow-up.
- **Tests:** extended [deliberation-evaluation.test.ts](../__tests__/aspic/deliberation-evaluation.test.ts) — standing shape + a deterministic "unattacked → `in`" case; preference-flips-standing is already proven at the engine level by [preference-key-format.test.ts](../__tests__/aspic/preference-key-format.test.ts) Test B. 32 passing across the PA suites + core (no regressions).
- **UI caveat:** the `PreferenceBadge` standing row is not unit-covered for rendering — worth a `/verify` pass with the app before relying on it visually.

### 2026-06-14 — Phase 4 (Hardening) — uncommitted (working tree)

- **4.4 (FK/validation) — DONE.** [POST /api/pa](../app/api/pa/route.ts) now validates that referenced preferred/dispreferred **argument/claim** ids exist in the deliberation (polymorphic refs can't be DB FKs); also rejects self-preference. Test added to [pa.test.ts](../__tests__/api/pa.test.ts) (missing-ref → 400, create not called).
- **End-to-end pipeline proof (new).** [deliberation-evaluation.test.ts](../__tests__/aspic/deliberation-evaluation.test.ts) now proves a stored preference **flips grounded standing through the full DB pipeline** (`buildDeliberationGraph` → `aifToASPIC` → `computeAspicSemantics`): no pref → both `undec`; with `RA:argA > RA:argB` → argA `in`, argB `out`. **Surfaced a real requirement:** the conflict must be **claim-level** (contrary between conclusion texts) — an *argument-level* conflict sets the contrary between RA-ids and produces no rebut. Test B (Phase 1) proved the flip via a hand-built theory; this proves it via the DB path.
- **4.2 (seed) — DONE (unrun).** [scripts/seed-preference-demo.ts](../scripts/seed-preference-demo.ts) builds the claim-level-rebut + preference demo and logs the standing flip. Entity shapes match verified working code + the e2e test; **not executed against a live DB here** (`tsx --env-file=.env scripts/seed-preference-demo.ts` to run).
- **4.1 / 4.3 — RESOLVED as documentation** (see Phase 4 list): 4.1 — table creation is via `db push` from `schema.prisma` (repo convention; no migration files for any model); 4.3 — `aifExporter.ts` is a scheme-catalogue exporter and correctly omits PA (deliberation-instance data lives in jsonld.ts/export.ts) — the audit's issue J was a false positive.
- **Tests:** my added/changed suites pass (deliberation-evaluation 4/4, pa 5/5, preference-key-format 4/4, import-graph 2/2, core green). Two DB-integration suites in `__tests__/aspic/` (`translation.test.ts`, `strictRules.integration.test.ts`) fail under the mocked jest harness (`prisma.deliberation.create` undefined) — **pre-existing, unrelated** (same category as the skipped `phase4-integration.test.ts`); they die in setup before any assertion.
- **All PA-node phases (0, 1, 2, 3, 4, 4.5) are now complete.** Remaining roadmap items are deferred/by-design (per §3/§4 decisions).
