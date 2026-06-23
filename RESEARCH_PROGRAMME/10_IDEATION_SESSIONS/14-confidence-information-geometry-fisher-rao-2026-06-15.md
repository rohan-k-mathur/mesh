# Session 14 — Information geometry of confidence: is the log-odds line Fisher–Rao? (Q-045)

**Date:** 2026-06-15
**Direction:** 8 — Information geometry of confidence (`12_RESEARCHER_COLLABORATION_PROSPECTUS.md` §4.2; the prospectus direction the six-direction spine under-weights)
**Status:** **Scoping — OPEN** (no production code changed, no theorem proved). This session frames [Q-045](../01_OPEN_QUESTIONS_REGISTRY.md#q-045), writes the Fisher–Rao metric on the single-claim confidence line, runs the one decisive check the registry's `next-action` names (is log-odds addition the geodesic operation?), and records a **strong preliminary finding** that splits the question into a *ratified-aggregation* half and an *open-metric* half. It does **not** settle the position-metric lift or the correlation-structure obligation.
**Purpose:** [Session 01](01-confidence-algebra-semiring-vs-quantale-2026-06-02.md) resolved the confidence *algebra* to a log-odds / weight-of-evidence semiring (corroboration ⊕ = addition in $\mathbb{R}$). The observation Q-045 registers: log-odds **is** the natural (canonical) parameter of the Bernoulli exponential family, so the Session-01 algebra decision **already implies** a geometry that nobody has drawn out. This session draws it out far enough to decide whether the geometry *ratifies* or *competes with* the resolved rule, and whether it supplies the per-edge magnitude that the quantitative-cohomology companion ([Session 08](08-distributed-semantics-quantitative-cohomology-2026-06-08.md) §3) explicitly lacks.

> Reading order: [Session 01](01-confidence-algebra-semiring-vs-quantale-2026-06-02.md)
> (the log-odds adoption this rides on — especially the corroboration-stacks diagnostic and
> the parked Lawvere-enrichment prize), the kernel [`lib/argumentation/logodds.ts`](../../lib/argumentation/logodds.ts)
> (`weight = logit`, `prob = logistic`, `corroborate = sum`), the live reducers
> [`app/api/deliberations/[id]/evidential/route.ts`](../../app/api/deliberations/%5Bid%5D/evidential/route.ts)
> (where `join` in `logodds` mode calls `corroborateProbs`), and
> [Session 08 §3](08-distributed-semantics-quantitative-cohomology-2026-06-08.md)
> (the parked **B-abelian** per-edge-weight *meaning* decision this could feed).

---

## 0. The problem in one sentence

Session 01 chose **addition in log-odds** as corroboration because it is the only
algebraically lawful stacking rule; Q-045 asks whether that choice is also
**geometrically canonical** — whether the log-odds line is the Fisher–Rao
information manifold of the Bernoulli family, so that "combine evidence" and
"distance between two positions" stop being ad-hoc reducer choices and become
the affine and metric structure of a single geometry.

## 1. The objects, pinned

A single claim's confidence is a Bernoulli distribution $\mathrm{Ber}(p)$,
$p \in (0,1)$. The Bernoulli family is a one-parameter exponential family

$$p(x;\theta) = \exp\big(\theta\, x - \psi(\theta)\big), \qquad x \in \{0,1\},$$

with

- **natural parameter** $\theta = \log\dfrac{p}{1-p}$ — *exactly* the Session-01
  weight of evidence $w$ ([`weight(p)`](../../lib/argumentation/logodds.ts));
- **log-partition / cumulant** $\psi(\theta) = \log(1+e^{\theta})$;
- **expectation parameter** $\eta = \psi'(\theta) = \dfrac{e^\theta}{1+e^\theta} = p$
  — the probability itself ([`prob(w)`](../../lib/argumentation/logodds.ts) is
  $\psi'$, the logistic).

So the Session-01 read/write boundary $p \xrightarrow{\text{weight}} w \xrightarrow{\text{prob}} p$
is **literally the exponential family's dual-coordinate transform** $\eta \leftrightarrow \theta$.
This is not an analogy; the migration already computes in the natural parameter.

## 2. The Fisher–Rao metric, written down (the registry's first next-step)

The Fisher information of the Bernoulli family is

$$I(p) = \frac{1}{p(1-p)} \quad\text{(expectation coordinate)}, \qquad
  I(\theta) = \psi''(\theta) = p(1-p) \quad\text{(natural coordinate)}.$$

The Fisher–Rao **metric** (the unique — up to scale — Riemannian metric invariant
under sufficient statistics; Čencov's theorem) is $ds^2 = I\,d(\cdot)^2$, i.e.

$$ds^2 = \frac{dp^2}{p(1-p)} = p(1-p)\,d\theta^2 = p(1-p)\,dw^2.$$

Two immediate consequences that decide the question:

1. **The metric is *not* flat in the log-odds coordinate.** The coefficient
   $p(1-p) = \sigma(w)\big(1-\sigma(w)\big)$ is not constant in $w$; it peaks at
   $w=0$ ($p=0.5$) and vanishes as $w \to \pm\infty$. So **equal log-odds steps
   are not equal Fisher–Rao distances** — a step from $w=0$ to $w=1$ is *longer*
   (in information) than a step from $w=4$ to $w=5$. Confidence near certainty is
   information-cheap to move; confidence near the coin-flip is expensive.
2. **The Fisher–Rao geodesic distance is spherical, not linear.** The substitution
   $u = 2\arcsin\sqrt{p}$ (equivalently the map $p \mapsto (\sqrt{p}, \sqrt{1-p})$
   onto a circle arc) sends $ds^2$ to $du^2$ — flat. The Fisher–Rao distance
   between $\mathrm{Ber}(p_1)$ and $\mathrm{Ber}(p_2)$ is therefore the **arc length**

   $$d_{FR}(p_1,p_2) = 2\,\big|\arcsin\sqrt{p_1} - \arcsin\sqrt{p_2}\big|,$$

   bounded by $\pi$ — a *finite-diameter* metric, unlike the unbounded log-odds line.

## 3. The decisive check — is log-odds addition the geodesic operation?

The registry's `next-action`: *check whether log-odds addition is the geodesic
operation against one worked corroboration example.* The answer is the crux of
the whole question, and it is a clean **split**:

**Log-odds addition is the dually-flat (e-connection) affine operation, *not* the
Fisher–Rao Levi-Civita geodesic.** The exponential family carries Amari's two flat
affine connections:

- the **e-connection**, whose affine coordinate is $\theta = w$ (log-odds); its
  geodesics are *straight lines in $w$*, and translation along them is
  **addition of natural parameters**;
- the **m-connection**, whose affine coordinate is $\eta = p$; its geodesics are
  *straight lines in $p$* (mixtures).

Neither is the Levi-Civita connection of the Fisher–Rao metric of §2 (whose
geodesics are the spherical arcs). The three structures are genuinely distinct.

**Worked example (the Session-01 diagnostic, re-run geometrically).** Two
independent routes, each $p=0.6$, so $w = \log 1.5 \approx 0.405$.

- **Session-01 corroboration:** $w_\oplus = 0.405 + 0.405 = 0.811 \Rightarrow p \approx 0.69$
  ([`corroborateProbs([0.6,0.6])`](../../lib/argumentation/logodds.ts)). This is
  exactly the **sum of natural parameters**, i.e. **e-flat translation**, i.e. the
  product-of-likelihood-ratios rule of **Bayesian fusion of independent evidence**.
- **m-flat (mixture) average** would give $p = 0.6$ (no stacking) — the *opponent*
  of the diagnostic, the idempotent reading Session 01 already rejected.
- **Fisher–Rao metric midpoint / geodesic translation** gives yet a third number
  (move by a fixed arc length on the $2\arcsin\sqrt{p}$ circle), and is *not* an
  evidence-combination rule at all — it is a distance, not an accrual.

**Finding F1 (ratification, not competition).** Session-01's log-odds addition is
**geometrically canonical as the e-connection affine structure** — it is the
operation under which the exponential family is closed (product of independent
likelihoods ↦ sum of natural parameters), which is *precisely* correct Bayesian
accrual of independent evidence. Information geometry **explains** the Session-01
rule rather than competing with it: corroboration is e-flat translation. The
"idempotence trade-off" the registry anticipated **does not fire for aggregation**
— the geometry ratifies the resolved rule.

**Finding F2 (the metric is a *new* object, not the aggregation rule).** "Distance
between two positions" is **not** $|w_1 - w_2|$ and **not** recovered by the
aggregation rule. It is a separate canonical object with two principled readings:

- **symmetric metric:** the Fisher–Rao arc length $d_{FR}$ of §2 (a true Riemannian
  metric — triangle inequality, finite diameter $\pi$);
- **asymmetric divergence:** the **Bregman divergence of $\psi$**, which for the
  Bernoulli family *is the KL divergence* $\mathrm{KL}(\mathrm{Ber}(p_1)\,\|\,\mathrm{Ber}(p_2))$,
  the dually-flat "directed distance" generated by the same $\psi$ whose derivative
  is `prob`. Bregman/KL is the natural divergence *between* the very objects log-odds
  addition combines, and it is the canonical companion to e-flat aggregation.

So Q-045 cleanly bifurcates: **aggregation half = ratified (F1); metric half = open
and genuinely new (F2).**

## 4. The position lift (the second next-step — partially scoped, not settled)

A *position* is a joint judgement over $k$ claims. Under the **independence**
hypothesis it is a product Bernoulli family $\prod_{i=1}^k \mathrm{Ber}(p_i)$, whose
Fisher matrix is **block-diagonal** $I = \mathrm{diag}\big(1/(p_i(1-p_i))\big)$, so:

- the position metric is the **sum of per-claim Fisher–Rao terms** (a product metric,
  $d_{FR}^2 = \sum_i d_{FR}(p_i,p_i')^2$);
- KL is **additive** across independent claims ($\mathrm{KL} = \sum_i \mathrm{KL}_i$),
  matching the per-claim log-odds bookkeeping the substrate already does.

**Open obligation O1 (correlation structure).** The block-diagonal form is *exactly*
the independence assumption. If two claims are evidentially correlated (a shared
premise, a `support` edge wiring one argument into another's base), the true Fisher
matrix has **off-diagonal** terms the substrate **does not currently carry** — there
is no stored claim-claim covariance. This is the "missing-structure lemma" the
registry's `how-would-we-know` anticipates: either (a) prove the substrate's
graph structure *induces* a canonical covariance (e.g. from `ArgumentEdge` support
weights), or (b) record that the principled position metric needs a correlation
object the schema lacks, and scope what minimal structure would supply it.

## 5. The cross-cutting payoff (why this is worth more than a single metric)

[Session 08 §3](08-distributed-semantics-quantitative-cohomology-2026-06-08.md) parked
the **abelian / $\mathbb{R}$-valued** quantitative cohomology behind a single missing
input: a *principled per-edge transport magnitude* (the "how much does belief shift
along this `RoomFunctor`" number), gated under [Q-042](../01_OPEN_QUESTIONS_REGISTRY.md#q-042) /
[Q-043](../01_OPEN_QUESTIONS_REGISTRY.md#q-043). **F2's position distance is a candidate
for exactly that magnitude:** the KL / Fisher–Rao displacement a transport induces on a
claim's confidence is a coordinate-free, additively-composing scalar — which is the
shape an $\mathbb{R}$-coefficient holonomy needs. This turns a stuck *modelling* decision
("what does a per-edge weight *mean*?") into a *derived* value, and is the strongest
argument for prioritising the metric half.

## 6. Grades and build order

| Sub-claim | Grade | Why |
|---|---|---|
| §1 log-odds = Bernoulli natural parameter | **resolved (fact)** | Definitional; the migration already computes in $\theta$. |
| §2 Fisher–Rao metric on the single claim | **resolved (written)** | $ds^2 = dp^2/(p(1-p)) = p(1-p)\,dw^2$; spherical geodesics. |
| §3 F1 — aggregation = e-flat translation, ratified | **strong preliminary** | The worked example lands; wants a one-paragraph write-up tying "sum of natural params = independent-evidence Bayes fusion". |
| §3 F2 — metric/divergence is a new object | **open (well-posed)** | Two canonical candidates ($d_{FR}$ symmetric, KL asymmetric); the substrate must *choose* which the product surfaces. |
| §4 position lift (independent) | **partially scoped** | Product metric is immediate; the **correlation** case (O1) is the real work. |
| §5 feed B-abelian per-edge magnitude | **conjecture (offshoot)** | Plausible and high-value; not yet checked against the Session-08 holonomy shape. |

**Build order (when taken up):**
1. **Write F1 up rigorously** (½ session) — the e-flat/m-flat/Fisher–Rao trichotomy
   on Bernoulli + the "log-odds addition = Bayesian independent-evidence fusion = sum
   of natural parameters" identity, against one `evidential/route.ts` worked example.
   This is the deliverable that *ratifies Session-01 geometrically* and is the cheapest
   real result.
2. **Choose the metric (F2)** — decide whether the product surfaces $d_{FR}$ (symmetric,
   bounded, triangle-inequality — good for "nearest position" / clustering) or KL
   (asymmetric, additive, dually-flat-canonical — good for "directed disagreement" /
   transport). Likely *both*, tagged by use, mirroring Session-01's `min`-as-skeptical-projection
   discipline.
3. **Settle O1 (correlation)** — the position-metric obligation; the gating mathematical
   question, where the answer may be a *missing-structure* finding rather than a metric.
4. **Test the B-abelian offshoot (§5)** — only after F2's metric is chosen, check it against
   the [Session 08](08-distributed-semantics-quantitative-cohomology-2026-06-08.md) §3
   per-edge-weight requirement.

## 7. What this session did *not* do (discipline)

- No production code touched ([`evidential/route.ts`](../../app/api/deliberations/%5Bid%5D/evidential/route.ts),
  [`logodds.ts`](../../lib/argumentation/logodds.ts) unchanged). A position-distance
  function and a metric-mode tag are *contingent* on the F2 choice, not committed.
- F1 is a *strong preliminary*, not a closed result — it needs the rigorous write-up of
  step 1 before it can be cited as "Session-01 ratified by information geometry."
- The **Lawvere-enrichment prize** parked in Session 01 is a *different* (algebraic /
  quantale-metric) geometry of confidence; this session is the **Riemannian/dually-flat**
  geometry and is deliberately distinct. They are not in competition and should not be
  conflated — log-odds is non-idempotent (rules out the enrichment quantale) but is exactly
  the e-flat coordinate (this session). Recording the distinction is part of the point.

## 8. Hand-off

- **Stays open** in [Q-045](../01_OPEN_QUESTIONS_REGISTRY.md#q-045) with this session as its
  scoping pointer. The aggregation half (F1) is a candidate for a short standalone note or a
  conjecture-grade write-up; the metric half (F2 + O1) is the substantive open content.
- **If F2/O1 land,** the position-distance function promotes to an
  [`IMPLEMENTATION_TRACKS.md`](../IMPLEMENTATION_TRACKS.md) item attaching to the
  evidential reducers, and the §5 offshoot promotes to a pointer in
  [Session 08](08-distributed-semantics-quantitative-cohomology-2026-06-08.md) §3 (B-abelian).
- **Read-with:** the Session-01 register discipline (no shared currency between truth-support
  and any other scale) governs here too — a Fisher–Rao/KL *distance* is a different register
  from the log-odds *weight*, and must not be summed into it.
