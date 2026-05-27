# C006 — A scheme is a behaviour: `⟦S⟧ ⊆ Designs` is the ⊥⊥-closed set of proponent designs that survive every CQ in S's CQ-bundle played as opponent

- **status:** open
- **ring:** core
- **depends-on:** T001 (per-cone JSL), T002 (Inc antichain)
- **linked-open-questions:** Q-011, Q-012, Q-015
- **mutually-exclusive-with:** C007, C008 (the three competing scheme-ontology readings)
- **last-reviewed:** 2026-05-27

## Statement

There is a canonical assignment `S ↦ ⟦S⟧ ⊆ Designs` such that, for every
Walton/Macagno-style argumentation scheme `S` with CQ-bundle
`CQ(S) = {q₁, …, qₖ}`:

1. `⟦S⟧ = {D ∈ Designs : ∀i, D ⊥ qᵢ-as-opponent-design}^⊥⊥`, i.e. `⟦S⟧` is
   the biorthogonal closure of the set of proponent designs that defend
   every CQ played as an opponent move.
2. Two schemes `S₁, S₂` are *the same scheme* iff `⟦S₁⟧ = ⟦S₂⟧` —
   regardless of differences in Walton/Macagno taxonomy fields, identification
   patterns, or natural-language CQ text.
3. The scheme hierarchy `S' ⊑ S` (child ⊑ parent under `parentSchemeId`)
   holds iff `⟦S'⟧ ⊆ ⟦S⟧` — i.e. inheritance is *lattice refinement of
   behaviours*, not set-union of CQs.

## Positive settlement

A worked construction giving `⟦·⟧` on at least three production schemes of
distinct cluster families (`authority_family`, `causal_family`,
`similarity_family`), together with:

- a proof that `⟦S⟧` is non-empty for every well-formed `S`;
- a demonstration that two distinct production schemes with identical taxonomy
  fields but different CQ-bundles produce distinct `⟦·⟧`;
- a check that the existing `parent → child` relations in the database
  satisfy `⟦child⟧ ⊆ ⟦parent⟧`.

Filed as `T-NNN-scheme-behaviour-semantics.md` with `closes: Q-012`
(inheritance settled positively in favour of behaviour refinement).

## Negative settlement

Either:

- a production scheme `S` for which `⟦S⟧ = ∅` (no design satisfies all CQs),
  showing the behavioural semantics rules out schemes practitioners
  legitimately use; or
- two production schemes `S₁, S₂` that practitioners treat as *distinct*
  (different `key`, different identification patterns, different intended
  applications) but for which `⟦S₁⟧ = ⟦S₂⟧`, showing the behavioural semantics
  conflates schemes practitioners distinguish.

## Consequences if confirmed

- Scheme identity is *extensional* — the admin UI's Walton taxonomy fields
  become discovery metadata, not constitutive identity.
- `inheritCQs: false` becomes incoherent: a child's behaviour is determined
  by its CQ-bundle, not by a flag.
- The "Create Scheme" path must validate non-emptiness of `⟦S⟧` before
  persistence.
- Scheme suggestion (the identification-pattern feature) can in principle be
  replaced by behaviour-membership testing on the candidate argument.

## Consequences if refuted

If two practitioner-distinct schemes have identical `⟦·⟧`, then *something
extra-behavioural is part of scheme identity* — the natural candidates are
the identification patterns and the cluster_family placement. This pushes
the right reading toward C007 (design schema) or C008 (protocol constraint).

## Bibliography

- Girard 2001 *Locus Solum* MSCS 11(3) (behaviours and biorthogonal closure)
- Fouqueré & Quatrini 2013 LMCS 9(4:6) (incarnations)
- Walton, Reed & Macagno 2008 *Argumentation Schemes* (CQ bundles)
- [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_GENERATIVE_SUBSTRATE.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_GENERATIVE_SUBSTRATE.md)
- [`../../Development and Ideation Documents/ARCHITECTURE/SCHEMES_THEORETICAL_FOUNDATIONS.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_THEORETICAL_FOUNDATIONS.md) Cluster A
