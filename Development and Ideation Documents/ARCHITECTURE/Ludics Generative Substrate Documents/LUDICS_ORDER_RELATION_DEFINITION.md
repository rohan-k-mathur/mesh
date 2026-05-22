# The Order Relation Between Designs in a Behaviour

**Session:** Phase 2f pre-OQ-JSL  
**Date:** May 21, 2026  
**Track:** Definitional / literature-extraction  
**Verdict:** Reading (A) — literal chronicle-set inclusion

---

## 1. The question

Phase 2e and the Phase 2f OQ-JSL-Type/Cone prompt both use a relation
$\leq_\subseteq$ between designs in a behaviour $B$. Two readings are
possible: (A) literal set inclusion $D_1 \subseteq D_2$ of chronicle sets,
or (B) an extension/daimon-replacement order where $D_2$ is obtained from
$D_1$ by replacing daimons with computation. These give incompatible cone
structures. Pre-analysis identified a counterexample under Reading (B) —
two same-cone designs with different positive choices past a shared
incarnation's daimon, whose chronicle-set union violates focalization. The
counterexample dissolves under Reading (A). This session pins down which
reading Fouqueré–Quatrini 2013 actually uses.

---

## 2. What F-Q 2013 §2 actually says

### 2.1 Definition of a design

F-Q 2013, Definition 2.9:

> A **design** $D$, based on $\Gamma \vdash \Delta$, is a set of chronicles
> based on $\Gamma \vdash \Delta$, such that the following conditions are
> satisfied:
>
> - **Forest:** The set of chronicles is prefix closed.
> - **Coherence:** The set is a clique of chronicles with respect to $\ddot{c}$.
> - **Positivity:** A chronicle without extension in $D$ ends with a positive action.
> - **Totality:** $D$ is non-empty when the base is positive; in that case all chronicles begin with a (unique) positive action.

Designs are literally **sets of chronicles**. Set-theoretic operations ($\subseteq$, $\cup$, $\cap$) apply directly.

### 2.2 The role of the daimon

F-Q 2013, Definition 2.5:

> An action $\kappa$ is either a positive proper action $(+, \xi, I)$, or a
> negative proper action $(-,\xi,I)$, **or the positive action daimon**
> denoted by $\mathfrak{z}$.

Daimon is a **positive action**. By Definition 2.6 (Chronicle): "If present,
a daimon ends the chronicle." So a daimon-terminated chronicle is of the form
$w\mathfrak{z}$ where $w$ is a (possibly empty) alternating sequence of proper
actions.

### 2.3 The coherence constraint that locks daimon structure

F-Q 2013, Definition 2.7 (Coherence on Chronicles), Comparability condition:

> Either one extends the other or they first differ on negative actions,
> i.e., if $w\kappa_1 \;\ddot{c}\; w\kappa_2$ then either $\kappa_1 = \kappa_2$
> or $\kappa_1$ and $\kappa_2$ are negative actions.

**This is the load-bearing constraint.** Consider two chronicles in the same
design:

- $c_1 = w\mathfrak{z}$ (ending in daimon at a node after prefix $w$)
- $c_2 = w\kappa^+\ldots$ (continuing past the same node with a proper positive
  action $\kappa^+$)

They share prefix $w$ and then differ: $c_1$ has $\mathfrak{z}$ (positive),
$c_2$ has $\kappa^+$ (positive). They first differ on **positive** actions.
Comparability requires either $\kappa_1 = \kappa_2$ or both are negative.
Neither holds. So $c_1$ and $c_2$ are **incoherent** and cannot coexist in
the same design.

**Consequence:** A design cannot contain both a daimon-terminated chronicle
at a node and a chronicle extending past that node. The daimon structure of a
design is completely determined by its chronicle set — it is not a "decoration"
that can be freely added or removed.

### 2.4 Definition of incarnation $|D|_B$

F-Q 2013, §1.3:

> The incarnation $|D|_E$ of a design $D$ [is] defined as the smallest design
> **included in** $D$ and belonging to $E$.

"Included in" = $\subseteq$ on sets of chronicles. Since designs are sets
of chronicles, this is literal set inclusion.

### 2.5 The order relation between $|D|_B$ and $D$

By definition: $|D|_B \subseteq D$ (as sets of chronicles) and $|D|_B \in B$.

From §2.3 above: if $|D|_B$ contains a daimon chronicle $w\mathfrak{z}$,
then $w\mathfrak{z} \in D$ (by $\subseteq$). By coherence, $D$ cannot also
contain any chronicle $w\kappa^+\ldots$ extending past that node. Therefore:

> **$D$ has daimon at exactly the same positive nodes as $|D|_B$.**

The only way $D$ can be strictly larger than $|D|_B$ as a chronicle set is
by having more **negative branches** — i.e., more additive slices at negative
nodes.

This also respects the design axioms: removing negative slices from $D$ gives
a smaller prefix-closed, coherent set that still satisfies Positivity (the
remaining maximal chronicles still end positively, since removing a negative
slice doesn't leave behind a chronicle ending in a negative action without
extension — the chronicle at the negative branching point already has other
extensions through the remaining slices, or terminates earlier with a positive
action).

### 2.6 Walked through the $B^\perp = \{ n_\dagger \}$ example

Let $B$ be the behaviour at positive base $\xi$ with $B^\perp = \{ n_\dagger \}$
(the counter-design that immediately plays daimon). Then $B = B^{\perp\perp}$
contains all designs $D$ at $\xi$ such that $D \perp n_\dagger$.

$\mathrm{Dai}^+ = \{ \mathfrak{z} \}$ (the single-chronicle design consisting
only of daimon at the root) is the incarnation of every design in $B$ —
it is the smallest design in $B$ under $\subseteq$.

Now consider $D_1$ with initial positive action $(+, \xi, \{1\})$ (focus $\xi$,
ramification $\{1\}$). $D_1$'s chronicles include $(+, \xi, \{1\})$ and possibly
extensions. Is $\mathrm{Dai}^+ \subseteq D_1$? That requires $\mathfrak{z} \in D_1$.
But $D_1$ starts with $(+, \xi, \{1\})$, and by Totality all chronicles at a
positive base begin with a unique positive action. $D_1$'s chronicles all begin
with $(+, \xi, \{1\})$. The chronicle $\mathfrak{z}$ begins with daimon —
a different positive action. By coherence (Comparability), $\mathfrak{z}$ and
$(+, \xi, \{1\})\ldots$ first differ on positive actions at the root. They are
incoherent. So $\mathfrak{z} \notin D_1$, hence $\mathrm{Dai}^+ \not\subseteq D_1$.

**Therefore $D_1$ is not in the cone of $\mathrm{Dai}^+$ under $\subseteq$.**

The cone of $\mathrm{Dai}^+$ under $\subseteq$ is $\{ \mathrm{Dai}^+ \}$ itself —
a trivial singleton. The "counterexample" from the pre-analysis assumed
$\mathrm{Dai}^+ \subseteq D_1$ because it conflated $\subseteq$ (chronicle-set
inclusion) with the extension order (daimon-replacement). Under the extension
order, $\mathrm{Dai}^+$ is "less defined" than $D_1$ ($D_1$ replaces the daimon
with actual computation). But under $\subseteq$, they are **incomparable**.

The cones in this behaviour, under $\subseteq$, are indexed by the initial
positive action: all designs starting with $(+, \xi, I)$ for a fixed $I$ form
one family, and $\mathrm{Dai}^+$ is an isolated point. Different initial
actions give incomparable designs (their root chronicles are incoherent,
so neither set includes the other). Within each family, designs agree on
the root action and can differ in negative branches below it.

---

## 3. Cross-check

### 3.1 Girard 2001 (Locus Solum)

Girard's original definitions in Locus Solum §2 are consistent with F-Q's
presentation. Designs are "desseins" — sets of chronicles satisfying forest
(prefix closure), coherence, positivity, and totality conditions. The daimon
is a positive action. The coherence condition enforces the same constraint:
chronicles first differ on negative actions only.

Girard defines incarnation in §12 ("Material Designs") using the same notion:
the incarnation $|D|_\mathbf{G}$ of a design $D$ in a behaviour $\mathbf{G}$
is the smallest sub-design of $D$ (under inclusion) belonging to $\mathbf{G}$.
The "inclusion" is set inclusion of chronicle sets, matching F-Q.

Girard also defines a separate notion — the **approximation order** on designs
— which corresponds to Reading (B) (daimon-replacement / information order).
This is the order where $D_1 \sqsubseteq D_2$ means $D_2$ is obtained from
$D_1$ by replacing daimons with computation. This order is used for
domain-theoretic considerations (e.g., continuity of the interaction norm)
but is **not the same as** the inclusion order used for incarnation.

### 3.2 Key distinction: two different orders

There are **two legitimate partial orders on designs** in Ludics:

1. **Chronicle-set inclusion** ($\subseteq$): $D_1 \subseteq D_2$ iff every
   chronicle of $D_1$ is a chronicle of $D_2$. Designs grow by adding
   negative branches. Daimon structure is fixed.

2. **Approximation / extension order** ($\sqsubseteq$): $D_1 \sqsubseteq D_2$
   iff $D_2$ is obtained from $D_1$ by replacing daimons with computation
   (and possibly adding negative branches). Designs grow by becoming "more
   defined." Daimon points in $D_1$ can be replaced by proper computation
   in $D_2$.

These orders are **genuinely different**. They agree when designs differ only
in negative branching (both say the one with more branches is larger). They
disagree when daimon-replacement is involved: under $\subseteq$, a design
with daimon at $\sigma$ and a design extending past $\sigma$ are
**incomparable**; under $\sqsubseteq$, the latter is strictly larger.

**F-Q's incarnation uses $\subseteq$, not $\sqsubseteq$.**

### 3.3 Doumane / Pavaux

Pavaux 2017 (CSL, "Inductive and Functional Types in Ludics") works within
the same definitional framework. The fixed-point constructions on behaviours
use the approximation order $\sqsubseteq$ on designs for domain-theoretic
directed-limit arguments — but incarnation is still defined via set inclusion,
matching F-Q and Girard.

---

## 4. Verdict

**Reading (A): literal chronicle-set inclusion $\subseteq$.**

The order relation used for incarnation in F-Q 2013 (and in Girard 2001)
is set inclusion on chronicle sets. The key structural fact is:

> **Daimon Lock Lemma.** If $D' \subseteq D$ as designs (sets of chronicles),
> then $D$ has daimon at every positive node where $D'$ has daimon. Equivalently,
> $D$ and $D'$ share the same daimon structure; $D$ can only be larger by having
> more negative branches (additive slices).

*Proof.* If $D'$ has daimon at node $\sigma$ (i.e., $w\mathfrak{z} \in D'$ for
some prefix $w$), then $w\mathfrak{z} \in D$ (by $\subseteq$). If $D$ also had
a chronicle $w\kappa^+\ldots$ with $\kappa^+ \neq \mathfrak{z}$, then
$w\mathfrak{z}$ and $w\kappa^+\ldots$ would first differ on positive actions,
violating the coherence comparability condition. So $D$ has no such chronicle.
$\square$

The extension/approximation order $\sqsubseteq$ is a separate relation used
for domain-theoretic purposes (directed limits, continuity). Phase 2e and
Phase 2f should use $\subseteq$ exclusively, matching the incarnation
definition.

---

## 5. Implications for Phase 2e

Phase 2e's proofs survive and are correct as stated.

**Antichain theorem.** $\mathrm{Inc}(B)$ is an antichain under $\subseteq$.
This holds: if $D_i, D_j \in \mathrm{Inc}(B)$ with $D_i \subseteq D_j$, then
$D_i$ is a design in $B$ included in $D_j$, so $|D_j|_B \subseteq D_i
\subseteq D_j$. By minimality of $|D_j|_B = D_j$, we get $D_i = D_j$.

**Cross-Cone Incompatibility.** Designs in different cones have no common
upper bound under $\subseteq$. This holds by the Daimon Lock Lemma: designs
sharing an upper bound must share daimon structure, hence share positive
choices; designs in different cones differ in positive choices (by the
antichain property of incarnations), so they cannot share an upper bound.

---

## 6. Implications for Phase 2f OQ-JSL-Cone

**The original prompt's expected Outcome I is correct.** The Phase 2f
OQ-JSL-Type/Cone session can proceed as originally written.

Under $\subseteq$:

- **Same-cone designs share all positive choices and daimon structure.**
  They differ only in negative branching (which opponent moves they handle).
  This is immediate from the Daimon Lock Lemma: $D_i \subseteq D_1$ and
  $D_i \subseteq D_2$ forces $D_1, D_2$ to have the same positive/daimon
  skeleton as $D_i$, with additional negative branches.

- **Chronicle-set union within a cone preserves design axioms.** $D_1 \cup D_2$
  agrees with $D_1$ (and $D_2$, and $D_i$) on all positive actions and
  daimons. The union only adds negative branches. Prefix closure, coherence
  (first-differ-on-negative is preserved since positive structure is shared),
  and positivity all hold.

- **The per-cone JSL claim is well-formed.** $(C_i, \subseteq, \cup)$ is a
  join-semilattice with bottom $D_i$ and join = literal chronicle-set union.

No salvage path is needed.

**Cones are "thin" in the following precise sense:** the cone $C_i$ consists
of designs that extend $D_i$ only by adding negative branches (more additive
slices at negative nodes). Designs that extend past $D_i$'s daimon points
are **not in $C_i$** — they are incomparable with $D_i$ under $\subseteq$
and belong to different cones (or to no cone if they are not minimal under
any incarnation).

---

## 7. Open follow-ups

1. **OQ-JSL-Type/Cone session proceeds as planned.** The original Phase 2f
   prompt (`PHASE_2F_OQ_JSL_TYPE_AND_CONE_PROMPT.md`) is correct under
   Reading (A). The session should verify the three checks (same-cone union
   preserves design axioms, cross-cone union fails, norm monotonicity) and
   produce the corrected C1 statement. Expected outcome: Outcome I.

2. **Thin cones and C3.** The per-cone identification with Ambler hom-sets
   requires cones to contain "enough" designs. Under Reading (A), cones grow
   only by adding negative branches — they do not include designs that
   extend past incarnation daimons. This may make cones too thin for the
   categorical story. **Flag for OQ-C3:** verify that the negative-branching
   degrees of freedom in a cone suffice to populate the Ambler hom-set, or
   determine whether the C3 identification needs to be restated in terms of
   the approximation order $\sqsubseteq$ rather than $\subseteq$.

3. **Terminology.** Subsequent documents should use $\subseteq$ (not
   $\leq_\subseteq$) for the chronicle-set inclusion order, and $\sqsubseteq$
   for the approximation/extension order when it arises. This avoids the
   ambiguity that generated this session.

4. **The approximation order $\sqsubseteq$ is not abandoned.** It remains
   relevant for domain-theoretic arguments (directed limits in fixed-point
   constructions, continuity of the interaction norm). But it is not the
   order that defines incarnation or cones. If future sessions need
   $\sqsubseteq$-based reasoning (e.g., for Pavaux-style inductive types),
   they should be explicit about which order is in play.
