# T012-End2End — closing item 1's self-contained portion

The end-to-end wiring of handoff **item 1**'s two structured increments:
ASPIC+ structured arguments → **structurally-derived** attack types → the
Reading-C `⋀`-lift + full re-typing, composed in one type-checked pipeline.
Status: **type-checks without postulates or holes** (`--safe --without-K`).

## What it composes

| layer | module | what it provides |
|-------|--------|------------------|
| structured arguments | [T012Aspic](../T012Aspic/T012Aspic.agda) | argument trees; the three attack types **derived** from structure (`typeOf`) |
| Reading-C lift | [T012Struct](../T012Struct/T012Struct.agda) | the `⋀`-aggregation lifted verbatim + full mid-proof re-typing (`retype-neutral`), parametric in the verdict |
| **this file** | `T012End2End` | `swOf` turns any structural attack into a witness whose `atype` is the **derived** `typeOf`; the Reading-C development then runs on the derived behaviour |

## What this proves

- **`atypeMap` / `swOf`** — the pipeline step: a structural attack
  `Attacks X Y` becomes a T012Struct witness `S.SW` whose `atype` is
  `atypeMap (typeOf att)` — the attack type **computed from argument
  structure**, not stipulated.
- **`w-undermine` / `w-rebut` / `w-undercut`** — three witnesses built from
  the genuine ASPIC+ attacks of `T012Aspic.Witness` (an undermine, a rebut,
  an undercut), with **`derived-undermine` / `derived-rebut` /
  `derived-undercut`** confirming each `atype` is exactly the corresponding
  ASPIC+ type (`refl`).
- **`rc`** — the Reading-C verdict holds on the derived behaviour; **`rc-retyped`**
  — full mid-proof re-typing (flip the undermine and undercut polarities,
  keep the rebut) preserves it, via `retype-neutral`. The other clauses
  (`fidelity` / `nesting-invariant` / `conservativity`) apply identically,
  being the same `ReadingC`.

So the attack-type label T012Struct consumes is no longer opaque: it is
derived from argument structure, end-to-end. **This closes the
self-contained portion of item 1.**

## What remains open (blocked, not in this file)

The one remaining piece of item 1 is deriving T012Struct's `conv-pol-sym`
(the substrate cut-symmetry) from a kernel `⟦·⟧₊` model rather than
asserting it. That needs Ludics **substrate polarity re-typing**, which does
not yet exist (`Action.polarity` is static). T012Aspic §4/§4' already
classify *where* that symmetry is structural (rebut, the fixed point) vs.
load-bearing (undermine/undercut, which the role-flip reorients) — so the
obligation is precisely scoped, awaiting the substrate mechanism.

## Build

Requires Agda 2.7.0.1+ and `agda-stdlib` v2.0 (pinned); resolves
[T012Aspic](../T012Aspic/T012Aspic.agda), [T012Struct](../T012Struct/T012Struct.agda)
(hence [T012](../T012/T012.agda)) via [`../mesh-substrate.agda-lib`](../mesh-substrate.agda-lib).
From `mechanisation/agda`:

```sh
agda T012End2End/T012End2End.agda
```

Expected: clean, no errors/warnings/unsolved metas.
