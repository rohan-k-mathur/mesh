# C011 — The additive structure of the translated Ludics designs corresponds to the branching of preferred / stable argument games

- **status:** open (filed 2026-06-03 from the Phase-3 close of [T005](../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md); the additive-free boundary of T005 is the hypothesised grounded/preferred divide)
- **ring:** core
- **depends-on:** [T005](../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md) (the grounded, additive-free base case this generalises); [C010](C010-grounded-orthogonality-bridge.md) (the grounded biconditional)
- **linked-open-questions:** Q-039 (registers this correspondence); Q-038 (the parent bridge question — stable/preferred branch)
- **positive-settlement:** a translation `⟦·⟧₊` extending [`buildDisputeDesign`](../../lib/bridge/dispute.ts) into the **additive** Ludics fragment (`&`/`⊕`) together with a keystone-style lemma showing the preferred (resp. stable) discussion game of Modgil–Caminada is strategy-preservingly isomorphic to interaction of the additively-translated designs — migrate to [`../02_THEOREMS_AND_PROOFS/`](../02_THEOREMS_AND_PROOFS/)
- **negative-settlement:** a finite AF whose preferred/stable acceptance cannot be recovered by **any** additive quantifier over `stepInteraction`-orthogonality of the translated designs — i.e. the additive connectives are shown insufficient (or unnecessary) to capture the game branching — restricting the bridge permanently to the grounded fragment
- **bibliography:** Modgil & Caminada 2009 (preferred discussion games); Vreeswijk & Prakken 2000 (credulous/skeptical dispute games); Caminada 2006; Girard 2001 *Locus Solum* §"additives"; in-repo [T005](../02_THEOREMS_AND_PROOFS/T005-grounded-ludics-keystone.md), [session 02 §1](../10_IDEATION_SESSIONS/02-foundational-bridge-dung-ludics-2026-06-02.md)
- **scoping-session:** [session 12 — the additive frontier](../10_IDEATION_SESSIONS/12-additive-frontier-preferred-stable-multiagent-2026-06-14.md) (clusters this conjecture's *vertical / semantics* axis with the *horizontal / participant* axis [C002](C002-reading-c-conservative.md) under one shared `&`/`⊕` translation layer; grades stable as tractable and preferred as the maximality obstruction; fixes the build order); [session 21 — the shared additive layer](../10_IDEATION_SESSIONS/21-additive-layer-translation-spec-stable-first-2026-06-28.md) (opens the build: the `⟦·⟧₊` translation spec + the stable-first differential; finds the kernel exposes **one** exclusive-superposition primitive with the `&`/`⊕` duality carried by the design-pool quantifier)
- **last-reviewed:** 2026-06-28
- **partial-settlement:** stable + preferred-admissibility settled via the realizability trichotomy [T015](../02_THEOREMS_AND_PROOFS/T015-additive-realizability-keystone.md) (**established**, cross-checked 2026-06-28; one-shot reading); `⊆`-maximality shown non-interactive (the constraint, not a verdict). Residual: full strategy-iso for the general preferred game + n-unbounded mechanisation

## Statement

T005 proves the grounded biconditional on the **multiplicative, additive-free**
fragment of Ludics, and pins that boundary as load-bearing: the grounded
discussion game `G(F, a)` is **single-line** — one dispute, deterministic descent
along strictly-decreasing argument rank — which is exactly why the translation
[`buildDisputeDesign`](../../lib/bridge/dispute.ts) never needs the additive
connectives. The keystone lemma's reduction of the canonical predicate to a plain
alternating walk (Lemma A) holds *because* there is no branching to encode.

The preferred and stable discussion games (Modgil & Caminada 2009; Vreeswijk &
Prakken 2000) are **not** single-line: they are branching, requiring the credulous
proponent to maintain a defence against an opponent who may *choose* among
multiple attack lines, and (for skeptical/grounded-vs-credulous distinctions) the
proponent to *choose* among multiple defences. This conjecture asserts that this
game-theoretic branching is, on the Ludics side, **exactly** what the additive
connectives encode:

> **`&` (the opponent's external choice of which test to run) and `⊕` (the
> proponent's internal choice of which defence to commit) are the precise
> Ludics-side image of the disjunctive branching that separates the preferred /
> stable argument games from the grounded game.**

Concretely: let `⟦·⟧₊` be an additive extension of the bridge translation that
sends an argument with several alternative defences to a `⊕`-superposition of
Proponent designs, and the opponent's alternative attack lines to a
`&`-superposition of Opponent tests. Then for the appropriate design-space
quantifier over canonical orthogonality (`stepInteraction` ⇓ †):

> `a` is **credulously accepted** under preferred semantics ⟺ some `⊕`-branch of
> `⟦a⟧₊⁺` is orthogonal to every `&`-branch of the opponent behaviour;

with the dual quantifier ordering for **skeptical** acceptance, and the
conflict-free / all-attacking labelling constraint for **stable**.

If true, the additive-free boundary of T005 is not an artefact of the proof
technique but **coincides with the grounded/preferred divide of abstract
argumentation** — and the additive Ludics fragment is the right intermediate
calculus telling Phase 4 which additive designs `buildDisputeDesign` must emit
when lifted past grounded, rather than a translation to be guessed.

## Why now (provenance)

Raised at the close of Phase 3 (T005 established, 2026-06-03) when the
additive-free boundary was confirmed load-bearing rather than incidental. The
argument-games literature (Modgil–Caminada) is, for the grounded case, only a
citation — `dispute.ts` already implements the standard Caminada `G`-game and
Lemma C is its known adequacy result. Its genuine research value is here:
identifying the games framework as the *intermediate* calculus between Dung
semantics and additive Ludics, so the preferred/stable lift (Q-038's open branch,
[session 02 §1](../10_IDEATION_SESSIONS/02-foundational-bridge-dung-ludics-2026-06-02.md))
starts from a stated hypothesis with the literature attached.

## Settlement path (deferred — Phase 4)

Not to be pursued immediately. The intended order, when taken up:

1. Formalise the preferred discussion game (Modgil–Caminada) over the same
   `AF`/`attackersOf` substrate as [`dispute.ts`](../../lib/bridge/dispute.ts).
2. Specify `⟦·⟧₊` on the additive fragment; identify the `&`/`⊕` placement from
   the game's branch points.
3. Test-then-prove, as for T005: differential-test the additive quantifier
   against the consolidated preferred/stable engine in
   [`lib/argumentation/labelling.ts`](../../lib/argumentation/labelling.ts) over
   `allAFs(n)`, then attempt the keystone-style lemma. The `stepCore` kernel
   ([`packages/ludics-engine/stepCore.ts`](../../packages/ludics-engine/stepCore.ts))
   already carries the additive-violation / `isAdditive` path, so the engine side
   is ready to be exercised on additive designs.
