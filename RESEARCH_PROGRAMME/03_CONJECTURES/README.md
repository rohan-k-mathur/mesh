# Conjectures Register

> Each conjecture is a single file `CNNN-slug.md`. A conjecture is *settleable*:
> the file states both what positive settlement looks like (proof reference)
> and what negative settlement looks like (a counterexample of a specified
> shape). When settled positively, the conjecture is migrated to
> [`../02_THEOREMS_AND_PROOFS/`](../02_THEOREMS_AND_PROOFS/) with `closes:`
> updated. When refuted, the file stays here with `status: refuted` and a
> `refuted-by` link.

## Required fields

```
- status: open | partially-resolved | proven (then migrate) | refuted | withdrawn
- ring: core | inner | middle | outer
- depends-on: theorem-IDs, other conjectures
- positive-settlement: what a proof would look like, where it would go
- negative-settlement: what a counterexample would look like, in what form
- bibliography: in-repo paths and external citations
- linked-open-questions: Q-NNN
- last-reviewed: YYYY-MM-DD
```

## Seed conjectures

- [C001 — Ambler bridge as faithful iso](C001-ambler-bridge-iso.md)
- [C002 — Reading C conservativity](C002-reading-c-conservative.md)
- [C003 — Exposure-map refinement of Prakken expansions](C003-exposure-map-refines-prakken.md)
- [C004 — Joint saturation as closure operator](C004-joint-saturation-closure.md)
- [C005 — Time-indexed behaviours form a directed system](C005-behaviours-directed-system.md)
- [C010 — Grounded extension ⟺ canonical Ludics-orthogonality acceptance](C010-grounded-orthogonality-bridge.md) — *partially-resolved: grounded fragment proved by [T005](../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md)*
- [C011 — Additive Ludics structure ⟺ branching of preferred / stable argument games](C011-additive-preferred-games-bridge.md) — *open: the Phase-4 lift of T005 past the additive-free boundary*
- [C012 — First-divergence locus is the minimal separating context (minimal unshared commitment)](C012-separation-minimal-locus.md) — *open: Direction 2 (separation / locus-of-disagreement); minimality across all opponent designs is the real theorem, not first-divergence uniqueness*
- [C013 — Smyth-minimal separating context of a branching dispute = the per-line first-divergence antichain](C013-branching-smyth-minimal-separating-context.md) — *open (corroborated): Direction 2 / Q-041 O2 (branching); abstract daimon-closed-tree proof outstanding — the Direction-5 target*
- [C014 — Plexus transport pseudofunctor: multi-hop composes without provenance drift iff alignment 2-cells invertible + band dedupes by origin](C014-plexus-transport-pseudofunctor.md) — *promoted → [T010](../02_THEOREMS_AND_PROOFS/T010-plexus-coherence-pseudofunctor.md) (**established**, cross-checked 2026-06-08); Direction 4 sub-program A; unified A0+A1+B2b, discharged D1–D4 + H2; registers [Q-042](../01_OPEN_QUESTIONS_REGISTRY.md#q-042)*
- [C015 — possibilistic Čech $H^1$ of the Plexus claim-sheaf is supported exactly outside $\mathcal{P}^\circ$; Abramsky contextuality = T010 iso-monodromy obstruction](C015-possibilistic-cohomology-iso-monodromy.md) — *promoted → [T011](../02_THEOREMS_AND_PROOFS/T011-possibilistic-cohomology-iso-monodromy.md) (**established**, cross-checked 2026-06-08 — D1 returned, repaired, re-check signed off); Direction 4 sub-program B; `cech` construction, holonomy-group rank $\log_2|G|$; closes [Q-043](../01_OPEN_QUESTIONS_REGISTRY.md#q-043) (i)+(ii); live-witness (iii) stays open*
- [C016 — an epistemological-principle layer beneath the T003 trilemma: the CQ-bundle is derived from a scheme's epistemological principle, upgrading "scheme identity = its CQs" from definition to theorem](C016-epistemological-principle-fourth-layer.md) — *open: argumentation-scheme cluster (Session 11); local practical-family stratum (decision-theoretic principle, CQs = its failure modes) is the warm-up, universal version the theorem-target, vacuity (principle not definable independent of CQs) the primary negative settlement; registers [Q-048](../01_OPEN_QUESTIONS_REGISTRY.md#q-048), touches [T003](../02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md) + the mechanized `hott/Scheme.agda` univalence result*
