# Coalgebra Test — Executed Run

*Running the checks scoped in `coalgebra-test-shape.md`. This file is the executed
record; Checks B and C append below as they are run.*

---

## Check A — Does a stream coalgebra force irreversible *state dynamics*?

**Question.** The candidate arrow-generator is stream unfolding. Check A isolates the
*dynamics* factor — the map `tail : X → X` iterated — and asks whether the coalgebra
structure *forces* it to be irreversible, where "irreversible" means **progressive**: some
state `x` has an infinite, non-recurring forward orbit `{tailⁿ(x) : n ∈ ℕ}` (all `tailⁿ(x)`
distinct). Progressivity is the dynamical form of the arrow — a sequence that never returns
and so could carry an order with a first.

### A.1 The counterexample (the one-liner, made exact)

Alphabet `A = {a, b}`, carrier `X = {0, 1}`, `head(0) = a`, `head(1) = b`,
`tail = swap` (`0 ↦ 1 ↦ 0`).

This is a legal `F(X) = A × X` coalgebra. Unfolding from `0` gives the stream `a b a b …`.
The orbit of `0` is `{0, 1}` with period 2 — it **returns**. `tail` is a bijection (an
involution: `tail = tail⁻¹`), so the dynamics are reversible. Not progressive.

And the most degenerate coalgebra is worse for the PASS side: `X = {∗}`, `tail = id`,
`head(∗) = a` gives `a a a …` with `tail` a **fixed point** — maximal recurrence. So
progressivity is not merely not-forced; the simplest coalgebras have none.

### A.2 The exact result (a small iff, not just a counterexample)

The counterexample generalizes to a clean equivalence that pins the smuggle precisely.

> **Proposition (Check A).** A stream coalgebra `(X, ⟨head, tail⟩)` has a progressive state
> **iff** `X` contains a subset `N` with a point `x₀`, closed under `tail` (`tail(N) ⊆ N`),
> such that `(N, tail↾N) ≅ (ℕ, succ)`.
>
> *Proof.* (⟸) If `(N, tail) ≅ (ℕ, succ)`, the orbit of `x₀` is `x₀, tail x₀, tail² x₀, …`,
> all distinct — progressive. (⟹) If `x` is progressive, the `tailⁿ(x)` are pairwise
> distinct, and `n ↦ tailⁿ(x)` is an order-isomorphism from `(ℕ, succ)` onto the orbit, with
> `tail` acting as successor. ∎

So irreversible dynamics **just are** an embedded `(ℕ, succ)`. The coalgebra structure does
not *make* the arrow; it can only *carry* one, and exactly when its carrier already contains
`ℕ`-with-successor. When a stream coalgebra is irreversible (e.g. `X = ℕ`, `tail = succ`),
the arrow was imported with the carrier — `ℕ` in the bald form.

### A.3 Stress test — three ways the PASS side could resist, each run

**(1) "The cyclic dynamics still emit the stream `abab…`, which sits in `A^ω`, and `A^ω` is
ℕ-indexed and irreversible — so there is an arrow."** Conceded, and irrelevant to A: that
irreversibility is in the *positions* of the stream (the carrier's `ℕ`), not in the
*dynamics*. This is the handoff to Check B, working as designed. Check A's only job is to show
the arrow is **not in the dynamics-factor**, forcing the question onto the carrier; this
objection confirms the division of labour.

**(2) "`head = id` is a cheat."** It is not load-bearing — A.1 already uses an abstract
alphabet `{a, b}`. Larger reversible examples are generic: `X = ℤ/nℤ`, `tail = (+1 mod n)`,
any `head` — period-`n`, fully reversible. The reversible (bijective-`tail`) coalgebras are a
large class, not a pathology.

**(3) "Test the *canonical* operation — the final-coalgebra shift on `A^ω` — not toy
coalgebras."** The strongest move, and it still fails. The shift `tail(a₀a₁a₂…) = a₁a₂…` has
**both** recurrent orbits (every periodic stream: `(ab)^ω` has a period-2 orbit, `a^ω` is a
fixed point) **and** progressive orbits (every aperiodic stream `s` has all tails distinct).
So the canonical dynamics do **not** force progressivity either. And where the shift *is*
progressive — on an aperiodic `s` — the orbit `{tailⁿ(s)}` is, by the Proposition, an
embedded `(ℕ, succ)` sitting inside `A^ω`; the shift exhibits progressivity exactly because
`A^ω` is big enough to contain `ℕ`-orbits, which is the carrier's `ℕ` again. (One might grasp
instead at the shift's *non-injectivity* — it forgets the head — as a kind of irreversibility.
But that is information-loss, not progressivity: it neither yields a first nor a non-recurring
order, and it is itself a reflex of `A^ω` being Dedekind-infinite, `ℕ ≅ ℕ∖{0}` — carrier-`ℕ`
once more.)

### A.4 Verdict and what it hands forward

**Check A: confirmed.** The stream-coalgebra operation is **arrow-neutral**. It does not
force irreversibility on its dynamics; it can carry an arrow (iff the carrier embeds
`(ℕ, succ)`) or cycle (otherwise), and the canonical shift does both. Whenever the dynamics
*are* irreversible, the arrow is a literal embedded `ℕ`, brought by the carrier, not made by
the operation.

The scope document's central distinction is now **instantiated, not just asserted**: the
swap coalgebra is **productive** (always emits a next) and **non-progressive** (it cycles)
simultaneously — so productivity does not entail the arrow. `productivity ⊥ irreversibility`,
witnessed by one three-line example.

**What A does *not* establish (kept honest).** A localizes the arrow to the carrier; it does
**not** by itself prove the overall FAIL. It leaves open the one question that decides the
test: *the carrier's `ℕ` — is it imported, or is it itself generated by a (dual,
initial-algebra) self-reference?* That is precisely:

- **→ Check B:** in the *construction* of the final coalgebra (Adámek sequence / metric /
  dcpo), where does the carrier's directed completeness come from?
- **→ Check C:** `ℕ` is the initial algebra of `1 + X`. Is the arrow there (well-foundedness,
  "least") *generated* by that algebraic self-reference, or posited as the existence of a
  natural-numbers object?

Check A has done its part: the arrow is provably not in the dynamics. The test now turns on
the carrier.
