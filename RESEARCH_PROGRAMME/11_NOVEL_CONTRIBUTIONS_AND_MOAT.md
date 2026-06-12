# Novel Contributions — What Is Not in the Literature

> Status: **active**, seeded 2026-06-08. This document responds directly to a
> specific piece of feedback about the project's defensibility, and it does so
> from inside the research programme rather than from the marketing surface. It
> is an index of the programme's *original* results — the theorems, bridges,
> conjectures, and pre-registered studies that are **not** established in the
> published research literature — kept honest about status (proved / open /
> refuted-then-narrowed). It cites the underlying files in
> [`02_THEOREMS_AND_PROOFS/`](02_THEOREMS_AND_PROOFS/),
> [`03_CONJECTURES/`](03_CONJECTURES/), and
> [`04_EMPIRICAL_STUDIES/`](04_EMPIRICAL_STUDIES/) in both directions.

---

## 0. The feedback, stated precisely

> **On the moat, constructively.** *The overview's theory section — ASPIC+,
> Walton, AIF, Ludics, Dempster-Shafer/log-odds, Ambler's categorical
> semantics, all cited to the literature — confirms the formalism is public and
> copyable, so it isn't a moat.*

The premise is **correct and is conceded without reservation.** Every framework
named in [`docs/isonomia-overview-general.md`](../docs/isonomia-overview-general.md)
§VII is public, published, and copyable:

- **ASPIC+** — Modgil & Prakken 2014/2018; Prakken 2010.
- **Walton schemes + critical questions** — Walton, Reed & Macagno 2008; Macagno & Walton 2015.
- **AIF** — Chesñevar et al. 2006; Reed et al. 2010.
- **Ludics** — Girard 2001 (*Locus Solum*); Faggian & Hyland 2002; Terui 2011; Fouqueré & Quatrini 2013.
- **Dempster-Shafer / log-odds (weight-of-evidence)** — Shafer 1976; Good 1950s.
- **Ambler's categorical semantics of evidence** — Ambler 1996; Krause et al. 1995.

If the claim were "we invented a new logic," the feedback would be decisive.
That is **not** the claim. The overview deliberately cites these to the
literature precisely *because* it is not claiming to own them. The mistake the
feedback identifies is real but located one level too shallow: it reads the
**cited-formalism layer** as if it were the whole theory section, when the
cited-formalism layer is the programme's **declared inheritance** (see
[`06_HISTORY_AND_LINEAGE.md`](06_HISTORY_AND_LINEAGE.md) §Inheritances), not its
contribution.

The contribution is the layer the overview understates and this programme owns:
the **original results that connect, extend, refute, and re-found those public
formalisms** in ways no published source does. That layer is catalogued below.
Whether it constitutes a *moat* in the commercial sense is argued in §6; what is
not in dispute is that it is **not copyable from the literature, because it is
not in the literature.**

---

## 1. The distinction the feedback collapses

Two things are easy to conflate and must be kept apart:

| | **Inherited formalism (public)** | **Original result (this programme)** |
|---|---|---|
| Ludics | designs, behaviours, orthogonality, incarnation | per-cone JSL structure ([T001](02_THEOREMS_AND_PROOFS/T001-oq-jsl-per-cone.md)); branching Smyth-minimal separating context ([T009](02_THEOREMS_AND_PROOFS/T009-branching-smyth-minimal-separating-context.md)) |
| Dung / ASPIC+ | grounded extension, attack semantics | grounded ⇔ Ludics-orthogonality keystone ([T005](02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md)) |
| Walton schemes | scheme taxonomy + critical questions | three-layer scheme coherence ([T003](02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md)); scheme-rivalry fourth attack type ([C009](03_CONJECTURES/C009-scheme-rivalry-fourth-attack.md)) |
| Ambler categorical | SLat-enriched CCC of evidence hom-sets | the Ludics⇔Ambler bridge ([C001](03_CONJECTURES/C001-ambler-bridge-iso.md) / [T004](02_THEOREMS_AND_PROOFS/T004-jsl-fragment-bridge.md)) |
| Pollock attack typology | rebut / undermine / undercut | a candidate fourth, structural category ([C009](03_CONJECTURES/C009-scheme-rivalry-fourth-attack.md)) |
| Plexus / transport | room-to-room functor (engineering) | transport pseudofunctor + monodromy-free coherence ([T010](02_THEOREMS_AND_PROOFS/T010-plexus-coherence-pseudofunctor.md)) |

The left column is copyable. The right column is the moat candidate. The
**load-bearing observation** is that almost every original result is a *bridge*:
a theorem connecting two of the public formalisms that, in the published
literature, **have never cited each other**. The clearest example is recorded in
[`06_HISTORY_AND_LINEAGE.md`](06_HISTORY_AND_LINEAGE.md) §6:

> *"The bridge to Ludics ([C001](03_CONJECTURES/C001-ambler-bridge-iso.md)) is
> original to this programme; the two literatures have not previously cited each
> other."*

A copyist can clone any single framework off the shelf. A copyist cannot clone
the *interface theorems between them* off the shelf, because those theorems do
not exist anywhere except here.

---

## 2. Established results (theorems with proofs or cross-checked proof pointers)

These are settled in [`02_THEOREMS_AND_PROOFS/`](02_THEOREMS_AND_PROOFS/) with a
cross-check policy. None is a restatement of a published theorem.

### T001 — Per-cone join-semilattice structure
[`T001-oq-jsl-per-cone.md`](02_THEOREMS_AND_PROOFS/T001-oq-jsl-per-cone.md).
Each cone `Cᵢ` of a behaviour `B` (the designs above incarnation `Dᵢ` and below
no other incarnation) is a join-semilattice with join = literal set-union and
bottom = `Dᵢ`; the positive/daimon skeleton is invariant within a cone (the
"Daimon Lock Lemma"). **Not in the literature:** Fouqueré & Quatrini 2013 supply
the ingredients (incarnation-as-minimum, the inclusion poset) but never the
*per-cone lattice*. This is the first lattice-theoretic decomposition of a
behaviour into cones.

### T002 — `Inc(B)` is an antichain; disjoint cone decomposition
[`T002-inc-b-antichain.md`](02_THEOREMS_AND_PROOFS/T002-inc-b-antichain.md).
The incarnation set is an antichain under `⊆`, and `B` decomposes into disjoint
cones. **Not in the literature:** the synthesis (antichain from minimality alone
+ disjointness from Fouqueré–Quatrini uniqueness) yields a structural constraint
— *aggregation cannot cross cones* — that neither Ludics nor Dung argumentation
states. It is the geometric fact the synthetic-readout's refusal surface rests
on.

### T003 — Schemes layered coherence
[`T003-schemes-layered-coherence.md`](02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md).
A well-formed Walton scheme satisfies three conditions simultaneously:
presentation determines behaviour `𝓑(𝓢_S) = ⟦S⟧`; protocol soundness
`𝓟(π_S) ⊆ ⟦S⟧` (the proper-inclusion gap *is* the latent stratum); and
presentation/protocol agree on critical questions. **Not in the literature:** the
resolution of the scheme-ontology *trilemma* ([C006](03_CONJECTURES/C006-scheme-as-behaviour.md)/[C007](03_CONJECTURES/C007-scheme-as-design-schema.md)/[C008](03_CONJECTURES/C008-scheme-as-protocol-constraint.md))
as three *mutually consistent layers* rather than rival ontologies. No published
source poses this trilemma, let alone adjudicates it. Walton/Macagno treat
schemes intensionally and never connect them to a design-semantics ground truth.

### T004 — JSL fragment of the Ambler bridge
[`T004-jsl-fragment-bridge.md`](02_THEOREMS_AND_PROOFS/T004-jsl-fragment-bridge.md).
`Art(Cᵢ) ≅ Hom_{JSL⊥}(𝟐, Art(Cᵢ))` with `𝟐` the free one-generated JSL; closes
[C001a](03_CONJECTURES/C001a-jsl-fragment-bridge.md). **Honest status:** the
*algebra* is a corollary of Birkhoff's free-algebra theorem (1935) — not novel
in pure mathematics — but its **instantiation as the first proven fragment of a
Ludics⇔Ambler bridge** is. It closes one fragment and explicitly does *not*
touch the confidence-graded cartesian-closed remainder
([C001b′](03_CONJECTURES/C001b-prime-ambler-remainder.md)), which stays open.
This entry is included precisely to show the programme distinguishes "borrowed
the algebra" from "supplied the bridge."

### T005 — Grounded ⇔ Ludics keystone
[`T005-grounded-ludics-keystone.md`](02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md).
For every finite AF `F` and argument `a`: `a ∈ grounded(F)` iff `a` is accepted
by interaction (`∃σ ∀τ. ⟨⟦σ⟧ | ⟦τ⟧⟩ ⇓ †`), and the correspondence is
*strategy-preserving* (PRO strategies ↔ Proponent designs, CON ↔ Opponent tests,
orthogonality ↔ convergence). **Not in the literature:** Caminada 2006 gives the
grounded discussion game; nobody translates it into *multiplicative,
additive-free Ludics designs* with a strategy-preserving bijection onto canonical
orthogonality. This is the keystone that licenses "orthogonality testing replaces
majority vote as the certification procedure" ([`00_CHARTER.md`](00_CHARTER.md)
§0) as a *theorem* rather than an analogy.

### T006–T009 — The first-divergence / minimal-separating-context theory
[`T006-first-divergence-locus-e0.md`](02_THEOREMS_AND_PROOFS/T006-first-divergence-locus-e0.md),
[`T007-minimal-separating-locus.md`](02_THEOREMS_AND_PROOFS/T007-minimal-separating-locus.md),
[`T008-minimal-separating-context-daimon-closed.md`](02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md),
[`T009-branching-smyth-minimal-separating-context.md`](02_THEOREMS_AND_PROOFS/T009-branching-smyth-minimal-separating-context.md).
A four-theorem arc building the "minimal unshared commitment" — where exactly two
positions first diverge — from the linear case to branching disputes:
- **T006**: the first-divergence address `ξ` is unique and computable in one pass.
- **T007**: the divergence loci across opponents form a `⊑`-chain with a least element (minimality across opponents *refuted* in its first form and the entry honestly narrowed — see §4).
- **T008**: redefining a "separating context" as a *complete daimon-closed counter-design* recovers minimality relative to a fixed disagreement, and the **faithfulness lemma** pins the exact boundary where the materialized kernel diverges from symbolic Ludics (proper tests faithful; raw truncations not).
- **T009**: over concession-*trees*, the unique `≤_S`-least separating context under the **Smyth (upper-powerdomain) order** is the *antichain of per-line first-divergence loci* — and under the Hoare order no minimum exists.

**Not in the literature:** classical Ludics has Girard's separation theorem for
single design pairs; the order-relative minimality on branching disputes, the
per-line factorization, and the symbolic-vs-materialized faithfulness boundary
are all substrate-original. This arc is the formal content behind the product's
"minimal disagreement extractor."

### T010 — Plexus transport pseudofunctor + monodromy-free coherence
[`T010-plexus-coherence-pseudofunctor.md`](02_THEOREMS_AND_PROOFS/T010-plexus-coherence-pseudofunctor.md).
Transport functors between rooms form a bicategory `𝓟`; `(·)_*` is a lax functor
that restricts to a *pseudofunctor* exactly on the monodromy-free sub-bicategory
`𝓟°` (cycles with invertible alignment 2-cells); multi-hop transport is sound iff
no claims drop or drift. **Not in the literature:** the 2-cell coherence layer was
left as "future work" in the internal categorical foundations, and the
identification of claim-map *monodromy* with non-invertible 2-cell holonomy is a
translation of a live topological obstruction into categorical language that
exists nowhere else. This is what makes the overview's "one-hop, auditable to a
single source room" contract a *theorem about when more-than-one-hop is safe*,
not a hand-wave.

---

## 3. Open conjectures that are framed for settlement (and are not in the literature)

These live in [`03_CONJECTURES/`](03_CONJECTURES/). Each states what would settle
it positively and negatively. They are *owned questions*, not claimed results —
but the questions themselves are original.

- **[C001b′](03_CONJECTURES/C001b-prime-ambler-remainder.md) — Ambler-specific remainder of the bridge.** The confidence-graded, cartesian-closed content of the Ludics⇔Ambler bridge that [T004](02_THEOREMS_AND_PROOFS/T004-jsl-fragment-bridge.md) does *not* cover, formulated via the counit `ε` of a free/forgetful adjunction. Original formulation; open.
- **[C002](03_CONJECTURES/C002-reading-c-conservative.md) — Reading C is conservative over bilateral Reading A.** A translation lemma + nesting-independence claim for multi-agent Ludics. The entire "Reading C" stance (the Opponent role borne by the behaviour, not a coalition) is a *disagreement the programme owns* against the dialogue-Ludics tradition ([`06_HISTORY_AND_LINEAGE.md`](06_HISTORY_AND_LINEAGE.md) §Disagreements); no paper in the PRELUDE line adopts it.
- **[C003](03_CONJECTURES/C003-exposure-map-refines-prakken.md) — exposure-map refinement of Prakken-2024 strength.** A walked/witnessable/latent stratification with a lexicographic strength function, monotone under expansion-extension. Prakken 2024 does not subdivide dialectical strength by participant access; this does.
- **[C004](03_CONJECTURES/C004-joint-saturation-closure.md) — joint saturation is a closure operator.** `σ_joint` on the product poset (designs × witness-records), with a Galois connection and a "drainage" corollary reading deliberative progress as latent-stratum depletion. A resource-depletion model of deliberation absent from both Ludics and argumentation literature.
- **[C005](03_CONJECTURES/C005-behaviours-directed-system.md) — behaviours as a directed system whose colimit characterizes convergence.** A time-indexed family `{B_t}` under move-application with convergence as a categorical colimit. Not formalized in prior Ludics.
- **[C009](03_CONJECTURES/C009-scheme-rivalry-fourth-attack.md) — scheme-rivalry as a fourth attack category.** Two schemes with disjoint behaviours over the same claim (`⟦S₁⟧ ∩ ⟦S₂⟧ = ∅`) where no Pollock primitive (rebut/undermine/undercut) applies. **This is the sharpest single claim in the programme:** the first candidate *structural* extension of Pollock's typology — distinct from Tiozzo 2024, which subdivides *within* Pollock's three categories rather than adding a fourth.
- **[C011](03_CONJECTURES/C011-additive-preferred-games-bridge.md) — additive connectives ⇔ preferred/stable branching.** A hypothesis that Ludics additives (`&`, `⊕`) encode preferred/stable game branching. Unifies two frameworks that the argument-games and Ludics literatures keep apart; open.

(Confirmed/settled conjectures
[C006](03_CONJECTURES/C006-scheme-as-behaviour.md)–[C008](03_CONJECTURES/C008-scheme-as-protocol-constraint.md),
[C010](03_CONJECTURES/C010-grounded-orthogonality-bridge.md)→[T005](02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md),
[C013](03_CONJECTURES/C013-branching-smyth-minimal-separating-context.md)→[T009](02_THEOREMS_AND_PROOFS/T009-branching-smyth-minimal-separating-context.md),
[C014](03_CONJECTURES/C014-plexus-transport-pseudofunctor.md)→[T010](02_THEOREMS_AND_PROOFS/T010-plexus-coherence-pseudofunctor.md)
are folded into §2 via the theorems that closed them.)

---

## 4. Refutations and narrowings — the part a copyist never gets

A clone of the public formalisms inherits none of the *negative* knowledge this
programme paid for. Two are load-bearing:

- **The original OQ-JSL claim was refuted** (Phase 2e) and reformulated as the
  *per-cone* result [T001](02_THEOREMS_AND_PROOFS/T001-oq-jsl-per-cone.md). The
  global join-semilattice claim is false; the per-cone one is true. A copyist
  reading only the overview would re-derive the false version.
- **Minimality across opponents in [T007](02_THEOREMS_AND_PROOFS/T007-minimal-separating-locus.md)
  was refuted** (odd-depth truncations separate earlier) and the theorem narrowed
  to the chain-with-least-element claim, with true minimality recovered only under
  the proper-test redefinition of [T008](02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md)
  and the order-relative result of [T009](02_THEOREMS_AND_PROOFS/T009-branching-smyth-minimal-separating-context.md).

This is recorded in [`01_OPEN_QUESTIONS_REGISTRY.md`](01_OPEN_QUESTIONS_REGISTRY.md)
under the `resolved-with-redirect` status and the `audits/` diagnostics. The
*map of what does not work and why* is itself an asset that is not in any paper
and is expensive to reproduce.

---

## 5. Pre-registered empirical contributions

[`04_EMPIRICAL_STUDIES/`](04_EMPIRICAL_STUDIES/). Two of these are publishable
contributions independent of the platform:

- **[S005](04_EMPIRICAL_STUDIES/S005-scheme-pattern-ablation.md) — pattern-vs-content ablation** on scheme classification (US2016 + QT-Schemes). The literature review confirms no prior scheme-classification study (Feng & Hirst 2011; Ruiz-Dolz et al. 2025) *ablates identification patterns*. First of its kind.
- **[S006](04_EMPIRICAL_STUDIES/S006-scheme-kappa-conditional-on-pattern.md) — inter-annotator κ conditional on pattern-match**, re-annotating the Visser et al. 2020 `κ = 0.723` baseline with a primed/unprimed arm. No prior study conditions κ on identification-pattern matching.
- **[S002](04_EMPIRICAL_STUDIES/S002-cone-coverage-convergence.md) — cone-coverage as a convergence predictor**, a quantity that only exists because of [T001](02_THEOREMS_AND_PROOFS/T001-oq-jsl-per-cone.md)/[T002](02_THEOREMS_AND_PROOFS/T002-inc-b-antichain.md). No analogue in prior dialogue literature.
- **[S001](04_EMPIRICAL_STUDIES/S001-polarization-defense-asymmetry.md)**, **[S003](04_EMPIRICAL_STUDIES/S003-mcp-ai-vs-human-authorship.md)**, **[S004](04_EMPIRICAL_STUDIES/S004-scheme-assignment-agreement.md)** test platform-specific design questions (defence-asymmetry, AI-vs-human survival, pattern-conditional assignment agreement) whose *instruments* are substrate-original.

---

## 6. So where is the moat, constructively?

The moat is not the formalism, and the overview should never have let a reader
infer that it was. The defensible position is four-layered, and only the first
layer is copyable:

1. **Cited formalisms (copyable, and conceded).** ASPIC+, Walton, AIF, Ludics,
   log-odds, Ambler. Anyone can read the papers. This is table stakes, not a moat.

2. **Bridge theorems no one has published (not copyable from literature).**
   grounded⇔Ludics ([T005](02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md)),
   Ludics⇔Ambler ([T004](02_THEOREMS_AND_PROOFS/T004-jsl-fragment-bridge.md) +
   [C001b′](03_CONJECTURES/C001b-prime-ambler-remainder.md)),
   schemes⇔design-semantics ([T003](02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md)),
   transport⇔pseudofunctor ([T010](02_THEOREMS_AND_PROOFS/T010-plexus-coherence-pseudofunctor.md)).
   A competitor who clones each framework still has to *connect* them, and the
   connections are where every hard theorem lives. The literatures being bridged
   "have not previously cited each other"
   ([`06_HISTORY_AND_LINEAGE.md`](06_HISTORY_AND_LINEAGE.md) §6).

3. **Substrate-original results and refutations (not copyable at all).** Per-cone
   JSL ([T001](02_THEOREMS_AND_PROOFS/T001-oq-jsl-per-cone.md)), the
   minimal-separating-context arc
   ([T006](02_THEOREMS_AND_PROOFS/T006-first-divergence-locus-e0.md)–[T009](02_THEOREMS_AND_PROOFS/T009-branching-smyth-minimal-separating-context.md)),
   the scheme-rivalry fourth attack type
   ([C009](03_CONJECTURES/C009-scheme-rivalry-fourth-attack.md)), and the *map of
   dead ends* (§4). This is knowledge that exists only here and only because the
   work was done here.

4. **The implementation that makes all of it shippable on one data model.** The
   overview's own thesis — that the inferential structure deserves first-class
   infrastructure *and that the infrastructure can sit beneath an interface
   ordinary communities will actually use*. The theorems above are load-bearing
   for product surfaces (orthogonality certification, synthetic-readout refusal,
   one-hop transport audit, minimal-disagreement extraction); reproducing them
   means reproducing the integration, not just reading a paper.

**The correct one-sentence rebuttal to the feedback:** the cited formalisms are
the *inheritance the programme declares*, not the contribution it claims; the
contribution is the body of bridge theorems, substrate-original results, paid-for
refutations, and integrated implementation indexed above — none of which is in
the literature, because this programme produced it.

A secondary, non-technical point also holds: the project is *open-source by
design* ([`docs/isonomia-overview-general.md`](../docs/isonomia-overview-general.md)
§X), so "copyable" is partly the intended posture, not an accident. For an
open-source civic-infrastructure project the durable advantages are accumulated
theoretical depth, the falsification record, the integration, and the
community/data-trust position — not secrecy of formalism. The moat question
should be answered on those terms, and on those terms §2–§5 are the evidence.

---

## 7. Maintenance

- When a new theorem closes a conjecture, move its line from §3 into §2 and add
  the file links in both directions, per the
  [`00_CHARTER.md`](00_CHARTER.md) §Maintenance ritual.
- When a result is refuted or narrowed, record it in §4 with a pointer to the
  `audits/` diagnostic, never by deletion.
- Keep §6's four-layer framing in sync with the overview; if the overview's
  theory section is revised to foreground layers 2–4, note it here.
