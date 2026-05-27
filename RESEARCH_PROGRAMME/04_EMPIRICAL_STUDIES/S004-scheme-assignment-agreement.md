# S004 — Scheme-assignment agreement and the empirical status of identification patterns

- **status:** pre-registered (stub; awaits cohort selection and rubric freeze)
- **type:** mixed (observational + small human-rater study)
- **registered-on:** 2026-05-27
- **author:** (programme seed)
- **feeds:** Q-013 (taxonomy → CQ generator coverage); Cluster D of [`../../Development and Ideation Documents/ARCHITECTURE/SCHEMES_THEORETICAL_FOUNDATIONS.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_THEORETICAL_FOUNDATIONS.md)

## Hypotheses

**H1 (primary, directional).** Inter-rater agreement on scheme assignment
(Cohen's κ between two trained annotators) is **higher** for arguments
that match at least one of the candidate scheme's `identificationPatterns`
than for arguments that do not. Effect size threshold for "supports H1":
Δκ ≥ 0.15.

**H2 (LLM mirror, directional).** A scheme-suggestion LLM call (using the
admin's existing identification-pattern strings as the suggestion prompt)
agrees with the modal human annotator at a rate **at least as high** as
the second human annotator does.

**H3 (taxonomy-coverage, observational, feeds Q-013).** For each production
scheme `S`, the Jaccard overlap between `S.cqs` (the persisted CQ set) and
`generateCQsFromTaxonomy(S.taxonomy, S.key)` (the generator's output for
the same taxonomy) is ≥ 0.7 across ≥ 80% of schemes.

## Design

### Sub-study A — Human annotation (H1, H2)

- **Sample.** 40 arguments drawn from the production deliberation corpus
  (stratified across the 4 most-used cluster families:
  `authority_family`, `causal_family`, `evidence_family`,
  `practical_reasoning_family` — 10 per family).
- **Annotators.** Two annotators trained on the existing scheme catalogue
  (target: domain familiarity, not Walton scholarship).
- **Procedure.** Each annotator independently assigns one scheme per
  argument from the production catalogue, blind to the other's choice.
  For each assignment, record: scheme key, whether at least one of that
  scheme's identification patterns matches the argument (binary), and a
  free-text rationale.
- **LLM arm.** For each argument, ask the existing scheme-suggestion
  pipeline to return its top-1 scheme. Compare against the modal human
  annotator.

### Sub-study B — Taxonomy coverage (H3)

- **Sample.** Every production scheme with a complete taxonomy
  (`purpose`, `source`, `materialRelation`, `reasoningType`, `ruleForm`,
  `conclusionType` all non-null) — expected n ≈ 25 of the 31 current
  schemes.
- **Procedure.** For each scheme `S`, run
  `generateCQsFromTaxonomy(S.taxonomy, S.key)` from
  [`../../lib/argumentation/cqGeneration.ts`](../../lib/argumentation/cqGeneration.ts);
  compute Jaccard(generated.cqKey set, actual.cqKey set), directional
  containment (generated ⊆ actual?), and per-`attackType` agreement.

## Metrics (frozen)

- **Primary (H1):** Cohen's κ between annotators on pattern-matching vs
  non-matching subsets; report Δκ and 95% bootstrap CI.
- **Secondary (H2):** percentage agreement (LLM vs modal human) minus
  percentage agreement (annotator 2 vs annotator 1); H2 supported iff
  this is ≥ 0.
- **Coverage (H3):** mean and per-scheme Jaccard; fraction of schemes at
  Jaccard ≥ 0.7; identification of any taxonomy cell with systematic
  mis-alignment (defined as: ≥ 3 schemes with that taxonomy cell and
  Jaccard < 0.4).

## Analysis plan (frozen)

- **H1 result table.** A 2×2 confusion grid (pattern-matched × agreement)
  with Δκ.
- **H1 supported:** Δκ ≥ 0.15 with 95% CI excluding 0.
- **H1 null:** Δκ ∈ [-0.05, 0.15] with CI including 0.
- **H1 contradicted:** Δκ ≤ -0.05 (pattern-matched arguments are *less*
  agreeable than non-matched — would indicate patterns mis-direct
  annotators).
- **H2:** simple percentage with 95% bootstrap CI on the difference.
- **H3:** descriptive plus the systematic-mis-alignment check.

## Stopping rule

40 arguments minimum for Sub-study A; if either annotator drops out before
30, extend the recruitment window before analysis. Sub-study B runs on
whatever production corpus exists at the freeze date and is not re-run if
new schemes are added.

## Cluster-D interpretation

The result lands the empirical leg of [Cluster D of the foundations
doc](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_THEORETICAL_FOUNDATIONS.md#cluster-d):

- H1 supported + H2 supported ⇒ identification patterns are doing real
  classificatory work; the *declaration* and *MAP-inference* readings of
  scheme assignment are both viable, and the admin's pattern-based
  classifier earns its keep.
- H1 supported + H2 null ⇒ patterns help humans but not the LLM; the
  classifier needs richer features or a structural (behaviour-based) check.
- H1 null/contradicted ⇒ patterns are not doing classificatory work; the
  *declaration* reading is the only one left standing without further
  machinery, and the admin's pattern field should be re-framed as
  documentation, not as a classifier signal.

## Data and code

- Annotation interface: `experiments/scheme-agreement-S004/` (to be created
  on study start).
- Analysis script: `experiments/scheme-agreement-S004/analysis/S004.R`.
- Corpus snapshot: `experiments/scheme-agreement-S004/corpus.json` (frozen
  on study start).

## Pre-registration freeze

(Hash to be inserted at first commit of this file.)

## Post-analysis (to be filled)

- Result:
- Surprises:
- Feeds: Q-013 directly; Cluster D of the foundations doc; possibly C006/C007/C008 if scheme-assignment turns out to depend on something other than the admin's three readings cover.
