# Phase 4 — Sub-round B addendum (Defense A)

This addendum is appended to `6-defense-a.md` whenever Advocate A runs
the Iter-3 sub-round-b defense turn. It does NOT replace any §1–§5
rule of the base prompt; it adds a sub-round-b mode and amends the
output schema.

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
   round-2 `rebuttalArgumentId` (the opponent's attack on your
   rebuttal). The `defense.attackType` you emit attacks THAT round-2
   rebuttal — same shape as sub-round-a, just one level deeper in the
   chain.

You also see in the prompt your own sub-round-a defenses (in
`## YOUR_SUB_ROUND_A_DEFENSES`) so you can avoid restating arguments
you already made.

## §7 (sub-round-b output schema delta)

- Top-level: `"subRound": "b"` (replaces the implicit `"a"`).
- Same `responses[]` and `cqAnswers[]` shape; targets resolve to
  round-2 attack ids instead of round-1.

## §8 (sub-round-b budget)

Same caps as sub-round-a; no per-target multiplication.

## §9 (style)

If a round-2 attack-on-attack is methodologically vapid (just restates
the round-1 attack with stronger adjectives), prefer concede with a
brief rationale over a defense that would itself be vapid.
