# Verification prompt — cross-check the C015 proof (rank lemma + identification) toward graduating it as T011

> **Role.** You are an independent second reader. You did **not** author the C015 proof
> ([`C015-proof-rank-and-identification-2026-06-08.md`](C015-proof-rank-and-identification-2026-06-08.md))
> or its supporting construction. Your job is to either (a) sign off — clearing the proof
> to graduate as **T011** (`status: established`) — or (b) return a numbered list of
> substantive defects, each with the precise location and the minimal repair. Default to
> skepticism: a clean sign-off requires that *every* obligation below is discharged. Do
> **not** trust the proof's own summaries — re-derive against the ECC source, the probe,
> and T010.
>
> **Target.** [`C015-proof-rank-and-identification-2026-06-08.md`](C015-proof-rank-and-identification-2026-06-08.md)
> — the claim that the possibilistic Čech $H^1$ of the Plexus claim-sheaf is (Theorem A)
> ranked by a holonomy group $G$ with $\operatorname{rank} H^1 = \log_2|G| = \beta_1 -
> \dim\ker\bar\rho$ exact for elementary-abelian-2 holonomy, gauge-independent (Lemma 1),
> and (Theorem B + Corollary B.1) supported **exactly** on the cycles outside
> $\mathcal{P}^\circ$ all of whose 2-cycle edges lie in $\mathcal{P}^\circ$ — so the
> Abramsky contextuality obstruction *is* T010's iso-monodromy obstruction.
>
> **The two failure modes to hunt (the analogue of T007's blocking leastness defect / T010's
> hidden coherence cell).**
> 1. **Lemma 0 is the crux — a non-bijective edge in the nerve.** The proof assumes each
>    compatible edge carries a clean fiber **bijection** $\tau_{rs}$. But the *probe's*
>    `interDerivable` is a claim-level two-way reachability that **ignores assumptions**
>    (the [T010 cross-check clarification 1](02_THEOREMS_AND_PROOFS/T010-plexus-coherence-pseudofunctor.md#cross-check-notes)
>    caveat). Hunt for: does the *proof* ever rely on the *probe* being an exact ECC-iso
>    oracle? If Lemma 0's bijection is established only via the assumption-ignoring proxy,
>    the local system is not flat and Theorems A/B rest on sand. The proof must establish
>    Lemma 0 **abstractly** (over true ECC isos) and use the probe only as corroboration.
> 2. **Theorem A(2)'s exactness smuggling.** Confirm $\operatorname{rank} = \log_2|G|$ is
>    claimed **only** for elementary-abelian-2 holonomy and that the general-$G$ case is
>    correctly downgraded to a lower bound — *not* silently applied to a cyclic-3 or
>    non-abelian $G$.
>
> **Scope reminder — what the proof is and is NOT.** It settles the **symbolic /
> combinatorial** content of [C015](03_CONJECTURES/C015-possibilistic-cohomology-iso-monodromy.md)
> parts (1)–(3) and [Q-043](01_OPEN_QUESTIONS_REGISTRY.md#q-043)(i)+(ii). It does **NOT**
> address the **live witness** (Q-043(iii)) — every result is for the *abstract* local
> system, corroborated on the *synthetic* witness; live data has $G=1$. A sign-off clears
> the *mathematics*; the live-observation rider stays open under Q-043 (a methodology call,
> not a proof gap). The proof must **not** claim a live class, must **not** assert the
> probe is exact, and must keep the e.a.2 restriction on Theorem A(2). It is the
> *boolean/possibilistic* result; the $\mathbb{R}$-valued (magnitude) companion is parked
> behind the per-edge-weight meaning decision (Q-042 offshoot) and out of scope.
>
> **Programme rules you are bound by.** Read [`02_THEOREMS_AND_PROOFS/README.md`](02_THEOREMS_AND_PROOFS/README.md)
> (theorem-register policy) first. A theorem must be (1) stated in formal vocabulary,
> (2) human-checkable in one sitting via lemmas, (3) cross-checked by a non-author,
> (4) tied to an open-question entry it retires or updates ([Q-043](01_OPEN_QUESTIONS_REGISTRY.md#q-043)).
> Tests are **evidence, not proof**. Record your verdict in the `## Cross-check notes`
> format of [T008](02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md) /
> [T010](02_THEOREMS_AND_PROOFS/T010-plexus-coherence-pseudofunctor.md).
>
> **Re-check note (2026-06-08).** A first cross-check returned **blocking defect D1**
> (Lemma 0 grounded on the `interDerivable` proxy, not the strict `isIsoVia` iso) — failure
> mode 1 below, the T007-leastness analogue. The author has **applied the specified repair**
> (re-based §0/§0.1/Lemma 0 on the strict `isIsoVia` / T010 $\mathcal{P}^\circ$-2-cycle,
> demoted the probe to corroboration; see the proof's `## Cross-check notes → Author
> response`). **This re-check's primary job is to verify the repair closes D1** — confirm
> §1.2 below now passes (Lemma 0's bijection follows from the *strict* edge condition + T010's
> strict-1-functor lemma, never from `interDerivable`), and that the demotion of the probe to
> corroboration is honest throughout. The other obligations (§2–§6) were cleared in the first
> pass but should be spot-re-confirmed against the edited text.

---

## 0. Source materials you must consult (do not work from the proof alone)

- **The proof.** [`C015-proof-rank-and-identification-2026-06-08.md`](C015-proof-rank-and-identification-2026-06-08.md)
- **The conjecture it settles.** [`03_CONJECTURES/C015-possibilistic-cohomology-iso-monodromy.md`](03_CONJECTURES/C015-possibilistic-cohomology-iso-monodromy.md) (parts 1–3; positive/negative settlement).
- **The scoping it executes.** [`10_IDEATION_SESSIONS/08-distributed-semantics-quantitative-cohomology-2026-06-08.md`](10_IDEATION_SESSIONS/08-distributed-semantics-quantitative-cohomology-2026-06-08.md) §2 (Abramsky↔Plexus dictionary), §5 (the local/global partition), §5.2–§5.3 (Čech + rank).
- **The keystone it reduces to.** [`02_THEOREMS_AND_PROOFS/T010-plexus-coherence-pseudofunctor.md`](02_THEOREMS_AND_PROOFS/T010-plexus-coherence-pseudofunctor.md) — $\mathcal{P}^\circ$ = iso-monodromy-free region; transport is a pseudofunctor exactly there. **Theorem B's two directions reduce here — confirm the reduction is exact.** Also read its **cross-check clarification 1** (the probe's assumption-ignoring proxy — the Lemma 0 risk).
- **The construction (evidence).** [`scripts/plexus-topology-probe.ts`](../scripts/plexus-topology-probe.ts) — `loadDerivationReachability` (the `interDerivable` oracle), `pairFaithful` (the nerve 1-cell test), `computeH1RankBasis` (spanning tree, fundamental cycles, holonomy group, `elementaryAbelian2`, `rank = floor(log2|G|)`), `cech` / `seed-cech` / `seed-contextuality`.
- **The ECC carrier.** [`lib/argumentation/ecc.ts`](../lib/argumentation/ecc.ts) — `transport`, `compose`, the iso notion `isIsoVia` uses (two-way `compose` to assumption-free identity); the gap between this strict iso and the probe's claim-level reachability.

## 1. The object is genuinely a local system on the nerve (Lemma 0)

1.1 **Fiber is well-defined.** Confirm `interDerivable(r,·,·)` is an equivalence (reflexive, symmetric, transitive) so $F_r$ = iso-classes is well-formed. Flag if transitivity can fail (e.g. reachability that is not actually composable).

1.2 **Edges carry bijections — abstractly, not via the proxy.** Re-derive that a compatible edge $\{r,s\}$ (in $\mathcal{P}^\circ$ as a 2-cycle, T010) induces a bijection $\tau_{rs}: F_r^\circ \to F_s^\circ$ with $\tau_{sr}=\tau_{rs}^{-1}$. **Critical:** confirm the proof establishes this from the **abstract** $\mathcal{P}^\circ$-2-cycle condition (true ECC iso, `isIsoVia`), and uses the probe's `pairFaithful`/`interDerivable` only as *corroboration*. If the bijection is only as good as the assumption-ignoring proxy, Lemma 0 is **not** proven — record the exact line where the proxy is load-bearing.

1.3 **Flatness.** Confirm the back-edge round trip being the identity (the 2-cycle returns up to iso) is what makes $(N,\{\tau\})$ a flat local system, and that this is the $\mathcal{P}^\circ$-membership of the *edge* (a 2-cycle), not of the longer cycle under test.

## 2. Holonomy and gauge-independence (Lemma 1)

2.1 **$\pi_1(N)$ is free on the fundamental cycles.** Confirm the standard graph fact: a spanning tree gives $\pi_1(N,r_0)$ free of rank $\beta_1 = E-V+1$ (per component), generated by the non-tree-edge cycles.

2.2 **$\sigma_e$ is the holonomy.** Confirm $\sigma_e = t_v^{-1}\circ\tau_{uv}\circ t_u$ matches `computeH1RankBasis` (propagate root claim down the tree, read off the landing class up to iso at the non-tree edge).

2.3 **Gauge-independence — re-derive.** Confirm $|G|$ (equivalently the conjugacy class of the holonomy representation $\rho_T:\pi_1\to\mathrm{Sym}(F^\circ)$) is independent of spanning tree and basepoint. **Try to break it:** construct a small $N$ (a triangle + one chord, say) and check by hand that two spanning trees give conjugate — not different-order — holonomy groups. A tree change that alters $|G|$ refutes Lemma 1.

## 3. The rank lemma (Theorem A)

3.1 **Part (1).** Confirm $H^0=\mathrm{Fix}(G)$ and hence the obstruction is non-trivial iff $G\neq 1$ (Corollary 1.1).

3.2 **Part (2) — the exact rank.** For e.a.2 $G$: confirm the factoring $\pi_1\twoheadrightarrow H_1(\mathbb F_2)\xrightarrow{\bar\rho}G$ is valid (abelian + 2-torsion target), that $H^{\ge 2}(N)=0$ for a graph so the class is faithfully recorded by $\bar\rho\in H^1(N;G)$, and that rank–nullity gives $\log_2|G| = \beta_1-\dim\ker\bar\rho$. Re-derive on the synthetic witness ($\beta_1=1$, $\ker\bar\rho=0$, $\log_2|G|=1$).

3.3 **Part (3) — the honest downgrade.** Confirm that for non-involution or non-abelian $G$ the proof claims only a **lower bound** $\lfloor\log_2|G|\rfloor$, that `elementaryAbelian2=false` is the flag, and that exactness is **never** asserted there. Construct (on paper) a hypothetical cyclic-3 holonomy and confirm the proof would *not* claim exact rank.

## 4. The identification (Theorem B + Corollary B.1)

4.1 **($\Rightarrow$, pairwise-in).** Confirm "every edge of $\gamma$ is a 1-cell of $N$" is, by Lemma 0, "every consecutive pair is in $\mathcal{P}^\circ$ as a 2-cycle" — pairwise-in verbatim, no smuggling.

4.2 **($\Rightarrow$, globally-out) and ($\Leftarrow$).** Confirm both reduce to **T010's** characterization ($\mathcal{P}^\circ$ = iso-monodromy-free), i.e. non-trivial round-trip monodromy $\iff \gamma\notin\mathcal{P}^\circ$. This is the load-bearing reduction — confirm it cites T010 correctly and does not re-assume the conclusion.

4.3 **Support of $H^1$ / coboundary-triviality.** Confirm a *locally* obstructed cycle has an edge that is **not** a 1-cell of $N$ (drop or non-faithful pair), hence is **not in $Z_1(N)$** and carries no $H^1(N)$ class. Confirm this is the precise sense of "local obstructions are coboundary-trivial" and that it matches the `cech` `offNerveLoops` count.

4.4 **Corollary B.1.** Confirm the headline ("Abramsky obstruction = T010 iso-monodromy obstruction") is a *consequence* of B + A(1), not an independent assertion.

## 5. Scope honesty

5.1 Confirm the proof claims **no** live witness, leaves Q-043(iii) open, and states the live-data status ($G=1$) honestly.
5.2 Confirm it claims **no** quantitative ($\mathbb R$-valued) class and parks B-abelian behind the per-edge-weight decision.
5.3 Confirm it nowhere asserts the probe is an exact ECC-iso oracle (the §0 Lemma-0 risk), and that the e.a.2 restriction on exactness is preserved throughout.
5.4 Confirm it closes exactly the symbolic part of Q-043 and that T010 is correctly cited as the keystone (the nerve's 1-cells are undefined without it — "coherence first").

## 6. Corroborating computation (re-run, evidence only)

6.1 `npx tsx --env-file=.env scripts/plexus-topology-probe.ts seed-cech` → confirm $|G|=2$, `elementaryAbelian2=YES`, **rank $=1$** ($G\cong\mathbb Z/2$, the $p\leftrightarrow q$ swap), the off-nerve local drop contributing 0. Then `… clean`.
6.2 `npx tsx --env-file=.env scripts/plexus-topology-probe.ts cech` (clean) → confirm $|G|=1$, **rank $=0$** on live data.
6.3 **Adversarial spot check:** build (or reason about) a cycle with a *one-way* derivation only (a `drift-noniso` edge) and confirm the probe places it **outside** the nerve (local, not a class) — the inter-derivability oracle is not over-permissive. Optionally a hypothetical non-involution holonomy to confirm the lower-bound downgrade fires.

## 7. Deliver your verdict

Either **sign off** — clearing the proof to file as **T011** (`status: established`, with any
non-blocking clarifications recorded in `## Cross-check notes`) — or return a **numbered
defect list**, each with location, why it fails (re-derived, not summarized), an empirical
witness if applicable, and the minimal repair. **If Lemma 0's bijection is load-bearing on the
assumption-ignoring proxy, or Theorem A(2)'s exactness is applied off the e.a.2 case, that is a
blocking defect** — record it precisely. A sign-off clears the *mathematics* (Q-043 (i)+(ii));
the **live witness** (Q-043(iii)) remains open as an empirical rider regardless, and T011 should
be filed as a theorem *about the construction* with that rider explicit.
