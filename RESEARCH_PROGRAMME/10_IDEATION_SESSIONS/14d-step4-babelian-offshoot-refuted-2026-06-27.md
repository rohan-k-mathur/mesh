# Session 14d — Step 4 (B-abelian offshoot), resolved **negative**: the F2 confidence-distance cannot supply the per-edge transport magnitude — it is *node-derived*, and B2b demands a *node-independent* edge datum

**Date:** 2026-06-27
**Direction:** 8 — Information geometry of confidence (`12_RESEARCHER_COLLABORATION_PROSPECTUS.md` §4.2) **× Direction 4** (distributed semantics, sub-program B-abelian)
**Status:** **Resolved — negative finding.** Build-order **step 4** of [Session 14](14-confidence-information-geometry-fisher-rao-2026-06-15.md) — the cross-cutting offshoot. It checks [Session 14](14-confidence-information-geometry-fisher-rao-2026-06-15.md) §5's conjecture ("F2's position distance is a candidate for the per-edge transport magnitude the B-abelian cohomology needs") against the load-bearing constraint that gates that cohomology — **B2b** ([Session 08](08-distributed-semantics-quantitative-cohomology-2026-06-08.md) §1 / [Session 07](07-distributed-semantics-sheaf-cohomology-2026-06-07.md) §3.2): *a non-trivial $H^1(\mathbb{R})$ needs an edge datum **independent of the nodes**.* **Verdict:** every F2/F1-derived magnitude (the 14b §6 fork, $\Delta w$ vs KL, plus the antisymmetrised-KL repair) is a function of the source/target node confidences, so **none can supply the B-abelian weight**. Session 14 §5's conjecture is **refuted**: confidence geometry is structurally the wrong source, and B-abelian stays correctly gated behind its *exogenous edge-assertion* meaning-decision (the [Q-042](../01_OPEN_QUESTIONS_REGISTRY.md#q-042) quantitative offshoot).
**Scope discipline:** **no production code touched.** A negative result is itself a programme finding (the discipline of [Session 08](08-distributed-semantics-quantitative-cohomology-2026-06-08.md) §1's B2b).

> Reading order: [Session 14b](14b-F2-position-distance-fisherrao-vs-kl-2026-06-25.md) §6 (the fork this resolves) →
> [Session 08](08-distributed-semantics-quantitative-cohomology-2026-06-08.md) §1, §3 (B2b + the B-abelian route) →
> [Session 07](07-distributed-semantics-sheaf-cohomology-2026-06-07.md) §3.2 (the exactness result). This note closes the §5 offshoot.

---

## 0. The fork, and the one test that decides it

[Session 14b](14b-F2-position-distance-fisherrao-vs-kl-2026-06-25.md) §6 left a fork for
the per-edge transport magnitude: **(b)** $\Delta w$ = signed log-odds displacement
(unconditionally additive) vs **(a)** KL-as-cost (Pythagorean-additive only). Both were
offered as candidates for the $\mathbb{R}$-coefficient holonomy of the **B-abelian**
quantitative cohomology ([Session 08](08-distributed-semantics-quantitative-cohomology-2026-06-08.md) §3). But that cohomology is governed by one prior result that the fork must
face first:

> **B2b (Session 07 §3.2, load-bearing).** Any connection built from **node potentials**
> — target-minus-source log-odds of the tracked claim — **telescopes to $0$ around every
> loop**: it is a coboundary, exact, cohomologically trivial. A non-trivial $H^1(\mathbb{R})$
> needs an **edge datum independent of the nodes**, which `claimMapJson` does not carry.

The decisive question is therefore not "$\Delta w$ or KL?" but **"is the candidate
node-independent?"** — and every F2 magnitude is a function $f(p_{\mathrm{src}},p_{\mathrm{tgt}})$
of the two node confidences. So the fork collapses before it is chosen.

## 1. The three candidates fail B2b, each in its own way

Tested on a **coherent** room cycle $A\to B\to C\to A$ — the tracked claim mapped
*faithfully* all the way round (every edge in $\mathcal{P}^\circ$, **zero** genuine
obstruction by [T010](../02_THEOREMS_AND_PROOFS/T010-plexus-coherence-pseudofunctor.md)),
the rooms merely holding different confidences $p_A=0.6,p_B=0.7,p_C=0.55$. A *faithful*
disagreement magnitude must read **0** here (nothing is irreducibly obstructed). The
results:

| candidate | oriented 1-cochain? | loop sum on the **coherent** cycle | failure mode |
|---|---|---|---|
| **(b) $\Delta w$** = $w_{\mathrm{tgt}}-w_{\mathrm{src}}$ | yes (antisymmetric) | $\mathbf{0.000000}$ (telescopes) | **coboundary** — trivial in $H^1$; carries no class (B2b exactly) |
| **(a) KL** = $D(p_{\mathrm{src}}\|p_{\mathrm{tgt}})$ | **no** ($D(s\|t)\neq-D(t\|s)$) | $0.0749>0$ | **not a cochain**: unsigned, fires positive on *every* loop incl. coherent ones |
| **(a′) antisym-KL** = $D(s\|t)-D(t\|s)$ | yes (antisymmetric) | $\mathbf{-0.00161}\neq0$ | **spurious**: non-coboundary but **nonzero on a zero-obstruction loop** — false positive |

(antisym-KL also gives a *different* nonzero on another coherent triangle — $0.0222$ on
$(0.5,0.8,0.65)$ — confirming it is a genuine non-coboundary, hence a genuine *false*
class.) So:

- **$\Delta w$ is the coboundary B2b killed.** Its loop sum is $0$ on coherent cycles
  (telescoping); on a cycle *outside* $\mathcal{P}^\circ$ the tracked claim is not even
  single-valued at each node (monodromy), so $\Delta w$ is *undefined as a node potential*
  there — that obstruction is the **possibilistic** class already captured by
  [T011](../02_THEOREMS_AND_PROOFS/T011-possibilistic-cohomology-iso-monodromy.md), not a
  new $\mathbb{R}$-magnitude. Either way $\Delta w$ adds nothing abelian.
- **KL is not an oriented 1-cochain at all** (it is unsigned and asymmetric), so it cannot
  define a holonomy; summing it around loops always gives a positive number that flags
  even perfectly coherent transport.
- **antisym-KL** — the only way to coerce KL into an antisymmetric 1-cochain — *is*
  non-exact, but it is **node-derived**, so it fires on coherent cycles: it measures
  "confidence circulation" (the non-gradient part of the confidence landscape), **not**
  irreducible transport disagreement. A coherent cycle with varying confidences registers
  as a false "disagreement class".

## 2. The common root — and the refutation

The three failures share one cause: **every candidate is a function of the node
confidences** $f(p_{\mathrm{src}},p_{\mathrm{tgt}})$, and B2b's requirement is *independence
from the nodes*. A node-derived edge weight is forced into one of exactly two bad outcomes:

- it is a **coboundary** (the linear case, $\Delta w$) ⟹ identically trivial in $H^1$ — it
  vanishes on *all* cycles, even genuinely obstructed ones, so it cannot detect
  obstruction; **or**
- it is a **non-coboundary** (any nonlinear case, antisym-KL) ⟹ it does *not* vanish on
  coherent cycles, so it conflates confidence-variation with irreducible disagreement —
  **false positives**.

A *faithful* B-abelian weight must do the opposite of both: **vanish exactly on coherent
($\mathcal{P}^\circ$) cycles and be nonzero exactly on genuinely obstructed ones.** No
function of node confidences can achieve this, because coherence is a property of the
*transport* (faithful claim-tracking), not of the *confidence values* the rooms happen to
hold. **Therefore [Session 14](14-confidence-information-geometry-fisher-rao-2026-06-15.md)
§5's conjecture is refuted:** F2's position distance — being confidence geometry, a
function of node beliefs — is structurally incapable of supplying the per-edge magnitude.
This is the same shape as B2b itself (a hoped-for $\mathbb{R}$-holonomy shown exact), now
extended from the linear node potential to the *entire* F2 family.

## 3. What F2 *can* contribute (the constructive residual)

The refutation is of F2 as the **source** of the magnitude, not of F2 as its **register**.
Once an *exogenous, edge-asserted* datum exists (the genuine B-abelian weight — see §4), F2
and F1 supply two things and only two:

- **the unit.** The natural scale for an edge-asserted belief shift is **log-odds / nats**
  — the F1 ([Session 14a](14a-F1-logodds-eflat-ratification-2026-06-25.md)) weight-of-evidence
  register — so an exogenous weight should be *denominated* there for additive composition
  along $\mathcal{P}^\circ$ paths (where, by F1, log-odds shifts add).
- **the functional form.** If the edge asserts an *alignment distribution* (how the functor
  author believes the claim maps, with what fidelity), the natural penalty is a **Bregman /
  KL discrepancy of that asserted alignment against the identity alignment** — the F2
  ([Session 14b](14b-F2-position-distance-fisherrao-vs-kl-2026-06-25.md)) divergence
  register, now applied to an *edge-intrinsic* object rather than to node confidences. This
  is node-independent precisely because the asserted alignment is an edge property.

So F2 is the *coordinate system* for the magnitude, never its *content*. This keeps the
register discipline ([Session 14b](14b-F2-position-distance-fisherrao-vs-kl-2026-06-25.md)
§5) intact: the magnitude is a transport displacement, not a claim's standing.

## 4. Consequence — B-abelian stays gated behind its meaning-decision

[Session 08](08-distributed-semantics-quantitative-cohomology-2026-06-08.md) §3 already named
the real blocker: *what does a per-edge transport weight **mean**?* with three candidate
exogenous readings — (i) the functor author's **alignment-faithfulness confidence**, (ii) a
**`drift` / translation penalty**, (iii) an **evidential discount** on imported support —
and the standing rule that "**choosing the meaning is a modelling commitment, not a schema
detail, and should not be made to satisfy a theorem.**" Step 4's result **confirms and
sharpens** that gate:

- the hope that F2 would let B-abelian **skip** the meaning-decision (by *deriving* the
  weight from confidence geometry) is **dead** — there is no node-derived shortcut;
- the weight must be one of §3's exogenous edge assertions, denominated in the F1 register
  (§3); and adopting it remains a **deferred modelling commitment** ([Q-042](../01_OPEN_QUESTIONS_REGISTRY.md#q-042) quantitative offshoot), not a consequence of Q-045.

This is the honest closure: Q-045's information geometry **does not unblock** B-abelian; it
only tells B-abelian what *unit* to use once it makes its own modelling call.

## 5. Verdict and hand-off

- **Step 4 done — negative** (this note). The §5 offshoot conjecture is refuted: F2 cannot
  supply the B-abelian per-edge magnitude (node-derived; fails B2b's independence
  requirement, verified on a coherent cycle: $\Delta w$ coboundary $=0$, KL not a cochain,
  antisym-KL spurious $\neq0$).
- **Q-045 is now fully resolved.** Core: **F1** ([14a](14a-F1-logodds-eflat-ratification-2026-06-25.md)) + **F2** ([14b](14b-F2-position-distance-fisherrao-vs-kl-2026-06-25.md)) +
  **O1** ([14c](14c-O1-correlation-pullback-induced-2026-06-27.md)); offshoot: this note
  (resolved-negative). No build-order item remains.
- **Pointer corrections.** [Session 14](14-confidence-information-geometry-fisher-rao-2026-06-15.md)
  §5's optimistic framing ("the strongest argument for prioritising the metric half") is
  **superseded** — the metric half was worth doing for F2/O1, but *not* for the B-abelian
  payoff, which this note removes. [Session 08](08-distributed-semantics-quantitative-cohomology-2026-06-08.md) §3's B-abelian route keeps its **exogenous-weight** requirement,
  now with the F2-shortcut explicitly closed.
- **If B-abelian is ever taken up**, it begins at §3's exogenous-meaning decision (i/ii/iii),
  denominated in the F1 log-odds register — not at F2.
