# Session 14c — O1, resolved: the support DAG **induces** the off-diagonal position metric (pullback through the reducer map); exogenous correlation is out-of-model *by design*

**Date:** 2026-06-27
**Direction:** 8 — Information geometry of confidence (`12_RESEARCHER_COLLABORATION_PROSPECTUS.md` §4.2)
**Status:** **Resolved — O1 closed as a dichotomy.** Build-order **step 3** of [Session 14](14-confidence-information-geometry-fisher-rao-2026-06-15.md) — the gating item. The question ([Session 14](14-confidence-information-geometry-fisher-rao-2026-06-15.md) §4 / [Q-045](../01_OPEN_QUESTIONS_REGISTRY.md#q-045)): does the argument graph *induce* a canonical claim–claim covariance for the off-diagonal Fisher terms, or is it a missing-structure finding? **Answer (both branches, cleanly separated):** **(a) graph-mediated correlation is canonically induced** — a position lives on the DAG-image submanifold and inherits the **pullback** of the product Fisher–Rao / Bregman metric through the existing reducer map $\Phi$; the off-diagonal terms are the reducer Jacobian's shared-input cross-terms, **computable today with no schema change**. **(b) exogenous correlation** (two claims with no connecting graph path) is **genuinely unrepresented — and rightly so**: epistemic dependence in the substrate is *argued*, and any added coupling reduces to a graph node (case (a)). So O1 is **not a blocking gap**; it closes with a principled boundary.
**Scope discipline:** **no production code touched** ([`logodds.ts`](../../lib/argumentation/logodds.ts), [`eccAdapter.ts`](../../lib/argumentation/eccAdapter.ts), [`evidential/route.ts`](../../app/api/deliberations/%5Bid%5D/evidential/route.ts) unchanged). The pullback metric is *specified*, contingent on a consumer, not committed.

> Reading order: [Session 14](14-confidence-information-geometry-fisher-rao-2026-06-15.md) §4 (O1 stated) →
> [Session 14b](14b-F2-position-distance-fisherrao-vs-kl-2026-06-25.md) §1.2 (the independent lift this corrects) → this note.
> Substrate ground: [`lib/argumentation/eccAdapter.ts`](../../lib/argumentation/eccAdapter.ts) `legacyRowScore` / `monoidForMode` (the map $\Phi$).

---

## 0. The question, and the one-sentence answer

F2's position lift ([Session 14b](14b-F2-position-distance-fisherrao-vs-kl-2026-06-25.md) §1.2)
was block-diagonal *under independence*; O1 is the correlated case — where do the
off-diagonal Fisher terms come from? **They come from the support DAG itself:** because
some claims are *computed from* others by the reducer $\Phi$, a position is not a free
point in the product family but a point on the DAG-image submanifold, and the canonical
position metric is the **pullback** $\Phi^*g$, whose off-diagonal entries are exactly the
Jacobian cross-terms of shared premises — induced, closed-form, and schema-free. The only
correlation the substrate cannot express is correlation with *no argumentative path*, and
that absence is a design stance, not a defect.

## 1. The decisive substrate fact — the model carries marginals only

A Fisher off-diagonal $I_{ij}$ is a property of a **joint** distribution
$P(x_1,\dots,x_k;\theta)$: it is nonzero iff the joint is *not* a product of marginals
(the scores $\partial_i\log P$, $\partial_j\log P$ correlate). So the first question is
purely empirical about the schema: **does the substrate store any joint / second-order
object?** It does not. Reading the live evaluator ([`eccAdapter.ts`](../../lib/argumentation/eccAdapter.ts)):

- every confidence is a **scalar point estimate** — `support[claimId]: number`,
  `ArgumentSupport.base ∈ [0,1]`, per-derivation `score`. No covariance field, no
  pairwise potential, no joint table anywhere.
- the evaluator is a **deterministic propagation map** $\Phi$: per derivation,
  `score = compose([base, premiseFactor]) · assumptionFactor` with
  `compose = product` (or `min`), then **across** a claim's derivations `join`
  corroborates (`logodds`: `corroborateProbs`; `product`: noisy-OR; `min`: `max`).
  Premise edges make a conclusion argument's score a function of its premises' scores
  (`parents` map), so the DAG genuinely chains.

**Consequence.** Taken literally, the substrate has *no object from which to read an
off-diagonal $I_{ij}$* — at face value O1 is a missing-structure finding. The resolution
is to notice that "off-diagonal" has **two** sources, only one of which needs a stored
joint.

## 2. The two notions of correlation — separate them

### 2.1 (a) Graph-mediated correlation — *induced*, canonical, schema-free

The position coordinates $p_i$ are **not all free.** A conclusion claim's confidence is
$\Phi$ of its premises' confidences. Write the **free** inputs (leaf premises, per-argument
bases, assumption weights) as $\theta_{\mathrm{free}}$; the **derived** claims are
$\Phi(\theta_{\mathrm{free}})$. A position is therefore a point of the **image submanifold**
$M=\Phi(\text{free space})\subset\prod_i\mathrm{Ber}(p_i)$, not a free point of the product
family. The canonical metric on $M$ is the one it **inherits** from the ambient product
Fisher–Rao $g=\mathrm{diag}\big(I(p_i)\big)$ — the **pullback**

$$\big(\Phi^*g\big)_{ab}\;=\;\sum_{o}\,I\!\big(\Phi_o(\theta)\big)\,
   \frac{\partial \Phi_o}{\partial \theta_a}\,\frac{\partial \Phi_o}{\partial \theta_b},
   \qquad J=\partial\Phi\ \text{the reducer Jacobian},\quad \Phi^*g = J^{\mathsf T} g\, J.$$

This is **not block-diagonal**: two claims $c_i,c_j$ that share a premise $a$ acquire a
cross-term through the common column $\partial(\cdot)/\partial\theta_a$. No probability
prior and no modelling choice enters — once $\Phi$ is fixed (it is, by the reducer), the
induced metric of an embedded submanifold is *forced* differential geometry. The
"off-diagonal Fisher terms" O1 worried about are therefore **derived from existing
structure**, not stored.

**Concrete witness (shared premise ⇒ rank-1 co-movement).** Two conclusions sharing one
premise $a$, each with a private premise, under `compose = product`: $c_1=a\,b_1$,
$c_2=a\,b_2$. Perturbing only the shared $a$ moves **both** ($\delta c_1=b_1\,\delta a$,
$\delta c_2=b_2\,\delta a$) — a perfectly correlated, rank-1 displacement, the geometric
signature of an off-diagonal term. The push-forward covariance is
$\mathrm{Cov}(c_1,c_2)=\big(\tfrac{\partial c_1}{\partial a}\big)\big(\tfrac{\partial c_2}{\partial a}\big)\mathrm{Var}(a)=b_1b_2\,\mathrm{Var}(a)\neq0$, **nonzero iff a premise is shared.**
Verified by Monte-Carlo over small input noise around $a=0.7,b_1=0.8,b_2=0.6$:

| topology | induced $\mathrm{corr}(c_1,c_2)$ |
|---|---|
| **shared premise** $a$ feeds both | $\approx \mathbf{0.49}$ |
| **no sharing** (distinct $a_1,a_2$) | $\approx 0.00$ ($-0.004$, noise) |

(closed form: $\mathrm{Cov}=b_1b_2\,a(1-a)=0.1008$, matching the simulation). The graph's
shared-premise structure **is** the covariance.

### 2.2 (b) Exogenous correlation — *unrepresented, by design*, and reducible

The complementary case: two claims that are correlated in the world but joined by **no
graph path** (e.g. two independent-looking premises both tracking one latent fact). Here
the pullback gives **zero** cross-term (no shared $\theta_a$), and the substrate has no
object to record the coupling. To add it you would need a genuinely new stored object — a
symmetric pairwise potential (an Ising $J_{ij}$), a stored covariance, or a latent
common-cause node. **The finding:** this absence is **principled, not a bug**. The
substrate's epistemology (inherited from the argumentation core) is that epistemic
dependence is *mediated by explicit argument* — if two claims genuinely covary, the
faithful representation is an **argument connecting them** (a shared premise, an inference
link), i.e. a latent common-cause node, which **moves the correlation into case (a)** where
it is induced. So:

- **independence is the correct default** for claims with no connecting path (an
  unmodelled correlation is an *unstated argument*, not a missing covariance field);
- the **minimal supplying structure reduces to existing structure** — adding a
  common-cause claim node + its support edges, after which the pullback of §2.1 induces
  the coupling automatically. No new *kind* of object is ever required.

## 3. The correction this makes to F2 §1.2 (the right independence hypothesis)

[Session 14b](14b-F2-position-distance-fisherrao-vs-kl-2026-06-25.md) §1.2 wrote the
block-diagonal lift "under independence" treating **all $k$ claims** as independent. O1
sharpens this: the correct independence hypothesis is on the **free inputs** (leaf
premises / bases), *not* on the derived claims. So:

- the block-diagonal $\ell^2$ / $\ell^1$ lift applies to the **free-coordinate** family
  $\prod_a\mathrm{Ber}(\theta_a)$;
- the **full** position metric over all claims (free + derived) is the **pullback**
  $\Phi^*g$ (Fisher–Rao) and the corresponding $\Phi$-pushed Bregman divergence (KL),
  with derived claims **never** assumed independent — their correlation is computed, not
  posited.

This is a strict tightening of F2, not a contradiction: the independent lift is the
restriction of the pullback metric to the leaf coordinates.

## 4. Computability — closed-form, no Prisma change

The pullback is implementable from what exists, because $\Phi$ is the reducer:

- in the adopted **`logodds`** mode $\Phi$ is **smooth** — `compose = product`
  (smooth) and `join = corroborateProbs = σ(Σ logit)` (smooth) — so $J=\partial\Phi$ has a
  **closed form** (chain rule through the `parents`/derivation maps in
  [`eccAdapter.ts`](../../lib/argumentation/eccAdapter.ts)); the pullback $J^{\mathsf T}gJ$
  is a direct computation over the support DAG.
- in **`min`** mode $\Phi$ is piecewise-linear (a selection), so $J$ is the active-branch
  Jacobian (subdifferential at ties) — the pullback is defined a.e., matching `min`'s
  status as the skeptical-projection register.

So **graph-mediated correlation needs no schema migration** — the off-diagonal metric is a
recomputable function of the existing `ArgumentSupport` / premise-edge graph, exactly as
the marginal `support[claimId]` already is.

## 5. Register discipline (unchanged)

The pullback lives entirely in the **metric register** ([Session 14b](14b-F2-position-distance-fisherrao-vs-kl-2026-06-25.md) §5): $\Phi^*g$ measures *distance between positions*, never
support of a claim, and its values (radians² for Fisher–Rao, nats for the Bregman push)
must **never** be summed into the log-odds weight. The Jacobian $J$ is read *from* the
weight pipeline but its product $J^{\mathsf T}gJ$ is a different object in a different
register — same no-shared-currency rule as [Session 01](01-confidence-algebra-semiring-vs-quantale-2026-06-02.md) §0.

## 6. Verdict

**O1 (closed).** The off-diagonal position metric is **canonically induced by the support
DAG** as the pullback $\Phi^*g$ of the product Fisher–Rao / Bregman metric through the
existing reducer map — closed-form in `logodds` mode, no schema change, with the
shared-premise structure *being* the covariance (corr $\approx0.49$ shared vs $0$
unshared). The residual "missing structure" — exogenous correlation with no graph path —
is **out of model by design** (epistemic dependence is argued) and its repair **reduces to
adding a graph node** (case (a)). So O1 resolves on the **positive (a)-branch** of its own
disjunction, with the negative (b)-branch confined to a principled, reducible boundary.
This is the "the graph *induces* a canonical covariance" outcome, **not** a blocking
missing-structure finding.

**Net for Q-045.** The three substantive sub-claims are now settled: **F1** (aggregation =
$e$-flat group law = Bayesian fusion, [14a](14a-F1-logodds-eflat-ratification-2026-06-25.md)),
**F2** (distance = two canonical registers, [14b](14b-F2-position-distance-fisherrao-vs-kl-2026-06-25.md)),
**O1** (position metric = induced pullback, this note). Q-045's core question — *is the
principled geometry Fisher–Rao, is aggregation geodesic/Bregman, does "distance between
positions" acquire a canonical metric* — is **answered yes** across the board. What remains
is the **offshoot** (step 4), not core Q-045.

## 7. Hand-off

- **Build-order step 3 done** (this note). Only **step 4** remains — the §5 **B-abelian
  offshoot**: resolve [Session 14b](14b-F2-position-distance-fisherrao-vs-kl-2026-06-25.md)
  §6's fork (KL-as-cost with Pythagorean composition **vs** $\Delta w$-as-displacement with
  unconditional additivity) against [Session 08](08-distributed-semantics-quantitative-cohomology-2026-06-08.md) §3's per-edge transport-magnitude requirement.
  This is a *cross-cutting offshoot* feeding Direction 4, **not** part of Q-045's core,
  which is now resolved.
- **Status move recommended.** Q-045 can advance from "open" to **resolved (core) —
  offshoot + implementation open**: F1+F2+O1 close the information-geometry question; the
  per-edge-magnitude offshoot and any `distance(...)` implementation are downstream.
- **If a consumer appears** (position clustering / nearest-position UI, or the Direction-4
  magnitude), the position metric promotes to an [`IMPLEMENTATION_TRACKS.md`](../IMPLEMENTATION_TRACKS.md)
  item: a `distance(...)` reducer companion to [`evidential/route.ts`](../../app/api/deliberations/%5Bid%5D/evidential/route.ts)'s
  `join`/`compose`, computing the **pullback** $\Phi^*g$ over the support DAG for the
  Fisher–Rao register and the $\Phi$-pushed Bregman for the KL register — type-tagged so
  neither contaminates the weight.
