# C016 — There is an epistemological-principle layer beneath the T003 trilemma: the CQ-bundle is *derived* from a scheme's epistemological principle, upgrading "scheme identity is its critical questions" from a definition to a theorem

- **status:** open
- **ring:** core
- **depends-on:** [T003](../02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md) (the resolved behaviour/presentation/protocol trilemma whose CQ-bundle pivot this would re-found); the C006/C007/C008 cluster; the mechanized [`mechanisation/agda/hott/Scheme.agda`](../mechanisation/agda/hott/Scheme.agda) (`behaviour-univalence = univalence`, CQs as elimination obligations — the result this would supply a *why* for)
- **linked-open-questions:** [Q-048](../01_OPEN_QUESTIONS_REGISTRY.md#q-048) (the question this conjecture would close); [Q-047](../01_OPEN_QUESTIONS_REGISTRY.md#q-047) (the practical-argument family supplies the local stratum's worked instance); [Q-017](../01_OPEN_QUESTIONS_REGISTRY.md#q-017) (CQ recursion, if CQs become generated)
- **source:** [Session 11](../10_IDEATION_SESSIONS/11-lumer-practical-arguments-2026-06-12.md) §7
- **last-reviewed:** 2026-06-12

## Statement

[T003](../02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md) presents a
well-formed scheme as the fibered product

$$
S \;=\; \llbracket S\rrbracket \;\times_{\mathrm{CQ}(S)}\; \mathcal S_S \;\times_{\mathrm{CQ}(S)}\; \pi_S
$$

over its critical-question bundle $\mathrm{CQ}(S)$, which is treated as the
**primitive** shared pivot of the three layers (behaviour C006 / presentation
C007 / protocol C008). The univalence result mechanized in
[`hott/Scheme.agda`](../mechanisation/agda/hott/Scheme.agda) cashes the slogan
"scheme identity is behaviour-extensional" with CQs as the eliminators — but
*why* the CQs are the eliminators is, at present, a **modeling stipulation**,
not a theorem.

**Conjecture.** There is a fourth layer beneath the trilemma — an
**epistemological principle** $P(S)$ — such that the CQ-bundle is its image
under a *validity-conditions* operator:

$$
\mathrm{CQ}(S) \;=\; \mathrm{VC}\bigl(P(S)\bigr),
$$

and $P(S)$ is **definable independently of** $\mathrm{CQ}(S)$ with a
**faithfulness** $P(S) \cong \mathrm{CQ}(S)$. Under this layer, $\mathrm{CQ}(S)$
ceases to be primitive: scheme identity is the epistemological principle, the
CQ-bundle is its faithful image, and "**a scheme's identity is its critical
questions**" becomes a **theorem** (with $P(S)$ the load-bearing middle term)
rather than a definition — supplying the "missing why" for the mechanized
univalence result.

The conjecture has two strata:

- **Local (practical family) — the discovery/warm-up stratum.** For the
  Lumerian practical-argument family ([Q-047](../01_OPEN_QUESTIONS_REGISTRY.md#q-047)),
  $P(\text{practical})$ is the **decision-theoretic choiceworthiness principle**
  ("an option is choiceworthy iff it maximizes expected desirability under the
  declared profile"). Its validity conditions — *all relevant consequences
  covered* (the completeness assumption), *correct consequence probabilities*,
  *justified dimension weights*, *adequate alternatives set*, plus
  *partition-adequacy* for the Pascal subfamily — are exactly the spec §6
  critical questions, derivable by analyzing what could make the
  expected-desirability computation wrong. This stratum makes the spec's claim
  "CQs are derived from the validity conditions of the practical epistemological
  principle, one per condition" precise.

- **Universal (all schemes) — the theorem-target.** A uniform operator
  $P(\cdot)$ on the production catalogue with a faithfulness result, so that the
  upgrade holds for *every* scheme.

## Setting / vocabulary

- $\mathrm{VC}(P)$ — the (finite) set of validity conditions of an
  epistemological principle $P$: the conditions whose joint satisfaction the
  principle requires for thesis-acceptability (Lumer's "conditions of
  epistemological principles that guarantee thesis-acceptability").
- $P(S)$ — the epistemological principle a scheme $S$ instantiates. The
  **independence requirement**: $P(S)$ must be statable without reference to
  $\mathrm{CQ}(S)$, on pain of vacuity (see negative settlement).
- Faithfulness $P(S)\cong\mathrm{CQ}(S)$ — the validity conditions both
  *determine* the principle (no two distinct principles share a VC-set up to the
  relevant equivalence) and are *determined by* it.

## Positive settlement

**Local.** A written derivation exhibiting, for the practical family:
(a) $P(\text{practical})$ stated independently of its CQs (the decision rule);
(b) $\mathrm{CQ} = \mathrm{VC}(P(\text{practical}))$ recovering the spec §6 list
one-per-condition; (c) faithfulness. Filed against
[Q-048](../01_OPEN_QUESTIONS_REGISTRY.md#q-048); upgrades "identity = CQs" to a
theorem *for the practical family*.

**Universal.** A uniform $P(\cdot)$ with a faithfulness theorem across the
production catalogue, with the T003 fibered product re-expressed over
$\mathrm{VC}(P(S))$ rather than over a primitive $\mathrm{CQ}(S)$, and the
mechanized `hott/Scheme.agda` eliminator-status derived from $P$. Migrated to
`T-NNN-epistemological-principle-layer.md` with `closes: Q-048`.

## Negative settlement

Either of the following refutes the conjecture *as a universal claim* (and
likely confines any surviving content to the local practical stratum):

- **Vacuity (the principal route).** There is a production scheme — most
  plausibly a presumptive pattern whose CQs were attached post hoc as
  default-exception pointers (e.g. argument from analogy, slippery-slope) — for
  which $P(S)$ **cannot be defined independently of** $\mathrm{CQ}(S)$. Then the
  independence requirement fails, faithfulness is empty, and the "fourth layer"
  is a **rename** of the CQ-bundle rather than a derivation of it: T003's pivot
  stays primitive and `hott/Scheme.agda` keeps its stipulative status.
- **Non-faithfulness.** $P(\cdot)$ is definable but two schemes with distinct
  CQ-bundles share a principle (or vice versa), so $P(S)\not\cong\mathrm{CQ}(S)$
  and "identity = CQs" does not follow from "identity = principle."

A negative result is itself a programme finding: it pins scheme-identity to the
CQ-bundle as genuinely primitive (vindicating T003's modeling choice and the
mechanized univalence result as a *definition*, with no deeper "why" available).

## Consequences if confirmed

- **Universal:** the T003 trilemma gains a fourth, generative layer; the
  fibered-product pivot is re-founded on $\mathrm{VC}(P(S))$; "scheme identity is
  its critical questions" becomes a theorem; the admin's "Generate from
  Taxonomy" CQ generator ([`lib/argumentation/cqGeneration.ts`](../../lib/argumentation/cqGeneration.ts))
  becomes *principled* (CQs derived from $P$) rather than heuristic, bearing on
  [Q-013](../01_OPEN_QUESTIONS_REGISTRY.md#q-013).
- **Local only:** the practical family's CQs are generated rather than curated —
  which is exactly what the [Q-047](../01_OPEN_QUESTIONS_REGISTRY.md#q-047)
  per-instance CQ machinery would consume, and removes the need to hand-author
  the practical family's critical questions.

## Relation to neighbouring artifacts

- **T003.** C016 is *not* independent of the trilemma (unlike
  [C009](C009-scheme-rivalry-fourth-attack.md), which is): it proposes to
  re-found T003's CQ-bundle pivot. A positive universal settlement would *extend*
  T003, not contradict it (the three layers remain; their shared pivot acquires
  a generator).
- **C009 / Q-016.** Distinct. C009 adds a fourth *attack category*
  (scheme-rivalry); C016 adds a fourth *ontological layer* (the epistemological
  principle). Session 11 §8 records that the Lumerian material also supplies a
  candidate C009 witness (Burkholder/Pascal) — that hand-off is to
  [session 10](../10_IDEATION_SESSIONS/10-scheme-rivalry-fourth-attack-2026-06-12.md),
  independent of C016.
- **Q-049.** The interaction/epistemology synthesis (does T005
  strategy-preservation survive a typed test space + concession locus) is
  *adjacent but distinct*: Q-049 is about how the **interaction layer** consumes
  the epistemological layer's typing of the Opponent; C016 is about whether the
  epistemological layer *exists as a derivation source* at all. C016 positive
  would supply Q-049 its "well-formed attack types" cleanly (they are
  $\mathrm{VC}(P(S))$).

## Bibliography

- [`02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md`](../02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md) — the trilemma and the CQ-bundle pivot.
- [`mechanisation/agda/hott/Scheme.agda`](../mechanisation/agda/hott/Scheme.agda) — `behaviour-univalence = univalence`, CQs as eliminators (the result needing a "why").
- Lumer, C. 2011 *A Theory of Philosophical Arguments* / *Practical Theory of Argumentation* — argument types as epistemological, validity = satisfaction of an epistemological principle's conditions.
- Walton, Reed & Macagno 2008 *Argumentation Schemes* — CQs as pointers to default exceptions (the post-hoc attachment that grounds the vacuity risk).
- Macagno & Walton 2015 — scheme classification.
- [`docs/Lumer and Isonomia Research.md`](../../docs/Lumer%20and%20Isonomia%20Research.md) — the fourth-layer claim and the "missing why" framing.
- [`docs/Practical Argumentation Research for Isonomia.md`](../../docs/Practical%20Argumentation%20Research%20for%20Isonomia.md) §6 — CQs derived from validity conditions (the local stratum's source).
- [Session 11](../10_IDEATION_SESSIONS/11-lumer-practical-arguments-2026-06-12.md) §7 — the test against T003 and the (a)/(b)/(c) decomposition.
