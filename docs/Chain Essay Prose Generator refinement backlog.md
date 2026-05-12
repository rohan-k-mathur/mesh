# Chain Essay / Prose Generator — refinement backlog

Source files:
- `lib/chains/proseGenerator.ts` (rule-based; no LLM)
- `components/chains/ChainEssayView.tsx`, `ChainProseView.tsx`
- Optional polish path planned in `Development and Ideation Documents/CHAIN_FIRST_CLASS_IMPLEMENTATION/ESSAY_LLM_POLISH_IDEATION.md`

## Evaluated on
Arm-B Phase-6 chain "Hinge #1: Feeling-thermometer measurement validity"
(persuasive tone, expert audience). Output at
`experiments/polarization-1-cmp-iter3-on/runtime/CHAINS.md` and downloaded
essay markdown.

## External validation (2026-05-11)
Claude Desktop, given MCP access to the same deliberation, independently
arrived at the same diagnosis as items 5–11 below (transcript:
`experiments/Claude-ISONOMIA_TOOL-feedback-May11v1.md`). Direct quotes:
- *“The Essay output reads like a template with argument text pasted in…
the rule-based generator hitting the ceiling.”* (→ item 10)
- *“It says ‘the evidence points to an important conclusion’ about a node
that is, per the data I pulled earlier, TESTED-UNDERMINED with fitness
−7.0. That’s actively misleading.”* (→ item 5; **highest-priority** per
external review)
- *“An essay that doesn’t reflect standing isn’t a synthesis of the
deliberation — it’s a brochure for the thesis side.”* (→ items 5 + 11)
- *“If the LLM polish pass is defined as ‘make this read better,’ it’ll
produce fluent versions of the same structural errors.”* (→ confirms
5–7 are prerequisites for 10)

Consequence: items 5, 6, 11 are promoted to top of the structural-redesign
queue; LLM polish (item 10) explicitly blocks on them.

## High-impact bugs (cheap fixes)

1. **Intro splice grammar.** `purpose` field inlined after a fixed
   lead-in like "The question before us concerns …" produces ungrammatical
   sentences when `purpose` itself is a noun phrase starting with a verb.
   Fix: detect first token POS or rewrite the lead-in per chain-type.
2. **First-letter lowercasing of premises.** Premises rendered as
   "First, boxell, Gentzkow …" because we lowercase after "First, ".
   Fix: don't lowercase proper nouns; or skip the case-fold when premise
   already starts with a capital.
3. **Wrong claim text in antithesis frame.** "While some have argued that
   <thesis text>" — antithesis paragraph pulls `chain.thesisClaimText`
   instead of the antithesis node's `argument.conclusion.text`.
   Fix: route by `dialecticalRole === "ANTITHESIS"` to the node's own
   conclusion.
4. **CQs rendered as raw question text concatenated with "and".**
   For expert audience, reframe each CQ as a parenthetical the author
   has *addressed* (or flag as `unanswered`), not as a bullet of unanswered
   prompts. Already-answered CQs (CqStatus rows) should be excluded.

## Structural redesign (medium effort)

5. **Honor `epistemicStatus` per node.**
   - ASSERTED → declarative ("X demonstrates Y").
   - QUESTIONED → hedged ("X plausibly shows Y, though …").
   - SUSPENDED → counterfactual ("If we set aside the original claim, X …").
   - DENIED → past-tense retired ("The original claim that … did not survive").
   Without this, the essay flattens the chain's standings story.
6. **Honor `dialecticalRole`.**
   THESIS / ANTITHESIS / SYNTHESIS / RESPONSE / CONCESSION should drive
   paragraph templates and discourse markers, not the linear node order.
7. **Edge narrative as transitions.** Today the "Flow" section uses one
   short edge summary and drops the rest. Persuasive prose lives in
   transitions: REBUTS → "B counters that …", UNDERCUTS → "Even granting
   the premise, …", QUALIFIES → "More precisely, …".
   Use edge `description` + `strength` to weight inclusion.
8. **Tone presets are not actually distinct.** "persuasive" reads
   identically to "deliberative" because the templates are the same
   ("Several factors converge to support this view." appears in both).
   Define a tone-strategy object with: opening verbs, hedging level,
   first/third person, antithesis treatment (steelman vs dismiss),
   conclusion strength.
9. **Audience level should change premise rendering.**
   - novice: paraphrase, expand jargon.
   - expert: trust the reader; cite authors + year only; preserve
     technical terms; surface CQs as "addressed objections".

## Architectural

10. **LLM polish pass.** The rule-based generator is hitting the ceiling
    for "persuasive". The ideation doc proposes an LLM polish stage
    that takes (chain, prose, tone, audience) → polished prose without
    inventing facts. This is the right next step; rule-based should
    remain the deterministic skeleton.
11. **Conclusion synthesis.** The conclusion currently restates the
    thesis. It should report: (a) which premises survived, (b) which
    objections fell and why, (c) the residual contested band. This
    requires reading edge standings + epistemic statuses, not just
    nodes.
12. **No mention of standings provenance.** When the chain was minted
    by Phase 6, the chain's `purpose` field already encodes the
    standings narrative ("A's two supporting arguments stand, B's
    methodological critique fell …"). The essay should weave this
    into the introduction, not strip it.
13. **Surface refusal surface in Essay + Brief views (NEW, external).**
    Currently both views render conclusions as if the chain closes,
    even when the deliberation’s `refusalSurface` lists that conclusion
    as blocked. Minimum: a banner at the top — *“This chain’s
    conclusion is currently blocked by N unanswered objections; the
    weakest link is X.”* Pull from `/api/v3/deliberations/<id>/synthetic-readout`
    `refusalSurface.cannotConcludeBecause`, filter by chain rootClaim.
    Without this, the prose views overstate confidence relative to what
    the platform’s own machinery reports.
14. **Brief view dialectical outcomes (NEW, external).** Brief currently
    reads as a table of contents (scheme labels + argument lists). It
    should be an outcome document: per argument, render its standing
    (`tested-survived` / `tested-undermined` / etc.) and — if
    undermined — a one-line summary of the surviving objection.
    Item 11’s conclusion-synthesis pattern applied per node, not just
    at the chain conclusion.

## Cross-cutting bug (orthogonal to prose, blocks honesty)

15. **Chain fitness flat-counts rebutted vs. unanswered attacks.**
    `lib/chains/fitness.ts` (or wherever the `−0.7 per attack edge`
    weighting lives) treats a `tested-undermined` attack the same as an
    unanswered one. Chain 2 here loses ~15.4 fitness from 22 attack
    edges, but several of those attacks have themselves been refuted
    — yet the chain-level number doesn’t reflect that. Fix: weight each
    attack by its own standing (refuted attack contributes ≈ 0;
    unanswered attack contributes the full −0.7). The per-argument
    standing already tracks this; only the aggregator needs updating.
    Material because Chain 3’s headline `−7.0` overstates fragility
    and we’re publishing this number externally via MCP.

## Implementation hints

- `ProseOptions` already has `style`, `audience`, `includeCriticalQuestions`.
  Add `respectEpistemicStatus: boolean` and `respectDialecticalRole: boolean`
  with defaults `true` once the templating supports them.
- The chain GET endpoint already returns `nodes[i].epistemicStatus`,
  `nodes[i].dialecticalRole`, and edge `edgeType` + `strength` +
  `description`. No backend changes needed.
- For the LLM polish path, gate behind a feature flag and a per-chain
  cache (chainId + tone + audience → polished text) to keep cost bounded.
- For item 13 (refusal surface in views), the synthetic-readout endpoint
  is already cached by `(deliberationId, contentHash)` and bumping
  `FINGERPRINT_VERSION` in `lib/deliberation/fingerprint.ts` evicts
  automatically — no manual cache-busting needed when the readout shape
  changes.

## Test fixture
The Hinge #1 chain (5 nodes / 4 edges) is small enough to be a useful
golden fixture for the rule-based path. Snapshot the JSON return of
`/api/argument-chains/<id>` and check generated prose against
hand-edited expected output for each (tone, audience) combination.

