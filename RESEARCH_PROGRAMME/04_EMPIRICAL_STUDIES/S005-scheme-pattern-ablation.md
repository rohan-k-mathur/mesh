# S005 — Pattern-vs-content ablation for scheme classification

- **status:** pre-registered (stub; awaits dataset selection and model freeze)
- **type:** computational empirical (classifier ablation)
- **registered-on:** 2026-05-27
- **author:** (programme seed)
- **feeds:** Q-013 (taxonomy → CQ generator coverage, indirectly); identification-pattern leg of Cluster D of [`../../Development and Ideation Documents/ARCHITECTURE/SCHEMES_THEORETICAL_FOUNDATIONS.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_THEORETICAL_FOUNDATIONS.md); SC15 in [`../../Development and Ideation Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_LITERATURE_REVIEW.md)

## Background

The substrate's [`SchemeCreator.tsx`](../../components/admin/SchemeCreator.tsx)
exposes `identificationPatterns` as load-bearing classifier features.
The literature review (§5, Bucket 4) confirms that *no published study
has isolated the contribution of pattern heuristics to scheme-classifier
accuracy via ablation against a content-only baseline*. Feng & Hirst
2011 use scheme-specific features but do not ablate them against
content. Ruiz-Dolz, Kikteva & Lawrence 2025 reports SOTA macro-F1 = 62.3
on the 8-class scheme-family task with NLAS-Processed pre-training but
does not run the ablation. The gap is actionable and the study is
publishable as a standalone contribution.

## Hypotheses

**H1 (primary, directional).** Adding identification-pattern features to
a content-only baseline classifier improves macro-F1 on the 8-class
scheme-family task by **ΔF1 ≥ 3 points** (i.e. ≥ 5% relative
improvement over the ~62 baseline). Threshold deliberately set just
below SOTA noise to make the test non-trivial.

**H2 (secondary, directional).** The improvement in H1 is concentrated
in schemes whose identification patterns have **high cue-phrase
distinctiveness** (operationalised as: top-quartile of patterns by
average PMI between pattern n-grams and scheme label). For
low-distinctiveness schemes, ΔF1 is null.

**H3 (corpus-portability, exploratory).** The pattern-feature
improvement transfers from the US2016 corpus (Visser et al. 2020) to the
QT-Schemes corpus (Ruiz-Dolz et al. 2025) with ΔF1 degradation ≤ 1
point.

## Design

### Datasets

- **Primary corpus.** US2016 (Visser et al. 2020), Walton-scheme
  annotations on televised election debates; 505 inferences in their
  reported $\kappa = 0.723$ sample, ≥ 4000 inferences total.
- **Secondary corpus.** QT-Schemes (Ruiz-Dolz et al. 2025), 441
  arguments, 24 schemes, $\kappa = 0.39$ at annotation.
- **Splits.** 80/10/10 train/dev/test with stratification on scheme
  label and topic (debate or QT episode); identical splits across all
  conditions.

### Models

- **Backbone.** RoBERTa-base for all conditions (matches Ruiz-Dolz et
  al. 2025 ROBERTA-AF-PROC-DIAL backbone, modulo the synthetic
  pre-training they use; we *do not* pre-train on NLAS-Processed in this
  study to isolate the pattern-vs-content effect).
- **Condition A — content-only baseline.** Argument text only. No
  identification-pattern features. Fine-tuned on US2016 train split.
- **Condition B — content + patterns.** Same as A, but with a
  per-scheme binary feature for "does at least one identification
  pattern match this argument?" concatenated to the [CLS] token
  representation before the classification head. Patterns drawn from
  the production catalogue's `identificationPatterns` field.
- **Condition C — patterns-only sanity.** Patterns without text;
  classifier sees only the pattern-match vector. Establishes a floor.

### Metrics (frozen)

- **Primary.** Macro-F1 on the 8-class scheme-family task (matches
  Ruiz-Dolz et al. 2025's reportable metric).
- **Secondary.** Per-scheme F1; precision and recall per scheme;
  confusion matrix; per-distinctiveness-quartile macro-F1 for H2.
- **Corpus-portability.** Zero-shot macro-F1 of B on QT-Schemes test
  split.

### Analysis plan (frozen)

- **H1 supported:** macro-F1(B) − macro-F1(A) ≥ 3 with 95% bootstrap CI
  excluding 0.
- **H1 null:** ΔF1 ∈ [-1, 3] with CI including 0.
- **H1 contradicted:** ΔF1 ≤ -1 with CI excluding 0 (patterns *hurt*).
- **H2 supported:** ΔF1 on top-distinctiveness-quartile schemes ≥ 5;
  ΔF1 on bottom quartile ∈ [-1, 1].
- **H3 supported:** macro-F1(B on QT-Schemes) ≥ macro-F1(A on
  QT-Schemes) − 1.

## Sample size and power

US2016 alone is sufficient for H1 detection at ΔF1 ≥ 3 with ~4000
inferences (power > 0.9 at α = 0.05 under standard ablation noise).
H3's portability arm is *exploratory*; QT-Schemes' 441 arguments are
under-powered for confident corpus-portability claims and the result
is reported descriptively with confidence intervals.

## Stopping rule

Run all three conditions on US2016 to completion; report. If H1 is
clearly supported, proceed to H3 portability arm on QT-Schemes; if H1
is null or contradicted, document and stop (H2/H3 are conditional on
H1).

## Interpretation

- **H1 supported.** Identification patterns are doing real classifier
  work. The admin's pattern field is *load-bearing for the classifier
  layer* and earns its keep. Cluster D's declaration-reading is
  strengthened relative to MAP-inference and behaviour-derived readings.
- **H1 null.** Patterns are decoration at the model layer; whatever
  classificatory work they do is recovered by the content classifier.
  The admin's pattern field is *documentation, not features*; this
  pushes Cluster D toward declaration-only or behaviour-derived
  readings.
- **H1 contradicted.** Patterns *mis-direct* the classifier. The admin's
  pattern field is actively harmful as a feature; the substrate should
  either re-design the pattern format or retire the field for
  classifier purposes.

## Data and code

- Experiment harness: `experiments/scheme-pattern-ablation-S005/` (to
  be created on study start).
- Corpus snapshots: US2016 import script + QT-Schemes import script,
  both frozen at study start; corpora not redistributed (under their
  original licences).
- Analysis script: `experiments/scheme-pattern-ablation-S005/analysis/S005.py`.

## Pre-registration freeze

(Hash to be inserted at first commit of this file.)

## Post-analysis (to be filled)

- Result:
- Surprises:
- Feeds: Cluster D of the foundations doc; SC15 verdict; identification-pattern field design in the admin.
