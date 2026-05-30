# C001 — The Ambler bridge `Art(B) ≅ Hom_{A_Γ}(A, B)` is a faithful iso modulo the confidence-erasure functor

- **status:** open (split into sub-conjectures, 2026-05-28)
- **ring:** core
- **depends-on:** T001 (per-cone JSL structure on B), T002 (antichain)
- **decomposes-into:** [C001a — JSL-fragment bridge](C001a-jsl-fragment-bridge.md); [C001b — Ambler-specific remainder](C001b-ambler-remainder.md)
- **linked-open-questions:** Q-001, Q-010
- **last-reviewed:** 2026-05-28

> **Umbrella note (2026-05-28).** C001 is now treated as the conjunction
> `C001a ∧ C001b`. The decomposition was driven by the three findings
> (F1, F2, F3) in §Mechanisation strategy below, which isolated the
> JSL fragment of the bridge from its Ambler-specific extension. Attack
> order: C001a first (mechanisable; tracked in
> [`../mechanisation/agda/C001/C001a.agda`](../mechanisation/agda/C001/C001a.agda)),
> then C001b (primarily human-checked). The §Statement, §Positive
> settlement, and §Negative settlement clauses below remain authoritative
> for the **combined** conjecture; sub-conjecture-specific clauses live
> in their own files.

## Statement

There exist functors `F: Ludics_fg → A_Γ` and `G: A_Γ → Ludics_fg` between a
finitely-generated fragment of the Ludics category and an Ambler-style
semilattice-enriched cartesian-closed category of arguments (Ambler 1996),
together with natural isomorphisms `F ∘ G ≅ Id` and `G ∘ F ≅ Id_{ker(erase)}`
where `erase: A_Γ → A_Γ^{erased}` is the confidence-erasure functor. In
particular, for every behaviour `B`, the per-cone JSL `Art(Cᵢ) = (Cᵢ, ⊆, ∪)`
is isomorphic (as a JSL) to a sub-hom-set of `Hom_{A_Γ}(A, B)` for an
appropriately chosen `A` derived from the cone's incarnation `Dᵢ`.

## Positive settlement

Two written human-checked proofs, cross-checked separately:

1. A construction of `F` and `G` with the unit/counit triangles verified.
2. A worked example on a non-trivial behaviour (≥ 3 cones, ≥ 2 distinct
   ramifications per cone) where the iso is exhibited concretely.

Filed as `T003-ambler-bridge.md` under
[`../02_THEOREMS_AND_PROOFS/`](../02_THEOREMS_AND_PROOFS/) with `closes:
Q-001`.

## Negative settlement

A counterexample of the following shape: a behaviour `B` with cones `C₁, C₂`
and a JSL morphism `φ: Art(C₁) → Art(C₂)` that has no image under any
candidate `F` into `Hom_{A_Γ}` morphisms. The counterexample must be
finite, presentable, and rule out *all* candidate functors `F` (not merely
the naive one).

## Mechanisation strategy (Agda, exploratory)

Status: **exploratory**. A mechanisation does *not* count as a positive
settlement under the policy in
[`../02_THEOREMS_AND_PROOFS/README.md`](../02_THEOREMS_AND_PROOFS/README.md)
("human-checked vs machine-checked"); it produces *evidence for* C001,
not a substitute for the two written human-checked proofs the positive-
settlement clause requires. Its purpose is to (a) force the formalisation
choices below to be explicit, and (b) detect type-level incoherences in
the candidate functors `F`, `G` before they reach a human reviewer.

### Formalisation choices the mechanisation must pin

The hard part of C001 is not the proof but the choice of what `Art(B)`,
`A_Γ`, and `Hom_{A_Γ}(A, B)` *are* as formal objects. The mechanisation
commits to:

1. **`A_Γ` as a many-sorted algebraic signature with one role-sort `Arg`
   and two operations** — `pro : Arg → Arg` (positive move) and
   `con : Arg → Arg → Arg` (rebuttal). This is the *toy* signature; the
   real `A_Γ` from Ambler 1996 has more structure. The toy is justified
   only as a feasibility probe: if the iso fails to mechanise on the toy,
   the full case has no chance. (Q-001 `how-would-we-know`, negative
   clause, is unaffected — a failure here is not a counterexample.)
2. **Designs as finite chronicle-trees over the toy signature**, with
   inclusion `⊆` being set-inclusion on chronicle sequences (consistent
   with T001's literal-set-inclusion order inside a cone). No `⊥⊥`-closure
   is performed inside the cone, again per T001.
3. **`B` as a finitely-generated behaviour** represented by its
   antichain `Inc(B)` (T002), with cones materialised lazily as
   `Σ Dᵢ ∈ Inc(B), { D : Dᵢ ⊆ D }`.
4. **`Art(Cᵢ)` as the JSL `(Cᵢ, ⊆, ∪)` from T001**, encoded as a record
   bundling the carrier, the order, the binary join, and the bottom
   element `Dᵢ`.
5. **`Hom_{A_Γ}(A, B)` as signature-respecting maps** from a generator
   object `A` (derived from `Dᵢ`) into `B`, encoded as an Agda function
   type with a `Respects-Sig` proof obligation.
6. **The confidence-erasure functor `erase`** as a definitional
   projection that forgets a confidence annotation on each operation;
   the iso is asserted *modulo* `erase`, i.e. as `G ∘ F ≅ Id_{ker(erase)}`.

### Out of scope for the toy

- Multi-cone joins (T002 already rules these out at the substrate level;
  the toy respects the cone partition).
- Cut composition of designs (the iso is stated point-wise on
  behaviours, not on the composition structure; cut-composition
  preservation would be a downstream lemma).
- The full Ambler signature (`A_Γ` proper, with confidence-graded
  operators, additives, and the cartesian-closed structure).

### Artefact

The skeleton lives under
[`../mechanisation/agda/C001/`](../mechanisation/agda/C001/). It
type-checks but leaves the unit/counit triangles as holes (`?`); the
intended workflow is interactive (Agda's `C-c C-,` to inspect goals).
The README in that directory states the build instructions, the
`agda-stdlib` version pin, and the precise correspondence between the
toy objects and the substrate objects above.

### What the mechanisation cannot check

- That `A_Γ` (toy) is a faithful restriction of `A_Γ` (Ambler 1996). This
  is a human-review obligation.
- That `erase` (toy) matches the announcement-bus event types in
  [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_ANNOUNCEMENT_BUS_PROTOCOL.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ANNOUNCEMENT_BUS_PROTOCOL.md).
  Also a human-review obligation.
- The negative-settlement clause. A counterexample must rule out *all*
  candidate functors `F`, not merely the one encoded in Agda.

### Findings from the mechanisation attempt (2026-05-28)

The toy skeleton was sufficient to discharge the elementary obligations
(`⊆ᴰ`-reflexivity, `_∪ᴰ_` monotonicity, the per-cone JSL upper-bound
laws, and `F-on-objects` with `apply := cone-join p` plus monotonicity)
within an interactive session. Attempting to formulate the
unit/counit triangles surfaced **three findings** that constitute
substantive evidence about C001 even though no triangle has yet been
proved. These findings are recorded here as the mechanisation's first
useful output.

**F1 — Structure preservation is essential, not optional.**

For `HomSet Dᵢ` defined as the type of arbitrary monotone maps
`Cone Dᵢ → Cone Dᵢ`, the equation `F ∘ G ≡ id` *fails* on a constant
map: `G h = apply h (cone-bot Dᵢ) =: q₀`, then
`(F ∘ G)(h)(q) = cone-join q₀ q`, which differs from `h(q) ≡ q₀` for any
non-trivial `q`. The iso cannot be stated against arbitrary monotone
maps; it requires `HomSet` to be restricted to JSL-homomorphisms
(preserving `⊔` and the bottom). This is consistent with Ambler 1996's
setting (semilattice-enriched cartesian-closed category) but had been
left implicit in the C001 statement above. **Implication for C001:** the
statement should explicitly say "iso *qua* JSL-hom", not "iso *qua*
monotone map", and the Ambler bridge proof must invoke a free/forgetful
adjunction between the JSL category and `A_Γ`.

**F2 — Propositional equality on `Design` is too fine; the iso lives at
set-equality.**

With `_∪ᴰ_ := _++_` (list concatenation), the JSL laws hold only up to
*set-equality* `_≈ᴰ_ := λ D D' → D ⊆ᴰ D' × D' ⊆ᴰ D`, not up to Agda's
propositional `_≡_`. For instance `Dᵢ ++ Dᵢ ≢ Dᵢ` propositionally, but
`Dᵢ ++ Dᵢ ≈ᴰ Dᵢ`. Any triangle equation phrased with `≡` will fail for
this reason alone, independently of F1. The fix is either (a) define
`_∪ᴰ_` as a deduplicating union (requires `DecEq Move`), (b) quotient
`Cone Dᵢ` by `_≈ᴰ_` (requires HITs or an explicit setoid layer), or
(c) restate the iso as `≈`-iso rather than `≡`-iso (the standard setoid
approach in `agda-categories`). **Implication for C001:** the iso is at
best up to chronicle-set equality. This is consistent with T001's
"literal set-inclusion order" framing (equality of designs there is also
up to set membership), and confirms that the substrate's design-equality
is *not* definitional — it lives at the setoid level. The full C001
proof in any assistant must commit to one of (a)–(c) explicitly.

**F3 — The toy collapses `A := Dᵢ`, destroying the bridge's content.**

The original skeleton identified the "generator object" `A` with the
cone bottom `Dᵢ`, making `Hom_{A_Γ}(A, B)` an endomap type
`Cone Dᵢ → Cone Dᵢ`. The actual Ambler bridge in the JSL case is the
Yoneda-flavoured equivalence

> `Art(Cᵢ) ≅ Hom_{JSL}(𝟐, Art(Cᵢ))`

where `𝟐 = {⊥, *}` is the **free JSL on one generator**, and a JSL-hom
`h : 𝟐 → Art(Cᵢ)` is determined by `h(*) ∈ Cᵢ` (since `h(⊥) = ⊥` is
forced). The toy's collapse of `A` into the cone bottom — while initially
attractive for simplicity — removes precisely the free-generator
structure that makes the iso non-trivial. The iso content of C001 is
*the universal property of the free JSL on one generator*, not anything
specific to `A_Γ`. To exhibit this content the toy must reintroduce a
separate `Gen` object representing `𝟐`. **Implication for C001:** the
Ambler bridge in the JSL fragment is a corollary of a free/forgetful
adjunction between `Set` (or `Pointed Set`) and `JSL`. The "Ambler-
specific" content of C001 lives outside the JSL fragment — in whatever
structure `A_Γ` adds beyond JSL (confidence grading, additives,
cartesian-closed structure). The toy as currently scoped *cannot* probe
that content; it can only probe the JSL fragment.

**Joint implication.** F1, F2, F3 together suggest two routes for the
next iteration of the mechanisation:

- *Route A (degenerate but quick):* keep the current `Cone Dᵢ → Cone Dᵢ`
  shape, restrict to constant maps, prove a trivial iso. Demonstrates
  nothing of C001's content. **Not recommended** unless the goal is
  purely to exercise the assistant workflow.
- *Route B (faithful to the JSL fragment):* introduce a separate `Gen`
  object (the free 1-generated JSL), define
  `HomSet Dᵢ := Hom_{JSL}(Gen, Art Dᵢ)`, adopt a setoid layer for
  set-equality on designs, prove the iso as a free/forgetful adjunction
  unit. Proves the **JSL-fragment of C001** only — does not address the
  confidence-erasure square or the Ambler-specific structure. The
  remainder of C001 then becomes its own mechanisation question.

The recommendation, on the strength of these three findings, is
**Route B**. It produces a real result (the JSL-fragment iso) and
isolates the genuinely Ambler-specific content of C001 as a separate
downstream artefact. The F3 framing also clarifies what `T003-ambler-
bridge.md` will need to prove that the JSL-fragment alone does not:
the cartesian-closed and confidence-graded extensions of the bridge.

These three findings should be cross-referenced from
[Q-001](../01_OPEN_QUESTIONS_REGISTRY.md#q-001--is-the-ambler-bridge-artb--hom_a_a-b-a-faithful-isomorphism-or-only-a-structure-preserving-functor)
the next time that entry is touched (e.g. on the quarterly review): the
question's `affects-implementation` and `next-action` fields should be
sharpened to reflect that the JSL-fragment is now isolatable.

## Bibliography

- Ambler 1996, *A categorical approach to the semantics of argumentation*,
  MSCS 6(2):167–188.
- Krause, Ambler, Elvang-Gøransson & Fox 1995, *A logic of argumentation for
  reasoning under uncertainty*.
- [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md)
- [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_TRIADS_CLOSURE_AND_CONFIDENCE_ERASURE_FUNCTOR.md)
- [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LITERATURE_REVIEW_ROUND_1.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_1.md) §3 (C3)
- [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LITERATURE_REVIEW_ROUND_2.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_2.md) §2.2 (R-C3)
