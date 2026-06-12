# Researcher Collaboration Prospectus

> Status: **active**, seeded 2026-06-08. This document answers a single question:
> *if the programme could one day collaborate with a dedicated researcher working
> in pure / applied mathematics and logic, what foundational research would be
> most worth a multi-year investment* — judged jointly by mathematical ceiling,
> exportability beyond the platform, and a credible path into implementation. It
> sits one level above [`09_FUTURE_DIRECTIONS_BRAINSTORM.md`](09_FUTURE_DIRECTIONS_BRAINSTORM.md)
> (which lays out the six-direction spine) and is written *for a hypothetical
> external collaborator* rather than for the programme's future selves. It does
> not assert results; it ranks bets and names the two directions the current
> programme under-weights, each filed as an open question
> ([Q-044](01_OPEN_QUESTIONS_REGISTRY.md#q-044), [Q-045](01_OPEN_QUESTIONS_REGISTRY.md#q-045)).

---

## 0. The selection principle

A dedicated researcher will not commit to "engineering dressed as theory." The
collaborations worth offering sit where three conditions coincide:

1. **Mathematical ceiling.** The result is deep and publishable *on its own
   terms* — it lands in a real mathematical literature, not only in a product
   spec.
2. **Load-bearing.** The theorem underwrites a claim the platform currently
   *asserts*, so settling it converts marketing into a corollary (the
   programme's through-line; see [`00_CHARTER.md`](00_CHARTER.md) §0).
3. **Short path to implementation.** The object the theorem is about already
   exists in the codebase, so "prove it" and "ship it" are not separated by a
   reimplementation.

Everything below is ranked against those three. Two of the candidates
(§4) are *new* — they are the angles a fresh researcher could open that the
existing six-direction spine does not emphasise, and they score highest on
criterion (3).

---

## 1. The headline bet — cohomology of disagreement

**Discipline:** sheaf theory / applied algebraic topology (the
Abramsky–Brandenburger contextuality lineage; Ghrist / Robinson sheaf-theoretic
data fusion).

**Direction:** 4 — Distributed semantics
([`09_FUTURE_DIRECTIONS_BRAINSTORM.md`](09_FUTURE_DIRECTIONS_BRAINSTORM.md) §4).

**The question.** Treat the Plexus as a *site* (rooms as objects, transport
relationships as covers), local argument structures as a sheaf (a stack) over
it, and make "when do locally-reached agreements glue into a global one?" a
gluing question whose obstruction is a cohomology class — irreducible, non-local
disagreement as a non-trivial $H^1$.

**Why a mathematician wants it.** "This disagreement is a non-trivial cohomology
class, not a misunderstanding" is the exact structure Abramsky used to make
quantum contextuality respectable (local consistency, global inconsistency, the
obstruction in a cohomology group), ported to an entirely new domain. That is a
contribution to applied topology independent of the platform.

**Implementation payoff.** A *computable* invariant on the live Plexus graph. The
single most striking theoretical export the platform could ship.

**Why it is tractable now — the gate is open.** The bicategory-coherence
prerequisite is discharged: [T010](02_THEOREMS_AND_PROOFS/T010-plexus-coherence-pseudofunctor.md)
(established, cross-checked 2026-06-08) proves transport is a pseudofunctor
exactly on the iso-monodromy-free sub-bicategory $\mathcal{P}^\circ$, and
[T011](02_THEOREMS_AND_PROOFS/T011-possibilistic-cohomology-iso-monodromy.md)
(established 2026-06-08) already identifies the possibilistic Čech $H^1$ with
that monodromy obstruction. **The connection is defined; computing its curvature
is now well-posed.** The live frontier is exactly [Q-043(iii)](01_OPEN_QUESTIONS_REGISTRY.md#q-043)
(an *organic* non-trivial class) and the parked abelian / $\mathbb{R}$-valued
*quantitative* companion (magnitude of disagreement), gated on a per-edge
transport-weight modelling decision ([Q-042](01_OPEN_QUESTIONS_REGISTRY.md#q-042)
quantitative offshoot). A dedicated topologist would own the quantitative
companion and the live-witness program.

This is the one to hire *for* if only one seat is funded.

---

## 2. Strong, self-contained programs (each ownable for a year or more)

### 2.1 Graded / quantitative Ludics — the proof↔argument collapse
**Discipline:** proof theory + semiring-enriched semantics (Laird–Manzonetto–McCusker–Pagani
weighted relational models; Ehrhard's differential linear logic).
**Direction:** 3 — Quantitative core. The confidence *fork* is settled to a
log-odds / weight-of-evidence semiring ([Session 01](10_IDEATION_SESSIONS/01-confidence-algebra-semiring-vs-quantale-2026-06-02.md)),
but **graded Ludics as a categorical object** — designs carrying semiring
weights, interaction computing a graded convergence degree, with a
cut-elimination theorem — is wide open. The prize, kept honestly open in the
brainstorm, is that *classical proof is the Boolean-graded fragment of defeasible
deliberation.* **Payoff:** one algebraic object unifying convergence and
confidence, replacing the bolted-on quantitative layer. **Status caveat:** the
Lawvere-enrichment prize is *parked* (the log-odds semiring is non-idempotent);
this direction is the semiring half, not the enrichment half.

### 2.2 The realizability boundary of argumentation semantics
**Discipline:** game semantics ∩ nonmonotonic reasoning.
**Direction:** 1 — Foundational bridge. [T005](02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md)
nailed grounded ⇔ Ludics-orthogonality (strategy-preserving);
[C011](03_CONJECTURES/C011-additive-preferred-games-bridge.md) conjectures
additives ⇔ preferred/stable branching. A dedicated logician could complete the
map (grounded / preferred / stable / semi-stable / ideal ↔ Ludics connectives)
and — the more interesting outcome — *characterise the obstruction* where
preferred-semantics maximality has no interactive counterpart. **An impossibility
theorem ("these semantics are not interactively realizable") is as valuable as
the positive bridge.** **Payoff:** certifies exactly which extension semantics
the platform may certify by orthogonality testing rather than fixpoint
computation.

### 2.3 Mechanized Ludics core
**Discipline:** dependent type theory / proof assistants.
**Direction:** 5 — Mechanization. A machine-checked Ludics kernel (associativity
of interaction, separation, internal completeness) essentially **does not exist**
in twenty years of literature — a proof-theory contribution fully independent of
the product. Pair it with scheme-as-dependent-type and
scheme-identity-as-behavioural-(univalent)-equality (the C006/C007/C008 trilemma,
resolved on paper by [T003](02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md),
in a HoTT setting). The sequencing is already scoped
([Session 09](10_IDEATION_SESSIONS/09-mechanization-ludics-core-sequencing-2026-06-08.md)):
the corroboration track is healthy, the *constitutive* core (the interaction
engine instantiating the abstract `Biorthogonal` already in `lib/Closure.agda`)
is unstarted. **Most tractable of the deep bets; the discipline already exists.**
**Payoff:** an extractable, certified kernel; the M3 separation milestone *fuses*
with Direction 2's minimality certificate.

### 2.4 Categorical foundations of the substrate
**Discipline:** pure category theory.
**Direction:** 3 / 4 internal. The parked Lawvere-enrichment prize, the
Ambler-remainder [C001b′](03_CONJECTURES/C001b-prime-ambler-remainder.md),
convergence-as-colimit [C005](03_CONJECTURES/C005-behaviours-directed-system.md),
joint-saturation-as-closure [C004](03_CONJECTURES/C004-joint-saturation-closure.md).
Lower exportability (more internal-facing), but the natural home for a category
theorist and the place that tidies the conceptual core. Ranked below §2.1–2.3
unless the hire's taste points squarely here.

---

## 3. Triage by researcher background

| If the hire is a… | First seat | Second seat |
|---|---|---|
| Topologist / geometer | §1 cohomology of disagreement | §4.2 information geometry of confidence |
| Proof theorist / logician | §2.2 realizability boundary | §2.1 graded Ludics |
| Type theorist | §2.3 mechanized core | §2.2 realizability boundary |
| Theoretical computer scientist | §4.1 complexity of the primitives | §1 cohomology (algorithms) |
| Applied mathematician (stats / IG / OT) | §4.2 information geometry | §2.1 graded Ludics |
| Category theorist | §2.4 categorical foundations | §2.1 graded Ludics |

---

## 4. Two directions the programme currently under-weights

These are where a *fresh* researcher adds something the six-direction spine does
not. Both score highest on selection criterion (3) — the object already exists,
so the path to implementation is the shortest on this entire document. Each is
filed as an open question.

### 4.1 Complexity theory of the core operations — [Q-044](01_OPEN_QUESTIONS_REGISTRY.md#q-044)
**Discipline:** computational complexity / algorithms.
The programme proves its primitives are *computable* — first-divergence locus in
one pass ([T006](02_THEOREMS_AND_PROOFS/T006-first-divergence-locus-e0.md)),
minimal separating context ([T008](02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md)/[T009](02_THEOREMS_AND_PROOFS/T009-branching-smyth-minimal-separating-context.md)),
orthogonality testing, biorthogonal closure, $H^1$ rank — but it **almost never
asks how expensive they are.** A complexity theorist could classify the cost of
each substrate primitive, isolate the tractable fragments, and design
approximation / streaming algorithms for the live system. **This is the most
directly implementation-relevant item on the entire prospectus and it is nearly
absent from the registry.** Deliverable: a complexity classification of the
substrate's primitives plus provably-correct fast paths. *The vital one.*

### 4.2 Information geometry of the confidence space — [Q-045](01_OPEN_QUESTIONS_REGISTRY.md#q-045)
**Discipline:** information geometry / optimal transport.
The programme just committed to a **log-odds / weight-of-evidence** semiring for
confidence ([Session 01](10_IDEATION_SESSIONS/01-confidence-algebra-semiring-vs-quantale-2026-06-02.md)).
Log-odds *is* the natural parameter of a Bernoulli exponential family — which
means the principled geometry of confidence is the **Fisher–Rao metric**,
aggregation becomes a **geodesic / Bregman** operation, and "distance between two
positions" acquires a *canonical* metric rather than an ad-hoc one. An applied
mathematician could turn the *algebra* decision into a *geometry*, yielding
principled aggregation, a metric on positions, and a plausible tie to the
quantitative-cohomology session ([Session 08](10_IDEATION_SESSIONS/08-distributed-semantics-quantitative-cohomology-2026-06-08.md),
where the $\mathbb{R}$-valued companion needs exactly a principled per-edge
magnitude). This fits the resolved confidence fork better than anyone has yet
noticed. Deliverable: a Fisher–Rao / Bregman geometry of the confidence space
with a canonical position metric and aggregation rule.

---

## 5. The through-line

Every direction here takes something the platform currently *asserts* and asks
for the theorem that makes it a *consequence* — the discipline the programme is
strongest at. The two additions in §4 are recommended precisely because they are
the most under-served relative to their payoff: **complexity of the primitives**
is the cheapest path to implementation, and **cohomology of disagreement** is the
highest ceiling whose prerequisite is now discharged.

### Pointers
- Spine: [`09_FUTURE_DIRECTIONS_BRAINSTORM.md`](09_FUTURE_DIRECTIONS_BRAINSTORM.md)
- Moat / what is original: [`11_NOVEL_CONTRIBUTIONS_AND_MOAT.md`](11_NOVEL_CONTRIBUTIONS_AND_MOAT.md)
- Staging sessions: [`10_IDEATION_SESSIONS/`](10_IDEATION_SESSIONS/)
- New questions opened by this document: [Q-044](01_OPEN_QUESTIONS_REGISTRY.md#q-044) (complexity), [Q-045](01_OPEN_QUESTIONS_REGISTRY.md#q-045) (information geometry)
