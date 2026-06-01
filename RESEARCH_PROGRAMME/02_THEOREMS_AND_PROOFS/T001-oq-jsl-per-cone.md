# T001 — OQ-JSL per-cone

- **status:** established
- **closes:** the per-cone half of OQ-JSL (originally OQ-JSL as stated; reformulated after Phase 2e refuted the whole-of-Inc(B) version)
- **depends-on:** T002 (Inc(B) is an antichain; cone decomposition)
- **proved-by:** Phase 2f formal-proof session, 2026-05-21
- **cross-checked-by:** Round 2 literature review (substrate-internal cross-check against Fouqueré–Quatrini 2013)
- **cross-check-date:** 2026-05-18
- **last-reviewed:** 2026-05-29 (equality-convention audit; see §Audit below — and added corroborating Agda mechanisation, see §Corroborating mechanisation)
- **source-of-proof:** [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_OQ_JSL_PROOF.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OQ_JSL_PROOF.md) and [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LUDICS_ORDER_RELATION_DEFINITION.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ORDER_RELATION_DEFINITION.md)
- **corroborating-mechanisation:** [`../mechanisation/agda/T001/T001.agda`](../mechanisation/agda/T001/T001.agda) (Agda 2.7.0.1, agda-stdlib v2.0; `--safe --without-K`, no postulates/holes; evidence-only — see §Corroborating mechanisation)
- **build-instructions:** [`../mechanisation/agda/T001/README.md`](../mechanisation/agda/T001/README.md)

## Statement

Fix a behaviour `B` in the finitely-generated regime. For each incarnation
`Dᵢ ∈ Inc(B)`, the cone

> `Cᵢ := { D ∈ B : Dᵢ ⊆ D, and no Dⱼ ∈ Inc(B), Dⱼ ≠ Dᵢ, satisfies Dⱼ ⊆ D }`

is a join-semilattice `(Cᵢ, ⊆, ∪)` with bottom `Dᵢ`. The join is *literal*
chronicle-set union: for `D, D′ ∈ Cᵢ`, `D ∨ D′ = D ∪ D′ ∈ Cᵢ`. The
positive/daimon skeleton is invariant within a cone (Daimon Lock Lemma).

### Equality convention (added 2026-05-29)

Cone elements are *sets* of chronicles; equality on `Cᵢ` is literal
set-equality. The JSL axioms (idempotence `D ∪ D = D`, neutrality
`Dᵢ ∪ D = D`, commutativity, associativity) hold strictly under this
equality. When `Cᵢ` is implemented or mechanised using a *representative*
data structure (e.g. an ordered list, multiset, or chronicle-tree
serialisation), those axioms hold only up to the kernel `≈ᴰ` of the
representative→set map; the JSL then lives on the quotient `Cᵢ / ≈ᴰ`,
equivalently as a setoid-internal JSL. Downstream results (e.g. T004) may
therefore assume the strict-set view without loss of generality.

## Proof (pointer)

See [`.../LUDICS_OQ_JSL_PROOF.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OQ_JSL_PROOF.md)
§§5–6 for the refutation of the original whole-of-Inc(B) JSL claim and the
construction of the per-cone JSL; and
[`.../LUDICS_ORDER_RELATION_DEFINITION.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ORDER_RELATION_DEFINITION.md)
for Phase 2f Reading A: the order is literal set inclusion on `Design.loci[]`
and the join is set-union (no `⊥⊥`-closure required inside a cone, because
within a cone the skeleton is locked).

## Cross-check notes

The original C1 claim (Round 1) attributed JSL structure to the whole of
`Inc(B)` under `∨_⊥⊥`; this is refuted by the Cone Decomposition Proposition.
Round 2 confirmed (with caveat) that the *components* — inclusion poset,
incarnation as minimum — are in Fouqueré–Quatrini 2013, but the *per-cone*
JSL specialisation is substrate-original. The proof does not require any
property of `⊥⊥`-closure inside the cone; it follows from the Daimon Lock
Lemma plus closure of `B` under inclusion of sub-designs that retain useful
chronicles.

## Audit (2026-05-29) — representative vs. quotient equality

**Trigger.** T004's revision dated 2026-05-29 added an equality-convention
clause to this entry (§Equality convention above) stating that the JSL
axioms hold strictly in the set-theoretic view and only up to `≈ᴰ` on
representative-level data structures. T004's cross-check note 2 (and Open
follow-up) asked for an audit confirming that this is a *clarification* and
not a covert extension of T001's existing proof.

**Method.** Read [`LUDICS_OQ_JSL_PROOF.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_OQ_JSL_PROOF.md)
and [`LUDICS_ORDER_RELATION_DEFINITION.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ORDER_RELATION_DEFINITION.md)
end-to-end, flagging each equality step that could distinguish
*propositional equality of representatives* from *set-equality of underlying
chronicle sets*.

**Finding.** *No covert use of representative equality.* The proof operates
on designs-as-sets-of-chronicles throughout, in the sense of
Fouqueré–Quatrini 2013 Definition 2.9 ("a design is a set of chronicles
satisfying [Forest / Coherence / Positivity / Totality]"). Specifically:

1. **Daimon Lock Lemma** (LUDICS_ORDER_RELATION_DEFINITION.md §4) is a
   chronicle-level argument from F-Q Definition 2.7 (Coherence /
   Comparability). It quantifies over chronicles `w\mathfrak{z} ∈ D'` and
   `wκ⁺... ∈ D` and derives incoherence from the comparability axiom.
   It does not compare design *representatives*.
2. **Antichain of `Inc(B)`** (LUDICS_OQ_JSL_PROOF.md §5.1) uses only
   set-inclusion and minimality in `B`. Equality of two designs `Dᵢ = Dⱼ`
   is concluded from mutual set-inclusion plus minimality — the standard
   antisymmetry of `⊆` on sets.
3. **Cross-cone incompatibility** (LUDICS_OQ_JSL_PROOF.md §5.2) and the
   **Cone Decomposition** are derived from uniqueness of incarnation
   (F-Q's theorem), again at the level of sets-in-`B`.
4. **Within-cone closure of `∪`** (LUDICS_ORDER_RELATION_DEFINITION.md
   §6) verifies the design axioms (Forest, Coherence, Positivity) for
   `D₁ ∪ D₂` *as a chronicle set*: prefix closure is preserved under
   set-union; coherence is preserved because the positive/daimon skeleton
   is shared (Daimon Lock); positivity is preserved because the union
   only adds negative branches. The argument never relies on a
   representative shape for `∪`.
5. **JSL axioms within `Cᵢ`** (idempotence `D ∪ D = D`, `Dᵢ`-absorption
   `Dᵢ ∪ D = D` for `D ∈ Cᵢ`, commutativity, associativity) are
   *set-theoretic identities on chronicle sets* and require no further
   work beyond noting that they are inherited from set-union once
   well-formedness (point 4) is established.

**Conclusion.** The 2026-05-29 equality convention adds no obligations
that were not already discharged. T001's status remains `established`.
The load-bearing premise for T004 (and ultimately for C001a) holds.

**Scope of the audit.** This audit covers the *mathematical* content of
T001 only. It does **not** discharge the separate implementation-level
obligation that any concrete design representation in the substrate code
(lists of chronicles, tries, serialised trees, etc.) be either
quotiented by `≈ᴰ` or canonicalised. That obligation is repeated in
[T004 §What this rules out](T004-jsl-fragment-bridge.md#what-this-rules-out-for-the-implementation)
and should be tracked at the implementation review layer, not here.

**Adjacent flag (not in audit scope).** Phase 2f's
[LUDICS_ORDER_RELATION_DEFINITION.md §7.2](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LUDICS_ORDER_RELATION_DEFINITION.md)
flagged an open concern: under Reading (A), cones grow only by adding
negative branches, which may leave cones too thin to populate the
Ambler hom-set (a C001b concern, not a T001 concern). This is
load-bearing for C001b but inert for T004; mentioned here so it is not
lost in the audit handoff.

## What this rules out (for the implementation)

- Any code path that *joins designs across cones by set-union*. Set-union of
  two designs from different cones produces a set with two distinct
  incarnations, which is not a valid Design in the substrate.
- Any storage representation that flattens cones (e.g. a single "behaviour
  view" listing all designs without cone partitioning).
- Any sprint that depends on a single greatest element of `Inc(B)`. There
  isn't one in general; the antichain (T002) prevents this.

## Corroborating mechanisation

[`../mechanisation/agda/T001/T001.agda`](../mechanisation/agda/T001/T001.agda)
type-checks (Agda 2.7.0.1, agda-stdlib v2.0, `--safe --without-K`) with
no postulates and no holes. It mechanises the **Reading A** proof,
following the split the human proof already makes between the
order-theoretic core and the Daimon Lock Lemma:

- **The JSL axioms are unconditional.** `Order.JoinFromLUB` proves that
  *any* least-upper-bound operation on a setoid partial order is
  idempotent (`⊔-idem`), commutative (`⊔-comm`), associative (`⊔-assoc`)
  and `≈`-congruent (`⊔-cong`), discharging from antisymmetry alone —
  exactly the source's "order-theoretic consequences of the
  least-upper-bound property" (§6). No behaviour, no cone, no Ludics.

- **The per-cone JSL is conditional on the Daimon Lock Lemma.** Its three
  within-cone consequences — `Dᵢ` is the bottom (`cone-bottom`, the map
  T002 exports), the cone contains `Dᵢ` (`Dᵢ∈`), and set-union is closed
  in the cone (`⊔-closed`) — are supplied as explicit `Cone` module
  **hypotheses**, *not* Agda `postulate`s, so the artefact stays `--safe`
  while keeping the dependency visible in the types. From them the file
  derives the full JSL plus bottom neutrality `Dᵢ ∪ D ≈ D` (`⊔-bot`) and
  `Dᵢ` as least element (`⊥-least`).

- **The F2 equality convention is modelled faithfully.** Every derived
  axiom is an `≈`-equality (`⊑-antisym` lands in `≈`); on the C001a list
  model `≈` is set-equality `≈ᴰ`, so idempotence is `D ++ D ≈ D` even
  though `D ++ D ≢ D` propositionally — the setoid-internal reading this
  entry's §Equality convention and §Audit call for.

- **Non-vacuity.** `ListModel` instantiates the abstract order on the
  C001a list-design model (set-inclusion / set-equality `≈ᴰ`); set-union
  is `_++_`, whose LUB clauses are the C001a union lemmas, and the
  principal up-set `↑Dᵢ` is exhibited as a concrete inhabited cone
  (`PrincipalCone`).

Under the Register policy this is **evidence-only**, not a positive
settlement: the fidelity of the `Cone` hypotheses to the Daimon Lock
Lemma (in particular within-cone closure of `∪`) and of the `List A`
model to chronicle-tree designs are human-review obligations, recorded in
[`../mechanisation/agda/T001/README.md`](../mechanisation/agda/T001/README.md)
§"What this cannot check". T001's `status` remains `established` on the
strength of the human proof and the §Audit above; the mechanisation
corroborates the order-theoretic core and isolates exactly which claims
ride on the Daimon Lock Lemma.
