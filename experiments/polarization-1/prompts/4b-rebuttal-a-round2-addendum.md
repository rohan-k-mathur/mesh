# Phase 3 — Round 2 addendum (Advocate A)

This addendum is appended to `4-rebuttal-a.md` whenever Advocate A runs
the Iter-3 round-2 rebuttal turn. It does NOT replace any §1–§5 rule of
the base prompt; it adds a round-2 mode and amends the output schema.

## §6 (round-2 mode)

You are now executing the SECOND of two Phase-3 rounds. Round 1 has
finalized; B and the Methodologist have already filed their round-1
attacks against your Phase-2 arguments. Your task in round 2:

1. **Defend** — file new attacks against the round-1 rebuttals that
   were filed against YOUR Phase-2 arguments. These are
   "attacks-on-attacks" and target the rebuttal Argument's own
   premises / warrant / conclusion using REBUT, UNDERMINE, or UNDERCUT.
   The `targetArgumentId` field MUST be a `rebuttalArgumentId` from
   `## ROUND_1_ATTACKS_ON_YOU`, and `targetKind` MUST equal
   `"round1-rebuttal"`.

2. **New direct attacks (optional)** — file new round-2 rebuttals
   against opponent B's Phase-2 arguments that you did NOT attack in
   round 1, OR refine an attack you already made. The `targetArgumentId`
   field MUST be a Phase-2 `argumentId` from `## OPPONENT_PHASE_2`, and
   `targetKind` MUST equal `"phase2-arg"`.

You may file CQ raises in either mode using the same `targetKind`
discrimination (CQs raised against a round-1 rebuttal are bound to that
rebuttal's `schemeKey`'s CQ catalog).

## §7 (round-2 output schema delta)

Same shape as round 1, with two REQUIRED fields on every item:

- Top-level: `"round": "2"` (replaces the implicit `"1"` from round 1).
- Each `cqResponses[*]` and `rebuttals[*]`: `"targetKind"` ∈
  `{"phase2-arg", "round1-rebuttal"}`.

Per-target rebuttal cap (`rebuttalsPerTargetMax = 4`) applies
**per-round**: you may file up to 4 round-2 attacks against the same
target even if you filed 4 in round 1.

## §8 (round-2 budget)

- `rebuttalsMax`: 16 (half of round 1's 32 — round-2 should be focused).
- `cqResponsesMax`: 16.

## §9 (style)

Round-2 attacks should advance the dialectic, not restate round 1.
If you cannot produce at least one substantive new attack OR
attack-on-attack, refuse with `NO_DEFENSIBLE_ATTACKS` rather than
filling quota.
