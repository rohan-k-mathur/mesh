# Phase 2f Session Prompt — OQ-JSL-Type and OQ-JSL-Cone Resolution

**Purpose of this document.** Standalone prompt for a dedicated conceptual-track
session resolving two open questions from the Phase 2e OQ-JSL proof. Open a
fresh conversation, paste this document as context, and ask the model to work
through both questions in order. The session should produce
`LUDICS_OQ_JSL_TYPE_AND_CONE.md` as its primary deliverable.

**Do not work on this in the implementation thread.** This session has no code
output; it is a close-reading + mathematical-verification exercise.

**Prerequisite resolved (May 21, 2026).** The order-relation ambiguity that
threatened this session's load-bearing claim has been resolved in
[`LUDICS_ORDER_RELATION_DEFINITION.md`](LUDICS_ORDER_RELATION_DEFINITION.md):
$\leq_\subseteq$ is **literal chronicle-set inclusion** (Reading A). The
**Daimon Lock Lemma** (F-Q 2.7 Comparability + 2.5 daimon-as-positive-action)
forces: $D' \subseteq D \Rightarrow D$ has daimon at every node where $D'$
does; designs in the same cone share their entire positive/daimon skeleton
and differ only in negative-branch coverage. The pre-analysis counterexample
(different positive choices past a shared incarnation's daimon) dissolves
under this reading — the offending designs are simply not in the same cone.
**This session should proceed expecting Outcome I**; the "load-bearing check"
in §4 Step 1 is now licensed by the Daimon Lock Lemma, not by a fresh
argument. One open follow-up worth carrying forward: whether thin cones
(negative-branch variation only) are rich enough for the C3 categorical
identification with Ambler hom-sets — flagged in §7 of the order-relation
document.

---

## §0. Context from Phase 2e

Phase 2e (`LUDICS_OQ_JSL_PROOF.md`) resolved the OQ-JSL question with
**Outcome B (Mis-Attribution)**: the join-semilattice structure attributed to
$(\mathsf{Inc}(B), \leq_\subseteq, \vee_{\perp\perp})$ in C1 is incorrect.
Two theorems were proved:

1. **Antichain theorem.** $\mathsf{Inc}(B)$ is an antichain under
   $\leq_\subseteq$. No two distinct elements have a common upper bound
   within $\mathsf{Inc}(B)$.

2. **Cross-Cone Incompatibility.** By uniqueness of incarnation
   (Fouqueré–Quatrini 2013), $B$ decomposes into disjoint cones
   $C_i = \{ D \in B : |D|_B = D_i \}$ for each $D_i \in \mathsf{Inc}(B)$.
   No design in $B$ straddles two cones: if $D_1 \subseteq D$ and
   $D_2 \subseteq D$ for distinct $D_1, D_2 \in \mathsf{Inc}(B)$, then
   $|D|_B = D_1 = D_2$, contradiction.

Phase 2e identified the correct JSL carrier as the **per-incarnation cone**
$C_i$, not $\mathsf{Inc}(B)$ and not $B$. Two open questions remain:

- **OQ-JSL-Type:** What does $(D_1 \cup D_2)^{\perp\perp}$ mean at the design
  level? Is it a single design or a set of designs?
- **OQ-JSL-Cone:** Within a single cone $C_i$, is $(C_i, \leq_\subseteq)$ a
  JSL? Specifically: for $D, D' \in C_i$, does $D \cup D'$ (chronicle-set
  union) always land in $C_i$, and is it the LUB?

This session resolves both in order.

---

## §1. OQ-JSL-Type — the type-level resolution

### §1.1 The two candidate interpretations

Phase 2e §5.4 identified two readings of $D_1 \vee_{\perp\perp} D_2 := (D_1 \cup D_2)^{\perp\perp}$:

**(a) Chronicle-set interpretation.** $D_1$ and $D_2$ are sets of chronicles.
$D_1 \cup D_2$ is a set of chronicles (union). Orthogonality is extended to
arbitrary chronicle-sets: $S^\perp := \{ n : S \perp n \}$ where $S \perp n$
means the interaction norm applied to $S$ against $n$ normalizes to daimon.
$(D_1 \cup D_2)^{\perp\perp}$ is then a single chronicle-set (a single design
or design-like object). $\leq_\subseteq$ comparison with $D_1$ is well-typed.

**(b) Behaviour-set interpretation.** $(D_1 \cup D_2)^{\perp\perp}$ means
$\{D_1, D_2\}^{\perp\perp}$, the smallest behaviour containing both $D_1$ and
$D_2$. The result is a **set of designs** (a sub-behaviour of $B$), not a single
design. $\leq_\subseteq$ comparison with individual designs does not type-check.

### §1.2 The decision criterion

Interpretation (a) keeps the join at the design level and is the one that makes
the per-cone JSL story work. Interpretation (b) shifts the carrier to behaviours
and breaks the $\leq_\subseteq$ comparison.

**Pick interpretation (a)** and verify it against Girard 2001 §4.

### §1.3 What to check in Girard 2001

The interaction norm $\langle p \mid n \rangle$ (Girard 2001 §4, "Locus Solum")
is defined for designs $p$ (positive) and $n$ (negative) satisfying the design
axioms:

- **Tree consistency:** Chronicles form a tree (every proper prefix of a
  chronicle in $D$ is a prefix of another chronicle in $D$; no two chronicles
  at the same node make incompatible action choices)
- **Focalization:** Positive actions at positive loci, negative actions at
  negative loci, strictly alternating
- **Daimon termination:** Every maximal chronicle ends with $\mathsf{†}$ or is
  infinite (in finitary Ludics: always $\mathsf{†}$-terminated)

The questions for this session:

1. **Does $D_1 \cup D_2$ satisfy the design axioms when $D_1, D_2 \in C_i$
   (same cone)?** Since both extend the same incarnation $D_i$, they share
   $D_i$'s chronicle skeleton. The union adds chronicles from both extensions.
   Check whether same-cone chronicle-set union preserves tree consistency and
   focalization. The key potential obstruction: two chronicles from $D_1$ and
   $D_2$ that branch at the same node with different action choices. Can this
   happen within a single cone?

2. **Does $D_1 \cup D_2$ fail the design axioms when $D_1, D_2$ are in
   different cones?** If $D_1 \in C_i$ and $D_2 \in C_j$ with $i \neq j$,
   their root structures may differ (different initial actions, different
   branching). Check whether the union necessarily violates tree consistency.
   If yes, this gives a clean type-level explanation of why cross-cone joins
   are impossible: the union isn't a design, so the norm doesn't apply, so
   $\perp\perp$-closure under interpretation (a) is undefined.

3. **Is $\perp\perp$-closure trivial within a cone?** If $D_1 \cup D_2$ is
   already a valid design in $B$, then $(D_1 \cup D_2)^{\perp\perp} = D_1 \cup D_2$
   (a design in a behaviour is already $\perp\perp$-closed as a singleton).
   Check whether this holds: is every design in $B$ a fixed point of
   $D \mapsto D^{\perp\perp}$ when $D^{\perp\perp}$ is defined as the
   chronicle-set $\{ c : \forall n \in \{D\}^\perp,\; c \text{ participates
   in normalization of } \langle D' \mid n \rangle \text{ for some } D' \ni c \}$?

   If yes, the within-cone join is **literal chronicle-set union** with no
   closure step. This is the simplification hypothesis.

### §1.4 Expected outcome

The expected finding is:

> Under interpretation (a), $D_1 \cup D_2$ is a valid design iff $D_1$ and
> $D_2$ share an incarnation (same cone). Cross-cone unions violate tree
> consistency. Within-cone unions are valid designs and belong to $B$, with
> no $\perp\perp$-closure needed. The $\vee_{\perp\perp}$ notation should
> therefore be simplified to $\vee_\cup$ (literal chronicle-set union) within
> each cone.

If this holds, state it as a proposition with proof. If it fails (e.g., same-cone
designs CAN have conflicting branching at shared nodes), identify the failure
mode precisely and determine whether $\perp\perp$-closure rescues the situation.

---

## §2. OQ-JSL-Cone — the per-cone JSL

### §2.1 The claim to resolve

**OQ-JSL-Cone.** For each $D_i \in \mathsf{Inc}(B)$, the cone
$C_i = \{ D \in B : |D|_B = D_i \}$ ordered by $\leq_\subseteq$ is a
join-semilattice with bottom $D_i$.

This requires:

- **Cone-Closure:** For $D, D' \in C_i$, $D \cup D' \in C_i$ (assuming
  OQ-JSL-Type resolves that within-cone union is a valid design in $B$).
- **Cone-LUB:** $D \cup D'$ is the least upper bound of $D$ and $D'$ in $C_i$.
  (This is immediate from set-union: if $D'' \supseteq D$ and $D'' \supseteq D'$,
  then $D'' \supseteq D \cup D'$.)

### §2.2 What to check

**Cone-Closure** is the substantive question. It breaks into:

1. **$D \cup D' \in B$:** Does the union of two same-cone designs stay in the
   behaviour? The argument: $D \perp n$ for all $n \in B^\perp$, and
   $D' \perp n$ for all $n \in B^\perp$. Does $(D \cup D') \perp n$ follow?

   **The monotonicity hypothesis.** Adding chronicles to a design can only
   *help* normalization of the interaction, never break it. Formally: if
   $D \subseteq D''$ and $D \perp n$, then $D'' \perp n$. This is because the
   interaction norm follows the chronicles of the positive design against the
   counter-design; having more chronicles available means more branches for
   the interaction to follow, and the existing normalizing branch is still
   present.

   Check this against Girard 2001 §4. The key is whether the norm is
   *deterministic* (follows a single branch, chosen by focalization) or
   *non-deterministic* (explores all branches). If deterministic: adding
   chronicles doesn't change which branch is followed, so if $D \perp n$
   via branch $c$, then $D'' \perp n$ via the same branch $c$. If
   non-deterministic: adding chronicles could open new interaction paths
   that fail to normalize, potentially breaking $D'' \perp n$ even though
   $D \perp n$.

   **This is the load-bearing check.** Girard's norm is deterministic
   (focalization forces the interaction at each step). Verify this.

2. **$|D \cup D'|_B = D_i$:** Does the union stay in the *same cone*? If
   $D, D' \in C_i$, then $D_i \subseteq D$ and $D_i \subseteq D'$, so
   $D_i \subseteq D \cup D'$. Since $D_i \in B$ and $D_i$ is minimal, and
   $D_i \subseteq D \cup D'$, we have $|D \cup D'|_B \leq_\subseteq D_i$.
   But $D_i$ is minimal, so $|D \cup D'|_B = D_i$. **This step is
   immediate** once we know $D \cup D' \in B$.

### §2.3 The maximal-clique angle (backup approach)

If the monotonicity-of-norm argument is unclear from Girard §4, there is a
second approach via Fouqueré–Quatrini 2013 §3 (maximal cliques of visitable
paths).

Fouqueré–Quatrini characterize incarnation via maximal cliques:

> A set of paths is *visitable* if it corresponds to a potential interaction
> sequence. The incarnation of a design $D$ in $B$ consists of exactly those
> chronicles of $D$ that participate in some visitable path with some
> counter-design $n \in B^\perp$.

If $D, D' \in C_i$ share the incarnation $D_i$, their "useful" chronicles
(those in the maximal clique) are both supersets of $D_i$'s useful chronicles.
The union $D \cup D'$ has useful chronicles that are the union of those of $D$
and $D'$. The maximal-clique structure of $D \cup D'$ contains the maximal
clique of $D_i$ as a sub-clique. Since the incarnation is determined by the
maximal clique, $|D \cup D'|_B = D_i$.

This approach can confirm Cone-Closure (part 2) directly from the clique
characterization without needing the monotonicity-of-norm argument. Use it
as backup if §2.2 is inconclusive.

---

## §3. Reference materials

Work through these **in the order listed**. Each is marked with the specific
question it bears on.

1. **Girard 2001 — "Locus Solum"** (MSCS 11(3):301–506):
   - §2: Design syntax — tree consistency, focalization, daimon. **[Type Q1, Q2]**
   - §4: Interaction norm — determinism, focalization-driven. **[Type Q1; Cone §2.2.1]**
   - §5: Biorthogonal closure — $B^{\perp\perp} = B$; monotonicity. **[Type Q3]**
   - §6: Internal completeness — closure under directed unions. **[Cone §2.2.1]**

2. **Fouqueré–Quatrini 2013** (LMCS 9(4:6)):
   - §2: Incarnation; the inclusion order on designs in $B$. **[Type Q3]**
   - §3: Maximal cliques of visitable paths. **[Cone §2.3]**
   - §4: Characterization of incarnation via cliques. **[Cone §2.3]**

3. **Basaldella–Faggian 2011** (LMCS 7(2)):
   - Internal completeness for exponentials. **[Cone §2.2.1 — monotonicity]**
   - The treatment of design unions in the repetition/exponential setting.

4. **Doumane 2017** (CSL, LIPIcs):
   - Inductive and functional types; $\perp\perp$-closure under regularity.
   - "Theorem 30: the set $\bigcup_{n \in \mathbb{N}} A_n$ is a behaviour …
     $\perp\perp$-closure is useless." **[Type Q3 — closure triviality]**

---

## §4. Proof strategy

### Step 1 (OQ-JSL-Type): Same-cone union preserves design axioms

**Approach.** Let $D_1, D_2 \in C_i$ for some $D_i \in \mathsf{Inc}(B)$.
Both $D_1$ and $D_2$ are designs at the same locus $\xi$ extending $D_i$.

- *Tree consistency:* Every chronicle in $D_1$ and $D_2$ starts with the same
  initial action (the one specified by $D_i$'s root). At each branching node
  in the tree, a design specifies a set of sub-actions to respond to. $D_1$
  and $D_2$ may specify *different sets* of sub-actions at the same node.
  Their union specifies the *union* of these sets. This is still a valid tree
  — it adds branches, not conflicting actions at the same branch.

  The potential obstruction: two chronicles that agree on a prefix but then
  make *different positive action choices* at the same positive node. In
  focalized designs, positive actions are *chosen* (the design picks which
  locus to focus on), while negative actions are *received* (the design must
  respond to all possible opponent moves). If $D_1$ focuses on locus $\alpha$
  at some node and $D_2$ focuses on locus $\beta \neq \alpha$ at the same
  node, the union has both — which violates focalization (a design must make
  a single positive choice at each positive node).

  **This is the critical check.** Does same-cone membership (shared
  incarnation) guarantee that $D_1$ and $D_2$ make the *same* positive
  choices at every shared node? If the incarnation $D_i$ already determines
  all positive choices (and extensions only add negative branches — responses
  to more opponent moves), then same-cone union preserves focalization.

  Check whether this is the case: in Girard's Ludics, do "larger" designs
  (extensions of $D_i$) differ only in which negative branches they provide
  responses to, or can they also differ in positive choices?

### Step 2 (OQ-JSL-Type): Cross-cone union fails design axioms

**Approach.** If $D_1 \in C_i$ and $D_2 \in C_j$ with $D_i \neq D_j$, their
incarnations differ. At some node in the chronicle tree, $D_i$ and $D_j$ make
different positive choices (otherwise they would be the same incarnation or one
would be a sub-design of the other, contradicting the antichain property). At
that node, $D_1 \cup D_2$ has conflicting positive choices — violating
focalization. Therefore $D_1 \cup D_2$ is not a valid design.

### Step 3 (OQ-JSL-Cone): Monotonicity of the norm

**Approach.** The Girard norm $\langle p \mid n \rangle$ is deterministic:
at each step, focalization determines which action is performed. The positive
design chooses a focus; the negative design responds. Having more chronicles
in the positive design means more *negative branches are covered* (responses
to more opponent sub-actions), but the *positive choices* are the same (fixed
by the incarnation).

Therefore: if $D \perp n$ (the interaction normalizes), and $D'' \supseteq D$
with $D''$ in the same cone (same positive choices, more negative responses),
then $D'' \perp n$ via the same interaction sequence. The additional chronicles
in $D''$ are not visited by this particular interaction.

State this as a proposition. Conclude: $D \cup D' \in B$ for same-cone
$D, D'$, and $|D \cup D'|_B = D_i$, so $D \cup D' \in C_i$. The per-cone
JSL holds with join = literal chronicle-set union.

### Step 4: Write the corrected C1 statement

If Steps 1–3 succeed, the corrected C1 is:

> **C1 (corrected).** For each incarnation $D_i \in \mathsf{Inc}(B)$, the cone
> $C_i = \{ D \in B : |D|_B = D_i \}$ is a join-semilattice under
> $\leq_\subseteq$ with bottom $D_i$ and join $D \vee D' = D \cup D'$
> (literal chronicle-set union). $\mathsf{Inc}(B)$ is an antichain indexing
> the cones; it is not itself a JSL.

---

## §5. Branching outcomes

### Outcome I: Type and Cone both confirmed

Same-cone union preserves design axioms; the norm is monotone; per-cone
$(C_i, \leq_\subseteq, \cup)$ is a JSL with bottom $D_i$.

**Edits:**
- C1 in consolidation doc: `Corrected and confirmed` — per-cone JSL with
  join = chronicle-set union. Inc(B) is generating antichain, not JSL.
- OQ-JSL-Type: `Resolved` — interpretation (a), within-cone only.
- OQ-JSL-Cone: `Resolved` — confirmed.
- `compute_articulation_join` doc-comment: join is in $C_i \subseteq B$;
  literal chronicle-set union; inputs must share incarnation.
- C3 framing: Ambler identification is per-cone. Ambler's $\vee$ = $\cup$.

### Outcome II: Type confirmed, Cone fails

Same-cone union is a valid design, but $D \cup D' \notin B$ for some
same-cone pair (monotonicity of norm fails). The within-cone join is not
literal union; $\perp\perp$-closure may be needed.

**Edits:**
- C1: `Corrected; per-cone JSL open` — the join exists (Obligation 2 from
  Phase 2e proves LUB given an upper bound) but Cone-Closure is unresolved.
- OQ-JSL-Type: `Resolved`.
- OQ-JSL-Cone: `Open` — carry forward. The next step would be to check
  whether $(D \cup D')^{\perp\perp}$ (under interpretation (a)) lands in $C_i$.

### Outcome III: Type fails for same-cone designs

Same-cone designs CAN have conflicting positive choices at shared nodes.
The chronicle-set union is not a valid design even within a cone.

**Edits:**
- C1: `Corrected; per-cone structure is a poset, not a JSL`
- Interpretation (a) fails; fall back to interpretation (b) or abandon the
  design-level join entirely.
- `compute_articulation_join`: mark as "computes a behaviour-level join
  (a set of designs), not a design-level join."

**This outcome is unlikely** given the structure of focalization in Ludics
(incarnation fixes positive choices; extensions add negative branches). But
the session should verify rather than assume.

---

## §6. Output format for LUDICS_OQ_JSL_TYPE_AND_CONE.md

```markdown
# OQ-JSL-Type and OQ-JSL-Cone Resolution

**Session:** Phase 2f
**Date:** [date]
**Track:** Conceptual / proof
**Verdict:** [OUTCOME I / II / III]

## 1. OQ-JSL-Type resolution

### 1.1 Design axioms under same-cone union
[Verify or refute: D₁ ∪ D₂ is a valid design when D₁, D₂ ∈ Cᵢ]

### 1.2 Cross-cone union failure
[Verify: D₁ ∪ D₂ violates focalization when D₁ ∈ Cᵢ, D₂ ∈ Cⱼ, i ≠ j]

### 1.3 Closure triviality
[If same-cone union is a valid design in B: is ⊥⊥-closure trivial?]

### 1.4 Type resolution verdict
[State which interpretation is correct and why]

## 2. OQ-JSL-Cone resolution

### 2.1 Monotonicity of the norm
[Verify or refute: D ⊆ D″ and D ⊥ n ⟹ D″ ⊥ n, for same-cone D, D″]

### 2.2 Cone-Closure
[D ∪ D′ ∈ B and |D ∪ D′|_B = Dᵢ when D, D′ ∈ Cᵢ]

### 2.3 Cone-LUB
[D ∪ D′ is LUB in Cᵢ — immediate from set-union]

### 2.4 Cone verdict
[State whether (Cᵢ, ≤⊆, ∪) is a JSL]

## 3. Corrected C1 statement

[The precise corrected claim for the consolidation doc]

## 4. Downstream implications

[Edits to consolidation doc, compute_articulation_join, C3 framing]

## 5. Open questions not resolved

[Anything remaining — e.g. the 0d convolution under per-cone framing]
```

---

## §7. What this session does NOT produce

- No code. Implementation-side changes happen in the main thread.
- No changes to the Session 2 dev spec.
- No new conceptual constructs beyond resolving OQ-JSL-Type and OQ-JSL-Cone.
- No re-examination of Cross-Cone Incompatibility (settled in Phase 2e).
