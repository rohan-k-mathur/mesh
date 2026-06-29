# Session 14b — F2, decided: the position *distance* is **two registers, not one** — Fisher–Rao $d_{FR}$ (symmetric metric) and KL/Bregman (directed divergence), tagged by use

**Date:** 2026-06-25
**Direction:** 8 — Information geometry of confidence (`12_RESEARCHER_COLLABORATION_PROSPECTUS.md` §4.2)
**Status:** **Resolved — F2 decided.** Build-order **step 2** of [Session 14](14-confidence-information-geometry-fisher-rao-2026-06-15.md) ("choose the F2 metric: $d_{FR}$ vs KL, likely both tagged by use"). The decision: **adopt both, in two disjoint registers**, because each use *forbids* the other (clustering needs a metric, which KL is not; directed information-gain needs an asymmetric dually-flat divergence, which $d_{FR}$ is not). This is the metric-register analogue of Session 01's `min`-as-skeptical-projection discipline. It builds on F1 ([Session 14a](14a-F1-logodds-eflat-ratification-2026-06-25.md): aggregation = $e$-flat group law) and stops at the **independent** position lift; the **correlation** case (O1) stays open as **step 3**.
**Scope discipline:** **no production code touched** ([`logodds.ts`](../../lib/argumentation/logodds.ts), [`evidential/route.ts`](../../app/api/deliberations/%5Bid%5D/evidential/route.ts) unchanged). A `distance(...)` reducer companion is *specified* here, **contingent on O1**, not committed.

> Reading order: [Session 14](14-confidence-information-geometry-fisher-rao-2026-06-15.md) §3 (the F1/F2 split) →
> [Session 14a](14a-F1-logodds-eflat-ratification-2026-06-25.md) (F1 closed: aggregation = $e$-flat) → this note (F2).
> Register rule inherited: [Session 01](01-confidence-algebra-semiring-vs-quantale-2026-06-02.md) §0 — no shared currency between truth-support and any other scale.

---

## 0. The decision in one sentence

"Distance between two positions" is **not one object**: the confidence manifold
canonically carries a **symmetric Riemannian metric** $d_{FR}$ (for *where positions
sit relative to each other* — clustering, nearest-position, diameter) **and** an
**asymmetric Bregman divergence** $D=\mathrm{KL}$ (for *how much belief must move from
A to B* — directed disagreement, information gain, transport), and the two are
**non-substitutable**, so F2 adopts **both, tagged by register**, rather than electing
a single "the distance".

## 1. The two candidates, written

### 1.1 Single claim

On $\mathrm{Ber}(p)$, with $w=\operatorname{logit}p$ the [Session 14a](14a-F1-logodds-eflat-ratification-2026-06-25.md) natural parameter:

- **Fisher–Rao geodesic distance** (the Levi-Civita geodesic of $ds^2=dp^2/(p(1-p))$,
  flattened by $u=2\arcsin\sqrt p$):
  $$d_{FR}(p_1,p_2) \;=\; \big|\,u(p_1)-u(p_2)\,\big| \;=\; 2\,\big|\arcsin\sqrt{p_1}-\arcsin\sqrt{p_2}\,\big| \;\in\;[0,\pi].$$

- **KL divergence = Bregman divergence of the cumulant $\psi$** (the *same* $\psi$
  whose derivative is [`prob`](../../lib/argumentation/logodds.ts)); for the Bernoulli
  family the Bregman divergence $B_\psi$ on the natural coordinates *is* KL:
  $$D(p_1\,\|\,p_2) \;=\; \mathrm{KL}\big(\mathrm{Ber}(p_1)\,\|\,\mathrm{Ber}(p_2)\big)
    \;=\; p_1\log\frac{p_1}{p_2} + (1-p_1)\log\frac{1-p_1}{1-p_2} \;\in\;[0,\infty).$$
  Its meaning is exactly the [Session 14a](14a-F1-logodds-eflat-ratification-2026-06-25.md)
  currency: $D(p_1\|p_2)=\mathbb{E}_{p_1}\!\big[\log\mathrm{LR}\big]$ is the **expected
  weight of evidence** separating belief $p_2$ from truth-rate $p_1$ — the directed
  evidential cost of holding $p_2$ when $p_1$ is right.

### 1.2 Position lift (independent product — the F1-compatible case)

A position over $k$ claims is a point of $\prod_i\mathrm{Ber}(p_i)$. Under independence
both candidates decompose, but **differently**, and the difference is the whole point:

$$d_{FR}(\mathbf p,\mathbf p')^2 \;=\; \sum_{i=1}^k d_{FR}(p_i,p_i')^2
  \qquad\text{(product Riemannian metric — Pythagorean, $\ell^2$)},$$
$$D(\mathbf p\,\|\,\mathbf p') \;=\; \sum_{i=1}^k D(p_i\,\|\,p_i')
  \qquad\text{(Bregman additive — $\ell^1$, matches the per-claim log-odds bookkeeping)}.$$

The $\ell^2$ vs $\ell^1$ split is structural: $d_{FR}$ is a **length** (norms add in
quadrature), $D$ is an **accumulated cost** (nats add linearly, exactly as
[`corroborate`](../../lib/argumentation/logodds.ts) sums weights). The **correlation**
case — off-diagonal Fisher terms when claims share a premise — breaks *both*
decompositions and is O1 (step 3).

## 2. Properties — the table that forces the split

| property | $d_{FR}$ (Fisher–Rao) | $D=\mathrm{KL}$ (Bregman-of-$\psi$) |
|---|---|---|
| symmetric | **yes** | **no** ($D(.6\|.8)=0.1047\neq0.0915=D(.8\|.6)$) |
| triangle inequality | **yes** (true metric) | **no** ($D(.1\|.9)=1.758 > 0.879=D(.1\|.5)+D(.5\|.9)$) |
| $=0 \iff$ equal | yes | yes |
| range | bounded $[0,\pi]$ (finite diameter) | **unbounded** $[0,\infty)$ ($D(.5\|.999)=2.76\to\infty$) |
| position lift | $\ell^2$ (sum of squares) | $\ell^1$ (linear sum) |
| canonical w.r.t. F1 | the *metric* (Čencov-unique) | the **dually-flat companion** of $e$-flat aggregation (same $\psi$); **Pythagorean** with $e$-/$m$-geodesics |
| units | radians on the confidence sphere | **nats** (same units as the weight $w$ — see §5 trap) |
| reading | "how far apart are these positions" | "how much evidence moves belief A→B" |

Even the standard *metrization* of KL fails: $\sqrt{2D}$ is still asymmetric
($\sqrt{2D}(.6,.8)=0.457\neq0.428$), so KL cannot be massaged into the metric slot.

## 3. The bridge — they agree infinitesimally, diverge globally

Both descend from the **same** Fisher metric, so they are *locally* the same object and
*globally* different ones — which is exactly why one manifold needs both. To second
order the symmetrized (Jeffreys) divergence equals the squared arc:

$$J(p_1,p_2):=D(p_1\|p_2)+D(p_2\|p_1)\;\approx\;d_{FR}(p_1,p_2)^2\quad\text{as }p_2\to p_1,$$

both $=I(p)\,dp^2$ to leading order. Verified numerically:

| $(p_1,p_2)$ | $d_{FR}^2$ | Jeffreys $J$ | agree? |
|---|---|---|---|
| $(0.5,0.55)$ | $0.01003$ | $0.01003$ | to 5 d.p. (local) |
| $(0.6,0.8)$ | $0.19549$ | $0.19617$ | ~0.3% |
| $(0.5,0.99)$ | $1.878$ | $2.252$ | **diverge** (global) |

So $d_{FR}$ is the **symmetric, bounded, global integral** of the metric and $D$ is its
**asymmetric, unbounded, dually-flat** directed version; locally indistinguishable,
globally complementary. There is no third object to prefer over having both.

## 4. Use-case mapping — and why it is *not* a taste

The two candidates are not rivals to be ranked; **each target use mathematically
forbids the other**:

- **Clustering / nearest-position / position-space shape ⇒ $d_{FR}$ (forced).** "Nearest
  position", $k$-medoids, hierarchical clustering, and any diameter/coverage claim
  *require* the triangle inequality and symmetry to be sound; KL has neither, so using
  KL here silently breaks the algorithm's correctness guarantees (a "nearest" under KL
  need not be mutually nearest, and merges are order-dependent). The finite diameter
  $\pi$ is a *feature*: no two positions are infinitely far for clustering. **Only
  $d_{FR}$ is admissible.**

- **Directed disagreement / information gain / transport magnitude ⇒ $D$ (forced).**
  "How much evidence separates A from B", "the cost of adopting position B from prior
  A", and a per-edge transport magnitude *require* asymmetry (moving toward certainty
  $\neq$ toward doubt: $D(.6\|.8)\neq D(.8\|.6)$), linear additivity across claims, the
  nats currency, and the dually-flat Pythagorean structure that makes it the canonical
  companion of F1's $e$-flat aggregation. $d_{FR}$ is symmetric and $\ell^2$-additive,
  so it cannot carry a *directed* evidential cost. **Only $D$ is admissible.**

Because the admissible set is a singleton in each column and the two columns are
different, the disjunction "$d_{FR}$ or KL" was a false fork: the answer is the
*assignment* $\{\text{metric}\mapsto d_{FR},\ \text{divergence}\mapsto D\}$.

## 5. The decision, and the register discipline it must obey

**F2 (decided).** The position-distance object is **two registers**:

1. **Metric register $d_{FR}$** — symmetric, bounded $[0,\pi]$, $\ell^2$ position lift.
   Surfaces: position clustering, nearest-position, "how spread is this room",
   diameter/coverage. The *shape* of position space.
2. **Divergence register $D=\mathrm{KL}=B_\psi$** — asymmetric, unbounded, $\ell^1$
   position lift, nats, dually-flat-canonical. Surfaces: directed disagreement A→B,
   information gain, the candidate per-edge transport magnitude (§6). The *flow* on
   position space.

Neither is "the" distance; each is tagged by use, exactly as Session 01 kept `min` as a
*skeptical projection* register beside the log-odds default rather than collapsing them.

**Register discipline — the same-units trap (load-bearing).** $D$ is measured in **nats,
the same unit as the weight of evidence $w$** ([Session 14a](14a-F1-logodds-eflat-ratification-2026-06-25.md) §3.2: $D=\mathbb{E}[\log\mathrm{LR}]$). This makes the
[Session 01](01-confidence-algebra-semiring-vs-quantale-2026-06-02.md) §0 no-shared-currency
rule *more* important here, not less: **same units ≠ same register.** $w$ is a claim's
**standing** (accumulated support); $D$ is a **displacement between two standings** — the
position–displacement distinction of physics (both in metres, never added). A $D$ value
must **never** be summed into a `corroborate` accumulator, and the reducer API must keep
`distance(...)` type-distinct from `join`/`compose` so the two can never be confused at a
call site. $d_{FR}$ (radians) is dimensionally distinct and carries no such trap.

## 6. The §5 B-abelian offshoot — KL is the leading candidate, with one honest gap (defer to step 4)

[Session 14](14-confidence-information-geometry-fisher-rao-2026-06-15.md) §5 / [Session 08](08-distributed-semantics-quantitative-cohomology-2026-06-08.md) §3 want a principled
**per-edge transport magnitude** for the abelian $\mathbb{R}$-valued cohomology. Of the
two registers, **$D$ is the candidate** (and $d_{FR}$ is not): an $\mathbb{R}$-coefficient
holonomy needs an *unbounded, signed-decomposable, nats-valued* scalar — $d_{FR}$'s finite
diameter $\pi$ disqualifies it (holonomy must be able to accumulate without ceiling),
while $D$ is unbounded, additive across independent claims, and already in the evidential
currency.

**The honest gap.** A holonomy must compose **additively along a path**, and KL is
**Pythagorean-additive only under orthogonality** ($D(A\|C)=D(A\|B)+D(B\|C)$ holds when
$B$ is the $m$-/$e$-projection, not in general). The cleanest *unconditionally* path-additive
quantity is the signed natural-parameter displacement $\Delta w$ itself (F1's $e$-flat
coordinate), whose magnitude is the per-edge "belief shift". So step 4 must decide between
**(a)** $D$ as an unsigned per-edge *cost* with a Pythagorean composition law, vs **(b)**
$\Delta w$ as a signed per-edge *displacement* with unconditional additivity — checked
against the [Session 08](08-distributed-semantics-quantitative-cohomology-2026-06-08.md) §3
holonomy shape. **Not decided here** — flagged so step 4 starts from the right fork.

## 7. Hand-off

- **Build-order step 2 done** (this note). [Session 14](14-confidence-information-geometry-fisher-rao-2026-06-15.md)
  §6 advances to **step 3 — settle O1**, the position-metric **correlation** obligation:
  both §1.2 decompositions assume independence; correlated claims (shared premise, a
  `support` edge) put off-diagonal terms in the Fisher matrix the substrate does **not**
  store. Step 3 must either derive a canonical covariance from the argument-graph
  structure (e.g. `ArgumentEdge` support weights) or record the missing-structure finding
  and scope the minimal schema that would supply it. This is the gating item.
- **Then step 4** — resolve the §6 (a)-vs-(b) fork against [Session 08](08-distributed-semantics-quantitative-cohomology-2026-06-08.md) §3's per-edge-magnitude requirement.
- **Status in the programme.** F2 is a *design decision* (which canonical object serves
  which use), not a theorem — it stays a closed sub-result of the still-**open** Q-045,
  whose remaining substantive content is **O1**. If O1 lands, the §5 `distance(...)`
  reducer (both registers, type-tagged) promotes to an
  [`IMPLEMENTATION_TRACKS.md`](../IMPLEMENTATION_TRACKS.md) item beside the
  [`evidential/route.ts`](../../app/api/deliberations/%5Bid%5D/evidential/route.ts)
  `join`/`compose` reducers — never merged into the weight register.
