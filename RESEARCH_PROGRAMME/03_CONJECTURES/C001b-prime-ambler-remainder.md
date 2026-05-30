# C001b′ — Ambler-specific remainder, restated at the power-set-of-incarnations target

- **status:** open (filed 2026-05-29)
- **ring:** core
- **tier:** formal
- **depends-on:** [T001](../02_THEOREMS_AND_PROOFS/T001-oq-jsl-per-cone.md) (per-cone JSL, used as a structural lemma even though the bridge target is at a different level), [T002](../02_THEOREMS_AND_PROOFS/T002-design-set-antichain.md) (`Inc(B)` antichain — the generating set on the Ludics side), [T004](../02_THEOREMS_AND_PROOFS/T004-jsl-fragment-bridge.md) (JSL-fragment categorical fact)
- **gated-by:** [Q-028a](../01_OPEN_QUESTIONS_REGISTRY.md#q-028a) (discovery: generator-level bijection canonicality on small instances) ∧ [Q-028b](../01_OPEN_QUESTIONS_REGISTRY.md#q-028b) (settlement: uniform freeness/adjointness argument); Q-028a positive licenses pursuing Q-028b but does not close b₁′ ∧ b₂′ on its own.
- **parent:** [C001](C001-ambler-bridge-iso.md)
- **sibling:** [C001a](C001a-jsl-fragment-bridge.md) (closed by T004 2026-05-29)
- **supersedes:** [C001b](C001b-ambler-remainder.md) (per-cone bridge target ruled wrong-level by [Q-027 audit](../audits/q027-thin-cones-2026-05-29.md))
- **linked-open-questions:** [Q-001](../01_OPEN_QUESTIONS_REGISTRY.md#q-001) (Ambler bridge), [Q-010](../01_OPEN_QUESTIONS_REGISTRY.md#q-010), [Q-027](../01_OPEN_QUESTIONS_REGISTRY.md#q-027) (resolved-with-redirect — this conjecture is the redirect), [Q-028a](../01_OPEN_QUESTIONS_REGISTRY.md#q-028a) (discovery content), [Q-028b](../01_OPEN_QUESTIONS_REGISTRY.md#q-028b) (settlement content)
- **last-reviewed:** 2026-05-29

> **Origin note (2026-05-29).** Filed as the redirect resolution of the
> Q-027 thin-cones diagnostic. The diagnostic (Ambler Example 1, Q3
> aspirin case) showed that the per-cone bridge target of the original
> [C001b](C001b-ambler-remainder.md) cannot work: cones in Reading A
> are too sparse, and the missing Ambler hom-element is precisely the
> cross-cone join that Phase 2e's Cross-Cone Incompatibility theorem
> forbids at the design level. The diagnostic also identified the
> correct target: `𝒫_fin(Inc(B))`, the free JSL on incarnations. Set
> union there is **not** a design-level union (Phase 2e ruled that out)
> but a set-of-designs operation one level up. The target match to
> Ambler's `𝒮/Γ = 𝒫_fin(𝒞/Γ)` is structural: both sides are free JSLs
> on a generating set of "atomic arguments" with set-union as join.

## Substrate context (unchanged from C001b)

- `C_semi` — the Ambler semilattice-enriched CCC. Hom-objects
  `C_semi(A, B) ∈ JSL` carry Ambler's `∨_A` and the
  Dempster–Shafer-style confidence weights. *In Ambler's primary
  worked example* `𝒮/Γ` (paper §2),
  `C_semi(A, B) = 𝒫_fin(𝒞/Γ(A, B))` — finite sets of base λ-terms
  under set union with bottom `∅`. This concrete shape is what makes
  the power-set target the natural bridge target.
- `C_plain` — Ludics-side plain CCC; per-cone JSL structure on `B` per
  T001 (but **not** the bridge target).
- `U : C_semi → C_plain` — confidence-erasure functor (Kelly 1982
  §1.2 underlying construction); on hom-objects sends an Ambler JSL
  `(𝒫_fin(X), ∪, ∅)` to its underlying set.
- `F ⊣ U` — free JSL enrichment.
- **Counit at the new target.**
  `ε_{A,B} : 𝓕(Inc(B_A)) → C_semi(A, B)`, where `𝓕(S)` is the free
  finite-join-semilattice with `⊥` on `S` (i.e. `𝒫_fin(S)` under `∪`,
  `∅`). For Ambler's worked example, this is a map between two
  free-JSL constructions on respective generating sets.

## Statement

Fix a behaviour `B`. Let `(A, B^♯)` be the Ambler argument types
corresponding to `B` under the bridge data (where `B^♯` indexes the
Ambler-side counterpart of the Ludics behaviour; for Ambler's `𝒮/Γ`,
this is the conclusion proposition).

C001b′ conjectures the existence of a canonical JSL isomorphism

$$\varepsilon_{A, B^\sharp} \;:\; \mathcal{F}(\mathsf{Inc}(B)) \;\xrightarrow{\;\sim\;}\; \mathcal{C}_{\mathrm{semi}}(A, B^\sharp)$$

decomposed into three sub-claims:

**(b₁′) Generator-level surjection.** There is a function

$$\phi \;:\; \mathsf{Inc}(B) \;\to\; \mathcal{C}_{\mathrm{base}}(A, B^\sharp)$$

whose image generates the Ambler hom-semilattice under `∨_A`. Here
`𝒞_base(A, B^♯)` denotes the underlying set of generators of
`C_semi(A, B^♯)` — for `𝒮/Γ`, the λ-terms in `𝒞/Γ(A, B^♯)`.

> *Equivalently:* every Ambler atomic argument arises from at least
> one Ludics incarnation. This is what would fail for the per-cone
> target (audit §5.4); at the power-set target it is the actual open
> question.

**(b₂′) Generator-level injection.** The function `φ` is injective:
distinct Ludics incarnations are sent to distinct Ambler generators.

> *Equivalently:* the Ludics side does **not** identify Ambler
> generators that the Ambler side keeps distinct. Together with
> (b₁′), this gives a bijection `Inc(B) ↔ 𝒞_base(A, B^♯)`, whose
> free-JSL extension is automatically a JSL iso `ε`.

**(b₃′) Erasure-square naturality.** The bijection from
(b₁′ ∧ b₂′) extends to a natural transformation in the Ambler
argument variable. The square

```
       𝓕(Inc(B))           ≅           C_semi(A, B^♯)
            │                                  │
   𝓕(Inc(B → B′)) │              C_semi(A, B^♯ → B′^♯) │
            ▼                                  ▼
       𝓕(Inc(B′))          ≅           C_semi(A, B′^♯)
```

commutes for every morphism `B → B′` of behaviours (and its
Ambler-side counterpart `B^♯ → B′^♯`).

**The combined C001b′ claim is `b₁′ ∧ b₂′ ∧ b₃′`.**

## Why b₁′ + b₂′ are not as trivial as they look

At first glance the Q3 worked example (audit §5.2) makes it look
costless: 2 Ludics incarnations, 2 Ambler λ-terms, bijection by
matching the rule-choice (`D_{t_1} ↦ t_1\,fst(x)`,
`D_{t_2} ↦ t_2\,⟨…⟩`). Any function between 2-element sets is a
bijection, so Q3 alone is not diagnostic for canonicality.

The substantive question is split (2026-05-29) between
[Q-028a](../01_OPEN_QUESTIONS_REGISTRY.md#q-028a) (discovery via
worked-example canonicality test) and
[Q-028b](../01_OPEN_QUESTIONS_REGISTRY.md#q-028b) (settlement via a
uniform $F \dashv U$ freeness/adjointness argument). Q-028a asks
whether the bijection is **canonical** — i.e., uniquely determined by
the bridge data — on representative small instances, and whether it
**scales**:

1. To cases with `|Inc(B)| ≥ 3`, where multiple plausible bijections
   exist and only canonicality picks one out.
2. To **higher-order types** in `C_semi`, where Ambler's `𝒞/Γ`
   includes proper λ-abstractions, and the Ludics-side counterpart
   involves exponential behaviours `B!A` or function-type loci. The
   substrate work to date has focused on propositional cases.
3. To **confidence-graded operators** (the `[0,1]`-weights of
   Ambler's rules) which `U` erases but `C_semi` retains. The
   bijection should commute with all `C_semi`-operators after `U`,
   which is the content of (b₃′).

## How Q-028a and Q-028b gate the statement

Q-028a (discovery) and Q-028b (settlement) play asymmetric roles. A
*discovery-positive* Q-028a (the bijection is forced on the tested
small instances) **does not close b₁′ ∧ b₂′ by itself** — it only
licenses pursuing Q-028b. A *positive* Q-028b (the bijection is forced
uniformly by the $F \dashv U$ adjunction restricted to canonical
generators) closes b₁′ ∧ b₂′ in one stroke, and b₃′ becomes the
substantive remaining content (naturality / diagram chase). A
*negative* Q-028a (cardinality mismatch or surviving non-canonicity at
low cardinality) refutes both Q-028b and C001b′ in its current form;
a further restatement (perhaps at yet another bridge level, or with
explicit choice data) would be needed. A *negative* Q-028b with
positive Q-028a leaves C001b′ with inductive-only support, which is
weaker than C001a's T004 closure and would call for either a
proof-theoretic uniformity argument or acceptance of a weaker
claim.

## Recommended attack order

1. **Q-028a stratum 1 ∥ Q-028b first paper attempt (parallel).**
   Run Q-028a's `|Inc(B)| ≥ 3` propositional canonicality test
   (construct or adapt a 3-derivation Ambler example, enumerate
   candidate bijections, check whether the bridge data forces a
   unique choice). In parallel, attempt Q-028b's freeness/adjointness
   meta-argument on paper, identifying first the critical
   intermediate question *"given $B$, is $A_\Gamma$ canonical?"*.
   The two inform each other: a Q-028a counterexample kills Q-028b
   immediately; a Q-028b obstruction tells Q-028a what to look for
   in concrete cases.
2. **Q-028a stratum 2 (higher-order types).** Pick a small instance
   with a λ-abstraction in the term (e.g.
   `(B → C) ⇒ (A → B) ⇒ (A → C)` — the composition combinator).
   If Q-028b landed in step 1, this becomes a cross-check on the
   uniform argument rather than primary evidence; if Q-028b is
   stalled, this is the next discovery probe.
3. **(If Q-028b positive, OR Q-028a strata 1+2 discovery-positive)**
   Diagram-chase b₃′. The naturality square reduces to: does
   `Inc(-)` commute with `C_semi-morphism` under the bijection? For
   Ambler's `𝑮/Γ`, the Ambler-side morphisms are pre/post-composition
   with base morphisms; the Ludics-side ought to be the corresponding
   action on incarnations.

## Positive settlement

Two human-checked proofs, cross-checked:

1. A proof of (b₁′) and (b₂′) constructing the canonical bijection
   `Inc(B) ↔ 𝒞_base(A, B^♯)` and arguing it is forced by the bridge
   data, with verification on at least: (i) a `|Inc(B)| ≥ 3`
   propositional case, (ii) one higher-order case, (iii) a
   confidence-graded operator case (where the bijection must commute
   with `U`-erasure of the operator).
2. A diagram-chase proof of (b₃′) building on (b₁′ ∧ b₂′).

Filed as a theorem `T00N-ambler-power-set-bridge.md` with
`closes: C001b′` and `partially-closes: Q-001`.

## Negative settlement

A counterexample exhibiting one of:

- **(b₁′ fails)** An Ambler base generator
  `f ∈ 𝒞_base(A, B^♯)` with no incarnation `D ∈ Inc(B)` mapping to
  it. Indicates either (i) the Ludics-side behaviour `B` is too small
  (missing arguments), or (ii) the encoding choice produces fewer
  incarnations than Ambler atomic arguments — diagnostic of a
  remaining encoding ambiguity.
- **(b₂′ fails)** Two distinct incarnations `D₁ ≠ D₂` that any
  natural bridge sends to the same Ambler generator. Indicates the
  Ludics side over-distinguishes — possibly the same argument up to
  irrelevant locus naming. Suggests quotienting `Inc(B)` is needed.
- **(b₃′ fails)** Bijection on objects but fails naturality —
  composition on one side does not match composition on the other.
  Likely localises to a specific Ambler operator; would force a
  further restriction of the bridge to a sub-CCC.

## Why this is still mostly human-checked

Same reasons as C001b: Ambler-side equations are diagrammatic, few in
number, individually non-trivial. The mechanisation/notation overhead
exceeds the value-add for the expected proof shapes.

## What this conjecture does *not* cover

- The JSL fragment ([T004](../02_THEOREMS_AND_PROOFS/T004-jsl-fragment-bridge.md)).
- Multi-agent extension (Reading C, [Q-002](../01_OPEN_QUESTIONS_REGISTRY.md#q-002)).
- Cross-room transport ([Q-006](../01_OPEN_QUESTIONS_REGISTRY.md#q-006)).
- The per-cone bridge target (ruled out by [Q-027 audit](../audits/q027-thin-cones-2026-05-29.md); recorded in superseded [C001b](C001b-ambler-remainder.md)).

## Bibliography

- [Q-027 audit](../audits/q027-thin-cones-2026-05-29.md) — origin of this restatement
- [C001b](C001b-ambler-remainder.md) — superseded predecessor (per-cone target)
- Ambler 1996, *A categorical approach to the semantics of argumentation*, MSCS 6(2):167–188 — §2 defines `𝒮/Γ = 𝒫_fin(𝒞/Γ)`, the concrete instance the bridge target matches
- Krause, Ambler, Elvang-Gøransson & Fox 1995 — confidence structure erased by `U`
- Kelly 1982 (TAC reprint 10, 2005) §1.2 — underlying-ordinary-category functor
- [LUDICS_OQ_JSL_PROOF.md](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OQ_JSL_PROOF.md) §5.4 — interpretation (b) of `(D₁ ∪ D₂)^⊥⊥` as "smallest behaviour containing both", which the power-set target operationalises
