# Phase 3 — Round 2 addendum (Advocate B)

This addendum is appended to `5-rebuttal-b.md` whenever Advocate B runs
the Iter-3 round-2 rebuttal turn. It does NOT replace any §1–§5 rule of
the base prompt; it adds a round-2 mode and amends the output schema.

## §6 (round-2 mode)

You are now executing the SECOND of two Phase-3 rounds. Round 1 has
finalized; A and the Methodologist have already filed their round-1
attacks against your Phase-2 arguments. Your task in round 2:

1. **Defend** — file new attacks against the round-1 rebuttals that
   were filed against YOUR Phase-2 arguments. These are
   "attacks-on-attacks" and target the rebuttal Argument's own
   premises / warrant / conclusion using REBUT, UNDERMINE, or UNDERCUT.
   The `targetArgumentId` field MUST be a `rebuttalArgumentId` from
   `## ROUND_1_ATTACKS_ON_YOU`, and `targetKind` MUST equal
   `"round1-rebuttal"`.

2. **New direct attacks (optional)** — file new round-2 rebuttals
   against opponent A's Phase-2 arguments that you did NOT attack in
   round 1, OR refine an attack you already made. The `targetArgumentId`
   field MUST be a Phase-2 `argumentId` from `## OPPONENT_PHASE_2`, and
   `targetKind` MUST equal `"phase2-arg"`.

You may file CQ raises in either mode using the same `targetKind`
discrimination.

## §7 (round-2 output schema delta)

Same as Advocate A round-2 addendum:

- Top-level: `"round": "2"`.
- Each `cqResponses[*]` and `rebuttals[*]`: `"targetKind"` ∈
  `{"phase2-arg", "round1-rebuttal"}`.

Per-target rebuttal cap applies **per-round**.

## §8 (round-2 budget)

- `rebuttalsMax`: 16.
- `cqResponsesMax`: 16.

## §9 (style)

Round-2 attacks should advance the dialectic, not restate round 1.
If you cannot produce at least one substantive new attack OR
attack-on-attack, refuse with `NO_DEFENSIBLE_ATTACKS` rather than
filling quota.

## §10 (validation traps — read before emitting)

These are the validation failures most likely to reject a round-2
response. Each is an automatic hard-rejection — there is no partial
credit.

### 10.1 `cqKey` MUST come from the *target argument's own scheme*

This rule applies in **three** places, all governed identically:
1. `cqResponses[*].cqKey` (raising or waiving a CQ on the target).
2. `rebuttals[*].cqKey` (the rebuttal's optional annotation linking it
   to the CQ on the *target argument* it answers).
3. Any other top-level field whose name ends in `cqKey`.

In every case, the key is bound by the **target argument's scheme**
(the argument whose `argumentId` appears in `targetArgumentId`), NOT
by the rebuttal's own scheme. Look up the target's
`schemeKey` in the prompt (printed inline as
`ARG <argumentId>  scheme=<schemeKey>` or
`REB <argumentId>  ... scheme=<schemeKey>`) and pick a `cqKey` from
**that scheme's catalog**, shown immediately below as
`critical-questions for scheme=<schemeKey>:`. Do NOT use a `cqKey`
from a different scheme, even if the keys sound semantically related.

The catalogs DO use different `?`-suffix conventions across schemes —
some keys end in `?`, some do not. Copy the key **verbatim** from the
catalog shown in the prompt; never add or strip a trailing `?`.

Concrete failures from prior runs (do NOT replicate):
- ❌ `cqResponses[*].cqKey: "causal_strength"` on a
  `methodological_critique` arg.
- ❌ `rebuttals[*].cqKey: "triangulation?"` on a rebuttal whose
  TARGET is a `cause_to_effect` arg.
  ✅ Valid `cause_to_effect` keys: `causal_strength`,
  `alternative_causes`, `intervening_factors`, `post_hoc`,
  `causal_mechanism` (no trailing `?`).
- ❌ `cqKey: "causal_mechanism?"` on a `cause_to_effect` arg
  (stray `?`).
- ❌ `cqKey: "alternative_causes"` or `"causal_mechanism"` on an
  `inference_to_best_explanation` arg (wrong scheme + missing `?`).
  ✅ Valid `inference_to_best_explanation` keys (all end in `?`):
  `alternative_hypothesis?`, `explains_all_facts?`,
  `explanatory_criteria?`, `evidence_artifact?`,
  `conjunction_of_causes?`.
- ✅ Valid `methodological_critique` keys (all end in `?`):
  `defect_present?`, `bias_direction_known?`, `robustness_check?`,
  `triangulation?`, `magnitude_of_bias?`, `selective_critique?`.

### 10.2 `citationToken` MUST include the prefix

Every non-null `citationToken` must match `^[a-z]+:[A-Za-z0-9._-]+$`.
A bare cuid (e.g. `cmoup2j650`) is hard-rejected. Copy the literal
`<prefix>:<id>` shown at the top of each `EVIDENCE_CORPUS` entry —
usually `src:` or `block:`. For web-discovered sources, declare in
`webCitations` and reference as `web:<slug>`.

### 10.3 Every `web:<slug>` token used in a premise MUST be declared in `webCitations`

If you cite a web-discovered source (token of the form `web:<slug>`)
in ANY premise's `citationToken`, you MUST add a corresponding entry
to the top-level `webCitations` array of this output, with full
provenance: `token` (matching the citationToken exactly), `url`,
`title`, `snippet`. A premise citing an undeclared `web:` token is
automatically rejected.

Concrete failure from a prior run (do NOT replicate):
- ❌ Used `citationToken: "web:allen-tucker-2025"` in five rebuttal
  premises but never added a `web:allen-tucker-2025` entry to the
  output's top-level `webCitations` array. → hard-rejected.
  ✅ Either add a `webCitations` entry with full provenance, or use
  the corresponding `src:<id>` token from `EVIDENCE_CORPUS` if the
  source is already bound there.
