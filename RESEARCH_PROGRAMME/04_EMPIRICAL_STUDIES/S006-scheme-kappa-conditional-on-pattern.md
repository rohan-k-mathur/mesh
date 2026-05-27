# S006 — Inter-annotator κ conditional on identification-pattern match

- **status:** pre-registered (stub; awaits annotator recruitment and corpus freeze)
- **type:** human-rater empirical (re-annotation study)
- **registered-on:** 2026-05-27
- **author:** (programme seed)
- **feeds:** Cluster D of [`../../Development and Ideation Documents/ARCHITECTURE/SCHEMES_THEORETICAL_FOUNDATIONS.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_THEORETICAL_FOUNDATIONS.md); SC14 in [`../../Development and Ideation Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md); complements S004 (which measures pattern-match × agreement on the *production* corpus); complements S005 (which measures patterns-as-classifier-features)

## Background

Visser, Lawrence, Reed, Wagemans & Walton 2020 report Cohen's
$\kappa = 0.723$ for Walton-scheme annotation on the US2016 corpus
(505 inferences, 10.2% sample). The literature review (§5 Bucket 4)
confirms: *no study has measured kappa conditional on
identification-pattern matching* — i.e. whether agreement is
systematically higher on arguments where at least one of the candidate
scheme's identification patterns matches, vs. arguments where it does
not. The S004 study addresses this on the *production* corpus with two
trained annotators; S006 addresses it on the *Visser et al. 2020*
corpus to make the result directly comparable to the published κ
baseline.

S004 and S006 are deliberately separate: S004 establishes the effect on
the substrate's own corpus and feeds the admin design directly; S006
establishes the effect on the field-standard corpus and feeds the
field's literature (and is publishable as a standalone replication +
conditional-κ extension).

## Hypotheses

**H1 (primary, directional).** On the US2016 corpus, Cohen's $\kappa$
for scheme assignment is **higher** on the subset of arguments where at
least one of the candidate scheme's identification patterns matches
than on the subset where none match. Effect-size threshold:
$\Delta\kappa \geq 0.10$.

**H2 (secondary, directional).** The conditional-κ improvement is
**larger for novice annotators** than for trained annotators. Operational:
recruit two cohorts (trained Walton scholars vs domain-familiar but
untrained annotators) and report ΔΔκ.

**H3 (exploratory).** When annotators are *shown* the identification
patterns alongside the candidate scheme (the *primed* condition), κ
increases over the *unprimed* condition by $\geq 0.10$, holding the
annotator cohort constant.

## Design

### Corpus

- **US2016 sub-sample.** Re-use Visser et al. 2020's 505-inference
  sample if obtainable from authors; otherwise draw a fresh stratified
  10% sample (matching their stratification on debate and speaker).
  Lock the sample at study start.
- **Pattern source.** Map each Walton scheme present in US2016 to the
  substrate's `identificationPatterns` for the corresponding scheme key
  (where the substrate has one); for schemes not in the substrate
  catalogue, use the patterns from the WRM 2008 schema-row "indicator
  words" field. Lock pattern set at study start.

### Annotators

- **Cohort T (trained).** Two annotators with prior Walton-scheme
  annotation experience, recruited following Visser et al. 2020's
  qualification standard.
- **Cohort N (novice).** Two annotators with domain familiarity
  (deliberation / argumentation) but no prior Walton-scheme annotation
  experience.

### Conditions

- **Condition unprimed.** Each annotator independently assigns one
  scheme per inference from the WRM 2008 Ch. 9 catalogue, *without*
  seeing identification patterns.
- **Condition primed.** Same as unprimed, but each candidate scheme is
  presented alongside its identification patterns (and a "matches /
  doesn't match" toggle the annotator fills in).
- Within-annotator order is randomised; a 14-day washout separates
  conditions per annotator to mitigate carry-over.

### Metrics (frozen)

- **Primary (H1).** $\kappa_{match}$ vs $\kappa_{no\text{-}match}$ in
  the unprimed condition. Both cohorts pooled. $\Delta\kappa$ reported
  with 95% bootstrap CI.
- **Secondary (H2).** $\Delta\kappa_{N} - \Delta\kappa_{T}$ (i.e.
  cohort-difference-of-differences).
- **Exploratory (H3).** $\kappa_{primed} - \kappa_{unprimed}$ per
  cohort.

## Analysis plan (frozen)

- **H1 supported:** $\Delta\kappa \geq 0.10$ with 95% CI excluding 0.
- **H1 null:** $\Delta\kappa \in [-0.05, 0.10]$ with CI including 0.
- **H1 contradicted:** $\Delta\kappa \leq -0.05$ with CI excluding 0
  (pattern-matched arguments are *less* agreeable — would indicate
  patterns mis-direct attention).
- **H2 supported:** $\Delta\kappa_N - \Delta\kappa_T \geq 0.05$.
- **H3 supported:** $\kappa_{primed} - \kappa_{unprimed} \geq 0.10$
  per cohort, with overlapping CIs across cohorts.

## Sample size and power

505 inferences from Visser et al. 2020 split into match / no-match
sub-samples (expected split ~60/40 based on production-catalogue
pattern coverage) gives power > 0.8 at $\Delta\kappa = 0.10$ under
standard Fleiss-Cohen variance. Cohort comparison (H2) is
under-powered with 2-vs-2 annotators and is reported descriptively.

## Stopping rule

Recruit both cohorts; run unprimed condition fully on all four
annotators; report H1 and H2. If H1 is supported, proceed to primed
condition for H3; if H1 is null or contradicted, run primed condition
only on cohort N for confirmation, then stop.

## Interpretation

- **H1 supported + H2 supported.** Identification patterns help novices
  more than experts — patterns serve as *training wheels* that recover
  expert-level discriminations. This argues for patterns as an
  onboarding device, not as constitutive of scheme identity.
- **H1 supported + H2 null.** Patterns help all annotators equally —
  patterns are doing real classificatory work above and beyond what
  scheme labels alone supply. Strengthens the admin's pattern field as
  load-bearing.
- **H1 null.** Patterns do not improve agreement. Cluster D should be
  re-framed: scheme assignment is declaration-driven, not pattern-
  driven, and the admin's pattern field should be re-documented
  accordingly.
- **H1 contradicted.** Patterns mis-direct annotators. The admin's
  pattern field is harmful and should be redesigned.

## Data and code

- Annotation interface: `experiments/scheme-kappa-conditional-S006/`
  (to be created on study start).
- Corpus snapshot: US2016 sample import + pattern-mapping table, both
  frozen at study start.
- Analysis script:
  `experiments/scheme-kappa-conditional-S006/analysis/S006.R`.

## Pre-registration freeze

(Hash to be inserted at first commit of this file.)

## Post-analysis (to be filled)

- Result:
- Surprises:
- Feeds: Cluster D of the foundations doc; SC14 verdict; comparison against the published κ = 0.723 baseline; informs the admin's pattern field design jointly with S004 and S005.
