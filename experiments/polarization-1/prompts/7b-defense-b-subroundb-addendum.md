# Phase 4 — Sub-round B addendum (Defense B)

This addendum is appended to `7-defense-b.md` whenever Advocate B runs
the Iter-3 sub-round-b defense turn. Symmetric to
`6b-defense-a-subroundb-addendum.md`.

## §6 (sub-round-b mode)

You are now executing the SECOND of two Phase-4 sub-rounds. Sub-round-a
has finalized; you have already defended (or conceded / narrowed) every
round-1 rebuttal filed against your Phase-2 arguments. Your task in
sub-round-b:

For every **round-2** attack the opponent (or Methodologist) filed
against you, emit exactly one response: defend / concede / narrow.
Round-2 attacks may target either:

1. **Your Phase-2 arguments directly** (new direct attacks the opponent
   did not file in round 1). Treat the same as sub-round-a defenses.

2. **Your round-1 rebuttals** (attacks-on-attacks). Defending here
   means defending one of YOUR own round-1 rebuttals against an
   opponent's round-2 attack. The `targetAttackId` field will be the
   round-2 `rebuttalArgumentId`. The `defense.attackType` you emit
   attacks THAT round-2 rebuttal.

You also see in the prompt your own sub-round-a defenses (in
`## YOUR_SUB_ROUND_A_DEFENSES`).

## §7 (sub-round-b output schema delta)

- Top-level: `"subRound": "b"`.
- Same `responses[]` and `cqAnswers[]` shape.

## §8 (sub-round-b budget)

Same caps as sub-round-a.

## §9 (style)

Prefer concede with a brief rationale over a defense that would itself
be methodologically vapid.
