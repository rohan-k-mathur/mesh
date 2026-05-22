# OQ-JSL Formal Proof — Articulation Lattice Join-Semilattice Axioms

**Session:** Phase 2e (Formal Proof)
**Date:** 2026-05-21
**Track:** Conceptual / proof
**Verdict:** OUTCOME B: MIS-ATTRIBUTED — with structural refinement

The join-semilattice structure attributed to $(\mathsf{Inc}(B), \leq_\subseteq, \vee_{\perp\perp})$ in C1 is a mis-attribution. $\mathsf{Inc}(B)$ is an antichain under $\leq_\subseteq$; the $\vee_{\perp\perp}$ operation maps out of $\mathsf{Inc}(B)$ for every pair of distinct inputs. Furthermore, uniqueness of incarnation implies $B$ itself decomposes into disjoint cones above each incarnation, so $(B, \leq_\subseteq)$ is not a JSL either. The correct JSL carrier is the **per-incarnation cone** $\uparrow\!D_i \cap B$ for each $D_i \in \mathsf{Inc}(B)$.

---

## 1. Claim under examination

**OQ-JSL (as stated).** For any behaviour $B$ in the Ludics substrate (under the finitely-generated restriction), and any $D_1, D_2 \in \mathsf{Inc}(B)$:

$$D_1 \vee_{\perp\perp} D_2 = (D_1 \cup D_2)^{\perp\perp} \in \mathsf{Inc}(B)$$

and this join is the least upper bound of $D_1$ and $D_2$ under $\leq_\subseteq$.

This decomposes into:

- **Obligation 1 (Closure):** $(D_1 \cup D_2)^{\perp\perp} \in \mathsf{Inc}(B)$.
- **Obligation 2 (LUB):** $(D_1 \cup D_2)^{\perp\perp}$ is the least upper bound of $D_1, D_2$ under $\leq_\subseteq$.

---

## 2. Definitions and setup

Fix a deliberation with finite locus set $\Lambda$. A **design** $D$ at locus $\xi \in \Lambda$ is a set of chronicles (justified action-sequences with focalization and daimon termination; Girard 2001 §2). A **behaviour** $B$ is a set of designs with $B = B^{\perp\perp}$, where orthogonality $p \perp n$ holds iff the interaction norm $\langle p \mid n \rangle$ normalizes to daimon (Girard 2001 §4).

The **sub-design inclusion order**: $D_1 \leq_\subseteq D_2$ iff every chronicle of $D_1$ is a chronicle of $D_2$ (set inclusion of chronicle sets).

The **incarnation set**: $\mathsf{Inc}(B) := \{ D \in B \mid \nexists D' \in B,\; D' \subsetneq D \}$ — the minimal elements of $B$ under $\leq_\subseteq$.

The **proposed join**: $D_1 \vee_{\perp\perp} D_2 := (D_1 \cup D_2)^{\perp\perp}$.

**Finitely-generated constraint.** $\Lambda$ is finite; each design has bounded arity; $\mathsf{Inc}(B)$ is finite.

---

## 3. Pre-analysis status

### §0.2 extensivity argument: valid in substance, requires type-level clarification

The §0.2 argument claims $D_1 \subseteq D_1 \cup D_2 \subseteq (D_1 \cup D_2)^{\perp\perp}$ by extensivity of $\perp\perp$-closure. There is a legitimate type question: $D_1 \cup D_2$ (union of chronicle sets of two designs) may not be a valid design (tree-consistency or focalization axioms may fail), and the standard $\perp\perp$-closure is defined on sets of designs, not sets of chronicles.

**Resolution.** The argument does not actually need the $\perp\perp$-closure step. The failure of Obligation 1 follows from a simpler, purely order-theoretic fact that requires no closure machinery at all. See §5.1 below. The extensivity argument in §0.2 is therefore correct in its conclusion but over-engineered in its mechanism.

### §0.3 antichain argument: confirmed, load-bearing

$\mathsf{Inc}(B)$ is an antichain under $\leq_\subseteq$ by definition of minimality: if $D_1, D_2 \in \mathsf{Inc}(B)$ with $D_1 \subseteq D_2$, then $D_1 = D_2$ (since $D_2$ is minimal and $D_1 \in B$ with $D_1 \subseteq D_2$). This is the load-bearing observation. It requires no properties of $\perp\perp$-closure, no finite-generation constraint, and no specific features of Ludics — it holds for the minimal elements of any partially ordered set.

---

## 4. Literature framing

### What Fouqueré–Quatrini 2013 actually states

Fouqueré & Quatrini (LMCS 9(4:6), 2013) establish the following:

1. **Incarnation as minimal sub-design (Theorem).** For any design $D \in B$, the incarnation $|D|_B$ is the unique smallest sub-design of $D$ that remains in $B$. "$\text{Incarnation} \ldots \text{is defined as its subdesign that is the smallest one in the behaviour ordered by inclusion}$" (abstract). This is the **uniqueness-of-incarnation** result.

2. **Characterization via paths.** Incarnation is characterized constructively via maximal cliques of paths — a chronicle is "useful" (retained in the incarnation) iff it participates in an interaction with some counter-design.

3. **Inclusion order on designs in $B$.** The paper works extensively with $\leq_\subseteq$ on designs within $B$, treating incarnations as the minimal layer.

**What the paper does NOT state.** Fouqueré–Quatrini 2013 does not assert that $(\mathsf{Inc}(B), \leq_\subseteq, \vee_{\perp\perp})$ is a join-semilattice. The JSL claim in C1 is the substrate's own assemblage. The "confirmed-with-caveat" status in the literature review confirmed the components (inclusion poset; $\perp\perp$-closure operations; incarnation as minimum) but not the named triple as a JSL.

### The uniqueness-of-incarnation consequence

Uniqueness of incarnation yields a decomposition theorem for $B$:

**Proposition (Cone Decomposition).** $B$ decomposes as a disjoint union of cones:

$$B = \bigsqcup_{D_i \in \mathsf{Inc}(B)} C_i, \qquad C_i := \{ D \in B : |D|_B = D_i \} = \{ D \in B : D_i \subseteq D \text{ and } \nexists D_j \in \mathsf{Inc}(B),\; D_j \neq D_i,\; D_j \subseteq D \}$$

*Proof.* Every $D \in B$ has a unique incarnation $|D|_B \in \mathsf{Inc}(B)$ (Fouqueré–Quatrini 2013). Assign $D$ to the cone $C_{|D|_B}$. This assignment is total (every $D$ has an incarnation) and well-defined (incarnation is unique), giving a partition. $\square$

This decomposition is the structural key to the entire analysis.

---

## 5. Proof: Obligation 1 fails; Obligation 2 is moot at the Inc(B) level

### 5.1 Obligation 1 — Closure under the join: FAILS

**Theorem.** For any two distinct $D_1, D_2 \in \mathsf{Inc}(B)$, there is no element $D' \in \mathsf{Inc}(B)$ with $D_1 \leq_\subseteq D'$ and $D_2 \leq_\subseteq D'$. In particular, $\vee_{\perp\perp}$ cannot produce an element of $\mathsf{Inc}(B)$.

*Proof.*

$\mathsf{Inc}(B)$ is an antichain under $\leq_\subseteq$: if $D_1, D_2 \in \mathsf{Inc}(B)$ and $D_1 \subseteq D_2$, then since $D_1 \in B$ and $D_2$ is minimal in $B$, we have $D_1 = D_2$.

Let $D_1 \neq D_2 \in \mathsf{Inc}(B)$. Suppose for contradiction that $D' \in \mathsf{Inc}(B)$ with $D_1 \subseteq D'$ and $D_2 \subseteq D'$. Since $D'$ is minimal in $B$ and $D_1 \in B$ with $D_1 \subseteq D'$, we get $D_1 = D'$. Similarly $D_2 = D'$. So $D_1 = D_2$, contradicting distinctness. $\square$

**Corollary.** There are no upper bounds for any pair of distinct elements of $\mathsf{Inc}(B)$ within $\mathsf{Inc}(B)$ itself. The $\vee_{\perp\perp}$ operation, regardless of how it is defined, cannot be a binary operation on $\mathsf{Inc}(B)$ — it must map out of $\mathsf{Inc}(B)$ for every pair of distinct inputs. $(\mathsf{Inc}(B), \leq_\subseteq, \vee_{\perp\perp})$ is not a join-semilattice.

### 5.2 Stronger result: no upper bounds in B across cones

**Theorem (Cross-Cone Incompatibility).** For distinct $D_1, D_2 \in \mathsf{Inc}(B)$, there is no $D \in B$ with $D_1 \subseteq D$ and $D_2 \subseteq D$.

*Proof.* Suppose $D \in B$ with $D_1 \subseteq D$ and $D_2 \subseteq D$. By uniqueness of incarnation, $D$ has a unique incarnation $|D|_B \in \mathsf{Inc}(B)$ with $|D|_B \subseteq D$. Since $D_1 \in B$ and $D_1 \subseteq D$, and $|D|_B$ is the *smallest* element of $B$ below $D$, we need $|D|_B \subseteq D_1$. But $D_1$ is minimal in $B$, so $|D|_B = D_1$. By the same argument applied to $D_2$: $|D|_B = D_2$. Therefore $D_1 = D_2$, contradicting distinctness. $\square$

**Corollary.** $(B, \leq_\subseteq)$ decomposes into disjoint cones (the Cone Decomposition of §4). Elements in different cones have no common upper bound. $(B, \leq_\subseteq)$ is therefore **not** a join-semilattice whenever $|\mathsf{Inc}(B)| \geq 2$.

### 5.3 Obligation 2 — LUB property: proved but vacuously applicable at Inc(B) level

The Obligation 2 proof from §0.1 is correct:

*Proof.* Let $D' \in B$ with $D_1 \leq_\subseteq D'$ and $D_2 \leq_\subseteq D'$. Then $D_1 \cup D_2 \subseteq D'$. By monotonicity of $\perp\perp$-closure: $(D_1 \cup D_2)^{\perp\perp} \subseteq D'^{\perp\perp} = D'$ (since $D' \in B = B^{\perp\perp}$). Therefore $D_1 \vee_{\perp\perp} D_2 \leq_\subseteq D'$. $\square$

However, by Theorem 5.2, when $|D_1|_B \neq |D_2|_B$ (i.e., $D_1$ and $D_2$ are in different cones), the set of common upper bounds in $B$ is **empty**. The LUB property holds vacuously.

When $|D_1|_B = |D_2|_B$ (same cone), the Obligation 2 proof is substantive and confirms that $(D_1 \cup D_2)^{\perp\perp}$ is the LUB *within that cone* — provided the $\perp\perp$-closure is well-defined at the design level (see §7).

### 5.4 The type-level issue with $\vee_{\perp\perp}$

The expression $(D_1 \cup D_2)^{\perp\perp}$ has a type issue that the substrate should resolve:

- $D_1$ and $D_2$ are designs (sets of chronicles)
- $D_1 \cup D_2$ is a set of chronicles that may not be a valid design
- Standard $\perp\perp$-closure in Ludics operates on **sets of designs**, producing behaviours (sets of designs)

One consistent interpretation: extend orthogonality to arbitrary chronicle-sets, so that $(D_1 \cup D_2)^{\perp} := \{ n : (D_1 \cup D_2) \perp n \}$ and $(D_1 \cup D_2)^{\perp\perp}$ is a set of chronicles closed under the extended orthogonality. Under this reading, $(D_1 \cup D_2)^{\perp\perp}$ is a single "maximal" chronicle-set (a single design or design-like object), and the extensivity $D_1 \cup D_2 \subseteq (D_1 \cup D_2)^{\perp\perp}$ holds as in any closure operator.

An alternative interpretation: $(D_1 \cup D_2)^{\perp\perp}$ means $\{D_1, D_2\}^{\perp\perp}$, the smallest behaviour containing both $D_1$ and $D_2$. Under this reading, the result is a **set of designs** (a behaviour), not a single design, and $\leq_\subseteq$-comparison with individual designs does not type-check.

**Either way, the Obligation 1 failure does not depend on resolving this.** The antichain argument (§5.1) and the Cross-Cone Incompatibility theorem (§5.2) are purely order-theoretic and require no $\perp\perp$-closure.

---

## 6. Verdict and downstream implications

### Verdict: Outcome B (Mis-Attribution) — Refined

The C1 claim attributes a JSL structure to $(\mathsf{Inc}(B), \leq_\subseteq, \vee_{\perp\perp})$. This is incorrect:

- $\mathsf{Inc}(B)$ is an antichain under $\leq_\subseteq$. It carries no non-trivial order structure at all (every pair of distinct elements is incomparable).
- $\vee_{\perp\perp}$ maps out of $\mathsf{Inc}(B)$ for every pair of distinct inputs.
- Even in the full behaviour $B$, elements from different cones (different incarnations) have no common upper bound.

The correct structures are:

1. **Per-incarnation cone.** For each $D_i \in \mathsf{Inc}(B)$, the cone $C_i = \{ D \in B : |D|_B = D_i \}$ ordered by $\leq_\subseteq$ has $D_i$ as bottom. Within $C_i$, the $\vee_{\perp\perp}$ join (suitably type-resolved) is a candidate JSL operation. Proving the full JSL axioms within each $C_i$ is an open question deferred to §7.

2. **$\mathsf{Inc}(B)$ as a set of generators.** $\mathsf{Inc}(B)$ indexes the connected components of $(B, \leq_\subseteq)$. It is best described as a **generating antichain**, not a lattice.

3. **The Ambler correspondence (C3).** C3 should be re-framed: Ambler derivations correspond to designs in $B$ (not incarnations); Ambler's selected arrows correspond to incarnations; Ambler's $\vee$ corresponds to the within-cone join, not a cross-incarnation operation. The C3 identification is a per-cone statement: $C_i \cong \mathrm{Hom}_{\mathcal{A}_\Gamma}(A, B_i)$ for the $i$-th component.

### Required edits to LUDICS_CONSOLIDATION_AND_DEV_READINESS.md

**C1 row:**
- Change `Confirmed-with-caveat` → `Corrected`
- Key caveat: "$(\mathsf{Inc}(B), \leq_\subseteq, \vee_{\perp\perp})$ is NOT a JSL. $\mathsf{Inc}(B)$ is an antichain; the $\vee_{\perp\perp}$ operation maps out of $\mathsf{Inc}(B)$ for all distinct inputs (proved Phase 2e). The correct JSL carrier is the per-incarnation cone $C_i \subseteq B$, not $\mathsf{Inc}(B)$. See `LUDICS_OQ_JSL_PROOF.md`."

**OQ-JSL row:**
- Add resolution: "Resolved — negative for $\mathsf{Inc}(B)$; deferred for per-cone JSL. See `LUDICS_OQ_JSL_PROOF.md`."

**Impact on `compute_articulation_join`:**
- Add doc-comment: the returned design is an element of $B$ (the behaviour), specifically an element of the cone $C_{|D_1|_B}$. It is NOT an element of $\mathsf{Inc}(B)$ unless $D_1 = D_2$.
- Add `joinIsMinimal: boolean` field to `ComputeArticulationJoinResult`, set to `true` only when $D_1 = D_2$ (trivial join).
- Add validation: if $|D_1|_B \neq |D_2|_B$ (inputs from different cones), return an error — there is no join, not even in $B$.

**Impact on C3 framing:**
- Re-state the Ambler identification as per-cone: each cone $C_i$ corresponds to one Ambler hom-set component. Incarnations = selected arrows. The full behaviour $B$ corresponds to the disjoint union of Ambler hom-sets over the incarnation index.

---

## 7. Open questions not resolved by this session

**OQ-JSL-Cone.** Within a single cone $C_i = \{ D \in B : |D|_B = D_i \}$, is $(C_i, \leq_\subseteq, \vee)$ a join-semilattice with bottom $D_i$? The Obligation 2 proof (§5.3) establishes the LUB property for elements within the same cone, so the question reduces to: for $D, D' \in C_i$, does a design $D'' \in C_i$ with $D \subseteq D''$ and $D' \subseteq D''$ always exist? I.e., is every pair within a cone compatible?

This is the residual proof obligation. The Obligation 2 argument shows that IF common upper bounds exist within $C_i$, then $(D \cup D')^{\perp\perp}$ (suitably interpreted) is the LUB. The IF is the open part: it requires showing that within-cone designs are always upward-compatible, which is a non-trivial property of behaviours that may depend on the finite-generation constraint.

**OQ-JSL-Type.** The $\vee_{\perp\perp}$ operation needs a type-consistent definition at the design level (not the behaviour level). The two candidate interpretations in §5.4 need to be resolved. This is a notational/foundational issue, not a deep mathematical one, but it should be settled before the C3 rewrite proceeds.

**OQ-JSL-Ambler.** Does the per-cone reformulation of C3 still support the convolution construction in Session 0d §0d.2? The convolution assumed a single JSL on all incarnations. Under the corrected per-cone picture, convolution is per-cone — which may or may not suffice for the cross-room Plexus transport use case.