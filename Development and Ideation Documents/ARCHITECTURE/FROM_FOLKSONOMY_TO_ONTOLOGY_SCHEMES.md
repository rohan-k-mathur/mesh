# Folksonomy-in-practice → ontology-in-practice: the path

A single ordered checklist drawn from q018-ontoclean-20260528.md §3–§4, q020-external-fields-20260528.md §3–§5, the five implementation specs under ARCHITECTURE, and the open questions in 01_OPEN_QUESTIONS_REGISTRY.md. Each step has a **deliverable**, the **owning spec or question**, and a sharp **exit criterion**.

---

## Phase 0 — Catalogue hygiene (the cheap wins surfaced by Q-018)

Required because no formal machinery is honest until the catalogue stops shipping test rows. Each item is a one-shot data migration.

1. **Delete or relocate test placeholders.** Remove `scheme_test` and `test_scheme` from the production `ArgumentScheme` table, or move them to a `_test_fixtures` cluster that the default catalogue view excludes. → q018-ontoclean-20260528.md §3.2. **Exit:** `SELECT key FROM "ArgumentScheme" WHERE key LIKE '%test%'` returns 0 in the default-view query.

2. **Migrate dialogue-meta entries out of `ArgumentScheme`.** Move `bare_assertion`, `claim_clarity`, `claim_relevance`, `claim_truth` to a dedicated dialogue-meta table (or add a `kind` discriminator column distinguishing `argument-scheme` from `dialogue-meta`). → audit §3.3. **Exit:** every row in `ArgumentScheme` is a Walton-style argument-inference pattern; the four meta entries live elsewhere and are excluded from scheme-pickers in SchemeCreator.tsx.

3. **Normalise cluster-tag naming.** Rename `causality_family` → `causal_family` (or vice versa — pick one) and add a CHECK constraint on `clusterTag` against an enumerated list. → audit §3.5. **Exit:** `SELECT DISTINCT "clusterTag"` returns a closed enum with no near-duplicates.

4. **Backfill missing `clusterTag` values.** 9 of 31 schemes have `clusterTag = null`. Assign each to an existing cluster (or open a new cluster) using the audit's per-scheme rationale. → audit §3.4. **Exit:** zero rows with `clusterTag IS NULL` in production catalogue.

---

## Phase 1 — Provenance & timestamps (Q-022, Q-024)

Required because duplicate-candidate diagnosis is currently a fuzzy name-match and chronological auditing is impossible. Without these, every later phase remains epistemically loose.

5. **Land per-scheme provenance.** Add `sourceCatalogue` (enum: `AIF | AIFdb | Argdown | WRM-2008 | admin-authored`), `sourceId`, `sourceVersion`, `importedAt`, `importerVersion`. Decide column-vs-side-table per Q-022. **Exit:** every row in `ArgumentScheme` has provenance recoverable in O(1).

6. **Add `createdAt`, `updatedAt`, `createdBy` to `ArgumentScheme`.** → Q-024. **Exit:** the missing-column blocker that audit-inherit-cqs-false.ts hit in this session is dissolved.

---

## Phase 2 — Behaviour-equality verifier (Spec 4 phase 4a–4b)

Required because three duplicate-candidate pairs from Q-018 §3.1 cannot be resolved by inspection — they need a verifier verdict. This is where folksonomy detection becomes formal.

7. **Ship `verifyBehaviourEquality` + `computeBehaviourFingerprint`.** Per SCHEMES_IMPL_VERIFIER.md §3.1–§3.4, §4.3. Fingerprint scope now includes `epistemicMode` (widened by Q-020). **Exit:** verifier returns `equal | subset | incomparable | inconclusive` with the documented soundness contract; pure-function fingerprint pinned in tests.

8. **Run the verifier on the Q-018 §3.1 seed corpus.** The three pairs (`expert_opinion`/`expert-opinion`, `positive_consequences`/`good_consequences`, `causal`/`cause_to_effect`). **Exit:** each pair has a recorded verdict; `equal` pairs trigger retire-or-merge in step 9.

9. **Catalogue de-duplication migration.** For every `equal` verdict from step 8, retire the duplicate or relink it as a `SchemeVariant` of the canonical row. Argument rows referencing the retired key get repointed. **Exit:** zero `equal`-verdict pairs remain in the production catalogue.

10. **Wire the non-redundancy panel into `SchemeCreator`** (Spec 4 phase 4b). **Exit:** admins cannot mint a duplicate of an existing scheme without typing into `nonRedundancyJustification`.

---

## Phase 3 — Well-formedness rules (Spec 2 phase 2b–2c)

Required because the verifier handles *behaviour* equality but the catalogue also needs structural invariants. WF1–WF3 are the *prescriptive* discipline that converts a curated snapshot into a maintained ontology.

11. **Flip WF1 (CQ-bundle consistency) to error in phase 2b.** Prioritise the Q-018 §3.1 duplicate pairs in the back-test queue (already documented in q018-ontoclean-20260528.md §5). **Exit:** WF1 errors block scheme creation; back-test produces no surprise failures.

12. **Flip WF2 (parent-child cluster compatibility) and WF3 (no `sibling-navigational` use of `inheritCQs: false`) to error.** WF3's phase-ordering constraint was dissolved by the Q-019 audit (0 rows), so both flip on the original schedule. → SCHEMES_IMPL_ADMIN_TIGHTENING.md §6. **Exit:** all three rules are error-level in production.

13. **Retire `inheritCQs: false`** (Shape A migration in phase 2c). **Exit:** column dropped from `ArgumentScheme`; "+inherited" badge logic in SchemeHierarchyView.tsx simplified.

---

## Phase 4 — Protocol soundness (Spec 3 phase 3a–3d)

Required because the *behaviour* of schemes at play-time is what an ontology ultimately ranges over. Without a soundness gate the catalogue's commitments are not enforced where it matters.

14. **Ship the close-hook against `SchemeInstance`.** Per SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md §3.1, §3.4 — including the additive `status` column. **Exit:** `SchemeInstance.status` transitions are blocked when CQ obligations remain open.

15. **Roll out Carneades `premiseType` defaults (phase 3d).** Q-018 confirmed no anti-rigid schemes exist, so R4 (anti-rigidity-driven conflict) is empirically void; phase 3d ships on the original schedule. **Exit:** each CQ in production carries an explicit `premiseType`; defaults match the Carneades semantics.

---

## Phase 5 — Round-trip soundness (Spec 4 phase 4c–4d)

Required because an ontology that cannot round-trip through its peers (AIF / AIFdb) is a private vocabulary, not an ontology in the shared sense.

16. **Pin AIF version** (Q-023). Decide single-version pin vs. multi-version translator in lib/aif/syncArgument.ts. **Exit:** every AIF import/export carries an explicit version stamp.

17. **Ship phase 4c with the refined soundness predicate** `import(export(scheme)) ≡_substrate-relevant scheme`. The equivalence is keyed off Q-020's classification (exposed + representable-but-absent fields must round-trip). **Exit:** 50-scheme soak sample confirms `≡_substrate-relevant` holds.

18. **Run the one-shot catalogue-redundancy audit (phase 4d).** Quadratic verifier sweep over the whole catalogue. **Exit:** `audits/catalogue-redundancy-<DATE>.json` committed; every residual `equal` or `subset` pair has a follow-on issue.

---

## Phase 6 — Typology completion (Q-025, Q-026)

Required only if the substrate's ontological commitment is to full external-typology placement (e.g. every scheme placeable in Wagemans's PTA). Optional if the substrate's commitment is narrower.

19. **Decide and execute Q-025** (explicit `isAxiomatic` flag on `CriticalQuestion` vs. status quo Carneades `premiseType`). **Exit:** worked-example check on `expert_opinion`'s CQs records a verdict.

20. **Decide and execute Q-026** (add `subjectType` for Wagemans PTA placement). **Exit:** either column added and backfilled, or formal declaration that PTA-placement is a derivation responsibility.

---

## Phase 7 — Inter-rater replication

Required to discharge the single-analyst caveat that both Q-018 and Q-020 currently carry.

21. **Second-analyst replication of Q-018.** Independent OntoClean classification of the 31 schemes; compare against q018-ontoclean-20260528.json; compute Cohen's κ. **Exit:** κ ≥ 0.6 (the threshold from Q-018's `how-would-we-know`); divergences resolved by spec amendment or `requires-review` re-tagging.

22. **Second-analyst replication of Q-020.** Independent field-by-field classification against the upstream catalogue specs; spot-check against q020-external-fields-20260528.csv. **Exit:** disagreements ≤ 5 fields out of 51; new accidental omissions filed as follow-on questions.

---

## What "ontology in practice" looks like at the exit of phase 7

- Every row in `ArgumentScheme` is a Walton-style argument-inference pattern with non-null cluster tag and recoverable provenance.
- No two schemes have `verifyBehaviourEquality(...) = equal`.
- WF1, WF2, WF3 are all error-level; the catalogue cannot drift back into folksonomy through additions.
- Every CQ has a typed `premiseType` and a play-time close-hook that gates soundness.
- AIF round-trip carries `≡_substrate-relevant` identity with version-pinned serialisation.
- Inter-rater κ ≥ 0.6 on the OntoClean classification; field-by-field external-catalogue mapping is reproducible.

The path is monotone: each phase's exits are preconditions for the next, and no phase requires re-doing an earlier phase's work.