# The Triads Closure-Compatibility Check and the Confidence-Erasure-Functor

> **Post-review status (CORRECTED post-2e/2f, 2026-05-21).** This Session 0g doc already records (in its Part II and the 0g-OQ1 statement) the two-level precision for C3 — poset identification as the working claim, JSL isomorphism via surjective counit as a conjecture. Phase 2e *closed* the global-JSL conjecture **negatively** at the $\mathsf{Inc}(B)$ level: $\mathsf{Inc}(B)$ is an antichain; the only JSL structure that survives lives per cone $(C_i, \leq_\subseteq, \vee)$ with $\vee$ = literal chronicle-set union (Phase 2f Reading A). The Confidence-Erasure-Functor and the $V = \mathsf{JSL}$ enrichment of $\mathcal{C}_\mathrm{semi}$ are unaffected as categorical machinery (those are about the *target* category $\mathsf{JSL}$, not about $\mathsf{Inc}(B)$ being one of its objects); what changes is that the Ambler hom-set identification of §C3 must be applied **per cone**. See [LUDICS_OQ_JSL_PROOF.md](./LUDICS_OQ_JSL_PROOF.md), the **OQ-JSL** (closed) and **OQ-JSL-Ambler** (open) rows in [LUDICS_CONSOLIDATION_AND_DEV_READINESS.md](./LUDICS_CONSOLIDATION_AND_DEV_READINESS.md), and [LUDICS_ORDER_RELATION_DEFINITION.md](./LUDICS_ORDER_RELATION_DEFINITION.md).

**Session:** 0g (Conceptual)
**Date:** 2026-05-18
**Track:** Conceptual / pre-product
**Scope:** Two remaining technical items flagged in Session 0f (§I.4 and §III.2):
(a) the *Triads-internal closure-compatibility check* — whether
$\sigma(\hat{D}_P)^{\perp}$ in the Triads sense coincides with
$\sigma(D_P)^{\perp}$ in standard Ludics, and whether carrier-set extension of
$N$ corresponds to delocation; (b) the formal writeup of the
*Confidence-Erasure-Functor* $U: \mathcal{C}_\mathrm{semi} \to
\mathcal{C}_\mathrm{plain}$ — the functor that discards Dempster–Shafer
confidence weights from the Ambler semilattice-enriched CCC to produce the
Ludics-style plain CCC needed for the C3 identification.
**Carries:** T3′ (anonymous polarity), T4 (dialectical/witnessing separation),
T5 (MCP/AI-consumer shape). C3's honest post-0f restatement is the main
load-bearing claim both closures serve.
**Companions:**
[LUDICS_GENERATIVE_SUBSTRATE.md](./LUDICS_GENERATIVE_SUBSTRATE.md) ·
[LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md](./LUDICS_TRIADS_BRIDGE_AND_CLOSURE_JOIN.md) ·
[LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md](./LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md) ·
[LUDICS_OPEN_COMPOSITION_JOINT.md](./LUDICS_OPEN_COMPOSITION_JOINT.md) ·
[LITERATURE_REVIEW_ROUND_2.md](./LITERATURE_REVIEW_ROUND_2.md)

> **Terminological continuity.** Notation from 0f is preserved throughout:
> $(P, N, \perp)$ for a Triad; $\hat{D}_P \subseteq P$ for the image of design
> $D_P$; $\sigma$ for Ludics-protocol saturation; $\mathsf{Inc}(B)$ for the
> incarnation-set of behaviour $B$; $\vee_{\perp\perp}$ for the bi-orthogonal
> closure join; $\mathcal{C}_\mathrm{semi}$ for the Ambler
> semilattice-enriched CCC; $\mathcal{C}_\mathrm{plain}$ for the Ludics-style
> plain CCC; $\mathsf{JSL}$ for the category of join-semilattices.

---

## 0. Frame and stakes

Session 0f left two items open.

The first (0f §I.4, the *Triads check*) is the closure-compatibility question:
Reading C's architecture makes sense *structurally* as a Triads instance, but no
one checked whether the saturation operation $\sigma$ and the orthogonality
$\perp$ from standard Ludics lift to the abstract Triads structure in a way that
makes the two descriptions equivalent. If they do not, Reading C is a
Triads-*shaped* object but not a genuine Triads *instance*, and the positive
characterization from 0f §I.3 is weaker than it appears.

The second (0f §III.2, the *Confidence-Erasure-Functor*) is the gap between the
Ambler category and the Ludics category: the C3 structural identification holds
only *after* confidence is erased, and the mechanism for that erasure was
sketched but not written down. Round 2 (N-C22) confirmed that the categorical
machinery is standard enriched-category forgetfulness (Kelly 1982, TAC reprint
10, §1.2); the 0g task is to instantiate that machinery specifically for the
$\mathcal{C}_\mathrm{semi} \to \mathcal{C}_\mathrm{plain}$ transition and read
off what the (F ⊣ U) adjunction's counit says about the honest C3 claim.

Both closures together complete the technical groundwork for C3. After 0g, C3
can be stated with honest precision: as a structural identification that holds at
the level of underlying plain categories, up to confidence erasure, with a
specific conjectural strengthening (the counit $\varepsilon$ is surjective) that
would lift it to a join-semilattice isomorphism.

---

## Part I — The Triads-internal closure-compatibility check

### I.1 Recalling the question

0f §I.4 posed:

> "Is $\sigma(\hat{D}_P)^{\perp}$ in the Triads sense the same set as
> $\sigma(D_P)^{\perp}$ in the standard Ludics sense? Equivalently: does the
> carrier-set extension of $N$ behave the same way as delocation in Girard's
> setting?"

The question splits into three sub-questions:

- **(CQ1)** Does the Triads saturation $\sigma_T$ on $P$ specialize to the
  Ludics-native saturation $\sigma$ when the Triad is the Ludics-induced one?
- **(CQ2)** Does the Triads orthogonal complement $X^{\perp_T}$ on $N$
  specialize to the Ludics orthogonal complement $X^{\perp}$ when the Triad is
  the Ludics-induced one?
- **(CQ3)** Does growing the carrier set of $N$ — which the 0c directed system
  forces as new loci are added — correspond precisely to extending $N$ by
  delocation in the standard Ludics sense?

### I.2 The Ludics-induced Triad

Fix a deliberation with locus set $\Lambda = \{\xi_1, \xi_2, \ldots\}$. The
**Ludics-induced Triad** is:

$$
\mathfrak{T}_L \;=\; (P_L,\; N_L,\; \perp_L)
$$

where:

- $P_L$ = all designs at positive loci in $\Lambda$ (forests of justified
  sequences with focalization + daimon as ultra-positive end-marker, Girard
  2001 §2)
- $N_L$ = all designs at negative loci in $\Lambda^* = \{\xi^* : \xi \in
  \Lambda\}$ (co-designs / counterdesigns)
- $p \perp_L n$ iff the Ludics interaction $\langle p \mid n \rangle$
  normalizes to the daimon $\mathsf{\dag}$ — i.e., the interaction norm
  (Girard 2001 §4) terminates in the winning token

This is the Basaldella 2015 (arXiv:1502.04773) Definition 1.1 instantiation for
the standard Ludics protocol: $\mathcal{P}_A = P_L$, $\mathcal{N}_A = N_L$,
$\bot_A = \perp_L$.

For a design $D_P \in P_L$ at positive locus $\xi$, its image $\hat{D}_P
\subseteq P_L$ is the design $D_P$ itself (the inclusion $P_L \hookrightarrow
P_L$ is the identity). The question reduces to: do Triads-native operations,
when instantiated in $\mathfrak{T}_L$, equal their Ludics-native counterparts?

### I.3 CQ1 — Saturation compatibility

In standard Ludics, $\sigma(D_P)$ is the $\perp\perp$-closure of $D_P$:
$$
\sigma(D_P) \;:=\; D_P^{\perp\perp} \;=\; \{p \in P_L : \forall n \in D_P^{\perp_L},\; p \perp_L n\}.
$$
(Girard 2001 §5; Basaldella 2015 Remark after Definition 2.3.)

In $\mathfrak{T}_L$, the Triads saturation is defined by the same formula with
$\perp_T$ in place of $\perp$:
$$
\sigma_T(D_P) \;:=\; D_P^{\perp_T\perp_T}.
$$

**Claim (CQ1).** In $\mathfrak{T}_L$, $\sigma_T(D_P) = \sigma(D_P)$.

*Argument.* Since $\perp_T$ instantiates to $\perp_L$ in $\mathfrak{T}_L$ by
construction, the formulae $D_P^{\perp\perp}$ and $D_P^{\perp_T\perp_T}$ are
identical. The claim is definitional once the instantiation is explicit. □

### I.4 CQ2 — Orthogonal complement compatibility

In standard Ludics, the Opponent behaviour is $\sigma(D_P)^{\perp_L}$ — the set
of $n \in N_L$ orthogonal to every element of $\sigma(D_P)$:
$$
\sigma(D_P)^{\perp_L} \;:=\; \{n \in N_L : \forall p \in \sigma(D_P),\; p \perp_L n\}.
$$

In $\mathfrak{T}_L$, the Triads complement of $X \subseteq P_L$ is the same
formula with $\perp_T$ replacing $\perp_L$:
$$
X^{\perp_T} \;:=\; \{n \in N_L : \forall p \in X,\; p \perp_T n\} \;=\; X^{\perp_L}.
$$

**Claim (CQ2).** In $\mathfrak{T}_L$, $\sigma_T(D_P)^{\perp_T} = \sigma(D_P)^{\perp_L}$.

*Argument.* Combine CQ1 ($\sigma_T(D_P) = \sigma(D_P)$) with the observation
that $\perp_T = \perp_L$ in $\mathfrak{T}_L$. The two expressions are
definitionally equal. □

**Corollary.** Reading C's Opponent $\sigma(\hat{D}_P)^{\perp_T}$ in the Triads
sense is the same set as $\sigma(D_P)^{\perp}$ in the standard Ludics sense.
The two descriptions are equivalent in $\mathfrak{T}_L$.

### I.5 CQ3 — Carrier-set extension and delocation

The 0c directed system $\{B_t\}_{t \in \mathcal{T}}$ grows the deliberation
over time: new loci are opened, new claims added, and $N$ must accommodate
designs at the newly introduced dual loci. In Girard's setting, the mechanism
for moving designs between loci is **delocation** $\delta: \xi \to \eta$, a
locus-renaming.

**Setup.** At time $t$ the deliberation has locus set $\Lambda_t$, inducing
$\mathfrak{T}_{L,t} = (P_{L,t}, N_{L,t}, \perp_{L,t})$. At time $t{+}1$ a new
locus $\eta \notin \Lambda_t$ is opened: $\Lambda_{t+1} = \Lambda_t \cup
\{\eta\}$, inducing $\mathfrak{T}_{L,t+1} = (P_{L,t+1}, N_{L,t+1},
\perp_{L,t+1})$.

The **carrier-set extension** on the $N$-side is:
$$
N_{L,t+1} \;=\; N_{L,t} \;\cup\; N_\eta
$$
where $N_\eta = \{n \in N_{L,t+1} : \mathrm{root}(n) = \eta^*\}$.

The **delocation** from $\xi^*$ to $\eta^*$ is the locus-renaming $\delta^*:
N_{\xi^*} \to N_\eta$ sending a design rooted at $\xi^*$ to the same design
rooted at $\eta^*$, preserving all subterms.

**Claim (CQ3).** In $\mathfrak{T}_{L,t+1}$, the inclusion $\iota: N_{L,t}
\hookrightarrow N_{L,t+1}$ and the delocation $\delta^*: N_{\xi^*} \to N_\eta$
preserve orthogonality:

(i) $p \perp_{L,t} n \iff p \perp_{L,t+1} \iota(n)$ for all $p \in P_{L,t}$,
$n \in N_{L,t}$.

(ii) $p \perp_{L,t+1} \delta^*(n) \iff \delta(p) \perp_{L,t+1} n$ for all
$p \in P_{\xi}$, $n \in N_{\xi^*}$, where $\delta: P_\xi \to P_\eta$ is the
corresponding $P$-side renaming.

*Argument.* (i) The interaction norm $\langle p \mid n \rangle$ depends only on
the loci appearing in $p$ and $n$; introducing $\eta$ adds new loci but does
not alter the interaction on old ones. So $\perp_{L,t+1}$ restricts to
$\perp_{L,t}$ on the old carriers. (ii) Delocation is a uniform renaming, and
Ludics normalization commutes with locus-renamings: $\langle p \mid n \rangle$
converges iff $\langle \delta(p) \mid \delta^{-1}(n) \rangle$ converges, since
all rules in Girard 2001 are locus-generic. □

**Corollary.** Carrier-set extension of $N$ in the Triads setting is exactly
the delocation-induced extension of Girard's setting. The 0c directed system
$\{B_t\}$ extends to a directed system of Triads instances
$\{\mathfrak{T}_{L,t}\}$ under orthogonality-preserving inclusions — which is
the correct Triads-side notion of a directed system.

### I.6 The compatibility theorem and its caveat

Putting CQ1–CQ3 together:

**Theorem (Triads-Closure-Compatibility, 0g).** Reading C, instantiated in
the Ludics-induced Triad $\mathfrak{T}_L$, is fully compatible with the
standard Ludics treatment:

(a) $\sigma_T(\hat{D}_P)^{\perp_T} = \sigma(D_P)^{\perp}$ (from CQ1 + CQ2);

(b) Carrier-set extension of $N$ along new loci equals delocation (CQ3);

(c) The directed system $\{B_t\}$ extends to a directed system of Triads
$\{\mathfrak{T}_{L,t}\}$ under orthogonality-preserving inclusions.

**Caveat.** All three claims hold *for the Ludics-induced Triad
$\mathfrak{T}_L$*. If one replaces $\mathfrak{T}_L$ with an abstract Triad
$(P, N, \perp)$ using non-Ludics orthogonality, the claims need
re-establishing from first principles. Reading C is a Triads instance
specifically for $\mathfrak{T}_L$; it does not give a Triads instance for
all Triads.

**T3′ closing test.** In $\mathfrak{T}_L$, the player-role assignment (which
of $P_L$ and $N_L$ is Proponent, which is Opponent) is stipulative. CQ2
confirms Opponent $= \sigma(D_P)^{\perp_T}$ is a structural property of the
protocol, not a property of any participant. The Witness relation is external to
the Triad. T3′ (anonymous polarity) holds in $\mathfrak{T}_L$. □

**T4 closing test.** CQ3 confirms that carrier-set extension of $N$ (= locus
growth) is managed by delocation, which commutes with orthogonality. The Triad
$(P_{L,t}, N_{L,t}, \perp_{L,t})$ grows only by adding new loci; it does not
alter the existing orthogonality on old carriers. New participants instantiate
existing $n \in N_{L,t}$ via $\iota$; new claims add new $n$ via delocation.
This is the "records-only $\iota$" invariant from 0b §1.3 expressed at the
Triads level. T4 (dialectical/witnessing separation) holds in $\mathfrak{T}_L$.
□

---

## Part II — The Confidence-Erasure-Functor

### II.1 Categorical setup

**The Ambler category $\mathcal{C}_\mathrm{semi}$.**

Following Ambler (1996) and the substrate's C3 framing, $\mathcal{C}_\mathrm{semi}$
is a **$\mathsf{JSL}$-enriched CCC** (join-semilattice-enriched
cartesian-closed category):

- **Objects:** argument types $A, B, C, \ldots$ (propositions / claim-structures)
- **Hom-objects:** $\mathcal{C}_\mathrm{semi}(A, B) \in \mathsf{JSL}$ — each
  hom-set is a join-semilattice of derivations from $A$ to $B$, with join
  $\vee_A$ representing Ambler's evidence-combination operation
- **Composition:** a bilinear map $\mathcal{C}_\mathrm{semi}(B,C) \otimes_\mathsf{JSL}
  \mathcal{C}_\mathrm{semi}(A,B) \to \mathcal{C}_\mathrm{semi}(A,C)$ —
  composition distributes over joins (Ambler's "evidence combines through
  composition")
- **Confidence weights:** the Dempster–Shafer weighting on derivations is
  encoded in the semilattice structure on each hom-set: the bottom element
  $\bot_{A,B}$ is the "no-evidence" derivation; joins pool evidence;
  derivations at higher semilattice positions carry more confidence

So $\mathcal{C}_\mathrm{semi}$ is a $V$-enriched category with $V = \mathsf{JSL}$
(symmetric monoidal under $\otimes_\mathsf{JSL}$, with unit $\mathbf{1} =
\{\bot\}$), in Kelly's sense (Kelly 2005, §1.1).

**The Ludics-side plain category $\mathcal{C}_\mathrm{plain}$.**

$\mathcal{C}_\mathrm{plain}$ is an ordinary ($\mathsf{Set}$-enriched) CCC:

- **Objects:** same types $A, B, C, \ldots$
- **Hom-sets:** $\mathcal{C}_\mathrm{plain}(A, B) = \mathsf{Inc}(B_A)$ — the
  set of incarnations of the Ludics Opponent behaviour $B_A = \sigma(A)^{\perp}$,
  partially ordered by inclusion ($\mathsf{Art}(B_A)$ from 0b §2.2, corrected
  in 0f §II)
- **Composition:** the $\vee_{\perp\perp}$-compatible composition of designs
  (0f Part II confirms well-definedness on $\mathsf{Inc}$)
- **No confidence structure:** only the bare inclusion-poset of $\mathsf{Inc}(B_A)$;
  no semilattice weight

### II.2 Definition of U

**Definition (Confidence-Erasure-Functor).** The **Confidence-Erasure-Functor**
is the functor

$$
U \;:\; \mathcal{C}_\mathrm{semi} \;\longrightarrow\; \mathcal{C}_\mathrm{plain}
$$

defined as the Kelly 2005 §1.2 underlying-ordinary-category construction
$(-)_0$ applied to $\mathcal{C}_\mathrm{semi}$ along the lax monoidal forgetful
functor $\mathsf{JSL} \to \mathsf{Set}$.

Concretely:

- **On objects:** $U(A) = A$ (unchanged)
- **On hom-sets:** $U(\mathcal{C}_\mathrm{semi}(A,B)) = |\mathcal{C}_\mathrm{semi}(A,B)|$
  — the underlying set of the hom-semilattice; equivalently,
  $\mathsf{JSL}(\mathbf{1}, \mathcal{C}_\mathrm{semi}(A,B))$ (all
  semilattice maps from the unit $\mathbf{1}$ to the hom-semilattice)
- **On morphisms:** $U(f) = |f|$, the underlying derivation tree of $f$,
  forgetting its confidence / semilattice position

**Functoriality.** Composition in $\mathcal{C}_\mathrm{semi}$ is bilinear over
$\vee_A$ and therefore preserves underlying derivation trees; $U$ respects
composition and identities. □

**The identification restated.** C3 (post-0f §II.3) now reads:

$$
\mathcal{C}_\mathrm{plain}(A, B) \;=\; \mathsf{Inc}(B_A)
\;\simeq\; U\!\left(\mathcal{C}_\mathrm{semi}(A, B)\right)
$$

as partially ordered sets, where the inclusion order on $\mathsf{Inc}$ corresponds
to the derivation-extension order on $|\mathcal{C}_\mathrm{semi}(A,B)|$.

### II.3 The (F ⊣ U) adjunction

By the Jansana–San Martín 2018 (arXiv:1811.03698) pattern — an explicit
adjoint to a forgetful functor between a semilattice-enriched and a weaker
algebraic category — the forgetful functor $U$ has a left adjoint:

$$
F \;:\; \mathcal{C}_\mathrm{plain} \;\longrightarrow\; \mathcal{C}_\mathrm{semi}
$$

defined as the **free semilattice enrichment**:

$$
F(\mathcal{C}_\mathrm{plain})(A, B) \;:=\; \mathcal{F}(\mathcal{C}_\mathrm{plain}(A, B))
$$

where $\mathcal{F}(S)$ is the free join-semilattice on the set $S$ (finite
nonempty subsets of $S$, ordered by upward-closure under $\subseteq$).

The adjunction $F \dashv U$ has unit and counit:

- **Unit** $\eta: \mathrm{Id}_{\mathcal{C}_\mathrm{plain}} \Rightarrow U \circ F$:
  at $(A,B)$, sends a derivation $f \in \mathcal{C}_\mathrm{plain}(A,B)$ to the
  singleton $\{f\} \in \mathcal{F}(\mathcal{C}_\mathrm{plain}(A,B))$ —
  "embed as the minimal-confidence derivation"
- **Counit** $\varepsilon: F \circ U \Rightarrow \mathrm{Id}_{\mathcal{C}_\mathrm{semi}}$:
  at $(A,B)$, sends a formal finite join $\bigvee_i f_i \in
  \mathcal{F}(|\mathcal{C}_\mathrm{semi}(A,B)|)$ to the actual Ambler join
  $\bigvee_i f_i \in \mathcal{C}_\mathrm{semi}(A,B)$ — "fold free joins into
  actual evidence combination"

### II.4 What the counit says about C3

> **2026-05-29 — redirect note.** The per-cone framing of this section
> ("$\varepsilon$ at $(A, B)$ acts per-cone $C_i$, with target
> $\mathcal{C}_\mathrm{semi}(A, B_i)$") was tested by the
> [Q-027 thin-cones diagnostic](../../../RESEARCH_PROGRAMME/audits/q027-thin-cones-2026-05-29.md)
> on Ambler 1996 Example 1 (aspirin, Q3) and was found to be **the wrong
> bridge target level.** Cones under Reading A are too sparse to admit a
> surjective $\varepsilon$ onto the Ambler hom-semilattice; the missing
> Ambler element is exactly the cross-cone join that Phase 2e's
> Cross-Cone Incompatibility theorem forbids at the design level.
>
> The natural bridge target is one level up: $\mathcal{P}_\mathrm{fin}(\mathsf{Inc}(B))$ — the free JSL on incarnations — at which
> $\varepsilon$ is iso for trivial reasons (free extension of a
> generator-level bijection $\mathsf{Inc}(B) \leftrightarrow \mathcal{C}_\mathrm{base}(A, B^\sharp)$). This respects Phase 2e Cross-Cone
> Incompatibility because set-union now operates on sets of designs, not
> designs.
>
> The three-case taxonomy below (iso / surjective-not-injective /
> non-surjective) is still applicable, but to the **power-set-target**
> $\varepsilon$ rather than the per-cone $\varepsilon$. The substantive
> open content has migrated to
> [Q-028](../../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-028)
> (canonicality of the generator-level bijection) and
> [C001b′](../../../RESEARCH_PROGRAMME/03_CONJECTURES/C001b-prime-ambler-remainder.md).
> The original
> [C001b](../../../RESEARCH_PROGRAMME/03_CONJECTURES/C001b-ambler-remainder.md)
> is preserved as superseded for lineage.
>
> What remains intact in this section: (i) the $F \dashv U$ framing
> itself; (ii) the counit-as-comparison-map perspective; (iii) the
> three-case taxonomy of how a counit can fail. What was wrong: the
> implicit assumption that the per-cone JSL `(C_i, \subseteq, \cup, D_i)`
> from T001 is the right *target* for the bridge. T001 remains true as a
> fact about the structure of $B$, but the bridge target lives one level
> up.

> **2026-05-30 — δ defeat-encoding commitment (provisional, R1).** The
> [Q-028b reduction](../../../RESEARCH_PROGRAMME/audits/q028b-freeness-argument-2026-05-29.md)
> isolated the defeat-encoding $\delta$ as the only substantive of the
> bridge's four side-data items (the third factor of
> $\phi = \delta^{-1} \circ \mathrm{CH} \circ \mathrm{DP}$). Per the
> [δ decision brainstorm](../../../RESEARCH_PROGRAMME/audits/delta-defeat-encoding-decision-brainstorm-2026-05-30.md),
> the substrate **commits to $\delta_1$ — defeat-as-negation** as the
> working default for the C001b′ proof: an Ambler defeat $\mathrm{defeat}(\pi)$
> is encoded as a *negative design* (a Daimon ramification with an explicit
> attack ramification; the defeated argument is a blocked chronicle on the
> negative side). This is the substrate-native reading: it *is* the
> Phase 2e Cross-Cone Incompatibility relation, requires no new substrate
> primitive, and dominates the CSP-style $\delta_2$ (defeat-as-coroutine)
> on every proof-relevant axis (substrate consistency, theorem reuse,
> incarnation cardinality, Ambler-faithfulness, b₃′ tractability) per the
> brainstorm §3.
>
> The commitment is **provisional on the MALL fragment** and carries three
> recorded caveats: (i) confirmatory stress-tests E1 (reinstatement /
> nested-defeat crispness — does Ludics non-classicality leave a residue in
> $\mathrm{defeat}\circ\mathrm{defeat}$?) and E3 (primary-source polarity
> read-off of Ambler's defeat connective) are **not yet executed** — a
> negative E1 or a positive-polarity E3 would re-open the choice toward
> $\delta_2$; (ii) the MELL image of $\delta_1$ is pending
> [Q-030](../../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-030)
> and the fixpoint check
> [Q-031](../../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-031);
> (iii) the **runtime view is $\delta_2$** — the Mesh deliberation engine
> schedules challenges coroutine-style, so the operational layer is a
> $\delta_2$ *presentation* of this $\delta_1$ *semantics*, and the claim
> that the two agree on $\mathsf{Inc}(B)$ is the new question
> [Q-037](../../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-037).
> If Q-037 (R3) lands, the side-data item 4 substantiveness dissolves and
> this commitment becomes choice-free.
>
> **2026-05-30 update — caveat (i) discharged.** Both confirmatory gates are
> now executed and **both confirm $\delta_1$**:
> [E1](../../../RESEARCH_PROGRAMME/audits/e1-reinstatement-aspirin-2026-05-30.md)
> (reinstatement is Ambler-*monotone accrual* per Ambler 1996 p. 171, not
> double-negation collapse — $\delta_1$ implements it natively, naive $\delta_2$
> discards the evidence; settles A3, H1) and
> [E3](../../../RESEARCH_PROGRAMME/audits/e3-polarity-readoff-2026-05-30.md)
> (the focusing/evaluation alignment **forces negative polarity** on two
> independent grounds — the $P_L \times N_L$ interaction typing and the
> call-by-name evaluation regime — clearing H2 on the $\delta_1$ side and
> showing $\delta_2$'s positive locus is ill-typed). Caveats (ii) MELL image
> and (iii) runtime/$\delta_2$ agreement (Q-037) remain open and orthogonal.
>
> **2026-05-31 update — caveat (iii) discharged; commitment now firm on the
> propositional fragment.**
> [Q-037](../../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-037) is
> **closed positive on the full propositional defeasible fragment** — the
> [cyclic-defeat audit](../../../RESEARCH_PROGRAMME/audits/q031-cyclic-defeat-collapse-2026-05-31.md)
> lifted the acyclicity guard on top of L-MERGE + E2 + the R3-termination
> theorem §2.1, also closing the residual full
> [Q-031](../../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-031)
> (cyclic / unbounded-depth defeat forces **no** fixpoint in the design logic;
> no μMELL/μMALL needed). Consequently the runtime $\delta_2$ presentation is
> **proven to present** the semantic $\delta_1$ on $\mathsf{Inc}(B)$: the
> "runtime view is $\delta_2$ / agreement is a standing obligation" language of
> caveat (iii) is **withdrawn** — agreement is now a theorem, not an open
> obligation. Side-data item 4 ($\delta$) therefore **dissolves** on the
> propositional fragment and this commitment is **choice-free** there (the
> qualified positive of
> [Q-028b](../../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-028b)
> promotes to unqualified-positive on the propositional fragment). **The only
> surviving caveat is (ii):** the higher-order ($!$-translated MELL) image,
> tracked under [Q-030](../../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-030)
> and the higher-order canonicality question
> [Q-028a stratum-2](../../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-028a)
> (gated on the BF-materiality antichain
> [Q-032](../../../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-032)).

The counit $\varepsilon$ at $(A, B)$ is the comparison map:

$$
\varepsilon_{A,B} \;:\; \mathcal{F}(\mathsf{Inc}(B_A)) \;\longrightarrow\; \mathcal{C}_\mathrm{semi}(A, B)
$$

This sends a finite set of incarnations $\{|D_1|, |D_2|, \ldots, |D_k|\}$ to
their Ambler join $|D_1| \vee_A \cdots \vee_A |D_k|$. The map has three
possible shapes, with different implications for C3:

**(a) $\varepsilon_{A,B}$ is an isomorphism** (strong C3). Then
$\mathcal{C}_\mathrm{semi}(A,B) \cong \mathcal{F}(\mathsf{Inc}(B_A))$ as
join-semilattices: the Ambler hom-semilattice is exactly the free semilattice
on the articulation-lattice incarnations. Every Ambler derivation is a unique
finite join of Ludics incarnations. No "extra" confidence structure exists
beyond what the incarnation-set generates. This is the **strong C3 conjecture**.

**(b) $\varepsilon_{A,B}$ is surjective but not injective.** Every Ambler
derivation is a join of incarnations, but distinct Ambler derivations can have
the same join. The confidence structure is strictly richer than the
incarnation-set. C3 holds as a poset correspondence but not as a JSL
isomorphism.

**(c) $\varepsilon_{A,B}$ is not surjective.** There exist Ambler derivations
not expressible as joins of Ludics incarnations. C3 fails at the JSL level;
only the underlying-set identification survives.

**Substrate position.** The evidence in hand does not determine which case
holds. Round 1's "single-source structural identification" verdict stands: the
poset-level correspondence is the working claim (case a or b); the strong
version (case a, isomorphism via surjective counit) is the main open conjecture.
The substrate assumes a surjective counit without proof; this assumption should
be flagged explicitly in any C3 invocation.

### II.5 Honest C3 restatement (post-0g)

Incorporating the Confidence-Erasure-Functor and the adjunction analysis, C3's
honest post-0g statement is:

> **C3 (post-0g, full precision).**
>
> There is a structural identification
>
> $$\mathsf{Art}(B_A) \;:=\; (\mathsf{Inc}(B_A),\; \leq_\subseteq,\;
> \vee_{\perp\perp}) \;\simeq\; U\!\left(\mathcal{C}_\mathrm{semi}(A, B)\right)$$
>
> as partially ordered sets, where:
>
> - $U: \mathcal{C}_\mathrm{semi} \to \mathcal{C}_\mathrm{plain}$ is the
>   Confidence-Erasure-Functor (Kelly 2005, TAC reprint 10, §1.2,
>   underlying-ordinary-category construction);
> - $B_A = \sigma(A)^{\perp}$ is the Ludics Opponent behaviour for type $A$;
> - The partial orders correspond: incarnation inclusion
>   $\leftrightarrow$ derivation-extension order in Ambler.
>
> The $\vee_{\perp\perp}$ join on $\mathsf{Inc}(B_A)$ corresponds to Ambler's
> $\vee_A$ join on $|\mathcal{C}_\mathrm{semi}(A,B)|$ at the level of elements.
>
> A conjectural strengthening — that
> $\mathcal{C}_\mathrm{semi}(A,B) \cong \mathcal{F}(\mathsf{Inc}(B_A))$ as
> join-semilattices via a surjective counit $\varepsilon_{A,B}$ of the
> $(F \dashv U)$ adjunction — is proposed but unverified. The weaker
> poset-level identification is offered as the working hypothesis; its
> verification belongs to a future formal-proof effort.
>
> This identification is original to this track (Round 1, Appendix A,
> "single-source structural identification"; Round 2, N-C22, standard
> categorical machinery confirmed, application original).

### II.6 T5 MCP implications from the functor

The Confidence-Erasure-Functor motivates a principled split in the tool surface
(extending 0f §III.3):

- **`get_articulation_lattice`** `(deliberationId, claimId, options: {`
  `representatives: "incarnations" })` — returns $\mathsf{Inc}(B_A)$ as a
  poset of named representatives. This is the image of $U$: the plain-category
  hom-set after confidence erasure. Sufficient for an AI agent reasoning about
  which articulation to *endorse* (a policy or commitment choice).

- **`get_ambler_derivations`** `(deliberationId, claimId)` — would return
  $\mathcal{C}_\mathrm{semi}(A,B)$ with confidence weights. *Not yet on the
  implementation surface.* Requires the strong C3 conjecture (surjective
  $\varepsilon_{A,B}$) to guarantee that the returned derivations are
  generated by Ludics incarnations with meaningful confidence values. This
  tool is the "with-confidence" counterpart, mapping under the unit $\eta$
  into the free semilattice.

The distinction is load-bearing for the AI consumer: endorsement decisions need
only $\mathsf{Inc}(B_A)$; confidence-propagation across proof-net compositions
needs the full $\mathcal{C}_\mathrm{semi}(A,B)$.

---

## Part III — Net result and open items

### III.1 What 0g gives

Three closures:

- **Triads-Closure-Compatibility confirmed** (Part I). Reading C is a Triads
  instance for $\mathfrak{T}_L$, with $\sigma$ and $\perp$ compatible
  (CQ1–CQ2). Carrier-set extension of $N$ equals delocation (CQ3). The 0c
  directed system $\{B_t\}$ extends to a directed system of Triads instances
  under orthogonality-preserving inclusions.

- **Confidence-Erasure-Functor written down** (Part II). $U:
  \mathcal{C}_\mathrm{semi} \to \mathcal{C}_\mathrm{plain}$ is the Kelly
  $(-)_0$ construction along $\mathsf{JSL} \to \mathsf{Set}$. It has a left
  adjoint $F$ (free semilattice enrichment; Jansana–San Martín 2018 close
  analogue). The counit $\varepsilon: F \circ U \Rightarrow
  \mathrm{Id}_{\mathcal{C}_\mathrm{semi}}$ at each hom-set is the map from
  free joins of incarnations to actual Ambler evidence combinations.

- **C3 restated with full precision** (§II.5). The poset-level identification
  is the honest working claim. The JSL isomorphism (surjective counit) is the
  conjectural strengthening.

**T3′ / T4 / T5 status:**

| Thesis | Status after 0g |
| --- | --- |
| T3′ (anonymous polarity) | ✅ confirmed in $\mathfrak{T}_L$ (§I.6) |
| T4 (dialectical/witnessing separation) | ✅ confirmed in $\mathfrak{T}_L$ (§I.6) |
| T5 (MCP/AI-consumer shape) | ✅ plain/enriched tool split motivated by $U$ (§II.6) |

### III.2 What 0g does *not* give

- **Proof of the strong C3 conjecture.** Whether $\varepsilon_{A,B}$ is
  surjective — i.e., whether every Ambler derivation is a join of Ludics
  incarnations — requires understanding how Ambler's evidence-combination
  relates to the $\perp\perp$-closure at a structural level. This is the
  most interesting remaining open question.

- **Full formal verification of $\mathfrak{T}_L$ against Basaldella's axioms.**
  The CQ1–CQ3 arguments are structural-compatibility arguments using the fact
  that $\perp_T$ instantiates to $\perp_L$. A line-by-line check that
  $\mathfrak{T}_L$ satisfies all propositions in Basaldella 2015
  (Propositions 2.x, Theorem 3.x) is deferred.

- **The C10 composition lift.** "Composition lifts to articulation-lattice
  composition" remains deferred from 0f.

### III.3 Open questions from 0g

| # | Question | Source |
| --- | --- | --- |
| 0g-OQ1 | Is $\varepsilon_{A,B}: \mathcal{F}(\mathsf{Inc}(B_A)) \to \mathcal{C}_\mathrm{semi}(A,B)$ surjective? (Strong C3) | §II.4 |
| 0g-OQ2 | Does $F$ have a right adjoint beyond $U$ (a "confidence completion" on $\mathcal{C}_\mathrm{semi}$)? | §II.3 |
| 0g-OQ3 | Does $\mathfrak{T}_L$ satisfy *all* Basaldella 2015 axioms or only the structural ones used in CQ1–CQ3? | §I.6 caveat |
| 0g-OQ4 | Does the directed system $\{\mathfrak{T}_{L,t}\}$ have a colimit in the category of Triads, and does that colimit equal the "full deliberation" Triad? | §I.5 |

---

## Status

**Session 0g** covers two technical closures left open by 0f.

- **Part I** settled the Triads-internal closure-compatibility check: Reading C
  is a valid Triads instance for $\mathfrak{T}_L$ (the Ludics-induced Triad),
  with full compatibility of $\sigma$, $\perp$, and carrier-set extension
  (CQ1–CQ3). T3′ and T4 close in $\mathfrak{T}_L$.

- **Part II** wrote down the Confidence-Erasure-Functor $U:
  \mathcal{C}_\mathrm{semi} \to \mathcal{C}_\mathrm{plain}$ using Kelly 1982
  §1.2, identified its left adjoint $F$ (free semilattice enrichment; the
  Jansana–San Martín 2018 adjunction is the closest published analogue), and
  read off a precise two-level C3 statement: the poset identification is the
  working claim; the strong JSL isomorphism (surjective counit $\varepsilon$)
  is the main open conjecture.

The substrate-level C3 identification is now as honest as it can be without a
formal proof of the surjective counit. Four open questions (0g-OQ1–4) are
queued for a future formal-proof session or literature round.

Next: **Session 0h** (consolidation and spec pass) — sweep the four substrate
docs for remaining inconsistencies, write a unified claims register (or update
the existing one in `LUDICS_GENERATIVE_SUBSTRATE.md`), and determine whether
the substrate is stable enough to drive the first round of dev-side planning.
