# Follow-up — `weakestLink` CQ-count heuristic in the chain-exposure evaluator

**Status:** follow-up note (no code change yet)
**Surfaced by:** PART 3 chain-creation Claude Desktop smoke test (2026-06-01).
**Component:** [lib/deliberation/chainExposure.ts](../../lib/deliberation/chainExposure.ts) — the
`weakestLink` selection inside `computeChainExposure`.
**Consumer:** [app/api/argument-chains/quick-chain/route.ts](../../app/api/argument-chains/quick-chain/route.ts)
echoes `weakestLink` in the `propose_argument_chain` response.

---

## 1. What the smoke test exposed

The 3-link caffeine chain (`cause_to_effect` → `cause_to_effect` →
`negative_consequences`) came back `untested-default` with **link 1 named as the
weakest link, reason "5 unanswered CQ(s)"**. The model (correctly) pushed back:
link 1 is *not* the epistemically weakest step. The genuinely contestable moves
are link 2's correlational→causal leap ("disrupts sleep" → "impairs
neurodevelopment") and link 3's normative jump (suppressing dose, magnitude, and
any offsetting benefit). Link 1 was flagged only because `cause_to_effect` carries
**5** critical questions versus `negative_consequences`'s **3** — a property of the
*scheme catalogue*, not of where the argument is fragile.

That observation is right, and it actually understates the problem: the selection
isn't even doing what its own comment claims.

## 2. What the code actually does

```ts
// weakest link: argument with lowest fitness; tie-break by most missing CQs.
let weakestArgId = argIds[0] ?? "";
let weakestScore = Number.POSITIVE_INFINITY;
for (const a of argIds) {
  const m = argMetrics.get(a);
  if (!m) continue;
  if (m.fitness.total < weakestScore) {          // strict <
    weakestScore = m.fitness.total;
    weakestArgId = a;
    const missingCqs = m.cqRequired - m.cqAnswered;
    weakestReason = missingCqs > 0
      ? `lowest fitness (${m.fitness.total}); ${missingCqs} unanswered CQ(s)`
      : `lowest fitness (${m.fitness.total})`;
  }
}
```

Two distinct issues:

1. **The tie-break is not implemented.** The comment says "tie-break by most
   missing CQs," but the loop uses a strict `<` on `fitness.total`. When every
   link sits at the same fitness (the `untested-default` floor — `cqAnswered=0`,
   no edges, no provenance → all components 0), **no link ever beats the
   incumbent**, so the winner is simply `argIds[0]` — the **spine root**, by
   iteration order. Link 1 "won" because it is first, not because it has 5 CQs.
   The `5 unanswered CQ(s)` in the reason string is *post-hoc narration* of
   whichever link iteration order already picked.

2. **`missingCqs` conflates surface area with fragility.** `cqRequired` is read
   from the link's primary scheme's `cqs.length`
   ([chainExposure.ts](../../lib/deliberation/chainExposure.ts) — the
   `computeArgumentMetricsBatch` pass). At the untested floor `cqAnswered = 0`,
   so `missingCqs == cqRequired` — a pure scheme constant. A scheme with more CQs
   always *looks* more exposed, even though more CQs is a sign of a
   well-characterised pattern, not a weaker argument. `fitness.total` itself has
   the mirror-image bias: its `cqAnswered` component **rewards answered CQs**, so
   the two signals (fitness rewards answered-count; reason penalises
   required-count) measure different axes and can disagree.

**Net effect:** for any freshly-minted chain (the common case for
`propose_argument_chain`, which mints everything untested), `weakestLink` is
**uninformative** — it deterministically points at the first link and attaches a
scheme-derived CQ count as if it were a verdict.

## 3. Why it matters for the chain write surface

`propose_argument_chain` returns `weakestLink` at write-time as a headline honesty
signal ("a chain is only as citable as its weakest link"). When that signal is an
artefact of spine order + CQ catalogue size, it (a) misdirects the author's
attention away from the real soft joints, and (b) makes a scheme with richer CQ
coverage look like a liability, which is backwards relative to the whole
scheme-ontology programme (we *want* callers to pick well-characterised patterns).

## 4. Options (smallest → largest)

- **(A) Honesty-only fix (no behaviour change).** Correct the comment and the
  reason string so they stop implying a verdict at the untested floor. When all
  links tie at `untested-default`, return `weakestLink: null` (or a
  `reason: "no differentiation — all links untested"`). Cheapest; removes the
  misleading claim without re-ranking anything.

- **(B) Normalise CQ pressure.** Replace raw `missingCqs` with the *fraction*
  unanswered (`(cqRequired - cqAnswered) / max(cqRequired, 1)`). A 5-CQ and a
  3-CQ scheme both at zero answered are then equally exposed (1.0 each), instead
  of the 5-CQ scheme ranking weaker for free. Keeps fitness as the primary key;
  only the tie-break (and reason) change. Requires actually implementing the
  tie-break the comment already promises (secondary sort key on ties).

- **(C) Make the tie-break structural, not CQ-count-based.** When links tie at the
  floor, prefer the link that is *structurally* most exposed — e.g. the link
  whose conclusion is reused as a premise downstream (a broken early link
  poisons everything after it), or the normative/scheme-transition links flagged
  by the verifier. This needs a fragility signal the evaluator doesn't currently
  compute; defer until there's a concrete consumer.

**Lean:** ship **(A)** now (it's a correctness/honesty fix and removes the
specific misdirection the smoke test caught), and pair it with **(B)** so ties
that *do* break, break on a normalised signal rather than scheme size. **(C)** is
a real research question (where is a chain actually weakest?) and should wait for
the verifier-driven fragility work, not be smuggled into a tie-break.

## 5. Out of scope / explicitly not changing here

- The `chainStanding` worst-link aggregation itself (`STANDING_RANK` min over the
  spine) is fine — `untested-default` is the honest standing for a fresh chain.
  Only the `weakestLink` *selection within a tie* is at issue.
- `attackerCredibility` downweighting and `computeFitnessBreakdown` are unrelated
  and correct.

## 6. Pointers

- Selection loop: `computeChainExposure` → `weakestLink` block in
  [lib/deliberation/chainExposure.ts](../../lib/deliberation/chainExposure.ts).
- `cqRequired` / `cqAnswered` derivation: the `computeArgumentMetricsBatch` pass
  in the same file (`cqRequired = primaryScheme.cqs.length`,
  `cqAnswered = SATISFIED count`).
- Write-surface echo: the `weakestLink` field in the `mintAndLinkChain` /
  `composeChain` response builders in
  [app/api/argument-chains/quick-chain/route.ts](../../app/api/argument-chains/quick-chain/route.ts).
- Regression coverage would live alongside `chainAttackerWeighting.test.ts`.
