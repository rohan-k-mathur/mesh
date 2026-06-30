# T012-Aspic — structured argument trees and derived ASPIC+ attacks

Second increment of handoff **item 1** (deepening
[T012Struct](../T012Struct/README.md)): model genuine ASPIC+ structured
arguments as inference **trees** and **derive** the three attack types from
argument structure, rather than treating the attack-type as an opaque
label. Status: **type-checks without postulates or holes** (`--safe
--without-K`). Evidence under the Theorem Register policy.

## The gap it deepens

[T012Struct](../T012Struct/T012Struct.agda) lifted Reading-C conservativity
to structured witnesses, but modelled each argument only by an opaque
attack-type + read-polarity. This file gives that label **provenance**:
arguments are inference trees (premises / strict+defeasible rules /
conclusions over a contrariness relation), and the three ASPIC+ attack
types are **derived** from where the conflict lands (Modgil & Prakken 2013;
faithful to [`lib/aspic/attacks.ts`](../../../../lib/aspic/attacks.ts)).

## The model

`module Core (Formula) (_⌣_)` (contrariness `φ ⌣ ψ`):

- `Arg` — `prem φ k` (a premise leaf with KB-kind `axiom`/`ordinary`/
  `assumption`) or `infer r as` (an inference from a `Rule` and
  sub-arguments). `conc`, `topDef` (has a defeasible top rule), `subs`
  (reflexive sub-arguments), `prems` (the premise leaves with their kind).
- The three **derived** attack relations (`conc A` contrary to a structural
  target of B):
  - `Undermines A B` — a **fallible premise** of B (`Fallible ordinary =
    Fallible assumption = ⊤`, `Fallible axiom = ⊥`: axioms protected);
  - `Rebuts A B` — the **conclusion** of a defeasibly-topped sub-argument;
  - `Undercuts A B` — the **rule-name** of a defeasibly-topped sub-argument.
- `Attacks = Undermines ⊎ Rebuts ⊎ Undercuts`, and `typeOf` derives a
  T012Struct-style `AType` from a structural attack — the provenance map.

## What this proves

### §3 — the ASPIC+ restrictions, as structural theorems

- `firm-not-underminable` — an all-axiom argument admits **no** undermining
  attack (axioms are necessary, protected).
- `strict-not-rebuttable` / `strict-not-undercuttable` — a defeasible-free
  argument can be **neither** rebut nor undercut (restricted rebut; only
  defeasible inferences are challengeable).

These are faithfulness checks of the ASPIC+ definitions, proved by
structural recursion (`Fallible axiom ≡ ⊥`, `T false ≡ ⊥`).

### §4 — the re-typing symmetry classification

The structural ground of T012Struct's `conv-pol-sym` residual — *which*
attack types survive a polarity re-typing:

- `rebut-sym` — under **symmetric** contrariness, two mutually-contrary
  defeasibly-topped arguments **rebut each other**. So a re-typing of a
  rebut is again a rebut — the **fixed point**, structurally (no substrate
  symmetry needed).
- `module Witness` — a concrete theory (`a ↔` premise `p`; `A` defeasibly
  concludes `np` from premise `q`): `A-undermines-B` holds, but
  `¬B-undermines-A` (B does **not** undermine A) while `B-rebuts-A` (B
  attacks back as a **rebut**). So the attack **type is not preserved**
  under the role-flip for undermine — it reorients undermine ↦ rebut. This
  is exactly why `conv-pol-sym` is **structural for rebut** and
  **load-bearing for undermine/undercut** (T012Struct (C)). `U-undercuts-A`
  exhibits the third type; `type-undermine` / `type-rebut` / `type-undercut`
  confirm the derivations classify correctly.

## Scope / what this is *not*

- It models argument trees + contrariness + the attack derivations and
  their structural laws. It does **not** compute defeats / preferences /
  extensions (that is the labelling engine), nor re-run the Reading-C
  `⋀`-lift ([T012Struct](../T012Struct/T012Struct.agda) does, now with
  `AType` derivable here via `typeOf`).
- Contrariness symmetry is a **hypothesis** where used (`rebut-sym`), not
  assumed globally — ASPIC+ contraries may be asymmetric.
- Still open for item 1: connecting `typeOf` into T012Struct's `convS` so
  the lift consumes *derived* types end-to-end, and deriving `conv-pol-sym`
  from a kernel ⟦·⟧₊ model (blocked on substrate polarity re-typing, which
  does not yet exist).

## Build

Requires Agda 2.7.0.1+ and `agda-stdlib` v2.0 (pinned). From
`mechanisation/agda`:

```sh
agda T012Aspic/T012Aspic.agda
```

Expected: clean, no errors/warnings/unsolved metas.

## Correspondence to ASPIC+ (lib/aspic)

| Toy (this file)            | ASPIC+ object                                              |
|----------------------------|------------------------------------------------------------|
| `Formula` / `_⌣_`          | language `L` / contrariness `φ̄` (`system.contraries`)      |
| `PremKind` (axiom/ord/asm) | KB partition `Kn` / `Kp` / `Ka` (`knowledgeBase`)          |
| `Rule` (`rtype`/`rname`)   | strict/defeasible rule + name `n : Rd → L`                 |
| `Arg` (`prem`/`infer`)     | an argument inference tree (`lib/aspic/types.ts Argument`) |
| `conc`/`topDef`/`subs`/`prems` | `conc`/`TopRule`/`Sub`/`Prem`                         |
| `Undermines`/`Rebuts`/`Undercuts` | the three attacks (`lib/aspic/attacks.ts`)         |
| `firm-not-underminable`    | axioms (`Kn`) cannot be undermined                        |
| `strict-not-rebuttable`    | restricted rebut (strict conclusions protected)           |
| `rebut-sym` / `Witness`    | re-typing fixed point (rebut) vs reorientation (undermine) |
| `typeOf`                   | the attack-type provenance feeding T012Struct's `AType`    |
