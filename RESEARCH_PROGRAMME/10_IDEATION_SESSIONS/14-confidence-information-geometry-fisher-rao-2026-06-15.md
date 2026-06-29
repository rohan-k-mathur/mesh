# Session 14 — Information geometry of confidence: is the log-odds line Fisher–Rao? (Q-045)

**Date:** 2026-06-15
**Direction:** 8 — Information geometry of confidence (`12_RESEARCHER_COLLABORATION_PROSPECTUS.md` §4.2; the prospectus direction the six-direction spine under-weights)
**Status:** **Scoping — OPEN** (no production code changed, no theorem proved). This session frames [Q-045](../01_OPEN_QUESTIONS_REGISTRY.md#q-045), writes the Fisher–Rao metric on the single-claim confidence line, runs the one decisive check the registry's `next-action` names (is log-odds addition the geodesic operation?), and records a **strong preliminary finding** that splits the question into a *ratified-aggregation* half and an *open-metric* half. It does **not** settle the position-metric lift or the correlation-structure obligation.
**Update 2026-06-25 — build-order steps 1–2 DONE:** F1 is written up rigorously and closed in [Session 14a](14a-F1-logodds-eflat-ratification-2026-06-25.md) (the $e$-flat/$m$-flat/Fisher–Rao trichotomy + the log-odds-addition = sum-of-natural-parameters = Bayesian-independent-evidence-fusion identity, against the `corroborateProbs` worked example). F2 is decided in [Session 14b](14b-F2-position-distance-fisherrao-vs-kl-2026-06-25.md): the position *distance* is **two non-substitutable registers** — Fisher–Rao $d_{FR}$ (symmetric metric, clustering/nearest) and KL = Bregman-of-$\psi$ (asymmetric divergence, directed disagreement/transport) — adopted **both, tagged by use**. The build order below advances to **step 3 (settle O1, the correlation obligation — the gating item)**.
**Update 2026-06-27 — build-order step 3 (O1) DONE:** O1 is resolved in [Session 14c](14c-O1-correlation-pullback-induced-2026-06-27.md) as a **dichotomy**: graph-mediated correlation is **canonically induced** — a position lives on the DAG-image submanifold and inherits the **pullback** $\Phi^*g$ of the product Fisher–Rao/Bregman metric through the existing reducer map $\Phi$, off-diagonal terms = shared-premise Jacobian cross-terms, closed-form in `logodds` mode, **no schema change** (shared-premise corr $\approx0.49$ vs $0$ unshared); exogenous correlation (no graph path) is **out-of-model by design** and its repair reduces to adding a graph node (back to the induced case). **Net: F1+F2+O1 settle Q-045's core.**
**Update 2026-06-27 — build-order step 4 (B-abelian offshoot) DONE — NEGATIVE:** [Session 14d](14d-step4-babelian-offshoot-refuted-2026-06-27.md) **refutes** the §5 conjecture. Every F2/F1 magnitude is node-derived, so it fails **B2b**'s requirement of a node-independent edge datum ($\Delta w$ = the killed coboundary; KL = not an oriented cochain; antisym-KL = spurious non-coboundary nonzero on coherent cycles). Confidence geometry cannot supply the B-abelian per-edge weight; B-abelian stays gated behind its exogenous meaning-decision ([Q-042](../01_OPEN_QUESTIONS_REGISTRY.md#q-042)). **Q-045 is now fully resolved — core (F1+F2+O1) + offshoot (refuted); no build-order item remains.**
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

**— RESOLVED 2026-06-27, [Session 14c](14c-O1-correlation-pullback-induced-2026-06-27.md): branch (a).** A position is not a free point in the product family — derived claims are *computed from* their premises by the reducer map $\Phi$, so a position lives on the **DAG-image submanifold** and the canonical position metric is the **pullback** $\Phi^*g = J^{\mathsf T} g\,J$ (Fisher–Rao) / the $\Phi$-pushed Bregman (KL), whose off-diagonal terms are the shared-premise Jacobian cross-terms — **induced, closed-form in `logodds` mode, no schema change** (verified: shared-premise corr $\approx0.49$ vs $\approx0$ unshared). The residual (b) — *exogenous* correlation with no graph path — is **out-of-model by design** (epistemic dependence is *argued*) and its repair **reduces to adding a graph node** (latent common cause), landing back in (a). This **tightens** the independence hypothesis: it is on the **free inputs** (leaves/premises), not on all claims; derived claims' correlation is *computed, not posited*.

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

**— REFUTED 2026-06-27, [Session 14d](14d-step4-babelian-offshoot-refuted-2026-06-27.md).** This conjecture is **wrong**, for the reason **B2b** ([Session 08](08-distributed-semantics-quantitative-cohomology-2026-06-08.md) §1 / [Session 07](07-distributed-semantics-sheaf-cohomology-2026-06-07.md) §3.2) already supplies: a non-trivial $H^1(\mathbb{R})$ needs an edge datum **independent of the nodes**, but every F2/F1 magnitude is a function $f(p_{\mathrm{src}},p_{\mathrm{tgt}})$ of the node confidences. Tested on a *coherent* (zero-obstruction) cycle: $\Delta w$ telescopes to $0$ (the coboundary B2b killed), unsigned KL is not even an oriented 1-cochain (fires positive on every loop), and antisymmetrised-KL is a node-derived *non*-coboundary that is **nonzero on coherent cycles** (a false-positive "confidence-circulation" class). So confidence geometry is structurally the **wrong source**; F2/F1 supply only the *unit* (log-odds nats) and *functional form* (a Bregman discrepancy of an **edge-asserted alignment**), never the datum. B-abelian stays gated behind its exogenous meaning-decision ([Q-042](../01_OPEN_QUESTIONS_REGISTRY.md#q-042)) — the metric half does **not** unblock it.

## 6. Grades and build order

| Sub-claim | Grade | Why |
|---|---|---|
| §1 log-odds = Bernoulli natural parameter | **resolved (fact)** | Definitional; the migration already computes in $\theta$. |
| §2 Fisher–Rao metric on the single claim | **resolved (written)** | $ds^2 = dp^2/(p(1-p)) = p(1-p)\,dw^2$; spherical geodesics. |
| §3 F1 — aggregation = e-flat translation, ratified | **resolved (closed)** — [Session 14a](14a-F1-logodds-eflat-ratification-2026-06-25.md) | The rigorous write-up landed (2026-06-25): trichotomy + "sum of natural params = independent-evidence Bayes fusion" identity + the midpoint-vs-group-law sharpening, against the `corroborateProbs([0.6,0.6]) = 9/13` worked example. |
| §3 F2 — metric/divergence is a new object | **resolved (decided)** — [Session 14b](14b-F2-position-distance-fisherrao-vs-kl-2026-06-25.md) | **Both, tagged by use** (2026-06-25): $d_{FR}$ = the symmetric *metric* register ($\ell^2$ lift, bounded $\pi$ — clustering/nearest-position); KL = Bregman-of-$\psi$ = the asymmetric *divergence* register ($\ell^1$ lift, nats, dually-flat-canonical — directed disagreement/transport). Non-substitutable: clustering needs the metric KL lacks; directed cost needs the asymmetry $d_{FR}$ lacks. |
| §4 O1 — position lift / correlation | **resolved (closed)** — [Session 14c](14c-O1-correlation-pullback-induced-2026-06-27.md) | **Induced (branch a)** (2026-06-27): position = point on the DAG-image submanifold; canonical metric = pullback $\Phi^*g=J^{\mathsf T}gJ$ through the reducer $\Phi$; off-diagonal = shared-premise Jacobian cross-terms, closed-form, **no schema change** (corr $\approx0.49$ shared vs $0$ unshared). Exogenous (no-path) correlation is out-of-model by design; its repair reduces to a graph node. |
| §4 position lift (independent) | **partially scoped** | Product metric is immediate; the **correlation** case (O1) is the real work. |
| §5 feed B-abelian per-edge magnitude | **resolved (refuted)** — [Session 14d](14d-step4-babelian-offshoot-refuted-2026-06-27.md) | **Negative** (2026-06-27): F2 magnitudes are node-derived $f(p_{\mathrm{src}},p_{\mathrm{tgt}})$, so they fail **B2b**'s node-independence requirement — $\Delta w$ is the killed coboundary, KL is not an oriented cochain, antisym-KL is a spurious non-coboundary (nonzero on coherent cycles). Confidence geometry cannot supply the B-abelian weight; it supplies only the unit/form. B-abelian stays gated behind its exogenous meaning-decision. |

**Build order (when taken up):**
1. ~~**Write F1 up rigorously**~~ **— DONE 2026-06-25, [Session 14a](14a-F1-logodds-eflat-ratification-2026-06-25.md).** The e-flat/m-flat/Fisher–Rao trichotomy
   on Bernoulli + the "log-odds addition = Bayesian independent-evidence fusion = sum
   of natural parameters" identity, against the `corroborateProbs` worked example.
   This was the deliverable that *ratifies Session-01 geometrically* and the cheapest
   real result. **Verdict: ratifies** (corroboration = $e$-flat group law, non-idempotent
   by construction; the idempotence trade-off lives in the metric/join register, not here).
2. ~~**Choose the metric (F2)**~~ **— DONE 2026-06-25, [Session 14b](14b-F2-position-distance-fisherrao-vs-kl-2026-06-25.md).** Verdict: **both, tagged by use** —
   $d_{FR}$ (symmetric, bounded, triangle-inequality — "nearest position" / clustering)
   *and* KL = Bregman-of-$\psi$ (asymmetric, additive, dually-flat-canonical — "directed
   disagreement" / transport), in two **non-substitutable** registers (clustering needs the
   metric KL is not; directed cost needs the asymmetry $d_{FR}$ is not), mirroring
   Session-01's `min`-as-skeptical-projection discipline. Same-units trap flagged: KL is in
   nats like $w$, but a *displacement* not a *standing* — never summed into the weight.
3. ~~**Settle O1 (correlation)**~~ **— DONE 2026-06-27, [Session 14c](14c-O1-correlation-pullback-induced-2026-06-27.md).** Verdict: **induced (branch a)** — a position lives on the
   DAG-image submanifold, so the canonical position metric is the **pullback** $\Phi^*g=J^{\mathsf T}gJ$
   of the product Fisher–Rao/Bregman through the existing reducer map $\Phi$; off-diagonal
   terms = shared-premise Jacobian cross-terms, **closed-form in `logodds` mode, no schema
   change** (shared-premise corr $\approx0.49$ vs $0$ unshared). Exogenous (no-graph-path)
   correlation is *out-of-model by design* and its repair reduces to adding a graph node
   (back to branch a). Tightens the independence hypothesis to the **free inputs**, not all claims.
4. ~~**Test the B-abelian offshoot (§5)**~~ **— DONE 2026-06-27, [Session 14d](14d-step4-babelian-offshoot-refuted-2026-06-27.md): REFUTED.** Checked the [Session 14b](14b-F2-position-distance-fisherrao-vs-kl-2026-06-25.md) §6
   fork against [Session 08](08-distributed-semantics-quantitative-cohomology-2026-06-08.md) §3 / **B2b**: every F2/F1 magnitude is node-derived $f(p_{\mathrm{src}},p_{\mathrm{tgt}})$ and so fails B2b's
   node-independence requirement — $\Delta w$ is the killed coboundary, KL is not an oriented
   1-cochain, antisym-KL is a spurious non-coboundary (nonzero on coherent cycles).
   Confidence geometry cannot supply the B-abelian weight; B-abelian stays gated behind its
   exogenous meaning-decision. **No build-order item remains.**

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

- **FULLY RESOLVED** in [Q-045](../01_OPEN_QUESTIONS_REGISTRY.md#q-045). Core: F1 ([14a](14a-F1-logodds-eflat-ratification-2026-06-25.md)),
  F2 ([14b](14b-F2-position-distance-fisherrao-vs-kl-2026-06-25.md)), O1 ([14c](14c-O1-correlation-pullback-induced-2026-06-27.md))
  answer Q-045's core question — *the principled geometry is the Bernoulli information
  geometry, aggregation is the $e$-flat group law, and "distance between positions" acquires
  the two canonical registers, with the off-diagonal structure induced by the support DAG as
  a pullback*. Offshoot: the B-abelian per-edge-magnitude conjecture is **refuted** ([14d](14d-step4-babelian-offshoot-refuted-2026-06-27.md)) — confidence geometry is node-derived
  and cannot supply a node-independent edge weight (B2b). No build-order item remains.
- **If a consumer appears,** the position-distance function promotes to an
  [`IMPLEMENTATION_TRACKS.md`](../IMPLEMENTATION_TRACKS.md) item attaching to the
  evidential reducers (the pullback $\Phi^*g$ over the support DAG). The B-abelian route
  ([Session 08](08-distributed-semantics-quantitative-cohomology-2026-06-08.md) §3) keeps its
  **exogenous edge-weight** requirement — the F2 shortcut is closed — and is taken up, if
  ever, at its own meaning-decision, denominated in the F1 log-odds register.
- **Read-with:** the Session-01 register discipline (no shared currency between truth-support
  and any other scale) governs here too — a Fisher–Rao/KL *distance* is a different register
  from the log-odds *weight*, and must not be summed into it.
