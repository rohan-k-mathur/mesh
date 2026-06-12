# C014 — The Plexus transport pseudofunctor: multi-hop transport composes without provenance drift **iff** the claim-alignment 2-cells are invertible and the scalar band dedupes by ultimate origin

- **status:** **promoted → [T010](../02_THEOREMS_AND_PROOFS/T010-plexus-coherence-pseudofunctor.md)** (**established** — cross-checked / signed off by an independent non-author reader 2026-06-08). Filed 2026-06-07 (Direction 4, sub-program A — coherence). All discharges landed: A0 (audit), A1 (two-functor laws), A2 (2-cells + conjecture), discharge 1 (L1 strict-1-functor lemma), discharge 2 (L2 band origin-dedupe), discharge 3 (the coherence theorem — D1 bicategory data + W1–W3, D2 γ/pentagon/triangle, D3 the biconditional + 𝓟° = iso-closure, D4 faithfulness boundary), and H2 (probe refined to ECC inter-derivability). The consolidated statement + proof map now lives in **T010**; this file is retained as the conjecture-stage record. **No production code changed** — the gated PRs (L2 origin-dedupe band; strict materialization as default) are staged in T010's D5 follow-through, individually approved.
- **ring:** middle
- **depends-on:** [audit A0](../audits/a0-onehop-contract-laxity-vs-policy-2026-06-07.md) (obstruction is provenance, not categorical — object composition free, symbolic algebra strict+idempotent, scalar band is the blocker, laxity lives in materialization); [session 07 §1, §3.2](../10_IDEATION_SESSIONS/07-distributed-semantics-sheaf-cohomology-2026-06-07.md) (B2b: live obstruction is claim-map monodromy; ℝ-holonomy exact); [`tests/ecc.test.ts`](../../tests/ecc.test.ts) "A1 — two-functor composition" (object composition associative; transport strict; aggregation idempotent); [`lib/argumentation/ecc.ts`](../../lib/argumentation/ecc.ts) (`Functor`, `transport`, `compose`, `join`); [`lib/argumentation/transportAggregator.ts`](../../lib/argumentation/transportAggregator.ts) (the scalar band)
- **linked-open-questions:** [Q-042](../01_OPEN_QUESTIONS_REGISTRY.md#q-042)
- **last-reviewed:** 2026-06-07

---

## Setting

The Plexus is a bicategory **𝓟**:

- **objects** — deliberation rooms (each an ECC over [`lib/argumentation/ecc.ts`](../../lib/argumentation/ecc.ts): claims = objects, argument arrows = morphisms, `join` = the SLat structure).
- **1-morphisms** $F: \mathcal{D}_A \to \mathcal{D}_B$ — transport functors, backed by `RoomFunctor.claimMapJson`: a **partial map on claims** `mapClaim: id ↦ string | null` together with the arrow action `transport(F, ·)` that relabels endpoints and **carries derivations verbatim** (A0 §1.2: strict on the symbolic layer).
- **2-morphisms** — *defined here*, the missing layer the architecture doc leaves as "future work" ([`CATEGORICAL_FOUNDATIONS_ARCHITECTURE.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/CATEGORICAL_FOUNDATIONS_ARCHITECTURE.md) §7.1).

### Definition (claim-alignment 2-cell)

`claimMapJson` is **non-unique**: two authors (or one author at two times) can align the claims of room $A$ to room $B$ differently. Let $F, F': \mathcal{D}_A \to \mathcal{D}_B$ be two such transport functors. A **2-cell** $\alpha: F \Rightarrow F'$ is, exactly as a natural transformation into the ECC,

$$\alpha \;=\; \big(\, \alpha_c : F(c) \to F'(c) \,\big)_{c \in \mathrm{Ob}(\mathcal{D}_A)}$$

a family assigning to each source claim $c$ an **arrow in room $B$** from $F(c)$ to $F'(c)$ — i.e. an argument in $B$ deriving the $F'$-image from the $F$-image — subject to the naturality square for every source arrow $f: c \to c'$:

$$F'(f) \circ \alpha_c \;=\; \alpha_{c'} \circ F(f).$$

**Reading.** $\alpha_c$ is an **alignment witness**: "the claim $A.c$ is mapped by alignment $F$ and alignment $F'$ to two $B$-claims that are *inter-derivable*." When every $\alpha_c$ is **invertible** in the ECC (a two-way derivation, an iso arrow), $F$ and $F'$ are interchangeable — the alignment carries no obstruction. When some $\alpha_c$ is **non-invertible or absent** (no $B$-arrow $F(c) \to F'(c)$, e.g. because the claim **drops** — `mapClaim` returns `null` — or **drifts** to a non-inter-derivable claim), the 2-cell is degenerate.

### The unifying identification (the prize of A2)

> **B2b's claim-map monodromy is exactly non-invertible 2-cell holonomy.**

Walking a directed cycle $A\to B\to C\to A$ composes the transport functors and lands a start claim back in room $A$. The composite is a 1-endomorphism $W: \mathcal{D}_A \to \mathcal{D}_A$ (the **monodromy functor**). The canonical comparison 2-cell $\eta: \mathrm{id}_{\mathcal{D}_A} \Rightarrow W$ is exactly the per-claim round-trip witness:

- **closed** (B2b) $\iff$ $\eta_c$ is the identity arrow ($W(c) = c$, no drift);
- **drifted** (B2b) $\iff$ $\eta_c$ is a non-identity (possibly non-invertible) arrow $c \to W(c)$;
- **dropped** (B2b) $\iff$ $\eta_c$ is undefined (no image; the partial functor has no arrow to witness).

So the empirical B2b run *measured the 2-cell $\eta$ on live data* and found one non-invertible component (the dropped claim). The ℝ-holonomy being **exact** (B2b: $\sum\delta w = 0$) is the statement that, *on claim-closed loops* ($\eta_c = \mathrm{id}$), there is no further quantitative obstruction in the node-potential connection — consistent with the 2-cell being trivial there.

---

## The conjecture

Let $A \xrightarrow{F} B \xrightarrow{G} C$ be composable transport functors, with $G\circ F$ the object-level composite (partial-map composition, A1: associative, total-where-defined). Write $\mathrm{band}(\cdot)$ for the scalar `local/imported/total` contribution computed by [`transportAggregator.ts`](../../lib/argumentation/transportAggregator.ts).

> **C014 (Plexus transport pseudofunctor).** Multi-hop transport along $G\circ F$ is **sound** — equal, as both a symbolic ECC arrow *and* a scalar band, to the iterated one-hop transport, with provenance auditable to ultimate source — **if and only if**
>
> 1. **(no monodromy / pseudo)** the canonical comparison 2-cells of the lax functor structure are **invertible** — concretely, the alignment 2-cells along the path compose to an invertible 2-cell, so no claim drifts or drops across the hops; **and**
> 2. **(band dedupe)** the scalar reducer `reduceImportedScores` **dedupes by ultimate origin** — i.e. each `sources[]` entry carries the full transport path, not just the immediate predecessor, so a source reached by two paths corroborates **once**.
>
> Equivalently: **the sub-bicategory of 𝓟 on which transport is a pseudofunctor is exactly the claim-map-monodromy-free, path-provenance-complete region** — and off it, the one-hop contract ([ECC plan §4 row 2](../../lib/argumentation/ecc.ts)) is the correct conservative default.

Two corollaries make it concrete:

- **(C014.a — laxity is materialization, not algebra.)** The symbolic `transport` is strict (A0 §1.2), so the *only* source of non-invertible alignment 2-cells in the materialized pipeline is `app/api/room-functor/apply/route.ts` **dropping premise rows** on import. Structure-preserving materialization (carrying `ArgumentPremise` edges) makes the materialized functor strict, hence its alignment 2-cells invertible. So **condition (1) reduces to a single concrete engineering property of `apply`.**
- **(C014.b — the band is the only quantitative blocker.)** Given (1), condition (2) is *necessary and sufficient* for band soundness because the symbolic `join` is already idempotent (A1: re-import dedupes by derivation id); only the scalar reducer, which discards derivation identity, can double-count. And the fix is small: `RoomTransportSnapshot.payloadJson.sources[]` already carries per-source provenance one hop deep (A0 §3); extend it to the full path.

---

## Positive settlement (what a proof / mechanization looks like, and where it goes)

A proof has three dischargeable parts, in increasing cost:

1. **(objects + symbolic arrows — done as the L1 lemma, 2026-06-07.)** Object composition associative and transport strict + join idempotent are green in [`tests/ecc.test.ts`](../../tests/ecc.test.ts) — suite **"L1 — transport is a strict 1-functor (C014 discharge 1)"** (5 laws: L1.1 strict on derivations, L1.2 preserves identities, L1.3 preserves composition on the full structure, L1.4 preserves the zero arrow, L1.5 functorial in `F`), plus the A1 two-functor suite. Lemma statement: *`transport(F, ·)` is a strict 1-functor on the symbolic ECC layer, and `F ↦ transport(F, ·)` is functorial in `F`.* **One subtlety found and recorded:** transport is strict on derivation **IDs** (it never renames the internal token), so the identity law $F(\mathrm{id}_c) = \mathrm{id}_{F(c)}$ holds **up to derivation relabeling** — the result is an identity arrow on $F(c)$ (endpoints equal, one trivial derivation, no assumptions), which is the correct categorical reading (identities are fixed by endpoints + triviality, not by an internal label). Carrier is finite sets + relabeling ⇒ Agda-able (Direction 5); the mechanized version would quotient derivation IDs to make L1.2 a strict equality.
2. **(band dedupe — done as the L2 property test, 2026-06-07.)** Five property tests in [`tests/transportAggregator.test.ts`](../../tests/transportAggregator.test.ts) — suite **"L2 — band soundness needs origin dedupe (C014 discharge 2)"** — make A0 §1.3 executable: **(P1)** the production positional reducer `reduceImportedScores(number[], mode)` **double-counts** a twice-arriving origin in `product`/`logodds` (regression witness of the multi-hop bug); **(P1b)** `min` is only *accidentally* safe (max is idempotent); **(P2)** the proposed origin-keyed reducer `reduceImportedByOrigin` is **idempotent by origin**; **(P3)** **path-independent** (any path multiset reaching the same origin *set* gives the same band); **(P4)** the **C014.b equality** — multi-hop band $=$ iterated one-hop band under origin dedupe, in every mode, while the positional reducer breaks it for product/logodds. The fix shape: dedupe contributions to one score per ultimate origin **before** reducing, which requires `RoomTransportSnapshot.payloadJson.sources[]` to carry the **full path / ultimate origin** (it carries only the immediate predecessor today — A0 §3). The reducer is defined **test-only**; shipping it to `transportAggregator` + extending the snapshot shape is the gated production change C014 licenses once discharge 3 lands.
3. **(pseudo / no-monodromy — the genuine categorical content; scoped 2026-06-07.)** Prove the lax-functor coherence (the comparison 2-cells $\gamma_{G,F}: G_* \circ F_* \Rightarrow (G\circ F)_*$ satisfy the bicategory associativity/unit pentagons) and that invertibility of the alignment 2-cells is equivalent to claim-closure of every cycle through the region. Migrate to [`02_THEOREMS_AND_PROOFS/`](../02_THEOREMS_AND_PROOFS/) as the Plexus coherence theorem when settled. **Scoped as a dedicated dev-spec:** [`DEV_SPEC-c014-discharge3-plexus-coherence-pentagon-2026-06-07.md`](../DEV_SPEC-c014-discharge3-plexus-coherence-pentagon-2026-06-07.md) (bicategory data + W1–W3, whiskering/`\gamma`, pentagon/triangle, the pseudofunctor⟺monodromy-free equivalence, the faithfulness boundary). **D1 done 2026-06-08** — [`C014-D1-plexus-bicategory-data-2026-06-08.md`](../C014-D1-plexus-bicategory-data-2026-06-08.md): bicategory data pinned, W1 (vertical assoc+unit) / W2 (interchange) / W3 (naturality preserved) proved in the quotient `ECC/≈` and green in [`tests/ecc.test.ts`](../../tests/ecc.test.ts) (suite "D1 — Plexus bicategory well-definedness"). Next: D2 (pentagon/triangle). **D2 done 2026-06-08** — [`C014-D2-plexus-coherence-pentagon-2026-06-08.md`](../C014-D2-plexus-coherence-pentagon-2026-06-08.md): the comparison 2-cells `\gamma` are identity on the total part / undefined on drops, pentagon + triangle reduce to partial-domain bookkeeping (legalized by W2), green in [`tests/ecc.test.ts`](../../tests/ecc.test.ts) (suite "D2 — comparison 2-cells γ, pentagon + triangle"). Next: D3 (pseudofunctor⟺monodromy-free). **D3 done 2026-06-08** — [`C014-D3-pseudofunctor-monodromy-free-2026-06-08.md`](../C014-D3-pseudofunctor-monodromy-free-2026-06-08.md): the biconditional (pseudofunctor ⟺ iso-monodromy-free) proved, 𝓟° shown maximal, and the symbolic half of C014-T complete; green in [`tests/ecc.test.ts`](../../tests/ecc.test.ts) (suite "D3"). **The refinement below is now RESOLVED:** 𝓟° is defined by **invertible** round-trip 2-cells (claim-closed *up to ECC iso*), strictly larger than identity-closure; the probe's `closed`/`drifted` boundary refinement to **ECC inter-derivability** is logged (D3 write-up §5) for application before the H2 harness. **D4 done 2026-06-08** — [`C014-D4-faithfulness-boundary-2026-06-08.md`](../C014-D4-faithfulness-boundary-2026-06-08.md): the symbolic C014-T is faithful to the live pipeline exactly on the **strict** materialization path (`depth>1 + non-empty claimMap`), over-claims on the lax path; boundary decidable from the `apply` mode; **finding** — the strict structure-preserving path already exists in [`apply/route.ts`](../../app/api/room-functor/apply/route.ts), so C014.a is \"make it the default,\" not \"build it.\" Green in [`tests/ecc.test.ts`](../../tests/ecc.test.ts) (suite \"D4\"). **D1–D4 complete; remaining: H1–H3 harness + D5 promotion.** Next: D5. _Original A2 framing, now resolved:_𝓟° should be defined by **invertible** round-trip 2-cells (claim-closed *up to ECC iso*), not strict identity — a drift `c → c'` between *inter-derivable* claims is an invertible 2-cell. So the probe's `closed`/`drifted` boundary must be refined from claim-id equality to **ECC-inter-derivability** before the H2 harness (first bites in D3, not D1).

Settling all three migrates C014 to a theorem and **lifts the one-hop contract on the certified sub-bicategory** (a gated production change to `transportAggregator` + `apply`, never automatic).

## Negative settlement (what a counterexample looks like, in what form)

A counterexample is a composable $A\xrightarrow{F} B\xrightarrow{G} C$ such that **both** conditions hold — every alignment 2-cell along the path is invertible (no drift/drop) **and** the band dedupes by ultimate origin — **yet** the composite transport still disagrees with iterated one-hop, as either:

- a **symbolic** mismatch: `transport(G∘F, a)` differs (up to minimal assumptions) from `compose`d one-hop transports for some arrow `a` — which would refute A1's strictness lemma and point to a hidden non-functoriality in `transport`; or
- a **band** mismatch: `band(G∘F) ≠` iterated band on identical origins — which would mean log-odds corroboration is **not** origin-idempotent, contradicting C014.b and reopening the confidence-algebra distributivity question (Direction 3).

Either refutation localizes a **third** obstruction beyond monodromy and band-dedupe, which is itself the result.

---

## Why this matters (the through-line)

C014 turns three separate findings into one statement: A0 (the obstruction is provenance), A1 (object/symbolic composition is free), and B2b (the live obstruction is claim-map monodromy) are the **three hypotheses of one coherence theorem**. It also makes the "coherence first, cohomology after" sequencing a *theorem dependency*, not a slogan: the quantitative $H^1(\mathbb{R})$ class Direction 4 wants is **defined only on the pseudofunctor sub-bicategory** (you can only sum holonomy around loops where transport actually composes), and that sub-bicategory is exactly C014's certified region.

## Open offshoot (quantitative, distinct from C014)

C014 certifies *qualitative* soundness (no drift, no double-count). It does **not** manufacture a non-trivial quantitative $H^1(\mathbb{R})$ — B2b showed the node-potential connection is a coboundary (exact). A genuinely quantitative class needs an **independent per-mapping transport weight** on `RoomFunctor` (a log-odds shift the edge asserts, not derivable from node beliefs). That schema question is **[Q-042](../01_OPEN_QUESTIONS_REGISTRY.md#q-042) offshoot (b)**, logged but not adopted.
