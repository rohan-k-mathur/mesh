# Session 10 — Scheme-rivalry: a candidate fourth Pollock attack category

**Date:** 2026-06-12
**Direction:** Argumentation-scheme cluster (inner ring) — not part of the six-direction foundational spine; the sharpest single open *typology* claim in the programme.
**Status:** **NOT STARTED** — landing file only; header + read-first links + attack-plan spine pre-wired. No work done, no decisions taken.
**Purpose:** begin brainstorming and working through whether the substrate genuinely requires a **fourth, structural attack category** beyond Pollock's rebut / undermine / undercut trichotomy — the **scheme-rivalry** conjecture ([C009](../03_CONJECTURES/C009-scheme-rivalry-fourth-attack.md)) — and drive it toward either positive settlement (a new theorem `T-NNN` + an `attackType` enum-widening) or negative settlement (the trichotomy is adequate for the substrate; close [Q-016](../01_OPEN_QUESTIONS_REGISTRY.md#q-016) negatively). Both outcomes are real results.

---

## The conjecture (verbatim target)

Pollock's rebut / undermine / undercut trichotomy is treated as exhaustive throughout the argumentation literature. The programme conjectures a fourth, *structural* category — **scheme-rivalry**: two scheme applications `apply(S₁, x)` and `apply(S₂, x)` over the *same* claim `x` with **disjoint behaviours** (`⟦S₁⟧ ∩ ⟦S₂⟧ = ∅`), where neither rebuts, undermines, nor undercuts the other in Pollock's sense — both may have impeccable premises and impeccable inferences — yet the combined commitment is incoherent.

## Read first (standing artifacts this builds on)

- [`03_CONJECTURES/C009-scheme-rivalry-fourth-attack.md`](../03_CONJECTURES/C009-scheme-rivalry-fourth-attack.md) — the conjecture, its positive/negative settlement criteria, and the C006/C007/C008-native restatements (behaviour-intersection emptiness / locus-tree non-unifiability / protocol incompatibility).
- [`01_OPEN_QUESTIONS_REGISTRY.md` Q-016](../01_OPEN_QUESTIONS_REGISTRY.md#q-016) — the specific extensionality question C009 would close; and **Q-011** — the general Pollock-exhaustiveness question (Q-016 is its specific instance).
- [`02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md`](../02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md) — the **resolved** scheme-ontology trilemma: a scheme is simultaneously a behaviour (C006), a presentation (C007), and a protocol (C008). C009 is explicitly *independent of* the trilemma but inherits its vocabulary.
- Behaviour is now **mechanized**: [`mechanisation/agda/ludics/Completeness.agda`](../mechanisation/agda/ludics/Completeness.agda) gives `⟦S⟧` as a biorthogonally-closed design set (`B = B⊥⊥`); [`mechanisation/agda/hott/Scheme.agda`](../mechanisation/agda/hott/Scheme.agda) treats a scheme as a dependent type with CQs as elimination obligations. "Disjoint behaviours" therefore has a concrete, machine-checkable referent for the first time — use it.
- Substrate enum under pressure: [`components/admin/SchemeCreator.tsx`](../../components/admin/SchemeCreator.tsx) (`attackType: REBUTS | UNDERMINES | UNDERCUTS`), the parallel `argument_scheme_cq` column, and the AIF round-trip in [`lib/aif/syncArgument.ts`](../../lib/aif/syncArgument.ts) (which would need a translation policy if the enum widens — AIF has no native category).

## Attack-plan spine (adapt as evidence dictates)

1. **Sharpen the definitions.** State scheme-rivalry precisely in each trilemma vocabulary (C006 behaviour-intersection emptiness; C007 locus-tree non-unifiability; C008 protocol incompatibility). Decide the *primary* formulation (likely C006, now that behaviour is mechanized) and which are derived.
2. **The reduction stress-test (the real risk).** Try hard to make every candidate scheme-rivalry attack factor through a Pollock primitive — most dangerously, that `⟦S₁⟧ ∩ ⟦S₂⟧ = ∅` always factors through an undermine-able premise. If the reduction always succeeds, C009 dies and Q-016 closes negatively (the trichotomy is adequate — a real result). If a principled obstruction blocks it, that obstruction is the heart of the positive case.
3. **Hunt a witness in the production scheme catalogue.** Find a pair `⟨apply(S₁, x), apply(S₂, x)⟩` satisfying C009's three criteria (no Pollock primitive applies; behaviour-intersection emptiness detected; practitioners recognize it as a legitimate attack). Hunting grounds: schemes that license *competing* conclusions about one claim without contradicting each other's premises. The empirical-vacuity failure mode (well-defined but never holds in production) is also a negative settlement.
4. **Decidability.** Is behaviour-intersection emptiness *decidable* in the finitely-generated regime? The mechanized biorthogonal closure is where to check `⟦S₁⟧ ∩ ⟦S₂⟧ = ∅` computability and cost (connects to [Q-044](../01_OPEN_QUESTIONS_REGISTRY.md#q-044), the complexity question).
5. **The exportable claim.** If it survives: the first *structural* addition to Pollock's typology rather than a subdivision within it. Be precise about *why* structural (a property of the *schemes*, not of any premise/inference/conclusion) — that precision is what makes it a fourth category rather than a special case of undercut.

## Deliverables & discipline

- This session record, with decisions tagged **conjecture / resolved / parked**, definitions sharpened, the reduction stress-test attempted, and the catalogue-witness search results (positive, negative, or vacuous — all are results).
- Update C009's status and Q-016's `next-action`. If a witness lands: scope `T-NNN-scheme-rivalry-attack.md` + the exact `attackType` enum-widening + AIF translation policy. If the reduction succeeds: close Q-016 negatively with the reduction recorded.
- Add this session to the [`10_IDEATION_SESSIONS/README.md`](README.md) index.
- **No-premature-premise rule:** scheme-rivalry stays a **conjecture** until a witness *and* the practitioner-recognition criterion are both met; no downstream design may assume it.

---

## Session log

*(empty — to be filled when the session runs)*

### Inbound leads (recorded before the session runs)

- **2026-06-12 — candidate witness supplied by [session 11](11-lumer-practical-arguments-2026-06-12.md) §8.** The Lumerian material gives a ready-made candidate for step 3 (catalogue-witness hunt): **Burkholder's deductivist reconstruction of Pascal's wager** = decision-theoretic-vs-deductive scheme-rivalry on one claim (`practical/pascal`, profile-relative behaviour, vs the deductive modus-ponens reconstruction, monotonic behaviour) — disjoint behaviours, no Pollock primitive, with Lumer's adjudication criteria (clarity / authenticity / immanence / situational adequacy) supplying the criterion-3 practitioner-recognition test. Session 11 also sharpened C009's positive test: **scheme-rivalry ≠ profile-rivalry** — the spec §4 profile-rivalry exclusion removes a *false-positive* class (profile-sensitivity within one scheme) and does **not** narrow C009. See [C009 §"Candidate witness supplied"](../03_CONJECTURES/C009-scheme-rivalry-fourth-attack.md).
