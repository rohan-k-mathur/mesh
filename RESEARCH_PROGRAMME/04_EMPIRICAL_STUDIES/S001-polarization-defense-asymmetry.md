# S001 — Synthesis quality vs. defence-budget asymmetry in `polarization-1`

- **status:** pre-registered
- **type:** computational
- **registered-on:** 2026-05-27
- **author:** (programme seed)

## Hypothesis

**H1 (primary, directional).** In the `polarization-1-iter3-e2e` protocol,
synthesist judgement score (against the held-out methodologist's rubric)
*decreases monotonically* as the absolute defence-budget asymmetry
between advocate A and advocate B increases, controlling for topic.

**H2 (secondary, exploratory).** The negative effect of asymmetry is
*larger* when the under-budgeted side defends the empirically stronger
claim (measured by evidence-corpus coverage) than when it defends the
weaker one.

## Design

- **Data source.** Re-runs of [`../../experiments/polarization-1-iter3-e2e/`](../../experiments/polarization-1-iter3-e2e/) with the existing prompt stack
  ([`prompts/2-advocate-a.md`](../../experiments/polarization-1-iter3-e2e/prompts/2-advocate-a.md)
  through [`prompts/10-methodologist.md`](../../experiments/polarization-1-iter3-e2e/prompts/10-methodologist.md))
  and the existing evidence corpus
  ([`evidence-corpus.json`](../../experiments/polarization-1-cmp-iter3-off/evidence-corpus.json)).
- **Manipulation.** Defence-budget asymmetry ∈ {0%, 25%, 50%, 75%}
  (tokens/turn given to advocate A vs B). Each cell × topic × 5 runs = 80
  runs minimum.
- **Topics.** 4 topics from the seeded set, balanced for claim difficulty
  per the methodologist's prior rating.

## Metrics (frozen)

- **Primary:** synthesist score 0–10 from the methodologist (mean across
  the methodologist's rubric items, prompt
  [`10-methodologist.md`](../../experiments/polarization-1-iter3-e2e/prompts/10-methodologist.md)).
- **Covariates:** topic, run seed, total tokens used.
- **Subgroups:** by which side was disadvantaged.

## Analysis plan (frozen)

- Mixed-effects linear regression: `score ~ asymmetry + (1|topic) +
  (1|run_seed)`.
- **Supportive of H1:** asymmetry coefficient β < 0 at α = 0.05, effect
  size |β| > 0.3 (one full rubric point per 50% asymmetry).
- **Null result:** |β| < 0.1 or p > 0.2 with 95% CI overlapping zero.
- **Contradictory:** β > 0 at α = 0.05.

## Stopping rule

80 runs minimum; if any cell produces ≥ 2 protocol failures (e.g. agent
refusing the role), the cell is rerun before analysis.

## Data and code

- Raw runs: `experiments/polarization-1-iter3-e2e/runs/S001/` (to be created
  on study start)
- Analysis script: `experiments/polarization-1-iter3-e2e/analysis/S001.R`

## Pre-registration freeze

(Hash to be inserted at first commit of this file.)

## Post-analysis (to be filled)

- Result:
- Surprises:
- Closes: feeds Q-007 (does not close without S001-replication)
