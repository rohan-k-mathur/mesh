# E2 — cardinality of `Inc(B)` on a `|Inc(B)| ≥ 3` defeasible behaviour

- **status:** complete (executed 2026-05-31)
- **settles:** brainstorm side-data concern **A5** (does defeat multiply
  incarnations / does δ₂ inflate `|Inc(B)|`?); feeds
  [Q-028a](../01_OPEN_QUESTIONS_REGISTRY.md#q-028a) stratum-1 (canonicality/
  scaling of `φ` at `|Inc(B)| ≥ 3` — the full all-6-bijections sweep, §4.5); discharges the **primary remaining risk**
  of [Q-037](../01_OPEN_QUESTIONS_REGISTRY.md#q-037) flagged by the R3 session
  (does any behaviour force genuine *multi-generator `defeat²` inside `Inc(B)`*,
  exceeding the `μ` single-generator scope of [R3 doc §5.5.4](r3-delta-iso-session-2026-05-30.md)?)
- **brief:** [δ brainstorm §7](delta-defeat-encoding-decision-brainstorm-2026-05-30.md)
  action 5 + §4 row A5; the `|Inc(B)| ≥ 3` check
- **inputs:** [Q-027 audit](q027-thin-cones-2026-05-29.md) §1–§2 (the Ambler
  Example 1 fact-base and λ-term enumeration machinery, reused), [E1 audit](e1-reinstatement-aspirin-2026-05-30.md)
  (the δ₁/δ₂ aspirin encodings and the accumulating-δ₂ requirement), [R3 doc
  §5.5](r3-delta-iso-session-2026-05-30.md) (the merge operator `μ` and its
  single-generator scope, the property under test here)
- **method:** extend Ambler Example 1 by the **minimal** rule that produces a
  third incarnation of `aspirin` (a second, independent undercutter of
  `gastric_ulcer`); enumerate `𝒞/Γ⁺`, `Inc_δ₁(B)`, `Inc_δ₂(B)`; count under
  both encodings; then test the multi-reinstater configuration this creates
  against the `μ` single-generator scope
- **headline verdict:** **POSITIVE on all three sub-questions.** (1) `|Inc_δ₁(B)|
  = |Inc_δ₂(B)| = |𝒞/Γ⁺(A, aspirin)| = 3` — defeat does **not** multiply
  incarnations and δ₂ does **not** inflate the count (A5 → δ₁, and the δ₂ side
  matches via the ν-bijection). (2) The two-reinstater configuration does **not**
  produce a multi-generator `defeat²` inside `Inc(B)`: reinstatement is **always
  relative to a named defeater** (Ambler p. 171), so it decomposes into two
  **per-defeater single-generator** `defeat²` operations, each in `μ`'s scope;
  the *set* of two stronger arguments is their **JSL join `∨_A` one level up** in
  `𝓕(Inc(B))`, i.e. **aggregation, not `defeat²`** — exactly the R3 §5.5.4
  routing. (3) δ₂'s challenger threads create **no** incarnation absent on the
  δ₁ side. (4) **Q-028a stratum-1 discovery-positive**
  (§4.5): all 6 bijections `Inc(B) → 𝒞/Γ⁺` swept — the diagonal `φ` is the
  **unique survivor** (daimon-lock/head-action prunes 4, composition
  compatibility at the `¬gu` premise locus prunes the route-swap `τ`), so the
  bijection is not merely well-defined but **uniquely forced**; both the
  negative-cardinality and non-canonicality branches are ruled out at this
  instance. Net: Q-037's R3 risk is **discharged**; the single-generator scope of
  `μ` is **confirmed structural**, so Q-037 closes **positive** (modulo only the
  orthogonal termination precondition [Q-031](../01_OPEN_QUESTIONS_REGISTRY.md#q-031)).

---

## 1. The extended fact-base Γ⁺ (minimal `|Inc(B)| ≥ 3` instance)

Ambler Example 1 (Q-027 §1) gives two incarnations of `aspirin` at Q3
(`D_{t₁}`, `D_{t₂}`; Q-027 §5.2). To reach **three** with the smallest
extension, add exactly one rule: a **second, independent undercutter** of
`gastric_ulcer`.

| Label | Type | note |
|---|---|---|
| t₁ | `muscle_pain → aspirin` | Example 1 |
| t₂ | `(muscle_pain ∧ ¬gastric_ulcer) → aspirin` | Example 1 |
| c₁ | `gastric_ulcer → ¬aspirin` | Example 1 (the rebuttal) |
| i₁ | `stomach_pain → gastric_ulcer` | Example 1 (supports the rebuttal) |
| i₂ | `(short_term ∧ anxiety) → ¬gastric_ulcer` | Example 1 (undercutter A) |
| **i₃** | **`misoprostol → ¬gastric_ulcer`** | **NEW** — gastroprotection; undercutter B |

`i₃` is independent of `i₂`: their premise sets (`short_term ∧ anxiety` vs
`misoprostol`) are disjoint, so neither undercutter subsumes the other. One
extra rule is the minimum that yields a third `aspirin` incarnation — `t₁` gives
one, and `t₂` needs `¬gastric_ulcer`, which now has **two** independent
producers — so Γ⁺ is the smallest `|Inc(B)| ≥ 3` defeasible behaviour over this
family.

**Query Q4** (extend Q3's antecedent by the new premise):

$$Q_4.A \;=\; muscle\_pain \wedge stomach\_pain \wedge short\_term \wedge anxiety \wedge misoprostol \;\Rightarrow\; aspirin.$$

---

## 2. Ambler-side enumeration `𝒞/Γ⁺(Q4.A, aspirin)` (count = 3)

Reusing the Q-027 §2 β-normal η-long enumeration discipline. To produce
`aspirin` in context `(x : Q4.A, Γ⁺)`:

1. **Via `t₁`** (needs `muscle_pain`): `t₁ fst(x) : aspirin`. ✓
2. **Via `t₂` + `i₂`** (needs `muscle_pain ∧ ¬gastric_ulcer`, `¬gu` from
   `short_term ∧ anxiety`): `t₂ ⟨fst(x), i₂⟨st, an⟩⟩ : aspirin`. ✓
3. **Via `t₂` + `i₃`** (same `t₂`, `¬gu` now from `misoprostol`):
   `t₂ ⟨fst(x), i₃(miso)⟩ : aspirin`. ✓

Terms 2 and 3 are **distinct β-normal terms** (different `¬gu` sub-derivation:
`i₂⟨…⟩` vs `i₃(…)`), hence distinct generators.

$$\mathcal{C}/\Gamma^{+}(Q_4.A,\ aspirin) \;=\; \{\, t_1\, fst(x),\ \ t_2\langle fst(x), i_2\langle st,an\rangle\rangle,\ \ t_2\langle fst(x), i_3(miso)\rangle \,\}, \qquad |\cdot| = 3.$$

---

## 3. Ludics-side enumeration under δ₁ and δ₂ (both count = 3)

### 3.1 `Inc_δ₁(B)` — count = 3, matches Ambler

Following Q-027 §5.2 and E1 §1–§3, each generator is realised by one material
design; the undercut evidence is threaded in as a positive negative-branch
extension (E1 §3.1):

- `D_{t₁}` — select `t₁`; positive `aspirin` skeleton (Q-027 §5.2).
- `D_{t₂/i₂}` — select `t₂`; `¬gu` premise supplied by `i₂⟨st,an⟩` (the E1
  `χ_und`, here call it `χ_{i₂}`).
- `D_{t₂/i₃}` — select `t₂`; `¬gu` premise supplied by `i₃(miso)` (chronicle
  `χ_{i₃}`).

`D_{t₂/i₂}` and `D_{t₂/i₃}` differ only in the `¬gu` sub-chronicle and are
⊆-**incomparable** (disjoint premise loci `ξ_{st∧an}` vs `ξ_{miso}`), so both
are material and minimal:

$$\mathsf{Inc}_{δ_1}(B_{Q4}) = \{\, D_{t₁},\ D_{t₂/i₂},\ D_{t₂/i₃} \,\}, \qquad |\mathsf{Inc}_{δ_1}(B_{Q4})| = 3.$$

A **3-element antichain**, in bijection with `𝒞/Γ⁺` via `φ` (§2). **A5 confirmed
for δ₁:** defeat (the `c₁∘i₁` rebuttal + its two undercutters) does **not**
multiply incarnations beyond the Ambler generator count — each blocked/threaded
chronicle is one design, and the count is exactly the number of independent
support routes, which is what Ambler counts too.

### 3.2 `Inc_δ₂(B)` — count = 3, via the ν-bijection (no inflation)

Under accumulating / canonical-cut δ₂ (R3 §3), each incarnation is the cut-free
normal form `ν(D)` of a canonical-cut design. By L-MERGE (R3 §5.5) `ν` is a
bijection per defeater, so the three canonical-cut designs (one for `t₁`, one
for the `i₂`-reinstatement, one for the `i₃`-reinstatement) map bijectively onto
the three δ₁ designs:

$$|\mathsf{Inc}_{δ_2}(B_{Q4})| = |\mathsf{Inc}_{δ_1}(B_{Q4})| = 3.$$

**The negative-cardinality branch does not fire.** The A5 worry (brainstorm §4)
was that δ₂'s *live challenger threads* might count as **extra** incarnations,
giving `|Inc_δ₂(B)| = 5 > |𝒞/Γ⁺| = 3` and triggering Q-028a's
negative-cardinality elimination. This is killed by **canonical-cut +
materiality**:

- a challenger thread is an incarnation only if it is **material** (visited by a
  counter-design of `B^⊥`);
- a **dead** challenger (the `c₁∘i₁` rebuttal, once undercut by `i₂` or `i₃`)
  does not survive as its own design — its chronicle **accumulates** into the
  surviving `D_{t₂/i_k}` (R3 §5.5 `μ`), so it is *part of* an existing
  incarnation, not a new one;
- a challenger that **survives** (the rebuttal `c₁∘i₁` when *not* undercut)
  concludes `¬aspirin` — it lives in a **different behaviour** (the `¬aspirin`
  conclusion), not in `Inc(B_{aspirin})`.

So no δ₂ thread contributes an incarnation absent on the δ₁ side. **A5 lands on
δ₁, and the δ₂ presentation matches it exactly.**

---

## 4. The multi-reinstater test (the R3-critical question)

Γ⁺ was built precisely to create the configuration the R3 §5.5.4 scoping clause
flagged: the rebuttal `c₁∘i₁` is reinstated-against by **two incomparable
undercutters** `i₂`, `i₃`. Does this force a **multi-generator `defeat²` inside
`Inc(B)`** — a single defeat² operation whose value is irreducibly the *set*
`{D_{t₂/i₂}, D_{t₂/i₃}}` — which would **exceed `μ`'s single-generator scope**
and break the R3 O1-inj proof?

**No.** Reinstatement in Ambler is **meta-level and always names a specific
defeating argument** (E1 §0, Ambler p. 171: *"a stronger argument in favour of
aspirin"* — a particular term, supplied by a particular undercutter). There is
**no primitive "reinstate against all defeaters at once."** Hence the two
undercutters define **two distinct reinstatement events**:

$$\mathsf{defeat}^2_{i_2}(D_{t₁}) = D_{t₂/i₂}, \qquad \mathsf{defeat}^2_{i_3}(D_{t₁}) = D_{t₂/i₃},$$

each a **single-generator** map landing one incarnation, each squarely within
`μ`'s scope (R3 §5.5.1: `μ` grafts the *one* reinstating chronicle `χ_{i_k}` at
the unique negative leaf `ℓ` opened by undercutting `gastric_ulcer`). The
**set** of two stronger arguments is their **join**:

$$\{D_{t₂/i₂}, D_{t₂/i₃}\} \;=\; D_{t₂/i₂} \vee_A D_{t₂/i₃} \quad\text{in } \mathcal{F}(\mathsf{Inc}(B)) = \mathcal{P}_{\mathrm{fin}}(\mathsf{Inc}(B)),$$

i.e. the free-JSL **aggregation one level up**, **not** a `defeat²` value. This
is exactly the R3 §5.5.4 routing (multi-reinstater accrual → `∨_A`), now
**instantiated and confirmed** rather than assumed.

**Why the decomposition is structural, not contingent.** The only way to
"combine" two reinstaters is the monotone aggregation `∨_A` (Ambler p. 171:
*"aggregation is necessarily monotone"*; E1 §0). Aggregation lives in `𝒮/Γ =
𝒫_fin(𝒞/Γ)` — one level above the generators. A design-internal `defeat²`, by
the R3 §5.5.2(A) level argument, must stay a **single generator** in `Inc(B)`.
So multi-generator combination **cannot** be a `defeat²`; it is forced up one
level. The single-generator scope of `μ` is therefore **not a restriction we
hope holds** — it is **structurally guaranteed** by the generator/power-set
level separation that C001b′ already relies on.

---

## 4.5 The full canonicality sweep — all 6 bijections (Q-028a stratum-1)

E2 above settled cardinality (`|Inc(B)| = |𝒞/Γ⁺| = 3`, so the
**negative-cardinality** branch is ruled out) and showed the natural support-route
bijection `φ` is well-defined. The remaining stratum-1 obligation is the
**non-canonicality** branch: enumerate *all* bijections `Inc(B) → 𝒞/Γ⁺` and
check whether the bridge data forces `φ` **uniquely** or whether a rival
survives every test. With `|·| = 3` there are `3! = 6` bijections. Label the
sides:

$$\mathsf{Inc}(B) = \{D_{t₁},\, D_{t₂/i₂},\, D_{t₂/i₃}\}, \qquad \mathcal{C}/\Gamma^{+} = \{a_1,\, a_2,\, a_3\}$$

with `a₁ = t₁ fst(x)`, `a₂ = t₂⟨fst(x), i₂⟨st,an⟩⟩`, `a₃ = t₂⟨fst(x), i₃(miso)⟩`,
and `φ` the diagonal `D_{t₁}↦a₁, D_{t₂/i₂}↦a₂, D_{t₂/i₃}↦a₃`.

**Test 1 — daimon-lock / head-action (Q-027 §5 thin cones).** Each material
design's **first positive action** is the top rule it selects, and the Daimon
Lock pins that head action in the thin cone (Q-027 §5.2). This partitions both
sides by head rule:

| head rule | `Inc(B)` class | `𝒞/Γ⁺` class |
|---|---|---|
| `t₁` | `{D_{t₁}}` | `{a₁}` |
| `t₂` | `{D_{t₂/i₂}, D_{t₂/i₃}}` | `{a₂, a₃}` |

Any bridge that respects the head action (daimon-lock compatibility) must
preserve this partition — so it **must** send `D_{t₁} ↦ a₁` (both are the unique
head-`t₁` element) and map the head-`t₂` block to itself. The `4` bijections that
move `D_{t₁}` onto `a₂` or `a₃` **all fail Test 1**. Two survive: `φ` and the
`t₂`-route swap `τ` (`D_{t₂/i₂}↦a₃, D_{t₂/i₃}↦a₂`).

**Test 2 — composition compatibility at the `¬gu` premise locus.** `φ` and `τ`
agree on `D_{t₁}` and differ only on the two `t₂`-routes; the discriminator is
the **`¬gu` sub-chronicle**. `D_{t₂/i₂}` threads `χ_{i₂}` at locus `ξ_{st∧an}`
(premises `short_term ∧ anxiety`); `D_{t₂/i₃}` threads `χ_{i₃}` at locus
`ξ_{miso}` (premise `misoprostol`); these loci are **disjoint** (§3.1). The
counter-design of `B^⊥` that probes `ξ_{miso}` — i.e. tests *whether the
`misoprostol` route is taken* — converges with **exactly** `D_{t₂/i₃}` on the
Ludics side, and on the Ambler side the term whose `¬gu` sub-derivation uses
`misoprostol` is **exactly** `a₃ = t₂⟨fst(x), i₃(miso)⟩`. Composition
compatibility (the bridge commutes with cutting against this probe) therefore
**forces** `D_{t₂/i₃} ↦ a₃`, hence `D_{t₂/i₂} ↦ a₂` = `φ`. The swap `τ` sends
`D_{t₂/i₃} ↦ a₂` (whose `¬gu` derivation uses `short_term ∧ anxiety`, *not*
`misoprostol`), so it **fails to commute** with the `ξ_{miso}` probe. `τ` is
eliminated.

**Test 3 — `U`-erasure compatibility.** `U : JSL → Set` forgets the join; both
`φ` and `τ` (and indeed all 6) are bijections on the underlying generator sets,
so `U`-erasure is **non-discriminating** here — it adds no constraint beyond
cardinality, and `φ` passes it trivially (it *is* a set bijection between the
`U`-images). This is the expected behaviour: `U`-erasure rules out
cardinality-mismatched maps (already none, §2–§3), not route-permutations; the
route-permutation `τ` is killed by composition (Test 2), which is the level at
which the support-route structure lives.

**Sweep result.**

| bijection | survives Test 1 (daimon-lock) | survives Test 2 (composition) | survives Test 3 (`U`-erasure) |
|---|---|---|---|
| `φ` (diagonal) | ✓ | ✓ | ✓ |
| `τ` (`t₂`-route swap) | ✓ | ✗ | ✓ |
| 4 others (move `D_{t₁}`) | ✗ | — | — |

**`φ` is the unique survivor.** The bridge data forces it: head-action
(daimon-lock) prunes 4, composition compatibility at the premise locus prunes
the last rival `τ`. So Q-028a stratum-1 is **discovery-positive** — at
`|Inc(B)| = 3` the bridge bijection is not merely *well-defined* but *uniquely
determined*; the **non-canonicality** branch is ruled out alongside the
**negative-cardinality** branch. This licenses pursuing Q-028b (it does not, by
itself, close C001b′ b₁′∧b₂′ — that is the uniform Q-028b argument's job).

---

## 5. Verdicts

| sub-question | result | route |
|---|---|---|
| **A5** — does defeat multiply incarnations? | **No** (δ₁) | §3.1: card `Inc_δ₁` = 3 = card `𝒞/Γ⁺`, a clean antichain bijection |
| **A5 (δ₂ inflation)** — does δ₂ raise the count? | **No** | §3.2: canonical-cut + materiality ⟹ card `Inc_δ₂` = 3; negative-cardinality branch does not fire |
| **R3 risk** — multi-generator `defeat²` inside `Inc(B)`? | **No** | §4: per-defeater single-generator `defeat²` + JSL join `∨_A` one level up; `μ` scope is structural |
| **Q-028a stratum-1** — is `φ` *uniquely forced* at card `Inc(B)` = 3? | **Yes** | §4.5: all 6 bijections swept — daimon-lock prunes 4, composition prunes the `t₂`-route swap `τ`; `φ` is the unique survivor (non-canonicality branch ruled out) |

**Net for Q-037.** The R3 session reduced Q-037 to (a) L-MERGE merge-canonicality
and (b) this E2 multi-generator check. L-MERGE was proved (R3 §5.5); E2 now
**discharges (b) positively** and shows `μ`'s single-generator scope is
*structural* (level separation), not a contingent restriction. The only
remaining dependency is the **orthogonal** termination precondition
[Q-031](../01_OPEN_QUESTIONS_REGISTRY.md#q-031). **Q-037 closes positive on the
full defeasible fragment** (single- and multi-route reinstatement both handled:
single-route by `μ`, multi-route by `μ`-per-defeater + `∨_A`), conditional only
on Q-031.

**Net for the bridge.** δ₂ does not break the Ambler-side cardinality match, so
the runtime's coroutine scheduler keeps a proven correspondence to the δ₁ bridge
semantics; C001b′ b₃′'s erasure square is unaffected by the encoding choice; and
Q-028a stratum-1 gets a positive `|Inc(B)| = 3` data point with a canonical `φ`.

---

## 6. What would have falsified E2 (recorded for honesty)

- **Cardinality inflation:** had δ₂'s live challenger threads been material in
  `B_{aspirin}`, `|Inc_δ₂| = 5 > 3` would trigger Q-028a's negative-cardinality
  elimination of δ₂. Did not occur (§3.2) — dead challengers accumulate,
  survivors land in a different behaviour.
- **Irreducible multi-generator `defeat²`:** had Ambler defeat admitted a
  primitive "reinstate against all," `defeat²(D_{t₁})` would be a genuine *set*,
  outside `μ`'s scope, reopening R3 O1-inj. Did not occur (§4) — reinstatement
  is per-named-defeater; combination is `∨_A` one level up.
- **Non-canonical `φ` at 3 generators:** had the two `t₂`-routes collapsed to
  one incarnation on the Ludics side (or split into more), `φ` would fail to be
  the canonical support-route bijection. Did not occur (§3.1) — disjoint `¬gu`
  premise loci keep `D_{t₂/i₂}`, `D_{t₂/i₃}` distinct and incomparable.

---

## 7. References

- [Q-037 registry entry](../01_OPEN_QUESTIONS_REGISTRY.md#q-037) — the R3 risk
  this experiment discharges.
- [R3 working doc](r3-delta-iso-session-2026-05-30.md) §5.5 (the `μ` operator and
  L-MERGE), §5.5.4 (the single-generator scoping clause E2 tests), §8 deliverable 3.
- [δ brainstorm](delta-defeat-encoding-decision-brainstorm-2026-05-30.md) §4 row
  A5, §7 action 5 (the E2 brief).
- [E1 audit](e1-reinstatement-aspirin-2026-05-30.md) §0 (Ambler p. 171:
  meta-level defeat, monotone aggregation), §3.1 (the δ₁ undercut-threading).
- [Q-027 audit](q027-thin-cones-2026-05-29.md) §1 (Example 1 fact-base), §2
  (λ-term enumeration discipline), §5.2 (the `Inc(B_{Q3})` antichain extended here).
- [Q-028a registry entry](../01_OPEN_QUESTIONS_REGISTRY.md#q-028a) — stratum-1
  (`|Inc(B)| ≥ 3` canonicality), fed by §2–§3.
- [Q-031](../01_OPEN_QUESTIONS_REGISTRY.md#q-031) — the sole remaining (orthogonal)
  precondition for the positive Q-037 close.
- Ambler 1996 §2–§3 (the worked example and the defeat/aggregation discussion,
  p. 171); Girard 2001 *Locus Solum* (materiality / incarnation).
