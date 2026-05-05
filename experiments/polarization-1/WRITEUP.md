# Polarization-1: Experiment Writeup

**Run:** Polarization-1 (multi-agent dialectical-testing experiment, Run 1)
**Deliberation:** `cmoqp0jzk00iu8c01gmg7qa68`
**Evidence stack:** `cmoqoydh100gb8c010zk93p2p`
**Model tier:** prod (Claude `opus-4-5-20251101` for advocates/challenger/analyst; Claude `haiku-4-5-20251001` for soft-check judges)
**Phases run:** 1–4, finalized end-to-end
**Date:** May 2026

---

## 1. Executive summary

Polarization-1 was the first end-to-end run of the four-phase dialectical-testing harness on a non-trivial contested claim. The central claim — *"Algorithmic content curation on major social media platforms has been a significant causal factor in the rise of political polarization in the US between 2012 and 2024"*, where "significant" was operationalized as ≥10% of observed affective-polarization growth — went into Phase 4 supported by 30 arguments from Advocate A and attacked by 18 arguments from Advocate B (with B both rebutting A and defending B's own position from A's prior rebuttals).

The Concession Tracker's verdict was **PUSHED_TOWARD_REJECTION**, not REJECTED. The asymmetry was decisive on hinges:

| Role | Total args | Stood / Weakened / Fallen | Hinge args (Stood / Weakened / Fallen) |
|---|---|---|---|
| A (pro-causation) | 30 | 17 / 5 / 8 | 12 → 4 / 3 / 5 |
| B (skeptic) | 18 | 14 / 4 / 0 | 11 → 10 / 1 / 0 |

A conceded 5 of 7 attacks on hinge arguments (71%), including the operationally critical one — the 10%-of-growth threshold itself — and an engagement-differentials inference. B's hinges held almost entirely intact, with the strongest survivors being the 2023 Meta feed-substitution null results. The verdict was correctly *not* "REJECTED": four of A's hinges still stand, and B has its own quality issues (most notably one strawman defense flagged in Phase 4).

The harness itself worked: every phase produced a partial, every soft-check stack ran, every report parsed, and `recomputeGroundedForDelib` ran cleanly at finalize. It also produced a number of process lessons that should inform polarization-2.

---

## 2. What we built

A four-phase pipeline, each phase ending in a `PHASE_N_COMPLETE.json` artifact and a markdown review report that gates finalize:

1. **Phase 1 — Claim decomposition.** Claim Analyst produced a 9-node typed dependency topology with hinges identified by inbound-edge count. 18 edges. Hinges: #2 (algorithmic amplification), #3 (experimental causation), #4 (population-aggregation magnitude). 1 review flag, accepted.
2. **Phase 2 — Advocate construction.** Both advocates instantiated arguments per sub-claim, drawing from a bound evidence corpus. 48 arguments, 113 premise claims, 56 citations. Soft checks fired 49 flags (mostly evidence-fidelity partials and scheme-appropriateness mismatches). 40 revised, 7 retracted, 2 accepted as-is.
3. **Phase 3 — Challenger attacks on hinges.** Challenger drove rebuttals/undercuts/undermines against hinge arguments from both advocates plus selected non-hinges. 26 rebuttals, 12 CQ raises, 90 premise claims, 45 citations. 17 flags, almost all evidence-fidelity partials. 16 accepted, 1 revised.
4. **Phase 4 — Concessions, defenses, tracker.** Each advocate responded to the other side's Phase-3 attacks with one of: defend (counter-rebuttal with new premises), narrow (rewrite the original conclusion strictly weaker), or concede (retract the relevant commitment, mark CQ). Then the Concession Tracker produced a per-argument standing (STANDS / WEAKENED / FALLEN) and a central-claim verdict. 13 defenses, 11 concedes, 3 narrows, 8 review flags, all accepted.

Across all four phases: 88 review flags; 67 accepted, 41 revised, 7 retracted. No phase needed a re-run for content reasons; only infrastructure bugs forced re-runs (see §4).

---

## 3. Substantive findings (the topic)

The experiment is not a literature review and shouldn't be read as one — what it tells us is what survives a structured back-and-forth on a particular evidence stack with two LLM advocates. With that caveat:

- **The 10% threshold is the load-bearing operational decision.** A's first concession in Phase 4 (`phase4-A-r0`) was that direct experimental evidence does not establish the ≥10%-of-growth threshold. Once that goes, the structural path from individual-level effects to population-level magnitude (sub-claim #4) is broken. Every subsequent collapse on hinge arguments was downstream of this.
- **The 2023 Meta feed-substitution experiments dominate the record.** B's strongest hinges (`cmorhzduf…`, `cmorhzk9x…`, `cmorhzrz1…`, `cmori06b7…`) all survived A's attacks on temporal scope (3 months ≪ 12 years) and on spillover/SUTVA contamination. A's responses to these attacks were either narrowings or concessions; B's responses to attacks on these hinges were defends with substantive evidence-grounded counter-arguments.
- **Engagement-pattern arguments do not bridge to polarization outcomes.** A's `phase4-A-r1` concession explicitly recognized that demonstrating differential engagement on partisan content does not establish that algorithms cause affective polarization when the best-identified experiments find null effects on the polarization outcome itself. This is the conceptual core of the asymmetry.
- **B's record is not unblemished.** The Phase-4 strawman flag on `cmorl9dtv…` is substantive: B replied to "backfire requires algorithms" rather than to the actual rebuttal, which was about *algorithmic selection and framing* of cross-partisan content — i.e., algorithms decide which opposing views you encounter and in what context. Bail-via-bots demonstrates exposure-without-algorithm; it doesn't speak to selection. This single defense, if the rebuttal had been pressed harder in a putative Phase 5, could weaken one of B's standing hinges.
- **Evidence-fidelity is the single most common failure mode across the run.** 27 partial + 7 not-supported in Phase 2; 16 partial + 1 not-supported in Phase 3; 4 partial + 1 not-supported in Phase 4. The recurring pattern is overspecification: the cited paper plausibly supports the claim being made, but the *abstract* (which is what the judge sees) doesn't, so the premise overstates what the citation can carry.

The verdict PUSHED_TOWARD_REJECTION is well-calibrated. A real rejection would require closing off the surviving 4 hinges of A's; the run did not attempt that, and the four survivors are non-trivial (network effects, elite-rhetoric amplification, the YouTube-recommendation literature, the persistence-via-habituation argument).

---

## 4. Methodological findings (the framework)

Things the harness did well:

- **Hinge identification by inbound-edge count is vindicated.** The three identified hinges (#2, #3, #4) really were where the load lived. Concessions on hinges propagated to verdict-level effects; concessions off-hinge did not.
- **Sequential A→B with shared `ClaimRegistry`** worked as designed. No cross-advocate claim-text collisions, no double-mints, no orphaned commitments.
- **The soft-check / report / finalize loop is a usable governance pattern.** Every flag was either accepted with substantive notes or revised before finalize. The `**Applied:** <ts>` marker requirement caught one near-miss in Phase 2 where a flag would otherwise have slipped through.
- **`recomputeGroundedForDelib` integration** at Phase-4 finalize closed the loop between the orchestrator's view of standings and the deliberation's persisted state. No drift.
- **The Concession Tracker's structural-validation retry pattern** (3 attempts, with explicit ground-truth counts injected into the user message) is the right shape. It went from 2 → 3 attempts mid-run; the second pass produced a valid verdict on attempt 2.

Things that need work:

- **Evidence fidelity is judged against the abstract only, but advocates write against their internal model of the paper.** This produces a structural overspecification bias. Either (a) judges should see methods sections, or (b) advocates need an explicit "what does the abstract alone support?" pass before mint, or (c) the schema needs to distinguish "claim grounded in abstract" from "claim grounded in paper, citation gives the right paper but not the supporting passage."
- **Citation tokens are being asked to do two different jobs.** Some premises are empirical claims that need the citation; others are analytical/methodological claims (e.g., A's "if volunteers are less susceptible, null findings would be conservative" in Phase 4 — Flag 4) that *use* a cited finding as a starting point but make an inferential step the citation cannot support. The current schema treats both the same and judges both with `evidence_fidelity`. They should be split: `cited_factual` vs `analytical_inference`, with the latter not running through the fidelity judge.
- **Tracker validation on Phase-2 argument counts is brittle.** Both Phase-4 attempts at the tracker hit hinge-tally mismatches that were off-by-one. Injecting authoritative counts into the user message fixed it on this run, but the right structural answer is to send the LLM a partial pre-filled object with `totalArguments` and `hingeCount` fields already populated and ask it only to fill in the standings.
- **`CQStatusEnum` did not cleanly model the concede-vs-defend asymmetry.** This was the primary infra bug of the session: `defense-mint.ts` was written assuming a `REJECTED` enum value that doesn't exist in the schema. The fix used `DISPUTED` for concedes and `SATISFIED` for answers, with the polarity carried in the legacy `status` string field. This works but is semantically muddled — `DISPUTED` is supposed to mean "conflicting responses or new challenges," not "the challenge was sustained." A future schema migration should add explicit values (`SATISFIED_FOR_RAISER` / `SATISFIED_FOR_DEFENDER` or similar) or rename `SATISFIED` to be polarity-aware.
- **Resume logic worked but felt fragile.** When the first Phase-4 prod run crashed mid-mint, advocate-a's partial state was undefined until the second run completed it. Future driver passes should checkpoint after each advocate's `translateDefenseOutput` succeeds, not at the end of `runPhase`.
- **Token cost is concentrated at the tracker.** Phase 4 totals: 133k in / 31k out; the tracker alone was 90k in / 22k out (roughly 70% of phase input). Most of that is re-rendered Phase-2/3/4 prompts. There's a clear caching opportunity here.

---

## 5. What changes for polarization-2

Concrete, in priority order:

1. **Schema migration: add CQ-resolution polarity to `CQStatusEnum`.** Either new enum values or a discriminator column. Update `attack-mint.ts` and `defense-mint.ts` together.
2. **Split citation-bound premises from analytical inferences in the advocate schema.** Add a `kind: "cited" | "analytical"` discriminator on `PremiseZ`. Only `cited` premises run through `evidence_fidelity`. `analytical` premises run through a new `inferential_validity` judge that doesn't reference the citation corpus.
3. **Pre-fill the tracker's `advocateSummaries` skeleton on the user side.** Send `{advocateRole, totalArguments, hingeCount}` for both A and B as fixed; the LLM only fills `stoodCount/weakenedCount/fallenCount` and the per-argument standings. This eliminates the off-by-one failure mode entirely.
4. **Per-advocate checkpointing in Phase-4 driver.** Write `PHASE_4_PARTIAL.json` after each advocate completes mint, not just at the end of the phase.
5. **Pre-mint "what does the abstract alone support?" check on Phase-2/3 advocates.** A lightweight self-review pass before the LLM commits to a premise. Should reduce evidence-fidelity flag volume substantially.
6. **Tracker prompt caching.** The Phase-2/3/4 prompt blocks the tracker re-renders are stable across attempts; they should be cacheable across the retry loop, and ideally across the whole run.
7. **Optional: a Phase-5 ("contested-survivor") pass** that re-attacks each STANDING hinge with the strongest argument the loser's strawman/deflection flag suggested. This is not a re-run of Phase 3; it's a targeted second-shot for arguments that won on weak engagement. Would have caught the Bail-selection-vs-bypass distinction in this run.

---

## 6. Artifacts

- Phase complete files: `experiments/polarization-1/runtime/PHASE_{1,2,3,4}_COMPLETE.json`
- Phase reviews (annotated with verdicts and `**Applied:**` markers): `experiments/polarization-1/runtime/reviews/phase-{1,2,3,4}-review.md`
- Tracker verdict: `experiments/polarization-1/runtime/llm/phase-4-tracker-verdict.json`
- Logs: `experiments/polarization-1/runtime/logs/`
- Framing: `experiments/polarization-1/FRAMING.md`
