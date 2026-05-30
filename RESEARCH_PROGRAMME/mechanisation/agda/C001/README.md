# C001a — JSL-fragment Ambler bridge, Agda mechanisation

Toy mechanisation of [C001a](../../../03_CONJECTURES/C001a-jsl-fragment-bridge.md)
(the JSL fragment of the Ambler bridge). Status: **type-checks
without postulates or holes**. Not a positive settlement of C001a
under the [Theorem Register policy](../../../02_THEOREMS_AND_PROOFS/README.md);
this is *evidence for* C001a only.

## History

This directory previously held `Toy.agda`, an exploratory skeleton for
the *unsplit* [C001](../../../03_CONJECTURES/C001-ambler-bridge-iso.md).
That file was retired on 2026-05-28 after the mechanisation surfaced
three findings (F1 structure preservation, F2 setoid equality, F3
free-generator absence) that motivated splitting C001 into
[C001a](../../../03_CONJECTURES/C001a-jsl-fragment-bridge.md) (this
artefact) and [C001b](../../../03_CONJECTURES/C001b-ambler-remainder.md)
(deferred). See [C001 §Mechanisation strategy](../../../03_CONJECTURES/C001-ambler-bridge-iso.md)
for the findings.

## What this proves

The toy version of:

> `Art(Cᵢ) ≅ Hom_{JSL}(Gen, Art(Cᵢ))`

where `Gen` is the free JSL on one generator (`{⊥g, *g}`), the iso
holds *up to* the cone-level setoid `≈ᶜ` (which lifts the design-level
`≈ᴰ` set-equality from F2), and the two maps are:

- `fromHom h := h(*g)`
- `toHom c := the unique JSL-hom sending *g to c`

Both triangles type-check:

- `from-to : ∀ c → fromHom (toHom c) ≡ c` — by `refl`.
- `to-from : ∀ h → toHom (fromHom h) ≈H h` — by `pres-bot` (at `⊥g`) and `≈ᶜ-refl` (at `*g`).

The four `pres-⊔` obligations on `toHom` discharge mechanically by
`⊆ᴰ-++-collapse` + `⊆ᴰ-refl` + the cone witness `proj₂ c`.

## Build

Requires:

- Agda 2.7.0.1 or later (tested on 2.8.0)
- `agda-stdlib` **v2.0 pinned** — v2.1+ ships `--warn=noUserWarning`
  which is not recognised by all Agda builds. Pin with:
  ```sh
  cd ~/.agda/agda-stdlib && git checkout v2.0
  ```

Type-check:

```sh
agda C001a.agda
```

Expected output: clean, no errors, no warnings, no unsolved metas.

## Interactive workflow

Not needed — the proof is complete. To inspect it:

- Open `C001a.agda` in VS Code with the `banacorn.agda-mode` extension.
- `C-c C-l` to load.
- Click on any term and `C-c C-,` to see its inferred type.
- The substantive content is in `module Bridge`: `toHom`, `from-to`, `to-from`.

The setoid layer `_≈ᴰ_` / `_≈ᶜ_` (finding F2) is unavoidable here
because `_∪ᴰ_` is implemented as list concatenation, which is not
propositionally idempotent (`D ++ D ≢ D`); the iso lives at the
set-equality layer, not at `_≡_`.

## Correspondence to the substrate

| Toy (this file)                  | Substrate object                             |
|----------------------------------|----------------------------------------------|
| `Sig` with `pro`, `con`          | restricted toy of `A_Γ` (no Conf grading)    |
| `Design` (list of `Move`)        | finite chronicle-tree (Phase 2f reading)     |
| `_⊆ᴰ_` (functional)              | literal set-inclusion on `Design.loci[]`     |
| `_≈ᴰ_` / `_≈ᶜ_`                  | chronicle-set equality (the setoid from F2)  |
| `Cone Dᵢ`                        | the cone above `Dᵢ` (T001)                   |
| `JSLHom`-style record            | per-cone JSL `(Cᵢ, ⊆, ∪)` (T001)             |
| `Gen` (free 1-generator JSL)     | the free JSL `𝟐` from C001a §Statement       |
| `fromHom` / `toHom` / triangles  | the bridge iso, up to `≈ᶜ`                   |

The previous Toy.agda also had `Erase` and a `Hom`-as-endomap module;
both are dropped here: erasure belongs to [C001b](../../../03_CONJECTURES/C001b-ambler-remainder.md),
and the endomap shape `Cone Dᵢ → Cone Dᵢ` collapsed the free-generator
(finding F3) and is replaced by `Gen → Cone Dᵢ`.

## What this cannot check

Per [C001a §Mechanisation](../../../03_CONJECTURES/C001a-jsl-fragment-bridge.md):

- Faithfulness of the toy `Sig` to Ambler 1996 — human review.
- Match of the toy's flat `List Move` to the substrate's
  chronicle-tree designs — human review.
- The confidence-erasure square (out of scope for C001a; belongs to
  [C001b](../../../03_CONJECTURES/C001b-ambler-remainder.md)).
- The negative-settlement clause for C001a (a counterexample must rule
  out *all* candidate `fromHom`/`toHom`, not just the ones encoded here).

## Provenance

- Drafted: 2026-05-28 (initial `Toy.agda` skeleton)
- Reformulated: 2026-05-28 (replaced by `C001a.agda` after the C001 split)
- Closed (toy iso, up to `≈ᶜ`): 2026-05-28
- Tracks: [Q-001](../../../01_OPEN_QUESTIONS_REGISTRY.md#q-001--is-the-ambler-bridge-artb--hom_a_a-b-a-faithful-isomorphism-or-only-a-structure-preserving-functor),
  [C001](../../../03_CONJECTURES/C001-ambler-bridge-iso.md),
  [C001a](../../../03_CONJECTURES/C001a-jsl-fragment-bridge.md)
- Depends on (substrate): [T001](../../../02_THEOREMS_AND_PROOFS/T001-oq-jsl-per-cone.md), [T002](../../../02_THEOREMS_AND_PROOFS/T002-inc-b-antichain.md)
