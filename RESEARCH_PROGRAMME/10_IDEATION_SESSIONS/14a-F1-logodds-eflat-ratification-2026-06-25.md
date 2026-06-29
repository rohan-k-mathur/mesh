# Session 14a — F1, rigorous: log-odds corroboration **is** the $e$-flat affine structure of the Bernoulli family (the geometric ratification of Session 01)

**Date:** 2026-06-25
**Direction:** 8 — Information geometry of confidence (`12_RESEARCHER_COLLABORATION_PROSPECTUS.md` §4.2)
**Status:** **Resolved — F1 closed.** This is build-order **step 1** of [Session 14](14-confidence-information-geometry-fisher-rao-2026-06-15.md) ("write F1 up rigorously"), the cheapest real result of [Q-045](../01_OPEN_QUESTIONS_REGISTRY.md#q-045). It promotes the session's *strong preliminary* F1 to a closed derivation: the e-flat / m-flat / Fisher–Rao trichotomy on the Bernoulli line, the identity **log-odds addition = sum of natural parameters = Bayesian fusion of independent evidence**, and the verdict that information geometry **ratifies** (does not compete with) the resolved Session-01 corroboration rule, checked against one [`evidential/route.ts`](../../app/api/deliberations/%5Bid%5D/evidential/route.ts) worked example.
**Scope discipline:** F1 is the **aggregation** half. It does **not** settle F2 (the position *metric* — $d_{FR}$ vs KL) or O1 (the correlation obligation); those stay open in [Session 14](14-confidence-information-geometry-fisher-rao-2026-06-15.md) §3–§4 and [Q-045](../01_OPEN_QUESTIONS_REGISTRY.md#q-045). **No production code is touched** ([`logodds.ts`](../../lib/argumentation/logodds.ts), [`evidential/route.ts`](../../app/api/deliberations/%5Bid%5D/evidential/route.ts) unchanged).

> Reading order: [Session 01](01-confidence-algebra-semiring-vs-quantale-2026-06-02.md)
> (the log-odds adoption this ratifies) → [Session 14](14-confidence-information-geometry-fisher-rao-2026-06-15.md)
> §1–§3 (the objects + the preliminary split) → this note (the closed F1).
> Kernel: [`lib/argumentation/logodds.ts`](../../lib/argumentation/logodds.ts)
> (`weight = logit`, `prob = logistic`, `corroborate = sum`).

---

## 0. What F1 has to prove

Session 01 adopted **addition in log-odds** as corroboration on the ground that it
is the only *algebraically lawful* stacking rule (a semiring's additive monoid;
the deprecated noisy-OR is not a semiring). F1 is the claim that this choice is
not merely lawful but **geometrically canonical** — that the addition is forced by
the information geometry the log-odds coordinate already carries, so corroboration
is the affine structure of a manifold rather than a reducer convention. Precisely,
F1 must establish three things and one boundary:

- **(T1) the coordinate.** $w = \operatorname{logit} p$ is the *natural* (canonical)
  parameter of the Bernoulli exponential family.
- **(T2) the trichotomy.** The family carries **three distinct** canonical
  structures through $w$ — the $e$-connection (flat in $w$), the $m$-connection
  (flat in $p$), and the Fisher–Rao Levi-Civita connection (flat in
  $u = 2\arcsin\sqrt p$) — and they do not coincide.
- **(T3) the identification.** Session-01 corroboration is **exactly** the
  $e$-connection affine operation, which is **exactly** Bayesian fusion of
  conditionally-independent evidence. Hence corroboration is canonical.
- **(B) the boundary.** The Fisher–Rao *distance* (and the Bregman/KL divergence)
  is a **different** object in a **different** register; F1 does not choose it (that
  is F2) and it must not be summed into the weight.

## 1. (T1) The natural parameter — pinned

A single claim's confidence is $\mathrm{Ber}(p)$, $p\in(0,1)$, written as a
one-parameter exponential family in the sufficient statistic $x\in\{0,1\}$:

$$p(x;\theta) \;=\; \exp\!\big(\theta\,x - \psi(\theta)\big), \qquad
  \theta = \log\frac{p}{1-p}, \quad \psi(\theta) = \log\!\big(1+e^{\theta}\big).$$

The standard exponential-family duals are then *literally* the kernel's functions:

| object | formula | kernel |
|---|---|---|
| natural parameter $\theta$ | $\log\frac{p}{1-p}$ | [`weight(p)`](../../lib/argumentation/logodds.ts) |
| expectation parameter $\eta=\psi'(\theta)$ | $\frac{e^\theta}{1+e^\theta}=p$ | [`prob(w)`](../../lib/argumentation/logodds.ts) |
| Fisher information $\psi''(\theta)$ | $p(1-p)$ | — |

So $w \equiv \theta$ and $p \equiv \eta$: the Session-01 read/write boundary
$p \xrightarrow{\text{weight}} w \xrightarrow{\text{prob}} p$ **is** the
exponential family's dual-coordinate transform $\eta \leftrightarrow \theta$.
The identity $w=0 \Leftrightarrow p=\tfrac12$ ([`NEUTRAL_WEIGHT`](../../lib/argumentation/logodds.ts))
fixes the family's distinguished origin at the "no evidence" point. **(T1) is
definitional and holds.**

## 2. (T2) The trichotomy — three structures, written and separated

The Fisher–Rao metric (the unique metric invariant under sufficient statistics;
Čencov) is $ds^2 = \psi''(\theta)\,d\theta^2 = p(1-p)\,dw^2 = \dfrac{dp^2}{p(1-p)}$.
Amari's dual flat connections plus the metric's Levi-Civita connection give three
*genuinely distinct* canonical structures, each with its own flat (affine)
coordinate:

| connection | flat coordinate | "straight line" = | geodesics |
|---|---|---|---|
| **$e$-connection** | $\theta = w$ (log-odds) | translation in $w$ | straight in $w$ |
| **$m$-connection** | $\eta = p$ (probability) | mixtures in $p$ | straight in $p$ |
| **Levi-Civita (Fisher–Rao)** | $u = 2\arcsin\sqrt p$ | arc on the sphere | spherical arcs |

They are distinct because the three coordinate charts are related by *non-affine*
reparametrisations ($w=\operatorname{logit}p$ is non-affine in $p$; $u=2\arcsin\sqrt p$
is non-affine in both). Two consequences pin the separation quantitatively:

1. **The metric is not flat in $w$.** Its coefficient $p(1-p)=\sigma(w)(1-\sigma(w))$
   peaks at $w=0$ and vanishes as $w\to\pm\infty$, so equal $w$-steps are *not* equal
   Fisher–Rao distances — a unit step at $w=0$ is longer (in information) than one at
   $w=4$. The $e$-flat coordinate is therefore **not** the metric-flat coordinate.
2. **The Fisher–Rao distance is finite-diameter.** $u=2\arcsin\sqrt p$ sends $ds^2$
   to $du^2$, so $d_{FR}(p_1,p_2)=2\,|\arcsin\sqrt{p_1}-\arcsin\sqrt{p_2}|\le\pi$,
   whereas the $e$-coordinate $w$ is unbounded. A bounded metric cannot be an affine
   reparametrisation of an unbounded line. **(T2) holds.**

The payoff of (T2) is that "combine evidence", "average belief", and "distance
between beliefs" are *three* operations living on *three* structures — and F1's job
is to say which one corroboration is.

## 3. (T3) The identification — corroboration is the $e$-flat operation = Bayesian fusion

### 3.1 Corroboration is the $e$-connection affine operation

Fix the family's distinguished origin $\theta=0$ ($p=\tfrac12$, "no evidence").
On the $e$-flat line the natural parameter is an *affine* coordinate, so it carries
a canonical abelian-group structure with that origin as identity: $(\mathbb{R},+,0)$.
The Session-01 corroboration monoid is exactly this group:

$$\bigoplus_i w_i \;=\; \sum_i w_i, \qquad \text{identity } 0, \qquad
  \text{(}\,\texttt{corroborate}\,\text{ in }\,\href{../../lib/argumentation/logodds.ts}{\texttt{logodds.ts}}\,\text{)}.$$

That this addition is *intrinsic to the family* (not just to the chart) is the
exponential-family closure law: the unnormalised product of two members has natural
parameter the **sum** of the parts,

$$p(x;\theta_1)\,p(x;\theta_2) \;=\; \exp\!\big((\theta_1+\theta_2)x - \psi(\theta_1)-\psi(\theta_2)\big)
  \;\propto\; p(x;\,\theta_1+\theta_2),$$

i.e. multiplying likelihoods $\equiv$ **adding natural parameters** $\equiv$ $e$-flat
translation. So corroboration $=$ translation along the $e$-geodesic, the operation
under which the Bernoulli family is closed.

> **Sharpening (avoid the midpoint confusion).** Corroboration is $e$-flat
> *translation* (the group law $w_1,w_2\mapsto w_1+w_2$ relative to the origin),
> **not** the $e$-geodesic *midpoint* $\tfrac12(w_1+w_2)$. The midpoint is an
> *average* (it does not stack); the group law is an *accrual* (it does). Confusing
> the two is exactly the semiring-vs-quantale error Session 01 diagnosed, now visible
> geometrically: aggregation is the affine **group**, averaging is the affine
> **midpoint**, and only the former accumulates evidence.

### 3.2 The same operation is Bayesian fusion of independent evidence

Let $H$ be the tracked proposition, prior odds $O(H)=P(H)/P(\neg H)$, and let
$E_1,\dots,E_n$ be evidence items conditionally independent given $H$ and given
$\neg H$. Bayes in odds form factorises the posterior:

$$O(H\mid E_1,\dots,E_n) \;=\; O(H)\,\prod_{i=1}^n \frac{P(E_i\mid H)}{P(E_i\mid\neg H)}.$$

Taking logs and writing **Good's weight of evidence** $w(E_i)=\log\frac{P(E_i\mid H)}{P(E_i\mid\neg H)}$
(the lineage Session 01 cites) gives the additive law

$$\log O(H\mid E_{1:n}) \;=\; \log O(H) \;+\; \sum_{i=1}^n w(E_i).$$

Under the family's "no evidence" origin (flat prior, $\log O(H)=0\Leftrightarrow p=\tfrac12$),
the combined log-posterior-odds is $\sum_i w(E_i)$ — **identically** $\texttt{corroborate}$.
Reading each route's confidence $p_i$ as its standalone posterior under the flat prior
makes $w_i=\operatorname{logit}p_i$ that route's weight of evidence, and `corroborateProbs`
returns $\sigma\!\big(\sum_i \operatorname{logit}p_i\big)$ — the Bayesian fusion of the
routes. Counter-evidence enters with $w<0$ ($\mathrm{LR}<1$), which is exactly
[`combineSignedProbs`](../../lib/argumentation/logodds.ts) computing
$\sigma(w_+ - w_-)=\sigma(\sum w_{\text{pro}} - \sum w_{\text{con}})$.

### 3.3 Worked example (the Session-01 diagnostic, re-run on all three structures)

Two independent routes each at $p=0.6$, so $w=\operatorname{logit}0.6=\log\tfrac{3}{2}\approx0.405465$.
The three structures of §2 give three *different* numbers, and only one stacks:

| operation | structure | result | stacks? |
|---|---|---|---|
| $\sigma(w+w)=\sigma(0.81093)$ | **$e$-flat translation** (corroboration) | $p=\tfrac{9}{13}\approx\mathbf{0.6923}$ | **yes** |
| $\tfrac12(0.6+0.6)$ | $m$-flat midpoint (mixture/average) | $p=0.6$ | no |
| $\sigma\!\big(\tfrac12(w+w)\big)$ | $e$-flat **midpoint** (log-odds average) | $p=0.6$ | no |
| Fisher–Rao geodesic midpoint | Levi-Civita | $p=0.6$ | no |

$\texttt{corroborateProbs([0.6,0.6])}=0.6923\ldots$ is precisely the $e$-flat
translation, i.e. the product-of-likelihood-ratios value
$O=\tfrac{1.5\cdot1.5}{1}=2.25\Rightarrow p=\tfrac{2.25}{3.25}=\tfrac{9}{13}$. The other
three structures return $0.6$: **only the $e$-connection group law accumulates
evidence; every "averaging" or "distance" structure is idempotent-like on equal
inputs.** This is the geometric content of Session 01's diagnostic — "two
independent 0.6 routes give $>0.6$" selects the $e$-flat group, and the geometry
*forces* that selection rather than leaving it a taste.

A second pair ($p_1=0.6, p_2=0.8$) separates the would-be averaging rules too:
$e$-sum $\Rightarrow \tfrac{6}{7}\approx0.857$ (stacks past both inputs), $e$-midpoint
$\approx0.710$, $m$-midpoint $=0.700$ — three distinct numbers, confirming the
trichotomy is not an artefact of equal inputs.

## 4. Verdict — ratification, and why the idempotence trade-off does not fire here

**F1 (closed).** Session-01 corroboration is the $e$-connection (dually-flat) affine
group structure of the Bernoulli exponential family, identical to Bayesian fusion of
conditionally-independent evidence under a flat prior. It is therefore *geometrically
canonical*: information geometry **ratifies** the resolved Session-01 rule, it does
not compete with it. Corroboration is not the Fisher–Rao Levi-Civita geodesic and not
any averaging midpoint.

The "idempotence trade-off" Session 01 weighed (semiring stacking vs the idempotent
quantale join that the parked Lawvere-enrichment prize needs) **does not fire for
aggregation**, and §3 says why precisely: idempotence is a property of *averaging /
join* structures ($m$-midpoint, Fisher–Rao midpoint, the `min` quantale), whereas
corroboration is the *group law* of the $e$-flat coordinate, which is non-idempotent
by construction ($w+w\neq w$ for $w\neq0$). The geometry separates the two roles, so
the trade-off is a property of the *metric/join* register (F2 and the parked
enrichment conjecture), not of the aggregation register settled here.

## 5. The boundary (B) — what F1 deliberately does not do

- **The distance is a different object in a different register.** The Fisher–Rao arc
  $d_{FR}(p_1,p_2)=2|\arcsin\sqrt{p_1}-\arcsin\sqrt{p_2}|$ (symmetric, $\le\pi$) and
  the Bregman-of-$\psi$ $=\mathrm{KL}(\mathrm{Ber}(p_1)\,\|\,\mathrm{Ber}(p_2))$
  (asymmetric — e.g. $\mathrm{KL}(0.6\|0.8)=0.1047\neq0.0915=\mathrm{KL}(0.8\|0.6)$)
  are **distances**, not accruals. Choosing between them is **F2**, open in
  [Session 14](14-confidence-information-geometry-fisher-rao-2026-06-15.md) §3. Per the
  Session-01 register discipline (no shared currency between truth-support and any
  other scale), a $d_{FR}$/KL distance must **never** be summed into the log-odds
  weight.
- **The position lift's correlation case (O1) is untouched.** §4 of Session 14: the
  product-family position metric is block-diagonal **only under independence**; the
  off-diagonal (correlated-claims) case is the missing-structure obligation O1, the
  real open work, and is not addressed here.
- **The $e$-flat / Lawvere-enrichment distinction is preserved.** Log-odds is
  non-idempotent, so it is *not* the quantale the parked enrichment prize would
  enrich over (Session 01); it is exactly the $e$-flat coordinate (this note). The two
  geometries are distinct and must not be conflated.

## 6. Hand-off

- **Q-045 build-order step 1 is done** (this note). [Session 14](14-confidence-information-geometry-fisher-rao-2026-06-15.md)
  §6 build order advances to **step 2 (choose the F2 metric: $d_{FR}$ vs KL, likely
  both tagged by use)**, then **step 3 (settle O1, the correlation obligation — the
  gating item)**, then **step 4 (test the §5 B-abelian per-edge-magnitude offshoot
  against [Session 08](08-distributed-semantics-quantitative-cohomology-2026-06-08.md) §3)**.
- **Status of F1 in the programme.** F1 is a *ratification* of a resolved decision,
  not a new conjecture: it explains why Session 01 was right. It stays recorded here
  as a closed sub-result of the still-**open** Q-045 (whose substantive content is the
  F2 + O1 metric half). It does **not** graduate to `02_THEOREMS_AND_PROOFS/` — there
  is no new programme theorem, only the identification of an existing reducer with a
  standard exponential-family fact.
- **If F2/O1 later land**, the position-distance function promotes to an
  [`IMPLEMENTATION_TRACKS.md`](../IMPLEMENTATION_TRACKS.md) item attaching to the
  [`evidential/route.ts`](../../app/api/deliberations/%5Bid%5D/evidential/route.ts)
  reducers (a `distance(...)` companion to the existing `join`/`compose`), tagged by
  register so it never contaminates the weight.
