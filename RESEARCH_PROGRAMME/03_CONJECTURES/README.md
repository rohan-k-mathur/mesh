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
