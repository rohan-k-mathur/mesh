# Phase 1 Literature Audit: MALL→MELL Incarnation Upgrade for the Isonomia Ludics Substrate

## TL;DR
- **The cheap path (an "FQ §6" MELL extension) does not exist.** Neither Fouqueré–Quatrini paper extends the design-as-proof correspondence beyond MALL; the upgrade to Basaldella–Faggian 2011 (BF 2011) is mandatory to reach the MELL landing zone.
- **BF 2011 supplies the MELL correspondence (Thm 11.17) but is NOT a clean drop-in** for the FQ incarnation machinery: it replaces designs with non-uniform strategies, replaces "incarnation" with "materiality" (proving *no* antichain/minimality theorem), drops separation and the visitable-path technology, and targets only the constant-only polarized fragment MELLS.
- On literature grounds, **recommend option (b)** (upgrade to BF-style materiality-with-repetitions). The single load-bearing reason: Girard's translation lands intuitionistic `A⇒B := !A⊸B` inside exactly the polarized-MELL fragment for which BF 2011 prove full completeness (BF's MELLS = focalized ¬,∧-fragment of LJ), and the literature indicates **no linear (MALL) shadow can recover contraction**.

---

## §0 Verdict

Neither Fouqueré–Quatrini paper closes the MELL obstruction. The actual FQ 2013 paper — *Incarnation in Ludics and maximal cliques of paths*, LMCS 9(4:6), arXiv:1307.1028 — is strictly linear/MALL and its §6 is a **Conclusion**, not an extension. The companion paper *Study of Behaviours via Visitable Paths* (arXiv:1403.3772, published as LMCS 14(2:7), 2018) characterizes **MALL** behaviours only and itself states that an extension to exponentials "is however necessary." **A4: FQ alone does NOT close the MELL obstruction; there is no "FQ §6 MELL extension" in either paper.** **B7: BF 2011 supplies the needed MELL design-as-proof correspondence (full completeness, Theorem 11.17) but is not an isomorphic drop-in replacement for the FQ §4.2/§5 incarnation machinery** — its canonical-generator notion is "material part" (Definition 11.5), defined operationally with no proved antichain/minimality structure; it requires non-uniform tests; it drops separation; it has no visitable-path machinery; and it targets the constant-only polarized fragment MELLS. On **literature grounds the recommended option is (b)** — upgrade the substrate to BF-style incarnation-with-repetitions/materiality. The single most load-bearing reason: the `!`-translation image is precisely (polarized) MELL — the exact target for which BF prove full completeness — while options (a) and (c) are blocked by an in-principle non-recoverability of contraction from a linear shadow (Maurel's separation failure; BF's structural need for non-uniform tests).

## §1 Sources consulted

**Obtained and read in full (primary):**

1. **Basaldella, M. & Faggian, C. (2011).** "Ludics with repetitions (Exponentials, Interactive types and Completeness)." *Logical Methods in Computer Science*, Vol. 7, Issue 2, paper 13; published May 17, 2011; DOI 10.2168/LMCS-7(2:13)2011 (arXiv:1104.0504, v3). Conference version: LICS 2009, pp. 375–384, DOI 10.1109/LICS.2009.46. Journal §§1–5 read directly; §§6–11 + appendices read via targeted extraction; the LICS 2009 short version (irif.fr/~faggian/pubs/finallics.pdf) read in full. **Accessible.**
2. **Fouqueré, C. & Quatrini, M. (2013).** "Incarnation in Ludics and maximal cliques of paths." *LMCS* 9(4:6); DOI 10.2168/LMCS-9(4:6)2013 (arXiv:1307.1028; revised/corrected version republished Mar 31, 2015). **This is the actual LMCS 9(4:6) paper. Read in full. Accessible.**
3. **Fouqueré, C. & Quatrini, M. (2018).** "Study of Behaviours via Visitable Paths." *LMCS* 14(2:7) (arXiv:1403.3772). Read in full. **Accessible.**
4. **Girard, J.-Y. (1987).** "Linear Logic." *Theoretical Computer Science* 50(1), pp. 1–101 (ACM lists "1–102"); DOI 10.1016/0304-3975(87)90045-4. Consulted via the canonical "Linear Logic: its Syntax and Semantics" survey (girard.perso.math.cnrs.fr/Synsem.pdf) and BF 2011 §2, which reproduces the `!`-decomposition. **Accessible (survey form).**
5. **Girard, J.-Y. (2001).** "Locus Solum." *MSCS* 11(3):301–506. Consulted (nguyentito.eu mirror) for incarnation/ordering background. **Accessible.**
6. **Curien, P.-L. (2006).** "Introduction to Linear Logic and Ludics, Part II." Used as a vocabulary aid. Direct IRIF fetch returned a robots block; content cross-checked via secondary citations. **Partially accessible — flagged.**

**FAIL-LOUD NOTES.**
- **Citation cross-up in the task brief (material).** The brief cites "FQ 2013 LMCS 9(4:6) §4.2 design-as-proof" and "§6 extensions" and attributes them to arXiv:1403.3772. This is **incorrect**: arXiv:1403.3772 is the *2018* "Study of Behaviours" paper (LMCS 14(2:7)), whereas LMCS 9(4:6) 2013 is "Incarnation in Ludics and maximal cliques of paths" (arXiv:1307.1028). Neither paper contains a "§4.2 design-as-proof for MALL" subsection nor a "§6 extension to MELL." Every Block-A answer below is re-flagged accordingly.
- **Faggian–Hyland (2002)** "Designs, Disputes and Strategies" (skim-for-vocabulary item) was not separately fetched; its content is subsumed by BF 2011 §§3–4, which restate the HO-strategy/design dictionary. Flagged as not independently verified.
- The full LMCS journal PDF of BF 2011 exceeds the fetch size cap; §§7–11 verbatim theorem statements were obtained via a single targeted extraction pass and are quoted below with journal numbering, cross-checked against the LICS 2009 short version.

## §2 Block A — FQ findings (the cheap path)

**A1.** No. The real FQ 2013 (arXiv:1307.1028) is entirely linear. Its design-as-proof object is the "design as dessin" (Definition 2.11), built only from the daimon, a positive rule and a negative rule over MALL-style (hypersequentialized) sequents; the paper's §1.3 frames Ludics as yielding "a full completeness theorem for second-order multiplicative additive (and affine) Linear Logic." Its §6 is titled "Conclusion" and contains no extension theorem. The 2018 companion's §4 is explicitly "A Characterization of MALL behaviours," and it states in §3 that "An extension of our approach to exponentials is however necessary to fully address the issue." **There is no FQ §6 MELL extension in either paper.**

**A2.** Not applicable — no MELL extension exists in FQ to inherit §4.2-type properties. For the record, the FQ MALL incarnation properties on which the substrate's T002 leans are: incarnation = minimal designs under inclusion (Prop 5.2/5.3) and the dual-of-a-clique-is-an-anticlique property (Prop 5.9).

**A3.** The load-bearing FQ statements (MALL only) are:

> **Proposition 5.2.** Let B be a behaviour, D be a design in B. If D is minimal in B with respect to inclusion then D ∈ |B|.

> **Proposition 5.3.** Let B be a behaviour, D be a design in B. If D ∈ |B| then D is minimal in B with respect to inclusion.

> **Proposition 5.9.** Let E be a set of designs based on β, p and q be two distinct paths of V_E, • if p ⌣ q then p̃ ̸⌣ q̃, • if C is a clique of paths based on β visitable in E then C̃ is an anticlique of paths based on β^⊥.

(Prop 5.3's proof explicitly invokes linearity: "thanks to linearity, the converse property does hold … Linearity induces the following fact: ⟨D̃←R⟩ = ⟨R←D⟩.")

**A4. Verdict.** FQ does not close the MELL obstruction. The incarnation↔cut-free-proof correspondence and the antichain/minimality structure are established for MALL, and the proof of the material⇒minimal direction *depends on linearity*. The path to MELL must go through BF 2011.

## §3 Block B — BF 2011 findings (the structural path)

**B1 — main full-completeness theorem (verbatim, journal numbering).**

> **Theorem 11.17 (Full Completeness).** Let ⊢ Γ be a sequent of behaviours which is interpretation of the sequent ⊢ Γ in MELLS. If D is a winning strategy in ⊢ Γ then it is the interpretation of a cut-free derivation π of the sequent ⊢ Γ in MELLS.

with the soundness/interpretation companion:

> **Theorem 11.16 (Soundness).** Let π be a derivation of a sequent ⊢ Γ in MELLS and D(π) be the interpretation of π in a sequent of behaviours ⊢ Γ. We have that: D(π) is a winning strategy in ⊢ Γ. Moreover, the interpretation is invariant under cut-elimination.

(The LICS 2009 short version carries the same result compressed as **Theorem VIII.9 (Full Completeness)**: "If D is a winning strategy in a sequent of behaviours ⊢ Γ then D is the interpretation of a cut-free proof π of the sequent ⊢ Γ in MELLS.")

The BF-side analogue of FQ-incarnation is the **material part** / material strategy:

> **Definition 11.5 (Materiality).** Let G be a behaviour and D a strategy in G. We define the material part of D in G as |D|_G := ∪{ D[E] : E ∈ G^⊥ }. A strategy D ∈ G is said to be material in G if D = |D|_G.

and the proof-carrying designs are the **winning** ones:

> **Definition 11.11 (Winning strategy).** A strategy D ∈ ⊢ Γ is said winning if it is finite, deterministic, daimon-free and material in ⊢ Γ.

**B2 — the design-with-repetitions data structure.** BF call it a **non-uniform strategy**:

> **Definition 7.2 (Non-uniform strategies).** Let Γ be an interface. A non-uniform strategy (n.u. strategy for short) D on Γ, written D : Γ, is a prefix-closed set of non-empty views … on the arena U*(Γ), such that: (1) Coherence. If s.m, s.n ∈ D and m ≠ n then m, n are negative. (2) τ-Positivity. If s.m is maximal in D … and m is a proper action … then m is positive. We will call deterministic a n.u. strategy which has no silent actions.

with the silent-action sum:

> **Definition 7.5 (τ-sum).** … If {x⁻.D_i : Γ}_{i∈S} is a family of negative strategies which have the same root x⁻, we define their negative sum: Σ^τ_{i∈S} x⁻.D_i := x⁻. ⊕^τ_{i∈S} D_i.

Structural differences from an FQ design:
- **(i) Added data.** It is **not** a per-address repetition multiplicity and **not** a tree-with-repetitions counter. Two things change. First, **linearity is dropped** — BF's linearity (Definition 4.9: "an occurrence of action (ξ,I) … is linear if the name ξ is only used by that occurrence … D is linear if each occurrence of (proper) action in D is linear") is the FQ/Girard condition; non-uniform strategies are HO-innocent strategies on a universal arena in which actions on the same name may repeat, with contraction/copying realized dynamically via the VAM "Copies" property `[[D, E]] = [[σ(D), E, E[σ/ξ]]]` (Prop 8.15 / VI.1). Second, the arena is enriched with **neutral "silent"/τ actions** (`M_τ = {t} ∪ {t_i}`) supporting the non-deterministic **τ-sum**, so a non-uniform strategy is literally a superposition `Σ^τ x⁻.D_i` of strategies sharing a first negative action.
- **(ii) Order.** Still essentially **set inclusion on prefix-closed sets of views**; orthogonality is the "every non-deterministic choice converges to †" relation (Def 9.1), not a chronicle-set quotient or refinement. Repetition is handled by the dynamics (copying) plus τ-sums, **not** by a new ordering.

**B3 — antichain property.** BF 2011 **does not** retain or restate the FQ antichain property. Materiality (Def 11.5) is defined purely operationally as "the part really used to react to all tests," via:

> **Proposition 11.8.** (1) [[|D|_G, E]] = [[D, E]], for each E ∈ G^⊥. (2) |D|_G⊥E, for each E ∈ G^⊥. In particular, |D|_G ∈ G.

**No minimality, antichain, or lattice/ordering theorem on material designs is stated anywhere in §§7–11.** The closest replacement appears only in later literature — Sironi's "principal set" — not in BF. *On my reading, the substrate's T002 antichain claim therefore has no BF-side theorem to rest on and would need to be re-established in the non-uniform setting (Phase 3 work, out of scope here).*

**B4 — focusing/uniformity hypotheses.** Yes, BF require structure FQ does not. The construction needs **non-uniform counter-strategies (tests)** — the central technical device (τ-sums), motivated by the failure of plain linear tests to validate contraction. Designs that interpret proofs must be **deterministic + winning** (Def 11.11), i.e. uniform (BF equate "uniform" with "deterministic" — having no silent actions). So non-uniform designs are *accommodated and in fact required as tests*, while proof-objects are restricted to deterministic/uniform/winning strategies. The MELLS calculus is itself focalized (synthetic connectives, positive/negative rule alternation), which BF note "matches the standard Player (positive)/Opponent (negative) alternation of moves in a strategy."

**B5 — visitable-paths analogue.** **No analogue.** BF have no "visitable path" technology. Interaction is presented via the VAM/LAM abstract machine; the "part used" is captured by the **restriction** D[E] (Definition 11.2: "the restriction of D to those of its views which are used (or visited) in the process of interaction to produce [[R]]") and rolled directly into materiality. The behaviour-as-orthogonal-closure presentation `B = E^⊥⊥` **does** hold:

> **Definition 9.5.** A behaviour on the interface Γ is a set G of strategies D : Γ such that G^⊥⊥ = G.

So the substrate's `B = E^⊥⊥` framing transfers; but FQ's path-level characterization of incarnation (ludicable / visitable-path criteria, FQ Prop 4.8/4.11) has **no counterpart** and would have to be rebuilt.

**B6 — cut-elimination.** Two results. Syntactically, MELLS cut is admissible:

> **Theorem A.3 (Cut-elimination).** Let π and ρ be cut-free derivations of ⊢ Ξ, Π, P and ⊢ ∆, P^⊥ respectively. The sequent ⊢ Ξ, Π, ∆ is derivable with a cut-free derivation θ.

> **Corollary A.4.** If ⊢ Γ is derivable in MELLS then ⊢ Γ is derivable in MELLS without Cut.

Semantically, interpretation is invariant under cut-elimination (Thm 11.16) and a winning normal form corresponds to a **unique** cut-free MELLS derivation (Thm 11.17). **Caveat:** BF do **not** prove that semantic normalization always terminates; finiteness is *imposed* as a winning condition (Remark 11.12 notes it is actually a consequence via Basaldella–Terui but "postpone[d] to a subsequent work").

**B7 — verdict.** BF 2011 is **not** a clean drop-in for the FQ incarnation machinery in `φ = δ⁻¹ ∘ CH ∘ DP`, but it is the correct structural target. Gaps: (1) the DP (design-as-proof) leg becomes Thm 11.17 over **MELLS**, a *constant-only polarized* fragment (no propositional variables; additives "straightforward" but not carried out); (2) "incarnation" must be re-read as "materiality," and the substrate's antichain claim (T002) has **no BF theorem** behind it; (3) **separation fails**, so any substrate reasoning relying on FQ/Girard separation (e.g. the ⪯ order) breaks; (4) no visitable-path criteria; (5) the φ codomain object changes from designs to non-uniform strategies and must be re-typed. What BF *does* deliver cleanly is exactly the missing piece: a full (polarized) MELL design↔cut-free-proof correspondence.

## §4 Block C — !-translation landing zone

**C1.** Girard's intuitionistic translation `A⇒B := !A⊸B` sends intuitionistic implication into the **multiplicative-exponential fragment MELL** — every implication introduces a `!`, so the image lands in MELL, not MALL (Girard 1987, TCS 50). More precisely, the image occupies a **polarized** sub-fragment: BF's MELLS is explicitly "a polarized variant of the constant-only propositional fragment of multiplicative-exponential linear logic MELL based on synthetic connectives," and BF Remark II.3 states MELLS "is a focalized version of the ¬,∧ fragment of intuitionistic calculus LJ" (with Appendix A.2 giving the LJ correspondence). So the `!`-image of an Ambler-style intuitionistic λ-calculus lands in **polarized MELL ≈ BF's MELLS** — *the exact target of BF's full completeness*. (Primary: Girard 1987 TCS 50, the `!A⊸B` encoding; corroborated by BF 2011 §2 + Appendix A.2; the linearizability of intuitionistic implication is treated in Lincoln, Scedrov & Shankar, "Linearizing intuitionistic implication," *Annals of Pure and Applied Logic* 60(2):151–177, 1993, cited by the SEP "Linear Logic" entry.)

**C2.** Ambler's calculus (S. J. Ambler, *First Order Linear Logic in Symmetric Monoidal Closed Categories*, PhD, Edinburgh 1991/92, LFCS report ECS-LFCS-92-194; the intuitionistic linear type theory "L_FOLL" / LTT corresponding to a symmetric monoidal closed category) uses only the SMCC/exponential structure — **no primitive modal or fixpoint operators**. **However**, the defeasible **defeat** operator, and especially the chains **defeat(defeat(π))**, are a *non-monotonic* overlay not part of Ambler's base linear logic. Whether the δ-encoded defeat stays inside MELL depends entirely on how δ is defined at substrate level: if δ is a definable morphism in the JSL-enriched CCC, the `!`-image stays in MELL; if iterated defeat requires a fixpoint/closure operator (a plausible reading of `defeat(defeat(·))`), it falls **outside** MELL and constitutes a *separate obstruction*, orthogonal to the MALL→MELL question. **Flag: this cannot be resolved from the literature; it requires the substrate's δ definition (Phase 2).**

## §5 Block D — FQ↔BF translation table

**D1.**

| Notion | FQ 2013 (arXiv:1307.1028, LMCS 9(4:6)) | BF 2011 (LMCS 7(2:13)) |
|---|---|---|
| design | "design as clique of chronicles" (Def 2.9); dessin presentation (Def 2.11) | "strategy" / non-uniform strategy (Def 7.2); linear strategy = design (Def 4.6, 4.9) |
| chronicle | Def 2.6 (alternate sequence of actions) | "view" (Def 3.3); BF note that what Girard calls designs/chronicles are their strategies/views |
| visitable path / play | path (Def 3.2), visitable path (Def 4.6); ludicable sets (2018 paper) | **no analogue** — interaction via VAM/LAM; "restriction" D[E] (Def 11.2) plays the "part used" role |
| cut | closed cut-net (Def 2.13) | cut / cut-net (Def 4.11), closed cut-net (Def 4.14) |
| cut-elimination | interaction/normalization [[R]] (Def 2.15) | normal form [[R]] (Def 4.23; VAM, Def 8.x); syntactic admissibility Thm A.3 |
| orthogonality D⊥E | Def 2.16 ([[D,R]] = Dai) | Def 4.31 (linear: [[D,(E)]] = Dai); Def 9.1 (non-uniform: [[D,(E)]] total for *every* choice) |
| behaviour B = E^⊥⊥ | Def 2.16 (E = E^⊥⊥) | Def 4.32 / Def 9.5 (G^⊥⊥ = G) |
| incarnation Inc(B) / \|B\| | Def 5.1 (smallest subdesign; material designs); Prop 5.2/5.3 minimality | **"material part" \|D\|_G (Def 11.5)**; winning designs (Def 11.11) — *renamed, see D2* |
| daimon | ✠ / Dai (Def 2.5, Ex 2.12) | † / Dai (Examples 4.7) |
| uniformity / focus | not required (linear designs) | **required**: deterministic/uniform proof-strategies; non-uniform tests (Def 7.2, Def 7.5) |
| exponential ! / ? | **absent** (MALL only) | MELLS modalities; !N negative, ?P positive; decomposition `! = ♯`, `? = ♭` (§2.2) |

**D2 — words BF redefines (not extends).**
- **"design"** → BF use **"strategy"**; a linear strategy = a Girard/FQ design, but the unqualified BF object (non-uniform strategy) is a *strictly larger* class (repetitions + neutral actions). Same intuition, non-isomorphic class.
- **"chronicle"** → BF **"view"**: coextensive in the linear case, but BF views live on an arena enriched with τ-actions.
- **"incarnation"/"material"** → BF keep "material" (Def 11.5) but **drop the minimality/antichain content** FQ attaches to it (FQ Prop 5.2/5.3/5.9). FQ's theorem "material ⇔ minimal under inclusion" is *not* isomorphically transported: its proof uses linearity, and BF prove no replacement. So "material" is the same word denoting an operationally-defined but structurally weaker object.
- **"orthogonality"** → redefined from "[[D,R]] = Dai" (deterministic) to "total for every non-deterministic choice" (Def 9.1).

## §6 Block E — Architectural-decision summary (literature evidence only)

**E1 (a) — Restrict to MALL Ambler instances.** What is lost: the entire exponential layer, hence the whole image of the `!`-translation. Because Ambler's intuitionistic `A⇒B` is *by construction* `!A⊸B`, **every** non-trivial intuitionistic implication needs `!`; restricting to MALL means the substrate can only host the (rare) sub-arguments that never reuse or discard a premise. Concretely inexpressible: any defeasible argument scheme where one rule/premise feeds **multiple** sub-goals (contraction), any scheme that **discards** an inapplicable premise (weakening), and crucially the iterated **defeat(defeat(π))** chains (which require duplicating a sub-argument to attack it). This is not a marginal loss — it removes the defeasible engine. Not recommended unless the substrate is provably restricted to single-use linear argument schemes.

**E1 (b) — Upgrade to BF-style materiality-with-repetitions.** Structural cost: replace the φ codomain object (designs → non-uniform strategies); adopt τ-sums and non-uniform tests; **abandon separation** and any substrate lemma resting on FQ's ⪯ order; **re-prove or re-state** the substrate's T002 antichain/minimal-generator claim, since BF give only an operational "material part" with no antichain theorem; accept that the clean correspondence (Thm 11.17) is over **MELLS** (constant-only, polarized; propositional variables and additives need the documented-but-unwritten extension). Intermediate/cheaper-upgrade candidates between FQ and BF: **Maurel (PhD, Université Paris VII, 2004)** "Un cadre quantitatif pour la Ludique" (probabilistic ludics — but **no full-completeness result**, separation-driven, and abandoned by its own author); **Basaldella PhD 2008** (AJM-style exponentials); and most importantly **Terui's computational ludics (TCS 412(20), 2011)** + **Basaldella–Terui, "On the Meaning of Logical Completeness," LMCS 6(4:11), 2010 (DOI 10.2168/LMCS-6(4:11)2010, arXiv:1011.1625)** and **"Infinitary Completeness in Ludics," LICS 2010, pp. 294–303 (DOI 10.1109/LICS.2010.47)**, which give a λ-calculus-style c-design syntax and full completeness for **polarized linear logic** with exponentials and an explicit proof/model duality — potentially a *richer* substrate target than BF 2011 and worth evaluating in Phase 2. **This is the recommended path on literature grounds.**

**E1 (c) — Construct a canonical section MELL-designs-with-repetitions → MALL-designs.** The literature indicates an **in-principle obstruction**. Contraction is not recoverable from a linear shadow: Maurel's programme failed precisely on **separation** under repetitions; BF's whole apparatus exists because plain linear tests are insufficient (they "need non-uniform counter-strategies"); and the exponential is structurally an infinite tensor (AJM) / unbounded juxtaposition (HO) with a genuinely non-linear contraction on `♭P`. No Girard/Curien/Faggian result provides such a section; the weight of evidence is that none exists in general. A *partial* section (e.g. for bounded-copy fragments) is conceivable but unsupported by any cited theorem. Not recommended as a primary strategy.

## §7 Open follow-ups

- **Q-031.** Does the substrate's δ (defeat-encoding) require a fixpoint/closure operator? If so, `defeat(defeat(π))` lands outside MELL — a *separate* obstruction from the MALL→MELL upgrade (Block C2). Resolve before committing to option (b).
- **Q-032.** Re-establish T002 (antichain/canonical-generator) in the non-uniform setting: is there a minimal-generator ("principal set," Sironi, *Type Theory in Ludics*, arXiv:1402.2511, 2014: "a set 𝔸 that is principal for A, where principal … means in some way a minimal generator") that is an antichain up to repetition-equivalence? BF prove no such theorem; this is net-new Phase 3 work.
- **Q-033.** Is BF 2011's MELLS (constant-only, polarized) expressive enough for the Ambler `!`-image, or is the additive/propositional-variable extension required? BF call additives "straightforward" but do not carry them out.
- **Q-034.** Evaluate Terui / Basaldella–Terui c-designs as an alternative target to BF 2011 — richer (polarized LL, proof/model duality, term syntax) but with a different incarnation story. Possible supersession of BF 2011 for substrate purposes.
- **Q-035.** Separation fails in BF. Inventory every substrate component that depends on FQ/Girard separation (the ⪯ order, defeat-encoding uniqueness) and assess breakage.
- **Q-036.** Confirm no published errata to BF 2011 or FQ 2013. (FQ 2013 LMCS is itself a "revised and corrected version," republished 2015; BF Remark 11.12 flags an unproved finiteness loose-end.)

## Caveats
- The task's source citations were partly crossed: **FQ 2013 LMCS 9(4:6) is the *Incarnation* paper (arXiv:1307.1028), not arXiv:1403.3772**. All Block-A answers were re-derived against the correct papers, and the premise of an "FQ §6 MELL extension" is **false** (§6 is a Conclusion).
- BF 2011's verbatim §§7–11 theorem statements were obtained via a single targeted extraction of the oversized journal PDF; numbering follows the LMCS journal version and was cross-checked against the LICS 2009 short version (same Theorems VIII.6/VIII.9 in compressed form, and §VII Definitions of non-uniform strategies/τ-sums).
- Girard 1987 pagination is recorded variously as TCS 50:1–101 (LMCS/JSL convention) and 1–102 (ACM); immaterial to the findings.
- Curien 2006 and Faggian–Hyland 2002 were not independently fetched (robots block / subsumed); used only as vocabulary aids, not as primary citations.
- §6 weighs literature evidence only; substrate-impact and effort estimation are explicitly deferred to Phase 2.