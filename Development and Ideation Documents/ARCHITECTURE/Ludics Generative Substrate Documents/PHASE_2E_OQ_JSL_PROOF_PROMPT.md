# Phase 2e Proof Prompt — OQ-JSL Formal Proof Pass

**Purpose of this document.** This is a standalone prompt for a dedicated
conceptual-track session. Open a fresh conversation, paste this document as
context, and ask the model to work through the proof. The session should produce
`LUDICS_OQ_JSL_PROOF.md` as its primary deliverable.

**Do not work on this in the implementation thread.** This session has no code
output; it is a mathematical proof-or-counterexample exercise.

---

## §0. Pre-analysis — known observations (read before §1)

The following structural observations were worked out before this proof session
opened. The proof session should verify them, sharpen them, and determine the
correct rescue (if any) or confirm the counterexample verdict.

### §0.1 Obligation 2 is essentially proved

Obligation 2 (LUB property) reduces immediately to monotonicity of
biorthogonal closure, which is standard. The argument is complete:

1. Let $D' \in \mathsf{Inc}(B)$ with $D_1 \leq_\subseteq D'$ and $D_2
   \leq_\subseteq D'$. Then $D_1 \cup D_2 \subseteq D'$ (set-theoretically).
2. By monotonicity of $\perp\perp$-closure:
   $(D_1 \cup D_2)^{\perp\perp} \subseteq D'^{\perp\perp}$.
3. Since $D' \in B = B^{\perp\perp}$, we have $D'^{\perp\perp} = D'$.
4. Therefore $D_1 \vee_{\perp\perp} D_2 \leq_\subseteq D'$.

Monotonicity of biorthogonal closure ($X \subseteq Y \Rightarrow X^{\perp\perp}
\subseteq Y^{\perp\perp}$) is a standard consequence of the fact that larger
sets have smaller orthogonals: $X \subseteq Y \Rightarrow Y^\perp \subseteq
X^\perp \Rightarrow X^{\perp\perp} \subseteq Y^{\perp\perp}$. The
finite-generation constraint introduces no obstruction here.

**Verdict on Obligation 2: proved.**

### §0.2 Obligation 1 likely fails — structural argument

There is a structural argument that $(D_1 \cup D_2)^{\perp\perp} \notin
\mathsf{Inc}(B)$ holds for *every* pair of distinct $D_1, D_2 \in
\mathsf{Inc}(B)$, not just in pathological cases.

**The argument.** Since $\leq_\subseteq$ is chronicle-set inclusion and
biorthogonal closure is extensive ($S \subseteq S^{\perp\perp}$):

$$D_1 \;\subseteq\; D_1 \cup D_2 \;\subseteq\; (D_1 \cup D_2)^{\perp\perp}$$

so $D_1 \leq_\subseteq (D_1 \cup D_2)^{\perp\perp}$, and $D_1 \in B$.

If $D_1 \neq D_2$ and they are incomparable (which they must be, since both are
minimal in $B$ and hence form an antichain — no element of $\mathsf{Inc}(B)$
is $\leq_\subseteq$ another), then $D_2$ has at least one chronicle not in
$D_1$. Therefore $D_1 \cup D_2 \supsetneq D_1$, which gives
$(D_1 \cup D_2)^{\perp\perp} \supsetneq D_1$, i.e.,
$D_1 \subsetneq (D_1 \cup D_2)^{\perp\perp}$.

So $D_1 \in B$ is a *proper* sub-design of $(D_1 \cup D_2)^{\perp\perp}$,
witnessing that $(D_1 \cup D_2)^{\perp\perp} \notin \mathsf{Inc}(B)$.

**This argument applies universally** — it does not require constructing a
specific behaviour. It holds for any $B$ and any two distinct incomparable
elements $D_1, D_2 \in \mathsf{Inc}(B)$.

### §0.3 Stronger structural consequence

The above argument also shows that $\mathsf{Inc}(B)$ is an *antichain* under
$\leq_\subseteq$: any two distinct elements of $\mathsf{Inc}(B)$ are
incomparable (since each is minimal in $B$). Therefore, in $\mathsf{Inc}(B)$
with the $\leq_\subseteq$ order, there are **no upper bounds** for any pair of
distinct elements. The only "upper bounds" of $D_1$ and $D_2$ in $B$ are
elements of $B \setminus \mathsf{Inc}(B)$ (the non-minimal layer). The
$\vee_{\perp\perp}$ join maps out of $\mathsf{Inc}(B)$ *every time* for
distinct inputs.

This means $(\mathsf{Inc}(B), \leq_\subseteq, \vee_{\perp\perp})$ **cannot
be a join-semilattice** as literally stated: the operation $\vee_{\perp\perp}$
is not even a well-defined binary operation *on* $\mathsf{Inc}(B)$.

### §0.4 The primary task for the proof session

The pre-analysis makes it likely that the verdict is "counterexample found."
But the proof session must do three things before that verdict is locked in:

1. **Verify or refute the structural argument in §0.2.** Specifically: is
   the extensivity $D_1 \cup D_2 \subseteq (D_1 \cup D_2)^{\perp\perp}$
   valid in the Ludics setting? The standard result $S \subseteq S^{\perp\perp}$
   is a closure-operator property; check that $D_1 \cup D_2$ (a union of two
   designs, which may not itself be a valid design) is a legitimate input to
   the $\perp\perp$-closure.

2. **Identify the correct literature framing.** The "confirmed-with-caveat"
   status of C1 implies the literature *does* state something JSL-like about
   $\mathsf{Inc}(B)$. If the structural argument in §0.2 is correct, the
   literature must either (a) use a different ordering on $\mathsf{Inc}(B)$
   than $\leq_\subseteq$, (b) define the join as something other than
   $(D_1 \cup D_2)^{\perp\perp}$, or (c) state the JSL property for the full
   behaviour $B$ (not $\mathsf{Inc}(B)$) and the substrate has mis-framed C1.
   This is the most important question: **which of (a), (b), (c)?**

3. **Determine the correct object.** If the JSL structure lives on $B$ (not
   $\mathsf{Inc}(B)$), then: does $(B, \leq_\subseteq, \vee_{\perp\perp})$
   satisfy the JSL axioms? And what is the correct description of
   $\mathsf{Inc}(B)$ within this lattice — an antichain of generators? If so,
   the substrate's C1 framing needs correction, and `compute_articulation_join`
   should be documented as computing a join in $B$, not in $\mathsf{Inc}(B)$.

---

## Role and task

You are acting as a formal-methods mathematician with deep familiarity with
Girard's Ludics, biorthogonal closure in coherence spaces, and the theory of
join-semilattices. The pre-analysis in §0 gives a strong prior that the
OQ-JSL verdict is "counterexample found." Your job is to either confirm this
(resolving the three tasks in §0.4) or identify where the pre-analysis errs.

**Output.** Produce a markdown proof document targeting the following location in
the repository:

```
Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/
    LUDICS_OQ_JSL_PROOF.md
```

Produce the targeted edits to `LUDICS_CONSOLIDATION_AND_DEV_READINESS.md` listed
in §8 below regardless of outcome (the edits differ by verdict).

---

## §1. Background: the articulation lattice

### §1.1 Behaviour and incarnation set

Fix a deliberation with locus set $\Lambda$. A **design** at a positive locus
$\xi \in \Lambda$ is a forest of justified sequences with focalization plus the
ultra-positive daimon end-marker $\mathsf{†}$, following Girard 2001 §2. A
**behaviour** $B$ at locus $\xi$ is a set of designs that is **biorthogonally
closed**: $B = B^{\perp\perp}$, where orthogonality $p \perp n$ holds iff the
Ludics interaction norm $\langle p \mid n \rangle$ normalizes to the daimon
(Girard 2001 §4).

The **incarnation set** of $B$ is the set of minimal elements under the
sub-design inclusion order $\leq_\subseteq$:

$$\mathsf{Inc}(B) := \{ D \in B \mid \nexists D' \in B,\; D' \subsetneq D \}$$


(Source: C2 in the claims register — Confirmed against Girard 2001 and
Fouqueré–Quatrini 2013 LMCS 9(4:6).)

### §1.2 The biorthogonal closure join

For $D_1, D_2 \in \mathsf{Inc}(B)$, define:

$$D_1 \vee_{\perp\perp} D_2 := (D_1 \cup D_2)^{\perp\perp}$$

This is the smallest biorthogonally closed set containing both $D_1$ and $D_2$.

### §1.3 The articulation lattice (C1)

The **articulation lattice** is the named triple:

$$\mathsf{Art}(B) := \bigl(\mathsf{Inc}(B),\; \leq_\subseteq,\; \vee_{\perp\perp}\bigr)$$

**Current status of C1** (from the consolidated claims register, Session 0h):

> *Confirmed-with-caveat.* Primary sources: Fouqueré–Quatrini 2013 LMCS 9(4:6);
> Doumane 2017 CSL.
>
> **Caveat:** The inclusion-poset on $\mathsf{Inc}(B)$ and the $\perp\perp$-closure
> operation are each standard in the Ludics literature. The **named triple as a
> join-semilattice** is specific to this substrate; no source states it directly
> for the restriction to **finitely-generated behaviour-closed designs** relevant
> to Isonomia's deliberation setting. The proof in the literature covers the full
> coherence-space setting; whether the restriction to finitely-generated designs
> introduces any edge cases is not stated in any source.

### §1.4 Isonomia's finitely-generated constraint

Isonomia operates on finite deliberations. In practice:

- $\Lambda$ is a finite set of loci (one per argumentative move in the deliberation
  graph, bounded by the argument count)
- Each design $D \in B$ has **bounded arity** (sub-trees are finite; the daimon
  appears only at leaves)
- $\mathsf{Inc}(B)$ is finite (finitely many minimal elements under a finite locus
  set)

This is the "finitely-generated behaviour-closed" restriction. The proof target
is whether JSL axioms hold **under this finite restriction**, not just in the
infinite coherence-space setting.

---

## §2. The OQ-JSL proof obligation (from §5.2 of LUDICS_SESSION_2_DEV_SPEC.md)

The claim to resolve is:

> **OQ-JSL target.** For any behaviour $B$ in the Ludics substrate (under the
> finitely-generated restriction), and any two designs $D_1, D_2 \in
> \mathsf{Inc}(B)$:
>
> $$D_1 \vee_{\perp\perp} D_2 = (D_1 \cup D_2)^{\perp\perp} \in \mathsf{Inc}(B)$$
>
> and this join is the **least upper bound** of $D_1$ and $D_2$ under
> $\leq_\subseteq$.

This requires proving — or finding a counterexample to — both:

**Obligation 1 (Closure under the join).** $(D_1 \cup D_2)^{\perp\perp}$ is
always a design in $\mathsf{Inc}(B)$ — i.e., biorthogonal closure of a union of
designs in $\mathsf{Inc}(B)$ stays minimal in $B$.

**Obligation 2 (Minimality / LUB property).** No design $D' \in \mathsf{Inc}(B)$
with $D_1 \leq_\subseteq D' \leq_\subseteq D_1 \vee_{\perp\perp} D_2$ exists
that is strictly smaller than $D_1 \vee_{\perp\perp} D_2$ — i.e., the
biorthogonal closure of the union is the *least* common extension, not merely
*an* upper bound.

Note: Obligation 1 is the harder claim. Biorthogonal closure preserves
membership in $B$ trivially ($B^{\perp\perp} = B$, so $(D_1 \cup D_2)^{\perp\perp}
\subseteq B$). The non-trivial question is whether it lands in the **minimal**
layer $\mathsf{Inc}(B)$ or somewhere strictly above it.

---

## §3. What is already established (do not re-prove these)

From Sessions 0f and 0g (Triads-Closure-Compatibility and Confidence-Erasure-Functor):

- **(CQ1–CQ2 from 0g §I)** In the Ludics-induced Triad $\mathfrak{T}_L$,
  the Triads saturation $\sigma_T$ and orthogonal complement $\perp_T$ coincide
  definitionally with the standard Ludics $\sigma$ and $\perp$. These are
  not open questions.

- **(Standard facts from Fouqueré–Quatrini 2013 and Girard 2001)**
  - $B$ is biorthogonally closed: $B^{\perp\perp} = B$
  - $(D_1 \cup D_2)^{\perp\perp}$ is a well-defined element of $B$ (union of
    two designs in $B$ has a $\perp\perp$-closure in $B$)
  - The poset $(\mathsf{Inc}(B), \leq_\subseteq)$ is well-defined (minimal
    elements of a closed set form a poset under inclusion)

- **(From Session 0f §II)** The composition of designs in $\mathsf{Inc}(B)$
  is $\vee_{\perp\perp}$-compatible. This is the claim that supports
  `compute_articulation_join`'s well-definedness in the Phase 2c implementation.

What is **not** established is whether (a) the join lands in $\mathsf{Inc}(B)$
specifically (not just in $B$), and (b) it is the LUB (not just any upper bound).

---

## §4. Inline reference: the composition algebra context (from Session 0d)

The following is the relevant excerpt from `LUDICS_OPEN_COMPOSITION_JOINT.md`,
Session 0d §0d.2 "The articulation lattice":

> *The Ambler identity pays off here. Sub-deliberation closure produces a
> vertical composition of Ambler arrows: the child's articulations compose
> with the parent's. [...] The articulation lattice of the composite is built
> by **convolving** the two component lattices through the shared interface, a
> construction that is well-defined precisely because both sides are
> join-semilattices of derivations.*

This passage **assumes** the JSL property to conclude that the convolution is
well-defined. Phase 2e's job is to provide the proof that licenses this
assumption — specifically in the finitely-generated setting.

---

## §5. Inline reference: the open question as originally stated (from Session 0h)

From `LUDICS_CONSOLIDATION_AND_DEV_READINESS.md` §III.2, the OQ-JSL entry in the
open-question register:

| # | Question | Source | Priority for dev |
|---|---|---|---|
| **OQ-JSL** | Does $(\mathsf{Inc}(B), \leq_\subseteq, \vee_{\perp\perp})$ satisfy quantale / full-semilattice axioms beyond assoc. + bottom? | R2 OQ2 | Medium (affects formal correctness of `compute_articulation_join`) |

The "beyond assoc. + bottom" phrasing means: the literature establishes
associativity (via the standard $\perp\perp$-closure properties) and the existence
of a bottom element ($\bot_B = |B|$, the maximal design in $\mathsf{Inc}(B)$
under the *downward* order, or equivalently the smallest design in $B$ under
$\leq_\subseteq$). The open question is whether the *full semilattice* structure
holds — including the LUB characterization in Obligation 2 above.

From `LUDICS_CONSOLIDATION_AND_DEV_READINESS.md` §III.1 (Tier 3 — deferred):

> *OQ2 (full semilattice structure on $\mathsf{Inc}(B)$ under $\vee_{\perp\perp}$):
> Affects whether the join satisfies quantale-style conditions beyond
> associativity + bottom; currently a working assumption.*
> *Path to resolution: Formal verification against Basaldella 2015 Def. 2.x*

---

## §6. Reference materials

Work through the following sources **in order**. Each is listed with the specific
question it bears on.

1. **Girard 2001 — "Locus Solum"** (*Mathematical Structures in Computer Science*
   11(3)):
   - §2: Design syntax (forests of justified sequences, focalization, daimon)
   - §4: Interaction norm; the definition of $\perp$
   - §5: Biorthogonal closure; $B^{\perp\perp} = B$
   - Key question: Does Girard prove that $(D_1 \cup D_2)^{\perp\perp}$ is in
     $\mathsf{Inc}(B)$ when $D_1, D_2 \in \mathsf{Inc}(B)$? If yes, what
     conditions on $B$ does it require?

2. **Fouqueré–Quatrini 2013 — "Structures for proof-nets, structures for ludics"**
   (*LMCS* 9(4:6)):
   - The incarnation set and inclusion poset
   - Whether the poset is a join-semilattice (check the exact theorem statement)

3. **Doumane 2017 — PhD thesis / CSL paper on ludics and proof nets**:
   - Any treatment of the join structure on $\mathsf{Inc}(B)$

4. **Basaldella 2015 — "A triadic analysis of knowledge"** (arXiv:1502.04773):
   - Definition 2.x: semilattice properties invoked in the Triads setting
   - Specifically: does Basaldella prove or assume that the join on incarnations
     is a LUB?

5. **Melliès 2009 — "Categorical Semantics of Linear Logic"** §4
   (Behaviour spaces and closure operators):
   - Whether the biorthogonal closure join on minimal elements of a behaviour
     is the LUB in the inclusion order

---

## §7. Proof strategy

**Step 1: Verify the extensivity claim in §0.2.**

The argument hinges on $D_1 \cup D_2 \subseteq (D_1 \cup D_2)^{\perp\perp}$.
The general closure-operator identity $S \subseteq S^{\perp\perp}$ requires $S$
to be a set of *designs* in $P$ (positive side). Check whether $D_1 \cup D_2$
(union of chronicle sets of two designs at the same locus) is a valid element of
$P$. If the design axioms (consistency, focalization, daimon-termination) are
violated by the union, then the $\perp\perp$-closure is not directly applicable
and the §0.2 argument requires modification.

*If the union is not a valid design:* Does the argument survive? The
$\perp\perp$-closure can still be applied to any set $S \subseteq P$ (not just
valid designs) as $S^{\perp\perp} = (S^\perp)^\perp$ where $S^\perp = \{n \in N
: \forall p \in S, p \perp n\}$. Whether this produces a design (valid element of
$P$) or a "super-design" (biorthogonally closed set of chronicles that is not
itself a single tree-structured design) matters for whether $(D_1 \cup
D_2)^{\perp\perp}$ can even be compared to $D_1$ as a sub-design.

**Step 2: Search Fouqueré–Quatrini 2013 for the exact JSL theorem statement.**

The pre-analysis predicts that the literature's JSL result is for $(B,
\leq_\subseteq, \vee_{\perp\perp})$, not $(\mathsf{Inc}(B), \leq_\subseteq,
\vee_{\perp\perp})$. Locate the exact theorem in §4 or §5 of that paper. If the
theorem states the JSL property for the full behaviour $B$, then C1 in the
substrate is a mis-attribution and should be corrected to: *"$(B, \leq_\subseteq,
\vee_{\perp\perp})$ is a join-semilattice (fully confirmed); $\mathsf{Inc}(B)$ is
the antichain of generators of $B$, not itself a JSL under $\vee_{\perp\perp}$."*

**Step 3: Determine the correct operation on Inc(B).**

Given that $\mathsf{Inc}(B)$ is an antichain (§0.3), there can be no
$\leq_\subseteq$-upper-bounds of distinct pairs within $\mathsf{Inc}(B)$. But
there may be a well-defined *lattice completion* or *canonical representative*
operation:

- For $D_1, D_2 \in \mathsf{Inc}(B)$, the join $(D_1 \cup D_2)^{\perp\perp}$
  lands in $B$. Its incarnations are $\mathsf{Inc}((D_1 \cup
  D_2)^{\perp\perp}) \cap B = $ the minimal elements of $B$ that are
  $\leq_\subseteq (D_1 \cup D_2)^{\perp\perp}$.
- Is this set always a singleton? If so, it defines a canonical join
  $D_1 \tilde\vee D_2 \in \mathsf{Inc}(B)$ — the *unique incarnation* of the
  biorthogonal join. `compute_articulation_join` may be computing this.
- If the set is always a singleton, then $(\mathsf{Inc}(B), \tilde\vee)$ *is*
  a join-semilattice — but the join is the minimal element below the
  $\vee_{\perp\perp}$ join, not the $\vee_{\perp\perp}$ join itself.

**Step 4: Write the verdict.**

One of three outcomes (see §8).

---

## §8. Branching outcomes

### Outcome A: §0.2 argument is flawed (proof succeeds)

If the extensivity argument fails because $D_1 \cup D_2$ is not a valid design
and the $\perp\perp$-closure of a non-design set does not produce an element
that $D_1$ can be compared to, then the §0.2 witness collapses. In this case,
prove Obligations 1 and 2 fully.

**If Outcome A:** Update `LUDICS_CONSOLIDATION_AND_DEV_READINESS.md`:
- C1 row: change `Confirmed-with-caveat` → `Tier 1 fully confirmed`
- OQ-JSL row: add resolution "Resolved in `LUDICS_OQ_JSL_PROOF.md` — JSL
  axioms hold under finite generation."

No code changes. `compute_articulation_join` is correct as implemented.

### Outcome B: C1 is mis-attributed (JSL is for B, not Inc(B))

The structural argument in §0.2 is correct, but the literature *does* confirm a
JSL — just for $(B, \leq_\subseteq, \vee_{\perp\perp})$, not
$(\mathsf{Inc}(B), \leq_\subseteq, \vee_{\perp\perp})$. The substrate mis-frames
C1 by attributing the JSL structure to $\mathsf{Inc}(B)$ rather than $B$.

**If Outcome B:** In `LUDICS_CONSOLIDATION_AND_DEV_READINESS.md`:
- C1 row: update to `Corrected — JSL structure is on $(B, \leq_\subseteq,
  \vee_{\perp\perp})$, not on $\mathsf{Inc}(B)$; see
  LUDICS_OQ_JSL_PROOF.md §correction`

In `server/ludics/articulationLattice.ts`, add a doc-comment clarifying that
`compute_articulation_join` returns an element of $B$ (the behaviour), not
an element of $\mathsf{Inc}(B)$ (the minimal layer). The `joinIsMinimal` field
(see Outcome C) should be added to surface this.

### Outcome C: C1 is simply wrong for Inc(B) (full counterexample)

The §0.2 argument holds and the literature does not provide an alternative JSL
framing for $\mathsf{Inc}(B)$. The join $\vee_{\perp\perp}$ exits $\mathsf{Inc}(B)$
for every pair of distinct inputs.

**If Outcome C:** In `LUDICS_CONSOLIDATION_AND_DEV_READINESS.md`:
- C1 row: update to `Counterexample found — $(D_1 \cup D_2)^{\perp\perp}
  \notin \mathsf{Inc}(B)$ for all distinct $D_1, D_2 \in \mathsf{Inc}(B)$;
  see LUDICS_OQ_JSL_PROOF.md`
- OQ-JSL row: close as "Resolved — negative"

In `server/ludics/articulationLattice.ts`, add to `ComputeArticulationJoinResult`:

```typescript
/**
 * Phase 2e: true iff the returned design is in Inc(B) (the minimal layer).
 * False when the join is in B \ Inc(B) — i.e., it is an upper bound of D1
 * and D2 under ≤⊆ but has proper sub-designs in B.
 * The LUB property (Obligation 2) still holds in B regardless of this flag.
 */
joinIsMinimal: boolean;
```

Surface the `incomparable` flag (currently only on `compress_articulation`)
alongside `compute_articulation_join` output in `packages/isonomia-mcp/src/server.ts`.

**Note: Outcomes B and C have similar code consequences.** Both require the
`joinIsMinimal` field and the doc-comment correction. The primary difference is
whether the literature is being mis-attributed (B) or the claim was simply false
for $\mathsf{Inc}(B)$ (C). The proof document should determine which.

---

## §9. Output format for LUDICS_OQ_JSL_PROOF.md

The proof document should follow this structure:

```markdown
# OQ-JSL Formal Proof — Articulation Lattice Join-Semilattice Axioms

**Session:** Phase 2e (Formal Proof)
**Date:** [date]
**Track:** Conceptual / proof
**Verdict:** [OUTCOME A: CONFIRMED | OUTCOME B: MIS-ATTRIBUTED | OUTCOME C: COUNTEREXAMPLE FOUND]

## 1. Claim under examination

[State OQ-JSL precisely, including which object (Inc(B) or B) the JSL is claimed for]

## 2. Definitions and setup

[Inc(B), ∨⊥⊥, ≤⊆, finitely-generated constraint — brief, self-contained]

## 3. Pre-analysis status

[Confirm or refute §0.2. State which of the extensivity-claim checks passed/failed]

## 4. Literature framing

[Exact theorem location in Fouqueré–Quatrini 2013; state whether the JSL result
is for B or Inc(B)]

## 5. Proof [or: Counterexample / Correction]

[Main body — structured by Obligation 1 and Obligation 2, or by the correction
argument if Outcome B]

## 6. Verdict and downstream implications

[Which of §8 Outcomes A/B/C applies; list exact edits that follow]

## 7. Open questions not resolved by this session

[Anything the proof leaves open — e.g. whether there is a well-defined
"incarnation join" when the singleton condition in §7 Step 3 holds]
```

---

## §10. What this session does NOT produce

- No code. Implementation-side changes (if any) happen in the main
  implementation thread after this session's verdict is returned.
- No changes to the Session 2 dev spec. The spec is complete.
- No new conceptual constructs. The sole output is a formal verdict on OQ-JSL.
