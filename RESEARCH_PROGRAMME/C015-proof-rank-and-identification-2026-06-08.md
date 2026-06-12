# C015 proof — the rank lemma and the identification (toward graduating C015 → a theorem)

- **Date:** 2026-06-08
- **Direction:** 4 — Distributed semantics, sub-program B (possibilistic cohomology). Paper proof of the two non-empirical settlement conditions of [C015](03_CONJECTURES/C015-possibilistic-cohomology-iso-monodromy.md) / [Q-043](01_OPEN_QUESTIONS_REGISTRY.md#q-043): the **rank lemma** (holonomy-group form) and the **identification** (possibilistic $H^1$ support = out-of-$\mathcal{P}^\circ$-but-pairwise-in cycles).
- **Status:** **cross-checked 2026-06-08 — D1 returned, REPAIRED, and re-check SIGNED OFF → graduated as [T011](02_THEOREMS_AND_PROOFS/T011-possibilistic-cohomology-iso-monodromy.md) (`status: established`).** The first cross-check returned one blocking defect (D1: Lemma 0 grounded its fiber + edge-bijection on the assumption-ignoring `interDerivable` proxy rather than the abstract ECC iso `isIsoVia`); the minimal repair was applied (§0/§0.1/Lemma 0 re-based on the **strict `isIsoVia` / T010 $\mathcal{P}^\circ$-2-cycle**, `interDerivable`/`pairFaithful` demoted to corroboration, descent via T010's strict-1-functor lemma L1), and the re-check confirmed D1 is closed with no new defect (see [`## Cross-check notes`](#cross-check-notes)). Theorems A, B, Lemma 1 carry through unchanged. Empirical corroboration exact on the binary witnesses (`cech`/`seed-cech`: synthetic $G\cong\mathbb{Z}/2$, rank 1; live $|G|=1$, rank 0). The mathematics (Q-043 (i)+(ii)) is closed; the **live-witness rider (Q-043(iii)) stays open** regardless — T011 is a theorem *about the construction*.
- **Depends on:** [T010](02_THEOREMS_AND_PROOFS/T010-plexus-coherence-pseudofunctor.md) (**established** — $\mathcal{P}^\circ$ = the iso-monodromy-free region; transport is a pseudofunctor exactly there); the H2 ECC-inter-derivability oracle; standard facts about local systems (flat bundles) on graphs.
- **Scope:** purely the *symbolic/combinatorial* content. The empirical gap (a *live* non-trivial class) is out of scope and stays open under Q-043(iii).

---

## 0. The object: a local system on the compatible nerve

Fix a tracked proposition. Recall the **compatible nerve** $N$ (C015 §Setting): a graph (1-skeleton) with

- **vertices** $V(N)$ = rooms that appear in some compatible pair;
- **edges** $E(N)$ = unordered room pairs $\{r,s\}$ that are **pairwise-compatible** — the transport functors $r\to s$ and $s\to r$ exist and the back-edge 2-cycle is an **ECC isomorphism** on the tracked claim's class: the round-trip composite is `isIsoVia`-invertible (composes to an assumption-free identity in `ECC/≈`), i.e. **the pair is in $\mathcal{P}^\circ$ as a 2-cycle in the precise [T010](02_THEOREMS_AND_PROOFS/T010-plexus-coherence-pseudofunctor.md) sense**.

> **Definitional convention (post-cross-check, 2026-06-08).** All of $F_r$, $E(N)$, $\tau_{rs}$, and "compatible" below are defined over the **strict ECC iso** — `isIsoVia` / T010's $\mathcal{P}^\circ$-membership (a two-way `compose` to an *assumption-free* identity in `ECC/≈`), **not** the probe's claim-level `interDerivable` reachability. Per [T010 cross-check clarification 1](02_THEOREMS_AND_PROOFS/T010-plexus-coherence-pseudofunctor.md#cross-check-notes), `interDerivable` is **necessary-but-not-sufficient** for the strict iso (it ignores assumptions), so the probe's `pairFaithful`/`interDerivable` is **corroboration only** — it over-approximates $E(N)$, and the theorems below are stated over the abstract strict relation. (The original draft conflated the two; this convention is the cross-check D1 repair.)

### 0.1 The fiber and the transport bijections

For a room $r$, let the **fiber** $F_r$ be the set of **strict ECC-iso-classes** of (tracked) claims in $r$ — the quotient of $r$'s claims by the relation $x \approx_r x'$ iff there are ECC arrows $x\to x'$ and $x'\to x$ composing to assumption-free identities (the `isIsoVia` round-trip in `ECC/≈`). This is an equivalence: reflexive (identity arrow), symmetric (swap the two arrows), transitive (compose the witnessing arrows; the composite round-trip is again assumption-free since each factor is). **It is a *refinement* of the probe's `interDerivable` partition** — two claims can be two-way-reachable yet *not* strict-iso (the round trip carries net assumptions), so `interDerivable` merges classes the strict relation keeps apart; the probe therefore over-counts membership and is used only to *corroborate*, never to *define*.

> **Lemma 0 (edges carry fiber isomorphisms).** Each edge $\{r,s\}\in E(N)$ induces a **bijection** $\tau_{rs}: F_r^{\circ} \xrightarrow{\;\sim\;} F_s^{\circ}$ between the sub-fibers that survive transport, with $\tau_{sr} = \tau_{rs}^{-1}$ on those sub-fibers.

*Proof (over the strict iso).* The directed claim-map $\varphi_{rs}$ descends to strict-iso-classes: if $x \approx_r x'$ — witnessed by ECC arrows round-tripping to an assumption-free identity — then `transport` carries those witnesses to ECC arrows between $\varphi_{rs}(x)$ and $\varphi_{rs}(x')$ that again round-trip to an assumption-free identity (transport is a *strict* 1-functor on `ECC/≈` by [T010 Lemma L1](02_THEOREMS_AND_PROOFS/T010-plexus-coherence-pseudofunctor.md): it preserves composition and identities up to derivation relabelling, hence preserves assumption-free round-trips), so $\varphi_{rs}(x) \approx_s \varphi_{rs}(x')$. Write $\bar\varphi_{rs}: F_r^\circ \to F_s^\circ$ for the descended map on the classes with an image. **Edge-compatibility** is, by the $E(N)$ definition, exactly that the back-edge round trip $\bar\varphi_{sr}\circ\bar\varphi_{rs}$ is `isIsoVia`-invertible — an assumption-free identity in `ECC/≈` — hence the **identity on $F_r^\circ$** (strict-iso-classes); symmetrically $\bar\varphi_{rs}\circ\bar\varphi_{sr} = \mathrm{id}_{F_s^\circ}$. Hence $\bar\varphi_{rs}$ is a bijection with inverse $\bar\varphi_{sr}$. Set $\tau_{rs} := \bar\varphi_{rs}$. ∎

> **Why the repair is sound (and why A/B/Lemma 1 are unchanged).** Lemma 0 now uses only (i) the $E(N)$ edge condition stated over `isIsoVia` and (ii) T010's strict-1-functor lemma (`transport` preserves assumption-free round-trips). It never invokes `interDerivable`. Everything downstream — the local system, the holonomy group, Theorems A and B, Lemma 1 — refers to $\tau_{rs}$ and $F^\circ$ as defined here, so it carries through verbatim with "ECC-inter-derivable" read as "strict ECC iso (`isIsoVia`)". The probe's `interDerivable`/`pairFaithful` over-approximates $E(N)$ and the fiber, so the `cech` numbers are an **upper bound** corroboration; on the binary witnesses (synthetic + realistic) the round-trip witnesses carry no net assumptions, so probe and strict relation coincide and the reported ranks are exact there. **(The synthetic `seed-contextuality`/`seed-cech` and the realistic `seed-real` both build single-derivation arguments with no `AssumptionUse` rows, so every round-trip composite in those witnesses is assumption-free by construction — the strict `isIsoVia` and the probe's `interDerivable` provably coincide on them.)**

So $N$, together with $\{\tau_{rs}\}$, is a **local system** (locally constant sheaf / flat principal bundle) on the graph $N$ with structure groupoid the symmetric groupoid $\mathrm{Sym}$ on fibers. This is the precise sense in which "transport is a flat connection" — Lemma 0 is the flatness (the connection is defined on edges and pairwise-invertible).

### 0.2 Possibilistic cohomology of a graph local system

For the **boolean / min-quantale (possibilistic)** coefficient (Session 07 §2.2):

- **$H^0$** = **global sections** = a choice $g \in \prod_r F_r$ with $\tau_{rs}(g_r) = g_s$ on every edge — equivalently (for connected $N$, root $r_0$) a fiber element $g_{r_0}$ **fixed by the holonomy** (§1).
- **$H^1$** = the obstruction to gluing pairwise-compatible local data into a global section.

These are the graph instances of $H^0(N;\mathcal F)$, $H^1(N;\mathcal F)$ for the local system $\mathcal F$ of Lemma 0.

---

## 1. Holonomy, and gauge-independence

Assume $N$ connected (else argue per component; §3.3). Fix a basepoint $r_0$ and a spanning tree $T\subseteq E(N)$.

**Tree transport.** For each room $r$, let $t_r: F_{r_0}^\circ \to F_r$ be the composite of the $\tau$'s along the unique tree path $r_0\to r$ (a partial bijection onto its image). For a non-tree edge $e=\{u,v\}\notin T$, the **holonomy** of the fundamental cycle $\gamma_e$ (down the tree to $u$, across $e$, back up the tree from $v$) is the permutation of $F_{r_0}^\circ$

$$\sigma_e \;:=\; t_v^{-1}\circ \tau_{uv}\circ t_u \;\in\; \mathrm{Sym}(F_{r_0}^\circ).$$

(This is exactly `computeH1RankBasis`: propagate each root claim down the tree, then for each non-tree edge read off which root class the transported class lands on, up to iso.)

The **holonomy group** is $G := \langle \sigma_e : e\notin T\rangle \le \mathrm{Sym}(F_{r_0}^\circ)$.

> **Lemma 1 (gauge-independence).** $G$ is independent of the spanning tree and the basepoint, **up to conjugacy in $\mathrm{Sym}(F^\circ)$**. In particular $|G|$ is a well-defined invariant of the local system.

*Proof.* This is the classical fact that the holonomy representation of a flat bundle on a connected graph is well-defined up to conjugacy. Concretely: $\pi_1(N, r_0)$ is free on the fundamental cycles $\{\gamma_e\}_{e\notin T}$ ([standard for a graph](#); a spanning tree contracts to a wedge of $\beta_1$ circles). The assignment $\gamma_e \mapsto \sigma_e$ extends to a homomorphism $\rho_T: \pi_1(N,r_0)\to \mathrm{Sym}(F^\circ)$ whose image is $G$. Two choices of spanning tree (or basepoint) give homomorphisms $\rho_T, \rho_{T'}$ that differ by an inner automorphism of $\pi_1$ composed with conjugation by the tree-transport permutation $t'_{r_0}\!\circ t_{r_0}^{-1}$; both leave the image's conjugacy class — hence $|G|$ — unchanged. ∎

> **Corollary 1.1 ($H^0$).** A global section exists for the class $x\in F_{r_0}^\circ$ iff $x$ is fixed by all of $G$; so $H^0 = \mathrm{Fix}(G)$. In particular $H^0 = F_{r_0}^\circ$ iff $G = 1$ (every cycle glues — the local system is trivial / the region is *globally* in $\mathcal{P}^\circ$).

---

## 2. The rank lemma

> **Theorem A (rank lemma — holonomy-group form).** Let $N$ be a connected component of the compatible nerve with holonomy group $G$ and first Betti number $\beta_1 = |E(N)| - |V(N)| + 1$. Then:
> 1. the possibilistic $H^1$ obstruction is **non-trivial iff $G\neq 1$**;
> 2. when $G$ is an **elementary abelian 2-group** ($G\cong(\mathbb Z/2)^k$, every $\sigma_e$ an involution — the binary, drift-iso/twist case), the obstruction is classified by a homomorphism $\bar\rho: H_1(N;\mathbb F_2)\to G$ and its **rank is exactly**
> $$\operatorname{rank} H^1 \;=\; \log_2|G| \;=\; \beta_1 - \dim_{\mathbb F_2}\ker\bar\rho;$$
> 3. for general (non-involution / non-abelian) $G$, $\lfloor\log_2|G|\rfloor$ is a **lower bound** on the number of independent binary obstructions, and the construction flags $G$ as non-e.a.2.

*Proof.*

**(1)** By Corollary 1.1, $H^0$ is the full fiber iff $G=1$; gluing fails for some local datum iff some holonomy moves it iff $G\neq 1$. The possibilistic obstruction is the non-existence of a global section extending a chosen compatible local datum, which is exactly $G\neq 1$.

**(2)** Assume $G\cong(\mathbb Z/2)^k$, $k=\log_2|G|$. The holonomy homomorphism $\rho:\pi_1(N)\twoheadrightarrow G$ is onto (its image generates $G$ by definition). Since the target $G$ is abelian, $\rho$ factors through the abelianization $\pi_1(N)^{\mathrm{ab}} = H_1(N;\mathbb Z)$ and, as $G$ is 2-torsion, through $H_1(N;\mathbb F_2)\cong\mathbb F_2^{\beta_1}$:

$$\pi_1(N)\twoheadrightarrow H_1(N;\mathbb F_2)\cong\mathbb F_2^{\beta_1}\xrightarrow{\;\bar\rho\;} G\cong\mathbb F_2^{k}.$$

The possibilistic $H^1$ for an $\mathbb F_2$-local system on a graph is classified by the cohomology class of this connection, i.e. by $\bar\rho\in\operatorname{Hom}(H_1(N;\mathbb F_2),G)=H^1(N;G)$ (graph: $H^{\ge 2}=0$, so the class is unobstructed and faithfully recorded by $\bar\rho$). The **rank** of the obstruction — the dimension of the space of independent binary "does-not-glue" tests — is $\dim_{\mathbb F_2}\operatorname{im}\bar\rho = \dim G = k = \log_2|G|$. By rank–nullity on $\bar\rho:\mathbb F_2^{\beta_1}\to\mathbb F_2^{k}$ (surjective), $k = \beta_1 - \dim\ker\bar\rho$. This is the claimed identity.

**(3)** If some $\sigma_e$ is not an involution, or $G$ is non-abelian, then $H^1(N;G)$ is a pointed *set* of conjugacy classes of homomorphisms, not an $\mathbb F_2$-vector space, and a single "rank" is not defined; but each independent generator of $G$ still witnesses at least one binary non-gluing test, so $\lfloor\log_2|G|\rfloor$ lower-bounds the count. The construction reports `elementaryAbelian2 = false` precisely here, marking the rank as a lower bound. ∎

**Corroboration (`cech`).** Synthetic witness: $\beta_1(N)=1$, the single fundamental cycle has holonomy the $p\leftrightarrow q$ swap, $G=\langle(p\,q)\rangle\cong\mathbb Z/2$, e.a.2, so $\operatorname{rank}=\log_2 2 = 1 = \beta_1 - 0$. ✓ Live data: $G=1$, $\operatorname{rank}=0$. ✓ The holonomy-group form **correctly merges dependent cycles** (several nerve 1-cycles with equal holonomy give one $G$-generator) — the defect the room-set proxy could not see.

---

## 3. The identification

> **Theorem B (identification).** A 1-cycle $\gamma$ of the compatible nerve $N$ carries a **non-trivial monodromy** (its round-trip composite is not the identity on $F^\circ$) **iff** $\gamma$, viewed as a cycle of transport functors, is **outside $\mathcal{P}^\circ$** while **every one of its consecutive room-pairs is in $\mathcal{P}^\circ$** (pairwise-in, globally-out). Consequently the possibilistic $H^1$ is supported **exactly** on the globally-obstructed cycles of [Session 08 §5](10_IDEATION_SESSIONS/08-distributed-semantics-quantitative-cohomology-2026-06-08.md).

*Proof.*

**($\Rightarrow$, pairwise-in.)** That $\gamma$ is a 1-cycle of $N$ means every edge of $\gamma$ is a 1-cell of $N$, i.e. (by construction of $E(N)$, Lemma 0) **every consecutive room-pair of $\gamma$ is in $\mathcal{P}^\circ$ as a 2-cycle**. This is "pairwise-in" verbatim.

**($\Rightarrow$, globally-out.)** "Non-trivial monodromy" is, by Lemma 1 / the holonomy definition, that the round-trip composite $\sigma_\gamma$ is not the identity on $F^\circ$ — i.e. the tracked claim does **not** return to a **strict-ECC-iso** claim around $\gamma$ (the round-trip 2-cell is not `isIsoVia`-invertible). By T010's characterization, $\mathcal{P}^\circ$ is exactly the iso-monodromy-free region: a cycle is in $\mathcal{P}^\circ$ iff its round-trip 2-cell $\eta$ is an ECC iso (the strict `isIsoVia` invertibility, *not* the probe's reachability). Non-trivial monodromy $\iff \eta$ not an iso $\iff \gamma\notin\mathcal{P}^\circ$. So $\gamma$ is **outside $\mathcal{P}^\circ$**.

**($\Leftarrow$.)** Conversely a cycle that is pairwise-in (every edge in $\mathcal{P}^\circ$ as a 2-cycle) is, by Lemma 0, a 1-cycle of $N$; and globally-out ($\gamma\notin\mathcal{P}^\circ$) is, by T010, non-trivial round-trip monodromy. Hence it is a nerve cycle with non-trivial monodromy.

**Support of $H^1$.** By Theorem A(1), $H^1\neq 0$ iff some nerve cycle has non-trivial monodromy, i.e. (just shown) iff some pairwise-in cycle is globally-out — the globally-obstructed cells of §5. A **locally** obstructed cycle has an edge that is **not** a 1-cell of $N$ (a drop, or a non-faithful pair — not in $\mathcal{P}^\circ$ as a 2-cycle; the probe's `pairFaithful` is the corroborating screen), so it is **not a 1-cycle of $N$** at all, contributes nothing to $Z_1(N)$, and carries no class in $H^1(N;\mathcal F)$. (Equivalently: re-choosing the local section at the off-nerve vertex is a coboundary in the ambient room-graph complex, irrelevant to $N$.) Therefore $H^1$ is supported **exactly** on the global cells. ∎

> **Corollary B.1 (the headline, now a consequence).** The **Abramsky contextuality obstruction** of the Plexus claim-sheaf — pairwise-consistent local sections that do not glue — *is* **T010's iso-monodromy obstruction**: $H^1$ is non-trivial exactly on the cycles outside $\mathcal{P}^\circ$ all of whose 2-cycle edges lie in $\mathcal{P}^\circ$. C015 part (3) holds (qualitatively; the rank is Theorem A).

---

## 4. What is now proven, and the one remaining gap

**Proven (this document, pending cross-check):**

- **C015 part (1) (support)** and **part (2) (coboundary-triviality of local obstructions)** — Theorem B + its support clause.
- **C015 part (3) (identification)** — Corollary B.1.
- **The rank lemma** (Q-043(i)) — Theorem A, with gauge-independence (Lemma 1) discharging the spanning-tree-choice worry the conjecture flagged. The "$\log_2|G| = \check{C}$ech $H^1$ rank for the boolean coefficient" claim is Theorem A(2), exact for elementary-abelian-2 holonomy.

**Still open (does not block the math, blocks graduation to a *theorem*):**

- **A live witness (Q-043(iii)).** Every statement above is proven for the *abstract* local system and corroborated on the *synthetic* witness; current live `RoomFunctor` data has $G=1$ (only a local drop). C015 stays **open** until either a non-trivial class appears on real data, or the programme accepts the synthetic witness as a sufficient existence proof for the *construction* (a methodology call, not a proof gap).
- **Cross-check.** This is an author-written proof; per the [register policy](02_THEOREMS_AND_PROOFS/README.md) it needs a non-author reader before any `02_THEOREMS_AND_PROOFS/` entry. The natural graduation is **T011** (rank lemma + identification), filed *provisional* once the live-witness methodology call is made.

**Honest boundary on Theorem A(2).** Exactness of $\operatorname{rank}=\log_2|G|$ is **conditional on elementary-abelian-2 holonomy**. This is the generic case for the binary drift-iso/twist obstructions the platform produces (a claim either returns to itself or to one inter-derivable alternative — an involution), but a deliberation with a genuine *cyclic-3* claim-permutation around a loop would give $G\supseteq\mathbb Z/3$, non-e.a.2, where the construction correctly downgrades to a lower bound. Characterizing when the Plexus produces non-involution holonomy is a clean follow-up (it cannot on the current binary-witness corpus).

---

## 5. Relationship to the program

- **T010 is load-bearing twice:** it defines $\mathcal{P}^\circ$ (so the nerve's 1-cells are well-defined — the "coherence first" gate) and it supplies the iso-monodromy characterization Theorem B's ($\Rightarrow$,globally-out) and ($\Leftarrow$) reduce to. Without T010, Theorem B is not even statable.
- **Direction 2 boundary, now a theorem clause.** Theorem B's support clause *is* the formal local-vs-global division of labour: locally-obstructed = off-nerve = has a locus (Direction 2 / [T008](02_THEOREMS_AND_PROOFS/T008-minimal-separating-context-daimon-closed.md)); globally-obstructed = nerve cycle with non-trivial monodromy = the $H^1$ class with no local locus.
- **B-abelian (parked) is the quantitative companion.** Theorem A is the *boolean* rank. The $\mathbb R$-valued (log-odds, magnitude) $H^1$ remains gated behind the per-edge-weight **meaning** decision (Q-042 quantitative offshoot) — and Theorem A's e.a.2 restriction is exactly where the abelian-magnitude story would refine the boolean one.

---

## Cross-check notes

**Verdict (2026-06-08): NOT signed off — one BLOCKING defect (D1) + three non-blocking clarifications.** Acted as an independent non-author second reader per [`C015-verification-prompt.md`](C015-verification-prompt.md), re-deriving against the ECC source ([`lib/argumentation/ecc.ts`](../lib/argumentation/ecc.ts)), the probe ([`scripts/plexus-topology-probe.ts`](../scripts/plexus-topology-probe.ts)), and [T010](02_THEOREMS_AND_PROOFS/T010-plexus-coherence-pseudofunctor.md) (incl. its cross-check clarification 1), rather than this proof's own summaries. **The architecture is sound and the empirical corroboration is exact** (re-run below), but **Lemma 0 grounds its fiber and its edge-bijection on the assumption-ignoring `interDerivable` proxy rather than the abstract ECC iso (`isIsoVia`)** — precisely the §0/§1 failure mode the prompt names as blocking (the T007-leastness analogue). The proof does **not** graduate as **T011** until D1 is repaired; once it is, the math (Theorems A, B, Lemma 1) stands as written and a re-check should clear it. The live-witness rider (Q-043(iii)) stays open regardless (a methodology call, not a proof gap).

**What holds (re-derived, not trusted).**

- **Lemma 1 (gauge-independence) — could not break.** On the triangle-with-twist witness ($F^\circ=\{p,q\}$, $\tau_{ab}=\tau_{bc}=\mathrm{id}$, $\tau_{ca}=(p\,q)$, $\beta_1=1$) I computed the holonomy for two distinct spanning trees by hand: $T_1=\{ab,bc\}$ gives $\sigma=(p\,q)$; $T_2=\{ab,ca\}$ gives $t_c=(p\,q)$ and $\sigma=(p\,q)$ — **the same group $\langle(p\,q)\rangle\cong\mathbb Z/2$, $|G|=2$**, not a different order. A basepoint change conjugates the representation. The classical free-$\pi_1$-on-fundamental-cycles + tree/basepoint-change-is-conjugation argument is correct, and it survives the partial-bijection (claims-that-drop) refinement (the action is on the surviving sub-fiber $F_{r_0}^\circ$). ✔
- **Theorem A(2) — no exactness smuggling.** The factoring $\pi_1(N)\twoheadrightarrow H_1(N;\mathbb F_2)\cong\mathbb F_2^{\beta_1}\xrightarrow{\bar\rho}G$ is valid for e.a.2 $G$ (free source ⇒ any hom to an abelian 2-torsion target factors through the mod-2 abelianization; graph ⇒ $H^{\ge 2}=0$ ⇒ the class is faithfully $\bar\rho\in H^1(N;G)$); rank–nullity on the surjection gives $\log_2|G|=\beta_1-\dim\ker\bar\rho$ exactly. Exactness is asserted **only** for e.a.2, and **(3)** correctly downgrades non-involution / non-abelian $G$ to the lower bound $\lfloor\log_2|G|\rfloor$ with `elementaryAbelian2=false` (`computeH1RankBasis`: `rank = Math.floor(Math.log2(groupOrder))`). A hypothetical cyclic-3 holonomy would **not** be claimed exact. ✔ (Failure-mode 2 does not occur.)
- **Theorem B + Corollary B.1 — the reduction to T010 is exact.** ($\Rightarrow$,globally-out) and ($\Leftarrow$) invoke T010(2) ("$\gamma\in\mathcal{P}^\circ$ iff its round-trip $\eta$ is an ECC iso") without re-assuming the conclusion; the support clause's coboundary-triviality (a locally-obstructed edge is not a 1-cell of $N$ ⇒ not in $Z_1(N)$ ⇒ no $H^1$ class) matches the `cech` `offNerveLoops` accounting; B.1 is a genuine consequence of B + A(1), not an independent assertion. ✔ (These directions inherit the D1 proxy issue only through the *definition* of the nerve's 1-cells — fixed by the same repair.)

**Corroboration (re-run, evidence only).** `npx tsx --env-file=.env scripts/plexus-topology-probe.ts seed-cech` → $\beta_1=1$, $|G|=2$, **`elementaryAbelian2 = YES`, rank $=1$** ($G\cong\mathbb Z/2$, the $p\leftrightarrow q$ swap), 6 trivial nerve loops, **1** off-nerve local drop contributing **0**, 1 distinct non-trivial 1-cycle. `… cech` on cleaned/live data → $|G|=1$, **rank $=0$**, $\beta_1=0$, the lone organic off-nerve drop again contributing 0. `… drift` → the seeded genuinely two-way-derivable $p\leftrightarrow p'$ lands **`DRIFT-ISO`, in $\mathcal{P}^\circ$**, while a live `dropped` cycle is correctly outside — and the probe prints its own "necessary-not-sufficient proxy for `isIsoVia`" caveat (the very point of D1). All probe data cleaned up afterward. The numbers match the proof's claims exactly. **Tests are evidence, not proof** (register policy): they corroborate the construction but cannot discharge D1, which is about the *abstract* foundation.

### Blocking defect

**D1 (BLOCKING — Lemma 0's fiber and edge-bijection rest on the assumption-ignoring proxy, not the abstract ECC iso).**

*Location.* §0.1 (the fiber definition, "the quotient of $r$'s claims by the H2 inter-derivability equivalence `interDerivable(r, ·, ·)`"); Lemma 0's proof, §0.1 (the two parentheticals "compatibility is exactly closure under the iso-equivalence — the H2 `pairFaithful` check" and "the 2-cycle returns to an inter-derivable claim — `pairFaithful` ⟺ `interDerivable(r, x, back)`"); and §0's $E(N)$ definition ("returns the tracked claim to an **ECC-inter-derivable** claim … the pair is in $\mathcal{P}^\circ$ as a 2-cycle, T010 / H2 oracle"), which conflates the two notions.

*Why it fails (re-derived, not summarized).* T010's $\mathcal{P}^\circ$ is defined by the **strict** ECC iso — `isIsoVia(fwd,back) = isIdentityArrow(compose(back,fwd)) ∧ isIdentityArrow(compose(fwd,back))`, where `isIdentityArrow` requires **equal endpoints, one derivation, and an empty (net) assumption union**. T010's own cross-check **clarification 1** establishes that the probe's `interDerivable = reach(r,a,b) ∧ reach(r,b,a)` is two-way premise→conclusion reachability that **ignores assumptions**, hence is **necessary but not sufficient** for `isIsoVia` (it can over-count $\mathcal{P}^\circ$ when the two-way derivations carry net assumptions). This proof, however, (a) *defines the fiber $F_r^\circ$ itself* as the iso-classes of `interDerivable`, and (b) asserts the **false biconditional** `pairFaithful ⟺ interDerivable(r, x, back)` as the justification that the back-edge round trip is the identity on $F_r^\circ$. It never names `isIsoVia` (the string does not appear in the document); the "abstract local system" of §4 is the `interDerivable` one. Under the literal proxy reading, two claims that are two-way reachable but whose round-trip 2-cell carries net assumptions are wrongly **identified** in $F_r^\circ$ while **not** a genuine ECC iso — so $\tau_{rs}$ need not be a well-defined bijection of *true* iso-classes, the round-trip need not be the identity in the strict quotient, and the local system is **not provably flat**. Theorems A and B then rest on the proxy, not on `isIsoVia`. This is the exact §0/§1 risk the prompt flags as blocking ("If Lemma 0's bijection is established only via the assumption-ignoring proxy, the local system is not flat and Theorems A/B rest on sand").

*Empirical note.* The probe cannot exhibit a counterexample on the current corpus (its witnesses are single-derivation, assumption-free, so `interDerivable` and `isIsoVia` happen to agree — `seed-cech`/`drift` above), which is exactly why this is a *foundational* defect about the stated generality, not something the tests can catch. The agreement on the corpus is an accident the abstract claim may not lean on.

*Minimal repair.* Re-base Lemma 0 on the **abstract** ECC iso, demoting the probe to corroboration:

1. Define $F_r^\circ$ as iso-classes under the **strict** ECC-iso equivalence — $x\sim_r x'$ iff there is an ECC arrow $x\to x'$ with `isIsoVia` inverse (round-trip composes to an assumption-free identity in `ECC/≈`), **not** `interDerivable`. (This is still an equivalence: reflexivity from the identity arrow; symmetry from the inverse; transitivity because a composite of two assumption-free identities is an assumption-free identity in `ECC/≈`.)
2. Define $E(N)$'s edge condition as the **strict** T010 $\mathcal{P}^\circ$-as-a-2-cycle condition (the back-edge round-trip 2-cell $\eta$ is `isIsoVia`-invertible), and derive the descent + round-trip-identity from *that* (it is immediate: $\eta=\mathrm{id}$ in `ECC/≈` makes $\bar\varphi_{sr}\circ\bar\varphi_{rs}=\mathrm{id}_{F_r^\circ}$).
3. Replace every `pairFaithful ⟺ interDerivable` / "compatibility is exactly … the `pairFaithful` check" with "$\Longleftarrow$ / corroborated by `pairFaithful` (a necessary screening; see T010 clarification 1)". State explicitly that `interDerivable`/`pairFaithful` are a *necessary-not-sufficient* instrument, per T010, so the probe's runs are evidence and the proof rests on `isIsoVia`.

With this repair the bijection follows from the strict $\mathcal{P}^\circ$-2-cycle condition, the local system is flat, and Lemma 1 / Theorems A, B (which only use the abstract bijection and the T010 characterization) carry through **unchanged**. After it lands, a re-check can sign off and file **T011**.

### Non-blocking clarifications (fold in with the D1 repair)

1. **§0.1 "ECC-iso-classes" vs the proxy.** Once the fiber is re-based per D1, say plainly that the fiber is the quotient by the **`isIsoVia` equivalence**, and that the equivalence axioms hold for *that* relation (as above) — not merely for two-way reachability.
2. **Theorem B ($\Rightarrow$, pairwise-in) inherits D1.** "Every edge of $\gamma$ is a 1-cell of $N$" $=$ "every consecutive pair is in $\mathcal{P}^\circ$ as a 2-cycle" is only as strict as the $E(N)$ definition; the D1 repair (strict $\mathcal{P}^\circ$-2-cycle) is what makes this verbatim rather than proxy-level. No separate work.
3. **Keep the honest e.a.2 boundary and the live-witness rider exactly as written.** §4's "Honest boundary on Theorem A(2)" (exactness conditional on e.a.2) and the Q-043(iii) live-witness gap are correct and should remain; T011, once filed, is a theorem *about the construction* with the live-observation rider explicit (current live data has $G=1$). Do **not** claim a live class.

Per the T008/T010 cross-check pattern, I have not created a `02_THEOREMS_AND_PROOFS/` entry and have changed no `status` lines: the proof has **not** passed cross-check (D1 is blocking). The registry ([Q-043](01_OPEN_QUESTIONS_REGISTRY.md#q-043)) and conjecture ([C015](03_CONJECTURES/C015-possibilistic-cohomology-iso-monodromy.md)) status lines stay as "pending cross-check"; the author follow-up is the D1 repair, then re-submission.

### Author response — D1 repair applied (2026-06-08)

The minimal repair (the reader's 3 steps + 3 non-blocking clarifications) has been applied to the proof above:

1. **Fiber re-based on the strict iso.** §0.1 now defines $F_r$ as the quotient by the **`isIsoVia` strict-ECC-iso equivalence** ($x\approx_r x'$ iff ECC arrows round-trip to an *assumption-free* identity in `ECC/≈`), with the equivalence axioms re-derived for *that* relation, and an explicit statement that it **refines** the `interDerivable` partition (the probe over-merges, hence over-counts).
2. **$E(N)$ edge condition re-based on the strict $\mathcal{P}^\circ$-2-cycle.** §0 now states the edge condition as the back-edge round-trip being `isIsoVia`-invertible (T010 $\mathcal{P}^\circ$-membership), and Lemma 0's proof derives descent + round-trip-identity from **T010's strict-1-functor lemma** (transport preserves assumption-free round-trips) — never from `interDerivable`.
3. **Probe demoted to corroboration.** A **Definitional convention** block (§0) and a **Why the repair is sound** block (after Lemma 0) state explicitly that `interDerivable`/`pairFaithful` are a *necessary-not-sufficient* instrument (per T010 clarification 1) — over-approximating $E(N)$ and the fiber — so the `cech` runs are *evidence*, and the theorems rest on `isIsoVia`. On the binary witnesses (synthetic + realistic) the round-trips carry no net assumptions, so probe and strict relation coincide and the reported ranks are exact *there*.
4. **Theorem B ($\Rightarrow$, globally-out)** now reads "strict-ECC-iso / `isIsoVia`-invertible" explicitly; the pairwise-in direction inherits the strict $E(N)$ definition (clarification 2). The **e.a.2 boundary** and the **Q-043(iii) live-witness rider** are left exactly as written (clarification 3) — no live class is claimed.

The string `isIsoVia` now appears in the document (it did not before — the reader's key diagnostic). Theorems A, B and Lemma 1 are **unchanged** in content: they only ever referenced $\tau_{rs}/F^\circ$, now defined strictly. **Status:** awaiting a **re-check of the repair** before filing T011; C015 and Q-043 status lines updated to "D1 repaired, pending re-check" (not "established").

### Re-check verdict (2026-06-08) — D1 RESOLVED, **SIGN-OFF** → graduates as [T011](02_THEOREMS_AND_PROOFS/T011-possibilistic-cohomology-iso-monodromy.md)

Acted again as the independent non-author second reader, re-deriving the repaired §0/§0.1/Lemma 0 against the ECC source and T010 (not the author's summary). **D1 is closed; no new defect; the proof clears the mathematics (Q-043 (i)+(ii)).** Filed as **T011** (`status: established`), a theorem *about the construction*, with the Q-043(iii) live-witness rider explicit.

**Why the repair genuinely closes D1 (re-derived, not trusted).** The bijection $\tau_{rs}$ of Lemma 0 now rests on exactly two ingredients, neither of which is the proxy:

1. **The strict edge condition.** §0's $E(N)$ and the Definitional-convention block define a 1-cell by the back-edge round-trip being **`isIsoVia`-invertible** (a two-way `compose` to an *assumption-free* identity in `ECC/≈`) — i.e. T010 $\mathcal{P}^\circ$-membership as a 2-cycle. The round-trip-is-identity-on-$F_r^\circ$ step reads this verbatim, not `pairFaithful`/`interDerivable`.
2. **T010's strict-1-functor lemma (L1).** The descent "$x\approx_r x' \Rightarrow \varphi_{rs}(x)\approx_s\varphi_{rs}(x')$" is now: `transport` carries the iso-witnesses of $x\approx_r x'$ to room-$s$ arrows, and because `transport` is a strict 1-functor on `ECC/≈` (L1, established) that **adds no assumptions** (verified in [`lib/argumentation/ecc.ts`](../lib/argumentation/ecc.ts): `transport` copies the assumption map verbatim), it sends an assumption-free round-trip identity to an assumption-free round-trip identity. I re-checked the three sub-claims independently: (a) the strict relation $\approx_r$ is a genuine equivalence — transitivity holds because in `ECC/≈` `compose` is strictly associative/unital (L1), so a composite of two assumption-free round-trips reduces (via the unit law `compose(id,a)\approx a`) to an assumption-free round-trip; (b) descent via L1 as above; (c) round-trip identity from the strict $E(N)$ condition. None of (a)–(c) uses `interDerivable`.

**The probe demotion is honest throughout.** Every surviving `interDerivable`/`pairFaithful` mention in the proof body is now either in the Definitional-convention / "Why the repair is sound" blocks (explicitly *corroboration only, over-approximating $E(N)$ and the fiber*) or the descriptive Theorem-B support clause (the probe's local-obstruction screen, non-load-bearing). The proof states plainly that the strict relation **refines** `interDerivable` (the probe over-merges/over-counts), that the `cech` numbers are an **upper-bound** corroboration, and that probe and strict relation **coincide only on the assumption-free binary witnesses** — so the exact synthetic rank is honestly scoped. §5.3's earlier concern ("nowhere assert the probe is exact") is now satisfied.

**§2–§6 spot-re-confirmed against the edited text.** Lemma 1 (gauge-independence), Theorem A (e.a.2 exactness + honest lower-bound downgrade, no smuggling), Theorem B (both directions reduce to T010; globally-out now says `isIsoVia` explicitly), the support/coboundary-triviality clause, and Corollary B.1 are unchanged in content and still hold over the now-strict $F^\circ/\tau_{rs}$. Corroboration re-run identical: `seed-cech` → $\beta_1=1$, $|G|=2$, `elementaryAbelian2=YES`, **rank 1**, off-nerve local drop → 0; live `cech` → $|G|=1$, **rank 0**; probe data cleaned up. Tests remain *evidence*, not proof.

**Two non-blocking notes (do not gate T011; author follow-up).**
1. Theorem B's support clause still names "`pairFaithful` fails" when describing a locally-obstructed edge. It is descriptive of the probe's screen and non-load-bearing, but for full consistency with the demotion it could read "a non-faithful pair (not in $\mathcal{P}^\circ$ as a 2-cycle; the probe's `pairFaithful` is the corroborating screen)".
2. The exactness of the `cech` rank on the *realistic* (`seed-real`) witness rests on its round-trips being assumption-free (single-derivation). Worth a one-line assertion in the construction notes that `seed-real` carries no net round-trip assumptions, so it too lands in the probe∩strict agreement region.

Per the T008/T010 sign-off pattern, the T011 entry is created and the proof's + registry/conjecture status lines are advanced to "established / closed (i)+(ii)"; the Q-043(iii) live-witness rider stays open with a back-pointer.
