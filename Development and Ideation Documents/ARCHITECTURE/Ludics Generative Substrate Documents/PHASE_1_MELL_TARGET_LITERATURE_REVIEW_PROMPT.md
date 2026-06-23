# Phase-1 Literature Review Prompt — MELL Target Selection (Q-034 / Q-033)

**Purpose:** Self-contained research brief for a deep-research agent. Scope is **deliberately narrow**: this is *not* a six-bucket survey like [`LITERATURE_REVIEW_PROMPT.md`](LITERATURE_REVIEW_PROMPT.md). It answers exactly two open questions in the MALL→MELL substrate-upgrade cluster — **Q-034** (is Terui / Basaldella–Terui computational ludics a better target than Faggian–Basaldella 2011?) and **Q-033** (is BF's MELLS expressive enough for the Ambler `!`-image?) — with a small input to **Q-032** (Sironi principal sets as an antichain). It compares a **fixed, known set of ~4 primary papers** on a **fixed set of axes**. Do not broaden.

**How to use:** Paste this entire document into a fresh research-agent instance with web/PDF access. §1 is the background, §2 the two questions + the comparison axes, §3 the fixed source set, §4 scope discipline, §5 the required output. The deliverable is a single referenceable markdown file (§5).

**Phase context:** This is Phase 1 of [session 16](../../../RESEARCH_PROGRAMME/10_IDEATION_SESSIONS/16-ambler-bridge-mell-cluster-sequencing-2026-06-16.md)'s sequencing. Phase 0 is **done**: the separation kill-switch (Q-035) fired **green** (low impact; the substrate uses chronicle-set inclusion `⊆`, not Girard separation), and the errata check (Q-036) is **clean** (no errata on the load-bearing BF 2011 / FQ 2013 papers). Phase 1 must finish **before** the Q-030 architectural commit and **before** any Q-032 BF-specific re-proof, because a positive Q-034 could make that re-proof unnecessary.

---

## 1. Background (read once, then work from §2)

The Isonomia/Mesh substrate runs an **Ambler–Ludics bridge**: a canonical translation between Ludics behaviours and Ambler-style argument derivations, `φ = δ⁻¹ ∘ CH ∘ DP` (defeat-decode ∘ Curry–Howard ∘ design-as-proof). The bridge is **closed on the propositional (MALL) fragment** but open at **higher order**, because Ambler's λ-calculus is **MELL** via Girard's `!`-translation, and the substrate's current foundation — Fouqueré–Quatrini (FQ) **linear** incarnation — is strictly MALL.

A Phase-1 literature audit (already done — you do **not** need to redo it; its findings are inputs here) established:

- **No cheap path.** Neither FQ paper has a MELL extension. The recommended upgrade target on literature grounds is **option (b): Faggian–Basaldella 2011 (BF), *Ludics with Repetitions*** (LMCS 7(2:13), arXiv:1104.0504), which proves full completeness for a **polarized MELL** fragment **MELLS** — exactly the `!`-translation landing zone.
- **BF is not a clean drop-in.** It replaces designs with **non-uniform strategies** (Def 7.2), replaces "incarnation" with operationally-defined **materiality** (Def 11.5), **proves no antichain/minimality theorem** (so the substrate's T002 has no BF-side analogue — this is **Q-032**), **drops separation** (handled — Q-035 green), has **no visitable-path machinery**, and targets only the **constant-only polarized** fragment MELLS (no propositional variables; additives called "straightforward" but not carried out — this is **Q-033**).
- **A richer alternative was flagged but not evaluated:** **Terui, *Computational Ludics*** (TCS 412(20), 2011) + **Basaldella–Terui, *On the Meaning of Logical Completeness*** (LMCS 6(4:11), 2010), which give full completeness for **polarized linear logic with exponentials** plus an explicit **proof/model duality** and a **λ-calculus-style (c-design) term syntax**. This is **Q-034**: evaluate whether Terui dominates BF as the substrate's MELL target.

**Why the target choice matters for the substrate specifically.** The Ambler side is a λ-calculus, so a target with **term syntax** (Terui c-designs) may integrate more naturally than BF's HO-strategy syntax; and the substrate needs a **canonical generator set** (the antichain T002 plays in the bridge's free-JSL argument) — if Terui's incarnation analogue supplies one, **Q-032 is absorbed** and the hardest re-proof in the cluster disappears.

---

## 2. The two questions and the comparison axes (the search checklist)

For every sub-finding below, classify as one of: **confirmed (with source + location)**, **partially confirmed (caveat)**, **not addressed in the source**, **contradicted by source X**, or **open / inconclusive after focused search**. Cite the exact paper + section/theorem/definition number for every non-"open" verdict. This is a **primary-source reading task**, not a broad survey — depth on ~4 papers, not breadth.

### Q-034 — Terui / Basaldella–Terui vs BF 2011, six axes

Produce a **side-by-side table** scoring Terui c-designs (TCS 2011) + Basaldella–Terui (LMCS 2010) against BF 2011 on each axis, with a verdict per axis (Terui-better / BF-better / equivalent / can't-tell) and a final recommendation.

- **(a) Expressivity.** What logical fragment does each prove full completeness for? Does Terui cover **additives and propositional variables** that BF's constant-only MELLS leaves out? State each completeness theorem verbatim (number + fragment + hypotheses). Decisive sub-question: *does Terui subsume the Q-033 gap?*
- **(b) Incarnation analogue / canonical generators.** Does Terui (or Basaldella–Terui) have a notion analogous to FQ incarnation / BF materiality — and crucially, **does it carry a minimality / antichain / canonical-generator theorem**? This is the axis that could absorb **Q-032**. If Terui has a "principal" or "minimal" design notion with a proved uniqueness/minimality property, quote it exactly.
- **(c) Separation behaviour.** Does separation **hold or fail** in each setting? (BF drops it under non-uniformity — Maurel 2004.) Does Terui's c-design framework retain a separation/Böhm-style theorem, and under what hypotheses? (Substrate impact is low either way per Q-035, but it bears on which framework is "cleaner.")
- **(d) Cut-elimination / normalization.** Is normalization **terminating** and **confluent / deterministic** in each? Quote the relevant theorem. (Terui's "computational" framing emphasizes normalization-as-computation — characterize precisely.)
- **(e) Syntactic ergonomics.** BF designs are non-uniform HO-innocent strategies (τ-sums). Terui c-designs are **λ-calculus-style terms**. Given the Ambler side **is a λ-calculus**, assess which syntax maps more directly onto Ambler derivations. Be concrete about the c-design grammar.
- **(f) Library / mechanization / downstream support.** Any existing formalization, Agda/Coq development, or follow-on literature building on each framework that the substrate could reuse? (The substrate has an existing Agda corroboration habit.)

**Q-034 deliverable verdict:** one of — *Terui dominates (retarget; Q-032 + Q-033 likely absorbed)* / *BF dominates (stay; Q-032 + Q-033 remain)* / *mixed (per-axis, with a recommended split)* / *inconclusive (name the single reading that would decide it)*.

### Q-033 — Is BF's MELLS expressive enough for the Ambler `!`-image?

Only needs full treatment **if Q-034 recommends BF**; if Q-034 recommends Terui, note that Terui likely settles Q-033 and keep this short.

- **(g)** State precisely what **MELLS** is in BF 2011 (constant-only? polarized? which connectives?). Quote BF's own characterization (they note it is a focalized version of a fragment of LJ).
- **(h)** Ambler's `!`-translated derivations quantify over **factual atoms** (propositional-variable-like) and may use **additive** case-analysis. Assess: (i) can these be **Skolemized** into MELLS's constant-only fragment? (ii) is BF's "additives are straightforward" claim backed by any published carrying-out (possibly Terui, or a later paper)? (iii) if neither, is the additive/variable extension **net-new theoretical work**?
- **Q-033 deliverable verdict:** *sufficient (Skolemization works)* / *folklore-extendable (cite the paper)* / *net-new work (scope restriction needed)*.

### Q-032 input (small) — Sironi principal sets

- **(i)** In **Sironi, *Type Theory in Ludics*** (arXiv:1402.2511, 2014), locate the **"principal set"** definition. Does Sironi prove it is **minimal / an antichain / a canonical generator** (under any order, including a repetition-aware one)? Quote the definition + any minimality theorem. This is the leading candidate for the BF-side T002 re-proof (Q-032 route i); the agent's job is only to report whether the theorem exists and under what hypotheses, **not** to attempt the re-proof.

---

## 3. Fixed source set (do not broaden)

These ~4 primaries are the task. Read them; do not run a general survey.

**Primary (must read):**
1. **Terui, K. (2011).** *Computational Ludics.* Theoretical Computer Science 412(20):2048–2071. — Q-034 axes (a)–(f), the central object.
2. **Basaldella, M. & Terui, K. (2010).** *On the Meaning of Logical Completeness.* LMCS 6(4:11), arXiv:1011.1625. — Q-034 (a)/(b)/(d); the proof/model duality + completeness statement.
3. **Faggian, C. & Basaldella, M. (2011).** *Ludics with Repetitions (Exponentials, Interactive Types and Completeness).* LMCS 7(2:13), arXiv:1104.0504. — the incumbent BF target; Q-034 baseline + Q-033 (g)/(h). Load-bearing items: Def 7.2, Def 11.5, Thm 11.16, Thm 11.17, Remark 11.12.
4. **Sironi, P. (2014).** *Type Theory in Ludics.* arXiv:1402.2511. — Q-032 input (i) only; principal-set definition + any minimality theorem.

**Secondary (consult only if a primary points to it for a specific theorem):**
- Basaldella, Faggian, Terui (2010). *Infinitary Completeness in Ludics.* LICS 2010, pp. 294–303.
- Girard, J.-Y. (1987). *Linear Logic.* TCS 50 — only for the `!`-translation statement, if needed for Q-033(h).
- Maurel, F. (2004). *Un cadre quantitatif pour la Ludique* (PhD) — only for the separation-failure statement under Q-034(c), if BF/Terui cite it.

**Do not** pull in the broad Ludics-and-dialogue, argumentation-theory, deliberative-democracy, or LLM-agent literature. That is the *other* prompt's job. If a primary cites a paper essential to a specific theorem you must verify, fetch that one paper — otherwise stop.

---

## 4. Scope discipline

- **Bounded:** ~4 primary papers, two questions, the fixed axis list in §2. No bucket structure, no claim-numbering beyond §2's (a)–(i).
- **Depth over breadth:** the value is *exact theorem statements with numbers*, not a literature map. Quote definitions and theorems verbatim with their numbering; a paraphrase without a number is not acceptable for a load-bearing axis (a, b, g, i).
- **Do not attempt proofs.** Q-032's re-proof and the Q-030 commit are downstream. Report what the papers *state*; flag what they *don't*.
- **Stop conditions:** if an axis resolves from a single theorem, record it and move on. If an axis resists after ~30 min focused reading, mark *open / inconclusive* and state the one fact that would resolve it.
- **If a paper is paywalled / unfetchable:** say so explicitly and fall back to the author's homepage / arXiv / a published review (e.g. zbMATH); never fabricate a theorem number.

---

## 5. Required deliverable

A **single markdown document** named `Q034_Q033_MELL_TARGET_LITERATURE_REVIEW.md`, to live in `Development and Ideation Documents/ARCHITECTURE/`. KaTeX inline (`$...$`) / block (`$$...$$`) math, double-quoted code identifiers, claim-first voice matching the substrate docs.

### Required structure

```
# Q-034 / Q-033 — MELL Target Selection Literature Review

**Date:** [completion date]
**Answers:** Q-034 (Terui vs BF target), Q-033 (MELLS expressivity); input to Q-032 (Sironi principal sets)
**Companion to:** MALL→MELL Incarnation Upgrade (Phase-1 audit); session 16 sequencing
**Scope:** [verbatim from §4 — bounded, ~4 papers, two questions]

## §1. Executive summary
[~½–1 page. The Q-034 verdict (Terui dominates / BF dominates / mixed / inconclusive) up front, in bold. The Q-033 verdict. Whether Q-032 is absorbed by the Q-034 choice. The single most decisive theorem found, quoted.]

## §2. Q-034 — Terui/Basaldella–Terui vs BF, axis by axis
[The six-axis comparison. One subsection per axis (a)–(f). Each: what each paper states (verbatim theorem/def + number), then the per-axis verdict. Close with the side-by-side table and the overall recommendation.]

## §3. Q-033 — MELLS expressivity for the Ambler !-image
[Axes (g)/(h). Short if §2 recommends Terui; full if §2 recommends BF. End with the sufficient / folklore-extendable / net-new verdict.]

## §4. Q-032 input — Sironi principal sets
[Axis (i) only. The principal-set definition verbatim + whether a minimality/antichain theorem exists and under what hypotheses. One paragraph + the quoted def/theorem.]

## §5. Recommendation to the Q-030 commit
[Bulleted, actionable. "If Terui: retarget the substrate design notion to c-designs; Q-032 + Q-033 fold into [X]; expect [cost]." "If BF: keep option (b); Q-032 proceeds via Sironi/route-ii; Q-033 needs [Skolemization / net-new]." State which downstream cluster questions each branch closes or keeps open.]

## Appendix A — Axis verdict table
[Compact: Axis (a)–(i) | one-line restatement | Terui finding | BF finding | Verdict | Primary source + location.]

## Appendix B — Theorem/definition quote bank
[The verbatim statements pulled, each with paper + number. The persistent value — formatted for grep-ability: completeness theorems, incarnation/materiality/principal-set defs, separation statements, cut-elimination theorems.]
```

### Length target

**6–12 pages.** Much shorter than the six-bucket review. §2 is the bulk (~4 pages); §3 short unless BF wins; §4 one page; §5 short and pointed; appendices dense.

### Style

- Claim-first, no hedging filler. For load-bearing axes (a, b, g, i) **quote the theorem with its number** — a numberless paraphrase is insufficient.
- Cite inline as `(Author Year, Thm/Def N.N)`; full references in Appendix B.
- Say *what each paper proves* before *whether it favours Terui or BF*. Reverse order reads as selective.

---

## 6. Process guidance

- **Order:** Start with **Terui 2011** (axes a–f, the object of Q-034) and **Basaldella–Terui 2010** (its completeness/duality companion). Then re-read the relevant **BF 2011** sections as the baseline (you have the Phase-1 audit's extraction to anchor numbers). Then **Sironi 2014** for the single Q-032 input. Q-033 last (it collapses if Terui wins).
- **The decisive axis is (b)** — the canonical-generator / minimality theorem. If Terui has one and BF does not, that single fact likely settles Q-034 *and* absorbs Q-032; prioritize nailing it with an exact quote.
- **When Terui and BF prove completeness for different fragments,** state both fragments precisely and whether one contains the other — do not average.
- **Do not soften a "BF dominates" or "inconclusive" finding** to make the cluster's preferred option (b) look better. The sequencing explicitly wants the target chosen on evidence before the commit.
- **Surface anything unanticipated** (e.g. a third framework either paper points to as the "right" MELL target) in §5, flagged — do not fold it silently into the comparison.
```
