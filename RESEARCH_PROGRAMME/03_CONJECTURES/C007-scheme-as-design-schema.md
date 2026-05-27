# C007 — A scheme is a design schema: a partially-specified design (locus tree with typed holes for premise variables) plus a CQ-bundle determining its orthogonal completion

- **status:** open
- **ring:** core
- **depends-on:** T001, T002
- **linked-open-questions:** Q-011, Q-012, Q-015
- **mutually-exclusive-with:** C006, C008
- **last-reviewed:** 2026-05-27

## Statement

There is a canonical assignment `S ↦ ⟨L_S, V_S, Φ_S, CQ_S⟩` where:

- `L_S` is a finite locus tree (the scheme's structural skeleton);
- `V_S` is a finite set of typed variables corresponding to the scheme's
  premise variables (the `variables: string[]` field on `Premise` in
  [`components/admin/SchemeCreator.tsx`](../../components/admin/SchemeCreator.tsx),
  e.g. `["E", "S", "A"]` for Argument from Expert Opinion);
- `Φ_S : V_S → Λ` is a *hole map* sending each variable to a designated
  open sub-locus of `L_S`;
- `CQ_S` is the CQ-bundle, each CQ targeting a node of `L_S`.

A *scheme instance* is a substitution `v ↦ D_v ∈ Designs` for each `v ∈ V_S`
that produces a closed design by plugging each `D_v` at `Φ_S(v)`. Scheme
identity is *intensional*: two schemes are the same iff their tuples
`⟨L, V, Φ, CQ⟩` agree up to renaming.

Scheme membership is decidable by unification: an argument `A` instantiates
scheme `S` iff there is a substitution `θ: V_S → Designs` with
`A = L_S[θ]`.

## Positive settlement

A worked encoding of three production schemes (one from `authority_family`,
one from `practical_reasoning_family`, one from `evidence_family`) as
explicit `⟨L_S, V_S, Φ_S, CQ_S⟩` tuples, together with:

- a unification algorithm that decides instance-of(S) for a candidate design
  in time polynomial in `|S| + |A|`;
- a demonstration that the production scheme `argument_from_expert_opinion`
  unifies on its known canonical instances and fails on a hand-curated set
  of near-misses;
- a check that this reading explains why the admin UI has a `variables`
  field on each premise — it is implementing this encoding implicitly.

## Negative settlement

A production scheme whose premise-variable structure cannot be made
sense of as a hole map without postulating variables that the admin UI
does not expose (e.g. an implicit "domain" variable inferred from context).
Or: two distinct argument-instances whose unification produces the same
substitution but which practitioners judge as instances of *different*
schemes.

## Consequences if confirmed

- The admin UI's `variables` field becomes load-bearing, not cosmetic.
- Inheritance (Q-012) gets a clean semantics: child schemes have *more
  constrained* hole maps (additional type predicates on `Φ_S`).
- The "Generate from Taxonomy" feature (Q-013) becomes a generator of
  `CQ_S` from the *shape of `L_S`*, which is what practitioners actually
  expect.
- Scheme composition (Q-015) corresponds to plugging one scheme's locus
  tree into another's hole — directly the cut-composition picture.

## Consequences if refuted

If unification fails to discriminate practitioner-distinct schemes, the
*structural skeleton* `L_S` is not what individuates schemes. Push toward
C006 (the structure is incidental; behaviour is identity) or C008 (the
individuating fact is the protocol that *would* govern the scheme's
deployment, not its formal structure).

## Bibliography

- Walton, Reed & Macagno 2008 *Argumentation Schemes* (premise/conclusion
  variable structure)
- AIF specification (Chesñevar et al. 2006) for the RA-node-with-variables
  encoding
- Faggian & Hyland 2002 CSL (designs with open loci as the natural site of
  the hole encoding)
- Snaith & Reed 2017 *Argument & Computation* (TOAST and AIF-RA chaining)
- [`../../Development and Ideation Documents/ARCHITECTURE/SCHEMES_THEORETICAL_FOUNDATIONS.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_THEORETICAL_FOUNDATIONS.md) Cluster A
