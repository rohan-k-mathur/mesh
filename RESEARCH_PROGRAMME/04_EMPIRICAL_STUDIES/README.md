# Empirical Studies Register — Policy and Pre-registration Template

> All computational experiments and user studies that the programme draws
> evidence from are pre-registered here *before* data is generated or
> collected. A study without a pre-registration is not evidence.

## What counts as a study

Two kinds:

- **Computational study.** A run of synthetic deliberations under a
  controlled protocol (e.g. the `polarization-1*` family in
  [`../../experiments/`](../../experiments/), or the seeded runs documented
  in [`../../ludics-development-roadmaps-research/seededludicsdelibresults*.txt`](../../ludics-development-roadmaps-research/)).
- **User study.** A controlled or observational study using real platform
  data (or, in the future, lab studies of platform UIs).

## Required sections

Every study file `SNNN-slug.md` carries:

```
# SNNN — <title>

- status: pre-registered | running | analysed | abandoned
- type: computational | observational | controlled-user
- registered-on: YYYY-MM-DD
- analysed-on: YYYY-MM-DD (filled at analysis time)
- author: <handle>

## Hypothesis
- Primary H1 (point prediction or directional effect)
- Optional H2, H3 (secondary)

## Design
- Population / data source
- Protocol (one paragraph)
- Manipulation (if any) or observation window

## Metrics (frozen before data)
- Primary metric, with the analysis it will feed
- Pre-specified covariates
- Pre-specified subgroup analyses

## Analysis plan (frozen before data)
- Statistical test or descriptive comparison
- Threshold (α, effect-size, etc.) by which a result is "supportive"
- What a null result looks like
- What a contradictory result looks like

## Stopping rule
- When data collection ends

## Data and code
- Where the data goes
- Where the analysis script goes

## Pre-registration freeze
- Hash / commit of this file at registration time

## Post-analysis (filled later)
- Result
- Surprises (and whether they trigger a follow-up study)
- Closes: Q-NNN or "feeds C-NNN" or "feeds Q-NNN but does not close"
```

## Seed studies

- [S001 — Synthesis quality vs defence asymmetry in `polarization-1`](S001-polarization-defense-asymmetry.md)
- [S002 — Cone coverage vs dialogical convergence in seeded deliberations](S002-cone-coverage-convergence.md)
- [S003 — MCP-authored vs human-authored argument survival](S003-mcp-ai-vs-human-authorship.md)
